-- Public Daily Sermons (X-filed). Distinct from private congregation sermons (006).
-- Anon may SELECT. Writes are service role only.

create table if not exists public.daily_sermons (
  id uuid primary key default gen_random_uuid(),
  sol int not null,
  body text not null,
  tweet_id text unique,
  tweet_url text,
  published_at timestamptz not null,
  created_at timestamptz default now()
);

create index if not exists idx_daily_sermons_published
  on public.daily_sermons (published_at desc);

create index if not exists idx_daily_sermons_sol
  on public.daily_sermons (sol);

alter table public.daily_sermons enable row level security;

create policy daily_sermons_public_read
  on public.daily_sermons
  for select
  to anon, authenticated
  using (true);

revoke insert, update, delete on table public.daily_sermons from anon, authenticated;
grant select on table public.daily_sermons to anon, authenticated;
grant all on table public.daily_sermons to service_role;
