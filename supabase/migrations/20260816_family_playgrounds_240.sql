-- HOY 2.40 — verified family / eat & play decision data.
-- The schema deliberately separates WHAT children can do, WHERE it is,
-- WHO may use it and HOW strongly the fact has been verified.

create table if not exists public.restaurant_family_features (
  restaurant_id bigint primary key references public.restaurants(id) on delete cascade,

  play_types text[] not null default '{}'::text[]
    check (
      play_types <@ array[
        'play_area','outdoor_playground','indoor_playroom','inflatable',
        'splash','minigolf','amusement_park'
      ]::text[]
      and cardinality(play_types) <= 7
    ),
  relationship text not null default 'unknown'
    check (relationship in ('unknown','on_premises','directly_adjacent','nearby')),
  access_type text not null default 'unknown'
    check (access_type in ('unknown','free','restaurant_customers','paid','accommodation_guests')),

  playground_distance_m integer
    check (playground_distance_m is null or playground_distance_m between 0 and 3000),
  distance_method text not null default 'unknown'
    check (distance_method in ('unknown','source','map_estimate','hoy_measured')),

  visible_from_seating boolean,
  road_crossing text not null default 'unknown'
    check (road_crossing in ('unknown','none','pedestrian_area','local_road','main_road')),
  fenced boolean,
  traffic_separated boolean,
  shade_available boolean,
  supervision_types text[] not null default '{}'::text[]
    check (
      supervision_types <@ array['parent','staff','camera']::text[]
      and cardinality(supervision_types) <= 3
    ),

  -- Family amenities are kept separately from play infrastructure.
  indoor_play_area boolean,
  highchairs boolean,
  changing_facility boolean,
  kids_menu boolean,
  stroller_friendly boolean,
  suitable_age_min smallint check (suitable_age_min is null or suitable_age_min between 0 and 17),
  suitable_age_max smallint check (suitable_age_max is null or suitable_age_max between 0 and 17),
  notes text check (notes is null or length(notes) <= 1200),

  verification_status text not null default 'unverified'
    check (verification_status in ('unverified','operator_confirmed','source_verified','community_verified','hoy_verified')),
  source_count smallint not null default 0
    check (source_count between 0 and 50),
  source_url text check (source_url is null or source_url ~* '^https://[^[:space:]]+$'),
  source_label text check (source_label is null or length(source_label) <= 180),
  verified_at timestamptz,
  updated_at timestamptz not null default now(),

  constraint restaurant_family_features_age_order
    check (suitable_age_min is null or suitable_age_max is null or suitable_age_min <= suitable_age_max),
  constraint restaurant_family_features_distance_method
    check (playground_distance_m is not null or distance_method = 'unknown'),
  constraint restaurant_family_features_verified_timestamp
    check (
      (verification_status='unverified' and verified_at is null)
      or (verification_status<>'unverified' and verified_at is not null)
    ),
  constraint restaurant_family_features_source_verified_evidence
    check (verification_status <> 'source_verified' or source_url is not null),
  constraint restaurant_family_features_community_evidence
    check (
      verification_status <> 'community_verified'
      or (source_count >= 2 and source_url is not null)
    )
);

create index if not exists idx_restaurant_family_features_public
  on public.restaurant_family_features(verification_status, relationship, restaurant_id);

alter table public.restaurant_family_features enable row level security;

-- Supabase Data API exposure is explicit: grants and RLS are separate controls.
revoke all on table public.restaurant_family_features from anon, authenticated;
grant select on table public.restaurant_family_features to anon, authenticated;
grant insert, update, delete on table public.restaurant_family_features to authenticated;

drop policy if exists "anonymous reads verified family features" on public.restaurant_family_features;
create policy "anonymous reads verified family features"
  on public.restaurant_family_features
  for select
  to anon
  using (
    verification_status in ('operator_confirmed','source_verified','community_verified','hoy_verified')
    and exists (
      select 1 from public.restaurants r
      where r.id=restaurant_id and r.is_published=true
    )
  );

drop policy if exists "authenticated reads allowed family features" on public.restaurant_family_features;
create policy "authenticated reads allowed family features"
  on public.restaurant_family_features
  for select
  to authenticated
  using (
    private.is_hoy_admin()
    or private.is_restaurant_member(restaurant_id)
    or (
      verification_status in ('operator_confirmed','source_verified','community_verified','hoy_verified')
      and exists (
        select 1 from public.restaurants r
        where r.id=restaurant_id and r.is_published=true
      )
    )
  );

drop policy if exists "hoy admins insert family features" on public.restaurant_family_features;
create policy "hoy admins insert family features"
  on public.restaurant_family_features
  for insert
  to authenticated
  with check (private.is_hoy_admin());

drop policy if exists "hoy admins update family features" on public.restaurant_family_features;
create policy "hoy admins update family features"
  on public.restaurant_family_features
  for update
  to authenticated
  using (private.is_hoy_admin())
  with check (private.is_hoy_admin());

drop policy if exists "hoy admins delete family features" on public.restaurant_family_features;
create policy "hoy admins delete family features"
  on public.restaurant_family_features
  for delete
  to authenticated
  using (private.is_hoy_admin());

comment on table public.restaurant_family_features is
  'Verified family decision facts for HOY Gastro. Unverified rows are never exposed to anonymous guests.';
comment on column public.restaurant_family_features.play_types is
  'Orthogonal play taxonomy. Multiple values are allowed, e.g. splash + minigolf.';
comment on column public.restaurant_family_features.relationship is
  'Physical relationship to the venue: on premises, directly adjacent, nearby, or unknown.';
comment on column public.restaurant_family_features.access_type is
  'Who may use the play offer: free, restaurant customers, paid, accommodation guests, or unknown.';
comment on column public.restaurant_family_features.visible_from_seating is
  'True only when normal guest seating has a verified sightline to the play area; null means not verified.';
comment on column public.restaurant_family_features.road_crossing is
  'Road/pedestrian crossing required between venue seating and the play area. Never inferred from distance alone.';
comment on column public.restaurant_family_features.verification_status is
  'Publishable states are operator_confirmed, source_verified, community_verified and hoy_verified; unverified is internal only.';