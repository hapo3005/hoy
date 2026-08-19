-- HOY Investor Ready RT-007 — first-party location replacement wave 4
-- Review simulation only. Net effect ALWAYS rolls back.
-- Scope: two published records whose official first-party contact pages publish
-- the stored HOY street/number. Provenance only; address/coordinates/status/precision unchanged.

begin;

do $rt007_location_wave4_preflight$
declare
  v_exact integer;
  v_rights integer;
  v_hard_before integer;
  v_published_hard_before integer;
begin
  select count(*) into v_exact
  from public.restaurants
  where (
      id=192 and is_published=true
      and address='Av. de la Libertad, 20, 30710 Los Alcázares'
      and location_source_url='https://www.google.com/maps/search/?api=1&query=Pizzeria+la+Rucola+Av.+de+la+Libertad%2C+20%2C+30710+Los+Alc%C3%A1zares'
      and location_status='verified' and location_precision='poi'
    ) or (
      id=203 and is_published=true
      and address='C. Rosales, 1, 30384 Mar de Cristal'
      and location_source_url='https://www.google.com/maps/search/?api=1&query=La+Oliva+Restaurante+C.+Rosales%2C+1%2C+30384+Mar+de+Cristal'
      and location_status='verified' and location_precision='address'
    );
  if v_exact <> 2 then
    raise exception 'RT-007 location wave4 baseline drift: expected 2 exact published Production rows, found %',v_exact;
  end if;

  select count(*) into v_rights
  from private.source_rights_registry
  where host in ('www.larucola.info','restaurantelaoliva.com')
    and rights_status='AMBER'
    and source_class='FIRST_PARTY_BUSINESS_REFERENCE'
    and factual_verification_allowed=true
    and replacement_required=false
    and transferability='UNKNOWN'
    and legal_review_status='BUSINESS_TERMS_REQUIRED';
  if v_rights <> 2 then
    raise exception 'RT-007 location wave4 rights drift: expected 2 conservative first-party AMBER hosts, found %',v_rights;
  end if;

  with refs as (
    select r.id as restaurant_id,r.is_published,v.url,
           lower(split_part(regexp_replace(v.url,'^https?://',''), '/',1)) as host
    from public.restaurants r
    cross join lateral (values (r.source_url),(r.location_source_url),(r.hours_source_url),(r.signature_source_url)) v(url)
    where v.url is not null and v.url<>''
  )
  select count(*),count(*) filter(where refs.is_published)
    into v_hard_before,v_published_hard_before
  from refs left join private.source_rights_registry rr using(host)
  where rr.host is null or rr.rights_status in ('RED','REVIEW_REQUIRED');
  if v_hard_before <> 329 or v_published_hard_before <> 324 then
    raise exception 'RT-007 location wave4 hard-queue drift: expected total/published 329/324, got %/%',v_hard_before,v_published_hard_before;
  end if;
end
$rt007_location_wave4_preflight$;

update public.restaurants
set location_source_url='https://www.larucola.info/contacto/',
    location_source_label='La Rucola · offizielle Kontaktseite'
where id=192;

update public.restaurants
set location_source_url='https://restaurantelaoliva.com/contacto/',
    location_source_label='La Oliva · offizielle Kontaktseite'
where id=203;

do $rt007_location_wave4_postflight$
declare
  v_replaced integer;
  v_hard_after integer;
  v_published_hard_after integer;
begin
  with q as (
    select r.id,r.is_published,r.location_source_url,
           lower(split_part(regexp_replace(r.location_source_url,'^https?://',''), '/',1)) as host
    from public.restaurants r where r.id in (192,203)
  )
  select count(*) into v_replaced
  from q join private.source_rights_registry rr using(host)
  where q.is_published=true
    and rr.rights_status='AMBER'
    and rr.source_class='FIRST_PARTY_BUSINESS_REFERENCE'
    and rr.factual_verification_allowed=true
    and rr.replacement_required=false
    and rr.transferability='UNKNOWN'
    and rr.legal_review_status='BUSINESS_TERMS_REQUIRED';
  if v_replaced <> 2 then
    raise exception 'RT-007 location wave4 postflight failed: %/2 published first-party AMBER refs',v_replaced;
  end if;

  with refs as (
    select r.id as restaurant_id,r.is_published,v.url,
           lower(split_part(regexp_replace(v.url,'^https?://',''), '/',1)) as host
    from public.restaurants r
    cross join lateral (values (r.source_url),(r.location_source_url),(r.hours_source_url),(r.signature_source_url)) v(url)
    where v.url is not null and v.url<>''
  )
  select count(*),count(*) filter(where refs.is_published)
    into v_hard_after,v_published_hard_after
  from refs left join private.source_rights_registry rr using(host)
  where rr.host is null or rr.rights_status in ('RED','REVIEW_REQUIRED');
  if v_hard_after <> 327 or v_published_hard_after <> 322 then
    raise exception 'RT-007 location wave4 expected total/published hard queue 327/322 after dry-run, got %/%',v_hard_after,v_published_hard_after;
  end if;
end
$rt007_location_wave4_postflight$;

rollback;
