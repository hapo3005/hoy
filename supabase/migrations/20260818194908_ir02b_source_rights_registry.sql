-- IR-02B Source & Data Rights Clearance
-- Production migration version: 20260818194908
-- Applied to HOY La Manga on 2026-08-18.

create schema if not exists private;

create table if not exists private.source_rights_registry (
  host text primary key,
  source_class text not null default 'UNREVIEWED',
  rights_status text not null default 'REVIEW_REQUIRED' check (rights_status in ('GREEN','AMBER','RED','REVIEW_REQUIRED')),
  use_as_lead boolean not null default true,
  factual_verification_allowed boolean not null default false,
  persistent_copy_allowed boolean not null default false,
  public_reuse_allowed boolean not null default false,
  derivative_use_allowed boolean not null default false,
  commercial_use_allowed boolean not null default false,
  automated_collection_allowed boolean not null default false,
  attribution_required boolean not null default false,
  replacement_required boolean not null default false,
  transferability text not null default 'UNKNOWN' check (transferability in ('YES','YES_WITH_CONDITIONS','NO','UNKNOWN')),
  legal_review_status text not null default 'PENDING',
  terms_reference text,
  terms_checked_at date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table private.source_rights_registry enable row level security;
revoke all on private.source_rights_registry from public, anon, authenticated;
grant usage on schema private to service_role;
grant select on private.source_rights_registry to service_role;

create or replace view private.source_usage_inventory as
with src as (
  select 'restaurants'::text as source_table, source_url from public.restaurants where source_url is not null and btrim(source_url) <> ''
  union all select 'restaurant_hours_sources', source_url from public.restaurant_hours_sources where source_url is not null and btrim(source_url) <> ''
  union all select 'menu_sources', source_url from public.menu_sources where source_url is not null and btrim(source_url) <> ''
  union all select 'restaurant_accessibility', source_url from public.restaurant_accessibility where source_url is not null and btrim(source_url) <> ''
  union all select 'restaurant_accessibility_facts', source_url from public.restaurant_accessibility_facts where source_url is not null and btrim(source_url) <> ''
  union all select 'menu_discovery_checks', source_url from public.menu_discovery_checks where source_url is not null and btrim(source_url) <> ''
  union all select 'menu_intake_submissions', source_url from public.menu_intake_submissions where source_url is not null and btrim(source_url) <> ''
  union all select 'mobility_municipal_boundaries', source_url from public.mobility_municipal_boundaries where source_url is not null and btrim(source_url) <> ''
  union all select 'mobility_providers', source_url from public.mobility_providers where source_url is not null and btrim(source_url) <> ''
  union all select 'mobility_service_areas', source_url from public.mobility_service_areas where source_url is not null and btrim(source_url) <> ''
  union all select 'offers', source_url from public.offers where source_url is not null and btrim(source_url) <> ''
  union all select 'media_assets', source_url from public.media_assets where source_url is not null and btrim(source_url) <> ''
  union all select 'published_venue_media', source_url from public.published_venue_media where source_url is not null and btrim(source_url) <> ''
), norm as (
  select source_table,
         lower(regexp_replace(regexp_replace(source_url,'^https?://',''),'[/].*$','')) as host
  from src
)
select host,
       count(*)::bigint as ref_count,
       array_agg(distinct source_table order by source_table) as contexts
from norm
where host <> ''
group by host;

revoke all on private.source_usage_inventory from public, anon, authenticated;
grant select on private.source_usage_inventory to service_role;

insert into private.source_rights_registry(host)
select host from private.source_usage_inventory
on conflict (host) do nothing;

update private.source_rights_registry set
  source_class='PLATFORM_RESTRICTED_GOOGLE_MAPS', rights_status='RED', use_as_lead=true,
  factual_verification_allowed=false, persistent_copy_allowed=false, public_reuse_allowed=false,
  derivative_use_allowed=false, commercial_use_allowed=false, automated_collection_allowed=false,
  attribution_required=false, replacement_required=true, transferability='NO', legal_review_status='POLICY_REVIEWED',
  terms_reference='Google Maps Platform EEA Terms / restrictions against scraping, caching and creating content from Google Maps Content',
  terms_checked_at=date '2026-08-18', notes='Do not treat Google Maps content as proprietary HOY data. Re-source material facts from operator/HOY/open-licensed evidence.'
where host='www.google.com' or host like '%.google.com';

update private.source_rights_registry set
  source_class='AGGREGATOR_RESTRICTED_RESTAURANTGURU', rights_status='RED', use_as_lead=true,
  factual_verification_allowed=false, persistent_copy_allowed=false, public_reuse_allowed=false,
  derivative_use_allowed=false, commercial_use_allowed=false, automated_collection_allowed=false,
  replacement_required=true, transferability='NO', legal_review_status='POLICY_REVIEWED',
  terms_reference='Restaurant Guru Terms of Use / personal-use licence and scraping/content-integration restrictions',
  terms_checked_at=date '2026-08-18', notes='Lead/reference only; no proprietary-data claim or commercial reuse of Restaurant Guru content.'
where host='restaurantguru.com' or host like '%.restaurantguru.com';

update private.source_rights_registry set
  source_class='AGGREGATOR_RESTRICTED_TRIPADVISOR', rights_status='RED', use_as_lead=true,
  factual_verification_allowed=false, persistent_copy_allowed=false, public_reuse_allowed=false,
  derivative_use_allowed=false, commercial_use_allowed=false, automated_collection_allowed=false,
  replacement_required=true, transferability='NO', legal_review_status='POLICY_REVIEWED',
  terms_reference='Tripadvisor Terms of Use / commercial-use and extraction restrictions',
  terms_checked_at=date '2026-08-18', notes='Lead/reference only unless Tripadvisor grants written permission or a specific licensed program applies.'
where host like '%tripadvisor.%' or host='tripadvisor.com' or host like '%.tripadvisor.com';

update private.source_rights_registry set
  source_class='SOCIAL_RESTRICTED_META', rights_status='RED', use_as_lead=true,
  factual_verification_allowed=false, persistent_copy_allowed=false, public_reuse_allowed=false,
  derivative_use_allowed=false, commercial_use_allowed=false, automated_collection_allowed=false,
  replacement_required=true, transferability='NO', legal_review_status='POLICY_REVIEWED',
  terms_reference='Meta Terms and Automated Data Collection Terms', terms_checked_at=date '2026-08-18',
  notes='No automated collection without permission; social content must not become a transferable HOY dataset merely because it is public.'
where host='www.facebook.com' or host like '%.facebook.com' or host='www.instagram.com' or host like '%.instagram.com';

update private.source_rights_registry set
  source_class='MAP_PLATFORM_RESTRICTED_WAZE', rights_status='RED', use_as_lead=true,
  factual_verification_allowed=false, persistent_copy_allowed=false, public_reuse_allowed=false,
  derivative_use_allowed=false, commercial_use_allowed=false, automated_collection_allowed=false,
  replacement_required=true, transferability='NO', legal_review_status='PENDING_DIRECT_TERMS_CAPTURE',
  notes='Conservative classification: do not copy/save Waze database content into HOY. Replace with first-party or open-licensed evidence.'
where host='www.waze.com' or host like '%.waze.com';

update private.source_rights_registry set
  source_class='OPEN_GOV_IGN', rights_status='GREEN', use_as_lead=true,
  factual_verification_allowed=true, persistent_copy_allowed=true, public_reuse_allowed=true,
  derivative_use_allowed=true, commercial_use_allowed=true, automated_collection_allowed=true,
  attribution_required=true, replacement_required=false, transferability='YES_WITH_CONDITIONS', legal_review_status='POLICY_REVIEWED',
  terms_reference='IGN/CNIG data policy under Orden FOM/2807/2015; licence compatible with CC BY 4.0',
  terms_checked_at=date '2026-08-18', notes='Reuse subject to attribution, source/update metadata and applicable IGN/CNIG reuse conditions.'
where host='api-features.ign.es' or host='www.ign.es' or host='ign.es' or host like '%.cnig.es';

update private.source_rights_registry r set
  source_class='FIRST_PARTY_BUSINESS_REFERENCE', rights_status=case when r.rights_status='REVIEW_REQUIRED' then 'AMBER' else r.rights_status end,
  use_as_lead=true, factual_verification_allowed=true,
  persistent_copy_allowed=false, public_reuse_allowed=false, derivative_use_allowed=false,
  commercial_use_allowed=false, automated_collection_allowed=false,
  replacement_required=false, transferability='UNKNOWN', legal_review_status=case when r.legal_review_status='PENDING' then 'BUSINESS_TERMS_REQUIRED' else r.legal_review_status end,
  notes=coalesce(r.notes,'First-party operator source: suitable for limited factual verification; creative copy, photos and full menu/content reuse require explicit rights/business terms.')
where r.host in (
  select distinct lower(regexp_replace(regexp_replace(ms.source_url,'^https?://',''),'[/].*$',''))
  from public.menu_sources ms
  where ms.source_url is not null and ms.source_authority='first_party'
) and r.rights_status <> 'RED';

update private.source_rights_registry r set
  source_class='AUTHORIZED_OR_VENDOR_HOSTED_REFERENCE', rights_status=case when r.rights_status='REVIEW_REQUIRED' then 'AMBER' else r.rights_status end,
  use_as_lead=true, factual_verification_allowed=true, persistent_copy_allowed=false,
  public_reuse_allowed=false, derivative_use_allowed=false, commercial_use_allowed=false,
  automated_collection_allowed=false, transferability='UNKNOWN', legal_review_status='AUTHORITY_CHAIN_REQUIRED',
  notes=coalesce(r.notes,'Operator-linked transactional/vendor-hosted source. Confirm operator authority and content licence before reuse beyond factual verification.')
where r.host in (
  select distinct lower(regexp_replace(regexp_replace(ms.source_url,'^https?://',''),'[/].*$',''))
  from public.menu_sources ms
  where ms.source_url is not null and ms.source_authority='authorized_transactional'
) and r.rights_status <> 'RED';
