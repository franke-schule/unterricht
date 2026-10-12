# Baubericht – Aufgabe 5.1: Lernweg in Reiter 3–6

Stand: 12.10.2026

## Geänderte Produktdateien

- `../aufgabe5-1.html`: Reiter 4 mit zwei Darstellungsbuttons und drei Checkbox-Fragen; Reiter 5 mit falschem Startentwurf und freiwilliger 5b; Reiter 6 mit zweispaltiger Struktur und neuer erster Hilfe zu 6.2. Tabtitel 5 und Cache-Buster angepasst.
- `task5-1.css`: lokale Gestaltung für Reiter-4-Plot/MC und die scrollbare Reiter-6-Aufgabenspalte ab 1000 px.
- `ui/task5-1.mjs`: lokaler Neuron-Reset direkt bei den gesperrten Prüfbuttons in 3, Plotmodi und Quizprüfung in 4, 4/4-Klassifikation und anderer Grenzverlauf in 5, 14 Kernflags, Zusammenfassung, v1-Migration und Scrollspeicherung.
- Dieser neue Baubericht. Die älteren Spezifikationen und Bauberichte blieben unverändert.

## Wiederverwendung

- Bestehende Perzeptron-Grafik, `calculate`, feste Punktdaten und Auswahlbuttons in Reiter 3.
- Bestehende `renderSvg`-, `renderFourPoint`- und Punktkartenlogik in Reiter 4.
- `addQuizQuestionChecks` für die drei neuen Fragen und unverändert für das Abschlussquiz.
- Bestehender Parser `parseLinearRelation` samt `countMatching`/`sameBoundary` sowie GeoGebra-Zeichen- und Fehlerpfad in Reiter 5.
- Bestehendes Aufgabenlayout und Hilfen in 6; Scrollspalte nach dem Muster von Informatik 9, Modellierung und Programmierung, Aufgabe 1.
- Bestehender v1-Speicher mit validierten neuen Feldern und bewahrten Legacy-Entwürfen.

## Prüfungen und visuelle Evidenz

- `node --check` für `ui/task5-1.mjs` und `git diff --check`: erfolgreich.
- `node --test perzeptron/tests/task5-1-linear.test.mjs`: drei Tests erfolgreich.
- Browserprüfung mit Chrome bei 1024×768, 1280×800, 1366×768, 820×1180 und 390×844: Plotmodi, Grenzpunkte, Einzel-MC, 5a/5b, Reload und Layout erfolgreich (`tmp/perzeptron-51-lernweg-check.cjs`).
- Browserdurchlauf aller 14 Kern-Teilaufgaben, vollständiger Zusammenfassung und sechs Abschlussquizfragen erfolgreich (`tmp/perzeptron-51-lernweg-full-check.cjs`).
- v1-Migration mit alten Reiter-4-Entwürfen, lokalem Neuron-Reset, Plot-/MC-/Scrollspeicherung, globalem Reset sowie beschädigtem und gesperrtem Speicher erfolgreich (`tmp/perzeptron-51-lernweg-state-check.cjs`).
- Neuer bewusst leerer 5a-Entwurf bleibt nach Reload leer; alter v1-Whitespace-Entwurf erhält die Startformel. 5b bleibt bei 5a-Textänderung als geprüfter Entwurf erhalten und wird bei erneuter gültiger 5a-Prüfung gegen die neue Grenze validiert (`tmp/perzeptron-51-lernweg-empty-draft.cjs`).
- Reale GeoGebra-Sichtprüfung ohne Stub: `tmp/perzeptron-51-lernweg-five-start.png` zeigt den Startentwurf mit B als Gegenpunkt und 3/4; `tmp/perzeptron-51-lernweg-five-improved.png` zeigt 4/4 nach Verbesserung. `tmp/perzeptron-51-lernweg-four-1280.png`, `tmp/perzeptron-51-lernweg-four-390.png`, `tmp/perzeptron-51-lernweg-six-1280.png`, `tmp/perzeptron-51-lernweg-six-390.png`, `tmp/perzeptron-51-lernweg-six-5.png` und `tmp/perzeptron-51-lernweg-six-end.png` wurden visuell geprüft.
- Reiter 1/2/8 wurden gegen `tmp/perzeptron-51-lernweg-original-sections.json` unverändert verglichen. Alle sieben Shared-/Referenzdateien aus `tmp/perzeptron-51-lernweg-baseline.json` behielten ihre SHA-256-Werte.

Die Browser-Interaktionstests für GeoGebra verwendeten zum schnellen Prüfen von Auswertung und Zustand einen lokalen API-Stub. Die beiden 5er-Screenshots wurden zusätzlich mit dem realen geladenen GeoGebra-Applet aufgenommen. Es gab dabei keine Browserfehler.

Keine Abweichungen oder fehlenden verbindlichen Wortlaute. Kein Sicherungsblatt, Serveraufruf, Commit oder Deployment.
