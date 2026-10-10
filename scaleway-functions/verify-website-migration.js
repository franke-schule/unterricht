'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { extractFunction } = require('./migrate-website');
const repo = path.resolve(__dirname, '..');
const logPath = path.join(__dirname, 'website-migration-log.json');
const log = JSON.parse(fs.readFileSync(logPath, 'utf8'));
const hash = data => crypto.createHash('sha256').update(data).digest('hex');
const checkRoot = path.join(repo, 'tmp', 'scaleway-migration-verification');
fs.mkdirSync(checkRoot, { recursive: true });
for (const [index, entry] of log.files.entries()) {
  const original = fs.readFileSync(path.join(log.backupRoot, 'original', entry.file));
  assert.equal(hash(original), entry.beforeSha256, entry.file + ': Sicherung');
  const current = fs.readFileSync(path.join(repo, entry.file));
  const code = current.toString('utf8');
  assert.ok(!code.includes('script.google.com'), entry.file + ': Google-Endpunkt');
  assert.ok(!/code-result|createJsonpUrl|__handleTask6CodeResult/.test(code), entry.file + ': alter Transport');
  entry.afterSha256 = hash(current);
  for (const match of code.matchAll(/(?:from\s*|import\s*\(\s*)['"]([^'"]+)['"]/g)) {
    const specifier = match[1].split(/[?#]/)[0];
    if (specifier.startsWith('.')) assert.ok(fs.existsSync(path.resolve(repo, path.dirname(entry.file), specifier)), entry.file + ': ' + specifier);
  }
  let checkCode = code;
  const originalCode = original.toString('utf8');
  if (!entry.file.endsWith('.html') && ![
    'faecher/informatik/klasse-10/1-Datenbanken/sql-lab.js',
    'faecher/informatik/klasse-10/1-Datenbanken/sql-lab-core.mjs',
    'faecher/informatik/klasse-11/1-Kuenstliche-Intelligenz/perzeptron/ui/semantic-answer.mjs',
    'faecher/informatik/klasse-11/1-Kuenstliche-Intelligenz/perzeptron/ui/task6.mjs',
    'faecher/informatik/klasse-11/1-Kuenstliche-Intelligenz/entscheidungbaeume/ui/semantic-answer.mjs'
  ].includes(entry.file)) {
    const expected = originalCode.replace(/https:\/\/script\.google\.com\/macros\/s\/[^'"\s]+/g, log.endpoint)
      .replace(/Apps-Script-\/JSONP-Architektur/g, 'POST-/JSON-Anbindung an Scaleway')
      .replace(/Prüfen über die vorhandene JSONP-Anbindung/g, 'Prüfen über die POST-/JSON-Anbindung')
      .replace(/(from\s*['"][^'"]*semantic-answer\.mjs)(['"])/g, '$1?v=20261010-scaleway$2');
    assert.equal(code, expected, entry.file + ': ausschließlich URL/Import/Transportkommentar geändert');
  }
  if (entry.file.endsWith('.html')) {
    const before = original.toString('utf8');
    const marker = 'function showEvaluation(';
    assert.equal(code.slice(code.indexOf(marker)), before.slice(before.indexOf(marker)), entry.file + ': Ergebnisanzeige/Quiz');
    const oldScript = before.lastIndexOf('<script', before.indexOf('const SCRIPT_SERVER_URL'));
    const newScript = code.lastIndexOf('<script', code.indexOf('const SCRIPT_SERVER_URL'));
    assert.equal(code.slice(0, newScript), before.slice(0, oldScript), entry.file + ': Layout/Aufgaben');
    for (const name of ['getCurrentProgramCode', 'hasUnqualifiedRobotMethodCall', 'collectProgramFiles', 'getAllProgramCode', 'stripComments']) {
      if (before.includes('function ' + name + '(')) assert.equal(extractFunction(code, name), extractFunction(before, name), entry.file + ': ' + name);
    }
    const begin = code.indexOf('>', newScript) + 1;
    checkCode = code.slice(begin, code.indexOf('</script>', begin));
  }
  const checkPath = path.join(checkRoot, index + '.mjs');
  fs.writeFileSync(checkPath, checkCode);
  execFileSync(process.execPath, ['--check', checkPath], { stdio: 'pipe' });
}
log.testFiles = [
  'apps-script/tests/aufgabe2-client.test.js', 'apps-script/tests/aufgabe5-client.test.js',
  'faecher/informatik/klasse-10/1-Datenbanken/tests/sql-lab-core.test.mjs',
  'faecher/informatik/klasse-11/1-Kuenstliche-Intelligenz/perzeptron/tests/semantic-answer.test.mjs',
  'faecher/informatik/klasse-11/1-Kuenstliche-Intelligenz/entscheidungbaeume/tests/task3.test.mjs'
].map(file => ({ file, category: 'test',
  beforeSha256: hash(fs.readFileSync(path.join(log.backupRoot, 'original-tests', file))),
  afterSha256: hash(fs.readFileSync(path.join(repo, file))) }));
for (const file of fs.readdirSync(path.join(repo, 'apps-script')).filter(file => file.endsWith('.gs'))) {
  assert.equal(hash(fs.readFileSync(path.join(repo, 'apps-script', file))),
    hash(fs.readFileSync(path.join(log.backupRoot, 'apps-script', file))), file + ': Google-Quelle unverändert');
}
log.verifiedAt = new Date().toISOString();
fs.writeFileSync(logPath, JSON.stringify(log, null, 2) + '\n');
fs.writeFileSync(path.join(log.backupRoot, 'migration-manifest.json'), JSON.stringify(log, null, 2) + '\n');
fs.copyFileSync(path.join(__dirname, 'restore-website.ps1'), path.join(log.backupRoot, 'restore-website.ps1'));
console.log('35 Sicherungen, Syntax/Imports, unveränderte Aufgaben/Ergebnisanzeigen/IDE-Abfragen, übrige Module und Google-Quellen geprüft.');
