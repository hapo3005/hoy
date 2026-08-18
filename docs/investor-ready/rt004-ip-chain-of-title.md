# RT-004 — IP Chain of Title & Contributor Control

Status: **In progress — evidence gathered, execution package prepared**  
Date: 2026-08-18  
Contact gate: **F0-M remains blocked**

## Objective
Create a buyer/investor-verifiable chain from each material HOY asset to the future HOY Parent. Personal account control, commit history or authorship evidence alone is **not** corporate ownership.

## Current repository evidence
The three core repositories are currently under the personal GitHub account `hapo3005`:
- `hapo3005/hoy`
- `hapo3005/hoy-lifestyle`
- `hapo3005/hoy-works`

Current default-branch head metadata on 2026-08-18 identifies the Git author as `hapo3005` using the founder email on all three repositories. This is a strong founder-authorship/control signal, but **not an exhaustive all-history contributor audit** and not a substitute for executed Parent rights.

## Required all-history contributor audit
For every HOY repository and every branch/tag that contains material code/assets:
1. enumerate every distinct author name + email from `git log --all`,
2. enumerate co-authored-by trailers,
3. map aliases/emails to a legal person or automation account,
4. classify each contribution as founder / employee / contractor / external contributor / bot / imported third-party code,
5. identify whether a written IP/confidentiality agreement exists,
6. review commits with large copied/imported assets separately,
7. retain the raw audit output and signed contributor disclosure in the diligence room.

Recommended local audit commands are provided in `scripts/investor-ready/audit-ip-contributors.sh`.

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
Evidence required:
- identity
- period and scope
- agreement status
- confidentiality/IP terms
- third-party/OSS/AI disclosure
- remediation agreement if rights are incomplete

### Automation / GitHub web-flow / bots
Do not treat a bot/committer identity as a human author. Preserve the underlying Git author and PR/commit provenance.

### Third-party or imported material
Must be routed to RT-006 (OSS/SBOM/AI/media rights) and RT-007 (Data Rights) rather than being placed in the founder-owned bucket by default.

## Current working conclusion
- Founder authorship/control has a strong current signal on all three default-branch heads.
- No external human contributor has been proven by the evidence gathered in this pass.
- **However, absence of proof is not proof of absence.** RT-004 remains open until the all-history audit is run and the contributor disclosure is signed.

## RT-004 close condition
RT-004 is DONE only when:
1. all-history contributor audit is complete for all three core repositories,
2. every human contributor is resolved to signed rights or documented non-material/no-contribution status,
3. founder/pre-company rights agreement and asset schedule are executed with Parent,
4. third-party/OSS/AI/media/data items are linked to their separate rights registers,
5. repository and critical digital-asset control is transferred/controlled according to RT-005,
6. the diligence room contains signed evidence rather than only internal narrative.

This document is a diligence/control record, not a legal opinion.