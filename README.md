# VeganFlemme — MVP (FR)

**VeganFlemme** est une web‑app « flemme‑friendly » d’accompagnement vers une alimentation végane pour le marché français. Elle génère des **menus personnalisés** (7 jours), vérifie **macro + micro‑nutriments**, corrige automatiquement (ajouts/substitutions), et exporte **liste de courses + PDF recettes**.

- **Public cible** : flexitariens FR « pas le temps/pas envie », recherche de simplicité et de garanties nutritionnelles.
- **Différenciation** : solveur nutritionnel **multi‑objectif** + **bases FR (CIQUAL)** + produits réels **OpenFoodFacts** + **Spoonacular** pour élargir le pool de recettes (sans stocker durablement leurs données).
- **Statut** : MVP 0.1 (déploiement Vercel + Railway + Supabase).

## Fonctionnalités clés
- Menu 7 jours prêt dès l’arrivée
- Panneau d’affinage (temps, budget, objectifs, allergies, préférences)
- Dashboard nutrition (calories, protéines, lipides, glucides, fibres + **B12, D, fer, calcium, iode, zinc, sélénium, ALA**)
- Corrections en 1 clic (ajout snack, swap tofu↔tempeh, etc.)
- Export **PDF + Liste de courses**

## Stack
- **Front** : Next.js (App Router), TypeScript, Tailwind
- **Back** : API routes Next.js + microservice **FastAPI** (Python) pour l’optimisation (PuLP/OR‑Tools)
- **DB** : Postgres (**Supabase**)
- **Données** : **CIQUAL** (composition FR), **OpenFoodFacts** (produits), **Spoonacular** (recettes)
- **IA (option)** : OpenAI GPT‑5 pour substitutions pédagogiques + explications
- **Hébergement** : **Vercel** (web), **Railway** (solver), **Supabase** (DB)

## Roadmap (décidée)
### Semaine 1
- Créer compte GitHub, Vercel, Supabase, Railway
- Créer dépôt `veganflemme`
- Déployer front Next.js (template Vercel Starter)
- Créer projet Supabase + table `plans`

### Semaine 2
- Déployer **solver** FastAPI sur Railway (template)
- Renseigner `SOLVER_URL` dans Vercel
- Importer **CIQUAL** (CSV) dans schéma `ciqual`

### Semaine 3
- Créer schéma **fédéré** : `vf` (proprio), `ciqual` (ouvert), `off_link`
- Remplir `vf.canonical_ingredient` (premiers ingrédients), lier à CIQUAL
- Créer vues matérialisées `mv_recipe_nutrients`

### Semaine 4
- Brancher **Spoonacular** + **OFF**
- Endpoint `/api/plan/generate` → appel solver
- UI de base (panneaux + cartes jour)

### Semaine 5
- Dashboard nutrition + jauges + alertes
- Export **PDF + liste de courses**
- Pédagogie micro (pop‑ups)

### Semaine 6
- Tests utilisateurs (5–10), correctifs
- Analytics (Plausible), page **mentions + disclaimer santé**

## Variables d’environnement (Vercel → Project → Settings → Environment Variables)
- `DATABASE_URL` : chaîne Postgres (Supabase)
- `SPOONACULAR_KEY` : clé API Spoonacular
- `OFF_BASE` : `https://world.openfoodfacts.org`
- `SOLVER_URL` : URL publique Railway du solver FastAPI
- (Option) `OPENAI_API_KEY`, `OPENAI_MODEL=gpt-5`

## Déploiement
- **Web** : Vercel (import GitHub → build auto)
- **Solver** : Railway (template FastAPI → Generate Domain)
- **DB** : Supabase (Table Editor + SQL Editor)

## Santé & conformité
- Usage **éducatif** uniquement. Pour profils à risque (grossesse, pathologies, carences suspectées), consulter un professionnel.
- **OpenFoodFacts** : données sous **ODbL** — attribution & share‑alike si redistribution de base dérivée.
- **Spoonacular** : ne pas stocker durablement, cache ≤ 1 heure.

## Licence
- Code : MIT (par défaut — à ajuster si besoin)
- Données : respecter la licence de chaque source (ODbL pour OFF, conditions API Spoonacular)
