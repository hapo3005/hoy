# HOY Investor Ready — RT-006 OSS / SBOM / AI Dependency Review

**Baseline:** 2026-08-18  
**Status:** TECHNICAL RELEASE-CANDIDATE GATES GREEN / MERGE + COMPANY/VENDOR CONTROL GATES OPEN

## 1. Scope
RT-006 covers third-party runtime libraries, development/test dependencies, Edge Function imports, GitHub Actions, CDN-loaded code, project-level licensing policy, material AI providers/tools and reproducible SBOM evidence. External business data/media rights remain RT-007.

## 2. Machine SBOM baseline — COMPLETE
Checksum-verified Syft 1.51.0 plus the HOY direct dependency scanner generated Syft JSON, SPDX JSON and CycloneDX JSON for Core/Gastro, Lifestyle and Works.

Reference evidence:
- run `32186306546`
- artifact `9342566421`
- artifact SHA-256 `95557c93142a5adf854d72eb0876d7d75c97ab044883b28b4e4872304fa32af3`

Baseline:
- 46 direct dependency records
- Syft packages: Core 23 / Lifestyle 0 / Works 0
- 11 genuine unpinned launch/runtime records
- 23 movable GitHub Actions references in the nine pre-existing Core workflows

Baseline runtime findings:
- Core: 8 × `npm:@supabase/supabase-js@2`
- Core: 2 × unversioned `jsr:@supabase/functions-js/edge-runtime.d.ts`
- Works: 1 × browser `@supabase/supabase-js@2`
- Lifestyle: 0

## 3. Runtime dependency remediation — CANDIDATE GREEN
Core PR `hapo3005/hoy#111`:
- 9 files / 10 import-specifier replacements only
- Supabase JS → exact `2.111.0`
- Functions JS → exact `2.111.0`
- no logic/SQL/data/auth/Production change
- Final Release QA GREEN
- Critical QA GREEN
- Browser QA GREEN: Mobile Chrome, Mobile WebKit, Desktop Chromium
- **READY FOR REVIEW / NOT MERGED**

Works PR `hapo3005/hoy-works#1`:
- exactly one line: browser CDN `@2` → `@2.111.0`
- **READY FOR REVIEW / NOT MERGED**

Combined pinning evidence:
- run `32187484866`
- artifact `9342985995`
- SHA-256 `18d627c0e317322803d07b611e030c36c52e0d3dedc6d625c64411148ed7242c`
- 16 runtime dependency records
- **0 unpinned runtime records**
- status **GREEN**

## 4. Core QA reproducibility — GREEN CANDIDATE
A generated and verified npm `package-lock.json` is committed on the remediation branch.

Lock evidence:
- run `32189083547`
- artifact `9343533212`
- artifact SHA-256 `f5cd0d4996e292a7683a6f51f02dd27bc49706958470018c5dc87bf31bcaf008`
- lockfile SHA-256 `4ea84e81203520335e98734d5598c5ce8364c7af41bbb4c8bc4c2afb07742028`
- lockfile v3
- exact Playwright 1.62.0 family with integrity/resolved evidence
- optional `fsevents` 2.3.2

Central Browser, Delivery, PR Browser, Critical and manual Final Release QA candidate workflows use `npm ci`, so the lock is enforced in CI rather than merely stored.

## 5. GitHub Actions supply chain — GREEN
All external workflow actions on the remediation branch are enforced by full immutable commit SHA.

Verified pins include:
- `actions/checkout` v6 → `d23441a48e516b6c34aea4fa41551a30e30af803`
- `actions/setup-node` v6 → `249970729cb0ef3589644e2896645e5dc5ba9c38`
- `actions/upload-artifact` v5 → `330a01c490aca151604b8cf639adc76d48f6c5d4`
- `actions/upload-artifact` v4 legacy DD use → `ea165f8d65b6e75b540449e92b4886f43607fa02`

Machine gate: `scripts/investor-ready/check-github-actions-pins.mjs`.

Verified scans:
- first full remediation scan: 49/49 immutable, 0 floating
- composed release-candidate scan after the new SBOM workflow: 54/54 immutable, 0 floating

The temporary normalization workflow was removed after verification.

## 6. Composed release-candidate SBOM / licence gate — GREEN
A dedicated CI workflow now constructs an **ephemeral composed candidate** without merging:
- Core governance/lock/Actions branch: `ops/rt-005-rt-006-assets-sbom-ai`
- nine reviewed runtime-pin files from Core PR #111
- Works PR #1 candidate
- Lifestyle `main`

It then:
- proves `npm ci` from the committed lock;
- re-runs the immutable-Action gate;
- installs checksum-verified Syft 1.51.0;
- generates Syft JSON, SPDX JSON and CycloneDX JSON for all three repos;
- re-runs the direct dependency census;
- fails closed on runtime version drift, unknown third-party package licences and defined copyleft/custom counsel-review classes.

Successful release-candidate evidence:
- run `32190344166`
- artifact `9343961760`
- artifact SHA-256 `d044c97e9f0a7dc39de4b39114fff6eda722ef8be90d3e9bb706c7d2637a8f1d`
- 23 direct dependency records in the composed scanner output
- 16 runtime dependency records
- **0 unpinned runtime records**
- 1 first-party root package (`hoy-la-manga` 2.39.0, `private:true`) recorded separately
- 4 integrity-locked npm third-party package records
- **0 unknown third-party licence records**
- **0 counsel-review licence records**
- **0 missing expected runtime specs**
- status **GREEN**

The four transitive npm records in the lock evidence are:
- `@playwright/test` 1.62.0 — Apache-2.0
- `playwright` 1.62.0 — Apache-2.0
- `playwright-core` 1.62.0 — Apache-2.0
- optional `fsevents` 2.3.2 — MIT

The first-party HOY root package is deliberately not treated as an unknown third-party dependency merely because HOY has not granted a project-wide OSS licence.

## 7. Direct runtime licence baseline
| Component | Candidate version | Licence baseline | Status |
|---|---:|---|---|
| Leaflet | 1.9.4 | BSD-2-Clause | ACCEPT WITH NOTICE |
| @supabase/supabase-js | 2.111.0 | MIT | ACCEPT WITH NOTICE |
| @supabase/functions-js | 2.111.0 | MIT baseline | ACCEPT WITH NOTICE |
| @supabase/server | 1.4.1 | MIT | ACCEPT WITH NOTICE |
| Playwright family | 1.62.0 | Apache-2.0 | ACCEPT / NOTICE evidence retained |
| GitHub official Actions | immutable SHAs | MIT | ACCEPT / inventory retained |

No direct or locked transitive copyleft/counsel-review package was identified by the composed candidate gate. This is a technical dependency/licence screen, not a substitute for final legal review of distribution obligations.

## 8. Third-Party Notices — IMPLEMENTED CANDIDATE
`docs/investor-ready/third-party-notices-draft.md` records current software components, versions, licence baselines and distribution implications. It does not license HOY-owned source and does not clear business data/media, fonts/assets or AI-source rights.

Final distribution notice text remains tied to the exact release actually shipped/closed.

## 9. AI Asset Register — IMPLEMENTED
`docs/investor-ready/rt006-ai-asset-register.md` separates provider contractual allocation from copyrightability, source/input rights, human review, privacy/vendor flow and founder→company assignment.

Registered uses include menu extraction, menu evaluation, engineering assistance, DD/security drafting and legal/privacy drafting. Legal/privacy AI drafts remain **BLOCKED FOR ACTIVATION** without qualified DE/ES legal review.

HOY does not claim raw AI output is automatically exclusive proprietary IP.

## 10. Project-level HOY licence policy
No broad project-wide OSS licence is added merely because the repositories have historically been public. HOY-owned source remains treated as proprietary/no project-wide licence granted by default, while required third-party notices are preserved separately.

Historical public publication cannot be made retroactively confidential; repository confidentiality is handled under IR-02E.

## 11. Remaining RT-006 close conditions
Technical dependency work is now candidate-GREEN. Remaining close conditions are primarily decision/account/legal-transfer gates:
1. explicit merge/release decision for Core #111 and Works #1 — **not automatic**;
2. re-run composed release-candidate evidence after any material dependency change;
3. finalize exact third-party licence/NOTICE package for the actually shipped/acquired state;
4. close company-controlled OpenAI/vendor account, billing/recovery and privacy-transfer evidence under RT-005/RT-008;
5. preserve SBOM, lock, pin and licence evidence in the Buyer DD room.

## 12. Gate
**RT-006 baseline SBOM:** COMPLETE  
**Runtime dependency candidate:** GREEN / 0 unpinned  
**Core PR #111:** READY FOR REVIEW / ALL QA GREEN / NOT MERGED  
**Works PR #1:** READY FOR REVIEW / NOT MERGED  
**npm lock + `npm ci`:** GREEN CANDIDATE  
**GitHub Actions immutable refs:** GREEN / 0 floating  
**Composed release-candidate SBOM:** GREEN  
**Unknown third-party licences:** 0  
**Counsel-review package licences:** 0  
**Third-Party Notices:** IMPLEMENTED CANDIDATE  
**AI Asset Register:** IMPLEMENTED / COMPANY ACCOUNT+LEGAL FLOW OPEN  
**RT-006 technical gate:** GREEN CANDIDATE  
**RT-006 final close:** BLOCKED only by merge/final-distribution/company-vendor-control gates  
**F0-M:** BLOCKED by wider Investor-Ready gates.

No merge, Production deploy, Supabase deploy, account transfer or business/investor outreach is authorized by this work.
