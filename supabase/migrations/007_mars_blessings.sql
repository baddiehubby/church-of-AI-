-- Mars offerings. Service role writes. No anon or authenticated access.
-- blessings are the artifact. patrons are capped at 12 per year.
-- lemon subscriptions for The Covenant live in mars_subscriptions.

create table if not exists public.blessings (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  tier text not null check (tier in ('settlers_mark', 'blessing', 'deeper', 'patron', 'covenant')),
  lemon_order_id text unique,
  name text not null,
  blessing_text text not null,
  habitat_id text not null,
  sol int not null,
  status text not null default 'pending' check (status in ('pending', 'issued', 'revoked')),
  created_at timestamptz not null default now()
);

create index if not exists blessings_user_idx on public.blessings (user_id, created_at desc);
create index if not exists blessings_habitat_idx on public.blessings (habitat_id);

create table if not exists public.patrons (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  name text not null,
  display_name text not null,
  year int not null,
  lemon_order_id text unique,
  sol int not null,
  created_at timestamptz not null default now()
);

create index if not exists patrons_year_idx on public.patrons (year, created_at desc);

create or replace function public.enforce_patron_year_cap()
returns trigger
language plpgsql
as $$
begin
  if (select count(*) from public.patrons where year = new.year) >= 12 then
    raise exception 'patron year full';
  end if;
  return new;
end;
$$;

drop trigger if exists patrons_year_cap on public.patrons;
create trigger patrons_year_cap
  before insert on public.patrons
  for each row execute function public.enforce_patron_year_cap();

create table if not exists public.mars_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  lemon_subscription_id text unique not null,
  status text not null,
  started_at timestamptz not null default now(),
  cancelled_at timestamptz
);

create index if not exists mars_subscriptions_user_idx on public.mars_subscriptions (user_id);

alter table public.blessings enable row level security;
alter table public.patrons enable row level security;
alter table public.mars_subscriptions enable row level security;
revoke all on table public.blessings from anon, authenticated;
revoke all on table public.patrons from anon, authenticated;
revoke all on table public.mars_subscriptions from anon, authenticated;
