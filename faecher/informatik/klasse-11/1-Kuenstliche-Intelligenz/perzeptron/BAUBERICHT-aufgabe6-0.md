# Baubericht – Aufgabe 6.0

Stand: 11.10.2026. Dies ist der Bericht der Baustufe; eine regelbasierte Vorprüfung oder fachlich-didaktische Endabnahme wird hier nicht behauptet.

## Umgesetzte Dateien

- `../aufgabe6-0.html`: neue Seite mit fünf frei anwählbaren Reitern, einer dauerhaft erhaltenen eingebetteten IDE, dem Startprojekt aus `Hauptprogramm.java` und `Datenpunkt.java`, zehn Begleitblöcken, Klassen- und Objektkarten, Abschlussquiz, Übersicht, Navigation und getrennt bezeichnetem Formular-Reset.
- `ui/task6-0.mjs`: Konfiguration der vorhandenen Klassenkarten-Komponente, strukturierte Feldprüfungen, Reitersteuerung, Merksatzfreigaben, Quizdaten und vollständige Übersicht. Formularspeicherung unter `informatik11-ki-aufgabe6-0-v1`; der IDE-Code nutzt ausschließlich die bestehende IDE-Speicherung unter `Java11Aufgabe6_0Wiederholung`.
- `task6-0.css`: lokale Layoutregeln auf Grundlage von `task5.css`, einschließlich gleichmäßig verteilter Reiter, eckiger Klassenkarte, abgerundeter Objektkarten und responsiver IDE-/Aufgabenanordnung.
- `../../index.html`: Kachel 6.0 zwischen 5.1 und 6.1 ergänzt.
- `../aufgabe6.html`: nur den sichtbaren Link „Zur Wiederholung: Aufgabe 6.0“ ergänzt. Vorhandene uncommittete Änderungen an Aufgabe 6.1, insbesondere deren Nummerierung und Sicherungsblatttext, sowie die Java-Vorlagen, IDs und Trainingslogik blieben unangetastet.

## Wiederverwendung

`mountClassCard`, `evaluateClassCard` und `parseStoredChoices` aus Klasse 10 verwenden die bestehende Kartenbedienung für Ziehen, Antippen und Tastatur. `persistTaskInputs` aus Klasse 9 speichert die erzeugten Formularfelder, Kartenbelegung und den aktiven Reiter; Flags halten Merksätze und die Übersicht fest. `addQuizQuestionChecks` erzeugt sechs Einzelprüfungen und startet nach vollständig richtigen Fragen die gemeinsame Auswertung. Die IDE wird über `includeIDE.js`/`online-ide-embedded.js` geladen; gemeinsame IDE- und Serverdateien wurden nicht geändert.

## Ausgeführte Checks

- `node --check` für `ui/task6-0.mjs`: erfolgreich. Bestehender Test `klassendiagramm.test.mjs`: bestanden. `git diff --check`: kein Whitespace-Fehler; Git gab nur bestehende Hinweise zur LF-/CRLF-Konvertierung aus. Die drei neuen Produktdateien enthalten keine nachgestellten Leerzeichen; im statischen HTML gibt es keine doppelten IDs.
- Lokaler HTTP-Server und Codex In-app Browser: Seite und Moduleinträge geladen; die Menüfolge 5.1 → 6.0 → 6.1 → 7 kontrolliert. 6.0 über Klassenübersicht erneut geöffnet, „Weiter zu Aufgabe 6.1“ und der Wiederholungslink zurück zu 6.0 tatsächlich benutzt. Keine Browserfehler protokolliert.
- Echte IDE: Das unveränderte Startprojekt lief mit vier Zeilen. Die Zustände waren `punkt` X1 2.5, X2 4, Label 1 → 0 und `andererPunkt` X1 6, X2 2, Label 0 → 0. Die Getter mit leeren Klammern und `setzeLabel(0)` wurden ausgeführt. Mit zusätzlichem `punkt.setzeEingabewertX1(7.5);` und zwei Getter-Ausgaben erschienen `7.5` und `6`; nur `punkt` änderte sich. Das testweise ergänzte Projekt ist im lokalen Testbrowser gespeichert, nicht in der Startvorlage.
- Echtes Completion-Popup nach `punkt.` im gültigen `Hauptprogramm.java`: `gibEingabewertX1()` und `setzeEingabewertX1(double neuerWert)` waren sichtbar; weitere zugängliche, darunter geerbte Mitglieder ebenfalls. Der Getter ließ sich mit der Maus einsetzen. Durch Eingabe von `setzeEin` und Bestätigung mit Enter wurde der Setter mit Signaturanzeige `void setzeEingabewertX1(double neuerWert)` eingesetzt; das Platzhalterargument ließ sich durch `7.5` ersetzen. Die Auswahl führte noch keinen Aufruf aus.
- Browserpersistenz: eine Beobachtungsauswahl, eine Klassenkarte, ein Signaturfeld, Quizkreuze, aktiver Reiter und die freigegebenen Merksätze blieben nach Wechsel zur Klassenübersicht und Rückkehr erhalten. Die Klassenkarte ließ sich durch Antippen befüllen und mit Enter auf zwei belegten Feldern per Tastatur umordnen. Der IDE-Code mit Getter-/Setter-Ergänzungen blieb nach derselben Navigation und anschließendem Neuladen erhalten. Sechs einzeln richtig geprüfte Quizfragen lösten die Gesamtauswertung automatisch aus; die Übersicht und 16 gesetzten Kreuze blieben nach Navigation erhalten.
- Viewports 1280, 900 und 390 Pixel: kein horizontaler Seiten- oder Reiterüberlauf; bei 900 und 390 Pixel steht der Aufgabenbereich vor der IDE. Der Browser-Viewport wurde nach dem Test zurückgesetzt.

## Präzise Abweichung und Prüfgrenze

Die anfängliche Abweichung der eingebetteten IDE wurde behoben. Das Startprogramm ergänzt bei ganzzahligen Getterwerten vom Typ `double` die Zeichenfolge `.0` nur, wenn die bestehende Textdarstellung noch keinen Dezimalpunkt enthält; nicht ganzzahlige Werte wie `2.5` bleiben unverändert. Im echten IDE-Lauf erschienen exakt `Vorher punkt: x_1=2.5, x_2=4.0, label=1`, `Vorher andererPunkt: x_1=6.0, x_2=2.0, label=0`, `Nachher punkt: x_1=2.5, x_2=4.0, label=0` und `Nachher andererPunkt: x_1=6.0, x_2=2.0, label=0`. Die erste Browserprüfung erfolgte im Codex In-app Browser; die erneute Ausgabeprüfung der Korrekturrunde 3 lief in Chrome Headless mit der tatsächlichen eingebetteten IDE. Eine separate Browserprüfung des Formular-Reset-Dialogs und aller denkbaren Fehlantwortkombinationen wurde nicht durchgeführt.

### Korrekturrunde 2 nach Vorprüfung

Das Startprogramm formatiert nun die vier Getterwerte vor der Ausgabe passend zur Spezifikation: Bei einem ganzzahligen Wert wird `.0` ergänzt; andere Werte werden unverändert ausgegeben. Den echten eingebetteten IDE-Lauf habe ich erneut ausgeführt und alle vier vollständigen Sollzeilen per Browserprüfung abgeglichen. Der Korrekturpunkt zur Ausgabe ist damit behoben.

### Korrekturrunde 3: gleiche Ausgabe in Standard-Java und eingebetteter IDE

Die Bedingung aus Korrekturrunde 2 ergänzte unter Standard-Java fälschlich nochmals `.0` an bereits als `4.0` dargestellte Werte. In `../aufgabe6-0.html` prüfen nun alle vier Bedingungen zusätzlich mit `String.indexOf(".") < 0`, ob der Dezimalpunkt im Text fehlt. Der eingebettete IDE-Quelltext wurde kontrolliert: Dort stehen tatsächlich `&&` und `<`, keine HTML-Entities. Die vier Startausgaben wurden nach der Änderung sowohl mit `javac`/`java` als auch im echten eingebetteten IDE-Lauf in Chrome Headless exakt verglichen; beide Läufe lieferten dieselben vier oben angegebenen Sollzeilen. Keine weitere Produktdatei wurde in dieser Runde geändert.

### Korrektur des letzten Endabnahmebefunds

Die Objektkarte enthält zunächst nur `label = 1`. Nach vollständig richtiger Prüfung von 1A setzt `task6-0.mjs` die Darstellung auf `label: 1 → 0` und speichert die Freigabe als `block-1a` über die bestehende Formularspeicherung. Beim Wiederherstellen wird derselbe Zustand angezeigt. Die Ausgabe besitzt eine `aria-live`-Region; der Versionsparameter des Moduls wurde aktualisiert. Im In-app Browser wurden fehlende/falsche/teilweise richtige Antworten, ungeprüfte gespeicherte Antworten, die korrekte Freigabe sowie Reiterwechsel und Neuladen geprüft. Der tatsächliche Reset-Listener wurde isoliert mit beiden Bestätigungszuständen geprüft. Endabnahme: `APPROVED`; ausführlicher Nachweis im Endabnahmebericht.
