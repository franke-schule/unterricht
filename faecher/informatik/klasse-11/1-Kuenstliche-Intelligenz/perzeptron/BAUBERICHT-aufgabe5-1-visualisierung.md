# Baubericht – Aufgabe 5.1, Visualisierung Reiter 1–4

Stand: 12.10.2026

## Umsetzung

- `aufgabe5-1.html`: Reiter 1/2 verwenden statt sichtbarer Zahlenfelder Diagrammcontainer. Reiter 3 hat ebenfalls eine Diagrammfläche. Reiter 4 ordnet die kompakte Grafik und die bestehende Frage nebeneinander an. Der lokale CSS-/JS-Cache-Buster wurde aktualisiert.
- `perzeptron/ui/task5-1.mjs`: Die drei Diagramme zeigen gewählte Eingaben, Gewichte mit `+`/`−`, Summe, Schwelle, Vergleich und Ausgabe. Reiter 1/2 verwenden je ein validiertes Parametermodell für Regler, Tabelle, Prüfung, Speicherstand und Übersicht. Gültige alte v1-Zahlenfelder werden migriert; Werte abseits des Rasters bleiben bis zum ersten Reglerklick erhalten.
- Reiter 3 trennt das feste Aufgabenneuron `(4;2;3)` von einer gespeicherten Erkundung. Bei Erkundung sind die drei Prüfbuttons deaktiviert. Ungeprüfte Ausgaben und Vergleiche des festen Neurons bleiben auch dann verdeckt, wenn Erkundungswerte wieder `(4;2;3)` erreichen. Die vorhandenen Antworten, Prüfungen und Freigaben bleiben an das feste Neuron gebunden.
- Reiter 4 führt SVG- und HTML-Punktwahl auf dieselbe Auswahlfunktion. Der aktive Punkt erhält Ring und `aria-pressed` am HTML-Button; die Rechenkarte zeigt Summe, Vergleich und Ausgabe aus `calculate`. Ein eigener `aria-live`-Status meldet die Auswahl. Die SVG-Punktziele sind auch bei 320 px Viewport mindestens 44 CSS-Pixel groß.
- `perzeptron/task5-1.css`: Lokale Darstellung für Diagramm, Regler, Auswahl und Rechenkarte auf Desktop, Tablet und Smartphone. Die bestehenden Farben und Button-/Feedbackmuster aus Aufgabe 5 bleiben Grundlage.

Keine Produktdateien außerhalb dieser drei Dateien wurden bearbeitet. Die ursprüngliche Spezifikation, Reiter 5a/5b und 6–8, Parser, Quizkomponente und Aufgabe 5 blieben unverändert. Es gab keine fehlenden Wortlaute oder nötige Abweichung von der Ergänzungsspezifikation.

## Prüfung

- `node --check` und `git diff --check` für den Auftragsdiff: bestanden.
- `tmp/perzeptron-51-visuals-check.cjs`: Startwerte, Rastergrenze `3,9 → 4`, Zeilenauswahl, sofortige Speicherung, v1-Migration mit unrundem Altwert, Erkundungsmodus, Sperre der Prüfbuttons, Antwortschutz nach Rückschritt und Reload, Grenzproben, SVG-/HTML-Auswahl, Tastatur, Rechenkarte, Reload und Reset: bestanden; keine Seitenfehler.
- `tmp/perzeptron-51-visuals-narrow.cjs`: 320-px-Regler und fehlender Seitenscrollbalken: bestanden. Die SVG-Klickfläche betrug bei 390 px 68 CSS-Pixel; auch 320 px wurde auf mindestens 44 CSS-Pixel geprüft.
- `tmp/perzeptron-51-visuals-full.cjs`: Bestehenden vollständigen Ablauf als Vorlage verwendet und auf die neuen Regler angepasst. Reiter 1–8 einschließlich GeoGebra 5a/5b, Übersicht und Abschlussquiz: **15 von 15 Kern-Teilaufgaben**, Quiz korrekt, Reload und Reset bestanden, keine Browserfehler. Der Lauf erfolgte mit freigegebenem Netzwerkzugriff für GeoGebra.
- Screenshots: `tmp/perzeptron-51-visuals-{desktop,tablet,mobile}-{one,two,three,four}.png`, zusätzlich `tmp/perzeptron-51-visuals-{desktop,mobile}-four-selected.png` und `tmp/perzeptron-51-visuals-narrow-one.png`. Sichtprüfung: Zeilenauswahl mobil erreichbar, verbundenes Signalbild, lesbare Punktkarte, kein Seitenüberlauf bei 1280, 820, 390 oder 320 px.

Die Bedienung wurde im automatisierten Chrome geprüft; eine Prüfung an tatsächlicher Smartphone-/Tablet-Hardware fand nicht statt.

## Korrekturrunde nach Endabnahme 1

- Beim ersten `+`/`−`-Klick aus dem sichtbaren Aufgabenneuron startet die Erkundung nun bei `(4;2;3)` und führt genau diesen Schritt aus. Nur „Erkundung fortsetzen“ lädt gespeicherte Erkundungswerte. Geprüft wurden `4 → − → 3,5 → zurück → 4 → + → 4,5`, das ausdrückliche Fortsetzen sowie ein früherer Erkundungswert am oberen Limit `w₁=6`: Der nächste direkte `+`-Klick vom sichtbaren Wert 4 ergibt 4,5. Vergleich/Ausgabe bleiben bei Rückkehr auf `(4;2;3)` ungeprüft als `?` verdeckt, auch nach Reload; die Prüfbuttons bleiben im Erkundungsmodus gesperrt.
- Die mobilen SVG-Leitungen führen hinter den gefüllten Knoten von Mittelpunkt zu Mittelpunkt. Die sichtbare Linie endet dadurch jeweils an der tatsächlichen Knotenkontur. Die Browsermessung `tmp/perzeptron-51-visuals-review1-measurements.json` ergab bei **390 px** im Diagramm: Eingabeknoten-Mittelpunkte `x≈68/228, y=54`, Gewichte `x≈68/228, y=180`, Σ `x≈148, y=324`, Schwelle `x≈231, y=408`, Ausgabe `x≈148, y=528`. Bei **320 px**: Eingaben/Gewichte `x≈52/174`, Σ/Ausgabe `x≈113`, Schwelle `x≈50`; die y-Mittelpunkte bleiben 54/180/324/432/528. Die SVG-Endpunkte lagen bei allen gemessenen Mittelpunkten innerhalb 1 CSS-Pixel. Die freiliegende senkrechte Leitung läuft jeweils von der unteren Σ-Kontur bei `y=370` bis zur oberen Ausgabekontur bei `y=490`; die beiden gewichteten Verbindungen treffen sichtbar die Ellipse. Eingangs- und Schwellenanschlüsse wurden im gleichen Screenshot kontrolliert.
- Gezielter Browserlauf `tmp/perzeptron-51-visuals-review1.cjs`: Modusfolge, Limitfall, Antwortschutz/Reload, Anschlusskoordinaten und fehlender Seitenüberlauf bei 390/320 px bestanden; keine Seitenfehler. Aktualisierte Ansichten: `tmp/perzeptron-51-visuals-review1-{390,320}.png` sowie die Diagrammausschnitte mit Suffix `-diagram.png`. Keine erneute breite 5a–Quiz-Prüfung, da diese Produktteile durch die Korrektur unberührt sind.
