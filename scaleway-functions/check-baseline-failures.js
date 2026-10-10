'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const repo = path.resolve(__dirname, '..');
const log = JSON.parse(fs.readFileSync(path.join(__dirname, 'website-migration-log.json'), 'utf8'));
const root = path.join(repo, 'tmp/scaleway-baseline-tests');
const files = [
  'faecher/informatik/klasse-11/1-Kuenstliche-Intelligenz/perzeptron/tests/task5-contract.test.mjs',
  'faecher/physik/klasse-11/1-Kreisbewegungen/tests/kraefte-bewegung-config.test.mjs',
  'faecher/physik/klasse-11/1-Kreisbewegungen/tests/zentripetalkraft-config.test.mjs'
];
const changed = new Set(log.files.map(entry => entry.file));
const result = [];
for (const file of files) {
  const source = fs.readFileSync(path.join(repo, file), 'utf8');
  const resources = [file, ...[...source.matchAll(/new URL\(['"]([^'"]+)['"], import\.meta\.url\)/g)]
    .map(match => path.posix.normalize(path.posix.join(path.posix.dirname(file), match[1])))];
  for (const resource of resources) {
    if (!fs.existsSync(path.join(repo, resource))) continue;
    if (!changed.has(resource)) execFileSync('git', ['diff', '--quiet', '--', resource], { cwd: repo });
    const target = path.join(root, resource);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(changed.has(resource) ? path.join(log.backupRoot, 'original', resource) : path.join(repo, resource), target);
  }
  let output;
  try { execFileSync(process.execPath, [path.join(root, file)], { cwd: root, stdio: 'pipe' });
    throw new Error('Ausgangstest unerwartet erfolgreich: ' + file); }
  catch (error) {
    assert.equal(error.status, 1, file);
    output = String(error.stderr);
    assert.match(output, /AssertionError/);
  }
  const reason = file.includes('task5-contract') ? 'CSV-Kopfzeile Zahnlaenge/Augengroesse statt Umlauten' :
    file.includes('kraefte-bewegung') ? 'Veraltete Koordinatenprüfung der Sicherungsblatt-Grafik' :
      'Veralteter Filter der Eyebrow-Überschrift';
  result.push({ file, failedBeforeMigration: true, reason });
}
fs.writeFileSync(path.join(repo, 'tmp/scaleway-baseline-failures.json'), JSON.stringify(result, null, 2) + '\n');
console.log('Alle drei Fehler mit dem unveränderten Ausgangsstand reproduziert; unabhängig von der Migration.');
