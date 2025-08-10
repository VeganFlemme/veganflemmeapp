create table if not exists public.plans (
  id uuid primary key default gen_random_uuid(),
  user_email text,
  plan_json jsonb not null,
  created_at timestamptz default now()
);