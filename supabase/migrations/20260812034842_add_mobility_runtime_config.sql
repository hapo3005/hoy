create table if not exists public.mobility_runtime_config (
  id smallint primary key default 1 check (id = 1),
  routing_enabled boolean not null default true,
  consumer_visible boolean not null default false,
  preview_visible boolean not null default true,
  status_note text,
  updated_at timestamptz not null default now()
);

alter table public.mobility_runtime_config enable row level security;

drop policy if exists mobility_runtime_config_public_read on public.mobility_runtime_config;
create policy mobility_runtime_config_public_read on public.mobility_runtime_config
for select to anon, authenticated using (id = 1);

grant select on public.mobility_runtime_config to anon, authenticated;
revoke insert, update, delete, truncate, references, trigger on public.mobility_runtime_config from anon, authenticated;

insert into public.mobility_runtime_config (id,routing_enabled,consumer_visible,preview_visible,status_note,updated_at)
values (1,true,false,true,'Mobility v0.1 backend routing active; consumer UI remains hidden pending provider verification and real-device QA.',now())
on conflict (id) do update set
  routing_enabled=excluded.routing_enabled,
  consumer_visible=excluded.consumer_visible,
  preview_visible=excluded.preview_visible,
  status_note=excluded.status_note,
  updated_at=now();
