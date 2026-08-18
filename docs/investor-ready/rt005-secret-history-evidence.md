# RT-005 Secret History Audit Evidence

Status: **HISTORICAL TECHNICAL REFERENCE GREEN / CLEAN CURRENT-MAIN REVALIDATION REQUIRED**  
RT-005 overall: **IN PROGRESS**  
Date: 2026-08-19

## Historical successful execution

The original fail-closed audit executed successfully before this clean RT-005 split:

- Workflow: `Investor Ready RT-005 Secret History Audit`
- Successful run ID: `32185575422`
- Audited branch head: `3f5d2d112a94933eb94ac76c1b44191808a6423a`
- Artifact name: `hoy-rt005-secret-history-audit`
- Artifact ID: `9342313653`
- Artifact SHA-256: `16f64661beb8a22c352a785f0c94b98578a954428e7aa251369f80cf63bca400`
- Artifact retention at creation: 90 days

The scanner first proved detector health with a synthetic canary. Raw scanner reports were deleted after sanitization so the retained DD artifact did not include detected secret values or matched source-line text.

## Historical result

| Repository | Scanner findings | Unique commits |
|---|---:|---:|
| `hapo3005/hoy` | 13 | 13 |
| `hapo3005/hoy-lifestyle` | 0 | 0 |
| `hapo3005/hoy-works` | 1 | 1 |

Total findings: **14**.

Exact classification result:

- `BENIGN_LOCAL_STORAGE_KEY`: **7**
- `EXPECTED_PUBLIC_CLIENT_KEY`: **6**
- `BENIGN_SYNTHETIC_CANARY`: **1**
- `REVIEW_REQUIRED`: **0**
- stale classification entries: **0**

The exact classifications are maintained in `rt005-secret-findings-classification.json`. A new fingerprint is not automatically accepted; it defaults to `REVIEW_REQUIRED`.

## Claim boundary

The historical result supports only this bounded statement:

> At the audited snapshot, no unclassified secret/credential finding remained in Git objects reachable through the advertised branches/tags of the three audited HOY repositories.

It does **not** prove:

- that no credential ever existed outside reachable refs;
- that privileged credentials are company controlled;
- that GitHub/Supabase/OpenAI/vendor recovery and billing are transferable;
- that rotation/recovery/backup drills are complete;
- that RT-005 overall is closed.

## Clean-candidate requirement

The current clean RT-005 branch must re-run the all-history audit because the final acquired-state evidence must not rely only on a historical umbrella branch.

The clean workflow:

1. checks out its own exact PR head as audit controls;
2. fetches all currently advertised branches/tags for Core/Gastro, Lifestyle and Works;
3. scans reachable history with a pinned Gitleaks image;
4. proves scanner health with a runtime-only synthetic canary;
5. sanitizes finding metadata and deletes raw reports;
6. applies exact-fingerprint classifications;
7. fails if any new/unclassified fingerprint exists.

After a successful clean run, the workflow run/artifact reference becomes the current technical RT-005 evidence. This document need not be rewritten merely to make a historical run appear current.

## RT-005 open controls

RT-005 remains open for company/transaction control of:

- GitHub organization/repositories and recovery;
- production infrastructure organization/billing;
- domains/DNS/registrar;
- business email/workspace and material social/vendor accounts;
- privileged secret/vault ownership and rotation evidence;
- two-admin/continuity coverage;
- backup/recovery drills.

This is a technical diligence record, not a legal opinion.
