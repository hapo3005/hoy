# HOY Merchant Truth Freshness 2.50

Status: **candidate runtime policy on PR #169 — no schema or Production data mutation**

## Objective

Turn existing operator timestamps into a visible and conservative trust advantage. “Vom Betrieb” must not silently mean “live forever”.

## Runtime policy

- **Confirmed today:** operator weekly hours may earn the live operator treatment and expose the confirmation time.
- **1–30 days old:** the operator schedule remains usable as a dated operator-managed schedule, but it is explicitly **not** a today-live confirmation. Decision copy becomes “Laut Betreiberzeiten …”.
- **Older than 30 days:** the operator weekly schedule is ignored for NOW priority. HOY falls back to verified base hours when available; otherwise the NOW result fails closed.
- **Missing or future confirmation timestamp:** fail closed exactly like stale operator truth.
- **Date-specific special hours:** remain authoritative for their explicit service date. Their update timestamp is exposed as proof when available.

## Guest proof

Decision surfaces can show proof such as:

- `Vom Betrieb bestätigt · heute 10:42`
- `Vom Betrieb bestätigt · vor 3 Tagen`
- `Betreiberzeiten zuletzt bestätigt am 12.07.2026 · HOY nutzt verifizierte Basiszeiten`

The profile hours card mirrors the same freshness state. Stale operator data is labelled `AKTUALITÄT PRÜFEN` rather than being presented as a fresh live claim.

## Data contract

No new table or field is introduced. The layer consumes the existing public live-hours fields:

- `restaurant_live_hours.confirmed_at`
- `restaurant_live_hours.updated_at`
- `restaurant_special_hours.updated_at`

The existing one-tap “today confirmation” remains the path for a verified operator to refresh daily truth.

## Why this is competitive

Directories can show opening hours and “open now”. HOY should distinguish itself by making **who confirmed what, and how fresh that confirmation is**, part of the decision itself. This improves trust, creates a meaningful merchant-engagement signal for G2, and reduces the risk of stale merchant data becoming a false NOW promise.

## Hard boundaries

- no fabricated timestamp;
- no stale operator schedule promoted as today-live;
- no automatic Production write;
- no schema change;
- no paid-placement influence on freshness;
- no fallback from stale operator data unless the base schedule independently passes the verified-hours gate.
