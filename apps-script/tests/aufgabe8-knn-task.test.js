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

const task = vm.runInContext("TASKS['11-8-1']", context);

assert.equal(task.grade, 11);
assert.equal(task.maxPoints, 3);
assert.equal(task.expectedAspects.length, 3);
assert.equal(task.maxPoints, task.expectedAspects.length);
assert.equal(task.statusLabels.correct, 'korrekt');
assert.equal(task.statusLabels.partial, 'teilweise korrekt');
assert.equal(task.statusLabels.incorrect, 'noch nicht korrekt');

const prompt = context.buildPrompt_(
  task,
  'Ich wähle k = 3, weil damit alle fünf Validierungspersonen richtig klassifiziert werden, bei k = 1, 5 und 7 nur drei.'
);
assert.match(prompt, /V3/);
assert.match(prompt, /k = 3/);
assert.match(prompt, /Erwartete Aspekte/);
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
assert.equal(evaluate(3).status, 'korrekt');
assert.equal(evaluate(1).status, 'teilweise korrekt');
assert.equal(evaluate(0).status, 'noch nicht korrekt');

console.log('Die KNN-Beschreibe-Aufgabe 11-8-1 ist serverseitig korrekt definiert.');
