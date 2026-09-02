import assert from "node:assert/strict";
import { angleAtElapsed, angularSpeed, circleVectors, frequencyFromPeriod, sectorPath, tangentialSpeed } from "../components/circle-kinematics.mjs";

assert.equal(angularSpeed(Math.PI, 2), Math.PI / 2);
assert.equal(tangentialSpeed(3, 2.5), 7.5);
assert.equal(frequencyFromPeriod(2), 0.5);
assert.equal(frequencyFromPeriod(4), 0.25);
assert.ok(Number.isNaN(frequencyFromPeriod(0)));
assert.equal(angleAtElapsed(Math.PI, 2, 0), 0);
assert.equal(angleAtElapsed(Math.PI, 2, 1), Math.PI / 2);
assert.equal(angleAtElapsed(Math.PI, 2, 2), Math.PI);
assert.equal(angleAtElapsed(Math.PI, 2, 5), Math.PI);

for (const angle of [0, Math.PI / 6, Math.PI / 2, Math.PI, Math.PI * 1.7]) {
  const vectors = circleVectors(angle, 130);
  const radiusVector = vectors.position;
  const tangentDotRadius = radiusVector.x * vectors.tangent.x + radiusVector.y * vectors.tangent.y;
  const inwardCrossRadius = radiusVector.x * vectors.inward.y - radiusVector.y * vectors.inward.x;
  const inwardDotRadius = radiusVector.x * vectors.inward.x + radiusVector.y * vectors.inward.y;
  assert.ok(Math.abs(tangentDotRadius) < 1e-10, `Tangente bei ${angle} muss senkrecht auf dem Radius stehen.`);
  assert.ok(Math.abs(inwardCrossRadius) < 1e-10, `Zentripetalkraft bei ${angle} muss radial verlaufen.`);
  assert.ok(inwardDotRadius < 0, `Zentripetalkraft bei ${angle} muss nach innen zeigen.`);
}

assert.equal(sectorPath(100, 100, 30, 0), "");
assert.match(sectorPath(100, 100, 30, Math.PI * 2), /A 30 30 0 1 1 100 130 A 30 30 0 1 1 100 70/);

console.log("Winkelverlauf, Kreisfrequenz, Bahngeschwindigkeit und orthogonale Kreisvektoren sind numerisch geprüft.");
