import { createPointVectorGrid } from "./components/point-vector-grid.mjs";
import { setupPhysicsSemanticTask } from "./components/physics-semantic-task.mjs";
import { setupPhysicsStepTabs } from "./components/physics-step-tabs.mjs";

const SCRIPT_SERVER_URL = "https://script.google.com/macros/s/AKfycby8RWL6uYrKZyoJ6m2GRpWyRmXjwsdskyCiqzKpRhIK5-wrDl-9lWWk8CiAGaVMoy0x/exec";

export { createPointVectorGrid, setupPhysicsSemanticTask, setupPhysicsStepTabs };

function numberValue(value) {
  return Number.parseFloat(String(value).trim().replace(",", "."));
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
    const value = numberValue(document.getElementById("acceleration-answer").value);
    const unit = document.getElementById("acceleration-unit").value;
    if (unit === "m/s" && Number.isFinite(value) && Math.abs(value - 7.5) <= 0.1) setFeedback("acceleration-feedback", "success", "Korrekt: v = v₀ + a · t = 0 + 2,5 m/s² · 3 s = 7,5 m/s.");
    else if (unit !== "m/s") setFeedback("acceleration-feedback", "error", "Wähle m/s. Die Beschleunigung wird mit der Zeit multipliziert; v₀ ist hier 0.");
    else setFeedback("acceleration-feedback", "error", "Noch nicht korrekt. Nutze v = v₀ + a · t und setze v₀ = 0 ein.");
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
  "gleichförmige Bewegung mit konstanter Geschwindigkeit",
  "gleichmäßig beschleunigte Bewegung mit Anfangsgeschwindigkeit",
  "gleichmäßig verzögerte Bewegung bis zum Stillstand",
  "gleichmäßig verzögerte Bewegung, danach gleichförmige Bewegung",
  "gleichmäßig beschleunigte Bewegung, danach gleichförmige Bewegung",
  "beschleunigte Bewegung mit immer kleinerer Beschleunigung",
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
  const diagrams = ["constant", "accelerated", "decelerated", "deceleratedConstant", "acceleratedConstant", "softAcceleration"];
  const bank = document.getElementById("vt-diagram-bank");
  diagrams.forEach((kind, index) => {
    const card = document.createElement("article");
    card.className = "diagram-card";
    card.innerHTML = `<h4>${String.fromCharCode(65 + index)}</h4>`;
    card.append(chartSvg(kind, `v(t)-Diagramm ${String.fromCharCode(65 + index)}`));
    card.append(selectElement(`Diagramm ${String.fromCharCode(65 + index)}: Beschreibung`, vtDescriptions, "vtAnswer", String.fromCharCode(65 + index)));
    bank.append(card);
  });
  document.getElementById("check-vt-matching").addEventListener("click", () => {
    const expected = [1, 2, 3, 4, 5, 6];
    const selects = [...document.querySelectorAll("[data-vt-answer]")];
    const correct = selects.filter((select, index) => Number(select.value) === expected[index] - 1).length;
    if (correct === 6) setFeedback("vt-matching-feedback", "success", "Korrekt: Du hast Steigung und waagerechte Verläufe passend gedeutet.");
    else if (correct > 0) setFeedback("vt-matching-feedback", "partial", `${correct} von 6 Diagrammen stimmen. Prüfe Steigung (Beschleunigung) und waagerechte Abschnitte (konstante Geschwindigkeit).`);
    else setFeedback("vt-matching-feedback", "error", "Noch nicht korrekt. Eine waagerechte Linie bedeutet konstante Geschwindigkeit; eine steigende oder fallende Linie zeigt Beschleunigung oder Verzögerung.");
  });
}

function setupGivenVtChart() {
  const host = document.getElementById("given-vt-chart");
  const svg = chartSvg("constant", "v(t)-Diagramm der fünf Bewegungsabschnitte", { width: 720, height: 270 });
  svg.innerHTML = '<line x1="55" y1="220" x2="680" y2="220" class="chart-axis"/><line x1="55" y1="220" x2="55" y2="28" class="chart-axis"/><path d="M55 220 L180 130 L305 130 L430 70 L555 70 L680 220" class="chart-plot given-vt-plot"/><text x="48" y="248">0</text><text x="168" y="248">3</text><text x="293" y="248">6</text><text x="418" y="248">9</text><text x="539" y="248">12</text><text x="665" y="248">15 min</text><text x="12" y="38">v</text><text x="190" y="122">15 m/s</text><text x="440" y="62">25 m/s</text><text x="112" y="145">I</text><text x="240" y="116">II</text><text x="360" y="94">III</text><text x="485" y="56">IV</text><text x="605" y="145">V</text>';
  host.append(svg);
}

function setupWayTask() {
  let attempts = 0;
  document.getElementById("check-way").addEventListener("click", () => {
    attempts += 1;
    const value = numberValue(document.getElementById("way-answer").value);
    const unit = document.getElementById("way-unit").value;
    const valid = (unit === "m" && Math.abs(value - 14400) <= 15) || (unit === "km" && Math.abs(value - 14.4) <= 0.03);
    if (valid) setFeedback("way-feedback", "success", "Korrekt: Die Flächen unter den fünf Abschnitten ergeben zusammen 14 400 m = 14,4 km.");
    else if (unit !== "m" && unit !== "km") setFeedback("way-feedback", "error", "Wähle eine passende Einheit für den Weg.");
    else if (attempts === 1) setFeedback("way-feedback", "error", "Noch nicht korrekt. Zerlege die Fläche unter dem Diagramm zuerst in Rechtecke und Dreiecke.");
    else setFeedback("way-feedback", "error", "Noch nicht korrekt. Addiere die Teilflächen und prüfe danach die Umrechnung zwischen m und km.");
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
  otherData.positions.forEach((kind, index) => {
    const row = document.createElement("article");
    row.className = "other-match-row";
    row.innerHTML = `<div class="mini-position"><strong>${index + 1}</strong></div>`;
    row.querySelector(".mini-position").append(chartSvg(kind, `Zeit-Ort-Diagramm ${index + 1}`, { width: 180, height: 110, yLabel: "x" }));
    const speedLabel = selectElement(`Diagramm ${index + 1}: Geschwindigkeit`, ["A", "B", "C", "D"], "otherSpeed", String(index + 1), ["A", "B", "C", "D"]);
    const accelerationLabel = selectElement(`Diagramm ${index + 1}: Beschleunigung`, ["I", "II", "III", "IV"], "otherAcceleration", String(index + 1), ["I", "II", "III", "IV"]);
    row.append(speedLabel, accelerationLabel);
    list.append(row);
  });
  document.getElementById("check-other-matching").addEventListener("click", () => {
    const speedSelects = [...document.querySelectorAll("[data-other-speed]")];
    const accelerationSelects = [...document.querySelectorAll("[data-other-acceleration]")];
    const speedCorrect = speedSelects.filter((select, index) => select.value === otherData.speedExpected[index]).length;
    const accelerationCorrect = accelerationSelects.filter((select, index) => select.value === otherData.accelerationExpected[index]).length;
    const total = speedCorrect + accelerationCorrect;
    if (total === 8) { setFeedback("other-matching-feedback", "success", "Korrekt: Die Steigung des Zeit-Ort-Diagramms und ihre Änderung erklären die Zuordnungen."); document.getElementById("other-resolution").hidden = false; }
    else if (total > 0) setFeedback("other-matching-feedback", "partial", `${total} von 8 Zuordnungen stimmen. Mehrfachzuordnungen sind erlaubt; vergleiche jeweils Steigung und Geschwindigkeitsänderung.`);
    else setFeedback("other-matching-feedback", "error", "Noch nicht korrekt. Bestimme zuerst die Steigung jedes Zeit-Ort-Diagramms.");
  });
}

function setupQuiz() {
  document.getElementById("check-quiz").addEventListener("click", () => {
    const expected = ["speed", "acceleration", "m/s2"];
    const selected = expected.map((name, index) => document.querySelector(`input[name="quiz-${index + 1}"]:checked`));
    const answered = selected.filter(Boolean).length;
    if (answered < 3) { setFeedback("quiz-feedback", "error", "Beantworte zuerst alle drei Fragen."); return; }
    const correct = selected.filter((input, index) => input.value === expected[index]).length;
    if (correct === 3) { setFeedback("quiz-feedback", "success", "Korrekt: Du hast die zentralen Begriffe sicher wiederholt."); document.getElementById("module-summary").hidden = false; }
    else if (correct > 0) setFeedback("quiz-feedback", "partial", `${correct} von 3 Antworten stimmen. Prüfe noch einmal Betrag, Richtung und die Bedeutung der Steigung.`);
    else setFeedback("quiz-feedback", "error", "Noch nicht korrekt. Wiederhole den Unterschied zwischen Geschwindigkeit, Beschleunigung und Weg.");
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
