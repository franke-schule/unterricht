# Erstellungs-Prompt für Aufgabe 9 – Den Verbund üben

Implementiere im Repository `C:\Users\ffran\Documents\git\unterricht` das noch fehlende Lernmodul **Aufgabe 9 – Den Verbund üben** für Informatik Klasse 10, Einheit Datenbanken.

Zieldatei: `faecher/informatik/klasse-10/1-Datenbanken/aufgabe9.html`.

## Verbindliche Grundlagen und Referenzen

Lies vor der Planung die geltenden `AGENTS.md`-Dateien sowie `manifest-allgemein.txt`, `manifest-datenbankaufgaben.txt` und `manifest-quizaufgaben.txt` vollständig. Untersuche anschließend diese Referenzen:

- Fachliche Aufgabenbasis: `faecher/informatik/klasse-10/1-Datenbanken/material/material-verbund/verbundInstaHub_01.docx` und `verbundInstaHub_02.docx`. Lies beide Dokumente vollständig einschließlich eingebetteter fachlich relevanter Abbildungen.
- Maßgebliche Vorlage für Gestaltung, Aufgabenformate und Umfang: `faecher/informatik/klasse-10/1-Datenbanken/aufgabe5.html` samt `sql-lab.js`, `sql-lab.css` und `sql-lab-core.mjs`.
- Fachliche Anschlussstellen: Aufgabe 7 zum Verbund und Aufgabe 8 zu n:m-Beziehungen und Beziehungstabellen; Aufgabe 6 als Referenz für die Reitergestaltung.
- Vorhandene Komponenten: `tab-navigation.mjs`, `faecher/informatik/quiz-fragen-pruefen.js` und die bestehenden Speicher- und Serverfeedback-Komponenten.
- Freitextbewertung: die Beschreibe-Aufgaben aus Aufgabe 5, ihre Bewertungsdefinitionen in `apps-script/Tasks.gs` und die aktuell verwendete Skriptserver-Anbindung. Prüfe die tatsächliche Build- und Bereitstellungskette, einschließlich der vorhandenen Scaleway-Integration.

Bestehende Strukturen wiederverwenden. Keine neue SQL-Engine, KI-Pipeline oder Designsprache entwickeln. Gemeinsame Komponenten nur gezielt erweitern und bestehende Aufgaben erhalten.

## Lernziele und bereits geklärte didaktische Entscheidungen

Die Schülerinnen und Schüler sollen vorhandene Verbundabfragen in eigenen Worten beschreiben und zu vorgegebenen Suchaufträgen selbst vollständige SQL-Abfragen formulieren. Das Erfinden eigener Suchaufträge ist kein Lernziel dieses Auftrags.

Das Modul ist eine Übungs- und Vertiefungseinheit nach Aufgaben 5, 7 und 8. Es setzt SELECT, WHERE, ORDER BY, einfache Aggregatfunktionen, Primär-/Fremdschlüssel und Beziehungstabellen voraus. Wiederhole den Verbund knapp an einem Beispiel; entwickle keine zweite ausführliche Einführung zum Kreuzprodukt.

Verbindlicher Pflichtumfang:

- Verbünde über zwei Tabellen und über eine Beziehungstabelle;
- Unterscheidung zwischen Verknüpfungsbedingungen und zusätzlichen Auswahlbedingungen;
- eindeutige Attributzuordnung durch qualifizierte Spaltennamen;
- COUNT und Zählaufgaben;
- GROUP BY in Verbindung mit einem Verbund.

HAVING und Unterabfragen gehören ausschließlich in den freiwilligen Bereich für die Schnellen. Führe sie dort anhand konkreter Beispiele und kurzer Hilfen ein. Verlange im Pflichtteil weder HAVING noch Unterabfragen, Self-Joins oder OUTER JOINs.

Nutze in Beispielen, Hilfen und Referenzlösungen die bekannte Schreibweise: mehrere Tabellen in FROM, Verknüpfungsbedingungen in WHERE. Akzeptiere semantisch gleichwertige INNER-JOIN-/ON-Lösungen. Jede SQL-Klausel steht in einer eigenen Zeile; AND-/OR-Bedingungen werden übersichtlich eingerückt.

## Umfang und Reiterstruktur

Aufgabe 5 enthält 12 Pflichtaufgaben und 13 Zusatzaufgaben. Übernimm diese Größenordnung verbindlich: **12 Pflichtaufgaben und 13 freiwillige Zusatzaufgaben**, zusätzlich zum kurzen Einstieg und zum Abschlussquiz.

Verwende diese Reiterfolge, fortlaufend nummeriert:

1. **Verbund verstehen** – kurzer, geführter Einstieg mit kleinem Tabellenauszug, bekannter Verknüpfung und Ergebnisrelation.
2. **Verbund anwenden** – sechs Pflichtaufgaben, davon zwei Beschreibe-Aufgaben und vier SQL-Schreibaufgaben.
3. **Verbinden und zählen** – sechs Pflichtaufgaben, davon zwei Beschreibe-Aufgaben und vier SQL-Schreibaufgaben; Beziehungstabellen, COUNT und GROUP BY. Erarbeite GROUP BY zunächst an einem überschaubaren Beispiel, erkläre danach seine Bedeutung und lasse es anschließend anwenden.
4. **Für die Schnellen** – ein eigener freiwilliger Reiter mit 13 Aufgaben. Steigere innerhalb dieses Reiters die Schwierigkeit und gliedere die Karten bei Bedarf in kurze Abschnitte.
5. **Auswertung** – kompakte Zusammenfassung und Übersicht der bearbeiteten Pflichtaufgaben; nach Abschluss des Pflichtwegs freigeschaltet, einschließlich bestandenem Abschlussquiz.
6. **Abschlussquiz** – letzter Reiter, auf Grundlage der Inhalte des Pflichtteils.

Der Pflichtweg führt vom dritten Reiter zum Abschlussquiz und nach dessen erfolgreichem Abschluss zur Auswertung. Der Zusatzreiter ist jederzeit freiwillig erreichbar. Keine Zusatzaufgabe ist Voraussetzung für Quiz, Abschluss oder Auswertung. Verwende dafür die vorhandene Reiternavigation und Fortschrittslogik.

Die Auswertung zeigt Nummer, Arbeitsauftrag, eigene Antwort und fachlich richtige Lösung jeder Pflichtaufgabe. Bei Beschreibe-Aufgaben genügt eine mögliche sinngemäße Musterbeschreibung. Bei SQL-Aufgaben ist die Referenzlösung eine mögliche Lösung. Die Auswertung muss für die gemeinsame Besprechung im Plenum geeignet sein.

## Auswahl und Gestaltung der Aufgaben

Stelle in der Planung eine konkrete Aufgabenmatrix auf: Nummer, Reiter, Quelle im jeweiligen Word-Dokument, Lernziel, Aufgabenformat, wörtlicher Arbeitsauftrag, verwendete Tabellen, Referenz-SQL beziehungsweise Bewertungsrubrik und gestufte Hilfen.

Nutze aus den Vorlagen insbesondere:

- Fotos eines bestimmten Mitglieds und Fotos von Personen aus einer bestimmten Stadt;
- Personen zu passenden Fotobeschreibungen mit zusätzlicher Auswahlbedingung;
- Kommentare mit den Benutzernamen ihrer Verfasser und die Anzahl der Kommentare eines Mitglieds;
- Likes und Hashtags als weitere Anwendungen von Verbindungen;
- Anzahl der Fotos je Mitglied und Anzahl der Follower je Mitglied.

Der Pflichtteil soll mindestens einen Verbund über eine Beziehungstabelle mit drei beteiligten Tabellen, eine COUNT-Aufgabe und zwei eigenständige GROUP-BY-Aufgaben enthalten. Die vier Beschreibe-Aufgaben verteilen sich auf einfache Verbindungen, Beziehungstabellen und eine gruppierte Abfrage. Sie werden zwischen den SQL-Schreibaufgaben angeordnet.

Der Zusatzteil greift anspruchsvollere Suchaufträge der beiden Vorlagen auf, beispielsweise Top-10-Listen nach Foto-, Like-, Kommentar- oder Followerzahl, mehrere Bedingungen über verschiedene Tabellen, Gruppen mit einer festgelegten Anzahl von Hashtags und Suchaufträge mit Unterabfragen. Plane dort mindestens zwei HAVING-Aufgaben und zwei Unterabfrage-Aufgaben; wiederhole nicht bloß Pflichtaufgaben mit anderen Namen.

Verwende kurze, eindeutige Arbeitsaufträge mit fett gesetztem Operator, möglichst höchstens zwei kurze Sätze. Formuliere klar, welche Spalten auszugeben sind, welche Zeilen gemeint sind und ob eine Sortierung verlangt wird. Ersetze unnötig belastende Kontexte aus den alten Vorlagen durch sachliche InstaHub-Suchaufträge gleicher SQL-Struktur.

Zählaufträge müssen deutlich machen, ob Datensätze oder unterschiedliche Personen gezählt werden. Für gruppierte Pflichtaufgaben berücksichtige Mitglieder mit mindestens einem passenden Datensatz und benenne diese Einschränkung im Auftrag, damit keine ungewollte Anforderung an OUTER JOINs entsteht.

## Daten und fachliche Prüfung

Verwende die sechs vorhandenen Datenexporte im Themenordner: `users.csv`, `photos.csv`, `follows.csv`, `comments.csv`, `likes.csv` und `tags.csv`. Die Datenfrage ist geklärt; weitere Exporte müssen nicht angefordert werden. Lies vor der endgültigen Aufgabenplanung die CSV-Dateien und prüfe Spalten, Datentypen, Schlüsselbeziehungen und vorhandene Werte. Erfinde keine Daten oder Schemaattribute.

Die ergänzten Exporte verwenden diese Spalten:

- `comments.csv`: `id;user_id;photo_id;body;created_at;updated_at`.
- `likes.csv`: `id;photo_id;user_id;created_at;updated_at`.
- `tags.csv`: `id;photo_id;name;created_at;updated_at`.

Kommentare und Likes verweisen über `user_id` auf `users.id` und über `photo_id` auf `photos.id`. Hashtags stehen direkt in `tags`; `tags.photo_id` verweist auf `photos.id`, der Hashtagtext steht in `tags.name`. Verwende dieses vorhandene Schema und erfinde keine zusätzliche Foto-Hashtag-Zuordnungstabelle. Lade alle benötigten Exporte mit dem vorhandenen CSV-Parser und SQL-Worker; beachte dabei Semikolon-Trennung, zitierte Texte und Unicode-Zeichen.

Passe Benutzernamen, Foto-IDs, Datumswerte und Suchbegriffe aus den Word-Dokumenten an die tatsächlich verwendeten Daten an, falls die alten Werte dort nicht mehr vorkommen. Prüfe jede Referenzabfrage durch Ausführung. Sorge für aussagekräftige Ergebnisse und Datensätze, an denen typische falsche Verknüpfungen erkennbar werden.

Prüfe die Vorlagen fachlich, statt alle Hinweise ungeprüft zu übernehmen. Besonders wichtig sind Follower und Gefolgte: `follower_id` bezeichnet die folgende Person, `following_id` die Person, der gefolgt wird. Die Anzahl der Follower einer Person bezieht sich auf deren ID in `following_id`. Unterscheide außerdem die hochladende Person in `photos.user_id` von der Person, die ein Foto liked oder kommentiert.

Zeige bei jeder Aufgabe die benötigten Tabellenschemata im vorhandenen Format `Tabellenname (attribut: datentyp, ...)`. Verwende tatsächliche Attribute und Datentypen. Keine klebrige globale Datenstatusleiste; Schemaanzeigen dürfen den Arbeitsbereich nicht verdecken.

## Prüfung, Hilfen und Rückmeldungen

SQL-Abfragen werden mit dem vorhandenen Worker und der bestehenden Validierungs- und Vergleichslogik geprüft. Erweitere den Datenlademodus gezielt für die benötigten InstaHub-Tabellen. Prüfe Ergebnisrelationen semantisch; verlange keine wortgleiche SQL-Lösung. Berücksichtige Duplikate, geforderte Spalten, Sortierung und Aggregation entsprechend dem Auftrag. Ein zufällig passendes oder leeres Ergebnis allein darf einen fachlich falschen Verbund nicht als richtig bestätigen.

Beschreibe-Aufgaben verwenden die bestehende Skriptserver-Pipeline. Ergänze eindeutige Aufgaben-IDs und passende Rubriken. Bewertet werden sinngemäß ausgegebene Informationen, betroffene Datensätze, Bedeutung der Verknüpfung und gegebenenfalls Gruppierung/Zählung. Akzeptiere verständliche eigene Worte; bewerte keine bloße SQL-Nacherzählung als zwingend erforderlich.

Jede Aufgabe erhält eine eigene Prüfung und Rückmeldung. Verwende die bestehenden Stufen „korrekt“, „teilweise korrekt“ und „noch nicht korrekt“. Bei Freitext zusätzlich erreichte und maximale Punktzahl im bestehenden Feedbackrahmen anzeigen. Erneute Abgaben ersetzen alte Rückmeldungen vollständig. Unterscheide Ladezustand, fachliches Ergebnis und technischen Fehler.

Hilfen sind gestuft: kleiner Hinweis, konkreter Denkansatz, starke Hilfe oder Teillösung. Typische Hinweise betreffen fehlende Verknüpfungsbedingungen, verwechselte Schlüssel, mehrdeutige Attribute, falsche Follower-Richtung und fehlendes GROUP BY. Zeige beim ersten Fehlversuch keine vollständige Lösung.

Das Abschlussquiz verwendet die vorhandene Checkbox-Komponente mit `#final-quiz` und `addQuizQuestionChecks`. Mindestens zwei Fragen haben mehrere richtige Antworten. Jede Frage erhält „Frage N prüfen“ samt eigener Rückmeldung; der gemeinsame Auswertungsbutton bleibt. Sind alle Fragen einzeln korrekt geprüft, erfolgt die Gesamtauswertung automatisch.

## Integration und Abnahme

- Trage Aufgabe 9 im Jahrgangsmenü zwischen Aufgabe 8 und Aufgabe 10 ein. Verwende den kurzen Titel „Den Verbund üben“.
- Übernimm Farben, Karten, Typografie, Buttons, SQL-Eingabefelder, Ergebnisfenster und Feedbackgestaltung aus Aufgabe 5. Alle Reiter sind auf einem Laptop ohne horizontales Scrollen sichtbar; auf kleineren Geräten dürfen sie umbrechen.
- Die Aufgabennummer steht als eigene Zeile direkt unter der Hauptüberschrift. Rückweg zur Jahrgangsübersicht und Startseitenlink bleiben sichtbar.
- Speichere alle Eingaben unmittelbar bei Änderungen sowie aktiven Reiter, Fortschritt und Freischaltungen mit einem eigenen versionierten Schlüssel. Verwende die bestehenden Speicherkomponenten. Zurücksetzen löscht auch den Speicherstand.
- Prüfe Tastaturbedienung, sichtbare Labels und Fokusmarkierung sowie textliche Rückmeldungen mit `aria-live`. Breite Ergebnisrelationen scrollen nur in ihrem begrenzten Tabellenfenster. Daten und Serverantworten werden sicher als Text dargestellt.
- Prüfe richtige, teilweise richtige und falsche Antworten, gleichwertige SQL-Schreibweisen, falsche Schlüsselverknüpfungen, Duplikate, Gruppierung, Sortierung, leere Ergebnisse, SQL-Fehler sowie Serverfehler und erneute Abgaben. Prüfe auch Wechsel der Reiter und Rückkehr von der Aufgabenübersicht mit noch ungeprüften Eingaben.
- Führe passende vorhandene Syntax-, Build- und Testprüfungen sowie `git diff --check` aus. Teste die gemeinsame SQL-Logik bei Änderungen gegen Aufgaben 5 bis 7 und weitere tatsächlich betroffene Module. Prüfe die neue Seite interaktiv auf Desktop, Tablet und Smartphone.
- Ein Sicherungsblatt und ein separates Wiederholungs-Quiz sind in diesem Auftrag nicht enthalten. Übernimm aus Aufgabe 5 keine Verweise auf dessen Sicherungsblatt.

Führe die Implementierung mit dem vierstufigen Lernmodul-Loop gemäß AGENTS.md aus: Planung → Bau → regelbasierte Vorprüfung → fachlich-didaktische Endabnahme. Unter Codex: Planung und Endabnahme GPT-6 Sol (`high`), Bau GPT-6 Luna (`high`), Vorprüfung GPT-6 Luna (`medium`); begrenzte Korrekturschleifen gemäß AGENTS.md. Lies die Rollendefinitionen unter `.claude/agents/` und den Ablauf unter `.claude/commands/lernmodul-loop.md`. Der Planner schreibt eine verbindliche Spezifikation mit getrennten mechanischen und fachlich-didaktischen Akzeptanzkriterien; spätere Rollen arbeiten mit dieser Spezifikation.

Die oben geklärten didaktischen Entscheidungen und die Verwendung der sechs vorhandenen Datenexporte gelten verbindlich und müssen nicht erneut erfragt werden. Stelle Rückfragen, wenn zusätzliche didaktische oder fachliche Unklarheiten die konkrete Umsetzung beeinflussen.

Liefere am Ende die implementierten Dateien, eine kurze Zusammenfassung der wiederverwendeten Komponenten und bestandenen Prüfungen sowie gegebenenfalls konkret noch erforderliche Schritte zur Bereitstellung der neuen Freitextbewertungen. Behaupte einen funktionierenden Live-Server erst nach erfolgreicher Prüfung der neuen Aufgaben-IDs. Erstelle keinen Commit und veröffentliche die Website nicht ohne entsprechenden Auftrag.
