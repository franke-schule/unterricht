# Auftrag: Informatik 11 – Codierung und Verschlüsselung, Lernmodul Aufgabe 1

Erstelle das erste Lernmodul des neuen Abschnitts **„2. Codierung und
Verschlüsselung“** in Informatik Klasse 11:
`faecher/informatik/klasse-11/2-Codierung-und-Verschluesselung/aufgabe1.html`.

Thema: **Binärzahlen sowie Zeichencodierung mit ASCII und Unicode.**

## 1. Verbindliche Grundlagen

- `AGENTS.md`, `manifest-allgemein.txt` (vollständig),
  `manifest-quizaufgaben.txt` (für das Abschlussquiz).
- **Technische und gestalterische Vorlage** ist das kNN-Modul derselben
  Jahrgangsstufe:
  - `1-Kuenstliche-Intelligenz/aufgabe7.html` mit `knn/ui/task7.mjs`,
    `knn/task7.css` und `knn/tests/task7-contract.test.mjs`. Von dort
    übernehmen: Reiter-Navigation (frei wechselbar, Weiter-Button am Ende
    jedes Reiters), Speicherung aller Eingaben im `localStorage`,
    Rückmeldungsboxen, Beschreibe-Aufgabe über den Skriptserver mit
    `perzeptron/ui/semantic-answer.mjs`, Abschlussquiz als letzter Reiter,
    Contract-Tests.
  - Ordnerstruktur analog `knn/`: ein Unterordner (Vorschlag `binaer/`) mit
    `ui/`, `logic/`, `data/`, `tests/` und eigener CSS-Datei; die Logik
    (Umrechnung, Prüfung) in `logic/` als reine, testbare Funktionen.
  - Für Einstiegsanimationen zusätzlich `aufgabe0.html` (`was-ist-ki/`) als
    Gestaltungsreferenz prüfen.
- Keine neue Reiter-, Quiz- oder Auswertungslogik erfinden.

## 2. Quellmaterial

Fachliche Grundlage ist `material-codierung/AB1-Binär.docx`. Der Ordner
`material-codierung` kann jederzeit gelöscht werden: **nichts daraus
verlinken oder einbinden**, alle nötigen Inhalte ins Modul übernehmen. Inhalt
des Blatts:

1. „Stelle die Dezimalzahlen binär dar. Orientiere dich an dem ersten
   Beispiel.“ Tabelle mit den Spalten Dezimalzahl, 2⁷ = 128, 2⁶ = 64, 2⁵ = 32,
   2⁴ = 16, 2³ = 8, 2² = 4, 2¹ = 2, 2⁰ = 1.
   Beispielzeile: 7 → 0 0 0 0 0 1 1 1.
   Zu bearbeiten: **18, 27, 100, 200, 50, 10, 250** (in dieser Reihenfolge).
2. Text: Möchte man Buchstaben durch binäre Daten darstellen, muss man jedem
   Buchstaben eine eindeutige Bitfolge zuordnen. Solche Zuordnungen heißen
   Zeichensatz (allgemeiner: Codierung). Zwei davon sind ASCII und Unicode.
   Auftrag: „Vergleiche die beiden und notiere ihre Eigenschaften.“
   (Auf dem Blatt zwei Notizzettel „ASCII“ und „Unicode“.)

Lösungen zu 1 (für Prüflogik und Endabnahme):
18 = 00010010, 27 = 00011011, 100 = 01100100, 200 = 11001000,
50 = 00110010, 10 = 00001010, 250 = 11111010.

## 3. Aufbau des Moduls (Reiter)

Reihenfolge entdecken → verstehen → anwenden → übertragen. Jede Simulation
samt Steuerung ohne Scrollen sichtbar; Aufträge zu einer Animation stehen
über ihr.

### Reiter 1 – Zählen mit nur zwei Ziffern (Entdecken)

- **Animation „Zählwerk“**: zwei Zählwerke nebeneinander, oben dezimal (Ziffern
  0–9), unten binär (Ziffern 0–1). Schritt- und Abspiel-Button,
  Geschwindigkeit wählbar, Zurücksetzen. Beim Übertrag (9 → 10 bzw. 1 → 10,
  11 → 100) wird die überlaufende Stelle sichtbar hervorgehoben und der
  Übertrag in die nächste Stelle animiert.
- Kurzer Beobachtungsauftrag über der Animation, z. B. „Beobachte, wann im
  Binärzählwerk eine neue Stelle entsteht.“
- Danach 2–3 Multiple-Choice- oder Eingabefragen zur Beobachtung (z. B. bei
  welchen Zahlen kommt eine neue Stelle hinzu → 2, 4, 8, 16), mit Feedback je
  Frage, das das Warum erklärt.

### Reiter 2 – Stellenwerte (Verstehen)

- **Interaktive Bitreihe**: acht Lampen bzw. Schalter mit den Beschriftungen
  128 … 1. Antippen schaltet ein Bit an/aus; die Summe der Stellenwerte wird
  live als Dezimalzahl angezeigt (z. B. „64 + 4 + 1 = 69“). Bedienbar per
  Tastatur, Zustand nicht nur über Farbe erkennbar (0/1 als Ziffer sichtbar).
- 2–3 kleine Zielaufträge („Stelle 5 dar“, „Stelle 12 dar“, „Welche
  größte Zahl lässt sich mit 8 Bit darstellen?“) mit sofortigem Feedback.
- **Erst danach Infokarte „Stellenwertsystem“**: Vergleich Dezimalsystem
  (345 = 3·100 + 4·10 + 5·1, Basis 10) und Binärsystem (Basis 2, Stellenwerte
  sind Zweierpotenzen, von rechts mit 2⁰ beginnend), Begriffe **Bit** und
  **Byte** (8 Bit), Wertebereich 0–255 bei 8 Bit.
- Das Umrechnungsverfahren (größte passende Zweierpotenz abziehen) wird hier
  **nicht** vorgegeben; es soll in Reiter 3 über Hilfen erschlossen werden.

### Reiter 3 – Dezimalzahlen umwandeln (Anwenden)

- Die Tabelle des Arbeitsblatts als digitale Tabelle mit denselben
  Spaltenköpfen (2⁷ = 128 … 2⁰ = 1); Zeile „7“ als ausgefülltes Beispiel,
  danach die sieben Zahlen aus Abschnitt 2.
- Eingabe je Zelle als Umschalter 0/1 (großzügige Klickfläche, Tablet), nicht
  als freies Textfeld.
- Prüfung je Zeile, Rückmeldung in drei Stufen:
  - korrekt,
  - teilweise korrekt / noch nicht korrekt mit konkretem Hinweis, der den
    Wert der eingegebenen Bitfolge nennt, z. B. „Deine Bitfolge ergibt 22 –
    das sind 4 zu viel. Prüfe, welches Bit du zu viel gesetzt hast.“
  - Lösung wird nie beim ersten Fehlversuch angezeigt.
- Gestufte Hilfen (vorhandene Hilfe-Komponente):
  1. Suche den größten Stellenwert, der noch in die Zahl passt.
  2. Ziehe ihn ab und wiederhole mit dem Rest.
  3. Vorgerechnetes Beispiel mit 7 bzw. erster Schritt für die aktuelle Zahl
     (z. B. „100 − 64 = 36, also Bit 64 = 1 …“).
- Mobil: Tabelle muss auf Smartphone bedienbar sein (ggf. kartenweise
  Darstellung je Zahl statt breiter Tabelle).

### Reiter 4 – Buchstaben als Bitfolgen (Entdecken/Verstehen)

- **Einführungsanimation ASCII**: Ein kurzes Wort (z. B. „Hallo“) wird
  Zeichen für Zeichen zerlegt: Zeichen → Nummer in der ASCII-Tabelle → 7-Bit-
  bzw. 8-Bit-Muster in der Bitreihe aus Reiter 2. Verbindungspfeile müssen die
  verbundenen Elemente tatsächlich berühren. Daneben ein Ausschnitt der
  ASCII-Tabelle mit hervorgehobener Zeile.
- **Grenze von ASCII sichtbar machen**: Die Animation erhält danach Zeichen
  wie „ä“, „€“, „猫“, „😀“, die in ASCII keinen Platz haben (128 Zeichen,
  7 Bit) – deutliche, nicht nur farbliche Markierung „nicht in ASCII“.
- **Einführungsanimation Unicode**: dieselben Zeichen erhalten ihren
  Unicode-Codepunkt (U+00E4, U+20AC, U+732B, U+1F600); sichtbar wird, dass
  die ersten 128 Codepunkte genau ASCII entsprechen und dass Unicode-Zeichen
  bei der Speicherung (UTF-8) 1 bis 4 Byte belegen.
- **Zeichen-Inspektor**: Eingabefeld für ein eigenes Wort; je Zeichen werden
  Codepunkt, „in ASCII ja/nein“ und Anzahl Byte in UTF-8 angezeigt.
- Fachliche Eckdaten (verbindlich, für Animation und Prüfung):
  - ASCII: 1963 normiert, 7 Bit, 128 Zeichen (Steuerzeichen, Ziffern,
    lateinische Groß- und Kleinbuchstaben ohne Umlaute, Satz- und
    Sonderzeichen); `A` = 65, `a` = 97. 8-Bit-Erweiterungen (z. B. ISO 8859-1)
    sind nicht einheitlich.
  - Unicode: ordnet jedem Zeichen aller Schriftsysteme sowie Symbolen und
    Emojis einen eindeutigen Codepunkt zu (U+0000 bis U+10FFFF, über eine
    Million möglich, rund 150 000 vergeben); U+0000–U+007F identisch mit
    ASCII; gespeichert meist als UTF-8 mit 1–4 Byte je Zeichen.
  - Unterscheidung **Zeichensatz (Unicode)** vs. **Codierung (UTF-8)** nur so
    weit, wie für die Byte-Anzahl nötig; keine UTF-8-Bitmuster-Regeln.

### Reiter 5 – ASCII und Unicode vergleichen (Übertragen)

- Beschreibe-Aufgabe über den Skriptserver nach Vorlage der Beschreibe-Aufgabe
  in `aufgabe7.html` (`11-7-1`). Auftrag, z. B.: „Beschreibe den Unterschied
  zwischen ASCII und Unicode. Gehe auf Umfang, darstellbare Zeichen und
  Speicherbedarf ein.“
- Gestaltung in Anlehnung an das Blatt: zwei Notizkarten „ASCII“ und
  „Unicode“ als Denkanstoß; die Antwort wird aber in **einem** Antwortfeld
  abgegeben und als Ganzes bewertet.
- Gestufte Hilfen: (1) Denke an die Anzahl der Zeichen, (2) welche Zeichen aus
  dem Zeichen-Inspektor fehlten in ASCII, (3) Satzanfänge „ASCII verwendet …
  Bit und kann … Zeichen darstellen. Unicode dagegen …“.

### Reiter 6 – Abschlussquiz

- Nach Vorlage `#final-quiz` in `informatik/klasse-10/1-Datenbanken/` bzw.
  dem Quiz in `aufgabe7.html`: Auswahlkästchen, mindestens zwei Fragen mit
  mehreren richtigen Antworten, typische Fehlvorstellungen als wählbare
  Antworten, Feedback erklärt das Warum.
- Themen: Stellenwerte, Umrechnung, Bit/Byte, Wertebereich, ASCII, Unicode.
- Geeignete Fehlvorstellungen, z. B.: „Das Bit ganz links hat den Wert 1“,
  „Binär 100 bedeutet hundert“, „Mit 8 Bit lassen sich Zahlen bis 256
  darstellen“, „Unicode ist nur ein anderer Name für ASCII“, „Jedes
  Unicode-Zeichen belegt genau 2 Byte“, „Mit ASCII lassen sich deutsche
  Umlaute darstellen“.

## 4. Skriptserver

- Neuer Eintrag in `apps-script/Tasks.gs` im Stil von `11-3a-f`
  (`title`, `grade`, `maxPoints`, `systemInstruction`, `instruction`,
  `context`, `expectedAspects`, `rubric`, `feedbackHints`, `statusLabels`).
  Vorgeschlagener Key: `inf11-cod-a1-ascii-unicode`.
- Erwartete Aspekte:
  1. ASCII verwendet 7 Bit und umfasst 128 Zeichen.
  2. ASCII enthält nur lateinische Buchstaben ohne Umlaute, Ziffern, Satz-
     und Steuerzeichen; andere Schriften, Umlaute und Emojis fehlen.
  3. Unicode ordnet den Zeichen aller Schriftsysteme (inkl. Symbolen/Emojis)
     eine eindeutige Nummer zu und umfasst sehr viel mehr Zeichen.
  4. Unicode ist zu ASCII kompatibel: die ersten 128 Zeichen sind gleich.
  5. Unicode-Zeichen benötigen je nach Zeichen mehr Speicher (UTF-8: 1–4 Byte).
- Rubrik: gleichwertige Formulierungen anerkennen („8 Bit“ bei ASCII als
  erweitertes ASCII akzeptieren, wenn nicht als einheitlicher Standard
  behauptet); falsch und nicht als Aspekt werten: „Unicode hat immer 16 Bit“,
  „Unicode ersetzt die ASCII-Codes durch andere Nummern“, „ASCII kann Umlaute“.
- Statusstufen *korrekt / teilweise korrekt / noch nicht korrekt*;
  Rückmeldungen nennen den fehlenden Aspekt als Ansatzpunkt, ohne
  Musterlösung.
- Rein additiv: bestehende Einträge, Schnittstellen und Result-Strukturen
  bleiben unverändert. Kopfkommentar in `apps-script/Config.gs` um die neue
  Seite ergänzen; Test nach Vorlage der vorhandenen Tests in
  `apps-script/tests/` ergänzen.
- Hinweis an die Lehrkraft am Ende: Apps-Script-Bereitstellung auf eine neue
  Version aktualisieren.

## 5. Menü und Rahmen

- In `faecher/informatik/klasse-11/index.html` eine neue `topic-section`
  „2. Codierung und Verschlüsselung“ (ID z. B. `topic-codierung`) hinter
  „1. Künstliche Intelligenz“ anlegen, Button „Aufgabe 1 – Binärzahlen und
  Zeichencodierung“ im Stil der vorhandenen `module-button`s.
- Titel: `Aufgabe 1 – Binärzahlen und Zeichencodierung | Informatik 11`.
- Kein Sicherungsblatt und kein Wiederholungs-Quiz erstellen (separater
  Auftrag).
- Module in `1-Kuenstliche-Intelligenz/` nicht verändern; gemeinsam genutzte
  Dateien (z. B. `semantic-answer.mjs`) nur importieren, nicht anpassen.
- Responsiv auf Desktop, Tablet und Smartphone prüfen, insbesondere
  Umrechnungstabelle, Bitreihe, Animationen und ASCII-Tabellenausschnitt.
- Contract- und Logiktests für Umrechnung und Zeilenprüfung ergänzen
  (Vorlage `knn/tests/`).
