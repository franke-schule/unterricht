import {
  CLASSIFICATIONS,
  FEATURE_DEFINITIONS,
  VARIANTS,
} from "../data/monkeys.mjs";
import {
  COMPARISON_TRAINING_DATA,
  COMPARISON_TREE_A,
  COMPARISON_TREE_B,
  EASY_TEST_DATA,
  TEST_DATASETS,
} from "../data/test-data.mjs";
import {
  cloneTree,
  evaluateTree,
} from "../logic/decision-tree.mjs";
import {
  accuracy,
  appendUniqueResult,
  confusionMatrix,
  createTestResult,
} from "../logic/testing.mjs";

const TREE_STORAGE_PREFIX = "informatik11-decision-tree-v1";
const VERIFIED_PREFIX = "informatik11-decision-tree-verified-v1";
const RUN_PREFIX = "informatik11-decision-tree-test-v1";
const COMPARISON_KEY = "informatik11-decision-tree-comparison-v1";
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

const elements = {
  tabs: [...document.querySelectorAll("[data-test-variant]")],
  gate: document.querySelector("#task2-gate"),
  own: document.querySelector("#task2-own"),
  compare: document.querySelector("#task2-compare"),
};

const state = {
  variantId: location.hash === "#advanced" ? "advanced" : "easy",
  run: null,
  comparison: null,
  animation: null,
  animationToken: 0,
};

function readJson(key) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function writeJson(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* lokal nicht verfügbar */ }
}

function removeStored(key) {
  try { localStorage.removeItem(key); } catch { /* lokal nicht verfügbar */ }
}

function runKey() {
  return `${RUN_PREFIX}-${state.variantId}`;
}

function verifiedTree() {
  const verified = readJson(`${VERIFIED_PREFIX}-${state.variantId}`);
  const storedTree = readJson(`${TREE_STORAGE_PREFIX}-${state.variantId}`);
  if (!verified?.tree || !storedTree) return null;
  if (JSON.stringify(verified.tree) !== JSON.stringify(storedTree)) return null;
  const evaluation = evaluateTree(VARIANTS[state.variantId].dataset, verified.tree);
  return evaluation.complete && evaluation.correct === evaluation.total ? cloneTree(verified.tree) : null;
}

function label(classification) {
  return classification === CLASSIFICATIONS.BITES ? "Beißt" : "Beißt nicht";
}

function percent(value) {
  return `${(value * 100).toLocaleString("de-DE", { maximumFractionDigits: 1 })} %`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function resultCell(result) {
  if (!result) return null;
  if (result.predicted === CLASSIFICATIONS.BITES) {
    return result.actual === CLASSIFICATIONS.BITES ? "truePositive" : "falsePositive";
  }
  return result.actual === CLASSIFICATIONS.BITES ? "falseNegative" : "trueNegative";
}

function matrixMarkup(results, changedCell = null, suffix = "") {
  const matrix = confusionMatrix(results);
  const correct = matrix.truePositive + matrix.trueNegative;
  const value = accuracy(results);
  const cell = (key, abbreviation, description) => `
    <td class="${changedCell === key ? "is-updated" : ""}" data-matrix-cell="${key}${suffix}">
      <strong>${matrix[key]}</strong><span>${abbreviation} · ${description}</span>
    </td>`;
  return `
    <div class="dt-matrix-wrap">
      <table class="dt-confusion-matrix">
        <caption>Konfusionsmatrix${suffix ? ` ${suffix}` : ""}</caption>
        <thead><tr><th scope="col">Vorhersage ↓<br>Tatsächlich →</th><th scope="col">Beißt</th><th scope="col">Beißt nicht</th></tr></thead>
        <tbody>
          <tr><th scope="row">Beißt</th>${cell("truePositive", "TP", "richtig positiv")}${cell("falsePositive", "FP", "falsch positiv")}</tr>
          <tr><th scope="row">Beißt nicht</th>${cell("falseNegative", "FN", "falsch negativ")}${cell("trueNegative", "TN", "richtig negativ")}</tr>
        </tbody>
      </table>
      <p class="dt-score"><strong>Richtig klassifiziert: ${correct} von ${results.length}</strong><br>
        ${value === null ? "Genauigkeit: –" : `Genauigkeit: ${percent(value)}`}</p>
    </div>`;
}

function activeClass(id, kind) {
  if (!state.animation) return "";
  if (kind === "node" && state.animation.nodes?.includes(id)) return " is-active";
  if (kind === "leaf" && (state.animation.leaf === id || state.animation.leaves?.includes(id))) return " is-active is-result";
  if (kind === "branch" && state.animation.branches?.includes(id)) return " is-active";
  return "";
}

function treeMarkup(node) {
  if (node.type === "leaf") {
    const typeClass = node.prediction === CLASSIFICATIONS.BITES ? "bites" : "safe";
    return `<div class="dt-readonly-node leaf ${typeClass}${activeClass(node.id, "leaf")}" data-node-id="${node.id}">
      <span class="dt-node-symbol" aria-hidden="true">${node.prediction === CLASSIFICATIONS.BITES ? "!" : "✓"}</span>
      <strong>${label(node.prediction)}</strong></div>`;
  }
  const branch = (key, branchLabel) => {
    const branchId = `${node.id}:${key}`;
    return `<section class="dt-readonly-branch${activeClass(branchId, "branch")}" data-branch-id="${branchId}">
      <span class="dt-readonly-branch-label">${branchLabel}</span>${treeMarkup(node[key])}</section>`;
  };
  return `<div class="dt-readonly-subtree">
    <div class="dt-readonly-node feature${activeClass(node.id, "node")}" data-node-id="${node.id}">
      <strong>${escapeHtml(FEATURE_DEFINITIONS[node.feature]?.label ?? node.feature)}</strong></div>
    <div class="dt-readonly-branches">${branch("yes", "Ja")}${branch("no", "Nein")}</div>
  </div>`;
}

function monkeyMarkup(monkey, selectable = false) {
  const tag = selectable ? "button" : "article";
  const attrs = selectable ? `type="button" data-monkey-choice="${monkey.id}"` : "";
  return `<${tag} class="dt-current-monkey${selectable ? " selectable" : ""}" ${attrs}>
    <img src="${monkey.image}" alt="Äffchen ${monkey.id}" width="400" height="400">
    <strong>Äffchen ${monkey.id}</strong>
  </${tag}>`;
}

function loadVariant() {
  state.animationToken += 1;
  state.animation = null;
  state.run = readJson(runKey());
  state.comparison = readJson(COMPARISON_KEY);
  if (state.run?.step === "animating") {
    state.run.step = state.run.pendingResult ? "predicted" : "ready";
    saveRun();
  }
  if (state.comparison?.step === "animating") {
    state.comparison.step = state.comparison.pendingA && state.comparison.pendingB ? "predicted" : "ready";
    saveComparison();
  }
  render();
}

function saveRun() {
  writeJson(runKey(), state.run);
}

function saveComparison() {
  writeJson(COMPARISON_KEY, state.comparison);
}

function currentTestData() {
  return TEST_DATASETS[state.variantId];
}

function renderTabs() {
  elements.tabs.forEach((tab) => {
    const selected = tab.dataset.testVariant === state.variantId;
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
  });
}

function renderGate() {
  const canContinue = Boolean(state.run?.frozenTree || verifiedTree());
  elements.gate.hidden = canContinue;
  elements.own.hidden = !canContinue;
  if (canContinue) return true;
  elements.compare.hidden = true;
  elements.gate.innerHTML = `
    <p class="dt-kicker">Voraussetzung</p>
    <h2>Du brauchst zuerst einen Entscheidungsbaum, der alle Trainingsdaten richtig einordnet.</h2>
    <p>Baue und überprüfe den Baum in der ${VARIANTS[state.variantId].heading.toLowerCase()}.</p>
    <a class="dt-primary-button dt-inline-button" href="aufgabe1.html#${state.variantId}">Zurück zu Aufgabe 1</a>`;
  return false;
}

function renderOwnIntro() {
  const trainingCount = VARIANTS[state.variantId].dataset.length;
  elements.own.innerHTML = `
    <div class="dt-card-heading"><div><span>Teil 2.1</span><h2>Teste deinen eigenen Entscheidungsbaum</h2></div></div>
    <div class="dt-intro-grid">
      <div><p>Dein fertiger Baum ordnet alle <strong>${trainingCount} Trainingsäffchen</strong> richtig ein. Wie verhält er sich bei unbekannten Daten?</p>
      <p>Das tatsächliche Label bleibt zunächst verborgen.</p></div>
      <div class="dt-training-badge"><span>Trainingsdaten</span><strong>${trainingCount} / ${trainingCount}</strong><em>100 %</em></div>
    </div>
    <button class="dt-primary-button" id="start-own-test" type="button">Test starten</button>`;
  document.querySelector("#start-own-test").addEventListener("click", () => {
    const tree = verifiedTree();
    if (!tree) return render();
    state.run = { phase: "testing", frozenTree: tree, results: [], currentIndex: 0, step: "ready", pendingResult: null };
    saveRun();
    render();
  });
}

function renderOwnTesting() {
  const data = currentTestData();
  const monkey = data[state.run.currentIndex];
  const pending = state.run.pendingResult;
  const changedCell = state.run.step === "revealed" ? resultCell(pending) : null;
  const prediction = pending ? `<div class="dt-prediction"><span>Dein Entscheidungsbaum sagt:</span><strong>${label(pending.predicted)}</strong></div>` : "";
  const actual = state.run.step === "revealed" ? `<div class="dt-actual ${pending.correct ? "correct" : "wrong"}">
    <span>Tatsächlich: <strong>${label(pending.actual)}</strong></span>
    <strong>${pending.correct ? "✓ Die Vorhersage war richtig." : "↔ Das war eine Fehlklassifikation."}</strong></div>` : "";
  let action = `<button class="dt-primary-button" id="classify-own" type="button">Durch den Baum schicken</button>`;
  if (state.run.step === "animating") action = `<button class="dt-secondary-button" id="skip-own" type="button">Animation überspringen</button>`;
  if (state.run.step === "predicted") action = `<button class="dt-primary-button" id="reveal-own" type="button">Tatsächliche Klasse aufdecken</button>`;
  if (state.run.step === "revealed") action = `<button class="dt-primary-button" id="next-own" type="button">${state.run.currentIndex === data.length - 1 ? "Auswertung anzeigen" : "Nächstes Testdatum"}</button>`;

  elements.own.innerHTML = `
    <div class="dt-test-toolbar"><p class="dt-progress">Testdatum <strong>${state.run.currentIndex + 1} von ${data.length}</strong></p>
      <button class="dt-danger-button" id="restart-own" type="button">Testphase neu starten</button></div>
    <div class="dt-monkey-stage">${monkeyMarkup(monkey)}${prediction}${actual}</div>
    <div class="dt-model-grid">
      <section><h2>Dein Entscheidungsbaum <span class="dt-lock">🔒 eingefroren</span></h2>
        <div class="dt-readonly-viewport">${treeMarkup(state.run.frozenTree)}</div>
        <details class="dt-test-info"><summary>Warum ist der Baum gesperrt?</summary><p>Testdaten sollen prüfen, wie gut ein bereits fertiges Modell mit unbekannten Daten funktioniert. Deshalb verändern wir den Baum während des Tests nicht mehr.</p></details>
      </section>
      <section>${matrixMarkup(state.run.results, changedCell)}</section>
    </div>
    <div class="dt-test-action">${action}</div>`;

  document.querySelector("#restart-own").addEventListener("click", restartOwn);
  document.querySelector("#classify-own")?.addEventListener("click", classifyOwn);
  document.querySelector("#skip-own")?.addEventListener("click", () => { if (state.animation) state.animation.skip = true; });
  document.querySelector("#reveal-own")?.addEventListener("click", revealOwn);
  document.querySelector("#next-own")?.addEventListener("click", nextOwn);
}

function renderOwnSummary() {
  const training = VARIANTS[state.variantId].dataset.length;
  const ownAccuracy = accuracy(state.run.results) ?? 0;
  const correct = state.run.results.filter((result) => result.correct).length;
  elements.own.innerHTML = `
    <div class="dt-summary-head"><p class="dt-kicker">Teil 2.1 abgeschlossen</p><h2>Dein Testergebnis</h2></div>
    <div class="dt-result-comparison">
      <div><span>Trainingsdaten</span><strong>${training} von ${training} richtig</strong><em>100 %</em></div>
      <div><span>Testdaten</span><strong>${correct} von ${state.run.results.length} richtig</strong><em>${percent(ownAccuracy)}</em></div>
    </div>
    <div class="dt-observation"><h3>Was fällt dir auf?</h3><p>Vergleiche die beiden Werte, bevor du weitergehst.</p></div>
    <div class="dt-summary-actions">
      <button class="dt-secondary-button" id="restart-own" type="button">Testphase neu starten</button>
      <button class="dt-primary-button" id="open-comparison" type="button">Warum kann das passieren?</button>
    </div>`;
  document.querySelector("#restart-own").addEventListener("click", restartOwn);
  document.querySelector("#open-comparison").addEventListener("click", () => {
    if (!state.comparison) state.comparison = { phase: "intro", resultsA: [], resultsB: [], currentIndex: 0, step: "ready" };
    saveComparison();
    render();
    elements.compare.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth" });
  });
}

function restartOwn() {
  if (!confirm("Möchtest du nur den Testfortschritt löschen? Dein Baum aus Aufgabe 1 bleibt erhalten.")) return;
  state.animationToken += 1;
  state.animation = null;
  state.run = null;
  removeStored(runKey());
  render();
}

function leafReached(tree, path) {
  return path.reduce((node, step) => node[step.branch], tree);
}

async function animatePaths(paths, trees, renderFunction) {
  const token = ++state.animationToken;
  state.animation = { nodes: [], branches: [], leaves: [], skip: false };
  const maxLength = Math.max(...paths.map((path) => path.length));
  for (let index = 0; index < maxLength; index += 1) {
    for (const path of paths) {
      const step = path[index];
      if (step && !state.animation.nodes.includes(step.nodeId)) state.animation.nodes.push(step.nodeId);
    }
    renderFunction();
    if (!(await animationPause(token))) return false;
    for (const path of paths) {
      const step = path[index];
      if (step) state.animation.branches.push(`${step.nodeId}:${step.branch}`);
    }
    renderFunction();
    if (!(await animationPause(token))) return false;
  }
  const leaves = paths.map((path, index) => leafReached(trees[index], path).id);
  state.animation.leaf = leaves[0];
  state.animation.leaves = leaves;
  renderFunction();
  await animationPause(token);
  return token === state.animationToken;
}

function animationPause(token) {
  if (reducedMotion || state.animation?.skip) return Promise.resolve(token === state.animationToken);
  return new Promise((resolve) => setTimeout(() => resolve(token === state.animationToken), 360));
}

async function classifyOwn() {
  const monkey = currentTestData()[state.run.currentIndex];
  state.run.pendingResult = createTestResult(monkey, state.run.frozenTree);
  state.run.step = "animating";
  saveRun();
  renderOwnTesting();
  const completed = await animatePaths([state.run.pendingResult.path], [state.run.frozenTree], renderOwnTesting);
  if (!completed) return;
  state.run.step = "predicted";
  saveRun();
  renderOwnTesting();
}

function revealOwn() {
  state.run.results = appendUniqueResult(state.run.results, state.run.pendingResult);
  state.run.step = "revealed";
  saveRun();
  renderOwnTesting();
}

function nextOwn() {
  if (state.run.currentIndex === currentTestData().length - 1) {
    state.run.phase = "summary";
  } else {
    state.run.currentIndex += 1;
    state.run.step = "ready";
    state.run.pendingResult = null;
  }
  state.animation = null;
  saveRun();
  render();
}

function renderOwn() {
  if (!state.run) return renderOwnIntro();
  if (state.run.phase === "summary") return renderOwnSummary();
  return renderOwnTesting();
}

function compareTrainingScore(tree) {
  return evaluateTree(COMPARISON_TRAINING_DATA, tree).correct;
}

function renderComparisonIntro() {
  const scoreA = compareTrainingScore(COMPARISON_TREE_A);
  const scoreB = compareTrainingScore(COMPARISON_TREE_B);
  elements.compare.innerHTML = `
    <p class="dt-kicker">Teil 2.2</p><h2>Zwei Bäume – gleich gut?</h2>
    <p>Hier siehst du zwei Entscheidungsbäume. Beide ordnen <strong>alle Trainingsäffchen richtig</strong> ein.</p>
    <p>Teste beide Bäume mit denselben unbekannten Äffchen.</p>
    <div class="dt-compare-grid">
      ${comparisonTreeCard("A", COMPARISON_TREE_A, scoreA)}
      ${comparisonTreeCard("B", COMPARISON_TREE_B, scoreB)}
    </div>
    <button class="dt-primary-button" id="start-comparison" type="button">Beide Bäume testen</button>`;
  document.querySelector("#start-comparison").addEventListener("click", () => {
    state.comparison = { phase: "testing", resultsA: [], resultsB: [], currentIndex: 0, step: "ready", pendingA: null, pendingB: null };
    saveComparison();
    render();
  });
}

function comparisonTreeCard(name, tree, score) {
  return `<section class="dt-compare-tree"><h3>Baum ${name}</h3><p class="dt-training-score">Trainingsdaten: <strong>${score} / 12 – ${percent(score / 12)}</strong></p>
    <div class="dt-readonly-viewport compact">${treeMarkup(tree)}</div></section>`;
}

function pathText(result) {
  return result.path.map((step) => `${FEATURE_DEFINITIONS[step.feature].label} → ${step.value ? "Ja" : "Nein"}`).join(" → ");
}

function renderComparisonTesting() {
  const monkey = EASY_TEST_DATA[state.comparison.currentIndex];
  const predicted = state.comparison.pendingA ? `<div class="dt-dual-prediction">
    <p><strong>Baum A:</strong> ${pathText(state.comparison.pendingA)} → <strong>${label(state.comparison.pendingA.predicted)}</strong></p>
    <p><strong>Baum B:</strong> ${pathText(state.comparison.pendingB)} → <strong>${label(state.comparison.pendingB.predicted)}</strong></p></div>` : "";
  const revealed = state.comparison.step === "revealed" ? `<div class="dt-actual"><span>Tatsächlich:</span> <strong>${label(monkey.actual)}</strong></div>` : "";
  let action = `<button class="dt-primary-button" id="classify-both" type="button">Beide testen</button>`;
  if (state.comparison.step === "animating") action = `<button class="dt-secondary-button" id="skip-both" type="button">Animation überspringen</button>`;
  if (state.comparison.step === "predicted") action = `<button class="dt-primary-button" id="reveal-both" type="button">Tatsächliche Klasse aufdecken</button>`;
  if (state.comparison.step === "revealed") action = `<button class="dt-primary-button" id="next-both" type="button">${state.comparison.currentIndex === EASY_TEST_DATA.length - 1 ? "Ergebnisse vergleichen" : "Nächstes Testdatum"}</button>`;
  const changedA = state.comparison.step === "revealed" ? resultCell(state.comparison.pendingA) : null;
  const changedB = state.comparison.step === "revealed" ? resultCell(state.comparison.pendingB) : null;

  elements.compare.innerHTML = `
    <div class="dt-test-toolbar"><p class="dt-progress">Vergleich <strong>${state.comparison.currentIndex + 1} von ${EASY_TEST_DATA.length}</strong></p>
      <button class="dt-danger-button" id="restart-comparison" type="button">Vergleich neu starten</button></div>
    <div class="dt-monkey-stage">${monkeyMarkup(monkey)}${predicted}${revealed}</div>
    <div class="dt-compare-grid">
      <section class="dt-compare-tree"><h2>Baum A</h2><p class="dt-training-score">Training: <strong>12 / 12 – 100 %</strong></p><div class="dt-readonly-viewport compact">${treeMarkup(COMPARISON_TREE_A)}</div>${matrixMarkup(state.comparison.resultsA, changedA, "A")}</section>
      <section class="dt-compare-tree"><h2>Baum B</h2><p class="dt-training-score">Training: <strong>12 / 12 – 100 %</strong></p><div class="dt-readonly-viewport compact">${treeMarkup(COMPARISON_TREE_B)}</div>${matrixMarkup(state.comparison.resultsB, changedB, "B")}</section>
    </div><div class="dt-test-action">${action}</div>`;
  document.querySelector("#restart-comparison").addEventListener("click", restartComparison);
  document.querySelector("#classify-both")?.addEventListener("click", classifyBoth);
  document.querySelector("#skip-both")?.addEventListener("click", () => { if (state.animation) state.animation.skip = true; });
  document.querySelector("#reveal-both")?.addEventListener("click", revealBoth);
  document.querySelector("#next-both")?.addEventListener("click", nextBoth);
}

async function classifyBoth() {
  const monkey = EASY_TEST_DATA[state.comparison.currentIndex];
  state.comparison.pendingA = createTestResult(monkey, COMPARISON_TREE_A);
  state.comparison.pendingB = createTestResult(monkey, COMPARISON_TREE_B);
  state.comparison.step = "animating";
  saveComparison();
  renderComparisonTesting();
  const completed = await animatePaths(
    [state.comparison.pendingA.path, state.comparison.pendingB.path],
    [COMPARISON_TREE_A, COMPARISON_TREE_B],
    renderComparisonTesting,
  );
  if (!completed) return;
  state.comparison.step = "predicted";
  saveComparison();
  renderComparisonTesting();
}

function revealBoth() {
  state.comparison.resultsA = appendUniqueResult(state.comparison.resultsA, state.comparison.pendingA);
  state.comparison.resultsB = appendUniqueResult(state.comparison.resultsB, state.comparison.pendingB);
  state.comparison.step = "revealed";
  saveComparison();
  renderComparisonTesting();
}

function nextBoth() {
  if (state.comparison.currentIndex === EASY_TEST_DATA.length - 1) {
    state.comparison.phase = "questions";
  } else {
    state.comparison.currentIndex += 1;
    state.comparison.step = "ready";
    state.comparison.pendingA = null;
    state.comparison.pendingB = null;
  }
  state.animation = null;
  saveComparison();
  render();
}

function restartComparison() {
  if (!confirm("Möchtest du den Vergleich wirklich neu starten?")) return;
  state.animationToken += 1;
  state.animation = null;
  state.comparison = { phase: "intro", resultsA: [], resultsB: [], currentIndex: 0, step: "ready" };
  saveComparison();
  render();
}

function renderQuestions() {
  const correctA = state.comparison.resultsA.filter((result) => result.correct).length;
  const correctB = state.comparison.resultsB.filter((result) => result.correct).length;
  elements.compare.innerHTML = `
    <p class="dt-kicker">Entdeckende Auswertung</p><h2>Vergleiche die beiden Bäume</h2>
    <div class="dt-result-comparison"><div><span>Baum A · Testdaten</span><strong>${correctA} von 8 richtig</strong><em>${percent(correctA / 8)}</em></div>
      <div><span>Baum B · Testdaten</span><strong>${correctB} von 8 richtig</strong><em>${percent(correctB / 8)}</em></div></div>
    <form id="discovery-form" class="dt-discovery-form">
      <fieldset><legend>1. Welcher Baum funktioniert bei den Testdaten besser?</legend>
        ${radio("better", "a", "Baum A")}${radio("better", "b", "Baum B")}${radio("better", "same", "Beide gleich gut")}</fieldset>
      <fieldset><legend>2. Was wurde an den Bäumen verändert?</legend>
        ${radio("change", "training", "Die Trainingsdaten")}${radio("change", "features", "Die verwendeten Merkmale")}${radio("change", "order", "Die Reihenfolge der ersten beiden Merkmale")}${radio("change", "classes", "Die Klassen")}</fieldset>
      <fieldset><legend>3. Bei welchem Testäffchen liefern die Bäume unterschiedliche Vorhersagen?</legend>
        <div class="dt-choice-monkeys">${EASY_TEST_DATA.map((monkey) => monkeyMarkup(monkey, true)).join("")}</div>
        <input type="hidden" name="monkey" id="selected-monkey"></fieldset>
      <fieldset><legend>4. Welche zwei Merkmale treffen gleichzeitig auf Äffchen 03 zu?</legend>
        <div class="dt-feature-choices">
          ${checkbox("xEyes", "X-Augen")}${checkbox("teethVisible", "Zähne sichtbar")}${checkbox("tongueOut", "Zunge raus")}
          ${checkbox("accessory", "Accessoire")}${checkbox("eyeOpen", "mindestens ein Auge offen")}${checkbox("openMouth", "offener Mund")}
        </div></fieldset>
      <p id="discovery-feedback" class="dt-form-feedback" role="status"></p>
      <button class="dt-primary-button" type="submit">Antworten prüfen</button>
    </form>`;
  document.querySelectorAll("[data-monkey-choice]").forEach((button) => button.addEventListener("click", () => {
    document.querySelectorAll("[data-monkey-choice]").forEach((choice) => choice.classList.remove("is-selected"));
    button.classList.add("is-selected");
    document.querySelector("#selected-monkey").value = button.dataset.monkeyChoice;
  }));
  document.querySelector("#discovery-form").addEventListener("submit", checkDiscovery);
}

function radio(name, value, text) {
  return `<label><input type="radio" name="${name}" value="${value}" required> ${text}</label>`;
}

function checkbox(value, text) {
  return `<label><input type="checkbox" name="features" value="${value}"> ${text}</label>`;
}

function checkDiscovery(event) {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const selectedFeatures = data.getAll("features").sort();
  const correct = data.get("better") === "a"
    && data.get("change") === "order"
    && data.get("monkey") === "03"
    && JSON.stringify(selectedFeatures) === JSON.stringify(["teethVisible", "xEyes"]);
  const feedback = document.querySelector("#discovery-feedback");
  if (!correct) {
    feedback.textContent = "Noch nicht ganz. Vergleiche Ergebnisse, erste Knoten und Äffchenbilder noch einmal.";
    feedback.className = "dt-form-feedback wrong";
    return;
  }
  state.comparison.phase = "paths";
  saveComparison();
  render();
}

function renderPathsAndLesson() {
  elements.compare.innerHTML = `
    <p class="dt-kicker">Ursache untersuchen</p><h2>Die Pfade von Äffchen 03</h2>
    <div class="dt-focus-monkey">${monkeyMarkup(EASY_TEST_DATA[0])}</div>
    <div class="dt-path-comparison">
      <div><h3>Baum A</h3><p><strong>X-Augen?</strong><br>↓ Ja<br><span class="dt-outcome bites">Beißt</span></p></div>
      <div><h3>Baum B</h3><p><strong>Zähne sichtbar?</strong><br>↓ Ja<br><span class="dt-outcome safe">Beißt nicht</span></p></div>
    </div>
    <div class="dt-explanation"><p>In einem Entscheidungsbaum werden nicht immer alle Merkmale überprüft. Sobald ein Blatt erreicht wird, steht die Vorhersage fest.</p>
      <p><strong>Warum können die beiden Bäume deshalb für dasselbe unbekannte Äffchen zu unterschiedlichen Ergebnissen kommen?</strong></p></div>
    <div class="dt-remember"><h2>Merke</h2>
      <p><strong>Trainingsdaten</strong> werden verwendet, um ein Modell zu erstellen. <strong>Testdaten</strong> prüfen anschließend, wie gut das fertige Modell mit unbekannten Daten funktioniert.</p>
      <p>Ein Entscheidungsbaum kann die Trainingsdaten zu <strong>100 % richtig</strong> klassifizieren und bei neuen Daten trotzdem Fehler machen.</p>
      <p>Verschiedene Entscheidungsbäume können auf denselben Trainingsdaten gleich gut sein und sich bei unbekannten Daten trotzdem unterschiedlich verhalten.</p>
      <p class="dt-fine-print">Die Reihenfolge von Merkmalen führt nicht automatisch immer zu anderen Ergebnissen. Sie kann aber entscheidend sein, wenn unterschiedliche Wege früher zu einem Blatt führen und eine Merkmalskombination in den Trainingsdaten noch nicht vorkam.</p>
    </div>
    <div class="dt-definition"><h3>Was sind Testdaten?</h3><p><strong>Testdaten sind gelabelte Daten, die nicht zum Erstellen des Modells verwendet wurden. Sie dienen dazu, die Qualität des fertigen Modells zu beurteilen.</strong></p>
      <ul><li>Das tatsächliche Label ist für die Auswertung bekannt.</li><li>Das Modell bekommt dieses Label während der Vorhersage nicht.</li><li>Die Testdaten werden nicht zum Optimieren desselben Testlaufs verwendet.</li></ul></div>
    <button class="dt-primary-button" id="finish-task" type="button">Aufgabe abgeschlossen</button>`;
  document.querySelector("#finish-task").addEventListener("click", () => {
    state.comparison.phase = "done";
    saveComparison();
    render();
  });
}

function renderDone() {
  elements.compare.innerHTML = `<div class="dt-complete"><span aria-hidden="true">✓</span><div><p class="dt-kicker">Aufgabe abgeschlossen</p><h2>Du hast Modelle mit unbekannten Testdaten bewertet.</h2><p>Als Nächstes könnte untersucht werden, wie ein Entscheidungsbaum automatisch aus Daten entsteht.</p></div></div>`;
}

function renderComparison() {
  const available = state.run?.phase === "summary" && state.comparison;
  elements.compare.hidden = !available;
  if (!available) return;
  if (state.comparison.phase === "intro") return renderComparisonIntro();
  if (state.comparison.phase === "testing") return renderComparisonTesting();
  if (state.comparison.phase === "questions") return renderQuestions();
  if (state.comparison.phase === "paths") return renderPathsAndLesson();
  return renderDone();
}

function render() {
  renderTabs();
  if (!renderGate()) return;
  renderOwn();
  renderComparison();
}

elements.tabs.forEach((tab) => tab.addEventListener("click", () => {
  state.variantId = tab.dataset.testVariant;
  history.replaceState(null, "", `#${state.variantId}`);
  loadVariant();
}));

loadVariant();
