-- HOY 2.40 family research seed — REVIEW BEFORE PRODUCTION IMPORT.
-- This file is intentionally NOT a migration and has not been executed against production.
-- Only exact restaurant_id matches from the 2026-08-16 research pass are included.
-- No row is marked hoy_verified because HOY has not performed an on-site check yet.

insert into public.restaurant_family_features (
  restaurant_id, play_types, relationship, access_type,
  playground_distance_m, distance_method, visible_from_seating, road_crossing,
  fenced, traffic_separated, shade_available, supervision_types,
  indoor_play_area, highchairs, changing_facility, kids_menu, stroller_friendly,
  suitable_age_min, suitable_age_max, notes,
  verification_status, source_count, source_url, source_label, verified_at
)
values
  (
    96,
    array['outdoor_playground']::text[],
    'nearby','unknown',
    null,'unknown',true,'unknown',
    null,null,null,array['parent']::text[],
    false,null,null,null,null,
    null,null,
    'Source explicitly states that the nearby playground can be supervised while eating. Exact distance, road crossing, fencing and shade still require HOY verification.',
    'source_verified',1,
    'https://pequemap.com/lugar/restaurante-la-plaza-en-santiago-de-la-ribera/',
    'PequeMap – terrace + nearby playground + supervision description',
    timestamptz '2026-08-16T08:00:00+02:00'
  ),
  (
    101,
    array['play_area']::text[],
    'on_premises','restaurant_customers',
    null,'unknown',null,'unknown',
    null,null,null,'{}'::text[],
    true,null,null,null,null,
    null,null,
    'Current business listing confirms zona infantil and terraza/jardín. Exact play equipment and sightline remain unverified.',
    'source_verified',1,
    'https://www.paginasamarillas.es/f/santiago-de-la-ribera/restaurante-miramar-la-ribera_156562076_000000006.html',
    'Páginas Amarillas – zona infantil + terraza/jardín',
    timestamptz '2026-08-16T08:00:00+02:00'
  ),
  (
    218,
    array['outdoor_playground']::text[],
    'on_premises','unknown',
    null,'unknown',null,'unknown',
    null,null,null,array['parent']::text[],
    false,null,null,null,null,
    null,null,
    'Two separate family reports describe children using the club kids park while adults use the restaurant. Access rules and direct sightline still require HOY verification.',
    'community_verified',2,
    'https://www.tripadvisor.com/Restaurant_Review-g1591386-d4745402-Reviews-Restaurante_Club_Deportivo_Mar_de_Cristal-Mar_de_Cristal_Municipality_of_Cartage.html',
    'Tripadvisor – two family reports about the kids park and restaurant',
    timestamptz '2026-08-16T08:00:00+02:00'
  )
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
