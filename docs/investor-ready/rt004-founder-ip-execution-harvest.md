# HOY Investor Ready — RT-004 Founder IP Execution Harvest

Status: **EXECUTION PENDING**  
Date: 2026-08-19  
Scope: preserve unique founder/pre-company IP execution drafts from historical PR #102 while using PR #104 as the current contributor-census authority.

## Why this candidate exists

PR #104 contains the stronger current RT-003/004 architecture and the completed all-history contributor census, but the historical IR-02 umbrella PR #102 contains unique founder execution materials that should not disappear from the transaction file:

- Founder IP Schedule;
- Founder IP Assignment Draft;
- Founder IP Ownership Declaration Draft;
- Chain-of-Title Evidence File.

Those files are valuable execution inputs, but they must not be confused with completed assignment or with current contributor-census status.

## Exact historical preservation

This candidate preserves the following #102 blobs byte-identically:

| Asset | Git blob | Status |
|---|---|---|
| Founder IP Schedule 2026-08-18 | `f68275a6565ce5172de13e4365fe8e782695cfcc` | historical execution schedule |
| Founder IP Assignment Draft | `e5bf95407781f85e6dab41229c20c1d2c7ae9d87` | draft, not executed |
| Founder IP Ownership Declaration Draft | `480443a96c0454af59ef8e4ea9463ef9472e848a` | draft, not executed |
| Chain-of-Title Evidence File | `4ddbb12c37bbc865af632a4a41c959c1eecfe127` | historical evidence input |

The QA gate recomputes the Git blob SHA of each file and fails on drift.

## Historical schedule caveat

The preserved 2026-08-18 schedule correctly records its own then-current contributor work as `PARTIAL_SAMPLE_NOT_FULL_HISTORY`.

That field is **historical** and must not be rewritten in-place to pretend the original record said something it did not.

The current technical contributor authority is PR #104, whose full-history audit evidence records:

- Core/Gastro: 1 founder, 3 platform-or-bot identities, 0 review-required;
- Lifestyle: 1 founder, 1 platform-or-bot identity, 0 review-required;
- Works: 1 founder, 0 platform-or-bot identities, 0 review-required;
- no external human contributor identified in the reachable repository history at that audit snapshot.

This improves the contributor evidence but does not transfer founder rights to a company and does not clear third-party media/data/vendor/AI rights.

## Current execution state

`data/rt004-founder-ip-execution-register-2026-08-19.json` is the current control plane.

Still pending:

- final company/entity path;
- executed founder-to-company rights instrument;
- executed ownership declaration where used;
- finalized asset schedule;
- consideration/tax/accounting treatment;
- qualified legal review;
- archived private signature/execution evidence;
- reclassification of covered assets to company-owned only after valid execution.

## Linked gates

Founder IP execution is not isolated from:

- PR #104 — corporate structure / chain of title / contributor evidence;
- PR #119 — digital asset/account control;
- PR #116 — OSS/AI/media technical DD;
- PR #106 + Works rights gate — source/data rights;
- PR #108 — brand/trademark;
- the independent transaction/exit-tax/residency gate.

A signed founder instrument cannot manufacture rights the founder does not possess upstream.

## Claim discipline

Allowed:

> HOY has preserved founder-IP execution drafts and a green technical contributor-census reference; formal founder-to-company rights execution remains pending.

Not allowed:

- “All HOY IP is already owned by a HOY company.”
- “All third-party/data/media/AI rights are cleared by the founder assignment.”
- “Repository authorship alone proves title to every asset.”

## Safety boundary

This candidate does not form a company, execute an assignment, transfer IP/accounts/domains, change Production or authorize outreach.

The preserved drafts require the separate legal/tax/entity execution gate before signature or reliance.
