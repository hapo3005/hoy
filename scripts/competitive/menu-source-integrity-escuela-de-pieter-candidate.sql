-- HOY Competitive Integrity Candidate · 2026-08-20
-- Purpose: downgrade only the stale/compromised Escuela de Pieter menu-source authority metadata.
-- Production execution is NOT authorized by this file.
-- Required session gate before any real apply:
--   SET LOCAL hoy.menu_source_integrity_apply_authorized = 'EXPLICIT_REVIEWED_APPLY';

BEGIN;

DO $$
DECLARE
  affected integer;
BEGIN
  IF current_setting('hoy.menu_source_integrity_apply_authorized', true) IS DISTINCT FROM 'EXPLICIT_REVIEWED_APPLY' THEN
    RAISE EXCEPTION 'menu_source_integrity_apply_not_authorized';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.menu_sources
    WHERE id = 'dfe86203-3d7e-496c-bbed-13b8bb1790d3'::uuid
      AND restaurant_id = 7
      AND source_url = 'https://escueladepieter5818.live-website.com/carta/'
      AND source_kind = 'official_link'
      AND import_status = 'link_only'
      AND source_authority = 'first_party'
      AND source_format = 'unknown'
      AND coverage_scope = 'full_menu'
      AND completeness_status = 'invalid'
      AND last_checked_at = '2026-08-11 08:04:05.673722+00'::timestamptz
  ) THEN
    RAISE EXCEPTION 'escuela_menu_source_before_state_drift';
  END IF;

  UPDATE public.menu_sources
  SET source_authority = 'unknown',
      coverage_scope = 'unknown',
      authority_checked_at = '2026-08-20 05:30:00+00'::timestamptz,
      authority_note = '2026-08-20 integrity recheck: stored menu endpoint resolves to unrelated e-commerce/spam content. Restaurant canonical website/source remains https://escueladepieter.com/. Do not treat this menu endpoint as first-party menu authority; replace only with a current reviewed or operator-confirmed menu source.',
      completeness_checked_at = '2026-08-20 05:30:00+00'::timestamptz,
      completeness_note = 'Integrity blocked: existing endpoint is not a trustworthy current restaurant menu. Keep invalid and fail closed until replacement/operator confirmation.'
  WHERE id = 'dfe86203-3d7e-496c-bbed-13b8bb1790d3'::uuid
    AND restaurant_id = 7
    AND source_url = 'https://escueladepieter5818.live-website.com/carta/'
    AND source_authority = 'first_party'
    AND coverage_scope = 'full_menu'
    AND completeness_status = 'invalid';

  GET DIAGNOSTICS affected = ROW_COUNT;
  IF affected <> 1 THEN
    RAISE EXCEPTION 'escuela_menu_source_unexpected_row_count:%', affected;
  END IF;
END $$;

COMMIT;
