-- HOY Investor Ready RT-001 — body-preserving SECURITY DEFINER hardening, 97-migration baseline
-- Prepared 2026-08-19 from a read-only Production snapshot and selected integration head cceb87e757fe9ec95e61cc8be734ed978c927c63.
-- RELEASE CANDIDATE ONLY. DO NOT APPLY TO PRODUCTION.

begin;

do $rt001_preflight$
declare
  v_registered integer;
  v_latest text;
  v_recent integer;
  v_targets integer;
  v_md5 integer;
  v_bad_create integer;
  v_bad_grants integer;
begin
  select count(*)::integer, max(version)::text into v_registered, v_latest
  from supabase_migrations.schema_migrations;

  if v_registered <> 97 or v_latest <> '20260819031220' then
    raise exception 'RT-001 baseline drift: expected 97 migrations/latest 20260819031220, got %/%', v_registered, v_latest;
  end if;

  select count(*)::integer into v_recent
  from supabase_migrations.schema_migrations
  where (version::text='20260819014248' and name='add_private_dd_transferability_exports')
     or (version::text='20260819031220' and name='rt008_private_dsar_retention_controls');
  if v_recent <> 2 then
    raise exception 'RT-001 recent migration identity drift';
  end if;

  select count(*) into v_bad_create
  from pg_namespace n
  cross join (values ('public'::text),('anon'::text),('authenticated'::text)) r(role_name)
  where n.nspname in ('public','private','auth')
    and has_schema_privilege(r.role_name,n.oid,'CREATE');
  if v_bad_create <> 0 then
    raise exception 'RT-001 search-path precondition failed: untrusted CREATE privilege exists';
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
    select n.nspname schema_name,p.proname function_name,pg_get_function_identity_arguments(p.oid) identity_args,
           md5(pg_get_functiondef(p.oid)) definition_md5,p.oid
    from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  )
  select count(a.oid)::integer,count(a.oid) filter(where a.definition_md5=e.definition_md5)::integer
  into v_targets,v_md5
  from expected e left join actual a
    on a.schema_name=e.schema_name and a.function_name=e.function_name and a.identity_args=e.identity_args;
  if v_targets <> 10 or v_md5 <> 10 then
    raise exception 'RT-001 function baseline drift: targets=% md5_matches=%',v_targets,v_md5;
  end if;

  select count(*) into v_bad_grants
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where ((n.nspname='public' and p.proname in ('get_operator_workspace','get_venue_media_review','operator_archive_offer','operator_publish_offer','operator_request_upgrade','operator_submit_profile_change','review_venue_media_candidates'))
      or (n.nspname='private' and p.proname in ('is_hoy_admin','is_restaurant_member')))
    and (has_function_privilege('public',p.oid,'EXECUTE') or has_function_privilege('anon',p.oid,'EXECUTE') or not has_function_privilege('authenticated',p.oid,'EXECUTE'));
  if v_bad_grants <> 0 then raise exception 'RT-001 privileged RPC grant baseline drifted'; end if;

  select count(*) into v_bad_grants
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='log_analytics_event'
    and (has_function_privilege('public',p.oid,'EXECUTE') or has_function_privilege('anon',p.oid,'EXECUTE') or has_function_privilege('authenticated',p.oid,'EXECUTE'));
  if v_bad_grants <> 0 then raise exception 'RT-001 privacy precondition failed: analytics EXECUTE is no longer fully revoked'; end if;
end
$rt001_preflight$;

create temp table rt001_function_body_baseline on commit drop as
select p.oid,n.nspname schema_name,p.proname function_name,pg_get_function_identity_arguments(p.oid) identity_args,md5(p.prosrc) body_md5
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where (n.nspname='public' and p.proname in ('log_analytics_event','get_operator_workspace','get_venue_media_review','operator_archive_offer','operator_publish_offer','operator_request_upgrade','operator_submit_profile_change','review_venue_media_candidates'))
   or (n.nspname='private' and p.proname in ('is_hoy_admin','is_restaurant_member'));

alter function private.is_hoy_admin() set search_path to pg_catalog, public, pg_temp;
alter function private.is_restaurant_member(bigint) set search_path to pg_catalog, public, pg_temp;
alter function public.get_operator_workspace(bigint) set search_path to pg_catalog, public, pg_temp;
alter function public.get_venue_media_review(bigint) set search_path to pg_catalog, public, pg_temp;
alter function public.log_analytics_event(text,bigint,uuid,uuid,jsonb) set search_path to pg_catalog, public, pg_temp;
alter function public.operator_archive_offer(uuid) set search_path to pg_catalog, public, pg_temp;
alter function public.operator_publish_offer(uuid) set search_path to pg_catalog, public, pg_temp;
alter function public.operator_request_upgrade(bigint,public.plan_code,text) set search_path to pg_catalog, public, pg_temp;
alter function public.operator_submit_profile_change(bigint,jsonb,text) set search_path to pg_catalog, public, pg_temp;
alter function public.review_venue_media_candidates(bigint,bigint[],bigint[],bigint[]) set search_path to pg_catalog, public, pg_temp;

revoke all on function private.is_hoy_admin() from PUBLIC,anon,authenticated;
grant execute on function private.is_hoy_admin() to authenticated;
revoke all on function private.is_restaurant_member(bigint) from PUBLIC,anon,authenticated;
grant execute on function private.is_restaurant_member(bigint) to authenticated;
revoke all on function public.get_operator_workspace(bigint) from PUBLIC,anon,authenticated;
grant execute on function public.get_operator_workspace(bigint) to authenticated;
revoke all on function public.get_venue_media_review(bigint) from PUBLIC,anon,authenticated;
grant execute on function public.get_venue_media_review(bigint) to authenticated;
revoke all on function public.operator_archive_offer(uuid) from PUBLIC,anon,authenticated;
grant execute on function public.operator_archive_offer(uuid) to authenticated;
revoke all on function public.operator_publish_offer(uuid) from PUBLIC,anon,authenticated;
grant execute on function public.operator_publish_offer(uuid) to authenticated;
revoke all on function public.operator_request_upgrade(bigint,public.plan_code,text) from PUBLIC,anon,authenticated;
grant execute on function public.operator_request_upgrade(bigint,public.plan_code,text) to authenticated;
revoke all on function public.operator_submit_profile_change(bigint,jsonb,text) from PUBLIC,anon,authenticated;
grant execute on function public.operator_submit_profile_change(bigint,jsonb,text) to authenticated;
revoke all on function public.review_venue_media_candidates(bigint,bigint[],bigint[],bigint[]) from PUBLIC,anon,authenticated;
grant execute on function public.review_venue_media_candidates(bigint,bigint[],bigint[],bigint[]) to authenticated;
revoke all on function public.log_analytics_event(text,bigint,uuid,uuid,jsonb) from PUBLIC,anon,authenticated;

do $rt001_postflight$
declare v_bad integer;
begin
  select count(*) into v_bad from rt001_function_body_baseline b join pg_proc p on p.oid=b.oid where md5(p.prosrc)<>b.body_md5;
  if v_bad<>0 then raise exception 'RT-001 postflight failed: function body drift'; end if;

  select count(*) into v_bad from rt001_function_body_baseline b join pg_proc p on p.oid=b.oid
  where not exists(select 1 from unnest(coalesce(p.proconfig,'{}'::text[])) cfg where cfg='search_path=pg_catalog, public, pg_temp');
  if v_bad<>0 then raise exception 'RT-001 postflight failed: hardened search_path missing'; end if;

  select count(*) into v_bad
  from pg_namespace n cross join (values('public'::text),('anon'::text),('authenticated'::text)) r(role_name)
  where n.nspname in('public','private','auth') and has_schema_privilege(r.role_name,n.oid,'CREATE');
  if v_bad<>0 then raise exception 'RT-001 postflight failed: untrusted CREATE privilege appeared'; end if;

  select count(*) into v_bad
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where ((n.nspname='public' and p.proname in ('get_operator_workspace','get_venue_media_review','operator_archive_offer','operator_publish_offer','operator_request_upgrade','operator_submit_profile_change','review_venue_media_candidates'))
      or (n.nspname='private' and p.proname in ('is_hoy_admin','is_restaurant_member')))
    and (has_function_privilege('public',p.oid,'EXECUTE') or has_function_privilege('anon',p.oid,'EXECUTE') or not has_function_privilege('authenticated',p.oid,'EXECUTE'));
  if v_bad<>0 then raise exception 'RT-001 postflight failed: privileged RPC grant surface mismatched'; end if;

  select count(*) into v_bad from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='public' and p.proname='log_analytics_event'
    and (has_function_privilege('public',p.oid,'EXECUTE') or has_function_privilege('anon',p.oid,'EXECUTE') or has_function_privilege('authenticated',p.oid,'EXECUTE'));
  if v_bad<>0 then raise exception 'RT-001 postflight failed: analytics privacy revocation was weakened'; end if;
end
$rt001_postflight$;

commit;

-- Before any promotion: execute only on an isolated compatible database, run the paired audit,
-- run authenticated/unauthenticated/foreign-restaurant IDOR/BOLA negatives, capture Security Advisor
-- before/after, and prove log_analytics_event remains inaccessible to anon/authenticated.
