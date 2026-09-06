import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MENU_TABLES, MENU_TABLE_NAMES, MENU_TABLE_SCHEMAS, buildMenuCombinations, menuRelation } from '../menue-kreuzprodukt-daten.mjs';
import { compareRelations, normalizeRelation, validateSelectStatement } from '../sql-lab-core.mjs';

const combinations = buildMenuCombinations();
assert.deepEqual(MENU_TABLES, {
  Vorspeise: [
    { name: 'Lauchsuppe', preis: 1.50 },
    { name: 'Salat', preis: 2.00 },
    { name: 'Tagessuppe', preis: 1.00 },
    { name: 'Rohkost', preis: 1.35 }
  ],
  Hauptspeise: [
    { name: 'Käsespätzle', preis: 3.50 },
    { name: 'Reispfanne', preis: 2.50 },
    { name: 'Pizza', preis: 3.44 }
  ],
  Nachspeise: [{ name: 'Gemischtes Eis', preis: 2.50 }]
}, 'Die Ausgangsrelationen entsprechen den verbindlichen Mensa-Daten.');
assert.equal(combinations.length, 12, 'Das Kreuzprodukt enthält 12 Menükombinationen.');
assert.deepEqual(MENU_TABLE_SCHEMAS.map(({ table, columns }) => [table, columns]), [
  ['Vorspeise', [['name', 'varchar(255)'], ['preis', 'real']]],
  ['Hauptspeise', [['name', 'varchar(255)'], ['preis', 'real']]],
  ['Nachspeise', [['name', 'varchar(255)'], ['preis', 'real']]]
]);
assert.equal(new Set(menuRelation(combinations).values.map((row) => row.join('|'))).size, 12, 'Jede Menükombination ist eindeutig.');
assert.deepEqual(Object.fromEntries(MENU_TABLES.Vorspeise.map(({ name }) => [name, combinations.filter((menu) => menu.Vorspeise.name === name).length])), { Lauchsuppe: 3, Salat: 3, Tagessuppe: 3, Rohkost: 3 });
assert.deepEqual(Object.fromEntries(MENU_TABLES.Hauptspeise.map(({ name }) => [name, combinations.filter((menu) => menu.Hauptspeise.name === name).length])), { 'Käsespätzle': 4, Reispfanne: 4, Pizza: 4 });
assert.equal(combinations.filter((menu) => menu.Nachspeise.name === 'Gemischtes Eis').length, 12);

const require = createRequire(import.meta.url);
const initSqlJs = require('../../../../../include/lib/sql.js/sql-wasm.js');
const here = dirname(fileURLToPath(import.meta.url));
const databaseFolder = resolve(here, '..');
const repository = resolve(databaseFolder, '../../../..');
const SQL = await initSqlJs({ wasmBinary: new Uint8Array(await readFile(resolve(repository, 'include/lib/sql.js/sql-wasm.wasm'))) });
const db = new SQL.Database();
for (const tableName of MENU_TABLE_NAMES) {
  db.run(`CREATE TABLE "${tableName}" ("name" TEXT, "preis" REAL)`);
  for (const row of MENU_TABLES[tableName]) db.run(`INSERT INTO "${tableName}" VALUES ('${row.name.replaceAll("'", "''")}', ${row.preis})`);
}
const relation = (statement) => normalizeRelation(db.exec(statement));
const allMenus = relation('SELECT * FROM Vorspeise, Hauptspeise, Nachspeise');
assert.equal(allMenus.values.length, 12);
assert.deepEqual(menuRelation().columns, ['Vorspeise.name', 'Vorspeise.preis', 'Hauptspeise.name', 'Hauptspeise.preis', 'Nachspeise.name', 'Nachspeise.preis'], 'Die sichtbaren Spaltenbezeichnungen weisen ihre Herkunft aus.');
assert.equal(compareRelations(allMenus, relation('select *\nfrom Vorspeise, Hauptspeise, Nachspeise;')).correct, true, 'Formatvarianten bleiben korrekt.');
assert.equal(compareRelations(allMenus, relation('  SeLeCt   *\nFROM Vorspeise,   Hauptspeise, Nachspeise ;')).correct, true, 'Großschreibung, zusätzliche Leerzeichen, Zeilenumbrüche und Semikolon werden akzeptiert.');
const saladMenus = relation("SELECT * FROM Vorspeise, Hauptspeise, Nachspeise WHERE Vorspeise.name = 'Salat'");
const pizzaMenus = relation("SELECT * FROM Vorspeise, Hauptspeise, Nachspeise WHERE Hauptspeise.name = 'Pizza'");
assert.equal(saladMenus.values.length, 3);
assert.equal(pizzaMenus.values.length, 4);
assert.equal(compareRelations(pizzaMenus, relation("SELECT * FROM Vorspeise AS v, Hauptspeise AS h, Nachspeise AS n WHERE h.name = 'Pizza';")).correct, true, 'Eine gleichwertige Aliasabfrage wird akzeptiert.');
assert.equal(compareRelations(allMenus, pizzaMenus).correct, false, 'Das ungefilterte Kreuzprodukt gilt nicht als Pizza-Lösung.');
assert.equal(compareRelations(relation("SELECT * FROM Vorspeise, Hauptspeise, Nachspeise WHERE Vorspeise.name = 'Pizza'"), pizzaMenus).correct, false, 'Eine falsche Filterspalte gilt nicht als Pizza-Lösung.');
assert.equal(relation("SELECT Vorspeise.name, Hauptspeise.name FROM Vorspeise, Hauptspeise, Nachspeise WHERE Hauptspeise.name = 'Pizza'").values.length, 4, 'Qualifizierte Spaltennamen funktionieren.');
assert.throws(() => db.exec("SELECT name FROM Vorspeise, Hauptspeise"), /ambiguous column/i, 'Unqualifiziertes name ist mehrdeutig.');
assert.throws(() => db.exec('SELECT * FROM Unbekannt'), /no such table/i, 'Unbekannte Tabellen erzeugen einen SQL-Fehler.');
assert.throws(() => db.exec('SELECT Vorspeise.Unbekannt FROM Vorspeise'), /no such column/i, 'Unbekannte Spalten erzeugen einen SQL-Fehler.');
assert.throws(() => db.exec('SELECT FROM Vorspeise'), /syntax error/i, 'Syntaxfehler werden von der SQL-Engine erkannt.');
assert.equal(relation("SELECT * FROM Vorspeise WHERE name = 'Nicht vorhanden'").values.length, 0, 'Leere Ergebnismengen werden zuverlässig erkannt.');
assert.equal(validateSelectStatement('UPDATE Vorspeise SET preis = 0').ok, false, 'Schreibende Anweisungen bleiben blockiert.');
assert.equal(validateSelectStatement('SELECT * FROM Vorspeise; SELECT * FROM Hauptspeise').ok, false, 'Mehrfachanweisungen bleiben blockiert.');
db.close();
console.log('Mensa-Kreuzprodukt, Filter und qualifizierte Spalten erfolgreich geprüft');
