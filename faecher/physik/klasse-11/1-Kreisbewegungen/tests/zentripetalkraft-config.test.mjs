import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync(new URL("../aufgabe4.html", import.meta.url), "utf8");
const source = fs.readFileSync(new URL("../zentripetalkraft.mjs", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../zentripetalkraft.css", import.meta.url), "utf8");
const menu = fs.readFileSync(new URL("../../index.html", import.meta.url), "utf8");
const kinematics = fs.readFileSync(new URL("../components/circle-kinematics.mjs", import.meta.url), "utf8");
const stepTabsSource = fs.readFileSync(new URL("../components/physics-step-tabs.mjs", import.meta.url), "utf8");
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
assert.match(html, /data-centripetal-simulation="mini"/);
assert.ok((html.match(/F<sub>Z<\/sub>/g) || []).length >= 1);
assert.doesNotMatch(html, /F_ZP/);
assert.doesNotMatch(html, /ZP<\/sub>/);
assert.match(html, /cf-explore-force-arrow/);
assert.match(html, /cf-explore-speed-arrow/);
assert.match(html, /cf-radius-force-arrow/);
assert.match(html, /cf-radius-speed-arrow/);
assert.match(html, /cf-mini-force-arrow/);
assert.match(html, /cf-mini-speed-arrow/);

// Aufgabe 2b: Freitext-Lückentext ohne Wortvorgaben (ersetzt das frühere
// Multiple-Choice), Realexperiment-Anmerkung vollständig entfernt.
assert.doesNotMatch(html, /id="je-desto-quiz"/);
assert.doesNotMatch(html, /Im Unterricht: Hammerwurf mit Knetmasse/);
assert.match(html, /id="je-desto-mass-1"/);
assert.match(html, /id="je-desto-mass-2"/);
assert.match(html, /id="je-desto-omega-1"/);
assert.match(html, /id="je-desto-radius-1"/);
assert.equal((html.match(/class="cloze-text-input"/g) || []).length, 6);
assert.equal((html.match(/id="check-je-desto-(mass|omega|radius)"/g) || []).length, 3);

// Korrekturrunde: Buttonsystem wie in Aufgabe 1 (Winkelgeschwindigkeit,
// Simulation "angle") – genau zwei Buttons "Neustarten"/"Pausieren" statt
// "Bewegung starten"/"Zurücksetzen", einheitlich für alle drei Simulationen.
assert.equal((html.match(/data-cf-action="restart"/g) || []).length, 3);
assert.equal((html.match(/data-cf-action="pause"/g) || []).length, 3);
assert.doesNotMatch(html, /data-cf-action="start"/);
assert.doesNotMatch(html, /data-cf-action="reset"/);
assert.equal((html.match(/>Neustarten<\/button>/g) || []).length, 3);
assert.doesNotMatch(html, /Bewegung starten/);

// Aufgabe 2a und Mini-Simulation (Aufgabe 3): "Welche Größe veränderst du?"
// steht direkt bei den Reglern, jede Größe erscheint nur einmal (Radio und
// Regler in derselben Zeile statt getrennter Listen).
assert.equal((html.match(/class="cf-variable-fieldset"/g) || []).length, 2);
assert.equal((html.match(/class="cf-variable-row"/g) || []).length, 6);
assert.equal((html.match(/class="cf-variable-radio"/g) || []).length, 6);
assert.equal((html.match(/class="cf-variable-slider"/g) || []).length, 6);
assert.doesNotMatch(html, /<div class="simulation-controls">\s*<label>m in kg/);

// Korrekturrunde 2: Aufgabe 2a/4a stehen als EINE Spalte (Anleitung, Regler,
// Buttons, Anzeigewerte, Status) neben der Animation statt in einer eigenen
// vollbreiten Zeile darunter – das nutzt die Höhe neben der Animation aus.
assert.equal((html.match(/class="simulation-panel"/g) || []).length, 2);
assert.doesNotMatch(html, /class="simulation-aside"/);
assert.doesNotMatch(html, /class="simulation-info"/);
// Maßstab-Hinweis in Aufgabe 2a hinter <details>, Wortlaut unverändert.
assert.match(html, /<details class="simulation-scale-details">\s*<summary>Maßstab der Zeichnung<\/summary>/);
assert.match(html, /Darstellungsmaßstab: 1&nbsp;m Radius entspricht 220 SVG-Einheiten/);

// Weiter-Buttons am Ende jedes Reiterinhalts (außer im letzten Reiter "quiz")
assert.equal((html.match(/class="physics-step-next"/g) || []).length, 5);
assert.deepEqual(
  [...html.matchAll(/data-next-tab="([^"]+)"/g)].map((match) => match[1]),
  ["proportion", "derivation", "apply", "summary", "quiz"],
);

// Download-Bereich nach dem Abschlussquiz im Panel "quiz"
assert.match(html, /data-physics-panel="quiz"[\s\S]*id="centripetal-quiz"[\s\S]*class="solution-download"/);
assert.match(html, /unlockSolution\(event, 'R6WF-DH7K', 'solution-download-link', 'solution-code-message'\)/);
assert.match(html, /href="sicherungsblatt-aufgabe-4-loesungen\.pdf\?v=20260916a" download hidden/);
assert.match(html, /maxlength="9"/);

// Reiter 3 (Herleitung): neue Aufgaben 5-8 + "Für Schnelle", alte Aufgaben entfernt
assert.match(html, /id="formula-newton"/);
assert.match(html, /id="label-grid"/);
assert.match(html, /id="ratio-choice"/);
assert.match(html, /id="formula-delta-v"/);
assert.match(html, /id="role-quiz"/);
assert.match(html, /id="similarity-answer"/);
assert.equal((source.match(/setupPhysicsSemanticTask\(/g) || []).length, 3);
assert.match(source, /taskId: "ph11-zentripetalkraft-herleitung-dv"/);
assert.match(source, /taskId: "ph11-zentripetalkraft-herleitung-naeherung"/);
assert.match(source, /taskId: "ph11-zentripetalkraft-herleitung-aehnlichkeit"/);
const derivationPanel = html.match(/data-physics-panel="derivation"[\s\S]*?data-physics-panel="apply"/)[0];
assert.doesNotMatch(derivationPanel, /triangle-cloze/);
assert.doesNotMatch(derivationPanel, /id="ratio-quiz"/);
assert.doesNotMatch(derivationPanel, /φ/);
assert.match(html, /<h3 id="formula-newton-title">Aufgabe 5 · /);
assert.match(html, /<h3 id="step6-title">Aufgabe 6 · /);
assert.match(html, /<h3 id="ratio-delta-title">Aufgabe 7 · /);
assert.match(html, /<h3 id="formula-final-title">Aufgabe 8 · /);
assert.match(html, /Für Schnelle \(optional\) · Warum sind die Dreiecke ähnlich\?/);
assert.match(html, /<h3 id="role-title">Aufgabe 9 · /);
assert.match(html, /<h3 id="misconception-title">Aufgabe 10 · /);
assert.match(html, /<h3 id="task11-title">Aufgabe 11 · /);
assert.match(html, /<h3 id="task13-title">Aufgabe 13 · /);

// Aufgabe 3: mass vor radius vor omega
assert.match(source, /key: "mass"[\s\S]*?key: "radius"[\s\S]*?key: "omega"/);

// Aufgabe 9b und Aufgabe 10: neue Auswahllisten
assert.match(source, /correct: \["any", "several"\]/);
assert.match(source, /correct: \["too-small", "tangent"\]/);
assert.doesNotMatch(source, /"extra", "Auf das Auto/);
assert.doesNotMatch(source, /"no-extra"/);

// Aufgabe 11-13: <select> statt Radio-Fieldset
assert.match(html, /<select id="task11-unit"/);
assert.match(html, /<select id="task12-unit"/);
assert.match(html, /<select id="task13-unit"/);
assert.doesNotMatch(html, /name="task1[123]-unit"/);

// Pfeilmuster (B2): markerUnits/markerWidth wie spezifiziert, referenzierte Marker existieren
assert.match(css, /\.centripetal-figure--vectors \.speed-vector,\s*\n\.centripetal-figure--vectors \.force-vector \{\s*\n\s*stroke-width: 3;/);
[...html.matchAll(/<line[^>]*class="(?:speed-vector|force-vector)"[^>]*marker-end="url\(#([^)]+)\)"/g)]
  .forEach((match) => { assert.match(html, new RegExp(`<marker id="${match[1]}"`)); });
assert.match(html, /<marker id="reason-blue" markerUnits="userSpaceOnUse" markerWidth="12"/);
assert.match(html, /<marker id="deriv-blue" markerUnits="userSpaceOnUse" markerWidth="12"/);

// Skizze 1 (Aufgabe 6): keine Buchstaben-Beschriftung, aber vier nummerierte Badges
const sketch1 = html.slice(html.indexOf('id="step6-title"'), html.indexOf('Skizze 1 · Bewegung'));
assert.doesNotMatch(sketch1, />A<\/text>|>B<\/text>|>M<\/text>|>Δx<\/text>/);
assert.equal((html.match(/class="derivation-badge"/g) || []).length, 4);

// Wortlaute (Stichproben)
assert.match(html, /<strong>Betrachte<\/strong> die beiden Skizzen\. <strong>Wähle<\/strong> alle Aussagen aus, die zur Bewegung der Hammerkugel passen\./);
assert.match(html, /<strong>Stelle<\/strong> ein, welche Größe gleich bleibt, und <strong>verdopple<\/strong> den Radius von 0,50 m auf 1,00 m\./);
assert.match(html, /Die Haftreibung kann bei diesem Auto \(m = 1200&nbsp;kg\) in der Kurve mit r = 40&nbsp;m höchstens 9,6&nbsp;kN als Zentripetalkraft liefern\./);
assert.match(html, /Bei Fragen mit dem Hinweis „mehrere Antworten“ sind mindestens zwei Antworten richtig\./);

// Weiter-Buttons: physics-step-tabs-Mechanik wird verwendet, kein Reload
assert.match(source, /function setupNextTabButtons\(stepTabs\)/);
assert.match(source, /querySelectorAll\("\[data-next-tab\]"\)/);
assert.match(source, /stepTabs\.goToTab\(button\.dataset\.nextTab, true\)/);
assert.match(source, /const physicsStepTabs = setupPhysicsStepTabs\(\);/);

// Buttonsystem der Simulationen: restart()/pause() statt start()/reset()
assert.match(source, /function restart\(\)/);
assert.doesNotMatch(source, /data-cf-action="start"/);
assert.doesNotMatch(source, /data-cf-action="reset"/);
assert.doesNotMatch(source, /resetState/);

// Quelltext
assert.match(source, /function unlockSolution\(event, expectedCode, downloadLinkId, messageId\)/);
assert.match(source, /window\.unlockSolution = unlockSolution/);
assert.match(source, /significantDigitCount/);
assert.match(source, /prefers-reduced-motion/);
assert.match(source, /MutationObserver/);
assert.match(source, /physicsTextSpan\(labelText, "quiz-option-text"\)/);

// Prüflogik des 2b-Lückentexts (Toleranz: Groß-/Kleinschreibung, Leerzeichen,
// ASCII-Ersatzschreibweise "groesser" für "größer")
assert.match(source, /function normalizeGermanWord\(value\)/);
assert.match(source, /replace\(\/ö\/g, "oe"\)/);
assert.match(source, /function setupJeDestoCloze\(\)/);
assert.doesNotMatch(source, /setupJeDestoQuiz/);
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

// physics-step-tabs.mjs: rückwärtskompatible Erweiterung um goToTab, ohne
// aufgabe1.html–aufgabe3.html anzufassen (bestehendes Verhalten unverändert).
assert.match(stepTabsSource, /export function setupPhysicsStepTabs\(root = document\)/);
assert.match(stepTabsSource, /function goToTab\(id, moveFocus = true\)/);
assert.match(stepTabsSource, /return \{ goToTab, goToNextTab \};/);

// CSS: Animation größer (Vorgabe der Lehrkraft), Regler/Buttons dafür kompakter
assert.match(css, /width: min\(100%, 420px\)/);
assert.match(css, /\.cf-variable-fieldset/);
assert.match(css, /\.cf-variable-row/);
assert.match(css, /\.physics-step-next/);

// TeX: Titel, keine Schrägstrich-Einheiten, Lehrercode in der Dekodierdatei
assert.match(sheet, /Aufgabe 2 -- Zentripetalkraft/);
assert.doesNotMatch(sheet, /m\/s|km\/h/);
assert.match(decoding, /R6WF-DH7K/);

console.log("Zentripetalkraft: Seite, Simulationen, Formelbaukasten, Quiz, Menü und Sicherungsblatt sind konfiguriert.");
