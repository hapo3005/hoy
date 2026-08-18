# HOY RT-002 — Supabase Migration Reconciliation

Snapshot: **2026-08-18**  
Production project: **HOY La Manga** (`zlscptisdxzxuvllogza`, `eu-central-1`)  
Production mutations during this reconciliation: **none**

## Executive decision

The current Production database and the repository are **not safe for a blind `db push`**. The release path remains manifest-driven and fail-closed.

At this snapshot:

- Production has **78 registered migrations**.
- First registered version: `20260809125845 initial_hoy_schema`.
- Latest registered version: `20260818084329 hoy_245_analytics_contract`.
- Repository `main` used by this reconciliation: `eed49f4897c499b1c3f8c7ca5ad02ab4a4f5520d`.
- Existing `supabase/release/rc1-manifest.json` still records an older source snapshot (`888b525…`) and therefore **must be regenerated before final RC release**.
- `public.restaurant_accessibility` exists with **166** legacy rows, while `public.accessibility_feature_registry` and `public.restaurant_accessibility_facts` are absent.
- `public.restaurant_family_features` is absent after the deliberate Family rollback.
- `public.analytics_events.evidence_trust` is absent in Production; it exists only in the RT-001 hardening candidate until a later canonical migration is approved.
- `public.venue_sales_pipeline`: **168/168** rows still have `send_lock=true`.

## Migration classes

### A — LIVE EQUIVALENT / DO NOT APPLY AGAIN
Repository files whose state is already represented in Production, sometimes under a different remote timestamp/name.

Examples already captured in `rc1-manifest.json`:

- `20260809_hoy_admin_cockpit.sql`
- `20260809_revoke_anon_venue_media_rpcs.sql`
- `20260809_venue_location_verification.sql`
- `20260810_async_menu_extraction_and_eval_baseline.sql`
- `20260810_index_menu_eval_cases_restaurant.sql`
- `20260810_operator_workspace_and_conversion_flow.sql`
- `20260810_operator_workspace_query_indexes.sql`
- `20260811053741_opening_hours_provenance_and_now_gate.sql`
- `20260811_event_promotion_integrity_and_metrics_218.sql`
- `20260812040733_menu_sources_in_app_display_payload.sql`
- `20260812062453_menu_source_completeness_integrity.sql`
- `20260812093348_menu_discovery_checks.sql`
- `20260812_menu_source_authority_tiers.sql`
- `20260815073500_verified_open_ended_events.sql`
- `20260815084500_public_event_provenance_select.sql`
- `20260818090000_hoy_245_analytics_contract.sql`

Important timestamp alias:
- Repo `20260818090000_hoy_245_analytics_contract.sql`
- Production `20260818084329 hoy_245_analytics_contract`
- Decision: **same release component; DO NOT APPLY repo file again**.

### B — LIVE SPLIT / SUPERSEDED / DO NOT APPLY AGAIN
Repository mirrors that correspond to multiple historical Production migrations or have been superseded by later live state.

- `20260809_venue_media_operator_review.sql`
- `20260812_menu_discovery_editorial_pipeline.sql`
- `20260810_events_and_specials_216.sql` (live state has evolved beyond the original repo body)

Decision: use current Production schema/function bodies as baseline and only deploy a **new forward migration** for intentional changes.

### C — SCHEMA LIVE, HISTORY NOT CANONICAL / DO NOT RE-APPLY

- `20260818_accessibility_243.sql`
- `20260818_accessibility_243_policy_fix.sql`

Evidence:
- `public.restaurant_accessibility` exists.
- 166 rows preserved.
- current 2.43-style least-privilege/public-read state is already present.
- no matching 2.43 migration is registered in `supabase_migrations.schema_migrations`.

Decision:
- **Never run these files blindly against Production.**
- Treat them as `LIVE_STATE_CONFIRMED_DO_NOT_APPLY` in the manifest.
- Reconciliation records the mismatch; it does not manufacture duplicate DDL merely to make history look tidy.

### D — DELIBERATELY ROLLED BACK / DO NOT APPLY IN GASTRO RC1

- `20260816_family_playgrounds_240.sql`

Production history contains:
- `family_playgrounds_240`
- `family_playgrounds_240_policy_tune`
- `rollback_family_playgrounds_240_premerge`

Current state:
- `public.restaurant_family_features` absent.

Decision: **DO NOT APPLY in Gastro RC1**. Any later Family reintroduction must be a new, uniquely named, reviewed forward migration.

### E — GENUINELY UNAPPLIED / PENDING PRODUCTION DB GATE

Current repository migration:
- `20260818093100_hoy_accessible_v1.sql`

Expected delta:
- 24 accessibility registry features
- versioned `restaurant_accessibility_facts`
- 668 initial facts from the legacy layer
- initial verification = `external_unverified`
- sync function remains `SECURITY INVOKER`

Decision: still pending isolated schema/data/RLS/advisor test before Production.

### F — NEW RT-001 SECURITY HARDENING CANDIDATE / NOT YET A MIGRATION

Files in draft PR #103:
- `supabase/release/rt001-security-definer-hardening.sql`
- `supabase/release/rt001-security-definer-audit.sql`

Intentional delta:
- harden current privileged RPCs to `search_path=''` with fully qualified non-system objects;
- re-assert narrow EXECUTE roles;
- introduce `analytics_events.evidence_trust` default `client_unverified`;
- prevent raw client metadata from spoofing evidence trust.

Decision:
- **Do not put this directly into Production.**
- First pass isolated dry-run + authorization tests.
- After pass, promote the exact reviewed SQL into one new canonical migration file.

## Canonical next release order after isolated validation

The final ordering must be regenerated from the then-current `main`, but the intended dependency order is:

1. **RT-001 security hardening migration** — only after isolated validation.
2. **HOY Accessible v1** (`20260818093100_hoy_accessible_v1.sql`).
3. Read-only postflight + Security/Performance Advisors.
4. End-to-end verified operator Accessibility write.
5. Final exact-commit browser/security/PWA QA.
6. Production preflight immediately before release.
7. Apply only still-pending manifest entries.
8. Production postflight + advisor comparison + smoke tests.

Reason for placing RT-001 first: it changes existing auth/analytics primitives and can be validated independently before the new Accessibility facts layer is introduced. Accessible v1 is then tested against the hardened authorization baseline.

## Manifest regeneration rule

Before final release, replace the stale snapshot in `rc1-manifest.json` with a new manifest generated from:

- current `main` SHA after approved security/release PRs are merged;
- live Production migration history captured immediately before dry-run/release;
- current schema-presence invariants;
- current advisor baseline;
- exact list of pending forward migrations and apply order.

The manifest must continue to state:

- no blind `db push`;
- no automatic seeds;
- no automatic Edge Function redeploy unrelated to the reviewed delta;
- `send_lock` must remain true until the independent outreach gate is intentionally released;
- no new Security Advisor regression is acceptable.

## RT-002 close criteria

RT-002 is **not closed** by this document alone. It closes when:

1. every repo migration is classified as live-equivalent / superseded / rolled-back / genuinely-unapplied / post-RC;
2. the RT-001 hardening candidate has passed isolated execution and is promoted to one canonical migration;
3. `rc1-manifest.json` is regenerated on the final candidate commit;
4. the intended pending migration order is deterministic;
5. preflight/postflight queries cover both security hardening and Accessible v1;
6. a clean isolated run proves no double-apply, no data loss, no authorization regression and no new advisor regression;
7. only then may the coordinated Production release be considered.
