import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(
  new URL("../bewegung-koerpern.mjs", import.meta.url),
  "utf8"
);
const html = fs.readFileSync(new URL("../aufgabe1.html", import.meta.url), "utf8");
const css = fs.readFileSync(
  new URL("../bewegung-koerpern.css", import.meta.url),
  "utf8"
);
const semanticTask = fs.readFileSync(
  new URL("../components/physics-semantic-task.mjs", import.meta.url),
  "utf8"
);

assert.match(html, /Geschwindigkeit ist eine gerichtete Größe/);
assert.match(html, /a = 2,5&nbsp;m\/s²/);
assert.match(source, /expected: \{ x: 6, y: 2 \}/);
assert.match(source, /expected: \{ x: 4, y: 2 \}/);
assert.match(source, /Math\.abs\(value - 7\.5\)/);
assert.match(source, /M55 220 L180 130 L305 130 L430 70 L555 70 L680 220/);
assert.match(source, /Math\.abs\(value - 14400\)/);
assert.match(source, /Math\.abs\(value - 14\.4\)/);
assert.match(source, /speedExpected: \["A", "A", "B", "C"\]/);
assert.match(source, /accelerationExpected: \["I", "I", "I", "II"\]/);
assert.match(source, /yLabel: "x"/);
assert.match(source, /yLabel: "a"/);
assert.match(css, /@media \(max-width: 760px\)/);
assert.match(css, /@media \(max-width: 620px\)/);
assert.match(css, /@media \(max-width: 430px\)/);
assert.match(css, /\.vector-grid-host[\s\S]*?overflow-x: auto/);
assert.match(css, /\.large-chart[\s\S]*?overflow-x: auto/);
assert.match(html, /class="physics-table-scroll"/);
assert.match(source, /ph11-kreisbewegungen-bewegung-diagramm-beschreibung/);
assert.match(semanticTask, /button\.addEventListener\("click"/);
assert.match(semanticTask, /Antwort wird geprüft/);
assert.match(semanticTask, /finally/);
assert.doesNotMatch(semanticTask, /textarea\.value\s*=/);

console.log("Die fachlichen Sollwerte und Achsen des Physik-11-Moduls sind abgesichert.");
