import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { calculate } from '../logic/perceptron.mjs';

const source = readFileSync(new URL('../../aufgabe5-quiz.mjs', import.meta.url), 'utf8').replace(/^import .*;\r?\n/gm, '');
const saved = {
  version: 2, cloze: { Eingaben: 'gap-0' }, sort: { p4: 'one' },
  mc: { q2: ['sum', 'output', 'class'], q3: ['delta', 'unchanged'] },
  checked: { cloze: true, sort: true, mc: { q2: true, q3: true } },
  first: { cloze: 6, sort: 6, mc: { q2: 1, q3: 1 } },
};
const context = vm.createContext({ localStorage: { getItem: () => JSON.stringify(saved) } });
vm.runInContext(source, context);
const read = (expression) => JSON.parse(vm.runInContext('JSON.stringify(' + expression + ')', context));

for (const point of read('SORT_VALUES')) {
  const [x1, x2] = point.label.match(/\d+/g).map(Number);
  const { output } = calculate({ x1, x2, w1: -1, w2: 2, threshold: 3 });
  assert.equal(point.zone, output ? 'one' : 'zero', point.label);
}
assert.deepEqual(read('MC_QUESTIONS[1].options.filter(option => option.correct).map(option => option.id)'), ['sum', 'class', 'equal']);
assert.equal(read('state.sort.p4'), 'one', 'Der alte Schülerentwurf bleibt erhalten.');
assert.equal(read('state.checked.sort'), false, 'Alte Bewertung darf die falsche Grenzpunkt-Zuordnung nicht sperren.');
assert.equal(read('state.first.sort'), null);
assert.equal(read('state.checked.mc.q2'), false);
assert.equal(read('state.first.mc.q2'), null);
assert.equal(read('state.checked.mc.q3'), true, 'Unveränderte Bewertungen bleiben erhalten.');
assert.equal(read('state.first.mc.q3'), 1);
assert.equal(read('state.cloze.Eingaben'), 'gap-0');
assert.equal(read('state.version'), 3);
console.log('Quiz-Grenzpunkte und Migration bestehender Bewertungen sind korrekt.');
