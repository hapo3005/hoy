# HOY Investor Ready v1.0 — IR-02C Business Terms & First-Party Data Clearance

**Audit date:** 2026-08-18  
**Status:** TECHNICAL INFRASTRUCTURE LIVE / TERMS NOT ACTIVE  
**Scope:** HOY Gastro/Core operator relationship and Business Confirmed data evidence  

## 1. Objective

IR-02C converts the IR-02B target state — `AMBER research → Business Confirmed / contract-cleared first-party data` — into a versioned contract/evidence architecture.

> A business website, public listing or operator account does not by itself create a transferable HOY first-party data asset.

HOY requires an evidence chain linking authorization, exact contract version and exact confirmed data snapshot.

## 2. Legal/document package

Prepared:

- `docs/legal/HOY_BUSINESS_DATA_MEDIA_TERMS_v1.0_DE.md`
- `docs/legal/HOY_BUSINESS_DATA_MEDIA_TERMS_v1.0_ES_DRAFT.md`
- `docs/legal/HOY_BUSINESS_TERMS_ACCEPTANCE_SPEC_v1.0.md`

Both contract texts are explicitly non-active drafts. The Spanish document is a legal-localization draft, not a counsel-approved final version.

The draft architecture covers Business Content ownership, defined HOY operational licence, technical formatting/localization/hosting, limited service-provider sublicensing, change-of-control continuity, a no-blanket-raw-content-resale boundary, HOY-created metadata/normalization/provenance, lawful derived/aggregated data, Business Confirmed evidence, accessibility specificity, media/menu/offer/event/live-data handling, termination/history, privacy-role separation and exact-version electronic acceptance.

## 3. Production infrastructure

Production migrations:

1. `20260818201632_ir02c_business_terms_acceptance_infrastructure`
2. `20260818201740_ir02c_business_terms_rpc_security_hardening`
3. `20260818201831_ir02c_business_confirmation_ledger`
4. `20260818202531_ir02c_register_spanish_terms_draft`
5. `20260818203021_ir02c_reconcile_de_terms_draft_blob`

### Internal tables

- `private.business_terms_versions`
- `private.business_terms_acceptances`
- `private.business_data_confirmations`

All three are non-public evidence/control assets. Client roles do not receive direct table access.

## 4. Fail-closed contract activation

`private.business_terms_versions` has an activation constraint.

A Terms version cannot become `active` unless critical evidence is present, including valid final DE and ES SHA-256 values, definitive HOY legal entity/address/contact, privacy-notice version, governing law, jurisdiction, counsel-review evidence and activation/effective timestamps.

Current version `1.0` is `draft`.

The Spanish draft path is registered in Production, but its final SHA-256 remains intentionally empty until legal localization/review is complete. The current German draft Git blob is also explicitly reconciled to Production; final SHA-256 remains intentionally unset.

A negative activation test was executed after deployment: an attempted switch of incomplete v1.0 to `active` was rejected by the database constraint and the row remained `draft`.

Therefore the deployed infrastructure does **not** activate or impose the current draft contract.

## 5. Current live state at implementation

- Terms version 1.0: `draft`
- active Terms gate: `false`
- Business Terms acceptances: `0`
- Business data confirmations: `0`
- verified restaurant memberships: `0`
- operator Terms triggers: `10`

The operator-write trigger layer is therefore dormant and changes no current business/operator behavior.

## 6. Acceptance receipt

When an approved Terms version is eventually active, `operator_accept_business_terms(...)` requires an authenticated user, verified restaurant membership, the exact active Terms version, locale, declared role/method and affirmative authority/content/media/change-of-control/privacy acknowledgements.

The resulting receipt stores the exact Terms version and document SHA-256 and is audit-linked. Draft/inactive Terms cannot be accepted through the endpoint.

## 7. Security architecture

Public Terms RPCs are `SECURITY INVOKER` wrappers:

- `public.get_business_terms_status(...)`
- `public.operator_accept_business_terms(...)`
- `public.operator_record_business_confirmation(...)`

Privileged table access is isolated inside non-public `private` helper functions with explicit authenticated membership checks.

The initial public Terms RPCs were converted from `SECURITY DEFINER` after the Supabase Security Advisor identified them. After hardening, IR-02C does not add new public `SECURITY DEFINER` warnings. Pre-existing reviewed Gastro RPC warnings remain separately tracked under IR-02A.

## 8. Dormant operator-write gates

Terms gates cover profile changes, upgrade requests, offers, event promotions, menu intake, live/special hours, services and media write paths.

Behavior:

- no active Terms version → no contract gate;
- active Terms version + verified member → current matching acceptance required.

## 9. Business Confirmation Ledger

The live `private.business_data_confirmations` table records exact Business Confirmed snapshots.

Each record binds Business/restaurant, authenticated representative, exact Terms acceptance receipt, confirmation type, subject/ref, payload SHA-256, source channel and timestamp/evidence. New confirmations supersede old current confirmations for the same subject rather than deleting history.

This creates a DD-verifiable distinction between observation, operator identity, contract acceptance and exact-data confirmation.

## 10. Data-asset effect

IR-02C does not automatically upgrade the current AMBER source inventory.

Target path:

`AMBER first-party observation → verified operator → active Terms acceptance → exact data confirmation → Business Confirmed + freshness/history → transferable HOY evidence layer`

This avoids falsely upgrading historical research simply because a business later creates an account.

## 11. Automated governance

The branch includes `npm run qa:terms`, executed by Critical PR QA before browser regression.

It fails if key safeguards drift, including removal of draft markers, weakening of activation clearance, public Terms RPCs reverting to `SECURITY DEFINER`, loss of exact version/hash evidence, loss of Business Confirmation payload hashing, removal of change-of-control/raw-content/DPA boundaries, or false assignment of a final Spanish SHA-256.

## 12. Remaining activation blockers

P0 before Business Terms activation:

1. definitive HOY contracting entity and registered/legal details;
2. governing law and jurisdiction decision;
3. final German legal review;
4. final Spanish legal localization/review;
5. Privacy Notice version;
6. controller/processor mapping + DPA where required;
7. final DE/ES document SHA-256 hashes;
8. operator UI to present/store/reproduce exact Terms;
9. electronic acceptance receipt UX;
10. input/error-correction flow;
11. canonical payload hashing implementation;
12. end-to-end contract acceptance and Business Confirmation tests.

## 13. Investor/buyer claim boundary

### Defensible now

- HOY has versioned Business Terms and acceptance infrastructure.
- Activation is technically fail-closed pending legal/entity/localization evidence.
- Acceptance will be bound to an exact document version/hash.
- Business Confirmed data has a separate exact-snapshot evidence ledger.
- Change-of-control continuity is addressed in the contractual draft and designed into acceptance evidence.

### Not defensible yet

- “HOY already has contract-cleared Business Confirmed restaurant data.”
- “All AMBER first-party data is now GREEN.”
- “Business Terms v1.0 is legally active.”
- “All current business/content rights survive an exit.”

## 14. Gate

**Business Terms DE execution draft:** PREPARED  
**Spanish legal-localization draft:** PREPARED / NOT FINAL  
**Terms version/receipt infrastructure:** LIVE  
**Business Confirmation Ledger:** LIVE  
**Public RPC security hardening:** COMPLETE  
**Production ↔ Git migration reconciliation:** COMPLETE  
**Activation constraint negative test:** PASS  
**Business Terms governance CI gate:** IMPLEMENTED  
**Business Terms active:** NO  
**Current acceptances/confirmations:** NONE  
**Privacy/DPA package:** NOT COMPLETE  
**Counsel sign-off:** NOT COMPLETE  
**IR-02C activation-ready:** NOT YET

IR-02C is therefore an **execution-ready, fail-closed contract/data-rights architecture**, not a claim that the unfinished contract is already legally in force.