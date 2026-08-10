# HOY AI Quality Policy

## Grundsatz

HOY optimiert fehlerkritische KI-Funktionen zuerst auf Qualität und Verlässlichkeit, nicht auf den niedrigsten Tokenpreis.

## Produktionsstandard

Für Speisekarten-Extraktion, Preis-/Gericht-Zuordnung, kulinarische Lokalisierung und andere veröffentlichungsnahe KI-Schritte gilt standardmäßig:

- OpenAI Responses API
- Modellwahl zur Laufzeit aus den für das HOY-API-Projekt tatsächlich verfügbaren, freigegebenen Qualitätsmodellen
- Präferenzkette: `gpt-5.2` → `gpt-5-pro` → `gpt-5.1` → `gpt-5`
- Reasoning ausschließlich mit API-dokumentiertem `reasoning.effort`
- Qualitätsziel `xhigh`, soweit das gewählte Modell dies unterstützt; `gpt-5-pro` und ältere Modelle werden auf ihren dokumentierten Maximalwert begrenzt
- Background Responses für lange Extraktionen
- Bildinput: `detail: high`
- PDF-Input als `input_file`; PDFs erhalten keinen erfundenen Bild-`detail`-Parameter
- Structured Outputs mit strengem JSON-Schema
- Keine automatische Veröffentlichung von Modellextraktionen

Vor jedem neuen Hintergrundlauf fragt HOY die Models API ab. Ein optional gesetztes `OPENAI_MENU_MODEL` wird nur verwendet, wenn es im API-Projekt tatsächlich verfügbar ist. Ohne Override wird das bestplatzierte verfügbare Modell aus der Präferenzkette gewählt. Dadurch gibt es weder stille Modell-Fantasien noch ein unbemerktes Downgrade auf ein beliebiges günstigeres Modell.

Die asynchrone Verarbeitung trennt die Modelllaufzeit vom Edge-Function-Zeitlimit. Ein Hintergrundlauf wird gestartet, seine Response-ID gespeichert und der Status später abgerufen; erst ein vollständig abgeschlossenes Ergebnis wird in `menu_intake_items` übernommen.

## Keine stillen Downgrades

Ein günstigeres oder kleineres Modell darf einen fehlerkritischen Produktionsschritt nur ersetzen, wenn ein repräsentativer HOY-Eval mindestens Gleichstand bei den relevanten Qualitätsmetriken nachweist. Die tatsächlich verwendete Modell-ID und der Reasoning-Effort werden je Lauf gespeichert.

## HOY Menü-Goldset

Der reproduzierbare Eval-Korpus besteht zunächst aus 10 vollständig kuratierten offiziellen Karten mit 376 Soll-Gerichten, darunter PDF- und HTML-Quellen. Die Sollwerte enthalten Originalfelder, Preise und redaktionell kuratierte deutsche Lokalisierungen.

## Pflichtmetriken für Menü-Evals

- Vollständigkeit der Gerichte
- Exakte Preisübernahme
- korrekte Zuordnung Preis ↔ Gericht
- korrekte Kategorien
- keine erfundenen Gerichte oder Zutaten
- Erhalt kulturell relevanter Originalbegriffe
- idiomatische deutsche Lokalisierung
- korrekte Behandlung mehrerer Größen/Preise
- robuste Verarbeitung mehrspaltiger, schräger und bildbasierter Karten
- Anteil manueller Korrekturen nach Extraktion

Der automatisierte Baseline-Gate misst mindestens Coverage, Preisgenauigkeit und Halluzinationsrate. Qualitative Sprach- und Kulinarikprüfung bleibt zusätzlich Bestandteil des redaktionellen Reviews.

## Confidence ist kein Freigabesignal

Model-Confidence dient ausschließlich zur Priorisierung manueller Prüfung. Auch hohe Confidence ersetzt keine Betreiber- oder HOY-Freigabe.

## Veröffentlichungsgrenze

KI-Ergebnisse werden ausschließlich in `menu_intake_items` als Entwurf geschrieben. Öffentliche `menu_items` werden erst nach dem vorgesehenen Review-/Bestätigungsprozess aktualisiert.

## Kostenoptimierung

Kostenoptimierung erfolgt nach erfolgreicher Qualitätsmessung. Ziel ist nicht das billigste Modell, sondern der niedrigste Gesamtaufwand pro korrekt veröffentlichter Speisekarte.
