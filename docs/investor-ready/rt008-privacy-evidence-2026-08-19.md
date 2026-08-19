# RT-008 Privacy Evidence — 2026-08-19

Status: **TECHNICAL PRIVACY BASELINE STRONG / OPERATIONAL-LEGAL GATES STILL OPEN**

## 1. SECURITY DEFINER RPC abuse tests

All seven Core RPCs are `SECURITY DEFINER`, executable by `authenticated`, and not executable by `anon`.

A transaction-only fixture created one synthetic auth user, one verified restaurant membership, a `pro` entitlement and two offers. Fourteen scenarios were executed and the transaction was rolled back. Post-check confirmed 0 test users, memberships, offers, upgrade/profile requests and audit rows remained.

| RPC | Own-tenant positive | Cross-tenant negative | Result |
|---|---|---|---|
| `get_operator_workspace` | own restaurant returned | foreign restaurant → `membership_required` | PASS |
| `get_venue_media_review` | own restaurant returned | foreign restaurant → `claim_required` | PASS |
| `operator_archive_offer` | own offer archived in rollback | foreign offer → `verified_membership_required` | PASS |
| `operator_publish_offer` | own offer published in rollback | foreign offer → `verified_membership_required` | PASS |
| `operator_request_upgrade` | own request created in rollback | foreign restaurant → `verified_membership_required` | PASS |
| `operator_submit_profile_change` | own request created in rollback | foreign restaurant → `verified_membership_required` | PASS |
| `review_venue_media_candidates` | own candidate approved in rollback | foreign candidate → `candidate_restaurant_mismatch` | PASS |

Decision: current Supabase advisor warnings for these seven guarded RPCs are not treated as confirmed vulnerabilities. Retain explicit grants, search paths and negative tests as regression controls.

## 2. Production analytics fail-closed candidate

Branch: `privacy/rt008-clean-candidate`

The current `main` version creates/persists analytics identifiers before any explicit analytics-consent gate. The candidate changes this so that on the production host:

- analytics stays OFF unless `hoy-analytics-consent-v1=granted`;
- `trackEvent` exits before analytics identifiers/payload creation when consent is absent;
- raw analytics event history is not stored in Production localStorage;
- legacy anonymous/session/pilot analytics storage is cleared while consent is absent;
- preview/QA remains testable without Production transport;
- no consent UI is invented by this technical change.

CI: `.github/workflows/rt008-privacy.yml` uses immutable `actions/checkout` commit SHA and runs the fail-closed static check.

## 3. Legal-operational baseline

Current official baseline reviewed 2026-08-19:

- GDPR Article 5: purpose limitation, data minimisation, storage limitation, integrity/confidentiality and accountability.
- GDPR Articles 13/14: privacy information includes purposes/legal basis, recipients/transfers and retention period/criteria; indirect collection has additional source/transparency duties.
- GDPR Article 12: data-subject requests normally require action/information within one month; extension is possible only under the Regulation's conditions.
- GDPR Article 32: risk-appropriate security and regular testing/evaluation of controls.
- GDPR Article 33: qualifying personal-data breaches must be notified without undue delay and where feasible within 72 hours after awareness; breaches must be documented.

Official references:
- https://eur-lex.europa.eu/eli/reg/2016/679/oj?locale=de
- https://www.aepd.es/derechos-y-deberes/ejerce-tus-derechos
- https://www.aepd.es/derechos-y-deberes/cumple-tus-deberes/medidas-de-cumplimiento/brechas-de-datos-personales-notificacion

## 4. Still open

- real consent UI + withdrawal path and privacy notice before analytics activation;
- retention schedule approved and implemented for each processing activity;
- DSAR/export/delete test against a representative synthetic/real authorised account path;
- Article 14 / legitimate-interest / Spanish marketing-law review for indirect B2B contacts before outreach;
- processor/subprocessor/transfer evidence completion;
- Works DPIA screen before real users/requests/photos;
- breach tabletop with named roles/escalation once the contracting/controller entity exists;
- company-controlled provider accounts/recovery after incorporation.

No investor/business/user outreach is released by this evidence file.
