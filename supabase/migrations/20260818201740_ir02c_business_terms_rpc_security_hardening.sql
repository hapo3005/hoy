-- IR-02C: keep public RPCs SECURITY INVOKER and privileged access in private helpers.
-- Production version: 20260818201740

create or replace function private.get_business_terms_status_internal(p_restaurant_id bigint)
returns jsonb language plpgsql stable security definer set search_path=''
as $$
declare
  v_uid uuid := auth.uid();
  v_active private.business_terms_versions%rowtype;
  v_accept private.business_terms_acceptances%rowtype;
begin
  if v_uid is null then raise exception 'login_required'; end if;
  if not exists(select 1 from public.restaurant_memberships m where m.restaurant_id=p_restaurant_id and m.user_id=v_uid)
     and not private.is_hoy_admin() then raise exception 'membership_required'; end if;

  select * into v_active from private.business_terms_versions
  where status='active' and effective_at is not null and effective_at <= now()
  order by effective_at desc limit 1;
  if not found then return jsonb_build_object('gate_configured',false,'status','not_active','active_version',null,'acceptance',null); end if;

  select * into v_accept from private.business_terms_acceptances
  where restaurant_id=p_restaurant_id and user_id=v_uid and terms_version=v_active.terms_version
    and document_sha256=v_active.document_sha256 and revoked_at is null and superseded_at is null
  order by accepted_at desc limit 1;

  return jsonb_build_object(
    'gate_configured',true,
    'status',case when v_accept.id is null then 'acceptance_required' else 'accepted' end,
    'active_version',v_active.terms_version,'effective_at',v_active.effective_at,
    'master_locale',v_active.master_locale,'document_sha256',v_active.document_sha256,
    'acceptance',case when v_accept.id is null then null else jsonb_build_object(
      'receipt_id',v_accept.id,'accepted_at',v_accept.accepted_at,'locale',v_accept.locale,
      'authority_role',v_accept.authority_role,'acceptance_method',v_accept.acceptance_method
    ) end
  );
end;
$$;
revoke all on function private.get_business_terms_status_internal(bigint) from public,anon;
grant execute on function private.get_business_terms_status_internal(bigint) to authenticated,service_role;

create or replace function private.operator_accept_business_terms_internal(
  p_restaurant_id bigint,p_terms_version text,p_locale text,p_authority_role text,
  p_acceptance_method text default 'clickwrap',p_authority_confirmed boolean default false,
  p_business_content_rights_confirmed boolean default false,p_media_rights_confirmed boolean default false,
  p_change_of_control_ack boolean default false,p_privacy_notice_ack boolean default false,
  p_evidence jsonb default '{}'::jsonb
)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare
  v_uid uuid := auth.uid();
  v_terms private.business_terms_versions%rowtype;
  v_existing private.business_terms_acceptances%rowtype;
  v_id uuid;
  v_accepted_at timestamptz;
begin
  if v_uid is null then raise exception 'login_required'; end if;
  if not exists(select 1 from public.restaurant_memberships m where m.restaurant_id=p_restaurant_id and m.user_id=v_uid and m.verified_at is not null)
    then raise exception 'verified_membership_required'; end if;

  select * into v_terms from private.business_terms_versions
  where terms_version=p_terms_version and status='active' and effective_at is not null and effective_at <= now() limit 1;
  if not found then raise exception 'terms_version_not_active'; end if;
  if p_locale not in ('de','es','en') then raise exception 'invalid_locale'; end if;
  if p_acceptance_method not in ('clickwrap','signed','admin_recorded') then raise exception 'invalid_acceptance_method'; end if;
  if char_length(btrim(coalesce(p_authority_role,''))) not between 2 and 120 then raise exception 'invalid_authority_role'; end if;
  if not coalesce(p_authority_confirmed,false) or not coalesce(p_business_content_rights_confirmed,false)
     or not coalesce(p_media_rights_confirmed,false) or not coalesce(p_change_of_control_ack,false)
     or not coalesce(p_privacy_notice_ack,false) then raise exception 'required_acknowledgement_missing'; end if;
  if jsonb_typeof(coalesce(p_evidence,'{}'::jsonb)) <> 'object' then raise exception 'invalid_evidence'; end if;

  select * into v_existing from private.business_terms_acceptances
  where restaurant_id=p_restaurant_id and user_id=v_uid and terms_version=p_terms_version
    and revoked_at is null and superseded_at is null order by accepted_at desc limit 1;
  if found then return jsonb_build_object('ok',true,'already_accepted',true,'receipt_id',v_existing.id,'terms_version',v_existing.terms_version,'accepted_at',v_existing.accepted_at,'document_sha256',v_existing.document_sha256); end if;

  insert into private.business_terms_acceptances(
    restaurant_id,user_id,terms_version,document_sha256,locale,authority_role,acceptance_method,
    authority_confirmed,business_content_rights_confirmed,media_rights_confirmed,change_of_control_ack,privacy_notice_ack,evidence
  ) values (
    p_restaurant_id,v_uid,p_terms_version,v_terms.document_sha256,p_locale,btrim(p_authority_role),p_acceptance_method,
    true,true,true,true,true,coalesce(p_evidence,'{}'::jsonb)
  ) returning id,accepted_at into v_id,v_accepted_at;

  insert into public.audit_logs(restaurant_id,actor_user_id,action,entity_type,entity_id,after_data)
  values(p_restaurant_id,v_uid,'business_terms_accepted','business_terms_acceptance',v_id::text,
    jsonb_build_object('terms_version',p_terms_version,'document_sha256',v_terms.document_sha256,'locale',p_locale,'authority_role',btrim(p_authority_role),'acceptance_method',p_acceptance_method));

  return jsonb_build_object('ok',true,'already_accepted',false,'receipt_id',v_id,'terms_version',p_terms_version,'accepted_at',v_accepted_at,'document_sha256',v_terms.document_sha256);
end;
$$;
revoke all on function private.operator_accept_business_terms_internal(bigint,text,text,text,text,boolean,boolean,boolean,boolean,boolean,jsonb) from public,anon;
grant execute on function private.operator_accept_business_terms_internal(bigint,text,text,text,text,boolean,boolean,boolean,boolean,boolean,jsonb) to authenticated,service_role;

create or replace function public.get_business_terms_status(p_restaurant_id bigint)
returns jsonb language sql stable security invoker set search_path=''
as $$ select private.get_business_terms_status_internal(p_restaurant_id); $$;
revoke all on function public.get_business_terms_status(bigint) from public,anon;
grant execute on function public.get_business_terms_status(bigint) to authenticated;

create or replace function public.operator_accept_business_terms(
  p_restaurant_id bigint,p_terms_version text,p_locale text,p_authority_role text,
  p_acceptance_method text default 'clickwrap',p_authority_confirmed boolean default false,
  p_business_content_rights_confirmed boolean default false,p_media_rights_confirmed boolean default false,
  p_change_of_control_ack boolean default false,p_privacy_notice_ack boolean default false,
  p_evidence jsonb default '{}'::jsonb
)
returns jsonb language sql security invoker set search_path=''
as $$
  select private.operator_accept_business_terms_internal(
    p_restaurant_id,p_terms_version,p_locale,p_authority_role,p_acceptance_method,
    p_authority_confirmed,p_business_content_rights_confirmed,p_media_rights_confirmed,
    p_change_of_control_ack,p_privacy_notice_ack,p_evidence
  );
$$;
revoke all on function public.operator_accept_business_terms(bigint,text,text,text,text,boolean,boolean,boolean,boolean,boolean,jsonb) from public,anon;
grant execute on function public.operator_accept_business_terms(bigint,text,text,text,text,boolean,boolean,boolean,boolean,boolean,jsonb) to authenticated;
