-- ACQ-06 Region-1 T0 readiness audit
-- READ ONLY. No DDL/DML. Region 1 is the full defined Mar Menor footprint.

with region1_areas(area) as (
  values
    ('Cabo de Palos'),
    ('La Manga Club / Atamaría'),
    ('La Manga del Mar Menor'),
    ('Los Alcázares / Los Narejos'),
    ('Los Belones'),
    ('Los Urrutias / Estrella de Mar / Los Nietos'),
    ('Mar de Cristal / Islas Menores'),
    ('San Pedro del Pinatar / Lo Pagán'),
    ('Santiago de la Ribera / San Javier')
),
region1 as (
  select r.*
  from public.restaurants r
  join region1_areas a on a.area=r.area
),
published as (
  select * from region1 where is_published
)
select
  count(*)::bigint as current_total,
  count(*) filter (where is_published)::bigint as current_published,
  169::bigint as frozen_t0_total,
  166::bigint as frozen_t0_published,
  count(*)::bigint - 169::bigint as total_drift,
  count(*) filter (where is_published)::bigint - 166::bigint as published_drift
from region1;

with region1_areas(area) as (
  values
    ('Cabo de Palos'),('La Manga Club / Atamaría'),('La Manga del Mar Menor'),
    ('Los Alcázares / Los Narejos'),('Los Belones'),
    ('Los Urrutias / Estrella de Mar / Los Nietos'),('Mar de Cristal / Islas Menores'),
    ('San Pedro del Pinatar / Lo Pagán'),('Santiago de la Ribera / San Javier')
)
select r.area,
       count(*) filter (where r.is_published)::bigint as published,
       count(*)::bigint as total
from public.restaurants r
join region1_areas a on a.area=r.area
group by r.area
order by r.area;

with region1_areas(area) as (
  values
    ('Cabo de Palos'),('La Manga Club / Atamaría'),('La Manga del Mar Menor'),
    ('Los Alcázares / Los Narejos'),('Los Belones'),
    ('Los Urrutias / Estrella de Mar / Los Nietos'),('Mar de Cristal / Islas Menores'),
    ('San Pedro del Pinatar / Lo Pagán'),('Santiago de la Ribera / San Javier')
),
published as (
  select r.* from public.restaurants r join region1_areas a on a.area=r.area where r.is_published
)
select
  count(*)::bigint as published,
  count(*) filter(where nullif(btrim(phone),'') is not null)::bigint as with_phone,
  count(*) filter(where nullif(btrim(website),'') is not null)::bigint as with_website,
  count(*) filter(where latitude is not null and longitude is not null)::bigint as with_coordinates,
  count(*) filter(where location_status='verified')::bigint as location_verified,
  count(*) filter(where hours_weekly is not null)::bigint as structured_hours,
  count(*) filter(where hours_status='verified')::bigint as hours_verified,
  count(*) filter(where profile_quality='premium')::bigint as profile_premium
from published;

with region1_areas(area) as (
  values
    ('Cabo de Palos'),('La Manga Club / Atamaría'),('La Manga del Mar Menor'),
    ('Los Alcázares / Los Narejos'),('Los Belones'),
    ('Los Urrutias / Estrella de Mar / Los Nietos'),('Mar de Cristal / Islas Menores'),
    ('San Pedro del Pinatar / Lo Pagán'),('Santiago de la Ribera / San Javier')
),
published as (
  select r.id from public.restaurants r join region1_areas a on a.area=r.area where r.is_published
)
select
  count(distinct ms.restaurant_id)::bigint as restaurants_with_menu_source,
  count(distinct ms.restaurant_id) filter(where ms.is_official)::bigint as restaurants_with_official_menu_source,
  count(distinct ms.restaurant_id) filter(where ms.completeness_status in ('complete','sufficient'))::bigint as restaurants_with_sufficient_menu_source
from public.menu_sources ms
join published p on p.id=ms.restaurant_id;

with region1_areas(area) as (
  values
    ('Cabo de Palos'),('La Manga Club / Atamaría'),('La Manga del Mar Menor'),
    ('Los Alcázares / Los Narejos'),('Los Belones'),
    ('Los Urrutias / Estrella de Mar / Los Nietos'),('Mar de Cristal / Islas Menores'),
    ('San Pedro del Pinatar / Lo Pagán'),('Santiago de la Ribera / San Javier')
),
published as (
  select r.id from public.restaurants r join region1_areas a on a.area=r.area where r.is_published
)
select
  count(distinct ra.restaurant_id)::bigint as restaurants_with_accessibility_row,
  count(distinct raf.restaurant_id) filter(where raf.is_current)::bigint as restaurants_with_current_accessibility_fact,
  count(*) filter(where raf.is_current)::bigint as current_accessibility_facts
from published p
left join public.restaurant_accessibility ra on ra.restaurant_id=p.id
left join public.restaurant_accessibility_facts raf on raf.restaurant_id=p.id;

with region1_areas(area) as (
  values
    ('Cabo de Palos'),('La Manga Club / Atamaría'),('La Manga del Mar Menor'),
    ('Los Alcázares / Los Narejos'),('Los Belones'),
    ('Los Urrutias / Estrella de Mar / Los Nietos'),('Mar de Cristal / Islas Menores'),
    ('San Pedro del Pinatar / Lo Pagán'),('Santiago de la Ribera / San Javier')
),
published as (
  select r.id from public.restaurants r join region1_areas a on a.area=r.area where r.is_published
)
select
  (select count(distinct m.restaurant_id) from public.restaurant_memberships m join published p on p.id=m.restaurant_id where m.verified_at is not null)::bigint as restaurants_with_verified_membership,
  (select count(*) from public.restaurant_entitlements e join published p on p.id=e.restaurant_id where e.operator_verified)::bigint as operator_verified_entitlements,
  (select count(*) from public.restaurant_live_hours h join published p on p.id=h.restaurant_id)::bigint as live_hours_rows,
  (select count(*) from public.restaurant_services s join published p on p.id=s.restaurant_id where s.confirmed_at is not null)::bigint as services_confirmed_rows,
  (select count(*) from private.business_data_confirmations b join published p on p.id=b.restaurant_id where b.status='active')::bigint as active_rights_backed_confirmations;

with region1_areas(area) as (
  values
    ('Cabo de Palos'),('La Manga Club / Atamaría'),('La Manga del Mar Menor'),
    ('Los Alcázares / Los Narejos'),('Los Belones'),
    ('Los Urrutias / Estrella de Mar / Los Nietos'),('Mar de Cristal / Islas Menores'),
    ('San Pedro del Pinatar / Lo Pagán'),('Santiago de la Ribera / San Javier')
),
published as (
  select r.id from public.restaurants r join region1_areas a on a.area=r.area where r.is_published
)
select
  count(*)::bigint as sales_pipeline_rows,
  count(*) filter(where coalesce(nullif(btrim(v.contact_phone),''),nullif(btrim(v.contact_email),''),nullif(btrim(v.contact_instagram),''),nullif(btrim(v.contact_website),'')) is not null)::bigint as rows_with_direct_contact,
  count(*) filter(where coalesce(v.send_lock,true))::bigint as effectively_send_locked,
  count(*) filter(where v.send_authorized_at is not null)::bigint as send_authorized
from public.venue_sales_pipeline v
join published p on p.id=v.restaurant_id;
