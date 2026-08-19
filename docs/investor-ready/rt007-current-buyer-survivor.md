# RT-007 Current Buyer Survivor — 2026-08-19

Status: **READ-ONLY BUYER STATE PROVEN / 36-TARGET REMEDIATION MANIFEST PREPARED / NO APPLY AUTHORIZED**

## Why this survivor exists

Historical PR #106 contains the full research and wave-building history, but its 70 commits / 40-file surface is not the desired buyer-review interface. This successor keeps #106 as immutable provenance evidence while presenting the current acquisition-relevant state in a compact package.

## Current read-only Production state

Observed at `2026-08-19T04:53:27.706239Z`:

- 329 hard direct provenance references across 149 restaurants;
- 324 hard refs belong to the published buyer dataset across 146 published restaurants;
- 5 hard refs are isolated in 3 unpublished/archive records;
- source registry usage: GREEN 1 host/2 refs, AMBER 66/219, RED 14/193, REVIEW_REQUIRED 26/44, NO_REGISTRY 0;
- RED policy failures: 0;
- buyer buckets: 146 published hard-restricted, 18 published conditional/not-transfer-clear, 2 whose currently populated provenance refs are transferable/licensed at source-reference scope only, plus 3 archive carve-outs;
- Business Terms: one draft version, 0 acceptances, 0 business-data confirmations;
- Accessibility: 668 facts remain `external_unverified`, 0 confirmed.

The two source-reference-clear restaurants are **not** claimed as whole-profile legally clean or fully transferable.

## Prepared remediation manifest

The seven historical dry-run waves are consolidated into one machine-readable manifest with 36 exact targets:

- source_url: 12;
- signature: 12 (3 + 9), including conservative first-party-supported copy replacements;
- location_source_url: 12 (4 + 2 + 4 + 2).

Current target state was re-read from Production: all 36 targets still exist at the expected field/value boundary; 34 are published and 2 are archive/unpublished.

If every target still passes source/page review and exact-row preflight at execution time, the projected hard-ref movement is:

- all: 329 → 293;
- published active dataset: 324 → 290;
- archive: 5 → 3.

This creates **zero transfer-clear references by itself**. The destination first-party references remain AMBER/conditional and Business Terms or other rights mechanisms remain required for broader reuse/transfer rights.

## Execution discipline

This survivor intentionally contains **no Production UPDATE/DDL apply package**. Before an apply candidate may be generated:

1. re-fetch every proposed first-party page/source;
2. require the current database value to equal the manifest `currentUrl` exactly;
3. for signature targets, re-check the current copy baseline before replacing copy;
4. re-run source-rights classification and Buyer-Safe counts;
5. generate a separate rollback-tested apply candidate;
6. obtain an explicit Production decision.

## Buyer-safe export

`rt007-buyer-safe-export.sql` is SELECT-only and excludes raw source URLs from buyer-facing result rows. It segregates field-level rights state, restaurant-level buyer buckets and unpublished/archive restricted references. Personal/user-event data remains outside RT-007 and under RT-008.

## Claim boundary

AMBER does not mean transfer-clear. First-party factual verification is not a blanket licence for persistent copying, derivative use, commercialization or transfer. Derived data is not automatically proprietary merely because HOY computes it. This package does not activate Business Terms, authorize data commercialization, execute the buyer export, alter Production data or release outreach.
