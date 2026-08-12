-- HOY 2026-08-12 · menu discovery + review-first editorial import pipeline

alter table public.restaurants
  add column if not exists menu_expectation text not null default 'unknown',
  add column if not exists menu_expectation_source text not null default 'venue_type';

alter table public.restaurants drop constraint if exists restaurants_menu_expectation_check;
alter table public.restaurants add constraint restaurants_menu_expectation_check
  check (menu_expectation in ('food','drinks','dessert','unknown'));
alter table public.restaurants drop constraint if exists restaurants_menu_expectation_source_check;
alter table public.restaurants add constraint restaurants_menu_expectation_source_check
  check (menu_expectation_source in ('venue_type','manual','operator'));

update public.restaurants
set menu_expectation = case
  when venue_type in ('restaurant','chiringuito','beach_club') then 'food'
  when venue_type in ('bar','nightlife','cafe') then 'drinks'
  when venue_type = 'ice_cream_bar' then 'dessert'
  else 'unknown'
end,
menu_expectation_source='venue_type'
where menu_expectation_source='venue_type';

comment on column public.restaurants.menu_expectation is 'Expected primary menu family for coverage/discovery; keeps food-menu coverage separate from drink-centric venues.';
comment on column public.restaurants.menu_expectation_source is 'How menu_expectation was assigned: venue_type, manual, or operator.';

create table if not exists public.menu_editorial_imports (
  id uuid primary key default gen_random_uuid(),
  restaurant_id bigint not null references public.restaurants(id) on delete cascade,
  source_id uuid not null references public.menu_sources(id) on delete cascade,
  requested_by uuid not null,
  status text not null default 'queued' check (status in ('queued','processing','review_required','approved','published','rejected','failed')),
  processor_state text not null default 'not_started' check (processor_state in ('not_started','queued','extracting','structured','needs_review','published','failed')),
  processor_note text,
  openai_response_id text,
  openai_response_status text,
  openai_model text,
  extractor_version text,
  source_hash text,
  item_count integer,
  low_confidence_count integer,
  started_at timestamptz,
  processed_at timestamptz,
  approved_at timestamptz,
  approved_by uuid,
  published_at timestamptz,
  coverage_confirmed boolean not null default false,
  coverage_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_id, source_hash)
);

create table if not exists public.menu_editorial_import_items (
  id uuid primary key default gen_random_uuid(),
  import_id uuid not null references public.menu_editorial_imports(id) on delete cascade,
  position integer not null default 0,
  category text not null,
  name text not null,
  description text,
  price_text text,
  confidence numeric(5,4),
  review_status text not null default 'extracted' check (review_status in ('extracted','edited','confirmed','rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists menu_editorial_imports_restaurant_idx on public.menu_editorial_imports(restaurant_id, created_at desc);
create index if not exists menu_editorial_imports_status_idx on public.menu_editorial_imports(status, created_at desc);
create index if not exists menu_editorial_import_items_import_idx on public.menu_editorial_import_items(import_id, position);
create index if not exists menu_items_source_id_idx on public.menu_items(source_id) where source_id is not null;

alter table public.menu_editorial_imports enable row level security;
alter table public.menu_editorial_import_items enable row level security;
revoke all on public.menu_editorial_imports from anon, authenticated;
revoke all on public.menu_editorial_import_items from anon, authenticated;

drop policy if exists menu_editorial_imports_no_client_access on public.menu_editorial_imports;
create policy menu_editorial_imports_no_client_access on public.menu_editorial_imports
for all to public using (false) with check (false);

drop policy if exists menu_editorial_import_items_no_client_access on public.menu_editorial_import_items;
create policy menu_editorial_import_items_no_client_access on public.menu_editorial_import_items
for all to public using (false) with check (false);

comment on table public.menu_editorial_imports is 'Internal HOY review pipeline for factual extraction from verified official public menu sources; distinct from operator rights-attested uploads.';
comment on table public.menu_editorial_import_items is 'Internal extracted menu draft rows; never guest-visible until explicitly reviewed and published.';

create or replace function public.admin_publish_menu_editorial_import_internal(p_import_id uuid, p_actor uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  j public.menu_editorial_imports%rowtype;
  accepted_count integer;
  pending_count integer;
  now_ts timestamptz := now();
begin
  select * into j from public.menu_editorial_imports where id=p_import_id for update;
  if not found then raise exception 'import_not_found'; end if;
  if j.status not in ('review_required','approved') then raise exception 'import_not_reviewable'; end if;
  if not j.coverage_confirmed then raise exception 'coverage_confirmation_required'; end if;

  select count(*) into pending_count
  from public.menu_editorial_import_items
  where import_id=p_import_id and review_status='extracted';
  if pending_count > 0 then raise exception 'unreviewed_items_remaining'; end if;

  select count(*) into accepted_count
  from public.menu_editorial_import_items
  where import_id=p_import_id and review_status in ('edited','confirmed') and btrim(name)<>'';
  if accepted_count < 1 then raise exception 'no_confirmed_items'; end if;

  update public.menu_items set is_active=false, updated_at=now_ts where source_id=j.source_id and is_active=true;
  insert into public.menu_items(restaurant_id,source_id,category,name,description,price_text,is_active,source_checked_at,created_at,updated_at)
  select j.restaurant_id,j.source_id,btrim(category),btrim(name),nullif(btrim(description),''),nullif(btrim(price_text),''),true,now_ts,now_ts,now_ts
  from public.menu_editorial_import_items
  where import_id=p_import_id and review_status in ('edited','confirmed') and btrim(name)<>''
  order by position,id;

  update public.menu_sources
  set import_status='imported', completeness_status='complete', completeness_checked_at=now_ts,
      last_checked_at=now_ts,
      completeness_note='Vollständige offizielle Hauptkarte nach HOY-Redaktionsprüfung freigegeben.',
      coverage_meta=coalesce(coverage_meta,'{}'::jsonb) || jsonb_build_object('editorial_import_id',p_import_id,'confirmed_items',accepted_count,'coverage_confirmed',true,'published_at',now_ts)
  where id=j.source_id;

  update public.menu_editorial_imports
  set status='published', processor_state='published', approved_at=coalesce(approved_at,now_ts), approved_by=coalesce(approved_by,p_actor), published_at=now_ts, item_count=accepted_count, updated_at=now_ts
  where id=p_import_id;

  return jsonb_build_object('ok',true,'import_id',p_import_id,'restaurant_id',j.restaurant_id,'source_id',j.source_id,'published_items',accepted_count);
end;
$$;

revoke all on function public.admin_publish_menu_editorial_import_internal(uuid,uuid) from public, anon, authenticated;
grant execute on function public.admin_publish_menu_editorial_import_internal(uuid,uuid) to service_role;
