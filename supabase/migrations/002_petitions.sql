-- Petitions and certificates. Service role writes. No anon insert.
-- locale is not a column: the app does not read or write a locale.
-- certificates.name is nullable. certificates.tier stays nullable with default 'basic' so older rows do not break.

create table if not exists public.petitions (
  id uuid primary key default gen_random_uuid(),
  petition_id text unique not null,
  wish text not null,
  category text not null,
  algo_status text not null,
  algo_sacrifices jsonb not null,
  algo_counsel text not null,
  algo_probability text not null,
  pandit_reply text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  petition_id text not null references public.petitions (petition_id),
  lemon_order_id text unique not null,
  issued_at timestamptz not null default now(),
  name text,
  tier text default 'basic'
);

alter table public.petitions enable row level security;
alter table public.certificates enable row level security;

create or replace view public.petition_ledger
with (security_invoker = false) as
select petition_id, category, algo_status as status, created_at, wish
from public.petitions;

revoke all on table public.petitions from anon, authenticated;
revoke all on table public.certificates from anon, authenticated;
revoke all on table public.petition_ledger from anon, authenticated;
grant select on table public.petition_ledger to anon, authenticated, service_role;
