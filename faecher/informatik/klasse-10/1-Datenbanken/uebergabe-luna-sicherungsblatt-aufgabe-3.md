# Übergabe an Luna: Sicherungsblatt zu Aufgabe 3

## Verbindliche Grundlage

Das Sicherungsblatt sichert ausschließlich die fachlichen Ergebnisse aus
**Aufgabe 3 – Beziehungen und Fremdschlüssel**. Es ist keine neue Übung und
enthält daher keine Eingabefelder, Arbeitsaufträge oder zusätzlichen Inhalte.

### 1. Fachliche Inhalte

- Die Tabellen `users` und `photos` stehen in einer **1:n-Beziehung**.
- **Definition (Wortlaut aus Aufgabe 3):** „Ein Benutzer kann mehrere Fotos
  besitzen. Ein Foto gehört genau einem Benutzer.“
- Die Kardinalitäten werden als `users  1 ───── n  photos` dargestellt.
- `users.id` identifiziert einen Benutzer und ist hier der **Primärschlüssel**.
- `photos.user_id` enthält die ID des zugehörigen Benutzers und ist der
  **Fremdschlüssel**.
- **Definition (an Aufgabe 3 orientiert):** Ein Fremdschlüssel ist ein Attribut,
  das auf den Primärschlüssel eines Datensatzes in einer anderen Tabelle
  verweist. Dadurch stellt er die Verbindung zwischen den Tabellen her.
- Konkrete Zuordnung: `photos.user_id` verweist auf `users.id`.

### 2. Verbindlicher Datenausschnitt

Die folgenden echten, gut lesbaren InstaHub-Datensätze aus `users.csv` und
`photos.csv` verwenden:

`users`

| id | username |
| --: | --- |
| 3 | bergcoder |

`photos`

| id | user_id | description |
| --: | --: | --- |
| 11 | 3 | Heute draußen im Wald programmiert … |
| 12 | 3 | Bin gerade am Debuggen mitten im Wald … |
| 13 | 3 | Ein neuer Pfad, ein neuer Gedanke … |

Die drei Beschreibungen dürfen für die kompakte Druckansicht auf die oben
angegebenen, eindeutigen Kurzfassungen gekürzt werden. Es werden keine weiteren
Attribute aus den CSV-Dateien gezeigt.

### 3. Geplanter Blattaufbau (eine A4-Seite)

1. Bestehender dunkelblauer Kopf: „INFORMATIK · KLASSE 10“, Goldmarke
   „LÖSUNGEN“, danach „Sicherungsblatt: Aufgabe 3“ und
   „1:n-Beziehung und Fremdschlüssel“.
2. Hellblaue Zielbox: Die Verbindung zwischen `users` und `photos` erkennen
   und über einen Fremdschlüssel erklären.
3. Abschnitt „1 · Ein Benutzer, mehrere Fotos“ mit den beiden kleinen
   Tabellenausschnitten.
4. In der Mitte die visualisierte Verbindung:
   - `users.id` mit Rahmen und der Beschriftung „Primärschlüssel“;
   - die drei `photos.user_id`-Zellen gemeinsam mit Rahmen und der gut
     sichtbaren Beschriftung „Fremdschlüssel: `photos.user_id`“;
   - ein beschrifteter, von `users.id = 3` ausgehender Pfeil/Verbinder, der zu
     den drei Werten `3` verzweigt; die Verbindungslinien berühren die
     hervorgehobenen Bereiche;
   - zusätzlicher Text am Verbinder: „gleicher Wert: Verbindung zum Benutzer“.
5. Abschnitt „2 · 1:n-Beziehung“ mit dem vollständigen Merksatz und dem bereits
   in Aufgabe 3 verwendeten Klassendiagramm-Stil:
   `users  1 ───── n  photos`.
6. Abschnitt „3 · Fremdschlüssel“ mit der oben festgelegten Definition und der
   Kurzform `users.id ← photos.user_id`.
7. Abschließende Mint-Box „Merke“: Benutzerinformationen werden einmal in
   `users` gespeichert; jedes Foto enthält in `photos.user_id` nur die ID des
   zugehörigen Benutzers.

Die Codierung erfolgt nicht nur durch Farbe: Rahmen, Beschriftungen, der
beschriftete Verzweigungspfeil und die ausgeschriebenen Schlüsselrollen machen
die Zuordnung auch ohne Farbwahrnehmung verständlich.

## Technische und gestalterische Referenzen

### Ablage, Format und Drucklayout

- Quelldatei: `faecher/informatik/klasse-10/1-Datenbanken/sicherungsblatt-aufgabe-3-loesungen.tex`
- erzeugte Datei: `faecher/informatik/klasse-10/1-Datenbanken/sicherungsblatt-aufgabe-3-loesungen.pdf`
- Format: LaTeX-Quelle plus erzeugtes PDF, einseitig im A4-Hochformat.
- Direkte Vorlage: `sicherungsblatt-aufgabe-2-loesungen.tex` im selben Ordner:
  `article` mit `10pt,a4paper`, `geometry` mit `margin=14mm`, serifenlose
  Schrift, Navy/Blue/Sky/Mint/Gold-Farbpalette, dunkelblauer Kopf, hellblaue
  Zielbox, blaue Abschnittsüberschriften und grauer Fuß.
- Programmier-Sicherungsblätter als zusätzliche Referenz:
  `faecher/informatik/klasse-9/3-Modellierung-und-Programmierung-Online-IDE/sicherungsblatt-aufgabe-2-loesungen.tex`
  (kompakte Ein-Seiten-Struktur, Merksatzbox, Klassenkarten) sowie
  `faecher/informatik/klasse-10/2-Modellierung-und-Programmierung-Online-IDE/sicherungsblatt-aufgabe-2-loesungen.tex`
  (TikZ für druckbare Diagramme).
- Für den verzweigten Verbinder im PDF darf TikZ wie in der zweiten
  Programmier-Referenz eingesetzt werden. Keine neue Web- oder
  Sicherungsblatt-Architektur erstellen.

### Spätere Einbindung in Aufgabe 3

In `aufgabe3.html` die vorhandene Einbindung aus `aufgabe2.html` direkt im
Abschlussbereich `#step-summary` wiederverwenden. Benötigt werden:

- die vorhandene Section `.solution-download` mit `details.solution-reveal`,
  Formular, sichtbarem `label`, `aria-live="polite"` und zunächst verstecktem
  Downloadlink;
- `href="sicherungsblatt-aufgabe-3-loesungen.pdf"` und Linktext
  „↓ Sicherungsblatt herunterladen“;
- die vorhandene Freigabefunktion `unlockSolution` aus `redundanzen.js`;
  sie verhindert das Absenden, normalisiert auf Großbuchstaben und A–Z/0–9 und
  zeigt den Link nur nach korrektem Code;
- die bestehende CSS aus `redundanzen.css`, einschließlich
  `.download-button[hidden] { display: none; }`.

Für Aufgabe 3 ist noch kein Lehrercode eingetragen. Ein neuer Code muss dem
Schema `FXXX-KXAX` folgen: Position 1 `M` (Informatik), Position 5 `X`
(Klasse 10), Position 7 `M` (Aufgabe 3). Den gewählten vollständigen Code
anschließend sowohl in `aufgabe3.html` als auch in
`lehrercodes-dekodierung.tex` und der erzeugten Dekodier-PDF ergänzen.

## Vorgaben aus dem Manifest für Sicherungsblätter

- Dateinamen genau nach `sicherungsblatt-aufgabe-N-loesungen.tex/.pdf`.
- Inhalt knapp, gut lesbar und fachlich sichernd: kurze Überschrift,
  Musterlösung/Beispiel, zentrale Merksätze.
- In der Schüleransicht nicht offensiv mit Musterlösungen werben: Der Download
  bleibt zunächst in einem eingeklappten `details`-Bereich verborgen und wird
  erst nach Lehrercode sichtbar.
- Erfolg und Fehler der Codeprüfung über `aria-live="polite"` melden.
- Das PDF nach dem Bauen rendern und visuell auf A4 prüfen; außerdem lokale
  Links, die verborgene Anfangsposition des Downloads, den Lehrercode und
  `git diff --check` prüfen.

## Nicht Teil dieser Übergabe

An `aufgabe3.html`, `beziehungen.js` und `beziehungen.css` wurden noch keine
Änderungen vorgenommen. Die Umsetzung soll die obigen Referenzen lokal
übernehmen und keine vorhandenen Lernschritte verändern.
