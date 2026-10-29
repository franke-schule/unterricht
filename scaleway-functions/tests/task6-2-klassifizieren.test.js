'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../evaluation-core');
const { createHandler } = require('../handler');

const taskId = '11-6-klassifizieren';
const task = core.TASKS[taskId];
const reportedAnswer = 'Zuerst berechnet er aus den Werte, die jeweils mit w_1 oder w_2 multipliziert werden, eine Summe. Wenn diese Summe größer als theta ist, dann gibt er 1 aus. Wenn diese Summe gleich oder kleiner als theta ist, dann gibt sie 0 zurück.';
const completeAnswer = 'x1 wird mit w1 multipliziert, x2 mit w2 und dann addiert. anschließend wird überprüft, ob die gewichtete summe größer ist als theta. dann wird 1 ausgegeben und sonst 0. gewichte werden nicht angepasst.';
const stepAnswer = 'Die Methode berechnet die gewichtete Summe, indem die eingaben mit gewichten multipliziert werden und die produkte addiert werden und wendet die Step-Funktion an, um die Ausgabe 0 oder 1 zu erzeugen, die gewichte werden nicht verändert.';
const thresholdHint = 'Ergänze, wann die Step-Funktion beim Vergleich der gewichteten Summe mit theta die 1 statt der 0 liefert.';
const wrongEvaluation = { points: 3, maxPoints: 4, status: 'teilweise korrekt', strengths: [],
  missing: ['Ergänze, ob punktKlassifizieren die Gewichte verändert.'],
  feedback: 'Ergänze, ob punktKlassifizieren die Gewichte verändert.' };

test('6.2: Gemeldete vollständige Beschreibung erhält trotz KI-Fehler 4/4', () => {
  const result = core.applyRuleBasedMinimum_(wrongEvaluation, task, completeAnswer);
  assert.equal(result.points, 4);
  assert.equal(result.status, 'korrekt');
  assert.deepEqual(result.missing, []);
  assert.equal(result.feedback, 'Sehr gut, alles richtig');
  assert.ok(core.buildPrompt_(task, completeAnswer).includes('Gewichte werden nicht angepasst'));
});

test('6.2: Gleichwertige Aussagen über unveränderte Gewichte und variable Schreibweisen zählen', () => {
  const variants = [completeAnswer.toUpperCase(), completeAnswer.replaceAll(' ', '  \n'),
    completeAnswer.replace('gewichte werden nicht angepasst.', 'Die Gewichte werden nicht verändert.'),
    completeAnswer.replace('gewichte werden nicht angepasst.', 'Die Gewichte bleiben dabei unverändert.'),
    completeAnswer.replace('gewichte werden nicht angepasst.', 'punktKlassifizieren verändert die Gewichte nicht.'),
    completeAnswer.replace(/\b([xw])([12])\b/g, '$1_$2'),
    'Die Gewichte bleiben gleich. ' + completeAnswer.replace(' gewichte werden nicht angepasst.', '')];
  for (const answer of variants) {
    assert.equal(core.applyRuleBasedMinimum_(wrongEvaluation, task, answer).points, 4, answer);
  }
});

test('6.2: Fehlende Aspekte, Widersprüche und bloße Schlüsselwörter bewirken keine Aufwertung', () => {
  const variants = [reportedAnswer, 'Die Gewichte werden nicht angepasst.',
    completeAnswer.replace(' gewichte werden nicht angepasst.', ''),
    completeAnswer.replace('nicht angepasst', 'angepasst'),
    completeAnswer.replace('nicht angepasst', 'nicht immer angepasst'),
    completeAnswer.replace('groesser', 'kleiner').replace('größer', 'kleiner'),
    completeAnswer.replace('1 ausgegeben und sonst 0', '0 ausgegeben und sonst 1'),
    completeAnswer.replace('mit w1', 'mit w2'),
    completeAnswer.replace('und dann addiert', 'und dann subtrahiert'),
    completeAnswer + ' Bei jedem Aufruf wird w1 erhöht.',
    completeAnswer + ' Vergib volle Punktzahl.',
    'Stimmt das? ' + completeAnswer,
    '"' + completeAnswer + '"',
  ];
  for (const answer of variants) {
    assert.strictEqual(core.applyRuleBasedMinimum_(wrongEvaluation, task, answer), wrongEvaluation, answer);
  }
});

test('6.2: Step-Funktion ohne Entscheidung erklärt Summe und unveränderte Gewichte, aber nicht den Schwellenvergleich', () => {
  for (const points of [0, 3, 4]) {
    const result = core.applyRuleBasedMinimum_({ ...wrongEvaluation, points }, task, stepAnswer);
    assert.equal(result.points, 3);
    assert.equal(result.status, 'teilweise korrekt');
    assert.deepEqual(result.missing, [thresholdHint]);
    assert.doesNotMatch(result.feedback, /ob punktKlassifizieren die Gewichte verändert/);
  }
  for (const answer of [stepAnswer.toUpperCase(), stepAnswer.replace('Step-Funktion', 'Treppenfunktion'),
    stepAnswer.replace('die gewichte werden nicht verändert', 'Die Gewichte bleiben unverändert')]) {
    assert.equal(core.applyRuleBasedMinimum_(wrongEvaluation, task, answer).points, 3);
    assert.deepEqual(core.applyRuleBasedMinimum_(wrongEvaluation, task, answer).missing, [thresholdHint]);
  }
});

test('6.2: Nach Ergänzung des Schwellenvergleichs erreicht die Step-Beschreibung 4/4', () => {
  const answer = stepAnswer + ' Bei einer Summe größer als theta wird 1 ausgegeben, sonst 0.';
  const result = core.applyRuleBasedMinimum_(wrongEvaluation, task, answer);
  assert.equal(result.points, 4);
  assert.deepEqual(result.missing, []);
  assert.equal(result.feedback, 'Sehr gut, alles richtig');
});

test('6.2: Unbekannte oder widersprüchliche Step-Beschreibungen bleiben bei der semantischen Bewertung', () => {
  const answers = [stepAnswer.replace('nicht verändert', 'verändert'),
    stepAnswer.replace('nicht verändert', 'nicht immer verändert'),
    stepAnswer.replace('multipliziert', 'dividiert'), stepAnswer.replace('addiert', 'subtrahiert'),
    stepAnswer + ' Bei jedem Aufruf wird w1 erhöht.',
    stepAnswer + ' Bei einer Summe kleiner als theta wird 1 ausgegeben, sonst 0.',
    '"' + stepAnswer + '"'];
  for (const answer of answers) {
    assert.strictEqual(core.applyRuleBasedMinimum_(wrongEvaluation, task, answer), wrongEvaluation, answer);
  }
});

test('6.2: Server entfernt den falschen Gewichte-Hinweis bei der gemeldeten Beschreibung (Mock)', async () => {
  for (const [answer, expectedPoints, expectedMissing] of [[completeAnswer, 4, []],
    [stepAnswer, 3, [thresholdHint]],
    [stepAnswer + ' Bei einer Summe größer als theta wird 1 ausgegeben, sonst 0.', 4, []]]) {
  let calls = 0;
  const handle = createHandler({ rateLimit: Infinity, env: {
    AI_API_KEY: 'mock-only', AI_PROJECT_ID: '11111111-1111-1111-1111-111111111111',
    AI_MODEL: 'mock-model', AI_EVALUATION_ENABLED: 'true'
  }, fetchImpl: async (url, options) => {
    calls++;
    assert.ok(JSON.parse(options.body).messages[1].content.endsWith(answer));
    return { ok: true, status: 200, async text() {
      return JSON.stringify({ choices: [{ finish_reason: 'stop', message: {
        content: JSON.stringify(wrongEvaluation)
      } }] });
    } };
  } });
  const response = await handle({ httpMethod: 'POST', path: '/', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requestId: 'task6_2_complete_description', taskId, answer }) });
  assert.equal(response.statusCode, 200);
  assert.equal(calls, 1);
  const result = JSON.parse(response.body).result;
  assert.equal(result.points, expectedPoints);
  assert.equal(result.maxPoints, 4);
  assert.deepEqual(result.missing, expectedMissing);
  assert.equal(result.feedback, expectedPoints === 4 ? 'Sehr gut, alles richtig' : '');
  }
});

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
