const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const context = {};
vm.createContext(context);

['Tasks.gs', 'Helpers.gs', 'Gemini.gs'].forEach(function(filename) {
  vm.runInContext(
    fs.readFileSync(path.join(process.cwd(), 'apps-script', filename), 'utf8'),
    context,
    { filename }
  );
});

const KEY = 'inf11-cod-a1-ascii-unicode';
const task = vm.runInContext("TASKS['" + KEY + "']", context);

assert.equal(task.grade, 11);
assert.equal(task.maxPoints, 5);
assert.equal(task.expectedAspects.length, 5);
assert.equal(task.maxPoints, task.expectedAspects.length);
assert.equal(task.statusLabels.correct, 'korrekt');
assert.equal(task.statusLabels.partial, 'teilweise korrekt');
assert.equal(task.statusLabels.incorrect, 'noch nicht korrekt');
assert.match(task.instruction, /keine vollständige Musterlösung/);

const prompt = context.buildPrompt_(
  task,
  'ASCII hat 7 Bit und 128 Zeichen ohne Umlaute. Unicode enthält die Zeichen aller Sprachen und ASCII; in UTF-8 braucht ein Zeichen 1 bis 4 Byte.'
);
assert.match(prompt, /128/);
assert.match(prompt, /UTF-8/);
assert.match(prompt, /Erwartete Aspekte/);
assert.match(prompt, /Bewertungsrubrik/);
assert.match(prompt, /Hinweise für die Rückmeldung/);

function evaluate(points) {
  return context.normalizeEvaluation_({
    points: points,
    status: 'beliebig',
    strengths: [],
    missing: [],
    feedback: 'Rückmeldung.'
  }, task);
}
assert.equal(evaluate(5).status, 'korrekt');
assert.equal(evaluate(2).status, 'teilweise korrekt');
assert.equal(evaluate(0).status, 'noch nicht korrekt');

const client = fs.readFileSync(
  path.join(process.cwd(), 'faecher', 'informatik', 'klasse-11', '2-Codierung-und-Verschluesselung', 'binaer', 'ui', 'task1.mjs'),
  'utf8'
);
assert.equal(client.split(KEY).length - 1, 1, 'Der Aufgabenschlüssel steht genau einmal im Client.');

console.log('Die Beschreibe-Aufgabe ' + KEY + ' ist serverseitig korrekt definiert.');
