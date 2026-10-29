'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../evaluation-core');
const { createHandler } = require('../handler');
const { evaluationSchema, validateEvaluation } = require('../scaleway-client');
const facts = require('./fixtures/aufgabe9-criterion-facts');
const fixtureCases = require('./fixtures/sql-description-cases.json');
const taskFor = id => core.TASKS['inf10-db-a9-' + id.toLowerCase()];
const modelFor = (task, quotes, statuses) => ({ criteria: Object.fromEntries(task.feedbackCriteria.map((criterion, index) => [criterion.id,
  { status: statuses[index], evidence: statuses[index] === 'correct' || statuses[index].startsWith('wrong_') ? [quotes[index]] : [] }])) });
const evaluate = (task, answer, model) => {
  validateEvaluation(model, task, answer);
  return core.formatFinalEvaluation_(core.applyRuleBasedMinimum_(model, task, answer), task);
};

test('A9: Server und Website verwenden dieselben Punktgrenzen, Aufträge und SQL-Kontexte', async () => {
  const { JOIN_TASKS } = await import('../../faecher/informatik/klasse-10/1-Datenbanken/aufgabe9-daten.mjs');
  for (const task of JOIN_TASKS.filter(task => task.type === 'describe')) {
    const serverTask = taskFor(task.id);
    assert.equal(task.maxPoints, serverTask.maxPoints);
    assert.equal(task.maxFeedbackHints, 1);
    assert.equal(task.assessmentVersion, '20261029-ordering');
    assert.ok(serverTask.context.includes(task.statement));
    assert.ok(serverTask.context.startsWith(task.prompt.replaceAll('**', '')));
  }
});

test('A9: Alle vier Beschreibe-Aufgaben verwenden fünf Kriterien einschließlich Sortierung', () => {
  for (const id of Object.keys(facts)) {
    const task = taskFor(id);
    assert.equal(task.maxPoints, 5);
    assert.equal(task.feedbackCriteria.length, 5);
    assert.equal(task.maxFeedbackHints, 1);
    assert.equal(task.sqlDescription.requireUnchangedSource, false);
    assert.equal(new Set(task.feedbackCriteria.map(criterion => criterion.id)).size, 5);
    assert.equal(task.feedbackCriteria[4].id, 'ordering');
    const prompt = core.buildPrompt_(task, facts[id].join(' '));
    assert.match(prompt, /Gemeinsame Kriterien für SQL-Beschreibe-Aufgaben/);
    assert.match(prompt, /Dieselbe Textstelle darf mehrere Kriterien belegen/);
    assert.doesNotMatch(prompt, /theta|missing_zero_case|Step-Funktion/);
    assert.deepEqual(evaluationSchema(task).properties.criteria.required, task.feedbackCriteria.map(criterion => criterion.id));
    for (const [identifier, aliases] of Object.entries(task.sqlDescription.aliases)) {
      for (const alias of aliases) assert.ok(prompt.includes(alias), `${id}: ${identifier}`);
    }
  }
});

test('A9: Jedes offene Kriterium wird einzeln angezeigt, alle erfüllten Aspekte zählen sofort', () => {
  for (const [id, quotes] of Object.entries(facts)) {
    const task = taskFor(id);
    for (let missing = 0; missing < quotes.length; missing++) {
      const statuses = quotes.map((_, index) => index === missing ? 'missing' : 'correct');
      const answer = quotes.filter((_, index) => index !== missing).join(' ');
      const result = evaluate(task, answer, modelFor(task, quotes, statuses));
      assert.equal(result.points, quotes.length - 1, id);
      assert.equal(result.missing.length, 1);
      assert.ok(result.missing[0].startsWith(`Schritt ${missing + 1} von ${quotes.length}`), id);
    }
    for (let completed = 0; completed <= quotes.length; completed++) {
      const statuses = quotes.map((_, index) => index < completed ? 'correct' : 'missing');
      const answer = quotes.slice(0, completed).join(' ') || 'Meine Erklärung ist noch nicht fertig.';
      const result = evaluate(task, answer, modelFor(task, quotes, statuses));
      assert.equal(result.points, completed);
      if (completed < quotes.length) assert.ok(result.missing[0].startsWith(`Schritt ${completed + 1} von ${quotes.length}`));
      else {
        assert.deepEqual(result.missing, []);
        assert.equal(result.feedback, 'Sehr gut, alles richtig');
      }
    }
  }
});

test('A9: P8 benennt die Rollenverwechslung, ohne den gesamten Erwartungshorizont auszugeben', () => {
  const task = taskFor('P8');
  const quotes = [...facts.P8];
  quotes[1] = 'likes.user_id bezeichnet die hochladende Person.';
  const result = evaluate(task, quotes.join(' '), modelFor(task, quotes, ['correct', 'wrong_role', 'correct', 'correct', 'correct']));
  assert.equal(result.points, 4);
  assert.equal(result.missing.length, 1);
  assert.match(result.missing[0], /Schritt 2 von 5.*gefällt.*hochgeladen/);
  assert.doesNotMatch(result.missing[0], /Kennung 10|SELECT|photo_id/);
});

test('A9: P11 darf denselben Satz für individuelle Ausgabe und Zählung je Mitglied verwenden', () => {
  const task = taskFor('P11');
  const shared = 'Für jede Person werden ihre Kommentare einzeln gezählt und zusammen mit ihrem Benutzernamen angezeigt.';
  const quotes = [shared, facts.P11[1], facts.P11[2], shared, facts.P11[4]];
  const result = evaluate(task, [shared, facts.P11[1], facts.P11[2], facts.P11[4]].join(' '), modelFor(task, quotes, quotes.map(() => 'correct')));
  assert.equal(result.points, 5);
  assert.deepEqual(result.missing, []);
  const wrong = ['Eine einzige Gesamtzahl aller Kommentare wird mit Benutzernamen ausgegeben.', facts.P11[1], facts.P11[2], 'Alle Personen bilden eine gemeinsame Gruppe.', facts.P11[4]];
  const wrongResult = evaluate(task, wrong.join(' '), modelFor(task, wrong, ['wrong_total', 'correct', 'correct', 'wrong_grouping', 'correct']));
  assert.equal(wrongResult.points, 3);
  assert.equal(wrongResult.missing.length, 1);
  assert.match(wrongResult.missing[0], /^Schritt 1 von 5.*Gesamtzahl/);
});

test('A9: Bekannte Fehlertypen liefern konkrete Hinweise zu Ortsbezug, Teilaspekten und Foto-ID', () => {
  for (const [id, index, status, quote, pattern] of [
    ['P2', 2, 'wrong_location', 'Die Fotos wurden in Hamburg aufgenommen.', /Wohnort.*Aufnahmeort/],
    ['P5', 3, 'wrong_match', 'Der gesamte Kommentartext muss genau Foto lauten.', /gesamte Kommentartext.*Vorkommen/],
    ['P8', 3, 'wrong_meaning', 'Es werden zehn Fotos ausgegeben.', /Fotokennung.*Anzahl/],
    ['P11', 2, 'missing_comments', '', /ohne geschriebenen Kommentar/]
  ]) {
    const task = taskFor(id);
    const quotes = [...facts[id]]; quotes[index] = quote;
    const statuses = quotes.map((_, position) => position === index ? status : 'correct');
    const result = evaluate(task, quotes.join(' '), modelFor(task, quotes, statuses));
    assert.equal(result.points, 4);
    assert.match(result.missing[0], pattern);
  }
});

test('A9: Server verwirft erfundene Belege und übernimmt keine freien Modellpunkte (Mock)', async () => {
  for (const [id, quotes] of Object.entries(facts)) {
    const task = taskFor(id);
    const model = modelFor(task, quotes, quotes.map(() => 'correct'));
    model.criteria[task.feedbackCriteria[1].id].evidence = ['Erfundene zusätzliche Erklärung.'];
    const handle = createHandler({ rateLimit: Infinity, env: {
      AI_API_KEY: 'mock', AI_PROJECT_ID: '11111111-1111-1111-1111-111111111111', AI_MODEL: 'gpt-oss-120b', AI_EVALUATION_ENABLED: 'true'
    }, fetchImpl: async (url, options) => {
      const request = JSON.parse(options.body);
      assert.equal(request.response_format.json_schema.schema.properties.criteria.required.length, 5);
      return { ok: true, status: 200, text: async () => JSON.stringify({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(model) } }] }) };
    } });
    const response = await handle({ httpMethod: 'POST', path: '/', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId: 'a9_criteria_' + id, taskId: 'inf10-db-a9-' + id.toLowerCase(), answer: quotes.join(' ') }) });
    assert.equal(response.statusCode, 502);
    assert.equal(JSON.parse(response.body).result.points, undefined);
  }
  for (const fixture of fixtureCases.filter(fixture => fixture.taskId.startsWith('inf10-db-a9-'))) {
    assert.ok(fixture.kind !== 'partial' || fixture.criterionStatuses?.length === 5);
  }
});

test('A9: Ohne Sortierung bleiben vier von fünf Punkten; Teilangaben und falsche Richtungen erhalten einen gezielten fünften Schritt', () => {
  for (const [id, quotes] of Object.entries(facts)) {
    const task = taskFor(id);
    const answer = quotes.slice(0, 4).join(' ');
    const result = evaluate(task, answer, modelFor(task, quotes, ['correct', 'correct', 'correct', 'correct', 'missing']));
    assert.equal(result.points, 4);
    assert.equal(result.status, 'teilweise korrekt');
    assert.equal(result.missing.length, 1);
    assert.match(result.missing[0], /^Schritt 5 von 5 – Sortierung erklären:/);
    for (const [status, quote] of id === 'P8'
      ? [['missing_direction', 'Es wird nach Benutzername sortiert.'], ['wrong_direction', 'Die Benutzernamen werden von Z bis A sortiert.']]
      : [['missing_secondary', id === 'P11' ? 'Die Mitglieder mit den meisten Kommentaren stehen zuerst.' : 'Die Benutzernamen werden von A bis Z sortiert.'],
        ['wrong_priority', id === 'P11' ? 'Zuerst wird nach Benutzername von A bis Z und danach nach Kommentaranzahl absteigend sortiert.' : 'Zuerst wird nach ID aufsteigend und danach nach Benutzername von A bis Z sortiert.']]) {
      const changed = [...quotes]; changed[4] = quote;
      const partial = evaluate(task, changed.join(' '), modelFor(task, changed, ['correct', 'correct', 'correct', 'correct', status]));
      assert.equal(partial.points, 4);
      assert.deepEqual(partial.missing, [`Schritt 5 von 5 – Sortierung erklären: ${task.feedbackCriteria[4].issues[status]}`]);
    }
  }
  // Reproduziert den gemeldeten Punktevertrag unter der Annahme, dass das
  // Modell die ersten vier Aspekte anerkennt; keine semantische Live-Prüfung.
  const reported = 'Es werden nutzername und fotobeschreibung von users und photos ausgegeben. es werden die photos mit passenden usern verbunden. die nutzer müssen aus hamburg kommen. ein mitglied mit mehreren passenden fotos steht mehrfach in der tabelle';
  const task = taskFor('P2');
  const result = evaluate(task, reported, modelFor(task, Array(5).fill(reported), ['correct', 'correct', 'correct', 'correct', 'missing']));
  assert.equal(result.points, 4);
  assert.equal(result.maxPoints, 5);
  assert.match(result.missing[0], /Sortierung/);
});
