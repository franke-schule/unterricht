import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync(new URL("../aufgabe2.html", import.meta.url), "utf8");
const source = fs.readFileSync(new URL("../kraefte-bewegung.mjs", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../kraefte-bewegung.css", import.meta.url), "utf8");
const grid = fs.readFileSync(new URL("../components/point-vector-grid.mjs", import.meta.url), "utf8");

assert.match(html, /Wiederholung 2/);
assert.equal((html.match(/data-physics-tab=/g) || []).length, 5);
assert.equal((html.match(/data-physics-panel=/g) || []).length, 5);
// Einheit als Dropdown direkt neben dem Eingabefeld (manifest-physikaufgaben 3)
assert.match(html, /<select id="force-acceleration-unit" aria-label="Einheit der Beschleunigung"><option value="">Einheit<\/option>/);
assert.doesNotMatch(html, /class="unit-choice"/);
assert.match(html, /class="vector-symbol"[^>]*>F<\/span> · Δt = m · Δ<span class="vector-symbol"[^>]*>v<\/span>/);
assert.match(html, /<strong>Ziehe<\/strong> jede Größe aus dem Wortspeicher auf das passende Formelzeichen/);
assert.match(html, /<strong>Ziehe<\/strong> die Begriffe aus dem Wortspeicher in die Lücken/);
assert.match(html, /id="reset-law-cloze"/);
assert.match(html, /Rechenschritte sortieren/);
assert.match(html, /mehrere Antworten richtig/);
assert.match(html, /kraefte-bewegung\.css\?v=20260921a/);
assert.match(html, /bewegung-koerpern\.css\?v=20260910a/);
assert.match(html, /kraefte-bewegung\.mjs\?v=20260921a/);
assert.match(html, /Sicherungsblatt zu Wiederholung 2/);
assert.match(html, /onsubmit="unlockSolution\(event, 'R8NT-DKPV', 'solution-download-link', 'solution-code-message'\)"/);
assert.match(html, /href="sicherungsblatt-aufgabe-2-loesungen\.pdf\?v=20260920d" download hidden/);
// Merksatz zu den Angriffspunkten steht in jeder Rückmeldung zu Aufgabe 5
assert.match(source, /function forceBalanceFeedback\(result\)/);
assert.match(source, /\*\*Die Gewichtskraft greift immer im Körpermittelpunkt per Definition\. Die Gegenkraft des Tisches greift am Kontaktpunkt zwischen Körper und Tisch\.\*\*/);
assert.match(source, /feedbackBuilder: forceBalanceFeedback/);
assert.match(css, /\.physics-semantic-feedback \.physics-semantic-note/);
// Sicherungsblatt: Angriffspunkte, Beschriftungen und Crashtest-Grafik
const sheet = fs.readFileSync(new URL("../sicherungsblatt-aufgabe-2-loesungen.tex", import.meta.url), "utf8");
assert.doesNotMatch(sheet, /Körper auf dem Tisch\}\\par\\scriptsize Ruhe/);
assert.doesNotMatch(sheet, /Waagerechte Kräfte|Antriebs-|Widerstands-/);
assert.match(sheet, /\\textbf\{Auto\}\\par\\scriptsize fährt mit konstanter Geschwindigkeit/);
assert.match(sheet, /Kraft durch\\\\Motor \$F_M\$/);
assert.match(sheet, /Reibungs-\\\\kraft/);
assert.match(sheet, /\\fill\[Gold\] \(20,-7\) circle/);
assert.match(sheet, /\\definecolor\{Crack\}/);
assert.equal((sheet.match(/\\draw\[Crack/g) || []).length, 2);
// Merksätze stehen als Zeile unter der jeweiligen Grafik, nicht mehr im Kasten
assert.match(sheet, /Kräftegleichgewicht -- zwei Kräfte wirken auf denselben Körper/);
assert.match(sheet, /Wechselwirkung -- zwei Kräfte wirken auf unterschiedliche Körper/);
assert.doesNotMatch(sheet, /colorbox\{Gold\}\{\\parbox/);
assert.doesNotMatch(sheet, /Die Kräfte wirken auf denselben Körper\. Ihre Summe ist null/);
assert.doesNotMatch(sheet, /Resultierende Kraft: \$0\\unit\{N\}\$/);
assert.match(source, /function unlockSolution\(event, expectedCode, downloadLinkId, messageId\)/);
assert.match(source, /Code korrekt\. Das Sicherungsblatt ist freigeschaltet\./);
assert.match(source, /Der eingegebene Code ist nicht gültig\./);
assert.match(source, /ph11-kreisbewegungen-kraeftegleichgewicht-beschreibung/);
assert.match(source, /setupLawCloze/);
assert.match(source, /reset-law-cloze/);
assert.match(source, /setupSortableSteps/);
assert.match(source, /12,0 besitzt drei gültige Ziffern/);
assert.match(source, /correct: \["law", "impulse"\]/);
assert.match(source, /correct: \["same", "different"\]/);
assert.match(grid, /export function createForceArrowGrid/);
assert.match(grid, /force-arrow-grid-point/);
assert.match(source, /isSelectablePoint: isForceArrowPoint \}/);
// Hitboxen sind Kreissektoren entlang der Richtung, nicht einzelne Punkte
assert.match(grid, /export function hitWedgePoints/);
assert.match(grid, /svgElement\("polygon"/);
assert.doesNotMatch(grid, /hitRadius/);
assert.match(grid, /Die ganze gedachte Linie ist anklickbar/);
// Aufgabe 1: Ablagefeld und Prüfbutton mittig
assert.match(css, /\.law-term-slot \{[\s\S]*?text-align: center;/);
assert.match(css, /\.law-term-card \.direct-check-button \{[\s\S]*?justify-self: center;/);
// Aufgabe 2: vertauschte Reihenfolge der beiden letzten Lücken gilt auch
assert.match(source, /const swappableGaps = \[4, 5\];/);
assert.match(source, /const correct = countCorrectGaps\(\);/);
// Aufgabe 3: gültige Ziffern richtig begründet
assert.match(source, /Die Angabe 100 g besitzt drei gültige Ziffern, die Angabe 1,2 N zwei gültige Ziffern\./);
assert.doesNotMatch(source, /Die Angaben 100 g und 1,2 N werden hier jeweils mit zwei gültigen Ziffern verwendet/);
// 45-Grad-Pfeile sind zeichenbar (Fehlvorstellung) und bekommen eigenes Feedback
assert.match(source, /const DIAGONAL_DIRECTIONS = \["up-left", "up-right", "down-left", "down-right"\]/);
assert.match(source, /Ein schräger Pfeil passt hier nicht\. Die Gravitationskraft zieht jeden Körper auf der Erde zum Erdmittelpunkt/);
assert.match(source, /Der Luftwiderstand bremst den Fall und zeigt senkrecht nach oben\./);
assert.doesNotMatch(source, /Prüfe die Richtungen der beiden Kräfte/);
// Kleinere Pfeilspitzen an den Kraftpfeilen
assert.match(grid, /const ARROW_HEAD_SIZE = 5;/);
assert.match(grid, /createMarker\(definitions, `\$\{svgId\}-first`, "#2563eb", ARROW_HEAD_SIZE\)/);
// Drag-and-Drop mit Pointer Events für Aufgabe 1 und Aufgabe 2, inklusive Entfernen
const tokenDrag = fs.readFileSync(new URL("../components/token-drag.mjs", import.meta.url), "utf8");
assert.match(source, /import \{ enableTokenDrag, wasDragged \} from "\.\/components\/token-drag\.mjs";/);
assert.match(tokenDrag, /export function enableTokenDrag\(element, \{ getLabel, dropSelector, bankSelector, onDrop, renderGhost \}\)/);
// Die Datei wird auch von Aufgabe 1 bis 3 geladen: deren Auswahlfeld-Lücken
// und ausgegraute Karten dürfen nicht verloren gehen; der Kasten gilt nur hier.
assert.match(css, /\.cloze-token:disabled \{/);
assert.match(css, /\.cloze-sentence select \{/);
assert.match(css, /#law-cloze \.cloze-sentence \{/);
assert.equal((source.match(/else if \(onBank\) place\(/g) || []).length, 2);
assert.doesNotMatch(source, /select\[data-cloze-gap\]|Begriff wählen …|Auswahl wählen …/);
// Crashtest: Auto berührt die Wand und zeigt Schaden
assert.match(source, /class: "scene-damage"/);
assert.match(source, /M\$\{wallFace\} \$\{origin\.y \+ 50\}/);
assert.match(css, /\.scene-damage/);
// Zusätzliche Fehlvorstellung und eigene Rückmeldung in Aufgabe 4b
assert.match(source, /\["smaller", "Die Gewichtskraft \{\{F_G\}\} ist kleiner als die Luftwiderstandskraft \{\{F_R\}\}\."\]/);
assert.match(source, /Achtung: Der Fallschirmspringer fliegt nach einer gewissen Zeit mit konstanter Geschwindigkeit nach unten\. Was gilt immer bei konstanter Geschwindigkeit\?/);
assert.match(source, /optionHints = \{\}/);
// Weiter-Buttons am Ende jedes Reiterinhalts (außer im letzten Reiter "quiz")
assert.deepEqual(
  [...html.matchAll(/data-next-tab="([^"]+)"/g)].map((match) => match[1]),
  ["parachute", "balance", "crash", "quiz"],
);
assert.match(source, /function setupNextTabButtons\(stepTabs\)/);
assert.match(css, /\.physics-step-next/);
assert.match(css, /\.cloze-token/);
assert.match(css, /\.sortable-step/);
assert.match(css, /@media \(max-width: 520px\)/);

const headings = [...html.matchAll(/<h[34][^>]*>(Aufgabe [^<]+)<\/h[34]>/g)].map((match) => match[1]);
assert.deepEqual(headings, [
  "Aufgabe 1 · Größen benennen",
  "Aufgabe 2 · Grundgesetz interpretieren",
  "Aufgabe 3 · Beschleunigung berechnen",
  "Aufgabe 4a · Kraftpfeile einzeichnen",
  "Aufgabe 4b · Aussagen zum Fallschirmspringer",
  "Aufgabe 5 · Kräfte vergleichen und begründen",
  "Aufgabe 6a · Wechselwirkungskräfte einzeichnen",
  "Aufgabe 6b · Kräfte beurteilen",
  "Aufgabe 7 · Kräfte und Bewegung sichern",
]);

const correctSets = [...source.matchAll(/correct:\s*\[([^\]]+)\]/g)].map((match) => match[1].split(","));
assert.equal(correctSets.length, 7);
assert.ok(correctSets.every((answers) => answers.length >= 2));
assert.doesNotMatch(source, /F⃗|v⃗/);

console.log("Wiederholung 2 enthält die vollständige Aufgabenfolge, DnD-/Sortierhilfen und ein Mehrfachauswahlquiz.");
