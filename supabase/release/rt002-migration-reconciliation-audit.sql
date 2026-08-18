-- HOY Investor Ready RT-002 — read-only migration/schema reconciliation audit
-- Safe to run against Production because it performs SELECT-only inspection.

-- A. Registered migration-history envelope.
select count(*) as registered_migrations,
       min(version) as first_version,
       max(version) as last_version,
       (select name from supabase_migrations.schema_migrations order by version desc limit 1) as last_name
from supabase_migrations.schema_migrations;

-- B. Full registered history for deterministic comparison with the release manifest.
select version, name
from supabase_migrations.schema_migrations
order by version;

-- C. Known alias/state evidence that must never be blindly reapplied.
with expected(version,name,meaning) as (values
  ('20260809180541','revoke_anon_venue_media_rpcs','repo 20260809_revoke_anon_venue_media_rpcs.sql already live'),
  ('20260809181616','hoy_admin_cockpit_access','repo 20260809_hoy_admin_cockpit.sql already live'),
  ('20260810075706','async_menu_extraction_and_eval_baseline','repo async-menu baseline already live'),
  ('20260810113042','operator_workspace_and_conversion_flow','repo operator workspace already live'),
  ('20260811053741','opening_hours_provenance_and_now_gate','repo opening-hours gate already live'),
  ('20260812040733','menu_sources_in_app_display_payload','repo menu source payload already live'),
  ('20260812062453','menu_source_completeness_integrity','repo completeness migration already live'),
  ('20260812093348','menu_discovery_checks','repo discovery checks already live'),
  ('20260815063201','verified_open_ended_events','repo open-ended events already live'),
  ('20260815063657','public_event_provenance_select','repo timestamp differs but component already live'),
  ('20260816044420','rollback_family_playgrounds_240_premerge','Family 2.40 intentionally rolled back'),
  ('20260818084329','hoy_245_analytics_contract','repo 20260818090000_hoy_245_analytics_contract.sql already live under remote timestamp')
)
select e.*,
       exists(
         select 1 from supabase_migrations.schema_migrations m
         where m.version=e.version and m.name=e.name
       ) as present
from expected e
order by e.version;

-- D. Schema-state invariants that intentionally differ from a naive repo replay.
select
  to_regclass('public.restaurant_accessibility') is not null as restaurant_accessibility_present,
  to_regclass('public.accessibility_feature_registry') is not null as accessibility_registry_present,
  to_regclass('public.restaurant_accessibility_facts') is not null as accessibility_facts_present,
  to_regclass('public.restaurant_family_features') is not null as family_features_present,
  exists(
    select 1 from information_schema.columns
    where table_schema='public' and table_name='analytics_events' and column_name='evidence_trust'
  ) as analytics_evidence_trust_present;

-- Expected on the 2026-08-18 Production baseline before RT-001/Accessible v1:
-- restaurant_accessibility_present = true
-- accessibility_registry_present = false
-- accessibility_facts_present = false
-- family_features_present = false
-- analytics_evidence_trust_present = false

-- E. Legacy Accessibility data integrity.
select count(*) as rows,
       count(*) filter (where restaurant_id is null) as missing_restaurant_id,
       count(*) filter (where checked_at is null) as missing_checked_at
from public.restaurant_accessibility;

-- Expected baseline: 166 / 0 / 0.

-- F. Outreach safety invariant.
select count(*) as sales_pipeline_rows,
       count(*) filter (where send_lock is true) as send_lock_true_rows,
       count(*) filter (where send_lock is not true) as send_lock_not_true_rows
from public.venue_sales_pipeline;

-- Expected baseline: 168 / 168 / 0.

-- G. Current security-advisor-relevant Definer surface (read-only catalog view).
select n.nspname as schema_name,
       p.proname,
       pg_get_function_identity_arguments(p.oid) as identity_args,
       p.prosecdef as security_definer,
       coalesce(array_to_string(p.proconfig, ', '),'') as proconfig,
       has_function_privilege('anon', p.oid, 'EXECUTE') as anon_execute,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_execute,
       has_function_privilege('public', p.oid, 'EXECUTE') as public_execute
from pg_proc p
join pg_namespace n on n.oid=p.pronamespace
where (n.nspname='public' and p.proname in (
  'log_analytics_event','get_operator_workspace','get_venue_media_review',
  'operator_archive_offer','operator_publish_offer','operator_request_upgrade',
  'operator_submit_profile_change','review_venue_media_candidates'
)) or (n.nspname='private' and p.proname in ('is_hoy_admin','is_restaurant_member'))
order by n.nspname,p.proname,identity_args;

-- H. Final interpretation rule:
-- A repo file may enter the Production apply list only if its component is not already
-- represented by migration history or schema state and it has an explicit apply_order in
-- the regenerated final RC manifest. Never derive the apply list from directory order alone.
