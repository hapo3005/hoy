-- HOY 2.10 — unified operator workspace and conversion architecture.
-- Free profile corrections remain review-based; paid plans unlock live operational publishing.

create table if not exists public.restaurant_profile_change_requests (
  id uuid primary key default gen_random_uuid(),
  restaurant_id bigint not null references public.restaurants(id) on delete cascade,
  submitted_by uuid not null references auth.users(id) on delete cascade,
  changes jsonb not null default '{}'::jsonb,
  note text,
  status text not null default 'pending' check (status in ('pending','approved','rejected','superseded','cancelled')),
  submitted_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  rejection_reason text,
  applied_at timestamptz,
  constraint restaurant_profile_change_requests_changes_object check (jsonb_typeof(changes)='object'),
  constraint restaurant_profile_change_requests_changes_keys check ((changes - 'address' - 'phone' - 'website' - 'description' - 'hours_text') = '{}'::jsonb)
);
create index if not exists idx_profile_change_requests_restaurant_status on public.restaurant_profile_change_requests(restaurant_id,status,submitted_at desc);
create index if not exists idx_profile_change_requests_submitter on public.restaurant_profile_change_requests(submitted_by,submitted_at desc);
alter table public.restaurant_profile_change_requests enable row level security;
revoke all on table public.restaurant_profile_change_requests from anon, authenticated;
grant select on table public.restaurant_profile_change_requests to authenticated;
drop policy if exists "members read profile change requests" on public.restaurant_profile_change_requests;
create policy "members read profile change requests" on public.restaurant_profile_change_requests for select to authenticated using (private.is_restaurant_member(restaurant_id));
drop policy if exists "hoy admins manage profile change requests" on public.restaurant_profile_change_requests;
create policy "hoy admins manage profile change requests" on public.restaurant_profile_change_requests for all to authenticated using (private.is_hoy_admin()) with check (private.is_hoy_admin());

create table if not exists public.operator_upgrade_requests (
  id uuid primary key default gen_random_uuid(),
  restaurant_id bigint not null references public.restaurants(id) on delete cascade,
  requested_by uuid not null references auth.users(id) on delete cascade,
  requested_plan plan_code not null check (requested_plan in ('pro'::plan_code,'business'::plan_code)),
  status text not null default 'pending' check (status in ('pending','contacted','converted','cancelled')),
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_operator_upgrade_requests_restaurant_status on public.operator_upgrade_requests(restaurant_id,status,created_at desc);
create index if not exists idx_operator_upgrade_requests_submitter on public.operator_upgrade_requests(requested_by,created_at desc);
alter table public.operator_upgrade_requests enable row level security;
revoke all on table public.operator_upgrade_requests from anon, authenticated;
grant select on table public.operator_upgrade_requests to authenticated;
drop policy if exists "members read upgrade requests" on public.operator_upgrade_requests;
create policy "members read upgrade requests" on public.operator_upgrade_requests for select to authenticated using (private.is_restaurant_member(restaurant_id));
drop policy if exists "hoy admins manage upgrade requests" on public.operator_upgrade_requests;
create policy "hoy admins manage upgrade requests" on public.operator_upgrade_requests for all to authenticated using (private.is_hoy_admin()) with check (private.is_hoy_admin());

create or replace function public.operator_submit_profile_change(p_restaurant_id bigint,p_changes jsonb,p_note text default null)
returns jsonb language plpgsql security definer
set search_path=public,private,auth,pg_temp as $$
declare
  v_uid uuid:=(select auth.uid());
  v_changes jsonb:='{}'::jsonb;
  v_id uuid;
  v text;
begin
  if v_uid is null then raise exception 'login_required'; end if;
  if not exists(select 1 from public.restaurant_memberships m where m.restaurant_id=p_restaurant_id and m.user_id=v_uid and m.verified_at is not null) then raise exception 'verified_membership_required'; end if;
  if jsonb_typeof(coalesce(p_changes,'{}'::jsonb)) <> 'object' then raise exception 'invalid_changes'; end if;
  if p_changes ? 'address' then v:=btrim(coalesce(p_changes->>'address','')); if v='' then raise exception 'address_required'; end if; if length(v)>300 then raise exception 'change_too_long'; end if; v_changes:=v_changes||jsonb_build_object('address',v); end if;
  if p_changes ? 'phone' then v:=btrim(coalesce(p_changes->>'phone','')); if v='' then raise exception 'phone_required'; end if; if length(v)>80 then raise exception 'change_too_long'; end if; v_changes:=v_changes||jsonb_build_object('phone',v); end if;
  if p_changes ? 'website' then v:=btrim(coalesce(p_changes->>'website','')); if length(v)>500 then raise exception 'change_too_long'; end if; if v<>'' and v !~* '^https://[^[:space:]]+$' then raise exception 'website_must_be_https'; end if; v_changes:=v_changes||jsonb_build_object('website',v); end if;
  if p_changes ? 'description' then v:=btrim(coalesce(p_changes->>'description','')); if v='' then raise exception 'description_required'; end if; if length(v)>3000 then raise exception 'change_too_long'; end if; v_changes:=v_changes||jsonb_build_object('description',v); end if;
  if p_changes ? 'hours_text' then v:=btrim(coalesce(p_changes->>'hours_text','')); if length(v)>800 then raise exception 'change_too_long'; end if; v_changes:=v_changes||jsonb_build_object('hours_text',v); end if;
  if v_changes='{}'::jsonb then raise exception 'no_changes'; end if;
  update public.restaurant_profile_change_requests set status='superseded',reviewed_at=now() where restaurant_id=p_restaurant_id and submitted_by=v_uid and status='pending';
  insert into public.restaurant_profile_change_requests(restaurant_id,submitted_by,changes,note) values(p_restaurant_id,v_uid,v_changes,nullif(btrim(p_note),'')) returning id into v_id;
  insert into public.audit_logs(restaurant_id,actor_user_id,action,entity_type,entity_id,after_data) values(p_restaurant_id,v_uid,'operator_profile_change_submitted','restaurant_profile_change_request',v_id::text,v_changes);
  return jsonb_build_object('ok',true,'id',v_id,'status','pending','changes',v_changes);
end;$$;
revoke all on function public.operator_submit_profile_change(bigint,jsonb,text) from public,anon;
grant execute on function public.operator_submit_profile_change(bigint,jsonb,text) to authenticated;

create or replace function public.operator_request_upgrade(p_restaurant_id bigint,p_plan plan_code,p_note text default null)
returns jsonb language plpgsql security definer
set search_path=public,private,auth,pg_temp as $$
declare v_uid uuid:=(select auth.uid()); v_id uuid; v_current plan_code;
begin
  if v_uid is null then raise exception 'login_required'; end if;
  if p_plan not in ('pro'::plan_code,'business'::plan_code) then raise exception 'invalid_plan'; end if;
  if not exists(select 1 from public.restaurant_memberships m where m.restaurant_id=p_restaurant_id and m.user_id=v_uid and m.verified_at is not null) then raise exception 'verified_membership_required'; end if;
  select active_plan into v_current from public.restaurant_entitlements where restaurant_id=p_restaurant_id;
  if v_current=p_plan then return jsonb_build_object('ok',true,'already_active',true,'plan',p_plan); end if;
  select id into v_id from public.operator_upgrade_requests where restaurant_id=p_restaurant_id and requested_by=v_uid and requested_plan=p_plan and status='pending' order by created_at desc limit 1;
  if v_id is null then
    insert into public.operator_upgrade_requests(restaurant_id,requested_by,requested_plan,note) values(p_restaurant_id,v_uid,p_plan,nullif(btrim(p_note),'')) returning id into v_id;
    insert into public.audit_logs(restaurant_id,actor_user_id,action,entity_type,entity_id,after_data) values(p_restaurant_id,v_uid,'operator_upgrade_requested','operator_upgrade_request',v_id::text,jsonb_build_object('requested_plan',p_plan));
  end if;
  return jsonb_build_object('ok',true,'id',v_id,'status','pending','plan',p_plan);
end;$$;
revoke all on function public.operator_request_upgrade(bigint,plan_code,text) from public,anon;
grant execute on function public.operator_request_upgrade(bigint,plan_code,text) to authenticated;

create or replace function public.operator_publish_offer(p_offer_id uuid)
returns jsonb language plpgsql security definer
set search_path=public,private,auth,pg_temp as $$
declare v_uid uuid:=(select auth.uid()); v_offer public.offers%rowtype; v_plan plan_code;
begin
  if v_uid is null then raise exception 'login_required'; end if;
  select * into v_offer from public.offers where id=p_offer_id for update;
  if not found then raise exception 'offer_not_found'; end if;
  if not exists(select 1 from public.restaurant_memberships m where m.restaurant_id=v_offer.restaurant_id and m.user_id=v_uid and m.verified_at is not null) then raise exception 'verified_membership_required'; end if;
  select active_plan into v_plan from public.restaurant_entitlements where restaurant_id=v_offer.restaurant_id and operator_verified=true;
  if v_plan not in ('pro'::plan_code,'business'::plan_code) then raise exception 'paid_plan_required'; end if;
  update public.offers set status='published'::content_status,published_at=coalesce(published_at,now()),updated_at=now() where id=p_offer_id;
  insert into public.audit_logs(restaurant_id,actor_user_id,action,entity_type,entity_id,after_data) values(v_offer.restaurant_id,v_uid,'operator_offer_published','offer',p_offer_id::text,jsonb_build_object('title',v_offer.title,'plan',v_plan));
  return jsonb_build_object('ok',true,'offer_id',p_offer_id,'status','published');
end;$$;
revoke all on function public.operator_publish_offer(uuid) from public,anon;
grant execute on function public.operator_publish_offer(uuid) to authenticated;

create or replace function public.operator_archive_offer(p_offer_id uuid)
returns jsonb language plpgsql security definer
set search_path=public,private,auth,pg_temp as $$
declare v_uid uuid:=(select auth.uid()); v_offer public.offers%rowtype;
begin
  if v_uid is null then raise exception 'login_required'; end if;
  select * into v_offer from public.offers where id=p_offer_id for update;
  if not found then raise exception 'offer_not_found'; end if;
  if not exists(select 1 from public.restaurant_memberships m where m.restaurant_id=v_offer.restaurant_id and m.user_id=v_uid and m.verified_at is not null) then raise exception 'verified_membership_required'; end if;
  update public.offers set status='archived'::content_status,updated_at=now() where id=p_offer_id;
  insert into public.audit_logs(restaurant_id,actor_user_id,action,entity_type,entity_id,after_data) values(v_offer.restaurant_id,v_uid,'operator_offer_archived','offer',p_offer_id::text,jsonb_build_object('title',v_offer.title));
  return jsonb_build_object('ok',true,'offer_id',p_offer_id,'status','archived');
end;$$;
revoke all on function public.operator_archive_offer(uuid) from public,anon;
grant execute on function public.operator_archive_offer(uuid) to authenticated;

create or replace function public.get_operator_workspace(p_restaurant_id bigint)
returns jsonb language plpgsql stable security definer
set search_path=public,private,auth,pg_temp as $$
declare v_uid uuid:=(select auth.uid()); v_member public.restaurant_memberships%rowtype;
begin
  if v_uid is null then raise exception 'login_required'; end if;
  select * into v_member from public.restaurant_memberships where restaurant_id=p_restaurant_id and user_id=v_uid limit 1;
  if not found and not private.is_hoy_admin() then raise exception 'membership_required'; end if;
  return jsonb_build_object(
    'restaurant_id',p_restaurant_id,
    'membership',case when v_member.restaurant_id is null then null else jsonb_build_object('role',v_member.role,'verified_at',v_member.verified_at) end,
    'entitlement',(select jsonb_build_object('operator_verified',e.operator_verified,'active_plan',e.active_plan,'updated_at',e.updated_at) from public.restaurant_entitlements e where e.restaurant_id=p_restaurant_id),
    'services',(select jsonb_build_object('reservation',s.reservation_state,'pickup',s.pickup_state,'delivery',s.delivery_state,'confirmed_at',s.confirmed_at) from public.restaurant_services s where s.restaurant_id=p_restaurant_id),
    'live_hours',(select jsonb_build_object('confirmed_at',h.confirmed_at,'updated_at',h.updated_at,'display_text',h.display_text) from public.restaurant_live_hours h where h.restaurant_id=p_restaurant_id),
    'menu',(select jsonb_build_object('count',count(*),'latest_status',(array_agg(m.status order by m.submitted_at desc))[1],'latest_processor_state',(array_agg(m.processor_state order by m.submitted_at desc))[1],'latest_submitted_at',max(m.submitted_at),'latest_published_at',max(m.published_at)) from public.menu_intake_submissions m where m.restaurant_id=p_restaurant_id),
    'media',(select jsonb_build_object('candidate_count',count(*),'approved_count',count(*) filter (where c.operator_decision='approved'),'pending_count',count(*) filter (where c.operator_decision='pending'),'public_count',count(*) filter (where c.is_public=true)) from public.venue_media_candidates c where c.restaurant_id=p_restaurant_id),
    'offers',(select jsonb_build_object('draft_count',count(*) filter (where o.status='draft'::content_status),'published_count',count(*) filter (where o.status='published'::content_status),'active_count',count(*) filter (where o.status='published'::content_status and (o.ends_at is null or o.ends_at>now()))) from public.offers o where o.restaurant_id=p_restaurant_id),
    'profile_change',(select jsonb_build_object('id',r.id,'status',r.status,'changes',r.changes,'submitted_at',r.submitted_at,'rejection_reason',r.rejection_reason) from public.restaurant_profile_change_requests r where r.restaurant_id=p_restaurant_id order by r.submitted_at desc limit 1),
    'upgrade_request',(select jsonb_build_object('id',u.id,'requested_plan',u.requested_plan,'status',u.status,'created_at',u.created_at) from public.operator_upgrade_requests u where u.restaurant_id=p_restaurant_id order by u.created_at desc limit 1)
  );
end;$$;
revoke all on function public.get_operator_workspace(bigint) from public,anon;
grant execute on function public.get_operator_workspace(bigint) to authenticated;

create or replace function public.admin_review_profile_change_internal(p_request_id uuid,p_decision text,p_reviewer uuid,p_rejection_reason text default null)
returns jsonb language plpgsql security definer
set search_path=public,auth,pg_temp as $$
declare r public.restaurant_profile_change_requests%rowtype; v_now timestamptz:=now();
begin
  if p_decision not in ('approved','rejected') then raise exception 'invalid_decision'; end if;
  if p_decision='rejected' and nullif(btrim(p_rejection_reason),'') is null then raise exception 'rejection_reason_required'; end if;
  select * into r from public.restaurant_profile_change_requests where id=p_request_id for update;
  if not found then raise exception 'request_not_found'; end if;
  if r.status<>'pending' then raise exception 'request_not_pending'; end if;
  if p_decision='approved' then
    update public.restaurants set address=case when r.changes ? 'address' then r.changes->>'address' else address end,phone=case when r.changes ? 'phone' then r.changes->>'phone' else phone end,website=case when r.changes ? 'website' then nullif(r.changes->>'website','') else website end,description=case when r.changes ? 'description' then r.changes->>'description' else description end,hours_text=case when r.changes ? 'hours_text' then nullif(r.changes->>'hours_text','') else hours_text end,updated_at=v_now where id=r.restaurant_id;
  end if;
  update public.restaurant_profile_change_requests set status=p_decision,reviewed_at=v_now,reviewed_by=p_reviewer,rejection_reason=case when p_decision='rejected' then btrim(p_rejection_reason) else null end,applied_at=case when p_decision='approved' then v_now else null end where id=p_request_id;
  insert into public.audit_logs(restaurant_id,actor_user_id,action,entity_type,entity_id,before_data,after_data) values(r.restaurant_id,p_reviewer,case when p_decision='approved' then 'admin_profile_change_approved' else 'admin_profile_change_rejected' end,'restaurant_profile_change_request',r.id::text,jsonb_build_object('status',r.status,'changes',r.changes),jsonb_build_object('status',p_decision,'rejection_reason',case when p_decision='rejected' then btrim(p_rejection_reason) else null end));
  return jsonb_build_object('ok',true,'request_id',r.id,'restaurant_id',r.restaurant_id,'status',p_decision,'applied',p_decision='approved');
end;$$;
revoke all on function public.admin_review_profile_change_internal(uuid,text,uuid,text) from public,anon,authenticated;
grant execute on function public.admin_review_profile_change_internal(uuid,text,uuid,text) to service_role;
