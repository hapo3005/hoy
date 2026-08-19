# HOY Gastro RC1 — Supabase Release Runbook

Status: **PREPARED / NOT DEPLOYED**  
Snapshot: 2026-08-19  
Target: HOY La Manga (`zlscptisdxzxuvllogza`)  
Application / release-input baseline: `96b8083aba9a226194ed13f133ec77c6bddf1e32`  
HOY Accessible code: integrated via PR #89; **database state confirmed live in Production**  
HOY Family: **Production schema and audited Family data activated on 2026-08-19 with explicit authorization**

## 0. Snapshot semantics — important

`supabase/release/rc1-manifest.json` is schema v1 and still calls the application/release-input baseline `source.main_sha`. That field name is historical and must **not** be interpreted as a requirement that the repository's current `main` ref forever equals that SHA.

The stored SHA is the code/database-scope input from which this refreshed release snapshot was prepared. Committing or merging the release package itself necessarily creates a newer repository commit and therefore cannot invalidate its own input snapshot merely by existing.

The protection rule is instead:

1. every release-relevant migration currently in the repository must remain classified by the manifest;
2. no intended Edge Function, seed/data import, RLS/grant contract or database-dependent application behavior may change unnoticed after the snapshot;
3. Production must match the captured current baseline;
4. before an actual Production rollout, regenerate/verify the manifest against the current Production baseline and the frozen RC scope;
5. capture the final RC commit in release evidence — do **not** require an embedded file to equal the commit that contains that same file.

## 1. Purpose

This runbook turns the historical Supabase folder into an explicit release contract. It intentionally does **not** treat every SQL file in `supabase/migrations/` as pending. HOY Production contains historical mirrors, split migrations and already-applied schema states.

Therefore:

- never perform a blind all-history Production push;
- never automatically include `supabase/seed/`, `supabase/seeds/` or `scripts/seed-menu-eval-gold.sql`;
- never reapply a migration marked `*_DO_NOT_APPLY`;
- every manual Production data action must remain separately authorized, bounded and evidenced;
- regenerate this snapshot whenever a release-relevant Production or repository assumption changes.

## 2. Current Production baseline — 2026-08-19

Read-only reconciliation confirms:

- `public.restaurant_accessibility`: 166 rows, all with `restaurant_id` and `checked_at`, all 166 still `public_research`;
- `public.accessibility_feature_registry`: present with 24 rows;
- `public.restaurant_accessibility_facts`: present with 668 current facts — 300 `yes`, 11 `no`, 357 `unknown`, all 668 `external_unverified`;
- `public.restaurant_family_features`: present with RLS enabled and 17 verified Family rows;
- exactly 4 Family rows belong to published restaurants and are anon-visible; 13 belong to unpublished draft profiles and remain hidden;
- no Family research row was self-promoted to `hoy_verified`;
- `private.menu_translation_reviews`: present with 0 human review rows;
- public menu-review RPCs use the hardened invoker wrapper pattern and private internals retain the authorization boundary;
- `venue_sales_pipeline.send_lock` is `true` for 168/168 rows;
- total restaurants: 187; published restaurants: 166. The additional Family staging profiles remain unpublished drafts.

## 3. Migration classification

### A. Historical / already live — never reapply

Historical mirrors and timestamp aliases remain explicitly classified in `supabase/release/rc1-manifest.json`. Examples include public event provenance, analytics and older operator/menu migrations.

### B. Family — now live, never blindly reapply

`supabase/migrations/20260816_family_playgrounds_240.sql` is now classified `LIVE_STATE_CONFIRMED_DO_NOT_APPLY`.

The 2026-08-19 authorized activation was controlled:

- schema applied with RLS and explicit grants;
- 18 missing Family research profiles staged as `is_published=false`, `profile_quality='draft'`;
- 0 staging profiles were published;
- 17 audited Family feature rows were inserted/upserted;
- 4 are currently visible to anonymous guests because their restaurants were already published;
- 13 remain hidden because their base profiles are unpublished;
- trust distribution: 3 `operator_confirmed`, 11 `source_verified`, 3 `community_verified`, 0 `hoy_verified`.

This manual action does **not** convert Family seed directories into an automatic release mechanism.

### C. Accessible — current Production state confirmed live

`supabase/migrations/20260818093100_hoy_accessible_v1.sql` is now `LIVE_STATE_CONFIRMED_DO_NOT_APPLY`.

Current evidence is the 24-feature registry plus exactly 668 current facts with the expected 300/11/357 distribution and `external_unverified` trust state.

### D. Menu translation human verification — current Production state confirmed live

Both 2026-08-19 menu-review migrations are classified `LIVE_STATE_CONFIRMED_DO_NOT_APPLY`:

- `20260819104500_menu_translation_human_verification_v1.sql`;
- `20260819110000_menu_translation_human_verification_rpc_hardening_v1.sql`.

The review audit table exists but still has 0 rows, proving installation did not fabricate human verification. Public review RPCs are invoker wrappers; authority stays in private hardened internals.

### E. Pending database delta

At the 2026-08-19 reconciliation snapshot there are **0** migrations with `PENDING_PRODUCTION_DB_GATE`.

Any future pending migration requires a new explicit isolated database gate and a refreshed manifest. A historical prepared package is never permission to mutate Production later.

## 4. Edge Functions

No Edge Function redeploy is required by this reconciliation. Repository-owned active functions and Production-only / currently non-repo-owned functions remain classified in the manifest. Do not opportunistically redeploy unchanged functions.

## 5. Seeds and data imports

Production auto-seeding remains forbidden.

The Family activation was a separately authorized, reviewed and bounded manual Production data action. Its staging and feature seed files stay listed for provenance, but `production_auto_apply=false` remains mandatory.

Any future data import requires:

1. explicit target rows;
2. pre-count;
3. deterministic upsert/conflict behavior;
4. post-count;
5. RLS/visibility verification;
6. rollback or forward-fix plan;
7. separate Production authorization.

## 6. Preflight — no mutation

Before a future Production release, capture current migration history, advisors, safety flags and manifest coverage. Hard abort if:

- target project/ref is wrong;
- any repository migration is unclassified;
- a supposedly live object/count no longer matches the refreshed snapshot without deliberate reconciliation;
- `venue_sales_pipeline.send_lock` has any false or null row;
- a new database-dependent application contract, RLS/grant change, seed/data import or Edge Function change appears without explicit classification;
- Production changes after the isolated dry-run without revalidation.

## 7. Future isolated database gate

There is no pending database migration in this snapshot. If one is added later:

1. reproduce the intended Production baseline in an isolated environment;
2. run read-only preflight;
3. apply only explicitly reviewed `PENDING_PRODUCTION_DB_GATE` entries in order;
4. run postflight and exact invariant checks;
5. exercise the affected operator/guest path;
6. run Security and Performance Advisors;
7. reject any new change-caused warning until resolved.

## 8. Existing advisor baseline

Production already has advisor findings that predate this Family activation. They must not be incorrectly attributed to a new change.

Acceptance has two layers:

- **delta gate:** no new warning introduced by the current change;
- **overall security gate:** every existing Security warning is intentionally justified with authorization tests or remediated before final acquisition/release sign-off.

## 9. Final code QA and release-snapshot refresh

Before any future Production release:

1. freeze the intended final RC scope;
2. verify every release-relevant database/Function/seed/RLS/grant change is classified;
3. regenerate/verify the manifest against the current Production baseline and the frozen RC scope;
4. capture the frozen final RC commit in release evidence;
5. run Final Release, Static Integrity, Critical PR QA, Desktop Chromium, Mobile Chrome and Mobile WebKit;
6. include the Production Family regression: normal URL, no preview flag, verified Family rows loaded, `Mit Kindern` visible;
7. run offline/PWA and analytics-isolation gates;
8. no known P0/P1 regression may remain.

## 10. Production release sequence

1. freeze code and refresh the manifest;
2. capture current backup/recovery readiness, migration history, advisors and safety flags;
3. apply only explicitly reviewed still-pending migrations — if none exist, apply none;
4. do not run generic seeds;
5. do not redeploy unchanged Edge Functions;
6. deploy/confirm matching frontend code;
7. smoke-test guest and operator critical paths, including `Mit Kindern`;
8. run advisors again and compare with baseline;
9. release only if hard gates pass.

## 11. Family safety contract

Family is now a real guest feature, not a sample-only preview. Its safety contract is:

- anonymous guests receive only verified Family rows for published restaurants;
- unpublished Family research profiles remain hidden;
- unknown geometry/sightline/access facts remain unknown;
- no research source may self-award `hoy_verified`;
- Research Preview must never overwrite real verified live Family data;
- `Mit Kindern / Essen & Spielen` is now part of Critical PR QA and Public Runtime smoke coverage.

## 12. Package invalidation rule

This snapshot is evidence, not perpetual approval. Regenerate/revalidate it after any release-relevant change: new/changed migration, Edge Function, intended data import, RLS/grant contract, Production schema state, expected counts, safety policy or database-dependent application contract.

A commit that only hardens this release package does not recursively invalidate its own baseline. A later application commit is not automatically safe merely because it descends from the recorded SHA.