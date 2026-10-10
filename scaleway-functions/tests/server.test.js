'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const core = require('../evaluation-core');
const { createHandler } = require('../handler');
const { readConfig, validateEvaluation } = require('../scaleway-client');

const env = {
  AI_API_KEY: 'test-secret-never-return',
  AI_PROJECT_ID: '11111111-1111-1111-1111-111111111111',
  AI_MODEL: 'mistral-small-3.2-24b-instruct-2506',
  AI_EVALUATION_ENABLED: 'true',
  AI_ALLOWED_ORIGINS: 'https://unterricht.example'
};
const fixture = { points: 0, maxPoints: 6, status: 'noch unvollstaendig', strengths: [], missing: ['Begründung fehlt.'], feedback: 'Erkläre die Wirkung genauer.' };
function modelResponse(evaluation = fixture, overrides = {}) {
  return { ok: true, status: 200, async text() {
    return JSON.stringify({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(evaluation) }, ...overrides }] });
  } };
}
function post(request = {}) {
  return { httpMethod: 'POST', path: '/', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requestId: 'test_request_01', taskId: 'b', answer: 'Ich weiß die Antwort noch nicht.', ...request }) };
}
const body = response => JSON.parse(response.body);

test('Healthcheck zeigt nur Status und ruft kein Modell auf', async () => {
  let calls = 0;
  const handle = createHandler({ env: { ...env, AI_EVALUATION_ENABLED: undefined }, fetchImpl: async () => { calls++; } });
  const response = await handle({ httpMethod: 'GET', path: '/', headers: {} });
  assert.equal(response.statusCode, 200);
  assert.equal(body(response).configured, true);
  assert.equal(body(response).evaluationEnabled, false);
  assert.equal(body(response).taskCount, Object.keys(core.TASKS).length);
  assert.equal(response.headers['Cache-Control'], 'no-store');
  assert.equal(calls, 0);
  assert.doesNotMatch(response.body, /test-secret|11111111|mistral-small/);
});

test('Auswertung ist ohne ausdrückliche Aktivierung gesperrt', async () => {
  let calls = 0;
  const handle = createHandler({ env: { ...env, AI_EVALUATION_ENABLED: undefined }, fetchImpl: async () => { calls++; } });
  const response = await handle(post());
  assert.equal(response.statusCode, 503);
  assert.equal(body(response).errorCode, 'EVALUATION_DISABLED');
  assert.equal(calls, 0);
});

test('Echte POST-Struktur, Projekt-URL, Schema und vorhandenes Feedbackformat', async () => {
  const observed = [];
  const handle = createHandler({ env, fetchImpl: async (url, options) => { observed.push({ url, options }); return modelResponse(); } });
  const event = post();
  event.headers.Origin = 'https://unterricht.example';
  const response = await handle(event);
  assert.equal(response.statusCode, 200);
  assert.equal(response.headers['Access-Control-Allow-Origin'], 'https://unterricht.example');
  assert.equal(body(response).requestId, 'test_request_01');
  assert.equal(body(response).type, core.RESULT_MESSAGE_TYPE);
  assert.equal(body(response).result.ok, true);
  assert.equal(body(response).result.maxPoints, 6);
  assert.equal(observed.length, 1);
  assert.equal(observed[0].url, `https://api.scaleway.ai/${env.AI_PROJECT_ID}/v1/chat/completions`);
  assert.equal(observed[0].options.headers.Authorization, 'Bearer ' + env.AI_API_KEY);
  assert.ok(observed[0].options.signal instanceof AbortSignal);
  const sent = JSON.parse(observed[0].options.body);
  assert.equal(sent.model, env.AI_MODEL);
  assert.equal(sent.response_format.type, 'json_schema');
  assert.equal(sent.response_format.json_schema.schema.additionalProperties, false);
  assert.deepEqual(sent.response_format.json_schema.schema.properties.maxPoints.enum, [6]);
  assert.equal('store' in sent, false);
  assert.equal(sent.messages[1].content, core.buildPrompt_(core.TASKS.b, 'Ich weiß die Antwort noch nicht.'));
});

test('Codeauswertung nutzt Programmcode und liefert passende Ergebnishülle', async () => {
  const taskId = Object.keys(core.TASKS).find(id => core.TASKS[id].responseType === 'code');
  const task = core.TASKS[taskId];
  let prompt;
  const value = { ...fixture, maxPoints: task.maxPoints };
  if (task.statusLabels) value.status = task.statusLabels.incorrect;
  const handle = createHandler({ env, fetchImpl: async (url, options) => {
    prompt = JSON.parse(options.body).messages[1].content;
    return modelResponse(value);
  } });
  const response = await handle(post({ taskId, code: 'Robot roboter = new Robot();', requestType: 'code' }));
  assert.equal(response.statusCode, 200);
  assert.equal(body(response).type, core.CODE_RESULT_MESSAGE_TYPE);
  assert.match(prompt, /BEGINN SCHUELERCODE/);
  assert.match(prompt, /statische Codeanalyse/);
  const wrong = await handle(post({ taskId, code: undefined }));
  assert.equal(wrong.statusCode, 400);
});

test('Ungültige Anfragen lösen keinen kostenpflichtigen Aufruf aus', async () => {
  let calls = 0;
  const handle = createHandler({ env, fetchImpl: async () => { calls++; return modelResponse(); } });
  const cases = [
    [post({ taskId: '__proto__' }), 400],
    [post({ requestId: '<script>' }), 400],
    [post({ answer: 'kurz' }), 400],
    [post({ answer: 'x'.repeat(3001) }), 400],
    [post({ answer: null }), 400],
    [post({ requestType: 'code-result' }), 400],
    [{ ...post(), body: '[' }, 400],
    [{ ...post(), body: 'null' }, 400],
    [{ ...post(), headers: { 'content-type': 'text/plain' } }, 415],
    [{ ...post(), body: 'x'.repeat(65537) }, 413],
    [{ ...post(), httpMethod: 'DELETE' }, 405],
    [{ ...post(), path: '/other' }, 404],
    [{ httpMethod: 'GET', path: '/', queryStringParameters: { answer: 'nicht im URL' } }, 400]
  ];
  for (const [event, status] of cases) assert.equal((await handle(event)).statusCode, status);
  assert.equal(calls, 0);
});

test('Base64 und UTF-8 werden korrekt gelesen; Codegrenze bleibt erhalten', async () => {
  let prompt;
  const handle = createHandler({ env, fetchImpl: async (url, options) => {
    prompt = JSON.parse(options.body).messages[1].content;
    return modelResponse();
  } });
  const event = post({ answer: 'Die Größe verändert sich über mehrere Schritte.' });
  event.body = Buffer.from(event.body, 'utf8').toString('base64');
  event.isBase64Encoded = true;
  assert.equal((await handle(event)).statusCode, 200);
  assert.match(prompt, /Größe verändert/);
  const taskId = Object.keys(core.TASKS).find(id => core.TASKS[id].responseType === 'code');
  assert.equal((await handle(post({ taskId, code: 'x'.repeat(12001) }))).statusCode, 400);
});

test('CORS erlaubt nur konfigurierte Origins und passende Voranfragen', async () => {
  let calls = 0;
  const handle = createHandler({ env, fetchImpl: async () => { calls++; return modelResponse(); } });
  const bad = post();
  bad.headers.origin = 'https://fremd.example';
  const rejected = await handle(bad);
  assert.equal(rejected.statusCode, 403);
  assert.equal(rejected.headers['Access-Control-Allow-Origin'], undefined);
  const preflight = { httpMethod: 'OPTIONS', path: '/', headers: {
    origin: 'https://unterricht.example', 'access-control-request-method': 'POST',
    'access-control-request-headers': 'content-type'
  } };
  assert.equal((await handle(preflight)).statusCode, 204);
  preflight.headers['access-control-request-headers'] = 'authorization';
  assert.equal((await handle(preflight)).statusCode, 403);
  assert.equal((await handle({ httpMethod: 'OPTIONS', path: '/', headers: {} })).statusCode, 400);
  assert.equal(calls, 0);
});

test('Modellfehler und Timeouts werden ohne Secrets/Antwortinhalte zurückgegeben', async () => {
  const cases = [
    [async () => ({ ok: false, status: 429 }), 429, 'MODEL_RATE_LIMIT'],
    [async () => ({ ok: false, status: 401 }), 503, 'MODEL_AUTHENTICATION'],
    [async () => ({ ok: false, status: 500 }), 502, 'MODEL_ERROR'],
    [async () => { throw new Error(env.AI_API_KEY); }, 502, 'MODEL_UNAVAILABLE'],
    [async () => { throw Object.assign(new Error(env.AI_API_KEY), { name: 'AbortError' }); }, 504, 'MODEL_TIMEOUT'],
    [async () => modelResponse(fixture, { finish_reason: 'length' }), 502, 'INVALID_MODEL_RESPONSE'],
    [async () => ({ ok: true, async text() { return env.AI_API_KEY; } }), 502, 'INVALID_MODEL_RESPONSE'],
    [async () => modelResponse({ ...fixture, points: '6' }), 502, 'INVALID_MODEL_RESPONSE'],
    [async () => modelResponse({ ...fixture, maxPoints: 100 }), 502, 'INVALID_MODEL_RESPONSE'],
    [async () => modelResponse({ ...fixture, feedback: '' }), 502, 'INVALID_MODEL_RESPONSE'],
    [async () => modelResponse({ ...fixture, missing: [null] }), 502, 'INVALID_MODEL_RESPONSE'],
    [async () => modelResponse({ ...fixture, extra: true }), 502, 'INVALID_MODEL_RESPONSE']
  ];
  for (const [fetchImpl, status, errorCode] of cases) {
    const response = await createHandler({ env, fetchImpl })(post());
    assert.equal(response.statusCode, status);
    assert.equal(body(response).errorCode, errorCode);
    assert.equal(body(response).result.ok, false);
    assert.doesNotMatch(response.body, /test-secret-never-return/);
  }
  assert.throws(() => validateEvaluation(null, core.TASKS.b));
});

test('Konfigurationsfehler werden vor dem Modellaufruf erkannt', async () => {
  for (const override of [ { AI_API_KEY: '' }, { AI_PROJECT_ID: 'https://fremd.example' }, { AI_MODEL: '' }, { AI_TIMEOUT_MS: '-1' } ]) {
    assert.throws(() => readConfig({ ...env, ...override }));
    const handle = createHandler({ env: { ...env, ...override }, fetchImpl: async () => { assert.fail('Kein Modellaufruf erwartet.'); } });
    assert.equal((await handle(post())).statusCode, 503);
  }
});

test('Lokale Aufrufbremse begrenzt Aufrufe ohne IPs oder Schülertexte zu speichern', async () => {
  let timestamp = 1000;
  let calls = 0;
  const handle = createHandler({ env, now: () => timestamp, rateLimit: 2,
    fetchImpl: async () => { calls++; return modelResponse(); } });
  assert.equal((await handle(post())).statusCode, 200);
  assert.equal((await handle(post())).statusCode, 200);
  const throttled = await handle(post());
  assert.equal(throttled.statusCode, 429);
  assert.equal(throttled.headers['Retry-After'], '60');
  assert.equal(calls, 2);
  timestamp += 60000;
  assert.equal((await handle(post())).statusCode, 200);
});

test('Alle Aufgaben, Prompts, Normalisierungen und Regeln stimmen mit den Originalen überein', () => {
  const context = vm.createContext({});
  for (const filename of ['Tasks.gs', 'EvaluationSchema.gs', 'Helpers.gs', 'Rules.gs', 'Gemini.gs']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', '..', 'apps-script', filename), 'utf8'), context);
  }
  assert.equal(JSON.stringify(core.TASKS), vm.runInContext('JSON.stringify(TASKS)', context));
  assert.equal(JSON.stringify(core.EVALUATION_SCHEMA), vm.runInContext('JSON.stringify(EVALUATION_SCHEMA)', context));
  const examples = [
    'Ich weiß die Antwort noch nicht.',
    'Die Trainingsfehler sinken von 3 über 1 auf 0. Die Testgenauigkeit bleibt gleich. Weniger Trainingsfehler führen hier nicht zu einer höheren Testgenauigkeit.',
    'Der Baum teilt am ersten Knoten nach der Schuppenfarbe in zwei Blätter. Die Gruppen sind noch gemischt. Eine größere Baumtiefe ermöglicht weitere Aufteilungen.',
    'Circle ball = new Circle(200, 50, 50); ball.move(10, 10); ball.setFillColor(Color.red); ball.destroy();'
  ];
  for (const [id, task] of Object.entries(core.TASKS)) {
    const originalTask = vm.runInContext(`TASKS[${JSON.stringify(id)}]`, context);
    for (const answer of examples) {
      assert.equal(core.buildPrompt_(task, answer), context.buildPrompt_(originalTask, answer), `Prompt ${id}`);
      const input = { ...fixture, maxPoints: task.maxPoints };
      const actual = core.applyRuleBasedMinimum_(core.normalizeEvaluation_(input, task), task, answer);
      const original = context.applyRuleBasedMinimum_(context.normalizeEvaluation_(input, originalTask), originalTask, answer);
      assert.equal(JSON.stringify(actual), JSON.stringify(original), `Bewertung ${id}`);
    }
  }
});
