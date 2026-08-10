-- Rebuild the HOY curated menu-eval gold snapshot from fully German-localized official menu sources.
with ranked_sources as (
  select ms.*, count(mi.id) filter (where mi.is_active) as active_count,
         row_number() over (
           partition by ms.restaurant_id
           order by count(mi.id) filter (where mi.is_active) desc, ms.last_checked_at desc nulls last
         ) as rn
  from public.menu_sources ms
  left join public.menu_items mi on mi.source_id=ms.id
  where ms.restaurant_id in (1,2,3,8,13,15,16,17,20,22)
  group by ms.id
), gold as (
  select rs.id source_id, rs.restaurant_id, rs.source_url, rs.source_kind, rs.content_hash
  from ranked_sources rs where rs.rn=1 and rs.active_count >= 20
), ordered as (
  select g.source_id,g.restaurant_id,g.source_url,g.source_kind,g.content_hash,r.name,
         row_number() over (partition by g.source_id order by mi.category, mi.created_at, mi.id)-1 as position,
         coalesce(mi.category,'') category_original, mi.name name_original,
         coalesce(mi.description,'') description_original, coalesce(mi.price_text,'') price_text,
         coalesce(mit.category,'') category_de, coalesce(mit.name,'') name_de,
         coalesce(mit.description,'') description_de
  from gold g
  join public.restaurants r on r.id=g.restaurant_id
  join public.menu_items mi on mi.source_id=g.source_id and mi.is_active
  join public.menu_item_translations mit on mit.menu_item_id=mi.id and mit.locale='de'
), snapshots as (
  select source_id,restaurant_id,source_url,source_kind,content_hash,name,count(*) item_count,
         jsonb_agg(jsonb_build_object(
           'position',position,'category_original',category_original,'name_original',name_original,
           'description_original',description_original,'price_text',price_text,'category_de',category_de,
           'name_de',name_de,'description_de',description_de
         ) order by position) expected_items
  from ordered
  group by source_id,restaurant_id,source_url,source_kind,content_hash,name
)
insert into public.menu_eval_cases
  (restaurant_id,source_id,label,source_url,source_kind,source_content_hash,expected_item_count,expected_items,is_active,updated_at)
select restaurant_id,source_id,name || ' · curated DE gold',source_url,source_kind,content_hash,item_count,expected_items,true,now()
from snapshots
on conflict (source_id) do update set
  label=excluded.label,
  source_url=excluded.source_url,
  source_kind=excluded.source_kind,
  source_content_hash=excluded.source_content_hash,
  expected_item_count=excluded.expected_item_count,
  expected_items=excluded.expected_items,
  is_active=true,
  updated_at=now();
