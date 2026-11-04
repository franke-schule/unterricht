'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { createHandler } = require('../handler');
const { createPasswordHash } = require('../create-access-password-hash');
const core = require('../evaluation-core');
const { TEST_PASSWORD, TEST_PASSWORD_HASH, TEST_PASSWORD_HEADER } = require('./fixtures/authorized-handler');

const env = {
  AI_API_KEY: 'dummy-model-key', AI_PROJECT_ID: '11111111-1111-1111-1111-111111111111',
  AI_MODEL: 'dummy-model', AI_EVALUATION_ENABLED: 'true',
  AI_ALLOWED_ORIGINS: 'https://unterricht.example', AI_ACCESS_PASSWORD_HASH: TEST_PASSWORD_HASH
};
const encode = password => Buffer.from(password, 'utf8').toString('base64');
const post = (password = TEST_PASSWORD_HEADER, request = {}) => ({
  httpMethod: 'POST', path: '/', headers: { 'Content-Type': 'application/json', 'X-AI-Password': password },
  body: JSON.stringify({ requestId: 'auth_test_request', taskId: 'b', answer: 'Eine synthetische Antwort ohne vollständige Begründung.', ...request })
});
const responseBody = response => JSON.parse(response.body);
function mockModel(taskId = 'b') {
  return { ok: true, status: 200, text: async () => JSON.stringify({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify({
    criteria: Object.fromEntries(core.TASKS[taskId].feedbackCriteria.map(c => [c.id, { status: 'missing', evidence: [] }]))
  }) } }] }) };
}

test('Fehlendes, falsches oder ungültig kodiertes Passwort löst kein Modell aus', async () => {
  let calls = 0;
  const handle = createHandler({ env, fetchImpl: async () => { calls++; return mockModel(); } });
  for (const password of ['', null, encode('falsch'), 'unverschluesseltes-Passwort', 'Zg=', 'Zh==',
    'a'.repeat(345), encode('x'.repeat(257)), '/w==', encode('mit\nZeilenumbruch')]) {
    const response = await handle(post(password));
    assert.equal(response.statusCode, 401);
    assert.equal(responseBody(response).errorCode, 'AUTH_REQUIRED');
    assert.equal(responseBody(response).result.ok, false);
    assert.ok(!response.body.includes(TEST_PASSWORD));
    assert.ok(!response.body.includes(TEST_PASSWORD_HASH));
  }
  assert.equal(calls, 0);
});

test('Kein Secret oder defekter Prüfwert sperrt KI-Aufrufe, Healthcheck bleibt verfügbar', async () => {
  for (const hash of [undefined, '', 'klartext', TEST_PASSWORD_HASH + '\n', TEST_PASSWORD_HASH.replace('32768', '99999999')]) {
    const handle = createHandler({ env: { ...env, AI_ACCESS_PASSWORD_HASH: hash }, fetchImpl: async () => assert.fail('Kein Modellaufruf') });
    const rejected = await handle(post());
    assert.equal(rejected.statusCode, 503);
    assert.equal(responseBody(rejected).errorCode, 'AUTH_CONFIGURATION');
    const health = await handle({ httpMethod: 'GET', path: '/health' });
    assert.equal(health.statusCode, 200);
    assert.equal(responseBody(health).accessProtection, 'password-v1');
    assert.equal(responseBody(health).accessConfigured, false);
    assert.equal(responseBody(health).configured, false);
    assert.ok(!health.body.includes(TEST_PASSWORD_HASH));
  }
});

test('Richtiges Passwort erlaubt direkte Text- und Codeanfragen, nie Weitergabe an das Modell', async () => {
  const codeId = Object.keys(core.TASKS).find(id => core.TASKS[id].responseType === 'code');
  for (const taskId of ['b', codeId]) {
    let calls = 0;
    const handle = createHandler({ env, fetchImpl: async (_url, options) => {
      calls++;
      const sent = JSON.stringify(options);
      for (const secret of [TEST_PASSWORD, TEST_PASSWORD_HEADER, TEST_PASSWORD_HASH]) assert.ok(!sent.includes(secret));
      return mockModel(taskId);
    } });
    const event = post(TEST_PASSWORD_HEADER, { taskId, ...(taskId === codeId ? { requestType: 'code', code: 'Robot roboter = new Robot();' } : {}) });
    // Weder Origin noch Browser erforderlich; die Berechtigung wird trotzdem geprüft.
    assert.equal((await handle(event)).statusCode, 200);
    assert.equal(calls, 1);
    delete event.headers['X-AI-Password'];
    assert.equal((await handle(event)).statusCode, 401);
    assert.equal(calls, 1);
  }
});

test('Kurze Passwörter, Unicode und führendes BOM werden ohne Normalisierung unterstützt', async () => {
  for (const password of ['x', 'ä🔐 kurz', '\uFEFFkurz', ' mit Leerzeichen ']) {
    const handle = createHandler({ env: { ...env, AI_ACCESS_PASSWORD_HASH: createPasswordHash(password) }, fetchImpl: async () => mockModel() });
    assert.equal((await handle(post(encode(password)))).statusCode, 200);
  }
});

test('Beliebig viele Fehlversuche erzeugen keine Sperre und verbrauchen keine Modellplätze', async () => {
  let calls = 0;
  const handle = createHandler({ env, rateLimit: 1, fetchImpl: async () => { calls++; return mockModel(); } });
  for (let attempt = 0; attempt < 12; attempt++) assert.equal((await handle(post(encode('falsch')))).statusCode, 401);
  assert.equal((await handle(post())).statusCode, 200);
  assert.equal((await handle(post())).statusCode, 429);
  assert.equal(calls, 1);
});

test('Passwortwechsel greift ohne Browseränderung und der Header ist case-insensitiv', async () => {
  const mutableEnv = { ...env };
  const handle = createHandler({ env: mutableEnv, fetchImpl: async () => mockModel() });
  assert.equal((await handle(post())).statusCode, 200);
  mutableEnv.AI_ACCESS_PASSWORD_HASH = createPasswordHash('neu');
  assert.equal((await handle(post())).statusCode, 401);
  const event = post(encode('neu'));
  event.headers['x-ai-password'] = event.headers['X-AI-Password'];
  delete event.headers['X-AI-Password'];
  assert.equal((await handle(event)).statusCode, 200);
});

test('CORS-Preflight für den Passwortheader benötigt selbst kein Passwort', async () => {
  const handle = createHandler({ env, fetchImpl: async () => assert.fail('Kein Modellaufruf') });
  const event = { httpMethod: 'OPTIONS', path: '/', headers: {
    Origin: 'https://unterricht.example', 'Access-Control-Request-Method': 'POST',
    'Access-Control-Request-Headers': 'Content-Type, X-AI-Password'
  } };
  const response = await handle(event);
  assert.equal(response.statusCode, 204);
  assert.match(response.headers['Access-Control-Allow-Headers'], /X-AI-Password/);
  event.headers['Access-Control-Request-Headers'] += ', unbekannt';
  assert.equal((await handle(event)).statusCode, 403);
  event.headers.Origin = 'https://fremd.example';
  assert.equal((await handle(event)).statusCode, 403);
});

test('Parallele autorisierte Anfragen überschreiten die bestehende lokale Bremse nicht', async () => {
  let calls = 0;
  const handle = createHandler({ env, rateLimit: 1, fetchImpl: async () => { calls++; return mockModel(); } });
  const results = await Promise.all([handle(post()), handle(post()), handle(post())]);
  assert.deepEqual(results.map(r => r.statusCode).sort(), [200, 429, 429]);
  assert.equal(calls, 1);
});
