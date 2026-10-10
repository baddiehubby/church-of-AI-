-- Petitions are written by the service role. Anon may read only the ledger view.
-- ip_hash, counsel, and user_id are not in that view. Wish text is null unless public_wish is true.
-- No anon insert policy. Service role bypasses row level security.

create table if not exists public.petitions (
  id uuid primary key default gen_random_uuid(),
  petition_id text unique not null,
  wish text not null,
  category text not null,
  status text not null,
  sacrifices jsonb not null,
  counsel text not null,
  probability text not null,
  closing text not null,
  public_wish boolean not null default false,
  user_id uuid,
  created_at timestamptz not null default now(),
  ip_hash text
);

create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  petition_id text not null references public.petitions (petition_id),
  lemon_order_id text unique not null,
  issued_at timestamptz not null default now()
);

alter table public.petitions enable row level security;
alter table public.certificates enable row level security;

create or replace view public.petition_ledger
with (security_invoker = false) as
select
  petition_id,
  category,
  status,
  created_at,
  case when public_wish then wish else null end as wish
from public.petitions;

revoke all on table public.petitions from anon, authenticated;
revoke all on table public.certificates from anon, authenticated;
revoke all on table public.petition_ledger from anon, authenticated;
grant select on table public.petition_ledger to anon, authenticated, service_role;
