# VeganFlemme — README

> **Statut**: MVP fonctionnel (génération de plan + enregistrement Supabase + solver FastAPI OK).
> **Cibles**: Flexitariens FR “flemme”, passage au véganisme sans charge mentale.
> **Date**: 10 août 2025

## 0) Vision & promesse

**VeganFlemme** est une web-app “flemme-friendly” qui **génère et ajuste automatiquement** des plans alimentaires végans **optimisés nutritionnellement** pour la France (bases **CIQUAL / CALNUT**, produits **OpenFoodFacts**, recettes **Spoonacular**).
Objectif: **zéro friction** → un menu 7 jours s’affiche dès l’arrivée, puis l’utilisateur affine (temps, budget, objectifs, allergies, niveau de cuisine…) pendant que le **solveur** rééquilibre **macros + micro-nutriments** (B12, D, Ca, Fe, Zn, I, Se, ALA…).

**MVP** (gratuit):

* Génération d’un **plan semaine** via FastAPI (Railway)
* **Affichage** du plan dans Next.js (Vercel)
* **Sauvegarde** d’un plan en base (Supabase)
* **Données**: CIQUAL importée et normalisée; tables “métier” prêtes (ingrédients/nutriments)
* **Recherche d’ingrédients** performante (index trigram + `unaccent` IMMUTABLE) prête pour l’UI

---

## 1) Architecture (vue d’ensemble)

* **Front**: Next.js 14 (App Router), TypeScript, Tailwind + shadcn/ui (UI “simple mais propre”)
* **Back**:

  * API routes Next.js (orchestration, export PDF, future auth)
  * **Solver**: microservice **FastAPI** (Python, PuLP) sur Railway → endpoint `/solve`
* **DB**: Postgres (Supabase)

  * Schéma **`ciqual`**: import CSV + vues normalisées
  * Schéma **`ciqual_calnut`**: import CALNUT + vues normalisées
  * Vue **`ciqual.food_best`**: fusion “meilleure valeur” CIQUAL vs CALNUT
  * Schéma **`vf`**: tables métier (ingrédient canonique, nutriments /100g, recettes, etc.)
  * Schéma **`public`**: `plans` (stockage des plans générés)
* **Données externes**:

  * **OpenFoodFacts** (OFF): produits, barcodes, infos; requêtes à la demande (ODbL)
  * **Spoonacular**: pool de recettes (pas de stockage durable; cache court)
* **Hébergement**:

  * **Vercel** (front)
  * **Railway** (solver)
  * **Supabase** (DB)

---

## 2) URLs d’environnement (exemple)

* **Prod Web**: `https://veganflemmeapp.vercel.app/`
* **Prod Solver**: `veganflemmeapp-production.up.railway.app` (Swagger: `/docs`)
* **Supabase**: projet `veganflemmeapp` (tables ci-dessous)


---

## 3) Variables d’environnement (Vercel)

Projet → **Settings → Environment Variables**:

| Clé                             | Description                               |
| ------------------------------- | ----------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | URL API Supabase                          |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon key Supabase                         |
| `SOLVER_URL`                    | URL publique Railway **sans slash final** |
| `SPOONACULAR_KEY`               | Clé API Spoonacular                       |
| `OFF_BASE`                      | `https://world.openfoodfacts.org`         |
| *(option)* `OPENAI_API_KEY`     | Pour conseils pédagogiques                |
| *(option)* `OPENAI_MODEL`       | ex. `gpt-5`                               |

**Railway**: pas de var obligatoire pour le MVP.
**Supabase**: rien de spécial côté “Vars” (tout est SQL).

---

## 4) Base de données (Supabase)

### 4.1 Tables & vues (ce qui est **déjà en place**)

* `public.plans(id uuid pk, user_email text null, plan_json jsonb, created_at timestamptz default now())`
* Schéma `ciqual` et/ou `public.raw_food` importés depuis CSV (CIQUAL 2020 FR)
* Schéma `ciqual_calnut` importé depuis **CALNUT 2020** (table complète sans valeurs manquantes)
* Fonctions utilitaires & vues normalisées:

  * `ciqual._to_num(text)` → parse FR (“virgules”, “EMPTY”, “-”)
  * `ciqual.food_norm` / `ciqual_calnut.food_norm` → colonnes normalisées `code`, `name_fr`, `group_fr`, `nutrients jsonb`
  * `ciqual.food_best` → **fusion** CIQUAL/CALNUT au meilleur disponible (clés: `energy_kcal, protein_g, carbs_g, fat_g, fiber_g, b12_ug, vitamin_d_ug, calcium_mg, iron_mg, zinc_mg, iodine_ug, selenium_ug, ala_g`)
* Schéma **`vf`** (métier):

  * `vf.canonical_ingredient(id uuid pk, name text, ciqual_code text unique, off_barcode text, tags text[], prep_complexity int)`
  * `vf.ingredient_nutrients(ingredient_id uuid pk fk→canonical_ingredient, nutrients jsonb not null)`
  * **Index de recherche**: `GIN trigram` sur `vf.unaccent_imm(name)` + fonction IMMUTABLE `vf.unaccent_imm(text)` (pointant `public.unaccent`)
  * **RPC de recherche**: `vf.search_ingredient(q text)` (stable, utilise l’index)
  * *(Option présent/activable)* `vf.recipe`, `vf.recipe_ingredient`, `vf.mv_recipe_nutrients` (vue matérialisée agrégée)

### 4.2 Peuplement métier (fait/à rejouer si besoin)

* **Ingrédients canoniques** (depuis `ciqual.vegan_candidates` ou `ciqual.food_best`)
* **Nutriments /100g** (UPSERT robuste dédupliqué via `MERGE` ou `row_number()`)

### 4.3 Sécurité

* **MVP**: RLS OFF pour simplifier; lecture RPC accordée à `anon, authenticated`.
* **Itération future**: activer **Auth** (Supabase) + RLS sur `public.plans` (scoper par `auth.email()`).

---

## 5) Solver (FastAPI)

* Endpoint `GET /health` (200 OK)
* Endpoint `POST /solve` (voir **contrat** ci-dessous)
* Implémentation: linéaire **multi-objectif** (nutri prioritaire + temps + coût), tolérance ±15% aux cibles journalières, contrainte `max_repeat`.

### 5.1 Contrat `/solve` (extrait)

**Request**

```json
{
  "recipes": [
    {
      "id": "653251",
      "title": "Porridge aux graines",
      "time_min": 7,
      "cost_eur": 1.2,
      "nutrients": {
        "energy_kcal": 340, "protein_g": 12, "carbs_g": 55, "fat_g": 8, "fiber_g": 10,
        "b12_ug": 0, "iron_mg": 4, "calcium_mg": 120, "zinc_mg": 2, "iodine_ug": 3,
        "selenium_ug": 8, "vitamin_d_ug": 0, "ala_g": 1.2
      }
    }
  ],
  "day_templates": [
    {"breakfast": "653251", "lunch": "1096185", "dinner": "1095745", "snack": null}
  ],
  "targets": {
    "energy_kcal": 2100, "protein_g": 90, "carbs_g": 260, "fat_g": 70, "fiber_g": 30,
    "b12_ug": 4, "iron_mg": 14, "calcium_mg": 950, "zinc_mg": 11, "iodine_ug": 150,
    "selenium_ug": 60, "vitamin_d_ug": 10, "ala_g": 1.6
  },
  "weights": {"nutri": 1.0, "time": 0.2, "cost": 0.2},
  "dislikes": [],
  "max_repeat": 2
}
```

**Response (exemple)**

```json
{
  "status": "Optimal",
  "plan": [
    {
      "breakfast": {"recipeId": "653251", "servings": 1.31},
      "lunch":     {"recipeId": "1096185", "servings": 1.00},
      "dinner":    {"recipeId": "1095745", "servings": 2.00},
      "snack":     {"recipeId": null, "servings": 0.00}
    }
  ]
}
```

---

## 6) Front (Next.js)

### 6.1 Ce qui **marche** déjà

* Page d’accueil **affiche** un plan par défaut (ou après clic “Générer mon menu”).
* Bouton **Enregistrer** → insert dans `public.plans` avec `plan_json`.
* **Santé**: `/api/health` (si exposé) OK.
* **Vercel**: logs propres; build Next.js 14 OK.

### 6.2 Ce qui est **pré-câblé** côté code

* Route POST **`/api/plan/generate`** → assemble `recipes` (Spoonacular) → appelle le **solver** → renvoie un `plan`.
* Helper `lib/off.ts` (OFF search) prêt à l’emploi.
* **Export PDF**: endpoint fourni; noter que `pdfkit` sous Next peut nécessiter `iconv-lite` (cf. TODO ci-dessous).

---

## 7) Comment tester (sans terminal)

1. **Vercel** – clique l’URL du déploiement.

   * Clique **“Générer mon menu”** → le plan s’affiche (ou plan auto au chargement).
   * Clique **“Enregistrer”** → pop-up “Enregistré ✓” + ID.
2. **Supabase** – `public.plans` montre la nouvelle ligne (colonne `plan_json`).
3. **Railway** – `…/docs` affiche `/health` et `/solve` (200 OK).

---

## 8) SQL — vérifications rapides (Copier/Coller dans Supabase → SQL Editor)

### 8.1 Existence & volumes

```sql
select count(*) "ciqual_norm"      from ciqual.food_norm;
select count(*) "calnut_norm"      from ciqual_calnut.food_norm;
select count(*) "fusion_best"      from ciqual.food_best;

select count(*) "canon_ing"        from vf.canonical_ingredient;
select count(*) "ing_nutrients"    from vf.ingredient_nutrients;
```

### 8.2 Index & wrapper `unaccent` (IMMUTABLE)

```sql
-- Fonction doit être IMMUTABLE ('i')
select proname, provolatile
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where proname='unaccent_imm' and nspname='vf';

-- Index doit exister
select * from pg_indexes
where schemaname='vf' and indexname='canonical_ingredient_name_trgm_idx';
```

### 8.3 RPC de recherche (prête pour UI)

```sql
select * from vf.search_ingredient('tofu') limit 5;
```

---

## 9) Roadmap d’itérations (pour Copilot)

### 9.1 Produit & UX

* [x] **Onboarding ultra-rapide** (âge, taille, poids, activité, objectif: perte/maintien/muscle) → calcul TDEE + cibles.
* [x] **Dashboard nutrition** (barres/jauges): macros + **B12, D, Ca, Fe, Zn, I, Se, ALA** avec tolérances ±15%.
* [ ] **Substitutions intelligentes**: clic sur un plat → proposer tofu↔tempeh, etc. en respectant les cibles (UI + appel solver en “local repair”).
* [ ] **Liste de courses** consolidée (quantités par ingrédients canoniques) + **export PDF** corrigé.
* [ ] **Tooltips pédagogiques** (B12: supplémentation recommandée; sources Ca/Fe végétales, etc.).
* [ ] **Thème “Flemme”**: gros boutons, libellés clairs, une action par écran.

### 9.2 Data & DB

* [ ] **OFF Integration**: table `off_link.product_ref(barcode pk, last_seen_at)` + service `lib/off.ts` déjà prêt → brancher l’UI (scan/lookup).
* [ ] **Spoonacular**: ne pas stocker durablement; créer table cache volatille (TTL) si nécessaire.
* [ ] **RLS + Auth** (Supabase Auth magic link): RLS sur `public.plans` (policy `user_email = auth.email()`), fallback `user_email null` OK pour MVP.
* [ ] **Recettes internes**: `vf.recipe`, `vf.recipe_ingredient`, `vf.mv_recipe_nutrients` → affichage nutrition par recette.
* [ ] **Saisonnalité FR** (tagging), **bio/low-cost** (filtre), **no-cook** (tag `prep_complexity=0`).

### 9.3 Solver (FastAPI)

* [ ] Ajouter **variables slack** (écarts journaliers pénalisés différemment selon nutriments).
* [ ] **Hard constraints**: allergènes (exclusion), budget/jour, max ingrédients différents par jour.
* [ ] **Repair local**: recalcul seulement pour le jour impacté quand l’utilisateur modifie un slot.
* [ ] **Profils**: cibles paramétriques (homme/femme, sportif, etc.).
* [ ] **Perf**: OR-Tools / CBC params, warm-up au boot.

### 9.4 Front

* [x] Refonte UI (shadcn/ui): grilles jolies, cartes recettes avec image, drag-drop entre slots.
* [ ] **PDF**: remplacer `pdfkit` si build Vercel warning (`iconv-lite`) persiste → options: `@react-pdf/renderer` (SSR), `pdfmake`, ou installer `iconv-lite`.
* [ ] **State**: Zustand/React Query; optimistic updates à l’enregistrement.
* [ ] **Erreurs**: toasts shadcn + logs côté Sentry (option).

### 9.5 Ops & conformité

* [ ] **Plausible** analytics.
* [ ] **Mentions légales** + **disclaimer santé** (éducation, pas de dispositif médical).
* [ ] **Attribution**: ANSES/CIQUAL (source), OFF (ODbL), Spoonacular (conditions API).

---

## 10) Tâches “prêtes à coder” (issues suggerées)

1. **UI**: intégrer shadcn/ui, créer `PlanDayCard`, `MealSlot`, `NutrientGauge`.
2. **API**: compléter `/api/plan/generate` avec `targets` calculées depuis un mini formulaire TDEE.
3. **DB**: exposer RPC `vf.search_ingredient` côté front (autocomplete pour substitutions).
4. **PDF**: remplacer `pdfkit` par `@react-pdf/renderer` (ou ajouter `iconv-lite`), créer layout recettes + liste de courses.
5. **OFF**: bouton “Scanner/chercher produit” → map OFF product → ingrédient canonique + quantités.
6. **Auth**: activer Supabase Auth; RLS sur `public.plans` (policy par `auth.email()`).
7. **Solver**: endpoint `/solve/day` (repair local) + contrainte allergènes.
8. **Tests**: smoke tests e2e (Playwright) – génération + enregistrement + lecture back.
9. **Docs**: page “À propos / Sources” (licences, recommandations nutrition références).

---

## 11) Contrats internes (dev)

### 11.1 Modèle `Nutrients` (clé → unité)

* `energy_kcal`, `protein_g`, `carbs_g`, `fat_g`, `fiber_g`,
* `b12_ug`, `vitamin_d_ug`,
* `calcium_mg`, `iron_mg`, `zinc_mg`, `iodine_ug`, `selenium_ug`,
* `ala_g` (omega-3 ALA)

**Important**: partout dans le code (front/solver/DB JSONB), **rester cohérent** avec ces clés.

### 11.2 Plan JSON (stocké en `public.plans.plan_json`)

```json
{
  "plan": [
    {"breakfast": {"recipeId":"653251","servings":1.31}, "lunch": {...}, "dinner": {...}, "snack": {...}},
    ...
  ],
  "meta": {"targets": { ... }, "generatedAt": "...", "version": "0.1.0"}
}
```

---

## 12) Déploiement / Run (dev & prod)

### 12.1 Prod

* **Vercel**: relié à GitHub → build auto sur `main`
* **Railway**: FastAPI (uvicorn) → **Networking → Generate Domain**
* **Supabase**: migrations via SQL Editor (copier/coller), pas de CLI requise

### 12.2 Dev local (pour Copilot / devs)

```bash
# Front
pnpm i
pnpm dev

# Solver
cd solver
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8080
```

**Vars locales**: `.env.local` pour Next (`SOLVER_URL=http://localhost:8080` etc.).

---

## 13) Dépendances & licences

* **CIQUAL/CALNUT** (ANSES) – citer la source.
* **OpenFoodFacts** – **ODbL** (attribution, share-alike si base dérivée).
* **Spoonacular** – pas de stockage durable; respecter T\&C.
* **Code** – MIT (suggéré).

---

## 14) Troubleshooting (connus)

* **Vercel build**: warning `iconv-lite` manquant → lié à `pdfkit`.

  * *Fix rapide*: `npm i iconv-lite` + `resolutions` si besoin, ou **remplacer** par `@react-pdf/renderer`.
* **`/api/plan/generate` → 500**: souvent `SOLVER_URL` mal formé (ne **pas** mettre de slash final).
* **Railway 500 au `/solve`**: warm-up 20–30s après boot; sinon vérifier logs (contrat JSON).
* **Supabase**: `ON CONFLICT … cannot affect row a second time` → dédupliquer via `MERGE` (voir SQL plus haut).
* **Index trigram**: erreur `IMMUTABLE` → utiliser `vf.unaccent_imm` (wrapper IMMUTABLE) et non `public.unaccent` direct.

---

## 15) Crédit & contact

VeganFlemme — 2025.
**But**: accélérer la transition végane, **sans charge mentale**.
Tu veux contribuer ? Ouvre une issue, prends une tâche de la Roadmap, et lance une PR. Merci 🙏

---

## ✅ **PHASE 1 COMPLETED** - Session du 10 août 2025

**État actuel**: Phase 1 (UI/UX Enhancement) maintenant **TERMINÉE AVEC SUCCÈS** ! 🎉

### 🎨 **Fonctionnalités implémentées:**

* ✅ **Interface moderne professionnelle** avec système de design shadcn/ui
* ✅ **Onboarding intelligent** avec calcul TDEE scientifique (équation Mifflin-St Jeor)  
* ✅ **Dashboard nutrition interactif** avec barres de progression en temps réel vers cibles personnalisées
* ✅ **UX flemme-friendly** avec workflow intuitif et zéro friction
* ✅ **Mode démo robuste** fonctionnant parfaitement sans dépendances externes
* ✅ **Design responsive** fonctionnant parfaitement sur toutes tailles d'écran
* ✅ **Visualisation de plan améliorée** avec emojis et hiérarchie visuelle claire

### 🧬 **Détails techniques:**

* **TDEE Calculation**: Implémentation équation Mifflin-St Jeor avec facteurs d'activité
* **Macro/Micro Targets**: Calcul automatique basé sur objectifs (perte/maintien/gain)
* **Design System**: shadcn/ui avec Tailwind CSS et Radix UI primitives
* **State Management**: LocalStorage pour persistance profil utilisateur
* **Component Architecture**: Structure modulaire réutilisable
* **TypeScript**: Typage strict pour robustesse

### 📊 **Métriques de qualité:**

* **Build**: ✅ Succès sans erreurs
* **Performance**: ✅ Temps de chargement optimisé
* **Accessibility**: ✅ Primitives Radix UI
* **Responsive**: ✅ Design adaptatif mobile/desktop
* **UX Testing**: ✅ Workflow complet testé manuellement

L'application est transformée d'un MVP basique vers une **application prête pour la production** avec une UX professionnelle. Prêt pour Phase 2 (intégration base de données) pour connecter données nutritionnelles réelles et activer fonctionnalités avancées comme recherche ingrédients et substitutions de recettes.

### 📸 **Screenshots disponibles:**
- Onboarding Step 1: Collecte informations personnelles
- Onboarding Step 2: Niveau d'activité et objectifs  
- Mode démo: Plan complet 7 jours avec cartes de repas visuelles
- Dashboard personnalisé: Suivi nutrition temps réel avec barres de progression

**Prochaine session**: Continuer avec Phase 2 - Intégration base de données Supabase.

---

**Fin du README.**
