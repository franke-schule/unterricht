'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const core = require('../evaluation-core');
const { evaluate, readConfig } = require('../scaleway-client');
const { createHandler } = require('./fixtures/authorized-handler');
const task = core.TASKS['1b'];
const config = readConfig({ AI_API_KEY: 'mock', AI_PROJECT_ID: '11111111-1111-1111-1111-111111111111', AI_MODEL: 'mock-model' });
const full = 'Die 100 wird beim Aufruf an den Konstruktor der Klasse Ball übergeben. Der Konstruktor besitzt den Parameter startX, der den Parameterwert 100 erhält.';
const model = (answer, statuses = ['correct', 'correct', 'correct', 'correct']) => ({ criteria: Object.fromEntries(task.feedbackCriteria.map((c, i) =>
  [c.id, { status: statuses[i], evidence: statuses[i] === 'missing' ? [] : [answer] }])) });
const response = value => ({ ok: true, text: async () => JSON.stringify({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(value) } }] }) });

test('1b: vier Kriterien, sichtbarer Auftrag und eine Begriffshilfe pro Kriterium stimmen überein', () => {
  assert.equal(task.maxPoints, 4);
  assert.equal(task.expectedAspects.length, 4);
  assert.equal(task.expectedAspects[2], 'Der Konstruktor der Klasse Ball besitzt einen Parameter.');
  assert.equal(task.expectedAspects[3], 'Der konkrete Wert 100 wird als Parameterwert bezeichnet.');
  assert.ok(task.expectedAspects.every(aspect => !/x-Position|Startpunkt/.test(aspect)));
  const html = fs.readFileSync(path.resolve(__dirname, '../../faecher/informatik/klasse-10/2-Modellierung-und-Programmierung-Online-IDE/aufgabe1.html'), 'utf8');
  const section = html.split('<!-- Aufgabe 1b -->')[1].split('<!-- Aufgabe 1c -->')[0];
  const prompt = section.match(/<p>([\s\S]*?)<\/p>/)[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
  assert.equal(prompt, task.instruction);
  const helps = [...section.matchAll(/<details data-criterion="([^"]+)">([\s\S]*?)<\/details>/g)];
  assert.deepEqual(helps.map(h => h[1]), task.feedbackCriteria.map(c => c.id));
  assert.match(helps[0][2], /Konstruktor/);
  assert.match(helps[1][2], /Wert im Konstruktor verfolgen/);
  assert.match(helps[2][2], /Ein Parameter ist/);
  assert.match(helps[3][2], /Ein Parameterwert ist/);
  assert.match(html, /"1b":4/);
  assert.match(html, /"1b":"20261108-criteria-v2"/);
});

test('1b (Modellmock): vollständige Erklärung ohne x-Position erhält vier Punkte', async () => {
  let calls = 0;
  const result = await evaluate(task, full, config, async (url, options) => {
    calls++;
    const prompt = JSON.parse(options.body).messages[1].content;
    assert.match(prompt, /x-Startposition ist kein Pflichtaspekt/);
    assert.ok(prompt.endsWith(full));
    return response(model(full));
  });
  assert.equal(calls, 1);
  assert.equal(result.points, 4);
  assert.equal(result.feedback, 'Sehr gut, alles richtig');
  assert.deepEqual(result.missing, []);
});

test('1b (Modellmock): jedes einzelne fehlende oder falsche Kriterium liefert genau einen passenden Hinweis', async () => {
  for (let i = 0; i < 4; i++) {
    for (const status of ['missing', 'wrong_relation']) {
      const statuses = ['correct', 'correct', 'correct', 'correct'];
      statuses[i] = status;
      const result = await evaluate(task, full, config, async () => response(model(full, statuses)));
      assert.equal(result.points, 3);
      assert.deepEqual(result.missing, [`Schritt ${i + 1} von 4 \u2013 ${task.feedbackCriteria[i].label}: ${task.feedbackCriteria[i].issues[status]}`]);
    }
  }
});

test('1b: fehlende Pflichtbegriffe werden trotz zu großzügiger Modellurteile nicht als erfüllt gezählt', async () => {
  const cases = [
    ['Die 100 wird an den Konstruktor übergeben und in startX gespeichert.', 2, 3, 'Parameter'],
    ['Der Konstruktor besitzt einen Parameter startX, der beim Aufruf die 100 bekommt.', 3, 4, 'Parameterwert'],
    ['Der Konstruktor erhält den Parameterwert 100 und speichert ihn in startX.', 3, 3, 'Parameter'],
    ['Der Konstruktor besitzt einen Parameter startX. Die 100 ist ein Argument.', 3, 4, 'Parameterwert']
  ];
  for (const [answer, points, step, term] of cases) {
    const result = await evaluate(task, answer, config, async () => response(model(answer)));
    assert.equal(result.points, points, answer);
    assert.equal(result.missing.length, 1);
    assert.match(result.missing[0], new RegExp(`^Schritt ${step} von 4`));
    assert.ok(result.missing[0].includes(`Verwende das Wort „${term}“`));
  }
});

test('1b: Flexion und Großschreibung sind zulässig; das bloße Vorkommen der Wörter vergibt keine Punkte', async () => {
  const answer = 'Die 100 wird an den KONSTRUKTOR übergeben. Der Name des Parameters ist startX. Der Wert des Parameterwertes ist 100.';
  const result = await evaluate(task, answer, config, async () => response(model(answer)));
  assert.equal(result.points, 4);
  const words = 'Konstruktor Parameter Parameterwert';
  const missing = await evaluate(task, words, config, async () => response(model(words, ['missing', 'missing', 'missing', 'missing'])));
  assert.equal(missing.points, 0);
  assert.equal(missing.missing.length, 1);
});

test('1b: der Server liefert nach Bearbeitung den nächsten aktuell fehlenden Begriff (Modellmock)', async () => {
  const handle = createHandler({ env: { AI_API_KEY: 'mock', AI_PROJECT_ID: '11111111-1111-1111-1111-111111111111', AI_MODEL: 'mock-model', AI_EVALUATION_ENABLED: 'true' },
    fetchImpl: async (url, options) => {
      const prompt = JSON.parse(options.body).messages[1].content;
      const answer = prompt.split('Schuelerantwort:\n').at(-1);
      return response(model(answer));
    } });
  const answers = ['Die 100 geht an den Konstruktor und wird in startX verwendet.',
    'Die 100 geht an den Konstruktor und wird für dessen Parameter startX verwendet.', full];
  for (let i = 0; i < answers.length; i++) {
    const reply = await handle({ httpMethod: 'POST', path: '/', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ taskId: '1b', requestId: `inf10_1b_${i}`, answer: answers[i] }) });
    assert.equal(reply.statusCode, 200);
    const result = JSON.parse(reply.body).result;
    assert.equal(result.points, i + 2);
    if (i === 2) assert.equal(result.feedback, 'Sehr gut, alles richtig');
    else assert.ok(result.missing[0].includes(i === 0 ? '„Parameter“' : '„Parameterwert“'));
  }
});
