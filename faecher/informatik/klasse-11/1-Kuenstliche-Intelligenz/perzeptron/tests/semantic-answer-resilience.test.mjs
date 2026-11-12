import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { compactFeedbackSentences, evaluateSemanticAnswer, evaluateCodeAnswer } from '../ui/semantic-answer.mjs';

const parameters = { taskId: '11-6-klassifizieren', answer: 'Eine ausreichend ausführliche Beschreibung.',
  code: 'double summe = w_1 * x_1 + w_2 * x_2;', accessPassword: 'Lokaler-Test', timeout: 10 };

async function boundedOutcome(promise) {
  let watchdog;
  try {
    return await Promise.race([
      promise.then(() => 'success', error => error.message),
      new Promise(resolve => { watchdog = setTimeout(() => resolve('still pending'), 150); }),
    ]);
  } finally { clearTimeout(watchdog); }
}

test('Text und Code verlassen den Ladezustand auch bei einem nicht reagierenden Netzwerkaufruf', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = () => new Promise(() => {});
    for (const evaluate of [evaluateSemanticAnswer, evaluateCodeAnswer]) {
      assert.match(await boundedOutcome(evaluate(parameters)), /zu lange gedauert/);
    }
  } finally { globalThis.fetch = originalFetch; }
});

test('Die Zeitgrenze umfasst auch einen unvollständig eintreffenden Antwortkörper', async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => ({ ok: true, json: () => new Promise(() => {}) });
    assert.match(await boundedOutcome(evaluateSemanticAnswer(parameters)), /zu lange gedauert/);
  } finally { globalThis.fetch = originalFetch; }
});

test('Rückmeldungen bleiben ohne Intl.Segmenter lesbar, knapp und ohne beschädigten Code', () => {
  const originalSegmenter = Intl.Segmenter;
  try {
    Intl.Segmenter = undefined;
    assert.deepEqual(compactFeedbackSentences([
      'Prüfe z. B. `punkt.getX_1()` und den Wert 0.5. Ergänze den Vergleich. Ein dritter Satz.',
    ]), ['Prüfe z. B. `punkt.getX_1()` und den Wert 0.5.', 'Ergänze den Vergleich.']);
    assert.deepEqual(compactFeedbackSentences(['Prüfe den Vergleich.', 'Prüfe den Vergleich.', 'Ergänze den Nullfall.'], 1),
      ['Prüfe den Vergleich.']);
  } finally { Intl.Segmenter = originalSegmenter; }
});

test('6.2 beendet die Ladeanzeige, wenn die IDE während der Auswertung nicht mehr erreichbar ist', async () => {
  const source = readFileSync(new URL('../ui/task6.mjs', import.meta.url), 'utf8');
  const implementation = source.slice(source.indexOf('async function checkCode('), source.indexOf('function buildQuiz('));
  const box = {};
  const button = { dataset: { codeTask: '11-6-einfach-summe' } };
  let reads = 0;
  const context = vm.createContext({
    CODE_ASSESSMENT_VERSIONS: { '11-6-einfach-summe': 'test' }, codeRequestVersions: new Map(),
    resultBox: () => box,
    getCode: () => { if (++reads > 1) throw new Error('Die Online-IDE lädt noch.'); return 'double summe = 1;'; },
    codeRequest: async () => ({ points: 1, maxPoints: 3 }),
    showMessage: (target, message) => { target.message = message; },
    serverError: error => error.message,
    renderEvaluation: () => assert.fail('Kein Ergebnis für eine nicht mehr verfügbare IDE anzeigen.'),
  });
  vm.runInContext(implementation, context);
  await context.checkCode(button);
  assert.match(box.message, /Online-IDE lädt noch/);
  assert.equal(button.disabled, false);
});
