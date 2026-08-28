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
  'Das Attribut ist die Schuppenfarbe. Nein, denn in beiden Ästen kommen friedliche und feindselige Trainingsfische vor.',
  3
);
assert.equal(depthOneDirect.points, 3);

const depthOneEquivalent = context.evaluateFishDepthOneByRules_(
  'Nach Schuppenfarbe werden nur 6 von 9 Fischen richtig eingeordnet. Die Teilmengen sind noch nicht rein.',
  3
);
assert.equal(depthOneEquivalent.points, 3);

const depthOneWrong = context.evaluateFishDepthOneByRules_(
  'Die Schuppenfarbe reicht aus und alle Fische werden richtig klassifiziert.',
  3
);
assert.equal(depthOneWrong.points, 1);

const depthDevelopment = context.evaluateFishDepthDevelopmentByRules_(
  'Mit größerer Tiefe entstehen zusätzliche Knoten und die Trainingsgenauigkeit steigt bis 100 Prozent. Die Testgenauigkeit bleibt bei 80 Prozent. Ich verwende Tiefe 2, weil für die Modellwahl die Testdaten entscheidend sind.',
  4
);
assert.equal(depthDevelopment.points, 4);

const incorrectTestClaim = context.evaluateFishDepthDevelopmentByRules_(
  'Der Baum wird tiefer und die Trainingsgenauigkeit steigt. Die Testdaten werden mit jeder Tiefe genauer. Ich verwende deshalb Tiefe 3 für unbekannte Daten.',
  4
);
assert.equal(incorrectTestClaim.points < 4, true);

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
