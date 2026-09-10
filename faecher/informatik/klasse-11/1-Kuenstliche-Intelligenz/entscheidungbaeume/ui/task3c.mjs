import { FISH_LABELS, FISH_TEST_DATASET } from "../data/fish.mjs";
import { renderTreeEdges } from "./tree-edges.mjs?v=20260820d";

const STORAGE_KEY = "informatik11-fish-test-task3c-v1";
const STEPS = ["test", "matrix", "accuracy-intro", "classify", "fill-matrix", "evaluate", "quiz"];
const MATRIX_ANSWERS = Object.freeze({
  "peaceful-peaceful": 3, "peaceful-hostile": 0, "peaceful-total": 3,
  "hostile-peaceful": 1, "hostile-hostile": 1, "hostile-total": 2,
  "predicted-peaceful-total": 4, "predicted-hostile-total": 1, total: 5,
});

const QUIZ = Object.freeze([
  { question: "Welche Aussagen zu Trainingsdaten und Testdaten stimmen?", correct: ["training", "test"], options: [["training", "Trainingsdaten werden zum Erstellen des Baums verwendet."], ["test", "Testdaten wurden nicht zum Erstellen dieses Baums verwendet."], ["same", "Testdaten müssen immer dieselben Fische wie die Trainingsdaten enthalten."], ["unknown", "Bei Testdaten dürfen die tatsächlichen Labels grundsätzlich nicht bekannt sein."]] },
  { question: "Was gilt für den ersten Knoten des Fischbaums aus Aufgabe 3a?", correct: ["scales", "gain"], options: [["scales", "Schuppenfarbe steht am ersten Knoten."], ["gain", "Sie wurde gewählt, weil sie den größten Informationsgewinn hatte."], ["pattern", "Muster steht am ersten Knoten, weil es immer perfekt trennt."], ["random", "Der erste Knoten wird zufällig ausgewählt."]] },
  { question: "Wie liest du die Konfusionsmatrix in diesem Modul?", correct: ["rows", "columns"], options: [["rows", "Die Zeilen zeigen das erwartete beziehungsweise tatsächliche Label."], ["columns", "Die Spalten zeigen das berechnete beziehungsweise vorhergesagte Label."], ["flip", "Zeilen und Spalten zeigen beide nur das berechnete Label."], ["colors", "Nur die Farbe eines Feldes entscheidet über seine Bedeutung."]] },
  { question: "Welche Aussagen zu positiv und negativ sind richtig?", correct: ["positive", "false-positive"], options: [["positive", "Friedlich ist hier die positive Klasse; feindselig ist die negative Klasse."], ["false-positive", "Feindselig erwartet und friedlich berechnet ist falsch positiv."], ["true-negative", "Friedlich erwartet und friedlich berechnet ist richtig negativ."], ["fixed", "Positiv bedeutet immer gut und negativ immer schlecht."]] },
  { question: "Wie wird die Genauigkeit bestimmt?", correct: ["diagonal", "result"], options: [["diagonal", "Die richtig klassifizierten Daten liegen in den beiden Diagonalfeldern."], ["result", "Hier sind 4 von 5 Fischen richtig klassifiziert; das sind 80 %."], ["all", "Für die Genauigkeit zählt nur das Feld richtig positiv."], ["guarantee", "80 % garantiert dieselbe Genauigkeit für alle zukünftigen Fischdaten."]] },
  { question: "Welche Ergebnisse gehören zu den fünf Testfischen?", correct: ["matrix", "mistake"], options: [["matrix", "Die Matrix enthält 3 friedlich/friedlich und 1 feindselig/feindselig."], ["mistake", "Ein feindseliger Testfisch wird als friedlich berechnet."], ["perfect", "Alle fünf Testfische werden richtig klassifiziert."], ["hostile", "Drei feindselige Testfische werden als feindselig berechnet."]] },
]);

const referenceTree = Object.freeze({
  key: "root", label: "Schuppenfarbe", type: "feature", yes: {
    key: "blue-pattern", label: "Muster", type: "feature", yes: { key: "blue-plain", label: "friedlich", type: "leaf", labelType: "peaceful" }, no: {
      key: "blue-belly", label: "Bauchfarbe", type: "feature", yes: { key: "blue-black", label: "feindselig", type: "leaf", labelType: "hostile" }, no: { key: "blue-white", label: "friedlich", type: "leaf", labelType: "peaceful" },
    },
  }, no: {
    key: "orange-belly", label: "Bauchfarbe", type: "feature", yes: { key: "orange-black", label: "friedlich", type: "leaf", labelType: "peaceful" }, no: { key: "orange-white", label: "feindselig", type: "leaf", labelType: "hostile" },
  },
});

const defaultState = () => ({ activeStep: "test", visited: [], predictions: {}, classificationAttempts: 0, matrix: {}, accuracy: {}, quiz: {}, quizComplete: false });
function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return parsed && typeof parsed === "object" ? { ...defaultState(), ...parsed } : defaultState();
  } catch { return defaultState(); }
}
const state = loadState();
function saveState(message = "Bearbeitungsstand gespeichert.") {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); document.querySelector("#save-status").textContent = message; }
  catch { document.querySelector("#save-status").textContent = "Der Bearbeitungsstand konnte in diesem Browser nicht gespeichert werden."; }
}

function createFishShape(entry) {
  const shape = document.createElement("div");
  shape.className = `fish-shape${entry.features.patternNone ? "" : " has-points"}`;
  shape.style.setProperty("--scale-color", entry.features.scalesBlue ? "var(--fish-blue)" : "var(--fish-orange)");
  shape.style.setProperty("--belly-color", entry.features.bellyBlack ? "#273247" : "#f7f8fa");
  shape.style.setProperty("--fin-color", entry.features.finsYellow ? "var(--fish-yellow)" : "var(--fish-red)");
  shape.setAttribute("role", "img");
  shape.setAttribute("aria-label", `${entry.id}: Schuppen ${entry.values.scalesBlue}, Muster ${entry.values.patternNone}, Bauch ${entry.values.bellyBlack}, Flossen ${entry.values.finsYellow}`);
  return shape;
}

export function predictFish(entry) {
  if (entry.features.scalesBlue) {
    if (entry.features.patternNone) return FISH_LABELS.PEACEFUL;
    return entry.features.bellyBlack ? FISH_LABELS.HOSTILE : FISH_LABELS.PEACEFUL;
  }
  return entry.features.bellyBlack ? FISH_LABELS.PEACEFUL : FISH_LABELS.HOSTILE;
}

export function fishConfusionMatrix(dataset = FISH_TEST_DATASET) {
  const results = dataset.map((fish) => ({ actual: fish.classification, predicted: predictFish(fish) }));
  return {
    "peaceful-peaceful": results.filter((result) => result.actual === FISH_LABELS.PEACEFUL && result.predicted === FISH_LABELS.PEACEFUL).length,
    "peaceful-hostile": results.filter((result) => result.actual === FISH_LABELS.PEACEFUL && result.predicted === FISH_LABELS.HOSTILE).length,
    "hostile-peaceful": results.filter((result) => result.actual === FISH_LABELS.HOSTILE && result.predicted === FISH_LABELS.PEACEFUL).length,
    "hostile-hostile": results.filter((result) => result.actual === FISH_LABELS.HOSTILE && result.predicted === FISH_LABELS.HOSTILE).length,
  };
}

function branchLabel(node, branch) { return node.label === "Schuppenfarbe" ? (branch === "yes" ? "Blau" : "Orange") : node.label === "Muster" ? (branch === "yes" ? "Ohne" : "Punkte") : branch === "yes" ? "Schwarz" : "Weiß"; }
function treeSlot(node, parentKey = "") {
  const slot = document.createElement("div"); slot.className = "dt-tree-slot";
  const card = document.createElement("article");
  card.className = `dt-tree-node ${node.type === "feature" ? "feature" : `leaf ${node.labelType === "peaceful" ? "safe" : "bites"}`}`;
  card.dataset.treeNodeKey = node.key; if (parentKey) card.dataset.treeParentKey = parentKey;
  card.innerHTML = `<strong class="dt-node-title">${node.label}</strong>`; slot.append(card);
  if (node.type === "feature") {
    const branches = document.createElement("div"); branches.className = "dt-branches";
    ["yes", "no"].forEach((branch) => { const section = document.createElement("section"); section.className = "dt-branch"; const label = document.createElement("span"); label.className = "dt-branch-label"; label.textContent = branchLabel(node, branch); section.append(label, treeSlot(node[branch], node.key)); branches.append(section); });
    slot.append(branches);
  }
  return slot;
}
function renderReferenceTree() { const root = document.querySelector("#reference-tree"); root.replaceChildren(treeSlot(referenceTree)); renderTreeEdges(root); }

function fishHints(fish) {
  const first = `Starte bei Schuppenfarbe: Dieser Fisch ist ${fish.values.scalesBlue}.`;
  const second = fish.features.scalesBlue ? (fish.features.patternNone ? "Folge Blau und danach Ohne Muster." : `Folge Blau, Punkte und dann Bauchfarbe ${fish.values.bellyBlack}.`) : `Folge Orange und dann Bauchfarbe ${fish.values.bellyBlack}.`;
  return [first, second, `Teillösung: ${fish.id} folgt dem Pfad ${fish.features.scalesBlue ? "Blau" : "Orange"} → ${predictFish(fish)}.`];
}
function renderTestFish() {
  const list = document.querySelector("#test-fish-list"); list.replaceChildren(...FISH_TEST_DATASET.map((fish) => {
    const card = document.createElement("article"); card.className = "task3c-test-fish"; card.append(createFishShape(fish));
    const details = document.createElement("div"); details.innerHTML = `<h4>${fish.id}</h4><p>Schuppen ${fish.values.scalesBlue} · ${fish.values.patternNone}<br>${fish.values.bellyBlack}er Bauch · ${fish.values.finsYellow}e Flossen</p><p class="task3c-test-result" hidden></p>`;
    fishHints(fish).forEach((hint, index) => { const help = document.createElement("details"); help.innerHTML = `<summary>Hilfe ${index + 1}</summary><p>${hint}</p>`; details.append(help); });
    const select = document.createElement("select"); select.name = fish.id; select.setAttribute("aria-label", `${fish.id}: vom Baum berechnetes Label`); select.innerHTML = '<option value="">Label wählen …</option><option value="friedlich">friedlich</option><option value="feindselig">feindselig</option>'; select.value = state.predictions[fish.id] ?? "";
    select.addEventListener("change", () => { state.predictions[fish.id] = select.value; saveState(); }); card.append(details, select); return card;
  }));
}

function showFeedback(id, kind, message) { const box = document.querySelector(`#${id}`); box.hidden = false; box.className = `dt-feedback ${kind}`; box.textContent = message; }
function markVisited(step) { if (!state.visited.includes(step)) { state.visited.push(step); saveState(); } updateProgress(); }
function updateProgress() { const completed = state.visited.length; document.querySelector("#progress-bar").style.width = `${Math.round((completed / STEPS.length) * 100)}%`; document.querySelector("#progress-percent").textContent = `${Math.round((completed / STEPS.length) * 100)} % bearbeitet`; document.querySelector("#progress-label").textContent = `Schritt ${STEPS.indexOf(state.activeStep) + 1} von ${STEPS.length}`; document.querySelectorAll("[data-step-tab]").forEach((tab) => tab.classList.toggle("is-complete", state.visited.includes(tab.dataset.stepTab))); }
function showStep(step) { if (!STEPS.includes(step)) return; state.activeStep = step; const index = STEPS.indexOf(step); document.querySelectorAll("[data-step-panel]").forEach((panel) => { panel.hidden = panel.dataset.stepPanel !== step; }); document.querySelectorAll("[data-step-tab]").forEach((tab) => { const active = tab.dataset.stepTab === step; tab.setAttribute("aria-selected", String(active)); tab.tabIndex = active ? 0 : -1; }); document.querySelector("#previous-step").disabled = index === 0; document.querySelector("#next-step").hidden = index === STEPS.length - 1; saveState(); updateProgress(); if (step === "classify") requestAnimationFrame(() => renderTreeEdges(document.querySelector("#reference-tree"))); document.querySelector(`[data-step-panel="${step}"]`).focus({ preventScroll: true }); }

function checkClassification(event) {
  event.preventDefault(); state.classificationAttempts += 1;
  let correct = 0; let firstWrong = null;
  FISH_TEST_DATASET.forEach((fish) => { const input = event.currentTarget.elements[fish.id]; const isCorrect = state.predictions[fish.id] === predictFish(fish); input.classList.toggle("is-correct", isCorrect); input.classList.toggle("is-wrong", !isCorrect); if (isCorrect) correct += 1; else if (!firstWrong) firstWrong = fish; });
  if (correct === FISH_TEST_DATASET.length) showFeedback("classification-feedback", "success", "Korrekt: Alle fünf Vorhersagen folgen dem Entscheidungsbaum. Vergleiche jetzt die eingeblendeten tatsächlichen Labels.");
  else if (correct > 0) showFeedback("classification-feedback", "wrong", `${correct} von 5 Vorhersagen sind korrekt. Prüfe zuerst ${firstWrong.id}: ${fishHints(firstWrong)[1]}`);
  else showFeedback("classification-feedback", "wrong", `Noch nicht korrekt. Beginne bei ${firstWrong.id} mit ${fishHints(firstWrong)[0]}`);
  if (correct === FISH_TEST_DATASET.length || state.classificationAttempts >= 2) {
    FISH_TEST_DATASET.forEach((fish) => {
      const result = event.currentTarget.elements[fish.id].closest(".task3c-test-fish").querySelector(".task3c-test-result");
      const prediction = state.predictions[fish.id] || "keine Vorhersage";
      result.hidden = false;
      result.textContent = `Tatsächlich: ${fish.classification}. Vorhersage: ${prediction}. ${prediction === fish.classification ? "Korrekt." : "Nicht korrekt."}`;
    });
  }
  saveState();
}
function checkMatrix(event) {
  event.preventDefault(); const values = Object.fromEntries(new FormData(event.currentTarget)); let correct = 0; let firstWrong = null;
  Object.entries(MATRIX_ANSWERS).forEach(([key, expected]) => { const input = event.currentTarget.elements[key]; const valid = Number(values[key]) === expected && values[key] !== ""; input.classList.toggle("is-correct", valid); input.classList.toggle("is-wrong", !valid); if (valid) correct += 1; else if (!firstWrong) firstWrong = key; state.matrix[key] = values[key] ?? ""; });
  if (correct === Object.keys(MATRIX_ANSWERS).length) showFeedback("matrix-feedback", "success", "Richtig. Die Matrix enthält insgesamt fünf Testfische und vier richtige Klassifikationen.");
  else { const labels = { "peaceful-peaceful": "tatsächlich friedlich, berechnet friedlich", "peaceful-hostile": "tatsächlich friedlich, berechnet feindselig", "hostile-peaceful": "tatsächlich feindselig, berechnet friedlich", "hostile-hostile": "tatsächlich feindselig, berechnet feindselig", "peaceful-total": "der Summe der tatsächlich friedlichen Fische", "hostile-total": "der Summe der tatsächlich feindseligen Fische", "predicted-peaceful-total": "der Summe der berechneten friedlichen Fische", "predicted-hostile-total": "der Summe der berechneten feindseligen Fische", total: "der Gesamtzahl der Testfische" }; showFeedback("matrix-feedback", correct ? "wrong" : "incomplete", `${correct} von 9 Feldern stimmen. Prüfe das Feld für ${labels[firstWrong]}. Lies zuerst erwartet, dann berechnet.`); }
  saveState();
}
function checkAccuracy(event) {
  event.preventDefault(); const form = event.currentTarget; const values = Object.fromEntries(new FormData(form)); state.accuracy = values; const valuesCorrect = Number(values.correct) === 4 && Number(values.total) === 5 && Number(values.percent) === 80; const judgementCorrect = values.judgement === "correct";
  if (valuesCorrect && judgementCorrect) showFeedback("accuracy-feedback", "success", "Richtig: 4 von 5 Testfischen entsprechen 80 %. Diese Genauigkeit beschreibt nur diese fünf Testdaten.");
  else if (valuesCorrect) showFeedback("accuracy-feedback", "wrong", "Die Zahlen stimmen. Prüfe noch die Aussage: Eine Genauigkeit beschreibt das vorliegende Testset, keine Garantie für alle Fische.");
  else showFeedback("accuracy-feedback", "wrong", "Prüfe die beiden Diagonalfelder der Matrix. Sie liefern die Anzahl richtig klassifizierter Testfische.");
  saveState();
}

function renderQuiz() {
  const target = document.querySelector("#quiz-questions"); target.replaceChildren(...QUIZ.map((item, index) => {
    const fieldset = document.createElement("fieldset"); fieldset.className = "quiz-question"; fieldset.dataset.quizIndex = index;
    const legend = document.createElement("legend"); legend.textContent = `Frage ${index + 1}: ${item.question}`; const options = document.createElement("div"); options.className = "quiz-options";
    item.options.forEach(([value, label]) => { const option = document.createElement("label"); option.className = "quiz-option"; const input = document.createElement("input"); input.type = "checkbox"; input.name = `quiz-${index}`; input.value = value; input.checked = (state.quiz[index] ?? []).includes(value); input.addEventListener("change", () => { state.quiz[index] = [...document.querySelectorAll(`input[name="quiz-${index}"]:checked`)].map((entry) => entry.value); state.quizComplete = false; document.querySelector("#quiz-summary").hidden = true; saveState(); }); option.append(input, document.createTextNode(label)); options.append(option); });
    const feedback = document.createElement("p"); feedback.className = "quiz-item-feedback"; fieldset.append(legend, options, feedback); return fieldset;
  }));
}
function sameValues(first, second) { return first.length === second.length && first.every((value) => second.includes(value)); }
function showQuizSummary() { const summary = document.querySelector("#quiz-summary"); summary.hidden = false; summary.innerHTML = "<h3 id=\"quiz-summary-title\">Abschlussübersicht</h3><p>Alle Auswahlentscheidungen sind richtig.</p>"; const list = document.createElement("ol"); QUIZ.forEach((item) => { const entry = document.createElement("li"); entry.innerHTML = `<strong>${item.question}</strong><br>Richtig: ${item.options.filter(([value]) => item.correct.includes(value)).map(([, label]) => label).join(" ")}`; list.append(entry); }); summary.append(list); }
function checkQuiz(event) {
  event.preventDefault(); let correct = 0;
  QUIZ.forEach((item, index) => {
    const selected = [...event.currentTarget.querySelectorAll(`input[name="quiz-${index}"]:checked`)].map((input) => input.value);
    const valid = sameValues(selected, item.correct);
    const fieldset = event.currentTarget.querySelector(`[data-quiz-index="${index}"]`);
    fieldset.classList.toggle("is-correct", valid); fieldset.classList.toggle("is-wrong", !valid);
    const labelsFor = (values) => item.options.filter(([value]) => values.includes(value)).map(([, label]) => label);
    const missing = item.correct.filter((value) => !selected.includes(value));
    const extra = selected.filter((value) => !item.correct.includes(value));
    const decisions = [];
    if (missing.length) decisions.push(`Es ${missing.length === 1 ? "fehlt" : "fehlen"}: ${labelsFor(missing).join(" / ")}`);
    if (extra.length) decisions.push(`Nicht richtig gewählt: ${labelsFor(extra).join(" / ")}`);
    fieldset.querySelector(".quiz-item-feedback").textContent = valid
      ? `✓ Richtig gewählt: ${labelsFor(item.correct).join(" / ")}`
      : `Noch nicht. ${decisions.join(" ")}`;
    if (valid) correct += 1; state.quiz[index] = selected;
  });
  if (correct === QUIZ.length) { state.quizComplete = true; markVisited("quiz"); showFeedback("quiz-feedback", "success", "Alle sechs Fragen sind richtig beantwortet."); showQuizSummary(); }
  else showFeedback("quiz-feedback", "wrong", `${correct} von ${QUIZ.length} Fragen sind vollständig richtig. Verbessere die markierten Fragen und versuche es erneut.`);
  saveState();
}

function bindNavigation() {
  document.querySelectorAll("[data-step-tab]").forEach((tab) => { tab.addEventListener("click", () => showStep(tab.dataset.stepTab)); tab.addEventListener("keydown", (event) => { if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return; const index = STEPS.indexOf(tab.dataset.stepTab); const next = event.key === "Home" ? 0 : event.key === "End" ? STEPS.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + STEPS.length) % STEPS.length; event.preventDefault(); document.querySelector(`[data-step-tab="${STEPS[next]}"]`).focus(); }); });
  document.querySelector("#previous-step").addEventListener("click", () => { const index = STEPS.indexOf(state.activeStep); if (index > 0) showStep(STEPS[index - 1]); });
  document.querySelector("#next-step").addEventListener("click", () => { const index = STEPS.indexOf(state.activeStep); markVisited(state.activeStep); if (index < STEPS.length - 1) showStep(STEPS[index + 1]); });
}

if (typeof document !== "undefined") {
  renderReferenceTree(); renderTestFish(); renderQuiz();
  document.querySelector("#classification-form").addEventListener("submit", checkClassification);
  document.querySelector("#matrix-form").addEventListener("submit", checkMatrix);
  document.querySelector("#accuracy-form").addEventListener("submit", checkAccuracy);
  document.querySelector("#quiz-form").addEventListener("submit", checkQuiz);
  bindNavigation(); showStep(STEPS.includes(state.activeStep) ? state.activeStep : "test");
  if (state.quizComplete) { markVisited("quiz"); showQuizSummary(); }
}

export { MATRIX_ANSWERS, QUIZ };
