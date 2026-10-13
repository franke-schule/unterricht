'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../evaluation-core');
const { createHandler } = require('../handler');

test('Alle 67 Aufgaben behalten ihre Kennung, den Eingabetyp und das Ergebnisformat', async () => {
  let expectedTask;
  let modelCalls = 0;
  const handle = createHandler({ rateLimit: Infinity, env: {
    AI_API_KEY: 'local-test-only', AI_PROJECT_ID: '11111111-1111-1111-1111-111111111111',
    AI_MODEL: 'local-test-model', AI_EVALUATION_ENABLED: 'true'
  }, fetchImpl: async () => {
    modelCalls++;
    return { ok: true, status: 200, text: async () => JSON.stringify({ choices: [{ finish_reason: 'stop',
      message: { content: JSON.stringify({ points: 0, maxPoints: expectedTask.maxPoints,
        status: 'noch nicht korrekt', strengths: [], missing: ['Testaspekt fehlt.'], feedback: 'Technische Testantwort.' }) }
    }] }) };
  } });
  for (const [taskId, task] of Object.entries(core.TASKS)) {
    expectedTask = task;
    const isCode = task.responseType === 'code';
    const requestId = 'contract_' + taskId.replace(/[^A-Za-z0-9_-]/g, '_');
    const request = { requestId, taskId, requestType: isCode ? 'code' : 'text',
      [isCode ? 'code' : 'answer']: 'Eine erfundene Eingabe für eine rein technische Prüfung.' };
    const response = await handle({ httpMethod: 'POST', path: '/', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(request) });
    assert.equal(response.statusCode, 200, taskId);
    const payload = JSON.parse(response.body);
    assert.equal(payload.requestId, requestId);
    assert.equal(payload.type, isCode ? 'GEMINI_CODE_EVALUATION_RESULT' : 'GEMINI_EVALUATION_RESULT');
    assert.equal(payload.result.ok, true);
    assert.equal(payload.result.maxPoints, task.maxPoints);
    assert.ok(payload.result.points >= 0 && payload.result.points <= task.maxPoints);
    assert.ok(Array.isArray(payload.result.strengths) && Array.isArray(payload.result.missing));
    assert.equal(typeof payload.result.feedback, 'string');
  }
  assert.equal(modelCalls, 67);
});
