# KI-Ladeanzeige: Inf11 KI 6.2 und Phy11 Kreisbewegungen 8

Stand: 11.11.2026. Lokale Korrektur; keine Veröffentlichung oder erfolgreiche
Live-Modellprüfung nachgewiesen.

## Beobachtung und Einordnung

Einzelne SuS berichten auf Windows-Schul-PCs und iPads über eine stehenbleibende
Ladeanzeige nach der Passworteingabe. Ob tatsächlich mehr als drei Minuten
vergingen, ist nicht gesichert. Beide Module verwenden dieselbe zentrale
`perzeptron/ui/semantic-answer.mjs`-Anbindung.

Die genaue Ursache der Unterrichtsvorfälle ist ohne Netzwerkstatus,
Browserkonsole, Zeitmessung und aktuelle Scaleway-Konfiguration nicht belegt.
Eine fachlich falsche Antwort oder ein ungültiges Modellurteil muss als
Bewertung bzw. technischer Fehler enden und erklärt allein kein endloses Laden.

Der Client hat eine Wartezeit von 130 Sekunden ab abgeschlossener
Passworteingabe. Bisher forderte er danach ausschließlich `AbortController.abort()`
an. Ein Transport, dessen Promise trotz Abbruch offen bleibt, hielt damit auch
den aufrufenden Prüfbutton im Ladezustand. Ein solcher Transport ist in den
Regressionstests gezielt simuliert; dies beweist keinen entsprechenden
Browserfehler auf den betroffenen Schülergeräten.

In Inf11 6.2 war zudem ein separater Fehler nachweisbar: Wird die IDE nach
Absenden einer Codeprüfung nicht mehr auslesbar, warf `getCode()` sowohl beim
Ergebnisvergleich als auch bei der Fehleranzeige. Der zweite Fehler wurde
stillschweigend verworfen. Dadurch konnte die Ladeanzeige trotz beendeter
Netzwerkanfrage stehenbleiben. Ob das im Unterricht geschah, ist unbekannt.

## Lokale Korrekturen

- Die gemeinsame Anbindung beendet das Warten über ein eigenes ablehnendes
  Timeout-Promise zusätzlich zum Netzwerkabbruch. Die Grenze umfasst das
  Warten auf Header und das vollständige JSON. Sie bleibt bei 130 Sekunden.
  In angehaltenen Browserseiten können auch JavaScript-Timer nicht laufen.
- Inf11 6.2 zeigt Fehler beim erneuten IDE-Zugriff an. Ein geänderter Code
  erhält keine veralteten Punkte und keine stehenbleibende Ladeanzeige.
- Für Browser ohne `Intl.Segmenter` gibt es eine einfache Satzzerlegung,
  damit die Rückmeldung nicht an einer fehlenden Browserfunktion scheitert.
  Bestehender Code-/Abkürzungsschutz und die Hinweisgrenzen bleiben erhalten.
- Neue Versionsparameter entlang der Importketten von Inf11 6.2 und Phy11 8
  lassen die betroffenen Seiten die geänderten Module neu laden.

Bewertungskriterien, Belegkontrolle, Passwortprüfung und Serverlimits bleiben
unverändert. Die entdeckte ungeschützte Promise-Warteschlange einiger separater
Wiederholungsquizze ist nicht Teil dieser beiden Modulstellen und wird hier
nicht überarbeitet.

## Mögliche gemeinsame Lastursache und weitere Diagnose

Scaleway dokumentiert eine gleichzeitige Anfrage je Function-Instanz:
<https://www.scaleway.com/en/docs/serverless-functions/reference-content/functions-limitations/>
Die historische Einrichtung im Repository nennt Maximum scale 1; die heutige
Live-Einstellung ist nicht bekannt. Wenige Instanzen können bei vielen
Schüleranfragen lange Wartezeiten vor dem Handler verursachen. Das ist von der
lokalen Zehn-Anfragen-Minutenbremse und den Limits der Generative API zu trennen.
Die beiden Bremsen liefern reguläre Fehlermeldungen, sobald der Handler bzw.
der Provider antwortet.

Beim nächsten Vorfall mit Uhr messen und den betroffenen Tab geöffnet lassen.
In den Entwicklertools Status und Dauer von OPTIONS/POST prüfen, ohne Passwort,
X-AI-Password oder Schülerantworten weiterzugeben. Ein offenes POST deutet auf
Warten im Transport/Server hin; ein beendetes POST bei stehender Anzeige auf
einen Fehler in der Oberfläche. HTTP-Fehlercodes unterscheiden Limits,
Modelltimeout und ungültige Bewertungen. Browserkonsole und aktuelle
Maximum-scale-/Timeout-Einstellungen prüfen. Kapazität passend zu Klassenlast
und Modellquoten einstellen, statt nur die Browserwartezeit zu erhöhen.

## Tests und Auslieferung

Die neuen Regressionstests reproduzieren vor der Änderung hängende Fetch- und
JSON-Promises sowie fehlendes `Intl.Segmenter`; nach der Änderung bestehen sie.
Der IDE-Zugriffsfehler wird anhand der tatsächlichen `checkCode`-Funktion geprüft.
Zusammen mit vorhandenen Transport-, Feedback- und Physik-Fehlertests bestehen
18 Prüfungen. Lokale Tests verwenden simulierte Dienste, keine Schülerdaten
oder echten Modellanfragen.

Auch `gravitation-application.browser.check.cjs` besteht im echten lokalen
Edge-Browser: simulierte hängende Verbindung mit verkürztem Testtimeout,
Freigabe des Prüfbuttons, Erhalt der Eingabe, keine fachliche Freigabe nach
Timeout und anschließende erfolgreiche Prüfung. `Intl.Segmenter` wird dabei
deaktiviert. Die vorhandenen Prüfungen für Änderung während einer Anfrage,
Wiederherstellung und Layout bei 1366/768/390 Pixeln bestehen ebenfalls.
Ein Rennen im Test wurde beseitigt: Der Request-Listener wird vor dem Klick
registriert, damit schnelle Anfragen nicht verpasst werden.

Paketieren: `& ./scaleway-functions/package-request-timeout-update.ps1`.
Das Website-ZIP enthält ausschließlich die sechs geänderten Laufzeitdateien
mit ihren ursprünglichen Verzeichnissen. Auf dem Website-Host veröffentlichen,
Hosting-Cache leeren und die Seiten neu laden (Windows: Strg+F5). Die neuen
Versionsparameter greifen bereits nach erneutem Laden des aktuellen HTML.
Ein Function-Upload ist für diese Browserkorrektur nicht erforderlich.
Andere Module mit alten Import-URLs profitieren nach einer Cache-Aktualisierung
ebenfalls von der gemeinsamen Anbindung; ihre Importketten werden nicht
pauschal geändert.
