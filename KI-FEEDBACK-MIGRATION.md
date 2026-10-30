# Kriterienbasiertes Feedback: Umstellung und neue Aufgaben

Stand: 30.10.2026. Diese Datei dokumentiert den **lokalen Quellstand**.
Ein fertiger Build belegt keine Veröffentlichung und keine zuverlässige
fachliche Bewertung durch das tatsächlich eingesetzte Modell.

Die verbindlichen Grundregeln stehen in `manifest-allgemein.txt`, Abschnitt
0.1; Fachmanifeste ergänzen sie. Diese Datei ist die zentrale technische
Checkliste und Bestandsübersicht. Bei jeder Umstellung aktualisieren.

## Geltungsbereich und Ziel

Alle neuen Beschreibe- und Programmieraufgaben erhalten kriterienbasiertes
automatisiertes Feedback. Bestehende Aufgaben werden nach und nach bei einer
gezielten Überarbeitung ihrer Bewertung umgestellt. Kein pauschaler Wechsel
aller bestehenden Aufgaben und keine neue KI-Pipeline.

Die Gesamtmigration vom 29.10.2026 wurde ausdrücklich beauftragt. Ihre
Ausgangsliste und Prüfung sind unten verlinkt; der Auftrag ändert nicht die
allgemeine Regel für spätere, lediglich benachbarte Aufgaben.

Vorhandene deterministische Prüfer, etwa für SQL, Zahlen oder kompilierbaren
Code in einer bestehenden Laufzeit, weiterverwenden und ihre Einzelprüfungen
den Kriterien zuordnen. Die neue Vorgabe verlangt keinen zusätzlichen
Modellaufruf für bereits zuverlässig prüfbare Aufgaben.

Das Verfahren für KI-Aufgaben:

1. Fachlich konkrete Kriterien mit je einem Punkt festlegen.
2. Das Modell beurteilt **jedes Kriterium einzeln** mit vorgegebenem Status
   und wörtlichen Belegstellen aus der aktuellen Antwort bzw. dem Code.
3. Der Server validiert Struktur, Status und das Vorkommen der Belege.
4. Der Server zählt erfüllte Kriterien und wählt einen hinterlegten Hinweis
   zum ersten offenen Kriterium. Spätere erfüllte Kriterien zählen sofort.
5. Die Oberfläche zeigt Punkte und genau diesen nächsten Schritt. Bei voller
   Punktzahl lautet die Rückmeldung „Sehr gut, alles richtig“.

Nur die sichtbaren Hinweise auf einen zu begrenzen ist eine **Teilumstellung**.
Freie Modellpunkte und freie Modellprosa sind noch kein Kriterienvertrag.
Die Belegkontrolle verhindert erfundene Zitate; sie beweist nicht, dass das
Modell die Bedeutung der vorhandenen Aussage richtig beurteilt hat.

## Vollständig konfigurierte Aufgaben

Lokaler Stand: **84 von 84 registrierten Aufgaben** verwenden den vollständigen Kriterienvertrag. Noch offen: **0**.

Die vollständige [Ausgangsliste der 79 offenen Aufgaben](docs/ki-feedback-offene-aufgaben-2026-10-29.md) dokumentiert den Bestand vor der ausdrücklich beauftragten Gesamtmigration. Die [Spezifikation](docs/ki-feedback-migration-plan.md) enthält Kriterien, feste Hinweise und fachliche Vergleichsfälle; der [Prüfbericht](docs/ki-feedback-migration-pruefung.md) unterscheidet lokale Prüfungen und ausstehende Online-Nachweise.

| Aufgaben-ID | Modul / Teilaufgabe | Kriterien / Punkte |
| --- | --- | --- |
| `ph11-photovoltaik-schaltplan-beschreibung` | Physik Klasse 11 – Photovoltaik: Schaltplan beschreiben | 4 |
| `b` | Klasse 9 Aufgabe b: Programmtext analysieren | 5 |
| `c` | Klasse 9 Aufgabe c: Zahlen variieren | 5 |
| `2b` | Klasse 9 Aufgabe 2b: Klassen analysieren und veraendern | 5 |
| `1a` | Klasse 10 Aufgabe 1a: Programmzeilen erklaeren | 5 |
| `1b` | Klasse 10 Aufgabe 1b: Parameterwert Ball(100) | 5 |
| `1c` | Klasse 10 Aufgabe 1c: Klasse und Objekt unterscheiden | 5 |
| `1f` | Klasse 10 Aufgabe 1f: extends Actor erklaeren | 5 |
| `10-2a` | Klasse 10 Aufgabe 2a: Ziegelreihe bis zur Wand | 6 |
| `10-2b` | Klasse 10 Aufgabe 2b: Ziegel am Rand entlang | 6 |
| `10-2c` | Klasse 10 Aufgabe 2c: Ziegelmauer mit Hoehe 4 | 6 |
| `10-3a` | Klasse 10 Aufgabe 3a: Roboter dudu in einer 12×12-Welt erzeugen | 3 |
| `10-3b` | Klasse 10 Aufgabe 3b: Quader aus Ziegeln (3 × 5 × 4) | 6 |
| `10-4a` | Klasse 10 Aufgabe 4a: Funktionsweise des Hauptprogramms beschreiben | 4 |
| `10-4c` | Klasse 10 Aufgabe 4c: Polymorphie im Programm finden und Befehle nennen | 5 |
| `10-5a` | Klasse 10 Aufgabe 5a: Klassendiagramm Tiere in Java umsetzen | 6 |
| `10-5b` | Klasse 10 Aufgabe 5b: Testprogramm mit polymorphem Aufruf | 5 |
| `10-5c` | Klasse 10 Aufgabe 5c (Bonus): eigene Unterklassen von Tier und Hund | 4 |
| `10-6b` | Klasse 10 Aufgabe 6b: Datentypen der Attribute von Grafik beschreiben | 4 |
| `10-6e` | Klasse 10 Aufgabe 6e: kiste.rotate(45) mit Fachbegriffen beschreiben | 5 |
| `11-3a-f` | Klasse 11 Aufgabe 3a: Algorithmus fuer einen Entscheidungsbaum formulieren | 5 |
| `inf11-a3a-quiz-informationsgewinn-beschreibung` | Informatik Klasse 11 – Test zu Aufgabe 3a: Informationsgewinn eines Splits bestimmen | 4 |
| `inf11-a3a-quiz-attributwahl-beschreibung` | Informatik Klasse 11 – Test zu Aufgabe 3a: Auswahl des Attributs für einen Knoten erklären | 3 |
| `inf11-a3a-quiz-vorgehen-beschreibung` | Informatik Klasse 11 – Test zu Aufgabe 3a: Weiteres Vorgehen nach dem ersten Knoten beschreiben | 4 |
| `11-4-1` | Klasse 11 Aufgabe 4.1: Entscheidungsbaum der Tiefe 1 begruenden | 3 |
| `11-4-2` | Klasse 11 Aufgabe 4.2: Trainingsfehler und Testgenauigkeit vergleichen | 3 |
| `11-4-3` | Klasse 11 Aufgabe 4.3: Gleiche Genauigkeit und unterschiedliche Fehler | 3 |
| `11-6-klassifizieren` | Klasse 11 Aufgabe 6.2: punktKlassifizieren erklären | 4 |
| `11-6-einfach-summe` | Klasse 11 Aufgabe 6.2 einfach: gewichtete Summe | 3 |
| `11-6-einfach-ausgabe` | Klasse 11 Aufgabe 6.2 einfach: Ausgabe | 3 |
| `11-6-einfach-anpassung` | Klasse 11 Aufgabe 6.2 einfach: Parameter anpassen | 5 |
| `11-6-schwer-trainieren` | Klasse 11 Aufgabe 6.2 schwer: trainieren | 6 |
| `11-7-1` | Klasse 11 Aufgabe 7: KNN am Schulshirt-Beispiel erläutern | 4 |
| `11-8-1` | Klasse 11 Aufgabe 8: Wahl von k mit Validierungsdaten begründen | 3 |
| `inf11-cod-a1-ascii-unicode` | Informatik Klasse 11 – Codierung Aufgabe 1: ASCII und Unicode vergleichen | 5 |
| `11-5-1` | Klasse 11 Aufgabe 5.2: Lernen eines Perzeptrons erklären | 4 |
| `ph11-kreisbewegungen-bewegung-diagramm-beschreibung` | Physik Klasse 11 – Aufgabe 6a: Bewegung in Diagrammen beschreiben | 5 |
| `ph11-kreisbewegungen-kraeftegleichgewicht-beschreibung` | Physik Klasse 11 – Aufgabe 5: Kräfte vergleichen und begründen | 4 |
| `ph11-wdh2-quiz-crashtest-beschreibung` | Physik Klasse 11 – Test zu Wiederholung 2: Kräfte beim Crashtest beschreiben | 4 |
| `ph11-a3-quiz-karussell-beschreibung` | Physik Klasse 11 – Test zu Aufgabe 3: Winkel- und Bahngeschwindigkeit auf dem Karussell beschreiben | 4 |
| `ph11-a3-quiz-ursache-beschreibung` | Physik Klasse 11 – Test zu Aufgabe 3: Ursache der Kreisbewegung beschreiben | 3 |
| `ph11-a3-quiz-schnur-beschreibung` | Physik Klasse 11 – Test zu Aufgabe 3: Bewegung nach dem Reißen der Schnur beschreiben | 3 |
| `ph11-a4-quiz-hammerwurf-beschreibung` | Physik Klasse 11 – Test zu Aufgabe 4: Kräfte und Bewegung beim Hammerwurf beschreiben | 4 |
| `ph11-a4-quiz-radius-beschreibung` | Physik Klasse 11 – Test zu Aufgabe 4: Abhängigkeit der Zentripetalkraft vom Radius beschreiben | 4 |
| `ph11-a4-quiz-seil-beschreibung` | Physik Klasse 11 – Test zu Aufgabe 4: Kräftegleichgewicht oder Wechselwirkung beim Hammerwurf begründen | 3 |
| `ph11-a4-und-experiment-quiz-experiment-beschreibung` | Physik Klasse 11 – Aufgabe 4 und Experiment: Das phyphox-Experiment | 4 |
| `ph11-a4-und-experiment-quiz-kraft-beschreibung` | Physik Klasse 11 – Aufgabe 4 und Experiment: Von der Beschleunigung zur Kraft | 3 |
| `ph11-a4-und-experiment-quiz-diagramme-beschreibung` | Physik Klasse 11 – Aufgabe 4 und Experiment: Messdiagramme begründen | 4 |
| `ph11-a5-quiz-kurve-beschreibung` | Physik Klasse 11 – Quiz zu Aufgabe 5: Auto und Hammerwurf | 4 |
| `ph11-a5-quiz-naesse-beschreibung` | Physik Klasse 11 – Quiz zu Aufgabe 5: Dieselbe Kurve bei Nässe | 4 |
| `ph11-a5-quiz-masse-beschreibung` | Physik Klasse 11 – Quiz zu Aufgabe 5: LKW und kleines Auto | 4 |
| `ph11-kreisbewegungen-zentripetalkraft-beschreibung` | Physik Klasse 11 – Kreisbewegung: Geschwindigkeitsvektor und Zentripetalkraft beschreiben | 5 |
| `ph11-zentripetalkraft-herleitung-dv` | Physik Klasse 11 – Zentripetalkraft: Konstruktion von Δv beschreiben | 3 |
| `ph11-zentripetalkraft-herleitung-naeherung` | Physik Klasse 11 – Zentripetalkraft: Näherung Bogen gleich Sehne begründen | 2 |
| `ph11-zentripetalkraft-herleitung-aehnlichkeit` | Physik Klasse 11 – Zentripetalkraft: Ähnlichkeit der Dreiecke begründen | 3 |
| `inf10-db-a9-p2` | Informatik Klasse 10 – Aufgabe 9 P2: Verbundabfrage beschreiben | 5 |
| `inf10-db-a9-p5` | Informatik Klasse 10 – Aufgabe 9 P5: Verbundabfrage beschreiben | 5 |
| `inf10-db-a9-p8` | Informatik Klasse 10 – Aufgabe 9 P8: Verbundabfrage beschreiben | 5 |
| `inf10-db-a9-p11` | Informatik Klasse 10 – Aufgabe 9 P11: Verbundabfrage beschreiben | 5 |
| `sql-b2-3` | Informatik Klasse 10 – SQL Blatt 2 Aufgabe 3: SELECT-Anweisung beschreiben | 3 |
| `inf9-db2-beschreibe-projektion` | Informatik Klasse 9 – Datenbanken Aufgabe 2: Projektion beschreiben | 3 |
| `inf9-db2-beschreibe-sortierung` | Informatik Klasse 9 – Datenbanken Aufgabe 2: Sortierung beschreiben | 3 |
| `inf9-db2-beschreibe-distinct` | Informatik Klasse 9 – Datenbanken Aufgabe 2: DISTINCT beschreiben | 3 |
| `inf9-db2-beschreibe-limit` | Informatik Klasse 9 – Datenbanken Aufgabe 2: LIMIT beschreiben | 3 |
| `inf9-db3-beschreibe-where` | Informatik Klasse 9 – Datenbanken Aufgabe 3: WHERE beschreiben | 3 |
| `sql-b3-1` | Informatik Klasse 10 – SQL Blatt 3 Aufgabe 1: MIN und AS beschreiben | 3 |
| `sql-b3-3` | Informatik Klasse 10 – SQL Blatt 3 Aufgabe 3: ORDER BY und LIMIT beschreiben | 3 |
| `inf10-db-a1-primaerschluessel` | Informatik Klasse 10 – Datenbanken Test zu Aufgabe 1: Notwendigkeit des Primärschlüssels beschreiben | 3 |
| `inf10-db-a2-aufteilung` | Informatik Klasse 10 – Datenbanken Test zu Aufgabe 2: Aufteilung in users und photos begründen | 3 |
| `inf10-a3-quiz-foto-beschreibung` | Informatik Klasse 10 – Test zu Aufgabe 3: Neues Foto zuordnen | 3 |
| `inf10-a3-quiz-regal-beschreibung` | Informatik Klasse 10 – Test zu Aufgabe 3: 1:n-Beziehung im Bibliotheksbeispiel | 3 |
| `inf9-dfd-zylinder-beschreibung` | Informatik Klasse 9 – Aufgabe 5a: Datenflussdiagramm zum Rohrvolumen beschreiben | 3 |
| `ph11-haftreibung-kurvenfahrt-gefahren` | Physik Klasse 11 – Haftreibung in der Kurve: Gefahren und angepasstes Verhalten | 6 |
| `ph11-haftreibung-kurvenfahrt-massenunabhaengigkeit` | Physik Klasse 11 – Haftreibung in der Kurve: Massenunabhängigkeit im Modell | 5 |
| `ph11-kettenkarussell-winkelgeschwindigkeit` | Physik Klasse 11 – Kettenkarussell: Veränderungen bei größerer Winkelgeschwindigkeit | 5 |
| `ph11-kettenkarussell-zwei-sitzreihen` | Physik Klasse 11 – Kettenkarussell: Auslenkung zweier Sitzreihen | 3 |
| `11-6-0-4a-code` | Informatik Klasse 11 Aufgabe 6.0 – 4A Auswahl und Ausgabe | 3 |
| `11-6-0-5a-code` | Informatik Klasse 11 Aufgabe 6.0 – 5A Alter ändern | 4 |
| `11-6-0-5b-code` | Informatik Klasse 11 Aufgabe 6.0 – 5B Alter und Name ändern | 4 |
| `inf9-dfd-fehlersuche-gewinnspiel` | Informatik Klasse 9 – Aufgabe 5b: Fehler im Datenflussdiagramm zum Gewinnspiel finden | 3 |
| `11-6-1-if-code` | Informatik Klasse 11 Aufgabe 6.1 – 1B if-Block im zweiten Fall | 3 |
| `11-6-1-ifelse-code` | Informatik Klasse 11 Aufgabe 6.1 – 2B if/else im zweiten Fall | 3 |
| `11-6-1-elseif-code` | Informatik Klasse 11 Aufgabe 6.1 – 3B zweite else-if-Kette | 3 |
| `11-6-1-for-code` | Informatik Klasse 11 Aufgabe 6.1 – 4B gezählte for-Schleife | 3 |

Alle aufgeführten Aufgaben verwenden `feedbackCriteria` und `maxFeedbackHints: 1`. Die fünf schon vor der Gesamtmigration vollständig konfigurierten Aufgaben behalten ihre Kriterien. Die vier SQL-Beschreibungen in Inf10 DB 9 bewerten weiterhin die Sortierung als fünften Aspekt; bei P11 zählen individuelle Ausgabe und Zählung je Mitglied getrennt, auch wenn derselbe Satz beide erfüllt.

Auf Entscheidung der Lehrkraft haben `b`, `c`, `2b`, `1a`, `1b`, `1c` und `1f` nach ihrer Umstellung je fünf fachliche Punkte; der bisherige Stil-/Beobachtungs-Metapunkt entfällt. Übrige Punktgrenzen bleiben erhalten.

## Offener Bestand und Wiederholungsprüfung

Online-Nachprüfung vom 30.10.2026 für Inf10 DB Aufgabe 9: Der aktive Server
liefert für eine synthetische vollständige P2-Antwort 5/5 Punkte. Die
veröffentlichten Seiten verwenden dagegen noch den alten Client mit fest
erwarteten vier Punkten und zeigen deshalb eine irreführende
Erreichbarkeitsmeldung. Der lokale Client zeigt nun die konkrete technische
Fehlermeldung; der HTML-Einstieg erhält einen neuen Cachebuster.
Zur Veröffentlichung liegt das gezielte Website-Update
`scaleway-functions/dist/inf10-db-aufgabe9-website-fix-20261030.zip` bereit.
Das aktualisierte Gesamtpaket heißt
`scaleway-functions/dist/website-kriterienfeedback-20261030.zip` und enthält
auch die für Aufgabe 9 nötigen bisherigen Abhängigkeiten. Der Servercode
wurde bei dieser Fehlerkorrektur nicht verändert. Ein einzelner erfolgreicher
P2-Aufruf ist kein fachlicher Live-Nachweis für den gesamten Aufgabenbestand.

Die Legacy-Fixture ist leer. Sämtliche 84 registrierten KI-Aufgaben sind lokal auf Einzelkriterien umgestellt, einschließlich der 19 Codeaufgaben. Es gibt keine nur teilweise vorbereitete registrierte Aufgabe mehr.

`scaleway-functions/tests/fixtures/criterion-feedback-legacy.json` ist die maschinenlesbare Restliste. `criterion-feedback-contract.test.js` verhindert neue Aufgaben ohne Kriterien, Rückfälle sowie eine veraltete Kriterientabelle. Der Altbestand darf nur durch weitere Umstellungen schrumpfen.

Nach einem Build lassen sich offene Aufgaben ohne Modellaufruf auflisten:

```powershell
node -e "const {TASKS}=require('./scaleway-functions/evaluation-core'); for(const [id,t] of Object.entries(TASKS)) if(!t.feedbackCriteria) console.log(id,t.title)"
```

## Technische Referenz und Vertrag

Bestehende Komponenten wiederverwenden:

| Datei | Aufgabe |
| --- | --- |
| `scaleway-functions/source/tasks.js` | Kriterien, Rubrik, feste Hinweise und Punkte |
| `scaleway-functions/source/prompt.js` | Gemeinsame Anweisungen für Text und Code |
| `scaleway-functions/scaleway-client.js` | Dynamisches JSON-Schema und Belegprüfung |
| `scaleway-functions/source/rules.js` | Punkte und erster offener Schritt |
| `faecher/informatik/klasse-11/1-Kuenstliche-Intelligenz/perzeptron/ui/semantic-answer.mjs` | Vorhandener Transport und `renderCompactEvaluation` |

Minimaler Konfigurationsausschnitt (um die üblichen Aufgabenfelder ergänzen):

```javascript
maxPoints: 2,
maxFeedbackHints: 1,
expectedAspects: ['Erster fachlicher Aspekt.', 'Zweiter fachlicher Aspekt.'],
rubric: ['Ein Punkt für den ersten Aspekt.', 'Ein Punkt für den zweiten Aspekt.'],
feedbackCriteria: [
  { id: 'first', label: 'Ersten Aspekt erklären', issues: {
    missing: 'Ergänze die noch fehlende Beziehung.',
    wrong_relation: 'Prüfe, welche Größen hier zusammenhängen.'
  } },
  { id: 'second', label: 'Zweiten Aspekt erklären', issues: {
    missing: 'Ergänze die geforderte Auswirkung.'
  } }
],
statusLabels: { correct: 'korrekt', partial: 'teilweise korrekt', incorrect: 'noch nicht korrekt' }
```

Anzahl und Reihenfolge von `expectedAspects`, `rubric` und `feedbackCriteria`
stimmen überein; `maxPoints` entspricht ihrer Anzahl. IDs sind eindeutig.
Jedes Kriterium hat einen `missing`-Hinweis. Weitere `missing_*`-Statuswerte
unterscheiden Teilaspekte; `wrong_*`-Statuswerte konkrete Fehlertypen.
Die Hinweise nennen jeweils eine konkrete Handlung, ohne weitere Kriterien
oder eine vollständige Musterlösung vorwegzunehmen.

Das Modell liefert ausschließlich:

```json
{"criteria":{"first":{"status":"correct","evidence":["Wörtliche Stelle aus der Eingabe."]},"second":{"status":"missing","evidence":[]}}}
```

Für `correct` und `wrong_*` sind vorhandene Belegstellen nötig, bei vollständig
fehlenden Inhalten `missing` mit leerem Array. Keine freien Punkte oder
Feedbackfelder aus dem Modell übernehmen. Die bisherige Ergebnishülle an den
Browser bleibt erhalten; Schema oder generierte Dateien nicht manuell ändern.

Für Programmieraufgaben zusätzlich `responseType: 'code'`, den konkreten
Sprach-/Klassenkontext und gegebenenfalls `codeAnalysisRules` setzen.
Der gemeinsame Prompt unterstützt auch hier den Kriterienvertrag. Belege
sind Codeabschnitte; funktionale Gleichwertigkeit, Erreichbarkeit und spätere
Überschreibungen prüfen. Kommentare und Zeichenketten ersetzen keine
Implementierung. Schülercode wird vom Auswertungsserver nicht ausgeführt.
Syntax-/Typfehler und blockierende Kontrollflussprobleme in der Reihenfolge
der betroffenen Kriterien berücksichtigen; unabhängige richtige Aspekte
weiterhin anerkennen. Hinweise nennen die betroffene Methode oder Operation.

Für Physik bleiben Originalbelege erhalten; der Kriterienprompt erklärt
gleichwertige Größenbezeichnungen. Die bisherige Normalisierung der
Altaufgaben wird dadurch nicht umgestellt. Bestehende Formelrenderer nutzen.

## Checkliste für eine neue Aufgabe oder Umstellung

- [ ] Arbeitsauftrag, Kontext, Hilfen und Musterlösung vollständig lesen.
      Alle verlangten Wirkungen abdecken; bei SQL auch Sortierung und Richtung.
      Bei didaktischen Unklarheiten vor der betroffenen Änderung nachfragen.
- [ ] Kriterien, Punkte, Reihenfolge, erlaubte Varianten und konkrete
      Fehlertypen festlegen. Keine heimlichen Zusatzanforderungen.
- [ ] Konfiguration und gemeinsamen Prompt nutzen; vorhandene lokale Regeln
      auf Konflikte prüfen. Der Kriterienzweig kehrt früh aus der allgemeinen
      Nachbewertung zurück; alte Regeln werden nicht automatisch kombiniert.
- [ ] Clientgrenzen, Punktanzeige, Freischaltung und Musterlösung auf die
      konfigurierten Maximalpunkte anpassen; `maxHints: 1` nutzen.
- [ ] Bei Text-/Codeänderung alte Rückmeldung entfernen und veraltete
      Serverantworten ignorieren. Bei geänderter Rubrik betroffene Freigaben
      und Caches versionieren; Eingaben und andere Fortschritte erhalten.
      Referenz: `assessmentVersion` in Inf10 DB 9. Bei Wiederholungsquizzen
      auch die gespeicherte Erstwertung gesondert prüfen.
- [ ] Positive, unvollständige und falsche Antworten sowie jedes einzelne
      offene Kriterium und gleichwertige Varianten testen. Insbesondere:
      bereits genannte Aspekte, mehrere Kriterien im selben Satz,
      Widersprüche, erfundene Belege, erneute Abgabe; bei Code zusätzlich
      Kontrollfluss, Kommentare, Zeichenketten und gleichwertige Lösungen.
- [ ] Aus der Legacy-Liste entfernen, falls vorhanden; die Tabelle oben
      ergänzen. Bereits konvertierte Aufgaben dürfen nicht zurückfallen.
- [ ] Kern bauen, alle Servertests und betroffene Aufgabentests ausführen;
      Oberfläche, Speicherung und Freischaltung breit und schmal prüfen.
      `git diff --check` und `package.ps1` ausführen.
- [ ] Aktuelle ZIP samt Bereitstellungshinweis übergeben, Website-Dateien
      veröffentlichen lassen. Neue Aufgaben sind erst danach online wirksam.
- [ ] Mit synthetischen Beispielen gegen das tatsächlich eingesetzte Modell
      prüfen, möglichst mehrfach. Mock-Tests getrennt von Live-Ergebnissen
      dokumentieren; erfolgreiche Online-Umstellung nur mit Nachweis angeben.

Für SQL steht `scaleway-functions/tests/sql-description-live.check.js` bereit.
`--dry-run` zeigt den geplanten Umfang ohne Anfrage, `--task AUFGABENKENNUNG`
begrenzt die Auswahl. Erst `--live` löst Modellaufrufe aus. Technische Fehler
sind keine Null-Punkte-Antworten und verbrauchen keinen bewerteten Versuch.
