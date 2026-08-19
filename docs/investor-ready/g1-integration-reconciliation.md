# HOY Investor Ready — G1 Integration Reconciliation

Status: **IN PROGRESS**  
Date: 2026-08-19  
Purpose: prevent parallel Investor-Ready branches from creating contradictory acquired-state evidence or unsafe merge order.

## Executive decision

HOY's diligence risk is no longer a lack of technical work. The main integration risk is that individually strong branches represent different points in time or overlapping implementations.

The binding rule remains:

> **No broad Investor-Ready branch is merged merely because it is green. The final acquired state is assembled from one canonical survivor per control, with overlap reconciled on current `main` and QA rerun on the exact resulting head.**

Technical GREEN is evidence about a candidate, not automatic Legal/Execution/Production closure.

This document does not authorize Production changes, legal activation, asset transfer or outreach.

## 1. Binding dispositions

### PR #116 — RT-006 technical DD

**Disposition: CANONICAL RT-006 SURVIVOR**

PR #116 owns the focused technical-DD path for supply-chain/reproducibility evidence. Historical RT-006 material from broader branches may support the audit trail but must not override #116 in final integration.

### PR #105 — historical mixed RT-005/RT-006 path

**Disposition: SPLIT REQUIRED / DO NOT MERGE WHOLE**

Its RT-006 surface is superseded by #116. Unique RT-005 material was rebuilt as PR #119 rather than carrying the overlapping workflow/lockfile layer forward.

### PR #107 + PR #109 — conflicting privacy runtime

**Disposition: COMPOSE REQUIRED / DO NOT MERGE BOTH INDEPENDENTLY**

The conflict in `analytics-rpc-1.8.1.js` has one current-main composition survivor: **PR #120**.

PR #120 combines the stronger Production-storage boundary from #107 with the explicit consent lifecycle/regression intent from #109. Its exact-head technical QA is green, but wider Consent UX, Legal Basis, Retention, Vendor/Transfer, DSAR, Breach, DE/ES Review and Production release gates remain independent.

### PR #103 → PR #124 → PR #125 — security/migration chain

**PR #103: HISTORICAL REFERENCE ONLY / DO NOT APPLY UNCHANGED**

A current-state read proved that #103 would re-grant `EXECUTE` on `log_analytics_event(...)` after a later Privacy gate had intentionally revoked it. Therefore #103 is not a current apply source.

**PR #124: CURRENT-STATE AUTHORITY**

PR #124 owns the read-only 95-migration security/migration baseline and is fully exact-head green.

**PR #125: CURRENT RT-001 HARDENING CANDIDATE**

PR #125 is built from #124 and deliberately avoids rewriting current function bodies. It preserves the newer Analytics revocation and must remain a candidate until exact-head QA plus isolated execution, authorization/IDOR-BOLA negative tests, Security Advisor reconciliation and post-apply privacy proof are complete.

No Production apply is authorized by this chain.

### PR #102 — historical IR-02 umbrella

**Disposition: REFERENCE / HARVEST ONLY / NEVER MERGE WHOLE**

Unique material has been moved into focused current-main paths rather than wholesale-merging #102:

- Founder-IP execution drafts → #123, with #104 remaining contributor-census authority;
- Business Terms / Business Confirmation repo reconciliation → #122;
- Public-runtime / proprietary-source boundary → #121;
- Privacy runtime composition → #120;
- current Security/Migration evidence → #124/#125;
- Data/Source Rights remain under #106 and the relevant vertical rights gates.

## 2. Current survivor map

| Control | Current path | Technical status | Closing status |
|---|---|---|---|
| RT-006 Technical DD | #116 | candidate evidence established | acquired-state refresh required in final integration |
| RT-005 Digital Asset / Secret History | #119 | GREEN | account/control/recovery execution open |
| RT-008 Analytics Privacy Runtime | #120 | GREEN | broader GDPR/legal/Production gates open |
| IR-02E Public Runtime boundary | #121 | GREEN | live cutover/company source control open |
| IR-02C Business Terms evidence | #122 | GREEN | Terms remain draft; legal/activation/acceptance open |
| Founder-IP execution harvest | #104 + #123 | #123 GREEN | actual Founder→Company rights execution open |
| Security current state | #124 | GREEN | baseline only, not hardening closure |
| RT-001 hardening | #125 | QA / isolated evidence in progress | Production apply not authorized |
| Data/Source Rights | #106 + vertical rights gates | current snapshot exists | unresolved provenance queue open |
| Trademark / Brand | #108 | evidence architecture exists | official registry/legal clearance open |
| Platform transferability | #115 + Lifestyle #1 + Works #3 | GREEN for defined technical matrices | Non-Founder Handoff Drill open |
| G1 control plane | #117 | GREEN | G1 remains IN PROGRESS |

## 3. Known overlap matrix

| Pair / set | Material overlap | Resolution |
|---|---|---|
| #105 ↔ #116 ↔ #119 | QA workflows, lockfile, RT-005/006 evidence | #116 survives for RT-006; #119 carries unique RT-005 material |
| #107 ↔ #109 ↔ #120 | `analytics-rpc-1.8.1.js` | #120 is the one current-main privacy composition survivor |
| #103 ↔ #124 ↔ #125 | SECURITY DEFINER hardening, migration state, Analytics EXECUTE | #103 historical only; #124 current-state authority; #125 current hardening candidate |
| #102 ↔ focused successors | historical governance/runtime/migration/package surfaces | harvest only; never wholesale merge #102 |
| #116 ↔ #115 | dependency/QA reproducibility affects Platform evidence | final integration must rerun both control sets on one exact acquired state |

## 4. Recommended integration sequence

This is an integration sequence, **not automatic merge authorization**.

1. Keep #117 and #118 as control/reconciliation layers.
2. Preserve #116 as RT-006 authority and the focused #119–#124 survivor/evidence paths.
3. Finish #125 exact-head QA; then, only in an isolated compatible database, execute its hardening candidate and collect negative authorization/IDOR + Advisor + Analytics-revocation evidence.
4. Do not create a canonical Production migration until that isolated evidence is acceptable.
5. Close or explicitly carve out the non-code G1 conditions: Founder/Company rights execution, account/recovery control, Data/Source Rights, Privacy/Legal, Terms, Brand/Trademark and any required tax/entity conditions.
6. Build one final integration candidate from selected survivors only.
7. Regenerate SBOM, rights snapshots, privacy/terms hashes, platform evidence, release/migration reconciliation and all exact-head QA from that final state.
8. Update G1 to DONE only from the resulting executed/acquired-state evidence.

## 5. Merge-prohibited shortcuts

The following remain explicitly prohibited:

- merge #102 wholesale;
- merge #105 wholesale after #116;
- merge #107 and #109 independently after #120 exists;
- apply #103 hardening unchanged;
- treat #125 as Production-ready merely because repository QA becomes green;
- use a green historical workflow as proof for a different head;
- infer a migration is live merely because it exists on a branch;
- mark G1 DONE while ownership/privacy/brand/control/execution conditions remain open.

## 6. Buyer-DD effect

This reconciliation layer prevents a buyer from receiving many individually impressive records that do not describe one coherent acquired state.

The target evidence chain remains:

**one control → one survivor → one exact state → one evidence package → one visible closing status.**

That is the standard required before G1 can move from `IN_PROGRESS` to `DONE`.
