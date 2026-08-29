# Abschließender Prüfbericht – Aufgabe 4

Stand: 30. August 2026

| Prüfkriterium | Ergebnis | Nachweis |
| --- | --- | --- |
| Reiter und Reihenfolge 4.1 → 4.2 → 4a | Bestanden | Reiter, Vor-/Zurück-Navigation und Tastatursteuerung mit Pfeiltasten wurden lokal ausgeführt. |
| Datensatz-Downloads | Bestanden | Trainingsdaten ausschließlich in 4.1, Testdaten in 4.2 und großer Datensatz ausschließlich in 4a; alle Ziele existieren und sind nicht leer. Der kleine Datensatz ist entfernt. |
| Fachliche Bewertung 4.1 | Bestanden | Rubrik bewertet Baumdarstellung, begründete unvollständige Klassifikation und sinnvolle Verbesserung getrennt und akzeptiert sinngleiche Formulierungen. |
| Tabellenprüfung und Trennung von Training/Test in 4.2 | Bestanden | Erwartete Werte 3/1/0 und dreimal 80 %. Prozentvarianten wurden geprüft; Teilfeedback nennt nur das fehlerhafte Feld und verrät keinen Sollwert. |
| Lernhinweis beim Absenden | Bestanden | Hinweis ist initial verborgen und wird erst durch den Prüfbutton der Beschreibe-Antwort sichtbar, auch bei zu kurzem Text. Durch UI-Interaktionstest abgesichert. |
| Fachliche Bewertung 4.2 | Bestanden | Die vorgegebene Musterantwort erhält 3 von 3 Punkten; falsche Behauptung einer steigenden Testgenauigkeit erhält keine volle Punktzahl. |
| Freitextaufgaben am vorhandenen Skriptserver | Bestanden | Eindeutige IDs `11-4-1` und `11-4-2`; vorhandenes Anfrageformat, 3000-Zeichen-Grenze, Lade-/Fehlerzustände und Datenschutzhinweis bleiben unverändert. |
| Vertiefung 4a | Bestanden | Als „Vertiefung für Schnelle“ sichtbar, großer Datensatz passend verlinkt, kein Eingabefeld und keine automatische Korrektur. |
| Änderungsscope und Wiederverwendung | Bestanden | Keine Architekturänderung und kein Refactoring anderer Lernmodule. Vorhandene Entscheidungsbaum-, Feedback- und Skriptserver-Strukturen werden weiterverwendet. |
| Responsive Darstellung und Bedienung | Bestanden | Reale lokale Browserprüfung bei 1440×900, 820×1180 und 390×844: kein horizontales Seiten-Overflow, semantische Tabellenbeschriftungen und Klickflächen von mindestens 44 px. |

## Behobene Fehler

- Lange Einzelseite durch vorhandene Reiterdarstellung mit 4.1, 4.2 und 4a ersetzt.
- Downloads in die fachlich passenden Reiter verschoben; kleiner Datensatz entfernt.
- Aufgabenstellungen, Tabellenüberschriften und Hilfen gemäß Arbeitsauftrag ersetzt; Hilfe 3 vollständig entfernt.
- Tabelle auf Trainingsfehler und Genauigkeit nach der Testphase umgestellt.
- Rubriken 4.1 und 4.2 fachlich neu ausgerichtet und lockerer gegenüber sinngleichen Formulierungen gestaltet.
- Regressionstests für Navigation, Downloadpositionen, Tabellenvarianten, Teilfeedback und Lernhinweis ergänzt.

## Ausgeführte Tests

- 40 Entscheidungsbaum-Regressionstests mit `node --test`: bestanden.
- 4 Apps-Script-Routing- und Rubriktests mit `node --test`: bestanden.
- Syntaxprüfung von `ui/task4.mjs` und `git diff --check`: bestanden.
- Reale lokale Browserinteraktionen für Tabs, Tastaturnavigation, Hilfen, richtige und teilweise falsche Tabellenwerte sowie den zunächst verborgenen Lernhinweis: bestanden.
- Responsive Browserprüfung bei 1440×900, 820×1180 und 390×844: kein horizontales Seiten-Overflow; Tab- und Navigationsbuttons mindestens 44 px hoch.

## Verbleibende Einschränkungen

- Die geänderten Apps-Script-Rubriken müssen noch mit dem bestehenden Deployment veröffentlicht werden.
