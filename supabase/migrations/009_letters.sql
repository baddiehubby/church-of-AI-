-- Monthly letters for settlers. Service role only.
-- Email on settlers is for Resend only — never exposed to the client.

alter table public.settlers
  add column if not exists email text;

alter table public.settlers
  add column if not exists stripe_subscription_id text;

create table if not exists public.letters (
  id uuid primary key default gen_random_uuid(),
  settler_id text not null,
  month text not null,
  body text not null,
  created_at timestamptz default now(),
  unique (settler_id, month)
);

create index if not exists idx_letters_settler_month
  on public.letters (settler_id, month desc);

alter table public.letters enable row level security;
revoke all on table public.letters from anon, authenticated;
