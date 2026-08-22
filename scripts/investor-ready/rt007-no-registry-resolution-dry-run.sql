-- HOY Investor Ready RT-007 — NO_REGISTRY resolution dry-run
-- Review evidence only. Net effect is ALWAYS rolled back.
-- Prepared 2026-08-19 from official TheFork and EL PAÍS terms review.
--
-- This is NOT a migration and MUST NOT be converted to a Production apply merely
-- because repository QA is green. Legal/rights interpretation remains conservative.

begin;

do $rt007_preflight$
declare
  v_existing integer;
  v_direct integer;
begin
  select count(*) into v_existing
  from private.source_rights_registry
  where host in ('www.thefork.es','elpais.com');

  if v_existing <> 0 then
    raise exception 'RT-007 dry-run baseline drift: expected both candidate hosts absent from registry, found % rows',v_existing;
  end if;

  with refs as (
    select lower(split_part(regexp_replace(v.url,'^https?://',''), '/',1)) as host
    from public.restaurants r
    cross join lateral (values
      (r.source_url),(r.location_source_url),(r.hours_source_url),(r.signature_source_url)
    ) v(url)
    where v.url is not null and v.url<>''
  )
  select count(*) into v_direct
  from refs
  where host in ('www.thefork.es','elpais.com');

  if v_direct <> 3 then
    raise exception 'RT-007 dry-run direct-provenance drift: expected 3 candidate refs, found %',v_direct;
  end if;
end
$rt007_preflight$;

insert into private.source_rights_registry(
  host,source_class,rights_status,use_as_lead,factual_verification_allowed,
  persistent_copy_allowed,public_reuse_allowed,derivative_use_allowed,
  commercial_use_allowed,automated_collection_allowed,attribution_required,
  replacement_required,transferability,legal_review_status,terms_reference,
  terms_checked_at,notes
) values
(
  'www.thefork.es','PLATFORM_RESTRICTED','RED',true,false,
  false,false,false,false,false,false,
  true,'NO','TERMS_REVIEWED_RESTRICTED',
  'https://www.thefork.com/legal','2026-08-19',
  'Official TheFork Terms of Use (last update 2025-06-10) prohibit copying, redistribution, resale and manual/automated extraction of Platform content/data without permission. Keep provenance as lead/reference only and replace for transferable HOY evidence.'
),
(
  'elpais.com','PUBLISHER_RESTRICTED','RED',true,false,
  false,false,false,false,false,false,
  true,'NO','TERMS_REVIEWED_RESTRICTED',
  'https://elpais.com/suscripciones/condiciones-servicios/empresas/','2026-08-19',
  'Official EL PAÍS terms reserve intellectual-property rights and prohibit commercial reproduction, transformation, distribution and public communication without prior written authorization. Keep article URLs as lead/reference only and replace for transferable HOY evidence.'
);

-- Candidate rows must remain maximally restrictive.
do $rt007_postflight$
declare
  v_rows integer;
  v_policy_fail integer;
  v_remaining_no_registry integer;
begin
  select count(*) into v_rows
  from private.source_rights_registry
  where host in ('www.thefork.es','elpais.com')
    and rights_status='RED'
    and use_as_lead=true
    and factual_verification_allowed=false
    and persistent_copy_allowed=false
    and public_reuse_allowed=false
    and derivative_use_allowed=false
    and commercial_use_allowed=false
    and automated_collection_allowed=false
    and replacement_required=true
    and transferability='NO'
    and legal_review_status='TERMS_REVIEWED_RESTRICTED'
    and terms_checked_at='2026-08-19';

  if v_rows <> 2 then
    raise exception 'RT-007 dry-run candidate rows failed restrictive postcondition: %/2',v_rows;
  end if;

  select count(*) into v_policy_fail
  from private.source_rights_registry
  where host in ('www.thefork.es','elpais.com')
    and (
      rights_status<>'RED'
      or factual_verification_allowed
      or persistent_copy_allowed
      or public_reuse_allowed
      or derivative_use_allowed
      or commercial_use_allowed
      or automated_collection_allowed
      or not replacement_required
      or transferability<>'NO'
    );

  if v_policy_fail <> 0 then
    raise exception 'RT-007 dry-run candidate weakened restricted-source policy';
  end if;

  with refs as (
    select lower(split_part(regexp_replace(v.url,'^https?://',''), '/',1)) as host
    from public.restaurants r
    cross join lateral (values
      (r.source_url),(r.location_source_url),(r.hours_source_url),(r.signature_source_url)
    ) v(url)
    where v.url is not null and v.url<>''
  )
  select count(*) into v_remaining_no_registry
  from refs
  left join private.source_rights_registry rr using(host)
  where rr.host is null
    and refs.host in ('www.thefork.es','elpais.com');

  if v_remaining_no_registry <> 0 then
    raise exception 'RT-007 dry-run did not eliminate candidate-host NO_REGISTRY coverage: % remain',v_remaining_no_registry;
  end if;
end
$rt007_postflight$;

-- Safety invariant: this review file never persists a change.
rollback;
