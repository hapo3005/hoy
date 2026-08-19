# RT-008 DSAR / Retention Controls — 2026-08-19

Status: **LOCATOR TECHNICAL PASS / RETENTION MECHANISM FAIL-CLOSED / ERASURE & POLICY APPROVAL OPEN**

## Purpose

This control set makes DSAR discovery and analytics retention reproducible without pretending that every linked business/audit record may simply be hard-deleted.

## Private Subject Locator

`private.dd_subject_data_locator(uuid)` returns only table/relationship counts plus an erasure-behaviour classification. It does **not** return record contents and does **not** delete or modify anything.

Access is explicitly revoked from `public`, `anon` and `authenticated`; only `service_role` receives EXECUTE. It is intended for a verified DSAR workflow or controlled rollback fixture, not bulk subject enumeration.

A transaction-only synthetic fixture containing one auth account, one restaurant membership and one operator-created offer returned exactly those three relationships. The transaction was rolled back and a post-check showed zero fixture users, memberships and offers.

## Why there is no one-click hard delete

The Core schema intentionally contains different referential behaviours: CASCADE, SET NULL, RESTRICT and NO ACTION. A prior transaction-only delete probe showed that an operator-created `offers.created_by` reference blocks direct deletion of the auth account. Other audit/business records also require explicit retention/redaction/tombstone decisions.

Therefore this implementation does not claim that `delete auth.users` is a compliant end-to-end erasure workflow. The final workflow must distinguish data that should be deleted from records that must or may lawfully be retained, minimised, redacted or decoupled from the person.

## Analytics retention controls

`private.dd_analytics_retention_preview(timestamptz)` provides a dry-run count for a proposed cutoff.

`private.analytics_retention_policy` is an explicit policy gate. The release file creates no default policy row. An enabled policy is structurally invalid unless `approved_by`, `approved_at` and `legal_basis_note` are present.

`private.execute_approved_analytics_retention(text)` is fail-closed: it refuses to delete if no enabled/approved policy exists and requires a non-empty execution note. Successful executions are recorded in `private.analytics_retention_runs`.

Current live verification on 2026-08-19:

- policy rows: 0;
- enabled policy rows: 0;
- retention run rows after fail-closed probe: 0;
- `anon` / `authenticated` have no locator or purge EXECUTE permission;
- `service_role` is the only application role granted these functions.

Dry-run preview at the verification time:

| Proposed age cutoff | Rows older than cutoff | Distinct anonymous IDs | Distinct sessions |
|---|---:|---:|---:|
| 1 day | 27,828 | 19,196 | 19,218 |
| 3 days | 15,667 | 12,277 | 12,291 |
| 7 days | 2,809 | 2,591 | 2,600 |
| 14 days | 0 | 0 | 0 |
| 30 days | 0 | 0 | 0 |
| 90 days | 0 | 0 | 0 |

These are **impact previews, not approved retention periods**. The current dataset began on 2026-08-09, so longer cutoffs naturally return zero at this point.

## Legal boundary

The GDPR right to erasure is not absolute; the applicable ground, exceptions and lawful retention obligations must be assessed. HOY therefore separates the technical ability to locate/minimise data from the legal decision to erase, retain, anonymise, redact or preserve evidence.

The final policy still needs legal/privacy approval for each processing purpose, including historic analytics, audit evidence, operator-created business content, indirect B2B contacts and future Works data.

## Release boundary

This control pack does not:

- insert or enable an analytics retention policy;
- purge any analytics event;
- automatically hard-delete a user;
- authorise B2B outreach;
- authorise analytics collection without consent;
- close the privacy notice / Article 14 / processor / Works DPIA gates.

Investor outreach and F0-M remain blocked independently.
