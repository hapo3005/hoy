-- HOY Investor Ready RT-001 — current-baseline SECURITY DEFINER hardening candidate
-- Prepared 2026-08-19 against verified PR #124 baseline.
--
-- RELEASE CANDIDATE ONLY. DO NOT APPLY TO PRODUCTION.
--
-- Design goals:
--   * fail closed unless the exact 95-migration/function-definition baseline still matches;
--   * preserve every current function body (no CREATE OR REPLACE FUNCTION);
--   * remove private/auth from SECURITY DEFINER search_path and force pg_temp explicitly last;
--   * keep pg_catalog + trusted public + pg_temp, relying on a verified no-CREATE invariant for untrusted roles;
--   * keep PUBLIC/anon EXECUTE revoked on privileged RPCs;
--   * keep authenticated EXECUTE only where it already exists and is required by the current API;
--   * keep log_analytics_event EXECUTE revoked from PUBLIC, anon and authenticated;
--   * make no Terms, outreach, source-rights or analytics-activation decision.

begin;

-- -----------------------------------------------------------------------------
-- 0. Fail-closed baseline preflight
-- -----------------------------------------------------------------------------

do $rt001_preflight$
declare
  v_registered integer;
  v_latest text;
  v_target_count integer;
  v_md5_match_count integer;
  v_bad_create integer;
  v_bad_grants integer;
begin
  select count(*)::integer, max(version)::text
    into v_registered, v_latest
  from supabase_migrations.schema_migrations;

  if v_registered <> 95 or v_latest <> '20260818210527' then
    raise exception 'RT-001 baseline drift: expected 95 migrations/latest 20260818210527, got %/%', v_registered, v_latest;
  end if;

  select count(*) into v_bad_create
  from pg_namespace n
  cross join (values ('public'::text),('anon'::text),('authenticated'::text)) r(role_name)
  where n.nspname in ('public','private','auth')
    and has_schema_privilege(r.role_name, n.oid, 'CREATE');

  if v_bad_create <> 0 then
    raise exception 'RT-001 search-path precondition failed: an untrusted role can CREATE in public/private/auth';
  end if;

  with expected(schema_name,function_name,identity_args,definition_md5) as (
    values
      ('private','is_hoy_admin','', '8a761b6b1cce3ef95c6437ea3f9d1791'),
      ('private','is_restaurant_member','rid bigint', 'b88fe6c0b3e4c1649cf01308ae02e9cf'),
      ('public','get_operator_workspace','p_restaurant_id bigint', 'd3b4ba7e68da2cba9237bb9ddec728f4'),
      ('public','get_venue_media_review','p_restaurant_id bigint', '531feb9e676856f4641e9f9d300c53d0'),
      ('public','log_analytics_event','p_event_type text, p_restaurant_id bigint, p_anonymous_id uuid, p_session_id uuid, p_metadata jsonb', '1e30e78048ad15842ab8600716666fce'),
      ('public','operator_archive_offer','p_offer_id uuid', '07737aa7c1a1796d87f3670b92282ff5'),
      ('public','operator_publish_offer','p_offer_id uuid', '837323f2ae650b5f989910735f624423'),
      ('public','operator_request_upgrade','p_restaurant_id bigint, p_plan plan_code, p_note text', '79007c943a05e7acfb8c285aa7084339'),
      ('public','operator_submit_profile_change','p_restaurant_id bigint, p_changes jsonb, p_note text', '1ec27d1a85a22834d71355049570db37'),
      ('public','review_venue_media_candidates','p_restaurant_id bigint, p_approved_ids bigint[], p_rejected_ids bigint[], p_replace_ids bigint[]', '614677fc24069b77ce415d2926a5a672')
  ), actual as (
    select n.nspname as schema_name,
           p.proname as function_name,
           pg_get_function_identity_arguments(p.oid) as identity_args,
           md5(pg_get_functiondef(p.oid)) as definition_md5,
           p.oid
    from pg_proc p
    join pg_namespace n on n.oid=p.pronamespace
  )
  select count(a.oid)::integer,
         count(a.oid) filter (where a.definition_md5=e.definition_md5)::integer
    into v_target_count, v_md5_match_count
  from expected e
  left join actual a
    on a.schema_name=e.schema_name
   and a.function_name=e.function_name
   and a.identity_args=e.identity_args;

  if v_target_count <> 10 or v_md5_match_count <> 10 then
    raise exception 'RT-001 function baseline drift: expected 10 exact current definitions, got targets=% md5_matches=%', v_target_count, v_md5_match_count;
  end if;

  select count(*) into v_bad_grants
  from pg_proc p
  join pg_namespace n on n.oid=p.pronamespace
  where (
      (n.nspname='public' and p.proname in (
        'get_operator_workspace','get_venue_media_review','operator_archive_offer','operator_publish_offer',
        'operator_request_upgrade','operator_submit_profile_change','review_venue_media_candidates'
      ))
      or (n.nspname='private' and p.proname in ('is_hoy_admin','is_restaurant_member'))
    )
    and (
      has_function_privilege('public',p.oid,'EXECUTE')
      or has_function_privilege('anon',p.oid,'EXECUTE')
      or not has_function_privilege('authenticated',p.oid,'EXECUTE')
    );

  if v_bad_grants <> 0 then
    raise exception 'RT-001 privileged RPC grant baseline drifted';
  end if;

  select count(*) into v_bad_grants
  from pg_proc p
  join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public'
    and p.proname='log_analytics_event'
    and (
      has_function_privilege('public',p.oid,'EXECUTE')
      or has_function_privilege('anon',p.oid,'EXECUTE')
      or has_function_privilege('authenticated',p.oid,'EXECUTE')
    );

  if v_bad_grants <> 0 then
    raise exception 'RT-001 privacy precondition failed: analytics EXECUTE is no longer fully revoked';
  end if;
end
$rt001_preflight$;

-- Capture immutable body text inside this transaction. ALTER FUNCTION configuration
-- must not alter any function body.
create temp table rt001_function_body_baseline on commit drop as
select p.oid,
       n.nspname as schema_name,
       p.proname as function_name,
       pg_get_function_identity_arguments(p.oid) as identity_args,
       md5(p.prosrc) as body_md5
from pg_proc p
join pg_namespace n on n.oid=p.pronamespace
where (n.nspname='public' and p.proname in (
    'log_analytics_event','get_operator_workspace','get_venue_media_review','operator_archive_offer',
    'operator_publish_offer','operator_request_upgrade','operator_submit_profile_change','review_venue_media_candidates'
  ))
   or (n.nspname='private' and p.proname in ('is_hoy_admin','is_restaurant_member'));

-- -----------------------------------------------------------------------------
-- 1. Search-path hardening without body rewrites
-- -----------------------------------------------------------------------------
-- PostgreSQL searches the temporary schema first if pg_temp is omitted. Therefore
-- pg_temp is explicitly listed LAST. public remains before it because current bodies
-- contain public-owned custom enum type references. The preflight proves PUBLIC/anon/
-- authenticated cannot CREATE in public, so untrusted callers cannot shadow those names.

alter function private.is_hoy_admin()
  set search_path to pg_catalog, public, pg_temp;
alter function private.is_restaurant_member(bigint)
  set search_path to pg_catalog, public, pg_temp;

alter function public.get_operator_workspace(bigint)
  set search_path to pg_catalog, public, pg_temp;
alter function public.get_venue_media_review(bigint)
  set search_path to pg_catalog, public, pg_temp;
alter function public.log_analytics_event(text,bigint,uuid,uuid,jsonb)
  set search_path to pg_catalog, public, pg_temp;
alter function public.operator_archive_offer(uuid)
  set search_path to pg_catalog, public, pg_temp;
alter function public.operator_publish_offer(uuid)
  set search_path to pg_catalog, public, pg_temp;
alter function public.operator_request_upgrade(bigint,public.plan_code,text)
  set search_path to pg_catalog, public, pg_temp;
alter function public.operator_submit_profile_change(bigint,jsonb,text)
  set search_path to pg_catalog, public, pg_temp;
alter function public.review_venue_media_candidates(bigint,bigint[],bigint[],bigint[])
  set search_path to pg_catalog, public, pg_temp;

-- -----------------------------------------------------------------------------
-- 2. Explicit EXECUTE surface
-- -----------------------------------------------------------------------------

revoke all on function private.is_hoy_admin() from PUBLIC, anon, authenticated;
grant execute on function private.is_hoy_admin() to authenticated;

revoke all on function private.is_restaurant_member(bigint) from PUBLIC, anon, authenticated;
grant execute on function private.is_restaurant_member(bigint) to authenticated;

revoke all on function public.get_operator_workspace(bigint) from PUBLIC, anon, authenticated;
grant execute on function public.get_operator_workspace(bigint) to authenticated;

revoke all on function public.get_venue_media_review(bigint) from PUBLIC, anon, authenticated;
grant execute on function public.get_venue_media_review(bigint) to authenticated;

revoke all on function public.operator_archive_offer(uuid) from PUBLIC, anon, authenticated;
grant execute on function public.operator_archive_offer(uuid) to authenticated;

revoke all on function public.operator_publish_offer(uuid) from PUBLIC, anon, authenticated;
grant execute on function public.operator_publish_offer(uuid) to authenticated;

revoke all on function public.operator_request_upgrade(bigint,public.plan_code,text) from PUBLIC, anon, authenticated;
grant execute on function public.operator_request_upgrade(bigint,public.plan_code,text) to authenticated;

revoke all on function public.operator_submit_profile_change(bigint,jsonb,text) from PUBLIC, anon, authenticated;
grant execute on function public.operator_submit_profile_change(bigint,jsonb,text) to authenticated;

revoke all on function public.review_venue_media_candidates(bigint,bigint[],bigint[],bigint[]) from PUBLIC, anon, authenticated;
grant execute on function public.review_venue_media_candidates(bigint,bigint[],bigint[],bigint[]) to authenticated;

-- Privacy gate is binding: this hardening candidate MUST NOT reactivate analytics.
revoke all on function public.log_analytics_event(text,bigint,uuid,uuid,jsonb)
  from PUBLIC, anon, authenticated;

-- -----------------------------------------------------------------------------
-- 3. Postconditions
-- -----------------------------------------------------------------------------

do $rt001_postflight$
declare
  v_body_drift integer;
  v_path_mismatch integer;
  v_bad_create integer;
  v_bad_grants integer;
begin
  select count(*) into v_body_drift
  from rt001_function_body_baseline b
  join pg_proc p on p.oid=b.oid
  where md5(p.prosrc) <> b.body_md5;

  if v_body_drift <> 0 then
    raise exception 'RT-001 postflight failed: one or more function bodies changed';
  end if;

  select count(*) into v_path_mismatch
  from rt001_function_body_baseline b
  join pg_proc p on p.oid=b.oid
  where not exists (
    select 1 from unnest(coalesce(p.proconfig,'{}'::text[])) cfg
    where cfg='search_path=pg_catalog, public, pg_temp'
  );

  if v_path_mismatch <> 0 then
    raise exception 'RT-001 postflight failed: hardened search_path missing on % targets', v_path_mismatch;
  end if;

  select count(*) into v_bad_create
  from pg_namespace n
  cross join (values ('public'::text),('anon'::text),('authenticated'::text)) r(role_name)
  where n.nspname in ('public','private','auth')
    and has_schema_privilege(r.role_name,n.oid,'CREATE');

  if v_bad_create <> 0 then
    raise exception 'RT-001 postflight failed: untrusted schema CREATE privilege appeared';
  end if;

  select count(*) into v_bad_grants
  from pg_proc p
  join pg_namespace n on n.oid=p.pronamespace
  where (
      (n.nspname='public' and p.proname in (
        'get_operator_workspace','get_venue_media_review','operator_archive_offer','operator_publish_offer',
        'operator_request_upgrade','operator_submit_profile_change','review_venue_media_candidates'
      ))
      or (n.nspname='private' and p.proname in ('is_hoy_admin','is_restaurant_member'))
    )
    and (
      has_function_privilege('public',p.oid,'EXECUTE')
      or has_function_privilege('anon',p.oid,'EXECUTE')
      or not has_function_privilege('authenticated',p.oid,'EXECUTE')
    );

  if v_bad_grants <> 0 then
    raise exception 'RT-001 postflight failed: privileged RPC grant surface mismatched';
  end if;

  select count(*) into v_bad_grants
  from pg_proc p
  join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public'
    and p.proname='log_analytics_event'
    and (
      has_function_privilege('public',p.oid,'EXECUTE')
      or has_function_privilege('anon',p.oid,'EXECUTE')
      or has_function_privilege('authenticated',p.oid,'EXECUTE')
    );

  if v_bad_grants <> 0 then
    raise exception 'RT-001 postflight failed: analytics privacy revocation was weakened';
  end if;
end
$rt001_postflight$;

commit;

-- Required after isolated execution, before any promotion:
--   1) run rt001-security-hardening-current-baseline-audit.sql;
--   2) run authenticated/unauthenticated/foreign-restaurant IDOR negative tests;
--   3) run Supabase Security Advisor and classify all remaining warnings;
--   4) prove log_analytics_event stays inaccessible to anon/authenticated;
--   5) only then generate a canonical migration from the tested delta.
