# RT-007 Ordered Apply Plan v1

## Role

This artifact is the **ordered-plan portion of G1-CB-14**. It converts the already prepared 36-target RT-007 replacement manifest into a bounded, fail-closed execution sequence.

It does **not** authorize Production DML, does not execute any replacement, does not create transfer-clear rights, does not close RT-007, and does not close G1.

## Source authority

- Current buyer-rights survivor: PR #141
- Survivor head: `d0e8927ebe5387696570b52bb3c9064707cb77da`
- Prepared manifest: `rt007-prepared-replacements-v2.json`
- Exact scope: 36 targets = 34 published + 2 unpublished
- Signature targets requiring copy-baseline recheck: 12

Projected hard-reference movement, only after successful approved execution:

- all: 329 → 293
- published: 324 → 290
- unpublished/archive: 5 → 3

These replacements remain **AMBER / conditional first-party factual references** and do not create whole-profile clearance.

## Ordered execution

Seven waves are fixed and must not be silently regrouped:

1. `source_url_wave1` — 12 targets
2. `signature_wave1` — 3 targets
3. `signature_wave2` — 9 targets
4. `location_wave1` — 4 targets
5. `location_wave2` — 2 targets
6. `location_wave3` — 4 targets
7. `location_wave4` — 2 targets

Each wave is one transaction. Every mutation candidate must use exact-value predicates against restaurant id + current field value; signature waves additionally require the approved current-copy baseline. A row-count mismatch aborts the wave.

## Mandatory preflight

Before candidate generation:

- re-fetch all 36 proposed first-party sources;
- re-read the exact current Production row for every target;
- re-read all 12 signature-copy baselines;
- regenerate the buyer-safe rights summary;
- confirm current release/privacy/security boundaries;
- generate a per-target rollback payload with exact prior values;
- obtain a separate explicit Production decision.

If any source, current value, publication state, rights state or expected count drifts, regenerate the plan rather than forcing the old candidate through.

## Rollback discipline

Rollback evidence is required **before** any mutation. It is stored per target and per wave and must include restaurant id, field, prior value, new value, publication state, wave, capture time and evidence hash.

Rollback itself must be guarded by restaurant id + exact newly applied value, preventing accidental overwrite of a later legitimate change.

## Post-wave / post-apply evidence

After every committed wave:

- reconcile the exact target rows read-only;
- rerun buyer-safe rights classification;
- stop on unexpected drift before the next wave.

After all seven waves:

- 36/36 targets must match the reviewed proposed values;
- the 34/2 published/unpublished split must remain exact;
- projected hard refs must reconcile to 293 total / 290 published / 3 unpublished or be treated as drift;
- buyer-safe export must remain SELECT-only and exclude personal/user-event data;
- no whole-profile or transfer-clear claim may be inferred from these replacements;
- final evidence must include exact execution receipts, rollback hashes and post-apply counts.

## Current status

`ORDERED_APPLY_PLAN_PREPARED_NOT_EXECUTED`

Production mutation performed: **false**  
Production apply authorized: **false**
