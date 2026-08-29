import assert from "node:assert/strict";
import {
  gridPointKey,
  nextSelectablePoint,
  pointInRange,
} from "../components/point-vector-grid.mjs";

const xRange = { min: -5, max: 5 };
const yRange = { min: -4, max: 4 };

assert.equal(gridPointKey({ x: 2, y: -3 }), "2,-3");
assert.equal(pointInRange({ x: 0, y: 0 }, xRange, yRange), true);
assert.equal(pointInRange({ x: 6, y: 0 }, xRange, yRange), false);
assert.equal(pointInRange({ x: 1.5, y: 0 }, xRange, yRange), false);
assert.deepEqual(
  nextSelectablePoint({ x: -1, y: 0 }, { x: 1, y: 0 }, { x: 0, y: 0 }),
  { x: 1, y: 0 }
);
assert.deepEqual(
  nextSelectablePoint({ x: 2, y: 2 }, { x: 0, y: -1 }, { x: 0, y: 0 }),
  { x: 2, y: 1 }
);

console.log("Die Vektorraster-Hilfsfunktionen begrenzen Endpunkte und überspringen den festen Ursprung.");
