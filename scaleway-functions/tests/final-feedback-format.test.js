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
