# Aufgabe 4 – Entscheidungsbäume untersuchen

## Wiederverwendete Referenzen

- `aufgabe3.html`, `ui/task3.mjs` und `task3.css`: Freitextfeld, Zeichenzähler, Hilfen und zugängliche Rückmeldung.
- `ui/semantic-answer.mjs`: bestehende JSONP-Anbindung an den Skriptserver mit Ladezustand und Fehlerbehandlung.
- `data/fish.mjs` und `logic/fish-learning.mjs`: Fischdaten und die bereits vorhandene Konfiguration der Tiefenergebnisse.
- `aufgabe3c.html` und `ui/task3c.mjs`: Trennung von Trainings- und Testdaten sowie Darstellung der Testgenauigkeit.
- `styles.css`: Karten, Buttons und Feedbackzustände des Entscheidungsbaum-Moduls.

## Aktuelle Struktur und Skriptserver

Die Seite verwendet die vorhandene Tab-Darstellung des Entscheidungsbaum-Moduls. Die sichtbare Reihenfolge ist `4.1` → `4.2` → `4a`. Der Trainingsdatensatz steht in 4.1, der Testdatensatz in 4.2 und der große Datensatz ausschließlich in 4a bereit. Der kleine Datensatz wird nicht mehr angeboten.

Die beiden Freitextaufgaben verwenden weiterhin die bestehende JSONP-Anbindung in `ui/semantic-answer.mjs`:

- `11-4-1`: Baum beschreiben, unvollständige Klassifikation begründen und eine sinnvolle Verbesserung nennen.
- `11-4-2`: sinkende Zahl falsch klassifizierter Trainingsdaten, gleichbleibende Testgenauigkeit und begründete Wahl von Tiefe 3.

Die frühere Konfiguration `11-4-3` bleibt zur Kompatibilität im Skriptserver erhalten, wird von dieser Seite aber nicht mehr aufgerufen.

## Erwartete Tabellenwerte

| Maximale Baumtiefe | Anzahl falsch klassifizierter Trainingsdaten | Genauigkeit nach Testphase |
| --- | --- | --- |
| 1 | 3 | 80 % |
| 2 | 1 | 80 % |
| 3 | 0 | 80 % |

Die Tabellenprüfung akzeptiert bei der Genauigkeit Dezimalkomma oder Dezimalpunkt sowie ein optionales Prozentzeichen. Teilfehler werden feldgenau benannt, ohne den Sollwert zu verraten.

## Prüfung und Änderungen gegenüber Terras Stand

Die aktuelle Testliste und die Änderungen gegenüber dem vorherigen Stand stehen in `AUFGABE4-PRUEFBERICHT.md`.

## Offener Punkt / Risiko

Die Änderungen in `apps-script/` müssen noch über das bestehende Apps-Script-Deployment veröffentlicht werden, bevor die angepassten Rubriken produktiv gelten. Die lokale Regelbewertung ist getestet; ein produktiver Live-Test war nicht Teil der lokalen Prüfung.
