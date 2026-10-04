# Prompts für die KNN-Lernmodule (Informatik 11, KI)

Zwei getrennte Loop-Aufrufe, nacheinander ausführen. Prompt B erst starten,
wenn Aufgabe 7 abgenommen ist, weil Aufgabe 8 deren Komponenten und Daten
wiederverwendet.

Festgelegte Entscheidungen (Rückfragen vom 03.10.2026):

- Aufteilung auf zwei Module, je eine Lehrplan-Kompetenz
- keine externen Werkzeuge (Scratch/RAISE, Excel), alles interaktiv im Modul
- Manhattan-Metrik und Normierung gehören dazu; Regression nur als „Für die
  Schnellen“; Leave-One-Out entfällt
- nur ungerade k; bleibt trotzdem ein Gleichstand, entscheidet der
  nächstgelegene Nachbar
- kein Sicherungsblatt, kein Wiederholungs-Quiz (nicht beauftragt)

---

## Prompt A – Aufgabe 7

```text
/lernmodul-loop Erstelle in faecher/informatik/klasse-11/1-Kuenstliche-Intelligenz/ das neue Lernmodul „Aufgabe 7 – Der k-nächste-Nachbarn-Algorithmus: Idee und Abstand“ (aufgabe7.html, Ressourcen in einem neuen Ordner knn/ analog zu perzeptron/).

FACHLICHE GRUNDLAGE
material-perzeptron/KI@Informatik11_Arbeitsheft.pdf, PDF-Seiten 20–22 (Abschnitt 2.3: Klassifikation mit KNN, gängige Abstandsmaße, Anwendung Schulshirtgrößen). Die PDF-Seiten 23–33 behandelt das Folgemodul Aufgabe 8 und gehören nicht hierher. Die externen Werkzeuge des Heftes (Scratch/RAISE-Intent-Classifier, Excel-Mappen, Arbeitsaufträge 6 und 7) werden nicht verwendet. Was dort in Excel passiert, wird interaktiv im Modul umgesetzt.

LEHRPLANBEZUG
„erläutern die Funktionsweise/Idee eines ausgewählten Algorithmus maschinellen Lernens (k-nächste-Nachbarn) allgemein und an konkreten Beispielen“.

VORWISSEN DER KLASSE (anknüpfen, nicht neu einführen)
Überwachtes Lernen, Label, Trainings- und Testdaten (Aufgaben 0–3c); Hyperparameter am Beispiel Baumtiefe (Aufgabe 4); Merkmale werden zu Punkten im Koordinatensystem (Aufgabe 5, Reiter 1); Satz des Pythagoras aus Mathematik.

DURCHGÄNGIGER KONTEXT: SCHULSHIRTS
Klassen S, M, L; x = Körpergröße in cm, y = Brustumfang in cm. Trainingsdaten aus dem Heft (S. 22):
165|87 S, 190|116 L, 180|102 M, 176|95 S, 160|85 S, 180|105 M, 185|109 M, 186|113 L, 192|125 L, 190|121 L, 177|101 M, 170|92 S, 196|128 L, 174|97 S, 188|117 L.
Diese 15 Punkte in knn/data/shirts.mjs ablegen, damit Aufgabe 8 sie wiederverwenden kann. Die KNN-Logik (Abstände, Rangliste, Mehrheitsentscheid mit Gleichstandsregel) in knn/logic/knn.mjs. Alle im Modul behaupteten Abstände, Nachbarn und Klassifikationen per Unit-Test absichern (Muster: perzeptron/tests/).

GLEICHSTANDSREGEL (gilt in Aufgabe 7 und 8)
Im Modul werden nur ungerade k angeboten (1, 3, 5, 7). Bleibt trotzdem ein Gleichstand, entscheidet der nächstgelegene Nachbar. Bei drei Klassen ist das möglich, etwa bei k = 3 mit einem Nachbarn je Klasse. Die SuS erarbeiten an einer kurzen Frage, warum bei zwei Klassen ein ungerades k gewählt wird (k = 2, je ein Nachbar pro Klasse); danach wird die Regel ausdrücklich eingeführt.

REITERSTRUKTUR (verbindlich, kompakt halten)
1. „Welche Größe passt?“ (entdecken)
   Streudiagramm der Trainingsdaten, eine neue Person wird eingeblendet (Vorschlag 183|106, eindeutig M-Umgebung). Die SuS ordnen die Person einer Größe zu und wählen eine Begründung (Multiple Choice mit Kästchen). Fehlvorstellungen sind wählbar, z. B. „weil M in den Trainingsdaten am häufigsten vorkommt“ oder „weil die Person größer als 180 cm ist“. Weder der Name KNN noch der Fachbegriff Abstandsmaß fallen hier.
2. „Die k nächsten Nachbarn“ (verstehen)
   Dieselbe Grafik mit Auswahl k ∈ {1, 3, 5, 7}. Die k nächsten Nachbarn werden markiert: Verbindungslinien vom neuen Punkt, die die Punkte tatsächlich berühren, und eine Auszählung je Klasse. Der neue Punkt ist so gewählt, dass sich die Klasse mit k ändert. Vorschlag 186|110: k = 1 ergibt M, k = 3, 5, 7 ergeben L (Planer prüft per Test). Aufträge: die Klasse für k = 1 und k = 5 bestimmen, dann begründen, warum sich das Ergebnis ändert. Danach eine Sortieraufgabe (Drag-and-Drop): die Schritte des Algorithmus in die richtige Reihenfolge bringen (Abstände zu allen Trainingsdaten berechnen → k nächste auswählen → häufigste Klasse unter ihnen bestimmen → neuen Punkt dieser Klasse zuordnen). Erst danach folgt der Merke-Kasten mit der Definition des KNN-Algorithmus. Anschließend die Gleichstandsfrage und die Regel.
3. „Wie misst man ‚nah‘? – Euklidischer Abstand“
   Zwei Punkte im Gitter, das rechtwinklige Dreieck lässt sich einblenden. Die SuS berechnen zwei Abstände selbst per Zahleneingabe: das erste Paar mit einem pythagoreischen Tripel (Differenzen 3 und 4), das zweite nicht ganzzahlig, auf zwei Nachkommastellen gerundet (Toleranz festlegen). Die Formel d = √((x₂ − x₁)² + (y₂ − y₁)²) darf vorher nirgends sichtbar sein, auch nicht in Hilfe 1 oder 2. Sie erscheint erst nach richtiger Lösung im Merke-Kasten. Gestufte Hilfen: Dreieck erkennen → Katheten als Differenzen der Koordinaten → Pythagoras ansetzen.
4. „Manhattan-Metrik“
   Stadtplan-Gitter wie im Heft. Die SuS berechnen den Manhattan-Abstand für ein Paar. Danach ein Vergleich an einem Beispiel, in dem der nächste Nachbar vom Abstandsmaß abhängt: P(0|0), A(3|3), B(5|0). Euklidisch ist A näher (≈ 4,24 gegenüber 5), nach Manhattan B (5 gegenüber 6). Multiple Choice „Welche Aussagen stimmen?“ mit eigenem Prüfen-Button, u. a. „Der Manhattan-Abstand ist nie kleiner als der euklidische Abstand“ (richtig) und „Der Manhattan-Abstand ist kürzer, weil er den Straßen folgt“ (Fehlvorstellung).
5. „Schulshirts klassifizieren“ (anwenden)
   Eine Tabelle der 15 Trainingsdaten mit Abstandsspalte zu einem neuen Datenpunkt, den der Planer festlegt: Unter den 5 nächsten Nachbarn kommen mindestens zwei Klassen vor, damit wirklich ausgezählt werden muss. Zwei Abstände sind leer und werden von den SuS euklidisch berechnet, die übrigen sind vorgegeben. Die SuS markieren die k = 5 nächsten Nachbarn durch Antippen der Zeilen und bestimmen die Shirtgröße. Abschluss des Reiters ist eine Beschreibe-Aufgabe über die vorhandene KI-Auswertung (Skriptserver, wie in Aufgabe 4/5): „**Erläutere** an diesem Beispiel, wie der KNN-Algorithmus die Shirtgröße bestimmt.“
6. „Abschlussquiz“
   Nach AGENTS.md und manifest-quizaufgaben.txt, 5–6 Fragen nur zu den Reitern 1–5.

NICHT VORWEGNEHMEN (kommt in Aufgabe 8)
Validierungsdaten, systematische Wahl des „besten“ k, zu kleines/zu großes k als Fehlerquelle, Konfusionsmatrix für KNN, Normierung, Regression.

KEIN Sicherungsblatt und KEIN Wiederholungs-Quiz (nicht beauftragt).

WIEDERVERWENDUNG (Planer prüft und legt konkret fest)
Seitengerüst, Reiter, gestufte Hilfen, Speicherung der Zwischenstände und semantische Auswertung aus aufgabe5.html, perzeptron/ui/task5.mjs und perzeptron/ui/semantic-answer.mjs; SVG-Koordinatensystem aus Aufgabe 5, Reiter 1; Drag-and-Drop nach setupCloze in was-ist-ki/ui/task0.mjs; Abschlussquiz nach Informatik 10, Datenbanken (#final-quiz). Menüeintrag in faecher/informatik/klasse-11/index.html hinter Aufgabe 6, Rücklink „Zu Aufgabe 6“.

PROJEKTVORGABEN, DIE NICHT IN DEN MANIFESTEN STEHEN
- Reiter sind jederzeit frei wechselbar, ohne Freischaltlogik. Jeder Reiter endet mit einem Weiter-Button.
- Grafik und Bedienelemente sind gleichzeitig ohne Scrollen sichtbar (Laptop und iPad), die Bedienelemente stehen neben der Grafik. Kurze Optionen stehen nebeneinander.
- Klassen im Diagramm nie nur über die Farbe unterscheiden: Farbe plus Form (z. B. S Kreis, M Dreieck, L Quadrat) und eine Legende.
- Verbindungslinien und Pfeile beginnen und enden genau an den Punkten, die sie verbinden.
- Multiple-Choice-Fragen außerhalb des Abschlussquiz haben je Frage einen eigenen Prüfen-Button.
- Typische Fehlvorstellungen sind als Optionen wählbar und bekommen je eine eigene Rückmeldung. Feedback erklärt das fachliche Warum, statt nur die Lösung zu nennen.
- Drag-and-Drop mit Pointer Events (Maus und Touch). Karten lassen sich zurückziehen (zurück in den Speicher oder belegtes Feld zweimal antippen). Ablagefelder haben mindestens die Größe von .formula-slot (ca. 46–48 px hoch, ≥ 76 px breit). Alternative Bedienung: Karte antippen, dann Feld antippen.
- Formeln und Merksätze, die eine Aufgabe erarbeiten lässt, sind vorher nirgends sichtbar.
- Operatoren in Arbeitsaufträgen fett. Aufträge zu einer interaktiven Grafik stehen über der Grafik.

TYPISCHE FEHLVORSTELLUNGEN (für Aufgaben und Quiz nutzen)
„Es gewinnt die Klasse, die in allen Trainingsdaten am häufigsten ist.“ – „k = 1 ist immer am genauesten, weil der nächste Punkt am ähnlichsten ist.“ – „Der Abstand hängt nur von einem Merkmal ab (nur Körpergröße).“ – „Der Manhattan-Abstand ist kürzer als der euklidische.“ – „KNN zieht wie das Perzeptron eine Trenngerade.“
```

---

## Prompt B – Aufgabe 8

```text
/lernmodul-loop Erstelle in faecher/informatik/klasse-11/1-Kuenstliche-Intelligenz/ das neue Lernmodul „Aufgabe 8 – KNN: k wählen, testen und Grenzen erkennen“ (aufgabe8.html). Ressourcen im vorhandenen Ordner knn/. Die Komponenten aus Aufgabe 7 (k-Grafik, knn/logic/knn.mjs, knn/data/shirts.mjs, Tabellen, Tests) wiederverwenden und nur bei Bedarf erweitern, ohne Aufgabe 7 zu verändern.

FACHLICHE GRUNDLAGE
material-perzeptron/KI@Informatik11_Arbeitsheft.pdf, PDF-Seiten 23–33 (2.4 Lernprozess, 2.5 Einflussfaktoren, 2.6 Regression). NICHT aufnehmen: Kreuzvalidierung und Leave-One-Out-Verfahren (S. 26–28, Arbeitsauftrag 10), die Excel-Arbeitsaufträge 8–12 und die Hauspreis-Excel-Mappe. Die Inhalte dieser Aufträge werden, soweit unten vorgesehen, interaktiv im Modul umgesetzt.

LEHRPLANBEZUG
„analysieren den Einfluss von Trainingsdaten und Parametern auf die Zuverlässigkeit der Ergebnisse eines Verfahrens maschinellen Lernens“.

VORWISSEN DER KLASSE
Aufgabe 7 vollständig (KNN, k, Gleichstandsregel, euklidischer Abstand, Manhattan-Metrik, Schulshirt-Daten); Konfusionsmatrix 2×2 und Genauigkeit aus Aufgabe 3c (Zeilen erwartetes Label, Spalten berechnetes Label); Baumtiefe als Hyperparameter und Vergleich Trainings-/Testfehler aus Aufgabe 4.

GLEICHSTANDSREGEL wie in Aufgabe 7: nur ungerade k; bei verbleibendem Gleichstand entscheidet der nächstgelegene Nachbar. Die Heftbeispiele mit k = 2 entfallen.

REITERSTRUKTUR (verbindlich, kompakt halten)
1. „Was passiert beim Training?“
   KNN „lernt“ nur dadurch, dass die Trainingsdaten gespeichert werden; gerechnet wird erst, wenn ein neuer Punkt klassifiziert wird. Dazu der Kontrast zu Entscheidungsbaum (ein Baum entsteht) und Perzeptron (Gewichte werden angepasst). Das Phasenmodell (Heft S. 23: Vorbereitung, Training, Testen, produktiver Betrieb) als eigene SVG nachbauen, nicht als Bild aus dem PDF. Zuordnung per Drag-and-Drop: Tätigkeiten den Phasen zuordnen, z. B. „Daten aufteilen“, „k festlegen“, „Trainingsdaten speichern“, „Genauigkeit bestimmen“, „Shirtgröße für eine neue Schülerin vorhersagen“. Eine Multiple-Choice-Frage mit der wählbaren Fehlvorstellung „KNN berechnet beim Training eine Trenngerade wie das Perzeptron“.
2. „Zu klein oder zu groß?“ (entdecken)
   k-Grafik aus Aufgabe 7 mit zwei Situationen:
   (a) Ausreißer: Ein S-Punkt liegt zwischen M-Punkten. Bei k = 1 wird der neue Punkt falsch klassifiziert, bei k = 3 richtig (Heft S. 31: neuer Punkt 181|101, Ausreißer 179|100 mit Label S).
   (b) Zu großes k: Ist k so groß wie die Anzahl aller Trainingsdaten, wird immer die insgesamt häufigste Klasse vorhergesagt, egal wo der Punkt liegt.
   Den Shirt-Datensatz dafür bei Bedarf um wenige Punkte ergänzen (eigene Datei in knn/data/, per Test abgesichert). Die SuS beschreiben die Auswirkung (Multiple Choice mit eigenem Prüfen-Button). Ergebnis des Reiters: k muss systematisch gewählt werden, als Überleitung zu Reiter 3.
3. „k mit Validierungsdaten bestimmen“
   Aufteilung in Trainings-, Validierungs- und Testdaten (Kreisdiagramm wie Heft S. 24) und das Vorgehen von S. 25. Zuerst das Heftbeispiel nachvollziehen: Trainingsdaten orange (3|2), (5|3); blau (3,5|3), (2|2,5), (1,5|1); Validierungspunkt P(3,5|2) mit Label blau. Ergebnis: k = 1 falsch, k = 3 korrekt, k = 5 korrekt. Danach die Schulshirts: eine Tabelle mit 4–5 Validierungspunkten × k ∈ {1, 3, 5, 7}. Einige Zellen tragen die SuS selbst ein (korrekt/falsch, mithilfe der k-Grafik), die übrigen sind vorgegeben. Die Daten sind so gewählt, dass ein k klar am besten abschneidet. Die SuS wählen das beste k; dazu eine Beschreibe-Aufgabe über die vorhandene KI-Auswertung (Skriptserver): „**Begründe** mithilfe der Tabelle, welchen Wert für k du wählst.“ Merke-Kasten erst danach: k ist ein Hyperparameter (wie die Baumtiefe in Aufgabe 4); Validierungsdaten dienen nur der Wahl von k. Wählbare Fehlvorstellung: „Man wählt k mit den Testdaten.“ Die Rückmeldung erklärt: Dann misst der Test nicht mehr, wie gut das Modell mit unbekannten Daten zurechtkommt.
4. „Das Modell testen“
   Mit dem in Reiter 3 ermittelten k klassifiziert das Modell 6–8 Testpersonen, mit mindestens zwei Fehlklassifikationen. Die SuS füllen eine 3×3-Konfusionsmatrix (S/M/L) und berechnen die Genauigkeit. Anknüpfung an die 2×2-Matrix aus Aufgabe 3c: Zeilen erwartet, Spalten berechnet, die Diagonale zählt die richtigen Klassifikationen. Die Konfusionsmatrix-Komponente aus entscheidungbaeume/ui/task3c.mjs wiederverwenden bzw. auf drei Klassen erweitern, ohne Aufgabe 3c zu verändern. Feedback unterscheidet typische Fehler (Zeile/Spalte vertauscht, Nenner ohne Fehlklassifikationen).
5. „Daten als Fehlerquelle“
   Drei kurze Fälle, je eine Multiple-Choice-Frage mit eigenem Prüfen-Button:
   (a) Ungleiche Verteilung: 5 × S, 1 × M (Heft S. 30) → für k ≥ 3 wird immer S vorhergesagt.
   (b) Einseitige Daten: das Stadt-Land-Tier-Beispiel als Text. Die Trainingsdaten für „Stadt“ enthalten nur deutsche Städte, deshalb wird „New York“ als „Land“ klassifiziert.
   (c) Normierung: Lebensmittel mit Zuckermenge (0–100 g) und Anteil am Tagesbedarf (0–1). Ein kleines Rechenbeispiel zeigt, dass ohne Normierung fast nur die Zuckermenge den nächsten Nachbarn bestimmt. Die SuS normieren einen Wert selbst per Zahleneingabe (75 g → 0,75). Die Formel (x − min)/(max − min) erscheint erst nach der Lösung.
6. „Für die Schnellen: Regression“
   Deutlich als optional gekennzeichnet und nicht Teil des Abschlussquiz. Idee: KNN sagt eine Zahl statt einer Klasse voraus, nämlich den Mittelwert der Zielwerte der k nächsten Nachbarn. Heftbeispiel A(0|0), B(1|0,5), C(2|2), D(5|6,5), gesucht ist y für x = 3: Bei k = 1 ergibt sich y = 2, bei k = 3 ergibt sich y = 3. Die SuS berechnen den Wert für k = 3 selbst. Optional zusätzlich eine kleine Hauspreis-Grafik mit k-Auswahl (kleiner, vom Planer festgelegter Auszug, keine Excel-Datei).
7. „Abschlussquiz“
   Nach AGENTS.md und manifest-quizaufgaben.txt, 5–6 Fragen nur zu den Reitern 1–5.

KEIN Sicherungsblatt und KEIN Wiederholungs-Quiz (nicht beauftragt).

WIEDERVERWENDUNG
Seitengerüst, Reiter, Hilfen, Speicherung und semantische Auswertung wie in Aufgabe 7; Konfusionsmatrix aus Aufgabe 3c; Drag-and-Drop wie in Aufgabe 7; Abschlussquiz nach Informatik 10, Datenbanken (#final-quiz). Menüeintrag in faecher/informatik/klasse-11/index.html hinter Aufgabe 7, Rücklink „Zu Aufgabe 7“.

PROJEKTVORGABEN, DIE NICHT IN DEN MANIFESTEN STEHEN
- Reiter sind jederzeit frei wechselbar, ohne Freischaltlogik. Jeder Reiter endet mit einem Weiter-Button.
- Grafik und Bedienelemente sind gleichzeitig ohne Scrollen sichtbar (Laptop und iPad), die Bedienelemente stehen neben der Grafik.
- Klassen im Diagramm nie nur über die Farbe unterscheiden (Farbe plus Form, Legende), wie in Aufgabe 7.
- Verbindungslinien und Pfeile beginnen und enden genau an den Elementen, die sie verbinden (auch im Phasenmodell).
- Multiple-Choice-Fragen außerhalb des Abschlussquiz haben je Frage einen eigenen Prüfen-Button.
- Typische Fehlvorstellungen sind als Optionen wählbar und bekommen je eine eigene Rückmeldung. Feedback erklärt das fachliche Warum.
- Drag-and-Drop mit Pointer Events, Karten zurückziehbar, Ablagefelder mindestens in .formula-slot-Größe, Alternative antippen–antippen.
- Formeln und Merksätze, die eine Aufgabe erarbeiten lässt, sind vorher nirgends sichtbar.
- Operatoren in Arbeitsaufträgen fett. Aufträge zu einer interaktiven Grafik stehen über der Grafik.

TYPISCHE FEHLVORSTELLUNGEN (für Aufgaben und Quiz nutzen)
„Je größer k, desto zuverlässiger.“ – „k = 1 ist am besten, weil es die Trainingsdaten perfekt wiedergibt.“ – „k wählt man mit den Testdaten.“ – „Beim Training von KNN wird eine Regel berechnet.“ – „Eine Genauigkeit von 80 % bedeutet, dass künftig immer 80 % richtig sind.“ – „Das Merkmal mit den größeren Zahlen ist das wichtigere.“ – „Mehr Trainingsdaten einer Klasse machen das Modell immer besser.“
```
