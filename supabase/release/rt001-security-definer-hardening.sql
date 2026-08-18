-- HOY Investor Ready RT-001 — SECURITY DEFINER hardening candidate
-- Prepared 2026-08-18 from the live HOY La Manga Supabase advisor + function bodies.
--
-- IMPORTANT:
--   * This file is a RELEASE CANDIDATE HARDENING SCRIPT, not a Production migration.
--   * Do NOT apply it to Production until RT-002 reconciles migration history and
--     promotes the reviewed delta into the canonical release manifest/migration order.
--   * Run first in an isolated database cloned from the intended Production baseline.
--
-- Security decisions:
--   1) Keep the operator/workspace/media RPCs as SECURITY DEFINER because they expose
--      a deliberately narrower operation than direct table grants and perform explicit
--      auth.uid()/verified-membership/claim checks before privileged reads/writes.
--   2) Remove writable schemas and pg_temp from function search_path by using ''.
--      Every non-pg_catalog object referenced below is schema-qualified.
--   3) Revoke EXECUTE from PUBLIC/anon/authenticated, then grant only the intended role.
--   4) Keep anonymous analytics callable, but mark every client-written analytics row
--      as client_unverified. Raw client analytics must never be treated as verified
--      business-ROI or investor evidence without a separate server/business validation step.

begin;

-- -----------------------------------------------------------------------------
-- Evidence integrity boundary for anonymous client analytics
-- -----------------------------------------------------------------------------

alter table public.analytics_events
  add column if not exists evidence_trust text not null default 'client_unverified';

alter table public.analytics_events
  drop constraint if exists analytics_events_evidence_trust_check;

alter table public.analytics_events
  add constraint analytics_events_evidence_trust_check
  check (evidence_trust in ('client_unverified','server_validated','business_confirmed'));

comment on column public.analytics_events.evidence_trust is
  'Evidence trust class. Client RPC writes are always client_unverified. Do not use client_unverified rows as verified ROI/investor proof without a separate validation step.';

create or replace function public.log_analytics_event(
  p_event_type text,
  p_restaurant_id bigint,
  p_anonymous_id uuid,
  p_session_id uuid,
  p_metadata jsonb
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  request_headers jsonb := coalesce(nullif(current_setting('request.headers', true), ''), '{}')::jsonb;
  request_user_agent text := lower(coalesce(request_headers->>'user-agent', ''));
  qa_runtime text;
  v_metadata jsonb := coalesce(p_metadata, '{}'::jsonb);
begin
  if p_metadata is not null and jsonb_typeof(p_metadata) <> 'object' then
    raise exception 'Analytics metadata must be an object';
  end if;

  if p_metadata is not null and pg_column_size(p_metadata) > 4096 then
    raise exception 'Analytics metadata too large';
  end if;

  -- Reserved evidence keys are server-owned. Strip them from untrusted client payloads
  -- so metadata can never spoof the dedicated evidence_trust column.
  v_metadata := v_metadata
    - 'evidence_trust'
    - 'qualified_for_evidence'
    - 'server_validated'
    - 'business_confirmed';

  qa_runtime := lower(coalesce(v_metadata->>'qa_runtime', ''));

  if qa_runtime in ('1','true','yes') or request_user_agent like '%headlesschrome%' then
    return;
  end if;

  if p_event_type is null or p_event_type not in (
    'profile_view','menu_view','route_start','service_open','call_click','website_open',
    'favorite_toggle','search','filter_change','map_open','reservation_start','qr_open',
    'live_plan_add','live_plan_remove','live_plan_clear','live_nearby_enabled',
    'map_focus','promotion_impression','promotion_open',
    'family_context_open','family_filter','family_situation_open'
  ) then
    raise exception 'Unsupported analytics event type';
  end if;

  if p_restaurant_id is not null and not exists (
    select 1
    from public.restaurants r
    where r.id = p_restaurant_id and r.is_published
  ) then
    raise exception 'Unknown or unpublished restaurant';
  end if;

  insert into public.analytics_events
    (restaurant_id,event_type,anonymous_id,session_id,metadata,evidence_trust)
  values
    (p_restaurant_id,p_event_type,p_anonymous_id,p_session_id,v_metadata,'client_unverified');
end;
$$;

revoke all on function public.log_analytics_event(text,bigint,uuid,uuid,jsonb)
  from public, anon, authenticated;
grant execute on function public.log_analytics_event(text,bigint,uuid,uuid,jsonb)
  to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Private authorization helpers
-- -----------------------------------------------------------------------------

create or replace function private.is_hoy_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from auth.users u
    join public.hoy_admin_accounts a
      on a.email = lower(coalesce(u.email,''))
    where u.id = (select auth.uid())
      and u.email_confirmed_at is not null
      and a.active = true
  );
$$;

revoke all on function private.is_hoy_admin() from public, anon, authenticated;
grant execute on function private.is_hoy_admin() to authenticated;

create or replace function private.is_restaurant_member(rid bigint)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists(
    select 1
    from public.restaurant_memberships m
    where m.restaurant_id = rid
      and m.user_id = (select auth.uid())
      and m.verified_at is not null
  );
$$;

revoke all on function private.is_restaurant_member(bigint) from public, anon, authenticated;
grant execute on function private.is_restaurant_member(bigint) to authenticated;

-- -----------------------------------------------------------------------------
-- Operator workspace / narrow privileged APIs
-- -----------------------------------------------------------------------------

create or replace function public.get_operator_workspace(p_restaurant_id bigint)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_member public.restaurant_memberships%rowtype;
begin
  if v_uid is null then raise exception 'login_required'; end if;

  select * into v_member
  from public.restaurant_memberships
  where restaurant_id = p_restaurant_id and user_id = v_uid
  limit 1;

  if not found and not private.is_hoy_admin() then
    raise exception 'membership_required';
  end if;

  return jsonb_build_object(
    'restaurant_id',p_restaurant_id,
    'membership',case when v_member.restaurant_id is null then null else jsonb_build_object('role',v_member.role,'verified_at',v_member.verified_at) end,
    'entitlement',(select jsonb_build_object('operator_verified',e.operator_verified,'active_plan',e.active_plan,'updated_at',e.updated_at) from public.restaurant_entitlements e where e.restaurant_id=p_restaurant_id),
    'services',(select jsonb_build_object('reservation',s.reservation_state,'pickup',s.pickup_state,'delivery',s.delivery_state,'confirmed_at',s.confirmed_at) from public.restaurant_services s where s.restaurant_id=p_restaurant_id),
    'live_hours',(select jsonb_build_object('confirmed_at',h.confirmed_at,'updated_at',h.updated_at,'display_text',h.display_text) from public.restaurant_live_hours h where h.restaurant_id=p_restaurant_id),
    'menu',(select jsonb_build_object('count',count(*),'latest_status',(array_agg(m.status order by m.submitted_at desc))[1],'latest_processor_state',(array_agg(m.processor_state order by m.submitted_at desc))[1],'latest_submitted_at',max(m.submitted_at),'latest_published_at',max(m.published_at)) from public.menu_intake_submissions m where m.restaurant_id=p_restaurant_id),
    'media',(select jsonb_build_object('candidate_count',count(*),'approved_count',count(*) filter (where c.operator_decision='approved'),'pending_count',count(*) filter (where c.operator_decision='pending'),'public_count',count(*) filter (where c.is_public=true)) from public.venue_media_candidates c where c.restaurant_id=p_restaurant_id),
    'offers',(select jsonb_build_object('draft_count',count(*) filter (where o.status='draft'::public.content_status),'published_count',count(*) filter (where o.status='published'::public.content_status),'active_count',count(*) filter (where o.status='published'::public.content_status and (o.ends_at is null or o.ends_at>now()))) from public.offers o where o.restaurant_id=p_restaurant_id),
    'profile_change',(select jsonb_build_object('id',r.id,'status',r.status,'changes',r.changes,'submitted_at',r.submitted_at,'rejection_reason',r.rejection_reason) from public.restaurant_profile_change_requests r where r.restaurant_id=p_restaurant_id order by r.submitted_at desc limit 1),
    'upgrade_request',(select jsonb_build_object('id',u.id,'requested_plan',u.requested_plan,'status',u.status,'created_at',u.created_at) from public.operator_upgrade_requests u where u.restaurant_id=p_restaurant_id order by u.created_at desc limit 1)
  );
end;
$$;

revoke all on function public.get_operator_workspace(bigint) from public, anon, authenticated;
grant execute on function public.get_operator_workspace(bigint) to authenticated;

create or replace function public.operator_submit_profile_change(
  p_restaurant_id bigint,
  p_changes jsonb,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_changes jsonb := '{}'::jsonb;
  v_id uuid;
  v text;
begin
  if v_uid is null then raise exception 'login_required'; end if;
  if not exists(
    select 1 from public.restaurant_memberships m
    where m.restaurant_id=p_restaurant_id and m.user_id=v_uid and m.verified_at is not null
  ) then raise exception 'verified_membership_required'; end if;
  if jsonb_typeof(coalesce(p_changes,'{}'::jsonb)) <> 'object' then raise exception 'invalid_changes'; end if;

  if p_changes ? 'address' then
    v:=btrim(coalesce(p_changes->>'address',''));
    if v='' then raise exception 'address_required'; end if;
    if length(v)>300 then raise exception 'change_too_long'; end if;
    v_changes:=v_changes||jsonb_build_object('address',v);
  end if;
  if p_changes ? 'phone' then
    v:=btrim(coalesce(p_changes->>'phone',''));
    if v='' then raise exception 'phone_required'; end if;
    if length(v)>80 then raise exception 'change_too_long'; end if;
    v_changes:=v_changes||jsonb_build_object('phone',v);
  end if;
  if p_changes ? 'website' then
    v:=btrim(coalesce(p_changes->>'website',''));
    if length(v)>500 then raise exception 'change_too_long'; end if;
    if v<>'' and v !~* '^https://[^[:space:]]+$' then raise exception 'website_must_be_https'; end if;
    v_changes:=v_changes||jsonb_build_object('website',v);
  end if;
  if p_changes ? 'description' then
    v:=btrim(coalesce(p_changes->>'description',''));
    if v='' then raise exception 'description_required'; end if;
    if length(v)>3000 then raise exception 'change_too_long'; end if;
    v_changes:=v_changes||jsonb_build_object('description',v);
  end if;
  if p_changes ? 'hours_text' then
    v:=btrim(coalesce(p_changes->>'hours_text',''));
    if length(v)>800 then raise exception 'change_too_long'; end if;
    v_changes:=v_changes||jsonb_build_object('hours_text',v);
  end if;

  if v_changes='{}'::jsonb then raise exception 'no_changes'; end if;

  update public.restaurant_profile_change_requests
  set status='superseded', reviewed_at=now()
  where restaurant_id=p_restaurant_id and submitted_by=v_uid and status='pending';

  insert into public.restaurant_profile_change_requests(restaurant_id,submitted_by,changes,note)
  values(p_restaurant_id,v_uid,v_changes,nullif(btrim(p_note),''))
  returning id into v_id;

  insert into public.audit_logs(restaurant_id,actor_user_id,action,entity_type,entity_id,after_data)
  values(p_restaurant_id,v_uid,'operator_profile_change_submitted','restaurant_profile_change_request',v_id::text,v_changes);

  return jsonb_build_object('ok',true,'id',v_id,'status','pending','changes',v_changes);
end;
$$;

revoke all on function public.operator_submit_profile_change(bigint,jsonb,text) from public, anon, authenticated;
grant execute on function public.operator_submit_profile_change(bigint,jsonb,text) to authenticated;

create or replace function public.operator_request_upgrade(
  p_restaurant_id bigint,
  p_plan public.plan_code,
  p_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_id uuid;
  v_current public.plan_code;
begin
  if v_uid is null then raise exception 'login_required'; end if;
  if p_plan not in ('pro'::public.plan_code,'business'::public.plan_code) then raise exception 'invalid_plan'; end if;
  if not exists(
    select 1 from public.restaurant_memberships m
    where m.restaurant_id=p_restaurant_id and m.user_id=v_uid and m.verified_at is not null
  ) then raise exception 'verified_membership_required'; end if;

  select active_plan into v_current
  from public.restaurant_entitlements
  where restaurant_id=p_restaurant_id;

  if v_current=p_plan then
    return jsonb_build_object('ok',true,'already_active',true,'plan',p_plan);
  end if;

  select id into v_id
  from public.operator_upgrade_requests
  where restaurant_id=p_restaurant_id
    and requested_by=v_uid
    and requested_plan=p_plan
    and status='pending'
  order by created_at desc
  limit 1;

  if v_id is null then
    insert into public.operator_upgrade_requests(restaurant_id,requested_by,requested_plan,note)
    values(p_restaurant_id,v_uid,p_plan,nullif(btrim(p_note),''))
    returning id into v_id;

    insert into public.audit_logs(restaurant_id,actor_user_id,action,entity_type,entity_id,after_data)
    values(p_restaurant_id,v_uid,'operator_upgrade_requested','operator_upgrade_request',v_id::text,jsonb_build_object('requested_plan',p_plan));
  end if;

  return jsonb_build_object('ok',true,'id',v_id,'status','pending','plan',p_plan);
end;
$$;

revoke all on function public.operator_request_upgrade(bigint,public.plan_code,text) from public, anon, authenticated;
grant execute on function public.operator_request_upgrade(bigint,public.plan_code,text) to authenticated;

create or replace function public.operator_publish_offer(p_offer_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_offer public.offers%rowtype;
  v_plan public.plan_code;
begin
  if v_uid is null then raise exception 'login_required'; end if;

  select * into v_offer
  from public.offers
  where id=p_offer_id
  for update;

  if not found then raise exception 'offer_not_found'; end if;

  if not exists(
    select 1 from public.restaurant_memberships m
    where m.restaurant_id=v_offer.restaurant_id
      and m.user_id=v_uid
      and m.verified_at is not null
  ) then raise exception 'verified_membership_required'; end if;

  select active_plan into v_plan
  from public.restaurant_entitlements
  where restaurant_id=v_offer.restaurant_id and operator_verified=true;

  if v_plan not in ('pro'::public.plan_code,'business'::public.plan_code) then
    raise exception 'paid_plan_required';
  end if;

  if v_offer.ends_at is not null and v_offer.ends_at <= now() then
    raise exception 'content_expired';
  end if;

  if v_offer.offer_type='event' and
     (v_offer.starts_at is null or v_offer.event_kind is null) then
    raise exception 'event_schedule_required';
  end if;

  update public.offers
  set status='published'::public.content_status,
      publisher_kind='operator',
      published_at=coalesce(published_at,now()),
      updated_at=now()
  where id=p_offer_id;

  insert into public.audit_logs(restaurant_id,actor_user_id,action,entity_type,entity_id,after_data)
  values(
    v_offer.restaurant_id,v_uid,'operator_offer_published','offer',p_offer_id::text,
    jsonb_build_object('title',v_offer.title,'plan',v_plan,'offer_type',v_offer.offer_type,'event_kind',v_offer.event_kind)
  );

  return jsonb_build_object('ok',true,'offer_id',p_offer_id,'status','published');
end;
$$;

revoke all on function public.operator_publish_offer(uuid) from public, anon, authenticated;
grant execute on function public.operator_publish_offer(uuid) to authenticated;

create or replace function public.operator_archive_offer(p_offer_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_offer public.offers%rowtype;
begin
  if v_uid is null then raise exception 'login_required'; end if;

  select * into v_offer
  from public.offers
  where id=p_offer_id
  for update;

  if not found then raise exception 'offer_not_found'; end if;

  if not exists(
    select 1 from public.restaurant_memberships m
    where m.restaurant_id=v_offer.restaurant_id
      and m.user_id=v_uid
      and m.verified_at is not null
  ) then raise exception 'verified_membership_required'; end if;

  update public.offers
  set status='archived'::public.content_status,
      updated_at=now()
  where id=p_offer_id;

  insert into public.audit_logs(restaurant_id,actor_user_id,action,entity_type,entity_id,after_data)
  values(v_offer.restaurant_id,v_uid,'operator_offer_archived','offer',p_offer_id::text,jsonb_build_object('title',v_offer.title));

  return jsonb_build_object('ok',true,'offer_id',p_offer_id,'status','archived');
end;
$$;

revoke all on function public.operator_archive_offer(uuid) from public, anon, authenticated;
grant execute on function public.operator_archive_offer(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- Venue-media narrow privileged APIs
-- Pending claimants may read candidate metadata only; mutations still require a
-- verified restaurant membership through private.is_restaurant_member().
-- -----------------------------------------------------------------------------

create or replace function public.get_venue_media_review(p_restaurant_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_member boolean := false;
  v_has_claim boolean := false;
  v_candidates jsonb;
begin
  if v_uid is null then
    raise exception 'login_required';
  end if;

  v_member := private.is_restaurant_member(p_restaurant_id);

  select exists(
    select 1
    from public.business_claims bc
    where bc.restaurant_id = p_restaurant_id
      and bc.user_id = v_uid
      and bc.status in ('pending','verified')
  ) into v_has_claim;

  if not (v_member or v_has_claim) then
    raise exception 'claim_required';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', c.id,
    'source_type', c.source_type,
    'source_page_url', c.source_page_url,
    'asset_url', c.asset_url,
    'intended_role', c.intended_role,
    'candidate_rank', c.candidate_rank,
    'curation_note', c.curation_note,
    'rights_status', c.rights_status,
    'candidate_status', c.candidate_status,
    'operator_decision', c.operator_decision,
    'is_public', c.is_public,
    'published_storage_path', c.published_storage_path
  ) order by c.candidate_rank, c.id), '[]'::jsonb)
  into v_candidates
  from public.venue_media_candidates c
  where c.restaurant_id = p_restaurant_id;

  return jsonb_build_object(
    'restaurant_id', p_restaurant_id,
    'can_approve', v_member,
    'claim_status', case when v_member then 'verified' when v_has_claim then 'pending' else 'none' end,
    'candidates', v_candidates
  );
end;
$$;

revoke all on function public.get_venue_media_review(bigint) from public, anon, authenticated;
grant execute on function public.get_venue_media_review(bigint) to authenticated;

create or replace function public.review_venue_media_candidates(
  p_restaurant_id bigint,
  p_approved_ids bigint[] default '{}'::bigint[],
  p_rejected_ids bigint[] default '{}'::bigint[],
  p_replace_ids bigint[] default '{}'::bigint[]
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_all_ids bigint[] := coalesce(p_approved_ids,'{}'::bigint[])
    || coalesce(p_rejected_ids,'{}'::bigint[])
    || coalesce(p_replace_ids,'{}'::bigint[]);
  v_bad_count integer := 0;
begin
  if v_uid is null then
    raise exception 'login_required';
  end if;
  if not private.is_restaurant_member(p_restaurant_id) then
    raise exception 'verified_operator_required';
  end if;
  if coalesce(p_approved_ids,'{}'::bigint[]) && coalesce(p_rejected_ids,'{}'::bigint[])
     or coalesce(p_approved_ids,'{}'::bigint[]) && coalesce(p_replace_ids,'{}'::bigint[])
     or coalesce(p_rejected_ids,'{}'::bigint[]) && coalesce(p_replace_ids,'{}'::bigint[]) then
    raise exception 'candidate_in_multiple_decisions';
  end if;

  if cardinality(v_all_ids) > 0 then
    select count(*) into v_bad_count
    from unnest(v_all_ids) x(id)
    where not exists (
      select 1 from public.venue_media_candidates c
      where c.id=x.id and c.restaurant_id=p_restaurant_id
    );
    if v_bad_count > 0 then
      raise exception 'candidate_restaurant_mismatch';
    end if;
  end if;

  update public.venue_media_candidates c
  set operator_decision='approved',
      operator_decided_by=v_uid,
      operator_decided_at=now(),
      rights_status='operator_approved',
      candidate_status=case when c.asset_url is null then 'approved_source_pending_asset' else 'approved_ready_for_publish' end,
      replacement_note=null,
      updated_at=now()
  where c.restaurant_id=p_restaurant_id
    and c.id=any(coalesce(p_approved_ids,'{}'::bigint[]));

  update public.venue_media_candidates c
  set operator_decision='rejected',
      operator_decided_by=v_uid,
      operator_decided_at=now(),
      rights_status='operator_rejected',
      candidate_status='rejected',
      is_public=false,
      replacement_note=null,
      updated_at=now()
  where c.restaurant_id=p_restaurant_id
    and c.id=any(coalesce(p_rejected_ids,'{}'::bigint[]));

  update public.venue_media_candidates c
  set operator_decision='replace_requested',
      operator_decided_by=v_uid,
      operator_decided_at=now(),
      rights_status='replacement_requested',
      candidate_status='replace_requested',
      is_public=false,
      updated_at=now()
  where c.restaurant_id=p_restaurant_id
    and c.id=any(coalesce(p_replace_ids,'{}'::bigint[]));

  return jsonb_build_object(
    'restaurant_id',p_restaurant_id,
    'approved',coalesce(cardinality(p_approved_ids),0),
    'rejected',coalesce(cardinality(p_rejected_ids),0),
    'replace_requested',coalesce(cardinality(p_replace_ids),0)
  );
end;
$$;

revoke all on function public.review_venue_media_candidates(bigint,bigint[],bigint[],bigint[])
  from public, anon, authenticated;
grant execute on function public.review_venue_media_candidates(bigint,bigint[],bigint[],bigint[])
  to authenticated;

commit;
