-- Religion of Mars five one-time offerings.
-- Extends blessings tiers, stores prayer/wish text, Wall of Mars, Founder monument.
-- Service role only. No anon/authenticated grants.

-- Allow new tier values alongside legacy rows (if any).
alter table public.blessings drop constraint if exists blessings_tier_check;
alter table public.blessings
  add constraint blessings_tier_check check (
    tier in (
      'prayer',
      'wall',
      'wish',
      'patron',
      'founder_engraving',
      -- legacy (read-only historical)
      'settlers_mark',
      'blessing',
      'deeper',
      'covenant'
    )
  );

alter table public.blessings
  add column if not exists message text;

-- Drop the old 12/year patron cap; $50 Patron of Mars is recognition-only, not a invented scarcity claim.
drop trigger if exists patrons_year_cap on public.patrons;

create table if not exists public.wall_of_mars (
  id uuid primary key default gen_random_uuid(),
  blessing_id uuid references public.blessings (id) on delete set null,
  lemon_order_id text not null unique,
  display_name text not null,
  sol int not null,
  status text not null default 'held' check (status in ('published', 'held', 'rejected')),
  created_at timestamptz not null default now()
);

create index if not exists wall_of_mars_status_idx on public.wall_of_mars (status, created_at desc);

create table if not exists public.founder_monument (
  id uuid primary key default gen_random_uuid(),
  blessing_id uuid references public.blessings (id) on delete set null,
  lemon_order_id text not null unique,
  display_name text not null,
  sol int not null,
  status text not null default 'held' check (status in ('published', 'held', 'rejected')),
  created_at timestamptz not null default now()
);

create index if not exists founder_monument_status_idx on public.founder_monument (status, created_at asc);

alter table public.wall_of_mars enable row level security;
alter table public.founder_monument enable row level security;
revoke all on table public.wall_of_mars from anon, authenticated;
revoke all on table public.founder_monument from anon, authenticated;
