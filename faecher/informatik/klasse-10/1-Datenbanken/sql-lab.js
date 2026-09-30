import { analyzeMultiTableSelect, classifyDescriptionResult, compareRelations, diagnoseMultiTableError, diagnoseSqlError, diagnoseSqlTask, explainSqlError, flexibleReferenceSql, isValidScriptServerUrl, normalizeRelation, parseDelimited, validateSelectStatement } from './sql-lab-core.mjs?v=20260929b';
import { MENU_QUIZ, MENU_TABLES, MENU_TABLE_NAMES, MENU_TABLE_SCHEMAS, buildMenuCombinations, menuRelation } from './menue-kreuzprodukt-daten.mjs?v=20260929a';
import { SONG_PLAYLIST_PAIRS, SONG_VERBUND_COLUMN_GROUPS, SONG_VERBUND_COLUMNS, SONG_VERBUND_QUIZ, SONG_VERBUND_SQL, SONG_VERBUND_TABLE_NAMES, SONG_VERBUND_TABLE_SCHEMAS, SONG_VERBUND_TABLES, SONG_VERBUND_VISIBLE_TEXT, evaluateFirstConnection, evaluateQuizQuestion, evaluateSecondConnection } from './song-verbund-daten.mjs?v=20260929a';
import { appendSolutionDownloadFromTemplate, focusTabPanelStart, renderTabFlowNavigation, syncTabSemantics } from './tab-navigation.mjs?v=20260906a';

const STORAGE_KEY = 'inf10-sql-grundlagen-v1';
const SCRIPT_SERVER_URL = 'https://script.google.com/macros/s/AKfycby8RWL6uYrKZyoJ6m2GRpWyRmXjwsdskyCiqzKpRhIK5-wrDl-9lWWk8CiAGaVMoy0x/exec';
const NEUTRAL_SQL_PLACEHOLDER = 'SELECT ...\nFROM ...';
const USERS_TABLE_SCHEMAS = Object.freeze([
  Object.freeze({ table: 'users', columns: Object.freeze([
    ['id', 'int'], ['name', 'varchar(255)'], ['username', 'varchar(255)'], ['email', 'varchar(255)'],
    ['email_verified_at', 'date'], ['password', 'varchar(255)'], ['bio', 'varchar(255)'], ['gender', 'varchar(255)'],
    ['birthday', 'date'], ['city', 'varchar(255)'], ['country', 'varchar(255)'], ['centimeters', 'int'],
    ['avatar', 'varchar(255)'], ['role', 'varchar(255)'], ['is_active', 'int'], ['remember_token', 'varchar(255)'],
    ['created_at', 'date'], ['updated_at', 'date']
  ]) })
]);
const state = { tab: 'intro', introStep: 1, answers: {}, feedback: {}, results: {}, server: {}, quiz: {}, quizPassed: false, quizFeedback: null };
const SQL_TABS = [['intro', 'SQL Schritt für Schritt'], ['conditions', 'Bedingungen'], ['fastConditions', 'Für die Schnellen: Bedingungen'], ['aggregates', 'Aggregatfunktionen'], ['fastAggregates', 'Für die Schnellen: Aggregatfunktionen'], ['quiz', 'Abschlussquiz']];
const FLEXIBLE_TASK_IDS = new Set(['b2-2', 'b2-4', 'b2-6', 'b2-8', 'b2-10', 'b2-11', 'b2-12', 'b2-14', 'b2-16']);
const FINAL_QUIZ = [
  { id: 'clauses', prompt: 'Welche Aussagen zu SELECT, FROM und WHERE stimmen?', hint: 'Unterscheide Tabelle, Zeilen und Spalten.', options: [['from', 'FROM bestimmt die Tabelle.', true], ['where', 'WHERE filtert die Zeilen.', true], ['select', 'SELECT wählt die ausgegebenen Spalten.', true], ['selectRows', 'SELECT legt fest, welche Zeilen die Bedingung erfüllen.', false]] },
  { id: 'values', prompt: 'Welche Aussagen zu SQL-Werten stimmen?', hint: 'Unterscheide Attributnamen und Werte.', options: [['text', "Ein Textwert kann als 'Leipzig' geschrieben werden.", true], ['number', 'Die ganze Zahl 180 braucht keine Anführungszeichen.', true], ['same', 'name und username enthalten grundsätzlich dieselben Werte.', false], ['table', "Der Tabellenname users muss als 'users' geschrieben werden.", false]] },
  { id: 'condition', prompt: 'Welche Bedingung wählt Mitglieder aus, die nicht in Leipzig wohnen?', hint: 'Achte auf die Bedeutung des Vergleichsoperators.', options: [['different', "city != 'Leipzig'", true], ['equal', "city = 'Leipzig'", false], ['like', "city LIKE 'Leipzig'", false]] },
  { id: 'aggregate', prompt: 'Welche Aussagen zu Aggregatfunktionen stimmen?', hint: 'Unterscheide Anzahl, größten Wert und Mittelwert.', options: [['count', 'COUNT(*) zählt die ausgewählten Zeilen.', true], ['max', 'MAX(centimeters) liefert den größten ausgewählten Größenwert.', true], ['avg', 'AVG(centimeters) zählt die Mitglieder.', false]] }
];
let introRows = [];

function unlockSolution(event, expectedCode, downloadLinkId, messageId) {
  event.preventDefault();
  const form = event.currentTarget;
  const enteredCode = form.elements['solution-code'].value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const normalizedExpectedCode = expectedCode.replace(/[^A-Z0-9]/g, '');
  const downloadLink = document.getElementById(downloadLinkId);
  const message = document.getElementById(messageId);

  if (enteredCode === normalizedExpectedCode) {
    downloadLink.hidden = false;
    message.className = 'solution-code-message';
    message.textContent = 'Code korrekt. Das Sicherungsblatt ist freigeschaltet.';
    return;
  }

  downloadLink.hidden = true;
  message.className = 'solution-code-message error';
  message.textContent = 'Der eingegebene Code ist nicht gültig.';
}

window.unlockSolution = unlockSolution;

const tasks = {
  conditions: [
    sql('b2-1', '1', 'Liste die Daten aller Mitglieder auf, bei denen das Geschlecht weiblich ist.', "SELECT *\nFROM users\nWHERE gender = 'female'"),
    sql('b2-2', '2', 'Gib alle Mitglieder aus Deutschland an.', "SELECT *\nFROM users\nWHERE country = 'Deutschland'"),
    describe('b2-3', '3', 'Beschreibe den Zweck dieser Anweisung in eigenen Worten.', "SELECT username, birthday\nFROM users\nWHERE city != 'Berlin';", 'sql-b2-3'),
    sql('b2-4', '4', 'Gib alle Mitglieder aus, die kleiner als 1,80 m sind.', 'SELECT *\nFROM users\nWHERE centimeters < 180'),
    sql('b2-5', '5', 'Korrigiere die Anweisung, damit die Namen aus der Spalte name von Mitgliedern ausgegeben werden, die nicht in Leipzig wohnen.', "SELECT name\nFROM users\nWHERE city != 'Leipzig'", { initialSql: "SELECT namen\nFROM users\nWHERE city = 'Leipzig'", detectMissingNotEqual: true }),
    sql('b2-6', '6', 'Liste alle Frauen aus Leipzig auf.', "SELECT *\nFROM users\nWHERE gender = 'female'\n  AND city = 'Leipzig'", { hints: ['Du brauchst zwei Bedingungen.', 'Verbinde beide Bedingungen mit AND.', 'Vergleiche gender mit female und city mit Leipzig.'] }),
    sql('b2-7', '7', 'Gib die Namen aller Männer über 165 cm und aller Frauen über 160 cm aus.', "SELECT name\nFROM users\nWHERE (gender = 'male' AND centimeters > 165)\n   OR (gender = 'female' AND centimeters > 160)", { hints: ['Es gibt zwei Personengruppen.', 'Verbinde die Gruppen mit OR.', 'Setze die zusammengehörigen Bedingungen jeweils in Klammern.'] }),
    sql('b2-8', '8', 'Finde die Mitglieder, deren Vorname mit B beginnt.', "SELECT *\nFROM users\nWHERE name LIKE 'B%'", { hints: ['Suche nach einem Muster statt nach einem exakten Namen.', 'LIKE vergleicht mit einem Muster.', 'B% bedeutet: beginnt mit B; % steht für beliebig viele weitere Zeichen.'] }),
    sql('b2-9', '9', 'Ermittle, wie viele Mitglieder in München wohnen.', "SELECT COUNT(*) AS anzahl\nFROM users\nWHERE city = 'München'", { hints: ['Wähle zunächst die Mitglieder aus München aus.', 'Zähle die Zeilen der Ergebnisrelation.', 'COUNT(*) fasst die Anzahl der passenden Zeilen zusammen.'] })
  ],
  fastConditions: [
    sql('b2-10', '10', 'Prüfe, ob Mitglieder der Jahrgänge 2005 bis 2010 heute Geburtstag haben.', () => `SELECT *\nFROM users\nWHERE birthday LIKE '%-${todayMonthDay()}'\n  AND birthday BETWEEN '2005-01-01' AND '2010-12-31'`, { birthdayProbe: true, hints: ['Das Datum steht in users im Format YYYY-MM-DD. Vergleiche deshalb nur Monat und Tag.', 'LIKE und % helfen dir, das wechselnde Geburtsjahr vor dem heutigen Monat und Tag zu berücksichtigen.', 'Grenze zusätzlich auf die Jahrgänge 2005 bis 2010 ein.'] }),
    sql('b2-11', '11', 'Finde die Mitglieder, die im März Geburtstag haben.', "SELECT name\nFROM users\nWHERE birthday LIKE '%-03-%'"),
    sql('b2-12', '12', 'Finde alle Berliner, die Marc heißen.', "SELECT *\nFROM users\nWHERE name LIKE 'Marc%'\n  AND city = 'Berlin'"),
    sql('b2-13', '13', 'Ermittle, wie viele Mitglieder Lina oder Lisa heißen.', "SELECT COUNT(*) AS anzahl\nFROM users\nWHERE name LIKE 'Lina%'\n   OR name LIKE 'Lisa%'"),
    sql('b2-14', '14', 'Sortiere alle Männer nach ihrer Körpergröße, die 2008 oder später geboren wurden.', "SELECT *\nFROM users\nWHERE gender = 'male'\n  AND birthday >= '2008-01-01'\nORDER BY centimeters", { compare: { rowOrder: true } }),
    sql('b2-15', '15', 'Gib Geburtsdatum und Benutzernamen aller Frauen aus, die kleiner als 1,60 m sind.', "SELECT birthday, username\nFROM users\nWHERE gender = 'female'\n  AND centimeters < 160", { compare: { columnOrder: false } }),
    sql('b2-16', '16', 'Liste alle Mitglieder auf, die Felix heißen und nicht aus Berlin kommen.', "SELECT *\nFROM users\nWHERE name LIKE 'Felix%'\n  AND city != 'Berlin'"),
    sql('b2-17', '17', 'Erna sucht eine Bekannte aus Berlin, deren Vorname Bea oder Naomi war. Liste alle Daten der möglichen Mitglieder auf.', "SELECT *\nFROM users\nWHERE (name LIKE 'Bea%' OR name LIKE 'Naomi%')\n  AND city = 'Berlin'")
  ],
  aggregates: [
    info(),
    describe('b3-1', '1', 'Beschreibe diese Anweisung in eigenen Worten.', 'SELECT MIN(centimeters) AS kleinste_groesse\nFROM users;', 'sql-b3-1', { info: ['AS benennt die Spalte in der Ergebnisrelation um.', 'Hier heißt die ausgegebene Spalte kleinste_groesse.'] }),
    sql('b3-2', '2', 'Ermittle das Geburtsdatum des jüngsten Mitglieds. Benenne die Spalte juengstes_geburtsdatum.', 'SELECT MAX(birthday) AS juengstes_geburtsdatum\nFROM users', { compare: { columnLabels: true } }),
    selfCheck('b3-3', '3', 'Beschreibe diese Anweisung in eigenen Worten.', 'SELECT *\nFROM users\nORDER BY created_at DESC\nLIMIT 1;', ['ORDER BY created_at DESC sortiert die Registrierung von neu nach alt.', 'LIMIT 1 lässt nur den ersten Datensatz der sortierten Ergebnisrelation übrig.'], { info: ['LIMIT begrenzt die Anzahl der ausgegebenen Zeilen.', 'LIMIT 1 bedeutet: Zeige nach der Sortierung nur den ersten Datensatz.'] })
  ],
  fastAggregates: [
    sql('b3-4', '4', 'Gib die Daten des Mitglieds aus, das sich zuletzt registriert hat.', 'SELECT *\nFROM users\nORDER BY created_at DESC\nLIMIT 1', { compare: { columnLabels: false } }),
    sql('b3-5', '5', 'Ermittle die Größe der größten Nutzerin.', "SELECT MAX(centimeters)\nFROM users\nWHERE gender = 'female'"),
    sql('b3-6', '6', 'Ermittle die durchschnittliche Größe aller Mitglieder aus Dresden.', "SELECT AVG(centimeters)\nFROM users\nWHERE city = 'Dresden'", { compare: { numericTolerance: 0.000001 } }),
    sql('b3-7', '7', 'Ermittle die Anzahl der registrierten Mitglieder aus Berlin.', "SELECT COUNT(*)\nFROM users\nWHERE city = 'Berlin'"),
    sql('b3-8', '8', 'Ermittle die Anzahl der männlichen Mitglieder aus Leipzig.', "SELECT COUNT(*)\nFROM users\nWHERE city = 'Leipzig'\n  AND gender = 'male'")
  ]
};

function sql(id, number, prompt, referenceSql, options = {}) { return { type: 'sql', id, number, prompt, referenceSql, initialSql: options.initialSql || '', detectMissingNotEqual: options.detectMissingNotEqual === true, birthdayProbe: options.birthdayProbe === true, flexible: FLEXIBLE_TASK_IDS.has(id), compare: { columnOrder: true, columnLabels: false, rowOrder: false, ...options.compare }, hints: options.hints || [] }; }
function describe(id, number, prompt, statement, serverTaskId, options = {}) { return { type: 'describe', id, number, prompt, statement, serverTaskId, info: options.info || [] }; }
function selfCheck(id, number, prompt, statement, answer, options = {}) { return { type: 'self', id, number, prompt, statement, answer, info: options.info || [] }; }
function info() { return { type: 'info', id: 'aggregate-info' }; }
function todayMonthDay() { const now = new Date(); const offset = now.getTimezoneOffset() * 60000; return new Date(now - offset).toISOString().slice(5, 10); }

class SqlWorker {
  constructor() { this.nextId = 0; this.pending = new Map(); }
  async init(options = { mode: 'users-full' }) {
    this.worker = new Worker(new URL('../../../../include/lib/sql.js/worker.sql-wasm.js', import.meta.url));
    this.worker.onmessage = (event) => { const pending = this.pending.get(event.data.id); if (!pending) return; this.pending.delete(event.data.id); event.data.error ? pending.reject(new Error(event.data.error)) : pending.resolve(event.data); };
    this.worker.onerror = (event) => { this.pending.forEach(({ reject }) => reject(event.error || new Error('SQL-Worker nicht verfügbar.'))); this.pending.clear(); };
    await this.send({ action: 'open' });
    if (options.mode === 'menu-cross-product') {
      const statements = MENU_TABLE_NAMES.flatMap((tableName) => {
        const rows = MENU_TABLES[tableName]; const headers = Object.keys(rows[0]);
        const schema = headers.map((name) => `${quoteIdentifier(name)} ${name === 'preis' ? 'real' : 'varchar(255)'}`).join(', ');
        return [`CREATE TABLE ${quoteIdentifier(tableName)} (${schema})`, ...rows.map((row) => `INSERT INTO ${quoteIdentifier(tableName)} (${headers.map(quoteIdentifier).join(', ')}) VALUES (${headers.map((header) => sqlValue(row[header], header)).join(', ')})`)];
      });
      await this.send({ action: 'exec', sql: statements.join(';') });
      return;
    }
    if (options.mode === 'song-verbund') {
      const schemas = {
        Song: '"id" int PRIMARY KEY, "titel" varchar(255), "genre" varchar(255), "interpret" varchar(255)',
        Song_in_Playlist: '"song_id" int, "playlist_id" int',
        Playlist: '"id" int PRIMARY KEY, "titel" varchar(255)'
      };
      const statements = SONG_VERBUND_TABLE_NAMES.flatMap((tableName) => {
        const rows = SONG_VERBUND_TABLES[tableName]; const headers = Object.keys(rows[0]);
        return [`CREATE TABLE ${quoteIdentifier(tableName)} (${schemas[tableName]})`, ...rows.map((row) => `INSERT INTO ${quoteIdentifier(tableName)} (${headers.map(quoteIdentifier).join(', ')}) VALUES (${headers.map((header) => sqlValue(row[header], header)).join(', ')})`)];
      });
      await this.send({ action: 'exec', sql: statements.join(';') });
      return;
    }
    const response = await fetch('users.csv'); if (!response.ok) throw new Error('users.csv konnte nicht geladen werden.');
    const rows = parseDelimited(await response.text()); const [headers, ...data] = rows;
    const schema = headers.map((name) => `${quoteIdentifier(name)} ${['id', 'centimeters', 'is_active'].includes(name) ? 'INTEGER' : 'TEXT'}`).join(', ');
    const statements = [`CREATE TABLE users (${schema})`];
    data.forEach((row) => statements.push(`INSERT INTO users (${headers.map(quoteIdentifier).join(', ')}) VALUES (${headers.map((header, index) => sqlValue(row[index], header)).join(', ')})`));
    await this.send({ action: 'exec', sql: statements.join(';') });
  }
  send(message) { return new Promise((resolve, reject) => { const id = `sql-${++this.nextId}`; const timeout = window.setTimeout(() => { if (!this.pending.delete(id)) return; reject(new Error('Der SQL-Worker antwortet nicht rechtzeitig.')); }, 15000); this.pending.set(id, { resolve: (value) => { window.clearTimeout(timeout); resolve(value); }, reject: (error) => { window.clearTimeout(timeout); reject(error); } }); try { this.worker.postMessage({ ...message, id }); } catch (error) { window.clearTimeout(timeout); this.pending.delete(id); reject(error); } }); }
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
function sqlValue(value, header) { if (value === 'NULL' || value === undefined || value === null) return 'NULL'; if (['id', 'centimeters', 'is_active', 'preis', 'song_id', 'playlist_id'].includes(header) && /^-?\d+(?:\.\d+)?$/.test(value)) return value; return `'${String(value).replaceAll("'", "''")}'`; }

let database;
let databaseReady = false;
function save() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* Ohne Speicher bleibt das Modul bedienbar. */ } }
function restore() { try { const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); if (!saved || typeof saved !== 'object') return; if (SQL_TABS.some(([id]) => id === saved.tab)) state.tab = saved.tab; if ([1, 2, 3].includes(saved.introStep)) state.introStep = saved.introStep; const taskIds = new Set(Object.values(tasks).flat().map(({ id }) => id)); if (saved.answers && typeof saved.answers === 'object' && !Array.isArray(saved.answers)) for (const [id, answer] of Object.entries(saved.answers)) if (taskIds.has(id) && typeof answer === 'string') state.answers[id] = answer; if (saved.quiz && typeof saved.quiz === 'object' && !Array.isArray(saved.quiz)) FINAL_QUIZ.forEach((question) => { if (Array.isArray(saved.quiz[question.id])) state.quiz[question.id] = saved.quiz[question.id].filter((value) => question.options.some(([id]) => id === value)); }); state.quizPassed = saved.quizPassed === true; } catch { /* Speicherstand ist optional. */ } }
function element(tag, className, text) { const node = document.createElement(tag); if (className) node.className = className; if (text !== undefined) node.textContent = text; return node; }

function activateSqlTab(id, { focusContent = false } = {}) { state.tab = id; save(); render({ focusContent }); }
function render({ focusContent = false } = {}) {
  document.body.classList.toggle('sql-intro-active', state.tab === 'intro');
  const tabs = document.getElementById('sql-tabs'); tabs.replaceChildren();
  SQL_TABS.forEach(([id, label], index) => { const button = element('button', 'step-tab', label); button.type = 'button'; button.id = `tab-${id}`; button.dataset.tab = id; button.role = 'tab'; button.ariaSelected = String(state.tab === id); button.tabIndex = state.tab === id ? 0 : -1; button.setAttribute('aria-controls', 'sql-panel'); button.addEventListener('click', () => activateSqlTab(id)); button.addEventListener('keydown', (event) => moveTabFocus(event, SQL_TABS, index)); tabs.append(button); });
  const panel = document.getElementById('sql-panel'); panel.replaceChildren();
  panel.setAttribute('aria-labelledby', `tab-${state.tab}`);
  if (state.tab !== 'intro') panel.append(schemaCard(USERS_TABLE_SCHEMAS));
  const heading = element('div', 'step-heading'); heading.append(element('span', 'step-number', '5')); const title = element('div'); title.append(element('p', 'step-kicker', state.tab.startsWith('fast') ? 'Vertiefen' : state.tab === 'intro' ? 'Entdecken' : state.tab === 'quiz' ? 'Sichern' : 'Wiederholen'), element('h2', '', state.tab === 'intro' ? 'Wie entsteht eine Ergebnisrelation?' : SQL_TABS.find(([id]) => id === state.tab)[1])); heading.append(title); panel.append(heading);
  if (state.tab === 'intro') renderIntro(panel);
  else if (state.tab === 'quiz') renderFinalQuiz(panel);
  else tasks[state.tab].forEach((task) => panel.append(renderTask(task)));
  if (state.tab === 'quiz') appendSolutionDownloadFromTemplate(panel);
  renderTabFlowNavigation(panel, { items: SQL_TABS.map(([id, label]) => ({ id, label })), currentId: state.tab, onNavigate: activateSqlTab });
  if (state.tab === 'intro') panel.querySelector('.intro-side')?.append(panel.querySelector('.tab-flow-navigation'));
  syncTabSemantics(tabs, state.tab);
  if (focusContent) focusTabPanelStart(panel);
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

function schemaCard(schemas) {
  const card = element('aside', 'scenario-card accent sql-schema-card'); card.setAttribute('aria-label', 'Tabellenschema der SQL-Übungsdaten');
  card.append(element('strong', 'schema-title', schemas.length === 1 ? 'Tabellenschema' : 'Tabellenschemata'));
  const scroll = element('div', 'schema-scroll'); scroll.tabIndex = 0; scroll.setAttribute('aria-label', 'Tabellenschemata horizontal scrollen');
  schemas.forEach(({ table, columns }) => { const code = element('code', 'schema-code', `${table} (${columns.map(([name, type]) => `${name}: ${type}`).join(', ')})`); scroll.append(code); });
  card.append(scroll); return card;
}
function renderIntro(panel) {
  const card = element('section', 'task-card sql-task sql-intro');
  const instruction = element('p'); instruction.append(element('strong', '', 'Verfolge'), document.createTextNode(' die Abfrage Schritt für Schritt. '), element('strong', '', 'Beobachte'), document.createTextNode(', wie zuerst die Tabelle, dann die Zeilen und zuletzt die Spalten ausgewählt werden.')); card.append(instruction);
  const workspace = element('div', 'intro-workspace');
  const stage = element('div', 'intro-stage');
  const side = element('div', 'intro-side');
  const statement = element('pre', 'given-sql intro-sql'); const code = document.createElement('code');
  [['SELECT', 'SELECT name, city'], ['FROM', 'FROM users'], ['WHERE', "WHERE country = 'Deutschland';"]].forEach(([clause, line]) => { const span = element('span', state.introStep === ({ FROM: 1, WHERE: 2, SELECT: 3 })[clause] ? 'intro-active-clause' : '', line); code.append(span); }); statement.append(code); side.append(statement);
  stage.append(element('p', 'intro-caption', 'Ausschnitt aus users: Zur Übersicht sind vier Datensätze und vier Spalten dargestellt.'));
  const visual = element('div', 'intro-visual');
  if (!introRows.length) visual.append(element('p', 'feedback hint', 'Der Datenausschnitt wird geladen …'));
  else {
    const columns = ['name', 'username', 'city', 'country'];
    if (state.introStep === 1) visual.append(renderRelation({ columns, values: introRows.map((row) => columns.map((column) => row[column])) }, { title: 'Ausgangstabelle: users' }));
    if (state.introStep === 2) {
      visual.append(renderRelation({ columns: [...columns, 'Auswahl'], values: introRows.map((row) => [...columns.map((column) => row[column]), row.country === 'Deutschland' ? 'bleibt' : 'entfällt']) }, { title: 'WHERE prüft jede Zeile' }));
      visual.append(renderRelation({ columns, values: introRows.filter((row) => row.country === 'Deutschland').map((row) => columns.map((column) => row[column])) }, { title: 'Zwischenrelation: gefilterte Zeilen' }));
    }
    if (state.introStep === 3) visual.append(renderRelation({ columns: ['name', 'city'], values: introRows.filter((row) => row.country === 'Deutschland').map(({ name, city }) => [name, city]) }, { title: 'Ergebnisrelation: ausgewählte Spalten' }));
  }
  const explanations = ['FROM users legt fest, aus welcher Tabelle die Daten stammen.', "WHERE country = 'Deutschland' behält die Zeilen, deren Wert in country Deutschland ist.", 'SELECT name, city zeigt von diesen Zeilen nur die Spalten name und city.'];
  const stepNames = ['1 · FROM: Tabelle wählen', '2 · WHERE: Zeilen filtern', '3 · SELECT: Spalten auswählen'];
  const stepButtons = element('div', 'intro-step-buttons'); stepButtons.setAttribute('role', 'group'); stepButtons.setAttribute('aria-label', 'Schritte der SQL-Erklärung'); stepNames.forEach((name, index) => { const button = element('button', 'secondary-button', name); button.type = 'button'; button.id = `intro-step-${index + 1}`; if (state.introStep === index + 1) button.setAttribute('aria-current', 'step'); button.addEventListener('click', () => { state.introStep = index + 1; save(); render(); document.getElementById(button.id)?.focus(); }); stepButtons.append(button); }); side.append(stepButtons);
  side.append(element('p', 'intro-explanation', explanations[state.introStep - 1]));
  stage.append(visual);
  const controls = element('div', 'action-row intro-controls'); const back = element('button', 'secondary-button', 'Zurück'); back.id = 'intro-back'; back.type = 'button'; back.disabled = state.introStep === 1; back.addEventListener('click', () => changeIntroStep(-1, 'intro-back')); const next = element('button', 'primary-button', 'Weiter'); next.id = 'intro-next'; next.type = 'button'; next.disabled = state.introStep === 3; next.addEventListener('click', () => changeIntroStep(1, 'intro-next')); controls.append(back, element('strong', 'intro-progress', `Schritt ${state.introStep} von 3`), next);
  side.append(controls);
  if (state.introStep === 3) { const memory = element('section', 'short-summary sql-intro-memory'); memory.append(element('h3', '', 'Merke'), element('p', '', 'FROM bestimmt die Tabelle, WHERE filtert die Zeilen und SELECT wählt die Spalten.'), element('p', '', 'Geschrieben wird SELECT – FROM – WHERE. Zum Verstehen der Abfrage verfolgen wir FROM – WHERE – SELECT.'), element('p', '', 'SELECT * zeigt alle Spalten. Ohne WHERE bleiben alle Zeilen erhalten.'), element('p', '', "Textwerte stehen in Anführungszeichen, zum Beispiel 'Deutschland'. Ganze Zahlen wie 180 werden ohne Anführungszeichen geschrieben. Datumswerte verwenden wir hier im Format '2008-01-01'.")); stage.append(memory); }
  workspace.append(stage, side); card.append(workspace); panel.append(card);
}
function changeIntroStep(direction, focusId) { state.introStep = Math.max(1, Math.min(3, state.introStep + direction)); save(); render(); document.getElementById(focusId)?.focus(); }
function renderFinalQuiz(panel) {
  const card = element('section', 'task-card sql-task'); card.append(element('h3', '', 'Vier Fragen zur SQL-Wiederholung'), element('p', '', 'Kreuze alle richtigen Antworten an. Bei manchen Fragen sind mehrere Antworten richtig.'));
  const form = element('form', 'final-quiz'); form.id = 'final-quiz'; form.noValidate = true;
  FINAL_QUIZ.forEach((question, index) => { const field = document.createElement('fieldset'); const legend = document.createElement('legend'); legend.append(element('span', '', String(index + 1)), document.createTextNode(question.prompt)); field.append(legend); const choices = element('div', 'choice-list'); question.options.forEach(([id, labelText]) => { const label = element('label', 'choice-option'); const input = document.createElement('input'); input.type = 'checkbox'; input.name = `sql-final-${question.id}`; input.value = id; input.checked = Array.isArray(state.quiz[question.id]) && state.quiz[question.id].includes(id); input.addEventListener('change', () => { const selected = Array.isArray(state.quiz[question.id]) ? state.quiz[question.id].filter((value) => question.options.some(([option]) => option === value)) : []; state.quiz[question.id] = input.checked ? [...new Set([...selected, id])] : selected.filter((value) => value !== id); state.quizFeedback = null; save(); card.querySelector('.sql-quiz-feedback')?.remove(); }); label.append(input, element('span', '', labelText)); choices.append(label); }); field.append(choices); form.append(field); });
  const actions = element('div', 'action-row'); const submit = element('button', 'primary-button', 'Quiz prüfen'); submit.type = 'submit'; actions.append(submit); form.append(actions); form.addEventListener('submit', (event) => { event.preventDefault(); checkFinalQuiz(); }); card.append(form);
  if (state.quizFeedback) { const feedback = element('p', `feedback ${state.quizFeedback.level} sql-quiz-feedback`, state.quizFeedback.text); feedback.setAttribute('aria-live', 'polite'); card.append(feedback); }
  if (state.quizPassed) { const overview = element('section', 'short-summary sql-quiz-overview'); overview.append(element('h3', '', 'Abschlussquiz: Fragen und richtige Antworten')); const list = document.createElement('ol'); FINAL_QUIZ.forEach((question) => { const item = document.createElement('li'); item.append(element('strong', '', question.prompt)); const answers = document.createElement('ul'); question.options.filter(([, , correct]) => correct).forEach(([, answer]) => answers.append(element('li', '', answer))); item.append(answers); list.append(item); }); overview.append(list); card.append(overview); }
  panel.append(card);
}
function checkFinalQuiz() {
  const open = FINAL_QUIZ.map((question, index) => !Array.isArray(state.quiz[question.id]) || !state.quiz[question.id].length ? index + 1 : null).filter(Boolean);
  if (open.length) state.quizFeedback = { level: 'hint', text: `Beantworte zuerst alle Fragen. Noch ohne Kreuz: Frage ${open.join(', ')}.` };
  else {
    const correct = FINAL_QUIZ.map((question) => { const chosen = new Set(state.quiz[question.id]); return question.options.every(([id, , right]) => chosen.has(id) === right); });
    const amount = correct.filter(Boolean).length;
    if (amount === FINAL_QUIZ.length) { state.quizPassed = true; state.quizFeedback = { level: 'success', text: 'Korrekt: Alle vier Fragen stimmen.' }; }
    else { const wrong = FINAL_QUIZ.map((question, index) => correct[index] ? null : index + 1).filter(Boolean); const hints = FINAL_QUIZ.filter((question, index) => !correct[index]).map((question) => question.hint).join(' '); state.quizFeedback = { level: amount ? 'partial' : 'hint', text: amount ? `Teilweise korrekt: ${amount} von 4 Fragen stimmen. Prüfe Frage ${wrong.join(', ')} noch einmal. ${hints}` : `Noch nicht korrekt. Prüfe Frage ${wrong.join(', ')} noch einmal. ${hints}` }; }
  }
  save(); render(); document.querySelector('#final-quiz .primary-button')?.focus();
}
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
  card.append(element('p', '', 'Eine Aggregatfunktion verarbeitet mehrere Werte und gibt einen zusammengefassten Wert zurück.')); const code = element('pre', 'given-sql'); code.textContent = 'SELECT COUNT(*) AS anzahl\nFROM users'; card.append(code);
  const list = element('dl', 'aggregate-list'); [['COUNT(attribut) / COUNT(*)', 'Anzahl der Datensätze'], ['MIN(attribut)', 'kleinster Wert'], ['MAX(attribut)', 'größter Wert'], ['AVG(attribut)', 'arithmetischer Mittelwert'], ['SUM(attribut)', 'Summe'], ['AS', 'benennt eine Ergebnisspalte um']].forEach(([term, meaning]) => { list.append(element('dt', '', term), element('dd', '', meaning)); }); card.append(list); return card;
}
function renderSqlTask(card, task) {
  const label = element('label', 'sql-label', 'Deine vollständige SQL-Anweisung'); label.htmlFor = `input-${task.id}`; const input = document.createElement('textarea'); input.id = label.htmlFor; input.className = 'sql-input'; input.spellcheck = false; input.placeholder = NEUTRAL_SQL_PLACEHOLDER; const hasSavedAnswer = Object.prototype.hasOwnProperty.call(state.answers, task.id); input.value = hasSavedAnswer ? state.answers[task.id] : task.initialSql; if (!hasSavedAnswer && task.initialSql) { state.answers[task.id] = task.initialSql; save(); } input.addEventListener('input', () => { state.answers[task.id] = input.value; delete state.feedback[task.id]; delete state.results[task.id]; save(); renderTaskFeedback(task, card); }); input.addEventListener('keydown', (event) => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); runTask(task, card); } }); card.append(label, input);
  appendHints(card, task.hints); const actions = element('div', 'action-row'); const run = element('button', 'primary-button', 'Anfrage ausführen'); run.type = 'button'; run.disabled = !databaseReady; run.addEventListener('click', () => runTask(task, card, input, run)); actions.append(run); if (task.initialSql) { const reset = element('button', 'secondary-button', 'Ursprungsanweisung wiederherstellen'); reset.type = 'button'; reset.addEventListener('click', () => { input.value = task.initialSql; state.answers[task.id] = task.initialSql; delete state.feedback[task.id]; delete state.results[task.id]; save(); renderTaskFeedback(task, card); input.focus(); }); actions.append(reset); } actions.append(element('span', 'shortcut-hint', 'Strg/Cmd + Enter')); card.append(actions); renderTaskFeedback(task, card);
}
function appendHints(card, hints) { if (!hints.length) return; const box = element('div', 'help-stack'); hints.forEach((hint, index) => { const details = element('details'); details.append(element('summary', '', `Hilfe ${index + 1}`), element('p', '', hint)); box.append(details); }); card.append(box); }
async function runTask(task, card, input = card.querySelector('.sql-input'), button = card.querySelector('.primary-button')) {
  const sqlText = state.answers[task.id] || ''; const check = validateSelectStatement(sqlText);
  if (!check.ok) { state.feedback[task.id] = { level: 'hint', text: /Anführungszeichen/.test(check.message) ? 'Anführungszeichen: Prüfe, ob jeder Textwert vollständig eingeschlossen ist.' : check.message }; save(); renderTaskFeedback(task, card); return; }
  if (!databaseReady) { state.feedback[task.id] = { level: 'hint', text: 'Warte bitte, bis die Tabelle users vollständig geladen ist.' }; renderTaskFeedback(task, card); return; }
  input.disabled = true; button.disabled = true; delete state.results[task.id]; state.feedback[task.id] = { level: 'hint', text: 'Die Anfrage wird ausgeführt …' }; renderTaskFeedback(task, card);
  try {
    const originalReferenceSql = typeof task.referenceSql === 'function' ? task.referenceSql() : task.referenceSql;
    const referenceSql = task.flexible ? flexibleReferenceSql(originalReferenceSql, check.sql) || originalReferenceSql : originalReferenceSql;
    const actual = await database.exec(check.sql); const reference = await database.exec(referenceSql); let comparison = compareRelations(actual, reference, task.compare);
    if (comparison.correct && task.birthdayProbe) {
      const monthDay = todayMonthDay();
      const probeActual = await database.execBirthdayProbe(check.sql, monthDay);
      const probeReference = await database.execBirthdayProbe(referenceSql, monthDay);
      comparison = compareRelations(probeActual, probeReference, task.compare);
      if (!comparison.correct) comparison = { correct: false, level: 'partial', reason: 'Berücksichtige beim heutigen Geburtstag Monat und Tag sowie die Jahrgänge 2005 bis 2010.' };
    }
    const diagnostic = diagnoseSqlTask(check.sql, { id: task.id, flexible: task.flexible, referenceSql: originalReferenceSql, rowOrder: task.compare.rowOrder, columnOrder: task.compare.columnOrder }, actual, reference, comparison);
    const wrongOperator = task.detectMissingNotEqual && !comparison.correct && /\bwhere\s+city\s*=\s*['"]Leipzig['"]/i.test(check.sql) && !diagnostic?.startsWith('SELECT:');
    if (wrongOperator) { state.feedback[task.id] = { level: 'hint', text: 'WHERE: Die Aufgabe sucht Mitglieder, die nicht in Leipzig wohnen. Prüfe den Vergleichsoperator.' }; delete state.results[task.id]; }
    else if (comparison.correct && !diagnostic) { state.feedback[task.id] = { level: 'success', text: actual.values.length ? 'Korrekt: Deine Abfrage liefert die gesuchten Daten.' : 'Korrekt: Für heute gibt es keine passenden Datensätze.' }; state.results[task.id] = actual; }
    else { state.feedback[task.id] = { level: diagnostic?.startsWith('Teilweise') ? 'partial' : 'hint', text: diagnostic || 'Noch nicht korrekt: Prüfe die ausgegebenen Spalten und die Bedingungen.' }; delete state.results[task.id]; }
  } catch (error) { state.feedback[task.id] = { level: 'error', text: diagnoseSqlError(error, check.sql) }; delete state.results[task.id]; }
  input.disabled = false; button.disabled = false; save(); renderTaskFeedback(task, card);
}
function renderDescribeTask(card, task) {
  const label = element('label', 'sql-label', 'Deine Erklärung'); label.htmlFor = `input-${task.id}`; const input = document.createElement('textarea'); input.id = label.htmlFor; input.className = 'description-input'; input.maxLength = 1200; input.value = state.answers[task.id] || ''; input.addEventListener('input', () => { state.answers[task.id] = input.value; delete state.server[task.id]; save(); renderServerFeedback(task, card); }); card.append(label, input); const actions = element('div', 'action-row'); const button = element('button', 'primary-button', 'Erklärung prüfen'); button.type = 'button'; button.addEventListener('click', () => submitDescription(task, input, card)); actions.append(button); card.append(actions); renderServerFeedback(task, card);
}
function renderSelfCheck(card, task) { const label = element('label', 'sql-label', 'Deine Erklärung'); label.htmlFor = `input-${task.id}`; const input = document.createElement('textarea'); input.id = label.htmlFor; input.className = 'description-input'; input.value = state.answers[task.id] || ''; input.addEventListener('input', () => { state.answers[task.id] = input.value; save(); }); card.append(label, input); const details = element('details', 'sql-info'); details.append(element('summary', '', 'Selbstkontrolle anzeigen')); task.answer.forEach((line) => details.append(element('p', '', line))); card.append(details); }
function renderTaskFeedback(task, card) { card.querySelectorAll('.sql-feedback, .result-relation').forEach((node) => node.remove()); const feedback = state.feedback[task.id]; if (feedback) { const box = element('p', `feedback ${feedback.level} sql-feedback`, feedback.text); box.setAttribute('aria-live', 'polite'); card.append(box); } if (state.results[task.id]) card.append(renderRelation(state.results[task.id])); }
function renderRelation(relation, options = {}) { const columns = options.columns || relation.columns; const formatValue = options.formatValue || ((value) => value === null ? 'NULL' : String(value)); const shell = element('section', `table-shell result-relation${options.columnGroups?.length ? ' has-column-groups' : ''}`); shell.setAttribute('aria-label', options.label || 'Ergebnisrelation der SQL-Anfrage'); shell.setAttribute('aria-live', 'polite'); const caption = element('div', 'table-caption'); caption.append(element('strong', '', options.title || 'Ergebnisrelation'), element('span', '', relation.values.length > 100 ? `100 von ${relation.values.length} Zeilen angezeigt` : `${relation.values.length} Zeile(n)`)); shell.append(caption); if (!relation.values.length) { shell.append(element('p', 'empty-result', 'Die Abfrage ist gültig, liefert aber keine Datensätze.')); return shell; } const scroll = element('div', 'table-scroll'); scroll.tabIndex = 0; scroll.setAttribute('aria-label', 'Ergebnisrelation horizontal und vertikal scrollen'); const table = element('table', `data-table${columns.length <= 3 ? ' compact' : ''}`); const cap = element('caption', 'visually-hidden', options.caption || 'Ergebnis deiner SQL-Abfrage'); table.append(cap); const head = document.createElement('thead'); if (options.columnGroups?.length) { options.columnGroups.forEach(({ columns: groupColumns }) => { const group = document.createElement('colgroup'); group.span = groupColumns.length; table.append(group); }); const groupRow = document.createElement('tr'); options.columnGroups.forEach(({ table: tableName, columns: groupColumns }) => { const th = element('th', 'relation-group-heading', tableName); th.colSpan = groupColumns.length; th.scope = 'colgroup'; groupRow.append(th); }); head.append(groupRow); } const row = document.createElement('tr'); columns.forEach((column) => { const th = element('th', '', column); th.scope = 'col'; row.append(th); }); head.append(row); const body = document.createElement('tbody'); relation.values.slice(0, 100).forEach((values) => { const tr = document.createElement('tr'); values.forEach((value, index) => tr.append(element('td', '', formatValue(value, index)))); body.append(tr); }); table.append(head, body); scroll.append(table); shell.append(scroll); return shell; }

function submitDescription(task, input, card) {
  const answer = input.value.trim(); if (answer.length < 10) { state.server[task.id] = { level: 'error', text: 'Bitte formuliere eine etwas ausführlichere Antwort.' }; save(); renderServerFeedback(task, card); input.focus(); return; }
  if (!isValidScriptServerUrl(SCRIPT_SERVER_URL)) { state.server[task.id] = { level: 'error', text: 'Der Auswertungsserver ist nicht korrekt eingerichtet.' }; save(); renderServerFeedback(task, card); return; }
  const button = card.querySelector('.primary-button'); button.disabled = true; input.disabled = true; button.textContent = 'Erklärung wird geprüft …'; state.server[task.id] = { level: 'loading', text: 'Deine Erklärung wird ausgewertet.' }; renderServerFeedback(task, card);
  const requestId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`; const url = new URL(SCRIPT_SERVER_URL); url.searchParams.set('callback', '__handleSqlDescriptionResult'); url.searchParams.set('requestId', requestId); url.searchParams.set('taskId', task.serverTaskId); url.searchParams.set('answer', answer);
  if (url.toString().length > 1800) { input.disabled = false; button.disabled = false; button.textContent = 'Erklärung prüfen'; state.server[task.id] = { level: 'error', text: 'Deine Erklärung ist für die automatische Übertragung zu lang. Bitte kürze sie etwas.' }; save(); renderServerFeedback(task, card); return; }
  const script = document.createElement('script'); const timeout = window.setTimeout(() => finishDescription(requestId, task, card, { ok: false, message: 'Der Auswertungsserver hat nicht rechtzeitig geantwortet.' }), 60000); pendingDescriptions.set(requestId, { task, card, input, button, script, timeout }); script.src = url; script.async = true; script.onerror = () => finishDescription(requestId, task, card, { ok: false, message: 'Der Auswertungsserver konnte nicht geladen werden.' }); document.body.append(script);
}
const pendingDescriptions = new Map();
window.__handleSqlDescriptionResult = (message) => { if (message?.type && message.type !== 'GEMINI_EVALUATION_RESULT') return; const pending = pendingDescriptions.get(message?.requestId); if (pending) finishDescription(message.requestId, pending.task, pending.card, message.result); };
function finishDescription(requestId, task, card, result) { const pending = pendingDescriptions.get(requestId); if (!pending) return; clearTimeout(pending.timeout); pending.script.remove(); pending.input.disabled = false; pending.button.disabled = false; pending.button.textContent = 'Erklärung erneut prüfen'; pendingDescriptions.delete(requestId); state.server[task.id] = classifyDescriptionResult(result); save(); renderServerFeedback(task, card); }
function appendEvaluationList(container, headingText, items, emptyText) { container.append(element('h4', '', headingText)); const list = document.createElement('ul'); (items.length ? items : [emptyText]).forEach((item) => list.append(element('li', '', item))); container.append(list); }
function renderServerFeedback(task, card) {
  card.querySelector('.server-feedback')?.remove(); const feedback = state.server[task.id]; if (!feedback) return;
  const box = element('section', `result server-feedback${feedback.level === 'loading' ? '' : ` ${feedback.level}`}`); box.setAttribute('aria-live', 'polite');
  if (Number.isFinite(feedback.points) && feedback.maxPoints > 0) {
    box.append(element('h3', '', `${feedback.points} von ${feedback.maxPoints} Punkten – ${feedback.status}`));
    appendEvaluationList(box, 'Das ist dir gelungen:', feedback.strengths, 'Es wurde noch kein eindeutiger richtiger Aspekt erkannt.');
    appendEvaluationList(box, 'Das solltest du ergänzen oder überprüfen:', feedback.missing, 'Es fehlen keine wesentlichen Aspekte.');
    const detail = element('div', 'feedback'); detail.append(element('h4', '', 'Rückmeldung'), element('p', '', feedback.text)); box.append(detail);
  } else box.append(element('p', '', feedback.text));
  card.append(box);
}

// Aufgabe 6 verwendet dieselbe Worker-Ausführung und Validierung wie Aufgabe 5.
const MENU_STORAGE_KEY = 'inf10-kreuzprodukt-mensa-v1';
const MENU_TABS = [['menus', 'Menüs kombinieren'], ['sql', 'Kreuzprodukt mit SQL'], ['filter', 'Mit Bedingung einschränken'], ['summary', 'Zusammenfassung'], ['quiz', 'Abschlussquiz']];
const menuState = { tab: 'menus', prediction: '', menusVisible: false, answers: {}, feedback: {}, results: {}, selfCheck: {}, quiz: {} };
const menuReferenceSql = 'SELECT *\nFROM Vorspeise, Hauptspeise, Nachspeise';
const formatEuro = (value, index) => index % 2 === 1 && typeof value === 'number' ? `${value.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €` : String(value);
function saveMenuState() { try { localStorage.setItem(MENU_STORAGE_KEY, JSON.stringify(menuState)); } catch { /* Ohne Speicher bleibt das Modul bedienbar. */ } }
function restoreMenuState() { try { Object.assign(menuState, JSON.parse(localStorage.getItem(MENU_STORAGE_KEY) || '{}')); } catch { /* Speicherstand ist optional. */ } }
const MENU_FROM_FEEDBACK = 'FROM: Verwende die drei Tabellen Vorspeise, Hauptspeise und Nachspeise. Prüfe ihre Namen und ob eine Tabelle fehlt.';
const SONG_FROM_FEEDBACK = 'FROM: Verwende die drei Tabellen Song, Song_in_Playlist und Playlist. Prüfe ihre Namen und ob eine Tabelle fehlt.';
const MENU_SELECT_FEEDBACK = 'SELECT: Gib mindestens die Namen von Vorspeise, Hauptspeise und Nachspeise aus. Preise darfst du ergänzen.';
const SONG_SELECT_FEEDBACK = 'SELECT: Gib für jede Zuordnung den Song und die Playlist aus, jeweils mit id oder titel. Weitere Spalten darfst du ergänzen.';
function multiTableProjection(sql, analysis, referenceSql, schemas, kind) {
  if (!analysis) return null;
  const requested = analysis.projection;
  if (!requested) return null;
  if (requested.length === 1 && requested[0].star) {
    const columns = analysis.tables.flatMap((name) => schemas.find((item) => item.table.toLowerCase() === name.toLowerCase())?.columns.map(([column]) => `${name}.${column}`) || []);
    if (columns.length !== schemas.reduce((sum, item) => sum + item.columns.length, 0)) return null;
    return columns;
  }
  if (requested.some((item) => item.star)) return null;
  const has = (table, names) => requested.some((item) => item.table === table && names.includes(item.name));
  const valid = kind === 'menu'
    ? ['Vorspeise', 'Hauptspeise', 'Nachspeise'].every((table) => has(table, ['name']))
    : has('Song', ['id', 'titel']) && has('Playlist', ['id', 'titel']);
  return valid ? requested.map((item) => `${item.table}.${item.name}`) : null;
}
export async function assessMultiTableSql(sql, referenceSql, schemas, kind, execute = (statement) => database.exec(statement)) {
  const names = schemas.map((item) => item.table);
  const analysis = analyzeMultiTableSelect(sql, schemas);
  if (analysis && (analysis.tables.length !== names.length || names.some((name) => analysis.tables.filter((item) => item.toLowerCase() === name.toLowerCase()).length !== 1))) return { level: 'hint', text: kind === 'menu' ? MENU_FROM_FEEDBACK : SONG_FROM_FEEDBACK };
  const actual = await execute(sql);
  const projection = multiTableProjection(sql, analysis, referenceSql, schemas, kind);
  if (!projection) return { level: 'hint', text: analysis ? (kind === 'menu' ? MENU_SELECT_FEEDBACK : SONG_SELECT_FEEDBACK) : 'SQL-Syntax: Prüfe den Aufbau deiner Abfrage und die Schreibweise der Tabellen und Spalten.' };
  const reference = analyzeMultiTableSelect(referenceSql, schemas);
  const expectedSql = `${referenceSql.slice(0, reference.selectStart)} ${projection.join(', ')}\n${referenceSql.slice(reference.fromStart)}`;
  const expected = await execute(expectedSql);
  const relationMatches = compareRelations(actual, expected, { columnOrder: true, columnLabels: false, rowOrder: false }).correct;
  const identity = kind === 'menu' ? ['Vorspeise.name', 'Hauptspeise.name', 'Nachspeise.name'] : ['Song.id', 'Song_in_Playlist.song_id', 'Song_in_Playlist.playlist_id', 'Playlist.id'];
  const ownIdentity = identity.map((item) => { const [table, column] = item.split('.'); return `${analysis.tableAliases.get(table)}.${column}`; });
  // Die ursprüngliche Projektion bleibt vorne stehen: ORDER BY auf Alias oder
  // Spaltenposition bezieht sich dadurch weiter auf dieselben Ausdrücke.
  const identitySql = `${sql.slice(0, analysis.fromStart)}\n, ${ownIdentity.join(', ')}\n${sql.slice(analysis.fromStart)}`;
  const expectedIdentitySql = `${referenceSql.slice(0, reference.selectStart)} ${identity.join(', ')}\n${referenceSql.slice(reference.fromStart)}`;
  const identityResult = await execute(identitySql);
  const identityRelation = { columns: identity, values: identityResult.values.map((row) => row.slice(-identity.length)) };
  const identityMatches = compareRelations(identityRelation, await execute(expectedIdentitySql)).correct;
  if (relationMatches && identityMatches) return { level: 'success', actual };
  return { level: 'partial', text: kind === 'song' ? 'Teilweise korrekt: Prüfe WHERE beziehungsweise die JOIN-Bedingungen. Jede Zuordnung muss sowohl zum Song als auch zur Playlist passen.' : referenceSql.includes('Pizza') ? 'Teilweise korrekt: Prüfe WHERE. Die Bedingung soll nur Menüs mit Pizza als Hauptspeise auswählen.' : 'Teilweise korrekt: Prüfe WHERE. Für alle Menükombinationen darf keine Kombination ausgeschlossen werden.' };
}
function menuFeedback(id, level, text) { menuState.feedback[id] = { level, text }; saveMenuState(); }
function activateMenuTab(id, { focusContent = false } = {}) { menuState.tab = id; saveMenuState(); renderMenuModule({ focusContent }); }
function renderMenuModule({ focusContent = false } = {}) {
  const tabs = document.getElementById('menu-tabs'); tabs.replaceChildren();
  MENU_TABS.forEach(([id, label], index) => { const button = element('button', 'step-tab', label); button.type = 'button'; button.id = `tab-${id}`; button.dataset.tab = id; button.role = 'tab'; button.ariaSelected = String(menuState.tab === id); button.tabIndex = menuState.tab === id ? 0 : -1; button.setAttribute('aria-controls', 'menu-panel'); button.addEventListener('click', () => activateMenuTab(id)); button.addEventListener('keydown', (event) => moveTabFocus(event, MENU_TABS, index)); tabs.append(button); });
  const panel = document.getElementById('menu-panel'); panel.replaceChildren(); panel.setAttribute('aria-labelledby', `tab-${menuState.tab}`);
  panel.append(schemaCard(MENU_TABLE_SCHEMAS));
  if (menuState.tab === 'menus') renderMenuDiscovery(panel);
  if (menuState.tab === 'sql') renderMenuSql(panel);
  if (menuState.tab === 'filter') renderMenuFilter(panel);
  if (menuState.tab === 'summary') renderMenuSummary(panel);
  if (menuState.tab === 'quiz') renderMenuQuiz(panel);
  if (menuState.tab === 'summary' || menuState.tab === 'quiz') appendSolutionDownloadFromTemplate(panel);
  renderTabFlowNavigation(panel, { items: MENU_TABS.map(([id, label]) => ({ id, label })), currentId: menuState.tab, onNavigate: activateMenuTab });
  syncTabSemantics(tabs, menuState.tab);
  if (focusContent) focusTabPanelStart(panel);
}
function menuHeading(number, kicker, title) { const heading = element('div', 'step-heading'); heading.append(element('span', 'step-number', String(number))); const copy = element('div'); copy.append(element('p', 'step-kicker', kicker), element('h2', '', title)); heading.append(copy); return heading; }
function renderMenuDiscovery(panel) {
  panel.append(menuHeading(1, 'Entdecken', 'Wie entstehen vollständige Menüs?'));
  const scenario = element('section', 'scenario-card accent'); scenario.append(element('h3', '', 'Die Mensa stellt drei Gänge zusammen.'), element('p', '', 'Wähle jeweils eine Vorspeise, eine Hauptspeise und eine Nachspeise. Schau zuerst auf die drei Ausgangsrelationen.')); scenario.append(renderMenuSourceTables()); panel.append(scenario);
  const task = element('section', 'task-card sql-task'); task.append(element('h3', '', 'Vorhersage'), element('p', '', 'Wie viele verschiedene vollständige Menüs sind möglich?')); const label = element('label', 'sql-label', 'Anzahl der Menüs'); label.htmlFor = 'menu-prediction'; const input = document.createElement('input'); input.id = label.htmlFor; input.className = 'menu-number-input'; input.type = 'number'; input.min = '0'; input.inputMode = 'numeric'; input.value = menuState.prediction; input.addEventListener('input', () => { menuState.prediction = input.value; delete menuState.feedback.prediction; saveMenuState(); renderMenuFeedback(task, 'prediction'); }); const button = element('button', 'primary-button', 'Anzahl prüfen'); button.type = 'button'; button.addEventListener('click', () => { if (Number(menuState.prediction) === 12) menuFeedback('prediction', 'success', 'Korrekt: 4 Vorspeisen · 3 Hauptspeisen · 1 Nachspeise ergeben 12 Menüs.'); else menuFeedback('prediction', 'hint', 'Noch nicht korrekt. Kombiniere systematisch: Multipliziere die Anzahl der möglichen Vorspeisen, Hauptspeisen und Nachspeisen.'); renderMenuFeedback(task, 'prediction'); }); task.append(label, input, button); renderMenuFeedback(task, 'prediction'); panel.append(task);
  const generate = element('section', 'task-card'); generate.append(element('h3', '', 'Alle Kombinationen sichtbar machen'), element('p', '', 'Erzeuge die Ergebnisrelation. Jede Zeile enthält genau eine Auswahl aus jeder der drei Tabellen.')); const action = element('button', 'primary-button', menuState.menusVisible ? 'Ergebnisrelation anzeigen' : 'Alle Menüs erzeugen'); action.type = 'button'; action.addEventListener('click', () => { menuState.menusVisible = true; saveMenuState(); renderMenuModule(); }); generate.append(action); if (menuState.menusVisible) generate.append(renderMenuResult(menuRelation(buildMenuCombinations()), 'Ergebnisrelation: alle Menüs')); panel.append(generate);
}
function renderMenuSourceTables() { const wrapper = element('div', 'menu-source-tables'); MENU_TABLE_NAMES.forEach((tableName) => { const relation = MENU_TABLES[tableName]; const section = element('section', 'table-shell menu-source-table'); const table = document.createElement('table'); const caption = element('caption', '', tableName); table.append(caption); const head = document.createElement('thead'); const tr = document.createElement('tr'); ['name', 'preis'].forEach((name) => { const th = element('th', '', name); th.scope = 'col'; tr.append(th); }); head.append(tr); const body = document.createElement('tbody'); relation.forEach((row) => { const line = document.createElement('tr'); line.append(element('td', '', row.name), element('td', '', `${row.preis.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`)); body.append(line); }); table.append(head, body); section.append(table); wrapper.append(section); }); return wrapper; }
function renderMenuResult(relation, title, sql = null) { const projection = sql && multiTableProjection(sql, analyzeMultiTableSelect(sql, MENU_TABLE_SCHEMAS), menuReferenceSql, MENU_TABLE_SCHEMAS, 'menu'); const shell = renderRelation(relation, { title, caption: title, ...(sql ? {} : { columns: menuRelation().columns, columnGroups: MENU_TABLE_SCHEMAS.map(({ table, columns }) => ({ table, columns: columns.map(([name]) => name) })) }), formatValue: (value, index) => projection ? projection[index]?.endsWith('.preis') && typeof value === 'number' ? `${value.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €` : String(value) : formatEuro(value, index) }); shell.classList.add('menu-result'); return shell; }
function renderMenuSql(panel) {
  panel.append(menuHeading(2, 'Verstehen und anwenden', 'Das Kreuzprodukt mit SQL'));
  const intro = element('section', 'scenario-card accent'); intro.append(element('p', '', 'Die SQL-Anweisung verbindet jeden Datensatz einer Tabelle mit jedem Datensatz aller weiteren Tabellen.'), codeBlock('SELECT *\nFROM Vorspeise, Hauptspeise, Nachspeise;')); const list = element('ul'); ['SELECT * wählt alle Spalten aus.', 'In FROM stehen hier drei Tabellen, durch Kommata getrennt.', 'Dadurch entstehen alle möglichen Kombinationen.'].forEach((line) => list.append(element('li', '', line))); intro.append(list); panel.append(intro);
  const task = element('section', 'task-card sql-task'); task.append(element('h3', '', 'Vervollständige die Abfrage'), element('p', '', 'Formuliere eine vollständige SELECT-Abfrage für alle Menükombinationen.')); renderMenuSqlInput(task, 'cross-product', menuReferenceSql, { success: 'Korrekt: Die Abfrage erzeugt alle 12 Menükombinationen.' }); panel.append(task);
  const fact = element('section', 'short-summary menu-memory'); fact.append(element('h2', '', 'Merksatz'), element('p', '', 'Wenn bei einer SELECT-Abfrage beim Schlüsselwort FROM mehrere Tabellen angegeben werden, wird das Kreuzprodukt auf diesen Tabellen angewendet.\nBeim Kreuzprodukt wird jeder Datensatz der einen Tabelle mit jedem Datensatz der anderen Tabelle (bzw. den Datensätzen aller weiteren Tabellen) verknüpft.')); panel.append(fact);
}
function codeBlock(text) { const pre = element('pre', 'given-sql'); pre.textContent = text; return pre; }
function renderMenuSqlInput(card, id, referenceSql, options = {}) { const label = element('label', 'sql-label', 'Deine vollständige SQL-Anweisung'); label.htmlFor = `menu-input-${id}`; const input = document.createElement('textarea'); input.id = label.htmlFor; input.className = 'sql-input'; input.spellcheck = false; input.placeholder = NEUTRAL_SQL_PLACEHOLDER; input.value = menuState.answers[id] || ''; input.addEventListener('input', () => { menuState.answers[id] = input.value; delete menuState.feedback[id]; delete menuState.results[id]; saveMenuState(); renderMenuFeedback(card, id); }); input.addEventListener('keydown', (event) => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); runMenuSql(id, referenceSql, card, options); } }); card.append(label, input); if (options.hints) appendHints(card, options.hints); const actions = element('div', 'action-row'); const button = element('button', 'primary-button', 'Anfrage ausführen'); button.type = 'button'; button.disabled = !databaseReady; button.addEventListener('click', () => runMenuSql(id, referenceSql, card, options)); actions.append(button, element('span', 'shortcut-hint', 'Strg/Cmd + Enter')); card.append(actions); renderMenuFeedback(card, id); }
async function runMenuSql(id, referenceSql, card, options = {}) {
  const check = validateSelectStatement(menuState.answers[id] || '');
  delete menuState.results[id];
  if (!check.ok) { menuFeedback(id, 'hint', check.message); renderMenuFeedback(card, id); return; }
  if (!databaseReady) { menuFeedback(id, 'hint', 'Warte bitte, bis die Mensa-Tabellen geladen sind.'); renderMenuFeedback(card, id); return; }
  const input = card.querySelector('.sql-input'); const button = card.querySelector('.primary-button'); input.disabled = true; button.disabled = true;
  try {
    const result = await assessMultiTableSql(check.sql, referenceSql, MENU_TABLE_SCHEMAS, 'menu');
    if (result.actual) menuState.results[id] = result.actual;
    menuFeedback(id, result.level, result.text || options.success);
  } catch (error) { menuFeedback(id, 'error', diagnoseMultiTableError(error, check.sql, MENU_TABLE_NAMES, MENU_TABLE_SCHEMAS)); }
  input.disabled = false; button.disabled = false; saveMenuState(); renderMenuFeedback(card, id);
}
function renderMenuFeedback(card, id) { card.querySelectorAll('.menu-feedback, .menu-sql-result').forEach((node) => node.remove()); const feedback = menuState.feedback[id]; if (feedback) { const box = element('p', `feedback ${feedback.level} menu-feedback`, feedback.text); box.setAttribute('aria-live', 'polite'); card.append(box); } if (menuState.results[id] && feedback?.level === 'success') { const result = renderMenuResult(menuState.results[id], 'Ergebnisrelation deiner Anfrage', menuState.answers[id]); result.classList.add('menu-sql-result'); card.append(result); } }
async function renderMenuFilter(panel) {
  panel.append(menuHeading(3, 'Anwenden', 'Mit einer Bedingung einschränken'));
  const example = element('section', 'scenario-card accent'); example.append(element('h3', '', 'Nur Menüs mit Salat'), element('p', '', 'Zuerst entsteht das Kreuzprodukt. Die WHERE-Bedingung wählt danach nur die Zeilen mit Salat aus.'), codeBlock("SELECT *\nFROM Vorspeise, Hauptspeise, Nachspeise\nWHERE Vorspeise.name = 'Salat';")); const sampleSlot = element('div', 'sample-menu-result'); sampleSlot.setAttribute('aria-live', 'polite'); example.append(sampleSlot); panel.append(example);
  const task = element('section', 'task-card sql-task'); const prompt = element('p'); prompt.append('Erstelle eine SQL-Abfrage, die ', element('strong', '', 'nur Menüs mit Pizza als Hauptspeise'), ' ausgibt.'); task.append(element('h3', '', 'Deine Anfrage'), prompt); renderMenuSqlInput(task, 'pizza', "SELECT *\nFROM Vorspeise, Hauptspeise, Nachspeise\nWHERE Hauptspeise.name = 'Pizza'", { success: 'Korrekt: Es gibt vier Menüs mit Pizza.', hints: ['Ergänze die vollständige Abfrage um eine WHERE-Bedingung.', 'Da mehrere Tabellen ein Attribut name besitzen, gib auch die Tabelle an: Hauptspeise.name.', "Ergänze zum Gerüst WHERE Hauptspeise.name = '…' den passenden Textwert."] }); panel.append(task);
  const outlook = element('section', 'short-summary'); outlook.append(element('h2', '', 'Vom Filtern zum Verbinden'), element('p', '', "WHERE Vorspeise.name = 'Salat' oder WHERE Hauptspeise.name = 'Pizza' filtert Zeilen nach einem Wert. Bei einem Verbund mit Bedingung werden passende Attribute zweier Tabellen verglichen, zum Beispiel photos.user_id = users.id. Dadurch bleiben nur passende Kombinationen übrig.")); panel.append(outlook);
  if (databaseReady) { try { sampleSlot.append(renderMenuResult(await database.exec("SELECT * FROM Vorspeise, Hauptspeise, Nachspeise WHERE Vorspeise.name = 'Salat'"), 'Ergebnisrelation: Salat-Menüs')); } catch { sampleSlot.append(element('p', 'feedback error', 'Die Beispielanfrage konnte nicht ausgeführt werden.')); } } else sampleSlot.append(element('p', 'feedback hint', 'Die Beispielrelation wird geladen …'));
}
function renderMenuSummary(panel) {
  panel.append(menuHeading(4, 'Sichern und übertragen', 'Zusammenfassung'));
  const summary = element('section', 'short-summary'); summary.append(element('h2', '', 'Das Wichtigste'), listFrom(['Mehrere Tabellen in FROM → Kreuzprodukt.', 'Jeder Datensatz wird mit jedem Datensatz der weiteren Tabellen kombiniert.', 'Anzahl der Ergebniszeilen = Produkt der Anzahlen der Ausgangszeilen.', 'WHERE schränkt die Ergebnisrelation ein.', 'Der Vergleich von Fremd- und Primärschlüssel kann aus dem Kreuzprodukt einen sinnvollen Verbund machen.'])); const results = element('p', 'summary-results', 'Ergebnisse: 4 · 3 · 1 = 12 Menüs; Salat filtert 3 Zeilen; Pizza filtert 4 Zeilen.'); summary.append(results); panel.append(summary);
}
function menuQuizSelection(id) { return Array.isArray(menuState.quiz?.[id]) ? menuState.quiz[id] : []; }
function renderMenuQuiz(panel) {
  panel.append(menuHeading(5, 'Sichern', 'Abschlussquiz'));
  const card = element('section', 'task-card');
  card.append(element('h3', '', 'Abschlussquiz'), element('p', '', 'Kreuze alle richtigen Antworten an. Bei jeder Frage sind mehrere Antworten richtig.'));
  const form = element('form', 'final-quiz'); form.id = 'final-quiz'; form.noValidate = true;
  MENU_QUIZ.forEach((question, index) => {
    const group = document.createElement('fieldset'); const legend = document.createElement('legend');
    legend.append(element('span', '', String(index + 1)), document.createTextNode(question.prompt)); group.append(legend);
    const choices = element('div', 'choice-list');
    question.options.forEach((option) => { const label = element('label', 'choice-option'); const input = document.createElement('input'); input.type = 'checkbox'; input.name = `menu-quiz-${question.id}`; input.value = option.id; input.checked = menuQuizSelection(question.id).includes(option.id); input.addEventListener('change', () => { const current = menuQuizSelection(question.id); menuState.quiz[question.id] = input.checked ? [...new Set([...current, option.id])] : current.filter((id) => id !== option.id); delete menuState.feedback.quiz; card.querySelector('.menu-feedback')?.remove(); saveMenuState(); }); label.append(input, element('span', '', option.text)); choices.append(label); });
    group.append(choices); form.append(group);
  });
  const actions = element('div', 'action-row'); const button = element('button', 'primary-button', 'Quiz prüfen'); button.type = 'submit'; actions.append(button); form.append(actions);
  form.addEventListener('submit', (event) => { event.preventDefault(); const unanswered = MENU_QUIZ.flatMap((question, index) => menuQuizSelection(question.id).length ? [] : [index + 1]); if (unanswered.length) menuFeedback('quiz', 'hint', `Beantworte zuerst alle Fragen. Noch ohne Kreuz: Frage ${unanswered.join(', ')}.`); else { const results = MENU_QUIZ.map((question) => evaluateQuizQuestion(question, menuQuizSelection(question.id))); const count = results.filter(Boolean).length; if (count === 3) menuFeedback('quiz', 'success', 'Korrekt: Alle drei Fragen stimmen.'); else { const wrong = MENU_QUIZ.flatMap((question, index) => results[index] ? [] : [index + 1]); const hints = MENU_QUIZ.filter((question, index) => !results[index]).map((question) => question.hint).join(' '); menuFeedback('quiz', count ? 'partial' : 'hint', `${count ? `Teilweise korrekt: ${count} von 3 Fragen stimmen.` : 'Noch nicht korrekt.'} Prüfe Frage ${wrong.join(', ')} noch einmal. ${hints}`); } } renderMenuModule(); });
  card.append(form); renderMenuFeedback(card, 'quiz'); panel.append(card);
}
function listFrom(lines) { const list = document.createElement('ul'); lines.forEach((line) => list.append(element('li', '', line))); return list; }
async function initMenuCrossProduct() { restoreMenuState(); renderMenuModule(); const status = document.getElementById('data-status'); try { database = new SqlWorker(); await database.init({ mode: 'menu-cross-product' }); databaseReady = true; status.textContent = 'Die drei Mensa-Tabellen sind geladen. Du kannst SQL-Anfragen ausführen.'; status.className = 'feedback success'; status.setAttribute('aria-busy', 'false'); renderMenuModule(); } catch (error) { status.textContent = 'Die Mensa-Tabellen konnten nicht geladen werden. Bitte lade die Seite neu.'; status.className = 'feedback error'; status.setAttribute('aria-busy', 'false'); console.error(error); } document.getElementById('reset-module').addEventListener('click', () => { if (window.confirm('Möchtest du alle Eingaben und den Fortschritt dieser Aufgabe zurücksetzen?')) { try { localStorage.removeItem(MENU_STORAGE_KEY); } catch { /* Ohne Speicher weiter nutzbar. */ } location.reload(); } }); window.addEventListener('beforeunload', () => database?.close()); }

// Aufgabe 7 baut den Verbund in zwei prüfbaren Schritten aus derselben SQL-Datenbank auf.
const VERBUND_STORAGE_KEY = 'inf10-song-verbund-v1';
const VERBUND_TABS = [['source', 'Ausgangstabellen'], ['cross', 'Wie viele Kombinationen sind möglich?'], ['first', 'Erste Verbindung'], ['second', 'Zweite Verbindung'], ['sql', 'SQL-Anfrage'], ['check', 'Abschlussquiz']];
const verbundState = { tab: 'source', mapping: '', prediction: '', crossExecuted: false, crossClass: {}, firstColumns: [], secondColumns: [], operator: '', answers: {}, results: {}, feedback: {}, check: {}, completed: {}, summaryUnlocked: false };
function saveVerbundState() { try { localStorage.setItem(VERBUND_STORAGE_KEY, JSON.stringify(verbundState)); } catch { /* Ohne Speicher bleibt das Modul bedienbar. */ } }
function restoreVerbundState() { try { Object.assign(verbundState, JSON.parse(localStorage.getItem(VERBUND_STORAGE_KEY) || '{}')); } catch { /* Speicherstand ist optional. */ } dropLegacyQuizAnswers(); }
// Vor dem Abschlussquiz speicherte check je Frage eine einzelne Antwort als Text.
// Solche Altstände werden verworfen, der übrige Fortschritt bleibt erhalten.
function dropLegacyQuizAnswers() { if (!verbundState.check || typeof verbundState.check !== 'object') { verbundState.check = {}; return; } Object.keys(verbundState.check).forEach((key) => { if (!Array.isArray(verbundState.check[key])) delete verbundState.check[key]; }); }
function verbundFeedback(id, level, text) { verbundState.feedback[id] = { level, text }; saveVerbundState(); }
function verbundDone(id) { return Boolean(verbundState.completed[id]); }
function crossDone() { return verbundState.prediction === '32' && verbundState.crossExecuted && verbundState.crossClass.good === 'passend' && verbundState.crossClass.song === 'unpassend' && verbundState.crossClass.playlist === 'unpassend'; }
function availableVerbundTab(id) { return VERBUND_TABS.some(([tab]) => tab === id); }
function completeVerbund(id) { verbundState.completed[id] = true; saveVerbundState(); }
function activateVerbundTab(id, { focusContent = false } = {}) { const allowed = id === 'summary' ? verbundState.summaryUnlocked : availableVerbundTab(id); if (!allowed) return; verbundState.tab = id; saveVerbundState(); renderVerbundModule({ focusContent }); }
function renderVerbundModule({ focusContent = false } = {}) {
  if (!availableVerbundTab(verbundState.tab) && verbundState.tab !== 'summary') verbundState.tab = 'source';
  if (verbundState.tab === 'summary' && !verbundState.summaryUnlocked) verbundState.tab = 'source';
  const labels = verbundState.summaryUnlocked ? [...VERBUND_TABS, ['summary', 'Übersicht']] : VERBUND_TABS;
  const progress = document.getElementById('verbund-progress'); if (progress) progress.textContent = verbundState.tab === 'summary' ? 'Übersicht freigeschaltet' : `Schritt ${Math.max(1, VERBUND_TABS.findIndex(([id]) => id === verbundState.tab) + 1)} von 6`;
  const tabs = document.getElementById('verbund-tabs'); tabs.replaceChildren();
  labels.forEach(([id, label], index) => { const button = element('button', 'step-tab', label); button.type = 'button'; button.id = `tab-${id}`; button.dataset.tab = id; button.role = 'tab'; button.ariaSelected = String(verbundState.tab === id); button.tabIndex = verbundState.tab === id ? 0 : -1; const allowed = id === 'summary' ? verbundState.summaryUnlocked : availableVerbundTab(id); button.disabled = !allowed; if (verbundDone(id)) button.classList.add('is-complete'); button.setAttribute('aria-controls', 'verbund-panel'); button.addEventListener('click', () => activateVerbundTab(id)); button.addEventListener('keydown', (event) => moveTabFocus(event, labels.filter(([tab]) => tab === 'summary' || availableVerbundTab(tab)), Math.max(0, labels.filter(([tab]) => tab === 'summary' || availableVerbundTab(tab)).findIndex(([tab]) => tab === id)))); tabs.append(button); });
  const panel = document.getElementById('verbund-panel'); panel.replaceChildren(); panel.setAttribute('aria-labelledby', `tab-${verbundState.tab}`);
  panel.append(schemaCard(SONG_VERBUND_TABLE_SCHEMAS));
  if (verbundState.tab === 'source') renderVerbundSource(panel); if (verbundState.tab === 'cross') renderVerbundCross(panel); if (verbundState.tab === 'first') renderVerbundFirst(panel); if (verbundState.tab === 'second') renderVerbundSecond(panel); if (verbundState.tab === 'sql') renderVerbundSql(panel); if (verbundState.tab === 'check') renderVerbundCheck(panel); if (verbundState.tab === 'summary') renderVerbundSummary(panel);
  renderTabFlowNavigation(panel, { items: labels.map(([id, label]) => ({ id, label })), currentId: verbundState.tab, onNavigate: activateVerbundTab, isEnabled: (id) => id === 'summary' ? verbundState.summaryUnlocked : availableVerbundTab(id) });
  syncTabSemantics(tabs, verbundState.tab);
  if (focusContent) focusTabPanelStart(panel);
}
function verbundHeading(number, kicker, title) { const heading = element('div', 'step-heading'); heading.append(element('span', 'step-number', String(number))); const copy = element('div'); copy.append(element('p', 'step-kicker', kicker), element('h2', '', title)); heading.append(copy); return heading; }
function appendVerbundFeedback(card, id) { const feedback = verbundState.feedback[id]; if (!feedback) return; const box = element('p', `feedback ${feedback.level}`, feedback.text); box.setAttribute('aria-live', 'polite'); card.append(box); }
function renderSongSourceTables(options = {}) {
  const wrapper = element('div', 'song-source-tables');
  SONG_VERBUND_COLUMN_GROUPS.forEach(({ table: tableName, columns }) => { const section = element('section', 'table-shell song-source-table'); const scroll = element('div', 'table-scroll'); scroll.tabIndex = 0; scroll.setAttribute('aria-label', `Tabelle ${tableName} horizontal scrollen`); const table = document.createElement('table'); table.append(element('caption', '', tableName)); const head = document.createElement('thead'); const tr = document.createElement('tr'); columns.forEach((column) => { const qualified = `${tableName}.${column}`; const keyText = qualified === 'Song.id' || qualified === 'Playlist.id' ? 'PK – Primärschlüssel' : qualified === 'Song_in_Playlist.song_id' ? 'FK → Song.id' : qualified === 'Song_in_Playlist.playlist_id' ? 'FK → Playlist.id' : ''; const th = document.createElement('th'); th.scope = 'col'; if (options.selectable) { const button = element('button', 'column-selector', column); button.type = 'button'; button.dataset.column = qualified; button.setAttribute('aria-pressed', String(options.selected.includes(qualified))); button.setAttribute('aria-label', `Spalte ${qualified} auswählen`); button.addEventListener('click', () => options.onSelect(qualified)); th.append(button); } else th.append(element('span', '', column)); if (keyText) th.append(element('small', 'key-label', keyText)); tr.append(th); }); head.append(tr); const body = document.createElement('tbody'); SONG_VERBUND_TABLES[tableName].forEach((row) => { const line = document.createElement('tr'); columns.forEach((column) => line.append(element('td', '', String(row[column])))); body.append(line); }); table.append(head, body); scroll.append(table); section.append(scroll); wrapper.append(section); }); return wrapper;
}
function renderVerbundSource(panel) {
  panel.append(verbundHeading(1, 'Entdecken', 'Ausgangstabellen')); const scenario = element('section', 'scenario-card accent'); scenario.append(element('h3', '', 'Welche Songs gehören zu welcher Playlist?'), element('p', '', 'Betrachte zuerst die drei Tabellen und ihre Schlüssel.')); scenario.append(renderSongSourceTables()); panel.append(scenario);
  const task = element('section', 'task-card'); task.append(element('h3', '', 'Zuordnungstabelle finden'), element('p', '', 'Welche Tabelle speichert die Zuordnungen von Songs zu Playlists?')); const choices = element('div', 'choice-list'); SONG_VERBUND_TABLE_NAMES.forEach((name) => { const label = element('label', 'choice-option'); const input = document.createElement('input'); input.type = 'radio'; input.name = 'verbund-mapping'; input.value = name; input.checked = verbundState.mapping === name; input.addEventListener('change', () => { verbundState.mapping = name; delete verbundState.feedback.mapping; task.querySelector('.feedback')?.remove(); saveVerbundState(); }); label.append(input, element('span', '', name)); choices.append(label); }); const button = element('button', 'primary-button', 'Auswahl prüfen'); button.type = 'button'; button.addEventListener('click', () => { if (verbundState.mapping === 'Song_in_Playlist') { completeVerbund('source'); verbundFeedback('mapping', 'success', 'Korrekt: Song_in_Playlist enthält jeweils die Nummer eines Songs und einer Playlist. Schritt 2 ist freigeschaltet.'); } else verbundFeedback('mapping', 'hint', 'Noch nicht korrekt. Suche die Tabelle, die zwei Fremdschlüssel enthält.'); renderVerbundModule(); }); task.append(choices, button); appendVerbundFeedback(task, 'mapping'); panel.append(task);
}
function renderVerbundCross(panel) {
  panel.append(verbundHeading(2, 'Beobachten', 'Wie viele Kombinationen sind möglich?')); const task = element('section', 'task-card sql-task'); task.append(element('h3', '', 'Vorhersage'), element('p', '', 'Wie viele Zeilen entstehen ohne Bedingung aus 4 Songs, 4 Zuordnungszeilen und 2 Playlists?')); const label = element('label', 'sql-label', 'Erwartete Anzahl der Zeilen'); label.htmlFor = 'verbund-prediction'; const input = document.createElement('input'); input.id = label.htmlFor; input.type = 'number'; input.inputMode = 'numeric'; input.min = '0'; input.className = 'menu-number-input'; input.value = verbundState.prediction; input.addEventListener('input', () => { verbundState.prediction = input.value; delete verbundState.feedback.prediction; task.querySelector('.feedback')?.remove(); saveVerbundState(); }); const button = element('button', 'primary-button', 'Anzahl prüfen'); button.type = 'button'; button.addEventListener('click', () => { if (Number(verbundState.prediction) === 32) { verbundState.prediction = '32'; verbundFeedback('prediction', 'success', 'Korrekt: 4 · 4 · 2 = 32 Kombinationen.'); } else verbundFeedback('prediction', 'hint', 'Noch nicht korrekt. Multipliziere die Anzahl der Zeilen aller drei Tabellen.'); renderVerbundModule(); }); task.append(label, input, button); appendVerbundFeedback(task, 'prediction'); panel.append(task);
  if (verbundState.prediction === '32') { const resultCard = element('section', 'task-card'); resultCard.append(element('h3', '', 'Kreuzprodukt ausführen'), element('p', '', 'Führe die Abfrage aus. Sie verbindet zunächst jede Zeile mit jeder anderen Zeile.')); resultCard.append(codeBlock(SONG_VERBUND_SQL.crossProduct)); const run = element('button', 'primary-button', 'Alle möglichen Kombinationen anzeigen'); run.type = 'button'; run.disabled = !databaseReady; run.addEventListener('click', async () => { try { verbundState.results.cross = await database.exec(SONG_VERBUND_SQL.crossProduct); verbundState.crossExecuted = true; verbundFeedback('cross-run', 'success', 'Die SQL-Abfrage liefert 32 Kombinationen.'); saveVerbundState(); renderVerbundModule(); } catch (error) { verbundFeedback('cross-run', 'error', `SQL-Fehler: ${explainSqlError(error)}`); renderVerbundModule(); } }); resultCard.append(run); appendVerbundFeedback(resultCard, 'cross-run'); if (verbundState.results.cross) resultCard.append(renderSongRelation(verbundState.results.cross, 'Ergebnisrelation: 32 Kombinationen')); panel.append(resultCard); }
  if (verbundState.crossExecuted) { const classify = element('section', 'task-card'); classify.append(element('h3', '', 'Drei Kombinationen beurteilen'), element('p', '', 'Passt der Song in die jeweilige Playlist?')); const examples = [['good', 'Gaslighter (Song.id = 1 / Song_in_Playlist.song_id = 1) / Good Oldies (Playlist.id = 1 / Song_in_Playlist.playlist_id = 1)', 'passend'], ['song', 'Gaslighter (Song.id = 1 / Song_in_Playlist.song_id = 2) / Fussballhits (Playlist.id = 2 / Song_in_Playlist.playlist_id = 2)', 'unpassend'], ['playlist', 'Try (Song.id = 3 / Song_in_Playlist.song_id = 3) / Fussballhits (Playlist.id = 2 / Song_in_Playlist.playlist_id = 1)', 'unpassend']]; examples.forEach(([id, text]) => { const group = element('fieldset', 'verbund-classify'); group.append(element('legend', '', text)); ['passend', 'unpassend'].forEach((value) => { const label = element('label', 'choice-option'); const radio = document.createElement('input'); radio.type = 'radio'; radio.name = `cross-${id}`; radio.value = value; radio.checked = verbundState.crossClass[id] === value; radio.addEventListener('change', () => { verbundState.crossClass[id] = value; delete verbundState.feedback.classify; classify.querySelector('.feedback')?.remove(); saveVerbundState(); }); label.append(radio, element('span', '', value)); group.append(label); }); classify.append(group); }); const check = element('button', 'primary-button', 'Beurteilungen prüfen'); check.type = 'button'; check.addEventListener('click', () => { if (crossDone()) { completeVerbund('cross'); verbundFeedback('classify', 'success', 'Korrekt: Bei Gaslighter passt Song.id 1 nicht zu Song_in_Playlist.song_id 2. Bei Try passt Song_in_Playlist.playlist_id 1 nicht zu Playlist.id 2.'); } else verbundFeedback('classify', 'hint', 'Noch nicht korrekt. Gaslighter gehört zur Zuordnungszeile mit song_id 1 und playlist_id 1; Try gehört nicht zu Fussballhits.'); renderVerbundModule(); }); classify.append(check); appendVerbundFeedback(classify, 'classify'); panel.append(classify); }
}
function toggleVerbundColumn(property, column) { const selected = verbundState[property]; verbundState[property] = selected.includes(column) ? selected.filter((item) => item !== column) : selected.length < 2 ? [...selected, column] : [selected[1], column]; delete verbundState.feedback[property]; saveVerbundState(); renderVerbundModule(); }
function renderSongRelation(relation, title, free = false) { const output = renderRelation(relation, { title, caption: title, ...(free ? {} : { columns: SONG_VERBUND_COLUMNS, columnGroups: SONG_VERBUND_COLUMN_GROUPS }) }); output.classList.add('verbund-result'); return output; }
function renderVerbundFirst(panel) {
  panel.append(verbundHeading(3, 'Verstehen', 'Erste Verbindung')); const card = element('section', 'task-card'); card.append(element('h3', '', 'Passende Song-Nummern verbinden'), element('p', '', 'Wähle genau die zwei Spalten, deren Werte dieselbe Song-Nummer meinen. Klicke zum Auswählen einer Spalte auf den Namen einer Spalte.')); card.append(renderSongSourceTables({ selectable: true, selected: verbundState.firstColumns, onSelect: (column) => toggleVerbundColumn('firstColumns', column) })); card.append(element('p', 'selected-columns', verbundState.firstColumns.length ? `Gewählt: ${verbundState.firstColumns.join(' = ')}` : 'Noch keine zwei Spalten gewählt.')); appendHints(card, SONG_VERBUND_VISIBLE_TEXT.firstHints); const button = element('button', 'primary-button', 'Verbindung prüfen'); button.type = 'button'; button.addEventListener('click', async () => { if (!evaluateFirstConnection(verbundState.firstColumns)) { verbundFeedback('firstColumns', 'hint', 'Noch nicht korrekt. Ein Primärschlüssel aus Song muss zu dem Fremdschlüssel passen, der auf ihn zeigt.'); renderVerbundModule(); return; } try { verbundState.results.first = await database.exec(SONG_VERBUND_SQL.firstConnection); completeVerbund('first'); verbundFeedback('firstColumns', 'success', 'Korrekt: Die erste Bedingung lässt 8 Zeilen übrig. Jede passende Song-Zuordnung wird aber noch mit beiden Playlists kombiniert. Die entsprechende Bedingung lautet WHERE Song.id = Song_in_Playlist.song_id.'); saveVerbundState(); renderVerbundModule(); } catch (error) { verbundFeedback('firstColumns', 'error', `SQL-Fehler: ${explainSqlError(error)}`); renderVerbundModule(); } }); card.append(button); appendVerbundFeedback(card, 'firstColumns'); if (verbundState.results.first) card.append(renderSongRelation(verbundState.results.first, 'Ergebnisrelation: erste Verbindung (8 Zeilen)')); panel.append(card);
}
function renderVerbundSecond(panel) {
  panel.append(verbundHeading(4, 'Anwenden', 'Zweite Verbindung')); const card = element('section', 'task-card'); card.append(element('h3', '', 'Auch die Playlist passend verbinden'), element('p', '', 'Die erste Bedingung steht fest. Wähle die zweite Spaltenverbindung und die passende Verknüpfung.')); card.append(codeBlock('Song.id = Song_in_Playlist.song_id')); const operators = element('div', 'choice-list'); ['AND', 'OR'].forEach((operator) => { const label = element('label', 'choice-option'); const radio = document.createElement('input'); radio.type = 'radio'; radio.name = 'verbund-operator'; radio.value = operator; radio.checked = verbundState.operator === operator; radio.addEventListener('change', () => { verbundState.operator = operator; delete verbundState.feedback.secondColumns; card.querySelector('.feedback')?.remove(); saveVerbundState(); }); label.append(radio, element('span', '', operator)); operators.append(label); }); card.append(operators, renderSongSourceTables({ selectable: true, selected: verbundState.secondColumns, onSelect: (column) => toggleVerbundColumn('secondColumns', column) }), element('p', 'selected-columns', verbundState.secondColumns.length ? `Gewählt: ${verbundState.secondColumns.join(' = ')}` : 'Noch keine zwei Spalten gewählt.')); appendHints(card, SONG_VERBUND_VISIBLE_TEXT.secondHints); const button = element('button', 'primary-button', 'Vollständigen Verbund prüfen'); button.type = 'button'; button.addEventListener('click', async () => { if (!evaluateSecondConnection(verbundState.secondColumns, verbundState.operator)) { const text = verbundState.operator === 'OR' ? 'Noch nicht korrekt: Mit OR genügt schon eine Bedingung; beide Verbindungen müssen gleichzeitig stimmen.' : 'Noch nicht korrekt. Verbinde Playlist.id mit dem passenden Fremdschlüssel und wähle AND.'; verbundFeedback('secondColumns', 'hint', text); renderVerbundModule(); return; } try { verbundState.results.second = await database.exec(SONG_VERBUND_SQL.fullConnection); completeVerbund('second'); verbundFeedback('secondColumns', 'success', 'Korrekt: Jetzt bleiben genau 4 sinnvolle Song-Playlist-Zuordnungen. Die vollständige Bedingung in der WHERE-Klausel lautet nun WHERE Song.id = Song_in_Playlist.song_id AND Playlist.id = Song_in_Playlist.playlist_id. Den ersten Teil kennst du bereits aus der vorherigen Aufgabe.'); saveVerbundState(); renderVerbundModule(); } catch (error) { verbundFeedback('secondColumns', 'error', `SQL-Fehler: ${explainSqlError(error)}`); renderVerbundModule(); } }); card.append(button); appendVerbundFeedback(card, 'secondColumns'); if (verbundState.results.second) { card.append(renderSongRelation(verbundState.results.second, 'Ergebnisrelation: vollständiger Verbund (4 Zeilen)')); card.append(renderPairList()); } panel.append(card);
}
function renderPairList() { const section = element('section', 'short-summary'); section.append(element('h3', '', 'Die vier passenden Paare')); const list = document.createElement('ul'); SONG_PLAYLIST_PAIRS.forEach(({ song, playlist }) => list.append(element('li', '', `${song} → ${playlist}`))); section.append(list); return section; }
function renderVerbundSql(panel) {
  panel.append(verbundHeading(5, 'Übertragen', 'SQL-Anfrage')); const card = element('section', 'task-card sql-task'); card.append(element('h3', '', 'Vollständigen Verbund selbst formulieren'), element('p', '', 'Schreibe eine SELECT-Anfrage, die genau die vier passenden Song-Playlist-Zuordnungen ausgibt.')); const label = element('label', 'sql-label', 'Deine vollständige SQL-Anweisung'); label.htmlFor = 'verbund-sql-input'; const input = document.createElement('textarea'); input.id = label.htmlFor; input.className = 'sql-input'; input.spellcheck = false; input.placeholder = NEUTRAL_SQL_PLACEHOLDER; input.value = verbundState.answers.sql || ''; input.addEventListener('input', () => { verbundState.answers.sql = input.value; delete verbundState.feedback.sql; delete verbundState.results.sql; card.querySelector('.feedback')?.remove(); card.querySelector('.verbund-result')?.remove(); saveVerbundState(); }); input.addEventListener('keydown', (event) => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); runVerbundSql(); } }); card.append(label, input); appendHints(card, SONG_VERBUND_VISIBLE_TEXT.sqlHints); const run = element('button', 'primary-button', 'SQL-Anfrage prüfen'); run.type = 'button'; run.disabled = !databaseReady; run.addEventListener('click', runVerbundSql); card.append(run, element('span', 'shortcut-hint', 'Strg/Cmd + Enter')); appendVerbundFeedback(card, 'sql'); if (verbundState.results.sql && verbundState.feedback.sql?.level === 'success') card.append(renderSongRelation(verbundState.results.sql, 'Ergebnisrelation deiner Anfrage (4 Zeilen)', true)); panel.append(card);
}
async function runVerbundSql() {
  const checked = validateSelectStatement(verbundState.answers.sql || '');
  delete verbundState.results.sql;
  delete verbundState.completed.sql;
  if (!checked.ok) { verbundFeedback('sql', 'hint', checked.message); renderVerbundModule(); return; }
  try {
    const result = await assessMultiTableSql(checked.sql, SONG_VERBUND_SQL.fullConnection, SONG_VERBUND_TABLE_SCHEMAS, 'song');
    if (result.actual) { verbundState.results.sql = result.actual; completeVerbund('sql'); }
    verbundFeedback('sql', result.level, result.text || 'Korrekt: Deine Anfrage liefert genau die vier passenden Zuordnungen.');
  } catch (error) { verbundFeedback('sql', 'error', diagnoseMultiTableError(error, checked.sql, SONG_VERBUND_TABLE_NAMES, SONG_VERBUND_TABLE_SCHEMAS)); }
  saveVerbundState(); renderVerbundModule();
}
function quizSelection(questionId) { const stored = verbundState.check[questionId]; return Array.isArray(stored) ? stored : []; }
function toggleQuizOption(questionId, optionId, checked) { const current = quizSelection(questionId); verbundState.check[questionId] = checked ? [...current, optionId] : current.filter((item) => item !== optionId); delete verbundState.feedback.check; saveVerbundState(); }
function quizNumbers(predicate) { return SONG_VERBUND_QUIZ.map((question, index) => predicate(question, index) ? index + 1 : null).filter(Boolean).join(', '); }
function checkVerbundQuiz() {
  const results = SONG_VERBUND_QUIZ.map((question) => evaluateQuizQuestion(question, quizSelection(question.id)));
  const open = quizNumbers((question) => !quizSelection(question.id).length);
  const correct = results.filter(Boolean).length;
  if (open) verbundFeedback('check', 'hint', `Beantworte zuerst alle Fragen. Noch ohne Kreuz: Frage ${open}.`);
  else if (correct === SONG_VERBUND_QUIZ.length) { completeVerbund('check'); verbundState.summaryUnlocked = true; verbundFeedback('check', 'success', `Korrekt: Alle ${SONG_VERBUND_QUIZ.length} Fragen stimmen. Die Übersicht ist freigeschaltet.`); }
  else { const wrong = quizNumbers((question, index) => !results[index]); const hints = SONG_VERBUND_QUIZ.filter((question, index) => !results[index]).map((question) => question.hint).join(' '); const lead = correct ? `Teilweise korrekt: ${correct} von ${SONG_VERBUND_QUIZ.length} Fragen stimmen.` : 'Noch nicht korrekt.'; verbundFeedback('check', correct ? 'partial' : 'hint', `${lead} Prüfe Frage ${wrong} noch einmal. ${hints}`); }
  saveVerbundState(); renderVerbundModule();
}
function renderVerbundCheck(panel) {
  panel.append(verbundHeading(6, 'Sichern', 'Abschlussquiz')); const card = element('section', 'task-card'); card.append(element('h3', '', `${SONG_VERBUND_QUIZ.length} Fragen zum Verbund`), element('p', '', 'Kreuze alle richtigen Antworten an. Bei manchen Fragen sind mehrere Antworten richtig.'));
  const form = element('form', 'final-quiz'); form.id = 'final-quiz'; form.noValidate = true;
  SONG_VERBUND_QUIZ.forEach((question, index) => { const group = document.createElement('fieldset'); const legend = document.createElement('legend'); legend.append(element('span', '', String(index + 1)), document.createTextNode(question.prompt)); group.append(legend); const choices = element('div', 'choice-list'); question.options.forEach((option) => { const label = element('label', 'choice-option'); const input = document.createElement('input'); input.type = 'checkbox'; input.name = `verbund-quiz-${question.id}`; input.value = option.id; input.checked = quizSelection(question.id).includes(option.id); input.addEventListener('change', () => { toggleQuizOption(question.id, option.id, input.checked); card.querySelector('.feedback')?.remove(); }); label.append(input, element('span', '', option.text)); choices.append(label); }); group.append(choices); form.append(group); });
  const actions = element('div', 'action-row'); const button = element('button', 'primary-button', 'Quiz prüfen'); button.type = 'submit'; actions.append(button); form.append(actions);
  form.addEventListener('submit', (event) => { event.preventDefault(); checkVerbundQuiz(); });
  card.append(form); appendVerbundFeedback(card, 'check'); panel.append(card);
}
function renderVerbundSummary(panel) {
  panel.append(verbundHeading(7, 'Zusammenfassen', 'Übersicht')); const card = element('section', 'short-summary'); card.append(element('h2', '', 'Der Weg zum Verbund')); card.append(listFrom(['Ausgangsfrage: Welche Songs gehören zu welcher Playlist? Die Zuordnungstabelle heißt Song_in_Playlist.', 'Kreuzprodukt: 4 · 4 · 2 = 32 Kombinationen.', 'Erste Verbindung: Song.id = Song_in_Playlist.song_id → 8 Zeilen.', 'Zweite Verbindung: Playlist.id = Song_in_Playlist.playlist_id und AND → 4 Zeilen.', 'Struktur: 3 Tabellen und 2 Verbindungen.'])); card.append(element('h3', '', 'Vollständige Anfrage'), codeBlock(SONG_VERBUND_SQL.fullConnection)); const memory = element('section', 'short-summary verbund-memory'); memory.append(element('h3', '', 'Merksatz'), element('p', '', SONG_VERBUND_VISIBLE_TEXT.memory)); card.append(memory, renderPairList(), renderQuizSolutions()); panel.append(card);
}
function renderQuizSolutions() {
  const section = element('section', 'short-summary'); section.append(element('h3', '', 'Abschlussquiz: Fragen und richtige Antworten')); const list = document.createElement('ol');
  SONG_VERBUND_QUIZ.forEach((question) => { const item = document.createElement('li'); item.append(element('strong', '', question.prompt)); const answers = document.createElement('ul'); question.options.filter((option) => option.correct).forEach((option) => answers.append(element('li', '', option.text))); item.append(answers); list.append(item); });
  section.append(list); return section;
}
async function initSongVerbund() { restoreVerbundState(); renderVerbundModule(); const status = document.getElementById('data-status'); try { database = new SqlWorker(); await database.init({ mode: 'song-verbund' }); databaseReady = true; status.textContent = 'Die drei Song-Tabellen sind geladen. Du kannst SQL-Anfragen ausführen.'; status.className = 'feedback success'; status.setAttribute('aria-busy', 'false'); renderVerbundModule(); } catch (error) { status.textContent = 'Die Song-Tabellen konnten nicht geladen werden. Bitte lade die Seite neu.'; status.className = 'feedback error'; status.setAttribute('aria-busy', 'false'); console.error(error); } document.getElementById('reset-module').addEventListener('click', () => { if (window.confirm('Möchtest du alle Eingaben und den Fortschritt dieser Aufgabe zurücksetzen?')) { try { localStorage.removeItem(VERBUND_STORAGE_KEY); } catch { /* Ohne Speicher weiter nutzbar. */ } location.reload(); } }); window.addEventListener('beforeunload', () => database?.close()); }

async function init() { restore(); render(); const status = document.getElementById('data-status'); try { database = new SqlWorker(); await database.init(); const response = await fetch('users.csv'); if (!response.ok) throw new Error('users.csv konnte nicht geladen werden.'); const [headers, ...rows] = parseDelimited(await response.text()); introRows = rows.slice(0, 4).map((row) => Object.fromEntries(headers.map((header, index) => [header, row[index]]))); databaseReady = true; status.textContent = 'Die Tabelle users ist geladen. Du kannst SQL-Anfragen ausführen.'; status.className = 'feedback success'; status.setAttribute('aria-busy', 'false'); render(); } catch (error) { status.textContent = 'Die Übungsdaten konnten nicht geladen werden. Bitte lade die Seite neu.'; status.className = 'feedback error'; status.setAttribute('aria-busy', 'false'); console.error(error); document.querySelectorAll('.sql-input, .sql-task button').forEach((node) => { if (node.classList.contains('primary-button') && !node.closest('.sql-intro')) node.disabled = true; }); } document.getElementById('reset-module').addEventListener('click', () => { if (window.confirm('Möchtest du alle SQL-Eingaben und den Fortschritt dieser Aufgabe zurücksetzen?')) { try { localStorage.removeItem(STORAGE_KEY); } catch { /* Ohne Speicher weiter nutzbar. */ } location.reload(); } }); window.addEventListener('beforeunload', () => database?.close()); }
document.addEventListener('DOMContentLoaded', () => document.body.dataset.sqlModule === 'menu-cross-product' ? initMenuCrossProduct() : document.body.dataset.sqlModule === 'song-verbund' ? initSongVerbund() : init());
