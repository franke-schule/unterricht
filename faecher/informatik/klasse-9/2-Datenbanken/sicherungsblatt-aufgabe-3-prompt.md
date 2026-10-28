# Erstellungsprompt: Inf9 · Datenbanken · Sicherungsblatt zu Aufgabe 3

Erstelle das **Sicherungsblatt mit Musterlösungen zu Aufgabe 3 – Datensätze filtern mit WHERE** für Informatik Klasse 9, Einheit Datenbanken.

Der Inhalt richtet sich nach dem tatsächlich vorhandenen Lernmodul zu Aufgabe 3. Aufbau und Gestaltung sollen sich **sehr eng am Sicherungsblatt zu Aufgabe 2 derselben Einheit** orientieren. Verwende dessen LaTeX-Quelle als direkte technische Vorlage.

## 1. Verbindliche Quellen

Lies vor der Umsetzung:

- `AGENTS.md`, `manifest-allgemein.txt` vollständig, insbesondere Abschnitt 3, und `manifest-datenbankaufgaben.txt` vollständig.
- Inhaltliche Hauptquelle: `faecher/informatik/klasse-9/2-Datenbanken/aufgabe3.html` und insbesondere `aufgabe3.js` im selben Ordner. Prüfe dort Einführung, Beschreibe-Aufgabe, Pflichtaufgaben 1–12, Erklärungen, Klammerbeispiel und Zusammenfassung.
- Direkte Struktur- und Gestaltungsvorlage: `faecher/informatik/klasse-9/2-Datenbanken/sicherungsblatt-aufgabe-2-loesungen.tex` und das gleichnamige PDF. Sieh dir auch das PDF visuell an.
- Datengrundlage für alle Tabellen: `faecher/informatik/klasse-10/1-Datenbanken/users.csv` sowie das im Modul verwendete Schema.

Die aktuelle Implementierung ist für die Inhalte maßgeblich. Ältere Modul-Prompts oder Spezifikationen dienen nur als Hintergrund; deren damalige Vorgabe, kein Sicherungsblatt zu erstellen, ist durch diesen Auftrag überholt.

## 2. Aufbau und Gestaltung

Übernimm aus dem Blatt zu Aufgabe 2 die Präambel, Farben, Schriftarten, Seitenränder, Kopf- und Fußzeile, nummerierten blauen Abschnittsüberschriften und vorhandenen Makros, insbesondere `\sectiontitle`, `\workbox`, `\sqlbox`, `\merkebox` und `\smallcaption`.

Behalte dessen typische Abfolge bei:

**kurzer Arbeitsauftrag → vollständige SQL-Anweisung → passende Ergebnisrelation → allgemeine Form und/oder knapper Merksatz.**

SQL und Ergebnisrelation stehen nach Möglichkeit nebeneinander. Vergleichbare Fälle dürfen wie bei DISTINCT und LIMIT in Aufgabe 2 nebeneinander angeordnet werden. Verwende echte Tabellen mit hellblauen Kopfzeilen und dieselbe Codegestaltung. Das Blatt soll beim direkten Vergleich als Fortsetzung von Aufgabe 2 erkennbar sein.

Der Kopf erhält den Titel „Aufgabe 3 – Datensätze filtern mit WHERE“, die Bezeichnung „Sicherungsblatt“ und das vorhandene Feld „LÖSUNGEN“. Passe Fußzeilen und Seitenzählung an.

Plane wegen des Stoffumfangs und der engen Orientierung an der zweiseitigen Vorlage **zwei gut lesbare A4-Seiten**. Prüfe eine kürzere Fassung nur, wenn alle folgenden Lernkerne ohne gedrängtes Layout erhalten bleiben. Keine Verkleinerung der Schrift als Ersatz für sinnvolle Auswahl und Verdichtung.

## 3. Inhaltliche Gliederung

### Seite 1: WHERE und Vergleiche

**1 · Von users zur gefilterten Ergebnisrelation**

- Beginne wie Aufgabe 2 mit einem kleinen, echten Ausschnitt aus `users`. Verwende möglichst die sechs Datensätze der Moduleinführung mit den IDs 1, 2, 3, 4, 8 und 34 sowie den Spalten `id`, `username`, `city`; prüfe die Werte gegen die CSV.
- Sichere das Einführungsbeispiel: „Zeige die Benutzernamen und Wohnorte der Mitglieder aus Berlin.“ Lösung:

  ```sql
  SELECT username, city
  FROM users
  WHERE city = 'Berlin'
  ```

- Zeige die beiden passenden Zeilen des dargestellten Ausschnitts als Ergebnisrelation. Kennzeichne ausdrücklich, dass dies die Treffer **im Ausschnitt** und nicht sämtliche Berliner Mitglieder der Datenbank sind.
- Merksatz: „WHERE wählt die Zeilen aus, die eine Bedingung erfüllen. Diese Auswahl heißt Selektion. SELECT bestimmt die Ausgabespalten. Die gespeicherte Tabelle bleibt unverändert.“
- Ergänze die allgemeine Form mit `SELECT Spaltenname`, `FROM tabellenname`, `WHERE Bedingung`, jeweils in einer eigenen Zeile.

**2 · Einfache Bedingungen: Texte und Zahlen**

- Sichere anhand der bestehenden Pflichtaufgaben zwei Fälle: alle Daten weiblicher Mitglieder (`SELECT * FROM users WHERE gender = 'female'`) und alle Daten von Mitgliedern unter 1,80 m (`SELECT * FROM users WHERE centimeters < 180`).
- Verwende die Arbeitsaufträge aus dem Modul und zeige kleine, überprüfte Ergebnisausschnitte. Bei `SELECT *` sind alle Spalten ausgewählt; wenn du nur einige darstellen kannst, kennzeichne den Spaltenausschnitt ausdrücklich.
- Merksätze: Textwerte stehen in einfachen Anführungszeichen, Zahlen nicht. `centimeters` enthält Zentimeter. `< 180` schließt genau 180 cm aus, `<= 180` schließt sie ein.

**3 · Vergleiche und Datumswerte**

- Kompakte Übersicht der im Modul eingeführten Operatoren: `=`, `<`, `>`, `<=`, `>=`, `!=` beziehungsweise `<>`, jeweils mit deutscher Bedeutung.
- Sichere die vorhandenen Beispiele `birthday = '2007-09-17'` und `city != 'Leipzig'` mit den zugehörigen vollständigen SQL-Abfragen und kurzen Arbeitsaufträgen aus dem Modul.
- Datumsschreibweise: `'JJJJ-MM-TT'`. Bei der Leipzig-Abfrage wird nur `name` ausgegeben.
- Kurzer Hinweis: „NULL bedeutet: kein Wert eingetragen. Ein normaler Vergleich mit NULL erfüllt die WHERE-Bedingung nicht.“ Verdeutliche beim Leipzig-Beispiel, dass Mitglieder ohne eingetragenen Wohnort dadurch nicht ausgewählt werden. Keine neue Syntax zur NULL-Prüfung einführen.

### Seite 2: Muster und verknüpfte Bedingungen

**4 · Muster suchen mit LIKE**

- Sichere die bestehenden Beispiele `name LIKE 'B%'`, `username LIKE '%fuchs%'` und `birthday LIKE '%-03-%'`. Zeige die jeweiligen vollständigen SQL-Abfragen mit kurzen Arbeitsaufträgen; verwende für ausgewählte Beispiele echte Ergebnisausschnitte.
- Ergänze eine kleine Musterübersicht zu Anfang, Ende und Enthaltensein. Nutze für die Endung das bereits erklärte Beispiel `name LIKE '%berg'`.
- Merksatz: „LIKE vergleicht mit einem Muster. % steht für beliebig viele Zeichen, auch für kein Zeichen. Die Position von % bestimmt, wo weitere Zeichen stehen dürfen.“
- Verdeutliche: `name` enthält Vor- und Nachnamen; `username` den Benutzernamen. `%-03-%` sucht den Monat März an der richtigen Position; `%03%` wäre zu ungenau.

**5 · Bedingungen verknüpfen mit AND und OR**

- Sichere nebeneinander die vorhandenen Pflichtbeispiele:
  - Lina aus Berlin: `SELECT * FROM users WHERE name LIKE 'Lina %' AND city = 'Berlin'`.
  - Lina oder Felix: `SELECT * FROM users WHERE name LIKE 'Lina %' OR name LIKE 'Felix %'`.
- Jeweils kurzer Arbeitsauftrag, vollständige SQL-Anweisung und kleiner Ergebnisausschnitt.
- Merksatz: „AND verlangt, dass beide Bedingungen erfüllt sind. Bei OR genügt mindestens eine Bedingung; auch beide dürfen erfüllt sein. Jede Teilbedingung muss vollständig sein.“
- Bewahre das Leerzeichen vor `%` in `'Lina %'` und `'Felix %'`, damit der vollständige Vorname gemeint ist.

**6 · Klammern und Klauselreihenfolge**

- Sichere das im Modul erklärte Klammerbeispiel:

  ```sql
  SELECT *
  FROM users
  WHERE (name LIKE 'Lina %' OR name LIKE 'Hailey %')
    AND city = 'Berlin'
  ```

- Kurzer Auftrag: „Zeige alle Mitglieder aus Berlin, deren Vorname Lina oder Hailey lautet.“ Merksatz: „AND bindet stärker als OR. Die Klammern sorgen hier dafür, dass die Stadtbedingung für beide Vornamen gilt.“
- Schließe mit der bekannten Klauselreihenfolge `SELECT → FROM → WHERE → ORDER BY → LIMIT` und dem bereits in der Modulzusammenfassung vorhandenen Beispiel:

  ```sql
  SELECT username, centimeters
  FROM users
  WHERE centimeters < 180
  ORDER BY centimeters DESC
  LIMIT 5
  ```

- Begleittext: „Zuerst werden passende Zeilen ausgewählt, danach werden sie für die Ausgabe sortiert und begrenzt.“ ORDER BY und LIMIT hier nur als Wiederaufnahme sichern.

## 4. Didaktische und fachliche Grenzen

Das Blatt ist eine kompakte Sicherung mit Musterlösungen, keine Sammlung sämtlicher Modulaufgaben. Verwende ausschließlich bereits erarbeitete Inhalte und Beispiele. Keine neuen Übungen, auszufüllenden Bereiche oder zusätzlichen Quizfragen; keine Erweiterung um JOIN, COUNT, GROUP BY, BETWEEN, IN, `_` als LIKE-Platzhalter oder neue NULL-Syntax.

Formuliere Arbeitsaufträge kurz und konkret. Erläutere Fachbegriffe am Beispiel. Ergebnisse, Zeilenzahlen und Spaltenbezeichnungen müssen zur tatsächlichen CSV passen. Kürzungen mit „Ausschnitt“ beziehungsweise Auslassungszeichen kennzeichnen. Ohne ORDER BY keine bestimmte Trefferreihenfolge als garantiert darstellen. Keine erfundenen Datensätze oder Ergebnisse.

## 5. Dateien und Einbindung

Erzeuge im Ordner `faecher/informatik/klasse-9/2-Datenbanken/`:

- `sicherungsblatt-aufgabe-3-loesungen.tex`
- `sicherungsblatt-aufgabe-3-loesungen.pdf`

Binde den Download mit dem vorhandenen Lehrercode-Verfahren in den letzten Reiter von Aufgabe 3 ein. Er muss auch ohne bestandenes Quiz erreichbar sein. Nutze die vorhandene `unlockSolution`-Logik und die Downloadgestaltung der Datenbankmodule aus Informatik 10, Aufgaben 2 und 3. Der Downloadbutton ist zunächst verborgen; die Codeeingabe steht in einem eingeklappten details-Bereich. Verwende einen passenden Code nach dem Projektschema und aktualisiere `lehrercodes-dekodierung.tex` sowie das zugehörige PDF. Existiert bereits ein Code für genau dieses Modul, verwende ihn weiter.

Aufgabe 3 besitzt derzeit einen gemeinsamen Abschlussreiter mit Zusammenfassung und freigeschalteter Übersicht. Platziere den Download dort außerhalb des erst nach Quizbestehen sichtbaren Bereichs. Bei einem zusätzlichen eigenständigen Auswertungsreiter ist der Download entsprechend AGENTS.md auch dort anzubieten; gleichzeitig vorhandene Kopien benötigen eindeutige IDs.

Halte Änderungen lokal. Lernaufgaben, Quiz, Auswertungsserver und Datenbestand werden für diesen Auftrag nicht erweitert. Bestehende fremde Änderungen bleiben erhalten.

## 6. Prüfung und Übergabe

Prüfe alle verwendeten Abfragen und dargestellten Ergebniswerte gegen die CSV. Kompiliere die LaTeX-Dateien, rendere jede neue PDF-Seite als Bild und prüfe sie visuell. Vergleiche das Sicherungsblatt direkt mit dem PDF zu Aufgabe 2: Kopf- und Fußzeilen, Farben, Boxen, Schriftgrößen, Abstände, Tabellendarstellung und Informationsdichte müssen zusammenpassen.

Behebe Überläufe, abgeschnittene Tabellenköpfe, ungünstige Umbrüche und zu kleine Schrift. Prüfe Download, falschen und richtigen Lehrercode sowie Erreichbarkeit vor Quizbestehen. Kontrolliere, dass Code und Dekodierdatei übereinstimmen und die vorhandene Modulbedienung einschließlich gespeicherter Eingaben erhalten bleibt. Führe `git diff --check` aus. Keine LaTeX-Hilfsdateien oder Renderbilder als Ergebnisse ablegen.

Übergebe die TeX-Quelle und das fertige PDF mit einer kurzen Angabe zu Seitenzahl, durchgeführten Prüfungen und gegebenenfalls noch offenen Punkten.
