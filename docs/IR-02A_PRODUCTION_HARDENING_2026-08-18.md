# IR-02A Production Hardening Evidence — 2026-08-18

**Project:** HOY La Manga  
**Purpose:** Investor-/Buyer-DD evidence for the IR-02A production hardening pass.  
**Status:** Production database hardening applied and live-verified. Latest application/browser QA remains a separate PR gate.

## 1. Production migrations applied

The Supabase production migration history records these migrations in order:

1. `20260818192515_hoy_accessible_v1_canonical_fact_layer`
2. `20260818192549_accessibility_provenance_constraint_repair`
3. `20260818192607_ir02a_dd_hardening_v2`

The first deploy created the canonical accessibility fact layer. The first hardening attempt then correctly failed atomically because a `NOT VALID` check constraint still validates rows when they are updated. The constraint was repaired so historical source-less external claims may remain only as explicit `review_needed`/`disputed` audit rows. The corrected hardening migration then applied successfully.

No provenance was fabricated to make the deploy pass.

## 2. Canonical accessibility layer — live verification

Post-deploy database verification returned:

| Check | Live result |
|---|---:|
| Accessibility feature registry | 24 |
| Canonical accessibility facts | 668 |
| Current facts | 668 |
| `review_needed` current facts | 311 |
| source-less external non-unknown facts still marked `clean` | **0** |
| provenance constraint exists | yes |
| legacy→canonical sync trigger exists | yes |

Interpretation: historical research is retained for auditability, but unproven positive/negative claims are no longer represented as clean DD-grade evidence.

## 3. Role-level fail-closed verification

### `anon`

Live role test:

- visible canonical facts: **357**
- visible `unknown`: **357**
- visible non-unknown: **0**
- visible unproven external non-unknown: **0**

### `authenticated` without a user JWT

Live role test:

- visible canonical facts: **357**
- visible `unknown`: **357**
- visible non-unknown: **0**

This confirms that ordinary clients cannot currently observe source-less external `yes/no` accessibility assertions through the canonical fact layer.

## 4. Legacy accessibility source state

Before canonical migration, live `restaurant_accessibility` contained:

- 166 rows
- 166 `public_research`
- 0 operator-confirmed
- 0 onsite/HOY-verified
- 0 non-empty `source_url`

Therefore the fail-closed change did not suppress any existing operator-confirmed or onsite-verifed accessibility facts. It prevented research-only statements without concrete provenance from being surfaced as confirmed facts.

## 5. Menu-eval RLS advisor findings

Before hardening, the Supabase Security Advisor reported `rls_enabled_no_policy` for:

- `public.menu_eval_cases`
- `public.menu_eval_runs`

IR-02A added explicit HOY-admin policies while preserving the existing service-role-only table grants. After deployment, both advisor findings disappeared.

## 6. SECURITY DEFINER advisor status

The Security Advisor still intentionally reports the following privileged RPC boundaries:

- anonymous: `log_analytics_event(...)`
- authenticated: `get_operator_workspace(...)`
- authenticated: `get_venue_media_review(...)`
- authenticated: `log_analytics_event(...)`
- authenticated: `operator_archive_offer(...)`
- authenticated: `operator_publish_offer(...)`
- authenticated: `operator_request_upgrade(...)`
- authenticated: `operator_submit_profile_change(...)`
- authenticated: `review_venue_media_candidates(...)`

These warnings are **not marked resolved** merely because the functions were reviewed. The source-level review found explicit authentication/membership/input guards appropriate to their current use, and grants have been restricted to intended caller roles. They remain documented security-review items because a database linter cannot prove application-specific authorization intent.

A future architecture may move privileged helpers behind a non-exposed schema or server/Edge boundary where practical, but that refactor is not falsely claimed as completed here.

## 7. Application-side accessibility gate

PR #102 updates the consumer runtime to version `2.43.1`.

For `public_research` accessibility data with no concrete `source_url`, the UI now forces granular values to `unknown` and overall state `D`. Operator and onsite verification remain trusted direct evidence paths.

Regression coverage was added for:

- public-research facts without a source URL failing closed
- operator-confirmed facts remaining publishable without an external source URL
- confirmed/partial/barrier/unknown display semantics

## 8. CI / release boundary

On the pre-deploy PR head, GitHub Actions showed:

- Final Release static integrity: success
- PR Browser static-integrity: success
- full browser matrix: running at the time of production hardening
- Critical PR QA: running at the time of production hardening

Subsequent commits reconcile repository migration history with the exact production migration versions, so the latest PR head must complete its own CI before PR #102 is considered merge-ready.

**PR remains Draft.** Production database hardening does not constitute automatic approval of all application changes.

## 9. Migration-history reconciliation

The repository now records the exact production migration versions listed in section 1. Earlier pending/draft migration files that were not present under those versions in the production migration history were removed from the IR-02A branch and replaced by the deployed records.

This avoids a future state where a migration runner attempts to replay an older pending accessibility migration after the equivalent production schema already exists.

## 10. DD conclusion

### Technically closed in this pass

- canonical Accessibility v1 fact layer deployed
- source-less external claims audit-gated
- fail-closed canonical RLS verified as `anon` and non-JWT `authenticated`
- 0 source-less external non-unknown canonical facts remain `clean`
- menu-eval no-policy advisor findings closed
- intentional privileged RPC grants restricted/documented
- production migration history reconciled into the PR

### Still open before full Investor DD Ready

- source-by-source rights/legal review
- Founder IP Assignment / formal Chain of Title
- contributor assignments where applicable
- privacy legal-basis/retention/ROPA/DPA evidence
- business content/media terms and change-of-control rights
- authoritative brand/domain/trademark evidence
- actual external accessibility evidence or business/onsite confirmation for the 311 review-gated facts
- latest full application CI on the final PR head

**Gate:** `TECHNICAL_PRODUCTION_HARDENING_COMPLETE / FULL_INVESTOR_DD_NOT_YET_COMPLETE`
