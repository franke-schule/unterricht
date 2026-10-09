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

const tableOnlyAnswer = context.evaluateFishDepthDevelopmentByRules_(
  'Bei höherer Baumtiefe entstehen weniger Fehler in der Trainingsphase. Die Genauigkeit bleibt gleich bei der Baumtiefe 1-3. Fehleranzahl in Trainingsphase und Genauigkeit hängen in dieser Tabelle nicht zusammen.',
  3
);
assert.equal(tableOnlyAnswer.points, 3, 'Die drei geforderten Tabellenaussagen genügen ohne Zahlen, Modellwahl oder weitere Tests.');

const noConnectionEquivalent = context.evaluateFishDepthDevelopmentByRules_(
  'Die Trainingsfehler sinken von 3 über 1 auf 0. Die Genauigkeit bleibt bei allen drei Bäumen gleich. Weniger Trainingsfehler führen hier nicht zu einer höheren Testgenauigkeit.',
  3
);
assert.equal(noConnectionEquivalent.points, 3);

const negatedTestGain = context.evaluateFishDepthDevelopmentByRules_(
  'Die Trainingsfehler sinken von 3 über 1 auf 0. Die Testgenauigkeit steigt nicht, sondern bleibt bei allen drei Tiefen gleich. Trainingsfehler und Genauigkeit haben in dieser Tabelle keinen Zusammenhang.',
  3
);
assert.equal(negatedTestGain.points, 3, 'Eine verneinte Steigerung der Testgenauigkeit muss als korrekter Gleichstand gewertet werden.');

const missingConnection = context.evaluateFishDepthDevelopmentByRules_(
  'Die Trainingsfehler sinken von 3 über 1 auf 0. Die Testgenauigkeit bleibt gleich bei 80 Prozent. Ich wähle vorläufig Tiefe 1 und werde weitere Tests machen.',
  3
);
assert.equal(missingConnection.points, 2, 'Modellwahl und weitere Tests ersetzen den dritten geforderten Aspekt nicht.');
assert.equal(missingConnection.missing.some(function(text) { return /Zusammenhang/.test(text); }), true);
assert.equal(missingConnection.missing.some(function(text) { return /vorläufig|Modellwahl|weitere Tests/.test(text); }), false);

const incorrectTestClaim = context.evaluateFishDepthDevelopmentByRules_(
  'Die Zahl der Fehler in den Trainingsdaten sinkt von 3 über 1 auf 0. Die Testgenauigkeit steigt mit jeder Tiefe. Fehleranzahl und Genauigkeit hängen in dieser Tabelle nicht zusammen.',
  3
);
assert.equal(incorrectTestClaim.points, 1, 'Eine falsche Aussage zur Genauigkeit darf nicht durch die Formulierung zum fehlenden Zusammenhang überdeckt werden.');

const contradictoryTestGain = context.evaluateFishDepthDevelopmentByRules_(
  'Die Trainingsfehler sinken von 3 über 1 auf 0. Die Testgenauigkeit steigt nicht, alle drei Bäume erreichen 80 Prozent. Ich wähle vorläufig Tiefe 3, weil er bei neuen Fischen eine höhere Testgenauigkeit erreicht. Fünf Testfische sind eine kleine Grundlage.',
  3
);
assert.equal(contradictoryTestGain.points, 1, 'Die in der Endabnahme belegte widersprüchliche Antwort darf keine volle Punktzahl erhalten.');

const contradictionAfterFullAnswer = context.evaluateFishDepthDevelopmentByRules_(
  'Die Trainingsfehler werden weniger. Die Testgenauigkeit steigt nicht. Trainingsfehler und Genauigkeit hängen hier nicht zusammen, aber Tiefe 3 erreicht eine höhere Testgenauigkeit.',
  3
);
assert.equal(contradictionAfterFullAnswer.points, 1, 'Eine Verneinung darf eine separate positive Zugewinn-Behauptung nicht maskieren.');

const onlyTraining = context.evaluateFishDepthDevelopmentByRules_(
  'Bei höherer Baumtiefe entstehen weniger Fehler in der Trainingsphase.',
  3
);
assert.equal(onlyTraining.points, 1);

const partialSemanticEvaluation = { ok: true, points: 1, maxPoints: 3, status: 'teilweise richtig', strengths: [], missing: [], feedback: 'Teilweise korrekt.' };
assert.equal(context.applyRuleBasedMinimum_(partialSemanticEvaluation, vm.runInContext("TASKS['11-4-2']", context),
  'Die Trainingsfehler werden weniger. Die Testgenauigkeit bleibt gleich. Trainingsfehler und Genauigkeit hängen in dieser Tabelle nicht zusammen.'
).points, 3, 'Die Mindestbewertung muss die drei korrekten Tabellenaussagen anerkennen.');
assert.equal(context.applyRuleBasedMinimum_(partialSemanticEvaluation, vm.runInContext("TASKS['11-4-2']", context),
  'Die Trainingsfehler werden weniger. Die Testgenauigkeit steigt nicht. Trainingsfehler und Genauigkeit hängen hier nicht zusammen, aber Tiefe 3 erreicht eine höhere Testgenauigkeit.'
).points, 1, 'Die Mindestbewertung darf eine widersprüchliche Antwort nicht aufwerten.');

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
