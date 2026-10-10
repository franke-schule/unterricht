'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { randomUUID } = require('node:crypto');
const { transformCodePage, existingFunction, codePagePath } = require('../prepare-website-test');
const source = fs.readFileSync(path.resolve(__dirname, '../..', codePagePath), 'utf8');
const transformed = transformCodePage(source);
const start = transformed.indexOf('<script>', transformed.indexOf('</main>')) + 8;
const fullScript = transformed.slice(start, transformed.indexOf('</script>', start));
const script = fullScript.slice(0, fullScript.indexOf('    function setupChoiceQuiz('));

function element() {
  return { disabled: false, hidden: true, dataset: {}, children: [], className: '',
    set textContent(value) { this.text = String(value); this.children = []; },
    get textContent() { return this.text || ''; },
    appendChild(child) { this.children.push(child); } };
}
function harness(fetchImpl) {
  const state = { code: 'Robot dudu = new Robot(1, 1, 12, 12);', ready: true };
  const elements = Object.fromEntries(['10-3a', '10-3b'].flatMap(task =>
    ['button', 'result'].map(kind => [kind + '-' + task, element()])));
  elements['button-10-3a'].textContent = 'Meinen Code für a prüfen';
  elements['button-10-3b'].textContent = 'Meinen Code für b prüfen';
  elements['robot-ide'] = { contentWindow: { online_ide_access: { getIDE(id) {
    assert.equal(id, 'Java10Aufgabe3Roboter');
    return state.ready ? { getFiles: () => [
      { getName: () => 'Andere.java', getText: () => 'nicht übertragen' },
      { getName: () => 'Hauptprogramm.java', getText: () => state.code }
    ] } : undefined;
  } } } };
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
  return { elements, state, timers, context };
}
function responseFor(options, extra = {}) {
  const request = JSON.parse(options.body);
  const maxPoints = request.taskId === '10-3a' ? 3 : 6;
  return { type: 'GEMINI_CODE_EVALUATION_RESULT', requestId: request.requestId,
    result: { ok: true, points: maxPoints, maxPoints, status: 'korrekt', strengths: ['Objekt erkannt'],
      missing: [], feedback: 'Test-Rückmeldung', ...extra } };
}

test('Vorhandene IDE-Abfrage, Vorprüfung, Ergebnisanzeige und Abschlussquiz bleiben erhalten', () => {
  for (const name of ['getCurrentProgramCode', 'hasUnqualifiedRobotMethodCall', 'restoreCodeButton']) {
    assert.equal(existingFunction(transformed, name), existingFunction(source, name));
  }
  const marker = '    function showEvaluation(';
  assert.equal(transformed.slice(transformed.indexOf(marker)), source.slice(source.indexOf(marker)));
  assert.ok(!transformed.includes('script.google.com'));
  assert.ok(!transformed.includes('scheduleCodeResultPoll'));
  assert.doesNotThrow(() => new vm.Script(fullScript));
});

test('Code aus Hauptprogramm.java geht als JSON-Body an Scaleway; a/b haben eigene Punktegrenzen', async () => {
  const calls = [];
  const h = harness(async (url, options) => {
    calls.push({ url, options });
    return { ok: true, json: async () => responseFor(options) };
  });
  for (const taskId of ['10-3a', '10-3b']) {
    h.state.code = 'Robot dudu = new Robot(1, 1, 12, 12);\ndudu.hinlegen(4);\n// ' + 'ä'.repeat(11000);
    await h.context.submitCode(taskId);
    const call = calls.at(-1);
    const request = JSON.parse(call.options.body);
    assert.equal(request.code, h.state.code);
    assert.equal(request.taskId, taskId);
    assert.equal(request.requestType, 'code');
    assert.equal(request.answer, undefined);
    assert.equal(new URL(call.url).search, '');
    assert.equal(new URL(call.url).hostname, 'unterrichtkiichezbn4-ki-auswertung.functions.fnc.fr-par.scw.cloud');
    assert.equal(call.options.method, 'POST');
    assert.equal(call.options.credentials, 'omit');
    assert.equal(h.elements['button-' + taskId].disabled, false);
    const maxPoints = taskId === '10-3a' ? 3 : 6;
    assert.equal(h.elements['result-' + taskId].children[0].textContent, `${maxPoints} von ${maxPoints} Punkten – korrekt`);
  }
  assert.equal(h.elements['button-10-3a'].textContent, 'Meinen Code für a prüfen');
  assert.equal(h.timers.size, 0);
});

test('Fehlende IDE und bestehende Code-Vorprüfungen verhindern Modellanfragen', async () => {
  let calls = 0;
  const h = harness(() => { calls++; });
  for (const code of ['kurz', 'Robot dudu; ' + 'x'.repeat(12000),
    'Robot dudu = new Robot(1,1,12,12); hinlegen(4);',
    'println("Kein Roboter im Programm.");']) {
    h.state.code = code;
    await h.context.submitCode('10-3a');
    assert.equal(h.elements['result-10-3a'].className, 'result error');
    assert.equal(h.elements['button-10-3a'].disabled, false);
  }
  h.state.ready = false;
  await h.context.submitCode('10-3a');
  assert.match(h.elements['result-10-3a'].textContent, /noch nicht verfügbar/);
  assert.equal(calls, 0);
});

test('Doppelklick wird abgefangen; Fehler geben den Prüfbutton für einen erneuten Versuch frei', async () => {
  let finish;
  let calls = 0;
  const h = harness((url, options) => {
    calls++;
    return new Promise(resolve => { finish = () => resolve({ ok: false,
      json: async () => responseFor(options, { ok: false, message: 'Bitte warte eine Minute.' }) }); });
  });
  const running = h.context.submitCode('10-3a');
  await Promise.resolve();
  await h.context.submitCode('10-3a');
  assert.equal(calls, 1);
  finish();
  await running;
  assert.equal(h.elements['result-10-3a'].textContent, 'Bitte warte eine Minute.');
  assert.equal(h.elements['button-10-3a'].disabled, false);
  const retry = h.context.submitCode('10-3a');
  await Promise.resolve();
  finish();
  await retry;
  assert.equal(calls, 2);
});

test('Falsche requestId und Punktegrenzen werden nicht als gültige Codebewertung angezeigt', async () => {
  for (const change of [payload => ({ ...payload, requestId: 'fremde_anfrage' }),
    payload => ({ ...payload, result: { ...payload.result, maxPoints: 6 } })]) {
    const h = harness(async (url, options) => ({ ok: true, json: async () => change(responseFor(options)) }));
    await h.context.submitCode('10-3a');
    assert.equal(h.elements['result-10-3a'].className, 'result error');
    assert.equal(h.elements['button-10-3a'].disabled, false);
  }
});

test('Timeout beendet die Codeanfrage und stellt den ursprünglichen Button wieder her', async () => {
  const h = harness((url, options) => new Promise((resolve, reject) =>
    options.signal.addEventListener('abort', () => reject(new Error('abgebrochen')))));
  const running = h.context.submitCode('10-3a');
  await Promise.resolve();
  [...h.timers.values()][0]();
  await running;
  assert.match(h.elements['result-10-3a'].textContent, /zu lange gedauert/);
  assert.equal(h.elements['button-10-3a'].textContent, 'Meinen Code für a prüfen');
  assert.equal(h.elements['button-10-3a'].disabled, false);
  assert.equal(h.timers.size, 0);
});
