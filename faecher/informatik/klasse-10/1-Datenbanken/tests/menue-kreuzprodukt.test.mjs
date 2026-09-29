import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MENU_TABLES, MENU_TABLE_NAMES, MENU_TABLE_SCHEMAS, buildMenuCombinations, menuRelation } from '../menue-kreuzprodukt-daten.mjs';
import { analyzeMultiTableSelect, compareRelations, normalizeRelation, validateSelectStatement } from '../sql-lab-core.mjs';

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
globalThis.window = {};
globalThis.document = { addEventListener() {} };
const { assessMultiTableSql } = await import('../sql-lab.js');
const assess = (statement, reference = 'SELECT * FROM Vorspeise, Hauptspeise, Nachspeise') => assessMultiTableSql(statement, reference, MENU_TABLE_SCHEMAS, 'menu', async (query) => relation(query));
assert.equal((await assess('SELECT v.name AS Vorspeise, h.name AS Hauptspeise, n.name AS Nachspeise FROM Vorspeise v, Hauptspeise h, Nachspeise n ORDER BY Vorspeise')).level, 'success', 'Alias-Sortierung bleibt in der tatsächlichen Menübwertung gültig.');
const allMenus = relation('SELECT * FROM Vorspeise, Hauptspeise, Nachspeise');
assert.equal(allMenus.values.length, 12);
assert.deepEqual(menuRelation().columns, ['Vorspeise.name', 'Vorspeise.preis', 'Hauptspeise.name', 'Hauptspeise.preis', 'Nachspeise.name', 'Nachspeise.preis'], 'Die sichtbaren Spaltenbezeichnungen weisen ihre Herkunft aus.');
assert.equal(compareRelations(allMenus, relation('select *\nfrom Vorspeise, Hauptspeise, Nachspeise;')).correct, true, 'Formatvarianten bleiben korrekt.');
assert.equal(compareRelations(allMenus, relation('  SeLeCt   *\nFROM Vorspeise,   Hauptspeise, Nachspeise ;')).correct, true, 'Großschreibung, zusätzliche Leerzeichen, Zeilenumbrüche und Semikolon werden akzeptiert.');
const menuNames = relation('SELECT Vorspeise.name, Hauptspeise.name, Nachspeise.name FROM Vorspeise, Hauptspeise, Nachspeise');
const menuNamesReordered = relation('SELECT h.name, v.name, n.name FROM Hauptspeise h, Vorspeise v, Nachspeise n');
assert.equal(compareRelations(menuNamesReordered, relation('SELECT Hauptspeise.name, Vorspeise.name, Nachspeise.name FROM Vorspeise, Hauptspeise, Nachspeise')).correct, true, 'Drei Menünamen in anderer Tabellen- und Spaltenreihenfolge liefern dieselben vollständigen Kombinationen.');
assert.equal(menuNames.values.length, 12);
const menuNamesWithPrice = relation('SELECT v.name, h.preis AS Preis, h.name, n.name FROM Vorspeise v, Hauptspeise h, Nachspeise n');
assert.equal(compareRelations(menuNamesWithPrice, relation('SELECT Vorspeise.name, Hauptspeise.preis, Hauptspeise.name, Nachspeise.name FROM Vorspeise, Hauptspeise, Nachspeise')).correct, true, 'Zusätzlicher Preis und Alias ändern die vollständige Menüdarstellung nicht.');
assert.deepEqual(menuNamesWithPrice.columns, ['name', 'Preis', 'name', 'name'], 'Die SQL-Engine liefert die tatsächlichen frei gewählten Spaltenüberschriften.');
const missingDessert = 'SELECT Vorspeise.name, Hauptspeise.name FROM Vorspeise, Hauptspeise, Nachspeise';
assert.equal(relation(missingDessert).values.length, 12, 'Auch unvollständige Projektionen können zufällig 12 Zeilen liefern.');
assert.equal(analyzeMultiTableSelect(missingDessert, MENU_TABLE_SCHEMAS).projection.some(({ table }) => table === 'Nachspeise'), false, 'Fehlender Nachspeisenname wird an der Spaltenherkunft erkannt.');
const missingDessertTable = 'SELECT Vorspeise.name, Hauptspeise.name FROM Vorspeise, Hauptspeise';
assert.equal(relation(missingDessertTable).values.length, 12, 'Die konstante Nachspeise kann auch bei fehlender Tabelle zufällig dieselbe Zeilenzahl ergeben.');
assert.deepEqual(analyzeMultiTableSelect(missingDessertTable, MENU_TABLE_SCHEMAS).tables, ['Vorspeise', 'Hauptspeise'], 'Die FROM-Prüfung erkennt die fehlende Nachspeise trotz 12 Zeilen.');
assert.match((await assess(missingDessertTable)).text, /^FROM:/, 'Die tatsächliche Bewertung meldet die fehlende Nachspeise als Tabellenfehler.');
const saladMenus = relation("SELECT * FROM Vorspeise, Hauptspeise, Nachspeise WHERE Vorspeise.name = 'Salat'");
const pizzaMenus = relation("SELECT * FROM Vorspeise, Hauptspeise, Nachspeise WHERE Hauptspeise.name = 'Pizza'");
assert.equal(saladMenus.values.length, 3);
assert.equal(pizzaMenus.values.length, 4);
const wrongFourPizzas = relation("SELECT Vorspeise.name, Hauptspeise.name, Nachspeise.name FROM Vorspeise, Hauptspeise, Nachspeise WHERE Hauptspeise.name = 'Pizza' OR Vorspeise.name = 'Salat' LIMIT 4");
const expectedFourPizzas = relation("SELECT Vorspeise.name, Hauptspeise.name, Nachspeise.name FROM Vorspeise, Hauptspeise, Nachspeise WHERE Hauptspeise.name = 'Pizza'");
assert.equal(wrongFourPizzas.values.length, 4, 'Eine fachlich falsche Pizza-Auswahl kann ebenfalls vier Zeilen haben.');
assert.equal(compareRelations(wrongFourPizzas, expectedFourPizzas).correct, false, 'Vier Zeilen allein belegen die korrekte WHERE-Bedingung nicht.');
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
