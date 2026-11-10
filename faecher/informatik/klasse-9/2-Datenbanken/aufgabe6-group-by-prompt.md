# Prompt für Inf9 Datenbanken · Aufgabe 6 – Gruppierungen mit Group BY

Der folgende Auftrag ist für die spätere Ausführung mit dem Lernmodul-Loop
bestimmt. Dieses Dokument beauftragt das Modul; es ist noch keine Umsetzung.

---

Erstelle für **Informatik Klasse 9, Einheit Datenbanken, Aufgabe 6** ein
Lernmodul **„Gruppierungen mit Group BY“**. Es setzt die Arbeit im
InstaHub-SQL-Labor fort und übernimmt Aufbau, Gestaltung, Bedienung und
Aufgabendichte der vorhandenen Inf9-Datenbankmodule. Die Wirkung von
`GROUP BY` wird in einem eigenen Einführungsreiter animiert sichtbar.

## 1. Vorprüfung, Quellen und Arbeitsablauf

Lies zuerst die einschlägigen `AGENTS.md` sowie `manifest-allgemein.txt`,
`manifest-datenbankaufgaben.txt`, `manifest-quizaufgaben.txt` und
`KI-FEEDBACK-MIGRATION.md`. Alle folgenden Modulpfade beziehen sich auf
`faecher/informatik/klasse-9/2-Datenbanken/`.

**Fachliche Hauptquelle:** `material-instahub/Abfragen-Group-by.docx`.
Übernimm beide Einführungsbeispiele und alle acht Aufgaben in die unten
beschriebene Lernstrecke. Ergänze nur wenige passende Übungen, um eine mit
den vorherigen Aufgaben vergleichbare Aufgabendichte zu erreichen.
`Abfragen-Group-by-Lsg.docx` ist lediglich eine zu überprüfende Zusatzquelle:
Sie enthält fachliche Fehler und darf nicht ungeprüft als Lösungsvorlage dienen.
Die Anmeldung am externen InstaHub wird durch das vorhandene lokale SQL-Labor
ersetzt; keine neue externe Einbettung.

**Ziel und Bestand sind geklärt:** Aufgabe 6 heißt verbindlich
**„Gruppierungen mit Group BY“** und verwendet die vorhandenen Dateien
`aufgabe6.html`, `aufgabe6.js` und `aufgabe6.css`. Seitentitel, Hauptüberschrift
und Menübezeichnung tragen diesen Namen; „Aufgabe 6“ steht als eigene Zeile
direkt unter der Hauptüberschrift. Der bisherige Inhalt dieser Dateien zu
Aggregatfunktionen wird bei der Modulerstellung entsprechend diesem Prompt
zu GROUP BY und HAVING weiterentwickelt. Keine weitere Nummernklärung und
keine zweite Menü-Kachel nötig. `aufgabe6-prompt.md` und
`aufgabe6-spezifikation.md` beschreiben noch den bisherigen Aggregatinhalt;
dieser GROUP-BY-Prompt ist der aktuelle Auftrag. Die Spezifikation bei der
späteren Planung entsprechend aktualisieren.

Führe bei der späteren Modulerstellung den Workflow aus `AGENTS.md`,
Abschnitt 13, aus: **Planung → Bau → regelbasierte Vorprüfung → fachlich-
didaktische Endabnahme**, mit den dort festgelegten Modellen und Grenzen für
Korrekturschleifen. Der Planer legt konkrete Referenzfunktionen, sämtliche
Schülertexte, Hilfen, Referenzabfragen, Datenquellen und zwei getrennte
Akzeptanzlisten fest. Erst danach wird implementiert.

## 2. Konkrete Vorlagen und Wiederverwendung

- `aufgabe4.html/.js/.css`: Seitengerüst, Einführung mit SQL-Stepper,
  Tabellenansicht, SQL-Aufgabenkarten, Hilfen, Ergebnisfenster und Feedback.
- `aufgabe5.html/.js/.css`: Aufgabendichte, „Für die Schnellen“, Abschlussquiz
  und Lösungsübersicht. Die regulären Übungsreiter enthalten jeweils drei
  SQL-Aufgaben; daran orientiert sich dieses Modul.
- Die bestehenden `aufgabe6.*` zu Aggregatfunktionen: Aggregatauswertung,
  Animation, Speicherung und letzter Reiter mit Quiz und Auswertung als
  zusätzliche technische Referenz für die Weiterentwicklung derselben Aufgabe.
- Gemeinsame Komponenten aus `faecher/informatik/klasse-10/1-Datenbanken/`:
  `sql-lab-core.mjs`, `tab-navigation.mjs`, die vorhandenen Stylesheets,
  SQL-Worker-Anbindung, CSV-Import und Ergebniskontrolle. Für das Quiz
  `faecher/informatik/quiz-fragen-pruefen.js` mit `addQuizQuestionChecks`.

Keine neue SQL-Engine, Quiz-Komponente, Tab-Navigation oder Feedback-Pipeline
entwickeln. Änderungen an gemeinsamen Komponenten nur bei nachgewiesenem
Bedarf und mit Regressionstests der betroffenen Module.

## 3. Lernziele und fachliche Leitplanken

Voraussetzungen sind `SELECT`, `FROM`, `WHERE`, `ORDER BY`, `LIMIT`,
verknüpfte Bedingungen und die grundlegenden Aggregatfunktionen.
Aktiviere `COUNT(*)` und `AVG` durch einen kurzen Rückblick mit je einem
einfachen Beispiel; der bisherige Aggregatinhalt von Aufgabe 6 ist nach der
Weiterentwicklung kein eigenständiges vorgeschaltetes Modul.

Die Lernenden sollen verstehen und anwenden:

- `GROUP BY` bildet Gruppen aus Zeilen mit gleichem Wert der Gruppenspalte.
  Eine Aggregatfunktion berechnet anschließend einen Kennwert **pro Gruppe**.
- Die Ausgabe enthält bei den hier verwendeten einfachen Gruppenabfragen
  eine Zeile pro ausgegebener Gruppe; die gespeicherte Tabelle bleibt erhalten.
- `WHERE` filtert einzelne Zeilen **vor** der Gruppierung; `HAVING` filtert
  Gruppen anhand einer Bedingung, hier insbesondere an ihrem Aggregatwert.
- `GROUP BY` garantiert keine Sortierung. Eine gewünschte Ergebnisreihenfolge
  wird ausdrücklich mit `ORDER BY` angegeben.
- In diesen Aufgaben stehen hinter `SELECT` Gruppenspalten und
  Aggregatausdrücke. Beliebige ungruppierte Spalten und `SELECT *` sind keine
  geeignete Ausgabe für eine Gruppenauswertung, auch wenn SQLite sie zulässt.

Fachbegriffe nach dem Muster **Beispiel → Beobachtung → Definition → Anwendung**
einführen. Keine JOINs, Unterabfragen, Fensterfunktionen oder neuen
Datumsfunktionen als zusätzlichen Lernstoff einbauen.

## 4. Verbindliche Reiterstruktur und Aufgabenmenge

Alle sechs Reiter fortlaufend nummerieren. Vorgesehen sind **drei SQL-Aufgaben
pro regulärem Übungsreiter und drei freiwillige Transferaufgaben**, insgesamt
zwölf SQL-Aufgaben. Die acht Aufgaben der Hauptquelle bleiben erkennbar erhalten.

| Reiter | Inhalt und Aufgaben |
| --- | --- |
| **1 · Einführung: GROUP BY** | Animierter Einstieg am Beispiel „Wie viele Mitglieder stammen aus jeder Stadt?“. Kurzer Vergleich mit der Gesamtanzahl ohne Gruppierung. |
| **2 · Gruppen auswerten** | **1:** Anzahl der männlichen und weiblichen Mitglieder, getrennt nach Geschlecht (Quelle 1). **2:** Durchschnittsgröße dieser beiden Gruppen (Quelle 2). **3:** Anzahl der Mitglieder je Stadt; Stadt und Anzahl ausgeben (Übung zum Quellenbeispiel). |
| **3 · Gruppen filtern mit HAVING** | **4:** Vollständige Geburtsdaten mit mehr als einem Mitglied und der jeweiligen Anzahl ausgeben (Quelle 3). **5:** Städte mit Durchschnittsgröße über 185 cm samt Durchschnitt ausgeben (Quelle 4). **6:** Städte mit mehr als zwei Mitgliedern samt Anzahl ausgeben (Übung zum zweiten Quellenbeispiel). |
| **4 · Fotos gruppieren** | **7:** User-IDs mit jeweiliger Anzahl hochgeladener Fotos ausgeben (Quelle 5). **8:** Nur User-IDs mit mehr als 13 hochgeladenen Fotos ausgeben (Quelle 6). **9:** Die drei User-IDs mit den meisten Fotos samt Anzahl ausgeben, absteigend nach Anzahl und bei Gleichstand aufsteigend nach User-ID (Ergänzung). |
| **5 · Für die Schnellen** | **10:** Für jede Browserfamilie die höchste gespeicherte Version samt Browserfamilie ausgeben (Quelle 7, mit der unten beschriebenen Präzisierung). **11:** Anzahl der Zugriffe je Gerät ausgeben (Quelle 8). **12:** Nur weibliche Mitglieder betrachten und Städte mit mehr als zwei dieser Mitglieder samt Anzahl ausgeben; `WHERE` und `HAVING` kombinieren (Transfer). |
| **6 · Abschlussquiz und Auswertung** | Vier bis fünf Checkbox-Fragen; nach Bestehen gemeinsame Lösungsübersicht und kompakte Merksätze im selben letzten Reiter. |

„Für die Schnellen“ ausdrücklich als freiwillig kennzeichnen. Diese Aufgaben
sind keine Voraussetzung für das Abschlussquiz oder den Modulabschluss.
Jeder Themenreiter beginnt mit einem kurzen Beispiel und einer knappen
Erklärung. Vor Aufgabe 4 `HAVING` am Städtebeispiel mit sichtbarer
Vorher-/Nachher-Ansicht einführen; die Lernenden kennen die Klausel vor der
ersten eigenständigen Anwendung.

Die regulären Aufgaben werden im SQL-Labor bearbeitet. Aufträge umfassen
möglichst höchstens zwei kurze Sätze, enthalten fett gesetzte Operatoren
und benennen die verlangten Ausgabespalten eindeutig. Keine verpflichtende
Sortierung oder bestimmte Aliasbezeichnung prüfen, wenn der Auftrag sie
nicht nennt.

## 5. Einführungsanimation zur Wirkung von GROUP BY

Arbeitsauftrag **über** der Animation:

> **Gehe** die Animation Schritt für Schritt durch. **Beobachte**, wie aus
> einzelnen Mitgliedern Gruppen und anschließend eine Ergebniszeile je Stadt
> entstehen.

Verwende sechs bis acht echte Zeilen aus `users.csv` mit drei verschiedenen,
nichtleeren Städten und unterschiedlichen Gruppengrößen. Die Ausgangszeilen
sind zunächst gemischt angeordnet. Kennzeichne Quelle und Ergebnis klar als
**Ausschnitt**; die Vorschau wertet nur diese sichtbaren Zeilen aus.

Zeige als Zielabfrage das Quellenbeispiel mit korrekten Zeilenumbrüchen:

```sql
SELECT city, COUNT(*) AS AnzahlUser
FROM users
GROUP BY city
```

Die Animation besteht aus nachvollziehbaren, mit dem vorhandenen Stepper
steuerbaren Zuständen:

1. Unveränderte Ausgangstabelle mit `id`, `username` und `city` zeigen.
   Zunächst die Frage nach der Anzahl je Stadt stellen.
2. `GROUP BY city` hervorheben. Zeilen mit gleicher Stadt nacheinander
   sichtbar in beschriftete Gruppen der Arbeitsansicht bewegen. Einzelne
   Mitglieder bleiben innerhalb ihrer Gruppe erkennbar.
3. `COUNT(*)` hervorheben. Jede Gruppe durchlaufen und ihren Zähler sichtbar
   erhöhen. Zeilenbewegung und Zählung müssen zeitlich nachvollziehbar sein;
   eine bloße Neufärbung oder ein sofortiger Tabellenwechsel reicht nicht.
4. Aus jeder Gruppe eine Ergebniszeile mit Stadt und Anzahl entstehen lassen.
   Der Zusammenhang zwischen Gruppe und Ergebniszeile bleibt durch
   Beschriftung und Markierung erkennbar. Die Quelle bleibt unverändert sichtbar.
5. Mit `SELECT COUNT(*) FROM users` vergleichen: eine Gesamtzahl für denselben
   Ausschnitt gegenüber einer Anzahl je Stadt mit Gruppierung. Erst jetzt
   das beobachtete Prinzip als Gruppierung und Aggregation definieren.

Die Gruppenansicht ist ein Erklärmodell, keine Behauptung über den internen
Ausführungsalgorithmus der Datenbank. Ihre Anordnung garantiert keine
SQL-Ergebnissortierung.

Zurück, Weiter und Neustart müssen jeden Zustand zuverlässig herstellen;
Schrittzähler und knappe Erklärung als Text anzeigen. Tastatur und Touch
unterstützen. Bei `prefers-reduced-motion` dieselben Zustände ohne Bewegung
zeigen. Keine Information ausschließlich durch Farbe vermitteln.

## 6. Daten und notwendige fachliche Korrekturen

Nutze `users.csv` und `photos.csv` aus
`faecher/informatik/klasse-10/1-Datenbanken/` über die bestehende Ladekette.
Ergebniswerte immer aus ausgeführten Referenzabfragen bestimmen.

Die Tabelle `analytics` auf InstaHub ist laut Lehrkraft leer. Verwende deshalb
die bereits angelegte eigene Datei **`analytics.csv` im Modulordner** mit
18 synthetischen Zugriffen. Sie enthält exakt diese Spalten in dieser Reihenfolge:

```text
id;ip;device;brand_family;brand_model;browser_family;browser_version;platform_family;platform_version;user_id;photo_id;created_at;updated_at
```

Die Datei ist UTF-8 mit Semikolon als Trennzeichen, entsprechend den vorhandenen
CSV-Dateien. `id`, `browser_version`, `user_id` und `photo_id` werden als `int`
importiert; `created_at` und `updated_at` als `date` im angezeigten Schema
(in der bestehenden SQLite-Ladekette ISO-Zeitstempel als `TEXT`), die übrigen
Felder als `varchar(255)`. `platform_version` bleibt Text, damit mehrteilige
Versionsbezeichnungen erhalten bleiben. Keine Spalten umbenennen oder weglassen.

Lade `analytics.csv` über dieselbe Worker-/CSV-Kette wie die anderen Tabellen,
aber über ihren **lokalen Modulpfad**, nicht aus dem Inf10-Ordner. Erweitere
Tabellenschema, numerische Importspalten und Wertkonvertierung aufeinander
abgestimmt. Im passenden Reiter kennzeichnen: „Die Tabelle analytics enthält
synthetische Übungsdaten, da die Tabelle auf InstaHub leer ist.“ Die vorhandenen
`users`-/`photos`-Daten unverändert lassen.

Die Browseraufgabe darf `MAX(browser_version)` nicht pauschal als Ermittlung
der neuesten beliebigen Versionszeichenfolge erklären: Textvergleiche sind
beispielsweise bei `9` und `10` problematisch. In dieser CSV sind bewusst
vereinfachte **numerische Hauptversionen** gespeichert; erläutere diese
Vereinfachung direkt an der Browseraufgabe. Die Versionsangaben sind
Übungswerte und keine Aussage über aktuell verfügbare Browser.

Referenzabfragen für die beiden Quellenaufgaben:

```sql
SELECT browser_family, MAX(browser_version) AS HoechsteVersion
FROM analytics
GROUP BY browser_family
```

```sql
SELECT device, COUNT(*) AS Anzahl
FROM analytics
GROUP BY device
```

Interne Prüfanker der mitgelieferten CSV: Browsermaxima `Chrome = 120`,
`Firefox = 117`, `Edge = 120`, `Safari = 17`; Zugriffszahlen `desktop = 9`,
`mobile = 6`, `tablet = 3`. Alle vier Browserfamilien haben mehrere Versionen.
Auch Safari 9 und 10 sind enthalten, damit ein irrtümlicher Textvergleich
auffällt. Die Zahlen dienen der Prüfung und werden vor der Bearbeitung nicht
als Lösungen angezeigt; Sollrelationen weiterhin aus der CSV berechnen.

Weitere verbindliche Präzisierungen:

- Aufgabe 1 und 2 verlangen nur die beiden genannten Geschlechter. Weitere
  oder fehlende Einträge bei Bedarf mit den bereits bekannten Bedingungen
  `gender = 'male' OR gender = 'female'` ausschließen; nicht als dritte
  verlangte Gruppe behandeln. `AVG` ignoriert fehlende Größenwerte.
- „Am gleichen Tag geboren“ meint in Aufgabe 4 **dasselbe vollständige
  Geburtsdatum einschließlich Jahr**, nicht den jährlich gleichen Geburtstag.
  Ausgabe ist `birthday, COUNT(*)`, gruppiert nach `birthday`, mit
  `HAVING COUNT(*) > 1`; unbekannte Geburtsdaten mit `WHERE birthday IS NOT NULL`
  ausschließen. `IS NOT NULL` kurz direkt an dieser Aufgabe erklären.
  Kein `SELECT *` aus der Lösungsdatei übernehmen.
- Für Aufgabe 5 lautet die fachliche Grundlage:

  ```sql
  SELECT city, AVG(centimeters) AS Durchschnitt
  FROM users
  GROUP BY city
  HAVING AVG(centimeters) > 185
  ```

  Der Geschlechter-Zählcode der Lösungsdatei ist hier falsch. Prüfe, ob die
  vorhandenen Daten Treffer liefern. Ein leeres Ergebnis ist gegebenenfalls
  korrekt und muss so geprüft und verständlich angezeigt werden; die Schwelle
  185 aus der Quelle nicht stillschweigend ändern.
- Aufgabe 8 verlangt nur die User-ID; die Anzahl darf zur Erklärung angezeigt
  werden, ist aber ohne entsprechend geänderten Auftrag keine Pflichtspalte.
- Aufgabe 10 benötigt **Browserfamilie und Versionsmaximum** in der Ausgabe;
  ein unbeschriftetes Maximum allein beantwortet die Frage nicht vollständig.
- Aufgabe 11 erfordert `device, COUNT(*)` und `GROUP BY device`. Der erneut
  kopierte Browsercode in der Lösungsdatei beantwortet diese Aufgabe nicht.
- Zeilen derselben Gruppenspalte mit `NULL` bilden in SQL eine gemeinsame
  Gruppe. Wähle im Einstieg bewusst keine fehlenden Städte und behandle
  fehlende Werte in Aufgaben und Auswertung nachvollziehbar.

## 7. SQL-Prüfung, Hilfen und Rückmeldungen

Verwende die vorhandene SELECT-Validierung, Worker-Ausführung und den
Relationsvergleich gegen die ausgeführte Referenzabfrage. Ohne verlangte
Sortierung ist die Zeilenreihenfolge unerheblich; Aufgabe 9 verlangt die
angegebene Sortierung einschließlich Gleichstandsregel. Nutze die bestehende
numerische Toleranz bei Durchschnitten. Gleichwertige Aliase akzeptieren,
solange kein Alias ausdrücklich gefordert ist.

Prüfe bei diesen Übungen den wirksamen Einsatz der verlangten Gruppierung
und Aggregation sowie bei HAVING-Aufgaben die Gruppenbedingung.
Bloße Keyword-Treffer in Kommentaren oder Zeichenketten und fest eingetragene
Ergebniszahlen dürfen keine Aufgabe lösen. Keine neue allgemeine SQL-Parser-
Architektur für diesen Auftrag entwickeln; vorhandene Prüfungen gezielt nutzen.

Jede Karte besitzt die vorhandene Schemaanzeige mit echten Datentypen, ein
SQL-Feld mit neutralem Platzhalter `SELECT ...` / `FROM ...`, ein begrenztes
Ergebnisfenster, einen eigenen Prüfen-Button und drei gestufte Hilfen:
Hinweis → Denkansatz → Teillösung. Das Schema passt zur jeweils verwendeten
Tabelle. Ergebnisse und Fehlermeldungen sicher als Text ausgeben.

Feedback unterscheidet korrekt, teilweise korrekt und noch nicht korrekt.
Typische gezielte Hinweise betreffen eine einzige Gesamtzahl statt Gruppen,
die falsche Gruppenspalte, fehlende Gruppennamen, Aggregatbedingungen in
`WHERE`, eine falsche HAVING-Schwelle und unzulässige Mischprojektionen.
Beim ersten Fehler keine vollständige Musterabfrage anzeigen.

Die beschriebenen SQL-Aufgaben werden deterministisch geprüft. Eine zusätzliche
KI-Bewertung ist dafür nicht erforderlich. Falls die Planung zusätzlich eine
KI-korrigierte Beschreibe-Aufgabe fachlich begründet vorsieht, gelten vollständig
die vorhandene Scaleway-Pipeline, auftragsbezogene Kriterien mit je einem Punkt,
genau ein nächster Verbesserungsschritt sowie die Build-, Test- und
Paketvorgaben aus den Manifesten; keine neue Pipeline einführen.

## 8. Abschlussquiz, Auswertung und Speicherung

Prüfe mit vier bis fünf kurzen Checkbox-Fragen die Gruppenbildung und
Ergebnisform, die Wirkung von `COUNT`/`AVG` pro Gruppe, den Unterschied zwischen
`WHERE` und `HAVING` sowie die fehlende Sortiergarantie von `GROUP BY`.
Mindestens zwei Fragen haben mehrere richtige Antworten. Nur Inhalte prüfen,
die im Pflichtteil eingeführt wurden.

Jede Frage erhält „Frage N prüfen“ mit eigener Rückmeldung direkt darunter.
Der gemeinsame Auswertungsbutton bleibt; wenn alle Fragen einzeln richtig
geprüft wurden, startet die Gesamtauswertung automatisch. Verwende dafür
`addQuizQuestionChecks` und das vorhandene `#final-quiz`-Muster.

Nach bestandenem Quiz im letzten Reiter eine zur Projektion geeignete Übersicht
aller zwölf Aufgaben mit Nummer, vollständigem Auftrag und Referenzabfrage,
den richtigen Quizantworten und den zentralen Merksätzen anzeigen. Freiwillige
Aufgaben dürfen darin aufklappbar sein. Kein zusätzliches Sicherungsblatt und
kein eigenständiges Wiederholungsquiz erstellen; diese sind nicht beauftragt.

Vorhandene Speichermechanismen verwenden, mit einem eigenen versionierten
GROUP-BY-Schlüssel. Alle SQL-Eingaben bereits bei jeder Eingabe speichern,
ebenso Quizauswahl, gelöste Aufgaben, Animationszustand, Freischaltungen und
aktiven Reiter. Beim Zurückkehren vollständig wiederherstellen. Den alten
Aggregatfortschritt nicht als GROUP-BY-Bearbeitung übernehmen oder löschen.
Reset betrifft ausschließlich das neue Modul. Geänderte Eingaben entwerten
alte Bewertungen; verspätete Prüfergebnisse dürfen sie nicht überschreiben.

## 9. Abnahme und Übergabe

**Regelbasierte Vorprüfung:** Links und bestehende Menüposition von Aufgabe 6,
einheitlicher Titel „Gruppierungen mit Group BY“, eigene Zeile
„Aufgabe 6“ direkt unter der Hauptüberschrift, sechs nummerierte Reiter,
zwölf SQL-Aufgaben in der vereinbarten Verteilung, Schema-/CSV-Abgleich,
Referenzabfragen, Quiz-Einzelprüfung und automatische Gesamtauswertung prüfen.
Animation vorwärts, rückwärts und nach Neustart testen. Persistenz in jedem
Reiter auch ohne vorherigen Prüfen-Klick beim Wechsel zur Jahrgangsübersicht
und zurück testen. Laptop, Tablet, Smartphone, Tastatur, Fokus und Reduced
Motion kontrollieren. Kein horizontaler Seitenüberlauf; große Tabellen
scrollen innerhalb ihres Ergebnisfensters. Vorhandene einschlägige Tests und
`git diff --check` ausführen.

**Fachlich-didaktische Endabnahme:** Alle acht Quellenaufgaben korrekt
abgedeckt; fehlerhafte Quelllösungen korrigiert; Animation zeigt Gruppenbildung
und Aggregation nachvollziehbar; Beispiel vor Definition; `WHERE` und `HAVING`
klar getrennt; Ergebnissortierung, NULL, Geburtstag und Versionsmaximum korrekt
eingegrenzt; freiwilliger Transfer ohne neue Pflichtvoraussetzungen; gestufte
Hilfen und passendes Feedback; bestehende Gestaltung und Komponenten erhalten.

Prüfe insbesondere alternative korrekte SQL-Abfragen, fehlendes `GROUP BY`,
falsche Gruppenspalte, verwechseltes `WHERE`/`HAVING`, `SELECT *` mit Gruppierung,
fest eingetragene Resultate, korrekte leere Ergebnisse, Durchschnittstoleranz,
User-ID-Zuordnung und Gleichstände bei Aufgabe 9. Eine falsche Abfrage, die
zufällig ebenfalls keine Zeilen liefert, darf nicht allein deshalb bestehen.

Übergebe bei späterer Umsetzung die geänderten Dateien, die Ergebnisse der
Prüfungen und gegebenenfalls verbleibende konkrete offene Punkte. Keine
erfolgreiche Browser- oder Live-Prüfung behaupten, die nicht durchgeführt wurde.
