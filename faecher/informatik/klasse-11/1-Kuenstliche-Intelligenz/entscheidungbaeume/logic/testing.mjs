import { CLASSIFICATIONS } from "../data/monkeys.mjs";
import { classifyMonkey } from "./decision-tree.mjs";

export function createTestResult(monkey, tree) {
  const { prediction, path } = classifyMonkey(monkey, tree);
  return Object.freeze({
    monkeyId: monkey.id,
    actual: monkey.actual,
    predicted: prediction,
    correct: prediction === monkey.actual,
    path,
  });
}

export function confusionMatrix(results) {
  const matrix = {
    truePositive: 0,
    falsePositive: 0,
    falseNegative: 0,
    trueNegative: 0,
  };

  for (const result of results) {
    if (result.predicted === CLASSIFICATIONS.BITES) {
      if (result.actual === CLASSIFICATIONS.BITES) matrix.truePositive += 1;
      else matrix.falsePositive += 1;
    } else if (result.actual === CLASSIFICATIONS.BITES) {
      matrix.falseNegative += 1;
    } else {
      matrix.trueNegative += 1;
    }
  }
  return matrix;
}

export function accuracy(results) {
  if (results.length === 0) return null;
  const matrix = confusionMatrix(results);
  return (matrix.truePositive + matrix.trueNegative) / results.length;
}

export function appendUniqueResult(results, nextResult) {
  if (results.some((result) => result.monkeyId === nextResult.monkeyId)) return results;
  return [...results, nextResult];
}
