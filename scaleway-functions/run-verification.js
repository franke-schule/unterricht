'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const repo = path.resolve(__dirname, '..');
function testFiles(root) {
  return fs.readdirSync(path.join(repo, root), { withFileTypes: true }).flatMap(entry => {
    const relative = root + '/' + entry.name;
    return entry.isDirectory() ? testFiles(relative) : /\.test\.(?:js|mjs)$/.test(entry.name) ? [relative] : [];
  });
}
const groups = {
  server: [...testFiles('scaleway-functions/tests'), ...testFiles('apps-script/tests')],
  website: [
    'faecher/informatik/klasse-10/1-Datenbanken/tests',
    'faecher/informatik/klasse-11/1-Kuenstliche-Intelligenz/perzeptron/tests',
    'faecher/informatik/klasse-11/1-Kuenstliche-Intelligenz/entscheidungbaeume/tests',
    'faecher/physik/klasse-11/1-Kreisbewegungen/tests'
  ].flatMap(testFiles)
};
const results = {};
for (const [name, files] of Object.entries(groups)) {
  let output;
  try { output = execFileSync(process.execPath, ['--test', '--test-reporter=tap', ...files], { cwd: repo, encoding: 'utf8', maxBuffer: 20 * 1024 * 1024 }); }
  catch (error) {
    const output = error.stdout || error.message;
    fs.writeFileSync(path.join(repo, 'tmp/scaleway-' + name + '-tests.tap'), output);
    results[name] = { files: files.length,
      tests: Number(output.match(/^# tests (\d+)/m)?.[1]), pass: Number(output.match(/^# pass (\d+)/m)?.[1]),
      fail: Number(output.match(/^# fail (\d+)/m)?.[1]) };
    console.error(name + ': Prüfungen fehlgeschlagen; tmp/scaleway-' + name + '-tests.tap prüfen.');
    process.exitCode = 1; continue;
  }
  fs.writeFileSync(path.join(repo, 'tmp/scaleway-' + name + '-tests.tap'), output);
  results[name] = { files: files.length,
    tests: Number(output.match(/^# tests (\d+)/m)?.[1]), pass: Number(output.match(/^# pass (\d+)/m)?.[1]),
    fail: Number(output.match(/^# fail (\d+)/m)?.[1]) };
  console.log(name + ': ' + JSON.stringify(results[name]));
}
fs.writeFileSync(path.join(repo, 'tmp/scaleway-verification-report.json'), JSON.stringify(results, null, 2) + '\n');
