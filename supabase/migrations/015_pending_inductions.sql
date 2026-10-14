-- Pending induction checkouts. Membership still activates only after paid webhook.
-- Service role only.

create table if not exists public.pending_inductions (
  id uuid primary key default gen_random_uuid(),
  settler_id text not null,
  name text not null,
  show_name boolean not null default false,
  email text,
  shipping_name text,
  shipping_line1 text,
  shipping_line2 text,
  shipping_city text,
  shipping_region text,
  shipping_postal text,
  shipping_country text,
  lemon_checkout_id text,
  status text not null default 'pending',
  lemon_order_id text,
  error text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  constraint pending_inductions_status_check
    check (status in ('pending', 'paid', 'failed', 'cancelled'))
);

create index if not exists idx_pending_inductions_settler
  on public.pending_inductions (settler_id, created_at desc);

create unique index if not exists idx_pending_inductions_order
  on public.pending_inductions (lemon_order_id)
  where lemon_order_id is not null;

alter table public.pending_inductions enable row level security;
revoke all on table public.pending_inductions from anon, authenticated;
grant all on table public.pending_inductions to service_role;
