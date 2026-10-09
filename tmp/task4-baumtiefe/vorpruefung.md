PRUEFUNG_BESTANDEN
Die CSS-Korrektur begrenzt die Reiterpanels auf die verfügbare Breite und der Cache-Buster wurde auf `20261008c` angehoben. Root bestätigte nach dem Fix auf 390 px vier Panels mit 358,667 px Breite, ohne abgeschnittenen Inhalt oder horizontalen Seitenüberlauf; auch 768 px und 1366 px bestehen die Layoutprüfung.

Gerenderte Sicherungsblattseite: `C:/Users/ffran/Documents/git/unterricht/tmp/pdfs/task4-baumtiefe/page-1.png`
Smartphone nach Fix: `C:/Users/ffran/Documents/git/unterricht/tmp/task4-baumtiefe/mobile-after.jpg`
Desktopvorschau: `C:/Users/ffran/Documents/git/unterricht/tmp/task4-baumtiefe/vergleich-preview.jpg`

Weitere Nachweise:
- `node --test faecher/informatik/klasse-11/1-Kuenstliche-Intelligenz/entscheidungbaeume/tests/task4.test.mjs`: 4/4 bestanden.
- `node apps-script/tests/aufgabe4-rules.test.js`: bestanden.
- `git diff --check`: keine Fehler (Git meldet lediglich LF/CRLF-Konvertierungshinweise).
- Lokale HTML-, Bild- und PDF-Ressourcen geprüft: keine fehlenden Pfade; HTML-IDs eindeutig. Aufgabe 4 ist im Informatik-11-Menü sichtbar und numerisch korrekt eingeordnet. Rückweg zur Jahrgangsübersicht und Startseitenlink sind vorhanden.
- `lang="de"`, UTF-8, Hauptüberschrift, Labels, `aria-live`-Rückmeldungen, Vergleichsfrage und drei Abschlussquizfragen mit Checkboxen vorhanden. Die gemeinsame Quizkomponente wird eingebunden und verwendet. Vier Reiter in Spezifikationsreihenfolge; eine Downloadkomponente im letzten Reiter.
- Verborgener Downloadbutton und Code `M8TR-DP7H` geprüft; der Code stimmt mit `lehrercodes-dekodierung.tex` überein und passt zum Informatik-11-Aufgabe-4-Schema.
- Sicherungsblatt visuell als eine lesbare A4-Seite ohne erkennbare Überläufe geprüft.
- Browserprüfung: Vergleichsfrage empty/missing/mixed/wrong/correct; Merksatzfreigabe bei korrekter Antwort. Abschlussquiz inklusive q1 Zuständen, q2/q3 korrekt, automatischer Gesamtauswertung und Übersicht nach allen drei Einzelprüfungen. Texte, sechs Tabellenwerte, Checkboxen, aktiver Reiter und freigegebene Übersicht über Menüwechsel, Rückkehr und Reload erhalten. Download ohne Quiz erreichbar und erst nach korrekter normalisierter Codeeingabe sichtbar. Home/End-Tastaturbedienung für vier Reiter funktioniert.
- Die mobile Beanstandung aus Runde 1 ist nach CSS-Anpassung und erneutem Browsercheck behoben.

Gezielte Nachprüfung nach Endabnahme 1 (Ergänzung):
- Q2-Aussage und Erfolgssatz stimmen wörtlich mit den Korrekturvorgaben in `tmp/task4-baumtiefe/endabnahme.md` überein.
- Die Regeln prüfen `negatesGain` vor `claimsTestGain`; der vollständige neue Positivfall enthält ausdrücklich „Die Testgenauigkeit steigt nicht“ und erwartet 3 Punkte. `node apps-script/tests/aufgabe4-rules.test.js` besteht.
- Root-CUA bestätigte Q2-Fragetext und Erfolgsmeldung nach Reload sowie unverändertes Layout. `git diff --check` besteht weiterhin; es gibt nur LF/CRLF-Hinweise.
