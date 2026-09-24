# Notiz: Nicht mehr genutzte klassenkarte.de-Einbettungen

Stand: 24.09.2026

Die Zeichenwerkzeuge von klassenkarte.de sind aus den Aufgabenseiten entfernt
und durch Hinweise ersetzt („Hier erscheint bald ein Werkzeug …“). Anlass war
ein abgelaufenes Zertifikat von klassenkarte.de, wegen dem die Werkzeuge nicht
mehr luden.

Die beiden Einbettungsdateien werden seitdem nirgends mehr eingebunden, sind
aber noch vorhanden:

- `1-Tabellenkalkulation/orinoco-dfd.html` – Datenflussdiagramm-Werkzeug,
  früher eingebettet in Aufgabe 5a (Reiter 2b) und Aufgabe 5b (Reiter 2)
- `3-Modellierung-und-Programmierung-Online-IDE/klassenkarte-klasse-only.html` –
  Klassenkarten-Werkzeug, früher eingebettet in Aufgabe 2, Teilaufgabe 2d

## Aufgabe

**Sobald die Entscheidung gefallen ist, die Dateien nicht mehr zu brauchen,
werden sie vollständig mit allem drum und dran gelöscht.** Dazu gehört:

1. Beide HTML-Dateien löschen.
2. Die dann ungenutzten CSS-Regeln für eingebettete iframes entfernen:
   - `.tool-embed iframe { … }` in `1-Tabellenkalkulation/tabellenkalkulation.css`
     (danach den Cache-Buster von `tabellenkalkulation.css` in den Seiten erhöhen,
     die das Stylesheet laden)
   - `.tool-embed iframe { … }` im `<style>`-Block von
     `3-Modellierung-und-Programmierung-Online-IDE/aufgabe2.html`

   Die Regeln `.tool-embed` und `.tool-placeholder` bleiben, solange die
   Hinweise noch angezeigt werden.
3. Projektweit nach verbliebenen Verweisen suchen (`orinoco`, `klassenkarte`,
   `klassenkarte.de`) und alle Funde bereinigen.
4. Diese Notiz löschen.

Wird stattdessen ein eigenes Werkzeug eingebaut, ersetzt es die Hinweise in
5a, 5b und Online-IDE Aufgabe 2. Die Dateien oben werden dann trotzdem wie
beschrieben entfernt.
