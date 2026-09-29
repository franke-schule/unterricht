# Verbindliche Spezifikation: Aufgabe 6 – Perzeptron implementieren

**Stand:** 28. September 2026
**Umfang:** Planung; keine Implementierung. Diese Spezifikation ist die Eingabe für Bau, regelbasierte Vorprüfung und fachliche Endabnahme. Schülertexte in Anführungszeichen sind wörtlich zu übernehmen.

## 1. Quellen und Entscheidungen

Gelesene Regeln: `AGENTS.md`, `manifest-allgemein.txt`, `manifest-online-ide-programmieraufgaben.txt`, `manifest-quizaufgaben.txt`. Für Aufgabe 6 wird kein Sicherungsblatt erstellt; damit entstehen weder Lehrercode noch PDF. Ein zusätzliches Wiederholungs-Quiz ist nicht beauftragt.

| Zweck | Konkrete Referenz |
| --- | --- |
| Fachlicher Lernkern, Farben, Karten, gestufte Hilfen, Speicherung und Zusammenfassung | `faecher/informatik/klasse-11/1-Kuenstliche-Intelligenz/aufgabe5.html`, `perzeptron/task5.css`, `perzeptron/ui/task5.mjs` |
| Trainingsdaten und Erwartungswerte | `faecher/informatik/klasse-11/1-Kuenstliche-Intelligenz/perzeptron/data/Trainingsdaten_Tiere.csv`, `perzeptron/logic/perceptron.mjs` |
| Schüler- und Lösungsfassung | `faecher/informatik/klasse-11/1-Kuenstliche-Intelligenz/material-perzeptron/Perzeptron_Java_BlueJ-Variante-einfach/{Perzeptron,Datenpunkt}.java` und `Perzeptron_Java_BlueJ_Loesung/{Perzeptron,Datenpunkt}.java` |
| Mehrere Java-Dateien und Startanleitung in der IDE | `faecher/informatik/klasse-9/3-Modellierung-und-Programmierung-Online-IDE/aufgabe2.html` |
| IDE-Dateizugriff und Code-POST mit JSONP-Ergebnisabfrage | `faecher/informatik/klasse-10/2-Modellierung-und-Programmierung-Online-IDE/aufgabe2.html` |
| Beschreibe-Auswertung | `faecher/informatik/klasse-11/1-Kuenstliche-Intelligenz/perzeptron/ui/semantic-answer.mjs` und Aufgabe 5, Task `11-5-1` |
| Abschlussquiz | `faecher/informatik/klasse-10/1-Datenbanken/aufgabe1.html#final-quiz` und Quiz/Übersicht aus Aufgabe 5 |

**Wichtiger Serverbefund:** `apps-script/Gemini.gs` formuliert Codeauswertungen bisher ausdrücklich als Roboteraufgaben und fragt nach Wandkollisionen, Drehungen und Ziegeln. Neue `Tasks.gs`-Einträge allein liefern für das Perzeptron kein brauchbares Feedback. `buildCodePrompt_` bekommt deshalb eine allgemeine, durch Task-Daten konfigurierbare Variante für beliebige künftige Programmierkontexte; für vorhandene Roboter-Tasks bleibt der bisherige Prompt erhalten.

**Fachliche Referenz:** `punktKlassifizieren` bildet eine `double`-Summe und liefert bei `a >= theta` den Wert 1, sonst 0. `trainieren` bildet dieselbe Summe für einen `Datenpunkt`, bestimmt `delta = Label − Ausgabe`, ändert bei `delta = 1` beide Gewichte um `+ lernrate · Eingabe` und `theta` um `− lernrate`, bei `delta = −1` entsprechend umgekehrt; bei `delta = 0` bleibt alles unverändert. Funktional gleichwertig ist die allgemeine Delta-Formel. Das `int` der gewichteten Summe in der einfachen BlueJ-Vorlage ist ein fachlicher Typfehler für Dezimalwerte und wird im Schüler-Startstand zu `double`. Die überzähligen und uneinheitlich nummerierten BlueJ-Kommentare werden bereinigt, ohne die fachlichen Lücken vorwegzunehmen.

## 2. Lernziel und Lernweg

Nach Aufgabe 5 übertragen die Lernenden die bekannte Perzeptron-Rechnung in Java. Sie können `punktKlassifizieren` als Berechnung und Entscheidung erklären, die Schritte von `trainieren` implementieren und am Programmlauf prüfen, wie ein gelabelter Datenpunkt Gewichte und Schwellenwert verändert. Die einfache und die schwere Variante haben dasselbe Ziel und dasselbe Abschlussquiz. Fachbegriffe und Formeln sind aus Aufgabe 5 bekannt; Aufgabe 6 festigt sie an einem konkreten Programmlauf und wendet sie erst danach im Code an.

Reihenfolge: Beispiel starten und Ausgabe beobachten → vorhandene Klassifikationsmethode verstehen → Training implementieren → mit verschiedenen Datenpunkten prüfen → Zusammenfassung und Abschlussquiz. Die Varianten sind alternative Wege, keine hintereinander freizuschaltenden Stufen. Beschreibung und Quiz dürfen auch bei unvollständigem Code erreichbar bleiben.

## 3. Seite, IDE und Zustand

- Zielseite: `faecher/informatik/klasse-11/1-Kuenstliche-Intelligenz/aufgabe6.html`. Der Button für Aufgabe 6 folgt in `faecher/informatik/klasse-11/index.html` unmittelbar auf Aufgabe 5; Linkziel ist dieselbe Seite.
- Beim Öffnen steht vor dem Arbeitsbereich eine Wahl „Einfach“ oder „Schwer“. Danach links die vorhandene eingebettete Online-IDE, rechts die gemeinsame Beschreibe-Aufgabe und darunter die zur Variante gehörenden Aufgaben bzw. Hilfen. Auf schmalen Bildschirmen folgt die rechte Spalte unter der IDE. Zusammenfassung und `#final-quiz` stehen nach dem Arbeitsbereich; das Quiz ist das letzte Lern-Element.
- Ein IDE-Workspace je Variante, mit stabilen, unterschiedlichen IDs `Java11Aufgabe6Einfach` und `Java11Aufgabe6Schwer`. Beide enthalten `Anleitung` als anfänglich sichtbaren IDE-Hinweis sowie `Hauptprogramm.java`, `Perzeptron.java` und `Datenpunkt.java`. Die Dateien werden wie in Informatik 9, Aufgabe 2 eingebettet; `enableFileAccess` erlaubt das Lesen von `Perzeptron.java` für das Feedback. Inaktive IDE samt Bedienelementen ist ausgeblendet und nicht fokussierbar. Ein Variantenwechsel darf keinen Workspace neu initialisieren oder überschreiben.
- `Datenpunkt.java` bewahrt den Konstruktor, zwei `double`-Eingaben, das `int`-Label und die drei Getter. `Perzeptron.java` bewahrt Attribute, Konstruktor, `punktKlassifizieren`, `trainieren` und `trenngeradeAusgeben`. BlueJ-Dateien wie `.ctxt`, `.class` und `package.bluej` werden nicht geladen. Die Lösung wird nicht als sichtbare Schülerdatei eingebettet.
- `Hauptprogramm.java` benutzt die vier Trainingspunkte aus Aufgabe 5 in der dortigen Reihenfolge `(2|2, 1)`, `(4|1, 0)`, `(6|2, 0)`, `(0|4, 1)` mit Startwerten `w₁ = 1`, `w₂ = 1`, `theta = 1`, `lernrate = 1`. Es zeigt mindestens eine Klassifikation vor und nach dem Training und die Trenngerade, sodass ein erneuter Start eine Veränderung erkennbar macht. Der Startstand beider Varianten muss auch mit noch unvollständiger Trainingsmethode im vorhandenen Interpreter kompilieren und starten. Falls die IDE einzelne BlueJ-Ausgabeaufrufe nicht unterstützt, nur diese Aufrufe für die IDE anpassen und im Browser verifizieren.
- Einfach: `trainieren` enthält die Lücken der BlueJ-Vorlage: gewichtete Summe, Ausgabe in beiden Zweigen und Parameteranpassung für beide Fehlerzeichen. Die vorhandene Delta-Berechnung bleibt sichtbar. Der Summentyp ist bereits `double`, sein Wert ist zunächst ein kompilierbarer Platzhalter. Die unvollständige Methode darf fachlich falsch rechnen, aber keine Syntaxfehler enthalten.
- Schwer: Dieselbe öffentliche Klassenoberfläche, aber ein syntaktisch leerer Methodenrumpf von `trainieren(Datenpunkt punkt)`. Keine Teilschritte der Lösung stehen dort. `punktKlassifizieren` bleibt vollständig vorhanden.
- Die Online-IDE speichert Code anhand der unterschiedlichen IDs. Die Seite speichert Variante, Beschreibung, Quiz-Auswahl und Quiz-Übersicht unter einem eigenen versionierten Schlüssel `informatik11-ki-aufgabe6-v1` bei jeder Änderung. Speicherung und Wiederherstellung sind fehlertolerant. Beim Neuöffnen und beim Wechsel sind beide Code-Stände unabhängig erhalten. Ein etwaiger Zurücksetzen-Button braucht eine ausdrückliche Bestätigung und benennt klar, welchen Stand er löscht.
- Gestaltung: `styles.css` und die passenden Regeln aus `perzeptron/task5.css` wiederverwenden; nur IDE- und Variantenlayout lokal in `perzeptron/task6.css` ergänzen. IDE-/Aufgabenspalten aus Informatik 10 Aufgabe 2 übernehmen. Reiter sind hier nicht nötig. Die Seite hat `lang="de"`, UTF-8, H1, Rückweg zur Klassenübersicht, Startseitenlink, klare Fokusmarkierung, sichtbare Labels und `aria-live="polite"` für dynamische Meldungen.

## 4. Verbindliche Schülertexte

### Einstieg und Anleitung

- H1: „Aufgabe 6 – Perzeptron implementieren“
- Kurzer Arbeitsauftrag über der IDE: „Untersuche zuerst, wie das vorhandene Perzeptron Punkte klassifiziert. Implementiere danach das Training in der einfachen oder schweren Variante und prüfe deinen Code mit Beispielpunkten.“
- Wahl: „Wähle deinen Weg. Beide Varianten führen zum selben Ziel; dein Code bleibt beim Wechsel getrennt gespeichert.“
- Buttons: „Einfach – mit Hilfen“ und „Schwer – selbstständig“; Wechselknopf: „Variante wechseln“.
- Status: „Deine Eingaben und beide Code-Stände werden in diesem Browser gespeichert.“
- IDE-Anleitung in **beiden** Workspaces, als anfänglich sichtbarer Hinweis:
  1. „Starte `Hauptprogramm.java` und beobachte die Ausgabe.“
  2. „Beschreibe, wie `punktKlassifizieren` aus zwei Eingaben 0 oder 1 bestimmt.“
  3. „Ergänze `trainieren`, starte das Programm erneut und prüfe die Veränderung.“
- Datenschutz unter der ersten Server-Aufgabe: „Gib keine Namen oder anderen personenbezogenen Daten ein. Deine Beschreibung und der aktuelle Inhalt von `Perzeptron.java` werden zur automatischen Auswertung an den Skriptserver und ein KI-System übertragen.“

### Gemeinsame Beschreibe-Aufgabe

- Titel: „1. Vorhandenen Code erklären“
- Arbeitsauftrag: „**Beschreibe** in eigenen Worten, wie `punktKlassifizieren` aus `x_1` und `x_2` eine Ausgabe berechnet. Erkläre auch, wann die Methode 1 statt 0 zurückgibt und ob sie die Gewichte verändert.“
- Label: „Deine Beschreibung“; Button: „Beschreibung überprüfen“.

Für diese gemeinsame Beschreibe-Aufgabe sind keine aufklappbaren Hilfen vorgesehen. Die Hilfestufen der einfachen Variante beziehen sich auf die drei Code-Aufgaben; zum Training der schweren Variante stehen die Implementierungsbeschreibung und die Formelsammlung neben der IDE.

### Einfache Variante: nummerierte Code-Aufgaben

Alle drei Aufgabenkarten stehen rechts neben der IDE und haben einen eigenen Prüfbutton mit Rückmeldung unmittelbar darunter. Hilfe 1 bis 3 sind pro Karte einzeln eingeklappte `details`-Bereiche; ein vierter, ebenfalls eingeklappter Bereich „Code-Schnipsel zum Sortieren“ folgt **am Ende der einfachen Aufgabenspalte**.

| Schritt und Button | Arbeitsauftrag | Hilfe 1 | Hilfe 2 | Hilfe 3 |
| --- | --- | --- | --- | --- |
| „2. Gewichtete Summe“ / „Code zu Schritt 2 prüfen“ | „**Ersetze** den Platzhalter für `gewichtete_Summe` durch die gewichtete Summe der beiden Eingabewerte von `punkt`.“ | „Beide Eingaben tragen zur Summe bei.“ | „Multipliziere jeden Eingabewert mit seinem passenden Gewicht und addiere die Produkte.“ | „Lies `x_1` und `x_2` über die Getter von `punkt`; speichere das Ergebnis als `double`.“ |
| „3. Ausgabe bestimmen“ / „Code zu Schritt 3 prüfen“ | „**Ergänze** beide Zweige der Treppenfunktion, damit `berechnete_ausgabe` bei Erreichen des Schwellenwerts 1 und sonst 0 enthält.“ | „Überlege, in welchem Zweig die Ausgabe 1 sein muss.“ | „Bei Gleichheit mit `theta` gehört der Punkt bereits zur Ausgabe 1.“ | „Setze `berechnete_ausgabe` im `>=`-Zweig auf 1 und im anderen Zweig auf 0.“ |
| „4. Parameter anpassen“ / „Code zu Schritt 4 prüfen“ | „**Ergänze** die Anpassung von `w_1`, `w_2` und `theta` für `delta = 1` und `delta = -1`. Bei `delta = 0` bleiben alle drei Werte unverändert.“ | „Nur ein Fehler verändert die Parameter.“ | „Bei `delta = 1` wachsen die Gewichte entsprechend den Eingaben und `theta` sinkt; bei `delta = -1` kehren sich die Vorzeichen um.“ | „Verwende bei jeder Änderung `lernrate` und die Getter von `punkt`. Prüfe besonders das Vorzeichen der Änderung von `theta`.“ |

Die letzte Hilfe hat wörtlich die Einleitung: „Diese Anweisungen gehören in `trainieren`, stehen aber nicht in der richtigen Reihenfolge. Kopiere nur die Zeilen, die du brauchst, und ordne sie an den passenden Stellen ein.“ Sie enthält **neun einzeln kopierbare Anweisungen** aus der BlueJ-Lösung: eine Summenberechnung, zwei Ausgabesetzungen, drei Aktualisierungen für `delta = 1`, drei für `delta = -1`. Präsentationsreihenfolge, bewusst inkorrekt: `w_2` für negatives Delta; Ausgabe 1; `theta` für positives Delta; Summe; `w_1` für positives Delta; Ausgabe 0; `theta` für negatives Delta; `w_2` für positives Delta; `w_1` für negatives Delta. Die Anweisungen werden erst beim Bau wörtlich aus der Lösung in die IDE-Syntax übertragen. Keine zusätzliche komplette Methode und keine automatisch sortierte Lösung zeigen.

### Schwere Variante

- Titel rechts: „2. Training selbst implementieren“
- Beschreibung: „**Implementiere** `trainieren(Datenpunkt punkt)` vollständig. Berechne zuerst die gewichtete Summe und daraus die Ausgabe 0 oder 1. Bestimme dann `delta` aus Label minus Ausgabe. Passe Gewichte und Schwellenwert mit der Lernrate an; bei `delta = 0` bleibt alles unverändert.“
- Button: „Meine Trainingsmethode prüfen“.
- Direkt darunter ein zunächst geschlossener `details`-Bereich mit `summary` „Formelsammlung anzeigen“. Inhalt wörtlich:
  - „Gewichtete Summe: a = w₁ · x₁ + w₂ · x₂“
  - „Ausgabe: f(a) = 1 für a ≥ θ, sonst 0“
  - „Fehler: δ = t − f(a)“
  - „Gewichte: wᵢ neu = wᵢ alt + δ · α · xᵢ“
  - „Schwellenwert: θ neu = θ alt − δ · α“
  - „Dabei ist t das Label des Datenpunkts und α die Lernrate.“

### Zusammenfassung und Abschlussquiz

Zusammenfassung **vor** dem Abschlussquiz, mit der vorhandenen `remember`-/Karten-Gestaltung:

- Titel: „Das Wichtigste im Code“
- „`punktKlassifizieren` berechnet eine gewichtete Summe, vergleicht sie mit `theta` und gibt 0 oder 1 zurück.“
- „`trainieren` vergleicht diese Ausgabe mit dem Label. Der Unterschied `delta` steuert die Parameteränderung.“
- „Bei `delta = 0` bleiben die Parameter unverändert. Sonst bestimmen Eingabewerte und Lernrate die Gewichtsänderung; der Schwellenwert wird mit umgekehrtem Vorzeichen angepasst.“
- „Eingaben, Gewichte, Lernrate und gewichtete Summe sind `double`; Label, Ausgabe und `delta` sind ganzzahlig.“

Quiz-Einleitung: „Kreuze alle richtigen Aussagen an. Bei manchen Fragen sind mehrere Antworten richtig.“ Button: „Quiz auswerten“. Fortschritt: „0 von 4 Fragen vollständig richtig“. Jede Frage verwendet Auswahlkästchen, nicht Radio-Buttons. Korrekte Optionen sind nur für die Implementierung markiert und nicht als Kennzeichnung in der Schüleransicht zu zeigen.

| Frage | Optionen in dieser Reihenfolge | Richtige Optionen | Erklärung bei der Auswertung |
| --- | --- | --- | --- |
| „1. Was macht `punktKlassifizieren`?“ | A „Die Methode multipliziert beide Eingaben mit ihren Gewichten.“ · B „Sie addiert die beiden Produkte.“ · C „Sie verändert die Gewichte bei jeder Klassifikation.“ · D „Sie gibt 1 zurück, wenn die Summe mindestens so groß wie `theta` ist.“ | A, B, D | „Die Methode berechnet die gewichtete Summe und vergleicht sie mit `theta`. Sie verändert keine Parameter.“ |
| „2. Welche Aussagen zum Training stimmen?“ | A „`delta` ist das Label minus die berechnete Ausgabe.“ · B „Bei `delta = 0` bleiben Gewichte und Schwellenwert unverändert.“ · C „Das Label des Datenpunkts wird überschrieben.“ · D „Die Lernrate beeinflusst die Größe der Anpassung.“ | A, B, D | „Das Label bleibt erhalten. Nur bei einem Fehler werden die Parameter angepasst; die Lernrate bestimmt die Schrittweite.“ |
| „3. Was gilt, wenn die gewichtete Summe genau `theta` entspricht?“ | A „Die Ausgabe ist 1.“ · B „Die Ausgabe ist 0.“ · C „`delta` ist unabhängig vom Label immer 0.“ · D „Die Gewichte werden sofort verändert.“ | A | „Der Vergleich verwendet `>=`. Bei Gleichheit ist die Ausgabe 1; erst das Label entscheidet über `delta`.“ |
| „4. Welche Änderungen gelten bei `delta = -1`?“ | A „Für jedes Gewicht gilt: neuer Wert = alter Wert − α · Eingabe.“ · B „`theta` wird um α erhöht.“ · C „Jedes Gewicht wird unabhängig von der Eingabe um genau 1 kleiner.“ · D „Das Label wird in 1 geändert.“ | A, B | „Bei `delta = -1` werden die gewichteten Lernschritte abgezogen und `theta` um α erhöht. Das Label wird nicht geändert.“ |

Wörtliche Quiz-Meldungen: korrekt je Frage „Richtig. Alle passenden Aussagen sind markiert.“; sonst „Noch nicht vollständig. Prüfe die Aussagen und versuche es erneut.“ Gesamterfolg „Alle vier Fragen sind vollständig richtig beantwortet.“; sonst „{Anzahl} von 4 Fragen sind vollständig richtig. Verbessere die markierten Fragen und prüfe erneut.“ Nach vier vollständig richtigen Fragen zeigt die bestehende Quiz-Übersicht Fragestellungen und richtige Optionen aller vier Fragen. Falsche Antworten bleiben bearbeitbar. Quiz-Auswahl und Freischaltung der Übersicht bleiben nach dem Seitenwechsel erhalten.

## 5. Skriptserver, Bewertungsmaßstäbe und Rückmeldungen

**Client:** Die Beschreibe-Aufgabe verwendet `evaluateSemanticAnswer` mit maximal 600 Zeichen, sinnvoller Mindestlänge wie in Aufgabe 5 und der vorhandenen 1800-Zeichen-URL-Prüfung. Code-Feedback liest mit `online_ide_access.getIDE(...).getFiles()` **nur den aktuellen Inhalt von `Perzeptron.java` des aktiven Workspaces** und sendet ihn als `requestType=code` per POST; danach wird das Ergebnis mit kurzer JSONP-Abfrage geholt. Nicht den Beispielcode aus `Hauptprogramm.java`, nicht beide Varianten zusammen und keine Codeübertragung über eine lange GET-URL verwenden. Die Grenze von 12.000 Zeichen aus `Config.gs` gilt. Jede Anfrage sperrt nur ihren eigenen Prüfbutton bis zu Erfolg, Fehler oder Timeout.

**Server:** In `Tasks.gs` kommen diese fünf IDs hinzu. `expectedAspects` benennt die genannten Kriterien einzeln, `maxPoints` entspricht ihrer Anzahl. Jede Codeaufgabe erhält `responseType: 'code'` sowie die optionalen, allgemein verwendbaren Felder `codeAnalysisContext` (Text) und `codeAnalysisRules` (Liste von Regeln). Die Bewertung bezieht sich ausschließlich auf die aktuelle Methode `trainieren`; die bereits fertige Methode `punktKlassifizieren`, Kommentare und das Beispielprogramm dürfen keine Punkte für fehlende Trainingsschritte erzeugen. Auch die einfache Summe-/Ausgabe-Aufgabe darf nicht für später noch offene Teilaufgaben abgewertet werden.

| Task-ID | Typ, Punkte | Erwartete Aspekte |
| --- | --- | --- |
| `11-6-klassifizieren` | Text, 4 | Eingaben werden mit den passenden Gewichten multipliziert; Produkte werden addiert; Summe wird einschließlich Gleichheit mit `theta` verglichen; Rückgabe ist 1 oder 0 ohne Änderung der Parameter. |
| `11-6-einfach-summe` | Code, 3 | Beide Werte über die passenden `Datenpunkt`-Getter; korrekt zugeordnete Produkte und Addition; Ergebnis als `double` ohne Abschneiden. |
| `11-6-einfach-ausgabe` | Code, 3 | Vergleich einschließlich Gleichheit; Ausgabe 1 im zutreffenden Zweig; Ausgabe 0 im anderen Zweig. |
| `11-6-einfach-anpassung` | Code, 5 | Beide Gewichte bei `delta = 1` mit Eingaben und Lernrate erhöhen; `theta` dann verringern; beide Gewichte bei `delta = -1` entsprechend verringern; `theta` dann erhöhen; bei `delta = 0` nichts ändern. |
| `11-6-schwer-trainieren` | Code, 6 | Gewichtete Summe ohne Ganzzahlverlust; Treppenfunktion mit `>=`; `delta = Label − Ausgabe`; beide Gewichte korrekt mit Eingaben und Lernrate anpassen; `theta` mit umgekehrtem Vorzeichen anpassen; bei `delta = 0` nichts ändern. |

Der Text-Task bekommt eine eigene `systemInstruction`, die sinngleiche Erklärungen anerkennt und bei Lücken Hinweise statt einer Musterlösung verlangt. Für Code werden alternative, funktional gleichwertige Implementierungen anerkannt: eine gemeinsame Delta-Formel statt zweier Zweige, sinnvolle Hilfsvariablen, Aufruf von `punktKlassifizieren` statt doppelter Berechnung und äquivalente Reihenfolgen ohne Verhaltensänderung. Die statische Analyse behauptet nie, den Code ausgeführt zu haben. Syntaxprobleme und fachliche Fehler werden getrennt benannt, soweit aus dem Text erkennbar. Anweisungen in Schülerkommentaren werden nicht als Bewertungsanweisungen befolgt.

**Änderung in `Gemini.gs`:** `buildCodePrompt_` nutzt für Tasks mit `codeAnalysisContext` und `codeAnalysisRules` eine allgemeine statische Codeanalyse. Fachkontext, verfügbare Befehle und besondere Regeln kommen ausschließlich aus den Task-Daten; es gibt keinen im Promptbau fest codierten Perzeptron-Zweig. Ohne diese Felder bleibt für die bestehenden Roboter-Tasks der bisherige Robot-Kontext und sein erwartetes Promptverhalten erhalten. Die Perzeptron-Tasks konfigurieren Java, `Datenpunkt`-Getter, `double`, Schwellenvergleich und Trainingsregel und enthalten keine Robot-, Wand-, Dreh- oder Ziegelkriterien. `Code.gs`, Transportformat und Rückgabeformat bleiben unverändert. `Config.gs` ergänzt die Seite in der Aufgabenliste. `apps-script/tests/code-routing.test.js` prüft die fünf Task-IDs, Text- und Code-Routing, einen weiteren künstlichen Programmierkontext als Nachweis der Wiederverwendbarkeit, den Perzeptron-Prompt ohne Robot-Inhalt sowie die unveränderte Roboter-Regression. Die neue Apps-Script-Version muss anschließend durch die verantwortliche Lehrkraft bereitgestellt werden; bis dahin kann der Online-Server die neuen IDs nicht auswerten.

**Wörtliche Standardmeldungen im Client:**

- Während Textanfrage: „Deine Beschreibung wird überprüft.“
- Während Codeanfrage: „Der aktuelle Stand von `Perzeptron.java` wird analysiert.“
- Zu kurze Beschreibung: „Beschreibe die Rechnung und die Entscheidung noch etwas genauer, damit deine Antwort sinnvoll ausgewertet werden kann.“
- IDE noch nicht bereit: „Die Online-IDE lädt noch. Bitte warte kurz und versuche es erneut.“
- Datei nicht gefunden: „`Perzeptron.java` wurde in dieser Variante nicht gefunden.“
- Code zu lang: „Dein Programmcode ist zu lang für die automatische Auswertung.“
- Server-Timeout: „Der Auswertungsserver hat nicht rechtzeitig geantwortet. Bitte versuche es erneut.“
- Server kennt Task noch nicht: „Für Aufgabe 6 ist noch keine aktuelle Serverversion bereitgestellt. Bitte informiere deine Lehrkraft.“

Die serverseitigen Meldungen erscheinen mit Punkten, Status, „Das ist dir gelungen“, „Das solltest du überprüfen“ und individuellem Text direkt unter der zugehörigen Aufgabe. Rückmeldungen müssen korrekt, teilweise korrekt und noch nicht korrekt unterscheidbar machen und auf den nächsten sinnvoll bearbeitbaren Schritt hinweisen. Als wörtliche Fallback-Texte, falls ein Ergebnis keinen eigenen Feedbacktext enthält:

| Aufgabe | Korrekt | Teilweise korrekt | Noch nicht korrekt |
| --- | --- | --- | --- |
| Beschreibung | „Du hast Rechnung, Vergleich und Rückgabewert passend erklärt.“ | „Die Grundidee stimmt. Ergänze den Vergleich mit `theta` oder erkläre den Rückgabewert genauer.“ | „Beschreibe zuerst die gewichtete Summe und anschließend die Entscheidung zwischen 0 und 1.“ |
| Summe | „Die gewichtete Summe berücksichtigt beide Eingaben ohne Ganzzahlverlust.“ | „Prüfe die Zuordnung beider Eingaben zu ihren Gewichten und den Datentyp.“ | „Beginne mit den beiden Produkten aus Eingabewert und Gewicht.“ |
| Ausgabe | „Die Ausgabe behandelt auch den Gleichheitsfall richtig.“ | „Prüfe den Vergleich und beide möglichen Ausgabewerte.“ | „Vergleiche zuerst die Summe mit `theta` und ordne danach 0 und 1 zu.“ |
| Anpassung | „Gewichte und Schwellenwert werden für beide Fehlerzeichen richtig angepasst.“ | „Prüfe Lernrate und Vorzeichen bei beiden Fehlerzeichen.“ | „Bestimme zuerst, wie ein positiver und ein negativer Fehler die Parameter ändern.“ |
| Schwere Methode | „Deine Trainingsmethode bildet Ausgabe, Fehler und Parameteränderung schlüssig ab.“ | „Ein Teil der Trainingsschritte stimmt. Prüfe den ersten noch fehlenden Schritt in der Rückmeldung.“ | „Beginne mit Summe, Schwellenvergleich und Fehler; danach kommen die Parameteränderungen.“ |

## 6. Fachliche Testfälle für die spätere Umsetzung

Diese Fälle prüfen das **Verhalten**, nicht einen bestimmten Wortlaut des Java-Codes. `punktKlassifizieren` und `trainieren` werden in beiden Workspaces sowie mit der umgesetzten Lösungsfassung geprüft. Ausgabe und Parameter müssen im IDE-Programmlauf nachvollziehbar sein.

| Fall | Vorher und Punkt | Erwartung |
| --- | --- | --- |
| Negativer Fehler | `w₁ = 1`, `w₂ = 1`, `theta = 1`, `α = 1`; `(x₁,x₂,t) = (4,1,0)` | `a = 5`, Ausgabe `1`, `δ = −1`; nachher `w₁ = −3`, `w₂ = 0`, `theta = 2`. |
| Positiver Fehler mit halber Lernrate | `w₁ = 0`, `w₂ = 0`, `theta = 1`, `α = 0,5`; `(2,2,1)` | `a = 0`, Ausgabe `0`, `δ = 1`; nachher `w₁ = 1`, `w₂ = 1`, `theta = 0,5`. |
| Kein Fehler | `w₁ = 1`, `w₂ = 1`, `theta = 1`, `α = 0,5`; `(2,2,1)` | `a = 4`, Ausgabe `1`, `δ = 0`; alle drei Parameter unverändert. |
| Nicht ganzzahlige Summe | `w₁ = 0,25`, `w₂ = 0,5`, `theta = 0,6`; Eingaben `(1,1)` | `a = 0,75`, Klassifikation `1`; ein `int`-Zwischenergebnis würde diesen Test verfehlen. |
| Gleichheit | `w₁ = 0,25`, `w₂ = 0,5`, `theta = 0,75`; Eingaben `(1,1)` | `a = theta`; Klassifikation `1`. Beim Training entscheidet anschließend das Label über `δ`. |
| Ganze Epoche aus Aufgabe 5 | Start `w₁ = w₂ = theta = α = 1`; vier Datenpunkte in der obigen Reihenfolge | Nach einem Durchlauf `w₁ = −3`, `w₂ = 4`, `theta = 1`. |

Zusätzlich prüfen: Beide unbearbeiteten Startstände kompilieren und starten; korrekter, teilweise korrekter und fehlerhafter Code erzeugen zum jeweiligen Task passende statische Rückmeldungen; absichtlich falsch sortierte Schnipsel führen nicht unbemerkt zu einer funktionierenden Lösung; ein Wechsel und Neuladen bewahrt beide unterschiedlichen Code-Stände; lange Antwort und langer Code werden verständlich abgefangen; Serverausfall, Timeout und unbekannte Task-ID bleiben vom fachlichen Urteil unterscheidbar.

## 7. Dateien und Implementierungsreihenfolge

**Neu:**

1. `faecher/informatik/klasse-11/1-Kuenstliche-Intelligenz/aufgabe6.html`
2. `faecher/informatik/klasse-11/1-Kuenstliche-Intelligenz/perzeptron/task6.css`
3. `faecher/informatik/klasse-11/1-Kuenstliche-Intelligenz/perzeptron/ui/task6.mjs`
4. Gezielte Modul-/Browserprüfungen unter `faecher/informatik/klasse-11/1-Kuenstliche-Intelligenz/perzeptron/tests/`, sofern die vorhandenen Tests die Varianten-, IDE- und Quiz-Verträge nicht bereits abdecken.

**Lokal zu ändern:** `faecher/informatik/klasse-11/index.html`, `apps-script/Tasks.gs`, `apps-script/Config.gs`, `apps-script/Gemini.gs`, `apps-script/tests/code-routing.test.js`. Die BlueJ-Quellen, Aufgabe 5, `semantic-answer.mjs`, `Code.gs` und bestehende Robot-Aufgaben bleiben fachlich und technisch unverändert. Keine neue Korrektur-Pipeline, kein Sicherungsblatt und keine Kopie der vollständigen Lösung in der Schüleroberfläche.

**Reihenfolge für den Bau:** (1) IDE-Startstände und Beispielprogramm im bestehenden Embed-Format vorbereiten und beide kompilieren; (2) Auswahl und getrennte Speicherung; (3) Seitentexte und Hilfen; (4) Text- und Code-Task-Konfiguration samt minimaler Prompt-Erweiterung; (5) Quiz und Übersicht; (6) Desktop-, Tablet- und Smartphone-Prüfung sowie Server- und Regressionstests. `git diff --check` ist Pflicht. Nach lokal erfolgreichem Bau muss die verantwortliche Lehrkraft `Tasks.gs`, `Config.gs` und `Gemini.gs` in Apps Script übernehmen und eine neue Bereitstellungsversion aktivieren; erst dann ist Live-Feedback für die neuen IDs prüfbar.

## 8. Akzeptanzkriterien – regelbasierte Vorprüfung

1. `aufgabe6.html` liegt im KI-Einheitsordner, ist per Aufgabe-6-Button nach Aufgabe 5 in der Klassen-11-Übersicht erreichbar und hat korrekte relative Rück-, Start-, CSS- und Skript-Links.
2. Die Seite zeigt vor der IDE die Wahl „Einfach“/„Schwer“. Beide Varianten nutzen unterschiedliche IDE-IDs und die drei genannten Java-Dateien plus Anleitung. Kein BlueJ-Metadatenfile und keine sichtbare Lösungsdatei sind eingebettet.
3. Beide unbearbeiteten IDE-Projekte kompilieren und starten im Browser. Die einfache Summe ist als `double` deklariert; `trainieren` ist in der schweren Variante leer. `punktKlassifizieren` ist in beiden vollständig vorhanden.
4. Die gemeinsame Beschreibe-Aufgabe ist in beiden Varianten sichtbar. Einfache Variante: drei getrennte Code-Prüfbuttons, je drei Hilfen und ein letzter anfangs geschlossener Schnipselbereich mit neun kopierbaren, falsch geordneten Anweisungen. Schwere Variante: eigener Code-Prüfbutton, Beschreibung und geschlossene Formelsammlung mit allen fünf Formeln.
5. Der aktive IDE-Dateizugriff liefert jeweils `Perzeptron.java`, niemals `Hauptprogramm.java` oder den Stand der anderen Variante. Die vier Code-Task-IDs werden per POST mit `requestType=code` verwendet; die Text-ID nutzt die vorhandene Textanbindung. `MAX_CODE_LENGTH` und URL-Limit werden vor dem Absenden behandelt.
6. Alle fünf IDs sind in `Tasks.gs` mit dem festgelegten Typ und `maxPoints` vorhanden. `Config.gs` nennt Aufgabe 6. `Gemini.gs` erzeugt einen durch Task-Daten konfigurierbaren Code-Prompt, für diese Tasks ohne Robot-Kriterien und im Test auch für einen anderen Programmierkontext nutzbar; der Prompt für `10-2a` bleibt im Regressionstest unverändert. Der bestehende Antwort- und Transportvertrag bleibt erhalten.
7. Die vier Quizfragen und ihre Antwortschlüssel stimmen exakt mit Abschnitt 4 überein. Mindestens zwei Fragen haben mehrere richtige Antworten; hier sind es drei. Das Quiz hat je Frage Textfeedback, Fortschritt und nach vollständiger Lösung eine Übersicht mit Frage und richtigen Optionen.
8. Textfeld, Quiz-Auswahl und Variantenwahl bleiben nach Navigation und Neuladen erhalten; beide Code-Stände bleiben auch nach mindestens zweimaligem Variantenwechsel unabhängig erhalten. Speichern funktioniert ohne Browser-Speicherzugriff weiterhin als Arbeitsseite, mit verständlicher Statusmeldung.
9. Sichtbare Labels, eindeutige Buttons und IDs, `aria-live="polite"`, tastaturbedienbare Auswahl/Hilfen, lesbarer Fokus und Text zusätzlich zu Farbzuständen sind vorhanden. Das Layout ist auf Desktop, Tablet und Smartphone benutzbar; IDE und Aufgaben stehen auf breiten Ansichten nebeneinander.
10. Die fachlichen Rechentests aus Abschnitt 6, der bestehende Code-Routing-Test, neue zielgerichtete Tests, Syntaxprüfung aller neuen Skripte und `git diff --check` bestehen. Keine LaTeX-, PDF- oder BlueJ-Ausgabedateien wurden erzeugt.

## 9. Akzeptanzkriterien – fachlich-didaktische Endabnahme

1. Der Lernweg setzt Aufgabe 5 voraus und führt sichtbar vom Beobachten über das Erklären zum Implementieren und Prüfen. Beide Schwierigkeitswege behandeln dieselbe Trainingsregel und enden in derselben Sicherung.
2. Die einfache Vorlage übernimmt die fachlichen Lücken aus BlueJ, korrigiert aber den `int`-Fehler und den unklaren Kommentarbestand. Die Hilfen geben erst einen Hinweis, dann einen Denkansatz, dann eine Teillösung. Der Schnipselbereich liefert keine fertig geordnete Methode.
3. Die schwere Vorlage enthält eine wirklich leere Trainingsmethode. Die Beschreibung ist vollständig genug, um ohne die einfache Variante zu arbeiten; die Formeln sind zunächst verborgen und mathematisch konsistent mit Aufgabe 5 und der BlueJ-Lösung.
4. Die Beschreibung von `punktKlassifizieren` würdigt sinngleiche Antworten, erfasst Rechnung, Grenzfall, Ausgabe und die fehlende Parameteränderung. Sie zeigt beim ersten Fehlversuch keine vollständige Musterantwort.
5. Das Code-Feedback bewertet ausschließlich die jeweils verlangte Leistung in `trainieren`, erkennt funktional gleichwertigen Java-Code an, weist auf konkrete Lücken bzw. Vorzeichen- und Typfehler hin und behauptet keine echte Codeausführung durch den Skriptserver.
6. Beispielprogramm und Testfälle machen `δ = −1`, `0`, `1`, Dezimalwerte und `a = theta` fachlich sichtbar. Der ganze Trainingsdurchlauf stimmt mit Aufgabe 5 überein. Klassenlabel 1 und 0 werden nicht vertauscht.
7. Zusammenfassung und Quiz sichern das tatsächlich Erarbeitete. Die Falschantworten greifen plausible Missverständnisse auf; Rückmeldungen erklären den fachlichen Grund. Die Darstellung entspricht dem vorhandenen Stil der KI-Einheit.

**Aufwand:** Der Seitenaufbau und die Aufgabenlogik passen zu den vorhandenen Referenzen. Die einzige besondere Integration ist der bisher roboterspezifische Code-Prompt in `Gemini.gs`; dafür ist eine kleine allgemein konfigurierbare Erweiterung mit Regressionstest nötig. Ein kosteneffizientes Builder-Modell kann nach dieser Spezifikation arbeiten, sofern es die IDE-Kompilierung und den getrennten Workspace-Zustand tatsächlich im Browser verifiziert.
