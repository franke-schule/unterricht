import assert from "node:assert/strict";
import fs from "node:fs";
import {
  NUMBER_TASKS,
  STEP_TASKS,
  evaluateCarouselForces,
  evaluateNumber,
  evaluateStepOrder,
  quizItems,
} from "../uebungen-zentripetalkraft.mjs";

const html = fs.readFileSync(new URL("../aufgabe7.html", import.meta.url), "utf8");
const script = fs.readFileSync(new URL("../uebungen-zentripetalkraft.mjs", import.meta.url), "utf8");
const menu = fs.readFileSync(new URL("../../index.html", import.meta.url), "utf8");

// ---- evaluateNumber ----

function evalTask(taskKey, raw, unit) {
  return evaluateNumber(raw, unit, NUMBER_TASKS[taskKey]);
}

assert.equal(evalTask("task1a", "1,91", "Hz").status, "success");
assert.equal(evalTask("task1a", "1,9129", "Hz").status, "partial");
assert.equal(evalTask("task1a", "115", "per-min").status, "success");
const task1aRounding = evalTask("task1a", "0,523", "s");
assert.equal(task1aRounding.status, "error");
assert.match(task1aRounding.text, /Umlaufdauer/);
const task1aRadius = evalTask("task1a", "3,26", "Hz");
assert.equal(task1aRadius.status, "error");
assert.match(task1aRadius.text, /Seillänge/);
const task1aWrongDigit = evalTask("task1a", "1,92", "Hz");
assert.doesNotMatch(task1aWrongDigit.text, /anderen Einheit/);

assert.equal(evalTask("task1b", "2150", "N").status, "success");
assert.equal(evalTask("task1b", "2,15", "kN").status, "success");
assert.equal(evalTask("task1b", "2151", "N").status, "partial");
const task1bSquare = evalTask("task1b", "86", "N");
assert.equal(task1bSquare.status, "error");
assert.match(task1bSquare.text, /Quadrat/);
assert.equal(evalTask("task1b", "2,15", "kg").status, "partial");

assert.equal(evalTask("task2", "12", "deg").status, "success");
assert.equal(evalTask("task2", "11,5", "deg").status, "partial");
const task2Kmh = evalTask("task2", "69", "deg");
assert.equal(task2Kmh.status, "error");
assert.match(task2Kmh.text, /km/);
const task2Dial = evalTask("task2", "0,20", "deg");
assert.equal(task2Dial.status, "partial");
assert.match(task2Dial.text, /DEG/);

assert.equal(evalTask("task3b", "13", "mps").status, "success");
assert.equal(evalTask("task3b", "48", "kmh").status, "success");
const task3bChain = evalTask("task3b", "15", "mps");
assert.equal(task3bChain.status, "error");
assert.match(task3bChain.text, /Kettenlänge/);
assert.equal(evalTask("task3b", "47", "kmh").status, "partial");

// ---- evaluateStepOrder ----

Object.entries(STEP_TASKS).forEach(([key, config]) => {
  config.acceptedOrders.forEach((order) => {
    assert.equal(evaluateStepOrder(order, config).status, "success", `${key}: akzeptierte Reihenfolge muss success ergeben`);
  });

  const withDistractor = new Array(config.n).fill(config.distractorIds[0]);
  const distractorResult = evaluateStepOrder(withDistractor, config);
  assert.ok(distractorResult.text.includes(config.distractorHint.slice(0, 20)), `${key}: Ablenkerkarte muss den distractorHint auslösen`);

  const empty = new Array(config.n).fill("");
  assert.equal(evaluateStepOrder(empty, config).status, "error");
});

// ---- evaluateCarouselForces ----

const CAROUSEL_SUCCESS_SELECTIONS = [
  { kind: "weight", direction: "down", dx: 0, dy: -3 },
  { kind: "rope", direction: "up-left", dx: -3, dy: 3 },
  { kind: "resultant", direction: "left", dx: -3, dy: 0 },
];
const successResult = evaluateCarouselForces(CAROUSEL_SUCCESS_SELECTIONS);
assert.equal(successResult.status, "success");
assert.doesNotMatch(successResult.text, /tan/);

const resultantRight = evaluateCarouselForces([{ kind: "resultant", direction: "right", dx: 3, dy: 0 }]);
assert.equal(resultantRight.status, "error");
assert.match(resultantRight.text, /Fliehkraft/);

const ropeUpThirdForce = evaluateCarouselForces([
  { kind: "rope", direction: "up", dx: 0, dy: 3 },
  { kind: "resultant", direction: "left", dx: -3, dy: 0 },
]);
assert.equal(ropeUpThirdForce.status, "error");
assert.match(ropeUpThirdForce.text, /dritte Kraft/);

// ---- quizItems ----

assert.equal(quizItems.length, 6);
assert.deepEqual(quizItems.map((item) => item.taskNumber), ["4a", "4b", "4c", "4d", "4e", "4f"]);
assert.ok(quizItems.filter((item) => item.correct.length >= 2).length >= 2, "mindestens zwei Fragen brauchen mehrere richtige Antworten");
assert.match(script, /input\.type = "checkbox"/);

// ---- HTML ----

assert.equal((html.match(/data-physics-tab=/g) || []).length, 4);
assert.equal((html.match(/data-physics-panel=/g) || []).length, 4);
assert.deepEqual(
  [...html.matchAll(/data-next-tab="([^"]+)"/g)].map((match) => match[1]),
  ["track", "carousel", "quiz"]
);

const panelQuizMatch = html.match(/<section id="panel-quiz"[\s\S]*<\/section>\s*<\/div>\s*<\/main>/);
assert.ok(panelQuizMatch, "panel-quiz nicht gefunden");
assert.match(panelQuizMatch[0], /href="\.\.\/index\.html"/);

[
  "task1a-answer", "task1a-unit", "check-task1a", "task1a-feedback",
  "task1a-steps", "check-task1a-steps", "reset-task1a-steps", "task1a-steps-feedback",
  "task1b-answer", "task1b-unit", "check-task1b", "task1b-feedback",
  "task1b-steps", "check-task1b-steps", "reset-task1b-steps", "task1b-steps-feedback",
  "task1c-solution",
  "task2-answer", "task2-unit", "check-task2", "task2-feedback",
  "task2-steps", "check-task2-steps", "reset-task2-steps", "task2-steps-feedback",
  "carousel-force-grid", "check-carousel-forces", "carousel-feedback",
  "task3b-answer", "task3b-unit", "check-task3b", "task3b-feedback",
  "task3b-steps", "check-task3b-steps", "reset-task3b-steps", "task3b-steps-feedback",
  "exercise-final-quiz",
  "summary-pending", "summary-content",
].forEach((id) => assert.match(html, new RegExp(`id="${id}"`), `Fehlendes Element #${id}`));

const feedbackIds = [
  "task1a-feedback", "task1a-steps-feedback", "task1b-feedback", "task1b-steps-feedback",
  "task2-feedback", "task2-steps-feedback", "carousel-feedback",
  "task3b-feedback", "task3b-steps-feedback",
];
feedbackIds.forEach((id) => {
  const match = html.match(new RegExp(`id="${id}"[^>]*`));
  assert.ok(match && /aria-live="polite"/.test(match[0]), `${id} braucht aria-live="polite"`);
});

assert.equal((html.match(/Ordne<\/strong> die Rechenschritte in die richtige Reihenfolge\./g) || []).length, 4);
assert.equal((html.match(/Bearbeite die Aufgabe auf einem Blatt oder auf dem Tablet\./g) || []).length, 1);

assert.doesNotMatch(html, /unlockSolution/);
assert.doesNotMatch(html, /solution-download/);
assert.doesNotMatch(html, /material\//);
assert.doesNotMatch(html, /\.tex/);
assert.doesNotMatch(html, /\.pdf/);

["<strong>Bestimme</strong>", "<strong>Gib</strong>", "<strong>Berechne</strong>", "<strong>Skizziere</strong>", "<strong>zeichne</strong>", "<strong>Zeichne</strong>", "<strong>Wähle</strong>", "<strong>Ordne</strong>"].forEach((needle) => assert.ok(html.includes(needle), `Fehlender Operator: ${needle}`));

// panel-track und panel-carousel: außerhalb von <details> kein "tan" (Formel-Vorwegnahme).
function withoutDetails(section) {
  return section.replace(/<details>[\s\S]*?<\/details>/g, "");
}
const panelTrack = html.match(/<section id="panel-track"[\s\S]*?<nav class="physics-step-next"[\s\S]*?<\/nav>\s*<\/section>/)[0];
const panelCarousel = html.match(/<section id="panel-carousel"[\s\S]*?<nav class="physics-step-next"[\s\S]*?<\/nav>\s*<\/section>/)[0];
assert.doesNotMatch(withoutDetails(panelTrack), /\btan\b/);
assert.doesNotMatch(withoutDetails(panelCarousel), /\btan\b/);
assert.doesNotMatch(withoutDetails(panelTrack), /√/);
assert.doesNotMatch(withoutDetails(panelCarousel), /√/);

// Rohtext-Indizes wie F_Z oder v_B dürfen im sichtbaren HTML nicht vorkommen (nur im JS-Modul als {{}}-Token).
assert.doesNotMatch(html, /F_Z|v_B|F_N|F_G|F_S/);

// Divisionen im Fließtext haben einen Bruchstrich; ein Schrägstrich ist nur in <option> erlaubt.
const optionless = html.replace(/<option[^>]*>[^<]*<\/option>/g, "");
["m/s", "km/h", "m/s²", "m²/s²", "1/s", "1/min", "v_B/", "F_Z/"].forEach((needle) => {
  assert.ok(!optionless.includes(needle), `Schrägstrich-Notation "${needle}" gehört nur in <option>-Texte`);
});

assert.match(html, /assets\/haftreibung-zentripetalkraft\/haftreibung-situation-hammerwurf\.webp/);
assert.ok(fs.existsSync(new URL("../assets/haftreibung-zentripetalkraft/haftreibung-situation-hammerwurf.webp", import.meta.url)), "Bild fehlt");

// ---- Menü ----

const menuIndexAufgabe6 = menu.indexOf("1-Kreisbewegungen/aufgabe6.html");
const menuIndexAufgabe7 = menu.indexOf("1-Kreisbewegungen/aufgabe7.html");
assert.ok(menuIndexAufgabe6 >= 0 && menuIndexAufgabe7 > menuIndexAufgabe6, "aufgabe6-Eintrag muss vor aufgabe7-Eintrag stehen");

console.log("Übungen zur Zentripetalkraft: Rückmeldelogik, Zuordnungen, Quiz, HTML und Menü sind konsistent konfiguriert.");
