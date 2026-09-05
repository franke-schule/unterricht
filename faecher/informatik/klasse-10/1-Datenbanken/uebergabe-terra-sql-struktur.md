# Übergabe an Terra: SQL-Lernstruktur für `users` und `photos`

## Auftrag und Ergebnis

Baue für **Informatik Klasse 10 – Datenbanken** eine wiederverwendbare,
clientseitige SQL-Lernstruktur und verwende sie anschließend in zwei neuen
Lernmodulen:

1. **Aufgabe 5:** SQL-Abfragen an der Tabelle `users` üben.
2. **Aufgabe 6:** das Kreuzprodukt der Tabellen `users` und `photos` entdecken
   und ausführen.

SQL soll direkt im Browser ausgeführt werden. Dafür ist das bereits im
Repository vorhandene `sql.js` zu verwenden. Die Entscheidung, ob eine Lösung
korrekt ist, muss deterministisch durch Ausführen und Vergleichen der
Ergebnisrelation erfolgen. Der vorhandene Skriptserver und Gemini sind für die
erste Umsetzung ausdrücklich **nicht erforderlich**.

Das Ergebnis soll keine allgemeine SQL-IDE und kein neues Framework sein,
sondern eine kleine, lokal begrenzte Komponente aus vorhandener Technik,
Aufgabenkonfiguration und zwei Seiten im Stil der bisherigen Datenbankmodule.


## Verbindliche Grundlagen

Vor Änderungen vollständig beachten:

- `AGENTS.md`
- `manifest-allgemein.txt`
- bestehende Seiten und Komponenten im Ordner
  `faecher/informatik/klasse-10/1-Datenbanken/`

Zentrale Projektregel: Vorhandene Strukturen wiederverwenden. Keine neue
Website-Architektur, kein Build-System und kein externer SQL-Dienst.

Es gibt derzeit nicht zum Auftrag gehörende Änderungen im Arbeitsbaum. Diese
nicht zurücksetzen, überschreiben oder in die SQL-Änderungen hineinziehen.


## Vorhandene technische Bausteine

### SQL-Engine

Bereits vorhanden sind:

- `include/lib/sql.js/sql-wasm.js`
- `include/lib/sql.js/sql-wasm.wasm`
- `include/lib/sql.js/worker.sql-wasm.js`

Der vorhandene Worker versteht mindestens die Aktionen `open`, `exec`,
`each`, `export` und `close`. Er liegt neben der benötigten WASM-Datei und soll
bevorzugt direkt genutzt werden. Dadurch blockiert eine Abfrage nicht die
Oberfläche.

Aus einer Moduldatei im Datenbankordner lässt sich der Worker beispielsweise
über eine URL relativ zu `import.meta.url` erzeugen. Keine CDN-Version von
`sql.js` ergänzen.

### CSV-Daten

- `users.csv`
- `photos.csv`

In `beziehungen.js` und `redundanzen.js` existiert bereits die Funktion
`parseDelimited`. Diese Logik als technische Vorlage verwenden oder in eine
gemeinsam nutzbare Funktion überführen, ohne die bestehenden Seiten unnötig zu
ändern.

Beim Import gilt:

- Trennzeichen ist `;`.
- Anführungszeichen, eingebettete Trennzeichen, Umlaute und Emojis müssen
  erhalten bleiben.
- Der Textwert `NULL` wird als SQL-`NULL` importiert.
- Zahlenfelder werden als Zahlen und nicht als Text eingefügt.
- Inserts mit vorbereiteten Statements oder mindestens mit sicherer
  SQL-String-Escapierung erzeugen.

Empfohlenes SQLite-Schema:

```sql
CREATE TABLE users (
  id INTEGER,
  name TEXT,
  username TEXT,
  email TEXT,
  email_verified_at TEXT,
  password TEXT,
  bio TEXT,
  gender TEXT,
  birthday TEXT,
  city TEXT,
  country TEXT,
  centimeters INTEGER,
  avatar TEXT,
  role TEXT,
  is_active INTEGER,
  remember_token TEXT,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE photos (
  id INTEGER,
  user_id INTEGER,
  description TEXT,
  url TEXT,
  created_at TEXT,
  updated_at TEXT
);
```

Die tatsächliche Spaltenreihenfolge muss mit den CSV-Kopfzeilen abgeglichen
werden. Nicht stillschweigend von der Reihenfolge dieses Beispiels ausgehen.


## Wichtige Datenbegrenzung

Die vollständigen Dateien enthalten derzeit:

- `666` Datensätze in `users`
- `1468` Datensätze in `photos`
- damit `666 × 1468 = 977.688` Zeilen im vollständigen Kreuzprodukt

Aufgabe 5 darf die vollständige Tabelle `users` verwenden. Aufgabe 6 darf
hingegen **nicht** das vollständige Kreuzprodukt materialisieren oder im DOM
anzeigen.

Für Aufgabe 6 einen festen, nachvollziehbaren Ausschnitt echter CSV-Datensätze
verwenden, zum Beispiel drei Benutzer und vier Fotos. Die Tabellen heißen in
der Übungsdatenbank trotzdem `users` und `photos`; nur ihr Inhalt ist auf den
didaktischen Ausschnitt begrenzt. Der Ausschnitt muss:

- mindestens ein Foto je ausgewähltem Benutzer enthalten,
- mindestens einen Benutzer mit mehreren Fotos enthalten,
- überschaubar bleiben; empfohlen sind `3 × 4 = 12` Kreuzproduktzeilen,
- deterministisch über feste IDs ausgewählt werden, nicht zufällig.

Die ausgewählten Namen, Benutzernamen und gekürzten Fotobeschreibungen vor der
Verwendung gegen die aktuellen CSV-Dateien prüfen.


## Vorgeschlagene lokale Dateistruktur

Die genaue Aufteilung darf an vorhandene Konventionen angepasst werden. Die
Verantwortlichkeiten sollen jedoch getrennt bleiben:

```text
1-Datenbanken/
├── aufgabe5.html
├── aufgabe6.html
├── sql-lab-core.mjs       # reine Validierungs- und Vergleichslogik
├── sql-lab.js             # Worker, CSV-Import, DOM und Seitenzustand
├── sql-lab.css            # nur SQL-spezifische Ergänzungen
└── tests/
    └── sql-lab-core.test.mjs
```

Vorhandene Layout- und UI-Klassen aus `redundanzen.css` und
`tabellenschema.css` übernehmen, insbesondere:

- `.learning-shell`, `.module-header`, `.progress-card`
- `.step-tabs`, `.step-panel`, `.step-heading`
- `.scenario-card`, `.task-card`, `.help-stack`
- `.primary-button`, `.secondary-button`
- `.feedback` mit `success`, `hint`, `error` beziehungsweise vorhandenen
  Teilrückmeldungen
- `.table-shell`, `.table-caption`, `.table-scroll`, `.data-table`

Nur fehlende Editor-, SQL- und Ergebnistabellen-Stile in `sql-lab.css`
ergänzen. Bestehende CSS-Dateien nicht großflächig umbauen.


## Schnittstelle der SQL-Komponente

Die gemeinsame Komponente soll mindestens folgende Verantwortlichkeiten
abdecken:

1. Worker starten und über eindeutige Nachrichten-IDs ansprechen.
2. CSV-Dateien laden und eine neue In-Memory-Datenbank aufbauen.
3. Je Seite einen klar definierten Datensatzmodus laden:
   - `users-full` für Aufgabe 5,
   - `users-photos-sample` für Aufgabe 6.
4. eine erlaubte SQL-Abfrage prüfen und ausführen,
5. Ergebnisform `{ columns, values }` normalisieren,
6. Ergebnisrelation sicher als DOM-Tabelle ausgeben,
7. tatsächliches und erwartetes Ergebnis vergleichen,
8. verständliche deutsche Rückmeldungen erzeugen,
9. Worker beim Zurücksetzen oder Verlassen sauber schließen.

Keine Ergebniswerte über `innerHTML` einsetzen. Tabellenzellen mit
`textContent` erzeugen, damit CSV- oder SQL-Inhalte nicht als HTML interpretiert
werden.


## Zulässige SQL-Eingaben

Für diese beiden Aufgaben wird genau **eine lesende `SELECT`-Anweisung**
akzeptiert. Ein abschließendes Semikolon ist erlaubt.

Nicht nur nach einem einfachen Teilstring suchen. Eine kleine lexikalische
Prüfung soll mindestens Zeichenketten und SQL-Kommentare berücksichtigen, damit
beispielsweise ein Semikolon innerhalb eines Textwerts nicht fälschlich als
zweite Anweisung gilt.

Zurückweisen:

- mehrere SQL-Anweisungen,
- `INSERT`, `UPDATE`, `DELETE`, `REPLACE`,
- `CREATE`, `ALTER`, `DROP`,
- `PRAGMA`, `ATTACH`, `DETACH`, `VACUUM`,
- leere Eingaben,
- für diese Aufgaben auch rekursive CTEs und sonstige nicht benötigte
  Spezialkonstrukte.

Groß-/Kleinschreibung und beliebige fachlich harmlose Leerzeichen dürfen keine
Rolle spielen. Eine korrekte Lösung darf nicht an der Formatierung oder an einem
fehlenden Semikolon scheitern.

Die Datenbank ist ohnehin flüchtig. Die Einschränkung dient vor allem einer
klaren Lernumgebung und dem Schutz vor versehentlich teuren Abfragen.


## Ergebnisdarstellung und Begrenzung

Für jede gültige Abfrage intern alle für die Aufgabe notwendigen Zeilen
ermitteln. Im DOM jedoch höchstens eine konfigurierte Anzahl anzeigen, zum
Beispiel 100 Zeilen. Bei gekürzter Darstellung deutlich melden:

> 100 von 666 Ergebniszeilen werden angezeigt.

Die Ausgabe benötigt:

- eine Tabellenüberschrift beziehungsweise ein `caption`,
- Spaltenköpfe mit `scope="col"`,
- Textdarstellung `NULL` für Nullwerte,
- einen leeren Ergebniszustand mit verständlichem Text,
- horizontales Scrollen nur innerhalb von `.table-scroll`,
- keine farbabhängige Bedeutung ohne zusätzliche Textmeldung.

Beim Kreuzprodukt entstehen doppelte Spaltennamen wie `id`. In dem festen
Kreuzprodukt-Schritt müssen die sichtbaren Überschriften daher die Herkunft
erkennen lassen, zum Beispiel `users.id` und `photos.id`. Dies darf über
Metadaten der Aufgabenkonfiguration geschehen; kein allgemeiner fehleranfälliger
SQL-Parser nur für dekorative Spaltenüberschriften bauen.


## Deterministische Korrektur

Eine Schülerlösung niemals durch bloßen Vergleich mit einem vorgegebenen
SQL-String bewerten. Stattdessen:

1. Schülerabfrage ausführen.
2. Für dieselbe unveränderte Datenbasis die konfigurierte Referenzabfrage
   ausführen.
3. Beide Ergebnisrelationen normalisieren.
4. Spalten und Zeilen gemäß Aufgabenkonfiguration vergleichen.

Standardmäßig sind Relationen ungeordnet. Deshalb Zeilen als **Multimenge**
vergleichen: gleiche Zeilen einschließlich ihrer Häufigkeit, aber unabhängig
von der Reihenfolge. Nur bei einer ausdrücklich verlangten Sortieraufgabe muss
die Reihenfolge übereinstimmen.

Konfigurierbare Vergleichsmerkmale vorsehen:

- Spaltenreihenfolge relevant oder frei,
- Spaltenbezeichnungen beziehungsweise Aliasse relevant oder frei,
- Zeilenreihenfolge relevant oder frei,
- numerische Toleranz für spätere Durchschnittswerte,
- maximale sichtbare Zeilenzahl.

Mindestens folgende Rückmeldungsstufen unterscheiden:

- **korrekt:** erwartete Relation erreicht; Ergebnis anzeigen und Schritt
  abschließen,
- **teilweise korrekt:** beispielsweise richtige Spalten, aber falsche
  Zeilenauswahl,
- **noch nicht korrekt:** strukturell falsches Ergebnis oder fehlende Eingabe,
- **SQL-Fehler:** Abfrage konnte nicht ausgeführt werden.

Typische SQLite-Meldungen in altersgerechte Hinweise übersetzen:

- `no such table` → Tabellenname prüfen,
- `no such column` → Attributname und Schreibweise prüfen,
- `ambiguous column name` → Tabellenname vor den Spaltennamen setzen,
- `near ... syntax error` → Syntax in der Nähe des genannten Ausdrucks prüfen.

Keine vollständige Musterlösung beim ersten Fehlversuch ausgeben. Hilfen wie in
den bestehenden Modulen gestuft anbieten.

In den überprüften Aufgabenschritten wird die Ergebnisrelation erst nach einer
korrekten Lösung sichtbar. Für einen ausdrücklich als „Ausprobieren“
gekennzeichneten Einstieg darf eine Konfiguration dagegen jedes gültige
`SELECT`-Ergebnis zeigen. Beide Modi sollen dieselbe Komponente verwenden.


## Aufgabenkonfiguration statt Speziallogik

Die Aufgaben als Daten konfigurieren. Beispielhafte Form:

```js
{
  id: "users-berlin",
  prompt: "Zeige alle Mitglieder aus Berlin.",
  referenceSql: "SELECT * FROM users WHERE city = 'Berlin'",
  hints: [
    "Grenze die Datensätze mit WHERE ein.",
    "Vergleiche das Attribut city mit einem Textwert.",
    "Textwerte stehen in einfachen Anführungszeichen."
  ],
  compare: {
    columnOrder: true,
    columnLabels: false,
    rowOrder: false
  },
  reveal: "on-correct",
  maxVisibleRows: 100
}
```

Die konkrete Referenzabfrage ist nicht als Klartext in der Schüleroberfläche
anzuzeigen. Eine clientseitige Seite kann Lösungen technisch nie geheim halten;
hier geht es um eine angemessene Unterrichtshürde, nicht um kryptografischen
Schutz.


## Aufgabe 5: SQL-Abfragen mit `users`

Direkte fachliche Grundlage sind die vorhandenen Materialien in
`material-sql-wdh/`, besonders `abfragenInstaHub_02.docx`. Nicht sämtliche
Arbeitsblattfragen ungefiltert auf eine einzige Bildschirmseite übertragen.

Die Lernschritte sollen vom einfachen Lesen zum kombinierten Anwenden führen.
Geeignete Progression:

1. **Entdecken:** kleiner Ausschnitt aus `users`, Spalten und Datentypen
   wiederholen.
2. **Alle Spalten:** grundlegendes `SELECT * FROM users`.
3. **Projektion:** gezielt zwei oder drei Attribute auswählen.
4. **Textbedingung:** `WHERE`, beispielsweise Stadt oder Geschlecht.
5. **Zahlenbedingung:** Vergleich mit `centimeters`.
6. **Mustersuche:** `LIKE` mit `%`.
7. **Bedingungen verbinden:** `AND` beziehungsweise `OR`.
8. **Sichern:** kurze Übersicht mit selbst formulierten beziehungsweise
   korrekt gelösten Abfragen.

Die endgültigen Beispiele gegen die echten Daten aus `users.csv` ausführen.
Keine Aufgabe verwenden, deren erwartetes Ergebnis leer oder durch geänderte
CSV-Daten offensichtlich ungeeignet ist.

Für den Editor genügt ein gut beschriftetes, mehrzeiliges `textarea` in
Monospace-Schrift. Monaco nicht nur für Syntaxfärbung einführen. Optional:

- `Strg`/`Cmd` + `Enter` führt die Abfrage aus,
- Schaltfläche „SQL-Abfrage prüfen“,
- sichtbares Label,
- `spellcheck="false"`,
- Ergebnis- und Fehlermeldungen über `aria-live="polite"`.


## Aufgabe 6: Kreuzprodukt `users × photos`

Fachliche Grundlage sind die Materialien in `material-kreuzprodukt/`, besonders
`AB-Kreuzprodukt.docx` und `Skript3-Kreuzprodukt-Verbund.pdf`.

Empfohlene Progression:

1. **Vorhersagen:** Anzahl der Zeilen aus der Größe beider Ausgangstabellen
   bestimmen.
2. **Entdecken:** Zeilenkarten oder zwei kleine Tabellen gedanklich vollständig
   kombinieren.
3. **Ausführen:** Kreuzprodukt mit der im Material verwendeten
   Kommaschreibweise erzeugen:

   ```sql
   SELECT *
   FROM users, photos;
   ```

4. **Beobachten:** Jede `users`-Zeile wird mit jeder `photos`-Zeile kombiniert;
   Ergebniszahl `m × n`.
5. **Einordnen:** Im ungefilterten Kreuzprodukt passen viele Kombinationen
   fachlich nicht zusammen. `users.id` und `photos.user_id` als auffällige
   Verbindungsspalten markieren.
6. **Ausblick:** Eine Bedingung kann unpassende Kombinationen entfernen. Den
   Verbund höchstens als nächsten Gedanken ankündigen, falls er erst in einer
   späteren Aufgabe ausführlich behandelt werden soll.

Die grafische und tabellarische Erklärung muss das Kreuzprodukt sichtbar
machen. Die Lernleistung darf nicht ausschließlich aus dem Abschreiben der
fertigen SQL-Anweisung bestehen.


## Skriptserver und KI-Feedback

Für Syntaxprüfung, Ausführung und Korrektheitsentscheidung keinen Aufruf an
`apps-script` ergänzen. Die lokale Engine liefert dafür genauere und schnellere
Ergebnisse und überträgt keine Schülerabfrage an einen externen Dienst.

Die Struktur darf einen späteren optionalen Feedback-Hook zulassen. Falls eine
spätere Erweiterung KI-Feedback verwendet:

- lokale Ausführung bleibt die Quelle für `korrekt` oder `nicht korrekt`,
- nur Aufgaben-ID, SQL-Eingabe und eine knappe lokale Fehlerdiagnose senden,
- keine vollständigen CSV-Datensätze mitsenden,
- die vorhandene Skriptserver-Transportlogik wiederverwenden,
- Datenschutz-Hinweis und Fehler-Fallback ergänzen.

Diese Erweiterung ist nicht Teil der ersten Umsetzung.


## Zustand und Navigation

Wie in den vorhandenen Datenbankmodulen:

- abgeschlossene Schritte und Schülerabfragen in `localStorage` speichern,
- für Aufgabe 5 und 6 getrennte, versionierte Storage-Keys verwenden,
- nach einer geänderten Eingabe veraltetes Erfolgsfeedback entfernen,
- nächsten Schritt erst nach korrekter Bearbeitung freigeben,
- „Modul neu beginnen“ löscht nur den Zustand dieser Aufgabe und baut die
  flüchtige Datenbank neu auf,
- Aufgabe 5 und Aufgabe 6 in dieser Reihenfolge in
  `faecher/informatik/klasse-10/index.html` ergänzen,
- Rückweg zur Klassenübersicht und Link zur Startseite wie in Aufgabe 4.

Ein Sicherungsblatt ist nur zu erstellen, wenn es im Zuge der konkreten
Aufgabenplanung ausdrücklich vorgesehen ist. Falls es erstellt wird, gelten
Lehrercode-Schema, Downloadkomponente und Manifest unverändert.


## Barrierearmut und responsive Darstellung

Mindestens umsetzen und prüfen:

- sichtbare Labels für SQL-Eingaben,
- ausreichend große Schaltflächen,
- Tastaturbedienung und sichtbare Fokuszustände,
- `aria-live="polite"` für dynamisches Feedback,
- richtige/falsche Rückmeldung zusätzlich als Text, nicht nur als Farbe,
- Tabellenüberschriften mit semantischen `th`-Elementen,
- Ergebnistabellen auf kleinen Bildschirmen innerhalb eines klar erkennbaren
  Scrollbereichs,
- lange Texte, URLs und Spaltennamen dürfen das Layout nicht sprengen,
- Lade- und Fehlerzustand, falls CSV, Worker oder WASM nicht geladen werden
  können.


## Tests

Die reine Logik in `sql-lab-core.mjs` so halten, dass sie mit dem vorhandenen
Node ohne Browser testbar ist. Mindestens testen:

### SQL-Eingabeprüfung

- `SELECT` in verschiedener Groß-/Kleinschreibung wird akzeptiert.
- Ein abschließendes Semikolon wird akzeptiert.
- Ein Semikolon in einem String ist keine zweite Anweisung.
- Zwei echte Anweisungen werden abgelehnt.
- Schreib- und Verwaltungsanweisungen werden abgelehnt.
- Kommentare vor einer gültigen Abfrage werden korrekt behandelt.

### CSV und Typen

- Semikolon in einem zitierten Feld,
- doppelte Anführungszeichen,
- Umlaute und Emojis,
- `NULL` wird `null`,
- IDs und `centimeters` werden Zahlen.

### Ergebnisvergleich

- gleiche ungeordnete Relationen werden akzeptiert,
- Duplikate werden als Multimenge berücksichtigt,
- fehlende oder zusätzliche Zeilen werden erkannt,
- Spaltenreihenfolge kann je Aufgabe relevant oder frei sein,
- sortierte Aufgaben prüfen die Zeilenreihenfolge,
- `NULL`, Zahl und Text werden nicht ungewollt gleichgesetzt.

### Manueller Browser-Smoke-Test

- beide CSVs und WASM laden ohne Konsolenfehler,
- gültige Abfrage liefert die richtige Relation,
- falsche Tabelle und falsches Attribut liefern deutsches Feedback,
- Ergebnis bleibt vor korrekter Lösung verborgen, wenn so konfiguriert,
- Kreuzprodukt besitzt exakt `m × n` Zeilen,
- Neustart setzt nur die aktuelle Aufgabe zurück,
- Desktop, Tablet und Smartphone funktionieren sinnvoll.


## Abnahmekriterien

Die Übergabe ist umgesetzt, wenn:

- [ ] `sql.js` lokal aus `include/lib/sql.js/` verwendet wird.
- [ ] Kein externer SQL-Dienst und kein neuer Gemini-Aufruf nötig ist.
- [ ] Aufgabe 5 SQL-Abfragen auf der vollständigen `users`-Tabelle ausführt.
- [ ] Aufgabe 6 einen festen kleinen Ausschnitt aus `users` und `photos`
      verwendet.
- [ ] Nur einzelne lesende Abfragen akzeptiert werden.
- [ ] Korrektheit über die Ergebnisrelation statt über SQL-Textvergleich
      bestimmt wird.
- [ ] Alternative gleichwertige SQL-Lösungen akzeptiert werden.
- [ ] Feedback zwischen korrekt, teilweise korrekt, noch nicht korrekt und
      SQL-Fehler unterscheidet.
- [ ] Ergebnisrelationen sicher, semantisch und responsiv gerendert werden.
- [ ] Das vollständige Kreuzprodukt der Originaldateien weder erzeugt noch im
      DOM dargestellt wird.
- [ ] Neue Aufgaben im Klassenmenü in richtiger Reihenfolge erscheinen.
- [ ] Unit- und Browserprüfungen erfolgreich sind.
- [ ] Inline-JavaScript beziehungsweise Module syntaktisch gültig sind.
- [ ] Lokale Links existieren und `git diff --check` keine Fehler meldet.
- [ ] Fremde Änderungen im Arbeitsbaum unberührt geblieben sind.


## Nicht tun

- Keine SQL-Abfragen an die produktive InstaHub-Datenbank senden.
- Keine Datenbank oder API auf dem Skriptserver neu aufbauen.
- Keine SQL-Texte ausschließlich per Regex mit Musterlösungen vergleichen.
- Keine vollständige Million-Zeilen-Kreuzproduktrelation rendern.
- Keine externen CDN-Abhängigkeiten ergänzen.
- Kein React-, Vue- oder sonstiges Framework nur für diese Aufgaben einführen.
- Bestehende Aufgaben 1 bis 4 nicht refaktorieren, wenn es für die gemeinsame
  SQL-Struktur nicht zwingend erforderlich ist.


## Empfohlene Reihenfolge für Terra

1. Manifeste und Referenzseiten lesen.
2. CSV-Schema und einige echte Datensätze prüfen.
3. Reinen Validator und Relationsvergleich samt Tests bauen.
4. Worker-Schnittstelle und Datenbankimport isoliert testen.
5. gemeinsamen SQL-Editor und Ergebnisrenderer bauen.
6. Aufgabe 5 datengetrieben umsetzen und im Browser prüfen.
7. festen Ausschnitt sowie Kreuzproduktlogik für Aufgabe 6 umsetzen.
8. Navigation, Speicherung, Barrierearmut und responsive Darstellung prüfen.
9. Syntaxchecks, Tests, Linkprüfung und `git diff --check` ausführen.

Vor Abschluss kurz dokumentieren, welche SQL-Dialektunterschiede zwischen
SQLite/sql.js und der in InstaHub verwendeten Datenbank für diese Aufgaben
relevant sind. Für die hier vorgesehenen Grundlagen (`SELECT`, `WHERE`,
Vergleiche, `LIKE`, `AND`, `OR`, `ORDER BY`, Aggregatfunktionen, `GROUP BY`,
`HAVING` und Kommaschreibweise des Kreuzprodukts) sind keine grundsätzlichen
Hindernisse zu erwarten.

## Ergänzung zur Endprüfung von Aufgabe 5

Blatt 2 A10 vergleicht beim heutigen Geburtstag nur Monat und Tag der als
`YYYY-MM-DD` gespeicherten Geburtsdaten und begrenzt weiterhin auf die
Jahrgänge 2005 bis 2010. Damit eine heute zufällig leere Ergebnisrelation nicht
beliebige ebenfalls leere Abfragen als richtig bewertet, führt dieselbe lokale
sql.js-Datenbank zusätzlich eine transiente Ergebnisprobe mit zwei verschobenen
Geburtsdaten aus. Die Änderungen liegen in einem `SAVEPOINT` und werden vor der
sichtbaren Ausführung vollständig zurückgerollt; angezeigt werden ausschließlich
echte Datensätze aus `users.csv`. Der Vergleich bleibt relationsbasiert und
enthält keinen SQL-Textvergleich.

Die zwei ausdrücklich geforderten Beschreibe-Aufgaben (`sql-b2-3` und
`sql-b3-1`) verwenden die bereits vorhandene Apps-Script-/Gemini-Pipeline.
Alle SQL-Abfragen und die Selbstkontrolle von Blatt 3 A3 bleiben vollständig
lokal; es wurde keine weitere Server-Pipeline ergänzt.
