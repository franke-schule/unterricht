'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const core = require('../evaluation-core');
const { createHandler } = require('../handler');

const taskId = '11-6-einfach-summe';
const task = core.TASKS[taskId];
const html = fs.readFileSync(path.resolve(__dirname,
  '../../faecher/informatik/klasse-11/1-Kuenstliche-Intelligenz/aufgabe6.html'), 'utf8');
const startCode = html.match(/title="Perzeptron\.java">([\s\S]*?)<\/script>/)[1];
const reportedCode = startCode.replace('double gewichtete_Summe = 0;',
  'double gewichtete_Summe = w_1*punkt.gibEingabewertX1() + w_2*punkt.gibEingabewertX2();');

test('6.2: Bewertungsauftrag trennt die double-Summe von binärer int-Ausgabe und offenen Folgeschritten', () => {
  assert.equal(task.maxPoints, 3);
  assert.equal(task.expectedAspects.length, 3);
  assert.equal(task.rubric.length, 3);
  // Originaler IDE-Startstand mit ausschließlich der gemeldeten Änderung in Schritt 2.
  assert.match(reportedCode, /int berechnete_ausgabe = 0;/);
  assert.match(reportedCode, /if \(gewichtete_Summe > theta\) \{\s*\/\/ Ergänze die Ausgabe\./);
  const prompt = core.buildPrompt_(task, reportedCode);
  assert.match(prompt, /berechnete_ausgabe.*korrekt als int deklariert/);
  assert.match(prompt, /int berechnete_ausgabe = 0; ist korrekt und verursacht keinen Ganzzahlverlust/);
  assert.match(prompt, /Noch leere if-\/else-Zweige[\s\S]*weder zu Punktabzug noch zu Fehlhinweisen/);
  assert.match(prompt, /erfüllt alle drei Aspekte und erhält 3 von 3 Punkten/);
  assert.match(prompt, /\(int\)-Umwandlungen von Eingaben, Produkten oder Summe/);
  assert.match(prompt, /Zuweisung eines double-Ausdrucks an int ohne Cast ist ein Typfehler/);
  for (const criterion of task.rubric) assert.ok(prompt.includes(criterion));
  assert.ok(prompt.endsWith(reportedCode + '\nENDE SCHUELERCODE'));
});

test('6.2: Server übermittelt den präzisierten Auftrag und formatiert volle Punkte (Mock, keine KI-Livebewertung)', async () => {
  let calls = 0;
  const handle = createHandler({ rateLimit: Infinity, env: {
    AI_API_KEY: 'mock-only', AI_PROJECT_ID: '11111111-1111-1111-1111-111111111111',
    AI_MODEL: 'mock-model', AI_EVALUATION_ENABLED: 'true'
  }, fetchImpl: async (url, options) => {
    calls++;
    const payload = JSON.parse(options.body);
    const prompt = payload.messages[1].content;
    assert.ok(prompt.includes('int berechnete_ausgabe = 0; ist korrekt'));
    assert.ok(prompt.includes(reportedCode.trim()));
    return { ok: true, status: 200, async text() {
      return JSON.stringify({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify({
        points: 3, maxPoints: 3, status: 'korrekt', strengths: [], missing: [],
        feedback: 'Sehr gut, alles richtig'
      }) } }] });
    } };
  } });
  const response = await handle({ httpMethod: 'POST', path: '/',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requestId: 'task6_2_summe_regression', taskId, requestType: 'code', code: reportedCode }) });
  assert.equal(response.statusCode, 200);
  assert.equal(calls, 1);
  const result = JSON.parse(response.body).result;
  assert.equal(result.points, 3);
  assert.equal(result.maxPoints, 3);
  assert.deepEqual(result.missing, []);
  assert.equal(result.feedback, 'Sehr gut, alles richtig');
});
