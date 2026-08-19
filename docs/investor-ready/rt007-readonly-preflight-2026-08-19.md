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

32/36 targets passed the current source-identity/reachability preflight. Four targets are fail-closed as `REVIEW_REQUIRED`:

1. **Escuela de Pieter / signature_source_url** — the legitimate first-party homepage is available, but unrelated Japanese storefront-style pages were also surfaced on the same domain. Manual domain-integrity/security review is required.
2. **El Rincón de la Hormiga / source_url** — the first-party site identifies a socio-cultural centre and exposes a food/drink menu; the semantic identity match to the HOY restaurant record requires explicit review.
3. **Restaurante Isla Grosa / source_url** — current external evidence corroborates the domain/business association, but direct first-party page content was not independently fetched in this preflight.
4. **Pescados Cabo de Palos I / location_source_url** — current external evidence corroborates the domain/business association, but direct first-party page content was not independently fetched in this preflight.

Restaurante El Pez Rojo remains an unpublished/archive case. Its old first-party WordPress source may remain useful as historical provenance, but it must not be represented as proof of a currently operating live business.

## Decision

`BLOCKED_PENDING_SOURCE_REVIEW_AND_SEPARATE_PRODUCTION_APPROVAL`

The 32 clean source-recheck targets are **not** independently authorized for Production. The four review-required targets must not enter an apply candidate until their specific issue is resolved. After that, the full mandatory preflight must be repeated against current Production state before any explicit apply decision.

## Non-authorization

- no Production DML/DDL
- no replacement wave executed
- no Terms activation
- no buyer export against Production
- no transfer-clear or whole-profile-clear claim
- no Contact Freeze release
- no merge authorization
