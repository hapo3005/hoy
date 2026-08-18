# HOY Investor Ready — IR-02A SECURITY DEFINER RPC Review

**Review date:** 2026-08-18  
**Scope:** Live `HOY La Manga` Supabase project and corresponding versioned migrations.  
**Status:** Source-level review completed; coordinated migration deployment + post-deploy advisor rerun still required.

## Review principle

A `SECURITY DEFINER` warning is not automatically an exploitable vulnerability. It is, however, a privileged boundary and must satisfy all of the following:

1. narrow `EXECUTE` grants;
2. explicit authentication/authorization where applicable;
3. resource ownership/membership checks before privileged reads/writes;
4. parameter validation and allowlists;
5. controlled `search_path`;
6. no direct client permission that makes the privileged wrapper unnecessary;
7. auditability for sensitive state changes.

## Reviewed functions

| Function | Intended callers | Source-level guard observed | Review status | Residual action |
|---|---|---|---|---|
| `log_analytics_event(...)` | `anon`, `authenticated` | event-name allowlist; metadata object + 4KB bound; QA/headless isolation; published-restaurant validation; fixed `search_path` | ACCEPTED WITH RESIDUAL LINTER WARNING | Keep direct `analytics_events` writes closed; consider future Edge-Function ingestion/rate-limit architecture if abuse becomes material |
| `get_operator_workspace(bigint)` | authenticated | `auth.uid()` required; restaurant membership or HOY-admin check | ACCEPTED | Post-deploy grant/advisor check |
| `get_venue_media_review(bigint)` | authenticated | `auth.uid()` required; restaurant membership or eligible business claim | ACCEPTED | Post-deploy grant/advisor check |
| `operator_archive_offer(uuid)` | authenticated | `auth.uid()`; verified restaurant membership; row ownership derived from offer; audit log | ACCEPTED | Post-deploy grant/advisor check |
| `operator_publish_offer(uuid)` | authenticated | `auth.uid()`; verified restaurant membership; paid-plan entitlement; expiry/schedule validation; audit log | ACCEPTED | Post-deploy grant/advisor check |
| `operator_request_upgrade(bigint, plan_code, text)` | authenticated | `auth.uid()`; verified membership; plan allowlist; deduplication; audit log | ACCEPTED | Bound free-text note length in a future hardening pass if not already enforced upstream |
| `operator_submit_profile_change(bigint,jsonb,text)` | authenticated | `auth.uid()`; verified membership; JSON object check; field allowlist; field length checks; HTTPS website validation; audit log | ACCEPTED WITH MINOR FOLLOW-UP | Bound optional note length if not already bounded by table constraint |
| `review_venue_media_candidates(...)` | authenticated | `auth.uid()`; verified membership; cross-restaurant candidate rejection; conflicting-decision rejection | ACCEPTED | Post-deploy grant/advisor check |

## Grant contract

Prepared migration `20260818192000_ir02a_dd_hardening.sql` explicitly enforces:

- `log_analytics_event`: `anon`, `authenticated`, `service_role` only;
- all reviewed operator/media RPCs: `authenticated`, `service_role` only;
- `public`/`anon` revoked from authenticated-only operator RPCs.

## Menu eval tables

The live advisor reported `RLS Enabled No Policy` for `menu_eval_cases` and `menu_eval_runs`. The remediation migration adds explicit HOY-admin policies while keeping anonymous access revoked. Service-role automation remains unaffected by RLS bypass.

## DD interpretation

After the migration is deployed and the advisor is re-run:

- the two RLS-no-policy INFO findings should be closed if live schema matches the migration;
- the `SECURITY DEFINER` advisor may still report privileged functions whose exposure is intentionally retained;
- those residual findings must be presented as **reviewed privileged interfaces with explicit authorization contracts**, not falsely reported as “zero findings” unless the advisor actually returns zero.

## Exit / transferability relevance

The security model is only fully DD-ready when the buyer can reproduce:

- migration history;
- function grants;
- RLS policies;
- Supabase project ownership/admin access;
- secrets/Edge Function configuration;
- post-deployment verification evidence.
