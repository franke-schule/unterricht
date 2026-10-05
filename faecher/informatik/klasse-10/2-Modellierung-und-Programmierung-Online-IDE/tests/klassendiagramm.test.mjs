import assert from 'node:assert/strict';
import {
  CLASS_CARD_TASKS,
  HIERARCHY_TASK,
  evaluateClassCard,
  evaluateHierarchy,
  parseStoredChoices,
} from '../klassendiagramm.mjs';

/* ---------- evaluateHierarchy ---------- */

assert.equal(HIERARCHY_TASK.slots.length, 6);
assert.equal(HIERARCHY_TASK.cards.length, 7);

const correct = ['artikel', 'smartphone', 'computer', 'kaffeemaschine', 'laptop', 'tower'];
let result = evaluateHierarchy(correct);
assert.equal(result.status, 'korrekt');
assert.match(result.message, /^Korrekt\. Artikel ist die oberste Klasse\./);

result = evaluateHierarchy(['artikel', 'kaffeemaschine', 'computer', 'smartphone', 'tower', 'laptop']);
assert.equal(result.status, 'korrekt', 'vertauschte Geschwister sind richtig');

result = evaluateHierarchy(['hauptprogramm', 'smartphone', 'computer', 'kaffeemaschine', 'laptop', 'tower']);
assert.equal(result.status, 'teilweise korrekt');
assert.match(result.message, /^Teilweise korrekt\. 5 von 6 Feldern sind richtig belegt\./);
assert.match(result.message, /Hauptprogramm ist keine Klasse/);

result = evaluateHierarchy(['artikel', 'kaffeemaschine', 'computer', 'laptop', 'smartphone', 'tower']);
assert.equal(result.status, 'teilweise korrekt');
assert.match(result.message, /klappbar/);

result = evaluateHierarchy(['computer', 'smartphone', 'artikel', 'kaffeemaschine', 'laptop', 'tower']);
assert.match(result.message, /Ganz oben steht die Klasse/);

result = evaluateHierarchy(['artikel', 'smartphone', 'laptop', 'kaffeemaschine', 'computer', 'tower']);
assert.match(result.message, /extends Computer/);

result = evaluateHierarchy(['artikel', 'laptop', 'computer', 'tower', 'smartphone', 'kaffeemaschine']);
assert.match(result.message, /klappbar/);

result = evaluateHierarchy(['artikel', 'smartphone', 'computer', 'kaffeemaschine', 'laptop', 'hauptprogramm']);
assert.match(result.message, /Hauptprogramm ist keine Klasse/);

result = evaluateHierarchy(['artikel', 'smartphone', 'computer', 'kaffeemaschine', 'kaffeemaschine', 'tower']);
assert.match(result.message, /Laptop\.java und Tower\.java/);

result = evaluateHierarchy(['', '', '', '', '', '']);
assert.equal(result.status, 'noch nicht korrekt');
assert.match(result.message, /^Noch nicht korrekt\. 0 von 6 Feldern sind richtig belegt\./);
assert.match(result.message, /Ziehe in jedes Feld/);

result = evaluateHierarchy(['artikel', 'smartphone', 'computer', '', 'laptop', 'tower']);
assert.equal(result.status, 'teilweise korrekt');
assert.match(result.message, /Ziehe in jedes Feld/);

/* ---------- evaluateClassCard ---------- */

function choicesFor(task, texts) {
  const total = task.attributeSlots + task.methodSlots;
  const result = new Array(total).fill('');
  texts.attributes.forEach((text, index) => {
    result[index] = task.cards.find((card) => card.text === text).id;
  });
  texts.methods.forEach((text, index) => {
    result[task.attributeSlots + index] = task.cards.find((card) => card.text === text).id;
  });
  return result;
}

const grafik = CLASS_CARD_TASKS.grafik;
const grafikCorrect = {
  attributes: ['maximaleVersuche: int', 'kiste: Rectangle', 'ball: Circle'],
  methods: ['Grafik()', 'tuWas(): void', 'bewegeBall(geschwindigkeit: int): void', 'act(): void'],
};
result = evaluateClassCard(grafik, choicesFor(grafik, grafikCorrect));
assert.equal(result.status, 'korrekt');
assert.match(result.message, /^Korrekt\. Die Karte zeigt die drei Attribute/);

result = evaluateClassCard(grafik, choicesFor(grafik, {
  attributes: grafikCorrect.attributes,
  methods: ['Grafik(): void', 'tuWas(): void', 'bewegeBall(geschwindigkeit: int): void', 'act(): void'],
}));
assert.notEqual(result.status, 'korrekt');
assert.match(result.message, /keinen Rückgabetyp/);
assert.match(result.message, /^Teilweise korrekt\. 6 von 7 verlangten Einträgen stehen richtig\./);

result = evaluateClassCard(grafik, choicesFor(grafik, {
  attributes: ['maximaleVersuche: int', 'ball: Circle', 'Grafik()'],
  methods: ['kiste: Rectangle', 'tuWas(): void', 'bewegeBall(geschwindigkeit: int): void', 'act(): void'],
}));
assert.notEqual(result.status, 'korrekt');
assert.match(result.message, /falschen Bereich/);

result = evaluateClassCard(grafik, choicesFor(grafik, {
  attributes: ['maximaleVersuche: int'],
  methods: [],
}));
assert.equal(result.status, 'noch nicht korrekt');
assert.match(result.message, /^Noch nicht korrekt\. 1 von 7 verlangten Einträgen stehen richtig\. Es fehlt noch mindestens ein Eintrag\./);

result = evaluateClassCard(grafik, new Array(9).fill(''));
assert.equal(result.status, 'noch nicht korrekt');
assert.match(result.message, /0 von 7/);

const rectangle = CLASS_CARD_TASKS.rectangle;
const rectangleCorrect = {
  attributes: ['left: double', 'top: double', 'width: double', 'height: double'],
  methods: [
    'Rectangle(left: double, top: double, width: double, height: double)',
    'setFillColor(color: Color): void',
    'rotate(angleDeg: double): void',
    'scale(factor: double): void',
  ],
};
result = evaluateClassCard(rectangle, choicesFor(rectangle, rectangleCorrect));
assert.equal(result.status, 'korrekt');
assert.doesNotMatch(result.message, /fillColor/);

result = evaluateClassCard(rectangle, choicesFor(rectangle, {
  attributes: [...rectangleCorrect.attributes, 'fillColor: Color'],
  methods: rectangleCorrect.methods,
}));
assert.equal(result.status, 'korrekt');
assert.match(result.message, /fillColor/);

result = evaluateClassCard(rectangle, choicesFor(rectangle, {
  attributes: rectangleCorrect.attributes,
  methods: [...rectangleCorrect.methods, 'move(dx: double, dy: double): void'],
}));
assert.notEqual(result.status, 'korrekt');
assert.match(result.message, /ruft move für kiste nicht auf/);

const circle = CLASS_CARD_TASKS.circle;
const circleCorrect = {
  attributes: ['mx: double', 'my: double', 'r: double'],
  methods: ['Circle(mx: double, my: double, r: double)', 'setFillColor(color: Color): void', 'move(dx: double, dy: double): void'],
};
result = evaluateClassCard(circle, choicesFor(circle, circleCorrect));
assert.equal(result.status, 'korrekt');
assert.match(result.message, /^Korrekt\. Circle bekommt die Attribute/);

result = evaluateClassCard(circle, choicesFor(circle, {
  attributes: circleCorrect.attributes,
  methods: ['Circle(mx: double, my: double, r: double)', 'setFillColor(color: Color): void', 'move(0, geschwindigkeit): void'],
}));
assert.notEqual(result.status, 'korrekt');
assert.match(result.message, /Werte beim Aufruf/);

result = evaluateClassCard(circle, choicesFor(circle, {
  attributes: [...circleCorrect.attributes, 'fillColor: Color'],
  methods: circleCorrect.methods,
}));
assert.equal(result.status, 'korrekt');
assert.match(result.message, /fillColor/);

// Jede Aufgabe: Zeilen reichen für alle verlangten Einträge, und die Karten-IDs sind eindeutig.
Object.values(CLASS_CARD_TASKS).forEach((task) => {
  const attributes = task.cards.filter((card) => card.kind === 'A').length;
  const methods = task.cards.filter((card) => card.kind === 'M').length;
  assert.ok(task.attributeSlots >= attributes, task.className + ': Attributfelder');
  assert.ok(task.methodSlots >= methods, task.className + ': Methodenfelder');
  assert.equal(new Set(task.cards.map((card) => card.id)).size, task.cards.length);
  task.cards.filter((card) => card.kind === 'D').forEach((card) => assert.ok(card.hint, 'Hinweis fehlt: ' + card.text));
});

/* ---------- parseStoredChoices ---------- */

const ids = HIERARCHY_TASK.cards.map((card) => card.id);
assert.deepEqual(parseStoredChoices('', 6, ids), ['', '', '', '', '', '']);
assert.deepEqual(parseStoredChoices('kein json', 6, ids), ['', '', '', '', '', '']);
assert.deepEqual(parseStoredChoices('{"a":1}', 6, ids), ['', '', '', '', '', '']);
assert.deepEqual(parseStoredChoices('["artikel","gibtsnicht",5,null,"tower"]', 6, ids), ['artikel', '', '', '', 'tower', '']);
assert.deepEqual(parseStoredChoices('["artikel","artikel"]', 3, ids), ['artikel', '', '']);
assert.deepEqual(parseStoredChoices(JSON.stringify(correct), 6, ids), correct);

console.log('Klassendiagramm-Auswertungen (Hierarchie, Klassenkarten, Zustand) sind erfolgreich.');
