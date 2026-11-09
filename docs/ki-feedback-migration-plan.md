# Migrationsplan für 79 offene KI-Aufgaben

Stand: 29.10.2026. Ausschließlich Feedbackmigration; Schüleraufträge, Hilfen, Lösungen, Design und Navigation bleiben bestehen. Die fünf bereits migrierten Tasks bleiben unverändert.

## Gemeinsamer Vertrag

- Pro fachlichem Aspekt genau ein Punkt; `maxPoints`, `expectedAspects`, `rubric` und `feedbackCriteria` müssen dieselbe Anzahl in derselben Reihenfolge haben. `rubric` als je ein kriteriumsbezogener Punkt neu formulieren, fachliche Fairness- und Negativabgrenzungen aus dem bisherigen Prompt erhalten.
- `maxFeedbackHints: 1`; Server bewertet Einzelkriterien mit wörtlichem Text- oder Codebeleg, validiert Belege, zählt Punkte und wählt den ersten offenen Hinweis. Spätere richtige Aspekte zählen sofort. Keine Modellpunkte oder Modellprosa.
- Bei voller Punktzahl wörtlich „Sehr gut, alles richtig“. Sonst genau eine konkrete Handlungsanweisung als „Schritt N von M: …“; bei null Punkten N=1. Technischer Fehler: „Die automatische Prüfung ist gerade nicht erreichbar. Deine Antwort bleibt erhalten. Versuche es später erneut.“ Er zählt nicht als Versuch.
- Nach Texteingabe-/Codeänderung alte Rückmeldung entfernen und verspätete Antwort auf alten Inhalt ignorieren. Bestehende `renderCompactEvaluation` mit `maxHints: 1`, `aria-live="polite"`, Text statt reiner Farbmeldung, mobile Layouts, Hilfen und Musterlösungen beibehalten.
- In Wiederholungsquizzen bei Rubrikänderung nur betroffene `ai`, `aiText` und `first.describe[id]` invalidieren; Texte und MC/Cloze/Sort mit deren Erstwertungen erhalten. Bei Codeaufgaben betroffene Freigaben/Caches versionieren, Code erhalten. Referenz: `faecher/informatik/klasse-10/1-Datenbanken/aufgabe9.mjs` (`assessmentVersion`).
- Vorhandene lokale Code- und Textregeln aus `source/rules.js` prüfen. Der Kriterienzweig umgeht den alten allgemeinen Nachbewerter; nachweislich zuverlässige lokale Prüfungen kriteriumsweise integrieren, nicht durch eine pauschale Punktgutschrift ersetzen. Generierte Serverdateien nur bauen; `apps-script/` unverändert.

## Verbindliche Kriterien je Task

Die folgenden nummerierten Sätze sind die fachliche Kriterienfolge und der Wortlaut für `expectedAspects`. `feedbackCriteria.label` lautet jeweils kurz und ohne Satzschluss „Aspekt 1“, „Aspekt 2“ usw.; die konkrete Handlungsanweisung steht ausschließlich in `issues`. So bleibt sie in der kompakten UI trotz Satzsegmentierung sichtbar. Die sieben mit Stilpunkt erhalten nach Nutzerentscheidung fünf Punkte und nur die ersten fünf bisherigen Fachaspekte. Original-Aufgabentexte, Hilfen und Musterlösungen bleiben auf den vorhandenen Schülerseiten wörtlich erhalten.

### `ph11-photovoltaik-schaltplan-beschreibung` — 4 Punkte

Physik Klasse 11 – Photovoltaik: Schaltplan beschreiben

1. Die Solarzelle wird als Bestandteil und elektrische Quelle des geschlossenen Stromkreises erkannt.
2. Der veränderliche Widerstand wird als weiterer Bestandteil des Stromkreises genannt; seine Veränderung liefert verschiedene U-I-Paare.
3. Das Amperemeter A liegt in Reihe im Stromweg und misst die Stromstärke.
4. Das Voltmeter V liegt parallel an den beiden Anschlüssen der Solarzelle und misst deren Spannung.

### `b` — 5 Punkte

Klasse 9 Aufgabe b: Programmtext analysieren

1. Circle ball = new Circle(200, 50, 50); erzeugt ein neues Circle-Objekt und speichert es in der Variablen ball.
2. Die Zahlen im Konstruktor legen Position und Groesse des Kreises fest.
3. ball.move(10, 10); verschiebt den Kreis um die angegebenen Werte.
4. ball.setFillColor(Color.red); faerbt den Kreis rot.
5. ball.destroy(); entfernt oder zerstoert den Kreis wieder.

### `c` — 5 Punkte

Klasse 9 Aufgabe c: Zahlen variieren

1. Die erste Zahl in new Circle(200, 50, 50) beeinflusst die horizontale Position des Kreises.
2. Die zweite Zahl in new Circle(200, 50, 50) beeinflusst die vertikale Position des Kreises.
3. Die dritte Zahl in new Circle(200, 50, 50) beeinflusst die Groesse des Kreises.
4. Die erste Zahl in move(10, 10) beschreibt die horizontale Verschiebung.
5. Die zweite Zahl in move(10, 10) beschreibt die vertikale Verschiebung.

### `2b` — 5 Punkte

Klasse 9 Aufgabe 2b: Klassen analysieren und veraendern

1. Hund petersHund = new Hund(5, "Wuffti"); erzeugt ein Hund-Objekt mit Alter 5 und Name Wuffti und speichert es in petersHund.
2. Hund inasHund = new Hund(8, "Schnuffi"); erzeugt ein zweites Hund-Objekt mit Alter 8 und Name Schnuffi und speichert es in inasHund.
3. petersHund.zeigeDaten(); ruft die Methode zeigeDaten fuer petersHund auf und gibt seine Daten aus.
4. inasHund.zeigeDaten(); ruft die Methode zeigeDaten fuer inasHund auf und gibt ihre Daten aus.
5. inasHund.belle(); ruft die Methode belle fuer inasHund auf und gibt den Belltext mit dem Namen aus.

### `1a` — 5 Punkte

Klasse 10 Aufgabe 1a: Programmzeilen erklaeren

1. Kiste block = new Kiste(); erzeugt ein neues Objekt der Klasse Kiste.
2. Das neu erzeugte Kiste-Objekt wird in der Objektvariablen block gespeichert.
3. Ball ball1 = new Ball(100); erzeugt ein neues Objekt der Klasse Ball.
4. Das neu erzeugte Ball-Objekt wird in der Objektvariablen ball1 gespeichert.
5. Die 100 wird beim Erzeugen an den Konstruktor von Ball uebergeben.

### `1b` — 5 Punkte

Klasse 10 Aufgabe 1b: Parameterwert Ball(100)

1. Die 100 wird beim Konstruktoraufruf new Ball(100) an den Konstruktor Ball(float startX) uebergeben.
2. Die 100 wird im Konstruktor als Wert fuer startX verwendet.
3. startX legt die x-Position beziehungsweise den horizontalen Startpunkt des Kreises fest.
4. Der passende Fachbegriff fuer startX ist Parameter.
5. Der konkrete Wert 100 kann als Argument oder Parameterwert bezeichnet werden.

### `1c` — 5 Punkte

Klasse 10 Aufgabe 1c: Klasse und Objekt unterscheiden

1. Eine Klasse ist ein Bauplan oder eine Vorlage fuer Objekte.
2. Ball und Kiste sind Klassen, weil sie Attribute, Konstruktoren und Methoden beschreiben.
3. Ein Objekt ist eine konkrete Instanz, die nach einer Klasse erzeugt wurde.
4. ball1 ist ein Objekt der Klasse Ball beziehungsweise eine Objektvariable, die darauf verweist.
5. block ist ein Objekt der Klasse Kiste beziehungsweise eine Objektvariable, die darauf verweist.

### `1f` — 5 Punkte

Klasse 10 Aufgabe 1f: extends Actor erklaeren

1. extends Actor bedeutet, dass Ball von der Klasse Actor erbt.
2. Ball ist dadurch eine Unterklasse von Actor.
3. Ball uebernimmt Eigenschaften oder Verhalten, die Actor fuer handelnde Objekte in der LearnJ-Umgebung bereitstellt.
4. Die Methode act() kann dadurch als wiederholt ausgefuehrte Aktion des Actors genutzt werden.
5. Durch Vererbung muss gemeinsames Actor-Verhalten nicht neu programmiert werden.

### `10-2a` — 6 Punkte

Klasse 10 Aufgabe 2a: Ziegelreihe bis zur Wand

1. Ein Robot-Objekt wird mit einer sinnvollen Startposition und Weltgroesse erzeugt.
2. Eine Schleife wiederholt das Legen und Gehen bis zur Wand.
3. Die Schleifenbedingung verwendet istWand(), nichtIstWand() oder eine funktional gleichwertige sichere Wandpruefung.
4. Mit hinlegen() werden Ziegel fuer die Reihe abgelegt.
5. Mit schritt() bewegt sich der Roboter entlang der Reihe.
6. Die Reihenfolge der Befehle fuehrt nicht offensichtlich zu einer Wandkollision; eine staerkere Rand- oder Mauerloesung darf ebenfalls anerkannt werden.

### `10-2b` — 6 Punkte

Klasse 10 Aufgabe 2b: Ziegel am Rand entlang

1. Der Code bearbeitet nicht nur eine Reihe, sondern alle vier Randseiten.
2. Eine innere Wiederholung oder eine funktional gleichwertige Struktur bearbeitet jeweils eine Seite bis zur Wand.
3. An jeder Ecke wird der Roboter in die passende Richtung gedreht.
4. Die vier Seiten werden durch eine aeussere Schleife, vier nachvollziehbare Abschnitte oder eine gleichwertige Loesung abgedeckt.
5. hinlegen() und schritt() sind so angeordnet, dass entlang der Seiten Ziegel entstehen.
6. Es ist keine offensichtliche Wandkollision oder Endlosschleife erkennbar; eine korrekte Mauerloesung aus Teil c darf ebenfalls anerkannt werden.

### `10-2c` — 6 Punkte

Klasse 10 Aufgabe 2c: Ziegelmauer mit Hoehe 4

1. Auf jedem vorgesehenen Mauerfeld werden genau vier Ziegel gelegt, etwa mit hinlegen(4) oder vier einzelnen Aufrufen.
2. Der Roboter laeuft auf einer geeigneten Spur neben der vier Ziegel hohen Mauer und versucht nicht, auf sie zu steigen.
3. Eine Wiederholungsstruktur bearbeitet die Felder einer Seite.
4. Alle vier Randseiten beziehungsweise der vollstaendige geforderte Rand werden bearbeitet.
5. Die Ecken enthalten passende Drehungen und gegebenenfalls einen sinnvollen Spurwechsel.
6. Es ist keine offensichtliche Wandkollision, unzulaessige Hoehendifferenz oder Endlosschleife erkennbar.

### `10-3a` — 3 Punkte

Klasse 10 Aufgabe 3a: Roboter dudu in einer 12×12-Welt erzeugen

1. Eine Objektvariable mit dem Namen dudu vom Typ Robot wird deklariert.
2. Mit new Robot(...) wird ein neues Robot-Objekt erzeugt und dudu zugewiesen.
3. Der Konstruktor erhält vier Argumente, deren letzte beiden 12 und 12 sind; die Startposition liegt innerhalb der 12 × 12-Welt.

### `10-3b` — 6 Punkte

Klasse 10 Aufgabe 3b: Quader aus Ziegeln (3 × 5 × 4)

1. Die Grundfläche des Quaders umfasst genau 3 × 5 Felder (3 lang, 5 breit, Ausrichtung beliebig) ohne Lücken und ohne zusätzliche Felder.
2. Auf jedem der 15 Felder liegen genau 4 Ziegel, etwa mit hinlegen(4), vier hinlegen()-Aufrufen oder einer Höhenschleife.
3. Wiederholungen werden sinnvoll eingesetzt; erwartet sind verschachtelte Schleifen (äußere Schleife für Reihen oder Schichten, innere für die Felder einer Reihe). Eine andere funktional korrekte Struktur erhält diesen Punkt ebenfalls; die Rückmeldung empfiehlt dann verschachtelte Schleifen als kürzere Lösung.
4. Der Roboter legt die Ziegel jeweils von einem Nachbarfeld aus ab, weil hinlegen auf das Feld vor ihm legt, und muss nie auf einen Stapel steigen, der mehr als einen Ziegel höher ist.
5. Zwischen den Reihen wird der Roboter mit Drehungen und Schritten so neu positioniert, dass keine Ziegel doppelt gelegt werden und keine Felder fehlen.
6. Es ist keine Wandkollision in der 12 × 12-Welt, keine unzulässige Höhendifferenz und keine Endlosschleife erkennbar.

### `10-4a` — 4 Punkte

Klasse 10 Aufgabe 4a: Funktionsweise des Hauptprogramms beschreiben

1. Das Hauptprogramm erzeugt nacheinander Objekte mit new, jeweils mit dem Konstruktor einer Klasse wie Artikel, Smartphone, Computer, Laptop, Tower oder Kaffeemaschine.
2. Beim Erzeugen werden Werte wie Name, Preis und Gewicht und je nach Klasse weitere Werte (z. B. klappbar, Speicher, Akku, Breite, Füllvolumen) an den Konstruktor übergeben.
3. Jedes Objekt wird in einer Variablen gespeichert, deren Typ immer Artikel ist, auch wenn das Objekt von einer anderen Klasse stammt.
4. Nach jedem Erzeugen wird zeigeInfos() für das Objekt aufgerufen; die ausgegebenen Informationen unterscheiden sich je nach Klasse des Objekts, obwohl der Aufruf jedes Mal gleich lautet.

### `10-4c` — 5 Punkte

Klasse 10 Aufgabe 4c: Polymorphie im Programm finden und Befehle nennen

1. Polymorphie tritt in den Zeilen auf, in denen eine Variable vom Typ der Oberklasse Artikel auf ein Objekt einer Unterklasse verweist (smart1, smart2, pc1, laptop1, tower1, coffee1; z. B. Artikel smart1 = new Smartphone(...)); mindestens ein solches Beispiel wird genannt.
2. Beim Aufruf von zeigeInfos() über eine solche Variable wird die Methode der Klasse des tatsächlichen Objekts ausgeführt (z. B. zeigeInfos() aus Smartphone), nicht die aus Artikel; deshalb unterscheiden sich die Ausgaben.
3. Bei der Vererbung wird extends verwendet (z. B. class Computer extends Artikel); dadurch erbt die Unterklasse Attribute und Methoden.
4. Mit super(...) ruft der Konstruktor der Unterklasse den Konstruktor der Oberklasse auf.
5. Für Polymorphie wird eine geerbte Methode in der Unterklasse überschrieben (gleicher Name, gleiche Parameter, gekennzeichnet mit @Override) und das Objekt einer Variablen vom Typ der Oberklasse zugewiesen.

### `10-5a` — 6 Punkte

Klasse 10 Aufgabe 5a: Klassendiagramm Tiere in Java umsetzen

1. Die Klasse Tier deklariert die Attribute alter (int) und name (String) und die Methode zeigeDaten(), die die Daten mit println ausgibt.
2. Hund erbt mit extends von Tier und deklariert nur das zusätzliche Attribut rasse (String), nicht erneut alter und name.
3. Katze erbt von Tier mit dem Attribut freigaenger (boolean), Delfin erbt von Tier mit dem Attribut tauchtiefe (int).
4. bellen(), miauen() und schwimmen() sind als void-Methoden in der passenden Klasse vorhanden und geben einen Text mit println aus.
5. Hund und Katze überschreiben zeigeDaten() mit gleicher Signatur und geben dabei auch ihr eigenes Attribut aus; Delfin überschreibt zeigeDaten() nicht.
6. Klammern, Semikolons und Datentypen sind korrekt; Attribute stehen in der Klasse außerhalb der Methoden.

### `10-5b` — 5 Punkte

Klasse 10 Aufgabe 5b: Testprogramm mit polymorphem Aufruf

1. Objekte aller vier Klassen Tier, Hund, Katze und Delfin werden mit new erzeugt.
2. Den Attributen werden mit der Punktnotation Werte zugewiesen, auch geerbten Attributen wie name und alter bei Objekten der Unterklassen.
3. zeigeDaten() wird für die Objekte aufgerufen, und die eigenen Methoden bellen(), miauen() bzw. schwimmen() werden an passenden Objekten aufgerufen.
4. Mindestens ein polymorpher Aufruf: Eine Variable vom Typ Tier verweist auf ein Hund- oder Katze-Objekt, und über diese Variable wird zeigeDaten() aufgerufen.
5. Es gibt keine unzulässigen Aufrufe, etwa Unterklassenmethoden über eine Tier-Variable oder eine Hund-Variable mit einem Tier-Objekt.

### `10-5c` — 4 Punkte

Klasse 10 Aufgabe 5c (Bonus): eigene Unterklassen von Tier und Hund

1. Eine weitere Klasse erbt mit extends von Tier und ergänzt mindestens ein eigenes Attribut oder eine eigene Methode.
2. Eine Klasse erbt mit extends von Hund und ergänzt mindestens ein eigenes Attribut oder eine eigene Methode.
3. Die neuen Klassen deklarieren geerbte Attribute wie name, alter oder rasse nicht erneut und sind syntaktisch plausibel.
4. Im Hauptprogramm werden Objekte beider neuen Klassen erzeugt, mit Werten versehen und ihre Methoden aufgerufen, auch geerbte.

### `10-6b` — 4 Punkte

Klasse 10 Aufgabe 6b: Datentypen der Attribute von Grafik beschreiben

1. maximaleVersuche hat den Datentyp int und speichert eine ganze Zahl.
2. kiste hat den Datentyp Rectangle; Rectangle ist eine Klasse, kiste verweist also auf ein Objekt der Klasse Rectangle (ein Rechteck).
3. ball hat den Datentyp Circle und verweist auf ein Objekt der Klasse Circle (einen Kreis).
4. int ist ein einfacher (primitiver) Datentyp für einen einzelnen Wert, Rectangle und Circle sind Klassen als Datentyp; die zugehörigen Objekte werden erst im Konstruktor mit new erzeugt.

### `10-6e` — 5 Punkte

Klasse 10 Aufgabe 6e: kiste.rotate(45) mit Fachbegriffen beschreiben

1. kiste ist ein Attribut von Grafik bzw. eine Objektvariable, die auf ein Objekt der Klasse Rectangle verweist.
2. Es handelt sich um einen Methodenaufruf in Punktnotation: Vor dem Punkt steht das Objekt, hinter dem Punkt die aufgerufene Methode.
3. rotate ist eine Methode der Klasse Rectangle (aus der Bibliothek der Online-IDE), nicht der Klasse Grafik.
4. 45 ist das Argument (der übergebene Parameterwert); es wird an den Parameter angleDeg vom Typ double übergeben.
5. Wirkung: Das Rechteck, auf das kiste verweist, wird um 45 Grad gedreht.

### `11-3a-f` — 5 Punkte

Klasse 11 Aufgabe 3a: Algorithmus fuer einen Entscheidungsbaum formulieren

1. Zunächst werden alle möglichen Merkmale untersucht.
2. Für jedes Merkmal wird der Informationsgewinn bestimmt.
3. Das Merkmal mit dem größten Informationsgewinn wird als Knoten in den Entscheidungsbaum eingefügt.
4. Anhand des gewählten Merkmals werden die Datensätze in Teilgruppen eingeteilt.
5. Für jede Teilgruppe wird der Vorgang wiederholt, bis keine Datensätze mehr falsch zugeordnet werden.

### `inf11-a3a-quiz-informationsgewinn-beschreibung` — 4 Punkte

Informatik Klasse 11 – Test zu Aufgabe 3a: Informationsgewinn eines Splits bestimmen

1. Vor dem Aufteilen wird „reif“ als häufigeres Label vorhergesagt; die 4 unreifen Äpfel sind Fehlklassifikationen, also 4 Fehler vorher.
2. In jeder Teilmenge wird das häufigere Label vorhergesagt und die kleinere Gruppe als Fehler gezählt: rot 1 Fehler, grün 1 Fehler.
3. Die Gesamtfehler nach dem Aufteilen ergeben sich als Summe der Fehler beider Teilmengen: 1 + 1 = 2.
4. Der Informationsgewinn ist die Differenz aus Fehlern vorher und nachher: 4 − 2 = 2.

### `inf11-a3a-quiz-attributwahl-beschreibung` — 3 Punkte

Informatik Klasse 11 – Test zu Aufgabe 3a: Auswahl des Attributs für einen Knoten erklären

1. Das vorgeschlagene Kriterium betrachtet nur eine Teilmenge bzw. nur ein Label; es sagt nichts darüber, wie gut das Attribut friedliche und feindselige Fische trennt. Eine Teilmenge mit vielen feindseligen Fischen kann zugleich viele friedliche enthalten und damit viele Fehler erzeugen.
2. Stattdessen werden für jedes Attribut die Fehlklassifikationen in allen Teilmengen bestimmt und addiert, und daraus wird der Informationsgewinn als Fehler vorher minus Fehler nachher berechnet.
3. Gewählt wird das Attribut mit dem größten Informationsgewinn, also das, das die Fehler am stärksten verringert (bei Gleichstand eines davon).

### `inf11-a3a-quiz-vorgehen-beschreibung` — 4 Punkte

Informatik Klasse 11 – Test zu Aufgabe 3a: Weiteres Vorgehen nach dem ersten Knoten beschreiben

1. Die Trainingsdaten werden nach den Attributwerten des gewählten Attributs in Teilmengen aufgeteilt; jeder Attributwert bildet einen Ast.
2. Haben alle Daten einer Teilmenge dasselbe Label, entsteht dort ein Blatt mit diesem Label; ist keine sinnvolle Aufteilung mehr möglich, entsteht ein Blatt mit dem häufigeren Label.
3. Für jede noch gemischte Teilmenge werden die Informationsgewinne der übrigen Attribute neu, nur mit den Daten dieser Teilmenge, bestimmt, und das Attribut mit dem größten Informationsgewinn wird der nächste Entscheidungsknoten.
4. Das Verfahren wird für die neu entstehenden Teilmengen wiederholt, bis alle Äste in Blättern enden.

### `11-4-1` — 3 Punkte

Klasse 11 Aufgabe 4.1: Entscheidungsbaum der Tiefe 1 begruenden

1. Der resultierende Baum wird fachlich nachvollziehbar beschrieben, etwa durch den Split nach Schuppenfarbe und die entstehenden Aeste oder Blaetter.
2. Es wird begruendet entschieden, dass bei Baumtiefe 1 nicht alle Trainingsdaten richtig klassifiziert werden koennen.
3. Als sinnvolle Verbesserung werden eine groessere maximale Baumtiefe oder weitere Aufteilungen vorgeschlagen.

### `11-4-2` — 3 Punkte

Klasse 11 Aufgabe 4.2: Trainingsfehler und Testgenauigkeit vergleichen

1. Bei hoeherer Baumtiefe entstehen weniger Fehler in der Trainingsphase.
2. Die Genauigkeit bleibt gleich bei der Baumtiefe 1 bis 3.
3. Fehleranzahl in der Trainingsphase und Genauigkeit haengen in dieser Tabelle nicht zusammen.

### `11-4-3` — 3 Punkte

Klasse 11 Aufgabe 4.3: Gleiche Genauigkeit und unterschiedliche Fehler

1. Beide Baeume werden als gleich genau (80 % auf den Testdaten) erkannt.
2. Es wird erklaert, dass unterschiedliche Fische oder Klassen falsch klassifiziert werden koennen; hier T3 bei Tiefe 1 und T4 bei Tiefe 2.
3. Die Genauigkeit wird als alleinige Kennzahl kritisch eingeordnet, weil sie die Art oder Verteilung der Fehler nicht zeigt.

### `11-6-einfach-summe` — 3 Punkte

Klasse 11 Aufgabe 6.2 einfach: gewichtete Summe

1. Beide Eingaben werden über passende Datenpunkt-Getter gelesen.
2. Jede Eingabe wird mit dem passenden Gewicht multipliziert und beide Produkte addiert.
3. Die gewichtete Summe und ihre reellwertigen Zwischenwerte bleiben ohne Ganzzahlverlust erhalten; der int-Typ der binären Ausgabe ist davon unabhängig.

### `11-6-einfach-ausgabe` — 3 Punkte

Klasse 11 Aufgabe 6.2 einfach: Ausgabe

1. Bei Summe > theta wird die Ausgabe 1 bestimmt.
2. Bei Summe < theta wird die Ausgabe 0 bestimmt.
3. Bei Summe == theta wird die Ausgabe 0 bestimmt.

### `11-6-einfach-anpassung` — 5 Punkte

Klasse 11 Aufgabe 6.2 einfach: Parameter anpassen

1. Bei delta = 1 erhält jedes Gewicht seinen alten Wert plus lernrate mal die jeweils passende Eingabe.
2. Bei delta = 1 erhält theta seinen alten Wert minus lernrate.
3. Bei delta = -1 erhält jedes Gewicht seinen alten Wert minus lernrate mal die jeweils passende Eingabe.
4. Bei delta = -1 erhält theta seinen alten Wert plus lernrate.
5. Bei delta = 0 bleiben w_1, w_2 und theta unverändert.

### `11-6-schwer-trainieren` — 6 Punkte

Klasse 11 Aufgabe 6.2 schwer: trainieren

1. Die gewichtete Summe bleibt ohne Ganzzahlverlust erhalten.
2. Die Treppenfunktion gibt bei Summe > theta 1 aus, sonst 0.
3. delta ist Label minus berechnete Ausgabe.
4. Beide Gewichte werden mit passenden Eingaben, delta und lernrate angepasst.
5. theta wird mit umgekehrtem Vorzeichen von delta und lernrate angepasst.
6. Bei delta = 0 bleiben alle Parameter unverändert.

### `11-7-1` — 4 Punkte

Klasse 11 Aufgabe 7: KNN am Schulshirt-Beispiel erläutern

1. Für den neuen Datenpunkt werden die Abstände zu allen Trainingsdaten berechnet; der Abstand berücksichtigt Körpergröße und Brustumfang.
2. Die k = 5 Trainingsdaten mit den kleinsten Abständen werden als nächste Nachbarn ausgewählt.
3. Unter diesen fünf Nachbarn wird gezählt, welche Shirtgröße wie oft vorkommt (drei M, zwei S).
4. Der neue Datenpunkt bekommt die Mehrheitsklasse M.

### `11-8-1` — 3 Punkte

Klasse 11 Aufgabe 8: Wahl von k mit Validierungsdaten begründen

1. Es wird k = 3 gewählt.
2. Die Wahl wird mit der Tabelle begründet: Mit k = 3 werden alle fünf Validierungspersonen richtig klassifiziert.
3. Es wird verglichen: Mit k = 1, k = 5 und k = 7 werden jeweils nur drei von fünf Validierungspersonen richtig klassifiziert, k = 3 schneidet also am besten ab.

### `inf11-cod-a1-ascii-unicode` — 5 Punkte

Informatik Klasse 11 – Codierung Aufgabe 1: ASCII und Unicode vergleichen

1. ASCII verwendet 7 Bit und umfasst 128 Zeichen.
2. ASCII enthält nur lateinische Buchstaben ohne Umlaute, Ziffern, Satz- und Steuerzeichen; andere Schriften, Umlaute und Emojis fehlen.
3. Unicode ordnet den Zeichen aller Schriftsysteme (einschließlich Symbolen und Emojis) eine eindeutige Nummer zu und umfasst sehr viel mehr Zeichen.
4. Unicode ist zu ASCII kompatibel: Die ersten 128 Zeichen sind gleich.
5. Unicode-Zeichen benötigen je nach Zeichen mehr Speicher (UTF-8: 1 bis 4 Byte).

### `11-5-1` — 4 Punkte

Klasse 11 Aufgabe 5.2: Lernen eines Perzeptrons erklären

1. Beim Training werden Gewichte und bei Bedarf auch der Schwellenwert verändert.
2. Die Anpassung beruht auf der Abweichung zwischen Zielwert beziehungsweise Soll-Ausgabe t und berechneter Ist-Ausgabe f(a).
3. Das Gelernte steckt in den angepassten Gewichten und dem Schwellenwert beziehungsweise Parametern.
4. Das Perzeptron entwickelt dabei weder Bewusstsein noch menschliches Verständnis, sondern folgt festen Rechenregeln.

### `ph11-kreisbewegungen-bewegung-diagramm-beschreibung` — 5 Punkte

Physik Klasse 11 – Aufgabe 6a: Bewegung in Diagrammen beschreiben

1. Abschnitt I (0 bis 3 min): Start aus der Ruhe und gleichmäßige Beschleunigung von 0 auf 15 m/s.
2. Abschnitt II (3 bis 6 min): gleichförmige Bewegung mit der konstanten Geschwindigkeit 15 m/s.
3. Abschnitt III (6 bis 9 min): gleichmäßige Beschleunigung von 15 auf 25 m/s.
4. Abschnitt IV (9 bis 12 min): gleichförmige Bewegung mit der konstanten Geschwindigkeit 25 m/s.
5. Abschnitt V (12 bis 15 min): gleichmäßig beschleunigte Bewegung mit negativer Beschleunigung von 25 m/s bis zum Stillstand.

### `ph11-kreisbewegungen-kraeftegleichgewicht-beschreibung` — 4 Punkte

Physik Klasse 11 – Aufgabe 5: Kräfte vergleichen und begründen

1. Für den Körper auf dem Tisch wird ein Kräftegleichgewicht beziehungsweise eine resultierende Kraft von null erkannt.
2. Für das Auto mit konstanter Geschwindigkeit wird ein Kräftegleichgewicht beziehungsweise eine resultierende Kraft von null erkannt.
3. Die jeweils betrachteten Kräfte werden als entgegengesetzt gerichtet und gleich groß beschrieben.
4. Es wird erklärt, dass die Kraftsumme beziehungsweise resultierende Kraft deshalb null ist und sich der Bewegungszustand nicht ändert.

### `ph11-wdh2-quiz-crashtest-beschreibung` — 4 Punkte

Physik Klasse 11 – Test zu Wiederholung 2: Kräfte beim Crashtest beschreiben

1. Beim Aufprall übt das Auto eine Kraft auf die Wand aus und die Wand eine Kraft auf das Auto; beide sind gleich groß und entgegengesetzt gerichtet (Auto nach vorne gegen die Wand, Wand entgegen der Fahrtrichtung auf das Auto).
2. Diese beiden Kräfte greifen an zwei verschiedenen Körpern an; sie sind Wechselwirkungskräfte und bilden deshalb kein Kräftegleichgewicht.
3. Auf das Auto selbst wirkt eine resultierende Kraft entgegen der Fahrtrichtung; das Auto wird stark abgebremst, seine Geschwindigkeit ändert sich sehr schnell.
4. Beim Fallschirmspringer mit konstanter Sinkgeschwindigkeit greifen Gewichtskraft und Luftwiderstandskraft am selben Körper an, sind gleich groß und entgegengesetzt gerichtet; die resultierende Kraft ist null, es liegt ein Kräftegleichgewicht vor.

### `ph11-a3-quiz-karussell-beschreibung` — 4 Punkte

Physik Klasse 11 – Test zu Aufgabe 3: Winkel- und Bahngeschwindigkeit auf dem Karussell beschreiben

1. Beide Kinder haben dieselbe Winkelgeschwindigkeit ω.
2. Begründung für ω: Die Verbindungslinien beider Kinder zum Zentrum drehen sich in derselben Zeit um denselben Drehwinkel, weil sich das Karussell als Ganzes dreht (gleiche Umlaufdauer).
3. Kind B am äußeren Rand hat die größere Bahngeschwindigkeit.
4. Begründung für v_B: Nach v_B = ω · r ist bei gleichem ω die Bahngeschwindigkeit beim größeren Radius größer; gleichwertig: Kind B legt in derselben Zeit auf dem größeren Kreis einen längeren Weg zurück.

### `ph11-a3-quiz-ursache-beschreibung` — 3 Punkte

Physik Klasse 11 – Test zu Aufgabe 3: Ursache der Kreisbewegung beschreiben

1. Bei der Kreisbewegung ändert sich ständig die Richtung der Geschwindigkeit, auch wenn ihr Betrag gleich bleibt.
2. Eine Änderung der Geschwindigkeit, auch nur ihrer Richtung, erfordert eine Kraft; ohne Kraft würde sich der Körper wegen seiner Trägheit geradlinig weiterbewegen.
3. Die Kraft (Zentripetalkraft) greift am Körper an und zeigt nach innen zum Kreismittelpunkt.

### `ph11-a3-quiz-schnur-beschreibung` — 3 Punkte

Physik Klasse 11 – Test zu Aufgabe 3: Bewegung nach dem Reißen der Schnur beschreiben

1. Die Kugel bewegt sich nach dem Reißen geradlinig weiter, also nicht mehr auf der Kreisbahn.
2. Sie bewegt sich tangential zur Kreisbahn in der Richtung, die ihre Geschwindigkeit im Moment des Reißens hatte.
3. Begründung: Ohne die Schnur wirkt keine Kraft mehr zum Kreismittelpunkt (keine Zentripetalkraft), die die Richtung der Geschwindigkeit ändert; wegen ihrer Trägheit behält die Kugel ihre momentane Bewegungsrichtung bei.

### `ph11-a4-quiz-hammerwurf-beschreibung` — 4 Punkte

Physik Klasse 11 – Test zu Aufgabe 4: Kräfte und Bewegung beim Hammerwurf beschreiben

1. Die Bahngeschwindigkeit der kreisenden Kugel zeigt tangential zur Kreisbahn (senkrecht zum Seil bzw. Radius).
2. Die Zentripetalkraft greift an der Kugel an und zeigt zum Kreismittelpunkt bzw. zur Werferin (entlang des Seils nach innen).
3. Nach dem Loslassen bewegt sich die Kugel geradlinig tangential weiter, also in der Richtung, die ihre Geschwindigkeit im Moment des Loslassens hatte.
4. Begründung: Nach dem Loslassen wirkt keine Kraft zum Kreismittelpunkt mehr, die die Richtung der Geschwindigkeit ändert; wegen ihrer Trägheit behält die Kugel ihre Bewegungsrichtung bei.

### `ph11-a4-quiz-radius-beschreibung` — 4 Punkte

Physik Klasse 11 – Test zu Aufgabe 4: Abhängigkeit der Zentripetalkraft vom Radius beschreiben

1. Ben hat recht, wenn die Winkelgeschwindigkeit ω (bzw. Umlaufdauer oder Frequenz) gleich bleibt: Dann gilt F_Z ~ r.
2. Begründung für gleiches ω: Auf dem größeren Kreis ist der Körper bei gleichem ω schneller (v_B = ω · r), deshalb ist eine größere Kraft nötig.
3. Ben hat nicht recht, wenn die Bahngeschwindigkeit v_B gleich bleibt: Dann wird F_Z mit größerem Radius kleiner, F_Z ~ 1/r.
4. Begründung für gleiches v_B: Auf dem größeren Kreis ändert sich die Richtung der Geschwindigkeit in derselben Zeit weniger stark (kleineres Δv); gleichwertig: Auf dem kleineren Kreis ist die Richtungsänderung stärker und erfordert eine größere Kraft.

### `ph11-a4-quiz-seil-beschreibung` — 3 Punkte

Physik Klasse 11 – Test zu Aufgabe 4: Kräftegleichgewicht oder Wechselwirkung beim Hammerwurf begründen

1. Mia hat nicht recht: Die beiden Kräfte sind zwar gleich groß und entgegengesetzt gerichtet, bilden aber ein Wechselwirkungspaar.
2. Begründung: Die Kräfte greifen an verschiedenen Körpern an (eine an der Kugel, eine am Seil), ein Kräftegleichgewicht verlangt Kräfte am selben Körper.
3. An der Kugel wirkt nur die Kraft des Seils zum Kreismittelpunkt; die resultierende Kraft auf die Kugel ist nicht null, deshalb ändert sich die Richtung ihrer Geschwindigkeit ständig (Kreisbewegung statt geradliniger Bewegung).

### `ph11-a4-und-experiment-quiz-experiment-beschreibung` — 4 Punkte

Physik Klasse 11 – Aufgabe 4 und Experiment: Das phyphox-Experiment

1. Das Smartphone ist sicher auf einer waagerechten Kreisbahn befestigt, seine Sensoren liegen außerhalb der Drehachse.
2. Die Winkelgeschwindigkeit wird verändert und bei verschiedenen möglichst gleichmäßigen Drehungen gemessen; der Radius bleibt gleich.
3. Der Beschleunigungssensor misst den Betrag der Zentripetalbeschleunigung, wobei die Erdbeschleunigung herausgerechnet ist.
4. Das Gyroskop bzw. der Drehratensensor misst die Winkelgeschwindigkeit.

### `ph11-a4-und-experiment-quiz-kraft-beschreibung` — 3 Punkte

Physik Klasse 11 – Aufgabe 4 und Experiment: Von der Beschleunigung zur Kraft

1. Nach dem zweiten Newtonschen Gesetz gilt für die radiale resultierende Kraft F_Z = m · a_Z; die Kraft verursacht die nach innen gerichtete Beschleunigung.
2. Bei bekannter Masse erhält man den Kraftbetrag durch Multiplikation der gemessenen Zentripetalbeschleunigung mit der Masse.
3. Bei gleichbleibender Masse sind Kraft und Beschleunigung proportional. Die Multiplikation mit dem konstanten Faktor m erhält die Abhängigkeit von der Winkelgeschwindigkeit.

### `ph11-a4-und-experiment-quiz-diagramme-beschreibung` — 4 Punkte

Physik Klasse 11 – Aufgabe 4 und Experiment: Messdiagramme begründen

1. In Diagramm A liegen die Punkte näherungsweise auf einer Geraden durch den Ursprung, wenn a_Z über omega² aufgetragen wird.
2. Daraus folgt a_Z proportional zu omega², also ein quadratischer Zusammenhang mit omega, näherungsweise im Rahmen der Messunsicherheit.
3. In Diagramm B liegen die Punkte auf einer gekrümmten Kurve statt auf einer Ursprungsgeraden. Daher besteht keine direkte Proportionalität a_Z zu omega.
4. Der Radius bleibt gleich, denn a_Z = r · omega² enthält r als Proportionalitätsfaktor.

### `ph11-a5-quiz-kurve-beschreibung` — 4 Punkte

Physik Klasse 11 – Quiz zu Aufgabe 5: Auto und Hammerwurf

1. Beim Auto ist die Haftreibungskraft zwischen Reifen und Fahrbahn die reale Kraft.
2. Die Haftreibungskraft wirkt zum Kurvenmittelpunkt und verändert fortlaufend die Fahrtrichtung; sie übernimmt die Rolle der Zentripetalkraft.
3. Beim Hammerwurf wirkt die Zugkraft des Seils auf die Kugel; auch ihre Gewichtskraft wird berücksichtigt.
4. Die nach innen gerichtete resultierende Kraft aus Seilzugkraft und Gewichtskraft übernimmt die Rolle der Zentripetalkraft und verändert die Bewegungsrichtung der Kugel.

### `ph11-a5-quiz-naesse-beschreibung` — 4 Punkte

Physik Klasse 11 – Quiz zu Aufgabe 5: Dieselbe Kurve bei Nässe

1. Bei Nässe ist die Haftreibungszahl kleiner.
2. Bei unveränderter Normalkraft wird die maximal mögliche Haftreibungskraft kleiner: F_Haft,max = μ m g.
3. Bei gleicher Masse, Geschwindigkeit und gleichem Radius bleibt die benötigte Zentripetalkraft gleich; sie kann nun die maximale Haftreibungskraft übersteigen.
4. Die Geschwindigkeit wird rechtzeitig vor der Kurve verringert, dadurch sinkt die benötigte Zentripetalkraft.

### `ph11-a5-quiz-masse-beschreibung` — 4 Punkte

Physik Klasse 11 – Quiz zu Aufgabe 5: LKW und kleines Auto

1. Die Behauptung ist allein aufgrund der größeren Masse nicht gerechtfertigt; eine größere Masse bedeutet im verwendeten Modell keine kleinere Grenzgeschwindigkeit.
2. Bei gleichem Radius und gleicher Geschwindigkeit wächst die benötigte Zentripetalkraft proportional zur Masse: F_Z = m v_B² / r.
3. Bei gleicher Haftreibungszahl wächst die maximal mögliche Haftreibungskraft ebenfalls proportional zur Masse: F_Haft,max = μ m g.
4. Die Masse kürzt sich aus der Grenzbedingung. Auf ebener Straße ist die Grenzgeschwindigkeit bei gleichem Radius und gleicher Haftreibungszahl gleich; unterschiedliche reale Kontaktbedingungen bleiben als Modellgrenze möglich.

### `ph11-kreisbewegungen-zentripetalkraft-beschreibung` — 5 Punkte

Physik Klasse 11 – Kreisbewegung: Geschwindigkeitsvektor und Zentripetalkraft beschreiben

1. Der Geschwindigkeitsvektor beziehungsweise die Bewegungsrichtung beginnt am bewegten Körper.
2. Der Geschwindigkeitsvektor verläuft tangential zur Kreisbahn oder berührt sie am Körper.
3. Der Vektor der Zentripetalkraft beginnt am bewegten Körper.
4. Der Vektor der Zentripetalkraft zeigt zum Kreismittelpunkt, zur Kreismitte oder zum Zentrum.
5. Der Vektor der Zentripetalkraft ist nach innen beziehungsweise radial nach innen gerichtet.

### `ph11-zentripetalkraft-herleitung-dv` — 3 Punkte

Physik Klasse 11 – Zentripetalkraft: Konstruktion von Δv beschreiben

1. v1 und v2 werden parallel verschoben, sodass sie im selben Anfangspunkt beginnen.
2. Δv verbindet die beiden Pfeilspitzen.
3. Δv zeigt von der Spitze von v1 zur Spitze von v2 (gleichwertig: v1 + Δv = v2 oder Δv = v2 − v1).

### `ph11-zentripetalkraft-herleitung-naeherung` — 2 Punkte

Physik Klasse 11 – Zentripetalkraft: Näherung Bogen gleich Sehne begründen

1. Δt bzw. der Winkel α ist sehr klein, B liegt sehr nah bei A.
2. Dann ist der Bogen kaum gekrümmt, Bogen Δx und Strecke Δs sind nahezu gleich lang.

### `ph11-zentripetalkraft-herleitung-aehnlichkeit` — 3 Punkte

Physik Klasse 11 – Zentripetalkraft: Ähnlichkeit der Dreiecke begründen

1. Beide Dreiecke sind gleichschenklig (r1 = r2, Beträge von v1 und v2 gleich).
2. Der Winkel zwischen v1 und v2 ist gleich dem Winkel α zwischen r1 und r2, weil die Geschwindigkeit senkrecht auf dem Radius steht.
3. Ein passender Ähnlichkeitssatz wird genannt: SWS (gleiches Schenkelverhältnis und eingeschlossener Winkel) oder WW (gleicher Spitzenwinkel ergibt gleiche Basiswinkel).

### `sql-b2-3` — 3 Punkte

Informatik Klasse 10 – SQL Blatt 2 Aufgabe 3: SELECT-Anweisung beschreiben

1. Die Abfrage liest Daten aus users beziehungsweise der Mitgliedertabelle.
2. Ausgegeben werden Benutzernamen/username und Geburtstage beziehungsweise Geburtsdaten/birthday.
3. Berücksichtigt werden nur Mitglieder, die nicht in Berlin wohnen.

### `inf9-db2-beschreibe-projektion` — 3 Punkte

Informatik Klasse 9 – Datenbanken Aufgabe 2: Projektion beschreiben

1. Die Abfrage liest Daten aus der Tabelle users.
2. Ausgegeben wird username beziehungsweise der Benutzername.
3. Ausgegeben wird birthday beziehungsweise der Geburtstag oder das Geburtsdatum.

### `inf9-db2-beschreibe-sortierung` — 3 Punkte

Informatik Klasse 9 – Datenbanken Aufgabe 2: Sortierung beschreiben

1. Die Abfrage liest Daten aus users und gibt Benutzernamen/username sowie Körpergröße/centimeters aus.
2. Die Ergebniszeilen beziehungsweise Mitglieder werden nach Körpergröße/centimeters sortiert.
3. Die Sortierung ist absteigend beziehungsweise beginnt mit den größten Mitgliedern oder Werten.

### `inf9-db2-beschreibe-distinct` — 3 Punkte

Informatik Klasse 9 – Datenbanken Aufgabe 2: DISTINCT beschreiben

1. Die Daten stammen aus users.
2. Ausgegeben werden Wohnorte beziehungsweise city; beide Bezeichnungen sind gleichwertig.
3. Jeder unterschiedliche Wohnort wird nur einmal ausgegeben; der Fachbegriff Ergebnisrelation ist nicht erforderlich.

### `inf9-db2-beschreibe-limit` — 3 Punkte

Informatik Klasse 9 – Datenbanken Aufgabe 2: LIMIT beschreiben

1. Die Abfrage wählt die Spalte username aus users aus beziehungsweise gibt sie aus; „nur“ oder „einzige“ muss nicht ausdrücklich genannt werden, sofern keine weiteren Ausgabespalten behauptet werden.
2. Die Benutzernamen werden aufsteigend beziehungsweise alphabetisch nach username sortiert.
3. Die Ausgabe wird auf die ersten drei Zeilen der sortierten Benutzernamen begrenzt; die Reihenfolge der Sätze ist frei.

### `inf9-db3-beschreibe-where` — 3 Punkte

Informatik Klasse 9 – Datenbanken Aufgabe 3: WHERE beschreiben

1. Die Daten stammen aus users beziehungsweise der Mitgliedertabelle; eine sinngemäße Beschreibung als Daten von Nutzern, Benutzern oder Mitgliedern genügt ebenfalls.
2. Die Ausgabespalten sind genau username und city, also Benutzername und Wohnort.
3. Nur Mitglieder mit Wohnort München werden ausgewählt.

### `sql-b3-1` — 3 Punkte

Informatik Klasse 10 – SQL Blatt 3 Aufgabe 1: MIN und AS beschreiben

1. Die Abfrage arbeitet mit users beziehungsweise der Mitgliedertabelle.
2. Ermittelt wird die kleinste gespeicherte Körpergröße.
3. Die Ergebnisspalte erhält die Überschrift kleinste_groesse beziehungsweise kleinste Größe.

### `sql-b3-3` — 3 Punkte

Informatik Klasse 10 – SQL Blatt 3 Aufgabe 3: ORDER BY und LIMIT beschreiben

1. Die Abfrage gibt sämtliche Angaben eines Mitglieds aus users beziehungsweise der Mitgliedertabelle aus.
2. Die Mitglieder werden nach dem Registrierungsdatum von neu nach alt geordnet, neueste zuerst.
3. Ausgegeben wird nur der erste Datensatz dieser Reihenfolge, also das zuletzt registrierte Mitglied.

### `inf10-db-a1-primaerschluessel` — 3 Punkte

Informatik Klasse 10 – Datenbanken Test zu Aufgabe 1: Notwendigkeit des Primärschlüssels beschreiben

1. Mit dem Primärschlüssel lässt sich jeder Datensatz eindeutig identifizieren, also genau ein bestimmter Datensatz finden oder ansprechen.
2. Andere Attribute wie Name oder Geburtsdatum können mehrfach vorkommen; ohne Primärschlüssel ließen sich gleich aussehende Datensätze nicht unterscheiden.
3. Dafür muss der Wert des Primärschlüssels eindeutig sein (UNIQUE) und darf nie leer sein (NOT NULL).

### `inf10-db-a2-aufteilung` — 3 Punkte

Informatik Klasse 10 – Datenbanken Test zu Aufgabe 2: Aufteilung in users und photos begründen

1. In einer gemeinsamen Tabelle würden Benutzerdaten wie username und email bei jedem Foto erneut gespeichert; das ist Redundanz.
2. Nach der Aufteilung stehen die Benutzerdaten nur einmal in users, eine Änderung erfolgt also nur an einer Stelle.
3. Dadurch werden Inkonsistenzen (widersprüchliche Daten) vermieden; zusätzlich sinken Speicherbedarf, Aufwand und Fehleranfälligkeit.

### `inf10-a3-quiz-foto-beschreibung` — 3 Punkte

Informatik Klasse 10 – Test zu Aufgabe 3: Neues Foto zuordnen

1. photos.user_id erhält den Wert 7.
2. Der Wert 7 in photos.user_id verweist auf Samiras Datensatz mit users.id = 7.
3. photos.id = 42 identifiziert das Foto selbst und kann deshalb die Zuordnung zu Samira nicht ersetzen.

### `inf10-a3-quiz-regal-beschreibung` — 3 Punkte

Informatik Klasse 10 – Test zu Aufgabe 3: 1:n-Beziehung im Bibliotheksbeispiel

1. Ein Regal kann mehrere Bücher enthalten.
2. Jedes Buch gehört beziehungsweise steht in genau einem Regal.
3. Im Klassendiagramm steht 1 direkt bei Regal und n direkt bei Buch.

### `inf9-dfd-zylinder-beschreibung` — 3 Punkte

Informatik Klasse 9 – Aufgabe 5a: Datenflussdiagramm zum Rohrvolumen beschreiben

1. Der Verteiler gibt die Höhe an beide Zweige weiter, beide Teilrechnungen verwenden dieselbe Höhe.
2. In jedem Zweig wird zuerst der Radius quadriert und das Ergebnis mit der Höhe multipliziert.
3. Die Funktion minus zieht den kleinen Wert vom großen ab; das Ergebnis beschreibt das Rohr zwischen großem und kleinem Zylinder.

### `ph11-haftreibung-kurvenfahrt-gefahren` — 6 Punkte

Physik Klasse 11 – Haftreibung in der Kurve: Gefahren und angepasstes Verhalten

1. Die Antwort erklärt, dass die Kurvenfahrt kritisch wird, wenn die benötigte Zentripetalkraft größer als die maximal verfügbare Haftreibung wird.
2. Hohe Geschwindigkeit wird als Gefahr erkannt; wegen vB² wächst die benötigte Zentripetalkraft quadratisch mit der Geschwindigkeit.
3. Ein kleiner Kurvenradius beziehungsweise eine enge Kurve wird als erhöhender Einfluss auf die benötigte Zentripetalkraft erkannt.
4. Eine kleinere Haftreibungszahl, etwa durch Nässe, Schnee, Eis oder geringe Griffigkeit, wird als verringernder Einfluss auf FHaft,max erkannt.
5. Als Regel wird abgeleitet, die Geschwindigkeit rechtzeitig vor beziehungsweise in der Kurve zu verringern und sie dem Radius anzupassen.
6. Als weitere Regel wird eine an Fahrbahn- und Reifenbedingungen angepasste, gleichmäßige Fahrweise ohne abrupte Lenk-, Brems- oder Beschleunigungsvorgänge beschrieben.

### `ph11-haftreibung-kurvenfahrt-massenunabhaengigkeit` — 5 Punkte

Physik Klasse 11 – Haftreibung in der Kurve: Massenunabhängigkeit im Modell

1. Der Ausdruck FZ = m · vB² / r beziehungsweise die proportionale Abhängigkeit der benötigten Kraft von m wird genannt oder korrekt beschrieben.
2. Der Ausdruck FHaft,max = μ · m · g beziehungsweise die proportionale Abhängigkeit der maximalen Haftreibung von m wird genannt oder korrekt beschrieben.
3. Die Masse wird als gleicher Faktor auf beiden Seiten der Grenzbedingung erkannt und gekürzt.
4. Als Ergebnis wird vB ≤ √(μ · g · r) oder gleichwertig erklärt, dass die Grenzgeschwindigkeit in diesem Modell keine Masse enthält.
5. Die Aussage wird auf passende Modellannahmen begrenzt: ebene, nicht überhöhte Straße; FN = m · g; gleicher Radius und gleiche Haftreibungszahl beziehungsweise vergleichbare Kontaktbedingungen; keine zusätzlichen vertikalen Kräfte oder aerodynamischen Effekte.

### `ph11-kettenkarussell-winkelgeschwindigkeit` — 5 Punkte

Physik Klasse 11 – Kettenkarussell: Veränderungen bei größerer Winkelgeschwindigkeit

1. Die Antwort beschreibt, dass die benötigte Zentripetalkraft FZ größer wird.
2. Die Antwort beschreibt, dass der Winkel α zwischen Kette und Senkrechter größer wird beziehungsweise die Sitze stärker ausgelenkt werden.
3. Die Antwort beschreibt, dass dadurch auch der Radius r der Kreisbahn größer wird.
4. Die Antwort beschreibt, dass die Seilkraft FS größer wird.
5. Die Antwort nennt, dass Masse m und Gewichtskraft FG unverändert bleiben. Die zusätzliche Nennung der unveränderten Kettenlänge ist nicht erforderlich.

### `ph11-kettenkarussell-zwei-sitzreihen` — 3 Punkte

Physik Klasse 11 – Kettenkarussell: Auslenkung zweier Sitzreihen

1. Die Antwort erkennt, dass die Sitze der äußeren Reihe einen größeren Bahnradius r haben.
2. Die Antwort begründet den Winkelvergleich über das Verhältnis tan α = FZ / FG = ω² · r / g oder fachlich gleichwertig. Die gleiche Winkelgeschwindigkeit darf aus der gemeinsamen Drehung folgen, ohne ausdrücklich genannt zu werden.
3. Die Antwort folgert, dass die äußere Reihe stärker ausgelenkt wird.

### `11-6-0-4a-code` — 3 Punkte

Informatik Klasse 11 Aufgabe 6.0 – 4A Auswahl und Ausgabe

1. petersHund.gibAlter() wird als tatsächlich erreichbarer Getteraufruf verwendet.
2. Der Rückgabewert dieses Getteraufrufs wird in einer ausführbaren println(...)-Ausgabe angezeigt, auch über eine korrekt zugewiesene Zwischenvariable.
3. Der Getteraufruf petersHund.gibAlter() ist syntaktisch plausibel vollständig, enthält die leeren Klammern und steht nach der Objekterzeugung.

### `11-6-0-5a-code` — 4 Punkte

Informatik Klasse 11 Aufgabe 6.0 – 5A Alter ändern

1. Ein ausführbarer Setter-Aufruf verändert petersHund.
2. Der Setter erhält den Wert 7 und steht nach dem vorgegebenen petersHund.setzeAlter(6).
3. Nach diesem Setter wird der tatsächliche Rückgabewert von petersHund.gibAlter() ausführbar ausgegeben.
4. Der tatsächliche Rückgabewert von inasHund.gibAlter() wird ebenfalls ausführbar ausgegeben. Beide Getter-Ausgaben stehen nach dem Setter; ihre Reihenfolge ist beliebig, und bis zu beiden Ausgaben bleibt inasHund unverändert.

### `11-6-0-5b-code` — 4 Punkte

Informatik Klasse 11 Aufgabe 6.0 – 5B Alter und Name ändern

1. Ein ausführbarer Setter-Aufruf verwendet setzeDaten an inasHund.
2. Die Argumente stehen gemäß Signatur in der Reihenfolge Alter 9, dann Name "Flocke".
3. Nach dem Setter ist ein tatsächlich erreichbarer Aufruf inasHund.zeigeDaten() vorhanden.
4. Die Wirkung auf genau dieses Objekt ist bis zur Anzeige unverfälscht; die gesetzten Werte werden nicht vorher zurückgeändert.

### `inf9-dfd-fehlersuche-gewinnspiel` — 3 Punkte

Informatik Klasse 9 – Aufgabe 5b: Fehler im Datenflussdiagramm zum Gewinnspiel finden

1. Der Vergleichsknoten ist mit größer gleich beschriftet, der Aufgabentext verlangt aber größer als 70.
2. Bei der Losnummer 70 liefert das Diagramm 10 Euro, richtig wären 0 Euro.
3. Die Korrektur besteht darin, den Vergleichsknoten auf größer zu ändern; der übrige Aufbau bleibt gleich.

### `11-6-1-if-code` — 3 Punkte

Informatik Klasse 11 Aufgabe 6.1 – 1B if-Block im zweiten Fall

1. Im zweiten Abschnitt nach dem Marker wird ein if-Bedingungsblock ausgeführt.
2. Die Bedingung vergleicht gewichtete_Summe_2 strikt mit theta_2; >= erfüllt den Lernauftrag nicht.
3. Im if-Block wird berechnete_ausgabe_2 auf 1 gesetzt.

### `11-6-1-ifelse-code` — 3 Punkte

Informatik Klasse 11 Aufgabe 6.1 – 2B if/else im zweiten Fall

1. Der markierte zweite Abschnitt enthält einen if- und else-Zweig.
2. Der if-Vergleich verwendet strikt >, sodass Gleichheit zum else-Zweig führt.
3. Der if-Zweig setzt 1 und der else-Zweig setzt 0.

### `11-6-1-elseif-code` — 3 Punkte

Informatik Klasse 11 Aufgabe 6.1 – 3B zweite else-if-Kette

1. delta_uebung == 1 wählt den Text Ausgabe zu klein.
2. else if mit delta_uebung == -1 wählt den Text Ausgabe zu groß.
3. Der else-Fall wählt Ausgabe passt; nur ein Zweig läuft.

### `11-6-1-for-code` — 3 Punkte

Informatik Klasse 11 Aufgabe 6.1 – 4B gezählte for-Schleife

1. Die gezählte Schleife startet bei 0, erhöht i und lässt mit i < 4 oder i <= 3 auch i = 3 zu.
2. Die Schleife erzeugt genau vier Zeilen Datenpunkt 0, Datenpunkt 1, Datenpunkt 2 und Datenpunkt 3.
3. Die Ausgabe verwendet innerhalb des Blocks dynamisch den aktuellen Zähler i; keine hart codierte zusätzliche Zeile.

## Verbindliche Hinweise und Vergleichsfälle: Datenbanken/SQL (12 Tasks)

Die folgenden Hinweise sind wörtliche `issues.missing`-Texte in Kriterienreihenfolge. Bei ausdrücklichem Widerspruch `wrong_relation` mit dem jeweiligen zweiten Text verwenden, sofern angegeben. „Positiv“ ist eine fachliche Vergleichsantwort mit voller Punktzahl; „Teilweise“ und „Falsch“ sind gezielte Prüfbeispiele. Aufgabe, Hilfen und Musterlösung der vorhandenen Seite bleiben unverändert.

| ID | `missing` 1 / 2 / 3 | Positiv; teilweise; falsch |
| --- | --- | --- |
| `sql-b2-3` | „Prüfe, aus welcher Tabelle die Abfrage liest.“ / „Sieh nach, welche zwei Angaben direkt hinter SELECT stehen.“ / „Erkläre die Bedingung hinter WHERE in eigenen Worten.“ | „Die Mitgliedertabelle liefert Benutzernamen und Geburtstage von Menschen außerhalb Berlins.“; „Es werden Benutzername und Geburtstag angezeigt.“; „Die Abfrage zeigt nur Berliner.“ |
| `inf9-db2-beschreibe-projektion` | „Prüfe den Tabellennamen hinter FROM.“ / „Nenne die erste ausgewählte Angabe hinter SELECT.“ / „Nenne auch die zweite ausgewählte Angabe hinter SELECT.“ | „Aus users werden Benutzername und Geburtsdatum ausgegeben.“; „Die Abfrage zeigt Benutzernamen aus users.“; „Die Abfrage zeigt alle Wohnorte.“ |
| `inf9-db2-beschreibe-sortierung` | „Prüfe, aus welcher Tabelle welche Angaben ausgegeben werden.“ / „Sieh nach, nach welcher Angabe ORDER BY ordnet.“ / „Erkläre, in welcher Richtung die Werte angeordnet werden.“ | „Aus users kommen Benutzername und Größe, nach Größe absteigend sortiert.“; „Die Mitglieder werden nach Größe sortiert.“; „Die kleinsten Mitglieder stehen zuerst.“ |
| `inf9-db2-beschreibe-distinct` | „Prüfe die Datenquelle hinter FROM.“ / „Sieh nach, welche Angabe hinter SELECT steht.“ / „Erkläre, was DISTINCT mit mehrfach vorkommenden Werten macht.“ | „Aus users wird jeder verschiedene Wohnort nur einmal gezeigt.“; „Aus users kommen die Wohnorte.“; „Jeder Wohnort erscheint so oft wie Mitglieder dort wohnen.“ |
| `inf9-db2-beschreibe-limit` | „Prüfe, welche Spalte aus welcher Tabelle ausgewählt wird.“ / „Erkläre die Sortierrichtung von ORDER BY.“ / „Verbinde LIMIT mit der vorherigen Sortierung: Welche Zeilen bleiben übrig?“ | „Die ersten drei alphabetisch geordneten Benutzernamen aus users werden gezeigt.“; „Die Benutzernamen aus users werden alphabetisch sortiert.“; „Es werden drei zufällige Namen gezeigt.“ |
| `inf9-db3-beschreibe-where` | „Prüfe die Tabelle hinter FROM.“ / „Nenne beide Angaben hinter SELECT.“ / „Erkläre, welche Datensätze die WHERE-Bedingung durchlässt.“ | „Aus users werden Benutzername und Wohnort der Mitglieder aus München gezeigt.“; „Die Abfrage zeigt Benutzername und Wohnort.“; „Es werden nur Mitglieder aus Berlin angezeigt.“ |
| `sql-b3-1` | „Prüfe, auf welche Tabelle sich FROM bezieht.“ / „Erkläre die Wirkung von MIN auf die Körpergrößen.“ / „Prüfe, welche Überschrift AS der Ergebnisspalte gibt.“ | „Aus users wird die kleinste Körpergröße mit dem Spaltennamen kleinste_groesse ausgegeben.“; „Die Abfrage ermittelt die kleinste Körpergröße.“; „Sie ermittelt die größte Größe.“ |
| `sql-b3-3` | „Prüfe, welche Angaben das Sternchen auswählt und aus welcher Tabelle.“ / „Erkläre die Reihenfolge nach dem Registrierungsdatum.“ / „Verbinde LIMIT 1 mit der Reihenfolge: Welcher Datensatz bleibt?“ | „Alle Angaben des zuletzt registrierten Mitglieds aus users werden gezeigt, weil nach Datum neueste zuerst sortiert und auf eine Zeile begrenzt wird.“; „Die Mitglieder werden neueste zuerst sortiert.“; „Es erscheint das älteste Mitglied.“ |
| `inf10-db-a1-primaerschluessel` | „Erkläre, wozu ein eindeutiger Schlüssel für einen einzelnen Datensatz dient.“ / „Überlege, weshalb Name oder Geburtstag als Schlüssel unsicher sein können.“ / „Nenne beide Bedingungen, die ein Primärschlüsselwert erfüllen muss.“ | „Der Primärschlüssel findet genau einen Datensatz, auch wenn Namen doppelt sind; er ist eindeutig und nie leer.“; „Der Schlüssel identifiziert einen Datensatz eindeutig.“; „Der Name reicht immer als Primärschlüssel.“ |
| `inf10-db-a2-aufteilung` | „Vergleiche, wie oft dieselben Benutzerdaten in einer gemeinsamen Fototabelle stehen.“ / „Erkläre, wie viele Stellen bei einer Änderung der Benutzerdaten bearbeitet werden müssen.“ / „Beschreibe, welcher Widerspruch durch die Aufteilung vermieden wird.“ | „In einer Tabelle wären Nutzerdaten pro Foto wiederholt; in users stehen sie einmal und widersprüchliche Kopien entfallen.“; „Benutzerdaten stehen in users nur einmal.“; „Jedes Foto braucht einen neuen Benutzer-Datensatz.“ |
| `inf10-a3-quiz-foto-beschreibung` | „Prüfe, welcher Fremdschlüsselwert zum Benutzer gehört.“ / „Erkläre, auf welchen Datensatz dieser Fremdschlüssel verweist.“ / „Unterscheide den Schlüssel des Fotos vom Verweis auf die Person.“ | „Für das Foto steht photos.user_id auf 7 und verweist auf Samira mit users.id 7; photos.id 42 identifiziert nur das Foto.“; „photos.user_id muss 7 sein.“; „photos.id 42 ist der Verweis auf Samira.“ |
| `inf10-a3-quiz-regal-beschreibung` | „Betrachte, wie viele Bücher in einem Regal stehen können.“ / „Prüfe, zu wie vielen Regalen ein einzelnes Buch gehört.“ / „Ordne die Kardinalitätszahlen den richtigen Enden der Beziehung zu.“ | „Ein Regal enthält mehrere Bücher, jedes Buch gehört zu einem Regal; 1 steht bei Regal und n bei Buch.“; „Ein Regal kann viele Bücher enthalten.“; „n steht bei Regal und 1 bei Buch.“ |

Bei `wrong_relation`: „Prüfe die Richtung der Bedingung oder Beziehung im Arbeitsauftrag.“ gilt nur, wenn die Antwort die jeweilige Richtung tatsächlich falsch behauptet. Spezifisch für Sortierung: „Prüfe, ob ASC und DESC dieselbe Reihenfolge ergeben.“; für Fremdschlüssel: „Unterscheide den Primärschlüssel des Fotos vom Fremdschlüssel zum Benutzer.“
## Verbindliche Hinweise und Vergleichsfälle: 19 Codeaufgaben

Jede nummerierte Anweisung ist wörtlich `issues.missing` für das gleich nummerierte Kriterium. Für belegten falschen Code `wrong_logic` mit derselben Anweisung verwenden, sofern unten kein genauerer Satz steht. Kommentare, Zeichenketten, unerreichbare Zweige und später überschriebene Zuweisungen liefern keinen positiven Beleg. Gleichwertige ausführbare Lösungen zählen. Bei Syntax-/Typfehlern zuerst den betroffenen Schritt nennen, nicht alle Codepunkte löschen.

### `10-2a`, `10-2b`, `10-2c` — Roboter-Mauer

| ID | `missing` 1 bis 6 (verbindlicher Wortlaut) | Vergleichsfälle |
| --- | --- | --- |
| `10-2a` | 1 „Erzeuge den Roboter an einer Position innerhalb seiner Welt.“; 2 „Wiederhole Legen und Gehen, bis die Reihe vor der Wand endet.“; 3 „Prüfe vor jedem Schritt, ob der Weg zur Wand noch frei ist.“; 4 „Lege auf den vorgesehenen Feldern Ziegel ab.“; 5 „Bewege den Roboter innerhalb der Wiederholung weiter.“; 6 „Prüfe die Reihenfolge der Befehle am letzten Feld vor der Wand.“ | Positiv: Robot in gültiger Welt, Schleife mit sicherer Wandprüfung, `hinlegen()` und `schritt()` in kollisionsfreier Reihenfolge. Teilweise: nur ein Ziegel und ein Schritt ohne Schleife. Falsch: `while(istWand()) schritt()` führt in die Wand. |
| `10-2b` | 1 „Bearbeite auch die übrigen drei Randseiten.“; 2 „Wiederhole die Arbeit entlang jeder einzelnen Seite bis zur Wand.“; 3 „Drehe den Roboter an jeder erreichten Ecke passend weiter.“; 4 „Sorge dafür, dass alle vier Seiten durchlaufen werden.“; 5 „Prüfe, ob Legen und Gehen auf jeder Seite in der passenden Reihenfolge stehen.“; 6 „Prüfe den letzten Schritt vor jeder Wand und das Ende der Wiederholung.“ | Positiv: vier Seiten mit sicherer Innenwiederholung und Eckdrehung. Teilweise: sichere Ziegelreihe nur an einer Seite. Falsch: viermalige Schleife ohne Eckdrehung kollidiert mit der Wand. |
| `10-2c` | 1 „Prüfe die Ziegelzahl auf jedem Mauerfeld.“; 2 „Führe den Roboter auf einer Spur neben den hohen Stapeln.“; 3 „Wiederhole das Belegen der Felder entlang einer Seite.“; 4 „Bearbeite auch die restlichen Randseiten.“; 5 „Prüfe Drehung und Spurwechsel an jeder Ecke.“; 6 „Prüfe, ob der nächste Schritt ohne Wand- oder Höhenkollision möglich ist.“ | Positiv: vier Ziegel pro Randfeld von Nachbarspur, alle vier Seiten sicher. Teilweise: korrekte Höhe auf nur einer Seite. Falsch: Roboter steigt auf einen vier Ziegel hohen Stapel. |

### `10-3a`, `10-3b` — Roboterwelt und Quader

| ID | `missing` in Kriterienreihenfolge | Vergleichsfälle |
| --- | --- | --- |
| `10-3a` | 1 „Deklariere eine Objektvariable mit dem geforderten Namen und Typ.“; 2 „Weise dieser Variablen ein neu erzeugtes Robot-Objekt zu.“; 3 „Prüfe die vier Konstruktorwerte, besonders Weltbreite und Welthöhe.“ | Positiv: `Robot dudu = new Robot(1, 1, 12, 12);`. Teilweise: `Robot dudu;` ohne Objekt. Falsch: `Robot dudu = new Robot(1, 1, 10, 10);`. |
| `10-3b` | 1 „Prüfe Länge und Breite der belegten Grundfläche.“; 2 „Prüfe die Höhe jedes der fünfzehn Stapel.“; 3 „Nutze Wiederholungen für Reihen und Felder statt nur einzelne Befehle.“; 4 „Lege Ziegel vom Nachbarfeld aus; prüfe dabei das Hindernis vor dem Roboter.“; 5 „Prüfe den Übergang von einer Reihe zur nächsten auf Lücken und Doppelbelegung.“; 6 „Kontrolliere den vollständigen Weg innerhalb der 12-mal-12-Welt.“ | Positiv: 3×5 Felder mit je vier Ziegeln, sichere Nachbarspur und Reihenwechsel. Teilweise: 3×5 Felder mit je einem Ziegel. Falsch: `hinlegen(4)` auf 3×6 Feldern oder Schritt auf hohen Stapel. |

### `10-5a`, `10-5b`, `10-5c` — Java-Vererbung

| ID | `missing` in Kriterienreihenfolge | Vergleichsfälle |
| --- | --- | --- |
| `10-5a` | 1 „Ergänze in Tier die beiden Attribute und eine passende Datenausgabe.“; 2 „Leite Hund von Tier ab und ergänze nur sein eigenes Attribut.“; 3 „Prüfe die Unterklassen Katze und Delfin samt jeweils eigenem Attribut.“; 4 „Ordne die drei zusätzlichen Methoden ihren Klassen zu.“; 5 „Prüfe, welche Unterklassen `zeigeDaten()` überschreiben sollen.“; 6 „Prüfe Klammern, Typen und die Position der Attribute im Klassenrumpf.“ | Positiv: `Tier` hat `int alter`, `String name` und `zeigeDaten()`; Hund/Katze/Delfin erben von Tier mit `String rasse`/`boolean freigaenger`/`int tauchtiefe`, ihre passenden `void`-Methoden geben Text aus; nur Hund und Katze überschreiben `zeigeDaten()` mit eigenem Attribut. Teilweise: Tier und Hund richtig, Katze/Delfin fehlen. Falsch: geerbte `name`/`alter` in Hund erneut deklariert oder Java-Syntax blockiert Klassen. |
| `10-5b` | 1 „Erzeuge Objekte aller vier verlangten Klassen.“; 2 „Weise den Objekten ihre Werte mit der Punktnotation zu.“; 3 „Rufe Datenausgabe und die je passenden Spezialmethoden auf.“; 4 „Zeige mindestens einen Aufruf über eine Variable vom Typ Tier mit Unterklassenobjekt.“; 5 „Prüfe, ob jede aufgerufene Methode am statischen Variablentyp verfügbar ist.“ | Positiv: Objekte von Tier, Hund, Katze und Delfin erhalten Werte für eigene und geerbte Attribute; für jedes läuft `zeigeDaten()`, dazu `bellen()`/`miauen()`/`schwimmen()` am passenden Typ; `Tier t = new Hund(); t.zeigeDaten();` zeigt Polymorphie. Teilweise: alle vier Objekte, aber kein polymorpher Aufruf. Falsch: `Tier t = new Hund(); t.bellen();` als einziger Spezialaufruf. |
| `10-5c` | 1 „Ergänze eine neue Unterklasse von Tier mit eigener Eigenschaft oder Methode.“; 2 „Ergänze eine neue Unterklasse von Hund mit eigener Eigenschaft oder Methode.“; 3 „Nutze geerbte Attribute, statt sie in den neuen Klassen erneut anzulegen.“; 4 „Erzeuge beide neuen Objekte im Hauptprogramm und benutze ihre Methoden.“ | Positiv: zwei passende neue Unterklassen mit eigenen Ergänzungen und Testaufrufen. Teilweise: nur neue Tier-Unterklasse. Falsch: `class X extends Hund` deklariert `name` und `alter` erneut und wird nie benutzt. |

### `11-6-einfach-*` und `11-6-schwer-trainieren` — Perzeptron

| ID | `missing` in Kriterienreihenfolge | Vergleichsfälle |
| --- | --- | --- |
| `11-6-einfach-summe` | 1 „Lies beide Eingaben über die passenden Getter von `punkt`.“; 2 „Prüfe die Zuordnung jeder Eingabe zu ihrem Gewicht und addiere die Produkte.“; 3 „Bewahre die reellwertige Summe ohne Abschneiden auf eine Ganzzahl.“ | Positiv: Summe beider Getterprodukte als `double`. Teilweise: beide Getter, aber nur erstes Produkt. Falsch: Summe wird vor dem Vergleich nach `int` gecastet. |
| `11-6-einfach-ausgabe` | 1 „Prüfe den Ausgabewert oberhalb des Schwellenwerts.“; 2 „Prüfe den Ausgabewert unterhalb des Schwellenwerts.“; 3 „Behandle die Gleichheit mit dem Schwellenwert im passenden Zweig.“ | Positiv: `if (summe > theta) ...1... else ...0...`. Teilweise: nur `>`-Zweig setzt 1. Falsch: `>=` setzt bei Gleichheit 1. |
| `11-6-einfach-anpassung` | 1 „Prüfe bei `delta = 1` beide Gewichte mit ihrer jeweiligen Eingabe.“; 2 „Prüfe bei `delta = 1` das Vorzeichen der Schwellenwertänderung.“; 3 „Prüfe bei `delta = -1` beide Gewichte mit ihrer jeweiligen Eingabe.“; 4 „Prüfe bei `delta = -1` das Vorzeichen der Schwellenwertänderung.“; 5 „Sorge dafür, dass bei `delta = 0` alle Parameter unverändert bleiben.“ | Positiv: Bei `delta=1` werden `w_1,w_2` um `lernrate*x_1` bzw. `lernrate*x_2` erhöht und `theta` um `lernrate` gesenkt; bei `delta=-1` umgekehrt, bei `delta=0` bleiben alle drei unverändert. Teilweise: Gewichte richtig, `theta` falsch. Falsch: `w_1` wird mit zweiter Eingabe aktualisiert oder Nullfall verändert `theta`. |
| `11-6-schwer-trainieren` | 1 „Bewahre die gewichtete Summe ohne Ganzzahlverlust auf.“; 2 „Prüfe den strikten Schwellenwertvergleich und den Gleichheitsfall.“; 3 „Bilde `delta` aus Zielwert und berechneter Ausgabe in richtiger Reihenfolge.“; 4 „Passe jedes Gewicht mit der zugehörigen Eingabe an.“; 5 „Prüfe das Vorzeichen der Änderung von `theta`.“; 6 „Bei fehlerfreier Ausgabe dürfen die Parameter nicht verändert werden.“ | Positiv: `double a=w_1*x_1+w_2*x_2`; Ausgabe ist bei `a>theta` 1, sonst 0; `delta=label-ausgabe`; `w_i += delta*lernrate*x_i`, `theta -= delta*lernrate`; bei `delta=0` unverändert. Teilweise: Summe/Ausgabe richtig, aber `theta` mit falschem Vorzeichen. Falsch: `delta = ausgabe - label` oder Ausgabe bei Gleichheit 1. |

### `11-6-0-*` — Getter und Setter

| ID | `missing` in Kriterienreihenfolge | Vergleichsfälle |
| --- | --- | --- |
| `11-6-0-4a-code` | 1 „Rufe `gibAlter()` am verlangten Hundobjekt auf.“; 2 „Gib den tatsächlichen Rückgabewert ausführbar aus.“; 3 „Prüfe Klammern und Reihenfolge des Getteraufrufs nach der Objekterzeugung.“ | Positiv: `System.out.println(petersHund.gibAlter());` nach `new Hund`. Teilweise: Getteraufruf ohne Ausgabe. Falsch: nur Kommentar mit Gettertext oder Ausgabe der festen Zahl 5. |
| `11-6-0-5a-code` | 1 „Verändere `petersHund` durch einen erreichbaren Setteraufruf.“; 2 „Setze den neuen Wert nach dem vorgegebenen älteren Setteraufruf.“; 3 „Gib danach den aktuellen Getterwert von `petersHund` aus.“; 4 „Gib auch den aktuellen Getterwert von `inasHund` aus, ohne sie zuvor zu verändern.“ | Positiv: `petersHund.setzeAlter(7)` nach `setzeAlter(6)`, danach beide Getterausgaben. Teilweise: Setter auf 7, aber nur Peters Ausgabe. Falsch: feste Ausgabe `7` statt Getter oder Setter vor `setzeAlter(6)`. |
| `11-6-0-5b-code` | 1 „Rufe `setzeDaten` am verlangten Objekt auf.“; 2 „Prüfe Reihenfolge und Werte der beiden Setterargumente.“; 3 „Rufe danach `zeigeDaten()` für dasselbe Objekt auf.“; 4 „Prüfe, ob beide gesetzten Werte bis zur Anzeige bestehen bleiben.“ | Positiv: `inasHund.setzeDaten(9, "Flocke"); inasHund.zeigeDaten();`. Teilweise: Setter richtig, Anzeige fehlt. Falsch: Werte vor Anzeige zurückgesetzt. |

### `11-6-1-*` — Kontrollfluss

| ID | `missing` in Kriterienreihenfolge | Vergleichsfälle |
| --- | --- | --- |
| `11-6-1-if-code` | 1 „Ergänze im markierten zweiten Abschnitt einen ausführbaren `if`-Block.“; 2 „Vergleiche die zweite Summe strikt mit dem zweiten Schwellenwert.“; 3 „Setze die zweite Ausgabe im zutreffenden Zweig.“ | Positiv: `if (gewichtete_Summe_2 > theta_2) { berechnete_ausgabe_2 = 1; }` im zweiten Abschnitt. Teilweise: Block und Vergleich, aber keine Zuweisung. Falsch: `>=` statt `>` oder Änderung nur im ersten Abschnitt. |
| `11-6-1-ifelse-code` | 1 „Ergänze im markierten Abschnitt beide Zweige.“; 2 „Prüfe, welcher Zweig bei Gleichheit ausgeführt wird.“; 3 „Setze in jedem Zweig den passenden Ausgabewert.“ | Positiv: striktes `>` mit 1 im `if` und 0 im `else`. Teilweise: korrekter Vergleich, `else` fehlt. Falsch: `>=` macht Gleichheit zu 1. |
| `11-6-1-elseif-code` | 1 „Prüfe die Textausgabe für `delta_uebung == 1`.“; 2 „Ergänze einen zweiten bedingten Zweig für den negativen Delta-Wert.“; 3 „Prüfe den Text im abschließenden `else` und dass nur ein Zweig läuft.“ | Positiv: `if/else if/else` mit Texten zu klein/zu groß/passt. Teilweise: erster und letzter Zweig, `-1` fehlt. Falsch: drei unabhängige `if`, die bei einem Fall widersprüchliche Ausgaben erzeugen. |
| `11-6-1-for-code` | 1 „Prüfe Start, Schrittweite und Endbedingung des Zählers.“; 2 „Sorge für genau vier Datenpunkt-Zeilen.“; 3 „Nutze in der Ausgabe den aktuellen Zähler statt fester Zahlen.“ | Positiv: `for (int i=0; i<4; i++) println("Datenpunkt " + i);`. Teilweise: Schleife bis 3 statt 4. Falsch: viermal dieselbe hart codierte Zeile. |
## Verbindliche Hinweise und Vergleichsfälle: übrige Informatik-Beschreibungen (24 Tasks)

Jede nummerierte Anweisung ist wörtlich `issues.missing` für das gleich nummerierte Kriterium. Bei belegtem Widerspruch kann `wrong_relation` denselben Hinweis nutzen; die Rückmeldung zeigt trotzdem genau einen ersten offenen Schritt. Positive Fälle sind fachliche Minimalformulierungen, keine Pflichtwörter.

### Online-IDE Klasse 9 und 10

| ID | `missing` in Kriterienreihenfolge | Vergleichsfälle |
| --- | --- | --- |
| `b` (5) | 1 „Erkläre, was die erste Programmzeile erzeugt und wo es gespeichert wird.“; 2 „Unterscheide die drei Zahlen des Konstruktors nach ihrer Wirkung.“; 3 „Erkläre die Wirkung des `move`-Aufrufs.“; 4 „Prüfe die Wirkung von `setFillColor`.“; 5 „Beschreibe, was `destroy()` mit dem Kreis macht.“ | Positiv: `new Circle(200, 50, 50)` erzeugt einen Kreis an der angegebenen Position und Größe in `ball`; danach verschiebt `move(10, 10)` ihn, `setFillColor(Color.red)` färbt ihn rot und `destroy()` entfernt ihn. Teilweise: Erzeugung, Bewegung und Farbe, ohne Löschung. Falsch: `destroy()` erzeugt einen zweiten Kreis. |
| `c` (5) | 1 „Prüfe, welche Konstruktorzahl die waagerechte Lage verändert.“; 2 „Prüfe, welche Konstruktorzahl die senkrechte Lage verändert.“; 3 „Prüfe, welche Konstruktorzahl die Größe verändert.“; 4 „Verändere die erste Zahl von `move` einzeln und beschreibe die Verschiebung.“; 5 „Verändere die zweite Zahl von `move` einzeln und beschreibe die Verschiebung.“ | Positiv: Die drei Kreisargumente steuern x, y und Größe; die zwei `move`-Argumente die waagerechte und senkrechte Verschiebung. Teilweise: nur die drei Konstruktorzahlen richtig. Falsch: Die dritte Konstruktorzahl steuert die Farbe. |
| `2b` (5) | 1 „Erkläre den ersten Konstruktoraufruf mit Objekt und Werten.“; 2 „Vergleiche den zweiten Konstruktoraufruf mit dem ersten.“; 3 „Prüfe, auf welches Objekt der erste `zeigeDaten`-Aufruf wirkt.“; 4 „Prüfe, auf welches Objekt der zweite `zeigeDaten`-Aufruf wirkt.“; 5 „Erkläre die Wirkung des `belle`-Aufrufs beim richtigen Hund.“ | Positiv: `petersHund` bezeichnet Hund 5/Wuffti und `inasHund` Hund 8/Schnuffi; die jeweiligen `zeigeDaten()`-Aufrufe geben ihre Daten aus und `inasHund.belle()` lässt Inas Hund bellen. Teilweise: beide Objekte beschrieben, Ausgaben fehlen. Falsch: `inasHund.belle()` lässt Peters Hund bellen. |
| `1a` (5) | 1 „Prüfe, welches Objekt `new Kiste()` erzeugt.“; 2 „Erkläre die Rolle der Variablen `block`.“; 3 „Prüfe, welches Objekt `new Ball(100)` erzeugt.“; 4 „Erkläre die Rolle der Variablen `ball1`.“; 5 „Erkläre, wohin die Zahl beim Konstruktoraufruf übergeben wird.“ | Positiv: Beide neuen Objekte, beide Variablen und die Übergabe von 100 an Ball beschrieben. Teilweise: beide Objekte, aber keine Variablenrollen. Falsch: `ball1` ist eine Klasse statt einer Objektvariablen. |
| `1b` (5) | 1 „Verfolge die 100 vom Aufruf zum Ball-Konstruktor.“; 2 „Prüfe, welche Variable im Konstruktor diesen Wert empfängt.“; 3 „Erkläre die Wirkung von `startX` auf die Kreisposition.“; 4 „Nenne den Fachbegriff für `startX` in der Konstruktordeklaration.“; 5 „Unterscheide den übergebenen Wert vom Parameternamen.“ | Positiv: 100 ist das Argument für Parameter `startX` und bestimmt die horizontale Anfangslage. Teilweise: 100 bestimmt die x-Position, ohne Parameter/Argument. Falsch: 100 bestimmt die Farbe. |
| `1c` (5) | 1 „Erkläre, was eine Klasse für ihre Objekte festlegt.“; 2 „Ordne Ball und Kiste als Baupläne ein.“; 3 „Erkläre, was beim Erzeugen eines Objekts entsteht.“; 4 „Ordne `ball1` zum erzeugten Ballobjekt zu.“; 5 „Ordne `block` zum erzeugten Kisteobjekt zu.“ | Positiv: Ball/Kiste sind Klassen; `ball1`/`block` verweisen auf konkrete Instanzen. Teilweise: Definition Klasse/Objekt ohne Beispiele. Falsch: `ball1` ist die Klasse und Ball das Objekt. |
| `1f` (5) | 1 „Erkläre die Beziehung zwischen Ball und Actor bei `extends`.“; 2 „Ordne Ball als Ober- oder Unterklasse ein.“; 3 „Prüfe, welches Verhalten Ball von Actor übernehmen kann.“; 4 „Erkläre die Rolle von `act()` im Actor-Ablauf.“; 5 „Überlege, weshalb gemeinsames Actor-Verhalten nicht erneut geschrieben werden muss.“ | Positiv: Ball erbt als Unterklasse Actor-Verhalten, nutzt `act()` und spart Wiederholung. Teilweise: Ball erbt von Actor, ohne Wirkung zu erklären. Falsch: Actor erbt von Ball. |
| `10-4a` | 1 „Prüfe, welche Objekte das Hauptprogramm erzeugt.“; 2 „Erkläre, wofür die Werte in den Konstruktoraufrufen stehen.“; 3 „Vergleiche den Variablentyp mit der tatsächlichen Objektklasse.“; 4 „Beschreibe die Wirkung der wiederholten `zeigeInfos()`-Aufrufe.“ | Positiv: Das Hauptprogramm erzeugt Artikel- und Unterklassenobjekte mit Name, Preis, Gewicht und jeweiligen Zusatzwerten, speichert sie jeweils in einer `Artikel`-Variablen und `zeigeInfos()` zeigt je nach tatsächlicher Klasse andere Daten. Teilweise: Objekterzeugung und Werte, ohne Polymorphie. Falsch: Jede Variable hat den Typ der jeweiligen Unterklasse. |
| `10-4c` | 1 „Finde eine Artikel-Variable, die auf ein Unterklassenobjekt verweist.“; 2 „Prüfe, welche `zeigeInfos()`-Version beim Methodenaufruf ausgeführt wird.“; 3 „Erkläre die Funktion von `extends` in einer Unterklasse.“; 4 „Prüfe die Aufgabe von `super(...)` im Konstruktor.“; 5 „Erkläre, wie Überschreiben und Oberklassenvariable zusammenwirken.“ | Positiv: Bei `Artikel smart1 = new Smartphone(...)` verweist die Oberklassenvariable auf ein Unterklassenobjekt; `smart1.zeigeInfos()` führt die in Smartphone überschriebene Methode aus. `extends` bewirkt Vererbung, `super(...)` ruft den Oberklassenkonstruktor. Teilweise: Unterklassenvariable und Überschreiben, ohne `super`. Falsch: `zeigeInfos()` aus Artikel läuft immer unabhängig vom tatsächlichen Objekt. |
| `10-6b` | 1 „Bestimme Typ und Art des Werts von `maximaleVersuche`.“; 2 „Prüfe den Typ von `kiste` und worauf die Variable verweist.“; 3 „Prüfe den Typ von `ball` und worauf die Variable verweist.“; 4 „Unterscheide einfachen Werttyp und Klassentyp mit Objekterzeugung.“ | Positiv: `int` für Zahl, `Rectangle` und `Circle` als Objektverweise, Erzeugung mit `new`. Teilweise: drei Typen richtig, aber kein Unterschied einfacher Wert/Klasse. Falsch: `Rectangle` ist ein primitiver Ganzzahltyp. |
| `10-6e` | 1 „Prüfe, was die Variable `kiste` bezeichnet.“; 2 „Zerlege den Ausdruck an der Punktnotation.“; 3 „Ordne `rotate` der Klasse des tatsächlichen Objekts zu.“; 4 „Unterscheide Argument 45 vom Parameter `angleDeg`.“; 5 „Beschreibe die sichtbare Wirkung des Aufrufs.“ | Positiv: Rechteckobjekt in `kiste`, Aufruf seiner `rotate`-Methode mit Argument 45 für `angleDeg`, Drehung um 45°. Teilweise: Drehung richtig, Fachbegriffe fehlen. Falsch: `rotate` gehört zur Klasse Grafik und verändert nur die Zahl 45. |

### KI, Codierung und Datenflussdiagramme

| ID | `missing` in Kriterienreihenfolge | Vergleichsfälle |
| --- | --- | --- |
| `11-3a-f` | 1 „Vergleiche zunächst alle verfügbaren Merkmale.“; 2 „Bestimme für jedes Merkmal das passende Gütemaß.“; 3 „Erkläre die Auswahl des nächsten Knotens.“; 4 „Beschreibe, wie die Daten nach diesem Knoten aufgeteilt werden.“; 5 „Erkläre, wann und für welche Teilgruppen das Verfahren weitergeht.“ | Positiv: alle Merkmale auf Informationsgewinn prüfen, größtes wählen, Daten aufteilen, gemischte Gruppen rekursiv bearbeiten. Teilweise: größtes Merkmal wählen, ohne Teilgruppen. Falsch: immer das erste Merkmal wählen. |
| `inf11-a3a-quiz-informationsgewinn-beschreibung` | 1 „Zähle die Fehler vor dem Aufteilen anhand des häufigeren Labels.“; 2 „Zähle die Fehler in jeder der beiden Teilmengen getrennt.“; 3 „Addiere die beiden Fehlerzahlen nach dem Aufteilen.“; 4 „Bilde die Differenz zwischen Fehlerzahl vorher und nachher.“ | Positiv: vorher 4, danach rot 1 plus grün 1 = 2, Gewinn 2. Teilweise: vorher 4 und danach 2, ohne Differenz. Falsch: Gewinn 4 + 2 = 6. |
| `inf11-a3a-quiz-attributwahl-beschreibung` | 1 „Prüfe, ob die vorgeschlagene Zahl beide Labels und alle Teilmengen berücksichtigt.“; 2 „Vergleiche für jedes Attribut die Gesamtfehler vor und nach dem Aufteilen.“; 3 „Erkläre, nach welchem Vergleich das Merkmal gewählt wird.“ | Positiv: eine Teilgruppe reicht nicht; alle Fehler zählen, Informationsgewinn vergleichen, größten wählen. Teilweise: Kritik an Teilgruppe, keine Alternative. Falsch: Attribut mit meisten feindseligen Fischen wählen. |
| `inf11-a3a-quiz-vorgehen-beschreibung` | 1 „Beschreibe die Äste nach den Werten des gewählten Merkmals.“; 2 „Prüfe, wann aus einer Teilgruppe ein Blatt wird.“; 3 „Bestimme für gemischte Teilgruppen die Güte der übrigen Merkmale neu.“; 4 „Erkläre, wann die weitere Aufteilung endet.“ | Positiv: Werteäste, reine Gruppen als Blätter, gemischte neu bewerten, bis alle Äste enden. Teilweise: Aufteilung in Äste ohne Fortsetzung. Falsch: alle Gruppen nach dem ersten Knoten ungeprüft als Blätter. |
| `11-4-1` | 1 „Beschreibe den tatsächlich entstandenen ersten Split.“; 2 „Prüfe, ob ein einziger Split alle Trainingsfische trennen kann.“; 3 „Schlage eine weitere sinnvolle Aufteilung vor.“ | Positiv: Schuppenfarbe-Split mit Restfehler, größere Tiefe als Verbesserung. Teilweise: Baum beschrieben, ohne Fehlergrenze. Falsch: Tiefe 1 klassifiziert sicher alle Daten korrekt. |
| `11-4-2` | 1 „Vergleiche die Trainingsfehler bei den verschiedenen Baumtiefen.“; 2 „Vergleiche die Testgenauigkeit für Tiefe eins bis drei.“; 3 „Erkläre, ob weniger Trainingsfehler hier bessere Testgenauigkeit bedeuten.“ | Positiv: Trainingsfehler sinken, Testgenauigkeit bleibt 1–3 gleich, kein direkter Zusammenhang. Teilweise: nur Trainingsfehler sinken. Falsch: weniger Trainingsfehler beweisen bessere Testgenauigkeit. |
| `11-4-3` | 1 „Vergleiche zuerst die Testgenauigkeit beider Bäume.“; 2 „Prüfe, ob dieselben Testfische falsch eingeordnet werden.“; 3 „Erkläre, welche Information die Gesamtgenauigkeit nicht zeigt.“ | Positiv: beide 80 %, aber T3/T4 verschieden falsch, daher Genauigkeit allein unvollständig. Teilweise: nur beide 80 %. Falsch: gleiche Genauigkeit bedeutet identische Fehler. |
| `11-7-1` | 1 „Bestimme Abstände mit beiden Merkmalen des neuen Punkts.“; 2 „Wähle genau die fünf kleinsten Abstände.“; 3 „Zähle die Shirtgrößen unter diesen Nachbarn.“; 4 „Ordne die Mehrheitsgröße dem neuen Punkt zu.“ | Positiv: Aus Körpergröße und Brustumfang werden alle Abstände berechnet; die fünf kleinsten gehören zu drei M und zwei S, daher erhält der neue Punkt M. Teilweise: fünf Nachbarn gefunden, keine Mehrheit. Falsch: S, weil zwei S unter den Nachbarn sind. |
| `11-8-1` | 1 „Nenne die zu wählende Nachbarzahl.“; 2 „Begründe die Wahl mit allen fünf Validierungsfällen.“; 3 „Vergleiche das Ergebnis mit den übrigen angegebenen k-Werten.“ | Positiv: k=3 liefert 5/5, k=1/5/7 je 3/5. Teilweise: k=3, ohne Tabellenvergleich. Falsch: k=7 ist am besten. |
| `inf11-cod-a1-ascii-unicode` | 1 „Prüfe Bitzahl und Anzahl der ASCII-Zeichen.“; 2 „Nenne eine konkrete Grenze des ASCII-Zeichenvorrats.“; 3 „Erkläre, wofür Unicode Zeichenkennungen bereitstellt.“; 4 „Vergleiche die ersten 128 Zeichen beider Systeme.“; 5 „Unterscheide Zeichennummer und Speicherform am Beispiel UTF-8.“ | Positiv: ASCII 7 Bit/128 Zeichen ohne Umlaute, Unicode viele Schriften/Emojis, erste 128 gleich, UTF-8 1–4 Byte. Teilweise: ASCII und Unicode-Umfang richtig, Speicherform fehlt. Falsch: Unicode ist grundsätzlich ein festes 16-Bit-Zeichenformat. |
| `11-5-1` | 1 „Prüfe, welche Parameter beim Training verändert werden.“; 2 „Vergleiche Sollwert und berechnete Ausgabe als Auslöser der Änderung.“; 3 „Erkläre, worin das Trainingsergebnis gespeichert ist.“; 4 „Grenze Rechenregeln von menschlichem Verstehen ab.“ | Positiv: Fehler zwischen Ziel und Ausgabe ändert Gewichte/Schwelle; das Gelernte steckt in Parametern, kein Bewusstsein. Teilweise: Gewichte werden geändert, ohne Fehlerbezug. Falsch: Perzeptron versteht die Beispiele wie ein Mensch. |
| `inf9-dfd-zylinder-beschreibung` | 1 „Verfolge den Höhenwert in beide Zweige.“; 2 „Prüfe die Reihenfolge von Quadrieren und Multiplizieren in jedem Zweig.“; 3 „Erkläre, welcher Wert bei `minus` von welchem abgezogen wird.“ | Positiv: gleiche Höhe in beiden Zweigen, Radien quadriert und mit Höhe multipliziert, kleiner vom großen Wert abgezogen. Teilweise: zwei Zweige ohne Subtraktion. Falsch: großer Wert wird vom kleinen abgezogen. |
| `inf9-dfd-fehlersuche-gewinnspiel` | 1 „Vergleiche das Zeichen im Vergleichsknoten mit dem Wortlaut der Gewinnregel.“; 2 „Teste den Grenzfall mit der Losnummer 70.“; 3 „Ändere nur den Vergleich, der diesen Grenzfall falsch behandelt.“ | Positiv: `>=` ist falsch; 70 bekommt fälschlich 10 Euro; `>` behebt es. Teilweise: erkennt falsches `>=`, ohne Grenzfall. Falsch: Losnummer 70 muss 10 Euro erhalten. |
## Verbindliche Hinweise und Vergleichsfälle: Physik Klasse 11 (24 Tasks)

Die nummerierten Anweisungen sind wörtlich `issues.missing` in Kriterienreihenfolge; bei belegtem Gegenbeispiel `wrong_relation` mit dem zutreffenden Hinweis verwenden. Formeln sind nur Pflicht, wenn der Auftrag dies verlangt; fachlich gleichwertige Worte zählen. Vektor- und Kräftebezeichnungen dürfen mit vorhandener Physiknotation gerendert werden, der Textinhalt bleibt gleich.

### Grundaufgaben, Photovoltaik und Kreisbewegung

| ID | `missing` in Kriterienreihenfolge | Vergleichsfälle |
| --- | --- | --- |
| `ph11-photovoltaik-schaltplan-beschreibung` | 1 „Ordne die Solarzelle als Quelle im geschlossenen Stromkreis ein.“; 2 „Beschreibe die Rolle des veränderlichen Widerstands bei den Messungen.“; 3 „Prüfe Einbauort und Messgröße des Amperemeters.“; 4 „Prüfe Einbauort und Messgröße des Voltmeters.“ | Positiv: Solarzelle als Quelle, veränderlicher Widerstand für U-I-Paare, A in Reihe für Strom, V parallel zur Zelle für Spannung. Teilweise: Zelle und Widerstand richtig, Messgeräte fehlen. Falsch: Amperemeter parallel und Voltmeter in Reihe. |
| `ph11-kreisbewegungen-bewegung-diagramm-beschreibung` | 1 „Lies im ersten Zeitabschnitt Anfangs- und Endgeschwindigkeit ab.“; 2 „Prüfe, ob die Geschwindigkeit im zweiten Abschnitt steigt oder konstant bleibt.“; 3 „Vergleiche im dritten Abschnitt Anfangs- und Endgeschwindigkeit.“; 4 „Prüfe den Verlauf im vierten Abschnitt.“; 5 „Beschreibe die Änderung bis zum Stillstand im letzten Abschnitt.“ | Positiv: I (0–3 min) 0→15 m/s beschleunigt, II (3–6 min) 15 m/s konstant, III (6–9 min) 15→25 m/s beschleunigt, IV (9–12 min) 25 m/s konstant, V (12–15 min) 25→0 m/s verzögert. Teilweise: I–III richtig, IV/V fehlen. Falsch: Abschnitt V ist gleichförmig. |
| `ph11-kreisbewegungen-kraeftegleichgewicht-beschreibung` | 1 „Prüfe die resultierende Kraft auf den ruhenden Körper.“; 2 „Prüfe die resultierende Kraft beim Auto mit konstanter Geschwindigkeit.“; 3 „Vergleiche Betrag und Richtung der Kräfte am jeweils selben Körper.“; 4 „Erkläre die Auswirkung der Kraftsumme auf den Bewegungszustand.“ | Positiv: Tischkörper und Auto haben jeweils gleich große Gegenkräfte, Summe null, daher Ruhe bzw. konstante Geschwindigkeit. Teilweise: Tischkörper im Gleichgewicht, Auto fehlt. Falsch: konstante Geschwindigkeit erfordert eine vorwärts gerichtete resultierende Kraft. |
| `ph11-wdh2-quiz-crashtest-beschreibung` | 1 „Beschreibe beide Kräfte zwischen Auto und Wand mit Richtung und Betrag.“; 2 „Prüfe, an welchen Körpern diese beiden Kräfte angreifen.“; 3 „Bestimme die resultierende Kraft und Bewegungsänderung des Autos.“; 4 „Vergleiche damit die Kräfte am Fallschirmspringer bei konstanter Sinkgeschwindigkeit.“ | Positiv: Auto/Wand-Wechselwirkung gleich groß gegengerichtet an verschiedenen Körpern, Auto gebremst; Fallschirmspringer Kräfte am selben Körper im Gleichgewicht. Teilweise: Auto/Wand-Paar richtig, Fallschirmspringer fehlt. Falsch: Auto/Wand-Kräfte heben sich am Auto auf. |
| `ph11-kreisbewegungen-zentripetalkraft-beschreibung` | 1 „Setze den Anfang des Geschwindigkeitspfeils an den Körper.“; 2 „Prüfe seine Richtung relativ zur Kreisbahn.“; 3 „Setze auch den Anfang des Kraftpfeils an den Körper.“; 4 „Prüfe, wohin der Kraftpfeil zeigt.“; 5 „Beschreibe die Richtung der Kraft relativ zum Radius.“ | Positiv: beide Pfeile beginnen am Körper; Geschwindigkeit tangential, Kraft radial nach innen zum Mittelpunkt. Teilweise: Geschwindigkeit richtig, Kraftpfeil fehlt. Falsch: Geschwindigkeit zeigt radial zur Mitte und Kraft tangential. |
| `ph11-zentripetalkraft-herleitung-dv` | 1 „Verschiebe die beiden Geschwindigkeitsvektoren parallel an denselben Anfangspunkt.“; 2 „Verbinde danach die beiden Pfeilspitzen.“; 3 „Prüfe die Pfeilrichtung der Differenz von v₁ zu v₂.“ | Positiv: gemeinsamer Anfangspunkt, Δv von Spitze v₁ zu Spitze v₂. Teilweise: parallele Verschiebung, keine Differenzrichtung. Falsch: Δv von v₂ zu v₁. |
| `ph11-zentripetalkraft-herleitung-naeherung` | 1 „Prüfe, wie nah die Punkte bei sehr kleinem Zeitintervall beieinander liegen.“; 2 „Vergleiche dann den kurzen Kreisbogen mit der direkten Strecke.“ | Positiv: kleines Δt/α bringt B nahe A, kurzer Bogen und Sehne nahezu gleich. Teilweise: Δt klein, ohne Bogenvergleich. Falsch: Bogen und Sehne sind bei jedem Winkel exakt gleich. |
| `ph11-zentripetalkraft-herleitung-aehnlichkeit` | 1 „Prüfe, weshalb beide betrachteten Dreiecke jeweils gleichschenklig sind.“; 2 „Vergleiche die Winkel zwischen den Radien und zwischen den Geschwindigkeiten.“; 3 „Nenne einen passenden Ähnlichkeitssatz und begründe ihn.“ | Positiv: beide gleichschenklig, gleicher eingeschlossener Winkel wegen Senkrechtstellung, SWS oder WW. Teilweise: gleicher Winkel, kein Ähnlichkeitssatz. Falsch: Ähnlichkeit allein, weil beide Dreiecke irgendwie zwei Seiten haben. |

### Wiederholungsquiz zu Aufgabe 3 und 4

| ID | `missing` in Kriterienreihenfolge | Vergleichsfälle |
| --- | --- | --- |
| `ph11-a3-quiz-karussell-beschreibung` | 1 „Vergleiche den Drehwinkel beider Kinder pro Zeit.“; 2 „Begründe den Winkelvergleich mit ihrer gemeinsamen Drehung.“; 3 „Vergleiche die Wege der Kinder pro Zeit.“; 4 „Beziehe den unterschiedlichen Radius in die Weg- oder Formelbetrachtung ein.“ | Positiv: gleiche Winkelgeschwindigkeit, außen größere Bahngeschwindigkeit wegen größerem Radius. Teilweise: beide drehen sich gleich oft, ohne Bahngeschwindigkeit. Falsch: äußeres Kind hat größere Winkelgeschwindigkeit. |
| `ph11-a3-quiz-ursache-beschreibung` | 1 „Beschreibe, was sich an der Geschwindigkeit trotz konstantem Betrag ändert.“; 2 „Überlege, was für diese Richtungsänderung erforderlich ist.“; 3 „Bestimme Richtung und Angriffspunkt dieser Kraft.“ | Positiv: Richtung ändert sich, Kraft am Körper nach innen. Teilweise: Richtungsänderung ohne Kraft. Falsch: bei konstantem Tempo wirkt keine Kraft. |
| `ph11-a3-quiz-schnur-beschreibung` | 1 „Vergleiche die Bahn nach dem Reißen mit der vorherigen Kreisbahn.“; 2 „Richte die anschließende Bewegung nach der momentanen Geschwindigkeit aus.“; 3 „Erkläre, welche Kraft nach dem Reißen fehlt und was Trägheit bewirkt.“ | Positiv: geradlinig tangential wegen fehlender Zentripetalkraft und Trägheit. Teilweise: tangential, ohne Begründung. Falsch: Kugel fliegt radial nach außen. |
| `ph11-a4-quiz-hammerwurf-beschreibung` | 1 „Beschreibe die momentane Geschwindigkeitsrichtung an der Kugel.“; 2 „Prüfe die Kraftrichtung des gespannten Seils auf die Kugel.“; 3 „Vergleiche die Flugrichtung direkt nach dem Loslassen mit der momentanen Geschwindigkeit.“; 4 „Erkläre, warum die Kreisbahn ohne Seilzug endet.“ | Positiv: Geschwindigkeit tangential, Seilkraft nach innen, danach tangential gerade wegen fehlender Kraft. Teilweise: beide Richtungen richtig beschrieben, Bewegung nach dem Loslassen fehlt. Falsch: Kugel fliegt nach Loslassen entlang des Seils radial heraus. |
| `ph11-a4-quiz-radius-beschreibung` | 1 „Prüfe Bens Aussage bei festgehaltener Winkelgeschwindigkeit.“; 2 „Begründe die Radiuswirkung in diesem Fall über Bahngeschwindigkeit oder Formel.“; 3 „Prüfe dieselbe Aussage bei festgehaltener Bahngeschwindigkeit.“; 4 „Begründe die andere Radiuswirkung über Richtungsänderung oder Formel.“ | Positiv: bei gleichem ω F proportional r; bei gleichem v F proportional 1/r, jeweils begründet. Teilweise: nur erster Fall. Falsch: F wächst mit r auch bei konstantem v. |
| `ph11-a4-quiz-seil-beschreibung` | 1 „Ordne die beiden entgegengesetzten Kräfte als Paar ein.“; 2 „Prüfe, ob die Kräfte am selben Körper angreifen.“; 3 „Bestimme die resultierende Kraft und Bewegungsänderung der Kugel.“ | Positiv: Wechselwirkungspaar an Kugel/Seil, kein Gleichgewicht der Kugel, Richtung ändert sich. Teilweise: Kräfte an verschiedenen Körpern, ohne Bewegungsfolge. Falsch: Kräfte heben sich an der Kugel auf. |
| `ph11-a4-und-experiment-quiz-experiment-beschreibung` | 1 „Beschreibe eine sichere waagerechte Befestigung mit Sensor außerhalb der Achse.“; 2 „Nenne die veränderte und die konstant gehaltene Größe.“; 3 „Ordne dem Beschleunigungssensor die passende Messgröße zu.“; 4 „Ordne dem Drehratensensor die passende Messgröße zu.“ | Positiv: Smartphone sicher waagerecht befestigt, ω variiert bei festem r, Sensoren messen a_Z ohne g bzw. ω. Teilweise: Aufbau und Variation, Sensorzuordnung fehlt. Falsch: Radius und ω gleichzeitig variieren und aus einem Messwert Kausalität folgern. |
| `ph11-a4-und-experiment-quiz-kraft-beschreibung` | 1 „Verbinde radiale Kraft und Beschleunigung mit Newtons zweitem Gesetz.“; 2 „Erkläre die Umrechnung des gemessenen Beschleunigungswerts bei bekannter Masse.“; 3 „Begründe, wie die konstante Masse den Verlauf gegenüber ω beeinflusst.“ | Positiv: F_Z = m a_Z, gemessenes a mal m, gleicher ω-Verlauf bei fester m. Teilweise: Formel ohne Bezug auf Messung. Falsch: Kraft ist Beschleunigung geteilt durch Masse. |
| `ph11-a4-und-experiment-quiz-diagramme-beschreibung` | 1 „Prüfe, ob Diagramm A näherungsweise eine Ursprungsgerade zeigt.“; 2 „Leite daraus den Zusammenhang mit dem Quadrat von ω ab.“; 3 „Vergleiche damit Form und Aussage von Diagramm B.“; 4 „Erkläre die Rolle des konstanten Radius in der Formel.“ | Positiv: A a_Z gegen ω² linear durch Ursprung, daher quadratisch in ω; B gekrümmt, r konstant. Teilweise: A richtig, B fehlt. Falsch: B zeigt direkte Proportionalität a_Z zu ω. |

### Wiederholungsquiz zu Aufgabe 5, Haftreibung und Kettenkarussell

| ID | `missing` in Kriterienreihenfolge | Vergleichsfälle |
| --- | --- | --- |
| `ph11-a5-quiz-kurve-beschreibung` | 1 „Bestimme die reale seitliche Kraft zwischen Reifen und Fahrbahn.“; 2 „Erkläre ihre Richtung und Wirkung auf das Auto.“; 3 „Nenne die auf die Kugel wirkenden realen Kräfte.“; 4 „Beschreibe die nach innen gerichtete resultierende Kraft und ihre Wirkung.“ | Positiv: Haftreibung lenkt Auto nach innen; beim Hammerwurf liefern Seilkraft und Gewichtskraft die resultierende nach innen wirkende Kraft. Teilweise: Auto vollständig, Hammerwurf fehlt. Falsch: eine zusätzliche Kraftart ‚Zentripetalkraft‘ wirkt unabhängig von Reifen und Seil. |
| `ph11-a5-quiz-naesse-beschreibung` | 1 „Vergleiche die Haftreibungszahl bei trockener und nasser Straße.“; 2 „Prüfe, wie sich dadurch die maximal mögliche Haftreibung ändert.“; 3 „Vergleiche diesen Grenzwert mit der weiterhin benötigten Kurvenkraft.“; 4 „Leite eine rechtzeitige Anpassung der Geschwindigkeit ab.“ | Positiv: μ kleiner, F_Haft,max kleiner, benötigte F bei gleicher Fahrt gleich, vor Kurve langsamer. Teilweise: Nässe senkt Haftung, ohne Kraftvergleich. Falsch: bei Nässe sinkt die benötigte Zentripetalkraft automatisch. |
| `ph11-a5-quiz-masse-beschreibung` | 1 „Prüfe, ob die Masse allein die behauptete Grenzgeschwindigkeit festlegt.“; 2 „Vergleiche die benötigte Kraft bei größerer Masse.“; 3 „Vergleiche zugleich die maximal verfügbare Haftreibung.“; 4 „Setze beide Größen in der Grenzbedingung zueinander und beachte die Modellannahmen.“ | Positiv: beide Kräfte wachsen mit m, m kürzt sich, gleiche Grenzgeschwindigkeit im ebenen Modell bei gleichem μ/r. Teilweise: nur F_Z wächst mit m. Falsch: LKW muss wegen höherer Masse grundsätzlich langsamer sein. |
| `ph11-haftreibung-kurvenfahrt-gefahren` | 1 „Vergleiche benötigte Zentripetalkraft mit maximaler Haftreibung.“; 2 „Prüfe die Wirkung höherer Geschwindigkeit in der Kraftformel.“; 3 „Prüfe die Wirkung eines engeren Kurvenradius.“; 4 „Prüfe, wie Nässe oder Eis die verfügbare Haftreibung verändert.“; 5 „Leite aus Geschwindigkeit und Radius eine Fahrregel ab.“; 6 „Leite aus den Kontaktbedingungen eine weitere vorsichtige Fahrregel ab.“ | Positiv: Grenzüberschreitung, v², kleiner r und μ erhöhen Gefahr; rechtzeitig langsamer und gleichmäßig fahren. Teilweise: hohe Geschwindigkeit und Nässe, keine Regeln. Falsch: abruptes Bremsen in der Kurve erhöht die verfügbare Haftreibung. |
| `ph11-haftreibung-kurvenfahrt-massenunabhaengigkeit` | 1 „Schreibe die benötigte Zentripetalkraft mit Masse auf.“; 2 „Schreibe die maximal mögliche Haftreibung mit Masse auf.“; 3 „Vergleiche den gemeinsamen Faktor beider Seiten.“; 4 „Formuliere die daraus folgende Geschwindigkeitsgrenze.“; 5 „Nenne die Voraussetzungen, unter denen dieser Vergleich gilt.“ | Positiv: m v²/r ≤ μ m g, m kürzt sich, v≤√(μgr) auf ebener Straße bei gleichem μ/r. Teilweise: beide Formeln, ohne Kürzung. Falsch: größere Masse senkt im Modell stets die Grenzgeschwindigkeit. |
| `ph11-kettenkarussell-winkelgeschwindigkeit` | 1 „Prüfe die benötigte Kraft bei schnellerer Drehung.“; 2 „Vergleiche den Auslenkwinkel vor und nach der Änderung.“; 3 „Prüfe, wie sich dadurch der Bahnradius verändert.“; 4 „Vergleiche die Seilkraft in beiden Zuständen.“; 5 „Prüfe, welche Größen durch die schnellere Drehung nicht verändert werden.“ | Positiv: F_Z, Winkel, Radius und Seilkraft wachsen; Masse/Gewicht bleiben gleich. Teilweise: Winkel und Radius wachsen, Kräfte fehlen. Falsch: Gewichtskraft steigt mit der Drehzahl. |
| `ph11-kettenkarussell-zwei-sitzreihen` | 1 „Vergleiche die Abstände beider Sitzreihen zur Drehachse.“; 2 „Nutze das Verhältnis von radialer zu vertikaler Kraft für den Winkelvergleich.“; 3 „Leite daraus die stärker ausgelenkte Sitzreihe ab.“ | Positiv: äußere Reihe hat größeren r und bei gleichem ω größeres tan α, daher stärkere Auslenkung. Teilweise: äußere Reihe hat größeren r, ohne Winkelbegründung. Falsch: beide Reihen sind wegen gleicher Masse gleich weit ausgelenkt. |
## Mechanische Abnahme

- Alle 79 IDs haben `feedbackCriteria` und `maxFeedbackHints: 1`; die Legacy-Fixture ist leer, die fünf alten Kriterienkonfigurationen unverändert. Keine neue Seite, kein Menüeintrag, Lehrercode oder Sicherungsblatt.
- Kriterienzahl, `maxPoints`, `rubric` und `expectedAspects` stimmen je Task überein; sieben vorgenannte Aufgaben haben genau fünf Punkte. 19 Codeaufgaben behalten `responseType: code`.
- Build, Servertests, betroffene Clienttests, ZIP und SHA256 sowie `git diff --check` erfolgreich. ZIP-Upload und Modell-Live-Test nur nach tatsächlichem Nachweis als abgeschlossen melden. Keine `apps-script/`-Änderung.
- Bei Wiederholungsquizzen nur die jeweilige KI-Erstwertung zurückgesetzt; Texte und lokale Aufgabenwerte bleiben. Stale Responses setzen weder Punkte noch Freigaben.

## Fachliche Abnahme

- Jeder Punkt ist vom Originalauftrag gedeckt. Gleichwertige Worte und Codeformen zählen; Widersprüche entwerten das betroffene Kriterium.
- Für jede ID positive, unvollständige und falsche fachliche Vergleichsantworten sowie jedes einzeln offene Kriterium, Varianten, Belegfehler und erneute Bearbeitung prüfen. Bei Code Kontrollfluss, Syntax, Typfehler, Kommentare/Strings und funktional gleichwertige Lösungen prüfen.
- Bei Physik Originalbelege und fachlich gleichwertige Bezeichnungen, bei SQL Datenquelle, Projektion, Filter und Sortierrichtung gemäß Auftrag werten. Kein heimlicher Stilpunkt.

## Aufwand

Standard-Builder genügt für die Konfigurationsblöcke. Client-Versionierung und lokale Nachprüfungen benötigen sorgfältige, getrennte Integrationstests.






