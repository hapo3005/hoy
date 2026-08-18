# HOY Investor Ready — Platform Architecture & Defensibility

Status: Buyer-DD working document  
Date: 2026-08-19  
Scope: HOY Platform Core + Gastro + Lifestyle + Works  
Claim discipline: evidence-backed; no valuation uplift is stated as a guaranteed cash amount.

## 1. Buyer thesis

HOY is being structured as a multi-vertical local-intent platform rather than a collection of unrelated apps. Gastro, Lifestyle and Works keep vertical-specific UX, scoring weights and workflows, while cross-vertical product invariants are centralized in HOY Platform Core v1.0 (`HOY-PC-1.0`).

For a buyer, the architectural value is not simply code reuse. The value is lower integration risk, lower semantic drift, lower maintenance duplication, clearer governance, faster onboarding of future verticals and a more transferable operating asset.

The central buyer claim is therefore:

> HOY has one governed platform contract for truth, verification, freshness, requirement matching, safety and commercial integrity, with vertical adapters that may add domain rules but may not weaken the platform invariants.

## 2. What is centralized

The canonical Platform Core owns:

- fact states: `yes`, `no`, `partial`, `unknown`, `not_applicable`, `temporarily_unavailable`;
- confirmed verification levels: `hoy_verified`, `business_confirmed`, `community_confirmed`;
- MUST / PREFER / IGNORE requirement semantics;
- MATCH / NO_MATCH / NEEDS_CONFIRMATION outcomes;
- numeric `equals`, `gte` and `lte` comparisons;
- fail-closed treatment of missing, stale, disputed and externally unverified evidence;
- research freshness defaults, including a 180-day default maximum age and required timestamp;
- provider-controlled live availability confirmation and expiry;
- safety as a hard gate;
- sponsorship eligibility and disclosure;
- the rule that commercial placement cannot change organic score or rank.

The machine-readable source of this contract is `platform-core/consumer-contract.json`.

## 3. What remains vertical-specific

The architecture deliberately does not force all verticals into one product implementation.

### Gastro

Gastro remains the reference experience and keeps its existing restaurant, menu, family, operator and accessibility presentation layers. `platform-core/gastro-adapter-v1.js` translates Gastro domain data into the canonical fact contract for cross-vertical decisions.

### Lifestyle

Lifestyle keeps its activity-specific discovery modes, contextual scoring and operator UX. Its requirement and commercial-integrity modules are thin consumers of Platform Core instead of independent truth implementations.

### Works

Works keeps service-category, locality, language, urgency and availability weighting. Its parity engine is a vertical adapter; confirmation, freshness, requirement semantics, safety and sponsorship are delegated to Platform Core.

This separation is intentional: common invariants are centralized; differentiated product behavior stays in the vertical.

## 4. Why this matters to a strategic buyer

### 4.1 Lower technical integration risk

A buyer does not need to reconcile three different definitions of "confirmed", "stale", "MUST" or "sponsored" before operating the platform. Central invariants have a single versioned owner.

### 4.2 Lower maintenance duplication

A future correction to a platform-level truth rule can be made once and distributed to verticals through a pinned runtime contract instead of maintained as three independent implementations.

### 4.3 Faster extension into new verticals

A new HOY vertical can adopt the shared contract and implement only its own adapter, domain data and scoring. This does not prove that every future vertical will be cheap to launch; it does reduce the amount of platform-level logic that must be reinvented.

### 4.4 Lower founder/key-person dependency

The core rules are explicit in code, machine-readable contracts, adoption manifests and QA rather than existing only as founder knowledge. This improves transferability. It does not by itself make operations fully founder-independent; operating proof and delegation remain separate gates.

### 4.5 Better due-diligence readability

A buyer can trace a platform claim to a defined artifact, test or repository instead of relying on presentation language. This reduces ambiguity in technical DD and makes exceptions visible.

## 5. Defensibility: what HOY can and cannot claim

Platform architecture is an execution advantage and risk reducer. It is not, by itself, a durable market moat.

### Evidence-backed defensibility today

- a versioned cross-vertical decision contract;
- a common runtime used by three verticals;
- immutable vendor copies in Lifestyle and Works pinned to the same Git blob as the central source;
- machine-readable adoption and consumer contracts;
- fail-closed product-truth semantics;
- explicit separation between organic ranking and commercial placement;
- established QA paths in Gastro and Lifestyle;
- privacy-first data/intelligence architecture that explicitly rejects identifiable-user data brokerage.

### Defensibility that still requires external proof

- recurring B2B revenue and retention;
- demonstrated consumer usage and repeat behavior;
- demonstrated operator adoption and data confirmation;
- successful replication into additional regions;
- evidence that shared platform architecture materially reduces expansion cost/time;
- lawful, sufficiently aggregated intelligence products with paying customers;
- brand/IP rights strong enough for the intended transaction structure.

A CIM or buyer presentation must not collapse these two categories into one claim.

## 6. Platform-to-data flywheel

The Platform Core is strategically relevant to HOY Intelligence because a reusable taxonomy makes demand and supply signals more comparable across verticals and regions.

The intended value chain is:

1. users express local intent;
2. HOY matches intent against structured and freshness-aware supply;
3. operators confirm or update supply facts;
4. product outcomes create privacy-governed aggregate signals;
5. those signals improve matching, operator value and potentially future B2B intelligence products;
6. the same taxonomy can be reused across regions, improving comparability.

This is a target flywheel, not yet a claim of proven data-network effects. `docs/HOY_INTELLIGENCE_STRATEGY_2_45.md` keeps commercialization disabled until legal, privacy, retention, aggregation and anti-re-identification gates are satisfied.

## 7. Evidence of shared implementation

At the Platform Core implementation snapshot, the central runtime and the vendored Lifestyle/Works runtime copies share the same Git blob:

`c1740b652bc22af2beb868dc8c36049411692474`

This is stronger evidence than a statement that the implementations are "similar": the runtime content is identical at the Git-blob level.

The repositories use different delivery modes:

- Gastro: source + adapter;
- Lifestyle: locked vendor runtime + thin adapters;
- Works: locked vendor runtime + thin adapter.

The adopted modes are documented in `platform-core/adoption.json`.

## 8. QA and release evidence

### Gastro / Platform Core candidate

PR #115 contains Platform Core v1.0 adoption. On its pre-DD-documentation implementation head, Critical PR QA and Final Release static QA completed successfully. Full PR Browser QA was still running at the status snapshot used for this document; therefore the document does not claim that full Gastro browser QA was complete at that point.

### Lifestyle

Lifestyle PR #1 passed its critical contracts/unit workflow and its browser workflow after Platform Core adoption, including Mobile WebKit plus Mobile and Desktop Chromium.

### Works

Works PR #3 is mergeable and contains static/unit/browser scripts, but it has no executable PR GitHub Actions workflow on the adapter head because creation of a new workflow was blocked by the connector security boundary. Accordingly, Works is not represented as fully CI/browser-certified on the Platform Core adapter head.

This asymmetry is a known DD item, not hidden technical debt.

## 9. Buyer integration model

A buyer can choose among three operating models without changing the business contract:

### Model A — retain current repositories

Keep Gastro, Lifestyle and Works separately releasable, with Platform Core versioned centrally and vendor locks in the consumer repos.

### Model B — monorepo consolidation later

Move all verticals into one repository while preserving Platform Core and adapter boundaries. The current design does not require this migration for correctness.

### Model C — platform-service evolution later

If scale justifies it, selected platform capabilities can become server-side shared services. The current v1 core deliberately stays dependency-light and deployable inside each vertical, avoiding a new network/runtime dependency merely for architectural purity.

No one of these future models is asserted as mandatory.

## 10. Technical DD questions and prepared answers

**Is HOY one codebase?**  
No. HOY is a platform family with multiple repositories and a shared governed core. This is a deliberate modular architecture, not a claim of a monolith.

**Can one vertical weaken safety/truth rules?**  
The intended contract says no: adapters may be stricter but may not weaken Platform Core. Static/contract tests are used to detect local reimplementation or drift where implemented.

**Does sponsorship influence recommendations?**  
Platform Core explicitly separates sponsorship from organic score/rank. Sponsored eligibility can decorate an organic result but may not buy a higher organic score.

**Does unknown data become positive data?**  
No. Missing, unknown, stale, disputed or externally unverified evidence is fail-closed to confirmation-needed semantics.

**Is the architecture a moat?**  
Not alone. It is a defensibility and execution layer. Stronger market defensibility still depends on distribution, recurring revenue, verified supply, user demand, data quality, regional replication and lawful intelligence products.

**Is the platform production-complete?**  
No. Production, legal, privacy, source-rights, owner-live and market-proof gates remain independent and are explicitly tracked outside this architecture claim.

## 11. Valuation relevance

Platform Core should be treated as a quality/risk-adjustment factor, not as a standalone valuation formula.

A buyer may rationally assign more value to the same level of revenue and traction when:

- integration risk is lower;
- central invariants are documented and tested;
- new verticals do not require rebuilding platform logic;
- operating knowledge is transferred into contracts and runbooks;
- commercial-ranking integrity and truth semantics are auditable;
- technical DD exceptions are visible and bounded.

However, HOY should not present a fixed euro uplift attributable only to Platform Core. The strongest valuation effect should emerge when this architecture is combined with external proof: paying operators, recurring revenue, consumer usage, retention, region replication and rights-cleared data/intelligence monetization.

## 12. DD boundary

This document is suitable for technical/investor readiness because it separates:

- **PROVEN** — supported by repository artifacts, hashes or completed QA;
- **PARTIAL** — architecture exists but a release/CI/operating proof is incomplete;
- **OPEN** — requires external market, legal, rights, production or operating evidence.

The authoritative item-by-item mapping is `docs/investor-ready/platform-evidence-index.md` and `docs/investor-ready/platform-claims-register.json`.
