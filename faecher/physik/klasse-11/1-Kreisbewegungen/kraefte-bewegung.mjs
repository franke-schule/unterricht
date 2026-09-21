import { createForceArrowGrid } from "./components/point-vector-grid.mjs";
import { setupPhysicsSemanticTask } from "./components/physics-semantic-task.mjs";
import { setupPhysicsStepTabs } from "./components/physics-step-tabs.mjs";
import { enableTokenDrag, wasDragged } from "./components/token-drag.mjs";
import { appendPhysicsText, physicsTextSpan } from "./components/physics-notation.mjs?v=20260911a";

const SCRIPT_SERVER_URL = "https://script.google.com/macros/s/AKfycby8RWL6uYrKZyoJ6m2GRpWyRmXjwsdskyCiqzKpRhIK5-wrDl-9lWWk8CiAGaVMoy0x/exec";
export { createForceArrowGrid, setupPhysicsSemanticTask, setupPhysicsStepTabs };

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

window.unlockSolution = unlockSolution;

function numberValue(value) {
  return Number.parseFloat(String(value).trim().replace(/\s+/g, "").replace(",", "."));
}

export function significantDigitCount(value) {
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

const ARROW_LENGTHS = [1, 3];
const DIAGONAL_DIRECTIONS = ["up-left", "up-right", "down-left", "down-right"];

function directionFromOrigin(point, origin = { x: 0, y: 0 }) {
  const x = point.x - origin.x;
  const y = point.y - origin.y;
  if (x === 0 && y === 0) return "other";
  const vertical = y > 0 ? "up" : y < 0 ? "down" : "";
  const horizontal = x > 0 ? "right" : "left";
  if (x === 0) return vertical;
  if (y === 0) return horizontal;
  return `${vertical}-${horizontal}`;
}

// Auswählbar sind die vier senkrechten und waagerechten Richtungen sowie die
// vier 45-Grad-Richtungen. Die schrägen Pfeile sind fachlich falsch, bilden
// aber eine verbreitete Fehlvorstellung ab und erhalten ein eigenes Feedback.
function isForceArrowPoint(point) {
  const x = Math.abs(point.x);
  const y = Math.abs(point.y);
  if (x === 0) return ARROW_LENGTHS.includes(y);
  if (y === 0) return ARROW_LENGTHS.includes(x);
  return x === y && ARROW_LENGTHS.includes(x);
}

function hasDirection(selections, directions) {
  return selections.some((selection) => directions.includes(selection.direction));
}

function drawParachutist(layer, { toSvgPoint, svgElement }) {
  const origin = toSvgPoint({ x: 0, y: 0 });
  const canopyY = origin.y - 126;
  layer.append(
    svgElement("path", { d: `M${origin.x - 105} ${canopyY + 35} Q${origin.x} ${canopyY - 42} ${origin.x + 105} ${canopyY + 35} Z`, class: "scene-fill" }),
    svgElement("line", { x1: origin.x - 78, y1: canopyY + 28, x2: origin.x - 16, y2: origin.y - 16, class: "scene-line" }),
    svgElement("line", { x1: origin.x + 78, y1: canopyY + 28, x2: origin.x + 16, y2: origin.y - 16, class: "scene-line" }),
    svgElement("circle", { cx: origin.x, cy: origin.y - 38, r: 13, class: "scene-accent" }),
    svgElement("line", { x1: origin.x, y1: origin.y - 24, x2: origin.x, y2: origin.y + 28, class: "scene-line" }),
    svgElement("line", { x1: origin.x, y1: origin.y - 8, x2: origin.x - 30, y2: origin.y + 10, class: "scene-line" }),
    svgElement("line", { x1: origin.x, y1: origin.y - 8, x2: origin.x + 30, y2: origin.y + 10, class: "scene-line" }),
    svgElement("line", { x1: origin.x, y1: origin.y + 28, x2: origin.x - 22, y2: origin.y + 64, class: "scene-line" }),
    svgElement("line", { x1: origin.x, y1: origin.y + 28, x2: origin.x + 22, y2: origin.y + 64, class: "scene-line" }),
    svgElement("circle", { cx: origin.x, cy: origin.y, r: 6, class: "force-origin-marker" })
  );
}

// Das Auto berührt die Wand am Bezugspunkt: Die Vorderfront steht direkt an
// der Wandfläche und ist eingedrückt, dazu zeigen kurze Bruchlinien den
// Schaden. So ist erkennbar, dass die Kräfte im Kontakt entstehen.
function drawCrash(layer, { toSvgPoint, svgElement }) {
  const origin = toSvgPoint({ x: 0, y: 0 });
  const wallFace = origin.x;
  layer.append(
    svgElement("rect", { x: wallFace - 120, y: origin.y - 120, width: 120, height: 240, class: "scene-fill" }),
    svgElement("line", { x1: wallFace - 96, y1: origin.y - 120, x2: wallFace - 96, y2: origin.y + 120, class: "scene-line" }),
    svgElement("path", {
      d: `M${wallFace} ${origin.y + 50} L${wallFace + 18} ${origin.y + 28} L${wallFace + 4} ${origin.y + 12}`
        + ` L${wallFace + 20} ${origin.y - 4} L${wallFace + 6} ${origin.y - 18} L${wallFace + 32} ${origin.y - 26}`
        + ` L${wallFace + 157} ${origin.y - 26} L${wallFace + 198} ${origin.y + 50} Z`,
      class: "scene-fill",
    }),
    svgElement("circle", { cx: wallFace + 60, cy: origin.y + 56, r: 22, class: "scene-accent" }),
    svgElement("circle", { cx: wallFace + 160, cy: origin.y + 56, r: 22, class: "scene-accent" }),
    svgElement("path", { d: `M${wallFace + 8} ${origin.y - 28} L${wallFace + 24} ${origin.y - 40} L${wallFace + 18} ${origin.y - 54}`, class: "scene-damage" }),
    svgElement("path", { d: `M${wallFace + 28} ${origin.y + 52} L${wallFace + 14} ${origin.y + 62} L${wallFace + 28} ${origin.y + 72}`, class: "scene-damage" }),
    svgElement("circle", { cx: origin.x, cy: origin.y, r: 6, class: "force-origin-marker" })
  );
}

function setupForceDrawingTasks() {
  const gridConfig = { xRange: { min: -3, max: 3 }, yRange: { min: -3, max: 3 }, isSelectablePoint: isForceArrowPoint };
  const parachute = createForceArrowGrid(document.getElementById("parachute-force-grid"), { ...gridConfig, origin: { x: 0, y: 0 }, renderIllustration: drawParachutist, directionKey: directionFromOrigin, label: "Fallschirmspringer: Kraftpfeile vom Bezugspunkt an der Person" });
  const crash = createForceArrowGrid(document.getElementById("crash-force-grid"), { ...gridConfig, origin: { x: 0, y: 0 }, renderIllustration: drawCrash, directionKey: directionFromOrigin, label: "Crashtest: Kraftpfeile am Kontaktpunkt zwischen Auto und Wand" });
  document.getElementById("check-parachute-forces").addEventListener("click", () => {
    const selections = parachute.getSelections();
    const up = selections.find((selection) => selection.direction === "up");
    const down = selections.find((selection) => selection.direction === "down");
    if (!selections.length) setFeedback("parachute-feedback", "error", "Es fehlen beide Kraftpfeile. Zeichne einen Pfeil nach oben und einen nach unten.");
    else if (hasDirection(selections, DIAGONAL_DIRECTIONS)) setFeedback("parachute-feedback", "error", "Ein schräger Pfeil passt hier nicht. Die Gravitationskraft zieht jeden Körper auf der Erde zum Erdmittelpunkt, sie zeigt also senkrecht nach unten. Der Luftwiderstand wirkt ihr genau entgegen und zeigt deshalb senkrecht nach oben.");
    else if (hasDirection(selections, ["left", "right"])) setFeedback("parachute-feedback", "error", "Ein waagerechter Pfeil passt hier nicht. Die Gravitationskraft ist zum Erdmittelpunkt gerichtet, also senkrecht nach unten. Seitwärts wirkt beim ruhigen Sinkflug keine Kraft.");
    else if (!down) setFeedback("parachute-feedback", "partial", "Der Pfeil nach oben stimmt. Es fehlt noch die Gravitationskraft: Sie ist auf der Erde immer zum Erdmittelpunkt gerichtet und zeigt deshalb senkrecht nach unten.");
    else if (!up) setFeedback("parachute-feedback", "partial", "Der Pfeil nach unten stimmt. Es fehlt noch die Kraft, die der Gravitationskraft entgegenwirkt: Der Luftwiderstand bremst den Fall und zeigt senkrecht nach oben.");
    else if (Math.abs(up.y) !== Math.abs(down.y)) setFeedback("parachute-feedback", "partial", "Die Richtungen stimmen. Der Springer sinkt aber mit konstanter Geschwindigkeit, deshalb müssen beide Pfeile gleich lang sein.");
    else setFeedback("parachute-feedback", "success", "Korrekt: Gewichtskraft und Luftwiderstandskraft sind gleich groß und entgegengesetzt gerichtet. Die resultierende Kraft ist null.");
  });
  document.getElementById("check-crash-forces").addEventListener("click", () => {
    const selections = crash.getSelections();
    const left = selections.find((selection) => selection.direction === "left");
    const right = selections.find((selection) => selection.direction === "right");
    if (!selections.length) setFeedback("crash-feedback", "error", "Es fehlen beide Kraftpfeile. Zeichne am Kontaktpunkt einen Pfeil nach links und einen nach rechts.");
    else if (hasDirection(selections, DIAGONAL_DIRECTIONS)) setFeedback("crash-feedback", "error", "Ein schräger Pfeil passt hier nicht. Auto und Wand drücken genau entlang der Fahrtrichtung gegeneinander: Das Auto drückt waagerecht nach links gegen die Wand, die Wand drückt waagerecht nach rechts zurück.");
    else if (hasDirection(selections, ["up", "down"])) setFeedback("crash-feedback", "error", "Ein senkrechter Pfeil passt hier nicht. Der Stoß erfolgt waagerecht: Das Auto trifft die Wand in Fahrtrichtung, und die Wand antwortet in genau der Gegenrichtung.");
    else if (!left) setFeedback("crash-feedback", "partial", "Der Pfeil nach rechts stimmt: So drückt die Wand auf das Auto. Es fehlt noch die Kraft, mit der das Auto auf die Wand drückt — sie zeigt nach links.");
    else if (!right) setFeedback("crash-feedback", "partial", "Der Pfeil nach links stimmt: So drückt das Auto auf die Wand. Es fehlt noch die Gegenkraft der Wand auf das Auto — sie zeigt nach rechts.");
    else if (Math.abs(left.x) !== Math.abs(right.x)) setFeedback("crash-feedback", "partial", "Die Richtungen stimmen. Wechselwirkungskräfte sind immer gleich groß, deshalb müssen beide Pfeile gleich lang sein.");
    else setFeedback("crash-feedback", "success", "Korrekt: Die Kräfte sind gleich groß und entgegengesetzt gerichtet. Sie wirken auf verschiedene Körper und bilden deshalb kein Kräftegleichgewicht an einem einzelnen Körper.");
  });
}

// Formelzeichen werden als mathematisches Symbol angezeigt (F mit Vektorpfeil,
// Δt, m, Δv mit Vektorpfeil). Der ausgeschriebene Name steht nur noch in den
// zugänglichen Beschriftungen.
function appendFormulaSymbol(target, symbol) {
  if (symbol === "mass") { target.append(document.createTextNode("m")); return; }
  if (symbol === "time") { target.append(document.createTextNode("Δt")); return; }
  if (symbol === "velocity") target.append(document.createTextNode("Δ"));
  const vector = document.createElement("span");
  vector.className = "vector-symbol";
  vector.setAttribute("aria-hidden", "true");
  vector.textContent = symbol === "force" ? "F" : "v";
  target.append(vector);
}

function setupLawTermMatching() {
  const terms = [
    { symbol: "force", spoken: "Vektor F", expected: "Kraft" },
    { symbol: "time", spoken: "Delta t", expected: "Zeitspanne" },
    { symbol: "mass", spoken: "m", expected: "Masse" },
    { symbol: "velocity", spoken: "Delta Vektor v", expected: "Geschwindigkeitsänderung" },
  ];
  // Alphabetisch, damit die Reihenfolge im Wortspeicher nichts verrät.
  const quantities = ["Geschwindigkeitsänderung", "Kraft", "Masse", "Zeitspanne"];
  const assignment = new Map(terms.map((term) => [term.symbol, ""]));
  const slots = new Map();
  const feedbacks = new Map();
  let picked = null; // { value, from } mit from = Formelzeichen oder null (Wortspeicher)

  const target = document.getElementById("law-term-matching");
  const bank = document.createElement("div");
  bank.className = "cloze-term-bank law-term-bank";
  bank.setAttribute("aria-label", "Wortspeicher der Größen");
  const grid = document.createElement("div");
  grid.className = "law-term-grid";

  function hideFeedback(symbol) {
    const feedback = feedbacks.get(symbol);
    if (feedback) feedback.hidden = true;
    slots.get(symbol)?.classList.remove("is-correct", "is-wrong");
  }

  function place(value, from, toSymbol) {
    if (from) assignment.set(from, "");
    if (toSymbol) {
      const previous = assignment.get(toSymbol);
      assignment.set(toSymbol, value);
      if (from && previous) assignment.set(from, previous);
    }
    picked = null;
    [from, toSymbol].filter(Boolean).forEach(hideFeedback);
    render();
  }

  function render() {
    const used = [...assignment.values()];
    bank.replaceChildren(...quantities.filter((quantity) => !used.includes(quantity)).map((quantity) => {
      const token = document.createElement("button");
      token.type = "button";
      token.className = "cloze-token";
      token.textContent = quantity;
      const isPicked = picked?.value === quantity && !picked.from;
      token.setAttribute("aria-pressed", String(isPicked));
      token.classList.toggle("is-picked", isPicked);
      enableTokenDrag(token, {
        getLabel: () => quantity,
        dropSelector: "#law-term-matching .law-term-slot",
        bankSelector: "#law-term-matching .law-term-bank",
        onDrop: (slot) => { if (slot) place(quantity, null, slot.dataset.symbol); else render(); },
      });
      token.addEventListener("click", () => {
        if (wasDragged(token)) return;
        picked = isPicked ? null : { value: quantity, from: null };
        render();
        if (picked) (grid.querySelector(".law-term-slot:not(.is-filled)") || grid.querySelector(".law-term-slot"))?.focus();
      });
      return token;
    }));
    slots.forEach((slot, symbol) => {
      const value = assignment.get(symbol);
      const term = terms.find((entry) => entry.symbol === symbol);
      slot.textContent = value || " ";
      slot.classList.toggle("is-filled", Boolean(value));
      slot.classList.toggle("is-picked", picked?.from === symbol);
      slot.setAttribute("aria-label", `Größe zu ${term.spoken}: ${value || "leer"}`);
    });
  }

  terms.forEach((term, index) => {
    const card = document.createElement("article");
    card.className = "law-term-card";
    const heading = document.createElement("h4");
    heading.setAttribute("aria-label", term.spoken);
    appendFormulaSymbol(heading, term.symbol);

    const slot = document.createElement("button");
    slot.type = "button";
    slot.className = "cloze-gap law-term-slot";
    slot.dataset.symbol = term.symbol;
    slots.set(term.symbol, slot);

    const button = document.createElement("button");
    button.type = "button";
    button.className = "physics-primary-button direct-check-button";
    appendFormulaSymbol(button, term.symbol);
    button.append(document.createTextNode(" prüfen"));
    button.setAttribute("aria-label", `Zuordnung zu ${term.spoken} prüfen`);

    const feedback = document.createElement("div");
    feedback.id = `law-term-feedback-${index}`;
    feedback.className = "physics-feedback compact-feedback";
    feedback.setAttribute("role", "status");
    feedback.setAttribute("aria-live", "polite");
    feedback.hidden = true;
    feedbacks.set(term.symbol, feedback);

    enableTokenDrag(slot, {
      getLabel: () => assignment.get(term.symbol),
      dropSelector: "#law-term-matching .law-term-slot",
      bankSelector: "#law-term-matching .law-term-bank",
      onDrop: (dropSlot, onBank) => {
        const value = assignment.get(term.symbol);
        if (dropSlot && dropSlot.dataset.symbol !== term.symbol) place(value, term.symbol, dropSlot.dataset.symbol);
        else if (onBank) place(value, term.symbol, null);
        else render();
      },
    });
    slot.addEventListener("click", () => {
      if (wasDragged(slot)) return;
      const value = assignment.get(term.symbol);
      if (picked && picked.from !== term.symbol) { place(picked.value, picked.from, term.symbol); slot.focus(); return; }
      if (picked && picked.from === term.symbol) { place(value, term.symbol, null); return; }
      if (value) { picked = { value, from: term.symbol }; render(); slot.focus(); }
    });

    button.addEventListener("click", () => {
      const value = assignment.get(term.symbol);
      if (!value) setFeedback(feedback, "error", "Ziehe zuerst eine Größe in das Feld.");
      else if (value === term.expected) { slot.classList.add("is-correct"); slot.classList.remove("is-wrong"); setFeedback(feedback, "success", "Korrekt."); }
      else { slot.classList.add("is-wrong"); slot.classList.remove("is-correct"); setFeedback(feedback, "partial", "Noch nicht korrekt. Lies das Formelzeichen im Grundgesetz noch einmal genau."); }
    });

    card.append(heading, slot, button, feedback);
    grid.append(card);
  });

  target.append(bank, grid);
  render();
}

function setupLawCloze() {
  const terms = ["Zeit", "Kraft", "Masse m", "Geschwindigkeitsänderung", "Richtung der Kraft", "Richtung der Geschwindigkeitsänderung"];
  const parts = [
    "Wirkt auf einen beweglichen Körper eine bestimmte ",
    " lang eine ",
    ", dann erfährt dieser Körper mit der ",
    " eine ",
    ". Die ",
    " ist gleich der ",
    ".",
  ];
  // Alphabetisch, damit die Reihenfolge im Wortspeicher nichts verrät.
  const bankOrder = [...terms].sort((left, right) => left.localeCompare(right, "de"));
  const choices = terms.map(() => "");
  // Der letzte Satz beschreibt eine Gleichheit. Deshalb ist auch die
  // vertauschte Reihenfolge der beiden letzten Lücken fachlich richtig.
  const swappableGaps = [4, 5];
  const countCorrectGaps = () => {
    const swapped = swappableGaps.every((gap, index) => choices[gap] === terms[swappableGaps[1 - index]]);
    return choices.filter((choice, index) => (swapped && swappableGaps.includes(index) ? true : choice === terms[index])).length;
  };
  let picked = null; // { value, from } mit from = Lückenindex oder -1 (Wortspeicher)

  const target = document.getElementById("law-cloze");
  const bank = document.createElement("div");
  bank.className = "cloze-term-bank";
  bank.setAttribute("aria-label", "Wortspeicher");
  const sentence = document.createElement("p");
  sentence.className = "cloze-sentence";
  const feedback = document.getElementById("law-cloze-feedback");

  function place(value, from, gapIndex) {
    if (from >= 0) choices[from] = "";
    if (gapIndex >= 0) {
      const previous = choices[gapIndex];
      choices[gapIndex] = value;
      if (from >= 0 && previous) choices[from] = previous;
    }
    picked = null;
    feedback.hidden = true;
    render();
  }

  function render() {
    bank.replaceChildren(...bankOrder.filter((term) => !choices.includes(term)).map((term) => {
      const token = document.createElement("button");
      token.type = "button";
      token.className = "cloze-token";
      token.textContent = term;
      const isPicked = picked?.value === term && picked.from === -1;
      token.setAttribute("aria-pressed", String(isPicked));
      token.classList.toggle("is-picked", isPicked);
      enableTokenDrag(token, {
        getLabel: () => term,
        dropSelector: "#law-cloze .cloze-gap",
        bankSelector: "#law-cloze .cloze-term-bank",
        onDrop: (gap) => { if (gap) place(term, -1, Number(gap.dataset.index)); else render(); },
      });
      token.addEventListener("click", () => {
        if (wasDragged(token)) return;
        picked = isPicked ? null : { value: term, from: -1 };
        render();
        if (picked) (sentence.querySelector(".cloze-gap:not(.is-filled)") || sentence.querySelector(".cloze-gap"))?.focus();
      });
      return token;
    }));

    sentence.replaceChildren();
    parts.forEach((part, index) => {
      sentence.append(document.createTextNode(part));
      if (index >= terms.length) return;
      const value = choices[index];
      const gap = document.createElement("button");
      gap.type = "button";
      gap.className = "cloze-gap";
      gap.dataset.index = String(index);
      gap.textContent = value || " ";
      gap.classList.toggle("is-filled", Boolean(value));
      // Kein Abstand vor einem Satzzeichen, das direkt an die Lücke anschließt.
      gap.classList.toggle("is-attached", /^\S/.test(parts[index + 1]));
      gap.classList.toggle("is-picked", picked?.from === index);
      gap.setAttribute("aria-label", `Lücke ${index + 1}: ${value || "leer"}`);
      enableTokenDrag(gap, {
        getLabel: () => choices[index],
        dropSelector: "#law-cloze .cloze-gap",
        bankSelector: "#law-cloze .cloze-term-bank",
        onDrop: (dropGap, onBank) => {
          if (dropGap && Number(dropGap.dataset.index) !== index) place(value, index, Number(dropGap.dataset.index));
          else if (onBank) place(value, index, -1);
          else render();
        },
      });
      gap.addEventListener("click", () => {
        if (wasDragged(gap)) return;
        if (picked && picked.from !== index) { place(picked.value, picked.from, index); sentence.querySelector(`[data-index="${index}"]`)?.focus(); return; }
        if (picked && picked.from === index) { place(value, index, -1); return; }
        if (value) { picked = { value, from: index }; render(); sentence.querySelector(`[data-index="${index}"]`)?.focus(); }
      });
      sentence.append(gap);
    });
  }

  target.append(bank, sentence);
  render();

  document.getElementById("check-law-cloze").addEventListener("click", () => {
    const correct = countCorrectGaps();
    if (correct === terms.length) setFeedback(feedback, "success", "Korrekt: Der Text beschreibt alle sechs Größen fachlich richtig. Im letzten Satz dürfen die beiden Richtungen auch vertauscht stehen, denn beide Richtungen sind gleich.");
    else if (correct) setFeedback(feedback, "partial", `${correct} von ${terms.length} Lücken stimmen. Prüfe noch die Begriffe an den anderen Stellen.`);
    else setFeedback(feedback, "error", "Noch nicht korrekt. Ziehe die Begriffe in die sechs Lücken und prüfe erneut.");
  });
  document.getElementById("reset-law-cloze").addEventListener("click", () => {
    choices.fill("");
    picked = null;
    feedback.hidden = true;
    render();
    sentence.querySelector(".cloze-gap")?.focus();
  });
}

function setupSortableSteps() {
  const steps = [{ id: "mass", text: "Masse umrechnen: 100 g = 0,100 kg" }, { id: "formula", text: "Formel nach a umstellen: a = {{F|m}}" }, { id: "insert", text: "Werte einsetzen: a = {{1,2 N|0,100 kg}}" }, { id: "calculate", text: "Berechnen und gültige Ziffern beachten: a = 12 {{m/s²}}" }];
  const target = document.getElementById("acceleration-steps");
  const order = ["insert", "mass", "calculate", "formula"];
  const render = () => { target.replaceChildren(...order.map((id) => { const definition = steps.find((step) => step.id === id); const item = document.createElement("div"); item.className = "sortable-step"; item.draggable = true; item.dataset.stepId = id; const text = document.createElement("span"); appendPhysicsText(text, definition.text); const controls = document.createElement("span"); controls.className = "sortable-step-controls"; [["↑", -1, "Nach oben"], ["↓", 1, "Nach unten"]].forEach(([label, offset, name]) => { const button = document.createElement("button"); button.type = "button"; button.className = "sort-step-button"; button.textContent = label; button.setAttribute("aria-label", `${name}: ${definition.text}`); button.addEventListener("click", () => { const index = order.indexOf(id); const next = index + offset; if (next < 0 || next >= order.length) return; [order[index], order[next]] = [order[next], order[index]]; render(); }); controls.append(button); }); item.append(text, controls); item.addEventListener("dragstart", (event) => { event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", id); }); item.addEventListener("dragover", (event) => { event.preventDefault(); item.classList.add("is-drop-target"); }); item.addEventListener("dragleave", () => item.classList.remove("is-drop-target")); item.addEventListener("drop", (event) => { event.preventDefault(); item.classList.remove("is-drop-target"); const dragged = event.dataTransfer.getData("text/plain"); const from = order.indexOf(dragged); const to = order.indexOf(id); if (from < 0 || to < 0 || from === to) return; order.splice(to, 0, order.splice(from, 1)[0]); render(); }); return item; })); };
  render();
  document.getElementById("check-acceleration-steps").addEventListener("click", () => { if (order.every((id, index) => id === steps[index].id)) setFeedback("acceleration-steps-feedback", "success", "Korrekt: Umrechnung, Umstellung, Einsetzen und Berechnung sind richtig geordnet."); else setFeedback("acceleration-steps-feedback", "error", "Noch nicht korrekt. Beginne mit der Umrechnung der Masse und setze danach die Formel um."); });
}

// optionHints ordnet einzelnen falschen Antworten eine eigene Rückmeldung zu.
// So erfahren die Schülerinnen und Schüler, warum genau ihre Auswahl nicht
// passt, statt nur einen allgemeinen Hinweis zu lesen.
function renderMultipleChoice({ targetId, taskNumber, question, options, correct, success, hint, optionHints = {} }) {
  const target = document.getElementById(targetId); const fieldset = document.createElement("fieldset"); fieldset.className = "physics-quiz-question quiz-question"; const legend = document.createElement("legend"); appendPhysicsText(legend, `Aufgabe ${taskNumber} · ${question}`); const optionWrap = document.createElement("div"); optionWrap.className = "quiz-options";
  options.forEach(([value, labelText]) => { const label = document.createElement("label"); label.className = "quiz-option"; const input = document.createElement("input"); input.type = "checkbox"; input.name = `${targetId}-answers`; input.value = value; input.addEventListener("change", () => { feedback.hidden = true; }); label.append(input, physicsTextSpan(labelText, "quiz-option-text")); optionWrap.append(label); });
  const button = document.createElement("button"); button.type = "button"; button.className = "physics-primary-button direct-check-button"; button.textContent = `Aufgabe ${taskNumber} prüfen`; const feedback = document.createElement("p"); feedback.className = "physics-feedback"; feedback.setAttribute("role", "status"); feedback.setAttribute("aria-live", "polite"); feedback.hidden = true;
  button.addEventListener("click", () => { const selected = [...fieldset.querySelectorAll("input:checked")].map((input) => input.value); const correctSelected = selected.filter((value) => correct.includes(value)); const extras = selected.filter((value) => !correct.includes(value)); const exact = selected.length === correct.length && selected.every((value) => correct.includes(value)); const extraHint = extras.map((value) => optionHints[value]).find(Boolean); if (exact) setFeedback(feedback, "success", success); else if (correctSelected.length && !extras.length) setFeedback(feedback, "partial", `Teilweise korrekt: Mindestens eine richtige Aussage fehlt noch. ${hint}`); else if (!selected.length) setFeedback(feedback, "error", "Wähle mindestens zwei Aussagen aus und prüfe dann erneut."); else setFeedback(feedback, "error", `Noch nicht korrekt. ${extraHint || hint}`); });
  fieldset.append(legend, optionWrap, button, feedback); target.append(fieldset);
}

function setupMultipleChoiceTasks() {
  const constantSpeedHint = "Achtung: Der Fallschirmspringer fliegt nach einer gewissen Zeit mit konstanter Geschwindigkeit nach unten. Was gilt immer bei konstanter Geschwindigkeit?";
  renderMultipleChoice({ targetId: "parachute-multiple-choice", taskNumber: "4b", question: "Welche Aussagen treffen in diesem Szenario zu?", correct: ["balance", "both"], options: [["balance", "Es herrscht ein Kräftegleichgewicht."], ["weight", "Es wirkt nur die Gewichtskraft {{F_G}}."], ["air", "Es wirkt nur die Luftwiderstandskraft {{F_R}}."], ["both", "Es wirken die Gewichtskraft {{F_G}} und die Luftwiderstandskraft {{F_R}}."], ["greater", "Die Gewichtskraft {{F_G}} ist größer als die Luftwiderstandskraft {{F_R}}."], ["smaller", "Die Gewichtskraft {{F_G}} ist kleiner als die Luftwiderstandskraft {{F_R}}."]], success: "Korrekt: Beide Kräfte wirken, sind gleich groß und bilden ein Kräftegleichgewicht.", hint: "Bei konstanter Geschwindigkeit wirken mehrere Kräfte, deren Summe null ist.", optionHints: { greater: constantSpeedHint, smaller: constantSpeedHint, weight: "Wirkte nur die Gewichtskraft, würde der Springer immer schneller werden. Er sinkt aber mit konstanter Geschwindigkeit.", air: "Die Gewichtskraft wirkt auf der Erde immer. Sie verschwindet nicht, wenn sich der Fallschirm öffnet." } });
  renderMultipleChoice({ targetId: "crash-multiple-choice", taskNumber: "6b", question: "Welche Aussagen über die beiden Kräfte beim Zusammenstoß sind richtig?", correct: ["same", "opposite", "different"], options: [["balance", "Die beiden Kräfte bilden ein Kräftegleichgewicht an einem einzigen Körper."], ["same", "Die beiden Kräfte haben den gleichen Betrag."], ["wall", "Die Wand übt grundsätzlich die größere Kraft aus."], ["different", "Die beiden Kräfte wirken auf zwei verschiedene Körper."], ["opposite", "Die beiden Kräfte sind entgegengesetzt gerichtet."]], success: "Korrekt: Die Kraft des Autos auf die Wand und die Kraft der Wand auf das Auto sind gleich groß und entgegengesetzt gerichtet. Sie wirken aber auf unterschiedliche Körper und bilden deshalb kein Kräftegleichgewicht an einem einzelnen Körper.", hint: "Vergleiche Betrag, Richtung und den Körper, auf den die jeweilige Kraft wirkt." });
}

function setupFinalQuiz() {
  const items = [
    { taskNumber: "7a", question: "Welche Aussagen zum newtonschen Grundgesetz sind richtig?", correct: ["law", "impulse"], options: [["always", "Jede Kraft hält die Geschwindigkeit konstant."], ["law", "Der Kraftimpuls entspricht der Änderung des Bewegungsimpulses."], ["unit", "Die Einheit des Kraftimpulses ist {{m/s²}}."], ["impulse", "Eine längere Einwirkzeit kann bei gleicher Kraft die Geschwindigkeitsänderung vergrößern."]], hint: "Achte darauf, welche Größen im Grundgesetz verbunden werden." },
    { taskNumber: "7b", question: "Welche Aussagen über Kraft und Geschwindigkeitsänderung sind richtig?", correct: ["force", "mass"], options: [["force", "Bei gleicher Masse führt eine größere Kraft zu einer größeren Beschleunigung."], ["direction", "Die Richtung der Kraft ist immer unabhängig von der Geschwindigkeitsänderung."], ["mass", "Bei gleicher Kraft beschleunigt eine kleinere Masse stärker."], ["none", "Eine Kraft kann die Geschwindigkeit eines Körpers niemals ändern."]], hint: "Vergleiche Kraft, Masse und die Änderung der Bewegung." },
    { taskNumber: "7c", question: "Welche Aussagen beschreiben ein Kräftegleichgewicht richtig?", correct: ["sum", "constant"], options: [["only", "Es darf nur eine einzige Kraft wirken."], ["constant", "Der Bewegungszustand bleibt gleich: Ruhe oder gleichförmige Bewegung."], ["acceleration", "Ein Kräftegleichgewicht bedeutet immer eine Beschleunigung."], ["sum", "Die resultierende Kraft beziehungsweise Kraftsumme ist null."]], hint: "Kräftegleichgewicht sagt etwas über die Summe der Kräfte und die Bewegungsänderung aus." },
    { taskNumber: "7d", question: "Welche Aussagen zu Wechselwirkungskräften sind richtig?", correct: ["same", "different"], options: [["different", "Sie wirken auf zwei verschiedene Körper."], ["wall", "Bei einem Zusammenstoß ist die Kraft der Wand grundsätzlich größer."], ["one", "Sie heben sich als Kräfte auf einem einzigen Körper auf."], ["same", "Sie sind gleich groß und entgegengesetzt gerichtet."]], hint: "Prüfe Richtung, Betrag und den jeweiligen Körper." },
    { taskNumber: "7e", question: "Welche Aussagen zu Einheiten und gültigen Ziffern sind richtig?", correct: ["acceleration", "digits"], options: [["round", "Bei 1,2 N und 100 g muss das Ergebnis immer drei gültige Ziffern besitzen."], ["acceleration", "Eine mögliche Einheit der Beschleunigung ist {{m/s²}}."], ["digits", "12 besitzt zwei gültige Ziffern, 12,0 dagegen drei."], ["speed", "{{m/s}} ist die Einheit einer Kraft."]], hint: "Unterscheide die Einheiten von Geschwindigkeit, Beschleunigung und Kraft und zähle die Ziffern." },
  ];
  items.forEach((item) => renderMultipleChoice({ targetId: "physics-quiz", ...item, success: "Korrekt: Alle richtigen Aussagen und keine falsche Aussage sind ausgewählt." }));
}

function setupAccelerationCalculation() {
  document.getElementById("check-force-acceleration").addEventListener("click", () => {
    const input = document.getElementById("force-acceleration-answer"); const value = numberValue(input.value); const digits = significantDigitCount(input.value); const unit = document.getElementById("force-acceleration-unit").value; const valueCorrect = Number.isFinite(value) && Math.abs(value - 12) <= 0.01; const unitCorrect = unit === "m/s²";
    if (!unit) setFeedback("force-acceleration-feedback", "error", "Wähle zuerst die Einheit im Auswahlfeld neben dem Eingabefeld aus.");
    else if (valueCorrect && unitCorrect && digits === 2) setFeedback("force-acceleration-feedback", "success", "Richtig: 12 {{m/s²}} besitzt zwei gültige Ziffern. Die Angabe 100 g besitzt drei gültige Ziffern, die Angabe 1,2 N zwei gültige Ziffern. Das Endergebnis wird auf die ungenaueste Angabe gerundet – also auf die Angabe mit der geringsten Anzahl gültiger Ziffern.");
    else if (valueCorrect && unitCorrect && digits !== 2) setFeedback("force-acceleration-feedback", "partial", "Dein Zahlenwert ist richtig, aber 12,0 besitzt drei gültige Ziffern. Die ungenaueste Angabe ist 1,2 N mit zwei gültigen Ziffern. Gib das Endergebnis deshalb ebenfalls mit zwei gültigen Ziffern an.");
    else if (valueCorrect && !unitCorrect) setFeedback("force-acceleration-feedback", "partial", "Der Zahlenwert ist richtig. Wähle als Einheit der Beschleunigung {{m/s²}} und achte auf zwei gültige Ziffern.");
    else setFeedback("force-acceleration-feedback", "error", "Noch nicht korrekt. Rechne 100 g zuerst in Kilogramm um und nutze a = {{F|m}}. Prüfe Zahlenwert, Einheit und gültige Ziffern getrennt.");
  });
}

// Weiter-Buttons am Ende jedes Reiterinhalts (außer im letzten Reiter).
function setupNextTabButtons(stepTabs) {
  document.querySelectorAll("[data-next-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      stepTabs.goToTab(button.dataset.nextTab, true);
      document.querySelector(".physics-step-tabs")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    });
  });
}

const physicsStepTabs = setupPhysicsStepTabs();
setupNextTabButtons(physicsStepTabs);
setupLawTermMatching();
setupLawCloze();
setupSortableSteps();
setupAccelerationCalculation();
setupForceDrawingTasks();
setupMultipleChoiceTasks();
setupFinalQuiz();
// Der Angriffspunkt der Kräfte gehört nicht zum Erwartungshorizont, soll aber
// in jeder Rückmeldung zu Aufgabe 5 hervorgehoben werden.
function forceBalanceFeedback(result) {
  const content = document.createDocumentFragment();
  if (result.feedback) {
    const serverFeedback = document.createElement("p");
    serverFeedback.textContent = result.feedback;
    content.append(serverFeedback);
  }
  const note = document.createElement("p");
  note.className = "physics-semantic-note";
  appendPhysicsText(note, "**Die Gewichtskraft greift immer im Körpermittelpunkt per Definition. Die Gegenkraft des Tisches greift am Kontaktpunkt zwischen Körper und Tisch.**");
  content.append(note);
  return content;
}

setupPhysicsSemanticTask({ answerId: "force-balance-answer", buttonId: "check-force-balance", feedbackId: "force-balance-feedback", countId: "force-balance-count", taskId: "ph11-kreisbewegungen-kraeftegleichgewicht-beschreibung", serverUrl: SCRIPT_SERVER_URL, feedbackBuilder: forceBalanceFeedback, shortAnswerHint: "Formuliere eine etwas ausführlichere Begründung zu beiden Abbildungen." });
