import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync(new URL("../aufgabe5.html", import.meta.url), "utf8");
const source = fs.readFileSync(new URL("../haftreibung-zentripetalkraft.mjs", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../haftreibung-zentripetalkraft.css", import.meta.url), "utf8");
const menu = fs.readFileSync(new URL("../../index.html", import.meta.url), "utf8");
const sheet = fs.readFileSync(new URL("../sicherungsblatt-aufgabe-5-loesungen.tex", import.meta.url), "utf8");
const decoding = fs.readFileSync(new URL("../../../../../lehrercodes-dekodierung.tex", import.meta.url), "utf8");

assert.match(html, /Aufgabe 3 – Die Haftreibungskraft als Zentripetalkraft/);
assert.match(html, /haftreibung-zentripetalkraft\.mjs\?v=20260920b/);
assert.equal((html.match(/data-physics-tab=/g) || []).length, 6);
assert.equal((html.match(/data-physics-panel=/g) || []).length, 6);
const eyebrows = [...html.matchAll(/<p class="eyebrow">([^<]+)<\/p>/g)].map((match) => match[1]).filter((text) => text !== "Kreisbewegungen · Aufgabe 3");
assert.deepEqual(eyebrows, ["Entdecken", "Verstehen", "Herleiten", "Anwenden", "Sichern", "Übertragen"]);
assert.deepEqual([...html.matchAll(/data-next-tab="([^"]+)"/g)].map((match) => match[1]), ["decomposition", "condition", "apply", "summary", "quiz"]);

assert.match(html, /id="side-force"/);
assert.match(html, /id="decomposition-animation"/);
assert.match(html, /id="decomp-start"/);
assert.match(html, /id="decomp-pause"/);
assert.match(html, /id="decomp-reset"/);
assert.match(html, /id="decomp-preview-force"/);
assert.match(html, /id="decomp-force" x1="320" y1="204" x2="448" y2="238"/);
assert.match(html, /id="decomp-guide-v" x1="448" y1="204" x2="448" y2="238"/);
assert.match(html, /id="decomp-normal" x1="320" y1="204" x2="320" y2="238"/);
assert.match(html, /id="decomp-side" x1="320" y1="204" x2="448" y2="204"/);
assert.doesNotMatch(html, /²\/r/);
assert.match(source, /createIndexedSymbol\("F", "N"\)/);
assert.match(source, /createIndexedSymbol\("F", "Haft"\).*createIndexedSymbol\("F", "S"\).*createIndexedSymbol\("F", "Haft,max"\)/s);
assert.match(source, /prefers-reduced-motion/);
assert.match(source, /MutationObserver/);
assert.match(source, /setupPhysicsSemanticTask/);
assert.match(source, /ph11-haftreibung-kurvenfahrt-gefahren/);
assert.match(source, /ph11-haftreibung-kurvenfahrt-massenunabhaengigkeit/);
assert.doesNotMatch(html, /F_ZP/);
assert.match(html, /F<sub>Haft,max<\/sub>/);
assert.match(html, /v<sub>B<\/sub>/);

assert.equal((html.match(/class="physics-semantic-task"/g) || []).length, 2);
assert.equal((html.match(/class="privacy-note"/g) || []).length, 2);
assert.equal((html.match(/class="physics-help-stack"/g) || []).length, 8);
assert.equal((html.match(/type="checkbox"/g) || []).length, 0, "Checkboxen werden erst dynamisch im Abschlussquiz erzeugt");
assert.match(source, /correct: \["role", "friction", "direction"\]/);
assert.match(source, /correct: \["speed", "radius", "mu"\]/);
assert.match(source, /correct: \["cannot", "slide", "kinetic", "smaller"\]/);
assert.match(source, /correct: \["flat", "normal", "radius", "mu"\]/);

assert.match(html, /solution-download-link-summary/);
assert.match(html, /name="solution-code"/);
assert.match(html, /unlockSolution\(event, 'R3KM-DQX8', 'solution-download-link-summary'/);
assert.match(html, /unlockSolution\(event, 'R3KM-DQX8', 'solution-download-link'/);
assert.match(html, /sicherungsblatt-aufgabe-5-loesungen\.pdf/);
assert.match(sheet, /Aufgabe 3 -- Die Haftreibungskraft/);
assert.match(sheet, /als Zentripetalkraft/);
assert.match(sheet, /F_\{\\mathrm\{Haft,max\}\}=\\mu/);
assert.match(decoding, /R3KM-DQX8/);

const task4Index = menu.indexOf("1-Kreisbewegungen/aufgabe4.html");
const task5Index = menu.indexOf("1-Kreisbewegungen/aufgabe5.html");
assert.ok(task4Index >= 0 && task5Index > task4Index, "aufgabe5.html muss nach aufgabe4.html im Menü stehen");
assert.match(menu, /<strong>Aufgabe 3<\/strong>\s*<span>Die Haftreibungskraft als Zentripetalkraft<\/span>/);
assert.match(css, /@media \(max-width: 620px\)/);
assert.match(css, /@media \(prefers-reduced-motion: reduce\)/);
assert.match(css, /\.download-button\[hidden\]/);

console.log("Haftreibungskraft: Seite, Animation, Freitextaufgaben, Quiz, Sicherungsblatt und Menü sind konfiguriert.");
