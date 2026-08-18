# HOY Buyer Transfer & Vertical Onboarding Runbook v1.0

Status: operating-transfer candidate  
Date: 2026-08-19  
Scope: HOY Platform Core, Gastro, Lifestyle and Works

## Purpose

This runbook converts the Platform Core architecture from documented founder knowledge into an executable handoff process for a future maintainer, operator or buyer team.

It does **not** claim that HOY is already fully founder-independent. Founder independence remains unproven until a non-founder executes the acceptance drill in `founder-independence-acceptance.json` and the required evidence is archived.

## Roles

The process uses roles rather than named individuals so ownership can transfer without rewriting the operating model.

- **Platform Core Maintainer** — owns `HOY-PC-*` semantics, core runtime, consumer contract and compatibility decisions.
- **Vertical Maintainer** — owns vertical-specific adapters, domain scoring, UX and release artifacts.
- **Release Approver** — confirms required QA evidence and exact-head release eligibility.
- **Data/Privacy Gate Owner** — confirms that a technical release does not silently waive privacy, source-rights, data-governance or retention controls.
- **Business/Market Gate Owner** — owns external activation, operator/contact and commercial-market gates; code completion does not grant this authority.

A single person may hold multiple roles in a small team, but every release record must identify which role approved which gate.

## Source-of-truth map

1. `platform-core/hoy-platform-core-v1.js` — canonical runtime.
2. `platform-core/consumer-contract.json` — machine-readable semantic contract.
3. `platform-core/adoption.json` — current vertical adoption map.
4. Vertical adapters — translate domain data and add stricter domain rules; they may not weaken Platform Core.
5. Lifestyle/Works vendor locks — immutable local runtime copies tied to an exact source commit/blob.
6. `docs/investor-ready/platform-claims-register.json` — what may and may not be claimed externally.

## Change classification

Before editing, classify the change.

### Class P0 — Platform semantic change

Examples: confirmed verification levels, MUST/PREFER behavior, freshness semantics, safety gate, sponsorship/rank integrity.

Required: Platform Core version/contract review, core tests, every affected consumer pin/adaptor review, vertical QA, buyer-claim refresh.

### Class P1 — Vertical adapter/domain change

Examples: Gastro field translation, Works service/location weighting, Lifestyle context weighting.

Required: relevant vertical QA plus proof that no platform invariant was redefined or weakened.

### Class P2 — Presentation/operating change

Examples: labels, UX layout, documentation, operator workflow presentation.

Required: vertical QA appropriate to the surface; no semantic contract version change unless behavior actually changes.

## Platform Core release procedure

1. Start from the canonical Platform Core source, never from a vendored consumer copy.
2. State the intended semantic delta and whether `HOY-PC-*` contract version changes.
3. Update runtime and `consumer-contract.json` together when semantics change.
4. Run Platform Core contract tests.
5. Review fail-closed invariants: unknown/stale is not truth; failed MUST is not rescued; safety cannot be bypassed; sponsorship cannot buy rank.
6. Generate/sync consumer vendor copies only from the approved source commit.
7. Verify source and vendor Git blob/checksum identity.
8. Run each affected vertical's static/unit/browser gates.
9. Refresh `adoption.json`, Buyer-DD evidence and claims status where applicable.
10. Keep production, legal, privacy, source-rights, owner-live and market gates independent.
11. Release only the exact head that owns the archived QA evidence.

## Rollback procedure

Rollback is preferred over live semantic patching when a released Platform Core change creates a material regression.

1. Identify the last known-good Platform Core version and exact commit/blob.
2. Restore the canonical runtime/contract pair.
3. Restore each affected consumer lock/vendor artifact to the same known-good version.
4. Run static/core contract QA before any redeploy.
5. Run the vertical's critical smoke/regression suite.
6. Record reason, affected versions, rollback commit and any data/operating implications.
7. Do not roll database/data-rights state backward merely because client code was rolled back; those require their own controlled procedure.

## New vertical onboarding procedure

The normative machine-readable checklist is `vertical-onboarding-contract.json`.

A new vertical is not considered Platform-Core-adopted until it has:

1. a named repository/product owner role;
2. an explicit domain boundary: what stays vertical-specific vs shared;
3. a thin adapter or equivalent consumer boundary;
4. the exact Platform Core version/pin recorded;
5. tests proving unknown/stale/external evidence cannot become confirmed truth;
6. tests proving a failed MUST cannot be rescued by PREFER;
7. a safety hard-gate test;
8. a commercial-rank-integrity test;
9. vertical-specific static/unit/browser QA appropriate to its runtime;
10. explicit independent gates for data/privacy/source rights/production/market activation;
11. an adoption-manifest update and Buyer-DD evidence link.

## Incident triage

For any trust/matching/safety/commercial-integrity incident:

- First determine whether the fault is **Platform Core**, **adapter**, **data/evidence**, or **presentation**.
- Do not fix a bad data state by weakening truth semantics.
- Do not fix an adapter mismatch by copying Platform Core logic locally.
- If safety or false-positive MUST behavior is implicated, suppress/fail closed first, then investigate.
- Preserve the failing example as a regression test before closing the incident.

## Secrets, production and data boundaries

This runbook intentionally contains no credentials or secret values. A buyer/operator should receive secrets through an independent credential-transfer process with least privilege and rotation.

Platform Core release authority does not itself authorize:

- production database migrations;
- changes to RLS/GRANT/security policy;
- new personal-data collection;
- data commercialization;
- source-rights reclassification;
- operator/customer/investor outreach;
- legal or tax decisions.

Those remain separate gates and evidence packages.

## Founder-independence acceptance drill

The technical transfer claim advances only through the machine-readable drill in `founder-independence-acceptance.json`.

A valid drill must be executed by a non-founder using repository/runbook evidence rather than live step-by-step founder instruction. It must demonstrate at minimum:

- locate and explain the canonical semantic sources;
- classify a proposed change correctly;
- make or review a safe adapter-level change without duplicating Platform Core truth logic;
- run the required QA entry points;
- identify an intentionally stale/unknown fact as confirmation-needed rather than positive;
- identify that sponsorship cannot affect organic rank;
- perform a documented dry-run rollback to a known-good core pin;
- outline a new-vertical onboarding from the machine-readable contract;
- identify which production/legal/data gates are still outside technical release authority.

## Pass rule

`FOUNDER_INDEPENDENCE_TECHNICAL_PASS` is allowed only when every required criterion is `PASS`, the executor is recorded as non-founder, and evidence references are attached.

Until then, the external buyer claim remains: **HOY has documented technical transferability and a defined founder-independence test; full founder-independent operation is not yet proven.**
