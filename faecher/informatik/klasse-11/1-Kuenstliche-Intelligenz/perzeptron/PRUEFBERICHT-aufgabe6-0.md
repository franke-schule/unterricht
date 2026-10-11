# Prüfbericht – Aufgabe 6.0

Stand: 11.10.2026. Geprüft wurden die mechanischen Kriterien der Spezifikation und die zugehörigen Produktdateien. Bestehende, nicht zu diesem Auftrag gehörende Workspace-Änderungen wurden nicht als Fehler gewertet. Der Prüfbericht ist die einzige von mir angelegte Datei.

## Ergebnis

PRUEFUNG_BESTANDEN

Nachprüfung der letzten didaktischen Korrektur: Das neue Element `punkt-label-state` zeigt den Startwert und wird nur nach korrekter 1A-Prüfung aktualisiert. Freigabe und Wiederherstellung verwenden das vorhandene Flag-System. Leere/falsche/teilweise richtige sowie ungeprüfte gespeicherte Antworten, erfolgreiche Freigabe, Reiterwechsel und Neuladen wurden im In-app Browser geprüft. Layoutmessungen bei 1280/900/390 px ergaben keinen horizontalen Seitenüberlauf. Der unveränderte Reset-Listener entfernt bei Bestätigung auch das neue Flag (isolierter Listener-Test); der Browserdialog selbst ließ sich nicht abschließend bedienen. `node --check` und `git diff --check` bestanden erneut. Status bleibt `PRUEFUNG_BESTANDEN`.

P1 ist nach Korrekturrunde 3 behoben. `includeIDE.js:initScripts()` dekodiert die eingebetteten Script-Texte (`&lt;` → `<`, `&gt;` → `>`), bevor der Java-Code in die IDE geladen wird. Ich habe dieselbe Normalisierung auf beide eingebetteten Java-Dateien angewendet, anschließend mit `javac` kompiliert und mit `java` ausgeführt. Die Ausgabe entsprach exakt allen vier Spezifikationszeilen; der Baubericht dokumentiert zusätzlich den erfolgreichen echten IDE-Lauf in Chrome Headless.

## Kriterien und Nachweise

| Kriterium | Ergebnis | Nachweis |
| --- | --- | --- |
| Umfang und Schutz bestehender Dateien | Bestanden, mit Scope-Grenze | Neue Produktdateien liegen in den geforderten Orten: `aufgabe6-0.html`, `perzeptron/ui/task6-0.mjs`, `perzeptron/task6-0.css`. In der HTML-Seite ist die neue IDE-ID `Java11Aufgabe6_0Wiederholung`; keine Server-, Lehrercode-, PDF- oder gemeinsame IDE-Datei-Verweise wurden eingeführt. Der Workspace enthält weitere vorhandene Änderungen; ohne sauberen Ausgangsstand ordne ich diese keinem Auftrag zu. |
| Jahrgangsmenü und Navigation | Bestanden | Im Klassenindex ist die Folge 5.1 → 6.0 → 6.1 → 7 vorhanden. Ziel `1-Kuenstliche-Intelligenz/aufgabe6-0.html` ist im Repo vorhanden. Der Baubericht dokumentiert die Browserkontrolle des Menüs, der Rücknavigation und der Links zwischen Aufgabe 6.0 und 6.1. |
| Seitenstruktur und lokale Links | Bestanden | `lang="de"`, UTF-8, H1 mit direkt folgender eigener Zeile „Aufgabe 6.0“, sichtbare Links zu `../index.html` und `../../../../`, Quiz-Link zu `aufgabe6.html`. Relative CSS-, JS-, iframe- und Navigationsziele wurden aus Sicht der HTML-Datei auf Existenz geprüft; keine fehlenden Ziele. 6.1 enthält laut Baubericht den sichtbaren Rückverweis. |
| Reiter und dauerhaftes IDE-Element | Bestanden laut Browsernachweis | Fünf nummerierte `role="tab"`-Buttons und fünf verbundene Panels; Tastaturbehandlung für Pfeile sowie Home/Ende ist im Modulcode vorhanden. Weiter-Buttons werden für Reiter 1–4 angelegt. Eine einzelne iframe-IDE liegt außerhalb der wechselnden Panels. Der Baubericht dokumentiert Laptop-/Tablet-/Smartphone-Ansichten bei 1280/900/390 px ohne Seiten- oder Reiterüberlauf und Auftragsbereich vor IDE bei 900/390 px. Diese Layout-/DOM-Interaktionen habe ich nicht erneut im Browser ausgeführt. |
| IDE-Konfiguration, Java-Dateien und Ausgabe | Bestanden | Die ID stimmt, `Hauptprogramm.java` und `Datenpunkt.java` sind die einzigen Java-Projektdateien; die Deklarationen und Getter-/Setter-Aufrufe entsprechen dem geforderten Startprojekt. Der aktualisierte Baubericht dokumentiert den echten IDE-Lauf mit allen vier exakten Sollzeilen und erfolgreicher Browserassertion. Zusätzlich habe ich den gespeicherten Java-Text mit der in `includeIDE.js:initScripts()` verwendeten Entity-Normalisierung extrahiert, mit `javac` kompiliert und ausgeführt; alle vier Sollzeilen stimmen exakt. Der Bericht dokumentiert außerdem Getter-/Setter-Zusatzlauf mit 7.5 und 6.0. |
| Teilprüfungen und Abschlussquiz | Bestanden, statische Prüfung | Zehn strukturierte Blöcke werden jeweils mit eindeutig beschriftetem Button und direkter `aria-live="polite"`-Rückmeldung gerendert. Sechs Quizfragen werden als `fieldset` mit `legend` und Checkboxen angelegt; jede erhält durch `addQuizQuestionChecks` einen eigenen Prüfbutton und Rückmeldung. Alle sechs Antwortschlüssel enthalten mehrere korrekte Optionen. Der gemeinsame Button „Quiz auswerten“ bleibt; `onAllCorrect` löst die Gesamtauswertung aus. 6.1-Link steht im Quizreiter unabhängig vom Quizstand. Der Baubericht dokumentiert erfolgreichen Einzelprüfungs- und Autoauswertungsablauf. |
| Karten und Eingabezugänglichkeit | Bestanden, statische Prüfung plus übernommener Interaktionsnachweis | Die Aufgabendaten enthalten die acht Pflichtkarten und drei Ablenker; bestehende Klassenkarten-Komponente wird verwendet. CSS erzwingt eckige Klassenkarte; die zwei Objektkarten sind abgerundet. Formularfelder erhalten sichtbare Labels mit eindeutigen IDs; Quizgruppen haben Fieldset/Legend; Feedback hat Live-Region und Text. Der Baubericht dokumentiert Antippen sowie Tastaturbedienung der Karte. |
| Persistenz und Reset | Bestanden, statische Prüfung plus übernommener Browsernachweis | Formularschlüssel stimmt. `persistTaskInputs` wird nach Erzeugung der Blöcke, Karten- und Quizfelder initialisiert; aktiver Tab wird mitgespeichert. Kartenbelegung wird vor `mountClassCard` validiert und gesetzt. Ungültige Tab-IDs werden über die Whitelist verworfen; Speicherzugriff ist in `savedFields`/Reset abgefangen. Reset bestätigt die Löschung und nennt ausdrücklich, dass IDE-Code erhalten bleibt; IDE-Reset wird als Code-Reset benannt. Der Baubericht dokumentiert Navigation/Reload-Persistenz für Antworten, Karte, Quiz, Merksätze, aktiven Reiter, Übersicht und IDE-Code. Defekte Speicherwerte und alle Feldtypen habe ich nicht selbst im Browser provoziert. |
| Syntax, Regression, Whitespace und temporäre Artefakte | Bestanden | `node --check` für `perzeptron/ui/task6-0.mjs` erfolgreich. Vorhandener Test `faecher/informatik/klasse-10/2-Modellierung-und-Programmierung-Online-IDE/tests/klassendiagramm.test.mjs` bestanden. `git diff --check` meldete keine Whitespace-Fehler (nur LF/CRLF-Hinweise). Keine temporären Render- oder LaTeX-Hilfsdateien im Auftragsumfang angelegt. HTML-IDs: keine Duplikate. |
| Sicherungsblatt-/Lehrercode-/PDF-Prüfung | Nicht anwendbar | Spezifikation und Dateiumfang schließen Sicherungsblatt, PDF und Lehrercode ausdrücklich aus. |

## Korrekturrunden

Korrekturrunde 1 konnte die Änderung wegen nicht verfügbarer In-app-Browseroberfläche nicht live verifizieren. Korrekturrunde 2 bestätigte die Ausgabe in der eingebetteten IDE; ein damaliger `javac`-Test ohne IDE-Entity-Normalisierung schlug fehl. Korrekturrunde 3 bestätigt den Guard und die exakte Ausgabe in beiden Laufzeiten. Die erneute Vorprüfung reproduzierte `includeIDE.js:initScripts()`-Dekodierung vor dem Kompilieren und erhielt exakt die Sollausgabe.

## Nicht selbst reproduziert

Den echten IDE-Programmlauf, Completion-Dialog, Browsernavigation/Persistenz und Viewportverhalten habe ich in dieser Runde nicht selbst im Browser bedient; dafür stütze ich mich auf die detaillierten Bauberichtsnachweise. Den aktuellen Java-Startprogrammtext habe ich nach der im IDE-Lader tatsächlich verwendeten Entity-Normalisierung mit `javac` kompiliert und ausgeführt; die vier Sollzeilen stimmten exakt. Der Reset-Bestätigungsdialog und sämtliche Fehlantwortkombinationen wurden laut Baubericht nicht separat im Browser geprüft.







