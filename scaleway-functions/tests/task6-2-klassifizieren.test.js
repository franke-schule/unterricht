'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../evaluation-core');
const { createHandler } = require('../handler');
const { evaluationSchema, validateEvaluation } = require('../scaleway-client');
const taskId = '11-6-klassifizieren';
const task = core.TASKS[taskId];
const ids = task.feedbackCriteria.map(criterion => criterion.id);
const latest = 'Die Methode berechnet die gewichtete Summe und wendet die Step-Funktion an, um die Ausgabe 0 oder 1 zu erzeugen, die Gewichte werden nicht von der Methode verändert.\nWenn die Summe größer als theta ist, wird 1 ausgegeben';
const products = 'x1 wird mit w1 multipliziert, x2 mit w2.';
const addition = 'Die Produkte werden addiert.';
const zero = 'Bei Gleichheit oder kleinerer Summe wird 0 ausgegeben.';
const greater = 'Wenn die Summe größer als theta ist, wird 1 ausgegeben';
const weights = 'die Gewichte werden nicht von der Methode verändert';
const item = (status, ...evidence) => ({ status, evidence });
const assessment = overrides => ({ criteria: Object.fromEntries(ids.map(id => [id, overrides[id] || item('missing')])) });
const verdict = (model, answer) => {
  validateEvaluation(model, task, answer);
  return core.formatFinalEvaluation_(core.applyRuleBasedMinimum_(model, task, answer), task);
};
async function request(answer, model, inspect = () => {}) {
  let calls = 0;
  const handle = createHandler({ rateLimit: Infinity, env: {
    AI_API_KEY: 'mock-only', AI_PROJECT_ID: '11111111-1111-1111-1111-111111111111',
    AI_MODEL: 'gpt-oss-120b', AI_EVALUATION_ENABLED: 'true'
  }, fetchImpl: async (url, options) => {
    calls++;
    inspect(JSON.parse(options.body));
    return { ok: true, status: 200, async text() {
      return JSON.stringify({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(model) } }] });
    } };
  } });
  const response = await handle({ httpMethod: 'POST', path: '/', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requestId: 'criterion_description_test', taskId, answer }) });
  assert.equal(calls, 1);
  return response;
}

test('6.2: Vier Kriterien mit Textbelegen ersetzen freie Modellpunkte, Browservertrag bleibt gleich', async () => {
  assert.equal(task.maxPoints, 4);
  assert.equal(task.rubric.length, 4);
  const schema = evaluationSchema(task);
  assert.deepEqual(schema.required, ['criteria']);
  assert.deepEqual(schema.properties.criteria.required, ids);
  assert.equal(schema.additionalProperties, false);
  const response = await request(latest, assessment({ threshold: item('missing_zero_case', greater) }), payload => {
    assert.equal(payload.reasoning_effort, 'low');
    assert.equal(payload.max_tokens, 4096);
    assert.deepEqual(payload.response_format.json_schema.schema, schema);
    const prompt = payload.messages[1].content;
    assert.ok(prompt.endsWith(latest));
    assert.match(prompt, /Kriterienweise Belegprüfung statt Gesamturteil/);
    assert.match(prompt, /wörtlichen, zusammenhängenden Zitat/);
    assert.match(prompt, /Gib keine Gesamtpunktzahl/);
    for (const criterion of task.rubric) assert.ok(prompt.includes(criterion));
  });
  assert.equal(response.statusCode, 200);
  const result = JSON.parse(response.body).result;
  assert.equal(result.points, 1); // Nur unveränderte Gewichte sind vollständig erklärt.
  assert.equal(result.maxPoints, 4);
  assert.equal(result.ok, true);
  assert.deepEqual(result.strengths, []);
  assert.deepEqual(result.missing, ['Schritt 1 von 4 – Eingaben gewichten: Erkläre, mit welchem Gewicht jeder Eingabewert multipliziert wird.']);
  assert.equal(result.feedback, '');
  assert.doesNotMatch(response.body, /"criteria"|"evidence"/);
});

test('6.2: Nach jedem tatsächlich ergänzten Schritt erscheint nur die nächste offene Verbesserung', async () => {
  const stages = [
    [latest, assessment({ threshold: item('missing_zero_case', greater) }), 1, 1],
    [latest + '. ' + products, assessment({ multiplication: item('correct', products), threshold: item('missing_zero_case', greater) }), 2, 2],
    [latest + '. ' + products + ' ' + addition, assessment({ multiplication: item('correct', products), addition: item('correct', addition), threshold: item('missing_zero_case', greater) }), 3, 3],
    [latest + '. ' + products + ' ' + addition + ' ' + zero, assessment({ multiplication: item('correct', products), addition: item('correct', addition), threshold: item('correct', greater, zero) }), 4, null]
  ];
  for (const [answer, model, points, step] of stages) {
    const response = await request(answer, model);
    assert.equal(response.statusCode, 200);
    const result = JSON.parse(response.body).result;
    assert.equal(result.points, points);
    if (step) {
      assert.equal(result.missing.length, 1);
      assert.ok(result.missing[0].startsWith(`Schritt ${step} von 4`));
      assert.doesNotMatch(result.missing[0], /ob punktKlassifizieren die Gewichte verändert/);
    } else {
      assert.deepEqual(result.missing, []);
      assert.equal(result.feedback, 'Sehr gut, alles richtig');
    }
  }
});

test('6.2: Gewichte-Belege zählen unabhängig vom übrigen Wortlaut und dessen Reihenfolge', () => {
  const variants = ['Die Gewichte werden nicht angepasst.', 'Die Gewichte bleiben dabei unverändert.',
    'Die Gewichte werden nicht von der Methode verändert.', 'Die Gewichte werden von der Methode nicht verändert.',
    'punktKlassifizieren verändert die Gewichte nicht.', 'Die Methode ändert die Gewichte nicht.'];
  for (const phrase of variants) for (const answer of [phrase + ' ' + products, products + ' ' + phrase, phrase.toUpperCase()]) {
    const result = verdict(assessment({}), answer);
    assert.equal(result.points, 1, answer);
    assert.ok(result.missing[0].startsWith('Schritt 1 von 4'));
  }
  const model = assessment({ unchanged_weights: item('wrong_change', weights) });
  assert.equal(verdict(model, latest).points, 1);
  assert.equal(model.criteria.unchanged_weights.status, 'wrong_change'); // Eingabeobjekt unverändert.
});

test('6.2: Reihenfolge der Kriterien, passende Fehlerhinweise und sofortige Anrechnung späterer Aspekte', () => {
  const model = assessment({ addition: item('correct', addition), threshold: item('correct', greater, zero) });
  model.criteria = Object.fromEntries(Object.entries(model.criteria).reverse());
  const result = verdict(model, [addition, greater, zero].join(' '));
  assert.equal(result.points, 2);
  assert.ok(result.missing[0].startsWith('Schritt 1 von 4'));
  const falsePair = 'x1 wird mit w2 multipliziert.';
  assert.match(verdict(assessment({ multiplication: item('wrong_assignment', falsePair) }), falsePair).missing[0], /Zuordnung/);
  const firstThree = { multiplication: item('correct', products), addition: item('correct', addition), threshold: item('correct', greater, zero) };
  const missingWeights = verdict(assessment(firstThree), [products, addition, greater, zero].join(' '));
  assert.equal(missingWeights.points, 3);
  assert.ok(missingWeights.missing[0].startsWith('Schritt 4 von 4'));
  const missingZero = verdict(assessment({ ...firstThree, threshold: item('missing_zero_case', greater) }), [products, addition, greater, weights].join('. '));
  assert.equal(missingZero.points, 3);
  assert.match(missingZero.missing[0], /kleiner oder gleich theta/);
});

test('6.2: Widersprüche, eingeschränkte Verneinungen, Zitate und Zweifel verhindern lokale Gewichte-Gutschriften', () => {
  const variants = ['Die Gewichte werden nicht immer verändert.', 'Die Gewichte werden nicht nicht verändert.',
    '"Die Gewichte werden nicht verändert."', 'Die Gewichte werden nicht verändert?',
    'Die Gewichte werden nicht verändert. Die Methode passt die Gewichte an.',
    'Die Gewichte werden nicht verändert. w_1 = w_1 + 1.',
    'Die Gewichte werden nicht verändert. Das stimmt nicht.',
    'Die Gewichte werden nicht verändert. Sie werden bei jedem Aufruf erhöht.'];
  for (const answer of variants) assert.equal(verdict(assessment({}), answer).points, 0, answer);
});

test('6.2: Erfundenes Belegzitat, fehlende Kriterien und alte freie Bewertungen sind technische Fehler', async () => {
  const invalid = [assessment({ multiplication: item('correct', 'Erfundener Wortlaut.') }),
    assessment({ multiplication: item('correct') }), assessment({ multiplication: item('wrong_assignment') }),
    assessment({ multiplication: item('correct', '') }), assessment({ multiplication: item('correct', null) }),
    assessment({ multiplication: item('wrong_equality', products) }), { criteria: {} }, { criteria: [] },
    { ...assessment({}), points: 4 },
    { points: 3, maxPoints: 4, status: 'teilweise korrekt', strengths: [], missing: ['Ergänze, ob punktKlassifizieren die Gewichte verändert.'], feedback: 'Alter Hinweis.' }];
  for (const model of invalid) {
    const response = await request(latest, model);
    assert.equal(response.statusCode, 502, JSON.stringify(model));
    const result = JSON.parse(response.body).result;
    assert.equal(result.ok, false);
    assert.equal(result.points, undefined);
    assert.doesNotMatch(response.body, /Erfundener Wortlaut|ob punktKlassifizieren/);
  }
});

test('6.2: Belege dürfen aus mehreren Sätzen stammen, aber weder erfunden noch paraphrasiert werden', () => {
  const model = assessment({ multiplication: item('correct', products), addition: item('correct', addition),
    threshold: item('correct', greater, zero), unchanged_weights: item('correct', weights) });
  const result = verdict(model, [weights, addition, zero, products, greater].join('\n\n'));
  assert.equal(result.points, 4);
  assert.deepEqual(result.missing, []);
  assert.throws(() => validateEvaluation(model, task, 'Die Methode berechnet eine Summe.'));
  assert.throws(() => validateEvaluation(assessment({ multiplication: item('correct', 'x1 wird mit w1 und x2 mit w2 multipliziert.') }), task, products));
});
