# Regelbasierte Vorprüfung – Runde 1

PRUEFUNG_FEHLER

1. `perzeptron/tests/task6-1-browser-smoke.mjs:21`; `aufgabe6-1.html:19–32`: Auch im frischen Edge-Profil erwartet der Smoke nach Änderung von `gewichtete_Summe = 4` auf `5` die Konsolenausgabe `00`, erhält aber `10`. Der geforderte IDE-Lauf für 1A/1B ist nicht bestanden. Startstand, Quelltextänderung und tatsächliche Ausführung sind zu isolieren und zu korrigieren; kein bloßer Altprofil-Effekt.
2. `knn/tests/task7-contract.test.mjs`: Der Vertragstest erwartet `knn/ui/task7.mjs?v=20261022-compact-feedback`, während `aufgabe7.html:14` den aktuellen Link `knn/ui/task7.mjs?v=20261022-feedback-two-sentences` einbindet. Erwartungswert an aktuellen Script-Link anpassen.

Nachweise: neue Scaleway-Tests 3/3 bestanden; Syntaxprüfung `task6-1.mjs` erfolgreich; `git diff --check` ohne Fehler.

PDFs gerendert und visuell geprüft:

- `C:/Users/Franke/.codex/visualizations/2026/10/26/01a176c3-588d-7be0-95cb-4e51a0396115/pdf-build/sicherungsblatt-aufgabe-6-1.png`
- `C:/Users/Franke/.codex/visualizations/2026/10/26/01a176c3-588d-7be0-95cb-4e51a0396115/pdf-build/lehrercodes-dekodierung-1.png`
- `C:/Users/Franke/.codex/visualizations/2026/10/26/01a176c3-588d-7be0-95cb-4e51a0396115/pdf-build/lehrercodes-dekodierung-2.png`

Quelle: Rückgabe des Agenten `vorpruefung_6_1`, regelbasierte Prüfung 1.
