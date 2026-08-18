# HOY Investor Ready v1.0 — IR-02E Proprietary Repository & Deployment Architecture

**Audit date:** 2026-08-18  
**Status:** IMPLEMENTED BOUNDARY / CUTOVER PENDING  
**Scope:** HOY Gastro/Core, Lifestyle, Works source confidentiality and public web delivery

## 1. Decision

HOY must separate **confidential company source/IP** from **browser-delivered public runtime**.

A browser application cannot make shipped JavaScript/CSS confidential: users can inspect files delivered to their device. Therefore HOY's proprietary moat must not depend on secrecy of browser runtime code.

The confidential boundary includes, at minimum:

- Supabase migrations, server/Edge Function source and seeds;
- internal data/research datasets;
- DD, investor, legal and privacy documents;
- internal scripts and automation;
- test/QA source and traces;
- architecture/operations documentation not required at runtime;
- credentials/secrets and service-role material;
- future non-client recommendation/intelligence logic where practical.

## 2. Verified current state

At audit time:

- `hapo3005/hoy` — PUBLIC, personal founder account, GitHub Pages enabled;
- `hapo3005/hoy-lifestyle` — PUBLIC, personal founder account;
- `hapo3005/hoy-works` — PUBLIC, personal founder account;
- no audited root `LICENSE` file was found;
- authenticated GitHub user has no organization membership available for an immediate company-org transfer.

Historical publication cannot be undone: any prior clone/download/fork may continue to exist outside HOY's control. A public→private visibility change protects future GitHub access but does not make already published history confidential again.

## 3. Implemented now — fail-closed public-runtime builder

Files:

- `deploy/public-runtime-policy.json`
- `scripts/build-public-runtime.mjs`
- `scripts/check-ir02e-public-runtime.mjs`
- `.github/workflows/public-runtime-package.yml`

Commands:

- `npm run build:public-runtime`
- `npm run qa:public-runtime`

The builder is allowlist-first. It publishes only approved root browser asset types and explicitly approved static directories.

Excluded by default:

- `.github/`
- `data/`
- `docs/`
- `scripts/`
- `supabase/`
- `tests/`
- test reports / node_modules / local tooling
- Markdown, SQL, CSV, TypeScript, MJS and YAML files
- names suggesting env/private-key/secret/service-role material

Unknown directories are **not** published automatically.

## 4. Public runtime artifact

Each package build creates `dist-public/` plus `public-release-manifest.json` containing:

- exact file list;
- byte size;
- SHA-256 per published file;
- generation timestamp.

The CI gate rejects:

- forbidden paths/extensions;
- selected secret patterns;
- missing `index.html`;
- broken local `src`/`href` references from `index.html`;
- leakage of DD/backend/test paths into the release manifest.

`HOY Public Runtime Package` builds and uploads this runtime artifact separately from source.

## 5. Target architecture

### Private source layer

Target owner: company-controlled HOY GitHub organization after the legal/entity gate.

Target private repositories:

- HOY Core/Gastro source
- HOY Lifestyle source
- HOY Works source

Minimum controls:

- private visibility;
- >=2 organization owners/admin-continuity identities;
- MFA/passkey enforcement where available;
- branch protection/rulesets;
- least-privilege collaborators;
- Actions secrets only in private source organization;
- dependency/security scanning appropriate to plan;
- contributor/IP evidence linked to company records.

### Public delivery layer

Public endpoint contains only the generated `dist-public` artifact.

It must not contain Git history from the confidential source repository and must not contain internal docs, migrations, tests or datasets.

Preferred delivery choices after cutover:

1. dedicated public deployment repository containing generated runtime only; or
2. non-GitHub static hosting/CDN fed by the private source CI.

A deploy-only public repository is acceptable because shipped browser assets are public by nature; confidential source history must remain elsewhere.

## 6. Cutover sequence

### Gate E1 — current

**COMPLETE**

- public/runtime boundary policy;
- deterministic runtime packaging;
- secret/path leakage gate;
- Critical PR QA integration;
- package workflow;
- documented claim boundary.

### Gate E2 — deployment shadow test

**PENDING CI / NO LIVE SWITCH**

- build `dist-public` from a release candidate;
- serve artifact in isolated preview;
- run browser smoke/E2E against artifact;
- compare behavior with current Pages release.

### Gate E3 — company ownership

**BLOCKED BY ORG/ENTITY DECISION**

- establish HOY-controlled GitHub organization;
- add >=2 owner/recovery identities;
- transfer or recreate source repositories under company control;
- confirm billing, Actions, secrets, integrations and Supabase references.

### Gate E4 — public delivery cutover

**PENDING**

- create deploy-only public target OR approved static host;
- publish generated artifact only;
- verify live URL, PWA/service worker, routes and Supabase client connectivity;
- preserve rollback target;
- change old source-repository Pages configuration only after live verification.

### Gate E5 — source confidentiality transition

**PENDING**

- make source repositories private after public runtime has moved;
- verify public forks/history consequences;
- rotate any secrets ever exposed historically;
- audit Git history for credentials/personal data;
- document that pre-cutover public history cannot be claimed confidential.

## 7. What must NOT happen

- Do not simply flip `hapo3005/hoy` private while it is the current Pages source without an already verified replacement deployment.
- Do not claim that making the repository private erases historical public copies/forks.
- Do not put service-role keys or backend credentials into the runtime artifact.
- Do not classify browser-delivered JS as a trade secret merely because the source repository later becomes private.
- Do not move repositories into a founder-only company organization without recovery/admin continuity.

## 8. Buyer-DD position

### Defensible now

- HOY has identified the public-source confidentiality problem.
- HOY has a fail-closed, reproducible public-runtime packaging boundary.
- Internal backend/DD/test/data directories are explicitly excluded from future deployment artifacts.
- Public-runtime leakage is now a Critical PR QA condition.
- The final cutover is staged to avoid breaking the live product.

### Not defensible yet

- HOY source has always been confidential.
- all repositories are company-owned/private.
- the current GitHub Pages deployment already runs from a deploy-only artifact.
- old public clones/forks have disappeared.

## 9. P0 next external/account actions

1. create/approve HOY GitHub organization ownership model;
2. choose final public delivery target;
3. shadow-deploy `dist-public` and run E2E;
4. cut public endpoint to deploy-only runtime;
5. then change private/source ownership and visibility;
6. audit/rotate historically exposed credentials;
7. store screenshots/account evidence for Buyer DD.

## 10. Gate

**Runtime/source boundary:** IMPLEMENTED  
**Leakage CI:** IMPLEMENTED  
**Runtime package workflow:** IMPLEMENTED  
**Live deployment cutover:** NOT EXECUTED  
**Company GitHub organization:** NOT PRESENT AT AUDIT  
**Private company-owned source repos:** NOT YET  
**Historical confidentiality:** CANNOT BE RETROACTIVELY CLAIMED  
**IR-02E status:** IMPLEMENTED FOUNDATION / CUTOVER PENDING
