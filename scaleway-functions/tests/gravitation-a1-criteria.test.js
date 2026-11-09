'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../evaluation-core');
const { evaluate, readConfig } = require('../scaleway-client');

const TASK_ID = 'ph11-a8-apfel-erde-kraft-beschleunigung';
const ANSWER = 'Die Erde übt eine Kraft auf den Apfel aus und der Apfel ebenso auf die Erde; beide Kräfte sind gleich groß, daher genügt ein Kraftbetrag. Bei gleicher Kraft ist die Beschleunigung der Erde wegen ihrer viel größeren Masse nach a = F/m viel kleiner.';
const CONFIG = readConfig({ AI_API_KEY: 'mock', AI_PROJECT_ID: '11111111-1111-1111-1111-111111111111', AI_MODEL: 'mock-model' });

function modelResponse(criteria) {
  return async (_url, options) => {
    const request = JSON.parse(options.body);
    assert.equal(request.response_format.json_schema.schema.required[0], 'criteria');
    return { ok: true, text: async () => JSON.stringify({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify({ criteria }) } }] }) };
  };
}

test('A1-Aufgabe 8 hat zwei konfigurierte, benannte Kriterien mit den festgelegten Hinweisen', () => {
  const task = core.TASKS[TASK_ID];
  assert.ok(task);
  assert.equal(task.grade, 11);
  assert.equal(task.maxPoints, 2);
  assert.equal(task.maxFeedbackHints, 1);
  assert.deepEqual(task.feedbackCriteria.map(item => [item.id, item.label]), [
    ['force_pair', 'Gleiche Kraftbeträge'],
    ['acceleration_mass', 'Massen und Beschleunigungen']
  ]);
  assert.equal(task.expectedAspects.length, 2);
  assert.equal(task.rubric.length, 2);
  assert.deepEqual(task.feedbackCriteria.map(item => [item.issues.missing, item.issues.wrong_relation]), [
    ['Benenne beide Kräfte mit ‚Kraft von … auf …‘ und vergleiche ihre Beträge.', 'Benenne beide Kräfte mit ‚Kraft von … auf …‘ und vergleiche ihre Beträge.'],
    ['Vergleiche die Massen von Apfel und Erde und nutze den Zusammenhang zwischen Kraft, Masse und Beschleunigung.', 'Vergleiche die Massen von Apfel und Erde und nutze den Zusammenhang zwischen Kraft, Masse und Beschleunigung.']
  ]);
});

test('A1-Kriterien bewerten Teilpunkte unabhängig, wählen nur den ersten offenen Schritt und akzeptieren gemeinsame Belege', async () => {
  const task = core.TASKS[TASK_ID];
  const scenarios = [
    { points: 0, states: ['missing', 'missing'], answer: 'Die Kräfte und Massen beeinflussen alles.', next: 'Schritt 1 von 2 – Gleiche Kraftbeträge:' },
    { points: 1, states: ['correct', 'missing'], answer: ANSWER, next: 'Schritt 2 von 2 – Massen und Beschleunigungen:' },
    { points: 1, states: ['missing', 'correct'], answer: 'Die Massen von Apfel und Erde unterscheiden sich stark; deshalb unterscheiden sich auch ihre Beschleunigungen stark.', next: 'Schritt 1 von 2 – Gleiche Kraftbeträge:' },
    { points: 0, states: ['wrong_relation', 'missing'], answer: 'Die Kraft von der Erde auf den Apfel ist größer als die Kraft vom Apfel auf die Erde.', next: 'Schritt 1 von 2 – Gleiche Kraftbeträge:' },
    { points: 2, states: ['correct', 'correct'], answer: ANSWER, next: null }
  ];

  for (const scenario of scenarios) {
    const criteria = Object.fromEntries(task.feedbackCriteria.map((criterion, index) => [criterion.id, {
      status: scenario.states[index],
      evidence: scenario.states[index] === 'correct' || scenario.states[index] === 'wrong_relation'
        ? [index === 0 && scenario.answer === ANSWER ? 'beide Kräfte sind gleich groß' : scenario.answer]
        : []
    }]));
    const result = await evaluate(task, scenario.answer, CONFIG, modelResponse(criteria));
    assert.equal(result.points, scenario.points);
    assert.equal(result.maxPoints, 2);
    if (scenario.next) assert.ok(result.missing[0].startsWith(scenario.next));
    else {
      assert.deepEqual(result.missing, []);
      assert.equal(result.feedback, 'Sehr gut, alles richtig');
    }
  }
});

test('A1-Belegvalidierung lehnt erfundene Textstellen ab', async () => {
  const task = core.TASKS[TASK_ID];
  const criteria = {
    force_pair: { status: 'correct', evidence: ['Die Wand zieht den Apfel zum Mond.'] },
    acceleration_mass: { status: 'missing', evidence: [] }
  };
  await assert.rejects(() => evaluate(task, ANSWER, CONFIG, modelResponse(criteria)), error => {
    assert.equal(error.code, 'INVALID_MODEL_RESPONSE');
    return true;
  });
});
