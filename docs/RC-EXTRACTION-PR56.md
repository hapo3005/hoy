# PR #56 RC extraction note

This branch was originally created as a generic RC staging branch before PR #56 extraction began. Its branch name is historical; the diff in the extraction PR is authoritative.

Permanent RC assets extracted from PR #56:

1. `tests/rc-guest-journey.spec.js` — time-independent guest journey / dead-end gate.
2. `supabase/migrations/20260815084500_public_event_provenance_select.sql` — least-privilege anonymous SELECT grant for public event provenance fields.

Intentionally not carried forward:

- the Trips Summer Club `La Clásica Fiesta Ochentera` smoke tied to a specific August 2026 event window;
- any production DDL execution as part of this extraction.

The migration is part of the final ordered Supabase release package and must remain unapplied until the coordinated HOY RC rollout.
