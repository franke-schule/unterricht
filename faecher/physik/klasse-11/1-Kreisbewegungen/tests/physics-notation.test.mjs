import assert from "node:assert/strict";
import fs from "node:fs";

const read = (name) => fs.readFileSync(new URL(`../${name}`, import.meta.url), "utf8");

const pages = ["aufgabe1.html", "aufgabe2.html", "aufgabe3.html", "aufgabe4.html"];
const modules = ["bewegung-koerpern.mjs", "kraefte-bewegung.mjs", "winkelgeschwindigkeit-kreisbewegung.mjs", "zentripetalkraft.mjs"];

const notation = read("components/physics-notation.mjs");
const notationCss = read("components/physics-notation.css");

// Die gemeinsame Notationskomponente stellt Indizes und Brüche bereit.
assert.match(notation, /export function createIndexedSymbol/);
assert.match(notation, /export function createUnitFraction/);
assert.match(notation, /export function createQuotient/);
assert.match(notation, /export function appendPhysicsText/);
assert.match(notation, /document\.createElement\("sub"\)/);
assert.match(notation, /document\.createElement\("strong"\)/);
assert.match(notationCss, /\.physics-fraction__denominator \{[^}]*border-top/);

// Zusammengesetzte Einheiten werden nie als Schrägstrich im Text ausgegeben.
//
// Ausnahme laut manifest-physikaufgaben.txt Abschnitt 4: Ein natives
// <option>-Element kann keinen waagerechten Bruchstrich darstellen. Deshalb
// dürfen die Optionstexte der Einheiten-Dropdowns "m/s", "km/h" und "m/s²"
// anzeigen. Überall sonst (Aufgabentext, Feedback, Hilfen, Sicherungsblatt)
// stehen Einheiten weiterhin als Bruch.
const forbiddenUnit = /(?:^|[\s\d,.(>])(m|km|rad|N)\/(s²|s|h|kg)(?![\w-])/;
const withoutUnitOptionTexts = (html) => html.replace(
  /<select id="[^"]*unit[^"]*"[\s\S]*?<\/select>/g,
  (block) => block.replace(/<option value="[^"]*">[^<]*<\/option>/g, "<option></option>")
);
for (const page of pages) {
  const html = read(page);
  assert.match(html, /components\/physics-notation\.css/, `${page} bindet die Notations-CSS nicht ein`);
  const html_for_slash_check = withoutUnitOptionTexts(html);
  html_for_slash_check.split("\n").forEach((line, index) => {
    line.split(/(<[^>]*>)/g).forEach((segment, position) => {
      if (position % 2 === 1) return;
      assert.doesNotMatch(segment, forbiddenUnit, `${page}:${index + 1} enthält eine Einheit mit Schrägstrich`);
      assert.doesNotMatch(segment, /\{\{/, `${page}:${index + 1} enthält einen unaufgelösten Platzhalter`);
    });
  });
}

// Indizes stehen in Formelzeichen nie als Rohtext.
const rawIndex = /[\s"(>][A-Za-zωΔ]_[A-Z0-9](?![\w-])/;
for (const name of [...pages, ...modules]) {
  const withoutTokens = read(name).replace(/\{\{[^}]*\}\}/g, "");
  assert.doesNotMatch(withoutTokens, rawIndex, `${name} enthält einen Index als Rohtext`);
}

// Alle drei Module rendern Rückmeldungen und Optionstexte über die Komponente.
for (const name of modules) {
  const source = read(name);
  assert.match(source, /from "\.\/components\/physics-notation\.mjs/, `${name} importiert die Notationskomponente nicht`);
  assert.match(source, /appendPhysicsText\(/, `${name} nutzt appendPhysicsText nicht`);
  assert.match(source, /physicsTextSpan\(labelText, "quiz-option-text"\)/, `${name} rendert Optionstexte nicht als ein Element`);
}

// Einheiten bei Rechenaufgaben: Dropdown direkt neben dem Eingabefeld, erste
// Option leer und plausible falsche Einheiten zur Auswahl
// (manifest-physikaufgaben.txt Abschnitt 3).
for (const page of ["aufgabe1.html", "aufgabe2.html", "aufgabe4.html"]) {
  const html = read(page);
  const unitSelects = [...html.matchAll(/<select id="[^"]*unit[^"]*"[\s\S]*?<\/select>/g)].map((match) => match[0]);
  assert.ok(unitSelects.length, `${page} enthält kein Einheiten-Dropdown`);
  unitSelects.forEach((block) => {
    assert.match(block, /<option value="">Einheit<\/option>/, `${page}: Einheiten-Dropdown ohne leere erste Option`);
    assert.ok((block.match(/<option /g) || []).length >= 4, `${page}: Einheiten-Dropdown ohne plausible falsche Einheiten`);
  });
  assert.equal(
    (html.match(/<div class="physics-number-controls">\s*<input[^>]*>(?:\s|<!--[\s\S]*?-->)*<select id="[^"]*unit/g) || []).length,
    unitSelects.length,
    `${page}: Einheiten-Dropdown steht nicht direkt neben dem Eingabefeld`
  );
}

// Divisionen in den Sicherungsblättern sind als Bruch gesetzt.
for (const sheet of ["sicherungsblatt-aufgabe-1-loesungen.tex", "sicherungsblatt-aufgabe-2-loesungen.tex", "sicherungsblatt-aufgabe-4-loesungen.tex"]) {
  assert.doesNotMatch(read(sheet), /m\/s|km\/h/, `${sheet} enthält eine Einheit mit Schrägstrich`);
}
assert.ok(read("sicherungsblatt-aufgabe-1-loesungen.tex").includes("\\newcommand{\\unitfrac}[2]"), "Das Sicherungsblatt definiert kein Bruchmakro fuer Einheiten");

// createQuotient rendert Indizes wie "v_B" über createIndexedSymbol und schreibt
// sie im aria-label als "v mit Index B" aus; unveränderte Quotienten ohne "_"
// bleiben von dieser Erweiterung unberührt.
assert.match(notation, /function createQuotient/);
assert.match(notation, /INDEXED_TOKEN/);
assert.match(notation, /appendIndexedText\(top, numerator\)/);
assert.match(notation, /appendIndexedText\(bottom, denominator\)/);
assert.match(notation, /mit Index \$\{INDEX_NAMES\.get\(index\) \|\| index\}/);

console.log("Einheiten stehen als Bruch, Indizes sind tiefgestellt und beides kommt aus der gemeinsamen Komponente.");
