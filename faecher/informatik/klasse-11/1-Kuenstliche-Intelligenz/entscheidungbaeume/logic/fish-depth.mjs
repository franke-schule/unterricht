import { FISH_TREE_DEPTH_RESULTS, percentageFor } from "./fish-learning.mjs";

// Die Rohwerte liegen bei den bestehenden Fisch-Lernfunktionen. Diese Ansicht
// ergänzt nur die Darstellung für die Tabelle in Aufgabe 4.
export const FISH_DEPTH_RESULTS = Object.freeze(FISH_TREE_DEPTH_RESULTS.map((result) => Object.freeze({
  depth: result.depth,
  trainingPercent: Math.round(percentageFor(result.trainingCorrect, result.trainingTotal) * 10) / 10,
  testPercent: Math.round(percentageFor(result.testCorrect, result.testTotal) * 10) / 10,
  wrongFish: result.wrongTestFish,
})));

export function normalizeAnswerText(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/ä/g, "ae").replace(/ö/g, "oe").replace(/ü/g, "ue").replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, " ").trim();
}

export function percentageMatches(value, expected) {
  const normalized = String(value ?? "").trim().replace("%", "").replace(",", ".");
  if (!normalized) return false;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) && Math.abs(parsed - expected) < 0.11;
}

export function wrongFishMatches(value, expectedFish) {
  const text = normalizeAnswerText(value);
  if (!text) return false;
  const fishNumber = expectedFish.replace(/[^0-9]/g, "");
  if (new RegExp(`\\b(?:t|testfisch|fisch)\\s*${fishNumber}\\b`).test(text)) return true;
  const isOrange = text.includes("orange");
  const blackBelly = text.includes("schwarz") && text.includes("bauch");
  return expectedFish === "T3"
    ? isOrange && blackBelly && (text.includes("ohne muster") || text.includes("kein muster"))
    : isOrange && blackBelly && (text.includes("punkte") || text.includes("punktmuster"));
}
