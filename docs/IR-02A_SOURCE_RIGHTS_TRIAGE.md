# HOY Investor Ready — IR-02A Source Rights Triage

**Audit date:** 2026-08-18  
**Purpose:** Prioritize third-party source-rights review by actual live-system concentration.

## Highest-priority external/reference domains observed in Gastro

| Domain / family | Live references observed | Main observed role | Rights status | Priority | Required review |
|---|---:|---|---|---|---|
| Google (`www.google.com`) | 102 | restaurant master / directory reference | REVIEW_REQUIRED | P0 | Terms/API/scraping/display/retention/derivative-use basis; identify whether URLs are locator evidence only or content source |
| Restaurant Guru family | 40+ across `restaurantguru.com`, `es.restaurantguru.com`, image/menu hosts | hours directory + verified public menu snapshots | REVIEW_REQUIRED | P0 | Terms for storage/transformation/display; snapshot retention; avoid implying first-party authority |
| Tripadvisor family | 37+ across `.com`, `.co.uk`, `.es`, `.de`, `.ie`, `.co` | directory / restaurant master | REVIEW_REQUIRED | P0 | Terms and permissible factual/reference use; do not reproduce protected editorial/review content without basis |
| Cylex | 5 | directory hours | REVIEW_REQUIRED | P1 | Terms and permitted reference use |
| TodosBiz | 6 | directory/reference | REVIEW_REQUIRED | P1 | Terms and permitted reference use |
| Waze | 5 | directory/location reference | REVIEW_REQUIRED | P1 | Terms and permissible use of listing/location facts |
| Wanderlog | 2 | directory hours | REVIEW_REQUIRED | P1 | Terms and permitted reference use |
| booking/menu intermediaries (`myrestoo.net`, `res-menu.net`, `menustic.com`) | several | booking/menu/hours snapshot | REVIEW_REQUIRED | P1 | Determine operator-authorized vs independent intermediary status and reuse rights |
| Just Eat | 1 | `authorized_transactional` menu source | REVIEW_REQUIRED | P1 | Preserve distinction between transactional availability and HOY ownership; document permitted transformation/display |
| Facebook | 2 | business/operator-public source | REVIEW_REQUIRED | P1 | Capture whether operator-controlled page is being used only as factual reference or content source |

## First-party business websites

The live data also contains many restaurant/operator-controlled domains marked `official_website` and/or menu `first_party` (for example La Manga Club and individual venue sites).

**Default classification:** `C — external first-party business source`, not HOY-owned data.

Required rights questions:

1. Is HOY merely referencing factual public business information, or copying protected content/media?
2. Is menu content stored/transformed/displayed in-app?
3. Is explicit operator permission/contract available?
4. Are translations/structured derivatives retained if the source disappears?
5. Does the future B2B agreement grant continued use and transferability/change-of-control rights?

## Source-rights decision states

- `REFERENCE_ONLY_OK` — narrowly used as factual locator/reference with documented basis.
- `FIRST_PARTY_PERMISSION` — operator/business has granted the required use rights.
- `LICENSED` — licence/contract permits the stated use.
- `OPEN_LICENSED` — open/public-data licence captured with attribution/version.
- `TRANSFORM_ONLY_INTERNAL` — source may inform internal verification but content is not republished.
- `REVIEW_REQUIRED` — current default for unresolved sources.
- `PROHIBITED` — source/content cannot be used for the intended purpose.

## Publication rule

A source being publicly reachable is **not** by itself sufficient to mark its content as transferable or proprietary. Investor materials should distinguish:

- public facts;
- source URLs/provenance metadata;
- HOY-created normalization/taxonomy/trust metadata;
- copied/transformed source content;
- operator-confirmed first-party data.

## Remediation order

1. Resolve Google / Restaurant Guru / Tripadvisor usage first because they dominate third-party reference volume.
2. Resolve menu snapshot/intermediary rights next because menu content is commercially sensitive and potentially copyrightable.
3. Add standard rights clauses to future operator onboarding so new business-confirmed data is contractually clean from day one.
4. Move strategic fields toward operator-confirmed or HOY-verified first-party evidence to reduce dependence on directory terms over time.
