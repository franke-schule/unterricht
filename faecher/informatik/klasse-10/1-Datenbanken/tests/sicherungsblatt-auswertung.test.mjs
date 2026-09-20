import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { access } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const folder = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const pages = ['aufgabe1.html', 'aufgabe2.html', 'aufgabe3.html', 'aufgabe4.html'];

function summaryPanel(html, page) {
  const start = html.indexOf('<section id="step-summary"');
  assert.notEqual(start, -1, `${page}: Auswertungsreiter fehlt`);
  const end = html.indexOf('\n        </section>', start);
  assert.notEqual(end, -1, `${page}: Auswertungsreiter ist nicht abgeschlossen`);
  return html.slice(start, end);
}

for (const page of pages) {
  const html = await readFile(resolve(folder, page), 'utf8');
  const panel = summaryPanel(html, page);

  assert.equal(
    (html.match(/class="solution-download"/g) || []).length, 2,
    `${page}: Sicherungsblatt steht im letzten Arbeitsreiter und in der Auswertung`
  );
  assert.match(panel, /class="solution-download"/, `${page}: Auswertungsreiter enthält das Sicherungsblatt`);

  const codes = [...html.matchAll(/unlockSolution\(event, '([^']+)'/g)].map(([, code]) => code);
  assert.equal(codes.length, 2, `${page}: beide Formulare rufen unlockSolution auf`);
  assert.equal(codes[0], codes[1], `${page}: beide Kopien verwenden denselben Lehrercode`);

  const files = [...html.matchAll(/href="(sicherungsblatt-[^"]+\.pdf)"/g)].map(([, file]) => file);
  assert.equal(files.length, 2, `${page}: beide Kopien verlinken ein Sicherungsblatt`);
  assert.equal(files[0], files[1], `${page}: beide Kopien verlinken dieselbe Datei`);
  await access(resolve(folder, files[0]));

  // Alle Panels liegen gleichzeitig im DOM, deshalb braucht die zweite Kopie eigene IDs.
  for (const id of ['solution-download-title', 'solution-code', 'solution-code-message', 'solution-download-link']) {
    assert.equal(
      (html.match(new RegExp(`id="${id}"`, 'g')) || []).length, 1,
      `${page}: ${id} bleibt eindeutig`
    );
    assert.match(panel, new RegExp(`id="${id}-summary"`), `${page}: Auswertung verwendet ${id}-summary`);
  }
  assert.match(panel, /for="solution-code-summary"/, `${page}: Label der Auswertung zeigt auf das eigene Eingabefeld`);
  assert.match(panel, /name="solution-code"/, `${page}: unlockSolution liest das Feld über den Namen aus`);
  assert.match(
    panel, /unlockSolution\(event, '[^']+', 'solution-download-link-summary', 'solution-code-message-summary'\)/,
    `${page}: Auswertung schaltet ihren eigenen Download frei`
  );
}

const sharedCss = await readFile(resolve(folder, 'redundanzen.css'), 'utf8');
assert.match(sharedCss, /@media print \{[\s\S]*\.solution-download[^}]*display: none !important;/);

console.log('Sicherungsblatt in Arbeitsreiter und Auswertung geprüft');
