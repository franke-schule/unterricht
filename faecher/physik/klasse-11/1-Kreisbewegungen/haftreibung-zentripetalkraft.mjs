import { setupPhysicsStepTabs } from "./components/physics-step-tabs.mjs";
import { addSquareRootSigns, appendPhysicsText, createIndexedSymbol, createQuotient, createSquareRoot, createUnitFraction } from "./components/physics-notation.mjs?v=20260922b";
import { enableTokenDrag, wasDragged } from "./components/token-drag.mjs";

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
      const { root, radicand } = createSquareRoot(`Wurzel aus ${part.slice(5).replace("μ", "mü").replaceAll("·", "mal")}`);
      appendLearningText(radicand, part.slice(5));
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

// Herleitung als Zuordnung: links die Rechenschritte in Reihenfolge, rechts
// daneben die Umformung, die zum Schritt führt. Eine Beschreibung gilt als
// richtig, wenn sie zur Gleichung in derselben Zeile passt. Je eine Karte pro
// Speicher greift eine typische Fehlvorstellung auf und bleibt übrig.
// Ziehen und Antippen wie in kraefte-bewegung.mjs (setupLawTermMatching).
const derivationSteps = [
  { id: "limit", formula: "{{F_Z}} = {{F_Haft,max}}", spoken: "F mit Index Z gleich F mit Index Haft,max", description: "Grenzfall ansetzen" },
  { id: "insert", formula: "m · {{v_B²|r}} = μ · m · g", spoken: "m mal v mit Index B zum Quadrat durch r gleich mü mal m mal g", description: "Formeln einsetzen" },
  { id: "cancel", formula: "{{v_B²|r}} = μ · g", spoken: "v mit Index B zum Quadrat durch r gleich mü mal g", description: "Masse kürzen" },
  { id: "multiply", formula: "{{v_B}}² = μ · g · r", spoken: "v mit Index B zum Quadrat gleich mü mal g mal r", description: "Mit r multiplizieren" },
  { id: "root", formula: "{{v_B,max}} = {{sqrt:μ · g · r}}", spoken: "v mit Index B,max gleich Wurzel aus mü mal g mal r", description: "Wurzel ziehen" },
];
const derivationFormulaCards = [
  ...derivationSteps.map(({ id, formula, spoken }) => ({ id, text: formula, spoken })),
  { id: "no-root", text: "{{v_B,max}} = μ · g · r", spoken: "v mit Index B,max gleich mü mal g mal r" },
];
const derivationDescriptionCards = [
  ...derivationSteps.map(({ id, description }) => ({ id, text: description, spoken: description })),
  { id: "divide", text: "Durch r teilen", spoken: "Durch r teilen" },
];

function setupDerivationSort() {
  const target = document.getElementById("derivation-sort");
  const feedback = document.getElementById("derivation-feedback");
  const remember = document.getElementById("derivation-remember");
  // Feste, gemischte Speicherreihenfolge; Beschreibungen alphabetisch, damit
  // die Reihenfolge nichts verrät.
  const formulaOrder = ["insert", "cancel", "no-root", "root", "limit", "multiply"];
  const groups = {
    formula: { cards: formulaOrder.map((id) => derivationFormulaCards.find((card) => card.id === id)), title: "Rechenschritte", column: "Reihenfolge der Rechenschritte", slotName: "Rechenschritt" },
    description: { cards: [...derivationDescriptionCards].sort((left, right) => left.text.localeCompare(right.text, "de")), title: "Beschreibungen", column: "Was wird gemacht?", slotName: "Beschreibung" },
  };
  Object.values(groups).forEach((group) => { group.values = derivationSteps.map(() => ""); group.slots = []; });
  let picked = null; // { group, value, from } mit from = Zeilenindex oder -1 (Speicher)

  const cardOf = (groupName, id) => groups[groupName].cards.find((card) => card.id === id);
  const selectors = (groupName) => ({
    dropSelector: `#derivation-sort .formula-slot[data-group="${groupName}"]`,
    bankSelector: `#derivation-sort .derivation-bank[data-group="${groupName}"]`,
  });

  function place(groupName, value, from, to) {
    const values = groups[groupName].values;
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

  function renderCard(element, groupName, id) {
    element.replaceChildren();
    appendLearningText(element, cardOf(groupName, id).text);
  }

  // Die Speicher stehen auf breiten Bildschirmen als dritte Spalte rechts,
  // sonst über den Zeilen (siehe CSS); die Spaltenköpfe nur im ersten Fall.
  const banks = document.createElement("div");
  banks.className = "derivation-banks";
  Object.entries(groups).forEach(([groupName, group]) => {
    const block = document.createElement("div");
    block.className = "derivation-bank-block";
    const heading = document.createElement("h4");
    heading.textContent = group.title;
    group.bank = document.createElement("div");
    group.bank.className = "cloze-term-bank derivation-bank";
    group.bank.dataset.group = groupName;
    group.bank.setAttribute("aria-label", `Speicher: ${group.title}`);
    block.append(heading, group.bank);
    banks.append(block);
  });
  target.append(banks);
  Object.entries(groups).forEach(([groupName, group]) => {
    const head = document.createElement("p");
    head.className = `derivation-column-head derivation-cell-${groupName}`;
    head.textContent = group.column;
    head.setAttribute("aria-hidden", "true");
    target.append(head);
  });

  derivationSteps.forEach((step, index) => {
    Object.entries(groups).forEach(([groupName, group]) => {
      const cell = document.createElement("div");
      cell.className = `derivation-cell derivation-cell-${groupName}`;
      cell.style.setProperty("--derivation-row", String(index + 2));
      if (groupName === "formula") {
        const number = document.createElement("span");
        number.className = "derivation-step-number";
        number.textContent = String(index + 1);
        number.setAttribute("aria-hidden", "true");
        cell.append(number);
      }
      const slot = document.createElement("button");
      slot.type = "button";
      slot.className = "formula-slot";
      slot.dataset.group = groupName;
      slot.dataset.index = String(index);
      enableTokenDrag(slot, {
        ...selectors(groupName),
        getLabel: () => group.values[index],
        renderGhost: (ghost) => renderCard(ghost, groupName, group.values[index]),
        onDrop: (dropSlot, onBank) => {
          const value = group.values[index];
          const to = dropSlot ? Number(dropSlot.dataset.index) : -1;
          if (to >= 0 && to !== index) place(groupName, value, index, to);
          else if (onBank) place(groupName, value, index, -1);
          else render();
        },
      });
      slot.addEventListener("click", () => {
        if (wasDragged(slot)) return;
        const value = group.values[index];
        if (picked?.group === groupName && picked.from !== index) { place(groupName, picked.value, picked.from, index); slot.focus(); return; }
        if (picked?.group === groupName && picked.from === index) { place(groupName, value, index, -1); return; }
        if (value) { picked = { group: groupName, value, from: index }; render(); slot.focus(); }
      });
      group.slots.push(slot);
      cell.append(slot);
      target.append(cell);
    });
  });

  function render() {
    Object.entries(groups).forEach(([groupName, group]) => {
      group.bank.replaceChildren(...group.cards.filter((card) => !group.values.includes(card.id)).map((card) => {
        const token = document.createElement("button");
        token.type = "button";
        token.className = "cloze-token";
        renderCard(token, groupName, card.id);
        const isPicked = picked?.group === groupName && picked.value === card.id && picked.from === -1;
        token.setAttribute("aria-pressed", String(isPicked));
        token.setAttribute("aria-label", card.spoken);
        token.classList.toggle("is-picked", isPicked);
        enableTokenDrag(token, {
          ...selectors(groupName),
          getLabel: () => card.id,
          renderGhost: (ghost) => renderCard(ghost, groupName, card.id),
          onDrop: (slot) => { if (slot) place(groupName, card.id, -1, Number(slot.dataset.index)); else render(); },
        });
        token.addEventListener("click", () => {
          if (wasDragged(token)) return;
          picked = isPicked ? null : { group: groupName, value: card.id, from: -1 };
          render();
          if (picked) (group.slots.find((slot) => !slot.classList.contains("is-filled")) || group.slots[0])?.focus();
        });
        return token;
      }));
      group.slots.forEach((slot, index) => {
        const value = group.values[index];
        if (value) renderCard(slot, groupName, value);
        else slot.textContent = "Hierher ziehen";
        slot.classList.toggle("is-filled", Boolean(value));
        slot.classList.toggle("is-picked", picked?.group === groupName && picked.from === index);
        slot.classList.toggle("is-selected", picked?.group === groupName && !value);
        slot.setAttribute("aria-label", `${group.slotName} in Zeile ${index + 1}: ${value ? cardOf(groupName, value).spoken : "leer"}`);
      });
    });
  }

  document.getElementById("check-derivation").addEventListener("click", () => {
    const formulas = groups.formula.values;
    const descriptions = groups.description.values;
    const total = derivationSteps.length;
    remember.hidden = true;
    if (formulas.includes("") || descriptions.includes("")) {
      setFeedback(feedback, "error", `Fülle zuerst alle ${total} Zeilen: links je einen Rechenschritt, rechts je eine Beschreibung.`);
      return;
    }
    const orderHits = formulas.filter((id, index) => id === derivationSteps[index].id).length;
    const pairHits = descriptions.filter((id, index) => id === formulas[index]).length;
    if (orderHits === total && pairHits === total) {
      setFeedback(feedback, "success", "Richtig. Jede Gleichung entsteht durch genau eine Umformung aus der Zeile darüber, und jede Beschreibung nennt diese Umformung. Am Ende steht {{v_B,max}} = {{sqrt:μ · g · r}}.");
      remember.hidden = false;
      return;
    }
    const hints = [];
    if (formulas.includes("no-root")) hints.push("Die Gleichung {{v_B,max}} = μ · g · r gehört nicht in die Herleitung: Nach dem Multiplizieren mit r steht links noch {{v_B}}². Erst die Quadratwurzel liefert {{v_B,max}}.");
    if (descriptions.includes("divide")) hints.push("„Durch r teilen“ passt zu keinem Schritt: r steht bereits im Nenner. Um r aus dem Nenner zu holen, multiplizierst du mit r.");
    if (orderHits < total) hints.push(`${orderHits} von ${total} Rechenschritten stehen an der richtigen Stelle. Jede Gleichung muss durch genau eine Umformung aus der Zeile darüber entstehen.`);
    if (pairHits < total) hints.push(`${pairHits} von ${total} Beschreibungen passen zum Rechenschritt links daneben. Eine Beschreibung nennt die Umformung, die zu dieser Gleichung führt.`);
    const status = orderHits + pairHits > 0 ? "partial" : "error";
    setFeedback(feedback, status, `${status === "partial" ? "Teilweise korrekt." : "Noch nicht korrekt."} ${hints.join(" ")}`);
  });

  document.getElementById("reset-derivation").addEventListener("click", () => {
    Object.values(groups).forEach((group) => group.values.fill(""));
    picked = null;
    feedback.hidden = true;
    remember.hidden = true;
    render();
  });

  render();
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

addSquareRootSigns();
const stepTabs = setupPhysicsStepTabs();
setupNextTabButtons(stepTabs);
setupRealForces();
setupCurveStatement();
setupGripStatements();
setupDerivationSort();
setupSpeedTask(speedTasks.wet);
setupSpeedTask(speedTasks.ice);
setupFinalQuiz();
