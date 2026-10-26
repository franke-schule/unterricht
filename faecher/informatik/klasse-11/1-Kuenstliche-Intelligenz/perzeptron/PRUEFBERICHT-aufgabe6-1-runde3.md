# Regelbasierte Vorprüfung – Runde 3

PRUEFUNG_FEHLER

Der eingecheckte Browser-Smoke liest nach Navigation/Reload die Dateien aller
IDEs aus, obwohl der Quiz-Reiter aktiv ist, ohne die IDE-Reiter erneut zu
aktivieren oder auf `Hauptprogramm.java` zu warten. In
`perzeptron/tests/task6-1-browser-smoke.mjs:38–39` ergibt
`getFiles().find(...).getText()` daher zeitweise `undefined`.
Vor jedem Persistenzzugriff sind Reiteraktivierung und Dateibereitschaft
abzuwarten.

Die Produktpersistenz und die vier Korrekturen der Endabnahme wurden separat
mit einer temporären Smoke-Kopie mit diesen Wartebedingungen erfolgreich
geprüft. Alle fünf IDEs, Grenzfälle, Erklärungsfreigaben, vollständige
Quizübersicht, automatische Quiz-Auswertung und drei Viewports bestanden;
keine Seitenfehler. Betroffene Vertragstests 4/4, Syntax und
`git diff --check` bestanden.

Quelle: Rückgabe des Agenten `vorpruefung_6_1`, Vorprüfung 3.

Im Anschluss hat die Lehrkraft eine neue inhaltliche Korrektur beauftragt:
Block-/Zweigfragen entfernen, nur Ausgaben abfragen und einen ausdrücklichen
Hinweis zur nicht erfüllten if-Bedingung anzeigen. Diese spätere Anweisung
hat Vorrang vor den bisherigen Wortlauten der Spezifikation.
