'use strict';

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const repo = path.resolve(__dirname, '..');
const root = path.join(repo, 'tmp', 'scaleway-website-test');
const pagePath = 'faecher/informatik/klasse-9/3-Modellierung-und-Programmierung-Online-IDE/aufgabe1.html';
const codePagePath = 'faecher/informatik/klasse-10/2-Modellierung-und-Programmierung-Online-IDE/aufgabe3.html';
const sharedClient = 'faecher/informatik/klasse-11/1-Kuenstliche-Intelligenz/perzeptron/ui/semantic-answer.mjs';
const purpose = 'scaleway-website-pilot-aufgabe1';
const hash = value => crypto.createHash('sha256').update(value).digest('hex');

function transformPage(source) {
  if (source.includes('async function submitAnswer') && source.includes('functions.fnc.fr-par.scw.cloud') && !source.includes('script.google.com')) {
    return source.replace('Gib keine personenbezogenen Informationen ein. Deine Antwort wird zur automatischen Auswertung an den Skriptserver und dort an ein KI-System übertragen.',
      'Lokale Scaleway-Testkopie: Verwende nur erfundene Antworten ohne personenbezogene Informationen. Die Auswertung erfolgt über Scaleway Functions und Scaleway Generative APIs.');
  }
  const start = source.indexOf('<script>', source.indexOf('</main>'));
  const marker = /\s*\/\*\*\s*\* Zeigt eine erfolgreiche KI-Auswertung an\.[\s\S]*?\*\//g;
  const matches = [...source.matchAll(marker)];
  if (start < 0 || matches.length !== 1 || matches[0].index < start ||
      !source.slice(start, matches[0].index).includes('script.google.com/macros/s/')) {
    throw new Error('Die Vorlage hat sich geändert. Transportgrenzen zuerst prüfen.');
  }
  const transport = fs.readFileSync(path.join(__dirname, 'website-pilot-transport.js'), 'utf8');
  let output = source.slice(0, start + '<script>'.length) + '\n' + transport +
    source.slice(matches[0].index);
  const privacy = 'Gib keine personenbezogenen Informationen ein. Deine Antwort wird zur automatischen Auswertung an den Skriptserver und dort an ein KI-System übertragen.';
  if (!output.includes(privacy)) throw new Error('Datenschutzhinweis der Vorlage fehlt.');
  output = output.replace(privacy, 'Lokale Scaleway-Testkopie: Verwende nur erfundene Antworten ohne personenbezogene Informationen. Die Auswertung erfolgt über Scaleway Functions und Scaleway Generative APIs.');
  if (output.includes('script.google.com')) throw new Error('Google-Endpunkt in der Testseite übrig geblieben.');
  return output;
}

function existingFunction(source, name) {
  const matches = [...source.matchAll(new RegExp('    function ' + name + '\\([\\s\\S]*?\\r?\\n    }', 'g'))];
  if (matches.length !== 1) throw new Error('Vorhandene Funktion zuerst prüfen: ' + name);
  return matches[0][0];
}

function transformCodePage(source) {
  if (source.includes('async function submitCode') && source.includes('functions.fnc.fr-par.scw.cloud') && !source.includes('script.google.com')) {
    return source.replace('Der aktuelle Inhalt von <code>Hauptprogramm.java</code> wird zur automatischen Codeanalyse an ein KI-System übertragen. Schreibe keine Namen oder andere personenbezogenen Daten in Kommentare.',
      'Lokale Scaleway-Testkopie: Der aktuelle Inhalt von <code>Hauptprogramm.java</code> wird über Scaleway Functions und Scaleway Generative APIs ausgewertet. Verwende nur erfundenen Code ohne personenbezogene Daten.');
  }
  const start = source.indexOf('<script>', source.indexOf('</main>'));
  const end = source.indexOf('    function showEvaluation(', start);
  if (start < 0 || end < start ||
      !source.slice(start, end).includes('script.google.com/macros/s/')) {
    throw new Error('Die Codevorlage hat sich geändert. Transportgrenzen prüfen.');
  }
  const helpers = ['createRequestId', 'getCurrentProgramCode', 'hasUnqualifiedRobotMethodCall', 'restoreCodeButton']
    .map(name => existingFunction(source, name));
  for (const name of ['IDE_ID', 'MAX_CODE_LENGTH']) {
    const matches = [...source.matchAll(new RegExp('    const ' + name + ' =[\\s\\S]*?;', 'g'))];
    if (matches.length !== 1) throw new Error('Vorhandene Konstante zuerst prüfen: ' + name);
    helpers.unshift(matches[0][0]);
  }
  const oldSubmit = source.indexOf('    function submitCode(taskId)');
  const validationStart = source.indexOf('      let code;', oldSubmit);
  const validationEnd = source.indexOf('      button.dataset.defaultLabel =', validationStart);
  if (oldSubmit < start || validationStart < oldSubmit || validationEnd < validationStart || validationEnd > end) {
    throw new Error('Vorhandene Codeprüfung zuerst prüfen.');
  }
  const template = fs.readFileSync(path.join(__dirname, 'website-code-pilot-transport.js'), 'utf8');
  const transport = template.replace('/* EXISTING_CODE_HELPERS */', helpers.join('\n\n'))
    .replace('/* EXISTING_CODE_VALIDATION */', source.slice(validationStart, validationEnd));
  let output = source.slice(0, start + '<script>'.length) + '\n' + transport + '\n' + source.slice(end);
  const privacy = 'Der aktuelle Inhalt von <code>Hauptprogramm.java</code> wird zur automatischen Codeanalyse an ein KI-System übertragen. Schreibe keine Namen oder andere personenbezogenen Daten in Kommentare.';
  if (!output.includes(privacy)) throw new Error('Hinweis der Codevorlage fehlt.');
  output = output.replace(privacy, 'Lokale Scaleway-Testkopie: Der aktuelle Inhalt von <code>Hauptprogramm.java</code> wird über Scaleway Functions und Scaleway Generative APIs ausgewertet. Verwende nur erfundenen Code ohne personenbezogene Daten.');
  if (output.includes('script.google.com')) throw new Error('Google-Endpunkt in der Code-Testseite übrig geblieben.');
  return output;
}

function prepare() {
  const manifestPath = path.join(root, 'test-copy-manifest.json');
  if (fs.existsSync(root) && (!fs.existsSync(manifestPath) ||
      JSON.parse(fs.readFileSync(manifestPath, 'utf8')).purpose !== purpose)) {
    throw new Error('Der Zielordner enthält keine bekannte Testkopie. Nicht überschrieben.');
  }
  const source = fs.readFileSync(path.join(repo, pagePath));
  const output = transformPage(source.toString('utf8'));
  const codeSource = fs.readFileSync(path.join(repo, codePagePath));
  const codeOutput = transformCodePage(codeSource.toString('utf8'));
  const dependencies = [
    'include',
    sharedClient,
    'faecher/informatik/klasse-9/eingaben-speichern.js',
    'faecher/informatik/quiz-fragen-pruefen.js',
    'faecher/informatik/klasse-9/3-Modellierung-und-Programmierung-Online-IDE/sicherungsblatt-aufgabe-1-loesungen.pdf'
  ];
  fs.mkdirSync(path.dirname(path.join(root, pagePath)), { recursive: true });
  for (const relative of dependencies) {
    fs.cpSync(path.join(repo, relative), path.join(root, relative), { recursive: true,
      filter: sourcePath => {
        if (fs.lstatSync(sourcePath).isSymbolicLink()) throw new Error('Symbolischer Link in Testressourcen.');
        return true;
      }
    });
  }
  fs.writeFileSync(path.join(root, pagePath), output);
  fs.mkdirSync(path.dirname(path.join(root, codePagePath)), { recursive: true });
  fs.writeFileSync(path.join(root, codePagePath), codeOutput);
  const manifest = { purpose, createdAt: new Date().toISOString(),
    baselineCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim(),
    pagePath, sourceSha256: hash(source), testPageSha256: hash(output),
    transportSource: 'scaleway-functions/website-pilot-transport.js',
    transportSha256: hash(fs.readFileSync(path.join(__dirname, 'website-pilot-transport.js'))),
    codePilot: { pagePath: codePagePath, sourceSha256: hash(codeSource), testPageSha256: hash(codeOutput),
      transportSource: 'scaleway-functions/website-code-pilot-transport.js',
      transportSha256: hash(fs.readFileSync(path.join(__dirname, 'website-code-pilot-transport.js'))),
      changes: ['Formular-POST/JSONP-Polling durch POST/JSON ersetzt', 'Vorhandene IDE-Codeabfrage und Vorprüfungen übernommen', 'Testhinweis in vorhandener Hinweisbox'] },
    dependencies, changes: ['JSONP/iframe/postMessage durch POST/JSON ersetzt', 'Testhinweis in vorhandener Hinweisbox'],
    rollback: 'Lokalen Testserver beenden. Die Originalseite bleibt im Repository unverändert.' };
  if (hash(fs.readFileSync(path.join(repo, pagePath))) !== manifest.sourceSha256 ||
      hash(fs.readFileSync(path.join(repo, codePagePath))) !== manifest.codePilot.sourceSha256) {
    throw new Error('Originalseite wurde während des Kopierens geändert. Erneut prüfen.');
  }
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  console.log('Testkopie vorbereitet: ' + root);
  console.log('Original-SHA256: ' + manifest.sourceSha256);
  console.log('Testseiten-SHA256: ' + manifest.testPageSha256);
  console.log('Code-Original-SHA256: ' + manifest.codePilot.sourceSha256);
  console.log('Code-Testseiten-SHA256: ' + manifest.codePilot.testPageSha256);
  return manifest;
}

if (require.main === module) prepare();
module.exports = { transformPage, transformCodePage, existingFunction, prepare, root, pagePath, codePagePath, sharedClient };
