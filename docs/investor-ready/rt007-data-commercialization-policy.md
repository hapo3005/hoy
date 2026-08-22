# HOY Data Commercialization Policy v1.1

**Status:** binding Investor Ready draft  
**Date:** 2026-08-18

## Principle
HOY does not monetize third-party platform/publisher content as if it were HOY property. Commercial data products may contain only rights-cleared HOY-created, sufficiently business-confirmed/contract-supplied, open/licensed or lawfully processed and appropriately aggregated/anonymised HOY event data.

## Live external-source boundary
Current Production external-source rights export reconciles to:
- `TRANSFERABLE_OR_LICENSED_NOW`: 1 host / 2 references
- `CONDITIONAL_NOT_YET_TRANSFERABLE`: 64 / 216
- `REFERENCE_RESTRICTED_REPLACE`: 14 / 197
- `REVIEW_REQUIRED`: 26 / 44

These counts are **external-source references only**, not a measure of the entire HOY data asset. HOY-created structure/history and future rights-cleared first-party data belong to separate classes.

AMBER is **not** current proprietary/transferable data by default. It becomes usable for the relevant commercial purpose only when its authority/licence/business-terms chain is closed and the registry reflects that evidence.

## Allowed data-product candidates
Subject to RT-008 privacy controls and sufficient sample sizes:
- aggregated local intent demand by zone/time/category from lawful HOY event data;
- HOY-generated freshness/verification coverage metrics;
- aggregated conversion/action patterns inside HOY;
- supply-gap and intent-coverage signals generated solely from rights-cleared entity attributes;
- business-confirmed service/availability trends where contracts permit aggregate/derived use;
- Region OS operational benchmarks containing no restricted raw third-party content or personal data;
- open/licensed geographic or public-sector data products only within applicable licence/attribution conditions.

## Not sellable / not licensable as HOY proprietary raw data
- any RED source content or field derived materially from RED inputs without separate permission;
- any REVIEW_REQUIRED/NO_REGISTRY source content;
- AMBER content before its rights/authority chain is closed for the intended use;
- Google Maps content/derived data outside a specifically permitted programme;
- Tripadvisor/Restaurant Guru/TheFork platform content without written/licensed permission for the intended reuse;
- Meta/Facebook/Instagram collected or derived data without required authorised use;
- EL PAÍS article/content as HOY proprietary data without publisher authorization;
- photos, menu artwork, logos, creative descriptions or other protected business content without rights;
- identifiable user behaviour, personal contact data or lead/person data as a general resale product.

## Rights-cleared derived signal test
Before a derived field is marked `HOY_TRANSFERABLE`, all must be true:
1. every material upstream source permits intended use/derivation, or is HOY-created/business-confirmed under sufficient terms;
2. no material input remains RED, REVIEW_REQUIRED or NO_REGISTRY;
3. AMBER inputs have documentary clearance for the exact commercial/derivative/transfer purpose;
4. personal data is excluded or processing/sharing has documented legal basis and purpose; external BI defaults to sufficiently aggregated/anonymised output;
5. attribution/licence conditions are preserved;
6. algorithm/version and source lineage are auditable;
7. output cannot reconstruct restricted raw source content.

## Investor / buyer data-room rule
Expose three separate inventories:
- **Transferable HOY Asset** — HOY-created/rights-cleared structure, history and lawful data that can transfer with the business;
- **Licensed / Conditional** — usable only under licence/contract/attribution or unresolved authority conditions;
- **Reference / Restricted** — provenance/lead evidence excluded from proprietary-data valuation.

No valuation model may count the third category as proprietary database value. The second category receives value only to the extent its transfer/continued-use conditions are evidenced.

## Personal data rule
GDPR personal data remains governed by controller obligations, legal bases, transparency, purpose limitation, retention, sharing and data-subject rights. HOY must not use “ownership” to imply unrestricted property rights over personal data. Pseudonymisation is not anonymisation; aggregation/anonymisation requires re-identification-risk review.

## F0-M
Before market contact:
- Business Terms must be legally cleared/active before relying on operator-supplied rights;
- no Business Confirmed claim without an actual recorded confirmation;
- all NO_REGISTRY launch evidence is classified/replaced;
- restricted evidence is not the sole basis for launch-critical claims.

## F1-I
Before investor outreach, the transferable/conditional/restricted export must reconcile to live Production and the economic value attributed to HOY Data must come only from the transferable/rights-cleared portion. Current RED/REVIEW_REQUIRED content and uncleared AMBER content receive no proprietary-data valuation uplift.
