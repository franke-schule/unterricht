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
import {
  TEST_RUN_STORAGE_PREFIX,
  TREE_STORAGE_PREFIX,
  VERIFIED_STORAGE_PREFIX,
  comparisonStorageKey,
  variantStorageKey,
} from "../logic/storage-keys.mjs";
import { renderTreeEdges } from "./tree-edges.mjs?v=20260820d";

const COMPARISON_KEY = comparisonStorageKey();
const SOLUTION_CODE = "M6BW-DJPR";
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

const elements = {
  tabs: [...document.querySelectorAll("[data-test-variant]")],
  gate: document.querySelector("#task2-gate"),
  own: document.querySelector("#task2-own"),
  compare: document.querySelector("#task2-compare"),
  title: document.querySelector("#task2-title"),
  taskNumber: document.querySelector("#task2-number"),
  lead: document.querySelector("#task2-lead"),
  description: document.querySelector("#task2-description"),
  comparisonLink: document.querySelector("#direct-comparison-link"),
  solutionForm: document.querySelector("#solution-code-form"),
  solutionLink: document.querySelector("#solution-download-link"),
  solutionMessage: document.querySelector("#solution-code-message"),
};

const state = {
  mode: location.hash === "#vergleich" ? "comparison" : "own",
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

function normalizeSolutionCode(value) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function unlockSolution(event) {
  event.preventDefault();
  const enteredCode = normalizeSolutionCode(elements.solutionForm.elements["solution-code"].value);
  const isCorrect = enteredCode === normalizeSolutionCode(SOLUTION_CODE);

  elements.solutionLink.hidden = !isCorrect;
  elements.solutionMessage.className = `solution-code-message${isCorrect ? "" : " error"}`;
  elements.solutionMessage.textContent = isCorrect
    ? "Code korrekt. Das Sicherungsblatt ist freigeschaltet."
    : "Der eingegebene Code ist nicht gültig.";
}

function runKey() {
  return variantStorageKey(TEST_RUN_STORAGE_PREFIX, state.variantId);
}

function verifiedTree() {
  const verified = readJson(variantStorageKey(VERIFIED_STORAGE_PREFIX, state.variantId));
  const storedTree = readJson(variantStorageKey(TREE_STORAGE_PREFIX, state.variantId));
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

function edgeAttributes(nodeId, parentId, activeEdge) {
  return ` data-tree-node-key="${escapeHtml(nodeId)}"${parentId ? ` data-tree-parent-key="${escapeHtml(parentId)}"` : ""}${activeEdge ? " data-tree-edge-active=\"true\"" : ""}`;
}

function treeMarkup(node, parentId = "", activeEdge = false) {
  if (node.type === "leaf") {
    const typeClass = node.prediction === CLASSIFICATIONS.BITES ? "bites" : "safe";
    return `<div class="dt-readonly-node leaf ${typeClass}${activeClass(node.id, "leaf")}" data-node-id="${node.id}"${edgeAttributes(node.id, parentId, activeEdge)}>
      <span class="dt-node-symbol" aria-hidden="true">${node.prediction === CLASSIFICATIONS.BITES ? "!" : "✓"}</span>
      <strong>${label(node.prediction)}</strong></div>`;
  }
  const branch = (key, branchLabel) => {
    const branchId = `${node.id}:${key}`;
    const branchIsActive = Boolean(state.animation?.branches?.includes(branchId));
    return `<section class="dt-readonly-branch${activeClass(branchId, "branch")}" data-branch-id="${branchId}">
      <span class="dt-readonly-branch-label">${branchLabel}</span>${treeMarkup(node[key], node.id, branchIsActive)}</section>`;
  };
  return `<div class="dt-readonly-subtree">
    <div class="dt-readonly-node feature${activeClass(node.id, "node")}" data-node-id="${node.id}"${edgeAttributes(node.id, parentId, activeEdge)}>
      <strong>${escapeHtml(FEATURE_DEFINITIONS[node.feature]?.label ?? node.feature)}</strong></div>
    <div class="dt-readonly-branches">${branch("yes", "Ja")}${branch("no", "Nein")}</div>
  </div>`;
}

let treeFitFrame = 0;

function scheduleTreeFit() {
  cancelAnimationFrame(treeFitFrame);
  treeFitFrame = requestAnimationFrame(() => {
    document.querySelectorAll(".dt-readonly-viewport").forEach((viewport) => {
      const tree = viewport.querySelector(":scope > .dt-readonly-subtree");
      if (!tree || viewport.clientWidth === 0) return;

      tree.style.zoom = "";
      tree.style.transform = "none";
      tree.style.transformOrigin = "top center";
      renderTreeEdges(tree);
      const naturalWidth = tree.scrollWidth;
      const naturalHeight = tree.scrollHeight;
      const inset = viewport.classList.contains("compact") ? 12 : 16;
      const maximumHeight = viewport.classList.contains("compact") ? 220 : 270;
      const scale = Math.min(
        1,
        (viewport.clientWidth - inset) / naturalWidth,
        maximumHeight / naturalHeight,
      );

      tree.style.transform = `scale(${Math.max(0.1, scale)})`;
      viewport.style.height = `${Math.ceil(naturalHeight * scale + inset)}px`;
      viewport.dataset.treeScale = scale.toFixed(2);
      renderTreeEdges(tree);
    });
  });
}

function monkeyMarkup(monkey) {
  return `<article class="dt-current-monkey">
    <img src="${monkey.image}" alt="Äffchen ${monkey.id}" width="400" height="400">
    <strong>Äffchen ${monkey.id}</strong>
  </article>`;
}

function loadVariant() {
  state.animationToken += 1;
  state.animation = null;
  state.run = readJson(runKey());
  state.comparison = readJson(COMPARISON_KEY);
  if (state.mode === "comparison" && !state.comparison) {
    state.comparison = comparisonInitialState();
  }
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
    const selected = state.mode === "own" && tab.dataset.testVariant === state.variantId;
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
  });
  elements.comparisonLink.setAttribute("aria-current", state.mode === "comparison" ? "page" : "false");
}

function renderHeader() {
  if (state.mode === "comparison") {
    elements.title.textContent = "Zwei Bäume im Vergleich";
    elements.taskNumber.textContent = "Aufgabe 2.2";
    elements.lead.textContent = "Zwei Entscheidungsbäume können im Training gleich gut sein und sich bei unbekannten Daten unterscheiden.";
    elements.description.textContent = "Teste beide vorgegebenen Bäume und untersuche anschließend Äffchen 03.";
    return;
  }
  elements.title.textContent = "Wie gut ist dein Entscheidungsbaum?";
  elements.taskNumber.textContent = "Aufgabe 2.1";
  elements.lead.textContent = "Dein Entscheidungsbaum kennt bisher nur die Trainingsdaten.";
  elements.description.textContent = "Jetzt bekommt er Äffchen zu sehen, die er noch nicht kennt.";
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
    <div class="dt-monkey-stage">${monkeyMarkup(monkey)}${prediction}${actual}<div class="dt-inline-test-action">${action}</div></div>
    <div class="dt-model-grid">
      <section><h2>Dein Entscheidungsbaum <span class="dt-lock">🔒 eingefroren</span></h2>
        <div class="dt-readonly-viewport">${treeMarkup(state.run.frozenTree)}</div>
        <details class="dt-test-info"><summary>Warum ist der Baum gesperrt?</summary><p>Testdaten sollen prüfen, wie gut ein bereits fertiges Modell mit unbekannten Daten funktioniert. Deshalb verändern wir den Baum während des Tests nicht mehr.</p></details>
      </section>
      <section>${matrixMarkup(state.run.results, changedCell)}</section>
    </div>`;

  document.querySelector("#restart-own").addEventListener("click", restartOwn);
  document.querySelector("#classify-own")?.addEventListener("click", classifyOwn);
  document.querySelector("#skip-own")?.addEventListener("click", () => { if (state.animation) state.animation.skip = true; });
  document.querySelector("#reveal-own")?.addEventListener("click", revealOwn);
  document.querySelector("#next-own")?.addEventListener("click", nextOwn);
  scheduleTreeFit();
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
    state.mode = "comparison";
    history.replaceState(null, "", "#vergleich");
    if (!state.comparison) state.comparison = comparisonInitialState();
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

function comparisonInitialState() {
  return { phase: "intro", resultsA: [], resultsB: [], currentIndex: 0, step: "ready", pendingA: null, pendingB: null };
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
    state.comparison = { ...comparisonInitialState(), phase: "testing" };
    saveComparison();
    render();
  });
  scheduleTreeFit();
}

function comparisonTreeCard(name, tree, score) {
  const total = COMPARISON_TRAINING_DATA.length;
  return `<section class="dt-compare-tree"><h3>Baum ${name}</h3><p class="dt-training-score">Trainingsdaten: <strong>${score} / ${total} – ${percent(score / total)}</strong></p>
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
  const trainingTotal = COMPARISON_TRAINING_DATA.length;
  const trainingA = compareTrainingScore(COMPARISON_TREE_A);
  const trainingB = compareTrainingScore(COMPARISON_TREE_B);

  elements.compare.innerHTML = `
    <div class="dt-test-toolbar"><p class="dt-progress">Vergleich <strong>${state.comparison.currentIndex + 1} von ${EASY_TEST_DATA.length}</strong></p>
      <button class="dt-danger-button" id="restart-comparison" type="button">Vergleich neu starten</button></div>
    <div class="dt-monkey-stage">${monkeyMarkup(monkey)}${predicted}${revealed}<div class="dt-inline-test-action">${action}</div></div>
    <div class="dt-compare-grid">
      <section class="dt-compare-tree"><h2>Baum A</h2><p class="dt-training-score">Training: <strong>${trainingA} / ${trainingTotal} – ${percent(trainingA / trainingTotal)}</strong></p><div class="dt-readonly-viewport compact">${treeMarkup(COMPARISON_TREE_A)}</div>${matrixMarkup(state.comparison.resultsA, changedA, "A")}</section>
      <section class="dt-compare-tree"><h2>Baum B</h2><p class="dt-training-score">Training: <strong>${trainingB} / ${trainingTotal} – ${percent(trainingB / trainingTotal)}</strong></p><div class="dt-readonly-viewport compact">${treeMarkup(COMPARISON_TREE_B)}</div>${matrixMarkup(state.comparison.resultsB, changedB, "B")}</section>
    </div>`;
  document.querySelector("#restart-comparison").addEventListener("click", restartComparison);
  document.querySelector("#classify-both")?.addEventListener("click", classifyBoth);
  document.querySelector("#skip-both")?.addEventListener("click", () => { if (state.animation) state.animation.skip = true; });
  document.querySelector("#reveal-both")?.addEventListener("click", revealBoth);
  document.querySelector("#next-both")?.addEventListener("click", nextBoth);
  scheduleTreeFit();
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
    state.comparison.phase = "results";
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
  state.comparison = comparisonInitialState();
  saveComparison();
  render();
}

function comparisonScores() {
  const trainingTotal = COMPARISON_TRAINING_DATA.length;
  const testTotal = EASY_TEST_DATA.length;
  const testA = state.comparison.resultsA.filter((result) => result.correct).length;
  const testB = state.comparison.resultsB.filter((result) => result.correct).length;
  return {
    trainingTotal,
    trainingA: compareTrainingScore(COMPARISON_TREE_A),
    trainingB: compareTrainingScore(COMPARISON_TREE_B),
    testTotal,
    testA,
    testB,
  };
}

function scoreCard(title, correct, total) {
  return `<div><span>${title}</span><strong>${correct} von ${total} richtig</strong><em>${percent(correct / total)}</em></div>`;
}

function renderComparisonResults() {
  state.animation = null;
  const scores = comparisonScores();
  elements.compare.innerHTML = `
    <p class="dt-kicker">Testergebnis</p><h2>Gleich gut im Training – unterschiedlich im Test</h2>
    <h3>Trainingsdaten</h3>
    <div class="dt-result-comparison">${scoreCard("Baum A", scores.trainingA, scores.trainingTotal)}${scoreCard("Baum B", scores.trainingB, scores.trainingTotal)}</div>
    <h3>Testdaten</h3>
    <div class="dt-result-comparison">${scoreCard("Baum A", scores.testA, scores.testTotal)}${scoreCard("Baum B", scores.testB, scores.testTotal)}</div>
    <div class="dt-observation"><h3>Was verursacht den Unterschied?</h3><p>Untersuche jetzt gezielt ein Äffchen, bei dem die Reihenfolge der Entscheidungen wichtig wird.</p></div>
    <button class="dt-primary-button" id="inspect-monkey03" type="button">Äffchen 03 untersuchen</button>`;
  document.querySelector("#inspect-monkey03").addEventListener("click", () => {
    state.comparison.phase = "monkey03";
    saveComparison();
    render();
  });
}

function monkey03() {
  return EASY_TEST_DATA.find((monkey) => monkey.id === "03");
}

function monkey03Results() {
  const monkey = monkey03();
  return {
    resultA: createTestResult(monkey, COMPARISON_TREE_A),
    resultB: createTestResult(monkey, COMPARISON_TREE_B),
  };
}

function analysisTreeCard(name, tree) {
  return `<section class="dt-compare-tree dt-analysis-tree" data-analysis-tree="${name.toLowerCase()}">
    <h3>Baum ${name}</h3><div class="dt-readonly-viewport">${treeMarkup(tree)}</div></section>`;
}

function radio(name, value, text) {
  return `<label><input type="radio" name="${name}" value="${value}" required> ${text}</label>`;
}

function renderMonkey03Question() {
  state.animation = null;
  elements.compare.innerHTML = `
    <p class="dt-kicker">Ergebnisse selbst bestimmen</p><h2>Schau dir Äffchen 03 genauer an</h2>
    <p class="dt-analysis-prompt"><strong>Zu welchem Ergebnis gelangt Baum A und zu welchem Ergebnis gelangt Baum B für dieses Äffchen?</strong><br>Schau dir sowohl das Äffchen als auch die Reihenfolge der Entscheidungen genau an.</p>
    <div class="dt-focus-monkey large">${monkeyMarkup(monkey03())}</div>
    <div class="dt-compare-grid dt-analysis-grid">${analysisTreeCard("A", COMPARISON_TREE_A)}${analysisTreeCard("B", COMPARISON_TREE_B)}</div>
    <form id="monkey03-form" class="dt-discovery-form dt-tree-answer-form">
      <fieldset><legend>Baum A sagt:</legend>${radio("prediction-a", CLASSIFICATIONS.BITES, "Beißt")}${radio("prediction-a", CLASSIFICATIONS.DOES_NOT_BITE, "Beißt nicht")}</fieldset>
      <fieldset><legend>Baum B sagt:</legend>${radio("prediction-b", CLASSIFICATIONS.BITES, "Beißt")}${radio("prediction-b", CLASSIFICATIONS.DOES_NOT_BITE, "Beißt nicht")}</fieldset>
      <p id="monkey03-feedback" class="dt-form-feedback" role="status"></p>
      <button class="dt-primary-button" type="submit">Antwort prüfen</button>
    </form>`;
  document.querySelector("#monkey03-form").addEventListener("submit", checkMonkey03Predictions);
  scheduleTreeFit();
}

function checkMonkey03Predictions(event) {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const { resultA, resultB } = monkey03Results();
  const correct = data.get("prediction-a") === resultA.predicted && data.get("prediction-b") === resultB.predicted;
  const feedback = document.querySelector("#monkey03-feedback");
  if (!correct) {
    feedback.textContent = "Noch nicht ganz. Beginne bei der Wurzel jedes Baums und stoppe, sobald du ein Blatt erreichst.";
    feedback.className = "dt-form-feedback wrong";
    return;
  }
  state.comparison.phase = "path-analysis";
  saveComparison();
  render();
}

function activateMonkey03Paths() {
  const { resultA, resultB } = monkey03Results();
  const results = [resultA, resultB];
  const trees = [COMPARISON_TREE_A, COMPARISON_TREE_B];
  state.animation = { nodes: [], branches: [], leaves: [], skip: true };
  results.forEach((result, index) => {
    result.path.forEach((step) => {
      state.animation.nodes.push(step.nodeId);
      state.animation.branches.push(`${step.nodeId}:${step.branch}`);
    });
    state.animation.leaves.push(leafReached(trees[index], result.path).id);
  });
}

function renderPathAnalysis() {
  activateMonkey03Paths();
  elements.compare.innerHTML = `
    <p class="dt-kicker">Ursache untersuchen</p><h2>Die Pfade von Äffchen 03</h2>
    <div class="dt-focus-monkey large">${monkeyMarkup(monkey03())}</div>
    <div class="dt-compare-grid dt-analysis-grid dt-highlighted-trees">${analysisTreeCard("A", COMPARISON_TREE_A)}${analysisTreeCard("B", COMPARISON_TREE_B)}</div>
    <form id="cause-form" class="dt-discovery-form">
      <fieldset><legend>Warum gelangen die beiden Entscheidungsbäume beim selben Äffchen zu unterschiedlichen Ergebnissen?</legend>
        ${radio("cause", "training", "Weil die beiden Bäume unterschiedliche Trainingsdaten verwenden.")}
        ${radio("cause", "features", "Weil die beiden Bäume unterschiedliche Merkmale verwenden.")}
        ${radio("cause", "early-leaf", "Weil die Merkmale in einer anderen Reihenfolge geprüft werden und bereits vorher ein Blatt erreicht wird.")}
        ${radio("cause", "unknown-test", "Weil Baum B keine Testdaten kennt.")}
      </fieldset>
      <p id="cause-feedback" class="dt-form-feedback" role="status"></p>
      <button class="dt-primary-button" type="submit">Begründung prüfen</button>
    </form>`;
  document.querySelector("#cause-form").addEventListener("submit", checkCause);
  scheduleTreeFit();
}

function checkCause(event) {
  event.preventDefault();
  const data = new FormData(event.currentTarget);
  const feedback = document.querySelector("#cause-feedback");
  if (data.get("cause") !== "early-leaf") {
    feedback.textContent = "Noch nicht ganz. Achte darauf, welches Merkmal zuerst geprüft und wann bereits ein Blatt erreicht wird.";
    feedback.className = "dt-form-feedback wrong";
    return;
  }
  state.comparison.phase = "summary";
  state.animation = null;
  saveComparison();
  render();
}

function renderComparisonSummary() {
  state.animation = null;
  const scores = comparisonScores();
  elements.compare.innerHTML = `
    <p class="dt-kicker">Erkenntnis sichern</p><h2>Warum unterscheiden sich die Vorhersagen?</h2>
    <div class="dt-focus-monkey large">${monkeyMarkup(monkey03())}</div>
    <div class="dt-monkey-features"><h3>Äffchen 03</h3><p><strong>X-Augen:</strong> Ja</p><p><strong>Zähne sichtbar:</strong> Ja</p></div>
    <div class="dt-path-comparison">
      <div><h3>Baum A</h3><ol><li>X-Augen? → Ja</li><li>Blatt „Beißt“ erreicht</li><li>Zähne werden nicht mehr geprüft</li></ol></div>
      <div><h3>Baum B</h3><ol><li>Zähne sichtbar? → Ja</li><li>Blatt „Beißt nicht“ erreicht</li><li>X-Augen werden nicht mehr geprüft</li></ol></div>
    </div>
    <h3>Trainingsdaten</h3><div class="dt-result-comparison">${scoreCard("Baum A", scores.trainingA, scores.trainingTotal)}${scoreCard("Baum B", scores.trainingB, scores.trainingTotal)}</div>
    <h3>Testdaten</h3><div class="dt-result-comparison">${scoreCard("Baum A", scores.testA, scores.testTotal)}${scoreCard("Baum B", scores.testB, scores.testTotal)}</div>
    <div class="dt-remember"><h2>Merke</h2>
      <p>Zwei Entscheidungsbäume können dieselben Trainingsdaten vollständig richtig klassifizieren und bei unbekannten Testdaten trotzdem unterschiedlich gut funktionieren.</p>
      <p>Die Trainingsdaten müssen nicht jede mögliche Merkmalskombination enthalten. Bei Äffchen 03 treten <strong>X-Augen und sichtbare Zähne gleichzeitig</strong> auf; diese Kombination kam in den Trainingsdaten nicht vor.</p>
      <p><strong>Welches Merkmal zuerst geprüft wird, kann wichtig sein. Sobald ein Blatt erreicht ist, werden die weiteren Merkmale nicht mehr betrachtet.</strong></p>
    </div>
    <div class="dt-definition"><h3>Was sind Testdaten?</h3><p><strong>Testdaten sind gelabelte Daten, die nicht zum Erstellen des Modells verwendet wurden. Sie dienen dazu, die Qualität des fertigen Modells zu beurteilen.</strong></p></div>
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
  const available = state.mode === "comparison" && state.comparison;
  elements.compare.hidden = !available;
  if (!available) return;
  if (state.comparison.phase === "intro") return renderComparisonIntro();
  if (state.comparison.phase === "testing") return renderComparisonTesting();
  if (state.comparison.phase === "results") return renderComparisonResults();
  if (state.comparison.phase === "monkey03") return renderMonkey03Question();
  if (state.comparison.phase === "path-analysis") return renderPathAnalysis();
  if (state.comparison.phase === "summary") return renderComparisonSummary();
  return renderDone();
}

function render() {
  renderHeader();
  renderTabs();
  if (state.mode === "comparison") {
    elements.gate.hidden = true;
    elements.own.hidden = true;
    renderComparison();
    return;
  }
  elements.compare.hidden = true;
  if (!renderGate()) return;
  renderOwn();
}

elements.tabs.forEach((tab) => tab.addEventListener("click", () => {
  state.mode = "own";
  state.variantId = tab.dataset.testVariant;
  history.replaceState(null, "", `#${state.variantId}`);
  loadVariant();
}));

elements.solutionForm.addEventListener("submit", unlockSolution);

window.addEventListener("resize", scheduleTreeFit);
window.addEventListener("hashchange", () => {
  state.mode = location.hash === "#vergleich" ? "comparison" : "own";
  state.variantId = location.hash === "#advanced" ? "advanced" : "easy";
  loadVariant();
});

loadVariant();
