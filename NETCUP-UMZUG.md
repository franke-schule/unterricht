# Website von GitHub Pages zu netcup umziehen

Stand: 26.10.2026. Diese Datei ist die Fortsetzungsanleitung für den laufenden Chat.
Sie dokumentiert den Plan; offene Punkte sind noch nicht ausgeführt oder bestätigt.

## Vorgehen im Chat

- Immer nur den nächsten noch offenen Schritt erklären.
- Erst nach bestätigtem Ergebnis mit dem nächsten Schritt fortfahren.
- Nach jeder Bestätigung den Stand in dieser Datei aktualisieren.
- Keine Passwörter oder Schlüssel in diese Datei, den Chat oder Quellcode schreiben.
- GitHub Pages während Vorbereitung und Tests aktiv lassen. Die produktiven
  Domain-Einstellungen erst ganz am Ende ändern.
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
| Domain | `florian-franke.org` und `www.florian-franke.org` |
| Bisherige bevorzugte Adresse | `www.florian-franke.org`, entsprechend der vorhandenen Datei `CNAME` |
| netcup-Testadresse | http://hosting251092.af908.netcup.net/ |
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
- [ ] Schritt 10b: Automatische Veröffentlichung einer erkennbaren Website-Änderung prüfen.
- [ ] Schritte 11 bis 16: offen, siehe unten.

**Unmittelbar nächster Schritt:** Schritt 10b: Im Repository-Root auf GitHub
`netcup-push-test.html` mit dem sichtbaren Satz „Automatische Veröffentlichung funktioniert.“
anlegen und direkt auf `main` committen. Ohne manuellen Start muss der Hauptworkflow
laufen. Nach grünem Lauf die Datei unter der netcup-Standarddomain aufrufen und
den Satz bestätigen lassen. Keine produktiven DNS-Einträge ändern.

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

## Schritt 11: HTTPS-Testadresse und externe Funktionen prüfen

1. HTTPS auf der netcup-Standarddomain nur nutzen, wenn ein gültiges Zertifikat
   vorhanden ist. Zertifikatswarnungen nicht als bestandenen Test behandeln.
2. Falls die Standarddomain kein geeignetes Zertifikat erhält, eine eigene,
   bisher ungenutzte Subdomain wie `test.florian-franke.org` ausschließlich für
   Tests anlegen. Deren DNS auf netcup richten, sie auf denselben Dokumentenstamm
   legen und ein gültiges Zertifikat einrichten. Stamm- und `www`-Domain bleiben
   dabei auf GitHub Pages. Vor Anlage einen bestehenden gleichnamigen Dienst ausschließen.
3. netcup weist auf gemeinsame Let's-Encrypt-Limits für `.netcup.net` hin;
   die eigene Testsubdomain ist deshalb ein möglicher Ausweichweg.
4. Auf HTTPS Startseite, Fach-/Klassenmenüs, verschachtelte Links, CSS, Bilder,
   PDFs, Sicherungsblatt-Freischaltung, Quiz, Speicherung und repräsentative
   Simulationen/Editoren prüfen. Entwicklerkonsole auf fehlende Dateien,
   falsche MIME-Typen, Mixed Content und CORS-Fehler kontrollieren.
5. Browserfunktionen, die einen sicheren Kontext benötigen, nicht allein anhand
   der unverschlüsselten Standarddomain beurteilen.
6. Mindestens eine bestehende KI-Beschreibe-Aufgabe und ggf. Codeauswertung
   von der neuen Test-Origin aus prüfen. Keine neue Auswertungspipeline bauen.

### Scaleway bleibt ein externer Dienst

Die statische Website zieht zu netcup. Die vorhandene Function `ki-auswertung`
und ihre KI-Anbindung bleiben zunächst bei Scaleway. „Vollständig umgezogen“
bedeutet hier alle bisher über Pages ausgelieferten Website-Dateien samt
funktionierender Anbindung; es bedeutet nicht, dass die KI nun auf netcup läuft.
Falls auch dieser Dienst zu netcup wechseln soll, ist dessen Laufzeit separat
zu prüfen und die zusätzliche Migration ausdrücklich zu klären.

Die erlaubten Browser-Origins steuert `AI_ALLOWED_ORIGINS` bei Scaleway.
`scaleway-functions/handler.js` prüft diese Liste exakt. Die Test-Origin nur
bei Bedarf ergänzen, alte Produktions-Origin erhalten. Format: Protokoll und
Hostname, ohne abschließenden Slash, mehrere Einträge durch Komma getrennt.
Keinen API-Schlüssel ins Frontend übertragen. Nach Konfigurationsänderung
die erforderliche Übernahme/Bereitstellung in Scaleway und den echten
Browserzugriff prüfen. Ist die Produktionsadresse später identisch, ändert
ein bloßer Wechsel des Webservers die Browser-Origin nicht.

Erfolg: Die wesentlichen Website-Funktionen einschließlich KI funktionieren
auf netcup. Einschränkungen sind vor der Domainumschaltung bekannt und behoben.

## Schritt 12: DNS und Rückweg sichern

1. Im netcup CCP die aktuellen DNS-Einträge von `florian-franke.org` sichern,
   z. B. Export oder Screenshots mit Host, Typ, Ziel und TTL.
2. Insbesondere aktuelle `A`, `AAAA` und `CNAME` für Stamm- und `www`-Domain
   sowie eventuelle Weiterleitungen dokumentieren.
3. Die tatsächliche IPv4 und ggf. IPv6 des Hosting-Pakets aus dem CCP notieren.
   Keine GitHub-IP, alte Anleitung oder erratene Server-IP übernehmen.
4. MX-, SPF-, DKIM-, DMARC-, Verifizierungs- und sonstige fremde Diensteinträge
   identifizieren und erhalten. Vorhandene CAA-Regeln bei Zertifikatsproblemen prüfen.
5. Wenn möglich, nur die TTL der später geänderten Webeinträge rechtzeitig
   reduzieren, z. B. auf 300 Sekunden, und mindestens die vorherige TTL abwarten.
   Das ändert noch nicht das Hostingziel und wirkt nicht rückwirkend auf Caches.
6. Aktuellen erfolgreichen Git-Commit und funktionsfähigen Uploadstand notieren;
   Hosting-Backup bzw. Kopie des ausgelieferten Pakets aufbewahren.

Erfolg: Die bisherigen DNS-Werte und der letzte funktionierende Website-Stand
sind für eine Rückkehr verfügbar. Pages bleibt weiter aktiv.

## Schritt 13: Produktive Domain und TLS bei netcup vorbereiten

1. Die Domain im CCP dem Hosting-Paket zuordnen und denselben Dokumentenstamm
   wie beim getesteten Upload verwenden. Auch `www` muss bedient werden.
2. Vor dem Bestätigen prüfen, ob der Dialog automatisch DNS-Einträge ändert.
   Falls ja, gehört diese Aktion erst zum eigentlichen Umschalten in Schritt 14.
   Nicht zur bloßen Vorbereitung unbemerkt die produktive Domain umstellen.
3. Ein gültiges Zertifikat für `florian-franke.org` UND `www.florian-franke.org`
   vorbereiten. Nach Möglichkeit DNS-Validierung nutzen, während beide Adressen
   noch zu Pages zeigen. Ein Zertifikat nur für `*.florian-franke.org` deckt
   die Stamm-Domain nicht ab; benötigte Namen explizit prüfen.
4. Falls das verfügbare netcup-Verfahren eine Vorab-Ausstellung nicht zulässt,
   das vor dem Umschalten erklären: Dann kann während Umschalten und Ausstellung
   eine kurze HTTPS-Unterbrechung entstehen. Keine unterbrechungsfreie Migration versprechen.
   Alternativen wie ein vorab per DNS validiertes und importiertes Zertifikat prüfen.
5. Bei manueller Wildcard-Ausstellung die Verlängerung beachten; netcup
   dokumentiert dafür eine manuelle Erneuerung. Automatische Erneuerung nicht unterstellen.
6. Bevorzugte Produktionsadresse weiterhin `https://www.florian-franke.org`
   verwenden, sofern der Nutzer nichts anderes möchte. Weiterleitung von der
   Stamm-Domain erst mit funktionierenden Zertifikaten für beide Namen einschalten.
7. Wenn technisch möglich, produktive Hostnamen vor der öffentlichen DNS-Änderung
   gezielt gegen die neue Server-IP testen, z. B. per `curl --resolve` mit gültiger
   Zertifikatsprüfung. Ein Aufruf nur der nackten IP testet keinen korrekten virtuellen Host.

Erfolg: Domainzuordnung, Verzeichnis, Zertifikatsweg und Zeitpunkt der
DNS-Änderung sind eindeutig. Alle Vorbereitungen, die Pages erhalten können,
sind erledigt. Erst jetzt im Chat den konkreten letzten Umschaltschritt anleiten.

## Schritt 14: Produktive Domain auf netcup umschalten

1. Diesen Schritt erst nach erfolgreichen Upload-/Funktionstests und der
   TLS-Vorbereitung ausführen. Nutzer vorher ausdrücklich darauf hinweisen,
   dass jetzt die produktive Domain umgestellt wird.
2. Falls noch offen, Domainzuordnung aus Schritt 13 mit dem richtigen
   Dokumentenstamm abschließen und automatische DNS-Änderungen kontrollieren.
3. Die Webeinträge gezielt umstellen: Stamm-Domain mit den tatsächlichen
   netcup-Adressen bedienen; `www` passend auf dieselbe Website führen.
   Bei `www` entweder einen passenden CNAME oder passende Adressrecords verwenden,
   keine miteinander unvereinbaren CNAME-/A-/AAAA-Einträge am selben Host.
4. Alte GitHub-Adressrecords ersetzen, einschließlich alter AAAA-Einträge.
   Falls netcup kein IPv6-Ziel vorgibt, keinen alten GitHub-AAAA-Eintrag stehen lassen.
5. Mail- und sonstige Dienste nicht zurücksetzen. Kein Nameserverwechsel nötig,
   wenn die Domain weiterhin die vorhandenen netcup-Nameserver benutzt.
6. Änderungen speichern. DNS-Auflösung für beide Hostnamen und IPv4/IPv6 prüfen,
   z. B. mit PowerShell `Resolve-DnsName`; Browser-/Resolvercaches berücksichtigen.
7. GitHub Pages und seine Custom-Domain-Einstellung vorerst erhalten. Während
   der DNS-Umstellung können unterschiedliche Besucher noch verschiedene
   Server erreichen; beide müssen denselben funktionierenden Stand anbieten.
8. Falls noch nötig, Zertifikat umgehend ausstellen/zuweisen. Gültiges HTTPS
   und anschließend HTTP→HTTPS sowie Stamm→www auf Weiterleitungsschleifen prüfen.

Erfolg: Beide produktiven Domainvarianten erreichen netcup mit gültigem HTTPS.
Die Domainregistrierung bleibt unverändert bei netcup.

## Schritt 15: Produktivbetrieb kontrollieren und Rückfalloption erhalten

1. Startseite, mehrere tief verlinkte Module, Downloads, Quiz, lokale Speicherung
   und KI-Auswertung unter der produktiven HTTPS-Adresse prüfen.
2. Einen normalen Push ausführen und die automatische Aktualisierung der
   produktiven netcup-Website nachweisen.
3. Netcup-Zugriffs-/Fehlerprotokolle und fehlgeschlagene GitHub-Actions prüfen.
4. Über mindestens die vorherige relevante DNS-TTL und mit mehreren Auflösungswegen
   beobachten; idealerweise zusätzlich ein bis zwei Tage stabilen Betrieb abwarten.
5. Pages während dieser Rückfallphase aktiv lassen. Die alte `github.io`-Adresse
   ist mit gesetzter Custom Domain möglicherweise nur eine Weiterleitung zur
   produktiven Domain, also kein unabhängiger Ausweichlink.
6. Da `www` und HTTPS beibehalten werden, bleibt die Browser-Origin für lokale
   Bearbeitungsstände gleich. Daten einer separaten Testdomain werden dagegen
   nicht automatisch zur Produktionsdomain übertragen.

Erfolg: Produktion und Push-Deployment sind stabil, Links und externe Dienste
funktionieren. Ein dokumentierter DNS-Rückweg ist weiterhin verfügbar.

## Schritt 16: Aufräumen und Betrieb dokumentieren

1. Nur wenn kein Rückfall mehr benötigt wird, Custom Domain in GitHub Pages
   entfernen und Pages optional deaktivieren. Die Datei `CNAME` entsprechend
   der gewählten Pages-Veröffentlichungsart bereinigen. GitHub-Repository,
   Branch und netcup-Deployment bleiben erhalten.
2. Vor Entfernen der GitHub-Domainbindung sicherstellen, dass keine eigenen
   DNS-Einträge mehr auf dieses Pages-Angebot zeigen.
3. Den kleinen Workflow `netcup-test.yml` sowie `netcup-test.html`,
   `github-netcup-test.html` und `netcup-push-test.html` entfernen, wenn nicht mehr
   benötigt. Die Statusdatei des
   Hauptdeployments erhalten; sie ermöglicht inkrementelle Übertragungen.
4. Eine eigene Testsubdomain bei Bedarf als Testumgebung behalten oder gezielt
   entfernen. Nicht mehr verwendete Test-Origins aus Scaleway entfernen.
5. DNS-TTL auf einen geeigneten Normalwert zurücksetzen.
6. Abschlussstand ergänzen: produktive URL, Commit/Workflow, Dokumentenstamm,
   Datum, funktionierendes HTTPS mit Verlängerung, Backup und Rückweg.
7. Den künftigen Arbeitsweg festhalten: lokal bearbeiten → gezielt committen →
   nach `main` pushen → erfolgreichen netcup-Workflow kontrollieren.

## Fehlerbehebung und Rückkehr

| Beobachtung | Nächste Prüfung |
| --- | --- |
| Website und FTP nicht erreichbar | Providerstatus, Erreichbarkeit und erst danach Einstellungen prüfen |
| FTP-Anmeldung abgelehnt | Vollständiger Name `github-deploy`, Passwort-Secret, Servername |
| TLS-Zertifikatsfehler bei FTP | Serverhostname und Zertifikat prüfen; nicht dauerhaft `security: loose` verwenden |
| Grüner Upload, aber HTTP 404 | Basisverzeichnis, `server-dir: ./`, Dokumentenstamm und tatsächliche Datei prüfen |
| Standardseite statt eigener Startseite | Indexdateien und deren Priorität im Dokumentenstamm prüfen |
| Neue Datei fehlt auf netcup | Commit/Branch, Actions-Lauf und Veröffentlichungsauswahl prüfen |
| KI funktioniert auf Pages, auf Testdomain nicht | Exakte Test-Origin und CORS in Scaleway prüfen |
| Einige Besucher sehen Pages, andere netcup | DNS-Caches, alte TTL und insbesondere A-/AAAA-Einträge prüfen |
| HTTPS fehlt oder falsches Zertifikat | Beide Hostnamen, virtuelle Hosts und zugewiesenes Zertifikat prüfen |

Bei ernsthaften Problemen nach der DNS-Umschaltung die gesicherten vorherigen
Web-DNS-Einträge wiederherstellen, solange Pages und seine Domainbindung noch
bestehen. DNS-Caches machen auch die Rückkehr nicht sofort überall wirksam.
Netcup-Dateien dabei nicht löschen. Bei reinen Inhaltsfehlern stattdessen den
bekannten funktionierenden Git-Stand erneut über den Hauptworkflow veröffentlichen.
Keine Änderungen an Mail-DNS als Teil dieses Rückwegs.

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
