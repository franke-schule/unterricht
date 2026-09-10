import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, statSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { CLASSIFICATIONS } from "../data/monkeys.mjs";
import { FISH_DATASET, FISH_LABELS } from "../data/fish.mjs";
import {
  ENTROPY_QUIZ,
  calculateSplit,
  countLabels,
  entropyForCounts,
  entropyInformationGain,
  expectedTableValues,
  numericAnswer,
} from "../logic/fish-learning.mjs";
import { createFeatureNode, createLeafNode, evaluateTree } from "../logic/decision-tree.mjs";
import { createSemanticEvaluationUrl } from "../ui/semantic-answer.mjs";

const peaceful = () => createLeafNode(CLASSIFICATIONS.DOES_NOT_BITE);
const hostile = () => createLeafNode(CLASSIFICATIONS.BITES);
const treeDataset = FISH_DATASET.map((entry) => ({
  ...entry,
  classification: entry.classification === FISH_LABELS.PEACEFUL
    ? CLASSIFICATIONS.DOES_NOT_BITE
    : CLASSIFICATIONS.BITES,
}));

function referenceTree() {
  return createFeatureNode(
    "scalesBlue",
    createFeatureNode(
      "patternNone",
      peaceful(),
      createFeatureNode("bellyBlack", hostile(), peaceful()),
    ),
    createFeatureNode("bellyBlack", peaceful(), hostile()),
  );
}

function equivalentTieTree() {
  return createFeatureNode(
    "scalesBlue",
    createFeatureNode(
      "bellyBlack",
      createFeatureNode("patternNone", peaceful(), hostile()),
      peaceful(),
    ),
    createFeatureNode("bellyBlack", peaceful(), hostile()),
  );
}

test("Fischdatensatz enthält die geforderten neun gelabelten Trainingsdaten", () => {
  assert.equal(FISH_DATASET.length, 9);
  assert.deepEqual(countLabels(FISH_DATASET), { friedlich: 4, feindselig: 5 });
  assert.equal(new Set(FISH_DATASET.map((entry) => entry.id)).size, 9);
});

test("erste vier Splits liefern die geforderten Fehler und Informationsgewinne", () => {
  assert.deepEqual(
    Object.fromEntries(["scalesBlue", "patternNone", "bellyBlack", "finsYellow"].map((feature) => {
      const split = calculateSplit(FISH_DATASET, feature);
      return [feature, { before: split.errorsBefore, after: split.errorsAfter, gain: split.informationGain }];
    })),
    {
      scalesBlue: { before: 4, after: 3, gain: 1 },
      patternNone: { before: 4, after: 4, gain: 0 },
      bellyBlack: { before: 4, after: 4, gain: 0 },
      finsYellow: { before: 4, after: 4, gain: 0 },
    },
  );
  assert.deepEqual(expectedTableValues(FISH_DATASET, "scalesBlue"), {
    before: 4,
    row0Peaceful: 3,
    row0Hostile: 2,
    row0Errors: 2,
    row1Peaceful: 1,
    row1Hostile: 3,
    row1Errors: 1,
    after: 3,
    gain: 1,
  });
});

test("blaue Teilmenge erkennt Gleichstand und orange Teilmenge Bauchfarbe", () => {
  const blue = FISH_DATASET.filter((entry) => entry.features.scalesBlue);
  const orange = FISH_DATASET.filter((entry) => !entry.features.scalesBlue);
  assert.equal(calculateSplit(blue, "patternNone").informationGain, 1);
  assert.equal(calculateSplit(blue, "bellyBlack").informationGain, 1);
  assert.equal(calculateSplit(blue, "finsYellow").informationGain, 0);
  assert.equal(calculateSplit(orange, "patternNone").informationGain, 0);
  assert.equal(calculateSplit(orange, "bellyBlack").informationGain, 1);
  assert.equal(calculateSplit(orange, "finsYellow").informationGain, 0);
});

test("letzter Split Blau/Punkte wird durch Bauchfarbe fehlerfrei", () => {
  const bluePoints = FISH_DATASET.filter((entry) => entry.features.scalesBlue && !entry.features.patternNone);
  assert.equal(bluePoints.length, 3);
  assert.deepEqual(
    { belly: calculateSplit(bluePoints, "bellyBlack").informationGain, fins: calculateSplit(bluePoints, "finsYellow").informationGain },
    { belly: 1, fins: 0 },
  );
});

test("Referenzbaum und fachlich äquivalenter Gleichstandsbaum werden logisch erkannt", () => {
  for (const tree of [referenceTree(), equivalentTieTree()]) {
    const result = evaluateTree(treeDataset, tree);
    assert.equal(result.complete, true);
    assert.equal(result.correct, 9);
    assert.equal(result.accuracy, 1);
  }
});

test("Zahleneingaben und Entropieformeln behandeln typische Eingaben robust", () => {
  assert.equal(numericAnswer(" 1 "), 1);
  assert.equal(numericAnswer("0,5"), 0.5);
  assert.equal(numericAnswer(""), null);
  assert.equal(entropyForCounts(8, 0), 0);
  assert.equal(entropyForCounts(5, 5), 1);
  assert.ok(Math.abs(entropyInformationGain([10, 10], [[7, 0], [3, 10]]) - 0.4934) < 0.001);
});

test("Entropiequiz enthält fünf eindeutig auswertbare Fragen", () => {
  assert.equal(ENTROPY_QUIZ.length, 5);
  ENTROPY_QUIZ.forEach((item) => {
    assert.equal(item.options.length, 4);
    assert.ok(item.correct >= 0 && item.correct < item.options.length);
    assert.ok(item.feedback.length > 15);
  });
});

test("Aufgabe 3 ist verlinkt und nutzt die vorhandene semantische Aufgaben-ID", async () => {
  const [index, page, tasks] = await Promise.all([
    readFile(new URL("../../../index.html", import.meta.url), "utf8"),
    readFile(new URL("../../aufgabe3.html", import.meta.url), "utf8"),
    readFile(new URL("../../../../../../apps-script/Tasks.gs", import.meta.url), "utf8"),
  ]);
  assert.match(index, /1-Kuenstliche-Intelligenz\/aufgabe3\.html/);
  assert.match(page, /ui\/task3\.mjs/);
  assert.match(page, /id="entropie"/);
  assert.match(tasks, /'11-3a-f'/);
  const url = createSemanticEvaluationUrl("https://example.test/exec", { callback: "cb", taskId: "11-3a-f", answer: "Test" });
  assert.match(url, /taskId=11-3a-f/);
});

test("Aufgabenseite besitzt eindeutige IDs, gültige lokale Links und responsive Breakpoints", async () => {
  const pageUrl = new URL("../../aufgabe3.html", import.meta.url);
  const [page, css, script] = await Promise.all([
    readFile(pageUrl, "utf8"),
    readFile(new URL("../task3.css", import.meta.url), "utf8"),
    readFile(new URL("../ui/task3.mjs", import.meta.url), "utf8"),
  ]);
  const ids = [...page.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length, "HTML-IDs müssen eindeutig sein");

  for (const match of page.matchAll(/(?:href|src)="([^"#]+)(?:#[^"]*)?"/g)) {
    const value = match[1].split("?")[0];
    if (/^(?:https?:|mailto:|data:)/.test(value)) continue;
    const targetUrl = new URL(value, pageUrl);
    const target = fileURLToPath(targetUrl);
    assert.equal(existsSync(target), true, `Lokales Ziel fehlt: ${value}`);
    if (statSync(target).isDirectory()) {
      assert.equal(existsSync(fileURLToPath(new URL("index.html", targetUrl))), true, `Index fehlt: ${value}`);
    }
  }

  ["1050px", "760px", "430px"].forEach((breakpoint) => assert.match(css, new RegExp(breakpoint)));
  assert.match(page, /id="split-intro"/);
  assert.match(page, /class="fish-progress" role="tablist"/);
  assert.equal([...page.matchAll(/data-step-tab="[^"]+"/g)].length, 7);
  assert.equal([...page.matchAll(/data-step-panel="[^"]+"/g)].length, 7);
  assert.match(page, /id="erster-split"[^>]*hidden/);
  assert.match(page, /id="intro-before"/);
  assert.match(page, /id="intro-blue-errors"/);
  assert.match(page, /id="intro-orange-errors"/);
  assert.match(page, /class="fish-tree-builder-layout"/);
  assert.match(page, /class="fish-tree-toolbox"/);
  assert.match(css, /@keyframes intro-separate/);
  assert.match(css, /\.fish-tree-toolbox \{ position: sticky;/);
  assert.match(css, /\.fish-tree-viewport \{ height: calc\(100vh - 125px\);/);
  assert.match(css, /\.tabs-ready \.fish-tab-panel/);
  assert.match(script, /function showStep\(stepId/);
  assert.match(script, /renderIntroUnsplit\(true\)/);
  assert.match(script, /renderIntroSplit\("blue"\)/);
  assert.match(script, /renderIntroSplit\("orange"\)/);
  assert.match(script, /queueIntro\(13700, finishIntro\)/);
});
