# Aufgabe 4 – Entscheidungsbäume untersuchen

## Wiederverwendete Referenzen

- `aufgabe3.html`, `ui/task3.mjs` und `task3.css`: Freitextfeld, Zeichenzähler, Hilfen und zugängliche Rückmeldung.
- `ui/semantic-answer.mjs`: bestehende JSONP-Anbindung an den Skriptserver mit Ladezustand und Fehlerbehandlung.
- `data/fish.mjs` und `logic/fish-learning.mjs`: Fischdaten und die bereits vorhandene Konfiguration der Tiefenergebnisse.
- `aufgabe3c.html` und `ui/task3c.mjs`: Trennung von Trainings- und Testdaten sowie Darstellung der Testgenauigkeit.
- `styles.css`: Karten, Buttons und Feedbackzustände des Entscheidungsbaum-Moduls.

## Skriptserver-Erweiterung

In `apps-script/Tasks.gs` sind drei Aufgaben mit Erwartungshorizont und altersgerechtem Bewertungsniveau ergänzt:

- `11-4-1`: Schuppenfarbe, Grenze bei Tiefe 1, gemischte Teilmengen.
- `11-4-2`: wachsende Baumkomplexität, steigende Trainingsgenauigkeit, nicht automatisch bessere Testgenauigkeit und begründete Modellwahl.
- `11-4-3`: gleiche Genauigkeit, unterschiedliche Fehlklassifikationen und Grenzen der Genauigkeit als alleiniges Gütemaß.

`apps-script/Rules.gs` sichert für diese drei kleinen, klaren Erwartungshorizonte die fachlichen Kernaspekte regelbasiert ab. Die bestehende semantische Auswertung und der Datenschutzpfad des Skriptservers bleiben dabei unverändert.

## Erwartete Tabellenwerte

| maximale Tiefe | Trainingsgenauigkeit | Testgenauigkeit | falsch klassifizierter Testfisch |
| --- | --- | --- | --- |
| 1 | 66,7 % | 80 % | T3 |
| 2 | 88,9 % | 80 % | T4 |
| 3 | 100 % | 80 % | T4 |

Die Tabellenprüfung akzeptiert Dezimalkomma oder Dezimalpunkt sowie ein optionales Prozentzeichen. Für die fehlerhaften Fische werden die IDs `T3` beziehungsweise `T4` und passende Beschreibungen ihrer sichtbaren Merkmale akzeptiert.

## Prüfung und Änderungen gegenüber Terras Stand

Ausgeführt wurden:

- die komplette Entscheidungsbaum- und Apps-Script-Testreihe: 41 Tests bestanden,
- `node --check` für `ui/task4.mjs`,
- `git diff --check`,
- direkte lokale Regeltests für vollständige, teilweise richtige und falsche Antworten in allen drei neuen Rubriken,
- statische Prüfung aller lokalen Links, der responsiven Breakpoints sowie der input-freien Vertiefungen 4a–4c.

Eine interaktive In-App-Browserprüfung war für die lokalen `localhost`-/`file://`-Adressen durch die Browser-Sicherheitsrichtlinie blockiert; deshalb wurden keine Browserdaten oder externen Dienste als Umgehung verwendet.

Gegenüber Terras Stand wurden die Datenbasis von 4.1 und die Reihenfolge von 4.2 explizit im Arbeitsbereich ausgezeichnet, der Datenschutztext an die bestehende Klasse-9-Referenz angeglichen, der Hinweis von 4.2 für jeden Absendeversuch (auch bei zu kurzer Antwort) aktiviert, und die Teilrückmeldung der Tabelle um die noch zu prüfenden Felder ergänzt. Zusätzlich akzeptiert die Fischprüfung Schreibweisen wie `T3`, `Testfisch 3` und Merkmalsbeschreibungen.

## Offener Punkt / Risiko

Die geänderten Dateien unter `apps-script/` müssen noch mit dem bestehenden Apps-Script-Deployment veröffentlicht werden, bevor die drei neuen Aufgaben-IDs auf der öffentlich erreichbaren Seite Feedback liefern. Die Oberfläche und die lokale Testreihe prüfen die Anbindung, aber kein Live-Aufruf an den produktiven Skriptserver wurde ausgeführt.

Die ursprüngliche Aufgabenbeschreibung bezeichnet das Modul an einer Stelle als erste „Physik-Aufgabe“, verortet es ansonsten aber eindeutig in Informatik Klasse 11. Die Umsetzung folgt dem genannten Zielordner und verwendet deshalb die vorhandenen Informatik-Referenzen; ein entsprechendes Physik-Modul mit diesem Skriptserver-Vertrag existiert im Repository nicht.

Der abschließende Kriterienstatus und die zuletzt behobenen Bewertungsvarianten stehen in `AUFGABE4-PRUEFBERICHT.md`.
