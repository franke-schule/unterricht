# Inf11 KI 6.2: ungültige Modellbewertung bei Schritt 4

Stand: 12.11.2026. Lokale Serverkorrektur, noch nicht veröffentlicht.

## Befund

Gemeldet wurde bei allen Schülern in der einfachen Variante, Aufgabe 4:
„Das Modell hat keine gültige Bewertung geliefert. Bitte versuche es erneut.“
Der Prüfbutton verwendet die richtige Kennung `11-6-einfach-anpassung` und
erwartet die passenden fünf Punkte. Die Meldung stammt aus der serverseitigen
Prüfung der Modellantwort, etwa bei unvollständigem JSON, abgeschnittener Ausgabe,
fehlenden Kriterien, ungültigen Statuswerten oder nicht belegbaren Zitaten.
Welcher dieser Fälle bei den Unterrichtsabgaben vorlag, ist ohne die damaligen
Serverdaten nicht nachgewiesen. Es wurden keine Schülerantworten abgerufen.

Der öffentliche `/health`-Abruf lieferte HTTP 200, 88 Aufgaben,
`configured: true`, `accessConfigured: true` und `evaluationEnabled: true`.
Das belegt Erreichbarkeit und gemeldete Konfiguration, keine Modellbewertung.
Die veröffentlichte Aufgabenseite lädt noch `task6.mjs?v=20261029-criteria-v1`;
die separate Browserkorrektur vom 11.11. ist dort ebenfalls noch nicht enthalten.
Sie betrifft andere Fehlerpfade und behebt diese konkrete Modellmeldung nicht.

## Korrektur

- Für Schritt 4 dieselbe vorhandene Reparaturlogik wie für freie Inf10-1a-
  Antworten verwenden: genau ein erneuter Modellaufruf ausschließlich bei
  `INVALID_MODEL_RESPONSE`, nur im verbleibenden ursprünglichen Zeitbudget.
- Für diese Aufgabe ein Ausgabelimit von 4096 Tokens auch bei Modellen vorsehen,
  die bisher auf 1500 begrenzt waren. Für `gpt-oss-120b` galt bereits 4096.
  Eine mögliche Abschneidung wird damit seltener, aber nicht ausgeschlossen.
- Kurze, unveränderte Codebelege anfordern; beim impliziten Nullfall vorhandene
  Zweigbedingungen bzw. die Delta-Formel zitieren. Keine zusätzlichen Zweige
  als Beleg erfinden. Den Reparaturhinweis für Text und Code eindeutig halten.

Bewertungskriterien, fünf Punkte, Belegkontrolle und Passwortschutz bleiben
erhalten. Ungültige Bewertungen werden weiterhin nicht in Schülerpunkte
umgewandelt. Dienst-, Passwort-, Kontingent- und Timeoutfehler lösen keinen
Reparaturversuch aus. Bei einer ungültigen Erstbewertung kann ein zweiter
Modellaufruf zusätzliche Kosten verursachen; die gesamte Wartezeit steigt nicht.

## Prüfung

Neun Tests in `scaleway-functions/tests/task6-2-anpassung.test.js` bestehen.
Die neuen Fälle scheiterten vor der Korrektur. Sie prüfen erfundene Nullfall-
Belege, Ausgabeabbruch (`finish_reason: length`), fehlende Kriterien, erfolgreiche
Reparatur, fortgesetzte Ablehnung ungültiger Belege ohne Punkte, keine Wiederholung
bei Dienstfehlern oder anderen Codeaufgaben, das gemeinsame Zeitbudget und
unveränderte Teilpunkte mit genau einem nächsten Hinweis. Die vorhandenen
fachlichen Positiv- und Negativfälle bestehen weiterhin.

Gesamtsuite: 174 von 175 Tests bestanden. Der bestehende DISTINCT-Test in
`inf9-db2-beschreibe.test.js` schlägt unabhängig hiervon fehl: Auch im
unveränderten HEAD fehlt die erwartete DISTINCT-Clientkonfiguration in
`faecher/informatik/klasse-9/2-Datenbanken/aufgabe2.js`.
`git diff --check` ist ohne Fehler.

Alle Modellantworten dieser Tests sind simuliert. Es gab keinen authentifizierten
Live-Modellaufruf und keinen Zugriff auf das Scaleway-Verwaltungskonto.

## Bereitstellung

Mit `node scaleway-functions/build-core.js` bauen und mit
`& ./scaleway-functions/package.ps1` paketieren. Das aktuelle Paket liegt unter
`scaleway-functions/dist/ki-auswertung-test.zip`; daneben steht die SHA256-Datei.
ZIP in die bestehende Scaleway-Function `ki-auswertung` hochladen und erneut
bereitstellen. Für diese Serverkorrektur ist kein Website-Upload erforderlich.

Danach Schritt 4 mehrfach mit einer synthetischen vollständigen Lösung und
einer Lösung mit falschem Theta-Vorzeichen prüfen. Volle Lösung: 5/5; bei sonst
korrektem Code und ausschließlich falschem Theta-Vorzeichen im Minuszweig: 4/5.
Die ursprüngliche technische Fehlermeldung darf bei diesen Vergleichsfällen
nicht erneut auftreten. Erst diese Prüfung belegt die Wirkung mit dem tatsächlich
eingesetzten Modell.
