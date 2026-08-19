# RT-008 Privacy Evidence — current-main reconciliation 2026-08-19

Status: **CURRENT-MAIN TECHNICAL CANDIDATE / OPERATIONAL-LEGAL GATES OPEN**

## Provenance

This evidence package is recomposed on `main` `88bb9e77d50ccb9db96306f5e737e27bad6237ab`, after merge of PR #128. Historical PR #127 remains an evidence source for consent UX, DSAR/retention controls and processor/transfer analysis, but is not the merge authority because it diverged from current main.

The recomposed candidate intentionally keeps one canonical consent key: `hoy-privacy-analytics-consent-v1`. The stale #127 key `hoy-analytics-consent-v1` is prohibited from the current runtime/UI/test contract.

## 1. Analytics runtime

Production analytics is guarded by two independent conditions:

1. canonical explicit consent is `granted`; and
2. `hoyPrivacyProductionReady247() === true`.

The Draft privacy configuration is intentionally not release-ready (`releaseReady:false`, `analyticsEnabled:false`, blank controller fields, `analyticsRetentionDays:null`). Therefore consent alone cannot activate Production analytics.

The recomposed runtime preserves the stronger merged-#128 fail-closed boundary:

- Production exits before identifiers/payload when either gate is false;
- raw Production event history is not written to localStorage;
- pilot attribution is not persisted without storage permission;
- reject/withdraw/clear removes local analytics identifiers/history;
- the #128 compatibility API remains present for regression coverage.

## 2. Consent and withdrawal UX

The imported RT-008 UX provides co-located Accept/Reject choices, a persistent settings entry point, withdrawal, DE/EN/ES copy, notice-version/timestamp evidence and local analytics cleanup. The UX is testable in non-Production via the QA preview while the Production release gate remains false.

## 3. SECURITY DEFINER regression evidence

Historical RT-008 evidence recorded transaction-only own-tenant and cross-tenant tests for the seven guarded Core operator RPCs: 7 positive + 7 negative scenarios passed and fixture rows were rolled back. This remains historical security evidence; it is not a claim that later schema changes can skip re-testing.

## 4. DSAR and retention controls

The RT-008 subject locator returns relationship counts/erasure-behaviour metadata rather than subject record contents and is restricted away from public browser roles. The retention mechanism remains fail-closed: no retention period is selected by this candidate and the execution path requires an enabled/approved policy. The repository release SQL is evidence/code only here; this current-main recomposition does not apply DDL/DML.

Automatic one-click user hard-delete is intentionally not claimed because business/audit relationships require reviewed delete/redact/tombstone decisions.

## 5. Processor / recipient / transfer evidence

The dedicated `rt008-processor-transfer-evidence-2026-08-19.md` remains the subject-matter register. It distinguishes processors, independent browser recipients and provider roles whose account/entity-specific contractual evidence is still open. Public provider documentation is not treated as proof that HOY has executed the required company-specific contract/DPA/configuration.

## 6. Open closing conditions

Still open before operational/legal privacy closure:

- final controller/entity identity, address and rights/privacy contact;
- approved analytics purpose/legal-basis wording and retention period/criteria;
- final layered notice and processor/recipient/transfer disclosure;
- account/entity-specific provider contract/DPA/sub-processor/transfer evidence;
- reviewed DSAR erasure/redaction/tombstone workflow plus synthetic end-to-end erasure test;
- Article 14 / legitimate-interest / applicable Spanish marketing-law review before indirect B2B outreach;
- Works DPIA screen before real users/requests/photos;
- breach tabletop with named roles after controller/entity decisions;
- company-controlled provider accounts/recovery after the entity path is approved.

## Claim boundary

This package does **not** claim full GDPR compliance, Production analytics readiness, approved retention, automatic erasure readiness, company-controlled providers or legal closure. It authorises no Production analytics activation, purge, external outreach, paid infrastructure or merge.
