# HOY G2 Founding Sales Kit v1.0

Status: **READY_NOT_AUTHORIZED**

## Zweck

Dieses Paket macht G2 Market Proof startbereit, ohne den G1 Contact Freeze zu brechen. Es ist kein Outreach-Plan mit Freigabe, kein Terms-/Billing-Launch und kein neuer G1-Control-Plane-Layer.

Der wirtschaftliche Test ist absichtlich streng: HOY soll später nicht nur Interesse oder Demo-Lob zeigen, sondern **externe eingegangene Zahlung, Renewal und Merchant Value** belegen können.

## Harte Startgrenze

Vor dem ersten Kontakt müssen alle acht Launch-Prerequisites im JSON-Contract erfüllt sein. Insbesondere:

1. #132 schließt G1 Acquisition Clean;
2. Contact Freeze wird separat freigegeben;
3. rechtliche Vertrags-/Entity-Identität ist klar;
4. benötigte Business Terms und Zahlungsunterlagen sind freigegeben;
5. Wave-A-Kohorte ist eingefroren;
6. Preisarm-Zuteilung ist vor Outreach eingefroren;
7. Payment-Reconciliation-Pfad ist auditierbar;
8. Production Analytics bleibt aus, solange keine separate Privacy-/Analytics-Freigabe vorliegt.

Der aktuelle Zustand erfüllt diese Startbedingungen **nicht**. Das Paket ist daher startbereit, aber nicht startautorisiert.

## Region 1

Region 1 ist die **vollständige definierte Mar-Menor-Region**, niemals nur La Manga + Cabo de Palos. Der Sales-Test arbeitet mit denselben neun Area-Buckets wie ACQ-06.

Read-only Snapshot 19.08.2026:

- 166 veröffentlichte Betriebe im Region-1-Scope;
- 147 mit irgendeinem direkten First-Party-Kontaktweg;
- 166/166 weiterhin send-locked;
- 0 send-authorized;
- 22 master-reviewed;
- 15 master-ready;
- 15 gleichzeitig master-reviewed + master-ready;
- 40 Priority-A mit Kontaktweg und Lock;
- 15 Priority-A + master-reviewed;
- 10 bereits mit Founding Rank/Wave;
- 24 mit bevorzugter Outreach-Sprache.

Diese Zahlen enthalten **keine Kontaktwerte**. Sie sind reine aggregierte Read-only-Readiness-Evidence.

## Wave A — noch nicht eingefroren

Internes Testziel: **18 Betriebe, 6 pro Preisarm**. Das ist `INTERNAL_EXPERIMENT_SIZE_NOT_MARKET_STANDARD`.

Heute erfüllen nur 15 Betriebe den strengen `master_reviewed + master_ready`-Status. Deshalb bleibt die Kohorte **COHORT_NOT_FROZEN**. Mindestens drei weitere Betriebe müssen zuerst denselben Qualitätsstand erreichen; außerdem müssen die G1-/Contact-Prerequisites erfüllt sein.

Eligibility verlangt mindestens:

- published im vollständigen Region-1-Scope;
- direkter First-Party-Kontaktweg;
- master-reviewed;
- master-ready;
- bis zur Freigabe send-lock weiterhin aktiv;
- bis zur Freigabe `send_authorized_at` leer;
- kein vorheriger Kontakt im Experiment;
- Business Identity unmittelbar vor Kohorten-Freeze erneut geprüft.

Es werden **keine Business-IDs oder PII in diesem öffentlichen Contract eingefroren**. Die konkrete Kohortenliste darf erst nach Release in einem dafür geeigneten, zugriffsbeschränkten Evidence-Pfad eingefroren werden.

## Preisexperiment

HOY Founding Business wird als Monats-Test mit drei Hypothesen vorbereitet:

- 29 EUR / Monat;
- 39 EUR / Monat;
- 59 EUR / Monat.

Pro Betrieb wird exakt **ein** Preis sichtbar. Die drei Preise werden nicht als Auswahlmenü präsentiert. Die Zuteilung wird nach Kohorten-Freeze ausgewogen/randomisiert, vor dem ersten Outreach eingefroren und auditierbar gemacht.

Die Preiswerte bleiben `WORKING_HYPOTHESIS_NOT_MARKET_VALIDATED`.

Das bestehende HOY Highlight zu 29 EUR pro Event bleibt ein separates One-off-Produkt und **zählt niemals als MRR**.

Es gibt keine Garantie für Ranking, Impressionen, Klicks, Reservierungen oder Umsatz.

## Paid-Proof-Ladder

Nicht als Paid Proof zählen:

- Interesse;
- LOI;
- Acceptance/Unterschrift;
- Rechnung;
- kostenloser Pilot;
- Founder-/Related-Party-Zahlung;
- vollständig erstattete Erstzahlung.

Erst eine **reconciled settled external payment** erzeugt `Paying Business`. Eine zweite separate eingegangene Zahlung ist Renewal. Paid Retention wird erst nach mindestens 90 Tagen unter der vorab eingefrorenen Definition berichtet.

## Funnel

`eligible → authorized_contacted → offer_delivered → accepted → invoice_issued_not_paid → settled_payment → renewal → paid_retained_90d`

Damit kann eine Rechnung nie versehentlich als Umsatz-/Paid-Proof hochgestuft werden.

## Ablehnungsgründe

Für Käufer-/Experimentauswertung werden nur strukturierte Codes verwendet:

`NO_NEED`, `PRICE_TOO_HIGH`, `TIMING`, `NO_TRUST`, `PREFERS_FREE`, `NO_AUTHORITY`, `PRODUCT_GAP`, `OTHER_STRUCTURED`.

Freitext, persönliche Notizen, Namen, Telefonnummern, E-Mail-Adressen oder sonstige PII gehören **nicht** in buyer-facing/public Summaries.

## Buyer-relevante Auswertung

Vordefiniert werden:

- eligible cohort n;
- authorized contacted n;
- offer delivery rate;
- settled-payment conversion gesamt und je Preisarm;
- externe Paying Businesses;
- recurring MRR ohne One-off Highlights;
- Renewal Rate;
- 90d Paid Retention;
- strukturierte Objection-Verteilung;
- First-Party Merchant Confirmation Coverage;
- Merchant-confirmed Outcomes getrennt von bloßen Intent-Signalen.

ACQ-04 bleibt bindend: Klick, Route, Call oder Reservation-Handoff sind **keine bestätigte Transaktion**.

## Sicherheits-/Release-Grenzen

Dieses Paket kann nicht:

- Contact Freeze aufheben;
- Send Locks entfernen;
- Outreach auslösen;
- Business Terms aktivieren;
- Billing live schalten;
- Production Analytics aktivieren;
- Production DML/DDL ausführen;
- ein Merge oder einen Käuferkontakt autorisieren.

Der Start erfolgt erst nach einer separaten, ausdrücklich dokumentierten Release-Entscheidung.
