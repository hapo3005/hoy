# HOY Investor Ready — G1 Acquisition Clean Master

Status: **IN PROGRESS**  
Date: 2026-08-19  
Purpose: single buyer/data-room control plane for chain of title, technical DD, data/source rights, contracts, privacy, brand, digital control, public-runtime boundary and platform transferability.

## Executive view

HOY now has substantial diligence work. The main DD risk has shifted from missing documentation to **evidence fragmentation, overlapping branches and accidentally treating a green historical candidate as the acquired/merged state**.

The focused reconciliation work has converted the largest known umbrella conflicts into current-main successor candidates rather than attempting unsafe wholesale merges. Security/migration reconciliation has now also been refreshed against the current Production state.

The machine-readable authority is `g1-acquisition-clean-register.json`.

## Current gate map

| Gate | Canonical path | Status | Main open condition |
|---|---|---|---|
| Integration / survivor reconciliation | Core PR #118 | IN PROGRESS | validate/integrate selected survivors and regenerate acquired-state evidence |
| Security / migrations | **Core PR #124** | IN PROGRESS | compose a new current-baseline hardening delta; preserve privacy revocation; isolated DB + auth/IDOR + advisor close evidence |
| Corporate / IP chain of title | Core PR #104 + Core PR #123 | IN PROGRESS | entity + executed founder/company rights structure |
| Digital asset control | Core PR #119 | IN PROGRESS | company-controlled accounts/recovery/backup evidence |
| OSS / SBOM / AI technical DD | Core PR #116 | GREEN CANDIDATE | exact-head/acquired-state SBOM/NOTICE evidence |
| Data/source rights | Core PR #106 + Works #2 | IN PROGRESS | launch-critical rights/replacement queue + transferable export proof |
| Business Terms / Business Confirmation | Core PR #122 | IN PROGRESS | legal review/activation path; current snapshot remains draft with 0 acceptances and 0 confirmations |
| GDPR / privacy | Core PR #120 | IN PROGRESS | clean runtime QA + consent/legal/retention/DSAR/vendor/Production gates |
| Public runtime / proprietary-source boundary | Core PR #121 | IN PROGRESS | deploy-only live cutover + source-control/acquired-state manifest evidence |
| Trademark / brand | Core PR #108 | IN PROGRESS | official registry evidence + counsel clearance |
| Platform Architecture & Transferability | Core PR #115 + Lifestyle #1 + Works #3 | GREEN CANDIDATE | Works CI/browser proof + non-founder handoff + final integration re-test |
| Historical umbrella / superseded inputs | Core PR #102 | REFERENCE ONLY | use focused successors; never blind-merge stale/combined branches |

## Current security/migration reconciliation

Historical Core PR #103 was useful when Production had 78 registered migrations and Accessible v1 was still treated as pending. That snapshot is no longer current.

Read-only Production reconciliation for Core PR #124 now records:

- **95 registered migrations**;
- latest = `20260818210527 ir02d_link_terms_to_active_privacy_notice`;
- Accessibility canonical layer live: 24 registry features + 668 facts, alongside 166 legacy rows;
- Source Rights, Business Terms and Privacy governance objects live;
- Family table absent after rollback;
- 168/168 sales-pipeline rows remain `send_lock=true`;
- Security Advisor currently reports 7 authenticated `SECURITY DEFINER` warnings for the narrow operator/media RPC surface;
- `log_analytics_event` EXECUTE is currently revoked from both `anon` and `authenticated` by the later privacy gate.

The historical #103 hardening script would grant analytics EXECUTE back to those roles. It is therefore **not safe to apply unchanged**. #103 remains a reference source for hardening strategy, while #124 is now the canonical current-state Security/Migration path.

A future composed RT-001 migration must be built against current function definitions and must preserve analytics revocation unless the independent Privacy/Consent release gate explicitly authorizes activation.

## Reconciliation successors

The former missing-successor problem has been reduced to a validation/integration problem:

- **Core PR #119** — RT-005-only current-main candidate. Its clean all-history audit revalidated 14/14 findings with **0 unclassified findings**; Critical, Final Release and the full defined browser matrix are green. Company account/recovery/control execution remains open.
- **Core PR #120** — one current-main analytics privacy runtime instead of competing #107/#109 implementations. Wider RT-008 legal/operating/Production gates remain open.
- **Core PR #121** — deterministic allowlist public-runtime candidate harvested from #102 without wholesale merge. Live deploy-only cutover remains open.
- **Core PR #122** — already-applied Business Terms migration/document evidence restored onto current main without re-running Production DDL. Terms remain draft and unaccepted.
- **Core PR #123** — unique Founder-IP execution drafts preserved exactly while Core PR #104 remains current contributor-census authority. Founder-to-company execution remains pending.
- **Core PR #124** — current 95-migration Security/Migration control plane replacing #103 as current-state authority; no DDL performed.

Existence of these candidates does **not** make their gates DONE.

## Canonical-source rule

For buyer DD, **green is not enough**. Evidence must match the exact state that is actually merged, deployed, owned or transferred.

A historical workflow run may remain useful evidence for a specific control, but it cannot silently prove a later branch or merged state. Where a focused candidate has been rebuilt from current `main`, that focused candidate takes precedence for final merge/evidence decisions over an overlapping historical implementation branch.

## G1 close definition

`G1_ACQUISITION_CLEAN` may only become **DONE** when every non-reference item in the machine register is DONE and all of the following hold:

- entity/ownership structure is finalized sufficiently for the intended transaction path;
- founder/pre-company IP and relevant assets have a documented, executed rights path to the transaction entity;
- contributor/third-party/OSS/AI dependencies are inventoried and material exceptions are resolved or explicitly carved out;
- source/data rights required for launch and transfer are cleared, replaced or visibly excluded;
- Business Terms/confirmation evidence matches the actual activated/legal state rather than dormant infrastructure;
- privacy/retention/processor/transfer controls required for actual processing are completed and qualified review is attached where required;
- public-runtime/source boundaries match the actual deployment and company-control state;
- trademark/brand risk is cleared or a transaction-acceptable fallback architecture is documented;
- company control/recovery of material repositories, domains, infrastructure and vendor accounts is evidenced;
- Security/Migration evidence is based on the final current Production/integration state and does not revive superseded grants;
- buyer-facing technical/platform claims point to exact-head evidence;
- the final data-room snapshot represents the state actually being sold, not only unmerged candidates.

## Merge hygiene

1. **One canonical merge/evidence source per gate.** Older or umbrella branches may remain reference evidence but are not merged blindly.
2. **Reconcile overlap before merge.** If two PRs touch the same runtime, migration, policy or DD artifact, compare them against current `main` and explicitly choose/compose the survivor.
3. **Prefer clean rebuilds on current main** when historical branches have material divergence.
4. **Re-run evidence after material dependency/runtime changes.** A previous green SBOM, browser suite or security audit does not automatically transfer to a new head.
5. **Archive acquired-state evidence.** Final SBOMs, workflow references, rights registers, contract hashes and control inventories must correspond to the final state.
6. **No hidden exceptions.** RED/OPEN/BLOCKED items are either closed or recorded as explicit transaction carve-outs/conditions.

## Relationship to external/Production gates

This master is a readiness/control artifact. It **does not itself authorize**:

- company formation or asset transfer;
- Production/Supabase deployment;
- migration application/repair or RPC grant changes;
- privacy/legal or Business Terms activation;
- business, partner or investor outreach;
- data commercialization;
- trademark filing;
- tax/residency actions.

Those remain under their own gates.

## Platform-transfer relationship

Core PR #115 has exact-head Critical, Final Release and the defined Mobile Chrome, Mobile WebKit and Desktop Chromium QA green for its current Platform-Core/transfer candidate. That improves technical transferability evidence, but G1 does not treat "a handoff process exists" as equivalent to "the business already operates without the founder."

Works browser/CI evidence and the defined non-founder technical handoff drill remain open before a broader founder-independence claim.

## Data-room assembly order

1. **00 Master Gate Register** — this file + Core PR #118 reconciliation.
2. **01 Security / Migration Current State** — Core PR #124; #103 historical reference only.
3. **02 Corporate & Chain of Title** — Core PR #104 + Core PR #123.
4. **03 Digital Asset Control** — Core PR #119.
5. **04 Technical DD / SBOM / Supply Chain** — Core PR #116.
6. **05 Data & Source Rights** — Core PR #106 + Works rights evidence.
7. **06 Business Terms / Confirmation** — Core PR #122.
8. **07 Privacy / DPA** — Core PR #120 plus final legal/operating evidence.
9. **08 Brand / Trademark** — Core PR #108.
10. **09 Public Runtime / Source Boundary** — Core PR #121.
11. **10 Platform Architecture & Transferability** — Core PR #115, handoff and vertical adoption evidence.
12. **11 Exceptions / Closing Conditions** — only remaining explicit carve-outs and dated owners/actions.

## Buyer outcome

The target evidence chain is deliberately simple:

**one material control → one current canonical path → one explicit status → exact/executed evidence → visible exceptions.**

That is materially more transferable than a collection of individually strong but mutually stale branches.
