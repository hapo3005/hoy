# HOY Investor Ready — IR-02A Privacy Processing Register

**Audit date:** 2026-08-18  
**Status:** Technical processing inventory populated; legal-basis/retention/DPA sign-off remains REVIEW_REQUIRED.

| Processing area | Data subjects | Data categories observed/planned | Purpose | Current technical controls | Legal basis | Retention | DD status |
|---|---|---|---|---|---|---|---|
| Gastro product analytics | visitors/users | anonymous browser UUID, session UUID, timestamps, allowlisted event type, small allowlisted metadata, optional pseudonymous P01–P30 pilot code | product measurement / field-test metrics | event allowlist; metadata size/type checks; common personal-field stripping client-side; QA isolation; production-host gate | REVIEW_REQUIRED | REVIEW_REQUIRED | AMBER |
| Consumer field-test administration | research participants | identity/admin record held outside product analytics; pseudonymous pilot code used for join | research eligibility and field-test analysis | identity kept outside `analytics_events`; product side uses Pxx only | REVIEW_REQUIRED | REVIEW_REQUIRED | AMBER |
| Restaurant/business claims | business representatives | user ID, business claim status, restaurant relation | verify authority to represent a venue | authenticated flows; membership/claim checks; RLS/RPC authorization | REVIEW_REQUIRED | REVIEW_REQUIRED | AMBER |
| Operator accounts/workspace | restaurant operators | auth user ID, role/membership, operator actions | business self-service and controlled publishing | authenticated membership checks; audit logs; RLS; narrow RPC grants | REVIEW_REQUIRED | REVIEW_REQUIRED | AMBER |
| Venue sales/outreach preparation | business/contact persons | business contact data may include personal contact details | prepare future B2B outreach | current live audit: 168/168 send-locked; 0 send-authorized | REVIEW_REQUIRED | REVIEW_REQUIRED | AMBER; outreach locked |
| Works customer requests | consumers | user ID, location, description, preferred language, optional photos, timestamps | match a customer problem with providers | RLS; private request/photo tables; provider exposure restricted by workflow | REVIEW_REQUIRED before live use | REVIEW_REQUIRED | AMBER / pre-live |
| Works provider applications | business representatives | user ID, name, business email, phone, role, business details, authorization attestation | provider onboarding | authenticated workflow; explicit authorization attestation; RLS | REVIEW_REQUIRED | REVIEW_REQUIRED | AMBER / pre-live |
| Works provider membership/live status | provider users | user ID, provider membership, availability state, note, timestamps | operator-controlled live availability | authenticated Edge Function; membership check; server-side privileged RPC | REVIEW_REQUIRED | REVIEW_REQUIRED | AMBER / no live rows yet |
| Media review | business representatives / potentially identifiable persons in media | asset/source URLs, operator decision, reviewer user ID, timestamps | rights review and publication control | media candidates remain non-public until approval/licensing; authenticated review RPC | REVIEW_REQUIRED | REVIEW_REQUIRED | AMBER |

## Mandatory legal/compliance evidence before Investor DD close

1. Controller/legal-entity identity and contact details.
2. Purpose-by-purpose legal-basis decision; no basis is inferred by this technical register.
3. Data-retention schedule by table/process, including historical analytics treatment.
4. Data-subject request workflow and deletion/rectification procedures.
5. Processor/subprocessor register and DPAs/contractual evidence for Supabase and any other processors.
6. International-transfer assessment where applicable.
7. Production privacy notice aligned with actual telemetry and business/operator flows.
8. Consent/cookie assessment for client storage/analytics where legally required.
9. Incident/breach response and access-review process.
10. ROPA-style final record approved for the actual HOY legal entity and jurisdictions.

## Investor-facing rule

Personal or pseudonymous data is not described as an owned, freely transferable commercial dataset. Any transaction/exit treatment must remain subject to the applicable privacy obligations, purpose compatibility and buyer/controller transition requirements.
