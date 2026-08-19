# G1 Edge Function Live Source Parity — 2026-08-19

Status: **ACQUIRED-STATE SOURCE RECOVERY CANDIDATE / NO PRODUCTION DEPLOY**

Base: `main` `f63978dad503427dabaa37f222bf10726deba645`.

## Result

The ten Edge Function slugs previously active in the connected Core Supabase project but absent from `main/supabase/functions/` have been recovered into version control from the live project without logic edits:

- `claim-submit`
- `publish-offer`
- `location-geocode-once`
- `cartociudad-geocode-once`
- `cartociudad-debug`
- `address-fallback-geocode-once`
- `cartociudad-find-fallback`
- `cartociudad-locate-debug`
- `menu-image-once`
- `mobility-resolve`

After this candidate, the repository contains source directories for all 19 function slugs observed ACTIVE in the captured live snapshot.

## Live-state classification

- active business/runtime logic: `claim-submit`, `publish-offer`, `mobility-resolve`
- retired HTTP-410 stubs: six legacy geocoding/debug functions
- disabled HTTP-410 stub: `menu-image-once`

`mobility-resolve` is the only recovered function with live `verify_jwt=false`; its captured source uses Supabase `withSupabase({ auth: "publishable" })`. The other nine recovered functions report live `verify_jwt=true`.

## Chain of custody

`docs/investor-ready/g1-edge-live-source-manifest-2026-08-19.json` records, per recovered function:

- live version number;
- live `verify_jwt` setting;
- Supabase live bundle `ezbr_sha256` fingerprint;
- SHA-256 of the captured `index.ts` stored in this repository;
- runtime-state classification.

The source capture is evidence-first. Existing unpinned dependency specifiers in the live source are intentionally preserved. Dependency hardening, endpoint retirement/deletion and auth changes must be separate reviewed changes; modifying them inside this recovery would destroy byte-level source-capture provenance.

## CI gate

`G1 Edge Live Source Parity` fails unless:

1. `supabase/functions/` contains exactly the 19 captured ACTIVE slugs;
2. all ten recovered files exist;
3. all ten recovered file SHA-256 values equal the capture manifest;
4. live bundle fingerprints and `verify_jwt` metadata remain present;
5. retired/disabled stubs retain their captured 410 markers;
6. `mobility-resolve` remains the only recovered `verify_jwt=false` function in this evidence snapshot.

## Boundaries / non-claims

This recovery does **not**:

- deploy or redeploy any Supabase Edge Function;
- change Production configuration or database state;
- claim the nine pre-existing source-tracked functions are byte-identical to their live bundles;
- convert this evidence manifest into `supabase/config.toml`;
- approve current dependency pinning, CORS, auth or business logic;
- close broader G1 acquired-state evidence by itself.

Supabase documents that per-function deployment configuration such as `verify_jwt` belongs in `config.toml`; there was no `supabase/config.toml` on the captured `main`, so this candidate preserves live auth metadata in a dedicated evidence manifest rather than inventing an incomplete deployment configuration. A later deployment-reproducibility control may generate/reconcile the canonical CLI config from reviewed live state.

## Safety

No Production deployment, database DDL/DML, analytics activation, account/domain transfer, business/partner/investor outreach or automatic merge is authorized by this candidate.
