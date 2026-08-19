# RT-005 Secret History Audit Evidence

Status: **CLEAN CURRENT-MAIN TECHNICAL SNAPSHOT GREEN**  
RT-005 overall: **IN PROGRESS**  
Date: 2026-08-19

## Current clean execution

The clean RT-005 split re-ran the fail-closed audit on its own implementation head rather than relying on the historical umbrella branch.

- Workflow: `Investor Ready RT-005 Secret History Audit`
- Successful run ID: `32194760001`
- Audited controls/head: `014194e7c7e817d92c973442e87dbae06c97ae92`
- Artifact name: `hoy-rt005-secret-history-audit`
- Artifact ID: `9345455439`
- Artifact SHA-256: `2a36647a0316a5f2c6fb57a9d18eb505e884254c7057618c32fd8e18aa751d3a`
- Artifact retention at creation: 90 days

The workflow checked out the exact audit-control head, fetched every advertised branch/tag for Core/Gastro, Lifestyle and Works, and used a pinned Gitleaks image. A runtime-only synthetic canary first proved detector health. Raw scanner reports were deleted after sanitization; the retained DD artifact does not contain detected secret values or matched source-line text.

## Current result

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

Therefore the bounded technical sub-control `RT005-01 reachable_history_secret_scan` is closed for this audited implementation snapshot.

The exact classifications remain in `rt005-secret-findings-classification.json`. Any new fingerprint defaults to `REVIEW_REQUIRED`; the workflow fails closed if even one unclassified finding appears.

## Snapshot semantics

This record is deliberately non-self-referential. Evidence-only commits made after the audited implementation head do not cause the historical run ID or SHA to be rewritten as if it had executed on a different commit.

Before final merge or external acquired-state circulation, the workflow must run again on the then-current exact head. That later run can be attached to the PR/data-room evidence without falsifying the earlier snapshot.

## Claim boundary

The current result supports only this bounded statement:

> At the audited implementation snapshot, no unclassified secret/credential finding remained in Git objects reachable through the advertised branches/tags of the three audited HOY repositories.

It does **not** prove:

- that no credential ever existed outside reachable refs;
- that privileged credentials are company controlled;
- that GitHub/Supabase/OpenAI/vendor recovery and billing are transferable;
- that rotation/recovery/backup drills are complete;
- that RT-005 overall is closed.

## Historical reference

The earlier umbrella-branch run `32185575422` remains historical supporting evidence only. It is not the canonical current technical snapshot now that the clean candidate has its own successful execution.

## RT-005 open controls

RT-005 remains open for company/transaction control of:

- GitHub organization/repositories and recovery;
- production infrastructure organization/billing;
- domains/DNS/registrar;
- material vendor/billing/recovery accounts;
- privileged secret/vault ownership and rotation evidence;
- two-admin/continuity coverage;
- backup/recovery drills.

This is a technical diligence record, not a legal opinion.
