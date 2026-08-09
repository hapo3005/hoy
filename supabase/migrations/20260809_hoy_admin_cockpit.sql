-- HOY 2.0 admin cockpit access model.
-- Production admin allowlist rows are data and intentionally not committed to the public repository.

create table if not exists public.hoy_admin_accounts (
  email text primary key,
  user_id uuid unique references auth.users(id) on delete set null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hoy_admin_accounts_email_lowercase check (email = lower(email))
);
alter table public.hoy_admin_accounts enable row level security;
revoke all on table public.hoy_admin_accounts from anon, authenticated;

create or replace function private.is_hoy_admin()
returns boolean language sql stable security definer
set search_path = public, private, auth, pg_temp
as $$
  select exists (
    select 1 from auth.users u
    join public.hoy_admin_accounts a on a.email=lower(coalesce(u.email,''))
    where u.id=(select auth.uid()) and u.email_confirmed_at is not null and a.active=true
  );
$$;
revoke all on function private.is_hoy_admin() from public, anon;
grant execute on function private.is_hoy_admin() to authenticated;

-- Admin policies are additive to the existing public/operator model.
do $$
begin
  execute 'drop policy if exists "hoy admins read claims" on public.business_claims';
  execute 'create policy "hoy admins read claims" on public.business_claims for select to authenticated using (private.is_hoy_admin())';
  execute 'drop policy if exists "hoy admins update claims" on public.business_claims';
  execute 'create policy "hoy admins update claims" on public.business_claims for update to authenticated using (private.is_hoy_admin()) with check (private.is_hoy_admin())';
  execute 'drop policy if exists "hoy admins read restaurants" on public.restaurants';
  execute 'create policy "hoy admins read restaurants" on public.restaurants for select to authenticated using (private.is_hoy_admin())';
  execute 'drop policy if exists "hoy admins update restaurants" on public.restaurants';
  execute 'create policy "hoy admins update restaurants" on public.restaurants for update to authenticated using (private.is_hoy_admin()) with check (private.is_hoy_admin())';
  execute 'drop policy if exists "hoy admins read sales pipeline" on public.venue_sales_pipeline';
  execute 'create policy "hoy admins read sales pipeline" on public.venue_sales_pipeline for select to authenticated using (private.is_hoy_admin())';
  execute 'drop policy if exists "hoy admins update sales pipeline" on public.venue_sales_pipeline';
  execute 'create policy "hoy admins update sales pipeline" on public.venue_sales_pipeline for update to authenticated using (private.is_hoy_admin()) with check (private.is_hoy_admin())';
  execute 'drop policy if exists "hoy admins read analytics" on public.analytics_events';
  execute 'create policy "hoy admins read analytics" on public.analytics_events for select to authenticated using (private.is_hoy_admin())';
  execute 'drop policy if exists "hoy admins read media candidates" on public.venue_media_candidates';
  execute 'create policy "hoy admins read media candidates" on public.venue_media_candidates for select to authenticated using (private.is_hoy_admin())';
  execute 'drop policy if exists "hoy admins update media candidates" on public.venue_media_candidates';
  execute 'create policy "hoy admins update media candidates" on public.venue_media_candidates for update to authenticated using (private.is_hoy_admin()) with check (private.is_hoy_admin())';
end $$;

-- The remaining operator-editable tables use the same admin predicate.
drop policy if exists "hoy admins manage entitlements" on public.restaurant_entitlements;
create policy "hoy admins manage entitlements" on public.restaurant_entitlements for all to authenticated using (private.is_hoy_admin()) with check (private.is_hoy_admin());
drop policy if exists "hoy admins read entitlements" on public.restaurant_entitlements;
create policy "hoy admins read entitlements" on public.restaurant_entitlements for select to authenticated using (private.is_hoy_admin());
drop policy if exists "hoy admins manage memberships" on public.restaurant_memberships;
create policy "hoy admins manage memberships" on public.restaurant_memberships for all to authenticated using (private.is_hoy_admin()) with check (private.is_hoy_admin());
drop policy if exists "hoy admins read memberships" on public.restaurant_memberships;
create policy "hoy admins read memberships" on public.restaurant_memberships for select to authenticated using (private.is_hoy_admin());
drop policy if exists "hoy admins manage services" on public.restaurant_services;
create policy "hoy admins manage services" on public.restaurant_services for all to authenticated using (private.is_hoy_admin()) with check (private.is_hoy_admin());
drop policy if exists "hoy admins read services" on public.restaurant_services;
create policy "hoy admins read services" on public.restaurant_services for select to authenticated using (private.is_hoy_admin());
drop policy if exists "hoy admins read media assets" on public.media_assets;
create policy "hoy admins read media assets" on public.media_assets for select to authenticated using (private.is_hoy_admin());
drop policy if exists "hoy admins update media assets" on public.media_assets;
create policy "hoy admins update media assets" on public.media_assets for update to authenticated using (private.is_hoy_admin()) with check (private.is_hoy_admin());
drop policy if exists "hoy admins manage menu sources" on public.menu_sources;
create policy "hoy admins manage menu sources" on public.menu_sources for all to authenticated using (private.is_hoy_admin()) with check (private.is_hoy_admin());
drop policy if exists "hoy admins manage menu items" on public.menu_items;
create policy "hoy admins manage menu items" on public.menu_items for all to authenticated using (private.is_hoy_admin()) with check (private.is_hoy_admin());
drop policy if exists "hoy admins manage offers" on public.offers;
create policy "hoy admins manage offers" on public.offers for all to authenticated using (private.is_hoy_admin()) with check (private.is_hoy_admin());
drop policy if exists "hoy admins read offers" on public.offers;
create policy "hoy admins read offers" on public.offers for select to authenticated using (private.is_hoy_admin());

grant select,update on public.business_claims,public.restaurants,public.venue_sales_pipeline,public.venue_media_candidates,public.media_assets to authenticated;
grant select on public.analytics_events to authenticated;
grant select,insert,update,delete on public.restaurant_entitlements,public.restaurant_memberships,public.restaurant_services,public.menu_sources,public.menu_items,public.offers to authenticated;

create or replace function public.admin_review_claim_internal(p_claim_id uuid,p_decision claim_status,p_reviewer uuid,p_rejection_reason text default null)
returns jsonb language plpgsql security definer set search_path=public,auth,pg_temp as $$
declare c public.business_claims%rowtype; v_now timestamptz:=now(); v_plan plan_code;
begin
  if p_decision not in ('verified'::claim_status,'rejected'::claim_status) then raise exception 'invalid_decision'; end if;
  if p_decision='rejected'::claim_status and nullif(btrim(p_rejection_reason),'') is null then raise exception 'rejection_reason_required'; end if;
  select * into c from public.business_claims where id=p_claim_id for update;
  if not found then raise exception 'claim_not_found'; end if;
  update public.business_claims set status=p_decision,reviewed_at=v_now,reviewed_by=p_reviewer,rejection_reason=case when p_decision='rejected'::claim_status then btrim(p_rejection_reason) else null end where id=p_claim_id;
  if p_decision='verified'::claim_status then
    insert into public.restaurant_memberships(restaurant_id,user_id,role,verified_at) values(c.restaurant_id,c.user_id,'owner',v_now)
      on conflict (restaurant_id,user_id) do update set role='owner',verified_at=excluded.verified_at;
    select active_plan into v_plan from public.restaurant_entitlements where restaurant_id=c.restaurant_id;
    insert into public.restaurant_entitlements(restaurant_id,operator_verified,active_plan,updated_at) values(c.restaurant_id,true,coalesce(v_plan,'free'::plan_code),v_now)
      on conflict (restaurant_id) do update set operator_verified=true,updated_at=excluded.updated_at;
  end if;
  insert into public.audit_logs(restaurant_id,actor_user_id,action,entity_type,entity_id,before_data,after_data)
    values(c.restaurant_id,p_reviewer,case when p_decision='verified'::claim_status then 'admin_claim_verified' else 'admin_claim_rejected' end,'business_claim',c.id::text,jsonb_build_object('status',c.status),jsonb_build_object('status',p_decision,'rejection_reason',case when p_decision='rejected'::claim_status then btrim(p_rejection_reason) else null end));
  return jsonb_build_object('ok',true,'claim_id',c.id,'restaurant_id',c.restaurant_id,'status',p_decision);
end;$$;
revoke all on function public.admin_review_claim_internal(uuid,claim_status,uuid,text) from public,anon,authenticated;
grant execute on function public.admin_review_claim_internal(uuid,claim_status,uuid,text) to service_role;

create or replace function public.admin_set_plan_internal(p_restaurant_id bigint,p_plan plan_code,p_reviewer uuid)
returns jsonb language plpgsql security definer set search_path=public,auth,pg_temp as $$
declare v_verified boolean:=false;
begin
  if not exists(select 1 from public.restaurants where id=p_restaurant_id) then raise exception 'restaurant_not_found'; end if;
  select operator_verified into v_verified from public.restaurant_entitlements where restaurant_id=p_restaurant_id;
  insert into public.restaurant_entitlements(restaurant_id,operator_verified,active_plan,updated_at) values(p_restaurant_id,coalesce(v_verified,false),p_plan,now())
    on conflict (restaurant_id) do update set active_plan=excluded.active_plan,updated_at=excluded.updated_at;
  insert into public.audit_logs(restaurant_id,actor_user_id,action,entity_type,entity_id,after_data) values(p_restaurant_id,p_reviewer,'admin_plan_changed','restaurant_entitlement',p_restaurant_id::text,jsonb_build_object('active_plan',p_plan));
  return jsonb_build_object('ok',true,'restaurant_id',p_restaurant_id,'plan',p_plan);
end;$$;
revoke all on function public.admin_set_plan_internal(bigint,plan_code,uuid) from public,anon,authenticated;
grant execute on function public.admin_set_plan_internal(bigint,plan_code,uuid) to service_role;
