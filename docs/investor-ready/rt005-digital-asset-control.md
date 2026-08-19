# HOY Investor Ready — RT-005 Digital Asset Control

Status: **IN PROGRESS**  
Candidate: clean current-main RT-005-only successor to the RT-005 portion of historical PR #105  
Date: 2026-08-19

## Purpose

RT-005 exists so HOY can be financed, operated, recovered and transferred without a buyer depending on a founder's personal account, password, payment method or recovery channel.

This candidate deliberately contains **no RT-006 SBOM/licence/workflow layer**. RT-006 is owned by the clean technical-DD candidate PR #116.

## 1. Current control position

### GitHub

The audited HOY repositories are currently under the founder GitHub user rather than a company-controlled organization. The target transaction state therefore still requires organizational ownership/recovery evidence, at least two authorized administrators and protected release branches.

Public repository visibility is not treated as an intentional open-source licence grant. Third-party licence/NOTICE governance belongs to RT-006.

### Supabase / production infrastructure

HOY production infrastructure currently requires a documented transition from personal/individual control to the final company/transaction control model. The evidence package must identify project/organization control, billing, administrators, recovery, backup and privileged credential rotation without placing secret values in the data room.

### Domains / DNS / email / social / vendor billing

A single canonical asset/control inventory is still required for launch-critical domains, DNS/registrar, business email/workspace, OpenAI/AI vendors, social accounts and other material services.

### Secrets

The technical reachable-history secret audit is a completed historical sub-gate with exact-fingerprint classification and zero unclassified findings in its reference execution. This clean branch re-runs that gate against all currently advertised branches/tags rather than relying only on the historical branch result.

The secret-history scan does **not** prove company control of privileged credentials. Rotation history, billing/recovery ownership, vault metadata and two-admin coverage remain separate RT-005 controls.

## 2. Target control model

Every launch-/transaction-critical digital asset must have:

1. documented legal/business controller;
2. role-based administrative identity where supported;
3. at least two authorized administrators or an equivalent tested continuity mechanism;
4. MFA and documented recovery;
5. billing owner/payment responsibility recorded;
6. least-privilege access;
7. emergency/break-glass procedure;
8. tested backup/export/recovery path;
9. offboarding procedure;
10. periodic access review.

The target is organizational control, **not shared founder passwords**.

## 3. Fail-closed transfer sequence

No asset is labelled `COMPANY_CONTROLLED` merely because a transfer is planned.

1. Final Parent/entity path is approved under RT-003.
2. Founder/pre-company rights path is executable under RT-004.
3. Company-controlled organization/role identities are created.
4. Backup administration/recovery exists before founder-only access is reduced.
5. Current state is backed up/exported where supported.
6. Privileged credentials are rotated after organizational control exists.
7. Billing, registrant and recovery control is transferred.
8. Independent admin/recovery/deploy access is tested.
9. Evidence is archived in the data room.
10. Only then may the asset be classified as `COMPANY_CONTROLLED`.

## 4. Required asset register fields

For each material system, the DD register stores metadata only:

- asset/system;
- business purpose;
- legal/business controller;
- billing owner;
- primary admin role;
- backup admin/recovery role;
- MFA category;
- recovery channel/role;
- password-manager/vault record identifier **without secret value**;
- last privileged-key rotation date;
- last recovery/backup test date;
- backup/export status;
- offboarding owner;
- status: `PERSONAL`, `TRANSFER_READY`, `COMPANY_CONTROLLED`, `DEPRECATED`.

## 5. GitHub target controls

- company-controlled organization;
- two-admin continuity;
- protected release branches;
- PR-only release-critical changes;
- required QA checks where applicable;
- force-push/deletion restrictions on protected release branches;
- company-controlled Actions secrets and recovery;
- explicit repository-visibility/IP decision.

## 6. Infrastructure target controls

For Supabase and comparable production services:

- company-controlled organization/billing;
- primary + backup administrator;
- project/region/control inventory;
- clear public-vs-secret credential boundary;
- post-transfer privileged-key rotation;
- backup/recovery evidence;
- deployment tied to an exact release state;
- security review after material auth/DDL changes.

## 7. Secret-history sub-gate

Historical reference evidence is in `rt005-secret-history-evidence.md` and the exact classification registry is `rt005-secret-findings-classification.json`.

The clean workflow `Investor Ready RT-005 Secret History Audit`:

- scans the currently reachable Git history of Core/Gastro, Lifestyle and Works;
- proves scanner health with a runtime-only synthetic canary;
- deletes raw findings after sanitization;
- stores no matched secret value in the DD artifact;
- accepts only exact reviewed fingerprints;
- classifies every new fingerprint as `REVIEW_REQUIRED` by default;
- fails closed while any finding is unclassified.

## 8. RT-005 close rule

RT-005 overall remains **IN PROGRESS** until all launch-/transaction-critical systems are either:

- `COMPANY_CONTROLLED`; or
- explicitly `TRANSFER_READY` with documented sequencing, continuity and no unresolved single-person lockout risk acceptable for the intended transaction stage.

Minimum close evidence includes:

- GitHub ownership/control matrix;
- Supabase/infrastructure control matrix;
- domain/DNS/registrar inventory;
- role-email/workspace inventory;
- material vendor billing + recovery record;
- secrets-vault metadata inventory;
- privileged credential rotation evidence where applicable;
- backup/recovery drill evidence;
- two-admin/continuity coverage.

## 9. Explicit non-actions

This candidate performs no repository transfer, visibility change, domain transfer, infrastructure ownership transfer, credential rotation, billing change, Production deployment or external outreach.
