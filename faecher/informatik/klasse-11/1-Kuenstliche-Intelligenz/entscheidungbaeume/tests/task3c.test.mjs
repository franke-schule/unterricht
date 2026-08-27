import test from "node:test";
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { FISH_DATASET, FISH_LABELS, FISH_TEST_DATASET } from "../data/fish.mjs";
import { MATRIX_ANSWERS, QUIZ, fishConfusionMatrix, predictFish } from "../ui/task3c.mjs";

test("Fisch-Testdaten sind unabhängig von den neun Trainingsdaten", () => {
  assert.equal(FISH_TEST_DATASET.length, 5);
  assert.equal(new Set(FISH_TEST_DATASET.map((fish) => fish.id)).size, 5);
  assert.deepEqual(FISH_TEST_DATASET.filter((fish) => FISH_DATASET.some((training) => training.id === fish.id)), []);
  assert.deepEqual(FISH_TEST_DATASET.map((fish) => fish.classification), [
    FISH_LABELS.PEACEFUL, FISH_LABELS.HOSTILE, FISH_LABELS.PEACEFUL, FISH_LABELS.HOSTILE, FISH_LABELS.PEACEFUL,
  ]);
});

test("Referenzbaum liefert die fachlich korrekte Konfusionsmatrix und Genauigkeit", () => {
  assert.deepEqual(FISH_TEST_DATASET.map((fish) => predictFish(fish)), [
    FISH_LABELS.PEACEFUL, FISH_LABELS.HOSTILE, FISH_LABELS.PEACEFUL, FISH_LABELS.PEACEFUL, FISH_LABELS.PEACEFUL,
  ]);
  assert.deepEqual(fishConfusionMatrix(), {
    "peaceful-peaceful": 3, "peaceful-hostile": 0, "hostile-peaceful": 1, "hostile-hostile": 1,
  });
  assert.deepEqual(MATRIX_ANSWERS, {
    "peaceful-peaceful": 3, "peaceful-hostile": 0, "peaceful-total": 3,
    "hostile-peaceful": 1, "hostile-hostile": 1, "hostile-total": 2,
    "predicted-peaceful-total": 4, "predicted-hostile-total": 1, total: 5,
  });
});

test("Quiz besitzt mindestens zwei richtige Antworten pro eindeutiger Frage", () => {
  assert.ok(QUIZ.length >= 5 && QUIZ.length <= 7);
  QUIZ.forEach((item) => {
    assert.ok(item.correct.length >= 2);
    assert.ok(item.correct.every((answer) => item.options.some(([value]) => value === answer)));
  });
});

test("Aufgabe 3c ist registriert und verwendet Reiter, Matrix und Checkbox-Quiz", async () => {
  const [index, page, script, css] = await Promise.all([
    readFile(new URL("../../../index.html", import.meta.url), "utf8"),
    readFile(new URL("../../aufgabe3c.html", import.meta.url), "utf8"),
    readFile(new URL("../ui/task3c.mjs", import.meta.url), "utf8"),
    readFile(new URL("../task3c.css", import.meta.url), "utf8"),
  ]);
  assert.match(index, /Aufgabe 3c - Klassifikation der Testdaten - Fischdaten/);
  assert.match(page, /class="fish-progress task3c-tabs" role="tablist"/);
  assert.equal([...page.matchAll(/data-step-tab="[^"]+"/g)].length, 7);
  assert.equal([...page.matchAll(/data-step-panel="[^"]+"/g)].length, 7);
  assert.match(page, /Konfusionsmatrix der fünf Testfische/);
  assert.match(script, /input\.type = "checkbox"/);
  assert.match(script, /renderTreeEdges/);
  assert.match(script, /informatik11-fish-test-task3c-v1/);
  assert.doesNotMatch(script, /informatik11-fish-tree-task3-v1/);
  assert.match(css, /@media \(max-width: 700px\)/);
  assert.equal(existsSync(new URL("../../aufgabe3c.html", import.meta.url)), true);
});
