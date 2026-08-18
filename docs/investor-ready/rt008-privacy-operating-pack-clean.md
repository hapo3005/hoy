# HOY Investor Ready — RT-008 Privacy Operating Pack (Clean Current-Main Candidate)

Status: **IN PROGRESS**  
Date: 2026-08-19  
Scope: analytics/runtime privacy reconciliation plus operating close criteria.  
Legal status: working diligence control, not a claim of GDPR compliance or legal advice.

## 1. Why this clean candidate exists

Two focused privacy branches implemented overlapping but non-identical fixes to `analytics-rpc-1.8.1.js`:

- PR #107 introduced the stronger Production-storage boundary and the broader RT-008 operating pack;
- PR #109 introduced a clearer explicit consent lifecycle API and focused withdrawal regression tests.

Merging both independently would create an ambiguous final runtime contract. This clean candidate therefore composes one current-main runtime and one canonical analytics consent key.

Historical PR #102 also contains privacy-governance migrations/registers. Those are **reference/harvest inputs only** and are not treated as live merely because they exist on that historical branch.

## 2. Canonical analytics consent contract

Canonical key:

`hoy-privacy-analytics-consent-v1`

Recognized states:

- `granted` — explicit analytics consent exists for the client runtime;
- `denied` — analytics consent denied/withdrawn;
- anything else / missing — `unset` and therefore no Production analytics permission.

The runtime exposes `window.hoyAnalyticsPrivacy181` with:

- `status()`;
- `granted()`;
- `grant()`;
- `deny()`;
- `withdraw()`;
- `clear()`.

This API is an implementation primitive, **not a consent UI**. No user-facing banner or legal wording is invented by this candidate.

## 3. Production fail-closed rules

On the defined Production host, without explicit `granted` consent:

1. legacy analytics anonymous/session identifiers are removed;
2. legacy proof-pilot analytics state is removed;
3. raw local analytics history is removed;
4. `trackEvent()` exits before `readEvents()`;
5. `trackEvent()` exits before payload creation or UUID generation;
6. pilot query parameters are stripped from the URL but are not persisted as attribution state;
7. the Supabase analytics RPC transport cannot run.

Even **after** consent, Production does not persist the raw local event-history queue. Only the bounded payload state required for the consented analytics path may be created.

## 4. Preview / QA boundary

Local/preview QA may keep a bounded local event history so analytics enrichment can be tested deterministically without writing Production.

The QA marker in localStorage is not inspected on Production before consent. `navigator.webdriver` remains available to identify browser automation without creating or reading persistent device analytics state.

QA capability does not weaken the Production consent gate.

## 5. Denial and withdrawal

`deny()`, `withdraw()` and `clear()` remove:

- persistent anonymous analytics ID;
- session analytics ID;
- proof-pilot code;
- proof-pilot sent marker;
- raw local analytics event history.

Withdrawal therefore does not merely stop future transport; it also clears the client analytics identifiers/history controlled by this runtime.

## 6. Automated evidence

The candidate adds:

- `scripts/investor-ready/rt008-privacy-static-check.mjs` — source-order/invariant gate;
- `tests/privacy-analytics-consent-2.48.spec.js` — behavior-level VM tests plus static-check execution;
- `docs/investor-ready/rt008-runtime-control-register.json` — machine-readable separation of candidate controls vs open legal/operating gates.

The behavior tests prove, without Production access, that:

- old identifiers/history are cleaned on Production boot without consent;
- a Production event exits without creating analytics state;
- a pilot query is removed without persistence when consent is absent;
- explicit grant can create bounded consented identifier state while raw Production event history stays absent;
- withdrawal/denial removes identifiers, pilot state and raw history.

## 7. Broader RT-008 gates still open

This runtime improvement does not close RT-008 overall. At minimum the following remain independent:

- user-facing consent/notice/granularity UX and withdrawal surface;
- final legal-basis and retention decisions for the actual processing purposes;
- Article 14 handling for retained third-party professional contact data where applicable;
- processor/subprocessor/international-transfer register completion;
- DSAR/delete operational test;
- breach-response tabletop;
- final Works DPIA screening for the actual live scope;
- qualified German/Spanish legal review where required;
- exact Production release/deployment and post-release verification;
- reconciliation/harvest of any still-needed governance assets from historical PR #102.

## 8. Claim discipline

Allowed candidate claim:

> HOY has a clean current-main analytics privacy runtime candidate that is fail-closed on Production unless explicit analytics consent is granted, with automated evidence for storage, attribution, transport and withdrawal behavior.

Not allowed:

- “HOY is fully GDPR compliant.”
- “All analytics processing is legally approved.”
- “The existence of this API constitutes valid consent.”
- “Historical contacts may be marketed to without further review.”
- “The candidate is live in Production.”

## 9. Production and outreach boundary

This candidate performs no Production deploy, database DDL/DML, consent activation, marketing/business outreach, data commercialization or legal approval.

A merge/release decision remains a separate exact-head gate.
