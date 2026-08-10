-- HOY 2.9: asynchronous OpenAI extraction state + private evaluation corpus/run storage.
alter table public.menu_intake_submissions
  add column if not exists openai_response_id text,
  add column if not exists openai_response_status text,
  add column if not exists openai_reasoning_effort text,
  add column if not exists openai_started_at timestamptz,
  add column if not exists openai_last_polled_at timestamptz,
  add column if not exists extractor_version text;

create index if not exists menu_intake_submissions_openai_pending_idx
  on public.menu_intake_submissions (processor_state, openai_response_status, updated_at)
  where openai_response_id is not null;

create table if not exists public.menu_eval_cases (
  id uuid primary key default gen_random_uuid(),
  restaurant_id bigint not null references public.restaurants(id) on delete cascade,
  source_id uuid not null references public.menu_sources(id) on delete cascade,
  label text not null,
  source_url text not null,
  source_kind text not null,
  source_content_hash text,
  expected_item_count integer not null check (expected_item_count >= 0),
  expected_items jsonb not null default '[]'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_id)
);

create table if not exists public.menu_eval_runs (
  id uuid primary key default gen_random_uuid(),
  case_id uuid not null references public.menu_eval_cases(id) on delete cascade,
  model text not null,
  reasoning_mode text not null default 'pro',
  reasoning_effort text not null,
  extractor_version text,
  openai_response_id text,
  status text not null default 'queued' check (status in ('queued','in_progress','completed','failed')),
  metrics jsonb not null default '{}'::jsonb,
  extracted_items jsonb not null default '[]'::jsonb,
  error_text text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists menu_eval_runs_case_created_idx
  on public.menu_eval_runs(case_id, created_at desc);

alter table public.menu_eval_cases enable row level security;
alter table public.menu_eval_runs enable row level security;
revoke all on public.menu_eval_cases from anon, authenticated;
revoke all on public.menu_eval_runs from anon, authenticated;
grant all on public.menu_eval_cases to service_role;
grant all on public.menu_eval_runs to service_role;
