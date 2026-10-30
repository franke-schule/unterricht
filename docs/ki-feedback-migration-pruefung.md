# Prüfung der Kriterienmigration vom 29.10.2026

## Ausgangsstand

- 84 registrierte KI-Aufgaben, davon 5 vollständig und 79 noch nicht vollständig auf Kriterienfeedback umgestellt.
- 19 der 79 offenen Aufgaben bewerten Programmcode; 24 gehören zu Physik Klasse 11.
- Vollständige Ausgangsliste: [ki-feedback-offene-aufgaben-2026-10-29.md](ki-feedback-offene-aufgaben-2026-10-29.md).
- `node --test scaleway-functions/tests/*.test.js`: vor Änderungen 128/128 erfolgreich.
- Alle vorhandenen Frontend-Tests `faecher/**/*.test.mjs`: vor Änderungen 104/110 erfolgreich.

Bereits vor Änderungen fehlgeschlagene Frontend-Tests:

1. `faecher/informatik/klasse-11/1-Kuenstliche-Intelligenz/knn/tests/task8-contract.test.mjs`
2. `faecher/informatik/klasse-11/2-Codierung-und-Verschluesselung/binaer/tests/task1-contract.test.mjs`
3. `faecher/physik/klasse-11/1-Kreisbewegungen/tests/bewegung-koerpern-config.test.mjs`
4. `faecher/physik/klasse-11/1-Kreisbewegungen/tests/haftreibung-zentripetalkraft-config.test.mjs`
5. `faecher/physik/klasse-11/1-Kreisbewegungen/tests/kraefte-bewegung-config.test.mjs`
6. `faecher/physik/klasse-11/1-Kreisbewegungen/tests/zentripetalkraft-config.test.mjs`

## Lokale Browser- und Integrationsnachweise

Abnahmestand: regelbasierte Vorprüfung **PRUEFUNG_BESTANDEN**;
fachlich-didaktische Endabnahme nach den drei gezielten Korrekturen **APPROVED**.

- Abschließender Serverlauf nach `build-core.js`: **137/137 Tests erfolgreich**, 84 Aufgaben mit Kriterien, kein offener Legacy-Eintrag.
- Vollständiger Frontend-Lauf: **106/112 Tests erfolgreich**. Die sechs Fehlschläge sind dieselben sechs vor Beginn dokumentierten Vorfehler; es gibt keinen zusätzlichen Fehlschlag.
- Statischer Abgleich aller 39 geänderten HTML-Dateien mit dem Ausgangsstand: Inhalte außerhalb der Skripte (abgesehen von Cachebustern) und eingebettete Java-Beispiele unverändert. Eine während der Umsetzung entstandene versehentliche numerische Ersetzung in `aufgabe6.html` wurde vollständig korrigiert; dort blieb nur der beabsichtigte Modul-Cachebuster.

- `criterion-migration-browser.check.js`: neun Quizclients mit alten gespeicherten KI-Bewertungen geladen; die betroffenen KI-Erstwertungen und Freigaben werden zurückgesetzt, Antworten und lokale Erstwertungen bleiben erhalten. Neubewertung, Bearbeitung nach einer Teilwertung, erneutes Laden und breite/schmale Feedbackanzeige geprüft. Zusätzlich prüft die gemeinsame Physikkarte die Verwerfung verspäteter Serverantworten.
- `website-browser.check.js`: zehn IDE-Seiten, 23 simulierte API-Anfragen; Transport, Fehler und erneuter Versuch erfolgreich geprüft.
- `website-pilot.test.js` und `website-code-pilot.test.js`: 14 Prüfungen erfolgreich, einschließlich verspäteter Bewertungen nach Text- oder IDE-Änderung.
- `criterion-feedback-contract.test.js`: vollständiger Bestand von 84 Kriterienaufgaben, leere Legacy-Liste und Dokumentation konsistent; drei Prüfungen erfolgreich.
- Erweiterter Abschlusslauf `criterion-migration-browser.check.js`: **27 simulierte Serveranfragen erfolgreich**, einschließlich eines ungültigen Punktvertrags je Quiz ohne Verbrauch der KI-Erstwertung.
- Bestehender Regressionstest `aufgabe9-criteria-browser.check.cjs`: **26 simulierte Serverprüfungen erfolgreich**, einschließlich selektiver Speicherübernahme und Smartphone-Anzeige.
- Die fünf bereits vor Beginn migrierten Aufgaben wurden mit dem ursprünglichen `TASKS`-Quellstand verglichen: ihre Konfigurationen sind unverändert.
- `package.ps1` erfolgreich: ZIP mit fünf Dateien im Root; ZIP-Prüfsumme und enthaltener Bewertungskern wurden unabhängig mit dem aktuellen Build verglichen.
- Die erste fachliche Endabnahme fand drei gezielte Korrekturen: Hammerwurf-Hinweis auf Textbeschreibung umgestellt, bei Getter-Typfehlern unabhängig richtige Setter/Getter erhalten, verspätete Fehler nach IDE-Änderung verworfen. Alle drei Korrekturen sind umgesetzt; beide Code-Mischfälle und der späte Serverfehler sind durch Regressionstests abgedeckt.

Browserprüfungen verwenden den vorhandenen Playwright-Laufzeitpfad und
Microsoft Edge (`SCW_CHROME_PATH=C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`).
Der Browser musste außerhalb der eingeschränkten Shell-Sandbox gestartet
werden. Externe Modellanfragen werden dabei lokal abgefangen. Es wurden
keine echten KI-Bewertungen angefordert.

## Aussagegrenzen

Fachliche Entscheidung der Lehrkraft: Bei `b`, `c`, `2b`, `1a`, `1b`, `1c`
und `1f` entfällt der bisherige Stil-/Beobachtungs-Metapunkt. Die fünf
fachlichen Kriterien ergeben jeweils höchstens fünf Punkte.

Lokale Tests mit simulierten Modellantworten prüfen Bewertungsvertrag, Belege,
Punkteberechnung, Hinweisreihenfolge, Transport und Oberfläche. Sie belegen keine
semantische Trefferquote des tatsächlich eingesetzten Modells.

Die aktuelle Function-ZIP muss nach Abschluss hochgeladen und die Function
`ki-auswertung` erneut bereitgestellt werden. Auch die geänderten Website-Dateien
müssen veröffentlicht werden. Erst anschließend sind synthetische fachliche
Vergleichsfälle mehrfach gegen das produktive Modell sinnvoll prüfbar.

## Bereitstellung

Aktualisierung vom 30.10.2026: Für die Website das neuere
[Gesamtpaket mit 82 Dateien](../scaleway-functions/dist/website-kriterienfeedback-20261030.zip)
verwenden. Für die gezielte Reparatur von Aufgabe 9 genügt das
[Update mit 14 Dateien](../scaleway-functions/dist/inf10-db-aufgabe9-website-fix-20261030.zip).
Beide enthalten den neuen HTML-Cachebuster und die aktuelle Aufgabendaten-Datei.
Die unten aufgeführte Website-ZIP vom 29.10. ist der frühere Übergabestand.

1. [ki-auswertung-test.zip](../scaleway-functions/dist/ki-auswertung-test.zip) in die Scaleway-Function `ki-auswertung` hochladen und erneut bereitstellen. Die passende [SHA256-Datei](../scaleway-functions/dist/ki-auswertung-test.sha256.txt) gehört zur Übergabe.
2. [website-kriterienfeedback-20261029.zip](../scaleway-functions/dist/website-kriterienfeedback-20261029.zip) enthält die 71 geänderten Laufzeitdateien unter ihren bisherigen `faecher/`-Pfaden. Diese Dateien mit erhaltener Ordnerstruktur veröffentlichen; Tests und lokale Berichte sind nicht enthalten. Die [Website-Prüfsumme](../scaleway-functions/dist/website-kriterienfeedback-20261029.sha256.txt) liegt daneben.
3. Anschließend die synthetischen fachlichen Vergleichsfälle aus der Spezifikation mehrfach am tatsächlichen Modell prüfen. Die vorhandene SQL-Liveprüfung plant im `--dry-run` 76 Vergleichsfälle mit zwei Durchläufen (152 Modellaufrufe); die Vorschau selbst sendet keine Anfrage.

## Fehlerdiagnose Aufgabe 9 am 30.10.2026

- Healthcheck: HTTP 200, 84 Aufgaben, konfiguriert und aktiviert. OPTIONS auf den tatsächlichen Ziel-Origins `https://franke-schule.de` und `https://www.florian-franke.org` erfolgreich. Die jeweils anderen Hostvarianten leiten auf diese Zieladressen weiter.
- Ein echter, synthetischer P2-Aufruf ergab nach 3,4 Sekunden HTTP 200 und 5/5 Punkte mit „Sehr gut, alles richtig“.
- Die veröffentlichten Clients unter beiden Websites verlangen noch `feedback.maxPoints !== 4` und kennen keine `assessmentVersion`. Eine korrekte Fünf-Punkte-Antwort wird deshalb verworfen und durch die pauschale Erreichbarkeitsmeldung ersetzt.
- Lokal: HTML-Cachebuster aktualisiert, erwartete Maximalpunkte an den gemeinsamen Transport übergeben, konkrete Fehlermeldungen erhalten. Gezieltes Website-Paket enthält die statischen Modulabhängigkeiten einschließlich `aufgabe9-daten.mjs`; eine Veröffentlichung ist damit noch nicht bestätigt.
- Gezielte Aufgaben-/SQL-Tests: 9/9 erfolgreich. Erweiterter Browser-Regressionslauf: 27 simulierte Anfragen erfolgreich, einschließlich ungültigem Punktvertrag, technischem Fehler ohne Freischaltung und unverändert erhaltener Eingabe. Kein zusätzlicher realer Modellaufruf für diese lokalen Tests.
