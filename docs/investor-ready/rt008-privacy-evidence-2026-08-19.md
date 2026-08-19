# RT-008 Privacy Evidence — 2026-08-19

Status: **TECHNICAL PRIVACY BASELINE STRONG / CONSENT UX CANDIDATE READY / DSAR LOCATOR PASS / RETENTION MECHANISM FAIL-CLOSED / PROCESSOR-TRANSFER REGISTER BUILT / OPERATIONAL-LEGAL GATES STILL OPEN**

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

So manually setting the browser consent value to `granted` is **not sufficient** to activate Production analytics.

The candidate also ensures that on Production:

- `trackEvent` exits before analytics identifiers/payload creation while either gate is false;
- raw analytics history is not stored in Production localStorage;
- legacy anonymous/session/pilot analytics state is cleared while consent is absent or withdrawn;
- QA can exercise the UI on non-Production without creating a Production transport path.

## 3. Explicit consent + withdrawal candidate

The candidate contains a layered privacy UI in DE / EN / ES:

- Accept and Reject are presented together using the same first-layer prominence class;
- a separate details/settings path explains purpose, data, recipient/infrastructure placeholder, retention and the withdrawal mechanism;
- a persistent privacy launcher remains available after a decision;
- choice evidence stores `choice`, `noticeVersion`, timestamp and source;
- rejection/withdrawal stops future analytics and removes the local anonymous/session/pilot identifiers and raw local analytics history;
- the automatic Production consent banner is suppressed while the legal/controller/retention release gate is incomplete.

Browser regression: `tests/privacy-consent-2.47.spec.js`.

## 4. Private DSAR subject locator — technical pass

Migration applied to the Core project on 2026-08-19: `rt008_private_dsar_retention_controls`.

`private.dd_subject_data_locator(uuid)` returns table/relationship counts plus erasure-behaviour metadata only. It does not return subject record contents and does not mutate data.

- EXECUTE revoked from `public`, `anon` and `authenticated`;
- EXECUTE granted only to `service_role`;
- covers account, memberships, claims/review, menu intake, offers, upgrade/profile requests, service confirmations, media decisions, audit logs, promotions and media uploads;
- classifies relationships as CASCADE, SET NULL, RESTRICT/review, or tombstone/delete review rather than pretending every link may be hard-deleted.

A transaction-only locator fixture with one auth account, one membership and one operator-created offer returned exactly those three linked relationships. Rollback verification showed 0 fixture users, memberships and offers afterwards.

A separate direct-delete rollback probe demonstrated that an operator-created offer can block `auth.users` deletion through `offers_created_by_fkey`. Therefore automatic one-click hard-delete is not claimed as complete or safe.

## 5. Analytics retention — mechanism ready, policy open

Private controls now exist for dry-run impact and fail-closed purge execution:

- `private.dd_analytics_retention_preview(timestamptz)` — dry-run counts only;
- `private.analytics_retention_policy` — explicit private approval gate;
- `private.analytics_retention_runs` — execution evidence;
- `private.execute_approved_analytics_retention(text)` — deletion function limited to `analytics_events` older than the approved cutoff.

Current verification:

- policy rows: **0**;
- enabled policy rows: **0**;
- retention run rows after the fail-closed probe: **0**;
- `anon` / `authenticated` cannot execute locator or purge;
- `service_role` is the only application role granted execution;
- an attempted purge with no enabled policy correctly fails with `analytics_retention_policy_not_enabled`.

Dry-run impact at the verification time:

| Proposed age cutoff | Rows older | Distinct anonymous IDs | Distinct sessions |
|---|---:|---:|---:|
| 1 day | 27,828 | 19,196 | 19,218 |
| 3 days | 15,667 | 12,277 | 12,291 |
| 7 days | 2,809 | 2,591 | 2,600 |
| 14 days | 0 | 0 | 0 |
| 30 days | 0 | 0 | 0 |
| 90 days | 0 | 0 | 0 |

These are impact previews, **not approved retention periods**. No policy has been silently selected and no analytics row was deleted by this work.

## 6. Processor / recipient / international-transfer evidence

Dedicated register:

`docs/investor-ready/rt008-processor-transfer-evidence-2026-08-19.md`

The register distinguishes processors from independent controllers/direct browser recipients and from roles that still require account-specific contractual evidence.

Material conclusions:

- **Supabase:** both active HOY database projects are in `eu-central-1` / Frankfurt. Database region is not treated as proof of Edge Function execution region. Current organization/account is founder-controlled and company-contract/DPA evidence remains open.
- **OpenAI API:** current menu extraction uses `/v1/responses` with `background:true, store:false`. This is not called ZDR; OpenAI's current API data-control documentation says background Responses retain response state temporarily for polling and are not ZDR-compatible. Company API/DPA/config evidence remains open.
- **GitHub Pages:** current direct production-hosting recipient; GitHub documents Pages visitor-IP logging. Current repo is owned by personal GitHub user `hapo3005`, so company-control and applicable contractual evidence remain entity-gated.
- **jsDelivr:** direct browser CDN recipient for pinned browser libraries; its published provider information says CDN providers receive browser IP/request information for analytics/security. Self-hosting is a documented privacy/supply-chain hardening option.
- **OpenStreetMap Foundation:** OSMF states it is an independent Data Controller for its tile services and does not enter a DPA on a controller-processor basis with tile users. HOY must disclose the browser connection and comply with the tile usage policy.
- **Wikimedia Foundation / Commons:** direct browser recipient for current externally hosted open-licensed media. A future self-hosting path can reduce runtime disclosure/availability dependency while preserving licence evidence.
- future email/payment vendors remain unselected and blocked before activation.

No provider is marked contractually GREEN merely because it publishes a DPA, SCCs, privacy policy, security report or sub-processor list.

## 7. Live privacy baseline

Core currently contains 28,897 historic analytics events, 19,832 distinct persistent anonymous IDs and 19,855 sessions, spanning 2026-08-09 to 2026-08-18. Observed analytics metadata keys are product/context fields; the current key inventory did not show obvious email/phone/address/name keys.

`venue_sales_pipeline` has 168 rows, 57 with a named/direct contact field. All 168 remain send-locked and 0 are send-authorised.

Core `auth.users` currently has 0 users. Works currently has 0 auth users, profiles, provider applications, work requests, request events and request photos.

## 8. Legal-operational baseline

Current official baseline reviewed 2026-08-19:

- GDPR Article 5: purpose limitation, data minimisation, storage limitation, integrity/confidentiality and accountability.
- GDPR Articles 13/14: privacy information includes purposes/legal basis, recipients/transfers and retention period/criteria; indirect collection has additional source/transparency duties.
- GDPR Article 12: data-subject requests normally require action/information within one month; extension is possible only under the Regulation's conditions.
- GDPR Article 17: erasure applies where the Regulation's conditions are met, subject to its exceptions; a technical locator is therefore separated from the legal erasure decision.
- GDPR Article 32: risk-appropriate security and regular testing/evaluation of controls.
- GDPR Article 33: qualifying personal-data breaches must be notified without undue delay and where feasible within 72 hours after awareness; breaches must be documented.

Official references:
- https://eur-lex.europa.eu/eli/reg/2016/679/oj?locale=de
- https://www.aepd.es/derechos-y-deberes/ejerce-tus-derechos
- https://www.aepd.es/derechos-y-deberes/cumple-tus-deberes/medidas-de-cumplimiento/brechas-de-datos-personales-notificacion

Provider-specific official sources are listed in `rt008-processor-transfer-evidence-2026-08-19.md`.

## 9. Still open

- final controller/entity identity + address + privacy/rights contact;
- approved analytics purpose/legal-basis wording and retention period/criteria;
- final layered privacy notice with approved processor/recipient/transfer disclosures;
- account/entity-specific Supabase/OpenAI/GitHub contract/DPA/sub-processor/transfer evidence;
- decision/evidence for privacy-sensitive Supabase Edge Function execution region;
- reviewed erasure/redaction/tombstone workflow for non-cascading business/audit records and a full synthetic end-to-end erasure test;
- Article 14 / legitimate-interest / Spanish marketing-law review for indirect B2B contacts before outreach;
- Works DPIA screen before real users/requests/photos;
- breach tabletop with named roles/escalation once the contracting/controller entity exists;
- company-controlled provider accounts/recovery after incorporation;
- optional hardening: self-host pinned jsDelivr libraries and rights-cleared Wikimedia media; decide production-scale OSM tile SLA/provider strategy.

No investor/business/user outreach is released by this evidence file. No Production analytics, data-erasure or retention release is authorised by this Draft PR.
