# Prompt: Informatik 9 · Datenbanken · Aufgabe 3 – Datensätze filtern mit WHERE

Aufruf: `/lernmodul-loop` mit dem folgenden Text als Aufgabenbeschreibung.
Dieser Prompt beauftragt die spätere Umsetzung; er ist noch kein gebautes Lernmodul.

---

Erstelle das Lernmodul **Aufgabe 3 – Datensätze filtern mit WHERE** für
Informatik Klasse 9, Einheit Datenbanken. Es schließt an **Aufgabe 2 – Erste
SQL-Abfragen** an. SELECT, FROM, ORDER BY, DISTINCT und LIMIT sind bekannt.
Neu erarbeitet werden WHERE, Vergleichsoperatoren, LIKE mit `%` sowie die
Verknüpfung von Bedingungen mit AND und OR, einschließlich Klammern.

## 1. Vorgehen und verbindliche Grundlagen

Führe den in `AGENTS.md` beschriebenen Ablauf Planung → Bau → regelbasierte
Vorprüfung → fachlich-didaktische Endabnahme aus. Die Planung legt die
wörtlichen Schülertexte und zwei getrennte Akzeptanzkriterien-Listen vor.
Für Codex gelten die dort festgelegten Modelle: GPT-6 Sol (`high`) für
Planung und Endabnahme, GPT-6 Luna (`high`) für Bau und GPT-6 Luna (`medium`)
für Vorprüfung. Beachte die begrenzten Korrekturschleifen.

Lies vor der Planung vollständig:

- `AGENTS.md` und gegebenenfalls einschlägige lokale Anweisungen,
- `manifest-allgemein.txt`,
- `manifest-datenbankaufgaben.txt`,
- `manifest-quizaufgaben.txt`.

Nutze als fachliche Grundlage ausschließlich die passenden Inhalte unter
`faecher/informatik/klasse-9/2-Datenbanken/material-instahub/`:

- `Präsentation-WHERE.pptx`,
- `Abfragen-WHERE.docx`,
- `Abfragen-WHERE-Lsg.docx`,
- bei Bedarf `Inf9-Instahub.pptx` zur Einordnung des InstaHub-Kontexts.

Die in der Präsentation genannte Datei **abfragenInstaHub_02** entspricht
inhaltlich **Abfragen-WHERE** einschließlich der genannten Lösungsdatei.
Suche dafür keine zusätzliche Datei und verwende nicht das Arbeitsblatt zu
Aggregatfunktionen.

Die vier Übungsblöcke der Präsentation sind verbindlich:

| Block | Originalaufgaben | Inhalt | Präsentationsfolien |
| --- | --- | --- | --- |
| A | 1–5 | Einfache Selektion mit Gleichheit | 1–3 |
| B | 6–10 | Zahlen, Datumswerte und Ungleichheit | 4, ergänzend Vergleichsoperatoren auf Folie 2 |
| C | 11–14 | Mustersuche mit LIKE und `%` | 5–6 |
| D | 15–22 | AND, OR und Klammern | 7–12 |

Pro Block stehen **höchstens drei SQL-Aufgaben im regulären Lernweg**.
Weitere ausgewählte Aufgaben stehen gesammelt im Reiter **Für die Schnellen**,
dort nach denselben vier Blöcken gegliedert. Die Auswahl unten ist verbindlich.
Originalnummern dienen der Quellenzuordnung im Code bzw. in der Spezifikation;
im Modul erhalten die Aufgaben eine verständliche fortlaufende Nummerierung.

## 2. Referenzen und technische Wiederverwendung

Die **aktuelle Implementierung** von
`faecher/informatik/klasse-9/2-Datenbanken/aufgabe2.html`, `aufgabe2.js` und
`aufgabe2.css` ist die direkte Vorlage für Aufbau, Gestaltung und Bedienung.
Der ältere `aufgabe2-prompt.md` bildet spätere Änderungen nicht vollständig ab.

Übernimm insbesondere:

- Seitengerüst, nummerierte Reiter, Tastatursteuerung und Weiter-Navigation,
- Einführung mit benannten Phasen, Stepper, SQL-Hervorhebung und Ergebnisrelation,
- Schemaanzeige, SQL-Eingabe, Prüfbutton und Ergebnisfenster je Aufgabe,
- gestufte Hilfen, Feedbackklassen und Fortschrittsanzeige,
- Beschreibe-Aufgaben mit `DESCRIPTION_TASKS`, `renderDescriptionTask`,
  `submitDescription` und `evaluateSemanticAnswer`,
- SQL-Auswertung mit `analyzeQuery`, `referenceSql`, `isCorrect`, `evaluate`
  und `diagnoseError` sowie die zugehörigen Korrekturregeln,
- Speichern, Wiederherstellen und „Modul neu beginnen“,
- Abschlussquiz und die anschließende Aufgabenübersicht.

Verwende dieselben gemeinsamen Bausteine wie Aufgabe 2:

- `faecher/informatik/klasse-10/1-Datenbanken/sql-lab-core.mjs`
  mit `validateSelectStatement`, `sqlTokens`, `compareRelations`,
  `normalizeRelation` und `missingTextQuote`,
- `tab-navigation.mjs` und die passenden bestehenden CSS-Dateien aus demselben Ordner,
- den bestehenden sql.js-Worker unter `include/lib/sql.js/`,
- `faecher/informatik/klasse-10/1-Datenbanken/users.csv`, per relativem Pfad geladen,
- den in Aufgabe 2 eingebundenen Client `semantic-answer.mjs`,
- `faecher/informatik/quiz-fragen-pruefen.js` mit `addQuizQuestionChecks`.

Keine zweite SQL-Engine, keine neue KI-Pipeline, keine unabhängige
Quiz-Komponente und keine neue Designsprache entwickeln. Suche vor zusätzlicher
Animationslogik nach vorhandenen passenden Mustern im Projekt. Ergänze nur die
für WHERE fehlende Darstellung und Diagnose. Änderungen an gemeinsamen Dateien
klein halten und gegen betroffene Module prüfen; Aufgabe 2 muss weiter funktionieren.

## 3. Dateien, Einbindung und Daten

- Erstelle `aufgabe3.html`, `aufgabe3.js` und bei Bedarf `aufgabe3.css` unter
  `faecher/informatik/klasse-9/2-Datenbanken/`.
- Ergänze in `faecher/informatik/klasse-9/index.html` direkt hinter Aufgabe 2
  die Kachel **Aufgabe 3 – Datensätze filtern mit WHERE**.
- Hauptüberschrift: „Datensätze filtern mit WHERE“. Direkt darunter steht
  als eigene Zeile „Aufgabe 3“.
- Verwende die vorhandenen Übungsdaten; CSV und Materialdateien nicht ändern
  oder in einen neuen Datenbestand kopieren.
- Zeige das reale Schema in der Form
  `users (id: int, name: varchar(255), username: varchar(255), …)` an.
  Nutze die Schemaangaben aus Aufgabe 2; keine Attribute oder Typen erfinden.
- Übernimm den Hinweis, dass die Daten des Lernmoduls vom eigenen InstaHub abweichen können.
- Ein Sicherungsblatt und ein separates Wiederholungs-Quiz sind in diesem
  Auftrag nicht beauftragt. Entsprechende Download-Templates und Lehrercodes
  aus Aufgabe 2 deshalb nicht automatisch übernehmen.

**Wichtige Besonderheit:** Aufgabe 2 verwendet historisch bereits den
Speicherschlüssel `informatik9-datenbanken-aufgabe3-v1` und weitere
Migrationsschlüssel. Verwende für das neue Modul einen eindeutig anderen
Schlüssel, beispielsweise **`informatik9-datenbanken-aufgabe3-where-v1`**.
Übernimm oder lösche keine Speicherstände von Aufgabe 2 und ändere dessen
Schlüssel nicht beiläufig.

### Abgleich der Quellen mit den vorhandenen Übungsdaten

Der derzeitige Datensatz hat 317 Mitglieder. Mehrere Originalsuchwerte
passen nicht dazu. Übernimm deshalb die folgenden kleinen Anpassungen, ohne
das jeweilige Lernziel zu verändern:

| Original | Im Modul verwenden | Grund |
| --- | --- | --- |
| Aufgabe 2: `Germany` | `Deutschland` | Tatsächlich gespeicherter Landeswert |
| Aufgabe 3: Lautertal | Schwerin | Lautertal kommt nicht vor |
| Aufgabe 4: Emily Faber | Mia Sonntag | Emily Faber kommt nicht vor |
| Aufgabe 9: 15.01.2000 | 17.09.2007 | Passender Datensatz: Ben Neumann |
| Aufgabe 13: Zeichenfolge `42` | Zeichenfolge `fuchs` | Kein Benutzername enthält `42` |
| Aufgabe 15: Marc aus Berlin | Lina aus Berlin | Passender Datensatz vorhanden |
| Aufgabe 17: Lina oder Lorena | Lina oder Felix | Beide Alternativen haben Treffer |
| Aufgabe 21: Bea oder Naomi aus Berlin | Lina oder Hailey aus Berlin | Beide Alternativen haben Treffer in Berlin |

Prüfe diese Angaben bei der Umsetzung erneut gegen die tatsächlich geladene
CSV. Erwartete Relationen und Zeilenzahlen aus SQL berechnen, nicht anhand
dieser Angaben fest im Auswertungscode hinterlegen. Die Zuordnung und
Anpassungen gehören in die Spezifikation, nicht als technische Hinweise in
die Schüleransicht.

## 4. Reiterstruktur

Es gibt sieben jederzeit frei erreichbare Reiter. Sie sind durchgehend von
1 bis 7 nummeriert und auf einem Laptop ohne horizontales Scrollen sichtbar.
Auf kleineren Geräten dürfen sie umbrechen. Jeder Reiter außer dem letzten
erhält die vorhandene Weiter-Navigation.

### Reiter 1 – Einführung: Wie filtert WHERE?

Der erste Reiter zeigt eine **schrittweise bedienbare Animation**, in der
nicht passende Zeilen sichtbar aus der Arbeitsansicht „herausfliegen“.
Nutze den Stepper und die Gestaltung der Einführung von Aufgabe 2.

Arbeitsauftrag über der Animation:
**„Klicke dich durch die Animation. Beobachte, welche Datensätze in die
Ergebnisrelation gelangen und welche ausgefiltert werden.“**

Beispielabfrage:

```sql
SELECT username, city
FROM users
WHERE city = 'Berlin'
```

Die Animation verwendet etwa sechs echte Datensätze aus `users`, davon
mindestens zwei aus Berlin und mehrere aus anderen Städten. Stelle sie in
einer gut lesbaren kleinen Tabelle mit `id`, `username` und `city` dar.
Kennzeichne diese als Ausschnitt; die Ergebnisrelation des Ausschnitts ist
nicht die vollständige Ergebnisrelation aller 317 Mitglieder.

Verbindlicher Ablauf:

1. Zeige den Ausgangsausschnitt und die Frage: Welche Mitglieder wohnen in Berlin?
2. Hebe `FROM users` hervor: Diese Tabelle liefert die Daten.
3. Hebe `WHERE city = 'Berlin'` und die jeweils geprüfte Zeile hervor.
4. Prüfe die Zeilen nacheinander. Zeige jeweils zusätzlich zur Farbe den Text
   „Bedingung erfüllt“ oder „Bedingung nicht erfüllt“.
5. Passende Zeilen bleiben im Arbeitsausschnitt. Nicht passende Zeilen gleiten
   sichtbar seitlich aus diesem heraus und verschwinden anschließend aus der
   gefilterten Ansicht. Eine reine Farbmarkierung erfüllt den Auftrag nicht.
6. Zeige die verbleibenden Berliner Datensätze als gefilterten Zwischenstand.
7. Hebe `SELECT username, city` hervor und bilde die Ergebnisrelation mit genau
   diesen beiden Spalten. So werden Zeilenauswahl und Spaltenauswahl unterscheidbar.
8. Sichere erst nach dem Beispiel den Begriff **Selektion**.

Die Ausgangsdaten bleiben als Quelle erkennbar erhalten, etwa in einer kleinen
Referenzansicht oder durch einen jederzeit verfügbaren Ausgangsschritt. Die
Animation verändert nur eine Arbeitsdarstellung. Blende spätestens beim ersten
Herausfliegen den Hinweis ein: **„Ausgefilterte Datensätze fehlen nur im
Abfrageergebnis. Die Tabelle users bleibt unverändert.“**

Vorwärts, rückwärts und erneut abspielen müssen zuverlässig funktionieren,
auch nach Reiterwechsel und Wiederherstellung. Während einer Übergangsanimation
dürfen schnelle Klicks keine doppelten Zeilen oder widersprüchlichen Zustände
erzeugen. Die Bewegung bleibt innerhalb des Animationsbereichs und erzeugt
keinen Seitenüberlauf. Bei `prefers-reduced-motion` dieselben Schritte und
Textmeldungen ohne Flugbewegung anzeigen. Alles bleibt per Tastatur bedienbar.

Merksatz am Ende:
**„WHERE wählt die Zeilen aus, die eine Bedingung erfüllen. Diese Auswahl heißt
Selektion. SELECT legt fest, welche Spalten ausgegeben werden. Die gespeicherte
Tabelle bleibt bei dieser Abfrage unverändert.“**

### Reiter 2 – Block A: Einfache Bedingungen

Dieser Reiter **beginnt als erste Aufgabenkarte mit einer Beschreibe-Aufgabe**,
noch vor der „Kurz erklärt“-Karte und den SQL-Eingaben:

**„Beschreibe in eigenen Worten, welche Daten diese SQL-Anweisung ausgibt.“**

```sql
SELECT username, city
FROM users
WHERE city = 'München'
```

Die Schülerinnen und Schüler schreiben die Beschreibung selbst. **Scaleway
prüft und bewertet diese Freitextantwort**; es erzeugt nicht vorab die
Beschreibung. Verwende die vorhandene Oberfläche und Anbindung aus Aufgabe 2.
Die genauen Bewertungsregeln stehen in Abschnitt 6 dieses Prompts.

Danach eine kurze Erklärung mit Beispiel und Syntax für WHERE und `=`.
Text- und Datumswerte stehen in einfachen Anführungszeichen, Spaltennamen
nicht. Ausgabespalten dürfen sich von der Spalte in der Bedingung unterscheiden.

Reguläre SQL-Aufgaben:

| Original | Verbindlicher Arbeitsauftrag | Referenz-SQL |
| --- | --- | --- |
| 1 | **Liste** die Daten aller weiblichen Mitglieder auf. | `SELECT * FROM users WHERE gender = 'female'` |
| 2, angepasst | **Gib** alle Mitglieder aus Deutschland aus. | `SELECT * FROM users WHERE country = 'Deutschland'` |
| 4, angepasst | **Zeige** den vollständigen Datensatz von Mia Sonntag an. | `SELECT * FROM users WHERE name = 'Mia Sonntag'` |

### Reiter 3 – Block B: Vergleichen mit WHERE

Beginne mit einem kleinen Zahlenbeispiel und erkläre anschließend kompakt
`=`, `<`, `>`, `<=`, `>=` und `<>` beziehungsweise `!=` wie auf Folie 2.
Stelle „kleiner als“ und „höchstens“ gegenüber. Körpergrößen sind in Zentimetern
gespeichert. Datumswerte werden im Format `'JJJJ-MM-TT'` geschrieben.

Reguläre SQL-Aufgaben:

| Original | Verbindlicher Arbeitsauftrag | Referenz-SQL |
| --- | --- | --- |
| 6 | **Gib** alle Mitglieder aus, die kleiner als 1,80 m sind. | `SELECT * FROM users WHERE centimeters < 180` |
| 9, angepasst | **Finde** das Mitglied, das am 17.09.2007 geboren wurde. Gib den vollständigen Datensatz aus. | `SELECT * FROM users WHERE birthday = '2007-09-17'` |
| 10 | **Gib** die Namen aller Mitglieder aus, die nicht in Leipzig wohnen. | `SELECT name FROM users WHERE city != 'Leipzig'` |

Erläutere bei der letzten Aufgabe kurz den fehlenden Wohnort des Kontos admin:
`NULL` bedeutet „kein Wert eingetragen“. Ein normaler Vergleich mit `NULL`
erfüllt die WHERE-Bedingung nicht; admin wird hier nicht ausgegeben. Führe
dafür keinen zusätzlichen Aufgabenblock zur vollständigen NULL-Logik ein.

### Reiter 4 – Block C: Muster suchen mit LIKE

Veranschauliche zuerst an wenigen Namen, was ein Muster trifft. Erkläre danach
`LIKE` und `%` als Platzhalter für beliebig viele Zeichen, auch null Zeichen.
Zeige den Unterschied zwischen `'B%'`, `'%berg'` und `'%berg%'`. Kein zusätzlicher
Pflichtstoff zu regulären Ausdrücken oder dem Platzhalter `_`.

Reguläre SQL-Aufgaben:

| Original | Verbindlicher Arbeitsauftrag | Referenz-SQL |
| --- | --- | --- |
| 11 | **Zeige** alle Mitglieder, deren Vorname mit B beginnt. | `SELECT * FROM users WHERE name LIKE 'B%'` |
| 13, angepasst | **Zeige** alle Mitglieder, deren Benutzername die Zeichenfolge „fuchs“ enthält. | `SELECT * FROM users WHERE username LIKE '%fuchs%'` |
| 14 | **Gib** die Namen aller Mitglieder aus, die im März Geburtstag haben. | `SELECT name FROM users WHERE birthday LIKE '%-03-%'` |

`name` enthält im vorhandenen Datensatz Vor- und Nachnamen, der Vorname steht
am Anfang. Weise beim Geburtstagsmuster auf die Monatsposition in `JJJJ-MM-TT`
hin. Eine Suche nach `'%03%'` würde auch andere Datumsteile treffen.

### Reiter 5 – Block D: Bedingungen verknüpfen

Übernimm die schrittweise Herleitung aus den Folien 7–10 sinngemäß: Zwei
Einzelbedingungen werden zu einer WHERE-Bedingung mit AND verbunden. Zeige
an wenigen konkreten Datensätzen den Unterschied zu OR. Formuliere präzise:
**AND: beide Bedingungen müssen erfüllt sein. OR: mindestens eine Bedingung
muss erfüllt sein, auch beide dürfen erfüllt sein.**

Zeige vor der Zusatzaufgabe mit gemischten Bedingungen ein kleines Beispiel
für Klammern. AND bindet stärker als OR. NOT darf als kurzer ergänzender
Hinweis aus Folie 11 vorkommen, wird aber kein weiterer Pflichtblock und kein
unvorbereitetes Quizthema. Für NULL keinen allgemeinen Zwei-Wahrheitswerte-Satz
behaupten; die Beispiele verwenden bekannte, nicht leere Werte.

Reguläre SQL-Aufgaben:

| Original | Verbindlicher Arbeitsauftrag | Referenz-SQL |
| --- | --- | --- |
| 15, angepasst | **Finde** alle Mitglieder aus Berlin, deren Vorname Lina lautet. | `SELECT * FROM users WHERE name LIKE 'Lina %' AND city = 'Berlin'` |
| 16 | **Liste** alle weiblichen Mitglieder aus Leipzig auf. | `SELECT * FROM users WHERE gender = 'female' AND city = 'Leipzig'` |
| 17, angepasst | **Liste** alle Mitglieder auf, deren Vorname Lina oder Felix lautet. | `SELECT * FROM users WHERE name LIKE 'Lina %' OR name LIKE 'Felix %'` |

Die Muster mit Leerzeichen grenzen den vollständigen Vornamen ab. Für den
vorliegenden Datenbestand liefern die kürzeren Muster `'Lina%'` bzw.
`'Felix%'` aus der Materialvorlage dieselben Treffer und werden ebenfalls
akzeptiert. Zeige beim Verknüpfen, dass jede Teilbedingung vollständig sein
muss: `name LIKE 'Lina %' OR 'Felix %'` ist keine passende Formulierung.

### Reiter 6 – Für die Schnellen

Die Zusatzaufgaben sind freiwillig und verhindern weder Abschlussquiz noch
Abschluss des regulären Lernwegs. Verwende dieselben Eingaben, Prüfbuttons,
Ergebnisfenster und Hilfen. Gliedere den Reiter sichtbar nach den vier Blöcken.

| Block | Original | Verbindlicher Arbeitsauftrag | Referenz-SQL |
| --- | --- | --- | --- |
| A | 3, angepasst | **Wähle** alle Mitglieder aus, die in Schwerin wohnen. | `SELECT * FROM users WHERE city = 'Schwerin'` |
| A | 5 | **Wähle** alle Mitglieder mit der Rolle `user` aus. | `SELECT * FROM users WHERE role = 'user'` |
| B | 7 | **Liste** alle Mitglieder auf, deren Profil aktiviert ist. Der Wert 1 in `is_active` bedeutet „aktiviert“. | `SELECT * FROM users WHERE is_active = 1` |
| B | 8 | **Zeige** alle Mitglieder aus München. **Lies** die Anzahl an der Ergebnisrelation ab. | `SELECT * FROM users WHERE city = 'München'` |
| C | 12, präzisiert | **Zeige** alle Mitglieder mit einer E-Mail-Adresse, die auf `@instahub.test` endet. | `SELECT * FROM users WHERE email LIKE '%@instahub.test'` |
| C | Ergänzung zu Folie 5 | **Gib** die Namen aller Mitglieder aus, deren vollständiger Name mit der Zeichenfolge „Schmidt“ endet. | `SELECT name FROM users WHERE name LIKE '%Schmidt'` |
| D | 19 | **Gib** Benutzernamen und Geburtsdatum aller weiblichen Mitglieder aus, die kleiner als 1,60 m sind. | `SELECT username, birthday FROM users WHERE gender = 'female' AND centimeters < 160` |
| D | 20 | **Liste** alle Mitglieder auf, deren Vorname Felix lautet und die nicht aus Berlin kommen. | `SELECT * FROM users WHERE name LIKE 'Felix %' AND city != 'Berlin'` |
| D | 21, angepasst | Eine Bekannte aus Berlin heißt mit Vornamen Lina oder Hailey. **Liste** alle passenden Datensätze auf. | `SELECT * FROM users WHERE (name LIKE 'Lina %' OR name LIKE 'Hailey %') AND city = 'Berlin'` |

Zur Ergänzung aus Folie 5: `'%Schmidt'` trifft auch Namen wie Goldschmidt.
Formuliere deshalb ausdrücklich eine **Endung**, nicht den exakten Nachnamen
Schmidt. Das Ergebnis soll die Bedeutung des Platzhalters korrekt zeigen.

Bei der E-Mail-Aufgabe erfüllen derzeit alle Mitglieder die Bedingung. Das
ist ein gültiges Ergebnis und wird im Feedback erklärt. Eine Abfrage ohne
WHERE oder ohne passende LIKE-Bedingung genügt bei dieser ausdrücklich
verlangten Mustersuche trotzdem nicht; siehe Abschnitt 7.

„Wie viele“-Fragen werden hier über die Zeilenanzahl der Ergebnisrelation
bearbeitet. **COUNT und andere Aggregatfunktionen sind kein Lerninhalt dieses
Moduls.** Aufgaben 18 (dynamische Altersgrenze) und 22 aus dem Arbeitsblatt
entfallen zugunsten eines überschaubaren Umfangs. Keine weiteren Aufgaben
aus dem Material stillschweigend ergänzen.

### Reiter 7 – Abschlussquiz und Zusammenfassung

Erstelle fünf kurze Multiple-Choice-Fragen mit Auswahlkästchen. Mindestens
zwei Fragen haben mehrere richtige Antworten. Verwende die Quizkomponente
aus Aufgabe 2 bzw. `#final-quiz` aus Informatik 10, Datenbanken.

Decke folgende Inhalte ab, jeweils nur soweit zuvor erarbeitet:

- WHERE wählt Zeilen, SELECT wählt Spalten; users bleibt unverändert.
- Vergleichsoperatoren, einfache Anführungszeichen und Zentimeter.
- Bedeutung und Position von `%` bei LIKE.
- AND gegenüber einschließendem OR.
- Klammern bei einer Kombination aus AND und OR.

Typische Fehlvorstellungen werden plausible Falschantworten: „WHERE löscht
Datensätze“, „OR erlaubt genau eine wahre Bedingung“, „LIKE 'B%' findet ein B
an jeder Stelle“, „Texte stehen ohne Anführungszeichen hinter =“.

Jede Frage hat „Frage N prüfen“ mit eigener Rückmeldung darunter. Zusätzlich
bleibt der gemeinsame Auswertungsbutton. Sind alle Einzelfragen richtig,
läuft die Gesamtauswertung automatisch über `addQuizQuestionChecks`.

Nach bestandenem Quiz erscheint wie in Aufgabe 2 eine kompakte Übersicht
mit Arbeitsauftrag und richtiger SQL-Lösung aller regulären Aufgaben und
der Beschreibe-Aufgabe. Zusatzaufgaben können in einem eigenen Abschnitt
mit Lösungen erscheinen, bleiben aber freiwillig. Die Freischaltung wird
gespeichert und wiederhergestellt.

Sichere die Kernregeln in einer kurzen Zusammenfassung im selben letzten
Reiter. Beispiel für die schon bekannte Klauselreihenfolge mit WHERE:

```sql
SELECT username, centimeters
FROM users
WHERE centimeters < 180
ORDER BY centimeters DESC
LIMIT 5
```

## 5. Gestaltung, Bedienung und Lernstände

- Übernimm Farben, Karten, Buttons, Typografie und Abstände aus Aufgabe 2.
- Kurze Aufgabenstellungen, höchstens zwei kurze Sätze; Operatoren fett.
- Neue Begriffe zuerst am Beispiel, danach Definition und Anwendung.
- Schema während der SQL-Aufgaben zugänglich; ein sticky Schema darf keine
  Eingaben oder Rückmeldungen verdecken. Die Ladeanzeige bleibt im Dokumentfluss.
- SQL als Code anzeigen, jede Klausel in einer eigenen Zeile; AND und OR
  bei längeren Abfragen übersichtlich einrücken oder auf eigene Zeilen setzen.
  Die einzeiligen Referenzen in den Tabellen oben sind nur für diesen Prompt.
- Neutrale Platzhalter wie `SELECT ...` und `FROM ...`; keine Musterlösung
  als Eingabewert. Nur bei ausdrücklich vorgesehenen Korrekturaufgaben wäre
  eine Vorbelegung zulässig; solche Zusatzaufgaben sind hier nicht nötig.
- Ergebnisrelationen wie in Aufgabe 2 anzeigen: vollständige Überschriften,
  begrenztes scrollbares Tabellenfenster, semantische Tabellen, sichtbarer
  Tastaturfokus. Daten und Servertexte sicher über Textknoten ausgeben.
- Alle SQL-Eingaben, Beschreibungen, Quizantworten, Bearbeitungsstände,
  Freischaltungen, der aktive Reiter und Animationsschritt bleiben bei
  Navigation und Neuladen erhalten. Bei jeder Eingabe speichern, auch ohne
  vorheriges Prüfen. Vorhandene Speicherbausteine verwenden.
- Ungültige gespeicherte Daten ignorieren; bei gesperrtem localStorage bleibt
  die Bedienung möglich. „Modul neu beginnen“ setzt nur dieses Modul zurück.
- Nach Änderung einer schon geprüften Antwort alte Erfolgsmeldungen und den
  Erfolgsstatus wie in Aufgabe 2 zurücknehmen. Veraltete asynchrone Antworten
  dürfen geänderte Eingaben oder zurückgesetzte Lernstände nicht überschreiben.
- Feedback mit Textstatus und `aria-live`, beschriftete Eingaben, erreichbare
  Prüfbuttons und vollständige Tastaturbedienung auf allen Reitern.

## 6. Beschreibe-Aufgabe und Scaleway

Neue eindeutige Aufgaben-ID, beispielsweise **`inf9-db3-beschreibe-where`**.
Registriere sie in `scaleway-functions/source/tasks.js` nach dem Muster
`inf9-db2-beschreibe-projektion` und den anderen Beschreibe-Aufgaben aus
Aufgabe 2. Nutze dieselbe konfigurierte Scaleway-Adresse und
`evaluateSemanticAnswer`; keine eigene Serveranbindung bauen.

Bewerte die Beschreibung aus Reiter 2 mit **maximal 3 Punkten**, je einem
Punkt für diese klar getrennten Aspekte:

1. Datenquelle ist die Tabelle `users` beziehungsweise die Mitgliedertabelle.
2. Ausgegeben werden genau Benutzername und Wohnort (`username` und `city`).
3. Berücksichtigt werden nur Mitglieder mit Wohnort München.

Sinngemäße eigene Worte zählen. Keine wörtliche Übereinstimmung mit einer
Musterantwort verlangen und verständliche Rechtschreibfehler nicht abwerten.
Die Beschreibung muss keine tatsächlichen Mitgliedernamen oder Zeilenzahlen
nennen. Die Erkenntnis „users wird nicht verändert“ darf vorkommen, ist bei
dieser Aufgabenformulierung aber kein zusätzliches Pflichtkriterium.

Interne Musterbeschreibung für Spezifikation und Abschlussübersicht:
„Die Abfrage liest aus der Tabelle users nur die Mitglieder mit Wohnort
München aus und zeigt deren Benutzernamen und Wohnort.“

Status wie in Aufgabe 2: 3 Punkte „korrekt“, 1–2 Punkte „teilweise korrekt“,
0 Punkte „noch nicht korrekt“. Ein technischer Fehler ist kein fachliches
0-Punkte-Ergebnis. Lade-, Erfolgs-, Fehler- und Wiederholungszustände sowie
erreichte und maximale Punktezahl direkt in der abgegrenzten Rückmeldung
anzeigen. Eine erneute Prüfung ersetzt die vorherige Rückmeldung vollständig.
Bei Fehlern konkrete kleine Hinweise, keine vollständige Musterbeschreibung
als unmittelbares Fehlerfeedback. Anweisungen in Schülerantworten dürfen die
Bewertungsvorgaben nicht verändern.

Drei gestufte Hilfen:

1. „Lies zuerst FROM: Aus welcher Tabelle kommen die Daten?“
2. „Welche beiden Spalten nennt SELECT? Welche Bedingung steht hinter WHERE?“
3. „Die Spalten heißen username und city. Überlege, welche Mitglieder die
   Bedingung city = 'München' erfüllen.“

Ergänze passende Registrierung-, Prompt- und Ergebnisverarbeitungstests unter
`scaleway-functions/tests/`, angelehnt an `inf9-db2-beschreibe.test.js`.
Verwende korrekte, teilweise richtige und falsche Beispielantworten. Mocks
prüfen den Vertrag und die Darstellung; sie belegen keine echte Live-Bewertung.
`rules.js` nur bei einer tatsächlich benötigten zusätzlichen Regel erweitern.
Generierte Dateien nicht von Hand ändern; `apps-script/` bleibt unverändert.

Vor Übergabe der Umsetzung:

1. `node scaleway-functions/build-core.js`
2. `node --test scaleway-functions/tests/*.test.js` und betroffene weitere Tests
3. In PowerShell `& ./scaleway-functions/package.ps1`
4. `scaleway-functions/dist/ki-auswertung-test.zip` samt SHA256 und Uploadhinweis
   übergeben. Ein noch ausstehender Upload bzw. Live-Test muss benannt werden.

## 7. SQL-Korrektur nach Aufgabe 2

SQL wird lokal mit der vorhandenen Engine geprüft. **Nur die
Freitextbeschreibung geht an Scaleway.** Übernimm die differenzierte
Korrekturlogik und die Regressionserfahrungen aus
`tests/sql-feedback-browser.check.cjs` von Aufgabe 2.

Verbindliche Regeln:

- Genau eine lesende SELECT-Anweisung zulassen, mit der bestehenden
  Sicherheitsvalidierung. Keine schreibenden Anweisungen ausführen.
- Kein Vergleich mit dem Wortlaut einer einzelnen Musterlösung. Prüfe die
  tatsächlich berechnete Ergebnisrelation sowie ausdrücklich verlangte
  Lernmerkmale. Groß-/Kleinschreibung von SQL-Schlüsselwörtern, Leerzeichen,
  Zeilenumbrüche und ein abschließendes Semikolon beeinflussen die Bewertung nicht.
  Zeichenkettenwerte nicht pauschal kleinschreiben oder normalisieren.
- Abweichende Spaltenüberschriften durch gültige Aliasse sind erlaubt.
  Fehlende Kommas zwischen zwei geforderten Spalten dürfen nicht versehentlich
  als korrekte Projektion mit implizitem Alias gelten. Zusätzliche oder doppelt
  ausgegebene Spalten korrekt diagnostizieren.
- Bei Aufträgen mit „vollständiger Datensatz“ oder „Daten aller …“ sind alle
  Spalten gefordert. Bei ausdrücklich genannten Ausgabespalten genau diese
  prüfen. Für zwei genannte Spalten ist die Reihenfolge frei, solange keine
  Reihenfolge verlangt wird; Werte müssen weiterhin zur richtigen Spalte gehören.
- Ohne verlangte Sortierung spielt die Zeilenreihenfolge keine Rolle.
  Zeilenmultiplizitäten erhalten; nicht nur Mengen oder Zeilenzahlen vergleichen.
- Semantisch gleichwertige Bedingungen akzeptieren, insbesondere `!=` und
  `<>`, vertauschte AND-Teilbedingungen, überflüssige Klammern und die oben
  genannten gleichwertigen Namensmuster. AND und OR nicht anhand einer
  starren Wortfolge im gesamten SQL prüfen.
- Bei WHERE-/LIKE-Lernaufgaben muss eine entsprechende wirksame Bedingung
  auf dem gefragten Attribut vorhanden sein. Eine zufällig gleiche Relation
  allein genügt nicht, besonders bei der E-Mail-Aufgabe mit 317 Treffern.
  Nutze die vorhandene Tokenanalyse für begrenzte zusätzliche Prüfregeln;
  bloße Textsuche, Wörter in Kommentaren und `WHERE 1 = 1` belegen das Lernziel nicht.
  Keine allgemeine neue SQL-Parserarchitektur entwickeln.
- Unverlangtes LIMIT und ein DISTINCT, das benötigte Zeilen entfernt, als
  Abweichung behandeln. Ein zusätzliches ORDER BY ohne vorgeschriebene
  Reihenfolge ist kein Fehler. Inhaltsgleiche zulässige Varianten nicht allein
  wegen zusätzlichen, wirkungslosen SQL-Bestandteilen abwerten.
- Eine gültige Abfrage zeigt immer ihre eigene Ergebnisrelation, auch wenn
  die Aufgabenlösung noch nicht stimmt. Ein leeres Ergebnis als gültiges
  SQL-Ergebnis kennzeichnen; fachlich ist es nur korrekt, wenn die Aufgabe
  tatsächlich dieses leere Ergebnis verlangt.

Ergänze konkrete WHERE-Diagnosen im bestehenden Muster:

- WHERE fehlt oder filtert nach der falschen Spalte bzw. dem falschen Wert.
- Textwerte ohne Anführungszeichen, etwa `city = Berlin`.
- Verwechslung von `name` und `username` oder deutschen und englischen Attributnamen.
- Fehler genau hinter SELECT, WHERE oder ORDER BY zuordnen; Kommentare dürfen
  die Zuordnung nicht verfälschen. Bestehende Unicode-Fehlerfälle beachten.
- Falscher Vergleichsoperator bzw. falsche Grenze, etwa `< 180` gegen `<= 180`;
  Meter nicht mit den gespeicherten Zentimetern verwechseln.
- LIKE mit fehlendem oder falsch platziertem `%`, etwa `'fuchs%'` statt
  `'%fuchs%'`, und Monatsmuster ohne passende Datumsposition.
- AND statt OR, OR statt AND, unvollständige Teilbedingungen und fehlende
  Klammern mit verändertem Ergebnis.
- Zusätzliche Einschränkungen liefern zu wenige, fehlende Einschränkungen
  zu viele Datensätze. Gleiche Zeilenzahlen allein beweisen keine richtige Auswahl.

Feedback unterscheidet **korrekt / teilweise korrekt / noch nicht korrekt**
und erläutert den nächsten fachlichen Prüfschritt. Keine vollständige
SQL-Musterlösung beim ersten Fehlversuch anzeigen. Jede SQL-Aufgabe bekommt
drei gestufte Hilfen: kleiner Hinweis → konkreter Denkansatz → Teillösung.

## 8. Abnahme und Übergabe

Die Planung verdichtet diese Vorgaben in zwei getrennte Prüflisten. Mindestens:

**Regelbasierte Vorprüfung**

- Dateien und lokale Links vorhanden; Menüeintrag hinter Aufgabe 2;
  Start- und Rückweg stimmen, Überschrift und separate Aufgabennummer stimmen.
- Sieben fortlaufend nummerierte, frei bedienbare Reiter; Abschlussquiz zuletzt.
- Pro Block höchstens drei reguläre SQL-Aufgaben; Zusatzaufgaben sind nach
  den vier Blöcken gegliedert und für den Pflichtfortschritt entbehrlich.
- Kein Speicherzugriff auf die Schlüssel von Aufgabe 2; alle Eingabearten,
  Reiter und Animationsschritte bleiben auch ohne vorheriges Prüfen erhalten.
- Animation vorwärts/rückwärts, Neustart, schnelle Klicks, Reiterwechsel,
  reduzierte Bewegung und Wiederherstellung im Browser geprüft.
- SQL-Referenzen gegen `users.csv` ausgeführt; korrekte Varianten sowie
  gezielte Fehlerfälle aus Abschnitt 7 geprüft. Insbesondere fehlendes WHERE
  bei der E-Mail-Aufgabe und fehlerhafte OR-Klammerung testen.
- Bei Bedarf kleine isolierte Testdaten für unterscheidbare Grenzfälle wie
  genau 180 cm verwenden; den produktiven CSV-Datensatz unverändert lassen.
- Feedbackstufen, leere/lange/breite Ergebnisrelationen, SQL-Fehler,
  Alias-/Kommafälle und veraltete asynchrone Antworten geprüft.
- Scaleway-Registrierung, Tests, generierter Build und aktuelle Upload-ZIP
  vorhanden; erfolgreicher Livebetrieb nur nach tatsächlicher Prüfung behauptet.
- Jede Quizfrage hat einen eigenen Prüfbutton; automatische Gesamtauswertung,
  Übersicht und Speicherung der Freischaltung funktionieren.
- Desktop, Tablet, Smartphone und Tastatur geprüft; kein Seitenüberlauf.
- Vorhandene passende Syntax-, Build- und Testbefehle sowie `git diff --check`
  ausgeführt. Gemeinsam genutzte Änderungen zusätzlich gegen Aufgabe 2 prüfen.

**Fachlich-didaktische Endabnahme**

- Aufbau folgt Aufgabe 2 und den vier Blöcken der Präsentation; die
  ausgewählten Aufgaben und nötigen Datenanpassungen sind korrekt umgesetzt.
- Das sichtbare Herausfliegen zeigt Selektion im Abfrageergebnis. Die
  gespeicherte Tabelle bleibt erkennbar unverändert; SELECT und WHERE
  werden nicht verwechselt. Ausschnitt und Gesamtbestand sind unterscheidbar.
- Kurze handlungsorientierte Texte, verständliche Beispiele vor Definitionen,
  fachlich passende Progression, gestufte Hilfen ohne vorzeitige Komplettlösung.
- LIKE-Muster, vollständige Vornamen, Datumsformat, Maßeinheit, AND/OR und
  Klammerwirkung sind präzise. OR wird einschließlich „beide“ erklärt.
- Kein zufällig identisches oder leeres Ergebnis als Beleg einer richtigen
  Bedingung; passende Varianten werden fair akzeptiert.
- Beschreibe-Aufgabe steht am Anfang von Reiter 2; Scaleway bewertet die
  selbst verfasste Antwort mit der vorgegebenen fairen Drei-Punkte-Rubrik.
- Quiz prüft ausschließlich Erarbeitetes; mindestens zwei Fragen haben
  mehrere richtige Antworten. Die Übersicht sichert alle Pflichtaufgaben.

Berichte abschließend knapp über erstellte und geänderte Dateien,
wiederverwendete Komponenten, ausgeführte Prüfungen, Ergebnisse der beiden
Prüfstufen und gegebenenfalls noch nötigen Scaleway-Upload samt Live-Test.
