import assert from 'node:assert/strict';
import { SHIRT_CLASSES, SHIRT_TRAINING } from '../data/shirts.mjs';
import {
  BEST_K, EXPECTED, FOOD, HEFT_VALIDATION, HOUSES, HOUSE_AREAS, HOUSE_K, LARGE_K_PERSONS, NORMALIZE, OPEN_CELLS,
  OUTLIER, OUTLIER_POINT, REGRESSION, TEST_K, TEST_PERSONS, TRAINING_WITH_OUTLIER, UNEVEN_TRAINING, VALIDATION, VALIDATION_KS,
} from '../data/task8.mjs';
import { accuracy, confusionMatrix, distanceX, normalize, regress, transposeMatrix, validationTable } from '../logic/evaluation.mjs';
import { classify, countLabels, euclidean, formatDecimal, rankNeighbours } from '../logic/knn.mjs';
import { toSvg } from '../ui/knn-plot.mjs';

const ids = (neighbours) => neighbours.map(({ item }) => item.id);
const close = (actual, expected, message) => assert.ok(Math.abs(actual - expected) < 1e-9, message || actual + ' != ' + expected);
const toText = (neighbours) => neighbours.map(({ distance }) => distance.toFixed(2));

// Trainingsdaten mit Ausreißer
assert.equal(TRAINING_WITH_OUTLIER.length, 16);
assert.deepEqual(TRAINING_WITH_OUTLIER[15], { id: 16, x: 179, y: 100, label: 'S' });
assert.deepEqual(OUTLIER, TRAINING_WITH_OUTLIER[15]);
assert.deepEqual(countLabels(TRAINING_WITH_OUTLIER.map((item) => ({ item })), SHIRT_CLASSES), { S: 6, M: 4, L: 6 });
assert.equal(SHIRT_TRAINING.length, 15, 'SHIRT_TRAINING bleibt unverändert');

// R2a: N(182|99) mit Ausreißer
const r2a = rankNeighbours(OUTLIER_POINT, TRAINING_WITH_OUTLIER);
assert.deepEqual(ids(r2a).slice(0, 7), EXPECTED.outlier.ranking);
assert.deepEqual(toText(r2a).slice(0, 7), EXPECTED.outlier.distances);
Object.entries(EXPECTED.outlier.results).forEach(([k, { label, counts }]) => {
  const result = classify(OUTLIER_POINT, TRAINING_WITH_OUTLIER, Number(k));
  assert.equal(result.label, label, 'N, k = ' + k);
  assert.deepEqual(result.counts, counts, 'N, k = ' + k);
  assert.equal(result.tie, false, 'N, k = ' + k);
});
assert.equal(classify(OUTLIER_POINT, SHIRT_TRAINING, 1).label, 'M', 'Ohne Nr. 16 ergibt k = 1 die Größe M');

// R2b: sehr großes k mit den 15 Punkten aus Aufgabe 7
['A', 'B'].forEach((name) => {
  const person = LARGE_K_PERSONS[name];
  [1, 3, 5, 7].forEach((k) => {
    const result = classify(person, SHIRT_TRAINING, k);
    assert.equal(result.label, EXPECTED.largeK[name].small, name + ', k = ' + k);
    assert.equal(result.tie, false, name + ', k = ' + k);
  });
  const all = classify(person, SHIRT_TRAINING, 15);
  assert.equal(all.label, EXPECTED.largeK[name].k15, name + ', k = 15');
  assert.deepEqual(all.counts, EXPECTED.largeK.counts15, name + ', k = 15');
  assert.equal(all.tie, false);
});
const personA = rankNeighbours(LARGE_K_PERSONS.A, SHIRT_TRAINING);
assert.deepEqual(ids(personA).slice(0, 3), [1, 12, 5]);
assert.deepEqual(classify(LARGE_K_PERSONS.A, SHIRT_TRAINING, 7).counts, { S: 5, M: 2, L: 0 });
assert.deepEqual(classify(LARGE_K_PERSONS.B, SHIRT_TRAINING, 5).counts, { S: 0, M: 4, L: 1 });
assert.deepEqual(classify(LARGE_K_PERSONS.B, SHIRT_TRAINING, 7).counts, { S: 0, M: 4, L: 3 });

// Heftbeispiel
const heft = rankNeighbours(HEFT_VALIDATION.point, HEFT_VALIDATION.training);
assert.deepEqual(ids(heft), EXPECTED.heft.ranking);
assert.deepEqual(toText(heft), EXPECTED.heft.distances);
[1, 3, 5].forEach((k) => {
  const result = classify(HEFT_VALIDATION.point, HEFT_VALIDATION.training, k, { classes: ['blau', 'orange'] });
  assert.equal(result.label, EXPECTED.heft.results[k], 'Heft, k = ' + k);
  assert.equal(result.tie, false);
  assert.equal(result.label === HEFT_VALIDATION.truth ? 'korrekt' : 'falsch', EXPECTED.heft.cells[k]);
});
assert.deepEqual(classify(HEFT_VALIDATION.point, HEFT_VALIDATION.training, 3, { classes: ['blau', 'orange'] }).counts, { blau: 2, orange: 1 });
assert.deepEqual(classify(HEFT_VALIDATION.point, HEFT_VALIDATION.training, 5, { classes: ['blau', 'orange'] }).counts, { blau: 3, orange: 2 });

// Validierung: Tabelle, Summen, bestes k
const { rows, sums } = validationTable(VALIDATION, TRAINING_WITH_OUTLIER, VALIDATION_KS);
rows.forEach((row) => VALIDATION_KS.forEach((k) => assert.equal(row.results[k].label, EXPECTED.validation.table[row.id][k], row.id + ', k = ' + k)));
assert.deepEqual(sums, EXPECTED.validation.sums);
const best = VALIDATION_KS.filter((k) => sums[k] === Math.max(...Object.values(sums)));
assert.deepEqual(best, [3], 'k = 3 ist das eindeutig beste k');
assert.equal(BEST_K, 3);
VALIDATION.forEach((point) => VALIDATION_KS.forEach((k) => assert.equal(classify(point, TRAINING_WITH_OUTLIER, k).tie, false, point.id + ', k = ' + k)));
assert.deepEqual(OPEN_CELLS, [['V2', 7], ['V3', 1], ['V3', 3], ['V4', 3], ['V4', 5], ['V5', 1]]);
const openStates = OPEN_CELLS.map(([id, k]) => rows.find((row) => row.id === id).results[k].correct);
assert.deepEqual(openStates, [false, false, true, true, false, false]);
assert.equal(rankNeighbours(VALIDATION[2], TRAINING_WITH_OUTLIER)[0].item.id, 8, 'V3: nächster Nachbar ist Nr. 8 (186|113, L)');
close(rankNeighbours(VALIDATION[2], TRAINING_WITH_OUTLIER)[0].distance, 6);
// An keiner k-Grenze gibt es gleiche Abstände (keine Abhängigkeit von der Datenreihenfolge)
const noTieAtBoundary = (point, data, name) => {
  const ranking = rankNeighbours(point, data);
  [1, 3, 5, 7].forEach((k) => assert.ok(Math.abs(ranking[k - 1].distance - ranking[k].distance) > 1e-9, name + ' an der Grenze k = ' + k));
};
[...VALIDATION, ...TEST_PERSONS, OUTLIER_POINT].forEach((point) => noTieAtBoundary(point, TRAINING_WITH_OUTLIER, point.id || 'N'));
Object.entries(LARGE_K_PERSONS).forEach(([name, person]) => noTieAtBoundary(person, SHIRT_TRAINING, 'Person ' + name));

// Test: acht Testpersonen mit k = 3, Konfusionsmatrix, Genauigkeit
assert.equal(TEST_K, 3);
assert.equal(TEST_PERSONS.length, 8);
const pairs = TEST_PERSONS.map((person) => {
  const result = classify(person, TRAINING_WITH_OUTLIER, TEST_K);
  assert.equal(result.label, EXPECTED.test.computed[person.id], person.id);
  assert.equal(result.tie, false, person.id);
  return { erwartet: person.truth, berechnet: result.label };
});
const matrix = confusionMatrix(pairs, SHIRT_CLASSES);
assert.deepEqual(matrix, EXPECTED.test.matrix);
assert.notDeepEqual(transposeMatrix(matrix, SHIRT_CLASSES), matrix, 'Die Matrix ist nicht symmetrisch');
assert.deepEqual(transposeMatrix(transposeMatrix(matrix, SHIRT_CLASSES), SHIRT_CLASSES), matrix);
assert.deepEqual(transposeMatrix(matrix, SHIRT_CLASSES), { S: { S: 2, M: 1, L: 0 }, M: { S: 0, M: 2, L: 1 }, L: { S: 0, M: 0, L: 2 } });
assert.deepEqual(accuracy(matrix, SHIRT_CLASSES), { correct: 6, total: 8, value: 0.75 });
assert.equal(pairs.filter((pair) => pair.erwartet !== pair.berechnet).length, 2, 'genau zwei Fehlklassifikationen');

// Fall 1: ungleich verteilte Daten
assert.equal(UNEVEN_TRAINING.length, 6);
assert.deepEqual(countLabels(UNEVEN_TRAINING.map((item) => ({ item })), SHIRT_CLASSES), { S: 5, M: 1, L: 0 });
for (let x = 140; x <= 220; x++) {
  for (let y = 70; y <= 140; y++) {
    [3, 5].forEach((k) => assert.equal(classify({ x, y }, UNEVEN_TRAINING, k).label, 'S', x + '|' + y + ', k = ' + k));
  }
}
assert.equal(classify({ x: 192, y: 125 }, UNEVEN_TRAINING, 1).label, EXPECTED.uneven.k1Tall);
assert.equal(classify({ x: 192, y: 125 }, UNEVEN_TRAINING, 3).label, EXPECTED.uneven.kTall);

// Fall 3: Lebensmittel und Normierung
const { N, A, B } = FOOD;
assert.equal(formatDecimal(euclidean(N, A)), EXPECTED.food.distanceA);
assert.equal(formatDecimal(euclidean(N, B)), EXPECTED.food.distanceB);
assert.equal(rankNeighbours(N, [A, B])[0].item.id, 'A');
const scaled = (point) => ({ x: normalize(point.x, NORMALIZE.min, NORMALIZE.max), y: point.y });
assert.equal(formatDecimal(euclidean(scaled(N), scaled(A))), EXPECTED.food.normA);
assert.equal(formatDecimal(euclidean(scaled(N), scaled(B))), EXPECTED.food.normB);
assert.equal(rankNeighbours(scaled(N), [scaled(A), scaled(B)].map((item, index) => ({ ...item, id: ['A', 'B'][index] })))[0].item.id, 'B');
assert.equal(normalize(NORMALIZE.value, NORMALIZE.min, NORMALIZE.max), 0.75);
close(normalize(30, 0, 100), 0.3);

// Regression
const training = REGRESSION.training;
const point = { x: REGRESSION.x, y: 0 };
assert.deepEqual(ids(rankNeighbours(point, training, distanceX)), ['C', 'B', 'D', 'A']);
assert.deepEqual(rankNeighbours(point, training, distanceX).map(({ distance }) => distance), [1, 2, 2, 3]);
close(regress(point, training, 1).value, 2);
close(regress(point, training, 3).value, 3);
assert.deepEqual(ids(regress(point, training, 3).neighbours).sort(), ['B', 'C', 'D']);
assert.deepEqual(ids(regress(point, training, 3).neighbours), ['C', 'B', 'D']);
close(regress(point, training, 4).value, EXPECTED.regression.allFour);
assert.equal(distanceX({ x: 1, y: 9 }, { x: 4, y: -3 }), 3);

// Hauspreise
HOUSE_AREAS.forEach((area) => HOUSE_K.forEach((k) => {
  close(regress({ x: area, y: 0 }, HOUSES, k).value, EXPECTED.houses[area][k], area + ' m², k = ' + k);
}));
HOUSE_AREAS.forEach((area) => {
  const ranking = rankNeighbours({ x: area, y: 0 }, HOUSES, distanceX);
  HOUSE_K.forEach((k) => assert.ok(Math.abs(ranking[k - 1].distance - ranking[k].distance) > 1e-9, area + ' m² an der Grenze k = ' + k));
});

// toSvg: Standard unverändert, scaleY optional
assert.deepEqual(toSvg({ x: 155, y: 80 }), { x: 50, y: 470 });
assert.deepEqual(toSvg({ x: 200, y: 130 }), { x: 455, y: 20 });
const house = { domain: { x: [60, 200], y: [150, 450] }, scale: 2.5, scaleY: 1, origin: { x: 50, y: 350 } };
assert.deepEqual(toSvg({ x: 60, y: 150 }, house), { x: 50, y: 350 });
assert.deepEqual(toSvg({ x: 200, y: 450 }, house), { x: 400, y: 50 });
assert.deepEqual(toSvg({ x: 3, y: 2 }, { domain: { x: [0, 7], y: [0, 7] }, scale: 40, origin: { x: 50, y: 330 } }), { x: 170, y: 250 });

console.log('Datensätze, Ergebnisse, Validierungstabelle, Konfusionsmatrix, Genauigkeit, Regression und toSvg von Aufgabe 8 sind korrekt.');
