# Auftrag: Informatik 10 – Programmierung, Lernmodule Aufgabe 3 bis 6

Übertrage die Aufgaben 3 bis 6 der Seite
https://hilmar-vogel.de/show.php?Klasse=10&Fach=Info in vier Lernmodule der
Einheit `faecher/informatik/klasse-10/2-Modellierung-und-Programmierung-Online-IDE/`.

Es handelt sich um eine **Serie**: eine gemeinsame Konzeption, vier Artefakte
(`aufgabe3.html` bis `aufgabe6.html`) plus die zugehörigen Einträge auf dem
Skriptserver.

## 1. Verbindliche Grundlagen

- `AGENTS.md`, `manifest-allgemein.txt` (vollständig),
  `manifest-online-ide-programmieraufgaben.txt` (vollständig),
  `manifest-quizaufgaben.txt` (für die Abschlussquizze).
- **Technische und gestalterische Vorlage** sind die beiden vorhandenen
  Aufgaben derselben Einheit:
  - `aufgabe1.html` (Beschreibe-Aufgaben über den Skriptserver,
    Klassendiagramme auf dem AB, Bonusaufgaben),
  - `aufgabe2.html` (Programmieraufgaben mit Codeauswertung per POST und
    anschließender JSONP-Abfrage der `requestId`, Struktogramm auf dem AB mit
    Selbstkontroll-Häkchen).
  Layout (IDE links, Aufgabenspalte rechts), Einbindung der Online-IDE über
  `include/`, Antwortfelder, Prüfbuttons, Rückmeldungsboxen, Fehlerbehandlung
  und Speicherung der Eingaben im `localStorage` von dort übernehmen. Keine
  neue Auswertungs- oder Layoutlogik erfinden.
- Notation von Klassenkarten wie in `loesungsblatt-aufgabe-1.html`
  (`attribut: Typ`, `methode(param: Typ): Rückgabetyp`, Vererbungspfeil mit
  leerer Dreiecksspitze zur Oberklasse).

## 2. Quellmaterial

Die Originalseiten liegen unter `https://hilmar-vogel.de/learnJ10/aufgabe3.html`
bis `aufgabe6.html`. **Mit `curl` roh laden**, nicht über eine Zusammenfassung
— die Startdateien für die IDE stecken in `<script type="plain/text" title="…">`-
Blöcken im `iframe` und müssen wörtlich übernommen werden. Die Originale
verweisen auf ein Arbeitsblatt („siehe AB“), das nicht vorliegt; die dafür
nötigen Angaben stehen unten.

Vor der Übernahme jede Startdatei in der eingebetteten Online-IDE ausführen
und prüfen, ob sie dort fehlerfrei läuft (z. B. `@override` vs. `@Override`,
Dezimalzahlen an `float`-Parameter, `int _inhalt` bei `float inhalt` in
`Kaffeemaschine`). Offensichtliche Fehler korrigieren und die Korrektur in der
Spezifikation vermerken.

## 3. Die vier Module

### Aufgabe 3 – Wiederholung Roboter: Quader

Original:
- a) Roboter mit dem Objektnamen `dudu` in einer 12×12-Welt erstellen.
- b) `dudu` baut einen Quader aus Ziegeln: 3 Ziegel lang, 5 Ziegel breit,
  4 Ziegel hoch.
- c) Programmcode notieren und Struktogramm zeichnen.

Umsetzung:
- Startdatei `Hauptprogramm.java` mit Kommentar als Einstieg; auf Aufgabe 2
  als Hilfe verweisen.
- Da das AB fehlt, den Quader in der Aufgabenspalte eindeutig beschreiben
  (Grundfläche 3 × 5 Felder, auf jedem Feld 4 Ziegel übereinander) und eine
  kleine Skizze oder Schrägansicht beifügen. Vorher in der IDE klären, wie
  `new Robot(…)` die Weltgröße festlegt (Aufgabe 2 nutzt
  `new Robot(1, 1, 15, 15)`) und wie `hinlegen()` stapelt.
- a) und b) als Programmieraufgaben über den Skriptserver auswerten, wie
  `10-2a` bis `10-2c`. Die Bewertung soll verschachtelte Schleifen als
  erwarteten Lösungsweg erkennen, aber jede funktional korrekte Lösung
  akzeptieren.
- c) Struktogramm aufs AB, Selbstkontroll-Häkchen wie Aufgabe 2d.
- Gestufte Hilfen zu b): (1) Zerlege den Quader in Schichten oder Reihen,
  (2) eine Reihe der Länge 3 als innere Schleife, (3) Gerüst mit zwei
  verschachtelten `for`-Schleifen und Lücken.

### Aufgabe 4 – Wiederholung Vererbung und Polymorphie

Original (Startdateien `Hauptprogramm`, `Artikel`, `Computer`,
`Kaffeemaschine`, `Laptop`, `Smartphone`, `Tower` wörtlich übernehmen):
- a) Funktionsweise des Hauptprogramms beschreiben.
- b) Klassendiagramm der benutzten Klassen erstellen.
- c) Beschreiben, an welcher Stelle Polymorphie auftritt; die Befehle notieren,
  die bei Vererbung bzw. Polymorphie verwendet werden.

Umsetzung:
- Lernfluss: Programm ausführen und Ausgaben beobachten → a) beschreiben →
  **Infokarte „Vererbung und Polymorphie“** (siehe Abschnitt 4) → b) → c).
- a) und c) als Beschreibe-Aufgaben über den Skriptserver.
- b) Vererbungshierarchie per Drag-and-Drop mit vorhandenem System prüfen
  (Artikel → Smartphone, Computer, Kaffeemaschine; Computer → Laptop, Tower);
  Kanten müssen die Knoten berühren. Das vollständige Klassendiagramm mit
  Attributen und Methoden zusätzlich aufs AB, Selbstkontroll-Häkchen.
- Rückmeldungen zu c) sollen typische Fehlvorstellungen aufgreifen, z. B.
  „Polymorphie heißt, dass eine Klasse mehrere Unterklassen hat“ oder
  „`super` ruft die Methode der Unterklasse auf“.

### Aufgabe 5 – Vererbung programmieren: Tiere

Original:
- a) Klassendiagramm in Java-Code umwandeln; Tätigkeiten nur per `println`.
- b) Eigenes Hauptprogramm mit Objekten von `Tier`, `Hund`, `Katze`, `Delfin`;
  Implementierung testen.
- c) Bonus: weitere Unterklasse zu `Tier` und zu `Hund` nach eigener Wahl.

Das fehlende Klassendiagramm wird als Vorlage in der Aufgabenspalte
dargestellt (Klassenkarten-Darstellung wie `1-Datenbanken/aufgabe2.html`,
Notation wie `loesungsblatt-aufgabe-1.html`):

```
Tier                       (Oberklasse, verbindlich so)
  alter: int
  name: String
  zeigeDaten(): void

Hund  ──▷ Tier             Katze ──▷ Tier             Delfin ──▷ Tier
  rasse: String              freigaenger: boolean       tauchtiefe: int
  bellen(): void             miauen(): void             schwimmen(): void
  zeigeDaten(): void         zeigeDaten(): void
```

- Bewusst **ohne Konstruktor** und **ohne Sichtbarkeitsmodifikatoren**:
  Konstruktoren in Klassenkarten kommen erst in Aufgabe 6, und Unterklassen
  sollen ohne `private`/`protected`-Thematik auf `name` und `alter` zugreifen.
  Objekte bekommen ihre Werte per Zuweisung (`h.name = "Bello";`).
- `Hund` und `Katze` überschreiben `zeigeDaten()`, `Delfin` nicht. So sehen
  die Schülerinnen und Schüler beim Testen den Unterschied zwischen geerbter
  und überschriebener Methode.
- Startdateien: `Hauptprogramm.java` und `Tier.java` mit Kommentar wie im
  Original; Hinweis, dass weitere Dateien mit „+“ angelegt werden.
- a) und b) als Programmieraufgaben über den Skriptserver. Die Codeauswertung
  muss mehrere Dateien berücksichtigen; prüfen, ob die vorhandene Clientlogik
  (`getText()` der Hauptdatei) dafür erweitert werden muss, und dabei die
  Längenregeln aus `manifest-online-ide-programmieraufgaben.txt` beachten.
  b) soll mindestens einen polymorphen Aufruf verlangen
  (`Tier t = new Hund(); t.zeigeDaten();`).
- c) Bonus, optional; Auswertung über den Skriptserver nur mit offener Rubrik.
- Gestufte Hilfen zu a): (1) welches Schlüsselwort verbindet Unter- und
  Oberklasse, (2) welche Attribute muss `Hund` selbst nicht mehr deklarieren,
  (3) Codegerüst für `Hund` mit Lücken.
- Kompakte Merkkarte (aufklappbar) mit den Inhalten aus Abschnitt 4, damit
  Aufgabe 5 auch ohne Aufgabe 4 bearbeitbar ist.

### Aufgabe 6 – Erweiterte Klassenkarte

Original (Startdateien `Hauptprogramm` und `Grafik` wörtlich übernehmen):
- a) Erweiterte Klassenkarte zu `Grafik` mit Datentypen, Ein- und
  Ausgabeparametern und Konstruktor.
- b) Datentypen der Attribute beschreiben.
- c) Klassendiagramm um `Rectangle` ergänzen (Attribute und Methoden aus dem
  Programmcode).
- d) Ebenso `Circle`.
- e) Funktionsweise von `kiste.rotate(45)` mit Fachausdrücken beschreiben.

Umsetzung:
- **Infokarte „Erweiterte Klassenkarte“** vor a): Datentyp von Attributen,
  Eingabeparameter mit Typ, Rückgabetyp (Ausgabeparameter, `void`),
  Konstruktor in der Klassenkarte; Beispiel an einer Klasse, die nicht
  `Grafik` ist (z. B. `Ball` aus Aufgabe 1), damit a) nicht vorweggenommen wird.
- a), c), d) als Klassenkarten-Aufgaben mit der vorhandenen
  Klassenkarten-Komponente aus `1-Datenbanken/aufgabe2.html` (Bausteine in
  Attribut- und Methodenbereich ziehen, clientseitig prüfen), mit Distraktoren
  für typische Fehler (fehlender Rückgabetyp, Parameter ohne Typ, Konstruktor
  mit Rückgabetyp, `extends Actor` als Attribut). Bei `Rectangle` und `Circle`
  nur die im Programmcode tatsächlich benutzten Elemente verlangen.
- b) und e) als Beschreibe-Aufgaben über den Skriptserver. Erwartete
  Fachbegriffe zu e): Objekt `kiste`, Methodenaufruf, Punktnotation,
  Parameter/Argument `45`, Methode der Klasse `Rectangle`.
- Kurzer Rückverweis auf die Merkkarte Vererbung, weil `Grafik extends Actor`
  wieder auftaucht.

## 4. Entscheidung: Infokarten statt Wiederholungseinheit

**Keine eigene Wiederholungseinheit** zwischen den Aufgaben. Begründung:
Bereits Aufgabe 4 fragt nach Polymorphie und bringt mit der Artikel-Hierarchie
genau das Beispielprogramm mit, an dem man die Begriffe entdecken kann. Eine
zusätzliche Einheit würde Aufgabe 4 doppeln, die Reihe verlängern und widerspräche
dem Gebot kompakter Module.

Stattdessen:

- **Aufgabe 4** enthält die Einführung als Infokarte, platziert **nach** dem
  Ausführen und Beobachten (erst Beispiel, dann Definition, dann Anwendung).
- **Aufgabe 5** enthält dieselben Inhalte als aufklappbare Merkkarte zum
  Nachschlagen.
- **Aufgabe 6** braucht vor allem die erweiterte Klassenkarte (eigene
  Infokarte, siehe oben) und verweist für `extends Actor` auf die Merkkarte.

Inhalt der Infokarte „Vererbung und Polymorphie“ — **nur diese Konzepte**:

1. Oberklasse und Unterklasse, „ist ein“-Beziehung (ein Laptop *ist ein*
   Computer *ist ein* Artikel).
2. `extends`: die Unterklasse erbt Attribute und Methoden der Oberklasse.
3. `super(…)` im Konstruktor der Unterklasse ruft den Konstruktor der
   Oberklasse auf.
4. Überschreiben: die Unterklasse definiert eine geerbte Methode neu
   (`@Override`); ohne Überschreiben wird die geerbte Methode ausgeführt.
5. Polymorphie: eine Variable vom Typ der Oberklasse kann auf ein Objekt einer
   Unterklasse verweisen (`Artikel smart1 = new Smartphone(…)`); beim Aufruf
   `smart1.zeigeInfos()` wird die Methode des tatsächlichen Objekts ausgeführt.
6. Darstellung im Klassendiagramm: Pfeil mit leerer Dreiecksspitze zur
   Oberklasse; überschriebene Methoden erscheinen in der Unterklassenkarte
   erneut.

Ausdrücklich **nicht** behandeln: abstrakte Klassen, Interfaces, Überladen,
Sichtbarkeitsmodifikatoren, Typumwandlung/`instanceof`, Fachbegriffe wie
statische/dynamische Bindung.

## 5. Skriptserver

- Für alle Beschreibe- und Programmieraufgaben neue Einträge in
  `apps-script/Tasks.gs` anlegen, im Stil der vorhandenen Einträge
  `1a`–`1f` (Beschreibe) und `10-2a`–`10-2c` (Code). Vorgeschlagene Keys:
  `10-3a`, `10-3b`, `10-4a`, `10-4c`, `10-5a`, `10-5b`, `10-5c`, `10-6b`,
  `10-6e`.
- Jeder Eintrag enthält Kontextcode, Musterlösung bzw. erwartete Aussagen,
  Bewertungsanweisung und die Statusstufen *korrekt / teilweise korrekt /
  noch nicht korrekt*. Rückmeldungen erklären das fachliche Warum und nennen
  bei Fehlern einen konkreten Ansatzpunkt, ohne die Lösung vorwegzunehmen.
- Die Änderungen an `apps-script/` gehören ausdrücklich zum Auftrag, sind aber
  rein additiv: bestehende Schnittstellen, Funktionsnamen und
  Result-Strukturen bleiben unverändert. Kopfkommentar in `Config.gs` um die
  vier neuen Seiten ergänzen.
- Tests nach Vorlage `apps-script/tests/aufgabe2-client.test.js` ergänzen,
  wo eine Clientlogik neu oder erweitert ist (insbesondere Mehrdatei-Code in
  Aufgabe 5).
- Hinweis an die Lehrkraft am Ende: Apps-Script-Bereitstellung auf eine neue
  Version aktualisieren.

## 6. Für alle vier Module

- Abschlussquiz am Ende jedes Moduls nach Vorlage `#final-quiz` in
  `1-Datenbanken/` (Auswahlkästchen, mindestens zwei Fragen mit mehreren
  richtigen Antworten, wählbare Fehlvorstellungen).
- Aufgabenstellungen kurz und handlungsorientiert, mit Operatoren; Aufträge
  zur IDE stehen über bzw. neben der IDE.
- Zeichenaufgaben (Struktogramm, Klassendiagramm) bleiben auf dem AB, mit
  Selbstkontroll-Häkchen wie in Aufgabe 2d.
- Eingaben und Bearbeitungsstand im `localStorage` sichern.
- Menüeinträge in `faecher/informatik/klasse-10/index.html` im Abschnitt
  „2. Objektorientierte Modellierung und Programmierung“ hinter Aufgabe 2
  ergänzen, gleiche Gestaltung wie die vorhandenen Buttons.
- Kein Sicherungsblatt und kein Wiederholungs-Quiz erstellen (separater
  Auftrag).
- `aufgabe1.html` und `aufgabe2.html` nicht verändern.
- Responsiv auf Desktop, Tablet, Smartphone prüfen; IDE bleibt bedienbar.
