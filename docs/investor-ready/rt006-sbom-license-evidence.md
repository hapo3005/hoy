# RT-006 SBOM / License / Dependency Evidence — 2026-08-18

Status: **IN PROGRESS — runtime pinning candidate GREEN; final transitive/license/action policy still open**

## 1. Machine SBOM baseline
A checksum-verified Syft v1.51.0 run plus the HOY direct dependency scanner was executed against current `main` of Core/Gastro, Lifestyle and Works.

Reference run:
- workflow: `Investor Ready RT-006 SBOM License Audit`
- run ID: `32186306546`
- artifact ID: `9342566421`
- artifact SHA-256: `95557c93142a5adf854d72eb0876d7d75c97ab044883b28b4e4872304fa32af3`
- outputs per repository: Syft JSON, SPDX JSON, CycloneDX JSON
- direct scanner outputs: JSON, CSV, licence-file inventory, summary

Baseline observations:
- 46 direct scanner dependency records;
- 0 HOY root `LICENSE` / `COPYING` / `NOTICE` files found by the scanner;
- 11 genuine unpinned launch/runtime dependency records;
- 23 GitHub Actions tag references requiring a separate immutable-pinning policy decision;
- Syft-discovered package records: Core 23, Lifestyle 0, Works 0.

The Syft package count does **not** represent the full effective dependency surface of this mostly static/URL-import architecture. This is why HOY deliberately combines a standard SBOM generator with its own scanner for HTML CDN references, `npm:` / `jsr:` Edge imports and GitHub Actions `uses:` references.

## 2. Baseline runtime pinning findings
The corrected baseline identified exactly 11 uncontrolled runtime-version records:
- Core/Gastro: 10
  - 8 × `npm:@supabase/supabase-js@2`
  - 2 × unversioned `jsr:@supabase/functions-js/edge-runtime.d.ts`
- Works: 1
  - jsDelivr browser import `@supabase/supabase-js@2`
- Lifestyle: 0

Already exact and not flagged:
- Core browser `@supabase/supabase-js@2.111.0`
- Leaflet `1.9.4`
- `npm:@supabase/server@1.4.1`

## 3. Remediation candidates — no merge / no deployment
### Core/Gastro PR #111
Draft PR `hapo3005/hoy#111` (`security/rt006-pin-runtime-dependencies`) changes exactly nine Edge Function files:
- 8 × `npm:@supabase/supabase-js@2` → `npm:@supabase/supabase-js@2.111.0`
- 2 × `jsr:@supabase/functions-js/edge-runtime.d.ts` → `jsr:@supabase/functions-js@2.111.0/edge-runtime.d.ts`

Verified diff:
- 9 files;
- 10 additions / 10 deletions;
- import specifiers only;
- no function body, SQL, migration, data or Production change.

### Works PR #1
Existing draft PR `hapo3005/hoy-works#1` changes the single Works browser dependency from major-only `@2` to exact `@2.111.0`.

Neither PR is authorized for merge by this evidence record.

## 4. Combined candidate pinning gate — GREEN
A separate fail-closed candidate audit evaluates:
- Core: `security/rt006-pin-runtime-dependencies` / PR #111
- Works: `investor-ready/dependency-pin-2.111.0` / PR #1
- Lifestyle: current `main`

Reference run:
- workflow: `Investor Ready RT-006 Candidate Gate`
- run ID: `32187484866`
- artifact ID: `9342985995`
- artifact SHA-256: `18d627c0e317322803d07b611e030c36c52e0d3dedc6d625c64411148ed7242c`

Result:
- 46 direct dependency records;
- 16 runtime dependency records;
- **0 unpinned runtime records**;
- technical candidate status: **GREEN**.

Observed exact runtime specs include:
- `@supabase/supabase-js` 2.111.0 via browser CDN;
- `npm:@supabase/supabase-js@2.111.0` in Edge Functions;
- `jsr:@supabase/functions-js@2.111.0/edge-runtime.d.ts`;
- `npm:@supabase/server@1.4.1`;
- Leaflet 1.9.4 JS/CSS.

This is candidate evidence, not a statement that `main` is already remediated.

## 5. Current license baseline from upstream source repositories
| Component | Observed HOY version/use | Upstream licence | Current DD classification |
|---|---|---|---|
| `@supabase/supabase-js` | 2.111.0 candidate/runtime | MIT | ACCEPT WITH NOTICE |
| `@supabase/functions-js` | 2.111.0 candidate Edge type/runtime import | MIT | ACCEPT WITH NOTICE |
| `@supabase/server` | 1.4.1 Edge helper | MIT (package/upstream metadata reviewed separately) | ACCEPT WITH NOTICE / retain evidence |
| Leaflet | 1.9.4 browser map runtime | BSD-2-Clause | ACCEPT WITH NOTICE |
| `@playwright/test` | 1.62.0 development/QA | Apache-2.0 | ACCEPT WITH LICENSE + NOTICE |
| `actions/checkout` | v6 workflow tag | MIT | ACCEPT; immutable-pin policy open |
| `actions/setup-node` | v6 workflow tag | MIT | ACCEPT; immutable-pin policy open |
| `actions/upload-artifact` | v5 workflow tag | MIT | ACCEPT; immutable-pin policy open |

Upstream evidence retained/reviewed:
- Supabase JS repository `LICENSE` = MIT;
- Supabase Functions JS repository `LICENSE` = MIT;
- Leaflet repository `LICENSE` = BSD 2-Clause;
- Playwright repository `LICENSE` = Apache 2.0 and separate `NOTICE` exists;
- the three GitHub-owned Actions repositories above each contain an MIT `LICENSE`.

No copyleft licence has been identified among these currently classified direct components. **This is not yet a full transitive-package legal clearance** because the Core QA dependency tree is not locked/installed into the SBOM scan.

## 6. GitHub Actions supply-chain status
The baseline direct scanner found 23 workflow `uses:` records. The distinct current action families are GitHub-owned permissive components, but references such as `actions/checkout@v6`, `actions/setup-node@v6` and `actions/upload-artifact@v5` are tag references rather than immutable commit SHAs.

Decision status:
- licence: classified/acceptable;
- functional use: classified;
- immutable SHA pinning policy: **OPEN**.

This is a supply-chain hardening item, not a launch-runtime version drift item.

## 7. Reproducible QA dependency gap
Core declares `@playwright/test` 1.62.0 but the current repository root has no `package-lock.json` in the reviewed baseline. Therefore the full transitive Node dependency graph is not yet reproducibly frozen by the repository.

Before RT-006 can close, choose and evidence one approach:
1. commit a generated package lock for the QA toolchain; or
2. intentionally replace the root npm workflow with another reproducible mechanism and document it.

Until then, the machine SBOM is useful DD evidence but not a complete transitive dependency lock.

## 8. AI dependency status
OpenAI remains a material menu extraction/evaluation vendor. Current code evidence uses environment/Actions secrets, structured response contracts and `store:false` where configured. RT-006 still requires the AI Asset Register to capture:
- account/billing owner;
- model/provider family;
- purpose/input class;
- privacy/data-rights route;
- retention/store control;
- human/automated review;
- fallback;
- terms/version review.

Account recovery/billing ownership belongs to RT-005; source/privacy rights belong to RT-007/RT-008.

## 9. Current RT-006 decision
### GREEN technical sub-gate
- standard SBOM artifacts generated;
- direct dependency inventory generated;
- runtime version-drift baseline identified;
- combined remediation candidate = **0 unpinned runtime records**.

### Still open before RT-006 close
- PR #111 and Works PR #1 QA/review and later explicit merge decision;
- final SBOM from merged/release candidate state;
- reproducible transitive QA dependency lock;
- GitHub Actions immutable-SHA pinning policy/remediation;
- final Third-Party Notices package;
- AI Asset Register;
- final unknown/custom/copyleft scan on release candidate.

**F0-M remains blocked.**

This is a technical diligence record, not a legal opinion.
