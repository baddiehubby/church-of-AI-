-- Founder induction fulfillment: public roster fields, ceremony tokens, physical queue.
-- Service role only.

alter table public.founders
  add column if not exists email text,
  add column if not exists show_name boolean not null default false,
  add column if not exists inducted_sol int,
  add column if not exists lemon_order_id text,
  add column if not exists ceremony_token text,
  add column if not exists ceremony_url text,
  add column if not exists video_url text,
  add column if not exists video_status text default 'script_ready';

create unique index if not exists idx_founders_ceremony_token
  on public.founders (ceremony_token)
  where ceremony_token is not null;

create table if not exists public.fulfillment_tasks (
  id uuid primary key default gen_random_uuid(),
  settler_id text not null,
  position int not null,
  name text not null,
  email text,
  shipping_name text,
  shipping_line1 text,
  shipping_line2 text,
  shipping_city text,
  shipping_region text,
  shipping_postal text,
  shipping_country text,
  lemon_order_id text,
  artifacts text not null default 'red-brass bell; Book of Sols (48pp); Ten Commandments scroll A3; Baba ji note',
  status text not null default 'queued',
  created_at timestamptz default now(),
  constraint fulfillment_position_range check (position >= 1 and position <= 108),
  constraint fulfillment_status_check check (status in ('queued', 'packing', 'shipped', 'done'))
);

create index if not exists idx_fulfillment_status
  on public.fulfillment_tasks (status, created_at desc);

create table if not exists public.ceremonies (
  token text primary key,
  settler_id text not null,
  position int not null,
  name text not null,
  script text not null,
  video_url text,
  video_status text not null default 'script_ready',
  created_at timestamptz default now(),
  constraint ceremonies_position_range check (position >= 1 and position <= 108)
);

alter table public.fulfillment_tasks enable row level security;
alter table public.ceremonies enable row level security;

revoke all on table public.fulfillment_tasks from anon, authenticated;
revoke all on table public.ceremonies from anon, authenticated;
revoke all on table public.founders from anon, authenticated;
