import { setupPhysicsStepTabs } from "./components/physics-step-tabs.mjs";
import { setupPhysicsSemanticTask } from "./components/physics-semantic-task.mjs";
import { angleAtElapsed, angularSpeed, circleVectors, frequencyFromPeriod, sectorPath, tangentialSpeed } from "./components/circle-kinematics.mjs";

const SCRIPT_SERVER_URL = "https://script.google.com/macros/s/AKfycby8RWL6uYrKZyoJ6m2GRpWyRmXjwsdskyCiqzKpRhIK5-wrDl-9lWWk8CiAGaVMoy0x/exec";

function setFeedback(target, status, message) {
  const element = typeof target === "string" ? document.getElementById(target) : target;
  element.hidden = false;
  element.className = `physics-feedback ${status}`;
  element.textContent = message;
}

function bindKeyboardButton(button, handler) {
  button.addEventListener("click", handler);
  button.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    handler();
  });
}

function formatNumber(value, digits = 2) {
  return Number(value).toFixed(digits).replace(".", ",");
}

function formatRadians(value) {
  const known = [[Math.PI / 6, "π/6"], [Math.PI / 3, "π/3"], [Math.PI / 2, "π/2"], [Math.PI, "π"], [Math.PI * 1.5, "3π/2"], [Math.PI * 2, "2π"]];
  return known.find(([number]) => Math.abs(number - value) < 0.14)?.[1] || formatNumber(value);
}

function setupAngleSimulation() {
  const host = document.querySelector('[data-circle-simulation="angle"]');
  const inputs = { phi: host.querySelector('[data-angle-input="phi"]'), time: host.querySelector('[data-angle-input="time"]') };
  const arc = host.querySelector("[data-angle-arc]");
  const radius = host.querySelector("[data-angle-radius]");
  const body = host.querySelector("[data-angle-body]");
  const label = host.querySelector("[data-angle-label]");
  const panel = host.closest("[data-physics-panel]");
  const status = host.querySelector("[data-angle-status]");
  let elapsedSeconds = 0;
  let running = false;
  let frame = 0;
  let last = 0;

  function update() {
    const phi = Number(inputs.phi.value);
    const time = Number(inputs.time.value);
    const currentAngle = angleAtElapsed(phi, time, elapsedSeconds);
    const frame = circleVectors(currentAngle - Math.PI / 2, 112);
    const bodyPoint = { x: 190 + frame.position.x, y: 165 + frame.position.y };
    body.setAttribute("cx", bodyPoint.x); body.setAttribute("cy", bodyPoint.y);
    radius.setAttribute("x2", bodyPoint.x); radius.setAttribute("y2", bodyPoint.y);
    arc.setAttribute("d", sectorPath(190, 165, 52, currentAngle));
    const labelFrame = circleVectors(currentAngle / 2 - Math.PI / 2, 75);
    const labelPoint = { x: 190 + labelFrame.position.x, y: 165 + labelFrame.position.y };
    label.setAttribute("x", labelPoint.x); label.setAttribute("y", labelPoint.y); label.textContent = "Δφ";
    host.querySelector("[data-angle-phi]").textContent = formatRadians(phi);
    host.querySelector("[data-angle-degrees]").textContent = String(Math.round(phi * 180 / Math.PI));
    host.querySelector("[data-angle-time]").textContent = formatNumber(time, 1);
    host.querySelector("[data-angle-omega]").textContent = formatNumber(angularSpeed(phi, time));
  }
  function tick(time) {
    if (!running) return;
    const elapsed = last ? (time - last) / 1000 : 0; last = time;
    elapsedSeconds = Math.min(Number(inputs.time.value), elapsedSeconds + elapsed);
    update();
    if (elapsedSeconds >= Number(inputs.time.value)) {
      pause("Bewegung abgeschlossen: Der gewählte Winkel wurde im gewählten Zeitintervall überstrichen.");
      return;
    }
    frame = requestAnimationFrame(tick);
  }
  function start() { if (elapsedSeconds >= Number(inputs.time.value)) elapsedSeconds = 0; if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { elapsedSeconds = Number(inputs.time.value); update(); status.textContent = "Bewegung ohne Animation vollständig angezeigt."; return; } if (!running) { running = true; last = 0; status.textContent = "Bewegung läuft."; frame = requestAnimationFrame(tick); } }
  function pause(message = "Bewegung pausiert.") { if (!running && !message) return; running = false; cancelAnimationFrame(frame); status.textContent = message; }
  host.querySelector('[data-angle-action="start"]').addEventListener("click", start);
  host.querySelector('[data-angle-action="pause"]').addEventListener("click", () => pause());
  host.querySelector('[data-angle-action="reset"]').addEventListener("click", () => { pause("Bewegung zurückgesetzt."); elapsedSeconds = 0; update(); });
  Object.values(inputs).forEach((input) => input.addEventListener("input", () => { pause("Werte geändert. Starte die Bewegung erneut."); elapsedSeconds = 0; update(); }));
  document.addEventListener("visibilitychange", () => { if (document.hidden && running) pause("Bewegung pausiert, weil die Seite nicht sichtbar ist."); });
  new MutationObserver(() => { if (panel.hidden && running) pause("Bewegung pausiert, weil der Reiter gewechselt wurde."); }).observe(panel, { attributes: true, attributeFilter: ["hidden"] });
  update();
}

function setupSpeedSimulation() {
  const host = document.querySelector('[data-circle-simulation="speed"]');
  const inputs = { radius: host.querySelector('[data-speed-input="radius"]'), omega: host.querySelector('[data-speed-input="omega"]') };
  const panel = host.closest("[data-physics-panel]"); const status = host.querySelector("[data-speed-status]");
  let rotation = -Math.PI / 2; let running = false; let frame = 0; let last = 0;
  function update() {
    const radiusMeters = Number(inputs.radius.value); const omega = Number(inputs.omega.value); const radius = radiusMeters * 30;
    const vectors = circleVectors(rotation, radius);
    const point = { x: 220 + vectors.position.x, y: 220 + vectors.position.y };
    const vectorLength = Math.min(95, 26 + omega * radiusMeters * 11);
    const tangent = { x: point.x + vectors.tangent.x * vectorLength, y: point.y + vectors.tangent.y * vectorLength };
    host.querySelector("[data-speed-orbit]").setAttribute("r", radius);
    const radial = host.querySelector("[data-speed-radius]"); radial.setAttribute("x2", point.x); radial.setAttribute("y2", point.y);
    const body = host.querySelector("[data-speed-body]"); body.setAttribute("cx", point.x); body.setAttribute("cy", point.y);
    const vector = host.querySelector("[data-speed-vector]"); vector.setAttribute("x1", point.x); vector.setAttribute("y1", point.y); vector.setAttribute("x2", tangent.x); vector.setAttribute("y2", tangent.y);
    const vectorLabel = host.querySelector("[data-speed-vector-label]"); vectorLabel.setAttribute("x", tangent.x + 8); vectorLabel.setAttribute("y", tangent.y); vectorLabel.textContent = "vB";
    host.querySelector("[data-speed-radius-value]").textContent = formatNumber(radiusMeters, 1);
    host.querySelector("[data-speed-omega-value]").textContent = formatNumber(omega, 1);
    host.querySelector("[data-speed-v-value]").textContent = formatNumber(tangentialSpeed(omega, radiusMeters), 1);
  }
  function tick(time) { if (!running) return; const elapsed = last ? time - last : 0; last = time; rotation += elapsed * 0.001 * Number(inputs.omega.value); update(); frame = requestAnimationFrame(tick); }
  function start() { if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { update(); status.textContent = "Bewegung ist wegen der Einstellung für reduzierte Bewegung angehalten."; return; } if (!running) { running = true; last = 0; status.textContent = "Bewegung läuft im Uhrzeigersinn."; frame = requestAnimationFrame(tick); } }
  function pause(message = "Bewegung pausiert.") { running = false; cancelAnimationFrame(frame); status.textContent = message; }
  host.querySelector('[data-speed-action="start"]').addEventListener("click", start);
  host.querySelector('[data-speed-action="pause"]').addEventListener("click", () => pause());
  host.querySelector('[data-speed-action="reset"]').addEventListener("click", () => { pause("Bewegung zurückgesetzt."); rotation = -Math.PI / 2; update(); });
  Object.values(inputs).forEach((input) => input.addEventListener("input", update));
  document.addEventListener("visibilitychange", () => { if (document.hidden && running) pause("Bewegung pausiert, weil die Seite nicht sichtbar ist."); });
  new MutationObserver(() => { if (panel.hidden && running) pause("Bewegung pausiert, weil der Reiter gewechselt wurde."); }).observe(panel, { attributes: true, attributeFilter: ["hidden"] });
  update();
}

function setupFormulaBuilder({ id, expected, equation, rememberId }) {
  const target = document.getElementById(id); let selected = "";
  const values = [...expected].sort(() => Math.random() - 0.5);
  const slots = expected.map((_, index) => ({ index, value: "" }));
  const render = () => {
    target.replaceChildren();
    const bank = document.createElement("div"); bank.className = "formula-token-bank";
    values.forEach((value) => { const token = document.createElement("button"); token.type = "button"; token.className = "cloze-token"; token.textContent = value; token.draggable = true; token.disabled = slots.some((slot) => slot.value === value); token.addEventListener("dragstart", (event) => event.dataTransfer.setData("text/plain", value)); bindKeyboardButton(token, () => { selected = value; target.querySelectorAll(".formula-slot").forEach((slot) => slot.classList.toggle("is-selected", !slot.dataset.value)); }); bank.append(token); });
    const line = document.createElement("div"); line.className = "formula-line"; line.setAttribute("aria-label", equation);
    slots.forEach((slot, index) => { const button = document.createElement("button"); button.type = "button"; button.className = "formula-slot"; button.dataset.value = slot.value; button.textContent = slot.value || "?"; button.setAttribute("aria-label", `Feld ${index + 1} der Formel`); bindKeyboardButton(button, () => { if (selected) { slots[index].value = selected; selected = ""; } else if (slots[index].value) slots[index].value = ""; document.getElementById(rememberId).hidden = true; render(); }); button.addEventListener("dragover", (event) => event.preventDefault()); button.addEventListener("drop", (event) => { event.preventDefault(); slots[index].value = event.dataTransfer.getData("text/plain"); document.getElementById(rememberId).hidden = true; render(); }); line.append(button); if (index === 0) line.append(document.createTextNode(" = ")); if (index === 1) line.append(document.createTextNode(id === "formula-angle" ? " / " : id === "formula-speed" ? " · " : " / ")); });
    const actions = document.createElement("div"); actions.className = "cloze-actions";
    const check = document.createElement("button"); check.type = "button"; check.className = "physics-primary-button"; check.textContent = "Formel prüfen";
    const reset = document.createElement("button"); reset.type = "button"; reset.className = "secondary-action"; reset.textContent = "Formel zurücksetzen";
    const feedback = document.createElement("div"); feedback.className = "physics-feedback"; feedback.hidden = true; feedback.setAttribute("role", "status"); feedback.setAttribute("aria-live", "polite");
    check.addEventListener("click", () => { const correct = slots.filter((slot, index) => slot.value === expected[index]).length; if (correct === expected.length) { setFeedback(feedback, "success", "Korrekt: Die Formel ist richtig zusammengesetzt."); document.getElementById(rememberId).hidden = false; } else { document.getElementById(rememberId).hidden = true; if (correct) setFeedback(feedback, "partial", `${correct} von ${expected.length} Zeichen stehen richtig. Prüfe die noch leeren oder vertauschten Felder.`); else setFeedback(feedback, "error", "Noch nicht korrekt. Überlege, welche Größe auf der linken Seite stehen muss."); } });
    reset.addEventListener("click", () => { slots.forEach((slot) => { slot.value = ""; }); selected = ""; document.getElementById(rememberId).hidden = true; render(); });
    actions.append(check, reset);
    target.append(bank, line, actions, feedback);
  };
  render();
}

function setupFrequency() {
  const input = document.getElementById("period-input"); const wheel = document.querySelector("[data-frequency-wheel]");
  const update = () => { const period = Number(input.value); document.querySelector("[data-period-value]").textContent = formatNumber(period, 1); document.querySelector("[data-frequency-value]").textContent = formatNumber(frequencyFromPeriod(period)); wheel.style.setProperty("--turn-duration", `${period}s`); };
  input.addEventListener("input", update); update();
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const panel = wheel.closest("[data-physics-panel]");
  let inViewport = !panel.hidden;
  const setAnimationState = () => { wheel.style.animationPlayState = inViewport && !panel.hidden && !reduceMotion.matches && !document.hidden ? "running" : "paused"; };
  if ("IntersectionObserver" in window) new IntersectionObserver(([entry]) => { inViewport = entry.isIntersecting; setAnimationState(); }).observe(wheel);
  new MutationObserver(() => { if (panel.hidden) inViewport = false; else if (!("IntersectionObserver" in window)) inViewport = true; setAnimationState(); }).observe(panel, { attributes: true, attributeFilter: ["hidden"] });
  document.addEventListener("visibilitychange", setAnimationState);
  setAnimationState();
}

function centripetalFeedback(result) {
  const fragment = document.createDocumentFragment();
  const text = document.createElement("p");
  const strong = document.createElement("strong"); strong.textContent = "nach innen";
  if (result.context === "server-error") { text.append("Zum fachlichen Vergleich: Die Zentripetalkraft beginnt am Körper und zeigt ", strong, " zum Kreismittelpunkt. Deine eingegebene Antwort bleibt erhalten."); } else if (result.status === "korrekt") { text.append("Richtig: Der Geschwindigkeitsvektor verläuft tangential zur Kreisbahn. Die Zentripetalkraft beginnt am Körper und zeigt ", strong, " zum Kreismittelpunkt."); } else if (result.points > 0) { text.append("Teilweise richtig. Beachte die oben genannten fehlenden Aspekte. Die Zentripetalkraft beginnt am Körper und zeigt ", strong, " zum Kreismittelpunkt."); } else { text.append("Noch nicht richtig. Der Geschwindigkeitspfeil beginnt am Körper und liegt tangential. Die Zentripetalkraft zeigt ", strong, " zum Kreismittelpunkt."); }
  fragment.append(text); return fragment;
}

function setupCentripetalCloze() {
  const terms = [{ key: "force", text: "Kraft" }, { key: "motion", text: "Kreisbewegung" }, { key: "inside", text: "innen" }, { key: "outside", text: "außen" }, { key: "magnitude", text: "der Betrag der Geschwindigkeit" }, { key: "direction-a", text: "die Richtung der Geschwindigkeit" }, { key: "direction-b", text: "die Richtung der Geschwindigkeit" }];
  const expected = ["force", "magnitude", "direction", "motion", "inside", "direction"];
  const target = document.getElementById("centripetal-cloze"); const choices = new Array(expected.length).fill("");
  const order = [...terms].sort(() => Math.random() - 0.5);
  const render = () => { target.replaceChildren(); const bank = document.createElement("div"); bank.className = "cloze-term-bank"; order.forEach((term) => { const token = document.createElement("button"); token.type = "button"; token.className = "cloze-token"; token.textContent = term.text; token.draggable = true; token.disabled = choices.includes(term.key); token.addEventListener("dragstart", (event) => event.dataTransfer.setData("text/plain", term.key)); token.addEventListener("click", () => { const empty = choices.findIndex((value) => !value); if (empty >= 0) { choices[empty] = term.key; render(); } }); bank.append(token); }); const sentence = document.createElement("p"); sentence.className = "cloze-sentence"; const parts = ["Wirkt eine ", " auf einen Körper, ändert sich ", " und/oder ", ". Bei einer ", " wirkt die Zentripetalkraft nach ", ", denn es ändert sich ständig ", "."]; parts.forEach((part, index) => { sentence.append(document.createTextNode(part)); if (index < expected.length) { const select = document.createElement("select"); select.setAttribute("aria-label", `Lücke ${index + 1}`); select.innerHTML = '<option value="">Karte auswählen …</option>' + terms.filter((term) => !choices.includes(term.key) || choices[index] === term.key).map((term) => `<option value="${term.key}">${term.text}</option>`).join(""); select.value = choices[index]; select.addEventListener("change", () => { choices[index] = select.value; document.getElementById("notebook-reminder").hidden = true; render(); }); select.addEventListener("dragover", (event) => event.preventDefault()); select.addEventListener("drop", (event) => { event.preventDefault(); choices[index] = event.dataTransfer.getData("text/plain"); document.getElementById("notebook-reminder").hidden = true; render(); }); sentence.append(select); } }); target.append(bank, sentence); };
  render();
  const category = (key) => key.startsWith("direction") ? "direction" : key;
  document.getElementById("check-centripetal-cloze").addEventListener("click", () => { const correct = choices.filter((choice, index) => category(choice) === expected[index]).length; if (correct === expected.length) { setFeedback("centripetal-cloze-feedback", "success", "Korrekt: Der Merksatz ist vollständig und fachlich richtig."); document.getElementById("notebook-reminder").hidden = false; } else { document.getElementById("notebook-reminder").hidden = true; if (correct) setFeedback("centripetal-cloze-feedback", "partial", `${correct} von ${expected.length} Lücken stimmen. Prüfe besonders, was sich bei einer Kreisbewegung ändert.`); else setFeedback("centripetal-cloze-feedback", "error", "Noch nicht korrekt. Setze zunächst die Karten in die Lücken ein."); } });
  document.getElementById("reset-centripetal-cloze").addEventListener("click", () => { choices.fill(""); document.getElementById("centripetal-cloze-feedback").hidden = true; document.getElementById("notebook-reminder").hidden = true; render(); });
}

function renderQuizQuestion(target, item, index) {
  const fieldset = document.createElement("fieldset"); fieldset.className = "physics-quiz-question"; const legend = document.createElement("legend"); legend.textContent = `${index + 1}. ${item.question}${item.correct.length > 1 ? " (mehrere Antworten)" : ""}`; const options = document.createElement("div"); options.className = "quiz-options";
  item.options.forEach(([value, labelText]) => { const label = document.createElement("label"); label.className = "quiz-option"; const input = document.createElement("input"); input.type = "checkbox"; input.value = value; label.append(input, document.createTextNode(labelText)); options.append(label); });
  const check = document.createElement("button"); check.type = "button"; check.className = "physics-primary-button direct-check-button"; check.textContent = "Antwort prüfen"; const feedback = document.createElement("p"); feedback.className = "physics-feedback"; feedback.hidden = true; feedback.setAttribute("role", "status"); feedback.setAttribute("aria-live", "polite"); check.addEventListener("click", () => { const selected = [...fieldset.querySelectorAll("input:checked")].map((input) => input.value); const hits = selected.filter((value) => item.correct.includes(value)); const extras = selected.filter((value) => !item.correct.includes(value)); const exact = hits.length === item.correct.length && extras.length === 0; if (exact) setFeedback(feedback, "success", "Korrekt: " + item.feedback); else if (hits.length && !extras.length) setFeedback(feedback, "partial", "Teilweise korrekt: Es fehlt noch mindestens eine richtige Aussage. " + item.hint); else setFeedback(feedback, "error", "Noch nicht korrekt. " + item.hint); }); fieldset.append(legend, options, check, feedback); target.append(fieldset);
}

function setupQuiz() {
  const items = [
    { question: "Was beschreibt der Drehwinkel Δφ?", correct: ["angle"], options: [["angle", "Die Weiterdrehung der Verbindungslinie zwischen Zentrum und Körper."], ["time", "Die Zeit für eine beliebige Strecke."], ["radius", "Die Länge der Kreisbahn."]], feedback: "Δφ wird im Bogenmaß angegeben.", hint: "Denk an die Verbindungslinie vom Zentrum zum Körper." },
    { question: "Welche Aussagen zur Winkelgeschwindigkeit sind richtig?", correct: ["formula", "unit"], options: [["formula", "ω ergibt sich aus Drehwinkel geteilt durch Zeitintervall."], ["unit", "Eine Einheit von ω ist rad/s."], ["radius", "Bei größerem Radius ist ω immer größer."]], feedback: "Winkelgeschwindigkeit beschreibt die Drehung pro Zeit.", hint: "Vergleiche Drehwinkel, Zeit und Einheit." },
    { question: "Welche Aussagen zur Bahngeschwindigkeit vB sind richtig?", correct: ["omega", "radius"], options: [["omega", "Bei gleichem Radius vergrößert eine größere Winkelgeschwindigkeit vB."], ["radius", "Bei gleicher Winkelgeschwindigkeit vergrößert ein größerer Radius vB."], ["inverse", "vB wird kleiner, wenn ω oder r größer werden."]], feedback: "Es gilt vB = ω · r.", hint: "Nutze die Multiplikation von ω und r." },
    { question: "Welche Aussagen zu Frequenz f und Umlaufdauer T sind richtig?", correct: ["inverse", "unit"], options: [["inverse", "f und T sind Kehrwerte."], ["unit", "Die Einheit der Frequenz ist Hertz."], ["same", "Eine größere Umlaufdauer bedeutet eine größere Frequenz."]], feedback: "Eine kurze Umlaufdauer bedeutet viele Umdrehungen pro Zeit.", hint: "Vergleiche 1/T für kleine und große T." },
    { question: "Wie ist der Geschwindigkeitsvektor bei einer Kreisbewegung eingezeichnet?", correct: ["tangent"], options: [["tangent", "Er beginnt am Körper und verläuft tangential zur Kreisbahn."], ["center", "Er beginnt am Zentrum und zeigt zum Körper."], ["inward", "Er beginnt am Körper und zeigt immer nach innen."]], feedback: "Der Geschwindigkeitspfeil berührt die Kreisbahn am Körper.", hint: "Die Bewegungsrichtung folgt der Tangente." },
    { question: "Welche Aussagen zur Zentripetalkraft sind richtig?", correct: ["origin", "inward", "function"], options: [["origin", "Der Kraftpfeil beginnt am Körper."], ["inward", "Er zeigt zum Kreismittelpunkt nach innen."], ["function", "Er sorgt für die ständige Änderung der Geschwindigkeitsrichtung."], ["outward", "Er zeigt vom Zentrum nach außen."]], feedback: "Die resultierende Kraft hält den Körper auf der Kreisbahn.", hint: "Achte auf Startpunkt, Richtung und Wirkung der Kraft." },
    { question: "Was geschieht beim Wegfall der Zentripetalkraft?", correct: ["straight"], options: [["straight", "Der Körper bewegt sich tangential geradlinig weiter."], ["circle", "Der Körper bleibt ohne Kraft auf derselben Kreisbahn."], ["center", "Der Körper fliegt sofort zum Mittelpunkt."]], feedback: "Ohne resultierende Kraft bleibt die momentane Bewegungsrichtung erhalten.", hint: "Nutze den Trägheitssatz." }
  ];
  const target = document.getElementById("circle-quiz"); items.forEach((item, index) => renderQuizQuestion(target, item, index));
}

setupPhysicsStepTabs();
setupAngleSimulation();
setupSpeedSimulation();
setupFormulaBuilder({ id: "formula-angle", expected: ["ω", "Δφ", "Δt"], equation: "ω = Δφ / Δt", rememberId: "angle-remember" });
setupFormulaBuilder({ id: "formula-speed", expected: ["vB", "ω", "r"], equation: "vB = ω · r", rememberId: "speed-remember" });
setupFormulaBuilder({ id: "formula-frequency", expected: ["f", "1", "T"], equation: "f = 1 / T", rememberId: "frequency-remember" });
setupFrequency();
setupPhysicsSemanticTask({ answerId: "centripetal-answer", buttonId: "check-centripetal", feedbackId: "centripetal-feedback", countId: "centripetal-count", taskId: "ph11-kreisbewegungen-zentripetalkraft-beschreibung", serverUrl: SCRIPT_SERVER_URL, feedbackBuilder: centripetalFeedback, minimumLength: 8, fallbackMaxPoints: 5 });
setupCentripetalCloze();
setupQuiz();
