-- HOY menu discovery pass · verified operator-owned image menus
-- Records production changes made during the all-venue website/social audit.

-- Snack Cabo P · official website publishes food + drinks images.
update public.menu_sources
set completeness_status='image_complete',
    completeness_checked_at=now(),
    last_checked_at=now(),
    completeness_note='Offizielle Karten-Seite vollständig als zwei Betreiberbilder direkt in HOY abbildbar: Speisekarte und Getränke.',
    display_payload=jsonb_build_object('pages',jsonb_build_array(
      jsonb_build_object('url','https://cabop.es/wp-content/uploads/2025/06/CARTA-ONLINE-GR-1024x768.png','section','Speisekarte','label','Speisekarte'),
      jsonb_build_object('url','https://cabop.es/wp-content/uploads/2025/06/BEBIDAS-ONLINE-GR-878x1024.png','section','Getränke','label','Getränkekarte')
    )),
    coverage_meta=coalesce(coverage_meta,'{}'::jsonb)||jsonb_build_object('delivery','image_pages','page_count',2)
where restaurant_id=21 and is_official=true and source_url='https://cabop.es/carta-online';

-- Trastevere La Manga · official website explicitly labels the current menu image.
insert into public.menu_sources (restaurant_id,source_url,source_kind,last_checked_at,import_status,source_label,source_format,is_official,source_note,display_payload,coverage_scope,completeness_status,completeness_checked_at,completeness_note,coverage_meta)
values (116,'https://trasteverelamanga.es/menu/','official_link',now(),'link_only','Carta oficial · Trastevere','image_menu',true,'Offizielle Menüseite des Restaurants.',jsonb_build_object('pages',jsonb_build_array(jsonb_build_object('url','https://trasteverelamanga.es/wp-content/uploads/2024/07/menunuevo.jpg','section','Speisekarte','label','Speisekarte'))),'full_menu','image_complete',now(),'Die offizielle Website kennzeichnet diese Seite als aktuelle Carta; die Betreiberkarte ist als eine vollständige Bildseite direkt in HOY darstellbar.',jsonb_build_object('delivery','image_pages','page_count',1))
on conflict (restaurant_id,source_url) do update set last_checked_at=excluded.last_checked_at,display_payload=excluded.display_payload,completeness_status=excluded.completeness_status,completeness_checked_at=excluded.completeness_checked_at,completeness_note=excluded.completeness_note,coverage_meta=excluded.coverage_meta;

-- Restaurante Isla Grosa · official site publishes three ES + three EN menu pages.
insert into public.menu_sources (restaurant_id,source_url,source_kind,last_checked_at,import_status,source_label,source_format,is_official,source_note,display_payload,coverage_scope,completeness_status,completeness_checked_at,completeness_note,coverage_meta)
values (144,'https://restauranteislagrosalamanga.es/menu/','official_link',now(),'link_only','Menú oficial · Restaurante Isla Grosa','image_menu',true,'Offizielle Menüseite des Restaurants.',jsonb_build_object('pages',jsonb_build_array(
 jsonb_build_object('url','https://restauranteislagrosalamanga.es/wp-content/uploads/2026/03/ISLA-01-copia-480x1024.jpg','section','Carta · Español','label','Seite 1'),
 jsonb_build_object('url','https://restauranteislagrosalamanga.es/wp-content/uploads/2026/03/ISLA-02-copia-480x1024.jpg','section','Carta · Español','label','Seite 2'),
 jsonb_build_object('url','https://restauranteislagrosalamanga.es/wp-content/uploads/2026/03/ISLA-04-copia-480x1024.jpg','section','Carta · Español','label','Seite 3'),
 jsonb_build_object('url','https://restauranteislagrosalamanga.es/wp-content/uploads/2026/03/ISLA-INGLES-01-copia-480x1024.jpg','section','Menu · English','label','Page 1'),
 jsonb_build_object('url','https://restauranteislagrosalamanga.es/wp-content/uploads/2026/03/ISLA-INGLES-02-copia-480x1024.jpg','section','Menu · English','label','Page 2'),
 jsonb_build_object('url','https://restauranteislagrosalamanga.es/wp-content/uploads/2026/03/ISLA-INGLES-04-copia-480x1024.jpg','section','Menu · English','label','Page 3')
)),'full_menu','image_complete',now(),'Die offizielle Menüseite veröffentlicht drei spanische und drei englische Betreiber-Kartenseiten; vollständig direkt in HOY darstellbar.',jsonb_build_object('delivery','image_pages','page_count',6,'languages',jsonb_build_array('es','en')))
on conflict (restaurant_id,source_url) do update set last_checked_at=excluded.last_checked_at,display_payload=excluded.display_payload,completeness_status=excluded.completeness_status,completeness_checked_at=excluded.completeness_checked_at,completeness_note=excluded.completeness_note,coverage_meta=excluded.coverage_meta;

-- El Rincón de la Hormiga · official Carta currently exposes all eight menu sections.
insert into public.menu_sources (restaurant_id,source_url,source_kind,last_checked_at,import_status,source_label,source_format,is_official,source_note,display_payload,coverage_scope,completeness_status,completeness_checked_at,completeness_note,coverage_meta)
values (110,'https://elrincondelahormiga.com/carta/','official_link',now(),'link_only','Carta oficial · El Rincón de la Hormiga','image_menu',true,'Offizielle Carta-Seite des Betriebs; dieselbe Website verlinkt die Betreiberprofile auf Facebook und Instagram.',jsonb_build_object('pages',jsonb_build_array(
 jsonb_build_object('url','https://elrincondelahormiga.com/wp-content/uploads/2023/05/rones.png','section','Rones','label','Rones'),
 jsonb_build_object('url','https://elrincondelahormiga.com/wp-content/uploads/2023/05/gins.png','section','Gins','label','Gins'),
 jsonb_build_object('url','https://elrincondelahormiga.com/wp-content/uploads/2023/05/vodkas.png','section','Vodkas','label','Vodkas'),
 jsonb_build_object('url','https://elrincondelahormiga.com/wp-content/uploads/2023/05/tequilas.png','section','Tequilas','label','Tequilas'),
 jsonb_build_object('url','https://elrincondelahormiga.com/wp-content/uploads/2023/05/vermouths-martinis.png','section','Vermouths & Martinis','label','Vermouths & Martinis'),
 jsonb_build_object('url','https://elrincondelahormiga.com/wp-content/uploads/2023/05/whiskeys.png','section','Whiskey','label','Whiskey'),
 jsonb_build_object('url','https://elrincondelahormiga.com/wp-content/uploads/2023/05/cocteles-aperitivos.png','section','Cócteles aperitivos','label','Cócteles aperitivos'),
 jsonb_build_object('url','https://elrincondelahormiga.com/wp-content/uploads/2023/05/tapas.png','section','Tapas','label','Tapas')
)),'full_menu','image_complete',now(),'Die aktuell verlinkte offizielle Carta-Seite stellt alle acht Kartenbereiche als Betreiberbilder bereit; vollständig direkt in HOY darstellbar.',jsonb_build_object('delivery','image_pages','page_count',8,'social_crosscheck',true))
on conflict (restaurant_id,source_url) do update set last_checked_at=excluded.last_checked_at,display_payload=excluded.display_payload,completeness_status=excluded.completeness_status,completeness_checked_at=excluded.completeness_checked_at,completeness_note=excluded.completeness_note,coverage_meta=excluded.coverage_meta;
