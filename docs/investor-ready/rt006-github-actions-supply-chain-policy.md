# HOY Investor Ready — RT-006 GitHub Actions Supply-Chain Policy

**Baseline:** 2026-08-18  
**Status:** IMPLEMENTED FOR SBOM-BASELINE WORKFLOWS / DD audit workflows pending normalization

## Decision
Launch-/release-/publishing-critical GitHub Actions must be referenced by immutable full commit SHA, not a movable major/minor tag.

Human-readable version comments remain beside the SHA (for example `# v6`) so Dependabot/manual reviews can identify intended upstream release lines without sacrificing immutability.

## Verified action identities
The following commits were verified against the official GitHub `actions/*` repositories before pinning:

| Action | Intended line | Immutable commit |
|---|---|---|
| `actions/checkout` | v6 | `d23441a48e516b6c34aea4fa41551a30e30af803` |
| `actions/setup-node` | v6 | `249970729cb0ef3589644e2896645e5dc5ba9c38` |
| `actions/upload-artifact` | v5 | `330a01c490aca151604b8cf639adc76d48f6c5d4` |
| `actions/upload-artifact` | v4 (legacy DD workflow only) | `ea165f8d65b6e75b540449e92b4886f43607fa02` |

## SBOM-baseline remediation
The RT-006 machine baseline identified **23 tag-based references** across nine existing Core/Gastro workflows. Those baseline references were only the three official actions above.

All 23 baseline references are now converted on the RT-005/006 remediation branch to immutable SHA form. No workflow permissions, business logic, secrets, runtime dependency or deployment target was changed by that conversion.

## Scope distinction
Three Investor-Ready audit workflows were created after the original machine baseline. They must be inventoried against this same policy before RT-006 merge/close; they are not silently counted as part of the historical “23” baseline.

This prevents a misleading metric where newly created audit tooling changes the denominator after remediation.

## Policy
1. New `uses:` references require a full 40-character commit SHA unless the reference is a local action (`./...`) or an explicitly reviewed reusable workflow within HOY.
2. The associated upstream repository, intended semantic release/tag and review date must be recorded.
3. A tag/version comment may accompany the SHA, but must not replace it.
4. Pin updates are security/dependency changes and must pass normal QA.
5. Third-party GitHub Actions are included in SBOM/third-party dependency evidence even when used only in CI.
6. Action updates should be reviewed for compromised/re-written tags, maintainer changes, permission changes, runtime changes and material transitive dependency changes.
7. Workflows with `contents: write`, secrets, deployments or artifact publication receive higher review priority.
8. A pin is not permanent approval: known vulnerabilities or upstream compromise require re-review/update.

## High-risk workflow classes
- workflows with repository write permission;
- workflows able to publish menu/media/runtime assets;
- workflows receiving production/provider secrets;
- deployment/release workflows;
- security/DD workflows whose evidence integrity affects Buyer DD.

## Buyer-DD evidence
For each approved action pin retain:
- action/repository;
- full SHA;
- intended upstream release/tag;
- upstream commit verification evidence where available;
- workflows using the action;
- review date;
- reason for update/exception.

## Gate
**Original tag-ref baseline:** 23  
**Unique baseline third-party actions:** 3  
**Original 23 baseline refs immutable on remediation branch:** YES  
**Newer DD workflows normalized:** PENDING  
**Policy:** ACTIVE ON RT-006 REMEDIATION BRANCH  
**RT-006 Actions subgate:** PARTIAL GREEN — baseline closed, post-baseline audit workflows still to normalize
