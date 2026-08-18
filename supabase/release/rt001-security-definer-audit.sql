-- HOY Investor Ready RT-001 — read-only verification queries
-- Run AFTER rt001-security-definer-hardening.sql in an isolated database.
-- This file is read-only and is intended to produce a human-reviewable evidence pack.

-- 1) SECURITY DEFINER inventory, search_path and EXECUTE surface.
select n.nspname as schema_name,
       p.proname,
       pg_get_function_identity_arguments(p.oid) as identity_args,
       p.prosecdef as security_definer,
       coalesce(array_to_string(p.proconfig, ', '),'') as proconfig,
       has_function_privilege('anon', p.oid, 'EXECUTE') as anon_execute,
       has_function_privilege('authenticated', p.oid, 'EXECUTE') as authenticated_execute,
       has_function_privilege('public', p.oid, 'EXECUTE') as public_execute
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where (n.nspname='public' and p.proname in (
    'log_analytics_event',
    'get_operator_workspace',
    'get_venue_media_review',
    'operator_archive_offer',
    'operator_publish_offer',
    'operator_request_upgrade',
    'operator_submit_profile_change',
    'review_venue_media_candidates'
  ))
   or (n.nspname='private' and p.proname in ('is_hoy_admin','is_restaurant_member'))
order by n.nspname,p.proname,identity_args;

-- Expected:
-- * every listed function remains SECURITY DEFINER intentionally
-- * proconfig contains search_path="" (rendering may be search_path="" or search_path=)
-- * log_analytics_event: anon=true, authenticated=true, public=false
-- * all other public RPCs: anon=false, authenticated=true, public=false
-- * private helpers: anon=false, authenticated=true, public=false

-- 2) Client roles must not be able to CREATE shadow objects in security-relevant schemas.
select n.nspname as schema_name,
       has_schema_privilege('anon', n.oid, 'CREATE') as anon_create,
       has_schema_privilege('authenticated', n.oid, 'CREATE') as authenticated_create
from pg_namespace n
where n.nspname in ('public','private','auth')
order by n.nspname;

-- Expected: all CREATE flags false.

-- 3) Analytics evidence trust boundary exists and defaults to client_unverified.
select column_name,data_type,is_nullable,column_default
from information_schema.columns
where table_schema='public'
  and table_name='analytics_events'
  and column_name='evidence_trust';

select conname, pg_get_constraintdef(oid) as definition
from pg_constraint
where conrelid='public.analytics_events'::regclass
  and conname='analytics_events_evidence_trust_check';

-- Expected:
-- * evidence_trust text NOT NULL DEFAULT 'client_unverified'
-- * constraint allows only client_unverified/server_validated/business_confirmed

-- 4) Direct client writes remain blocked on privileged target tables.
with targets(tablename) as (values
 ('restaurant_memberships'),
 ('restaurant_entitlements'),
 ('restaurant_profile_change_requests'),
 ('operator_upgrade_requests'),
 ('venue_media_candidates'),
 ('analytics_events')
)
select t.tablename,
       c.relrowsecurity as rls_enabled,
       has_table_privilege('anon', format('public.%I',t.tablename), 'INSERT') as anon_insert,
       has_table_privilege('anon', format('public.%I',t.tablename), 'UPDATE') as anon_update,
       has_table_privilege('authenticated', format('public.%I',t.tablename), 'INSERT') as auth_insert_grant,
       has_table_privilege('authenticated', format('public.%I',t.tablename), 'UPDATE') as auth_update_grant,
       coalesce((select count(*) from pg_policies p
                 where p.schemaname='public' and p.tablename=t.tablename and p.cmd in ('INSERT','UPDATE','ALL')),0) as write_policy_count
from targets t
join pg_class c on c.relname=t.tablename
join pg_namespace n on n.oid=c.relnamespace and n.nspname='public'
order by t.tablename;

-- Review rule: grants alone are not authorization. For any authenticated grant=true,
-- inspect the RLS write policies and confirm they do not allow bypass of the narrow RPC.

-- 5) Evidence-integrity invariant: raw client events are not silently upgraded.
select evidence_trust, count(*)
from public.analytics_events
group by evidence_trust
order by evidence_trust;

-- On first application, all existing rows should be client_unverified unless a separate,
-- explicitly reviewed server validation migration/process has already classified them.
