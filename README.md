VeganFlemme
La web-app flemme-friendly pour réussir la transition végane en France.
Prod : Front (Next.js) sur Vercel · Solveur (FastAPI + OR-Tools) sur Railway · DB (Postgres) sur Supabase.
Données : CIQUAL (standard) + CALNUT (backfill) + OpenFoodFacts (références produit) + Spoonacular (pool recettes, pas de stockage durable).
1) Statut MVP
OK : génération d’un plan 7 jours, appel solveur, affichage, enregistrement dans public.plans.
OK Supabase : schémas ciqual, ciqual_calnut, vf, off_link ; vues food_norm, food_best, vegan_candidates ; tables vf.* peuplées (ingrédients + nutriments) ; RPC vf.search_ingredient.
À faire : Dashboard nutrition, Export PDF v2 + liste de courses, OFF autocomplete, import CIQUAL→recettes internes, pédagogie.
2) Architecture
repo/
├─ web/           # Next.js 14 (App Router), TypeScript, Tailwind
│  └─ app/api/... # /plan/generate, /plan/save, /export/pdf, /health
├─ solver/        # FastAPI + OR-Tools (/health, /solve)
└─ db/            # SQL & docs (schémas, vues, mv)
Données
ciqual.raw_food → vue ciqual.food_norm (parsing robuste)
ciqual_calnut.raw_food → vue ciqual_calnut.food_norm
Fusion ciqual.food_best (priorité CIQUAL, CALNUT en backfill, prudence B12/D)
Candidats véganes ciqual.vegan_candidates
Référentiel interne vf.* (ingrédients canoniques, nutriments 100 g, recettes, agrégats)
3) Variables d’environnement (Vercel)
SOLVER_URL = https://<ton-solver>.up.railway.app (sans / final)
SPOONACULAR_KEY = clé API
DATABASE_URL = chaîne Supabase (pooler 6543, SSL require)
OFF_BASE = https://world.openfoodfacts.org
(option) NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY (si auth UI)
(option) OPENAI_API_KEY, OPENAI_MODEL=gpt-5
Health : GET /api/health (front), GET /health (solver).
4) Contrats & flux
/api/plan/generate → récupère 24 recettes vegan (Spoonacular) → map nutriments → /solve (Railway) → renvoie plan.
/api/plan/save → INSERT public.plans (user_email?, plan_json) (email nullable).
UI : Affiner → Générer → Enregistrer → (bientôt) Export PDF + Liste de courses.
OFF : recherche produit côté client (affichage), barcode stocké (si besoin) dans off_link.product_ref.
CIQUAL/CALNUT : source unique pour nutriments alimentaires, via vf.ingredient_nutrients.
5) Tests de recette (runbook)
Vercel : /api/health → {ok:true}
Railway : /health → {ok:true}, /docs → dispo
Supabase :
select count(*) from ciqual.food_norm; (> 3000)
select count(*) from ciqual_calnut.food_norm; (> 3000)
select count(*) from ciqual.food_best; (> 3000)
select count(*) from vf.canonical_ingredient; (> 2000)
select count(*) from vf.ingredient_nutrients; (= nb ingrédients)
Front : bouton Générer → plan OK, bouton Enregistrer → ligne dans public.plans.
6) Roadmap (itérations Copilot)
R1 — Robustesse & UX
Fallback local si Spoonacular rate/quota.
Dashboard nutrition v1 (barres macros + B12/D/Ca/Fe/Zn/I/Se/ALA, seuil ±15%).
Export PDF v2 + liste de courses consolidée.
Styles Tailwind + Lighthouse ≥ 90.
R2 — Données FR
Import recettes internes (CIQUAL) : vf.recipe + vf.recipe_ingredient + refresh mv.
OFF autocomplete + mapping off_link.product_ref (barcode only).
Graphe substitutions (tofu/tempeh/pois chiches).
R3 — Personnalisation
TDEE (Mifflin-St Jeor) + cibles dynamiques.
Pédagogie micro (infobulles B12/D/iode/fer).
Auth Supabase (magic link) + RLS (plans par user).
R4 — Monétisation
Liste de courses → paniers affiliés FR (deep-links).
Onboarding 3 questions → plan initial.
7) Règles de données & licences
CIQUAL/CALNUT : citer ANSES ; CALNUT utilisé en backfill (valeurs imputées).
OpenFoodFacts : ODbL — attribution ; si base dérivée publique → share-alike.
Spoonacular : pas de stockage durable (cache court), recalcul CIQUAL pour recette internalisée.
Santé : appli éducative — ne remplace pas un avis médical.
8) Pour Copilot/Agents — tâches prêtes (PR unitaires)
feat: fallback local dans /api/plan/generate (fonctionne sans clé).
feat: NutritionDashboard.tsx (aggregates par jour + jauges ±15%).
feat: export/pdf v2 + shoppingList.ts.
feat: OFF autocomplete lib/off.ts + champ “remplacer par produit OFF” (enregistrer barcode).
feat: recettes internes CIQUAL + refresh materialized view.
chore: styles Tailwind, Lighthouse ≥ 90.
docs: mentions légales + Plausible.
