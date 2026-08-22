# HOY Investor Ready — RT-007 Data Rights v1.1

**Status:** IN PROGRESS / FAIL-CLOSED EXPORT MECHANICS IMPLEMENTED  
**Date:** 2026-08-18  
**Production mutation:** NONE in this change  
**Contact freeze:** remains ON

## Purpose
HOY must distinguish factual discovery from transferable commercial data rights. A URL being public does not make source content a HOY-owned dataset. No investor/buyer claim may describe restricted third-party content as proprietary HOY data.

## Live Production baseline — refreshed 2026-08-18
Registry-backed source usage:
- GREEN: **1 host / 2 references**
- AMBER: **64 hosts / 216 references**
- RED: **14 hosts / 197 references**; all 197 remain `replacement_required=true`
- REVIEW_REQUIRED: **26 hosts / 44 references**; all 44 currently replacement-required in usage inventory
- total: **105 hosts / 459 references**

Direct provenance fields on `restaurants` currently reconcile to:
- RED: **326 field references / 153 restaurants**
- AMBER: **115 / 52**
- REVIEW_REQUIRED: **14 / 9**
- NO_REGISTRY: **3 / 3**

RED registry policy integrity: **0 failures**. No RED source is currently marked persistent-copy/public-reuse/derivative/commercial/automated-use permitted or transferable.

Business-rights state:
- Business Terms v1.0: `draft`
- active Business Terms versions: **0**
- Business Terms acceptances: **0**
- Business Data Confirmations: **0**

Therefore RT-007 must remain **IN PROGRESS** even though RED policy integrity itself is GREEN.

## Buyer-DD external-source buckets — live verified
The read-only `rt007-transferability-export.sql` reconciles current external-source inventory to:

| Buyer bucket | Hosts | References | Meaning |
|---|---:|---:|---|
| TRANSFERABLE_OR_LICENSED_NOW | 1 | 2 | GREEN source with current commercial/derivative/transfer conditions satisfied at registry level |
| CONDITIONAL_NOT_YET_TRANSFERABLE | 64 | 216 | AMBER; authority/licence/business-terms chain not closed |
| REFERENCE_RESTRICTED_REPLACE | 14 | 197 | RED; provenance/lead-only, not proprietary-data valuation, replacement required |
| REVIEW_REQUIRED | 26 | 44 | fail closed pending direct review/re-source |

This table covers **registered external-source references**, not all HOY-created value. It does not count HOY taxonomy/structure, HOY-created measurements, freshness/verification history, future business-confirmed facts or lawful HOY event/intelligence data merely because they are not external-source records.

## Three NO_REGISTRY direct-provenance blockers
Current direct provenance has three fields whose host is not yet in the registry:
1. Area Sunset — `signature_source_url` — `www.thefork.es`
2. Cala Reona Beach Club — `signature_source_url` — `elpais.com`
3. Collados Beach — `signature_source_url` — `elpais.com`

Official terms reviewed 2026-08-18 support conservative treatment:
- **TheFork:** current terms prohibit copying/reproduction/redistribution of platform content without prior written authorization and prohibit monitoring/extracting/copying platform architecture/content/data using scraper/robot or manual/automatic processes. Proposed HOY treatment: `RED`, replacement required, no transferability claim for platform content.
- **EL PAÍS:** current legal notice reserves intellectual-property rights, expressly restricts reproduction/transformation/distribution/public communication without authorization and reserves machine-reading/AI uses. Proposed HOY treatment for these article references: `REVIEW_REQUIRED` / provenance-only until replaced; article content is not valuation-grade HOY data.

No Production registry mutation is made by this PR. The reviewed recommendations are captured in the live snapshot for controlled later remediation.

## Binding data-rights classes

### A — HOY-created non-personal data
Examples: HOY taxonomy, entity IDs, verification timestamps, freshness history, internal QA state, Region OS configuration, source-independent structured measurements created by HOY.

Default commercial position: transferable/commercially usable by HOY/Parent, subject to third-party inputs and applicable law.

### B — Business-confirmed / contract-supplied data
Examples: operator-confirmed hours, services, accessibility facts, offers, menus, media uploaded under HOY Business Terms.

Default commercial position: usable/transferable only to the extent the Business Terms grant the required rights. Creative media/menu text/photos/trademarks remain separately governed. **Current state: no active terms/acceptances/confirmations yet, so this class is not currently evidenced as a live rights-cleared asset.**

### C — HOY user / transaction / intent data
Examples: intent sessions, searches, qualified actions, lead outcomes, conversion events.

Personal data is not a commodity HOY simply “owns”. RT-008 governs legal basis, purpose, transparency, retention, sharing and anonymisation. Commercial BI may use only lawful/purpose-compatible and sufficiently aggregated/anonymised outputs.

### D — Open-licensed / public-sector data
Reuse only under applicable licence/attribution/update conditions. Current registry has one GREEN open-government source class.

### E — First-party business public-web references
Use conservatively as leads/limited factual verification. Do not persist/re-publish protected creative content without explicit rights. Operator confirmation/business terms should replace public-web dependency for launch-critical facts.

### F — Restricted platform / aggregator / social data
Examples: Google Maps, Tripadvisor, Restaurant Guru, Meta/Facebook/Instagram, Waze; TheFork is proposed for this treatment based on current reviewed terms.

Lead/reference only. No persistent copy, public reuse, derivative commercial dataset or proprietary-data claim unless a specific written licence/program grants it. Replacement required.

### G — Unknown / unreviewed source
Fail closed. No public reuse, derivative use, automated collection or commercial-data claim until reviewed.

## Derived-signal rule
A derived value is **not automatically safe because HOY calculated it**.

A derived signal can enter the transferable HOY data asset only when every material upstream input is HOY-created, sufficiently business-confirmed/contract-supplied, lawfully processed HOY event data, or open/licensed data that permits the intended derivation/commercial use. Restricted/unknown upstream inputs keep the derived output blocked from proprietary/transferable claims unless the restriction is removed.

## Investor-safe HOY Data description
Allowed:
> HOY builds a proprietary local knowledge and intent layer from HOY-created structure, source-independent verification/freshness history, business-confirmed information, lawful user/action signals and rights-cleared/open inputs.

Not allowed:
> HOY owns all restaurant/local-business data it has collected from the web.

## Implemented evidence/export controls
- `docs/investor-ready/rt007-live-rights-snapshot-2026-08-18.json` — current read-only Production evidence and gate state.
- `scripts/investor-ready/rt007-data-rights-audit.sql` — registry/provenance/readiness audit.
- `scripts/investor-ready/rt007-transferability-export.sql` — reproducible Buyer-DD source ledger partitioning transferable/conditional/restricted/review-required data without exporting restricted raw URLs as asset value.
- `scripts/investor-ready/check-rt007-rights-snapshot.mjs` — prevents a false GREEN claim while live blockers remain.
- `Investor Ready RT-007 Rights Snapshot Gate` — CI enforcement of snapshot reconciliation and claim boundaries.

The live export was executed read-only against Production and returned `rt007_next_gate = BLOCK_REGISTRY_COVERAGE` because 3 direct provenance fields remain unregistered.

## F0-M Data Rights gate
Market Contact Release cannot pass until:
- direct provenance registry coverage is complete or affected facts fail closed/are re-sourced;
- no launch-critical public claim relies solely on RED/unknown evidence;
- RED current-fact evidence is replaced by operator/HOY/open-licensed evidence or affected fact becomes unknown;
- remaining REVIEW_REQUIRED sources in launch-critical flows are reviewed/re-sourced;
- Business Terms are legally cleared/active before relying on operator-supplied rights;
- operator confirmations exist for the facts HOY intends to call Business Confirmed;
- RT-008 governs personal/user-event data;
- clean export segregates transferable, conditional and restricted provenance.

## F1-I investor gate
Investor data-room claims must reconcile to the live rights ledger/export. No valuation uplift may be attributed to RED/unknown third-party content. AMBER is conditional, not current proprietary value. Derived-data value is recognized only where upstream rights + privacy conditions are documented.

## Current gate
**RED policy integrity:** GREEN / 0 failures  
**External-source transferability export:** IMPLEMENTED + LIVE VERIFIED  
**Direct provenance registry coverage:** RED / 3 NO_REGISTRY fields  
**Business Terms:** DRAFT / 0 active  
**Business Terms acceptances:** 0  
**Business Data Confirmations:** 0  
**RT-007 overall:** IN PROGRESS  
**F0-M:** BLOCKED  
**F1-I:** BLOCKED
