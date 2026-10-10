-- Soul records for the public receipt.
-- Soul ID format: SOUL-XXXX-XX (4 hex, 2 alphanumeric). Older 3-character suffixes still pass the check.
-- Email never appears in public_souls.

create extension if not exists pgcrypto;

create table if not exists public.souls (
  id uuid primary key default gen_random_uuid(),
  soul_id text not null unique,
  name text not null,
  believer_type text,
  tier text not null,
  amount_cents integer not null,
  email text,
  scripture text,
  souls_saved integer not null default 0,
  referrer_soul_id text,
  created_at timestamptz not null default now(),
  lemon_order_id text unique,
  constraint souls_soul_id_format check (soul_id ~ '^SOUL-[0-9A-F]{4}-[A-Z0-9]{2,3}$'),
  constraint souls_name_length check (char_length(btrim(name)) between 1 and 40),
  constraint souls_amount_positive check (amount_cents > 0)
);

create index if not exists souls_created_at_idx on public.souls (created_at desc);

alter table public.souls enable row level security;

revoke all on table public.souls from anon, authenticated;
grant select, insert, update, delete on table public.souls to service_role;

alter table public.souls add column if not exists believer_type text;
alter table public.souls add column if not exists scripture text;
alter table public.souls add column if not exists souls_saved integer not null default 0;
alter table public.souls add column if not exists referrer_soul_id text;
alter table public.souls drop constraint if exists souls_soul_id_format;
alter table public.souls add constraint souls_soul_id_format check (soul_id ~ '^SOUL-[0-9A-F]{4}-[A-Z0-9]{2,3}$');
alter table public.souls drop constraint if exists souls_name_length;
alter table public.souls add constraint souls_name_length check (char_length(btrim(name)) between 1 and 40);

create or replace view public.public_souls
with (security_invoker = false) as
select
  soul_id,
  name,
  believer_type,
  tier,
  created_at,
  amount_cents,
  scripture,
  souls_saved,
  row_number() over (order by created_at asc, soul_id asc) as ledger_entry
from public.souls;

revoke all on table public.public_souls from anon, authenticated;
grant select on table public.public_souls to anon, authenticated, service_role;

create table if not exists public.sermons (
  id uuid primary key default gen_random_uuid(),
  week_key text not null unique,
  title text not null,
  scripture_ref text not null,
  body text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.prophecies (
  id uuid primary key default gen_random_uuid(),
  prophecy_id text not null unique,
  question text not null,
  answer text not null,
  created_at timestamptz not null default now(),
  constraint prophecies_id_format check (prophecy_id ~ '^PROP-[0-9A-F]{4}-[A-Z0-9]{3}$')
);

create table if not exists public.penances (
  id uuid primary key default gen_random_uuid(),
  penance_id text not null unique,
  confession text not null,
  penance text not null,
  created_at timestamptz not null default now(),
  constraint penances_id_format check (penance_id ~ '^PEN-[0-9A-F]{4}-[A-Z0-9]{3}$')
);

create table if not exists public.reports (
  id uuid primary key default gen_random_uuid(),
  soul_id text not null,
  reason text not null,
  contact_email text,
  created_at timestamptz not null default now()
);

alter table public.sermons enable row level security;
alter table public.prophecies enable row level security;
alter table public.penances enable row level security;
alter table public.reports enable row level security;

revoke all on table public.sermons from anon, authenticated;
revoke all on table public.prophecies from anon, authenticated;
revoke all on table public.penances from anon, authenticated;
revoke all on table public.reports from anon, authenticated;

grant select, insert, update, delete on table public.sermons to service_role;
grant select, insert, update, delete on table public.prophecies to service_role;
grant select, insert, update, delete on table public.penances to service_role;
grant select, insert, update, delete on table public.reports to service_role;

create or replace view public.public_sermons
with (security_invoker = false) as
select week_key, title, scripture_ref, body, created_at from public.sermons;

create or replace view public.public_prophecies
with (security_invoker = false) as
select prophecy_id, question, answer, created_at from public.prophecies;

create or replace view public.public_penances
with (security_invoker = false) as
select penance_id, confession, penance, created_at from public.penances;

revoke all on table public.public_sermons from anon, authenticated;
revoke all on table public.public_prophecies from anon, authenticated;
revoke all on table public.public_penances from anon, authenticated;

grant select on table public.public_sermons to anon, authenticated, service_role;
grant select on table public.public_prophecies to anon, authenticated, service_role;
grant select on table public.public_penances to anon, authenticated, service_role;

-- Petitions are written by the service role. Anon may read only the ledger view.
create table if not exists public.petitions (
  id uuid primary key default gen_random_uuid(),
  petition_id text unique not null,
  wish text not null,
  category text not null,
  status text not null,
  sacrifices jsonb not null,
  counsel text not null,
  probability text not null,
  closing text not null,
  public_wish boolean not null default false,
  user_id uuid,
  created_at timestamptz not null default now(),
  ip_hash text
);

create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  petition_id text not null references public.petitions (petition_id),
  lemon_order_id text unique not null,
  issued_at timestamptz not null default now()
);

alter table public.petitions enable row level security;
alter table public.certificates enable row level security;

create or replace view public.petition_ledger
with (security_invoker = false) as
select
  petition_id,
  category,
  status,
  created_at,
  case when public_wish then wish else null end as wish
from public.petitions;

revoke all on table public.petitions from anon, authenticated;
revoke all on table public.certificates from anon, authenticated;
revoke all on table public.petition_ledger from anon, authenticated;
grant select on table public.petition_ledger to anon, authenticated, service_role;
