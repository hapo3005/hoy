# HOY Intelligence 2.45 — Privacy-first data moat foundation

## Goal

HOY should become better at answering two questions over time:

1. What do guests want right now, in which context, and where does supply fail to satisfy that demand?
2. Which aggregated market signals can create legitimate B2B value without turning HOY into a business that sells identifiable users?

This release only creates the foundation. It does **not** add runtime tracking, database writes, migrations, production exports, or data sales.

## Strategic position

HOY Intelligence is a future fourth revenue pillar alongside operator subscriptions, promotions/advertising, and transaction/lead revenue. The moat is not possession of raw personal data. The moat is a hard-to-recreate longitudinal dataset of local demand, verified supply, freshness, conversion intent, and context across replicated regions.

The preferred commercial product is therefore aggregated intelligence, not user-level data brokerage.

## Measurement model

Future measurement should preserve the context that makes an interaction useful while minimizing personal data. A useful demand signal may include:

- coarse local time bucket;
- coarse area bucket instead of precise user coordinates;
- cuisine or venue category;
- price band;
- family/playground need;
- terrace, delivery, live-music, or open-now intent;
- discovery mode (NOW, nearby, search, filter, surprise-me);
- venue considered and high-intent action taken.

The canonical taxonomy and prohibited fields live in `data/hoy-intelligence-event-contract-2026-08-18.json`.

## Existing analytics compatibility

HOY already contains an analytics RPC layer that creates pseudonymous anonymous/session IDs and strips common personal-data metadata keys before RPC logging. That is useful operational infrastructure, but pseudonymous identifiers are **not** treated as anonymous intelligence exports. Future external products must never expose those IDs or row-level journeys.

## Data Governance Gate 2.45.1

Before any new or materially expanded production Intelligence collection is activated, every event family and later every concrete event must have an approved inventory record in `data/hoy-intelligence-data-governance-2026-08-18.json`.

Each inventory record must document at least:

- event and event family;
- business and product purpose;
- data-subject context and personal-data status;
- exact dimensions;
- lawful-basis and consent-requirement status;
- transparency surface;
- retention class and deletion trigger;
- allowed internal uses and external-use class;
- minimum aggregation threshold;
- sparse-slice suppression;
- re-identification, security and legal review status;
- explicit production-collection and commercialization flags.

A commercially useful signal is never treated as a legal basis by itself. New or materially changed personal-data processing defaults to `pending_legal_review`. Pseudonymous event-level data is treated as personal until a validated anonymization process establishes otherwise.

HOY does not pre-select one legal basis for all analytics. The applicable basis depends on context and must be validated before activation. If legitimate interests is considered, the governance contract requires necessity, balancing and reasonable-expectations review. If consent is required, collection may not activate before a valid signal and a withdrawal path exists. Special-category personal data is prohibited from Intelligence event payloads.

## Retention and deletion

No generic long retention period is approved by 2.45.1. Each event must receive a purpose-specific retention class, deletion trigger and review interval before activation.

The future implementation must define the shortest justified event-level retention period, an automatic deletion or irreversible aggregation path, backup deletion treatment, periodic review and documented exception handling. Until those controls are approved and implemented, runtime collection expansion remains disabled.

## Product ladder

### Stage 0 — Measurement readiness

Define taxonomy, privacy invariants, data-quality expectations, event-level governance and future aggregation gates. No new collection simply because a field might be monetizable later.

### Stage 1 — Internal product analytics

Use lawful, minimized telemetry to improve HOY itself: search success, discovery quality, supply freshness, family-use-case gaps, and operator value creation.

### Stage 2 — Operator Insights

Show a venue its own performance plus privacy-safe local benchmarks where cohorts are sufficiently large. Example: relative demand by time band, category, or family intent.

### Stage 3 — Area / Tourism / Commercial Intelligence

Sell aggregated reports and dashboards about demand gaps, seasonality, category mix, verified supply, and local market movement. Outputs must suppress sparse slices and must not enable reconstruction of individual journeys.

### Stage 4 — Intelligence API

Only after legal, privacy, security, aggregation, retention, data-lineage and anti-re-identification controls are mature. API customers receive aggregate market signals, never raw user telemetry.

## Non-negotiable privacy rules

- No raw email, phone, personal name, private message, free-text note, payment data, special-category data, device fingerprint, or advertising identifier in HOY Intelligence.
- No precise user GPS history in Intelligence products.
- No customer-facing anonymous IDs or session IDs.
- No sale or export of row-level user journeys.
- Pseudonymized data remains inside the protected operational analytics boundary until a validated anonymization/aggregation process produces an external-safe result.
- Sparse cohorts are suppressed.
- Re-identification attempts must be contractually prohibited for B2B customers.
- New collection requires a concrete product purpose; "might be valuable someday" is not sufficient.

## Commercialization gate

Commercialization remains disabled until all required controls are approved and implemented, including:

- complete event inventory and source-to-metric data lineage;
- validated lawful basis and transparency implementation;
- consent or preference controls where required;
- implemented retention and deletion;
- a numerical minimum cohort threshold;
- sparse-slice and differencing-attack suppression;
- removal of pseudonymous identifiers from customer-facing data;
- no row-level user journey export;
- contractual prohibition of re-identification;
- security and legal approval.

Any missing, pending or failed requirement keeps `commercialization_allowed=false`.

## Exit-value logic

The defensible asset is the combination of:

- repeated demand signals across time and regions;
- verified supply and provenance;
- structured context around guest decisions;
- operator performance and freshness signals;
- proven ability to turn those signals into recurring B2B revenue;
- privacy, legal-basis, retention and data-rights documentation a buyer can diligence.

This means product decisions should ask two questions, in this order:

1. Does this create real value for the guest or operator?
2. If measured, can the resulting signal become a lawful, privacy-safe, durable aggregate asset?

A feature must never exist only to harvest data.

## Expansion rule

The dataset becomes strategically stronger when the same taxonomy works across multiple regions. New regions should reuse stable event definitions and area/time bucketing so that demand and supply patterns can be compared without leaking precise individual behavior.

## 2.45 / 2.45.1 release boundary

Allowed now:

- contract and taxonomy;
- event-level governance inventory;
- privacy and commercialization gates;
- tests that prevent accidental weakening;
- documentation of the staged product ladder.

Not allowed now:

- new runtime event capture;
- Supabase migrations or production writes;
- new cookies/identifiers;
- external data sharing;
- data-sale enablement;
- HOY Intelligence API exposure.

The next runtime implementation may only proceed after the corresponding inventory entries have passed the required legal, privacy, retention and security gates.
