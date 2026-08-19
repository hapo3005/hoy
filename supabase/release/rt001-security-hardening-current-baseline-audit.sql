-- HOY Investor Ready RT-001 — read-only audit for current-baseline hardening
-- Run only after the release-candidate SQL has been applied to an isolated compatible database.
-- This file performs no writes.

-- 1) Baseline identity.
select count(*)::integer as registered_migrations,
       max(version)::text as latest_migration
from supabase_migrations.schema_migrations;

-- 2) Untrusted roles must not be able to create shadow objects in any schema that
-- could influence the hardened search_path or qualified auth/private calls.
select n.nspname as schema_name,
       has_schema_privilege('public',n.oid,'CREATE') as public_create,
       has_schema_privilege('anon',n.oid,'CREATE') as anon_create,
       has_schema_privilege('authenticated',n.oid,'CREATE') as authenticated_create
from pg_namespace n
where n.nspname in ('public','private','auth')
order by n.nspname;

-- Expected: every CREATE value false.

-- 3) Exact privileged API surface after hardening.
select n.nspname as schema_name,
       p.proname,
       pg_get_function_identity_arguments(p.oid) as identity_args,
       p.prosecdef as security_definer,
       coalesce(array_to_string(p.proconfig,', '),'') as proconfig,
       has_function_privilege('public',p.oid,'EXECUTE') as public_execute,
       has_function_privilege('anon',p.oid,'EXECUTE') as anon_execute,
       has_function_privilege('authenticated',p.oid,'EXECUTE') as authenticated_execute,
       md5(p.prosrc) as body_md5
from pg_proc p
join pg_namespace n on n.oid=p.pronamespace
where (n.nspname='public' and p.proname in (
    'log_analytics_event','get_operator_workspace','get_venue_media_review','operator_archive_offer',
    'operator_publish_offer','operator_request_upgrade','operator_submit_profile_change','review_venue_media_candidates'
  ))
   or (n.nspname='private' and p.proname in ('is_hoy_admin','is_restaurant_member'))
order by n.nspname,p.proname,identity_args;

-- Expected:
-- * all ten remain SECURITY DEFINER until a separately tested SECURITY INVOKER design exists;
-- * every target has search_path=pg_catalog, public;
-- * PUBLIC=false and anon=false for all ten;
-- * authenticated=true for the nine operator/helper functions;
-- * authenticated=false for log_analytics_event.

-- 4) Analytics privacy gate must remain closed.
select has_function_privilege('public','public.log_analytics_event(text,bigint,uuid,uuid,jsonb)','EXECUTE') as public_execute,
       has_function_privilege('anon','public.log_analytics_event(text,bigint,uuid,uuid,jsonb)','EXECUTE') as anon_execute,
       has_function_privilege('authenticated','public.log_analytics_event(text,bigint,uuid,uuid,jsonb)','EXECUTE') as authenticated_execute;

-- Expected: false / false / false.

-- 5) SECURITY DEFINER advisor warnings must be re-run through Supabase Security Advisor.
-- Remaining warnings are not automatically accepted: each public authenticated wrapper still
-- requires explicit authorization/IDOR negative-test evidence before RT-001 can close.
