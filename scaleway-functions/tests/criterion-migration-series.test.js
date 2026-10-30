'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../evaluation-core');
const { evaluate, readConfig, validateEvaluation } = require('../scaleway-client');

const config = readConfig({ AI_API_KEY: 'mock', AI_PROJECT_ID: '11111111-1111-1111-1111-111111111111', AI_MODEL: 'mock-model' });
const migrated = Object.entries(core.TASKS).filter(([, task]) => task.feedbackCriteria && task.maxFeedbackHints === 1);

function modelResult(task, answer, correctIndex = -1, wrong = null) {
  return { criteria: Object.fromEntries(task.feedbackCriteria.map((criterion, index) => {
    if (index === correctIndex) return [criterion.id, { status: 'correct', evidence: [answer] }];
    if (wrong && wrong.index === index) return [criterion.id, { status: wrong.status, evidence: [answer] }];
    return [criterion.id, { status: 'missing', evidence: [] }];
  })) };
}

function resultWithStatuses(task, answer, statuses) {
  return { criteria: Object.fromEntries(task.feedbackCriteria.map((criterion, index) => [criterion.id,
    { status: statuses[index], evidence: statuses[index] === 'missing' ? [] : [answer] }])) };
}

function mockFetch(value) {
  return async (url, options) => {
    const request = JSON.parse(options.body);
    assert.deepEqual(request.response_format.json_schema.schema.required, ['criteria']);
    return { ok: true, text: async () => JSON.stringify({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(value) } }] }) };
  };
}

test('Migrationsserie (Modelmock): jedes Kriterium zählt unabhängig, auch nach späteren offenen Kriterien', async () => {
  for (const [id, task] of migrated) {
    const answer = task.responseType === 'code' ? 'int beleg = 7; // aktuelle Eingabe' : 'Die aktuelle Antwort enthält einen wörtlichen Beleg.';
    for (let index = 0; index < task.feedbackCriteria.length; index++) {
      const result = await evaluate(task, answer, config, mockFetch(modelResult(task, answer, index)));
      assert.equal(result.points, 1, `${id}: Aspekt ${index + 1} muss unabhängig zählen`);
      assert.equal(result.maxPoints, task.maxPoints);
      assert.equal(result.missing.length, task.maxPoints === 1 ? 0 : 1);
      if (task.maxPoints > 1) {
        const firstOpen = index === 0 ? 2 : 1;
        assert.match(result.missing[0], new RegExp(`^Schritt ${firstOpen} von ${task.maxPoints}`), `${id}: Aspekt ${index + 1}`);
      }
      if (task.maxPoints === 1) assert.equal(result.feedback, 'Sehr gut, alles richtig');
    }
  }
});

test('Migrationsserie (Modelmock): alle offenen Einzelkriterien liefern genau ihren nächsten Schritt', async () => {
  for (const [id, task] of migrated) {
    const answer = task.responseType === 'code' ? 'int beleg = 7; // aktuelle Eingabe' : 'Originalantwort mit einem zitierbaren Textbeleg.';
    const allCorrect = task.feedbackCriteria.map(() => 'correct');
    const perfect = await evaluate(task, answer, config, mockFetch(resultWithStatuses(task, answer, allCorrect)));
    assert.equal(perfect.points, task.maxPoints, `${id}: alle Kriterien korrekt`);
    assert.equal(perfect.feedback, 'Sehr gut, alles richtig', `${id}: keine offene Hilfe`);
    const allMissing = task.feedbackCriteria.map(() => 'missing');
    const empty = await evaluate(task, answer, config, mockFetch(resultWithStatuses(task, answer, allMissing)));
    assert.equal(empty.points, 0, `${id}: alle Kriterien fehlen`);
    assert.match(empty.missing[0], new RegExp(`^Schritt 1 von ${task.maxPoints}`), `${id}: erster Schritt`);
    for (let index = 0; index < task.feedbackCriteria.length; index++) {
      const statuses = allCorrect.slice();
      statuses[index] = 'missing';
      const result = await evaluate(task, answer, config, mockFetch(resultWithStatuses(task, answer, statuses)));
      assert.equal(result.points, task.maxPoints - 1, `${id}: offenes Kriterium ${index + 1}`);
      assert.equal(result.missing.length, 1);
      assert.equal(result.missing[0], `Schritt ${index + 1} von ${task.maxPoints} – ${task.feedbackCriteria[index].label}: ${task.feedbackCriteria[index].issues.missing}`);
    }
  }
});

test('Kriterienschema akzeptiert erlaubte falsche Statuswerte und verwirft erfundene Belege', () => {
  const tasksWithWrongStatus = migrated.filter(([, task]) => task.feedbackCriteria.some(criterion =>
    Object.keys(criterion.issues).some(status => status.startsWith('wrong_'))));
  assert.ok(tasksWithWrongStatus.length > 0);
  for (const [id, task] of tasksWithWrongStatus) {
    const criterion = task.feedbackCriteria.find(item => Object.keys(item.issues).some(status => status.startsWith('wrong_')));
    const status = Object.keys(criterion.issues).find(key => key.startsWith('wrong_'));
    const answer = 'Ein Originalbeleg aus dieser Antwort.';
    const valid = { criteria: Object.fromEntries(task.feedbackCriteria.map(item => [item.id,
      item.id === criterion.id ? { status, evidence: [answer] } : { status: 'missing', evidence: [] }])) };
    assert.doesNotThrow(() => validateEvaluation(valid, task, answer), id);
    valid.criteria[criterion.id].evidence = ['Dieser Beleg wurde nicht abgegeben.'];
    assert.throws(() => validateEvaluation(valid, task, answer), /keine gültige Bewertung/, id);
  }
});

test('Migrationsserie (Modelmock): falscher Status zeigt den für dieses Kriterium konfigurierten Hinweis', async () => {
  for (const [id, task] of migrated) {
    for (let index = 0; index < task.feedbackCriteria.length; index++) {
      const criterion = task.feedbackCriteria[index];
      const status = Object.keys(criterion.issues).find(key => key.startsWith('wrong_'));
      if (!status) continue;
      const answer = 'Wörtlicher Beleg aus der aktuellen Abgabe.';
      const statuses = task.feedbackCriteria.map(() => 'correct');
      statuses[index] = status;
      const result = await evaluate(task, answer, config, mockFetch(resultWithStatuses(task, answer, statuses)));
      assert.equal(result.points, task.maxPoints - 1, `${id}: falscher Status für Aspekt ${index + 1}`);
      assert.equal(result.missing[0], `Schritt ${index + 1} von ${task.maxPoints} – ${criterion.label}: ${criterion.issues[status]}`);
    }
  }
});

test('Erneute Eingabe wird mit dem aktuellen Antworttext neu bewertet (Modelmock)', async () => {
  const task = core.TASKS['sql-b2-3'];
  const firstAnswer = 'Erste Abgabe mit einem wörtlichen Beleg.';
  const secondAnswer = 'Zweite Abgabe mit einem neuen wörtlichen Beleg.';
  const first = await evaluate(task, firstAnswer, config, mockFetch(modelResult(task, firstAnswer, 0)));
  const second = await evaluate(task, secondAnswer, config, mockFetch(modelResult(task, secondAnswer, 2)));
  assert.equal(first.points, 1);
  assert.equal(second.points, 1);
  assert.match(second.missing[0], /^Schritt 1 von 3/);
});

test('Erkannte Getter-Codeformen können lokale Teilkriterien trotz überschätzendem Modelmock korrigieren', async () => {
  const task = core.TASKS['11-6-0-4a-code'];
  const dogClass = `public class Hund {
  private int alter;
  private String name;
  public Hund(int startAlter, String startName) { alter = startAlter; name = startName; }
  public int gibAlter() { return alter; }
  public void setzeAlter(int neuesAlter) { alter = neuesAlter; }
  public void setzeDaten(int neuesAlter, String neuerName) { alter = neuesAlter; name = neuerName; }
  public void zeigeDaten() { println("Der Hund heißt " + name + " und ist " + alter + " Jahre alt."); }
  public void belle() { println(name + ": Wuff wuff"); }
}`;
  const code = main => `// ===== Datei: Hauptprogramm.java =====\n${main}\n// ===== Datei: Hund.java =====\n${dogClass}`;
  const start = 'Hund petersHund = new Hund(5, "Wuffti");\nHund inasHund = new Hund(8, "Schnuffi");';
  const cases = [
    { code: code(`${start}\nprintln(petersHund.gibAlter());`), expected: 3 },
    { code: code(`${start}\npetersHund.gibAlter();`), expected: 2 },
    { code: code(`${start}\nprintln(5);`), expected: 0 },
    { code: code(`${start}\nprintln(petersHund.zeigeDaten());`), expected: 0 },
    { code: code(`${start}\nprintln(petersHund.gibAlter());\nprintln(petersHund.gibAlter(7));`), expected: 2 }
  ];
  const handle = require('../handler').createHandler({ rateLimit: Infinity, env: {
    AI_API_KEY: 'mock', AI_PROJECT_ID: '11111111-1111-1111-1111-111111111111', AI_MODEL: 'mock-model', AI_EVALUATION_ENABLED: 'true'
  }, fetchImpl: async (url, options) => {
    const sent = JSON.parse(options.body);
    const evidence = sent.messages[1].content.match(/BEGINN SCHUELERCODE\n([\s\S]*)\nENDE SCHUELERCODE$/)[1];
    const model = { criteria: Object.fromEntries(task.feedbackCriteria.map(criterion =>
      [criterion.id, { status: 'correct', evidence: [evidence] }])) };
    return { ok: true, text: async () => JSON.stringify({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(model) } }] }) };
  } });
  for (const [index, example] of cases.entries()) {
    const response = await handle({ httpMethod: 'POST', path: '/', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId: `dog_criteria_${index}`, taskId: '11-6-0-4a-code', requestType: 'code', code: example.code }) });
    assert.equal(response.statusCode, 200);
    assert.equal(JSON.parse(response.body).result.points, example.expected);
  }
});
