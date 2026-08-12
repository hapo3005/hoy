alter table public.mobility_provider_areas
  add column if not exists verification_status text not null default 'pending'
    check (verification_status in ('pending','verified','suspended')),
  add column if not exists verified_at timestamptz,
  add column if not exists coverage_note text;

-- San Javier is identified by both the official regional tourism directory and
-- the operator's own site, which explicitly states coverage of the whole municipality.
update public.mobility_provider_areas pa
set verification_status = case when p.slug='radio-taxi-san-javier' then 'verified' else 'pending' end,
    verified_at = case when p.slug='radio-taxi-san-javier' then now() else null end,
    coverage_note = case
      when p.slug='radio-taxi-san-javier' then 'Verified for the full municipality of San Javier: the official operator site states that its vehicles cover the entire municipality and identifies 968 57 33 00 as the reference taxi number; dedicated La Manga pages use the same number. This is corroborated by the official Murcia regional tourism listing.'
      when p.slug='radio-taxi-la-manga' then 'Official Cartagena directory identifies Radio Taxi La Manga for La Manga del Mar Menor (Cartagena). This La Manga-specific contact is not used as the broad Cartagena/Cabo de Palos provider.'
      else coverage_note
    end
from public.mobility_providers p
where p.id=pa.provider_id;

update public.mobility_providers
set website='https://taxilamangasanjavier.es/',
    source_label='Turismo Región de Murcia + Radio Taxi San Javier',
    source_url='https://taxilamangasanjavier.es/conoce-radio-taxi',
    notes='Official regional tourism listing confirms 968 573 300. The operator official site states that its vehicles cover the entire municipality of San Javier and identifies 968 57 33 00 as the reference taxi number; dedicated La Manga pages use the same number.',
    verified_at=now(),
    updated_at=now()
where slug='radio-taxi-san-javier';

-- The broad Cartagena service area uses the general Cartagena dispatch rather than
-- extending the La Manga-specific number to Cabo de Palos by assumption.
insert into public.mobility_providers (
  slug,name,phone_e164,phone_display,alternate_phone_e164,alternate_phone_display,
  website,active,verified_at,source_label,source_url,notes
)
values (
  'radio-taxi-cartagena','Radio Taxi Cartagena','+34968311515','968 311 515',
  '+34968520404','968 520 404','https://radiotaxicartagena.es/',true,now(),
  'Ayuntamiento de Cartagena + Radio Taxi Cartagena',
  'https://radiotaxicartagena.es/',
  'Cartagena official taxi directory lists Radio Taxi Cartagena. The operator official site states service in Cartagena and La Manga and publishes these general dispatch numbers.'
)
on conflict (slug) do update set
  name=excluded.name,
  phone_e164=excluded.phone_e164,
  phone_display=excluded.phone_display,
  alternate_phone_e164=excluded.alternate_phone_e164,
  alternate_phone_display=excluded.alternate_phone_display,
  website=excluded.website,
  active=true,
  verified_at=excluded.verified_at,
  source_label=excluded.source_label,
  source_url=excluded.source_url,
  notes=excluded.notes,
  updated_at=now();

insert into public.mobility_provider_areas (
  provider_id,service_area_id,priority,active,valid_from,verification_status,verified_at,coverage_note
)
select p.id,a.id,5,true,'2026-08-12','verified',now(),
  'Verified for Cartagena municipality routing: Ayuntamiento de Cartagena lists Radio Taxi Cartagena as a municipal taxi operator, and the operator official site states taxi service in Cartagena and La Manga using the general dispatch numbers. Cabo de Palos is within Cartagena municipal territory. Direct operational reconfirmation remains a public-launch gate.'
from public.mobility_providers p
join public.mobility_service_areas a on a.slug='cartagena-coast'
where p.slug='radio-taxi-cartagena'
on conflict (provider_id,service_area_id) do update set
  priority=excluded.priority,
  active=true,
  valid_from=excluded.valid_from,
  valid_until=null,
  verification_status='verified',
  verified_at=excluded.verified_at,
  coverage_note=excluded.coverage_note;

update public.mobility_provider_areas pa
set verification_status='suspended',
    verified_at=null,
    coverage_note='La Manga-specific dispatch contact is officially listed for La Manga del Mar Menor (Cartagena), but this assignment is intentionally suspended because the cartagena-coast service area also includes Cabo de Palos. HOY routes the broad Cartagena area through the verified general Radio Taxi Cartagena dispatch instead.'
from public.mobility_providers p, public.mobility_service_areas a
where pa.provider_id=p.id
  and pa.service_area_id=a.id
  and p.slug='radio-taxi-la-manga'
  and a.slug='cartagena-coast';

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
