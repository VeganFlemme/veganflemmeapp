# Tutoriel (100% web UI, sans terminal)

Objectif : déployer **VeganFlemme** avec Vercel (web), Supabase (DB), Railway (solver), et coller le code depuis GitHub Web.

---

## Étape 1 — GitHub (création du dépôt)
1. Va sur https://github.com → **Sign up** ou connecte‑toi.
2. En haut à droite : **+** → **New repository**.
3. **Repository name** : `veganflemme` → **Create repository**.
4. Tu arrives sur la page du repo vide.

## Étape 2 — Vercel (déployer le front Next.js)
1. Va sur https://vercel.com → **Sign up** (avec GitHub) → autorise l’accès.
2. **New Project** → **Templates** → choisis **Next.js Starter** → **Deploy**.
3. Quand Vercel te demande où stocker : choisis **GitHub** et un **nouveau repo** `veganflemme-web` ou connecte `veganflemme` si tu préfères unique.
4. Laisse **Framework Preset = Next.js** → **Deploy**. 
5. Après build, Vercel affiche une **URL** (ex. `https://veganflemme-web.vercel.app`). Note‑la.
6. Pour les variables : Projet → **Settings** → **Environment Variables** → **Add New** (tu y reviendras à l’étape 5).

## Étape 3 — Supabase (base de données)
1. Va sur https://supabase.com → **Start your project**.
2. **New project** → choisis **Organisation**, **Nom**, **Région** → définis un **Database password** → **Create project**.
3. En haut dans le projet : **Connect** → copie la **Connection string** Postgres.
4. **Database → Table Editor** → **New table** :
   - `plans` (schema `public`)
   - Colonnes :
     - `id` UUID, **Primary key**, Default = `gen_random_uuid()`
     - `user_email` text
     - `plan_json` jsonb
     - `created_at` timestamptz, Default = `now()`
   - **Save**.
5. (Plus tard) **Import CIQUAL** : **Table Editor** → créer `ciqual.food` → **Import Data from CSV** → téléverser le CSV officiel → mapper les colonnes → **Import**.

## Étape 4 — Railway (déployer le solver FastAPI)
1. Va sur https://railway.com → **Sign up** (GitHub).
2. **New Project** → **Deploy a Template** → **FastAPI**.
3. Options par défaut → **Deploy** → statut **Deployed**.
4. Service → **Settings** → **Networking** → **Generate Domain** → copie l’**URL publique** (ex. `https://…up.railway.app`).
5. Teste `https://…/docs` (Swagger).

## Étape 5 — Clés & Variables (Vercel)
1. Vercel → projet `veganflemme-web` → **Settings** → **Environment Variables** → **Add New** pour chaque variable :
   - `DATABASE_URL` : chaîne Supabase
   - `SPOONACULAR_KEY` : clé (https://spoonacular.com/food-api → *Get a Free API Key*)
   - `OFF_BASE` : `https://world.openfoodfacts.org`
   - `SOLVER_URL` : URL Railway
   - (Option) `OPENAI_API_KEY` et `OPENAI_MODEL` = `gpt-5`
2. **Save** à chaque ajout. 
3. Vercel redéploie automatiquement.

## Étape 6 — Ajouter le code (via GitHub Web)
1. GitHub → repo `veganflemme-web` → **Add file** → **Create new file**.
2. Crée `app/api/plan/generate/route.ts` → colle le code (voir FullProjectDescription.md) → **Commit**.
3. Crée `lib/off.ts` et `lib/spoon.ts` → colle le code → **Commit**.
4. Crée `app/(app)/page.tsx` → colle le squelette UI → **Commit**.
5. (Option) `app/api/export/pdf/route.ts` pour le PDF.
6. Vercel → **Deployments** → ouvre le dernier déploiement.

## Étape 7 — Tests rapides
- Ouvre l’URL Vercel : la page s’affiche avec un **plan** (ou un bouton « Générer »).
- Remplace une recette → le **dashboard** se met à jour.
- Clique **Exporter PDF** → téléchargement d’un fichier.
- Supabase → **Table Editor → plans** : vérifie qu’une **ligne** a été créée.
- Railway → **/docs** : l’endpoint `/solve` est listé (status 200).

## Étape 8 — (Option) Analytics & tâches planifiées
- **Plausible** : ajoute le snippet (ou proxy) dans Next.js.
- **Inngest** : ajoute une fonction cron “générer semaine” (docs et starter Next.js).

---

## FAQ
- **Spoonacular** : pas de stockage durable de leurs données (cache ≤ 1 h).
- **OFF** : attribution + share-alike si redistribution d’une base dérivée. Sinon, appel API à la volée.
- **Santé** : application éducative — pas un dispositif médical.
