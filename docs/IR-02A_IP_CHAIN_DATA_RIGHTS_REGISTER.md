# HOY Investor Ready v1.0 — IR-02A Operational Rights Register

**Audit date:** 2026-08-18  
**Status:** Technical production hardening complete; full Investor DD remains open  
**Scope:** `hapo3005/hoy`, `hapo3005/hoy-lifestyle`, `hapo3005/hoy-works`; Supabase `HOY La Manga` and `HOY Works`

> IR-02A separates asset existence, ownership, provenance, usage rights, trust/evidence, privacy and exit transferability. Operational GREEN is not a legal opinion. Contractual/licence/ownership evidence remains AMBER or REVIEW_REQUIRED until captured.

## 1. Production hardening

Applied and recorded in HOY La Manga production:

1. `20260818192515_hoy_accessible_v1_canonical_fact_layer`
2. `20260818192549_accessibility_provenance_constraint_repair`
3. `20260818192607_ir02a_dd_hardening_v2`

Post-deploy verification:

- 24 canonical Accessibility features
- 668 current canonical Accessibility facts
- 311 source-less external non-unknown facts retained only as `review_needed` audit rows
- **0** source-less external non-unknown facts remain `clean`
- provenance constraint active
- legacy→canonical sync trigger active
- `anon`: 357 visible facts, all `unknown`, 0 unproven non-unknown external facts
- non-JWT `authenticated`: same 357 unknown-only facts
- prior `rls_enabled_no_policy` advisor findings for `menu_eval_cases` and `menu_eval_runs`: closed

The Security Advisor still flags intentionally exposed `SECURITY DEFINER` RPC boundaries. These are not falsely marked resolved; they are source-reviewed, their grants are restricted to intended caller roles, and they remain visible DD review items.

See `IR-02A_PRODUCTION_HARDENING_2026-08-18.md` for the live evidence record.

## 2. Status vocabulary

### Ownership
- **O1** — HOY entity ownership documented
- **O2** — founder-created/controlled; formal assignment still required
- **O3/O4** — employee/contractor contribution with rights evidence
- **O5/O6** — third-party/open-source under documented licence
- **O8** — status not fully audited

### Data classes
- **A** — HOY / first-party
- **B** — licensed/open data
- **C** — external reference/API/public source
- **D** — personal/pseudonymous data requiring privacy controls

### Rights/evidence
- **GREEN** — sufficient operational evidence for stated use
- **AMBER** — usable subject to conditions or missing rights evidence
- **RED** — insufficient evidence for stated claim/use
- **REVIEW_REQUIRED** — not yet determined

## 3. Verified software/IP inventory

| ID | Asset | Current evidence | Ownership | DD |
|---|---|---|---|---|
| IP-G01 | HOY Gastro/Core repo | active product code, migrations, tests, scripts, data, docs | O2/O8 | AMBER |
| IP-W01 | HOY Works repo | app code, Supabase integration, schema/functions, docs | O2/O8 | AMBER |
| IP-L01 | HOY Lifestyle repo | product/research docs + structured research data | O2/O8 | AMBER |
| IP-G02 | HOY La Manga backend | active Supabase; IR-02A hardening deployed | O2/O8 | AMBER |
| IP-W02 | HOY Works backend | active Supabase | O2/O8 | AMBER |
| IP-AI01 | AI-assisted workflows | versioned quality/processing policy evidence | O2/O8 | AMBER |

Repository control and founder authorship evidence do not replace a formal Chain of Title.

## 4. Gastro data state

### Restaurant master
- 169 rows
- 169/169 source URL
- 169/169 source checked
- 71 location verified
- 23 hours verified
- rights: AMBER

### Menu
- 83 menu sources
- 67 first-party source-authority
- 1 authorized transactional
- 15 verified public snapshot
- 2,104 menu items
- 902 translations
- rights: AMBER / REVIEW_REQUIRED

### Hours
- 170 evidence records
- 78 official
- 73 official website
- 92 directory
- 2 booking
- 3 other
- rights: AMBER / REVIEW_REQUIRED

### Accessibility legacy research
- 166 rows
- 166 public research
- 0 operator-confirmed
- 0 onsite/HOY-verified
- 0 source URLs

These legacy rows are not DD-grade proven facts.

### Accessibility canonical layer
- 24 feature definitions
- 668 current facts
- 311 `review_needed`
- 0 unsafe clean external non-unknown source-less facts
- public/client reads fail closed

### Media
- 97 candidates awaiting operator approval at audit
- 0 approved/licensed/public
- 0 published media assets

Candidates are not claimed as HOY-owned media.

### Analytics
- 28,897 historical events at audit
- historical pre-2.45 volume is not treated as user traction because historical QA traffic cannot be reliably separated under HOY's own analytics contract.

### Sales/outreach
- 168 pipeline rows
- 168 send-locked
- 0 send-authorized

Prepared pipeline ≠ contacted business network.

## 5. Works evidence state

- 85 providers
- 82 source-checked
- 3 directory-only
- 0 business-verified
- 0 HOY-verified
- 0 active partners
- 102 checked source-provenance records: 98 business websites, 3 directories, 1 business profile
- 20 service taxonomy rows
- 12 pilot-pipeline rows; 0 contacted/active at audit
- 0 work requests
- 0 provider live-status rows

Security Advisor had zero findings at the audit point. `provider-live-status` custom auth was source-reviewed; six remaining active Edge Functions still require equivalent review. Dependency pinning is isolated in `hapo3005/hoy-works#1`.

## 6. Lifestyle evidence state

The connected Lifestyle repo is currently a product/research asset, not a live backend.

- rentals research: 15 heterogeneous rows including a gap row
- special-vehicles research: 12 heterogeneous rows including gap/wanted-inventory concepts
- directly evidenced total: 27 research rows

The prior working figure of 101 Lifestyle records is not reproducible from currently audited connected assets and is blocked from investor material until an authoritative source is identified.

## 7. Corrections to previous working numbers

- Gastro restaurant master = 169
- 166 = legacy Accessibility rows, not restaurant-master count
- Works = 85 providers
- Lifestyle = 27 directly evidenced heterogeneous research rows
- prior aggregate claims 352 / 351 / 328 remain blocked until exact source and deduplication can be reproduced

Different row types across verticals must not be naively added as equivalent unique entities.

## 8. Current DD state

### Technically closed
- canonical Accessibility fact layer live
- fail-closed provenance control live
- 0 unsafe clean source-less external non-unknown facts
- menu-eval no-policy advisor findings closed
- reviewed privileged RPC grants restricted/documented
- production migration history reconciled into GitHub

### Still open
- Founder IP Assignment
- complete contributor Chain of Title
- source/domain-specific rights decisions
- privacy legal basis, retention, ROPA/DPA evidence
- business data/media terms + change-of-control/transferability
- brand/domain/trademark evidence
- actual evidence/operator/onsite confirmation for review-gated Accessibility facts
- account ownership/recovery/transferability evidence
- latest final PR CI

## 9. Data-moat doctrine

HOY's defensible data layer is not “many copied facts”. It is:

**Density + Structure + Freshness + Provenance + Rights + Verification + History + Intent + Conversion + Cross-Vertical Relations + Replication.**

Strategic rule:

> **Value + Origin + Rights + Time + Trust** travel together.

## 10. DD gate

**Technical production hardening:** COMPLETE  
**Full IR-02A Investor DD:** NOT YET COMPLETE

Primary evidence:

- `IR-02A_PRODUCTION_HARDENING_2026-08-18.md`
- `IR-02A_SECURITY_RPC_REVIEW.md`
- `IR-02A_SOURCE_RIGHTS_TRIAGE.md`
- `IR-02A_CHAIN_OF_TITLE_EVIDENCE.md`
- `IR-02A_PRIVACY_PROCESSING_REGISTER.md`
- `IR-02A_TRANSFERABILITY_CHECKLIST.md`
- `IR-02A_OSS_DEPENDENCY_REGISTER.md`

**Gate:** `TECHNICAL_PRODUCTION_HARDENING_COMPLETE / FULL_INVESTOR_DD_NOT_YET_COMPLETE`
