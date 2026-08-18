# RT-005 Secret History Audit Evidence — 2026-08-18

Status: **TECHNICAL SECRET-HISTORY GATE GREEN**  
RT-005 overall: **IN PROGRESS — company control/recovery transfer still open**

## Successful audit execution
- Workflow: `Investor Ready RT-005 Secret History Audit`
- Successful run ID: `32185575422`
- Audited branch head: `3f5d2d112a94933eb94ac76c1b44191808a6423a`
- Artifact name: `hoy-rt005-secret-history-audit`
- Artifact ID: `9342313653`
- Artifact SHA-256: `16f64661beb8a22c352a785f0c94b98578a954428e7aa251369f80cf63bca400`
- Artifact retention: 90 days

The scanner first executes a synthetic canary and refuses to scan HOY unless the detector proves it can identify the canary. The successful run passed this detector-health gate.

## Scope
For each of:
- `hapo3005/hoy`
- `hapo3005/hoy-lifestyle`
- `hapo3005/hoy-works`

the workflow fetched every currently advertised branch and tag and scanned all commits reachable through `git log --all --full-history`.

Raw finding reports are deleted inside the runner after sanitization. DD artifacts intentionally retain **no detected secret value, matched source text or source-line content**.

## Final scanner result
| Repository | Scanner findings | Rules | Unique commits |
|---|---:|---|---:|
| `hoy` | 13 | `generic-api-key` | 13 |
| `hoy-lifestyle` | 0 | — | 0 |
| `hoy-works` | 1 | `generic-api-key` | 1 |

Total scanner findings: **14**.

## Exact classification result
- `BENIGN_LOCAL_STORAGE_KEY`: **7**
- `EXPECTED_PUBLIC_CLIENT_KEY`: **6**
- `BENIGN_SYNTHETIC_CANARY`: **1**
- `REVIEW_REQUIRED`: **0**
- stale classification entries: **0**

The gate uses exact fingerprints from `rt005-secret-findings-classification.json`. Any new scanner fingerprint defaults to `REVIEW_REQUIRED` and fails the workflow.

## Public Supabase client-key findings
The six public-client findings are `sb_publishable_...` values used in browser/read-only client contexts. Supabase's current API-key documentation classifies publishable keys as low-privilege and safe to expose in web/mobile/desktop apps and public source code. This classification does **not** apply to `sb_secret_...` or legacy `service_role` credentials, which bypass Row Level Security and must remain server-side secrets.

This therefore resolves the scanner classification only. It does not weaken the independent RLS/GRANT/security gates in RT-001/RT-008.

## Local browser-key findings
The seven non-credential findings are literal browser/storage identifiers such as:
- `hoy-anonymous-id-v1`
- `hoy-live-plan-v239`
- `hoy-promo-attribution-v1`

They name local application storage/state and provide no authentication capability.

## Synthetic canary finding
One reachable audit commit contains the deliberately fake detector-health token used during scanner development. It has no operational authentication target and is explicitly classified as a synthetic test fixture. The current workflow now constructs the canary only at runtime to avoid creating additional historical findings.

## Security conclusion
**No unclassified credential/secret finding remains in the currently reachable Git history of the three audited HOY repositories.**

This does not prove that a privileged credential can never have existed outside reachable Git refs, logs, external systems, local files or other repositories. Separate control remains required for:
- GitHub Actions secret inventory/rotation;
- Supabase secret/service credentials;
- OpenAI/vendor keys;
- domain/registrar credentials;
- password-manager/recovery controls;
- company account transfer and two-admin continuity.

## Scope limitation
A fresh remote clone cannot enumerate objects that are no longer reachable from any branch/tag advertised by the origin. The result is intentionally stated as the **current reachable-history** secret gate, not an absolute historical impossibility claim.

## RT-005 impact
Completed technical sub-gate:
- all-current-reachable-history secret scan: **GREEN**.

RT-005 remains open for:
- company-controlled GitHub organization;
- company-controlled Supabase organization/billing;
- domains/DNS/registrar register and control;
- vendor billing/recovery ownership;
- secrets-vault metadata and rotation evidence;
- two-admin coverage;
- backup/recovery drill.

This is a technical diligence record, not a legal opinion.
