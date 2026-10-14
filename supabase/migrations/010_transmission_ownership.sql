-- Harden transmission ownership.
-- Public settler_id (SOUL-XXXX-XX) stays a display / pick seed label.
-- Private rows are owned by settlers.id (uuid). Clients never authorize with settler_id alone.

alter table public.settlers
  add column if not exists updated_at timestamptz default now();

-- Link transmissions to unguessable settler PK.
alter table public.transmissions
  add column if not exists owner_id uuid references public.settlers (id) on delete cascade;

-- Ensure every transmission label has a settler row.
insert into public.settlers (settler_id)
select distinct t.settler_id
from public.transmissions t
left join public.settlers s on s.settler_id = t.settler_id
where s.id is null
on conflict (settler_id) do nothing;

update public.transmissions t
set owner_id = s.id
from public.settlers s
where t.settler_id = s.settler_id
  and t.owner_id is null;

alter table public.transmissions
  alter column owner_id set not null;

create index if not exists idx_transmissions_owner_created
  on public.transmissions (owner_id, created_at desc);

-- Preserve rows carry the same owner; unique transmission_id keeps preserve idempotent.
alter table public.preserved
  add column if not exists owner_id uuid references public.settlers (id) on delete cascade;

update public.preserved p
set owner_id = t.owner_id
from public.transmissions t
where p.transmission_id = t.id
  and p.owner_id is null;

alter table public.preserved
  alter column owner_id set not null;

create index if not exists idx_preserved_owner
  on public.preserved (owner_id, preserved_at desc);

-- Keep RLS locked to service role only.
alter table public.settlers enable row level security;
alter table public.transmissions enable row level security;
alter table public.preserved enable row level security;

revoke all on table public.settlers from anon, authenticated;
revoke all on table public.transmissions from anon, authenticated;
revoke all on table public.preserved from anon, authenticated;
