import { CLASSIFICATIONS } from "../data/monkeys.mjs";

let fallbackId = 0;

function nodeId(prefix) {
  if (globalThis.crypto?.randomUUID) return `${prefix}-${globalThis.crypto.randomUUID()}`;
  fallbackId += 1;
  return `${prefix}-${Date.now()}-${fallbackId}`;
}

export function createFeatureNode(feature, yes = null, no = null) {
  return { type: "feature", id: nodeId("feature"), feature, yes, no };
}

export function createLeafNode(prediction) {
  if (!Object.values(CLASSIFICATIONS).includes(prediction)) {
    throw new Error(`Unbekannte Vorhersage: ${prediction}`);
  }
  return { type: "leaf", id: nodeId("leaf"), prediction };
}

export function cloneTree(tree) {
  return tree == null ? null : JSON.parse(JSON.stringify(tree));
}

export function validateTree(tree) {
  const issues = [];
  const visited = new Set();

  if (tree == null) return { valid: false, issues: ["no-root"] };

  function visit(node) {
    if (node == null) {
      issues.push("missing-branch");
      return;
    }
    if (typeof node !== "object" || visited.has(node)) {
      issues.push("cycle-or-invalid-node");
      return;
    }
    visited.add(node);

    if (node.type === "leaf") {
      if (!Object.values(CLASSIFICATIONS).includes(node.prediction)) issues.push("invalid-leaf");
      if ("yes" in node || "no" in node) issues.push("leaf-with-children");
      return;
    }

    if (node.type !== "feature" || typeof node.feature !== "string") {
      issues.push("invalid-feature-node");
      return;
    }
    if (node.yes == null) issues.push("missing-yes");
    else visit(node.yes);
    if (node.no == null) issues.push("missing-no");
    else visit(node.no);
  }

  visit(tree);
  return { valid: issues.length === 0, issues: [...new Set(issues)] };
}

export function classifyMonkey(monkey, tree) {
  const validation = validateTree(tree);
  if (!validation.valid) throw new Error("Der Entscheidungsbaum ist unvollständig.");

  const path = [];
  let current = tree;
  while (current.type === "feature") {
    const value = Boolean(monkey.features[current.feature]);
    path.push({ nodeId: current.id, feature: current.feature, value, branch: value ? "yes" : "no" });
    current = value ? current.yes : current.no;
  }
  return { prediction: current.prediction, path };
}

export function evaluateTree(dataset, tree) {
  const validation = validateTree(tree);
  if (!validation.valid) {
    return { complete: false, correct: 0, total: dataset.length, accuracy: 0, results: [], issues: validation.issues };
  }

  const results = dataset.map((monkey) => {
    const classification = classifyMonkey(monkey, tree);
    return {
      id: monkey.id,
      expected: monkey.classification,
      prediction: classification.prediction,
      correct: classification.prediction === monkey.classification,
      path: classification.path,
    };
  });
  const correct = results.filter((result) => result.correct).length;
  return {
    complete: true,
    correct,
    total: results.length,
    accuracy: results.length === 0 ? 0 : correct / results.length,
    results,
    issues: [],
  };
}

export function findIndistinguishableOpposites(dataset, featureKeys) {
  const signatures = new Map();
  const conflicts = [];

  for (const monkey of dataset) {
    const signature = featureKeys.map((key) => (monkey.features[key] ? "1" : "0")).join("");
    const previous = signatures.get(signature);
    if (previous && previous.classification !== monkey.classification) {
      conflicts.push({ firstId: previous.id, secondId: monkey.id, signature });
    } else if (!previous) {
      signatures.set(signature, monkey);
    }
  }
  return conflicts;
}

export function getNodeAtPath(tree, path) {
  if (path === "") return tree;
  return path.split(".").reduce((node, branch) => node?.[branch] ?? null, tree);
}

export function setNodeAtPath(tree, path, replacement) {
  if (path === "") return replacement;
  const nextTree = cloneTree(tree);
  const parts = path.split(".");
  const branch = parts.pop();
  const parent = parts.reduce((node, key) => node?.[key], nextTree);
  if (!parent || parent.type !== "feature") throw new Error(`Ungültiger Baumpfad: ${path}`);
  parent[branch] = replacement;
  return nextTree;
}

export function moveSubtree(tree, sourcePath, targetPath) {
  if (sourcePath === targetPath) return cloneTree(tree);
  if (targetPath.startsWith(`${sourcePath}.`)) {
    throw new Error("Ein Knoten kann nicht in seinen eigenen Unterbaum verschoben werden.");
  }
  const subtree = cloneTree(getNodeAtPath(tree, sourcePath));
  if (!subtree) throw new Error("Der zu verschiebende Knoten wurde nicht gefunden.");
  const withoutSource = setNodeAtPath(tree, sourcePath, null);
  return setNodeAtPath(withoutSource, targetPath, subtree);
}

