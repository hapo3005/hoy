# G1 Edge Final Desired-State Survivor — 2026-08-19

Status: **DRAFT COMPOSED CANDIDATE / NO PRODUCTION DEPLOY / NO MERGE AUTHORITY**

## Composition

This branch is the single technical survivor that composes:

1. current `main` baseline `f63978dad503427dabaa37f222bf10726deba645`;
2. consolidated RT-008 Privacy + Consent + DSAR/Retention + Public Runtime candidate from PR #136 (`cceb87e757fe9ec95e61cc8be734ed978c927c63`);
3. complete 19/19 Edge acquired-state reconciliation from PR #138 (`54c2344858e18e8682a83a22799408d8cca93356`);
4. the latest region-policy transport regression tests from PR #135 (`e21cc50efab56a6aafba0fc0eb40a1f33c8459bb`).

The composition merge commit is `c1c9235999051686f3320e8278d715b356d1b4bf`, with #136, #138 and the latest #135 region-test head as explicit parents.

## Survivor decision

The intended repository survivor is the newer/hardened desired state. Production remains older for nine already-versioned Edge Functions and remains exactly captured for the ten recovered live functions. This candidate does not restore equality by downgrading repository source.

If Production equality is later required for G1, it must be achieved by a separately approved controlled deployment **from this final composed survivor or a reviewed descendant**, with per-function auth/config evidence, rollback plan and post-deploy live fingerprint reconciliation.

## Controls composed

- fail-closed Production analytics release configuration;
- explicit consent / reject / withdrawal UX and cleanup;
- private DSAR locator and fail-closed retention controls;
- processor/recipient/transfer evidence;
- all 19 current Core Edge invocation slugs pinned to `eu-central-1` at the HOY browser/admin invocation boundary;
- unknown Edge Function slugs blocked before transport;
- contradictory observed Edge execution-region response blocked;
- 19/19 active Edge Function acquired-state accounting;
- 10/10 previously missing live sources fingerprinted exactly;
- 9/9 existing repo survivors classified as desired-state ahead of live;
- current public-runtime boundary and RT-006 supply-chain controls.

## Machine gates

`G1 Edge Final Survivor` calls both acquired-state gates and additionally verifies:

- privacy release remains fail closed;
- controller/contact/retention placeholders remain unset;
- EU Edge region policy remains present;
- latest transport/mismatch browser regression probes are present;
- 19/19 acquired-state accounting remains 10 exact + 9 repo-ahead + 0 unaccounted;
- no-deploy/no-redeploy/no-database-mutation/no-auto-merge evidence boundary remains true.

The PR must also pass the existing exact-head RT-008 Privacy, RT-008 Edge Region, G1 Source Parity, G1 Full Reconciliation, Public Runtime, RT-006 Supply Chain, Final Release, Critical PR QA and full Browser QA matrix before any integration decision.

## Safety / non-claims

This candidate does **not** authorize or perform:

- Supabase Edge Function deployment/redeployment;
- database DDL/DML;
- analytics activation;
- retention purge;
- automated user erasure;
- company/provider contract execution;
- business/partner/investor outreach;
- a claim of full GDPR/DSGVO compliance;
- automatic merge.

#132 remains the single G1 Closing Board / status authority.
