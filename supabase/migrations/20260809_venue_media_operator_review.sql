-- HOY 1.9 — operator-curated media review
-- Mirrors the production migrations applied on 2026-08-09.

alter table public.venue_media_candidates
  add column if not exists operator_decision text not null default 'pending',
  add column if not exists operator_decided_by uuid references auth.users(id) on delete set null,
  add column if not exists operator_decided_at timestamptz,
  add column if not exists replacement_note text,
  add column if not exists published_storage_path text,
  add column if not exists published_media_asset_id uuid references public.media_assets(id) on delete set null;

alter table public.venue_media_candidates drop constraint if exists venue_media_candidates_operator_decision_check;
alter table public.venue_media_candidates add constraint venue_media_candidates_operator_decision_check
check (operator_decision in ('pending','approved','rejected','replace_requested'));

alter table public.venue_media_candidates drop constraint if exists venue_media_candidates_candidate_status_check;
alter table public.venue_media_candidates add constraint venue_media_candidates_candidate_status_check
check (candidate_status in ('source_identified','asset_selected','approved_for_profile','rejected','replaced','approved_source_pending_asset','approved_ready_for_publish','replace_requested','published'));

alter table public.venue_media_candidates drop constraint if exists venue_media_candidates_rights_status_check;
alter table public.venue_media_candidates add constraint venue_media_candidates_rights_status_check
check (rights_status in ('awaiting_operator_approval','operator_approved','operator_rejected','replacement_requested','rejected','licensed','unknown'));

alter table public.media_assets
  add column if not exists storage_bucket text not null default 'owner-media',
  add column if not exists display_role text not null default 'gallery',
  add column if not exists sort_order integer not null default 100,
  add column if not exists candidate_id bigint references public.venue_media_candidates(id) on delete set null;

alter table public.media_assets drop constraint if exists media_assets_display_role_check;
alter table public.media_assets add constraint media_assets_display_role_check
check (display_role in ('hero','food','terrace','drinks','event','interior','gallery','other'));
create index if not exists media_assets_candidate_id_idx on public.media_assets(candidate_id);

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('venue-media','venue-media',true,10485760,array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public=excluded.public,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;

alter table public.venue_media_candidates enable row level security;
revoke all on public.venue_media_candidates from anon;
revoke all on public.venue_media_candidates from authenticated;

create or replace function public.get_venue_media_review(p_restaurant_id bigint)
returns jsonb
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_member boolean := false;
  v_has_claim boolean := false;
  v_candidates jsonb;
begin
  if v_uid is null then raise exception 'login_required'; end if;
  v_member := private.is_restaurant_member(p_restaurant_id);
  select exists(
    select 1 from public.business_claims bc
    where bc.restaurant_id=p_restaurant_id and bc.user_id=v_uid and bc.status in ('pending','verified')
  ) into v_has_claim;
  if not (v_member or v_has_claim) then raise exception 'claim_required'; end if;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id',c.id,'source_type',c.source_type,'source_page_url',c.source_page_url,'asset_url',c.asset_url,
    'intended_role',c.intended_role,'candidate_rank',c.candidate_rank,'curation_note',c.curation_note,
    'rights_status',c.rights_status,'candidate_status',c.candidate_status,'operator_decision',c.operator_decision,
    'is_public',c.is_public,'published_storage_path',c.published_storage_path
  ) order by c.candidate_rank,c.id),'[]'::jsonb)
  into v_candidates from public.venue_media_candidates c where c.restaurant_id=p_restaurant_id;

  return jsonb_build_object('restaurant_id',p_restaurant_id,'can_approve',v_member,'claim_status',case when v_member then 'verified' when v_has_claim then 'pending' else 'none' end,'candidates',v_candidates);
end;
$$;

create or replace function public.review_venue_media_candidates(
  p_restaurant_id bigint,
  p_approved_ids bigint[] default '{}'::bigint[],
  p_rejected_ids bigint[] default '{}'::bigint[],
  p_replace_ids bigint[] default '{}'::bigint[]
)
returns jsonb
language plpgsql
security definer
set search_path = public, private, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_all_ids bigint[] := coalesce(p_approved_ids,'{}'::bigint[]) || coalesce(p_rejected_ids,'{}'::bigint[]) || coalesce(p_replace_ids,'{}'::bigint[]);
  v_bad_count integer := 0;
begin
  if v_uid is null then raise exception 'login_required'; end if;
  if not private.is_restaurant_member(p_restaurant_id) then raise exception 'verified_operator_required'; end if;
  if coalesce(p_approved_ids,'{}'::bigint[]) && coalesce(p_rejected_ids,'{}'::bigint[])
     or coalesce(p_approved_ids,'{}'::bigint[]) && coalesce(p_replace_ids,'{}'::bigint[])
     or coalesce(p_rejected_ids,'{}'::bigint[]) && coalesce(p_replace_ids,'{}'::bigint[]) then
    raise exception 'candidate_in_multiple_decisions';
  end if;
  if cardinality(v_all_ids)>0 then
    select count(*) into v_bad_count from unnest(v_all_ids) x(id)
    where not exists (select 1 from public.venue_media_candidates c where c.id=x.id and c.restaurant_id=p_restaurant_id);
    if v_bad_count>0 then raise exception 'candidate_restaurant_mismatch'; end if;
  end if;

  update public.venue_media_candidates c
  set operator_decision='approved',operator_decided_by=v_uid,operator_decided_at=now(),rights_status='operator_approved',
      candidate_status=case when c.asset_url is null then 'approved_source_pending_asset' else 'approved_ready_for_publish' end,
      replacement_note=null,updated_at=now()
  where c.restaurant_id=p_restaurant_id and c.id=any(coalesce(p_approved_ids,'{}'::bigint[]));

  update public.venue_media_candidates c
  set operator_decision='rejected',operator_decided_by=v_uid,operator_decided_at=now(),rights_status='operator_rejected',
      candidate_status='rejected',is_public=false,replacement_note=null,updated_at=now()
  where c.restaurant_id=p_restaurant_id and c.id=any(coalesce(p_rejected_ids,'{}'::bigint[]));

  update public.venue_media_candidates c
  set operator_decision='replace_requested',operator_decided_by=v_uid,operator_decided_at=now(),rights_status='replacement_requested',
      candidate_status='replace_requested',is_public=false,updated_at=now()
  where c.restaurant_id=p_restaurant_id and c.id=any(coalesce(p_replace_ids,'{}'::bigint[]));

  return jsonb_build_object('restaurant_id',p_restaurant_id,'approved',coalesce(cardinality(p_approved_ids),0),'rejected',coalesce(cardinality(p_rejected_ids),0),'replace_requested',coalesce(cardinality(p_replace_ids),0));
end;
$$;

revoke all on function public.get_venue_media_review(bigint) from public;
grant execute on function public.get_venue_media_review(bigint) to authenticated;
revoke all on function public.review_venue_media_candidates(bigint,bigint[],bigint[],bigint[]) from public;
grant execute on function public.review_venue_media_candidates(bigint,bigint[],bigint[],bigint[]) to authenticated;

create or replace view public.published_venue_media with (security_invoker=true) as
select id,restaurant_id,storage_bucket,storage_path,display_role,sort_order,source_url
from public.media_assets where status='published'::content_status and rights_confirmed=true;
grant select on public.published_venue_media to anon,authenticated;
