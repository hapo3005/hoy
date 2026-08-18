# HOY Gastro RC1 — Supabase Release Runbook

Status: **PREPARED / NOT DEPLOYED**  
Snapshot: 2026-08-18  
Target: HOY La Manga (`zlscptisdxzxuvllogza`)  
Code baseline: `main` = `888b525eff280e7c6ed9eaa98ab9807a56cb21e1`  
HOY Accessible code: integrated via PR #89; **database migration still unapplied in Production**

## 1. Purpose

This runbook turns the historical Supabase folder into an explicit release contract. It intentionally **does not** treat every SQL file in `supabase/migrations/` as pending. HOY Production has migration-history drift: several repository files are historical mirrors, consolidated files or timestamp aliases for changes already present in Production.

Therefore:

- never perform a blind all-history production push from the current migration directory;
- never automatically include `supabase/seed/`, `supabase/seeds/` or `scripts/seed-menu-eval-gold.sql`;
- never reapply a file marked `*_DO_NOT_APPLY` in `supabase/release/rc1-manifest.json`;
- regenerate the manifest before the final release if `main`, Supabase schema, Edge Functions or intended RC scope changes.

The manifest is the machine-readable source of truth. This document explains the operator sequence and abort criteria.

## 2. Current production baseline

Read-only verification on 2026-08-18 established:

- `public.restaurant_accessibility` is live with 166 rows;
- all 166 rows have `restaurant_id` and `checked_at`;
- all 166 rows are still `verification_source='public_research'`;
- the 2.43 least-privilege grants and separated admin INSERT/UPDATE/DELETE policies are live;
- `public.accessibility_feature_registry` does not exist;
- `public.restaurant_accessibility_facts` does not exist;
- the Accessible transformation produces 668 initial facts: 300 `yes`, 11 `no`, 357 `unknown`; all 668 are initially `external_unverified`;
- `public.restaurant_family_features` does not exist after the deliberate family rollback;
- `venue_sales_pipeline.send_lock` is `true` for 168/168 rows;
- the deployed `operator-accessibility-confirm` function is active, JWT-protected and source-equivalent to the repository version.

## 3. Migration classification

### A. Historical / already live — never reapply

The manifest contains the exact repository files and their Production evidence. Important timestamp aliases include:

- `20260815084500_public_event_provenance_select.sql` -> Production already records `20260815063657 public_event_provenance_select`;
- `20260818090000_hoy_245_analytics_contract.sql` -> Production already records `20260818084329 hoy_245_analytics_contract`;
- `20260815073500_verified_open_ended_events.sql` -> Production already records `20260815063201 verified_open_ended_events`.

Other bundled repository files are represented by split Production migrations or by schema state already confirmed live. Reapplying them would add risk without adding RC value.

### B. Rolled back by design — never apply in Gastro RC1

`supabase/migrations/20260816_family_playgrounds_240.sql`

Production history contains the original family migration, a policy tune and the deliberate rollback. The table is currently absent. Family research/preview remains fail-closed. Its associated seeds are excluded from RC1.

### C. Genuine pending Production database change

At this snapshot there is exactly one intended new database migration:

`supabase/migrations/20260818093100_hoy_accessible_v1.sql`

The file is now part of `main` through PR #89, while the corresponding database objects are still absent in Production. It is additive and creates:

- `accessibility_feature_registry`;
- `restaurant_accessibility_facts`;
- least-privilege RLS and explicit grants;
- 24 canonical accessibility feature definitions;
- the 668-fact migration from the existing 2.43 audit;
- `hoy_sync_accessibility_facts_from_legacy()` as `SECURITY INVOKER`;
- trigger `hoy_accessibility_fact_sync` so existing operator confirmations create versioned facts.

The legacy `restaurant_accessibility` table remains the fallback and existing operator write path. Because the frontend has a legacy fallback, code integration does not imply permission to mutate Production early.

## 4. Edge Functions

No Edge Function redeploy is required by the current Accessible database delta.

Nine repository-owned functions are active in Production. `operator-accessibility-confirm` has been source-parity checked and must remain unchanged for this rollout. Other functions are outside the current database delta and must not be opportunistically redeployed during the release.

Production-only / currently non-repo-owned functions are listed in the manifest and are explicitly **do not touch** for this RC. `mobility-resolve` is additionally outside Gastro RC1.

## 5. Seeds and data imports

Production auto-seeding is forbidden for RC1.

Existing seed files are historical/editorial/test or depend on intentionally rolled-back Family schema. If a future RC needs a data import, it must be converted into a separate reviewed, idempotent DML step with:

1. explicit target rows;
2. pre-count;
3. deterministic upsert/conflict behavior;
4. post-count;
5. rollback or forward-fix plan.

It must then receive its own manifest entry. It must not be smuggled into the release by a generic seed option.

## 6. Preflight — no mutation

Run `supabase/release/rc1-preflight.sql` against the isolated release environment first, and again against Production immediately before the final rollout.

Hard abort conditions:

- target project/ref is not the intended HOY La Manga project;
- either new Accessible table already exists unexpectedly;
- `restaurant_accessibility` is missing;
- legacy accessibility count is not the expected baseline unless the manifest was deliberately regenerated;
- any legacy row lacks `restaurant_id` or `checked_at`;
- `send_lock` has any false or null row;
- migration history contains an unexpected new equivalent of the Accessible migration;
- a new RC migration exists that is not classified in the manifest;
- Production schema changed after the isolated dry-run without regenerating this package.

## 7. Isolated database gate

The fact that Accessible code is already on `main` does **not** waive the database gate. The sequence is:

1. clone/reproduce the intended Production baseline in an isolated Supabase environment;
2. run preflight;
3. apply only manifest entries with `status=PENDING_PRODUCTION_DB_GATE`, ordered by `apply_order`;
4. run `rc1-postflight.sql` before any operator mutation;
5. verify 24 registry rows and exactly 668 initial facts with the expected status/trust distribution;
6. verify RLS, explicit grants, unique-current-fact index, sync function and trigger;
7. perform one controlled operator accessibility correction in the isolated environment;
8. prove the existing legacy write path creates new current `business_confirmed` facts while preserving superseded historical facts;
9. run Security and Performance Advisors;
10. compare advisor output with the Production baseline. Any **new** RC-caused warning is an abort until resolved.

## 8. Existing advisor baseline

Production already has advisor findings that predate the Accessible migration. They must not be incorrectly attributed to it.

Security baseline includes:

- two RLS-enabled internal menu-eval tables with no policies;
- SECURITY DEFINER execution warnings, including analytics and operator RPCs.

Performance baseline includes unused-index informational findings and several pre-existing `multiple_permissive_policies` warnings.

RC1 acceptance has two layers:

- **delta gate:** the curated RC database migration introduces no new advisor warning;
- **overall security gate:** every existing Security warning is either intentionally justified with authorization tests or remediated before final RC1 sign-off.

The Accessible schema was deliberately written with one permissive SELECT policy per role/action to avoid adding new multiple-policy warnings.

## 9. Final code QA

After the isolated database gate succeeds and before Production release:

1. ensure `main` still equals the manifest baseline or regenerate the manifest;
2. freeze one final RC commit;
3. run Final Release, Static Integrity, Critical PR QA, Desktop Chromium, Mobile Chrome and Mobile WebKit on that same commit;
4. run remaining 320px/overflow, keyboard/focus, offline/PWA and analytics-isolation gates;
5. no known P0/P1 regression may remain.

## 10. Production release sequence

On the eventual production release day:

1. freeze code and regenerate/verify this manifest;
2. confirm database backup/recovery readiness appropriate to the current Supabase plan;
3. capture migration history, advisors and preflight output;
4. apply only still-pending manifest migrations in order;
5. do **not** run historical mirrors;
6. do **not** run seeds;
7. do **not** redeploy unchanged Edge Functions;
8. run postflight immediately;
9. deploy/confirm the matching final HOY frontend/code release;
10. smoke-test guest and operator critical paths;
11. run advisors again and compare delta;
12. release only if all hard gates pass.

## 11. Forward-fix / rollback strategy for Accessible v1

The migration is additive and intentionally leaves the 2.43 table intact. Preferred emergency strategy is therefore **forward-fix, not destructive rollback**:

- stop/disable the new sync path if it misbehaves;
- keep the legacy table and deployed operator function intact;
- retain generated facts for forensic/history analysis;
- let the frontend fail back to legacy data if the normalized facts query is unavailable;
- ship a reviewed corrective migration.

Dropping the new tables in Production should be a last resort because it destroys the newly accumulated history. A destructive rollback may be rehearsed in the isolated environment, but Production should prefer an additive corrective migration.

## 12. Package invalidation rule

This snapshot is valid only for the recorded `main` and Production baseline. Any of the following invalidates it and requires regeneration before release:

- new/changed migration;
- changed Edge Function intended for RC1;
- new seed/data import intended for Production;
- changed RLS/grant contract;
- new Production migration outside this manifest;
- changed expected accessibility counts;
- changed outreach safety policy;
- changed final RC scope.

No technical progress should be converted into Production risk merely because the package once passed. The final release uses the current manifest, not historical approval.
