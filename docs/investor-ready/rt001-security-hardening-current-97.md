# RT-001 Security Hardening — current 97-migration candidate

Status: **CURRENT-STATE CANDIDATE / NOT APPLIED / ISOLATED EXECUTION REQUIRED**

## Why this successor exists

Historical PR #125 is technically strong and its exact head passed Final, Critical and the full Browser matrix. It is nevertheless no longer executable against the current Production state because its fail-closed preflight correctly requires 95 migrations with latest `20260818210527`.

A read-only Production reconciliation on 2026-08-19 found 97 registered migrations with latest `20260819031220`. The two later migrations are `add_private_dd_transferability_exports` and `rt008_private_dsar_retention_controls`.

Crucially, all ten RT-001 target function definitions still match the exact MD5 values pinned by #125. Untrusted `public`, `anon` and `authenticated` roles still have no CREATE privilege in `public`, `private` or `auth`, and `log_analytics_event` remains non-executable by all three roles.

## Selected integration state

This candidate is prepared on top of RT-008 consolidated head `cceb87e757fe9ec95e61cc8be734ed978c927c63`, so Privacy, EU Edge Region and the merged Public Runtime boundary are not discarded while Security is recomposed.

## Design

The SQL is intentionally body-preserving:

- no `CREATE OR REPLACE FUNCTION`;
- ten exact definition hashes are checked before any ALTER;
- all ten functions receive `search_path = pg_catalog, public, pg_temp`;
- `pg_temp` is explicit and last;
- untrusted schema CREATE is a hard precondition and postcondition;
- PUBLIC/anon EXECUTE remains revoked on all privileged targets;
- authenticated EXECUTE is retained only for the nine existing operator/helper APIs;
- analytics EXECUTE stays revoked for PUBLIC, anon and authenticated;
- function body hashes are compared before/after.

## Why 97 is not treated as a cosmetic counter update

The successor asserts both new migration identities in addition to count/latest. If Production advances again, if either recent migration identity differs, if any target function definition changes, if untrusted CREATE appears or if the RPC privilege surface changes, execution fails before hardening.

## Required evidence before promotion

This repository candidate is not RT-001 closure. Before promotion it still requires:

1. execution on an isolated compatible database;
2. paired read-only audit;
3. authenticated / unauthenticated / foreign-restaurant IDOR/BOLA negatives;
4. Security Advisor before/after evidence;
5. proof that analytics EXECUTE remains revoked after hardening;
6. only then generation/review of a canonical migration for any Production decision.

## Claim boundary

No Production DDL/DML was performed to create this candidate. No Production apply is authorised. No Privacy gate may be weakened. No business/partner/investor outreach, paid infrastructure or G1 closure is authorised by this package.
