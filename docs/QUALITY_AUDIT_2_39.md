# HOY 2.39 quality audit

## Scope

This audit covers the HOY 2.39 live-decision layer and the wider HOY Gastro surfaces that affect release reliability: guest UX, browser integration, PWA caching, automated QA, Supabase authorization, public data exposure, analytics validation, menu integrity, operator flows, media ingestion and database performance.

## Guest decision layer

HOY 2.39 adds a live decision layer on top of the existing HOY NOW trust model:

- a next-two-hours timeline based only on published current content,
- support for multiple imminent events from the same venue,
- explicit opt-in geolocation and real venue distance,
- no automatic location request and no coordinates in analytics,
- a compact personal HOY Plan capped at four venues,
- stale-plan cleanup and invalid-coordinate rejection,
- visible operator-confirmed versus non-live-confirmed provenance,
- keyboard focus treatment and reduced-motion handling.

The guest-facing copy contains no internal competitor/benchmark language or release-number messaging.

## PWA and runtime delivery

- App shell, `package.json`, HTML and PWA cache are aligned to `2.39.0`.
- The Supabase browser client is pinned to `@supabase/supabase-js@2.111.0` in the guest app, Control Center and service-worker CDN allowlist.
- The PWA cache generation is `hoy-v2.39.0`.
- The previous worker cached every successful GET response. The 2.39 worker now intercepts only same-origin app traffic plus the explicit public CDN allowlist, so Supabase/API/auth traffic is never stored in the PWA cache.
- Dedicated regression coverage protects that cache boundary.
- The HOY Control Center shell is aligned to the same 2.39 release/runtime metadata.

## Supabase authorization and privacy hardening

Production migration `20260813232231_hoy_239_security_performance_hardening`:

- added covering indexes for every foreign key previously reported as unindexed,
- removed unused anonymous direct write grants from guest-facing tables while retaining RLS as the row-authorization boundary,
- limited anonymous opening-hours/service reads to guest-safe columns,
- extended the validated analytics RPC allowlist for the 2.39 plan/nearby events,
- validates analytics metadata shape and size,
- replaced broad PUBLIC function execution with explicit intended-role grants.

Additional privacy migrations removed anonymous access to internal actor UUIDs on public offers, media and promotions:

- `20260813233011_hoy_hide_public_offer_creator_uuid`
- `20260813233018_hoy_hide_public_media_uploader_uuid`
- `20260813233024_hoy_hide_public_promotion_actor_uuids`

Database constraints now reject non-HTTPS public website/menu/media source URLs.

Post-change checks confirmed that guest-safe fields remain readable, anonymous direct writes are denied, internal actor UUID fields are not anonymously selectable, and intended analytics/operator RPCs remain callable.

## Menu integrity and localization

The authoritative menu pipeline already rebuilds the catalogue with deterministic 500-row pagination before final guest delivery. The language-integrity layer reuses that full catalogue and fails closed rather than publishing incomplete localization.

The audit found a real Agua Salá language-quality gap: newly added wine rows had German name/category coverage but incomplete German descriptions. Production data was completed without weakening the quality rule. Agua Salá now has 130/130 active menu positions passing the German fail-closed gate.

Historical tests that asserted superseded menu states were updated to test current contracts or deterministic synthetic fixtures instead of forcing production data backwards.

## Venue-media SSRF hardening

`venue-media-approve` was hardened and deployed as Supabase Edge Function version 3 with `verify_jwt=true`.

Remote source ingestion now:

- accepts HTTPS only,
- rejects localhost, `.local`, `.internal`, private and reserved IPv4/IPv6 targets,
- resolves A and AAAA records and fails closed for unresolved/private DNS results,
- follows redirects manually and revalidates every hop,
- caps redirects,
- enforces an 18-second timeout,
- checks declared and actual payload size against the 10 MB limit,
- accepts JPEG, PNG and WebP only.

Dedicated SSRF regression tests protect these rules.

## Automated QA hardening

The audit also corrected the test infrastructure itself. Important examples:

- historical feature tests no longer hard-code an unrelated current app version,
- DATA-dependent tests wait for cloud bootstrap before reading live rows,
- incorrect Playwright `waitForFunction` timeout signatures were fixed,
- isolated dialog fixtures are actually opened before interaction,
- the desktop matrix uses the real `desktop-chromium` project name,
- full browser jobs use one worker per browser to avoid artificial Supabase race pressure,
- superseded PR heads are canceled through workflow concurrency,
- the final release gate runs Mobile Chrome, Mobile WebKit and Desktop Chromium with zero retries so intermittent failures cannot be hidden by retry success.

## Data and backend integrity checks

Audits found no duplicate translation keys, duplicate menu-source URLs, invalid active promotion windows, invalid live-hours rows, invalid memberships, orphan menu items/translations, duplicate service/live-hours records, invalid published offer windows or invalid published coordinates/core venue fields.

Production API observations during QA show successful paginated menu reads beyond 2,000 menu rows and successful analytics RPC responses. Edge Function and Auth logs showed no current errors during the final audit window.

## Reviewed warnings intentionally not changed blindly

Supabase still reports some `SECURITY DEFINER` functions because authenticated operators or anonymous analytics are intentionally allowed to invoke them. Their bodies were reviewed for `auth.uid()`, membership/admin checks and bounded input behavior. The reviewed functions also have explicit `search_path` configuration. These warnings are treated as security-review requirements, not instructions to remove valid APIs.

The performance advisor also reports some unused indexes and multiple permissive RLS policies. Unused indexes are not deletion candidates solely because a young system has little traffic. Public/member/admin policies are not consolidated without authorization-equivalence tests, because a cosmetic advisor improvement is not worth changing access semantics.

## Release gate

HOY 2.39 must remain unmerged until all of the following are true on the final PR head:

1. static release integrity passes,
2. the critical regression gate passes,
3. the complete Mobile Chrome suite passes,
4. the complete Mobile WebKit suite passes,
5. the complete Desktop Chromium suite passes,
6. the independent final release gate passes without retries,
7. the final PR diff/review contains only intended changes and no unresolved review threads,
8. a post-merge production smoke test is completed before 2.39 is frozen.

The release standard is zero known or unexplained release failures. Automated tests cannot mathematically prove the absence of every possible defect, but no known failure is accepted or waived merely to make the release green.
