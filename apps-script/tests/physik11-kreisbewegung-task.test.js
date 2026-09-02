const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const context = {};
vm.createContext(context);
['Tasks.gs', 'Helpers.gs', 'Gemini.gs'].forEach((filename) => {
  vm.runInContext(fs.readFileSync(path.join(process.cwd(), 'apps-script', filename), 'utf8'), context, { filename });
});

const task = vm.runInContext("TASKS['ph11-kreisbewegungen-zentripetalkraft-beschreibung']", context);
assert.equal(task.grade, 11);
assert.equal(task.maxPoints, 5);
assert.equal(task.expectedAspects.length, 5);
assert.match(task.systemInstruction, /Tangente/);
assert.match(task.systemInstruction, /nach innen/);
assert.match(task.systemInstruction, /Schlüsselwortübereinstimmung genügt nicht/);
assert.match(task.systemInstruction, /sehr kurze Antwort kann vollständig richtig sein/);
assert.match(task.expectedAspects[1], /tangential/);
assert.match(task.expectedAspects[3], /Kreismittelpunkt/);
assert.match(task.expectedAspects[4], /radial nach innen/);

const answerClasses = [
  { name: 'vollständig richtig', answer: 'Beide Pfeile starten am Körper. v liegt an der Tangente; FZ ist radial nach innen zum Mittelpunkt gerichtet.', points: 5, status: 'korrekt' },
  { name: 'nur Geschwindigkeit', answer: 'Der Geschwindigkeitspfeil beginnt am Körper und verläuft tangential.', points: 2, status: 'teilweise korrekt' },
  { name: 'nur Zentripetalkraft', answer: 'Der Kraftpfeil beginnt am Körper und zeigt radial nach innen zur Kreismitte.', points: 3, status: 'teilweise korrekt' },
  { name: 'tangential und radial verwechselt', answer: 'Die Geschwindigkeit zeigt radial zum Zentrum und die Kraft verläuft tangential.', points: 0, status: 'noch nicht korrekt' },
  { name: 'Kraft nach außen', answer: 'v liegt tangential an; FZ zeigt vom Körper nach außen.', points: 2, status: 'teilweise korrekt' },
  { name: 'Geschwindigkeit zum Mittelpunkt', answer: 'v beginnt am Körper und zeigt zum Mittelpunkt. FZ zeigt nach innen.', points: 2, status: 'teilweise korrekt' },
  { name: 'Synonyme', answer: 'Die Bewegungsrichtung berührt den Kreis am Massenpunkt. Der Zugpfeil setzt dort an und weist ins Zentrum.', points: 5, status: 'korrekt' },
  { name: 'kurz, aber ausreichend', answer: 'Ab Körper: v tangential, FZ zur Kreismitte, also nach innen.', points: 5, status: 'korrekt' },
  { name: 'themenfremd', answer: 'Kreisbewegungen kommen im Alltag häufig vor.', points: 0, status: 'noch nicht korrekt' },
];

answerClasses.forEach((fixture) => {
  const prompt = context.buildPrompt_(task, fixture.answer);
  assert.match(prompt, new RegExp(fixture.answer.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(prompt, /Widersprüche nicht als richtig werten/);
  const normalized = context.normalizeEvaluation_({ points: fixture.points, strengths: [], missing: [], feedback: fixture.name }, task);
  assert.equal(normalized.status, fixture.status, fixture.name);
});

console.log('Die Skriptserver-Rubrik deckt neun richtige, teilweise richtige, widersprüchliche und leere Antwortklassen ab.');
