# HOY Investor Ready — RT-007 Data Rights v1.0

Status: IN PROGRESS  
Date: 2026-08-18  
Production mutation: NONE in this change  
Contact freeze: remains ON

## Purpose
HOY must distinguish factual discovery from transferable commercial data rights. A URL being public does not make the source content a HOY-owned dataset. No investor, buyer or customer claim may describe restricted third-party content as proprietary HOY data.

## Live baseline
The Production database already contains:
- `private.source_rights_registry`
- `private.source_usage_inventory`

Current registry-backed source usage snapshot:
- RED: 14 hosts / 197 source references / all 197 `replacement_required=true`
- AMBER: 44 hosts / 157 references
- REVIEW_REQUIRED: 46 hosts / 103 references
- GREEN: 1 host / 2 references
- total: 105 hosts / 459 references

The `restaurants` table also has direct provenance fields (`source_url`, `location_source_url`, `hours_source_url`, `signature_source_url`). In the current snapshot, 326 such field references across 153 restaurants resolve to RED hosts. This does **not** prove that every displayed fact was unlawfully copied; it means the chain of evidence is not clean enough to treat those facts as a transferable HOY asset until they are re-sourced or independently confirmed.

## Binding data-rights classes

### A — HOY-created non-personal data
Examples: HOY taxonomy, entity IDs, verification timestamps, freshness history, internal QA state, Region OS configuration, source-independent structured measurements created by HOY.

Default commercial position: transferable/commercially usable by Parent, subject to third-party inputs and applicable law.

### B — Business-confirmed / contract-supplied data
Examples: operator-confirmed hours, services, accessibility facts, offers, menus, media uploaded under HOY business terms.

Default commercial position: usable/transferable only to the extent the business terms grant HOY the required rights. Creative media, menu text/photos and trademarks remain separately governed; factual confirmation does not automatically transfer copyright.

### C — HOY user / transaction / intent data
Examples: intent sessions, searches, qualified actions, lead outcomes, conversion events.

Default commercial position: personal data is not a commodity that HOY simply “owns”. It is processed under GDPR and HOY terms/privacy notices. Commercial BI may use only lawfully processed, purpose-compatible and sufficiently aggregated/anonymised outputs. Re-identification risk must be assessed before treating an output as outside personal-data scope.

### D — Open-licensed / public-sector data
Examples: policy-reviewed IGN/CNIG datasets.

Default commercial position: reuse permitted only under the applicable licence/attribution/update conditions. Licence obligations travel with the relevant dataset/output.

### E — First-party business public web references
Examples: a restaurant’s own public website or hosted menu.

Default commercial position: may be used conservatively as a lead and for limited factual verification. Do not persist/re-publish creative copy, full menus, photos or other protected content without explicit rights/business terms. Operator confirmation should replace public-web dependency for launch-critical facts.

### F — Restricted platform / aggregator / social data
Examples currently classified RED: Google Maps, Tripadvisor, Restaurant Guru, Meta/Facebook/Instagram, Waze.

Default commercial position: lead/reference only. No persistent copy, public reuse, derivative commercial dataset or proprietary-data claim unless a specific written licence/program grants it. `replacement_required=true`.

### G — Unknown / unreviewed source
Default: fail closed. Lead/reference only. No public reuse, derivative use, automated collection or commercial data claim until reviewed.

## Derived-signal rule
A derived value is **not automatically safe because HOY calculated it**.

A derived signal can enter the transferable HOY data asset only when all material upstream inputs are one of:
1. HOY-created data;
2. business-confirmed/contract-supplied data with sufficient rights;
3. lawfully processed HOY user/event data under privacy controls; or
4. open/licensed data whose conditions allow the intended derivation and commercial use.

If an upstream source forbids derivative use or commercial reuse, the derived signal remains blocked. Google Maps and Meta terms are specifically treated as non-derivable for HOY’s commercial data asset without permission.

## Investor-safe description of HOY Data
Allowed framing:
> HOY builds a proprietary local knowledge and intent layer from HOY-created structure, source-independent verification/freshness history, business-confirmed information, lawful user/action signals and rights-cleared/open inputs.

Not allowed:
> HOY owns all restaurant/local-business data it has collected from the web.

## F0-M Data Rights gate
Market Contact Release cannot pass until:
- no launch-critical public claim relies solely on a RED source;
- all RED source references used for current facts are replaced by operator/HOY/open-licensed evidence or the affected fact fails closed to unknown;
- all remaining REVIEW_REQUIRED sources used in launch-critical flows are reviewed or removed from those flows;
- business pilot terms contain the rights needed for operator-submitted facts/media;
- personal-data classes are routed to RT-008 GDPR controls;
- a clean export can separate transferable HOY data from restricted/reference-only provenance.

## F1-I investor gate
Investor data-room claims must reconcile to an exportable rights ledger. No valuation uplift may be attributed to RED/unknown third-party content. Derived-data value is recognized only where upstream rights + privacy conditions are documented.

## Current positive control
The live registry already marks Google Maps, Tripadvisor, Restaurant Guru and Meta sources as RED and requires replacement. This is the correct baseline. RT-007 is therefore a remediation/segregation task, not a request to re-label restricted sources as safe.
