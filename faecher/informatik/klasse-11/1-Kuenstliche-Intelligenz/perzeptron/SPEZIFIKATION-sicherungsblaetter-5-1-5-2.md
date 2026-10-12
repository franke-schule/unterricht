# Sicherungsblaetter 5.1 und 5.2 - verbindliche gemeinsame Spezifikation

## Auftrag und Quellen

Zwei zusammengehoerige Loesungsblaetter zu `aufgabe5-1-grafisch.html` und
`aufgabe5-2.html`, keine neuen Uebungen. Fachlicher Stand ist der jeweilige
aktuelle Modulinhalt samt `perzeptron/ui/task5-1-grafisch.mjs`,
`perzeptron/ui/task5-2.mjs` und `perzeptron/logic/perceptron.mjs`.
Das bisherige Sicherungsblatt zu Aufgabe 5 wird weder als Quelle noch als
Gestaltungsvorlage benutzt. Direkte LaTeX-Vorlage fuer **beide** Blaetter ist
`sicherungsblatt-aufgabe-4-loesungen.tex` im selben Themenordner; die Blaetter
3b/3a sind nur bei Bedarf weitere Referenzen. Praeambel, A4-Raender,
Farben, serifenlose Schrift, `\sheettitle`, `\sectionline` und bestehende
`tcolorbox`-Stile uebernehmen. Je eine gut lesbare A4-Seite anstreben; fuer 5.2
ist eine zweite Seite besser als gedrungene Schrift oder Tabellen.
**Neue Gestaltungsprioritaet: moeglichst wenig Text, moeglichst viel
Visualisierung.** Diagramme, Rechenpfeile und beschriftete Tabellen tragen
den Inhalt; je Abschnitt hoechstens ein kurzer Merksatz, keine
Erklaerungsabsatz-Bloecke. TikZ ist fuer diese code-nativen mathematischen
Grafiken passend. Farben und Boxen der Vorlage 4 wiederverwenden, keine neue
Bildsprache. Visualisierungen sollen den groessten Teil der Blattflaeche
einnehmen und alle Zahlen ohne winzige Schrift lesbar halten.

Ein Umsetzungsverantwortlicher erstellt beide `.tex` und `.pdf` sowie alle
HTML-/JS- und Lehrercode-Aenderungen. Ausgabe im Themenordner:
`sicherungsblatt-aufgabe-5-1-loesungen.tex/.pdf` und
`sicherungsblatt-aufgabe-5-2-loesungen.tex/.pdf`. LaTeX direkt nach Vorlage
bauen, keine ReportLab-PDFs. Nur Quellen und finale PDFs behalten, keine
LaTeX-Hilfsdateien oder Renderbilder im Repo.

## Gemeinsamer Lernkern und Grenzen

Beide Blaetter zeigen denselben Signalweg: zwei Eingaben werden gewichtet,
addiert und **streng** mit der Schwelle verglichen; `a > s` bzw. `a > theta`
liefert 1, sonst 0. Die gerade erreichten Zahlenwerte gehoeren zu den
jeweiligen Aufgaben, nicht zu einem allgemeinen Tiermerkmal-Modell. `s` und
`theta` bezeichnen dieselbe Schwelle. **Nicht** aufnehmen: XOR, Simulator,
generelle Modellgrenzen, andere Trainingsverfahren oder Inhalte der alten
Aufgabe 5. Keine neuen Aufgaben auf den Blaettern.

Typische Fehlvorstellungen **im Bild** aufloesen: Gleichung = Linie,
Ungleichung = offene Seite; auf der Linie Ausgabe 0. Negatives Gewicht allein
erzwingt keine 0. Eine gezeigte passende Gerade/Einstellung ist ein Beispiel,
nicht die einzige Loesung.

## Blatt 5.1 - Das Perzeptron grafisch

Titel: **Das Perzeptron - grafisch**. Unterzeile:
**Kuenstliche Intelligenz · Sicherungsblatt zu Aufgabe 5.1 · Informatik 11**.
Abschnitte in dieser Reihenfolge. Die kurzen Merksaetze und Bildbeschriftungen
sind verbindlich (in LaTeX Umlaute normal setzen):

1. **Tierpunkte und Trenngerade.** Grosses Koordinatendiagramm mit
   `x_1 = Zahnlaenge`, `x_2 = Augengroesse`, U1 `(0|4)`, U2 `(2|2)`
   (Soll 1, ungefaehrlich), G1 `(4|1)`, G2 `(6|2)` (Soll 0,
   gefaehrlich), Hase `(2|4)` und Fuchs `(5|3)`. Kreise/Rauten und
   Beschriftungen wie im Modul, nicht allein Farbcodierung. Grenze
   `-3x_1+4x_2=1` als volle Linie, Feuerseite als helle Flaeche.
   Hase Seite 1, Fuchs Seite 0.
2. **Grenze oder Bereich?** Direkt am selben Plot oder als kleine
   Ausschnittgrafik bei `x_1=2`: T1 `(2|1)` mit `a=-2 -> 0`, T2
   `(2|1,75)` **auf** der Linie mit `a=1 -> 0`, U2 `(2|2)` in der
   offenen Feuerseite mit `a=2 -> 1`. Linie `=1` und Flaeche `>1`
   visuell unterscheiden. Einziger Merksatz: **"Gleichung = Grenze;
   strenge Ungleichung = Feuerseite; auf der Grenze Ausgabe 0."**
3. **Ungleichung verbessern.** Kleiner Bildvergleich mit denselben vier
   Tierpunkten: `y>x+0,25` trennt `3/4` richtig, U2 faellt falsch auf
   Seite 0 (`2>2,25` falsch); Pfeil zu `y>0,5x+0,5`, `4/4` richtig.
   An der neuen Gerade oder in knapper Vier-Zeilen-Legende:
   U1 `4>0,5 -> 1`, U2 `2>1,5 -> 1`, G1 `1>2,5` falsch `-> 0`,
   G2 `2>3,5` falsch `-> 0`. **"Eine moegliche Verbesserung"**
   beschriften; die neue Gerade ist die in Reiter 4 gezeichnete.
4. **Von der Geraden zum Neuron.** Eine **Rechenpfeilkette** mit vier
   beschrifteten Stationen statt Fliesstext:
   `y=0,5x+0,5` (Gerade) `->` `y>0,5x+0,5` (Feuerseite)
   `->` `-x_1+2x_2>1` (Eingangsnotation)
   `->` `w_1=-1, w_2=2, s=1` (Parameter).
   Kontrollleiste `U1/U2 -> 1`, `G1/G2 -> 0`.
   Einziger Merksatz: **"Gewichte und Schwelle beschreiben dieselbe
   Feuerseite wie die strenge Ungleichung."** Kleiner Randhinweis, falls
   Platz: gemeinsames **positives** Vielfaches ist gleichwertig.

Die freiwillige Expertenaufgabe zu vertauschter Feuerseite muss aus
Platzgruenden nicht auf das Blatt. Falls aufgenommen, nur als kurzer
Loesungshinweis `x_1 - 2x_2 > -1`; Gleichheit bleibt auch dann Ausgabe 0.

## Blatt 5.2 - Rechnen und Lernen

Titel: **Das Perzeptron genauer betrachtet**. Unterzeile:
**Kuenstliche Intelligenz · Sicherungsblatt zu Aufgabe 5.2 · Informatik 11**.
Abschnitte in dieser Reihenfolge. Ein zusammenhaengendes Signaldiagramm ist
der visuelle Anker; Tabellen und Updatepfeile fuehren es fort:

1. **So rechnet das Perzeptron.** Grosses, zusammenhaengendes
   Signaldiagramm **Eingaben `x_1,x_2` -> Gewichte `w_1,w_2` -> Produkte
   `w_1x_1,w_2x_2` -> Summe `a` -> Vergleich `a>theta` -> Ausgabe
   `f(a)`**. Zwei klar getrennte Rechenspuren **am selben Diagramm** mit
   festen `w_1=-1`, `w_2=2`, `theta=3`:
   Hase `(2|4)`: `-2 + 8 = 6 > 3 -> 1`, ungefaehrlich;
   Hai `(4|1)`: `-4 + 2 = -2 < 3 -> 0`, gefaehrlich.
   Die Spur fuehrt von Produkt ueber Summe und Schwelle zum Ergebnis,
   ohne zweimal ein grosses Neuron zu zeichnen. Einziger Merksatz:
   **"Erst Summe und Schwelle bestimmen die Ausgabe; bei Gleichheit 0."**
2. **Einfache 0/1-Eingaben.** Kleine Ergebnismatrix/kompakte Tabelle
   mit Kopf **"Eine moegliche Einstellung: `w_1=2`, `w_2=0`, `s=1`"**:
   A `(0|0)`, D `(0|1)`, B `(1|0)`, C `(1|1)` in Modulreihenfolge;
   Soll `0,0,1,1`, Summen `0,0,2,2`, Ist `0,0,1,1`.
   Daneben Mini-Grenzfall `(0|0): a=0`, `s<0 -> 1` (unerwuenscht);
   Gewichte wirken bei Null-Eingaben nicht. Beschriftung:
   **"Hier: 1 = feuert, keine Tierklasse."**
3. **Wann feuert es?** Neben einer kompakten Ergebnismatrix das feste
   Neuron `w_1=4`, `w_2=2`, `s=3` und die Bedingung
   `4x_1+2x_2>3` zeigen. A/D/B/C: Summen `0,2,4,6`, Ausgaben
   `0,0,1,1`. Darunter eine **dreistufige Grenzprobe als Zahlenlinie
   oder Pfeilfolge** bei `x_1=0,25`:
   `x_2=0,5 -> a=2 -> 0`, `x_2=1 -> a=3 -> 0`,
   `x_2=1,5 -> a=4 -> 1`; `a=3=s` sichtbar als Gleichheitsfall
   markieren. Merksatz: **"Das Perzeptron feuert nur bei `a>s`."**
4. **Erste Epoche der Delta-Lernregel.** Die drei Formeln als
   **Updatepfeile**, nicht als Textblock:
   `t - f(a) -> delta`, `w_i(alt) + delta*alpha*x_i -> w_i(neu)`,
   `theta(alt) - delta*alpha -> theta(neu)`.
   Start klar beschriftet `w_1=1, w_2=1, theta=1, alpha=1`.
   Darunter vier verbundene Schrittmarker und eine **kompakte
   Epochen-Tabelle** in exakt dieser Reihenfolge; jedes Zahlentripel
   hat die sichtbare Spaltenueberschrift `(w_1,w_2,theta)` fuer
   **vorher** und **nachher**, damit die Werte eindeutig bleiben:

   | Schritt | `(x_1,x_2;t)` | vorher `(w_1,w_2,theta)` | `a` | `f(a)` | `delta` | nachher `(w_1,w_2,theta)` |
   | --- | --- | --- | ---: | ---: | ---: | --- |
   | 1 | `(2,2;1)` | `(1,1,1)` | 4 | 1 | 0 | `(1,1,1)` |
   | 2 | `(4,1;0)` | `(1,1,1)` | 5 | 1 | -1 | `(-3,0,2)` |
   | 3 | `(6,2;0)` | `(-3,0,2)` | -18 | 0 | 0 | `(-3,0,2)` |
   | 4 | `(0,4;1)` | `(-3,0,2)` | 0 | 0 | 1 | `(-3,4,1)` |

   Ergebnisband `w_1=-3`, `w_2=4`, `theta=1`
   `->` gelernte Grenze `-3x_1+4x_2=1`.
   Einziger Merksatz: **"Bei `delta=0` bleibt alles gleich; sonst
   speichert das Perzeptron neue Gewichte und eine neue Schwelle."**

Die breite Epochen-Tabelle darf eine eigene zweite Seite bekommen. Formeln
und Tabellen muessen noch in normaler Druckgroesse lesbar sein.

## Download und Lehrercodes

Zwei neue eindeutige Codes im Muster `FXXX-KXAX`, mit `M` fuer Informatik,
`D` fuer Klasse 11 und `X` fuer Aufgabe 5:

- Aufgabe 5.1: `M5NP-DQX6`
- Aufgabe 5.2: `M7HR-DBX4`

Beide Codes im Repo auf Duplikate geprueft. `lehrercodes-dekodierung.tex`
und die daraus erzeugte PDF: alten Eintrag "Sicherungsblatt KI 5" durch
Eintraege "KI 5.1" und "KI 5.2" mit diesen Codes ersetzen; Seitenumbruch
kontrollieren.

In **beiden** neuen HTML-Modulen je eine `solution-download`-Sektion im
Abschlussquiz-Reiter **und** in der Zusammenfassung. Quelle fuer Markup,
CSS und Freigabeverhalten sind `aufgabe4.html`,
`perzeptron/task5.css` und das doppelte Markup in
`klasse-10/1-Datenbanken/aufgabe1.html`. Zweite Kopie mit IDs-Suffix
`-summary`; beide Eingabefelder behalten `name="solution-code"`. Jedes
Formular verwendet die vorhandene Funktion `unlockSolution(event,
expectedCode, downloadLinkId, messageId)` aus
`faecher/informatik/klasse-10/1-Datenbanken/tab-navigation.mjs`. Aus den
beiden neuen `perzeptron/ui`-Controllern lautet der relative Import
`../../../../klasse-10/1-Datenbanken/tab-navigation.mjs`; die Funktion wird mit
den passenden IDs an beide Formulare gebunden. Sie normalisiert den Code
(Grossbuchstaben, nur A-Z/0-9), verhindert Absenden, meldet Erfolg/Fehler
in `aria-live="polite"` und zeigt den passenden vorher `hidden` gesetzten
PDF-Link nur beim richtigen Code.
Die Downloadsektion und der Zusammenfassungsreiter sind auch ohne bearbeitete
Aufgaben/Quiz erreichbar; die einzige Huerde ist der Lehrercode. Nicht von
`renderSummary()` loeschen lassen: Downloadsektion **ausserhalb** des
dynamisch ersetzten `#summary` platzieren.

Der bisherige `sicherungsblatt-aufgabe-5-loesungen.tex/.pdf` darf nach
vorhandenem Backup entfernt werden. Die fremde untracked Datei
`sicherungsblatt-aufgabe-5-loesungen - Kopie.pdf` bleibt unberuehrt.
`aufgabe5.html` darf keinen Link auf die entfernte PDF behalten: den alten
Downloadblock minimal durch Links zu den zwei neuen Modulen ersetzen und
`setupSolution()` im alten Controller nur bei vorhandenem Formular ausfuehren.
Sonst alte Aufgabe 5 und andere Module nicht aendern.

## Abnahme

**Mechanisch:**

- [ ] Vier finale Blattdateien mit exakten Namen vorhanden; zwei neue Codes
      stimmen zwischen beiden HTML-Seiten und Dekodier-PDF ueberein.
- [ ] Alte `.tex/.pdf` zu Aufgabe 5 entfernt, Backup-Kopie unberuehrt,
      `aufgabe5.html` ohne gebrochenen PDF-Link oder JS-Fehler.
- [ ] Jeder Quiz- und Zusammenfassungsreiter zeigt das eigene geschuetzte
      Blatt unabhaengig von Quizfortschritt; alle IDs eindeutig,
      `name="solution-code"`, Link anfangs verborgen, falscher/richtiger
      Code und Rueckmeldung funktionieren.
- [ ] Relative PDF-Links gueltig; HTML/JS-Syntax, LaTeX-Bau,
      PDF-Seitenzahl und Dekodierkarte geprueft; jede PDF-Seite gerendert und
      beide Blaetter visuell nebeneinander verglichen; `git diff --check`
      fehlerfrei, keine Hilfsdateien im Repo.

**Fachlich-didaktisch:**

- [ ] Jede Zahl und Zuordnung stimmt mit den aktuellen Modulen ueberein;
      insbesondere strenge Grenze, U2/T2, 0/1-Tabelle und alle vier
      Delta-Schritte.
- [ ] Die Blattfolge veranschaulicht erst und formalisiert danach;
      Loesungsbeispiele und Merksaetze sichern Erarbeitetes ohne neue
      Lerninhalte, Uebungen oder alte Aufgabe-5-Themen.
- [ ] Beide Blaetter bleiben im Druck gut lesbar und gestalterisch konsistent
      mit Blatt 4 und miteinander; eine zweite Seite bei 5.2 ist akzeptiert,
      falls sie die Epochen-Tabelle klarer macht.

Nach dem Bau erst regelbasiert vorpruefen, dann fachlich/didaktisch/visuell
abnehmen. Maximal drei Korrekturrunden Bau/Vorpruefung und zwei Endabnahmen.
