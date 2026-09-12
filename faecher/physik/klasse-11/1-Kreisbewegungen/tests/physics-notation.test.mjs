import assert from "node:assert/strict";
import fs from "node:fs";

const read = (name) => fs.readFileSync(new URL(`../${name}`, import.meta.url), "utf8");

const pages = ["aufgabe1.html", "aufgabe2.html", "aufgabe3.html"];
const modules = ["bewegung-koerpern.mjs", "kraefte-bewegung.mjs", "winkelgeschwindigkeit-kreisbewegung.mjs"];

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
const forbiddenUnit = /(?:^|[\s\d,.(>])(m|km|rad|N)\/(s²|s|h|kg)(?![\w-])/;
for (const page of pages) {
  const html = read(page);
  assert.match(html, /components\/physics-notation\.css/, `${page} bindet die Notations-CSS nicht ein`);
  html.split("\n").forEach((line, index) => {
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

// Einheitenauswahl nutzt Auswahlfelder mit Bruchdarstellung statt eines <select>.
for (const page of ["aufgabe1.html", "aufgabe2.html"]) {
  const html = read(page);
  assert.match(html, /class="unit-choice"/, `${page} nutzt keine Einheitenauswahl mit Bruchdarstellung`);
  assert.doesNotMatch(html, /<option value="m\/s/, `${page} enthält noch ein <select> mit Einheiten`);
}

// Divisionen in den Sicherungsblättern sind als Bruch gesetzt.
for (const sheet of ["sicherungsblatt-aufgabe-1-loesungen.tex", "sicherungsblatt-aufgabe-2-loesungen.tex"]) {
  assert.doesNotMatch(read(sheet), /m\/s|km\/h/, `${sheet} enthält eine Einheit mit Schrägstrich`);
}
assert.ok(read("sicherungsblatt-aufgabe-1-loesungen.tex").includes("\\newcommand{\\unitfrac}[2]"), "Das Sicherungsblatt definiert kein Bruchmakro fuer Einheiten");

console.log("Einheiten stehen als Bruch, Indizes sind tiefgestellt und beides kommt aus der gemeinsamen Komponente.");
