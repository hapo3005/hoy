# HOY 2.39 — Benidorm benchmark, translated into HOY

## Purpose

Benidorm is a product benchmark, not a market target for the next HOY launch. The goal of this release is to learn from strong local discovery products without copying their protected design, wording, code or characteristic UX.

HOY remains the live decision layer for a region: **What can I do today, now and here?**

## Product principles

| Benchmark principle | HOY interpretation | 2.39 status |
| --- | --- | --- |
| What's on now | HOY NOW ranks usable places from hours, current content, menu and services | Existing + reinforced |
| Event/show timeline | A compact "next 2 hours" timeline for running and imminent published content | Implemented |
| Nearby | Explicit opt-in geolocation and real distance to venues with trusted coordinates | Implemented |
| Personal planner | A deliberately small personal plan with up to four venues | Implemented |
| Offers and specials | Structured events, specials and daily dishes, reusable throughout guest journey | Existing |
| Operator-maintained data | Operators can confirm/correct prepared weekly opening hours | Existing |
| Freshness / trust | Every decision surface reuses operator-confirmed vs non-live-confirmed proof | Existing + reused |
| Discover → decide → act | Live cards open the venue profile directly; action surfaces stay in the existing profile flow | Implemented through existing flow |
| Situational filters | Family, date, party, sunset, rain, quick stop, budget etc. | Next data-model phase |
| Kitchen / terrace / live status | Must be operator-confirmed or otherwise provenance-labelled; never inferred as fact | Next data-model phase |
| Availability | Only surface when backed by a trustworthy service/provider signal | Guardrail |

## 2.39 UX rules

1. **No automatic location request.** Location is requested only after an explicit user action.
2. **No fake live data.** If no published event exists in the next two hours, HOY says so.
3. **No fake precision.** Nearby requires real coordinates and user permission.
4. **No endless planner.** The HOY Plan is capped at four venues so it supports a decision rather than becoming another bookmark archive.
5. **Trust remains visible.** Operator-confirmed opening hours are visually distinguishable from base/non-live-confirmed hours.
6. **Existing HOY NOW remains canonical.** 2.39 adds context; it does not create a competing recommendation engine.

## Implementation map

- `guest-decision-core-2.28.js`: canonical HOY NOW ranking and explainable decision reasons.
- `now-status-2.19.js`: conservative current opening status and provenance.
- `events-2.16.js`: structured current events/specials/dishes.
- `operator-data-confirmation-2.29.js`: operator confirmation/correction of opening hours.
- `live-decision-2.39.js`: next-two-hours timeline, nearby and compact personal plan.
- `live-decision-2.39.css`: responsive presentation of the 2.39 live layer.

## Next implementation gates

### Gate A — trusted live venue state

Add explicit, provenance-aware fields for states such as kitchen open, terrace open, live music, happy hour and short-term capacity. Every field needs:

- value/state,
- source/publisher,
- confirmed timestamp,
- expiry / validity window,
- safe fallback when stale.

### Gate B — situational intent

Add structured venue/event attributes that can support filters such as family, date, party, sunset, rain and short-stop. Do not derive these from marketing text alone.

### Gate C — multi-region configuration

Move region-specific defaults such as timezone, map center, locales and commercial configuration behind a region config rather than introducing new hard-coded La Manga assumptions.

## Success criteria

The live layer is successful when guests reach a useful venue/action faster, and when operators have a clear reason to keep their data current. Track at minimum:

- HOY NOW → venue open rate,
- Nearby opt-in and nearby-card open rate,
- plan add/remove rate,
- plan → venue/action conversion,
- current-content interaction rate,
- share of surfaced decisions backed by operator-confirmed/current data.
