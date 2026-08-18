# HOY Investor Ready v1.0 — IR-02B Source & Data Rights Clearance

**Audit date:** 2026-08-18  
**Status:** OPERATIONALLY IMPLEMENTED / LEGAL COUNSEL REVIEW STILL REQUIRED  
**Scope:** HOY Gastro/Core + HOY Works live source inventories

> IR-02B is an operational DD control, not a legal opinion. Public visibility of data does not by itself establish a right to persist, copy, commercialise, derive from or transfer source content.

## 1. Live rights-governance layer

Both HOY La Manga and HOY Works now contain internal controls:

- `private.source_rights_registry`
- `private.source_usage_inventory`
- RLS enabled
- explicit deny policies for `anon` and `authenticated`
- registry access withheld from client roles
- new/unclassified hosts default to `REVIEW_REQUIRED`

For every source host the registry can capture source class, GREEN/AMBER/RED/REVIEW_REQUIRED status, lead use, factual-verification permission, persistence/reuse/derivative/commercial/automation permissions, attribution, replacement requirement, transferability and review evidence.

HOY's governing distinction is:

**source exists ≠ HOY owns it ≠ HOY may copy it ≠ HOY may commercialise it ≠ HOY may transfer it at exit.**

## 2. Gastro/Core — current live heatmap

After the initial rights registry, explicit client deny policies and a deterministic first-party self-match pass:

| Rights status | Hosts | Source references | Meaning |
|---|---:|---:|---|
| **GREEN** | 1 | 2 | reusable/open basis captured; licence conditions apply |
| **AMBER** | 52 | 200 | first-party/operator/vendor evidence usable for limited factual verification; broader rights not assumed |
| **RED** | 14 | 197 | restricted platform/aggregator/social reference; lead only; replacement required |
| **REVIEW_REQUIRED** | 38 | 60 | insufficient rights decision so far |

**Total: 105 distinct source hosts / 459 current source references.** These are source-reference counts, not unique businesses or facts.

The deterministic self-match pass moved **8 hosts / 43 references** from REVIEW_REQUIRED to AMBER only where the source host exactly matches the stored business website host for the corresponding restaurant. This is evidence of first-party sourcing, not a blanket content licence.

## 3. RED source classes

### Google Maps / Google-source references

Current concentration includes `www.google.com` with **102 references**. HOY classifies these references as RED for transferable/commercial dataset use: they may remain provenance/lead pointers, but material facts must be re-sourced before being treated as HOY-owned/transferable data.

Reason: current Google Maps Platform EEA terms restrict scraping/exporting Google Maps Content, provide examples including copying/saving business names and addresses, and restrict caching/creation of content except where service-specific terms permit it.

### Restaurant Guru

Current Restaurant Guru-family references include 22 on `es.restaurantguru.com`, 17 on `restaurantguru.com` plus smaller image/menu hosts. Classification: RED / lead only / replacement required.

Reason: current Restaurant Guru terms frame content access around personal use and prohibit scraping/copying and incorporation into third-party products/services without the required permission.

### Tripadvisor

Current references span multiple Tripadvisor country domains. Classification: RED / lead only / replacement required.

Reason: Tripadvisor's published terms restrict copying/redistribution, commercial use outside permitted programs and automated/manual extraction without the required permission.

### Meta / Facebook / Instagram

Current source references include Instagram discovery links and Facebook restaurant/menu links. Classification: RED / lead only / replacement required.

Reason: Meta's current automated-data terms require express permission for automated collection and limit subsequent use.

### Waze

Current Waze references: 5. Classification: **RED conservatively / fail-closed**, pending direct-current-terms evidence for the exact use. This is intentionally a risk-control status rather than a final legal conclusion.

## 4. GREEN source class — IGN/CNIG

`api-features.ign.es` currently contributes 2 mobility-boundary source references.

Classification: **GREEN / YES_WITH_CONDITIONS**.

The current IGN/CNIG data policy permits reuse of covered geographic data/derivatives under conditions compatible with CC BY 4.0, including attribution/source requirements. HOY therefore keeps attribution and licence metadata with this data.

## 5. AMBER — first-party business references

A business's own website is materially better evidence than a third-party directory, but it does not make the site's creative content HOY property.

AMBER permits HOY's controlled research workflow to use the source for limited factual verification and provenance. It does **not** automatically clear:

- marketing copy;
- photographs/logos;
- wholesale menu/content copying;
- automated crawling at scale;
- redistribution/sublicensing;
- exit transferability of the source content.

The path from AMBER toward contract-cleared first-party data is **Business Confirmation under HOY Business Terms**, with explicit storage/display/normalisation/analytics/media/change-of-control rights appropriate to each field/content class.

For menu data, `source_authority = first_party` means the operator controls/publishes the source; it does not mean HOY owns the underlying menu content. HOY-created normalization, taxonomy, provenance, trust/freshness history and matching semantics remain separately assessable HOY IP/data.

## 6. Works — current live heatmap

| Rights status | Hosts | Source references |
|---|---:|---:|
| **AMBER** | 81 | 171 |
| **REVIEW_REQUIRED** | 3 | 7 |

Works has **84 hosts / 178 current references** in this registry. The three directory review/replacement hosts are:

- `www.love-lamangaclub.es`
- `www.losbelones.com`
- `www.paginasamarillas.es`

The Works production Security Advisor reports **0 findings** after the rights-registry deployment and explicit deny policies.

## 7. Database-right boundary

HOY does not equate 'individual fact' with 'free right to replicate a database'. EU database law can protect qualifying database investment against extraction/re-utilization of substantial parts and, in specified circumstances, repeated/systematic extraction of insubstantial parts.

Therefore HOY's data-moat strategy is deliberately:

**third-party lead → first-party/operator confirmation → HOY verification/freshness/history → HOY-created analytics/intelligence**

rather than copying third-party directories into a proprietary-looking dataset.

## 8. Replacement and clearance queue

### R0 — restricted-source replacement

Highest priority:

1. Google-origin business identity/hours evidence;
2. Restaurant Guru menu/hours/restaurant evidence;
3. Tripadvisor hours/restaurant evidence;
4. Waze restaurant/hours evidence;
5. Facebook/Instagram evidence where material.

A RED URL may remain as historical provenance, but it must not be the legal foundation for a transferable/commercial HOY data claim.

### R1 — remaining REVIEW_REQUIRED

Gastro: **38 hosts / 60 references** remain unresolved and must be reviewed by usage/materiality. Works: 3 hosts / 7 references remain directory review items.

### R2 — AMBER → Business Confirmed / contract-cleared

For high-value facts and content, operator onboarding should capture:

- factual confirmation;
- required data/media licence;
- confirmation timestamp/version;
- permitted storage/display/normalisation/translation/analytics use;
- change-of-control/transferability where appropriate.

## 9. Future ingestion gate

Every new source starts:

`new host → REVIEW_REQUIRED`

No system may infer GREEN from HTTPS, public visibility, an official-looking domain, search-engine presence or successful API access. A documented review must explicitly set permitted use and transferability.

The branch now includes `scripts/check-ir02b-source-rights.mjs` and `npm run qa:rights`; Critical PR QA runs this policy gate so RED classes cannot silently gain persistence/commercial/derivative/automation rights or transferability.

## 10. Investor / buyer claim boundary

### Defensible now

> HOY has a live rights-governance layer that separates restricted references, first-party evidence, open-licensed data and unresolved sources, and it has a concrete replacement path for non-transferable dependencies.

### Not defensible yet

- all 169 restaurant records are proprietary HOY data;
- all menu data is freely transferable;
- all public-source data may be sold;
- all first-party website content belongs to HOY.

### Target state

The highest-value transferable HOY data layer should increasingly consist of:

1. Business Confirmed data under HOY terms;
2. HOY Verified field evidence;
3. open/licensed data with captured conditions;
4. HOY-created verification/freshness history;
5. clean first-party product analytics;
6. lawfully derived aggregated intelligence.

## 11. Production migrations

HOY La Manga:

- `20260818194908_ir02b_source_rights_registry`
- `20260818195705_ir02b_source_rights_explicit_deny`
- `20260818195951_ir02b_first_party_self_match_classification`

HOY Works:

- `20260818194934_ir02b_source_rights_registry`
- `20260818195713_ir02b_source_rights_explicit_deny`

## 12. IR-02B gate

**Operational rights registry:** COMPLETE  
**Client-role fail-closed protection:** COMPLETE  
**High-risk platform policy triage:** COMPLETE  
**Deterministic first-party self-match pass:** COMPLETE  
**IGN conditional open-data classification:** COMPLETE  
**Works first-party/directory classification:** COMPLETE  
**Restricted-source replacement:** NOT COMPLETE  
**Remaining per-domain review:** NOT COMPLETE  
**Business contractual rights:** NOT COMPLETE  
**Final legal counsel sign-off:** NOT COMPLETE

Current conclusion:

> HOY has moved from an undocumented-source dataset to a rights-aware dataset with explicit use and transferability gates. The next valuation-relevant step is to replace the 197 RED Gastro references and convert high-value AMBER facts into business-confirmed, contract-cleared first-party data.
