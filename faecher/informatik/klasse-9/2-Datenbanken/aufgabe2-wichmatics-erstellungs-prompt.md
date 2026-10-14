# Umsetzungsprompt: Informatik 9 · Datenbanken · neue Aufgabe 2

Verwende den folgenden Text als Auftrag für `/lernmodul-loop`. In Codex führe den entsprechenden vierstufigen Subagenten-Workflow aus. Dieser Prompt beauftragt die vollständige Umsetzung einschließlich Umnummerierung, Sicherungsblatt und Präsentation.

---

Erstelle für Informatik Klasse 9, Einheit Datenbanken, das neue Lernmodul **Aufgabe 2 – Struktur und Anwendung von SQL-Abfragen**. Es steht zwischen „Aufgabe 1 – Warum Datenbanken?“ und der bisherigen „Aufgabe 2 – Erste SQL-Abfragen“. Die bisherige Aufgabe 2 wird vollständig zu **Aufgabe 3** umnummeriert.

Arbeite im Repository `C:/Users/ffran/Documents/git/unterricht`. Die Präsentationsmaterialien liegen im benachbarten Repository `C:/Users/ffran/Documents/git/informatik-material`. Setze alle unten genannten Bestandteile im selben Auftrag um.

## 1. Regeln, Quellen und Vorgehen

Lies vor der Planung vollständig:

- `AGENTS.md` sowie einschlägige lokale Anweisungen in beiden Repositories,
- `manifest-allgemein.txt`,
- `manifest-datenbankaufgaben.txt`,
- `manifest-quizaufgaben.txt`,
- für die Präsentation `../informatik-material/presentations/README.md` und `../informatik-material/presentations/MANIFEST-PRAESENTATION.md`.

Führe den Workflow Planung → Bau → regelbasierte Vorprüfung → Endabnahme gemäß AGENTS.md Abschnitt 13 aus. In Codex gelten die dort genannten Modelle und Grenzen für Korrekturschleifen. Die Planung erstellt eine Spezifikation mit konkreten Referenzen, verbindlichen Wortlauten und getrennten mechanischen sowie fachlich-didaktischen Akzeptanzkriterien. Die weiteren Rollen arbeiten mit dieser Spezifikation.

Prüfe vor Änderungen den Git-Status beider Repositories. Erhalte vorhandene fremde Änderungen. Verwende bestehende Komponenten und halte Änderungen lokal. Im Hauptrepository vorhandene Änderungen an Inf10-Modulen und am Skriptserver dürfen nicht überschrieben werden.

**Verbindliche inhaltliche Quellen:**

- Aufgabenblatt: `faecher/informatik/klasse-9/materialien-db/Wichmatics/SQL-Abfragen.pdf`
- Lösungsblatt: `faecher/informatik/klasse-9/materialien-db/Wichmatics/SQL-Abfragen-Lösung.pdf`

Beide PDFs haben zwei Seiten. Lies und rendere beide Seiten beider Dateien vollständig. Die Abbildungen enthalten relevante SQL-Blöcke und Tabellen, die durch reine Textextraktion nicht vollständig erfasst werden. Erstelle vor dem Bau eine Zuordnung jeder Aufgabe, jeder Teilaufgabe und jeder Lücke zum geplanten Modulbereich und zur Lösung.

Die PDFs sind die maßgebliche Inhaltsquelle. Übernimm Aufgaben, Reihenfolge, Beispiele, Tabellennamen, Spaltennamen, Daten, vorgegebene Ergebnisse und Lerninhalte exakt. Zulässig sind Änderungen der Darstellung für das digitale Medium und die vorgeschriebenen ergänzenden Bedienelemente sowie das Abschlussquiz. Füge keine neuen SQL-Themen hinzu. Insbesondere gehören ORDER BY, DISTINCT und LIMIT der bisherigen Aufgabe 2 zur künftig folgenden Aufgabe 3 und werden nicht in dieses neue Modul vorgezogen.

## 2. Bisherige Aufgabe 2 zu Aufgabe 3 umnummerieren

Die bestehende Aufgabe heißt **Erste SQL-Abfragen**. Erhalte ihre Inhalte und Funktion und ändere die Nummerierung samt zugehörigen Verweisen konsistent:

- `faecher/informatik/klasse-9/2-Datenbanken/aufgabe2.html` → `aufgabe3.html`
- `aufgabe2.js` → `aufgabe3.js`
- `aufgabe2.css` → `aufgabe3.css`
- `aufgabe2-prompt.md` → `aufgabe3-prompt.md`; passe dort Aufgabenbezeichnung und betroffene Dateipfade an.

Passe Seitentitel, sichtbare Aufgabennummer, Skript- und Stylesheet-Verweise, aufgabenspezifische Kennungen sowie alle einschlägigen lokalen Links und Präsentationsverweise an. Suche Verweise gezielt in beiden Repositories. Andere Einheiten mit einer Aufgabe 2 bleiben unverändert.

Berücksichtige den vorhandenen localStorage-Schlüssel `informatik9-datenbanken-aufgabe2-v1`: Erhalte den bisherigen Bearbeitungsstand durch eine gezielte Migration nach Aufgabe 3. Migriere nur Daten im erwarteten Format dieses bisherigen Moduls und überschreibe keinen bereits vorhandenen gültigen Stand von Aufgabe 3. Die neue Wichmatics-Aufgabe erhält einen eigenen Schlüssel, beispielsweise `informatik9-datenbanken-wichmatics-aufgabe2-v1`, und darf niemals den alten SQL-Stand als eigenen Stand laden. Berücksichtige auch einen vorhandenen Zurücksetzen-Button.

Aktualisiere `faecher/informatik/klasse-9/index.html`. Im Datenbankbereich stehen danach genau in dieser Reihenfolge:

1. Aufgabe 1 – Warum Datenbanken?
2. Aufgabe 2 – Struktur und Anwendung von SQL-Abfragen
3. Aufgabe 3 – Erste SQL-Abfragen

Lege die neue Aufgabe unter `faecher/informatik/klasse-9/2-Datenbanken/aufgabe2.html` an, mit `aufgabe2.js` und nur bei Bedarf `aufgabe2.css`. Das neue Modul darf erst nach Sicherung beziehungsweise Umbenennung der bisherigen Dateien deren Namen verwenden.

## 3. Einstieg mit externem Werkzeug

Zu Beginn fordert das Modul die Schülerinnen und Schüler auf, die externe Anwendung zu öffnen. Verwende diesen Wortlaut:

> **Öffne** die SQL-Anwendung über den Button in einem neuen Tab. **Bearbeite** anschließend die Aufgaben hier und probiere die Abfragen in der Anwendung aus.

Buttonbeschriftung: **SQL-Anwendung öffnen ↗**

Zieladresse: `https://wichematik.education/app/sql-abfragen.html`

Setze den Link als semantisches `<a>` mit `target="_blank"` und `rel="noopener noreferrer"` um. Der neue Tab muss aus der Beschriftung oder einem unmittelbar zugeordneten Hinweis hervorgehen. Der Link ist sofort erreichbar und hängt nicht vom Bearbeitungsstand ab.

**Verbindliche Designreferenz:** `faecher/informatik/klasse-10/1-Datenbanken/aufgabe4.html`, Reiter 1 (`#step-1`), dort der Button „Zuordnung prüfen“. Verwende dessen vorhandenen `primary-button`-Stil und die passende `action-row`-Anordnung aus `redundanzen.css`, einschließlich Farben, Verlauf, Abständen, Rundungen, Fokus- und Hoverzuständen. Passe höchstens die für ein Linkelement notwendige Darstellung lokal an. Entwickle keine neue Button-Gestaltung.

Die externe Anwendung bleibt das Werkzeug zum Ausprobieren der Abfragen. Eine eigene Nachbildung ihrer Oberfläche oder eine neue SQL-Engine gehört nicht zum Auftrag. Abbildungen aus dem Aufgabenblatt müssen im Lernmodul dennoch so vorhanden sein, dass jeder Arbeitsauftrag verständlich bleibt.

## 4. Vollständige Umsetzung des Aufgabenblatts

Übernimm die Originalformulierungen aus dem Aufgabenblatt. Teile sie anhand der vorhandenen Abschnitte in überschaubare, fortlaufend nummerierte Reiter auf. Erhalte die ursprüngliche Nummerierung innerhalb der Abschnitte, beispielsweise „Einführung 1“ und „Weiterführend 1“, damit doppelte Nummern eindeutig zugeordnet werden können.

**Seite 1: Einführung in die Struktur und Anwendung von SQL-Abfragen**

- Einstiegsbeispiel `SELECT Name` / `FROM Film` samt Erklärung und Abbildung.
- Aufgabe 1: Vergleich mit `SELECT Name` / `FROM Buch`, freie Beschreibung und Merksatzlücke zu FROM.
- Aufgabe 2: In der externen Anwendung einen weiteren roten Block mit Seiten hinzufügen, die Änderung frei erläutern und die vorformulierte Buch-Abfrage ergänzen.
- Aufgabe 3: Fehler bei `SELECT Seiten` / `FROM Film` frei erklären und die Merksatzlücke zu SELECT ausfüllen.
- Aufgabe 4: Namen und Preise der nach 2014 veröffentlichten Filme abfragen. Übernimm die dargestellte Film-Tabelle und die vorgegebene Ergebnistabelle. Alle drei Merksatzlücken zu WHERE, Zeilen und Bedingungen werden ausgefüllt.
- Aufgabe 5: Alle Informationen zu Filmen abfragen, die nach 2014 veröffentlicht wurden und kürzer als 100 Minuten sind. Übernimm die vorgegebene Minions-Ergebnistabelle und die abschließende Merksatzlücke zur Funktion von SQL-Abfragen.

**Seite 2: Weiterführende Aufgaben**

- Aufgabe 1: Namen und Alter der Einwohner mit blauen Augen abfragen; die SQL-Lücken und die noch leeren Zellen der Ergebnistabelle bearbeiten. Die bereits vorgegebene Zeile Sarah Müller / 21 bleibt vorgegeben.
- Aufgabe 2a: Eine SQL-Abfrage zur vorgegebenen Ergebnistabelle veganer Speisen formulieren.
- Aufgabe 2b: Eine mögliche Motivation des Anwenders frei formulieren.
- Aufgabe 3: Namen und Längen der Filme abfragen, die günstiger als 7 Euro oder nach 2019 erschienen sind; vorgegebene Ergebnistabelle erhalten.
- Aufgabe 4a: Sämtliche Informationen zu den Büchern von Franz Kafka abfragen; vorgegebene Ergebnistabelle erhalten.
- Aufgabe 4b: Zwei verschiedene modifizierte WHERE-Teile frei eingeben, die für den gegebenen Datenbestand dieselbe Ergebnistabelle liefern.

**Eingaben und Rückmeldungen:**

- Jede Lücke wird als frei beschreibbares Textfeld umgesetzt. Verwende keine Dropdowns, Wortbausteine oder Auswahlantworten als Ersatz für die Lücken.
- Verwende für längere Erklärungen und vollständige Abfragen geeignete Textareas. Vorgegebene Teile einer SQL-Abfrage bleiben erkennbar; nur die im Blatt offenen Teile werden ergänzt. Tabellenlücken erhalten Texteingaben direkt in den betreffenden Zellen.
- Keine Musterantwort als vorausgefüllter Wert oder verräterischer Platzhalter. SQL-Klauseln erscheinen jeweils in einer eigenen Zeile, Code wird semantisch ausgezeichnet.
- Alle Freitextfelder erhalten eindeutige, zugängliche Beschriftungen. Schülerinnen und Schüler können Eingaben nach Rückmeldung korrigieren.
- Verwende bestehende Prüfmechanismen. Eindeutige Merksatz- und Tabellenlücken können regelbasiert geprüft werden; berücksichtige fachlich passende Varianten, Leerzeichen und sinnvolle Schreibweisen.
- Freie Beschreibungen, Erläuterungen, Erklärungen und die Motivation nutzen die bestehende Skriptserver-Pipeline mit passenden Bewertungsrubriken. Suche dafür zuerst nach Beschreibe-Aufgaben in Informatik 9, insbesondere den Online-IDE-Programmieraufgaben. Erfinde keine zweite KI-Pipeline. Notwendige Aufgabenregistrierungen und Integrationsdateien gehören zum Bau.
- Für SQL-Prüfungen verwende die vorhandene Validierungs- und Vergleichslogik aus den Datenbankmodulen. Falls eine lokale Ergebniskontrolle verwendet wird, nutze vorhandene SQL-Komponenten mit den originalen Wichmatics-Daten. Keine frei erfundenen Tabellen, Spalten oder Datentypen und keine InstaHub-Daten als Ersatz.
- Prüfe SQL fachlich, nicht durch einen bloßen exakten Zeichenkettenvergleich: Gleichwertige Schreibweisen, Groß-/Kleinschreibung von SQL-Schlüsselwörtern, zusätzliche Leerzeichen und ein optionales Semikolon dürfen keine richtige Antwort ungültig machen. Zeichenkettenwerte behalten ihre fachlich erforderliche Bedeutung.
- Besonders bei Weiterführend 4b sind die Lösungen im PDF Beispiele. Akzeptiere zwei unterschiedliche, für den vorgegebenen Datenbestand korrekte modifizierte Bedingungen; zwei identische Bedingungen erfüllen den Auftrag nicht. Behaupte nicht, die Bedingungen seien für beliebige spätere Datenbestände gleichwertig.
- Rückmeldungen stehen unmittelbar bei der jeweiligen Teilaufgabe, unterscheiden korrekt, teilweise korrekt und noch nicht korrekt und nennen konkrete Hinweise. Beim ersten Fehlversuch wird keine vollständige Musterlösung eingeblendet. Verwende die bestehenden Feedbackklassen, `aria-live="polite"` und bei Skriptserver-Aufgaben die vorhandene Punkteanzeige und Lade-/Fehlerzustände.
- Hilfen, soweit benötigt, verwenden die bestehenden gestuften Hilfe-Komponenten und führen keine zusätzlichen Lerninhalte ein.

## 5. Seitengerüst, Speicherung und Abschluss

Nutze als erste lokale Referenz `faecher/informatik/klasse-9/2-Datenbanken/aufgabe1.html` und `aufgabe1.js`, anschließend die bisherige Aufgabe 2, künftig Aufgabe 3. Verwende deren Karten, Navigation und die gemeinsame `tab-navigation.mjs` aus Informatik 10. Die Reitergestaltung orientiert sich an Inf10 Datenbanken Aufgabe 6: alle Reiter auf einem Laptop ohne horizontales Scrollen, auf kleinen Bildschirmen umbrechend.

- Hauptüberschrift: **Struktur und Anwendung von SQL-Abfragen**.
- Direkt darunter eine eigene Zeile: **Aufgabe 2**.
- Rücklink zur Klassenübersicht, Startseitenlink, `lang="de"`, UTF-8, geeignete Semantik, Tastaturbedienung und sichtbare Fokusmarkierungen.
- Speichere alle Eingaben und den Bearbeitungsstand einschließlich Tabellenzellen, SQL-Felder, Quiz-Auswahlen, Freischaltungen und aktivem Reiter automatisch bei jeder Änderung und stelle sie nach Seitenwechsel wieder her. Verwende `faecher/informatik/klasse-9/eingaben-speichern.js` beziehungsweise die vorhandene Speicherlogik. Die Speicherung funktioniert in allen Reitern; gesperrter oder beschädigter Speicher darf das Modul nicht blockieren.
- Erstelle die vorgeschriebene Abschlussübersicht mit den bearbeiteten Aufgaben, ihren Arbeitsaufträgen und richtigen Ergebnissen. Ihre Freischaltung richtet sich nach den bestehenden Modulen und dem Quizmanifest.
- Das **Abschlussquiz steht im letzten Reiter**. Es prüft ausschließlich die hier erarbeiteten Inhalte: FROM, SELECT, WHERE, Spalten und Zeilen, gültige Spaltenwahl, `*`, AND und OR. Verwende Auswahlkästchen; mindestens zwei Fragen haben mehrere richtige Antworten.
- Verwende die bestehenden Abschlussquiz-Komponenten aus Inf10 Datenbanken und `faecher/informatik/quiz-fragen-pruefen.js` (`addQuizQuestionChecks`). Jede Frage besitzt „Frage N prüfen“ und eine eigene Rückmeldung direkt darunter. Der gemeinsame Auswertungsbutton bleibt; bei einzeln richtig geprüften Fragen erfolgt die Gesamtauswertung automatisch.
- Ein zusätzliches eigenständiges Wiederholungs-Quiz ist in diesem Auftrag nicht beauftragt.

## 6. Sicherungsblatt vollständig erstellen und einbinden

Erstelle im Themenordner:

- `sicherungsblatt-aufgabe-2-loesungen.tex`
- `sicherungsblatt-aufgabe-2-loesungen.pdf`

**Inhaltlich entspricht das Sicherungsblatt exakt beiden Seiten von `SQL-Abfragen-Lösung.pdf`.** Erhalte sämtliche Aufgaben, Lösungen, Merksätze, Beispiele, SQL-Abfragen, Tabellen, Ergebniswerte und fachlich relevanten Abbildungen bzw. Hervorhebungen. Kürze nichts, ergänze keine neuen Inhalte und ersetze es nicht durch eine bloße Zusammenfassung. Erhalte die Quellenangabe zu Wichmatics. Das Blatt darf angesichts der zweitseitigen Vorlage zwei Seiten umfassen; presse die Inhalte nicht auf eine unleserliche Seite.

Verwende eine vorhandene LaTeX-Sicherungsblattvorlage, insbesondere `faecher/informatik/klasse-9/3-Modellierung-und-Programmierung-Online-IDE/sicherungsblatt-aufgabe-1-loesungen.tex`. Vergleiche ergänzend die Datenbank-Sicherungsblätter aus Informatik 10, beispielsweise Aufgabe 4. Übernimm den bestehenden Kopf mit Farben, Typografie und Abständen und passe seine Beschriftungen auf **INFORMATIK · KLASSE 9**, **Aufgabe 2 – Struktur und Anwendung von SQL-Abfragen**, **Sicherungsblatt** und **LÖSUNGEN** an. Die inhaltliche Vollständigkeit der Wichmatics-Lösung hat Vorrang vor Verdichtung.

Kompiliere das LaTeX-Dokument, rendere jede PDF-Seite und prüfe sie visuell auf Lesbarkeit, Überläufe, abgeschnittene Tabellen und korrekte Zeichen, insbesondere Umlaute in SQL-Spaltennamen. Vergleiche die neue Fassung anschließend Seite für Seite inhaltlich mit dem Original-Lösungsblatt. Liefere die `.tex`-Quelle und das fertige PDF; keine LaTeX-Hilfsdateien oder Renderbilder als produktive Dateien.

Binde den Download über die vorhandene `solution-download`-/`solution-reveal`-Komponente mit `unlockSolution` ein. Ein neuer Lehrercode folgt dem vorhandenen Schema für Informatik, Klasse 9, Aufgabe 2; halte ihn in `lehrercodes-dekodierung.tex` und im neu gebauten, visuell geprüften `lehrercodes-dekodierung.pdf` sowie der bestehenden Materialverwaltung konsistent.

Der Sicherungsblattbereich steht im letzten Reiter beim Abschlussquiz und zusätzlich in einem vorhandenen separaten Auswertungs-/Übersichtsbereich. Der Zugang im letzten Reiter ist von Anfang an erreichbar; die einzige Hürde ist der Lehrercode, kein bestandenes Quiz oder Aufgabenfortschritt. Der Downloadlink bleibt bis zur korrekten Codeeingabe verborgen. Bei zwei gleichzeitig vorhandenen Kopien verwende eindeutige IDs mit Suffix `-summary`; das Eingabefeld heißt in beiden Formularen weiterhin `name="solution-code"`.

## 7. Inf9-Präsentation ergänzen

Prüfe die bestehende Präsentation und ihre Quelldaten unter `../informatik-material/inf9` und `../informatik-material/presentations/modules`. Ergänze die passende Inf9-Datenbank-Präsentation und aktualisiere die bisherige Aufgabe 2 auf Aufgabe 3.

Zum Zeitpunkt der Prompt-Erstellung ist unter `inf9` keine eigene Datenbank-Präsentation oder entsprechende `inf9-datenbanken`-Modulquelle erkennbar. Falls sie auch bei der Umsetzung fehlt, erstelle sie mit dem vorhandenen Präsentationsgenerator:

- Quelldaten: `../informatik-material/presentations/modules/inf9-datenbanken/presentation.json`
- HTML-Ausgabe: `../informatik-material/inf9/2-Datenbanken/inf9-datenbanken.html`
- Weitere vorhandene Ausgabeformate nach dem Präsentationsmanifest erzeugen und prüfen.

Verwende `presentations/modules/inf9-tabellenkalkulation/presentation.json` für Klassenlink und Inf9-QR-Muster sowie `presentations/modules/inf10-datenbanken/presentation.json` für die Gestaltung einer Datenbank-Modulpräsentation. Nutze `presentations/scripts/build-html-presentation.mjs` und die vorhandenen Prüf-/Exportskripte; erfinde keinen neuen Präsentationsgenerator.

Die Aufgabenfolien stehen in dieser Reihenfolge:

1. Aufgabe 1 – Warum Datenbanken?
2. Aufgabe 2 – Struktur und Anwendung von SQL-Abfragen
3. Aufgabe 3 – Erste SQL-Abfragen

Die neue Aufgabenfolie enthält den passenden Link und QR-Code zur Inf9-Aufgabenübersicht oder den verifizierten direkten Modulzugang, die Anweisung zum Öffnen von Aufgabe 2 und den Lehrercode für das Sicherungsblatt als Einblendschritt nach dem vorhandenen Muster. In der Referentenansicht steht ein kurzer Hinweis auf die externe SQL-Anwendung. Prüfe, dass QR-Code und angezeigter Link dieselbe Adresse verwenden. Erfinde keine Kurzlinks; übernimm nur verifizierte vorhandene Links oder die aus der Projektkonfiguration ermittelte vollständige HTTPS-Adresse.

Erhalte sonstige Präsentationen und bereits vorhandene Folien. Aktualisiere erforderliche Übersichts-/Navigationsverweise im Materialrepository und prüfe die neu erzeugten Folien einschließlich Einblendungen, Tastaturnavigation und Referentenansicht.

## 8. Abnahme und Abschlussbericht

**Regelbasierte Vorprüfung:**

- Alte Aufgabe vollständig als Aufgabe 3 erhalten; alle betroffenen Datei-, Menü- und Präsentationsverweise stimmen.
- Neue Aufgabe 2 liegt im richtigen Themenordner und im Menü zwischen Aufgabe 1 und Aufgabe 3.
- Jede Aufgabe, Teilaufgabe und Lücke beider PDF-Seiten ist in der Quellenzuordnung und im Modul vorhanden; alle Lücken sind frei beschreibbar.
- Externer Einstiegslink, Linkziel, neuer Tab und vorhandener Buttonstil stimmen.
- Speicherung aller Eingabearten und des aktiven Reiters durch Seitenwechsel im Browser geprüft; alte und neue Aufgabe vermischen keine Speicherstände.
- Abschlussquiz mit Checkboxen, mindestens zwei Mehrfachantwortfragen, Einzelprüfungen, Gesamtauswertung und letzter Reiter vorhanden.
- Sicherungsblatt als LaTeX und PDF erstellt, vollständig mit der Original-Lösung abgeglichen und jede Seite gerendert und visuell geprüft.
- Download an den vorgeschriebenen Stellen erreichbar, anfangs verborgen und ausschließlich durch Lehrercode freigeschaltet; Code stimmt mit Dekodierquelle, Dekodier-PDF und Präsentation überein.
- Lokale HTML-, CSS-, JS-, Bild- und PDF-Links existieren; Navigation, Eingabelabels und dynamische Rückmeldungen funktionieren mit Tastatur und ohne reine Farbcodierung.
- Desktop, Tablet und Smartphone getestet; kein unbeabsichtigtes horizontales Seitenscrollen.
- Präsentation samt Quelldaten, Links, QR-Code, Nummerierung und Lehrercode-Einblendung aktualisiert und geprüft.
- Passende vorhandene Syntax-, Build-, Lint- und Testbefehle sowie `git diff --check` für beide Repositories erfolgreich; sachfremde Änderungen erhalten.

**Fachlich-didaktische Endabnahme:**

- Inhaltliche Übereinstimmung mit beiden Wichmatics-PDFs; keine fehlenden Aufgaben oder zusätzlich eingeführten SQL-Themen.
- SELECT wählt Spalten, FROM die Quelltabelle und WHERE Zeilen nach Bedingungen; AND und OR sowie die Vergleichsgrenzen sind korrekt.
- Falsche Spaltenwahl, `*`, Textbedingungen, boolesche Werte und alternative WHERE-Teile werden fachlich angemessen behandelt.
- Fachlich richtige Freitext- und SQL-Varianten werden akzeptiert; Rückmeldungen unterstützen die Korrektur ohne sofortige vollständige Lösung.
- Aufgabenfolge, Originalbeispiele und vorgegebene Tabellen bleiben verständlich; alle dargestellten Daten stimmen mit den Quellen überein.
- Bestehende Komponenten, Gestaltung, Skriptserver- und Speicherlogik werden sinnvoll wiederverwendet.
- Sicherungsblatt enthält exakt die vollständigen Inhalte der Lösung, mit angeglichenem LaTeX-Kopf und gut lesbarer Darstellung.

Beende den Auftrag erst nach erfolgreicher Vorprüfung und Endabnahme innerhalb der vorgegebenen Schleifengrenzen. Berichte knapp über erstellte und umbenannte Dateien, wiederverwendete Komponenten, Prüfungen, Lehrercode und Präsentationsausgabe. Benenne tatsächlich verbleibende Blockaden und notwendige externe Schritte konkret.
