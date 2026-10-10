-- Visa wishes ($10). Written only by the server with the service role; RLS on, no anon or authenticated access.
-- reference_id is the private, unguessable link token (/visa/<reference_id>), the only value sent to Lemon
-- Squeezy as custom data. certificate_no is the public number printed on the certificate and used for share links.
-- A row is created as 'pending' before checkout and becomes 'paid' only from a verified order_created webhook;
-- order_refunded sets 'refunded'. The reading is generated once after payment and stored. No card data, ever.

create table if not exists public.visa_wishes (
  id uuid primary key default gen_random_uuid(),
  reference_id text unique not null,
  certificate_no text unique not null,
  category text not null,
  country text not null,
  wish text not null,
  first_name text,
  status text not null default 'pending' check (status in ('pending', 'paid', 'refunded')),
  lemon_order_id text unique,
  paid_at timestamptz,
  refunded_at timestamptz,
  reading jsonb,
  reading_generated_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.visa_wishes enable row level security;
revoke all on table public.visa_wishes from anon, authenticated;

-- The wish-engine ledger wall is out of scope; do not expose petition wishes to anon.
revoke all on table public.petition_ledger from anon, authenticated;
