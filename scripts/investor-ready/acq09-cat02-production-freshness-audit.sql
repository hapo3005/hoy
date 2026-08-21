-- ACQ-09 / CAT-02 freshness audit
-- Read-only by contract. Re-run against Production to detect coverage and SLA drift.
BEGIN TRANSACTION READ ONLY;

WITH published AS (
  SELECT *
  FROM public.restaurants
  WHERE is_published = true
),
core AS (
  SELECT
    count(*) AS published_restaurants,
    count(*) FILTER (WHERE source_checked_at IS NOT NULL) AS core_dated,
    count(*) FILTER (WHERE source_checked_at >= current_date - interval '90 days') AS core_within_90d,
    count(*) FILTER (WHERE location_checked_at IS NOT NULL) AS location_dated,
    count(*) FILTER (WHERE location_checked_at >= now() - interval '90 days') AS location_within_90d,
    count(*) FILTER (WHERE hours_checked_at >= now() - interval '30 days') AS hours_checked_within_30d,
    count(*) FILTER (WHERE hours_weekly IS NOT NULL) AS weekly_hours_present,
    count(*) FILTER (WHERE hours_status = 'verified') AS hours_status_verified,
    count(*) FILTER (WHERE hours_status = 'conditional') AS hours_status_conditional
  FROM published
),
menu AS (
  SELECT
    count(DISTINCT ms.restaurant_id) FILTER (WHERE ms.last_checked_at IS NOT NULL) AS restaurants_with_dated_source,
    count(DISTINCT ms.restaurant_id) FILTER (WHERE ms.last_checked_at >= now() - interval '30 days') AS restaurants_within_30d,
    count(*) FILTER (WHERE ms.last_checked_at IS NOT NULL) AS dated_source_rows,
    count(*) FILTER (WHERE ms.last_checked_at >= now() - interval '30 days') AS source_rows_within_30d
  FROM public.menu_sources ms
  JOIN published p ON p.id = ms.restaurant_id
),
hours_sources AS (
  SELECT
    count(DISTINCT hs.restaurant_id) AS restaurants_with_source,
    count(DISTINCT hs.restaurant_id) FILTER (WHERE hs.checked_at >= now() - interval '30 days') AS restaurants_within_30d,
    count(*) AS source_rows,
    count(*) FILTER (WHERE hs.checked_at >= now() - interval '30 days') AS source_rows_within_30d
  FROM public.restaurant_hours_sources hs
  JOIN published p ON p.id = hs.restaurant_id
),
operator_hours AS (
  SELECT
    count(*) AS rows,
    count(*) FILTER (WHERE lh.confirmed_at IS NOT NULL) AS confirmed,
    count(*) FILTER (WHERE lh.confirmed_at >= now() - interval '30 days') AS confirmed_within_30d,
    count(*) FILTER (WHERE lh.confirmed_at::date = current_date) AS confirmed_today
  FROM public.restaurant_live_hours lh
  JOIN published p ON p.id = lh.restaurant_id
),
accessibility AS (
  SELECT
    count(*) AS current_facts,
    count(*) FILTER (WHERE f.checked_at IS NOT NULL) AS dated_current_facts,
    count(*) FILTER (WHERE f.stale_after IS NOT NULL AND f.stale_after >= now()) AS not_stale_current_facts,
    count(*) FILTER (WHERE f.stale_after IS NOT NULL AND f.stale_after < now()) AS stale_current_facts
  FROM public.restaurant_accessibility_facts f
  JOIN published p ON p.id = f.restaurant_id
  WHERE f.is_current = true
),
accessibility_legacy AS (
  SELECT
    count(*) AS legacy_rows,
    count(*) FILTER (WHERE a.operator_confirmed_at IS NOT NULL) AS operator_confirmed_rows
  FROM public.restaurant_accessibility a
  JOIN published p ON p.id = a.restaurant_id
),
services AS (
  SELECT
    count(*) AS rows,
    count(*) FILTER (WHERE s.confirmed_at IS NOT NULL) AS operator_confirmed_rows,
    count(*) FILTER (WHERE s.confirmed_at >= now() - interval '30 days') AS operator_confirmed_within_30d
  FROM public.restaurant_services s
  JOIN published p ON p.id = s.restaurant_id
)
SELECT jsonb_build_object(
  'captured_at', now(),
  'core', to_jsonb(core),
  'menu', to_jsonb(menu),
  'hours_sources', to_jsonb(hours_sources),
  'operator_hours', to_jsonb(operator_hours),
  'accessibility', to_jsonb(accessibility),
  'accessibility_legacy', to_jsonb(accessibility_legacy),
  'services', to_jsonb(services)
) AS cat02_freshness_audit
FROM core, menu, hours_sources, operator_hours, accessibility, accessibility_legacy, services;

ROLLBACK;
