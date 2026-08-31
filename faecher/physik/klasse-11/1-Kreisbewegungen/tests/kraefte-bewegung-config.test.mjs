import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync(new URL("../aufgabe2.html", import.meta.url), "utf8");
const source = fs.readFileSync(new URL("../kraefte-bewegung.mjs", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../kraefte-bewegung.css", import.meta.url), "utf8");
const grid = fs.readFileSync(new URL("../components/point-vector-grid.mjs", import.meta.url), "utf8");

assert.match(html, /Wiederholung 2/);
assert.equal((html.match(/data-physics-tab=/g) || []).length, 5);
assert.equal((html.match(/data-physics-panel=/g) || []).length, 5);
assert.match(html, /Einheit auswählen/);
assert.match(html, /class="vector-symbol"[^>]*>F<\/span> · Δt = m · Δ<span class="vector-symbol"[^>]*>v<\/span>/);
assert.match(html, /Drag-and-Drop/);
assert.match(html, /id="reset-law-cloze"/);
assert.match(html, /Rechenschritte sortieren/);
assert.match(html, /mehrere Antworten richtig/);
assert.match(html, /kraefte-bewegung\.css\?v=20260901b/);
assert.match(html, /kraefte-bewegung\.mjs\?v=20260901b/);
assert.match(source, /ph11-kreisbewegungen-kraeftegleichgewicht-beschreibung/);
assert.match(source, /setupLawCloze/);
assert.match(source, /reset-law-cloze/);
assert.match(source, /setupSortableSteps/);
assert.match(source, /12,0 besitzt drei gültige Ziffern/);
assert.match(source, /correct: \["law", "impulse"\]/);
assert.match(source, /correct: \["same", "different"\]/);
assert.match(grid, /export function createForceArrowGrid/);
assert.match(grid, /force-arrow-grid-point/);
assert.match(source, /isSelectablePoint: isCardinalForcePoint, hitRadius: 48/);
assert.match(grid, /Math\.max\(hitRadius, Math\.min\(scaleX, scaleY\) \* 0\.42\)/);
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
