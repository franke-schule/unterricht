const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const context = {};
vm.createContext(context);

['Tasks.gs', 'Helpers.gs', 'Rules.gs'].forEach(function(filename) {
  vm.runInContext(
    fs.readFileSync(path.join(process.cwd(), 'apps-script', filename), 'utf8'),
    context,
    { filename: filename }
  );
});

const taskConfigs = vm.runInContext(
  "['11-4-1', '11-4-2', '11-4-3'].map(function(id) { return { id: id, task: TASKS[id] }; })",
  context
);
assert.deepEqual(Array.from(taskConfigs, function(entry) { return entry.id; }), ['11-4-1', '11-4-2', '11-4-3']);
taskConfigs.forEach(function(entry) {
  assert.equal(typeof entry.task.title, 'string');
  assert.equal(typeof entry.task.instruction, 'string');
  assert.equal(Array.from(entry.task.expectedAspects).length, entry.task.maxPoints);
});

const depthOneDirect = context.evaluateFishDepthOneByRules_(
  'Der Baum teilt am ersten Knoten nach der Schuppenfarbe in zwei Blätter. Nicht alle Trainingsfische sind richtig eingeordnet, weil die Gruppen noch gemischt sind. Mit einer größeren Baumtiefe wären weitere Aufteilungen möglich.',
  3
);
assert.equal(depthOneDirect.points, 3);

const depthOneEquivalent = context.evaluateFishDepthOneByRules_(
  'Nach Schuppenfarbe entstehen zwei Äste. Nur 6 von 9 Fischen sind richtig eingeordnet, weil die Teilmengen noch nicht rein sind. Ein tieferer Baum mit mehr Knoten verbessert die Einordnung.',
  3
);
assert.equal(depthOneEquivalent.points, 3);

const depthOneWrong = context.evaluateFishDepthOneByRules_(
  'Die Schuppenfarbe reicht aus und alle Fische werden richtig klassifiziert.',
  3
);
assert.equal(depthOneWrong.points < 3, true);

const semanticEquivalent = context.applyRuleBasedMinimum_(
  { ok: true, points: 3, maxPoints: 3, status: 'gut', strengths: ['Sinngemäß fachlich vollständig.'], missing: [], feedback: 'Richtig.' },
  vm.runInContext("TASKS['11-4-1']", context),
  'Der erzeugte Klassifikator ist hier noch zu grob und sollte flexibler werden.'
);
assert.equal(semanticEquivalent.points, 3, 'Eine fachlich anerkannte semantische Formulierung darf nicht durch Schlüsselwortregeln abgewertet werden.');

const depthDevelopment = context.evaluateFishDepthDevelopmentByRules_(
  'Baumtiefe 3 sortiert alle Trainingsdaten korrekt ein und sollte daher gewählt werden. Die Genauigkeit ist bei allen drei Baumtiefen gleich, verbessert sich also nicht.',
  3
);
assert.equal(depthDevelopment.points, 3);

const incorrectTestClaim = context.evaluateFishDepthDevelopmentByRules_(
  'Die Zahl der Fehler in den Trainingsdaten sinkt bis auf null. Die Genauigkeit steigt mit jeder Tiefe. Deshalb wähle ich Tiefe 3.',
  3
);
assert.equal(incorrectTestClaim.points < 3, true);

const equalAccuracy = context.evaluateFishEqualAccuracyByRules_(
  'Beide haben 80 Prozent Genauigkeit. Bei Tiefe 1 wird Fisch 3 und bei Tiefe 2 Fisch 4 falsch eingeordnet. Genauigkeit allein zeigt die Art der Fehler nicht.',
  3
);
assert.equal(equalAccuracy.points, 3);

const coreStatement = context.evaluateFishEqualAccuracyByRules_(
  'Die Bäume sind gleich genau, klassifizieren aber unterschiedliche Fische falsch.',
  3
);
assert.equal(coreStatement.points >= 2, true);

console.log('Rubriken für Aufgabe 4 erkennen korrekte Varianten und weisen typische Fehlkonzepte zurück.');
