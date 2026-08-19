# RT-008 Edge Function Execution-Region Policy — 2026-08-19

Status: **COMPOSED G1 SURVIVOR CANDIDATE / NO PRODUCTION DEPLOY AUTHORIZATION**

Base G1 survivor: current `main` `f63978dad503427dabaa37f222bf10726deba645` plus the consolidated Privacy/Region/Acquired-State inputs documented in PR #143.

## Decision

All 19 currently ACTIVE Core Edge Function slugs are classified and pinned at HOY browser/admin invocation time to `eu-central-1` (Frankfurt), the same region as the active HOY La Manga Postgres project.

Rationale:

- current functions are database/storage coupled and/or process operator, business, analytics, content or precise-location data;
- a single explicit invocation region creates a deterministic privacy/latency boundary for current Region #001 operations;
- `mobility-resolve` receives precise coordinates and is therefore pinned too;
- unknown/new Edge Function slugs fail closed until classified.

This is an invocation-routing policy, not a claim that every Supabase subprocessor/onward service remains in Frankfurt or that database project region alone proves every processing location.

## Availability trade-off

An explicitly requested Edge Function region is a deliberate locality decision. HOY treats outage/failover behaviour as a separate incident/architecture decision; there is no silent policy change to an unclassified or automatic region inside this candidate.

## Technical enforcement

`edge-region-policy-2.48.js` loads immediately after the pinned Supabase UMD library and before the app/admin clients are created.

It wraps `window.supabase.createClient()` and then each created client's `functions.invoke()` method:

- every classified function gets `region: 'eu-central-1'`;
- an unknown function is rejected as `hoy_edge_region_unclassified:<slug>` before transport;
- if a contradictory `x-sb-edge-region` response header is exposed, HOY fails the invocation closed;
- the policy is installed in both `index.html` and `admin.html` and cached by the PWA.

The current Playwright regression also mocks the wrapped transport and proves:

- `claim-submit` is invoked with `eu-central-1`;
- an unknown slug does not reach the underlying transport;
- `mobility-resolve` with an observed `us-east-1` header fails with a region-mismatch error.

## Active Core function snapshot

The policy contains exactly the 19 slugs captured ACTIVE from the connected Supabase Core project:

1. `claim-submit`
2. `publish-offer`
3. `venue-media-approve`
4. `admin-ops`
5. `location-geocode-once`
6. `cartociudad-geocode-once`
7. `cartociudad-debug`
8. `address-fallback-geocode-once`
9. `cartociudad-find-fallback`
10. `cartociudad-locate-debug`
11. `menu-intake-process`
12. `promotion-insights`
13. `menu-image-once`
14. `operator-hours-confirm`
15. `mobility-resolve`
16. `menu-discovery`
17. `menu-editorial-import`
18. `menu-social-handoff`
19. `operator-accessibility-confirm`

## Source-control / acquired-state reconciliation — composed result

The earlier RT-008 region candidate was created when only nine of the 19 active slugs existed under `supabase/functions/`; it therefore correctly disclosed a historic ten-path live/source gap.

That gap is now reconciled in the composed G1 survivor:

- **19 / 19 active slugs have source paths in the candidate**;
- **10 recovered exactly** from connected Supabase live state with file SHA-256, live version, `verify_jwt` and `ezbr_sha256` evidence;
- **9 repo desired-state ahead** of current Production and therefore intentionally preserved instead of being downgraded to older live source;
- **0 unaccounted**.

The authoritative evidence is:

- `docs/investor-ready/g1-edge-live-source-manifest-2026-08-19.json`;
- `docs/investor-ready/g1-edge-full-live-reconciliation-2026-08-19.json`;
- `scripts/investor-ready/check-g1-edge-source-parity.mjs`;
- `scripts/investor-ready/check-g1-edge-full-reconciliation.mjs`.

This closes the **source accounting gap**, but does not claim Production equals the repository desired state. Nine functions remain a controlled deployment-drift class until a separately approved deployment equalizes Production from the final survivor.

## CI / regression

`scripts/investor-ready/rt008-edge-region-static-check.mjs` now supports both evidence states without weakening either:

- if full G1 reconciliation evidence is absent, the historic ten-path gap must still be enumerated exactly;
- if full G1 reconciliation evidence is present, it must prove 10 exact + 9 repo-ahead + 0 unaccounted and the source-path gap must be empty;
- all 19 functions must remain classified and pinned;
- public/admin script load order and PWA caching must remain correct;
- direct Edge URLs and non-browser invocation paths may not silently bypass the regional policy.

`tests/edge-region-policy-2.48.spec.js` verifies both shell installation and the actual wrapped invocation path.

## Explicit non-claims / release boundary

This candidate does **not** claim:

- that all Supabase subprocessors/onward processing are Frankfurt-only;
- that `eu-central-1` alone satisfies GDPR international-transfer requirements;
- that Production has been redeployed to the repository desired state;
- final GDPR/DSGVO compliance;
- investor/business outreach release.

No Production Edge Function deployment, database DDL/DML, analytics activation, retention purge, account migration or outreach is authorized by this policy candidate.
