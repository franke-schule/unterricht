const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const context = {};
vm.createContext(context);
['Tasks.gs', 'Helpers.gs', 'Gemini.gs'].forEach((filename) => {
  vm.runInContext(fs.readFileSync(path.join(process.cwd(), 'apps-script', filename), 'utf8'), context, { filename });
});

const taskIds = [
  'ph11-kettenkarussell-winkelgeschwindigkeit',
  'ph11-kettenkarussell-zwei-sitzreihen',
];

taskIds.forEach((taskId) => {
  const task = vm.runInContext(`TASKS['${taskId}']`, context);
  assert.ok(task, `${taskId} fehlt in TASKS`);
  assert.equal(task.grade, 11, `${taskId}: grade`);
  assert.equal(task.maxPoints, task.expectedAspects.length, `${taskId}: maxPoints muss der Anzahl expectedAspects entsprechen`);
  assert.ok(task.expectedAspects.length > 0, `${taskId}: expectedAspects darf nicht leer sein`);
  assert.ok(task.rubric.length > 0, `${taskId}: rubric fehlt`);
  assert.ok(task.feedbackHints.length > 0, `${taskId}: feedbackHints fehlen`);
  assert.equal(task.statusLabels.correct, 'korrekt', `${taskId}: Status korrekt`);
  const prompt = context.buildPrompt_(task, 'Beispielantwort zur Prüfung des Prompts.');
  assert.match(prompt, /Beispielantwort zur Prüfung des Prompts\./, `${taskId}: buildPrompt_ übernimmt die Schülerantwort`);
  assert.match(prompt, new RegExp(task.expectedAspects[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${taskId}: buildPrompt_ enthält den ersten erwarteten Aspekt`);
});

const omega = vm.runInContext("TASKS['ph11-kettenkarussell-winkelgeschwindigkeit']", context);
assert.equal(omega.maxPoints, 5);
assert.match(omega.systemInstruction, /Winkelgeschwindigkeit/);
assert.match(omega.expectedAspects.join(' '), /Seilkraft/);

const rows = vm.runInContext("TASKS['ph11-kettenkarussell-zwei-sitzreihen']", context);
assert.equal(rows.maxPoints, 4);
assert.match(rows.instruction, /gleich weit/);
assert.match(rows.feedbackHints.join(' '), /gleich weit/);

console.log('Die beiden Physik-11-Freitextaufgaben zum Kettenkarussell sind vollständig konfiguriert.');
