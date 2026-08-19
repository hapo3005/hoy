create or replace function private.get_menu_translation_review_summary_internal(p_limit integer default 100)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'pg_catalog','public','private','auth','pg_temp'
as $$
declare
  v_limit integer := greatest(1, least(coalesce(p_limit,100), 250));
  v_result jsonb;
begin
  if (select auth.uid()) is null then raise exception 'login_required'; end if;
  if not private.is_hoy_admin() then raise exception 'admin_required'; end if;

  select coalesce(jsonb_agg(to_jsonb(x) order by x.machine_descriptions desc, x.machine_rows desc, x.restaurant_name), '[]'::jsonb)
  into v_result
  from (
    select
      m.restaurant_id,
      r.name as restaurant_name,
      count(distinct m.id)::integer as active_items,
      count(*) filter (where t.translation_status='machine')::integer as machine_rows,
      count(*) filter (where t.translation_status='machine' and nullif(btrim(coalesce(t.description,'')),'') is not null)::integer as machine_descriptions,
      count(*) filter (where t.translation_status in ('curated','operator_confirmed'))::integer as human_verified_rows,
      count(*) filter (where t.translation_status='operator_confirmed')::integer as operator_confirmed_rows,
      coalesce(e.operator_verified,false) as operator_verified,
      exists(
        select 1 from public.restaurant_memberships rm
        where rm.restaurant_id=m.restaurant_id and rm.verified_at is not null
      ) as has_verified_member
    from public.menu_items m
    join public.menu_item_translations t on t.menu_item_id=m.id
    join public.restaurants r on r.id=m.restaurant_id
    left join public.restaurant_entitlements e on e.restaurant_id=m.restaurant_id
    where m.is_active=true
    group by m.restaurant_id,r.name,e.operator_verified
    having count(*) filter (where t.translation_status='machine')>0
    order by machine_descriptions desc,machine_rows desc,r.name
    limit v_limit
  ) x;

  return jsonb_build_object(
    'scope','admin',
    'prioritization','description-bearing machine rows first, then machine row count',
    'rights_effect','none',
    'restaurants',v_result
  );
end;
$$;

create or replace function private.get_menu_translation_review_queue_internal(
  p_restaurant_id bigint default null,
  p_limit integer default 100,
  p_offset integer default 0
)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'pg_catalog','public','private','auth','pg_temp'
as $$
declare
  v_uid uuid := (select auth.uid());
  v_admin boolean := false;
  v_limit integer := greatest(1, least(coalesce(p_limit,100), 200));
  v_offset integer := greatest(0, coalesce(p_offset,0));
  v_rows jsonb;
begin
  if v_uid is null then raise exception 'login_required'; end if;
  v_admin := private.is_hoy_admin();

  if not v_admin then
    if p_restaurant_id is null then raise exception 'restaurant_required'; end if;
    if not exists (
      select 1 from public.restaurant_memberships rm
      join public.restaurant_entitlements e on e.restaurant_id=rm.restaurant_id
      where rm.restaurant_id=p_restaurant_id
        and rm.user_id=v_uid
        and rm.verified_at is not null
        and e.operator_verified=true
    ) then raise exception 'verified_operator_required'; end if;
  end if;

  select coalesce(jsonb_agg(to_jsonb(q) order by q.priority_score desc,q.restaurant_name,q.category,q.item_name,q.locale), '[]'::jsonb)
  into v_rows
  from (
    select
      m.id as menu_item_id,
      m.restaurant_id,
      r.name as restaurant_name,
      m.category as source_category,
      m.name as source_name,
      m.description as source_description,
      m.price_text,
      t.locale,
      t.category,
      t.name as item_name,
      t.description,
      t.translation_status,
      t.updated_at,
      case when nullif(btrim(coalesce(t.description,'')),'') is not null then 20 else 10 end as priority_score,
      case when nullif(btrim(coalesce(t.description,'')),'') is not null then 'description_review' else 'name_category_review' end as priority_reason
    from public.menu_items m
    join public.menu_item_translations t on t.menu_item_id=m.id
    join public.restaurants r on r.id=m.restaurant_id
    where m.is_active=true
      and t.translation_status='machine'
      and (p_restaurant_id is null or m.restaurant_id=p_restaurant_id)
      and (v_admin or m.restaurant_id=p_restaurant_id)
    order by priority_score desc,r.name,t.category,t.name,t.locale
    limit v_limit offset v_offset
  ) q;

  return jsonb_build_object(
    'scope',case when v_admin then 'admin' else 'verified_operator' end,
    'restaurant_id',p_restaurant_id,
    'rights_effect','none',
    'rows',v_rows
  );
end;
$$;

create or replace function private.admin_review_menu_translation_internal(
  p_menu_item_id uuid,
  p_locale text,
  p_expected_updated_at timestamptz,
  p_decision text default 'confirmed',
  p_category text default null,
  p_name text default null,
  p_description text default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'pg_catalog','public','private','auth','pg_temp'
as $$
declare
  v_uid uuid := (select auth.uid());
  v_t public.menu_item_translations%rowtype;
  v_m public.menu_items%rowtype;
  v_category text;
  v_name text;
  v_description text;
begin
  if v_uid is null then raise exception 'login_required'; end if;
  if not private.is_hoy_admin() then raise exception 'admin_required'; end if;
  if p_locale not in ('de','es','en') then raise exception 'invalid_locale'; end if;
  if p_decision not in ('confirmed','corrected') then raise exception 'invalid_decision'; end if;

  select * into v_m from public.menu_items where id=p_menu_item_id and is_active=true;
  if not found then raise exception 'active_menu_item_required'; end if;

  select * into v_t from public.menu_item_translations
  where menu_item_id=p_menu_item_id and locale=p_locale
  for update;
  if not found then raise exception 'translation_not_found'; end if;
  if v_t.translation_status<>'machine' then raise exception 'machine_translation_required'; end if;
  if v_t.updated_at is distinct from p_expected_updated_at then raise exception 'stale_translation'; end if;

  if p_decision='confirmed' then
    v_category:=v_t.category; v_name:=v_t.name; v_description:=v_t.description;
  else
    v_category:=nullif(btrim(coalesce(p_category,'')),'');
    v_name:=nullif(btrim(coalesce(p_name,'')),'');
    v_description:=nullif(btrim(coalesce(p_description,'')),'');
  end if;

  if v_category is null or v_name is null then raise exception 'category_and_name_required'; end if;
  if nullif(btrim(coalesce(v_m.description,'')),'') is null and v_description is not null then raise exception 'description_must_match_source_presence'; end if;
  if nullif(btrim(coalesce(v_m.description,'')),'') is not null and v_description is null then raise exception 'description_must_match_source_presence'; end if;

  insert into private.menu_translation_reviews(
    menu_item_id,restaurant_id,locale,reviewer_id,reviewer_kind,decision,
    previous_status,previous_category,previous_name,previous_description,
    reviewed_category,reviewed_name,reviewed_description,translation_updated_at_before,evidence
  ) values (
    v_m.id,v_m.restaurant_id,p_locale,v_uid,'hoy_editor',p_decision,
    v_t.translation_status,v_t.category,v_t.name,v_t.description,
    v_category,v_name,v_description,v_t.updated_at,
    jsonb_build_object('surface','hoy_control_center','confirmation_scope','translation_factual_only','rights_effect','none')
  );

  update public.menu_item_translations
  set category=v_category,name=v_name,description=v_description,translation_status='curated',updated_at=clock_timestamp()
  where menu_item_id=p_menu_item_id and locale=p_locale;

  return jsonb_build_object('ok',true,'menu_item_id',p_menu_item_id,'restaurant_id',v_m.restaurant_id,'locale',p_locale,'translation_status','curated','decision',p_decision,'rights_effect','none');
end;
$$;

create or replace function private.operator_review_menu_translation_internal(
  p_menu_item_id uuid,
  p_locale text,
  p_expected_updated_at timestamptz,
  p_decision text default 'confirmed',
  p_category text default null,
  p_name text default null,
  p_description text default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'pg_catalog','public','private','auth','pg_temp'
as $$
declare
  v_uid uuid := (select auth.uid());
  v_t public.menu_item_translations%rowtype;
  v_m public.menu_items%rowtype;
  v_category text;
  v_name text;
  v_description text;
begin
  if v_uid is null then raise exception 'login_required'; end if;
  if p_locale not in ('de','es','en') then raise exception 'invalid_locale'; end if;
  if p_decision not in ('confirmed','corrected') then raise exception 'invalid_decision'; end if;

  select * into v_m from public.menu_items where id=p_menu_item_id and is_active=true;
  if not found then raise exception 'active_menu_item_required'; end if;

  if not exists (
    select 1 from public.restaurant_memberships rm
    join public.restaurant_entitlements e on e.restaurant_id=rm.restaurant_id
    where rm.restaurant_id=v_m.restaurant_id
      and rm.user_id=v_uid
      and rm.verified_at is not null
      and e.operator_verified=true
  ) then raise exception 'verified_operator_required'; end if;

  select * into v_t from public.menu_item_translations
  where menu_item_id=p_menu_item_id and locale=p_locale
  for update;
  if not found then raise exception 'translation_not_found'; end if;
  if v_t.translation_status<>'machine' then raise exception 'machine_translation_required'; end if;
  if v_t.updated_at is distinct from p_expected_updated_at then raise exception 'stale_translation'; end if;

  if p_decision='confirmed' then
    v_category:=v_t.category; v_name:=v_t.name; v_description:=v_t.description;
  else
    v_category:=nullif(btrim(coalesce(p_category,'')),'');
    v_name:=nullif(btrim(coalesce(p_name,'')),'');
    v_description:=nullif(btrim(coalesce(p_description,'')),'');
  end if;

  if v_category is null or v_name is null then raise exception 'category_and_name_required'; end if;
  if nullif(btrim(coalesce(v_m.description,'')),'') is null and v_description is not null then raise exception 'description_must_match_source_presence'; end if;
  if nullif(btrim(coalesce(v_m.description,'')),'') is not null and v_description is null then raise exception 'description_must_match_source_presence'; end if;

  insert into private.menu_translation_reviews(
    menu_item_id,restaurant_id,locale,reviewer_id,reviewer_kind,decision,
    previous_status,previous_category,previous_name,previous_description,
    reviewed_category,reviewed_name,reviewed_description,translation_updated_at_before,evidence
  ) values (
    v_m.id,v_m.restaurant_id,p_locale,v_uid,'restaurant_operator',p_decision,
    v_t.translation_status,v_t.category,v_t.name,v_t.description,
    v_category,v_name,v_description,v_t.updated_at,
    jsonb_build_object('surface','operator_workspace','confirmation_scope','translation_factual_only','rights_effect','none')
  );

  update public.menu_item_translations
  set category=v_category,name=v_name,description=v_description,translation_status='operator_confirmed',updated_at=clock_timestamp()
  where menu_item_id=p_menu_item_id and locale=p_locale;

  return jsonb_build_object('ok',true,'menu_item_id',p_menu_item_id,'restaurant_id',v_m.restaurant_id,'locale',p_locale,'translation_status','operator_confirmed','decision',p_decision,'rights_effect','none');
end;
$$;

revoke all on function private.get_menu_translation_review_summary_internal(integer) from public, anon;
revoke all on function private.get_menu_translation_review_queue_internal(bigint,integer,integer) from public, anon;
revoke all on function private.admin_review_menu_translation_internal(uuid,text,timestamptz,text,text,text,text) from public, anon;
revoke all on function private.operator_review_menu_translation_internal(uuid,text,timestamptz,text,text,text,text) from public, anon;
grant execute on function private.get_menu_translation_review_summary_internal(integer) to authenticated, service_role;
grant execute on function private.get_menu_translation_review_queue_internal(bigint,integer,integer) to authenticated, service_role;
grant execute on function private.admin_review_menu_translation_internal(uuid,text,timestamptz,text,text,text,text) to authenticated, service_role;
grant execute on function private.operator_review_menu_translation_internal(uuid,text,timestamptz,text,text,text,text) to authenticated, service_role;

create or replace function public.get_menu_translation_review_summary(p_limit integer default 100)
returns jsonb
language sql
stable
set search_path to ''
as $$
  select private.get_menu_translation_review_summary_internal(p_limit);
$$;

create or replace function public.get_menu_translation_review_queue(p_restaurant_id bigint default null,p_limit integer default 100,p_offset integer default 0)
returns jsonb
language sql
stable
set search_path to ''
as $$
  select private.get_menu_translation_review_queue_internal(p_restaurant_id,p_limit,p_offset);
$$;

create or replace function public.admin_review_menu_translation(p_menu_item_id uuid,p_locale text,p_expected_updated_at timestamptz,p_decision text default 'confirmed',p_category text default null,p_name text default null,p_description text default null)
returns jsonb
language sql
set search_path to ''
as $$
  select private.admin_review_menu_translation_internal(p_menu_item_id,p_locale,p_expected_updated_at,p_decision,p_category,p_name,p_description);
$$;

create or replace function public.operator_review_menu_translation(p_menu_item_id uuid,p_locale text,p_expected_updated_at timestamptz,p_decision text default 'confirmed',p_category text default null,p_name text default null,p_description text default null)
returns jsonb
language sql
set search_path to ''
as $$
  select private.operator_review_menu_translation_internal(p_menu_item_id,p_locale,p_expected_updated_at,p_decision,p_category,p_name,p_description);
$$;

revoke all on function public.get_menu_translation_review_summary(integer) from public, anon;
revoke all on function public.get_menu_translation_review_queue(bigint,integer,integer) from public, anon;
revoke all on function public.admin_review_menu_translation(uuid,text,timestamptz,text,text,text,text) from public, anon;
revoke all on function public.operator_review_menu_translation(uuid,text,timestamptz,text,text,text,text) from public, anon;
grant execute on function public.get_menu_translation_review_summary(integer) to authenticated;
grant execute on function public.get_menu_translation_review_queue(bigint,integer,integer) to authenticated;
grant execute on function public.admin_review_menu_translation(uuid,text,timestamptz,text,text,text,text) to authenticated;
grant execute on function public.operator_review_menu_translation(uuid,text,timestamptz,text,text,text,text) to authenticated;
