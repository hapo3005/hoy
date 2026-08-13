# HOY 2.39 quality audit

## Scope

This audit covers the new live-decision layer and the wider HOY Gastro application surfaces that can affect reliability: browser integration, PWA caching, automated QA, Supabase authorization, public data exposure, analytics validation and database performance.

## Changes completed

### Guest decision layer

- Added a next-two-hours view based only on published current content.
- Added explicit opt-in geolocation; HOY never asks for location automatically.
- Added real distance calculation from venue coordinates.
- Added a compact personal plan capped at four venues.
- Reused existing HOY NOW ranking and opening-hours provenance instead of introducing a competing recommendation engine.
- Added stale-plan cleanup, coordinate validation and duplicate-location-request protection.
- Added keyboard focus styling and reduced-motion handling.

### PWA and delivery

- Added 2.39 JS/CSS to the service-worker CORE cache.
- Bumped the PWA cache generation to `hoy-v2.39.0` so old cached assets are replaced.
- Added a pull-request QA workflow that checks JavaScript syntax, required release wiring and duplicate cache entries before running the complete Playwright suite against the branch itself.

### Supabase hardening

Production migration `20260813232231_hoy_239_security_performance_hardening` was applied and recorded in Supabase.

It:

- adds covering indexes for every foreign key previously reported as unindexed by the Supabase advisor,
- removes unused anonymous direct write grants from guest-facing tables while keeping RLS as the row authorization boundary,
- prevents anonymous clients from selecting internal `confirmed_by` / `updated_by` actor UUID columns on public opening-hours/service data,
- keeps the guest-safe columns readable so existing app queries continue to work,
- extends the validated analytics RPC allowlist for the 2.39 live-plan/nearby events,
- validates analytics metadata shape and limits metadata size,
- replaces default PUBLIC function execution with explicit intended role grants.

Post-migration verification confirmed that anonymous direct writes are denied, guest-safe live fields remain readable, internal actor UUID fields are not readable anonymously, and the analytics RPC remains callable as intended.

## Reviewed warnings that are intentionally not changed blindly

Supabase still reports some `SECURITY DEFINER` functions because authenticated operators or anonymous analytics are intentionally allowed to call them. Their function bodies were reviewed: operator RPCs perform `auth.uid()` plus membership/claim checks, while analytics validates a strict event allowlist and published restaurant IDs. The warning is therefore treated as a review requirement rather than an automatic instruction to remove the API.

The performance advisor also reports multiple permissive RLS policies. They represent overlapping public/member/admin access paths. Consolidating them without a dedicated policy-equivalence test could change authorization behavior, so no speculative rewrite was made in this release.

Unused-index notices are not treated as deletion candidates yet. HOY is still early-stage, several workflows have little or no production traffic, and a newly created foreign-key index naturally starts as unused.

## Known repository metadata issue

The application HTML and PWA cache are wired as 2.39, while `package.json` still reports 2.38.0. Attempts to update that file through the connected GitHub write interface were blocked by the tool safety layer. This is metadata drift, not a runtime defect, but it should be aligned before declaring 2.39 a final release.

## Release gate

Do not merge the 2.39 draft PR until:

1. the complete Playwright suite has finished on the latest branch head,
2. any failures are classified as product regressions versus obsolete historical release assertions,
3. product regressions are fixed and rerun,
4. `package.json` version metadata is aligned or the release naming is deliberately adjusted,
5. the draft PR is reviewed once more for only intended changes.
