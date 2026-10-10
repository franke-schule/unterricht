const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const unit = path.join(process.cwd(), 'faecher/physik/klasse-11/1-Kreisbewegungen');
const basename = 'aufgabe4-und-experiment-quiz';
const clientSource = fs.readFileSync(path.join(unit, `${basename}.mjs`), 'utf8');
const client = {};
vm.createContext(client);
vm.runInContext(clientSource.replace(/^import .*;\r?\n/gm, ''), client);
const descriptions = vm.runInContext('DESCRIBE_TASKS', client);
const questions = vm.runInContext('MC_QUESTIONS', client);
const server = {};
vm.createContext(server);
for (const filename of ['Tasks.gs', 'Helpers.gs', 'Gemini.gs']) {
  vm.runInContext(fs.readFileSync(path.join(process.cwd(), 'apps-script', filename), 'utf8'), server);
}

for (const description of descriptions) {
  const task = vm.runInContext(`TASKS[${JSON.stringify(description.taskId)}]`, server);
  assert.equal(task.maxPoints, description.maxPoints);
  assert.equal(task.expectedAspects.length, description.maxPoints);
  assert.ok(task.context.includes(description.prompt));
  for (const points of [0, 1, task.maxPoints]) {
    const normalized = server.normalizeEvaluation_({points, strengths: [], missing: [], feedback: 'Hinweis'}, task);
    assert.equal(normalized.points, points);
    assert.equal(normalized.status, points === 0 ? 'noch nicht korrekt' : points === task.maxPoints ? 'korrekt' : 'teilweise korrekt');
  }
}

// Die numerischen Aussagen prüfen die Einheitenumrechnung und das Wurzelziehen.
assert.equal(54 * 1000 / 3600, 15);
assert.equal(1000 * 15 ** 2 / 45, 5000);
assert.equal(Math.sqrt(20 * 0.5 / 0.4), 5);
assert.equal(questions[0].options.find(o => o.id === 'force').correct, true);
assert.equal(questions[1].options.find(o => o.id === 'value').correct, true);
assert.equal(questions[1].options.find(o => o.id === 'no-root').correct, undefined);
assert.ok(questions.filter(q => q.options.filter(o => o.correct).length > 1).length >= 2);

// Mehrfachauswahl: eine richtige Teilmenge bleibt unvollständig, eine zusätzliche
// Falschantwort verhindert volle Punkte, nur die vollständige richtige Menge zählt.
vm.runInContext('state = clone(DEFAULT_STATE)', client);
const result = selected => {
  client.selected = selected;
  return vm.runInContext('state.mc.q1 = selected; mcResult(MC_QUESTIONS[0])', client);
};
assert.equal(result(['speed']).exact, false);
assert.equal(result(['speed']).missing, true);
assert.equal(result(['speed', 'force', 'no-conversion']).exact, false);
assert.equal(result(['speed', 'force']).exact, true);
assert.equal(vm.runInContext('TOTAL_POINTS', client), 30);

// Beschädigte gespeicherte Serverbewertungen dürfen weder eine Aufgabe sperren
// noch das Wiederherstellen der Seite abbrechen.
client.localStorage = {
  getItem: () => JSON.stringify({version: 2, mc: {q1: ['speed', 'speed', 'unknown']}, ai: {experiment: {points: 999}, kraft: {points: 1, strengths: 'kein Array', missing: [12, 'Masse'], feedback: {}}}, aiText: {experiment: 'Antwort', kraft: 'Antwort'}}),
};
const restored = vm.runInContext('loadState()', client);
assert.equal(restored.ai.experiment, null);
assert.equal(restored.mc.q1.length, 1);
assert.equal(restored.ai.kraft.strengths.length, 0);
assert.equal(restored.ai.kraft.missing.length, 1);
assert.equal(restored.ai.kraft.maxPoints, 3);
console.log('Aufgabe-4-und-Experiment-Quiz: Serverrubriken, Rechenwerte, Mehrfachauswahl und beschädigte Speicherstände geprüft.');
