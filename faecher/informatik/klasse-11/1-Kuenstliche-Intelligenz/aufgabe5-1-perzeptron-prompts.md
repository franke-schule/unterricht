# Prompts: Aufgabe 5.1 – Das Perzeptron verbessert sich

Stand: 11.10.2026. Dieses Dokument enthält den Auftrag für die spätere
Umsetzung und vier Rollenprompts. Es erstellt noch kein Lernmodul.
Beim späteren Bau von Aufgabe 5.1 bleibt die dann bestehende Aufgabe 5
vollständig unverändert; die hier dokumentierte Umstellung auf > ist bereits erfolgt.

## Verwendung

Den folgenden Startprompt zusammen mit diesem Dokument übergeben. Die vier
Rollenprompts darunter sind für die einzelnen Stufen desselben Auftrags
gedacht; sie sind keine vier unabhängigen Implementierungsaufträge.

```text
Führe den Lernmodul-Loop aus AGENTS.md Abschnitt 13 für Aufgabe 5.1 aus.
Nutze faecher/informatik/klasse-11/1-Kuenstliche-Intelligenz/aufgabe5-1-perzeptron-prompts.md
als vollständigen fachlichen Auftrag und verwende dessen Rollenprompts.
Beginne mit Planung, dann Bau, regelbasierter Vorprüfung und Endabnahme.
Für Codex: Planung und Endabnahme GPT-6 Sol (high), Bau GPT-6 Luna (high),
Vorprüfung GPT-6 Luna (medium). Bei anspruchsvoller neuer Interaktionslogik
darf ausschließlich der Builder auf GPT-6 Sol angehoben werden.
Halte die Korrekturgrenzen aus AGENTS.md ein. Ändere Aufgabe 5 nicht.
```

## Gemeinsamer Auftrag für die Planung

### Ziel und Abgrenzung

- Neues eigenständiges Lernmodul in
  `faecher/informatik/klasse-11/1-Kuenstliche-Intelligenz/aufgabe5-1.html`.
- Hauptüberschrift: **Das Perzeptron verbessert sich**.
  Direkt darunter als eigene Zeile: **Aufgabe 5.1**.
- Klasse 11, Einheit Künstliche Intelligenz, Thema Perzeptron-Konzept.
- Die Schülerinnen und Schüler verbessern zunächst Parameter von Hand,
  verbinden die Feuerentscheidung mit einer Halbebene und entwickeln,
  zeichnen und überprüfen selbst eine lineare Ungleichung.
- Schwerpunkt ist die interaktive Aufgabe zum Darstellen und Testen einer
  Ungleichung. Sie erhält den größten Arbeitsbereich und ausreichend Zeit
  zum Verändern, Prüfen und Verbessern.
- „Verbessert sich“ meint hier die gezielte manuelle Verbesserung anhand
  bekannter Soll-Ausgaben. Kein zusätzlicher Trainingsalgorithmus, keine
  neue Epoche, Lernrate, Backpropagation oder neuronale Netze.
- Aufgabe 5 und alle von ihr benutzten Dateien bleiben unverändert. Die
  spätere Kombination beider Module wird jetzt nicht durchgeführt.
- Keine Umnummerierung bestehender Aufgaben, keine Architekturänderung.
- Kein Sicherungsblatt und kein separates Wiederholungs-Quiz beauftragt.
  Das verpflichtende Abschlussquiz gehört dagegen zum neuen Modul.

### Fachliche Quellen

Diese drei Kapitel vollständig lesen, einschließlich interaktiver
Konfigurationen, Grafiken und verdeckter Hilfen:

1. [2 – Neuron bestimmen](https://inf-schule.de/ki/menueansicht/ki_erkunden/neuronen_knn/einzelneNeuronen/neuronBestimmen)
2. [3 – Neuron → Trennlinie](https://inf-schule.de/ki/menueansicht/ki_erkunden/neuronen_knn/einzelneNeuronen/neuron2trennlinie)
3. [4 – Trennlinie → Neuron](https://inf-schule.de/ki/menueansicht/ki_erkunden/neuronen_knn/einzelneNeuronen/trennlinie2neuron)

Aufgabenfolge, mathematische Beispiele und fachliche Lernschritte möglichst
genau beibehalten. Die Darstellung an das vorhandene Projekt anpassen.
Notwendige Ergänzungen sind die vorgelagerte Erklärung von Gleichung und
Ungleichung, die Buttonprüfung, eine offene Trennaufgabe und das Abschlussquiz.
Diese Ergänzungen in der Spezifikation ausdrücklich kennzeichnen.

Die Seiten weisen CC BY-SA 4.0 aus. Übernommene bzw. bearbeitete Inhalte mit
Kapitel-Link, Autorennennung laut jeweiliger Seite, Lizenzlink und
Änderungshinweis kennzeichnen. Abweichende Einzelbildlizenzen berücksichtigen.
Eine Quellenangabe in der Schüleransicht und eine lokale Datei
`perzeptron/ATTRIBUTION-aufgabe5-1.md` vorsehen.

### Verbindliche mathematische Konvention

In 5.1 gilt entsprechend inf-schule:

```text
a = w1*x1 + w2*x2
Ausgabe = 1 genau dann, wenn a > s; sonst Ausgabe = 0.
Trennlinie: w1*x1 + w2*x2 = s.
```

Auf der Grenze ist die Ausgabe somit **0**. Eine strenge Ungleichung zeichnet
eine gestrichelte Grenze und markiert eine offene Halbebene.

Aufgabe 5 wurde auf ausdrücklichen Auftrag am 11.10.2026 ebenfalls auf
`a > θ` umgestellt. Die gemeinsame Funktion
`perzeptron/logic/perceptron.mjs: activation` arbeitet jetzt streng. Sie darf
in 5.1 unverändert wiederverwendet werden. Beide Module und inf-schule
verwenden damit dieselbe Festlegung: Bei Gleichheit ist die Ausgabe 0.
Für den späteren Bau von 5.1 bleibt Aufgabe 5 unverändert.

Notation: `x₁`, `x₂` sind Eingänge; `x`, `y` sind Diagrammkoordinaten mit
`x = x₁`, `y = x₂`. Die **Ausgabe** heißt im Modul „Ausgabe 0/1“, damit sie
nicht mit der vertikalen Koordinate `y` verwechselt wird.

### Gesicherte Originaldaten

Die folgenden Angaben wurden aus den öffentlichen HTML-Konfigurationen bzw.
der GeoGebra-Konstruktion gelesen. Sie dürfen nicht durch den Tierdatensatz
aus der bisherigen Aufgabe 5 ersetzt werden.

| Quelle | Eingaben in Zeilenreihenfolge | Soll-Ausgaben | Startparameter |
| --- | --- | --- | --- |
| Kapitel 2, erster Fall | (0;0), (0;1), (1;0), (1;1) | 0, 0, 1, 1 | w₁ = 1,5; w₂ = −2,5; s = 3,9 |
| Kapitel 2, zweiter Fall | dieselben vier Eingaben | 0, 0, 1, 1 | w₁ = 3; w₂ = 2,5; s = −0,5 |
| Kapitel 3 | dieselben vier Eingaben | 0, 0, 1, 1 | fest: w₁ = 4; w₂ = 2; s = 3 |
| Kapitel 4 | (0;1), (0,5;0), (1;0,5), (1;1) | 0, 0, 1, 1 | Trennlinie y = −2x + 2 |

Kapitel 2: Die ursprünglichen Reglerbereiche sind im ersten Fall
w₁/w₂ jeweils −4 bis 3,5 mit Schritt 0,5, s von −4 bis 4 mit Schritt 0,1;
im zweiten Fall w₁/w₂ jeweils −4 bis 4 mit Schritt 0,5,
s von −4 bis 2,1 mit Schritt 0,1. Gleichwertige Zahleneingaben sind möglich.
Beide Fälle haben gültige Lösungen innerhalb dieser Bereiche.

Kapitel 3, GeoGebra-Punkte:
A(0;0) und D(0;1) sollen nicht feuern;
B(1;0) und C(1;1) sollen feuern.

Originalkonstruktion:
[trennlinie1.ggb](https://inf-schule.de/content/5_ki/1_menueansicht/2_ki_erkunden/3_neuronen_knn/1_einzelneNeuronen/3_neuron2trennlinie/trennlinie1.ggb)

Lehrerreferenz, nicht vor der jeweiligen Erarbeitung anzeigen:

- Kapitel 3: `4*x1 + 2*x2 > 3`, entsprechend `y > -2*x + 1,5`.
  Grenze: `y = -2*x + 1,5`.
  Für `x1 = 0,25`: `x2 > 1`.
- Kapitel 4: `y > -2*x + 2`, entsprechend `2*x1 + x2 > 2`.
  Ein passendes Neuron hat `(w1,w2,s) = (2,1,2)`.
- Expertenfall aus Kapitel 4: `y < -2*x + 2`, entsprechend
  `-2*x1 - x2 > -2`; ein passendes Neuron hat `(−2,−1,−2)`.
  Auf der Grenze feuert keines der beiden strengen Neuronen. Die
  Klassenumkehr gilt außerhalb der Grenze; nicht als vollständige Negation
  einschließlich der Grenze erklären.

### Technische Entscheidung: GeoGebra mit API

Eine eigene GeoGebra-Einbettung mit externer Buttonprüfung ist möglich.
Als Hauptweg eine **eigene kontrollierte App-Einbettung** mittels `GGBApplet`
und `appletOnLoad(api)` vorsehen, keine Einbettung der ganzen inf-schule-Seite
und keinen bloßen fremden Material-iframe. Der Zugriff aus dem Elternfenster
auf einen fremden iframe ist nicht die Grundlage der Prüfung.

Primärquellen:

- [GeoGebra Apps Embedding](https://geogebra.github.io/docs/reference/en/GeoGebra_Apps_Embedding/)
- [GeoGebra Apps API](https://geogebra.github.io/docs/reference/en/GeoGebra_Apps_API/)
- [App Parameters](https://geogebra.github.io/docs/reference/en/GeoGebra_App_Parameters/)

Eine beschriftete **Texteingabe für die vollständige Ungleichung** und die
Buttons „Darstellen“ und „Ungleichung prüfen“ außerhalb des Applets verwenden.
Die eigene Eingabe ist die verbindliche Schülerantwort und wird sofort
gespeichert. Auf diese Weise werden weder beliebige Hilfsobjekte des Applets
noch ein zuletzt angeklicktes Objekt versehentlich als Antwort geprüft.

Die Eingabe wird in eine lineare Normalform gebracht. Dieselben Koeffizienten
steuern Zeichnung und Prüfung. `evalCommand` dient zur Darstellung validierter
Formeln; Schülertext niemals als JavaScript ausführen. Applet und Buttons erst
nach erfolgreicher Initialisierung verbinden. Bei Ladefehlern verständlich
rückmelden; keine falsche Erfolgsmeldung und kein unbegrenzt blockierter Button.

Vor dem vollständigen Bau ein kleines Integrationsstück prüfen: gültige
Ungleichung zeichnen, falsche Halbebene zeichnen, per Button die Punktklassen
prüfen und einen gespeicherten Entwurf wiederherstellen. Auch auf Tablet testen.
Die Machbarkeit ist dokumentationsbasiert festgestellt; ein Laufzeittest
dieser konkreten neuen Integration steht noch aus.

**Ersatz nur bei nachgewiesenem Integrationsproblem:** die vorhandene
SVG-Darstellung aus Aufgabe 5 als Vorlage verwenden, mit Textfeld,
Halbebenenfüllung, dynamischer Grenzgerade und identischer Prüfungslogik.
Als weitere Referenz `knn/ui/knn-plot.mjs` prüfen. Keine zweite Grafikbibliothek
einführen und Aufgabe 5 dafür nicht ändern. Den Grund für den Ersatz im
Prüfbericht festhalten. Ein einfaches Eingabeschema darf den Schülerinnen und
Schülern die Entwicklung der Ungleichung nicht durch vorgegebene Koeffizienten
abnehmen.

### Reiterfolge und konkrete Arbeitsaufträge

Alle Reiter sind frei anwählbar und ab 1 nummeriert. Ergebnisse werden
innerhalb der jeweiligen Erarbeitung erst nach Bearbeitung sichtbar.
Jeder Arbeitsreiter erhält einen Weiter-Button. Kurze Aufträge; Operatoren fett.

**1 – Fehlendes Feuer** (Kapitel 2, erster Fall)

Die Tabelle zeigt Eingaben, gewichtete Summe, Soll-Ausgabe und berechnete
Ausgabe. Gewichte und Schwellenwert sind veränderbar; Parameteränderungen
aktualisieren die Rechnung. Erfolg wird auf Knopfdruck festgestellt.

Arbeitsauftrag: „**Verändere** Gewichte und Schwellenwert so, dass das
Perzeptron bei allen vier Eingaben die gewünschte Ausgabe liefert.
**Prüfe** deine Einstellung.“

Gestufte Hilfen greifen die Hürdenidee der Quelle auf: Bei positivem aktivem
Eingang das zugehörige Gewicht erhöhen oder den Schwellenwert senken kann
fehlendes Feuer ermöglichen. Danach immer alle Zeilen erneut kontrollieren,
weil sich andere Entscheidungen ebenfalls verändern können.

**2 – Unerwünschtes Feuer** (Kapitel 2, zweiter Fall)

Gleiche Tabellenbedienung mit den zweiten Startparametern.
Arbeitsauftrag: „**Verändere** die Einstellung so, dass das Perzeptron bei
den ersten beiden Eingaben nicht feuert und bei den letzten beiden feuert.
**Prüfe** anschließend alle Zeilen.“

Hilfen: Bei positivem aktivem Eingang Gewicht vermindern oder Schwellenwert
erhöhen. Bei (0;0) verändern Gewichte die Summe nicht; dieser Fall macht die
Rolle des Schwellenwerts sichtbar. Nicht behaupten, dass jede einzelne
Parameteränderung zwingend die gesamte Klassifikation verbessert.

**3 – Wann feuert es?** (Kapitel 3, Aufgaben 1–3)

Das Neuron `(4,2,3)` ist vorgegeben. Zuerst die vier Ausgaben selbst
bestimmen, danach für `x₁ = 0,25` die möglichen `x₂`-Werte untersuchen.
Vorschläge unterhalb, genau auf und oberhalb der Grenze prüfen lassen.
Aus dieser Beobachtung die Feuerbedingung als Ungleichung formulieren.

Arbeitsauftrag: „**Bestimme** die vier Ausgaben des Neurons.
**Untersuche** danach, für welche Werte von x₂ es bei x₁ = 0,25 feuert.“

Anschließend: „**Formuliere** eine Ungleichung für alle Eingaben, bei denen
das Perzeptron feuert.“

**4 – Grenze oder Bereich?** (ergänzende Verständnissicherung und Kapitel 3,
Aufgabe 4)

Vor der zentralen Trennaufgabe den Unterschied anschaulich erarbeiten:
Punkte auf einer Geraden, in der Feuerhalbebene und in der anderen Halbebene
vergleichen. Ein Grenzpunkt wie (0,25;1) wird explizit getestet.

Arbeitsauftrag: „**Vergleiche** einen Punkt auf der Grenze mit Punkten auf
beiden Seiten. **Entscheide**, ob eine Gleichung allein alle feuernden
Eingaben beschreibt.“

Nach der Beobachtung verbindlicher Merksatz:

> Eine Gleichung beschreibt die Punkte auf der Trennlinie. Die Ungleichung
> beschreibt alle Punkte auf der Seite, auf der das Perzeptron feuert.
> Deshalb brauchen wir für die Feuerentscheidung eine Ungleichung.

Danach die selbst entwickelte Ungleichung nach `x₂` umformen und in
Diagrammnotation übertragen. Die fertige Zielformel nicht schon in der
Grafik, einem Platzhalter, der Hilfe 1 oder einem vorherigen Merksatz zeigen.

Arbeitsauftrag: „**Löse** deine Ungleichung nach x₂ auf.
**Gib** anschließend die Gleichung der Trennlinie in x-y-Notation an.“

**5 – Ungleichung entwickeln und testen** (Schwerpunkt: Kapitel 3, Aufgabe 5)

Koordinatensystem mit den vier Originalpunkten A–D, Legende und Eingabefeld.
Die Soll-Klassen sind fest; die Schülerantwort beginnt leer.
Form, Beschriftung und Farbe kennzeichnen die beiden Klassen gemeinsam.
Grenzlinie und erfüllte Halbebene werden aus der Eingabe gezeichnet.

Zwei klar getrennte Teilaufgaben in diesem Reiter:

**5a – Das vorgegebene Neuron darstellen:**
„**Gib** deine Ungleichung aus dem vorherigen Schritt ein und **stelle**
die Feuerhalbebene dar. **Prüfe**, ob sie zum Neuron und zu allen vier
Datenpunkten passt.“

Hier wird die mathematisch äquivalente Feuerhalbebene des Neurons `(4,2,3)`
verlangt. Die vier richtigen Punktlabels allein reichen nicht zum Erfolg.
Danach eine zusätzliche senkrechte Hilfslinie `x = 0,25` einblenden lassen
und das Ergebnis aus Reiter 3 mit der Grafik vergleichen. Diese Hilfslinie
ist kein Ersatz für die Ungleichung und zählt nicht als Antwort.

**5b – Eine eigene passende Trennung finden (Ergänzung):**
„**Entwickle** eine andere lineare Ungleichung, die bei B und C erfüllt
ist und bei A und D nicht. **Teste** sie und **verbessere** sie bei Bedarf.“

Hier ist jede gültige lineare Halbebene richtig, die alle Soll-Ausgaben
erfüllt; sie muss nicht zum ursprünglichen Neuron `(4,2,3)` äquivalent sein.
Dieser Unterschied steht ausdrücklich im Auftrag und im Feedback.
Das Textfeld wird für diese Teilaufgabe nicht mit einer Musterlösung befüllt.

Nach „Ungleichung prüfen“: Anzahl korrekt klassifizierter Punkte und je Punkt
Soll-Ausgabe, berechnete Ausgabe und ✓/✗ anzeigen. Bei 5a zusätzlich melden,
ob die Halbebene tatsächlich zum vorgegebenen Neuron passt.
Teilweise richtig ist z. B. eine gültige Ungleichung mit einigen passenden
Punkten oder eine bloße Punkttrennung ohne die in 5a geforderte Äquivalenz.
Bei einem Fehler einen geeigneten Gegenpunkt nennen, keine fertige Formel.
Eine richtige Antwort bei Änderung wieder als ungeprüft markieren.

Gestufte Hilfen für 5b:
1. „Vergleiche, wo die beiden feuernden Punkte und die beiden anderen liegen.“
2. „Wähle zuerst eine mögliche Trennlinie und entscheide dann, welche Seite
   die Ungleichung beschreiben soll.“
3. „Setze einen feuernden und einen nicht feuernden Punkt in deinen Entwurf
   ein. Für den ersten muss die Ungleichung wahr sein, für den zweiten falsch.“

**6 – Von der Trennlinie zum Neuron** (Kapitel 4, Aufgaben 1–5)

Die vier Originalpunkte aus Kapitel 4 und die vorgegebene Gerade zeigen,
zunächst ohne ihre Gleichung. Nacheinander: Geradengleichung bestimmen,
Feuerhalbebene beschreiben, in Eingangsnotation umformen, Gewichte und
Schwellenwert ablesen und am Neuron kontrollieren. Je Teilaufgabe eigener
Prüfen-Button. Positive Vielfache sind zulässig, wenn die eingetragenen
Parameter zur selbst gewählten mathematisch gleichwertigen Form passen.

Arbeitsauftrag: „**Bestimme** aus der eingezeichneten Gerade die
Feuer-Ungleichung. **Leite** daraus Gewichte und Schwellenwert ab und
**prüfe** das Neuron an den vier Punkten.“

Optionaler Expertenauftrag aus der Quelle: „**Vertausche** außerhalb der
Trennlinie die feuernde und die nicht feuernde Seite. **Forme** die neue
Bedingung so um, dass wieder ein >-Zeichen zwischen Summe und Schwellenwert
steht.“ Beim Multiplizieren mit einer negativen Zahl dreht sich das
Ungleichheitszeichen um. Die Grenze ausdrücklich gesondert besprechen.

**7 – Zusammenfassung**

Nach Abschluss der Kernaufgaben eine kompakte Übersicht aller Teilaufgaben
mit Auftrag und richtigem Ergebnis nach `manifest-quizaufgaben.txt`.
Für die offene Trennung den gültigen Schülerentwurf und eine als Beispiel
gekennzeichnete mögliche Lösung zeigen. Davor nur Bearbeitungsstand anzeigen,
keine fertigen Lösungen. Das Ende der Kernaufgaben löst die Übersicht aus,
auch wenn das optionale Expertenstück ausgelassen wurde.

**8 – Abschlussquiz**

Letzter Reiter, `#final-quiz`, vorhandene Datenbank-Quizkomponente nutzen.
5–6 Fragen zu ausschließlich erarbeiteten Inhalten. Auswahlkästchen,
mindestens zwei Fragen mit mehreren richtigen Antworten, pro Frage
„Frage N prüfen“, Feedback direkt darunter, gemeinsamer Auswertungsbutton
und automatische Gesamtauswertung nach allen richtigen Einzelprüfungen
über `addQuizQuestionChecks`.

Abfragen: Wirkung von Gewichten/Schwellenwert, Gleichung versus Ungleichung,
Feuerhalbebene, Grenzfall, Notationswechsel und Neuron aus Trennlinie.
Mindestens eine Frage enthält konkrete Punktwerte. Typische Fehlvorstellungen
als begründete Falschantworten: „Die Gleichung beschreibt alle feuernden
Punkte“, „Die Seite spielt keine Rolle“, „Ein negativer Faktor ändert das
Ungleichheitszeichen nicht“, „Bei Gleichheit feuert dieses Neuron“.

### Anforderungen an Eingabe und Prüfung

- Bestehende Parser/Prüfer im Projekt zuerst suchen. Nur die fehlende
  Unterstützung linearer Ungleichungen lokal ergänzen.
- Ganze lineare Ausdrücke auf beiden Seiten unterstützen, etwa
  `y > -2x + 1,5`, `4*x + 2*y > 3`, `3 < 4x + 2y`,
  `-4x - 2y < -3`, `y + 2x > 1,5` und positive Vielfache.
- `x1`/`x2` als Eingangsnotation behandeln; Leerzeichen, Punkt/Komma,
  Unicode-Minus und übliche implizite Multiplikation berücksichtigen.
  Die unterstützte Syntax knapp am Feld nennen, ohne die Lösung zu verraten.
- In den Aufgaben zur Feuerhalbebene sind `=` sowie `>=`/`<=` fachlich
  ungeeignet. Sie erhalten eine gezielte Rückmeldung; eine Gleichung darf
  in einer ausdrücklich dafür vorgesehenen Geradengleichungsaufgabe
  selbstverständlich richtig sein.
- Nichtlineare Terme, mehrere Vergleichszeichen, unbekannte Variablen,
  unvollständige oder nicht endliche Zahlen und degenerierte Bedingungen
  ohne Gerade (`a = b = 0` in `a*x+b*y+c > 0`) abweisen.
- `>` und `<` zu einer gemeinsamen orientierten Normalform
  `a*x + b*y + c > 0` normalisieren. Eine negative Gesamtskalierung kehrt
  die ausgewählte Halbebene um; die Richtung nicht verlieren.
- 5a vergleicht die Normalform mit `(4,2,-3)` bis auf einen positiven
  Faktor und prüft die strenge Grenze. Kein Stringvergleich und kein
  bloßer Test von vier Punkten als Äquivalenznachweis.
- 5b prüft alle vier Soll-Ausgaben. Keine einzelne Mustergerade erzwingen.
  Senkrechte und waagerechte Grenzen sind bei passender Klassifikation
  ebenfalls erlaubt; keine Division durch den y-Koeffizienten erzwingen.
- Grenzpunkte unter einer ausdrücklich dokumentierten, skalierungsfesten
  numerischen Toleranz behandeln. Die Toleranz darf `>` nicht in `>=`
  verwandeln. Zeichnung, Klassifikation und Feedback nutzen dieselbe Regel.
- Darstellung und Prüfung dürfen nie unterschiedliche Entwürfe verwenden:
  Nach Änderung entweder sofort aktualisieren oder „Darstellen“ vor der
  Prüfung automatisch ausführen. Ungültige neue Eingabe lässt die alte
  Grafik nicht als geprüfte aktuelle Antwort erscheinen.

### Wiederverwendung, Dateien und Integration

Planer benennt konkrete Funktionen/Selektoren aus diesen Referenzen:

- `aufgabe5.html`, `perzeptron/ui/task5.mjs`, `perzeptron/task5.css`:
  Seitengerüst, Reiterbedienung, Tabellen, Hilfen, Feedback, SVG-Vorlage,
  Wiederherstellung der Bearbeitung. Referenzen lesen, nicht ändern.
- `knn/ui/knn-plot.mjs`: Achsen, Koordinatentransformation, Formen/Legende
  als weitere Grafikreferenz. Keine KNN-Fachlogik in 5.1 einführen.
- `faecher/informatik/klasse-9/eingaben-speichern.js` und die vorhandene
  Speicheranbindung der Klasse 11: wiederverwendbare Speicherung auswählen.
- `faecher/informatik/klasse-10/1-Datenbanken/aufgabe6.html`:
  responsive nummerierte Reiter und Abschlussquiz; Aufgaben 1–4 ebenfalls
  für Quiz-/Übersichtsmuster prüfen.
- `faecher/informatik/quiz-fragen-pruefen.js`: `addQuizQuestionChecks`.

Neue Dateien lokal halten, voraussichtlich:
`aufgabe5-1.html`, `perzeptron/ui/task5-1.mjs`, `perzeptron/task5-1.css`,
eine lokale Datei für die neue lineare Prüfungslogik und deren sinnvolle
Tests sowie `perzeptron/ATTRIBUTION-aufgabe5-1.md`.
Keine Änderungen an gemeinsam genutzten Altdateien voraussetzen.

Einziger vorgesehener bestehender Integrationspunkt:
`faecher/informatik/klasse-11/index.html`, neue Kachel nach Aufgabe 5 und
vor Aufgabe 6.1: „Aufgabe 5.1“ / „Das Perzeptron verbessert sich“.
Im neuen Modul Links zur Jahrgangsübersicht, Startseite und bisherigen
Aufgabe 5 vorsehen. Keine neue Verlinkung durch Änderung von Aufgabe 5.

Eigener versionierter Speicherschlüssel, etwa
`informatik11-perzeptron-aufgabe5-1-v1`; keine gemeinsame Verwendung des
Schlüssels von Aufgabe 5. Alle Parameter, Tabellenantworten, Formelentwürfe,
Quizauswahlen, Bearbeitungsstände, Hilfsanzeigen und der aktive Reiter werden
bei Änderungen gesichert und beim Laden konsistent wiederhergestellt.
Reset löscht ausschließlich den Stand von 5.1. Beschädigter oder gesperrter
Speicher darf die Bearbeitung nicht verhindern.

Keine neue KI-Korrektur nötig: Alle hier vorgesehenen Antworten sind lokal
deterministisch prüfbar. Kein Skriptserver-Auftrag für diese Umsetzung.

Layout und Barrierearmut: bestehende Farben/Karten/Buttons; Arbeitsauftrag
über der Simulation; auf Laptop und Tablet Grafik und zentrale Bedienung
nebeneinander, mobil untereinander; keine horizontale Seitenscrollbar.
Sichtbare Labels, Fokusmarkierungen, Tastaturbedienung und `aria-live`.
Klassen und Rückmeldungen nie ausschließlich über Farbe vermitteln.

## Prompt A – Planung

```text
Rolle: lernmodul-planner. Erstelle die Spezifikation für Aufgabe 5.1 aus
dem gemeinsamen Auftrag in aufgabe5-1-perzeptron-prompts.md. Schreibe
keinen Produktcode und ändere keine bestehende Moduldatei.

Lies AGENTS.md, manifest-allgemein.txt und manifest-quizaufgaben.txt
vollständig, prüfe lokale Vorgaben und die genannten Referenzen. Lies die
drei Quellenkapitel einschließlich ihrer interaktiven Daten. Verwendbare
Projektkomponenten konkret benennen, bevor neue Logik geplant wird.

Lieferung: perzeptron/SPEZIFIKATION-aufgabe5-1.md mit Lernzielen,
Quellenzuordnung jeder Teilaufgabe, unveränderten Originaldaten,
verbindlichen Schülerwortlauten, Reiterfolge, gestuften Hilfen,
Feedbackfällen, Musterergebnissen, Quizfragen samt richtigen Antworten,
Datei-/Integrationsliste, Speichervertrag und GeoGebra-Integrationsplan.
Die Merksätze und Zielformeln erscheinen erst nach der Erarbeitung.

GeoGebra mit eigener API-Einbettung ist der Hauptweg; lege den konkreten
Integrationsnachweis und den begrenzten SVG-Ersatz fest. Unterscheide im
Prüfvertrag 5a (Äquivalenz zum Neuron) und 5b (beliebige korrekte Trennung).
Schreibe zwei getrennte, nummerierte Akzeptanzlisten: mechanisch-technisch
für die Vorprüfung und fachlich-didaktisch für die Endabnahme.
Aufgabe 5 sowie ihre Ressourcen und Speicherstände bleiben unverändert.
```

## Prompt B – Bau

```text
Rolle: lernmodul-builder. Implementiere ausschließlich die freigegebene
SPEZIFIKATION-aufgabe5-1.md. Schülerwortlaute unverändert übernehmen.
Bei einer echten Lücke die Spezifikation zur Planung zurückgeben statt
eigene Lerninhalte oder einen anderen Prüfmaßstab einzuführen.

Eingaben: vollständige Spezifikation und dort benannte Referenzdateien.
Erlaubte Änderungen: ausschließlich die in der Spezifikation genannten
neuen 5.1-Dateien und der lokale Menüeintrag in Klasse 11/index.html.
Aufgabe 5 und gemeinsam verwendete Altdateien nicht bearbeiten.

Beginne mit dem kleinen GeoGebra-Integrationsnachweis. Danach Modul,
lokale Prüflogik, vollständige Speicherung, Quellenkennzeichnung und
Abschlussquiz bauen. SVG-Ersatz nur nach dokumentiertem Integrationsfehler.
Die Feuerentscheidung muss überall strikt > sein, einschließlich der
Grenzpunkte. Parser, Darstellung und Prüfung teilen dieselbe Normalform.

Sinnvolle Logiktests: äquivalente Formeln, negative Umformung, falsche
Halbebene, = versus > versus >=, Randpunkte, Syntaxfehler, nichtlineare
Eingaben, konstante Ausdrücke, vertikale/horizontale Grenzen, Skalierung
und verschiedene gültige Trennungen. Teste ausdrücklich eine Antwort,
die alle vier Labels erfüllt, aber für 5a nicht äquivalent ist.

Lieferung: funktionierende neue Moduldateien, Liste der Änderungen und
wiederverwendeten Komponenten, Testbefehle und Ergebnisse sowie bekannte
Integrationsprobleme. Kein Commit, Upload oder Deployment ohne Auftrag.
```

## Prompt C – Regelbasierte Vorprüfung

```text
Rolle: lernmodul-pruefer. Prüfe die mechanisch-technischen Akzeptanzkriterien
der SPEZIFIKATION-aufgabe5-1.md gegen den Bau. Produktdateien nicht ändern;
keine didaktische Endbewertung vornehmen.

Eingaben: Spezifikation, Liste geänderter Dateien und Bau-/Testbericht.
Kontrolliere insbesondere den unveränderten Zustand von Aufgabe 5 und
ihrer Ressourcen, neue Dateinamen/Links, Reihenfolge 5–5.1–6 im Menü,
Navigation, UTF-8/lang, Überschrift/Aufgabennummer, nummerierte responsive
Reiter und Abschlussquiz im letzten Reiter.

Prüfe jeden Einzelbutton, addQuizQuestionChecks, Labels, Fokus und
textliches aria-live-Feedback. Bearbeite die Seite im Browser auf Desktop,
Tablet und Smartphone. In jedem Reiter jede Eingabeart ohne Prüfen-Klick
ändern, zur Übersicht wechseln und zurückkehren; Wiederherstellung,
Zeichnung, Hilfsanzeigen und aktiven Reiter kontrollieren. Reset und
gesperrten/beschädigten Speicher prüfen.

Führe die vereinbarten Parser-/Prüflogiktests und Syntaxchecks aus,
prüfe den GeoGebra-Laden-/Fehlerpfad bzw. den dokumentierten Ersatz und
git diff --check. Ergebnisse je Kriterium mit Nachweis aufführen.
Sicherungsblatt-, PDF-, Lehrercode- und Skriptserverprüfungen sind hier
nicht anwendbar, weil diese Artefakte nicht beauftragt sind.

Lieferung: PRUEFUNG_BESTANDEN oder PRUEFUNG_FEHLER, mit konkreten
Fundstellen, reproduzierbaren Schritten und offenen Punkten. Nicht
ausgeführte Browserprüfungen ausdrücklich nennen; nicht als bestanden
ausgeben. Den Bericht an Builder/Orchestrator zurückgeben.
```

## Prompt D – Fachliche und didaktische Endabnahme

```text
Rolle: lernmodul-reviewer. Prüfe erst nach bestandener regelbasierter
Vorprüfung. Produktdateien nicht ändern.

Eingaben: vollständige SPEZIFIKATION-aufgabe5-1.md, geänderte Dateien,
Bau-/Testbericht und Bericht der Vorprüfung. Arbeite die getrennte
fachlich-didaktische Akzeptanzliste ab.

Prüfe Quellennähe zu Kapitel 2–4 und den Schwerpunkt bei Kapitel 3,
Aufgabe 5. Wird zuerst beobachtet, warum eine ganze Halbebene benötigt
wird, bevor die zentrale Ungleichung verlangt wird? Entwickeln die SuS
selbst die Formel, ohne vorher sichtbare Zielformel oder vorbelegte Lösung?
Klären Aufgaben und Feedback Gleichung, Grenze, Halbebene und Ausgabe?

Prüfe die strenge Feuerbedingung und die übereinstimmende
Konvention mit Aufgabe 5. Beurteile 5a/5b nach ihren unterschiedlichen
Zielen: alle äquivalenten Darstellungen für 5a, jede korrekte lineare
Punkttrennung für 5b. Prüfe die ursprünglichen Zahlenwerte, x=0,25,
Grenzpunkte, positive Skalierung und Zeichenwechsel bei negativen Faktoren.
Im Expertenfall darf die Grenze nicht fälschlich als mitinvertiert gelten.

Prüfe Altersangemessenheit, gestufte Hilfen, konkrete Fehlerhinweise,
erneutes Verbessern, fachlich stimmige Übersicht und Quizqualität.
Prüfe Wiederverwendung, visuelle Konsistenz, Lesbarkeit und ausreichenden
Raum für die zentrale Grafik samt Eingabe. Der Titel darf kein bereits
automatisches Lernen behaupten, wenn Parameter hier manuell verändert
werden. Aufgabe 5 bleibt unverändert.

Lieferung: APPROVED oder CHANGES_REQUIRED. Bei Beanstandungen konkrete
Fundstelle, verletztes Kriterium, fachlichen Grund und erforderliche
Korrektur nennen. Keine neue Modulkonzeption als Zusatzauftrag erfinden.
```
