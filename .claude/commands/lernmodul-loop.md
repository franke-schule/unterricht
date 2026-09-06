---
description: Plan-Build-Review-Loop für ein neues oder größeres Lernmodul (Planung Opus, Bau Sonnet, regelbasierte Vorprüfung Sonnet, Endabnahme Opus)
---

Führe für die folgende Aufgabe den kompletten Lernmodul-Loop aus:

AUFGABE: $ARGUMENTS

## Vorabprüfung

Der Loop hat Fixkosten: drei bis vier Subagenten starten jeweils mit leerem
Kontext und lesen Manifeste und Referenzdateien neu ein. Er lohnt sich bei
neuen oder umfangreich überarbeiteten Modulen und bei Serien (eine Konzeption,
mehrere Artefakte).

Wenn die Aufgabe erkennbar klein ist — eine einzelne Textkorrektur, ein
Menüeintrag, ein Linkfix, eine Zahlenänderung —, dann starte den Loop nicht,
sondern sage das kurz und erledige es direkt. Frage nicht nach, entscheide.

## Ablauf

**1. Planung.** Rufe `lernmodul-planner` mit der Aufgabe auf.
Das Ergebnis ist die SPEZIFIKATION. Sie enthält zwei getrennte
Akzeptanzkriterien-Listen (regelbasiert / fachlich-didaktisch).

**2. Bau.** Rufe `lernmodul-builder` mit der SPEZIFIKATION auf.

**3. Innere Schleife — regelbasierte Vorprüfung (günstig, max. 3 Runden).**
Rufe `lernmodul-pruefer` mit den regelbasierten Akzeptanzkriterien und der
Liste der geänderten Dateien auf.

- `PRUEFUNG_BESTANDEN` → weiter zu Schritt 4.
- `PRUEFUNG_FEHLER` → Zähler A um 1 erhöhen. Bei A ≤ 3: `lernmodul-builder`
  erneut aufrufen, mit SPEZIFIKATION und der Fehlerliste, danach zurück an den
  Anfang von Schritt 3. Bei A > 3: Schleife abbrechen und die offenen Punkte
  dem Nutzer vorlegen.

**4. Äußere Schleife — Endabnahme (teuer, max. 2 Aufrufe).**
Rufe `lernmodul-reviewer` mit der SPEZIFIKATION, der Liste der geänderten
Dateien und dem Bericht des Prüfers auf.

- `APPROVED` → Loop beenden, Schritt 5.
- `CHANGES_REQUIRED` → Zähler B um 1 erhöhen. Bei B = 1: `lernmodul-builder`
  mit SPEZIFIKATION und Beanstandungsliste aufrufen, danach **einmal**
  `lernmodul-pruefer` zur Kontrolle, danach `lernmodul-reviewer` ein zweites
  Mal. Bei B ≥ 2: abbrechen und eskalieren.

**5. Abschluss.** Fasse für den Nutzer zusammen: gebaute und geänderte
Dateien, wiederverwendete Komponenten, Anzahl der gelaufenen Runden.

**Eskalation.** Bei Abbruch in Schritt 3 oder 4: Schleife nicht fortsetzen,
sondern die offenen Beanstandungen klar zusammenfassen und fragen, wie
weiter vorgegangen werden soll — weitere manuelle Runde, Spezifikation
anpassen, oder Abweichung bewusst akzeptieren.

## Regeln für dich als Orchestrator

- Gib nach jedem abgeschlossenen Schritt eine kurze Statuszeile aus, z. B.
  „Vorprüfung Runde 2/3: 2 Regelverstöße" oder „Endabnahme 1/2: APPROVED".
- Reiche die SPEZIFIKATION unverändert weiter. Fasse sie nicht zusammen und
  ergänze sie nicht um eigene Vorgaben.
- Baue oder korrigiere nichts selbst. Auch nicht die Kleinigkeit, die schneller
  ginge — sonst weicht der Stand von dem ab, was die Prüfstufen gesehen haben.
- Überspringe keine Stufe und erfinde keine zusätzlichen.
- Der Reviewer ist die teuerste Stufe. Rufe ihn nie auf, solange die
  Vorprüfung nicht bestanden ist.
