# HOY Auftragsverarbeitungsvereinbarung (Art. 28 DSGVO) v1.0 — DE

**Status:** DRAFT / NOT YET ACTIVE  
**Version:** 1.0  
**Draft date:** 2026-08-18

**Verantwortlicher (Business):** `[TBD PER CONTRACT]`  
**Auftragsverarbeiter (HOY):** `[HOY LEGAL ENTITY — TBD BEFORE ACTIVATION]`  
**Gegenstand / Hauptvertrag:** `[TBD]`

> Dieser Entwurf ist nur für Verarbeitung gedacht, bei der HOY tatsächlich personenbezogene Daten **im Auftrag und nach dokumentierten Weisungen** eines Business verarbeitet. Er darf nicht verwendet werden, um eine tatsächlich eigenverantwortliche HOY-Verarbeitung künstlich als Auftragsverarbeitung zu etikettieren.

## 1. Rollen-Gate

Vor Unterzeichnung muss die jeweilige Verarbeitung in der HOY Controller/Processor Matrix als `PROCESSOR_CONFIRMED` klassifiziert sein.

Nicht automatisch Auftragsverarbeitung sind insbesondere:

- HOYs eigene Produktanalytics;
- HOYs eigene Sicherheits-/Auditverarbeitung;
- HOYs eigene Business-/Accountverwaltung;
- HOYs eigenes Matching/Ranking für eigene Produktzwecke;
- HOYs eigene Vertrags-/Rechtebeweise;
- eigene Vertriebs-/Prospect-Verarbeitung.

## 2. Gegenstand, Dauer, Art und Zweck

Für jeden konkreten DPA werden in Anlage A festgelegt:

- betroffene HOY-Funktion;
- Gegenstand und Dauer;
- Art und Zweck der Verarbeitung;
- Kategorien personenbezogener Daten;
- Kategorien betroffener Personen;
- dokumentierte Weisungen des Verantwortlichen;
- Lösch-/Rückgabemechanismus.

Ohne ausgefüllte Anlage A darf der DPA nicht aktiviert werden.

## 3. Weisungsbindung

HOY verarbeitet die in Anlage A erfassten personenbezogenen Daten ausschließlich auf dokumentierte Weisung des Verantwortlichen, soweit keine anwendbare gesetzliche Pflicht etwas anderes verlangt. In einem solchen Fall informiert HOY den Verantwortlichen vor der Verarbeitung, soweit dies rechtlich zulässig ist.

Hält HOY eine Weisung für datenschutzrechtswidrig, wird die Ausführung bis zur Klärung ausgesetzt, soweit dies rechtlich und technisch möglich ist.

## 4. Vertraulichkeit

HOY stellt sicher, dass Personen, die zur Verarbeitung berechtigt sind, einer angemessenen Vertraulichkeitsverpflichtung unterliegen und nur im erforderlichen Umfang Zugriff erhalten.

## 5. Technische und organisatorische Maßnahmen

Die jeweils freigegebenen TOMs werden in Anlage B versioniert. Mindestbereiche:

- Zugriffskontrolle / Least Privilege;
- Authentifizierung;
- RLS und serverseitige Autorisierung;
- Verschlüsselung bei Übertragung;
- Secrets-/Key-Management;
- Backup/Recovery;
- Logging/Audit;
- Schwachstellen-/Patch-Prozess;
- Incident-Response;
- Wiederherstellbarkeit;
- regelmäßige Überprüfung der Maßnahmen.

Die TOM-Anlage ist risikobasiert und wird bei wesentlichen Änderungen aktualisiert.

## 6. Unterauftragsverarbeiter

HOY setzt Unterauftragsverarbeiter nur nach der im finalen Vertrag festgelegten allgemeinen oder spezifischen Genehmigung ein.

Vor Aktivierung müssen mindestens dokumentiert sein:

- aktueller Subprocessor;
- Leistung;
- Standort/Region;
- Datenkategorien;
- DPA/Vertragsstatus;
- Drittlandtransfermechanismus soweit relevant;
- Benachrichtigungs-/Widerspruchsprozess bei Änderungen.

Der aktuelle technische Kernanbieter Supabase ist in der Vendor-Matrix zu führen; die finale Art.-28-/Transfer-Evidenz muss vor produktiver Processor-Verarbeitung im Data Room liegen.

## 7. Unterstützung bei Betroffenenrechten

HOY unterstützt den Verantwortlichen unter Berücksichtigung der Art der Verarbeitung durch geeignete technische und organisatorische Maßnahmen bei Anfragen zu Betroffenenrechten.

HOY beantwortet eine Betroffenenanfrage nicht eigenmächtig im Namen des Business, soweit HOY hierfür nicht ausdrücklich zuständig oder gesetzlich verpflichtet ist.

## 8. Unterstützung bei Sicherheit, Breaches und DPIA

HOY unterstützt den Verantwortlichen angemessen bei:

- Sicherheit der Verarbeitung;
- Bewertung und Dokumentation von Datenschutzverletzungen;
- erforderlichen Meldungen/Benachrichtigungen;
- Datenschutz-Folgenabschätzungen;
- vorherigen Konsultationen, soweit relevant.

HOY führt ein internes Incident-/Evidence-Register.

## 9. Datenschutzverletzungen

HOY informiert den Verantwortlichen **unverzüglich nach Bekanntwerden** einer Datenschutzverletzung im processor-relevanten Scope und stellt die verfügbaren Informationen strukturiert bereit.

Der finale Vertrag kann eine interne Zielzeit definieren, darf jedoch die gesetzliche Pflicht nicht durch unrealistische oder unklare Formulierungen ersetzen.

## 10. Löschung / Rückgabe

Nach Ende der Processor-Leistung löscht oder gibt HOY personenbezogene Daten nach Wahl des Verantwortlichen zurück, soweit keine gesetzliche Aufbewahrungspflicht entgegensteht.

Backup-/Recovery-Kopien werden nach dem dokumentierten Backup-Lifecycle ausgerollt und bis dahin gesperrt bzw. nicht produktiv weiterverarbeitet.

## 11. Nachweise und Audits

HOY stellt die zur Demonstration der Art.-28-Einhaltung erforderlichen Informationen bereit und ermöglicht angemessene Prüfungen unter Schutz von:

- Sicherheit anderer Kunden;
- Geschäftsgeheimnissen;
- Systemintegrität;
- personenbezogenen Daten Dritter.

Zertifizierungen/Reports können verwendet werden, soweit sie den konkreten Prüfzweck angemessen abdecken.

## 12. Internationale Transfers

HOY und seine Unterauftragsverarbeiter dürfen personenbezogene Daten außerhalb des EWR nur auf einer gültigen Grundlage nach Kapitel V DSGVO verarbeiten/übermitteln.

Vor Aktivierung muss pro relevantem Vendor/Transfer dokumentiert sein:

- Zielland;
- Rolle;
- Angemessenheitsbeschluss oder andere Transfergrundlage;
- ggf. SCC-Modul;
- erforderliche Transfer-Risikoprüfung und zusätzliche Maßnahmen.

## 13. Haftung / Vorrang

Haftung, Laufzeit und sonstige kommerzielle Regelungen werden im Hauptvertrag bzw. finalen DPA juristisch abgestimmt. Zwingendes Datenschutzrecht bleibt unberührt.

## Anlage A — Processing Description

**Status:** MUST BE COMPLETED PER USE CASE

| Feld | Wert |
|---|---|
| HOY-Funktion | `[TBD]` |
| Gegenstand | `[TBD]` |
| Dauer | `[TBD]` |
| Zweck | `[TBD]` |
| Datenkategorien | `[TBD]` |
| Betroffene Personen | `[TBD]` |
| Weisungen | `[TBD]` |
| Retention/Löschung | `[TBD]` |
| Empfänger/Subprocessor | `[TBD]` |
| Transfers | `[TBD]` |

## Anlage B — TOMs

**Status:** DRAFT / LINK TO CURRENT TOM REGISTER BEFORE ACTIVATION

## Anlage C — Subprocessors

**Status:** DRAFT / MUST LINK TO CURRENT VENDOR REGISTER

## Aktivierungsblocker

- [ ] definitive HOY legal entity;
- [ ] konkreter Processor-Use-Case bestätigt;
- [ ] Anlage A vollständig;
- [ ] TOMs final;
- [ ] Subprocessor-/Transfer-Evidenz vollständig;
- [ ] Lösch-/Backup-Mechanik geprüft;
- [ ] deutsch/spanisch juristisch geprüft soweit Region #001 betroffen;
- [ ] finaler SHA-256 und Versionsnachweis;
- [ ] Unterzeichnung/elektronischer Acceptance-Prozess.

**DO NOT ACTIVATE** as a generic blanket DPA.