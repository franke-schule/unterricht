import { createForceArrowGrid } from "./components/point-vector-grid.mjs?v=20260922a";
import { appendPhysicsText, physicsTextSpan, createIndexedSymbol, createQuotient, createSquareRoot, createUnitFraction, addSquareRootSigns } from "./components/physics-notation.mjs?v=20260922b";
import { setupPhysicsStepTabs } from "./components/physics-step-tabs.mjs";
import { enableTokenDrag, wasDragged } from "./components/token-drag.mjs";

// ---- Unverändert aus kettenkarussell.mjs übernommen ----

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

// ---- Unverändert aus haftreibung-zentripetalkraft.mjs (Zeile 18–49) übernommen ----

function appendLearningText(target, text) {
  String(text).split(/\{\{([^{}]+)\}\}/g).forEach((part, index) => {
    if (!part) return;
    if (index % 2 === 0) { target.append(document.createTextNode(part)); return; }
    if (part.startsWith("sqrt:")) {
      // {{sqrt:a|b}} setzt einen Bruch unter die Wurzel.
      const inner = part.slice(5);
      const { root, radicand } = createSquareRoot(`Wurzel aus ${inner.replaceAll("μ", "mü").replaceAll("·", "mal").replace("|", " durch ")}`);
      if (inner.includes("|")) radicand.append(createQuotient(inner));
      else appendLearningText(radicand, inner);
      target.append(root);
      return;
    }
    if (part.includes("|")) { target.append(createQuotient(part)); return; }
    if (part.includes("/")) { target.append(createUnitFraction(part)); return; }
    if (part.includes("_")) {
      const [base, ...indexParts] = part.split("_");
      target.append(createIndexedSymbol(base, indexParts.join("_")));
      return;
    }
    target.append(document.createTextNode(part === "mu" ? "μ" : part));
  });
}

function setFeedback(target, status, text) {
  const node = typeof target === "string" ? document.getElementById(target) : target;
  node.hidden = false;
  node.className = `physics-feedback ${status}`;
  node.replaceChildren();
  if (String(text).includes("{{")) appendLearningText(node, text);
  else appendPhysicsText(node, text);
}

// ---- Unverändert aus kettenkarussell.mjs (Geometrie Kraftraster, Aufgabe 6) übernommen ----

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

export function isForceArrowPoint(point, origin = { x: 0, y: 0 }) {
  const dx = Math.abs(point.x - origin.x);
  const dy = Math.abs(point.y - origin.y);
  if (dx === 0) return ARROW_LENGTHS.includes(dy);
  if (dy === 0) return ARROW_LENGTHS.includes(dx);
  return dx === dy && ARROW_LENGTHS.includes(dx);
}

export const CAROUSEL_ORIGIN = { x: 1, y: 0 };

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

// ---- evaluateCarouselForces: Kopie aus kettenkarussell.mjs (Zeile 268–311) mit den
// zwei in der Spezifikation (§6) genannten Änderungen: neuer Erfolgstext ohne
// tan-Wert, neuer Zwischenzweig für "Kette senkrecht + Resultierende als dritte Kraft". ----

export function evaluateCarouselForces(selections) {
  const weight = selections.find((selection) => selection.kind === "weight");
  const rope = selections.find((selection) => selection.kind === "rope");
  const resultant = selections.find((selection) => selection.kind === "resultant");

  if (!selections.length) return { status: "error", text: "Es fehlen alle drei Kraftpfeile. Wähle oben eine Kraft aus und klicke dann vom markierten Körperschwerpunkt aus in ihre Richtung." };

  if (resultant && resultant.direction === "right") return { status: "error", text: "Noch nicht korrekt. Eine nach außen gerichtete Kraft – oft „Fliehkraft“ oder „Zentrifugalkraft“ genannt – gibt es für einen Beobachter am Boden nicht. Was man im Karussell nach außen „spürt“, ist die Trägheit des eigenen Körpers. Die Resultierende aus Seilkraft und Gewichtskraft zeigt waagerecht zur Drehachse – sie ist die Zentripetalkraft, die den Mann auf der Kreisbahn hält." };

  if (rope && rope.direction === "up" && resultant && resultant.direction === "left") return { status: "error", text: "Noch nicht korrekt. Du hast die Kette senkrecht ziehen lassen und die Zentripetalkraft wie eine zusätzliche dritte Kraft eingezeichnet. Die Kette hängt aber schräg und zieht entlang ihrer eigenen Richtung. Die Zentripetalkraft ist keine eigene Kraft, sondern die Resultierende aus {{F_S}} und {{F_G}}." };

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

  return { status: "success", text: "Korrekt: {{F_S}} und {{F_G}} ergeben zusammen eine waagerechte Resultierende, die zur Drehachse zeigt. Sie wirkt als Zentripetalkraft {{F_Z}}. Der senkrechte Anteil der Seilkraft gleicht die Gewichtskraft genau aus." };
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
    // Jeder Klick schaltet die Figur zu Aufgabe 3b frei, unabhängig vom Ergebnis
    // (Muster: Freischaltung der Ergebnisübersicht weiter unten).
    document.getElementById("task3b-figure-pending").hidden = true;
    document.getElementById("task3b-figure").hidden = false;
  });
}

// ---- 9.1 evaluateNumber: verallgemeinert aus setupNumberTask in zentripetalkraft.mjs
// (Zeile 1055–1095). Neu ist der Parameter "digits" statt der festen 2. ----

export function evaluateNumber(raw, unit, config) {
  const { digits, validUnits, wrongChecks = [], successText, roundingText, unitMismatchText, wrongUnitText, genericErrorText } = config;

  if (!unit) return { status: "error", text: "Wähle eine Einheit aus." };
  const value = numberValue(raw);
  if (!Number.isFinite(value)) return { status: "error", text: "Gib einen Zahlenwert ein." };

  const actualDigits = significantDigitCount(raw);
  const matchesWindow = (target) => Math.abs(value - target.value) <= target.tolerance || Math.abs(value - target.exact) <= target.exactTolerance;
  const isValidUnit = unit in validUnits;

  if (isValidUnit) {
    const target = validUnits[unit];
    const valueCorrect = Math.abs(value - target.value) <= target.tolerance;
    const exactUnrounded = Math.abs(value - target.exact) <= target.exactTolerance;

    if (valueCorrect && actualDigits === digits) return { status: "success", text: successText };
    if ((valueCorrect || exactUnrounded) && actualDigits !== digits) return { status: "partial", text: roundingText };

    const otherUnitMatches = Object.entries(validUnits).some(([key, other]) => key !== unit && other.value !== target.value && matchesWindow(other));
    if (otherUnitMatches) return { status: "partial", text: unitMismatchText };
  }

  const matchedWrong = wrongChecks.find((check) => check.units.includes(unit) && value >= check.min && value <= check.max);
  if (matchedWrong) return { status: matchedWrong.status || "error", text: matchedWrong.text };

  if (!isValidUnit) {
    const matchesSomeValidUnit = Object.values(validUnits).some(matchesWindow);
    if (matchesSomeValidUnit) return { status: "partial", text: wrongUnitText };
  }

  return { status: "error", text: genericErrorText };
}

function setupNumberTask(task) {
  document.getElementById(task.buttonId).addEventListener("click", () => {
    const raw = document.getElementById(task.inputId).value;
    const unit = document.getElementById(task.unitId).value;
    const { status, text } = evaluateNumber(raw, unit, task);
    setFeedback(task.feedbackId, status, text);
  });
}

// ---- 9.1 Konfiguration der vier Zahlenaufgaben ----

function nAndKnChecks(rows) {
  return rows.flatMap(({ min, max, status = "error", text }) => [
    { units: ["N"], min, max, status, text },
    { units: ["kN"], min: min / 1000, max: max / 1000, status, text },
  ]);
}

function mpsAndKmhChecks(rows) {
  return rows.flatMap(({ mps, kmh, status = "error", text }) => {
    const checks = [];
    if (mps) checks.push({ units: ["mps"], min: mps[0], max: mps[1], status, text });
    if (kmh) checks.push({ units: ["kmh"], min: kmh[0], max: kmh[1], status, text });
    return checks;
  });
}

const TASK1B_ROUNDING_TEXT = "Dein Rechenwert ist grundsätzlich passend. Runde das Endergebnis noch auf die geforderte Anzahl gültiger Ziffern. Masse, Geschwindigkeit und Radius besitzen drei gültige Ziffern.";

export const NUMBER_TASKS = {
  task1a: {
    buttonId: "check-task1a", inputId: "task1a-answer", unitId: "task1a-unit", feedbackId: "task1a-feedback",
    digits: 3,
    validUnits: {
      Hz: { value: 1.91, tolerance: 0.0005, exact: 1.91293, exactTolerance: 0.0191 },
      "per-s": { value: 1.91, tolerance: 0.0005, exact: 1.91293, exactTolerance: 0.0191 },
      "per-min": { value: 115, tolerance: 0.5, exact: 114.776, exactTolerance: 1.15 },
    },
    wrongChecks: [
      { units: ["Hz", "per-s", "s", "per-min"], min: 0.517, max: 0.528, text: "Noch nicht korrekt. Du hast die Umlaufdauer T ≈ 0,523 s berechnet. Gesucht ist die Frequenz f = {{1|T}}, also die Zahl der Umdrehungen pro Sekunde." },
      { units: ["Hz", "per-s"], min: 3.22, max: 3.30, text: "Noch nicht korrekt. Du hast nur die Seillänge als Radius verwendet. Die Kugel kreist aber um die Drehachse des Werfers: Der Radius ist Armlänge plus Seillänge." },
      { units: ["Hz", "per-s"], min: 4.58, max: 4.67, text: "Noch nicht korrekt. Du hast nur die Armlänge als Radius verwendet. Der Radius reicht von der Drehachse bis zur Kugel, also Armlänge plus Seillänge." },
      { units: ["Hz", "per-s"], min: 0.0451, max: 0.0461, text: "Noch nicht korrekt. Rechne die Armlänge zuerst in Meter um: 86,0 cm = 0,860 m. Erst dann darfst du sie zur Seillänge addieren." },
      { units: ["Hz", "per-s"], min: 0.946, max: 0.967, text: "Noch nicht korrekt. Du hast mit dem Durchmesser gerechnet. In {{v_B}} = ω · r steht der Radius, also der Abstand von der Drehachse bis zur Kugel." },
      { units: ["Hz", "per-s"], min: 11.9, max: 12.15, text: "Noch nicht korrekt. Du hast die Winkelgeschwindigkeit ω = {{v_B|r}} ≈ 12,0 {{1/s}} berechnet. Die Frequenz ist um den Faktor 2π kleiner: f = {{ω|2π}}." },
      { units: ["Hz", "per-s"], min: 3.78, max: 3.87, text: "Noch nicht korrekt. Ein voller Umlauf entspricht dem Winkel 2π, nicht π. Prüfe den Faktor 2 in ω = 2π · f." },
    ],
    successText: "Richtig. Zahlenwert, Einheit und die Anzahl der gültigen Ziffern stimmen. Mit r = 1,22 m + 0,860 m = 2,08 m gilt f = {{v_B|2π · r}} ≈ 1,91 Hz. Der Werfer dreht sich also knapp zweimal pro Sekunde.",
    roundingText: "Dein Rechenwert ist grundsätzlich passend. Runde das Endergebnis noch auf die geforderte Anzahl gültiger Ziffern. Alle Angaben besitzen drei gültige Ziffern, also auch das Ergebnis.",
    unitMismatchText: "Prüfe deinen Zahlenwert, die Einheit und die Anzahl der gültigen Ziffern. Dein Zahlenwert passt zu einer anderen Einheit: 1 Hz = 1 {{1/s}} = 60 {{1/min}}.",
    wrongUnitText: "Prüfe deinen Zahlenwert, die Einheit und die Anzahl der gültigen Ziffern. Dein Zahlenwert passt, aber eine Frequenz wird in Hz oder {{1/s}} angegeben.",
    genericErrorText: "Noch nicht korrekt. Prüfe deinen Zahlenwert, die Einheit und die Anzahl der gültigen Ziffern. Bestimme zuerst den Radius der Kreisbahn und nutze dann {{v_B}} = ω · r.",
  },
  task1b: {
    buttonId: "check-task1b", inputId: "task1b-answer", unitId: "task1b-unit", feedbackId: "task1b-feedback",
    digits: 3,
    validUnits: {
      N: { value: 2150, tolerance: 0.5, exact: 2151.44, exactTolerance: 21.5 },
      kN: { value: 2.15, tolerance: 0.0005, exact: 2.15144, exactTolerance: 0.0215 },
    },
    wrongChecks: nAndKnChecks([
      { min: 2195, max: 2205, status: "partial", text: TASK1B_ROUNDING_TEXT },
      { min: 85.1, max: 87.0, text: "Noch nicht korrekt. Die Bahngeschwindigkeit geht im Quadrat ein: {{F_Z}} = {{m · v_B²|r}}. Quadriere zuerst 25,0 {{m/s}}." },
      { min: 3630, max: 3705, text: "Noch nicht korrekt. Du hast nur die Seillänge als Radius verwendet. Die Kugel kreist um die Drehachse des Werfers, also r = 1,22 m + 0,860 m = 2,08 m." },
      { min: 1065, max: 1087, text: "Noch nicht korrekt. Du hast mit dem Durchmesser gerechnet. In {{F_Z}} = {{m · v_B²|r}} steht der Radius r = 2,08 m." },
      { min: 9210, max: 9410, text: "Noch nicht korrekt. Der Radius steht im Nenner: Teile durch r, statt mit r zu multiplizieren." },
      { min: 50.7, max: 51.9, text: "Noch nicht korrekt. Rechne die Armlänge zuerst in Meter um: 86,0 cm = 0,860 m." },
      { min: 69.5, max: 71.0, text: "Noch nicht korrekt. Du hast die Gewichtskraft m · g berechnet. Gesucht ist die Kraft, die die Kugel auf der Kreisbahn hält – die Zentripetalkraft {{F_Z}} = {{m · v_B²|r}}." },
    ]),
    successText: "Richtig. Zahlenwert, Einheit und die Anzahl der gültigen Ziffern stimmen. {{F_Z}} = {{m · v_B²|r}} ≈ 2 150 N = 2,15 kN. Diese Kraft muss über das Seil auf die Kugel wirken – etwa das 30-Fache ihrer Gewichtskraft.",
    roundingText: TASK1B_ROUNDING_TEXT,
    unitMismatchText: "Prüfe deinen Zahlenwert, die Einheit und die Anzahl der gültigen Ziffern. Dein Zahlenwert passt zur anderen Einheit: 1 kN = 1 000 N.",
    wrongUnitText: "Prüfe deinen Zahlenwert, die Einheit und die Anzahl der gültigen Ziffern. Dein Zahlenwert passt, aber eine Kraft wird in N oder kN angegeben.",
    genericErrorText: "Noch nicht korrekt. Prüfe deinen Zahlenwert, die Einheit und die Anzahl der gültigen Ziffern. Setze m, {{v_B}} und r = 2,08 m in {{F_Z}} = {{m · v_B²|r}} ein.",
  },
  task2: {
    buttonId: "check-task2", inputId: "task2-answer", unitId: "task2-unit", feedbackId: "task2-feedback",
    digits: 2,
    validUnits: {
      deg: { value: 12, tolerance: 0.0005, exact: 11.524, exactTolerance: 0.115 },
      rad: { value: 0.20, tolerance: 0.00005, exact: 0.20113, exactTolerance: 0.002 },
    },
    wrongChecks: [
      { units: ["deg"], min: 68.5, max: 70.0, text: "Noch nicht korrekt. Rechne die Geschwindigkeit zuerst in {{m/s}} um: 36 {{km/h}} = 10 {{m/s}}. Sonst wird {{v_B}}² viel zu groß." },
      { units: ["deg"], min: 1.15, max: 1.20, text: "Noch nicht korrekt. Die Bahngeschwindigkeit geht im Quadrat ein, denn {{F_Z}} = {{m · v_B²|r}}. Rechne mit {{v_B}}² = 100 {{m²/s²}}." },
      { units: ["deg"], min: 77.7, max: 79.3, text: "Noch nicht korrekt. Prüfe, welche Kraft im Kräftedreieck gegenüber von α liegt: {{F_Z}} ist die Gegenkathete, {{F_G}} die Ankathete. Dein Winkel ist der Winkel zur Senkrechten." },
      { units: ["deg"], min: 11.70, max: 11.85, text: "Noch nicht korrekt. Du hast vermutlich nur den Sinus verwendet. Teile die beiden Teilgleichungen durcheinander: Dann kürzt sich {{F_N}} und es bleibt der Tangens." },
      { units: ["deg"], min: 10.95, max: 11.40, status: "partial", text: "Dein Ansatz stimmt. Rechne mit g = 9,81 {{m/s²}}, dann erhältst du einen etwas größeren Winkel." },
    ],
    successText: "Richtig. Zahlenwert, Einheit und die Anzahl der gültigen Ziffern stimmen. Mit {{v_B}} = 10 {{m/s}} gilt tan α = {{v_B²|r · g}} ≈ 0,204, also α ≈ 12°. Die Masse des Fahrzeugs spielt keine Rolle, sie kürzt sich.",
    roundingText: "Dein Rechenwert ist grundsätzlich passend. Runde das Endergebnis noch auf die geforderte Anzahl gültiger Ziffern. Die Geschwindigkeit 36 {{km/h}} ist nur mit zwei gültigen Ziffern angegeben.",
    unitMismatchText: "Prüfe deinen Zahlenwert, die Einheit und die Anzahl der gültigen Ziffern. Dein Zahlenwert passt zur anderen Winkeleinheit. Achte darauf, ob dein Taschenrechner auf Grad (DEG) oder Bogenmaß (RAD) steht.",
    wrongUnitText: "Prüfe deinen Zahlenwert, die Einheit und die Anzahl der gültigen Ziffern. Dein Zahlenwert passt, aber ein Winkel wird in ° oder rad angegeben.",
    genericErrorText: "Noch nicht korrekt. Prüfe deinen Zahlenwert, die Einheit und die Anzahl der gültigen Ziffern. Nutze das Kräftedreieck: Stelle je eine Gleichung für den senkrechten und den waagerechten Anteil von {{F_N}} auf.",
  },
  task3b: {
    buttonId: "check-task3b", inputId: "task3b-answer", unitId: "task3b-unit", feedbackId: "task3b-feedback",
    digits: 2,
    validUnits: {
      mps: { value: 13, tolerance: 0.0005, exact: 13.4485, exactTolerance: 0.134 },
      kmh: { value: 48, tolerance: 0.0005, exact: 48.4146, exactTolerance: 0.484 },
    },
    wrongChecks: [
      ...mpsAndKmhChecks([
        { mps: [14.6, 15.05], kmh: [52.6, 53.8], text: "Noch nicht korrekt. Du hast die Kettenlänge l als Radius verwendet. Der Radius ist der waagerechte Abstand des Mannes von der Drehachse. Bestimme ihn im Dreieck aus Kette, Drehachse und r." },
        { mps: [10.9, 11.2], kmh: [39.3, 40.2], text: "Noch nicht korrekt. Prüfe den Radius: r liegt gegenüber vom Winkel α, ist also die Gegenkathete. Dazu gehört der Sinus, nicht der Kosinus." },
        { mps: [178, 184], kmh: [645, 657], text: "Noch nicht korrekt. Du hast {{v_B}}² berechnet. Ziehe noch die Wurzel." },
        { mps: [8.95, 9.2], kmh: [32.2, 33.1], text: "Noch nicht korrekt. Im Kräftedreieck liegt {{F_Z}} gegenüber von α und {{F_G}} an α. Prüfe, ob du den Kehrwert gebildet hast." },
        { mps: [6.75, 6.95], kmh: [24.3, 25.0], text: "Noch nicht korrekt. Dein Taschenrechner steht vermutlich auf Bogenmaß (RAD). Stelle ihn auf Grad (DEG) um, bevor du sin 56° und tan 56° berechnest." },
        { mps: [13.95, 14.05], kmh: [48.95, 49.05], status: "partial", text: "Dein Ansatz stimmt. Rechne mit g = 9,81 {{m/s²}} und runde erst das Endergebnis." },
      ]),
      { units: ["kmh"], min: 46.7, max: 47.05, status: "partial", text: "Dein Rechenwert ist grundsätzlich passend. Runde erst das Endergebnis: Rechne den ungerundeten Wert von {{v_B}} in {{km/h}} um." },
    ],
    successText: "Richtig. Zahlenwert, Einheit und die Anzahl der gültigen Ziffern stimmen. Mit r = l · sin α ≈ 12,4 m gilt {{v_B}} = {{sqrt:r · g · tan α}} ≈ 13 {{m/s}} ≈ 48 {{km/h}}. Die Masse des Mannes brauchst du nicht: Sie kürzt sich.",
    roundingText: "Dein Rechenwert ist grundsätzlich passend. Runde das Endergebnis noch auf die geforderte Anzahl gültiger Ziffern. Die Angaben l = 15 m und α = 56° besitzen nur zwei gültige Ziffern.",
    unitMismatchText: "Prüfe deinen Zahlenwert, die Einheit und die Anzahl der gültigen Ziffern. Dein Zahlenwert passt zur anderen Einheit: 1 {{m/s}} = 3,6 {{km/h}}.",
    wrongUnitText: "Prüfe deinen Zahlenwert, die Einheit und die Anzahl der gültigen Ziffern. Dein Zahlenwert passt, aber eine Geschwindigkeit wird in {{m/s}} oder {{km/h}} angegeben.",
    genericErrorText: "Noch nicht korrekt. Prüfe deinen Zahlenwert, die Einheit und die Anzahl der gültigen Ziffern. Bestimme zuerst den Radius r der Kreisbahn und nutze dann das Kräftedreieck.",
  },
};

// ---- 9.2 Zuordnung der Rechenschritte: evaluateStepOrder / setupStepOrder,
// verallgemeinert aus setupDerivationSort in haftreibung-zentripetalkraft.mjs
// (Zeile 105–302) auf genau eine Gruppe (Karten). ----

export function evaluateStepOrder(values, config) {
  const { n, acceptedOrders, distractorIds = [], distractorHint, success } = config;

  if (values.some((value) => !value)) return { status: "error", text: `Fülle zuerst alle ${n} Felder mit je einer Karte.` };

  const isAccepted = acceptedOrders.some((order) => order.every((id, index) => values[index] === id));
  if (isAccepted) return { status: "success", text: success };

  const bestHits = Math.max(...acceptedOrders.map((order) => order.filter((id, index) => values[index] === id).length));
  const hasDistractor = values.some((value) => distractorIds.includes(value));

  if (bestHits === 0 && !hasDistractor) {
    return { status: "error", text: "Noch nicht korrekt. Beginne mit dem Schritt, den du direkt aus den Angaben aufstellen kannst, und ende mit dem Ergebnis." };
  }

  const parts = [];
  if (hasDistractor) parts.push(distractorHint);
  parts.push(`${bestHits} von ${n} Rechenschritten stehen an der richtigen Stelle. Jeder Schritt muss aus dem Schritt darüber folgen.`);
  const prefix = bestHits > 0 ? "Teilweise korrekt." : "Noch nicht korrekt.";
  return { status: bestHits > 0 ? "partial" : "error", text: `${prefix} ${parts.join(" ")}` };
}

export function setupStepOrder(config) {
  const { containerId, checkButtonId, resetButtonId, feedbackId, cards, order: bankOrder, n } = config;
  const container = document.getElementById(containerId);
  const feedback = document.getElementById(feedbackId);
  const values = new Array(n).fill("");
  let picked = null; // { value, from } mit from = Zeilenindex oder -1 (Speicher)

  const cardOf = (id) => cards.find((card) => card.id === id);
  const dropSelector = `#${containerId} .formula-slot`;
  const bankSelector = `#${containerId} .step-order-bank`;

  function renderCardInto(element, id) {
    element.replaceChildren();
    appendLearningText(element, cardOf(id).text);
  }

  function place(value, from, to) {
    if (from >= 0) values[from] = "";
    if (to >= 0) {
      const previous = values[to];
      values[to] = value;
      if (from >= 0 && previous) values[from] = previous;
    }
    picked = null;
    feedback.hidden = true;
    render();
  }

  const bank = document.createElement("div");
  bank.className = "cloze-term-bank step-order-bank";
  bank.setAttribute("aria-label", "Speicher: Rechenschritte");

  const rows = document.createElement("ol");
  rows.className = "step-order-rows";
  const slots = [];

  for (let index = 0; index < n; index += 1) {
    const row = document.createElement("li");
    row.className = "step-order-row";
    const number = document.createElement("span");
    number.className = "step-order-number";
    number.setAttribute("aria-hidden", "true");
    number.textContent = String(index + 1);
    const slot = document.createElement("button");
    slot.type = "button";
    slot.className = "formula-slot";
    slot.dataset.index = String(index);
    enableTokenDrag(slot, {
      dropSelector, bankSelector,
      getLabel: () => values[index],
      renderGhost: (ghost) => renderCardInto(ghost, values[index]),
      onDrop: (dropSlot, onBank) => {
        const value = values[index];
        const to = dropSlot ? Number(dropSlot.dataset.index) : -1;
        if (to >= 0 && to !== index) place(value, index, to);
        else if (onBank) place(value, index, -1);
        else render();
      },
    });
    slot.addEventListener("click", () => {
      if (wasDragged(slot)) return;
      const value = values[index];
      if (picked && picked.from !== index) { place(picked.value, picked.from, index); slot.focus(); return; }
      if (picked && picked.from === index) { place(value, index, -1); return; }
      if (value) { picked = { value, from: index }; render(); slot.focus(); }
    });
    slots.push(slot);
    row.append(number, slot);
    rows.append(row);
  }

  container.append(bank, rows);

  function render() {
    bank.replaceChildren(...bankOrder.filter((id) => !values.includes(id)).map((id) => {
      const token = document.createElement("button");
      token.type = "button";
      token.className = "cloze-token";
      renderCardInto(token, id);
      const isPicked = picked?.value === id && picked.from === -1;
      token.setAttribute("aria-pressed", String(isPicked));
      token.setAttribute("aria-label", cardOf(id).spoken);
      token.classList.toggle("is-picked", isPicked);
      enableTokenDrag(token, {
        dropSelector, bankSelector,
        getLabel: () => id,
        renderGhost: (ghost) => renderCardInto(ghost, id),
        onDrop: (slot) => { if (slot) place(id, -1, Number(slot.dataset.index)); else render(); },
      });
      token.addEventListener("click", () => {
        if (wasDragged(token)) return;
        picked = isPicked ? null : { value: id, from: -1 };
        render();
        if (picked) (slots.find((slot) => !slot.classList.contains("is-filled")) || slots[0])?.focus();
      });
      return token;
    }));
    slots.forEach((slot, index) => {
      const value = values[index];
      if (value) renderCardInto(slot, value);
      else slot.textContent = "Hierher ziehen";
      slot.classList.toggle("is-filled", Boolean(value));
      slot.classList.toggle("is-picked", picked?.from === index);
      slot.classList.toggle("is-selected", picked !== null && !value);
      slot.setAttribute("aria-label", `Rechenschritt ${index + 1}: ${value ? cardOf(value).spoken : "leer"}`);
    });
  }

  document.getElementById(checkButtonId).addEventListener("click", () => {
    const result = evaluateStepOrder(values, config);
    setFeedback(feedback, result.status, result.text);
  });

  document.getElementById(resetButtonId).addEventListener("click", () => {
    values.fill("");
    picked = null;
    feedback.hidden = true;
    render();
  });

  render();
}

// ---- 9.2 Konfiguration der vier Zuordnungen ----

export const STEP_TASKS = {
  task1a: {
    containerId: "task1a-steps", checkButtonId: "check-task1a-steps", resetButtonId: "reset-task1a-steps", feedbackId: "task1a-steps-feedback",
    n: 5,
    order: ["insert", "rope-only", "relation", "result", "radius", "solve"],
    cards: [
      { id: "radius", text: "r = {{l_Seil}} + {{l_Arm}} = 1,22 m + 0,860 m = 2,08 m", spoken: "r gleich l Seil plus l Arm gleich 1,22 Meter plus 0,860 Meter gleich 2,08 Meter" },
      { id: "relation", text: "{{v_B}} = ω · r = 2π · f · r", spoken: "v mit Index B gleich Omega mal r gleich 2 Pi mal f mal r" },
      { id: "solve", text: "f = {{v_B|2π · r}}", spoken: "f gleich v mit Index B durch 2 Pi mal r" },
      { id: "insert", text: "f = {{25,0|2π · 2,08}} {{1/s}}", spoken: "f gleich 25,0 durch 2 Pi mal 2,08, in 1 pro Sekunde" },
      { id: "result", text: "f ≈ 1,9129 Hz", spoken: "f ungefähr 1,9129 Hertz" },
      { id: "rope-only", text: "r = {{l_Seil}} = 1,22 m", spoken: "r gleich l Seil gleich 1,22 Meter" },
    ],
    distractorIds: ["rope-only"],
    acceptedOrders: [
      ["radius", "relation", "solve", "insert", "result"],
      ["relation", "radius", "solve", "insert", "result"],
      ["relation", "solve", "radius", "insert", "result"],
    ],
    distractorHint: "Die Karte r = {{l_Seil}} = 1,22 m passt nicht: Die Kugel kreist um die Drehachse des Werfers, nicht um seine Hand. Zum Radius gehören Seillänge und Armlänge.",
    success: "Richtig. Jeder Schritt folgt aus dem Schritt darüber. Runde das Ergebnis auf drei gültige Ziffern und trage es oben ein.",
  },
  task1b: {
    containerId: "task1b-steps", checkButtonId: "check-task1b-steps", resetButtonId: "reset-task1b-steps", feedbackId: "task1b-steps-feedback",
    n: 4,
    order: ["result", "no-square", "square", "approach", "insert"],
    cards: [
      { id: "approach", text: "{{F_Z}} = {{m · v_B²|r}}", spoken: "F mit Index Z gleich m mal v mit Index B zum Quadrat durch r" },
      { id: "square", text: "{{v_B}}² = (25,0 {{m/s}})² = 625 {{m²/s²}}", spoken: "v mit Index B zum Quadrat gleich 25,0 Meter pro Sekunde zum Quadrat gleich 625 Quadratmeter pro Sekunde zum Quadrat" },
      { id: "insert", text: "{{F_Z}} = {{7,16 · 625|2,08}} N", spoken: "F mit Index Z gleich 7,16 mal 625 durch 2,08 Newton" },
      { id: "result", text: "{{F_Z}} ≈ 2151,4 N", spoken: "F mit Index Z ungefähr 2151,4 Newton" },
      { id: "no-square", text: "{{F_Z}} = {{7,16 · 25,0|2,08}} N", spoken: "F mit Index Z gleich 7,16 mal 25,0 durch 2,08 Newton" },
    ],
    distractorIds: ["no-square"],
    acceptedOrders: [
      ["approach", "square", "insert", "result"],
      ["square", "approach", "insert", "result"],
    ],
    distractorHint: "Die Karte mit 7,16 · 25,0 im Zähler passt nicht: Die Bahngeschwindigkeit geht im Quadrat ein. Im Zähler steht m · {{v_B}}² = 7,16 kg · 625 {{m²/s²}}.",
    success: "Richtig. Jeder Schritt folgt aus dem Schritt darüber. Runde das Ergebnis auf drei gültige Ziffern und trage es oben ein.",
  },
  task2: {
    containerId: "task2-steps", checkButtonId: "check-task2-steps", resetButtonId: "reset-task2-steps", feedbackId: "task2-steps-feedback",
    n: 5,
    order: ["tan", "result", "inverse", "equations", "insert", "divide"],
    cards: [
      { id: "equations", text: "{{F_N}} · cos α = m · g und {{F_N}} · sin α = {{m · v_B²|r}}", spoken: "F mit Index N mal Kosinus Alpha gleich m mal g und F mit Index N mal Sinus Alpha gleich m mal v mit Index B zum Quadrat durch r" },
      { id: "divide", text: "{{F_N · sin α|F_N · cos α}} = {{m · v_B²|r · m · g}}", spoken: "F mit Index N mal Sinus Alpha durch F mit Index N mal Kosinus Alpha gleich m mal v mit Index B zum Quadrat durch r mal m mal g" },
      { id: "tan", text: "tan α = {{v_B²|r · g}}", spoken: "Tangens Alpha gleich v mit Index B zum Quadrat durch r mal g" },
      { id: "insert", text: "tan α = {{10²|50 · 9,81}} ≈ 0,2039 (mit {{v_B}} = 36 {{km/h}} = 10 {{m/s}})", spoken: "Tangens Alpha gleich 10 zum Quadrat durch 50 mal 9,81 ungefähr 0,2039, mit v mit Index B gleich 36 Kilometer pro Stunde gleich 10 Meter pro Sekunde" },
      { id: "result", text: "α = tan⁻¹(0,2039) ≈ 11,52°", spoken: "Alpha gleich Arkustangens von 0,2039 ungefähr 11,52 Grad" },
      { id: "inverse", text: "tan α = {{r · g|v_B²}}", spoken: "Tangens Alpha gleich r mal g durch v mit Index B zum Quadrat" },
    ],
    distractorIds: ["inverse"],
    acceptedOrders: [
      ["equations", "divide", "tan", "insert", "result"],
    ],
    distractorHint: "Die Karte tan α = {{r · g|v_B²}} passt nicht: {{F_Z}} liegt gegenüber von α und steht deshalb im Zähler, {{F_G}} liegt an α und steht im Nenner.",
    success: "Richtig. Jeder Schritt folgt aus dem Schritt darüber. Runde das Ergebnis auf zwei gültige Ziffern und trage es oben ein.",
  },
  task3b: {
    containerId: "task3b-steps", checkButtonId: "check-task3b-steps", resetButtonId: "reset-task3b-steps", feedbackId: "task3b-steps-feedback",
    n: 6,
    order: ["solve", "cos-radius", "result", "equations", "insert", "radius", "tan"],
    cards: [
      { id: "radius", text: "r = l · sin α = 15 m · sin 56° ≈ 12,436 m", spoken: "r gleich l mal Sinus Alpha gleich 15 Meter mal Sinus 56 Grad ungefähr 12,436 Meter" },
      { id: "equations", text: "{{F_S}} · cos α = m · g und {{F_S}} · sin α = {{m · v_B²|r}}", spoken: "F mit Index S mal Kosinus Alpha gleich m mal g und F mit Index S mal Sinus Alpha gleich m mal v mit Index B zum Quadrat durch r" },
      { id: "tan", text: "tan α = {{v_B²|r · g}}", spoken: "Tangens Alpha gleich v mit Index B zum Quadrat durch r mal g" },
      { id: "solve", text: "{{v_B}} = {{sqrt:r · g · tan α}}", spoken: "v mit Index B gleich Wurzel aus r mal g mal Tangens Alpha" },
      { id: "insert", text: "{{v_B}} = {{sqrt:12,436 · 9,81 · tan 56°}} {{m/s}}", spoken: "v mit Index B gleich Wurzel aus 12,436 mal 9,81 mal Tangens 56 Grad, in Meter pro Sekunde" },
      { id: "result", text: "{{v_B}} ≈ 13,448 {{m/s}}", spoken: "v mit Index B ungefähr 13,448 Meter pro Sekunde" },
      { id: "cos-radius", text: "r = l · cos α = 15 m · cos 56° ≈ 8,388 m", spoken: "r gleich l mal Kosinus Alpha gleich 15 Meter mal Kosinus 56 Grad ungefähr 8,388 Meter" },
    ],
    distractorIds: ["cos-radius"],
    acceptedOrders: [0, 1, 2, 3].map((position) => {
      const order = ["equations", "tan", "solve", "insert", "result"];
      order.splice(position, 0, "radius");
      return order;
    }),
    distractorHint: "Die Karte r = l · cos α passt nicht: Im Dreieck aus Kette, Drehachse und Radius liegt r gegenüber von α. r ist also die Gegenkathete, deshalb gehört der Sinus dazu.",
    success: "Richtig. Jeder Schritt folgt aus dem Schritt darüber. Runde das Ergebnis auf zwei gültige Ziffern und trage es oben ein.",
  },
};

// ---- 7 Abschlussquiz ----

export const quizItems = [
  {
    taskNumber: "4a", question: "Welche Aussagen zur Zentripetalkraft sind richtig?", correct: ["role", "center"],
    options: [
      ["role", "Sie ist keine eigene Kraftart, sondern die Rolle der resultierenden Kraft bei einer Kreisbewegung."],
      ["extra", "Sie wirkt immer zusätzlich zu allen anderen Kräften auf den Körper."],
      ["center", "Sie zeigt immer zum Mittelpunkt der Kreisbahn."],
      ["tangent", "Sie zeigt in Richtung der Bahngeschwindigkeit."],
    ],
    success: "Korrekt: Die Zentripetalkraft ist die zum Mittelpunkt gerichtete resultierende Kraft. Reale Kräfte wie Seilkraft oder Normalkraft übernehmen diese Rolle.",
    hint: "Denke an die Rennbahn und das Kettenkarussell: Welche Kräfte wirkten dort tatsächlich, und wohin zeigte ihre Summe?",
    optionHints: {
      extra: "Die Zentripetalkraft wird von realen Kräften aufgebracht, etwa von Seilkraft oder Normalkraft. Als zusätzliche Kraft wäre sie doppelt gezählt.",
      tangent: "Eine Kraft in Richtung der Bahngeschwindigkeit würde den Körper nur schneller machen. Die Zentripetalkraft ändert die Bewegungsrichtung und zeigt deshalb zum Mittelpunkt.",
    },
  },
  {
    taskNumber: "4b", question: "Welche Änderungen verdoppeln die nötige Zentripetalkraft {{F_Z}} = {{m · v_B²|r}}? Alle anderen Größen bleiben jeweils gleich.", correct: ["mass", "half-r"],
    options: [
      ["mass", "Die Masse m wird verdoppelt."],
      ["double-v", "Die Bahngeschwindigkeit {{v_B}} wird verdoppelt."],
      ["half-r", "Der Radius r wird halbiert."],
      ["double-r", "Der Radius r wird verdoppelt."],
    ],
    success: "Korrekt: {{F_Z}} ist proportional zu m und umgekehrt proportional zu r. Die Geschwindigkeit geht dagegen im Quadrat ein.",
    hint: "Lies aus {{F_Z}} = {{m · v_B²|r}} ab, welche Größe im Zähler, welche im Nenner und welche im Quadrat steht.",
    optionHints: {
      "double-v": "{{v_B}} geht im Quadrat ein: Doppelte Geschwindigkeit bedeutet viermal so große Zentripetalkraft.",
      "double-r": "r steht im Nenner: Ein doppelt so großer Radius halbiert die nötige Zentripetalkraft.",
    },
  },
  {
    taskNumber: "4c", question: "Im Kräftedreieck der Rennbahn liegt α zwischen {{F_N}} und der Senkrechten. Welche Aussagen sind richtig?", correct: ["cos", "sin"],
    options: [
      ["cos", "{{F_G}} ist die Ankathete von α, deshalb gilt {{F_N}} · cos α = {{F_G}}."],
      ["swap", "{{F_G}} ist die Gegenkathete von α."],
      ["sin", "{{F_Z}} ist die Gegenkathete von α, deshalb gilt {{F_N}} · sin α = {{F_Z}}."],
      ["hyp", "{{F_G}} ist die Hypotenuse, weil sie die größte Kraft ist."],
    ],
    success: "Korrekt: {{F_N}} ist die Hypotenuse. Die Ankathete {{F_G}} gehört zum Kosinus, die Gegenkathete {{F_Z}} zum Sinus.",
    hint: "Suche zuerst den rechten Winkel. Gegenüber liegt die Hypotenuse; die Seite am Winkel α ist die Ankathete.",
    optionHints: {
      swap: "{{F_G}} liegt am Winkel α an. Gegenüber von α liegt {{F_Z}}.",
      hyp: "Die Hypotenuse liegt gegenüber dem rechten Winkel. Im Kräftedreieck ist das {{F_N}}, und sie ist länger als jede Kathete.",
    },
  },
  {
    taskNumber: "4d", question: "Welche Aussagen folgen aus tan α = {{v_B²|r · g}} für eine geneigte Kurve?", correct: ["mass", "faster"],
    options: [
      ["mass", "Die optimale Neigung hängt nicht von der Masse des Fahrzeugs ab."],
      ["heavy", "Schwere Fahrzeuge brauchen eine stärker geneigte Kurve."],
      ["faster", "Für eine größere Geschwindigkeit muss die Kurve stärker geneigt sein."],
      ["radius", "Bei größerem Kurvenradius muss die Kurve stärker geneigt sein."],
    ],
    success: "Korrekt: Die Masse kürzt sich. Eine größere Geschwindigkeit verlangt eine stärkere, ein größerer Radius eine geringere Neigung.",
    hint: "Prüfe, welche Größen in tan α = {{v_B²|r · g}} vorkommen und ob sie im Zähler oder im Nenner stehen.",
    optionHints: {
      heavy: "Die Masse kürzt sich beim Teilen der beiden Teilgleichungen. Deshalb passt dieselbe Neigung für leichte und schwere Fahrzeuge.",
      radius: "r steht im Nenner: Ein größerer Radius führt zu einem kleineren tan α und damit zu einer flacheren Kurve.",
    },
  },
  {
    taskNumber: "4e", question: "Ein Mann im Kettenkarussell fühlt sich nach außen gedrückt. Welche Aussagen sind richtig?", correct: ["inertia", "tangent"],
    options: [
      ["flieh", "Eine Fliehkraft zieht ihn nach außen und hält der Zentripetalkraft das Gleichgewicht."],
      ["inertia", "Er spürt seine Trägheit: Ohne Kraft zur Mitte würde er sich geradlinig weiterbewegen."],
      ["radial", "Reißt die Kette, fliegt er radial nach außen, von der Drehachse weg."],
      ["tangent", "Reißt die Kette, bewegt er sich von oben gesehen tangential zur Kreisbahn weiter."],
    ],
    success: "Korrekt: Das Gefühl, nach außen gedrückt zu werden, ist die Trägheit. Eine Fliehkraft gibt es für einen Beobachter am Boden nicht.",
    hint: "Denke an den Hammerwurf: In welche Richtung fliegt der Hammer, wenn der Werfer loslässt?",
    optionHints: {
      flieh: "Für einen Beobachter am Boden gibt es keine Fliehkraft. Wären die Kräfte im Gleichgewicht, wäre die resultierende Kraft null – dann würde der Mann geradeaus fliegen statt im Kreis.",
      radial: "Nach dem Trägheitssatz behält er seine momentane Bewegungsrichtung bei. Die zeigt tangential zur Kreisbahn, nicht radial nach außen.",
    },
  },
  {
    taskNumber: "4f", question: "Welche Aussagen zu den Kräften am Mann im Kettenkarussell sind richtig?", correct: ["two", "sum", "larger"],
    options: [
      ["two", "Am Mann greifen nur zwei Kräfte an: {{F_G}} und {{F_S}}."],
      ["equal", "Die Seilkraft {{F_S}} ist genauso groß wie die Gewichtskraft {{F_G}}."],
      ["sum", "Die Resultierende aus {{F_G}} und {{F_S}} zeigt waagerecht zur Drehachse."],
      ["zero", "Die resultierende Kraft auf den Mann ist null, weil er sich gleichmäßig bewegt."],
      ["larger", "Die Seilkraft {{F_S}} ist größer als die Gewichtskraft {{F_G}}."],
    ],
    success: "Korrekt: {{F_G}} und {{F_S}} ergeben eine waagerechte Resultierende zur Drehachse. Als Hypotenuse im Kräftedreieck ist {{F_S}} größer als {{F_G}}.",
    hint: "Stell dir das Kräftedreieck aus Aufgabe 3 vor: Welche Seite ist die Hypotenuse?",
    optionHints: {
      equal: "Nur der senkrechte Anteil {{F_S}} · cos α ist so groß wie {{F_G}}. Die ganze Seilkraft ist als Hypotenuse größer.",
      zero: "Der Betrag der Geschwindigkeit bleibt gleich, ihre Richtung ändert sich aber ständig. Dafür ist eine resultierende Kraft zur Mitte nötig.",
    },
  },
];

function setupFinalQuiz() {
  quizItems.forEach((item) => renderMultipleChoice({ targetId: "exercise-final-quiz", ...item }));
}

// ---- Initialisierung nur im Browser ----

if (typeof document !== "undefined") {
  addSquareRootSigns();
  const stepTabs = setupPhysicsStepTabs();
  setupNextTabButtons(stepTabs);

  Object.values(NUMBER_TASKS).forEach(setupNumberTask);
  Object.values(STEP_TASKS).forEach(setupStepOrder);

  setupCarouselForcesTask();
  setupFinalQuiz();

  // Freischaltung der Ergebnisübersicht (Reiter 4): Jeder Klick auf
  // "Bahngeschwindigkeit prüfen" schaltet sie frei, unabhängig vom Ergebnis.
  document.getElementById(NUMBER_TASKS.task3b.buttonId).addEventListener("click", () => {
    document.getElementById("summary-pending").hidden = true;
    document.getElementById("summary-content").hidden = false;
  });
}
