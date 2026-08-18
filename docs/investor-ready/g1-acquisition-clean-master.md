# HOY Investor Ready — G1 Acquisition Clean Master

Status: **IN PROGRESS**  
Date: 2026-08-19  
Purpose: single buyer/data-room control plane for chain of title, technical DD, data/source rights, privacy, brand, digital control and platform transferability.

## Executive view

HOY now has substantial diligence work, but much of it exists on parallel draft branches. The principal risk is no longer lack of documentation; it is **evidence fragmentation, overlapping branches and accidentally treating a green historical candidate as the acquired/merged state**.

This master register therefore does four things:

1. identifies the canonical current evidence path for each G1 topic;
2. keeps every open closing condition visible;
3. separates technical green candidates from legally/operationally completed gates;
4. establishes merge/data-room hygiene so a future buyer can reconstruct the actually transferred state.

The machine-readable authority is `g1-acquisition-clean-register.json`.

## Current gate map

| Gate | Canonical path | Status | Main open condition |
|---|---|---|---|
| Security / migrations | Core PR #103 | IN PROGRESS | isolated DB validation + final migration/manifest evidence |
| Corporate / IP chain of title | Core PR #104 | IN PROGRESS | entity + executed founder/company rights structure |
| Digital asset control | Core PR #105 | IN PROGRESS | company-controlled accounts/recovery/backup evidence |
| OSS / SBOM / AI technical DD | Core PR #116 | GREEN CANDIDATE | exact-head final evidence + acquired-state notice/licence package |
| Data/source rights | Core PR #106 + Works #2 | IN PROGRESS | launch-critical rights/replacement queue + transferable export proof |
| GDPR / privacy | Core PR #107 + #109 | IN PROGRESS | consent/retention/Art.14/DSAR/vendor and qualified review gates |
| Trademark / brand | Core PR #108 | IN PROGRESS | official registry evidence + counsel clearance |
| Platform transferability | Core PR #115 + Lifestyle #1 + Works #3 | GREEN CANDIDATE | final Core QA, Works CI/browser proof, non-founder handoff drill |
| Historical umbrella | Core PR #102 | REFERENCE ONLY | reconcile unique evidence; do not use as blind merge source |

## Canonical-source rule

For buyer DD, **green is not enough**. Evidence must match the exact state that is actually merged, deployed, owned or transferred.

A historical workflow run may remain useful evidence for a specific control, but it cannot silently prove a later branch or merged state. Where a focused candidate has been rebuilt from current `main` (for example RT-006 PR #116), that focused candidate takes precedence for final technical evidence over older overlapping implementation branches.

## G1 close definition

`G1_ACQUISITION_CLEAN` may only become **DONE** when every non-reference item in the machine register is DONE and the following are true:

- entity/ownership structure is finalized sufficiently for the intended transaction path;
- founder/pre-company IP and relevant assets have a documented, executed rights path to the transaction entity;
- contributor/third-party/OSS/AI dependencies are inventoried and any material exceptions are resolved or explicitly carved out;
- source/data rights required for launch and transfer are cleared, replaced or visibly excluded;
- privacy/retention/processor/transfer controls required for the actual processing state are completed and qualified review is attached where required;
- trademark/brand risk is cleared or a transaction-acceptable fallback architecture is documented;
- company control/recovery of material repositories, domains, infrastructure and vendor accounts is evidenced;
- buyer-facing technical/platform claims point to exact-head evidence;
- the final data-room snapshot represents the state actually being sold, not only unmerged candidates.

## Merge hygiene

Parallel diligence branches are useful for isolation, but they create integration risk. Final close therefore follows these rules:

1. **One canonical merge/evidence source per gate.** Older or umbrella branches may remain reference evidence but are not merged blindly.
2. **Reconcile overlap before merge.** If two PRs touch the same runtime, migration, policy or DD artifact, compare them against current `main` and explicitly choose the survivor.
3. **Prefer clean rebuilds on current main** when historical branches have material divergence.
4. **Re-run evidence after material dependency/runtime changes.** A previous green SBOM, browser suite or security audit does not automatically transfer to a new head.
5. **Archive acquired-state evidence.** Final SBOMs, workflow references, rights registers, contract hashes and control inventories must correspond to the final state.
6. **No hidden exceptions.** RED/OPEN/BLOCKED items are either closed or recorded as explicit transaction carve-outs/conditions.

## Relationship to F0-M and contact freeze

This master is a readiness/control artifact. It does not itself authorize:

- company formation or asset transfer;
- Production/Supabase deployment;
- privacy/legal activation;
- business, partner or investor outreach;
- data commercialization;
- trademark filing;
- tax/residency actions.

Those remain under their own gates.

## Platform-transfer relationship

PR #115 adds a versioned Platform Core, Buyer-DD claims discipline and technical transfer/founder-independence process. That improves acquisition readiness, but G1 does not treat "a handoff process exists" as equivalent to "the business already operates without the founder."

Technical transferability can be evidenced before full operational independence. The latter requires the defined non-founder handoff drill plus later real operating proof.

## Data-room assembly order

Recommended buyer folder/order:

1. **00 Master Gate Register** — this file + JSON register.
2. **01 Corporate & Chain of Title** — RT-003/004 final evidence.
3. **02 Digital Asset Control** — RT-005 account/recovery/domain/control evidence.
4. **03 Technical DD / SBOM / Supply Chain** — canonical RT-006 candidate and acquired-state exports.
5. **04 Data & Source Rights** — RT-007 + Works rights evidence.
6. **05 Privacy / Terms / DPA** — RT-008 and final legal/operating evidence.
7. **06 Brand / Trademark** — RT-009 evidence.
8. **07 Platform Architecture & Transferability** — Platform Core, Buyer-DD, handoff and vertical adoption evidence.
9. **08 Exceptions / Closing Conditions** — only remaining explicit carve-outs and dated owners/actions.

## What this improves for a buyer

A buyer should not need to infer which of a dozen branches is authoritative. The target end state is a diligence trail where each material question has:

- one gate ID;
- one canonical evidence path;
- one status;
- explicit close criteria;
- exact-head or executed-state proof;
- visible exceptions.

That is materially more transferable than a collection of technically good but uncoordinated PRs.
