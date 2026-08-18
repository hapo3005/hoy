# HOY Buyer DD — Platform Evidence Index

Status: working data-room index  
Date: 2026-08-19  
Scope: technical platform architecture, cross-vertical adoption and related defensibility claims.

## Evidence status legend

- **PROVEN** — supported by repository artifact, immutable hash, completed automated QA, or directly inspectable implementation.
- **PARTIAL** — core implementation exists, but one or more release/CI/operating proofs remain incomplete.
- **OPEN** — cannot be proven by the current codebase alone; requires market, legal, production, rights or operating evidence.

## A. Platform Core

| ID | Claim | Status | Primary evidence | DD note |
|---|---|---:|---|---|
| PC-01 | HOY has a versioned cross-vertical platform contract | PROVEN | `platform-core/hoy-platform-core-v1.js`, `platform-core/consumer-contract.json` | Core 1.0.0 / HOY-PC-1.0 |
| PC-02 | Truth and verification are separate concepts | PROVEN | `platform-core/consumer-contract.json`, Platform Core tests | Explicit fact and verification contracts |
| PC-03 | Missing/unknown/stale/disputed/external evidence cannot become confirmed truth | PROVEN | Platform Core runtime/tests | Fail-closed invariant |
| PC-04 | Confirmed failed MUST cannot be rescued by PREFER | PROVEN | Platform Core runtime/tests | Cross-vertical invariant |
| PC-05 | Safety is a hard gate | PROVEN | `platform-core/consumer-contract.json`, Platform Core runtime/tests | Vertical adapters may add stricter gates |
| PC-06 | Sponsorship cannot change organic score or rank | PROVEN | Platform Core runtime/tests | Commercial integrity invariant |
| PC-07 | Research freshness defaults to 180 days and requires a timestamp | PROVEN | `platform-core/consumer-contract.json`, Platform Core runtime/tests | Default can only be changed through governed contract/versioning |

## B. Cross-vertical adoption

| ID | Claim | Status | Primary evidence | DD note |
|---|---|---:|---|---|
| AD-01 | Gastro consumes Platform Core through a domain adapter | PROVEN | `platform-core/gastro-adapter-v1.js`, `index.html`, `service-worker.js` | Existing Gastro presentation/operator layers retained |
| AD-02 | Lifestyle consumes the same Platform Core runtime | PROVEN | `hapo3005/hoy-lifestyle`: `vendor/hoy-platform-core-v1.js`, `platform-core.lock.json`, thin adapters | Vendor content hash equals central core hash |
| AD-03 | Works consumes the same Platform Core runtime | PROVEN | `hapo3005/hoy-works`: `vendor/hoy-platform-core-v1.js`, `platform-core.lock.json`, Works adapter | Vendor content hash equals central core hash |
| AD-04 | Central, Lifestyle and Works runtime content is byte-identical at Git blob level | PROVEN | Git blob `c1740b652bc22af2beb868dc8c36049411692474` in all three repositories/branches | Strong anti-drift evidence for implementation snapshot |
| AD-05 | Vertical adapters may remain domain-specific without redefining core truth rules | PROVEN | `platform-core/adoption.json`, consumer rules, Lifestyle/Works static gates | Architectural boundary is explicit |
| AD-06 | A future new vertical can reuse the core without rebuilding all platform invariants | PARTIAL | Core + adapter architecture | Technical reuse is proven; actual launch-time/cost reduction still requires observed expansion evidence |

## C. QA and release evidence

| ID | Claim | Status | Primary evidence | DD note |
|---|---|---:|---|---|
| QA-01 | Platform Core candidate passes Gastro critical regression QA on implementation head | PROVEN | HOY Critical PR QA run `32191250746`, head `83996442...`, success | Later documentation-only commits require ordinary final-head checks before merge |
| QA-02 | Platform Core candidate passes Final Release static integrity on implementation head | PROVEN | HOY Final Release QA run `32191250715`, success | Browser steps were not part of that static-only result |
| QA-03 | Gastro full PR browser suite is complete on the Platform Core implementation head | PARTIAL | HOY PR Browser QA run `32191250686` | At document creation snapshot the run was still in progress; do not claim complete until result is green |
| QA-04 | Lifestyle Platform Core adoption passed critical/static/unit QA | PROVEN | Lifestyle critical workflow run `32190888498`, success | Includes platform drift/static checks on current Lifestyle core-consumer head |
| QA-05 | Lifestyle Platform Core adoption passed Mobile WebKit + Mobile/Desktop Chromium | PROVEN | Lifestyle browser workflow run `32190888482`, success | Full defined Lifestyle browser matrix green |
| QA-06 | Works Platform Core adapter is fully CI/browser certified | PARTIAL | Works PR #3 scripts/tests exist; PR is mergeable | No executable PR workflow on adapter head; explicit open gate |

## D. Transferability / founder independence

| ID | Claim | Status | Primary evidence | DD note |
|---|---|---:|---|---|
| TR-01 | Core product invariants are documented outside founder knowledge | PROVEN | Platform Core runtime, README, consumer contract, adoption manifest, this DD pack | Reduces key-person dependency for technical semantics |
| TR-02 | Platform can be operated without founder involvement | OPEN | Requires operating proof, delegated ownership, SOPs and live operator evidence | Architecture alone does not prove operational independence |
| TR-03 | Buyer can identify vertical-specific vs shared responsibilities | PROVEN | `platform-core/README.md`, `adoption.json`, adapters | Clear technical ownership boundary |
| TR-04 | Platform architecture supports repository consolidation or continued multi-repo operation | PROVEN | Runtime/adapters are repository-independent by design | Future migration choice remains buyer decision |

## E. Defensibility / moat

| ID | Claim | Status | Primary evidence | DD note |
|---|---|---:|---|---|
| DF-01 | HOY has a reusable, governed product-truth layer | PROVEN | Platform Core + three vertical adoption paths | Technical execution advantage |
| DF-02 | HOY has a durable market moat because of Platform Core | OPEN | Not supportable by code alone | Requires distribution, recurring revenue, switching costs, data/network effects or proprietary rights |
| DF-03 | Shared semantics can improve cross-region/cross-vertical data comparability | PARTIAL | Platform Core + HOY Intelligence strategy | Architecture supports it; longitudinal multi-region dataset not yet proven |
| DF-04 | HOY Intelligence avoids a raw-identifiable-user-data brokerage thesis | PROVEN | `docs/HOY_INTELLIGENCE_STRATEGY_2_45.md` | External intelligence commercialization remains gated |
| DF-05 | HOY has proven lawful recurring revenue from aggregated intelligence | OPEN | No current proof | Must remain outside current buyer claim |

## F. Commercial integrity

| ID | Claim | Status | Primary evidence | DD note |
|---|---|---:|---|---|
| CI-01 | Paid placement is separated from organic relevance | PROVEN | Platform Core sponsorship/rank-integrity contract | Key trust and buyer-governance property |
| CI-02 | Commercial eligibility requires explicit disclosure semantics | PROVEN | Platform Core contract/runtime | Current canonical label: `Anzeige` |
| CI-03 | HOY currently has proven scaled paid-placement revenue | OPEN | Requires actual commercial/financial evidence | Architecture must not be confused with traction |

## G. Data / Intelligence relationship

| ID | Claim | Status | Primary evidence | DD note |
|---|---|---:|---|---|
| DI-01 | HOY has a privacy-first intelligence strategy and commercialization gate | PROVEN | `docs/HOY_INTELLIGENCE_STRATEGY_2_45.md` | Strategy explicitly blocks unsafe commercialization |
| DI-02 | Shared taxonomy can support comparable supply/demand signals | PARTIAL | Platform Core + Intelligence strategy | Product/architecture support exists; scale/quality proof pending |
| DI-03 | User-level/pseudonymous journeys are approved for external sale | PROVEN FALSE | Intelligence strategy explicitly rejects row-level user-journey export | Buyer materials must not suggest otherwise |
| DI-04 | A hard-to-recreate longitudinal local-intent dataset exists at commercial scale | OPEN | Requires live, rights-cleared longitudinal evidence | Future defensibility target, not current fact |

## H. Legal / IP / security boundary

This architecture index is not a substitute for Corporate, IP, Privacy, Trademark, Tax or Security DD.

Relevant parallel work includes:

- RT-006 technical DD / software supply-chain candidate (PR #116);
- RT-008 GDPR/privacy operating pack and fail-closed consent work;
- RT-009 trademark/brand clearance architecture;
- Works source-rights / IR-02D gates;
- separate founder-IP/chain-of-title and corporate/tax gates.

A buyer should treat those as independent closing conditions where applicable.

## I. Buyer claim rules

The following language is allowed now:

- "HOY has a versioned shared platform core adopted across Gastro, Lifestyle and Works."
- "The core centralizes product-truth, verification, freshness, MUST/PREFER/IGNORE, safety and commercial-integrity semantics."
- "Lifestyle and Works vendor copies match the central runtime at the Git-blob level for the documented snapshot."
- "Platform Core reduces duplicated platform logic and improves technical transferability."

The following language is not yet allowed without additional evidence:

- "HOY has a proven network effect."
- "HOY can launch any new vertical cheaply or instantly."
- "HOY is fully founder-independent."
- "HOY has a proven data moat at scale."
- "Platform Core alone increases the company value by €X."
- "All three verticals are production- and market-proven."

## J. Data-room maintenance rule

Before external circulation:

1. refresh every QA status against the exact final commit/PR head;
2. archive relevant workflow-run references or exported evidence;
3. update PARTIAL claims to PROVEN only when the missing evidence is attached;
4. never silently delete OPEN items — close them with dated evidence or leave them visible;
5. reconcile this index with `platform-claims-register.json`.
