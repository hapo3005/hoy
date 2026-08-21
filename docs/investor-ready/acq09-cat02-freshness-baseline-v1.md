# ACQ-09 / CAT-02 — Freshness & HOY NOW Baseline v1.0

Status: **BASELINE_CAPTURED_PROOF_NOT_YET_EARNED**  
Snapshot: **2026-08-21**  
Runtime base: current `main`

## Why this exists

HOY should not beat a directory by adding another freshness badge. The defensible difference is operational: volatile facts are dated, evidence levels stay distinct, stale operator claims lose NOW priority, and the system can prove how much of Region 1 is actually current.

This is the CAT-02 execution slice of ACQ-09. The parent competitive strategy is separately reviewable in PR #173; this CAT-02 branch deliberately starts from current `main` so it inherits the already-shipped Freshness 2.50 runtime instead of stacking on an older acquisition-thesis codebase.

## Canonical existing runtime

`merchant-truth-freshness-2.50.js` already owns operator-hours freshness:

- same Madrid calendar date is required for a `today confirmed` statement;
- standard operator hours become stale after 30 days;
- stale/invalid operator hours lose NOW priority and fall back to the verified base path;
- operator hours that are recent but not from today are labelled as operator-maintained, not live-confirmed.

CAT-02 therefore **does not create a second freshness engine**.

## Production baseline

Current published Gastro supply: **180 businesses**.

| Evidence class | Current state |
|---|---:|
| Core profile provenance dated / within 90d | 180 / 180 |
| Location provenance dated / within 90d | 180 / 180 |
| Restaurant hours checked within 30d | 104 / 180 |
| Weekly hours structurally present | 25 / 180 |
| `hours_status=verified` | 27 / 180 |
| Distinct businesses with hours-source evidence | 90 / 180 |
| Hours-source businesses within 30d | 90 / 90 |
| Hours-source rows within 30d | 167 / 167 |
| Distinct businesses with dated menu source | 67 / 180 |
| Menu-source businesses within 30d | 67 / 67 |
| Menu-source rows within 30d | 81 / 81 |
| Operator live-hours rows | **0** |
| Operator live-hours confirmed today | **0** |
| Current accessibility facts | 668 |
| Accessibility facts currently non-stale by their own `stale_after` | 668 / 668 |
| Legacy accessibility research rows | 166 |
| Accessibility rows operator-confirmed | **0** |
| Service rows | 47 |
| Service rows operator-confirmed | **0** |

The important interpretation is not “everything is fresh.” It is:

- **source/editorial recency is strong where coverage exists**;
- coverage remains incomplete for volatile fields;
- **first-party live confirmation is currently zero**;
- a recent source check is not a merchant confirmation, not a live status, not rights clearance and not proof that a competitor is worse.

## Internal operating SLA

These are management rules, **not market standards**.

1. **Operator today claim:** same Madrid calendar date.
2. **Standard operator hours:** 30 days; after that, no operator NOW priority.
3. **High-volatility editorial hours/menu sources:** 30-day internal recheck SLA.
4. **Core profile/location provenance:** 90-day internal recheck SLA.
5. **Accessibility:** use each fact's explicit `stale_after`; no global override.
6. **Offers/events/specials:** lifecycle window plus source timestamp; age alone cannot keep expired content live.

## What CAT-02 may claim now

- HOY has an implemented stale-downgrade/fallback mechanism for operator hours.
- Production has a dated freshness baseline that separates source research from first-party confirmation.
- Current source recency can be measured reproducibly.

## What CAT-02 may **not** claim now

- HOY has proven a competitive freshness advantage.
- Viviendo La Manga, TuLocalidad or another competitor has worse freshness.
- 30-day source research equals live operator confirmation.
- fresh data is automatically accurate, rights-cleared or commercially transferable.

## CP2 promotion boundary

`CP2 Freshness and Trust Advantage` stays **NOT_PROVEN** until real operating evidence exists. At minimum:

- a representative real-business cohort produces recurring first-party confirmations;
- those confirmations remain within the frozen SLA over an observation period;
- audited Production behavior gives zero known stale operator facts NOW priority;
- public freshness/provenance wording matches the actual evidence level;
- a dated competitor benchmark exists for the specific mechanism being compared.

No competitor data means **UNKNOWN**, not “HOY wins.”

## Next execution

The immediate technical step is the SELECT-only production audit in `scripts/investor-ready/acq09-cat02-production-freshness-audit.sql`. The commercial/merchant next step must wait for the already existing contact, terms, privacy and release gates; this artifact does not authorize outreach.
