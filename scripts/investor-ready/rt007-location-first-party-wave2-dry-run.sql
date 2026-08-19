-- HOY Investor Ready RT-007 — first-party location replacement wave 2
-- Review simulation only. Net effect ALWAYS rolls back.
--
-- Scope is intentionally narrow: two records that already store an explicit
-- first-party contact/find-us URL and source check date in Production.
-- This candidate changes provenance routing only; no address or coordinates are changed.

begin;

do $rt007_location_wave2_preflight$
declare
  v_exact integer;
  v_rights integer;
  v_hard_before integer;
begin
  select count(*) into v_exact
  from public.restaurants
  where (
      id=208
      and address='La Plaza, La Manga Club, 30389 Cartagena'
      and source_url='https://paimansrestaurant.com/contact/'
      and source_label='Offizielle Website · Paimans'
      and source_checked_at='2026-08-11'
      and location_source_url='https://www.google.com/maps/search/?api=1&query=Paimans+Asian+Street+Food+La+Plaza%2C+La+Manga+Club%2C+30389+Cartagena'
    ) or (
      id=211
      and address='Bellaluz, C. del Aljibe, 1, 30389 Atamaría'
      and source_url='https://elbistrolamangaclub.com/find-us/'
      and source_label='Offizielle Website · El Bistro Bellaluz'
      and source_checked_at='2026-08-11'
      and location_source_url='https://www.google.com/maps/search/?api=1&query=El+Bistro+-+Bellaluz+-+La+Manga+Club+Bellaluz%2C+C.+del+Aljibe%2C+1%2C+30389+Atamar%C3%ADa'
    );

  if v_exact <> 2 then
    raise exception 'RT-007 location wave2 baseline drift: expected 2 exact Production rows, found %',v_exact;
  end if;

  with targets(id) as (values (208),(211)), q as (
    select r.id,lower(split_part(regexp_replace(r.source_url,'^https?://',''), '/',1)) as host
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

  if v_rights <> 2 then
    raise exception 'RT-007 location wave2 rights drift: expected 2 conservative first-party AMBER hosts, found %',v_rights;
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
    raise exception 'RT-007 location wave2 hard-queue drift: expected 329 before dry-run, got %',v_hard_before;
  end if;
end
$rt007_location_wave2_preflight$;

update public.restaurants
set location_source_url=source_url,
    location_source_label=source_label
where id in (208,211);

do $rt007_location_wave2_postflight$
declare
  v_replaced integer;
  v_hard_after integer;
begin
  with targets(id) as (values (208),(211)), q as (
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

  if v_replaced <> 2 then
    raise exception 'RT-007 location wave2 postflight failed: %/2 first-party location refs',v_replaced;
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

  if v_hard_after <> 327 then
    raise exception 'RT-007 location wave2 expected hard queue 327 after dry-run, got %',v_hard_after;
  end if;
end
$rt007_location_wave2_postflight$;

rollback;
