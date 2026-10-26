# Baubericht Aufgabe 6.1 – Kontrollstrukturen im Perzeptron

## Ergebnis

Die Implementierung gemäß `SPEZIFIKATION-aufgabe6-1.md` ist gebaut. Die fünf IDE-Stände, Aufgaben/Hilfen, persistente Eingaben, Quiz und Scaleway-Bewertungen sind integriert. Das Sicherungsblatt und die Lehrercode-Dekodierung wurden aus den vorhandenen TeX-Quellen neu mit Tectonic gebaut und visuell gerendert.

## Geänderte und neu angelegte Produktdateien

- `aufgabe6-1.html`
- `perzeptron/ui/task6-1.mjs`
- `perzeptron/task6-1.css`
- `perzeptron/task6-1-ide.css`
- `perzeptron/tests/task6-1-browser-smoke.mjs`
- `../../index.html` – Menüeintrag 6.1 ergänzt, bisheriges Perzeptron als 6.2 geführt
- `../aufgabe6-0.html`, `../aufgabe6.html`, `../aufgabe7.html`, `../knn/tests/task7-contract.test.mjs`, `perzeptron/ui/task6.mjs` – Übergänge/Nummerierung auf 6.1/6.2 angepasst
- `../../../../../scaleway-functions/source/tasks.js` – fünf Aufgabenbewertungen registriert
- `../../../../../scaleway-functions/source/rules.js` – enthält eine zusätzliche Leerzeile aus dem Arbeitsstand
- `../../../../../scaleway-functions/tests/task6-1-code.test.js`
- `../../../../../scaleway-functions/evaluation-core.js`, `../../../../../scaleway-functions/source-manifest.json` – generierte Build-Artefakte
- `../sicherungsblatt-aufgabe-6-loesungen.tex` und `.pdf`
- `../../../../../lehrercodes-dekodierung.tex` und `.pdf`
- `../../../../../scaleway-functions/dist/ki-auswertung-test.zip`

## Wiederverwendete Komponenten

Die Seite verwendet die bestehende Reiter-/Navigationsstruktur, LearnJ Online-IDE-Einbettung sowie `persistTaskInputs`, `addQuizQuestionChecks`, `evaluateCodeAnswer` und `renderCompactEvaluation`. IDE-CSS wurde von `task6-0-ide.css` übernommen. Das Sicherungsblatt und die Dekodierung verwenden die vorhandenen TeX-Vorlagen.

## Prüfungen

- `node scaleway-functions/build-core.js` – erfolgreich, 85 Aufgaben im Bewertungskern.
- `node --test scaleway-functions/tests/task6-1-code.test.js` – 3/3 erfolgreich.
- `node --test scaleway-functions/tests/*.test.js` – 87/87 erfolgreich.
- `./scaleway-functions/package.ps1` – erfolgreich. ZIP-SHA256: `21128EDF0755F9C80F7E7FDD82127F16163AA7E164F81BFB184CF46DA0A8A73A`.
- `git diff --check` – keine Whitespace-Fehler; Git meldet lediglich übliche LF/CRLF-Konvertierungshinweise.
- Sicherungsblatt und Dekodierung wurden mit Tectonic `0.17.0+20260731` neu kompiliert. PDFs wurden mit Poppler gerendert und visuell geprüft. Tectonic lag unter `C:\Program Files\WindowsApps\OpenAI.Codex_26.1021.3705.0_x64__2p2nqsd0c76g0\app\resources\tectonic\tectonic.exe`; Compiler-Ausgabe zunächst im Visualisierungsordner `...\pdf-build`, danach die PDFs im Modulverzeichnis aktualisiert. Kein Alt-PDF als neu ausgegeben.
- Kein Scaleway-Upload/Deployment oder Live-Endpunkt-Test durchgeführt.

### Browser-Smoke: Start und Ergebnis

Die Smoke-Datei ist `perzeptron/tests/task6-1-browser-smoke.mjs`. Sie stellt die Repo-Dateien per einfachem HTTP-Server auf `127.0.0.1:8766` bereit und verbindet sich per Playwright/CDP zu Edge auf Port `9223`.

Verwendeter Edge-Aufruf (PowerShell, unsichtbarer Prozess; Profil bleibt über Läufe erhalten):

```powershell
$profile = 'C:\Users\Franke\.codex\visualizations\2026\10\26\01a176c3-588d-7be0-95cb-4e51a0396115\browser-check\profile'
Start-Process -WindowStyle Hidden -FilePath 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe' -ArgumentList @('--remote-debugging-port=9223', "--user-data-dir=$profile", '--no-first-run', '--no-default-browser-check', 'about:blank')
```

Danach aus dem Repository-Verzeichnis:

```powershell
node 'faecher/informatik/klasse-11/1-Kuenstliche-Intelligenz/perzeptron/tests/task6-1-browser-smoke.mjs'
```

Der Test öffnet `http://127.0.0.1:8766/faecher/informatik/klasse-11/1-Kuenstliche-Intelligenz/aufgabe6-1.html`. Er zählte fünf Tabs/Panels und prüfte bei 1440×1000, 820×1180 und 390×844, dass Dokument und Tab-Leiste nicht horizontal überlaufen. Die drei Screenshots wurden geschrieben:

- `C:\Users\Franke\.codex\visualizations\2026\10\26\01a176c3-588d-7be0-95cb-4e51a0396115\browser-check\task6-1-desktop.png`
- `C:\Users\Franke\.codex\visualizations\2026\10\26\01a176c3-588d-7be0-95cb-4e51a0396115\browser-check\task6-1-tablet.png`
- `C:\Users\Franke\.codex\visualizations\2026\10\26\01a176c3-588d-7be0-95cb-4e51a0396115\browser-check\task6-1-phone.png`

Der Smoke führte Programme in den eingebetteten Online-IDEs aus, bestand aber nicht vollständig: Edge hatte in seinem persistenten Profil bereits IDE-Code für die festen LearnJ-IDE-IDs gespeichert. Ein Test, der in Stand 1 den Wert `gewichtete_Summe` von 4 auf 5 setzte, erhielt dadurch eine Ausgabe aus dem vorher gespeicherten Quelltext statt des gerade bearbeiteten Standes. `localStorage.clear()` auf der Modulseite löscht diesen IDE-separaten gespeicherten Zustand nicht. Daher sind responsives Layout und tatsächlicher IDE-Aufruf beobachtet, aber die vollständige Kette aus allen fünf Ständen, isoliertem Startcode und IDE-Persistenz nach Neuladen ist mit diesem Browserprofil nicht als bestanden belegt. Der Vorprüfer kann mit einem frischen `--user-data-dir` erneut prüfen.

Die außerhalb der Sandbox gestartete lokale Edge/CDP-Verbindung funktionierte. Frühere Starts in der Sandbox scheiterten mit Socket-Rechtefehler bzw. Edge-Crashpad-Exitcode `3221225477`; Firefox war mit der vorhandenen Playwright-Version inkompatibel.

## Stand der ersten Baurunde

- Kein inhaltlicher Spezifikationswiderspruch und keine fehlenden vorgegebenen Wortlaute festgestellt.
- Der Browser-Smoke war zu diesem Zeitpunkt nicht vollständig bestanden. Die Korrekturrunde unten ersetzt die damalige Altprofil-Erklärung durch die nachgewiesene Kompilierungs-Synchronisierung und dokumentiert den bestandenen Gesamtlauf.
- Scaleway-ZIP ist erstellt und lokal getestet, aber nicht hochgeladen oder live deployed.
- Keine zusätzlichen Lerninhalte oder eigenen Antwortformulierungen außerhalb der Spezifikation ergänzt.

## Korrekturrunde nach Vorprüfung 1

Die Browserprüfung wurde mit einem frischen Edge-Profil auf lokalem CDP-Port 9224 wiederholt. Im ersten realen Lauf ergab die Änderung der ersten `gewichtete_Summe` von 4 auf 5 tatsächlich `00`, danach 5 auf 6 `10`. Das beanstandete `10` für 5 war kein fachlicher Fehler des Java-Startcodes: Der frühere Smoke änderte das Monaco-Modell, wartete pauschal 600 ms und startete dann mit `onStartFileClicked`. Diese IDE-Methode startet den zuletzt kompilierten Stand; die Kompilierung nach einer Editoränderung wird zeitversetzt ausgelöst. Der Smoke wartet jetzt nach `file.setText` auf das IDE-Ereignis `compilationFinished` und nach dem Start auf die vollständige Laufzeitausgabe. Jeder Lauf benutzt einen frischen Browserkontext und vergleicht die Ausgabe ohne Laufzeitstatistik exakt. Dadurch ist die Prüfung unabhängig von gespeichertem Code des persistenten Edge-Profils und von der Kompilierdauer.

Beim vollständigen Durchlauf wurden zwei weitere unmittelbar betroffene Integrationsfehler sichtbar und lokal korrigiert: Reiter 4 zeigte wegen `setStep` das fünfte IDE-Projekt `ForEach` nie an; nun zeigt er beide zugehörigen Projekte. Der Abschlussquiz-Container `#quiz-feedback` hatte kein `data-feedback="quiz"`, sodass die automatische Gesamtauswertung keine Rückmeldung schreiben konnte; das Attribut ist ergänzt. Der Script-Cache-Buster der Seite wurde auf `20261026-v2` erhöht. Aufgabenwortlaute, Fachlogik und andere Module blieben unverändert.

Der erweiterte Browser-Smoke besteht mit allen fünf eingebetteten IDEs: `if` und `if/else` bei 4/5/6 jeweils `00`, `00`, `10`; `else if` bei 1/−1/0 jeweils der erwartete erste Text; gezählte Schleife vor und nach der Bearbeitung `Datenpunkt 0`, `1`, `2`; erweiterte Schleife zunächst dreimal `Datenpunkt gelesen`, nach Bearbeitung `1`, `0`, `1`. Die zweite ausführbare Übung in Reiter 3 gibt zusätzlich ihren eigenen Text aus; der Smoke prüft den Beobachtungsteil deshalb getrennt. Fünf IDE-Marker bleiben nach Navigation zur Übersicht und nach Reload erhalten. Formularauswahl, Checkbox, aktiver Reiter und Merksatzfreigabe bleiben nach Navigation erhalten. Alle sechs Quizfragen wurden einzeln korrekt geprüft; die Gesamtauswertung startete automatisch und meldete sechs richtige Fragen. Desktop 1440×1000, Tablet 820×1180 und Smartphone 390×844 zeigten keinen horizontalen Überlauf; keine Page-Errors.

Reproduktion aus dem Repository-Root: lokalen Edge mit `--remote-debugging-port=9224 --user-data-dir=<frisches-Profil>` starten, dann in PowerShell `$env:CDP_PORT='9224'; & 'C:\Users\Franke\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' 'faecher/informatik/klasse-11/1-Kuenstliche-Intelligenz/perzeptron/tests/task6-1-browser-smoke.mjs'`. Der Smoke stellt die Dateien selbst auf HTTP-Port 8766 bereit und legt Screenshots im oben genannten `browser-check`-Ordner ab.

Der Vertragstest `knn/tests/task7-contract.test.mjs` wurde an den aktuellen JS- und CSS-Cache-Buster, den aktuellen Import sowie die Menüreihenfolge 6.0 → 6.1 → 6.2 → 7 angepasst und besteht. Die neuen Korrekturen betreffen keine Scaleway-Quelle; der in der ursprünglichen Runde erstellte Build und das ZIP bleiben maßgeblich. Der Upload und ein bestätigter Live-Test stehen weiter aus.

## Korrekturrunde nach Endabnahme 1

Die vier beanstandeten Stellen sind gezielt überarbeitet. Die wörtlich vorgegebene `else`-Erklärung steht nun zwischen 2A und 2B. Im 3B-Startcode sind beide Bedingungen noch `false` und der letzte `else`-Block leer; er bleibt kompilierbar, erzeugt aber vor Ergänzung keine zusätzliche Ausgabe. Damit liefert 3A für `delta = 1`, `-1` und `0` jeweils exakt einen Text. Nach 4C steht die zuvor fehlende, wörtlich vorgegebene Erklärung zur erweiterten `for`-Schleife vor 4D. Die Quizübersicht zeigt zu jeder Frage alle richtigen Aussagen im Wortlaut zusätzlich zu Frage und Begründung. Der Script-Cache-Buster wurde dafür auf `20261026-v3` erhöht.

Der Browser-Smoke wurde nur für diese Beanstandungen erweitert und auf einem frischen Edge/CDP-Kontext erneut erfolgreich ausgeführt. Er prüft jetzt die exakte 3A-Ausgabe bei allen drei Werten, den zunächst stummen und noch unvollständigen 3B-Abschnitt sowie die korrekt ergänzte 3B-Kette bei 1/−1/0. Er prüft die Position und Freischaltung der beiden Erklärungen nach korrekter Bearbeitung von 2A und 4C und vergleicht alle vollständigen richtigen Quiz-Aussagen mit den sichtbaren Antworttexten. Die bisherigen fünf IDE-, Speicher-, Quiz- und Viewport-Prüfungen bestanden erneut; null Seitenfehler. `node --test scaleway-functions/tests/task6-1-code.test.js` ergab 3/3, Syntaxprüfungen beider betroffener MJS-Dateien und `git diff --check` bestanden. Keine Scaleway-Quelle geändert; ZIP und ausstehender Uploadstatus bleiben wie oben beschrieben.

## Nutzerkorrekturen nach Vorprüfung 3 – aktueller Stand

Die späteren verbindlichen Nachträge 8 und 9 der Spezifikation ersetzen die oben dokumentierten früheren Fassungen. Die fünf Beobachtungsfragen 1A/2A/3A/4A wurden auf die **Konsolenausgabe** reduziert; die frühere 4C-Beobachtung sowie 4D/4E und die erweiterte `for`-Schleife entfallen vollständig. Der genaue Hinweis „Ist die Bedingung nicht erfüllt, wird der Code innerhalb des if-Blocks nicht ausgeführt.“ ist in 1A vor der Eingabe ohne Prüfklick sichtbar. 3C ist ein passiver Merksatz. Es gibt acht prüfbare Teilaufgaben, vier IDE-Projekte und sechs ausgabebezogene Quizfragen. Die Übersicht enthält die acht Aufgaben, 3C als Merksatz und alle sechs Quizfragen mit vollständigen richtigen Aussagen.

Reiter 4 zeigt jetzt als ausführbaren Startcode `for (int i = 0; i < 3; i++) { println("Datenpunkt " + i); }`. 4A prüft nur die Ausgabe 0/1/2. In 4B ändern Lernende die Bedingung für die vierte dynamische Zeile; `i < 4` und `i <= 3` sind in der Scaleway-Rubrik als gleichwertig erfasst. Die neue IDE-ID `Java11Aufgabe6_1ForV2` trennt diesen Startcode vom alten ForV1-Speicher; die drei übrigen IDs bleiben gleich. Der ForEach-Task `11-6-1-foreach-code` wurde aus `scaleway-functions/source/tasks.js` entfernt, die 4B-Rubrik und der zugehörige Vertragstest wurden gezielt aktualisiert. Andere Serveraufgaben und `apps-script/` blieben unangetastet.

Formulare nutzen `informatik11-ki-aufgabe6-1-v2`. Die defensive v1-Migration übernimmt nur validierte Ausgabeantworten von 1A/2A/3A/4A, passende Erledigt-Flags, die unveränderten Code-Flags 1B/2B/3B und den aktiven Reiter. Alte 4B-/ForEach-/Quiz-/Summary-Flags werden nicht übernommen; v1 bleibt erhalten. Bereits vorhandenes v2 wird einmalig von überholtem 4B-/ForEach- und Frage-6-Fortschritt bereinigt. Ein Reset lässt v1 unverändert, erstellt aber einen leeren v2-Stand, damit alte Antworten nicht erneut erscheinen.

Der aktualisierte Browser-Smoke (`perzeptron/tests/task6-1-browser-smoke.mjs`) bestand lokal auf Edge/CDP-Port 9224 mit frischem Kontext: vier IDEs und ihre echten Konsolenläufe, Ausgabefelder, sichtbarer if-Hinweis, sechs Quizfragen mit automatischer Gesamtauswertung, v1→v2-Migration, Navigation und Reload sowie Desktop/Tablet/Smartphone ohne horizontalen Überlauf; null Seitenfehler. Vor Navigation wartet der Test auf den tatsächlich im IDE-IndexedDB gespeicherten Marker. Nach Navigation/Reload aktiviert er jeden Reiter und wartet auf den **restaurierten Marker** in `Hauptprogramm.java`, bevor er Dateiinhalte vergleicht; dies behebt den Testharness-Fehler aus Vorprüfung 3 ohne festen Schlaf als Bereitschaftsersatz. Die alten ForV1-Daten wurden nicht gelöscht.

`node scaleway-functions/build-core.js` baute den Kern mit 84 Aufgaben. Alle Scaleway-Tests bestanden 87/87. `& ./scaleway-functions/package.ps1` erstellte `scaleway-functions/dist/ki-auswertung-test.zip`, SHA256 `F7A316909ED74C42B4790C67900F42B3A4D3879B621A20BF16A8BBE75E410A82`. Ein Upload/Deployment und bestätigter Live-Test stehen weiterhin aus; erst danach ist der geänderte 4B-Task online wirksam.

