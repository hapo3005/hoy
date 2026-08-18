# HOY Datenschutzhinweise v1.0 — DE

**Status:** DRAFT / NOT YET ACTIVE  
**Version:** 1.0  
**Draft date:** 2026-08-18  
**Verantwortlicher:** `[HOY LEGAL ENTITY — TBD BEFORE ACTIVATION]`  
**Anschrift:** `[TBD]`  
**Privacy-Kontakt:** `[TBD]`  
**DPO:** `[nur falls gesetzlich erforderlich / freiwillig benannt — TBD]`

> Diese Fassung ist ein Investor-/Produkt-Ready Entwurf, keine aktiv geschaltete Datenschutzerklärung. Sie darf erst veröffentlicht/aktiviert werden, wenn Rechtsträger, Kontaktdaten, Rechtsgrundlagen, Empfänger/Unterauftragsverarbeiter, Speicherfristen, internationale Transfers, Cookie-/Analytics-Entscheidung und juristische Prüfung vollständig sind.

## 1. Geltungsbereich

Diese Hinweise sollen künftig die Verarbeitung personenbezogener Daten im Zusammenhang mit HOY abdecken, insbesondere für:

- Nutzer und Besucher der HOY-Produkte;
- Vertreter von Restaurants, Unternehmen und Dienstleistern;
- Betreiber-Accounts, Claims und Verifikationen;
- Business-Terms-Annahmen und Business-Confirmed-Daten;
- berufliche Ansprechpartner in vorbereiteten Business-Pipelines;
- Support-/Sicherheits-/Auditvorgänge;
- künftige HOY Works Kunden-/Auftragsprozesse.

## 2. Grundsätze

HOY behandelt personenbezogene Daten nicht als „Eigentum“ oder frei verkäufliche Ware. Jede Verarbeitung benötigt einen konkreten Zweck, eine zulässige Rechtsgrundlage, angemessene Datenminimierung, Speicherbegrenzung, Sicherheit und einen dokumentierten Rollenstatus.

## 3. Verarbeitungskategorien

### 3.1 Produkt-/Nutzungsanalyse

**Derzeitiger Gastro-Bestand:** pseudonyme `anonymous_id`- und `session_id`-Kennungen plus Ereignistyp, Zeitpunkt und begrenzte Produktmetadaten wie Sprache, View, Surface und Client-Version.

**Zweckkandidat:** Produktqualität, Fehleranalyse, Nutzungsmuster und Entscheidungsqualität.

**Rollenstatus:** HOY als Verantwortlicher.

**Rechtsgrundlage:** `REVIEW_REQUIRED` vor öffentlichem Launch. Die bestehende technische Erfassung darf nicht allein deshalb als einwilligungsfrei eingestuft werden, weil keine Klarnamen gespeichert werden. Cookie-/Terminalzugriff und personenbezogene/pseudonyme Analytics sind separat zu prüfen.

**Aktuelle Claim-Grenze:** Historische Pre-2.45-Events dürfen nicht als belastbare Nutzertraktion verkauft werden.

### 3.2 Business-/Operator-Accounts

Daten können insbesondere umfassen:

- E-Mail-Adresse / Authentifizierungsdaten;
- Benutzer-ID;
- Rollen und Memberships;
- Claim-/Verifikationsangaben;
- Operator-Aktionen;
- Vertragsannahmen und Bestätigungsnachweise.

**Zwecke:** Accountbetrieb, Authentifizierung, Berechtigungen, Business-Verifikation, Vertragsdurchführung und Nachweisführung.

**Rechtsgrundlage:** vor Aktivierung pro Vorgang final zuzuordnen; typischerweise Vertrag/vorvertragliche Maßnahmen und/oder berechtigte Interessen, soweit tatsächlich einschlägig.

### 3.3 Business-Terms-Acceptance / Business Confirmation

HOY speichert künftig den Nachweis, welche konkrete Terms-Version ein autorisierter Vertreter angenommen hat und welchen konkreten Daten-Snapshot er bestätigt hat.

Dazu gehören u. a. User-ID, Business-ID, Version/Hash, Zeitstempel, Authority-Rolle, Bestätigungsflags und Payload-Hash.

**Zweck:** Vertrags- und Rechtebeweis, Datenqualität, Auditierbarkeit, Streit-/Missbrauchsprävention.

### 3.4 Berufliche Business-Kontakte / Pre-Sales-Research

Der aktuelle Gastro-Datenbestand enthält in der internen Sales-Pipeline bei einzelnen Betrieben berufliche Kontaktinformationen wie Ansprechpartner, E-Mail, Telefon, Instagram oder Website.

**Rollenstatus:** HOY als Verantwortlicher.

**Speicher-/Research-Basis:** berufliche Kontaktdaten können unter den Voraussetzungen des anwendbaren Rechts auf berechtigte Interessen gestützt sein; insbesondere bei Spanien ist die Verarbeitung beruflicher Kontaktdaten zur Beziehung mit der betreffenden juristischen Person gesondert von der Zulässigkeit elektronischer Werbung zu beurteilen.

**Wichtiger Gate:** Das Vorhandensein einer beruflichen E-Mail-Adresse erlaubt nicht automatisch unaufgeforderte Werbe-E-Mails oder vergleichbare elektronische Nachrichten. Der bestehende Outreach-Lock bleibt bis zur gesonderten Marketing-/LSSI-Freigabe aktiv.

### 3.5 Audit- und Sicherheitslogs

HOY kann Benutzer-/Actor-IDs, Aktionstypen, Objektbezüge, Vorher-/Nachher-Metadaten und Zeitstempel speichern.

**Zwecke:** Sicherheit, Missbrauchsabwehr, Integrität, Nachweis und Fehleranalyse.

**Rechtsgrundlage:** final zu prüfen; berechtigte Interessen und gesetzliche Nachweispflichten können je nach Vorgang einschlägig sein.

### 3.6 Medien und Content

Bei Uploads können User-ID, Asset-Pfad, Rechtebasis, Attribution und Provenienz gespeichert werden.

**Zweck:** Veröffentlichung, Moderation, Rechtebeweis und Nachvollziehbarkeit.

### 3.7 HOY Works — künftige Auftragsdaten

Das Works-Schema sieht u. a. `customer_id`, Standorttext, Koordinaten, Gemeinde/Ort, Sprache und Freitextbeschreibung für Work Requests vor.

**Aktueller Stand:** noch keine live gespeicherten Work Requests/Accounts im auditierten Projekt.

**Gate:** Vor Aktivierung müssen Rechtsgrundlage, Informationspflicht, Retention, Standortminimierung, Empfänger-/Provider-Weitergabe, Zugriff, Löschung und ggf. Processor-/Joint-Controller-Rollen abschließend definiert sein.

## 4. Empfänger / Dienstleister

Aktuell technisch zentral:

- **Supabase** für Datenbank, Auth, Storage, APIs und Edge Functions;
- weitere Infrastruktur-/Serviceanbieter nur nach Aufnahme in das Vendor-/Transfer-Register.

GitHub dient derzeit primär als Entwicklungs-/Repository-Plattform und ist nicht automatisch Empfänger von HOY-Endnutzerdaten.

Vor Aktivierung wird für jeden Dienstleister dokumentiert:

- Rolle (Processor/Controller/sonstige);
- DPA/AVV-Status;
- Unterauftragsverarbeiter;
- Datenregion;
- internationale Transfers;
- Lösch-/Export-/Exit-Regeln.

## 5. Internationale Datenübermittlungen

Der aktuelle HOY-La-Manga-Datenbankstand läuft in `eu-central-1` (Frankfurt). Das allein beweist jedoch nicht, dass jede Verarbeitung ausschließlich im EWR stattfindet: insbesondere Edge Functions, Support-/Subprocessor-Zugriffe und weitere Dienste müssen separat bewertet werden.

Drittlandübermittlungen dürfen nur bei einer gültigen Grundlage nach Kapitel V DSGVO erfolgen (z. B. Angemessenheitsbeschluss oder geeignete Garantien/SCCs, soweit erforderlich).

## 6. Speicherbegrenzung

Keine Kategorie erhält allein aus Bequemlichkeit eine unbegrenzte Aufbewahrung.

Die verbindlichen Fristen werden im `Privacy Retention Register` gepflegt. Bis zur finalen juristischen Freigabe sind nicht abschließend festgelegte Fristen `REVIEW_REQUIRED` und dürfen nicht als endgültige Policy dargestellt werden.

Besonders zu trennen sind:

- aktive Vertrags-/Accountdaten;
- Nachweis-/Auditdaten;
- Pre-Sales-Kontaktdaten;
- Produktanalytics;
- Rechte-/Terms-Nachweise;
- gelöschte oder widerrufene Accounts;
- gesetzlich erforderliche Aufbewahrung.

## 7. Betroffenenrechte

Die finale Datenschutzerklärung wird die anwendbaren Rechte nach DSGVO abbilden, insbesondere Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit soweit einschlägig, Widerspruch sowie Widerruf einer Einwilligung für die Zukunft.

HOY baut dafür ein internes Request-/Evidence-Register auf. Die konkrete Kontaktadresse und Identitätsprüfung werden vor Aktivierung festgelegt.

## 8. Automatisierte Entscheidungen / Profiling

HOY Matching/Ranking darf nicht pauschal als rechtlich relevante automatisierte Einzelentscheidung dargestellt werden. Vor Einsatz von Verarbeitung, die rechtliche Wirkung oder ähnlich erhebliche Auswirkungen für natürliche Personen erzeugen könnte, ist eine gesonderte Art.-22-/DPIA-Prüfung erforderlich.

## 9. Sicherheit

HOY verfolgt risikobasierte technische und organisatorische Maßnahmen, u. a.:

- RLS/Least Privilege;
- private Evidenz-/Governance-Tabellen;
- getrennte Rollen/Authentifizierung;
- versionierte Migrationen;
- Security-Advisor-/QA-Gates;
- Audit-/Provenienz-Nachweise;
- Secrets nicht im Client;
- Backup-/Recovery- und Incident-Prozesse als DD-P0.

## 10. Cookies / ähnliche Technologien

Vor öffentlichem Launch wird technisch dokumentiert, welche Client-Kennungen oder Speichermechanismen verwendet werden. Nicht notwendige Cookies/ähnliche Technologien und entsprechende Analytics dürfen nur nach der dafür erforderlichen Einwilligungs-/Transparenzlogik aktiviert werden.

## 11. Änderungen

Jede aktive Privacy-Version erhält eine unveränderbare Versionskennung und einen finalen Dokument-Hash. Wesentliche Änderungen werden versioniert; alte Fassungen bleiben für Nachweiszwecke archiviert.

## 12. Aktivierungsblocker

Diese Fassung bleibt DRAFT bis mindestens:

- [ ] endgültiger HOY-Rechtsträger;
- [ ] Anschrift + Privacy-Kontakt;
- [ ] Controller/Processor-Matrix freigegeben;
- [ ] Rechtsgrundlage je Processing Activity freigegeben;
- [ ] Retention je Aktivität freigegeben;
- [ ] Empfänger/Subprocessor-Register vollständig;
- [ ] internationale Transferprüfung abgeschlossen;
- [ ] Cookie-/Analytics-Consent-Architektur entschieden und umgesetzt;
- [ ] Betroffenenrechtsprozess + Kontaktkanal umgesetzt;
- [ ] DE-/ES-Fassung juristisch geprüft;
- [ ] finale SHA-256-Hashes hinterlegt;
- [ ] Privacy-Version mit Business Terms technisch verknüpft.

**DO NOT ACTIVATE** until all P0 blockers are complete.