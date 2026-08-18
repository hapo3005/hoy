# HOY Investor Ready — RT-005 Digital Asset Control

Status: **IN PROGRESS / preparation complete, transfers not executed**

This control exists to ensure HOY can be financed, operated, recovered and later transferred without depending on the founder's personal accounts.

## 1. Current verified control surface

### GitHub
- `hapo3005/hoy` — personal user owner, public repository, founder has admin rights.
- `hapo3005/hoy-lifestyle` — personal user owner, public repository, founder has admin rights.
- `hapo3005/hoy-works` — personal user owner, public repository, founder has admin rights.
- Current main-branch metadata reviewed during RT-004 showed the branches were not protected.
- No HOY repository currently contains a root `LICENSE` file. Public visibility must not be confused with an intentional open-source licensing decision.

### Supabase
- Connected organization: `Jan` (`znbomiyhpfziljpeprjq`).
- Active project: HOY La Manga (`zlscptisdxzxuvllogza`), `eu-central-1`.
- Active project: HOY Works (`dqfouwyclvmpkunmxkun`), `eu-central-1`.
- One unrelated/inactive project also exists in the same personal organization and is outside the HOY asset perimeter unless later proven otherwise.

### Secrets / vendor credentials
The HOY Core workflows currently reference at least:
- `OPENAI_API_KEY`
- `HOY_SUPABASE_SECRET_KEY`

These are referenced as GitHub Actions secrets rather than committed plaintext in the reviewed workflow, but the account owner, billing owner, recovery method, second administrator and rotation evidence are not yet corporate DD evidence.

### Domains / DNS / email / social / billing
A canonical registrant/admin/recovery inventory is not yet present in the DD room. These remain P0 inventory items even if the assets are operational today.

## 2. Target control model

Every critical HOY digital asset must have:
1. a legal owner/controller aligned to the HOY Parent;
2. a role-based administrative identity where the platform permits it;
3. at least two authorized administrators for business continuity;
4. MFA and documented recovery;
5. billing owner and payment method recorded;
6. least-privilege roles;
7. an emergency-access / break-glass process;
8. a tested backup/export or recovery path;
9. an offboarding procedure;
10. a quarterly access review.

The target is **not** to share founder passwords. It is to move from personal control to auditable organizational control.

## 3. Transfer sequence — fail closed

No transfer is performed before the Parent structure is validated.

1. Parent / legal entity path approved (RT-003).
2. Founder/pre-company rights package executable (RT-004).
3. Create company-controlled role identities / organization accounts.
4. Add backup administrator before removing or downgrading founder-only access.
5. Export/backup current state where supported.
6. Rotate privileged credentials after organizational control exists.
7. Transfer billing/recovery/registrant ownership.
8. Test independent recovery/deploy/admin access.
9. Record evidence in the DD room.
10. Only then classify the asset `COMPANY CONTROLLED`.

## 4. GitHub target controls

For the company GitHub organization:
- Parent/company owns the organization.
- Two admins minimum.
- Main branches protected.
- PR-only changes for release-critical repositories.
- Required Critical / Browser / Final Release checks where applicable.
- Force-push and branch deletion disabled on protected release branches.
- Secret scanning and dependency review evidence retained.
- GitHub Actions secrets owned/rotated under company control.
- Visibility of each repository is an explicit IP/security decision, not a historical default.

**Do not add a permissive OSS license to HOY itself merely because the repository is public.** Project licensing is a separate Parent/IP decision. Third-party notices are handled separately in RT-006.

## 5. Supabase target controls

For HOY production projects:
- Company-controlled organization/billing.
- Primary + backup project administrator.
- Project IDs and regions recorded in asset register.
- Publishable keys separated from secret/service credentials.
- Secret rotation procedure after transfer.
- Database backup/recovery evidence.
- Edge Function and migration deployment process tied to exact release commit.
- Security Advisor review retained after material DDL/auth changes.

The unrelated inactive personal project is explicitly excluded unless a future asset review links it to HOY.

## 6. Credential / recovery register fields

For each system store **metadata only** in DD artifacts, never the secret itself:
- system / asset;
- business purpose;
- legal owner;
- billing owner;
- primary admin;
- backup admin;
- MFA method category;
- recovery role/email;
- password-manager vault record ID;
- last key rotation date;
- last recovery test date;
- backup/export status;
- offboarding owner;
- status: `PERSONAL`, `TRANSFER READY`, `COMPANY CONTROLLED`, `DEPRECATED`.

## 7. F0-M close rule

RT-005 may close only when all launch-critical systems are either:
- `COMPANY CONTROLLED`; or
- explicitly documented as `TRANSFER READY` with no single-person lockout risk and counsel-approved sequencing if legal formation is still being completed.

Minimum F0-M evidence:
- GitHub organization/control matrix;
- Supabase organization/control matrix;
- domain/DNS/registrar inventory;
- role-email/workspace inventory;
- OpenAI/vendor billing + recovery ownership record;
- secrets-vault inventory (metadata only);
- backup/recovery drill evidence;
- two-admin coverage for every launch-critical system.

## 8. Non-actions in this RT-005 preparation pass

- no repository transfer;
- no repository visibility change;
- no domain transfer;
- no Supabase organization/project transfer;
- no credential/key rotation;
- no billing-account change;
- no production deployment;
- no external contact.
