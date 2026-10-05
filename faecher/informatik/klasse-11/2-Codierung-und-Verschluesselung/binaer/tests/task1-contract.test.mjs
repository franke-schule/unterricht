import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { ASCII_EXCERPT, ROWS } from '../data/task1.mjs';

const read = (path) => readFileSync(new URL(path, import.meta.url), 'utf8');
const html = read('../../aufgabe1.html');
const ui = read('../ui/task1.mjs');
const css = read('../task1.css');
const menu = read('../../../index.html');

const panel = (id) => {
  const match = html.match(new RegExp('<section id="' + id + '"[\\s\\S]*?</section>(?=\\s*(?:<!--|<section|</main>))'));
  assert.ok(match, 'Panel ' + id + ' fehlt');
  return match[0];
};
const element = (id) => {
  const match = html.match(new RegExp('<(article|div|section|p|fieldset|button|table)[^>]*id="' + id + '"[^>]*>'));
  assert.ok(match, '#' + id + ' fehlt');
  return match[0];
};
const count = (text, needle) => text.split(needle).length - 1;
const withoutBlock = (text, id) => text.replace(new RegExp('<article id="' + id + '"[\\s\\S]*?</article>'), '');

// Reiter
const STEPS = ['count', 'place', 'convert', 'chars', 'compare', 'finish'];
assert.equal((html.match(/role="tab"/g) || []).length, 6);
assert.deepEqual([...html.matchAll(/<button[^>]*role="tab"[^>]*data-tab="([a-z]+)"/g)].map((m) => m[1]), STEPS);
STEPS.forEach((id) => { assert.match(html, new RegExp('<section id="' + id + '"[^>]*data-panel="' + id + '"')); });
assert.equal((html.match(/data-panel=/g) || []).length, 6);
['1 Zählen mit zwei Ziffern', '2 Stellenwerte', '3 Dezimalzahlen umwandeln', '4 Buchstaben als Bitfolgen', '5 ASCII und Unicode vergleichen', '6 Abschlussquiz']
  .forEach((text) => assert.ok(html.includes('>' + text + '<'), text));
STEPS.slice(0, 5).forEach((id) => assert.equal(count(panel(id), 'data-flow="' + id + '"'), 1, 'data-flow in ' + id));
assert.equal(count(panel('finish'), 'data-flow'), 0);
assert.doesNotMatch(html, /<button[^>]*\bdisabled\b/);

// Seitengerüst und Navigation
assert.match(html, /<html lang="de">/);
assert.match(html, /<meta charset="utf-8">/);
assert.match(html, /<title>Aufgabe 1 – Binärzahlen und Zeichencodierung \| Informatik 11<\/title>/);
const topbar = html.match(/<nav class="topbar" aria-label="Navigation">([\s\S]*?)<\/nav>/)[1];
assert.deepEqual([...topbar.matchAll(/<a class="back-link" href="([^"]*)">([^<]*)<\/a>/g)].map((m) => [m[1], m[2]]), [
  ['../index.html', 'Zur Aufgabenübersicht'], ['../../../../', 'Startseite'],
]);
assert.match(html, /<body class="perceptron-page knn-page binary-page">/);
['../../../../styles.css?v=20260707', '../1-Kuenstliche-Intelligenz/perzeptron/task5.css?v=20260926a', '../1-Kuenstliche-Intelligenz/knn/task7.css?v=20261003a', 'binaer/task1.css?v=20261005a', 'binaer/ui/task1.mjs?v=20261005a']
  .forEach((link) => {
    assert.ok(html.includes('"' + link + '"'), link + ' fehlt im HTML');
    assert.ok(existsSync(new URL('../../' + link.split('?')[0], import.meta.url)), link + ' existiert nicht');
  });
// Alle relativen Importe in binaer/ui/*.mjs lösen auf
const uiDir = new URL('../ui/', import.meta.url);
readdirSync(uiDir).filter((name) => name.endsWith('.mjs')).forEach((name) => {
  const source = readFileSync(new URL(name, uiDir), 'utf8');
  [...source.matchAll(/from '(\.[^']+)'/g)].forEach((m) => assert.ok(existsSync(new URL(m[1], uiDir)), name + ': Import ' + m[1] + ' fehlt'));
});
assert.ok(ui.includes("from '../../../1-Kuenstliche-Intelligenz/perzeptron/ui/semantic-answer.mjs'"));

// Abschlussquiz
const finish = panel('finish');
['final-quiz', 'quiz-form', 'quiz-progress', 'quiz-summary', 'reset-progress'].forEach((id) => assert.match(finish, new RegExp('id="' + id + '"'), id));
const quiz = ui.slice(ui.indexOf('const QUIZ = ['), ui.indexOf('const OVERVIEW'));
assert.equal(count(quiz, 'hint:'), 6);
assert.equal(count(quiz, 'q: '), 6);
const quizQuestions = quiz.split(/\n  \{\n    q: /).slice(1);
assert.equal(quizQuestions.length, 6);
let multi = 0;
quizQuestions.forEach((block, index) => {
  const right = count(block, 'correct: true');
  const wrong = count(block, 'correct: false');
  assert.equal(count(block, 'why:'), wrong, 'Frage ' + (index + 1) + ': jede falsche Option braucht why');
  assert.ok(right >= 1 && wrong >= 1);
  if (right > 1) multi++;
});
assert.ok(multi >= 2, 'mindestens zwei Fragen mit mehreren richtigen Antworten');

// Auswahlfragen außerhalb des Quiz: eigener Button und eigene Rückmeldung
[['check-new-place', 'new-place-feedback'], ['check-carry', 'carry-feedback'], ['check-inspector', 'inspector-feedback'], ['check-after', 'after-feedback'], ['check-target-5', 'target-5-feedback'], ['check-target-12', 'target-12-feedback'], ['check-max', 'max-feedback'], ['check-compare-answer', 'compare-answer-feedback']].forEach(([button, feedbackId]) => {
  assert.match(html, new RegExp('id="' + button + '"'), button);
  assert.match(html, new RegExp('id="' + feedbackId + '" class="feedback" role="status" aria-live="polite" hidden'), feedbackId);
});
['newPlace', 'carry', 'inspectorOptions'].forEach((key) => assert.match(html, new RegExp('data-mc="' + key + '"'), key));

// Merke-Kästen sind anfangs verborgen
['place-remember', 'convert-remember', 'charset-remember', 'unicode-remember'].forEach((id) => assert.match(element(id), /\bhidden\b/, id));

// Begriffsreihenfolge: Bit, Byte, Stellenwert und Zweierpotenz erst im Merke-Kasten nach den Lampen
const banned = /\bBit|Byte|Stellenwert|Zweierpotenz/;
assert.doesNotMatch(panel('count'), banned, 'Reiter 1');
const mcData = ui.slice(ui.indexOf('const MC = {'), ui.indexOf('inspectorOptions: {'));
assert.doesNotMatch(mcData, banned, 'MC-Daten zu Reiter 1');
const counterCode = ui.slice(ui.indexOf('const COUNTER_START'), ui.indexOf('/* ---------- Reiter 2'));
assert.doesNotMatch(counterCode, banned, 'Zählwerk-Rückmeldungen');
assert.doesNotMatch(withoutBlock(panel('place'), 'place-remember'), banned, 'Reiter 2 außerhalb von #place-remember');
assert.match(element('place-remember'), /hidden/);
assert.match(html.match(/<article id="place-remember"[\s\S]*?<\/article>/)[0], /Stellenwert/);
const lampCode = ui.slice(ui.indexOf('const TARGETS'), ui.indexOf('/* ---------- Reiter 3'));
assert.doesNotMatch(lampCode, banned, 'Rückmeldungen Reiter 2');
// Das Umrechnungsverfahren steht nur in den Hilfen und im Merke-Kasten von Reiter 3
const phrase = 'größten Stellenwert';
assert.equal(count(panel('count'), phrase) + count(panel('place'), phrase), 0);
const convert = panel('convert');
const convertOutside = withoutBlock(convert, 'convert-remember').replace(/<details>[\s\S]*?<\/details>/g, '');
assert.ok(!convertOutside.includes(phrase), 'Verfahren außerhalb der Hilfen in Reiter 3');
assert.ok(convert.includes(phrase));
['chars', 'compare', 'finish'].forEach((id) => assert.ok(!panel(id).includes('größten passenden') || id === 'finish'));

// Tabelle in Reiter 3
const table = html.match(/<table id="convert-table"[^>]*>[\s\S]*?<\/table>/)[0];
assert.match(table, /class="knn-table bin-table"/);
['2⁷ = 128', '2⁶ = 64', '2⁵ = 32', '2⁴ = 16', '2³ = 8', '2² = 4', '2¹ = 2', '2⁰ = 1'].forEach((text) => assert.ok(table.includes('>' + text + '<'), text));
assert.match(table, /7 \(Beispiel\)/);
assert.match(table.match(/<tr class="example-row">[\s\S]*?<\/tr>/)[0].replace(/<span[^>]*>\d+<\/span>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' '), /0 0 0 0 0 1 1 1/);
assert.deepEqual([...table.matchAll(/<tr data-number="(\d+)">/g)].map((m) => Number(m[1])), ROWS);
[...table.matchAll(/<tr data-number="\d+">[\s\S]*?<\/tr>/g)].forEach((m) => {
  assert.equal(count(m[0], 'class="bit-toggle"'), 8);
  assert.equal(count(m[0], 'row-check'), 1);
});
ROWS.forEach((row) => assert.match(table, new RegExp('id="row-feedback-' + row + '" class="feedback" role="status" aria-live="polite" hidden')));
assert.match(html, /id="convert-progress"[^>]*role="status"/);

// Lampen und Animationen
const lamps = html.match(/<div id="bit-lamps"[\s\S]*?<\/div>\s*<p id="lamp-sum"/)[0];
assert.deepEqual([...lamps.matchAll(/<button type="button" class="bit-lamp" data-value="(\d+)"/g)].map((m) => Number(m[1])), [128, 64, 32, 16, 8, 4, 2, 1]);
assert.match(html, /id="lamp-sum"[^>]*role="status"/);
assert.match(html, /<svg id="counter-plot"[^>]*role="img"[^>]*aria-labelledby="counter-plot-title counter-plot-desc"/);
['counter-step', 'counter-play', 'counter-reset', 'counter-status', 'ascii-pipeline', 'ascii-char', 'ascii-number', 'ascii-bits', 'ascii-stored', 'ascii-step-status', 'next-ascii-step', 'ascii-table', 'unicode-pipeline', 'unicode-step-status', 'next-unicode-step', 'inspector-input', 'inspector-table', 'inspector-summary']
  .forEach((id) => assert.match(html, new RegExp('id="' + id + '"'), id));
assert.match(html, /<input id="inspector-input"[^>]*maxlength="20"[^>]*placeholder="Grüße 😀"/);
const ascii = html.match(/<table id="ascii-table"[\s\S]*?<\/table>/)[0];
ASCII_EXCERPT.forEach((entry) => { assert.ok(ascii.includes('>' + entry.bits + '<'), entry.bits); });
assert.equal(count(ascii, 'aria-label="weitere Zeichen"'), 5);

// Beschreibe-Aufgabe
assert.match(ui, /const TASK_ID = 'inf11-cod-a1-ascii-unicode'/);
assert.equal(count(ui, 'inf11-cod-a1-ascii-unicode'), 1);
assert.match(ui, /const STORAGE_KEY = 'informatik11-codierung-aufgabe1-v1'/);
assert.match(html, /<textarea id="compare-answer" maxlength="600"/);
assert.match(html, /id="compare-counter"/);
assert.match(html, /class="privacy"/);

// Kein Sicherungsblatt, kein Lehrercode, kein Verweis auf das Ausgangsmaterial
[html, ui, css].forEach((text) => {
  assert.doesNotMatch(text, /solution-download|solution-code|unlockSolution|Lehrercode/);
  assert.doesNotMatch(text, /material-codierung|AB1/);
});

// Menü
const ki = menu.indexOf('id="topic-ki"');
const codierung = menu.indexOf('id="topic-codierung"');
assert.ok(ki > 0 && codierung > ki, 'topic-codierung steht nach topic-ki');
assert.match(menu, /<h2 id="topic-codierung">2\. Codierung und Verschlüsselung<\/h2>/);
assert.match(menu, /<a class="module-button" href="2-Codierung-und-Verschluesselung\/aufgabe1\.html">\s*<strong>Aufgabe 1<\/strong>\s*<span>Binärzahlen und Zeichencodierung<\/span>/);

// Zählwerk-Pfeile aus Kastenkoordinaten
const odometer = read('../ui/odometer.mjs');
assert.match(odometer, /boxCenter\(fromPosition\)/);
assert.match(odometer, /\[x2, top\]/);

console.log('HTML-Vertrag, Begriffsreihenfolge, Merke-Kästen und Menüeintrag von Aufgabe 1 sind korrekt.');
