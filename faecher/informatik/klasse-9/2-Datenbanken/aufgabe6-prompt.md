# Prompt für Inf9 Datenbanken · Aufgabe 6 – Aggregatfunktionen

Verwende den folgenden Auftrag für den Lernmodul-Loop nach Abschnitt 13 von
`AGENTS.md`.

---

Erstelle **Aufgabe 6 – Aggregatfunktionen** für Informatik Klasse 9, Einheit
Datenbanken. Das Modul setzt die bisherige Arbeit im InstaHub-Datenbanklabor
fort. Die Lernenden kennen `SELECT`, `FROM`, `ORDER BY`, `LIMIT`, `WHERE`
und kombinierte Bedingungen. Sie lernen, mit `COUNT`, `MIN`, `MAX`, `AVG`
und `SUM` mehrere Datensätze auszuwerten und mit `AS` die Überschrift einer
Ergebnisspalte zu benennen.

## Quellen und Vorgehen

Lies vor der Planung `AGENTS.md`, `manifest-allgemein.txt`,
`manifest-datenbankaufgaben.txt` und `manifest-quizaufgaben.txt` vollständig.
Führe den dort vorgegebenen Ablauf aus Planung, Bau, regelbasierter Vorprüfung
und fachlich-didaktischer Endabnahme durch. Die Planung legt die Schülertexte,
die Referenzabfragen, die Zuordnung zu den Quellen und getrennte
Abnahmekriterien für Vorprüfung und Endabnahme fest.

Die fachlichen Grundlagen liegen in `material-instahub/` im Modulordner.

- **Präsentation-Aggregtsfkt.pptx**. Folien 1–3 liefern den Vergleich zwischen
  sortierter Liste und `MIN(created_at)`. Folien 4–5 führen `COUNT(*)` und
  `AS` ein. Folien 6–8 zeigen Anwendungsfragen zur Tabelle `photos`.
- **Abfragen-Aggregatsfkt.docx**. Das Arbeitsblatt liefert die Funktionsübersicht,
  das Beispiel `COUNT(*) AS Anzahl` und die sieben Aufgaben zu `users`.
  Übertrage die Aufgaben in das vorhandene browserbasierte SQL-Labor.

Präzisiere die Kurzformulierung der Quellen zu `COUNT`. `COUNT(*)` zählt
alle ausgewählten Zeilen. `COUNT(spalte)` zählt die ausgewählten Zeilen mit
einem Wert ungleich `NULL` in dieser Spalte. Zeige den Unterschied an einer
kleinen Tabelle mit einem fehlenden Wert. `AVG` und `SUM` arbeiten hier mit
numerischen Größenwerten, `MIN` und `MAX` auch mit den einheitlich
formatierten Datums- und Zeitwerten der Übungsdaten. Bei den hier betrachteten
Abfragen ohne `GROUP BY` entsteht eine Ergebniszeile. `WHERE` bestimmt
vorher die Zeilen, die in die Berechnung eingehen. Beschränke den Lernstoff auf
Abfragen über jeweils eine Tabelle ohne Gruppierung.

## Bestehende Module als Vorlage

- Verwende die aktuellen Dateien `aufgabe4.html`, `aufgabe4.js` und
  `aufgabe4.css` für Seitengerüst, Reiter, Tabellen, SQL-Eingabe, Prüfablauf
  und Feedback. Verwende den SQL-Stepper aus Aufgabe 4 und die
  Phasendarstellung aus `aufgabe2.js` als Vorlage für die Einstiegsanimation.
  Aufgabe 5 liefert ein weiteres Beispiel für „Für die Schnellen“ und die
  Auswertung.
- Verwende in `faecher/informatik/klasse-10/1-Datenbanken/` die gemeinsamen
  Bausteine `sql-lab-core.mjs`, `tab-navigation.mjs` und die vorhandenen
  Stylesheets. Ziehe die Aggregatbeispiele und Referenzabfragen aus
  `sql-lab.js` ergänzend heran. Verwende den bestehenden sql.js-Worker und die
  vorhandenen CSV-Dateien `users.csv` und `photos.csv`. Lade `photos` für
  den optionalen Fototransfer über dieselbe Lade- und Ausführungskette wie
  `users`.
- Lege `aufgabe6.html`, `aufgabe6.js` und bei Bedarf `aufgabe6.css` im
  Modulordner an. Ergänze in `faecher/informatik/klasse-9/index.html` die
  Kachel „Aufgabe 6 – Aggregatfunktionen“ direkt hinter Aufgabe 5. Unter der
  Hauptüberschrift „Aggregatfunktionen“ steht „Aufgabe 6“ als eigene Zeile.
- Übernimm die browserbasierte Fortschrittsspeicherung mit einem eigenen
  versionierten Schlüssel, etwa `informatik9-datenbanken-aufgabe6-aggregate-v1`.
  Speichere SQL-Eingaben, Animationsphase, Quizantworten, Fortschritt,
  Freischaltungen und aktiven Reiter. „Modul neu beginnen“ setzt den Stand
  von Aufgabe 6 zurück.

## Reiter 1 · Einstieg mit Animation

Setze diesen Arbeitsauftrag über die Animation. „**Gehe** die Animation
Schritt für Schritt durch. **Vergleiche**, was die sortierte Liste zeigt und
welchen Wert die Aggregatfunktion ausgibt.“

Die Ausgangsfrage lautet „Wann wurde das erste Konto bei InstaHub registriert?“ Nutze
vier bis fünf echte Zeilen aus `users.csv` mit mehreren verschiedenen
Registrierungszeitpunkten. Beschrifte die Tabelle mit „Ausschnitt aus
`users`“ und kennzeichne auch die Ergebnisvorschau als Auswertung dieses
Ausschnitts. Zeige in der Animation exemplarisch `username` und
`created_at`. Für den Vergleich eignet sich diese auf die sichtbaren
Spalten zugeschnittene Fassung der Abfrage aus Folie 1.

```sql
SELECT username, created_at
FROM users
ORDER BY created_at ASC
```

Die Animation hat vier über den Stepper bedienbare Phasen.

1. Zeige den unsortierten Ausschnitt und die Ausgangsfrage. Die Lernenden
   suchen zunächst selbst nach dem frühesten Zeitstempel.
2. Hebe `ORDER BY created_at ASC` hervor und ordne die sichtbaren Zeilen
   zeitlich. Alle Zeilen bleiben in der Ergebnisvorschau sichtbar, der
   früheste Zeitpunkt steht oben.
3. Wechsle zur Abfrage unten. Hebe zuerst die Werte aus `created_at` und dann
   `MIN(created_at)` hervor. Veranschauliche den Vergleich der Zeitstempel,
   indem jeweils der bisher früheste Wert markiert bleibt, bis ein früherer
   Wert gefunden wird.
4. Führe den frühesten Wert visuell in die einzige Zelle der Ergebnisvorschau.
   Die Ausgangstabelle bleibt sichtbar und unverändert. Benenne jetzt das
   beobachtete Prinzip. Eine Aggregatfunktion fasst die Werte der
   ausgewählten Zeilen zu einem Ergebniswert zusammen.

```sql
SELECT MIN(created_at)
FROM users
```

Verwende die vorhandene Schrittbedienung mit Zurück, Weiter und Neustart.
Stelle jeden Schritt durch Tabellen, Beschriftungen und eine kurze
Erklärung dar. Die Phasen müssen mit Tastatur, Touch und bei
`prefers-reduced-motion` verständlich bleiben. Bei reduziertem
Bewegungswunsch wechselt der Stepper direkt zum nächsten Zustand.

## Reiter 2 bis 5 · SQL selbst schreiben

Zeige zu jedem Themenblock ein kurzes Beispiel, dann die Übungsaufgaben mit
Schema, neutralem SQL-Platzhalter und Ergebnisfenster wie in Aufgabe 4.
Kündige an, dass die Übungsdaten vom eigenen InstaHub abweichen können.

| Reiter | Aufgaben und Schwerpunkte |
| --- | --- |
| 2 · Zählen und benennen | Zähle alle Einträge in `users` und nenne die Ergebnisspalte `Anzahl`. Zähle anschließend die registrierten Mitglieder aus Berlin. Zeige am Übergang, welche Zeilen `WHERE` zum Zählen übrig lässt. |
| 3 · Kleinster und größter Wert | Gib die Körpergröße des kleinsten Mitglieds aus. Ermittle danach das Geburtsdatum des jüngsten Mitglieds. Leite am Datum her, warum „jüngstes Mitglied“ zum spätesten Geburtsdatum führt. |
| 4 · Summe und Durchschnitt | Berechne zur Vorbereitung des Mittelwerts zunächst die Summe der eingetragenen Körpergrößen der Mitglieder aus Dresden. Ermittle anschließend mit `AVG` deren durchschnittliche Körpergröße. Mache den Bezug zwischen Summe und Anzahl der vorhandenen Größenwerte sichtbar. |
| 5 · Für die Schnellen | Ermittle die Größe der größten Nutzerin und die Anzahl der männlichen Mitglieder aus Leipzig. Gib den vollständigen Datensatz des zuletzt registrierten Mitglieds aus. Nutze als Transfer aus der Präsentation die Frage, wie viele Fotos der Nutzer mit der ID 10 hochgeladen hat. |

Die Aufgabe zum vollständigen Datensatz knüpft an den Vergleich aus der
Animation an. Die Referenzlösung nutzt `ORDER BY created_at DESC` und
`LIMIT 1`. Erläutere, dass `MAX(created_at)` den Zeitpunkt liefert,
während hier der zugehörige Datensatz gesucht ist. Prüfe, dass der neueste
Registrierungszeitpunkt in den Übungsdaten eindeutig ist.

Prüfe Schülerabfragen wie in den Vorlagen mit der bestehenden
`SELECT`-Validierung, dem SQL-Worker und dem Vergleich zur ausgeführten
Referenzabfrage. Berechne die Soll-Ergebnisse aus den CSV-Daten. Berücksichtige
bei `AVG` die vorhandene numerische Toleranz. Prüfe Spaltenüberschriften
dort, wo der Arbeitsauftrag sie ausdrücklich verlangt, und akzeptiere sonst
gleichwertige Abfragen mit unterschiedlichen Aliasen. Prüfe bei Aufgaben,
die ausdrücklich eine Aggregatfunktion einüben, auch ihren wirksamen Einsatz.
Eine fest eingetragene Zahl oder ein zufälliger Treffer ist ein Anlass
für einen gezielten Hinweis.
Nutze gestufte Hilfen und die vorhandenen Feedbackstufen. Typische Anlässe
für konkrete Hinweise sind ein fehlender Filter, die Verwechslung von
`MIN` und `MAX` bei Geburtsdaten und die Ausgabe einer ganzen Liste, obwohl
ein Kennwert gesucht ist.

## Reiter 6 · Abschlussquiz und Auswertung

Schließe die Lernstrecke mit dem vorhandenen Checkbox-Quiz ab. Prüfe mit
kurzen SQL-Beispielen die Ergebnisform einer Aggregatabfrage, die Wirkung von
`WHERE` und `AS`, den Unterschied zwischen den beiden `COUNT`-Varianten
und die Wahl der passenden Funktion. Mindestens zwei Fragen haben mehrere
richtige Antworten. Binde `quiz-fragen-pruefen.js` mit
`addQuizQuestionChecks` ein. Jede Frage erhält „Frage N prüfen“ und eine
eigene Rückmeldung. Die gemeinsame Auswertung bleibt verfügbar und startet
automatisch, sobald alle Fragen einzeln richtig geprüft wurden.

Blende nach bestandenem Quiz im selben Reiter die Lösungsübersicht nach
dem Muster von Aufgabe 5 ein. Sie enthält die Aufgaben mit Aufträgen und
Referenzabfragen, die richtigen Quizantworten und kurze Merksätze.
Nummeriere alle Reiter ab 1 durchgehend. Auf einem Laptop bleiben sie ohne
horizontales Scrollen sichtbar, auf schmaleren Bildschirmen dürfen sie
umbrechen.

## Prüfpunkte für die Umsetzung

- Prüfe Links, Menüposition, sichtbare Aufgabennummer und die
  Wiederherstellung aller Eingabearten beim Wechsel zur Jahrgangsübersicht
  und zurück. Prüfe auch Neustart und Wiederherstellung des letzten Reiters.
- Spiele die Animation vorwärts und rückwärts durch. Prüfe, dass die
  gezeigte Liste und der früheste Zeitpunkt aus demselben Ausschnitt stammen.
- Führe alle Referenzabfragen gegen die geladenen CSV-Daten aus. Prüfe
  fehlende Werte, `COUNT` bei einem Filter ohne Treffer, numerische
  Ergebnisse, Aliasprüfung, alternative korrekte SQL-Schreibweisen und
  typische Fehlversuche. Bei einer Aggregation ohne Treffer bleibt die
  Ergebniszeile erhalten. `COUNT(*)` liefert dann `0`, `AVG` liefert
  `NULL`.
- Prüfe Tastaturbedienung, sichtbaren Fokus, verständliche Live-Rückmeldungen,
  Einzel- und Gesamtauswertung des Quiz sowie Tabellen und Reiter auf Laptop,
  Tablet und Smartphone. Führe die einschlägigen vorhandenen Tests und
  `git diff --check` aus.
