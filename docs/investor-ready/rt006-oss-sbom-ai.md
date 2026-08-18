# HOY Investor Ready — RT-006 OSS / SBOM / AI Dependency Review

Status: **IN PROGRESS / first-pass dependency inventory complete, exhaustive machine SBOM pending local/full-tree run**

## 1. Scope

RT-006 covers:
- third-party runtime libraries;
- development/test dependencies;
- Edge Function imports;
- GitHub Actions dependencies;
- CDN-loaded code;
- project-level licensing policy;
- AI providers/models/tools materially used to create or operate HOY;
- reproducible SBOM evidence.

It does **not** decide rights in external business data/media; that is RT-007.

## 2. Current first-pass dependency inventory

### HOY Core (`hapo3005/hoy`)

#### Declared npm/dev dependency
- `@playwright/test` `1.62.0` — development / browser QA — Apache-2.0 upstream.
- Root `package.json` is marked `private: true`.
- No `package-lock.json` was found in the reviewed repository root, so dependency installation is less reproducible than a locked build.

#### Browser/runtime CDN dependencies
- Leaflet `1.9.4` from jsDelivr — map runtime — BSD-2-Clause upstream.
- `@supabase/supabase-js` `2.111.0` from jsDelivr — browser Supabase client — MIT upstream.
- Leaflet assets are pinned to an exact version and use SRI hashes in `index.html`.
- Supabase JS is pinned to an exact version but the reviewed script tag does not currently carry an SRI hash.

#### Supabase Edge Function imports
At least one production Edge Function imports:
- `jsr:@supabase/functions-js/edge-runtime.d.ts` — Supabase Edge runtime type/runtime integration;
- `npm:@supabase/server@1.4.1` — current npm package metadata reports MIT licensing.

The full Edge Function tree must be scanned for all `npm:`, `jsr:`, `https:` and relative imports before RT-006 is closed.

#### GitHub Actions
Workflows include versioned third-party actions such as `actions/checkout@v6`. All Actions `uses:` references must be part of the CI SBOM and should be reviewed for pinning policy.

### HOY Works (`hapo3005/hoy-works`)
- Static web application + Supabase backend.
- Browser runtime loads `@supabase/supabase-js@2` from jsDelivr.
- This is **major-version pinned only**, so minor/patch content can change without a HOY source commit.
- Remediation: pin to an exact reviewed version before launch; preferably align to a tested platform version and record integrity/provenance.
- No root package-manager manifest was identified in the reviewed root snapshot.

### HOY Lifestyle (`hapo3005/hoy-lifestyle`)
- Current root consists of `README.md`, `data/` and `docs/`.
- No root `package.json` or runtime application dependency manifest was found in the reviewed snapshot.
- Its primary DD risk is therefore data/source rights (RT-007), not conventional OSS dependency licensing.

## 3. Project-level licensing policy

All three HOY repositories are public today, but none of the reviewed roots contains a `LICENSE` file.

Until the Parent makes an explicit licensing decision:
- treat HOY's own source as **proprietary / no license granted by default**;
- do not add MIT/Apache/GPL or another project-wide OSS license merely for repository hygiene;
- retain and reproduce third-party notices/attributions as required by their own licenses;
- segregate third-party code/assets from HOY-owned code where practical;
- never remove upstream copyright/license notices.

A public repository is not, by itself, the same as a deliberate open-source licence grant.

## 4. Known license decisions from upstream sources

| Component | HOY use | Version / range observed | Upstream license | Initial decision |
|---|---|---:|---|---|
| Leaflet | Core browser runtime | 1.9.4 | BSD-2-Clause | ACCEPT — retain notice |
| @supabase/supabase-js | Core/Works browser runtime | Core 2.111.0; Works `@2` | MIT | ACCEPT — pin Works exactly; retain notice |
| @playwright/test | Core development QA | 1.62.0 | Apache-2.0 | ACCEPT — retain license/NOTICE obligations if redistributed |
| @supabase/server | Core Edge Function | 1.4.1 | MIT (npm metadata) | ACCEPT provisionally; include in generated SBOM |
| Supabase Edge runtime / functions-js | Edge runtime | JSR import | TO VERIFY in exhaustive scan | REVIEW |
| GitHub Actions used by workflows | CI only | workflow-specific | TO INVENTORY | REVIEW |

No GPL/AGPL dependency has been identified in this first-pass inventory. That statement is **not** an exhaustive clearance until the generated SBOM/full-tree scan completes.

## 5. AI dependency inventory — current code evidence

### OpenAI menu extraction / evaluation
HOY Core currently contains automated menu-evaluation and menu-intake code that calls the OpenAI API directly.

Observed controls:
- API key comes from environment/GitHub Actions secret, not source plaintext in the reviewed workflow;
- Responses API calls set `store:false` in the reviewed evaluation and intake code;
- model selection is runtime-aware: the code queries available models and chooses from a configured candidate list rather than assuming one model forever;
- prompts explicitly treat restaurant source content as untrusted data and prohibit following instructions embedded in source content;
- structured JSON Schema output and hallucination/price/coverage evaluation gates are used.

DD implications:
- OpenAI is a material vendor dependency for menu extraction/evaluation, but HOY's core discovery/runtime should not depend on model availability for every consumer page load;
- the OpenAI account/billing/recovery owner belongs in RT-005;
- menu source URLs/files/images sent for extraction belong in the privacy/data-rights/vendor-flow map (RT-007/RT-008);
- model/provider/version, purpose, input class, output use and human review must be written to the AI Asset Register;
- AI output is never a source of truth by itself: original sources, provenance, review and confidence remain separate.

## 6. AI Asset Register minimum fields

For every material AI use:
- use-case ID;
- provider / product / model family;
- account/billing owner;
- code/workflow location;
- inputs sent;
- personal/confidential data class;
- source-rights status;
- retention/store setting where controlled by HOY;
- output type;
- human review / automated quality gate;
- whether output is published directly;
- provider terms/version reviewed;
- fallback if provider/model becomes unavailable;
- evidence/provenance retained;
- status: `APPROVED`, `REVIEW`, `BLOCKED`, `DEPRECATED`.

## 7. SBOM generation policy

RT-006 includes `scripts/investor-ready/audit-third-party-deps.mjs`, a dependency-free Node scanner intended to run against a fully fetched repository tree.

It records:
- package.json dependencies/devDependencies;
- HTML `src`/`href` external URLs;
- JS/TS `npm:`, `jsr:` and HTTP imports;
- GitHub Actions `uses:` references;
- license/notice files present in the repo.

The scanner output is evidence input, not an automatic legal clearance. Every `UNKNOWN`, unpinned runtime dependency, nonstandard source import or copyleft licence must be resolved manually.

## 8. Release policy

### BLOCK
- unknown/no licence for code copied into or distributed with HOY;
- AGPL/network-copyleft dependency without explicit legal approval;
- unreviewed third-party source code copied into HOY;
- runtime CDN dependency with uncontrolled version drift for launch-critical code;
- AI/vendor credential controlled only by a personal account with no recovery path at F0-M.

### COUNSEL REVIEW
- GPL/LGPL or unusual copyleft;
- source-available/noncommercial/custom licences;
- bundled media/fonts/templates with ambiguous commercial rights;
- AI-generated code/assets with material third-party similarity/provenance concern.

### ACCEPT WITH NOTICE
- permissive MIT/BSD/Apache dependencies after version/source/notice record is complete.

## 9. Required remediations before RT-006 close

1. Run the scanner on fully fetched Core, Lifestyle and Works repositories.
2. Generate a machine-readable dependency inventory for the DD room.
3. Add a controlled third-party notices file to the product/distribution package without licensing HOY's own code.
4. Pin HOY Works Supabase JS to an exact reviewed version.
5. Review every Edge Function external import.
6. Review every GitHub Actions `uses:` dependency/pinning strategy.
7. Decide whether a package lock / reproducible QA install is required for Core and commit the chosen mechanism.
8. Complete AI Asset Register with account/terms/privacy ownership.
9. Resolve every `UNKNOWN`, custom, copyleft or no-license item.
10. Re-run after any material dependency addition before investor DD/major release.

## 10. F0-M close rule

RT-006 closes only when:
- no unresolved P0 OSS/licensing issue remains;
- launch-critical runtime dependencies are pinned and reproducible;
- SBOM/dependency evidence is archived;
- third-party notice obligations are satisfied;
- material AI/vendor dependencies are registered with ownership, privacy and fallback controls;
- no secret or paid vendor dependency is controlled solely by an unrecoverable personal account.

No Production code or vendor account was changed in this preparation pass.
