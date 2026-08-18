-- Applied to HOY La Manga production as migration 20260818192549.
-- Historical source-less external facts are retained only as explicit review/audit rows.

alter table public.restaurant_accessibility_facts
  drop constraint if exists accessibility_external_claim_requires_source_url;

alter table public.restaurant_accessibility_facts
  add constraint accessibility_external_claim_requires_source_url
  check (
    verification_level <> 'external_unverified'
    or status = 'unknown'
    or nullif(btrim(source_url),'') is not null
    or review_state in ('review_needed','disputed')
  ) not valid;

update public.restaurant_accessibility_facts
set review_state='review_needed',
    updated_at=now(),
    evidence=coalesce(evidence,'{}'::jsonb)||jsonb_build_object(
      'dd_provenance_gate','external_non_unknown_requires_source_or_review_state',
      'dd_review_marked_at',now()
    )
where is_current=true
  and verification_level='external_unverified'
  and status<>'unknown'
  and nullif(btrim(source_url),'') is null
  and review_state='clean';
