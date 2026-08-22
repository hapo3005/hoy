-- HOY Investor Ready RT-007 — first-party source_url replacement wave 1
-- Review simulation only. Net effect ALWAYS rolls back.
-- Baseline: 2026-08-19 live direct hard queue = 329.
--
-- This wave replaces 12 generic restaurant source_url values from RED/REVIEW_REQUIRED
-- third-party sources with each restaurant's already-recorded first-party website.
-- The destination hosts are already AMBER FIRST_PARTY_BUSINESS_REFERENCE with
-- factual_verification_allowed=true and replacement_required=false.

begin;

do $rt007_source_wave1_preflight$
declare
  v_exact integer;
  v_rights integer;
  v_hard_before integer;
begin
  select count(*) into v_exact
  from public.restaurants
  where (id=18  and source_url='https://www.tripadvisor.com/Restaurant_Review-g1087580-d23438095-Reviews-Cp8_Restaurante-Cabo_de_Palos_Municipality_of_Cartagena.html' and website='https://cp8restaurante.com/')
     or (id=19  and source_url='https://murciaplaza.com/murciaplaza/cartagena/el-restaurante-bocana-de-cabo-de-palos-crece-con-la-adquisicion-del-historico-el-pez-rojo-que-cierra-por-jubilacion' and website='https://elpezrojocabodepalos.wordpress.com/')
     or (id=98  and source_url='https://www.google.com/maps/search/?api=1&query=Currys+Nepali+Av.+Cartagena%2C+21%2C+30710+Los+Alc%C3%A1zares' and website='https://www.currysnepali.com/')
     or (id=110 and source_url='https://www.google.com/maps/search/?api=1&query=El+Rinc%C3%B3n+de+la+Hormiga+P.%C2%BA+de+la+Barra%2C+15%2C+30370+Cabo+de+Palos' and website='https://elrincondelahormiga.com/')
     or (id=116 and source_url='https://www.google.com/maps/search/?api=1&query=Pizzeria+Trattoria+Trastevere+Urb.+Manga+Beach%2C+Km+6%2C+30380+La+Manga' and website='https://trasteverelamanga.es/')
     or (id=133 and source_url='https://www.google.com/maps/search/?api=1&query=La+cangreja+Plaza+Virgen+del+Mar%2C+30370+Cabo+de+Palos' and website='https://lacangreja.com/cabo-de-palos/')
     or (id=135 and source_url='https://lasgastrocronicas.com/un-viaje-al-himalaya-en-el-mar-menor-annapurna-estrena-la-autentica-cocina-nepali-e-india-en-los-belones/' and website='https://www.annapurnanepali.com/')
     or (id=144 and source_url='https://www.google.com/maps/search/?api=1&query=Restaurante+Isla+Grosa+Gran+V%C3%ADa+de+la+Manga%2C+km+7%2C+30380+La+Manga' and website='https://restauranteislagrosalamanga.es/')
     or (id=192 and source_url='https://www.google.com/maps/search/?api=1&query=Pizzeria+la+Rucola+Av.+de+la+Libertad%2C+20%2C+30710+Los+Alc%C3%A1zares' and website='https://www.larucola.info/')
     or (id=196 and source_url='https://www.google.com/maps/search/?api=1&query=Pizzer%C3%ADa+Diavola+C.+Marcos+Sanz%2C+23%2C+30385+Los+Belones' and website='https://pizzeriadiavolalosbelones.es/')
     or (id=203 and source_url='https://www.google.com/maps/search/?api=1&query=La+Oliva+Restaurante+C.+Rosales%2C+1%2C+30384+Mar+de+Cristal' and website='https://restaurantelaoliva.com/')
     or (id=215 and source_url='https://www.tripadvisor.com/Restaurant_Review-g1087580-d34554854-Reviews-Cabo_de_Sal-Cabo_de_Palos_Municipality_of_Cartagena.html' and website='https://cabodesal.com/');

  if v_exact <> 12 then
    raise exception 'RT-007 source wave1 baseline drift: expected 12 exact source_url/website pairs, found %',v_exact;
  end if;

  with targets(id) as (values (18),(19),(98),(110),(116),(133),(135),(144),(192),(196),(203),(215)),
  q as (
    select r.id,lower(split_part(regexp_replace(r.website,'^https?://',''), '/',1)) as host
    from public.restaurants r join targets t using(id)
  )
  select count(*) into v_rights
  from q join private.source_rights_registry rr using(host)
  where rr.rights_status='AMBER'
    and rr.source_class='FIRST_PARTY_BUSINESS_REFERENCE'
    and rr.factual_verification_allowed=true
    and rr.persistent_copy_allowed=false
    and rr.public_reuse_allowed=false
    and rr.derivative_use_allowed=false
    and rr.commercial_use_allowed=false
    and rr.automated_collection_allowed=false
    and rr.replacement_required=false
    and rr.transferability='UNKNOWN'
    and rr.legal_review_status='BUSINESS_TERMS_REQUIRED';

  if v_rights <> 12 then
    raise exception 'RT-007 source wave1 rights drift: expected 12 conservative first-party AMBER hosts, found %',v_rights;
  end if;

  with refs as (
    select r.id as restaurant_id,v.url,
           lower(split_part(regexp_replace(v.url,'^https?://',''), '/',1)) as host
    from public.restaurants r
    cross join lateral (values (r.source_url),(r.location_source_url),(r.hours_source_url),(r.signature_source_url)) v(url)
    where v.url is not null and v.url<>''
  )
  select count(*) into v_hard_before
  from refs left join private.source_rights_registry rr using(host)
  where rr.host is null or rr.rights_status in ('RED','REVIEW_REQUIRED');

  if v_hard_before <> 329 then
    raise exception 'RT-007 source wave1 hard-queue drift: expected 329 before dry-run, got %',v_hard_before;
  end if;
end
$rt007_source_wave1_preflight$;

with targets(id) as (values (18),(19),(98),(110),(116),(133),(135),(144),(192),(196),(203),(215))
update public.restaurants r
set source_url=r.website
from targets t
where r.id=t.id;

do $rt007_source_wave1_postflight$
declare
  v_replaced integer;
  v_hard_after integer;
begin
  with targets(id) as (values (18),(19),(98),(110),(116),(133),(135),(144),(192),(196),(203),(215)),
  q as (
    select r.id,r.source_url,r.website,
           lower(split_part(regexp_replace(r.source_url,'^https?://',''), '/',1)) as host
    from public.restaurants r join targets t using(id)
  )
  select count(*) into v_replaced
  from q join private.source_rights_registry rr using(host)
  where q.source_url=q.website
    and rr.rights_status='AMBER'
    and rr.source_class='FIRST_PARTY_BUSINESS_REFERENCE'
    and rr.factual_verification_allowed=true
    and rr.replacement_required=false;

  if v_replaced <> 12 then
    raise exception 'RT-007 source wave1 postflight failed: %/12 first-party replacements',v_replaced;
  end if;

  with refs as (
    select r.id as restaurant_id,v.url,
           lower(split_part(regexp_replace(v.url,'^https?://',''), '/',1)) as host
    from public.restaurants r
    cross join lateral (values (r.source_url),(r.location_source_url),(r.hours_source_url),(r.signature_source_url)) v(url)
    where v.url is not null and v.url<>''
  )
  select count(*) into v_hard_after
  from refs left join private.source_rights_registry rr using(host)
  where rr.host is null or rr.rights_status in ('RED','REVIEW_REQUIRED');

  if v_hard_after <> 317 then
    raise exception 'RT-007 source wave1 expected hard queue 317 after dry-run, got %',v_hard_after;
  end if;
end
$rt007_source_wave1_postflight$;

-- Safety invariant: never persist this review simulation.
rollback;
