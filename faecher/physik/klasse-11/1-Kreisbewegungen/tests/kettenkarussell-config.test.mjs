import assert from "node:assert/strict";
import fs from "node:fs";
import {
  CAROUSEL_ORIGIN,
  evaluateCarouselForces,
  evaluateCentripetalForce,
  isForceArrowPoint,
  quizItems,
} from "../kettenkarussell.mjs";
import { hitWedgePoints } from "../components/point-vector-grid.mjs";

const html = fs.readFileSync(new URL("../aufgabe6.html", import.meta.url), "utf8");
const script = fs.readFileSync(new URL("../kettenkarussell.mjs", import.meta.url), "utf8");
const css = fs.readFileSync(new URL("../kettenkarussell.css", import.meta.url), "utf8");
const grid = fs.readFileSync(new URL("../components/point-vector-grid.mjs", import.meta.url), "utf8");
const menu = fs.readFileSync(new URL("../../index.html", import.meta.url), "utf8");
const sheet = fs.readFileSync(new URL("../sicherungsblatt-aufgabe-6-loesungen.tex", import.meta.url), "utf8");
const decoding = fs.readFileSync(new URL("../../../../../lehrercodes-dekodierung.tex", import.meta.url), "utf8");

// ---- Geometrie ----

function selectablePoints(origin, xRange = { min: -3, max: 3 }) {
  const points = [];
  for (let x = xRange.min; x <= xRange.max; x += 1) {
    for (let y = -3; y <= 3; y += 1) {
      const point = { x, y };
      if (point.x === origin.x && point.y === origin.y) continue;
      if (isForceArrowPoint(point, origin)) points.push(point);
    }
  }
  return points;
}

function angleOf(point, origin) {
  return (Math.atan2(point.y - origin.y, point.x - origin.x) * 180) / Math.PI;
}

function angularDiff(a, b) {
  let diff = Math.abs(a - b) % 360;
  if (diff > 180) diff = 360 - diff;
  return diff;
}

[
  [CAROUSEL_ORIGIN, { min: -3, max: 3 }],
].forEach(([origin, xRange]) => {
  const points = selectablePoints(origin, xRange);
  assert.ok(points.length >= 8, `Zu wenige wählbare Punkte für Ursprung ${JSON.stringify(origin)}`);
  ["short", "long"].forEach((band) => {
    const bandPoints = points.filter((point) => {
      const length = Math.max(Math.abs(point.x - origin.x), Math.abs(point.y - origin.y));
      return band === "short" ? length <= 2 : length === 3;
    });
    for (let i = 0; i < bandPoints.length; i += 1) {
      for (let j = i + 1; j < bandPoints.length; j += 1) {
        const diff = angularDiff(angleOf(bandPoints[i], origin), angleOf(bandPoints[j], origin));
        assert.ok(diff >= 45 - 1e-9, `Winkelabstand zu klein bei Ursprung ${JSON.stringify(origin)}: ${JSON.stringify(bandPoints[i])} vs ${JSON.stringify(bandPoints[j])} (${diff}°)`);
      }
    }
    // Die Hitbox-Sektoren dürfen sich innerhalb einer Bandklasse ebenfalls nicht überlappen.
    bandPoints.forEach((point) => assert.equal(hitWedgePoints(point, origin).length, 6));
  });
});

assert.ok(
  selectablePoints(CAROUSEL_ORIGIN).some((point) => point.x - CAROUSEL_ORIGIN.x === -3 && point.y - CAROUSEL_ORIGIN.y === 3),
  "Der Relativpunkt (-3|3) muss für das Karussell wählbar sein."
);

// ---- Rückmeldelogik: evaluateCarouselForces ----

function selection(kind, dx, dy, origin) {
  return { kind, direction: null, x: origin.x + dx, y: origin.y + dy, dx, dy };
}

const carouselLongConsistent = [
  selection("weight", 0, -3, CAROUSEL_ORIGIN),
  selection("rope", -3, 3, CAROUSEL_ORIGIN),
  selection("resultant", -3, 0, CAROUSEL_ORIGIN),
].map((s) => ({ ...s, direction: s.dx === 0 ? (s.dy > 0 ? "up" : "down") : s.dy === 0 ? (s.dx > 0 ? "right" : "left") : `${s.dy > 0 ? "up" : "down"}-${s.dx > 0 ? "right" : "left"}` }));
assert.equal(evaluateCarouselForces(carouselLongConsistent).status, "success");

const carouselShortConsistent = carouselLongConsistent.map((s) => ({ ...s, dx: s.dx / 3, dy: s.dy / 3 }));
assert.equal(evaluateCarouselForces(carouselShortConsistent).status, "success");

const resultantRight = [{ kind: "resultant", direction: "right", dx: 3, dy: 0 }];
const resultantRightResult = evaluateCarouselForces(resultantRight);
assert.equal(resultantRightResult.status, "error");
assert.match(resultantRightResult.text, /Zentrifugalkraft/);

const ropeUp = [{ kind: "rope", direction: "up", dx: 0, dy: 3 }];
assert.equal(evaluateCarouselForces(ropeUp).status, "error");

const onlyWeight = [{ kind: "weight", direction: "down", dx: 0, dy: -3 }];
assert.equal(evaluateCarouselForces(onlyWeight).status, "partial");

const mixedLength = [
  { kind: "weight", direction: "down", dx: 0, dy: -3 },
  { kind: "rope", direction: "up-left", dx: -1, dy: 1 },
  { kind: "resultant", direction: "left", dx: -3, dy: 0 },
];
const mixedLengthResult = evaluateCarouselForces(mixedLength);
assert.equal(mixedLengthResult.status, "partial");
assert.match(mixedLengthResult.text, /zu kurz/);

// ---- Rückmeldelogik: evaluateCentripetalForce ----

assert.equal(evaluateCentripetalForce("340", "N").status, "success");
assert.equal(evaluateCentripetalForce("0,34", "kN").status, "success");
assert.equal(evaluateCentripetalForce("336", "N").status, "partial");
const wrong280 = evaluateCentripetalForce("280", "N");
assert.equal(wrong280.status, "error");
assert.match(wrong280.text, /Aufhängung/);
const wrong146 = evaluateCentripetalForce("146", "N");
assert.equal(wrong146.status, "error");
assert.match(wrong146.text, /Gondel/);
assert.equal(evaluateCentripetalForce("340", "kg").status, "partial");
assert.equal(evaluateCentripetalForce("340", "").status, "error");

// ---- Quiz ----

assert.equal(quizItems.length, 5);
assert.deepEqual(quizItems.map((item) => item.taskNumber), ["7a", "7b", "7c", "7d", "7e"]);
assert.ok(quizItems.filter((item) => item.correct.length >= 2).length >= 2);
assert.match(script, /input\.type = "checkbox"/);

// ---- HTML ----

assert.equal((html.match(/data-physics-tab=/g) || []).length, 5);
assert.equal((html.match(/data-physics-panel=/g) || []).length, 5);
assert.deepEqual(
  [...html.matchAll(/data-next-tab="([^"]+)"/g)].map((match) => match[1]),
  ["parallelogram", "describe", "summary", "quiz"]
);

[
  "check-direction-force", "direction-force-feedback", "check-direction-release", "direction-release-feedback",
  "force-answer", "force-unit", "check-force", "force-feedback",
  "parallelogram-cause-choice", "parallelogram-tan-choice",
  "omega-change-answer", "check-omega-change", "omega-change-feedback", "omega-change-count",
  "rows-answer", "check-rows", "rows-feedback", "rows-count",
  "summary-pending", "summary-content",
  "carousel-force-grid", "check-carousel-forces", "carousel-feedback",
  "carousel-final-quiz",
  "solution-code", "solution-code-summary",
  "solution-download-link", "solution-download-link-summary",
].forEach((id) => assert.match(html, new RegExp(`id="${id}"`), `Fehlendes Element #${id}`));

const feedbackIds = ["direction-force-feedback", "direction-release-feedback", "force-feedback", "carousel-feedback"];
feedbackIds.forEach((id) => {
  const match = html.match(new RegExp(`id="${id}"[^>]*`));
  assert.ok(match && /aria-live="polite"/.test(match[0]), `${id} braucht aria-live="polite"`);
});

assert.equal((html.match(/unlockSolution\(event, 'R7HZ-DWB4'/g) || []).length, 2);
assert.equal((html.match(/sicherungsblatt-aufgabe-6-loesungen\.pdf/g) || []).length, 2);
assert.equal((html.match(/name="solution-code"/g) || []).length, 2);

["<strong>Beschreibe</strong>", "<strong>Erläutere</strong>", "<strong>Berechne</strong>", "<strong>Zeichne</strong>"].forEach((needle) => assert.ok(html.includes(needle), `Fehlender Operator: ${needle}`));

assert.match(html, /Beschreibe<\/strong> die Veränderungen, die sich daraus ergeben, anhand des nebenstehenden Kräfteparallelogramms\./);
assert.match(html, /Erläutere<\/strong>, ob die Sitze gleich weit ausgelenkt werden\./);

assert.doesNotMatch(html, /Alle Sitze werden gleich weit ausgelenkt/i);
assert.doesNotMatch(html, /je schneller/i);
assert.doesNotMatch(html, /satellit/i);

// Antwortoptionen (Verständnis-Check und Abschlussquiz) enthalten keine Zentrifugalkraft.
assert.ok(quizItems.every((item) => item.options.every(([, text]) => !/zentrifugal/i.test(text))), "Quiz-Antwort mit Zentrifugalkraft");
// Rückmeldetexte ("error"/"partial"/"success") dürfen die Fehlvorstellung benennen, Antwortoptionen nicht.
assert.doesNotMatch(script, /\["(?!error"|partial"|success")[^"]+", "[^"]*Zentrifugal/);

// ---- Weitere Dateien ----

assert.match(grid, /arrowKinds/);
assert.match(grid, /force-arrow-grid-point/);
assert.doesNotMatch(grid, /hitRadius/);
assert.match(grid, /Die ganze gedachte Linie ist anklickbar/);
assert.match(grid, /const ARROW_HEAD_SIZE = 5;/);
assert.match(grid, /createMarker\(definitions, `\$\{svgId\}-first`, "#2563eb", ARROW_HEAD_SIZE\)/);

assert.doesNotMatch(sheet, /\\includegraphics/);
assert.doesNotMatch(sheet, /\\begin\{itemize\}/);

assert.match(decoding, /R7HZ-DWB4/);

const menuIndexAufgabe5 = menu.indexOf("1-Kreisbewegungen/aufgabe5.html");
const menuIndexAufgabe6 = menu.indexOf("1-Kreisbewegungen/aufgabe6.html");
assert.ok(menuIndexAufgabe5 >= 0 && menuIndexAufgabe6 > menuIndexAufgabe5, "aufgabe5-Eintrag muss vor aufgabe6-Eintrag stehen");

assert.match(css, /\.download-button\[hidden\]/);
assert.match(css, /\.force-kind-picker/);

console.log("Kettenkarussell: Geometrie, Rückmeldelogik, Quiz, HTML und Begleitdateien sind konsistent konfiguriert.");
