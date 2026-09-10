import {
  CLASSIFICATIONS,
  EASY_DATASET,
  getMonkeyById,
} from "./monkeys.mjs";

const { BITES, DOES_NOT_BITE } = CLASSIFICATIONS;

function labeledTestData(entries) {
  return Object.freeze(entries.map(([id, actual]) => Object.freeze({
    ...getMonkeyById(id),
    actual,
  })));
}

export const EASY_TEST_DATA = labeledTestData([
  ["03", BITES],
  ["05", BITES],
  ["10", DOES_NOT_BITE],
  ["11", BITES],
  ["13", DOES_NOT_BITE],
  ["16", DOES_NOT_BITE],
  ["19", BITES],
  ["20", DOES_NOT_BITE],
]);

export const ADVANCED_TEST_DATA = labeledTestData([
  ["03", DOES_NOT_BITE],
  ["06", BITES],
  ["08", DOES_NOT_BITE],
  ["11", DOES_NOT_BITE],
  ["13", BITES],
  ["18", BITES],
  ["20", DOES_NOT_BITE],
  ["26", DOES_NOT_BITE],
  ["27", DOES_NOT_BITE],
  ["29", DOES_NOT_BITE],
  ["31", DOES_NOT_BITE],
  ["34", BITES],
  ["21", DOES_NOT_BITE],
]);

export const TEST_DATASETS = Object.freeze({
  easy: EASY_TEST_DATA,
  advanced: ADVANCED_TEST_DATA,
});

const leaf = (id, prediction) => Object.freeze({ type: "leaf", id, prediction });
const feature = (id, featureKey, yes, no) => Object.freeze({
  type: "feature",
  id,
  feature: featureKey,
  yes,
  no,
});

function commonLowerTree(prefix) {
  return feature(
    `${prefix}-tongue`,
    "tongueOut",
    leaf(`${prefix}-tongue-yes`, DOES_NOT_BITE),
    feature(
      `${prefix}-smile`,
      "smilingMouth",
      leaf(`${prefix}-smile-yes`, BITES),
      leaf(`${prefix}-smile-no`, DOES_NOT_BITE),
    ),
  );
}

export const COMPARISON_TREE_A = feature(
  "a-x-eyes",
  "xEyes",
  leaf("a-x-eyes-yes", BITES),
  feature(
    "a-teeth",
    "teethVisible",
    leaf("a-teeth-yes", DOES_NOT_BITE),
    commonLowerTree("a"),
  ),
);

export const COMPARISON_TREE_B = feature(
  "b-teeth",
  "teethVisible",
  leaf("b-teeth-yes", DOES_NOT_BITE),
  feature(
    "b-x-eyes",
    "xEyes",
    leaf("b-x-eyes-yes", BITES),
    commonLowerTree("b"),
  ),
);

export const COMPARISON_TRAINING_DATA = EASY_DATASET;
