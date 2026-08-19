# RT-008 Privacy Evidence — 2026-08-19

Status: **TECHNICAL PRIVACY BASELINE STRONG / CONSENT UX CANDIDATE READY / DSAR LOCATOR PASS / RETENTION MECHANISM FAIL-CLOSED / OPERATIONAL-LEGAL GATES STILL OPEN**

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

## 2. Production analytics — two independent gates

Branch: `privacy/rt008-clean-candidate` / Draft PR #127.

Production analytics now requires **both**:

1. explicit user choice `hoy-analytics-consent-v1=granted`; and
2. `hoyPrivacyProductionReady247() === true`.

The second gate is controlled by `privacy-config-2.47.js`. It cannot become true unless Production release + analytics release are explicitly enabled and controller name, controller address, privacy contact and a positive integer retention period are all present.

The Draft configuration remains deliberately fail-closed:

- `releaseReady: false`;
- `analyticsEnabled: false`;
- controller fields blank;
- `analyticsRetentionDays: null`.

Therefore manually setting the browser consent key is insufficient to activate Production analytics.

`trackEvent` exits before Production payload/identifier creation if either gate is false. Raw analytics history remains restricted to non-Production, and legacy anonymous/session/pilot analytics storage is cleared while Production release/consent is absent.

## 3. Consent / withdrawal / layered notice UX — candidate ready

New candidate assets:

- `privacy-config-2.47.js`;
- `privacy-consent-2.47.js`;
- `privacy-consent-2.47.css`;
- `tests/privacy-consent-2.47.spec.js`;
- `docs/investor-ready/rt008-consent-notice-candidate.md`.

Controls:

- first-layer Reject and Accept are shown together with the same prominence class;
- separate More information/settings path;
- persistent Privacy launcher after a decision;
- rejection/withdrawal stops future analytics and removes local analytics IDs, pilot attribution and raw local analytics history;
- versioned preference record stores choice, notice version and decision timestamp;
- German, English and Spanish UI copy;
- QA can exercise the complete UX on non-Production with `?privacy_qa=1` while Production remains disabled;
- Production does not auto-present the incomplete consent release until controller/legal/retention facts are ready.

This closes the **technical UX build** but not the final legal release. The final controller identity, contact, retention period/criteria, processor/recipient/transfer disclosures and approved notice wording are still required before changing the Production release gate.

## 4. Private DSAR subject locator — technical pass

Migration applied to the Core project on 2026-08-19: `rt008_private_dsar_retention_controls`.

`private.dd_subject_data_locator(uuid)` returns table/relationship counts plus erasure-behaviour metadata only. It does not return subject record contents and does not mutate data.

- EXECUTE revoked from `public`, `anon` and `authenticated`;
- EXECUTE granted only to `service_role`;
- covers account, memberships, claims/review, menu intake, offers, upgrade/profile requests, service confirmations, media decisions, audit logs, promotions and media uploads;
- classifies relationships as CASCADE, SET NULL, RESTRICT/review, or tombstone/delete review.

A transaction-only fixture with one auth account, one membership and one operator-created offer returned exactly those three linked relationships. Rollback verification showed 0 fixture users, memberships and offers afterwards.

A separate direct-delete rollback probe demonstrated that an operator-created offer can block `auth.users` deletion through `offers_created_by_fkey`; automatic one-click hard-delete is therefore not claimed as complete or safe.

## 5. Analytics retention — mechanism ready, policy open

Private controls exist for dry-run impact and fail-closed purge execution:

- `private.dd_analytics_retention_preview(timestamptz)`;
- `private.analytics_retention_policy`;
- `private.analytics_retention_runs`;
- `private.execute_approved_analytics_retention(text)`.

Current verification:

- policy rows: **0**;
- enabled policy rows: **0**;
- retention run rows: **0**;
- `anon` / `authenticated` cannot execute locator or purge;
- `service_role` is the only application role granted execution;
- attempted purge with no enabled policy correctly fails with `analytics_retention_policy_not_enabled`.

Dry-run impact at verification time:

| Proposed age cutoff | Rows older | Distinct anonymous IDs | Distinct sessions |
|---|---:|---:|---:|
| 1 day | 27,828 | 19,196 | 19,218 |
| 3 days | 15,667 | 12,277 | 12,291 |
| 7 days | 2,809 | 2,591 | 2,600 |
| 14 days | 0 | 0 | 0 |
| 30 days | 0 | 0 | 0 |
| 90 days | 0 | 0 | 0 |

These are impact previews, **not approved retention periods**. No analytics row was deleted by this work.

## 6. Live privacy baseline

Core contains 28,897 historic analytics events, 19,832 distinct persistent anonymous IDs and 19,855 sessions in the captured baseline. `venue_sales_pipeline` has 168 rows, 57 with a named/direct contact field; all 168 remain send-locked and 0 are send-authorised.

Core `auth.users` had 0 users at the captured baseline. Works had 0 auth users, profiles, provider applications, work requests, request events and request photos.

## 7. Current legal-operational basis

Official baseline reviewed 2026-08-19:

- GDPR Article 7: consent must be demonstrable; withdrawal must be possible and as easy as giving consent.
- GDPR Articles 13/14: privacy information includes controller identity/contact, purposes/legal basis, recipients/transfers and retention period/criteria; indirect collection has additional transparency duties.
- GDPR Article 12: data-subject requests normally require action/information within one month, subject to the Regulation's conditions for extension.
- GDPR Article 17: erasure applies where its conditions are met and remains subject to its exceptions.
- GDPR Articles 32–34: risk-appropriate security, breach documentation/notification and high-risk communications.
- AEPD current cookie/privacy FAQ: where consent is required, Accept and Reject should be offered at the same time, level and visibility.

Official references:
- https://eur-lex.europa.eu/eli/reg/2016/679/oj
- https://www.aepd.es/preguntas-frecuentes/17-internet-y-redes-sociales/FAQ-1707-importancia-de-las-cookies-en-la-proteccion-de-datos
- https://www.aepd.es/areas-de-actuacion/innovacion-y-tecnologia
- https://www.aepd.es/derechos-y-deberes/ejerce-tus-derechos

## 8. Still open

- final controller/entity identity, address and rights/privacy contact;
- approved analytics purpose/legal-basis wording and retention period/criteria before enabling the Production gate;
- complete processor/subprocessor/recipient/transfer evidence and final layered notice;
- reviewed erasure/redaction/tombstone workflow plus full synthetic E2E erasure test;
- Article 14 / legitimate-interest / Spanish marketing-law review for indirect B2B contacts before outreach;
- Works DPIA screen before real users/requests/photos;
- breach tabletop with named roles/escalation once the contracting/controller entity exists;
- company-controlled provider accounts/recovery after incorporation.

No investor/business/user outreach is released by this evidence file. No Production analytics, retention purge or automatic data-erasure release is authorised by Draft PR #127.
