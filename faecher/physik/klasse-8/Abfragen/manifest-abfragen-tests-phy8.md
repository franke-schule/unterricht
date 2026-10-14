# Manifest für Abfragen und Tests in Phy8

Dieses Manifest gilt ausschließlich für **Physik, Jahrgangsstufe 8**. Es legt
das Konzept, die Ablage und den Stil gedruckter Abfragen mit einem zugehörigen
Test für den Rest der Klasse fest. Grundlage sind die bereits erstellten
Materialien zur Stromstärke- und Spannungsmessung sowie die dazu bestätigten
Formulierungen.

Die Abfrage dient der Befragung einzelner Schülerinnen und Schüler. Der Rest
der Klasse bearbeitet währenddessen einen schriftlichen Test zu denselben
Lerninhalten. Zu beiden Fassungen gibt es vollständige Lösungen für die Klasse.
Alle vier Blätter funktionieren auf Papier.

Für Arbeiten im Repository `unterricht` gelten zusätzlich
[AGENTS.md](../../../../AGENTS.md),
[manifest-allgemein.txt](../../../../manifest-allgemein.txt) und
[manifest-physikaufgaben.txt](../../../../manifest-physikaufgaben.txt).
Dieses Manifest konkretisiert die Gestaltung des Abfrage-Test-Paars. Die
Vorgaben für mehrseitige Lernarbeitsblätter sind kein Anlass, ein solches Paar
um einen Lernteil oder weitere Quizseiten zu erweitern.

## 1. Zentrale Ablage und Nummerierung

Alle Phy8-Abfragen und die dazugehörigen Tests liegen unter:

```text
unterricht/faecher/physik/klasse-8/Abfragen/
```

Jede Stunde bzw. jeder eigenständige Abfragesatz erhält einen gemeinsamen
Unterordner mit fortlaufender Nummer und kurzem Themennamen:

```text
Abfragen/
  manifest-abfragen-tests-phy8.md
  1-Atome-und-Ladungen/
  2-Stromstärke/
  3-Stromstärke-messen/
  4-Spannung/
  5-Spannung-messen/
  6-<nächstes-Thema>/
```

- Vor dem Anlegen eines Ordners den vorhandenen Bestand prüfen. Ein bereits
  angelegter Themenordner wird weiterverwendet, auch wenn er noch leer ist.
- Die Nummer bezeichnet die Reihenfolge der Abfragesätze. Sie ist unabhängig
  von Arbeitsblattnummern, Aufgaben im Lernmodul und Unterrichtseinheitsnummern.
- Die vorhandenen Nummern und Namen bleiben bestehen. Ein weiteres Thema
  erhält die nächste freie Nummer nach der höchsten vergebenen Nummer.
  Auch reservierte Ordner zählen als vergeben.
- Abfrage, Test und Lösungen einer Stunde liegen zusammen. Zusätzliche
  eigenständige Stunden erhalten einen eigenen nummerierten Ordner.
- Bestehende Hefteinträge, Bilder und Arbeitsblätter bleiben als fachliche
  Quellen in ihrer Materialablage; die Abfragedateien werden zentral abgelegt.
- Bei einer Verschiebung Dateinamen zunächst beibehalten und vorhandene
  Verweise sowie relative Bild- und LaTeX-Pfade prüfen und anpassen.

### Vorhandener Bestand am 14.10.2026

| Ordner | Bestand und Funktion |
| --- | --- |
| `1-Atome-und-Ladungen` | Reserviert; noch keine Abfragedateien. |
| `2-Stromstärke` | Abfrage zu AB 4 mit Lösungen vorhanden; ein zugehöriger Test fehlt bislang. Die bestehenden Dateinamen lauten `abfrage-ab4-ladungstrennung*`. |
| `3-Stromstärke-messen` | Vollständiges Paar mit Lösungen; ursprüngliche Gestaltungsvorlage. |
| `4-Spannung` | Reserviert; noch keine Abfragedateien. |
| `5-Spannung-messen` | Vollständiges Paar mit Lösungen; aktuelle Referenz für Modellbezug, Umrechnungen und Schaltpläne. |

Die Bestandsangaben beschreiben den aktuellen Zustand. Bei einem neuen Auftrag
werden die benötigten Inhalte aus dem Unterrichtsmaterial bestimmt; leere
Ordner sind keine bereits fertiggestellten Abfragen.
Eine kurze `README.md` erhält reservierte Themenordner im Repository und
verweist auf dieses Manifest, bis die Unterrichtsmaterialien erstellt sind.

## 2. Verbindliche Dateien für einen neuen Abfragesatz

Ein vollständiger Satz umfasst acht Dateien:

```text
abfrage-<thema>.tex
abfrage-<thema>.pdf
abfrage-<thema>-loesungen.tex
abfrage-<thema>-loesungen.pdf
test-<thema>.tex
test-<thema>.pdf
test-<thema>-loesungen.tex
test-<thema>-loesungen.pdf
```

Neue Dateinamen verwenden Kleinbuchstaben und Bindestriche; Umlaute werden
mit `ae`, `oe`, `ue` und `ß` mit `ss` geschrieben. Bestehende Ordnernamen wie
`3-Stromstärke-messen` werden beibehalten. Im sichtbaren Text stehen korrekte
deutsche Umlaute und Fachbegriffe.

Nur die endgültigen `.tex`- und `.pdf`-Dateien gehören zum Abfragesatz.
Buildprotokolle, Hilfsdateien und Renderbilder liegen in einem temporären
Buildordner, beispielsweise `unterricht/tmp/pdfs/phy8/<thema>/`.

## 3. Vorlagen vor der Erstellung lesen

Die folgenden Quellen direkt übernehmen und anpassen, statt das Layout neu
zu entwickeln:

- [Abfrage Stromstärke messen](3-Stromstärke-messen/abfrage-stromstaerke-messen.tex)
  und [zugehörige Lösungen](3-Stromstärke-messen/abfrage-stromstaerke-messen-loesungen.tex).
- [Test Stromstärke messen](3-Stromstärke-messen/test-stromstaerke-messen.tex)
  und [zugehörige Lösungen](3-Stromstärke-messen/test-stromstaerke-messen-loesungen.tex).
- [Abfrage Spannung messen](5-Spannung-messen/abfrage-spannung-messen.tex)
  und [zugehörige Lösungen](5-Spannung-messen/abfrage-spannung-messen-loesungen.tex).
- [Test Spannung messen](5-Spannung-messen/test-spannung-messen.tex)
  und [zugehörige Lösungen](5-Spannung-messen/test-spannung-messen-loesungen.tex).

Die zugehörigen PDFs dienen als Gestaltungskontrolle. Für aktuelle Beispiele
zu den Aufgaben 6 und 7 den Test in `5-Spannung-messen` lesen: Er enthält den
erklärenden Transfer vom Modell zum Stromkreis und **ein** Voltmeter parallel
zur Glühbirne. Die benötigte Zahl der Messgeräte richtet sich immer nach der
konkreten Aufgabenstellung.

## 4. Gemeinsame didaktische Konzeption

1. Den Auftrag und die Hefteinträge, Arbeitsblätter und Abbildungen der
   betreffenden Stunde vollständig sichten.
2. Lernziele, verwendete Fachbegriffe, notwendige Ergebnisse und typische
   Fehlvorstellungen für Abfrage und Test gemeinsam festlegen.
3. Nur bereits behandelte Inhalte prüfen. Ein Hefteintrag ist eine fachliche
   Grundlage; seine bloße Erwähnung ersetzt eine klare Aufgabenstellung nicht.
4. Dieselben Lernziele in beiden Blättern abdecken. Der Test darf andere
   Zahlenwerte und andere Aufgabenformate verwenden.
5. Musterlösungen zusammen mit den Aufgaben formulieren und danach den
   benötigten Schreib- und Zeichenraum festlegen.

Die Abfrage prüft überwiegend selbstständiges Beschreiben, Erklären und
Skizzieren. Der Test verbindet kurze Ankreuzaufgaben mit eigenen Antworten.
So bearbeitet die übrige Klasse die Inhalte selbstständig und überprüfbar.

Die Blätter enthalten kurze Prüfaufträge und ausreichend Arbeitsraum.
Bearbeitungszeiten, Bewertungseinheiten und Notenschlüssel werden nur aus
einem konkreten Auftrag übernommen; dafür besteht bisher kein einheitliches
Schema. Die vorhandenen Vorlagen haben kein Kopffeld für Name, Klasse und Datum.

## 5. Aufbau der Abfrage

- Eine A4-Seite mit ungefähr vier nummerierten Hauptaufgaben ist die Vorlage.
  Teilaufgaben `a)` und `b)` sind möglich.
- Typische Reihenfolge: gegebenenfalls kurze Anwendung oder Umrechnung,
  Beschreibung bzw. Erklärung eines Zusammenhangs, fachliche Zuordnung und
  abschließend eine Anwendung oder Skizze.
- Freitextaufgaben erhalten Schreiblinien; Skizzenaufgaben erhalten ein
  kariertes Feld. Beide werden unmittelbar unter dem Arbeitsauftrag platziert.
- Falls eine Grafik für die Bearbeitung benötigt wird, steht der darauf
  bezogene Arbeitsauftrag unter der Grafik und direkt vor dem Arbeitsbereich.
- Anzahl und Reihenfolge dürfen dem Thema angepasst werden. Die Vorlage
  bestimmt den Stil, nicht eine zwingende Liste von vier immer gleichen Fragen.

## 6. Aufbau des Tests für den Rest der Klasse

Als Grundform dient eine A4-Seite mit ungefähr sieben nummerierten Aufgaben:

| Variante | Aufbau |
| --- | --- |
| Stromstärke messen | Fünf Ankreuzaufgaben, danach zwei produktive Aufgaben mit eigenen Antworten. |
| Spannung messen | Eine kurze Umrechnungsaufgabe, vier Ankreuzaufgaben, danach eine Beschreibe-/Erkläre-Aufgabe und eine Schaltplanskizze. |

- Die Aufgaben lassen sich ohne Tablet, Internet und mündliche Hilfen bearbeiten.
- Jede Ankreuzaufgabe besitzt üblicherweise vier Aussagen mit Auswahlkästchen.
- Der Auftrag lautet **„Kreuze alle richtigen Aussagen an.“** oder bei
  Zuordnungen **„Kreuze alle richtigen Zuordnungen an.“**. Er darf bereits
  im fett gesetzten Aufgabentitel stehen.
- Mindestens zwei Ankreuzaufgaben haben mehrere richtige Antworten. In den
  vorhandenen Beispielen sind es häufig zwei richtige und zwei falsche Aussagen.
  Die Positionen der richtigen Antworten variieren.
- Falsche Aussagen greifen plausible Fehlvorstellungen auf. Jede Aussage ist
  für sich eindeutig bewertbar.
- Produktive Aufgaben verlangen weiterhin eine eigene Beschreibung,
  Erklärung, Rechnung oder Skizze. Ein ausschließlich aus Ankreuzaufgaben
  bestehender Test entspricht dem Konzept nicht.

Bei Umrechnungen bleibt der Umfang kurz. Im Beispiel Ampere/Milliampere gibt
es pro Blatt genau eine Umrechnung von mA in A und eine von A in mA. Abfrage
und Test verwenden unterschiedliche Zahlen. Dies ist ein Muster für diesen
Inhalt und keine zusätzliche Pflichtaufgabe für jede andere Stunde.

## 7. Operatorenstil und Modellbezug

Alle Fragen sind als Arbeitsaufträge im Operatorenstil formuliert. Operatoren
werden fett gesetzt, beispielsweise mit `\textbf{Erkläre}`. Übliche Operatoren:
**Nenne**, **Benenne**, **Beschreibe**, **Erkläre**, **Ordne zu**, **Rechne um**,
**Skizziere**, **Ergänze** und **Kreuze an**.

Aufgaben bleiben kurz, eindeutig, altersgerecht und konkret. Meist genügen
ein bis zwei kurze Sätze. Bei mehreren Anforderungen sind alle geforderten
Leistungen erkennbar. Frageformulierungen wie „Was passiert?“ werden in einen
passenden Auftrag wie „Beschreibe die Veränderung ...“ umformuliert.

Bei Modellen werden **Modell und dargestellter physikalischer Sachverhalt**
ausdrücklich benannt. Beschreibung und Transfer sind zwei erkennbare Leistungen:

> Das Förderbandmodell ist ein Modell für den elektrischen Stromkreis.
> **Beschreibe** im Förderbandmodell die Wirkung einer Kugel am Drehkreuz
> und ihren weiteren Weg. **Erkläre** den Bezug zu der Situation im
> elektrischen Stromkreis.

Zuordnungen lauten beispielsweise „Im Modell stellt das Drehkreuz die
Glühbirne dar.“ So bleibt klar, dass ein Modell untersucht und anschließend
auf die Situation im Stromkreis bezogen wird. Modellgrenzen werden geprüft,
wenn sie Unterrichtsinhalt oder Bestandteil des Auftrags sind.

### Bestätigtes Beispiel zum Förderbandmodell

| Bestandteil des Modells | Dargestellter Bestandteil bzw. Größe |
| --- | --- |
| Förderband | Batterie |
| Drehkreuz | Glühbirne |
| Höhenunterschied | Elektrische Spannung |
| Kugeln | Elektronen; für den erklärenden Transfer in Testaufgabe 6 |

Die Musterlösung beschreibt den Kugelumlauf und erklärt den Transfer:
Die Elektronen geben Energie an die Glühbirne ab. Diese wandelt elektrische
Energie in Licht und Wärme um. Die Elektronen werden dabei nicht verbraucht
und bewegen sich im geschlossenen Stromkreis weiter.

Die bloße Zuordnung „Drehkreuz = Glühbirne“ erfüllt einen Auftrag zum
**Erklären** des Zusammenhangs noch nicht.

## 8. Messaufgaben und fachliche Darstellung

Der Arbeitsauftrag benennt die zu messende Größe und das Bauteil eindeutig.
Wenn die Wahl des Messgeräts Teil der Aufgabe ist, bleibt sie eine Leistung
der Schülerinnen und Schüler. Bestätigte Formulierung aus Testaufgabe 7:

> **Skizziere** einen geschlossenen Stromkreis aus Batterie und Lampe.
> Es soll die Spannung gemessen werden, die an der Glühbirne abfällt.
> **Ergänze** ein entsprechendes Messgerät.

Die zugehörige Lösung zeigt **ein Voltmeter parallel zur Glühbirne**. Ein
weiteres Messgerät an der Batterie gehört nur zu einer Aufgabe, die auch diese
Messung verlangt. Schaltzeichen, Verbindungen und Beschriftungen werden direkt
in TikZ dargestellt. Verbindungspunkte und Leitungen müssen eindeutig sein.

Für andere Stunden werden ausschließlich die passenden fachlichen Vorgaben
übernommen. Insbesondere beachten:

- Ein Amperemeter wird zur Stromstärkemessung in Reihe angeschlossen.
- Ein Voltmeter wird zur Spannungsmessung parallel zum gemessenen Bauteil
  angeschlossen.
- Eine Glühbirne wandelt Energie um; sie verbraucht keine Elektronen.
- Größen, Formelzeichen, Einheiten und Indizes werden konsistent gesetzt.
- Dezimalzahlen erhalten ein deutsches Komma, etwa `$0{,}24\,\mathrm{A}$`.
  Zwischen Zahlenwert und Einheit steht ein Abstand; Einheiten stehen aufrecht.
- Divisionen und zusammengesetzte Einheiten werden mit einem waagerechten
  Bruchstrich dargestellt, beispielsweise `\frac{...}{...}`.
- Rechenergebnisse stimmen in Zahlenwert und Einheit; eine reine Umrechnung
  verändert die physikalische Größe nicht. Gerundet wird nur, wenn nötig.

## 9. Verbindliche Gestaltung

Die bestehenden LaTeX-Vorlagen bestimmen die Gestaltung:

| Merkmal | Vorgabe |
| --- | --- |
| Dokument | `\documentclass[10pt,a4paper]{article}`; A4 im Hochformat |
| Seitenränder | `geometry` mit `margin=14mm` |
| Schrift | `lmodern`, serifenlos über `\familydefault=\sfdefault` |
| Sprache und Encoding | `T1`, UTF-8, `babel` mit `ngerman` |
| Kopf | Dunkelblaue Leiste; links „PHYSIK · KLASSE 8“; rechts goldenes Kennzeichnungsfeld |
| Kennzeichnung | `ABFRAGE`, `TEST` bzw. `LÖSUNGEN` |
| Haupttitel | Thema; Vorlage: 16 pt Schrift bei 19 pt Zeilenabstand |
| Untertitel | Kurze Inhaltsangabe; im Test gegebenenfalls „Test zur Abfrage“ |
| Aufgaben | Fortlaufende Nummer und kurzer Titel; blau mit dünner Trennlinie |
| Arbeitsbereiche | Helle Schreiblinien oder 5-mm-Karoraster |
| Lösungen | Blaue Antworttexte, gesetzte Auswahlkästchen und echte Skizzen |
| Fuß | Klasse, Fach, Unterrichtseinheit, Fassung und tatsächliche Seitenzahl |

Die Farbdefinitionen werden übernommen:

```text
Navy  #17324D
Blue  #3B6EA5
Gold  #F3B33D
Ink   #1E2935
Muted #617080
Line  #D8E1E8
```

Vorhandene Makros weiterverwenden: `\kopf`, `\frage`, `\antwortfeld`,
`\karofeld`, `\fuss` sowie im Test `\wahl`. Bei passenden Umrechnungsaufgaben
kann auch `\umrechnungen` aus der Spannungsvorlage übernommen werden.

Schreiblinien haben in den Vorlagen 7 bis 8 mm Abstand. Die Höhe wird nach
der geforderten Antwort bemessen. Ein zusätzlicher Erklärauftrag braucht
zusätzlichen Schreibraum; eine komplexere Skizze braucht ein größeres Feld.
Einzelne Themen dürfen passende TikZ-Zeichnungen ergänzen; Kopf, Farben,
Typografie und Grundaufbau bleiben erhalten.

Jede der vier Fassungen soll auf eine A4-Seite passen. Zuerst Formulierungen
und Abstände optimieren, wenn es eng wird. Handschriftlicher Arbeitsraum,
Lesbarkeit und fachlich vollständige Lösungen bleiben erhalten. Bei fachlich
notwendigem Mehrumfang sind zusätzliche Seiten mit korrekter Fußzeile besser
als abgeschnittene Inhalte.

## 10. Lösungsfassungen mit gleichem Layout

Abfrage und Test dürfen untereinander unterschiedliche Aufgabenpositionen
haben. **Innerhalb jedes Paars aus Schüler- und Lösungsfassung** bleiben
Seitenzahl, Aufgabenreihenfolge und Arbeitsbereiche gleich.

Die Lösungen stehen bereits in der Schülerquelle innerhalb des Schalters:

```latex
\newif\ifsolution
\solutionfalse
```

Die Lösungsquelle wird aus dieser Datei erzeugt. Nur `\solutionfalse` wird
zu `\solutiontrue` geändert; der restliche Inhalt bleibt zeichengleich.
Beispiel in Python:

```python
solution = student.replace(r"\solutionfalse", r"\solutiontrue")
```

- Arbeitsbereiche besitzen in beiden Fassungen dieselbe feste Bounding-Box.
  In der Schülerfassung erscheinen Linien bzw. leere Raster, in der
  Lösungsfassung die Antworten innerhalb dieses Raums.
- `\antwortfeld{<Zeilenzahl>}{<Musterlösung>}` nimmt eine vollständige,
  verständliche Musterantwort auf.
- `\wahl{1}{...}` kennzeichnet eine richtige Aussage,
  `\wahl{0}{...}` eine falsche. In der Lösungsfassung werden die richtigen
  Kästchen angekreuzt; in der Schülerfassung bleiben alle Kästchen leer.
- `\karofeld{<Höhe in mm>}{<TikZ-Lösung>}` zeigt die geforderte Skizze im
  vorgesehenen Raster. Eine Zeichnung wird durch eine Zeichnung gelöst.
- Die Lösung beantwortet jede Teilanforderung: Beschreibung, Erklärung,
  Zuordnung, Umrechnung und geforderte Messung.
- Bei einer Aufgabenänderung werden Lösungstext, Zeichnung, Schreibraum und
  beide PDFs gemeinsam aktualisiert. Die Lösungsquelle wird erneut abgeleitet.

## 11. Erstellung, PDF-Bau und Prüfung

1. Material und fachlich passende Referenzdateien lesen.
2. Passenden Themenordner unter `Abfragen` auswählen oder mit der nächsten
   Nummer anlegen. Danach Abfrage und Test gemeinsam konzipieren.
3. Schülerquellen aus den Vorlagen erstellen; Titel, Untertitel, Themenangaben
   in der Fußzeile und konkrete Aufgaben anpassen. Musterlösungen einarbeiten.
4. Beide Lösungsquellen ausschließlich über den Lösungsschalter erzeugen.
5. Alle vier PDFs aus den endgültigen Quellen in einem temporären Ordner
   bauen. Beispielsweise je Quelle:

   ```text
   pdflatex -interaction=nonstopmode -halt-on-error -output-directory=<Buildordner> <Quelldatei.tex>
   ```

6. Seitenzahl und LaTeX-Protokolle auf Fehler und Überläufe prüfen.
7. Jede PDF-Seite als Bild rendern, beispielsweise mit
   `pdftoppm -png <Datei.pdf> <Bildpräfix>`, und visuell prüfen. Textauslesen
   allein bestätigt keine korrekte Gestaltung.
8. Schüler- und Lösungsfassung direkt vergleichen: Aufgabenpositionen,
   Umbrüche, Feldhöhen, Auswahlkästchen und Zeichnungen kontrollieren.
9. Erst die geprüften PDFs in den Themenordner übernehmen. Quellen und PDFs
   müssen denselben endgültigen Stand wiedergeben.
10. Lokale Pfade und `git diff --check` für die eigenen Änderungen prüfen.

Ist eine vorhandene PDF durch ein geöffnetes Programm gesperrt, die geprüfte
Ausgabe vorübergehend als `...-aktualisiert.pdf` bereitstellen und den abweichenden
Dateinamen ausdrücklich melden. Sobald die Datei ersetzbar ist, den regulären
Dateinamen aktualisieren. Eine ältere gesperrte Ausgabe darf nicht als aktueller
Stand gemeldet oder bei einer späteren Umstrukturierung verwechselt werden.

### Abnahmekriterien

- [ ] Der Auftrag betrifft Phy8; fachliche Quellen und Lernziele sind klar.
- [ ] Alle Abfragedateien liegen im passenden nummerierten Ordner unter `Abfragen`.
- [ ] Abfrage, Test und beide Lösungsfassungen sind als `.tex` und `.pdf` vorhanden.
- [ ] Abfrage und Test prüfen dieselben behandelten Lerninhalte.
- [ ] Jede Frage steht im Operatorenstil; Operatoren sind fett gesetzt.
- [ ] Modelle sind als Modelle benannt; ein geforderter Transfer wird auch erklärt.
- [ ] Mindestens zwei Ankreuzaufgaben erlauben mehrere richtige Antworten.
- [ ] Produktive Aufgaben und ausreichender Schreib- bzw. Zeichenraum sind vorhanden.
- [ ] Messgröße, Bauteil und Anzahl der Messgeräte stimmen in Auftrag und Zeichnung überein.
- [ ] Rechenergebnisse, Fachbegriffe, Einheiten und Antwortmarkierungen sind korrekt.
- [ ] Jede Musterlösung erfüllt sämtliche Teilaufträge.
- [ ] Schüler- und Lösungsquelle unterscheiden sich nur im Lösungsschalter.
- [ ] Alle vier PDFs wurden aus dem aktuellen Stand gebaut und visuell geprüft.
- [ ] Schüler- und Lösungsfassung haben gleiche Seitenzahl und Aufgabenpositionen.
- [ ] Kopf, Fuß, Schrift und Farben entsprechen den Vorlagen; Inhalte sind vollständig sichtbar.
- [ ] Nur endgültige Quellen und PDFs liegen im Themenordner; eigene Änderungen sind geprüft.
