import test from 'node:test';
import assert from 'node:assert/strict';
import { renderCompactEvaluation, compactFeedbackSentences } from '../ui/semantic-answer.mjs';

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
  assert.equal(container.children[0].textContent, '1 von 3 Punkten');
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
  assert.equal(container.children[0].textContent, '0 von 3 Punkten');
  assert.equal(container.children[1].textContent, 'Ergänze die Ausgabe.');
});

test('Einzelhinweis zeigt bei mehreren Fehlern nur den nächsten Schritt und ersetzt ihn beim erneuten Prüfen', () => {
  const container = box();
  const first = 'Ergänze im Zweig delta == 1 die Anpassung von w_2.';
  const next = 'Ersetze im Zweig delta == -1 das Plus vor delta bei theta durch ein Minus.';
  renderCompactEvaluation(container, { ...partial, missing: [first + ' Prüfe auch theta.', next] }, { maxHints: 1 });
  assert.deepEqual(container.children[1].children.map(item => item.textContent), [first]);
  assert.doesNotMatch(container.textContent, /theta/);
  renderCompactEvaluation(container, { ...partial, points: 2, missing: [next] }, { maxHints: 1 });
  assert.deepEqual(container.children[1].children.map(item => item.textContent), [next]);
  assert.doesNotMatch(container.textContent, /w_2/);
  renderCompactEvaluation(container, { ...partial, points: 3 }, { maxHints: 1 });
  assert.equal(container.textContent, '3 von 3 Punkten – Sehr gut, alles richtig');
});

test('Einzelhinweis begrenzt auch älteren Feedbacktext und erhält vollständige Code-Ersetzungen', () => {
  const container = box();
  const hint = 'Ersetze `theta = theta + delta * lernrate;` durch `theta = theta - delta * lernrate;`.';
  renderCompactEvaluation(container, { ...partial, missing: [], feedback: hint + ' Ergänze w_2.' }, { maxHints: 1 });
  assert.deepEqual(container.children[1].children.map(item => item.textContent), [hint]);
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

test('gemeldete Getter-Rückmeldung besteht genau aus Punktzahl und konkretem Fehlersatz', () => {
  const container = box();
  renderCompactEvaluation(container, { ...partial, points: 0, maxPoints: 4,
    missing: ['Die Methode gibAlter() hat keinen Eingabeparameter. Korrigiere dies.'] });
  assert.equal(container.children[0].textContent, '0 von 4 Punkten');
  assert.deepEqual(container.children[1].children.map(item => item.textContent), ['Die Methode gibAlter() hat keinen Eingabeparameter.']);
});

test('Satzgrenze gilt insgesamt, auch bei mehreren Sätzen innerhalb eines Hinweises', () => {
  assert.deepEqual(compactFeedbackSentences(['Der Getter erwartet keine Argumente. Entferne die 7.', 'Ergänze die Ausgabe. Noch ein Tipp.']),
    ['Der Getter erwartet keine Argumente.', 'Entferne die 7.']);
  assert.deepEqual(compactFeedbackSentences(['Entferne die 7. Entferne die 7.', 'Ergänze die Ausgabe.']),
    ['Entferne die 7.', 'Ergänze die Ausgabe.']);
});

test('Methodenaufrufe, Dateinamen und Abkürzungen bleiben als vollständige Hinweise erhalten', () => {
  assert.deepEqual(compactFeedbackSentences(['Ersetze z. B. petersHund.zeigeDaten() in Hund.java durch println(...) mit gibAlter(). Ergänze die Ausgabe.', 'Dritter Satz.']),
    ['Ersetze z. B. petersHund.zeigeDaten() in Hund.java durch println(...) mit gibAlter().', 'Ergänze die Ausgabe.']);
  assert.deepEqual(compactFeedbackSentences(['Ersetze println("Hallo. Welt.") durch einen Getter-Aufruf. Gib dessen Rückgabewert aus.', 'Dritter Satz.']),
    ['Ersetze println("Hallo. Welt.") durch einen Getter-Aufruf.', 'Gib dessen Rückgabewert aus.']);
});
