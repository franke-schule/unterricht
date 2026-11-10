'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const core = require('../evaluation-core');
const { evaluate, readConfig } = require('../scaleway-client');

const TASK_IDS = [
  'ph11-a8-quiz-mond-beschreibung',
  'ph11-a8-quiz-zweikoerper-beschreibung',
  'ph11-a8-quiz-gesetz-beschreibung'
];
const CONFIG = readConfig({ AI_API_KEY: 'mock', AI_PROJECT_ID: '11111111-1111-1111-1111-111111111111', AI_MODEL: 'mock-model' });

function modelResponse(criteria) {
  return async (_url, options) => {
    const request = JSON.parse(options.body);
    assert.equal(request.response_format.json_schema.schema.required[0], 'criteria');
    return { ok: true, text: async () => JSON.stringify({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify({ criteria }) } }] }) };
  };
}

test('Aufgabe-8-Wiederholungsquiz registriert drei zusammenhängende Kriterienaufgaben mit 3/4/4 Punkten', () => {
  const expectedPoints = [3, 4, 4];
  TASK_IDS.forEach((id, index) => {
    const task = core.TASKS[id];
    assert.ok(task, `Fehlende Task-ID ${id}`);
    assert.equal(task.grade, 11);
    assert.equal(task.maxPoints, expectedPoints[index]);
    assert.equal(task.maxFeedbackHints, 1);
    assert.equal(task.expectedAspects.length, expectedPoints[index]);
    assert.equal(task.rubric.length, expectedPoints[index]);
    assert.equal(task.feedbackCriteria.length, expectedPoints[index]);
    assert.deepEqual(task.feedbackCriteria.map(criterion => criterion.id), expectedPoints[index] === 3
      ? ['aspect_1', 'aspect_2', 'aspect_3']
      : ['aspect_1', 'aspect_2', 'aspect_3', 'aspect_4']);
  });
  const taskSource = fs.readFileSync(path.join(__dirname, '../source/tasks.js'), 'utf8');
  const positions = TASK_IDS.map(id => taskSource.indexOf(`'${id}'`));
  assert.ok(positions.every(position => position >= 0));
  assert.deepEqual([...positions].sort((a, b) => a - b), positions, 'Die IDs stehen in tasks.js als zusammenhängender Aufgabenblock.');
});

test('alle drei Aufgaben zählen erfüllte Kriterien unabhängig und geben genau den ersten offenen Schritt aus', async () => {
  for (const id of TASK_IDS) {
    const task = core.TASKS[id];
    const answer = task.context.split('\nAufgabe: ')[1];
    const criteria = Object.fromEntries(task.feedbackCriteria.map((criterion, index) => [criterion.id, {
      status: index === task.maxPoints - 1 ? 'missing' : 'correct',
      evidence: index === task.maxPoints - 1 ? [] : [answer.slice(0, 50)]
    }]));
    const result = await evaluate(task, answer, CONFIG, modelResponse(criteria));
    assert.equal(result.points, task.maxPoints - 1, id);
    assert.equal(result.maxPoints, task.maxPoints, id);
    assert.equal(result.missing.length, 1, id);
    assert.match(result.missing[0], new RegExp(`Schritt ${task.maxPoints} von ${task.maxPoints}`), id);
  }
});

test('vollständige Kriterienantwort liefert Erfolgssatz und keine nächsten Hinweise', async () => {
  for (const id of TASK_IDS) {
    const task = core.TASKS[id];
    const answer = task.context.split('\nAufgabe: ')[1];
    const criteria = Object.fromEntries(task.feedbackCriteria.map(criterion => [criterion.id, { status: 'correct', evidence: [answer.slice(0, 50)] }]));
    const result = await evaluate(task, answer, CONFIG, modelResponse(criteria));
    assert.equal(result.points, task.maxPoints, id);
    assert.deepEqual(result.missing, [], id);
    assert.equal(result.feedback, 'Sehr gut, alles richtig', id);
  }
});

test('Quizclient verwendet alle Server-IDs und den bestehenden semantischen Transport mit einem Hinweis', () => {
  const source = fs.readFileSync(path.join(__dirname, '../../faecher/physik/klasse-11/1-Kreisbewegungen/aufgabe8-quiz.mjs'), 'utf8');
  for (const id of TASK_IDS) assert.ok(source.includes(id), `Quizclient verwendet ${id}`);
  assert.match(source, /evaluateSemanticAnswer/);
  assert.match(source, /renderCompactEvaluation\(box, ai, \{ appendText: appendPhysicsText, maxHints: 1 \}\)/);
  assert.match(source, /const STORAGE_KEY = "physik11-kreisbewegungen-aufgabe8-test-v1"/);
});
