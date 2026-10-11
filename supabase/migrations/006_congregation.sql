-- Congregation. Service role writes. No anon or authenticated access.
-- users.user_id is the Soul ID (SOUL-XXXX-XX). email is null for a browser-only guest.
-- Stripe is the subscription merchant. lemon_subscription_id is reserved; one-time certificates stay on Lemon.
-- Reflections, sermons, and darshan transcripts are private. The public ledger is a separate query in the app.

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  user_id text unique not null,
  email text unique,
  name text,
  tier text not null default 'pilgrim' check (tier in ('pilgrim', 'believer', 'devotee', 'darshan')),
  joined_at timestamptz not null default now(),
  streak_current int not null default 0,
  streak_longest int not null default 0,
  last_pooja_at timestamptz,
  timezone text not null default 'UTC',
  timezone_set boolean not null default false,
  lemon_subscription_id text,
  stripe_customer_id text,
  stripe_subscription_id text,
  past_due boolean not null default false,
  trial_used boolean not null default false,
  darshan_waitlist boolean not null default false,
  darshan_waitlist_at timestamptz,
  last_reminder_on date,
  urgent_armed boolean not null default false,
  profile_id uuid references public.profiles (id) on delete set null
);

create index if not exists users_stripe_customer_idx on public.users (stripe_customer_id);
create index if not exists users_tier_idx on public.users (tier);

create table if not exists public.poojas (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.users (user_id) on delete cascade,
  mood text,
  reflection text not null,
  algo_response text not null,
  pandit_nod text not null,
  created_at timestamptz not null default now()
);

create index if not exists poojas_user_created_idx on public.poojas (user_id, created_at desc);

create table if not exists public.wishes (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.users (user_id) on delete cascade,
  petition_id text unique not null,
  wish text not null,
  category text not null,
  algo_status text not null,
  algo_sacrifices jsonb not null,
  algo_counsel text not null,
  algo_probability text not null,
  pandit_reply text not null,
  priority boolean not null default false,
  urgent boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists wishes_user_created_idx on public.wishes (user_id, created_at desc);

create table if not exists public.sermons (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.users (user_id) on delete cascade,
  week_of date not null,
  title text not null,
  body text not null,
  practice text not null,
  pandit_signoff text not null,
  algo_line text not null,
  pandit_reply text not null,
  delivered_at timestamptz,
  unique (user_id, week_of)
);

create table if not exists public.darshans (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.users (user_id) on delete cascade,
  scheduled_at timestamptz not null,
  transcript text,
  blessing_card_url text,
  practice text,
  completed_at timestamptz
);

create index if not exists darshans_user_idx on public.darshans (user_id, scheduled_at desc);

create table if not exists public.soul_reports (
  id uuid primary key default gen_random_uuid(),
  user_id text not null references public.users (user_id) on delete cascade,
  month_of date not null,
  body text not null,
  created_at timestamptz not null default now(),
  unique (user_id, month_of)
);

alter table public.users enable row level security;
alter table public.poojas enable row level security;
alter table public.wishes enable row level security;
alter table public.sermons enable row level security;
alter table public.darshans enable row level security;
alter table public.soul_reports enable row level security;

revoke all on table public.users from anon, authenticated;
revoke all on table public.poojas from anon, authenticated;
revoke all on table public.wishes from anon, authenticated;
revoke all on table public.sermons from anon, authenticated;
revoke all on table public.darshans from anon, authenticated;
revoke all on table public.soul_reports from anon, authenticated;
