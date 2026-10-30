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
const userStatement = 'double gewichtete_Summe = punkt.gibEingabewertX1()*w_1+punkt.gibEingabewertX2()*w_2;';
const userCode = startCode.replace('double gewichtete_Summe = 0;', userStatement);
const wrongEvaluation = {
  ok: true, points: 0, maxPoints: 3, status: 'noch nicht korrekt', strengths: [],
  missing: ['Die Eingaben werden nicht über die passenden Getter gelesen.',
    'Die Produkte werden nicht korrekt addiert.'], feedback: 'Die Produkte werden nicht korrekt addiert.'
};

test('6.2: Gemeldete Lösung erhält trotz falscher KI-Bewertung volle Punkte', () => {
  const result = core.applyRuleBasedMinimum_(wrongEvaluation, task, userCode);
  assert.equal(result.points, 3);
  assert.equal(result.status, 'korrekt');
  assert.equal(result.feedback, 'Sehr gut, alles richtig');
  assert.deepEqual(result.missing, []);
});

test('6.2: Faktoren und Summanden dürfen vertauscht und beliebig formatiert werden', () => {
  const first = ['w_1*punkt.gibEingabewertX1()', 'punkt.gibEingabewertX1()*w_1'];
  const second = ['w_2*punkt.gibEingabewertX2()', 'punkt.gibEingabewertX2()*w_2'];
  for (const a of first) for (const b of second) for (const expression of [`${a}+${b}`, `${b}+${a}`]) {
    for (const formatted of [expression, expression.replaceAll('*', ' /* Produkt */ *\n').replaceAll('+', '\n+ // Summe\n')]) {
      const code = startCode.replace('double gewichtete_Summe = 0;', `double gewichtete_Summe = ${formatted};`);
      assert.equal(core.applyRuleBasedMinimum_(wrongEvaluation, task, code).points, 3, formatted);
    }
  }
});

test('6.2: Kommentare, Literale, andere Methoden und falsche Rechnungen lösen keine Aufwertung aus', () => {
  const replacements = [
    'double gewichtete_Summe = 0;',
    '// ' + userStatement + '\ndouble gewichtete_Summe = 0;',
    '/* ' + userStatement + ' */ double gewichtete_Summe = 0;',
    'String beispiel = "' + userStatement + '"; double gewichtete_Summe = 0;',
    'String beispiel = """\npublic void trainieren(Datenpunkt punkt) { ' + userStatement + ' }\n""";',
    userStatement.replace('X2()', 'X1()'),
    userStatement.replace('X1()*w_1', 'X1()*w_2'),
    userStatement.replace('+', '-'),
    userStatement.replace('+', '*'),
    userStatement.replace('double', 'int'),
    userStatement.replace('= punkt.', '= (int) punkt.'),
    userStatement.replace(';', ''),
    userStatement.replace('gibEingabewertX1()', 'gibEingabewertX1'),
    'if (false) { ' + userStatement + ' }',
    'return; ' + userStatement,
    'double gewichtete_Summe = 0; ' + userStatement,
  ];
  const examples = replacements.map(statement => startCode.replace('double gewichtete_Summe = 0;', statement));
  examples.push(userCode.replace('void trainieren(', 'void andereMethode('));
  examples.push('// public void trainieren(Datenpunkt punkt) { ' + userStatement + ' }\n' + startCode);
  examples.push('/* public void trainieren(Datenpunkt punkt) { ' + userStatement + ' } */\n' + startCode);
  for (const code of examples) {
    assert.strictEqual(core.applyRuleBasedMinimum_(wrongEvaluation, task, code), wrongEvaluation, code);
  }
  assert.strictEqual(core.applyRuleBasedMinimum_(wrongEvaluation, core.TASKS['11-6-einfach-ausgabe'], userCode), wrongEvaluation);
});

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

test('6.2: Server korrigiert die gemeldete KI-Fehlbewertung im Antwortpfad (Mock, keine KI-Livebewertung)', async () => {
  let calls = 0;
  const handle = createHandler({ rateLimit: Infinity, env: {
    AI_API_KEY: 'mock-only', AI_PROJECT_ID: '11111111-1111-1111-1111-111111111111',
    AI_MODEL: 'mock-model', AI_EVALUATION_ENABLED: 'true'
  }, fetchImpl: async (url, options) => {
    calls++;
    const payload = JSON.parse(options.body);
    const prompt = payload.messages[1].content;
    assert.ok(prompt.includes('int berechnete_ausgabe = 0; ist korrekt'));
    assert.ok(prompt.includes(userCode.trim()));
    return { ok: true, status: 200, async text() {
      return JSON.stringify({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify({
        criteria: Object.fromEntries(task.feedbackCriteria.map(criterion => [criterion.id, { status: 'missing', evidence: [] }]))
      }) } }] });
    } };
  } });
  const response = await handle({ httpMethod: 'POST', path: '/',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requestId: 'task6_2_summe_regression', taskId, requestType: 'code', code: userCode }) });
  assert.equal(response.statusCode, 200);
  assert.equal(calls, 1);
  const result = JSON.parse(response.body).result;
  assert.equal(result.points, 3);
  assert.equal(result.maxPoints, 3);
  assert.deepEqual(result.missing, []);
  assert.equal(result.feedback, 'Sehr gut, alles richtig');
});
