# AGENTS.md

# Projekt: Interaktive Lernmodule für Mathematik, Physik und Informatik

Diese Website enthält digitale Lernmodule für den Unterricht.
Neue Aufgaben und Lernmodule sollen sich technisch, gestalterisch und didaktisch
möglichst eng an bestehenden Modulen orientieren.

Zentrales Ziel ist:

> Bestehende Strukturen wiederverwenden statt neue Strukturen erfinden.

Dadurch sollen die Website konsistent bleiben, Entwicklungsaufwand reduziert und
unnötiger Token-/Modellverbrauch vermieden werden.


# 1. Grundprinzipien

Bei jeder Änderung gelten folgende Prioritäten:

1. Bestehende Komponenten wiederverwenden.
2. Bestehende Aufgaben als Referenz verwenden.
3. Vorhandene Design- und Interaktionsmuster übernehmen.
4. Nur dann neue Komponenten entwickeln, wenn keine geeignete Lösung existiert.
5. Änderungen möglichst lokal halten.
6. Bestehende funktionierende Module nicht unnötig verändern.
7. Keine großflächigen Refactorings ohne ausdrücklichen Auftrag.
8. Keine neue Architektur einführen, wenn die bestehende Architektur die Aufgabe lösen kann.


# 2. Vorgehen bei neuen Aufgaben

Bevor Code geschrieben wird:

1. Aufgabenstellung vollständig lesen.
2. Den betroffenen Fach-/Klassenordner untersuchen.
3. Nach vergleichbaren bestehenden Aufgaben suchen.
4. Prüfen, welche vorhandenen Komponenten verwendet werden können.
5. Relevante Manifeste und lokale AGENTS.md-Dateien beachten.
6. Erst danach einen kurzen Implementierungsplan erstellen.

Wenn eine bestehende Aufgabe funktional ähnlich ist:

> Diese Aufgabe als technische Vorlage verwenden.

Nicht versuchen, dieselbe Funktionalität unabhängig neu zu implementieren.


# 3. Projektstruktur

Unterrichtsmaterialien sind grundsätzlich nach

- Fach
- Jahrgangsstufe
- Unterrichtseinheit
- Aufgabe

geordnet.

Beispiele:

- `informatik/klasse-9/...`
- `informatik/klasse-10/...`
- `informatik/klasse-11/...`
- `informatik/klasse-12/...`

Bei Änderungen zuerst innerhalb des entsprechenden Fach- und Klassenordners nach
Referenzimplementierungen suchen.

Erst wenn dort keine geeignete Referenz existiert, projektweit suchen.


# 4. Referenzmodule

Für neue Aufgaben sollen vorhandene Lernmodule als Referenz verwendet werden.

Besonders wichtig sind Aufgaben mit folgenden Funktionen:

## Automatische Korrektur

Bei Aufgaben mit automatisch überprüfbaren Antworten vorhandene
Korrekturmechanismen verwenden.

Nicht für jede Aufgabe eine eigene Prüfungslogik entwickeln.

Geeignet für beispielsweise:

- Zahlen
- Tabellen
- Multiple Choice
- Zuordnungen
- Lückentexte
- Formeln
- Drag-and-Drop
- strukturierte Eingaben


## Freitext-Aufgaben

Bei Freitextaufgaben mit automatisierter bzw. KI-gestützter Korrektur bestehende
"Beschreibe"- oder vergleichbare Aufgaben als Referenz verwenden.

Insbesondere nach vorhandenen Implementierungen in Informatik Klasse 9 suchen.

Keine neue KI-Korrektur-Pipeline erstellen, wenn bereits eine geeignete existiert.


## Drag-and-Drop

Vorhandene Drag-and-Drop-Systeme verwenden.

Beispiele können sein:

- Entscheidungsbäume
- Zuordnungsaufgaben
- Ablaufdiagramme
- Sortieraufgaben

Bei Entscheidungsbäumen gilt zusätzlich:

> Kanten müssen optisch von Knoten zu Knoten verlaufen und die verbundenen
> Knoten tatsächlich berühren.

Bei einem Parent mit zwei Child-Knoten darf sich die Kante zwischen den Knoten
verzweigen.


## Sicherungsblätter

Bei Sicherungsblättern:

1. allgemeines Manifest für Sicherungsblätter beachten,
2. vorhandene Sicherungsblätter als Designreferenz verwenden,
3. insbesondere bestehende Implementierungen aus Programmieraufgaben prüfen.

Sicherungsblätter sollen nicht als eigenes neues System implementiert werden,
wenn bereits eine Download-/Anzeige-Komponente existiert.


## Übersichtsseiten

Lernmodule sollen am Ende eine kompakte Übersicht bzw. Zusammenfassung besitzen,
wenn dies in vergleichbaren Aufgaben ebenfalls vorgesehen ist.

Bestehende Übersichts-Komponenten und Layouts wiederverwenden.


## Abschlussquiz

Jedes Lernmodul muss am Ende ein Abschlussquiz besitzen. Das gilt für neue und
überarbeitete Module ausnahmslos, auch wenn der konkrete Auftrag es nicht
erwähnt.

Vorgaben:

- Multiple Choice mit Auswahlkästchen, nicht mit Einfachauswahl.
- Mindestens zwei Fragen eines Quiz haben mehrere richtige Antworten. Einzelne
  Fragen dürfen genau eine richtige Antwort haben, aber ein Quiz aus
  ausschließlich einfach zu beantwortenden Fragen erfüllt die Vorgabe nicht.
- `manifest-quizaufgaben.txt` gilt verbindlich.
- Als Referenz die bestehenden Quiz-Implementierungen in Informatik Klasse 10,
  Einheit Datenbanken verwenden (dort als letzter Schritt `#final-quiz`).
  Keine eigene Quiz-Komponente entwickeln.

Ist das Modul in Reiter gegliedert, steht das Abschlussquiz im letzten Reiter.
Ein vorhandener Sicherungsblatt-Download gehört ebenfalls dorthin, damit er
erst nach der Bearbeitung erreichbar ist.


# 5. Didaktische Anforderungen

Die Website ist kein gewöhnliches Übungsportal, sondern Unterrichtsmaterial.

Deshalb bei jeder Aufgabe zusätzlich zur technischen Funktion die didaktische
Funktion prüfen.


## Aufgabenstellungen

Aufgabenstellungen sollen:

- eindeutig,
- kurz,
- altersgerecht,
- konkret und
- handlungsorientiert

formuliert sein.

Wenn möglich:

- maximal 2 kurze Sätze

oder

- maximal 3 klar formulierte Stichpunkte.

Lange Erklärungstexte nur verwenden, wenn sie fachlich notwendig sind.


## Progressive Schwierigkeit

Aufgaben möglichst in dieser Reihenfolge strukturieren:

1. entdecken / beobachten
2. verstehen
3. anwenden
4. sichern
5. übertragen

Nicht sofort abstrakte Fachbegriffe abfragen, wenn diese zuvor noch nicht
eingeführt wurden.


## Fachbegriffe

Neue Fachbegriffe sollen:

1. zunächst anhand eines Beispiels verständlich gemacht,
2. anschließend definiert,
3. danach angewendet

werden.

Die Definition soll nicht die erste Begegnung der Schülerinnen und Schüler mit
dem Konzept sein, sofern dies didaktisch vermeidbar ist.


# 6. Hilfen

Wenn Aufgaben Hilfen enthalten, bestehende Hilfe-Komponenten verwenden.

Hilfen sollen gestuft sein.

Bevorzugtes Prinzip:

- Hilfe 1: kleiner Hinweis
- Hilfe 2: konkreter Denkansatz
- Hilfe 3: starke Hilfestellung / Teillösung

Nicht sofort die vollständige Lösung anzeigen.

Hilfen dürfen die eigentliche Lernleistung nicht unnötig vorwegnehmen.


# 7. Feedback und automatische Überprüfung

Bei überprüfbaren Aufgaben soll Feedback möglichst unmittelbar erfolgen.

Feedback soll unterscheiden zwischen:

- korrekt
- teilweise korrekt
- noch nicht korrekt

Wenn technisch sinnvoll, konkrete Hinweise geben.

Beispiel:

Nicht nur:

> Falsch.

Sondern eher:

> Prüfe, welcher Datensatz über den Fremdschlüssel mit dem Benutzer verbunden ist.

Die vollständige Lösung soll nicht automatisch beim ersten Fehlversuch angezeigt
werden.


# 8. Design und UI

Neue Lernmodule müssen sich optisch in die bestehende Website einfügen.

Deshalb:

- vorhandene Farben verwenden,
- vorhandene Karten verwenden,
- vorhandene Buttons verwenden,
- vorhandene Abstände verwenden,
- vorhandene Typografie verwenden,
- vorhandene Icons verwenden,
- bestehende responsive Layouts übernehmen.

Keine neue Design-Sprache für einzelne Aufgaben entwickeln.

Keine Inline-Sonderlösungen, wenn bereits eine zentrale Komponente oder CSS-Klasse
existiert.


# 9. Responsive Design

Alle Lernmodule müssen mindestens auf folgenden Größen sinnvoll funktionieren:

- Desktop
- Tablet
- Smartphone

Insbesondere prüfen:

- Tabellen
- Diagramme
- Drag-and-Drop
- lange Fachbegriffe
- Buttons
- modale Fenster
- Übersichtsseiten

Horizontales Scrollen möglichst vermeiden, außer bei fachlich notwendigen großen
Tabellen oder Diagrammen.


# 10. Barrierearme Bedienung

Soweit mit der bestehenden Architektur vereinbar:

- ausreichende Klickflächen
- verständliche Button-Beschriftungen
- keine ausschließlich farbbasierte Rückmeldung
- sinnvolle Tastaturbedienung
- semantisch geeignete HTML-Elemente
- verständliche Alternativtexte für relevante Bilder

verwenden.


# 11. Technische Wiederverwendung

Bevor eine neue Komponente erstellt wird:

1. Projektweit nach ähnlichen Komponenten suchen.
2. Prüfen, ob eine vorhandene Komponente erweitert werden kann.
3. Prüfen, ob Konfiguration statt neuer Implementierung möglich ist.

Bevorzugt:

```text
bestehende Komponente
+ neue Daten
+ neue Konfiguration
```


# 12. Fachmanifeste

Zusätzlich zu diesem Dokument und `manifest-allgemein.txt` sind die passenden
Fachmanifeste vollständig zu lesen. Für jede neu erstellte oder überarbeitete
Physikaufgabe gilt verbindlich:

- `manifest-physikaufgaben.txt`

Bei jeder neuen oder überarbeiteten Datenbankaufgabe muss
`manifest-datenbankaufgaben.txt` vollständig gelesen und beachtet werden.


# 13. Agenten-Workflow: Plan → Build → Prüfung → Abnahme

Für neue oder umfangreich überarbeitete Lernmodule wird ein vierstufiger
Agenten-Loop verwendet, statt die Aufgabe in einem einzigen Durchlauf zu
konzipieren, zu bauen und zu prüfen. Die Stufen setzen die Rollenteilung um,
die `manifest-allgemein.txt` in Abschnitt 3 für größere Aufträge ohnehin
vorschreibt.

1. **Planung** (`lernmodul-planner`, leistungsfähiges Modell) — erstellt aus
   der Aufgabenstellung eine Spezifikation gemäß Abschnitt 1–12 dieses
   Dokuments und der einschlägigen Manifeste, inklusive konkreter
   Referenzimplementierung, wörtlicher Formulierungen und zweier getrennter
   Akzeptanzkriterien-Listen. Schreibt selbst keinen Code.
2. **Bau** (`lernmodul-builder`, kosteneffizientes Modell) — implementiert das
   Modul strikt nach Spezifikation und Referenzkomponenten und übernimmt
   vorgegebene Wortlaute unverändert.
3. **Regelbasierte Vorprüfung** (`lernmodul-pruefer`, kosteneffizientes
   Modell) — arbeitet die mechanischen Checklisten aus
   `manifest-allgemein.txt` ab: Links, Dateinamen, Menüreihenfolge,
   Lehrercode, Barrierearmut-Merkmale, Sicherungsblatt-Render, `git diff
   --check`. Bewertet keine Didaktik.
4. **Endabnahme** (`lernmodul-reviewer`, leistungsfähiges Modell) — prüft
   fachliche Richtigkeit, Didaktik, Wiederverwendung, Feedback-Logik und
   Gestaltung gegen die Spezifikation und gibt `APPROVED` oder
   `CHANGES_REQUIRED` zurück.

Die Spezifikation aus Stufe 1 ist die Verdichtung dieses Dokuments und der
Manifeste für die jeweilige Aufgabe. Die späteren Stufen arbeiten mit ihr,
statt AGENTS.md und alle Manifeste erneut vollständig zu lesen. Das ist
zugleich Kostensteuerung und Konsistenzsicherung.

Korrekturschleifen sind begrenzt: höchstens drei Runden zwischen Bau und
Vorprüfung, höchstens zwei Aufrufe der Endabnahme. Danach wird die Aufgabe mit
einer Zusammenfassung der offenen Punkte an die verantwortliche Person
zurückgegeben, statt die Schleife fortzusetzen.

Der Loop hat Fixkosten, weil jeder Subagent mit leerem Kontext startet und
Manifeste und Referenzdateien neu einliest. Er lohnt sich bei neuen Modulen,
umfangreichen Überarbeitungen und Serien (eine Konzeption, mehrere Artefakte).
Kleine Änderungen — Textkorrektur, Menüeintrag, Linkfix — werden direkt
erledigt und nicht durch den Loop geschickt.

Die vier Rollen sind als Subagenten unter `.claude/agents/` definiert
(`lernmodul-planner.md`, `lernmodul-builder.md`, `lernmodul-pruefer.md`,
`lernmodul-reviewer.md`) und werden über den Befehl
`/lernmodul-loop <Aufgabenbeschreibung>` (`.claude/commands/lernmodul-loop.md`)
orchestriert.

Dieser Workflow ersetzt nicht die in Abschnitt 1–12 beschriebenen inhaltlichen
Prinzipien, sondern verteilt ihre Anwendung auf vier Rollen mit
unterschiedlichem Modellaufwand.
