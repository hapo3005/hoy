# HOY — Third-Party Software Notices

**Candidate date:** 2026-08-18  
**Scope:** `security/rt006-final-candidate` + `hapo3005/hoy-lifestyle@main` + `hapo3005/hoy-works@main`  
**Status:** RELEASE-CANDIDATE NOTICE PACKAGE — machine SBOM/licence gate must remain GREEN; legal sign-off remains separate.

This document records third-party software evidenced in the HOY release-candidate dependency set. It does **not** license HOY-owned source code under an open-source licence.

## Runtime / distributed-facing software

| Component | Version | HOY use | Licence | Required treatment |
|---|---:|---|---|---|
| `@supabase/supabase-js` | 2.111.0 | Core browser/Edge client and Works browser client | MIT | Preserve applicable upstream copyright and MIT licence notice when redistributed/bundled. |
| `@supabase/functions-js` | 2.111.0 | Core Edge runtime type/runtime integration | MIT | Preserve applicable upstream copyright and MIT licence notice when redistributed/bundled. |
| `@supabase/server` | 1.4.1 | Core Edge helper | MIT | Preserve applicable upstream copyright and MIT licence notice when redistributed/bundled. |
| Leaflet | 1.9.4 | Core browser map runtime | BSD-2-Clause | Preserve copyright, licence conditions and disclaimer in source/binary distribution as applicable. |

Runtime version policy: production-facing external imports/CDN packages must be exact-version pinned. The RT-006 final-candidate audit fails closed on the known floating-version patterns.

## Development / QA software

| Component | Version | HOY use | Licence | Required treatment |
|---|---:|---|---|---|
| `@playwright/test` | 1.62.0 | Browser/e2e QA | Apache-2.0 | Retain Apache-2.0 licence evidence and upstream NOTICE material in DD/distribution contexts where applicable. |
| `playwright` | 1.62.0 | Transitive QA runtime | Apache-2.0 | Same as above. |
| `playwright-core` | 1.62.0 | Transitive QA runtime | Apache-2.0 | Same as above. |
| `fsevents` | 2.3.2 | Optional Darwin transitive dependency | MIT | Retain licence evidence if redistributed. |

The committed npm lockfile is the authoritative reproducibility record for this QA graph and includes integrity hashes for the resolved packages.

### Playwright NOTICE provenance
Upstream Playwright identifies Microsoft Corporation as copyright holder and records derivation from the Puppeteer project under Apache-2.0. HOY retains this NOTICE provenance as part of its DD package rather than treating the QA dependency as HOY-owned code.

Primary upstream evidence: `microsoft/playwright` repository `NOTICE` and `LICENSE` files.

## CI / GitHub Actions

These actions execute in CI and are not browser-runtime code, but they remain part of the supply-chain inventory:

| Action | Intended release line | Immutable commit used by HOY | Licence baseline |
|---|---|---|---|
| `actions/checkout` | v6 | `d23441a48e516b6c34aea4fa41551a30e30af803` | MIT |
| `actions/setup-node` | v6 | `249970729cb0ef3589644e2896645e5dc5ba9c38` | MIT |
| `actions/upload-artifact` | v5 | `330a01c490aca151604b8cf639adc76d48f6c5d4` | MIT |

RT-006 policy: every remote `uses:` reference in retained HOY workflows must be a full 40-character immutable commit SHA. A tag/comment may be retained only as human-readable provenance.

## Licence classification policy

The release-candidate gate classifies the actual machine SBOM and integrity-locked npm dependency graph. It fails closed if any of the following remain unresolved:

- third-party package with no detected/known licence;
- GPL/AGPL/LGPL or other copyleft item requiring counsel review;
- SSPL, BUSL/BSL, Commons Clause, Elastic License, EUPL, CDDL, MPL, EPL or another licence placed in the review set;
- expected runtime dependency missing from the candidate;
- runtime dependency not exactly version-pinned.

A `GREEN` machine result means **zero unresolved machine-detected licence records in that defined release-candidate scope**. It is not a substitute for legal advice or source/media/data-rights clearance.

## Separate rights domains

This notice package does not clear:

- restaurant/business data, menu text, photographs or media (RT-007);
- fonts, icons, templates or design assets not identified by the software dependency scanner;
- AI input/source/output rights (AI Asset Register + RT-007/RT-008);
- HOY project-level copyright ownership / founder-to-company assignment;
- external API/provider contractual terms.

## Distribution/DD rule

Before any externally distributed binary/package or buyer DD close, retain together:

1. this notice inventory;
2. exact release-candidate SBOMs (Syft JSON, SPDX JSON, CycloneDX JSON);
3. package-lock/integrity evidence;
4. upstream licence/NOTICE evidence for components actually redistributed;
5. final machine summary showing no unresolved unknown/copyleft item;
6. legal sign-off for any item moved into a counsel-review class.
