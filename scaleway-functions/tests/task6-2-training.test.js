'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const core = require('../evaluation-core');
const { createHandler } = require('../handler');
const { cases } = require('./fixtures/task6-2-training-cases');

const html = fs.readFileSync(path.resolve(__dirname,
  '../../faecher/informatik/klasse-11/1-Kuenstliche-Intelligenz/aufgabe6.html'), 'utf8');
const hardStart = [...html.matchAll(/title="Perzeptron\.java">([\s\S]*?)<\/script>/g)][1][1].trim();
function classCode(body) {
  return hardStart.replace(/public void trainieren\(Datenpunkt punkt\) \{\s*\}/,
    () => 'public void trainieren(Datenpunkt punkt) {\n' + body + '\n}');
}

test('6.2: Jede verbleibende Codeaufgabe hat eine getrennte Rubrik und den passenden Seitenbutton', () => {
  for (const [id, points] of [['11-6-einfach-ausgabe', 3], ['11-6-einfach-anpassung', 5], ['11-6-schwer-trainieren', 6]]) {
    const task = core.TASKS[id];
    assert.equal(task.maxPoints, points);
    assert.equal(task.expectedAspects.length, points);
    assert.equal(task.rubric.length, points);
    assert.match(task.title, /Aufgabe 6\.2/);
    assert.ok(html.includes('data-code-task="' + id + '"'));
    const prompt = core.buildPrompt_(task, classCode(''));
    for (const rule of [...task.codeAnalysisRules, ...task.rubric]) assert.ok(prompt.includes(rule), id);
  }
});

test('6.2: Vergleichsfälle durchlaufen vollständigen Prompt und Ergebnisanzeigevertrag (Mock, keine KI-Livebewertung)', async () => {
  for (const fixture of cases) {
    const task = core.TASKS[fixture.taskId];
    const code = classCode(fixture.body);
    let calls = 0;
    const handle = createHandler({ rateLimit: Infinity, env: {
      AI_API_KEY: 'mock-only', AI_PROJECT_ID: '11111111-1111-1111-1111-111111111111',
      AI_MODEL: 'mock-model', AI_EVALUATION_ENABLED: 'true'
    }, fetchImpl: async (url, options) => {
      calls++;
      const prompt = JSON.parse(options.body).messages[1].content;
      assert.ok(prompt.includes(fixture.ruleFragment), fixture.name);
      assert.ok(prompt.endsWith(code + '\nENDE SCHUELERCODE'), fixture.name);
      return { ok: true, status: 200, async text() {
        return JSON.stringify({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify({
          points: fixture.expectedPoints, maxPoints: task.maxPoints,
          status: fixture.expectedPoints === task.maxPoints ? 'korrekt' : 'teilweise korrekt',
          strengths: [], missing: fixture.missing,
          feedback: fixture.missing.join(' ') || 'Sehr gut, alles richtig'
        }) } }] });
      } };
    } });
    const response = await handle({ httpMethod: 'POST', path: '/',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId: 'training_case_' + cases.indexOf(fixture),
        taskId: fixture.taskId, requestType: 'code', code }) });
    assert.equal(response.statusCode, 200, fixture.name);
    assert.equal(calls, 1, fixture.name);
    const result = JSON.parse(response.body).result;
    assert.equal(result.points, fixture.expectedPoints, fixture.name);
    assert.deepEqual(result.missing, fixture.missing.slice(0, task.maxFeedbackHints || 2), fixture.name);
    assert.deepEqual(result.strengths, [], fixture.name);
    if (!fixture.missing.length) assert.equal(result.feedback, 'Sehr gut, alles richtig', fixture.name);
  }
});

// Unabhängige Rechenkontrolle ausschließlich der fest im Test hinterlegten Beispiele.
// Ihre Anweisungen nutzen dieselben Rechen-/Vergleichsoperatoren wie JavaScript.
// Nur int/double-Deklarationen werden ersetzt; keine Casts, kein Schülercode,
// kein Java-Compiler und kein Ersatz für eine semantische KI-Liveprüfung.
function runFixture(body, initial, x1, x2, label) {
  const state = { ...initial, berechnete_ausgabe: 0,
    punkt: { gibEingabewertX1: () => x1, gibEingabewertX2: () => x2, gibLabel: () => label } };
  state.punktKlassifizieren = (a, b) => state.w_1 * a + state.w_2 * b > state.theta ? 1 : 0;
  const script = body.replace(/\b(?:int|double)\s+/g, 'let ');
  vm.runInNewContext('with (state) { (function () {\n' + script +
    '\nstate.observedOutput = berechnete_ausgabe; }).call(state); }', { state }, { timeout: 1000 });
  return state;
}
function near(a, b) { return Math.abs(a - b) < 1e-10; }
const inputs = [[-2.5, 0.75], [0, -1.5], [1.25, 0], [1.25, 0.75]];

test('6.2: Ausgabe-Sollpunkte entsprechen drei verschiedenen Fällen, auch bei implizitem else', () => {
  for (const fixture of cases.filter(item => item.taskId === '11-6-einfach-ausgabe')) {
    // Schritt 2 ist hier laut Auftrag nicht Gegenstand der Prüfung.
    const isolatedOutput = fixture.body.replace(/double gewichtete_Summe\s*=[^;]*;/, '');
    let passed = 0;
    for (const value of [0.25, 0.5, 0.75]) {
      const result = runFixture(isolatedOutput,
        { w_1: 1, w_2: 0, theta: 0.5, lernrate: 0.2, gewichtete_Summe: value }, value, -2, 1);
      if (result.observedOutput === (value > 0.5 ? 1 : 0)) passed++;
    }
    assert.equal(passed, fixture.expectedPoints, fixture.name);
  }
});

test('6.2: Anpassungs-Sollpunkte berücksichtigen negative Eingaben, Dezimalwerte und alle Fehlerzeichen', () => {
  for (const fixture of cases.filter(item => item.taskId === '11-6-einfach-anpassung')) {
    // Die Fehlerberechnung ist ein vorgelagerter Schritt: gegebenes delta einsetzen.
    const isolatedUpdates = fixture.body.slice(fixture.body.indexOf(';', fixture.body.indexOf('int delta')) + 1);
    const passed = [true, true, true, true, true];
    for (const [x1, x2] of inputs) for (const lernrate of [0.2, 0.7]) for (const delta of [1, -1, 0]) {
      const initial = { w_1: 0.75, w_2: -0.5, theta: 0.6, lernrate, delta };
      const actual = runFixture(isolatedUpdates, initial, x1, x2, 0);
      const weights = near(actual.w_1, initial.w_1 + delta * lernrate * x1) &&
        near(actual.w_2, initial.w_2 + delta * lernrate * x2);
      const threshold = near(actual.theta, initial.theta - delta * lernrate);
      if (delta === 0) passed[4] &&= weights && threshold;
      else { const offset = delta === 1 ? 0 : 2; passed[offset] &&= weights; passed[offset + 1] &&= threshold; }
    }
    assert.equal(passed.filter(Boolean).length, fixture.expectedPoints, fixture.name);
  }
});

test('6.2: Vollständige schwere Varianten rechnen gleichwertig; absichtlich fehlerhafte Varianten weichen ab', () => {
  for (const fixture of cases.filter(item => item.taskId === '11-6-schwer-trainieren')) {
    let allCorrect = true;
    for (const [x1, x2] of inputs) for (const lernrate of [0.2, 0.7]) {
      const sum = 0.75 * x1 - 0.5 * x2;
      for (const theta of [sum - 0.25, sum, sum + 0.25]) for (const label of [0, 1]) {
        const initial = { w_1: 0.75, w_2: -0.5, theta, lernrate };
        const delta = label - (sum > theta ? 1 : 0);
        const actual = runFixture(fixture.body, initial, x1, x2, label);
        allCorrect &&= near(actual.w_1, initial.w_1 + delta * lernrate * x1) &&
          near(actual.w_2, initial.w_2 + delta * lernrate * x2) && near(actual.theta, theta - delta * lernrate);
      }
    }
    assert.equal(allCorrect, fixture.expectedPoints === 6, fixture.name);
  }
});
