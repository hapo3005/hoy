# HOY IR-02D — Repository Visibility / Proprietary IP Risk

**Audit date:** 2026-08-18  
**Status:** P0 DECISION REQUIRED BEFORE INVESTOR DD

## Verified current state

GitHub connector audit confirmed:

- `hapo3005/hoy` — **public**
- `hapo3005/hoy-lifestyle` — **public**
- `hapo3005/hoy-works` — **public**
- current owner: personal account `hapo3005`
- admin control: evidenced for all three repositories
- root `LICENSE` file: **not found** in the three audited repositories at the time of review

## Rights interpretation

Public visibility does **not** by itself make HOY open-source software. In the absence of an applicable licence, normal copyright rules remain relevant. However, publication exposes the code to anyone who can access GitHub and GitHub users can view/fork a public repository under GitHub's platform terms.

Therefore the DD issue is not framed as automatic loss of ownership. The principal risks are:

- loss of confidentiality/trade-secret value for already disclosed code;
- easier technical replication/competitive inspection;
- historical forks/local copies cannot necessarily be recalled by later making the repository private;
- public Actions/logs/history may reveal implementation detail;
- founder-personal ownership/control remains to be migrated to a HOY company organization;
- repository visibility changes may affect GitHub Pages and related deployment behavior.

## P0 decision gate

Before external Investor/Buyer DD:

1. determine which HOY assets are intended to remain public and which are proprietary/confidential;
2. identify every public GitHub Pages/deployment dependency;
3. check existing forks, clones cannot be enumerated fully, Actions artifacts/logs and secret-scanning state;
4. create the company-controlled HOY GitHub organization after the legal-entity gate;
5. transfer repositories into that organization;
6. decide private/internal/public visibility per repository before transfer/launch;
7. configure at least two organization owners/admin-continuity controls;
8. revalidate Pages, Actions, secrets, environments, integrations and deployment URLs after any visibility/ownership change;
9. retain founder authorship/Chain-of-Title evidence independently of visibility;
10. do not add an open-source licence unless HOY deliberately chooses that licensing strategy.

## Current DD classification

**Ownership/control:** AMBER — founder account/admin control evidenced, formal company ownership pending.  
**Technical transferability:** VERIFIED YES.  
**Confidentiality/proprietary moat:** AMBER/P0 — source already publicly disclosed.  
**Open-source status:** NOT ASSUMED; no root LICENSE file found in audited repos.  
**Visibility change:** NOT EXECUTED — impact assessment required first.

## Claim boundary

### Defensible

- HOY currently controls the three repositories through the founder account.
- the repositories are technically transferable to a future HOY organization.
- repository visibility and licence status have been explicitly audited and documented.

### Not defensible

- that HOY source code has remained confidential;
- that making repositories private later can retract existing copies/forks;
- that the repositories are open source merely because they are public;
- that current personal-account control is buyer-ready company ownership.
