-- HOY 2.16 — structured events & specials for one-entry / multi-surface publishing.
-- The existing offers table stays the single content source; public RLS still exposes only published, non-expired rows.

alter table public.offers alter column offer_type set default 'special';

alter table public.offers
  add column if not exists event_kind text,
  add column if not exists entry_text text,
  add column if not exists reservation_recommended boolean not null default false,
  add column if not exists publisher_kind text not null default 'operator';

update public.offers
set offer_type = case lower(btrim(offer_type))
  when 'angebot' then 'special'
  when 'event' then 'event'
  when 'tagesgericht' then 'dish'
  when 'special' then 'special'
  when 'dish' then 'dish'
  else offer_type
end;

alter table public.offers drop constraint if exists offers_offer_type_check;
alter table public.offers add constraint offers_offer_type_check
  check (offer_type in ('special','event','dish'));

alter table public.offers drop constraint if exists offers_event_kind_check;
alter table public.offers add constraint offers_event_kind_check
  check (event_kind is null or event_kind in ('live_music','dj','sports','tasting','themed_evening','party','other'));

alter table public.offers drop constraint if exists offers_publisher_kind_check;
alter table public.offers add constraint offers_publisher_kind_check
  check (publisher_kind in ('operator','hoy'));

alter table public.offers drop constraint if exists offers_event_required_fields_check;
alter table public.offers add constraint offers_event_required_fields_check
  check (offer_type <> 'event' or (starts_at is not null and ends_at is not null and event_kind is not null));

alter table public.offers drop constraint if exists offers_entry_text_length_check;
alter table public.offers add constraint offers_entry_text_length_check
  check (entry_text is null or char_length(entry_text) <= 120);

create index if not exists idx_offers_public_schedule
  on public.offers(status, starts_at, ends_at);

drop policy if exists "members create drafts" on public.offers;
create policy "members create drafts" on public.offers
for insert to authenticated
with check (
  private.is_restaurant_member(restaurant_id)
  and created_by = (select auth.uid())
  and status = 'draft'::content_status
  and publisher_kind = 'operator'
);

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
     (v_offer.starts_at is null or v_offer.ends_at is null or v_offer.event_kind is null) then
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
