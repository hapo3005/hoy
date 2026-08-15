-- HOY launch hardening: allow source-backed events when the organizer publishes a start but no exact end.
-- Operator content keeps its authenticated actor requirement; HOY-curated content may use a null created_by
-- only when source provenance is stored explicitly.

alter table public.offers
  alter column created_by drop not null,
  add column if not exists source_url text,
  add column if not exists source_checked_at timestamptz,
  add column if not exists source_label text;

alter table public.offers drop constraint if exists offers_event_required_fields_check;
alter table public.offers add constraint offers_event_required_fields_check
  check (offer_type <> 'event' or (starts_at is not null and event_kind is not null));

alter table public.offers drop constraint if exists offers_created_by_publisher_check;
alter table public.offers add constraint offers_created_by_publisher_check
  check (publisher_kind = 'hoy' or created_by is not null);

alter table public.offers drop constraint if exists offers_hoy_source_required_check;
alter table public.offers add constraint offers_hoy_source_required_check
  check (publisher_kind <> 'hoy' or (source_url is not null and source_checked_at is not null));

alter table public.offers drop constraint if exists offers_source_url_https_check;
alter table public.offers add constraint offers_source_url_https_check
  check (source_url is null or source_url ~ '^https://');

alter table public.offers drop constraint if exists offers_source_label_length_check;
alter table public.offers add constraint offers_source_label_length_check
  check (source_label is null or char_length(source_label) <= 160);

-- Public users may see an open-ended event before and during its Madrid calendar date,
-- but never indefinitely after that date just because ends_at is null.
drop policy if exists "public reads published offers" on public.offers;
create policy "public reads published offers" on public.offers
for select to anon, authenticated
using (
  status = 'published'::content_status
  and (
    (ends_at is not null and ends_at > now())
    or (
      ends_at is null
      and (
        offer_type <> 'event'
        or (starts_at at time zone 'Europe/Madrid')::date >= (now() at time zone 'Europe/Madrid')::date
      )
    )
  )
);

-- Operators may also publish an event without inventing an end time. The existing editor can stay
-- stricter until its UX is updated; this backend contract simply stops making a false end mandatory.
create or replace function public.operator_publish_offer(p_offer_id uuid)
returns jsonb language plpgsql security definer
set search_path=public,private,auth,pg_temp as $$
declare
  v_uid uuid := (select auth.uid());
  v_offer public.offers%rowtype;
  v_plan plan_code;
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

  if v_plan not in ('pro'::plan_code,'business'::plan_code) then
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
  set status='published'::content_status,
      publisher_kind='operator',
      published_at=coalesce(published_at,now()),
      updated_at=now()
  where id=p_offer_id;

  insert into public.audit_logs(
    restaurant_id,actor_user_id,action,entity_type,entity_id,after_data
  ) values (
    v_offer.restaurant_id,v_uid,'operator_offer_published','offer',p_offer_id::text,
    jsonb_build_object('title',v_offer.title,'plan',v_plan,'offer_type',v_offer.offer_type,'event_kind',v_offer.event_kind)
  );

  return jsonb_build_object('ok',true,'offer_id',p_offer_id,'status','published');
end;$$;

revoke all on function public.operator_publish_offer(uuid) from public,anon;
grant execute on function public.operator_publish_offer(uuid) to authenticated;
