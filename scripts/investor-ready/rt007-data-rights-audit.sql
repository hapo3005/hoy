-- HOY Investor Ready RT-007 Data Rights Audit
-- READ ONLY. No Production mutation.
-- Run against HOY La Manga to produce DD evidence.

-- 1) Registry coverage by rights state.
select
  coalesce(r.rights_status,'NO_REGISTRY') as rights_status,
  count(*) as hosts,
  sum(u.ref_count) as refs,
  sum(case when coalesce(r.replacement_required,false) then u.ref_count else 0 end) as refs_replacement_required
from private.source_usage_inventory u
left join private.source_rights_registry r using(host)
group by coalesce(r.rights_status,'NO_REGISTRY')
order by refs desc;

-- 2) Every RED host must remain replacement_required and commercially blocked.
select
  u.host,u.ref_count,u.contexts,
  r.source_class,r.rights_status,
  r.persistent_copy_allowed,r.public_reuse_allowed,
  r.derivative_use_allowed,r.commercial_use_allowed,
  r.automated_collection_allowed,r.replacement_required,
  r.transferability,r.legal_review_status,r.terms_reference,r.terms_checked_at
from private.source_usage_inventory u
join private.source_rights_registry r using(host)
where r.rights_status='RED'
order by u.ref_count desc,u.host;

-- HARD FAIL if any RED source is accidentally marked reusable/commercial/derivable or non-replacement.
select count(*) as red_policy_failures
from private.source_rights_registry
where rights_status='RED'
  and (
    persistent_copy_allowed
    or public_reuse_allowed
    or derivative_use_allowed
    or commercial_use_allowed
    or automated_collection_allowed
    or not replacement_required
    or transferability <> 'NO'
  );

-- 3) Unknown/unreviewed references remain fail-closed.
select u.host,u.ref_count,u.contexts,r.rights_status,r.legal_review_status
from private.source_usage_inventory u
left join private.source_rights_registry r using(host)
where r.host is null or r.rights_status='REVIEW_REQUIRED'
order by u.ref_count desc,u.host;

-- 4) Direct provenance fields on restaurant records.
with refs as (
  select r.id as restaurant_id,r.name,v.context,v.url,
         lower(split_part(regexp_replace(v.url,'^https?://',''), '/',1)) as host
  from public.restaurants r
  cross join lateral (values
    ('source_url',r.source_url),
    ('signature_source_url',r.signature_source_url),
    ('location_source_url',r.location_source_url),
    ('hours_source_url',r.hours_source_url)
  ) v(context,url)
  where v.url is not null and v.url<>''
)
select
  coalesce(rr.rights_status,'NO_REGISTRY') as rights_status,
  count(*) as field_refs,
  count(distinct refs.restaurant_id) as restaurants,
  array_agg(distinct refs.context order by refs.context) as contexts
from refs
left join private.source_rights_registry rr using(host)
group by coalesce(rr.rights_status,'NO_REGISTRY')
order by field_refs desc;

-- 5) Launch-critical replacement queue: RED or REVIEW_REQUIRED references.
with refs as (
  select r.id as restaurant_id,r.name,v.field,v.url,
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
select refs.restaurant_id,refs.name,refs.field,refs.host,
       coalesce(rr.rights_status,'NO_REGISTRY') as rights_status,
       coalesce(rr.replacement_required,false) as replacement_required,
       rr.source_class,rr.legal_review_status
from refs
left join private.source_rights_registry rr using(host)
where rr.host is null or rr.rights_status in ('RED','REVIEW_REQUIRED')
order by case coalesce(rr.rights_status,'NO_REGISTRY') when 'RED' then 0 else 1 end,
         refs.name,refs.field;

-- 6) Accessibility must not be overstated as verified proprietary evidence.
select coalesce(verification_level,'NULL') as verification_level,count(*) as rows
from public.restaurant_accessibility_facts
group by coalesce(verification_level,'NULL')
order by rows desc;

-- 7) Official vs non-official operational inputs.
select 'restaurant_hours_sources' as dataset,
       case when is_official then 'official' else 'non_official' end as source_state,
       count(*) as rows
from public.restaurant_hours_sources
group by is_official
union all
select 'menu_sources',case when is_official then 'official' else 'non_official' end,count(*)
from public.menu_sources
group by is_official
order by dataset,source_state;

-- CLOSE RULE (evaluated outside SQL):
-- * red_policy_failures = 0
-- * no launch-critical user-facing fact depends solely on RED/unknown evidence
-- * every restricted source is segregated as provenance/lead-only or replaced
-- * transferable export excludes restricted raw content and personal data unless contract/law permits it
