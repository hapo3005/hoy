# HOY Privacy Fail-Closed Evidence

Stand: 19.08.2026
Status: INTERNAL DD EVIDENCE

## Production server-side control

Supabase project: `zlscptisdxzxuvllogza`
Function: `public.log_analytics_event(text,bigint,uuid,uuid,jsonb)`

Live privilege check on 19.08.2026:
- `anon` EXECUTE: **false**
- `authenticated` EXECUTE: **false**
- `service_role` EXECUTE: **true**
- function is `SECURITY DEFINER`
- ACL: `postgres`, `service_role` only

Meaning: the currently published browser client cannot write new Production analytics events through this RPC using a public/anonymous or normal authenticated browser token.

## Client-side candidate

PR #128 (`privacy/analytics-consent-fail-closed-v2`) re-materializes the two-file browser-side hotfix on the hardened `main` after RT-006 PR #112 merged.

It adds:
- analytics consent defaults to unset / not granted;
- no analytics identifier, session identifier, local event history or proof-pilot attribution is created outside QA unless consent is explicitly `granted`;
- Production transport additionally requires explicit granted consent;
- deny/withdraw clears analytics identifiers/history;
- no consent banner is invented by the hotfix; Production analytics stays off by default until the lawful-basis/UX decision is approved.

PR #109 is closed unmerged and superseded by #128 to avoid a stale base context.

## Defense in depth

Current live state before #128 merge:
- server transport = fail-closed for browser roles;
- old client may still create local analytics identifiers/history in the browser.

State intended after #128 merge:
- server transport remains fail-closed unless later deliberately re-authorized;
- client local analytics storage is also fail-closed until explicit consent.

## Gate

PR #128 must not merge until fresh current-main Final Release, Critical and Browser QA are green and the final two-file patch remains limited to the consent-gating behavior/regression test.

This evidence does not decide the legal basis or whether HOY should later enable analytics. That remains a privacy-counsel/product decision.
