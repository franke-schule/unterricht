import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { compareRelations, normalizeRelation, parseDelimited } from '../sql-lab-core.mjs';

const require = createRequire(import.meta.url);
const initSqlJs = require('../../../../../include/lib/sql.js/sql-wasm.js');
const here = dirname(fileURLToPath(import.meta.url));
const databaseFolder = resolve(here, '..');
const repository = resolve(databaseFolder, '../../../..');
const SQL = await initSqlJs({ wasmBinary: new Uint8Array(await readFile(resolve(repository, 'include/lib/sql.js/sql-wasm.wasm'))) });
const [headers, ...rows] = parseDelimited(await readFile(resolve(databaseFolder, 'users.csv'), 'utf8'));
const numeric = new Set(['id', 'centimeters', 'is_active']);
const quote = (value) => `"${value.replaceAll('"', '""')}"`;
const value = (cell, header) => cell === 'NULL' ? 'NULL' : numeric.has(header) && /^-?\d+$/.test(cell) ? cell : `'${cell.replaceAll("'", "''")}'`;
const db = new SQL.Database();
db.run(`CREATE TABLE users (${headers.map((header) => `${quote(header)} ${numeric.has(header) ? 'INTEGER' : 'TEXT'}`).join(', ')})`);
for (const row of rows) db.run(`INSERT INTO users (${headers.map(quote).join(', ')}) VALUES (${headers.map((header, index) => value(row[index], header)).join(', ')})`);

const today = new Date(); const monthDay = new Date(today - today.getTimezoneOffset() * 60000).toISOString().slice(5, 10);
const references = [
  "SELECT * FROM users WHERE gender = 'female'", "SELECT * FROM users WHERE country = 'Deutschland'", 'SELECT * FROM users WHERE centimeters < 180', "SELECT name FROM users WHERE city != 'Leipzig'", "SELECT * FROM users WHERE gender = 'female' AND city = 'Leipzig'", "SELECT name FROM users WHERE (gender = 'male' AND centimeters > 165) OR (gender = 'female' AND centimeters > 160)", "SELECT * FROM users WHERE name LIKE 'B%'", "SELECT COUNT(*) AS anzahl FROM users WHERE city = 'München'", `SELECT * FROM users WHERE birthday LIKE '%-${monthDay}' AND birthday BETWEEN '2005-01-01' AND '2010-12-31'`, "SELECT name FROM users WHERE birthday LIKE '%-03-%'", "SELECT * FROM users WHERE name LIKE 'Marc%' AND city = 'Berlin'", "SELECT COUNT(*) AS anzahl FROM users WHERE name LIKE 'Lina%' OR name LIKE 'Lisa%'", "SELECT * FROM users WHERE gender = 'male' AND birthday >= '2008-01-01' ORDER BY centimeters", "SELECT birthday, username FROM users WHERE gender = 'female' AND centimeters < 160", "SELECT * FROM users WHERE name LIKE 'Felix%' AND city != 'Berlin'", "SELECT * FROM users WHERE (name LIKE 'Bea%' OR name LIKE 'Naomi%') AND city = 'Berlin'", 'SELECT MAX(birthday) AS juengstes_geburtsdatum FROM users', 'SELECT * FROM users ORDER BY created_at DESC LIMIT 1', "SELECT MAX(centimeters) FROM users WHERE gender = 'female'", "SELECT AVG(centimeters) FROM users WHERE city = 'Dresden'", "SELECT COUNT(*) FROM users WHERE city = 'Berlin'", "SELECT COUNT(*) FROM users WHERE city = 'Leipzig' AND gender = 'male'"
];
references.forEach((statement, index) => {
  assert.doesNotThrow(() => db.exec(statement), statement);
  const result = db.exec(statement);
  assert.ok(result.length <= 1, `Eine SELECT-Referenz darf höchstens eine Relation liefern: ${statement}`);
  if (index === 8) assert.ok(result.length <= 1, 'A10 darf am jeweiligen Kalendertag leer sein');
});

const relation = (statement) => normalizeRelation(db.exec(statement));
assert.equal(compareRelations(relation(references[0]), relation("select *\nfrom users where gender='female';")).correct, true, 'Großschreibung, Leerraum und Semikolon');
assert.equal(compareRelations(relation(references[5]), relation("SELECT name FROM users WHERE gender='female' AND centimeters>160 OR gender='male' AND centimeters>165")).correct, true, 'gleichwertige AND-/OR-Klammerung');
assert.equal(compareRelations(relation(references[15]), relation("SELECT * FROM users WHERE city='Berlin' AND (name LIKE 'Naomi%' OR name LIKE 'Bea%')")).correct, true, 'A17 mit vertauschten OR-Zweigen');
assert.equal(compareRelations(relation(references[13]), relation("SELECT username, birthday FROM users WHERE centimeters < 160 AND gender = 'female'"), { columnOrder: false }).correct, true, 'A15 akzeptiert beide sinnvollen Projektionsreihenfolgen');
assert.equal(compareRelations(relation(references[18]), relation("SELECT MAX(centimeters) AS groesste_nutzerin FROM users WHERE gender='female'")).correct, true, 'optionaler Alias');
assert.equal(compareRelations(relation(references[16]), relation('SELECT MAX(birthday) AS falsch FROM users'), { columnLabels: true }).correct, false, 'A3.2 verlangt den Alias');

const probe = (statement) => relation([
  'SAVEPOINT birthday_probe',
  `UPDATE users SET birthday = '2007-${monthDay}' WHERE id = 1`,
  `UPDATE users SET birthday = '2004-${monthDay}' WHERE id = 2`,
  statement,
  'ROLLBACK TO birthday_probe',
  'RELEASE birthday_probe'
].join('; '));
assert.equal(compareRelations(probe(references[8]), probe(`SELECT * FROM users WHERE strftime('%m-%d', birthday) = '${monthDay}' AND birthday BETWEEN '2005-01-01' AND '2010-12-31'`)).correct, true, 'A10 akzeptiert eine gleichwertige Datumsfunktion');
assert.equal(compareRelations(probe(references[8]), probe(`SELECT * FROM users WHERE birthday = '2026-${monthDay}' AND birthday BETWEEN '2005-01-01' AND '2010-12-31'`)).correct, false, 'A10 akzeptiert keinen unpassenden Volljahresvergleich wegen leerer Tagesdaten');

assert.equal(relation('SELECT * FROM users').columns.length, headers.length, 'SELECT * enthält alle Spalten');
assert.deepEqual(relation('SELECT username, birthday FROM users LIMIT 1').columns, ['username', 'birthday'], 'Projektion behält korrekte Überschriften');
assert.equal(relation('SELECT COUNT(*) AS anzahl FROM users').values.length, 1, 'Aggregation liefert eine Zeile');
assert.equal(relation("SELECT * FROM users WHERE city = 'NichtVorhanden'").values.length, 0, 'leere Ergebnismenge');
assert.ok(relation('SELECT * FROM users').values.length > 100, 'umfangreiche Relation');
assert.equal(relation('SELECT SUM(centimeters) AS Summe FROM users').values.length, 1, 'SUM und AS');
assert.throws(() => db.exec('SELECT FROM users'), /syntax error/i, 'Syntaxfehler');
db.close();
console.log(`${references.length} SQL-Referenzen sowie Äquivalenz-, Datums- und Relationsfälle erfolgreich ausgeführt`);
