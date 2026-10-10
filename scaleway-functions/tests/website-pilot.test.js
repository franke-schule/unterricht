'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { randomUUID } = require('node:crypto');
const { transformPage, pagePath } = require('../prepare-website-test');
const source = fs.readFileSync(path.resolve(__dirname, '../..', pagePath), 'utf8');
const transformed = transformPage(source);
const scriptStart = transformed.indexOf('<script>', transformed.indexOf('</main>')) + 8;
const script = transformed.slice(scriptStart, transformed.indexOf('</script>', scriptStart));

function element() {
  return { value: '', disabled: false, hidden: true, className: '', children: [],
    set textContent(value) { this.text = String(value); this.children = []; },
    get textContent() { return this.text || ''; },
    appendChild(child) { this.children.push(child); }, focus() { this.focused = true; } };
}
function harness(fetchImpl) {
  const elements = Object.fromEntries(['b', 'c'].flatMap(task =>
    ['answer', 'button', 'result', 'count'].map(kind => [kind + '-' + task, element()])));
  const timers = new Map();
  let timerCount = 0;
  const context = vm.createContext({ document: { getElementById: id => elements[id], createElement: element },
    window: { crypto: { randomUUID } }, URL, AbortController, fetch: fetchImpl,
    setTimeout: callback => { timers.set(++timerCount, callback); return timerCount; },
    clearTimeout: id => timers.delete(id) });
  const helper = fs.readFileSync(path.resolve(__dirname, '../../faecher/informatik/klasse-11/1-Kuenstliche-Intelligenz/perzeptron/ui/semantic-answer.mjs'), 'utf8').replace(/^export /gm, '');
  vm.runInContext(helper, context);
  vm.runInContext('globalThis.scwTestModule = { evaluateSemanticAnswer, evaluateCodeAnswer };', context);
  vm.runInContext(script.replace(/import\('[^']+'\)/g, 'Promise.resolve(scwTestModule)'), context);
  return { elements, timers, context };
}
function resultFor(options, extra = {}) {
  const request = JSON.parse(options.body);
  return { type: 'GEMINI_EVALUATION_RESULT', requestId: request.requestId,
    result: { ok: true, points: 6, maxPoints: 6, status: 'korrekt', strengths: ['Vollständig'],
      missing: [], feedback: 'Die Erklärung passt.', ...extra } };
}

test('Pilot behält Ergebnisanzeige, Lehrercode, IDE und Eingabespeicherung bei', () => {
  const marker = '    function showEvaluation(';
  assert.equal(transformed.slice(transformed.indexOf(marker)), source.slice(source.indexOf(marker)));
  assert.ok(transformed.includes("../../../../include/js/includeide/includeIDE.js"));
  assert.ok(transformed.includes('Lokale Scaleway-Testkopie'));
  assert.ok(!transformed.includes('script.google.com'));
  assert.ok(!transformed.includes('createJsonpUrl'));
});

test('3000 Zeichen werden im POST-Body übertragen; vorhandene Anzeige verarbeitet b und c', async () => {
  const calls = [];
  const h = harness(async (url, options) => {
    calls.push({ url, options });
    return { ok: true, json: async () => resultFor(options) };
  });
  for (const taskId of ['b', 'c']) {
    h.elements['answer-' + taskId].value = 'Ä'.repeat(3000);
    await h.context.submitAnswer(taskId);
    const call = calls.at(-1);
    assert.equal(new URL(call.url).search, '');
    assert.equal(new URL(call.url).hostname, 'unterrichtkiichezbn4-ki-auswertung.functions.fnc.fr-par.scw.cloud');
    assert.equal(call.options.method, 'POST');
    assert.equal(call.options.credentials, 'omit');
    const body = JSON.parse(call.options.body);
    assert.equal(body.taskId, taskId);
    assert.equal(body.answer.length, 3000);
    assert.equal(h.elements['result-' + taskId].children[0].textContent, '6 von 6 Punkten – korrekt');
    assert.equal(h.elements['button-' + taskId].disabled, false);
    assert.equal(h.elements['answer-' + taskId].disabled, false);
  }
  assert.equal(h.timers.size, 0);
});

test('Doppelklick erzeugt keine zweite Anfrage; beide Aufgaben können getrennt laufen', async () => {
  const pending = [];
  const h = harness((url, options) => new Promise(resolve => pending.push({ options, resolve })));
  h.elements['answer-b'].value = h.elements['answer-c'].value = 'Eine erfundene Antwort.';
  const first = h.context.submitAnswer('b');
  await h.context.submitAnswer('b');
  const second = h.context.submitAnswer('c');
  await Promise.resolve();
  assert.equal(pending.length, 2);
  assert.notEqual(JSON.parse(pending[0].options.body).requestId, JSON.parse(pending[1].options.body).requestId);
  for (const call of pending) call.resolve({ ok: true, json: async () => resultFor(call.options) });
  await Promise.all([first, second]);
  assert.equal(h.elements['button-b'].disabled, false);
  assert.equal(h.elements['button-c'].disabled, false);
});

test('Ungültige Eingabe führt vor dem Versand zu einer Rückmeldung', async () => {
  let calls = 0;
  const h = harness(() => { calls++; });
  for (const answer of ['kurz', 'A'.repeat(3001)]) {
    h.elements['answer-b'].value = answer;
    await h.context.submitAnswer('b');
    assert.equal(h.elements['result-b'].className, 'result error');
    assert.equal(h.elements['button-b'].disabled, false);
  }
  assert.equal(calls, 0);
});

test('Fehler und falsch zugeordnete oder beschädigte Ergebnisse geben die Eingabe frei', async () => {
  const replies = [
    options => ({ ok: false, json: async () => resultFor(options, { ok: false, message: 'Auswertung deaktiviert.' }) }),
    options => ({ ok: true, json: async () => ({ ...resultFor(options), requestId: 'anderer_request' }) }),
    options => ({ ok: true, json: async () => resultFor(options, { points: 9 }) }),
    () => ({ ok: false, json: async () => { throw new SyntaxError('Kein JSON'); } })
  ];
  for (const reply of replies) {
    const h = harness(async (url, options) => reply(options));
    h.elements['answer-b'].value = 'Eine erfundene Antwort.';
    await h.context.submitAnswer('b');
    assert.equal(h.elements['result-b'].className, 'result error');
    assert.equal(h.elements['button-b'].disabled, false);
    assert.equal(h.elements['answer-b'].disabled, false);
    assert.equal(h.timers.size, 0);
  }
});

test('Timeout bricht die Anfrage ab und ermöglicht erneutes Prüfen', async () => {
  const h = harness((url, options) => new Promise((resolve, reject) =>
    options.signal.addEventListener('abort', () => reject(new Error('abgebrochen')))));
  h.elements['answer-c'].value = 'Eine erfundene Antwort.';
  const evaluation = h.context.submitAnswer('c');
  await Promise.resolve();
  [...h.timers.values()][0]();
  await evaluation;
  assert.match(h.elements['result-c'].textContent, /zu lange gedauert/);
  assert.equal(h.elements['button-c'].disabled, false);
  assert.equal(h.elements['answer-c'].disabled, false);
  assert.equal(h.timers.size, 0);
});
