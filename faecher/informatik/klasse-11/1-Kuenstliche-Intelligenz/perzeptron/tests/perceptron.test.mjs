import assert from 'node:assert/strict';
import { activation, normaliseNumber, numberMatches, runEpoch, trainOne } from '../logic/perceptron.mjs';

assert.equal(activation(2, 3), 0);
assert.equal(activation(3, 3), 1);
assert.equal(activation(4, 3), 1);
assert.deepEqual(trainOne({ x1: 4, x2: 1, target: 0 }, { w1: 1, w2: 1, threshold: 1, rate: 1 }), { sum: 5, output: 1, delta: -1, w1: -3, w2: 0, threshold: 2 });
assert.deepEqual(runEpoch().map(({ sum, output, delta, w1, w2, threshold }) => ({ sum, output, delta, w1, w2, threshold })), [
  { sum: 4, output: 1, delta: 0, w1: 1, w2: 1, threshold: 1 },
  { sum: 5, output: 1, delta: -1, w1: -3, w2: 0, threshold: 2 },
  { sum: -18, output: 0, delta: 0, w1: -3, w2: 0, threshold: 2 },
  { sum: 0, output: 0, delta: 1, w1: -3, w2: 4, threshold: 1 },
]);
assert.equal(normaliseNumber(' −3,0 '), -3);
assert.equal(normaliseNumber('+0.5'), 0.5);
assert.equal(normaliseNumber('100%', { allowPercent: true }), 100);
assert.equal(normaliseNumber('3abc'), null);
assert.equal(numberMatches('−3,0', -3), true);
console.log('Perzeptron-Logik und Eingabevarianten sind korrekt.');
