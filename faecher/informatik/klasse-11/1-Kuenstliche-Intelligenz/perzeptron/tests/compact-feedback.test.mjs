import test from 'node:test';
import assert from 'node:assert/strict';
import { renderCompactEvaluation } from '../ui/semantic-answer.mjs';

// Minimal DOM records text and children; raw HTML is deliberately unsupported.
class Element {
  constructor(tagName, ownerDocument) {
    this.tagName = tagName;
    this.ownerDocument = ownerDocument;
    this.children = [];
    this.text = '';
    this.className = 'feedback partial';
    this.hidden = false;
  }
  set textContent(value) { this.text = String(value); this.children = []; }
  get textContent() { return this.text + this.children.map(child => child.textContent).join(''); }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.text = ''; this.children = children; }
}
const document = { createElement: tag => new Element(tag, document) };
const box = () => new Element('div', document);
const partial = { points: 1, maxPoints: 3, status: 'gut', strengths: ['Korrektes Detail.'],
  missing: ['Ersetze gibAlter(7) durch einen Aufruf ohne Eingabeparameter.'],
  feedback: 'Lange wiederholte Erklärung. Korrektes Detail. Ersetze den Aufruf.' };

test('volle Punktzahl zeigt ausschließlich Punktzahl und den gewünschten Erfolgswortlaut', () => {
  const container = box();
  renderCompactEvaluation(container, { ...partial, points: 3 });
  assert.equal(container.textContent, '3 von 3 Punkten – Sehr gut, alles richtig');
  assert.equal(container.children.length, 1);
});

test('Teilpunkte zeigen nur konkrete Stichpunkte, keine Stärken und keine doppelte Prosa', () => {
  const container = box();
  renderCompactEvaluation(container, partial);
  assert.equal(container.children[0].textContent, '1 von 3 Punkten – teilweise korrekt');
  assert.equal(container.children[1].tagName, 'ul');
  assert.deepEqual(container.children[1].children.map(item => item.textContent), partial.missing);
  assert.doesNotMatch(container.textContent, /Korrektes Detail|Lange|gelungen|überprüfen/);
  assert.equal(container.className, 'feedback partial');
  assert.equal(container.hidden, false);
});

test('höchstens zwei unterschiedliche Hinweise, leere und doppelte Einträge entfallen', () => {
  const container = box();
  renderCompactEvaluation(container, { ...partial, missing: ['', '- Korrigiere den Aufruf.', 'Korrigiere den Aufruf.', 'Ergänze die Ausgabe.', 'Dritter Hinweis.'] });
  assert.deepEqual(container.children[1].children.map(item => item.textContent), ['Korrigiere den Aufruf.', 'Ergänze die Ausgabe.']);
});

test('ohne missing wird individueller Feedbacktext einmal als Stichpunkt verwendet', () => {
  const container = box();
  renderCompactEvaluation(container, { ...partial, points: 0, missing: [], feedback: 'Noch nicht korrekt. Ergänze die Ausgabe.' });
  assert.equal(container.children[0].textContent, '0 von 3 Punkten – noch nicht korrekt');
  assert.equal(container.children[1].textContent, 'Ergänze die Ausgabe.');
});

test('erneutes Prüfen ersetzt die vorherige Rückmeldung und behandelt Code/HTML sicher als Text', () => {
  const container = box();
  renderCompactEvaluation(container, partial);
  const hint = 'Ersetze <script>alert(1)</script> durch println(...).';
  renderCompactEvaluation(container, { ...partial, missing: [hint] });
  assert.equal(container.children.length, 2);
  assert.equal(container.children[1].children[0].textContent, hint);
  assert.equal(container.children[1].children[0].children.length, 0);
});

test('bestehende Formelrenderer können den Text der Stichpunkte formatieren', () => {
  const container = box();
  const seen = [];
  renderCompactEvaluation(container, partial, { appendText: (node, text) => { seen.push(text); node.textContent = text; } });
  assert.deepEqual(seen, partial.missing);
});
