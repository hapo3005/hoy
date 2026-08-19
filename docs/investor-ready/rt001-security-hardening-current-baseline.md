# HOY Investor Ready — RT-001 current-baseline hardening candidate

Status: **CANDIDATE / NOT APPLIED**  
Date: 2026-08-19  
Parent baseline: PR #124, head `4a405dda51e7cb82a0ecc2e1e992c6e00e6580d6`

## Why this successor exists

Historical PR #103 had the right security intent but became unsafe to apply unchanged after later Privacy migrations revoked Production analytics execution. PR #124 proved the current 95-migration baseline and blocked direct #103 application.

This successor narrows the hardening delta to changes that can be made **without rewriting current function bodies** and without reopening analytics.

## Fresh read-only baseline

Immediately before composing this candidate, Production was re-read and still matched PR #124 exactly:

- 95 registered migrations;
- latest migration `20260818210527`;
- all ten relevant function-definition MD5 values unchanged;
- `PUBLIC`, `anon` and `authenticated` have no `CREATE` privilege in `public`, `private` or `auth`;
- the nine existing operator/helper functions keep `authenticated EXECUTE=true`, `anon=false`, `PUBLIC=false`;
- `log_analytics_event` remains `PUBLIC=false`, `anon=false`, `authenticated=false`.

No Production write was made during that inspection.

## Hardening strategy

### 1. No body rewrite

The candidate contains **zero `CREATE OR REPLACE FUNCTION` statements**. Before any change it compares all ten current `pg_get_functiondef(...)` MD5 values with the verified #124 baseline and aborts on drift.

Inside the transaction it also captures `md5(prosrc)` for every target and proves those bodies remain unchanged after the configuration/grant delta.

This avoids an important failure mode in the historical candidate: copying an older function body over newer product/security logic.

### 2. Search path

Every target is moved to:

`pg_catalog, public, pg_temp`

The ordering is deliberate. PostgreSQL searches the current temporary schema first when `pg_temp` is omitted from `search_path`; for `SECURITY DEFINER` functions the documented safe pattern is to put trusted schemas first and `pg_temp` explicitly last.

`private` and `auth` are removed from the runtime search path because current calls into them are schema-qualified. `public` remains before `pg_temp` because current bodies contain public-owned custom enum type references.

That choice is conditional, not assumed safe: the script aborts unless `PUBLIC`, `anon` and `authenticated` all lack `CREATE` on `public`, `private` and `auth`. This prevents those callers from creating a shadow object in the retained trusted schema.

A future body-normalization migration may move toward an even narrower path after every custom type/object reference and implicit operator/type dependency is explicitly reviewed and separately tested. This candidate intentionally minimizes body churn.

### 3. EXECUTE surface

For the seven public operator/media wrappers and two private authorization helpers:

- revoke from `PUBLIC`;
- revoke from `anon`;
- retain `authenticated` only because this is already the current API contract.

For `public.log_analytics_event(...)`:

- revoke from `PUBLIC`;
- revoke from `anon`;
- revoke from `authenticated`;
- **no re-grant exists anywhere in the candidate**.

The independent Privacy/Consent gate therefore remains authoritative.

## Why SECURITY DEFINER is not declared closed

Supabase recommends `SECURITY INVOKER` by default and treats exposed `SECURITY DEFINER` functions as sensitive because they run with creator privileges. The seven authenticated public wrappers remain `SECURITY DEFINER` in this candidate because changing execution mode without proving equivalent RLS/table authorization could break the narrow API or silently change its security model.

Accordingly, this candidate does **not** declare the seven Advisor warnings resolved merely because search paths and grants are tighter.

Before RT-001 can close, every exposed privileged wrapper must pass negative tests for at least:

- unauthenticated caller;
- authenticated user without membership/claim;
- authenticated member attempting a different restaurant (IDOR/BOLA);
- invalid resource IDs;
- role/grant boundary after hardening.

Security Advisor must then be rerun and every remaining warning explicitly classified.

## Files

- `supabase/release/rt001-security-hardening-current-baseline.sql` — fail-closed candidate; not a canonical migration.
- `supabase/release/rt001-security-hardening-current-baseline-audit.sql` — read-only post-apply evidence queries for an isolated database.
- `supabase/release/rt001-security-hardening-current-baseline.json` — machine-readable status and evidence requirements.
- `tests/rt001-security-hardening-current-baseline.spec.js` — contract regression, including the explicit `pg_temp`-last invariant.

## Promotion path

1. Run the candidate against an isolated database cloned from the verified baseline.
2. Run the read-only audit.
3. Run authorization/IDOR negative tests for all exposed wrappers.
4. Run Supabase Security Advisor before/after.
5. Prove analytics remains inaccessible to `anon` and `authenticated`.
6. If and only if all evidence is acceptable, generate a new canonical migration from the tested delta and reconcile RT-002/final release history.
7. Re-run exact-head application/postflight evidence before any Production release.

## Claim boundary

Defensible now:

> HOY has a fail-closed current-baseline RT-001 hardening candidate that preserves current function bodies and the newer analytics privacy revocation.

Not defensible now:

- RT-001 is closed;
- all seven Security Advisor warnings are resolved or harmless;
- the candidate has been isolated-tested;
- a canonical migration has been generated;
- Production application is authorized;
- analytics may be re-enabled.

## Safety boundary

This work performs no Production DDL/DML, no migration repair, no RPC grant change in Production, no analytics activation, no Terms activation and no outreach.
