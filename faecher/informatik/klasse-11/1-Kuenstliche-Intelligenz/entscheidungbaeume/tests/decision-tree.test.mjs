import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import {
  ADVANCED_BITES_IDS,
  ADVANCED_DATASET,
  ADVANCED_DOES_NOT_BITE_IDS,
  ADVANCED_FEATURE_KEYS,
  CLASSIFICATIONS,
  EASY_BITES_IDS,
  EASY_DATASET,
  EASY_DOES_NOT_BITE_IDS,
  EASY_FEATURE_KEYS,
} from "../data/monkeys.mjs";
import {
  classifyMonkey,
  createFeatureNode,
  createLeafNode,
  evaluateTree,
  findIndistinguishableOpposites,
  validateTree,
} from "../logic/decision-tree.mjs";

const bitesLeaf = () => createLeafNode(CLASSIFICATIONS.BITES);
const safeLeaf = () => createLeafNode(CLASSIFICATIONS.DOES_NOT_BITE);

function buildSeparatingTree(dataset, featureKeys, defaultClass = CLASSIFICATIONS.DOES_NOT_BITE) {
  if (dataset.length === 0) return createLeafNode(defaultClass);
  if (dataset.every((entry) => entry.classification === dataset[0].classification)) {
    return createLeafNode(dataset[0].classification);
  }

  for (const feature of featureKeys) {
    const yes = dataset.filter((entry) => entry.features[feature]);
    const no = dataset.filter((entry) => !entry.features[feature]);
    if (yes.length > 0 && no.length > 0) {
      const remaining = featureKeys.filter((key) => key !== feature);
      return createFeatureNode(
        feature,
        buildSeparatingTree(yes, remaining, defaultClass),
        buildSeparatingTree(no, remaining, defaultClass),
      );
    }
  }
  throw new Error("Trainingsdaten sind im verfügbaren Merkmalsraum nicht trennbar.");
}

function flipLeaves(node) {
  if (node.type === "leaf") {
    return createLeafNode(node.prediction === CLASSIFICATIONS.BITES
      ? CLASSIFICATIONS.DOES_NOT_BITE
      : CLASSIFICATIONS.BITES);
  }
  return createFeatureNode(node.feature, flipLeaves(node.yes), flipLeaves(node.no));
}

test("Klassifikation folgt Ja- und Nein-Zweigen bis zum Blatt", () => {
  const simpleTree = createFeatureNode("tongueOut", bitesLeaf(), safeLeaf());
  assert.equal(classifyMonkey({ features: { tongueOut: true } }, simpleTree).prediction, CLASSIFICATIONS.BITES);
  assert.equal(classifyMonkey({ features: { tongueOut: false } }, simpleTree).prediction, CLASSIFICATIONS.DOES_NOT_BITE);

  const multiLevelTree = createFeatureNode(
    "openMouth",
    createFeatureNode("teethVisible", bitesLeaf(), safeLeaf()),
    safeLeaf(),
  );
  const result = classifyMonkey({ features: { openMouth: true, teethVisible: true } }, multiLevelTree);
  assert.equal(result.prediction, CLASSIFICATIONS.BITES);
  assert.equal(result.path.length, 2);
});

test("Baumvalidierung erkennt leere und fehlende Zweige", () => {
  assert.deepEqual(validateTree(null), { valid: false, issues: ["no-root"] });
  assert.equal(validateTree(createFeatureNode("openMouth", bitesLeaf(), null)).valid, false);
  assert.ok(validateTree(createFeatureNode("openMouth", bitesLeaf(), null)).issues.includes("missing-no"));
  assert.ok(validateTree(createFeatureNode("openMouth", null, safeLeaf())).issues.includes("missing-yes"));
  assert.equal(validateTree(createFeatureNode("openMouth", bitesLeaf(), safeLeaf())).valid, true);
});

test("Trainingsdaten besitzen die erwarteten Mengen, Klassen und Reihenfolgen", () => {
  assert.equal(EASY_DATASET.length, 12);
  assert.equal(ADVANCED_DATASET.length, 26);
  assert.deepEqual(EASY_DATASET.filter((entry) => entry.classification === CLASSIFICATIONS.BITES).map((entry) => entry.id), EASY_BITES_IDS);
  assert.deepEqual(EASY_DATASET.filter((entry) => entry.classification === CLASSIFICATIONS.DOES_NOT_BITE).map((entry) => entry.id), EASY_DOES_NOT_BITE_IDS);
  assert.deepEqual(ADVANCED_DATASET.filter((entry) => entry.classification === CLASSIFICATIONS.BITES).map((entry) => entry.id), ADVANCED_BITES_IDS);
  assert.deepEqual(ADVANCED_DATASET.filter((entry) => entry.classification === CLASSIFICATIONS.DOES_NOT_BITE).map((entry) => entry.id), ADVANCED_DOES_NOT_BITE_IDS);

  for (const dataset of [EASY_DATASET, ADVANCED_DATASET]) {
    assert.equal(new Set(dataset.map((entry) => entry.id)).size, dataset.length);
    for (const entry of dataset) {
      assert.equal(existsSync(new URL(`../assets/monkeys/${entry.imageFile}`, import.meta.url)), true, `${entry.imageFile} fehlt`);
    }
  }
});

test("Unterschiedliche Klassen sind im jeweiligen Merkmalsraum unterscheidbar", () => {
  assert.deepEqual(findIndistinguishableOpposites(EASY_DATASET, EASY_FEATURE_KEYS), []);
  assert.deepEqual(findIndistinguishableOpposites(ADVANCED_DATASET, ADVANCED_FEATURE_KEYS), []);
});

test("Auswertung deckt vollständig, teilweise und komplett falsch ab", () => {
  const solution = buildSeparatingTree(EASY_DATASET, EASY_FEATURE_KEYS);
  const perfect = evaluateTree(EASY_DATASET, solution);
  assert.equal(perfect.complete, true);
  assert.equal(perfect.correct, EASY_DATASET.length);
  assert.equal(perfect.accuracy, 1);

  const partial = evaluateTree(EASY_DATASET, bitesLeaf());
  assert.ok(partial.correct > 0 && partial.correct < partial.total);

  const wrong = evaluateTree(EASY_DATASET, flipLeaves(solution));
  assert.equal(wrong.correct, 0);
  assert.equal(wrong.accuracy, 0);

  const incomplete = evaluateTree(EASY_DATASET, createFeatureNode("openMouth", bitesLeaf(), null));
  assert.equal(incomplete.complete, false);
  assert.equal(incomplete.results.length, 0);
});

test("Auch die fortgeschrittenen Trainingsdaten lassen sich vollständig trennen", () => {
  const solution = buildSeparatingTree(ADVANCED_DATASET, ADVANCED_FEATURE_KEYS);
  assert.equal(evaluateTree(ADVANCED_DATASET, solution).accuracy, 1);
});

