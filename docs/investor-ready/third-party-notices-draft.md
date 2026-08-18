# HOY — Third-Party Notices / License Inventory Candidate

**Baseline:** 2026-08-18  
**Status:** CANDIDATE DD ARTEFACT — final distribution notice review remains tied to release candidate

This file records known third-party software used by HOY. It does **not** grant an open-source licence to HOY's own source code.

## Runtime / distributed-facing components

### Leaflet 1.9.4
- Use: HOY Core map runtime (browser/CDN)
- Upstream: Leaflet
- Licence: BSD-2-Clause
- Version: exact `1.9.4`
- Control: exact version + existing SRI evidence in Core runtime
- Distribution action: preserve applicable copyright/licence notice; re-check exact release candidate.

### @supabase/supabase-js 2.111.0
- Use: HOY Core browser client; Works candidate aligns to same exact version
- Upstream: Supabase
- Licence: MIT
- Core version: exact `2.111.0`
- Works remediation candidate: exact `2.111.0` in `hapo3005/hoy-works#1`
- Distribution action: preserve applicable MIT copyright/licence notice; re-check final Works/Core state.

### @supabase/functions-js 2.111.0
- Use: HOY Core Edge runtime type/runtime import candidate
- Licence baseline: MIT
- Candidate spec: `jsr:@supabase/functions-js@2.111.0/edge-runtime.d.ts`
- Control: exact version in Core PR #111 candidate
- Distribution action: include in final SBOM/license evidence; confirm final package/release licence snapshot before F0-M.

### @supabase/server 1.4.1
- Use: HOY Core Edge Function helper
- Licence baseline: MIT / upstream package evidence
- Version: exact `1.4.1`
- Distribution action: include in final SBOM and preserve applicable MIT notice if bundled/distributed.

## Development / QA components

### @playwright/test 1.62.0
- Use: HOY Core development/browser QA only
- Upstream: Microsoft Playwright
- Licence: Apache-2.0; upstream NOTICE obligations tracked
- Declared version: exact `1.62.0`
- Reproducibility: RT-006 npm lockfile gate generates/validates an integrity-bearing package lock candidate.
- Distribution action: QA/dev dependency is not part of the public browser runtime; retain licence/NOTICE evidence in DD and reassess if redistributed in another product/package.

## GitHub Actions / CI supply chain

The RT-006 machine baseline identified 23 tag-based Action references across nine pre-existing Core workflows. Those baseline references are remediated on the RT-005/006 branch with immutable commits:

- `actions/checkout` intended v6 → `d23441a48e516b6c34aea4fa41551a30e30af803` — MIT upstream
- `actions/setup-node` intended v6 → `249970729cb0ef3589644e2896645e5dc5ba9c38` — MIT upstream
- `actions/upload-artifact` intended v5 → `330a01c490aca151604b8cf639adc76d48f6c5d4` — MIT upstream
- `actions/upload-artifact` legacy v4 in post-baseline DD tooling → `ea165f8d65b6e75b540449e92b4886f43607fa02` — MIT upstream; normalization pending in that DD workflow

CI-only Actions remain in the Buyer/DD dependency inventory even though they are not shipped to browser users.

## Current licence classification
Direct components classified in RT-006 evidence are permissive:
- MIT: Supabase JS, Functions JS, Supabase server helper, GitHub Actions listed above
- BSD-2-Clause: Leaflet
- Apache-2.0: Playwright QA tooling

No direct copyleft component has been identified in the current classified set. **This is not yet a final transitive licence clearance.** Final status depends on the integrity-locked Node dependency tree and the release-candidate SBOM/Unknown-Custom-Copyleft scan.

## Separate rights domains
This notice inventory does not clear:
- restaurant/business data or media rights (RT-007);
- fonts/images/icons/templates not identified as software dependencies;
- AI input/output/source rights (AI Asset Register + RT-007/008);
- project-level licensing of HOY-owned code;
- external source/API terms.

## Finalization gate
Before this becomes a final distribution notice artefact:
1. commit/approve the reproducible Core lock mechanism;
2. regenerate SBOM on actual release candidate / merged dependency state;
3. verify all transitive `UNKNOWN`, custom and copyleft classifications;
4. normalize post-baseline DD workflow Action references;
5. verify final shipped/bundled component set;
6. include exact required upstream copyright/licence/NOTICE material for components actually redistributed;
7. legal review any non-permissive or ambiguous item.

**Current state:** dependency notice inventory materially complete for known direct software; final release notice package remains **REVIEW_REQUIRED** until the release-candidate scan.
