# Baubericht – Aufgabe 5.1

Stand: 11.10.2026 · Stufe: Bau. Grundlage: `SPEZIFIKATION-aufgabe5-1.md`. Eine unabhängige Vorprüfung oder Endabnahme war nicht Teil dieses Bauauftrags.

## Dateien

Neu angelegt:

- `../aufgabe5-1.html` – acht Reiter, Originaldaten, Hilfen, Einzelprüfungen, Zusammenfassung, Quiz und sichtbare Quellen.
- `ui/task5-1.mjs` – Reiter, Berechnung, GeoGebra-Darstellung, Prüfungen, Zustand und Speicherung.
- `task5-1.css` – lokale Ergänzung zu `task5.css` für Reiter 5 und responsive Darstellung.
- `logic/linear-inequality.mjs` – deterministischer Parser und normalisierte lineare Prüfung.
- `tests/task5-1-linear.test.mjs` – Parser-, Äquivalenz-, Rand- und Trennungstests.
- `ATTRIBUTION-aufgabe5-1.md` – Kapitel, Autor:innen, Lizenz und Bearbeitungen.
- dieses Dokument.

Bestehende Produktdatei: In `../../index.html` wurde ausschließlich die Kachel Aufgabe 5.1 zwischen Aufgabe 5 und 6 ergänzt. Die übergebenen Prompt- und Spezifikationsdateien wurden nicht verändert.

Wiederverwendet: Seitengerüst, Reiter-, Karten-, Button-, Tabellen-, Feedback- und Hilfe-Klassen aus Aufgabe 5 und `task5.css`; `activation`, `calculate` und `normaliseNumber` aus `logic/perceptron.mjs`; `addQuizQuestionChecks` aus `faecher/informatik/quiz-fragen-pruefen.js`. Die validierte lokale Speicherform folgt dem Muster von `ui/task5.mjs`, erweitert für alle 5.1-Felder und zustandsabhängigen Anzeigen. `knn/ui/knn-plot.mjs` wurde als Grafikreferenz geprüft; eine SVG-Ersatzgrafik für Reiter 5 war nicht nötig.

## GeoGebra-Integrationsnachweis

Vor dem Modulbau wurde `tmp/perzeptron-51-geogebra-proof.html` mit `tmp/perzeptron-51-geogebra-proof.cjs` getestet. Chrome Headless: Desktop 1280×900 und Tablet 820×1180; `appletOnLoad` lieferte ein API-Objekt, `y>−2x+1,5` und die falsche Seite `y<−2x+1,5` wurden als benannte Fläche und Grenze gezeichnet, die Buttonprüfung ergab 4/4 bzw. 0/4, und der gespeicherte Entwurf wurde nach Reload mit beiden Objekten wiederhergestellt. Keine Konsolenfehler. Der erste Sandboxlauf ohne Netzwerkfreigabe hing beim externen Script; der genehmigte Netzlauf gelang. **Entscheidung: GeoGebra-Hauptweg, kein SVG-Ersatz.** Im Produkt wird `deployggb.js` asynchron erst für Reiter 5 geladen. Die reine Grafikperspektive wird per `setPerspective('G')` gesetzt; die Achsen sind mit `x = x₁` und `y = x₂` beschriftet. Interne Objektnamen sind ausgeblendet. Die vollständige Schülerantwort bleibt im äußeren Textfeld; an `evalCommand` gehen nur validierte numerische Koeffizienten.

## Tatsächlich ausgeführte Checks

- `node --check` für `ui/task5-1.mjs` und `node --test tests/task5-1-linear.test.mjs`: Syntax ohne Fehler, 3/3 Tests erfolgreich. Geprüft wurden unter anderem Umformungen beider Vergleichsrichtungen, positive Skalierung, umgekehrte Seite, strenger Grenzpunkt, vertikale/horizontale Trennung, nichtlineare und ungültige Eingaben.
- Vollständiger Chrome-Headless-Durchlauf (`tmp/perzeptron-51-full-check.cjs`): 15/15 Kern-Teilaufgaben richtig geprüft, Zusammenfassung einschließlich 5b und optionalem Expertenfall sichtbar, sechs Quizfragen einzeln geprüft und automatische Gesamtauswertung erfolgreich. Nach Reload blieben aktiver Reiter, Eingaben, Grenzprobe, Expertenantwort und Quiz-Erfolg erhalten. „Modul neu beginnen“ entfernte nur den 5.1-Schlüssel; ein vorhandener Aufgabe-5-Schlüssel blieb bestehen. Keine Seitenfehler.
- Chrome-Headless-Ansichten (`tmp/perzeptron-51-browser-check.cjs`): 1280×900, 820×1180 und 390×844, jeweils HTTP 200, korrekte 5a-Prüfung, 4/4-Punkttrennung ohne 5a-Äquivalenz nur teilweise, 5b als frei gültige Trennung korrekt, Änderung setzt den Prüfstatus zurück, gezeichneter Entwurf und Hilfslinie nach Reload wiederhergestellt, keine horizontale Seitenscrollbar, keine Konsolenfehler. Die drei Ansichten wurden als PNG unter `tmp/perzeptron-51-*.png` visuell geprüft.
- Emuliertes Tablet mit Touch (`tmp/perzeptron-51-touch-check.cjs`): Reiterwechsel und 5a-Prüfung per `tap()` erfolgreich, kein Overflow und kein Seitenfehler.
- Fehlerpfad (`tmp/perzeptron-51-failure-check.cjs`): bei blockiertem GeoGebra-Script bleibt die Seite bedienbar und meldet den Ladefehler; beschädigtes Speicher-JSON blockiert den Start nicht.
- `git diff --check`: fehlerfrei. Alle neun vorhandenen Dateien aus `tmp/perzeptron-51-baseline.json` haben unveränderte SHA-256-Prüfsummen. Das Menü-Diff besteht nur aus der neuen Kachel. Kein Commit und kein Deployment.

## Gezielte Korrekturrunde nach Endabnahme 1

Vier gemeldete Befunde wurden lokal in `ui/task5-1.mjs` und `task5-1.css` behoben:

1. Die Achsen der SVG-Diagramme in Reiter 4 und 6 liegen nun auf demselben Ursprung wie Raster, Punkte und Geraden. Der Browsercheck misst in Reiter 6 `axisY = pointZeroY = 355` für (0,5;0) und `axisX = lineAtXZero = 175` für die Gerade bei x = 0.
2. Die mobile `grid-row:1`-Anordnung der GeoGebra-Grafik wurde entfernt. Bei 390 px liegt der Arbeitsbereich vor der Grafik (`top = 676,4` gegenüber `2067,9` px); damit steht der 5a-Auftrag vor der Simulation.
3. Beim Darstellen des jeweils anderen Entwurfs werden dessen ältere Rückmeldung und Punktzeilen ausgeblendet. Nach korrekter 5a-Prüfung und anschließendem Darstellen von `x>0,5` in 5b waren 5a-Rückmeldung und -Zeilen verborgen, während `checked['five-a'] = true` und der gültige 5a-Entwurf gespeichert blieben. Die Übersicht kann ihn weiter verwenden.
4. Der Expertencheck verlangt für volle Korrektheit links reine Eingangsterme und rechts eine Konstante mit `>`; die Gültigkeitsprüfung beim Wiederherstellen nutzt dieselbe Regel. `2>2x1+x2` erhielt im Browser das vorhandene Teilfeedback, `-2x1-x2>-2` das korrekte Erfolgsfeedback.

Diese vier Fälle wurden mit `tmp/perzeptron-51-review-fixes.cjs` in Chrome Headless geprüft; keine Seitenfehler. Danach blieben `node --check` und 3/3 Parser-Tests erfolgreich. Der vollständige Browserdurchlauf erreichte erneut 15/15 Kern-Teilaufgaben, Quiz-Erfolg, Reload und selektiven Reset ohne Seitenfehler. Die Ansichten 1280×900, 820×1180 und 390×844 hatten weiterhin keine horizontale Seitenscrollbar; `git diff --check` war fehlerfrei.

## Offene Punkte

Ein echter Tablet-/Smartphone-Hardwaretest wurde nicht ausgeführt; die Bedienung wurde in Chrome emuliert. Die GeoGebra-Grafik benötigt beim ersten Öffnen von Reiter 5 Zugriff auf das öffentliche GeoGebra-Script. Bei Ausfall erscheint die getestete Fehlermeldung und der eingegebene Text bleibt gespeichert.
