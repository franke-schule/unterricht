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

const task = vm.runInContext("TASKS['11-7-1']", context);

assert.equal(task.grade, 11);
assert.equal(task.maxPoints, 4);
assert.equal(task.expectedAspects.length, 4);
assert.equal(task.maxPoints, task.expectedAspects.length);
assert.equal(task.statusLabels.correct, 'korrekt');
assert.equal(task.statusLabels.partial, 'teilweise korrekt');
assert.equal(task.statusLabels.incorrect, 'noch nicht korrekt');

const prompt = context.buildPrompt_(
  task,
  'Zuerst berechne ich die Abstände zu allen Personen, wähle die fünf nächsten aus und zähle: drei M, zwei S. Also M.'
);
assert.match(prompt, /178\|98/);
assert.match(prompt, /drei M/);
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
assert.equal(evaluate(4).status, 'korrekt');
assert.equal(evaluate(1).status, 'teilweise korrekt');
assert.equal(evaluate(0).status, 'noch nicht korrekt');

console.log('Die KNN-Beschreibe-Aufgabe 11-7-1 ist serverseitig korrekt definiert.');
