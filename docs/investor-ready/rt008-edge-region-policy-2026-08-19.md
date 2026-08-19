# RT-008 Edge Function Execution-Region Policy — 2026-08-19

Status: **CURRENT-MAIN TECHNICAL CANDIDATE / NO PRODUCTION DEPLOY AUTHORIZATION**

Base: `main` `88bb9e77d50ccb9db96306f5e737e27bad6237ab` (includes merged privacy hotfix #128).

## Decision

All 19 currently ACTIVE Core Edge Function slugs are classified and pinned at invocation time to `eu-central-1` (Frankfurt), the same region as the active HOY La Manga Postgres project.

Rationale:

- current functions are database/storage coupled and/or process operator, business, analytics, content or precise-location data;
- Supabase documents regional invocation for database/storage-heavy and compliance-sensitive functions;
- a single explicit region creates a deterministic privacy/latency boundary for current Region #001 operations;
- unknown/new Edge Function slugs fail closed until classified.

This is an invocation-routing policy, not a claim that every Supabase subprocessor/onward service remains in Frankfurt.

## Availability trade-off

Supabase documents that an explicitly requested Edge Function region is not automatically re-routed during an outage. HOY therefore deliberately accepts a fail-closed availability trade-off for this privacy-first candidate. Any future emergency failover or `any`/nearest-region policy requires an explicit incident/architecture decision and updated privacy evidence; it is not automatic.

## Technical enforcement

`edge-region-policy-2.48.js` loads immediately after the pinned Supabase UMD library and before the app/admin clients are created.

It wraps `window.supabase.createClient()` and then each created client's `functions.invoke()` method:

- every classified function gets `region: 'eu-central-1'`;
- current Supabase JS converts the explicit region into `x-region` plus `forceFunctionRegion` routing;
- if a contradictory `x-sb-edge-region` response header is exposed, HOY fails the invocation closed;
- an unknown function returns `hoy_edge_region_unclassified:<slug>` rather than silently executing in the nearest region.

The policy is installed in both `index.html` and `admin.html`, and the PWA cache contains the policy asset.

## Active Core function snapshot

All currently ACTIVE Core functions captured from the connected Supabase project on 2026-08-19:

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

`mobility-resolve` is included despite being public/publishable-key protected because it receives precise coordinates and performs database/RPC work; the candidate therefore does not leave location processing on automatic nearest-region routing.

## Source-control reconciliation gap

The connected production project currently exposes 19 ACTIVE functions, while `main/supabase/functions/` contains only nine source directories. The following ten active slugs are therefore explicitly recorded as **LIVE SOURCE NOT PRESENT UNDER CURRENT MAIN `supabase/functions/` PATH** at this evidence cut:

- `address-fallback-geocode-once`
- `cartociudad-debug`
- `cartociudad-find-fallback`
- `cartociudad-geocode-once`
- `cartociudad-locate-debug`
- `claim-submit`
- `location-geocode-once`
- `menu-image-once`
- `mobility-resolve`
- `publish-offer`

This does **not** mean source is irretrievable: the live functions can be inspected through Supabase. It means acquired-state/source-control parity is not yet proven and must remain visible in G1/DD. The region policy covers these slugs at invocation time, but it does not close their source-reconciliation gate.

## CI / regression

`scripts/investor-ready/rt008-edge-region-static-check.mjs` verifies:

- exact 19-function policy snapshot;
- all functions pinned to `eu-central-1`;
- unknown-function fail-closed behavior;
- public/admin script load order;
- PWA caching;
- source-tracked function classification;
- explicit disclosure of the ten live/source gaps;
- direct `/functions/v1/` runtime calls cannot omit regional routing;
- non-browser scripts cannot use `.functions.invoke()` without an explicit region.

`tests/edge-region-policy-2.48.spec.js` verifies the policy in both public and admin browser shells.

## Official technical basis

- Supabase Regional Invocations: https://supabase.com/docs/guides/functions/regional-invocation
- Supabase Functions architecture: https://supabase.com/docs/guides/functions/architecture
- Supabase project regions: https://supabase.com/docs/guides/platform/regions
- Supabase JS invoke reference: https://supabase.com/docs/reference/javascript/functions-invoke

## Explicit non-claims / release boundary

This candidate does **not** claim:

- that all Supabase subprocessors/onward processing are Frankfurt-only;
- that `eu-central-1` alone satisfies GDPR transfer requirements;
- that the ten live/source gaps are reconciled;
- that Production has been redeployed;
- that PR #127 has been reconciled/merged;
- that investor/business outreach is released.

No Production Edge Function deployment, database DDL/DML, account migration, analytics activation or outreach is authorized by this policy candidate.
