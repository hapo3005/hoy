-- IR-02C Business Confirmed exact-snapshot evidence ledger.
-- Production version: 20260818201831

create table if not exists private.business_data_confirmations (
  id uuid primary key default gen_random_uuid(),
  restaurant_id bigint not null references public.restaurants(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  terms_acceptance_id uuid not null references private.business_terms_acceptances(id) on delete restrict,
  confirmation_type text not null check (confirmation_type in ('profile','hours','services','accessibility','menu','media','offer','event','live_status','other')),
  subject_type text not null check (char_length(btrim(subject_type)) between 2 and 80),
  subject_ref text not null check (char_length(btrim(subject_ref)) between 1 and 240),
  payload_sha256 text not null check (payload_sha256 ~ '^[0-9a-fA-F]{64}$'),
  source_channel text not null default 'operator_dashboard' check (source_channel in ('operator_dashboard','signed_form','admin_recorded','api')),
  status text not null default 'active' check (status in ('active','revoked','superseded')),
  evidence jsonb not null default '{}'::jsonb check (jsonb_typeof(evidence)='object'),
  confirmed_at timestamptz not null default now(),
  revoked_at timestamptz,
  revoked_reason text,
  superseded_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index if not exists uq_business_confirmation_active_subject
  on private.business_data_confirmations(restaurant_id,confirmation_type,subject_type,subject_ref)
  where status='active';
create index if not exists idx_business_confirmation_restaurant_time
  on private.business_data_confirmations(restaurant_id,confirmed_at desc);
create index if not exists idx_business_confirmation_acceptance
  on private.business_data_confirmations(terms_acceptance_id);

alter table private.business_data_confirmations enable row level security;
revoke all on private.business_data_confirmations from public,anon,authenticated;
grant select on private.business_data_confirmations to service_role;
create policy "deny client business data confirmations"
  on private.business_data_confirmations for all to anon,authenticated using(false) with check(false);

create or replace function private.operator_record_business_confirmation_internal(
  p_restaurant_id bigint,p_confirmation_type text,p_subject_type text,p_subject_ref text,
  p_payload_sha256 text,p_source_channel text default 'operator_dashboard',p_evidence jsonb default '{}'::jsonb
)
returns jsonb language plpgsql security definer set search_path=''
as $$
declare
  v_uid uuid := auth.uid();
  v_accept private.business_terms_acceptances%rowtype;
  v_id uuid;
  v_confirmed_at timestamptz;
begin
  if v_uid is null then raise exception 'login_required'; end if;
  if p_confirmation_type not in ('profile','hours','services','accessibility','menu','media','offer','event','live_status','other') then raise exception 'invalid_confirmation_type'; end if;
  if char_length(btrim(coalesce(p_subject_type,''))) not between 2 and 80 then raise exception 'invalid_subject_type'; end if;
  if char_length(btrim(coalesce(p_subject_ref,''))) not between 1 and 240 then raise exception 'invalid_subject_ref'; end if;
  if coalesce(p_payload_sha256,'') !~ '^[0-9a-fA-F]{64}$' then raise exception 'invalid_payload_sha256'; end if;
  if p_source_channel not in ('operator_dashboard','signed_form','admin_recorded','api') then raise exception 'invalid_source_channel'; end if;
  if jsonb_typeof(coalesce(p_evidence,'{}'::jsonb)) <> 'object' then raise exception 'invalid_evidence'; end if;

  if not private.has_active_business_terms(p_restaurant_id,v_uid) then raise exception 'business_terms_acceptance_required'; end if;

  select a.* into v_accept
  from private.business_terms_acceptances a
  join private.business_terms_versions v on v.terms_version=a.terms_version
  where a.restaurant_id=p_restaurant_id and a.user_id=v_uid
    and a.revoked_at is null and a.superseded_at is null
    and v.status='active' and v.effective_at <= now() and a.document_sha256=v.document_sha256
  order by a.accepted_at desc limit 1;
  if not found then raise exception 'active_terms_receipt_required'; end if;

  update private.business_data_confirmations
  set status='superseded',superseded_at=now()
  where restaurant_id=p_restaurant_id and confirmation_type=p_confirmation_type
    and subject_type=btrim(p_subject_type) and subject_ref=btrim(p_subject_ref) and status='active';

  insert into private.business_data_confirmations(
    restaurant_id,user_id,terms_acceptance_id,confirmation_type,subject_type,subject_ref,payload_sha256,source_channel,evidence
  ) values (
    p_restaurant_id,v_uid,v_accept.id,p_confirmation_type,btrim(p_subject_type),btrim(p_subject_ref),lower(p_payload_sha256),p_source_channel,coalesce(p_evidence,'{}'::jsonb)
  ) returning id,confirmed_at into v_id,v_confirmed_at;

  insert into public.audit_logs(restaurant_id,actor_user_id,action,entity_type,entity_id,after_data)
  values(p_restaurant_id,v_uid,'business_data_confirmed','business_data_confirmation',v_id::text,
    jsonb_build_object(
      'confirmation_type',p_confirmation_type,'subject_type',btrim(p_subject_type),'subject_ref',btrim(p_subject_ref),
      'payload_sha256',lower(p_payload_sha256),'terms_version',v_accept.terms_version,
      'terms_acceptance_id',v_accept.id,'source_channel',p_source_channel
    ));

  return jsonb_build_object(
    'ok',true,'confirmation_id',v_id,'confirmed_at',v_confirmed_at,'confirmation_type',p_confirmation_type,
    'subject_type',btrim(p_subject_type),'subject_ref',btrim(p_subject_ref),'payload_sha256',lower(p_payload_sha256),
    'terms_version',v_accept.terms_version,'terms_acceptance_id',v_accept.id
  );
end;
$$;
revoke all on function private.operator_record_business_confirmation_internal(bigint,text,text,text,text,text,jsonb) from public,anon;
grant execute on function private.operator_record_business_confirmation_internal(bigint,text,text,text,text,text,jsonb) to authenticated,service_role;

create or replace function public.operator_record_business_confirmation(
  p_restaurant_id bigint,p_confirmation_type text,p_subject_type text,p_subject_ref text,
  p_payload_sha256 text,p_source_channel text default 'operator_dashboard',p_evidence jsonb default '{}'::jsonb
)
returns jsonb language sql security invoker set search_path=''
as $$
  select private.operator_record_business_confirmation_internal(
    p_restaurant_id,p_confirmation_type,p_subject_type,p_subject_ref,p_payload_sha256,p_source_channel,p_evidence
  );
$$;
revoke all on function public.operator_record_business_confirmation(bigint,text,text,text,text,text,jsonb) from public,anon;
grant execute on function public.operator_record_business_confirmation(bigint,text,text,text,text,text,jsonb) to authenticated;

comment on table private.business_data_confirmations is 'Versioned evidence ledger for Business Confirmed data snapshots. Each confirmation is bound to an authenticated terms acceptance and exact payload SHA-256.';
