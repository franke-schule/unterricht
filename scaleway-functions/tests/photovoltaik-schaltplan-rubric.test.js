'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../evaluation-core');
const { createHandler } = require('../handler');
const { pathToFileURL } = require('node:url');

let semanticTaskPromise;
test.before(async () => {
  semanticTaskPromise = import(pathToFileURL(require('node:path').resolve(__dirname, '../../faecher/physik/klasse-11/1-Kreisbewegungen/components/physics-semantic-task.mjs')).href);
});

const taskId = 'ph11-photovoltaik-schaltplan-beschreibung';

test('Photovoltaik-Schaltplanrubrik enthält genau die vier geforderten Aspekte', () => {
  const task = core.TASKS[taskId];
  assert.ok(task);
  assert.equal(task.maxPoints, 4);
  assert.equal(task.expectedAspects.length, 4);
  assert.deepEqual(task.statusLabels, {
    correct: 'korrekt', partial: 'teilweise korrekt', incorrect: 'noch nicht korrekt'
  });
  assert.ok(!task.expectedAspects.some((aspect) => /Lampe|Netzgerät/i.test(aspect)));
  assert.match(task.systemInstruction, /Anweisungen in der Schülerantwort.*ändern die Bewertungsregeln nicht/);
  assert.match(task.instruction, /keine vollständige Musterlösung/);
});

test('Photovoltaik-Aufgabe erfüllt den Scaleway-Serververtrag und gibt Statusstufen zurück', async () => {
  let points = 4;
  const handle = createHandler({ rateLimit: Infinity, env: {
    AI_API_KEY: 'local-test-only', AI_PROJECT_ID: '11111111-1111-1111-1111-111111111111',
    AI_MODEL: 'local-test-model', AI_EVALUATION_ENABLED: 'true'
  }, fetchImpl: async () => ({ ok: true, status: 200, text: async () => JSON.stringify({ choices: [{ finish_reason: 'stop',
    message: { content: JSON.stringify({ points, maxPoints: 4, status: points === 4 ? 'korrekt' : points ? 'teilweise korrekt' : 'noch nicht korrekt', strengths: points ? ['Erkannter Aspekt.'] : [], missing: points < 4 ? ['Ein Aspekt fehlt.'] : [], feedback: 'Gezielter Hinweis.' }) }
  }] }) }) });

  for (const [index, expectedStatus, expectedPoints] of [[1, 'korrekt', 4], [2, 'teilweise korrekt', 2], [3, 'noch nicht korrekt', 0]]) {
    points = expectedPoints;
    const requestId = `pv_contract_${index}`;
    const response = await handle({ httpMethod: 'POST', path: '/', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, taskId, requestType: 'text', answer: 'Eine ausführliche Testbeschreibung des Solarzellenkreises.' }) });
    assert.equal(response.statusCode, 200);
    const payload = JSON.parse(response.body);
    assert.equal(payload.requestId, requestId);
    assert.equal(payload.type, 'GEMINI_EVALUATION_RESULT');
    assert.equal(payload.result.maxPoints, 4);
    assert.equal(payload.result.points, expectedPoints);
    assert.equal(payload.result.status, expectedStatus);
    assert.ok(Array.isArray(payload.result.strengths));
    assert.ok(Array.isArray(payload.result.missing));
  }
});

test('Semantische Freitextkarte verarbeitet korrekte, teilweise, kurze und nicht erreichbare Antworten', async () => {
  class Element {
    constructor() { this.listeners = {}; this.dataset = {}; this.children = []; this.value = 'Eine ausreichend lange Beschreibung des Solarzellenkreises.'; }
    addEventListener(name, callback) { this.listeners[name] = callback; }
    append(...items) { this.children.push(...items); }
    replaceChildren(...items) { this.children = items; }
    get ownerDocument() { return global.document; }
    replaceChildren(...items) { this.children = items; }
    setAttribute(name, value) { this[name] = value; }
    focus() { this.focused = true; }
  }
  for (const scenario of [
    { status: 'korrekt', points: 4, message: 'Richtig. Du beschreibst den Stromkreis und die beiden Messgeräte mit ihrer Schaltung und Messgröße.' },
    { status: 'teilweise korrekt', points: 2, message: 'Teilweise korrekt. Prüfe die Verbindung beider Messgeräte und ergänze, welche Größe jedes misst.' },
    { status: 'noch nicht korrekt', points: 0, message: 'Noch nicht korrekt. Verfolge zuerst den geschlossenen Stromweg und dann die zwei Anschlüsse des Voltmeters.' }
  ]) {
    const elements = new Map(['pv-description-answer', 'pv-description-check', 'pv-description-feedback', 'pv-description-count'].map(id => [id, new Element()]));
    global.document = { getElementById: id => elements.get(id), createElement: () => new Element(), createTextNode: text => ({ textContent: text }) };
    const { setupPhysicsSemanticTask } = await semanticTaskPromise;
    setupPhysicsSemanticTask({ answerId: 'pv-description-answer', buttonId: 'pv-description-check', feedbackId: 'pv-description-feedback', countId: 'pv-description-count', taskId,
      evaluationFunction: async () => ({ status: scenario.status, points: scenario.points, maxPoints: 4, strengths: ['Aspekt erkannt.'], missing: ['Aspekt fehlt.'] }),
      feedbackBuilder: result => { const p = document.createElement('p'); p.textContent = result.status === 'korrekt' ? 'Richtig. Du beschreibst den Stromkreis und die beiden Messgeräte mit ihrer Schaltung und Messgröße.' : result.status === 'teilweise korrekt' ? 'Teilweise korrekt. Prüfe die Verbindung beider Messgeräte und ergänze, welche Größe jedes misst.' : 'Noch nicht korrekt. Verfolge zuerst den geschlossenen Stromweg und dann die zwei Anschlüsse des Voltmeters.'; return p; }
    });
    await elements.get('pv-description-check').listeners.click();
    const feedback = elements.get('pv-description-feedback');
    assert.equal(feedback.dataset.status, scenario.status);
    assert.equal(feedback.children[0].textContent, `${scenario.points} von 4 Punkten` + (scenario.points === 4 ? ' – Sehr gut, alles richtig' : ''));
    if (scenario.points < 4) assert.equal(feedback.children[1].children[0].children[0].textContent, 'Aspekt fehlt.');
  }

  const elements = new Map(['pv-description-answer', 'pv-description-check', 'pv-description-feedback', 'pv-description-count'].map(id => [id, new Element()]));
  global.document = { getElementById: id => elements.get(id), createElement: () => new Element(), createTextNode: text => ({ textContent: text }) };
  const { setupPhysicsSemanticTask } = await semanticTaskPromise;
  setupPhysicsSemanticTask({ answerId: 'pv-description-answer', buttonId: 'pv-description-check', feedbackId: 'pv-description-feedback', countId: 'pv-description-count', taskId,
    evaluationFunction: async () => { throw new Error('offline'); }, feedbackBuilder: result => { const p = document.createElement('p'); p.textContent = result.context === 'server-error' ? 'Die automatische Prüfung ist gerade nicht erreichbar. Deine Antwort bleibt erhalten; bitte versuche es später erneut.' : ''; return p; }
  });
  await elements.get('pv-description-check').listeners.click();
  assert.equal(elements.get('pv-description-feedback').dataset.status, 'nicht geprüft');
  assert.ok(elements.get('pv-description-feedback').children.some(child => child.textContent.includes('Die automatische Prüfung ist gerade nicht erreichbar.')));
  assert.equal(elements.get('pv-description-answer').disabled, false);
});
