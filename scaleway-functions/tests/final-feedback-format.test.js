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
  assert.equal(noScore.feedback, '- Individueller Tipp.');
});
