# Manifest für Abfragen in Phy11

Dieses Manifest gilt für gedruckte Abfragen und ihre Lösungen in **Physik,
Jahrgangsstufe 11**, im Repository `unterricht`. Es dokumentiert außerdem den
gemeinsamen Auftrag aus Abfrage und Wiederholungsquiz für den Rest der Klasse,
einschließlich späterer Änderungen, Prüfung und Übergabe.

Für die Erstellung gelten zusätzlich [AGENTS.md](../../../../AGENTS.md),
[manifest-allgemein.txt](../../../../manifest-allgemein.txt) und
[manifest-physikaufgaben.txt](../../../../manifest-physikaufgaben.txt).
Für ein Wiederholungsquiz gelten zusätzlich verbindlich
[manifest-wiederholungs-quiz.txt](../../../../manifest-wiederholungs-quiz.txt)
und [manifest-quizaufgaben.txt](../../../../manifest-quizaufgaben.txt).
Dieses Dokument ergänzt deren technischen Ablauf um die gemeinsame Konzeption
mit der gedruckten Abfrage; vorhandene Quizkomponenten werden wiederverwendet.
Das eigene Manifest zu Abfragen und Tests in Phy8 hat ausschließlich dort
Gültigkeit; die Phy11-Vorlagen bestimmen den Aufbau für diese Jahrgangsstufe.

## 0. Auftrag und gemeinsame Grundlage

Vor dem Entwurf festhalten:

- Lernmodulnummer, Unterrichtseinheit und Thema;
- zugehöriges Modul samt Skript und aktuellem Sicherungsblatt, sofern vorhanden;
- behandelte Lernziele, gewünschte Schwerpunkte und ausdrücklich ausgeschlossene
  Inhalte sowie bereits vereinbarte Änderungen;
- gewünschte Fassung: neue Abfrage, weitere Variante oder Überarbeitung;
- bestehende Quizdateien, Präsentation der Einheit und den vorgesehenen
  Kurzlink `https://bycs.link/Phy11-wdhX` (X = Aufgabennummer des Lernmoduls);
  eine ausdrücklich abweichende Vorgabe der Lehrkraft berücksichtigen.

Modul, Merksätze, Sicherungsblatt und vorhandene Aufgaben gemeinsam lesen. Eine
knappe Zuordnung erstellen: **Lernziel → Abfrageaufgabe → Quizaufgabe → erwartete
Leistung**. Rechenwerte und Musterlösungen unabhängig nachrechnen. Bei
widersprüchlichen Quellen den Widerspruch klären, statt ihn in neue Materialien
zu übernehmen. Fehlende Angaben zunächst aus dem Bestand ermitteln; nur für
inhaltlich notwendige, nicht ableitbare Entscheidungen nachfragen.

Ein Auftrag für eine **Phy11-Abfrage zu Aufgabe X** umfasst standardmäßig den
vollständigen gemeinsamen Satz, auch wenn nur „Abfrage“ genannt wird:

1. Gedruckte Abfrage auf Grundlage des Lernmoduls und seines vorhandenen
   Sicherungsblatts, begrenzt auf die tatsächlich behandelten Inhalte.
2. Separate, layoutgleiche Lösungsfassung zur Abfrage.
3. Inhaltlich passendes Wiederholungsquiz für den Rest der Klasse unter
   `aufgabeX-quiz.html`, einschließlich Servereinträgen und Löschanleitung.
4. Eigene Quizfolie direkt hinter der zugehörigen Modulfolie in der
   Präsentation der Einheit, mit `https://bycs.link/Phy11-wdhX` und passendem
   QR-Code. X bezeichnet die Aufgabennummer des Lernmoduls, nicht die Nummer
   einer Quizfrage, Folie oder Abfragevariante.

Ein ausdrücklich engerer oder abweichender Auftrag der Lehrkraft hat Vorrang.
Das vorhandene Sicherungsblatt dient als Quelle; ein neues wird dadurch nicht
beauftragt. Die Prüfung des Kurzlinks und der Umgang mit einer fehlenden
Weiterleitung sind in Abschnitt 10 festgelegt.

Vor der Umsetzung die konkrete Abfragevorlage, Quizvorlage, endgültigen
Dateinamen und Prüfkriterien kurz festlegen. Das Quiz wird gemäß seinem Manifest
direkt nach Vorlage gebaut, ohne eigenen Lernmodul-Loop. Kleine Änderungen
werden direkt erledigt; bei größeren Aufträgen die Rollenteilung aus AGENTS.md
beachten. Ein bestehendes Lernmodul wird durch diesen Auftrag nicht umgebaut.

## 1. Zentrale Ablage

Alle Phy11-Abfragen liegen mit ihren LaTeX-Quellen und PDFs direkt unter:

```text
unterricht/faecher/physik/klasse-11/Abfragen/
```

Die Lernmodule, Sicherungsblätter, Wiederholungsquizdateien und gemeinsam
genutzten Bilder bleiben in ihren jeweiligen Unterrichtseinheiten. Abfragen
werden über ihre Dateinamen dem zugehörigen Lernmodul zugeordnet.

Vor jeder Erstellung den Bestand und die passende Referenz prüfen. Bei einer
Verschiebung erhalten Bilder, LaTeX-Abhängigkeiten und Dokumentationsverweise
gültige relative Pfade. Ein bestehendes Dokument wird unter seinem neuen Namen
weiterverwendet; zusätzliche Kopien mit veralteten Namen gehören nicht zur
zentralen Ablage.

## 2. Verbindliche Dateinamen

Grundschema für eine Abfrage:

```text
Phy11-Lernmodul<X>-<Thema>.tex
Phy11-Lernmodul<X>-<Thema>.pdf
Phy11-Lernmodul<X>-<Thema>-loesungen.tex
Phy11-Lernmodul<X>-<Thema>-loesungen.pdf
```

- `<X>` ist die **Aufgabennummer des zugehörigen Lernmoduls**, beispielsweise
  `3` für `aufgabe3.html`. Die Platzhalterklammern erscheinen nicht im Dateinamen.
- `<Thema>` bezeichnet den Inhalt des Lernmoduls kurz und eindeutig.
  Wortgruppen werden mit Bindestrichen verbunden; Umlaute werden im Dateinamen
  als `ae`, `oe`, `ue`, `ß` als `ss` geschrieben.
- Der Präfix `Phy11-Lernmodul` bleibt in dieser Schreibweise erhalten.
- Schüler- und Lösungsfassung besitzen denselben Stamm; Lösungen tragen den
  Zusatz `-loesungen`. Zu jeder Quelle gehört ein PDF mit demselben Stamm.
- Mehrere Abfragen zum gleichen Modul bleiben unterscheidbar. Die erste
  Fassung verwendet den Grundnamen, weitere Fassungen die Zusätze `-Variante2`,
  `-Variante3` usw. Der Lösungszusatz steht hinter dem Variantenzusatz.
- Bei einer weiteren Unterrichtseinheit das passende Thema so wählen, dass
  die Dateinamen auch bei gleicher Lernmodulnummer eindeutig bleiben.

Beispiele:

```text
Phy11-Lernmodul3-Kreisbewegung.tex
Phy11-Lernmodul3-Kreisbewegung-Variante3.pdf
Phy11-Lernmodul3-Kreisbewegung-Variante3-loesungen.pdf
Phy11-Lernmodul4-Zentripetalkraft.tex
Phy11-Lernmodul5-Haftreibungskraft-als-Zentripetalkraft.pdf
```

## 3. Bestand und Referenzen am 14.10.2026

Alle folgenden Stämme liegen jeweils als `.tex` und `.pdf` vor:

| Lernmodul | Abfrage | Lösungen |
| --- | --- | --- |
| [3: Winkelgeschwindigkeit und Ursache der Kreisbewegung](../1-Kreisbewegungen/aufgabe3.html) | [Phy11-Lernmodul3-Kreisbewegung](Phy11-Lernmodul3-Kreisbewegung.tex) | [Separate Lösungsfassung](Phy11-Lernmodul3-Kreisbewegung-loesungen.tex) |
| 3, Variante 2 | [Phy11-Lernmodul3-Kreisbewegung-Variante2](Phy11-Lernmodul3-Kreisbewegung-Variante2.tex) | Bereits im selben Dokument enthalten. |
| 3, Variante 3 | [Phy11-Lernmodul3-Kreisbewegung-Variante3](Phy11-Lernmodul3-Kreisbewegung-Variante3.tex) | [Separate Lösungsfassung](Phy11-Lernmodul3-Kreisbewegung-Variante3-loesungen.tex) |
| [4: Zentripetalkraft](../1-Kreisbewegungen/aufgabe4.html) | [Phy11-Lernmodul4-Zentripetalkraft](Phy11-Lernmodul4-Zentripetalkraft.tex) | [Separate Lösungsfassung](Phy11-Lernmodul4-Zentripetalkraft-loesungen.tex) |
| [5: Die Haftreibungskraft als Zentripetalkraft](../1-Kreisbewegungen/aufgabe5.html) | [Phy11-Lernmodul5-Haftreibungskraft-als-Zentripetalkraft](Phy11-Lernmodul5-Haftreibungskraft-als-Zentripetalkraft.tex) | [Separate Lösungsfassung](Phy11-Lernmodul5-Haftreibungskraft-als-Zentripetalkraft-loesungen.tex) |

Der Bestand umfasst **fünf Abfragen, neun LaTeX-Dateien und neun PDFs**.
Die getrennten Fassungen haben jeweils zwei A4-Seiten. Variante 2 zu Modul 3
ist eine bestehende Sonderform: Ihr vierseitiges PDF enthält zunächst zwei
Seiten mit Aufgaben und anschließend dieselben zwei Seiten mit Lösungen.
Das ist ein vollständiges kombiniertes Dokument; dort fehlt keine Lösungsdatei.

Für neue Abfragen mit getrennten Lösungen dienen insbesondere Variante 3
zu Modul 3 sowie die Abfragen zu Modul 4 und Modul 5 als direkte Vorlagen.
Die zugehörigen PDFs sind die Gestaltungsvorlage. Bestehende Varianten werden
bei einer reinen Umstrukturierung inhaltlich und gestalterisch erhalten.

## 4. Konzeption und Aufgabenstil

- Die Aufgaben prüfen Inhalte des zugehörigen Lernmoduls und der tatsächlich
  behandelten Stunde. Lernziele und fachliche Quellen vorab gemeinsam sichten.
- Üblich sind vier bis fünf nummerierte Hauptaufgaben auf zwei Seiten.
  Der konkrete Inhalt bestimmt Anzahl, Reihenfolge und benötigten Arbeitsraum.
- Alle Arbeitsaufträge im Operatorenstil formulieren. Operatoren wie
  **Skizziere**, **Beschreibe**, **Erkläre**, **Begründe**, **Berechne**,
  **Bestimme**, **Leite her** und **Bewerte** werden fett gesetzt.
- Rechenaufgaben verlangen den notwendigen Rechenweg, passende Einheiten und
  Ergebnisse mit angemessenen gültigen Ziffern.
  Ein kurzer Hinweis „Beachte die Anzahl gültiger Ziffern.“ genügt. Die
  Schülerfassung gibt die zu ermittelnde Ziffernzahl nicht ohne Auftrag vor;
  die Lösung erläutert die passende Genauigkeit. Exakte Zählwerte werden von
  gerundeten Messgrößen unterschieden.
- Bei Abfragen verlangt der Operator **Berechne** einen selbstständig gewählten
  Formelansatz und nötige Umstellungen. Die Schülerfassung gibt weder
  Startformel noch Umstellungshinweis vor, sofern der Auftrag dies nicht
  ausdrücklich verlangt. Die Lösungsfassung zeigt Ansatz, Umstellung,
  Einsetzen, Einheit und angemessene Rundung.
- Skizzen und Diagramme erhalten ausreichend Zeichenraum. Zugehörige
  Arbeitsaufträge stehen bei der Darstellung direkt vor dem Arbeitsbereich.
- Beschreibungen, Erklärungen, Herleitungen und Bewertungen bleiben als
  unterschiedliche Leistungen erkennbar. Die Lösung erfüllt jeden Teilauftrag.
- Bei Modellen den dargestellten Sachverhalt, Annahmen und den verlangten
  Bezug zur realen Situation deutlich machen.
  Nur notwendige Situationsangaben vorgeben: Eine Herleitung oder Bewertung
  darf nicht durch bereits eingesetzte Beziehungen, Teilergebnisse oder die
  vorweggenommene Begründung aufgelöst werden. Bilder aus dem Modul übernehmen,
  wenn sie Grundlage des Auftrags sind; Beschriftung und Situation müssen
  fachlich zusammenpassen.

Für den Rest der Klasse ist das zugehörige Wiederholungsquiz eine digitale,
eigenständige Seite nach Abschnitt 8. Ein zusätzlich gewünschter gedruckter
Test braucht eine eigene Festlegung; das Phy8-Schema wird nicht übernommen.

## 5. Gestaltung und Lösungen

Die vorhandenen LaTeX-Vorlagen wiederverwenden:

- A4 im Hochformat, `article` mit 10 pt Grundschrift und 14 mm Seitenrändern.
- Deutsche Sprache, UTF-8, T1-Schriftkodierung und serifenlose `lmodern`-Schrift.
- Dunkelblaue Kopfleiste mit „PHYSIK · KLASSE 11“ und goldenem Feld
  `ABFRAGE` bzw. `LÖSUNGEN`.
- Kurzer Haupttitel mit Lernmodulnummer und Thema; passende Untertitel je Seite.
- Blaue nummerierte Aufgabentitel, dünne Trennlinien, helle Schreiblinien und
  Karoraster. Die bestehenden Schreiblinien haben üblicherweise 9 mm Abstand.
- Fußzeile mit Klasse, Fach, Unterrichtseinheit, Fassung und Seitenzahl.

Farben: `Navy #17324D`, `Blue #3B6EA5`, `Sky #EAF3FA`, `Gold #F3B33D`,
`Ink #1E2935`, `Muted #617080`, `Line #D8E1E8`.

Die Makros `\kopf`, `\frage`, `\antwortfeld` und `\fuss` sowie vorhandene
TikZ-Darstellungen übernehmen. In schmalen Textspalten Antwortfelder über die
aktuelle `\linewidth` bemessen, wie in der Vorlage zu Modul 3, Variante 3.

Neue getrennte Lösungsfassungen werden aus der Schülerquelle über
`\newif\ifsolution` erzeugt. Nur `\solutionfalse` wird zu `\solutiontrue`
geändert; der übrige Quelltext bleibt gleich. Antwortbereiche behalten feste
Maße. Schüler- und Lösungsfassung stimmen in Seitenzahl, Aufgabenreihenfolge
und Position der Aufgaben überein.

Eine Skizze wird mit einer tatsächlichen Skizze gelöst. Rechnungen enthalten
Formelansatz, sinnvolle Umformungen und Ergebnis. Erklärungen und Bewertungen
enthalten die erforderliche physikalische Begründung.

## 6. Physikalische Notation und Bildpfade

Für neue oder inhaltlich überarbeitete Aufgaben gilt das Physikmanifest:

- Indizes korrekt tiefstellen, beispielsweise `v_{\mathrm B}` und `F_{\mathrm Z}`.
- Einheiten aufrecht setzen, deutsches Dezimalkomma und Abstand zur Einheit.
- Divisionen und zusammengesetzte Einheiten mit waagerechtem Bruchstrich setzen.
- Drehwinkel ohne Einheit `rad` angeben; für die Winkelgeschwindigkeit
  `\frac{1}{\mathrm s}` verwenden.
- Erst das Endergebnis auf die angemessene Anzahl gültiger Ziffern runden.
- Vektoren und Achsen eindeutig beschriften; Koordinatensysteme erhalten
  Pfeilspitzen, passende Skalen und Einheiten.

Die Abfrage zu Modul 5 verwendet Bilder aus der Unterrichtseinheit. Aus dem
neuen Abfragenordner lauten die relativen Pfade:

```text
../1-Kreisbewegungen/assets/haftreibung-zentripetalkraft/haftreibung-situation-lkw-kurve.png
../1-Kreisbewegungen/assets/haftreibung-zentripetalkraft/haftreibung-situation-hammerwurf.png
```

Beim LaTeX-Bau dieser Quellen den Ordner `Abfragen` als Arbeitsverzeichnis
verwenden. So werden die relativen Bildpfade aufgelöst. Hilfsdateien und
Prüfausgaben kommen in einen temporären Ordner, beispielsweise
`unterricht/tmp/pdfs/phy11/`.

## 7. Prüfung und Pflege

Bei einer reinen Verschiebung oder Umbenennung:

1. Alle Quellen und PDFs erfassen und eine eindeutige Namenszuordnung erstellen.
2. Vorhandene Dateien erhalten; Zielkonflikte vor dem Verschieben prüfen.
3. Relative Abhängigkeiten und Verweise auf die bisherigen Namen anpassen.
4. Vollständigkeit, unveränderte PDF-Inhalte und gültige Bildpfade prüfen.
5. Quellen mit geänderten Bildpfaden aus dem neuen Arbeitsverzeichnis probeweise
   kompilieren. Ein unverändertes PDF bleibt bei einer reinen Ablageänderung
   erhalten.

Bei neuen Aufgaben oder sichtbaren Änderungen zusätzlich alle PDFs aus den
aktuellen Quellen bauen, jede Seite als Bild rendern und visuell prüfen.
Schüler- und Lösungsfassung direkt vergleichen. Schrift, Schreibraum,
Zeichnungen, Tabellen, Kopf und Fuß müssen vollständig und gut lesbar sein.
Neue Quellen und PDFs erhalten denselben endgültigen Dateistamm. Nur finale
`.tex`- und `.pdf`-Dateien sowie dieses Manifest liegen in der zentralen Ablage.

Abschlusscheck:

- [ ] Alle Phy11-Abfragen liegen unter `klasse-11/Abfragen`.
- [ ] Dateistamm, Lernmodulnummer, Thema, Variante und Lösungszusatz sind eindeutig.
- [ ] Zu jeder LaTeX-Quelle existiert das gleichnamige PDF.
- [ ] Kombinierte Dokumente sind als solche dokumentiert.
- [ ] Bildpfade, Quellenabhängigkeiten und Dokumentationsverweise stimmen.
- [ ] Die neue Ablage enthält alle vorherigen Abfragedateien.
- [ ] Bei reiner Umstrukturierung sind die PDF-Inhalte unverändert.
- [ ] Bei sichtbaren Änderungen wurden PDFs neu gebaut und visuell geprüft.
- [ ] Eigene Änderungen bestehen `git diff --check`.

## 8. Wiederholungsquiz für den Rest der Klasse

Verbindliche technische Vorlage ist
[aufgabe3-quiz](../1-Kreisbewegungen/aufgabe3-quiz.html) mit seinen eigenen
Skript-, CSS- und Löschdateien. Als inhaltliche Referenz für den gemeinsamen
Auftrag dient auch [aufgabe5-quiz](../1-Kreisbewegungen/aufgabe5-quiz.html).
Alle Detailregeln stehen im Wiederholungsquizmanifest; insbesondere:

- Das Quiz wiederholt ausschließlich Erarbeitetes aus dem Modul und prüft
  dieselben vereinbarten Lernziele wie die Abfrage in geeigneter digitaler
  Form. Abfrage und Quiz müssen nicht dieselbe Aufgabenanzahl oder Bepunktung
  besitzen. Neue Formulierungen und Kontexte sind erwünscht; ausdrücklich
  verlangte Wortlaute bleiben erhalten.
- Üblicher Aufbau: Lückentext mit Wortkarten, Zuordnung, Multiple Choice und
  zwei bis drei automatisch bewertete Freitextaufgaben. Formate nach Lernziel
  wählen und vorhandene Prüfmechanismen übernehmen. MC verwendet Kästchen;
  mindestens zwei MC-Fragen haben mehrere richtige Antworten.
- Freitextaufgaben dürfen die Operatoren **Beschreibe**, **Erkläre**,
  **Begründe** oder **Bewerte** verwenden. Jede verlangt drei bis vier
  fachliche Aspekte. Aufgabenwortlaut, Modellannahmen, erwartete Aspekte und
  Bewertungsregeln müssen dieselbe Leistung meinen. Gleichwertige fachlich
  richtige Formulierungen akzeptieren; keine unaufgeforderten Zusatzdetails
  als Voraussetzung für volle Punkte verlangen.
- Je Aufgabe beziehungsweise MC-Frage eigener Prüfbutton und unmittelbare,
  dreistufige Rückmeldung. Unvollständige Eingaben und Serverfehler zählen
  nicht als Prüfversuch; gewertet wird der erste gültige Versuch. Korrekturen
  bleiben möglich, vollständig richtige Aufgaben werden gesperrt.
- Fortschritt, Gesamtpunkte, Ergebnisübersicht, Drucken, Neustart und
  vollständige Speicherung samt Wertung nach Vorlage übernehmen. Der
  Datenschutzhinweis nennt alle serverbewerteten Aufgaben.
- Keine Menü- oder Übersichtskachel, `noindex, nofollow`, kein Lehrercode,
  kein Sicherungsblatt und kein weiteres Abschlussquiz. Die Präsentation
  enthält den Zugang; Rückweg und Startseitenlink bleiben vorhanden.

Dateien bleiben **neben dem Modul in der Unterrichtseinheit**:

```text
aufgabeN-quiz.html
aufgabeN-quiz.mjs   (oder .js wie in der Vorlage)
aufgabeN-quiz.css
aufgabeN-quiz-loeschen.txt
```

Das Quiz bindet gemeinsame Komponenten ein, aber keine Dateien eines anderen
Quiz. Gemeinsame Modulbilder bleiben in ihrem bisherigen Bilderordner. Für
pdfLaTeX nötige PNG-Fassungen vorhandener WebP-Bilder erhalten denselben
Bildinhalt und werden als Abhängigkeiten dokumentiert.

## 9. Bewertungsserver und Veröffentlichung

Vor jeder Erstellung oder Änderung die tatsächlich verwendete Anbindung in
Quizskript und gemeinsamem
[semantic-answer.mjs](../../../informatik/klasse-11/1-Kuenstliche-Intelligenz/perzeptron/ui/semantic-answer.mjs)
prüfen. Neue und überarbeitete KI-Aufgaben verwenden ausschließlich den
bestehenden **Scaleway-Auswertungsserver** gemäß `manifest-allgemein.txt`,
Abschnitte 0 und 0.1. Die bearbeitbaren Quellen liegen unter
`scaleway-functions/source/`. `apps-script/` bleibt unverändertes Archiv;
keine Google-Skript-Dateien ändern und keine parallele Google-Bereitstellung
pflegen. Endpunkte und Aufgabenanzahlen nicht aus früheren Aufträgen ungeprüft
übernehmen.

Für jede Freitextaufgabe:

1. Eine eindeutige Aufgaben-ID nach dem Quizmanifest in
   [tasks.js](../../../../scaleway-functions/source/tasks.js) anlegen;
   alle Quiz-IDs stehen als zusammenhängender Block. Bei Überarbeitung vorhandene IDs nutzen,
   sofern Lernziel und Zuordnung erhalten bleiben.
2. Aufgabenwortlaut im Client und im Serverkontext abgleichen. Titel,
   `maxPoints`, `expectedAspects`, Rubrik und `feedbackCriteria` stimmen
   überein; jedes Kriterium zählt einen Punkt. `maxFeedbackHints: 1` setzen
   und genau einen nächsten Verbesserungsschritt anzeigen. Die Checkliste in
   [KI-FEEDBACK-MIGRATION.md](../../../../KI-FEEDBACK-MIGRATION.md) beachten
   und deren Aufgabenübersicht aktualisieren. MC-Lösungen und fachliche
   Erklärungen ebenfalls unabhängig prüfen.
3. Passende Tests unter [scaleway-functions/tests/](../../../../scaleway-functions/tests/)
   ergänzen; Gesamtsumme im Quiz aus den tatsächlichen Teilwertungen ermitteln.
4. Nach Quellenänderungen `node scaleway-functions/build-core.js`, die
   Scaleway-Tests und `& ./scaleway-functions/package.ps1` ausführen.
   Die aktuelle `scaleway-functions/dist/ki-auswertung-test.zip` samt
   SHA256-Datei und Bereitstellungshinweis übergeben; siehe
   [README](../../../../scaleway-functions/README.md). Generierte Kerndateien
   nicht von Hand bearbeiten. Vor einer Bereitstellung lokale und laufende
   Aufgabenbestände abgleichen, damit andere Live-Aufgaben nicht verloren gehen.

Lokaler Bau, technische Tests, echte Modellbewertung, Serverbereitstellung und
Website-Upload sind unterschiedliche Prüfschritte. Ein simulierter Server
belegt die Browserfunktion und den Übertragungsvertrag, nicht die Qualität
einer echten KI-Bewertung. Den tatsächlichen Prüf- und Veröffentlichungsstand
bei der Übergabe nennen. Veröffentlichung, Commit oder Bereitstellung nur
im autorisierten Umfang durchführen; andernfalls die konkret nötigen Schritte
und das aktuelle Paket übergeben. Keine Zugangsdaten in Materialdateien ablegen.

## 10. Präsentation, QR-Code und Löschanleitung

- Die Präsentation im bestehenden Materialordner ermitteln, für Kreisbewegungen
  unter `../informatik-material/phy11/1-Kreisbewegungen/`. Vor Änderungen eine
  Sicherung anlegen; vorhandene Folienstruktur und Navigation wiederverwenden.
- Eine eigene Quizfolie direkt hinter der Modulfolie einfügen. Bei erneutem
  Ausführen die vorhandene Quizfolie aktualisieren, keine zweite anlegen.
  Nachfolgende IDs, `aria-label` und Folienzähler konsistent halten.
- Für Phy11 standardmäßig `https://bycs.link/Phy11-wdhX` verwenden, mit X als
  Aufgabennummer des Lernmoduls, beispielsweise `https://bycs.link/Phy11-wdh8`
  für `aufgabe8-quiz.html`. Der sichtbare Linktext lautet `bycs.link/Phy11-wdhX`;
  beide Links der Quizfolie enthalten die vollständige HTTPS-Adresse. Eine
  ausdrücklich abweichende Linkvorgabe der Lehrkraft hat Vorrang. Diese
  Phy11-Regel konkretisiert die allgemeine Linkregel im Wiederholungsquizmanifest.
- Der QR-Code kodiert exakt dieselbe URL wie beide Links der Folie. Einen
  beigefügten QR-Code unverändert verwenden und auf Übereinstimmung prüfen;
  andernfalls einen passenden QR-Code erzeugen. SVG neben der Präsentation
  als `Phy11-wdhX.svg` ablegen und als Data-URI einbetten; QR-Code unabhängig
  dekodieren.
- Linktext und QR-Bild im Browser prüfen. Kurzlink zusätzlich auf Erreichbarkeit
  und das richtige Weiterleitungsziel prüfen. Ein vorgegebener Name beweist
  keine bestehende Weiterleitung: Fehlenden oder falschen Kurzlink als offenen
  Veröffentlichungsschritt benennen, einschließlich der nötigen Einrichtung
  beziehungsweise Zielkorrektur in ByCS. Das feste Namensschema belegt keine
  erfolgreiche Einrichtung. Den vorgesehenen Kurzlink in der Folie beibehalten;
  keine Ersatzadresse erfinden oder stillschweigend auf die volle Quizadresse
  ausweichen. Ohne bestätigte Prüfung keinen funktionierenden Zugang behaupten.
- Die eigene Löschanleitung nennt Quizdateien, Server-IDs samt Wortlaut und
  Punkten, geänderte Integrationsdateien, Präsentationspfad, Folientitel,
  QR-Datei, Kurzlink sowie aktuelle und frühere Speicherschlüssel. Folien über
  den Titel identifizieren; ihre Nummer kann sich später ändern.
- Die Löschcheckliste berücksichtigt den tatsächlich genutzten Server samt
  Neubau und erneuter Bereitstellung. Gedruckte Abfrage, Lösungen, Lernmodul,
  Sicherungsblatt und gemeinsam genutzte Bilder und Komponenten bleiben bei
  einer Quizlöschung erhalten. Keine Löschtermine erfinden; gelöscht wird nur
  auf ausdrückliche Anweisung der Lehrkraft.

## 11. Überarbeitung und wiederholte Ausführung

Ein erneuter Auftrag aktualisiert den bestehenden Satz, sofern keine weitere
Variante verlangt ist. Vorher Dateien, Aufgaben-IDs, Quizfolie und QR-Datei
ermitteln. Keine doppelten Abfragen, Servereinträge oder Folien erzeugen und
keine alten Namenskopien als zusätzliche Endfassungen zurücklassen.

Bei inhaltlichen Änderungen Abfrage, Lösungen und Quiz gemeinsam prüfen:

1. Entfernte, ersetzte oder anders formulierte Aufgaben auf Überschneidungen
   mit Quizaufgaben, Antwortkarten, MC-Aussagen und Feedback untersuchen.
   Für den gemeinsamen Auftrag ausgeschlossene Inhalte nicht durch andere
   Frageformate wieder einführen. Die Entfernung einer einzelnen Abfrageaufgabe
   bedeutet für sich allein noch keinen Ausschluss des gesamten Lernziels;
   den Änderungsauftrag und den verbleibenden Lernkern berücksichtigen.
2. Musterlösung, Serverkontext, Aspekte, Rubrik, Maximalpunkte, Gesamtsumme,
   Nummerierung und Löschanleitung im selben Schritt aktualisieren. Beide
   Druckfassungen aus der gemeinsamen Quelle erzeugen und PDFs neu bauen.
3. Bei geänderten Aufgaben oder Bewertungen den versionierten
   `localStorage`-Schlüssel erhöhen oder eine geprüfte Migration vorsehen.
   Alte Wertungen dürfen neue Aufgaben nicht sperren oder als gelöst markieren.
   Reine Gestaltungskorrekturen erfordern keinen Verlust der Bearbeitung.
4. Cache-Buster für geänderte eigene Skripte und Stylesheets aktualisieren;
   Serverpaket aus den aktuellen Quellen neu erzeugen. Link und QR bleiben
   nur dann gleich, wenn die Zieladresse gleich bleibt.

## 12. Abnahme des gemeinsamen Auftrags

Die Prüfungen aus Abschnitt 7 und dem Quizmanifest gelten zusammen. Zusätzlich
vor der Übergabe kontrollieren und das Ergebnis knapp dokumentieren:

- [ ] Gemeinsamer Satz aus Abfrage, layoutgleichen Lösungen, Wiederholungsquiz
      und Präsentationsfolie vollständig; ausdrücklich vereinbarte Ausnahmen
      sind dokumentiert.
- [ ] Lernmodul und vorhandenes Sicherungsblatt vollständig gelesen; Lernziele,
      Ausschlüsse und aktuelle Änderungswünsche in beiden Materialien umgesetzt.
- [ ] Gedruckte Aufgaben sind ohne digitale Hilfsmittel bearbeitbar;
      Schreibraum und Lösungen passen zu jedem Operator und Teilauftrag.
- [ ] Schüler- und Lösungsquelle unterscheiden sich nur im Lösungsschalter;
      beide PDFs stammen aus den aktuellen Quellen, jede Seite wurde gerendert
      und direkt mit der jeweils anderen Fassung verglichen.
- [ ] Quizdateien liegen neben dem Modul; jede MC-Frage hat einen Prüfbutton
      und mindestens zwei MC-Fragen haben mehrere richtige Antworten.
- [ ] Freitextaufgaben besitzen konsistente Client- und Serverdaten;
      Teilpunkte, Aspektzahlen und Gesamtwertung stimmen.
- [ ] Im Browser korrekte, teilweise korrekte und falsche Eingaben geprüft;
      unvollständige Eingaben und Serverfehler verbrauchen keine Erstwertung.
- [ ] Nach Korrektur bleibt die Erstwertung erhalten; Reload stellt Eingaben,
      Rückmeldungen und Sperren passend wieder her; Neustart setzt alles zurück.
      Bei Revision übernimmt ein alter Speicherstand keine neuen Wertungen.
- [ ] Quiz auf Desktop, Tablet und Smartphone geprüft: Bilder, Formeln,
      Zuordnung und Rückmeldungen lesbar, kein unnötiger horizontaler Überlauf;
      Tastaturbedienung, Antippen als Drag-Alternative und Druckansicht geprüft.
- [ ] Quizfolie genau einmal direkt nach der Modulfolie vorhanden; QR-Code
      dekodiert zu `https://bycs.link/Phy11-wdhX` (X = Lernmodulnummer) oder
      zum ausdrücklich abweichend vorgegebenen Link. Kurzlink und Ziel getrennt
      überprüft; fehlende oder falsche Weiterleitung als offen dokumentiert.
- [ ] Löschanleitung vollständig und auf den aktuellen Stand gebracht;
      Abfrage und gemeinsam genutzte Dateien werden darin erhalten.
- [ ] `node --check` für das Quizskript, Scaleway-Build und Tests unter
      `scaleway-functions/tests/` sowie die Modultests der Einheit ausgeführt;
      aktuelles Uploadpaket gebaut. Neue Fehler behoben; belegte bestehende
      Fehler und nicht durchgeführte Prüfungen ausdrücklich benannt.
- [ ] `git diff --check` bestanden; temporäre Bau- und Renderdateien liegen
      außerhalb der finalen Ablage. Vorhandene fremde Änderungen erhalten.
- [ ] Übergabe enthält Links zu finalen Abfrage-PDFs, Lösungen und Quiz sowie
      Prüfstatus und konkret offene Schritte für Server, Website und Kurzlink.

Für eine erneute Ausführung reicht als Auftrag mit den Regeln dieses Manifests:

> Erstelle eine Phy11-Abfrage zu Aufgabe X in der Einheit … gemäß dem Manifest
> unter klasse-11/Abfragen. Der Standardauftrag umfasst Lösungen, passendes
> Wiederholungsquiz und Präsentationsfolie mit https://bycs.link/Phy11-wdhX.
> Grundlage: Lernmodul und vorhandenes Sicherungsblatt.
> Schwerpunkte, behandelte Reiter oder Ausschlüsse: … .
