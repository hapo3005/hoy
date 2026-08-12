-- HOY 2.34.0 · CP8 Restaurante · official digital menu embed
-- The official CP8 menu page embeds the Ágora SmartMenu below. HOY stores both URLs:
-- source_url remains the restaurant-owned menu page; display_payload.embed_url is the official menu provider iframe.
update public.menu_sources
set
  completeness_status='complete',
  completeness_checked_at=now(),
  last_checked_at=now(),
  completeness_note='Vollständige offizielle Betreiberkarte direkt in HOY eingebettet; CP8 bindet diese Ágora-SmartMenu-Karte auf der eigenen Karten-Seite ein.',
  display_payload=jsonb_build_object(
    'mode','official_embed',
    'embed_url','https://smartmenu.agorapos.com/?id=smno3yk1',
    'fallback_url','https://cp8restaurante.com/carta/',
    'provider','Ágora SmartMenu',
    'title','Carta oficial · CP8 Restaurante'
  ),
  coverage_meta=coalesce(coverage_meta,'{}'::jsonb) || jsonb_build_object(
    'delivery','official_embed',
    'structured',false,
    'provider','agora_smartmenu'
  )
where restaurant_id=18
  and is_official=true
  and source_url='https://cp8restaurante.com/carta/';
