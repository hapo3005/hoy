-- HOY Gastro RC1 Supabase preflight
-- READ ONLY. This file must not mutate Production.

-- 1) Migration history snapshot.
select version, name
from supabase_migrations.schema_migrations
order by version;

-- 2) Expected current/pending objects.
select
  to_regclass('public.restaurant_accessibility')::text as restaurant_accessibility,
  to_regclass('public.restaurant_family_features')::text as restaurant_family_features,
  to_regclass('public.accessibility_feature_registry')::text as accessibility_feature_registry,
  to_regclass('public.restaurant_accessibility_facts')::text as restaurant_accessibility_facts;

-- 3) Legacy Accessibility 2.43 baseline.
select
  count(*) as accessibility_rows,
  count(*) filter (where restaurant_id is null) as missing_restaurant_id,
  count(*) filter (where checked_at is null) as missing_checked_at,
  count(*) filter (where verification_source='public_research') as public_research_rows,
  count(*) filter (where verification_source='operator') as operator_rows,
  count(*) filter (where verification_source='onsite') as onsite_rows
from public.restaurant_accessibility;

-- 4) Dry transformation footprint expected by #79, without inserting anything.
with core as (
  select a.restaurant_id, v.feature_key, v.status,
    case a.verification_source
      when 'operator' then 'business_confirmed'
      when 'onsite' then 'hoy_verified'
      else 'external_unverified'
    end as verification_level
  from public.restaurant_accessibility a
  cross join lateral (values
    ('access.step_free'::text,a.wheelchair_entrance_state::text),
    ('access.wheelchair_seating'::text,a.wheelchair_seating_state::text),
    ('access.toilet'::text,a.wheelchair_toilet_state::text),
    ('access.parking'::text,a.accessible_parking_state::text)
  ) v(feature_key,status)
), hearing as (
  select a.restaurant_id,'access.hearing_loop'::text,'unknown'::text,'external_unverified'::text
  from public.restaurant_accessibility a
  where a.restaurant_id in (22,112,145,174)
), allfacts as (
  select * from core
  union all
  select * from hearing
)
select
  count(*) as facts_total,
  count(*) filter (where status='yes') as yes_count,
  count(*) filter (where status='no') as no_count,
  count(*) filter (where status='unknown') as unknown_count,
  count(*) filter (where verification_level='external_unverified') as external_unverified_count
from allfacts;

-- 5) Outreach safety lock. Hard abort if anything is not locked.
select
  count(*) as rows_total,
  count(*) filter (where send_lock is true) as locked_true,
  count(*) filter (where send_lock is false) as locked_false,
  count(*) filter (where send_lock is null) as locked_null
from public.venue_sales_pipeline;

-- 6) Accessibility 2.43 policies and grants currently relied on by the operator path.
select policyname, cmd, roles::text
from pg_policies
where schemaname='public' and tablename='restaurant_accessibility'
order by policyname;

select grantee, privilege_type
from information_schema.role_table_grants
where table_schema='public'
  and table_name='restaurant_accessibility'
  and grantee in ('anon','authenticated')
order by grantee, privilege_type;
