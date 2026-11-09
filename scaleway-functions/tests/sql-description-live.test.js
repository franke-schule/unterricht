'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const core = require('../evaluation-core');
const cases = require('./fixtures/sql-description-cases.json');
const source = fs.readFileSync(path.join(__dirname, 'sql-description-live.check.js'), 'utf8');

async function run(args, respond) {
  const calls = [];
  const reports = [];
  const context = vm.createContext({ URL, AbortSignal, setTimeout: callback => callback(),
    console: { log() {}, error() {} }, process: { argv: ['node', 'check.js', ...args] },
    require: name => {
      if (name === 'node:fs') return { writeFileSync: (file, content) => reports.push(JSON.parse(content)) };
      if (name === '../evaluation-core') return core;
      if (name === './fixtures/sql-description-cases.json') return cases;
      throw new Error('Unerwartetes Modul: ' + name);
    }, fetch: async (url, options) => {
      const request = JSON.parse(options.body);
      calls.push(request);
      return respond(request, calls.length);
    }
  });
  await vm.runInContext(source, context);
  return { calls, reports, exitCode: context.process.exitCode };
}

function response(request, points) {
  const task = core.TASKS[request.taskId];
  return { ok: true, status: 200, json: async () => ({ requestId: request.requestId,
    type: core.RESULT_MESSAGE_TYPE,
    result: { ok: true, points, maxPoints: task.maxPoints, feedback: 'Simulierte Rückmeldung.', missing: [] } }) };
}

test('Live-Prüfwerkzeug sendet ohne --live keine Anfrage', async () => {
  const result = await run(['--dry-run'], () => { throw new Error('Darf nicht aufgerufen werden'); });
  assert.equal(result.calls.length, 0);
  assert.equal(result.reports.length, 0);
  assert.equal(result.exitCode, undefined);
});

test('Live-Prüfwerkzeug wiederholt nur gewählte synthetische Fälle und speichert den Vergleich', async () => {
  const taskId = 'inf9-db2-beschreibe-projektion';
  const result = await run(['--live', '--runs', '2', '--task', taskId, '--out', 'report.json'], request => {
    const fixture = cases.find(item => item.taskId === request.taskId && item.answer === request.answer);
    return response(request, fixture.expectedPoints);
  });
  const expectedCalls = 2 * cases.filter(item => item.taskId === taskId).length;
  assert.equal(result.calls.length, expectedCalls);
  assert.ok(result.calls.every(request => request.taskId === taskId));
  assert.equal(new Set(result.calls.map(request => request.requestId)).size, expectedCalls);
  const report = result.reports.at(-1);
  assert.equal(report.completed, true);
  assert.equal(report.passed, expectedCalls);
  assert.equal(report.failed, 0);
  assert.equal(result.exitCode, undefined);
});

test('Live-Prüfwerkzeug meldet abweichende Punkte und beendet die Serie bei technischen Fehlern', async () => {
  const args = ['--live', '--runs', '1', '--task', 'inf9-db2-beschreibe-projektion', '--out', 'report.json'];
  const mismatch = await run(args, request => response(request, 0));
  assert.equal(mismatch.exitCode, 1);
  assert.ok(mismatch.reports.at(-1).failed > 0);
  const unavailable = await run(args, () => ({ ok: false, status: 503, json: async () => ({ errorCode: 'EVALUATION_DISABLED' }) }));
  assert.equal(unavailable.calls.length, 1);
  assert.equal(unavailable.reports.at(-1).completed, false);
  assert.equal(unavailable.exitCode, 1);
});

test('Live-Prüfwerkzeug weist widersprüchliche und ungültige Optionen vor dem Versand zurück', async () => {
  for (const args of [ ['--live', '--dry-run'], ['--runs', '0'], ['--task', 'unbekannt'],
    ['--url', 'http://example.org/'], ['--url', 'https://secret@example.org/'], ['--unknown'] ]) {
    const result = await run(args, () => { throw new Error('Darf nicht aufgerufen werden'); });
    assert.equal(result.calls.length, 0);
    assert.equal(result.exitCode, 1);
  }
});
