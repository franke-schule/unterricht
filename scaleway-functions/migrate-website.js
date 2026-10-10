'use strict';
// Einmalige, protokollierte Migration. Vor jedem Schreiben vollständige Sicherung.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const repo = path.resolve(__dirname, '..');
const endpoint = 'https://unterrichtkiichezbn4-ki-auswertung.functions.fnc.fr-par.scw.cloud/';
const canonical = 'faecher/informatik/klasse-11/1-Kuenstliche-Intelligenz/perzeptron/ui/semantic-answer.mjs';
const treeHelper = 'faecher/informatik/klasse-11/1-Kuenstliche-Intelligenz/entscheidungbaeume/ui/semantic-answer.mjs';
const sqlCore = 'faecher/informatik/klasse-10/1-Datenbanken/sql-lab-core.mjs';
const sqlUI = 'faecher/informatik/klasse-10/1-Datenbanken/sql-lab.js';
const perceptronCodeUI = 'faecher/informatik/klasse-11/1-Kuenstliche-Intelligenz/perzeptron/ui/task6.mjs';
const hash = data => crypto.createHash('sha256').update(data).digest('hex');
const core = require('./evaluation-core');

function extractFunction(source, name) {
  const matches = [...source.matchAll(new RegExp('^([ \\t]*)(?:export )?function ' + name + '\\([\\s\\S]*?^\\1}', 'gm'))];
  if (matches.length !== 1) throw new Error('Funktion zuerst prüfen: ' + name);
  return matches[0][0];
}
function constant(source, name) {
  const matches = [...source.matchAll(new RegExp('const ' + name + ' =[\\s\\S]*?;', 'g'))];
  if (matches.length !== 1) throw new Error('Konstante zuerst prüfen: ' + name);
  return matches[0][0];
}
function modulePath(file) {
  const relative = path.posix.relative(path.posix.dirname(file), canonical);
  return (relative.startsWith('.') ? relative : './' + relative) + '?v=20261010-scaleway';
}
function htmlTransport(source, file) {
  let start = source.indexOf('const SCRIPT_SERVER_URL');
  const code = source.includes('function submitCode(taskId)');
  const description = source.includes('function submitDescription(taskKey)');
  const lastComment = source.lastIndexOf('/**', start);
  if (lastComment >= 0 && source.slice(lastComment, start).includes('HIER DIE URL DER APPS-SCRIPT')) start = lastComment;
  let end = source.indexOf(code || !description ? 'function showEvaluation(' : 'function classifyLevel(', start);
  if (start < 0 || end < start) throw new Error('Transportgrenzen zuerst prüfen: ' + file);
  // Bestehende Aufgabenkennungen samt Punktezahl beibehalten.
  const taskIds = [...new Set([...source.matchAll(/submit(?:Answer|Code)\(['"]([^'"]+)['"]\)/g)].map(match => match[1]))];
  const points = Object.fromEntries(taskIds.map(id => {
    if (!Object.hasOwn(core.TASKS, id)) throw new Error('Unbekannte Aufgabe: ' + id);
    return [id, core.TASKS[id].maxPoints];
  }));
  const prefix = `const SCRIPT_SERVER_URL = '${endpoint}';\nconst SCW_TASK_POINTS = ${JSON.stringify(points)};\n` +
    (source.includes('const MAX_ANSWER_LENGTH') ? constant(source, 'MAX_ANSWER_LENGTH') + '\n' : '');
  let transport;
  if (code) {
    const originalSubmit = source.indexOf('function submitCode(taskId)');
    const validationStart = source.indexOf(file.endsWith('/aufgabe5.html') ? '      let entries;' : '      let code;', originalSubmit);
    const validationEnd = source.indexOf('      button.dataset.defaultLabel =', validationStart);
    if (validationStart < originalSubmit || validationEnd < validationStart || validationEnd > end) {
      throw new Error('Code-Vorprüfungen zuerst prüfen: ' + file);
    }
    const helpers = ['restoreCodeButton'];
    if (file.endsWith('/aufgabe5.html')) helpers.push('collectProgramFiles', 'getAllProgramCode', 'stripComments');
    else helpers.push('getCurrentProgramCode', 'hasUnqualifiedRobotMethodCall');
    transport = prefix + constant(source, 'IDE_ID') + '\n' + constant(source, 'MAX_CODE_LENGTH') + '\n' +
      helpers.map(name => extractFunction(source, name)).join('\n\n') + `
async function submitCode(taskId) {
  const button = document.getElementById('button-' + taskId);
  const resultBox = document.getElementById('result-' + taskId);
  if (!button || !resultBox || button.disabled) return;
  ${source.slice(validationStart, validationEnd)}
  button.dataset.defaultLabel = button.textContent.trim();
  button.disabled = true;
  button.textContent = 'Programm wird geprüft …';
  resultBox.hidden = false;
  resultBox.className = 'result';
  resultBox.textContent = 'Der aktuelle Programmcode wird ausgewertet.';
  try {
    const { evaluateCodeAnswer } = await import('${modulePath(file)}');
    const result = await evaluateCodeAnswer({ serverUrl: SCRIPT_SERVER_URL, taskId, code,
      expectedMaxPoints: SCW_TASK_POINTS[taskId] });
    showEvaluation(resultBox, result);
  } catch (error) { showError(resultBox, error.message || 'Die Auswertung konnte nicht abgeschlossen werden.'); }
  finally { restoreCodeButton({ button }); }
}
`;
  } else {
    let helpers = '';
    if (source.includes('function updateCharacterCount(')) helpers += extractFunction(source, 'updateCharacterCount') + '\n';
    if (description) {
      const match = source.match(/const TASKS = \{[\s\S]*?\n\s*};/);
      if (!match) throw new Error('Aufgabenzuordnung fehlt: ' + file);
      helpers += match[0] + '\n';
    }
    const functionName = description ? 'submitDescription' : 'submitAnswer';
    const serverTask = description ? 'TASKS[taskId]?.serverTaskId' : 'taskId';
    const label = description ? 'Beschreibung' : 'Antwort';
    transport = prefix + helpers + `
async function ${functionName}(taskId) {
  const textarea = document.getElementById('answer-' + taskId);
  const button = document.getElementById('button-' + taskId);
  const resultBox = document.getElementById('result-' + taskId);
  if (!textarea || !button || !resultBox || button.disabled) return;
  const answer = textarea.value.trim();
  if (answer.length < 10 || answer.length > 3000) {
    showError(resultBox, answer.length < 10 ? 'Bitte formuliere eine etwas ausführlichere Antwort.' : 'Bitte kürze deine Antwort auf höchstens 3000 Zeichen.');
    textarea.focus(); return;
  }
  const serverTaskId = ${serverTask};
  button.disabled = true;
  textarea.disabled = true;
  button.textContent = '${label} wird geprüft …';
  resultBox.hidden = false;
  resultBox.className = 'result';
  resultBox.textContent = 'Deine ${label} wird ausgewertet.';
  try {
    const { evaluateSemanticAnswer } = await import('${modulePath(file)}');
    const result = await evaluateSemanticAnswer({ serverUrl: SCRIPT_SERVER_URL, taskId: serverTaskId,
      answer, expectedMaxPoints: SCW_TASK_POINTS[serverTaskId] });
    showEvaluation(resultBox, result);
  } catch (error) { showError(resultBox, error.message || 'Die Auswertung konnte nicht abgeschlossen werden.'); }
  finally {
    button.disabled = false; textarea.disabled = false;
    button.textContent = '${label} erneut prüfen';
  }
}
`;
  }
  return source.slice(0, start) + transport + '\n    ' + source.slice(end);
}

function transformSQL(source) {
  const start = source.indexOf('function submitDescription(task, input, card)');
  const end = source.indexOf('function appendEvaluationList(', start);
  if (start < 0 || end < start) throw new Error('SQL-Transportgrenzen prüfen.');
  const replacement = `async function submitDescription(task, input, card) {
  const button = card.querySelector('.primary-button');
  if (button.disabled) return;
  const answer = input.value.trim();
  if (answer.length < 10) { state.server[task.id] = { level: 'error', text: 'Bitte formuliere eine etwas ausführlichere Antwort.' }; save(); renderServerFeedback(task, card); input.focus(); return; }
  if (!isValidScriptServerUrl(SCRIPT_SERVER_URL)) { state.server[task.id] = { level: 'error', text: 'Der Auswertungsserver ist nicht korrekt eingerichtet.' }; save(); renderServerFeedback(task, card); return; }
  button.disabled = true; input.disabled = true; button.textContent = 'Erklärung wird geprüft …';
  state.server[task.id] = { level: 'loading', text: 'Deine Erklärung wird ausgewertet.' }; renderServerFeedback(task, card);
  try {
    const result = await evaluateSemanticAnswer({ serverUrl: SCRIPT_SERVER_URL, taskId: task.serverTaskId, answer });
    state.server[task.id] = classifyDescriptionResult(result);
  } catch (error) { state.server[task.id] = { level: 'error', text: error.message || 'Die Auswertung konnte nicht abgeschlossen werden.' }; }
  finally { input.disabled = false; button.disabled = false; button.textContent = 'Erklärung erneut prüfen'; save(); renderServerFeedback(task, card); }
}
`;
  return `import { evaluateSemanticAnswer } from '${modulePath(sqlUI)}';\n` + source.slice(0, start) + replacement + source.slice(end);
}

function transformPerceptronCode(source) {
  const start = source.indexOf('function codeRequest(taskId, code)');
  const end = source.indexOf('async function checkCode(button)', start);
  if (start < 0 || end < start) throw new Error('Perzeptron-Codeübertragung zuerst prüfen.');
  return (source.slice(0, start) + `function codeRequest(taskId, code) {
  return evaluateCodeAnswer({ serverUrl: SERVER_URL, taskId, code });
}
` + source.slice(end)).replace('import { evaluateSemanticAnswer }', 'import { evaluateSemanticAnswer, evaluateCodeAnswer }');
}

function plan() {
  const tracked = execFileSync('git', ['ls-files', '-z', 'faecher'], { cwd: repo, encoding: 'utf8' }).split('\0').filter(Boolean);
  const endpoints = tracked.filter(file => /\.(html|js|mjs)$/.test(file) && !file.includes('/tests/') &&
    fs.readFileSync(path.join(repo, file), 'utf8').includes('script.google.com/macros/s/'));
  if (endpoints.length !== 32) throw new Error('Bestand geändert: erwartet 32 Endpunktdateien, gefunden ' + endpoints.length);
  const files = [...endpoints, canonical, treeHelper, sqlCore];
  return files.map(file => {
    const before = fs.readFileSync(path.join(repo, file));
    const source = before.toString('utf8');
    let after;
    if (file === canonical) after = fs.readFileSync(path.join(__dirname, 'website-client-template.mjs'), 'utf8');
    else if (file === treeHelper) after = 'export { evaluateSemanticAnswer } from "../../perzeptron/ui/semantic-answer.mjs?v=20261010-scaleway";\n';
    else if (file.endsWith('.html')) after = htmlTransport(source, file);
    else if (file === sqlUI) after = transformSQL(source);
    else if (file === perceptronCodeUI) after = transformPerceptronCode(source);
    else if (file === sqlCore) {
      after = source.replace(extractFunction(source, 'isValidScriptServerUrl'), `export function isValidScriptServerUrl(url) {
  try { return new URL(String(url || '').trim()).href === '${endpoint}'; }
  catch { return false; }
}`);
    } else after = source;
    after = after.replace(/https:\/\/script\.google\.com\/macros\/s\/[^'"\s]+/g, endpoint)
      .replace(/Apps-Script-\/JSONP-Architektur/g, 'POST-/JSON-Anbindung an Scaleway')
      .replace(/Prüfen über die vorhandene JSONP-Anbindung/g, 'Prüfen über die POST-/JSON-Anbindung')
      .replace(/(from\s*['"][^'"]*semantic-answer\.mjs)(['"])/g, '$1?v=20261010-scaleway$2');
    if (after.includes('script.google.com')) throw new Error('Google-Adresse übrig geblieben: ' + file);
    return { file, before, after: Buffer.from(after), beforeSha256: hash(before), afterSha256: hash(after) };
  });
}

function migrate() {
  const changes = plan();
  if (process.argv.includes('--dry-run')) {
    console.log(JSON.stringify(changes.map(({ file, beforeSha256, afterSha256 }) => ({ file, beforeSha256, afterSha256 })), null, 2));
    return;
  }
  const preflightRoot = path.join(repo, 'tmp', 'scaleway-migration-preflight');
  fs.mkdirSync(preflightRoot, { recursive: true });
  for (const [index, change] of changes.entries()) {
    let code = change.after.toString('utf8');
    if (change.file.endsWith('.html')) {
      const opening = code.lastIndexOf('<script', code.indexOf('const SCRIPT_SERVER_URL'));
      const contentStart = code.indexOf('>', opening) + 1;
      code = code.slice(contentStart, code.indexOf('</script>', contentStart));
    }
    const checkFile = path.join(preflightRoot, index + '.mjs');
    fs.writeFileSync(checkFile, code);
    execFileSync(process.execPath, ['--check', checkFile], { stdio: 'pipe' });
  }
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backup = path.join(os.homedir(), 'Documents', 'Scaleway-Sicherungen', 'website-vor-wechsel-' + stamp);
  fs.mkdirSync(backup, { recursive: true });
  for (const change of changes) {
    const target = path.join(backup, 'original', change.file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, change.before);
    if (hash(fs.readFileSync(target)) !== change.beforeSha256) throw new Error('Sicherung fehlerhaft: ' + change.file);
  }
  fs.cpSync(path.join(repo, 'apps-script'), path.join(backup, 'apps-script'), { recursive: true });
  fs.cpSync(__dirname, path.join(backup, 'scaleway-functions'), { recursive: true });
  fs.copyFileSync(path.join(repo, 'Wechsel auf Scaleways.txt'), path.join(backup, 'Wechsel auf Scaleways.txt'));
  const manifest = { createdAt: new Date().toISOString(), repoRoot: repo, backupRoot: backup,
    baselineCommit: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repo, encoding: 'utf8' }).trim(),
    endpoint, deployed: false, manualTests13And14: 'Auf ausdrücklichen Benutzerwunsch übersprungen',
    files: changes.map(({ file, beforeSha256, afterSha256 }) => ({ file, beforeSha256, afterSha256 })) };
  fs.writeFileSync(path.join(backup, 'migration-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  fs.copyFileSync(path.join(__dirname, 'restore-website.ps1'), path.join(backup, 'restore-website.ps1'));
  // Vor der ersten Änderung alle Originale noch einmal gegen den gesicherten Stand prüfen.
  for (const change of changes) {
    if (hash(fs.readFileSync(path.join(repo, change.file))) !== change.beforeSha256) throw new Error('Quelle zwischenzeitlich geändert: ' + change.file);
  }
  for (const change of changes) fs.writeFileSync(path.join(repo, change.file), change.after);
  fs.writeFileSync(path.join(__dirname, 'website-migration-log.json'), JSON.stringify(manifest, null, 2) + '\n');
  console.log('35 Website-Dateien geändert. Geprüfte Sicherung: ' + backup);
}
if (require.main === module) migrate();
module.exports = { plan, constant, extractFunction, htmlTransport, transformPerceptronCode, endpoint, canonical };
