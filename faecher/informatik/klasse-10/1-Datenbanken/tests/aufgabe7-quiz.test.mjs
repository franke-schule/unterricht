import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { assessQuizSql, SQL_TASKS, SQL_DATA, MC_QUESTIONS, TOTAL_POINTS } from '../aufgabe7-quiz.js';

const require = createRequire(import.meta.url);
const initSqlJs = require('../../../../../include/lib/sql.js/sql-wasm.js');
const SQL = await initSqlJs({ wasmBinary: new Uint8Array(await readFile(new URL('../../../../../include/lib/sql.js/sql-wasm.wasm', import.meta.url))) });
const db = new SQL.Database();
db.run(SQL_DATA);
const assess = (sql, index = 0) => assessQuizSql(sql, SQL_TASKS[index], (query) => db.exec(query));
assert.equal(TOTAL_POINTS, 26);
assert.ok(MC_QUESTIONS.filter((q) => q.options.filter((o) => o.correct).length > 1).length >= 2);
for (const task of SQL_TASKS) {
  const result = assessQuizSql(task.referenceSql, task, (query) => db.exec(query));
  assert.equal(result.status, 'success', task.id);
  assert.ok(result.actual.values.length > 0, task.id);
}
assert.equal(assess("SELECT p.url AS link FROM photos p INNER JOIN users u ON p.user_id = u.id WHERE u.username = 'samina369' ORDER BY p.url DESC").status, 'success');
assert.equal(assess("SELECT photos.url FROM users, photos WHERE photos.user_id = users.id AND 'samina369' = users.username").status, 'success');
assert.equal(assess("SELECT photos.url FROM users, photos WHERE users.id = photos.id AND users.username = 'samina369'").status, 'partial');
assert.equal(assess("SELECT photos.url FROM users, photos WHERE users.id = photos.user_id OR users.username = 'samina369'").status, 'partial');
assert.equal(assess("SELECT photos.url FROM users, photos WHERE users.username = 'samina369'").status, 'partial');
assert.equal(assess("SELECT photos.url FROM users, photos WHERE users.id = photos.user_id AND users.username = 'samina369' LIMIT 1").status, 'partial');
assert.equal(assess("SELECT users.name FROM users, photos WHERE users.id = photos.user_id AND users.username = 'samina369'").status, 'partial');
assert.equal(assess("SELECT photos.* FROM users, photos WHERE users.id = photos.user_id AND users.city = 'Hamburg'", 1).status, 'success');
assert.equal(assess("SELECT users.name FROM users, photos WHERE users.id = photos.user_id AND photos.description LIKE '%Teddybären%'", 2).status, 'partial');
assert.equal(assess('SELECT unknown FROM users, photos').valid, false);
assert.equal(assess('DELETE FROM users').valid, false);
assert.equal(assess('SELECT * FROM users; DROP TABLE photos').valid, false);
assert.equal(assess('SELECT * FROM users, photos WHERE id = 7').valid, false);
assert.equal(db.exec('SELECT COUNT(*) FROM users')[0].values[0][0], 4);
db.close();
console.log('Verbund-Quiz: Referenzabfragen, SQL-Varianten, falsche Verbindungen, OR, Filter und Schreibschutz geprüft.');
