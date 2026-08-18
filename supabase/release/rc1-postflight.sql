-- HOY Gastro RC1 Supabase postflight
-- READ ONLY. Run immediately after applying the curated RC database migration(s),
-- before any operator smoke-test mutates the isolated environment.

-- 1) New objects must exist.
select
  to_regclass('public.accessibility_feature_registry')::text as accessibility_feature_registry,
  to_regclass('public.restaurant_accessibility_facts')::text as restaurant_accessibility_facts;

-- 2) Initial registry/fact footprint for the 2026-08-18 baseline.
select count(*) as registry_rows
from public.accessibility_feature_registry;

select
  count(*) as facts_total,
  count(*) filter (where status='yes') as yes_count,
  count(*) filter (where status='no') as no_count,
  count(*) filter (where status='unknown') as unknown_count,
  count(*) filter (where verification_level='external_unverified') as external_unverified_count,
  count(*) filter (where is_current) as current_count
from public.restaurant_accessibility_facts;

-- 3) There must be at most one current fact per restaurant+feature.
select restaurant_id, feature_key, count(*) as current_duplicates
from public.restaurant_accessibility_facts
where is_current
 group by restaurant_id, feature_key
having count(*) > 1;

-- 4) Trigger/function contract.
select
  p.proname,
  p.prosecdef as security_definer,
  pg_get_function_identity_arguments(p.oid) as args
from pg_proc p
join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname='hoy_sync_accessibility_facts_from_legacy';

select tgname, tgenabled
from pg_trigger
where tgrelid='public.restaurant_accessibility'::regclass
  and not tgisinternal
  and tgname='hoy_accessibility_fact_sync';

-- 5) RLS policies: one SELECT policy per role/action plus separate admin writes.
select tablename, policyname, cmd, roles::text
from pg_policies
where schemaname='public'
  and tablename in ('accessibility_feature_registry','restaurant_accessibility_facts')
order by tablename, cmd, policyname;

-- 6) Explicit Data API grants.
select table_name, grantee, privilege_type
from information_schema.role_table_grants
where table_schema='public'
  and table_name in ('accessibility_feature_registry','restaurant_accessibility_facts')
  and grantee in ('anon','authenticated','service_role')
order by table_name, grantee, privilege_type;

-- 7) Legacy fallback must still exist and retain its rows.
select count(*) as legacy_accessibility_rows
from public.restaurant_accessibility;

-- 8) Outreach safety lock remains unchanged.
select
  count(*) as rows_total,
  count(*) filter (where send_lock is true) as locked_true,
  count(*) filter (where send_lock is false) as locked_false,
  count(*) filter (where send_lock is null) as locked_null
from public.venue_sales_pipeline;
