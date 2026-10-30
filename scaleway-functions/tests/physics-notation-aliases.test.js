'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../evaluation-core');
const { createHandler } = require('../handler');
const physicsTasks = Object.entries(core.TASKS).filter(([, task]) => /^Physik\b/i.test(task.title));
const answerPart = prompt => prompt.split('\nSchuelerantwort:\n')[1];

test('alle Physik-Kriterienprompts akzeptieren Aliase, behalten aber Originalbelege bei', () => {
  assert.ok(physicsTasks.length > 0);
  const forces = ['F_Z', 'F_ZP', 'FZ', 'FZP', 'f_z', 'f_zp', 'fz', 'fzp', 'F_zP', 'fZp'];
  const angles = ['α', 'alpha', 'ALPHA', 'Alpha', 'Α'];
  for (const [id, task] of physicsTasks) {
    const canonical = core.buildPrompt_(task, 'F_Z wird größer und der Winkel α nimmt zu.');
    assert.match(canonical, /F_Z, F_ZP, FZ und FZP.*unabhängig von Groß- und Kleinschreibung/, id);
    for (const force of forces) {
      for (const angle of angles) {
        const answer = `${force} wird größer und der Winkel ${angle} nimmt zu.`;
        assert.ok(core.buildPrompt_(task, answer).endsWith(`Schuelerantwort:\n${answer}`), `${id}: ${force}, ${angle}`);
      }
    }
  }
});

test('Größennamen und Formelzeichen sind ausdrücklich gleichwertig, Aussagen werden fachlich beurteilt', () => {
  for (const [id, task] of physicsTasks) {
    const prompt = core.buildPrompt_(task, 'Die Zentripetalkraft zeigt zum Mittelpunkt; der Winkel alpha wächst.');
    assert.match(prompt, /ausgeschriebenen Namen.*ebenso wie.*Formelzeichen; verlange nicht beides/, id);
    assert.match(prompt, /F_Z, F_ZP, FZ und FZP.*unabhängig von Groß- und Kleinschreibung/, id);
    assert.match(prompt, /α, alpha und Winkel alpha/, id);
    assert.match(prompt, /Gewichtskraft und F_G\/FG, Seilkraft und F_S\/FS, Masse und m/, id);
    assert.match(prompt, /Falsche Aussagen und Widersprüche bleiben.*falsch/, id);
    assert.equal(answerPart(prompt), 'Die Zentripetalkraft zeigt zum Mittelpunkt; der Winkel alpha wächst.', id);
  }
});

test('Normalisierung erhält Zahlen, Einheiten, Richtungen, andere Symbole und Wortbestandteile', () => {
  const task = core.TASKS['ph11-kettenkarussell-winkelgeschwindigkeit'];
  const source = 'FZP zeigt nach außen; tan(alpha) = F_ZP / FG. 1 mA und 1 MA, 9,81 m/s². FG, F_S, ω, Beta, Alphabet, alpha2, meinFZP, FZP_name bleiben erhalten.';
  assert.equal(answerPart(core.buildPrompt_(task, source)), source);
  const informatics = core.TASKS['11-5-1'];
  assert.equal(answerPart(core.buildPrompt_(informatics, source)), source);
});

test('echter Anfragepfad übermittelt dieselbe normalisierte Physikantwort; Aliase vergeben keine Punkte (Mock)', async () => {
  const taskId = 'ph11-kettenkarussell-winkelgeschwindigkeit';
  const task = core.TASKS[taskId];
  const prompts = [];
  const handle = createHandler({ rateLimit: Infinity, env: {
    AI_API_KEY: 'mock-only', AI_PROJECT_ID: '11111111-1111-1111-1111-111111111111',
    AI_MODEL: 'mock-model', AI_EVALUATION_ENABLED: 'true'
  }, fetchImpl: async (url, options) => {
    prompts.push(JSON.parse(options.body).messages[1].content);
    return { ok: true, status: 200, text: async () => JSON.stringify({ choices: [{ finish_reason: 'stop',
      message: { content: JSON.stringify({ criteria: Object.fromEntries(task.feedbackCriteria.map(criterion =>
        [criterion.id, { status: 'missing', evidence: [] }])) }) }
    }] }) };
  } });
  for (const [index, [force, angle]] of [['F_Z', 'α'], ['F_ZP', 'alpha'], ['fz', 'ALPHA'], ['fZp', 'Alpha']].entries()) {
    const response = await handle({ httpMethod: 'POST', path: '/', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId: `physics_alias_${index}`, taskId, requestType: 'text',
        answer: `${force} und Winkel ${angle} werden größer.` }) });
    assert.equal(response.statusCode, 200);
    assert.equal(JSON.parse(response.body).result.points, 0);
  }
  assert.equal(prompts.length, 4);
  for (const [index, prompt] of prompts.entries()) {
    const [force, angle] = [['F_Z', 'α'], ['F_ZP', 'alpha'], ['fz', 'ALPHA'], ['fZp', 'Alpha']][index];
    assert.ok(prompt.endsWith(`Schuelerantwort:\n${force} und Winkel ${angle} werden größer.`));
  }
});
