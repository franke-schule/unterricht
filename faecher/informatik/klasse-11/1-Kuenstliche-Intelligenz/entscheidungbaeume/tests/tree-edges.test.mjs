import test from "node:test";
import assert from "node:assert/strict";
import { calculateTreeEdges } from "../ui/tree-edges.mjs";

const parent = { left: 100, right: 300, top: 20, bottom: 80 };

test("Eine Kante beginnt an der Parent-Unterkante und endet an der Child-Oberkante", () => {
  const [edge] = calculateTreeEdges(parent, [
    { left: 130, right: 270, top: 180, bottom: 230 },
  ]);

  assert.deepEqual(edge.start, { x: 200, y: 80 });
  assert.deepEqual(edge.end, { x: 200, y: 180 });
  assert.deepEqual(edge.split, { x: 200, y: 130 });
  assert.equal(edge.path, "M 200 80 V 130 H 200 V 180");
});

test("Zwei Child-Kanten verwenden denselben lückenlosen Parent- und Split-Anker", () => {
  const edges = calculateTreeEdges(parent, [
    { left: 10, right: 110, top: 200, bottom: 250 },
    { left: 330, right: 470, top: 220, bottom: 280 },
  ]);

  assert.equal(edges.length, 2);
  assert.deepEqual(edges[0].start, { x: 200, y: 80 });
  assert.deepEqual(edges[1].start, edges[0].start);
  assert.deepEqual(edges[0].split, { x: 200, y: 140 });
  assert.deepEqual(edges[1].split, edges[0].split);
  assert.deepEqual(edges[0].end, { x: 60, y: 200 });
  assert.deepEqual(edges[1].end, { x: 400, y: 220 });
});

test("Dynamische und unterschiedlich große Knoten bestimmen ihre Anker selbst", () => {
  const [edge] = calculateTreeEdges(
    { left: 17.5, right: 248.5, top: 11, bottom: 97.25 },
    [{ left: 310, right: 501, top: 244.75, bottom: 333 }],
  );

  assert.deepEqual(edge.start, { x: 133, y: 97.25 });
  assert.deepEqual(edge.end, { x: 405.5, y: 244.75 });
  assert.equal(edge.path.endsWith("H 405.5 V 244.75"), true);
});
