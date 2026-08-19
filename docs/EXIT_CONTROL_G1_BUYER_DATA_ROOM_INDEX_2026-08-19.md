# HOY EXIT CONTROL v2.0 — Buyer Data Room Index

**Date:** 2026-08-19  
**Gate:** G1 — Acquisition Clean  
**Status:** SHADOW DATA ROOM / INTERNAL ONLY  
**External outreach:** BLOCKED until release gate

This index is the acquisition-grade map for buyer/investor due diligence. It separates evidence already present from evidence that is prepared but not executed, and from evidence that still requires external/legal completion.

## 00 — Executive / Company Overview

| Item | Evidence | Status |
|---|---|---|
| HOY platform overview | Existing product/Investor Ready documentation | AMBER — consolidate final acquisition narrative |
| Product family perimeter | Gastro / Lifestyle / Works + common platform | GREEN — scope identified |
| EXIT CONTROL v2.0 gate model | `docs/EXIT_CONTROL_G1_FOUNDER_ASSET_INVENTORY_2026-08-19.md` | GREEN — internal control |
| Exit objective / deal optionality | Internal EXIT CONTROL policy | GREEN — internal control |

## 01 — Corporate / Cap Table

| Item | Evidence | Status |
|---|---|---|
| Target HOY Parent structure | PR #104 — RT-003 corporate structure decision | AMBER — counsel/tax validation pending |
| Current legal entity | TBD | RED |
| Cap table | Founder baseline / final entity evidence pending | RED until entity exists |
| Shareholder register / articles | Private legal room | RED — not yet available |
| Founder identity/signature evidence | Private legal room only | RED — execution package pending |
| EXIT-TAX / residency clearance | Professional tax advice required before any triggering move | RED / HOLD |

## 02 — IP / Chain of Title

| Item | Evidence | Status |
|---|---|---|
| Founder Asset/IP Inventory | `data/exit-control-g1-founder-asset-inventory-2026-08-19.json` | GREEN as inventory / AMBER rights execution |
| Founder IP Schedule | `data/ir-02a-founder-ip-schedule-2026-08-18.json` | AMBER — assignment pending |
| Chain-of-Title Evidence | `docs/IR-02A_CHAIN_OF_TITLE_EVIDENCE.md` | AMBER |
| Founder IP Assignment draft | `docs/IR-02A_FOUNDER_IP_ASSIGNMENT_DRAFT.md` | PREPARED / UNSIGNED |
| Founder Ownership Declaration draft | `docs/IR-02A_FOUNDER_IP_OWNERSHIP_DECLARATION_DRAFT.md` | PREPARED / UNSIGNED |
| Full contributor census | PR #104 / RT-004 evidence | GREEN — no external human contributor identified in reachable history |
| GitHub repo ownership/control | Connector metadata + RT-005 | AMBER / personal control |
| Company repo ownership | TBD | RED |
| Trademark / trade-name evidence | TBD | RED |
| Domain / DNS / registrar rights | TBD | RED |
| Logo/design/media rights schedule | TBD | AMBER / inventory required |

## 03 — Product / Technology

| Item | Evidence | Status |
|---|---|---|
| Core repository | `hapo3005/hoy` | GREEN technical existence / AMBER transfer |
| Lifestyle repository | `hapo3005/hoy-lifestyle` | GREEN technical existence / AMBER transfer |
| Works repository | `hapo3005/hoy-works` | GREEN technical existence / AMBER transfer |
| Production hardening | `docs/IR-02A_PRODUCTION_HARDENING_2026-08-18.md` | GREEN technical baseline |
| Public-runtime/source boundary | `docs/IR-02E_PROPRIETARY_REPO_DEPLOYMENT_ARCHITECTURE.md` | GREEN design / live cutover pending |
| Runtime/dependency pinning | PR #105 + candidate PRs | GREEN CANDIDATE / merge state pending |
| Lockfile / reproducible QA | PR #105 | GREEN CANDIDATE |
| Release QA / browser QA | Existing workflows | GREEN on audited candidates; repeat on final acquisition state |

## 04 — Data / Privacy

| Item | Evidence | Status |
|---|---|---|
| Rights/data inventory | `data/ir-02a-rights-register-2026-08-18.json` | AMBER/RED mixed |
| Source rights policy | `data/ir-02b-source-rights-policy-2026-08-18.json` | GREEN governance / replacement work remains |
| Data-rights clearance status | `docs/IR-02B_SOURCE_DATA_RIGHTS_CLEARANCE.md` | AMBER |
| Privacy/transferability register | `data/ir-02d-privacy-transferability-v1.0.json` | GREEN governance / legal clearance pending |
| Privacy notice DE | `docs/legal/HOY_PRIVACY_NOTICE_v1.0_DE_DRAFT.md` | DRAFT |
| Privacy notice ES | `docs/legal/HOY_PRIVACY_NOTICE_v1.0_ES_DRAFT.md` | DRAFT |
| DPA Art. 28 | `docs/legal/HOY_DPA_ART28_v1.0_DE_DRAFT.md` | DRAFT |
| ROPA / retention / incident / rights / vendor registers | RT-02D package | AMBER — legal completion pending |
| Historic analytics | 28,897 pseudonymous pre-2.45 events | RED as traction claim / privacy review required |
| Works personal-data-heavy flows | Pre-live blocked | GREEN fail-closed control / RED until privacy clearance |

## 05 — Customers / Market Proof

| Item | Evidence | Status |
|---|---|---|
| Business Terms infrastructure | `data/ir-02c-business-terms-v1.0.json` | GREEN technical / DRAFT legal |
| Business Confirmation ledger | RT-02C infrastructure | GREEN technical / 0 confirmed |
| Paid/Committed businesses | External proof not started | RED |
| LOIs / pilots | External proof not started | RED |
| Consumer test cohort | External proof not started | RED |
| Activation / retention / repeat usage evidence | External proof not started | RED |

## 06 — Revenue / Finance

| Item | Evidence | Status |
|---|---|---|
| Pricing architecture | Existing HOY commercial model | AMBER — final launch pricing proof pending |
| 35 Founding Businesses reference | ≈ EUR 1,929 MRR planning reference | MODEL ONLY |
| 60 Paid reference | ≈ EUR 4,004 MRR planning reference | MODEL ONLY |
| Regional break-even reference | ≈ 67 paid businesses | MODEL ONLY |
| Full-time operator reference | ≈ 83 paid businesses | MODEL ONLY |
| Actual MRR / ARR | 0 until real commercial launch/proof | RED |
| P&L / bank / accounting evidence | Future private finance room | RED |

## 07 — Operations / SOPs

| Item | Evidence | Status |
|---|---|---|
| Region operating architecture | Founder-created product/operating IP inventory | AMBER |
| La Manga operator playbook | In build / acquisition perimeter identified | AMBER |
| Onboarding SOP | In build | AMBER |
| QA / verification SOP | In build | AMBER |
| Remote KPI/control model | In build | AMBER |
| Founder-independence proof | Not yet demonstrated | RED |

## 08 — Security / Infrastructure

| Item | Evidence | Status |
|---|---|---|
| Secret-history audit | PR #105 / RT-005 | GREEN — 0 unclassified findings |
| Digital Control Register | PR #105 `data/exit-control-g1-digital-control-register-2026-08-19.json` | GREEN as register / RED organizational control gaps |
| GitHub Actions pinning | PR #105 | GREEN |
| SBOM / licence gate | PR #105 | GREEN CANDIDATE |
| GitHub company organization | TBD | RED |
| Supabase company organization/control | TBD | RED |
| Domain/DNS control matrix | TBD | RED |
| Vendor billing/recovery matrix | TBD | RED |
| Backup/recovery drill | TBD | RED |
| Two-admin continuity | TBD | RED |

## 09 — Legal / Tax / Contracts

| Item | Evidence | Status |
|---|---|---|
| Business Data & Media Terms DE | `docs/legal/HOY_BUSINESS_DATA_MEDIA_TERMS_v1.0_DE.md` | DRAFT / counsel review required |
| Spanish Terms localization | `docs/legal/HOY_BUSINESS_DATA_MEDIA_TERMS_v1.0_ES_DRAFT.md` | DRAFT / counsel review required |
| Terms acceptance specification | `docs/legal/HOY_BUSINESS_TERMS_ACCEPTANCE_SPEC_v1.0.md` | GREEN technical design |
| Founder IP assignment | Draft prepared | RED until executed |
| Tax / transfer mechanics | Professional review required | RED |
| Trademark clearance | Professional/current registry evidence required | RED |
| Vendor DPAs / subprocessors / transfers | Register incomplete | RED |
| Change-of-control clauses | Contract/vendor review incomplete | RED |

## 10 — Exit / Buyer Materials

| Item | Evidence | Status |
|---|---|---|
| Buyer Longlist | Shadow mode | NOT YET POPULATED |
| Buyer segmentation / strategic fit | Shadow mode | NOT YET POPULATED |
| Teaser | Structure planned | NOT YET RELEASED |
| CIM | Structure planned | NOT YET RELEASED |
| Demo narrative | Structure planned | NOT YET RELEASED |
| Management / Founder Q&A | Structure planned | NOT YET RELEASED |
| Deal structure scenarios | 100% / majority / minority / no-sale optionality | INTERNAL |
| Buyer outreach | Explicitly blocked | BLOCKED |

## Private-room separation

The public/source repository must never contain executed founder identity documents, signatures, personal tax advice, bank records, passwords, secret values, recovery codes or other private closing material. The index may point to those evidence classes, but the actual files belong only in a controlled private legal/finance data room.

## G1 release rule

The Shadow Data Room becomes **G1 REVIEW READY** only after the P0 RED items in sections 01, 02, 04, 08 and 09 are closed or explicitly documented as buyer-acceptable residual risk. It becomes **G1 PASS** only after the acquisition perimeter can be transferred/controlled without an undisclosed material dependency on the founder's personal accounts, unresolved IP title, uncleared critical data rights, or unknown corporate/tax/trademark position.
