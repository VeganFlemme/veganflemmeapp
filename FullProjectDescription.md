# VeganFlemme — Full Project Description (Bible)

> Référence unique pour les humains et les Agents (GitHub Copilot coding agent). Contient l’architecture, les schémas SQL, les endpoints, les algorithmes, et les snippets de code nécessaires au MVP.

## 0. Principes directeurs
- **Zéro friction** : un menu est prêt dès la page d’accueil.
- **Flemme‑friendly** : moins de choix, plus d’autocorrectifs.
- **France‑centric** : CIQUAL + OFF, métriques FR, saisonnalité locale.
- **Sécurité** : éducation, pas de promesse « zéro carence », alertes + conseils.
- **Conformité data** : OFF (ODbL, attribution/share‑alike si redistribution), Spoonacular (pas de stockage durable, cache ≤ 1 h).

## 1. Architecture
- **Front** : Next.js 14 (App Router), TypeScript, Tailwind.
- **Back** : API routes Next.js + microservice **FastAPI** (Python) pour l’optimisation (solveur LP)
- **DB** : Supabase (Postgres)
- **Data federation** :
  - `ciqual` : table composition par 100 g (import CSV)
  - `vf` (proprio) : ingrédients canoniques, recettes, nutriments calculés, graphe de substitutions
  - `off_link` : références barcodes OFF (appel à la demande)
- **Orchestration** (plus tard) : Inngest pour cron hebdo; Copilot Coding Agent pour PR automatiques.

## 2. Schémas SQL (à exécuter dans Supabase → SQL Editor)

### 2.1 Namespaces
```sql
create schema if not exists ciqual;
create schema if not exists vf;
create schema if not exists off_link;
```

### 2.2 CIQUAL
```sql
create table if not exists ciqual.food (
  code text primary key,
  name_fr text not null,
  group_fr text,
  nutrients jsonb not null
);
```

### 2.3 Référentiel nutriments & cibles
```sql
create table if not exists vf.nutrient_ref (
  key text primary key,
  label text not null,
  unit text not null,
  rnp_male numeric,
  rnp_female numeric,
  ul numeric
);
```

### 2.4 Ingrédients canoniques & nutriments
```sql
create table if not exists vf.canonical_ingredient (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  ciqual_code text,
  off_barcode text,
  tags text[] default '{}',
  prep_complexity int default 1
);

create table if not exists vf.ingredient_nutrients (
  ingredient_id uuid primary key references vf.canonical_ingredient(id) on delete cascade,
  nutrients jsonb not null
);
```

### 2.5 Recettes & ingrédients
```sql
create table if not exists vf.recipe (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  source text not null,
  external_id text,
  time_min int,
  equipment text[] default '{}',
  flags text[] default '{}'
);

create table if not exists vf.recipe_ingredient (
  recipe_id uuid references vf.recipe(id) on delete cascade,
  ingredient_id uuid references vf.canonical_ingredient(id),
  amount_g numeric not null,
  primary key (recipe_id, ingredient_id)
);
```

### 2.6 OFF refs
```sql
create table if not exists off_link.product_ref (
  barcode text primary key,
  last_seen_at timestamptz default now(),
  notes text
);
```

### 2.7 Vues matérialisées
```sql
create materialized view if not exists vf.mv_recipe_nutrients as
select
  r.id as recipe_id,
  jsonb_object_agg(nk.key, sumval.val) as nutrients
from vf.recipe r
join vf.recipe_ingredient ri on ri.recipe_id = r.id
join vf.ingredient_nutrients inut on inut.ingredient_id = ri.ingredient_id
join lateral (
  select key, (inut.nutrients->>key)::numeric * ri.amount_g / 100.0 as val
  from jsonb_each_text(inut.nutrients) as nk(key, valtxt)
) as sumval on true
group by r.id;

create index if not exists mv_recipe_nutrients_idx on vf.mv_recipe_nutrients (recipe_id);
```

## 3. Cibles nutritionnelles (ANSES)
- **Énergie** : TDEE (Mifflin‑St Jeor + facteur activité)
- **Macros** : protéines 1.0–1.4 g/kg selon objectif, lipides 25–35 % AET, fibres ≥ 30 g/j
- **Micros cibles** : B12, D, calcium, fer, zinc, iode, sélénium, ALA (Ω‑3), + folates, choline
- **Tolérance journalière** : ±15 % ; **objectif hebdo** ≥ 100 %

## 4. Endpoints (Next.js API)
### 4.1 `app/api/plan/generate/route.ts`
Contenu inclus dans `/web/app/api/plan/generate/route.ts` du repo.

### 4.2 OFF helper `lib/off.ts`
Contenu inclus dans `/web/lib/off.ts` du repo.

## 5. Solveur (FastAPI + PuLP)
### 5.1 `solver/main.py`
Contenu inclus dans `/solver/main.py` du repo.
