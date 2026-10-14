const assert = require('node:assert/strict');
const { TASKS, buildPrompt_, normalizeEvaluation_ } = require('../../scaleway-functions/evaluation-core');

for (const number of [2, 5, 8, 11]) {
  const id = `inf10-db-a9-p${number}`;
  const task = TASKS[id];
  assert.ok(task, `${id}: registriert`);
  assert.equal(task.grade, 10);
  assert.equal(task.maxPoints, 4);
  assert.equal(task.expectedAspects.length, 4);
  assert.deepEqual(task.statusLabels, { correct: 'korrekt', partial: 'teilweise korrekt', incorrect: 'noch nicht korrekt' });
  assert.match(task.context, /SELECT .*\nFROM /);
  assert.match(task.context, /Beschreibe/);
  const prompt = buildPrompt_(task, 'Meine eigene fachliche Erklärung.');
  for (const aspect of task.expectedAspects) assert.ok(prompt.includes(aspect), `${id}: Aspekt im Prompt`);
  assert.ok(prompt.includes(task.context), `${id}: feste SQL-Abfrage und Auftrag im Kontext`);
  assert.match(prompt, /keine vollständige Musterlösung/);
  for (const [points, status] of [[0, 'noch nicht korrekt'], [2, 'teilweise korrekt'], [4, 'korrekt']]) {
    const result = normalizeEvaluation_({ points, status: 'falsch', feedback: 'Gezielter Testhinweis.', strengths: [], missing: [] }, task);
    assert.equal(result.points, points);
    assert.equal(result.maxPoints, 4);
    assert.equal(result.status, status);
    assert.equal(result.ok, true);
  }
}
console.log('Vier Aufgabe-9-Freitextrubriken und simulierte Modellantworten geprüft.');
