# HOY AI Quality Policy

## Grundsatz

HOY optimiert fehlerkritische KI-Funktionen zuerst auf Qualität und Verlässlichkeit, nicht auf den niedrigsten Tokenpreis.

## Produktionsstandard

Für Speisekarten-Extraktion, Preis-/Gericht-Zuordnung, kulinarische Lokalisierung und andere veröffentlichungsnahe KI-Schritte gilt standardmäßig:

- Modell: `gpt-5.6-sol`
- Responses API
- Background Responses für lange Extraktionen
- Reasoning mode: `pro`
- Reasoning effort: `max` für die produktive Menü-Extraktion
- Bildinput: `detail: original`
- PDF input: `detail: high`
- Structured Outputs mit strengem JSON-Schema
- Keine automatische Veröffentlichung von Modellextraktionen

Die asynchrone Verarbeitung trennt die Modelllaufzeit vom Edge-Function-Zeitlimit. Ein Hintergrundlauf wird gestartet, seine Response-ID gespeichert und der Status später abgerufen; erst ein vollständig abgeschlossenes Ergebnis wird in `menu_intake_items` übernommen.

## Keine stillen Downgrades

`gpt-5.6-terra`, `gpt-5.6-luna` oder spätere günstigere Modelle dürfen einen fehlerkritischen Sol-Schritt nur ersetzen, wenn ein repräsentativer HOY-Eval mindestens Gleichstand bei den relevanten Qualitätsmetriken nachweist.

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
