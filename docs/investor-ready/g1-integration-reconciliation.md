# HOY Investor Ready — G1 Integration Reconciliation

Status: **IN PROGRESS**  
Date: 2026-08-19  
Purpose: prevent parallel Investor-Ready branches from creating contradictory acquired-state evidence or unsafe merge order.

## Executive decision

HOY's current diligence risk is no longer a lack of work. The risk is that several strong draft branches overlap in runtime files, QA workflows, lockfiles, migrations and evidence documents.

The integration rule is therefore:

> **No broad Investor-Ready branch is merged merely because it is green. The final acquired state is assembled from one canonical survivor per control, with overlap reconciled on current `main` and QA rerun on the exact resulting head.**

This document does not authorize Production changes, legal activation, asset transfer or outreach.

## 1. Binding dispositions

### PR #116 — RT-006 technical DD

**Disposition: CANONICAL RT-006 SURVIVOR / REBASE-AND-VERIFY BEFORE FINAL MERGE**

PR #116 was rebuilt from current `main` as the clean RT-006 candidate. It owns the final technical-DD path for:

- immutable GitHub Actions pinning;
- reproducible lock / `npm ci` evidence;
- final candidate SBOM/licence gate;
- RT-006 AI asset register;
- supply-chain evidence;
- final third-party notices package.

### PR #105 — RT-005 + historical RT-006 umbrella

**Disposition: SPLIT REQUIRED / DO NOT MERGE WHOLE**

PR #105 contains valuable RT-005 evidence, but materially overlaps PR #116 in QA workflows, `package-lock.json`, RT-006 scripts and RT-006 documentation.

The RT-006 portion is superseded for final merge purposes by #116. The unique RT-005 material must be rebuilt or cherry-picked into a clean current-main RT-005 candidate.

RT-005 material to preserve includes at least:

- digital asset control documentation;
- secret-history evidence and classification;
- the RT-005 secret-history audit path;
- account/recovery/domain/vendor-control closing criteria.

Historical RT-006 evidence from #105 may remain archived as supporting history but must not override #116 as the canonical acquired-state candidate.

### PR #107 + PR #109 — privacy runtime

**Disposition: COMPOSE REQUIRED / DO NOT MERGE BOTH INDEPENDENTLY**

Both PRs modify `analytics-rpc-1.8.1.js` with different implementations.

PR #107 provides the stronger production-storage boundary:

- production analytics exits before identifier/payload creation without explicit consent;
- raw local analytics event history is restricted away from Production;
- legacy analytics identifiers are cleared when consent is absent;
- QA localStorage probing is restricted on Production.

PR #109 contributes important consent-operating behavior and regression evidence:

- explicit grant / deny / withdraw / clear behavior;
- cleanup on denial/withdrawal;
- dedicated browser/source regression spec.

The final survivor must be a **new clean current-main privacy candidate** that combines the strongest controls from both, uses one canonical consent key/API contract, and reruns privacy + critical + full browser QA. Neither #107 nor #109 should be treated as the final runtime survivor by itself.

PR #107 remains the canonical source for the broader RT-008 operating-pack documents unless superseded by a later clean RT-008 candidate.

### PR #102 — historical IR-02 umbrella

**Disposition: REFERENCE / HARVEST ONLY / NEVER MERGE WHOLE**

PR #102 is 106 commits ahead of its merge base and has diverged from current `main`. It contains valuable unique work but is too broad and stale to be a safe wholesale merge source.

Its unique assets must be harvested by topic into focused current-main candidates.

Required harvest buckets:

1. **Corporate / founder IP** — founder IP schedule, assignment/ownership drafts and related registers; reconcile into the RT-003/004 path (#104 or a clean successor).
2. **Business Terms / Business Confirmation** — terms documents, machine contracts, acceptance infrastructure and relevant migrations; rebuild as a focused IR-02C current-main candidate.
3. **Public-runtime / proprietary-source boundary** — deploy policy, deterministic public-runtime builder, leakage checks and package workflow; rebuild as a focused IR-02E current-main candidate.
4. **Source-rights implementation evidence** — source-rights policy/migrations and live-state evidence; reconcile with RT-007 (#106), not as a second independent rights model.
5. **Privacy governance implementation evidence** — privacy governance / analytics-disable / terms-link migrations and registers; reconcile with the final composed RT-008 privacy candidate.
6. **Accessibility canonical-fact migrations** — treat as a separate schema/release reconciliation item; never infer apply status from branch presence.

## 2. Focused PRs with low direct overlap

The following branches are structurally focused, but still require current-main reconciliation and exact-head QA before final merge:

- **#103 Security / migration hardening** — release-candidate SQL and read-only reconciliation/audit files.
- **#104 Corporate / IP chain of title** — corporate/IP documents plus contributor-census workflow/evidence.
- **#106 Data/source rights** — rights policy, live snapshot, transferability export and audit path.
- **#108 Trademark / brand** — documentation-only clearance architecture and evidence protocol.
- **#115 Platform Core / transferability** — canonical Platform Core and handoff architecture; it changes runtime/package/index/service-worker surfaces and therefore must be rebased/retested against the integration state.
- **#117 G1 Acquisition Clean master** — governance/control-plane register; should track the final survivors rather than become a substitute for them.

## 3. Known overlap matrix

| Pair / set | Material overlap | Resolution |
|---|---|---|
| #105 ↔ #116 | QA workflows, `package-lock.json`, RT-006 audit scripts/docs | #116 survives for RT-006; split unique RT-005 from #105 |
| #107 ↔ #109 | `analytics-rpc-1.8.1.js` | compose a new privacy survivor; harvest #109 consent API/tests + #107 stronger production-storage boundaries |
| #102 ↔ #103 | security/migration concepts and historical hardening | #103 focused current path; #102 only historical/unique evidence harvest |
| #102 ↔ #104 | founder IP / chain-of-title concepts | #104 canonical path; harvest unique schedules/assignment drafts from #102 |
| #102 ↔ #106 | source/data rights | #106 canonical RT-007 path; reconcile any live/historical #102 DB evidence |
| #102 ↔ #107/#109 | privacy/analytics governance | final composed RT-008 survivor; harvest #102 governance migrations/registers only after reconciliation |
| #102 ↔ #115 | package/runtime governance can intersect after rebases | no wholesale #102 merge; rebase #115 on the selected integration state |
| #116 ↔ #115 | QA environment / dependency reproducibility affects Platform Core evidence | land/reconcile RT-006 controls first, then rerun #115 exact-head QA on the resulting base |

## 4. Recommended integration sequence

This is an **integration sequence**, not automatic merge authorization.

### Phase A — establish control plane and isolated evidence

1. Keep #117 as the G1 master/control plane.
2. Reconcile/rebase the focused low-overlap candidates #103, #104, #106 and #108 against then-current `main`.
3. Preserve exact-head evidence for each accepted survivor.

### Phase B — technical supply-chain baseline

4. Reconcile and accept #116 as the canonical RT-006 technical-DD baseline.
5. Re-run SBOM/licence/action-pin/reproducibility evidence on the exact accepted head.

### Phase C — split the umbrellas

6. Build a clean **RT-005-only** current-main candidate from the unique #105 material; do not bring the superseded RT-006 workflow/lockfile layer with it.
7. Harvest #102 into focused current-main successors for IR-02C Terms, IR-02E public-runtime, and the unique IP/source/privacy evidence buckets.

### Phase D — product/runtime survivors

8. Rebase/rebuild #115 Platform Core on the selected supply-chain/investor-ready base and rerun Critical + full browser QA.
9. Build one clean composed RT-008 privacy candidate from #107 + #109 + reconciled #102 privacy governance evidence; choose one consent key/API contract and rerun all privacy/runtime/browser gates.

### Phase E — acquired-state proof

10. Create a final integration candidate from the selected survivors only.
11. Regenerate acquired-state SBOM, rights/export snapshots, privacy/terms hashes, platform evidence and release manifest.
12. Update G1 register statuses only from that final/executed state.
13. Keep legal, tax, entity, IP-execution, Production and market/outreach gates independent.

## 5. Merge-prohibited shortcuts

The following are explicitly prohibited by this reconciliation plan:

- merge #102 wholesale;
- merge #105 wholesale after #116 and assume conflicts are harmless;
- merge #107 and #109 independently into the same final state without composing one privacy contract;
- use a green historical workflow run as proof for a different final head;
- infer a database migration is live merely because it exists on a branch;
- mark G1 DONE because technical candidates are green while ownership/privacy/brand/control execution remains open.

## 6. Buyer-DD effect

This reconciliation layer reduces a class of transaction risk that is easy to miss: a buyer receiving many individually impressive documents and green workflows that do not correspond to one coherent acquired state.

The target evidence chain is instead:

**one control → one survivor → one exact state → one evidence package → one visible closing status.**

That is the standard required before G1 can move from `IN_PROGRESS` to `DONE`.