-- Assumptions: audit log of every webhook request, written by the server with the service role (bypasses RLS).
-- outcome is one of: issued, duplicate, revoked, ignored_event, not_paid, bad_signature, invalid_payload, db_error.
-- kind is visa or certificate. reference is a petition id or a public visa certificate number, never the private
-- visa link token. detail is a short code, never PII. No raw bodies, wish text, names, or emails are stored here.

create table if not exists public.webhook_events (
  id uuid primary key default gen_random_uuid(),
  received_at timestamptz not null default now(),
  event_name text,
  lemon_order_id text,
  kind text,
  reference text,
  signature_valid boolean not null,
  outcome text not null,
  detail text
);
create index if not exists idx_webhook_events_received_at on public.webhook_events (received_at desc);
create index if not exists idx_webhook_events_order on public.webhook_events (lemon_order_id);
alter table public.webhook_events enable row level security;
revoke all on table public.webhook_events from anon, authenticated;
