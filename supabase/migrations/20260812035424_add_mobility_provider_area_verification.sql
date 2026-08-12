alter table public.mobility_provider_areas
  add column if not exists verification_status text not null default 'pending'
    check (verification_status in ('pending','verified','suspended')),
  add column if not exists verified_at timestamptz,
  add column if not exists coverage_note text;

update public.mobility_provider_areas pa
set verification_status = case when p.slug='radio-taxi-san-javier' then 'verified' else 'pending' end,
    verified_at = case when p.slug='radio-taxi-san-javier' then now() else null end,
    coverage_note = case
      when p.slug='radio-taxi-san-javier' then 'Official regional tourism directory identifies Radio Taxi San Javier; operational coverage still requires pre-launch reconfirmation.'
      when p.slug='radio-taxi-la-manga' then 'Official Cartagena directory identifies Radio Taxi La Manga for La Manga del Mar Menor (Cartagena), but HOY has not yet verified that this dispatch contact covers every Cartagena pickup in the broader HOY coastal region, especially Cabo de Palos.'
      else coverage_note
    end
from public.mobility_providers p
where p.id=pa.provider_id;

create or replace function public.mobility_resolve_local(
  p_lat double precision,
  p_lon double precision,
  p_accuracy_m double precision default 25,
  p_mode text default 'gps'
) returns jsonb
language plpgsql
security invoker
set search_path = public, extensions, pg_temp
as $$
declare
  v_point extensions.geometry(Point,4326);
  v_boundary public.mobility_municipal_boundaries%rowtype;
  v_other_geom extensions.geometry(MultiPolygon,4326);
  v_shared_boundary extensions.geometry;
  v_containing_count integer;
  v_accuracy double precision;
  v_safety_m double precision;
  v_boundary_distance_m double precision := 999999;
  v_area public.mobility_service_areas%rowtype;
  v_provider public.mobility_providers%rowtype;
begin
  if p_lat is null or p_lon is null or p_lat < -90 or p_lat > 90 or p_lon < -180 or p_lon > 180 then
    return jsonb_build_object('status','error','code','invalid_coordinates');
  end if;

  if p_lat < 37.60 or p_lat > 37.82 or p_lon < -0.86 or p_lon > -0.65 then
    return jsonb_build_object('status','unsupported','code','outside_hoy_region');
  end if;

  v_accuracy := greatest(0, least(coalesce(p_accuracy_m,25),5000));
  if coalesce(p_mode,'gps') <> 'venue' and v_accuracy > 120 then
    return jsonb_build_object('status','uncertain','code','low_location_accuracy','accuracy_m',round(v_accuracy));
  end if;

  v_safety_m := case when coalesce(p_mode,'gps')='venue' then 80 else greatest(80, ceil(v_accuracy + 40)) end;
  v_point := extensions.st_setsrid(extensions.st_makepoint(p_lon,p_lat),4326);

  select count(*) into v_containing_count
  from public.mobility_municipal_boundaries b
  where b.active and extensions.st_covers(b.geom,v_point);

  if v_containing_count <> 1 then
    return jsonb_build_object('status','uncertain','code','municipality_not_unique','matches',v_containing_count);
  end if;

  select b.* into v_boundary
  from public.mobility_municipal_boundaries b
  where b.active and extensions.st_covers(b.geom,v_point)
  limit 1;

  select b.geom into v_other_geom
  from public.mobility_municipal_boundaries b
  where b.active and b.id<>v_boundary.id
  order by b.id
  limit 1;

  if v_other_geom is not null then
    v_shared_boundary := extensions.st_intersection(extensions.st_boundary(v_boundary.geom),extensions.st_boundary(v_other_geom));
    if v_shared_boundary is not null and not extensions.st_isempty(v_shared_boundary) then
      v_boundary_distance_m := extensions.st_distance(v_point::extensions.geography,v_shared_boundary::extensions.geography);
    end if;
  end if;

  if v_boundary_distance_m <= v_safety_m then
    return jsonb_build_object(
      'status','uncertain',
      'code','near_municipal_boundary',
      'municipality',v_boundary.municipality_name,
      'distance_to_boundary_m',round(v_boundary_distance_m),
      'safety_radius_m',round(v_safety_m)
    );
  end if;

  select a.* into v_area
  from public.mobility_service_areas a
  where a.active
    and a.municipality_name=v_boundary.municipality_name
    and (a.valid_from is null or a.valid_from <= current_date)
    and (a.valid_until is null or a.valid_until >= current_date)
  order by a.id
  limit 1;

  if v_area.id is null then
    return jsonb_build_object('status','unsupported','code','no_verified_service_area','municipality',v_boundary.municipality_name);
  end if;

  select p.* into v_provider
  from public.mobility_provider_areas pa
  join public.mobility_providers p on p.id=pa.provider_id
  where pa.service_area_id=v_area.id
    and pa.active and p.active
    and pa.verification_status='verified'
    and (pa.valid_from is null or pa.valid_from <= current_date)
    and (pa.valid_until is null or pa.valid_until >= current_date)
  order by pa.priority asc, p.id asc
  limit 1;

  if v_provider.id is null then
    return jsonb_build_object('status','uncertain','code','no_verified_provider','municipality',v_boundary.municipality_name);
  end if;

  return jsonb_build_object(
    'status','resolved',
    'confidence','verified_local_boundary',
    'municipality',v_boundary.municipality_name,
    'municipality_code',v_boundary.national_code,
    'distance_to_boundary_m',round(v_boundary_distance_m),
    'safety_radius_m',round(v_safety_m),
    'area',jsonb_build_object(
      'slug',v_area.slug,
      'name',v_area.name,
      'verified_at',v_area.verified_at,
      'source_label',v_area.source_label
    ),
    'provider',jsonb_build_object(
      'slug',v_provider.slug,
      'name',v_provider.name,
      'phone_e164',v_provider.phone_e164,
      'phone_display',v_provider.phone_display,
      'alternate_phone_e164',v_provider.alternate_phone_e164,
      'alternate_phone_display',v_provider.alternate_phone_display,
      'whatsapp_e164',v_provider.whatsapp_e164,
      'website',v_provider.website,
      'verified_at',v_provider.verified_at,
      'source_label',v_provider.source_label
    ),
    'source',jsonb_build_object(
      'boundary','Instituto Geográfico Nacional · cached administrativeunit geometry',
      'boundary_dataset_date',v_boundary.source_dataset_date,
      'boundary_dataset_uncertainty_m',40,
      'imported_at',v_boundary.imported_at
    )
  );
end;
$$;

revoke all on function public.mobility_resolve_local(double precision,double precision,double precision,text) from public;
grant execute on function public.mobility_resolve_local(double precision,double precision,double precision,text) to anon, authenticated;
