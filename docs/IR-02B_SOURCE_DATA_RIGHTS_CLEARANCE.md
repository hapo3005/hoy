# HOY Investor Ready v1.0 — IR-02B Source & Data Rights Clearance

**Audit date:** 2026-08-18  
**Status:** OPERATIONALLY IMPLEMENTED / LEGAL COUNSEL REVIEW STILL REQUIRED  
**Scope:** HOY Gastro/Core + HOY Works live source inventories  
**Purpose:** Separate navigational/research sources from reusable, transferable HOY data assets and prevent future source-rights drift.

> This file is an operational DD control, not a legal opinion. A source being public does not by itself mean HOY may persist, copy, commercialise, derive from or transfer the source content.

## 1. What was implemented

Both live Supabase backends now contain a non-public internal registry:

- `private.source_rights_registry`
- `private.source_usage_inventory`

The registry records for each observed source host:

- source class;
- GREEN / AMBER / RED / REVIEW_REQUIRED status;
- whether it may be used as a lead;
- whether factual verification is permitted operationally;
- whether persistent copying, public reuse, derived use, commercial use and automated collection are permitted;
- attribution requirements;
- replacement requirement;
- transferability status;
- policy/legal-review status and evidence notes.

The registry is inside the `private` schema, has RLS enabled and is explicitly unavailable to `public`, `anon` and `authenticated` roles. `service_role` has read access for controlled internal tooling.

## 2. Core rights doctrine

HOY now enforces the following distinction:

**Source available on the internet** ≠ **content free to copy** ≠ **fact free to persist** ≠ **commercial reuse allowed** ≠ **derived use allowed** ≠ **asset transferable at exit**.

Every strategic source must therefore move through:

`Observed → Classified → Rights-reviewed → Evidence-backed → Transferability-known`

Unclassified domains default to `REVIEW_REQUIRED`.

## 3. Current Gastro/Core rights heatmap

Live audit after migration `20260818194908_ir02b_source_rights_registry`:

| Rights status | Distinct hosts | Current source references | Meaning |
|---|---:|---:|---|
| GREEN | 1 | 2 | Explicit reusable/open-data basis captured; conditions still apply |
| AMBER | 44 | 157 | First-party/vendor reference usable for limited factual verification; broader rights not assumed |
| RED | 14 | 197 | Restricted platform/aggregator/social source; lead only, replacement required |
| REVIEW_REQUIRED | 46 | 103 | No sufficient rights decision yet |

**Total:** 105 distinct hosts / 459 current source references across the audited source-url fields.

This is a source-reference count, not a count of unique businesses or unique facts.

## 4. RED — Google Maps / Google source references

Observed current usage:

- `www.google.com`: **102 references**
- contexts: `restaurants`, `restaurant_hours_sources`

Operational classification:

- source class: `PLATFORM_RESTRICTED_GOOGLE_MAPS`
- rights status: **RED**
- lead/reference: yes
- persistent copying into HOY as Google-derived content: no
- commercial reuse: no
- derived dataset use: no
- transferability: no
- replacement required: yes

Reason:
Google Maps Platform EEA terms currently prohibit extracting/scraping Google Maps Content for use outside the services and give examples including copying/saving business names and addresses. Caching and creation of content from Google Maps Content are also restricted except where service-specific terms expressly allow it.

**HOY action:** Google-origin facts must be re-sourced from operator first-party evidence, HOY field verification or a source with a reusable licence before being counted as a transferable HOY data asset.

Policy evidence checked 2026-08-18:
`https://cloud.google.com/terms/maps-platform/eea`

## 5. RED — Restaurant Guru

Observed current usage across hosts:

- `es.restaurantguru.com`: 22 references
- `restaurantguru.com`: 17 references
- `img.restaurantguru.com`: 1 reference
- `menu02.restaurantguru.com`: 1 reference

Operational classification:

- source class: `AGGREGATOR_RESTRICTED_RESTAURANTGURU`
- status: **RED**
- lead only
- no commercial reuse / incorporation of Restaurant Guru content
- no automated collection
- transferability: no
- replacement required: yes

Reason:
Restaurant Guru's current terms frame the service/content as personal-use and prohibit scraper/robot access, copying/providing access to content, and incorporating Restaurant Guru content into products/services supplied to third parties.

Policy evidence checked 2026-08-18:
`https://restaurantguru.com/terms_of_use`

## 6. RED — Tripadvisor

Observed current usage includes:

- `www.tripadvisor.com`: 18 references
- `www.tripadvisor.co.uk`: 12 references
- `www.tripadvisor.es`: 4 references
- `www.tripadvisor.de`: 2 references
- additional country-domain references

Operational classification:

- source class: `AGGREGATOR_RESTRICTED_TRIPADVISOR`
- status: **RED**
- lead only
- no scraped/manual commercial content extraction as a HOY dataset without written permission
- no public reuse of Tripadvisor content
- transferability: no
- replacement required: yes

Reason:
Tripadvisor's published terms prohibit copying/redistribution without written permission, commercial use outside expressly permitted programs and automated/manual extraction inconsistent with the agreement.

Policy evidence checked 2026-08-18:
`https://tripadvisor.mediaroom.com/DE-terms-of-use`

## 7. RED — Meta / Facebook / Instagram

Observed current usage:

- Instagram: 7 references in `menu_discovery_checks`
- Facebook: 4 references across discovery/menu/restaurant contexts

Operational classification:

- source class: `SOCIAL_RESTRICTED_META`
- status: **RED**
- lead only
- automated collection: no without Meta permission
- data resale/licensing: not an assumed right
- transferability as a HOY data asset: no
- replacement required for material facts

Reason:
Meta's terms prohibit automated access/collection without prior permission. The automated-data terms also require express written permission and narrowly limit use of collected data.

Policy evidence checked 2026-08-18:
`https://www.facebook.com/legal/automated_data_collection_terms`

## 8. RED — Waze

Observed current usage:

- `www.waze.com`: 5 references

Operational classification:

- source class: `MAP_PLATFORM_RESTRICTED_WAZE`
- status: **RED** (conservative fail-closed)
- lead only
- no copying/saving of Waze database content into the transferable HOY dataset
- replacement required: yes
- direct-current-terms capture still pending in the legal evidence vault

This status may only be relaxed after direct terms/licence evidence supports the specific HOY use.

## 9. GREEN — IGN / CNIG geographic data

Observed current usage:

- `api-features.ign.es`: 2 references in `mobility_municipal_boundaries`

Operational classification:

- source class: `OPEN_GOV_IGN`
- status: **GREEN**
- persistent reuse: yes, subject to licence conditions
- derivative use: yes, subject to conditions
- commercial use: yes, subject to conditions
- transferability: `YES_WITH_CONDITIONS`
- attribution required: yes

The IGN/CNIG data policy states that covered geographic data and derivatives are available under a licence compatible with CC BY 4.0 and requires source/ownership recognition plus applicable update/reuse metadata.

Policy evidence checked 2026-08-18:
`https://www.ign.es/web/ign/portal/politica-datos`

## 10. AMBER — first-party business websites

HOY does **not** classify a business's own website as RED by default. It is a materially better evidence source than a third-party directory.

However, first-party source does not mean HOY owns the website's creative content.

Operational rule:

### Permitted for the research workflow

- limited factual verification;
- checking whether a business publicly claims a service/property;
- storing HOY-created provenance metadata and timestamp;
- using the source as a lead for later Business Confirmation.

### Not automatically cleared

- copying marketing copy;
- copying photographs/logos;
- copying complete menus as creative/database content;
- automated crawling at scale;
- redistributing original source content;
- sublicensing the business's original content;
- claiming exit transferability of the source content.

Status remains **AMBER** until operator/business terms or another legal basis clears the intended use.

## 11. Gastro menu-specific boundary

A `menu_sources.source_authority = first_party` value means the restaurant/operator controls or publishes the source. It does **not** mean HOY owns the source content.

Accordingly:

- first-party menu facts can support research and verification;
- HOY-created normalization, taxonomy, provenance, matching semantics and freshness history may be HOY IP/data;
- full menu creative content, images/PDFs and source database structure are not treated as transferable HOY property without rights evidence;
- operator onboarding/business terms should explicitly license the required storage/display/normalization/translation/transfer uses.

## 12. Works rights heatmap

Live audit after Works migration `20260818194934_ir02b_source_rights_registry`:

| Rights status | Distinct hosts | Current source references | Meaning |
|---|---:|---:|---|
| AMBER | 81 | 171 | Business websites / first-party sources |
| REVIEW_REQUIRED | 3 | 7 | Directory sources requiring replacement or direct terms clearance |

Current Works directory sources requiring review/replacement:

- `www.love-lamangaclub.es`
- `www.losbelones.com`
- `www.paginasamarillas.es`

Works therefore has a substantially cleaner source profile than Gastro, but the first-party material is still not blanket proprietary HOY content.

## 13. EU database-right boundary

HOY distinguishes individual facts from database rights.

Under Directive 96/9/EC, a qualifying database maker may prevent extraction/re-utilization of all or a substantial part of a protected database, and repeated/systematic extraction of insubstantial parts can also be restricted when it conflicts with normal exploitation or harms the maker's legitimate interests.

Therefore the HOY policy is:

> Do not build the HOY data moat by systematically replicating a third-party directory, even where many individual facts are mundane.

The preferred data-moat path is:

`third-party lead → first-party/operator confirmation → HOY verification/freshness/history → HOY-created analytics/intelligence`

## 14. Replacement queue

### Priority R0 — remove restricted-source dependence from material business identity/freshness facts

1. Google-origin restaurant master evidence — 101 restaurant references + 1 hours reference.
2. Restaurant Guru — menu/hours/restaurant references.
3. Tripadvisor — hours/restaurant references.
4. Waze — restaurant/hours references.
5. Facebook/Instagram — menu discovery/restaurant source references.

**Important:** replacement does not necessarily mean deleting the historic URL immediately. It means the restricted source may remain as an internal provenance/history pointer, but HOY must not rely on its content as the legal basis for the transferable/commercial dataset.

### Priority R1 — clear or replace unreviewed directories

- Gastro `REVIEW_REQUIRED` hosts ordered by usage count.
- Works directory hosts listed above.

### Priority R2 — convert AMBER first-party evidence into business-confirmed rights

During Business Claim/Onboarding:

- operator confirms factual profile data;
- operator licenses required data/media uses;
- HOY stores confirmation timestamp/version;
- transfer/change-of-control clause is captured;
- source rights can then move from `AMBER` toward an appropriate `GREEN`/contract-cleared state for the specific fields.

## 15. Future ingestion gate

A new domain must not silently inherit rights from another source.

Default:

`new host → REVIEW_REQUIRED`

Only a documented policy/legal review may change:

- `rights_status`;
- permitted uses;
- transferability;
- automation permission;
- attribution requirements.

No importer should infer `GREEN` merely from:

- HTTPS;
- public visibility;
- being an official-looking website;
- being accessible without login;
- appearing in a search engine;
- an API responding successfully.

## 16. Investor / buyer claim boundary

### Defensible now

HOY has implemented a live rights-governance layer that distinguishes restricted references, first-party evidence, open-licensed data and unresolved sources.

HOY can demonstrate that restricted sources are identified and queued for re-sourcing rather than being falsely marketed as proprietary data.

### Not defensible yet

- "All 169 restaurant records are proprietary HOY data."
- "All menu data is freely transferable."
- "All public-source data can be sold."
- "All first-party website content belongs to HOY."

### Target state

For material product fields, HOY should increasingly rely on:

1. Business Confirmed data under HOY Business Terms;
2. HOY Verified/field-research evidence;
3. licensed/open data with captured conditions;
4. HOY-created freshness/verification history;
5. clean post-cutover first-party product analytics;
6. lawfully derived aggregated intelligence.

## 17. IR-02B gate

**Operational rights registry:** COMPLETE  
**High-risk platform policy triage:** COMPLETE  
**IGN licence classification:** COMPLETE  
**Works first-party/directory classification:** COMPLETE  
**Restricted-source replacement:** IN PROGRESS / NOT COMPLETE  
**Per-domain review of all remaining REVIEW_REQUIRED sources:** NOT COMPLETE  
**Business contractual rights:** NOT COMPLETE  
**Final legal counsel sign-off:** NOT COMPLETE

Current DD conclusion:

> HOY has moved from an undocumented-source dataset to a rights-aware dataset with explicit legal/transferability gates. The next value step is to reduce the 197 RED Gastro references and convert AMBER first-party facts into business-confirmed/contract-cleared first-party data.
