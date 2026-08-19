# HOY G1 Authorization Matrix

Stand: 19.08.2026
Scope: HOY Gastro + HOY Works
Status: INTERNAL DD EVIDENCE · CONTACT FREEZE REMAINS ACTIVE

## Purpose

Document the real authorization boundary behind privileged HOY database/Edge-function paths. This file is evidence for G1 Acquisition Clean; it does not by itself release G1 or the contact freeze.

## Supabase live baseline

### HOY Gastro
Project ref: `zlscptisdxzxuvllogza`
Security Advisor: 7 WARN findings. All seven are `authenticated_security_definer_function_executable` on intentional authenticated operator RPCs.

ACL check on 19.08.2026:
- `anon`: EXECUTE = false on all seven RPCs
- `authenticated`: EXECUTE = true on all seven RPCs
- `service_role`: EXECUTE = true on all seven RPCs

Live identity baseline on 19.08.2026:
- `auth.users`: 0
- `restaurant_memberships`: 0

### HOY Works
Project ref: `dqfouwyclvmpkunmxkun`
Security Advisor: 0 findings.
All seven active Edge Functions currently have metadata `verify_jwt=false`, but the live code uses `withSupabase({ auth: 'user' })`, so authentication is enforced by the Supabase server wrapper rather than the Edge gateway flag alone.

## Gastro privileged RPC matrix

| RPC | Entry role | Internal authorization | Cross-tenant / IDOR guard | Residual note |
|---|---|---|---|---|
| `get_operator_workspace(bigint)` | authenticated | `auth.uid()` required; membership for requested restaurant or HOY admin | membership lookup uses both restaurant_id and user_id | SECURITY DEFINER in public; advisor WARN remains |
| `get_venue_media_review(bigint)` | authenticated | `auth.uid()` required; restaurant member or own pending/verified claim | claim/member both scoped to requested restaurant; `can_approve` only true for member | SECURITY DEFINER in public; advisor WARN remains |
| `operator_archive_offer(uuid)` | authenticated | `auth.uid()` + verified membership | offer is loaded first, then membership must match `offer.restaurant_id` | audited write |
| `operator_publish_offer(uuid)` | authenticated | `auth.uid()` + verified membership + verified entitlement | membership tied to offer restaurant; plan must be `pro` or `business`; expiry/event checks | audited write |
| `operator_request_upgrade(bigint, plan_code, text)` | authenticated | `auth.uid()` + verified membership | membership scoped to supplied restaurant_id | only allowed target plans `pro`/`business` |
| `operator_submit_profile_change(bigint,jsonb,text)` | authenticated | `auth.uid()` + verified membership | membership scoped to supplied restaurant_id | field allowlist and length/HTTPS validation before insert |
| `review_venue_media_candidates(bigint,bigint[],bigint[],bigint[])` | authenticated | `auth.uid()` + verified restaurant member | every candidate id must belong to supplied restaurant_id; overlapping decision arrays rejected | audited operator decision path |

### Gastro negative-access production test

A fake authenticated subject UUID with no membership/claim was injected into a transaction-scoped JWT claim context and all seven RPCs were invoked against existing restaurant/offer/media identifiers. The transaction was rolled back.

Result:
- `get_operator_workspace` denied
- `get_venue_media_review` denied
- `operator_archive_offer` denied
- `operator_publish_offer` denied
- `operator_request_upgrade` denied
- `operator_submit_profile_change` denied
- `review_venue_media_candidates` denied

No privileged write was reached. This is a negative BOLA/IDOR boundary test, not a positive-path operator acceptance test.

### Positive/cross-tenant test boundary

A positive-path test was attempted using a transaction-scoped synthetic subject. The database correctly refused insertion of a synthetic `restaurant_memberships` row because `restaurant_memberships.user_id` has a foreign-key dependency on `auth.users`. At the time of the check, both `auth.users` and `restaurant_memberships` contained zero rows.

HOY deliberately did **not** bypass that foreign key, disable constraints, insert directly into `auth.users`, or otherwise weaken Production controls just to make the test pass.

Therefore the controlled positive-path test remains pending until a legitimate test operator identity exists. Required assertion when that identity is available:
- own restaurant succeeds;
- second/unrelated restaurant is denied;
- test evidence records exact identity purpose and is not market/user proof.

## Works Edge Function matrix

| Function | Authentication | Authorization beyond login | Admin-client use after guard | Assessment |
|---|---|---|---|---|
| `provider-request-action` | `withSupabase({auth:'user'})` | provider membership via user-scoped `provider_members`; service eligibility; assigned-provider check for status changes | yes | strong boundary; membership RLS is load-bearing |
| `resolve-service-zone` | `withSupabase({auth:'user'})` | no tenant object mutation; coordinates restricted to regional envelope | no sensitive DB admin path | acceptable; auth stronger than operation requires |
| `provider-onboarding` | `withSupabase({auth:'user'})` + `ctx.userClaims.sub` | application owner is forced to authenticated subject; provider target must exist/active; authorization attestation required | yes, after subject binding | strong subject binding |
| `request-photos` | `withSupabase({auth:'user'})` | upload/complete requires request owner; list requires owner or member of assigned provider; object path prefix binds user+request | yes | strong explicit object authorization |
| `provider-inbox` | `withSupabase({auth:'user'})` | provider membership selected through user-scoped RLS before admin reads; requested provider must be among caller memberships | yes | strong if membership RLS remains intact |
| `request-match` | `withSupabase({auth:'user'})` | request is first loaded through user-scoped `work_requests` RLS | yes, only after allowed request read | strong; request RLS is load-bearing |
| `provider-live-status` | `withSupabase({auth:'user'})` + `ctx.userClaims.sub` | provider membership selected through user-scoped RLS; user id passed to internal RPC | yes | strong if membership RLS + internal RPC both remain intact |

## Works RLS dependencies verified live

`provider_members`:
- authenticated SELECT only when `auth.uid() = user_id`

`provider_applications`:
- authenticated SELECT only when `auth.uid() = applicant_user_id`

`work_requests`:
- INSERT only when `auth.uid() = customer_id`, status is `open`, and `assigned_provider_id` is null
- SELECT only for the request customer or a member of the assigned provider

These policies are security-critical because several Works Edge Functions deliberately use a user-scoped client first, then use `supabaseAdmin` only after that boundary succeeds.

## Current assessment

### Gastro
`AMBER-GREEN`

Strong evidence now exists for anonymous denial and cross-tenant negative denial. The seven advisor WARNs are not dismissed; they remain explicit because Supabase recommends special scrutiny for public-schema SECURITY DEFINER functions and restricted EXECUTE grants.

Residual technical actions before calling this fully GREEN:
1. positive-path acceptance test with a legitimate controlled test operator/member identity;
2. explicit regression test for that valid operator attempting a second restaurant;
3. evaluate a compatibility-safe hardening candidate for SECURITY DEFINER placement/search_path without breaking the operator API;
4. rerun Security Advisor after any DDL/function change.

### Works
`AMBER-GREEN`

Strong code + RLS evidence exists. Residual technical actions:
1. positive-path controlled authenticated tests;
2. explicit cross-provider negative tests using two controlled identities;
3. preserve/lock RLS policies that are load-bearing for `ctx.supabase` authorization;
4. document why each `verify_jwt=false` function uses wrapper-level user auth, or migrate to gateway JWT verification only if compatibility is proven.

## Gate rule

This matrix improves G1 technical evidence. It does **not** change:
- G1 External/Legal = BLOCKED EXTERNAL
- G2 Actual Market Proof = NOT STARTED
- Contact Freeze = ACTIVE
