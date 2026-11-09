# Erstellungs-Prompt für das Lernmodul zum Gravitationsgesetz

Implementiere im Repository `C:\Users\Franke\Documents\git\unterricht` ein neues interaktives Lernmodul für **Physik Klasse 11, Einheit Kreisbewegungen**, mit dem Titel **„Das Gravitationsgesetz“**. Es schließt an die bisherigen Module zur Zentripetalkraft an. Nutze die nächste freie Aufgabennummer; zum Zeitpunkt dieses Prompts ist dies **Aufgabe 8** mit der Zieldatei `faecher/physik/klasse-11/1-Kreisbewegungen/aufgabe8.html`. Prüfe die Nummer vor dem Anlegen und überschreibe keine bestehende Aufgabe.

## Grundlagen und Vorgehen

Lies die geltenden `AGENTS.md`-Dateien sowie `manifest-allgemein.txt`, `manifest-physikaufgaben.txt` und `manifest-quizaufgaben.txt` vollständig. Verwende den dort vorgeschriebenen Ablauf **Planung → Bau → regelbasierte Vorprüfung → fachlich-didaktische Endabnahme**. Die Planung liefert eine Aufgabenmatrix mit Quellenbezug, Lernziel, Aufgabenformat, wörtlichem Arbeitsauftrag, drei Hilfestufen, Referenzlösung beziehungsweise Bewertungsrubrik und konkreten Feedbacktexten. Trenne mechanische und fachlich-didaktische Akzeptanzkriterien. Beachte die festgelegten Modellrollen und Grenzen der Korrekturschleifen.

Lies diese fünf Dateien unter `faecher/physik/klasse-11/1-Kreisbewegungen/material-Gravitation/` vollständig, einschließlich Tabellen, Formeln und fachlich relevanter eingebetteter Abbildungen:

- `AB_Gravitationsgesetz.docx`
- `AB_Lsg_Gravitationsgesetz.docx`
- `Gravitationsgesetz-Präsentation.pptx`
- `A_3_1_Gravitationsgesetz_.docx`
- `A_3_1_Gravitationsgesetz_V2_ausgefuellt.docx`

Die ersten drei Dateien bilden die Grundlage für den historischen Einstieg, die Quellenarbeit und die historische Bestimmung der Gravitationskonstante. Die letzten beiden bilden die Grundlage für Simulation, Messreihen und Anwendungen. Übernimm die fachlichen Aufgabenideen, überführe sie aber in kurze, sinnvoll gestufte interaktive Aufgaben. Ersetze Buchverweise durch vollständig formulierte Aufgaben mit allen benötigten Angaben. Dokumentiere Quellenfehler und korrigiere sie fachlich nachvollziehbar.

**Keine Screenshots, Faksimilebilder oder abfotografierten Arbeitsblatt- und Folienausschnitte in das Lernmodul einfügen.** Setze die benötigten historischen Auszüge als echten, auswählbaren HTML-Text. Erstelle fachliche Skizzen und die Simulation mit den im Projekt üblichen SVG-/Canvas-Verfahren. Die Office-Dateien dienen als Inhaltsquellen, nicht als einzubettende Seitenbilder.

## Verbindliche Referenzen

Untersuche zuerst die Module dieser Einheit. Verwende insbesondere:

- `aufgabe6.html`, `kettenkarussell.mjs` und zugehöriges CSS für Aufbau, Aufgaben, Hilfen und Rückmeldungen;
- `aufgabe7.html` und `uebungen-zentripetalkraft.mjs` für Rechenaufgaben, Einheitenwahl, gültige Ziffern und Kraftdarstellungen;
- die vorhandenen Simulationen der Einheit für Interaktion, Darstellung und responsive Bedienung;
- `components/physics-step-tabs.mjs`, `components/physics-task-progress.mjs`, `components/physics-notation.mjs` samt CSS und bei Bedarf `components/point-vector-grid.mjs` und `components/token-drag.mjs`;
- `components/physics-semantic-task.mjs` für vorhandenes Freitextfeedback;
- die Abschlussquizze aus Informatik Klasse 10, Datenbanken, sowie `faecher/informatik/quiz-fragen-pruefen.js` mit `addQuizQuestionChecks`.

Alle genannten lokalen Modul- und Komponentenpfade beziehen sich auf `faecher/physik/klasse-11/1-Kreisbewegungen/`, soweit kein anderer Pfad angegeben ist. Bestehende Strukturen wiederverwenden; keine neue Designsprache, Prüfarchitektur oder KI-Pipeline entwickeln. Gemeinsame Komponenten nur bei tatsächlichem Bedarf gezielt erweitern. Bereits vorhandene, fremde Arbeitsänderungen erhalten.

## Lernziele und Reihenfolge

Die Schülerinnen und Schüler sollen historische Aussagen Newtons erschließen, Gravitation als gegenseitige Anziehung aller massehaltigen Körper verstehen, ihre Abhängigkeit von beiden Massen und dem Mittelpunktabstand untersuchen und das Gravitationsgesetz auf Erde und Himmelskörper anwenden.

Verwende diese fortlaufend nummerierten Reiter:

1. **Newton und sein Werk**
2. **Die Principia verstehen**
3. **Massen und Kräfte untersuchen**
4. **Das Gravitationsgesetz**
5. **Gravitation anwenden**
6. **Überblick und Auswertung**
7. **Abschlussquiz**

Die folgenden Inhalte sind verbindlich; die Planung darf die Aufteilung innerhalb der Reiter sinnvoll verdichten.

### 1. Newton und sein Werk

Beginne mit einem kurzen historischen Einstieg zu Isaac Newton und seinem Werk *Philosophiae Naturalis Principia Mathematica* von 1687. Erläutere seine Bedeutung: Bewegungen auf der Erde und Bewegungen von Himmelskörpern werden durch gemeinsame physikalische Gesetze beschrieben. Verknüpfe dies mit der bereits bekannten Zentripetalkraft. Vermeide lange Biografien. Falls die Apfelgeschichte als Aufhänger erscheint, kennzeichne sie als überlieferte Geschichte und behaupte keinen unbelegten konkreten Entdeckungsmoment.

### 2. Die Principia verstehen

Übertrage die fachlich relevanten Passagen aus § 7 und § 9 des ersten Arbeitsblatts in gut lesbaren Text. Kennzeichne die historische Rechtschreibung sowie Auslassungen und nenne Newton, Werk und Paragraph. Erfinde keine bibliografischen Angaben zur verwendeten Übersetzung.

Zentrale Auszüge sind:

> „Bis jetzt haben wir jene Kraft, welche die Himmelskörper in ihren Bahnen erhält, Centripetalkraft genannt. Dass sie mit der Schwere identisch sei, ist ausgemacht, und wir wollen sie daher künftig Schwere nennen.“ (§ 7)

> „Die Schwere kommt allen Körpern zu, und ist der in jedem enthaltenen Menge der Materie proportional.“ (§ 9)

> „… dass die Schwere gegen einen von ihnen, welchen man besonders betrachtet, sich umgekehrt wie das Quadrat des Abstandes von seinem Schwerpunkte verhalte …“ (§ 9, Auszug)

Prüfe die Transkription am Material. Eine moderne Erklärung muss als eigene Erläuterung erkennbar sein. Biete sie bei Bedarf als gestufte Hilfe an.

Überführe die vier Originalfragen in Aufgaben zum Textverständnis:

- Welche Verbindung stellt Newton zwischen Zentripetalkraft und „Schwere“ her?
- Was meint er hier mit „Schwere“, und welche Rolle spielen die Massen der beteiligten Körper?
- Was bedeutet die Aussage, dass die Schwere allen Körpern zukommt?
- Wie verändert sich die Kraft bei verdoppeltem beziehungsweise verdreifachtem Mittelpunktabstand?

Nutze geeignete Zuordnungs-, Auswahl- und kurze Erklärungsaufgaben. Stelle ausdrücklich klar: Bei einer durch Gravitation bewirkten Kreisbewegung übernimmt die Gravitationskraft die Rolle der Zentripetalkraft; es werden nicht zwei zusätzliche Kräfte addiert. Die historische Bezeichnung „Schwere“ meint hier die allgemeine gravitative Anziehung.

### 3. Massen und Kräfte untersuchen

Baue die GeoGebra-Vorlage **„Gravitationskraft anschaulich“ von SimonBach**, <https://www.geogebra.org/m/esbchhnw>, als lokale interaktive Simulation nach. Verwende die vorhandenen technischen Interaktionsmuster der Physikmodule. Die fertige Simulation muss ohne GeoGebra-Einbettung und ohne externen GeoGebra-Dienst funktionieren.

Der am Original geprüfte Funktionskern:

- Zwei unterscheidbare Massen mit frei in der Ebene verschiebbaren Mittelpunkten; Bedienung mit Maus und Touch.
- Getrennte Regler für beide Massen, jeweils von 0 bis 8 t. Ausgangswerte: 3,5 t und 4,5 t, Mittelpunktabstand 7 m.
- Laufende Anzeige beider Massen, des Mittelpunktabstands in m und der Kraftbeträge in einer geeigneten Einheit, insbesondere µN.
- Zwei gleich große, entgegengesetzte Kraftpfeile entlang der Verbindungslinie. Jeder Pfeil beginnt am Mittelpunkt des Körpers, auf den die Kraft wirkt. Beschrifte eindeutig „Kraft auf Masse 1 durch Masse 2“ beziehungsweise umgekehrt.
- Symbolische, mit der Masse veränderliche Körpergröße und eine Rücksetzfunktion für die Ausgangslage.

Rechne intern in SI-Einheiten: 1 t = 1000 kg, 1 µN = 10⁻⁶ N. Der Abstand wird zwischen den Mittelpunkten gemessen, nicht zwischen den Kreisrändern. Die Kreisgrößen sind symbolisch und legen keine Dichte fest. Verhindere den singulären Fall r = 0. Bei einer Masse von null ist die Kraft null. Kraftpfeile müssen nach derselben Skala gezeichnet werden; falls eine Darstellungsskalierung nötig ist, mache sie verständlich. Ergänze für kontrollierte Messreihen ein präzises Abstandsfeld beziehungsweise einen Abstandsregler sowie eine Tastaturalternative zum Verschieben. Die Simulation stellt ein Kraftmodell dar und benötigt keine künstliche Umlaufanimation.

Setze den Beobachtungsauftrag oberhalb der Simulation. Lasse zuerst Kräftebild und Wechselwirkung beschreiben: unterschiedliche Massen, trotzdem gleich große Kräfte; Angriff an unterschiedlichen Körpern; entgegengesetzte Richtungen. Nutze ergänzend die Newton-Axiome aus der Präsentation als kurze Zuordnung und begründe, warum gleiche Kräfte bei verschiedenen Massen unterschiedliche Beschleunigungen bewirken.

### 4. Das Gravitationsgesetz

Lasse auf Grundlage der Quellen zunächst Je-desto-Vermutungen zu beiden Massen und zum Abstand formulieren und anschließend experimentell prüfen. Die Simulation muss auch während dieser Messaufgaben direkt nutzbar sein; verwende dafür dieselbe Simulationslogik.

Plane drei Messreihen mit jeweils mindestens vier Einstellungen. Verändere immer nur eine Größe und halte die beiden anderen konstant. Geeignete Ausgangsreihen aus der ausgefüllten Vorlage sind:

- m₁ = 3,5 / 4,0 / 4,5 / 5,0 t; m₂ = 4,5 t; r = 7 m;
- m₂ = 3,5 / 4,0 / 4,5 / 5,0 t; m₁ = 5 t; r = 7 m;
- r = 5,5 / 6 / 7 / 7,5 m; m₁ = m₂ = 3 t.

Die Schrägstriche in diesen Listen trennen Einstellungen, sie sind keine Division. Messwerte werden von den Lernenden in Tabellen übernommen. Ergänze eine geeignete Auswertung über Quotienten oder Graphen. Erarbeite F ∝ m₁, F ∝ m₂ und F ∝ 1/r² und fasse dies erst danach zu **F = G · m₁ · m₂ / r²** zusammen. Setze Divisionen im Lernmodul mit waagerechten Bruchstrichen. Lasse auch Verdopplung beider Massen und Verdopplung des Abstands vorhersagen und überprüfen.

Lasse G aus einer Messreihe bestimmen und seine Einheit herleiten. Mache kenntlich, dass eine Simulation mit hinterlegtem G dessen Wert lediglich nachvollziehbar macht. Sie ist keine unabhängige experimentelle Bestimmung der Naturkonstante.

Greife anschließend die Cavendish-Aufgabe der Präsentation auf: M = 158 kg, m = 0,73 kg, r = 211 mm, F = 0,175 µN. Lasse den Ansatz für G und die Umrechnung prüfen; die historischen Messangaben liefern ungefähr 6,75 · 10⁻¹¹ in SI-Einheiten.

Verwende im gesamten lokalen Modell **G = 6,67430 · 10⁻¹¹ N m²/kg²** und berechne alle Referenzwerte konsistent neu. Die Quelltabellen und GeoGebra zeigen leicht andere Werte: beispielsweise 21,48 µN im ursprünglichen Startfall gegenüber rund 21,45 µN mit dieser Konstante. Übernimm solche Zahlen nicht ungeprüft als exakte Prüfergebnisse. Erläutere beim Vergleich historischer Messdaten die begrenzte Genauigkeit.

### 5. Gravitation anwenden

Übernimm diese fünf Aufgabenideen aus `A_3_1_Gravitationsgesetz_.docx`, einschließlich ihrer erforderlichen Daten:

1. **Apfel und Erde:** Apfelmasse 150 g; Erdmasse 5,974 · 10²⁴ kg; Erdradius 6370 km. Bestimme die gegenseitige Kraft und die Beschleunigung beider Körper. Die Fallhöhe des Apfels ist gegenüber dem Erdradius vernachlässigbar. Thematisiere, warum hauptsächlich die Apfelbewegung auffällt.
2. **Astronautin:** Masse 62 kg, Höhe 400 km über der Erdoberfläche. Berechne die Gravitationskraft und vergleiche mit der Erdoberfläche. Verwende r = Erdradius + Höhe. Erkläre qualitativ, warum Schwerelosigkeit im Orbit nicht fehlende Gravitation bedeutet.
3. **Mond:** Mondmasse 7,349 · 10²² kg, Mondradius 1737 km. Bestimme die Oberflächenfallbeschleunigung und vergleiche mit der Erde.
4. **Mars:** Marsmasse 6,417 · 10²³ kg, Oberflächenfallbeschleunigung 3,7 m/s². Bestimme den Marsradius.
5. **Vergleich mit Merkur:** Verwende das vereinfachte Modell der Vorlage: ungefähr halbe Marsmasse und gleiche Oberflächenfallbeschleunigung. Bestimme das Radiusverhältnis. Kennzeichne diese Angaben als Modellannahme, nicht als exakte Planetendaten.

Leite g = G · M / r² aus F = m · g und dem Gravitationsgesetz her, bevor es für Mond und Mars angewendet wird. Die numerische Größenordnung muss stimmen: Apfelkraft etwa 1,47 N; Astronautin etwa 539 N in der Höhe gegenüber 609 N am Boden; Mond-g etwa 1,63 m/s²; Marsradius etwa 3402 km; Radiusverhältnis Merkur zu Mars etwa 0,707. Dies sind Orientierungswerte vor der abschließenden, zur Datengenauigkeit passenden Rundung.

### 6–7. Sicherung und Abschlussquiz

Sichere die wesentlichen Zusammenhänge in knappen Merksätzen. Die Auswertung zeigt Aufgaben, eigene Eingaben und passende Lösungen beziehungsweise Lösungsideen nach dem vorgesehenen Bearbeitungsabschluss. Verwende vorhandene Übersichts- und Fortschrittsmuster; das Abschlussquiz bleibt der letzte Reiter.

Erstelle ein Abschlussquiz mit etwa sechs Checkbox-Fragen. Mindestens zwei Fragen haben mehrere richtige Antworten. Decke Wechselwirkung, Massen- und Abstandsabhängigkeit, Mittelpunktabstand, Gravitation als Zentripetalkraft und Gravitation im Orbit ab. Jede Frage erhält „Frage N prüfen“ und unmittelbares eigenes Feedback. Der gemeinsame Auswertungsbutton bleibt erhalten; nach einzeln korrekt geprüften Fragen läuft die Gesamtauswertung automatisch über `addQuizQuestionChecks`.

Ein Sicherungsblatt, ein separates Wiederholungsquiz und eine Präsentationserweiterung sind in diesem Auftrag nicht zusätzlich beauftragt. Die beiden Word-Arbeitsblätter dienen als Quellen für das digitale Modul.

## Bedienung, Feedback und Integration

- Arbeitsaufträge kurz und mit fett gesetzten Operatoren; Simulationsaufträge oberhalb, Eingabeaufträge unmittelbar beim Eingabebereich.
- Drei gestufte Hilfen: Hinweis, Denkansatz, Teillösung. Keine vollständige Lösung beim ersten Fehlversuch.
- Rückmeldungen unterscheiden korrekt, teilweise korrekt und noch nicht korrekt und benennen konkrete Fehler.
- Zahlenwert, Einheit und gültige Ziffern prüfen. Einheiten-Dropdown direkt neben der Zahl, erste Option leer; gleichwertige Einheiten akzeptieren. Verlangte Genauigkeit sichtbar angeben. Dezimalkomma und wissenschaftliche Schreibweisen berücksichtigen.
- Indizes typografisch tiefstellen; Formeln und zusammengesetzte Einheiten gemäß Physikmanifest setzen.
- Alle Eingaben, Messreihen, Simulationseinstellungen, Bearbeitungsstände und den aktiven Reiter versioniert speichern und nach Seitenwechsel wiederherstellen. Vorhandene Speicherkomponente verwenden.
- Falls offene Erklärungsaufgaben automatisch bewertet werden, die bestehende Scaleway-Anbindung nutzen und Aufgaben samt Rubriken und Tests registrieren. `apps-script/` bleibt unverändert. Vorgeschriebene Builds, Tests und Paketierung durchführen; noch nötige Bereitstellung offen benennen.
- Reiter ohne horizontales Scrollen auf dem Laptop, auf kleineren Bildschirmen umbrechend. Desktop, Tablet und Smartphone sowie Tastaturbedienung prüfen. Sichtbare Labels, Fokusmarkierungen und textliches Feedback mit `aria-live="polite"` verwenden.
- Aufgabennummer als eigene Zeile direkt unter der Hauptüberschrift. Navigation zur Jahrgangsübersicht und Startseite übernehmen. Modul in `faecher/physik/klasse-11/index.html` nach Aufgabe 7 einsortieren, sofern die Nummer 8 weiterhin frei ist.

## Abnahme und Übergabe

Prüfe mechanisch Dateinamen, Links, Menüposition, fortlaufende Reiternummern, jede Einzelprüfung, Speicherung und Wiederherstellung. Prüfe die Simulation fachlich durch Massenverdopplung, Verdopplung beider Massen, Abstandsverdopplung, ungleiche Massen, Richtungsänderung beim Verschieben, Nullmasse und Zurücksetzen. Bei konstanten anderen Größen müssen die Kraftfaktoren 2, 4 beziehungsweise 1/4 entstehen.

Die fachliche Endabnahme kontrolliert insbesondere Quellenverständnis, universelle Gravitation, Wechselwirkung, Kräfte versus Beschleunigungen, die eingeschränkte Bedeutung von F_Z = F_G, Mittelpunktabstand, Einheitenumrechnung und die konsistente Verwendung von G. Behandle Quellenarbeit und Messreihen als zusammenhängende Erarbeitung, nicht als Sammlung isolierter Tests.

Führe die passenden vorhandenen Tests, Syntaxprüfungen, interaktiven Browserprüfungen und `git diff --check` aus. Liefere das fertig integrierte Modul mit kurzer Angabe der Änderungen, Prüfungen und gegebenenfalls noch ausstehenden Serverbereitstellung. Führe keine ungefragten Commits oder Veröffentlichungen aus.
