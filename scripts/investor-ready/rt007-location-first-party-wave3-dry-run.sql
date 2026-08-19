-- HOY Investor Ready RT-007 — first-party location replacement wave 3
-- Review simulation only. Net effect ALWAYS rolls back.
--
-- Four records are included because the current official operator page visibly
-- publishes a location matching the stored HOY address core. This candidate
-- changes provenance routing only; address, coordinates, status and precision stay unchanged.

begin;

do $rt007_location_wave3_preflight$
declare
  v_exact integer;
  v_rights integer;
  v_hard_before integer;
begin
  select count(*) into v_exact
  from public.restaurants
  where (
      id=181
      and address='Las Sabinas 1, 30389 La Manga Club'
      and website='https://www.fluteloungebar.com/'
      and location_source_url='https://www.google.com/maps/search/?api=1&query=Flute+Lounge+Bar+Las+Sabinas+1%2C+30389+La+Manga+Club'
    ) or (
      id=185
      and address='Pl. Cala Flores, Local 21, 30370 Cabo de Palos'
      and website='https://tabernasiroco.com/'
      and location_source_url='https://www.google.com/maps/search/?api=1&query=Taberna+Siroco+Pl.+Cala+Flores%2C+Local+21%2C+30370+Cabo+de+Palos'
    ) or (
      id=187
      and address='Pl. Miguel de Cervantes, 17, 30710 Los Alcázares'
      and website='https://casaindiarestaurant.com/'
      and location_source_url='https://www.google.com/maps/search/?api=1&query=Casa+India+Restaurante+Pl.+Miguel+de+Cervantes%2C+17%2C+30710+Los+Alc%C3%A1zares'
    ) or (
      id=202
      and address='C. Sirio, 23, 30370 Cabo de Palos'
      and website='https://pescadoscabodepalos.es/'
      and location_source_url='https://www.google.com/maps/search/?api=1&query=Pescados+Cabo+de+Palos+I+C.+Sirio%2C+23%2C+30370+Cabo+de+Palos'
    );

  if v_exact <> 4 then
    raise exception 'RT-007 location wave3 baseline drift: expected 4 exact Production rows, found %',v_exact;
  end if;

  with targets(id) as (values (181),(185),(187),(202)), q as (
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
    raise exception 'RT-007 location wave3 rights drift: expected 4 conservative first-party AMBER hosts, found %',v_rights;
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
    raise exception 'RT-007 location wave3 hard-queue drift: expected 329 before dry-run, got %',v_hard_before;
  end if;
end
$rt007_location_wave3_preflight$;

update public.restaurants
set location_source_url=website,
    location_source_label=case id
      when 181 then 'Offizielle Website · Flute Lounge Bar'
      when 185 then 'Offizielle Website · Taberna Siroco'
      when 187 then 'Offizielle Website · Casa India'
      when 202 then 'Offizielle Website · Pescados Cabo de Palos'
      else location_source_label
    end
where id in (181,185,187,202);

do $rt007_location_wave3_postflight$
declare
  v_replaced integer;
  v_hard_after integer;
begin
  with targets(id) as (values (181),(185),(187),(202)), q as (
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
    raise exception 'RT-007 location wave3 postflight failed: %/4 first-party location refs',v_replaced;
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
    raise exception 'RT-007 location wave3 expected hard queue 325 after dry-run, got %',v_hard_after;
  end if;
end
$rt007_location_wave3_postflight$;

rollback;
