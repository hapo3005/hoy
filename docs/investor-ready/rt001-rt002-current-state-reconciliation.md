# HOY Investor Ready — RT-001 / RT-002 Current-State Reconciliation

Status: **IN PROGRESS / HISTORICAL PR #103 DIRECT APPLY BLOCKED**  
Snapshot: 2026-08-19  
Production inspection: read-only only.

## Executive finding

The security intent of historical PR #103 remains relevant, but its migration snapshot and one material release assumption are no longer current.

At the original #103 snapshot Production had 78 registered migrations and `20260818084329 hoy_245_analytics_contract` was the latest migration. Current read-only inspection shows:

- **95 registered migrations**;
- latest = `20260818210527 ir02d_link_terms_to_active_privacy_notice`;
- HOY Accessible v1 is already live;
- Source Rights, Business Terms and Privacy governance migrations are already live;
- Production analytics RPC execution is currently revoked from both `anon` and `authenticated` by the later privacy gate.

Accordingly, **PR #103 must not be applied unchanged.**

## Current migration/schema state

Read-only Production evidence:

- `public.restaurant_accessibility` exists — 166 legacy rows;
- `public.accessibility_feature_registry` exists — 24 features;
- `public.restaurant_accessibility_facts` exists — 668 facts;
- `public.restaurant_family_features` remains absent after the prior rollback;
- `private.source_rights_registry` exists;
- `private.business_terms_versions` exists;
- `private.privacy_notice_versions` exists;
- all 168 sales-pipeline rows remain `send_lock=true`.

This invalidates two important historical #103 assumptions:

1. Accessible v1 is **not pending** anymore; it is part of the current Production baseline.
2. migration history can no longer be reconciled from the 78-migration snapshot.

## Current Security Advisor baseline

Current Supabase Security Advisor reports **7 WARN** findings of type `authenticated_security_definer_function_executable` for:

- `public.get_operator_workspace(bigint)`;
- `public.get_venue_media_review(bigint)`;
- `public.operator_archive_offer(uuid)`;
- `public.operator_publish_offer(uuid)`;
- `public.operator_request_upgrade(bigint, plan_code, text)`;
- `public.operator_submit_profile_change(bigint, jsonb, text)`;
- `public.review_venue_media_candidates(bigint, bigint[], bigint[], bigint[])`.

Supabase remediation reference: [Database Linter — authenticated SECURITY DEFINER executable](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable)

These warnings do not by themselves prove an authorization vulnerability. They require control-specific review because the RPCs are intentionally narrow authenticated APIs. The previous architectural decision — keep privileged wrappers only where explicit authorization checks justify them, harden search paths and grants, and test IDOR/authorization negatively — remains the working approach.

## Critical privacy/security reconciliation

Historical #103 hardening file blob:

`aaa76eb3211933a4306d9668136d41e5c0ca1d72`

That candidate explicitly grants `EXECUTE` on `public.log_analytics_event(...)` to `anon` and `authenticated` after recreating the function.

Current Production state is different:

- `log_analytics_event` remains `SECURITY DEFINER`;
- search path currently = `public, pg_temp`;
- `anon` EXECUTE = **false**;
- `authenticated` EXECUTE = **false**;
- `analytics_events.evidence_trust` is not yet present.

The revoked EXECUTE state is a later privacy control. Therefore applying #103 unchanged would **reactivate Production analytics transport before the independent consent/privacy release gate authorizes it**.

Binding decision:

> The historical #103 SQL is **BLOCKED_RECOMPOSE_REQUIRED**. A successor security hardening candidate must preserve analytics RPC revocation by default while reconciling the desired evidence-integrity and function-hardening changes.

## Current function-baseline evidence

The machine snapshot records exact current function-definition MD5 values, search paths and role-execute state for:

- `private.is_hoy_admin`;
- `private.is_restaurant_member`;
- `public.log_analytics_event`;
- the seven advisor-flagged operator/media RPCs.

A future composed RT-001 migration must be built against those exact current definitions or a freshly re-read later baseline. It must not copy an older function body without verifying that no newer migration changed its contract.

## New RT-001 release decision

No new Production DDL is created or applied by this reconciliation PR.

Before a new hardening migration exists:

1. freeze a fresh Production function/schema baseline;
2. compose the intended hardening against current definitions;
3. preserve analytics EXECUTE revocation unless the separate privacy/consent gate explicitly authorizes activation;
4. test the composed migration on an isolated compatible database;
5. run authorization/IDOR negative tests for every exposed privileged RPC;
6. run Security Advisor before/after and classify any remaining warnings;
7. only then promote the exact tested delta to a new uniquely named canonical migration.

## New RT-002 release decision

Migration reconciliation must restart from the **95-migration current baseline**, not from the old 78-migration snapshot.

The final release manifest must classify the actually merged repository state against:

- the 95+ Production migration history at release time;
- current schema presence/data counts;
- current privacy/analytics grants;
- current Source Rights/Terms/Privacy governance state;
- any current-main migration source gaps restored through focused reconciliation PRs;
- the exact pending forward migration list.

No blind `db push` is permitted.

## What remains useful from PR #103

PR #103 remains valuable **reference input** for:

- the seven intentional privileged API surfaces;
- search-path hardening strategy;
- explicit grant minimization;
- authorization/IDOR test intent;
- evidence-integrity design for analytics.

It is no longer the final migration-history authority or a directly applicable release script.

## Claim discipline

Defensible:

> HOY has a current read-only security/migration baseline, has identified seven remaining authenticated SECURITY DEFINER advisor warnings, and has detected that its historical hardening candidate would conflict with a later privacy gate if applied unchanged.

Not defensible:

- RT-001 or RT-002 is closed;
- all Security Advisor warnings are harmless;
- #103 is safe to apply directly;
- analytics may be re-enabled;
- the repository and Production migration history are fully reconciled;
- a Production release is authorized.

## Close criteria

RT-001 / RT-002 remain IN PROGRESS until:

- a new current-baseline hardening delta is composed and isolated-tested;
- analytics privacy revocation is preserved unless separately released;
- all privileged RPCs pass authorization/IDOR negative tests;
- advisor results are accepted with evidence and no unintended regression;
- migration/repository history is reconciled to the final integration head;
- the final manifest is regenerated from current Production immediately before release;
- Production preflight/postflight and exact-head application evidence exist.

## Safety boundary

This reconciliation performs no Production DDL/DML, no migration repair, no RPC grant change, no analytics activation and no outreach.
