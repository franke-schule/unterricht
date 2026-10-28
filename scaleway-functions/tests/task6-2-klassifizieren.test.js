'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../evaluation-core');
const { createHandler } = require('../handler');

const taskId = '11-6-klassifizieren';
const task = core.TASKS[taskId];
const reportedAnswer = 'Zuerst berechnet er aus den Werte, die jeweils mit w_1 oder w_2 multipliziert werden, eine Summe. Wenn diese Summe größer als theta ist, dann gibt er 1 aus. Wenn diese Summe gleich oder kleiner als theta ist, dann gibt sie 0 zurück.';

test('6.2: Beschreibe-Rubrik vergibt getrennte Punkte ohne Pflicht zum Fachbegriff oder wiederholten Rückgabewerten', () => {
  assert.equal(task.maxPoints, 4);
  assert.equal(task.expectedAspects.length, 4);
  assert.equal(task.rubric.length, 4);
  const prompt = core.buildPrompt_(task, reportedAnswer);
  assert.match(prompt, /Fachbegriff gewichtete Summe ist nicht erforderlich/);
  assert.match(prompt, /Ausgeben und zurückgeben sind.*sinngemäß gleichwertig/);
  assert.match(prompt, /Fehlt nur die Aussage über unveränderte Gewichte, sind 3 von 4 Punkten/);
  assert.match(prompt, /Eine zusätzliche Aussage über theta oder andere Parameter ist nicht gefordert/);
  assert.match(prompt, /Es fehlt ausschließlich die Aussage, ob die Gewichte verändert werden/);
  for (const criterion of task.rubric) assert.ok(prompt.includes(criterion));
  assert.ok(prompt.endsWith(reportedAnswer));
});

test('6.2: Beschreibe-Serververtrag mit gemeldeter und ergänzter Antwort (Mock, keine KI-Livebewertung)', async () => {
  for (const [answer, points] of [[reportedAnswer, 3],
    [reportedAnswer + ' Die Gewichte bleiben dabei unverändert.', 4]]) {
    const missing = points === 3 ? ['Ergänze, ob punktKlassifizieren die Gewichte verändert.'] : [];
    const handle = createHandler({ rateLimit: Infinity, env: {
      AI_API_KEY: 'mock-only', AI_PROJECT_ID: '11111111-1111-1111-1111-111111111111',
      AI_MODEL: 'mock-model', AI_EVALUATION_ENABLED: 'true'
    }, fetchImpl: async (url, options) => {
      const prompt = JSON.parse(options.body).messages[1].content;
      assert.ok(prompt.endsWith(answer));
      assert.ok(prompt.includes('verlange keine Wiederholung der bereits genannten Werte'));
      return { ok: true, status: 200, async text() {
        return JSON.stringify({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify({
          points, maxPoints: 4, status: points === 4 ? 'korrekt' : 'teilweise korrekt',
          strengths: [], missing, feedback: missing.join(' ') || 'Sehr gut, alles richtig'
        }) } }] });
      } };
    } });
    const response = await handle({ httpMethod: 'POST', path: '/',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId: 'task6_2_description_' + points, taskId, answer }) });
    assert.equal(response.statusCode, 200);
    const result = JSON.parse(response.body).result;
    assert.equal(result.points, points);
    assert.deepEqual(result.missing, missing);
    if (points === 4) assert.equal(result.feedback, 'Sehr gut, alles richtig');
  }
});
