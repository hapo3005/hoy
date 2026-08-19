# HOY G1 Current-Main Survivor Map v1.0

Snapshot: 2026-08-19  
Base: `main` `88bb9e77d50ccb9db96306f5e737e27bad6237ab`

## Why this exists

The previous G1 integration map was correct for its earlier snapshot, but `main` has since advanced: RT-006 supply-chain hardening is merged and Privacy Hotfix #128 is now merged as well. Newer candidate work also exists in #127 and #130.

This map therefore answers a single integration question:

> Which artifact is the authority for each G1 subject **now**, and which old green branch is only evidence rather than a final merge source?

## Status meanings

- **MERGED_AUTHORITY** — already part of current main; do not re-import an older equivalent.
- **CURRENT_CANDIDATE** — focused candidate whose subject is separate enough to remain the current working authority.
- **EVIDENCE_ONLY** — valuable exact-head evidence/history, but not a final current-main merge source.
- **RECOMPOSE_REQUIRED** — valuable candidate that must be rebuilt/rebased/reconciled around current main before final integration.
- **EXTERNAL_GATE** — Git state cannot close the subject; legal/tax/account-control/trademark or independent-human execution is required.

## Current authority decisions

### Already merged

Current main is authoritative for:

- RT-006 supply-chain/locked-QA/immutable-Action hardening;
- the #128 analytics storage/transport fail-closed hotfix.

Therefore older overlapping RT-006 or analytics-runtime branches must not be merged merely because they were green.

### Privacy

- **Main/#128** = merged analytics runtime authority.
- **#127** = broader RT-008 operating-control candidate, but **RECOMPOSE_REQUIRED** around merged #128 because it overlaps runtime/privacy surfaces.
- **#120, #107, #109** = historical/evidence inputs, not final merge authorities.

### Security

- **#124** = EVIDENCE_ONLY current-state baseline for its historical snapshot.
- **#125** = technically fully green hardening candidate, but **RECOMPOSE_REQUIRED** on current main and still needs isolated DB execution, IDOR/BOLA negatives and Advisor before/after.
- **#103** = historical source only; never directly apply.

### Data rights

- **#106** remains the current RT-007 evidence/apply-work candidate, but is **RECOMPOSE_REQUIRED** before any real apply because current main has advanced.
- Buyer-Safe segregation and the 36 rollback-only replacement candidates must survive the rebase without upgrading AMBER to transfer-clear.
- Works #2 remains a separate candidate and its claims must not be collapsed into Gastro/Core rights status.

### Public runtime

- **#130** is the current-main-era IR-02E v2 shadow package, but it began before #128 merged. It must be reconciled with current main and the selected privacy/runtime state.
- #121 and #102/IR-02E are historical evidence, not final authorities.

### Corporate/IP, accounts, brand and handoff

These are deliberately not solved by selecting a Git branch:

- Founder→Company IP execution requires legal/tax/entity decisions.
- Account/domain/Supabase/vendor ownership and recovery require company-control execution.
- Trademark requires official registry/counsel evidence.
- Founder independence requires a real non-founder handoff drill.

### Platform Core

#115 + Lifestyle #1 + Works #3 provide strong technical transferability evidence. They still require reconciliation/retest against the final selected integration state before acquired-state evidence is generated. The Non-Founder Handoff remains `NOT_TESTED`.

## Composition order

The intended sequence is:

1. start from current main merged authorities;
2. reconcile #127 around merged #128;
3. reconcile #130 around the selected current privacy/runtime state;
4. recompose #125 on that state and isolate-test before migration promotion;
5. rebase/review #106 without applying its rights waves;
6. reconcile Terms/corporate/platform evidence without activating legal or Production gates;
7. after external/entity/account decisions, execute controlled closing steps;
8. regenerate exact acquired-state evidence.

## Explicit non-authorization

This map authorizes **no** final integration, Production DDL/DML, rights-wave apply, Terms/Analytics activation, IP/account/domain transfer, paid infrastructure or business/partner/investor outreach.

Machine-readable authority: `docs/investor-ready/g1-current-main-survivor-map-v1.json`.
