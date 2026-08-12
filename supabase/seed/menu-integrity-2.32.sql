-- HOY 2.32.0 menu-integrity classification.
-- Technical import state remains separate from content completeness.

update public.menu_sources
set coverage_scope = case
  when source_label ilike '%vino%' or source_label ilike '%wine%' or source_label ilike '%weinkarte%' then 'wine'
  when source_label ilike '%postre%' or source_label ilike '%dessert%' then 'dessert'
  when source_label ilike '%desayuno%' or source_label ilike '%breakfast%' then 'breakfast'
  when source_label ilike '%comida%' or source_label ilike '%lunch%' then 'lunch'
  when source_label ilike '%cena%' or source_label ilike '%dinner%' then 'dinner'
  when source_label ilike '%degust%' then 'tasting'
  when source_label ilike '%menú del día%' or source_label ilike '%menu del dia%' then 'day_menu'
  when source_label ilike '%platos destacados%' then 'highlights'
  else 'full_menu'
end,
completeness_status = case
  when coalesce(jsonb_array_length(case when jsonb_typeof(display_payload->'pages')='array' then display_payload->'pages' else '[]'::jsonb end),0) > 0 then 'image_complete'
  when import_status='imported' then 'complete'
  when import_status='partial' then 'partial'
  when import_status='link_only' then 'source_only'
  else 'unknown'
end,
completeness_checked_at = coalesce(last_checked_at, now()),
completeness_note = case
  when coalesce(jsonb_array_length(case when jsonb_typeof(display_payload->'pages')='array' then display_payload->'pages' else '[]'::jsonb end),0) > 0 then 'Offizielle Kartenquelle vollständig als In-App-Seiten abgebildet.'
  when import_status='imported' then 'Aktiver Inhalt dieser Quelle wurde als vollständig importiert geführt.'
  when import_status='partial' then 'Nur ein verifizierter Teil dieser offiziellen Quelle ist in HOY abgebildet.'
  when import_status='link_only' then 'Offizielle Quelle bekannt, Inhalt aber noch nicht vollständig in HOY darstellbar.'
  else 'Vollständigkeit noch nicht bewertet.'
end
where is_official=true;

update public.menu_sources
set completeness_status='superseded',
    completeness_note='Historische bzw. ersetzte Quelle; nicht für die aktuelle Gäste-Karte verwenden.'
where is_official=true and import_status='link_only' and source_note ilike 'Fuente histórica%';

update public.menu_sources
set completeness_status='invalid', completeness_note='Offizielle Seite vorhanden, aber der dortige Inhalt ist keine belastbare aktuelle Restaurantkarte.'
where restaurant_id=111 and source_label ilike '%Carta%';

update public.menu_sources
set completeness_status='invalid', completeness_note='Der offizielle Kartenlink ist aktuell nicht belastbar erreichbar; nicht als verfügbare Speisekarte ausweisen.'
where restaurant_id=7;

update public.menu_sources
set completeness_status='insufficient', completeness_note='Offizielle Betreiberquelle vorhanden, aber keine belastbare vollständige und bepreiste Karte veröffentlicht.'
where restaurant_id in (10,142);

update public.menu_sources set coverage_scope='food' where restaurant_id=15 and is_official=true;
update public.menu_sources set coverage_scope='drinks' where restaurant_id=217 and source_label ilike 'Carta digital oficial%';
update public.menu_sources set coverage_scope='secondary' where restaurant_id=217 and source_label ilike '%El Cuco%';
update public.menu_sources set coverage_scope='day_menu' where restaurant_id=187 and source_label ilike '%Menú del Día%';

update public.menu_sources
set completeness_status='complete',
    completeness_note=case restaurant_id
      when 16 then 'Inhaltlich vollständig für alle verifizierbaren bepreisten Positionen; einzelne offensichtlich fehlerhafte bzw. unbepreiste Angaben bleiben bewusst außen vor. Aktualitätsvorsicht bleibt separat im Importstatus.'
      when 13 then 'Alle vier aktuell offiziell verlinkten PDF-Seiten wurden visuell gegen HOY geprüft; inhaltlich vollständig für klar lesbare Positionen. Aktualitätsvorsicht bleibt separat im Importstatus.'
      when 20 then 'Aktuelle spanische Hauptkarte vollständig geprüft; nur eine widersprüchlich bepreiste Einzelposition bleibt deaktiviert. Aktualitäts-/Konflikthinweis bleibt separat bestehen.'
      when 216 then 'Die aktuell veröffentlichte saisonale Betreiberkarte ist inhaltlich vollständig erfasst; die Betreiberwarnung zu häufigen Änderungen bleibt als Aktualitätsvorbehalt bestehen.'
      when 227 then 'Der aktuell vom Betreiber verlinkte PDF-Inhalt ist vollständig erfasst; das Dokument selbst trägt jedoch einen älteren Stand und bleibt deshalb bei der Aktualität vorsichtig markiert.'
    end
where restaurant_id in (16,13,20,216,227) and is_official=true and import_status='partial';

update public.menu_sources
set coverage_meta=jsonb_build_object(
      'expected_sections',12,
      'imported_sections',1,
      'expected_section_names',jsonb_build_array('Vinos','Entrantes','Ensaladas','Crudo','Pescados','Arroces','Carnes','Para los peques','Postres caseros','Bebidas','Alcohol','Cafés'),
      'imported_section_names',jsonb_build_array('Vinos'),
      'observed_on_official_source',true
    ),
    completeness_status='partial',
    completeness_checked_at=now(),
    completeness_note='Die offizielle Seite zeigt 12 Hauptbereiche. In HOY ist aktuell nur der Bereich Vinos strukturiert; 11 weitere sichtbare Bereiche fehlen noch und dürfen nicht als vollständig dargestellt werden.'
where restaurant_id=11 and is_official=true;

update public.menu_sources
set coverage_meta=coalesce(coverage_meta,'{}'::jsonb) || jsonb_build_object('source_pages',12,'embedded_pages',12),
    completeness_status='image_complete',
    completeness_note='Alle 12 offiziellen Kartenbilder (6 Food, 6 Drinks) werden direkt in HOY dargestellt.'
where restaurant_id=234 and is_official=true;
