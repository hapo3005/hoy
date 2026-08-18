# HOY Investor Ready v1.0 — IR-02B Source & Data Rights Clearance

**Audit date:** 2026-08-18  
**Status:** OPERATIONALLY IMPLEMENTED / RIGHTS REPLACEMENT & LEGAL SIGN-OFF PENDING  
**Scope:** HOY Gastro/Core + HOY Works live source inventories

> Operational DD control, not a legal opinion. Public visibility of a source does not establish ownership, commercial reuse, derivative-use or exit-transfer rights.

## Live control architecture

Both HOY La Manga and HOY Works now use internal source-rights governance:

- `private.source_rights_registry`
- `private.source_usage_inventory`
- RLS enabled
- explicit deny policies for `anon` and `authenticated`
- new/unclassified hosts default to `REVIEW_REQUIRED`
- source existence, provenance, trust, usage rights and transferability are separate dimensions

The repository also includes a machine-readable policy snapshot and `npm run qa:rights`; Critical PR QA runs this policy gate so RED source classes cannot silently gain persistence/commercial/derivative/automation rights or transferability.

## Gastro/Core — final typed baseline for 2026-08-18

| Status | Hosts | References |
|---|---:|---:|
| **GREEN** | 1 | 2 |
| **AMBER** | 64 | 216 |
| **RED** | 14 | 197 |
| **REVIEW_REQUIRED** | 26 | 44 |
| **TOTAL** | **105** | **459** |

There are now **0 untyped/UNREVIEWED hosts**.

The 26 REVIEW_REQUIRED hosts are no longer generic unknowns:

| Source class | Hosts | References |
|---|---:|---:|
| Directory, uncleared | 19 | 36 |
| Editorial third party | 2 | 3 |
| Platform/vendor, uncleared | 3 | 3 |
| Directory/editorial, uncleared | 1 | 1 |
| First-party source for a different entity / provenance mismatch | 1 | 1 |

## RED — replacement required

Current restricted high-concentration references include:

- Google: 102 refs on `www.google.com`
- Restaurant Guru family: material menu/hours/restaurant references
- Tripadvisor country domains: material hours/restaurant references
- Instagram/Facebook source references
- Waze references

For IR-02B, RED means **not approved as the legal basis of a transferable/commercial HOY dataset**. It does not mean HOY must erase every historical provenance URL. The preferred remediation is to keep any useful audit pointer while re-sourcing material facts from operator, HOY-verified or properly licensed evidence.

Google Maps Platform EEA terms restrict extraction/scraping, caching and creation/use of Maps Content outside permitted service-specific use. Restaurant Guru's current terms restrict scraping/copying and third-party product integration. Tripadvisor's published terms restrict unauthorized copying/commercial use/extraction. Meta requires permission for automated data collection. Waze remains conservatively RED pending direct current terms evidence for the exact HOY use.

## GREEN — conditional open data

`api-features.ign.es`: 2 current references.

The IGN/CNIG data policy permits reuse of covered geographic data and derivatives under conditions compatible with CC BY 4.0. HOY therefore records attribution/licence conditions and classifies the source `GREEN / YES_WITH_CONDITIONS`, not unrestricted ownership.

## AMBER — limited factual evidence, not content ownership

AMBER covers first-party business references, operator-authorized/official references and ordinary official-government pages where broader reuse/transfer rights are not yet established.

AMBER supports limited factual verification and provenance. It does **not** automatically authorize copying marketing copy, photos/logos, wholesale menu content, automated crawling, redistribution, sublicensing or exit transfer of source content.

A deterministic pass upgraded sources only where evidence justified it:

- exact source-host = stored business-website-host matches;
- HOY's own source tables mark a source official/authorized;
- HOY discovery evidence identifies an official operator website/vendor reservation page;
- current web verification confirms first-party provider sites;
- municipal sources are confirmed official, while ordinary web pages remain AMBER unless the exact material is shown to be covered by a reuse/open-data licence.

Example of deliberate restraint: Cartagena publishes open-data datasets under CC BY 3.0 conditions, but HOY's current `www.cartagena.es` mobility references point to ordinary municipal pages. They therefore remain `OFFICIAL_GOV_REFERENCE / AMBER` unless the exact material is migrated to a covered open-data dataset.

## Provenance mismatch caught

HOY's own discovery evidence records that a `grupojojara.es` source relates to the previous/different Bongo Beach identity and must not be used as evidence for the current Umai Beach entity. That host is therefore typed `FIRST_PARTY_OTHER_ENTITY_REFERENCE`, remains REVIEW_REQUIRED and requires replacement for the affected fact path.

This demonstrates that **first-party source quality and entity correctness are separate gates**.

## Works — current baseline

| Status | Hosts | References |
|---|---:|---:|
| **AMBER** | 81 | 171 |
| **REVIEW_REQUIRED** | 3 | 7 |
| **TOTAL** | **84** | **178** |

The remaining directory review queue is:

- `www.love-lamangaclub.es`
- `www.losbelones.com`
- `www.paginasamarillas.es`

Post-deploy Supabase Security Advisor: **0 findings**.

## Database-right boundary

HOY does not equate mundane individual facts with permission to replicate a third-party database. EU database law can protect qualifying database investment against extraction/re-utilization of substantial parts and, under specified conditions, repeated/systematic extraction of insubstantial parts.

HOY's intended moat path is therefore:

**third-party lead → first-party/operator confirmation → HOY verification/freshness/history → HOY-created analytics/intelligence**

rather than systematic replication of third-party directories.

## Replacement / clearance queue

### R0 — replace RED dependencies

Priority: Google → Restaurant Guru → Tripadvisor → Waze → Facebook/Instagram, weighted by field materiality and reference count.

### R1 — clear 26 REVIEW_REQUIRED Gastro hosts / 44 refs

The remaining sources are already typed. Each now needs either direct terms/licence clearance, operator authority, or re-sourcing.

### R2 — convert AMBER into contract-cleared first-party data

During Business Claim/Onboarding, HOY Business Terms should capture appropriate rights for:

- factual profile confirmation;
- storage/display/normalisation;
- operator-supplied media/content where used;
- translations/derived product functionality where applicable;
- analytics/verification/freshness history;
- change-of-control/transferability.

## Investor / buyer claim boundary

Defensible now:

> HOY operates a live rights-governance layer that separates restricted references, first-party/official evidence, conditionally open-licensed data and specifically typed unresolved sources, with a concrete remediation path.

Not defensible yet:

- all 169 restaurant records are proprietary HOY data;
- all menu data is freely transferable;
- all public-source data may be sold;
- all first-party website content belongs to HOY.

## Production migrations

HOY La Manga:

1. `20260818194908_ir02b_source_rights_registry`
2. `20260818195705_ir02b_source_rights_explicit_deny`
3. `20260818195951_ir02b_first_party_self_match_classification`
4. `20260818200216_ir02b_official_source_and_directory_classification`
5. `20260818200500_ir02b_remaining_source_type_classification`

HOY Works:

1. `20260818194934_ir02b_source_rights_registry`
2. `20260818195713_ir02b_source_rights_explicit_deny`

## IR-02B Gate

**Operational rights registry:** COMPLETE  
**Client-role fail-closed protection:** COMPLETE  
**All current Gastro source hosts typed:** COMPLETE  
**High-risk platform policy triage:** COMPLETE  
**Works source typing:** COMPLETE  
**Restricted-source replacement:** NOT COMPLETE  
**Remaining rights clearance:** NOT COMPLETE  
**Business contractual rights:** NOT COMPLETE  
**Final legal counsel sign-off:** NOT COMPLETE

Current conclusion:

> HOY has moved from an undocumented-source dataset to a rights-aware dataset with explicit use, evidence and transferability gates. The next valuation-relevant task is no longer classification: it is replacing the **197 RED Gastro references** and converting high-value AMBER data into Business Confirmed, contract-cleared first-party assets.
