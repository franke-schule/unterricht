'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const core = require('../evaluation-core');
const physicsTasks = Object.entries(core.TASKS).filter(([id]) => id.startsWith('ph11-'));
const physicsRoot = path.resolve(__dirname, '../../faecher/physik/klasse-11/1-Kreisbewegungen');

test('alle registrierten Physik-Aufgaben erhalten konkrete fachliche Hinweise im Zweisatzformat', () => {
  assert.ok(physicsTasks.length > 0);
  for (const [id, task] of physicsTasks) {
    const prompt = core.buildPrompt_(task, 'Eine fachliche Beschreibung der beobachteten Bewegung.');
    assert.match(prompt, /insgesamt aus höchstens zwei kurzen Sätzen/, id);
    assert.match(prompt, /Bei Physik benenne die konkret falsche Größe, Richtung, Zuordnung oder Beziehung/, id);
    assert.match(prompt, /Zahlenwert, Einheit und gültige Ziffern/, id);
    assert.match(prompt, /\{\{F_Z\}\}.*\{\{F\|m\}\}.*\{\{m\/s²\}\}/, id);
    for (const points of [0, 1, task.maxPoints]) {
      const result = core.formatFinalEvaluation_({ points, maxPoints: task.maxPoints,
        strengths: ['Ein Teil stimmt.'], missing: ['Die Kraftrichtung stimmt nicht. Richte die Kraft zum Kreismittelpunkt aus. Ein dritter Satz entfällt.'],
        feedback: 'Eine zusätzliche Erklärung entfällt.' }, task);
      assert.deepEqual(result.strengths, [], id);
      if (points === task.maxPoints) {
        assert.deepEqual(result.missing, [], id);
        assert.equal(result.feedback, 'Sehr gut, alles richtig', id);
      } else {
        assert.deepEqual(result.missing, ['Die Kraftrichtung stimmt nicht.', 'Richte die Kraft zum Kreismittelpunkt aus.'], id);
        assert.equal(result.feedback, '', id);
      }
    }
  }
});

test('sämtliche Physik-KI-Renderer einschließlich Wiederholungsquizzen verwenden die gemeinsame Formelanzeige', () => {
  const files = [
    'components/physics-semantic-task.mjs', 'aufgabe3-quiz.mjs', 'aufgabe4-quiz.mjs',
    'aufgabe4-und-experiment-quiz.mjs', 'aufgabe5-quiz.mjs', 'wdh2-quiz.mjs',
  ];
  for (const file of files) {
    const source = fs.readFileSync(path.join(physicsRoot, file), 'utf8');
    assert.match(source, /renderCompactEvaluation\([^;]*appendText: appendPhysicsText/, file);
    assert.doesNotMatch(source, /Das ist dir gelungen|Das solltest du überprüfen/, file);
  }
});

test('Physik-Feedback zeigt nur Punkte und zwei Sätze mit echten Indizes und Brüchen', async () => {
  const { renderCompactEvaluation } = await import('../../faecher/informatik/klasse-11/1-Kuenstliche-Intelligenz/perzeptron/ui/semantic-answer.mjs');
  const { appendPhysicsText } = await import('../../faecher/physik/klasse-11/1-Kreisbewegungen/components/physics-notation.mjs');
  class Element {
    constructor(tagName, text = '') { this.tagName = tagName; this.children = []; this.text = text; this.attributes = {}; }
    get ownerDocument() { return document; }
    get textContent() { return this.text + this.children.map(child => child.textContent).join(''); }
    set textContent(value) { this.text = value; this.children = []; }
    setAttribute(name, value) { this.attributes[name] = value; }
    append(...children) { this.children.push(...children); }
    replaceChildren(...children) { this.text = ''; this.children = children; }
  }
  const document = { createElement: tag => new Element(tag), createTextNode: text => new Element('#text', text) };
  const originalDocument = global.document;
  global.document = document;
  const descendants = node => [node, ...node.children.flatMap(descendants)];
  try {
    const box = new Element('div');
    renderCompactEvaluation(box, { points: 1, maxPoints: 4, status: 'teilweise korrekt',
      strengths: ['Unnötiges Lob.'], missing: ['Prüfe die Richtung von {{F_Z}}. Nutze {{F|m}} mit der Einheit {{m/s²}}. Dritter Satz.'],
      feedback: 'Überflüssiger Absatz.' }, { appendText: appendPhysicsText });
    assert.equal(box.children[0].textContent, '1 von 4 Punkten');
    assert.equal(box.children[1].children.length, 2);
    assert.doesNotMatch(box.textContent, /teilweise korrekt|Dritter Satz|Unnötiges Lob|Überflüssiger Absatz|\{\{/);
    assert.equal(descendants(box).find(node => node.tagName === 'sub').textContent, 'Z');
    assert.equal(descendants(box).filter(node => node.className === 'physics-fraction').length, 2);
    for (const force of ['FS', 'F_S', '{{F_S}}', 'FZP', 'F_ZP', '{{F_ZP}}']) {
      renderCompactEvaluation(box, { points: 4, maxPoints: 5,
        missing: [`Beschreibe die Veränderung von ${force}.`] }, { appendText: appendPhysicsText });
      assert.deepEqual(descendants(box).filter(node => node.tagName === 'sub').map(node => node.textContent),
        [force.includes('ZP') ? 'ZP' : 'S'], force);
    }
    renderCompactEvaluation(box, { points: 4, maxPoints: 4 }, { appendText: appendPhysicsText });
    assert.equal(box.textContent, '4 von 4 Punkten – Sehr gut, alles richtig');
    assert.equal(box.children.length, 1);
  } finally { global.document = originalDocument; }
});

test('Kraftsymbole im Physikfeedback besitzen auch ohne HTML-Darstellung einen Unterstrich', () => {
  for (const [, task] of physicsTasks) {
    const result = core.formatFinalEvaluation_({ points: 0, maxPoints: task.maxPoints,
      missing: ['Vergleiche FS, FG, FZ, FZP und F_S.'], feedback: '' }, task);
    assert.deepEqual(result.missing, ['Vergleiche F_S, F_G, F_Z, F_ZP und F_S.']);
  }
});
