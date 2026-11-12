# Erstellungsprompt: Inf9 · Datenbanken · Sicherungsblatt zu Aufgabe 6

Erstelle das **Sicherungsblatt mit Musterlösungen zu Aufgabe 6 – Gruppierungen mit Group BY** für Informatik Klasse 9, Einheit Datenbanken. Binde es per Lehrercode in Aufgabe 6 ein und ergänze die Präsentation der Einheit.

Leitidee: **möglichst wenig Text, viel Visualisierung durch Tabellenausschnitte.** Ganz oben steht der Endzustand der Einführungsanimation. Er zeigt: `GROUP BY` legt für jeden Wert der Gruppenspalte einen eigenen „Topf“ (eine Gruppe) an. Alle Datensätze mit diesem Wert kommen in denselben Topf.

## 1. Verbindliche Quellen

- `AGENTS.md`, `manifest-allgemein.txt` vollständig (insbesondere Abschnitt 3 zu Sicherungsblättern), `manifest-datenbankaufgaben.txt` vollständig.
- Inhaltliche Hauptquelle: `aufgabe6.js` (Reiter, `TASKS`, `INTRO_EXPECTED`, `renderIntro`, `explainContent`, `renderSummary`). Alle Pfade beziehen sich auf `faecher/informatik/klasse-9/2-Datenbanken/`.
- Direkte Struktur- und Gestaltungsvorlage: `sicherungsblatt-aufgabe-5-loesungen.tex` und das zugehörige PDF; ergänzend die Blätter zu den Aufgaben 2–4. Die PDFs visuell ansehen.
- Daten: `../../klasse-10/1-Datenbanken/users.csv`, `../../klasse-10/1-Datenbanken/photos.csv` (Trennzeichen `;`, `NULL` = fehlender Wert).

`aufgabe6-prompt.md` und `aufgabe6-spezifikation.md` beschreiben einen älteren Aggregat-Stand und sind hier **keine** Quelle. Maßgeblich ist die aktuelle Implementierung.

## 2. Gestaltung

Präambel, Farben, Schriften, Ränder, `\pageheader`, `\pagefooter`, `\sectiontitle`, `\workbox`, `\sqlbox`, `\sqlkw`, `\merkebox`, `\smallcaption` und `\miniresult` unverändert aus dem Blatt zu Aufgabe 5 übernehmen. Kopf: „Aufgabe 6 -- Gruppierungen mit Group BY“, „Sicherungsblatt“, Feld „LÖSUNGEN“. Fußzeile: „Sicherungsblatt · Aufgabe 6“.

Abfolge wie bisher: **Arbeitsauftrag (`\workbox`) → SQL-Anweisung (`\sqlbox`) → Tabellenausschnitt der Ergebnisrelation.** Gleichartige Fälle stehen nebeneinander in Minipages wie in Aufgabe 5.

Textregeln:

- Arbeitsaufträge wörtlich aus `TASKS` übernehmen, ohne Markdown-Sternchen.
- Pro Abschnitt höchstens **eine** `\merkebox` mit höchstens zwei kurzen Sätzen. Keine Fließtextabsätze; Erläuterungen nur als Pfeilbeschriftung oder `\smallcaption`.
- Jede gekürzte Tabelle bekommt eine Beschriftung der Form „Ausschnitt: 3 von 46 Zeilen“ und eine Zeile `\ldots`.
- Ohne `ORDER BY` steht unter der Tabelle „Reihenfolge nicht festgelegt“. Die gezeigten Zeilen dürfen in beliebiger Reihenfolge stehen, aber nichts darf eine Sortierung vortäuschen.

**Umfang: eine A4-Seite** wie bei den Blättern zu Aufgabe 4 und 5. Eine zweite Seite ist nur erlaubt, wenn die Einstiegsgrafik sonst gedrängt wirkt. Dann enthält Seite 1 die Abschnitte 1–2 und Seite 2 die Abschnitte 3–4. Fußzeile entsprechend „1 / 2“, „2 / 2“. Schrift nicht unter die Größen der Vorlage verkleinern.

## 3. Inhalt

### 1 · GROUP BY legt für jeden Wert eine Gruppe an (Einstiegsgrafik, volle Breite)

Endzustand der Einführungsanimation (Schritte 8–10) als **statische Grafik von links nach rechts**:

```
[SQL-Box]  →  [Ausschnitt users]  →  [3 Töpfe mit COUNT(*)]  →  [Ergebnisrelation]
```

- **SQL-Box** (über der Grafik oder links daneben):

  ```sql
  SELECT city, COUNT(*) AS Anzahl
  FROM users
  GROUP BY city
  ```

- **Ausschnitt aus users (6 Zeilen)**, Spalten `id | username | city`, Reihenfolge wie in `INTRO_EXPECTED`:

  | id | username | city |
  |---|---|---|
  | 4 | koch_kicker | Berlin |
  | 2 | wanderwut_finn | München |
  | 1 | zornigerfotograf | Schwerin |
  | 34 | gartenlinse | Berlin |
  | 11 | kunstnews_luis | München |
  | 37 | musikriese | Berlin |

- **Drei Töpfe** als offene, oben breitere Behälter (TikZ; z. B. Trapez ohne Deckel oder `tcolorbox` mit offener Oberkante). Jeder Topf hat eine Aufschrift `city = 'Berlin'` usw. und enthält die passenden Zeilen als kleine Datensatzstreifen `id · username`:
  - `Berlin`: 4 · koch_kicker, 34 · gartenlinse, 37 · musikriese → `COUNT(*) = 3`
  - `München`: 2 · wanderwut_finn, 11 · kunstnews_luis → `COUNT(*) = 2`
  - `Schwerin`: 1 · zornigerfotograf → `COUNT(*) = 1`
- Jede Stadt bekommt eine eigene, dezente Farbe aus der vorhandenen Palette oder eine Abtönung davon. Mit derselben Farbe werden die Zeile im Ausschnitt, der Topf und die Ergebniszeile markiert. Die Zuordnung muss auch ohne Farbe am Stadtnamen erkennbar sein (Barrierearmut, Schwarz-Weiß-Druck).
- Pfeile vom Ausschnitt zu den Töpfen. Pfeilbeschriftung „gleicher city-Wert → gleicher Topf“. Zwischen Töpfen und Ergebnis steht „COUNT(*) zählt je Topf“.
- **Ergebnisrelation** `city | Anzahl`: Berlin 3 · München 2 · Schwerin 1. `\smallcaption`: „1 Zeile pro Gruppe – Treffer nur im Ausschnitt“.
- Kleiner Vergleich unter der Grafik, wie in Animationsschritt 9: „ohne GROUP BY: COUNT(*) = 6 · mit GROUP BY city: 3, 2, 1“.
- `\merkebox`: „GROUP BY city bildet für jeden Wert von city eine Gruppe; Zeilen mit gleichem Wert landen in derselben Gruppe. COUNT(*) zählt die Zeilen jeder Gruppe, das Ergebnis hat eine Zeile pro Gruppe – die Tabelle users bleibt unverändert.“

Fachbegriff auf dem Blatt ist **„Gruppe“**, wie im Modul. „Topf“ erscheint nur als Bild und höchstens einmal in Klammern.

### 2 · Gruppen auswerten mit COUNT und AVG (drei Minipages nebeneinander)

| Aufgabe | SQL (aus `TASKS`) | Ergebnisausschnitt |
|---|---|---|
| 1 | `SELECT gender, COUNT(*) AS Anzahl FROM users WHERE gender = 'male' OR gender = 'female' GROUP BY gender` | vollständig, 2 Zeilen: female 148 · male 148 |
| 2 | `SELECT gender, AVG(centimeters) AS Durchschnitt FROM users WHERE gender = 'male' OR gender = 'female' GROUP BY gender` | vollständig, 2 Zeilen: female ≈ 167,5 · male ≈ 178,4 |
| 3 | `SELECT city, COUNT(*) AS Anzahl FROM users WHERE city IS NOT NULL GROUP BY city` | Ausschnitt 3 von 46 Zeilen, z. B. Berlin 18 · München 24 · Schwerin 15 · `\ldots` |

- Zeige bei Aufgabe 2 den vollständigen Rohwert (167.52027…, 178.39189…) oder schreibe „gerundet“ in die Caption.
- Bei Aufgabe 3 sind Berlin, München und Schwerin gewählt, damit die Städte aus der Einstiegsgrafik wiederkehren. Die Grafik zeigte für Berlin nur drei Zeilen aus einem Ausschnitt, die vollständige Tabelle ergibt 18.
- `\merkebox`: „COUNT(*) zählt die Zeilen einer Gruppe, AVG(spalte) bildet den Mittelwert der eingetragenen Werte. Hinter SELECT stehen die Gruppenspalte und Aggregatfunktionen.“

### 3 · Gruppen filtern mit HAVING

- Links: kleine Vorher-nachher-Visualisierung aus dem Erklärbeispiel des Reiters „Gruppen filtern mit HAVING“ mit denselben drei Töpfen wie in der Einstiegsgrafik: „Vor HAVING“ Berlin 3 · München 2 · Schwerin 1 → „Nach HAVING COUNT(*) > 2“ Berlin 3. München und Schwerin werden **durchgestrichen bzw. ausgegraut und zusätzlich mit ✗ markiert**.
- Rechts: Aufgabe 6 mit Arbeitsauftrag, SQL

  ```sql
  SELECT city, COUNT(*) AS Anzahl
  FROM users
  WHERE city IS NOT NULL
  GROUP BY city
  HAVING COUNT(*) > 2
  ```

  und Ausschnitt 3 von 26 Zeilen (z. B. Berlin 18 · Genf 3 · München 24 · `\ldots`). Genf zeigt die Grenze: genau 3 > 2.
- Zweispaltige Mini-Tabelle als Ersatz für Fließtext:

  | Klausel | filtert … | Zeitpunkt |
  |---|---|---|
  | `WHERE` | einzelne Zeilen | vor `GROUP BY` |
  | `HAVING` | ganze Gruppen | nach `GROUP BY` |

- Klauselreihenfolge als blaue Pfeilzeile wie in Aufgabe 5: **SELECT → FROM → WHERE → GROUP BY → HAVING → ORDER BY → LIMIT**.

### 4 · Fotos pro Person zählen und sortieren (zwei Minipages)

- Aufgabe 7: `SELECT user_id, COUNT(*) AS Anzahl FROM photos GROUP BY user_id`. Davor ein kleiner Ausschnitt aus `photos` (`id | user_id`) mit echten Zeilen von zwei User-IDs. Daneben der Ergebnisausschnitt, z. B. user_id 1 → 6, 2 → 4, 3 → 3, `\ldots` (3 von 316 Zeilen, Reihenfolge nicht festgelegt). Werte für den `photos`-Ausschnitt aus der CSV wählen und prüfen.
- Aufgabe 9: `SELECT user_id, COUNT(*) AS Anzahl FROM photos GROUP BY user_id ORDER BY Anzahl DESC, user_id ASC LIMIT 3`. Vollständige Ergebnisrelation: 85 · 12, 187 · 12, 265 · 12. Caption: „Gleichstand → user_id aufsteigend“.
- `\merkebox`: „GROUP BY garantiert keine Reihenfolge. Für eine bestimmte Sortierung braucht es ORDER BY.“

### Nicht aufnehmen

Aufgaben 4, 5 und 8 (die Aufgaben 5 und 8 haben in diesen Daten leere Ergebnisse) sowie die freiwilligen Aufgaben 10–12 kommen nicht auf das Blatt. Ebenfalls nicht: Quizfragen, neue Übungen, Lückenfelder und Syntax, die über das Modul hinausgeht (kein JOIN, kein `COUNT(DISTINCT …)`, kein `ROUND`, keine Gruppierung nach mehreren Spalten). `NULL` taucht nur als `IS NOT NULL` in den gezeigten Abfragen auf. Es gibt keinen Erklärtext zur `NULL`-Gruppe.

## 4. Fachliche Prüfung

Führe jede gezeigte Abfrage gegen die CSV-Daten aus, z. B. mit Python + SQLite und `NULL` → fehlender Wert, und übertrage nur geprüfte Werte. Referenzwerte dieses Prompts (bei Abweichung gilt die CSV, dann den Prompt-Wert melden):

- users: 317 Zeilen; female 148, male 148; AVG female 167.52…, male 178.39…
- Stadtgruppen ohne NULL: 46; davon mit mehr als 2 Mitgliedern: 26; Berlin 18, München 24, Schwerin 15, Genf 3
- photos: 316 Gruppen; Top 3 mit 12 Fotos: 85, 187, 265

## 5. Dateien und Einbindung in Aufgabe 6

Erzeuge in `faecher/informatik/klasse-9/2-Datenbanken/`:

- `sicherungsblatt-aufgabe-6-loesungen.tex`
- `sicherungsblatt-aufgabe-6-loesungen.pdf`

**Lehrercode: `M7WD-4RB3`** (Schema `FXXX-KXAX`: `M` = Informatik, `4` = Klasse 9, `B` = Aufgabe 6; der Code ist im Projekt noch nicht vergeben).

- `aufgabe6.html`: `<template id="solution-download-template">` wortgleich nach `aufgabe5.html` einfügen. Überschrift „Sicherungsblatt zu Aufgabe 6“, Code `M7WD-4RB3`, Link `sicherungsblatt-aufgabe-6-loesungen.pdf`, Download-Button zunächst `hidden`, Codeeingabe im eingeklappten `details.solution-reveal`, `name="solution-code"`.
- `aufgabe6.js`: Den Download wie in `aufgabe5.js` mit `appendSolutionDownloadFromTemplate(panel)` und `bindSolutionCodePersistence(panel,state,save)` im letzten Reiter „Abschlussquiz und Auswertung“ einhängen. Der Download liegt **außerhalb** der erst nach bestandenem Quiz sichtbaren Übersicht und ist ohne jede Bearbeitung erreichbar; einzige Hürde ist der Lehrercode. Aufgabe 6 hat keinen weiteren Auswertungsreiter, daher genügt eine Kopie.
- Cachebuster von `aufgabe6.js` in `aufgabe6.html` erhöhen.
- `lehrercodes-dekodierung.tex` (Wurzelordner): nach der Zeile zu Datenbanken Aufgabe 5 die Zeile „Sicherungsblatt Datenbanken Aufgabe 6 & Informatik, Klasse 9, Datenbanken, Aufgabe 6 & `M7WD-4RB3`“ ergänzen und `lehrercodes-dekodierung.pdf` neu bauen.

Alles Übrige im Modul (Aufgaben, Quiz, Speicherung, Animation) bleibt unverändert.

## 6. Präsentation aktualisieren (`informatik-material`, lokal)

Das Repository `informatik-material` liegt neben `unterricht` (`C:/Users/Franke/Documents/git/informatik-material`). Der Auftrag autorisiert die folgenden Änderungen dort.

- Quelle: `presentations/modules/inf9-datenbanken/presentation.json`. Ausgabe: `inf9/2-Datenbanken/inf9-datenbanken.html`.
- Existiert noch keine Folie zu Aufgabe 6, wird hinter „Aufgabe 5: Muster und Bedingungen verknüpfen“ die Folie **„Aufgabe 6: Gruppierungen mit Group BY“** im vorhandenen `kind: "module"`-Design ergänzt. Sie enthält:
  - `websitePath` zu `faecher/informatik/klasse-9/2-Datenbanken/aufgabe6.html`;
  - den direkten Link `https://www.florian-franke.org/faecher/informatik/klasse-9/2-Datenbanken/aufgabe6.html`;
  - einen neuen QR-Code `qr/datenbanken-aufgabe6.svg` mit genau diesem Ziel, erzeugt wie die QR-Codes zu den Aufgaben 2–5;
  - den Lehrercode `M7WD-4RB3`, erst im vorhandenen Klickschritt sichtbar, wie bei den Folien zu den Aufgaben 2–5.

  Existiert die Folie bereits, nur Lehrercode, Titel, Link und QR prüfen und ergänzen.
- Die Codes der Aufgaben 2–5 (`M6QW-4TP9`, `M8KR-4TM7`, `M3VG-4K7L`, `M5HN-4QX8`) gegen die HTML-Seiten und `lehrercodes-dekodierung.tex` abgleichen. Abweichungen melden, nicht stillschweigend ändern.
- `README.md` des Quelldecks aktualisieren: Folienzahl, Pfade, Codes.
- Mit `presentations/scripts/build-html-presentation.mjs … --overwrite` neu bauen und `presentations/scripts/test-module-deck.mjs` ausführen. Im Browser alle Folien, den Einblendschritt des Codes, den Link, den dekodierten QR-Inhalt und die Referentenansicht prüfen.

## 7. Prüfung und Übergabe

- LaTeX kompilieren, jede PDF-Seite als Bild rendern und direkt neben das PDF zu Aufgabe 5 legen. Kopf, Fuß, Farben, Boxen, Schriftgrößen und Tabellenstil müssen übereinstimmen.
- Einstiegsgrafik prüfen: Pfeile treffen Zeilen und Töpfe, nichts überlappt, und in Graustufen ist alles lesbar.
- Im Browser prüfen: falscher Code → Meldung, richtiger Code → Download sichtbar, erreichbar ohne Quiz, gespeicherter Code bleibt nach dem Neuladen erhalten. Code in HTML, Dekodiertabelle und Präsentation identisch.
- `git diff --check`. Keine LaTeX-Hilfsdateien (`.aux`, `.log`, `.fls`, `.fdb_latexmk`) oder Renderbilder einchecken.
- Übergabe: TeX, PDF, Seitenzahl, durchgeführte Prüfungen, Präsentationsstand und offene Punkte.
