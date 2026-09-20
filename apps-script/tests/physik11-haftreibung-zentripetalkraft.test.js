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
  'ph11-haftreibung-kurvenfahrt-gefahren',
  'ph11-haftreibung-kurvenfahrt-massenunabhaengigkeit',
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

const danger = vm.runInContext("TASKS['ph11-haftreibung-kurvenfahrt-gefahren']", context);
assert.equal(danger.maxPoints, 6);
assert.match(danger.systemInstruction, /Kurvenfahrt/);
assert.match(danger.expectedAspects.join(' '), /quadratisch/);

const mass = vm.runInContext("TASKS['ph11-haftreibung-kurvenfahrt-massenunabhaengigkeit']", context);
assert.equal(mass.maxPoints, 5);
assert.match(mass.systemInstruction, /Massenunabhängigkeit/);
assert.match(mass.expectedAspects.join(' '), /gekürzt/);

console.log('Die beiden Physik-11-Freitextaufgaben zur Haftreibung sind vollständig konfiguriert.');
