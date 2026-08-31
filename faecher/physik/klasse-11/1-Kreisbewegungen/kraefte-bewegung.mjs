import { createForceArrowGrid } from "./components/point-vector-grid.mjs";
import { setupPhysicsSemanticTask } from "./components/physics-semantic-task.mjs";
import { setupPhysicsStepTabs } from "./components/physics-step-tabs.mjs";

const SCRIPT_SERVER_URL = "https://script.google.com/macros/s/AKfycby8RWL6uYrKZyoJ6m2GRpWyRmXjwsdskyCiqzKpRhIK5-wrDl-9lWWk8CiAGaVMoy0x/exec";
export { createForceArrowGrid, setupPhysicsSemanticTask, setupPhysicsStepTabs };

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
  box.textContent = message;
}

function directionFromOrigin(point, origin = { x: 0, y: 0 }) {
  const x = point.x - origin.x;
  const y = point.y - origin.y;
  if (x === 0 && y > 0) return "up";
  if (x === 0 && y < 0) return "down";
  if (y === 0 && x < 0) return "left";
  if (y === 0 && x > 0) return "right";
  return "other";
}

function isCardinalForcePoint(point) {
  const direction = directionFromOrigin(point);
  const distance = Math.abs(point.x) + Math.abs(point.y);
  return direction !== "other" && (distance === 1 || distance === 3);
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

function drawCrash(layer, { toSvgPoint, svgElement }) {
  const origin = toSvgPoint({ x: 0, y: 0 });
  layer.append(
    svgElement("rect", { x: origin.x - 70, y: origin.y - 116, width: 44, height: 232, class: "scene-fill" }),
    svgElement("line", { x1: origin.x - 25, y1: origin.y - 116, x2: origin.x - 25, y2: origin.y + 116, class: "scene-line" }),
    svgElement("path", { d: `M${origin.x + 4} ${origin.y + 50} L${origin.x + 38} ${origin.y - 26} L${origin.x + 157} ${origin.y - 26} L${origin.x + 198} ${origin.y + 50} Z`, class: "scene-fill" }),
    svgElement("circle", { cx: origin.x + 54, cy: origin.y + 56, r: 22, class: "scene-accent" }),
    svgElement("circle", { cx: origin.x + 157, cy: origin.y + 56, r: 22, class: "scene-accent" }),
    svgElement("line", { x1: origin.x - 25, y1: origin.y, x2: origin.x + 4, y2: origin.y, class: "scene-line" }),
    svgElement("circle", { cx: origin.x, cy: origin.y, r: 6, class: "force-origin-marker" })
  );
}

function setupForceDrawingTasks() {
  const gridConfig = { xRange: { min: -3, max: 3 }, yRange: { min: -3, max: 3 }, isSelectablePoint: isCardinalForcePoint, hitRadius: 48 };
  const parachute = createForceArrowGrid(document.getElementById("parachute-force-grid"), { ...gridConfig, origin: { x: 0, y: 0 }, renderIllustration: drawParachutist, directionKey: directionFromOrigin, label: "Fallschirmspringer: Kraftpfeile vom Bezugspunkt an der Person" });
  const crash = createForceArrowGrid(document.getElementById("crash-force-grid"), { ...gridConfig, origin: { x: 0, y: 0 }, renderIllustration: drawCrash, directionKey: directionFromOrigin, label: "Crashtest: Kraftpfeile am Kontaktpunkt zwischen Auto und Wand" });
  document.getElementById("check-parachute-forces").addEventListener("click", () => {
    const selections = parachute.getSelections();
    const up = selections.find((selection) => selection.direction === "up");
    const down = selections.find((selection) => selection.direction === "down");
    const hasWrongDirection = selections.some((selection) => !["up", "down"].includes(selection.direction));
    if (!selections.length) setFeedback("parachute-feedback", "error", "Es fehlen beide Kraftpfeile. Zeichne einen Pfeil nach oben und einen nach unten.");
    else if (hasWrongDirection) setFeedback("parachute-feedback", "error", "Prüfe die Richtungen der beiden Kräfte: Beim Fallschirmspringer verlaufen sie senkrecht nach oben und unten.");
    else if (!up || !down) setFeedback("parachute-feedback", "partial", "Zeichne noch den zweiten Kraftpfeil ein: einen Pfeil nach oben und einen nach unten.");
    else if (Math.abs(up.y) !== Math.abs(down.y)) setFeedback("parachute-feedback", "partial", "Bei konstanter Geschwindigkeit müssen die Beträge der beiden Kräfte gleich groß sein.");
    else setFeedback("parachute-feedback", "success", "Korrekt: Gewichtskraft und Luftwiderstandskraft sind gleich groß und entgegengesetzt gerichtet. Die resultierende Kraft ist null.");
  });
  document.getElementById("check-crash-forces").addEventListener("click", () => {
    const selections = crash.getSelections();
    const left = selections.find((selection) => selection.direction === "left");
    const right = selections.find((selection) => selection.direction === "right");
    const hasWrongDirection = selections.some((selection) => !["left", "right"].includes(selection.direction));
    if (!selections.length) setFeedback("crash-feedback", "error", "Es fehlen beide Kraftpfeile. Zeichne am Kontaktpunkt einen Pfeil nach links und einen nach rechts.");
    else if (hasWrongDirection) setFeedback("crash-feedback", "error", "Prüfe die Richtungen: Die Wechselwirkungskräfte verlaufen waagerecht und entgegengesetzt.");
    else if (!left || !right) setFeedback("crash-feedback", "partial", "Zeichne noch den zweiten Kraftpfeil ein.");
    else if (Math.abs(left.x) !== Math.abs(right.x)) setFeedback("crash-feedback", "partial", "Die Richtungen stimmen. Bei Wechselwirkungskräften müssen die Beträge gleich groß sein.");
    else setFeedback("crash-feedback", "success", "Korrekt: Die Kräfte sind gleich groß und entgegengesetzt gerichtet. Sie wirken auf verschiedene Körper und bilden deshalb kein Kräftegleichgewicht an einem einzelnen Körper.");
  });
}

function setupLawTermMatching() {
  const terms = [
    { symbol: "force", spoken: "Vektor F", expected: "Kraft" },
    { symbol: "time", spoken: "Delta t", expected: "Zeitspanne" },
    { symbol: "mass", spoken: "m", expected: "Masse" },
    { symbol: "velocity", spoken: "Delta Vektor v", expected: "Geschwindigkeitsänderung" },
  ];
  const optionOrders = [
    ["Masse", "Kraft", "Geschwindigkeitsänderung", "Zeitspanne"],
    ["Geschwindigkeitsänderung", "Masse", "Zeitspanne", "Kraft"],
    ["Zeitspanne", "Geschwindigkeitsänderung", "Kraft", "Masse"],
    ["Kraft", "Zeitspanne", "Masse", "Geschwindigkeitsänderung"],
  ];
  const target = document.getElementById("law-term-matching");
  terms.forEach((term, index) => {
    const card = document.createElement("article"); card.className = "law-term-card";
    const heading = document.createElement("h4");
    heading.setAttribute("aria-label", term.spoken);
    if (term.symbol === "force" || term.symbol === "velocity") {
      if (term.symbol === "velocity") heading.append(document.createTextNode("Δ"));
      const symbol = document.createElement("span"); symbol.className = "vector-symbol"; symbol.setAttribute("aria-hidden", "true"); symbol.textContent = term.symbol === "force" ? "F" : "v"; heading.append(symbol);
    } else {
      heading.textContent = term.symbol === "time" ? "Δt" : "m";
    }
    const label = document.createElement("label"); label.textContent = `Größe zu ${term.spoken}`;
    const select = document.createElement("select"); select.setAttribute("aria-label", `Größe zu ${term.spoken}`); select.innerHTML = '<option value="">Auswahl wählen …</option>' + optionOrders[index].map((option) => `<option value="${option}">${option}</option>`).join(""); label.append(select);
    const button = document.createElement("button"); button.type = "button"; button.className = "physics-primary-button direct-check-button"; button.textContent = `${term.spoken} prüfen`;
    const feedback = document.createElement("div"); feedback.id = `law-term-feedback-${index}`; feedback.className = "physics-feedback compact-feedback"; feedback.setAttribute("role", "status"); feedback.setAttribute("aria-live", "polite"); feedback.hidden = true;
    select.addEventListener("change", () => { feedback.hidden = true; select.classList.remove("is-correct", "is-wrong"); });
    button.addEventListener("click", () => { if (!select.value) setFeedback(feedback, "error", "Wähle zuerst eine Größe aus."); else if (select.value === term.expected) { select.classList.add("is-correct"); select.classList.remove("is-wrong"); setFeedback(feedback, "success", "Korrekt."); } else { select.classList.add("is-wrong"); select.classList.remove("is-correct"); setFeedback(feedback, "partial", "Noch nicht korrekt. Lies das Formelzeichen im Grundgesetz noch einmal genau."); } });
    card.append(heading, label, button, feedback); target.append(card);
  });
}

function setupLawCloze() {
  const terms = ["Zeit", "Kraft", "Masse m", "Geschwindigkeitsänderung", "Richtung der Kraft", "Richtung der Geschwindigkeitsänderung"];
  const prefixes = ["Wirkt auf einen beweglichen Körper eine bestimmte", "lang eine", "dann erfährt dieser Körper mit der", "eine", "Die", "ist gleich der"];
  const target = document.getElementById("law-cloze");
  const bank = document.createElement("div"); bank.className = "cloze-term-bank";
  [...terms].reverse().forEach((term) => { const token = document.createElement("button"); token.type = "button"; token.className = "cloze-token"; token.textContent = term; token.draggable = true; token.dataset.term = term; token.addEventListener("dragstart", (event) => event.dataTransfer.setData("text/plain", term)); token.addEventListener("click", () => { const empty = [...target.querySelectorAll("select[data-cloze-gap]")].find((select) => !select.value); if (empty) { empty.value = term; document.getElementById("law-cloze-feedback").hidden = true; renderTokens(); } }); bank.append(token); });
  const sentence = document.createElement("p"); sentence.className = "cloze-sentence";
  prefixes.forEach((prefix, index) => { sentence.append(document.createTextNode(`${prefix} `)); const select = document.createElement("select"); select.dataset.clozeGap = String(index); select.setAttribute("aria-label", `Lücke ${index + 1}`); select.innerHTML = '<option value="">Begriff wählen …</option>' + terms.map((term) => `<option value="${term}">${term}</option>`).join(""); select.addEventListener("change", () => { renderTokens(); document.getElementById("law-cloze-feedback").hidden = true; }); select.addEventListener("dragenter", (event) => { event.preventDefault(); select.classList.add("is-drop-target"); }); select.addEventListener("dragover", (event) => event.preventDefault()); select.addEventListener("dragleave", () => select.classList.remove("is-drop-target")); select.addEventListener("drop", (event) => { event.preventDefault(); select.classList.remove("is-drop-target"); const term = event.dataTransfer.getData("text/plain"); if (terms.includes(term)) select.value = term; renderTokens(); document.getElementById("law-cloze-feedback").hidden = true; }); sentence.append(select, document.createTextNode(index === 0 ? " " : index === 1 ? ", " : index === 2 ? " " : index === 3 ? ". " : index === 4 ? " " : ".")); });
  function renderTokens() { const used = new Set([...sentence.querySelectorAll("select")].map((select) => select.value).filter(Boolean)); bank.querySelectorAll(".cloze-token").forEach((token) => { token.disabled = used.has(token.dataset.term); token.classList.toggle("is-used", used.has(token.dataset.term)); }); }
  target.append(bank, sentence); renderTokens();
  document.getElementById("check-law-cloze").addEventListener("click", () => { const selects = [...sentence.querySelectorAll("select")]; const correct = selects.filter((select, index) => select.value === terms[index]).length; if (correct === terms.length) setFeedback("law-cloze-feedback", "success", "Korrekt: Der Text beschreibt alle sechs Größen fachlich richtig."); else if (correct) setFeedback("law-cloze-feedback", "partial", `${correct} von ${terms.length} Lücken stimmen. Prüfe noch die Begriffe an den anderen Stellen.`); else setFeedback("law-cloze-feedback", "error", "Noch nicht korrekt. Ordne die Begriffe den sechs Lücken zu und prüfe erneut."); });
  document.getElementById("reset-law-cloze").addEventListener("click", () => { sentence.querySelectorAll("select").forEach((select) => { select.value = ""; select.classList.remove("is-drop-target"); }); document.getElementById("law-cloze-feedback").hidden = true; renderTokens(); sentence.querySelector("select")?.focus(); });
}

function setupSortableSteps() {
  const steps = [{ id: "mass", text: "Masse umrechnen: 100 g = 0,100 kg" }, { id: "formula", text: "Formel nach a umstellen: a = F / m" }, { id: "insert", text: "Werte einsetzen: a = 1,2 N / 0,100 kg" }, { id: "calculate", text: "Berechnen und gültige Ziffern beachten: a = 12 m/s²" }];
  const target = document.getElementById("acceleration-steps");
  const order = ["insert", "mass", "calculate", "formula"];
  const render = () => { target.replaceChildren(...order.map((id) => { const definition = steps.find((step) => step.id === id); const item = document.createElement("div"); item.className = "sortable-step"; item.draggable = true; item.dataset.stepId = id; const text = document.createElement("span"); text.textContent = definition.text; const controls = document.createElement("span"); controls.className = "sortable-step-controls"; [["↑", -1, "Nach oben"], ["↓", 1, "Nach unten"]].forEach(([label, offset, name]) => { const button = document.createElement("button"); button.type = "button"; button.className = "sort-step-button"; button.textContent = label; button.setAttribute("aria-label", `${name}: ${definition.text}`); button.addEventListener("click", () => { const index = order.indexOf(id); const next = index + offset; if (next < 0 || next >= order.length) return; [order[index], order[next]] = [order[next], order[index]]; render(); }); controls.append(button); }); item.append(text, controls); item.addEventListener("dragstart", (event) => { event.dataTransfer.effectAllowed = "move"; event.dataTransfer.setData("text/plain", id); }); item.addEventListener("dragover", (event) => { event.preventDefault(); item.classList.add("is-drop-target"); }); item.addEventListener("dragleave", () => item.classList.remove("is-drop-target")); item.addEventListener("drop", (event) => { event.preventDefault(); item.classList.remove("is-drop-target"); const dragged = event.dataTransfer.getData("text/plain"); const from = order.indexOf(dragged); const to = order.indexOf(id); if (from < 0 || to < 0 || from === to) return; order.splice(to, 0, order.splice(from, 1)[0]); render(); }); return item; })); };
  render();
  document.getElementById("check-acceleration-steps").addEventListener("click", () => { if (order.every((id, index) => id === steps[index].id)) setFeedback("acceleration-steps-feedback", "success", "Korrekt: Umrechnung, Umstellung, Einsetzen und Berechnung sind richtig geordnet."); else setFeedback("acceleration-steps-feedback", "error", "Noch nicht korrekt. Beginne mit der Umrechnung der Masse und setze danach die Formel um."); });
}

function renderMultipleChoice({ targetId, taskNumber, question, options, correct, success, hint }) {
  const target = document.getElementById(targetId); const fieldset = document.createElement("fieldset"); fieldset.className = "physics-quiz-question quiz-question"; const legend = document.createElement("legend"); legend.textContent = `Aufgabe ${taskNumber} · ${question}`; const optionWrap = document.createElement("div"); optionWrap.className = "quiz-options";
  options.forEach(([value, labelText]) => { const label = document.createElement("label"); label.className = "quiz-option"; const input = document.createElement("input"); input.type = "checkbox"; input.name = `${targetId}-answers`; input.value = value; input.addEventListener("change", () => { feedback.hidden = true; }); label.append(input, document.createTextNode(labelText)); optionWrap.append(label); });
  const button = document.createElement("button"); button.type = "button"; button.className = "physics-primary-button direct-check-button"; button.textContent = `Aufgabe ${taskNumber} prüfen`; const feedback = document.createElement("p"); feedback.className = "physics-feedback"; feedback.setAttribute("role", "status"); feedback.setAttribute("aria-live", "polite"); feedback.hidden = true;
  button.addEventListener("click", () => { const selected = [...fieldset.querySelectorAll("input:checked")].map((input) => input.value); const correctSelected = selected.filter((value) => correct.includes(value)); const extras = selected.filter((value) => !correct.includes(value)); const exact = selected.length === correct.length && selected.every((value) => correct.includes(value)); if (exact) setFeedback(feedback, "success", success); else if (correctSelected.length && !extras.length) setFeedback(feedback, "partial", `Teilweise korrekt: Mindestens eine richtige Aussage fehlt noch. ${hint}`); else if (!selected.length) setFeedback(feedback, "error", "Wähle mindestens zwei Aussagen aus und prüfe dann erneut."); else setFeedback(feedback, "error", `Noch nicht korrekt. ${hint}`); });
  fieldset.append(legend, optionWrap, button, feedback); target.append(fieldset);
}

function setupMultipleChoiceTasks() {
  renderMultipleChoice({ targetId: "parachute-multiple-choice", taskNumber: "4b", question: "Welche Aussagen treffen in diesem Szenario zu?", correct: ["balance", "both"], options: [["balance", "Es herrscht ein Kräftegleichgewicht."], ["weight", "Es wirkt nur die Gewichtskraft F_G."], ["air", "Es wirkt nur die Luftwiderstandskraft F_R."], ["both", "Es wirken die Gewichtskraft F_G und die Luftwiderstandskraft F_R."], ["greater", "Die Gewichtskraft F_G ist größer als die Luftwiderstandskraft F_R."]], success: "Korrekt: Beide Kräfte wirken, sind gleich groß und bilden ein Kräftegleichgewicht.", hint: "Bei konstanter Geschwindigkeit wirken mehrere Kräfte, deren Summe null ist." });
  renderMultipleChoice({ targetId: "crash-multiple-choice", taskNumber: "6b", question: "Welche Aussagen über die beiden Kräfte beim Zusammenstoß sind richtig?", correct: ["same", "opposite", "different"], options: [["balance", "Die beiden Kräfte bilden ein Kräftegleichgewicht an einem einzigen Körper."], ["same", "Die beiden Kräfte haben den gleichen Betrag."], ["wall", "Die Wand übt grundsätzlich die größere Kraft aus."], ["different", "Die beiden Kräfte wirken auf zwei verschiedene Körper."], ["opposite", "Die beiden Kräfte sind entgegengesetzt gerichtet."]], success: "Korrekt: Die Kraft des Autos auf die Wand und die Kraft der Wand auf das Auto sind gleich groß und entgegengesetzt gerichtet. Sie wirken aber auf unterschiedliche Körper und bilden deshalb kein Kräftegleichgewicht an einem einzelnen Körper.", hint: "Vergleiche Betrag, Richtung und den Körper, auf den die jeweilige Kraft wirkt." });
}

function setupFinalQuiz() {
  const items = [
    { taskNumber: "7a", question: "Welche Aussagen zum newtonschen Grundgesetz sind richtig?", correct: ["law", "impulse"], options: [["always", "Jede Kraft hält die Geschwindigkeit konstant."], ["law", "Der Kraftimpuls entspricht der Änderung des Bewegungsimpulses."], ["unit", "Die Einheit des Kraftimpulses ist m/s²."], ["impulse", "Eine längere Einwirkzeit kann bei gleicher Kraft die Geschwindigkeitsänderung vergrößern."]], hint: "Achte darauf, welche Größen im Grundgesetz verbunden werden." },
    { taskNumber: "7b", question: "Welche Aussagen über Kraft und Geschwindigkeitsänderung sind richtig?", correct: ["force", "mass"], options: [["force", "Bei gleicher Masse führt eine größere Kraft zu einer größeren Beschleunigung."], ["direction", "Die Richtung der Kraft ist immer unabhängig von der Geschwindigkeitsänderung."], ["mass", "Bei gleicher Kraft beschleunigt eine kleinere Masse stärker."], ["none", "Eine Kraft kann die Geschwindigkeit eines Körpers niemals ändern."]], hint: "Vergleiche Kraft, Masse und die Änderung der Bewegung." },
    { taskNumber: "7c", question: "Welche Aussagen beschreiben ein Kräftegleichgewicht richtig?", correct: ["sum", "constant"], options: [["only", "Es darf nur eine einzige Kraft wirken."], ["constant", "Der Bewegungszustand bleibt gleich: Ruhe oder gleichförmige Bewegung."], ["acceleration", "Ein Kräftegleichgewicht bedeutet immer eine Beschleunigung."], ["sum", "Die resultierende Kraft beziehungsweise Kraftsumme ist null."]], hint: "Kräftegleichgewicht sagt etwas über die Summe der Kräfte und die Bewegungsänderung aus." },
    { taskNumber: "7d", question: "Welche Aussagen zu Wechselwirkungskräften sind richtig?", correct: ["same", "different"], options: [["different", "Sie wirken auf zwei verschiedene Körper."], ["wall", "Bei einem Zusammenstoß ist die Kraft der Wand grundsätzlich größer."], ["one", "Sie heben sich als Kräfte auf einem einzigen Körper auf."], ["same", "Sie sind gleich groß und entgegengesetzt gerichtet."]], hint: "Prüfe Richtung, Betrag und den jeweiligen Körper." },
    { taskNumber: "7e", question: "Welche Aussagen zu Einheiten und gültigen Ziffern sind richtig?", correct: ["acceleration", "digits"], options: [["round", "Bei 1,2 N und 100 g muss das Ergebnis immer drei gültige Ziffern besitzen."], ["acceleration", "Eine mögliche Einheit der Beschleunigung ist m/s²."], ["digits", "12 besitzt zwei gültige Ziffern, 12,0 dagegen drei."], ["speed", "m/s ist die Einheit einer Kraft."]], hint: "Unterscheide die Einheiten von Geschwindigkeit, Beschleunigung und Kraft und zähle die Ziffern." },
  ];
  items.forEach((item) => renderMultipleChoice({ targetId: "physics-quiz", ...item, success: "Korrekt: Alle richtigen Aussagen und keine falsche Aussage sind ausgewählt." }));
}

function setupAccelerationCalculation() {
  document.getElementById("check-force-acceleration").addEventListener("click", () => {
    const input = document.getElementById("force-acceleration-answer"); const value = numberValue(input.value); const digits = significantDigitCount(input.value); const unit = document.getElementById("force-acceleration-unit").value; const valueCorrect = Number.isFinite(value) && Math.abs(value - 12) <= 0.01; const unitCorrect = unit === "m/s²";
    if (valueCorrect && unitCorrect && digits === 2) setFeedback("force-acceleration-feedback", "success", "Richtig: 12 m/s² besitzt zwei gültige Ziffern. Die Angaben 100 g und 1,2 N werden hier jeweils mit zwei gültigen Ziffern verwendet und geben damit die Genauigkeit des Ergebnisses vor.");
    else if (valueCorrect && unitCorrect && digits !== 2) setFeedback("force-acceleration-feedback", "partial", "Dein Zahlenwert ist richtig, aber 12,0 besitzt drei gültige Ziffern. Die Angaben 100 g und 1,2 N werden hier jeweils mit zwei gültigen Ziffern verwendet. Gib deshalb auch das Ergebnis mit zwei gültigen Ziffern an.");
    else if (valueCorrect && !unitCorrect) setFeedback("force-acceleration-feedback", "partial", "Der Zahlenwert ist richtig. Wähle als Einheit der Beschleunigung m/s² und achte auf zwei gültige Ziffern.");
    else setFeedback("force-acceleration-feedback", "error", "Noch nicht korrekt. Rechne 100 g zuerst in Kilogramm um und nutze a = F / m. Prüfe Zahlenwert, Einheit und gültige Ziffern getrennt.");
  });
}

setupPhysicsStepTabs();
setupLawTermMatching();
setupLawCloze();
setupSortableSteps();
setupAccelerationCalculation();
setupForceDrawingTasks();
setupMultipleChoiceTasks();
setupFinalQuiz();
setupPhysicsSemanticTask({ answerId: "force-balance-answer", buttonId: "check-force-balance", feedbackId: "force-balance-feedback", countId: "force-balance-count", taskId: "ph11-kreisbewegungen-kraeftegleichgewicht-beschreibung", serverUrl: SCRIPT_SERVER_URL });
