-- HOY Investor Ready RT-007 Transferability Export
-- READ ONLY. Produces Buyer-DD rights buckets without treating restricted source content as HOY-owned data.
-- Run against the HOY Core/Gastro database. No DDL/DML.

-- RESULT 1 — source-level rights ledger.
select
  u.host,
  u.ref_count,
  u.contexts,
  coalesce(r.rights_status,'NO_REGISTRY') as rights_status,
  r.source_class,
  r.transferability,
  r.legal_review_status,
  coalesce(r.persistent_copy_allowed,false) as persistent_copy_allowed,
  coalesce(r.public_reuse_allowed,false) as public_reuse_allowed,
  coalesce(r.derivative_use_allowed,false) as derivative_use_allowed,
  coalesce(r.commercial_use_allowed,false) as commercial_use_allowed,
  coalesce(r.automated_collection_allowed,false) as automated_collection_allowed,
  coalesce(r.replacement_required,true) as replacement_required,
  case
    when r.rights_status='GREEN'
      and r.transferability in ('YES','YES_WITH_CONDITIONS')
      and r.commercial_use_allowed
      and r.derivative_use_allowed
      then 'TRANSFERABLE_OR_LICENSED_NOW'
    when r.rights_status='RED' then 'REFERENCE_RESTRICTED_REPLACE'
    when r.rights_status='AMBER' then 'CONDITIONAL_NOT_YET_TRANSFERABLE'
    else 'REVIEW_REQUIRED'
  end as buyer_bucket,
  r.terms_reference,
  r.terms_checked_at
from private.source_usage_inventory u
left join private.source_rights_registry r using(host)
order by
  case coalesce(r.rights_status,'NO_REGISTRY')
    when 'RED' then 0 when 'REVIEW_REQUIRED' then 1 when 'NO_REGISTRY' then 2 when 'AMBER' then 3 else 4 end,
  u.ref_count desc,u.host;

-- RESULT 2 — direct restaurant provenance partition.
-- Deliberately omits the raw URL from the Buyer-DD export; source host + field + rights bucket are sufficient for segregation evidence.
with refs as (
  select r.id as restaurant_id,r.name as restaurant_name,v.field,
         lower(split_part(regexp_replace(v.url,'^https?://',''), '/',1)) as host
  from public.restaurants r
  cross join lateral (values
    ('source_url',r.source_url),
    ('location_source_url',r.location_source_url),
    ('hours_source_url',r.hours_source_url),
    ('signature_source_url',r.signature_source_url)
  ) v(field,url)
  where v.url is not null and v.url<>''
)
select
  refs.restaurant_id,refs.restaurant_name,refs.field,refs.host,
  coalesce(rr.rights_status,'NO_REGISTRY') as rights_status,
  rr.source_class,rr.transferability,rr.legal_review_status,
  coalesce(rr.replacement_required,true) as replacement_required,
  case
    when rr.rights_status='GREEN'
      and rr.transferability in ('YES','YES_WITH_CONDITIONS')
      and rr.commercial_use_allowed
      and rr.derivative_use_allowed
      then 'TRANSFERABLE_OR_LICENSED_NOW'
    when rr.rights_status='RED' then 'REFERENCE_RESTRICTED_REPLACE'
    when rr.rights_status='AMBER' then 'CONDITIONAL_NOT_YET_TRANSFERABLE'
    else 'REVIEW_REQUIRED'
  end as buyer_bucket
from refs
left join private.source_rights_registry rr using(host)
order by buyer_bucket,refs.restaurant_name,refs.field;

-- RESULT 3 — reconciliation summary for source inventory.
select
  case
    when r.rights_status='GREEN'
      and r.transferability in ('YES','YES_WITH_CONDITIONS')
      and r.commercial_use_allowed
      and r.derivative_use_allowed
      then 'TRANSFERABLE_OR_LICENSED_NOW'
    when r.rights_status='RED' then 'REFERENCE_RESTRICTED_REPLACE'
    when r.rights_status='AMBER' then 'CONDITIONAL_NOT_YET_TRANSFERABLE'
    else 'REVIEW_REQUIRED'
  end as buyer_bucket,
  count(*)::bigint as hosts,
  sum(u.ref_count)::bigint as source_references
from private.source_usage_inventory u
left join private.source_rights_registry r using(host)
group by 1
order by 1;

-- RESULT 4 — F0/F1 blocker summary. A zero RED policy failure count is mandatory but not sufficient for gate close.
with direct_refs as (
  select lower(split_part(regexp_replace(v.url,'^https?://',''), '/',1)) as host
  from public.restaurants r
  cross join lateral (values
    (r.source_url),(r.location_source_url),(r.hours_source_url),(r.signature_source_url)
  ) v(url)
  where v.url is not null and v.url<>''
), red_policy as (
  select count(*)::bigint as n
  from private.source_rights_registry
  where rights_status='RED'
    and (
      persistent_copy_allowed or public_reuse_allowed or derivative_use_allowed
      or commercial_use_allowed or automated_collection_allowed
      or not replacement_required or transferability <> 'NO'
    )
), provenance as (
  select
    count(*) filter (where rr.host is null)::bigint as no_registry_direct_refs,
    count(*) filter (where rr.rights_status='RED')::bigint as red_direct_refs,
    count(*) filter (where rr.rights_status='REVIEW_REQUIRED')::bigint as review_required_direct_refs,
    count(*) filter (where rr.rights_status='AMBER')::bigint as amber_direct_refs
  from direct_refs d
  left join private.source_rights_registry rr using(host)
), terms as (
  select
    count(*) filter (where status='active')::bigint as active_terms_versions
  from private.business_terms_versions
), acceptances as (
  select count(*)::bigint as n from private.business_terms_acceptances
), confirmations as (
  select count(*)::bigint as n from private.business_data_confirmations
)
select
  (select n from red_policy) as red_policy_failures,
  provenance.no_registry_direct_refs,
  provenance.red_direct_refs,
  provenance.review_required_direct_refs,
  provenance.amber_direct_refs,
  (select active_terms_versions from terms) as active_business_terms_versions,
  (select n from acceptances) as business_terms_acceptances,
  (select n from confirmations) as business_data_confirmations,
  case
    when (select n from red_policy) <> 0 then 'BLOCK_POLICY_INTEGRITY'
    when provenance.no_registry_direct_refs <> 0 then 'BLOCK_REGISTRY_COVERAGE'
    when (select active_terms_versions from terms) = 0 then 'BLOCK_BUSINESS_TERMS'
    when (select n from confirmations) = 0 then 'BLOCK_NO_BUSINESS_CONFIRMED_DATA'
    else 'REVIEW_LAUNCH_FACT_DEPENDENCIES'
  end as rt007_next_gate
from provenance;

-- RESULT 5 — unregistered direct provenance queue. These remain fail-closed until classified/replaced.
with refs as (
  select r.id as restaurant_id,r.name as restaurant_name,v.field,
         lower(split_part(regexp_replace(v.url,'^https?://',''), '/',1)) as host
  from public.restaurants r
  cross join lateral (values
    ('source_url',r.source_url),
    ('location_source_url',r.location_source_url),
    ('hours_source_url',r.hours_source_url),
    ('signature_source_url',r.signature_source_url)
  ) v(field,url)
  where v.url is not null and v.url<>''
)
select refs.restaurant_id,refs.restaurant_name,refs.field,refs.host,'REVIEW_REQUIRED' as buyer_bucket
from refs
left join private.source_rights_registry rr using(host)
where rr.host is null
order by refs.restaurant_name,refs.field;

-- CLOSE INTERPRETATION:
-- * `TRANSFERABLE_OR_LICENSED_NOW` is the only source bucket eligible for valuation-grade transferable-source evidence today.
-- * AMBER is conditional, not currently transferable by default.
-- * RED stays provenance/lead-only and replacement_required.
-- * NO_REGISTRY / REVIEW_REQUIRED fail closed.
-- * Personal/user-event data is NOT cleared by this script; RT-008 applies separately.
-- * A clean source-rights export does not prove every product field is launch-safe; sole-source dependencies still require field-level review/confirmation.
