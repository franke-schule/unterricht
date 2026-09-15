import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync(new URL("../aufgabe4.html", import.meta.url), "utf8");
const source = fs.readFileSync(new URL("../zentripetalkraft.mjs", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../zentripetalkraft.css", import.meta.url), "utf8");
const menu = fs.readFileSync(new URL("../../index.html", import.meta.url), "utf8");
const kinematics = fs.readFileSync(new URL("../components/circle-kinematics.mjs", import.meta.url), "utf8");
const sheet = fs.readFileSync(new URL("../sicherungsblatt-aufgabe-4-loesungen.tex", import.meta.url), "utf8");
const decoding = fs.readFileSync(new URL("../../../../../lehrercodes-dekodierung.tex", import.meta.url), "utf8");

// Titel, Reiter und Eyebrow-Reihenfolge
assert.match(html, /Aufgabe 2 – Zentripetalkraft/);
assert.equal((html.match(/data-physics-tab=/g) || []).length, 6);
assert.equal((html.match(/data-physics-panel=/g) || []).length, 6);
const eyebrows = [...html.matchAll(/<p class="eyebrow">([^<]+)<\/p>/g)].map((match) => match[1]).filter((text) => text !== "Kreisbewegungen · Aufgabe 2");
assert.deepEqual(eyebrows, ["Entdecken", "Verstehen", "Verstehen", "Anwenden", "Sichern", "Übertragen"]);

// Simulationen
assert.match(html, /data-centripetal-simulation="explore"/);
assert.match(html, /data-centripetal-simulation="radius"/);
assert.ok((html.match(/F<sub>Z<\/sub>/g) || []).length >= 1);
assert.doesNotMatch(html, /F_ZP/);
assert.doesNotMatch(html, /ZP<\/sub>/);
assert.match(html, /cf-explore-force-arrow/);
assert.match(html, /cf-explore-speed-arrow/);
assert.match(html, /cf-radius-force-arrow/);
assert.match(html, /cf-radius-speed-arrow/);

// Download-Bereich nach dem Abschlussquiz im Panel "quiz"
assert.match(html, /data-physics-panel="quiz"[\s\S]*id="centripetal-quiz"[\s\S]*class="solution-download"/);
assert.match(html, /unlockSolution\(event, 'R6WF-DH7K', 'solution-download-link', 'solution-code-message'\)/);
assert.match(html, /href="sicherungsblatt-aufgabe-4-loesungen\.pdf\?v=20260915a" download hidden/);
assert.match(html, /maxlength="9"/);

// SVG-Koordinaten aus Aufgabe 5 (Vektordreieck), wörtlich wie spezifiziert
assert.match(html, /x1="599\.9" y1="75" x2="599\.9" y2="225" class="force-vector"/);
assert.match(html, /x1="470" y1="150" x2="599\.9" y2="75" class="speed-vector"/);

// Wortlaute (Stichproben)
assert.match(html, /<strong>Betrachte<\/strong> die beiden Skizzen\. <strong>Wähle<\/strong> alle Aussagen aus, die zur Bewegung der Hammerkugel passen\./);
assert.match(html, /<strong>Stelle<\/strong> ein, welche Größe gleich bleibt, und <strong>verdopple<\/strong> den Radius von 0,50 m auf 1,00 m\./);
assert.match(html, /Die Haftreibung kann bei diesem Auto \(m = 1200&nbsp;kg\) in der Kurve mit r = 40&nbsp;m höchstens 9,6&nbsp;kN als Zentripetalkraft liefern\./);
assert.match(html, /Bei Fragen mit dem Hinweis „mehrere Antworten“ sind mindestens zwei Antworten richtig\./);

// Quelltext
assert.match(source, /function unlockSolution\(event, expectedCode, downloadLinkId, messageId\)/);
assert.match(source, /window\.unlockSolution = unlockSolution/);
assert.match(source, /significantDigitCount/);
assert.match(source, /prefers-reduced-motion/);
assert.match(source, /MutationObserver/);
assert.match(source, /physicsTextSpan\(labelText, "quiz-option-text"\)/);
assert.match(source, /correct: \["four"\]/);
assert.match(source, /correct: \["omega", "speed"\]/);
assert.match(source, /correct: \["rope", "friction", "gravity"\]/);
assert.match(source, /expected: \["FZ", "m", "vB²", "r"\]/);
assert.match(source, /expected: \["FZ", "m", "ω²", "r"\]/);
assert.ok((source.match(/correct: \["[^"]+", "/g) || []).length >= 2, "mindestens zwei Fragen mit mehreren richtigen Antworten erwartet");

// CSS: responsive Regel vorhanden
assert.match(css, /@media \(max-width: 620px\)/);

// Menüeintrag: aufgabe3 vor aufgabe4, richtiger Text, letzter Eintrag
const aufgabe3Index = menu.indexOf("1-Kreisbewegungen/aufgabe3.html");
const aufgabe4Index = menu.indexOf("1-Kreisbewegungen/aufgabe4.html");
assert.ok(aufgabe3Index >= 0 && aufgabe4Index > aufgabe3Index, "aufgabe4.html muss nach aufgabe3.html im Menü stehen");
assert.match(menu, /<a class="module-button" href="1-Kreisbewegungen\/aufgabe4\.html">\s*<strong>Aufgabe 2<\/strong>\s*<span>Zentripetalkraft<\/span>/);

// circle-kinematics.mjs exportiert die neuen Funktionen
assert.match(kinematics, /export function centripetalForce/);
assert.match(kinematics, /export function centripetalForceFromSpeed/);

// TeX: Titel, keine Schrägstrich-Einheiten, Lehrercode in der Dekodierdatei
assert.match(sheet, /Aufgabe 2 -- Zentripetalkraft/);
assert.doesNotMatch(sheet, /m\/s|km\/h/);
assert.match(decoding, /R6WF-DH7K/);

console.log("Zentripetalkraft: Seite, Simulationen, Formelbaukasten, Quiz, Menü und Sicherungsblatt sind konfiguriert.");
