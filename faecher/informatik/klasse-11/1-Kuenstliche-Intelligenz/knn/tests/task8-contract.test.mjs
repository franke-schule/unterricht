import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const html = readFileSync(new URL('../../aufgabe8.html', import.meta.url), 'utf8');
const ui = readFileSync(new URL('../ui/task8.mjs', import.meta.url), 'utf8');
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
const article = (id) => {
  const match = html.match(new RegExp('<article id="' + id + '"[\\s\\S]*?</article>'));
  assert.ok(match, '#' + id + ' fehlt');
  return match[0];
};
const count = (text, needle) => text.split(needle).length - 1;

// Reiter
const STEPS = ['training', 'kvalue', 'validation', 'testing', 'data', 'regression', 'finish'];
assert.equal((html.match(/role="tab"/g) || []).length, 7);
STEPS.forEach((id) => { assert.match(html, new RegExp('data-tab="' + id + '"')); assert.match(html, new RegExp('<section id="' + id + '"[^>]*data-panel="' + id + '"')); });
assert.equal((html.match(/data-panel=/g) || []).length, 7);
['1 Was passiert beim Training?', '2 Zu klein oder zu groß?', '3 k mit Validierungsdaten bestimmen', '4 Das Modell testen', '5 Daten als Fehlerquelle', '6 Für die Schnellen: Regression', '7 Abschlussquiz']
  .forEach((text) => assert.ok(html.includes('>' + text + '<'), text));
assert.match(html, /aria-label="Lernschritte zu k, Test und Grenzen des KNN-Algorithmus"/);
STEPS.slice(0, 6).forEach((id) => assert.equal(count(panel(id), 'data-flow="' + id + '"'), 1, 'data-flow in ' + id));
assert.equal(count(panel('finish'), 'data-flow'), 0);
assert.doesNotMatch(html, /<button[^>]*\bdisabled\b/);
assert.doesNotMatch(html, /id="apply"/, 'Die ID apply ist durch task7.css (sticky) belegt');
assert.match(ui, /Direkt zum Abschlussquiz/);

// Seitengerüst und Navigation
assert.match(html, /<html lang="de">/);
assert.match(html, /<meta charset="utf-8">/);
assert.match(html, /<title>Aufgabe 8 – KNN: k wählen, testen und Grenzen erkennen \| Informatik 11<\/title>/);
const topbar = html.match(/<nav class="topbar" aria-label="Navigation">([\s\S]*?)<\/nav>/)[1];
assert.deepEqual([...topbar.matchAll(/<a class="back-link" href="([^"]*)">([^<]*)<\/a>/g)].map((m) => [m[1], m[2]]), [
  ['../index.html', 'Zur Aufgabenübersicht'], ['aufgabe7.html', 'Zu Aufgabe 7'], ['../../../../', 'Startseite'],
]);
assert.match(html, /<body class="perceptron-page knn-page">/);
assert.match(html, /\.\.\/\.\.\/\.\.\/\.\.\/styles\.css\?v=20260707/);
assert.match(html, /perzeptron\/task5\.css\?v=20260926a/);
assert.match(html, /knn\/task7\.css\?v=20261003a/);
assert.match(html, /knn\/task8\.css\?v=20261004a/);
assert.match(html, /knn\/ui\/task8\.mjs\?v=20261006q/);
['knn/task7.css', 'knn/task8.css', 'knn/ui/task8.mjs', 'perzeptron/task5.css', 'knn/ui/card-slots.mjs', 'knn/ui/knn-plot.mjs', 'knn/logic/knn.mjs', 'knn/logic/evaluation.mjs',
  'knn/data/shirts.mjs', 'knn/data/task8.mjs', 'perzeptron/ui/semantic-answer.mjs', 'perzeptron/logic/perceptron.mjs', 'aufgabe7.html']
  .forEach((path) => assert.ok(existsSync(new URL('../../' + path, import.meta.url)), path + ' fehlt'));

// Abschlussquiz
assert.match(panel('finish'), /id="final-quiz"/);
assert.match(panel('finish'), /id="reset-progress"/);

// Merke-Kästen sind anfangs verborgen
['training-remember', 'phases-remember', 'k-remember', 'validation-remember', 'test-remember', 'norm-remember', 'regression-remember']
  .forEach((id) => assert.match(element(id), /\bhidden\b/, id));

// Die Normierungsformel erscheint erst im Merke-Kasten und im Abschlussreiter
const formula = '(x − min) / (max − min)';
assert.ok(article('norm-remember').includes(formula));
assert.ok(!html.replace(article('norm-remember'), '').replace(panel('finish'), '').includes(formula), 'Formel steht außerhalb von norm-remember und Reiter 7');
assert.ok(panel('finish').includes(formula));

// „Hyperparameter“ steht außerhalb von Reiter 7 nur im Merke-Kasten der Validierung
assert.ok(article('validation-remember').includes('Hyperparameter'));
assert.ok(!html.replace(article('validation-remember'), '').replace(panel('finish'), '').includes('Hyperparameter'), 'Hyperparameter zu früh');
assert.ok(panel('finish').includes('Hyperparameter'));

// „Ausreißer“ steht in den Reitern 1 und 2 nur im Merke-Kasten k-remember
['training', 'kvalue'].forEach((id) => {
  const rest = panel(id).replace(article('k-remember'), '');
  assert.ok(!rest.includes('Ausreißer'), 'Ausreißer zu früh in ' + id);
});
assert.ok(article('k-remember').includes('Ausreißer'));

// Auch die Texte, die aus dem Skript in die Reiter 1 bis 5 kommen, nehmen die Begriffe nicht vorweg
const mcSource = ui.slice(ui.indexOf('const MC = {'), ui.indexOf('const PHASE_CARDS'));
assert.doesNotMatch(mcSource, /Ausreißer|Hyperparameter|\(x − min\)/);
const phaseSource = ui.slice(ui.indexOf('function checkPhases'), ui.indexOf('function setupTraining'));
assert.doesNotMatch(phaseSource, /Ausreißer|Hyperparameter/);

// Kein Sicherungsblatt, kein Lehrercode
assert.doesNotMatch(html, /solution-download|solution-code|Lehrercode|unlockSolution/);
assert.doesNotMatch(ui, /solution-download|solution-code|unlockSolution/);

// Skriptserver, Speicherung und Wiederverwendung
assert.match(ui, /'11-8-1'/);
assert.match(ui, /informatik11-knn-aufgabe8-v1/);
assert.match(ui, /from '\.\.\/\.\.\/perzeptron\/ui\/semantic-answer\.mjs'/);
assert.match(ui, /from '\.\.\/\.\.\/perzeptron\/logic\/perceptron\.mjs'/);
assert.match(ui, /from '\.\/knn-plot\.mjs\?v=20261004a'/);
assert.match(ui, /from '\.\/card-slots\.mjs'/);
assert.doesNotMatch(ui, /from '\.\/task7\.mjs|from '\.\.\/\.\.\/entscheidungbaeume/);
assert.doesNotMatch(ui, /task3c/);
assert.match(html, /<textarea id="validation-answer" maxlength="600"/);
assert.match(html, /id="validation-counter"/);
assert.match(html, /class="privacy"/);

// Jede Auswahlfrage außerhalb des Quiz hat einen eigenen Prüfen-Button und eine eigene Rückmeldung
[['check-training', 'training-feedback'], ['check-outlier', 'outlier-feedback'], ['check-largek', 'largek-feedback'], ['check-validation', 'validation-feedback'],
  ['check-uneven', 'uneven-feedback'], ['check-bias', 'bias-feedback'], ['check-scale', 'scale-feedback']].forEach(([button, feedbackId]) => {
  assert.match(html, new RegExp('id="' + button + '"'));
  assert.match(html, new RegExp('id="' + feedbackId + '" class="feedback" role="status" aria-live="polite" hidden'));
});
assert.equal((html.match(/data-mc="/g) || []).length, 7, 'sieben Auswahlfragen mit Kästchen');
assert.doesNotMatch(html, /type="radio"/);

// Grafiken: Rolle, Titel, Beschreibung
const SVGS = ['phase-plot', 'outlier-plot', 'largek-plot', 'example-plot', 'split-pie', 'validation-plot', 'regression-plot', 'house-plot'];
assert.equal((html.match(/<svg id=/g) || []).length, SVGS.length, 'acht SVGs');
SVGS.forEach((id) => {
  assert.match(html, new RegExp('<svg id="' + id + '"[^>]*role="img"[^>]*aria-labelledby="' + id + '-title ' + id + '-desc"'));
  assert.match(html, new RegExp('<title id="' + id + '-title">'));
  assert.match(html, new RegExp('<desc id="' + id + '-desc">'));
});

// Phasenmodell: Pfeile enden genau am Kastenrand (Koordinaten aus der Spezifikation, refX = 10)
assert.match(html, /<marker id="phase-arrow" markerUnits="userSpaceOnUse" markerWidth="10" markerHeight="10" refX="10" refY="5" orient="auto">/);
[
  'x1="130" y1="84" x2="130" y2="150"', 'x1="240" y1="170" x2="400" y2="170"', 'x1="400" y1="194" x2="240" y2="194"',
  'points="500,150 500,52 220,52"', 'x1="520" y1="214" x2="520" y2="256"',
].forEach((coordinates) => assert.ok(html.includes(coordinates), coordinates));
assert.equal(count(html, 'marker-end="url(#phase-arrow)"'), 5);

// Kreisdiagramm: Die Führungslinien enden auf dem Kreisbogen (Mittelpunkt 260|125, r 105)
[[185.75, 199.25], [185.75, 50.75]].forEach(([x, y]) => assert.ok(Math.abs(Math.hypot(x - 260, y - 125) - 105) < 0.01, 'Führungslinie ' + x + '|' + y));

// Reiter 4: Matrix
assert.match(html, /id="matrix"[^>]*>/);
assert.match(html, /id="check-matrix"/);
assert.match(html, /id="check-accuracy"/);
assert.match(ui, /name = key/);
// Im Zweig „leere Felder“ darf kein ausgefülltes Feld nur wegen „ausgefüllt“ als richtig (is-correct) markiert werden
const emptyBranch = ui.slice(ui.indexOf('if (fields.some((field) => field.value === null))'), ui.indexOf('const entered ='));
assert.match(emptyBranch, /Trage in jedes Feld eine Zahl ein/);
assert.doesNotMatch(emptyBranch, /mark\(|classList\.(toggle|add)\('is-correct'/);
assert.match(emptyBranch, /classList\.remove\('is-correct'\)/);

// Menü: Aufgabe 8 steht direkt nach Aufgabe 7
const positions = [5, 6, 7, 8].map((n) => menu.indexOf('1-Kuenstliche-Intelligenz/aufgabe' + n + '.html"'));
assert.ok(positions[3] > positions[2] && positions[2] > positions[1] && positions[1] > positions[0] && positions[0] > 0, 'Menüreihenfolge');
assert.match(menu, /<a class="module-button" href="1-Kuenstliche-Intelligenz\/aufgabe8\.html">\s*<strong>Aufgabe 8<\/strong>\s*<span>k-nächste Nachbarn: k wählen, testen und Grenzen erkennen<\/span>/);
assert.ok(menu.indexOf('aufgabe8.html"') > menu.indexOf('aufgabe7.html"'));

// Es entstehen weder Sicherungsblatt noch Wiederholungs-Quiz
['aufgabe8-quiz.html', 'aufgabe8-quiz-loeschen.txt', 'sicherungsblatt-aufgabe-8-loesungen.tex', 'sicherungsblatt-aufgabe-8-loesungen.pdf']
  .forEach((path) => assert.ok(!existsSync(new URL('../../' + path, import.meta.url)), path + ' darf nicht existieren'));

console.log('HTML-Vertrag, Navigation, Merke-Kästen, Begriffsreihenfolge, Grafiken und Menüeintrag von Aufgabe 8 sind korrekt.');
