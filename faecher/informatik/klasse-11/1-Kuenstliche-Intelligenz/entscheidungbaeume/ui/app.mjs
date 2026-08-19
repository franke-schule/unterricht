import {
  CLASSIFICATIONS,
  FEATURE_DEFINITIONS,
  VARIANTS,
} from "../data/monkeys.mjs";
import {
  createFeatureNode,
  createLeafNode,
  evaluateTree,
  getNodeAtPath,
  moveSubtree,
  setNodeAtPath,
} from "../logic/decision-tree.mjs";

const STORAGE_PREFIX = "informatik11-decision-tree-v1";
const PALETTE_MIME = "application/x-monkey-tree-palette";
const TREE_MIME = "application/x-monkey-tree-node";

const elements = {
  tabs: [...document.querySelectorAll("[data-variant]")],
  trainingGroups: document.querySelector("#training-groups"),
  featurePalette: document.querySelector("#feature-palette"),
  leafPalette: document.querySelector("#leaf-palette"),
  treeEditor: document.querySelector("#tree-editor"),
  status: document.querySelector("#interaction-status"),
  feedback: document.querySelector("#evaluation-feedback"),
  check: document.querySelector("#check-tree"),
  reset: document.querySelector("#reset-tree"),
  toggleExample: document.querySelector("#toggle-example"),
  exampleTree: document.querySelector("#example-tree"),
};

const state = {
  variantId: location.hash === "#advanced" ? "advanced" : "easy",
  tree: null,
  selectedTool: null,
  pendingTargetPath: null,
  movingSourcePath: null,
  evaluation: null,
};

function currentVariant() {
  return VARIANTS[state.variantId];
}

function storageKey() {
  return `${STORAGE_PREFIX}-${state.variantId}`;
}

function loadTree() {
  try {
    const stored = localStorage.getItem(storageKey());
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    if (parsed == null || parsed.type === "feature" || parsed.type === "leaf") return parsed;
  } catch {
    // Beschädigte lokale Daten sollen das Modul nicht blockieren.
  }
  return null;
}

function saveTree() {
  try {
    localStorage.setItem(storageKey(), JSON.stringify(state.tree));
  } catch {
    setStatus("Der Baum konnte in diesem Browser nicht lokal gespeichert werden.");
  }
}

function labelForClassification(classification) {
  return classification === CLASSIFICATIONS.BITES ? "Beißt" : "Beißt nicht";
}

function setStatus(message) {
  elements.status.textContent = message;
}

function clearInteraction() {
  state.selectedTool = null;
  state.pendingTargetPath = null;
  state.movingSourcePath = null;
}

function markTreeChanged(message = "Baum geändert. Überprüfe ihn erneut, wenn du bereit bist.") {
  state.evaluation = null;
  saveTree();
  clearInteraction();
  setStatus(message);
  render();
}

function createNodeFromTool(tool) {
  return tool.kind === "feature"
    ? createFeatureNode(tool.feature)
    : createLeafNode(tool.prediction);
}

function placeTool(path, tool) {
  state.tree = setNodeAtPath(state.tree, path, createNodeFromTool(tool));
  markTreeChanged("Baustein eingesetzt. Jeder Merkmalsknoten braucht nun einen Ja- und einen Nein-Zweig.");
}

function chooseTool(tool) {
  if (state.pendingTargetPath !== null) {
    placeTool(state.pendingTargetPath, tool);
    return;
  }
  state.selectedTool = tool;
  state.movingSourcePath = null;
  setStatus("Baustein ausgewählt. Klicke jetzt auf eine Drop-Zone oder auf „Ersetzen“ bei einem Knoten.");
  renderPalettes();
  renderTree();
}

function chooseTarget(path) {
  if (state.movingSourcePath !== null) {
    moveNode(state.movingSourcePath, path);
    return;
  }
  if (state.selectedTool) {
    placeTool(path, state.selectedTool);
    return;
  }
  state.pendingTargetPath = path;
  setStatus("Ziel ausgewählt. Klicke jetzt auf einen Baustein aus der Palette.");
  renderPalettes();
  renderTree();
}

function moveNode(sourcePath, targetPath) {
  try {
    state.tree = moveSubtree(state.tree, sourcePath, targetPath);
    markTreeChanged("Unterbaum verschoben. Die bisherige Zielposition wurde dabei ersetzt.");
  } catch (error) {
    setStatus(error.message);
  }
}

function deleteNode(path) {
  state.tree = setNodeAtPath(state.tree, path, null);
  markTreeChanged("Knoten gelöscht. Ergänze offene Zweige, bevor du den Baum überprüfst.");
}

function toolEquals(first, second) {
  return first && second && first.kind === second.kind
    && first.feature === second.feature
    && first.prediction === second.prediction;
}

function toolButton(tool, label, classes = "") {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `dt-tool ${classes}`;
  button.textContent = label;
  button.draggable = true;
  button.setAttribute("aria-pressed", String(toolEquals(state.selectedTool, tool)));
  button.addEventListener("click", () => chooseTool(tool));
  button.addEventListener("dragstart", (event) => {
    const payload = JSON.stringify(tool);
    event.dataTransfer.setData(PALETTE_MIME, payload);
    event.dataTransfer.setData("text/plain", payload);
    event.dataTransfer.effectAllowed = "copy";
  });
  return button;
}

function renderPalettes() {
  const variant = currentVariant();
  elements.featurePalette.replaceChildren();

  const regular = variant.featureKeys.filter((key) => FEATURE_DEFINITIONS[key].group === "regular");
  const additional = variant.featureKeys.filter((key) => FEATURE_DEFINITIONS[key].group === "additional");

  const renderGroup = (label, keys) => {
    if (keys.length === 0) return;
    const group = document.createElement("div");
    group.className = "dt-palette-group";
    const heading = document.createElement("p");
    heading.className = "dt-palette-label";
    heading.textContent = label;
    const buttons = document.createElement("div");
    buttons.className = "dt-palette-buttons";
    keys.forEach((key) => buttons.append(toolButton(
      { kind: "feature", feature: key },
      FEATURE_DEFINITIONS[key].label,
      "feature",
    )));
    group.append(heading, buttons);
    elements.featurePalette.append(group);
  };

  renderGroup("Merkmale", regular);
  renderGroup("Weitere Merkmale für 1a", additional);

  elements.leafPalette.replaceChildren(
    toolButton({ kind: "leaf", prediction: CLASSIFICATIONS.BITES }, "Beißt", "leaf bites"),
    toolButton({ kind: "leaf", prediction: CLASSIFICATIONS.DOES_NOT_BITE }, "Beißt nicht", "leaf safe"),
  );
}

function wrongResultFor(id) {
  return state.evaluation?.results.find((result) => result.id === id && !result.correct) ?? null;
}

function renderTrainingData() {
  const variant = currentVariant();
  const groups = [
    { classification: CLASSIFICATIONS.BITES, heading: "Beißt", className: "bites" },
    { classification: CLASSIFICATIONS.DOES_NOT_BITE, heading: "Beißt nicht", className: "safe" },
  ];
  elements.trainingGroups.replaceChildren();

  groups.forEach((groupDefinition) => {
    const section = document.createElement("section");
    section.className = `dt-training-group ${groupDefinition.className}`;
    const heading = document.createElement("h3");
    const monkeys = variant.dataset.filter((monkey) => monkey.classification === groupDefinition.classification);
    heading.textContent = `${groupDefinition.heading} · ${monkeys.length}`;
    const grid = document.createElement("div");
    grid.className = "dt-monkey-grid";

    monkeys.forEach((monkey) => {
      const wrongResult = wrongResultFor(monkey.id);
      const card = document.createElement("article");
      card.className = `dt-monkey-card${wrongResult ? " is-wrong" : ""}`;
      card.dataset.monkeyId = monkey.id;
      const image = document.createElement("img");
      image.src = monkey.image;
      image.alt = `Äffchen ${monkey.id}`;
      image.width = 400;
      image.height = 400;
      const id = document.createElement("span");
      id.className = "dt-monkey-id";
      id.textContent = monkey.id;
      card.append(image, id);

      if (wrongResult) {
        const result = document.createElement("div");
        result.className = "dt-monkey-result";
        result.textContent = `Dein Baum: ${labelForClassification(wrongResult.prediction)} · Trainingsdaten: ${labelForClassification(wrongResult.expected)}`;
        card.append(result);
      }
      grid.append(card);
    });
    section.append(heading, grid);
    elements.trainingGroups.append(section);
  });
}

function readDragPayload(event) {
  const palette = event.dataTransfer.getData(PALETTE_MIME);
  if (palette) return { type: "palette", value: JSON.parse(palette) };
  const treePath = event.dataTransfer.getData(TREE_MIME);
  if (treePath !== "") return { type: "tree", value: treePath };
  return null;
}

function handleDrop(event, path) {
  event.preventDefault();
  event.stopPropagation();
  const payload = readDragPayload(event);
  if (!payload) return;
  if (payload.type === "palette") placeTool(path, payload.value);
  else moveNode(payload.value, path);
}

function nodeAction(label, className, action) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = `dt-node-action ${className}`;
  button.textContent = label;
  button.draggable = false;
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    action();
  });
  return button;
}

function renderSlot(node, path, isRoot = false) {
  const slot = document.createElement("div");
  slot.className = "dt-tree-slot";
  slot.dataset.path = path;
  slot.addEventListener("dragover", (event) => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = event.dataTransfer.types.includes(TREE_MIME) ? "move" : "copy";
  });
  slot.addEventListener("drop", (event) => handleDrop(event, path));

  if (node == null) {
    const dropZone = document.createElement("button");
    dropZone.type = "button";
    dropZone.className = `dt-drop-zone${isRoot ? " root" : ""}${state.pendingTargetPath === path ? " is-selected" : ""}`;
    dropZone.textContent = isRoot ? "Ziehe hier dein erstes Merkmal oder ein Blatt hinein." : "Baustein hier ablegen";
    dropZone.addEventListener("click", () => chooseTarget(path));
    slot.append(dropZone);
    return slot;
  }

  const article = document.createElement("article");
  const leafClass = node.type === "leaf"
    ? ` leaf ${node.prediction === CLASSIFICATIONS.BITES ? "bites" : "safe"}`
    : " feature";
  article.className = `dt-tree-node${leafClass}${state.movingSourcePath === path ? " is-moving" : ""}`;
  article.draggable = true;
  article.tabIndex = 0;
  article.addEventListener("dragstart", (event) => {
    event.stopPropagation();
    event.dataTransfer.setData(TREE_MIME, path);
    event.dataTransfer.effectAllowed = "move";
  });

  const title = document.createElement("strong");
  title.className = "dt-node-title";
  title.textContent = node.type === "feature"
    ? FEATURE_DEFINITIONS[node.feature]?.label ?? node.feature
    : labelForClassification(node.prediction);
  const actions = document.createElement("div");
  actions.className = "dt-node-actions";
  actions.append(
    nodeAction("Verschieben", "move", () => {
      state.selectedTool = null;
      state.pendingTargetPath = null;
      state.movingSourcePath = path;
      setStatus("Unterbaum ausgewählt. Klicke auf eine Drop-Zone oder auf „Hierher verschieben“.");
      render();
    }),
    nodeAction("Ersetzen", "replace", () => {
      state.selectedTool = null;
      state.movingSourcePath = null;
      state.pendingTargetPath = path;
      setStatus("Knoten als Ziel ausgewählt. Wähle jetzt einen neuen Baustein aus der Palette.");
      render();
    }),
    nodeAction("Löschen", "delete", () => deleteNode(path)),
  );
  article.append(title, actions);

  if (state.movingSourcePath !== null && state.movingSourcePath !== path
      && !path.startsWith(`${state.movingSourcePath}.`)) {
    const target = document.createElement("button");
    target.type = "button";
    target.className = "dt-target-action";
    target.textContent = "Hierher verschieben";
    target.addEventListener("click", (event) => {
      event.stopPropagation();
      chooseTarget(path);
    });
    article.append(target);
  }

  slot.append(article);

  if (node.type === "feature") {
    const branches = document.createElement("div");
    branches.className = "dt-branches";
    [
      { key: "yes", label: "Ja" },
      { key: "no", label: "Nein" },
    ].forEach((branch) => {
      const branchElement = document.createElement("section");
      branchElement.className = "dt-branch";
      const label = document.createElement("span");
      label.className = "dt-branch-label";
      label.textContent = branch.label;
      const childPath = path ? `${path}.${branch.key}` : branch.key;
      branchElement.append(label, renderSlot(node[branch.key], childPath));
      branches.append(branchElement);
    });
    slot.append(branches);
  }
  return slot;
}

function renderTree() {
  elements.treeEditor.replaceChildren(renderSlot(state.tree, "", true));
}

function renderFeedback() {
  const feedback = elements.feedback;
  feedback.replaceChildren();
  if (!state.evaluation) {
    feedback.hidden = true;
    feedback.className = "dt-feedback";
    return;
  }

  feedback.hidden = false;
  if (!state.evaluation.complete) {
    feedback.className = "dt-feedback incomplete";
    const strong = document.createElement("strong");
    strong.textContent = "Dein Entscheidungsbaum ist noch nicht vollständig.";
    const text = document.createElement("p");
    text.textContent = "Jeder Ja- und Nein-Zweig muss am Ende zu „Beißt“ oder „Beißt nicht“ führen.";
    feedback.append(strong, text);
    return;
  }

  if (state.evaluation.correct < state.evaluation.total) {
    feedback.className = "dt-feedback wrong";
    const strong = document.createElement("strong");
    strong.textContent = "Noch nicht ganz.";
    const text = document.createElement("p");
    text.textContent = `Dein Entscheidungsbaum ordnet ${state.evaluation.correct} von ${state.evaluation.total} Äffchen richtig ein. Schau dir die markierten Äffchen noch einmal genau an und verändere deinen Baum.`;
    feedback.append(strong, text);
    return;
  }

  feedback.className = "dt-feedback success";
  const strong = document.createElement("strong");
  strong.textContent = state.variantId === "easy"
    ? "Geschafft! Dein Entscheidungsbaum ordnet alle Trainingsdaten richtig ein."
    : "Sehr gut! Dein Entscheidungsbaum klassifiziert alle bekannten Äffchen korrekt.";
  const text = document.createElement("p");
  text.textContent = "Genauigkeit auf den Trainingsdaten: 100 %";
  feedback.append(strong, text);

  if (state.variantId === "easy") {
    const next = document.createElement("button");
    next.type = "button";
    next.className = "dt-secondary-button";
    next.textContent = "Weiter zur fortgeschrittenen Variante";
    next.addEventListener("click", () => switchVariant("advanced"));
    feedback.append(next);
  }
}

function renderTabs() {
  elements.tabs.forEach((tab) => {
    const selected = tab.dataset.variant === state.variantId;
    tab.setAttribute("aria-selected", String(selected));
    tab.tabIndex = selected ? 0 : -1;
  });
}

function render() {
  renderTabs();
  renderPalettes();
  renderTrainingData();
  renderTree();
  renderFeedback();
}

function switchVariant(variantId) {
  state.variantId = variantId;
  state.tree = loadTree();
  state.evaluation = null;
  clearInteraction();
  history.replaceState(null, "", variantId === "advanced" ? "#advanced" : location.pathname + location.search);
  setStatus(`Variante ${currentVariant().shortLabel} geladen. Dein Baum wird für jede Variante getrennt gespeichert.`);
  render();
  document.querySelector(".dt-variant-tabs").scrollIntoView({ behavior: "smooth", block: "start" });
}

elements.tabs.forEach((tab) => tab.addEventListener("click", () => switchVariant(tab.dataset.variant)));

elements.toggleExample.addEventListener("click", () => {
  const isHidden = elements.exampleTree.hidden;
  elements.exampleTree.hidden = !isHidden;
  elements.toggleExample.textContent = isHidden ? "Beispiel ausblenden" : "Beispiel einblenden";
  elements.toggleExample.setAttribute("aria-expanded", String(isHidden));
});

elements.reset.addEventListener("click", () => {
  if (state.tree == null || window.confirm("Möchtest du den Baum dieser Variante wirklich zurücksetzen?")) {
    state.tree = null;
    try { localStorage.removeItem(storageKey()); } catch { /* kein Zugriff */ }
    markTreeChanged("Der Baum dieser Variante wurde zurückgesetzt.");
  }
});

elements.check.addEventListener("click", () => {
  state.evaluation = evaluateTree(currentVariant().dataset, state.tree);
  clearInteraction();
  render();
  elements.feedback.scrollIntoView({ behavior: "smooth", block: "nearest" });
});

state.tree = loadTree();
render();

