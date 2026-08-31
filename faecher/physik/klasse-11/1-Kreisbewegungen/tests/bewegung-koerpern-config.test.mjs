import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

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
assert.match(html, /über <strong>3,0&nbsp;s<\/strong>/);
assert.match(source, /unit === "m\/s" \? 7\.5 : 27/);
assert.match(source, /significantDigitCount\(input\.value\) === 2/);
const significantDigitsMatch = source.match(/function significantDigitCount\(value\) \{[\s\S]*?\n\}/);
assert.ok(significantDigitsMatch);
const significantDigitCount = vm.runInNewContext(`(${significantDigitsMatch[0]})`);
assert.equal(significantDigitCount("7,5"), 2);
assert.equal(significantDigitCount("27"), 2);
assert.equal(significantDigitCount("7,50"), 3);
assert.equal(significantDigitCount("14 000"), 2);
assert.equal(significantDigitCount("14,4"), 3);
assert.match(source, /M55 220 L180 130 L305 130 L430 70 L555 70 L680 220/);
assert.match(source, /unit === "m" \? 14000 : 14/);
assert.match(source, /unit === "m" \? 14400 : 14\.4/);
assert.match(source, /speedExpected: \["A", "A", "B", "C"\]/);
assert.match(source, /accelerationExpected: \["I", "I", "I", "II"\]/);
assert.match(source, /yLabel: "x"/);
assert.match(source, /yLabel: "a"/);
assert.match(css, /@media \(max-width: 760px\)/);
assert.match(css, /@media \(max-width: 620px\)/);
assert.match(css, /@media \(max-width: 430px\)/);
assert.match(css, /\.vector-grid-host[\s\S]*?overflow-x: auto/);
assert.match(css, /\.large-chart[\s\S]*?overflow-x: auto/);
assert.match(css, /\.physics-revision-panel\[hidden\][\s\S]*?display: none/);
assert.match(css, /\.physics-task-card[\s\S]*?min-width: 0/);
assert.match(html, /bewegung-koerpern\.css\?v=20260831b/);
assert.match(html, /bewegung-koerpern\.mjs\?v=20260831b/);
assert.equal((html.match(/class="physics-number-controls"/g) || []).length, 2);
assert.match(css, /\.physics-number-controls \{[\s\S]*?grid-template-columns: minmax\(0, 1fr\) 92px;/);
assert.equal(
  (html.match(/Wähle einen Punkt, an dem sich die Gitterlinien kreuzen, um eine Linie zu zeichnen\./g) || []).length,
  2
);
assert.doesNotMatch(html, /Wähle nur die Gitterkreuzung/);
assert.match(css, /\.point-vector-grid \.grid-point \{[\s\S]*?fill: transparent;[\s\S]*?stroke: none;[\s\S]*?opacity: 0;/);
assert.match(css, /\.point-vector-grid:focus-within svg/);
assert.match(html, /class="physics-table-scroll"/);
assert.match(source, /ph11-kreisbewegungen-bewegung-diagramm-beschreibung/);
assert.match(semanticTask, /button\.addEventListener\("click"/);
assert.match(semanticTask, /Antwort wird geprüft/);
assert.match(semanticTask, /finally/);
assert.doesNotMatch(semanticTask, /textarea\.value\s*=/);

const visibleTaskHeadings = [...html.matchAll(/<h[34][^>]*>(Aufgabe [^<]+)<\/h[34]>/g)]
  .map((match) => match[1]);
assert.deepEqual(visibleTaskHeadings, [
  "Aufgabe 1 · Geschwindigkeiten umrechnen",
  "Aufgabe 2 · Betrag und Richtung",
  "Aufgabe 3a · Addition links",
  "Aufgabe 3b · Addition rechts",
  "Aufgabe 4 · Geschwindigkeit nach dem Beschleunigen",
  "Aufgabe 5 · Diagramme zuordnen",
  "Aufgabe 6 · Ein v(t)-Diagramm beschreiben",
  "Aufgabe 6a · Deine Beschreibung",
  "Aufgabe 6b · Im Heft",
  "Aufgabe 6c · Zurückgelegter Weg",
  "Aufgabe 7 · Zeit-Ort-Diagramme zuordnen",
  "Aufgabe 8 · Wiederholungsquiz",
]);

const vtOrderMatch = source.match(/const vtOptionOrder = (\[[\s\S]*?\n\]);/);
const vtDiagramsMatch = source.match(/const diagrams = (\[[\s\S]*?\n  \]);\n  const optionById/);
assert.ok(vtOrderMatch && vtDiagramsMatch);
const vtOrder = vm.runInNewContext(`(${vtOrderMatch[1]})`);
const vtDiagramOrder = vm.runInNewContext(`(${vtDiagramsMatch[1]})`)
  .map((item) => item.expected);
assert.notDeepEqual(vtOrder, vtDiagramOrder);
assert.equal(vtOrder[0], "negative-then-constant");

const quizMatch = source.match(/const quizItems = (\[[\s\S]*?\n  \]);\n  const target/);
assert.ok(quizMatch);
const quizItems = vm.runInNewContext(`(${quizMatch[1]})`);
assert.equal(quizItems.length, 3);
quizItems.forEach((item) => {
  assert.ok(item.correct.length >= 2, `${item.question} benötigt mindestens zwei richtige Antworten.`);
  assert.ok(item.correct.every((value) => item.options.some(([option]) => option === value)));
});

assert.doesNotMatch(html, /id="check-vt-matching"|id="check-other-matching"|id="check-quiz"/);
assert.match(source, /Diagramm \$\{diagramLabel\} prüfen/);
assert.match(source, /Geschwindigkeit prüfen/);
assert.match(source, /Beschleunigung prüfen/);
assert.equal((source.match(/class="chart-section-label"/g) || []).length, 5);
assert.doesNotMatch(`${html}\n${source}`, /verzöger|verzoeger/i);

console.log("Nummerierung, Einzelprüfungen, Fachbegriffe und Mehrfachauswahl sind abgesichert.");
