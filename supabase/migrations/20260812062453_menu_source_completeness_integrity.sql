alter table public.menu_sources
  add column if not exists coverage_scope text not null default 'full_menu',
  add column if not exists completeness_status text not null default 'unknown',
  add column if not exists completeness_checked_at timestamptz,
  add column if not exists completeness_note text,
  add column if not exists coverage_meta jsonb not null default '{}'::jsonb;

alter table public.menu_sources drop constraint if exists menu_sources_coverage_scope_check;
alter table public.menu_sources add constraint menu_sources_coverage_scope_check
  check (coverage_scope in ('full_menu','food','drinks','wine','dessert','breakfast','lunch','dinner','day_menu','tasting','highlights','secondary','unknown'));

alter table public.menu_sources drop constraint if exists menu_sources_completeness_status_check;
alter table public.menu_sources add constraint menu_sources_completeness_status_check
  check (completeness_status in ('complete','partial','image_complete','source_only','insufficient','superseded','invalid','unknown'));
