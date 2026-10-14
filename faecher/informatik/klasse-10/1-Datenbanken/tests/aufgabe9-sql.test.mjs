import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { JOIN_TASKS } from '../aufgabe9-daten.mjs';
import { compareRelations, normalizeRelation, parseDelimited, validateSelectStatement } from '../sql-lab-core.mjs';

const require = createRequire(import.meta.url);
const initSqlJs = require('../../../../../include/lib/sql.js/sql-wasm.js');
const folder = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SQL = await initSqlJs({ wasmBinary: new Uint8Array(await readFile(resolve(folder, '../../../../include/lib/sql.js/sql-wasm.wasm'))) });
const db = new SQL.Database();
const numeric = new Set(['id', 'user_id', 'photo_id', 'following_id', 'follower_id', 'centimeters', 'is_active']);
const quote = (name) => `"${name.replaceAll('"', '""')}"`;
const rowCounts = [317, 1467, 6039, 8846, 25184, 4351];
for (const [index, name] of ['users', 'photos', 'follows', 'comments', 'likes', 'tags'].entries()) {
  const [headers, ...rows] = parseDelimited(await readFile(resolve(folder, `${name}.csv`), 'utf8'));
  assert.equal(rows.length, rowCounts[index], `${name}: Anzahl Datensätze`);
  assert.ok(rows.every((row) => row.length === headers.length), `${name}: Zeilenbreiten`);
  db.run(`CREATE TABLE ${quote(name)} (${headers.map((header) => `${quote(header)} ${numeric.has(header) ? 'INTEGER' : 'TEXT'}`).join(', ')})`);
  const insert = db.prepare(`INSERT INTO ${quote(name)} (${headers.map(quote).join(', ')}) VALUES (${headers.map(() => '?').join(', ')})`);
  db.run('BEGIN');
  for (const row of rows) insert.run(row.map((value, position) => value === 'NULL' ? null : numeric.has(headers[position]) && /^-?\d+$/.test(value) ? Number(value) : value));
  db.run('COMMIT'); insert.free();
}

const expectedCounts = [4, 57, 18, 21, 8, 54, 1, 18, 11, 11, 11, 1, 11, 5, 22, 1, 10, 10, 10, 10, 50, 7, 24, 87, 21];
assert.equal(JOIN_TASKS.length, 25);
JOIN_TASKS.forEach((task, index) => {
  assert.equal(validateSelectStatement(task.statement).ok, true, `${task.id}: lesende Abfrage`);
  const relation = normalizeRelation(db.exec(task.statement));
  assert.equal(relation.values.length, expectedCounts[index], `${task.id}: Ergebniszeilen`);
  assert.ok(relation.columns.length > 0, `${task.id}: Spalten`);
});
assert.equal(normalizeRelation(db.exec(JOIN_TASKS.find((task) => task.id === 'P7').statement)).values[0][0], 21);
assert.equal(normalizeRelation(db.exec(JOIN_TASKS.find((task) => task.id === 'P12').statement)).values[0][0], 57);
for (const id of ['P10', 'Z3', 'Z8', 'Z13']) {
  const relation = normalizeRelation(db.exec(JOIN_TASKS.find((task) => task.id === id).statement));
  assert.equal(new Set(relation.values.map((row) => row[0])).size, relation.values.length, `${id}: keine doppelte Person`);
}
const p1 = JOIN_TASKS.find((task) => task.id === 'P1').statement;
const z13 = JOIN_TASKS.find((task) => task.id === 'Z13').statement;
const unionWithoutSubquery = 'SELECT DISTINCT users.username, users.name FROM users, follows WHERE users.id = follows.follower_id AND follows.following_id = 2 UNION SELECT users.username, users.name FROM users WHERE 1=0 ORDER BY 1';
assert.equal(compareRelations(db.exec(unionWithoutSubquery), db.exec(z13), { columnOrder: true, rowOrder: true }).correct, true, 'Z13-UNION liefert zufällig dieselbe Relation ohne Unterabfrage');
const join = "SELECT p.url FROM users AS u INNER JOIN photos AS p ON u.id = p.user_id WHERE u.username = 'wanderwut_finn' ORDER BY p.id;";
const wrong = "SELECT p.url FROM users AS u INNER JOIN photos AS p ON u.id = p.id WHERE u.username = 'wanderwut_finn' ORDER BY p.id";
assert.equal(compareRelations(db.exec(join), db.exec(p1), { columnOrder: true, rowOrder: true }).correct, true, 'JOIN, ON, Alias, Semikolon');
assert.equal(compareRelations(db.exec(wrong), db.exec(p1), { columnOrder: true, rowOrder: true }).correct, false, 'falsche Schlüsselverbindung');
assert.equal(compareRelations(db.exec("SELECT photos.url FROM users, photos WHERE users.id = photos.user_id AND users.username = 'niemand'"), db.exec(p1)).correct, false, 'leeres Ergebnis');
assert.throws(() => db.exec('SELECT FROM users'), /syntax error/i);
db.close();
console.log('25 InstaHub-Referenzen, CSV-Zeilen, Alias-JOIN und Fehlerfälle erfolgreich geprüft.');
