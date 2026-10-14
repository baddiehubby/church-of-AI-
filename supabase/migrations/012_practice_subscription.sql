-- Daily Practice Lemon subscription fields on settlers.
-- previous_one_time_tier is restored when the subscription expires.

alter table public.settlers
  add column if not exists lemon_subscription_id text,
  add column if not exists previous_one_time_tier text,
  add column if not exists payment_failed_at timestamptz,
  add column if not exists subscription_cancel_at timestamptz;

create unique index if not exists idx_settlers_lemon_subscription
  on public.settlers (lemon_subscription_id)
  where lemon_subscription_id is not null;

revoke all on table public.settlers from anon, authenticated;
