# RT-004 — IP Chain of Title & Contributor Control

Status: **In progress — all-history contributor census complete; legal execution pending**  
Date: 2026-08-18  
Contact gate: **F0-M remains blocked**

## Objective
Create a buyer/investor-verifiable chain from each material HOY asset to the future HOY Parent. Personal account control, commit history or authorship evidence alone is **not** corporate ownership.

## Current repository evidence
The three core repositories are currently under the personal GitHub account `hapo3005`:
- `hapo3005/hoy`
- `hapo3005/hoy-lifestyle`
- `hapo3005/hoy-works`

## Executed all-history contributor census
The RT-004 GitHub Actions census was executed successfully on 2026-08-18 against all commits reachable from every branch/tag fetched from each repository origin at workflow runtime.

Final successful run:
- workflow: `Investor Ready RT-004 Contributor Audit`
- run ID: `32184547569`
- audited head: `b6d8a80136001c572ee1b7fed34a35b4a10fd8ff`
- artifact: `hoy-rt004-contributor-audit`
- artifact ID: `9341958517`
- artifact SHA-256: `e9d978c70150085bf6cce2b478c7f181d882b2fa7547235ac5bc4f7b6c028a76`

Result:

| Repository | Unique identities | Founder | Platform/Bot | Review required |
|---|---:|---:|---:|---:|
| `hoy` | 4 | 1 | 3 | 0 |
| `hoy-lifestyle` | 2 | 1 | 1 | 0 |
| `hoy-works` | 1 | 1 | 0 | 0 |

**No non-founder human contributor identity is currently present in the reachable-history census.**

### Resolved automation identities
The three non-founder identities in `hoy` are automation/platform identities, not human contributors:
- `GitHub <noreply@github.com>` — GitHub platform committer.
- `HOY Menu Image Publisher <actions@users.noreply.github.com>` — configured by `.github/workflows/menu-image-publish.yml`; GitHub account is `actions`; generated commit `8d9a27a06f1b3f4e6d5bb2055e9abb15bdae40af` publishes only the reviewed Bonobo menu image bundle.
- `HOY Menu Renderer <actions@users.noreply.github.com>` — configured by `.github/workflows/menu-pdf-render.yml`; GitHub account is `actions`; generated commit `7596779664beb4ef810faf3332c3a1e42b531ff3` publishes only reviewed rendered menu pages.

`hoy-lifestyle` additionally contains the GitHub platform committer identity `GitHub <noreply@github.com>`. `hoy-works` contains only the founder identity in the census.

These automation-generated media commits do **not** make the underlying restaurant/menu media founder-owned. Media/source rights remain separately governed by RT-006/RT-007.

## Audit scope caveat
The census is exhaustive for commits reachable from the branches and tags advertised/fetched from the three GitHub origins at execution time. A fresh remote clone cannot prove the absence of historical objects that are no longer reachable from any advertised ref. This is a normal Git limitation and should be disclosed rather than overstated.

## Founder/pre-company rights package — schedule
The future Parent rights agreement should attach a dated asset schedule covering at minimum:
- all three repositories and full Git history under founder control
- database schemas, migrations, Edge Functions and server-side code
- Local Business Graph and taxonomy/data-model design
- HOY NOW / availability / freshness / trust logic
- Accessibility data model and matching logic
- Business / provider / distribution workflows
- Evidence Engine, event taxonomy, Business Value Ledger and Investor Ready artifacts
- Region OS, operating playbooks, onboarding scripts and QA procedures
- brand/logo/design source files, copy and design system
- domains/social handles/digital identities controlled by founder
- founder-created datasets, research structures and verification history, subject to source/data rights
- prompts and AI-assisted outputs to the extent rights permit

## Rights drafting requirement
If German law governs author works, counsel should not casually state that the author's copyright itself is 'assigned'. The agreement should instead grant the Parent the commercially required exclusive usage/exploitation rights with the broadest legally effective scope needed for financing, sublicensing, transfer/acquisition, modification and future exploitation, plus delivery/cooperation duties and disclosure of third-party material.

## Contributor classifications
### Founder-authored
Evidence required:
- Git history / source files / dated work product
- founder signed asset disclosure
- executed pre-company rights agreement to Parent

### Human contributor / contractor
Current census: **none identified**. If a future audit reveals one, require identity, period/scope, agreement status, confidentiality/IP terms, third-party/OSS/AI disclosure and remediation if rights are incomplete.

### Automation / GitHub platform / bots
Do not treat an automation/committer identity as a human author. Preserve the underlying workflow, Git account and commit provenance. The currently identified automation identities are documented in `rt004-contributor-audit-evidence.md`.

### Third-party or imported material
Must be routed to RT-006 (OSS/SBOM/AI/media rights) and RT-007 (Data Rights) rather than being placed in the founder-owned bucket by default.

## Current working conclusion
- **Technical contributor census: COMPLETE.**
- No external human contributor is identified in the reachable history of the three core repositories.
- Founder authorship/control has strong direct Git evidence.
- Contributor-specific assignment remediation is currently **not required**, because no such human contributor is identified.
- Founder-to-Parent rights execution is still mandatory.
- Third-party software/media/data rights remain separate gates.

## RT-004 close condition
RT-004 is DONE only when:
1. ~~all-history contributor audit is complete for all three core repositories~~ — **DONE 2026-08-18**,
2. contributor exception disclosure is retained; current technical result = **NONE IDENTIFIED**, subject to counsel acceptance,
3. founder/pre-company rights agreement and asset schedule are executed with Parent,
4. third-party/OSS/AI/media/data items are linked to their separate rights registers,
5. repository and critical digital-asset control is transferred/controlled according to RT-005,
6. the diligence room contains the signed legal evidence in addition to the technical audit artifact.

Accordingly, **RT-004 remains IN PROGRESS only for legal/entity execution and linked third-party-rights/control gates — not because of an unresolved repository contributor.**

This document is a diligence/control record, not a legal opinion.
