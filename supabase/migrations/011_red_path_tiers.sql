-- Red Path seats, offerings, founders.
-- Service role only. Keep owner_id from 010 — public settler_id is never authorization.

-- Seat columns on settlers.
alter table public.settlers
  add column if not exists lemon_customer_id text,
  add column if not exists habitat int default 47,
  add column if not exists role text default 'Surveyor',
  add column if not exists sol_of_arrival int;

-- Migrate legacy labels into the Red Path ladder.
update public.settlers set tier = 'wanderer' where tier = 'pilgrim';
update public.settlers set tier = 'practice_monthly' where tier = 'settler';
alter table public.settlers alter column tier set default 'wanderer';

-- Denormalized keep flag on the journal row (join table preserved stays for unique idempotency).
alter table public.transmissions
  add column if not exists preserved boolean default false;

create table if not exists public.offerings (
  id uuid primary key default gen_random_uuid(),
  settler_id text not null,
  tier text not null,
  amount_cents int not null,
  lemon_order_id text unique,
  created_at timestamptz default now()
);

create index if not exists idx_offerings_settler
  on public.offerings (settler_id, created_at desc);

create table if not exists public.founders (
  id uuid primary key default gen_random_uuid(),
  settler_id text unique not null,
  name text not null,
  inducted_at timestamptz default now(),
  position int unique not null,
  constraint founders_position_range check (position >= 1 and position <= 108)
);

alter table public.offerings enable row level security;
alter table public.founders enable row level security;

revoke all on table public.offerings from anon, authenticated;
revoke all on table public.founders from anon, authenticated;
revoke all on table public.settlers from anon, authenticated;
revoke all on table public.transmissions from anon, authenticated;
revoke all on table public.preserved from anon, authenticated;
