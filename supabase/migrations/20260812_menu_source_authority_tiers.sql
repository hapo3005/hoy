-- HOY 2026-08-12 · source authority is independent from menu completeness

alter table public.menu_sources
  add column if not exists source_authority text not null default 'unknown',
  add column if not exists authority_checked_at timestamptz,
  add column if not exists authority_note text;

alter table public.menu_sources drop constraint if exists menu_sources_source_authority_check;
alter table public.menu_sources add constraint menu_sources_source_authority_check
  check (source_authority in (
    'first_party',
    'operator_social',
    'authorized_transactional',
    'verified_public_snapshot',
    'unverified_third_party',
    'unknown'
  ));

update public.menu_sources
set source_authority = case
  when is_official = true and source_url ~* 'facebook\\.com|instagram\\.com' then 'operator_social'
  when is_official = true then 'first_party'
  when is_official = false then 'unverified_third_party'
  else 'unknown'
end,
authority_checked_at = coalesce(authority_checked_at,last_checked_at,now())
where source_authority='unknown';

comment on column public.menu_sources.source_authority is
  'Trust/provenance tier independent of menu completeness: first_party, operator_social, authorized_transactional, verified_public_snapshot, unverified_third_party, unknown.';

create or replace function public.menu_source_guest_usable(p_source public.menu_sources)
returns boolean
language sql
stable
set search_path=public
as $$
  select p_source.completeness_status in ('complete','image_complete')
    and p_source.source_authority in (
      'first_party','operator_social','authorized_transactional','verified_public_snapshot'
    )
$$;

revoke all on function public.menu_source_guest_usable(public.menu_sources) from public, anon, authenticated;
grant execute on function public.menu_source_guest_usable(public.menu_sources) to service_role;
