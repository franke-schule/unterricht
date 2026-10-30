'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../evaluation-core');
const { TASKS } = core;
const { createHandler } = require('../handler');

const taskId = 'ph11-kettenkarussell-winkelgeschwindigkeit';
const fullAnswer = 'Bei größerem omega wird die Zentripetalkraft größer, auch der Winkel wird größer und der Radius r vergrößert sich ebenfalls. Die Seilkraft wird auch größer, aber die Gewichtskraft bleibt gleich, weil Winkelgeschwindigkeit keine Auswirkung auf die Masse des Körpers hat also somit auch keine auf die Gewichtskraft.';
const withoutRope = 'Bei größerem omega wird die Zentripetalkraft größer, auch der Winkel wird größer und der Radius r vergrößert sich ebenfalls. Aber die Gewichtskraft bleibt gleich, weil Winkelgeschwindigkeit keine Auswirkung auf die Masse des Körpers hat also somit auch keine auf die Gewichtskraft.';

test('Kettenkarussell-Aufgabe 4 bewertet fünf Veränderungen ohne Kettenlänge als Pflicht', () => {
  const task = TASKS['ph11-kettenkarussell-winkelgeschwindigkeit'];
  assert.equal(task.maxPoints, 5);
  assert.equal(task.expectedAspects.length, 5);
  assert.match(task.context, /interaktives Kräfteparallelogramm/);
  assert.match(task.expectedAspects[4], /Kettenlänge ist nicht erforderlich/);
  assert.match(task.expectedAspects[4], /Masse m und Gewichtskraft FG unverändert/);
  assert.match(task.criteriaFairnessRules.join(' '), /keine Auswirkung auf die Masse/);
  assert.match(task.criteriaFairnessRules.join(' '), /Für den Radiuspunkt genügt die Aussage/);
});

test('gemeldete Antworten erhalten zuverlässig 5/5 bzw. 4/5; nur die Seilkraft ist offen', () => {
  const task = TASKS[taskId];
  for (const [answer, points] of [[fullAnswer, 5], [withoutRope, 4]]) {
    for (const initialPoints of [0, 3, 5]) {
      const incorrect = { points: initialPoints, maxPoints: 5,
        missing: ['Erwähne die Seilkraft FS und den Grund, warum der Radius r größer wird.', 'Erwähne die unveränderte Masse m.'], feedback: 'Falsche KI-Bewertung.' };
      const result = core.formatFinalEvaluation_(core.applyRuleBasedMinimum_(incorrect, task, answer), task);
      assert.equal(result.points, points);
      assert.deepEqual(result.missing, points === 5 ? [] : ['Die Veränderung der Seilkraft F_S fehlt; vergleiche die Länge ihres Kraftpfeils bei größerer Winkelgeschwindigkeit.']);
      assert.equal(result.feedback, points === 5 ? 'Sehr gut, alles richtig' : '');
    }
  }
});

test('gemeinsame Prädikate und Formelzeichen sind ebenfalls zulässig', () => {
  const task = TASKS[taskId];
  const answer = 'FZP nimmt zu, alpha wird größer und r vergrößert sich. FS wird größer. Masse und Gewichtskraft bleiben gleich.';
  assert.equal(core.applyRuleBasedMinimum_({ points: 0 }, task, answer).points, 5);
  assert.equal(core.applyRuleBasedMinimum_({ points: 0 }, task, answer.replace('FS wird größer. ', '')).points, 4);
});

test('Negationen, Widersprüche, Zitate und unvollständige Antworten werden nicht hochgestuft', () => {
  const task = TASKS[taskId];
  const original = { points: 0, maxPoints: 5, missing: ['Unklare Antwort.'] };
  const cases = [
    withoutRope.replace('Zentripetalkraft größer', 'Zentripetalkraft nicht größer'),
    withoutRope.replace('Radius r vergrößert sich', 'Radius r wird kleiner'),
    withoutRope.replace('keine Auswirkung auf die Masse', 'eine Auswirkung auf die Masse'),
    withoutRope + ' Die Masse wird größer.',
    withoutRope + ' Die Masse wird kleiner.',
    withoutRope + ' Die Gewichtskraft nimmt ab.',
    withoutRope + ' Die Masse verändert sich.',
    withoutRope + ' Die Gewichtskraft wird nicht gleich bleiben.',
    withoutRope + ' Die Zentripetalkraft zeigt nach außen.',
    'Vielleicht: ' + withoutRope,
    '„' + withoutRope + '“',
    'Zentripetalkraft, Winkel, Radius, Masse, Gewichtskraft.',
  ];
  for (const answer of cases) assert.equal(core.applyRuleBasedMinimum_(original, task, answer), original, answer);
});

test('Server korrigiert die tatsächlich gemeldete Drei-Punkte-Antwort mit falschen Fehlhinweisen (Mock)', async () => {
  const handle = createHandler({ env: {
    AI_API_KEY: 'mock-only', AI_PROJECT_ID: '11111111-1111-1111-1111-111111111111',
    AI_MODEL: 'mock-model', AI_EVALUATION_ENABLED: 'true'
  }, fetchImpl: async () => ({ ok: true, status: 200, text: async () => JSON.stringify({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify({
    criteria: Object.fromEntries(TASKS[taskId].feedbackCriteria.map(criterion => [criterion.id, { status: 'missing', evidence: [] }]))
  }) } }] }) }) });
  const response = await handle({ httpMethod: 'POST', path: '/', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requestId: 'kettenkarussell_missing_rope', taskId, requestType: 'text', answer: withoutRope }) });
  assert.equal(response.statusCode, 200);
  const result = JSON.parse(response.body).result;
  assert.equal(result.points, 4);
  assert.deepEqual(result.missing, ['Schritt 4 von 5 – Aspekt 4: Vergleiche die Seilkraft in beiden Zuständen.']);
  assert.equal(result.feedback, '');
});

test('Kettenkarussell-Aufgabe 5 erlaubt die Begründung über das Kräfteverhältnis', () => {
  const task = TASKS['ph11-kettenkarussell-zwei-sitzreihen'];
  assert.equal(task.maxPoints, 3);
  assert.equal(task.expectedAspects.length, 3);
  assert.match(task.expectedAspects[1], /Verhältnis tan α/);
  assert.match(task.expectedAspects[1], /ohne ausdrücklich genannt/);
  assert.doesNotMatch(task.expectedAspects.join(' '), /Massenunabhängigkeit|Besetzung|Kettenlänge|absolut/);
  assert.match(task.criteriaFairnessRules.join(' '), /Ein absolut größeres FZ darf ohne gleiche Vergleichsmassen nicht/);
});
