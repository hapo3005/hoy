# HOY ACQ-03 / ACQ-04 — Paid Proof + Buyer-Value Measurement v1.0

## Zweck

Dieser Block macht aus der Acquisition Thesis ein prüfbares G2-Experiment. Ziel ist nicht, gute Aktivitätszahlen zu erzeugen, sondern vier wirtschaftlich relevante Fragen mit Evidenz zu beantworten:

1. Zahlen externe Betriebe wiederkehrend für HOY?
2. Erzeugt HOY messbare Nutzerintention mit Bezug zu einem konkreten Betrieb?
3. Bestätigen Betriebe daraus tatsächlich nützliche Leads/Transaktionen?
4. Bleiben Nutzung, Business-Beziehung und Datenqualität über Zeit bestehen?

Bis Contact Freeze, Terms-/Invoice-/Payment-Readiness und RT-008 freigegeben sind, bleibt dieser Block **Design/Protocol only**.

## ACQ-03 — HOY Founding Business

### Kostenlose Basis bleibt kostenlos

Der Einstieg in die Betreiberverifizierung und die Bestätigung vorbereiteter Kerndaten werden nicht künstlich hinter eine Bezahlschranke verschoben. Das erhält die First-Party-Datenstrategie und verhindert, dass Datenqualität von Zahlungsbereitschaft abhängt.

### Bezahlte Hypothese

`HOY Founding Business` validiert eine monatlich wiederkehrende Business-Beziehung rund um erweiterte Live-Pflege, aktuelle Business-Inhalte und später privacy-safe aggregierte Performance-Einblicke.

Der Test startet **nicht automatisch** und ist kein live veröffentlichter Tarif. Arbeitsarme sind 29 / 39 / 59 EUR pro Monat. Pro Betrieb wird genau ein Preis gezeigt. Die drei Preise werden nicht gleichzeitig als künstliche Auswahl präsentiert. Bevorzugt wird randomisierte Zuteilung; falls operativ nicht sauber möglich, wird balanciert sequenziell zugeteilt und die Regel vorab protokolliert.

Der bereits vorhandene `HOY Highlight`-Launch-Candidate von 29 EUR pro Event bleibt ein **separates One-off-Produkt** und wird nicht in MRR eingerechnet.

### Was als Paid Proof zählt

| Stufe | Evidenz | BP1 Paid Business? |
|---|---|---:|
| P0 | Interesse / positives Gespräch | Nein |
| P1 | unterschrieben / ausdrücklich akzeptiert | Nein |
| P2 | Rechnung / Zahlungsanforderung erstellt | Nein |
| P3 | externe Zahlung eingegangen und reconciled | **Ja** |
| P4 | zweite separate wiederkehrende Zahlung | **Ja + Renewal** |
| P5 | bezahlte Beziehung >=90 Tage nach eingefrorener Regel | **Ja + Retention** |

Kostenlose Piloten, Founder-/Related-Party-Zahlungen und vollständig erstattete Erstzahlungen werden nicht als belastbarer Paid Proof gezählt.

## ACQ-04 — Buyer-Value Measurement

### Vorhandene Technik wird wiederverwendet

HOY besitzt bereits ein consent-gated Analytics-Runtime-Modell sowie eine Sponsored-Attribution über 30 Minuten für denselben Betrieb. Der neue Contract erfindet deshalb keine parallele Tracking-Architektur.

Die bestehende Privacy-Grenze bleibt stärker als jede G2-Messanforderung: In Production kein Analytics-Identifier und kein Payload, solange RT-008 nicht `releaseReady` ist und der Nutzer nicht ausdrücklich zugestimmt hat.

### Semantik der vorhandenen Aktionen

- `profile_view` = Engagement, kein Lead.
- `menu_open` / `service_open` = Consideration, kein Outcome.
- `route_start`, `website_open`, `call_click`, `reservation_start`, `reservation_submit` = High Intent.
- Keine dieser Aktionen ist automatisch eine bestätigte Transaktion.
- Besonders `reservation_submit` darf nicht als „Reservierung“ berichtet werden, solange keine unabhängige Bestätigung vorliegt.

### Merchant Outcome Ladder

- **M1 — HOY Intent Signal:** consented High-Intent-Aktion.
- **M2 — Merchant Acknowledged Lead:** verifizierter Betreiber bestätigt einen passenden Lead nach dokumentierter Matching-Regel.
- **M3 — Merchant Confirmed Transaction:** Betreiber bestätigt Reservierung/Bestellung/Besuch oder einen anderen vorher definierten Abschluss.
- **M4 — Merchant Confirmed Value:** zusätzlich ist ein Wert oder eine belastbare Wertspanne nach definierter Evidenzmethode bestätigt.

Diese Ebenen dürfen nie stillschweigend ineinander umgedeutet werden.

## KPI-Set für Käuferattraktivität

Die erste Käuferfähige Messung fokussiert:

1. externe zahlende Betriebe;
2. recurring MRR, ohne One-off-Highlight-Umsatz;
3. 90-Tage-Paid-Retention;
4. qualifizierte High-Intent-Sessions;
5. M2+ Merchant-confirmed Outcomes;
6. Merchant-Outcome-Rate unter eingefrorener Attribution;
7. 30-Tage-Repeat in der consented, aktivierten High-Intent-Kohorte;
8. First-Party-/HOY-Verified-Coverage kritischer Business-Daten;
9. Freshness-SLA kritischer Daten;
10. Region-2-Replikationseffizienz.

### Warum dieses Set kaufpreisrelevant ist

Es trennt vier unterschiedliche Wertquellen:

- **Economics:** zahlen und bleiben Businesses?
- **Demand:** erzeugt HOY wiederkehrende kommerzielle Nutzerintention?
- **Outcome:** erkennt der Merchant daraus realen Nutzen?
- **Defensibility/Scale:** kann HOY Daten frisch halten und dasselbe System in Region 2 wiederholen?

Damit können spätere Buyer-Synergy-Modelle auf echten HOY-Daten statt auf allgemeinen Marktstories aufbauen.

## Anti-Vanity / DD Guardrails

Verbotene Gleichsetzungen:

- Pageviews = Nachfrage
- Profile Views = Leads
- Clicks = Buchungen
- `reservation_submit` = bestätigte Reservierung
- Route Start = Besuch
- Call Click = verbundenes Gespräch
- einmalige Kampagnenzahlung = MRR
- kostenloser Betrieb = Paying Business
- consented Repeat Cohort = alle Nutzer

QA-/Preview-Traffic wird aus Business-Metriken ausgeschlossen. Ein späterer sauberer Analytics-Cutover bekommt einen expliziten Zeitstempel; historische kontaminierte oder methodisch inkompatible Daten werden nicht rückwirkend in neue KPIs gemischt.

## Aktivierungsreihenfolge

Vor echtem G2-Measurement:

1. G1 Contact Freeze formell freigegeben;
2. Business Terms / Rechnung / Payment rechtlich und operativ bereit;
3. RT-008 release-ready + Analytics explizit autorisiert;
4. Client-/Server-Event-Allowlist reconciled;
5. QA-/Preview-Exclusion bewiesen;
6. Merchant-Outcome-Bestätigung implementiert und getestet;
7. Metric Dictionary + Query-Versionen eingefroren;
8. Clean-Cutover protokolliert;
9. erst dann echte Founding-Angebote und G2-Messung.

## Nicht autorisiert

Dieses Paket autorisiert **keinen** Business-/Investor-/Buyer-Outreach, keine Terms-Aktivierung, kein Billing, keine Production-Analytics-Aktivierung, keine Production-DML/DDL und keinen Merge.
