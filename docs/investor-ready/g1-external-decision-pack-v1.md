# HOY G1 External Decision Pack v1.0

Snapshot: 2026-08-19  
Base: `main` `88bb9e77d50ccb9db96306f5e737e27bad6237ab`

## Purpose

This pack translates the remaining **EXTERNAL_REQUIRED** G1 controls into a small set of professional decisions. It is not legal, tax or trademark advice and it does not ask an adviser to review the entire repository.

The intended output from each adviser is a **written decision memo** with:

1. selected option / conclusion;
2. assumptions and facts relied upon;
3. actions that must occur before the selected structure is safe to execute;
4. actions that must not occur before those prerequisites;
5. exact documents/signatures/registrations required;
6. unresolved residual risks or buyer carve-outs;
7. whether the decision is safe for the intended HOY acquisition/exit context.

## Privacy boundary for adviser inputs

Do **not** commit private founder tax, identity, home-address, bank, health or personal residency evidence to this public repository.

Use a separate private counsel folder/data room for personal facts. This public pack only records the question set, public/project evidence references and the expected decision outputs.

---

# Decision Stream A — Entity, Founder Tax and IP Chain of Title

## Current project evidence

Relevant internal evidence:

- PR #104 — corporate structure working model + full-history contributor census.
- PR #123 — Founder-IP execution-draft harvest and exact historical evidence blobs.
- PR #119 — company-controlled account/recovery controls remain open.
- G1 Closing Board — Founder→Company rights execution and entity/tax decision are external gates.

The repository evidence supports the technical contributor story, but **does not execute or tax-clear a Founder→Company transfer**.

## Private facts to provide separately

Private counsel intake should contain only what the adviser actually needs, for example:

- founder tax residency / tax-liability facts and contemplated future residency changes;
- current ownership of the pre-company project assets;
- contemplated company formation timing;
- any cash/non-cash consideration contemplated for IP/assets;
- founder shareholding/capitalization assumptions;
- relevant historical acquisition/contribution costs and supporting records.

These facts are deliberately not duplicated in this repository.

## Decisions required

### A1 — Parent/entity architecture

Adviser should decide and document:

- recommended initial HOY parent/entity form and jurisdiction for the stated financing/exit plan;
- whether an interim/fallback entity structure is acceptable and under what constraints;
- which assets/contracts/accounts should sit at parent level versus an operating entity;
- whether a later Spain operating entity is needed and what objective trigger should cause it;
- formation timing relative to pre-sales, contracts, IP transfer and external financing.

### A2 — Founder/pre-company asset and IP transfer mechanism

For each material asset class, adviser should specify the preferred mechanism and execution sequence:

- source code and software rights;
- database schemas/data models and internal documentation;
- trademarks/logos/brand assets to the extent owned/transferable;
- domains and digital accounts;
- business processes/playbooks;
- founder-created documents and other copyrightable materials;
- any AI-assisted assets where ownership/exclusivity needs separate treatment.

The memo should distinguish **assignment, licence, contribution or sale** where those alternatives materially change legal/tax/accounting treatment. The pack does not preselect one mechanism.

### A3 — Founder tax / residency gate

Tax adviser should provide a written go/no-go sequence for:

- company formation;
- Founder→Company IP/asset transfer;
- capitalization/share ownership steps;
- any later contemplated change in personal tax residency or restriction of German taxing rights;
- documentation needed to preserve a defensible tax basis/acquisition-cost record for founder shares.

No personal residency change or IP transfer is authorized by this pack.

### A4 — Chain-of-Title closing deliverables

Required output checklist:

- final founder/pre-company rights instrument;
- final asset schedule with included/excluded assets;
- representations about third-party/AI/data/media boundaries;
- signing authority/entity details;
- tax/accounting treatment note;
- effective date and consideration mechanics where relevant;
- private executed evidence to archive in the buyer data room;
- explicit statement of what remains outside company ownership after execution.

## Acceptance criterion for Stream A

Stream A closes only when the written adviser decision is received, the selected documents are finalized, and the actual execution evidence is archived privately. A draft or Git commit is not execution.

---

# Decision Stream B — Privacy, Business Terms and Data-Rights Contracting

## Current project evidence

Relevant internal evidence:

- current main includes merged PR #128 analytics-storage/transport fail-closed runtime;
- PR #127 — broader privacy/consent/DSAR/retention candidate;
- PR #122 — dormant Business Terms/acceptance/Business Confirmation infrastructure;
- PR #106 — Buyer-Safe source-rights segregation and prepared first-party provenance replacements;
- Works PR #2 — Works source-rights governance + privacy pre-live technical blocks.

Technical controls are not a substitute for a legal basis, notice, retention decision or contract-rights analysis.

## Decisions required

### B1 — Controller and notice facts

Counsel should approve the final controller/entity facts required in notices and Terms, including:

- legal controller identity;
- service/contact address;
- privacy/rights contact channel;
- intended products/regions covered by the initial notice;
- versioning/activation rule when entity or processing scope changes.

### B2 — Processing-purpose / legal-basis matrix

For each relevant flow, counsel should decide the legal basis and required UX/notices, including at minimum:

- essential application/session/security processing;
- optional analytics/product measurement;
- business onboarding/claim/account administration;
- researched business contact data and any later B2B outreach;
- Business Confirmation and operator-provided data;
- Works profiles/work requests/free text/location/photos if/when launched;
- support, abuse/security, audit and legal-record processing.

The memo should expressly identify flows that must remain disabled until a prerequisite is met.

### B3 — Analytics consent and retention

Counsel should decide:

- whether/where explicit consent is required for the intended analytics implementation;
- final consent/withdrawal wording and first-layer requirements;
- retention period or defensible retention criteria;
- whether historical pseudonymous analytics may be retained, aggregated, deleted or separately restricted;
- what evidence is required before analytics can move from fail-closed to production-enabled.

The current technical default remains OFF until separately released.

### B4 — Indirect B2B contact / transparency / suppression

Counsel should decide the initial policy for researched business contacts, including:

- transparency timing and content where required;
- objection/suppression handling;
- retention/expiry of named contact details;
- channel-specific rules for intended outreach regions;
- whether any outreach segment should remain prohibited until direct first-party confirmation.

This pack does not authorize contact.

### B5 — DSAR / deletion / redaction / tombstone policy

Counsel should approve how each relationship is handled on a valid deletion/erasure request, especially where business/audit/security relationships mean hard deletion may not be appropriate.

Required decision output:

- delete vs redact vs tombstone rule by data class;
- retention exceptions and evidence;
- authentication/verification requirement for requests;
- response logging requirements;
- synthetic E2E test acceptance criteria.

### B6 — Processor / subprocessor / recipient / transfer position

Counsel should approve the processor/recipient register and identify any missing contractual or transfer safeguards before launch/exit DD. The decision should be vendor-specific rather than a generic statement that all cloud processing is cleared.

### B7 — Business Terms / first-party data rights

Counsel should finalize the rights HOY receives when a business accepts the Terms or confirms data. The decision should state, in plain operational language, what HOY may and may not:

- store;
- display;
- normalize/structure;
- derive aggregate/non-personal signals from;
- use for product/analytics purposes;
- sublicense or transfer as part of a company/business acquisition;
- continue using after account termination, if any limited survival is intended and lawful.

The Terms should not silently convert third-party source material into HOY-owned IP.

### B8 — Works DPIA screen / launch gate

Before Works processes real personal-data-heavy requests/photos/location data, counsel should approve the DPIA screening outcome and identify whether a full DPIA or additional controls are required.

## Acceptance criterion for Stream B

Stream B closes only with approved final text/decision records, final controller facts, operational DSAR/retention decisions and defined Production-release conditions. Technical QA alone is insufficient.

---

# Decision Stream C — Trademark / Brand / Exit-Safe Naming

## Current project evidence

Relevant evidence: PR #108 RT-009 brand architecture and official-search protocol.

No live registry clearance or counsel opinion is treated as completed merely because a search protocol exists.

## Decisions required

### C1 — HOY word/composite mark clearance

Trademark counsel should run and archive official registry searches for the intended territories and assess:

- registrability/distinctiveness risk of the intended HOY signs;
- conflicting earlier rights;
- differences between the word mark, logo/composite marks and slogans;
- the exact goods/services wording actually justified by the product;
- any material limitation or disclaimer strategy.

### C2 — House/master mark fallback

Counsel should separately assess the proposed invented house/master-mark strategy as an exit/parent-brand safety net. The house mark must receive its own clearance rather than borrowing conclusions from HOY searches.

### C3 — Filing/usage sequence

Required memo output:

- which marks, if any, should be filed;
- territories/classes/goods-services scope;
- filing order and prerequisites;
- whether continued HOY consumer use creates material risk before filing;
- what evidence should be kept for use/provenance;
- what contingencies/rebrand triggers should be documented for Buyer DD.

This pack authorizes no filing, coexistence request or rights-holder contact.

## Acceptance criterion for Stream C

Stream C closes only when official registry evidence and qualified analysis are archived and the chosen brand path is reflected consistently in corporate/IP/domain and buyer-DD documents.

---

# Decision Stream D — Independent Non-Founder Handoff

This is not a legal-adviser decision but remains an **EXTERNAL_REQUIRED** G1 control because the founder cannot prove founder independence by self-testing.

## Required independent tester

A different person should execute the defined Platform Transfer / Handoff acceptance test without step-by-step founder intervention.

The evidence pack should record:

- tester identity/role (private details may be kept outside public repo);
- starting information provided;
- tasks completed/failed;
- questions/blockers encountered;
- time-independent qualitative result (do not optimize for speed as the primary metric);
- defects/runbook gaps discovered;
- remediation and re-test outcome.

A successful technical handoff does not prove commercial/operational independence by itself; it proves only the scoped handoff control.

---

# Adviser Output Template

For each numbered decision, request the following compact structure:

**Decision ID:**  
**Decision:**  
**Facts/assumptions relied upon:**  
**Required preconditions:**  
**Do-not-do-before-preconditions:**  
**Execution steps/documents:**  
**Buyer-DD evidence produced:**  
**Residual risks/carve-outs:**  
**Re-review trigger:**  

# Non-authorization

This pack does not authorize Production DDL/DML, analytics activation, Terms activation, IP/company/account/domain transfer, tax-residency changes, trademark filings, paid infrastructure or business/partner/investor outreach.
