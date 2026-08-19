# HOY Release-Candidate SBOM Inventory

Stand: 19.08.2026
Status: CANDIDATE · must be regenerated/reconciled on final merged release SHA

## Scope

This inventory combines the deterministic npm QA graph from PR #112 with the direct runtime pins already merged by PR #111 and the main browser runtime dependencies previously classified in RT-006.

It is a human-readable SBOM control document, not yet the final machine-generated buyer SBOM.

## npm lock graph (PR #112)

Lockfile v3, direct dependency `@playwright/test@1.62.0`.

| Package | Version | Dependency class | Licence field in lock |
|---|---:|---|---|
| `@playwright/test` | 1.62.0 | direct dev/QA | Apache-2.0 |
| `playwright` | 1.62.0 | transitive dev/QA | Apache-2.0 |
| `playwright-core` | 1.62.0 | transitive dev/QA | Apache-2.0 |
| `fsevents` | 2.3.2 | optional transitive, Darwin | MIT |

Lock integrity fields are committed for all four packages. QA workflows use `npm ci --ignore-scripts`; the optional `fsevents` install script is therefore not executed by that install mode.

## Supabase / Edge direct runtime pins

Merged PR #111 changed only dependency references, not business logic:

- `npm:@supabase/supabase-js@2.111.0`
- `jsr:@supabase/functions-js@2.111.0/edge-runtime.d.ts`
- `npm:@supabase/server@1.4.1` remains an exact direct import where used

Known functions using the pinned Supabase JS / Functions JS references include:
- admin-ops
- menu-discovery
- menu-editorial-import
- menu-intake-process
- menu-social-handoff
- operator-accessibility-confirm
- operator-hours-confirm
- promotion-insights
- venue-media-approve

## Browser runtime direct dependencies

- Supabase JS browser client: exact 2.111.0 pin in the current HOY shell
- Leaflet: 1.9.4 with SRI attributes in the current HOY shell

## External services (not vendored OSS packages)

- Supabase hosted platform / database / Edge Functions
- OpenAI Responses API used by the menu-intake processing path
- external map/data/source endpoints where explicitly called by a feature

These services belong in vendor/subprocessor/service dependency DD, not in the OSS licence bucket alone.

## CI action dependencies

PR #112 pins all external GitHub Actions references to immutable 40-character SHAs. Current approved map:
- `actions/checkout` v6 → `d23441a48e516b6c34aea4fa41551a30e30af803`
- `actions/setup-node` v6 → `249970729cb0ef3589644e2896645e5dc5ba9c38`
- `actions/upload-artifact` v5 → `330a01c490aca151604b8cf639adc76d48f6c5d4`

The RT-006 verifier previously counted 30 external `uses:` entries and fails closed on a mutable external Action ref.

## Licence working classification

Current classified direct set:
- permissive: Apache-2.0, MIT, BSD-2-Clause
- known direct copyleft: none identified
- unknown/custom: must equal zero in the final buyer release pack

This is a working engineering classification, not legal advice.

## Finalization procedure

After #112 merges and the release commit is frozen:
1. generate machine SBOM from the exact merged tree/lock;
2. enumerate all `npm:`, `jsr:`, CDN and GitHub Action direct references from that tree;
3. reconcile machine output against this inventory;
4. attach licence/NOTICE texts required by the final dependency set;
5. move every unknown/custom/copyleft item to explicit legal disposition;
6. record final release SHA, tool version, generation command and SBOM digest;
7. link Third-Party Notices and AI Asset Register.

## Current status

`AMBER-GREEN`

The dependency graph is materially reproducible and direct runtime pins are in place. Final GREEN requires the final merged release SHA plus machine SBOM/licence reconciliation.
