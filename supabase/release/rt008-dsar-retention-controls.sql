-- RT-008 DSAR / retention controls
-- Versioned copy of the private controls applied to the Core project on 2026-08-19.
-- Fail-closed: this file creates NO enabled retention policy and performs NO purge.

create or replace function private.dd_subject_data_locator(p_user_id uuid)
returns table(
  source_table text,
  relation_role text,
  record_count bigint,
  erasure_behavior text,
  legal_review_required boolean
)
language sql
stable
security definer
set search_path = public, private, auth, pg_temp
as $$
  select 'auth.users','account',count(*)::bigint,'ACCOUNT_ROOT',true from auth.users where id=p_user_id
  union all select 'public.restaurant_memberships','user_id',count(*)::bigint,'CASCADE',false from public.restaurant_memberships where user_id=p_user_id
  union all select 'public.business_claims','user_id',count(*)::bigint,'CASCADE_REVIEW',true from public.business_claims where user_id=p_user_id
  union all select 'public.business_claims','reviewed_by',count(*)::bigint,'REVIEW_OR_REASSIGN',true from public.business_claims where reviewed_by=p_user_id
  union all select 'public.hoy_admin_accounts','user_id',count(*)::bigint,'SET_NULL_PLUS_EMAIL_REVIEW',true from public.hoy_admin_accounts where user_id=p_user_id
  union all select 'public.menu_intake_submissions','submitted_by',count(*)::bigint,'CONTENT_AND_RETENTION_REVIEW',true from public.menu_intake_submissions where submitted_by=p_user_id
  union all select 'public.menu_intake_submissions','operator_confirmed_by',count(*)::bigint,'CONTENT_AND_RETENTION_REVIEW',true from public.menu_intake_submissions where operator_confirmed_by=p_user_id
  union all select 'public.offers','created_by',count(*)::bigint,'TOMBSTONE_OR_DELETE_REVIEW',true from public.offers where created_by=p_user_id
  union all select 'public.operator_upgrade_requests','requested_by',count(*)::bigint,'CASCADE',false from public.operator_upgrade_requests where requested_by=p_user_id
  union all select 'public.restaurant_profile_change_requests','submitted_by',count(*)::bigint,'CASCADE_REVIEW',true from public.restaurant_profile_change_requests where submitted_by=p_user_id
  union all select 'public.restaurant_profile_change_requests','reviewed_by',count(*)::bigint,'SET_NULL',false from public.restaurant_profile_change_requests where reviewed_by=p_user_id
  union all select 'public.restaurant_services','confirmed_by',count(*)::bigint,'TOMBSTONE_OR_DELETE_REVIEW',true from public.restaurant_services where confirmed_by=p_user_id
  union all select 'public.venue_media_candidates','operator_decided_by',count(*)::bigint,'SET_NULL',false from public.venue_media_candidates where operator_decided_by=p_user_id
  union all select 'public.audit_logs','actor_user_id',count(*)::bigint,'SET_NULL_PLUS_PAYLOAD_REVIEW',true from public.audit_logs where actor_user_id=p_user_id
  union all select 'public.event_promotions','requested_by',count(*)::bigint,'RESTRICT_REVIEW',true from public.event_promotions where requested_by=p_user_id
  union all select 'public.event_promotions','approved_by',count(*)::bigint,'SET_NULL',false from public.event_promotions where approved_by=p_user_id
  union all select 'public.media_assets','uploaded_by',count(*)::bigint,'TOMBSTONE_OR_DELETE_REVIEW',true from public.media_assets where uploaded_by=p_user_id
$$;

revoke all on function private.dd_subject_data_locator(uuid) from public, anon, authenticated;
grant execute on function private.dd_subject_data_locator(uuid) to service_role;
comment on function private.dd_subject_data_locator(uuid) is 'RT-008 private DSAR locator. Counts subject-linked records without returning record content. Not an erasure action.';

create or replace function private.dd_analytics_retention_preview(p_cutoff timestamptz)
returns table(
  rows_before_cutoff bigint,
  distinct_anonymous_ids bigint,
  distinct_session_ids bigint,
  earliest_event timestamptz,
  latest_event_before_cutoff timestamptz
)
language sql
stable
security definer
set search_path = public, private, pg_temp
as $$
  select count(*)::bigint,
         count(distinct anonymous_id)::bigint,
         count(distinct session_id)::bigint,
         min(occurred_at),
         max(occurred_at)
  from public.analytics_events
  where occurred_at < p_cutoff
$$;

revoke all on function private.dd_analytics_retention_preview(timestamptz) from public, anon, authenticated;
grant execute on function private.dd_analytics_retention_preview(timestamptz) to service_role;
comment on function private.dd_analytics_retention_preview(timestamptz) is 'RT-008 dry-run retention preview only. Does not delete data.';

create table if not exists private.analytics_retention_policy (
  policy_id boolean primary key default true check (policy_id = true),
  retention_days integer not null check (retention_days between 1 and 3650),
  enabled boolean not null default false,
  approved_by text,
  approved_at timestamptz,
  legal_basis_note text,
  updated_at timestamptz not null default now(),
  check (not enabled or (
    approved_at is not null
    and nullif(btrim(coalesce(approved_by,'')),'') is not null
    and nullif(btrim(coalesce(legal_basis_note,'')),'') is not null
  ))
);

revoke all on private.analytics_retention_policy from public, anon, authenticated;
grant select on private.analytics_retention_policy to service_role;
comment on table private.analytics_retention_policy is 'Fail-closed RT-008 policy gate. No default row is created; analytics purge cannot be enabled without explicit approved policy evidence.';

create table if not exists private.analytics_retention_runs (
  id bigint generated by default as identity primary key,
  executed_at timestamptz not null default now(),
  cutoff timestamptz not null,
  retention_days integer not null,
  deleted_rows bigint not null,
  execution_note text not null
);

revoke all on private.analytics_retention_runs from public, anon, authenticated;
grant select on private.analytics_retention_runs to service_role;

create or replace function private.execute_approved_analytics_retention(p_execution_note text)
returns jsonb
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_policy private.analytics_retention_policy%rowtype;
  v_cutoff timestamptz;
  v_deleted bigint;
begin
  select * into v_policy
  from private.analytics_retention_policy
  where policy_id=true and enabled=true;

  if not found then
    raise exception 'analytics_retention_policy_not_enabled';
  end if;

  if v_policy.approved_at is null
     or nullif(btrim(coalesce(v_policy.approved_by,'')),'') is null
     or nullif(btrim(coalesce(v_policy.legal_basis_note,'')),'') is null then
    raise exception 'analytics_retention_policy_not_approved';
  end if;

  if nullif(btrim(coalesce(p_execution_note,'')),'') is null then
    raise exception 'execution_note_required';
  end if;

  v_cutoff := now() - make_interval(days => v_policy.retention_days);
  delete from public.analytics_events where occurred_at < v_cutoff;
  get diagnostics v_deleted = row_count;

  insert into private.analytics_retention_runs(cutoff,retention_days,deleted_rows,execution_note)
  values(v_cutoff,v_policy.retention_days,v_deleted,btrim(p_execution_note));

  return jsonb_build_object(
    'ok',true,
    'cutoff',v_cutoff,
    'retention_days',v_policy.retention_days,
    'deleted_rows',v_deleted
  );
end;
$$;

revoke all on function private.execute_approved_analytics_retention(text) from public, anon, authenticated;
grant execute on function private.execute_approved_analytics_retention(text) to service_role;
comment on function private.execute_approved_analytics_retention(text) is 'Fail-closed retention purge. Refuses to delete unless a single explicit enabled/approved policy row exists. No policy row is created by this release file.';
