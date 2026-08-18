-- IR-02C Business Terms acceptance infrastructure.
-- Production version: 20260818201632
-- DRAFT terms remain dormant until full activation clearance is present.

create table if not exists private.business_terms_versions (
  terms_version text primary key,
  title text not null,
  status text not null default 'draft' check (status in ('draft','active','retired')),
  master_locale text not null default 'de' check (master_locale in ('de','es','en')),
  document_path text not null,
  document_git_blob_sha text,
  document_sha256 text,
  spanish_document_path text,
  spanish_document_sha256 text,
  legal_entity_name text,
  registered_address text,
  company_registration_no text,
  vat_id text,
  legal_contact_email text,
  privacy_notice_version text,
  governing_law text,
  jurisdiction text,
  effective_at timestamptz,
  activated_at timestamptz,
  counsel_reviewed_at timestamptz,
  counsel_reference text,
  supersedes text references private.business_terms_versions(terms_version) on delete set null,
  activation_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint business_terms_active_requires_clearance check (
    status <> 'active' or (
      effective_at is not null and
      activated_at is not null and
      document_sha256 ~ '^[0-9a-fA-F]{64}$' and
      spanish_document_path is not null and
      spanish_document_sha256 ~ '^[0-9a-fA-F]{64}$' and
      legal_entity_name is not null and btrim(legal_entity_name) <> '' and legal_entity_name not like '%TBD%' and
      registered_address is not null and btrim(registered_address) <> '' and registered_address not like '%TBD%' and
      legal_contact_email is not null and legal_contact_email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$' and
      privacy_notice_version is not null and btrim(privacy_notice_version) <> '' and
      governing_law is not null and btrim(governing_law) <> '' and governing_law not like '%TBD%' and
      jurisdiction is not null and btrim(jurisdiction) <> '' and jurisdiction not like '%TBD%' and
      counsel_reviewed_at is not null and
      counsel_reference is not null and btrim(counsel_reference) <> ''
    )
  )
);

create table if not exists private.business_terms_acceptances (
  id uuid primary key default gen_random_uuid(),
  restaurant_id bigint not null references public.restaurants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  terms_version text not null references private.business_terms_versions(terms_version) on delete restrict,
  document_sha256 text not null,
  accepted_at timestamptz not null default now(),
  locale text not null check (locale in ('de','es','en')),
  authority_role text not null check (char_length(btrim(authority_role)) between 2 and 120),
  acceptance_method text not null default 'clickwrap' check (acceptance_method in ('clickwrap','signed','admin_recorded')),
  authority_confirmed boolean not null,
  business_content_rights_confirmed boolean not null,
  media_rights_confirmed boolean not null,
  change_of_control_ack boolean not null,
  privacy_notice_ack boolean not null,
  evidence jsonb not null default '{}'::jsonb check (jsonb_typeof(evidence)='object'),
  revoked_at timestamptz,
  revoked_reason text,
  superseded_at timestamptz,
  created_at timestamptz not null default now(),
  constraint business_terms_acceptance_acknowledgements check (
    authority_confirmed and business_content_rights_confirmed and media_rights_confirmed and change_of_control_ack and privacy_notice_ack
  )
);

create unique index if not exists uq_business_terms_acceptance_current
  on private.business_terms_acceptances(restaurant_id,user_id,terms_version)
  where revoked_at is null and superseded_at is null;
create index if not exists idx_business_terms_acceptances_restaurant
  on private.business_terms_acceptances(restaurant_id,accepted_at desc);
create index if not exists idx_business_terms_acceptances_user
  on private.business_terms_acceptances(user_id,accepted_at desc);

alter table private.business_terms_versions enable row level security;
alter table private.business_terms_acceptances enable row level security;
revoke all on private.business_terms_versions from public, anon, authenticated;
revoke all on private.business_terms_acceptances from public, anon, authenticated;
grant select on private.business_terms_versions to service_role;
grant select on private.business_terms_acceptances to service_role;

create policy "deny client business terms versions"
  on private.business_terms_versions for all to anon, authenticated using (false) with check (false);
create policy "deny client business terms acceptances"
  on private.business_terms_acceptances for all to anon, authenticated using (false) with check (false);

insert into private.business_terms_versions(
  terms_version,title,status,master_locale,document_path,document_git_blob_sha,activation_notes
) values (
  '1.0','HOY Business Data & Media Terms v1.0','draft','de',
  'docs/legal/HOY_BUSINESS_DATA_MEDIA_TERMS_v1.0_DE.md',
  '89e853e6b61cc01e1bf1d5a56320d2b6bfa4fad7',
  'DRAFT ONLY. Activation blocked until definitive HOY entity, SHA-256 hashes, Spanish localization, privacy version, governing law/jurisdiction and counsel review are recorded.'
)
on conflict (terms_version) do update set
  title=excluded.title,
  document_path=excluded.document_path,
  document_git_blob_sha=excluded.document_git_blob_sha,
  activation_notes=excluded.activation_notes,
  updated_at=now()
where private.business_terms_versions.status='draft';

create or replace function private.business_terms_gate_required()
returns boolean language sql stable security definer set search_path=''
as $$
  select exists(select 1 from private.business_terms_versions v where v.status='active' and v.effective_at is not null and v.effective_at <= now());
$$;

create or replace function private.has_active_business_terms(p_restaurant_id bigint,p_user_id uuid)
returns boolean language sql stable security definer set search_path=''
as $$
  select exists(
    select 1
    from public.restaurant_memberships m
    join private.business_terms_versions v on v.status='active' and v.effective_at is not null and v.effective_at <= now()
    join private.business_terms_acceptances a
      on a.restaurant_id=m.restaurant_id and a.user_id=m.user_id and a.terms_version=v.terms_version
     and a.document_sha256=v.document_sha256 and a.revoked_at is null and a.superseded_at is null
    where m.restaurant_id=p_restaurant_id and m.user_id=p_user_id and m.verified_at is not null
  );
$$;

create or replace function private.enforce_business_terms_on_operator_write()
returns trigger language plpgsql security definer set search_path=''
as $$
declare
  v_uid uuid := auth.uid();
  v_restaurant_id bigint;
begin
  if not private.business_terms_gate_required() then return coalesce(new,old); end if;
  if v_uid is null then return coalesce(new,old); end if;

  v_restaurant_id := coalesce(
    nullif(to_jsonb(new)->>'restaurant_id','')::bigint,
    nullif(to_jsonb(old)->>'restaurant_id','')::bigint
  );
  if v_restaurant_id is null then return coalesce(new,old); end if;

  if exists(
    select 1 from public.restaurant_memberships m
    where m.restaurant_id=v_restaurant_id and m.user_id=v_uid and m.verified_at is not null
  ) and not private.has_active_business_terms(v_restaurant_id,v_uid) then
    raise exception 'business_terms_acceptance_required';
  end if;
  return coalesce(new,old);
end;
$$;

revoke all on function private.business_terms_gate_required() from public,anon,authenticated;
revoke all on function private.has_active_business_terms(bigint,uuid) from public,anon,authenticated;
revoke all on function private.enforce_business_terms_on_operator_write() from public,anon,authenticated;

create or replace function public.get_business_terms_status(p_restaurant_id bigint)
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
    'active_version',v_active.terms_version,
    'effective_at',v_active.effective_at,
    'master_locale',v_active.master_locale,
    'document_sha256',v_active.document_sha256,
    'acceptance',case when v_accept.id is null then null else jsonb_build_object(
      'receipt_id',v_accept.id,'accepted_at',v_accept.accepted_at,'locale',v_accept.locale,
      'authority_role',v_accept.authority_role,'acceptance_method',v_accept.acceptance_method
    ) end
  );
end;
$$;
revoke all on function public.get_business_terms_status(bigint) from public,anon;
grant execute on function public.get_business_terms_status(bigint) to authenticated;

create or replace function public.operator_accept_business_terms(
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
revoke all on function public.operator_accept_business_terms(bigint,text,text,text,text,boolean,boolean,boolean,boolean,boolean,jsonb) from public,anon;
grant execute on function public.operator_accept_business_terms(bigint,text,text,text,text,boolean,boolean,boolean,boolean,boolean,jsonb) to authenticated;

-- Dormant until an active terms version exists.
drop trigger if exists trg_terms_gate_profile_changes on public.restaurant_profile_change_requests;
create trigger trg_terms_gate_profile_changes before insert or update on public.restaurant_profile_change_requests for each row execute function private.enforce_business_terms_on_operator_write();
drop trigger if exists trg_terms_gate_upgrade_requests on public.operator_upgrade_requests;
create trigger trg_terms_gate_upgrade_requests before insert or update on public.operator_upgrade_requests for each row execute function private.enforce_business_terms_on_operator_write();
drop trigger if exists trg_terms_gate_offers on public.offers;
create trigger trg_terms_gate_offers before insert or update on public.offers for each row execute function private.enforce_business_terms_on_operator_write();
drop trigger if exists trg_terms_gate_event_promotions on public.event_promotions;
create trigger trg_terms_gate_event_promotions before insert or update on public.event_promotions for each row execute function private.enforce_business_terms_on_operator_write();
drop trigger if exists trg_terms_gate_menu_intake on public.menu_intake_submissions;
create trigger trg_terms_gate_menu_intake before insert or update on public.menu_intake_submissions for each row execute function private.enforce_business_terms_on_operator_write();
drop trigger if exists trg_terms_gate_live_hours on public.restaurant_live_hours;
create trigger trg_terms_gate_live_hours before insert or update on public.restaurant_live_hours for each row execute function private.enforce_business_terms_on_operator_write();
drop trigger if exists trg_terms_gate_special_hours on public.restaurant_special_hours;
create trigger trg_terms_gate_special_hours before insert or update on public.restaurant_special_hours for each row execute function private.enforce_business_terms_on_operator_write();
drop trigger if exists trg_terms_gate_services on public.restaurant_services;
create trigger trg_terms_gate_services before insert or update on public.restaurant_services for each row execute function private.enforce_business_terms_on_operator_write();
drop trigger if exists trg_terms_gate_media_assets on public.media_assets;
create trigger trg_terms_gate_media_assets before insert or update on public.media_assets for each row execute function private.enforce_business_terms_on_operator_write();
drop trigger if exists trg_terms_gate_media_candidates on public.venue_media_candidates;
create trigger trg_terms_gate_media_candidates before insert or update on public.venue_media_candidates for each row execute function private.enforce_business_terms_on_operator_write();

comment on table private.business_terms_versions is 'Versioned HOY Business Terms registry. Active versions require full entity/legal/localization/hash/counsel clearance.';
comment on table private.business_terms_acceptances is 'Immutable evidence of authenticated Business Terms acceptance, linked to exact terms version and document SHA-256.';
comment on function public.operator_accept_business_terms(bigint,text,text,text,text,boolean,boolean,boolean,boolean,boolean,jsonb) is 'Authenticated verified business representative acceptance endpoint. Rejects draft/inactive terms versions.';
