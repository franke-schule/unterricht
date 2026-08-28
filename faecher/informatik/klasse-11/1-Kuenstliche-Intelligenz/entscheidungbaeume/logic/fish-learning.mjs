import { FISH_FEATURES, FISH_LABELS } from "../data/fish.mjs";

export function countLabels(dataset) {
  return dataset.reduce((counts, entry) => {
    counts[entry.classification] = (counts[entry.classification] ?? 0) + 1;
    return counts;
  }, { [FISH_LABELS.PEACEFUL]: 0, [FISH_LABELS.HOSTILE]: 0 });
}

export function classificationErrors(dataset) {
  const counts = countLabels(dataset);
  return Math.min(counts[FISH_LABELS.PEACEFUL], counts[FISH_LABELS.HOSTILE]);
}

export function calculateSplit(dataset, featureKey) {
  const definition = FISH_FEATURES[featureKey];
  if (!definition) throw new Error(`Unbekanntes Fischattribut: ${featureKey}`);
  const groups = [true, false].map((value) => {
    const entries = dataset.filter((entry) => Boolean(entry.features[featureKey]) === value);
    const counts = countLabels(entries);
    return {
      value: value ? definition.yes : definition.no,
      peaceful: counts[FISH_LABELS.PEACEFUL],
      hostile: counts[FISH_LABELS.HOSTILE],
      errors: classificationErrors(entries),
      entries,
    };
  });
  const errorsBefore = classificationErrors(dataset);
  const errorsAfter = groups.reduce((sum, group) => sum + group.errors, 0);
  return { featureKey, groups, errorsBefore, errorsAfter, informationGain: errorsBefore - errorsAfter };
}

export function expectedTableValues(dataset, featureKey) {
  const split = calculateSplit(dataset, featureKey);
  return {
    before: split.errorsBefore,
    row0Peaceful: split.groups[0].peaceful,
    row0Hostile: split.groups[0].hostile,
    row0Errors: split.groups[0].errors,
    row1Peaceful: split.groups[1].peaceful,
    row1Hostile: split.groups[1].hostile,
    row1Errors: split.groups[1].errors,
    after: split.errorsAfter,
    gain: split.informationGain,
  };
}

export function numericAnswer(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const normalized = String(value ?? "").trim().replace(",", ".");
  if (normalized === "") return null;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function entropyForCounts(first, second) {
  const total = first + second;
  if (total === 0) return 0;
  return [first / total, second / total]
    .filter((probability) => probability > 0)
    .reduce((sum, probability) => sum - probability * Math.log2(probability), 0);
}

export function entropyInformationGain(parentCounts, childCounts) {
  const total = parentCounts.reduce((sum, count) => sum + count, 0);
  if (total === 0) return 0;
  const before = entropyForCounts(...parentCounts);
  const weightedAfter = childCounts.reduce((sum, counts) => {
    const childTotal = counts[0] + counts[1];
    return sum + (childTotal / total) * entropyForCounts(...counts);
  }, 0);
  return before - weightedAfter;
}

export const ENTROPY_QUIZ = Object.freeze([
  Object.freeze({
    question: "Was beschreibt die Entropie einer Datenmenge bei einem Entscheidungsbaum?",
    options: ["Die Anzahl der Attribute", "Wie stark die Klassen innerhalb der Datenmenge vermischt sind", "Die Tiefe des Entscheidungsbaums", "Die Anzahl der Trainingsdaten"],
    correct: 1,
    feedback: "Die Entropie ist ein Maß für die Unreinheit beziehungsweise Durchmischung der Klassen.",
  }),
  Object.freeze({
    question: "Eine Gruppe enthält 8 friedliche und 0 feindselige Fische. Welche Entropie besitzt sie?",
    options: ["0", "0,5", "1", "8"],
    correct: 0,
    feedback: "Eine vollständig reine Gruppe besitzt die Entropie 0.",
  }),
  Object.freeze({
    question: "Eine Gruppe besteht bei zwei Klassen genau zur Hälfte aus beiden Klassen. Welche Aussage trifft zu?",
    options: ["Die Entropie ist 0.", "Die Entropie ist maximal und beträgt 1.", "Der Informationsgewinn ist automatisch 1.", "Ein weiterer Split ist grundsätzlich unmöglich."],
    correct: 1,
    feedback: "Bei zwei gleich großen Klassen ist die Unsicherheit maximal; die Entropie beträgt 1.",
  }),
  Object.freeze({
    question: "E(X) ist 1, die gewichtete Entropie nach dem Split ist 0,4. Wie groß ist der Informationsgewinn?",
    options: ["0,4", "0,6", "1,4", "2,5"],
    correct: 1,
    feedback: "IG = 1 − 0,4 = 0,6.",
  }),
  Object.freeze({
    question: "Attribut A hat IG 0,18 und Attribut B hat IG 0,47. Welches Attribut sollte gewählt werden?",
    options: ["Attribut A", "Attribut B", "Beide sind gleich gut", "Das Attribut mit dem kleineren Informationsgewinn"],
    correct: 1,
    feedback: "Das Attribut mit dem größeren Informationsgewinn erzeugt nach diesem Kriterium die bessere Aufteilung.",
  }),
]);

// Ergebnisse der mit ENTER Online erstellten Bäume. Die Tiefe zählt die
// Entscheidungsebenen und bildet die gemeinsame Grundlage für Aufgabe 4.
export const FISH_TREE_DEPTH_RESULTS = Object.freeze([
  Object.freeze({ depth: 1, trainingCorrect: 6, trainingTotal: 9, testCorrect: 4, testTotal: 5, wrongTestFish: "T3" }),
  Object.freeze({ depth: 2, trainingCorrect: 8, trainingTotal: 9, testCorrect: 4, testTotal: 5, wrongTestFish: "T4" }),
  Object.freeze({ depth: 3, trainingCorrect: 9, trainingTotal: 9, testCorrect: 4, testTotal: 5, wrongTestFish: "T4" }),
]);

export function percentageFor(correct, total) {
  return total === 0 ? 0 : (correct / total) * 100;
}
