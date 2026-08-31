import { createPointVectorGrid } from "./components/point-vector-grid.mjs";
import { setupPhysicsSemanticTask } from "./components/physics-semantic-task.mjs";
import { setupPhysicsStepTabs } from "./components/physics-step-tabs.mjs";

const SCRIPT_SERVER_URL = "https://script.google.com/macros/s/AKfycby8RWL6uYrKZyoJ6m2GRpWyRmXjwsdskyCiqzKpRhIK5-wrDl-9lWWk8CiAGaVMoy0x/exec";

export { createPointVectorGrid, setupPhysicsSemanticTask, setupPhysicsStepTabs };

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
  const box = document.getElementById(id);
  box.hidden = false;
  box.className = `physics-feedback ${status}`;
  box.textContent = message;
}

function setupUnitTable() {
  const expected = {
    pedestrian: { value: 1.4, tolerance: 0.15, label: "Fußgänger" },
    cyclist: { value: 19, tolerance: 0.3, label: "Radfahrerin" },
    horse: { value: 16.7, tolerance: 0.25, label: "Rennpferd" },
    car: { value: 129.6, tolerance: 1.5, label: "Auto" },
  };
  document.getElementById("check-units").addEventListener("click", () => {
    const wrong = [];
    let correct = 0;
    Object.entries(expected).forEach(([key, target]) => {
      const input = document.querySelector(`[data-unit-answer="${key}"]`);
      const value = numberValue(input.value);
      const valid = Number.isFinite(value) && Math.abs(value - target.value) <= target.tolerance;
      input.classList.toggle("is-correct", valid);
      input.classList.toggle("is-wrong", !valid);
      if (valid) correct += 1;
      else wrong.push(target.label);
    });
    if (correct === 4) setFeedback("unit-feedback", "success", "Korrekt: Alle vier Umrechnungen stimmen – mit passenden Rundungen.");
    else if (correct > 0) setFeedback("unit-feedback", "partial", `${correct} von 4 Umrechnungen stimmen. Prüfe noch: ${wrong.join(", ")}. Nutze den Faktor 3,6 in der passenden Rechenrichtung.`);
    else setFeedback("unit-feedback", "error", "Noch nicht korrekt. Denke zuerst an 1 m/s = 3,6 km/h und an die Rechenrichtung.");
  });
}

function setupVectorTasks() {
  const configs = {
    left: { host: "vector-grid-left", feedback: "vector-feedback-left", origin: { x: 0, y: 0 }, xRange: { min: -3, max: 7 }, yRange: { min: -3, max: 4 }, vectors: [{ x: 1, y: 2, label: "v₁" }, { x: 5, y: 0, label: "v₂" }], expected: { x: 6, y: 2 } },
    right: { host: "vector-grid-right", feedback: "vector-feedback-right", origin: { x: 0, y: 0 }, xRange: { min: -3, max: 7 }, yRange: { min: -3, max: 4 }, vectors: [{ x: -2, y: 2, label: "v₁" }, { x: 6, y: 0, label: "v₂" }], expected: { x: 4, y: 2 } },
  };
  Object.entries(configs).forEach(([key, config]) => {
    const grid = createPointVectorGrid(document.getElementById(config.host), config);
    document.querySelector(`[data-vector-check="${key}"]`).addEventListener("click", () => {
      const selection = grid.getSelection();
      if (!selection) {
        setFeedback(config.feedback, "error", "Wähle zuerst eine Gitterkreuzung als Endpunkt der Resultierenden.");
      } else if (selection.x === config.expected.x && selection.y === config.expected.y) {
        setFeedback(config.feedback, "success", `Korrekt: Die Resultierende endet bei (${config.expected.x}|${config.expected.y}).`);
      } else {
        setFeedback(config.feedback, "partial", "Noch nicht korrekt. Addiere die x-Komponenten und die y-Komponenten getrennt.");
      }
    });
  });
}

function setupVectorMeaning() {
  document.getElementById("check-vector-meaning").addEventListener("click", () => {
    const answers = [...document.querySelectorAll("[data-vector-meaning]")];
    const correct = answers.filter((select) => select.value === select.dataset.vectorMeaning).length;
    if (correct === 2) setFeedback("vector-meaning-feedback", "success", "Korrekt: Der Betrag ist die Zahl mit Einheit, die Richtung zeigt der Pfeil.");
    else if (correct === 1) setFeedback("vector-meaning-feedback", "partial", "Eine Zuordnung stimmt. Denke daran: Eine bloße Zahl mit Einheit enthält noch keine Richtung.");
    else setFeedback("vector-meaning-feedback", "error", "Noch nicht korrekt. Trenne Betrag (Zahl mit Einheit) und Richtung (Pfeil). ");
  });
}

function setupAcceleration() {
  document.getElementById("check-acceleration").addEventListener("click", () => {
    const input = document.getElementById("acceleration-answer");
    const value = numberValue(input.value);
    const unit = document.getElementById("acceleration-unit").value;
    const target = unit === "m/s" ? 7.5 : 27;
    const tolerance = unit === "m/s" ? 0.01 : 0.05;
    const valueCorrect = Number.isFinite(value) && Math.abs(value - target) <= tolerance;
    const digitsCorrect = significantDigitCount(input.value) === 2;
    if (valueCorrect && digitsCorrect) {
      setFeedback("acceleration-feedback", "success", "Korrekt: v = v₀ + a · t = 7,5 m/s = 27 km/h. Die Angaben 2,5 m/s² und 3,0 s besitzen jeweils zwei gültige Ziffern; deshalb hat auch das Ergebnis zwei gültige Ziffern.");
    } else if (valueCorrect) {
      setFeedback("acceleration-feedback", "partial", "Der Zahlenwert und die Einheit passen. Gib das Ergebnis noch mit genau zwei gültigen Ziffern an: Die ungenauesten Angaben 2,5 m/s² und 3,0 s besitzen jeweils zwei gültige Ziffern.");
    } else {
      setFeedback("acceleration-feedback", "error", "Noch nicht korrekt. Nutze v = v₀ + a · t mit v₀ = 0, beachte die gewählte Einheit und gib das Ergebnis mit zwei gültigen Ziffern an.");
    }
  });
}

function chartSvg(kind, ariaLabel, options = {}) {
  const { width = 300, height = 160, yLabel = "v", centered = false } = options;
  const xStart = 30;
  const xEnd = width - 30;
  const xMiddle = (xStart + xEnd) / 2;
  const axisY = centered ? height / 2 : height - 30;
  const timeLabelY = centered ? axisY + 17 : height - 12;
  const top = 28;
  const start = axisY - 10;
  const constantLevel = centered ? axisY : axisY - 38;
  const plots = {
    constant: `M${xStart} ${constantLevel} L${xEnd} ${constantLevel}`,
    accelerated: `M${xStart} ${start} L${xEnd} ${top}`,
    decelerated: `M${xStart} ${top} L${xEnd} ${axisY}`,
    deceleratedConstant: `M${xStart} ${top} L${xMiddle} ${axisY - 15} L${xEnd} ${axisY - 15}`,
    acceleratedConstant: `M${xStart} ${start} L${xMiddle} ${top + 5} L${xEnd} ${top + 5}`,
    softAcceleration: `M${xStart} ${start} Q${xMiddle} ${top} ${xEnd} ${top}`,
    line: `M${xStart} ${start} L${xEnd} ${top + 5}`,
    lineOffset: `M${xStart} ${start - 16} L${xEnd} ${top - 11}`,
    curve: `M${xStart} ${start} Q${xMiddle} ${start - 5} ${xEnd} ${top}`,
    zero: `M${xStart} ${axisY} L${xEnd} ${axisY}`,
    positiveConstant: `M${xStart} ${axisY - 30} L${xEnd} ${axisY - 30}`,
    negativeConstant: `M${xStart} ${axisY + 30} L${xEnd} ${axisY + 30}`,
    changingAcceleration: `M${xStart} ${axisY + 30} L${xEnd} ${axisY - 30}`,
  };
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", ariaLabel);
  svg.innerHTML = `<line x1="${xStart}" y1="${axisY}" x2="${width - 20}" y2="${axisY}" class="chart-axis"/><line x1="${xStart}" y1="${height - 15}" x2="${xStart}" y2="20" class="chart-axis"/><path d="${plots[kind]}" class="chart-plot"/><text x="${width - 26}" y="${timeLabelY}">t</text><text x="8" y="25">${yLabel}</text>`;
  return svg;
}

const vtDescriptions = [
  { id: "constant", text: "gleichförmige Bewegung mit konstanter Geschwindigkeit" },
  { id: "positive", text: "gleichmäßig beschleunigte Bewegung mit positiver Beschleunigung und Anfangsgeschwindigkeit" },
  { id: "negative-to-rest", text: "gleichmäßig beschleunigte Bewegung mit negativer Beschleunigung bis zum Stillstand" },
  { id: "negative-then-constant", text: "gleichmäßig beschleunigte Bewegung mit negativer Beschleunigung, danach gleichförmige Bewegung" },
  { id: "positive-then-constant", text: "gleichmäßig beschleunigte Bewegung mit positiver Beschleunigung, danach gleichförmige Bewegung" },
  { id: "decreasing-positive", text: "beschleunigte Bewegung mit positiver, aber immer kleinerer Beschleunigung" },
];

const vtOptionOrder = [
  "negative-then-constant",
  "constant",
  "decreasing-positive",
  "positive-then-constant",
  "negative-to-rest",
  "positive",
];

function selectElement(label, options, attribute, value, optionValues = options.map((_, index) => String(index))) {
  const labelElement = document.createElement("label");
  labelElement.textContent = label;
  const select = document.createElement("select");
  select.setAttribute("aria-label", label);
  select.dataset[attribute] = value;
  select.innerHTML = '<option value="">Auswahl wählen …</option>' + options.map((option, index) => `<option value="${optionValues[index]}">${option}</option>`).join("");
  labelElement.append(select);
  return labelElement;
}

function setupVtMatching() {
  const diagrams = [
    { kind: "constant", expected: "constant" },
    { kind: "accelerated", expected: "positive" },
    { kind: "decelerated", expected: "negative-to-rest" },
    { kind: "deceleratedConstant", expected: "negative-then-constant" },
    { kind: "acceleratedConstant", expected: "positive-then-constant" },
    { kind: "softAcceleration", expected: "decreasing-positive" },
  ];
  const optionById = new Map(vtDescriptions.map((item) => [item.id, item]));
  const orderedOptions = vtOptionOrder.map((id) => optionById.get(id));
  const bank = document.getElementById("vt-diagram-bank");
  diagrams.forEach(({ kind, expected }, index) => {
    const diagramLabel = String.fromCharCode(65 + index);
    const taskLabel = String.fromCharCode(97 + index);
    const card = document.createElement("article");
    card.className = "diagram-card";
    card.innerHTML = `<h4>Aufgabe 5${taskLabel} · Diagramm ${diagramLabel}</h4>`;
    card.append(chartSvg(kind, `v(t)-Diagramm ${diagramLabel}`));
    const selectLabel = selectElement(
      `Diagramm ${diagramLabel}: Beschreibung`,
      orderedOptions.map((item) => item.text),
      "vtAnswer",
      diagramLabel,
      orderedOptions.map((item) => item.id)
    );
    const select = selectLabel.querySelector("select");
    const button = document.createElement("button");
    button.type = "button";
    button.className = "physics-primary-button direct-check-button";
    button.textContent = `Diagramm ${diagramLabel} prüfen`;
    const feedback = document.createElement("div");
    feedback.id = `vt-feedback-${diagramLabel.toLowerCase()}`;
    feedback.className = "physics-feedback";
    feedback.setAttribute("role", "status");
    feedback.setAttribute("aria-live", "polite");
    feedback.hidden = true;
    select.addEventListener("change", () => {
      feedback.hidden = true;
      select.classList.remove("is-correct", "is-wrong");
    });
    button.addEventListener("click", () => {
      if (!select.value) {
        select.classList.remove("is-correct", "is-wrong");
        setFeedback(feedback.id, "error", "Wähle zuerst eine Beschreibung aus.");
      } else if (select.value === expected) {
        select.classList.add("is-correct");
        select.classList.remove("is-wrong");
        setFeedback(feedback.id, "success", "Korrekt: Verlauf und Beschleunigung passen zu deiner Beschreibung.");
      } else {
        select.classList.add("is-wrong");
        select.classList.remove("is-correct");
        setFeedback(feedback.id, "partial", "Noch nicht korrekt. Prüfe, ob der Graph waagerecht, steigend oder fallend verläuft und ob seine Steigung konstant ist.");
      }
    });
    card.append(selectLabel, button, feedback);
    bank.append(card);
  });
}

function setupGivenVtChart() {
  const host = document.getElementById("given-vt-chart");
  const svg = chartSvg("constant", "v(t)-Diagramm der fünf Bewegungsabschnitte, Geschwindigkeit in Meter pro Sekunde und Zeit in Minuten", { width: 720, height: 270 });
  svg.innerHTML = '<defs><marker id="given-vt-axis-arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L6,3 L0,6 z" class="chart-axis-arrow"/></marker></defs><line x1="55" y1="220" x2="695" y2="220" class="chart-axis" marker-end="url(#given-vt-axis-arrow)"/><line x1="55" y1="220" x2="55" y2="22" class="chart-axis" marker-end="url(#given-vt-axis-arrow)"/><line x1="51" y1="130" x2="59" y2="130" class="chart-axis"/><line x1="51" y1="70" x2="59" y2="70" class="chart-axis"/><path d="M55 220 L180 130 L305 130 L430 70 L555 70 L680 220" class="chart-plot given-vt-plot"/><text x="48" y="248">0</text><text x="168" y="248">3</text><text x="293" y="248">6</text><text x="418" y="248">9</text><text x="539" y="248">12</text><text x="672" y="248">15</text><text class="chart-axis-label" x="635" y="264">t in min</text><text class="chart-axis-label" x="7" y="17">v in m/s</text><text class="chart-value-label" text-anchor="end" x="48" y="135">15 m/s</text><text class="chart-value-label" text-anchor="end" x="48" y="75">25 m/s</text><text class="chart-section-label" text-anchor="middle" x="118" y="45">I</text><text class="chart-section-label" text-anchor="middle" x="243" y="45">II</text><text class="chart-section-label" text-anchor="middle" x="368" y="45">III</text><text class="chart-section-label" text-anchor="middle" x="493" y="45">IV</text><text class="chart-section-label" text-anchor="middle" x="618" y="45">V</text>';
  host.append(svg);
}

function setupWayTask() {
  let attempts = 0;
  document.getElementById("check-way").addEventListener("click", () => {
    attempts += 1;
    const input = document.getElementById("way-answer");
    const value = numberValue(input.value);
    const unit = document.getElementById("way-unit").value;
    const target = unit === "m" ? 14000 : 14;
    const tolerance = unit === "m" ? 50 : 0.05;
    const exact = unit === "m" ? 14400 : 14.4;
    const exactTolerance = unit === "m" ? 15 : 0.03;
    const valueCorrect = Number.isFinite(value) && Math.abs(value - target) <= tolerance;
    const exactButUnrounded = Number.isFinite(value) && Math.abs(value - exact) <= exactTolerance;
    const digitsCorrect = significantDigitCount(input.value) === 2;
    if (valueCorrect && digitsCorrect) {
      setFeedback("way-feedback", "success", "Korrekt: Die Teilflächen ergeben ungerundet 14,4 km. Mit zwei gültigen Ziffern lautet das Ergebnis 14 km beziehungsweise 14 000 m.");
    } else if (valueCorrect || exactButUnrounded) {
      setFeedback("way-feedback", "partial", "Die Flächenberechnung passt. Runde das Ergebnis noch auf genau zwei gültige Ziffern, weil die ungenauesten Angaben ebenfalls zwei gültige Ziffern besitzen.");
    } else if (attempts === 1) {
      setFeedback("way-feedback", "error", "Noch nicht korrekt. Zerlege die Fläche unter dem Diagramm zuerst in Rechtecke und Dreiecke und beachte zwei gültige Ziffern.");
    } else {
      setFeedback("way-feedback", "error", "Noch nicht korrekt. Addiere die Teilflächen, prüfe die Umrechnung zwischen m und km und runde auf zwei gültige Ziffern.");
    }
  });
}

const otherData = {
  positions: ["line", "lineOffset", "curve", "softAcceleration"],
  speeds: ["konstante Geschwindigkeit", "gleichmäßig zunehmende Geschwindigkeit", "gleichmäßig abnehmende Geschwindigkeit", "Geschwindigkeit wird null"],
  accelerations: ["keine Beschleunigung", "konstante negative Beschleunigung", "konstante positive Beschleunigung", "wechselnde Beschleunigung"],
  speedExpected: ["A", "A", "B", "C"],
  accelerationExpected: ["I", "I", "I", "II"],
};

function setupOtherMatching() {
  const bank = document.getElementById("other-diagram-bank");
  const speedCard = document.createElement("article");
  speedCard.className = "diagram-card diagram-bank-wide";
  speedCard.innerHTML = "<h4>Zeit-Geschwindigkeit</h4>";
  ["A", "B", "C", "D"].forEach((label, index) => { const item = document.createElement("div"); item.className = "mini-diagram"; item.innerHTML = `<strong>${label}</strong>`; item.append(chartSvg(["constant", "accelerated", "decelerated", "softAcceleration"][index], `Zeit-Geschwindigkeits-Diagramm ${label}`, { width: 190, height: 110, yLabel: "v" })); speedCard.append(item); });
  const accelerationCard = document.createElement("article");
  accelerationCard.className = "diagram-card diagram-bank-wide";
  accelerationCard.innerHTML = "<h4>Zeit-Beschleunigung</h4>";
  ["I", "II", "III", "IV"].forEach((label, index) => { const item = document.createElement("div"); item.className = "mini-diagram"; item.innerHTML = `<strong>${label}</strong>`; item.append(chartSvg(["zero", "negativeConstant", "positiveConstant", "changingAcceleration"][index], `Zeit-Beschleunigungs-Diagramm ${label}`, { width: 190, height: 110, yLabel: "a", centered: true })); accelerationCard.append(item); });
  bank.append(speedCard, accelerationCard);
  const list = document.getElementById("other-match-list");
  const verified = new Set();
  otherData.positions.forEach((kind, index) => {
    const row = document.createElement("article");
    row.className = "other-match-row";
    const taskLabel = String.fromCharCode(97 + index);
    row.innerHTML = `<div class="mini-position"><h4>Aufgabe 7${taskLabel} · Zeit-Ort-Diagramm ${index + 1}</h4></div>`;
    row.querySelector(".mini-position").append(chartSvg(kind, `Zeit-Ort-Diagramm ${index + 1}`, { width: 180, height: 110, yLabel: "x" }));
    const controls = [
      {
        key: `speed-${index}`,
        label: `Diagramm ${index + 1}: Geschwindigkeit`,
        options: ["A", "B", "C", "D"],
        attribute: "otherSpeed",
        expected: otherData.speedExpected[index],
        success: "Korrekt: Die Geschwindigkeitskarte passt zur Steigung des x(t)-Diagramms.",
        hint: "Noch nicht korrekt. Vergleiche die Steigung des x(t)-Diagramms mit dem Verlauf der v(t)-Karten.",
        button: "Geschwindigkeit prüfen",
      },
      {
        key: `acceleration-${index}`,
        label: `Diagramm ${index + 1}: Beschleunigung`,
        options: ["I", "II", "III", "IV"],
        attribute: "otherAcceleration",
        expected: otherData.accelerationExpected[index],
        success: "Korrekt: Die Beschleunigungskarte passt zur Änderung der Steigung.",
        hint: "Noch nicht korrekt. Prüfe, ob und in welche Richtung sich die Steigung des x(t)-Diagramms ändert.",
        button: "Beschleunigung prüfen",
      },
    ];
    controls.forEach((config) => {
      const control = document.createElement("div");
      control.className = "direct-match-control";
      const label = selectElement(config.label, config.options, config.attribute, String(index + 1), config.options);
      const select = label.querySelector("select");
      const button = document.createElement("button");
      button.type = "button";
      button.className = "physics-primary-button direct-check-button";
      button.textContent = config.button;
      const feedback = document.createElement("div");
      feedback.id = `other-feedback-${config.key}`;
      feedback.className = "physics-feedback compact-feedback";
      feedback.setAttribute("role", "status");
      feedback.setAttribute("aria-live", "polite");
      feedback.hidden = true;
      select.addEventListener("change", () => {
        verified.delete(config.key);
        feedback.hidden = true;
        select.classList.remove("is-correct", "is-wrong");
        document.getElementById("other-resolution").hidden = true;
      });
      button.addEventListener("click", () => {
        if (!select.value) {
          verified.delete(config.key);
          setFeedback(feedback.id, "error", "Wähle zuerst eine Diagrammkarte aus.");
        } else if (select.value === config.expected) {
          verified.add(config.key);
          select.classList.add("is-correct");
          select.classList.remove("is-wrong");
          setFeedback(feedback.id, "success", config.success);
        } else {
          verified.delete(config.key);
          select.classList.add("is-wrong");
          select.classList.remove("is-correct");
          setFeedback(feedback.id, "partial", config.hint);
        }
        document.getElementById("other-resolution").hidden = verified.size !== 8;
      });
      control.append(label, button, feedback);
      row.append(control);
    });
    list.append(row);
  });
}

function setupQuiz() {
  const quizItems = [
    {
      question: "Welche Aussagen beschreiben die Geschwindigkeit korrekt?",
      correct: ["directed", "magnitude", "direction"],
      options: [
        ["scalar", "Geschwindigkeit besitzt grundsätzlich keine Richtung."],
        ["magnitude", "Ihr Betrag beschreibt, wie schnell sich ein Körper bewegt."],
        ["acceleration-unit", "Ihre SI-Einheit ist m/s²."],
        ["direction", "Die Pfeilrichtung beschreibt die Bewegungsrichtung."],
        ["directed", "Geschwindigkeit ist eine gerichtete Größe."],
      ],
      hint: "Trenne Betrag, Richtung und die Einheit der Geschwindigkeit.",
    },
    {
      question: "Welche Aussagen zu einem v(t)-Diagramm sind richtig?",
      correct: ["slope", "horizontal", "area"],
      options: [
        ["height-acceleration", "Die Höhe des Graphen gibt direkt die Beschleunigung an."],
        ["horizontal", "Ein waagerechter Abschnitt bedeutet konstante Geschwindigkeit."],
        ["negative-speed", "Ein fallender Graph bedeutet immer eine negative Geschwindigkeit."],
        ["area", "Die Fläche unter dem Graphen liefert bei nichtnegativer Geschwindigkeit den zurückgelegten Weg."],
        ["slope", "Die Steigung beschreibt die Beschleunigung."],
      ],
      hint: "Unterscheide Höhe, Steigung und Fläche des Graphen.",
    },
    {
      question: "Welche Einheiten können eine Beschleunigung beschreiben?",
      correct: ["m-s2", "m-s-per-s", "km-h-per-s"],
      options: [
        ["m-s", "m/s"],
        ["m-s2", "m/s²"],
        ["km-h", "km/h"],
        ["km-h-per-s", "km/h pro s"],
        ["m-s-per-s", "m/s pro s"],
      ],
      hint: "Eine Beschleunigung gibt an, wie stark sich eine Geschwindigkeit pro Zeit ändert.",
    },
  ];
  const target = document.getElementById("physics-quiz");
  const verified = new Set();
  const sameValues = (first, second) => first.length === second.length && first.every((value) => second.includes(value));
  quizItems.forEach((item, index) => {
    const fieldset = document.createElement("fieldset");
    fieldset.className = "physics-quiz-question quiz-question";
    const legend = document.createElement("legend");
    legend.textContent = `Aufgabe 8${String.fromCharCode(97 + index)} · ${item.question}`;
    const options = document.createElement("div");
    options.className = "quiz-options";
    item.options.forEach(([value, labelText]) => {
      const label = document.createElement("label");
      label.className = "quiz-option";
      const input = document.createElement("input");
      input.type = "checkbox";
      input.name = `physics-quiz-${index}`;
      input.value = value;
      input.addEventListener("change", () => {
        verified.delete(index);
        fieldset.classList.remove("is-correct", "is-wrong");
        fieldset.querySelector(".quiz-item-feedback").hidden = true;
        document.getElementById("module-summary").hidden = true;
      });
      label.append(input, document.createTextNode(labelText));
      options.append(label);
    });
    const button = document.createElement("button");
    button.type = "button";
    button.className = "physics-primary-button direct-check-button";
    button.textContent = `Aufgabe 8${String.fromCharCode(97 + index)} prüfen`;
    const feedback = document.createElement("p");
    feedback.className = "physics-feedback quiz-item-feedback";
    feedback.setAttribute("role", "status");
    feedback.setAttribute("aria-live", "polite");
    feedback.hidden = true;
    button.addEventListener("click", () => {
      const selected = [...fieldset.querySelectorAll("input:checked")].map((input) => input.value);
      const correctSelected = selected.filter((value) => item.correct.includes(value));
      const extra = selected.filter((value) => !item.correct.includes(value));
      const valid = sameValues(selected, item.correct);
      fieldset.classList.toggle("is-correct", valid);
      fieldset.classList.toggle("is-wrong", !valid);
      if (valid) {
        verified.add(index);
        feedback.className = "physics-feedback quiz-item-feedback success";
        feedback.textContent = "Korrekt: Alle richtigen Aussagen und keine falsche Aussage sind ausgewählt.";
      } else if (!selected.length) {
        verified.delete(index);
        feedback.className = "physics-feedback quiz-item-feedback error";
        feedback.textContent = "Wähle mindestens zwei Aussagen aus und prüfe dann erneut.";
      } else if (correctSelected.length && !extra.length) {
        verified.delete(index);
        feedback.className = "physics-feedback quiz-item-feedback partial";
        feedback.textContent = `Teilweise korrekt: Mindestens eine richtige Aussage fehlt. ${item.hint}`;
      } else {
        verified.delete(index);
        feedback.className = "physics-feedback quiz-item-feedback error";
        feedback.textContent = `Noch nicht korrekt. ${item.hint}`;
      }
      feedback.hidden = false;
      document.getElementById("module-summary").hidden = verified.size !== quizItems.length;
    });
    fieldset.append(legend, options, button, feedback);
    target.append(fieldset);
  });
}

setupPhysicsStepTabs();
setupUnitTable();
setupVectorMeaning();
setupVectorTasks();
setupAcceleration();
setupVtMatching();
setupGivenVtChart();
setupWayTask();
setupOtherMatching();
setupQuiz();
setupPhysicsSemanticTask({ answerId: "motion-description-answer", buttonId: "check-motion-description", feedbackId: "motion-description-feedback", countId: "motion-description-count", taskId: "ph11-kreisbewegungen-bewegung-diagramm-beschreibung", serverUrl: SCRIPT_SERVER_URL });
