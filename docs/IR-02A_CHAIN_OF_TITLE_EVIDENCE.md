# HOY Investor Ready — IR-02A Chain-of-Title Evidence File

**Audit date:** 2026-08-18  
**Status:** Founder assignment package prepared; execution + final contributor census still required.  
**DD gate:** `FOUNDER_ASSIGNMENT_PACKAGE_READY_EXECUTION_PENDING`

## 1. Legal model used by HOY

For German-law copyright assets, HOY does **not** describe the transaction as a transfer of the copyright itself. The execution draft instead grants the Company exclusive, worldwide, transferable/sublicensable rights of use to the fullest legally permissible extent and separately assigns other transferable IP rights.

Unknown future types of use, moral-rights issues, future works and remuneration/form requirements are expressly left subject to mandatory law and final German counsel review.

## 2. Core assets in scope

| Asset | Repository / system | Current verified control/authorship evidence | Current ownership class | Missing DD evidence |
|---|---|---|---|---|
| HOY Gastro/Core | `hapo3005/hoy` | repo owner `hapo3005`; admin control observed; sampled current commit authored by `hapo3005` | O2/O8 | signed Founder IP Assignment; full history-wide contributor census; exceptions |
| HOY Works | `hapo3005/hoy-works` | repo owner `hapo3005`; admin control observed; sampled recent commit authored by `hapo3005` | O2/O8 | signed assignment; full contributor census |
| HOY Lifestyle | `hapo3005/hoy-lifestyle` | repo owner `hapo3005`; admin control observed; sampled initial + recent commits authored by `hapo3005` | O2/O8 | signed assignment; full contributor census |
| HOY La Manga backend | Supabase project `HOY La Manga` | active live project, schema/migrations and production history audited | O2/O8 | legal/account owner, billing/admin/recovery evidence + assignment/account transfer record |
| HOY Works backend | Supabase project `HOY Works` | active project and schema/function history audited | O2/O8 | legal/account owner, billing/admin/recovery evidence + assignment/account transfer record |
| HOY taxonomies / trust / accessibility / intelligence / product standards | versioned code/docs/data | repository evidence and production implementation | O2/O8 | explicit signed inclusion in Founder Schedule A |
| HOY Investor/Buyer Ready documentation | versioned project docs | current repository evidence | O2/O8 | explicit assignment |
| HOY brand/design assets | repository/product assets | operational control only | O8 | creator/source register + trademark/domain evidence |

## 3. Repository control evidence

Audited repository metadata shows all three repositories are owned by the GitHub user account `hapo3005` and the connected user has `admin`, `maintain`, `push`, `pull` and `triage` permissions:

- `hapo3005/hoy` — GitHub repository ID `1328826771`
- `hapo3005/hoy-lifestyle` — GitHub repository ID `1330175210`
- `hapo3005/hoy-works` — GitHub repository ID `1331755652`

**Interpretation:** strong evidence of custody and administrative control, but not proof that every file is exclusively owned by the Founder.

## 4. Sampled authorship evidence

The audit intentionally checks author metadata instead of inferring authorship from repo ownership alone.

| Repo | Commit | Evidence | Result |
|---|---|---|---|
| Gastro/Core | `eed49f4897c499b1c3f8c7ca5ad02ab4a4f5520d` | current audited commit | author login `hapo3005` |
| Lifestyle | `03281eb10c5d01be79b815d86ee7faaea0c1333f` | initial audited README commit | author `hapo3005`; committer `web-flow` |
| Lifestyle | `bc3ca419bf350ecf42560e3379342ce36a34a56c` | recent audited research-data commit | author + committer `hapo3005` |
| Works | `a76aa87416a57dbfd8c079b534b2e064e3654516` | recent audited commit | author + committer `hapo3005` |

`web-flow` in the Lifestyle metadata is recorded as the GitHub committer while `hapo3005` is the author. HOY therefore does not classify `web-flow` as a human co-author based on that metadata alone.

### Evidence limitation

This is **sampled evidence**, not yet a full history-wide contributor census. The DD file must not say “sole author of every line” until the full census and Founder confirmation are complete.

## 5. Founder assignment package now prepared

### A. Founder IP Assignment execution draft
`docs/IR-02A_FOUNDER_IP_ASSIGNMENT_DRAFT.md`

Covers:
- exclusive copyright usage rights rather than an invalid blanket copyright-title transfer;
- code, schemas, migrations, original taxonomies, product standards and documentation;
- transferable trademark/domain/design/patent/database rights to the extent actually owned;
- modification/non-attribution consent to the legally permissible extent;
- M&A transfer/sublicensing language;
- third-party/data/privacy/AI exclusions;
- further-assurance and registry/account-transfer obligations;
- private execution/signature checklist.

### B. Founder IP Ownership Declaration draft
`docs/IR-02A_FOUNDER_IP_OWNERSHIP_DECLARATION_DRAFT.md`

Purpose:
- create founder-side factual DD evidence now;
- capture prior-assignment/employer/client/contributor disclosures;
- record the undertaking to transfer Founder-controlled HOY IP to the final operating entity;
- avoid pretending a transfer to an unidentified/non-capable entity has already occurred.

### C. Machine-readable Founder IP Schedule
`data/ir-02a-founder-ip-schedule-2026-08-18.json`

Contains:
- repository IDs/control evidence;
- sampled authorship evidence;
- backend/system references;
- product-IP categories;
- registry assets still requiring evidence;
- mandatory exclusions;
- execution dependencies.

## 6. Assignment schedule — minimum asset categories

The final signed Schedule A must explicitly cover, where legally applicable:

- source code, migrations, Edge Functions, scripts and tests;
- database schemas and HOY-created taxonomies;
- original UX/UI/design-system assets actually owned by the Founder;
- HOY-created documentation, standards, research methodologies and data models;
- original translations/editorial content to the extent rights are held;
- rights in contractor/employee deliverables already assigned to the Founder;
- domain/trademark/application/design/patent rights where personally held;
- build/release artifacts and original operational documentation;
- HOY Core, Gastro, Lifestyle, Works, NOW, Trust/Verification, Accessibility, Intelligence and Region architecture.

## 7. Exclusions that remain exclusions

The assignment package expressly does **not** imply proprietary ownership of:

- third-party/open-source libraries;
- third-party business facts or menus/source content merely because HOY stores them;
- operator/third-party media without sufficient licence/assignment;
- external directory/marketplace content;
- personal data as an IP/property asset;
- public/open data beyond applicable rights;
- AI-generated material beyond legally available rights;
- contributor material whose rights have not yet been validly cleared.

## 8. Contributor evidence protocol

For each repository, the final DD file must retain:

1. contributor identity/login;
2. contribution period;
3. relationship to HOY/Founder (`founder`, `employee`, `contractor`, `external`, `bot/tool`);
4. authorship vs committer/tool distinction;
5. applicable rights basis;
6. signed agreement/evidence reference where required;
7. known third-party copied/adapted material;
8. final status: `CLEAR`, `ASSIGNMENT_REQUIRED`, `REVIEW_REQUIRED`, `EXCLUDED_THIRD_PARTY`.

## 9. Remaining P0 actions

1. Founder personally completes/confirms the Ownership Declaration checkboxes and exceptions.
2. Identify the definitive HOY acquiring legal entity.
3. Complete the full repository-history contributor census.
4. Resolve any contributor exceptions discovered.
5. Complete Brand/Domain/Trademark Register.
6. Confirm consideration/contribution/accounting/tax treatment with legal/tax adviser.
7. German counsel reviews the final execution agreement, including mandatory form/unknown-use/moral-rights clauses.
8. Sign the Founder IP Assignment and store the executed copy in the **private** HOY Legal Data Room.
9. Only then move covered assets from `O2/O8` to `O1`.

## 10. Current conclusion

**Repository control + sampled founder authorship + a prepared assignment package now form a materially stronger Chain-of-Title evidence set.**

However:

> **NOT YET O1 / NOT YET FULL CHAIN-OF-TITLE COMPLETE.**

A draft is not a transfer. A GitHub owner is not automatically the copyright owner of every contribution. HOY will only mark Founder-controlled assets `O1` after the final entity, contributor exceptions, legal/tax mechanics and executed assignment are evidenced.

No signature or legal transfer is represented as completed by this document.
