import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import test from 'node:test';
import vm from 'node:vm';
import { compareRelations, normalizeRelation, parseDelimited, sqlTokens } from '../../../klasse-10/1-Datenbanken/sql-lab-core.mjs';

const require = createRequire(import.meta.url);
const initSqlJs = require('../../../../../include/lib/sql.js/sql-wasm.js');
const SQL = await initSqlJs({ wasmBinary: new Uint8Array(await readFile(new URL('../../../../../include/lib/sql.js/sql-wasm.wasm', import.meta.url))) });
const db = new SQL.Database();
const [headers, ...rows] = parseDelimited(await readFile(new URL('../../../klasse-10/1-Datenbanken/users.csv', import.meta.url), 'utf8'));
const numeric = new Set(['id', 'centimeters', 'is_active']);
db.run(`CREATE TABLE users (${headers.map(name => `"${name}" ${numeric.has(name) ? 'INTEGER' : 'TEXT'}`).join(', ')})`);
const insert = db.prepare(`INSERT INTO users VALUES (${headers.map(() => '?').join(', ')})`);
for (const row of rows) insert.run(row.map((value, index) => value === 'NULL' ? null : numeric.has(headers[index]) ? Number(value) : value));
insert.free();

// Dieselben Aufgaben und dieselbe Auswertung wie auf der Seite, mit der
// vorhandenen SQL-Engine; weder Modellantworten noch Sollurteile simulieren.
const source = await readFile(new URL('../aufgabe3.js', import.meta.url), 'utf8');
const context = vm.createContext({ compareRelations, normalizeRelation, sqlTokens,
  USER_COLUMN_NAMES: headers, database: { exec: async sql => normalizeRelation(db.exec(sql)) } });
vm.runInContext(source.slice(source.indexOf('const TASKS ='), source.indexOf('const TASK_BY_ID')) +
  source.slice(source.indexOf('function quoteIdentifier('), source.indexOf('function taskCard(')) +
  '\nglobalThis.checks = { tasks: TASKS, analyzeQuery, evaluate };', context);
const { tasks, analyzeQuery, evaluate } = context.checks;
const judge = async (task, sql) => evaluate(task, analyzeQuery(sql), normalizeRelation(db.exec(sql)));

test.after(() => db.close());

test('alle 21 SQL-Aufgaben akzeptieren Referenz, Aliasse, Formatierung und harmlose Zusatzbedingungen', async () => {
  assert.equal(tasks.length, 21);
  for (const task of tasks) {
    const variants = [task.sql, task.sql.replace(/^SELECT/, 'select').replace(' FROM ', '\nfrom '),
      task.sql.replace('FROM users', 'FROM users AS u'),
      task.sql.replace('FROM users', 'FROM main.users'),
      task.sql.replace(' WHERE ', ' WHERE (') + ') AND 1=1'];
    for (const sql of variants) assert.equal((await judge(task, sql)).level, 'success', `${task.id}: ${sql}`);
  }
});

test('jede SQL-Aufgabe prüft auch Bedingungen, die nur zufällig dieselben Übungsdaten auswählen', async () => {
  for (const task of tasks) {
    const sql = task.sql.replace(' WHERE ', ' WHERE (') + ') AND id < 900000';
    assert.ok(compareRelations(db.exec(sql), db.exec(task.sql)).correct, `${task.id}: Fehler ist in Übungsdaten unsichtbar`);
    const result = await judge(task, sql);
    assert.notEqual(result.level, 'success', `${task.id}: zufällig gleiche Ergebnisrelation ist kein Beleg für die richtige Bedingung`);
    assert.match(result.text, /Bedingung|WHERE/);
    if (task.number !== 17) assert.match(result.text, /schließt auch passende Mitglieder aus/, task.id);
  }
});

test('Gegenbeispiele erkennen auswendig ausgewählte Mitglieder und zusätzliche Ausschlüsse', async () => {
  for (const task of tasks) {
    const ids = normalizeRelation(db.exec(task.sql.replace(/^SELECT .*? FROM/, 'SELECT id FROM'))).values.map(([id]) => id);
    assert.ok(ids.length > 0, task.id);
    const sql = task.sql.replace(' WHERE ', ' WHERE (') + `) AND id IN (${ids.join(',')})`;
    assert.ok(compareRelations(db.exec(sql), db.exec(task.sql)).correct);
    assert.notEqual((await judge(task, sql)).level, 'success', `${task.id}: feste ID-Liste löst den Filterauftrag nicht allgemein`);
  }
});

test('gleichwertige Vergleiche, vertauschte AND-Bedingungen und Spaltenaliase bleiben korrekt', async () => {
  const variants = [
    [6, "SELECT name FROM users WHERE city <> 'Leipzig'"],
    [11, "SELECT * FROM users WHERE city = 'Leipzig' AND gender = 'female'"],
    [19, "SELECT birthday AS geburtstag, username AS benutzer FROM users WHERE centimeters < 160 AND gender = 'female'"],
    [21, "SELECT * FROM users WHERE city = 'Berlin' AND (name LIKE 'Hailey %' OR name LIKE 'Lina %')"]
  ];
  for (const [number, sql] of variants) assert.equal((await judge(tasks[number - 1], sql)).level, 'success', sql);
});

test('Grenzwerte, Muster, fehlende Spalten und AND/OR-Fehler bleiben fehlerhaft', async () => {
  const variants = [
    [1, "SELECT username FROM users WHERE gender = 'female'"],
    [4, 'SELECT * FROM users WHERE centimeters <= 180'],
    [7, "SELECT * FROM users WHERE name LIKE '%B%'"],
    [8, "SELECT * FROM users WHERE username LIKE 'fuchs%'"],
    [9, "SELECT name FROM users WHERE birthday LIKE '%03%'"],
    [10, "SELECT * FROM users WHERE name LIKE 'Lina %' OR city = 'Berlin'"],
    [12, "SELECT * FROM users WHERE name LIKE 'Lina %' AND name LIKE 'Felix %'"],
    [17, "SELECT * FROM users WHERE email LIKE '%@instahub.test' OR 1=1"],
    [18, "SELECT name FROM users WHERE name LIKE 'Schmidt%'"],
    [19, "SELECT name, birthday FROM users WHERE gender = 'female' AND centimeters < 160"],
    [20, "SELECT * FROM users WHERE name LIKE 'Felix %' AND city = 'Berlin'"],
    [21, "SELECT * FROM users WHERE name LIKE 'Lina %' OR name LIKE 'Hailey %' AND city = 'Berlin'"]
  ];
  for (const [number, sql] of variants) assert.notEqual((await judge(tasks[number - 1], sql)).level, 'success', sql);
});
