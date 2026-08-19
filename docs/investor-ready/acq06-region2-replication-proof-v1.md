# ACQ-06 — Region-2 Replication Proof v1.0

Status: **DESIGN_READY_NOT_PROVEN**  
Snapshot date: **2026-08-19**

## Purpose

ACQ-06 pre-registers the test that HOY must later pass before anyone may describe the business as regionally repeatable, efficiently scalable or buyer-grade across regions.

This is deliberately stricter than a launch checklist. A second region does not prove replication if HOY only gets there by forking the product, lowering data quality, relaxing rights discipline, weakening privacy/security controls or relying on untracked founder effort.

## Region 1 — corrected canonical scope

Region 1 is the **defined Mar Menor operating region**, not only La Manga del Mar Menor + Cabo de Palos.

The frozen T0 footprint consists of nine area buckets:

- Cabo de Palos — 21 published / 23 total
- La Manga Club / Atamaría — 19 / 19
- La Manga del Mar Menor — 41 / 42
- Los Alcázares / Los Narejos — 34 / 34
- Los Belones — 5 / 5
- Los Urrutias / Estrella de Mar / Los Nietos — 6 / 6
- Mar de Cristal / Islas Menores — 6 / 6
- San Pedro del Pinatar / Lo Pagán — 17 / 17
- Santiago de la Ribera / San Javier — 17 / 17

**T0 total: 169 businesses, 166 published.**

This T0 is historical evidence. Later additions/removals must be reported as drift; they must not silently rewrite the baseline.

## Region-1 quality snapshot

Read-only Production observations on 2026-08-19:

- 140/166 published businesses have phone data.
- 54/166 have a website.
- 166/166 have coordinates.
- 70/166 have `location_status=verified`.
- 25/166 have structured weekly hours; 22 are `hours_status=verified`.
- 35/166 currently have `profile_quality=premium`.
- 68 published businesses have at least one menu source; 52 have an official source; 28 have a source currently classified sufficient/complete.
- 166/166 have an accessibility row and 166/166 have at least one current structured accessibility fact; 668 current accessibility facts exist in total.

The snapshot is intentionally not presented as 100% quality completion. It is the truthful Region-1 starting point against which Region-2 process quality can be evaluated.

## Region-1 merchant/commercial proof snapshot

At T0:

- verified restaurant memberships: **0 businesses**;
- operator-verified entitlements: **0**;
- live-hours confirmation rows: **0**;
- confirmed-services rows: **0**;
- active rights-backed business-data confirmations: **0**;
- sales pipeline rows for published businesses: **166**;
- rows with at least one direct contact field: **55**;
- effectively send-locked: **166/166**;
- send-authorized: **0**.

This matters because Region-2 must not inherit a fictional Region-1 merchant-proof baseline. ACQ-05 can make first-party confirmation measurable going forward; T0 simply records what exists today.

## Unknown historical efficiency stays unknown

We do **not** currently possess a reliable accounting of:

- founder hours used to reach the Region-1 state;
- local-operator hours;
- cash spend attributable to Region-1 buildout;
- comparable calendar milestones from a clean start.

These values are marked `UNKNOWN_RECONSTRUCT_REQUIRED`.

No statement such as “Region 2 was 60% faster” or “half as expensive” may be made unless Region-1 evidence is reconstructed on a genuinely comparable basis. If it cannot be reconstructed, the comparison remains unknown.

## Region-2 candidate

Internal candidate: **Bernkastel-Kues / Mittelmosel**.

Status: `PRESELECTED_INTERNAL_BOUNDARY_NOT_FROZEN`.

The exact geographic boundary and launch cohort must be frozen before first ingest. ACQ-06 itself authorizes neither ingest nor outreach.

## Proof ladder

### R2-0 — Pre-registered design

Already satisfied by this contract:

- Region-1 T0 is frozen before Region-2 execution;
- claim rules are defined in advance;
- quality-ratchet rules are defined in advance.

### R2-1 — Region boundary freeze

Required before any Region-2 data ingest:

- exact geographic boundary;
- exact launch-cohort definition;
- measurement clock start;
- owner/operator responsibility model.

### R2-2 — Technical portability

HOY may be called technically portable only when:

- Region 2 runs on the same deployable core;
- there are **zero region-specific core forks**;
- there are **zero region-specific database-schema forks**;
- auth/privacy/security/public-runtime contracts remain unchanged or stronger;
- regional differences are represented through data/configuration or reusable adapters rather than bespoke product forks.

### R2-3 — Supply replication cohort

Internal proof threshold, **not a market standard**:

- at least 50 published businesses in the frozen cohort;
- 100% of that published cohort has coordinates;
- 100% of direct provenance references are registered before buyer-facing publication;
- no data-quality or QA gate is weakened to reach the threshold.

The point is not that “50” is magic. It is a pre-registered cohort large enough that the team cannot cherry-pick a handful of easy venues after seeing the result.

### R2-4 — First-party merchant replication

Internal proof threshold:

- at least 10 distinct businesses reach verified operator membership or factual operator confirmation;
- F1 factual confirmation remains separate from rights clearance;
- R1 rights-backed receipts count only if active accepted Business Terms truly exist.

### R2-5 — Economic replication

Internal proof threshold:

- at least 3 distinct external businesses have **reconciled settled recurring payments** under ACQ-03 rules;
- at least 1 independent renewal is observed;
- one-off HOY Highlight revenue is excluded from recurring MRR.

Interest, LOIs, invoices and unpaid acceptances do not satisfy this stage.

### R2-6 — Efficiency measurement

From the R2-1 start clock, capture:

- calendar days to 25 and 50 published businesses;
- founder hours;
- local-operator hours;
- cash spend;
- founder/local-operator hours per published business;
- cash cost per published business;
- days to first F1 confirmation;
- days to first settled recurring payment;
- days to first renewal;
- number of region-specific core/schema forks.

Region-2 measurement must be prospective, not reconstructed after the outcome is known.

### R2-7 — Buyer-grade repeatability

This may only be claimed when:

- R2-2 through R2-6 are evidenced;
- the quality ratchet shows no regression;
- founder-independent handoff evidence exists;
- no success claim depends on hidden/unmeasured founder effort;
- any “faster/cheaper” statement uses comparable Region-1 evidence.

## Quality ratchet

A Region-2 launch does **not** count as replication success if it requires any of the following:

- region-specific core fork;
- region-specific DB-schema fork;
- weaker privacy/consent/security/public-runtime controls;
- unregistered or unclassified direct source references;
- weaker accessibility truth-state/verification rules;
- calling user intent a confirmed merchant outcome;
- calling invoices/interest a paying customer;
- reaching speed targets by omitting evidence, QA or rights work.

Region 2 should ideally be cleaner than Region 1 because it begins with the lessons already learned.

## Claim language

Allowed only after evidence:

- `PORTABLE` — after R2-2.
- `REPLICATED` — after R2-3, R2-4 and R2-5 with the quality ratchet intact.
- `EFFICIENTLY_REPLICATED` — only after comparable effort/cost evidence shows lower Region-2 effort without quality regression.
- `BUYER_GRADE_REPEATABILITY` — only after R2-7.

Until then the only valid top-level status is:

> **DESIGN_READY_NOT_PROVEN**

## Platform boundary

Gastro is the **first measurable proof vertical**, because that is where Region-1 operational evidence exists today. It is not the definition of HOY.

The replication architecture must remain compatible with the whole HOY platform and its other verticals. A Region-2 proof that requires Gastro-specific hardcoding into the platform core is a failure, not a success.

## Safety / execution boundary

ACQ-06 authorizes none of the following:

- business outreach;
- investor/buyer outreach;
- lifting the Contact Freeze;
- Region-2 Production ingest;
- Production DDL/DML;
- Terms activation;
- Analytics activation;
- a claim that HOY is already regionally scalable;
- a merge of this PR.

## Immediate next actions

1. Reconstruct Region-1 historical effort only from auditable evidence; leave unknown where evidence is insufficient.
2. Freeze the exact Region-2 geography and launch cohort before first ingest.
3. Start prospective time/cost/operator instrumentation at the first Region-2 execution step.
4. Reuse ACQ-03 paid-proof, ACQ-04 merchant-outcome and ACQ-05 first-party confirmation semantics unchanged.
