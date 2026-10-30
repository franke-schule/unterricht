'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const core = require('../evaluation-core');
const { createHandler } = require('../handler');

const taskId = '11-6-einfach-anpassung';
const task = core.TASKS[taskId];
const html = fs.readFileSync(path.resolve(__dirname,
  '../../faecher/informatik/klasse-11/1-Kuenstliche-Intelligenz/aufgabe6.html'), 'utf8');
const startCode = html.match(/title="Perzeptron\.java">([\s\S]*?)<\/script>/)[1];
const begin = startCode.indexOf('// Schritt 4: Parameter anpassen');
const end = startCode.indexOf('System.out.println(', begin);
const general = `w_1 = w_1 + delta * lernrate * punkt.gibEingabewertX1();
w_2 = w_2 + delta * lernrate * punkt.gibEingabewertX2();
theta = theta - delta * lernrate;`;
const reportedUpdates = `if (delta == 1) {
  ${general}
} else if (delta == -1) {
  ${general}
}`;
const withUpdates = updates => startCode.slice(0, begin) + updates + '\n' + startCode.slice(end);
const reportedCode = withUpdates(reportedUpdates);
const falseHint = 'Bei delta = -1 wird theta um die Lernrate vermindert statt erhöht.';
const wrongEvaluation = {
  points: 4, maxPoints: 5, status: 'teilweise korrekt', strengths: [],
  missing: [falseHint], feedback: falseHint
};

test('6.2 Schritt 4: Identische Delta-Formeln in beiden Zweigen erhalten trotz KI-Fehler 5/5', () => {
  const result = core.applyRuleBasedMinimum_(wrongEvaluation, task, reportedCode);
  assert.equal(result.points, 5);
  assert.equal(result.maxPoints, 5);
  assert.equal(result.status, 'korrekt');
  assert.deepEqual(result.missing, []);
  assert.equal(result.feedback, 'Sehr gut, alles richtig');
  assert.ok(core.buildPrompt_(task, reportedCode).includes('theta alt + lernrate'));
});

test('6.2 Schritt 4: Allgemeine Formel, explizite Vorzeichen und unabhängige Reihenfolgen sind gleichwertig', () => {
  const variants = [general,
    'w_1 += delta * lernrate * punkt.gibEingabewertX1(); w_2 += delta * lernrate * punkt.gibEingabewertX2(); theta -= delta * lernrate;',
    reportedUpdates.replaceAll('delta * lernrate * punkt.gibEingabewertX1()', 'punkt.gibEingabewertX1() * delta * lernrate'),
    reportedUpdates.replaceAll('theta = theta - delta * lernrate;', 'this.theta -= this.lernrate * delta;'),
    `if (delta == 1) {
      theta -= lernrate; w_2 += punkt.gibEingabewertX2() * lernrate; w_1 += lernrate * punkt.gibEingabewertX1();
    } else if (delta == -1) {
      w_2 -= lernrate * punkt.gibEingabewertX2(); theta = theta + lernrate; w_1 = w_1 - lernrate * punkt.gibEingabewertX1();
    }`,
    reportedUpdates.replaceAll('*', '/* Faktor */ *\n').replaceAll('theta =', '// Schwelle\ntheta =')];
  for (const updates of variants) {
    assert.equal(core.applyRuleBasedMinimum_(wrongEvaluation, task, withUpdates(updates)).points, 5, updates);
  }
});

test('6.2 Schritt 4: Fehlerhafte Formeln und Scheinlösungen werden nicht auf volle Punkte angehoben', () => {
  const variants = [
    reportedUpdates.replaceAll('theta = theta - delta', 'theta = theta + delta'),
    reportedUpdates.replace('} else if (delta == -1) {\n  ' + general,
      '} else if (delta == -1) {\n  ' + general.replace('theta - delta', 'theta + delta')),
    reportedUpdates.replaceAll('w_2 = w_2 + delta * lernrate * punkt.gibEingabewertX2();', ''),
    reportedUpdates.replaceAll('gibEingabewertX2', 'gibEingabewertX1'),
    reportedUpdates.replaceAll('delta * lernrate *', 'delta *'),
    reportedUpdates.replaceAll('w_1 = w_1 +', 'w_1 = -w_1 -'),
    reportedUpdates.replaceAll('w_1 = w_1 +', 'double w_1 = w_1 +'),
    reportedUpdates.replaceAll('w_2 = w_2 + delta * lernrate * punkt.gibEingabewertX2();',
      'w_1 = w_1 + delta * lernrate * punkt.gibEingabewertX1();'),
    reportedUpdates.replace('else if (delta == -1)', 'else'),
    reportedUpdates.replace('else if (delta == -1)', 'else if (delta == 0)'),
    'if (false) { ' + reportedUpdates + ' }', 'return; ' + reportedUpdates,
    '/* ' + reportedUpdates + ' */', '// ' + reportedUpdates.replaceAll('\n', '\n// '),
    'String beispiel = """\n' + reportedUpdates + '\n""";',
    reportedUpdates + '\nw_1 = 0;', reportedUpdates + '\nelse { theta = 0; }',
    general.replace('theta = theta - delta * lernrate;', 'theta = theta - lernrate;'),
    reportedUpdates.replace('gibEingabewertX1();', 'gibEingabewertX1()'),
  ];
  const examples = variants.map(withUpdates);
  examples.push(reportedCode.replace('void trainieren(', 'void andereMethode('));
  examples.push(reportedCode.replace('// Schritt 2: gewichtete Summe', 'return;'));
  examples.push(reportedCode.replace('System.out.println("Parameterwerte:', 'w_2 = 0; System.out.println("Parameterwerte:'));
  examples.push(startCode);
  for (const code of examples) {
    assert.strictEqual(core.applyRuleBasedMinimum_(wrongEvaluation, task, code), wrongEvaluation, code);
  }
  assert.strictEqual(core.applyRuleBasedMinimum_(wrongEvaluation, core.TASKS['11-6-einfach-summe'], reportedCode), wrongEvaluation);
});

test('6.2 Schritt 4: Server korrigiert die konkrete falsche Theta-Rückmeldung (Mock)', async () => {
  let calls = 0;
  const handle = createHandler({ rateLimit: Infinity, env: {
    AI_API_KEY: 'mock-only', AI_PROJECT_ID: '11111111-1111-1111-1111-111111111111',
    AI_MODEL: 'mock-model', AI_EVALUATION_ENABLED: 'true'
  }, fetchImpl: async (url, options) => {
    calls++;
    assert.ok(JSON.parse(options.body).messages[1].content.includes(reportedCode.trim()));
    return { ok: true, status: 200, async text() {
      return JSON.stringify({ choices: [{ finish_reason: 'stop', message: {
        content: JSON.stringify({ criteria: Object.fromEntries(task.feedbackCriteria.map((criterion, index) =>
          [criterion.id, { status: index === 3 ? 'wrong_logic' : 'correct', evidence: ['theta = theta - delta * lernrate;'] }])) })
      } }] });
    } };
  } });
  const response = await handle({ httpMethod: 'POST', path: '/',
    headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
      requestId: 'task6_2_updates_regression', taskId, requestType: 'code', code: reportedCode
    }) });
  assert.equal(response.statusCode, 200);
  assert.equal(calls, 1);
  const result = JSON.parse(response.body).result;
  assert.equal(result.points, 5);
  assert.equal(result.maxPoints, 5);
  assert.deepEqual(result.missing, []);
  assert.equal(result.feedback, 'Sehr gut, alles richtig');
});
