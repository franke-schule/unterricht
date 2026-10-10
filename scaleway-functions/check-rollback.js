'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const repo = path.resolve(__dirname, '..');
const log = JSON.parse(fs.readFileSync(path.join(__dirname, 'website-migration-log.json'), 'utf8'));
const root = path.join(repo, 'tmp/scaleway-rollback-rehearsal');
assert.ok(root.startsWith(path.join(repo, 'tmp') + path.sep));
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const entries = [...log.files, ...log.testFiles];
for (const entry of entries) {
  const target = path.join(root, entry.file);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(path.join(repo, entry.file), target);
}
const manifestPath = path.join(root, 'migration-manifest.json');
fs.writeFileSync(manifestPath, JSON.stringify({ ...log, repoRoot: root }, null, 2));
const args = ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', path.join(__dirname, 'restore-website.ps1'), '-ManifestPath', manifestPath];
const conflict = path.join(root, entries.at(-1).file);
fs.appendFileSync(conflict, '\n// Spätere Änderung im Prüfordner\n');
try { execFileSync('powershell.exe', args, { stdio: 'pipe' }); throw new Error('Spätere Änderung nicht erkannt.'); }
catch (error) { assert.equal(error.status, 1); assert.match(String(error.stderr), /Spaetere Aenderung erkannt/); }
assert.equal(hash(fs.readFileSync(path.join(root, entries[0].file))), entries[0].afterSha256, 'Keine teilweise Rücksicherung bei Konflikt');
fs.copyFileSync(path.join(repo, entries.at(-1).file), conflict);
execFileSync('powershell.exe', args, { stdio: 'pipe' });
for (const entry of entries) assert.equal(hash(fs.readFileSync(path.join(root, entry.file))), entry.beforeSha256, entry.file);
fs.writeFileSync(path.join(repo, 'tmp/scaleway-rollback-report.json'), JSON.stringify({ files: entries.length, restored: true, conflictProtection: true, actualRepoModified: false }, null, 2) + '\n');
console.log('Rückweg für 35 Website-Dateien und fünf Tests im getrennten Prüfordner erfolgreich; Konfliktschutz geprüft.');
