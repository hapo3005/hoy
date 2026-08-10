# HOY AI Quality Policy

## Grundsatz

HOY optimiert fehlerkritische KI-Funktionen zuerst auf Qualität und Verlässlichkeit, nicht auf den niedrigsten Tokenpreis.

## Produktionsstandard

Für Speisekarten-Extraktion, Preis-/Gericht-Zuordnung, kulinarische Lokalisierung und andere veröffentlichungsnahe KI-Schritte gilt standardmäßig:

- Modell: `gpt-5.6-sol`
- Responses API
- Reasoning mode: `pro`
- Reasoning effort: `high` als stabiler Produktionsbaseline
- Bildinput: `detail: original`
- PDF input: `detail: high`
- Structured Outputs mit strengem JSON-Schema
- Keine automatische Veröffentlichung von Modellextraktionen

`max` reasoning wird für schwierige Quellen vorgesehen, sobald die Verarbeitung asynchron und damit unabhängig vom aktuellen Edge-Function-Zeitlimit läuft.

## Keine stillen Downgrades

`gpt-5.6-terra`, `gpt-5.6-luna` oder spätere günstigere Modelle dürfen einen fehlerkritischen Sol-Schritt nur ersetzen, wenn ein repräsentativer HOY-Eval mindestens Gleichstand bei den relevanten Qualitätsmetriken nachweist.

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

## Confidence ist kein Freigabesignal

Model-Confidence dient ausschließlich zur Priorisierung manueller Prüfung. Auch hohe Confidence ersetzt keine Betreiber- oder HOY-Freigabe.

## Veröffentlichungsgrenze

KI-Ergebnisse werden ausschließlich in `menu_intake_items` als Entwurf geschrieben. Öffentliche `menu_items` werden erst nach dem vorgesehenen Review-/Bestätigungsprozess aktualisiert.

## Kostenoptimierung

Kostenoptimierung erfolgt nach erfolgreicher Qualitätsmessung. Ziel ist nicht das billigste Modell, sondern der niedrigste Gesamtaufwand pro korrekt veröffentlichter Speisekarte.
