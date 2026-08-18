# HOY Investor Ready v1.0 — IR-02C Business Terms & First-Party Data Clearance

**Audit date:** 2026-08-18  
**Status:** TECHNICAL INFRASTRUCTURE LIVE / TERMS NOT ACTIVE  
**Scope:** HOY Gastro/Core operator relationship and Business Confirmed data evidence  

## 1. Objective

IR-02C converts the IR-02B target state — `AMBER research → Business Confirmed / contract-cleared first-party data` — into a versioned contract/evidence architecture.

The key rule is:

> A business website, public listing or operator account does not by itself create a transferable HOY first-party data asset.

HOY requires an evidence chain linking authorization, exact contract version and exact confirmed data snapshot.

## 2. Legal/document package

Prepared:

- `docs/legal/HOY_BUSINESS_DATA_MEDIA_TERMS_v1.0_DE.md`
- `docs/legal/HOY_BUSINESS_TERMS_ACCEPTANCE_SPEC_v1.0.md`

The German Business Terms master is deliberately marked **DRAFT / NOT YET ACTIVE**.

It covers, among other matters:

- Business Content ownership remains with the Business/rights holder;
- defined licence to HOY for platform operation;
- technical formatting/localization/hosting uses;
- limited service-provider sublicensing;
- change-of-control continuity;
- no blanket standalone resale right for raw Business Content;
- separate HOY-created metadata/normalization/provenance layer;
- lawful aggregated/derived-data use subject to underlying rights and privacy law;
- Business Facts and Business Confirmed data;
- accessibility fact specificity;
- media-rights representations;
- menu/offer/event/live-data handling;
- termination/history controls;
- privacy-role separation and DPA requirement where Article 28 GDPR applies;
- exact-version electronic acceptance evidence.

## 3. Production infrastructure

Production migrations:

1. `20260818201632_ir02c_business_terms_acceptance_infrastructure`
2. `20260818201740_ir02c_business_terms_rpc_security_hardening`
3. `20260818201831_ir02c_business_confirmation_ledger`

### Internal tables

- `private.business_terms_versions`
- `private.business_terms_acceptances`
- `private.business_data_confirmations`

All three are non-public evidence/control assets. Client roles do not receive direct table access.

## 4. Fail-closed contract activation

`private.business_terms_versions` has an activation constraint.

A Terms version cannot become `active` unless critical evidence is present, including:

- valid final DE document SHA-256;
- Spanish document + SHA-256;
- definitive HOY legal entity;
- registered address;
- legal contact;
- privacy-notice version;
- governing law;
- jurisdiction;
- counsel-review timestamp/reference;
- effective/activation times.

Current version `1.0` is `draft`.

Therefore the deployed infrastructure does **not** activate or impose the current draft contract.

## 5. Current live state at implementation

- Terms version 1.0: `draft`
- active Terms gate: `false`
- Business Terms acceptances: `0`
- Business data confirmations: `0`
- verified restaurant memberships: `0`

The operator-write trigger layer is therefore dormant and changes no current business/operator behavior.

## 6. Acceptance receipt

When an approved Terms version is eventually active, `operator_accept_business_terms(...)` requires:

- authenticated user;
- verified restaurant membership;
- exact active Terms version;
- presented locale;
- declared authority role;
- permitted acceptance method;
- affirmative authority acknowledgement;
- affirmative Business Content/data-rights acknowledgement;
- affirmative media-rights acknowledgement;
- affirmative change-of-control acknowledgement;
- privacy-notice acknowledgement.

The resulting receipt stores the exact Terms version and document SHA-256 and is audit-linked.

Draft/inactive Terms cannot be accepted through the endpoint.

## 7. Security architecture

Public Terms RPCs are `SECURITY INVOKER` wrappers:

- `public.get_business_terms_status(...)`
- `public.operator_accept_business_terms(...)`
- `public.operator_record_business_confirmation(...)`

Privileged table access is isolated inside non-public `private` helper functions with explicit authenticated membership checks.

The two initial public Terms RPCs were converted from `SECURITY DEFINER` after the Supabase Security Advisor identified them. After hardening, IR-02C does not add new public `SECURITY DEFINER` warnings.

Pre-existing reviewed Gastro RPC warnings remain separately tracked under IR-02A and are not falsely represented as closed.

## 8. Dormant operator-write gates

Terms gates are attached to operator-write paths for:

- profile changes;
- upgrade requests;
- offers;
- event promotions;
- menu intake;
- live hours;
- special hours;
- services;
- media assets;
- media review candidates.

Behavior:

- no active Terms version → no contract gate;
- active Terms version + verified member → current matching acceptance required.

## 9. Business Confirmation Ledger

The live `private.business_data_confirmations` table records exact Business Confirmed snapshots.

Each record binds:

- Business/restaurant;
- authenticated user;
- exact Terms acceptance receipt;
- confirmation type;
- subject/ref;
- payload SHA-256;
- source channel;
- timestamp/evidence.

New confirmations supersede old current confirmations for the same subject rather than deleting history.

This creates a DD-verifiable distinction between:

- `observed on business website`;
- `operator account exists`;
- `Business Terms accepted`;
- `this exact data snapshot was Business Confirmed`.

## 10. Data-asset effect

IR-02C does not automatically upgrade the current AMBER source inventory.

A field can move toward contract-cleared first-party status only after the applicable Business relationship and data confirmation are actually evidenced.

Target path:

`AMBER first-party observation → verified operator → active Terms acceptance → exact data confirmation → Business Confirmed + freshness/history → transferable HOY evidence layer`

This avoids falsely upgrading historical research simply because a business later creates an account.

## 11. Remaining activation blockers

P0 before Business Terms activation:

1. definitive HOY contracting entity;
2. registered/legal details;
3. governing law and jurisdiction decision;
4. final German legal review;
5. Spanish legal localization and review;
6. Privacy Notice version;
7. controller/processor mapping + DPA where required;
8. final document SHA-256 hashes;
9. operator UI to present/store/reproduce exact Terms;
10. electronic acceptance receipt UX;
11. input/error-correction flow;
12. canonical payload hashing implementation;
13. end-to-end contract acceptance and Business Confirmation tests.

## 12. Investor/buyer claim boundary

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

## 13. Gate

**Business Terms DE execution draft:** PREPARED  
**Terms version/receipt infrastructure:** LIVE  
**Business Confirmation Ledger:** LIVE  
**Public RPC security hardening:** COMPLETE  
**Business Terms active:** NO  
**Current acceptances/confirmations:** NONE  
**Spanish legal version:** NOT FINAL  
**Privacy/DPA package:** NOT COMPLETE  
**Counsel sign-off:** NOT COMPLETE  
**IR-02C activation-ready:** NOT YET

IR-02C is therefore an **execution-ready, fail-closed contract/data-rights architecture**, not a claim that the unfinished contract is already legally in force.