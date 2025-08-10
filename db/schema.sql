-- Supabase SQL — exécuter dans SQL Editor

create schema if not exists ciqual;
create schema if not exists vf;
create schema if not exists off_link;

create table if not exists ciqual.food (
  code text primary key,
  name_fr text not null,
  group_fr text,
  nutrients jsonb not null
);

create table if not exists vf.nutrient_ref (
  key text primary key,
  label text not null,
  unit text not null,
  rnp_male numeric,
  rnp_female numeric,
  ul numeric
);

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

create table if not exists off_link.product_ref (
  barcode text primary key,
  last_seen_at timestamptz default now(),
  notes text
);

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
