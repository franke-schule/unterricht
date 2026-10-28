'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../evaluation-core');

test('finale Rückmeldung ist kompakt, dedupliziert und ohne feedbackNoteAboveHalf', () => {
  const task = { maxPoints: 4, feedbackNoteAboveHalf: 'Bitte in der IDE ausführen.' };
  const full = core.formatFinalEvaluation_({
    points: 4, maxPoints: 4, status: 'korrekt', strengths: ['Belegt'], missing: ['Fehlt'],
    feedback: 'Gute Arbeit. Bitte in der IDE ausführen.'
  }, task);
  assert.equal(full.feedback, 'Sehr gut, alles richtig');
  assert.deepEqual(full.strengths, []);
  assert.deepEqual(full.missing, []);

  const partial = core.formatFinalEvaluation_({
    points: 2, maxPoints: 4, status: 'teilweise korrekt', strengths: ['Belegt'],
    missing: ['Setter nachtragen.', 'Setter nachtragen.', 'Getter ausgeben.'],
    feedback: 'KI-Prosa. Bitte in der IDE ausführen.'
  }, task);
  assert.deepEqual(partial.missing, ['Setter nachtragen.', 'Getter ausgeben.']);
  assert.equal(partial.feedback, '');
  assert.deepEqual(partial.strengths, []);

  const noScore = core.formatFinalEvaluation_({
    points: 0, maxPoints: 0, status: 'noch nicht korrekt', strengths: [], missing: [], feedback: 'Individueller Tipp.'
  }, { maxPoints: 0 });
  assert.deepEqual(noScore.missing, ['Individueller Tipp.']);
  assert.equal(noScore.feedback, '');
});

test('Server und Anzeige begrenzen mehrsätzige und ältere Modellantworten auf dieselben zwei Sätze', async () => {
  const { compactFeedbackSentences } = await import('../../faecher/informatik/klasse-11/1-Kuenstliche-Intelligenz/perzeptron/ui/semantic-answer.mjs');
  const cases = [
    ['Der Getter erwartet kein Argument. Entferne die 7.', 'Dritter Satz.'],
    ['Die Methode gibAlter() hat keinen Eingabeparameter. Korrigiere dies.'],
    ['Ersetze z. B. petersHund.zeigeDaten() in Hund.java durch println(...) mit gibAlter(). Ergänze die Ausgabe.', 'Dritter Satz.'],
    ['Entferne die 7. Entferne die 7.', 'Ergänze die Ausgabe.'],
    ['Ersetze println("Hallo. Welt.") durch einen Getter-Aufruf. Gib dessen Rückgabewert aus.', 'Dritter Satz.'],
  ];
  for (const missing of cases) {
    const result = core.formatFinalEvaluation_({ points: 0, maxPoints: 4, strengths: [], missing, feedback: 'Überflüssiger Absatz.' }, {});
    assert.deepEqual(result.missing, compactFeedbackSentences(missing));
    assert.equal(result.feedback, '');
    assert.ok(result.missing.length <= 2);
  }
});

test('alle Beschreibe- und Codeprompts in Inf9, Inf10 und Inf11 enthalten dieselbe Zweisatzregel', () => {
  for (const task of Object.values(core.TASKS).filter(task => [9, 10, 11].includes(task.grade))) {
    assert.match(core.buildPrompt_(task, 'Testeingabe zur Bewertung.'), /insgesamt aus höchstens zwei kurzen Sätzen/);
  }
});

test('6.2: Alle fünf Teilaufgaben fordern genau einen nächsten Verbesserungsschritt bei vollständiger Bewertung', async () => {
  const { createHandler } = require('../handler');
  const { compactFeedbackSentences } = await import('../../faecher/informatik/klasse-11/1-Kuenstliche-Intelligenz/perzeptron/ui/semantic-answer.mjs');
  const ids = ['11-6-klassifizieren', '11-6-einfach-summe', '11-6-einfach-ausgabe', '11-6-einfach-anpassung', '11-6-schwer-trainieren'];
  assert.deepEqual(Object.entries(core.TASKS).filter(([, task]) => task.maxFeedbackHints === 1).map(([id]) => id), ids);
  for (const taskId of ids) {
    const task = core.TASKS[taskId];
    const first = 'Ergänze den ersten noch fehlenden Rechenschritt.';
    const missing = [first + ' Ergänze außerdem die Gewichtsänderung.', 'Korrigiere auch theta.'];
    let calls = 0;
    const handle = createHandler({ rateLimit: Infinity, env: {
      AI_API_KEY: 'mock-only', AI_PROJECT_ID: '11111111-1111-1111-1111-111111111111',
      AI_MODEL: 'mock-model', AI_EVALUATION_ENABLED: 'true'
    }, fetchImpl: async (url, options) => {
      calls++;
      const prompt = JSON.parse(options.body).messages[1].content;
      assert.match(prompt, /genau eine konkrete Verbesserung pro Prüfung/);
      assert.match(prompt, /Syntax- oder Typfehler/);
      assert.match(prompt, /Bewerte trotzdem alle Aspekte für die Punktzahl/);
      return { ok: true, status: 200, async text() {
        return JSON.stringify({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify({
          points: 1, maxPoints: task.maxPoints, status: task.statusLabels.partial,
          strengths: [], missing, feedback: missing.join(' ')
        }) } }] });
      } };
    } });
    const codeTask = task.responseType === 'code';
    const response = await handle({ httpMethod: 'POST', path: '/', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId: 'single_hint_' + taskId, taskId, requestType: codeTask ? 'code' : 'text',
        [codeTask ? 'code' : 'answer']: 'public class Perzeptron { public void trainieren(Datenpunkt punkt) { } }' }) });
    assert.equal(response.statusCode, 200, taskId);
    assert.equal(calls, 1);
    const result = JSON.parse(response.body).result;
    assert.equal(result.points, 1);
    assert.equal(result.maxPoints, task.maxPoints);
    assert.deepEqual(result.missing, [first]);
    assert.deepEqual(result.missing, compactFeedbackSentences(missing, 1));
    assert.equal(result.feedback, '');
  }
});

test('6.2: Einzelschritt begrenzt Feedback-Fallback und behält den Erfolgssatz bei', () => {
  const task = core.TASKS['11-6-einfach-anpassung'];
  const result = core.formatFinalEvaluation_({ points: 2, maxPoints: 5, missing: [],
    feedback: 'Ergänze die Anpassung von w_2. Korrigiere theta.' }, task);
  assert.deepEqual(result.missing, ['Ergänze die Anpassung von w_2.']);
  const full = core.formatFinalEvaluation_({ ...result, points: 5 }, task);
  assert.deepEqual(full.missing, []);
  assert.equal(full.feedback, 'Sehr gut, alles richtig');
});
