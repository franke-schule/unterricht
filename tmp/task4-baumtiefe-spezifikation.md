# Spezifikation: Informatik 11, Aufgabe 4 „Baumtiefe“

Stand: 8. Oktober 2026. **Verbindliche Wahl der Lehrkraft:** Die fünf Testfische und sämtliche Messwerte bleiben unverändert. Dies ist eine gezielte Überarbeitung des bestehenden Moduls, kein neues Wiederholungs-Quiz. Diese Spezifikation ist für Bau, regelbasierte Prüfung und fachliche Endabnahme bestimmt; vor dem Bau sind keine erneuten Volllektüren der Manifeste nötig.

## 1. Befund, Lernziel und Grenzen

In `faecher/informatik/klasse-11/1-Kuenstliche-Intelligenz/aufgabe4.html` tragen die Lernenden für die Tiefen 1, 2, 3 die Trainingsfehler **3, 1, 0** und die Testgenauigkeit **80 %, 80 %, 80 %** ein. Das entspricht jeweils **4 von 5** richtigen Testfischen. Tiefe 1 klassifiziert T3 falsch, Tiefe 2 und 3 jeweils T4; die gleiche Quote bedeutet nicht zwangsläufig dieselben Fehler. Präzise ist also: Die **aggregierte Testgenauigkeit** bleibt hier gleich, nicht der Baum selbst und nicht zwingend die jeweils falsch klassifizierten Fische. Der bisherige Prüftext in `apps-script/Tasks.gs` zu `11-4-2` und die Regel in `apps-script/Rules.gs` belohnen ausdrücklich Tiefe 3 wegen null Trainingsfehlern. Das konterkariert das Lernziel. Ein Nachweis für Überanpassung liegt mit diesen fünf Testfischen **nicht** vor. Ebenso folgt aus den fünf Testfischen keine endgültige optimale Tiefe.

Lernziel: Die Lernenden unterscheiden die Verbesserung **auf Trainingsdaten** vom ausbleibenden Zugewinn **auf diesen Testdaten**. Sie können einen einfacheren Baum bei gleicher beobachteter Testgenauigkeit **vorläufig** bevorzugen und erklären, warum für eine belastbare Wahl weitere, vom Training getrennte Daten nötig sind. Bei einer systematischen Tiefenwahl sollen die zur Auswahl verwendeten Daten von einem anschließenden unabhängigen Test getrennt bleiben. Dafür keine Definitionen neuer Fachwörter (etwa „Validierungsdatensatz“ oder „Überanpassung“) verlangen.

Didaktische Folge: entdecken (Tabellenwerte ermitteln) → verstehen (beide Spalten direkt vergleichen) → anwenden (begründete, vorläufige Modellwahl) → sichern (Merksatz und Abschlussquiz) → übertragen (größerer Datensatz in 4a). Bestehende 4.1 und das optionale 4a fachlich und technisch weitgehend beibehalten.

## 2. Referenzen und Wiederverwendung

- Primäre Vorlage im Themenordner: `faecher/informatik/klasse-11/1-Kuenstliche-Intelligenz/aufgabe4.html`, `entscheidungbaeume/ui/task4.mjs`, `entscheidungbaeume/task4.css`, `entscheidungbaeume/logic/fish-depth.mjs`, `entscheidungbaeume/logic/fish-learning.mjs`. `FISH_DEPTH_RESULTS` und vorhandene `numberMatches`/`percentageMatches` bleiben die einzige Quelle für Tabellenwerte und Tabellenprüfung.
- Vorhandene Daten: `entscheidungbaeume/data/downloads/Datensatz_Fische_Einstieg_Trainingsdaten.csv` und `Datensatz_Fische_Einstieg_Testdaten.csv`. Nicht ändern.
- Abschlussquiz: Struktur von `faecher/informatik/klasse-10/1-Datenbanken/aufgabe4.html` (`#final-quiz` und `solution-download`) und Anbindung in `faecher/informatik/klasse-10/1-Datenbanken/tabellenschema.js` (`bindFinalQuestionChecks`); gemeinsame Komponente `faecher/informatik/quiz-fragen-pruefen.js` mit `addQuizQuestionChecks`. Für die neuen Fragen **Checkboxen**, `fieldset`/`legend`, sichtbare Labels, Rückmeldungen direkt unter jeder Frage, gemeinsamer Auswertungsbutton. Kein neues Quiz-Framework.
- Bestehende Oberflächenklassen wiederverwenden: `task4-card`, `fish-help-details`, `task4-learning-note`, `dt-feedback`, `fish-semantic-feedback`, `dt-primary-button`, `solution-download`, `solution-reveal`; CSS nur lokal ergänzen. Bestehende Tab-Navigation und Semantik erhalten.
- Bestehende `evaluateSemanticAnswer`-Anbindung für `11-4-1` und `11-4-2` erhalten. Keine neue KI-Pipeline. Datenschutzsatz unverändert lassen. Bisherige `localStorage`-Logik unter `informatik11-ki-aufgabe4-v1` ausbauen, keine zweite Speicherarchitektur einführen; alte gespeicherte Freitexte/Tabellenwerte bleiben lesbar.
- Bestehende Lehrercode-Funktion und Code `M8TR-DP7H` beibehalten. Die PDF-Freigabe bleibt nur an den Code gebunden. Keine Änderung an Dekodierdatei, da kein neuer Code entsteht.
- `manifest-allgemein.txt` gilt für Seitenstruktur, Persistenz, Barrierearmut und PDF. `manifest-quizaufgaben.txt` gilt für Vergleichsfrage und Abschlussquiz. `manifest-wiederholungs-quiz.txt` gilt nur für ein **neu erstelltes oder überarbeitetes eigenständiges** `aufgabeN-quiz.html`; hier wird keines angelegt. Daher weder Quiz-Folie noch Löschanleitung, neue Skriptserver-Aufgaben-IDs oder Präsentationsänderung.

## 3. Konkreter Seitenablauf

1. Reiter `task41`: bestehende Erarbeitung, Trainingsdatei, zwei Hilfen und Freitextkorrektur beibehalten. Die dritte Hilfestufe ist für diesen Bestand nicht nötig; keine neue Hilfe ergänzen, die den Baum vorwegnimmt.
2. Reiter `task42`: erst Tabelle mit Training und Test wie bisher. **Direkt nach der Tabelle und ihrer Rückmeldung**, vor dem Freitext, eine kurze Vergleichsfrage mit Checkboxen; sie darf bearbeitet werden, auch wenn die Tabelle noch nicht vollständig richtig ist. Die Lernenden müssen beide Spalten gedanklich gegenüberstellen. Die gestuften Tabellenhilfen bleiben.
3. Im gleichen Reiter nach der Vergleichsfrage den unten wörtlich formulierten Merksatz und den kurzen Ausblick sichtbar machen; idealerweise erst nach richtiger Vergleichsantwort, wobei die Freischaltung gespeichert und beim erneuten Laden wiederhergestellt wird. Der Freitext folgt **danach**. Er wird weiter mit `11-4-2` ausgewertet; Prompt, Apps-Script-Aufgabe und Regel müssen übereinstimmen. Auch wenn die Vergleichsfrage falsch ist, darf die nächste Eingabe zum Korrigieren erreichbar bleiben; keine Tab-Sperre.
4. Reiter `task4a`: optionale Vertiefung zum großen Datensatz ohne Eingabefeld und ohne Korrektur beibehalten. Dieser Reiter bleibt unabhängig vom Abschlussquiz erreichbar.
5. **Neuer letzter Reiter** `task4abschluss`: kompakte Sicherung mit `#final-quiz` und vorhandener Sicherungsblatt-Downloadkomponente. Er ist über Reiternavigation jederzeit erreichbar. Die bisherige Downloadkomponente von `task4a` hierher verschieben, nicht duplizieren. Ein erfolgreicher Quizabschluss darf eine kurze Ergebnisübersicht im selben Reiter einblenden; Download bleibt auch vor jeder Bearbeitung per Lehrercode erreichbar. Neue Tab-ID an `STEP_IDS` anhängen; `Weiter`/`Zurück`, Pfeiltasten, `Home`/`End` und Persistenz müssen für vier Reiter funktionieren.

## 4. Verbindliche Schülertexte

Alle folgenden Texte sind wortgleich zu übernehmen. Bestehende, hier nicht genannte Texte dürfen bleiben. `**...**` bezeichnet fett gesetzten Operator bzw. Merkwort, nicht wörtliche Sternchen im HTML.

### 4.2: Vergleich vor Freitext

Überschrift: **„Vergleiche Training und Test“**.

Arbeitsauftrag (zwei Sätze): **„Vergleiche die beiden Ergebnisspalten für die Baumtiefen 1 bis 3. Kreuze alle Aussagen an, die zu deinen Ergebnissen passen.“**

Vergleichsfrage mit vier Checkboxen, Reihenfolge verbindlich:

| Wert | Aussage | Richtig |
| --- | --- | --- |
| `training-less` | „Mit zunehmender Tiefe sinkt die Zahl der Trainingsfehler von 3 auf 0.“ | ja |
| `test-same` | „Alle drei Bäume klassifizieren 4 von 5 Testfischen richtig.“ | ja |
| `test-better` | „Der Baum der Tiefe 3 erreicht bei den Testfischen eine höhere Genauigkeit als Tiefe 1.“ | nein |
| `perfect-proof` | „Weil Tiefe 3 alle Trainingsfische richtig einordnet, wird er auch neue Fische sicher besser einordnen.“ | nein |

Button per gemeinsamer Komponente: **„Frage 1 prüfen“**. Rückmeldung direkt darunter, `role=status`, `aria-live=polite`. Die Komponente `addQuizQuestionChecks` darf für diese eigenständige Vergleichsfrage erneut instanziiert werden; ihre Nummerierung ist lokal zu diesem Block.

Spezifische Rückmeldungen (mit Komponentenergebnis `correct`/`missing`/`mixed`/`wrong`/`empty`; bei `missing` und `mixed` gibt die gemeinsame Komponente ihre Standard-Einleitung aus, danach folgt der hier angegebene Hint):

- korrekt / `success`: **„Richtig. Die Trainingsfehler sinken von 3 auf 0; die Testgenauigkeit bleibt bei allen drei Bäumen bei 4 von 5.“**
- teilweise korrekt / `missing`: **„Vergleiche auch die Testspalte: Ist dort bei größerer Tiefe ein zusätzlicher Fisch richtig?“**
- teilweise korrekt / `mixed`: **„Prüfe die Aussage über neue Fische: Folgt sie wirklich aus den Trainingsfehlern und diesen fünf Testfischen?“**
- noch nicht korrekt / `wrong`: **„Trainingsfehler und Testgenauigkeit sind verschiedene Ergebnisse. Lies beide Spalten für Tiefe 1 und Tiefe 3 noch einmal.“**
- leer / `empty`: **„Kreuze mindestens eine Aussage an.“**

Hinweis für Builder: `addQuizQuestionChecks` bietet `hint` als Funktion der angekreuzten Werte, `success` und `check` mit `{result,text}`. Die obigen vollständigen Texte sollen je Ergebnis erscheinen; keine generische Rückmeldung, die eine Fehlvorstellung unkommentiert lässt. Feedback darf die richtige Kombination bei einem Fehlversuch nicht vollständig aufzählen. Anpassung nur in `task4.mjs`, nicht in der gemeinsamen Komponente.

Merksatz, nach richtigem Vergleich sichtbar und persistent: **„Merke: Mehr Baumtiefe kann Trainingsfehler verringern. Sie garantiert aber keine höhere Genauigkeit bei unbekannten Daten. Hier bleiben alle drei Bäume bei 4 von 5 richtigen Testfischen.“**

Ausblick direkt darunter: **„Fünf Testfische sind eine kleine Grundlage für die Modellwahl. Vergleiche die Baumtiefen mit mehr bisher unbenutzten Fischen. Wenn du danach eine Tiefe auswählst, prüfe den gewählten Baum abschließend mit weiteren Fischen, die du für diese Wahl noch nicht verwendet hast.“**

Freitext-Überschrift: **„Beschreibe und entscheide vorläufig“**.

Freitext-Auftrag (drei kurze Stichpunkte oder drei Sätze, Operatoren fett):

1. **„Beschreibe, wie sich die Trainingsfehler von Tiefe 1 bis 3 verändern.“**
2. **„Vergleiche die Genauigkeit bei den fünf Testfischen.“**
3. **„Entscheide vorläufig, welche Tiefe du wählen würdest, und begründe deine Wahl mit beiden Ergebnissen.“**

Hilfen für diese neue Entscheidung, unter dem Freitext als bestehende `fish-help-details` (erst auf Wunsch sichtbar):

- Hilfe 1, Titel **„Hilfe 1: Vergleiche beide Spalten.“** Text: **„Lies die Trainingsfehler und die Testgenauigkeit jeweils von Tiefe 1 bis 3 ab.“**
- Hilfe 2, Titel **„Hilfe 2: Prüfe den Zugewinn.“** Text: **„Welcher tiefere Baum ordnet mehr Testfische richtig ein als Tiefe 1?“**
- Hilfe 3, Titel **„Hilfe 3: Begründe deine vorläufige Wahl.“** Text: **„Bei allen drei Tiefen sind 4 von 5 Testfischen richtig. Du kannst daher den einfacheren Baum vorläufig wählen; begründe auch, warum die fünf Fische für eine endgültige Wahl nicht reichen.“**

Im Freitext akzeptieren: Tiefe 1 aus Sparsamkeit bei gleicher beobachteter Testgenauigkeit **oder** eine andere Tiefe mit nachvollziehbarem, ausdrücklich vorläufigem Grund und korrekter Einordnung der unveränderten Testgenauigkeit. Tiefe 3 darf nicht allein wegen null Trainingsfehlern als nachweislich beste Wahl gelten. Nicht verlangen, dass Schülerinnen und Schüler den Begriff „Überanpassung“ verwenden.

`DEPTH_NOTE` nach Freitextprüfung ersetzen durch: **„Die Trainingsfehler sinken bei größerer Tiefe, die Genauigkeit auf diesen fünf Testfischen bleibt jedoch gleich. Daraus folgt keine sichere Rangfolge für neue Fische; die Modellwahl bleibt vorläufig.“** Falls die Antwort zu kurz ist oder der Skriptserver nicht erreichbar, bleibt dieser Lernhinweis gleichwohl im Lernabschnitt erreichbar und wird nicht nur als Fehlertext eingeblendet.

Freitext-Feedback bei regelbasierter Korrektur, sinngemäße Schreibweisen technisch anerkennen:

- 3 Punkte / korrekt: **„Du vergleichst Training und Test und begründest eine vorläufige Modellwahl ohne aus den Trainingsfehlern einen sicheren Vorteil für neue Fische abzuleiten.“**
- 1–2 Punkte / teilweise korrekt: **„Ein Teil deines Vergleichs stimmt. Ergänze die fehlende Spalte oder erkläre, warum die Wahl mit nur fünf Testfischen vorläufig bleibt.“**
- 0 Punkte / noch nicht korrekt: **„Vergleiche zuerst die Trainingsfehler und dann die Testgenauigkeit aller drei Tiefen. Prüfe anschließend deine Begründung für die Modellwahl.“**

### Letzter Reiter: Abschlussquiz

Reitertitel **„Abschluss“**, Überschrift **„Das nimmst du mit“**, Einführung: **„Prüfe, was die Fischdaten über Baumtiefe und Genauigkeit zeigen. Bei jeder Frage können mehrere Aussagen richtig sein.“**

Quizfrage 1, Legende: **„Was zeigen die Ergebnisse der drei Bäume?“**

| Wert | Aussage | Richtig |
| --- | --- | --- |
| `q1-train` | „Die Zahl falsch eingeordneter Trainingsfische sinkt von 3 über 1 auf 0.“ | ja |
| `q1-test` | „Alle drei Bäume erreichen bei den fünf Testfischen 80 % Genauigkeit.“ | ja |
| `q1-deep` | „Tiefe 3 erreicht hier eine höhere Testgenauigkeit als Tiefe 1.“ | nein |
| `q1-perfect` | „Tiefe 3 ordnet alle fünf Testfische richtig ein.“ | nein |

Quizfrage 2, Legende: **„Was folgt aus dem Vergleich?“**

| Wert | Aussage | Richtig |
| --- | --- | --- |
| `q2-no-guarantee` | „Mehr Baumtiefe garantiert keine höhere Genauigkeit bei unbekannten Daten.“ | ja |
| `q2-simple` | „Bei gleicher beobachteter Testgenauigkeit ist Tiefe 1 eine vorläufig begründbare Wahl.“ | ja |
| `q2-overfit` | „Die fünf Testfische beweisen, dass Tiefe 3 überangepasst ist.“ | nein |
| `q2-best` | „Tiefe 3 ist sicher die beste Wahl, weil dort keine Trainingsfehler auftreten.“ | nein |

Quizfrage 3, Legende: **„Wie prüfst du eine Tiefenwahl verlässlicher?“**

| Wert | Aussage | Richtig |
| --- | --- | --- |
| `q3-more` | „Vergleiche die Tiefen mit mehr bisher unbenutzten Fischen.“ | ja |
| `q3-final` | „Prüfe den danach gewählten Baum abschließend mit weiteren Fischen, die bei der Wahl nicht verwendet wurden.“ | ja |
| `q3-train` | „Nimm die fünf Testfische zum Training hinzu und bewerte den Baum anschließend nur mit diesen Fischen.“ | nein |
| `q3-five` | „Fünf Testfische reichen immer für eine endgültige Entscheidung.“ | nein |

Alle drei Fragen haben mehrere richtige Antworten. `addQuizQuestionChecks` erzeugt je Frage **„Frage N prüfen“** und Rückmeldung direkt darunter. Gemeinsamer Button **„Quiz auswerten“** bleibt. Bei einzeln vollständig richtig geprüften drei Fragen automatisch denselben Auswertungspfad wie der gemeinsame Button auslösen (`onAllCorrect` → `requestSubmit`). Die Auswertung darf die vorhandene Übersicht freigeben, aber nie den Lehrercode-Download sperren.

Rückmeldungen für alle Quizfragen: `empty` **„Kreuze mindestens eine Aussage an.“**; `missing` beginnt **„Teilweise korrekt. Deine Kreuze stimmen, aber es fehlt noch mindestens eine richtige Antwort.“**; `mixed` beginnt **„Teilweise korrekt. Mindestens ein Kreuz ist nicht richtig.“**; `wrong` beginnt **„Noch nicht korrekt.“**. Ergänze pro Frage folgende **wörtliche** Hint-/Erfolgssätze (bei allen nicht korrekten, nicht leeren Zuständen anhängen):

| Frage | Erfolgssatz | Hintsatz |
| --- | --- | --- |
| 1 | „Richtig. Nur die Trainingsfehler sinken; die Testgenauigkeit bleibt dreimal bei 80 %.“ | „Lies die Werte der Trainingsspalte und der Testspalte getrennt ab.“ |
| 2 | „Richtig. Gleiche Testgenauigkeit erlaubt eine vorläufige Wahl, beweist aber weder die beste Tiefe noch Überanpassung.“ | „Unterscheide einen beobachteten Gleichstand von einem Beweis über weitere Fische.“ |
| 3 | „Richtig. Mehr getrennte Daten helfen bei der Wahl; ein weiterer unabhängiger Test überprüft den gewählten Baum.“ | „Fische, mit denen du trainierst oder die Tiefe auswählst, sind kein unabhängiger Abschlusstest.“ |

Gemeinsame Auswertung: 3 richtig **„Richtig. Du unterscheidest Training und Test und kannst die Baumtiefe nur vorläufig beurteilen.“**; 1–2 richtig **„Teilweise korrekt. Prüfe die Fragen mit der Rückmeldung direkt darunter noch einmal.“**; 0 richtig **„Noch nicht korrekt. Vergleiche Trainingsfehler, Testgenauigkeit und die Größe der Testgruppe erneut.“** Die Auswertung gibt nicht alle richtigen Antworten beim ersten Fehlversuch preis.

Nach richtiger Gesamtauswertung kurze, im selben Reiter eingeblendete und persistent wiederherstellbare Übersicht mit zwei Einträgen (nicht als neuer Reiter): **„4.1 – Tiefe 1: Der Baum teilt nach der Schuppenfarbe; 3 von 9 Trainingsfischen werden falsch eingeordnet.“** und **„4.2 – Tiefenvergleich: Trainingsfehler 3, 1, 0; Testgenauigkeit jeweils 4 von 5 = 80 %. Mehr Tiefe brachte bei diesen Testfischen keinen Zugewinn.“** Darunter Merksatz und Ausblick aus Abschnitt 4 wiederverwenden, nicht neu formulieren. Die freiwillige Vertiefung 4a hat kein geprüftes Ergebnis und gehört daher nicht in diese Ergebnisübersicht.

## 5. Bewertungslogik, Speicher und Sicherungsblatt

- `apps-script/Tasks.gs`: ausschließlich Konfiguration `11-4-2` anpassen: Titel, `instruction`, `program`, `expectedAspects` gemäß neuem Dreischritt. Erwartete Aspekte: (1) Trainingsfehler sinken 3→1→0, (2) Testgenauigkeit bleibt 80 % bzw. 4/5, (3) begründete **vorläufige** Wahl mit Einordnung der kleinen Testgruppe und ohne Behauptung eines gesicherten Testvorteils. Andere Aufgaben und fremde, bereits vorhandene Änderungen unverändert erhalten.
- `apps-script/Rules.gs`: ausschließlich `evaluateFishDepthDevelopmentByRules_` anpassen. Dritter Punkt darf nicht an „Tiefe 3 wegen 0 Trainingsfehlern“ gebunden sein. Eine Wahl von Tiefe 1 wegen Einfachheit und gleicher Testquote soll 3 Punkte erreichen; andere fachlich begründete, ausdrücklich vorläufige Wahl kann ebenso 3 Punkte erreichen. Eine Antwort „Tiefe 3 ist sicher besser, weil alle Trainingsfische richtig sind“ erhält diesen Punkt nicht; auch eine Behauptung steigender Testgenauigkeit muss als Fehler erkannt werden. Keine reine Schlüsselwortpflicht für „Validierung“ oder „Überanpassung“. Die semantische Korrektur darf gute alternative Begründungen nicht durch starre Regeln abwerten.
- `apps-script/tests/aufgabe4-rules.test.js`: bisherige Positiverwartung für Tiefe 3 wegen Trainingsfehlern ersetzen. Mindestens Positivfälle für Tiefe 1 mit Vorläufigkeit sowie eine andere schlüssige vorläufige Wahl; Negativfälle für „Tiefe 3 sicher besser durch null Trainingsfehler“ und „Testgenauigkeit steigt“. Bestehende 11-4-1- und 11-4-3-Tests beibehalten. `Config.gs` und `code-routing.test.js` nicht ändern, weil weder neue Aufgaben-ID noch neue Seite.
- `task4.mjs`: persistierte Felder um Vergleichs- und Quizcheckboxen, Fortschritt/Sichtbarkeit des Merksatzes und die freigegebene Ergebnisübersicht erweitern. Bei jedem `change` speichern; beim Start **nach Listenerregistrierung** wiederherstellen. `localStorage` in `try/catch`, Daten vor Verwendung validieren. Bisherige Text- und Tabelleneingaben müssen mit demselben Schlüssel erhalten bleiben. Neuer Reiter ebenso wiederherstellen. Bereits vorhandene Lehrercode-Funktion weiterverwenden und bei Verschiebung ihre Selektoren prüfen.
- Vorhandenes Sicherungsblatt `sicherungsblatt-aufgabe-4-loesungen.tex/.pdf` ist bereits erstellt und wird nur in seinem Merkkasten korrigiert, damit es das neue Fazit nicht als endgültige Tiefenwahl darstellt. Statt des bisherigen Schlusses nach „80 %“ wörtlich: **„Mehr Baumtiefe garantiert keine höhere Genauigkeit bei unbekannten Daten. Bei diesen fünf Testfischen sind alle drei Bäume gleich genau; deshalb ist der einfachere Baum der Tiefe 1 eine vorläufig begründbare Wahl. Für eine belastbarere Entscheidung vergleicht man die Tiefen mit mehr bisher unbenutzten Fischen und prüft den gewählten Baum anschließend mit weiteren, bei der Wahl nicht verwendeten Fischen.“** Bestehende Gestaltung und übrige Beispiele behalten. PDF aus `.tex` neu bauen, jede Seite als Bild rendern und visuell prüfen; nur `.tex` und `.pdf` produktiv ändern. Kein neuer Lehrercode und keine Änderung an `lehrercodes-dekodierung.*`.

## 6. Erlaubte Zieldateien und Umsetzung

Produktive Änderungen nur an:

1. `faecher/informatik/klasse-11/1-Kuenstliche-Intelligenz/aufgabe4.html`
2. `faecher/informatik/klasse-11/1-Kuenstliche-Intelligenz/entscheidungbaeume/ui/task4.mjs`
3. `faecher/informatik/klasse-11/1-Kuenstliche-Intelligenz/entscheidungbaeume/task4.css` (nur falls für die neuen Blöcke erforderlich; dann CSS-Cache-Buster im HTML anheben)
4. `faecher/informatik/klasse-11/1-Kuenstliche-Intelligenz/entscheidungbaeume/tests/task4.test.mjs` (gezielt an vier Tabs, MC, Persistenz, Download-Zugänglichkeit und neue Lernhinweise anpassen)
5. `apps-script/Tasks.gs` (nur `11-4-2`, fremde Änderungen erhalten)
6. `apps-script/Rules.gs` (nur Bewertungsfunktion für `11-4-2`)
7. `apps-script/tests/aufgabe4-rules.test.js`
8. `faecher/informatik/klasse-11/1-Kuenstliche-Intelligenz/sicherungsblatt-aufgabe-4-loesungen.tex`
9. zugehöriges `sicherungsblatt-aufgabe-4-loesungen.pdf`

Keine Änderung an `fish-depth.mjs`, `fish-learning.mjs`, CSVs, externer ENTER-Seite, Menüs (Aufgabe 4 ist schon verlinkt), Präsentation, `Config.gs`, `code-routing.test.js`, anderen Aufgaben oder gemeinsamem `quiz-fragen-pruefen.js`. Die bereits vorhandenen fremden Arbeitsstände in diesen und weiteren Dateien unverändert lassen. Ein lokaler Apps-Script-Quelltext-Änderung erfordert für wirksame Onlinebewertung später Übernahme und neue Bereitstellung durch die verantwortliche Lehrkraft; diese Veröffentlichung ist nicht Teil des Baus.

Implementierungsreihenfolge: (1) HTML-Reihenfolge und letzter Reiter, (2) lokale Checkbox-/Quizbindung und Persistenz, (3) Rubrik und Regel, (4) Sicherungsblatt-Text/PDF, (5) gezielte Tests und Browserprüfung. Keine breit angelegte Umstrukturierung.

## 7. Akzeptanzkriterien – regelbasierte Vorprüfung

- Unveränderte Daten: `FISH_DEPTH_RESULTS` liefert Tiefen 1/2/3 mit Trainingsfehlern 3/1/0 und Testgenauigkeit 80/80/80; CSV-Dateien unverändert.
- `aufgabe4.html` hat genau vier Reiter in Reihenfolge `task41`, `task42`, `task4a`, `task4abschluss`. `#final-quiz` befindet sich im letzten Reiter; dort genau eine Sicherungsblatt-Downloadkomponente. Download ist ohne erledigte Aufgabe/Quiz erreichbar, Link erst nach `M8TR-DP7H` sichtbar. HTML-IDs eindeutig.
- Vergleichsfrage steht im DOM zwischen `#depth-table-form` und Freitextfeld `#depth-description-answer`. Für Vergleich und alle drei Abschlussfragen Checkboxen und je eigener Prüfen-Button mit eigener `aria-live`-Rückmeldung direkt darunter; gemeinsamer „Quiz auswerten“-Button bleibt. In mindestens zwei Abschlussfragen mehrere richtige Antworten (hier drei). `quiz-fragen-pruefen.js` wird eingebunden und `addQuizQuestionChecks` genutzt.
- Bestehende drei CSV-Downloadlinks, ENTER-Link, Datenschutzsatz, `11-4-1` und `11-4-2`, Navigation zurück zur Klassenübersicht und Startseite, `lang=de`, UTF-8, Responsivität/Fokus/Labels bleiben. Keine neuen Aufgaben-IDs.
- Sichtbarer Vergleich: In Fehlerfällen wird nicht automatisch die vollständige Lösung verraten. Korrekte Vergleichsfrage zeigt Merksatz/Ausblick; nach Neuladen bleiben sichtbare Blöcke, alle Checkboxen und Eingaben erhalten. Der neue Reiter und Quiz-Ergebnisübersicht werden wiederhergestellt. Speicherfehler oder ungültige gespeicherte Werte legen die Seite nicht lahm.
- Bestehenden Test `entscheidungbaeume/tests/task4.test.mjs` an vier Reiter und neue Struktur anpassen; seine derzeitige `Hilfe 3`- und `depth-learning-note`-Annahme nicht blind beibehalten. `apps-script/tests/aufgabe4-rules.test.js` deckt neue gültige/ungültige Wahlbegründungen ab. `node --check` für betroffene `.mjs`/`.js`, beide gezielten Tests und `git diff --check` ohne Fehler.
- Sicherungsblatt-PDF lässt sich öffnen; PDF wurde gerendert und auf Überlauf, Seitenzahl und Lesbarkeit geprüft. Lehrercode stimmt mit vorhandenem Dekodier-PDF überein; keine Codeänderung.
- Browser: echte DOM-Interaktionen für Vergleich/Quiz in Zuständen korrekt, fehlende Kreuze, gemischte und falsche Auswahl; automatische Gesamtauswertung nach drei Einzelerfolgen; Persistenz jeder Eingabeart und des aktiven Reiters ohne vorheriges Prüfen nach Seitenwechsel; Merksatz/Ergebnis nach Neuladen; Download ohne Quiz; Desktop, 768 px und 390 px ohne störendes horizontales Scrollen. Kein optionaler weiterer Testbau ohne konkreten Defekt.
- `git status` zeigt an produktiven Änderungen nur die neun erlaubten Dateien; bereits vorhandene Fremdänderungen bleiben erhalten. Kein eigenständiges Wiederholungsquiz, keine Quizpräsentation.

## 8. Akzeptanzkriterien – fachlich-didaktische Endabnahme

- Die Gegenüberstellung wird tatsächlich vor der offenen Entscheidungsfrage bearbeitet: Training verbessert sich, **diese** Testgenauigkeit nicht. Lernende können die beiden Aussagen sprachlich trennen.
- Kein Text oder Feedback behauptet, Tiefe 3 sei wegen null Trainingsfehlern sicher besser; kein Text behauptet belegte Überanpassung oder einen gemessenen Rückgang der Testgenauigkeit. Gleiche Testquote wird nicht mit identischen Fehlklassifikationen verwechselt.
- Modellwahl ist ausdrücklich **vorläufig**. Tiefe 1 als einfacherer Baum ist bei beobachtetem Gleichstand eine begründbare Wahl; eine andere bewusst begründete Wahl wird nicht allein wegen ihrer Tiefe abgewertet. Fünf Testfische sind als kleine Grundlage erkennbar.
- Der Ausblick trennt die Daten zur Wahl der Tiefe von den weiteren Daten für einen abschließenden unabhängigen Test, ohne neue Fachbegriffe als Voraussetzung einzuführen. Quizfrage 3 prüft nur bereits zuvor erklärte Inhalte.
- Feedback greift die naheliegende Fehlvorstellung „null Trainingsfehler = nachweislich beste Vorhersage“ konkret auf. Es unterscheidet korrekt, teilweise korrekt und noch nicht korrekt und nennt beim ersten Fehler nicht die gesamte Lösung.
- Aufgaben und Hilfen sind kurz, altersgerecht und handlungsorientiert. Der Merksatz ist klarer als der bisherige allgemeine `DEPTH_NOTE`. Sicherungsblatt, Quiz, Freitext-Rubrik und Regelauswertung vertreten denselben fachlichen Kern.
- Die optionale Vertiefung 4a bleibt optional; der Abschluss ist ohne sie zugänglich. Die Gestaltung folgt den vorhandenen Fischseiten und ist auf Smartphone bedienbar.

## 9. Aufwand

Gezielte Erweiterung vorhandener Komponenten und kleine Rubrikkorrektur; Standard-Builder **GPT-6 Luna (high)** reicht aus. Nur bei wiederholten Fehlern in der Quiz-/Speicherlogik auf GPT-6 Sol wechseln. Höchstens drei Bau/Vorprüfungs-Runden und zwei Endabnahmen.
