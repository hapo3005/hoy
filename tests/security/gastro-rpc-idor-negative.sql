-- HOY G1 privileged RPC negative-access regression
-- SAFE MODE: transaction-scoped fake JWT subject; all changes rolled back.
-- Intended for a controlled Supabase SQL session against a representative DB.
-- It fails if a fake authenticated subject without membership/claim reaches a privileged path.

begin;

select set_config(
  'request.jwt.claims',
  '{"sub":"00000000-0000-0000-0000-000000000001","role":"authenticated"}',
  true
);

do $$
declare
  v_restaurant_id bigint;
  v_offer_id uuid;
  v_media_id bigint;
begin
  select id into v_restaurant_id from public.restaurants order by id limit 1;
  select id into v_offer_id from public.offers order by created_at nulls last, id limit 1;
  select id into v_media_id from public.venue_media_candidates order by id limit 1;

  if v_restaurant_id is null then
    raise exception 'test_fixture_missing: restaurant';
  end if;

  begin
    perform public.get_operator_workspace(v_restaurant_id);
    raise exception 'unexpected_allow: get_operator_workspace';
  exception when others then
    if sqlerrm not in ('membership_required','login_required') then raise; end if;
  end;

  begin
    perform public.get_venue_media_review(v_restaurant_id);
    raise exception 'unexpected_allow: get_venue_media_review';
  exception when others then
    if sqlerrm not in ('claim_required','login_required') then raise; end if;
  end;

  if v_offer_id is not null then
    begin
      perform public.operator_archive_offer(v_offer_id);
      raise exception 'unexpected_allow: operator_archive_offer';
    exception when others then
      if sqlerrm not in ('verified_membership_required','login_required') then raise; end if;
    end;

    begin
      perform public.operator_publish_offer(v_offer_id);
      raise exception 'unexpected_allow: operator_publish_offer';
    exception when others then
      if sqlerrm not in ('verified_membership_required','login_required') then raise; end if;
    end;
  end if;

  begin
    perform public.operator_request_upgrade(v_restaurant_id,'pro'::public.plan_code,null);
    raise exception 'unexpected_allow: operator_request_upgrade';
  exception when others then
    if sqlerrm not in ('verified_membership_required','login_required') then raise; end if;
  end;

  begin
    perform public.operator_submit_profile_change(v_restaurant_id,'{"description":"negative-access-test"}'::jsonb,null);
    raise exception 'unexpected_allow: operator_submit_profile_change';
  exception when others then
    if sqlerrm not in ('verified_membership_required','login_required') then raise; end if;
  end;

  if v_media_id is not null then
    begin
      perform public.review_venue_media_candidates(
        v_restaurant_id,
        array[v_media_id]::bigint[],
        array[]::bigint[],
        array[]::bigint[]
      );
      raise exception 'unexpected_allow: review_venue_media_candidates';
    exception when others then
      if sqlerrm not in ('verified_operator_required','login_required') then raise; end if;
    end;
  end if;
end
$$;

rollback;

select 'gastro_rpc_idor_negative_ok' as result;
