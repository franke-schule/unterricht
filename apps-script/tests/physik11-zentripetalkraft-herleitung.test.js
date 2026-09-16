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
  'ph11-zentripetalkraft-herleitung-dv',
  'ph11-zentripetalkraft-herleitung-naeherung',
  'ph11-zentripetalkraft-herleitung-aehnlichkeit',
];

taskIds.forEach((taskId) => {
  const task = vm.runInContext(`TASKS['${taskId}']`, context);
  assert.ok(task, `${taskId} fehlt in TASKS`);
  assert.equal(task.grade, 11, `${taskId}: grade`);
  assert.equal(task.maxPoints, task.expectedAspects.length, `${taskId}: maxPoints muss der Anzahl expectedAspects entsprechen`);
  assert.ok(task.expectedAspects.length > 0, `${taskId}: expectedAspects darf nicht leer sein`);
  assert.ok(typeof task.context === 'string' && task.context.trim().length > 0, `${taskId}: context darf nicht leer sein`);

  const prompt = context.buildPrompt_(task, 'Beispielantwort zur Prüfung des Prompts.');
  assert.match(prompt, /Beispielantwort zur Prüfung des Prompts\./, `${taskId}: buildPrompt_ übernimmt die Schülerantwort`);
  assert.match(prompt, new RegExp(task.expectedAspects[0].replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `${taskId}: buildPrompt_ enthält den ersten erwarteten Aspekt`);
});

const dvTask = vm.runInContext("TASKS['ph11-zentripetalkraft-herleitung-dv']", context);
assert.equal(dvTask.maxPoints, 3);
assert.match(dvTask.systemInstruction, /Δv/);

const naeherungTask = vm.runInContext("TASKS['ph11-zentripetalkraft-herleitung-naeherung']", context);
assert.equal(naeherungTask.maxPoints, 2);
assert.match(naeherungTask.systemInstruction, /Näherung/);

const aehnlichkeitTask = vm.runInContext("TASKS['ph11-zentripetalkraft-herleitung-aehnlichkeit']", context);
assert.equal(aehnlichkeitTask.maxPoints, 3);
assert.match(aehnlichkeitTask.systemInstruction, /Ähnlichkeit/);

console.log('Die drei neuen Herleitungs-Freitextaufgaben sind vollständig konfiguriert und buildPrompt_ übernimmt Beispielantworten korrekt.');
