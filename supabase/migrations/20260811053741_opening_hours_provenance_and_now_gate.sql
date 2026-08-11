alter table public.restaurants
  add column if not exists hours_weekly jsonb,
  add column if not exists hours_status text not null default 'missing',
  add column if not exists hours_source_url text,
  add column if not exists hours_source_label text,
  add column if not exists hours_checked_at timestamptz,
  add column if not exists hours_note text;

alter table public.restaurants
  drop constraint if exists restaurants_hours_status_check;

alter table public.restaurants
  add constraint restaurants_hours_status_check
  check (hours_status in ('missing','needs_review','verified','conditional','conflict'));

update public.restaurants
set hours_status = case
  when nullif(btrim(hours_text),'') is null then 'missing'
  when coalesce(source_label,'') ilike '%widersprüch%'
    or coalesce(hours_text,'') ~* '(widersprech|bestätigung erforderlich|vor live-anzeige|nicht klar ausgewiesen|nicht belastbar|wochenplan noch nicht vollständig|andere aktuelle profile weichen ab)'
    then 'conflict'
  else 'needs_review'
end,
hours_source_url = case when nullif(btrim(hours_text),'') is not null then source_url else hours_source_url end,
hours_source_label = case when nullif(btrim(hours_text),'') is not null then source_label else hours_source_label end,
hours_checked_at = case when nullif(btrim(hours_text),'') is not null and source_checked_at is not null then source_checked_at::timestamptz else hours_checked_at end
where hours_status = 'missing';

create table if not exists public.restaurant_hours_sources (
  id uuid primary key default gen_random_uuid(),
  restaurant_id bigint not null references public.restaurants(id) on delete cascade,
  source_url text not null,
  source_label text not null,
  source_kind text not null default 'other',
  is_official boolean not null default false,
  checked_at timestamptz not null default now(),
  observed_hours_text text,
  weekly_hours jsonb,
  evidence_status text not null default 'observed',
  note text,
  created_at timestamptz not null default now(),
  constraint restaurant_hours_sources_kind_check check (source_kind in ('official_website','official_social','booking','directory','other')),
  constraint restaurant_hours_sources_evidence_check check (evidence_status in ('observed','supports','conflicts','conditional'))
);

create index if not exists idx_restaurant_hours_sources_restaurant_checked
  on public.restaurant_hours_sources (restaurant_id, checked_at desc);

alter table public.restaurant_hours_sources enable row level security;

create policy "hoy admins manage hours sources"
on public.restaurant_hours_sources
for all
to authenticated
using (private.is_hoy_admin())
with check (private.is_hoy_admin());
