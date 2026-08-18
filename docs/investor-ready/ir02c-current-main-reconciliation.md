# HOY Investor Ready — IR-02C Business Terms Current-Main Reconciliation

Status: **TECHNICAL INFRASTRUCTURE LIVE / TERMS DRAFT / MARKET PROOF = 0**  
Snapshot: 2026-08-19  
Scope: reconcile already-applied Production Business Terms infrastructure back into the current Git evidence path without re-running database changes.

## Why this candidate exists

The historical IR-02 umbrella PR #102 contains the Business Terms v1.0 documents, acceptance/confirmation contracts and five migration source files. Read-only inspection of the current HOY La Manga Production project confirms that those five migration versions are already recorded as applied.

Current `main`, however, does not contain those five IR-02C migration source files. That creates a diligence/reproducibility gap: Production history exists, but the current canonical repository history does not fully contain the corresponding source migrations.

This branch repairs the **repository evidence path only**. It does not execute the migrations again.

## Exact restored migration history

The following already-applied migration files are restored byte-identically from historical PR #102:

| Version | Purpose | Git blob |
|---|---|---|
| `20260818201632` | Business Terms acceptance infrastructure | `2f4f7243948bc3730a1cb0bdd5a029b04c8c6242` |
| `20260818201740` | public RPC SECURITY INVOKER hardening | `3ea288cd937b4d9fbbc1d382805846bf6cd59396` |
| `20260818201831` | Business Confirmation exact-snapshot ledger | `31937c3f35c44dc364f56bf06cadfed68b332624` |
| `20260818202531` | register ES legal-localization draft | `e91fb1bb5f52115e88af6070f0fc4c8f9309cc08` |
| `20260818203021` | reconcile DE draft blob reference | `84ab99f092162cf380e334d2d6bfae36844b81e3` |

All five versions were independently observed in `supabase_migrations.schema_migrations` during the read-only 2026-08-19 reconciliation.

## Current Production snapshot

Read-only inspection confirmed:

- `private.business_terms_versions` exists;
- `private.business_terms_acceptances` exists;
- `private.business_data_confirmations` exists;
- `public.get_business_terms_status` is not SECURITY DEFINER;
- `public.operator_accept_business_terms` is not SECURITY DEFINER;
- `public.operator_record_business_confirmation` is not SECURITY DEFINER;
- Terms `1.0` status = `draft`;
- `effective_at` = null;
- `activated_at` = null;
- `counsel_reviewed_at` = null;
- final DE document SHA-256 = null;
- final ES document SHA-256 = null;
- Business Terms Acceptances = **0**;
- Business Data Confirmations = **0**.

The Production Terms row points to DE Git blob:

`a3d6ce5bb442667e1ec3ff9fc42939397e675a0a`

The same exact DE draft blob is restored in this candidate.

## Restored legal/contract evidence

This candidate restores byte-identically:

- DE Terms v1.0 master draft;
- ES Terms v1.0 legal-localization draft;
- Business Terms Acceptance & Evidence Specification v1.0;
- historical IR-02C status/contract register;
- historical Terms governance checker.

The DE/ES files remain drafts. Restoring their exact blobs is evidence preservation, not legal approval.

## Automated reconciliation gate

`scripts/check-ir02c-current-main-reconciliation.mjs`:

1. recomputes the Git blob SHA of every restored migration and core legal/acceptance document;
2. requires exact match to the historical source blobs;
3. runs the original IR-02C Terms governance checker;
4. requires the read-only Production snapshot to show all five migrations as already applied;
5. requires the public RPC snapshot to remain SECURITY INVOKER;
6. requires Terms v1.0 to remain draft/unactivated/unreviewed;
7. requires 0 acceptances and 0 Business Confirmations;
8. explicitly blocks interpreting infrastructure as market proof.

The check is executed by `tests/ir02c-current-main-reconciliation.spec.js` in the existing PR browser matrix.

## Claim discipline

Defensible now:

> HOY has deployed dormant Business Terms/Business Confirmation infrastructure and can reconstruct its exact applied migration/document evidence from the canonical repository candidate.

Not defensible now:

- Terms v1.0 are active or legally approved;
- a business has accepted the Terms;
- any business data is Business Confirmed through this ledger;
- this infrastructure proves operator traction or willingness to pay;
- legal/privacy/entity gates are closed.

## Remaining IR-02C close gates

Before activation/external reliance:

- final HOY legal entity/controller details;
- final DE/ES legal review/localization;
- final document SHA-256 values;
- linked active Privacy Notice/version;
- governing law/jurisdiction and counsel evidence;
- approved acceptance UX and authority wording;
- authenticated operator E2E/negative tests on the final integration state;
- explicit release/activation decision.

## Safety boundary

This candidate performs no Supabase DDL/DML, no migration application/repair, no Terms activation, no business outreach and no investor outreach.
