import assert from "node:assert/strict";
import {
  gridPointKey,
  hitWedgePoints,
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

// Hitbox der Kraftpfeile: Sektor entlang der Richtung statt eines Punktes.
const shortUp = hitWedgePoints({ x: 0, y: 1 });
const longUp = hitWedgePoints({ x: 0, y: 3 });
assert.equal(shortUp.length, 6);
// Der kurze Pfeil deckt die Linie von 0,4 bis 2 ab, der lange von 2 bis 3,5.
const radius = (corner) => Math.hypot(corner.x, corner.y);
assert.ok(Math.abs(Math.min(...shortUp.map(radius)) - 0.4) < 1e-9);
assert.ok(Math.abs(Math.max(...shortUp.map(radius)) - 2) < 1e-9);
assert.ok(Math.abs(Math.min(...longUp.map(radius)) - 2) < 1e-9);
assert.ok(Math.abs(Math.max(...longUp.map(radius)) - 3.5) < 1e-9);
// Die Sektoren benachbarter Richtungen überlappen nicht: 2 · 20 Grad < 45 Grad.
const angle = (corner) => (Math.atan2(corner.y, corner.x) * 180) / Math.PI;
const upAngles = shortUp.map(angle);
assert.ok(Math.min(...upAngles) >= 70 - 1e-9 && Math.max(...upAngles) <= 110 + 1e-9);
const diagonalAngles = hitWedgePoints({ x: 1, y: 1 }).map(angle);
assert.ok(Math.min(...diagonalAngles) >= 25 - 1e-9 && Math.max(...diagonalAngles) <= 65 + 1e-9);
// Der Sektor liegt auch bei einem verschobenen Ursprung richtig.
const shifted = hitWedgePoints({ x: 2, y: 3 }, { x: 2, y: 2 });
assert.ok(shifted.every((corner) => Math.abs(corner.x - 2) <= 1 && corner.y >= 2));

console.log("Die Vektorraster-Hilfsfunktionen begrenzen Endpunkte, überspringen den festen Ursprung und liefern Hitbox-Sektoren.");
