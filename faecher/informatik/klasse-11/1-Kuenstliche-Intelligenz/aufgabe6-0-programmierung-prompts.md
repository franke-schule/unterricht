# Prompts: Aufgabe 6.0 – Objektorientierte Programmierung wiederholen

Stand: 11.10.2026. Auftrag und vier Rollenprompts für die spätere Erstellung
eines Lernmoduls. Dieses Dokument baut das Modul noch nicht.

## Verwendung

Startprompt und dieses gesamte Dokument gemeinsam übergeben. Die vier
Rollenprompts gehören zu einem Auftrag und werden nacheinander ausgeführt.

```text
Führe den Lernmodul-Loop nach AGENTS.md Abschnitt 13 für Aufgabe 6.0 aus.
Vollständiger Auftrag:
faecher/informatik/klasse-11/1-Kuenstliche-Intelligenz/aufgabe6-0-programmierung-prompts.md
Verwende dessen Rollenprompts: Planung → Bau → regelbasierte Vorprüfung
→ fachlich-didaktische Endabnahme.
Codex: Planung und Endabnahme GPT-6 Sol (high), Bau GPT-6 Luna (high),
Vorprüfung GPT-6 Luna (medium). Bei anspruchsvoller neuer Interaktionslogik
darf ausschließlich der Builder auf GPT-6 Sol angehoben werden.
Höchstens drei Korrekturrunden zwischen Bau und Vorprüfung und höchstens
zwei Endabnahmen; danach offene Punkte übergeben.
Die bisherige Aufgabe 6 ist bereits sichtbar in Aufgabe 6.1 umbenannt.
Sie bleibt technisch unter aufgabe6.html erreichbar. Ihre Java-Vorlagen,
IDE-IDs, Speicherkennungen, Server-IDs und Trainingslogik nicht verändern.
Erstelle ausschließlich das neue Wiederholungsmodul und seine Integration.
```

## Gemeinsamer fachlicher Auftrag

### Ziel, Umfang und Einordnung

- Informatik Klasse 11, Einheit Künstliche Intelligenz. Vorbereitung auf
  **Aufgabe 6.1 – Perzeptron implementieren**, vor deren Bearbeitung.
- Neue Seite:
  `faecher/informatik/klasse-11/1-Kuenstliche-Intelligenz/aufgabe6-0.html`.
  H1: **Objektorientierte Programmierung wiederholen**. Direkt darunter als
  eigene Zeile: **Aufgabe 6.0**.
- Ziel: Attribute und Methoden einer Klasse am Java-Code erkennen;
  Methodennamen, Eingabeparameter mit Datentyp und Rückgabetyp unterscheiden;
  Methoden eines konkreten Objekts mit Punktnotation aufrufen und das
  Auswahlfenster der Online-IDE dafür nutzen.
- Java und die bereits eingebettete Online-IDE verwenden. Keine zusätzliche
  Sprache, kein BlueJ-Wechsel und kein nachgebauter Editor.
- Kompakte Wiederholung für etwa 20–30 Minuten. Konstruktor und
  Objekterzeugung sind fertig vorgegeben; keine zusätzliche Erarbeitung von
  Konstruktoren, Vererbung, Überladung, Arrays oder Trainingsalgorithmen.
- Kein Sicherungsblatt und kein separates Wiederholungs-Quiz beauftragt.
  Das Abschlussquiz gehört zum Lernmodul. Das Manifest für separate
  Wiederholungs-Quizze begründet hier keinen Zusatzauftrag: Aufgabe 6.0
  ist ein Lernmodul mit IDE-Übungen und keine `aufgabeN-quiz.html`-Seite.

### Referenzen und wiederzuverwendende Technik

Zuerst den Klasse-11-Ordner und lokale AGENTS.md-Dateien prüfen. Vollständig
lesen: AGENTS.md, manifest-allgemein.txt,
manifest-online-ide-programmieraufgaben.txt, manifest-quizaufgaben.txt.

Konkrete Referenzen (Pfade relativ zum Repository):

| Zweck | Referenz |
| --- | --- |
| Java-Klassen, Getter, Einbettung mehrerer Dateien und IDE-Dateizugriff | `faecher/informatik/klasse-11/1-Kuenstliche-Intelligenz/aufgabe6.html`, `perzeptron/ui/task6.mjs`, `perzeptron/task6.css` |
| Gestaltung, Reiter, Hilfen, Zwischenstände und Abschlussübersicht | `faecher/informatik/klasse-11/1-Kuenstliche-Intelligenz/aufgabe5.html`, `perzeptron/ui/task5.mjs`, `perzeptron/task5.css` |
| Klassenkarte, Parameter/Argument und Punktnotation | `faecher/informatik/klasse-10/2-Modellierung-und-Programmierung-Online-IDE/aufgabe6.html` |
| Mehrere Java-Dateien und Einstieg in die IDE | `faecher/informatik/klasse-9/3-Modellierung-und-Programmierung-Online-IDE/aufgabe2.html` |
| Abschlussquiz und nummerierte, umbrechende Reiter | `faecher/informatik/klasse-10/1-Datenbanken/aufgabe1.html#final-quiz` bis `aufgabe4.html`, Reiterlayout aus `aufgabe6.html` derselben Datenbankeinheit |
| Einzelprüfung der Quizfragen | `faecher/informatik/quiz-fragen-pruefen.js`, `addQuizQuestionChecks` |
| IDE-Lader und vorhandene Autovervollständigung | `include/js/includeide/includeIDE.js`, `include/online-ide-embedded.js` |

Die Klasse-10-Seite liefert die fachlichen Interaktionsmuster, nicht ihre
abweichenden Farben oder ihr vollständiges Inline-CSS. Gestaltung der
Klasse-11-KI-Einheit übernehmen. Bestehende Korrekturmechanismen und
Formular-Speicherung verwenden; keine neue Korrektur-Pipeline und kein
Java-Parser für Schülercode entwickeln. Strukturierte Begleitantworten
automatisch prüfen; praktische IDE-Aufträge durch Ausführen und Vergleich
mit der Konsolenausgabe bearbeiten. Ohne echte Ausführung niemals behaupten,
Schülercode sei auf funktionale Richtigkeit getestet worden.

### Durchgängiges Beispiel und fachliche Konventionen

Grundlage ist `Datenpunkt` aus Aufgabe 6.1:

- Attribute: `private double x_1`, `private double x_2`, `private int label`.
- Getter: `public double gibEingabewertX1()`,
  `public double gibEingabewertX2()`, `public int gibLabel()`.
- Nur im Wiederholungsprojekt ergänzen:
  `public void setzeEingabewertX1(double neuerWert)` weist `neuerWert`
  dem Attribut `x_1` zu; `public void setzeLabel(int neuesLabel)` weist
  `neuesLabel` dem Attribut `label` zu. Keine Erweiterung der Originalklasse
  in Aufgabe 6.1 oder in den BlueJ-Materialien.
- Fertiger Konstruktor wie in Aufgabe 6.1; im Hauptprogramm ist
  `Datenpunkt punkt = new Datenpunkt(2.5, 4.0, 1);` vorgegeben.
  Java-Dezimalzahlen verwenden einen Punkt.
- Ein zweites vorgegebenes Objekt
  `Datenpunkt andererPunkt = new Datenpunkt(6.0, 2.0, 0);`
  zeigt, dass Attribute zu konkreten Objekten gehören. Änderungen an
  `punkt` verändern `andererPunkt` nicht.
- Die Klasse beschreibt Attribute und Methoden; das Objekt besitzt konkrete
  Attributwerte. Klassenkarte eckig, Objektkarten abgerundet.
- Methodenparameter stehen in den runden Klammern der Deklaration; ihr
  Datentyp steht vor ihrem Namen. Der Rückgabetyp steht vor dem Methodennamen.
  `void` bedeutet keine Rückgabe und sagt nichts über die Parameteranzahl.
- Ein Argument ist der beim Aufruf übergebene Wert oder Ausdruck;
  es muss zum Parametertyp passen. Eine Ganzzahl wie `2` darf an einen
  `double`-Parameter übergeben werden; `2.5` darf ohne Umwandlung nicht
  an einen `int`-Parameter übergeben werden. Keine Umwandlungsübung ergänzen.
- Bei `punkt.gibLabel()` ist `int` der Rückgabetyp; die Methode hat keinen
  Eingabeparameter. Leere Klammern gehören trotzdem zum Methodenaufruf.
- `punkt` ist der Name einer Objektvariablen, `Datenpunkt` der Klassenname.
  Die gezeigten Instanzmethoden werden am Objekt aufgerufen.
- Aufrufmuster: `objektname.methodenname(argumente);`. Bei einer
  parameterlosen Methode bleiben die Klammern leer. Bei Gettern kann der
  zurückgegebene Wert gespeichert oder mit `System.out.println` ausgegeben
  werden; die Methode druckt nicht automatisch selbst.

### Verbindlicher Lernweg

Fünf jederzeit frei wechselbare Reiter, ab 1 nummeriert. Weiter-Buttons in
Reiter 1–4. Den Einstieg nicht von einem bestandenen Vorgänger abhängig machen.
Eine einzige dauerhaft erhaltene IDE-Instanz verwenden, damit Reiterwechsel
den Code nicht zurücksetzen oder voneinander abweichende Projekte erzeugen.

**1. Klasse und Objekte – beobachten, dann zuordnen**

Fertiges Hauptprogramm starten; beide Objektwerte vor und nach einer Änderung
ausgeben. Erst danach Attribute/Methoden der Klasse bestimmen. Klassenkarte
und zwei Objektkarten zeigen; Code bleibt einsehbar. Kein UML-Syntaxkurs.

Wörtliche Aufträge:
„**Starte** das Programm und **vergleiche** die Ausgaben der beiden Objekte.
Welcher Wert ändert sich, wenn die Methode an `punkt` aufgerufen wird?“
„**Ordne** die drei Attribute und die fünf Methoden der Klasse `Datenpunkt`
zu. Der bereits vorgegebene Konstruktor wird hier nicht einsortiert.“

Automatisch geprüfte Zuordnung aus vorhandener Komponente, mit Antippen und
Tastatur als Alternative zu Drag-and-Drop. Der Planer legt das vollständige
Startprogramm und die exakten Erwartungswerte fest.

**2. Methoden und Eingabeparameter – Signaturen lesen**

Zunächst `public void setzeEingabewertX1(double neuerWert)` und
`public int gibLabel()` gegenüberstellen. Methodennamen, Rückgabetyp,
Parametername und Parametertyp in getrennte beschriftete Felder eintragen
oder aus vorgegebenen Begriffen auswählen; bei der Getter-Signatur
„kein Eingabeparameter“ anbieten. Danach zwei Parameter an der unverändert
übernommenen Signatur `public int punktKlassifizieren(double x_1, double x_2)`
erkennen, ohne den Klassifikationsalgorithmus zu behandeln.

Wörtliche Aufträge:
„**Bestimme** bei jeder Methodendeklaration den Methodennamen, den
Rückgabetyp und die Eingabeparameter mit ihren Datentypen.“
„**Vergleiche** die Deklaration `setzeLabel(int neuesLabel)` mit dem Aufruf
`punkt.setzeLabel(0);`. Welcher Name bezeichnet den Parameter, welcher Wert
das Argument?“

Erwartung: `neuesLabel` ist der Parameter, `int` sein Typ, `0` das Argument.
Keine automatische Gleichsetzung von `int` mit einem Eingabeparameter.

**3. Punktnotation und Auswahlfenster – selbst ausprobieren**

Im gültigen Hauptprogramm ist `punkt` vorher deklariert und im aktuellen
Gültigkeitsbereich verfügbar. In einer neuen Zeile `punkt.` eingeben.
Das echte Auswahlfenster der IDE benutzen, eine passende Methode wählen und
den Aufruf vollständig ergänzen. Auswahl und Aufruf sind getrennte Schritte:
Das Fenster führt die Methode nicht aus, sondern hilft beim Schreiben.

Wörtliche Aufträge:
„**Tippe** in einer neuen Zeile hinter dem gültigen Objektnamen `punkt` einen
Punkt. **Suche** im Auswahlfenster die Methode, die den ersten Eingabewert
zurückgibt, und **ergänze** den Aufruf.“
„**Gib** den Rückgabewert mit `System.out.println` aus und **starte** das
Programm. **Lies** anschließend im Auswahlfenster ab, welchen Datentyp die
Methode `setzeEingabewertX1` als Eingabe erwartet.“

Explizit erklären: Die Vorschläge hängen vom Typ des Objekts und der
Zugänglichkeit seiner Mitglieder ab. Es können zusätzlich geerbte Methoden
sichtbar sein. Die privaten Attribute erscheinen im Hauptprogramm nicht
als frei zugängliche Mitglieder. Weder „nur Methoden“ noch „alle Attribute
und Methoden“ als pauschale Regel formulieren.

Die konkrete Darstellung der Signatur sowie Auswahl per Maus/Tastatur im
aktuellen IDE-Build überprüfen, bevor Bedienhinweise festgelegt werden.
Der Punkt ist im vorhandenen Completion-Provider als Trigger implementiert.
Wenn das Fenster nicht erscheint: Schreibweise, vorherige Deklaration,
Gültigkeitsbereich und Fehler im Programm prüfen; anschließend erneut
auslösen. Eine Tastenkombination nur nennen, wenn sie tatsächlich getestet
ist. Keine externen Screenshots voraussetzen und kein Ersatzfenster bauen.

**4. Anwenden und Übergang zu Aufgabe 6.1**

Wörtliche Aufträge:
„**Ändere** den ersten Eingabewert von `punkt` mit einem Methodenaufruf auf
`7.5`. **Lies** ihn danach über die passende Methode aus und **prüfe** die
Ausgabe; `andererPunkt` soll unverändert bleiben.“
„**Ordne** in `public void trainieren(Datenpunkt punkt)` Parametername und
Parametertyp zu. **Ergänze** den Aufruf am bereits vorhandenen Objekt `netz`,
wenn der Datenpunkt `punkt` übergeben werden soll.“

Für den Übergang ein klar als Codeausschnitt aus Aufgabe 6.1 beschriftetes
Beispiel zeigen, keine zusätzliche Trainingsimplementierung in der IDE:
Parametertyp `Datenpunkt`, Parametername `punkt`, Aufruf
`netz.trainieren(punkt);`. Begleitfrage zu `punkt.gibEingabewertX1()`:
Objektvariable `punkt`, Methodenname `gibEingabewertX1`, keine Eingabeparameter,
Rückgabetyp `double`. Die Trainingsregel bleibt Aufgabe 6.1 vorbehalten.

Typische Fehler gezielt rückmelden: Klassenname statt Objektvariable,
fehlender Punkt, fehlende Aufrufklammern, Parametername statt Argument,
Rückgabetyp statt Parametertyp, direkter Zugriff auf ein privates Attribut.
Gleichwertige korrekte Schreibweisen zulassen, soweit die vorhandene
strukturierte Prüfkomponente dies unterstützt.

**5. Abschlussquiz und Auswertung**

Bestehende `#final-quiz`-Struktur mit Auswahlkästchen verwenden. Jede Frage
hat „Frage N prüfen“ und eigene Rückmeldung. Gemeinsamer Auswertungsbutton
bleibt; automatische Gesamtauswertung nach allen richtigen Einzelprüfungen
über `addQuizQuestionChecks`. Sechs Fragen, ausschließlich zu Erarbeitetem:

1. Klasse/Objekt: mehrere richtige Aussagen, etwa „Die Klasse legt die
   Attribute fest“ und „Zwei Datenpunkt-Objekte können verschiedene Werte
   besitzen“; falsch: „Eine Änderung an punkt ändert alle Datenpunkte“.
2. `public void setzeLabel(int neuesLabel)`: richtig sind Parameter in
   Klammern, Parametertyp `int` und keine Rückgabe; falsch: `void` bedeutet
   keine Eingabeparameter. Mehrere richtige Antworten.
3. `public int gibLabel()`: Rückgabetyp `int`, keine Eingabeparameter,
   Aufrufklammern trotzdem erforderlich. Mehrere richtige Antworten.
4. `punkt.setzeLabel(0);`: Objektvariable, Methodenname, Argument unterscheiden.
5. Auswahlfenster nach `punkt.`: zeigt passende zugängliche Mitglieder und
   hilft beim Ergänzen; Auswahl führt die Methode nicht aus. Mehrere richtige
   Antworten; keine Aussagen über eine ungeprüfte konkrete Fensteroptik.
6. `trainieren(Datenpunkt punkt)`: Parametertyp `Datenpunkt` und Aufruf
   `netz.trainieren(punkt);`, ohne Trainingsrechnung abzufragen.

Der Planer formuliert alle Optionen, Antwortschlüssel und Fehlerbegründungen
vollständig. Mindestens zwei Fragen haben mehrere richtige Antworten.
Nach vollständiger Bearbeitung eine kompakte Übersicht mit allen
Teilaufträgen und richtigen Ergebnissen zeigen, einschließlich der früheren
Reiter. Ein unverriegelter Link „Weiter zu Aufgabe 6.1“ führt zu
`aufgabe6.html`; er ist auch vor einem bestandenen Quiz erreichbar.

### Verbindliche Merksätze

Nach der zugehörigen Beobachtung/Übung zeigen:

- „Eine Klasse beschreibt Attribute und Methoden. Jedes Objekt dieser Klasse
  besitzt eigene Attributwerte.“
- „Eingabeparameter stehen mit Datentyp und Namen in den runden Klammern der
  Methodendeklaration. Der Rückgabetyp steht vor dem Methodennamen.“
- „Beim Methodenaufruf werden Argumente an die Eingabeparameter übergeben.
  Die Argumente müssen zu den Parametertypen passen.“
- „Mit der Punktnotation rufst du eine Methode an einem bestimmten Objekt
  auf. Auch ohne Eingabeparameter gehören runde Klammern zum Aufruf.“
- „Das Auswahlfenster hilft dir, zugängliche Mitglieder des Objekttyps zu
  finden und einen Aufruf zu ergänzen. Es führt die Methode nicht aus.“

### Hilfen, Feedback, Bedienung und Speicherung

Je Kernaufgabe drei gestufte Hilfen: kleiner Hinweis → konkreter Denkansatz
→ Teillösung. Nicht sofort einen vollständig ausgefüllten Aufruf anbieten.
Beispiel für `setzeLabel`: „Schau in die runden Klammern der Deklaration.“ →
„Vergleiche den Namen nach dem Datentyp mit dem Wert im Aufruf.“ →
„`int` ist der Datentyp; der folgende Name bezeichnet den Eingabeparameter.“
Der Planer formuliert alle übrigen Hilfen und Feedbacktexte verbindlich.

Jede prüfbare Teilaufgabe hat ihren eigenen Button und Rückmeldung direkt
darunter, dreistufig: korrekt, teilweise korrekt, noch nicht korrekt.
Unvollständige Antworten neutral melden. Fehlerhinweise nennen den
nächsten Denk- oder Prüfschritt, ohne sofort die gesamte Lösung anzuzeigen.
Auch Rückgabe/Parameter und Parameter/Argument müssen getrennt bewertet
werden, damit teilweise richtige Antworten sichtbar bleiben.

Aufträge maximal zwei kurze Sätze oder drei Stichpunkte, Operatoren fett.
IDE-Aufträge stehen über dem Arbeitsbereich; Fragen zu Codeausschnitten
direkt bei dem Ausschnitt. Laptop: IDE und kurze Aufträge nebeneinander,
Tablet/Smartphone: sinnvolle einspaltige Reihenfolge. Keine horizontal
scrollenden Reiter; nur notwendiger Codebereich darf separat scrollen.
Labels, eindeutige IDs, Fokusmarkierung, Tastaturbedienung und
`aria-live="polite"`; Ergebnisse immer mit Text zusätzlich zur Farbe.

Alle strukturierten Eingaben, Auswahlen, Zuordnungen, Quizantworten,
aufgedeckten Merksätze, Abschlussstand und aktiven Reiter bei jeder Änderung
speichern und nach Seitenwechsel wiederherstellen. Bestehende
Speicherkomponente/-logik verwenden, versionierter eigener Schlüssel
`informatik11-ki-aufgabe6-0-v1`, fehlertolerante Zugriffe und Validierung.
Eigenständige IDE-ID `Java11Aufgabe6_0Wiederholung`; Speicherung des
Schülercodes zusätzlich über den bestehenden IDE-Mechanismus prüfen.
Keine Speicher- oder IDE-ID von Aufgabe 6.1 übernehmen. Beim Zurücksetzen
klar benennen, welche Eingaben und welcher IDE-Code zurückgesetzt werden.

### Dateien und Menüintegration

Neu: `aufgabe6-0.html`, bei Bedarf `perzeptron/ui/task6-0.mjs` und
`perzeptron/task6-0.css`; gezielte Tests nur für tatsächlich neue Logik.
Spezifikation unter `perzeptron/SPEZIFIKATION-aufgabe6-0.md`, Bau- und
Prüfberichte ebenfalls dort. Vorhandene Dateien lesen, nicht duplizieren.

In `faecher/informatik/klasse-11/index.html` neue Kachel unmittelbar nach
Aufgabe 5.1 und vor Aufgabe 6.1 einfügen:
`Aufgabe 6.0` / `Objektorientierte Programmierung wiederholen`, Link
`1-Kuenstliche-Intelligenz/aufgabe6-0.html`.
Bestehende Kachel `Aufgabe 6.1` / `Perzeptron implementieren` behält den
Link `1-Kuenstliche-Intelligenz/aufgabe6.html`.
In Aufgabe 6.1 einen sichtbaren Link „Zur Wiederholung: Aufgabe 6.0“ ergänzen.
Neue Seite verlinkt `../index.html` und `../../../../` zur Navigation.
Keine Kachel mit nicht existierendem Ziel anlegen. Apps-Script und gemeinsame
IDE-Dateien bleiben unverändert; dieser Auftrag benötigt keine Serverbewertung.

## Prompt A – Planung

```text
Rolle: lernmodul-planner. Erstelle die Spezifikation für Aufgabe 6.0 gemäß
dem vollständigen gemeinsamen Auftrag dieses Promptdokuments. Schreibe
keinen Produktcode und baue das Modul noch nicht.
Lies die dort genannten Manifeste vollständig und prüfe die Referenzen.
Lies zuerst Aufgabe 6.1 unter aufgabe6.html samt Skript und Java-Vorlagen.
Prüfe in der vorhandenen IDE das echte Auswahlfenster nach punkt., seine
Signaturanzeige und Auswahlbedienung; unbelegte Bedienannahmen kennzeichnen.
Schreibe perzeptron/SPEZIFIKATION-aufgabe6-0.md mit Lernzielen, fünf Reitern,
verbindlichen Schülerwortlauten, allen Hilfen, dreistufigem Feedback,
Merksätzen, Quizoptionen samt Antwortschlüsseln und vollständigem
Startprojekt mit überprüften Konsolen-Erwartungswerten als Beschreibung.
Lege die vorhandenen Komponenten und benötigten Erweiterungen konkret fest.
Trenne regelbasierte von fachlich-didaktischen Akzeptanzkriterien.
Fixiere Dateiumfang, Menüposition, unabhängige IDE-/Speicherschlüssel und
den Übergang zu Aufgabe 6.1. Keine Trainingslösung vorwegnehmen.
Bewerte den Aufwand und dokumentiere offene technische Risiken konkret.
Lieferung: vollständige Spezifikation und kurze Übergabe an den Builder.
```

## Prompt B – Bau

```text
Rolle: lernmodul-builder. Eingabe ist die vollständige abgenommene
SPEZIFIKATION-aufgabe6-0.md, nicht eine Zusammenfassung.
Implementiere Aufgabe 6.0 strikt danach und übernimm Schülerwortlaute,
Hilfen und Feedback unverändert. Verwende die festgelegten Komponenten.
Beachte den Dateiumfang und erhalte vorhandene uncommittete Änderungen.
In Aufgabe 6.1 nur den beauftragten Wiederholungslink ergänzen; keine
Änderungen an Java-Vorlagen, IDs, Speicherung oder Trainingsauswertung.
Nutze die vorhandene Online-IDE samt echtem Auswahlfenster. Prüfe beide
Objektzustände, Getter/Setter, leere Aufrufklammern und passende Argumente
im tatsächlichen Programmlauf. Kein eigener Editor, Java-Parser oder Server.
Integriere das Quiz mit addQuizQuestionChecks und vollständiger Übersicht.
Teste Speicherung aller Eingabearten und des Codes nach Reiterwechsel,
Navigation zur Klassenübersicht, Rückkehr und Neuladen.
Schreibe einen Baubericht mit geänderten Dateien, Wiederverwendung,
ausgeführten Checks und nachweisbaren Einschränkungen.
Lieferung: implementierte Dateien und Bericht für die Vorprüfung.
```

## Prompt C – Regelbasierte Vorprüfung

```text
Rolle: lernmodul-pruefer. Prüfe die vollständige Spezifikation, den Diff
und den Baubericht. Ändere keine Produktdateien und bewerte keine Didaktik.
Arbeite ausschließlich die mechanische Akzeptanzliste ab:
Dateien und relative Links, Menüfolge 5.1 → 6.0 → 6.1 → 7,
Aufgabennummer direkt unter H1, fünf nummerierte frei wechselbare Reiter,
Weiter-Buttons, eigene Prüfbuttons pro Teilfrage, Auswahlkästchen,
mindestens zwei Quizfragen mit mehreren richtigen Antworten,
addQuizQuestionChecks und automatische Gesamtauswertung,
Übersicht aller Teilaufgaben, Navigation und Wiederholungslink.
Prüfe eigenständige IDE-/Speicherkennungen; Code und jede Eingabeart bleiben
nach Navigation und Neuladen erhalten. Prüfe Tastatur, Labels, aria-live,
eindeutige IDs, Klassen-/Objektkarten und Layout auf Laptop, Tablet und
Smartphone. Öffne das echte Auswahlfenster nach punkt. und prüfe die
dokumentierte Auswahlbedienung sowie Kompilierung/Programmausgabe.
Führe relevante vorhandene Regressionstests, Syntaxchecks und
git diff --check aus. Keine neuen PDFs, Lehrercodes oder Server-Tasks sind
beauftragt; diese Prüfungen für Aufgabe 6.0 als nicht anwendbar markieren.
Lieferung: PRUEFUNG_BESTANDEN oder PRUEFUNG_FEHLER mit Nachweisen und
reproduzierbaren Beanstandungen. Nicht ausgeführte Checks ausdrücklich
benennen; sie gelten nicht als bestanden.
```

## Prompt D – Fachliche und didaktische Endabnahme

```text
Rolle: lernmodul-reviewer. Erst nach bestandener Vorprüfung starten.
Eingaben: vollständige Spezifikation, Produktdateien/Diff, Bau- und
Vorprüfbericht. Keine Produktdateien ändern.
Prüfe die fachlich-didaktische Akzeptanzliste und den echten Lernfluss:
Beobachten → Attribute/Methoden erkennen → Signaturen lesen →
Punktnotation mit Auswahlfenster anwenden → Transfer zu Aufgabe 6.1.
Unterscheide Klasse/Objekt, Attribut/Parameter, Rückgabe/Eingabe,
Parameter/Argument und Methodenwahl/Methodenausführung.
Sind void, parameterlose Getter, zwei double-Parameter und der Objekttyp
Datenpunkt fachlich richtig? Wird die zulässige Übergabe einer Ganzzahl an
double anerkannt? Wird der Konstruktor nicht als gewöhnliche Methode
einsortiert? Ändert ein Setter nur das angesprochene Objekt?
Erklärt das Auswahlfenster zugängliche Mitglieder passend zum Objekttyp,
ohne alle privaten Attribute oder ausschließlich Methoden zu versprechen?
Ist die Übung am echten Fenster nachvollziehbar und führt sie zu einem
vollständigen Aufruf mit Klammern, Argumenten und Semikolon?
Bereitet der Transfer genau die Getter und Signaturen von Aufgabe 6.1 vor,
ohne Trainingsrechnung oder Trainingslösung vorwegzunehmen?
Prüfe kurze Aufträge, gestufte Hilfen, spezifisches dreistufiges Feedback,
plausible Fehlvorstellungen, Quizqualität, Übersicht und visuelle
Konsistenz. Lege keine zusätzlichen Themen oder Artefakte fest.
Lieferung: APPROVED oder CHANGES_REQUIRED. Jede Beanstandung nennt
Fundstelle, verletztes Kriterium, fachlichen Grund und nötige Korrektur.
```
