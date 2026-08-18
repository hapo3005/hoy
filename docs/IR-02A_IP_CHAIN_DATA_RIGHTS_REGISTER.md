# HOY Investor Ready v1.0 — IR-02A Operational Rights Register

**Audit date:** 2026-08-18  
**Status:** Working DD baseline — evidence-backed, not legal sign-off  
**Scope:** `hapo3005/hoy`, `hapo3005/hoy-lifestyle`, `hapo3005/hoy-works`; live Supabase projects `HOY La Manga` and `HOY Works`  
**Purpose:** Convert IR-02A from a conceptual framework into an evidence-backed operational register.

> This register distinguishes **asset existence**, **IP ownership**, **data provenance**, **usage rights**, **trust/evidence**, **privacy**, and **exit transferability**. A GREEN operational status is not a legal opinion. Where contractual or licence evidence has not been captured, the record remains AMBER/REVIEW_REQUIRED.

## 1. Status vocabulary

### IP ownership
- **O1** — HOY entity ownership documented.
- **O2** — founder-created/controlled; formal assignment to the future/current HOY entity still required.
- **O3/O4** — employee/contractor contribution with rights evidence.
- **O5/O6** — third-party/open-source use under documented licence.
- **O8** — ownership/contributor status not yet fully audited.

### Data classes
- **A** — HOY / first-party generated data.
- **B** — licensed/open data under a documented licence.
- **C** — external reference/API/public-source data.
- **D** — personal/pseudonymous data requiring a privacy layer.

### Rights/evidence status
- **GREEN** — sufficient operational evidence exists for the stated use.
- **AMBER** — usable only subject to conditions or missing rights evidence.
- **RED** — current evidence is insufficient for the stated claim/use.
- **REVIEW_REQUIRED** — not yet determined.

---

## 2. Verified software/IP inventory

| ID | Asset | Verified current evidence | Ownership status | DD status | Required action |
|---|---|---|---|---|---|
| IP-G01 | HOY Gastro/Core repo | Public GitHub repo `hapo3005/hoy`; active PWA/product code, Supabase migrations, tests, scripts, data and docs; current main HEAD audited on 2026-08-18 | O2/O8 | AMBER | Founder IP assignment + full contributor history audit |
| IP-W01 | HOY Works repo | Public GitHub repo `hapo3005/hoy-works`; application code, Supabase integration, schema/functions and documentation | O2/O8 | AMBER | Founder IP assignment + contributor audit |
| IP-L01 | HOY Lifestyle repo | Public GitHub repo `hapo3005/hoy-lifestyle`; currently product/research documentation and structured research data, not a production app | O2/O8 | AMBER | Founder IP assignment + contributor audit |
| IP-G02 | HOY La Manga backend | Active Supabase project in `eu-central-1` with production-like schema/data | O2/O8 | AMBER | Document account/org ownership, billing owner, credentials, export/transfer path |
| IP-W02 | HOY Works backend | Active Supabase project in `eu-central-1` | O2/O8 | AMBER | Same transferability/account-control evidence |
| IP-AI01 | AI-assisted product/data workflows | Versioned AI quality policy and AI processing metadata exist in Gastro | O2/O8 | AMBER | Maintain AI-assistance register; do not claim exclusivity merely because AI output is stored |

### Third-party software currently observed

| Dependency | Observed use | Current state | Action |
|---|---|---|---|
| `@playwright/test` | Gastro QA | exact version `1.62.0` in `package.json` | Capture licence in OSS register |
| `@supabase/supabase-js` | Gastro client | exact CDN version `2.111.0` | Capture licence + dependency record |
| Leaflet | Gastro map client | exact version `1.9.4`, SRI present | Capture licence + attribution obligations |
| `@supabase/supabase-js` | Works client | `@2` major-only CDN reference | **P1:** pin exact version + capture licence |
| `@supabase/server` | inspected Works Edge Function | `1.4.1` in `provider-live-status` | Capture licence/dependency record |

**Current ownership conclusion:** Repository control and founder authorship evidence are useful, but they do **not** replace a formal Chain-of-Title. Until the HOY legal entity and assignments are documented, core IP remains **O2/O8**, not O1.

---

## 3. HOY Gastro — live data register

### G-D01 — Restaurant master
- **Rows:** 169
- **Observed provenance:** 169/169 have `source_url`; 169/169 have `source_checked_at`.
- **Location status:** 71 `verified`.
- **Hours status:** 23 `verified`.
- **Class:** C + HOY-derived A metadata.
- **Rights:** **AMBER**.
- **Reason:** Presence/source checking is strong evidence of provenance, but public facts and third-party source content are not automatically proprietary HOY data.
- **Action:** Add per-source rights basis and transferability status.

### G-D02 — Menu source register
- **Rows:** 83.
- **Source authority:** 67 `first_party`, 1 `authorized_transactional`, 15 `verified_public_snapshot`, 0 unknown.
- **Official flag:** 67.
- **Class:** C; some operator/HOY-derived metadata is A.
- **Rights:** **AMBER**.
- **Important interpretation:** `source_authority = first_party` means the **venue controls/publishes the source**; it does not mean HOY owns the underlying menu content.
- **Action:** Capture the right to store, transform, display, derive from, and transfer each source class.

### G-D03 — Menu items
- **Rows:** 2,104.
- **Source linkage:** schema links menu items to `menu_sources`.
- **Class:** C/A-derived.
- **Rights:** **AMBER**.
- **Action:** Rights inherit constraints from the original source. Do not market the entire table as proprietary until source rights are mapped.

### G-D04 — Menu translations
- **Rows:** 902.
- **Locales:** DE/EN/ES supported in schema.
- **Class:** A/C-derived.
- **Rights:** **REVIEW_REQUIRED**.
- **Action:** Separate HOY-authored/curated linguistic work from underlying third-party menu content and document derivative-use rights.

### G-D05 — Opening-hours evidence
- **Rows:** 170 evidence records.
- **Source mix:** 78 official; 73 `official_website`; 92 `directory`; 2 `booking`; 3 `other`.
- **Class:** C.
- **Rights:** **AMBER / REVIEW_REQUIRED**.
- **Risk concentration:** A material part of the current evidence layer depends on third-party directories and booking/reference sites.
- **Action:** Provider/domain-level rights review and explicit internal-use/display/retention rules.

### G-D06 — Accessibility facts
- **Rows:** 166.
- **Verification source:** 166 `public_research`; 0 operator; 0 onsite.
- **Critical evidence gap:** 0/166 currently contain a non-empty `source_url` in the live table.
- **Class:** C + HOY classification logic.
- **Rights:** REVIEW_REQUIRED.
- **Evidence status:** **RED for DD-grade provenance**.
- **Action (P0):** Backfill evidence references/source URLs where defensible, or downgrade affected claims to `unknown`/unverified. The Accessibility Standard must not claim provenance that the live row cannot demonstrate.

### G-D07 — Media candidate queue
- **Rows:** 97.
- **Rights state:** 97 `awaiting_operator_approval`; 0 approved; 0 licensed; 0 public.
- **Class:** C.
- **Rights:** **AMBER**.
- **Publication control:** **GREEN** — current queue deliberately prevents publication before approval/licensing.
- **Asset claim:** These 97 candidates are **not** HOY-owned media assets.

### G-D08 — Published media assets
- **Rows:** 0.
- **Conclusion:** No current proprietary media library can be claimed from this table.

### G-D09 — Analytics events
- **Rows:** 28,897.
- **Identifiers:** all audited rows contain `anonymous_id` and `session_id`.
- **Class:** A + D (pseudonymous identifiers).
- **Rights/privacy:** **AMBER** pending full legal-basis/retention/ROPA documentation.
- **Traction quality:** **RED for historical traction claims.** HOY's own analytics contract states that events before the 2.45 clean cutover cannot be reliably separated from automated QA and must not be treated as reliable production usage.
- **Action:** Establish and date a clean post-cutover measurement baseline; keep historical rows out of investor traction metrics.

### G-D10 — Sales/outreach pipeline
- **Rows:** 168.
- **Control check:** 168/168 currently `send_lock = true`; 0 rows have `send_authorized_at`.
- **Class:** C and potentially D for contact-person details.
- **Outreach control:** **GREEN**.
- **Privacy/rights:** REVIEW_REQUIRED.
- **Conclusion:** Prepared pipeline ≠ contacted business network.

### G-D11 — Mobility/municipal boundaries
- **Observed:** 2 municipal boundary rows identify the Spanish IGN administrative-unit API as source.
- **Class:** B/C pending exact licence capture.
- **Rights:** REVIEW_REQUIRED.
- **Action:** Store the exact IGN dataset/licence/version and required attribution before treating as reusable open data.

---

## 4. HOY Works — live data register

### W-D01 — Provider catalogue
- **Rows:** 85.
- **Trust:** 82 `source_checked`; 3 `directory_only`; 0 `business_verified`; 0 `hoy_verified`.
- **Partnership:** 0 active partners.
- **Website:** 81 with website; 77 with public source URL.
- **Class:** C + HOY-derived A structure.
- **Rights:** **AMBER**.
- **Correct claim:** structured sourced provider catalogue.
- **Incorrect current claim:** verified provider/partner network.

### W-D02 — Source provenance
- **Rows:** 102; 102/102 have `checked_at`.
- **Mix:** 98 `business_website`; 3 `directory`; 1 `business_profile`; 0 manual; 0 provider submission.
- **Class:** C.
- **Provenance quality:** **GREEN** operationally.
- **Usage rights:** **AMBER** until source/terms rules are captured.

### W-D03 — Provider coverage
- **Rows:** 170; 167 marked verified.
- **Class:** C/A-derived.
- **Rights/evidence:** AMBER.
- **Action:** Link each verified coverage claim to explicit evidence/provenance where not already derivable.

### W-D04 — Service taxonomy
- **Rows:** 20.
- **Class:** A, assuming labels/taxonomy are HOY-created.
- **Ownership:** O2 until formal assignment.
- **Operational status:** GREEN.

### W-D05 — Pilot pipeline
- **Rows:** 12.
- **Contacted:** 0; active: 0; ready-to-contact: 0 in current audit.
- **Class:** A/C, potentially D if personal contact fields are added.
- **Conclusion:** internal shortlist only; not a commercial relationship asset.

### W-D06 — Work-request / private customer data architecture
- **Current rows:** 0 work requests, 0 request photos, 0 request matches, 0 request events.
- **Class:** D when live.
- **Rights/privacy:** REVIEW_REQUIRED before real customer operation.
- **Positive control:** schema/RLS separation for private request data exists.

### W-D07 — Provider live status / HOY NOW
- **Current rows:** 0.
- **Future class:** A, business-confirmed.
- **Potential value:** high-quality first-party freshness data once operators actually use it.

### Works security baseline
- Live Supabase Security Advisor: **0 current findings** on audit date.
- Seven active Edge Functions currently report platform-level `verify_jwt=false`.
- `provider-live-status` was source-inspected and explicitly enforces `withSupabase({ auth: 'user' })`, requires a user claim, then checks provider membership before its privileged RPC.
- **Status:** `provider-live-status` manually reviewed; the remaining six functions are **REVIEW_REQUIRED** before DD. `verify_jwt=false` alone is not treated as a vulnerability when custom authentication is deliberately enforced in code.

---

## 5. HOY Lifestyle — current evidence-backed scope

The audited Lifestyle repository is currently a **product/research asset**, not a live app/backend. Its own README states that app development begins after the stable Gastro core and that the repo is in data/product preparation.

### L-D01 — Rentals research v0.1
- **Research rows:** 15 after the header, including a deliberate supply-gap row.
- **Source/status mix:** `research_confirmed`, `business_index_confirmed`, `marketplace_only`, `gap`; several entries lack a source URL.
- **Class:** C.
- **Rights:** REVIEW_REQUIRED.
- **Value claim:** HOY's research structure/status logic is an asset; the third-party facts are not automatically proprietary.

### L-D02 — Special vehicles research v0.1
- **Research rows:** 12 after the header, including gap/wanted-inventory concepts.
- **Source/status mix:** first-party sources, legacy/historic sources, marketplaces, a business-index lead, official-tourism source and deliberate gaps.
- **Class:** C.
- **Rights:** REVIEW_REQUIRED.
- **Positive control:** stale/legacy/marketplace supply is explicitly not promoted as confirmed current permanent supply.

### Lifestyle correction
A previous working narrative referenced **101 Lifestyle records**. The currently audited connected repository and available named Supabase projects do **not** substantiate 101 production Lifestyle records. The repository directly evidences **27 research rows across the two current CSVs**, and those rows are heterogeneous research observations, not 27 verified commercial entities.

Until another authoritative data source is identified, the 101 figure must be removed/downgraded in investor materials.

---

## 6. Corrections to previous Investor Ready working numbers

This audit supersedes unverified aggregate counts where evidence cannot presently be reproduced.

1. **HOY Gastro:** live `restaurants` table currently has **169 rows**. The figure **166** applies to the current `restaurant_accessibility` table, not the restaurant master.
2. **HOY Works:** **85 providers** is reproduced in live Supabase and repository documentation; 82 are source-checked, 3 directory-only.
3. **HOY Lifestyle:** current repo evidence is 27 heterogeneous research rows; **101 production records are not currently substantiated**.
4. Therefore previous global claims such as **352 vertical records / 351 unique entities / 328 commercial organisations** must not be used in an investor deck until the exact source and deduplication method can be reproduced.
5. Raw rows from Gastro, Works and Lifestyle must **not** simply be added together: they are different data models and include research/gap records rather than comparable unique entities.

This correction improves, rather than weakens, DD credibility.

---

## 7. Gastro security DD findings — open

Live Supabase Security Advisor on 2026-08-18 reports:

- INFO: RLS enabled without policies on `menu_eval_cases` and `menu_eval_runs`.
- WARN: `log_analytics_event(...)` is a `SECURITY DEFINER` function callable by `anon` and `authenticated`.
- WARN: additional authenticated-callable `SECURITY DEFINER` RPCs include `get_operator_workspace`, `get_venue_media_review`, `operator_archive_offer`, `operator_publish_offer`, `operator_request_upgrade`, `operator_submit_profile_change`, and `review_venue_media_candidates`.

**Status:** P0/P1 review — each RPC must be either hardened/revoked/moved or explicitly justified with source-level authorization checks and least-privilege grants. Investor Ready may only state the resulting verified condition after re-running the advisor.

---

## 8. P0 / P1 remediation backlog

### P0 — before investor DD
1. **Founder IP Assignment:** catalogue and assign founder-created code, docs, schemas, taxonomies and product standards to the HOY entity.
2. **Contributor Chain Audit:** enumerate contributors across all three repos; capture employee/contractor/third-party assignments where applicable.
3. **Source Rights Register:** create provider/domain-level rights records for Gastro and Works; prioritize directory/booking/marketplace sources.
4. **Accessibility Provenance Repair:** source/evidence reference for all 166 live accessibility rows or downgrade unverifiable fields.
5. **Gastro Security Advisor Remediation:** resolve or document each current `SECURITY DEFINER` warning and re-run the advisor.
6. **Privacy Evidence:** legal basis, purposes, retention, access controls and ROPA/DPA mapping for analytics, user/account, outreach/contact and future request data.
7. **Business Terms:** explicit rights to store/display/transform operator-supplied data/media plus change-of-control/transferability provisions.
8. **Open/Public Data Licence Evidence:** exact IGN licence/version/attribution and every other Class-B source.

### P1 — before external data room / scaling
9. **OSS/Dependency Register:** licences, versions, notices, change-of-control/continued-use; exact-pin Works Supabase JS.
10. **Works Edge Function Auth Review:** inspect the six remaining active Edge Functions and record auth model.
11. **Backend/Account Transferability:** ownership/admin/billing/2FA/recovery/export controls for GitHub, Supabase, domains and other critical services.
12. **Brand/Domain/Trademark Register:** separate IR-02A addendum once authoritative domain/registration evidence is collected.

---

## 9. Current Data-Moat conclusion

### Defensible today
- HOY-created schemas, taxonomies, status semantics, verification/trust logic and product workflows — subject to founder IP assignment.
- Reproducible research/provenance process, especially Works' 102 checked provenance records.
- Gastro menu-source authority/completeness model and evidence separation.
- Rights-aware media workflow that keeps 97 candidates private until approval/licensing.
- Privacy-aware analytics architecture and versioned contract, while historical event volume is explicitly excluded from traction claims.

### Not defensible today as a blanket claim
- “All HOY business data is proprietary.”
- “HOY owns 169 restaurant datasets / 85 provider datasets.”
- “97 media assets belong to HOY.”
- “28,897 analytics events prove user traction.”
- “HOY has a verified business partner network.”
- “Lifestyle already has 101 production records.”

### Highest-value future first-party assets
1. Business-confirmed profile changes and live availability.
2. HOY onsite/field verification with evidence and timestamps.
3. Verification/freshness history.
4. Clean post-cutover intent, matching, conversion and retention data.
5. Operator/customer workflow outcomes.
6. Cross-vertical and cross-region intelligence generated from lawfully usable inputs.

**Doctrine:** `Value + Origin + Rights + Time + Trust` must travel together for every strategic data field.

---

## 10. DD gate

IR-02A is now **operationally populated** for the assets that could be directly verified on 2026-08-18.

**Current gate:** `NOT YET INVESTOR-DD CLEAN`.

The remaining work is no longer conceptual. It is a finite evidence/remediation backlog centered on:

**formal IP assignment → source rights → accessibility evidence → security findings → privacy records → transferability.**

When these P0 items are closed and the live systems are re-audited, IR-02A can move from **Working DD Baseline** to **Investor DD Ready**.