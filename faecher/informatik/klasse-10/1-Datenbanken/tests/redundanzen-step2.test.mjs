import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const folder = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const html = await readFile(resolve(folder, 'aufgabe2.html'), 'utf8');
const module_ = await readFile(resolve(folder, 'redundanzen.js'), 'utf8');
const css = await readFile(resolve(folder, 'redundanzen.css'), 'utf8');

// Die Reihenfolge muss auf den ersten Blick erkennbar sein: erst die Tabelle ändern, dann die Frage.
assert.match(html, /<strong>Zuerst: Trage<\/strong> in der Tabelle unten/);
assert.match(html, /<strong>Danach: Beantworte<\/strong> die Frage unter der Tabelle/);
assert.match(html, /<h3>Danach: Welches Problem ist entstanden\?<\/h3>/);
assert.match(html, /id="step2-gate" class="task-gate" aria-live="polite"/);
assert.match(html, /id="step2-question-card"/);

// Die Frage bleibt gesperrt, solange keine Adresse geändert wurde.
assert.match(module_, /function emailsTouched\(\)/);
assert.match(module_, /input\.disabled = !unlocked/);
assert.match(module_, /getElementById\("check-step2-problem"\)\.disabled = !unlocked/);
assert.match(module_, /getElementById\("step2-gate"\)\.hidden = unlocked/);
assert.equal((module_.match(/updateStep2Gate\(\)/g) || []).length, 3, 'Gate wird definiert, beim Rendern und bei jeder Eingabe aktualisiert');

// Sperre muss auch ohne Farbwahrnehmung erkennbar sein (Text im Hinweis, deaktivierte Bedienelemente).
assert.match(css, /\.task-card\.locked \{[^}]*border-style: dashed/);
assert.match(css, /\.task-gate\[hidden\] \{ display: none; \}/);
assert.match(css, /\.primary-button:disabled \{[^}]*cursor: not-allowed/);

// Auflösungen dürfen nicht vorab sichtbar sein: display-Regeln müssen das hidden-Attribut respektieren.
assert.match(css, /\.concept-reveal\[hidden\], \.split-visual\[hidden\] \{ display: none; \}/);

console.log('Aufgabe 2, Schritt 2: Reihenfolge, Sperre und verdeckte Auflösungen geprüft');
