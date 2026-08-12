-- HOY menu-source selection hotfix data · 2026-08-12
-- Records two operator-owned complete core menus verified on the official restaurant websites.
-- DML only; no schema changes.

update public.menu_sources
set completeness_status='complete',
    completeness_checked_at=now(),
    completeness_note='Offizielle 4-seitige Restaurantkarte 2026 ist vollständig über die Betreiber-PDF verfügbar; HOY bindet die Originalkarte direkt ein, während der strukturierte Import weiter vervollständigt werden kann.',
    display_payload=jsonb_build_object(
      'mode','official_embed',
      'title','Carta restaurante 2026 · Area Sunset',
      'provider','Area Sunset',
      'embed_url','https://areasunset.es/wp-content/uploads/2025/05/Carta-Area-Sunset-web.pdf',
      'fallback_url','https://areasunset.es/wp-content/uploads/2025/05/Carta-Area-Sunset-web.pdf'
    ),
    coverage_meta=coalesce(coverage_meta,'{}'::jsonb) || jsonb_build_object('delivery','official_embed','document_pages',4,'verified_on_official_source',true),
    last_checked_at=now()
where restaurant_id=9
  and source_url='https://areasunset.es/wp-content/uploads/2025/05/Carta-Area-Sunset-web.pdf';

update public.menu_sources
set completeness_status='superseded',
    completeness_checked_at=now(),
    completeness_note='Die /menu/-Seite enthält ein Template/Demo-Menü und wird nicht als Betreiberkarte verwendet; die echte offizielle PDF-Karte ist als separate Quelle hinterlegt.',
    last_checked_at=now()
where restaurant_id=111
  and source_url='https://latabernadelpuertocabodepalos.es/menu/';

insert into public.menu_sources (
  restaurant_id,source_url,source_kind,last_checked_at,import_status,source_label,source_format,is_official,
  source_note,display_payload,coverage_scope,completeness_status,completeness_checked_at,completeness_note,coverage_meta
)
values (
  111,
  'https://latabernadelpuertocabodepalos.es/wp-content/uploads/2024/10/carta-Taberna-del-Puerto-mantel-A3.pdf',
  'pdf',now(),'link_only','Carta oficial · La Taberna del Puerto','pdf',true,
  'PDF enlazada desde la sección Carta de la web oficial del restaurante.',
  jsonb_build_object(
    'mode','official_embed',
    'title','Carta oficial · La Taberna del Puerto',
    'provider','La Taberna del Puerto',
    'embed_url','https://latabernadelpuertocabodepalos.es/wp-content/uploads/2024/10/carta-Taberna-del-Puerto-mantel-A3.pdf',
    'fallback_url','https://latabernadelpuertocabodepalos.es/wp-content/uploads/2024/10/carta-Taberna-del-Puerto-mantel-A3.pdf'
  ),
  'full_menu','complete',now(),
  'Carta completa de una página enlazada directamente por la web oficial; contiene entrantes, pescados, carnes, raciones, cazuelas, arroces y ensaladas con precios.',
  jsonb_build_object('delivery','official_embed','document_pages',1,'verified_on_official_source',true)
)
on conflict (restaurant_id,source_url) do update set
  source_kind=excluded.source_kind,
  last_checked_at=excluded.last_checked_at,
  source_label=excluded.source_label,
  source_format=excluded.source_format,
  is_official=excluded.is_official,
  source_note=excluded.source_note,
  display_payload=excluded.display_payload,
  coverage_scope=excluded.coverage_scope,
  completeness_status=excluded.completeness_status,
  completeness_checked_at=excluded.completeness_checked_at,
  completeness_note=excluded.completeness_note,
  coverage_meta=excluded.coverage_meta;
