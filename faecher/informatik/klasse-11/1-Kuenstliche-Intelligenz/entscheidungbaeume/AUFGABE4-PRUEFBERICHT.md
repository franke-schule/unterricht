# Abschließender Prüfbericht – Aufgabe 4

Stand: 28. August 2026

| Prüfkriterium | Ergebnis | Nachweis |
| --- | --- | --- |
| 4.1, 4.2 und 4.3 im richtigen Modul und in richtiger Reihenfolge | Bestanden | Seite liegt in Informatik 11 / Künstliche Intelligenz, ist nach Aufgabe 3c verlinkt und enthält die Abschnitte in DOM-Reihenfolge 4.1 → 4.2 → 4.3. |
| Vier Fischdateien verlinkt und erreichbar | Bestanden | Alle relativen Ziele existieren und sind nicht leer; Links werden im automatischen Test aufgelöst. |
| Fachliche Bewertung 4.1 | Bestanden | Rubrik akzeptiert Schuppenfarbe, klare Nein-Entscheidung sowie gemischte/unreine Teilmengen oder weitere Splits. Gleichwertige Formulierungen und `6 von 9` werden erkannt. |
| Tabellenprüfung und Trennung von Training/Test in 4.2 | Bestanden | Trainingswerte 66,7 %, 88,9 %, 100 %; Test jeweils 80 %; Fehler T3, T4, T4. Dezimalkomma, Dezimalpunkt, Prozentzeichen, IDs und Fischbeschreibungen werden geprüft. Teilfeedback nennt fehlerhafte Felder ohne Sollwerte zu verraten. |
| Lernhinweis beim Absenden | Bestanden | Hinweis ist initial verborgen und wird erst durch den Prüfbutton der Beschreibe-Antwort sichtbar, auch bei zu kurzem Text. Durch UI-Interaktionstest abgesichert. |
| Fachliche Bewertung 4.3 | Bestanden | Gleiche Genauigkeit und unterschiedliche Fehlklassifikationen werden auch mit `Fisch 3`/`Fisch 4` oder allgemeiner Kernaussage erkannt; Grenze der Genauigkeit bleibt eigener Rubrikaspekt. |
| Drei Freitextaufgaben am vorhandenen Skriptserver | Bestanden | Eindeutige IDs `11-4-1`, `11-4-2`, `11-4-3`; vorhandenes JSONP-Format, 3000-Zeichen-Grenze, Ladezustand, Sperre gegen Mehrfachabsenden, Timeout-/Serverfehler und Datenschutzhinweis werden wiederverwendet. Bestehende Routingtests bleiben grün. |
| Vertiefungen 4a–4c | Bestanden | Als „Vertiefung für Schnelle“ sichtbar, fachlich progressiv und ohne Eingabefelder, Formulare oder automatische Korrektur. |
| Fachbegriffe | Bestanden | Maximale Baumtiefe, Trainingsdaten, Testdaten, Genauigkeit, Generalisierung und Überanpassung werden fachlich korrekt und im passenden Lernschritt verwendet. |
| Änderungsscope und Wiederverwendung | Bestanden | Keine Architekturänderung und kein Refactoring anderer Lernmodule. Vorhandene Entscheidungsbaum-, Feedback- und Skriptserver-Strukturen werden weiterverwendet. |
| Responsive Darstellung und Bedienung | Bestanden mit Einschränkung | Vorhandene responsive Tabellenkomponente, Fokusdarstellung, semantische Labels und Breakpoints 760/430 px sind geprüft. Die UI-Logik wurde lokal interaktiv ausgeführt; eine visuelle In-App-Browserprüfung lokaler URLs war durch die Browser-Sicherheitsrichtlinie blockiert. |

## Behobene Fehler

- Die 4.1-Rubrik erkennt nun auch fachlich korrekte Formulierungen mit „Nein“, `6 von 9`, „unreine Teilmengen“ oder dem gemeinsamen Auftreten friedlicher und feindseliger Fische.
- Die 4.2-Rubrik vergibt den Testdaten-Aspekt nicht mehr allein für das Wort „Testdaten“, sondern verlangt die korrekte Aussage, dass die Testgenauigkeit hier bei 80 % bleibt beziehungsweise nicht steigt.
- Die Modellwahl in 4.2 akzeptiert weitere natürliche Formulierungen wie „entscheide“, „verwende“ oder „nehme“.
- Die 4.3-Rubrik erkennt „Beide haben 80 %“ sowie `Fisch 3`/`Fisch 4` als gleichwertige Schreibweisen.
- Neue Regressionstests prüfen die Rubriken und führen Tabellenprüfung sowie Lernhinweis gegen die echte UI-Logik aus.

## Verbleibende Einschränkungen

- Die neuen Apps-Script-Aufgaben müssen noch in der bestehenden Web-App-Version veröffentlicht werden; ein Live-Test der produktiven Gemini-Auswertung war deshalb nicht möglich.
- Die lokale visuelle Browserprüfung blieb aufgrund der Sicherheitsrichtlinie für `localhost` und `file://` blockiert. Es wurde keine Umgehung oder externe Übertragung verwendet.
