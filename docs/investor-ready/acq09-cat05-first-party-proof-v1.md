# ACQ-09 CAT-05 — First-Party Confirmation → Recurring Freshness Proof v1

Verified: 2026-08-21

## Purpose

CAT-05 is not another operator feature. It is the proof discipline that connects the existing verified-merchant confirmation path to CAT-02 freshness.

The product already has the essential F1 weekly-hours path on `main`: a verified operator can confirm or correct prepared weekly hours, which writes dated operator truth consumed by the existing merchant-freshness layer. CAT-05 now defines exactly what counts as evidence, what does not, and how one-off confirmations become recurring operational proof.

## Current Production truth

Read-only Production audit on 2026-08-21:

- 180 published Gastro businesses;
- 25 businesses currently have a prepared weekly-hours structure;
- 0 restaurant memberships;
- 0 verified memberships / 0 verified businesses;
- 0 `restaurant_live_hours` rows and 0 operator-confirmed live-hours rows;
- 48 service rows, 0 operator-confirmed;
- 166 accessibility rows, 0 operator-confirmed;
- 1 Business Terms version, 0 active versions, 0 acceptances;
- 0 rights-backed business confirmations.

So the technical path exists, but real merchant proof has **not started**.

## F1 and R1 stay separate

### F1 — factual operator confirmation

A verified operator confirms or corrects a concrete business fact.

For weekly hours, `restaurant_live_hours.confirmed_at` is the dated evidence. CAT-02 then applies the already shipped Freshness 2.50 semantics:

- only a confirmation from the same Madrid calendar day can support a `today confirmed` statement;
- a recent confirmation can remain operator-maintained without pretending it is a live same-day confirmation;
- after the existing 30-day hours threshold, stale/invalid operator hours lose NOW priority.

F1 does **not** imply a licence, transfer clearance, payment, retention, or product-market fit.

### R1 — rights-backed receipt

The separate ACQ-05 candidate in PR #146 adds a Terms-gated payload receipt for due-diligence purposes. That remains useful, but it is not required for the free F1 factual confirmation and is not the owner of CAT-02 freshness.

CAT-05 therefore does not block factual trust on commercial Terms and does not pretend factual confirmation itself creates commercial data rights.

## Proof ladder

- **FPC0 — PASS:** technical verified-operator weekly-hours path + dated CAT-02 freshness semantics exist.
- **FPC1 — NOT PROVEN:** first genuine independent external merchant confirmation.
- **FPC2 — NOT PROVEN:** at least five independent external businesses with genuine current F1 confirmations.
- **FPC3 — NOT PROVEN:** at least three independent businesses complete a second genuine confirmation cycle after their first.
- **FPC4 — NOT PROVEN:** for 30 consecutive days, at least 80% of an explicitly enrolled cohort keeps confirmation-governed critical facts within applicable SLA, with no stale operator fact retaining NOW priority.

The thresholds are internal working gates for evidence discipline, not industry standards or promises.

## Canonical metrics

### `merchant_factual_confirmation_coverage`

Distinct enrolled external businesses with at least one current genuine F1 confirmation / distinct businesses in the enrolled confirmation cohort.

### `confirmation_freshness_within_sla`

Confirmation-governed facts whose latest genuine confirmation timestamp remains inside the field-specific SLA / confirmation-governed facts expected for the enrolled cohort.

Missing or unknown facts remain missing/unknown; they are never silently counted as fresh.

### `merchant_reconfirmation_rate`

Independent businesses with a second genuine confirmation cycle / independent businesses whose first confirmation is old enough to be eligible for reconfirmation.

Same-session duplicates, synthetic writes and automated refreshes do not count.

## Field scope v1

### Weekly hours — active owner

- runtime: `operator-data-confirmation-2.29.js`;
- target: `public.restaurant_live_hours`;
- timestamp: `confirmed_at`;
- consumer freshness owner: `merchant-truth-freshness-2.50.js`.

### Services — evidence path exists, operational proof absent

- target: `public.restaurant_services`;
- timestamp: `confirmed_at`;
- current confirmed rows: 0.

Services do not enter the recurring CAT-05 cohort until their actual operator-write path and display semantics are reconciled end to end.

### Accessibility — evidence path exists, operational proof absent

- legacy target: `public.restaurant_accessibility`;
- operator timestamp: `operator_confirmed_at`;
- current operator-confirmed rows: 0;
- normalized facts continue to use their field-specific `stale_after` and trust semantics.

Operator confirmation must never convert `unknown`, stale or disputed data into an invented yes/no.

### Explicitly excluded for now

Whole-menu confirmation, media, offers, events, profile core and additional live-status families remain outside the initial recurring proof cohort until their exact operator write path, freshness semantics and rights meaning are reconciled.

## Operational blocker

There are currently **zero verified memberships**. This matters more than adding another button.

Before outreach is authorized, allowed work is limited to:

- keeping prepared weekly-hours coverage ready;
- maintaining CAT-02 source freshness;
- running the read-only audit;
- verifying runtime/server membership gates;
- preparing the future cohort and evidence template.

Actual merchant outreach, membership verification, Business Terms activation, synthetic Production confirmations or buyer-facing use remain separately gated.

## Competitive meaning

The eventual competitive claim is not “HOY has a confirmation feature.”

The evidence-bearing claim, if earned, is that HOY repeatedly converts verified merchant input into dated field-level truth and automatically downgrades stale information instead of allowing old operator data to keep NOW priority.

Until FPC2/FPC3/FPC4 are actually earned, `CP2 Freshness and Trust Advantage` and CAT-05 first-party superiority remain **NOT_PROVEN**.
