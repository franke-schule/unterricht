import { setupPhysicsStepTabs } from "./components/physics-step-tabs.mjs";
import { appendPhysicsText, createIndexedSymbol, physicsTextSpan, unitChoiceValue } from "./components/physics-notation.mjs?v=20260915a";
import { centripetalForce, circleVectors, clamp, shuffleIncorrect, tangentialSpeed } from "./components/circle-kinematics.mjs";
import { setupPhysicsSemanticTask } from "./components/physics-semantic-task.mjs";

// ---- Unverändert aus kraefte-bewegung.mjs / winkelgeschwindigkeit-kreisbewegung.mjs übernommen ----

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

function renderQuizQuestion(target, item, index) {
  const fieldset = document.createElement("fieldset");
  fieldset.className = "physics-quiz-question";
  const legend = document.createElement("legend");
  appendPhysicsText(legend, `${index + 1}. ${item.question}${item.correct.length > 1 ? " (mehrere Antworten)" : ""}`);
  const options = document.createElement("div");
  options.className = "quiz-options";
  item.options.forEach(([value, labelText]) => {
    const label = document.createElement("label");
    label.className = "quiz-option";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = value;
    label.append(input, physicsTextSpan(labelText, "quiz-option-text"));
    options.append(label);
  });
  const check = document.createElement("button");
  check.type = "button";
  check.className = "physics-primary-button direct-check-button";
  check.textContent = "Antwort prüfen";
  const feedback = document.createElement("p");
  feedback.className = "physics-feedback";
  feedback.hidden = true;
  feedback.setAttribute("role", "status");
  feedback.setAttribute("aria-live", "polite");
  check.addEventListener("click", () => {
    const selected = [...fieldset.querySelectorAll("input:checked")].map((input) => input.value);
    const hits = selected.filter((value) => item.correct.includes(value));
    const extras = selected.filter((value) => !item.correct.includes(value));
    const exact = hits.length === item.correct.length && extras.length === 0;
    if (exact) setFeedback(feedback, "success", "Korrekt: " + item.feedback);
    else if (hits.length && !extras.length) setFeedback(feedback, "partial", "Teilweise korrekt: Es fehlt noch mindestens eine richtige Aussage. " + item.hint);
    else setFeedback(feedback, "error", "Noch nicht korrekt. " + item.hint);
  });
  fieldset.append(legend, options, check, feedback);
  target.append(fieldset);
}

// ---- Weiter-Buttons am Ende jedes Reiterinhalts (außer im letzten Reiter) ----

function setupNextTabButtons(stepTabs) {
  document.querySelectorAll("[data-next-tab]").forEach((button) => {
    button.addEventListener("click", () => {
      stepTabs.goToTab(button.dataset.nextTab, true);
      const tabs = document.querySelector(".physics-step-tabs");
      const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      tabs?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
    });
  });
}

// ---- Reiter 1 · Hammerwurf ----

function setupHammerQuiz() {
  renderQuizQuestion(document.getElementById("hammer-quiz"), {
    question: "Welche Aussagen passen zu den Skizzen?",
    correct: ["rope", "tangent"],
    options: [
      ["rope", "Das Seil übt auf die Kugel eine Kraft zum Kreismittelpunkt aus."],
      ["radial", "Nach dem Loslassen fliegt die Kugel geradlinig vom Mittelpunkt weg nach außen."],
      ["tangent", "Nach dem Loslassen bewegt sich die Kugel tangential zur Kreisbahn geradlinig weiter."],
      ["noforce", "Die Kugel würde auch ohne Kraft auf der Kreisbahn bleiben."],
    ],
    feedback: "Das Seil zieht die Kugel ständig zum Kreismittelpunkt. Ohne diese Kraft bewegt sie sich nach dem Trägheitssatz tangential geradlinig weiter.",
    hint: "Erinnere dich an Aufgabe 1 zur Winkelgeschwindigkeit: Wohin zeigt die Zentripetalkraft, und was geschieht, wenn sie wegfällt?",
  }, 0);
}

// Freitext-Lückentext ohne Wortvorgaben (ersetzt das frühere Multiple-Choice
// aus Aufgabe 2b). Toleranz: Groß-/Kleinschreibung, Leerzeichen am Rand und
// die ASCII-Ersatzschreibweise ("groesser" statt "größer") werden akzeptiert.
function normalizeGermanWord(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/ß/g, "ss")
    .replace(/ö/g, "oe")
    .replace(/ä/g, "ae")
    .replace(/ü/g, "ue")
    .replace(/\s+/g, "");
}

function wordMatches(value, expected) {
  return normalizeGermanWord(value) === normalizeGermanWord(expected);
}

function setupJeDestoCloze() {
  const items = [
    {
      inputIds: ["je-desto-mass-1", "je-desto-mass-2"],
      feedbackId: "je-desto-mass-feedback",
      buttonId: "check-je-desto-mass",
      successText: "Korrekt: Je größer die Masse m, desto größer die Zentripetalkraft {{F_Z}}.",
      partialText: "Eine Lücke stimmt schon. Stelle in der Simulation aus Aufgabe 2a nur die Masse m ein und beobachte den roten Kraftpfeil, während m größer wird.",
      errorText: "Noch nicht korrekt. Wähle in der Simulation aus Aufgabe 2a die Masse m aus, vergrößere sie mit dem Regler und beobachte den roten Kraftpfeil sowie den Wert von {{F_Z}}.",
    },
    {
      inputIds: ["je-desto-omega-1", "je-desto-omega-2"],
      feedbackId: "je-desto-omega-feedback",
      buttonId: "check-je-desto-omega",
      successText: "Korrekt: Je größer die Winkelgeschwindigkeit ω, desto größer die Zentripetalkraft {{F_Z}}.",
      partialText: "Eine Lücke stimmt schon. Stelle in der Simulation aus Aufgabe 2a nur die Winkelgeschwindigkeit ω ein und beobachte den roten Kraftpfeil, während ω größer wird.",
      errorText: "Noch nicht korrekt. Wähle in der Simulation aus Aufgabe 2a die Winkelgeschwindigkeit ω aus, vergrößere sie mit dem Regler und beobachte den roten Kraftpfeil sowie den Wert von {{F_Z}}.",
    },
    {
      inputIds: ["je-desto-radius-1", "je-desto-radius-2"],
      feedbackId: "je-desto-radius-feedback",
      buttonId: "check-je-desto-radius",
      successText: "Korrekt: Je größer der Radius r bei gleicher Winkelgeschwindigkeit ω, desto größer die Zentripetalkraft {{F_Z}}.",
      partialText: "Eine Lücke stimmt schon. Stelle in der Simulation aus Aufgabe 2a nur den Radius r ein und beobachte den roten Kraftpfeil, während r größer wird.",
      errorText: "Noch nicht korrekt. Wähle in der Simulation aus Aufgabe 2a den Radius r aus, vergrößere ihn mit dem Regler und beobachte den roten Kraftpfeil sowie den Wert von {{F_Z}}.",
    },
  ];
  items.forEach((item) => {
    document.getElementById(item.buttonId).addEventListener("click", () => {
      const inputs = item.inputIds.map((id) => document.getElementById(id));
      const correctCount = inputs.filter((input) => wordMatches(input.value, "größer")).length;
      if (correctCount === 2) setFeedback(item.feedbackId, "success", item.successText);
      else if (correctCount === 1) setFeedback(item.feedbackId, "partial", item.partialText);
      else setFeedback(item.feedbackId, "error", item.errorText);
    });
  });
}

// ---- Simulationen (setupSpeedSimulation → setupCentripetalSimulation) ----

function renderStatus(status, text) {
  status.replaceChildren();
  appendPhysicsText(status, text);
}

function setupCentripetalSimulation(config) {
  const host = config.host;
  const svg = {
    orbit: host.querySelector("[data-cf-orbit]"),
    radiusLine: host.querySelector("[data-cf-radius]"),
    body: host.querySelector("[data-cf-body]"),
    force: host.querySelector("[data-cf-force]"),
    speed: host.querySelector("[data-cf-speed]"),
    forceLabel: host.querySelector("[data-cf-force-label]"),
    speedLabel: host.querySelector("[data-cf-speed-label]"),
  };
  const panel = host.closest("[data-physics-panel]");
  const status = host.querySelector("[data-cf-status]");
  const center = { x: 300, y: 300 };
  let rotation = -Math.PI / 2;
  let running = false;
  let frame = 0;
  let last = 0;

  function reducedMotion() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  function paint() {
    const v = config.getValues();
    const radiusPx = 220 * v.radius;
    const bodyRadius = 8 + 40 * v.mass;
    const vectors = circleVectors(rotation, radiusPx);
    const point = { x: center.x + vectors.position.x, y: center.y + vectors.position.y };
    svg.orbit.setAttribute("r", radiusPx);
    svg.radiusLine.setAttribute("x2", point.x);
    svg.radiusLine.setAttribute("y2", point.y);
    svg.body.setAttribute("cx", point.x);
    svg.body.setAttribute("cy", point.y);
    svg.body.setAttribute("r", bodyRadius);

    const forceStart = { x: point.x + vectors.inward.x * bodyRadius, y: point.y + vectors.inward.y * bodyRadius };
    const forceLength = 50 * v.force;
    const forceEnd = { x: forceStart.x + vectors.inward.x * forceLength, y: forceStart.y + vectors.inward.y * forceLength };
    svg.force.setAttribute("x1", forceStart.x);
    svg.force.setAttribute("y1", forceStart.y);
    svg.force.setAttribute("x2", forceEnd.x);
    svg.force.setAttribute("y2", forceEnd.y);

    const speedStart = { x: point.x + vectors.tangent.x * bodyRadius, y: point.y + vectors.tangent.y * bodyRadius };
    const speedLength = 22 * v.speed;
    const speedEnd = { x: speedStart.x + vectors.tangent.x * speedLength, y: speedStart.y + vectors.tangent.y * speedLength };
    svg.speed.setAttribute("x1", speedStart.x);
    svg.speed.setAttribute("y1", speedStart.y);
    svg.speed.setAttribute("x2", speedEnd.x);
    svg.speed.setAttribute("y2", speedEnd.y);

    const forceMid = { x: forceStart.x + vectors.inward.x * (forceLength / 2), y: forceStart.y + vectors.inward.y * (forceLength / 2) };
    const forceLabelPoint = { x: clamp(forceMid.x - vectors.tangent.x * 34, 40, 560), y: clamp(forceMid.y - vectors.tangent.y * 34, 40, 560) };
    svg.forceLabel.setAttribute("transform", `translate(${forceLabelPoint.x} ${forceLabelPoint.y})`);
    const speedLabelPoint = { x: clamp(speedEnd.x - vectors.inward.x * 34, 40, 560), y: clamp(speedEnd.y - vectors.inward.y * 34, 40, 560) };
    svg.speedLabel.setAttribute("transform", `translate(${speedLabelPoint.x} ${speedLabelPoint.y})`);

    config.renderReadout(v);
  }

  function tick(time) {
    if (!running) return;
    const elapsed = last ? (time - last) / 1000 : 0;
    last = time;
    rotation += elapsed * config.getValues().omega;
    paint();
    frame = requestAnimationFrame(tick);
  }

  function stop() { running = false; cancelAnimationFrame(frame); }
  function restart() {
    stop();
    rotation = -Math.PI / 2;
    if (reducedMotion()) { paint(); renderStatus(status, config.reducedMotionStatus); return; }
    paint();
    renderStatus(status, config.runningStatus);
    running = true;
    last = 0;
    frame = requestAnimationFrame(tick);
  }
  function pause(message) { stop(); renderStatus(status, message || config.pausedStatus); }

  host.querySelector('[data-cf-action="restart"]').addEventListener("click", restart);
  host.querySelector('[data-cf-action="pause"]').addEventListener("click", () => pause());

  config.bindControls({ paint, setStatus: (message) => renderStatus(status, message) });

  document.addEventListener("visibilitychange", () => { if (document.hidden && running) pause("Bewegung pausiert, weil die Seite nicht sichtbar ist."); });
  new MutationObserver(() => { if (panel.hidden && running) pause("Bewegung pausiert, weil der Reiter gewechselt wurde."); }).observe(panel, { attributes: true, attributeFilter: ["hidden"] });

  paint();
  renderStatus(status, reducedMotion() ? config.reducedMotionStatus : config.readyStatus);
}

const READY_STATUS = "Bereit. Die Knetmasse startet oben und bewegt sich im Uhrzeigersinn.";
const RUNNING_STATUS = "Bewegung läuft im Uhrzeigersinn.";
const PAUSED_STATUS = "Bewegung pausiert.";
const REDUCED_MOTION_STATUS = "Bewegung ist wegen der Einstellung für reduzierte Bewegung angehalten. Pfeile und Werte ändern sich trotzdem mit den Reglern.";
const BASELINE_FORCE = 0.8;

function createExploreConfig(host) {
  const defaults = { mass: 0.1, radius: 0.5, omega: 4 };
  const state = { ...defaults };
  let variable = "mass";
  const inputs = {
    mass: host.querySelector('[data-cf-input="mass"]'),
    radius: host.querySelector('[data-cf-input="radius"]'),
    omega: host.querySelector('[data-cf-input="omega"]'),
  };
  // Strukturell statt über einen festen Gruppennamen ausgewählt, damit diese
  // Konfiguration unverändert für mehrere Instanzen (Aufgabe 2a und die
  // kleine Simulation in Aufgabe 3) wiederverwendet werden kann.
  const radios = [...host.querySelectorAll('fieldset input[type="radio"]')];
  const messages = {
    mass: "Du veränderst nur die Masse m. Radius und Winkelgeschwindigkeit bleiben auf den Ausgangswerten.",
    radius: "Du veränderst nur den Radius r. Masse und Winkelgeschwindigkeit bleiben auf den Ausgangswerten.",
    omega: "Du veränderst nur die Winkelgeschwindigkeit ω. Masse und Radius bleiben auf den Ausgangswerten.",
  };

  function applyDisabled() {
    Object.entries(inputs).forEach(([key, input]) => { input.disabled = key !== variable; });
  }
  function applyInputs() {
    inputs.mass.value = state.mass;
    inputs.radius.value = state.radius;
    inputs.omega.value = state.omega;
  }

  return {
    host,
    getValues() {
      const force = centripetalForce(state.mass, state.omega, state.radius);
      const speed = tangentialSpeed(state.omega, state.radius);
      return { mass: state.mass, radius: state.radius, omega: state.omega, speed, force };
    },
    renderReadout(v) {
      host.querySelector("[data-cf-mass]").textContent = formatNumber(v.mass, 2);
      host.querySelector("[data-cf-radius-value]").textContent = formatNumber(v.radius, 2);
      host.querySelector("[data-cf-omega]").textContent = formatNumber(v.omega, 1);
      host.querySelector("[data-cf-speed-value]").textContent = formatNumber(v.speed, 1);
      host.querySelector("[data-cf-force-value]").textContent = formatNumber(v.force, 2);
      host.querySelector("[data-cf-factor]").textContent = formatNumber(v.force / BASELINE_FORCE, 2);
    },
    readyStatus: READY_STATUS,
    runningStatus: RUNNING_STATUS,
    pausedStatus: PAUSED_STATUS,
    reducedMotionStatus: REDUCED_MOTION_STATUS,
    bindControls({ paint, setStatus }) {
      applyDisabled();
      Object.entries(inputs).forEach(([key, input]) => {
        input.addEventListener("input", () => { state[key] = Number(input.value); paint(); });
      });
      radios.forEach((radio) => {
        radio.addEventListener("change", () => {
          if (!radio.checked) return;
          variable = radio.value;
          Object.assign(state, defaults);
          applyInputs();
          applyDisabled();
          paint();
          setStatus(messages[variable]);
        });
      });
    },
  };
}

function createRadiusConfig() {
  const host = document.querySelector('[data-centripetal-simulation="radius"]');
  const mass = 0.1;
  const fixedOmega = 4;
  const fixedSpeed = 2;
  const defaultRadius = 0.5;
  const state = { radius: defaultRadius };
  let mode = "omega";
  const input = host.querySelector('[data-cf-input="radius"]');
  const radios = [...host.querySelectorAll('input[name="cf-radius-mode"]')];
  const messages = {
    omega: "Die Winkelgeschwindigkeit ω bleibt gleich. Wird r größer, wird auch {{v_B}} größer.",
    speed: "Die Bahngeschwindigkeit {{v_B}} bleibt gleich. Wird r größer, wird ω kleiner.",
  };

  return {
    host,
    getValues() {
      const radius = state.radius;
      let omega;
      let speed;
      if (mode === "omega") { omega = fixedOmega; speed = tangentialSpeed(omega, radius); }
      else { speed = fixedSpeed; omega = radius > 0 ? speed / radius : 0; }
      const force = centripetalForce(mass, omega, radius);
      return { mass, radius, omega, speed, force };
    },
    renderReadout(v) {
      host.querySelector("[data-cf-radius-value]").textContent = formatNumber(v.radius, 2);
      host.querySelector("[data-cf-omega]").textContent = formatNumber(v.omega, 1);
      host.querySelector("[data-cf-speed-value]").textContent = formatNumber(v.speed, 1);
      host.querySelector("[data-cf-force-value]").textContent = formatNumber(v.force, 2);
      host.querySelector("[data-cf-factor]").textContent = formatNumber(v.force / BASELINE_FORCE, 2);
    },
    readyStatus: READY_STATUS,
    runningStatus: RUNNING_STATUS,
    pausedStatus: PAUSED_STATUS,
    reducedMotionStatus: REDUCED_MOTION_STATUS,
    bindControls({ paint, setStatus }) {
      input.addEventListener("input", () => { state.radius = Number(input.value); paint(); });
      radios.forEach((radio) => {
        radio.addEventListener("change", () => {
          if (!radio.checked) return;
          mode = radio.value;
          paint();
          setStatus(messages[mode]);
        });
      });
    },
  };
}

// ---- Reiter 2 · Proportionalitäten ----

function setupProportionRows() {
  const rows = [
    {
      key: "mass", legend: "Masse m (r und ω bleiben gleich)", correct: "linear",
      options: [["linear", "{{F_Z}} ~ m"], ["inverse", "{{F_Z}} ~ {{1|m}}"]],
      hint: " Masse: Vergleiche {{F_Z}} bei m = 0,05 kg und m = 0,10 kg.",
    },
    {
      key: "radius", legend: "Radius r (m und ω bleiben gleich)", correct: "linear",
      options: [["linear", "{{F_Z}} ~ r"], ["square", "{{F_Z}} ~ r²"], ["inverse", "{{F_Z}} ~ {{1|r}}"]],
      hint: " Radius: Vergleiche {{F_Z}} bei r = 0,25 m und r = 0,50 m.",
    },
    {
      key: "omega", legend: "Winkelgeschwindigkeit ω (m und r bleiben gleich)", correct: "square",
      options: [["linear", "{{F_Z}} ~ ω"], ["square", "{{F_Z}} ~ ω²"], ["inverse", "{{F_Z}} ~ {{1|ω}}"]],
      hint: " Winkelgeschwindigkeit: Vergleiche {{F_Z}} bei ω = 2,0 {{rad/s}} und ω = 4,0 {{rad/s}}. Um welchen Faktor ändert sich die Kraft?",
    },
  ];
  const container = document.getElementById("proportion-rows");
  rows.forEach((row) => {
    const fieldset = document.createElement("fieldset");
    fieldset.className = "unit-choice";
    fieldset.id = `proportion-${row.key}`;
    const legend = document.createElement("legend");
    appendPhysicsText(legend, row.legend);
    fieldset.append(legend);
    row.options.forEach(([value, text]) => {
      const label = document.createElement("label");
      label.className = "unit-choice__option";
      const input = document.createElement("input");
      input.type = "radio";
      input.name = `proportion-${row.key}`;
      input.value = value;
      label.append(input, physicsTextSpan(text));
      fieldset.append(label);
    });
    container.append(fieldset);
  });

  document.getElementById("check-proportion").addEventListener("click", () => {
    const values = rows.map((row) => unitChoiceValue(`proportion-${row.key}`));
    const anySelected = values.some(Boolean);
    const correctCount = rows.filter((row, index) => values[index] === row.correct).length;
    if (!anySelected) { setFeedback("proportion-feedback", "error", "Wähle in jeder Zeile eine Proportionalität aus."); return; }
    if (correctCount === rows.length) { setFeedback("proportion-feedback", "success", "Korrekt: {{F_Z}} ~ m, bei festem ω {{F_Z}} ~ r und {{F_Z}} ~ ω²."); return; }
    if (correctCount === 0) { setFeedback("proportion-feedback", "error", "Noch nicht korrekt. Verdopple in der Simulation jeweils eine Größe und lies ab, wie oft so groß {{F_Z}} wird."); return; }
    let message = `${correctCount} von 3 Zuordnungen stimmen.`;
    rows.forEach((row, index) => { if (values[index] !== row.correct) message += row.hint; });
    setFeedback("proportion-feedback", "partial", message);
  });
}

function setupRadiusMapping() {
  const rows = [
    { id: "radius-mapping-omega", correct: "linear" },
    { id: "radius-mapping-speed", correct: "inverse" },
  ];
  document.getElementById("check-radius-mapping").addEventListener("click", () => {
    const values = rows.map((row) => unitChoiceValue(row.id));
    const correctCount = rows.filter((row, index) => values[index] === row.correct).length;
    const remember = document.getElementById("proportion-remember");
    if (correctCount === rows.length) {
      setFeedback("radius-mapping-feedback", "success", "Korrekt: Bleibt ω gleich, gilt {{F_Z}} ~ r. Bleibt {{v_B}} gleich, gilt {{F_Z}} ~ {{1|r}}.");
      remember.hidden = false;
    } else {
      remember.hidden = true;
      if (correctCount === 1) setFeedback("radius-mapping-feedback", "partial", "Eine Zuordnung stimmt. Stelle in der Simulation die andere Einstellung ein und verdopple r von 0,50 m auf 1,00 m.");
      else setFeedback("radius-mapping-feedback", "error", "Noch nicht korrekt. Verdopple r von 0,50 m auf 1,00 m – einmal mit festem ω, einmal mit festem {{v_B}} – und vergleiche {{F_Z}}.");
    }
  });
  document.querySelectorAll('#radius-mapping-rows input[type="radio"]').forEach((input) => {
    input.addEventListener("change", () => { document.getElementById("proportion-remember").hidden = true; });
  });
}

function setupRadiusReasonQuiz() {
  renderQuizQuestion(document.getElementById("radius-reason-quiz"), {
    question: "Welche Aussagen erklären den Unterschied?",
    correct: ["same-arc", "more-turn", "more-force"],
    options: [
      ["same-arc", "In derselben Zeit legen beide Körper den gleichen Bogen Δx zurück."],
      ["faster", "Auf dem kleineren Kreis ist der Betrag der Geschwindigkeit größer."],
      ["more-turn", "Auf dem kleineren Kreis ändert sich die Richtung der Geschwindigkeit dabei stärker."],
      ["more-force", "Eine größere Geschwindigkeitsänderung Δv in derselben Zeit Δt erfordert eine größere Kraft."],
      ["no-force", "Auf dem größeren Kreis wirkt keine Zentripetalkraft."],
    ],
    feedback: "Auf dem kleineren Kreis dreht sich die Geschwindigkeit im gleichen Zeitintervall stärker. Für diese größere Richtungsänderung ist eine größere Kraft nötig.",
    hint: "Vergleiche in der Skizze die Pfeile Δv der beiden Vektordreiecke.",
  }, 0);
}

// ---- Reiter 3 · Herleitung ----
// setupCentripetalCloze → generisches setupCloze(config)

function setupCloze({ targetId, sentenceParts, terms, distractors, feedbackId, checkButtonId, resetButtonId, rememberIds = [], successText, partialText, errorText, wrongText }) {
  const target = document.getElementById(targetId);
  const allTerms = [...terms, ...distractors];
  const order = [...allTerms].sort(() => Math.random() - 0.5);
  const choices = new Array(terms.length).fill("");

  function hideRemember() {
    rememberIds.forEach((id) => { document.getElementById(id).hidden = true; });
  }

  function render() {
    target.replaceChildren();
    const bank = document.createElement("div");
    bank.className = "cloze-term-bank";
    order.forEach((term) => {
      const token = document.createElement("button");
      token.type = "button";
      token.className = "cloze-token";
      token.textContent = term.text;
      token.draggable = true;
      token.disabled = choices.includes(term.key);
      token.addEventListener("dragstart", (event) => event.dataTransfer.setData("text/plain", term.key));
      token.addEventListener("click", () => {
        const empty = choices.findIndex((value) => !value);
        if (empty >= 0) { choices[empty] = term.key; hideRemember(); render(); }
      });
      bank.append(token);
    });

    const sentence = document.createElement("p");
    sentence.className = "cloze-sentence";
    sentenceParts.forEach((part, index) => {
      appendPhysicsText(sentence, part);
      if (index < terms.length) {
        const select = document.createElement("select");
        select.setAttribute("aria-label", `Lücke ${index + 1}`);
        select.innerHTML = '<option value="">Karte auswählen …</option>' + allTerms
          .filter((term) => !choices.includes(term.key) || choices[index] === term.key)
          .map((term) => `<option value="${term.key}">${term.text}</option>`).join("");
        select.value = choices[index];
        select.addEventListener("change", () => { choices[index] = select.value; hideRemember(); render(); });
        select.addEventListener("dragover", (event) => event.preventDefault());
        select.addEventListener("drop", (event) => { event.preventDefault(); choices[index] = event.dataTransfer.getData("text/plain"); hideRemember(); render(); });
        sentence.append(select);
      }
    });
    target.append(bank, sentence);
  }

  render();

  document.getElementById(checkButtonId).addEventListener("click", () => {
    const correct = choices.filter((choice, index) => choice === terms[index].key).length;
    if (correct === terms.length) {
      setFeedback(feedbackId, "success", successText);
      rememberIds.forEach((id) => { document.getElementById(id).hidden = false; });
    } else {
      hideRemember();
      if (correct) setFeedback(feedbackId, "partial", partialText(correct));
      else if (choices.every((choice) => !choice)) setFeedback(feedbackId, "error", errorText);
      else setFeedback(feedbackId, "error", wrongText || errorText);
    }
  });

  document.getElementById(resetButtonId).addEventListener("click", () => {
    choices.fill("");
    document.getElementById(feedbackId).hidden = true;
    hideRemember();
    render();
  });
}

function setupFormulaNewton() {
  setupFormulaBuilder({
    id: "formula-newton",
    expected: ["F", "Δt", "m", "Δv"],
    alternativeExpected: [["m", "Δv", "F", "Δt"]],
    freeGroups: [[0, 1], [2, 3]],
    distractors: ["v", "Δx", "r"],
    layout: "product-equals-product",
    equationLabel: "F mal Delta t gleich m mal Delta v",
    successText: "Korrekt: F · Δt = m · Δv. Die Kraft F bewirkt in der Zeit Δt die Geschwindigkeitsänderung Δv.",
    errorText: "Noch nicht korrekt. Überlege, welche Größen eine Kraft mit einer Geschwindigkeitsänderung verbinden.",
    partialHints: [
      { test: (actual) => actual.includes("v"), text: " Nicht die Geschwindigkeit v, sondern ihre Änderung Δv steht in der Gleichung." },
      { test: (actual) => actual.includes("Δx") || actual.includes("r"), text: " Eine Strecke wie Δx oder r kommt im Grundgesetz nicht vor." },
    ],
  });
}

// ---- Aufgabe 6a: Skizze beschriften (Muster wie setupRoleMatching) ----

function setupLabelGrid() {
  const rows = [
    { key: "1", label: "Stelle 1", short: "Stelle 1", correct: "A" },
    { key: "2", label: "Stelle 2", short: "Stelle 2", correct: "B" },
    { key: "3", label: "Stelle 3", short: "Stelle 3", correct: "M" },
    { key: "4", label: "Stelle 4 (oranger Bogen)", short: "Stelle 4", correct: "Δx" },
  ];
  const optionEntries = [
    ["", "Auswahl …"],
    ["A", "A"],
    ["B", "B"],
    ["M", "M"],
    ["Δx", "Δx"],
    ["r", "r"],
  ];
  const grid = document.getElementById("label-grid");
  rows.forEach((row) => {
    const label = document.createElement("label");
    label.append(document.createTextNode(row.label));
    const select = document.createElement("select");
    select.dataset.labelRow = row.key;
    select.setAttribute("aria-label", `Beschriftung für ${row.label}`);
    optionEntries.forEach(([value, text]) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = text;
      select.append(option);
    });
    label.append(select);
    grid.append(label);
  });

  document.getElementById("check-labels").addEventListener("click", () => {
    const selects = [...grid.querySelectorAll("select")];
    const values = selects.map((select) => select.value);
    const anySelected = values.some(Boolean);
    const correctCount = rows.filter((row, index) => values[index] === row.correct).length;
    if (correctCount === rows.length) {
      setFeedback("labels-feedback", "success", "Korrekt: Die Masse läuft um M von A nach B und legt dabei den Bogen Δx zurück.");
      return;
    }
    if (!anySelected || correctCount === 0) {
      setFeedback("labels-feedback", "error", "Noch nicht korrekt. Die Masse läuft um den Mittelpunkt M von A nach B. Die Pfeile {{v_1}} und {{v_2}} zeigen die Bewegungsrichtung.");
      return;
    }
    const wrongLabels = rows.filter((row, index) => values[index] !== row.correct).map((row) => row.short);
    let message = `${correctCount} von 4 Stellen stimmen. Prüfe noch: ${wrongLabels.join(", ")}.`;
    if (values[0] === "B" && values[1] === "A") message += " Die Masse startet dort, wo {{v_1}} eingezeichnet ist.";
    if (values[3] === "r") message += " Stelle 4 ist ein Stück der Kreisbahn, kein Radius.";
    setFeedback("labels-feedback", "partial", message);
  });
}

// ---- Aufgabe 6b/6c und "Für Schnelle": KI-Freitext über physics-semantic-task ----

function semanticFeedbackParagraph(text) {
  const paragraph = document.createElement("p");
  appendPhysicsText(paragraph, text);
  return paragraph;
}

function dvConstructionFeedback(result) {
  const fragment = document.createDocumentFragment();
  if (result.context === "server-error") {
    fragment.append(semanticFeedbackParagraph("Zum Vergleich: {{v_1}} und {{v_2}} werden so verschoben, dass sie im selben Punkt beginnen. Δv zeigt von der Spitze von {{v_1}} zur Spitze von {{v_2}}. Deine eingegebene Antwort bleibt erhalten."));
  } else if (result.status === "korrekt") {
    fragment.append(semanticFeedbackParagraph("Richtig: Beide Pfeile beginnen im selben Punkt. Δv reicht von der Spitze von {{v_1}} bis zur Spitze von {{v_2}}, also gilt {{v_1}} + Δv = {{v_2}}."));
  } else if (result.points > 0) {
    fragment.append(semanticFeedbackParagraph("Teilweise richtig. Ergänze die oben genannten Aspekte. Achte darauf, wo Δv beginnt und wo es endet."));
  } else {
    fragment.append(semanticFeedbackParagraph("Noch nicht richtig. Vergleiche, wo {{v_1}} und {{v_2}} in Skizze 1 und in Skizze 2 beginnen."));
  }
  return fragment;
}

function approxFeedback(result) {
  const fragment = document.createDocumentFragment();
  if (result.context === "server-error") {
    fragment.append(semanticFeedbackParagraph("Zum Vergleich: Für sehr kleine Δt ist der Bogen kaum gekrümmt, Δx und Δs sind dann fast gleich lang. Deine eingegebene Antwort bleibt erhalten."));
  } else if (result.status === "korrekt") {
    fragment.append(semanticFeedbackParagraph("Richtig: Für sehr kleine Δt ist der Bogen fast gerade. Δx und Δs sind dann nahezu gleich lang, also gilt Δs ≈ Δx = {{v_B}} · Δt."));
  } else if (result.points > 0) {
    fragment.append(semanticFeedbackParagraph("Teilweise richtig. Ergänze, was mit dem Bogen passiert, wenn Δt sehr klein wird."));
  } else {
    fragment.append(semanticFeedbackParagraph("Noch nicht richtig. Überlege, wie sich Bogen und Strecke Δs unterscheiden, wenn B ganz nah bei A liegt."));
  }
  return fragment;
}

function similarityFeedback(result) {
  const fragment = document.createDocumentFragment();
  if (result.context === "server-error") {
    fragment.append(semanticFeedbackParagraph("Zum Vergleich: Beide Dreiecke sind gleichschenklig. Weil die Geschwindigkeit immer senkrecht auf dem Radius steht, ist der Winkel an der Spitze in beiden Dreiecken α. Deine eingegebene Antwort bleibt erhalten."));
  } else if (result.status === "korrekt") {
    fragment.append(semanticFeedbackParagraph("Richtig: Beide Dreiecke sind gleichschenklig und haben an der Spitze denselben Winkel α. Nach dem Ähnlichkeitssatz SWS sind sie ähnlich."));
  } else if (result.points > 0) {
    fragment.append(semanticFeedbackParagraph("Teilweise richtig. Ergänze die oben genannten Aspekte."));
  } else {
    fragment.append(semanticFeedbackParagraph("Noch nicht richtig. Vergleiche die Seitenlängen und den Winkel an der Spitze beider Dreiecke."));
  }
  return fragment;
}

function setupDerivationSemanticTasks() {
  setupPhysicsSemanticTask({
    answerId: "dv-construction-answer", buttonId: "check-dv-construction", feedbackId: "dv-construction-feedback", countId: "dv-construction-count",
    taskId: "ph11-zentripetalkraft-herleitung-dv", feedbackBuilder: dvConstructionFeedback,
    minimumLength: 8, fallbackMaxPoints: 3, shortAnswerHint: "Formuliere eine etwas ausführlichere Beschreibung der Konstruktion.",
  });
  setupPhysicsSemanticTask({
    answerId: "approx-answer", buttonId: "check-approx", feedbackId: "approx-feedback", countId: "approx-count",
    taskId: "ph11-zentripetalkraft-herleitung-naeherung", feedbackBuilder: approxFeedback,
    minimumLength: 8, fallbackMaxPoints: 2, shortAnswerHint: "Formuliere eine etwas ausführlichere Begründung.",
  });
  setupPhysicsSemanticTask({
    answerId: "similarity-answer", buttonId: "check-similarity", feedbackId: "similarity-feedback", countId: "similarity-count",
    taskId: "ph11-zentripetalkraft-herleitung-aehnlichkeit", feedbackBuilder: similarityFeedback,
    minimumLength: 8, fallbackMaxPoints: 3, shortAnswerHint: "Formuliere eine etwas ausführlichere Begründung.",
  });
}

// ---- Aufgabe 7a: Seitenverhältnis (statische Radio-Auswahl wie Aufgabe 4b) ----

function setupRatioChoice() {
  document.getElementById("check-ratio").addEventListener("click", () => {
    const value = unitChoiceValue("ratio-choice");
    if (!value) { setFeedback("ratio-feedback", "error", "Wähle ein Seitenverhältnis aus."); return; }
    if (value === "vr") { setFeedback("ratio-feedback", "success", "Korrekt: Δv und Δs entsprechen einander, ebenso {{v_B}} und r. Also gilt {{Δv|Δs}} = {{v_B|r}}."); return; }
    if (value === "rv") { setFeedback("ratio-feedback", "error", "Noch nicht korrekt. Im Zähler steht jeweils die Größe aus Skizze 2: Δv und {{v_B}}."); return; }
    setFeedback("ratio-feedback", "error", "Noch nicht korrekt. Vergleiche nur Seiten der beiden Dreiecke. Δt ist keine Dreiecksseite.");
  });
}

function setupFormulaDeltaV() {
  setupFormulaBuilder({
    id: "formula-delta-v",
    expected: ["Δv", "vB²", "Δt", "r"],
    distractors: ["vB", "Δs", "r²"],
    layout: "fraction-product",
    freeGroups: [[1, 2]],
    equationLabel: "Delta v gleich v mit Index B zum Quadrat mal Delta t durch r",
    successText: "Korrekt: Δv = {{v_B² · Δt|r}}.",
    errorText: "Noch nicht korrekt. Links steht die Größe, die du suchst.",
    partialHints: [
      { test: (actual) => actual.includes("Δs"), text: " Ersetze Δs durch {{v_B}} · Δt." },
      { test: (actual) => actual.includes("vB"), text: " Aus {{v_B}} · {{v_B}} wird {{v_B}}²." },
      { test: (actual) => actual.includes("r²"), text: " Im Nenner steht r nur einfach." },
    ],
  });
}

// ---- Formelbaukasten (setupFormulaBuilder → Layouts 3.3) ----

function countMultisetMatches(actual, expected) {
  const remaining = [...expected];
  let matches = 0;
  actual.forEach((value) => {
    const index = remaining.indexOf(value);
    if (index >= 0) { matches += 1; remaining.splice(index, 1); }
  });
  return matches;
}

function gradeSlots(actualValues, expected, freeGroups) {
  const freeIndices = new Set(freeGroups.flat());
  let correct = 0;
  expected.forEach((value, index) => {
    if (!freeIndices.has(index) && actualValues[index] === value) correct += 1;
  });
  freeGroups.forEach((group) => {
    correct += countMultisetMatches(group.map((index) => actualValues[index]), group.map((index) => expected[index]));
  });
  return correct;
}

function renderFormulaSymbol(target, value) {
  target.replaceChildren();
  target.removeAttribute("aria-label");
  if (value === "FZ") { target.append(createIndexedSymbol("F", "Z")); target.setAttribute("aria-label", "F mit Index Z"); }
  else if (value === "vB") { target.append(createIndexedSymbol("v", "B")); target.setAttribute("aria-label", "v mit Index B"); }
  else if (value === "vB²") { target.append(createIndexedSymbol("v", "B"), document.createTextNode("²")); target.setAttribute("aria-label", "v mit Index B zum Quadrat"); }
  else if (value === "r²") { target.textContent = "r²"; target.setAttribute("aria-label", "r zum Quadrat"); }
  else if (value === "ω²") { target.textContent = "ω²"; target.setAttribute("aria-label", "Omega zum Quadrat"); }
  else { target.textContent = value; }
}

function setupFormulaBuilder({ id, expected, alternativeExpected = [], distractors = [], layout, freeGroups, equationLabel, rememberId, successText, errorText, partialHints = [] }) {
  const target = document.getElementById(id);
  const bankSource = [...expected, ...distractors];
  let selected = "";
  let values = shuffleIncorrect(bankSource, bankSource);
  const slots = expected.map(() => ({ value: "" }));
  const rememberIds = Array.isArray(rememberId) ? rememberId : (rememberId ? [rememberId] : []);

  function hideRemember() {
    rememberIds.forEach((id) => { document.getElementById(id).hidden = true; });
  }
  function showRemember() {
    rememberIds.forEach((id) => { document.getElementById(id).hidden = false; });
  }

  function render() {
    target.replaceChildren();
    const bank = document.createElement("div");
    bank.className = "formula-token-bank";
    values.forEach((value) => {
      const token = document.createElement("button");
      token.type = "button";
      token.className = "cloze-token";
      renderFormulaSymbol(token, value);
      token.draggable = true;
      token.disabled = slots.some((slot) => slot.value === value);
      token.addEventListener("dragstart", (event) => event.dataTransfer.setData("text/plain", value));
      bindKeyboardButton(token, () => {
        selected = value;
        target.querySelectorAll(".formula-slot").forEach((slotButton) => slotButton.classList.toggle("is-selected", !slotButton.dataset.value));
      });
      bank.append(token);
    });

    const line = document.createElement("div");
    line.className = "formula-line";
    line.setAttribute("aria-label", equationLabel);

    function makeSlotButton(index, roleLabel) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "formula-slot";
      button.dataset.value = slots[index].value;
      if (slots[index].value) renderFormulaSymbol(button, slots[index].value);
      else button.textContent = "?";
      button.setAttribute("aria-label", `Feld ${index + 1} der Formel${roleLabel || ""}`);
      bindKeyboardButton(button, () => {
        if (selected) { slots[index].value = selected; selected = ""; }
        else if (slots[index].value) slots[index].value = "";
        hideRemember();
        render();
      });
      button.addEventListener("dragover", (event) => event.preventDefault());
      button.addEventListener("drop", (event) => {
        event.preventDefault();
        slots[index].value = event.dataTransfer.getData("text/plain");
        hideRemember();
        render();
      });
      return button;
    }

    if (layout === "product-equals-product") {
      line.append(
        makeSlotButton(0, ", linke Seite"), document.createTextNode(" · "), makeSlotButton(1, ", linke Seite"),
        document.createTextNode(" = "),
        makeSlotButton(2, ", rechte Seite"), document.createTextNode(" · "), makeSlotButton(3, ", rechte Seite"),
      );
    } else {
      const leftButton = makeSlotButton(0, ", linke Seite");
      line.append(leftButton, document.createTextNode(" = "));

      if (layout === "fraction-product") {
        const fraction = document.createElement("div");
        fraction.className = "formula-fraction";
        const numerator = document.createElement("div");
        numerator.className = "formula-fraction__numerator";
        numerator.append(makeSlotButton(1, ", Zähler"), document.createTextNode(" · "), makeSlotButton(2, ", Zähler"));
        const bar = document.createElement("span");
        bar.className = "formula-fraction__bar";
        bar.setAttribute("aria-hidden", "true");
        const denominator = document.createElement("div");
        denominator.className = "formula-fraction__denominator";
        denominator.append(makeSlotButton(3, ", Nenner"));
        fraction.append(numerator, bar, denominator);
        line.append(fraction);
      } else {
        line.append(makeSlotButton(1, ""), document.createTextNode(" · "), makeSlotButton(2, ""), document.createTextNode(" · "), makeSlotButton(3, ""));
      }
    }

    const actions = document.createElement("div");
    actions.className = "cloze-actions";
    const check = document.createElement("button");
    check.type = "button";
    check.className = "physics-primary-button";
    check.textContent = "Formel prüfen";
    const reset = document.createElement("button");
    reset.type = "button";
    reset.className = "secondary-action";
    reset.textContent = "Formel zurücksetzen";
    const feedback = document.createElement("div");
    feedback.className = "physics-feedback";
    feedback.hidden = true;
    feedback.setAttribute("role", "status");
    feedback.setAttribute("aria-live", "polite");

    check.addEventListener("click", () => {
      const actualValues = slots.map((slot) => slot.value);
      const candidates = [expected, ...alternativeExpected];
      const correct = Math.max(...candidates.map((candidate) => gradeSlots(actualValues, candidate, freeGroups)));
      if (correct === expected.length) {
        setFeedback(feedback, "success", successText);
        showRemember();
      } else {
        hideRemember();
        if (correct === 0) { setFeedback(feedback, "error", errorText); return; }
        let message = `${correct} von ${expected.length} Feldern stimmen.`;
        partialHints.forEach((hint) => { if (hint.test(actualValues)) message += hint.text; });
        setFeedback(feedback, "partial", message);
      }
    });
    reset.addEventListener("click", () => {
      slots.forEach((slot) => { slot.value = ""; });
      selected = "";
      values = shuffleIncorrect(bankSource, bankSource);
      hideRemember();
      render();
    });

    actions.append(check, reset);
    target.append(bank, line, actions, feedback);
  }

  render();
}

function setupCentripetalSpeedFormula() {
  setupFormulaBuilder({
    id: "formula-centripetal-speed",
    expected: ["FZ", "m", "vB²", "r"],
    distractors: ["vB", "Δt", "r²"],
    layout: "fraction-product",
    freeGroups: [[1, 2]],
    equationLabel: "F mit Index Z gleich m mal v mit Index B zum Quadrat durch r",
    rememberId: "formula-speed-remember",
    successText: "Korrekt: {{F_Z}} = {{m · v_B²|r}}.",
    errorText: "Noch nicht korrekt. Überlege zuerst, welche Größe auf der linken Seite stehen muss.",
    partialHints: [
      { test: (actual) => actual.includes("Δt"), text: " Δt steht auf beiden Seiten und kürzt sich deshalb heraus." },
      { test: (actual) => actual.includes("vB"), text: " Prüfe den Exponenten: In Δv steht {{v_B}}²." },
      { test: (actual) => actual.includes("r²"), text: " Im Nenner steht r nur einfach." },
    ],
  });
}

function setupCentripetalOmegaFormula() {
  setupFormulaBuilder({
    id: "formula-centripetal-omega",
    expected: ["FZ", "m", "ω²", "r"],
    distractors: ["ω", "r²", "vB"],
    layout: "product3",
    freeGroups: [[1, 2, 3]],
    equationLabel: "F mit Index Z gleich m mal Omega zum Quadrat mal r",
    rememberId: ["formula-omega-remember", "formula-omega-notebook-reminder"],
    successText: "Korrekt: {{F_Z}} = m · ω² · r.",
    errorText: "Noch nicht korrekt. Überlege zuerst, welche Größe auf der linken Seite stehen muss.",
    partialHints: [
      { test: (actual) => actual.includes("r²"), text: " Kürze: {{ω² · r²|r}} = ω² · r." },
      { test: (actual) => actual.includes("ω"), text: " Es gilt (ω · r)² = ω² · r². ω steht also im Quadrat." },
      { test: (actual) => actual.includes("vB"), text: " {{v_B}} sollst du gerade durch ω · r ersetzen." },
    ],
  });
}

// ---- Reiter 4 · Anwenden ----

function setupRoleMatching() {
  const situations = [
    { key: "moon", label: "Mond auf seiner Bahn um die Erde", correct: "gravity" },
    { key: "hammer", label: "Hammerwurf (von oben betrachtet)", correct: "rope" },
    { key: "car", label: "Auto in einer flachen Kurve", correct: "friction" },
    { key: "electron", label: "Elektron um den Atomkern (Atommodell von Bohr)", correct: "electric" },
    { key: "laundry", label: "Wäsche in der Schleudertrommel", correct: "wall" },
    { key: "carousel", label: "Kettenkarussell – hier wirken zwei Kräfte zusammen", correct: "chain" },
  ];
  const optionEntries = [
    ["", "Kraft auswählen …"],
    ["gravity", "Gravitationskraft"],
    ["rope", "Seilkraft"],
    ["friction", "Haftreibungskraft"],
    ["electric", "elektrische Kraft"],
    ["wall", "Normalkraft der Trommelwand"],
    ["chain", "Kettenkraft und Gewichtskraft zusammen"],
    ["centrifugal", "Zentrifugalkraft nach außen"],
    ["none", "keine Kraft nötig"],
  ];
  const grid = document.getElementById("role-grid");
  situations.forEach((situation) => {
    const label = document.createElement("label");
    label.append(document.createTextNode(situation.label));
    const select = document.createElement("select");
    select.dataset.roleSituation = situation.key;
    select.setAttribute("aria-label", `Kraft für ${situation.label}`);
    optionEntries.forEach(([value, text]) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = text;
      select.append(option);
    });
    label.append(select);
    grid.append(label);
  });

  document.getElementById("check-role-matching").addEventListener("click", () => {
    const selects = [...grid.querySelectorAll("select")];
    const values = selects.map((select) => select.value);
    const anySelected = values.some(Boolean);
    const correctCount = situations.filter((situation, index) => values[index] === situation.correct).length;
    const wrongLabels = situations.filter((situation, index) => values[index] !== situation.correct).map((situation) => situation.label);
    const remember = document.getElementById("role-remember");
    if (correctCount === situations.length) {
      setFeedback("role-feedback", "success", "Korrekt: In jeder Situation wirkt eine bekannte Kraft – beim Kettenkarussell wirken zwei Kräfte zusammen – als Zentripetalkraft.");
      remember.hidden = false;
      return;
    }
    remember.hidden = true;
    let status;
    let message;
    if (!anySelected || correctCount === 0) {
      status = "error";
      message = "Noch nicht korrekt. Stelle dir bei jeder Situation die Leitfrage: Welche Kraft zieht den Körper zum Kreismittelpunkt?";
    } else {
      status = "partial";
      message = `${correctCount} von 6 Zuordnungen stimmen. Prüfe noch: ${wrongLabels.join(", ")}.`;
    }
    if (values.includes("centrifugal")) message += " Eine Kraft nach außen würde den Körper nicht auf der Kreisbahn halten.";
    if (values.includes("none")) message += " Ohne Kraft würde sich der Körper nach dem Trägheitssatz geradlinig weiterbewegen.";
    setFeedback("role-feedback", status, message);
  });
}

function setupRoleQuiz() {
  const items = [
    {
      question: "In welchen Situationen darfst du die genannte Kraft direkt mit {{F_Z}} gleichsetzen?",
      correct: ["moon", "electron", "car"],
      options: [
        ["moon", "Mond um die Erde: Gravitationskraft = {{F_Z}}"],
        ["electron", "Elektron um den Atomkern: elektrische Kraft = {{F_Z}}"],
        ["car", "Auto in einer flachen Kurve: Haftreibungskraft = {{F_Z}}"],
        ["carousel", "Kettenkarussell: Kettenkraft = {{F_Z}}"],
        ["looping", "Achterbahn im höchsten Punkt eines Loopings: Gewichtskraft = {{F_Z}}"],
      ],
      feedback: "Gleichsetzen darf man nur, wenn eine einzige Kraft zum Kreismittelpunkt wirkt. Beim Kettenkarussell wirken Kettenkraft und Gewichtskraft zusammen, im Looping Gewichtskraft und die Kraft der Schiene.",
      hint: "Prüfe bei jeder Situation, ob außer der genannten Kraft noch eine weitere Kraft zur Kreisbewegung beiträgt.",
    },
    {
      question: "Die Zentripetalkraft ist keine eigene Kraftart, …",
      correct: ["any", "several"],
      options: [
        ["centrifuge", "… weil sie nur in Zentrifugen auftritt."],
        ["any", "… weil jede Kraftart als Zentripetalkraft wirken kann."],
        ["fake", "… weil es sie in Wirklichkeit gar nicht gibt."],
        ["several", "… weil sie auch von mehreren Kräften gemeinsam aufgebracht werden kann."],
      ],
      feedback: "Die Zentripetalkraft beschreibt eine Rolle: Die Kraft oder die Kräfte zum Kreismittelpunkt halten den Körper auf der Kreisbahn. Es gibt sie also wirklich, nur nicht als eigene Kraftart.",
      hint: "Denke an die Situationen aus 9a: Welche Kräfte haben dort als Zentripetalkraft gewirkt?",
    },
  ];
  const target = document.getElementById("role-quiz");
  items.forEach((item, index) => renderQuizQuestion(target, item, index));
}

function setupMisconceptionQuiz() {
  renderQuizQuestion(document.getElementById("misconception-quiz"), {
    question: "Welche Aussagen sind richtig?",
    correct: ["too-small", "tangent"],
    options: [
      ["centrifugal", "Eine Zentrifugalkraft zieht den Hammer nach außen. Deshalb fliegt er beim Loslassen vom Mittelpunkt weg."],
      ["too-small", "Reicht die Kraft zum Mittelpunkt nicht aus, wird der Bahnradius größer: Das Auto rutscht in der Kurve nach außen."],
      ["stop", "Hört die Kraft zum Mittelpunkt auf zu wirken, bleibt der Körper sofort stehen."],
      ["tangent", "Beim Loslassen fliegt der Hammer tangential weiter, weil keine Kraft mehr zum Mittelpunkt wirkt."],
      ["too-big", "Ist die Kraft zum Mittelpunkt größer als nötig, bewegt sich der Körper auf einem größeren Kreis."],
    ],
    feedback: "Für einen ruhenden Beobachter gibt es keine Kraft, die nach außen zieht. Fehlt die Kraft zum Mittelpunkt, bewegt sich der Körper tangential geradlinig weiter. Ist sie zu klein, wird der Bahnradius größer.",
    hint: "Prüfe bei jeder Aussage: Welche reale Kraft zeigt nach innen, und was passiert nach dem Trägheitssatz, wenn sie fehlt oder zu klein ist?",
  }, 0);
}

// ---- Rechenaufgaben 11–13 ----

// Prüfreihenfolge (B5): 1. keine Einheit · 2. kein Zahlenwert · 3. Einheit ist
// Distraktor (passt die Zahl zu einer gültigen Einheit: partial, sonst error)
// · 4. Sollwert + 2 gültige Ziffern: success · 5. Sollwert/Rechenfenster mit
// falscher Ziffernzahl: partial (Rundung) · 6. passt zur anderen gültigen
// Einheit: partial · 7. wrongChecks · 8. sonst generischer Fehler.
function setupNumberTask({ buttonId, inputId, unitSelectId, feedbackId, validUnits, wrongChecks, successText, roundingText, unitMismatchText, wrongUnitText, genericErrorText }) {
  document.getElementById(buttonId).addEventListener("click", () => {
    const input = document.getElementById(inputId);
    const raw = input.value;
    const value = numberValue(raw);
    const digits = significantDigitCount(raw);
    const unit = document.getElementById(unitSelectId).value;

    if (!unit) { setFeedback(feedbackId, "error", "Wähle eine Einheit aus."); return; }
    if (!Number.isFinite(value)) { setFeedback(feedbackId, "error", "Gib einen Zahlenwert ein."); return; }

    const matchesWindow = (target) => Math.abs(value - target.value) <= target.tolerance || Math.abs(value - target.exact) <= target.exactTolerance;

    if (!(unit in validUnits)) {
      const matchesSomeValidUnit = Object.values(validUnits).some(matchesWindow);
      if (matchesSomeValidUnit) { setFeedback(feedbackId, "partial", wrongUnitText); return; }
      setFeedback(feedbackId, "error", genericErrorText);
      return;
    }

    const target = validUnits[unit];
    const valueCorrect = Math.abs(value - target.value) <= target.tolerance;
    const exactUnrounded = Math.abs(value - target.exact) <= target.exactTolerance;

    if (valueCorrect && digits === 2) { setFeedback(feedbackId, "success", successText); return; }
    if ((valueCorrect || exactUnrounded) && digits !== 2) { setFeedback(feedbackId, "partial", roundingText); return; }

    const otherUnitKey = Object.keys(validUnits).find((key) => key !== unit);
    if (matchesWindow(validUnits[otherUnitKey])) { setFeedback(feedbackId, "partial", unitMismatchText); return; }

    const matchedWrong = wrongChecks.find((check) => check.test(value, unit));
    if (matchedWrong) { setFeedback(feedbackId, matchedWrong.status || "error", matchedWrong.text); return; }

    setFeedback(feedbackId, "error", genericErrorText);
  });
}

function setupTask11() {
  setupNumberTask({
    buttonId: "check-task11", inputId: "task11-answer", unitSelectId: "task11-unit", feedbackId: "task11-feedback",
    validUnits: {
      N: { value: 2500, tolerance: 0.5, exact: 2520.83, exactTolerance: 25.2083 },
      kN: { value: 2.5, tolerance: 0.0005, exact: 2.52083, exactTolerance: 0.0252083 },
    },
    wrongChecks: [
      { test: (value, unit) => (unit === "N" ? Math.abs(value - 100.83) <= 1.0083 : Math.abs(value - 0.10083) <= 0.0010083), text: "Noch nicht korrekt. Prüfe deinen Zahlenwert, die Einheit und die Anzahl der gültigen Ziffern. Die Bahngeschwindigkeit geht im Quadrat ein: {{v_B}}²." },
      { test: (value, unit) => (unit === "N" ? Math.abs(value - 8167.5) <= 81.675 : Math.abs(value - 8.1675) <= 0.081675), text: "Noch nicht korrekt. Prüfe deinen Zahlenwert, die Einheit und die Anzahl der gültigen Ziffern. Der Radius steht im Nenner: Teile durch r." },
      { test: (value, unit) => (unit === "N" ? Math.abs(value - 347.22) <= 3.4722 : Math.abs(value - 0.34722) <= 0.0034722), text: "Noch nicht korrekt. Prüfe deinen Zahlenwert, die Einheit und die Anzahl der gültigen Ziffern. Die Masse m gehört in den Zähler." },
    ],
    successText: "Richtig. Zahlenwert, Einheit und die Anzahl der gültigen Ziffern stimmen. {{F_Z}} = {{m · v_B²|r}} ≈ 2 521 N ≈ 2,5 kN. Diese Kraft muss das Drahtseil auf die Kugel ausüben.",
    roundingText: "Dein Rechenwert ist grundsätzlich passend. Runde das Endergebnis noch auf die geforderte Anzahl gültiger Ziffern. Die Angaben 25 {{m/s}} und 1,8 m besitzen nur zwei gültige Ziffern.",
    unitMismatchText: "Prüfe deinen Zahlenwert, die Einheit und die Anzahl der gültigen Ziffern. Dein Zahlenwert passt zur anderen Einheit: 1 kN = 1 000 N.",
    wrongUnitText: "Prüfe deinen Zahlenwert, die Einheit und die Anzahl der gültigen Ziffern. Dein Zahlenwert passt, aber eine Kraft wird in N oder kN angegeben.",
    genericErrorText: "Noch nicht korrekt. Prüfe deinen Zahlenwert, die Einheit und die Anzahl der gültigen Ziffern. Setze die Werte in {{F_Z}} = {{m · v_B²|r}} ein.",
  });
}

function setupTask12() {
  setupNumberTask({
    buttonId: "check-task12", inputId: "task12-answer", unitSelectId: "task12-unit", feedbackId: "task12-feedback",
    validUnits: {
      N: { value: 6800, tolerance: 0.5, exact: 6750, exactTolerance: 67.5 },
      kN: { value: 6.8, tolerance: 0.0005, exact: 6.75, exactTolerance: 0.0675 },
    },
    wrongChecks: [
      { test: (value, unit) => (unit === "N" ? Math.abs(value - 87480) <= 874.8 : Math.abs(value - 87.48) <= 0.8748), text: "Noch nicht korrekt. Prüfe deinen Zahlenwert, die Einheit und die Anzahl der gültigen Ziffern. Rechne die Geschwindigkeit zuerst in {{m/s}} um: Teile durch 3,6." },
      { test: (value, unit) => (unit === "N" ? Math.abs(value - 450) <= 4.5 : Math.abs(value - 0.45) <= 0.0045), text: "Noch nicht korrekt. Prüfe deinen Zahlenwert, die Einheit und die Anzahl der gültigen Ziffern. Die Bahngeschwindigkeit geht im Quadrat ein: {{v_B}}²." },
      { test: (value, unit) => (unit === "N" ? Math.abs(value - 1133740) <= 11337.4 : Math.abs(value - 1133.74) <= 11.3374), text: "Noch nicht korrekt. Prüfe deinen Zahlenwert, die Einheit und die Anzahl der gültigen Ziffern. Von {{km/h}} nach {{m/s}} teilst du durch 3,6." },
    ],
    successText: "Richtig. Zahlenwert, Einheit und die Anzahl der gültigen Ziffern stimmen. Mit {{v_B}} = 15 {{m/s}} gilt {{F_Z}} = {{m · v_B²|r}} = 6 750 N ≈ 6,8 kN. Diese Kraft muss die Haftreibung zwischen Reifen und Straße liefern.",
    roundingText: "Dein Rechenwert ist grundsätzlich passend. Runde das Endergebnis noch auf die geforderte Anzahl gültiger Ziffern. Die Geschwindigkeit 54 {{km/h}} ist nur mit zwei gültigen Ziffern angegeben.",
    unitMismatchText: "Prüfe deinen Zahlenwert, die Einheit und die Anzahl der gültigen Ziffern. Dein Zahlenwert passt zur anderen Einheit: 1 kN = 1 000 N.",
    wrongUnitText: "Prüfe deinen Zahlenwert, die Einheit und die Anzahl der gültigen Ziffern. Dein Zahlenwert passt, aber eine Kraft wird in N oder kN angegeben.",
    genericErrorText: "Noch nicht korrekt. Prüfe deinen Zahlenwert, die Einheit und die Anzahl der gültigen Ziffern. Setze die Werte in {{F_Z}} = {{m · v_B²|r}} ein.",
  });
}

function setupTask13() {
  setupNumberTask({
    buttonId: "check-task13", inputId: "task13-answer", unitSelectId: "task13-unit", feedbackId: "task13-feedback",
    validUnits: {
      mps: { value: 18, tolerance: 0.0005, exact: 17.8885, exactTolerance: 0.178885 },
      kmh: { value: 64, tolerance: 0.0005, exact: 64.3988, exactTolerance: 0.643988 },
    },
    wrongChecks: [
      { test: (value, unit) => (unit === "mps" ? Math.abs(value - 320) <= 5 : Math.abs(value - 1152) <= 20), text: "Noch nicht korrekt. Du hast {{v_B}}² berechnet. Ziehe noch die Wurzel." },
      { test: (value, unit) => (unit === "mps" ? Math.abs(value - 0.566) <= 0.02 : Math.abs(value - 2.04) <= 0.05), text: "Noch nicht korrekt. Prüfe deinen Zahlenwert, die Einheit und die Anzahl der gültigen Ziffern. Rechne 9,6 kN zuerst in Newton um." },
      { test: (value, unit) => unit === "kmh" && Math.abs(value - 65) <= 0.3, status: "partial", text: "Dein Rechenwert ist grundsätzlich passend. Runde erst das Endergebnis: Rechne den ungerundeten Wert von {{v_B}} in {{km/h}} um." },
    ],
    successText: "Richtig. Zahlenwert, Einheit und die Anzahl der gültigen Ziffern stimmen. {{v_B}} = √{{F_Z · r|m}} ≈ 18 {{m/s}} ≈ 64 {{km/h}}. Fährt das Auto schneller, reicht die Haftreibung nicht aus: Der Bahnradius wird größer und das Auto rutscht aus der Kurve.",
    roundingText: "Dein Rechenwert ist grundsätzlich passend. Runde das Endergebnis noch auf die geforderte Anzahl gültiger Ziffern. Die Kraft 9,6 kN ist nur mit zwei gültigen Ziffern angegeben.",
    unitMismatchText: "Prüfe deinen Zahlenwert, die Einheit und die Anzahl der gültigen Ziffern. Dein Zahlenwert passt zur anderen Einheit: 1 {{m/s}} = 3,6 {{km/h}}.",
    wrongUnitText: "Prüfe deinen Zahlenwert, die Einheit und die Anzahl der gültigen Ziffern. Dein Zahlenwert passt, aber eine Geschwindigkeit wird in {{m/s}} oder {{km/h}} angegeben.",
    genericErrorText: "Noch nicht korrekt. Prüfe deinen Zahlenwert, die Einheit und die Anzahl der gültigen Ziffern. Stelle zuerst nach {{v_B}}² um.",
  });
}

// ---- Reiter 5 · Merksätze ----

function setupSummaryCloze() {
  setupCloze({
    targetId: "summary-cloze",
    checkButtonId: "check-summary-cloze",
    resetButtonId: "reset-summary-cloze",
    feedbackId: "summary-cloze-feedback",
    rememberIds: ["summary-notebook-reminder"],
    sentenceParts: [
      "Eine gleichförmige Kreisbewegung ist nur möglich, wenn eine Kraft zum ",
      " wirkt. Die Zentripetalkraft ist keine eigene ",
      ": Reale Kräfte wie die Seilkraft, die Haftreibungskraft oder die Gravitationskraft übernehmen diese Rolle. Für ihren Betrag gilt {{F_Z}} = {{m · v_B²|r}} = m · ω² · r. Verdoppelt man {{v_B}} oder ω, wird {{F_Z}} ",
      " so groß. Bei gleicher Bahngeschwindigkeit ist {{F_Z}} ",
      " proportional zu r, bei gleicher Winkelgeschwindigkeit ",
      " proportional zu r. Ist die wirkende Kraft zu klein, wird der Bahnradius ",
      ".",
    ],
    terms: [
      { key: "Kreismittelpunkt", text: "Kreismittelpunkt" },
      { key: "Kraftart", text: "Kraftart" },
      { key: "viermal", text: "viermal" },
      { key: "indirekt", text: "indirekt" },
      { key: "direkt", text: "direkt" },
      { key: "größer", text: "größer" },
    ],
    distractors: [
      { key: "doppelt", text: "doppelt" },
      { key: "kleiner", text: "kleiner" },
      { key: "außen", text: "außen" },
    ],
    successText: "Korrekt: Die Merksätze sind vollständig und fachlich richtig.",
    partialText: (n) => `${n} von 6 Lücken stimmen. Prüfe besonders die Wörter zum Einfluss von {{v_B}}, ω und r.`,
    errorText: "Noch nicht korrekt. Setze zunächst die Karten in die Lücken ein.",
    wrongText: "Noch nicht korrekt. Prüfe besonders die Wörter zum Einfluss von {{v_B}}, ω und r.",
  });
}

// ---- Reiter 6 · Abschlussquiz ----

function setupFinalQuiz() {
  const items = [
    {
      question: "Die Bahngeschwindigkeit {{v_B}} eines Körpers wird verdoppelt, m und r bleiben gleich. Was gilt?",
      correct: ["four"],
      options: [["double", "{{F_Z}} wird doppelt so groß."], ["four", "{{F_Z}} wird viermal so groß."], ["half", "{{F_Z}} wird halb so groß."]],
      feedback: "Wegen {{F_Z}} ~ {{v_B}}² bewirkt der Faktor 2 bei {{v_B}} den Faktor 4 bei {{F_Z}}.",
      hint: "Die Geschwindigkeit steht in der Formel im Quadrat.",
    },
    {
      question: "Der Radius r wird verdoppelt. Welche Aussagen sind richtig?",
      correct: ["omega", "speed"],
      options: [["omega", "Bleibt ω gleich, wird {{F_Z}} doppelt so groß."], ["always", "{{F_Z}} wird in jedem Fall doppelt so groß."], ["speed", "Bleibt {{v_B}} gleich, wird {{F_Z}} halb so groß."], ["quad", "Bleibt ω gleich, wird {{F_Z}} viermal so groß."]],
      feedback: "Beim Radius kommt es darauf an, ob ω oder {{v_B}} gleich bleibt: {{F_Z}} = m · ω² · r bzw. {{F_Z}} = {{m · v_B²|r}}.",
      hint: "Wähle die Formel, in der die gleichbleibende Größe vorkommt.",
    },
    {
      question: "Welche Kräfte können als Zentripetalkraft wirken?",
      correct: ["rope", "friction", "gravity"],
      options: [["rope", "Seilkraft"], ["centrifugal", "Zentrifugalkraft nach außen"], ["friction", "Haftreibungskraft zwischen Reifen und Straße"], ["gravity", "Gravitationskraft"]],
      feedback: "Jede reale Kraft oder Resultierende, die zum Kreismittelpunkt zeigt, kann die Rolle der Zentripetalkraft übernehmen.",
      hint: "Die Kraft muss zum Kreismittelpunkt zeigen.",
    },
    {
      question: "Ein Auto fährt zu schnell in eine Kurve. Die Haftreibungskraft reicht als Zentripetalkraft nicht aus. Was geschieht?",
      correct: ["radius", "away"],
      options: [["smaller", "Der Bahnradius wird kleiner."], ["radius", "Der Bahnradius wird größer."], ["same", "Das Auto bleibt auf derselben Kreisbahn."], ["away", "Das Auto entfernt sich vom Kurvenmittelpunkt."]],
      feedback: "Ist die Kraft kleiner als nötig, reicht die Richtungsänderung nicht aus: Der Radius wird größer.",
      hint: "Denk an den Grenzfall ganz ohne Kraft: Dann bewegt sich das Auto geradlinig weiter.",
    },
    {
      question: "Welche Aussagen zu den Formeln sind richtig?",
      correct: ["equiv", "unit"],
      options: [["equiv", "{{F_Z}} = {{m · v_B²|r}} und {{F_Z}} = m · ω² · r sind gleichwertig, weil {{v_B}} = ω · r gilt."], ["mass", "{{F_Z}} hängt nicht von der Masse ab."], ["unit", "Die Einheit von m · ω² · r lässt sich als kg · {{m/s²}} = 1 N schreiben."], ["linear", "{{F_Z}} ist proportional zu ω."]],
      feedback: "Beide Formeln beschreiben dieselbe Kraft. Die Einheit ist Newton.",
      hint: "Setze {{v_B}} = ω · r ein und prüfe die Einheiten von m, ω² und r.",
    },
    {
      question: "Ein Satellit umkreist die Erde auf einer Kreisbahn. Welche Aussagen sind richtig?",
      correct: ["gravity", "tangent"],
      options: [["gravity", "Die Gravitationskraft der Erde wirkt als Zentripetalkraft."], ["noforce", "Im Weltraum wirkt keine Kraft auf den Satelliten."], ["tangent", "Ohne Gravitationskraft würde sich der Satellit tangential geradlinig weiterbewegen."], ["extra", "Neben der Gravitationskraft wirkt zusätzlich eine eigene Zentripetalkraft."]],
      feedback: "Die Gravitationskraft übernimmt beim Satelliten die Rolle der Zentripetalkraft.",
      hint: "Welche reale Kraft zieht den Satelliten zur Erde?",
    },
  ];
  const target = document.getElementById("centripetal-quiz");
  items.forEach((item, index) => renderQuizQuestion(target, item, index));
}

const physicsStepTabs = setupPhysicsStepTabs();
setupNextTabButtons(physicsStepTabs);
setupHammerQuiz();
setupCentripetalSimulation(createExploreConfig(document.querySelector('[data-centripetal-simulation="explore"]')));
setupJeDestoCloze();
setupProportionRows();
setupCentripetalSimulation(createExploreConfig(document.querySelector('[data-centripetal-simulation="mini"]')));
setupCentripetalSimulation(createRadiusConfig());
setupRadiusMapping();
setupRadiusReasonQuiz();
setupFormulaNewton();
setupLabelGrid();
setupDerivationSemanticTasks();
setupRatioChoice();
setupFormulaDeltaV();
setupCentripetalSpeedFormula();
setupCentripetalOmegaFormula();
setupRoleMatching();
setupRoleQuiz();
setupMisconceptionQuiz();
setupTask11();
setupTask12();
setupTask13();
setupSummaryCloze();
setupFinalQuiz();
