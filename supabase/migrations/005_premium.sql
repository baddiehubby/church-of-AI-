-- Premium ($10/month). Service role only; RLS on, no anon or authenticated access.
-- profiles = signed-in members. premium_entitlements tracks Lemon subscription_id and status.
-- wish_entries + readings = private journal and follow-up threads. preferences caches daily guidance
-- per UTC date. share_cards are created only when the member asks; include_wish defaults false.
-- English only for now; preferences.locale is reserved. TODO: Hindi later.
-- No passport or visa-application columns.

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamptz not null default now()
);

create table if not exists public.login_tokens (
  token_hash text primary key,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  expires_at timestamptz not null,
  used_at timestamptz
);

create table if not exists public.premium_entitlements (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  lemon_subscription_id text unique not null,
  status text not null check (status in ('active', 'cancelled', 'expired', 'past_due')),
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists public.wish_entries (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  thread_id uuid not null,
  wish text not null,
  category text,
  created_at timestamptz not null default now()
);

create table if not exists public.readings (
  id uuid primary key default gen_random_uuid(),
  entry_id uuid not null references public.wish_entries (id) on delete cascade,
  verdict jsonb not null,
  created_at timestamptz not null default now()
);

create table if not exists public.preferences (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  goals text,
  locale text not null default 'en',
  daily_on_utc_date text,
  daily_text text,
  updated_at timestamptz not null default now()
);

create table if not exists public.share_cards (
  public_id text unique not null,
  entry_id uuid not null references public.wish_entries (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete cascade,
  summary text not null,
  reflection text not null,
  include_wish boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.login_tokens enable row level security;
alter table public.premium_entitlements enable row level security;
alter table public.wish_entries enable row level security;
alter table public.readings enable row level security;
alter table public.preferences enable row level security;
alter table public.share_cards enable row level security;

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.login_tokens from anon, authenticated;
revoke all on table public.premium_entitlements from anon, authenticated;
revoke all on table public.wish_entries from anon, authenticated;
revoke all on table public.readings from anon, authenticated;
revoke all on table public.preferences from anon, authenticated;
revoke all on table public.share_cards from anon, authenticated;
