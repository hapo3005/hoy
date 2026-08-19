# RT-008 Consent + Privacy Notice Candidate — current-main recomposition

Status: **TECHNICAL UX READY / PRODUCTION RELEASE FAIL-CLOSED / LEGAL APPROVAL OPEN**

## Current-main authority

This candidate is recomposed on `main` `88bb9e77d50ccb9db96306f5e737e27bad6237ab`, which already contains merged PR #128. It therefore preserves #128 as the canonical analytics-storage baseline and imports only the compatible RT-008 controls from historical input PR #127.

The canonical analytics consent key is:

`hoy-privacy-analytics-consent-v1`

The older `hoy-analytics-consent-v1` key is intentionally not used by the recomposed runtime, UI or regression contract.

## User-facing controls

The candidate implements:

- first-layer **Reject** and **Accept** choices with the same prominence class;
- a separate More information/settings path;
- persistent privacy settings after the first decision;
- withdrawal/rejection from settings;
- local cleanup of anonymous analytics ID, session ID, pilot attribution keys and raw analytics history after rejection/withdrawal;
- German, English and Spanish copy;
- accessible dialog/button labels and `aria-live` decision feedback;
- a versioned preference record with `choice`, `noticeVersion`, `decidedAt` and a bounded UI source.

## Two independent Production gates

Consent alone is intentionally insufficient. `privacy-config-2.47.js` requires all of the following before `hoyPrivacyProductionReady247()` can return true:

1. `releaseReady === true`;
2. `analyticsEnabled === true`;
3. non-empty controller name;
4. non-empty controller address;
5. non-empty privacy contact;
6. an explicitly approved positive integer analytics-retention period.

The Draft configuration remains fail-closed:

- `releaseReady: false`;
- `analyticsEnabled: false`;
- controller fields blank;
- `analyticsRetentionDays: null`.

Therefore Production analytics remains disabled even if somebody manually writes `hoy-privacy-analytics-consent-v1=granted`.

## Analytics runtime boundary

For Production, `analytics-rpc-1.8.1.js` requires both the privacy release gate and explicit consent before analytics storage or transport is allowed. While either gate is false:

- `trackEvent` exits before identifier/payload creation;
- no raw Production event history is written to localStorage;
- stale anonymous/session/pilot analytics state is cleared;
- no Production RPC transport is attempted.

Non-Production QA remains separately testable without creating a Production write path.

## Compatibility and regression protection

The recomposition deliberately keeps the #128 compatibility surface `window.hoyAnalyticsPrivacy181` so existing deny/withdraw/clear behavior remains testable. The dedicated RT-008 gate additionally rejects any reintroduction of the stale consent key.

## Legal / policy boundary

This is a technical compliance candidate, not legal sign-off. Before any Production privacy release, HOY still requires final controller/entity facts, an operational privacy contact, approved purpose/legal-basis and retention decisions, final recipient/processor/transfer disclosure, final notice text, and applicable DE/ES legal review.

## Release decision

**NO RELEASE.** Historical PR #127 is evidence/input only. This current-main successor remains Draft. No Production analytics activation, retention-policy enablement, purge, automatic erasure, business/partner/investor outreach or legal-compliance claim is authorised by this candidate.
