-- HOY 2.40 Family feature restoration, stage 3 — REVIEW BEFORE ANY EXECUTION.
-- Production restoration was authorized and completed on 2026-08-19.
-- This file makes the audited Family feature baseline reproducible after the historical stage-2 seed.
-- Prerequisites:
--   1) 20260816_family_playgrounds_240.sql migration;
--   2) family_restaurant_profiles_240_staging.sql;
--   3) family_features_240_stage2_verified.sql.
--
-- Invariants:
--   * stable slugs are resolved at execution time; generated restaurant IDs are never assumed;
--   * no research row may become hoy_verified;
--   * unknown geometry stays null/unknown;
--   * only facts explicitly supported by the audited 2026-08-17 research delta/completion sources are restored.

begin;

do $$
declare
  missing_slugs text;
begin
  with expected(slug) as (
    values
      ('restaurante-club-deportivo-mar-de-cristal'),
      ('restaurante-bamboo-la-manga'),
      ('la-tap-pizzella'),
      ('restaurante-la-encarnacion'),
      ('casa-lucrecia'),
      ('mardesal'),
      ('porto-chico'),
      ('pizzeria-da-sebastian'),
      ('restaurante-mediterraneo-el-mojon')
  )
  select string_agg(e.slug, ', ' order by e.slug)
  into missing_slugs
  from expected e
  left join public.restaurants r on r.slug=e.slug
  where r.id is null;

  if missing_slugs is not null then
    raise exception 'HOY Family stage-3 restoration aborted: missing restaurant slugs: %', missing_slugs;
  end if;
end $$;

-- Two later audited promotions were not part of the historical stage-2 seed.
with promoted(
  slug,play_types,relationship,access_type,visible_from_seating,road_crossing,
  supervision_types,indoor_play_area,highchairs,kids_menu,
  verification_status,source_count,source_url,source_label,notes
) as (
  values
    ('pizzeria-da-sebastian',array['outdoor_playground']::text[],'on_premises','unknown',null,'unknown',
      '{}'::text[],null,null,true,'source_verified',2,
      'https://enlamanga.es/restaurantes/pizzeria-da-sebastian/',
      'Betreiberseite + EnLaManga · Spielplatz und Kinderkarte',
      'Aktuelle Betreiberquelle bestätigt Kindersektion; lokale aktuelle Quelle bestätigt Kinderspielplatz am Restaurant. Zugang, direkte Sichtlinie, Zaun und Schatten bleiben ungeprüft.'),
    ('restaurante-mediterraneo-el-mojon',array['indoor_playroom']::text[],'on_premises','unknown',null,'none',
      '{}'::text[],true,true,null,'source_verified',2,
      'https://es.restaurantguru.com/Mediterranean-Restaurant-El-Mojon-El-Mojon',
      'RestaurantGuru + Tripadvisor · Indoor-Spielbereich und Hochstühle',
      'Aktuelle 2026-Quellen belegen Indoor-Spielbereich und Hochstühle. Zugang, aktuelles Equipment, Altersbereich und direkte Sichtlinie bleiben ungeprüft.')
)
insert into public.restaurant_family_features (
  restaurant_id,play_types,relationship,access_type,
  playground_distance_m,distance_method,visible_from_seating,road_crossing,
  fenced,traffic_separated,shade_available,supervision_types,
  indoor_play_area,highchairs,changing_facility,kids_menu,stroller_friendly,
  suitable_age_min,suitable_age_max,notes,
  verification_status,source_count,source_url,source_label,verified_at
)
select
  r.id,p.play_types,p.relationship,p.access_type,
  null,'unknown',p.visible_from_seating,p.road_crossing,
  null,null,null,p.supervision_types,
  p.indoor_play_area,p.highchairs,null,p.kids_menu,null,
  null,null,p.notes,
  p.verification_status,p.source_count,p.source_url,p.source_label,
  timestamptz '2026-08-17T00:00:00Z'
from promoted p
join public.restaurants r on r.slug=p.slug
on conflict (restaurant_id) do update set
  play_types=excluded.play_types,
  relationship=excluded.relationship,
  access_type=excluded.access_type,
  playground_distance_m=excluded.playground_distance_m,
  distance_method=excluded.distance_method,
  visible_from_seating=excluded.visible_from_seating,
  road_crossing=excluded.road_crossing,
  fenced=excluded.fenced,
  traffic_separated=excluded.traffic_separated,
  shade_available=excluded.shade_available,
  supervision_types=excluded.supervision_types,
  indoor_play_area=excluded.indoor_play_area,
  highchairs=excluded.highchairs,
  changing_facility=excluded.changing_facility,
  kids_menu=excluded.kids_menu,
  stroller_friendly=excluded.stroller_friendly,
  suitable_age_min=excluded.suitable_age_min,
  suitable_age_max=excluded.suitable_age_max,
  notes=excluded.notes,
  verification_status=excluded.verification_status,
  source_count=excluded.source_count,
  source_url=excluded.source_url,
  source_label=excluded.source_label,
  verified_at=excluded.verified_at,
  updated_at=now();

-- Facts present in the audited completion-source file but omitted by the reduced historical seed.
update public.restaurant_family_features f
set highchairs=true, updated_at=now()
from public.restaurants r
where r.id=f.restaurant_id
  and r.slug in (
    'restaurante-club-deportivo-mar-de-cristal',
    'restaurante-bamboo-la-manga',
    'restaurante-la-encarnacion',
    'casa-lucrecia',
    'porto-chico'
  )
  and f.highchairs is distinct from true;

update public.restaurant_family_features f
set kids_menu=true, updated_at=now()
from public.restaurants r
where r.id=f.restaurant_id
  and r.slug in ('la-tap-pizzella','mardesal')
  and f.kids_menu is distinct from true;

-- Safety: stage 3 may never self-award HOY verification and must preserve unknown geometry.
do $$
begin
  if exists (
    select 1
    from public.restaurant_family_features f
    join public.restaurants r on r.id=f.restaurant_id
    where r.slug in (
      'pizzeria-da-sebastian','restaurante-mediterraneo-el-mojon',
      'restaurante-club-deportivo-mar-de-cristal','restaurante-bamboo-la-manga',
      'la-tap-pizzella','restaurante-la-encarnacion','casa-lucrecia','mardesal','porto-chico'
    ) and f.verification_status='hoy_verified'
  ) then
    raise exception 'HOY Family stage-3 safety check failed: research data cannot be hoy_verified';
  end if;

  if exists (
    select 1
    from public.restaurant_family_features f
    join public.restaurants r on r.id=f.restaurant_id
    where r.slug in ('pizzeria-da-sebastian','restaurante-mediterraneo-el-mojon')
      and (f.playground_distance_m is not null or f.fenced is not null or f.shade_available is not null or f.visible_from_seating is not null)
  ) then
    raise exception 'HOY Family stage-3 safety check failed: unverified geometry must remain unknown';
  end if;
end $$;

commit;
