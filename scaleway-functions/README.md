# Scaleway-Testserver für die Unterrichtswebsite

Dieser Server übernimmt Aufgaben, Prompts, Bewertungsregeln und Ergebnisformat
aus `apps-script/`. Der Google-Server bleibt erhalten. Am 10.10.2026 wurden
35 lokale Website-Dateien auf diesen Server umgestellt; noch nicht veröffentlicht.
Die zwei weiteren manuellen Tests wurden auf ausdrücklichen Benutzerwunsch
übersprungen und durch automatische technische Prüfungen ergänzt.

## Bauen und prüfen

Node.js 22 oder neuer genügt; keine zusätzlichen npm-Pakete oder Installationen.
Aus dem Repository-Verzeichnis:

```powershell
node scaleway-functions/build-core.js
node --test scaleway-functions/tests/*.test.js
node --test apps-script/tests/*.test.js
& ./scaleway-functions/package.ps1
```

`build-core.js` übernimmt `Tasks.gs`, `EvaluationSchema.gs`, die reinen Funktionen
aus `Helpers.gs`, `Rules.gs` und den Promptaufbau aus `Gemini.gs`. Grenzen und
Ergebnistypen stammen aus `Config.gs`. Bei geänderter Quellstruktur bricht die
Extraktion ab. Generierter Kern und SHA256-Quellmanifest liegen im ZIP; bei jeder
neuen Bereitstellung das getestete ZIP samt Prüfsumme extern archivieren.

## Konfiguration auf Scaleway

Bereits eingerichtet im Namespace:

| Typ | Name | Wert |
|---|---|---|
| Secret | `AI_API_KEY` | Scaleway Secret Key; niemals im Quellcode |
| Variable | `AI_PROJECT_ID` | Projekt-UUID |
| Variable | `AI_MODEL` | `mistral-small-3.2-24b-instruct-2506` |

Weitere Einstellungen für spätere Tests:

| Variable | Standard bei fehlendem Eintrag | Zweck |
|---|---|---|
| `AI_EVALUATION_ENABLED` | deaktiviert | Nur der exakte Wert `true` erlaubt Modellaufrufe |
| `AI_ALLOWED_ORIGINS` | keine Browser-Origin freigegeben | Exakte Origins der Testwebsite, durch Komma getrennt, ohne abschließenden `/` |
| `AI_TIMEOUT_MS` | `90000` | Zeitlimit für den Modellaufruf; 1000 bis 180000 ms |

Function: `ki-auswertung`, Region Paris/fr-par, bestehende Node-Laufzeit beibehalten.
Handler: **`handler.handle`**. Für die ersten Tests Minimum scale 0, Maximum scale 1.
Bei Modelltests Function-Timeout auf mindestens 120 Sekunden einstellen.

## Schritt 6b: ZIP hochladen und Healthcheck

1. In Scaleway den Namespace und dann die einzelne Function `ki-auswertung`
   öffnen. Die Namespace-Einstellungen sind nicht der Ort für den Codeupload.
2. Im Reiter **Code**, Abschnitt **Enter function code**, den ZIP-Upload auswählen.
   `dist/ki-auswertung-test.zip` verwenden. Alle fünf Dateien liegen direkt im
   ZIP-Root; keinen zusätzlichen Ordner darum packen.
3. Handler `handler.handle` eintragen. Änderungen mit **Deploy function**
   übernehmen und warten, bis sie bereit ist. UI-Bezeichnungen
   können sich unterscheiden; bei abweichender Ansicht vor dem Klick prüfen.
4. In PowerShell den vorhandenen Function-Endpunkt aufrufen:

```powershell
Invoke-RestMethod -Method Get -Uri 'https://unterrichtkiichezbn4-ki-auswertung.functions.fnc.fr-par.scw.cloud/' | ConvertTo-Json
```

Erwartet: `ok: true`, `provider: "scaleway"`, `version: "0.1.0"`, `configured: true`,
`evaluationEnabled: false` und eine positive `taskCount`. `configured` bestätigt
nur, dass die Konfiguration formal vollständig ist. Der echte API-Zugang wird
erst durch einen Modellaufruf getestet. Der Healthcheck ruft kein Modell auf.

## Schritt 6c: Ein isolierter Modelltest

Erst nach erfolgreichem Healthcheck `AI_EVALUATION_ENABLED` auf `true` setzen und
die erneute Bereitstellung abwarten. Dann diese fiktive Antwort übertragen:

```powershell
$scwServerTest = @{
    requestId = 'scaleway_test_001'
    taskId = 'b'
    answer = 'Circle ball erzeugt einen Kreis. Die Zahlen legen Position und Größe fest. move verschiebt ihn. setFillColor färbt ihn rot. destroy entfernt ihn. Die Befehle werden der Reihe nach ausgeführt.'
} | ConvertTo-Json

$scwServerResult = Invoke-RestMethod `
    -Method Post `
    -Uri 'https://unterrichtkiichezbn4-ki-auswertung.functions.fnc.fr-par.scw.cloud/' `
    -ContentType 'application/json; charset=utf-8' `
    -Body ([System.Text.Encoding]::UTF8.GetBytes($scwServerTest)) `
    -TimeoutSec 130

$scwServerResult | ConvertTo-Json -Depth 8
```

Erwartet: HTTP 200, gleiche requestId, `result.ok: true`, 6 maximale Punkte und
fachlich nachvollziehbares Feedback. Danach für die Pause den Aktivierungswert
wieder auf `false` setzen. Der Test verursacht Modellkosten gemäß Tarif.

## Chat-Schritt 7: Freitextbewertungen vergleichen

`test-bewertungen.ps1` führt nach einem Healthcheck drei Modellaufrufe für
fiktive Antworten zur Aufgabe b aus. Aus dem Repository-Verzeichnis starten:

```powershell
& ./scaleway-functions/test-bewertungen.ps1
```

Vorab festgelegte Erwartungen bei sechs maximalen Punkten: vollständig 5–6,
teilweise 1–3, falsch 0. Punkte und Feedback fachlich prüfen, insbesondere
die Hinweise auf fehlende Aspekte. Bei Abweichungen die Ausgabe zur Prüfung
aufbewahren. Dieser Vergleich deckt erst eine von 67 Aufgaben ab.

## Chat-Schritt 8: Codebewertungen vergleichen

Dasselbe Skript mit dem Parameter `-Aufgabentyp code` aufrufen:

```powershell
& ./scaleway-functions/test-bewertungen.ps1 -Aufgabentyp code
```

Drei Modellaufrufe zu Aufgabe `10-3a` (Robot dudu in einer 12×12-Welt).
Vorab festgelegte Erwartungen: richtiges Robot-Objekt 3/3, richtige Variable
und Objekterzeugung mit falscher Weltgröße (8×8) 2/3, Textausgabe ohne Robot
0/3. Das Skript sendet `code` und `requestType: "code"`, prüft requestId und
den Code-Ergebnistyp und zeigt Feedback/fehlende Aspekte. Der Test bewertet
Code statisch; der Server führt ihn nicht aus. Kein neuer ZIP-Upload nötig.
Weitere Codeaufgaben und vollständige Website-Tests bleiben erforderlich.

## Chat-Schritt 9: Isolierter Browsertest

1. Im Functions-Namespace eine normale Variable `AI_ALLOWED_ORIGINS` mit
   `http://127.0.0.1:8765` ergänzen. Andere vorhandene Origins in derselben
   kommagetrennten Liste behalten. Kein abschließender Slash, kein `*`.
   Speichern und die automatische erneute Bereitstellung abwarten.
   `AI_EVALUATION_ENABLED` für die beiden Modelltests auf `true` lassen.
2. Aus dem Repository-Verzeichnis starten:

   ```powershell
   node scaleway-functions/browser-test-server.js
   ```

3. `http://127.0.0.1:8765/` im Browser öffnen. Die Seite prüft zunächst den
   Status ohne Modellaufruf. Bei erfolgreichem Status einzeln auf
   **Freitext auswerten** und **Programmcode auswerten** klicken.
   Insgesamt zwei Modellaufrufe; erwartet werden passende Bewertungen zu
   Aufgabe b (maximal 6 Punkte) und 10-3a (3 Punkte).
4. Bei einem Browserfehler die Fehlermeldung prüfen. Die Origin muss genau
   zur Browseradresse passen; `localhost` ist eine andere Origin.
   Nicht die HTML-Datei direkt per Doppelklick öffnen.
5. Mit Strg+C den lokalen Server beenden. Bei einer Pause Auswertung wieder
   deaktivieren. Die lokale Origin nach Ende der lokalen Testphase entfernen.

Der lokale Server ist an 127.0.0.1 gebunden und liefert nur die Testseite aus,
keine anderen Projektdateien. Die Testseite hat keine API-Schlüssel, keine
externen Bibliotheken und speichert die Ergebnisse nicht dauerhaft.
Dieser Test prüft CORS und direkte JSON-Anfragen im Browser; er ersetzt
nicht die späteren Tests aller betroffenen produktiven Moduldateien.

## Neuer Übertragungsvertrag

`GET /` und `GET /health`: Healthcheck. `POST /`: JSON-Auswertung.

```json
{"requestId":"anfrage_123456","taskId":"b","answer":"Eine ausreichend ausführliche Antwort."}
```

Für Aufgaben mit `responseType: "code"` `code` statt `answer` übertragen.
`requestType` ist optional, muss aber zum Aufgabentyp passen, falls vorhanden.
Antwort: `{type, requestId, result}`. Bestehende `GEMINI_*`-Typnamen sind zur
Weiterverwendung der Ergebnishülle erhalten; der Modellaufruf geht an Scaleway.
Google-JSONP und iframe-Transport werden nicht angeboten. Die umgestellten
Website-Dateien verwenden POST/JSON. Bei HTTP-Fehlern enthält die Antwort
`errorCode` und `result: {ok:false, message}`. Kein automatischer Google-Rückfall.

## Chat-Schritt 11: erste echte Aufgabenseite in der lokalen Testkopie

Die externe Kopie der ergänzenden Sicherung wurde vom Benutzer bestätigt.
Die Testkopie betrifft zunächst nur Informatik 9, Online-IDE, Aufgabe 1,
Freitext b und c. Das vorhandene Layout, die IDE, Ergebnisanzeige,
Eingabespeicherung und der Lehrercode werden übernommen. Die Eingabespeicherung
bleibt damit auch im lokalen Testbrowser aktiv; nur erfundene Antworten nutzen.

Vorbereiten (bereits durchgeführt; für eine erneute Erstellung):

```powershell
node scaleway-functions/prepare-website-test.js
```

Ziel: `tmp/scaleway-website-test/`. Das Skript kopiert die benötigten Ressourcen
und ersetzt ausschließlich in der kopierten Aufgabe den Auswertungstransport
durch `website-pilot-transport.js`. Das dortige `test-copy-manifest.json`
protokolliert Ausgangscommit, Original-/Testseiten-SHA256 und Änderungen.
Die Originalseite wird nicht überschrieben. Die Testkopie wird von Git ignoriert;
Vorbereitungsskript, Transportvorlage und Anleitung sollen mitversioniert werden.

Den bisherigen lokalen Testserver mit Strg+C beenden, dann:

```powershell
node scaleway-functions/browser-test-server.js --website
```

`http://127.0.0.1:8765/` öffnen; es wird zur Testaufgabe weitergeleitet.
Die bereits erlaubte Origin bleibt gleich. Kein neuer Function-Upload nötig.
Je eine erfundene Antwort zu b und c prüfen: zwei Modellaufrufe. Punkte von
maximal 6, Stärken, fehlende Aspekte und Rückmeldung sollen erscheinen.
Außerdem die IDE starten und nach jeder Auswertung den erneut verfügbaren
Prüfbutton kontrollieren. Andere Aufgabenseiten und der Rücklink zur Übersicht
werden vom Pilotserver nicht bereitgestellt.

Lokale Prüfung: sechs simulierte Browserabläufe in
`tests/website-pilot.test.js` erfolgreich, darunter 3000 Zeichen, Doppelaufrufe,
unabhängige Anfragen zu b/c, Fehler, falsche requestId und Timeout. HTTP-Prüfung
von Weiterleitung, Pilotseite, IDE-JS/CSS, Eingabespeicherung und PDF sowie
Sperrung anderer Seiten/Serverquellen erfolgreich. Dieser separate HTTP-Test
setzt die vorbereitete Kopie voraus:

```powershell
node --test scaleway-functions/tests/website-server.check.js
```

Dabei keine echten Modellaufrufe. Die manuelle Prüfung von IDE und Auswertung
in der ersten Testseite wurde am 10.10.2026 vom Benutzer mit
"Schritt 11 erfolgreich" bestätigt. Rückweg: Testserver mit Strg+C beenden.
Die produktiven Website-Dateien und die Google-Bereitstellung bleiben erhalten.

## Chat-Schritt 12: aktuellen Programmcode aus der IDE auswerten

Die vorbereitete Kopie umfasst nun auch Informatik 10, Online-IDE, Aufgabe 3.
`prepare-website-test.js` verwendet dafür `website-code-pilot-transport.js`
und übernimmt Codeabfrage und Vorprüfungen unmittelbar aus dem Original.
Ergebnisanzeige und Abschlussquiz sind unverändert. `codePilot` im Manifest
protokolliert Original, Testseite und Prüfsummen. Die erste Testseite bleibt
unverändert. Die bereits bestätigte externe Sicherung enthält diesen neuen
Pilotstand noch nicht; vor dem Produktivwechsel den aktuellen Stand sichern.

Lokalen Server mit Strg+C beenden und wie in Schritt 11 mit `--website` neu
starten. Diese Adresse öffnen:

http://127.0.0.1:8765/faecher/informatik/klasse-10/2-Modellierung-und-Programmierung-Online-IDE/aufgabe3.html

Im Editor `Hauptprogramm.java` zunächst eingeben:

```java
Robot dudu = new Robot(1, 1, 12, 12);
```

"Meinen Code für a prüfen" klicken; erwartet werden 3 von 3 Punkten.
Anschließend die beiden Weltmaße durch 8 ersetzen und erneut a prüfen:

```java
Robot dudu = new Robot(1, 1, 8, 8);
```

Erwartet werden 2 von 3 Punkten und ein Hinweis auf die Weltgröße. Dieser
Vergleich prüft auch die Übertragung des aktuell geänderten Editorinhalts.
Das sind zwei Modellaufrufe. Der Prüfbutton muss jeweils wieder bedienbar sein.
Bei abweichenden Bewertungen Punkte und Rückmeldung für die Prüfung festhalten.
Kein neuer Function-Upload oder Änderung der Scaleway-Einstellungen nötig.

Die transportierte Aufgabe b ist ebenfalls vorbereitet; ihre fachliche
Live-Prüfung folgt getrennt. Sechs neue lokale Tests zur Codeabfrage,
Vorprüfung, POST/JSON-Übertragung, Punktegrenzen, Doppelklickschutz, Fehlern und
Timeout erfolgreich. Zusammen mit Textpilot und HTTP-Prüfung 13 erfolgreiche
Prüfungen ohne echte Modellanfragen. Der manuelle Code-Pilottest wurde vom
Benutzer anschließend mit **„Schritt 12 erfolgreich“** bestätigt.

## Gebündelte lokale Website-Umstellung

Alle 32 bisherigen Endpoint-Dateien sowie drei vorhandene Helfer sind lokal
umgestellt. Der bestehende Perzeptron-Helfer `semantic-answer.mjs` übernimmt
Freitext und Code als JSON-POST. Aufrufer und Ergebnisanzeigen verwenden das
bisherige Format. Es gibt keinen API-Key im Frontend und keinen Google-Fallback.
Die Google-Quelldateien sind unverändert; fünf Transporttests wurden angepasst.

`website-migration-log.json` enthält für jede Datei die geprüften Vorher- und
Nachher-Prüfsummen sowie den externen Sicherungsordner:

```text
C:\Users\ffran\Documents\Scaleway-Sicherungen\website-vor-wechsel-2026-10-10T17-57-07-765Z
```

Ergebnisse unter `pruefberichte/`: 44 Server-/Transporttests erfolgreich,
Vertrag aller 67 Aufgaben gegen simulierte Modellantworten geprüft, zehn
HTML-Seiten mit 23 simulierten API-Anfragen im Chrome-Browser erfolgreich.
Auch HTTP-429 und erneutes Auswerten funktionieren. In der erweiterten
Website-Sammlung bestehen drei bereits zuvor vorhandene Fehler (67/70
erfolgreich), separat gegen den Ausgangsstand reproduziert und dokumentiert.
Keine neuen kostenpflichtigen Modellaufrufe für diese automatische Prüfung.

Gesamtvorschau (bisherigen Testserver vorher mit Strg+C beenden):

```powershell
node scaleway-functions/browser-test-server.js --repository
```

Dann `http://127.0.0.1:8765/` öffnen. Echte Auswertungen in dieser Vorschau
verwenden den bereits aktiven Scaleway-Server und können Modellkosten erzeugen.

Für wiederholbare Prüfung:

```powershell
node scaleway-functions/verify-website-migration.js
node scaleway-functions/run-verification.js
node scaleway-functions/check-baseline-failures.js
node scaleway-functions/check-rollback.js
```

`run-verification.js` meldet wegen der drei bestehenden Fehler Exitcode 1.
`check-rollback.js` arbeitet ausschließlich im getrennten Prüfordner unter `tmp/`.
Die Browserprüfung `tests/website-browser.check.js` benötigt Playwright und
Chrome; deren Pfade lassen sich über `SCW_PLAYWRIGHT_PACKAGE` und
`SCW_CHROME_PATH` setzen. `migrate-website.js` war der einmalige Umstellungslauf
und soll auf dem bereits umgestellten Stand nicht erneut ausgeführt werden.

**Vor Veröffentlichung:** `AI_ALLOWED_ORIGINS` in der Scaleway-Konsole um
`https://www.florian-franke.org` ergänzen. Der kostenlose OPTIONS-Test weist
aktuell HTTP 403 für diese Origin nach; localhost ist bereits erlaubt.
`https://florian-franke.org` nur bei direktem Betrieb unter dieser Origin ergänzen.
Nach automatischer Bereitstellung kann `node scaleway-functions/check-live-cors.js`
Healthcheck und Origin-Freigabe ohne Modellaufruf prüfen. Die Website wurde noch
nicht veröffentlicht. Es ist kein erneuter Function-Codeupload erforderlich.

## Schutzmaßnahmen und verbleibende Prüfung vor dem Unterrichtseinsatz

Eingabelimits: 3000 Zeichen Freitext, 12000 Zeichen Code, 64 KiB JSON-Body.
Aufgaben und requestId werden validiert; Modellantworten ebenfalls. Kein Schüler-
code wird ausgeführt. Keine Schülertexte, API-Schlüssel oder kompletten Modell-
antworten werden vom Anwendungscode protokolliert oder dauerhaft gespeichert.
Die vorhandenen Rule-Funktionen laufen nach der Modellbewertung unverändert.

CORS erlaubt nur explizit konfigurierte Origins. PowerShell-Anfragen ohne Origin
sind möglich, damit der Server separat getestet werden kann. CORS ist daher kein
Zugangsschutz. Die zusätzliche Bremse von zehn Modellaufrufen je Minute gilt
**pro laufender Instanz**, nicht global. Sie wird bei Neustarts zurückgesetzt.
Vor öffentlichem Unterrichtseinsatz einen wirksamen Zugangsschutz bzw. globalen
Missbrauchsschutz und Kostenbegrenzung festlegen und testen. Ein öffentlicher
Endpunkt darf keinen geheimen IAM-Key aus dem Browser verlangen. Für reine
PowerShell-Tests kann die Function auch privat betrieben und serverseitig mit
einem getrennten Function-Zugriffsschlüssel aufgerufen werden.

Lokale Tests verwenden simulierte Modellantworten. Sie ersetzen nicht die Tests
der echten Scaleway-Laufzeit, des gewählten Modells, der Klassenlast und jeder
betroffenen Website-Aufgabe. Der vorhandene Google-Live-Export muss vor dem
Produktivwechsel mit den lokalen Aufgaben-/Regeldateien abgeglichen sein.

## Rückweg

Die veröffentlichte Website wurde hier nicht geändert; die lokalen Dateien
verwenden inzwischen Scaleway. Der externe Sicherungsordner enthält
`migration-manifest.json` und `restore-website.ps1`. Bei einem gewünschten
Rückwechsel dieses Skript ausführen: Es prüft alle Originale und aktuellen
Zielstände, stoppt bei späteren unabhängigen Änderungen und stellt 35
Website-Dateien plus fünf Tests wieder her. Dieser Ablauf wurde erfolgreich
im getrennten Prüfordner getestet. Bei bereits erfolgter Veröffentlichung
auch die wiederhergestellten Website-Dateien veröffentlichen. Google muss
dazu aktiv bleiben; die neuen Scaleway-Dateien können erhalten bleiben.

Für den aktuellen
Function-Test lässt sich das Beispielpaket bzw. ein zuvor extern archiviertes
Function-ZIP erneut hochladen. Scaleway-ZIP, SHA256 und Quellmanifest bei jeder
Bereitstellung aufbewahren; nicht auf automatische Versionswiederherstellung
verlassen. Google-Projekt erst nach umfassenden Tests, Beobachtung und Abnahme
gemäß `Wechsel auf Scaleways.txt` löschen.

## Quellen

- [Scaleway Node-Handler](https://www.scaleway.com/en/docs/serverless-functions/reference-content/code-examples/)
- [ZIP-Paket und Handler](https://www.scaleway.com/en/docs/serverless-functions/how-to/package-function-dependencies-in-zip/)
- [Code einer bestehenden Function ändern](https://www.scaleway.com/en/docs/serverless-functions/how-to/manage-a-function/)
- [Strukturierte Modellausgabe](https://www.scaleway.com/en/docs/generative-apis/how-to/use-structured-outputs/)
