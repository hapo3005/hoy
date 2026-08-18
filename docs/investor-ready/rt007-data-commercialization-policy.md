# HOY Data Commercialization Policy v1.0

Status: binding Investor Ready draft  
Date: 2026-08-18

## Principle
HOY does not monetize third-party platform content as if it were HOY property. Commercial data products may contain only rights-cleared HOY-created, business-confirmed, open-licensed or lawfully processed/aggregated HOY event data.

## Allowed data-product candidates
Subject to RT-008 privacy controls and sufficient sample sizes:
- aggregated local intent demand by zone/time/category;
- HOY-generated freshness/verification coverage metrics;
- aggregated conversion/action patterns inside HOY;
- supply-gap and intent-coverage signals generated from rights-cleared entity attributes;
- business-confirmed service/availability trends where contracts permit aggregate use;
- Region OS operational benchmarks that contain no restricted raw third-party content or personal data.

## Not sellable / not licensable as HOY proprietary raw data
- Google Maps content or data derived from Google Maps Content without a specific permitted programme;
- Tripadvisor content, ratings, reviews or extracted database content without written/licensed permission;
- Restaurant Guru content/database extracts;
- Meta/Facebook/Instagram collected or derived data without the required written permission/authorised use;
- photos, menu artwork, logos, creative descriptions or other protected business content without rights;
- identifiable user behaviour, personal contact data or lead/person data as a general data-resale product;
- any source classified RED or REVIEW_REQUIRED in `private.source_rights_registry`.

## Rights-cleared derived signal test
Before a derived field is marked `HOY_TRANSFERABLE`, all of the following must be true:
1. every material upstream source allows the intended use/derivation, or is HOY-created/business-confirmed under contract;
2. no material input has `rights_status in ('RED','REVIEW_REQUIRED')`;
3. personal data has been removed or the processing/sharing has a documented legal basis and purpose; for external BI the default is sufficiently aggregated/anonymised output;
4. attribution/licence conditions are preserved where required;
5. the algorithm/version and source lineage are auditable;
6. the output cannot reconstruct restricted raw source content.

## Investor / buyer data-room rule
The data room must expose three separate inventories:
- **Transferable HOY Asset** — data/structure/history that can transfer with Parent;
- **Licensed / Conditional** — usable only with licence/contract/attribution conditions;
- **Reference / Restricted** — provenance/lead evidence that is not part of valuation-grade proprietary data.

No valuation model may count the third category as proprietary database value.

## Personal data rule
GDPR personal data is governed by controller obligations, legal bases, transparency, purpose limitation, retention and data-subject rights. HOY must not use the word “ownership” to imply unrestricted property rights over people’s personal data. Aggregated/anonymised outputs require an actual re-identification-risk review; pseudonymisation alone is not anonymisation.

## F0-M
Before market contact, pilot/business terms must grant the operational rights HOY needs for operator-submitted facts, offers, menus and media; restricted third-party evidence must not be the sole basis for launch-critical claims.

## F1-I
Before investor outreach, the transferable/conditional/restricted export must reconcile to the live database and Data Rights Ledger, and the economic value attributed to HOY Data must come only from the transferable/rights-cleared portion.
