# Serverseitiger Passwortschutz für KI-Auswertungen

Stand 04.11.2026. Der Passwortschutz ist auf Scaleway und `franke-schule.de`
aktiv. Die Live-Prüfung umfasst direkte Anfragen ohne gültiges Passwort sowie
eine Text- und eine Codeprüfung mit Unterrichtspasswort. Das globale Tageslimit
bleibt ein eigener Umsetzungsschritt.

Vorbereitung: Das lokale Hilfsprogramm
[`scaleway-functions/create-access-password-hash.js`](scaleway-functions/create-access-password-hash.js)
erzeugt den Prüfwert für `AI_ACCESS_PASSWORD_HASH`. Der bereitgestellte Handler
prüft damit jede KI-Auswertungsanfrage.

## Ziel und Festlegungen

- Alle KI-korrigierten Beschreibe- und Coding-Aufgaben benötigen ein gemeinsames,
  wechselbares Unterrichtspasswort. Auch Wiederholungsquiz-Seiten sind erfasst.
- Die Scaleway-Function prüft jede Auswertungsanfrage vor dem Modellaufruf.
  Ein deaktivierter Prüfen-Button allein bietet keinen Schutz.
- Fehlversuche werden vorerst nicht begrenzt: keine Versuchszähler, Wartezeiten
  oder Sperren wegen falscher Passwörter ergänzen.
- Das bestehende Anfragelimit für autorisierte Modellaufrufe bleibt erhalten.
  Es gilt pro laufender Instanz und ist kein globales Verbrauchslimit.
- Lokale SQL-Prüfungen, normale Quizfragen, Bewertungskriterien und
  Sicherungsblatt-Lehrercodes werden durch diesen Schutz nicht verändert.

## 1. Vorhandene Anbindung erfassen

Zentrale Dateien als technische Grundlage verwenden:

| Datei | Aufgabe bei der Umsetzung |
| --- | --- |
| [handler.js](scaleway-functions/handler.js) | Passwortprüfung, HTTP-Fehler, CORS |
| [semantic-answer.mjs](faecher/informatik/klasse-11/1-Kuenstliche-Intelligenz/perzeptron/ui/semantic-answer.mjs) | Gemeinsamer Transport für `evaluateSemanticAnswer` und `evaluateCodeAnswer` |
| [server.test.js](scaleway-functions/tests/server.test.js) | Serverseitige Tests ergänzen |
| [semantic-answer.test.mjs](faecher/informatik/klasse-11/1-Kuenstliche-Intelligenz/perzeptron/tests/semantic-answer.test.mjs) | Browser-Helfer testen |
| [package.ps1](scaleway-functions/package.ps1) | Function-ZIP und SHA256 erzeugen |
| [README.md](scaleway-functions/README.md) | Betrieb und neue Secret-Konfiguration dokumentieren |

Vor dem Einbau nach `scw.cloud`, `evaluateSemanticAnswer`, `evaluateCodeAnswer`
und direkten `fetch`-Aufrufen suchen. Auch dynamische Imports, Re-Exports,
eingebettete Skripte sowie Test- und Hilfsseiten berücksichtigen. Bestehenden
Transport erweitern; keine zweite KI-Auswertungspipeline aufbauen.

## 2. Passwort und serverseitigen Prüfwert vorbereiten

1. Ein langes, zufällig erzeugtes Unterrichtspasswort festlegen. Es ist unabhängig
   vom Scaleway-API-Schlüssel und von Sicherungsblatt-Lehrercodes.
2. Im Projektordner `node .\scaleway-functions\create-access-password-hash.js`
   in einem interaktiven Terminal starten. Das Programm fragt das Passwort
   zweimal verdeckt ab und erzeugt mit zufälligem Salt einen scrypt-Prüfwert.
   Es akzeptiert jedes nicht leere Passwort bis höchstens 256 UTF-8-Bytes ohne
   Steuerzeichen. Eine Mindestlänge von 20 Zeichen ist nicht vorgeschrieben.
   Das Format ist
   `scrypt$v1$32768$8$1$<Salt als Hex>$<Prüfwert als Hex>`; der Schlüssel hat
   64 Bytes, der Salt 16 Bytes. Parameter vor Einsatz gegen die Function-Laufzeit
   testen. Den ausgegebenen Prüfwert wie ein Secret behandeln und nicht posten.
3. Als neuen Secret-Namen **`AI_ACCESS_PASSWORD_HASH`** vorsehen. Der Prüfwert
   gehört ausschließlich in die Secret-Konfiguration der Function oder ihres
   Namespace. Passwort und Prüfwert weder ins Repository noch in HTML, JS,
   Deployment-ZIP, Logs oder Shell-Historie übernehmen.
4. Den vorhandenen Secret `AI_API_KEY` beibehalten. Das Unterrichtspasswort darf
   niemals diesen Schlüssel ersetzen oder Zugriff auf das Scaleway-Konto geben.

Scaleway unterstützt geheime Umgebungsvariablen für sensible Konfiguration:
[Function absichern](https://www.scaleway.com/en/docs/serverless-functions/how-to/secure-a-function/).

## 3. Prüfung im Function-Handler einbauen

Für die erste Fassung ist eine direkte Passwortübermittlung mit jedem
Auswertungs-POST vorgesehen. Dafür den Header **`X-AI-Password`** verwenden.
Der Header enthält das mit UTF-8 und anschließend Base64 kodierte Passwort,
damit auch Umlaute und andere Sonderzeichen übertragen werden können. Base64
ist eine Transportkodierung und keine Verschlüsselung.
Der Browser sendet das eingegebene Passwort über HTTPS; ausschließlich der
Server kennt den gültigen Prüfwert. Ein clientseitiger Hash als Ersatz würde
selbst zu einem wiederverwendbaren Zugangsschlüssel.

1. Im Handler den Header ohne Beachtung der Groß-/Kleinschreibung auslesen.
   Vor der aufwendigen Passwortableitung eine feste Eingabegrößengrenze prüfen.
2. Den konfigurierten Prüfwert auf gültiges Format prüfen. Fehlende oder defekte
   Konfiguration führt zu HTTP 503; die Prüfung darf niemals übersprungen werden.
3. Aus dem eingegebenen Passwort den Prüfwert ableiten und die gleich langen
   Bytefolgen mit `crypto.timingSafeEqual` vergleichen. Parameter stammen aus
   der validierten Serverkonfiguration, nicht aus der Anfrage.
4. Fehlendes und falsches Passwort mit HTTP 401 und derselben verständlichen
   Meldung beantworten, etwa: „Bitte gib das gültige Unterrichtspasswort ein.“
   Einen eigenen Fehlercode wie `AUTH_REQUIRED` verwenden.
5. Die Prüfung für **alle** Auswertungs-POSTs verpflichtend machen, auch für
   direkte Aufrufe ohne `Origin`-Header. Sie muss vor `evaluate(...)` und vor
   Erhöhung des vorhandenen Modellaufrufzählers liegen.
6. `GET`-Healthcheck und `OPTIONS`-Preflight bleiben ohne Passwort und ohne
   Modellaufruf erreichbar. Healthcheck und Fehlerantworten geben keine Secrets
   preis. Bestehendes Ergebnisformat und `requestId`-Zuordnung erhalten.
7. Passwort weder an die Generative API weiterreichen noch in Prompt,
   Aufgaben-Kontext oder Protokolle übernehmen. Auch Infrastruktur-Logs auf
   unerwünschte Aufzeichnung des neuen Headers prüfen.

## 4. CORS für den neuen Header ergänzen

In `handler.js` sind **zwei Stellen** anzupassen:

- `Access-Control-Allow-Headers`: `Content-Type, X-AI-Password` zulassen.
- Prüfung von `access-control-request-headers`: zusätzlich `x-ai-password`
  akzeptieren; beliebige weitere Header weiterhin ablehnen.

Die vorhandene Liste erlaubter Website-Origins beibehalten. CORS regelt
Browserzugriffe und ersetzt keine Authentifizierung direkter API-Anfragen.
Zugriffskontrolle ist an jedem geschützten Endpunkt nötig:
[OWASP REST Security](https://cheatsheetseries.owasp.org/cheatsheets/REST_Security_Cheat_Sheet.html).

## 5. Passworteingabe im Browser integrieren

1. Vor dem ersten KI-Aufruf ein zugängliches Passwortfeld mit Beschriftung und
   Bestätigen-/Abbrechen-Buttons anzeigen. Vorhandene UI-Muster verwenden.
2. Die Eingabe für diese erste Fassung nur im Arbeitsspeicher der geöffneten
   Seite halten. Seitenwechsel oder Neuladen erfordern eine neue Eingabe.
   Keine Speicherung in `localStorage`, URL oder Aufgabenfortschritt vorsehen.
3. Den neuen Header zentral im gemeinsamen `evaluate(...)`-Helfer ergänzen,
   sodass Text- und Codeprüfungen gleichermaßen geschützt sind.
4. Abbrechen sendet keine Auswertungsanfrage und erhält Antwort bzw. Programmcode.
   Bei HTTP 401 die gemerkte Eingabe löschen und erneute Eingabe ermöglichen.
   Andere Fehler, etwa Serverausfälle, nicht als falsches Passwort darstellen.
5. Keine automatischen Wiederholungen kostenpflichtiger Anfragen ergänzen.
   Während der Passworteingabe geänderte Antworten oder Programme dürfen nicht
   versehentlich als alter Stand bewertet werden; bestehende Versionsprüfungen
   und Button-Freigabe bei Abbruch/Fehler berücksichtigen.
6. Die neue Dialog-JS-/CSS-Datei wird mit einem eigenen Cacheparameter eingebunden.
   Die bestehenden Importe des gemeinsamen Helfers bleiben für diesen gezielten
   Rollout erhalten. Nach Upload Hosting-Caches aktualisieren und im Browser mit
   Strg+F5 neu laden. Eine alte, gecachte Helferfassung sendet keinen Passwortheader
   und wird vom neuen Server abgewiesen. Auch in bereits offenen Schülerseiten
   ist dann ein Neuladen erforderlich.

Eine echte zeitlich begrenzte Freigabe über mehrere Seiten hinweg wäre eine
spätere Erweiterung mit serverseitig geprüften, ablaufenden Sitzungstokens.
Ein lokales Flag „freigeschaltet“ genügt nicht als Serverberechtigung.

## 6. Lokal prüfen

Zuerst ausschließlich simulierte Modellantworten und eigene Testpasswörter nutzen.
Mindestens folgende Fälle automatisiert prüfen:

- Gültiges Passwort: Text und Code werden wie bisher bewertet.
- Fehlendes, falsches oder überlanges Passwort: kein Modellaufruf.
- Wiederholte falsche Eingaben erzeugen keine Fehlversuchssperre und verbrauchen
  das vorhandene Kontingent für autorisierte Modellaufrufe nicht.
- Fehlender/defekter Secret: Server bleibt für KI-Aufrufe gesperrt.
- Direkter POST ohne `Origin`: ebenfalls passwortpflichtig.
- Preflight mit neuem Header funktioniert für erlaubte Origins; unbekannte
  Origins und unerlaubte Header werden weiterhin abgelehnt.
- Healthcheck/Preflight lösen keine KI-Auswertung aus und verraten kein Secret.
- Abbrechen, erneute Eingabe, Neuladen, Passwortwechsel und Änderungen an der
  Antwort während des Dialogs funktionieren ohne Datenverlust oder Doppelaufruf.
- Bei geändertem Passwort werden alte Passwörter nach wirksamer Übernahme der
  neuen Serverkonfiguration abgelehnt.

Bestehende Server- und Helfertests ausführen, anschließend `git diff --check`.
Den exakten Testrunner aus `scaleway-functions/package.json` verwenden; beim
direkten Node-Aufruf unter Windows gegebenenfalls Dateilisten statt Shell-Globs
übergeben. Falls ein neues Server-Hilfsmodul entsteht, die bisher feste Dateiliste
in `package.ps1` und die ZIP-Prüfung entsprechend erweitern.

## 7. Konfiguration und Veröffentlichung koordinieren

Lokaler Prüfstand vom 04.11.2026:

- Function-Kern mit 84 unveränderten Bewertungsaufgaben gebaut.
- Server-Testgruppe: 148 von 149 Tests bestanden. Die verbleibende Abweichung
  betrifft `scaleway-functions/tests/inf9-db2-beschreibe.test.js`, Zeile 139:
  Der Test erwartet die DISTINCT-Aufgabe noch in Inf9 `aufgabe2.js`. Diese
  Kennung ist im Git-HEAD vorhanden, im parallel bearbeiteten Arbeitsstand
  dieser Moduldatei aber entfernt. Diese Moduldatei wurde beim Passwortschutz
  nicht verändert; die Abweichung ist vor einer Gesamtveröffentlichung der
  Inf9-Änderungen separat zu klären.
- Eigene Passworttests sowie bestehende Text-/Code-Transporttests bestanden.
- Echter Edge-Browser mit simulierten Modellantworten: Passwortdialog, Abbruch,
  kurze Unicode-Passwörter, Text/Code, Serverfehler, Passwortwechsel, Neuladen
  und Smartphonebreite 375 px bestanden. Keine Live-Modellanfragen ausgeführt.
- Website-Paket enthält nur die drei zentralen Clientdateien; Function-Paket
  enthält die bisherigen fünf Laufzeitdateien. SHA256-Dateien sind erstellt.
- `git diff --check` bestanden.

Live-Stand vom 04.11.2026:

- Bisherige Function per API gesichert und Archivprüfsumme geprüft. Das Upload-ZIP
  enthält denselben Bewertungskern mit allen 84 Aufgaben. Nur der Handler weicht
  von der Sicherung ab. Der temporäre Sicherungsschlüssel wurde nach Nutzerangabe
  gelöscht.
- Healthcheck meldet `accessProtection: "password-v1"`, `accessConfigured: true`
  und `evaluationEnabled: true`. CORS-Voranfragen mit dem Passwort-Header liefern
  für `franke-schule.de` und `www.florian-franke.org` jeweils HTTP 204.
- Direkte Testanfragen ohne Passwort und mit erfundenem Passwort liefern
  HTTP 401 und `AUTH_REQUIRED`. Beide werden vor der KI-Auswertung abgewiesen.
- `franke-schule.de` liefert die drei Clientdateien bytegleich zum Website-ZIP aus.
  Die Lehrkraft bestätigte eine KI-Rückmeldung in Informatik 11, Aufgabe 5.2,
  und eine erfolgreiche Codeprüfung in Informatik 10, Roboter-Aufgabe 3a.
- Der Website-Upload erfolgte manuell bei netcup. Die drei Clientdateien liegen
  noch als lokale Git-Änderungen vor. Für künftige Deployments müssen sie in den
  GitHub-Branch `main` übernommen werden. `www.florian-franke.org` liefert beim
  Live-Abruf noch den älteren Helfer aus und kann den Passwort-Header deshalb
  noch nicht senden.

Ablauf für eine erneute Bereitstellung:

1. Bisherigen Serverstand, Website-Dateien und Konfiguration für die Rückkehr
   sichern; lokal registrierte Aufgaben mit dem bisherigen Live-Stand abgleichen.
   Falls die Konsole keinen Code-Download anbietet, die offizielle
   [Download-URL-API](https://www.scaleway.com/en/developers/api/serverless-functions/functions#get-a-download-url-of-a-function)
   nutzen. Dafür ist `scaleway-functions/backup-live-function.ps1` vorbereitet:
   `& .\scaleway-functions\backup-live-function.ps1 -FunctionId '26f7eaed-e1b0-4b1c-9f7e-27355b481959'`.
   Es fragt einen Scaleway Secret Key mit Function-Leserechten verdeckt ab und
   speichert das aktuelle ZIP mit SHA256 und ausgewählten Betriebsdaten unter
   `scaleway-functions/dist/live-backups/`. Es führt nur GET-Anfragen aus, stellt
   nichts bereit und speichert weder API-Key noch signierte Download-URL.
   Das Unterrichtspasswort ist hierfür nicht geeignet. Ohne vorhandenen API-Key
   zunächst den lesenden Zugriff in IAM einrichten; keinen Schlüssel im Chat posten.
2. Beide Pakete über `scaleway-functions/package-access-update.ps1` bauen und
   SHA256 sichern. Das Skript verwendet die bestehende Function-Paketierung.
   `dist/ki-auswertung-passwortschutz.zip` enthält den Server;
   `dist/website-passwortschutz.zip` enthält ausschließlich `semantic-answer.mjs`,
   `ai-access.mjs` und `ai-access.css` unter ihren bestehenden Website-Pfaden.
   Keine Secrets oder anderen parallelen Moduländerungen einpacken.
3. In Scaleway die Function `ki-auswertung` in Paris/fr-par öffnen und den neuen
   Secret `AI_ACCESS_PASSWORD_HASH` hinterlegen. Existierende Secrets und
   Einstellungen erhalten; gleichnamige Namespace-/Function-Werte vermeiden.
4. Ein Wartungsfenster nutzen: KI über `AI_EVALUATION_ENABLED=false` pausieren,
   aktualisierten Server mit Handler `handler.handle` bereitstellen und die
   Website einschließlich aller Import-/Cacheänderungen veröffentlichen.
   Auf wirksame Übernahme der neuen Konfiguration warten.
5. Healthcheck, CORS und abgewiesene Anfragen prüfen. Dann die KI wieder aktivieren
   und je einen kontrollierten Text- und Codefall mit synthetischen Eingaben live
   prüfen. Abgewiesene Passwortanfragen dürfen keinen Modellaufruf verursachen.
6. In `scaleway-functions/README.md` Secret-Name, Betriebsablauf und Prüfergebnis
   dokumentieren. Das tatsächliche Passwort separat an die Klasse weitergeben.

Bei Problemen die KI deaktivieren, statt zur öffentlich nutzbaren alten
Serverfassung zurückzukehren. Ein bloßer Website-Rollback hebt die serverseitige
Passwortpflicht nicht auf.

## 8. Passwort wechseln und Schutzgrenzen beachten

Für einen Passwortwechsel einen neuen Salt/Prüfwert erzeugen, den Secret ersetzen
und die Konfiguration gemäß Scaleway-Bereitstellungsablauf übernehmen. Danach
prüfen: altes Passwort abgelehnt, neues Passwort akzeptiert. Ein Passwortwechsel
benötigt bei dieser direkten Prüfung keine Änderung der Website.

Ein gemeinsames Passwort kann weitergegeben werden. Ohne Begrenzung der
Fehlversuche bleiben Rateversuche möglich; abgewiesene Anfragen können zudem
Function-Laufzeitkosten verursachen, auch wenn keine Modell-Tokens anfallen.

Das besprochene **globale Tageslimit** ist ein eigener, noch nicht umgesetzter
Schritt: dauerhafter zentraler Zähler, atomare Reservierung vor jedem
Modellaufruf, Tagesgrenze nach `Europe/Berlin` und passende Rückmeldung.
Eine Einstellung wie `AI_DAILY_LIMIT` hat bis zu diesem Einbau keine Wirkung.
Passwortschutz allein setzt kein Kostenlimit.

Technische Grundlage zur Passwortableitung und zum Bytevergleich:
[Node.js Crypto](https://nodejs.org/api/crypto.html). Die Funktionen gegen die
tatsächlich eingesetzte Scaleway-Node-Laufzeit prüfen.
