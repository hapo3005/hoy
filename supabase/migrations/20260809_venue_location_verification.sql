-- HOY 2.0 location verification metadata.
-- Venue coordinates and audited addresses are content data maintained in Supabase; this migration versions the schema and constraints.

alter table public.restaurants add column if not exists location_status text not null default 'not_checked';
alter table public.restaurants add column if not exists location_source_url text;
alter table public.restaurants add column if not exists location_source_label text;
alter table public.restaurants add column if not exists location_geocode_source text;
alter table public.restaurants add column if not exists location_precision text;
alter table public.restaurants add column if not exists location_checked_at timestamptz;
alter table public.restaurants add column if not exists location_note text;

alter table public.restaurants drop constraint if exists restaurants_location_status_check;
alter table public.restaurants add constraint restaurants_location_status_check
  check (location_status in ('not_checked','verified','address_geocoded','needs_review'));
alter table public.restaurants drop constraint if exists restaurants_location_precision_check;
alter table public.restaurants add constraint restaurants_location_precision_check
  check (location_precision is null or location_precision in ('poi','address','street','venue_complex','approximate'));

create index if not exists restaurants_live_coords_idx
  on public.restaurants(is_published,latitude,longitude)
  where latitude is not null and longitude is not null;

update public.restaurants
set location_source_url=coalesce(location_source_url,source_url),
    location_source_label=coalesce(location_source_label,source_label)
where is_published=true;
