import { setupPhysicsStepTabs } from "./components/physics-step-tabs.mjs";
import { appendPhysicsText, createIndexedSymbol, physicsTextSpan } from "./components/physics-notation.mjs";
import { setupPhysicsSemanticTask } from "./components/physics-semantic-task.mjs";

function unlockSolution(event, expectedCode, downloadLinkId, messageId) {
  event.preventDefault();
  const enteredCode = event.currentTarget.elements["solution-code"].value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const expected = expectedCode.replace(/[^A-Z0-9]/g, "");
  const link = document.getElementById(downloadLinkId);
  const message = document.getElementById(messageId);
  link.hidden = enteredCode !== expected;
  message.className = enteredCode === expected ? "solution-code-message" : "solution-code-message error";
  message.textContent = enteredCode === expected ? "Code korrekt. Das Sicherungsblatt ist freigeschaltet." : "Der eingegebene Code ist nicht gültig.";
}

window.unlockSolution = unlockSolution;

function setFeedback(target, status, text) {
  const node = typeof target === "string" ? document.getElementById(target) : target;
  node.hidden = false;
  node.className = `physics-feedback ${status}`;
  node.replaceChildren();
  appendPhysicsText(node, text);
}

function setupNextTabButtons(stepTabs) {
  document.querySelectorAll("[data-next-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      stepTabs.goToTab(button.dataset.nextTab, true);
      document.querySelector(".physics-step-tabs")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    });
  });
}

function setupRealForces() {
  const expected = { hammer: "rope-weight", truck: "friction", centrifuge: "container", coaster: "rail" };
  document.getElementById("check-real-forces").addEventListener("click", () => {
    const matches = Object.entries(expected).filter(([id, value]) => document.querySelector(`[data-force-match="${id}"]`).value === value).length;
    const role = document.querySelector("input[name='centripetal-role']:checked")?.value;
    if (matches === 4 && role === "role") {
      setFeedback("real-forces-feedback", "success", "Richtig. Zentripetalkraft ist keine zusätzliche Kraftart, sondern die Bezeichnung für die zum Mittelpunkt gerichtete Wirkung der resultierenden realen Kräfte.");
    } else if (matches || role === "role") {
      setFeedback("real-forces-feedback", "partial", "Teilweise korrekt. Prüfe bei den noch offenen Situationen, welcher Körper die nach innen gerichtete Kraft tatsächlich ausübt.");
    } else {
      setFeedback("real-forces-feedback", "error", "Noch nicht korrekt. Suche nicht nach einer zusätzlichen Kraft namens Zentripetalkraft, sondern nach der realen Wechselwirkung, die den Körper nach innen ablenkt.");
    }
  });
}

function setupFrictionModel() {
  const input = document.getElementById("side-force");
  const output = document.getElementById("side-force-value");
  const readout = document.getElementById("side-force-readout");
  const force = document.getElementById("friction-readout-force");
  const arrow = document.getElementById("friction-response-arrow");
  const label = document.getElementById("friction-response-label");
  const status = document.getElementById("friction-state-status");
  const setSvgLabel = (element, base, index) => {
    const subscript = document.createElementNS("http://www.w3.org/2000/svg", "tspan");
    subscript.setAttribute("baseline-shift", "sub");
    subscript.setAttribute("font-size", "12");
    subscript.textContent = index;
    element.replaceChildren(document.createTextNode(base), subscript);
  };
  const setReadout = (kind) => {
    force.replaceChildren();
    if (kind === "match") {
      force.append(createIndexedSymbol("F", "Haft"), document.createTextNode(" = "), createIndexedSymbol("F", "S"));
    } else if (kind === "limit") {
      force.append(createIndexedSymbol("F", "Haft"), document.createTextNode(" = "), createIndexedSymbol("F", "S"), document.createTextNode(" = "), createIndexedSymbol("F", "Haft,max"));
    } else {
      force.append(createIndexedSymbol("F", "Gleit"), document.createTextNode(" < "), createIndexedSymbol("F", "Haft,max"));
    }
  };
  const update = () => {
    const value = Number(input.value);
    output.value = value;
    readout.textContent = value;
    if (value < 100) {
      arrow.setAttribute("x2", String(250 - (value * 1.05)));
      setSvgLabel(label, "F", "Haft");
      setReadout("match");
      status.textContent = "Die Haftreibung gleicht die Seitenkraft aus. Die Körper rutschen nicht gegeneinander.";
    } else if (value === 100) {
      arrow.setAttribute("x2", "145");
      setSvgLabel(label, "F", "Haft,max");
      setReadout("limit");
      status.textContent = "Grenzfall: Die maximale Haftreibung ist gerade erreicht. Die Körper rutschen noch nicht gegeneinander.";
    } else {
      arrow.setAttribute("x2", "172");
      setSvgLabel(label, "F", "Gleit");
      setReadout("glide");
      status.textContent = "Die Seitenkraft überschreitet die maximale Haftreibung. Die Körper rutschen gegeneinander; nun wirkt die kleinere Gleitreibung.";
    }
  };
  input.addEventListener("input", update);
  update();
  document.getElementById("check-friction-state").addEventListener("click", () => {
    const values = Object.fromEntries([...document.querySelectorAll("[data-friction-map]")].map((select) => [select.dataset.frictionMap, select.value]));
    if (values.below === "adjust" && values.limit === "maximum" && values.above === "sliding") {
      setFeedback("friction-state-feedback", "success", "Richtig. Die Haftreibung gleicht die Seitenkraft bis zu ihrem Maximalbetrag aus. Wird dieser überschritten, beginnt das Gleiten und die Reibungskraft wird kleiner.");
      document.getElementById("friction-remember").hidden = false;
    } else if (Object.values(values).some(Boolean)) {
      setFeedback("friction-state-feedback", "partial", "Teilweise korrekt. Prüfe besonders den Grenzfall und den Zeitpunkt, an dem die Gleitreibung einsetzt.");
    } else {
      setFeedback("friction-state-feedback", "error", "Noch nicht korrekt. Entscheide zuerst, ob die Seitenkraft kleiner, gleich groß oder größer als die maximale Haftreibung ist.");
    }
  });
}

function setupDecompositionAnimation() {
  const host = document.getElementById("decomposition-animation");
  const phaseElements = ["decomp-force", "decomp-guide-h", "decomp-guide-v", "decomp-normal", "decomp-side", "decomp-friction", "decomp-label-force", "decomp-label-normal", "decomp-label-side", "decomp-label-friction", "decomp-motion"].map((id) => document.getElementById(id));
  const status = document.getElementById("decomp-status");
  const start = document.getElementById("decomp-start");
  const pause = document.getElementById("decomp-pause");
  const reset = document.getElementById("decomp-reset");
  let phase = 0;
  let timer = 0;
  let running = false;
  const reduced = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function render() {
    phaseElements.forEach((element, index) => { element.style.opacity = index <= phase ? "1" : "0"; });
    const messages = ["Die ursprüngliche schräge Kraft F ist sichtbar.", "Die Hilfslinien zeigen die rechtwinklige Zerlegung.", "Die Normalkomponente F mit Index N steht senkrecht auf der Kontaktfläche.", "Die Seitenkomponente F mit Index S liegt parallel zur Kontaktfläche.", "Die Haftreibung wirkt der drohenden Relativbewegung entgegen."];
    status.textContent = reduced() ? "Die Kräftezerlegung wird wegen deiner Einstellung für reduzierte Bewegung statisch angezeigt." : messages[Math.min(Math.floor(phase / 2), messages.length - 1)];
  }
  function stop(message) { window.clearInterval(timer); running = false; pause.textContent = "Fortsetzen"; if (message) status.textContent = message; }
  function begin() {
    if (reduced()) { phase = phaseElements.length - 1; render(); return; }
    if (running) return;
    running = true;
    pause.textContent = "Pausieren";
    timer = window.setInterval(() => { phase += 1; render(); if (phase >= phaseElements.length - 1) stop("Die Kraft ist in F mit Index N und F mit Index S zerlegt. Die Haftreibung wirkt der drohenden Bewegung entgegen."); }, 650);
  }
  start.addEventListener("click", () => { if (phase >= phaseElements.length - 1) { phase = 0; render(); } begin(); });
  pause.addEventListener("click", () => { if (running) stop("Die Animation ist pausiert."); else begin(); });
  reset.addEventListener("click", () => { stop(); phase = 0; render(); status.textContent = "Bereit. Starte die Animation, um die Kräftezerlegung schrittweise zu sehen."; });
  new MutationObserver(() => { if (host.closest("[data-physics-panel]").hidden && running) stop("Die Animation wurde beim Reiterwechsel pausiert."); }).observe(host.closest("[data-physics-panel]"), { attributes: true, attributeFilter: ["hidden"] });
  render();
  document.getElementById("check-decomposition").addEventListener("click", () => {
    const values = Object.fromEntries([...document.querySelectorAll("[data-decomp-label]")].map((select) => [select.dataset.decompLabel, select.value]));
    if (values.force === "F" && values.normal === "FN" && values.side === "FS") setFeedback("decomposition-feedback", "success", "Richtig. F mit Index N steht senkrecht auf der Kontaktfläche, F mit Index S liegt parallel zu ihr und die Haftreibung wirkt der drohenden Relativbewegung entgegen.");
    else if (Object.values(values).some(Boolean)) setFeedback("decomposition-feedback", "partial", "Teilweise korrekt. Prüfe, welcher Pfeil parallel und welcher senkrecht zur Kontaktfläche verläuft.");
    else setFeedback("decomposition-feedback", "error", "Noch nicht korrekt. Nutze die Kontaktfläche als Bezug: parallel bedeutet Seitenkomponente, senkrecht bedeutet Normalkomponente.");
  });
  document.querySelectorAll("[data-decomp-label]").forEach((select) => {
    select.addEventListener("change", () => {
      const preview = document.getElementById(`decomp-preview-${select.dataset.decompLabel}`);
      preview.replaceChildren();
      if (select.value === "F") preview.append(document.createTextNode("Auswahl: F"));
      if (select.value === "FN") preview.append(document.createTextNode("Auswahl: "), createIndexedSymbol("F", "N"));
      if (select.value === "FS") preview.append(document.createTextNode("Auswahl: "), createIndexedSymbol("F", "S"));
    });
  });
}

function formulaNode(parts) {
  const line = document.createElement("span");
  line.className = "formula-line";
  parts.forEach((part) => {
    if (typeof part === "string") line.append(document.createTextNode(part));
    else line.append(createIndexedSymbol(part.base, part.index));
  });
  return line;
}

function fraction(topParts, bottomParts) {
  const wrap = document.createElement("span");
  wrap.className = "physics-fraction";
  wrap.setAttribute("role", "img");
  wrap.setAttribute("aria-label", "Bruchterm");
  const top = document.createElement("span"); top.className = "physics-fraction__numerator";
  const bottom = document.createElement("span"); bottom.className = "physics-fraction__denominator";
  top.append(formulaNode(topParts)); bottom.append(formulaNode(bottomParts)); wrap.append(top, bottom);
  return wrap;
}

function makeFormula(label, build) {
  const item = document.createElement("div");
  item.className = "condition-formula";
  item.append(document.createElement("strong")).textContent = label;
  item.append(build());
  return item;
}

function appendConditionFormula(host, key) {
  const symbol = (base, index) => host.append(createIndexedSymbol(base, index));
  const fractionTerm = (numerator, denominator) => host.append(fraction(numerator, denominator));
  const root = (parts) => {
    const rootNode = document.createElement("span");
    rootNode.className = "formula-root";
    rootNode.append(document.createTextNode("√("), formulaNode(parts), document.createTextNode(")"));
    host.append(rootNode);
  };
  if (key === "condition") { symbol("F", "Z"); host.append(document.createTextNode(" ≤ ")); symbol("F", "Haft,max"); }
  if (key === "condition-wrong") { symbol("F", "Z"); host.append(document.createTextNode(" ≥ ")); symbol("F", "Haft,max"); }
  if (key === "condition-gliding") { symbol("F", "Z"); host.append(document.createTextNode(" = ")); symbol("F", "Gleit"); }
  if (key === "friction") { symbol("F", "Haft,max"); host.append(document.createTextNode(" = μ · ")); symbol("F", "N"); host.append(document.createTextNode(" und ")); symbol("F", "N"); host.append(document.createTextNode(" = m · g")); }
  if (key === "friction-wrong-z") { symbol("F", "Haft,max"); host.append(document.createTextNode(" = μ · ")); symbol("F", "Z"); }
  if (key === "friction-wrong-v") { symbol("F", "Haft,max"); host.append(document.createTextNode(" = μ · ")); symbol("v", "B"); }
  if (key === "insert") { host.append(document.createTextNode("m · ")); fractionTerm([{ base: "v", index: "B" }, "²"], ["r"]); host.append(document.createTextNode(" ≤ μ · m · g")); }
  if (key === "insert-wrong-r") { host.append(document.createTextNode("m · ")); symbol("v", "B"); host.append(document.createTextNode("² · r ≤ μ · m · g")); }
  if (key === "insert-wrong-v") { host.append(document.createTextNode("m · ")); fractionTerm([{ base: "v", index: "B" }], ["r"]); host.append(document.createTextNode(" ≤ μ · g")); }
  if (key === "speed") { symbol("v", "B"); host.append(document.createTextNode(" ≤ ")); root(["μ · g · r"]); }
  if (key === "speed-wrong") { symbol("v", "B"); host.append(document.createTextNode(" ≤ μ · g · r")); }
  if (key === "speed-wrong-m") { symbol("v", "B"); host.append(document.createTextNode(" ≤ ")); root(["m · μ · g · r"]); }
}

function setupConditionBuilder() {
  const target = document.getElementById("condition-builder");
  const steps = [
    { label: "Schritt 1", prompt: "Welche Bedingung beschreibt eine Kurvenfahrt ohne seitliches Rutschen?", options: [["wrong1", "condition-wrong"], ["s1", "condition"], ["wrong2", "condition-gliding"]], correct: "s1" },
    { label: "Schritt 2", prompt: "Welche Ersetzung gilt für die maximale Haftreibung auf ebener Straße?", options: [["wrong1", "friction-wrong-z"], ["s2", "friction"], ["wrong2", "friction-wrong-v"]], correct: "s2" },
    { label: "Schritt 3", prompt: "Welche Ungleichung entsteht nach dem Einsetzen?", options: [["wrong1", "insert-wrong-r"], ["s3", "insert"], ["wrong2", "insert-wrong-v"]], correct: "s3" },
    { label: "Schritt 4", prompt: "Welche Grenzgeschwindigkeit folgt nach dem Kürzen von m und dem Umstellen?", options: [["wrong1", "speed-wrong"], ["wrong2", "speed-wrong-m"], ["s4", "speed"]], correct: "s4" },
  ];
  steps.forEach((step, index) => {
    const fieldset = document.createElement("fieldset"); fieldset.className = "formula-builder condition-step";
    const legend = document.createElement("legend"); legend.textContent = `${step.label}: ${step.prompt}`; fieldset.append(legend);
    step.options.forEach(([value, formulaKey]) => { const labelNode = document.createElement("label"); labelNode.className = "formula-option"; const input = document.createElement("input"); input.type = "radio"; input.name = `condition-step-${index}`; input.value = value; const formula = document.createElement("span"); formula.className = "physics-formula"; appendConditionFormula(formula, formulaKey); labelNode.append(input, formula); fieldset.append(labelNode); });
    target.append(fieldset);
  });
  const button = document.createElement("button"); button.type = "button"; button.className = "physics-primary-button"; button.textContent = "Herleitung prüfen";
  button.addEventListener("click", () => {
    const correct = steps.filter((step, index) => document.querySelector(`input[name='condition-step-${index}']:checked`)?.value === step.correct).length;
    if (correct === steps.length) {
      setFeedback("condition-feedback", "success", "Richtig. Die hergeleitete Grenzgeschwindigkeit hängt in diesem Modell von der Haftreibungszahl, der Fallbeschleunigung und dem Kurvenradius ab.");
      document.getElementById("condition-remember").hidden = false;
    } else if (correct) setFeedback("condition-feedback", "partial", "Teilweise korrekt. Die bisherigen Schritte stimmen; prüfe nun die nächste Ersetzung oder Umformung.");
    else setFeedback("condition-feedback", "error", "Noch nicht korrekt. Prüfe, ob auf der linken Seite die benötigte Zentripetalkraft und auf der rechten Seite die maximal verfügbare Haftreibung steht.");
  });
  target.after(button);
}

function semanticComparison(texts, shortHint) {
  return (result) => {
    const box = document.createElement("p");
    if (result.context === "server-error") box.textContent = texts.server;
    else if (result.status === "korrekt") box.textContent = texts.correct;
    else if (result.status === "teilweise korrekt") box.textContent = texts.partial;
    else box.textContent = result.points ? texts.partial : texts.incorrect;
    if (!result.points && !result.context && shortHint) box.dataset.shortHint = shortHint;
    return box;
  };
}

function setupSemanticTasks() {
  setupPhysicsSemanticTask({ answerId: "curve-danger-answer", buttonId: "check-curve-danger", feedbackId: "curve-danger-feedback", countId: "curve-danger-count", taskId: "ph11-haftreibung-kurvenfahrt-gefahren", minimumLength: 40, fallbackMaxPoints: 6, shortAnswerHint: "Nenne mindestens einen Umstand, der die benötigte Kraft erhöht, einen Umstand, der die Haftreibung verringert, und eine passende Verhaltensregel.", feedbackBuilder: semanticComparison({ correct: "Richtig. Du verknüpfst die Einflussgrößen mit der Grenzbedingung und leitest daraus passende Verhaltensregeln ab.", partial: "Teilweise korrekt. Nutze „Das kannst du ergänzen“ und verbinde den fehlenden Einfluss ausdrücklich mit der Ungleichung.", incorrect: "Noch nicht korrekt. Beginne mit dem Vergleich zwischen benötigter Zentripetalkraft und maximal verfügbarer Haftreibung.", server: "Die automatische Prüfung ist gerade nicht erreichbar. Deine Antwort bleibt erhalten; versuche es erneut." }) });
  setupPhysicsSemanticTask({ answerId: "mass-answer", buttonId: "check-mass", feedbackId: "mass-feedback", countId: "mass-count", taskId: "ph11-haftreibung-kurvenfahrt-massenunabhaengigkeit", minimumLength: 40, fallbackMaxPoints: 5, shortAnswerHint: "Erkläre das Kürzen der Masse und nenne mindestens zwei Voraussetzungen des verwendeten Modells.", feedbackBuilder: semanticComparison({ correct: "Richtig. Du begründest die Massenunabhängigkeit aus der Herleitung und grenzt sie auf die Voraussetzungen des Modells ein.", partial: "Teilweise korrekt. Ergänze entweder den Rechenschritt, in dem sich die Masse kürzt, oder noch fehlende Modellannahmen.", incorrect: "Noch nicht korrekt. Setze zunächst beide Kraftausdrücke in die Grenzbedingung ein und suche den gemeinsamen Faktor.", server: "Die automatische Prüfung ist gerade nicht erreichbar. Deine Antwort bleibt erhalten; versuche es erneut." }) });
}

function setupSummary() {
  const target = document.getElementById("summary-cloze");
  const items = [
    ["Haftreibung passt sich bis zum ", "Maximalbetrag", " an."],
    ["Die maximale Haftreibung lautet ", "FHaft,max = μ · FN", "."],
    ["Bei der ebenen Kurvenfahrt übernimmt die ", "Haftreibungskraft", " die Rolle der Zentripetalkraft."],
    ["Ohne seitliches Rutschen gilt ", "FZ ≤ FHaft,max", "."],
    ["Für die Grenzgeschwindigkeit folgt ", "vB ≤ √(μ · g · r)", "."],
    ["Die Masseunabhängigkeit gilt nur innerhalb der ", "Modellannahmen", "."],
  ];
  items.forEach(([before, answer, after], index) => { const label = document.createElement("label"); label.className = "summary-row"; label.append(document.createTextNode(before)); const input = document.createElement("input"); input.type = "text"; input.dataset.summaryAnswer = answer; input.setAttribute("aria-label", `Lücke ${index + 1}`); label.append(input, document.createTextNode(after)); target.append(label); });
  document.getElementById("check-summary").addEventListener("click", () => {
    const inputs = [...target.querySelectorAll("input")];
    const normalized = (value) => value.toLowerCase().replaceAll(" ", "").replaceAll("_", "").replaceAll("haft", "haft");
    const correct = inputs.filter((input) => normalized(input.value) === normalized(input.dataset.summaryAnswer)).length;
    if (correct === inputs.length) setFeedback("summary-feedback", "success", "Richtig. Die Merksätze unterscheiden verfügbare Haftreibung, benötigte Zentripetalkraft und die Grenzen des Modells.");
    else if (correct) setFeedback("summary-feedback", "partial", "Teilweise korrekt. Prüfe die noch offenen Stellen darauf, ob sie eine Kraft, eine Bedingung oder eine Modellannahme beschreiben.");
    else setFeedback("summary-feedback", "error", "Noch nicht korrekt. Beginne mit der Bedingung für eine Kurvenfahrt ohne Rutschen und ordne danach die übrigen Aussagen zu.");
  });
}

function renderQuizQuestion(target, item, index) {
  const fieldset = document.createElement("fieldset"); fieldset.className = "physics-quiz-question";
  const legend = document.createElement("legend"); appendPhysicsText(legend, `${index + 1}. ${item.question}${item.correct.length > 1 ? " (mehrere Antworten)" : ""}`); fieldset.append(legend);
  const options = document.createElement("div"); options.className = "quiz-options";
  item.options.forEach(([value, text]) => { const label = document.createElement("label"); label.className = "quiz-option"; const input = document.createElement("input"); input.type = "checkbox"; input.value = value; label.append(input, physicsTextSpan(text, "quiz-option-text")); options.append(label); });
  const button = document.createElement("button"); button.type = "button"; button.className = "physics-primary-button direct-check-button"; button.textContent = "Antwort prüfen";
  const feedback = document.createElement("p"); feedback.className = "physics-feedback"; feedback.hidden = true; feedback.setAttribute("role", "status"); feedback.setAttribute("aria-live", "polite");
  button.addEventListener("click", () => { const values = [...fieldset.querySelectorAll("input:checked")].map((input) => input.value); const hits = values.filter((value) => item.correct.includes(value)); const extras = values.filter((value) => !item.correct.includes(value)); if (hits.length === item.correct.length && !extras.length) setFeedback(feedback, "success", `Korrekt: ${item.feedback}`); else if (hits.length && !extras.length) setFeedback(feedback, "partial", `Teilweise korrekt: Es fehlt noch mindestens eine richtige Aussage. ${item.hint}`); else setFeedback(feedback, "error", `Noch nicht korrekt. ${item.hint}`); });
  fieldset.append(options, button, feedback); target.append(fieldset);
}

function setupFinalQuiz() {
  const items = [
    { question: "Welche Aussagen zur Zentripetalkraft sind richtig?", correct: ["role", "friction", "direction"], options: [["role", "Zentripetalkraft bezeichnet die zum Kreismittelpunkt gerichtete Rolle der resultierenden Kraft."], ["friction", "Bei einer ebenen Kurvenfahrt kann die Haftreibungskraft diese Rolle übernehmen."], ["direction", "Die wirkende Kraft verändert fortlaufend die Bewegungsrichtung."], ["extra", "Zusätzlich zur Haftreibung wirkt immer noch eine eigene Zentripetalkraft."], ["outward", "Zentripetalkraft zeigt bei der Kurvenfahrt nach außen."]], feedback: "Zentripetalkraft ist keine zusätzliche Wechselwirkung. Bei der ebenen Kurvenfahrt ist die Haftreibungskraft die nach innen gerichtete reale Kraft.", hint: "Unterscheide den Namen für die Wirkung einer resultierenden Kraft von einer eigenen Kraftart." },
    { question: "Wann wird die Kurvenfahrt kritischer?", correct: ["speed", "radius", "mu"], options: [["speed", "Die Geschwindigkeit wird größer."], ["radius", "Der Kurvenradius wird kleiner."], ["mu", "Die Haftreibungszahl wird kleiner."], ["large-radius", "Der Kurvenradius wird größer."], ["large-mu", "Die Haftreibungszahl wird größer."]], feedback: "Hohe Geschwindigkeit und kleiner Radius erhöhen die benötigte Kraft; eine kleinere Haftreibungszahl verringert die maximal verfügbare Kraft.", hint: "Vergleiche {{m·v_B²|r}} mit der maximal verfügbaren Haftreibung μ · m · g." },
    { question: "Welche Aussagen treffen zu, wenn das Haftreibungsmaximum überschritten wird?", correct: ["cannot", "slide", "kinetic", "smaller"], options: [["cannot", "Die Haftreibung kann die Seitenkraft nicht mehr vollständig ausgleichen."], ["slide", "Die Kontaktflächen beginnen gegeneinander zu rutschen."], ["kinetic", "Es wirkt nun Gleitreibung."], ["smaller", "Die Gleitreibung ist geringer als die maximale Haftreibung."], ["grow", "Die Haftreibung wächst ohne Grenze weiter."], ["none", "Nach dem Losrutschen verschwindet jede Reibung."]], feedback: "Oberhalb des Haftreibungsmaximums beginnt das Gleiten; die dann wirkende Gleitreibung ist kleiner als die maximale Haftreibung.", hint: "Prüfe, was sich genau beim Übergang vom Haften zum Gleiten ändert." },
    { question: "Welche Voraussetzungen gehören zur Massenunabhängigkeit im Modell?", correct: ["flat", "normal", "radius", "mu"], options: [["flat", "Die Fahrbahn wird als eben betrachtet."], ["normal", "Vertikal gilt: Die Normalkraft hat den Betrag m · g."], ["radius", "Die verglichenen Fahrzeuge durchfahren denselben Radius."], ["mu", "Die Haftreibungszahl und Kontaktbedingungen werden als gleich angenommen."], ["always", "Die Aussage gilt unabhängig von Straße, Reifen und Fahrzeugbau immer."], ["vertical", "Zusätzliche vertikale Kräfte verändern das Ergebnis grundsätzlich nicht."]], feedback: "Die Masse kürzt sich nur innerhalb des vereinfachten Modells bei einer Normalkraft mit dem Betrag m · g und vergleichbaren Randbedingungen heraus.", hint: "Suche nach den Annahmen zum vertikalen Kräftegleichgewicht und beim Vergleich verschiedener Fahrzeuge." },
    { question: "Wie verändert sich die benötigte Zentripetalkraft bei doppelter Geschwindigkeit?", correct: ["four"], options: [["same", "Sie bleibt gleich."], ["two", "Sie wird doppelt so groß."], ["four", "Sie wird viermal so groß."], ["half", "Sie wird halb so groß."]], feedback: "Wegen der quadratischen Abhängigkeit von {{v_B}} führt die doppelte Geschwindigkeit zur vierfachen benötigten Kraft.", hint: "Beachte den Exponenten der Geschwindigkeit." },
  ];
  items.forEach((item, index) => renderQuizQuestion(document.getElementById("friction-final-quiz"), item, index));
}

const stepTabs = setupPhysicsStepTabs();
setupNextTabButtons(stepTabs);
setupRealForces();
setupFrictionModel();
setupDecompositionAnimation();
setupConditionBuilder();
setupSemanticTasks();
setupSummary();
setupFinalQuiz();
