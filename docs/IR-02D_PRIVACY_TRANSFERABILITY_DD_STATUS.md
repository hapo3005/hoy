# HOY Investor Ready v1.0 — IR-02D Privacy, DPA & Transferability

**Audit date:** 2026-08-18  
**Status:** WORKING DD BASELINE / FAIL-CLOSED  
**Scope:** HOY Core/Gastro, HOY Works pre-live privacy scope, critical platform transferability

## 1. Objective

IR-02D converts privacy and exit-transferability from narrative risk into an auditable register.

Core doctrine:

> **No personal-data processing without purpose + role + legal basis + retention + recipients/transfers + security + rights handling.**

> **No buyer-ready platform dependency without documented account control + technical transfer route + contractual/privacy continuity.**

## 2. Verified live privacy snapshot

### HOY Gastro/Core

At audit time:

- `auth.users`: **0**
- `business_claims`: **0**
- verified restaurant memberships: **0**
- Business Terms acceptances: **0**
- Business Confirmed records: **0**
- `venue_sales_pipeline`: **168** internal prospect rows
  - rows with `contact_email`: **17**
  - rows with `contact_phone`: **54**
- `analytics_events`: **28,897** rows
  - all audited rows have pseudonymous `anonymous_id`
  - all audited rows have `session_id`
  - metadata keys are currently product-oriented (e.g. client version, language, view, venue/profile quality, decision/surface/filter) rather than obvious direct identifiers.

**Interpretation:** the current material personal-data/privacy exposure is concentrated in professional prospect contact data and pseudonymous analytics, not live customer/operator accounts.

### HOY Works

At audit time:

- `auth.users`: **0**
- `profiles`: **0**
- `provider_members`: **0**
- `provider_applications`: **0**
- `work_requests`: **0**

However the Work Request schema can hold:

- `customer_id`;
- free-text description;
- location text;
- latitude/longitude;
- municipality/locality;
- preferred language;
- assigned provider.

**Gate:** Works customer-request processing is P0-before-live because it combines identity-linked workflow data with location and free text.

## 3. Controller / Processor Matrix

| Activity | Current HOY role | Status | Notes |
|---|---|---|---|
| HOY product analytics | Controller | REVIEW_REQUIRED | HOY defines its own product/analytics purposes; cookie/ePrivacy basis unresolved |
| Business account/auth | Controller | PREPARED / NOT LIVE | own platform account administration |
| Business claims/membership verification | Controller | PREPARED / NOT LIVE | HOY decides verification and access rules |
| Business Terms acceptance/evidence | Controller | PREPARED / NOT LIVE | own contract/right evidence |
| Business Confirmed evidence | Controller | PREPARED / NOT LIVE | own trust/provenance product purpose, subject to business rights |
| Internal prospect research | Controller | LIVE INTERNAL | professional-contact legal basis/notice/retention review required |
| Commercial email/DM outreach in Spain | Controller | BLOCKED | do not equate professional-contact storage with permission for unsolicited electronic marketing |
| Security/audit logs | Controller | LIVE/LOW VOLUME | final retention/legal-basis review required |
| HOY Works customer request/matching | likely Controller for core marketplace purpose | PRE-LIVE REVIEW | exact roles depend on final product and data flows |
| Processing personal data solely on a Business's documented instructions | Processor | CONDITIONAL ONLY | requires Art. 28 DPA and completed processing annex |

**Rule:** contractual labels never override factual role allocation.

## 4. Initial ROPA / Processing Activity Register

### PA-01 — Product analytics

- **Role:** Controller
- **Systems:** Gastro analytics_events + client identifiers
- **Purpose:** product quality, funnel/decision analysis, reliability
- **Data subjects:** visitors/users
- **Data:** pseudonymous IDs, session IDs, event/time, product metadata
- **Special categories:** not intended; prohibited by design unless separately approved
- **Legal basis:** REVIEW_REQUIRED
- **ePrivacy/cookie gate:** P0
- **Retention:** REVIEW_REQUIRED
- **Third-country risk:** REVIEW_REQUIRED due vendor/Edge runtime path
- **DD note:** pre-2.45 historical data excluded from traction claims

### PA-02 — Professional prospect research

- **Role:** Controller
- **System:** venue_sales_pipeline
- **Purpose:** internal preparation/prioritization of potential Business relationships
- **Data subjects:** professional contacts / individual entrepreneurs where applicable
- **Data:** contact name, professional email/phone/social/website, role/confidence/source
- **Legal basis candidate:** legitimate interests only where conditions are actually met
- **Electronic marketing:** BLOCKED pending separate LSSI/marketing basis
- **Retention:** REVIEW_REQUIRED; stale contacts must not be retained indefinitely
- **Current control:** send_lock remains active

### PA-03 — Business account/authentication

- **Role:** Controller
- **Systems:** Supabase Auth, memberships
- **Current data:** none
- **Purpose:** account access/security/operator permissions
- **Legal basis:** contract/pre-contract and/or legitimate interests to be finalized by flow
- **Retention:** account lifecycle + legally required evidence, final policy TBD

### PA-04 — Business claim/authority verification

- **Role:** Controller
- **Current data:** none
- **Data:** contact identity, role, professional email, evidence, review decision
- **Purpose:** prevent unauthorized profile control and fraud
- **Retention:** active relationship + dispute/security evidence period; exact schedule TBD

### PA-05 — Business Terms acceptance + confirmations

- **Role:** Controller
- **Current data:** none
- **Purpose:** contract/evidence chain, rights/trust provenance
- **Data:** user/business IDs, version/hash, authority role, acknowledgements, payload hashes, evidence/timestamps
- **Retention:** longer evidentiary retention may be justified after account termination; legal schedule TBD

### PA-06 — Security/audit logs

- **Role:** Controller
- **Purpose:** security, abuse prevention, integrity, investigation
- **Data:** actor IDs, actions, object references, limited before/after metadata, timestamps
- **Retention:** risk/evidence-based; final schedule TBD

### PA-07 — HOY Works request/matching

- **Role:** likely Controller for core HOY purposes; final role map required
- **Current data:** none
- **Data:** identity link, location/coordinates, language, service need, free text, provider assignment
- **Risk:** elevated because free text and precise location can reveal unexpected personal/sensitive information
- **Controls before live:** minimization, location precision policy, sensitive-data warning/filter, retention, access controls, provider-disclosure rules, privacy notice, rights workflow, incident handling, DPIA screening

## 5. Retention Baseline

No invented statutory periods are treated as final policy.

| Code | Data class | Current status | Required final trigger |
|---|---|---|---|
| RET-ANALYTICS | pseudonymous analytics | REVIEW_REQUIRED | define consent/basis + clean-cutover cohort + business need |
| RET-PROSPECT | professional prospect contacts | REVIEW_REQUIRED | periodic freshness/relevance review; delete when no legitimate relationship purpose remains |
| RET-ACCOUNT | auth/account | PRE-LIVE | account closure + legal/security exceptions |
| RET-CLAIM | verification evidence | PRE-LIVE | relationship/dispute lifecycle |
| RET-CONTRACT | Terms/confirmation evidence | PRE-LIVE | limitation/tax/legal-claim review |
| RET-AUDIT | security/audit | REVIEW_REQUIRED | threat/evidence lifecycle |
| RET-WORKS | customer work requests/location | BLOCKED BEFORE LIVE | service completion + disputes/legal obligations + minimization |

## 6. DPA Gate

Prepared:

`docs/legal/HOY_DPA_ART28_v1.0_DE_DRAFT.md`

DPA is required only where HOY actually acts as processor. It is not a blanket appendix for all Business relationships.

Before a DPA is activated:

- role must be `PROCESSOR_CONFIRMED`;
- subject/duration/nature/purpose must be specified;
- data subject/data categories must be specified;
- instructions must be documented;
- TOMs must be attached;
- subprocessors and transfers must be documented;
- deletion/return must be defined;
- final HOY legal entity and signature/acceptance evidence must exist.

## 7. Critical Vendor / Exit Transferability Matrix

### TR-01 — GitHub repositories

- **Assets:** `hapo3005/hoy`, `hapo3005/hoy-lifestyle`, `hapo3005/hoy-works`
- **Current control:** personal GitHub owner `hapo3005`; admin control evidenced
- **Technical transferability:** **YES** — GitHub supports transfer of repositories to another user/organization subject to its prerequisites
- **Buyer readiness:** **AMBER**
- **Why not GREEN:** still founder-account controlled; target HOY organization/entity not established; billing/security/recovery/admin-continuity evidence not yet captured
- **P0 action:** create company-controlled organization after entity gate; transfer repos; require >=2 owners/admin continuity; verify Actions/secrets/pages/integrations after transfer

### TR-02 — Supabase HOY La Manga

- **Project ref:** `zlscptisdxzxuvllogza`
- **State:** active/healthy at last audit; primary region `eu-central-1`
- **Technical transferability:** **YES** — Supabase supports project transfers between organizations subject to prerequisites
- **Buyer readiness:** **AMBER**
- **P0 action:** evidence current organization ownership, billing/recovery/admins, DPA/privacy terms, project-transfer eligibility, integrations/log drains, backup/export procedure, target-company organization

### TR-03 — Supabase HOY Works

- **Project ref:** `dqfouwyclvmpkunmxkun`
- **Technical transferability:** **YES** by same Supabase project-transfer mechanism
- **Buyer readiness:** **AMBER**
- **P0 action:** same company-ownership/transfer evidence as Gastro

### TR-04 — Domains / DNS

- **Technical transferability:** expected but **NOT VERIFIED**
- **DD status:** REVIEW_REQUIRED
- **P0:** registrar, registrant, renewal, billing, 2FA/recovery, DNS provider, auth codes/transfer lock, company ownership

### TR-05 — Brand / trademark

- **DD status:** REVIEW_REQUIRED
- **P0:** application/registration ownership and assignment/change-of-control evidence

### TR-06 — External APIs / vendors

- **DD status:** REVIEW_REQUIRED PER VENDOR
- **P0:** contract assignability/change-of-control, DPA, subprocessor list, data export/deletion, credential rotation and billing owner

## 8. Privacy Transfer Risk — Supabase region vs Edge Functions

HOY's primary database is in Frankfurt (`eu-central-1`). Supabase Edge Functions can execute regionally and may run near the invoking user unless a region is explicitly chosen in the invocation architecture.

Therefore:

> **Database region ≠ proof that every processing operation stays in the EEA.**

Before personal-data-heavy features go live, HOY must either:

1. prove the relevant Edge/runtime/subprocessor transfer path is legally covered; and/or
2. pin sensitive functions to an approved region where technically appropriate;
3. document any resulting international-transfer mechanism.

## 9. Marketing/Outreach Gate — Spain

Professional B2B contact processing and electronic marketing are separate legal questions.

HOY therefore preserves:

- existing business/investor contact freeze;
- technical `send_lock` controls;
- no claim that legitimate-interest processing of professional contact data automatically permits promotional email/DM.

Before electronic commercial outreach in Spain, LSSI requirements must be cleared for the specific channel/relationship.

## 10. Cookie/Analytics Gate

Pseudonymous identifiers can still be personal data, and terminal storage/access technologies may require consent independently under Spanish ePrivacy/LSSI rules.

Before public launch:

- inventory localStorage/cookies/device identifiers;
- classify strictly necessary vs analytics/personalization;
- block non-essential tracking until required consent;
- make accept/reject equally accessible where consent is required;
- version consent receipts/preferences;
- support withdrawal/change.

## 11. Incident / Rights Infrastructure

IR-02D will maintain internal, non-public registers for:

- data subject requests;
- privacy incidents/breaches;
- processing activities;
- retention rules;
- vendor/transferability evidence;
- privacy notice versions.

No incident or rights-request table is intended as guest-visible content.

## 12. Investor/Buyer Claim Gate

### Defensible now

- HOY has identified the actual current personal-data-bearing areas rather than assuming „no users = no privacy issue“.
- HOY has no live Gastro/Works auth-user base at the audit time.
- HOY has a defined Controller/Processor decision model and Article-28 DPA draft.
- HOY treats electronic marketing permission separately from professional-contact processing.
- GitHub repositories and Supabase projects have documented technical transfer routes.
- HOY's primary Supabase projects are in `eu-central-1` but international-processing review remains explicit.

### Not defensible yet

- „HOY is GDPR compliant in every respect."
- „All analytics is consent-exempt."
- „All professional contacts may be marketed to."
- „All vendors/subprocessors are contract-cleared."
- „All critical accounts already belong to the HOY company."
- „Every contract/vendor survives a change of control."

## 13. P0 Backlog

1. final HOY legal entity + Privacy contact;
2. final DE/ES Privacy Notice;
3. legal basis per ROPA activity;
4. retention schedule;
5. cookie/local-storage/analytics audit and consent implementation;
6. Art. 14 transparency path for indirectly collected professional contacts where applicable;
7. marketing/LSSI channel clearance before outreach;
8. vendor DPA/subprocessor/transfer register;
9. Edge Function transfer/region assessment;
10. data subject request workflow;
11. incident/breach procedure;
12. Works pre-live privacy gate + DPIA screening;
13. GitHub/Supabase transfer to company-controlled organizations after entity formation;
14. domain/brand account ownership evidence;
15. counsel sign-off + final document hashes.

## 14. Gate

**Privacy inventory:** BASELINED  
**Controller/Processor matrix:** BASELINED  
**ROPA structure:** BASELINED  
**DPA draft:** PREPARED  
**Retention:** NOT FINAL  
**Analytics/cookie clearance:** NOT FINAL  
**Marketing outreach clearance:** BLOCKED  
**Vendor transfer review:** PARTIAL  
**GitHub technical transferability:** VERIFIED / OWNERSHIP TRANSFER PENDING  
**Supabase technical transferability:** VERIFIED / OWNERSHIP TRANSFER PENDING  
**Full privacy legal sign-off:** NOT COMPLETE  
**IR-02D:** WORKING DD BASELINE