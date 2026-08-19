# HOY G1 Closing Board v1.0

Snapshot: 2026-08-19  
Base: `main` at `88bb9e77d50ccb9db96306f5e737e27bad6237ab`

## Single authority

This board is the **single execution and status authority for G1 Acquisition Clean**. Subject-matter packages provide evidence or execution inputs; they do not define a competing overall G1 status.

- **PR #133 / Module A** = Current-main survivor and recompose input.
- **PR #134 / Module B** = External decision inputs.
- Historical #117/#118 remain useful evidence, but are not the intended current closing authority after this board is verified.

The board answers one buyer/closing question:

> What is already proven, what is prepared for bounded execution, what requires an external qualified decision or independent person, and what is blocked by an upstream dependency?

The four classes are intentionally non-overlapping:

- **PROVEN** — the named control is evidenced at the stated scope. This never means all of G1 is done.
- **READY_TO_EXECUTE** — a bounded package exists, but execution/deploy/apply is not authorized by this board.
- **EXTERNAL_REQUIRED** — code and internal documentation cannot close the control; qualified counsel/tax/trademark review or an independent human operator is required.
- **BLOCKED** — an upstream dependency prevents truthful execution/closure.

Class totals are snapshot observability, not immutable business rules. A control may advance when its own evidence requirements are actually satisfied. High-risk individual controls remain fail-closed.

## Execution discipline

**No new G1 governance artifact is the default next step.** A new control-plane document is justified only if a materially new buyer-risk type appears that cannot be represented by the existing 25 controls.

From this point the default action must be one of three things:

1. close or reconcile an existing internal control;
2. obtain an external decision that code cannot replace;
3. execute an already prepared bounded package under its stated safeguards.

This rule exists to prevent DD bureaucracy from displacing buyer-value work.

## Executive view

The technical foundation is no longer the dominant G1 uncertainty. Current main contains the RT-006 supply-chain hardening **and the merged #128 analytics-storage fail-closed hotfix**. Contributor history, secret-history classification, dormant Terms infrastructure, current-main analytics storage protection and cross-vertical Platform Core transferability all have scoped technical proof.

The highest-value remaining G1 work is concentrated in:

1. **Current-main survivor reconciliation** — Module A / #133 updates the old #118 authority map for merged #128 plus current #127/#130 candidates.
2. **Entity + Founder IP execution** — final legal/tax structure and actual Founder→Company rights instrument.
3. **Company-controlled digital assets** — GitHub, Supabase, domains, billing, recovery, two-admin continuity, vault/rotation and backup drill.
4. **RT-001 isolated security execution** — #125 is technically green but not yet executed in a safe isolated database.
5. **Data rights execution** — preserve Buyer-Safe segregation and convert the prepared first-party replacement waves into an ordered, rebased apply package without pretending AMBER is transfer-clear.
6. **Privacy/Terms/Trademark legal closure** — final controller/entity facts, legal basis/retention/DSAR/processor decisions, Terms review/activation decision and official trademark clearance.
7. **Non-founder handoff** — a different person must actually pass the transfer drill.
8. **Acquired-state regeneration** — only the actually selected/merged/transferred state may populate the buyer data room.

## Current-main corrections to the older G1 master

The older G1 master was based on a pre-RT-006/pre-#128 `main`. This board uses the current hardened state.

Important authority changes:

- RT-006 supply-chain hardening is **on `main`**.
- Privacy hotfix **#128 is merged on `main`**; PR #120 remains historical technical evidence, not current-main authority.
- The broader current-main privacy operating candidate is **PR #127**.
- Public-runtime current-main successor is **PR #130**; PR #121 remains historical exact-head evidence.
- RT-001 PR #125 is fully Critical/Final/Browser green on its candidate head, but remains unexecuted on an isolated database.
- Works Platform Core CI is closed: run `32197153970` passed static/lock, 12 unit tests, Mobile Chrome, Mobile WebKit and Desktop Chromium.

## Closing sequence

### Phase A — Internal reconciliation

Do now without outreach or Production mutation:

- verify Module A / #133;
- treat merged #128/current `main` as the analytics-storage runtime authority and reconcile #127 around it;
- reconcile #130 against the selected Privacy/Runtime state;
- recompose/rebase RT-001 hardening onto that state before isolated execution;
- rebase/review RT-007 and package the 36 prepared replacements into one ordered apply plan without applying them;
- preserve Buyer-Safe field/restaurant/archive segregation.

### Phase B — External decisions

Use Module B / #134 as the compact adviser input rather than sending the whole repository:

- entity/founder tax and IP-transfer mechanics;
- Founder→Company rights instrument + asset schedule;
- DE/ES Business Terms review and activation conditions;
- privacy controller/legal basis/retention/Article 14/DSAR/processor/transfer decisions;
- official HOY + house-mark trademark clearance and goods/services scope;
- independent non-founder handoff execution.

These are **decision inputs**, not an authorization for business or investor outreach.

### Phase C — Controlled execution

Only after upstream decisions:

- execute Founder/company rights path;
- establish company-controlled repositories/infrastructure/domains/vendors/recovery;
- run RT-001 on an isolated compatible database, IDOR/BOLA negatives and Advisor before/after;
- rebase/review/apply approved provenance replacement waves;
- complete deploy-only public-runtime cutover and live smoke;
- run the independent non-founder handoff drill.

### Phase D — Acquired state and G2 release

After execution:

- regenerate exact acquired-state SBOM/NOTICE;
- regenerate runtime manifest;
- regenerate rights/Buyer-Safe export;
- archive account-control and recovery evidence;
- archive executed Chain-of-Title evidence;
- re-run final integration QA;
- declare G1 done only if every P0 condition is proven or covered by an explicitly approved buyer-acceptable carve-out.

**Only then** may the separate Contact Freeze be considered for release into G2 Market Proof.

## Hard claim boundaries

This board does **not** claim:

- HOY is fully GDPR compliant;
- all current data is transferable or proprietary;
- all restaurant profiles are legally clean;
- the Founder IP is already owned by a company;
- accounts/domains/infrastructure are company-controlled;
- RT-001 is production-tested;
- HOY/house marks are cleared;
- founder independence has been proven;
- G1 is complete;
- business/partner/investor outreach is authorized.

## Buyer-value interpretation

The purpose of this board is not to maximize the number of green boxes. It is to reduce buyer uncertainty and prevent broad valuation discounts caused by ambiguous ownership, rights, privacy, security or key-person risk.

The correct path is therefore:

**prove what can be proven internally → obtain only the external decisions that code cannot replace → execute under controlled boundaries → regenerate acquired-state evidence → move to G2 Market Proof.**

The machine-readable source of truth is `docs/investor-ready/g1-closing-board-v1.json`.
