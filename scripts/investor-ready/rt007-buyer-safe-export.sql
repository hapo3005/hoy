-- HOY Investor Ready RT-007 — Buyer-Safe Export Contract
-- READ ONLY. SELECT statements only. No DDL/DML and no raw source URLs in buyer-facing result rows.
--
-- Purpose:
--   1) separate active published records from archived/unpublished carve-outs;
--   2) classify each populated provenance field by current source-rights state;
--   3) roll field classifications up to restaurant level without claiming that a
--      source-clean provenance set makes the entire profile legally clean;
--   4) keep archived restricted references visible in reconciliation;
--   5) exclude personal/user-event data entirely (RT-008 governs that domain).

-- RESULT 1 — buyer-safe field-level provenance rows.
-- Raw URLs are deliberately omitted. Host + field + rights state are sufficient
-- for segregation evidence and reduce unnecessary propagation of restricted URLs.
with refs as (
  select
    r.id as restaurant_id,
    r.name as restaurant_name,
    r.is_published,
    v.field,
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
  refs.restaurant_id,
  refs.restaurant_name,
  refs.is_published,
  refs.field,
  refs.host,
  coalesce(rr.rights_status,'NO_REGISTRY') as rights_status,
  rr.source_class,
  rr.transferability,
  rr.legal_review_status,
  coalesce(rr.replacement_required,true) as replacement_required,
  case
    when not refs.is_published then 'ARCHIVED_UNPUBLISHED_CARVEOUT'
    when rr.host is null or rr.rights_status in ('RED','REVIEW_REQUIRED')
      then 'PUBLISHED_HARD_RESTRICTED_REFERENCE'
    when rr.rights_status='AMBER'
      then 'PUBLISHED_CONDITIONAL_NOT_TRANSFER_CLEAR_REFERENCE'
    when rr.rights_status='GREEN'
      and rr.transferability in ('YES','YES_WITH_CONDITIONS')
      and rr.commercial_use_allowed
      and rr.derivative_use_allowed
      then 'PUBLISHED_SOURCE_REF_TRANSFERABLE_OR_LICENSED_NOW'
    else 'PUBLISHED_GREEN_NOT_TRANSFER_CLEAR_REFERENCE'
  end as buyer_reference_bucket
from refs
left join private.source_rights_registry rr using(host)
order by refs.is_published desc,refs.restaurant_name,refs.field;

-- RESULT 2 — restaurant-level buyer buckets.
-- IMPORTANT: `PUBLISHED_PROVENANCE_REFS_TRANSFERABLE_OR_LICENSED_NOW` means only
-- that every CURRENTLY POPULATED provenance reference on the record clears the
-- source-level transfer rule. It is NOT a whole-profile legal-clearance claim.
with refs as (
  select
    r.id,
    r.name,
    r.is_published,
    v.field,
    lower(split_part(regexp_replace(v.url,'^https?://',''), '/',1)) as host
  from public.restaurants r
  cross join lateral (values
    ('source_url',r.source_url),
    ('location_source_url',r.location_source_url),
    ('hours_source_url',r.hours_source_url),
    ('signature_source_url',r.signature_source_url)
  ) v(field,url)
  where v.url is not null and v.url<>''
), classified as (
  select refs.*,
    case
      when rr.host is null or rr.rights_status in ('RED','REVIEW_REQUIRED') then 'HARD_RESTRICTED'
      when rr.rights_status='AMBER' then 'CONDITIONAL_AMBER'
      when rr.rights_status='GREEN'
        and rr.transferability in ('YES','YES_WITH_CONDITIONS')
        and rr.commercial_use_allowed
        and rr.derivative_use_allowed
        then 'TRANSFERABLE_OR_LICENSED_NOW'
      else 'GREEN_NOT_TRANSFER_CLEAR'
    end as ref_bucket
  from refs
  left join private.source_rights_registry rr using(host)
), per_restaurant as (
  select
    r.id,
    r.name,
    r.is_published,
    count(c.*)::integer as provenance_ref_count,
    count(*) filter(where c.ref_bucket='HARD_RESTRICTED')::integer as hard_restricted_refs,
    count(*) filter(where c.ref_bucket='CONDITIONAL_AMBER')::integer as conditional_amber_refs,
    count(*) filter(where c.ref_bucket='TRANSFERABLE_OR_LICENSED_NOW')::integer as transferable_or_licensed_refs,
    count(*) filter(where c.ref_bucket='GREEN_NOT_TRANSFER_CLEAR')::integer as green_not_transfer_clear_refs
  from public.restaurants r
  left join classified c on c.id=r.id
  group by r.id,r.name,r.is_published
)
select
  id as restaurant_id,
  name as restaurant_name,
  is_published,
  provenance_ref_count,
  hard_restricted_refs,
  conditional_amber_refs,
  transferable_or_licensed_refs,
  green_not_transfer_clear_refs,
  case
    when not is_published then 'ARCHIVED_UNPUBLISHED_CARVEOUT'
    when hard_restricted_refs>0 then 'PUBLISHED_WITH_HARD_RESTRICTED_DEPENDENCY'
    when conditional_amber_refs>0 or green_not_transfer_clear_refs>0
      then 'PUBLISHED_CONDITIONAL_NOT_TRANSFER_CLEAR'
    when provenance_ref_count>0 and transferable_or_licensed_refs=provenance_ref_count
      then 'PUBLISHED_PROVENANCE_REFS_TRANSFERABLE_OR_LICENSED_NOW'
    else 'PUBLISHED_NO_PROVENANCE_REFS'
  end as restaurant_buyer_bucket,
  case
    when provenance_ref_count>0 and transferable_or_licensed_refs=provenance_ref_count and is_published
      then 'SOURCE_REFERENCES_ONLY_NOT_WHOLE_PROFILE_CLEARANCE'
    else null
  end as clearance_qualification
from per_restaurant
order by restaurant_buyer_bucket,restaurant_name;

-- RESULT 3 — Buyer-DD reconciliation summary pinned to the 2026-08-19 snapshot.
-- This makes drift visible; a future snapshot must be regenerated rather than
-- silently reusing these counts.
with refs as (
  select
    r.id,
    r.is_published,
    lower(split_part(regexp_replace(v.url,'^https?://',''), '/',1)) as host
  from public.restaurants r
  cross join lateral (values
    (r.source_url),(r.location_source_url),(r.hours_source_url),(r.signature_source_url)
  ) v(url)
  where v.url is not null and v.url<>''
), classified as (
  select refs.*,
    case
      when rr.host is null or rr.rights_status in ('RED','REVIEW_REQUIRED') then 'HARD_RESTRICTED'
      when rr.rights_status='AMBER' then 'CONDITIONAL_AMBER'
      when rr.rights_status='GREEN'
        and rr.transferability in ('YES','YES_WITH_CONDITIONS')
        and rr.commercial_use_allowed
        and rr.derivative_use_allowed
        then 'TRANSFERABLE_OR_LICENSED_NOW'
      else 'GREEN_NOT_TRANSFER_CLEAR'
    end as ref_bucket
  from refs
  left join private.source_rights_registry rr using(host)
), per_restaurant as (
  select
    r.id,r.is_published,
    count(c.*)::integer as provenance_ref_count,
    count(*) filter(where c.ref_bucket='HARD_RESTRICTED')::integer as hard_refs,
    count(*) filter(where c.ref_bucket='CONDITIONAL_AMBER')::integer as amber_refs,
    count(*) filter(where c.ref_bucket='TRANSFERABLE_OR_LICENSED_NOW')::integer as transfer_refs,
    count(*) filter(where c.ref_bucket='GREEN_NOT_TRANSFER_CLEAR')::integer as green_not_clear_refs
  from public.restaurants r
  left join classified c on c.id=r.id
  group by r.id,r.is_published
), bucketed as (
  select *,case
    when not is_published then 'ARCHIVED_UNPUBLISHED_CARVEOUT'
    when hard_refs>0 then 'PUBLISHED_WITH_HARD_RESTRICTED_DEPENDENCY'
    when amber_refs>0 or green_not_clear_refs>0 then 'PUBLISHED_CONDITIONAL_NOT_TRANSFER_CLEAR'
    when provenance_ref_count>0 and transfer_refs=provenance_ref_count
      then 'PUBLISHED_PROVENANCE_REFS_TRANSFERABLE_OR_LICENSED_NOW'
    else 'PUBLISHED_NO_PROVENANCE_REFS'
  end as buyer_bucket
  from per_restaurant
), metrics as (
  select
    (select count(*) from public.restaurants where is_published)::integer as published_restaurants,
    (select count(*) from public.restaurants where not is_published)::integer as unpublished_restaurants,
    (select count(*) from classified where ref_bucket='HARD_RESTRICTED')::integer as hard_refs_all,
    (select count(*) from classified where ref_bucket='HARD_RESTRICTED' and is_published)::integer as hard_refs_published,
    (select count(*) from classified where ref_bucket='HARD_RESTRICTED' and not is_published)::integer as hard_refs_unpublished,
    (select count(*) from bucketed where buyer_bucket='PUBLISHED_WITH_HARD_RESTRICTED_DEPENDENCY')::integer as published_hard_restaurants,
    (select count(*) from bucketed where buyer_bucket='PUBLISHED_CONDITIONAL_NOT_TRANSFER_CLEAR')::integer as published_conditional_restaurants,
    (select count(*) from bucketed where buyer_bucket='PUBLISHED_PROVENANCE_REFS_TRANSFERABLE_OR_LICENSED_NOW')::integer as published_source_ref_clear_restaurants,
    (select count(*) from bucketed where buyer_bucket='ARCHIVED_UNPUBLISHED_CARVEOUT')::integer as archived_restaurants
)
select *,
  case
    when published_restaurants=166
      and unpublished_restaurants=3
      and hard_refs_all=329
      and hard_refs_published=324
      and hard_refs_unpublished=5
      and published_hard_restaurants=146
      and published_conditional_restaurants=18
      and published_source_ref_clear_restaurants=2
      and archived_restaurants=3
      and hard_refs_all=hard_refs_published+hard_refs_unpublished
      then 'PASS_2026_08_19_BUYER_SAFE_SNAPSHOT'
    else 'DRIFT_REGENERATE_BUYER_SAFE_SNAPSHOT'
  end as reconciliation_status
from metrics;

-- RESULT 4 — archived/unpublished restricted references retained for DD reconciliation.
-- These rows are not part of the active published buyer dataset but remain visible.
with refs as (
  select
    r.id as restaurant_id,
    r.name as restaurant_name,
    r.is_published,
    v.field,
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
  refs.restaurant_id,
  refs.restaurant_name,
  refs.field,
  refs.host,
  coalesce(rr.rights_status,'NO_REGISTRY') as rights_status,
  coalesce(rr.replacement_required,true) as replacement_required,
  'ARCHIVED_UNPUBLISHED_CARVEOUT' as buyer_bucket
from refs
left join private.source_rights_registry rr using(host)
where not refs.is_published
  and (rr.host is null or rr.rights_status in ('RED','REVIEW_REQUIRED'))
order by refs.restaurant_name,refs.field;

-- RESULT 5 — explicit claim boundary for data-room readers.
select
  false as whole_profile_clearance_claimed,
  false as personal_or_user_event_data_included,
  'RT-008'::text as privacy_gate,
  'AMBER is conditional and is not transfer-clear by default'::text as amber_rule,
  'PUBLISHED_PROVENANCE_REFS_TRANSFERABLE_OR_LICENSED_NOW classifies only currently populated provenance references, not the whole profile'::text as source_clearance_rule,
  'Unpublished restricted rows remain in reconciliation even when carved out of the active buyer dataset'::text as archive_rule;
