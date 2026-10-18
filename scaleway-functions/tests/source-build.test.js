'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { execFileSync } = require('node:child_process');
const core = require('../evaluation-core');
const { createHandler } = require('../handler');

test('Scaleway lässt sich ohne Google-Archiv vollständig bauen', () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'unterricht-scaleway-build-'));
  try {
    fs.copyFileSync(path.join(__dirname, '..', 'build-core.js'), path.join(directory, 'build-core.js'));
    fs.cpSync(path.join(__dirname, '..', 'source'), path.join(directory, 'source'), { recursive: true });
    execFileSync(process.execPath, ['build-core.js'], { cwd: directory });
    const built = require(path.join(directory, 'evaluation-core.js'));
    const manifest = JSON.parse(fs.readFileSync(path.join(directory, 'source-manifest.json'), 'utf8'));
    assert.deepEqual(built.TASKS, core.TASKS);
    assert.deepEqual(built.EVALUATION_SCHEMA, core.EVALUATION_SCHEMA);
    assert.equal(manifest.taskCount, Object.keys(core.TASKS).length);
    assert.deepEqual(Object.keys(manifest.sources).sort(),
      ['config.js', 'tasks.js', 'evaluation-schema.js', 'helpers.js', 'rules.js', 'prompt.js'].sort());
  } finally {
    const resolvedDirectory = fs.realpathSync(directory);
    assert.equal(path.dirname(resolvedDirectory), fs.realpathSync(os.tmpdir()));
    assert.ok(path.basename(resolvedDirectory).startsWith('unterricht-scaleway-build-'));
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

test('Gelöschte Inf9-DB-Aufgabe 2 ist unbekannt und löst keine KI-Auswertung aus', async () => {
  const handle = createHandler({ env: { AI_EVALUATION_ENABLED: 'true' },
    fetchImpl: async () => assert.fail('Gelöschte Aufgaben dürfen kein Modell aufrufen.') });
  for (const taskId of ['inf9-wichmatics-e1-buch', 'inf9-wichmatics-e2-spalten',
    'inf9-wichmatics-e3-fehler', 'inf9-wichmatics-w2b-motivation']) {
    assert.equal(Object.hasOwn(core.TASKS, taskId), false);
    const response = await handle({ httpMethod: 'POST', path: '/',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId: 'removed_task_probe', taskId, answer: 'Eine ausreichend lange Testantwort.' }) });
    assert.equal(response.statusCode, 400);
    assert.equal(JSON.parse(response.body).errorCode, 'UNKNOWN_TASK');
  }
});
