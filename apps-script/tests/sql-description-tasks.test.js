const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const context = {};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(process.cwd(), 'apps-script', 'Tasks.gs'), 'utf8'), context, { filename: 'Tasks.gs' });

const tasks = vm.runInContext("({ b2: TASKS['sql-b2-3'], b3: TASKS['sql-b3-1'] })", context);
assert.equal(tasks.b2.grade, 10);
assert.equal(tasks.b2.maxPoints, 3);
assert.equal(tasks.b2.expectedAspects.length, 3);
assert.match(tasks.b2.context, /SELECT username, birthday FROM users/);
assert.match(tasks.b2.context, /city != 'Berlin'/);
assert.match(tasks.b2.instruction, /keine vollständige Musterlösung/i);

assert.equal(tasks.b3.grade, 10);
assert.equal(tasks.b3.maxPoints, 3);
assert.equal(tasks.b3.expectedAspects.length, 3);
assert.match(tasks.b3.context, /MIN\(centimeters\) AS kleinste_Groesse/);
assert.match(tasks.b3.expectedAspects.join(' '), /Ergebnisspalte kleinste_Groesse/);
assert.match(tasks.b3.instruction, /keine vollständige Musterlösung/i);

const client = fs.readFileSync(path.join(process.cwd(), 'faecher', 'informatik', 'klasse-10', '1-Datenbanken', 'sql-lab.js'), 'utf8');
assert.equal((client.match(/'sql-b2-3'/g) || []).length, 1, 'Client verwendet sql-b2-3 genau einmal');
assert.equal((client.match(/'sql-b3-1'/g) || []).length, 1, 'Client verwendet sql-b3-1 genau einmal');
assert.doesNotMatch(client, /selfCheck\([^\n]+sql-b3-3/, 'Blatt 3 A3 darf keine Server-ID besitzen');

console.log('SQL-Beschreibe-Aufgaben und Client-/Server-IDs sind konsistent.');
