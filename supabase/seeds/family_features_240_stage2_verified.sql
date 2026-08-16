-- HOY 2.40 Family feature seed, stage 2 — REVIEW BEFORE ANY EXECUTION.
-- NOT executed against production.
-- Prerequisites:
--   1) 20260816_family_playgrounds_240.sql migration has been applied to the target environment;
--   2) family_restaurant_profiles_240_staging.sql has been reviewed/applied in the same target environment.
--
-- This file deliberately resolves restaurant IDs by stable slug at execution time.
-- No row is hoy_verified. Unknown geometry/access facts remain null/unknown.

begin;

do $$
declare
  missing_slugs text;
begin
  with expected(slug) as (
    values
      ('restaurante-la-plaza'),('restaurante-miramar-la-ribera'),('restaurante-club-deportivo-mar-de-cristal'),
      ('aquarium-la-manga-club-resort'),('restaurante-bamboo-la-manga'),('la-tap-pizzella'),('la-vaca-gallega'),
      ('si-bar-restaurant'),('la-rusticana'),('venta-el-sabinar'),('marea-narejos'),('restaurante-la-encarnacion'),
      ('casa-lucrecia'),('mardesal'),('chiringuito-calisto'),('porto-chico'),('confiteria-cafe-jose-antonio')
  )
  select string_agg(e.slug, ', ' order by e.slug)
  into missing_slugs
  from expected e
  left join public.restaurants r on r.slug=e.slug
  where r.id is null;

  if missing_slugs is not null then
    raise exception 'HOY Family seed aborted: missing restaurant slugs: %', missing_slugs;
  end if;
end $$;

with verified(
  slug,play_types,relationship,access_type,visible_from_seating,road_crossing,
  supervision_types,indoor_play_area,kids_menu,
  verification_status,source_count,source_url,source_label,notes
) as (
  values
    ('restaurante-la-plaza',array['outdoor_playground']::text[],'nearby','unknown',true,'unknown','{}'::text[],null,null,'source_verified',1,
      'https://pequemap.com/lugar/restaurante-la-plaza-en-santiago-de-la-ribera/',
      'PequeMap · terrace + nearby playground + supervision description',
      'Source states that the nearby playground can be supervised while eating. Exact distance, route, fencing and shade remain open.'),

    ('restaurante-miramar-la-ribera',array['play_area']::text[],'on_premises','unknown',null,'unknown','{}'::text[],null,null,'source_verified',1,
      'https://www.paginasamarillas.es/f/santiago-de-la-ribera/restaurante-miramar-la-ribera_156562076_000000006.html',
      'Páginas Amarillas · zona infantil + terraza/jardín',
      'Current listing confirms zona infantil and terrace/garden. Indoor/outdoor type, access rules and sightline remain open.'),

    ('restaurante-club-deportivo-mar-de-cristal',array['outdoor_playground']::text[],'on_premises','unknown',null,'unknown',array['parent']::text[],null,null,'community_verified',2,
      'https://www.tripadvisor.com/Restaurant_Review-g1591386-d4745402-Reviews-Restaurante_Club_Deportivo_Mar_de_Cristal-Mar_de_Cristal_Municipality_of_Cartage.html',
      'Tripadvisor · two family reports about kids park + restaurant',
      'Two family observations describe children using the club play area while adults use the restaurant. Access and direct sightline remain open.'),

    ('aquarium-la-manga-club-resort',array['play_area']::text[],'on_premises','unknown',null,'none','{}'::text[],null,null,'source_verified',1,
      'https://lamanga.club/ads/food-and-drink/',
      'LaManga.club · current Aquarium listing with children play area',
      'Current venue listing describes a dedicated children play area within the restaurant venue. Exact layout and sightline remain open.'),

    ('restaurante-bamboo-la-manga',array['amusement_park','inflatable']::text[],'directly_adjacent','paid',null,'unknown',array['parent']::text[],null,null,'source_verified',1,
      'https://wanderlog.com/es/place/details/4082950/restaurante-braser%C3%ADa-bamboo-la-manga',
      'Current review aggregation · Bamboo/Peke Park family use',
      'Family evidence links the restaurant experience to the adjacent commercial Peke Park offer. Ticket model and table sightline remain open.'),

    ('la-tap-pizzella',array['amusement_park']::text[],'directly_adjacent','paid',null,'unknown',array['parent']::text[],null,null,'source_verified',1,
      'https://viviendolamanga.es/directorios/la-tap-pizzella/',
      'Viviendo La Manga · directly beside Peke Park',
      'Current local listing explicitly positions the venue beside Peke Park for adults to eat/drink while children use the attractions. Sightline remains open.'),

    ('la-vaca-gallega',array['play_area']::text[],'on_premises','unknown',null,'unknown','{}'::text[],null,true,'source_verified',1,
      'https://www.paginasamarillas.es/f/la-manga-del-mar-menor/la-vaca-gallega_222495921_000000001.html',
      'Páginas Amarillas · zona infantil + terraza/jardín + menú infantil',
      'Current listing confirms a children play area, terrace/garden and children menu. Play-area type and sightline remain open.'),

    ('si-bar-restaurant',array['play_area']::text[],'on_premises','unknown',null,'none','{}'::text[],null,null,'operator_confirmed',1,
      'https://www.si-bar.eu/',
      'Si! Bar · operator website family garden/play information',
      'Operator source confirms a garden play offer; seasonal entertainment elements must stay separate from permanent play facts.'),

    ('la-rusticana',array['outdoor_playground','indoor_playroom']::text[],'on_premises','unknown',null,'none',array['parent']::text[],true,null,'operator_confirmed',1,
      'https://la-rusticana-restaurante-y-bar1.webnode.es/',
      'La Rusticana · operator website outdoor + indoor play',
      'Operator source confirms both outdoor playground and indoor play area. Access rules and exact terrace sightline remain open.'),

    ('venta-el-sabinar',array['outdoor_playground']::text[],'on_premises','unknown',null,'none',array['parent']::text[],null,null,'source_verified',2,
      'https://www.losbelones.com/sitios/venta-el-sabinar/',
      'LosBelones.com + recent community observations · own playground',
      'Local current source explicitly describes a large children playground while adults eat; recent community observations confirm the play area belongs to the venue.'),

    ('marea-narejos',array['splash','minigolf']::text[],'on_premises','paid',null,'none',array['parent']::text[],null,null,'operator_confirmed',1,
      'https://www.mareanarejos.com/',
      'Marea Narejos · operator website restaurant + Splash + minigolf',
      'Operator source confirms restaurant, Splash and minigolf in the same offer. Activity pricing/access and restaurant sightline remain context-specific.'),

    ('restaurante-la-encarnacion',array['outdoor_playground']::text[],'directly_adjacent','unknown',null,'unknown',array['parent']::text[],null,null,'source_verified',1,
      'https://www.tripadvisor.es/Restaurant_Review-g736856-d2213732-Reviews-Restaurante_La_Encarnacion-Los_Alcazares.html',
      'Recent family review · playground beside restaurant',
      'Recent family evidence describes a playground directly beside the restaurant. Exact route, access and sightline still require HOY verification.'),

    ('casa-lucrecia',array['play_area','indoor_playroom']::text[],'on_premises','restaurant_customers',null,'none',array['staff','camera']::text[],true,null,'community_verified',2,
      'https://www.sluurpy.com/es/san-pedro-del-pinatar/restaurant/1966483/casa-lucrecia/reviews',
      'Recent community reports · play area + monitoring',
      'Recent independent reports describe the play area within the venue plus staff/camera monitoring. Staff supervision must still be operator-confirmed before being presented as guaranteed.'),

    ('mardesal',array['outdoor_playground']::text[],'directly_adjacent','unknown',null,'unknown',array['parent']::text[],null,null,'source_verified',1,
      'https://es.restaurantguru.com/Mardesal-San-Pedro-del-Pinatar',
      'Recent review aggregation · playground beside MardeSal',
      'Very recent family observation says the playground is beside the restaurant. Ownership, route and table sightline remain open.'),

    ('chiringuito-calisto',array['outdoor_playground']::text[],'directly_adjacent','unknown',null,'unknown',array['parent']::text[],null,null,'community_verified',2,
      'https://www.sluurpy.es/san-pedro-del-pinatar/restaurant/1966527/chiringuito-calisto/reviews',
      'Recent community reports · playground beside chiringuito',
      'Multiple recent observations describe children play areas immediately beside/around the chiringuito. Exact playground identity and sightline remain open.'),

    ('porto-chico',array['play_area']::text[],'on_premises','unknown',null,'unknown','{}'::text[],null,null,'source_verified',1,
      'https://www.paginasamarillas.es/f/los-cuarteros/porto-chico_222143190_000000001.html',
      'Páginas Amarillas · current zona infantil + terraza/jardín',
      'Current listing confirms a children area plus terrace/garden. Play-area type, access and sightline remain open.'),

    ('confiteria-cafe-jose-antonio',array['play_area']::text[],'on_premises','unknown',null,'unknown','{}'::text[],null,null,'source_verified',1,
      'https://www.tripadvisor.es/Restaurant_Review-g644341-d12414055-Reviews-Confiteria_Cafe_Jose_Antonio-San_Pedro_del_Pinatar.html',
      'Current venue description · parque infantil',
      'Current listing describes the cafe itself as having a children playground. Exact play type, equipment and sightline remain open.')
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
  r.id,v.play_types,v.relationship,v.access_type,
  null,'unknown',v.visible_from_seating,v.road_crossing,
  null,null,null,v.supervision_types,
  v.indoor_play_area,null,null,v.kids_menu,null,
  null,null,v.notes,
  v.verification_status,v.source_count,v.source_url,v.source_label,
  timestamptz '2026-08-16T11:00:00+02:00'
from verified v
join public.restaurants r on r.slug=v.slug
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

-- Explicit invariant: this research import is not allowed to self-award HOY verification.
do $$
begin
  if exists (
    select 1 from public.restaurant_family_features f
    join public.restaurants r on r.id=f.restaurant_id
    where r.slug in (
      'restaurante-la-plaza','restaurante-miramar-la-ribera','restaurante-club-deportivo-mar-de-cristal',
      'aquarium-la-manga-club-resort','restaurante-bamboo-la-manga','la-tap-pizzella','la-vaca-gallega',
      'si-bar-restaurant','la-rusticana','venta-el-sabinar','marea-narejos','restaurante-la-encarnacion',
      'casa-lucrecia','mardesal','chiringuito-calisto','porto-chico','confiteria-cafe-jose-antonio'
    ) and f.verification_status='hoy_verified'
  ) then
    raise exception 'HOY Family seed safety check failed: research data cannot be hoy_verified';
  end if;
end $$;

commit;
