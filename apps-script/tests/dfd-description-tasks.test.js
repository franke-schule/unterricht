const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const context = {};
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(process.cwd(), 'apps-script', 'Tasks.gs'), 'utf8'), context, { filename: 'Tasks.gs' });

const tasks = vm.runInContext("({ zylinder: TASKS['inf9-dfd-zylinder-beschreibung'], fehlersuche: TASKS['inf9-dfd-fehlersuche-gewinnspiel'] })", context);

assert.equal(tasks.zylinder.grade, 9);
assert.equal(tasks.zylinder.maxPoints, 3);
assert.equal(tasks.zylinder.expectedAspects.length, 3);
assert.equal(tasks.zylinder.statusLabels.correct, 'korrekt');
assert.match(tasks.zylinder.context, /Verteiler/);
assert.match(tasks.zylinder.instruction, /keine vollständige Musterlösung/i);

assert.equal(tasks.fehlersuche.grade, 9);
assert.equal(tasks.fehlersuche.maxPoints, 3);
assert.equal(tasks.fehlersuche.expectedAspects.length, 3);
assert.equal(tasks.fehlersuche.statusLabels.correct, 'korrekt');
assert.match(tasks.fehlersuche.context, /größer gleich/);
assert.match(tasks.fehlersuche.instruction, /keine vollständige Musterlösung/i);

const page = fs.readFileSync(path.join(process.cwd(), 'faecher', 'informatik', 'klasse-9', '1-Tabellenkalkulation', 'aufgabe5.html'), 'utf8');
assert.equal((page.match(/inf9-dfd-zylinder-beschreibung/g) || []).length, 1, 'Client verwendet inf9-dfd-zylinder-beschreibung genau einmal');
assert.equal((page.match(/inf9-dfd-fehlersuche-gewinnspiel/g) || []).length, 1, 'Client verwendet inf9-dfd-fehlersuche-gewinnspiel genau einmal');
assert.doesNotMatch(page, /tabellenkalkulation\.js/);

console.log('DFD-Beschreibe-Aufgaben und Client-/Server-IDs sind konsistent.');
