-- Verified menu-discovery audit history · 2026-08-12
-- Research provenance only. Does not publish menus or contact operators.

insert into public.menu_discovery_checks (restaurant_id,channel,source_url,status,menu_scope,is_official,evidence_note,checked_at,next_review_at)
values
(18,'website','https://cp8restaurante.com/carta/','integrated','full_menu',true,'Offizielle CP8-Carta enthält Ágora SmartMenu; Live-Betreiberkarte direkt in HOY eingebettet.',now(),now()+interval '30 days'),
(21,'website','https://cabop.es/carta-online','integrated','full_menu',true,'Offizielle Betreiberseite liefert Speise- und Getränkekarte als zwei In-App-Bildseiten.',now(),now()+interval '30 days'),
(116,'website','https://trasteverelamanga.es/menu/','integrated','full_menu',true,'Aktuelle offizielle Betreiber-Bildkarte in HOY integriert.',now(),now()+interval '30 days'),
(144,'website','https://restauranteislagrosalamanga.es/menu/','integrated','full_menu',true,'Offizielle Menüseite mit sechs Betreiber-Kartenseiten (ES/EN) in HOY integriert.',now(),now()+interval '30 days'),
(110,'website','https://elrincondelahormiga.com/carta/','integrated','full_menu',true,'Alle acht aktuell veröffentlichten offiziellen Carta-Bereiche als In-App-Seiten integriert.',now(),now()+interval '30 days'),
(9,'website','https://areasunset.es/wp-content/uploads/2025/05/Carta-Area-Sunset-web.pdf','integrated','full_menu',true,'Vollständige vierseitige offizielle Restaurantkarte als Betreiber-PDF direkt in HOY eingebettet.',now(),now()+interval '30 days'),
(111,'website','https://latabernadelpuertocabodepalos.es/wp-content/uploads/2024/10/carta-Taberna-del-Puerto-mantel-A3.pdf','integrated','full_menu',true,'Echte offizielle A3-Karte aus der Betreiberwebsite direkt in HOY eingebettet; alte Demo-/menu-Seite verworfen.',now(),now()+interval '30 days'),
(4,'website','https://www.bonoboplaya.com/nuestra-carta/','menu_found','full_menu',true,'Offizielle Hauptkarten-Seite vorhanden; Bildkarte noch nicht zuverlässig als direkte In-App-Quelle aufgelöst.',now(),now()+interval '7 days'),
(11,'website','https://www.playachicalamanga.es/','menu_found','partial',true,'Offizielle Seite weist zwölf Kartenbereiche aus; serverseitig ist derzeit nur Vinos vollständig extrahierbar. Dynamische Tabs müssen browserseitig erfasst werden.',now(),now()+interval '7 days'),
(7,'website','https://escueladepieter.com/','blocked','full_menu',true,'Offizielle Website bestätigt eine vollständige Essens-/Getränkekarte, aber Ver Carta verweist auf eine alte URL, die aktuell zur Startseite zurückleitet.',now(),now()+interval '7 days'),
(10,'website','https://clubnauticodosmares.com/restaurante/','checked_no_menu','none',true,'Offizielle Restaurantseite beschreibt die Gastronomie und einzelne Gerichte, veröffentlicht aber keine vollständige bepreiste Karte.',now(),now()+interval '14 days'),
(217,'website','https://elnidokm1.es/','menu_found','partial',true,'Offizielle Website zeigt Speise-Highlights; die als Carta completa verlinkte digitale Seite deckt derzeit überwiegend Getränke ab. Keine falsche Vollständigkeit.',now(),now()+interval '7 days'),
(152,'website','https://whitediamondloungebar.com/','checked_no_menu','none',true,'Offizielle Website bestätigt eine umfangreiche Carta, veröffentlicht deren konkrete Positionen/Preise aber nicht auf der Website; Social-Prüfung bleibt offen.',now(),now()+interval '14 days')
on conflict (restaurant_id,channel,coalesce(source_url,'')) do update set
 status=excluded.status,
 menu_scope=excluded.menu_scope,
 is_official=excluded.is_official,
 evidence_note=excluded.evidence_note,
 checked_at=excluded.checked_at,
 next_review_at=excluded.next_review_at,
 updated_at=now();

-- Escuela de Pieter: official social route discovered on the restaurant website.
-- This is research metadata only. Outreach remains locked and contact status remains untouched/default Not contacted.
insert into public.venue_sales_pipeline (
  restaurant_id,contact_instagram,contact_website,contact_source_url,contact_confidence,
  contact_researched_at,pre_contact_action,research_notes,send_lock
)
values (
  7,
  '@escueladepieter1975',
  'https://escueladepieter.com/',
  'https://escueladepieter.com/',
  'High',
  now(),
  'Offizielles Instagram/Facebook auf aktuelle vollständige Karte prüfen; keine Nachricht senden.',
  'Offizielle Betreiberwebsite verlinkt Instagram @escueladepieter1975 und Facebook /EscueladePieter. Der aktuelle Ver-Carta-Link ist defekt und fällt auf die Startseite zurück.',
  true
)
on conflict (restaurant_id) do update set
  contact_instagram=excluded.contact_instagram,
  contact_website=excluded.contact_website,
  contact_source_url=excluded.contact_source_url,
  contact_confidence=excluded.contact_confidence,
  contact_researched_at=excluded.contact_researched_at,
  pre_contact_action=excluded.pre_contact_action,
  research_notes=case
    when coalesce(public.venue_sales_pipeline.research_notes,'')='' then excluded.research_notes
    when position(excluded.research_notes in public.venue_sales_pipeline.research_notes)>0 then public.venue_sales_pipeline.research_notes
    else public.venue_sales_pipeline.research_notes || E'\n' || excluded.research_notes
  end,
  send_lock=true,
  updated_at=now();
