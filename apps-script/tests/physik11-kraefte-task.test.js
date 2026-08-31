const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const context = {};
vm.createContext(context);

['Tasks.gs', 'Helpers.gs', 'Gemini.gs'].forEach(function(filename) {
  vm.runInContext(
    fs.readFileSync(path.join(process.cwd(), 'apps-script', filename), 'utf8'),
    context,
    { filename }
  );
});

const task = vm.runInContext(
  "TASKS['ph11-kreisbewegungen-kraeftegleichgewicht-beschreibung']",
  context
);

assert.equal(task.grade, 11);
assert.equal(task.maxPoints, 4);
assert.equal(task.expectedAspects.length, 4);
assert.equal(task.statusLabels.correct, 'korrekt');
assert.equal(
  task.feedbackNoteAboveHalf,
  'Im linken Bild ist die Gewichtskraft gleich der Gegenkraft des Tisches. Im rechten Bild ist die Motorkraft gleich der Reibungskraft.'
);

const prompt = context.buildPrompt_(
  task,
  'Auf dem Tisch und beim konstant fahrenden Auto sind die Kräfte ausgeglichen.'
);
assert.match(prompt, /konkrete Kraftnamen sind nicht erforderlich/);
assert.match(prompt, /gleich groß/);
assert.match(prompt, /resultierende Kraft/);
assert.match(prompt, /keine bestimmten Kraftnamen/);

const aboveHalf = context.normalizeEvaluation_({
  points: 3,
  status: 'beliebig',
  strengths: [],
  missing: [],
  feedback: 'Drei Aspekte passen.'
}, task);
assert.equal(aboveHalf.status, 'teilweise korrekt');
assert.match(aboveHalf.feedback, /Drei Aspekte passen\./);
assert.match(aboveHalf.feedback, /Im linken Bild ist die Gewichtskraft gleich der Gegenkraft des Tisches\. Im rechten Bild ist die Motorkraft gleich der Reibungskraft\./);

const half = context.normalizeEvaluation_({
  points: 2,
  status: 'beliebig',
  strengths: [],
  missing: [],
  feedback: 'Zwei Aspekte passen.'
}, task);
assert.doesNotMatch(half.feedback, /Im linken Bild ist die Gewichtskraft/);
assert.equal(half.status, 'teilweise korrekt');

const full = context.normalizeEvaluation_({
  points: 4,
  status: 'beliebig',
  strengths: ['Beide Situationen erklärt.'],
  missing: [],
  feedback: 'Alle Aspekte passen.'
}, task);
assert.equal(full.status, 'korrekt');
assert.match(full.feedback, /Im linken Bild ist die Gewichtskraft/);

const incorrect = context.normalizeEvaluation_({
  points: 0,
  status: 'beliebig',
  strengths: [],
  missing: ['Kräftegleichgewicht fehlt.'],
  feedback: 'Die Begründung ist noch nicht fachlich ausreichend.'
}, task);
assert.equal(incorrect.status, 'noch nicht korrekt');
assert.doesNotMatch(incorrect.feedback, /Im linken Bild ist die Gewichtskraft/);

console.log('Die Physik-11-Kräftebeschreibung ist serverseitig mit dem didaktischen Hinweis abgesichert.');
