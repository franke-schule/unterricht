import { classifyDescriptionResult, compareRelations, explainSqlError, isValidScriptServerUrl, normalizeRelation, parseDelimited, validateSelectStatement } from './sql-lab-core.mjs';

const STORAGE_KEY = 'inf10-sql-grundlagen-v1';
const SCRIPT_SERVER_URL = 'https://script.google.com/macros/s/AKfycby8RWL6uYrKZyoJ6m2GRpWyRmXjwsdskyCiqzKpRhIK5-wrDl-9lWWk8CiAGaVMoy0x/exec';
const ATTRIBUTES = ['id', 'username', 'name', 'gender', 'birthday', 'city', 'country', 'centimeters', 'role', 'created_at'];
const state = { tab: 'conditions', answers: {}, feedback: {}, results: {}, server: {} };

const tasks = {
  conditions: [
    sql('b2-1', '1', 'Liste die Daten aller Mitglieder auf, bei denen das Geschlecht weiblich ist.', "SELECT * FROM users WHERE gender = 'female'"),
    sql('b2-2', '2', 'Gib alle Mitglieder aus Deutschland an.', "SELECT * FROM users WHERE country = 'Deutschland'"),
    describe('b2-3', '3', 'Beschreibe den Zweck dieser Anweisung in eigenen Worten.', "SELECT username, birthday FROM users WHERE city != 'Berlin'", 'sql-b2-3'),
    sql('b2-4', '4', 'Gib alle Mitglieder aus, die kleiner als 1,80 m sind.', 'SELECT * FROM users WHERE centimeters < 180'),
    sql('b2-5', '5', 'Korrigiere die Anweisung, damit Namen von Mitgliedern ausgegeben werden, die nicht in Leipzig wohnen.', "SELECT name FROM users WHERE city != 'Leipzig'"),
    sql('b2-6', '6', 'Liste alle Frauen aus Leipzig auf.', "SELECT * FROM users WHERE gender = 'female' AND city = 'Leipzig'", { hints: ['Du brauchst zwei Bedingungen.', 'Verbinde beide Bedingungen mit AND.', 'Vergleiche gender mit female und city mit Leipzig.'] }),
    sql('b2-7', '7', 'Gib die Namen aller Männer über 165 cm und aller Frauen über 160 cm aus.', "SELECT name FROM users WHERE (gender = 'male' AND centimeters > 165) OR (gender = 'female' AND centimeters > 160)", { hints: ['Es gibt zwei Personengruppen.', 'Verbinde die Gruppen mit OR.', 'Setze die zusammengehörigen Bedingungen jeweils in Klammern.'] }),
    sql('b2-8', '8', 'Finde die Mitglieder, deren Vorname mit B beginnt.', "SELECT * FROM users WHERE name LIKE 'B%'", { hints: ['Suche nach einem Muster statt nach einem exakten Namen.', 'LIKE vergleicht mit einem Muster.', 'B% bedeutet: beginnt mit B; % steht für beliebig viele weitere Zeichen.'] }),
    sql('b2-9', '9', 'Ermittle, wie viele Mitglieder in München wohnen.', "SELECT COUNT(*) AS Anzahl FROM users WHERE city = 'München'", { hints: ['Wähle zunächst die Mitglieder aus München aus.', 'Zähle die Zeilen der Ergebnisrelation.', 'COUNT(*) fasst die Anzahl der passenden Zeilen zusammen.'] })
  ],
  fastConditions: [
    sql('b2-10', '10', 'Prüfe, ob Mitglieder der Jahrgänge 2005 bis 2010 heute Geburtstag haben.', () => `SELECT * FROM users WHERE birthday LIKE '%-${todayMonthDay()}' AND birthday BETWEEN '2005-01-01' AND '2010-12-31'`, { birthdayProbe: true, hints: ['Das Datum steht in users im Format YYYY-MM-DD. Vergleiche deshalb nur Monat und Tag.', 'LIKE und % helfen dir, das wechselnde Geburtsjahr vor dem heutigen Monat und Tag zu berücksichtigen.', 'Grenze zusätzlich auf die Jahrgänge 2005 bis 2010 ein.'] }),
    sql('b2-11', '11', 'Finde die Mitglieder, die im März Geburtstag haben.', "SELECT name FROM users WHERE birthday LIKE '%-03-%'"),
    sql('b2-12', '12', 'Finde alle Berliner, die Marc heißen.', "SELECT * FROM users WHERE name LIKE 'Marc%' AND city = 'Berlin'"),
    sql('b2-13', '13', 'Ermittle, wie viele Mitglieder Lina oder Lisa heißen.', "SELECT COUNT(*) AS Anzahl FROM users WHERE name LIKE 'Lina%' OR name LIKE 'Lisa%'"),
    sql('b2-14', '14', 'Sortiere alle Männer nach ihrer Körpergröße, die 2008 oder später geboren wurden.', "SELECT * FROM users WHERE gender = 'male' AND birthday >= '2008-01-01' ORDER BY centimeters", { compare: { rowOrder: true } }),
    sql('b2-15', '15', 'Gib Geburtsdatum und Benutzernamen aller Frauen aus, die kleiner als 1,60 m sind.', "SELECT birthday, username FROM users WHERE gender = 'female' AND centimeters < 160", { compare: { columnOrder: false } }),
    sql('b2-16', '16', 'Liste alle Mitglieder auf, die Felix heißen und nicht aus Berlin kommen.', "SELECT * FROM users WHERE name LIKE 'Felix%' AND city != 'Berlin'"),
    sql('b2-17', '17', 'Erna sucht eine Bekannte aus Berlin, deren Vorname Bea oder Naomi war. Liste alle Daten der möglichen Mitglieder auf.', "SELECT * FROM users WHERE (name LIKE 'Bea%' OR name LIKE 'Naomi%') AND city = 'Berlin'")
  ],
  aggregates: [
    info(),
    describe('b3-1', '1', 'Beschreibe diese Anweisung in eigenen Worten.', 'SELECT MIN(centimeters) AS kleinste_Groesse FROM users;', 'sql-b3-1', { info: ['AS benennt die Spalte in der Ergebnisrelation um.', 'Hier heißt die ausgegebene Spalte kleinste_Groesse.'] }),
    sql('b3-2', '2', 'Ermittle das Geburtsdatum des jüngsten Mitglieds. Benenne die Spalte juengstes_Geburtsdatum.', 'SELECT MAX(birthday) AS juengstes_Geburtsdatum FROM users', { compare: { columnLabels: true } }),
    selfCheck('b3-3', '3', 'Beschreibe diese Anweisung in eigenen Worten.', 'SELECT * FROM users ORDER BY created_at DESC LIMIT 1;', ['ORDER BY created_at DESC sortiert die Registrierung von neu nach alt.', 'LIMIT 1 lässt nur den ersten Datensatz der sortierten Ergebnisrelation übrig.'], { info: ['LIMIT begrenzt die Anzahl der ausgegebenen Zeilen.', 'LIMIT 1 bedeutet: Zeige nach der Sortierung nur den ersten Datensatz.'] })
  ],
  fastAggregates: [
    sql('b3-4', '4', 'Gib die Daten des Mitglieds aus, das sich zuletzt registriert hat.', 'SELECT * FROM users ORDER BY created_at DESC LIMIT 1', { compare: { columnLabels: false } }),
    sql('b3-5', '5', 'Ermittle die Größe der größten Nutzerin.', "SELECT MAX(centimeters) FROM users WHERE gender = 'female'"),
    sql('b3-6', '6', 'Ermittle die durchschnittliche Größe aller Mitglieder aus Dresden.', "SELECT AVG(centimeters) FROM users WHERE city = 'Dresden'", { compare: { numericTolerance: 0.000001 } }),
    sql('b3-7', '7', 'Ermittle die Anzahl der registrierten Mitglieder aus Berlin.', "SELECT COUNT(*) FROM users WHERE city = 'Berlin'"),
    sql('b3-8', '8', 'Ermittle die Anzahl der männlichen Mitglieder aus Leipzig.', "SELECT COUNT(*) FROM users WHERE city = 'Leipzig' AND gender = 'male'")
  ]
};

function sql(id, number, prompt, referenceSql, options = {}) { return { type: 'sql', id, number, prompt, referenceSql, birthdayProbe: options.birthdayProbe === true, compare: { columnOrder: true, columnLabels: false, rowOrder: false, ...options.compare }, hints: options.hints || [] }; }
function describe(id, number, prompt, statement, serverTaskId, options = {}) { return { type: 'describe', id, number, prompt, statement, serverTaskId, info: options.info || [] }; }
function selfCheck(id, number, prompt, statement, answer, options = {}) { return { type: 'self', id, number, prompt, statement, answer, info: options.info || [] }; }
function info() { return { type: 'info', id: 'aggregate-info' }; }
function todayMonthDay() { const now = new Date(); const offset = now.getTimezoneOffset() * 60000; return new Date(now - offset).toISOString().slice(5, 10); }

class SqlWorker {
  constructor() { this.nextId = 0; this.pending = new Map(); }
  async init() {
    this.worker = new Worker(new URL('../../../../include/lib/sql.js/worker.sql-wasm.js', import.meta.url));
    this.worker.onmessage = (event) => { const pending = this.pending.get(event.data.id); if (!pending) return; this.pending.delete(event.data.id); event.data.error ? pending.reject(new Error(event.data.error)) : pending.resolve(event.data); };
    this.worker.onerror = (event) => { this.pending.forEach(({ reject }) => reject(event.error || new Error('SQL-Worker nicht verfügbar.'))); this.pending.clear(); };
    await this.send({ action: 'open' });
    const response = await fetch('users.csv'); if (!response.ok) throw new Error('users.csv konnte nicht geladen werden.');
    const rows = parseDelimited(await response.text()); const [headers, ...data] = rows;
    const schema = headers.map((name) => `${quoteIdentifier(name)} ${['id', 'centimeters', 'is_active'].includes(name) ? 'INTEGER' : 'TEXT'}`).join(', ');
    const statements = [`CREATE TABLE users (${schema})`];
    data.forEach((row) => statements.push(`INSERT INTO users (${headers.map(quoteIdentifier).join(', ')}) VALUES (${headers.map((header, index) => sqlValue(row[index], header)).join(', ')})`));
    await this.send({ action: 'exec', sql: statements.join(';') });
  }
  send(message) { return new Promise((resolve, reject) => { const id = `sql-${++this.nextId}`; this.pending.set(id, { resolve, reject }); this.worker.postMessage({ ...message, id }); }); }
  async exec(sqlText) { return normalizeRelation((await this.send({ action: 'exec', sql: sqlText })).results); }
  async execBirthdayProbe(sqlText, monthDay) {
    const probeSql = [
      'SAVEPOINT birthday_probe',
      `UPDATE users SET birthday = '2007-${monthDay}' WHERE id = 1`,
      `UPDATE users SET birthday = '2004-${monthDay}' WHERE id = 2`,
      sqlText,
      'ROLLBACK TO birthday_probe',
      'RELEASE birthday_probe'
    ].join('; ');
    return this.exec(probeSql);
  }
  close() { if (this.worker) { this.send({ action: 'close' }).catch(() => {}); this.worker.terminate(); } }
}
function quoteIdentifier(name) { return `"${String(name).replaceAll('"', '""')}"`; }
function sqlValue(value, header) { if (value === 'NULL' || value === undefined) return 'NULL'; if (['id', 'centimeters', 'is_active'].includes(header) && /^-?\d+$/.test(value)) return value; return `'${String(value).replaceAll("'", "''")}'`; }

let database;
let databaseReady = false;
function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function restore() { try { Object.assign(state, JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')); } catch { /* Speicherstand ist optional. */ } }
function element(tag, className, text) { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; }

function render() {
  const tabs = document.getElementById('sql-tabs'); tabs.replaceChildren();
  const labels = [['conditions', 'Bedingungen'], ['fastConditions', 'Für die Schnellen: Bedingungen'], ['aggregates', 'Aggregatfunktionen'], ['fastAggregates', 'Für die Schnellen: Aggregatfunktionen']];
  labels.forEach(([id, label], index) => { const button = element('button', 'step-tab', label); button.type = 'button'; button.id = `tab-${id}`; button.role = 'tab'; button.ariaSelected = String(state.tab === id); button.setAttribute('aria-controls', 'sql-panel'); button.addEventListener('click', () => { state.tab = id; save(); render(); }); button.addEventListener('keydown', (event) => moveTabFocus(event, labels, index)); tabs.append(button); });
  const panel = document.getElementById('sql-panel'); panel.replaceChildren();
  panel.setAttribute('aria-labelledby', `tab-${state.tab}`);
  const heading = element('div', 'step-heading'); heading.append(element('span', 'step-number', '5')); const title = element('div'); title.append(element('p', 'step-kicker', state.tab.startsWith('fast') ? 'Vertiefen' : 'Wiederholen'), element('h2', '', labels.find(([id]) => id === state.tab)[1])); heading.append(title); panel.append(heading);
  if (state.tab === 'conditions') panel.append(attributeCard());
  tasks[state.tab].forEach((task) => panel.append(renderTask(task)));
}

function moveTabFocus(event, labels, index) {
  const keys = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 };
  let nextIndex;
  if (event.key === 'Home') nextIndex = 0;
  else if (event.key === 'End') nextIndex = labels.length - 1;
  else if (keys[event.key]) nextIndex = (index + keys[event.key] + labels.length) % labels.length;
  else return;
  event.preventDefault();
  document.getElementById(`tab-${labels[nextIndex][0]}`)?.click();
  document.getElementById(`tab-${labels[nextIndex][0]}`)?.focus();
}

function attributeCard() { const card = element('section', 'scenario-card accent'); card.append(element('strong', '', 'Wichtige Attribute von users'), element('p', '', 'Nutze diese Attribute für die Abfragen. Weitere Spalten darfst du bei SELECT * ebenfalls sehen.')); const list = element('div', 'attribute-pills'); ATTRIBUTES.forEach((attribute) => list.append(element('code', '', attribute))); card.append(list); return card; }
function renderTask(task) {
  if (task.type === 'info') return aggregateInfo();
  const card = element('section', 'task-card sql-task'); card.id = `task-${task.id}`; card.append(element('h3', '', `Aufgabe ${task.number}`), element('p', '', task.prompt));
  if (task.statement) { const statement = element('pre', 'given-sql'); statement.textContent = task.statement; card.append(statement); }
  if (task.info?.length) { const details = element('details', 'sql-info'); details.append(element('summary', '', 'Infobox')); task.info.forEach((line) => details.append(element('p', '', line))); card.append(details); }
  if (task.type === 'sql') renderSqlTask(card, task); else if (task.type === 'describe') renderDescribeTask(card, task); else renderSelfCheck(card, task);
  return card;
}
function aggregateInfo() {
  const card = element('section', 'scenario-card aggregate-intro'); card.append(element('h3', '', 'Kurz erklärt: Aggregatfunktionen'));
  card.append(element('p', '', 'Eine Aggregatfunktion verarbeitet mehrere Werte und gibt einen zusammengefassten Wert zurück.')); const code = element('pre', 'given-sql'); code.textContent = 'SELECT COUNT(*) AS Anzahl FROM users'; card.append(code);
  const list = element('dl', 'aggregate-list'); [['COUNT(Attribut) / COUNT(*)', 'Anzahl der Datensätze'], ['MIN(Attribut)', 'kleinster Wert'], ['MAX(Attribut)', 'größter Wert'], ['AVG(Attribut)', 'arithmetischer Mittelwert'], ['SUM(Attribut)', 'Summe'], ['AS', 'benennt eine Ergebnisspalte um']].forEach(([term, meaning]) => { list.append(element('dt', '', term), element('dd', '', meaning)); }); card.append(list); return card;
}
function renderSqlTask(card, task) {
  const label = element('label', 'sql-label', 'Deine vollständige SQL-Anweisung'); label.htmlFor = `input-${task.id}`; const input = document.createElement('textarea'); input.id = label.htmlFor; input.className = 'sql-input'; input.spellcheck = false; input.placeholder = 'SELECT ... FROM users ...'; input.value = state.answers[task.id] || ''; input.addEventListener('input', () => { state.answers[task.id] = input.value; delete state.feedback[task.id]; delete state.results[task.id]; save(); renderTaskFeedback(task, card); }); input.addEventListener('keydown', (event) => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); runTask(task, card); } }); card.append(label, input);
  appendHints(card, task.hints); const actions = element('div', 'action-row'); const run = element('button', 'primary-button', 'Anfrage ausführen'); run.type = 'button'; run.disabled = !databaseReady; run.addEventListener('click', () => runTask(task, card, input, run)); actions.append(run, element('span', 'shortcut-hint', 'Strg/Cmd + Enter')); card.append(actions); renderTaskFeedback(task, card);
}
function appendHints(card, hints) { if (!hints.length) return; const box = element('div', 'help-stack'); hints.forEach((hint, index) => { const details = element('details'); details.append(element('summary', '', `Hilfe ${index + 1}`), element('p', '', hint)); box.append(details); }); card.append(box); }
async function runTask(task, card, input = card.querySelector('.sql-input'), button = card.querySelector('.primary-button')) {
  const sqlText = state.answers[task.id] || ''; const check = validateSelectStatement(sqlText);
  if (!check.ok) { state.feedback[task.id] = { level: 'hint', text: check.message }; save(); renderTaskFeedback(task, card); return; }
  if (!databaseReady) { state.feedback[task.id] = { level: 'hint', text: 'Warte bitte, bis die Tabelle users vollständig geladen ist.' }; renderTaskFeedback(task, card); return; }
  input.disabled = true; button.disabled = true; delete state.results[task.id]; state.feedback[task.id] = { level: 'hint', text: 'Die Anfrage wird ausgeführt …' }; renderTaskFeedback(task, card);
  try {
    const referenceSql = typeof task.referenceSql === 'function' ? task.referenceSql() : task.referenceSql;
    const actual = await database.exec(check.sql); const reference = await database.exec(referenceSql); let comparison = compareRelations(actual, reference, task.compare);
    if (comparison.correct && task.birthdayProbe) {
      const monthDay = todayMonthDay();
      const probeActual = await database.execBirthdayProbe(check.sql, monthDay);
      const probeReference = await database.execBirthdayProbe(referenceSql, monthDay);
      comparison = compareRelations(probeActual, probeReference, task.compare);
      if (!comparison.correct) comparison = { correct: false, level: 'partial', reason: 'Berücksichtige beim heutigen Geburtstag Monat und Tag sowie die Jahrgänge 2005 bis 2010.' };
    }
    if (comparison.correct) { state.feedback[task.id] = { level: 'success', text: actual.values.length ? 'Korrekt: Deine Abfrage liefert die erwartete Ergebnisrelation.' : 'Korrekt: Für heute gibt es keine passenden Datensätze.' }; state.results[task.id] = actual; }
    else { state.feedback[task.id] = { level: comparison.level, text: `${comparison.level === 'partial' ? 'Teilweise korrekt' : 'Noch nicht korrekt'}: ${comparison.reason}` }; delete state.results[task.id]; }
  } catch (error) { state.feedback[task.id] = { level: 'error', text: `SQL-Fehler: ${explainSqlError(error)}` }; delete state.results[task.id]; }
  input.disabled = false; button.disabled = false; save(); renderTaskFeedback(task, card);
}
function renderDescribeTask(card, task) {
  const label = element('label', 'sql-label', 'Deine Erklärung'); label.htmlFor = `input-${task.id}`; const input = document.createElement('textarea'); input.id = label.htmlFor; input.className = 'description-input'; input.maxLength = 1200; input.value = state.answers[task.id] || ''; input.addEventListener('input', () => { state.answers[task.id] = input.value; delete state.server[task.id]; save(); renderServerFeedback(task, card); }); card.append(label, input); const actions = element('div', 'action-row'); const button = element('button', 'primary-button', 'Erklärung prüfen'); button.type = 'button'; button.addEventListener('click', () => submitDescription(task, input, card)); actions.append(button); card.append(actions); renderServerFeedback(task, card);
}
function renderSelfCheck(card, task) { const label = element('label', 'sql-label', 'Deine Erklärung'); label.htmlFor = `input-${task.id}`; const input = document.createElement('textarea'); input.id = label.htmlFor; input.className = 'description-input'; input.value = state.answers[task.id] || ''; input.addEventListener('input', () => { state.answers[task.id] = input.value; save(); }); card.append(label, input); const details = element('details', 'sql-info'); details.append(element('summary', '', 'Selbstkontrolle anzeigen')); task.answer.forEach((line) => details.append(element('p', '', line))); card.append(details); }
function renderTaskFeedback(task, card) { card.querySelectorAll('.sql-feedback, .result-relation').forEach((node) => node.remove()); const feedback = state.feedback[task.id]; if (feedback) { const box = element('p', `feedback ${feedback.level} sql-feedback`, feedback.text); box.setAttribute('aria-live', 'polite'); card.append(box); } if (state.results[task.id]) card.append(renderRelation(state.results[task.id])); }
function renderRelation(relation) { const shell = element('section', 'table-shell result-relation'); shell.setAttribute('aria-label', 'Ergebnisrelation der SQL-Anfrage'); const caption = element('div', 'table-caption'); caption.append(element('strong', '', 'Ergebnisrelation'), element('span', '', relation.values.length > 100 ? `100 von ${relation.values.length} Zeilen angezeigt` : `${relation.values.length} Zeile(n)`)); shell.append(caption); if (!relation.values.length) { shell.append(element('p', 'empty-result', 'Die Abfrage ist gültig, liefert aber keine Datensätze.')); return shell; } const scroll = element('div', 'table-scroll'); if (relation.columns.length > 3) scroll.tabIndex = 0; scroll.setAttribute('aria-label', 'Ergebnisrelation horizontal scrollen'); const table = element('table', `data-table${relation.columns.length <= 3 ? ' compact' : ''}`); const cap = element('caption', 'visually-hidden', 'Ergebnis deiner SQL-Abfrage'); table.append(cap); const head = document.createElement('thead'); const row = document.createElement('tr'); relation.columns.forEach((column) => { const th = element('th', '', column); th.scope = 'col'; row.append(th); }); head.append(row); const body = document.createElement('tbody'); relation.values.slice(0, 100).forEach((values) => { const tr = document.createElement('tr'); values.forEach((value) => tr.append(element('td', '', value === null ? 'NULL' : String(value)))); body.append(tr); }); table.append(head, body); scroll.append(table); shell.append(scroll); return shell; }

function submitDescription(task, input, card) {
  const answer = input.value.trim(); if (answer.length < 10) { state.server[task.id] = { level: 'hint', text: 'Formuliere deine Erklärung noch etwas ausführlicher.' }; save(); renderServerFeedback(task, card); return; }
  if (!isValidScriptServerUrl(SCRIPT_SERVER_URL)) { state.server[task.id] = { level: 'error', text: 'Der Auswertungsserver ist nicht korrekt eingerichtet.' }; save(); renderServerFeedback(task, card); return; }
  const button = card.querySelector('.primary-button'); button.disabled = true; input.disabled = true; button.textContent = 'Erklärung wird geprüft …'; state.server[task.id] = { level: 'hint', text: 'Deine Erklärung wird geprüft …' }; renderServerFeedback(task, card);
  const requestId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`; const url = new URL(SCRIPT_SERVER_URL); url.searchParams.set('callback', '__handleSqlDescriptionResult'); url.searchParams.set('requestId', requestId); url.searchParams.set('taskId', task.serverTaskId); url.searchParams.set('answer', answer);
  if (url.toString().length > 1800) { input.disabled = false; button.disabled = false; button.textContent = 'Erklärung prüfen'; state.server[task.id] = { level: 'error', text: 'Deine Erklärung ist für die automatische Übertragung zu lang. Bitte kürze sie etwas.' }; save(); renderServerFeedback(task, card); return; }
  const script = document.createElement('script'); const timeout = window.setTimeout(() => finishDescription(requestId, task, card, { ok: false, message: 'Der Auswertungsserver hat nicht rechtzeitig geantwortet.' }), 60000); pendingDescriptions.set(requestId, { task, card, input, button, script, timeout }); script.src = url; script.async = true; script.onerror = () => finishDescription(requestId, task, card, { ok: false, message: 'Der Auswertungsserver konnte nicht geladen werden.' }); document.body.append(script);
}
const pendingDescriptions = new Map();
window.__handleSqlDescriptionResult = (message) => { if (message?.type && message.type !== 'GEMINI_EVALUATION_RESULT') return; const pending = pendingDescriptions.get(message?.requestId); if (pending) finishDescription(message.requestId, pending.task, pending.card, message.result); };
function finishDescription(requestId, task, card, result) { const pending = pendingDescriptions.get(requestId); if (!pending) return; clearTimeout(pending.timeout); pending.script.remove(); pending.input.disabled = false; pending.button.disabled = false; pending.button.textContent = 'Erklärung prüfen'; pendingDescriptions.delete(requestId); state.server[task.id] = classifyDescriptionResult(result); save(); renderServerFeedback(task, card); }
function renderServerFeedback(task, card) { card.querySelector('.server-feedback')?.remove(); const feedback = state.server[task.id]; if (feedback) { const box = element('p', `feedback ${feedback.level} server-feedback`, feedback.text); box.setAttribute('aria-live', 'polite'); card.append(box); } }

async function init() { restore(); render(); const status = document.getElementById('data-status'); try { database = new SqlWorker(); await database.init(); databaseReady = true; status.textContent = 'Die Tabelle users ist geladen. Du kannst SQL-Anfragen ausführen.'; status.className = 'feedback success'; status.setAttribute('aria-busy', 'false'); render(); } catch (error) { status.textContent = 'Die Übungsdaten konnten nicht geladen werden. Bitte lade die Seite neu.'; status.className = 'feedback error'; status.setAttribute('aria-busy', 'false'); console.error(error); document.querySelectorAll('.sql-input, .sql-task button').forEach((node) => { node.disabled = true; }); } document.getElementById('reset-module').addEventListener('click', () => { if (window.confirm('Möchtest du alle SQL-Eingaben und den Fortschritt dieser Aufgabe zurücksetzen?')) { localStorage.removeItem(STORAGE_KEY); location.reload(); } }); window.addEventListener('beforeunload', () => database?.close()); }
document.addEventListener('DOMContentLoaded', init);
