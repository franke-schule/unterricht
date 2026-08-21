import { CLASSIFICATIONS } from "../data/monkeys.mjs";
import { ENTROPY_QUIZ, expectedTableValues } from "../logic/fish-learning.mjs";
import { FISH_DATASET, FISH_FEATURES, FISH_LABELS } from "../data/fish.mjs";
import {
  createFeatureNode,
  createLeafNode,
  evaluateTree,
  getNodeAtPath,
  moveSubtree,
  setNodeAtPath,
} from "../logic/decision-tree.mjs";
import { evaluateSemanticAnswer } from "./semantic-answer.mjs";
import { renderTreeEdges } from "./tree-edges.mjs?v=20260820d";

const STORAGE_KEY = "informatik11-fish-tree-task3-v1";
const SCRIPT_SERVER_URL = "https://script.google.com/macros/s/AKfycby8RWL6uYrKZyoJ6m2GRpWyRmXjwsdskyCiqzKpRhIK5-wrDl-9lWWk8CiAGaVMoy0x/exec";
const SEMANTIC_TASK_ID = "11-3a-f";
const PALETTE_MIME = "application/x-fish-tree-palette";
const TREE_MIME = "application/x-fish-tree-node";
const HELP_STEPS = [
  "Zähle zunächst, wie viele friedliche und feindselige Fische den jeweiligen Attributwert besitzen.",
  "Der Baum wählt für eine Teilgruppe das häufigere Label. Die kleinere Gruppe würde falsch klassifiziert; ihre Anzahl ist die Fehlerzahl.",
  "Addiere die Fehler beider Teilgruppen. Dann gilt: Informationsgewinn = Fehler vorher − Fehler nachher.",
  "Konkreter Start: Bei blauer Schuppenfarbe gibt es 3 friedliche und 2 feindselige Fische. Das Mehrheitslabel wäre friedlich; dadurch entstehen 2 Fehler.",
];

const subsets = {
  all: FISH_DATASET,
  blue: FISH_DATASET.filter((entry) => entry.features.scalesBlue),
  orange: FISH_DATASET.filter((entry) => !entry.features.scalesBlue),
};
subsets.bluePoints = subsets.blue.filter((entry) => !entry.features.patternNone);

const tableGroups = Object.freeze({
  all: { container: "tables-all", features: ["scalesBlue", "patternNone", "bellyBlack", "finsYellow"] },
  blue: { container: "tables-blue", features: ["patternNone", "bellyBlack", "finsYellow"] },
  orange: { container: "tables-orange", features: ["patternNone", "bellyBlack", "finsYellow"] },
  bluePoints: { container: "tables-blue-points", features: ["bellyBlack", "finsYellow"] },
});

const blankState = () => ({
  introComplete: false,
  answers: {},
  hints: {},
  completedTables: {},
  rootComplete: false,
  tree: null,
  treeComplete: false,
  algorithm: "",
  algorithmComplete: false,
  quizAnswers: {},
  quizComplete: false,
});

function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return parsed && typeof parsed === "object" ? { ...blankState(), ...parsed } : blankState();
  } catch {
    return blankState();
  }
}

const state = loadState();
const treeInteraction = { selectedTool: null, pendingTargetPath: null, movingSourcePath: null };
let introTimers = [];

function saveState(message = "Bearbeitungsstand gespeichert.") {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    document.querySelector("#save-status").textContent = message;
  } catch {
    document.querySelector("#save-status").textContent = "Der Bearbeitungsstand konnte in diesem Browser nicht gespeichert werden.";
  }
}

function createFishShape(entry) {
  const shape = document.createElement("div");
  shape.className = `fish-shape${entry.features.patternNone ? "" : " has-points"}`;
  shape.style.setProperty("--scale-color", entry.features.scalesBlue ? "var(--fish-blue)" : "var(--fish-orange)");
  shape.style.setProperty("--belly-color", entry.features.bellyBlack ? "#273247" : "#f7f8fa");
  shape.style.setProperty("--fin-color", entry.features.finsYellow ? "var(--fish-yellow)" : "var(--fish-red)");
  shape.setAttribute("role", "img");
  shape.setAttribute("aria-label", `${entry.values.scalesBlue}, ${entry.values.patternNone === "Punkte" ? "mit Punkten" : "ohne Muster"}, Bauch ${entry.values.bellyBlack}, Flossen ${entry.values.finsYellow}`);
  return shape;
}

function fishCard(entry) {
  const card = document.createElement("article");
  card.className = "fish-card";
  const shape = createFishShape(entry);
  const label = document.createElement("span");
  label.className = `fish-card-label ${entry.classification === FISH_LABELS.PEACEFUL ? "peaceful" : "hostile"}`;
  label.textContent = entry.classification;
  const details = document.createElement("details");
  details.innerHTML = `<summary>${entry.id} · Merkmale</summary><p>${entry.values.scalesBlue} · ${entry.values.patternNone}<br>${entry.values.bellyBlack}er Bauch · ${entry.values.finsYellow}e Flossen</p>`;
  card.append(shape, label, details);
  return card;
}

function renderFish(containerId, dataset) {
  const container = document.querySelector(`#${containerId}`);
  container.replaceChildren(...dataset.map(fishCard));
}

function introFishToken(entry, markErrors = false) {
  const token = document.createElement("div");
  token.className = `intro-fish-token${markErrors && entry.classification === FISH_LABELS.PEACEFUL ? " is-error" : ""}`;
  const label = document.createElement("small");
  label.textContent = `${entry.id} · ${entry.classification}`;
  token.append(createFishShape(entry), label);
  return token;
}

function setIntroProgress(activeStep) {
  const order = ["unsplit", "split", "table"];
  const activeIndex = order.indexOf(activeStep);
  document.querySelectorAll("[data-intro-progress]").forEach((item) => {
    const index = order.indexOf(item.dataset.introProgress);
    item.classList.toggle("is-active", index === activeIndex);
    item.classList.toggle("is-complete", index < activeIndex);
  });
}

function resetIntroTable() {
  document.querySelectorAll("[data-intro-cell]").forEach((cell) => {
    cell.textContent = "–";
    cell.classList.remove("is-filled", "is-current");
  });
  document.querySelector("#intro-table-note").textContent = "Die Tabelle wird passend zur Animation ausgefüllt.";
}

function fillIntroCells(values, note) {
  document.querySelectorAll("[data-intro-cell]").forEach((cell) => cell.classList.remove("is-current"));
  Object.entries(values).forEach(([id, value]) => {
    const cell = document.querySelector(`#${id}`);
    cell.textContent = value;
    cell.classList.add("is-filled", "is-current");
  });
  document.querySelector("#intro-table-note").textContent = note;
}

function renderIntroUnsplit(markErrors = false) {
  document.querySelector("#intro-tree").innerHTML = `
    <div class="intro-tree-unsplit">
      <div class="intro-tree-node">Alle 9 Fische</div>
      <span class="intro-tree-arrow" aria-hidden="true">→</span>
      <div class="intro-tree-leaf">Mehrheit: feindselig</div>
    </div>`;
  const group = document.createElement("div");
  group.className = "intro-fish-group";
  group.append(...FISH_DATASET.map((entry) => introFishToken(entry, markErrors)));
  document.querySelector("#intro-fish-stage").replaceChildren(group);
}

function introFishGroup(title, dataset, className) {
  const group = document.createElement("section");
  group.className = `intro-fish-group ${className}`;
  const heading = document.createElement("h3");
  heading.className = "intro-group-title";
  heading.textContent = `${title} · ${dataset.length} Fische`;
  group.append(heading, ...dataset.map((entry) => introFishToken(entry)));
  return group;
}

function renderIntroSplit(focus = "") {
  document.querySelector("#intro-tree").innerHTML = `
    <div class="intro-tree-split">
      <div class="intro-tree-node">Schuppenfarbe</div>
      <div class="intro-tree-branches"><span class="intro-tree-branch">Blau</span><span class="intro-tree-branch">Orange</span></div>
    </div>`;
  const groups = document.createElement("div");
  groups.className = "intro-fish-groups";
  const blue = introFishGroup("Blau", subsets.blue, "blue");
  const orange = introFishGroup("Orange", subsets.orange, "orange");
  if (focus === "blue") blue.classList.add("is-focus");
  if (focus === "orange") orange.classList.add("is-focus");
  groups.append(blue, orange);
  document.querySelector("#intro-fish-stage").replaceChildren(groups);
}

function clearIntroTimers() {
  introTimers.forEach((timer) => clearTimeout(timer));
  introTimers = [];
}

function queueIntro(delay, action) {
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  introTimers.push(setTimeout(action, delay * (reducedMotion ? 0.35 : 1)));
}

function finishIntro() {
  clearIntroTimers();
  state.introComplete = true;
  saveState("Einführung abgeschlossen. Dein Bearbeitungsstand wird gespeichert.");
  document.body.classList.remove("is-intro-active");
  document.querySelector("#split-intro").hidden = true;
  const firstStep = document.querySelector("#erster-split");
  firstStep.hidden = false;
  updateUnlocks();
  const behavior = matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth";
  requestAnimationFrame(() => firstStep.scrollIntoView({ behavior, block: "start" }));
}

function startIntro() {
  clearIntroTimers();
  state.introComplete = false;
  saveState("Einführung wird gezeigt.");
  document.body.classList.add("is-intro-active");
  document.querySelector("#split-intro").hidden = false;
  document.querySelector("#erster-split").hidden = true;
  resetIntroTable();
  setIntroProgress("unsplit");
  renderIntroUnsplit();
  document.querySelector("#intro-explanation").textContent = "Ohne Split gehören alle neun Fische zu einer Gruppe. Die Mehrheit ist feindselig: 5 zu 4.";

  queueIntro(1800, () => {
    renderIntroUnsplit(true);
    fillIntroCells({ "intro-before": 4 }, "Die vier friedlichen Fische wären mit dem Mehrheitslabel falsch eingeordnet. Deshalb tragen wir oben 4 Fehler ein.");
    document.querySelector("#intro-explanation").textContent = "Der Baum würde ohne Aufteilung immer „feindselig“ vorhersagen. Die vier friedlichen Fische sind dadurch Fehlklassifikationen.";
  });
  queueIntro(4800, () => {
    setIntroProgress("split");
    renderIntroSplit();
    document.querySelector("#intro-explanation").textContent = "Nun teilt der Knoten Schuppenfarbe die Fische in eine blaue und eine orange Teilmenge.";
    document.querySelector("#intro-table-note").textContent = "Die Fehler vor dem Split bleiben 4. Jetzt zählen wir die beiden neuen Gruppen getrennt.";
  });
  queueIntro(6900, () => {
    setIntroProgress("table");
    renderIntroSplit("blue");
    fillIntroCells({ "intro-blue-peaceful": 3, "intro-blue-hostile": 2, "intro-blue-errors": 2 }, "Blau: 3 friedlich, 2 feindselig. Die kleinere Gruppe liefert 2 Fehler.");
    document.querySelector("#intro-explanation").textContent = "Bei den blauen Fischen ist friedlich das Mehrheitslabel. Zwei feindselige Fische würden falsch eingeordnet.";
  });
  queueIntro(9000, () => {
    renderIntroSplit("orange");
    fillIntroCells({ "intro-orange-peaceful": 1, "intro-orange-hostile": 3, "intro-orange-errors": 1 }, "Orange: 1 friedlich, 3 feindselig. Die kleinere Gruppe liefert 1 Fehler.");
    document.querySelector("#intro-explanation").textContent = "Bei den orangen Fischen ist feindselig das Mehrheitslabel. Hier entsteht nur ein Fehler.";
  });
  queueIntro(11100, () => {
    renderIntroSplit();
    fillIntroCells({ "intro-after": 3, "intro-gain": 1 }, "Nach dem Split entstehen 2 + 1 = 3 Fehler. Der Informationsgewinn beträgt 4 − 3 = 1.");
    document.querySelector("#intro-explanation").textContent = "Der Split senkt die Fehlerzahl von 4 auf 3. Genau diese Verringerung ist hier der Informationsgewinn.";
  });
  queueIntro(13700, finishIntro);
}

const fields = [
  ["before", "Fehler vorher"],
  ["row0Peaceful", "friedlich in der ersten Gruppe"],
  ["row0Hostile", "feindselig in der ersten Gruppe"],
  ["row0Errors", "Fehler der ersten Gruppe"],
  ["row1Peaceful", "friedlich in der zweiten Gruppe"],
  ["row1Hostile", "feindselig in der zweiten Gruppe"],
  ["row1Errors", "Fehler der zweiten Gruppe"],
  ["after", "Gesamtfehler"],
  ["gain", "Informationsgewinn"],
];

function answerKey(groupId, featureKey, field) { return `${groupId}.${featureKey}.${field}`; }

function numericInput(groupId, featureKey, field, label) {
  const input = document.createElement("input");
  input.className = "fish-number-input";
  input.type = "text";
  input.inputMode = "decimal";
  input.autocomplete = "off";
  input.value = state.answers[answerKey(groupId, featureKey, field)] ?? "";
  input.setAttribute("aria-label", `${FISH_FEATURES[featureKey].label}: ${label}`);
  input.dataset.answerKey = answerKey(groupId, featureKey, field);
  input.addEventListener("input", () => {
    state.answers[input.dataset.answerKey] = input.value;
    state.completedTables[`${groupId}.${featureKey}`] = false;
    if (groupId === "all") state.rootComplete = false;
    else state.treeComplete = false;
    input.classList.remove("is-correct", "is-wrong");
    const tableCard = document.querySelector(`[data-table-key="${groupId}.${featureKey}"]`);
    const check = tableCard?.querySelector("[data-table-check]");
    if (check) {
      check.checked = false;
      check.disabled = false;
    }
    tableCard?.classList.remove("is-complete");
    saveState();
    updateUnlocks();
  });
  return input;
}

function renderTable(groupId, featureKey) {
  const definition = FISH_FEATURES[featureKey];
  const expected = expectedTableValues(subsets[groupId], featureKey);
  const card = document.createElement("article");
  card.className = `fish-table-card${state.completedTables[`${groupId}.${featureKey}`] ? " is-complete" : ""}`;
  card.dataset.tableKey = `${groupId}.${featureKey}`;
  const header = document.createElement("div");
  header.className = "fish-table-header";
  const title = document.createElement("h3");
  title.textContent = definition.label;
  const helpButton = document.createElement("button");
  helpButton.type = "button";
  helpButton.className = "fish-help-button";
  helpButton.textContent = `Hilfe ${Math.min((state.hints[`${groupId}.${featureKey}`] ?? 0) + 1, HELP_STEPS.length)}`;
  const help = document.createElement("p");
  help.className = "fish-help";
  const hintLevel = state.hints[`${groupId}.${featureKey}`] ?? 0;
  help.hidden = hintLevel === 0;
  help.textContent = hintLevel ? HELP_STEPS[hintLevel - 1] : "";
  helpButton.addEventListener("click", () => {
    const key = `${groupId}.${featureKey}`;
    state.hints[key] = Math.min((state.hints[key] ?? 0) + 1, HELP_STEPS.length);
    saveState("Hilfestufe gespeichert.");
    renderTables(groupId);
  });
  header.append(title, helpButton);

  const scroll = document.createElement("div");
  scroll.className = "fish-table-scroll";
  const table = document.createElement("table");
  table.className = "fish-table";
  table.innerHTML = `<thead><tr><th>Attributwert / Label</th><th>Friedlich</th><th>Feindselig</th><th>Fehler</th></tr></thead>`;
  const body = document.createElement("tbody");
  const beforeRow = document.createElement("tr");
  beforeRow.innerHTML = `<th colspan="3">Fehler vor dem Aufteilen</th>`;
  const beforeCell = document.createElement("td");
  beforeCell.append(numericInput(groupId, featureKey, "before", "Fehler vor dem Aufteilen"));
  beforeRow.append(beforeCell);
  body.append(beforeRow);
  [definition.yes, definition.no].forEach((value, index) => {
    const row = document.createElement("tr");
    const heading = document.createElement("th");
    heading.scope = "row";
    heading.textContent = value;
    row.append(
      heading,
      Object.assign(document.createElement("td"), { }),
      Object.assign(document.createElement("td"), { }),
      Object.assign(document.createElement("td"), { }),
    );
    row.children[1].append(numericInput(groupId, featureKey, `row${index}Peaceful`, `${value}: friedlich`));
    row.children[2].append(numericInput(groupId, featureKey, `row${index}Hostile`, `${value}: feindselig`));
    row.children[3].append(numericInput(groupId, featureKey, `row${index}Errors`, `${value}: Fehler`));
    body.append(row);
  });
  const total = document.createElement("tr");
  total.innerHTML = `<th colspan="3">Gesamtfehler nach dem Aufteilen</th>`;
  const totalCell = document.createElement("td");
  totalCell.append(numericInput(groupId, featureKey, "after", "Gesamtfehler"));
  total.append(totalCell);
  body.append(total);
  table.append(body);
  scroll.append(table);
  const gainRow = document.createElement("label");
  gainRow.className = "fish-gain-row";
  gainRow.append(document.createTextNode("Informationsgewinn"), numericInput(groupId, featureKey, "gain", "Informationsgewinn"));
  const feedback = document.createElement("p");
  feedback.className = "fish-field-feedback";
  feedback.dataset.tableFeedback = `${groupId}.${featureKey}`;
  if (state.completedTables[`${groupId}.${featureKey}`]) feedback.textContent = `✓ Vollständig richtig: Informationsgewinn ${expected.informationGain}.`;
  card.append(header, help, scroll, gainRow);
  if (groupId === "all") {
    const checkLabel = document.createElement("label");
    checkLabel.className = "fish-table-check";
    const check = document.createElement("input");
    check.type = "checkbox";
    check.checked = Boolean(state.completedTables[`${groupId}.${featureKey}`]);
    check.disabled = check.checked;
    check.dataset.tableCheck = `${groupId}.${featureKey}`;
    check.addEventListener("change", () => {
      if (!check.checked) return;
      checkSingleTable(groupId, featureKey, check);
    });
    const checkText = document.createElement("span");
    checkText.textContent = "Tabelle überprüfen";
    checkLabel.append(check, checkText);
    card.append(checkLabel);
  }
  card.append(feedback);
  return card;
}

function renderTables(groupId) {
  const config = tableGroups[groupId];
  document.querySelector(`#${config.container}`).replaceChildren(...config.features.map((feature) => renderTable(groupId, feature)));
}

function checkTable(groupId, featureKey) {
  const expected = expectedTableValues(subsets[groupId], featureKey);
  const card = document.querySelector(`[data-table-key="${groupId}.${featureKey}"]`);
  let correct = 0;
  let firstWrong = null;
  fields.forEach(([field, label]) => {
    const input = card.querySelector(`[data-answer-key="${answerKey(groupId, featureKey, field)}"]`);
    const value = Number(String(input.value).trim().replace(",", "."));
    const isCorrect = input.value.trim() !== "" && Number.isFinite(value) && value === expected[field];
    input.classList.toggle("is-correct", isCorrect);
    input.classList.toggle("is-wrong", !isCorrect);
    if (isCorrect) correct += 1;
    else if (!firstWrong) firstWrong = label;
  });
  const complete = correct === fields.length;
  state.completedTables[`${groupId}.${featureKey}`] = complete;
  const feedback = card.querySelector("[data-table-feedback]");
  feedback.textContent = complete
    ? `✓ Richtig. ${FISH_FEATURES[featureKey].label} erzeugt ${expected.after} Fehler; der Informationsgewinn ist ${expected.gain}.`
    : `${correct} von ${fields.length} Feldern stimmen. Prüfe ${firstWrong}. Die Fehlerzahl ist jeweils die kleinere der beiden Labelgruppen.`;
  card.classList.toggle("is-complete", complete);
  return complete;
}

function checkTableGroup(groupId, feedbackId) {
  const results = tableGroups[groupId].features.map((feature) => checkTable(groupId, feature));
  const complete = results.every(Boolean);
  const feedback = document.querySelector(`#${feedbackId}`);
  feedback.hidden = false;
  feedback.className = `dt-feedback ${complete ? "success" : "wrong"}`;
  feedback.textContent = complete
    ? groupId === "blue"
      ? "Alle Werte stimmen. Muster und Bauchfarbe erreichen beide den Informationsgewinn 1 – ein fachlich korrekter Gleichstand. Für den Referenzpfad verwenden wir Muster."
      : groupId === "orange"
        ? "Alle Werte stimmen. Bauchfarbe hat mit 1 den größten Informationsgewinn."
        : groupId === "bluePoints"
          ? "Richtig. Bauchfarbe trennt diese drei Fische ohne Fehler und wird der letzte Entscheidungsknoten."
          : "Alle vier Tabellen sind korrekt. Vergleiche nun die Informationsgewinne."
    : "Einige Felder brauchen noch Aufmerksamkeit. Richtige Werte bleiben grün markiert; korrigiere nur die rot markierten Felder.";
  saveState();
  updateUnlocks();
  return complete;
}

function checkSingleTable(groupId, featureKey, checkbox) {
  const complete = checkTable(groupId, featureKey);
  checkbox.checked = complete;
  checkbox.disabled = complete;
  const completedCount = tableGroups[groupId].features.filter(
    (feature) => state.completedTables[`${groupId}.${feature}`],
  ).length;
  const feedback = document.querySelector("#all-tables-feedback");
  feedback.hidden = false;
  feedback.className = `dt-feedback ${groupComplete(groupId) ? "success" : complete ? "incomplete" : "wrong"}`;
  feedback.textContent = groupComplete(groupId)
    ? "Alle vier Tabellen sind korrekt. Vergleiche nun die Informationsgewinne."
    : complete
      ? `Diese Tabelle stimmt. ${completedCount} von ${tableGroups[groupId].features.length} Tabellen sind vollständig geprüft.`
      : "Die Tabelle enthält noch abweichende Werte. Korrigiere die rot markierten Felder und aktiviere die Checkbox danach erneut.";
  saveState();
  updateUnlocks();
}

function groupComplete(groupId) {
  return tableGroups[groupId].features.every((feature) => state.completedTables[`${groupId}.${feature}`]);
}

function updateProgress() {
  const stages = {
    tables: groupComplete("all") && state.rootComplete,
    subsets: groupComplete("blue") && groupComplete("orange") && groupComplete("bluePoints"),
    tree: state.treeComplete,
    algorithm: state.algorithmComplete,
  };
  let foundCurrent = false;
  document.querySelectorAll("[data-progress]").forEach((link) => {
    const complete = stages[link.dataset.progress];
    link.classList.toggle("is-complete", complete);
    const current = !complete && !foundCurrent;
    link.classList.toggle("is-current", current);
    if (current) foundCurrent = true;
  });
}

function updateUnlocks() {
  const allComplete = groupComplete("all");
  document.querySelector("#root-choice").hidden = !allComplete;
  document.querySelector("#teilmengen").hidden = !state.rootComplete;
  const subsetComplete = groupComplete("blue") && groupComplete("orange");
  document.querySelector("#deep-split").hidden = !subsetComplete;
  document.querySelector("#baum-bauen").hidden = !(subsetComplete && groupComplete("bluePoints"));
  document.querySelector("#algorithmus").hidden = !state.treeComplete;
  document.querySelector("#task3a-complete").hidden = !(state.treeComplete && state.algorithmComplete);
  updateProgress();
}

function chooseRoot(event) {
  const choice = event.currentTarget.dataset.rootChoice;
  document.querySelectorAll("[data-root-choice]").forEach((button) => button.classList.remove("is-wrong", "is-correct"));
  const feedback = document.querySelector("#root-feedback");
  if (choice !== "scalesBlue") {
    state.rootComplete = false;
    event.currentTarget.classList.add("is-wrong");
    feedback.className = "fish-inline-feedback wrong";
    feedback.textContent = "Prüfe die Informationsgewinne: Gesucht ist das Attribut, das die Fehlerzahl am stärksten reduziert.";
    saveState();
    updateUnlocks();
    return;
  }
  event.currentTarget.classList.add("is-correct");
  feedback.className = "fish-inline-feedback success";
  feedback.textContent = "Richtig. Die Schuppenfarbe reduziert die Fehlklassifikationen von 4 auf 3 und besitzt mit 1 den größten Informationsgewinn.";
  state.rootComplete = true;
  saveState();
  updateUnlocks();
}

function classificationForTree(label) {
  return label === FISH_LABELS.PEACEFUL ? CLASSIFICATIONS.DOES_NOT_BITE : CLASSIFICATIONS.BITES;
}
const treeDataset = FISH_DATASET.map((entry) => ({ ...entry, classification: classificationForTree(entry.classification) }));
function treeLabel(prediction) { return prediction === CLASSIFICATIONS.DOES_NOT_BITE ? "friedlich" : "feindselig"; }
function setTreeStatus(message) { document.querySelector("#fish-tree-status").textContent = message; }
function clearTreeInteraction() { treeInteraction.selectedTool = null; treeInteraction.pendingTargetPath = null; treeInteraction.movingSourcePath = null; }
function treeToolEquals(first, second) { return first && second && first.kind === second.kind && first.feature === second.feature && first.prediction === second.prediction; }
function nodeFromTool(tool) { return tool.kind === "feature" ? createFeatureNode(tool.feature) : createLeafNode(tool.prediction); }

function treeChanged(message) {
  state.treeComplete = false;
  saveState();
  clearTreeInteraction();
  setTreeStatus(message);
  document.querySelector("#fish-tree-feedback").hidden = true;
  renderFishTree();
  updateUnlocks();
}

function placeTreeTool(path, tool) {
  state.tree = setNodeAtPath(state.tree, path, nodeFromTool(tool));
  treeChanged("Baustein eingesetzt. Offene Zweige kannst du genauso ergänzen.");
}

function chooseTreeTool(tool) {
  if (treeInteraction.pendingTargetPath !== null) {
    placeTreeTool(treeInteraction.pendingTargetPath, tool);
    return;
  }
  treeInteraction.selectedTool = treeToolEquals(treeInteraction.selectedTool, tool) ? null : tool;
  setTreeStatus(treeInteraction.selectedTool ? "Baustein ausgewählt. Klicke jetzt auf eine Drop-Zone im Baum." : "Auswahl aufgehoben.");
  renderFishTree();
}

function chooseTreeTarget(path) {
  if (treeInteraction.movingSourcePath !== null) {
    try {
      state.tree = moveSubtree(state.tree, treeInteraction.movingSourcePath, path);
      treeChanged("Unterbaum verschoben.");
    } catch (error) { setTreeStatus(error.message); }
    return;
  }
  if (treeInteraction.selectedTool) { placeTreeTool(path, treeInteraction.selectedTool); return; }
  treeInteraction.pendingTargetPath = path;
  setTreeStatus("Ziel ausgewählt. Klicke jetzt auf einen Baustein aus der Palette.");
  renderFishTree();
}

function treeToolButton(tool, label, classes = "") {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `dt-tool ${classes}`;
  button.textContent = label;
  button.draggable = true;
  button.setAttribute("aria-pressed", String(treeToolEquals(treeInteraction.selectedTool, tool)));
  button.addEventListener("click", () => chooseTreeTool(tool));
  button.addEventListener("dragstart", (event) => {
    const payload = JSON.stringify(tool);
    event.dataTransfer.setData(PALETTE_MIME, payload);
    event.dataTransfer.setData("text/plain", payload);
    event.dataTransfer.effectAllowed = "copy";
  });
  return button;
}

function renderTreePalettes() {
  document.querySelector("#fish-feature-palette").replaceChildren(...Object.entries(FISH_FEATURES).map(([feature, definition]) => treeToolButton({ kind: "feature", feature }, definition.label, "feature")));
  document.querySelector("#fish-leaf-palette").replaceChildren(
    treeToolButton({ kind: "leaf", prediction: CLASSIFICATIONS.DOES_NOT_BITE }, "friedlich", "leaf peaceful"),
    treeToolButton({ kind: "leaf", prediction: CLASSIFICATIONS.BITES }, "feindselig", "leaf hostile"),
  );
}

function readTreeDrag(event) {
  const palette = event.dataTransfer.getData(PALETTE_MIME);
  if (palette) return { type: "palette", value: JSON.parse(palette) };
  const path = event.dataTransfer.getData(TREE_MIME);
  return path !== "" ? { type: "tree", value: path } : null;
}

function treeNodeAction(label, className, action) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `dt-node-action ${className}`;
  button.textContent = label;
  button.addEventListener("click", (event) => { event.stopPropagation(); action(); });
  return button;
}

function renderTreeSlot(node, path, isRoot = false, parentKey = "") {
  const slot = document.createElement("div");
  slot.className = "dt-tree-slot";
  slot.dataset.path = path;
  const nodeKey = path || "root";
  slot.addEventListener("dragover", (event) => { event.preventDefault(); event.stopPropagation(); });
  slot.addEventListener("drop", (event) => {
    event.preventDefault(); event.stopPropagation();
    const payload = readTreeDrag(event);
    if (!payload) return;
    if (payload.type === "palette") placeTreeTool(path, payload.value);
    else {
      try { state.tree = moveSubtree(state.tree, payload.value, path); treeChanged("Unterbaum verschoben."); }
      catch (error) { setTreeStatus(error.message); }
    }
  });
  if (node == null) {
    const zone = document.createElement("button");
    zone.type = "button";
    zone.className = `dt-drop-zone${isRoot ? " root" : ""}${treeInteraction.pendingTargetPath === path ? " is-selected" : ""}`;
    zone.textContent = isRoot ? "Erstes Attribut hier ablegen" : "Baustein hier ablegen";
    zone.dataset.treeNodeKey = nodeKey;
    if (parentKey) zone.dataset.treeParentKey = parentKey;
    zone.addEventListener("click", () => chooseTreeTarget(path));
    slot.append(zone);
    return slot;
  }
  const article = document.createElement("article");
  article.className = `dt-tree-node ${node.type === "feature" ? "feature" : `leaf ${node.prediction === CLASSIFICATIONS.DOES_NOT_BITE ? "peaceful" : "hostile"}`}`;
  article.dataset.treeNodeKey = nodeKey;
  if (parentKey) article.dataset.treeParentKey = parentKey;
  article.draggable = true;
  article.addEventListener("dragstart", (event) => { event.stopPropagation(); event.dataTransfer.setData(TREE_MIME, path); event.dataTransfer.effectAllowed = "move"; });
  const title = document.createElement("strong");
  title.className = "dt-node-title";
  title.textContent = node.type === "feature" ? FISH_FEATURES[node.feature]?.label ?? node.feature : treeLabel(node.prediction);
  const actions = document.createElement("div");
  actions.className = "dt-node-actions";
  actions.append(
    treeNodeAction("Verschieben", "move", () => { clearTreeInteraction(); treeInteraction.movingSourcePath = path; setTreeStatus("Unterbaum ausgewählt. Klicke auf sein neues Ziel."); renderFishTree(); }),
    treeNodeAction("Ersetzen", "replace", () => { clearTreeInteraction(); treeInteraction.pendingTargetPath = path; setTreeStatus("Ziel ausgewählt. Wähle einen neuen Baustein."); renderFishTree(); }),
    treeNodeAction("Löschen", "delete", () => { state.tree = setNodeAtPath(state.tree, path, null); treeChanged("Knoten gelöscht. Ergänze die offene Stelle."); }),
  );
  article.append(title, actions);
  if (treeInteraction.movingSourcePath !== null && treeInteraction.movingSourcePath !== path && !path.startsWith(`${treeInteraction.movingSourcePath}.`)) {
    article.append(treeNodeAction("Hierher verschieben", "target", () => chooseTreeTarget(path)));
  }
  slot.append(article);
  if (node.type === "feature") {
    const branches = document.createElement("div");
    branches.className = "dt-branches";
    [{ key: "yes", label: FISH_FEATURES[node.feature]?.yes ?? "Ja" }, { key: "no", label: FISH_FEATURES[node.feature]?.no ?? "Nein" }].forEach((branch) => {
      const section = document.createElement("section");
      section.className = "dt-branch";
      const label = document.createElement("span");
      label.className = "dt-branch-label";
      label.textContent = branch.label;
      const childPath = path ? `${path}.${branch.key}` : branch.key;
      section.append(label, renderTreeSlot(node[branch.key], childPath, false, nodeKey));
      branches.append(section);
    });
    slot.append(branches);
  }
  return slot;
}

function renderFishTree() {
  renderTreePalettes();
  const editor = document.querySelector("#fish-tree-editor");
  editor.replaceChildren(renderTreeSlot(state.tree, "", true));
  renderTreeEdges(editor);
}

function checkFishTree() {
  const result = evaluateTree(treeDataset, state.tree);
  const feedback = document.querySelector("#fish-tree-feedback");
  feedback.hidden = false;
  if (!result.complete) {
    feedback.className = "dt-feedback incomplete";
    feedback.textContent = "Der Baum ist noch nicht vollständig. Jeder Ast muss an einem Blatt mit friedlich oder feindselig enden.";
  } else if (state.tree?.feature !== "scalesBlue") {
    feedback.className = "dt-feedback wrong";
    feedback.textContent = "Der Baum klassifiziert möglicherweise gut, aber der berechnete erste Knoten fehlt: Beginne mit der Schuppenfarbe.";
  } else if (result.correct !== result.total) {
    feedback.className = "dt-feedback wrong";
    feedback.textContent = `Noch nicht ganz: Dein Baum ordnet ${result.correct} von ${result.total} Trainingsfischen richtig ein. Prüfe besonders die Astwerte und Blätter.`;
  } else {
    feedback.className = "dt-feedback success";
    feedback.textContent = "Richtig. Die logische Baumstruktur klassifiziert alle neun Trainingsfische korrekt. Auch ein äquivalenter blauer Teilbaum über Bauchfarbe wird anerkannt.";
    state.treeComplete = true;
    saveState();
  }
  updateUnlocks();
}

function appendFeedbackList(container, title, items, fallback) {
  const heading = document.createElement("h4");
  heading.textContent = title;
  const list = document.createElement("ul");
  const values = Array.isArray(items) && items.length ? items : [fallback];
  values.forEach((text) => { const item = document.createElement("li"); item.textContent = text; list.append(item); });
  container.append(heading, list);
}

function renderSemanticResult(result) {
  const box = document.querySelector("#algorithm-feedback");
  box.replaceChildren();
  box.hidden = false;
  const complete = Number(result.points) >= 7;
  box.className = `fish-semantic-feedback${complete ? " success" : ""}`;
  const heading = document.createElement("h3");
  heading.textContent = `${result.points} von ${result.maxPoints} Punkten – ${result.status}`;
  box.append(heading);
  appendFeedbackList(box, "Das ist dir gelungen:", result.strengths, "Es wurde noch kein eindeutiger richtiger Aspekt erkannt.");
  appendFeedbackList(box, "Das solltest du ergänzen:", result.missing, "Es fehlen keine wesentlichen Schritte.");
  const feedback = document.createElement("p");
  feedback.textContent = result.feedback || "Überprüfe deine Beschreibung noch einmal.";
  box.append(feedback);
  if (complete) {
    state.algorithmComplete = true;
    saveState();
    updateUnlocks();
  }
}

async function checkAlgorithm() {
  const textarea = document.querySelector("#algorithm-answer");
  const button = document.querySelector("#check-algorithm");
  const box = document.querySelector("#algorithm-feedback");
  const answer = textarea.value.trim();
  if (answer.length < 30) {
    box.hidden = false; box.className = "fish-semantic-feedback error"; box.textContent = "Bitte formuliere eine etwas ausführlichere Antwort, damit sie sinnvoll ausgewertet werden kann."; textarea.focus(); return;
  }
  button.disabled = true; textarea.disabled = true; button.textContent = "Antwort wird geprüft …";
  box.hidden = false; box.className = "fish-semantic-feedback"; box.textContent = "Deine Antwort wird mit dem Erwartungshorizont verglichen.";
  try { renderSemanticResult(await evaluateSemanticAnswer({ serverUrl: SCRIPT_SERVER_URL, taskId: SEMANTIC_TASK_ID, answer })); }
  catch (error) { box.className = "fish-semantic-feedback error"; box.textContent = error.message; }
  finally { button.disabled = false; textarea.disabled = false; button.textContent = "Antwort erneut überprüfen"; }
}

function renderQuiz() {
  const container = document.querySelector("#entropy-questions");
  container.replaceChildren(...ENTROPY_QUIZ.map((item, index) => {
    const fieldset = document.createElement("fieldset");
    fieldset.className = "quiz-question";
    fieldset.dataset.quizIndex = index;
    const legend = document.createElement("legend");
    legend.textContent = `Frage ${index + 1}: ${item.question}`;
    const options = document.createElement("div");
    options.className = "quiz-options";
    item.options.forEach((option, optionIndex) => {
      const label = document.createElement("label");
      label.className = "quiz-option";
      const input = document.createElement("input");
      input.type = "radio"; input.name = `entropy-${index}`; input.value = optionIndex;
      input.checked = Number(state.quizAnswers[index]) === optionIndex;
      input.addEventListener("change", () => {
        state.quizAnswers[index] = optionIndex;
        state.quizComplete = false;
        document.querySelector("#quiz-summary").hidden = true;
        document.querySelector("#task3b-complete").hidden = true;
        saveState();
        updateQuizProgress();
        fieldset.classList.remove("is-correct", "is-wrong");
        fieldset.querySelector(".quiz-item-feedback").textContent = "";
      });
      label.append(input, document.createTextNode(option)); options.append(label);
    });
    const feedback = document.createElement("p"); feedback.className = "quiz-item-feedback";
    fieldset.append(legend, options, feedback); return fieldset;
  }));
  updateQuizProgress();
  if (state.quizComplete) showQuizSummary();
}

function updateQuizProgress() {
  document.querySelector("#quiz-progress").textContent = `${Object.keys(state.quizAnswers).length} von ${ENTROPY_QUIZ.length} beantwortet`;
}

function showQuizSummary() {
  const summary = document.querySelector("#quiz-summary");
  summary.hidden = false;
  summary.innerHTML = "<h3>Abschlussübersicht</h3>";
  const list = document.createElement("ol");
  ENTROPY_QUIZ.forEach((item) => { const li = document.createElement("li"); li.append(document.createTextNode(item.question), Object.assign(document.createElement("strong"), { textContent: `Richtig: ${item.options[item.correct]}` })); list.append(li); });
  summary.append(list);
  document.querySelector("#task3b-complete").hidden = false;
}

function checkQuiz(event) {
  event.preventDefault();
  let correct = 0;
  ENTROPY_QUIZ.forEach((item, index) => {
    const fieldset = document.querySelector(`[data-quiz-index="${index}"]`);
    const answer = state.quizAnswers[index];
    const isCorrect = Number(answer) === item.correct;
    fieldset.classList.toggle("is-correct", isCorrect);
    fieldset.classList.toggle("is-wrong", !isCorrect);
    fieldset.querySelector(".quiz-item-feedback").textContent = answer == null ? "Wähle zuerst eine Antwort aus." : isCorrect ? `✓ ${item.feedback}` : `Noch nicht. Hinweis: ${item.feedback}`;
    if (isCorrect) correct += 1;
  });
  const feedback = document.querySelector("#quiz-feedback");
  feedback.hidden = false;
  feedback.className = `dt-feedback ${correct === ENTROPY_QUIZ.length ? "success" : "wrong"}`;
  feedback.textContent = correct === ENTROPY_QUIZ.length ? "Alle fünf Antworten sind richtig." : `${correct} von ${ENTROPY_QUIZ.length} Antworten sind richtig. Verbessere die übrigen Fragen und werte erneut aus.`;
  if (correct === ENTROPY_QUIZ.length) { state.quizComplete = true; saveState(); showQuizSummary(); }
}

renderFish("fish-all", subsets.all);
renderFish("fish-blue", subsets.blue);
renderFish("fish-orange", subsets.orange);
renderFish("fish-blue-points", subsets.bluePoints);
Object.keys(tableGroups).forEach(renderTables);
document.querySelector("#algorithm-answer").value = state.algorithm;
document.querySelector("#algorithm-count").textContent = `${state.algorithm.length} von 3000 Zeichen`;
document.querySelector("#algorithm-answer").addEventListener("input", (event) => {
  state.algorithm = event.target.value;
  state.algorithmComplete = false;
  document.querySelector("#algorithm-count").textContent = `${event.target.value.length} von 3000 Zeichen`;
  saveState();
  updateUnlocks();
});
document.querySelector("#check-blue-tables").addEventListener("click", () => checkTableGroup("blue", "blue-tables-feedback"));
document.querySelector("#check-orange-tables").addEventListener("click", () => checkTableGroup("orange", "orange-tables-feedback"));
document.querySelector("#check-deep-tables").addEventListener("click", () => checkTableGroup("bluePoints", "deep-tables-feedback"));
document.querySelectorAll("[data-root-choice]").forEach((button) => button.addEventListener("click", chooseRoot));
document.querySelector("#reset-fish-tree").addEventListener("click", () => {
  if (state.tree == null || window.confirm("Möchtest du den Fisch-Entscheidungsbaum wirklich zurücksetzen?")) { state.tree = null; treeChanged("Der Baum wurde zurückgesetzt."); }
});
document.querySelector("#check-fish-tree").addEventListener("click", checkFishTree);
document.querySelector("#check-algorithm").addEventListener("click", checkAlgorithm);
document.querySelector("#entropy-quiz-form").addEventListener("submit", checkQuiz);
document.querySelector("#skip-intro").addEventListener("click", finishIntro);
document.querySelector("#replay-intro").addEventListener("click", () => {
  startIntro();
  document.querySelector("#split-intro").scrollIntoView({ behavior: "smooth", block: "start" });
});
window.addEventListener("pagehide", clearIntroTimers);
renderFishTree();
renderQuiz();
updateUnlocks();
if (!state.introComplete && location.hash !== "#entropie") {
  startIntro();
} else {
  document.body.classList.remove("is-intro-active");
  document.querySelector("#split-intro").hidden = true;
  document.querySelector("#erster-split").hidden = false;
}
