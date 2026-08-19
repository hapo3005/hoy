# HOY G1 Internal Closure Status

Stand: 19.08.2026
Status: INTERNAL / ACQUISITION-CLEAN WORKSTREAM
Contact Freeze: ACTIVE

## Executive status

G0 Scope Freeze: GREEN
G1 Internal / Technical: AMBER-GREEN
G1 External / Legal / Ownership: BLOCKED EXTERNAL
G2 Business Prep: GREEN / SEND-LOCKED
G2 Consumer Prep: AMBER / MEASUREMENT-LOCKED
G2 Actual Market Proof: NOT STARTED

The rule is strict: technical progress does not release G1 while external ownership, tax, IP, data-rights, privacy, trademark and contract gates remain unresolved.

## Internal evidence now completed or materially strengthened

- production truth freeze for Gastro and Works
- RLS enabled on all currently exposed public tables at the recorded freeze
- reachable Git history secret audit with no unclassified credential finding
- runtime Supabase dependencies pinned in source
- Works security advisor: 0 findings
- Gastro privileged RPC inventory and function-definition review
- Gastro ACL verification: anon cannot execute the seven privileged SECURITY DEFINER RPCs
- Gastro cross-tenant negative access test: fake authenticated subject denied across all seven privileged RPCs
- Works live Edge Function auth review for all seven functions
- Works load-bearing RLS policy review for provider membership, applications and work requests
- G2 platform demo + truth boundary prepared without inventing traction
- RT-006 supply-chain hardening merged to `main` as PR #112; merge SHA `ff4f3f8075b25cf8833c32821837d2bd72a6a153`

## Current privacy candidate

### PR #128 — privacy analytics fail-closed hotfix on hardened main

PR #109 was closed unmerged and superseded to avoid a stale merge context after #112 changed `main`.

PR #128 is re-materialized directly from `ff4f3f8075b25cf8833c32821837d2bd72a6a153` and changes exactly two files:
- `analytics-rpc-1.8.1.js`
- `tests/privacy-analytics-consent-2.47.spec.js`

Candidate purpose:
- no persistent analytics id/session/history/pilot attribution before explicit granted consent outside QA
- production analytics transport requires explicit consent
- deny/withdraw clears HOY analytics storage
- no consent banner invented; analytics remains off by default until reviewed

Server-side companion already in Production:
- `anon` and `authenticated` cannot execute `log_analytics_event(...)`

Merge rule:
- fresh Final Release + Critical + Browser QA must pass on PR #128 exact head
- patch must remain limited to consent-gating/regression coverage

## Technical items still open

1. **Positive/cross-tenant controlled auth tests**
   - real controlled Gastro operator identity: own restaurant succeeds, second restaurant denied
   - two controlled Works identities: own provider/request succeeds, other provider/request denied

2. **Gastro SECURITY DEFINER hardening decision**
   - seven Supabase Advisor WARNs remain intentionally visible
   - do not blindly revoke authenticated EXECUTE because these are operator APIs
   - evaluate private-schema / search_path / invoker alternatives in an isolated compatibility candidate

3. **Public/private repository boundary cutover**
   - backend source, migrations/seeds, internal data, DD/legal docs, tests and operations scripts need protected company ownership/repositories
   - historical public copies cannot be made confidential retroactively

4. **Release SBOM / notices / AI asset register**
   - candidate inventory prepared
   - final machine SBOM still needs to be generated/reconciled from the exact final release SHA after privacy merge/freeze
   - final licence/unknown/copyleft review remains required

5. **Account / recovery controls**
   - company GitHub organization and at least two recovery/admin paths
   - company Supabase organization/billing control
   - domains/DNS/registrar ownership + MFA/recovery inventory
   - vendor/OpenAI billing + recovery ownership
   - secrets vault and rotation evidence
   - backup/recovery drill

## External blockers — cannot be internally marked GREEN

### Corporate / tax / founder IP
- final sale entity / ownership chain
- EXIT-TAX-01 professional clearance before any residence/tax-right shift
- founder-IP inventory and tax-correct transfer/licence/contribution mechanism
- documented chain of title to sale entity

### Data rights
- legal classification and replacement/clearance of RED/AMBER/REVIEW_REQUIRED source dependencies
- provenance completion, including accessibility source URLs
- media rights gate and operator/open-licence evidence

### Privacy
- counsel-confirmed lawful basis for professional contact research/use
- Article 14 position and operational notice/suppression/retention process
- analytics consent/legal basis decision
- Works privacy/DPIA determination
- DPA/transfer position

### Trademark
- professional clearance of HOY / house mark strategy and exact classes/wording

### Contracts
- counsel-reviewed Business Terms DE/ES
- Pilot Agreement
- LOI/EOI
- DPA
- operator/local-partner agreement
- IP/confidentiality/assignment/change-control clauses
- media/data grant and termination/deletion rules

## Contact Freeze release rule

Do **not** start business/investor/buyer outreach merely because the technical candidates are green.

A release decision requires at minimum:
1. G1 technical blockers reduced to accepted documented residual risk;
2. corporate/IP ownership path legally executable;
3. data-rights/privacy outbound use cleared for the exact G2 process;
4. G2 scripts/offer/price-test terms approved for real use;
5. evidence ledger ready for real-only recording.

Until that point:
- research/mapping = allowed
- internal demo = allowed
- synthetic/courtesy proof = prohibited
- outreach/pilots/payment tests = locked

## Next internal value step

Finish PR #128 on fresh QA, merge only if green, then freeze the resulting release SHA and reconcile the final SBOM/notices/AI-register pack against that exact tree. After that, remaining G1 blockers are predominantly external/legal/ownership rather than additional product feature work.
