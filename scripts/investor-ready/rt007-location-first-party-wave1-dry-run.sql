-- HOY Investor Ready RT-007 — exact first-party location replacement wave 1
-- Review simulation only. Net effect ALWAYS rolls back.
--
-- Only exact address matches are included:
--   98  Currys Nepali -> Avenida Cartagena 21, Los Alcazares
--   135 Annapurna Nepali Restaurant -> Calle Mayor 67, Los Belones
--   196 Pizzeria Diavola -> Calle Marcos Sanz 23, Los Belones
--   215 Cabo de Sal -> C. los Palangres, Cabo de Palos
-- Other screened location opportunities remain unapproved until the official page
-- supports the stored location with comparable specificity.

begin;

do $rt007_location_wave1_preflight$
declare
  v_exact integer;
  v_rights integer;
  v_hard_before integer;
begin
  select count(*) into v_exact
  from public.restaurants
  where (
      id=98
      and address='Av. Cartagena, 21, 30710 Los Alcázares'
      and location_source_url='https://www.google.com/maps/search/?api=1&query=Currys+Nepali+Av.+Cartagena%2C+21%2C+30710+Los+Alc%C3%A1zares'
      and website='https://www.currysnepali.com/'
    ) or (
      id=135
      and address='C. Mayor, 67, 30385 Los Belones'
      and location_source_url='https://www.google.com/maps/search/?api=1&query=Annapurna+Nepali+Restaurant+C.+Mayor%2C+67%2C+30385+Los+Belones'
      and website='https://www.annapurnanepali.com/'
    ) or (
      id=196
      and address='C. Marcos Sanz, 23, 30385 Los Belones'
      and location_source_url='https://www.google.com/maps/search/?api=1&query=Pizzer%C3%ADa+Diavola+C.+Marcos+Sanz%2C+23%2C+30385+Los+Belones'
      and website='https://pizzeriadiavolalosbelones.es/'
    ) or (
      id=215
      and address='C. los Palangres, 30370 Cabo de Palos'
      and location_source_url='https://www.google.com/maps/search/?api=1&query=Cabo+de+Sal+C.+los+Palangres%2C+30370+Cabo+de+Palos'
      and website='https://cabodesal.com/'
    );

  if v_exact <> 4 then
    raise exception 'RT-007 location wave1 baseline drift: expected 4 exact HOY rows, found %',v_exact;
  end if;

  with targets(id) as (values (98),(135),(196),(215)), q as (
    select r.id,lower(split_part(regexp_replace(r.website,'^https?://',''), '/',1)) as host
    from public.restaurants r join targets t using(id)
  )
  select count(*) into v_rights
  from q join private.source_rights_registry rr using(host)
  where rr.rights_status='AMBER'
    and rr.source_class='FIRST_PARTY_BUSINESS_REFERENCE'
    and rr.factual_verification_allowed=true
    and rr.replacement_required=false
    and rr.transferability='UNKNOWN'
    and rr.legal_review_status='BUSINESS_TERMS_REQUIRED';

  if v_rights <> 4 then
    raise exception 'RT-007 location wave1 rights drift: expected 4 conservative first-party AMBER hosts, found %',v_rights;
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
    raise exception 'RT-007 location wave1 hard-queue drift: expected 329 before dry-run, got %',v_hard_before;
  end if;
end
$rt007_location_wave1_preflight$;

update public.restaurants set location_source_url='https://www.currysnepali.com/' where id=98;
update public.restaurants set location_source_url='https://www.annapurnanepali.com/' where id=135;
update public.restaurants set location_source_url='https://pizzeriadiavolalosbelones.es/' where id=196;
update public.restaurants set location_source_url='https://cabodesal.com/' where id=215;

do $rt007_location_wave1_postflight$
declare
  v_replaced integer;
  v_hard_after integer;
begin
  with targets(id) as (values (98),(135),(196),(215)), q as (
    select r.id,r.location_source_url,
           lower(split_part(regexp_replace(r.location_source_url,'^https?://',''), '/',1)) as host
    from public.restaurants r join targets t using(id)
  )
  select count(*) into v_replaced
  from q join private.source_rights_registry rr using(host)
  where rr.rights_status='AMBER'
    and rr.source_class='FIRST_PARTY_BUSINESS_REFERENCE'
    and rr.factual_verification_allowed=true
    and rr.replacement_required=false;

  if v_replaced <> 4 then
    raise exception 'RT-007 location wave1 postflight failed: %/4 first-party locations',v_replaced;
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

  if v_hard_after <> 325 then
    raise exception 'RT-007 location wave1 expected hard queue 325 after dry-run, got %',v_hard_after;
  end if;
end
$rt007_location_wave1_postflight$;

rollback;
