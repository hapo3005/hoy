alter table public.menu_sources
  add column if not exists display_payload jsonb not null default '{}'::jsonb;
