create table if not exists public.menu_discovery_checks (
  id bigint generated always as identity primary key,
  restaurant_id bigint not null references public.restaurants(id) on delete cascade,
  channel text not null check (channel in ('website','instagram','facebook','qr','operator','other')),
  source_url text,
  status text not null check (status in ('checked_no_menu','menu_found','integrated','blocked','unavailable')),
  menu_scope text not null default 'unknown' check (menu_scope in ('full_menu','partial','none','unknown')),
  is_official boolean not null default false,
  evidence_note text,
  checked_at timestamptz not null default now(),
  next_review_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists menu_discovery_checks_restaurant_channel_source_uidx
  on public.menu_discovery_checks (restaurant_id, channel, coalesce(source_url,''));
create index if not exists menu_discovery_checks_status_idx
  on public.menu_discovery_checks (status, checked_at desc);
create index if not exists menu_discovery_checks_restaurant_idx
  on public.menu_discovery_checks (restaurant_id, checked_at desc);

alter table public.menu_discovery_checks enable row level security;
revoke all on table public.menu_discovery_checks from anon;
revoke all on table public.menu_discovery_checks from authenticated;
grant select on table public.menu_discovery_checks to authenticated;

create policy "hoy admins read menu discovery checks"
on public.menu_discovery_checks
for select
to authenticated
using (private.is_hoy_admin());

comment on table public.menu_discovery_checks is 'Internal HOY menu-discovery audit history. Records verified research outcomes per restaurant/channel; never public guest content.';
