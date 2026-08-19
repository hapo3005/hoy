# RT-007 read-only preflight — 2026-08-19

## Role

This is a **read-only execution preflight** for G1-CB-14 and the ordered plan in PR #147. It does not execute any replacement and does not change the G1 authority model.

## Production row drift

All **36/36** prepared RT-007 targets were re-read from Production and still match the manifest's exact current URL value.

- 34 published targets
- 2 unpublished/archive targets
- 0 URL drift

This means the prepared predicates are not stale at the time of this snapshot. It does **not** authorize an apply.

## Signature copy baseline

The current Production baseline was read for all **12/12** signature targets across title, text, tags, status, source URL/label, checked date and confidence. Candidate generation must still predicate on the exact approved baseline and re-read again immediately before any later mutation.

## Destination rights state

All **27/27 unique destination hosts** remain registered as `AMBER` / `FIRST_PARTY_BUSINESS_REFERENCE` with `BUSINESS_TERMS_REQUIRED` and no present transfer-clear status.

Replacing a RED/restricted provenance reference with one of these destinations therefore improves provenance quality but **does not create a licence, commercial-use right, derivative-use right, transferability or whole-profile clearance**.

## Buyer-safe snapshot

The buyer-rights snapshot remains unchanged:

- 329 hard refs total
- 324 hard refs on published records
- 5 hard refs on unpublished/archive records
- 146 published restaurants with hard-restricted dependency
- 18 published conditional restaurants
- 2 published restaurants whose populated provenance references are source-reference-scope transferable/licensed now
- 3 archived/unpublished restaurants

The projected 329 → 293 reduction remains only a projection after a separately approved successful apply.

## Fresh source recheck

The final current source-identity/reachability recheck is **36/36 PASS, 0 REVIEW_REQUIRED**. Four initially fail-closed findings were resolved by deeper read-only verification:

1. **Escuela de Pieter / signature_source_url — PASS_WITH_INTEGRITY_NOTE.** The current first-party homepage directly identifies the restaurant, La Manga location, Mediterranean offer and reservation path. Previously surfaced unrelated parameterized storefront-style URLs could not be reproduced in the final recheck. The anomaly remains an integrity note and the domain must be rechecked immediately before any apply.
2. **El Rincón de la Hormiga / source_url — PASS_BUSINESS_IDENTITY_MATCH.** The HOY Production record is `venue_type=bar` and already names the first-party website. The site identifies the Cabo de Palos venue, documents an `APERTURA DE BAR` project and exposes a tapas/drinks menu.
3. **Restaurante Isla Grosa / source_url — PASS_DIRECT_FIRST_PARTY_FETCH.** The direct first-party site identifies Restaurante Isla Grosa in La Manga and exposes restaurant, menu and contact content.
4. **Pescados Cabo de Palos I / location_source_url — PASS_DIRECT_FIRST_PARTY_FETCH.** The direct first-party site identifies Pescados Cabo de Palos at Calle Sirio 23, matching the prepared location target.

Restaurante El Pez Rojo remains an unpublished/archive case. Its old first-party WordPress source may remain useful as historical provenance, but it must not be represented as proof of a currently operating live business.

## Decision

`SOURCE_RECHECK_PASS_PENDING_ROLLBACK_RELEASE_RECHECK_AND_SEPARATE_PRODUCTION_APPROVAL`

The source recheck no longer contains an unresolved target-level blocker, but **Production apply remains unauthorized**. Before any apply candidate may be considered complete, HOY still requires:

1. per-target and per-wave rollback evidence with exact before values;
2. privacy/security/release-boundary reconfirmation;
3. a repeated exact Production row/source/signature/rights recheck immediately before mutation;
4. a separate explicit Production apply decision.

## Non-authorization

- no Production DML/DDL
- no replacement wave executed
- no Terms activation
- no buyer export against Production
- no transfer-clear or whole-profile-clear claim
- no Contact Freeze release
- no merge authorization
