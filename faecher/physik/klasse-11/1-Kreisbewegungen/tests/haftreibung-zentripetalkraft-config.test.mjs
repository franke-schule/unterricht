import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync(new URL("../aufgabe5.html", import.meta.url), "utf8");
const source = fs.readFileSync(new URL("../haftreibung-zentripetalkraft.mjs", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../haftreibung-zentripetalkraft.css", import.meta.url), "utf8");

assert.match(html, /Aufgabe 5 – Die Haftreibungskraft als Zentripetalkraft/);
assert.match(html, /haftreibung-zentripetalkraft\.mjs\?v=20260922c/);
assert.match(html, /haftreibung-zentripetalkraft\.css\?v=20260922b/);
assert.equal((html.match(/data-physics-tab=/g) || []).length, 6);
assert.equal((html.match(/data-physics-panel=/g) || []).length, 6);
assert.deepEqual([...html.matchAll(/data-next-tab="([^"]+)"/g)].map((match) => match[1]), ["curve", "grip", "limit", "calculate", "quiz"]);

const images = [
  ["haftreibung-situation-hammerwurf.webp", "Hammerwerferin im Ring, die einen Hammer an einem gespannten Seil im Kreis schwingt."],
  ["haftreibung-situation-lkw-kurve.webp", "Lastwagen auf einer ebenen, deutlich gekrümmten Straße."],
  ["haftreibung-situation-zentrifuge.webp", "Geöffnete Laborzentrifuge mit Probengefäßen in rotierenden Halterungen."],
  ["haftreibung-situation-achterbahn.webp", "Achterbahnwagen auf einer deutlich gekrümmten Schiene."],
];
images.forEach(([file, alt]) => {
  assert.match(html, new RegExp(file.replace(".", "\\.")));
  assert.match(html, new RegExp(alt.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  assert.ok(fs.existsSync(new URL(`../assets/haftreibung-zentripetalkraft/${file}`, import.meta.url)), `${file} fehlt`);
});

assert.match(html, /id="check-real-forces"/);
assert.match(html, /id="check-centripetal-role"/);
assert.match(html, /id="real-forces-feedback"[^>]+aria-live="polite"/);
assert.match(html, /id="centripetal-role-feedback"[^>]+aria-live="polite"/);

for (const obsolete of ["side-force", "friction-state", "decomposition-animation", "curve-danger-answer", "mass-answer", "summary-cloze"]) {
  assert.doesNotMatch(html, new RegExp(obsolete));
  assert.doesNotMatch(source, new RegExp(obsolete));
}
assert.doesNotMatch(html, /Gleitreibung/i);
assert.doesNotMatch(source, /Gleitreibung/i);
assert.doesNotMatch(source, /setupPhysicsSemanticTask/);

// Aufgabe 4: Herleitung als Drag-and-Drop-Zuordnung statt Formelauswahl.
assert.match(html, /id="derivation-sort"[\s\S]*id="check-derivation"[\s\S]*id="reset-derivation"[\s\S]*id="derivation-feedback"[^>]+aria-live="polite"/);
assert.match(html, /id="derivation-remember"[^>]+hidden/);
assert.doesNotMatch(html, /limit-formula|derivation-steps/);
assert.doesNotMatch(source, /limit-formula/);
assert.match(source, /from "\.\/components\/token-drag\.mjs"/);
assert.equal((source.match(/^  \{ id: "(limit|insert|cancel|multiply|root)", formula:/gm) || []).length, 5);
assert.match(source, /id: "no-root"/);
assert.match(source, /id: "divide"/);
assert.match(css, /\.derivation-sort \{ display: grid; grid-template-columns: minmax\(0, 1\.15fr\) minmax\(0, 1fr\)/);

// Wurzeln in Aufgabe 4 und 5 mit durchgehendem Wurzelstrich.
assert.match(source, /createSquareRoot\(/);
assert.match(source, /addSquareRootSigns\(\);/);
assert.equal((html.match(/class="physics-sqrt" role="img" aria-label="Wurzel aus /g) || []).length, 7);
assert.doesNotMatch(html + source, /√/);
assert.match(html, /physics-notation\.css\?v=20260922b/);

assert.equal((html.match(/class="speed-entry"/g) || []).length, 2);
assert.match(html, /id="wet-speed-answer"[\s\S]*id="wet-speed-unit"[\s\S]*id="check-wet-speed"[\s\S]*id="wet-speed-feedback"/);
assert.match(html, /id="ice-speed-answer"[\s\S]*id="ice-speed-unit"[\s\S]*id="check-ice-speed"[\s\S]*id="ice-speed-feedback"/);
for (const value of ["mps", "kmh", "mps2", "N"]) assert.equal((html.match(new RegExp(`<option value="${value}">`, "g")) || []).length, 2);
for (const value of ["19.8", "71.3", "9.9", "35.7"]) assert.match(source, new RegExp(value.replace(".", "\\.")));
assert.match(source, /replace\(",", "\."\)/);
assert.match(source, /decimalPlaces\(raw\) === 1/);

assert.match(html, /<details><summary>Vollständiges Beispiel: trockene Straße<\/summary>/);
assert.match(html, /22,1[\s\S]*79,7/);
assert.equal((source.match(/question:/g) || []).length, 5);
assert.equal((source.match(/input\.type = "checkbox"/g) || []).length, 1);
assert.ok((source.match(/correct: \[[^\]]*,[^\]]*\]/g) || []).length >= 4, "Mindestens zwei Quizfragen brauchen mehrere richtige Antworten");

assert.match(html, /solution-download-link-summary/);
assert.match(html, /name="solution-code"/);
assert.match(html, /unlockSolution\(event, 'R3KM-DQX8', 'solution-download-link-summary'/);
assert.match(html, /unlockSolution\(event, 'R3KM-DQX8', 'solution-download-link'/);
assert.equal((html.match(/sicherungsblatt-aufgabe-5-loesungen\.pdf/g) || []).length, 2);
assert.match(css, /object-fit: cover/);
assert.match(css, /grid-template-columns: minmax\(0, 1fr\) auto/);
assert.match(css, /@media \(max-width: 390px\)/);
assert.match(css, /\.download-button\[hidden\]/);

console.log("Haftreibungskraft: sechs Reiter, Bilder, getrennte Prüfungen, Zahleneingaben, Quiz und Downloads sind konfiguriert.");
