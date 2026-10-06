import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const html = readFileSync(new URL('../../aufgabe7.html', import.meta.url), 'utf8');
const ui = readFileSync(new URL('../ui/task7.mjs', import.meta.url), 'utf8');
const menu = readFileSync(new URL('../../../index.html', import.meta.url), 'utf8');

const panel = (id) => {
  const match = html.match(new RegExp('<section id="' + id + '"[\\s\\S]*?</section>(?=\\s*(?:<!--|<section|</main>))'));
  assert.ok(match, 'Panel ' + id + ' fehlt');
  return match[0];
};
const element = (id) => {
  const match = html.match(new RegExp('<(article|div|section)[^>]*id="' + id + '"[^>]*>'));
  assert.ok(match, '#' + id + ' fehlt');
  return match[0];
};
const count = (text, needle) => text.split(needle).length - 1;

// Reiter
const STEPS = ['discover', 'neighbours', 'euclid', 'manhattan', 'apply', 'finish'];
assert.equal((html.match(/role="tab"/g) || []).length, 6);
STEPS.forEach((id) => { assert.match(html, new RegExp('data-tab="' + id + '"')); assert.match(html, new RegExp('<section id="' + id + '"[^>]*data-panel="' + id + '"')); });
assert.equal((html.match(/data-panel=/g) || []).length, 6);
['1 Welche Größe passt?', '2 Die k nächsten Nachbarn', '3 Euklidischer Abstand', '4 Manhattan-Metrik', '5 Schulshirts klassifizieren', '6 Abschlussquiz'].forEach((text) => assert.ok(html.includes('>' + text + '<'), text));
STEPS.slice(0, 5).forEach((id) => assert.equal(count(panel(id), 'data-flow="' + id + '"'), 1, 'data-flow in ' + id));
assert.equal(count(panel('finish'), 'data-flow'), 0);
assert.doesNotMatch(html, /<button[^>]*\bdisabled\b/);

// Seitengerüst und Navigation
assert.match(html, /<html lang="de">/);
assert.match(html, /<meta charset="utf-8">/);
assert.match(html, /<title>Aufgabe 7 – Der k-nächste-Nachbarn-Algorithmus \| Informatik 11<\/title>/);
const topbar = html.match(/<nav class="topbar" aria-label="Navigation">([\s\S]*?)<\/nav>/)[1];
assert.deepEqual([...topbar.matchAll(/<a class="back-link" href="([^"]*)">([^<]*)<\/a>/g)].map((m) => [m[1], m[2]]), [
  ['../index.html', 'Zur Aufgabenübersicht'], ['aufgabe6.html', 'Zu Aufgabe 6'], ['../../../../', 'Startseite'],
]);
assert.match(html, /<body class="perceptron-page knn-page">/);
assert.match(html, /knn\/task7\.css\?v=20261003a/);
assert.match(html, /knn\/ui\/task7\.mjs\?v=20261006q/);
assert.match(html, /perzeptron\/task5\.css\?v=20260926a/);
['knn/task7.css', 'knn/ui/task7.mjs', 'perzeptron/task5.css', 'knn/ui/card-slots.mjs', 'knn/ui/knn-plot.mjs', 'knn/logic/knn.mjs', 'knn/data/shirts.mjs', 'knn/data/task7.mjs', 'perzeptron/ui/semantic-answer.mjs', 'perzeptron/logic/perceptron.mjs']
  .forEach((path) => assert.ok(existsSync(new URL('../../' + path, import.meta.url)), path + ' fehlt'));

// Abschlussquiz
assert.match(panel('finish'), /id="final-quiz"/);
assert.match(panel('finish'), /id="reset-progress"/);

// Merke-Kästen sind anfangs verborgen
['knn-remember', 'tie-remember', 'euclid-remember', 'manhattan-remember', 'metric-remember'].forEach((id) => assert.match(element(id), /\bhidden\b/, id));

// Formeln erscheinen erst nach der jeweiligen Aufgabe (Merke-Kasten) und im Abschlussreiter
const euclidFormula = '√((x₂ − x₁)²';
const manhattanFormula = '|x₂ − x₁| + |y₂ − y₁|';
[[euclidFormula, 'euclid-remember'], [manhattanFormula, 'manhattan-remember']].forEach(([formula, id]) => {
  const rememberBox = html.match(new RegExp('<article id="' + id + '"[\\s\\S]*?</article>'))[0];
  assert.ok(rememberBox.includes(formula), id);
  const remaining = html.replace(rememberBox, '').replace(panel('finish'), '');
  assert.ok(!remaining.includes(formula), formula + ' steht außerhalb von ' + id + ' und Reiter 6');
  assert.ok(panel('finish').includes(formula), formula + ' fehlt in Reiter 6');
});

// Reiter 1 verwendet noch keine Fachbegriffe des Algorithmus
const discover = panel('discover');
assert.doesNotMatch(discover, /KNN/);
assert.doesNotMatch(discover, /Nachbar/);
assert.doesNotMatch(discover, /Abstandsmaß/);
assert.doesNotMatch(ui.slice(ui.indexOf('discoverReasons: {'), ui.indexOf('neighboursReasons: {')), /KNN|Nachbar|Abstandsmaß/);

// Kein Sicherungsblatt, kein Lehrercode
assert.doesNotMatch(html, /solution-download|solution-code|Lehrercode/);
assert.doesNotMatch(ui, /solution-download|solution-code|unlockSolution/);

// Skriptserver, Speicherung und Wiederverwendung
assert.match(ui, /'11-7-1'/);
assert.match(ui, /informatik11-knn-aufgabe7-v1/);
assert.match(ui, /from '\.\.\/\.\.\/perzeptron\/ui\/semantic-answer\.mjs'/);
assert.match(ui, /from '\.\.\/\.\.\/perzeptron\/logic\/perceptron\.mjs'/);
assert.match(html, /<textarea id="apply-answer" maxlength="600"/);
assert.match(html, /id="apply-counter"/);
assert.match(html, /class="privacy"/);

// Jede Auswahlfrage außerhalb des Quiz hat einen eigenen Prüfen-Button und eine eigene Rückmeldung
[['check-discover-reasons', 'discover-reasons-feedback'], ['check-neighbours-reasons', 'neighbours-reasons-feedback'], ['check-tie', 'tie-feedback'], ['check-metric', 'metric-feedback']].forEach(([button, feedbackId]) => {
  assert.match(html, new RegExp('id="' + button + '"'));
  assert.match(html, new RegExp('id="' + feedbackId + '" class="feedback" role="status" aria-live="polite" hidden'));
});

// Grafiken: Rolle, Titel, Beschreibung
['discover-plot', 'neighbours-plot', 'euclid-plot', 'manhattan-plot', 'compare-plot'].forEach((id) => {
  assert.match(html, new RegExp('<svg id="' + id + '"[^>]*role="img"[^>]*aria-labelledby="' + id + '-title ' + id + '-desc"'));
  assert.match(html, new RegExp('<title id="' + id + '-title">'));
  assert.match(html, new RegExp('<desc id="' + id + '-desc">'));
});

// Menü: Aufgabe 7 steht direkt nach Aufgabe 6
const positions = [0, 1, 2, 3, 4, 5, 6, 7].map((n) => menu.indexOf('1-Kuenstliche-Intelligenz/aufgabe' + n + '.html"'));
assert.ok(positions[7] > positions[6] && positions[6] > positions[5] && positions[5] > positions[4], 'Menüreihenfolge');
assert.match(menu, /<a class="module-button" href="1-Kuenstliche-Intelligenz\/aufgabe7\.html">\s*<strong>Aufgabe 7<\/strong>\s*<span>k-nächste Nachbarn: Idee und Abstand<\/span>/);

console.log('HTML-Vertrag, Navigation, Merke-Kästen, Formeln und Menüeintrag von Aufgabe 7 sind korrekt.');
