-- HOY 2.40 — family / playground decision data.
-- Public guests only receive family facts that have a traceable verification state.

create table if not exists public.restaurant_family_features (
  restaurant_id bigint primary key references public.restaurants(id) on delete cascade,
  playground_type text not null default 'unknown'
    check (playground_type in ('unknown','none','own','adjacent_public','nearby_public')),
  playground_distance_m integer
    check (playground_distance_m is null or playground_distance_m between 0 and 3000),
  visible_from_seating boolean,
  fenced boolean,
  traffic_separated boolean,
  shade_available boolean,
  indoor_play_area boolean,
  highchairs boolean,
  changing_facility boolean,
  kids_menu boolean,
  stroller_friendly boolean,
  suitable_age_min smallint check (suitable_age_min is null or suitable_age_min between 0 and 17),
  suitable_age_max smallint check (suitable_age_max is null or suitable_age_max between 0 and 17),
  notes text check (notes is null or length(notes) <= 1200),
  verification_status text not null default 'unverified'
    check (verification_status in ('unverified','operator_confirmed','source_verified','hoy_verified')),
  source_url text check (source_url is null or source_url ~* '^https://[^[:space:]]+$'),
  source_label text check (source_label is null or length(source_label) <= 180),
  verified_at timestamptz,
  updated_at timestamptz not null default now(),
  constraint restaurant_family_features_age_order
    check (suitable_age_min is null or suitable_age_max is null or suitable_age_min <= suitable_age_max),
  constraint restaurant_family_features_distance_semantics
    check (
      (playground_type in ('own','unknown','none') and playground_distance_m is null)
      or (playground_type in ('adjacent_public','nearby_public') and playground_distance_m is not null)
    ),
  constraint restaurant_family_features_verified_timestamp
    check (
      (verification_status='unverified' and verified_at is null)
      or (verification_status<>'unverified' and verified_at is not null)
    )
);

create index if not exists idx_restaurant_family_features_public
  on public.restaurant_family_features(verification_status, playground_type, restaurant_id);

alter table public.restaurant_family_features enable row level security;
revoke all on table public.restaurant_family_features from anon, authenticated;
grant select on table public.restaurant_family_features to anon, authenticated;
grant insert, update, delete on table public.restaurant_family_features to authenticated;

drop policy if exists "public reads verified family features" on public.restaurant_family_features;
create policy "public reads verified family features"
  on public.restaurant_family_features
  for select
  to anon, authenticated
  using (
    verification_status in ('operator_confirmed','source_verified','hoy_verified')
    and exists (
      select 1 from public.restaurants r
      where r.id=restaurant_id and r.is_published=true
    )
  );

drop policy if exists "members read own family feature records" on public.restaurant_family_features;
create policy "members read own family feature records"
  on public.restaurant_family_features
  for select
  to authenticated
  using (private.is_restaurant_member(restaurant_id));

drop policy if exists "hoy admins manage family features" on public.restaurant_family_features;
create policy "hoy admins manage family features"
  on public.restaurant_family_features
  for all
  to authenticated
  using (private.is_hoy_admin())
  with check (private.is_hoy_admin());

comment on table public.restaurant_family_features is
  'Verified family decision facts for HOY Gastro. Unverified rows are never exposed to anonymous guests.';
comment on column public.restaurant_family_features.playground_type is
  'own = venue playground; adjacent_public = public playground directly beside venue; nearby_public = relevant nearby public playground.';
comment on column public.restaurant_family_features.visible_from_seating is
  'Whether the playground/play area is visibly observable from normal guest seating/terrace; null means not verified.';
comment on column public.restaurant_family_features.verification_status is
  'operator_confirmed, source_verified or hoy_verified are publishable; unverified is internal only.';
