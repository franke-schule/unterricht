'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const core = require('../evaluation-core');

const repo = path.resolve(__dirname, '../..');
const client = fs.readFileSync(path.join(repo, 'faecher/informatik/klasse-11/1-Kuenstliche-Intelligenz/perzeptron/ui/task6-1.mjs'), 'utf8');
const html = fs.readFileSync(path.join(repo, 'faecher/informatik/klasse-11/1-Kuenstliche-Intelligenz/aufgabe6-1.html'), 'utf8');
const specs = [
  ['11-6-1-if-code', 3, ['gewichtete_Summe_2 strikt', '>=', 'if-Block']],
  ['11-6-1-ifelse-code', 3, ['strikt >', 'else', 'Gleichheit']],
  ['11-6-1-elseif-code', 3, ['delta_uebung == 1', 'delta_uebung == -1', 'Ein einzelnes =', 'nur ein Zweig']],
  ['11-6-1-for-code', 3, ['i=0', 'i<3', 'i++', 'hart codierte']],
  ['11-6-1-foreach-code', 3, ['gibLabel()', 'hart codierte', 'Datenpunkt']]
];

test('Aufgabe 6.1 registriert fünf getrennte Code-Rubriken mit je drei Punkten', () => {
  for (const [id, points, terms] of specs) {
    const task = core.TASKS[id];
    assert.ok(task, `Fehlende Aufgaben-ID ${id}`);
    assert.equal(task.grade, 11);
    assert.equal(task.responseType, 'code');
    assert.equal(task.maxPoints, points);
    assert.equal(task.expectedAspects.length, points);
    assert.ok(task.rubric.length >= 3);
    const prompt = core.buildPrompt_(task, '// ===== Datei: Hauptprogramm.java =====\nint x = 0;');
    assert.match(prompt, /statische Codebewertung belegt keinen Programmlauf/);
    assert.match(prompt, /keine vollständige Musterlösung/i);
    for (const term of terms) assert.ok(prompt.includes(term), `${id}: fehlender Rubrikhinweis ${term}`);
    assert.ok(prompt.endsWith('// ===== Datei: Hauptprogramm.java =====\nint x = 0;\nENDE SCHUELERCODE'));
  }
});

test('Client übermittelt aktuelle IDE-Dateien für jeden individuellen Codeauftrag', () => {
  for (const id of ['Java11Aufgabe6_1IfV1','Java11Aufgabe6_1IfElseV1','Java11Aufgabe6_1ElseIfV1','Java11Aufgabe6_1ForV1','Java11Aufgabe6_1ForEachV1']) {
    assert.ok(html.includes(id), `Fehlende IDE-ID ${id}`);
  }
  for (const [id] of specs) assert.ok(client.includes(id), `Client kennt ${id} nicht`);
  assert.match(client, /ide\.getFiles\(\)/);
  assert.match(client, /getText\(\)/);
  assert.match(client, /Datei: \$\{name\}/);
  assert.match(client, /code\.trim\(\)\.length<20/);
  assert.match(client, /code\.length>12000/);
  assert.match(client, /finally\{button\.disabled=false;?\}/);
});

test('IDE-Konsolenstartstände enthalten die geforderten Fälle und getrennte Übungen', () => {
  assert.match(html, /gewichtete_Summe = 4;[\s\S]*?double theta = 5;[\s\S]*?gewichtete_Summe > theta/);
  assert.match(html, /Zweiter Fall für Aufgabe 1B/);
  assert.match(html, /Zweiter Fall für Aufgabe 2B/);
  assert.match(html, /Zweite, eigenständige Kette für Aufgabe 3B/);
  assert.match(html, /println\("Datenpunkt " \+ 0\);[\s\S]*?println\("Datenpunkt " \+ 1\);[\s\S]*?println\("Datenpunkt " \+ 2\);/);
  assert.match(html, /new Datenpunkt\(2, 2, 1\), new Datenpunkt\(4, 1, 0\), new Datenpunkt\(0, 4, 1\)/);
  assert.match(html, /for \(Datenpunkt punkt : punkte\)/);
  assert.match(html, /private double x_1;[\s\S]*?private double x_2;[\s\S]*?private int label;/);
});



