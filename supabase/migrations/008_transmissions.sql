-- Transmissions archive. Service role writes. No anon or authenticated access.
-- settlers hold the seat. transmissions are the journal. preserved marks keepers.

create table if not exists public.settlers (
  id uuid primary key default gen_random_uuid(),
  settler_id text unique not null,
  tier text not null default 'pilgrim',
  stripe_customer_id text,
  created_at timestamptz default now()
);

create table if not exists public.transmissions (
  id uuid primary key default gen_random_uuid(),
  settler_id text not null,
  sol int not null,
  body text not null,
  baba_opening text not null,
  algo_status text not null,
  algo_counsel text not null,
  algo_probability text not null,
  baba_translation text not null,
  baba_forecast text not null,
  is_pause boolean default false,
  created_at timestamptz default now()
);

create index if not exists idx_transmissions_settler
  on public.transmissions (settler_id, created_at desc);

create table if not exists public.preserved (
  id uuid primary key default gen_random_uuid(),
  transmission_id uuid not null references public.transmissions (id) on delete cascade,
  settler_id text not null,
  preserved_at timestamptz default now(),
  unique (transmission_id)
);

create index if not exists idx_preserved_settler
  on public.preserved (settler_id, preserved_at desc);

alter table public.settlers enable row level security;
alter table public.transmissions enable row level security;
alter table public.preserved enable row level security;

revoke all on table public.settlers from anon, authenticated;
revoke all on table public.transmissions from anon, authenticated;
revoke all on table public.preserved from anon, authenticated;
