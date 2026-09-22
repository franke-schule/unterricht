import { createForceArrowGrid } from "./components/point-vector-grid.mjs?v=20260922a";
import { appendPhysicsText, physicsTextSpan } from "./components/physics-notation.mjs?v=20260922b";
import { setupPhysicsStepTabs } from "./components/physics-step-tabs.mjs";
import { setupPhysicsSemanticTask } from "./components/physics-semantic-task.mjs";

const SCRIPT_SERVER_URL = "https://script.google.com/macros/s/AKfycby8RWL6uYrKZyoJ6m2GRpWyRmXjwsdskyCiqzKpRhIK5-wrDl-9lWWk8CiAGaVMoy0x/exec";

// ---- Unverändert aus haftreibung-zentripetalkraft.mjs / kraefte-bewegung.mjs übernommen ----

function unlockSolution(event, expectedCode, downloadLinkId, messageId) {
  event.preventDefault();
  const form = event.currentTarget;
  const enteredCode = form.elements["solution-code"].value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const normalizedExpectedCode = expectedCode.replace(/[^A-Z0-9]/g, "");
  const downloadLink = document.getElementById(downloadLinkId);
  const message = document.getElementById(messageId);

  if (enteredCode === normalizedExpectedCode) {
    downloadLink.hidden = false;
    message.className = "solution-code-message";
    message.textContent = "Code korrekt. Das Sicherungsblatt ist freigeschaltet.";
    return;
  }

  downloadLink.hidden = true;
  message.className = "solution-code-message error";
  message.textContent = "Der eingegebene Code ist nicht gültig.";
}

if (typeof document !== "undefined") window.unlockSolution = unlockSolution;

function numberValue(value) {
  return Number.parseFloat(String(value).trim().replace(/\s+/g, "").replace(",", "."));
}

function significantDigitCount(value) {
  const normalized = String(value).trim().replace(/\s+/g, "").replace(",", ".");
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(normalized)) return 0;
  const mantissa = normalized.replace(/^[+-]/, "").split(/e/i)[0];
  let digits = mantissa.replace(".", "").replace(/^0+/, "");
  if (!mantissa.includes(".")) digits = digits.replace(/0+$/, "");
  return digits.length;
}

function setFeedback(id, status, message) {
  const box = typeof id === "string" ? document.getElementById(id) : id;
  box.hidden = false;
  box.className = `physics-feedback ${status}`;
  box.replaceChildren();
  appendPhysicsText(box, message);
}

function setupNextTabButtons(stepTabs) {
  document.querySelectorAll("[data-next-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      stepTabs.goToTab(button.dataset.nextTab, true);
      document.querySelector(".physics-step-tabs")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    });
  });
}

function joinList(items) {
  if (items.length === 1) return items[0];
  return `${items.slice(0, -1).join(", ")} und ${items[items.length - 1]}`;
}

// ---- 5.1 renderMultipleChoice (Kopie aus kraefte-bewegung.mjs, drei Anpassungen) ----

function renderMultipleChoice({ targetId, taskNumber, question, options, correct, success, hint, optionHints = {} }) {
  const target = document.getElementById(targetId);
  const fieldset = document.createElement("fieldset");
  fieldset.className = "physics-quiz-question quiz-question";
  const legend = document.createElement("legend");
  appendPhysicsText(legend, `Aufgabe ${taskNumber} · ${question}${correct.length > 1 ? " (mehrere Antworten)" : ""}`);
  const optionWrap = document.createElement("div");
  optionWrap.className = "quiz-options";
  options.forEach(([value, labelText]) => {
    const label = document.createElement("label");
    label.className = "quiz-option";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.name = `${targetId}-answers`;
    input.value = value;
    input.addEventListener("change", () => { feedback.hidden = true; });
    label.append(input, physicsTextSpan(labelText, "quiz-option-text"));
    optionWrap.append(label);
  });
  const button = document.createElement("button");
  button.type = "button";
  button.className = "physics-primary-button direct-check-button";
  button.textContent = `Aufgabe ${taskNumber} prüfen`;
  const feedback = document.createElement("p");
  feedback.className = "physics-feedback";
  feedback.setAttribute("role", "status");
  feedback.setAttribute("aria-live", "polite");
  feedback.hidden = true;
  button.addEventListener("click", () => {
    const selected = [...fieldset.querySelectorAll("input:checked")].map((input) => input.value);
    const correctSelected = selected.filter((value) => correct.includes(value));
    const extras = selected.filter((value) => !correct.includes(value));
    const exact = selected.length === correct.length && selected.every((value) => correct.includes(value));
    const extraHint = extras.map((value) => optionHints[value]).find(Boolean);
    if (exact) setFeedback(feedback, "success", success);
    else if (correctSelected.length && !extras.length) setFeedback(feedback, "partial", `Teilweise korrekt: Mindestens eine richtige Aussage fehlt noch. ${hint}`);
    else if (!selected.length) setFeedback(feedback, "error", "Wähle mindestens eine Aussage aus und prüfe dann erneut.");
    else setFeedback(feedback, "error", `Noch nicht korrekt. ${extraHint || hint}`);
  });
  fieldset.append(legend, optionWrap, button, feedback);
  target.append(fieldset);
}

// ---- Aufgabe 1: Richtung der Kräfte (statische Radio-Fieldsets, je eigener Button) ----

function setupDirectionTasks() {
  const forceFeedback = {
    A: ["success", "Richtig. Die Zentripetalkraft zeigt immer zum Mittelpunkt der Kreisbahn, hier also zur Drehachse. Nur so wird die Bewegungsrichtung ständig zur Mitte hin umgelenkt."],
    B: ["error", "Noch nicht korrekt. Eine Kraft nach außen – oft „Zentrifugalkraft“ genannt – gibt es für einen Beobachter am Boden nicht. Das Drücken nach außen, das man spürt, ist die Trägheit des eigenen Körpers. Damit die Gondel auf der Kreisbahn bleibt, muss eine Kraft sie zur Mitte ziehen."],
    C: ["error", "Noch nicht korrekt. In diese Richtung zeigt die Geschwindigkeit, nicht die Zentripetalkraft. Eine Kraft in Bewegungsrichtung würde die Gondel schneller machen, aber nicht auf der Kreisbahn halten."],
    D: ["error", "Noch nicht korrekt. Eine Kraft entgegen der Bewegungsrichtung würde die Gondel abbremsen. Die Zentripetalkraft ändert nur die Richtung der Bewegung und zeigt deshalb zur Mitte der Kreisbahn."],
  };
  const releaseFeedback = {
    C: ["success", "Richtig. Ohne Kraft zur Mitte behalten Gondel und Person ihre momentane Bewegungsrichtung bei (Trägheitssatz). Von oben gesehen bewegen sie sich tangential geradlinig weiter – und fallen dabei zugleich nach unten."],
    B: ["error", "Noch nicht korrekt. Nichts zieht die Gondel nach außen. Nach dem Lösen wirkt keine Kraft mehr zur Mitte, deshalb behält sie ihre momentane Bewegungsrichtung bei – und die zeigt tangential zur Kreisbahn, nicht radial nach außen."],
    A: ["error", "Noch nicht korrekt. Zur Drehachse hin wurde die Gondel nur durch die Aufhängung gezogen. Löst sich die Aufhängung, fällt diese Kraft weg."],
    D: ["error", "Noch nicht korrekt. Die Gondel kehrt ihre Bewegungsrichtung nicht um. Ohne Kraft zur Mitte behält sie die Richtung bei, in die sie sich gerade bewegt."],
    circle: ["error", "Noch nicht korrekt. Auf einer Kreisbahn bleibt ein Körper nur, solange eine Kraft ihn zur Mitte zieht. Fehlt diese Kraft, bewegt er sich sofort geradlinig weiter."],
  };
  document.getElementById("check-direction-force").addEventListener("click", () => {
    const value = document.querySelector("input[name='direction-force']:checked")?.value;
    if (!value) { setFeedback("direction-force-feedback", "error", "Wähle zuerst eine Antwort aus."); return; }
    const [status, text] = forceFeedback[value];
    setFeedback("direction-force-feedback", status, text);
  });
  document.getElementById("check-direction-release").addEventListener("click", () => {
    const value = document.querySelector("input[name='direction-release']:checked")?.value;
    if (!value) { setFeedback("direction-release-feedback", "error", "Wähle zuerst eine Antwort aus."); return; }
    const [status, text] = releaseFeedback[value];
    setFeedback("direction-release-feedback", status, text);
  });
}

// ---- Aufgabe 2: Zentripetalkraft berechnen ----

const VALID_FORCE_UNITS = {
  N: { value: 340, tolerance: 0.5, exact: 336.29, exactTolerance: 3.36 },
  kN: { value: 0.34, tolerance: 0.0005, exact: 0.33629, exactTolerance: 0.00336 },
};

const FORCE_SUCCESS_TEXT = "Richtig. Zahlenwert, Einheit und die Anzahl der gültigen Ziffern stimmen. Mit m = 115 kg, ω = {{2π|T}} und r = 6,0 m gilt {{F_Z}} = m · ω² · r ≈ 336 N, mit zwei gültigen Ziffern also 340 N = 0,34 kN.";
const FORCE_ROUNDING_TEXT = "Dein Rechenwert ist grundsätzlich passend. Runde das Endergebnis noch auf die geforderte Anzahl gültiger Ziffern. Die Angaben 9,0 s und 6,0 m besitzen nur zwei gültige Ziffern.";
const FORCE_UNIT_MISMATCH_TEXT = "Prüfe deinen Zahlenwert, die Einheit und die Anzahl der gültigen Ziffern. Dein Zahlenwert passt zur anderen Einheit: 1 kN = 1 000 N.";
const FORCE_WRONG_UNIT_TEXT = "Prüfe deinen Zahlenwert, die Einheit und die Anzahl der gültigen Ziffern. Dein Zahlenwert passt, aber eine Kraft wird in N oder kN angegeben.";
const FORCE_GENERIC_ERROR_TEXT = "Noch nicht korrekt. Prüfe deinen Zahlenwert, die Einheit und die Anzahl der gültigen Ziffern. Setze m, ω = {{2π|T}} und r in {{F_Z}} = m · ω² · r ein.";

function matchesRelativeForce(value, unit, targetN) {
  const target = unit === "kN" ? targetN / 1000 : targetN;
  return Math.abs(value - target) <= target * 0.01;
}

const FORCE_WRONG_CHECKS = [
  { test: (value, unit) => matchesRelativeForce(value, unit, 280.24), text: "Noch nicht korrekt. Du hast den Abstand der Aufhängung verwendet – auf welchem Kreis bewegen sich Gondel und Person? Die Zentripetalkraft hält Gondel und Person auf ihrer eigenen Kreisbahn, und die liegt weiter außen als die Aufhängung." },
  { test: (value, unit) => matchesRelativeForce(value, unit, 146.22), text: "Noch nicht korrekt. Du hast nur die Masse der Gondel verwendet. Die Zentripetalkraft muss Gondel und Person gemeinsam auf der Kreisbahn halten, also zählen beide Massen." },
  { test: (value, unit) => matchesRelativeForce(value, unit, 190.09), text: "Noch nicht korrekt. Du hast nur die Masse der Person verwendet. Die Zentripetalkraft muss Gondel und Person gemeinsam auf der Kreisbahn halten, also zählen beide Massen." },
  { test: (value, unit) => matchesRelativeForce(value, unit, 481.71), text: "Noch nicht korrekt. Die Winkelgeschwindigkeit geht im Quadrat ein: {{F_Z}} = m · ω² · r." },
  { test: (value, unit) => matchesRelativeForce(value, unit, 8.52), text: "Noch nicht korrekt. Du hast mit {{1|T}} statt mit ω = {{2π|T}} gerechnet. Bei einer vollen Umdrehung überstreicht der Radius den Winkel 2π." },
];

// Reine Prüffunktion ohne DOM-Zugriff, siehe Spezifikation 5.3 der Aufgabe.
export function evaluateCentripetalForce(raw, unit) {
  if (!unit) return { status: "error", text: "Wähle eine Einheit aus." };
  const value = numberValue(raw);
  if (!Number.isFinite(value)) return { status: "error", text: "Gib einen Zahlenwert ein." };
  const digits = significantDigitCount(raw);

  const matchesWindow = (target) => Math.abs(value - target.value) <= target.tolerance || Math.abs(value - target.exact) <= target.exactTolerance;

  if (!(unit in VALID_FORCE_UNITS)) {
    const matchesSomeValidUnit = Object.values(VALID_FORCE_UNITS).some(matchesWindow);
    if (matchesSomeValidUnit) return { status: "partial", text: FORCE_WRONG_UNIT_TEXT };
    return { status: "error", text: FORCE_GENERIC_ERROR_TEXT };
  }

  const target = VALID_FORCE_UNITS[unit];
  const valueCorrect = Math.abs(value - target.value) <= target.tolerance;
  const exactUnrounded = Math.abs(value - target.exact) <= target.exactTolerance;

  if (valueCorrect && digits === 2) return { status: "success", text: FORCE_SUCCESS_TEXT };
  if ((valueCorrect || exactUnrounded) && digits !== 2) return { status: "partial", text: FORCE_ROUNDING_TEXT };

  const otherUnitKey = Object.keys(VALID_FORCE_UNITS).find((key) => key !== unit);
  if (matchesWindow(VALID_FORCE_UNITS[otherUnitKey])) return { status: "partial", text: FORCE_UNIT_MISMATCH_TEXT };

  const matchedWrong = FORCE_WRONG_CHECKS.find((check) => check.test(value, unit));
  if (matchedWrong) return { status: "error", text: matchedWrong.text };

  return { status: "error", text: FORCE_GENERIC_ERROR_TEXT };
}

function setupCentripetalForceTask() {
  document.getElementById("check-force").addEventListener("click", () => {
    const raw = document.getElementById("force-answer").value;
    const unit = document.getElementById("force-unit").value;
    const { status, text } = evaluateCentripetalForce(raw, unit);
    setFeedback("force-feedback", status, text);
  });
}

// ---- Geometrie für die Kraftraster (Aufgabe 6), siehe 5.2/5.3/5.4 ----

const ARROW_LENGTHS = [1, 3];

export function directionFromOrigin(point, origin = { x: 0, y: 0 }) {
  const x = point.x - origin.x;
  const y = point.y - origin.y;
  if (x === 0 && y === 0) return "other";
  const vertical = y > 0 ? "up" : y < 0 ? "down" : "";
  const horizontal = x > 0 ? "right" : "left";
  if (x === 0) return vertical;
  if (y === 0) return horizontal;
  return `${vertical}-${horizontal}`;
}

// Wählbar sind Punkte auf der Achse oder der 45°-Diagonale relativ zum
// aktiven Ursprung, mit |dx| bzw. |dy| aus ARROW_LENGTHS. Punkte außerhalb
// des Rasters entfallen automatisch über pointInRange in point-vector-grid.
export function isForceArrowPoint(point, origin = { x: 0, y: 0 }) {
  const dx = Math.abs(point.x - origin.x);
  const dy = Math.abs(point.y - origin.y);
  if (dx === 0) return ARROW_LENGTHS.includes(dy);
  if (dy === 0) return ARROW_LENGTHS.includes(dx);
  return dx === dy && ARROW_LENGTHS.includes(dx);
}

export const CAROUSEL_ORIGIN = { x: 1, y: 0 };
// ---- Aufgabe 6: Kräfte am Kettenkarussell ----

function drawCarousel(layer, { toSvgPoint, svgElement }) {
  const bodyPoint = toSvgPoint(CAROUSEL_ORIGIN);
  const anchor = toSvgPoint({ x: -2.45, y: 3.45 });

  layer.append(svgElement("line", { x1: anchor.x, y1: 10, x2: anchor.x, y2: 430, class: "carousel-axis" }));
  const axisLabel = svgElement("text", { x: anchor.x + 8, y: 424, "text-anchor": "start", class: "svg-label" });
  axisLabel.textContent = "Drehachse";
  layer.append(axisLabel);

  layer.append(svgElement("path", { d: `M ${anchor.x - 14} ${anchor.y + 8} L ${anchor.x} ${anchor.y - 10} L ${anchor.x + 14} ${anchor.y + 8} Z`, class: "scene-fill" }));
  layer.append(svgElement("line", { x1: anchor.x, y1: anchor.y, x2: bodyPoint.x, y2: bodyPoint.y, class: "scene-line carousel-chain" }));

  layer.append(svgElement("path", { d: "M 97.9 52.2 A 30 30 0 0 0 123.3 38.2", class: "angle-arc" }));
  const alphaLabel = svgElement("text", { x: 106, y: 92, class: "svg-label" });
  alphaLabel.textContent = "α = 56°";
  layer.append(alphaLabel);

  layer.append(svgElement("ellipse", { cx: anchor.x, cy: bodyPoint.y, rx: bodyPoint.x - anchor.x, ry: 30, class: "orbit", style: "stroke-width:2" }));

  layer.append(svgElement("rect", {
    x: bodyPoint.x - 14, y: bodyPoint.y + 6, width: 28, height: 18, rx: 6,
    class: "scene-fill", transform: `rotate(-57.7 ${bodyPoint.x} ${bodyPoint.y})`,
  }));
  layer.append(svgElement("circle", {
    cx: bodyPoint.x, cy: bodyPoint.y - 4, r: 9, class: "scene-accent",
    transform: `rotate(-57.7 ${bodyPoint.x} ${bodyPoint.y})`,
  }));

  layer.append(svgElement("circle", { cx: bodyPoint.x, cy: bodyPoint.y, r: 6, class: "force-origin-marker" }));
}

export function evaluateCarouselForces(selections) {
  const weight = selections.find((selection) => selection.kind === "weight");
  const rope = selections.find((selection) => selection.kind === "rope");
  const resultant = selections.find((selection) => selection.kind === "resultant");

  if (!selections.length) return { status: "error", text: "Es fehlen alle drei Kraftpfeile. Wähle oben eine Kraft aus und klicke dann vom markierten Körperschwerpunkt aus in ihre Richtung." };

  if (resultant && resultant.direction === "right") return { status: "error", text: "Noch nicht korrekt. Eine Kraft nach außen – oft „Zentrifugalkraft“ genannt – gibt es für einen Beobachter am Boden nicht. Die Resultierende aus Seilkraft und Gewichtskraft zeigt waagerecht zur Drehachse – sie ist die Zentripetalkraft, die den Mann auf der Kreisbahn hält." };

  if (weight && weight.direction !== "down") return { status: "error", text: "Noch nicht korrekt. Die Gewichtskraft zeigt immer senkrecht nach unten zum Erdmittelpunkt – unabhängig davon, wie schnell sich das Karussell dreht." };

  if (rope && rope.direction !== "up-left") {
    if (rope.direction === "up") return { status: "error", text: "Noch nicht korrekt. Die Kette hängt schräg. Ein Seil kann nur entlang seiner eigenen Richtung ziehen – die Seilkraft zeigt deshalb entlang der Kette zum Aufhängepunkt, nicht senkrecht nach oben." };
    if (rope.direction === "down-right") return { status: "error", text: "Noch nicht korrekt. Eine Kette kann nur ziehen, nicht drücken: {{F_S}} zeigt vom Körperschwerpunkt weg zum Aufhängepunkt." };
    return { status: "error", text: "Noch nicht korrekt. Die Seilkraft wirkt entlang der Kette und zeigt vom Körperschwerpunkt zum Aufhängepunkt." };
  }

  if (resultant && resultant.direction !== "left" && resultant.direction !== "right") {
    if (resultant.direction === "up-left") return { status: "error", text: "Noch nicht korrekt. Die Resultierende ist nicht die Seilkraft selbst. Sie ist die Diagonale des Parallelogramms aus {{F_S}} und {{F_G}} und zeigt waagerecht zur Drehachse." };
    return { status: "error", text: "Noch nicht korrekt. Die Resultierende muss waagerecht zur Drehachse zeigen: Der Mann bewegt sich auf einer waagerechten Kreisbahn, deren Mittelpunkt auf der Drehachse liegt." };
  }

  const missingLabels = [];
  if (!weight) missingLabels.push("die Gewichtskraft {{F_G}}");
  if (!rope) missingLabels.push("die Seilkraft {{F_S}}");
  if (!resultant) missingLabels.push("die Resultierende {{F_Z}}");
  if (missingLabels.length) return { status: "partial", text: `Teilweise korrekt. Die bisher eingezeichneten Pfeile zeigen in die richtige Richtung. Es fehlt noch ${joinList(missingLabels)}.` };

  const ropeLength = Math.max(Math.abs(rope.dx), Math.abs(rope.dy));
  const weightLength = Math.max(Math.abs(weight.dx), Math.abs(weight.dy));
  const resultantLength = Math.max(Math.abs(resultant.dx), Math.abs(resultant.dy));

  if (ropeLength !== weightLength) {
    if (ropeLength < weightLength) return { status: "partial", text: "Teilweise korrekt. Die Seilkraft ist zu kurz: Ihr senkrechter Anteil ist kleiner als die Gewichtskraft. Die Resultierende würde dann schräg nach unten zeigen, und der Mann würde nach unten beschleunigt. Wähle {{F_S}} so lang, dass ihr senkrechter Anteil {{F_G}} genau ausgleicht." };
    return { status: "partial", text: "Teilweise korrekt. Die Seilkraft ist zu lang: Ihr senkrechter Anteil ist größer als die Gewichtskraft. Die Resultierende würde dann schräg nach oben zeigen. Wähle {{F_S}} so lang, dass ihr senkrechter Anteil {{F_G}} genau ausgleicht." };
  }

  if (resultantLength !== ropeLength) {
    const word = resultantLength < ropeLength ? "kurz" : "lang";
    return { status: "partial", text: `Teilweise korrekt. {{F_G}} und {{F_S}} passen zusammen. Die Resultierende ist aber zu ${word}: Sie reicht vom Körperschwerpunkt bis zur gegenüberliegenden Ecke des Kräfteparallelogramms aus {{F_S}} und {{F_G}}.` };
  }

  return { status: "success", text: "Korrekt: {{F_S}} und {{F_G}} ergeben zusammen eine waagerechte Resultierende, die zur Drehachse zeigt. Sie wirkt als Zentripetalkraft {{F_Z}}. Mit {{F_G}} = m · g ≈ 0,74 kN gilt {{F_Z}} = {{F_G}} · tan 56° ≈ 1,1 kN und {{F_S}} = {{F_G|cos 56°}} ≈ 1,3 kN." };
}

function setupCarouselForcesTask() {
  const grid = createForceArrowGrid(document.getElementById("carousel-force-grid"), {
    xRange: { min: -3, max: 3 },
    yRange: { min: -3, max: 3 },
    origin: CAROUSEL_ORIGIN,
    isSelectablePoint: isForceArrowPoint,
    directionKey: directionFromOrigin,
    renderIllustration: drawCarousel,
    label: "Kettenkarussell: Kraftpfeile am Körperschwerpunkt des Mannes",
    kindLegend: "Welche Kraft zeichnest du?",
    arrowKinds: [
      { id: "weight", symbol: "F", index: "G", name: "Gewichtskraft", color: "#b45309" },
      { id: "rope", symbol: "F", index: "S", name: "Seilkraft", color: "#2563eb" },
      { id: "resultant", symbol: "F", index: "Z", name: "Resultierende", color: "#dc2626" },
    ],
  });
  document.getElementById("check-carousel-forces").addEventListener("click", () => {
    const { status, text } = evaluateCarouselForces(grid.getSelections());
    setFeedback("carousel-feedback", status, text);
  });
}

// ---- Aufgabe 4 und 5: Freitext über physics-semantic-task ----

function semanticFeedbackParagraph(text) {
  const paragraph = document.createElement("p");
  appendPhysicsText(paragraph, text);
  return paragraph;
}

function omegaChangeFeedback(result) {
  const fragment = document.createDocumentFragment();
  if (result.context === "server-error") {
    fragment.append(semanticFeedbackParagraph("Zum Vergleich: Bei größerem ω ist eine größere Zentripetalkraft nötig ({{F_Z}} = m · ω² · r). Weil {{F_G}} gleich bleibt, muss die Kette weiter ausschwenken: α wird größer, damit auch der Radius r. Die Seilkraft {{F_S}} wird größer. Masse, Gewichtskraft und Kettenlänge bleiben unverändert. Deine eingegebene Antwort bleibt erhalten."));
  } else if (result.status === "korrekt") {
    fragment.append(semanticFeedbackParagraph("Richtig: Mit ω wächst die nötige Zentripetalkraft. Da {{F_G}} gleich bleibt, wird das Kräfteparallelogramm breiter: α, r und {{F_S}} nehmen zu, m, {{F_G}} und die Kettenlänge bleiben gleich."));
  } else if (result.points > 0) {
    fragment.append(semanticFeedbackParagraph("Teilweise richtig. Vergleiche in beiden Parallelogrammen jede Kraft einzeln: Welche wird länger, welche bleibt gleich – und was folgt daraus für α und r?"));
  } else {
    fragment.append(semanticFeedbackParagraph("Noch nicht richtig. Beginne bei {{F_Z}} = m · ω² · r: Was bedeutet ein größeres ω für die nötige Zentripetalkraft? Vergleiche dann die beiden Parallelogramme."));
  }
  return fragment;
}

function rowsFeedback(result) {
  const fragment = document.createDocumentFragment();
  if (result.context === "server-error") {
    fragment.append(semanticFeedbackParagraph("Zum Vergleich: Beide Reihen drehen sich mit derselben Winkelgeschwindigkeit ω. Die äußere Reihe bewegt sich auf einem größeren Radius r. Nach tan α = {{ω² · r|g}} werden die äußeren Sitze deshalb stärker ausgelenkt. Die Masse der Personen spielt keine Rolle, weil sie sich kürzt. Deine eingegebene Antwort bleibt erhalten."));
    return fragment;
  }
  if (result.status === "korrekt") {
    fragment.append(semanticFeedbackParagraph("Richtig: Bei gleichem ω hängt tan α = {{ω² · r|g}} nur noch vom Radius ab. Die äußere Reihe hat den größeren Radius und wird deshalb stärker ausgelenkt – unabhängig von der Besetzung."));
    return fragment;
  }
  if (result.points > 0) {
    fragment.append(semanticFeedbackParagraph("Teilweise richtig. Vergleiche die beiden Reihen Größe für Größe in tan α = {{ω² · r|g}}: Was ist für beide gleich, was ist verschieden?"));
  } else {
    fragment.append(semanticFeedbackParagraph("Noch nicht richtig. Prüfe, welche Größen in tan α = {{ω² · r|g}} für die innere und die äußere Reihe gleich sind und welche nicht."));
  }
  const note = document.createElement("p");
  note.className = "physics-semantic-note";
  appendPhysicsText(note, "**Typischer Denkfehler: „Weil sich die Masse kürzt, werden alle Sitze gleich weit ausgelenkt.“ Die Masse kürzt sich zwar – prüfe aber, ob auch alle anderen Größen in tan α = {{ω² · r|g}} für beide Reihen gleich sind.**");
  fragment.append(note);
  return fragment;
}

function setupOmegaChangeTask() {
  setupPhysicsSemanticTask({
    answerId: "omega-change-answer", buttonId: "check-omega-change", feedbackId: "omega-change-feedback", countId: "omega-change-count",
    taskId: "ph11-kettenkarussell-winkelgeschwindigkeit", serverUrl: SCRIPT_SERVER_URL, feedbackBuilder: omegaChangeFeedback,
    minimumLength: 30, fallbackMaxPoints: 5, shortAnswerHint: "Formuliere eine etwas ausführlichere Beschreibung der Veränderungen im Kräfteparallelogramm.",
  });
}

function setupRowsTask() {
  setupPhysicsSemanticTask({
    answerId: "rows-answer", buttonId: "check-rows", feedbackId: "rows-feedback", countId: "rows-count",
    taskId: "ph11-kettenkarussell-zwei-sitzreihen", serverUrl: SCRIPT_SERVER_URL, feedbackBuilder: rowsFeedback,
    minimumLength: 30, fallbackMaxPoints: 4, shortAnswerHint: "Formuliere eine etwas ausführlichere Erläuterung mit Begründung.",
  });
  // Ein Klick auf "prüfen" schaltet die Auswertung frei, unabhängig vom Ergebnis.
  document.getElementById("check-rows").addEventListener("click", () => {
    document.getElementById("summary-pending").hidden = true;
    document.getElementById("summary-content").hidden = false;
  });
}

// ---- Aufgabe 7: Abschlussquiz ----

export const quizItems = [
  {
    taskNumber: "7a", question: "Welche Aussagen zur Zentripetalkraft beim Kettenkarussell sind richtig?", correct: ["resultant", "horizontal"],
    options: [
      ["resultant", "Sie ist die Resultierende aus Seilkraft und Gewichtskraft."],
      ["horizontal", "Sie zeigt waagerecht zur Drehachse."],
      ["chain", "Sie wird allein von der Kette übertragen und zeigt entlang der Kette."],
      ["slower", "Sie wird kleiner, wenn sich das Karussell schneller dreht."],
      ["extra", "Sie wirkt als dritte Kraft zusätzlich zu Seilkraft und Gewichtskraft."],
    ],
    success: "Korrekt: Seilkraft und Gewichtskraft addieren sich zu einer waagerechten Resultierenden, die zur Drehachse zeigt und als Zentripetalkraft wirkt.",
    hint: "Stell dir das Kräfteparallelogramm aus {{F_S}} und {{F_G}} vor.",
    optionHints: {
      chain: "Die Kette zieht schräg nach oben. Erst zusammen mit der Gewichtskraft entsteht eine waagerechte Resultierende.",
      slower: "Nach {{F_Z}} = m · ω² · r ist bei größerem ω eine größere Zentripetalkraft nötig, nicht eine kleinere.",
      extra: "Die Zentripetalkraft ist keine dritte Kraft, sondern die Rolle der Resultierenden aus {{F_S}} und {{F_G}}.",
    },
  },
  {
    taskNumber: "7b", question: "Das Karussell dreht sich schneller. Welche Größen werden größer?", correct: ["fz", "alpha", "fs", "r"],
    options: [
      ["fz", "die Zentripetalkraft {{F_Z}}"],
      ["alpha", "der Winkel α"],
      ["fs", "die Seilkraft {{F_S}}"],
      ["r", "der Radius r"],
      ["fg", "die Gewichtskraft {{F_G}}"],
      ["length", "die Kettenlänge"],
    ],
    success: "Korrekt: Bei größerem ω ist eine größere Zentripetalkraft nötig. Die Kette schwenkt weiter aus, dadurch wachsen α, r und {{F_S}}. {{F_G}} und die Kettenlänge bleiben gleich.",
    hint: "Überlege, welche Größen vom Drehen abhängen und welche nicht.",
    optionHints: {
      fg: "Die Gewichtskraft hängt nur von Masse und Ortsfaktor ab. Beides ändert sich beim schnelleren Drehen nicht.",
      length: "Die Kette wird nicht länger, sie schwenkt nur weiter nach außen.",
    },
  },
  {
    taskNumber: "7c", question: "Welche Aussagen zum Auslenkwinkel α sind richtig?", correct: ["outer", "mass"],
    options: [
      ["outer", "Bei gleichem ω werden Sitze mit größerem Radius stärker ausgelenkt."],
      ["mass", "Die Masse der Person hat keinen Einfluss auf α."],
      ["equal", "Alle Sitze eines Karussells werden immer gleich weit ausgelenkt."],
      ["heavy", "Schwere Personen werden stärker ausgelenkt als leichte."],
      ["inner", "Die innere Sitzreihe wird stärker ausgelenkt als die äußere."],
    ],
    success: "Korrekt: Nach tan α = {{ω² · r|g}} hängt α bei gleichem ω nur vom Radius ab. Die Masse kürzt sich.",
    hint: "Lies die Abhängigkeiten aus tan α = {{ω² · r|g}} ab.",
    optionHints: {
      equal: "Das gilt nur für Sitze mit gleichem Radius. Die Masse kürzt sich zwar, der Radius r in tan α = {{ω² · r|g}} aber nicht.",
      heavy: "Die Masse kürzt sich: {{F_Z}} und {{F_G}} wachsen beide proportional zu m.",
      inner: "Die innere Reihe hat den kleineren Radius. Bei gleichem ω ist tan α dort kleiner.",
    },
  },
  {
    taskNumber: "7d", question: "Bei einem Karussell löst sich plötzlich die Aufhängung einer Gondel. Welche Aussagen sind richtig?", correct: ["tangent", "inertia"],
    options: [
      ["tangent", "Von oben gesehen bewegt sich die Gondel tangential geradlinig weiter."],
      ["inertia", "Ohne Zentripetalkraft wird die Gondel nicht mehr zur Mitte umgelenkt."],
      ["radial", "Die Gondel fliegt radial nach außen, von der Drehachse weg."],
      ["circle", "Die Gondel bewegt sich zunächst noch ein Stück auf der Kreisbahn weiter."],
      ["center", "Die Gondel bewegt sich zur Drehachse hin."],
    ],
    success: "Korrekt: Ohne Zentripetalkraft wird die Gondel nicht mehr zur Mitte umgelenkt. Nach dem Trägheitssatz bewegt sie sich von oben gesehen tangential geradlinig in ihrer momentanen Bewegungsrichtung weiter.",
    hint: "Denke an den Trägheitssatz: Was geschieht mit der momentanen Bewegungsrichtung, wenn keine Kraft mehr zur Mitte wirkt?",
    optionHints: {
      radial: "Nach außen zieht keine Kraft. Die Gondel behält ihre momentane Bewegungsrichtung bei, und die zeigt tangential zur Kreisbahn.",
      circle: "Für jede noch so kurze Kreisbewegung ist eine Kraft zur Mitte nötig. Sobald sie fehlt, verläuft die Bahn von oben gesehen sofort geradlinig.",
      center: "Die Zentripetalkraft zeigt zwar zur Drehachse, sie fehlt aber nach dem Lösen. Ohne sie gibt es keinen Grund für eine Bewegung zur Mitte.",
    },
  },
  {
    taskNumber: "7e", question: "Ein Karussell braucht für eine Umdrehung die Zeit T. Welche Formeln liefern die Zentripetalkraft auf eine Person der Masse m im Abstand r von der Drehachse?", correct: ["omega", "fourpi"],
    options: [
      ["omega", "{{F_Z}} = m · ({{2π|T}})² · r"],
      ["fourpi", "{{F_Z}} = {{4π² · m · r|T²}}"],
      ["noSquare", "{{F_Z}} = m · {{2π|T}} · r"],
      ["inverse", "{{F_Z}} = {{m · T²|r}}"],
    ],
    success: "Korrekt: Mit ω = {{2π|T}} folgt {{F_Z}} = m · ω² · r = {{4π² · m · r|T²}}.",
    hint: "Ersetze in {{F_Z}} = m · ω² · r die Winkelgeschwindigkeit durch ω = {{2π|T}}.",
    optionHints: {
      noSquare: "ω geht im Quadrat ein: {{F_Z}} = m · ω² · r.",
      inverse: "Masse und Radius gehören in den Zähler, die Umlaufdauer als T² in den Nenner.",
    },
  },
];

function setupFinalQuiz() {
  quizItems.forEach((item) => renderMultipleChoice({ targetId: "carousel-final-quiz", ...item }));
}

// ---- Initialisierung nur im Browser ----

if (typeof document !== "undefined") {
  const stepTabs = setupPhysicsStepTabs();
  setupNextTabButtons(stepTabs);
  setupDirectionTasks();
  setupCentripetalForceTask();
  renderMultipleChoice({
    targetId: "parallelogram-cause-choice", taskNumber: "3a", question: "Welche Aussagen zur Zentripetalkraft beim Kettenkarussell sind richtig?", correct: ["ok1", "ok2"],
    options: [
      ["ok1", "Die Zentripetalkraft ist die Resultierende aus Seilkraft {{F_S}} und Gewichtskraft {{F_G}}."],
      ["ok2", "Die resultierende Kraft zeigt waagerecht zur Drehachse."],
      ["extra", "Neben {{F_S}} und {{F_G}} wirkt zusätzlich eine eigene Zentripetalkraft."],
      ["ropeOnly", "Die Seilkraft {{F_S}} allein wirkt als Zentripetalkraft."],
      ["vertical", "Die Seilkraft zeigt senkrecht nach oben."],
    ],
    success: "Korrekt: {{F_S}} und {{F_G}} addieren sich vektoriell zu einer waagerechten Resultierenden. Sie zeigt zur Drehachse und wirkt als Zentripetalkraft.",
    hint: "Überlege, welche Kräfte am Schwerpunkt tatsächlich angreifen und in welche Richtung ihre Summe zeigt.",
    optionHints: {
      extra: "Die Zentripetalkraft ist keine dritte Kraft. Sie ist der Name für die Rolle, die die Resultierende aus {{F_S}} und {{F_G}} übernimmt – würdest du sie zusätzlich einzeichnen, wäre sie doppelt gezählt.",
      ropeOnly: "{{F_S}} zeigt schräg nach oben zum Aufhängepunkt, nicht waagerecht zur Drehachse. Erst zusammen mit {{F_G}} ergibt sich eine waagerechte Resultierende – sie wirkt als Zentripetalkraft.",
      vertical: "Die Kette hängt schräg, und ein Seil zieht immer entlang seiner Richtung. Deshalb zeigt {{F_S}} schräg nach oben zum Aufhängepunkt.",
    },
  });
  renderMultipleChoice({
    targetId: "parallelogram-tan-choice", taskNumber: "3b", question: "Welche Aussagen folgen aus tan α = {{F_Z|F_G}} = {{ω² · r|g}}?", correct: ["cancel", "ratio", "samerow"],
    options: [
      ["cancel", "Die Masse m kürzt sich, weil sowohl {{F_Z}} als auch {{F_G}} proportional zu m sind."],
      ["ratio", "tan α ist das Verhältnis von {{F_Z}} zu {{F_G}}."],
      ["samerow", "Zwei Gondeln in derselben Reihe werden gleich weit ausgelenkt, auch wenn nur eine davon besetzt ist."],
      ["heavy", "Eine schwerere Person wird stärker ausgelenkt, weil auf sie eine größere Gewichtskraft wirkt."],
      ["light", "Eine leichtere Person wird stärker ausgelenkt, weil sie leichter nach außen fliegt."],
    ],
    success: "Korrekt: {{F_Z}} = m · ω² · r und {{F_G}} = m · g enthalten beide die Masse. Im Verhältnis kürzt sie sich, deshalb hängt α nicht von der Besetzung ab.",
    hint: "Setze {{F_Z}} = m · ω² · r und {{F_G}} = m · g in tan α = {{F_Z|F_G}} ein und kürze.",
    optionHints: {
      heavy: "Auf eine schwerere Person wirkt zwar eine größere Gewichtskraft, sie braucht aber im gleichen Verhältnis auch eine größere Zentripetalkraft. Im Verhältnis {{F_Z|F_G}} kürzt sich m.",
      light: "Leichter heißt nicht „fliegt weiter nach außen“: Gewichtskraft und nötige Zentripetalkraft sind beide proportional zu m, das Verhältnis bleibt gleich.",
    },
  });
  setupOmegaChangeTask();
  setupRowsTask();
  setupCarouselForcesTask();
  setupFinalQuiz();
}
