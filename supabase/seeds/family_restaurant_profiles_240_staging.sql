-- HOY 2.40 Family restaurant profile staging — REVIEW BEFORE ANY EXECUTION.
-- NOT executed against production.
-- Purpose: create unpublished/draft base profiles for current in-scope Family research leads
-- without guessing restaurant IDs, addresses, coordinates, hours or publication readiness.
--
-- Safety properties:
-- 1) newly discovered profiles are always is_published=false and profile_quality='draft';
-- 2) IDs come from restaurants_id_seq, never hard-coded guessed IDs;
-- 3) the sequence is first aligned to at least max(restaurants.id), because the 2026-08-16
--    production snapshot had max(id)=241 while restaurants_id_seq.last_value=240;
-- 4) existing slug/name matches are not duplicated;
-- 5) status-conflict, historical-only, outside-scope and closed leads are intentionally absent.

begin;

select setval(
  pg_get_serial_sequence('public.restaurants','id'),
  greatest(
    coalesce((select max(id) from public.restaurants),0),
    (select last_value from public.restaurants_id_seq)
  ),
  true
);

with staged(slug,name,area,municipality,venue_type,source_url) as (
  values
    ('restaurante-bamboo-la-manga','Restaurante Bamboo','La Manga del Mar Menor',null,'restaurant','https://wanderlog.com/es/place/details/4082950/restaurante-braser%C3%ADa-bamboo-la-manga'),
    ('la-tap-pizzella','La Tap-Pizzella','La Manga del Mar Menor',null,'restaurant','https://viviendolamanga.es/directorios/la-tap-pizzella/'),
    ('la-vaca-gallega','La Vaca Gallega','La Manga del Mar Menor','San Javier','restaurant','https://www.paginasamarillas.es/f/la-manga-del-mar-menor/la-vaca-gallega_222495921_000000001.html'),
    ('si-bar-restaurant','Si! Bar & Restaurant','La Manga Club / Atamaría','Cartagena','bar','https://www.si-bar.eu/'),
    ('la-rusticana','La Rusticana','La Manga Club / Atamaría','Cartagena','restaurant','https://la-rusticana-restaurante-y-bar1.webnode.es/'),
    ('venta-el-sabinar','Venta El Sabinar','Los Belones','Cartagena','restaurant','https://www.losbelones.com/sitios/venta-el-sabinar/'),
    ('marea-narejos','Marea Narejos','Los Alcázares / Los Narejos','Los Alcázares','restaurant','https://www.mareanarejos.com/'),
    ('restaurante-la-encarnacion','Restaurante La Encarnación','Los Alcázares / Los Narejos','Los Alcázares','restaurant','https://www.tripadvisor.es/Restaurant_Review-g736856-d2213732-Reviews-Restaurante_La_Encarnacion-Los_Alcazares.html'),
    ('casa-lucrecia','Casa Lucrecia','San Pedro del Pinatar / Lo Pagán','San Pedro del Pinatar','restaurant','https://www.sluurpy.com/es/san-pedro-del-pinatar/restaurant/1966483/casa-lucrecia/reviews'),
    ('mardesal','MardeSal','San Pedro del Pinatar / Lo Pagán','San Pedro del Pinatar','restaurant','https://es.restaurantguru.com/Mardesal-San-Pedro-del-Pinatar'),
    ('chiringuito-calisto','Chiringuito Calisto','San Pedro del Pinatar / Lo Pagán','San Pedro del Pinatar','chiringuito','https://www.sluurpy.es/san-pedro-del-pinatar/restaurant/1966527/chiringuito-calisto/reviews'),
    ('porto-chico','Porto Chico','San Pedro del Pinatar / Lo Pagán','San Pedro del Pinatar','restaurant','https://www.paginasamarillas.es/f/los-cuarteros/porto-chico_222143190_000000001.html'),
    ('confiteria-cafe-jose-antonio','Confitería Café José Antonio','San Pedro del Pinatar / Lo Pagán','San Pedro del Pinatar','cafe','https://www.tripadvisor.es/Restaurant_Review-g644341-d12414055-Reviews-Confiteria_Cafe_Jose_Antonio-San_Pedro_del_Pinatar.html'),

    -- Current/likely-active leads whose Family claim is NOT seed-ready yet.
    ('restaurante-imperial-la-manga','Restaurante Imperial','La Manga del Mar Menor',null,'restaurant','https://www.tripadvisor.es/Restaurant_Review-g642228-d14032096-Reviews-Imperial_La_Manga-La_Manga_del_Mar_Menor_Municipality_of_Cartagena.html'),
    ('kinita-restaurant-beach-club','Kinita Restaurant & Beach Club','Los Alcázares / Los Narejos',null,'beach_club','https://www.kinitarestaurant.com/'),
    ('pizzeria-da-sebastian','Pizzería Da Sebastián','La Manga del Mar Menor',null,'restaurant','https://es.restaurantguru.com/Pizzeria-Da-Sebastian-La-Manga-Spain-2'),
    ('pizzeria-nicos-bar','Pizzeria Nico''s Bar','San Pedro del Pinatar / Lo Pagán','San Pedro del Pinatar','restaurant','https://wanderlog.com/place/details/2936580/pizzeria-nicos-bar'),
    ('restaurante-mediterraneo-el-mojon','Restaurante Mediterráneo El Mojón','San Pedro del Pinatar / Lo Pagán','San Pedro del Pinatar','restaurant','https://restaurantguru.com/kids-play-area-San-Pedro-del-Pinatar-m10768')
), to_insert as (
  select s.*
  from staged s
  where not exists (
    select 1
    from public.restaurants r
    where r.slug=s.slug or lower(btrim(r.name))=lower(btrim(s.name))
  )
)
insert into public.restaurants (
  id,slug,name,area,municipality,venue_type,
  is_published,profile_quality,
  source_url,source_label,source_checked_at,
  location_status,hours_status,menu_expectation,menu_expectation_source
)
select
  nextval(pg_get_serial_sequence('public.restaurants','id')),
  slug,name,area,municipality,venue_type,
  false,'draft',
  source_url,'HOY Family research staging · 2026-08-16',date '2026-08-16',
  'not_checked','missing','unknown','manual'
from to_insert
on conflict (slug) do nothing;

-- Guardrail: this staging script must never publish a profile by itself.
do $$
begin
  if exists (
    select 1 from public.restaurants
    where slug in (
      'restaurante-bamboo-la-manga','la-tap-pizzella','la-vaca-gallega','si-bar-restaurant','la-rusticana',
      'venta-el-sabinar','marea-narejos','restaurante-la-encarnacion','casa-lucrecia','mardesal',
      'chiringuito-calisto','porto-chico','confiteria-cafe-jose-antonio','restaurante-imperial-la-manga',
      'kinita-restaurant-beach-club','pizzeria-da-sebastian','pizzeria-nicos-bar','restaurante-mediterraneo-el-mojon'
    ) and is_published=true
  ) then
    raise exception 'HOY Family staging safety check failed: a staged profile is published';
  end if;
end $$;

commit;
