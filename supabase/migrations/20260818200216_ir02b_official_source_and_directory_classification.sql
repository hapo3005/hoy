-- IR-02B official-source and directory classification
-- Production migration version: 20260818200216

with official_hosts as (
  select distinct lower(regexp_replace(regexp_replace(source_url,'^https?://',''),'[/].*$','')) as host
  from public.restaurant_hours_sources
  where source_url is not null and btrim(source_url)<>'' and is_official=true
)
update private.source_rights_registry rr set
  source_class='OFFICIAL_OR_OPERATOR_AUTHORIZED_REFERENCE',
  rights_status='AMBER',
  use_as_lead=true,
  factual_verification_allowed=true,
  persistent_copy_allowed=false,
  public_reuse_allowed=false,
  derivative_use_allowed=false,
  commercial_use_allowed=false,
  automated_collection_allowed=false,
  replacement_required=false,
  transferability='UNKNOWN',
  legal_review_status='TERMS_OR_BUSINESS_AUTHORITY_REQUIRED',
  notes=coalesce(rr.notes,'') || case when coalesce(rr.notes,'')='' then '' else ' ' end || 'HOY source evidence marks this hours source official/authorized; limited factual verification only until direct terms/business authority clears broader use.'
where rr.host in (select host from official_hosts)
  and rr.rights_status='REVIEW_REQUIRED';

with directory_hosts as (
  select distinct lower(regexp_replace(regexp_replace(source_url,'^https?://',''),'[/].*$','')) as host
  from public.restaurant_hours_sources
  where source_url is not null and btrim(source_url)<>'' and source_kind='directory'
)
update private.source_rights_registry rr set
  source_class='DIRECTORY_UNCLEARED',
  replacement_required=true,
  legal_review_status='DIRECT_TERMS_REVIEW_REQUIRED',
  notes=coalesce(rr.notes,'') || case when coalesce(rr.notes,'')='' then '' else ' ' end || 'HOY source evidence classifies this source as a directory; keep REVIEW_REQUIRED and re-source material facts unless direct rights clearance supports the intended use.'
where rr.host in (select host from directory_hosts)
  and rr.rights_status='REVIEW_REQUIRED';
