'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const core = require('../evaluation-core');
const { evaluate, readConfig, validateEvaluation } = require('../scaleway-client');
const legacy = require('./fixtures/criterion-feedback-legacy.json');

test('Neue KI-Aufgaben benötigen Kriterien; der eingefrorene Altbestand und die Migrationsübersicht bleiben konsistent', () => {
  const document = fs.readFileSync(path.join(__dirname, '../../KI-FEEDBACK-MIGRATION.md'), 'utf8');
  const documented = [...document.matchAll(/^\| `([^`]+)` \| [^\n]+ \| (\d+) \|$/gm)].map(match => [match[1], Number(match[2])]);
  const configured = Object.entries(core.TASKS).filter(([, task]) => task.feedbackCriteria);
  assert.deepEqual(documented, configured.map(([id, task]) => [id, task.maxPoints]));
  assert.equal(new Set(legacy).size, legacy.length);
  const unconverted = Object.entries(core.TASKS).filter(([, task]) => !task.feedbackCriteria).map(([id]) => id).sort();
  assert.deepEqual(unconverted, legacy, 'Neue Aufgaben mit Kriterien anlegen; migrierte/entfernte IDs aus der Legacy-Liste streichen.');
  for (const [id, task] of configured) {
    assert.ok(Number.isInteger(task.maxPoints) && task.maxPoints > 0, id);
    assert.equal(task.maxFeedbackHints, 1, id);
    assert.equal(task.feedbackCriteria.length, task.maxPoints, id);
    assert.equal(task.expectedAspects.length, task.maxPoints, id);
    assert.equal(task.rubric.length, task.maxPoints, id);
    assert.equal(new Set(task.feedbackCriteria.map(criterion => criterion.id)).size, task.maxPoints, id);
    for (const criterion of task.feedbackCriteria) {
      assert.match(criterion.id, /^[a-z][a-z0-9_]*$/);
      assert.ok(criterion.label?.trim());
      assert.ok(criterion.issues.missing?.trim());
      for (const [status, hint] of Object.entries(criterion.issues)) {
        assert.match(status, /^(missing|missing_[a-z_]+|wrong_[a-z_]+)$/);
        assert.equal(typeof hint, 'string'); assert.ok(hint.trim());
      }
    }
  }
});

test('Neue Codeaufgaben nutzen denselben Kriterienvertrag mit Codebelegen und einem nächsten Hinweis (Mock)', async () => {
  const examples = [
    { codeAnalysisContext: 'Java-Klasse Beispiel mit int verdoppeln(int x).', codeAnalysisRules: ['Der Parameterwert soll verdoppelt zurückgegeben werden.'],
      code: 'public int verdoppeln(int x) { return x * 2; }', expectedAspects: ['Die Methode erhält einen int-Parameter.', 'Sie gibt das Doppelte zurück.'], evidence: ['int x', 'return x * 2;'] },
    { program: 'LearnJ-Roboter mit Schritt() und LinksDrehen().', code: 'void ausfuehren() { Schritt(); LinksDrehen(); }',
      expectedAspects: ['Der Roboter geht einen Schritt.', 'Danach dreht er sich links.'], evidence: ['Schritt();', 'LinksDrehen();'] }
  ];
  for (const example of examples) {
    const task = { ...example, responseType: 'code', title: 'Informatik: synthetischer Codevertrag', grade: 10, maxPoints: 2, maxFeedbackHints: 1,
      instruction: 'Implementiere beide erwarteten Aspekte.', rubric: ['Ein Punkt für den ersten Aspekt.', 'Ein Punkt für den zweiten Aspekt.'],
      statusLabels: { correct: 'korrekt', partial: 'teilweise korrekt', incorrect: 'noch nicht korrekt' },
      feedbackCriteria: [{ id: 'first', label: 'Ersten Schritt umsetzen', issues: { missing: 'Ergänze den ersten geforderten Schritt.' } },
        { id: 'second', label: 'Zweiten Schritt umsetzen', issues: { missing: 'Ergänze den zweiten geforderten Schritt.', wrong_operation: 'Prüfe die zweite Operation in der Methode.' } }] };
    const config = readConfig({ AI_API_KEY: 'mock', AI_PROJECT_ID: '11111111-1111-1111-1111-111111111111', AI_MODEL: 'mock-model' });
    const prompt = core.buildPrompt_(task, example.code);
    assert.match(prompt, /Kriterienweise Belegprüfung statt Gesamturteil/);
    assert.match(prompt, /funktional richtig umgesetzt/);
    assert.match(prompt, /Kontrollfluss, Erreichbarkeit und spätere Überschreibungen/);
    assert.match(prompt, /Kommentare, Zeichenketten oder unerreichbarer Code/);
    assert.doesNotMatch(prompt, /"points": Zahl|strengths.*müssen|höchstens einem Punkt/);
    assert.ok(prompt.includes(example.codeAnalysisContext || example.program));
    assert.ok(prompt.includes(example.expectedAspects[1]));
    for (let completed = 0; completed <= 2; completed++) {
      const model = { criteria: Object.fromEntries(task.feedbackCriteria.map((criterion, index) => [criterion.id,
        { status: index < completed ? 'correct' : 'missing', evidence: index < completed ? [example.evidence[index]] : [] }])) };
      const result = await evaluate(task, example.code, config, async (url, options) => {
        const request = JSON.parse(options.body);
        assert.deepEqual(request.response_format.json_schema.schema.required, ['criteria']);
        return { ok: true, text: async () => JSON.stringify({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(model) } }] }) };
      });
      assert.equal(result.points, completed);
      assert.equal(result.maxPoints, 2);
      assert.equal(result.missing.length, completed === 2 ? 0 : 1);
      if (completed < 2) assert.match(result.missing[0], new RegExp(`Schritt ${completed + 1} von 2`));
      else assert.equal(result.feedback, 'Sehr gut, alles richtig');
      model.criteria.first = { status: 'correct', evidence: ['Erfundener Code();'] };
      assert.throws(() => validateEvaluation(model, task, example.code), /keine gültige Bewertung/);
    }
  }
});

test('Neue Physik-Kriterien bewahren Originalbelege trotz gleichwertiger Formelzeichen', () => {
  const task = { title: 'Physik Klasse 11: synthetischer Kriterienvertrag', grade: 11, maxPoints: 1, maxFeedbackHints: 1,
    expectedAspects: ['Die Zentripetalkraft zeigt zum Mittelpunkt.'], rubric: ['Ein Punkt für die Richtung.'],
    feedbackCriteria: [{ id: 'direction', label: 'Richtung erklären', issues: { missing: 'Ergänze die Richtung.' } }] };
  const answer = 'FZ zeigt zum Mittelpunkt.';
  const prompt = core.buildPrompt_(task, answer);
  assert.ok(prompt.endsWith(answer));
  assert.match(prompt, /Zitiere immer die unveränderte Schülerantwort/);
  assert.doesNotThrow(() => validateEvaluation({ criteria: { direction: { status: 'correct', evidence: [answer] } } }, task, answer));
});
