# Prompt: Informatik 9 · Datenbanken · Aufgabe 2 – Erste SQL-Abfragen

Aufruf: `/lernmodul-loop` mit dem folgenden Text als Aufgabenbeschreibung.

---

Erstelle das Lernmodul **Aufgabe 2 – Erste SQL-Abfragen** für Informatik
Klasse 9, Einheit Datenbanken. Es ist die zweite Aufgabe der Einheit und führt
nach „Aufgabe 1 – Warum Datenbanken?" in einfache SQL-Abfragen auf der Tabelle
`users` des InstaHub ein.

## Dateien und Einbindung

- Neue Seite `faecher/informatik/klasse-9/2-Datenbanken/aufgabe2.html` mit
  `aufgabe2.js` und bei Bedarf `aufgabe2.css`.
- Menüeintrag in `faecher/informatik/klasse-9/index.html` direkt hinter
  Aufgabe 1: **Aufgabe 2** – „Erste SQL-Abfragen".
- Kein Sicherungsblatt und keine Lehrercode-Box (nicht beauftragt). Kein
  Wiederholungs-Quiz.

## Quellen (inhaltliche Grundlage)

- Präsentation `faecher/informatik/klasse-9/materialien-db/Inf9-Instahub.pptx`,
  **Folien 23 bis 29**:
  - Folie 23: Motivation – Unternehmen möchten im InstaHub Werbung schalten und
    vorher die Zielgruppe kennenlernen. Auftrag: „Erstelle eine Übersicht über
    die Geburtsdaten aller Mitglieder."
  - Folie 24: Eine Abfrage gibt bestimmte Informationen aus einer
    Datenbanktabelle wieder als Tabelle aus; jedes DBS stellt dafür eine
    Abfragesprache bereit, die gebräuchlichste ist SQL.
  - Folie 25: DB-Schema von `users` und die Abfrage
    `SELECT birthday FROM users`.
  - Folie 26: Projektion – Syntax `SELECT Spalte1, Spalte2, … FROM Tabellenname`
    und `SELECT * FROM Tabellenname` für die gesamte Tabelle.
  - Folien 27–29: Arbeitsaufträge zum AB.
- Arbeitsblatt `faecher/informatik/klasse-9/materialien-db/abfragenInstaHub_01.docx`
  (Abschnitte Projektion, ORDER BY, DISTINCT, LIMIT). Die Erklärtexte zu
  ORDER BY, DISTINCT und LIMIT inhaltlich von dort übernehmen, aber kürzen.

## Referenzimplementierungen (verbindlich prüfen, nicht neu erfinden)

1. **SQL-Auswertung:** Informatik 10, Datenbanken, Aufgabe 5
   (`faecher/informatik/klasse-10/1-Datenbanken/aufgabe5.html`, `sql-lab.js`,
   `sql-lab-core.mjs`, `sql-lab.css`, `users.csv`). Von dort übernehmen:
   SQL-Editor je Aufgabe, **Prüfen-Button je Aufgabe**, Anzeige der
   Ergebnisrelation, Vergleich über `compareRelations` (Optionen `columnOrder`,
   `rowOrder`, flexible Projektion), Fehlerdiagnose über `diagnoseSqlTask`,
   `diagnoseSqlError`, `validateSelectStatement`, gestufte Hilfen (`hints`),
   Schema-Karte der Tabelle `users`, „Kurz erklärt"-Karte (wie
   `aggregate-info`), Datenbank im Browser über sql.js-Worker mit `users.csv`.
2. **Design der Einführung:** Informatik 11, KI, Aufgabe 3a
   (`faecher/informatik/klasse-11/1-Kuenstliche-Intelligenz/aufgabe3.html`,
   Reiter „Einführung", `#split-intro`): Fortschrittsleiste mit benannten
   Phasen, Stepper „Zurück · x von n · Weiter", Erklärtext mit `aria-live`,
   links die Visualisierung, rechts eine Tabellenkarte, die sich Schritt für
   Schritt füllt, Hinweis „**Klicke** dich zunächst durch die Animation …".
   Zusätzlich die bereits vorhandene SQL-Schrittfolge `renderIntro` in
   `sql-lab.js` (Informatik 10, Aufgabe 5: hervorgehobene Klausel, echter
   Ausschnitt aus `users`, Zwischen- und Ergebnisrelation) als technische
   Vorlage nutzen.
3. **Abschlussquiz:** Informatik 10, Datenbanken, `#final-quiz` bzw.
   `FINAL_QUIZ` in `sql-lab.js`; `manifest-quizaufgaben.txt` gilt.
4. **Seitengerüst Klasse 9:** `faecher/informatik/klasse-9/2-Datenbanken/aufgabe1.*`
   (bindet CSS und `tab-navigation.mjs` aus Klasse 10 per relativem Pfad ein).

Technische Vorgabe: `sql-lab.js` und `sql-lab-core.mjs` in Klasse 10 **nicht
verändern** (drei Seiten der Klasse 10 hängen davon ab; `sql-lab.js` hat
zurzeit uncommittete Änderungen). Stattdessen `sql-lab-core.mjs`,
`tab-navigation.mjs`, `sql-lab.css` und `users.csv` aus Klasse 10 per
relativem Pfad importieren bzw. laden. Die Tabelle `users.csv` nicht kopieren.

## Reiterstruktur

Reiter sind jederzeit frei wechselbar. Jeder Reiter endet mit einem
Weiter-Button zum nächsten Reiter. Alle Eingaben (SQL-Texte, Feedback,
Quiz-Auswahl, Stepper-Position, aktiver Reiter) werden im `localStorage`
gesichert (eigener Schlüssel, z. B. `informatik9-datenbanken-aufgabe2-v1`) und
beim Zurückkehren wiederhergestellt. Ein Button „Modul neu beginnen" wie in
Informatik 10, Aufgabe 5.

### Reiter 1 – Einführung: SELECT und FROM (Entdecken)

Schritt-für-Schritt-Animation im Design von Informatik 11, Aufgabe 3a, mit
einem echten Ausschnitt aus `users` (wenige Zeilen, wenige Spalten, darunter
`username`, `name`, `birthday`, `city`). Vorschlag für die Bilder:

1. **Situation:** Werbekunden möchten die Mitglieder des InstaHub kennenlernen.
   Leitfrage: Wie alt sind die Mitglieder? (Folie 23)
2. **Abfrage:** Eine Abfrage holt gezielt Informationen aus einer Tabelle und
   gibt sie wieder als Tabelle aus. Die Sprache dafür heißt SQL. (Folie 24)
3. **Tabelle `users`:** Ausschnitt der Tabelle mit Schema
   `users(id, username, name, birthday, city, …)`. (Folie 25)
4. **FROM:** `FROM users` wird hervorgehoben – die Tabelle wird ausgewählt.
5. **SELECT:** `SELECT birthday` wird hervorgehoben – die Spalte `birthday`
   wird in der Tabelle markiert, die übrigen Spalten treten zurück.
6. **Ergebnisrelation:** Nur noch die Spalte `birthday` bleibt übrig.
7. **Mehrere Spalten:** `SELECT username, birthday FROM users` – die
   Ergebnisrelation enthält beide Spalten in der angegebenen Reihenfolge.
8. **Alle Spalten:** `SELECT * FROM users` gibt die ganze Tabelle aus.

Am Ende ein Merke-Kasten mit der Syntax aus Folie 26 und dem Begriff
**Projektion** (Auswahl von Spalten). Der Begriff erscheint erst nach dem
Beispiel. In diesem Reiter noch kein ORDER BY, DISTINCT oder LIMIT.

### Reiter 2 – Spalten auswählen (Anwenden)

Schema-Karte `users` sichtbar. Aufgaben aus dem AB (Nummern in Klammern nur
zur Orientierung, im Modul fortlaufend nummerieren):

1. (AB 1) **Zeige** alle Einträge der Tabelle `users` an. → `SELECT * FROM users`
2. (AB 2) **Gib** alle Benutzernamen (`username`) aus. → `SELECT username FROM users`
3. (AB 4) Aus welchen Ländern stammen die Mitglieder? **Gib** neben dem Land
   auch den jeweiligen Namen (`name`) aus. → `SELECT name, country FROM users`
   (Spaltenreihenfolge egal).

AB-Aufgabe 3 entfällt (Spalte `role`).

### Reiter 3 – Sortieren mit ORDER BY

Kurze „Kurz erklärt"-Karte nach dem AB: Syntax
`SELECT … FROM … ORDER BY Spaltenname [ASC | DESC]`, ASC aufsteigend,
DESC absteigend, ohne Angabe gilt ASC. Möglichst mit einem kleinen
Vorher-nachher-Beispiel an drei Zeilen. Danach:

4. (AB 5) **Ordne** alle Mitglieder nach ihrem Benutzernamen in alphabetischer
   Reihenfolge. → `SELECT * FROM users ORDER BY username`
5. (AB 6) **Ordne** die Mitglieder nach ihrer Größe. Gib Benutzernamen, Namen
   und Größe aus, das größte Mitglied steht oben.
   → `SELECT username, name, centimeters FROM users ORDER BY centimeters DESC`
6. (AB 7) **Ordne** die Mitglieder aufsteigend nach ihrem Geburtsdatum.
   **Gib** anschließend an, wer der jüngste Nutzer ist und wie alt er ist.
   → `SELECT * FROM users ORDER BY birthday`; zusätzlich Eingabe von
   Benutzername und Alter.

Reihenfolge wird geprüft (`rowOrder: true`). Diagnosen mindestens: fehlendes
ORDER BY, ASC statt DESC bzw. umgekehrt, falsche Sortierspalte.

### Reiter 4 – Doppelte Werte vermeiden: DISTINCT

„Kurz erklärt" nach dem AB, aber **ohne die Spalte `role`**: Beispiel mit
`gender` (`SELECT gender FROM users` gegenüber `SELECT DISTINCT gender FROM users`).
Danach:

7. (AB 10) Aus welchen unterschiedlichen Wohnorten stammen die Mitglieder?
   → `SELECT DISTINCT city FROM users`
8. (neu) Aus welchen Ländern stammen die Mitglieder? **Gib** jedes Land nur
   einmal aus. → `SELECT DISTINCT country FROM users`. Im Feedback bzw. einer
   Anschlussfrage den Vergleich zu Aufgabe 3 ziehen (317 Zeilen gegenüber
   wenigen Ländern).

AB-Aufgaben 9 und 11 entfallen. Diagnose: DISTINCT fehlt (Anzahl der Zeilen
viel zu groß).

### Reiter 5 – Zeilen begrenzen: LIMIT

„Kurz erklärt" nach dem AB (langsames Netz, LIMIT steht immer am Ende,
Beispiel `SELECT username FROM users LIMIT 25`). Danach:

9. (AB 12) **Zeige** nur 3 Mitglieder an. → `SELECT * FROM users LIMIT 3`
10. (AB 13) **Zeige** nur die 4 jüngsten Mitglieder an.
    → `SELECT * FROM users ORDER BY birthday DESC LIMIT 4`

Diagnosen: ORDER BY fehlt, ASC statt DESC („das sind die ältesten"), LIMIT vor
ORDER BY (Reihenfolge der Klauseln).

### Reiter 6 – Für die Schnellen

Gemischte Aufgaben mit SELECT, FROM, ORDER BY, DISTINCT und LIMIT, gleicher
Prüfmechanismus. Vorschläge (Planer wählt 5–7 aus, prüft die Ergebnisse gegen
`users.csv`):

- (AB 8) **Kehre** die Reihenfolge der Tabelle `users` um. → `ORDER BY id DESC`
- **Gib** die Wohnorte ohne Dopplungen in alphabetischer Reihenfolge aus.
  → `SELECT DISTINCT city FROM users ORDER BY city`
- **Zeige** Benutzername und Größe der 4 größten Mitglieder an. (eindeutig:
  genau vier Mitglieder mit 195 cm)
- **Gib** Benutzername und Wohnort aller Mitglieder sortiert nach Wohnort aus.
- **Korrigiere** die Anweisung `SELECT username FROM users LIMIT 5 ORDER BY
  centimeters DESC` (Vorbelegung über `initialSql` wie Aufgabe b2-5 in
  Informatik 10).
- **Gib** die Namen der 10 zuletzt registrierten Mitglieder aus
  (`created_at`).

### Reiter 7 – Abschlussquiz

Pflicht. Multiple Choice mit Auswahlkästchen, mindestens zwei Fragen mit
mehreren richtigen Antworten, 4–5 Fragen, Komponente aus Informatik 10
wiederverwenden. Typische Fehlvorstellungen als wählbare Falschantworten, z. B.:
„SELECT legt fest, welche Zeilen ausgegeben werden", „ORDER BY sortiert ohne
Angabe absteigend", „DISTINCT löscht doppelte Zeilen aus der Tabelle",
„LIMIT darf vor ORDER BY stehen". Keine Frage zu `role` oder `is_active`.
Darunter bzw. im selben Reiter eine kurze Zusammenfassung (Merke) zu SELECT,
FROM, ORDER BY, DISTINCT und LIMIT wie in Informatik 10, Aufgabe 5.

## Feedback und Hilfen

- Rückmeldung unterscheidet korrekt / teilweise korrekt / noch nicht korrekt
  und erklärt das fachliche Warum (z. B. „Deine Ergebnisrelation hat 317
  Zeilen, gesucht ist jede Stadt nur einmal – welches Schlüsselwort entfernt
  Dopplungen?"). Keine Lösung beim ersten Fehlversuch.
- Jede Aufgabe ab Reiter 3 hat drei gestufte Hilfen (Hinweis → Denkansatz →
  Teillösung).
- Die Ergebnisrelation der eigenen Abfrage wird immer angezeigt; lange
  Relationen scrollen innerhalb der Tabellenkarte.
- Groß-/Kleinschreibung der Schlüsselwörter, Zeilenumbrüche und ein
  abschließendes Semikolon dürfen keine Rolle spielen.

## Hinweise zu den Daten (vom Planer zu berücksichtigen)

- `users.csv` (Klasse 10) hat 317 Zeilen. Der Datensatz `admin` hat `NULL` in
  `birthday`, `centimeters`, `city`, `country` und `gender`. In SQLite stehen
  `NULL`-Werte bei ASC vorn und bei DESC hinten: In Aufgabe 6 steht `admin`
  also ganz oben, in Aufgabe 8 erscheint `NULL` als eigenes „Land". Das im
  Feedback oder in einem Hinweis kurz erklären, statt es zu verstecken.
- Jüngstes Mitglied: `gartenlesemaus`, geboren 2010-07-07. Das Alter in
  Aufgabe 6 aus dem aktuellen Datum berechnen, nicht fest eintragen.
- Bei Größe (Aufgabe 5) gibt es Gleichstände (vier Mitglieder mit 195 cm).
  Die Reihenfolgeprüfung muss jede Reihenfolge innerhalb gleicher Werte
  akzeptieren. Die „5 größten" (AB 14) sind wegen Gleichstands nicht eindeutig
  und deshalb nicht verwendet.
- Aufgabe 9 („3 Mitglieder"): klären, ob beliebige drei vollständige
  Datensätze akzeptiert werden oder die ersten drei. Empfehlung: genau drei
  Zeilen aus `users`, jede Spaltenauswahl erlaubt.
- Die Spalte `role` wird in keiner Aufgabe und keiner Quizfrage verwendet.

## Didaktik und Gestaltung

- Aufgabentexte kurz (höchstens zwei Sätze), Operatoren fett.
- Reihenfolge je Reiter: kurz erklären am Beispiel → Syntax → anwenden.
- Kontext InstaHub durchgehend beibehalten (Werbekunden, Mitglieder,
  Datenbanklabor wie in Informatik 10). Hinweis, dass die Daten im Labor nicht
  mit dem eigenen InstaHub übereinstimmen.
- Design, Farben, Karten und Buttons aus den Referenzen; kompakt, auf
  Smartphone, Tablet und Desktop nutzbar, kein horizontales Scrollen außer in
  Ergebnistabellen.
