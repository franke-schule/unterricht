# Prompt: Inf11 – Kontrollstrukturen wiederholen, neue Aufgabe 6.1

Erstelle und integriere ein interaktives Lernmodul für Informatik Klasse 11
in der Einheit „Künstliche Intelligenz“. Titel: **Kontrollstrukturen wiederholen**,
Aufgabennummer **6.1**. Es bereitet gezielt auf die **einfache Variante** der
vorhandenen Aufgabe „Perzeptron implementieren“ vor. Diese bisherige Aufgabe
6.1 erhält die sichtbare Nummer **6.2**. Setze den folgenden Auftrag vollständig um.

## 1. Arbeitsweise und verbindliche Referenzen

Beachte `AGENTS.md`, lokale Anweisungen sowie die vollständig zu lesenden
Dateien `manifest-allgemein.txt`, `manifest-online-ide-programmieraufgaben.txt`
und `manifest-quizaufgaben.txt`.
Führe für die Umsetzung den Agenten-Loop aus AGENTS.md Abschnitt 13 aus:
Planung → Bau → regelbasierte Vorprüfung → fachlich-didaktische Endabnahme,
mit der dort festgelegten Modellwahl und den begrenzten Korrekturschleifen.
Der Planer legt vor dem Bau die wörtlichen Schüleraufträge, Hilfen,
Feedbacktexte, Codebeispiele, erwarteten Ergebnisse und Quizantworten fest.
Er erstellt getrennte mechanische und fachlich-didaktische Akzeptanzlisten.

Arbeitsordner: `faecher/informatik/klasse-11/1-Kuenstliche-Intelligenz/`.
Lies zuerst die **aktuellen Produktdateien**:

- `aufgabe6.html` und `perzeptron/ui/task6.mjs`: einfache Perzeptron-Variante,
  Java-Startprojekt, Schwellenwertentscheidung und Fallunterscheidung beim Training.
- `aufgabe6-0.html`, `perzeptron/ui/task6-0.mjs`, `perzeptron/task6-0.css`
  und `perzeptron/task6-0-ide.css`: vorhandene Wiederholung mit Online-IDE,
  Reitern, Hilfen, Speicherung, Codeprüfung und Abschlussübersicht.
- `sicherungsblatt-aufgabe-6-loesungen.tex`: vorhandenes Sicherungsblatt zur
  einfachen Perzeptron-Implementierung, bisher mit der Nummer 6.1.
- `faecher/informatik/klasse-10/1-Datenbanken/aufgabe6.html` und
  `faecher/informatik/quiz-fragen-pruefen.js`: Reiterlayout und Quizprüfung.

Die aktuellen Produktdateien haben Vorrang vor älteren Planungsdokumenten.
Verwende vorhandene Komponenten und Muster. Kein eigener Editor, Java-Parser,
neues Designsystem oder neue KI-Pipeline. Erhalte fremde uncommittete Änderungen.

## 2. Lernziel und fachliche Grenzen

Wiederhole Java-Kontrollstrukturen an kleinen, ausführbaren Beispielen aus
dem Kontext der Perzeptron-Aufgabe. Nutze deren Schreibweisen, insbesondere
`gewichtete_Summe`, `theta`, `berechnete_ausgabe`, `delta`, `Datenpunkt`,
`punkt`, `punkte` und `netz`, soweit sie im jeweiligen Beispiel benötigt werden.

Nach dem Modul können die Lernenden Bedingungen lesen, ausgeführte Zweige
vorhersagen, fehlenden Code ergänzen und Datenpunkte mit einer Schleife
nacheinander bearbeiten. Sie sind damit auf das Lesen und Ergänzen der
einfachen Variante in Aufgabe 6.2 vorbereitet.

Keine vollständige Trainingsimplementierung vorwegnehmen. Gewichts- und
Schwellenwertanpassungen bleiben Aufgabe 6.2 vorbehalten. Die schwere Variante
ist kein Lernziel dieser Wiederholung. Keine zusätzlichen Themen wie
`while`, `switch`, verschachtelte Schleifen, `break` oder `continue` aufnehmen.

Fachlich verbindlich:

- Die Ausgabe ist genau dann 1, wenn `gewichtete_Summe > theta` gilt;
  sonst 0, ausdrücklich auch bei Gleichheit. Nicht auf `>=` umstellen.
- Vergleiche verwenden beispielsweise `delta == 1`; `=` weist einen Wert zu.
- Eine `if`–`else if`–`else`-Kette führt höchstens einen Zweig aus.
  Ein späterer Zweig wird nur geprüft, wenn vorherige Bedingungen falsch waren.
- `else` hat keine eigene Bedingung. `else if` folgt auf ein `if` bzw. einen
  vorherigen `else if`-Zweig; ein abschließendes `else` ist optional.
- Für `delta = Label - Ausgabe` sind bei binären Werten nur −1, 0 und 1 möglich.
  In der vorhandenen Trainingsmethode wird bei 0 kein Anpassungszweig ausgeführt.

## 3. Genau fünf Reiter

Verwende genau vier fachliche Reiter und anschließend das Abschlussquiz:

1. **if – eine Bedingung prüfen**
2. **if und else – zwei Fälle unterscheiden**
3. **else if – mehrere Fälle unterscheiden**
4. **for – Datenpunkte nacheinander bearbeiten**
5. **Abschlussquiz**

Die Kontrollstruktur `for` erscheint als Lerninhalt ausschließlich in
Reiter 4. Erst dort darf sie auch im sichtbaren IDE-Startcode, in Hilfen
oder Merksätzen vorkommen. Im anschließenden Quiz und dessen Auswertung
darf das bereits Erarbeitete geprüft und zusammengefasst werden.
Kein vorab sichtbares vollständiges Hauptprogramm mit Schleife in Reiter 1–3.
Die Abschlussübersicht wird im fünften Reiter eingeblendet; kein sechster Reiter.

### Reiter 1: if – eine Bedingung prüfen

Beginne mit einem kleinen ausführbaren Beispiel: `berechnete_ausgabe` ist
zunächst 0; nur bei `gewichtete_Summe > theta` wird sie auf 1 gesetzt.
Lass zunächst eine Ausgabe vorhersagen und danach das Programm ausführen.
Verwende konkrete Werte mit Summe kleiner, gleich und größer als `theta`.
Erst nach der Beobachtung die allgemeine Bedeutung von `if` sichern.

Anschließend ergänzen die Lernenden eine einfache Bedingung bzw. Anweisung.
Behandle Vergleich, runde Bedingungsklammern, geschweifte Blockklammern
und die Fortsetzung hinter dem Block. Sichere: Ist die Bedingung falsch,
wird der `if`-Block übersprungen und das Programm danach fortgesetzt.

### Reiter 2: if und else – zwei Fälle unterscheiden

Erweitere dasselbe Beispiel zur binären Entscheidung mit `if` und `else`.
Lass für Summe kleiner, gleich und größer als `theta` jeweils Zweig und
Ausgabe bestimmen und anschließend in der IDE überprüfen.
Ergänze eine kleine Programmieraufgabe zu den Ausgaben 0 und 1.

Mache deutlich: Genau einer der beiden Zweige wird ausgeführt.
Der `else`-Zweig bedeutet hier „Summe kleiner oder gleich Schwellenwert“.
Vergleiche kurz mit Reiter 1: Dort bleibt bei falscher Bedingung der vorher
gesetzte Wert 0 erhalten; hier wird der Wert im `else`-Zweig ausdrücklich gesetzt.

### Reiter 3: else if – mehrere Fälle unterscheiden

Nutze `delta` aus dem Perzeptron-Kontext. Gib seine Bedeutung und die
drei möglichen Werte kurz an. Verwende zunächst nur passende Textausgaben
zu den Fällen, keine Formeln zur Parameteranpassung.

Lass bei einer Kette `if (delta == 1)`, `else if (delta == -1)`, `else`
für jeden der drei Werte vorhersagen, welcher Zweig läuft. Danach ergänzen
die Lernenden die Bedingungen oder ordnen vorhandene Codebausteine.
Sichere den Unterschied zwischen `==` und `=` sowie die Reihenfolge der Prüfung.

Zeige als kurzen Transfer die Struktur der späteren Trainingsmethode:
`if (delta == 1)` und `else if (delta == -1)` ohne abschließendes `else`.
Frage, was bei `delta == 0` passiert. Erwartung: Keiner der beiden Blöcke
wird ausgeführt; die vorhandenen Parameter bleiben unverändert.
Das abschließende `else` ist somit keine Pflicht.

### Reiter 4: for – Datenpunkte nacheinander bearbeiten

Führe erst jetzt Wiederholung ein. Beginne mit drei gleichartigen
Ausgabeanweisungen und ersetze sie durch eine kurze gezählte Schleife
`for (int i = 0; i < 3; i++)`. Erläutere Startwert, Bedingung und
Zähleränderung anhand der tatsächlichen Durchläufe 0, 1 und 2.
Lass Anzahl und Reihenfolge der Ausgaben vorhersagen und überprüfen.

Schließe unmittelbar die **erweiterte for-Schleife** aus der Zielaufgabe an:
`for (Datenpunkt punkt : punkte) { ... }`.
Eine vollständig vorgegebene kleine Sammlung `punkte` und die Klasse
`Datenpunkt` dienen als Gerüst. Keine eigene Einführung in Arrayverwaltung.
Die Lernenden lesen je Datenpunkt beispielsweise das Label aus und geben es aus.
Sie bestimmen die Anzahl der Durchläufe und erklären, welches Objekt die
Variable `punkt` im jeweiligen Durchlauf bezeichnet.

Zeige abschließend als klar gekennzeichneten Ausschnitt aus Aufgabe 6.2:

```java
for (Datenpunkt punkt : punkte) {
    netz.trainieren(punkt);
}
```

Auftrag: „**Erkläre**, wie oft `trainieren` aufgerufen wird und welcher
Datenpunkt jeweils übergeben wird.“ Die Implementierung von `trainieren`
wird hier nicht verlangt. Ein Durchlauf über die Sammlung ist ein
Trainingsdurchgang über diese Datenpunkte, kein Training bis zur Fehlerfreiheit.

### Reiter 5: Abschlussquiz und Auswertung

Erstelle sechs kurze Fragen ausschließlich zu erarbeiteten Inhalten:
einfache `if`-Ausführung, `if`/`else` einschließlich Gleichheit am Schwellenwert,
`else if` und Zweigreihenfolge, Vergleich/Zuweisung und optionales `else`,
Durchläufe der gezählten Schleife sowie Übergabe der Datenpunkte in der
erweiterten Schleife. Nutze plausible Fehlvorstellungen als Ablenker.

Alle Fragen verwenden Checkboxen. Mindestens zwei Fragen haben mehrere
richtige Antworten. Jede Frage erhält „Frage N prüfen“ und eigene Rückmeldung
direkt darunter. Verwende `addQuizQuestionChecks`; der gemeinsame
Auswertungsbutton bleibt, und nach allen richtigen Einzelprüfungen startet
die Gesamtauswertung automatisch.

Die Abschlussübersicht nennt alle Teilaufträge der vier fachlichen Reiter
sowie alle Quizfragen mit richtigen Ergebnissen und kurzen Begründungen.
Sie wird erst nach Bearbeitung der letzten Teilaufgabe angezeigt.
Ein sichtbarer Link „Weiter zu Aufgabe 6.2“ auf `aufgabe6.html` bleibt
unabhängig vom Quiz-Erfolg erreichbar.

## 4. Interaktion, Hilfen und Speicherung

Pro fachlichem Reiter: vorhersagen/beobachten → kurze Erklärung → anwenden
→ kompakter Merksatz. Nutze die echte vorhandene Online-IDE und kleine
ausführbare Projekte. Halte die Code-Stände der Übungen nachvollziehbar
getrennt; Reiterwechsel dürfen Schülercode nicht überschreiben.

Jede prüfbare Teilaufgabe erhält einen eigenen Prüfbutton und konkrete
Rückmeldung. Verwende bestehende lokale Prüflogik für strukturierte Antworten.
Für freie Codeprüfung die vorhandene Scaleway-Anbindung wiederverwenden;
Code nicht mit selbstgebauten Regex-Prüfungen auf eine einzige Schreibweise
reduzieren. Falls neue KI-Aufgaben erforderlich sind, gehören deren
Serverregistrierung, Tests, Build und Upload-ZIP gemäß Manifest zum Auftrag.
Eine ausstehende Bereitstellung klar benennen. `apps-script/` nicht ändern.

Je Kernaufgabe drei gestufte Hilfen: Hinweis → Denkansatz → Teillösung.
Nach einem ersten Fehler nicht die vollständige Lösung zeigen.
Unvollständige Eingaben, fachliche Fehler und technische Fehler unterscheiden.
Für lokale Prüfungen korrekt/teilweise korrekt/noch nicht korrekt verwenden;
KI-Rückmeldungen folgen dem zentralen kompakten Feedbackvertrag.

Aufträge maximal zwei kurze Sätze oder drei Stichpunkte, Operatoren fett.
Übernimm Farben, Karten, Buttons, Typografie und responsive Muster.
Nummeriere alle fünf Reiter sichtbar. Auf Laptop ohne horizontales
Scrollen, auf kleineren Bildschirmen umbrechend. IDE und Aufgaben sinnvoll
nebeneinander bzw. einspaltig. Labels, Fokusmarkierung, Tastaturbedienung,
eindeutige IDs und `aria-live="polite"` berücksichtigen.

Alle Eingaben, Quizantworten, Freischaltungen und den aktiven Reiter bei
jeder Änderung speichern und beim Wiederaufruf herstellen. Die neue Seite
erhält eigene versionierte Formularschlüssel und eigene IDE-IDs, getrennt
von 6.0 und der bisherigen Perzeptron-Aufgabe. Bestehende Speicherkomponenten
verwenden. Codepersistenz auch nach Navigation und Neuladen prüfen.

## 5. Umnummerierung, Dateien und Sicherungsblatt

- Neue Seite: `aufgabe6-1.html`; bei Bedarf lokale Dateien
  `perzeptron/ui/task6-1.mjs` und `perzeptron/task6-1.css`.
- Die bestehende Perzeptron-Seite bleibt unter `aufgabe6.html` erreichbar
  und erhält sichtbar die Nummer **6.2**, auch in Seitentitel, Nummerzeile,
  Navigation und aktuellen Rückmeldungen. Einfache und schwere Variante erhalten.
- Bestehende IDE-IDs, Formularschlüssel und Server-Task-IDs dieser Seite
  beibehalten, damit gespeicherter Code und Antworten erhalten bleiben.
  Nummernänderung ist kein Anlass, die Trainingslogik umzubauen.
- Im Klassenindex lautet die Folge **6.0 → 6.1 → 6.2 → 7**.
  Ergänze die neue Kachel; ändere die Beschriftung der bisherigen Kachel.
  Aufgabe 6.0 führt jetzt zur neuen Kontrollstruktur-Wiederholung 6.1;
  prüfe dort auch die Übergangstexte auf inhaltliche Passung.
  Aufgabe 6.2 erhält einen Rückverweis auf 6.1; 6.0 bleibt erreichbar.
- Suche repositoryweit nach aktuellen Verweisen auf die bisherige 6.1 und
  passe betroffene Navigation, Materialien und gegebenenfalls vorhandene
  Präsentationslinks/QR-Codes konsistent an. Keine pauschalen Ersetzungen
  in historischen Spezifikationen oder technischen Kennungen.
- Passe das **vorhandene** Sicherungsblatt
  `sicherungsblatt-aufgabe-6-loesungen.tex` samt gleichnamigem PDF an:
  Nummer **6.2** in Kopfzeile und PDF-Metadaten; weiterhin Sicherung der
  einfachen Perzeptron-Implementierung. Code, fachliche Inhalte und bisherige
  Markierungen der selbst ergänzten Zeilen bleiben inhaltlich passend zu 6.2.
  Dateistamm darf zur Erhaltung vorhandener Links bestehen bleiben.
- Baue das PDF neu, rendere jede Seite und prüfe das Layout visuell.
  Nur `.tex` und PDF als Produktdateien behalten, keine LaTeX-Hilfsdateien.
  Aktualisiere Downloadbeschriftung und Zuordnung in
  `lehrercodes-dekodierung.tex`/`.pdf`; vorhandenen Lehrercode beibehalten.
  Der Download steht im Abschlussquiz und gegebenenfalls zusätzlich in der
  Auswertung, unabhängig von Aufgabenbearbeitung nur durch Lehrercode geschützt.
  Bei mehreren DOM-Kopien eigene IDs und `name="solution-code"` verwenden.
- Für die **neue** Aufgabe 6.1 ist kein zusätzliches Sicherungsblatt und
  kein separates Wiederholungs-Quiz beauftragt.

## 6. Prüfung und Übergabe

Prüfe insbesondere die Grenzfälle am Schwellenwert, alle drei `delta`-Fälle,
die tatsächlich ausgeführten Zweige und die Durchlaufzahlen beider
Schleifenformen. Führe die Java-Beispiele in der echten Online-IDE aus.
Prüfe, dass vor Reiter 4 keine Schleife im sichtbaren Lernmaterial erscheint.

Kontrolliere Menüfolge, Nummern und Links, bestehende Speicherstände von
6.0/6.2, neue Code- und Formularpersistenz, Quiz-Einzelprüfung und automatische
Gesamtauswertung, vollständige Übersicht, Lehrercode-Freigabe und das
gerenderte Sicherungsblatt. Teste Laptop, Tablet und Smartphone sowie
Tastaturbedienung. Führe passende vorhandene Tests und `git diff --check` aus.
Nicht durchgeführte Prüfungen ausdrücklich als offen dokumentieren.

Lege die Planung unter `perzeptron/SPEZIFIKATION-aufgabe6-1.md` ab und
dokumentiere Bau, Vorprüfung und Endabnahme gemäß Agenten-Workflow.
Übergib zum Schluss die geänderten Dateien, wiederverwendeten Komponenten,
Prüfergebnisse und verbleibende Einschränkungen bzw. Bereitstellungsschritte.
