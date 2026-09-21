import { setupPhysicsStepTabs } from "./components/physics-step-tabs.mjs";
import { appendPhysicsText, createIndexedSymbol, createQuotient, createUnitFraction } from "./components/physics-notation.mjs";

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

function appendLearningText(target, text) {
  String(text).split(/\{\{([^{}]+)\}\}/g).forEach((part, index) => {
    if (!part) return;
    if (index % 2 === 0) { target.append(document.createTextNode(part)); return; }
    if (part.startsWith("sqrt:")) {
      const root = document.createElement("span");
      root.setAttribute("role", "img");
      root.setAttribute("aria-label", `Wurzel aus ${part.slice(5).replace("μ", "mü")}`);
      root.append(document.createTextNode("√("));
      appendLearningText(root, part.slice(5));
      root.append(document.createTextNode(")"));
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

function setupNextTabButtons(stepTabs) {
  document.querySelectorAll("[data-next-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      stepTabs.goToTab(button.dataset.nextTab, true);
      document.querySelector(".physics-step-tabs")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
    });
  });
}

function selectedValues(selector) {
  return [...document.querySelectorAll(`${selector} input:checked`)].map((input) => input.value);
}

function exactSelection(actual, expected) {
  return actual.length === expected.length && expected.every((value) => actual.includes(value));
}

function setupRealForces() {
  const expected = { hammer: "rope-weight", truck: "friction", centrifuge: "container", coaster: "rail" };
  document.getElementById("check-real-forces").addEventListener("click", () => {
    const matches = Object.entries(expected).filter(([id, value]) => document.querySelector(`[data-force-match="${id}"]`).value === value).length;
    if (matches === 4) setFeedback("real-forces-feedback", "success", "Richtig. In allen vier Situationen ist die reale Kraft oder Kraftsumme passend zugeordnet.");
    else if (matches) setFeedback("real-forces-feedback", "partial", "Teilweise korrekt. Prüfe bei den noch offenen Situationen, welcher Körper die nach innen gerichtete Kraft tatsächlich ausübt.");
    else setFeedback("real-forces-feedback", "error", "Noch nicht korrekt. Überlege für jede Situation, welcher andere Körper den bewegten Körper berührt oder an ihm zieht.");
  });
  document.getElementById("check-centripetal-role").addEventListener("click", () => {
    const value = document.querySelector("input[name='centripetal-role']:checked")?.value;
    if (!value) setFeedback("centripetal-role-feedback", "error", "Wähle zuerst eine Aussage aus.");
    else if (value === "role") setFeedback("centripetal-role-feedback", "success", "Richtig. Zentripetalkraft ist keine zusätzliche Kraftart, sondern die Bezeichnung für die zum Mittelpunkt gerichtete Wirkung der resultierenden realen Kräfte.");
    else setFeedback("centripetal-role-feedback", "error", "Noch nicht korrekt. Suche nicht nach einer zusätzlichen Kraft namens Zentripetalkraft, sondern nach der realen Wechselwirkung, die den Körper nach innen ablenkt.");
  });
}

function setupCurveStatement() {
  document.getElementById("check-curve-statement").addEventListener("click", () => {
    const value = document.querySelector("input[name='curve-statement']:checked")?.value;
    if (!value) setFeedback("curve-statement-feedback", "error", "Wähle zuerst eine Aussage aus.");
    else if (value === "correct") setFeedback("curve-statement-feedback", "success", "Richtig. Auf der ebenen Straße ist die Haftreibungskraft die reale, zum Kurvenmittelpunkt gerichtete Kraft.");
    else setFeedback("curve-statement-feedback", "error", "Noch nicht korrekt. Unterscheide zwischen einer realen Wechselwirkung und der Rolle, die diese Kraft bei der Kreisbewegung übernimmt.");
  });
}

function setupGripStatements() {
  const expected = ["wet", "ice", "larger"];
  document.getElementById("check-grip-statements").addEventListener("click", () => {
    const values = selectedValues("#grip-statements");
    const hits = values.filter((value) => expected.includes(value));
    const extras = values.filter((value) => !expected.includes(value));
    if (exactSelection(values, expected)) setFeedback("grip-statements-feedback", "success", "Richtig. Ein kleinerer Wert von μ bedeutet bei gleicher Normalkraft eine kleinere maximal übertragbare Haftreibungskraft.");
    else if (hits.length && !extras.length) setFeedback("grip-statements-feedback", "partial", "Teilweise korrekt. Vergleiche die drei Werte und nutze {{F_Haft,max}} = μ · {{F_N}}.");
    else setFeedback("grip-statements-feedback", "error", "Noch nicht korrekt. Die Haftreibungszahl beschreibt die Reibungspartner und den Fahrbahnzustand, nicht die Fahrzeugmasse.");
  });
}

function setupLimitFormula() {
  document.getElementById("check-limit-formula").addEventListener("click", () => {
    const value = document.querySelector("input[name='limit-formula']:checked")?.value;
    if (!value) setFeedback("limit-formula-feedback", "error", "Wähle zuerst eine Formel aus.");
    else if (value === "correct") setFeedback("limit-formula-feedback", "success", "Richtig. Im Grenzfall ergibt sich {{v_B,max}} = {{sqrt:μ · g · r}}.");
    else if (value === "mass") setFeedback("limit-formula-feedback", "partial", "Fast richtig. Die Wurzel stimmt, aber die Masse steht auf beiden Seiten der Ausgangsgleichung und kürzt sich.");
    else setFeedback("limit-formula-feedback", "error", "Noch nicht korrekt. Multipliziere nach dem Kürzen mit r und ziehe anschließend die Quadratwurzel.");
  });
}

function numberValue(raw) {
  const normalized = String(raw).trim().replace(/\s+/g, "").replace(",", ".");
  if (!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/.test(normalized)) return Number.NaN;
  return Number.parseFloat(normalized);
}

function decimalPlaces(raw) {
  const normalized = String(raw).trim().replace(/\s+/g, "").replace(",", ".");
  const match = normalized.match(/\.(\d*)$/);
  return match ? match[1].length : 0;
}

const speedTasks = {
  wet: { inputId: "wet-speed-answer", unitId: "wet-speed-unit", buttonId: "check-wet-speed", feedbackId: "wet-speed-feedback", exact: { mps: 19.809088823063014, kmh: 71.31271976302685 }, rounded: { mps: 19.8, kmh: 71.3 }, success: "Richtig. Zahlenwert, Einheit und die Anzahl der gültigen Ziffern stimmen. Auf nasser Straße gilt {{v_B,max}} = 19,8 {{m/s}} = 71,3 {{km/h}}." },
  ice: { inputId: "ice-speed-answer", unitId: "ice-speed-unit", buttonId: "check-ice-speed", feedbackId: "ice-speed-feedback", exact: { mps: 9.904544411531507, kmh: 35.656359881513426 }, rounded: { mps: 9.9, kmh: 35.7 }, success: "Richtig. Zahlenwert, Einheit und die Anzahl der gültigen Ziffern stimmen. Auf vereister Straße gilt {{v_B,max}} = 9,9 {{m/s}} = 35,7 {{km/h}}." },
};

function matchesSpeed(value, task, unit) {
  return Math.abs(value - task.rounded[unit]) <= 0.051 || Math.abs(value - task.exact[unit]) <= 0.025;
}

function setupSpeedTask(task) {
  document.getElementById(task.buttonId).addEventListener("click", () => {
    const raw = document.getElementById(task.inputId).value;
    const value = numberValue(raw);
    const unit = document.getElementById(task.unitId).value;
    if (!unit) { setFeedback(task.feedbackId, "error", "Wähle zuerst die Einheit im Auswahlfeld neben dem Eingabefeld aus."); return; }
    if (!Number.isFinite(value)) { setFeedback(task.feedbackId, "error", "Gib einen Zahlenwert ein."); return; }
    const validUnits = ["mps", "kmh"];
    const matchesAny = validUnits.some((candidate) => matchesSpeed(value, task, candidate));
    if (!validUnits.includes(unit)) {
      if (matchesAny) setFeedback(task.feedbackId, "partial", "Der Zahlenwert ist grundsätzlich passend, aber eine Geschwindigkeit wird hier in {{m/s}} oder {{km/h}} angegeben.");
      else setFeedback(task.feedbackId, "error", "Prüfe deinen Zahlenwert, die Einheit und die Anzahl der gültigen Ziffern. Nutze {{v_B,max}} = {{sqrt:μ · g · r}} und runde erst das Endergebnis.");
      return;
    }
    if (matchesSpeed(value, task, unit)) {
      if (decimalPlaces(raw) === 1) setFeedback(task.feedbackId, "success", task.success);
      else setFeedback(task.feedbackId, "partial", "Dein Rechenwert ist grundsätzlich passend. Runde das Endergebnis noch auf eine Nachkommastelle.");
      return;
    }
    const otherUnit = unit === "mps" ? "kmh" : "mps";
    if (matchesSpeed(value, task, otherUnit)) { setFeedback(task.feedbackId, "partial", "Dein Zahlenwert passt zur anderen Geschwindigkeitseinheit. Prüfe die Zuordnung zwischen Zahlenwert und gewählter Einheit."); return; }
    setFeedback(task.feedbackId, "error", "Prüfe deinen Zahlenwert, die Einheit und die Anzahl der gültigen Ziffern. Nutze {{v_B,max}} = {{sqrt:μ · g · r}} und runde erst das Endergebnis.");
  });
}

function renderQuizQuestion(target, item, index) {
  const fieldset = document.createElement("fieldset");
  fieldset.className = "physics-quiz-question";
  const legend = document.createElement("legend");
  appendLearningText(legend, `${index + 1}. ${item.question}${item.correct.length > 1 ? " (mehrere Antworten)" : ""}`);
  const options = document.createElement("div");
  options.className = "quiz-options";
  item.options.forEach(([value, text]) => {
    const label = document.createElement("label");
    label.className = "quiz-option";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = value;
    const optionText = document.createElement("span");
    optionText.className = "quiz-option-text";
    appendLearningText(optionText, text);
    label.append(input, optionText);
    options.append(label);
  });
  const button = document.createElement("button");
  button.type = "button";
  button.className = "physics-primary-button direct-check-button";
  button.textContent = "Antwort prüfen";
  const feedback = document.createElement("p");
  feedback.className = "physics-feedback";
  feedback.hidden = true;
  feedback.setAttribute("role", "status");
  feedback.setAttribute("aria-live", "polite");
  button.addEventListener("click", () => {
    const values = [...fieldset.querySelectorAll("input:checked")].map((input) => input.value);
    const hits = values.filter((value) => item.correct.includes(value));
    const extras = values.filter((value) => !item.correct.includes(value));
    if (hits.length === item.correct.length && !extras.length) setFeedback(feedback, "success", `Korrekt: ${item.feedback}`);
    else if (hits.length && !extras.length) setFeedback(feedback, "partial", `Teilweise korrekt: Es fehlt noch mindestens eine richtige Aussage. ${item.hint}`);
    else setFeedback(feedback, "error", `Noch nicht korrekt. ${item.hint}`);
  });
  fieldset.append(legend, options, button, feedback);
  target.append(fieldset);
}

function setupFinalQuiz() {
  const items = [
    { question: "Welche Aussagen zur Zentripetalkraft bei einer ebenen Kurvenfahrt sind richtig?", correct: ["role", "friction", "direction"], options: [["role", "Zentripetalkraft bezeichnet die zum Kreismittelpunkt gerichtete Rolle der resultierenden Kraft."], ["friction", "Die Haftreibungskraft kann bei der ebenen Kurvenfahrt diese Rolle übernehmen."], ["direction", "Die nach innen gerichtete Kraft verändert fortlaufend die Bewegungsrichtung."], ["extra", "Zusätzlich zur Haftreibungskraft wirkt immer eine eigenständige Zentripetalkraft."], ["outward", "Die Zentripetalkraft zeigt nach außen."]], feedback: "Bei der ebenen Kurvenfahrt ist die Haftreibungskraft die reale, nach innen gerichtete Kraft. Zentripetalkraft bezeichnet ihre Rolle bei der Kreisbewegung.", hint: "Unterscheide eine reale Wechselwirkung von der Bezeichnung für ihre Wirkung bei der Kreisbewegung." },
    { question: "Welche Aussagen zur Haftreibungszahl μ sind richtig?", correct: ["partners", "larger", "ice"], options: [["partners", "Sie hängt von den Reibungspartnern und vom Fahrbahnzustand ab."], ["larger", "Ein größerer Wert von μ ermöglicht eine größere maximale Haftreibungskraft."], ["ice", "Für die angegebenen Werte ist μ auf Eis kleiner als auf nasser Straße."], ["mass", "Sie wird größer, wenn die Fahrzeugmasse wächst."], ["one", "Sie besitzt immer den Wert 1."]], feedback: "Die Haftreibungszahl beschreibt die Kontaktbedingungen. Zusammen mit der Normalkraft bestimmt sie die maximal mögliche Haftreibungskraft.", hint: "Vergleiche {{F_Haft,max}} = μ · {{F_N}} mit den drei Tabellenwerten." },
    { question: "Welche Formel beschreibt die maximale Bahngeschwindigkeit auf einer ebenen Kurve?", correct: ["correct"], options: [["correct", "{{v_B,max}} = {{sqrt:μ · g · r}}"], ["linear", "{{v_B,max}} = μ · g · r"], ["mass", "{{v_B,max}} = {{sqrt:m · μ · g · r}}"], ["denominator", "{{v_B,max}} = √({{μ · g|r}})"]], feedback: "Die Masse kürzt sich; nach dem Umstellen wird die Quadratwurzel aus μ · g · r gezogen.", hint: "Beginne mit m · {{v_B²|r}} = μ · m · g." },
    { question: "Welche Aussagen folgen aus der Herleitung?", correct: ["limit", "cancel", "radius"], options: [["limit", "Im Grenzfall gilt {{F_Z}} = {{F_Haft,max}}."], ["cancel", "Die Fahrzeugmasse steht auf beiden Seiten und kürzt sich."], ["radius", "Bei gleichen Kontaktbedingungen erlaubt ein größerer Kurvenradius eine größere Maximalgeschwindigkeit."], ["smaller", "Ein kleinerer Kurvenradius vergrößert die Maximalgeschwindigkeit."], ["proportional", "Die Maximalgeschwindigkeit ist proportional zur Fahrzeugmasse."]], feedback: "Die Grenzgeschwindigkeit hängt im Modell von μ, g und r, aber nicht von der Fahrzeugmasse ab.", hint: "Lies die Abhängigkeiten direkt aus {{v_B,max}} = {{sqrt:μ · g · r}} ab." },
    { question: "Welche Rechenergebnisse gehören zur Kurve mit r = 50 m?", correct: ["dry", "wet", "ice"], options: [["dry", "Trockene Straße: 79,7 {{km/h}}."], ["wet", "Nasse Straße: 71,3 {{km/h}}."], ["ice", "Vereiste Straße: 35,7 {{km/h}}."], ["equal", "Auf nasser und vereister Straße ist die Maximalgeschwindigkeit gleich."], ["higher", "Auf Eis ist die Maximalgeschwindigkeit größer als auf trockener Straße."]], feedback: "Die kleinere Haftreibungszahl senkt die Maximalgeschwindigkeit: trocken vor nass vor Eis.", hint: "Vergleiche die Werte von μ; die Geschwindigkeit hängt von √(μ) ab." },
  ];
  const target = document.getElementById("friction-final-quiz");
  items.forEach((item, index) => renderQuizQuestion(target, item, index));
}

const stepTabs = setupPhysicsStepTabs();
setupNextTabButtons(stepTabs);
setupRealForces();
setupCurveStatement();
setupGripStatements();
setupLimitFormula();
setupSpeedTask(speedTasks.wet);
setupSpeedTask(speedTasks.ice);
setupFinalQuiz();
