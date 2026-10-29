# Kriterienbasiertes Feedback: Umstellung und neue Aufgaben

Stand: 29.10.2026. Diese Datei dokumentiert den **lokalen Quellstand**.
Ein fertiger Build belegt keine Veröffentlichung und keine zuverlässige
fachliche Bewertung durch das tatsächlich eingesetzte Modell.

Die verbindlichen Grundregeln stehen in `manifest-allgemein.txt`, Abschnitt
0.1; Fachmanifeste ergänzen sie. Diese Datei ist die zentrale technische
Checkliste und Bestandsübersicht. Bei jeder Umstellung aktualisieren.

## Geltungsbereich und Ziel

Alle neuen Beschreibe- und Programmieraufgaben erhalten kriterienbasiertes
automatisiertes Feedback. Bestehende Aufgaben werden nach und nach bei einer
gezielten Überarbeitung ihrer Bewertung umgestellt. Kein pauschaler Wechsel
aller bestehenden Aufgaben und keine neue KI-Pipeline.

Vorhandene deterministische Prüfer, etwa für SQL, Zahlen oder kompilierbaren
Code in einer bestehenden Laufzeit, weiterverwenden und ihre Einzelprüfungen
den Kriterien zuordnen. Die neue Vorgabe verlangt keinen zusätzlichen
Modellaufruf für bereits zuverlässig prüfbare Aufgaben.

Das Verfahren für KI-Aufgaben:

1. Fachlich konkrete Kriterien mit je einem Punkt festlegen.
2. Das Modell beurteilt **jedes Kriterium einzeln** mit vorgegebenem Status
   und wörtlichen Belegstellen aus der aktuellen Antwort bzw. dem Code.
3. Der Server validiert Struktur, Status und das Vorkommen der Belege.
4. Der Server zählt erfüllte Kriterien und wählt einen hinterlegten Hinweis
   zum ersten offenen Kriterium. Spätere erfüllte Kriterien zählen sofort.
5. Die Oberfläche zeigt Punkte und genau diesen nächsten Schritt. Bei voller
   Punktzahl lautet die Rückmeldung „Sehr gut, alles richtig“.

Nur die sichtbaren Hinweise auf einen zu begrenzen ist eine **Teilumstellung**.
Freie Modellpunkte und freie Modellprosa sind noch kein Kriterienvertrag.
Die Belegkontrolle verhindert erfundene Zitate; sie beweist nicht, dass das
Modell die Bedeutung der vorhandenen Aussage richtig beurteilt hat.

## Bereits vollständig konfigurierte Aufgaben

| Aufgaben-ID | Modul / Teilaufgabe | Kriterien / Punkte |
| --- | --- | --- |
| `11-6-klassifizieren` | Inf11 KI 6.2: `punktKlassifizieren` beschreiben | 4 |
| `inf10-db-a9-p2` | Inf10 DB 9, P2: Fotos Hamburger Mitglieder | 5 |
| `inf10-db-a9-p5` | Inf10 DB 9, P5: Kommentare mit „Foto“ | 5 |
| `inf10-db-a9-p8` | Inf10 DB 9, P8: Likes zu Foto 10 | 5 |
| `inf10-db-a9-p11` | Inf10 DB 9, P11: Kommentaranzahl je Mitglied | 5 |

Alle fünf verwenden `feedbackCriteria` und `maxFeedbackHints: 1`.
Inf10 DB 9 bewertet bei allen vier Aufgaben die Sortierung als fünften Aspekt:

- P2: Benutzername aufsteigend, bei Gleichheit Foto-ID aufsteigend.
- P5: Benutzername aufsteigend, bei Gleichheit Kommentar-ID aufsteigend.
- P8: Benutzername aufsteigend.
- P11: Kommentaranzahl absteigend, bei Gleichheit Benutzername aufsteigend.

Bei P11 bleiben individuelle Ausgabe und Zählung je Mitglied getrennte
Kriterien. Derselbe Satz darf beide erfüllen; das ist didaktisch bestätigt.
Bei Inf11 erkennt eine zusätzliche lokale Regel eindeutige Aussagen über
unveränderte Gewichte. Diese Sonderregel ist keine allgemeine Textbewertung.

## Teilweise vorbereitet und noch offen

Die Codeaufgaben `11-6-einfach-summe`, `11-6-einfach-ausgabe`,
`11-6-einfach-anpassung` und `11-6-schwer-trainieren` zeigen bereits nur einen
Hinweis und haben ergänzende lokale Codeprüfungen. Sie verwenden weiterhin
den älteren Modellvertrag und gelten **noch nicht als vollständig migriert**.

Die übrigen registrierten KI-Aufgaben sind ebenfalls noch offen, darunter die
weiteren SQL-Beschreibungen und die Physikaufgaben. Für die weitere Reihenfolge
konkrete Aufgaben auswählen; Änderungen an einer Aufgabe lösen keine
ungefragte Migration benachbarter Module aus.

Der eingefrorene Altbestand steht maschinenlesbar in
`scaleway-functions/tests/fixtures/criterion-feedback-legacy.json`.
`criterion-feedback-contract.test.js` prüft, dass neue Aufgaben Kriterien
besitzen, migrierte Aufgaben aus dem Altbestand entfernt werden und die
Kriterientabelle hier aktuell bleibt. Die Altbestandsliste darf nicht erweitert
werden, um neue Aufgaben vom Standard auszunehmen.

Nach einem Build lassen sich offene Aufgaben ohne Modellaufruf auflisten:

```powershell
node -e "const {TASKS}=require('./scaleway-functions/evaluation-core'); for(const [id,t] of Object.entries(TASKS)) if(!t.feedbackCriteria) console.log(id,t.title)"
```

## Technische Referenz und Vertrag

Bestehende Komponenten wiederverwenden:

| Datei | Aufgabe |
| --- | --- |
| `scaleway-functions/source/tasks.js` | Kriterien, Rubrik, feste Hinweise und Punkte |
| `scaleway-functions/source/prompt.js` | Gemeinsame Anweisungen für Text und Code |
| `scaleway-functions/scaleway-client.js` | Dynamisches JSON-Schema und Belegprüfung |
| `scaleway-functions/source/rules.js` | Punkte und erster offener Schritt |
| `faecher/informatik/klasse-11/1-Kuenstliche-Intelligenz/perzeptron/ui/semantic-answer.mjs` | Vorhandener Transport und `renderCompactEvaluation` |

Minimaler Konfigurationsausschnitt (um die üblichen Aufgabenfelder ergänzen):

```javascript
maxPoints: 2,
maxFeedbackHints: 1,
expectedAspects: ['Erster fachlicher Aspekt.', 'Zweiter fachlicher Aspekt.'],
rubric: ['Ein Punkt für den ersten Aspekt.', 'Ein Punkt für den zweiten Aspekt.'],
feedbackCriteria: [
  { id: 'first', label: 'Ersten Aspekt erklären', issues: {
    missing: 'Ergänze die noch fehlende Beziehung.',
    wrong_relation: 'Prüfe, welche Größen hier zusammenhängen.'
  } },
  { id: 'second', label: 'Zweiten Aspekt erklären', issues: {
    missing: 'Ergänze die geforderte Auswirkung.'
  } }
],
statusLabels: { correct: 'korrekt', partial: 'teilweise korrekt', incorrect: 'noch nicht korrekt' }
```

Anzahl und Reihenfolge von `expectedAspects`, `rubric` und `feedbackCriteria`
stimmen überein; `maxPoints` entspricht ihrer Anzahl. IDs sind eindeutig.
Jedes Kriterium hat einen `missing`-Hinweis. Weitere `missing_*`-Statuswerte
unterscheiden Teilaspekte; `wrong_*`-Statuswerte konkrete Fehlertypen.
Die Hinweise nennen jeweils eine konkrete Handlung, ohne weitere Kriterien
oder eine vollständige Musterlösung vorwegzunehmen.

Das Modell liefert ausschließlich:

```json
{"criteria":{"first":{"status":"correct","evidence":["Wörtliche Stelle aus der Eingabe."]},"second":{"status":"missing","evidence":[]}}}
```

Für `correct` und `wrong_*` sind vorhandene Belegstellen nötig, bei vollständig
fehlenden Inhalten `missing` mit leerem Array. Keine freien Punkte oder
Feedbackfelder aus dem Modell übernehmen. Die bisherige Ergebnishülle an den
Browser bleibt erhalten; Schema oder generierte Dateien nicht manuell ändern.

Für Programmieraufgaben zusätzlich `responseType: 'code'`, den konkreten
Sprach-/Klassenkontext und gegebenenfalls `codeAnalysisRules` setzen.
Der gemeinsame Prompt unterstützt auch hier den Kriterienvertrag. Belege
sind Codeabschnitte; funktionale Gleichwertigkeit, Erreichbarkeit und spätere
Überschreibungen prüfen. Kommentare und Zeichenketten ersetzen keine
Implementierung. Schülercode wird vom Auswertungsserver nicht ausgeführt.
Syntax-/Typfehler und blockierende Kontrollflussprobleme in der Reihenfolge
der betroffenen Kriterien berücksichtigen; unabhängige richtige Aspekte
weiterhin anerkennen. Hinweise nennen die betroffene Methode oder Operation.

Für Physik bleiben Originalbelege erhalten; der Kriterienprompt erklärt
gleichwertige Größenbezeichnungen. Die bisherige Normalisierung der
Altaufgaben wird dadurch nicht umgestellt. Bestehende Formelrenderer nutzen.

## Checkliste für eine neue Aufgabe oder Umstellung

- [ ] Arbeitsauftrag, Kontext, Hilfen und Musterlösung vollständig lesen.
      Alle verlangten Wirkungen abdecken; bei SQL auch Sortierung und Richtung.
      Bei didaktischen Unklarheiten vor der betroffenen Änderung nachfragen.
- [ ] Kriterien, Punkte, Reihenfolge, erlaubte Varianten und konkrete
      Fehlertypen festlegen. Keine heimlichen Zusatzanforderungen.
- [ ] Konfiguration und gemeinsamen Prompt nutzen; vorhandene lokale Regeln
      auf Konflikte prüfen. Der Kriterienzweig kehrt früh aus der allgemeinen
      Nachbewertung zurück; alte Regeln werden nicht automatisch kombiniert.
- [ ] Clientgrenzen, Punktanzeige, Freischaltung und Musterlösung auf die
      konfigurierten Maximalpunkte anpassen; `maxHints: 1` nutzen.
- [ ] Bei Text-/Codeänderung alte Rückmeldung entfernen und veraltete
      Serverantworten ignorieren. Bei geänderter Rubrik betroffene Freigaben
      und Caches versionieren; Eingaben und andere Fortschritte erhalten.
      Referenz: `assessmentVersion` in Inf10 DB 9. Bei Wiederholungsquizzen
      auch die gespeicherte Erstwertung gesondert prüfen.
- [ ] Positive, unvollständige und falsche Antworten sowie jedes einzelne
      offene Kriterium und gleichwertige Varianten testen. Insbesondere:
      bereits genannte Aspekte, mehrere Kriterien im selben Satz,
      Widersprüche, erfundene Belege, erneute Abgabe; bei Code zusätzlich
      Kontrollfluss, Kommentare, Zeichenketten und gleichwertige Lösungen.
- [ ] Aus der Legacy-Liste entfernen, falls vorhanden; die Tabelle oben
      ergänzen. Bereits konvertierte Aufgaben dürfen nicht zurückfallen.
- [ ] Kern bauen, alle Servertests und betroffene Aufgabentests ausführen;
      Oberfläche, Speicherung und Freischaltung breit und schmal prüfen.
      `git diff --check` und `package.ps1` ausführen.
- [ ] Aktuelle ZIP samt Bereitstellungshinweis übergeben, Website-Dateien
      veröffentlichen lassen. Neue Aufgaben sind erst danach online wirksam.
- [ ] Mit synthetischen Beispielen gegen das tatsächlich eingesetzte Modell
      prüfen, möglichst mehrfach. Mock-Tests getrennt von Live-Ergebnissen
      dokumentieren; erfolgreiche Online-Umstellung nur mit Nachweis angeben.

Für SQL steht `scaleway-functions/tests/sql-description-live.check.js` bereit.
`--dry-run` zeigt den geplanten Umfang ohne Anfrage, `--task AUFGABENKENNUNG`
begrenzt die Auswahl. Erst `--live` löst Modellaufrufe aus. Technische Fehler
sind keine Null-Punkte-Antworten und verbrauchen keinen bewerteten Versuch.
