# Spezifikation: Werkzeug für Klassen- und Objektdiagramme

Status: Planung; noch kein Implementierungscode. Maßgeblich für Bau, Vorprüfung und Endabnahme.

## 1. Ziel und Abgrenzung

Ein browserbasiertes Werkzeug erlaubt Schülerinnen und Schülern, Klassenkarten,
Objektkarten, Klassendiagramme und Objektdiagramme auf einer gemeinsamen
Zeichenfläche zu erstellen. Die Palette ist zur Orientierung in **Mittelstufe**
und **Oberstufe** gegliedert. Das sind Überschriften, keine getrennten Modi oder
Zugriffsschranken: Alle angebotenen Elemente können auf derselben Zeichenfläche
verwendet werden.

Das Werkzeug ist eine eigenständige Arbeitsfläche ohne Aufgabenfolge,
Antwortkorrektur, Auswertung oder Musterlösung. Es erhält deshalb kein
Abschlussquiz und kein Sicherungsblatt. `AGENTS.md` und
`manifest-allgemein.txt` gelten für Gestaltung, Kartenform, Navigation,
Zwischenstände und Barrierearmut. Die Quizpflicht gilt für neu erstellte oder
inhaltlich überarbeitete **Lernmodule**. Die bestehende Online-IDE-Aufgabe 2
wird lediglich anstelle ihres Platzhalters auf das Werkzeug verlinken; ihre
Aufgaben- und Auswertungslogik bleibt unangetastet. Sollte der Bau stattdessen
die Aufgabe inhaltlich erweitern, sind Quiz- und weitere Modulregeln gesondert
zu erfüllen.

Keine externe Laufzeitabhängigkeit und keine serverseitige Speicherung. Es
werden keine fremden Skripte oder Grafiken von klassenkarte.de eingebunden.

## 2. Quellen und vorhandene Bausteine

- Die direkte Anwendung `https://klassenkarte.de/kdm/index.html` und die
  KDM-Startseite lieferten bei der Recherche HTTP 502. Bedienung und visuelle
  Details konnten daher nicht interaktiv geprüft werden.
- Die offizielle Dokumentation
  `https://klassenkarte.de/index.php/tools/kdm/` benennt die Kartentypen,
  Linienwerkzeuge, rein clientseitige Ausführung und die Farbschemata
  `whitebg` und `nocolor`. Aus ihr folgt **nicht**, wie Dialoge, Dragging,
  Dateiformate oder Screenshot-Export im Detail funktionieren.
- Der Suchindex zur KDM-Startseite nennt „Screenshot“, „KDM-Dokument speichern
  und laden“ und „Farbschema“. Diese Funktionsnamen sind bekannt, ihre konkrete
  Bedienung ist nicht verifiziert. Die unten beschriebenen Abläufe sind
  Projektentscheidungen und keine Behauptung über eine identische KDM-Oberfläche.
- `faecher/informatik/klasse-9/1-Tabellenkalkulation/dfd-editor.js` und
  `dfd-editor.css` sind die **technische Vorlage** für SVG-Zeichenfläche,
  Knoten-/Kantenmodell, Werkzeugwahl, Pointer-Bedienung, Eigenschaftenbereich,
  Statusmeldungen, Autospeichern und SVG-Bildexport. Deren fachliche
  DFD-Validierung, Rechenlogik, Ports und feste Knotengeometrie passen nicht
  und werden nicht in den neuen Editor importiert. Kleine Muster können
  lokal übernommen werden; der DFD-Editor bleibt unverändert.
- `faecher/informatik/klasse-10/1-Datenbanken/beziehungen.css`,
  `redundanzen.css` und `tabellenschema.css` sind die **Darstellungsvorlage**
  für Klassenkarten, Trennlinien, editierbare Zeilen und Kardinalitätslabels.
  `styles.css` setzt Klassenkarten grundsätzlich eckig.
- `faecher/informatik/klasse-9/3-Modellierung-und-Programmierung-Online-IDE/aufgabe2.html`
  enthält in Aufgabe 2d einen Platzhalter. Die Aufgabenspalte ist auf breiten
  Bildschirmen nur etwa 320–420 px breit. Ein dort eingebetteter vollständiger
  Diagrammeditor wäre zu schmal. Ein Link öffnet die eigenständige Arbeitsfläche;
  die bestehende IDE und die Antworten bleiben auf der Aufgabenkarte erhalten.
- `manifest-online-ide-programmieraufgaben.txt` wurde wegen des Linkeingriffs
  in die vorhandene Aufgabe geprüft. IDE, Teilaufgaben-Keys, Rückmeldungen,
  Lehrercode und Apps Script werden nicht geändert. Ein Datenbank- oder
  Physikmanifest ist für diese Werkzeugseite nicht einschlägig.

## 3. Einbauort und geplante Dateien

| Datei | Änderung |
| --- | --- |
| `faecher/informatik/diagrammwerkzeug.html` | Neue eigenständige Seite mit Navigation, kurzem Bedienhinweis, Editor-Mount und lokalen CSS-/JS-Links. `lang="de"`, UTF-8, sichtbare Links zurück zu Informatik (`./`) und zur Startseite (`../../`). |
| `faecher/informatik/diagrammwerkzeug.css` | Ausschließlich auf die Werkzeugseite begrenzte Editorregeln und responsive Darstellung; keine globale Neugestaltung. |
| `faecher/informatik/diagrammwerkzeug.js` | Zustandsmodell, Rendering, Bearbeitung, Kantenberechnung, Dateioperationen und Autospeicherung. |
| `faecher/informatik/diagrammwerkzeug.test.js` | Gezielte Tests für Dokumentvalidierung, Speichern/Laden-Durchlauf und Kanten-/Kartengeometrie, soweit reine Funktionen abtrennbar sind. |
| `faecher/informatik/index.html` | Unter den Jahrgangsbuttons ein knapper Werkzeugbereich mit Link `diagrammwerkzeug.html`; vorhandene `topic-section`-/`module-button`-Muster nutzen. |
| `faecher/informatik/klasse-9/3-Modellierung-und-Programmierung-Online-IDE/aufgabe2.html` | Nur den Platzhalter in Aufgabe 2d durch einen klar beschrifteten Link `../../diagrammwerkzeug.html` ersetzen; der Arbeitsauftrag steht weiterhin davor. Keine übrige Aufgabenlogik verändern. |

Auf der Werkzeugseite `../../styles.css` und die lokale CSS-Datei mit
Cache-Buster einbinden. `styles.css`, DFD-Dateien, Apps Script,
Sicherungsblätter und Lehrercode-Dateien nicht verändern.

## 4. Verbindliche Palette und Karten

### Mittelstufe

1. **Klasse: Name + Attribute** – genau zwei sichtbare Bereiche, eckige
   Ecken. Der Attributbereich kann leer sein, bleibt aber sichtbar.
2. **Klasse: Name + Attribute + Methoden** – genau drei sichtbare Bereiche,
   eckige Ecken. Attribut- und Methodenbereich bleiben auch leer sichtbar.
3. **Objekt: Bezeichner + Attributwerte** – genau zwei sichtbare Bereiche,
   abgerundete Ecken. Bezeichner als Text der Form `objektname:Klasse`
   bearbeitbar und in der Karte unterstrichen; Werte als editierbare Zeilen.
4. **Ungerichtete Linie** – einfache Linie ohne Pfeilspitze oder Zusatzsymbol.
5. **Vererbung** – durchgezogene Linie mit hohlem Dreieck an der Oberklasse;
   Bedienfolge: erst Unterklasse, dann Oberklasse. Nur Klassenkarten
   einschließlich abstrakter Klassen sind gültige Endpunkte.
6. **Beziehung mit Kardinalitäten** – genau *ein* Werkzeug für eine
   durchgezogene Linie ohne Pfeilspitze. Zwei voneinander unabhängige,
   optionale Textfelder beschriften die Enden; ein drittes optionales Feld
   beschriftet die Linie mittig. Leere Felder erzeugen keine sichtbaren
   Platzhalter. Kardinalitäten sind frei editierbare kurze UML-Angaben wie
   `1`, `0..1`, `n`, `m`, `*` oder `1..*`, keine hart codierte Auswahlliste.
   Als Klassendiagramm-Beziehung verbindet sie Klassenkarten einschließlich
   abstrakter Klassen; Objektkarten werden mit der ungerichteten Linie
   verbunden.

### Oberstufe

7. **Abstrakte Klasse** – eckige Karte mit Namen, Attributen und Methoden;
   im Kopf zusätzlich `«abstract»` und kursiver Klassenname. Diese
   Darstellung ist mangels direkter KDM-Ansicht eine UML-nahe Festlegung.
8. **Interface** – eckige Karte mit `«interface»`, Namen und Methodenbereich;
   kein Attributbereich. Eine spezielle Realisierungsbeziehung wird nicht
   angeboten, weil sie einen ausdrücklich ausgeschlossenen weiteren Pfeiltyp
   erfordern würde. Die Karte kann einzeln dargestellt werden.

**Nicht anbieten:** Klasse mit nur einem Bereich, Objekt nur mit Bezeichner,
Objekt mit drei Bereichen, eigenständiges ER-Attribut, eigenständige
ER-Beziehung, Null-Referenz/Kreis mit Kreuz, Aggregation, gefüllte oder
alternative Pfeile sowie zusätzliche Varianten beschrifteter Beziehungen.
„Beziehungsname“ und „Kardinalität“ sind Eigenschaften von Punkt 6, keine
weiteren Paletteneinträge.

## 5. Bedienung und wörtliche UI-Texte

- H1: „Klassen- und Objektdiagramme erstellen“.
- Kurzer Hinweis über dem Editor: „Wähle eine Karte und tippe auf die
  Zeichenfläche. Für eine Verbindung wählst du anschließend zwei Karten.“
- Palette mit den sichtbaren Überschriften „Mittelstufe“ und „Oberstufe“;
  eindeutige Schaltflächen gemäß Abschnitt 4. Zusätzlich außerhalb der
  Elementpalette: „Auswahl“, „Löschen“, „Neues Diagramm“, „Diagramm speichern“,
  „Diagramm laden“, „Bild herunterladen“ und „Farbschema“.
- Eine Karten-Schaltfläche aktivieren, dann auf freie Fläche klicken/tippen.
  Die neue Karte wird ausgewählt. Auswahlmodus erlaubt Anklicken, Ziehen mit
  Maus/Touch und Löschen. Ein Eigenschaftenbereich bietet sichtbare Labels
  für Name/Bezeichner und jede Zeile sowie „Attribut hinzufügen“, „Methode
  hinzufügen“ oder „Wert hinzufügen“ und Entfernen einzelner Zeilen.
- Eine Verbindungsschaltfläche aktivieren, Startkarte und Zielkarte
  nacheinander wählen. Für Vererbung benennt eine Statusmeldung die Reihenfolge
  Unterklasse → Oberklasse. Ungültige Endpunkte werden mit Text erklärt.
  Eine ausgewählte Kante erhält im Eigenschaftenbereich den Typ und, bei
  Beziehungen, die drei optionalen Textfelder. Kein Rechtsklickzwang.
- Auswahl, Delete/Entf und Escape funktionieren per Tastatur. Ausgewählte
  Karten können mit Pfeiltasten in kleinen Schritten verschoben werden.
  Für das Verbinden existieren auch fokussierbare Karten in einer Liste, damit
  die Funktion ohne präzise SVG-Klicks erreichbar ist. Statusänderungen werden
  über `aria-live="polite"` gemeldet.
- „Neues Diagramm“ fragt vor dem Verwerfen der aktuellen Zeichnung nach.
  Nach Bestätigung wird auch der gespeicherte Zwischenstand geleert.
- Drei Farbschemata für die Zeichnung: „Standard“ (hellgelbe Zeichenfläche,
  dezent farbige Karten), „Weiß“ (weiße Zeichenfläche, farbige Karten) und
  „Schwarzweiß“ (weiße Zeichenfläche und weiße Karten). Diese Optionen
  übertragen die dokumentierten KDM-Farbschemata auf das bestehende Design;
  äußere Navigation und Bedienelemente bleiben im Website-Stil.

## 6. Datenmodell und Geometrie

Ein Dokument enthält `version: 1`, `theme`, `cards[]` und `edges[]`. Jede
Karte enthält stabile ID, erlaubten Kartentyp, Mittelpunkt `x/y` in
Zeichenflächenkoordinaten, bearbeitbaren Namen/Bezeichner sowie Arrays für
Attribute, Methoden oder Attributwerte entsprechend ihrem Typ. Die Anzahl der
Bereiche folgt dem Typ und ist nicht frei umschaltbar. Kanten enthalten ID,
erlaubten Typ, `from`- und `to`-Karten-ID sowie bei der Beziehung die drei
optionalen Texte `cardinalityFrom`, `cardinalityTo` und `name`. Selection,
Hover und berechnete SVG-Pfade werden nicht gespeichert.

Das Rendering berechnet die tatsächlich benötigte Kartenhöhe aus Zeilen und
Zeilenumbrüchen. Namen und längere Einträge dürfen nicht über Kartenränder
laufen; Karten bleiben mit ihrer gesamten Fläche innerhalb der Zeichenfläche.
Die Kartengröße und Kantenpunkte werden nach Texteingaben neu
berechnet. Jede Kante beginnt und endet auf dem sichtbaren Kartenrand, nicht
im Mittelpunkt oder mit Abstand vor der Karte. Bei horizontaler, vertikaler
und diagonaler Anordnung müssen Anschlusspunkte korrekt sein; das Dreieck der
Vererbung berührt mit seiner Spitze den Rand der Oberklasse. Beim Verschieben
oder Bearbeiten einer Karte werden alle betroffenen Kanten neu gezeichnet.
Beschriftungen liegen neben dem jeweiligen Ende beziehungsweise an der
Linienmitte, ohne die Linie zu ersetzen. Das SVG erhält eine breitere
unsichtbare Trefferfläche für Kanten; diese erscheint nicht im Export.

Karten und Kanten werden als SVG gerendert; editierbare Eingaben liegen im
HTML-Eigenschaftenbereich. Das übernimmt das bewährte Grundmuster des
DFD-Editors und hält den Bildexport unabhängig von `foreignObject`.

## 7. Zwischenstand, Dateioperationen und Bildexport

- Nach jeder Änderung automatisch in `localStorage` mit dem versionierten
  Schlüssel `informatik-diagrammwerkzeug-v1` speichern. Beim Laden der Seite
  nach Registrierung der Listener wiederherstellen. Speicherzugriffe sind
  abgefangen; ohne lokalen Speicher bleibt das Werkzeug benutzbar.
- „Diagramm speichern“ lädt das gesamte validierte Dokument als UTF-8-JSON
  herunter. „Diagramm laden“ akzeptiert `.json` über einen Dateidialog,
  validiert zuerst vollständig und ersetzt die aktuelle Zeichnung erst bei
  Erfolg. Fehler lassen den bisherigen Stand bestehen und erzeugen eine
  konkrete Textmeldung. Nach erfolgreichem Laden wird autospeichert.
- Die Validierung akzeptiert nur Schema-Version 1, bekannte Karten-/Kantentypen,
  endliche Positionen innerhalb der Zeichenfläche, eindeutige IDs und
  existierende Kantenendpunkte. Höchstens 100 Karten, 200 Kanten, 30 Zeilen je
  Bereich und 200 Zeichen je Eingabe; maximal 1 MB Importdatei. HTML wird
  nicht interpretiert, sondern als Text gerendert. Unbekannte/kaputte
  lokale Speicherdaten werden ignoriert; ungültige Importdateien abgewiesen.
- „Bild herunterladen“ erzeugt einen PNG-Export der gesamten Zeichenfläche,
  nicht der Toolbar oder Auswahlmarkierung. Die SVG-Zeichnung wird dafür mit
  fest eingebetteten Zeichenfarben serialisiert und in ein Canvas gerendert;
  ein zusätzlicher SVG-Download ist optional. Bild und JSON enthalten das
  gewählte Farbschema. Die Exportqualität und Lesbarkeit werden visuell
  geprüft. Das genaue KDM-Dateiformat wird nicht nachgebildet, weil es nicht
  dokumentiert/verifiziert ist.

## 8. Responsivität und Barrierearmut

Auf Desktop stehen Zeichenfläche und Eigenschaften nebeneinander; bei Tablet
und Smartphone folgen Eigenschaften und Kartenliste unter der Zeichenfläche.
Palette und Aktionen umbrechen ohne abgeschnittene Beschriftungen; Buttons
haben mindestens 44 px hohe Klickflächen. Die fachlich große Zeichenfläche
darf auf schmalen Bildschirmen in einem klar begrenzten Viewport horizontal
scrollen; Karten und Text bleiben in lesbarer Größe. Ziehen auf Karten
funktioniert per Pointer-Events, Scrollen auf freier Fläche bleibt möglich.

Palette, Aktionen und Textfelder besitzen sichtbare Labels. Aktives Werkzeug
und ausgewählte Karte/Kante werden zusätzlich zu Farbe durch Text und
`aria-pressed`/Status erkennbar. SVG-Karten und Kanten sind fokussierbar und
sinnvoll benannt; die parallele HTML-Liste ermöglicht Auswahl und Verbinden
per Tastatur. Fokus ist deutlich sichtbar. Klassenkarten haben immer eckige,
Objektkarten abgerundete Ecken. Die Karte bleibt auch bei langem Text und auf
kleinen Geräten lesbar. Keine ausschließlich farbbasierte Rückmeldung.

## 9. Geplante Bau- und Prüfreihenfolge

1. Standalone-Seite mit Navigation und Palette anlegen; CSS-Muster übernehmen.
2. Dokumentmodell, Validierung, Karten-Rendering und Eingaben umsetzen.
3. Verbindungstypen, Kartenrandgeometrie und Tastaturalternative ergänzen.
4. Autospeicherung, JSON-Download/-Import, Farbschema und PNG-Export ergänzen.
5. Links in Informatikübersicht und Aufgabe 2d setzen.
6. Geometrie-/Validierungstests und Browser-Durchlauf auf Desktop, Tablet und
   Smartphone durchführen; Links, Syntax und `git diff --check` prüfen.

## 10. Offene Referenzfragen

Die folgenden Punkte konnten wegen HTTP 502 der KDM-Anwendung nicht direkt
geprüft werden. Sie blockieren die Umsetzung nicht; die Festlegungen oben
gelten, bis die Referenz wieder zugänglich ist:

1. Welche exakten Klick-/Drag-/Doppelklickabläufe nutzt KDM für Karten und
   Kanten? Diese Spezifikation verwendet die vorhandenen DFD-Bedienmuster.
2. Wie sehen abstrakte Klasse und Interface in KDM im Detail aus? Hier gelten
   die in Abschnitt 4 genannten UML-nahen Varianten.
3. Welches Dateiformat verwendet KDM beim Speichern und Laden? Das neue
   Werkzeug verwendet ein eigenes validiertes JSON-Format; eine
   KDM-Dateikompatibilität ist nicht zugesagt.
4. Welches Format und welcher Ausschnitt entstehen bei „Screenshot“? Hier
   ist PNG der gesamten Zeichenfläche verbindlich.
5. Gibt es weitere KDM-Komfortfunktionen (z. B. Zoom, Undo/Redo oder
   Rasteroptionen)? Mangels Nachweis gehören sie nicht zum beauftragten
   Mindestumfang. Die dokumentierten Farbschemata sowie Speichern, Laden und
   Screenshot/Bildexport sind eingeplant.

## 11. Regelbasiert prüfbare Akzeptanzkriterien

- [ ] Alle sechs Mittelstufen- und zwei Oberstufen-Elemente aus Abschnitt 4
  sind in genau diesen sichtbaren Gruppen vorhanden; die genannten
  ausgeschlossenen Elemente fehlen. Auswählen der Gruppe sperrt keine andere.
- [ ] Beziehung mit Kardinalitäten ist genau ein Palettenwerkzeug mit drei
  optionalen Textfeldern; daraus entstehen keine zusätzlichen Linientypen.
- [ ] Die sechs in Abschnitt 3 genannten Dateien (darunter eine Testdatei)
  existieren mit den beschriebenen Änderungen; DFD-Dateien, Apps Script,
  `styles.css`, Sicherungsblatt und Lehrercode bleiben unangetastet.
- [ ] Informatikübersicht und Aufgabe 2d verlinken die Werkzeugseite; alle
  lokalen HTML-, CSS- und JS-Links sind gültig. Navigation von der
  Werkzeugseite zurück zu Informatik und zur Startseite funktioniert.
- [ ] Werkzeugseite hat `lang="de"`, UTF-8, eindeutige H1, Hinweis über dem
  Editor, sichtbare Labels und textliche `aria-live`-Statusmeldungen.
- [ ] Klassenkarten haben `border-radius: 0` beziehungsweise eckige SVG-Form;
  Objektkarten sind sichtbar abgerundet.
- [ ] Versionierter Autospeicher-Schlüssel, JSON-Download/-Import und
  PNG-Bildexport sind vorhanden; zurückgesetzte Zeichnung wird nicht
  wiederhergestellt.
- [ ] Importvalidierung weist unbekannte Typen, doppelte IDs, defekte
  Endpunkte und übergroße Dateien ab, ohne die aktuelle Zeichnung zu ändern.
- [ ] JavaScript-Syntaxprüfung, gezielte reine Tests, lokale Linkprüfung und
  `git -c safe.directory=C:/Users/ffran/Documents/git/unterricht diff --check`
  bestehen.

## 12. Fachliche, funktionale und gestalterische Akzeptanzkriterien

- [ ] Eine Klasse mit zwei Bereichen, eine Klasse mit drei Bereichen, ein
  Objekt mit zwei Bereichen, eine abstrakte Klasse und ein Interface lassen
  sich auf derselben Fläche erstellen und sinnvoll bearbeiten.
- [ ] Name, Attribute, Methoden und Attributwerte werden in den passenden
  Bereichen angezeigt; Bereiche bleiben bei leerem Inhalt erkennbar.
  Klassen und Objekte sind auf einen Blick unterscheidbar.
- [ ] Ungerichtete Linie, Vererbung und Beziehung mit Kardinalitäten sehen
  fachlich verschieden und korrekt aus. Der Vererbungspfeil zeigt auf die
  Oberklasse; eine unzulässige Vererbung zwischen Objekten wird verhindert.
- [ ] Beide Kardinalitäten und der optionale Beziehungsname können unabhängig
  eingegeben, geändert und gelöscht werden. Beschriftungen sind eindeutig
  ihrem Linienende beziehungsweise der Beziehung zugeordnet.
- [ ] Jede Kante berührt beide verbundenen Karten; nach Verschieben oder
  Text-/Größenänderung bleibt sie korrekt verbunden. Das gilt auch diagonal
  und bei mehreren Kanten an einer Karte.
- [ ] Ein Diagramm bleibt nach Seitenwechsel und Rückkehr erhalten. Ein
  JSON-Download lässt sich laden und stellt Karten, Texte, Positionen,
  Kanten, Beschriftungen und Farbschema identisch wieder her.
- [ ] Der PNG-Export zeigt die vollständige Zeichnung mit lesbaren Karten,
  Linien und Beschriftungen ohne Bedienoberfläche oder Auswahlmarkierungen.
- [ ] Erstellen, Bearbeiten, Verbinden und Löschen funktionieren mit Maus und
  Touch; die wesentlichen Funktionen sind auch per Tastatur erreichbar.
- [ ] Desktop-, Tablet- und Smartphoneansicht sind benutzbar. Palette,
  Eigenschaften und Aktionen werden nicht abgeschnitten; die Zeichenfläche
  bleibt lesbar und gezielt scrollbar.
- [ ] Gestalt und kurze deutsche Bedienhinweise passen zu den vorhandenen
  Informatikseiten; Fehler und Zustände sind verständlich und nicht nur
  farblich vermittelt.
