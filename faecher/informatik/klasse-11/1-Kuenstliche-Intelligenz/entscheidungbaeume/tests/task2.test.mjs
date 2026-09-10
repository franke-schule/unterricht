import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import {
  ADVANCED_DATASET,
  CLASSIFICATIONS,
  EASY_DATASET,
} from "../data/monkeys.mjs";
import {
  ADVANCED_TEST_DATA,
  COMPARISON_TREE_A,
  COMPARISON_TREE_B,
  EASY_TEST_DATA,
} from "../data/test-data.mjs";
import {
  createFeatureNode,
  createLeafNode,
  evaluateTree,
} from "../logic/decision-tree.mjs";
import {
  accuracy,
  appendUniqueResult,
  confusionMatrix,
  createTestResult,
} from "../logic/testing.mjs";

const { BITES, DOES_NOT_BITE } = CLASSIFICATIONS;

function easyReferenceTree() {
  return createFeatureNode(
    "smilingMouth",
    createLeafNode(BITES),
    createFeatureNode("xEyes", createLeafNode(BITES), createLeafNode(DOES_NOT_BITE)),
  );
}

test("Testdaten besitzen die geforderten Größen und Klassenverteilungen", () => {
  assert.equal(EASY_TEST_DATA.length, 8);
  assert.equal(EASY_TEST_DATA.filter((entry) => entry.actual === BITES).length, 4);
  assert.equal(EASY_TEST_DATA.filter((entry) => entry.actual === DOES_NOT_BITE).length, 4);
  assert.equal(ADVANCED_TEST_DATA.length, 13);
  assert.equal(ADVANCED_TEST_DATA.filter((entry) => entry.actual === BITES).length, 4);
  assert.equal(ADVANCED_TEST_DATA.filter((entry) => entry.actual === DOES_NOT_BITE).length, 9);
});

test("Testdaten überschneiden sich nicht mit Trainingsdaten derselben Variante", () => {
  for (const [training, testing] of [[EASY_DATASET, EASY_TEST_DATA], [ADVANCED_DATASET, ADVANCED_TEST_DATA]]) {
    const trainingIds = new Set(training.map((entry) => entry.id));
    assert.deepEqual(testing.filter((entry) => trainingIds.has(entry.id)), []);
    assert.equal(new Set(testing.map((entry) => entry.id)).size, testing.length);
    testing.forEach((entry) => assert.equal(
      existsSync(new URL(`../assets/monkeys/${entry.imageFile}`, import.meta.url)),
      true,
      `${entry.imageFile} fehlt`,
    ));
  }
});

test("Konfusionsmatrix bildet TP, FP, FN und TN korrekt ab", () => {
  const results = [
    { monkeyId: "tp", actual: BITES, predicted: BITES },
    { monkeyId: "fp", actual: DOES_NOT_BITE, predicted: BITES },
    { monkeyId: "fn", actual: BITES, predicted: DOES_NOT_BITE },
    { monkeyId: "tn", actual: DOES_NOT_BITE, predicted: DOES_NOT_BITE },
  ];
  assert.deepEqual(confusionMatrix(results), {
    truePositive: 1,
    falsePositive: 1,
    falseNegative: 1,
    trueNegative: 1,
  });
  assert.equal(accuracy(results), 0.5);
  assert.equal(accuracy([]), null);
});

test("Ein Testdatum wird höchstens einmal aufgenommen", () => {
  const result = { monkeyId: "03", actual: BITES, predicted: BITES };
  const once = appendUniqueResult([], result);
  const twice = appendUniqueResult(once, result);
  assert.equal(once.length, 1);
  assert.equal(twice.length, 1);
  assert.deepEqual(confusionMatrix(twice), {
    truePositive: 1,
    falsePositive: 0,
    falseNegative: 0,
    trueNegative: 0,
  });
});

test("Beide Vergleichsbäume erreichen 12 von 12 Trainingsdaten", () => {
  assert.equal(evaluateTree(EASY_DATASET, COMPARISON_TREE_A).correct, 12);
  assert.equal(evaluateTree(EASY_DATASET, COMPARISON_TREE_B).correct, 12);
});

test("Vergleichsbäume behalten die unterschiedliche Reihenfolge ihrer ersten Merkmale", () => {
  assert.equal(COMPARISON_TREE_A.feature, "xEyes");
  assert.equal(COMPARISON_TREE_A.no.feature, "teethVisible");
  assert.equal(COMPARISON_TREE_B.feature, "teethVisible");
  assert.equal(COMPARISON_TREE_B.no.feature, "xEyes");
});

test("Äffchen 03 enthält die im Training unbekannte Kombination aus X-Augen und sichtbaren Zähnen", () => {
  const monkey = EASY_TEST_DATA.find((entry) => entry.id === "03");
  assert.equal(monkey.features.xEyes, true);
  assert.equal(monkey.features.teethVisible, true);
  assert.equal(EASY_DATASET.some((entry) => entry.features.xEyes && entry.features.teethVisible), false);
});

test("Originaler Easy-Zweimerkmal-Baum klassifiziert 8 von 8 Testaffen korrekt", () => {
  const tree = easyReferenceTree();
  const results = EASY_TEST_DATA.map((monkey) => createTestResult(monkey, tree));
  assert.equal(results.filter((result) => result.correct).length, 8);
  assert.deepEqual(
    results.map((result) => [result.monkeyId, result.predicted]),
    [
      ["03", BITES],
      ["05", BITES],
      ["10", DOES_NOT_BITE],
      ["11", BITES],
      ["13", DOES_NOT_BITE],
      ["16", DOES_NOT_BITE],
      ["19", BITES],
      ["20", DOES_NOT_BITE],
    ],
  );
});

test("Baum A erreicht 8/8, Baum B 7/8 und nur Äffchen 03 unterscheidet sich", () => {
  const resultsA = EASY_TEST_DATA.map((monkey) => createTestResult(monkey, COMPARISON_TREE_A));
  const resultsB = EASY_TEST_DATA.map((monkey) => createTestResult(monkey, COMPARISON_TREE_B));
  assert.equal(resultsA.filter((result) => result.correct).length, 8);
  assert.equal(resultsB.filter((result) => result.correct).length, 7);
  assert.deepEqual(confusionMatrix(resultsA), {
    truePositive: 4,
    falsePositive: 0,
    falseNegative: 0,
    trueNegative: 4,
  });
  assert.deepEqual(confusionMatrix(resultsB), {
    truePositive: 3,
    falsePositive: 0,
    falseNegative: 1,
    trueNegative: 4,
  });
  assert.deepEqual(
    resultsA.filter((result, index) => result.predicted !== resultsB[index].predicted).map((result) => result.monkeyId),
    ["03"],
  );
});
