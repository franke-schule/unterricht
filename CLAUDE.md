# CLAUDE.md

Die verbindlichen Projektregeln stehen in `AGENTS.md`. Diese Datei importiert
sie, damit Claude Code sie automatisch lädt; `AGENTS.md` bleibt die einzige
Quelle und funktioniert weiterhin für andere Agenten-Werkzeuge.

@AGENTS.md

## Manifeste

Zusätzlich zu `AGENTS.md` gelten die Manifeste im Wurzelordner. Sie werden
bewusst **nicht** automatisch importiert — zusammen sind sie über 50 KB groß
und würden jede Session belasten. Stattdessen gilt: vor der Arbeit an einer
Aufgabenseite zuerst `manifest-allgemein.txt` vollständig lesen, danach das
passende Fachmanifest.

| Manifest | Wann vollständig lesen |
|---|---|
| `manifest-allgemein.txt` | immer, bei jeder Aufgabenseite |
| `manifest-datenbankaufgaben.txt` | jede neue oder überarbeitete Datenbankaufgabe (verbindlich) |
| `manifest-physikaufgaben.txt` | jede neue oder überarbeitete Physikaufgabe (verbindlich) |
| `manifest-quizaufgaben.txt` | Quiz- und Abfrageaufgaben |
| `manifest-online-ide-programmieraufgaben.txt` | Aufgaben mit der Online-IDE |
| `manifest-tabellenkalkulation.txt` | Tabellenkalkulationsaufgaben |
| `manifest-debug.txt` | Debug-Aufgaben |

## Größere Lernmodule

Für neue oder umfangreich überarbeitete Module den Befehl
`/lernmodul-loop <Aufgabenbeschreibung>` verwenden (siehe `AGENTS.md`
Abschnitt 13). Kleine Änderungen direkt erledigen.
