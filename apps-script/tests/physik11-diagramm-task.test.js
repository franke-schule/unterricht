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

const task = vm.runInContext(
  "TASKS['ph11-kreisbewegungen-bewegung-diagramm-beschreibung']",
  context
);

assert.equal(task.grade, 11);
assert.equal(task.maxPoints, 5);
assert.equal(task.expectedAspects.length, 5);
assert.equal(task.rubric.length, 3);
assert.equal(task.feedbackHints.length, 3);
assert.equal(task.statusLabels.correct, 'korrekt');
assert.equal(task.statusLabels.partial, 'teilweise korrekt');
assert.equal(task.statusLabels.incorrect, 'noch nicht korrekt');

const prompt = context.buildPrompt_(
  task,
  'Eine ausreichend lange fachliche Beispielantwort für den Test.'
);
assert.match(prompt, /faire Physiklehrkraft/);
assert.match(prompt, /Abschnitt V/);
assert.match(prompt, /Bewertungsrubrik/);
assert.match(prompt, /Hinweise für die Rückmeldung/);

const full = context.normalizeEvaluation_({
  points: 5,
  status: 'beliebig',
  strengths: [],
  missing: [],
  feedback: 'Test'
}, task);
assert.equal(full.status, 'korrekt');

const partial = context.normalizeEvaluation_({
  points: 3,
  status: 'beliebig',
  strengths: [],
  missing: [],
  feedback: 'Test'
}, task);
assert.equal(partial.status, 'teilweise korrekt');

const missing = context.normalizeEvaluation_({
  points: 0,
  status: 'beliebig',
  strengths: [],
  missing: [],
  feedback: 'Test'
}, task);
assert.equal(missing.status, 'noch nicht korrekt');

console.log('Die Physik-11-Diagrammbeschreibung hat eine vollständige serverseitige Rubrik.');
