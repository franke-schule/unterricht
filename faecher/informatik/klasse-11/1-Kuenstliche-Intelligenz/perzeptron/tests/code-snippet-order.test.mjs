import assert from 'node:assert/strict';
import test from 'node:test';
import { CODE_SNIPPET_TASK as task } from '../ui/code-snippet-order.mjs';
import { evaluateStepOrder } from '../../../../../physik/klasse-11/1-Kreisbewegungen/components/step-order.mjs';

test('Die Sortierhilfe unterscheidet leere, falsche und teilweise richtige Zuordnungen', () => {
  assert.equal(evaluateStepOrder(Array(9).fill(''), task).status, 'error');
  const allWrong = ['output-one', 'output-zero', 'sum', 'minus-w1', 'minus-w2', 'minus-theta', 'plus-w1', 'plus-w2', 'plus-theta'];
  assert.equal(evaluateStepOrder(allWrong, task).status, 'error');
  const wrong = [...task.acceptedOrders[0]];
  [wrong[1], wrong[2]] = [wrong[2], wrong[1]];
  const result = evaluateStepOrder(wrong, task);
  assert.equal(result.status, 'partial');
  assert.match(result.text, /7 von 9 Codezeilen/);
  assert.doesNotMatch(result.text, /Rechenschritt/);
});

test('Parameteränderungen müssen zum Fehlerzeichen des Zweigs passen', () => {
  const wrong = [...task.acceptedOrders[0]];
  [wrong[5], wrong[8]] = [wrong[8], wrong[5]];
  assert.equal(evaluateStepOrder(wrong, task).status, 'partial');
});

test('Alle 36 akzeptierten Reihenfolgen ergeben fachlich richtiges Training', () => {
  assert.equal(task.acceptedOrders.length, 36);
  assert.equal(new Set(task.acceptedOrders.map(order => order.join(','))).size, 36);
  const cardText = id => task.cards.find(card => card.id === id).text;
  for (const order of task.acceptedOrders) {
    assert.equal(evaluateStepOrder(order, task).status, 'success');
    assert.equal(new Set(order).size, task.n);
    // Die verwendeten Java-Anweisungen sind nach Ersetzung von double/int
    // auch in JavaScript ausführbar; so prüfen wir die tatsächlichen Formeln.
    const body = `
      ${cardText(order[0]).replace('double ', 'let ')}
      let berechnete_ausgabe = 0;
      if (gewichtete_Summe > theta) { ${cardText(order[1])} }
      else { ${cardText(order[2])} }
      let delta = punkt.gibLabel() - berechnete_ausgabe;
      if (delta == 1) { ${order.slice(3, 6).map(cardText).join('\n')} }
      else if (delta == -1) { ${order.slice(6).map(cardText).join('\n')} }
      return [w_1, w_2, theta];`;
    const train = new Function('w_1', 'w_2', 'theta', 'lernrate', 'punkt', body);
    for (const [weights, input, expected] of [
      [[1, 1, 1, 1], [4, 1, 0], [-3, 0, 2]],
      [[0, 0, 1, 0.5], [2, 2, 1], [1, 1, 0.5]],
      [[1, 1, 1, 0.5], [2, 2, 1], [1, 1, 1]],
      [[0.25, 0.5, 0.75, 0.5], [1, 1, 1], [0.75, 1, 0.25]],
    ]) {
      const point = { gibEingabewertX1: () => input[0], gibEingabewertX2: () => input[1], gibLabel: () => input[2] };
      assert.deepEqual(train(...weights, point), expected);
    }
  }
});
