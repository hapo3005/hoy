# RT-008 Consent + Privacy Notice Candidate — 2026-08-19

Status: **TECHNICAL UX READY / PRODUCTION RELEASE FAIL-CLOSED**

## Objective

Provide an explicit, reversible analytics choice with a layered privacy notice while preventing Production analytics from becoming active before the controller/legal facts are complete.

## User-facing controls

The candidate implements:

- first-layer Analytics choice with **Reject** and **Accept** presented together using the same prominence class;
- separate **More information & settings** control;
- persistent Privacy launcher after the first decision;
- withdrawal/rejection from the settings dialog;
- local cleanup of anonymous analytics ID, session ID, pilot attribution keys and raw local analytics history after rejection/withdrawal;
- German, English and Spanish copy;
- accessible dialog/button labels and an `aria-live` decision confirmation;
- a versioned local preference record containing `choice`, `noticeVersion`, `decidedAt` and a bounded UI source string.

## Independent Production release gate

Consent alone is intentionally insufficient to enable analytics.

`privacy-config-2.47.js` requires all of the following before `hoyPrivacyProductionReady247()` can return true:

1. `releaseReady === true`;
2. `analyticsEnabled === true`;
3. non-empty controller name;
4. non-empty controller address;
5. non-empty privacy contact;
6. an explicitly approved positive integer analytics-retention period.

The Draft configuration currently contains:

- `releaseReady: false`;
- `analyticsEnabled: false`;
- blank controller fields;
- `analyticsRetentionDays: null`.

Therefore Production analytics remains disabled even if somebody manually writes `hoy-analytics-consent-v1=granted` in localStorage.

## Analytics transport rule

`analytics-rpc-1.8.1.js` now requires, for Production transport:

- Production host;
- privacy release gate true;
- non-QA browser;
- explicit analytics consent equal to `granted`.

If the release gate or consent is absent, `trackEvent` exits before Production analytics payload/identifier creation.

## QA strategy

The full choice UI can be exercised only on non-Production origins with `?privacy_qa=1` while the release configuration remains fail-closed.

`tests/privacy-consent-2.47.spec.js` covers:

- first-layer Reject + Accept controls;
- version/timestamp evidence after a choice;
- persistent Privacy launcher;
- withdrawal/rejection from settings;
- cleanup of analytics identifiers/history;
- Draft Production release gate remaining false.

The RT-008 static gate additionally fails if the Draft configuration enables Production analytics, if the consent UI loses required first-layer choices, if load order is unsafe, or if the independent release gate disappears from analytics transport.

## Legal / policy boundary

This is a technical compliance candidate, not legal sign-off. Before changing the Production release configuration to true, HOY still requires:

- final controller identity and address;
- an operational privacy contact/rights channel;
- approved analytics purpose/legal-basis language;
- approved retention period/criteria;
- complete recipient/processor/transfer disclosure;
- final layered privacy/cookie-style notice wording;
- release review of Spanish LSSI/cookie-equivalent storage rules and GDPR consent conditions.

Current official references reviewed for the control design:

- GDPR Article 7 requires consent to be demonstrable and permits withdrawal; withdrawal must be as easy as giving consent: https://eur-lex.europa.eu/eli/reg/2016/679/oj
- AEPD current cookie/privacy FAQ states that valid consent must be free and informed and that Accept and Reject should be offered at the same time, level and visibility: https://www.aepd.es/preguntas-frecuentes/17-internet-y-redes-sociales/FAQ-1707-importancia-de-las-cookies-en-la-proteccion-de-datos
- AEPD cookie guidance area: https://www.aepd.es/areas-de-actuacion/innovacion-y-tecnologia

## Release decision

**NO RELEASE.** Keep PR #127 Draft. Do not enable Production analytics until the controller/legal/retention fields and final notice are approved and the full PR QA matrix is green.
