-- IR-02B deterministic first-party classification pass
-- Production migration version: 20260818195951
-- Only reclassifies a REVIEW_REQUIRED source when its host exactly matches
-- the stored business website host for the same restaurant record.

with matched_hosts as (
  select distinct
    lower(regexp_replace(regexp_replace(r.source_url,'^https?://',''),'[/].*$','')) as host
  from public.restaurants r
  where r.source_url is not null and btrim(r.source_url)<>''
    and r.website is not null and btrim(r.website)<>''
    and lower(regexp_replace(regexp_replace(r.source_url,'^https?://',''),'[/].*$',''))
        = lower(regexp_replace(regexp_replace(r.website,'^https?://',''),'[/].*$',''))
)
update private.source_rights_registry rr set
  source_class='FIRST_PARTY_BUSINESS_REFERENCE',
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
  legal_review_status='BUSINESS_TERMS_REQUIRED',
  notes=coalesce(rr.notes,'') || case when coalesce(rr.notes,'')='' then '' else ' ' end || 'Classified by deterministic source-host = stored business-website-host self-match; suitable for limited factual verification, not blanket content ownership.'
where rr.host in (select host from matched_hosts)
  and rr.rights_status='REVIEW_REQUIRED';
