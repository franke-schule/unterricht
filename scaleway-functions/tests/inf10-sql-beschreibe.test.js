'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { pathToFileURL } = require('node:url');
const core = require('../evaluation-core');
const cases = require('./fixtures/sql-description-cases.json');
const folder = path.resolve(__dirname, '../../faecher/informatik/klasse-10/1-Datenbanken');

test('Inf10: alle SQL-Beschreibe-Aufgaben der Webseiten sind mit den zentralen Kriterien verbunden', async () => {
  const source = fs.readFileSync(path.join(folder, 'sql-lab.js'), 'utf8');
  const config = source.match(/const tasks = ([\s\S]*?);\r?\n\r?\nfunction sql/);
  assert.ok(config, 'SQL-Lab-Aufgabenkonfiguration fehlt');
  const tasks = vm.runInNewContext('(' + config[1] + ')', {
    sql() {}, info() {}, BIRTHDAY_MONTH_DAY: '10-02',
    describe(id, number, prompt, statement, serverTaskId) { return { id, statement, serverTaskId }; }
  });
  const lab = Object.values(tasks).flat().filter(Boolean);
  const { JOIN_TASKS } = await import(pathToFileURL(path.join(folder, 'aufgabe9-daten.mjs')).href);
  const joins = JOIN_TASKS.filter(task => task.type === 'describe')
    .map(task => ({ ...task, serverTaskId: 'inf10-db-a9-' + task.id.toLowerCase() }));
  const clientTasks = [...lab, ...joins];
  const serverIds = Object.entries(core.TASKS).filter(([, task]) => task.grade === 10 && task.sqlDescription)
    .map(([id]) => id).sort();
  assert.deepEqual(clientTasks.map(task => task.serverTaskId).sort(), serverIds);
  const normalizeSql = sql => sql.replace(/\s+/g, ' ').trim().replace(/;$/, '').toLowerCase();
  for (const task of clientTasks) {
    const server = core.TASKS[task.serverTaskId];
    const query = server.context.slice(server.context.indexOf('SELECT')).split(';')[0];
    assert.equal(normalizeSql(query), normalizeSql(task.statement), task.serverTaskId + ': angezeigte Abfrage stimmt mit Server überein');
    assert.ok(core.buildPrompt_(server, 'Eine Beschreibung mit eigenen Worten.').includes('Gemeinsame Kriterien für SQL-Beschreibe-Aufgaben:'));
    assert.equal(server.sqlDescription.requireUnchangedSource, false);
    // Jede Aufgabe ist auch mit und ohne die freiwillige Ergänzung abgedeckt.
    const full = cases.filter(fixture => fixture.taskId === task.serverTaskId && fixture.kind === 'correct');
    assert.ok(full.some(fixture => /Ausgangstabellen bleiben unverändert/.test(fixture.answer)), task.serverTaskId);
    assert.ok(full.some(fixture => !/unverändert/.test(fixture.answer)), task.serverTaskId);
  }
});

test('Inf10: die einzelnen Rubriken akzeptieren deutsche Beschreibungen von Ausgabe, Filter, Minimum und Sortierung', () => {
  const filter = core.TASKS['sql-b2-3'];
  assert.match(filter.expectedAspects[1], /Benutzernamen.*Geburtstage.*Geburtsdaten/);
  assert.match(filter.rubric.join(' '), /ohne city, WHERE/);
  const minimum = core.TASKS['sql-b3-1'];
  assert.match(minimum.context, /AS kleinste_groesse/);
  assert.ok(minimum.sqlDescription.aliases.kleinste_groesse.includes('kleinste_Groesse'));
  assert.match(minimum.rubric.join(' '), /ohne MIN oder centimeters/);
  assert.match(minimum.rubric.join(' '), /ohne AS/);
  const latest = core.TASKS['sql-b3-3'];
  assert.match(latest.rubric.join(' '), /ohne created_at oder DESC/);
  assert.match(latest.rubric.join(' '), /ohne LIMIT/);
});

test('Inf10: verständliche Personen- und Fotozuordnungen genügen ohne wörtliche Schlüsselgleichungen', () => {
  for (const id of ['p2', 'p5', 'p8', 'p11']) {
    const task = core.TASKS['inf10-db-a9-' + id];
    assert.equal(task.expectedAspects.length, 4);
    assert.equal(task.rubric.length, 4);
    assert.equal(task.maxPoints, 4);
    assert.match(task.rubric.join(' '), /nicht.*(?:wörtlich|zusätzlich)|ohne.*(?:Spaltennamen|Schlüsselgleichung)/);
  }
  assert.match(core.TASKS['inf10-db-a9-p8'].rubric.join(' '), /Verwechslung mit der hochladenden Person bleibt falsch/);
  assert.match(core.TASKS['inf10-db-a9-p11'].rubric.join(' '), /Gesamtzahl.*erfüllt weder/);
});
