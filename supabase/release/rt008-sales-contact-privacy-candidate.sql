-- HOY RT-008 — candidate only. DO NOT APPLY TO PRODUCTION FROM THIS FILE.
-- Purpose: make indirect B2B contact transparency/objection/retention state explicit.
-- Must be promoted into the canonical migration sequence only after legal review,
-- isolated DB validation and RT-002 release reconciliation.

alter table public.venue_sales_pipeline
  add column if not exists privacy_notice_at timestamptz,
  add column if not exists privacy_notice_basis text,
  add column if not exists privacy_objection_at timestamptz,
  add column if not exists privacy_suppressed boolean not null default false,
  add column if not exists personal_contact_expires_at timestamptz,
  add column if not exists privacy_reviewed_at timestamptz,
  add column if not exists privacy_review_note text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname='venue_sales_pipeline_privacy_notice_basis_check'
      and conrelid='public.venue_sales_pipeline'::regclass
  ) then
    alter table public.venue_sales_pipeline
      add constraint venue_sales_pipeline_privacy_notice_basis_check
      check (
        privacy_notice_basis is null or privacy_notice_basis in (
          'direct_collection',
          'art14_public_source_notice',
          'art14_exception_counsel',
          'non_personal_business_route'
        )
      );
  end if;
end $$;

-- Fail-closed invariant: a recorded objection always suppresses outreach.
update public.venue_sales_pipeline
set privacy_suppressed=true
where privacy_objection_at is not null
  and privacy_suppressed is not true;

-- This candidate intentionally does NOT auto-fill notice/basis/expiry values.
-- Existing 57 named/direct contacts require a deliberate legal/privacy review.
-- No row may be unlocked for outreach merely because these columns exist.

create index if not exists venue_sales_pipeline_privacy_deadline_idx
  on public.venue_sales_pipeline (personal_contact_expires_at)
  where personal_contact_expires_at is not null;

create index if not exists venue_sales_pipeline_privacy_suppressed_idx
  on public.venue_sales_pipeline (privacy_suppressed)
  where privacy_suppressed is true;
