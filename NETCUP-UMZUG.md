# Lernmodul-Website auf netcup unter franke-schule.de betreiben

Stand: 26.10.2026. Diese Datei ist die Fortsetzungsanleitung für den laufenden Chat.
Sie dokumentiert den Plan; offene Punkte sind noch nicht ausgeführt oder bestätigt.

## Verbindliche Zieländerung vom 26.10.2026

Der Nutzer hat ausdrücklich festgelegt: Ab jetzt wird `franke-schule.de` als
neue Adresse der Lernmodul-Website verwendet, nicht lediglich als Testdomain.
`florian-franke.org` bleibt vorerst unberührt und unverändert. Die früheren
Pläne zur Umschaltung dieser Domain und zur späteren Abschaltung von GitHub
Pages sind damit aufgehoben.

Keine Änderungen an DNS, Hostingzuordnung, Weiterleitungen, Zertifikaten oder
GitHub-Pages-Domainbindung von `florian-franke.org` vornehmen. Die bestehende
Datei `CNAME` mit der bisherigen Domain bleibt erhalten. Keine pauschalen
Domainersetzungen in den gemeinsamen Websitequellen durchführen.

## Vorgehen im Chat

- Immer nur den nächsten noch offenen Schritt erklären.
- Erst nach bestätigtem Ergebnis mit dem nächsten Schritt fortfahren.
- Nach jeder Bestätigung den Stand in dieser Datei aktualisieren.
- Keine Passwörter oder Schlüssel in diese Datei, den Chat oder Quellcode schreiben.
- GitHub Pages und die bisherigen Einstellungen von `florian-franke.org`
  erhalten. Ausschließlich `franke-schule.de` bei netcup einrichten.
- Der Auftrag ist eine Hosting-Migration, keine Überarbeitung der Lernmodule.

## Ziele und bekannte Daten

| Eintrag | Bestätigter Stand |
| --- | --- |
| Repository | https://github.com/franke-schule/unterricht |
| Arbeitsbranch | `main` |
| GitHub-Pages-Quelle | Nutzerbestätigung am 25.10.2026: Deploy from a branch, `main`, `/(root)` |
| Hosting | Hosting251092 – Webhosting 1000 |
| Registrar der Domain | netcup; kein Registrarwechsel und kein Auth-Code notwendig |
| Bisherige Website | GitHub Pages mit eigener Domain |
| Neue produktive Domain | `franke-schule.de`; die `www`-Variante bei DNS und HTTPS mit berücksichtigen |
| Bisheriger Dokumentenstamm von franke-schule.de | Nutzerbestätigung: `franke-schule.de/httpdocs`; diesen Ordner erhalten |
| Aktiver Website-Ordner von franke-schule.de | Änderung auf `hosting251092.af908.netcup.net/httpdocs` und angezeigte HTTP-Website vom Nutzer bestätigt |
| Bisherige Domain, unverändert zu erhalten | `florian-franke.org` und `www.florian-franke.org` |
| Bisherige Pages-Adresse | `www.florian-franke.org`, entsprechend der unverändert zu erhaltenden Datei `CNAME` |
| netcup-Testadresse | http://hosting251092.af908.netcup.net/ |
| Eigene HTTPS-Adresse | Direkt `franke-schule.de`; eine zusätzliche Testsubdomain ist für den nächsten Schritt nicht erforderlich |
| Domainzuordnung im WCP | Nutzer sieht nur `franke-schule.de` und die Hosting-Standarddomain; `florian-franke.org` ist bislang nur im CCP unter Domains vorhanden |
| FTP-Server | `af908.netcup.net` |
| Separater FTP-Benutzer | `github-deploy` |
| Basisverzeichnis des FTP-Benutzers | `/hosting251092.af908.netcup.net/httpdocs` |
| Übertragungsziel aus Sicht dieses Benutzers | `./` – der Benutzer ist bereits auf den Website-Ordner beschränkt |
| Übertragungsprotokoll | Explizites FTPS/FTPES, Port 21, Zertifikatsprüfung eingeschaltet |

GitHub-Secrets wurden laut Nutzer angelegt:

- `NETCUP_FTP_SERVER`
- `NETCUP_FTP_USERNAME`
- `NETCUP_FTP_PASSWORD`

Die Werte der Secrets müssen weder ausgelesen noch erneut im Chat angegeben werden.

## Erledigter und offener Stand

- [x] Schritt 1: Tarif und Zugang zum Webhosting Control Panel geklärt.
- [x] Schritt 2: netcup-Standarddomain ermittelt.
- [x] Schritt 3: Dokumentenstamm ermittelt.
- [x] Schritt 4: `netcup-test.html` über Dateimanager angelegt und erfolgreich aufgerufen.
- [x] Schritt 5: Eigenes FTP-Konto mit auf Website-Ordner begrenztem Zugriff angelegt.
- [x] Schritt 6: Drei Repository-Secrets auf GitHub angelegt.
- [x] Schritt 7 begonnen: Nutzer hat das Anlegen/Starten des Testworkflows bestätigt.
- [x] Schritt 7 abgeschlossen: Nutzer hat am 25.10.2026 den erfolgreichen Verbindungstest bestätigt.
- [x] Schritt 8 vorbereitet: Pages-Quelle bestätigt; Hauptworkflow lokal angelegt.
- [x] Schritt 9a: Nutzer hat das Anlegen des Hauptworkflows auf GitHub bestätigt.
- [x] Schritt 9b: Nutzer hat am 26.10.2026 den erfolgreichen Hauptupload und die angezeigte Website bestätigt.
- [x] Schritt 10a: Nutzer hat am 26.10.2026 den erfolgreichen automatischen Lauf nach Aktivierung des Push-Triggers bestätigt.
- [ ] Schritt 10b: Automatische Veröffentlichung einer erkennbaren Website-Änderung prüfen; auf Nutzerwunsch vorerst zurückgestellt.
- [x] Schritt 11a: Nutzer meldet eine Zertifikatswarnung auf der HTTPS-Standarddomain; gültiges HTTPS ist dort nicht bestätigt.
- [x] Schritt 11b: Nutzer bestätigt den bisherigen Dokumentenstamm `franke-schule.de/httpdocs`.
- [x] Schritt 13a vorgezogen: Nutzer bestätigt nach Dokumentenstammänderung die Lernmodul-Website unter `http://franke-schule.de/`.
- [x] Schritt 14a: Nutzer bestätigt, dass `https://franke-schule.de/` ohne Zertifikatswarnung lädt.
- [x] Schritt 14b: Nutzer und unabhängige curl-Prüfung bestätigen gültiges HTTPS für `www.franke-schule.de`; Antwort HTTP 200 ohne TLS-Fehler.
- [x] Schritt 14c: Nutzer hat den Schalter aktiviert; unabhängige Serverprüfung am 26.10.2026 bestätigt HTTP 301 auf `https://franke-schule.de/` und dort HTTP 200 mit gültiger TLS-Verbindung.
- [x] Browsernachprüfung: Nutzer bestätigt nach privatem Fenster die korrekte HTTPS-Weiterleitung.
- [ ] Schritt 14d: Bevorzugte Domain auf `franke-schule.de` setzen; www soll auf die Stamm-Domain weiterleiten.
- [ ] Schritte 11 bis 16: offen, siehe unten.

**Unmittelbar nächster Schritt:** Im CCP unter Produkte → Hosting251092 die
Domain `franke-schule.de` wählen und Einstellungen bearbeiten öffnen. Ausschließlich
„Bevorzugte Domain“ auf `franke-schule.de` ohne www setzen und speichern.
Dokumentenstamm und Hosting-Typ unverändert lassen. Anschließend
`https://www.franke-schule.de/` auf Weiterleitung zu `https://franke-schule.de/`
prüfen. Beide Namen besitzen jetzt ein funktionierendes Zertifikat.

Unabhängige Prüfung am 26.10.2026: Beide HTTP-Hostnamen erreichen dieselbe IPv6
`2a03:4000:6d:2e96::25:1092`; www antwortet mit 301 auf seine HTTPS-Variante.
Der anfängliche Namensfehler des www-Zertifikats wurde behoben. Nach erneuter
Ausstellung liefert www am 26.10.2026 mit gültigem TLS HTTP 200, aber noch keine
Weiterleitung zur Stamm-Domain. Auch die Stamm-Domain funktioniert mit TLS und HTTP 200.
Keine Änderung an `florian-franke.org`, GitHub Pages, FTP-Ziel oder Workflow.
DNS-Sicherung bleibt vor etwaigen DNS-Änderungen offen; Schritt 10b bleibt auf
Nutzerwunsch zurückgestellt.

Der Hauptworkflow wurde zunächst ausschließlich manuell erfolgreich getestet.
Der Push-Trigger für `main` wurde ebenfalls erfolgreich getestet. Er baut die Website
mit `actions/jekyll-build-pages@v1`, passend zum vorhandenen Pages-Verfahren,
und überträgt ein getrenntes Paket aus `faecher/`, `include/` und den vorhandenen
HTML-/CSS-Quelldateien im Repository-Root. Root-Unterlagen, LNWs und Backendordner
werden nicht hochgeladen. Die FTPS-Einstellungen entsprechen dem erfolgreichen
Test. Der erfolgreiche Build und vollständige Upload wurden am 26.10.2026
vom Nutzer bestätigt. Die lokale Umzugsdatei muss für den Workflow nicht mitveröffentlicht werden.

### Unterbrechung am 21.10.2026

Der Nutzer meldete Netzwerk-Zeitüberschreitungen sowohl bei der Standarddomain
als auch bei `/github-netcup-test.html`. Die netcup-Statusseite meldete zu diesem
Zeitpunkt die vorsorgliche Abschaltung aller Webhosting-Pakete wegen einer
kritischen PHP-Sicherheitslücke, einschließlich CCP und WCP.

Dies ist eine historische Beobachtung, keine Aussage über den Status bei der
späteren Fortsetzung. Dann den aktuellen Status auf https://www.netcup-status.de/
prüfen. Die damalige Prognose für den Abend des 21.10. ist keine feste Zusage.
Der Nutzer muss auf dem verwalteten Webhosting selbst kein Serverupdate installieren.

## Schritt 7 fortsetzen: Verbindungstest bestätigen

1. Prüfen, ob die netcup-Testadresse wieder erreichbar ist und der Provider
   die Störung behoben hat.
2. https://github.com/franke-schule/unterricht/actions öffnen.
3. Links **Netcup-Verbindung testen** auswählen.
4. Falls der bisherige Lauf fehlgeschlagen ist: Nach Wiederherstellung erneut
   über **Run workflow**, Branch `main`, starten.
5. Den Lauf öffnen und das Ergebnis der Übertragung prüfen.
6. http://hosting251092.af908.netcup.net/github-netcup-test.html öffnen.

Erfolg: Grüner Lauf und sichtbarer Satz „GitHub überträgt erfolgreich zu netcup.“.
Ein grüner Lauf allein bestätigt noch nicht, dass die Datei am richtigen
öffentlich erreichbaren Ort liegt.

Der im Chat vorgegebene Workflow liegt auf GitHub unter
`.github/workflows/netcup-test.yml`. Am 25.10.2026 ist die Datei auch im lokalen
Checkout vorhanden. Der genaue Inhalt wurde bei dieser Bestandsprüfung nicht erneut geprüft.
Vor Änderungen daher Remote-Stand und lokale Änderungen prüfen und abgleichen.
Keinen ungeprüften Pull über lokale Arbeiten ausführen.

Technische Parameter des Testworkflows:

- Manueller Trigger `workflow_dispatch`, kein vollständiger Website-Upload.
- `SamKirkland/FTP-Deploy-Action@v4.4.0`.
- `protocol: ftps`, `port: 21`, `security: strict`.
- `local-dir: ./netcup-test/`, `server-dir: ./`.
- Eigene Statusdatei `.netcup-test-sync-state.json`.
- Verwendet die drei oben genannten Secrets.
- Erstellt und überträgt nur `github-netcup-test.html`.

## Schritt 8: Veröffentlichungspaket für die gesamte Website vorbereiten

Zuerst im Repository den aktuellen GitHub-Pages-Veröffentlichungsweg und
eventuelle neu hinzugekommene Workflows prüfen. Die Website besitzt HTML,
CSS, JavaScript, Module und Bibliotheken; `_config.yml` schließt `tmp` aus.
Nicht ungeprüft davon ausgehen, dass ein Kopieren sämtlicher Repository-Dateien
dem bisherigen Pages-Ergebnis entspricht.

1. GitHub **Settings → Pages** öffnen und Quelle/Branch/Buildverfahren feststellen.
2. Den tatsächlichen Website-Umfang aus diesem Stand ableiten. Falls Jekyll
   Inhalte umwandelt, denselben Build für netcup verwenden oder die Abhängigkeit
   vor einem direkten statischen Kopieren gezielt ausschließen.
3. Für den netcup-Workflow ein separates lokales Veröffentlichungsverzeichnis
   vorsehen, z. B. `_site/`. Nur dessen Inhalt wird hochgeladen.
4. Darin alle benötigten Seiten und Ressourcen erhalten: insbesondere
   `index.html`, `styles.css`, weitere verwendete Root-Seiten,
   `faecher/`, `include/`, Bilder, PDFs, Simulationen, Bibliotheken und Downloads.
   Downloadquellen, z. B. Programmierdateien oder ZIPs, nicht pauschal ausschließen.
5. Entwicklungs- und Betriebsunterlagen nicht versehentlich veröffentlichen:
   `.git`, Agentenkonfiguration, `tmp`, private/lokale Leistungsnachweise,
   Zugangsdaten-Dateien, Dekodierungsunterlagen für Lehrercodes, Backendquellen,
   Testprotokolle und diese Fortsetzungsdatei gehören nicht in den Upload.
   Root-Dateien bevorzugt gezielt auswählen. GitHub ignoriert manche Dateien
   beim Pages-Build; netcup tut das bei einem rohen FTP-Upload nicht automatisch.
6. Backendordner `scaleway-functions/` und das Archiv `apps-script/` sind
   keine zu installierenden netcup-Serverprogramme.
7. Umfang, Dateianzahl und Gesamtgröße des Pakets prüfen. `.gitignore`-Material
   ist nicht automatisch auf GitHub vorhanden. Vom Unterricht tatsächlich
   benötigte, nur lokal vorhandene Dateien gesondert klären und übertragen;
   lokale Leistungsnachweise bleiben privat.

Erfolg: Eine nachvollziehbare, auf Vollständigkeit geprüfte Auswahl der
veröffentlichten Dateien. Keine Änderungen an den Lernmodulen allein für den Umzug.

## Schritt 9: Vollständigen Upload einrichten und einmal manuell ausführen

1. Einen Workflow `.github/workflows/netcup-deploy.yml` erstellen, der zunächst
   nur mit `workflow_dispatch` startet.
2. Repository auschecken, das Paket aus Schritt 8 erstellen und per FTPS hochladen.
   Bestehende, geprüfte Actions wiederverwenden; feste Versionen verwenden.
3. Dieselben Secrets und dieselben FTPS-Parameter wie im erfolgreichen Test benutzen.
4. Lokaler Quellordner ist das Veröffentlichungspaket, Serverziel bleibt `./`.
   Nicht noch einmal `hosting251092.af908.netcup.net/httpdocs` an das FTP-Ziel hängen.
5. Eine eigene Statusdatei für den Hauptupload verwenden, z. B.
   `.netcup-website-sync-state.json`. Die Teststatusdatei nicht wiederverwenden.
6. Kein `dangerous-clean-slate: true`. Vorhandene fremde oder manuell angelegte
   Dateien nicht durch eine Komplettlöschung beseitigen.
7. Parallele Hauptdeployments mit einer gemeinsamen `concurrency`-Gruppe
   verhindern. Laufende Uploads möglichst nicht mitten in der Übertragung abbrechen.
8. Zunächst bei Bedarf die Uploadauswahl mit `dry-run` prüfen, dann den echten
   manuellen Lauf starten. Für den ersten großen Upload eine ausreichende
   Workflow-Laufzeit vorsehen; die fünf Minuten des kleinen Verbindungstests
   sind dafür kein sinnvoller allgemeiner Grenzwert.
9. Auf der Standarddomain die Startseite und mehrere Unterseiten öffnen.
   Falls eine netcup-Standarddatei wie `index.php` Vorrang vor `index.html` hat,
   nur nach Identifikation und Sicherung dieser Standarddatei korrigieren.

Erfolg: Hauptworkflow grün; die echte Startseite und verschachtelte Unterseiten
werden über netcup ausgeliefert. GitHub Pages ist weiterhin aktiv.

## Schritt 10: Dauerhafte automatische Veröffentlichung nach Push aktivieren

1. Den geprüften Hauptworkflow um `push` mit `branches: [main]` ergänzen.
   `workflow_dispatch` für manuelle Wiederholungen behalten.
2. GitHub Pages nicht deaktivieren und vorhandene Pages-Workflows erhalten.
3. Eine kleine, erkennbare und unproblematische Website-Änderung gezielt committen
   und pushen. Keine unbeteiligten lokalen Änderungen mitcommitten.
4. Kontrollieren, dass der Push den netcup-Upload startet und die Änderung dort
   sichtbar wird. Falls der Push Pages aktualisiert, auch diesen Lauf kontrollieren.
5. Änderungen danach normal lokal bearbeiten, committen und auf `main` pushen.
   Der Workflow übernimmt die Übertragung; Änderungen per Dateimanager würden
   beim späteren Deploy überschrieben und sind nicht der reguläre Arbeitsweg.

Erfolg: Ein normaler Push aktualisiert netcup ohne erneuten manuellen Dateiupload.
Die Verbindung GitHub → netcup ist damit vollständig hergestellt.

## Schritt 11: Domain und Dokumentenstamm feststellen

1. Im WCP unter Websites & Domains `franke-schule.de` auswählen und die
   Hosting-Einstellungen öffnen. Den derzeitigen Dokumentenstamm ablesen.
2. Mit `hosting251092.af908.netcup.net/httpdocs` vergleichen. Dort liegt die
   erfolgreich über GitHub bereitgestellte Website.
3. Feststellen, ob unter dem aktuellen Dokumentenstamm bereits andere Inhalte
   liegen. Diese bei einer späteren Änderung erhalten und zuvor sichern.
4. Die Domain ist laut Nutzer bereits im WCP vorhanden; keine erneute
   Domainregistrierung, keine Zuordnung von `florian-franke.org` erforderlich.
5. Eine frühere Testsubdomain ist für die direkte Einrichtung der neuen
   Produktionsdomain nicht notwendig. Bereits angelegte Testadressen nicht
   ungefragt löschen.

Erfolg: Aktueller und gewünschter Dokumentenstamm sind eindeutig bekannt.
Noch keine Änderungen an den Domains vornehmen.

## Schritt 12: Einstellungen und Rückweg für franke-schule.de sichern

1. Im CCP die derzeitigen DNS-Einträge von `franke-schule.de` sichern, z. B.
   als Export oder Screenshots mit Host, Typ, Ziel und TTL.
2. Insbesondere A-/AAAA-/CNAME-Einträge für Stamm und `www` sowie vorhandene
   Weiterleitungen festhalten. Bei externen Nameservern die tatsächliche
   DNS-Verwaltung ermitteln, bevor Änderungen geplant werden.
3. Die tatsächliche IPv4 und ggf. IPv6 des Hosting-Pakets aus dem CCP notieren.
   Keine Serveradressen erraten oder aus einer fremden Anleitung übernehmen.
4. Mail-DNS und andere Dienste erhalten: MX, SPF, DKIM, DMARC und sonstige
   Verifizierungseinträge nicht durch pauschale DNS-Vorgaben ersetzen.
5. Den erfolgreichen Git-Stand, den derzeitigen Dokumentenstamm und bei Bedarf
   vorhandene Website-Inhalte von `franke-schule.de` sichern.
6. Falls Web-DNS geändert werden muss, bei Bedarf die entsprechende TTL
   rechtzeitig reduzieren und die vorherige TTL berücksichtigen.

Erfolg: Die bisherigen Einstellungen von `franke-schule.de` sind gesichert.
`florian-franke.org` wird weder zugeordnet noch in seinen DNS-Einträgen geändert.

## Schritt 13: franke-schule.de auf die hochgeladene Website richten

1. Falls nötig, den Dokumentenstamm von `franke-schule.de` auf den bereits
   verwendeten Website-Ordner `hosting251092.af908.netcup.net/httpdocs` setzen.
   Hauptdomain-Einstellungen werden bei netcup gegebenenfalls im CCP unter
   Produkte und der ausgewählten Domain geändert. Konkrete Maske prüfen.
2. Auch die Zuordnung der `www`-Variante prüfen. Keine zweite Websitekopie
   anlegen, wenn beide Namen denselben Upload verwenden können.
3. Falls das Web-DNS bereits auf die korrekten netcup-Adressen zeigt, nichts
   daran ändern. Anderenfalls ausschließlich die betreffenden Webeinträge von
   `franke-schule.de` anpassen: Stamm auf die tatsächliche Hosting-IP richten,
   `www` mit passendem CNAME oder passenden Adressrecords bedienen.
4. Keine widersprüchlichen CNAME- und A-/AAAA-Einträge am selben Host anlegen.
   Alte, abweichende IPv6-Einträge berücksichtigen; ohne nutzbares netcup-IPv6
   keinen falschen AAAA-Eintrag erhalten. Mail-Einträge unverändert lassen.
5. HTTP-Erreichbarkeit und die richtige Startseite unter `franke-schule.de`
   prüfen. DNS-Caches und TTL beachten. Bei falscher Standardseite zuerst
   Dokumentenstamm und Priorität von Indexdateien prüfen.

Erfolg: Die neue Domain liefert die bereits hochgeladene Website von netcup.
Der bestehende FTP-Zugang und Workflow müssen dafür nicht auf einen anderen
Ordner umgestellt werden. GitHub Pages bleibt unverändert in Betrieb.

## Schritt 14: HTTPS für die neue Domain einrichten

1. Bei `franke-schule.de` im WCP SSL/TLS-Zertifikate öffnen.
2. Ein kostenloses Let's-Encrypt-Basiszertifikat für `franke-schule.de` und,
   wenn deren DNS korrekt auf netcup zeigt, `www.franke-schule.de` einrichten.
   Keine Wildcard auswählen, wenn nur diese Namen benötigt werden.
3. Zertifikat ausstellen und in den Hosting-Einstellungen zuweisen.
4. Beide Namen über HTTPS auf gültige Zertifikate ohne Browserwarnung prüfen.
   Erst danach HTTP-auf-HTTPS-Weiterleitung einschalten.
5. Die bevorzugte Adresse festlegen, standardmäßig `https://franke-schule.de`.
   Die www-Variante darauf weiterleiten, sobald beide Zertifikatsnamen funktionieren.
   Auf Schleifen und auf versehentliche Weiterleitung zur alten Domain prüfen.
6. Automatische Zertifikatserneuerung kontrollieren. Falls ausnahmsweise eine
   manuelle DNS-/Wildcard-Validierung gewählt wird, deren Verlängerungspflichten
   dokumentieren statt automatische Erneuerung zu unterstellen.

Erfolg: Die neue produktive Adresse funktioniert verschlüsselt. Die frühere
Zertifikatswarnung der netcup-Standarddomain ist kein Hindernis für ein eigenes,
gültiges Zertifikat von `franke-schule.de`.

## Schritt 15: Funktionen, Scaleway und automatische Veröffentlichung prüfen

1. Unter der neuen HTTPS-Adresse Startseite, Fach-/Klassenmenüs, verschachtelte
   Links, Bilder, PDFs, Sicherungsblatt-Freischaltung, Quiz und repräsentative
   Simulationen/Editoren prüfen. Entwicklerkonsole auf fehlende Dateien,
   falsche MIME-Typen, Mixed Content und CORS-Probleme kontrollieren.
2. Mindestens eine vorhandene KI-Beschreibe-Aufgabe und ggf. Codeauswertung testen.
   Die Function `ki-auswertung` bleibt bei Scaleway; keine neue KI-Pipeline bauen.
3. In Scaleway `AI_ALLOWED_ORIGINS` bei Bedarf um `https://franke-schule.de`
   ergänzen. `https://www.franke-schule.de` nur zusätzlich aufnehmen, wenn dort
   tatsächlich Inhalte ausgeführt werden und keine sofortige Weiterleitung erfolgt.
   Bisher erlaubte Origins von `florian-franke.org` erhalten, damit die alte
   Website weiter funktioniert. Format: exakte Origin ohne abschließenden Slash,
   mehrere Werte durch Komma getrennt. Keine Schlüssel in den Browser übertragen.
4. Nach Konfigurationsänderungen die erforderliche Übernahme/Bereitstellung in
   Scaleway und den echten Browserzugriff prüfen. Nur Konfiguration ändern,
   keinen unbeteiligten Backend-Quellstand mitveröffentlichen.
5. Auf absolute Links, Canonical-Angaben und Jekyll-Metadaten zur alten Domain
   achten. Wegen der weiterhin bestehenden GitHub-Pages-Domainbindung keine
   pauschalen Ersetzungen gemeinsamer Websitequellen durchführen. Falls eine
   Anpassung notwendig ist, sie auf das netcup-Paket begrenzen und gezielt testen.
6. Lokale Bearbeitungsstände prüfen. Wegen der neuen Domain ist der Browser-Origin
   anders: localStorage-Daten von `florian-franke.org` werden nicht automatisch
   auf `franke-schule.de` übernommen; Daten der alten Domain bleiben dort erhalten.
7. Den zurückgestellten Veröffentlichungstest nachholen: eine kleine erkennbare
   Änderung oder eine separate Testdatei auf `main` pushen und nach automatisch
   grünem Workflow auf der neuen Domain nachweisen. Keine unbeteiligten lokalen
   Änderungen mitcommitten. Netcup-Logs und fehlgeschlagene Actions prüfen.

Erfolg: Die neue Domain funktioniert einschließlich KI und Push-Deployment.
Alle bisher über Pages ausgelieferten Website-Funktionen sind geprüft; die KI
selbst wird weiterhin als externer Scaleway-Dienst betrieben.

## Schritt 16: Aufräumen und den neuen Betrieb dokumentieren

1. GitHub Pages, seine Custom-Domain-Einstellung und die Datei `CNAME` unverändert
   erhalten. Kein Abschalten, Entfernen der Domainbindung oder Weiterleiten von
   `florian-franke.org` als Teil dieses Auftrags.
2. Testdateien und den kleinen Workflow `netcup-test.yml` nach Bedarf gezielt
   entfernen: `netcup-test.html`, `github-netcup-test.html` und gegebenenfalls
   `netcup-push-test.html`. Die Statusdatei des Hauptdeployments erhalten.
3. Falls eine Testsubdomain angelegt wurde, deren weiteren Bedarf klären und sie
   nur dann gezielt entfernen. Nicht mehr benötigte Test-Origins in Scaleway
   entfernen; die Origins der bisherigen produktiven Website beibehalten.
4. Falls angepasst, die DNS-TTL von `franke-schule.de` auf einen geeigneten
   Normalwert zurücksetzen. Keine Änderung an `florian-franke.org`.
5. Abschlussstand dokumentieren: neue URL, Dokumentenstamm, erfolgreicher
   Git-Commit/Workflow, funktionierendes HTTPS und Erneuerung, Backups, Datum.
6. Arbeitsweg: lokal bearbeiten → gezielt committen → nach `main` pushen →
   erfolgreichen netcup-Workflow kontrollieren. Die bestehende Pages-Publikation
   läuft mit ihrer bisherigen Konfiguration weiter.

## Fehlerbehebung und Rückweg

| Beobachtung | Nächste Prüfung |
| --- | --- |
| Website und FTP nicht erreichbar | Aktuellen Providerstatus prüfen |
| FTP-Anmeldung abgelehnt | Benutzer `github-deploy`, Passwort-Secret und Servername |
| FTPS-Zertifikatsfehler | Serverhostname und Zertifikat; strikte Prüfung erhalten |
| Upload grün, neue Domain zeigt falsche Seite | Dokumentenstamm und tatsächlichen DNS-/Serverpfad prüfen |
| Neue Datei fehlt | Commit/Branch, automatischen Lauf und Veröffentlichungsauswahl prüfen |
| KI funktioniert nur auf der alten Domain | Neue HTTPS-Origin in Scaleway und CORS prüfen |
| Nur manche Geräte erreichen die neue Website | A-/AAAA-Einträge, DNS-Caches und TTL prüfen |
| Zertifikatswarnung auf der neuen Domain | Namen, Zertifikatszuweisung und DNS prüfen |
| Lokale Fortschritte fehlen auf der neuen Domain | Getrennten Browserspeicher je Origin berücksichtigen |

Bei Problemen die gesicherten Einstellungen von `franke-schule.de` gezielt
wiederherstellen oder den bekannten funktionierenden Git-Stand erneut über
netcup veröffentlichen. Vorhandene Inhalte nicht löschen. Die unveränderte
Website unter `florian-franke.org` bleibt verfügbar; ihre DNS-Einträge sind
kein Bestandteil dieses Rückwegs. DNS-Caches machen Änderungen nicht sofort
überall wirksam. Keine Änderungen an Mail-DNS als Teil der Fehlerbehebung.

## Quellen und lokale Referenzen

Menünamen und technische Optionen bei der konkreten Fortsetzung gegen die
aktuelle Oberfläche und Dokumentation prüfen.

- [netcup: Status](https://www.netcup-status.de/)
- [netcup: Webhosting-Oberfläche und FTP-Konten](https://www.netcup.com/de/helpcenter/dokumentation/webhosting/interface)
- [netcup: Domain mit Webhosting verbinden](https://www.netcup.com/de/helpcenter/dokumentation/domain/domain-webhosting-verbinden)
- [netcup: Let's Encrypt, DNS-Validierung und Standarddomain-Limits](https://www.netcup.com/de/helpcenter/dokumentation/webhosting/ssl-verschluesselung-webhosting)
- [GitHub: Secrets verwenden](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets)
- [GitHub: Workflow manuell starten](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow)
- [FTP-Deploy-Action: Parameter, FTPS und Synchronisierung](https://github.com/SamKirkland/FTP-Deploy-Action)
- [GitHub Pages: Custom Domain verwalten](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site)
- Lokal: `CNAME`, `_config.yml`, `.gitignore`, `scaleway-functions/README.md`,
  `scaleway-functions/handler.js`, `manifest-allgemein.txt`, Abschnitt 0.
