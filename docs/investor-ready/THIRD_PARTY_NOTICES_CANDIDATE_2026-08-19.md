# HOY Third-Party Notices Candidate

Stand: 19.08.2026
Status: CANDIDATE · NOT LEGAL SIGN-OFF

## Purpose

Create a buyer/DD-facing inventory of directly identified third-party runtime, QA and CI components. This is not a substitute for a final machine-generated SBOM or counsel/licence review.

## Direct components currently identified

| Component | Version / pin | Use | Working licence classification | Notice action |
|---|---|---|---|---|
| `@playwright/test` | `1.62.0` | QA / browser regression tests | Apache-2.0 | retain licence/NOTICE attribution in release compliance pack |
| `@supabase/supabase-js` | `2.111.0` where pinned in HOY runtime/function imports | browser/Edge Supabase client | MIT | retain licence attribution in compliance pack |
| `@supabase/functions-js` | `2.111.0` where pinned | Supabase Edge runtime typings/helpers | MIT | retain licence attribution |
| Leaflet | `1.9.4` | map UI | BSD-2-Clause | retain copyright/licence attribution |
| `actions/checkout` | immutable commit `d23441a48e516b6c34aea4fa41551a30e30af803` (`v6`) | CI | MIT-family project licence | CI-only dependency; record pin and upstream licence |
| `actions/setup-node` | immutable commit `249970729cb0ef3589644e2896645e5dc5ba9c38` (`v6`) | CI | MIT-family project licence | CI-only dependency; record pin and upstream licence |
| `actions/upload-artifact` | immutable commit `330a01c490aca151604b8cf639adc76d48f6c5d4` (`v5`) | CI | MIT-family project licence | CI-only dependency; record pin and upstream licence |

## Media / data dependencies are separate

This file does not grant rights to restaurant/provider/media/source data.

Separate rights controls remain authoritative:
- venue/operator media rights gate
- Wikimedia/Openverse/open-licence evidence where used
- source-provenance register
- RT-007 data-rights classification and replacements

No Google Maps/Business, Tripadvisor, TheFork, social-media or business-site image is automatically cleared for copying/rehosting merely because a source URL exists.

## Candidate release requirements

Before this becomes a final Third-Party Notices file:
1. generate a fresh release-candidate SBOM from the exact merged release commit;
2. reconcile all transitive npm dependencies from `package-lock.json`;
3. enumerate every browser CDN/import-map/Edge runtime dependency from the final tree;
4. classify every licence as permissive / copyleft / custom / unknown;
5. resolve all unknown/custom/copyleft items before buyer release;
6. include required licence text and NOTICE material where applicable;
7. preserve dependency version/pin and source URL evidence.

## Current legal/DD status

`AMBER`

No direct copyleft dependency has been identified in the current classified direct set, but this file is intentionally not marked final until the release commit is frozen and the fresh SBOM is reconciled.
