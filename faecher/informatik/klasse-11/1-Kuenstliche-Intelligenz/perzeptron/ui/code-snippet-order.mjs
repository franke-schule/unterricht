import { setupStepOrder } from '../../../../../physik/klasse-11/1-Kreisbewegungen/components/step-order.mjs';

function permutations(values) {
  if (values.length === 0) return [[]];
  return values.flatMap((value, index) => permutations(values.filter((_, i) => i !== index)).map(rest => [value, ...rest]));
}

export const CODE_SNIPPET_TASK = {
  containerId: 'code-snippet-steps',
  checkButtonId: 'check-code-snippets',
  resetButtonId: 'reset-code-snippets',
  feedbackId: 'code-snippets-feedback',
  n: 9,
  order: ['minus-w2', 'output-one', 'plus-theta', 'sum', 'plus-w1', 'output-zero', 'minus-theta', 'plus-w2', 'minus-w1'],
  cards: [
    { id: 'sum', text: 'double gewichtete_Summe = w_1*punkt.gibEingabewertX1() + w_2*punkt.gibEingabewertX2();' },
    { id: 'output-one', text: 'berechnete_ausgabe = 1;' },
    { id: 'output-zero', text: 'berechnete_ausgabe = 0;' },
    { id: 'plus-w1', text: 'w_1 = w_1 + lernrate*punkt.gibEingabewertX1();' },
    { id: 'plus-w2', text: 'w_2 = w_2 + lernrate*punkt.gibEingabewertX2();' },
    { id: 'plus-theta', text: 'theta = theta - lernrate*1;' },
    { id: 'minus-w1', text: 'w_1 = w_1 - lernrate*punkt.gibEingabewertX1();' },
    { id: 'minus-w2', text: 'w_2 = w_2 - lernrate*punkt.gibEingabewertX2();' },
    { id: 'minus-theta', text: 'theta = theta + lernrate*1;' },
  ].map(card => ({ ...card, spoken: card.text })),
  acceptedOrders: permutations(['plus-w1', 'plus-w2', 'plus-theta']).flatMap(plus =>
    permutations(['minus-w1', 'minus-w2', 'minus-theta']).map(minus => ['sum', 'output-one', 'output-zero', ...plus, ...minus])),
  bankLabel: 'Speicher: Code-Schnipsel',
  stepLabel: 'Codezeile',
  stepPlural: 'Codezeilen',
  wrongOrderHint: 'Beginne mit der gewichteten Summe. Ordne danach die Ausgaben und die Parameteränderungen den passenden Zweigen zu.',
  orderHint: 'Prüfe die Bedingung über dem jeweiligen Feld und die Vorzeichen der Parameteränderungen.',
  success: 'Richtig. Alle Code-Schnipsel stehen in einem passenden Zweig. Übertrage die Anweisungen an die entsprechenden Stellen in trainieren.',
};

export function setupCodeSnippetOrder(progress) {
  setupStepOrder({
    ...CODE_SNIPPET_TASK,
    renderCard(element, card) {
      const code = document.createElement('code');
      code.textContent = card.text;
      element.append(code);
    },
  }, progress);

  // Feste Bedingungen machen die Zuordnung der neun Anweisungen eindeutig.
  const rows = document.querySelector('#code-snippet-steps .step-order-rows');
  const slots = [...rows.children];
  const context = [
    [0, 'public void trainieren(Datenpunkt punkt) {'],
    [1, 'int berechnete_ausgabe = 0;\nif (gewichtete_Summe > theta) {'],
    [2, '} else {'],
    [3, '}\nint delta = punkt.gibLabel() - berechnete_ausgabe;\nif (delta == 1) {'],
    [6, '} else if (delta == -1) {'],
    [9, '}\n}'],
  ];
  for (const [index, text] of context) {
    const row = document.createElement('li');
    row.className = 'code-snippet-context';
    const code = document.createElement('code');
    code.textContent = text;
    row.append(code);
    if (index === 9) rows.append(row);
    else slots[index].before(row);
  }
}
