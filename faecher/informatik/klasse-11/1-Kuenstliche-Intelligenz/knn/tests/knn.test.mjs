import assert from 'node:assert/strict';
import { SHIRT_CLASSES, SHIRT_TRAINING } from '../data/shirts.mjs';
import { BLANK_IDS, COMPARE_A, COMPARE_B, COMPARE_P, EXPECTED, N1, N2, N5, PAIR_A, PAIR_B, QUIZ_A, QUIZ_B, STOP_H, STOP_K } from '../data/task7.mjs';
import { classify, countLabels, euclidean, formatDecimal, manhattan, rankNeighbours, withinTolerance } from '../logic/knn.mjs';
import { toSvg } from '../ui/knn-plot.mjs';

const ids = (neighbours) => neighbours.map(({ item }) => item.id);
const close = (actual, expected, message) => assert.ok(Math.abs(actual - expected) < 1e-9, message || actual + ' != ' + expected);

// Daten in Heftreihenfolge
assert.equal(SHIRT_TRAINING.length, 15);
assert.deepEqual(SHIRT_TRAINING.map((item) => item.id), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
assert.deepEqual(SHIRT_TRAINING.map((item) => item.label).join(''), 'SLMSSMMLLLMSLSL');
assert.deepEqual(countLabels(SHIRT_TRAINING.map((item) => ({ item })), SHIRT_CLASSES), { S: 5, M: 4, L: 6 });

// Reiter 1: N1 = 183|106
const r1 = rankNeighbours(N1, SHIRT_TRAINING);
assert.deepEqual(ids(r1).slice(0, 5), [6, 7, 3, 8, 11]);
assert.deepEqual(ids(r1).slice(0, 3).map((id) => SHIRT_TRAINING[id - 1].label), ['M', 'M', 'M']);
['3.16', '3.61', '5.00', '7.62', '7.81'].forEach((text, index) => assert.equal(r1[index].distance.toFixed(2), text));
assert.deepEqual(classify(N1, SHIRT_TRAINING, 5).counts, { S: 0, M: 4, L: 1 });
assert.deepEqual(classify(N1, SHIRT_TRAINING, 7).counts, { S: 0, M: 4, L: 3 });
[1, 3, 5, 7].forEach((k) => assert.equal(classify(N1, SHIRT_TRAINING, k).label, 'M'));
assert.equal(EXPECTED.discoverSize, 'M');

// Reiter 2: N2 = 186|110
const r2 = rankNeighbours(N2, SHIRT_TRAINING);
assert.deepEqual(ids(r2).slice(0, 7), [7, 8, 2, 15, 6, 3, 10]);
['1.41', '3.00', '7.21', '7.28', '7.81', '10.00', '11.70'].forEach((text, index) => assert.equal(r2[index].distance.toFixed(2), text));
const expectedN2 = [
  { k: 1, label: 'M', counts: { S: 0, M: 1, L: 0 } },
  { k: 3, label: 'L', counts: { S: 0, M: 1, L: 2 } },
  { k: 5, label: 'L', counts: { S: 0, M: 2, L: 3 } },
  { k: 7, label: 'L', counts: { S: 0, M: 3, L: 4 } },
];
expectedN2.forEach(({ k, label, counts }) => {
  const result = classify(N2, SHIRT_TRAINING, k);
  assert.equal(result.label, label, 'N2, k = ' + k);
  assert.deepEqual(result.counts, counts, 'N2, k = ' + k);
  assert.equal(result.tie, false, 'N2, k = ' + k);
});
assert.equal(EXPECTED.neighbours.k1, 'M');
assert.equal(EXPECTED.neighbours.k5, 'L');

// Reiter 3
assert.equal(PAIR_A.id, 3);
assert.equal(PAIR_B.id, 7);
assert.equal(euclidean(N1, PAIR_A), 5);
close(euclidean(N1, PAIR_B), Math.sqrt(13));
assert.equal(formatDecimal(euclidean(N1, PAIR_B)), '3,61');
assert.equal(formatDecimal(euclidean(N1, PAIR_A)), '5,00');

// Reiter 4
assert.equal(manhattan(STOP_H, STOP_K), 8);
close(euclidean(STOP_H, STOP_K), Math.sqrt(34));
assert.equal(formatDecimal(euclidean(STOP_H, STOP_K)), '5,83');
close(euclidean(COMPARE_P, COMPARE_A), Math.sqrt(18));
assert.equal(formatDecimal(euclidean(COMPARE_P, COMPARE_A)), '4,24');
assert.equal(euclidean(COMPARE_P, COMPARE_B), 5);
assert.equal(manhattan(COMPARE_P, COMPARE_A), 6);
assert.equal(manhattan(COMPARE_P, COMPARE_B), 5);
const comparePoints = [{ id: 'A', ...COMPARE_A, label: 'A' }, { id: 'B', ...COMPARE_B, label: 'B' }];
assert.equal(rankNeighbours(COMPARE_P, comparePoints, euclidean)[0].item.id, 'A');
assert.equal(rankNeighbours(COMPARE_P, comparePoints, manhattan)[0].item.id, 'B');
assert.ok(manhattan(COMPARE_P, COMPARE_A) >= euclidean(COMPARE_P, COMPARE_A));

// Reiter 5: N5 = 178|98
const tableValues = ['17,03', '21,63', '4,47', '3,61', '22,20', '7,28', '13,04', '17,00', '30,41', '25,94', '3,16', '10,00', '34,99', '4,12', '21,47'];
SHIRT_TRAINING.forEach((item, index) => assert.equal(formatDecimal(euclidean(N5, item)), tableValues[index], 'Zeile ' + item.id));
assert.deepEqual(BLANK_IDS, [3, 6]);
assert.equal(formatDecimal(euclidean(N5, SHIRT_TRAINING[2])), '4,47');
assert.equal(formatDecimal(euclidean(N5, SHIRT_TRAINING[5])), '7,28');
const r5 = rankNeighbours(N5, SHIRT_TRAINING);
assert.deepEqual(ids(r5).slice(0, 6), [11, 4, 14, 3, 6, 12]);
['3.16', '3.61', '4.12', '4.47', '7.28', '10.00'].forEach((text, index) => assert.equal(r5[index].distance.toFixed(2), text));
assert.ok(r5[5].distance - r5[4].distance > 1);
const k5 = classify(N5, SHIRT_TRAINING, 5);
assert.deepEqual(k5.counts, { S: 2, M: 3, L: 0 });
assert.equal(k5.label, 'M');
assert.equal(k5.tie, false);
assert.deepEqual(EXPECTED.apply.neighbourIds, [11, 4, 14, 3, 6]);
assert.equal(classify(N5, SHIRT_TRAINING, 3).label, 'S');
// Kontrolltest: ohne Nr. 3 bzw. ohne Nr. 6 kippt das Ergebnis zu S
assert.equal(classify(N5, SHIRT_TRAINING.filter((item) => item.id !== 3), 5).label, 'S');
assert.equal(classify(N5, SHIRT_TRAINING.filter((item) => item.id !== 6), 5).label, 'S');

// Gleichstandsregel mit synthetischen Daten
const synthetic = [
  { id: 1, x: 1, y: 0, label: 'S' },
  { id: 2, x: 0, y: 2, label: 'M' },
  { id: 3, x: 3, y: 0, label: 'L' },
  { id: 4, x: 4, y: 0, label: 'M' },
  { id: 5, x: 0, y: 5, label: 'S' },
];
const origin = { x: 0, y: 0 };
const tie3 = classify(origin, synthetic, 3);
assert.equal(tie3.label, 'S');
assert.equal(tie3.tie, true);
assert.deepEqual(tie3.counts, { S: 1, M: 1, L: 1 });
const tie5 = classify(origin, synthetic, 5);
assert.equal(tie5.label, 'S');
assert.equal(tie5.tie, true);
assert.deepEqual(tie5.counts, { S: 2, M: 2, L: 1 });
// Bei zwei Klassen und ungeradem k gibt es nie einen Gleichstand
const twoClasses = SHIRT_TRAINING.filter((item) => item.label !== 'M');
[1, 3, 5, 7, 9].forEach((k) => assert.equal(classify(N2, twoClasses, k, { classes: ['S', 'L'] }).tie, false));
assert.throws(() => classify(N1, SHIRT_TRAINING, 0), RangeError);
// Bei gleichem Abstand gilt die Datenreihenfolge
assert.deepEqual(ids(rankNeighbours({ x: 0, y: 0 }, [{ id: 'a', x: 1, y: 0 }, { id: 'b', x: 0, y: 1 }])), ['a', 'b']);

// Quiz
assert.equal(euclidean(QUIZ_A, QUIZ_B), 10);
assert.equal(manhattan(QUIZ_A, QUIZ_B), 14);
const quizNeighbours = ['L', 'M', 'L', 'M', 'L'].map((label, index) => ({ item: { id: index, label } }));
[[1, 'L'], [3, 'L'], [5, 'L']].forEach(([k, label]) => {
  const counts = countLabels(quizNeighbours.slice(0, k), SHIRT_CLASSES);
  const best = Math.max(...Object.values(counts));
  assert.deepEqual(SHIRT_CLASSES.filter((entry) => counts[entry] === best), [label]);
});

// Toleranz für gerundete Eingaben
assert.equal(withinTolerance('4,47', Math.sqrt(20)), 'correct');
assert.equal(withinTolerance('4.47', Math.sqrt(20)), 'correct');
assert.equal(withinTolerance('4,48', Math.sqrt(20)), 'wrong');
assert.equal(withinTolerance('3,60', Math.sqrt(13)), 'near');
assert.equal(withinTolerance('3,61', Math.sqrt(13)), 'correct');
assert.equal(withinTolerance('4,24', Math.sqrt(18)), 'correct');
assert.equal(withinTolerance('4,25', Math.sqrt(18)), 'wrong');
assert.equal(withinTolerance('7,28', Math.sqrt(53)), 'correct');
assert.equal(withinTolerance('5', 5), 'correct');
assert.equal(withinTolerance('5,00', 5), 'correct');
assert.equal(withinTolerance('abc', 5), 'invalid');
assert.equal(withinTolerance('', 5), 'invalid');
assert.equal(withinTolerance('7', 5), 'wrong');
assert.equal(formatDecimal(10), '10,00');

// Abbildung: gleicher Maßstab auf beiden Achsen
assert.deepEqual(toSvg({ x: 155, y: 80 }), { x: 50, y: 470 });
assert.deepEqual(toSvg({ x: 200, y: 130 }), { x: 455, y: 20 });
const unit = { x: toSvg({ x: 156, y: 80 }).x - toSvg({ x: 155, y: 80 }).x, y: toSvg({ x: 155, y: 80 }).y - toSvg({ x: 155, y: 81 }).y };
assert.equal(unit.x, unit.y);

console.log('KNN-Logik, Zahlenwerte aus Aufgabe 7 und Abbildung sind korrekt.');
