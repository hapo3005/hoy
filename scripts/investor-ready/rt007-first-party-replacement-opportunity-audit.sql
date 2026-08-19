-- HOY Investor Ready RT-007 — First-party replacement opportunity audit
-- READ ONLY. Produces an actionable queue; does not authorize any replacement.

with refs as (
  select r.id as restaurant_id,r.name,r.website,
         v.field,v.url,
         lower(split_part(regexp_replace(v.url,'^https?://',''), '/',1)) as old_host,
         lower(split_part(regexp_replace(coalesce(r.website,''),'^https?://',''), '/',1)) as website_host
  from public.restaurants r
  cross join lateral (values
    ('source_url'::text,r.source_url),
    ('location_source_url',r.location_source_url),
    ('hours_source_url',r.hours_source_url),
    ('signature_source_url',r.signature_source_url)
  ) v(field,url)
  where v.url is not null and v.url<>''
), q as (
  select refs.*,
         coalesce(oldr.rights_status,'NO_REGISTRY') as old_rights,
         wr.rights_status as website_rights,
         wr.source_class as website_class,
         wr.factual_verification_allowed as website_factual,
         wr.replacement_required as website_replacement,
         wr.transferability as website_transferability,
         wr.legal_review_status as website_legal_review
  from refs
  left join private.source_rights_registry oldr on oldr.host=refs.old_host
  left join private.source_rights_registry wr on wr.host=nullif(refs.website_host,'')
), candidates as (
  select *,case field
    when 'source_url' then 'GENERIC_FIRST_PARTY_SWAP_CANDIDATE'
    when 'location_source_url' then 'VERIFY_OFFICIAL_PAGE_SHOWS_LOCATION_OR_ADDRESS'
    when 'hours_source_url' then 'VERIFY_OFFICIAL_PAGE_SHOWS_CURRENT_HOURS'
    when 'signature_source_url' then 'VERIFY_AND_REWRITE_SIGNATURE_TO_SUPPORTED_FACTS'
  end as verification_mode
  from q
  where old_rights in ('RED','REVIEW_REQUIRED','NO_REGISTRY')
    and website_rights='AMBER'
    and website_class='FIRST_PARTY_BUSINESS_REFERENCE'
    and website_factual=true
    and website_replacement=false
)
select field,
       verification_mode,
       count(*)::int as candidate_refs,
       count(distinct restaurant_id)::int as restaurants,
       array_agg(restaurant_id order by restaurant_id) as restaurant_ids
from candidates
group by field,verification_mode
order by field;

-- Detail queue for review tooling / data-room evidence.
with refs as (
  select r.id as restaurant_id,r.name,r.website,
         v.field,v.url,
         lower(split_part(regexp_replace(v.url,'^https?://',''), '/',1)) as old_host,
         lower(split_part(regexp_replace(coalesce(r.website,''),'^https?://',''), '/',1)) as website_host
  from public.restaurants r
  cross join lateral (values
    ('source_url'::text,r.source_url),
    ('location_source_url',r.location_source_url),
    ('hours_source_url',r.hours_source_url),
    ('signature_source_url',r.signature_source_url)
  ) v(field,url)
  where v.url is not null and v.url<>''
)
select refs.restaurant_id,refs.name,refs.field,refs.url as restricted_url,refs.old_host,
       refs.website as first_party_candidate_url,refs.website_host,
       coalesce(oldr.rights_status,'NO_REGISTRY') as current_rights,
       wr.rights_status as candidate_rights,
       wr.transferability as candidate_transferability,
       wr.legal_review_status as candidate_legal_review,
       case refs.field
         when 'source_url' then 'GENERIC_FIRST_PARTY_SWAP_CANDIDATE'
         when 'location_source_url' then 'VERIFY_OFFICIAL_PAGE_SHOWS_LOCATION_OR_ADDRESS'
         when 'hours_source_url' then 'VERIFY_OFFICIAL_PAGE_SHOWS_CURRENT_HOURS'
         when 'signature_source_url' then 'VERIFY_AND_REWRITE_SIGNATURE_TO_SUPPORTED_FACTS'
       end as verification_mode
from refs
left join private.source_rights_registry oldr on oldr.host=refs.old_host
join private.source_rights_registry wr on wr.host=refs.website_host
where coalesce(oldr.rights_status,'NO_REGISTRY') in ('RED','REVIEW_REQUIRED','NO_REGISTRY')
  and wr.rights_status='AMBER'
  and wr.source_class='FIRST_PARTY_BUSINESS_REFERENCE'
  and wr.factual_verification_allowed=true
  and wr.replacement_required=false
order by refs.field,refs.restaurant_id;
