'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const core = require('../evaluation-core');
const { createHandler } = require('../handler');

const taskId = '11-6-einfach-ausgabe';
const task = core.TASKS[taskId];
const html = fs.readFileSync(path.resolve(__dirname,
  '../../faecher/informatik/klasse-11/1-Kuenstliche-Intelligenz/aufgabe6.html'), 'utf8');
const startCode = html.match(/title="Perzeptron\.java">([\s\S]*?)<\/script>/)[1];
const sectionStart = startCode.indexOf('// Schritt 3: Ausgabe');
const sectionEnd = startCode.indexOf('int delta =', sectionStart);
const output = `int berechnete_ausgabe = 0;
if (gewichtete_Summe > theta) {
  berechnete_ausgabe = 1;
} else {
  berechnete_ausgabe = 0;
}`;
const codeWithOutput = section => startCode.slice(0, sectionStart) + section + '\n' + startCode.slice(sectionEnd);
const reportedCode = codeWithOutput(output).replace('double gewichtete_Summe = 0;',
  'double gewichtete_Summe = punkt.gibEingabewertX1()*w_1+punkt.gibEingabewertX2()*w_2;');
const falseHint = 'Ersetze in trainieren beim Schwellenvergleich >= durch >, damit bei Gleichheit die Ausgabe 0 bleibt.';
const wrongEvaluation = {
  points: 2, maxPoints: 3, status: 'teilweise korrekt', strengths: [],
  missing: [falseHint], feedback: falseHint
};

test('6.2 Schritt 3: Gemeldeter Code mit > wird trotz KI-Fehlbewertung auf 3/3 korrigiert', () => {
  const result = core.applyRuleBasedMinimum_(wrongEvaluation, task, reportedCode);
  assert.equal(result.points, 3);
  assert.equal(result.status, 'korrekt');
  assert.deepEqual(result.missing, []);
  assert.equal(result.feedback, 'Sehr gut, alles richtig');
  assert.ok(core.buildPrompt_(task, reportedCode).includes('behaupte nicht, dort stehe >='));
});

test('6.2 Schritt 3: Offene Summe, Formatierung und implizites else verhindern keine Erfolgserkennung', () => {
  const variants = [output, output.replace('gewichtete_Summe > theta', 'theta < gewichtete_Summe'),
    'int berechnete_ausgabe=0;if(gewichtete_Summe>theta){berechnete_ausgabe=1;}',
    'int berechnete_ausgabe=0;if(gewichtete_Summe>theta)berechnete_ausgabe=1;',
    output.replace('> theta', '> /* Vergleich */\n theta').replace('else', '// Sonst\nelse')];
  for (const section of variants) {
    assert.equal(core.applyRuleBasedMinimum_(wrongEvaluation, task, codeWithOutput(section)).points, 3, section);
  }
});

test('6.2 Schritt 3: Falsche, verdeckte, unerreichbare oder überschriebene Ausgaben bleiben bei der KI-Bewertung', () => {
  const variants = [
    output.replace('> theta', '>= theta'), output.replace('> theta', '< theta'),
    output.replace('= 1;', '= 0;'), output.replace('else {\n  berechnete_ausgabe = 0;', 'else {\n  berechnete_ausgabe = 1;'),
    output.replace('= 1;', '= 1'),
    '// ' + output.replaceAll('\n', '\n// '), '/* ' + output + ' */',
    'String beispiel = "' + output.replaceAll('\n', ' ') + '";',
    'if (false) { ' + output + ' }', 'return; ' + output,
    output + '\nberechnete_ausgabe = 0;',
    output + '\nelse { berechnete_ausgabe = 1; }',
    'int berechnete_ausgabe = 0; if (gewichtete_Summe > theta) {} else {}',
  ];
  const examples = variants.map(codeWithOutput);
  examples.push(reportedCode.replace('void trainieren(', 'void andereMethode('));
  examples.push(reportedCode.replace('// Schritt 4: Parameter anpassen', 'berechnete_ausgabe = 0;'));
  examples.push(startCode); // punktKlassifizieren enthält bereits den korrekten Vergleich.
  for (const code of examples) {
    assert.strictEqual(core.applyRuleBasedMinimum_(wrongEvaluation, task, code), wrongEvaluation, code);
  }
});

test('6.2 Schritt 3: Server entfernt den tatsächlich gemeldeten falschen >=-Hinweis (Mock)', async () => {
  let calls = 0;
  const handle = createHandler({ rateLimit: Infinity, env: {
    AI_API_KEY: 'mock-only', AI_PROJECT_ID: '11111111-1111-1111-1111-111111111111',
    AI_MODEL: 'mock-model', AI_EVALUATION_ENABLED: 'true'
  }, fetchImpl: async (url, options) => {
    calls++;
    assert.ok(JSON.parse(options.body).messages[1].content.includes(reportedCode.trim()));
    return { ok: true, status: 200, async text() {
      return JSON.stringify({ choices: [{ finish_reason: 'stop', message: {
        content: JSON.stringify(wrongEvaluation)
      } }] });
    } };
  } });
  const response = await handle({ httpMethod: 'POST', path: '/',
    headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
      requestId: 'task6_2_output_regression', taskId, requestType: 'code', code: reportedCode
    }) });
  assert.equal(response.statusCode, 200);
  assert.equal(calls, 1);
  const result = JSON.parse(response.body).result;
  assert.equal(result.points, 3);
  assert.equal(result.maxPoints, 3);
  assert.deepEqual(result.missing, []);
  assert.equal(result.feedback, 'Sehr gut, alles richtig');
});
