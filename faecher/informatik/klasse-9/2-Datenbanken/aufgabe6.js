import { readSplitProgress } from './sql9-progress-migration.mjs';
import { compareRelations, normalizeRelation, parseDelimited, sqlTokens, validateSelectStatement } from '../../klasse-10/1-Datenbanken/sql-lab-core.mjs?v=20260929b';
import { enableTabKeyboardNavigation, focusTabPanelStart, renderTabFlowNavigation, syncTabSemantics } from '../../klasse-10/1-Datenbanken/tab-navigation.mjs?v=20260906a';

// nach USERS_TABLE_SCHEMAS in klasse-10/1-Datenbanken/sql-lab.js, wortgleich
const USERS_TABLE_SCHEMAS = Object.freeze([
  Object.freeze({ table: 'users', columns: Object.freeze([
    ['id', 'int'], ['name', 'varchar(255)'], ['username', 'varchar(255)'], ['email', 'varchar(255)'],
    ['email_verified_at', 'date'], ['password', 'varchar(255)'], ['bio', 'varchar(255)'], ['gender', 'varchar(255)'],
    ['birthday', 'date'], ['city', 'varchar(255)'], ['country', 'varchar(255)'], ['centimeters', 'int'],
    ['avatar', 'varchar(255)'], ['role', 'varchar(255)'], ['is_active', 'int'], ['remember_token', 'varchar(255)'],
    ['created_at', 'date'], ['updated_at', 'date']
  ]) })
]);
const USER_COLUMN_NAMES = USERS_TABLE_SCHEMAS[0].columns.map(([name]) => name);


const STORAGE_KEY = 'informatik9-datenbanken-aufgabe6-aggregate-v1';
const MIGRATION_MARKER = `${STORAGE_KEY}-migration-done`;
const NEUTRAL_SQL_PLACEHOLDER = 'SELECT ...\nFROM ...';
const TABS = [
  ['intro','Einstieg','Entdecken','Wie findet MIN den frühesten Wert?'],
  ['count','Zählen und benennen','Anwenden','Zählen und benennen'],
  ['extremes','Kleinster und größter Wert','Anwenden','Extremwerte'],
  ['average','Summe und Durchschnitt','Anwenden','Summe und Durchschnitt'],
  ['fast','Für die Schnellen','Übertragen','Für die Schnellen'],
  ['quiz','Abschlussquiz und Auswertung','Sichern','Abschlussquiz und Auswertung']
];
const FEEDBACK_LEVELS = ['success','partial','hint','error'];
const makeTask = (number,tab,prompt,sql,hints,ok,partial,wrong,table='users', projection='value') => ({id:`t${number}`,number,tab,block:tab==='fast'?'fast':'core',prompt,sql,hints,texts:{ok,partial,wrong},table,projection});
const TASKS = [
 makeTask(1,'count','**Zähle** alle Einträge in users. **Benenne** die Ergebnisspalte Anzahl.','SELECT COUNT(*) AS Anzahl\nFROM users',['Überlege, ob alle Zeilen oder nur eingetragene Werte einer Spalte gezählt werden sollen.','COUNT(*) zählt sämtliche Zeilen; AS bestimmt die Überschrift.','Beginne mit `SELECT COUNT(*) AS Anzahl` und ergänze die Tabelle.'],'Korrekt: Du zählst alle Einträge und benennst die Ergebnisspalte Anzahl.','Teilweise korrekt: Die Anzahl stimmt, aber prüfe die Überschrift der Ergebnisspalte.','Noch nicht korrekt: Zähle alle Zeilen mit COUNT(*) und lies aus users.','users','aggregate'),
 makeTask(2,'count','**Zähle** die registrierten Mitglieder aus Berlin.','SELECT COUNT(*)\nFROM users\nWHERE city = \'Berlin\'',['Welche Zeilen sollen vor dem Zählen übrig bleiben?','Filtere zuerst den Wohnort mit WHERE.','Nutze `WHERE city = \'Berlin\'` zusammen mit einer Zählfunktion.'],'Korrekt: Du zählst nur die Mitglieder aus Berlin.','Teilweise korrekt: Du zählst Zeilen; prüfe, ob WHERE ausschließlich Berlin auswählt.','Noch nicht korrekt: Prüfe die Spalte city und die Bedingung für Berlin.','users','aggregate'),
 makeTask(3,'extremes','**Gib** die Körpergröße des kleinsten Mitglieds aus.','SELECT MIN(centimeters)\nFROM users',['Gesucht ist ein Größenwert, keine Liste von Mitgliedern.','Die Größe steht in centimeters; welche Funktion sucht den kleinsten Wert?','Wende `MIN(centimeters)` auf users an.'],'Korrekt: Du gibst die kleinste eingetragene Körpergröße aus.','Teilweise korrekt: Du findest den kleinsten Wert; gib nur den Kennwert als Ergebnis aus.','Noch nicht korrekt: Verwende MIN für centimeters.','users','aggregate'),
 makeTask(4,'extremes','**Ermittle** das Geburtsdatum des jüngsten Mitglieds.','SELECT MAX(birthday)\nFROM users',['Jünger bedeutet später geboren.','Vergleiche die Datumswerte in birthday; suche den spätesten.','Nutze `MAX(birthday)` aus users.'],'Korrekt: Du gibst das späteste Geburtsdatum aus.','Teilweise korrekt: Du verwendest eine Extremwertfunktion; für das jüngste Mitglied brauchst du das späteste Datum.','Noch nicht korrekt: Prüfe birthday und den Zusammenhang zwischen jüngstem Alter und spätestem Datum.','users','aggregate'),
 makeTask(5,'average','**Berechne** die Summe der eingetragenen Körpergrößen der Mitglieder aus Dresden.','SELECT SUM(centimeters)\nFROM users\nWHERE city = \'Dresden\'',['Nur Mitglieder aus Dresden gehen in die Berechnung ein.','Filtere mit WHERE und addiere anschließend centimeters.','Verbinde `SUM(centimeters)` mit `WHERE city = \'Dresden\'`.'],'Korrekt: Du addierst die eingetragenen Größen der Dresdner Mitglieder.','Teilweise korrekt: Die Summe ist angelegt; prüfe den Filter auf Dresden.','Noch nicht korrekt: Verwende SUM für centimeters und berücksichtige den Wohnort.','users','aggregate'),
 makeTask(6,'average','**Ermittle** die durchschnittliche Körpergröße der Mitglieder aus Dresden.','SELECT AVG(centimeters)\nFROM users\nWHERE city = \'Dresden\'',['Gesucht ist ein Mittelwert der eingetragenen Größen.','Der Mittelwert gehört zu AVG; filtere vorher auf Dresden.','Kombiniere `AVG(centimeters)` mit `WHERE city = \'Dresden\'`.'],'Korrekt: Du berechnest den Durchschnitt der eingetragenen Dresdner Größen.','Teilweise korrekt: Der Durchschnitt wird berechnet; prüfe, ob nur Dresden eingeht.','Noch nicht korrekt: Verwende AVG für centimeters und filtere nach Dresden.','users','aggregate'),
 makeTask(7,'fast','**Ermittle** die Größe der größten Nutzerin.','SELECT MAX(centimeters)\nFROM users\nWHERE gender = \'female\'',['Gesucht ist ein Größenwert weiblicher Mitglieder.','Filtere gender auf den gespeicherten Wert für weiblich und suche das Maximum.','Nutze `MAX(centimeters)` und `WHERE gender = \'female\'`.'],'Korrekt: Du gibst die größte eingetragene Größe einer Nutzerin aus.','Teilweise korrekt: Du suchst ein Maximum; prüfe den Filter auf weibliche Mitglieder.','Noch nicht korrekt: Prüfe gender, centimeters und MAX.'),
 makeTask(8,'fast','**Zähle** die männlichen Mitglieder aus Leipzig.','SELECT COUNT(*)\nFROM users\nWHERE city = \'Leipzig\'\n  AND gender = \'male\'',['Zwei Bedingungen müssen für dieselbe Zeile gelten.','Verknüpfe Wohnort und Geschlecht mit AND.','Zähle Zeilen mit `city = \'Leipzig\' AND gender = \'male\'`.'],'Korrekt: Du zählst die männlichen Mitglieder aus Leipzig.','Teilweise korrekt: Eine Bedingung stimmt; prüfe, ob beide mit AND verknüpft sind.','Noch nicht korrekt: Verbinde die Bedingungen für city und gender und zähle die passenden Zeilen.'),
 makeTask(9,'fast','**Gib** den vollständigen Datensatz des zuletzt registrierten Mitglieds aus.','SELECT *\nFROM users\nORDER BY created_at DESC\nLIMIT 1',['Ein Zeitpunkt allein ist noch kein vollständiger Datensatz.','Sortiere created_at absteigend; der neueste Datensatz steht dann oben.','Gib alle Spalten mit `SELECT *` aus und ergänze `ORDER BY created_at DESC` und `LIMIT 1`.'],'Korrekt: Du zeigst den vollständigen zuletzt registrierten Datensatz.','Teilweise korrekt: Der neueste Zeitpunkt stimmt; gesucht sind alle Spalten des zugehörigen Mitglieds.','Noch nicht korrekt: Sortiere nach created_at absteigend und begrenze auf eine Zeile.','users','row'),
 makeTask(10,'fast','**Zähle** die Fotos, die der Nutzer mit der ID 10 hochgeladen hat.','SELECT COUNT(*)\nFROM photos\nWHERE user_id = 10',['Die Fotos stehen in einer eigenen Tabelle.','In photos kennzeichnet user_id den hochladenden Nutzer.','Zähle Zeilen aus photos mit `WHERE user_id = 10`.'],'Korrekt: Du zählst die Fotos des Nutzers mit der ID 10.','Teilweise korrekt: Du zählst Fotos; prüfe den Filter auf user_id 10.','Noch nicht korrekt: Lies aus photos und filtere mit user_id.','photos','aggregate')
];
const TASK_BY_ID = new Map(TASKS.map((task)=>[task.id,task]));
const TAB_TASKS = {count:['t1','t2'],extremes:['t3','t4'],average:['t5','t6'],fast:['t7','t8','t9','t10']};
const FINAL_QUIZ = [
 {id:'q1',prompt:'Welche Aussagen zur Ergebnisform stimmen?',example:'SELECT MIN(created_at)\nFROM users',hint:'Prüfe die Anzahl der Ergebniszeilen und ob users verändert wird.',options:[['a','Die Abfrage liefert eine Ergebniszeile mit einem Kennwert.',true],['b','Die gespeicherte Tabelle users bleibt unverändert.',true],['c','Die Abfrage zeigt alle Mitglieder in zeitlicher Reihenfolge.',false],['d','MIN gibt den vollständigen Datensatz des ersten Mitglieds aus.',false]]},
 {id:'q2',prompt:'Was bewirken WHERE und AS?',example:"SELECT COUNT(*) AS Anzahl\nFROM users\nWHERE city = 'Berlin'",hint:'Unterscheide Zeilenauswahl und Spaltenüberschrift.',options:[['a','WHERE wählt die Berliner Zeilen vor dem Zählen aus.',true],['b','AS benennt die Ergebnisspalte Anzahl.',true],['c','AS ändert die Anzahl der gezählten Zeilen.',false],['d','WHERE löscht die übrigen Mitglieder aus users.',false]]},
 {id:'q3',prompt:'Welche Aussagen zum Zählen stimmen?',hint:'COUNT(*) zählt Zeilen; COUNT(spalte) lässt NULL-Werte dieser Spalte aus.',options:[['a','COUNT(*) ergibt für diesen Ausschnitt 3.',true],['b','COUNT(centimeters) ergibt für diesen Ausschnitt 2.',true],['c','COUNT(centimeters) zählt auch NULL als Größenwert.',false],['d','COUNT(*) ergibt für diesen Ausschnitt 2.',false]]},
 {id:'q4',prompt:'Welche Funktion passt?',hint:'Prüfe, welche Funktion Werte addiert und welches Datum das jüngste Mitglied hat.',options:[['a','MAX(birthday) findet das späteste eingetragene Geburtsdatum.',true],['b','SUM(centimeters) addiert eingetragene Größenwerte.',true],['c','AVG(centimeters) zählt alle Zeilen, auch ohne Größenwert.',false],['d','MIN(birthday) findet das jüngste Mitglied.',false]]}
];
const INTRO_PHASES=['1 · Unsortierte Tabelle','2 · Sortierte Liste','3 · Vergleich','4 · Kennwert'];
const INTRO_EXPECTED=[['40','frageriese','2024-09-29 16:06:48'],['20','kochkuenstler_paul','2024-09-29 16:06:44'],['30','umweltlenni','2024-09-29 16:06:46'],['10','laufgaertner_theo','2024-09-29 16:06:42'],['1','zornigerfotograf','2024-09-29 16:06:41']];
let introRows=INTRO_EXPECTED.map(([id,username,created_at])=>({id,username,created_at}));
let whereExampleRows=[];
const state={tab:'intro',introStep:1,answers:{},feedback:{},solved:{},quiz:{},quizChecked:{},quizFeedback:null,quizPassed:false};const results = {};
const running = new Set();
const revisions = new Map();
const descriptionRequests = new Map();
let tabRevision = 0;
let database;
let databaseReady = false;
function save() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* Speicher optional. */ } }
function isPlainObject(value) { return Boolean(value) && typeof value==='object' && !Array.isArray(value); }
function validFeedback(value) { return isPlainObject(value) && FEEDBACK_LEVELS.includes(value.level) && typeof value.text==='string'; }
function restore() {
  let saved; try { saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null'); } catch { return; }
  if(!isPlainObject(saved))return;
  if(TABS.some(([id])=>id===saved.tab))state.tab=saved.tab;
  if(Number.isInteger(saved.introStep)&&saved.introStep>=1&&saved.introStep<=8)state.introStep=saved.introStep;
  if(isPlainObject(saved.answers))for(const [id,value] of Object.entries(saved.answers))if(TASK_BY_ID.has(id)&&typeof value==='string')state.answers[id]=value;
  if(isPlainObject(saved.feedback))for(const [id,value] of Object.entries(saved.feedback))if(TASK_BY_ID.has(id)&&validFeedback(value))state.feedback[id]=value;
  if(isPlainObject(saved.solved))for(const [id,value] of Object.entries(saved.solved))if(TASK_BY_ID.has(id)&&value===true)state.solved[id]=true;
  if(isPlainObject(saved.quiz))for(const q of FINAL_QUIZ)if(Array.isArray(saved.quiz[q.id]))state.quiz[q.id]=saved.quiz[q.id].filter((id)=>q.options.some(([option])=>option===id));
  if(isPlainObject(saved.quizChecked))for(const q of FINAL_QUIZ)if(saved.quizChecked[q.id]===true)state.quizChecked[q.id]=true;
  if(validFeedback(saved.quizFeedback))state.quizFeedback=saved.quizFeedback;
  state.quizPassed=saved.quizPassed===true;
}function isTabComplete(id) {
  if (id==='intro') return state.introStep===8;
  if (id==='quiz') return state.quizPassed;
  if (TAB_TASKS[id]) return TAB_TASKS[id].every((task)=>state.solved[task]);
  return TAB_TASKS[id]?.every((task)=>state.solved[task]) || false;
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

// Einfache Auszeichnung: **fett** und `code`; alles andere bleibt Text (kein innerHTML).
function richText(parent, text) {
  text.split(/(\*\*[^*]+\*\*|`[^`]+`)/).forEach((part) => {
    if (!part) return;
    if (part.startsWith('**')) parent.append(element('strong', '', part.slice(2, -2)));
    else if (part.startsWith('`')) parent.append(element('code', '', part.slice(1, -1)));
    else parent.append(document.createTextNode(part));
  });
  return parent;
}
function paragraph(text, className) { return richText(element('p', className), text); }
function sqlBlock(text) { const pre = element('pre', 'given-sql'); pre.append(element('code', '', text)); return pre; }


class SqlWorker {
  constructor() { this.nextId = 0; this.pending = new Map(); }
  async init() {
    this.worker = new Worker(new URL('../../../../include/lib/sql.js/worker.sql-wasm.js', import.meta.url));
    this.worker.onmessage = (event) => { const pending = this.pending.get(event.data.id); if (!pending) return; this.pending.delete(event.data.id); if (event.data.error) pending.reject(new Error(event.data.error)); else pending.resolve(event.data); };
    this.worker.onerror = (event) => { this.pending.forEach(({ reject }) => reject(event.error || new Error('SQL-Worker nicht verfügbar.'))); this.pending.clear(); };
    await this.send({ action: 'open' });
    const statements = [];
    this.csvRows = {};
    for (const table of ['users','photos']) {
      const response = await fetch(new URL(`../../klasse-10/1-Datenbanken/${table}.csv`, import.meta.url));
      if (!response.ok) throw new Error(`${table}.csv konnte nicht geladen werden.`);
      const [headers, ...data] = parseDelimited(await response.text());
      this.csvRows[table] = data.map((row)=>Object.fromEntries(headers.map((header,index)=>[header,row[index]])));
      const numeric = table==='users' ? ['id','centimeters','is_active'] : ['id','user_id'];
      const schema = headers.map((name) => `${quoteIdentifier(name)} ${numeric.includes(name) ? 'INTEGER' : 'TEXT'}`).join(', ');
      statements.push(`CREATE TABLE ${table} (${schema})`);
      data.forEach((row) => statements.push(`INSERT INTO ${table} (${headers.map(quoteIdentifier).join(', ')}) VALUES (${headers.map((header, index) => sqlValue(row[index], header)).join(', ')})`));
    }
    await this.send({ action: 'exec', sql: statements.join(';') });
  }
  send(message) {
    return new Promise((resolve, reject) => {
      const id = `sql-${++this.nextId}`;
      const timeout = window.setTimeout(() => { if (!this.pending.delete(id)) return; reject(new Error('Der SQL-Worker antwortet nicht rechtzeitig.')); }, 15000);
      this.pending.set(id, { resolve: (value) => { window.clearTimeout(timeout); resolve(value); }, reject: (error) => { window.clearTimeout(timeout); reject(error); } });
      try { this.worker.postMessage({ ...message, id }); } catch (error) { window.clearTimeout(timeout); this.pending.delete(id); reject(error); }
    });
  }
  async exec(sqlText) { return normalizeRelation((await this.send({ action: 'exec', sql: sqlText })).results); }
  close() { if (this.worker) { this.send({ action: 'close' }).catch(() => {}); this.worker.terminate(); } }
}
// nach quoteIdentifier und sqlValue in klasse-10/1-Datenbanken/sql-lab.js, angepasst: nur die Spalten der Tabelle users
function quoteIdentifier(name) { return `"${String(name).replaceAll('"', '""')}"`; }
function sqlValue(value, header) {
  if (value === 'NULL' || value === undefined || value === null) return 'NULL';
  if (['id', 'centimeters', 'is_active', 'user_id'].includes(header) && /^-?\d+(?:\.\d+)?$/.test(value)) return value;
  return `'${String(value).replaceAll("'", "''")}'`;
}

// Abfragen laufen nur lesend; Ergebnisse der Referenzabfragen werden zwischengespeichert.
const execCache = new Map();
async function cachedExec(sqlText) {
  if (!execCache.has(sqlText)) execCache.set(sqlText, await database.exec(sqlText));
  return execCache.get(sqlText);
}


function splitGroups(tokens) {
  const groups = [[]];
  tokens.forEach((token) => { if (token.value === ',') groups.push([]); else groups.at(-1).push(token); });
  return groups;
}
function tokenKeyword(token) { return token?.type === 'word' ? token.value.toUpperCase() : ''; }
function identifierValue(token) {
  if (token?.type === 'word') return token.value;
  if (token?.type === 'string' && !token.value.startsWith("'")) return stripQuotes(token.value);
  return null;
}
function stripQuotes(value) { return String(value).replace(/^["'`]/, '').replace(/["'`]$/, ''); }

function analyzeQuery(sql) {
  const tokens = sqlTokens(sql).filter((token) => token.value !== ';');
  const keywords = tokens.map(tokenKeyword);
  const selectIndex = keywords.indexOf('SELECT');
  const fromIndex = keywords.indexOf('FROM', selectIndex + 1);
  const orderIndex = keywords.indexOf('ORDER');
  const limitIndex = keywords.indexOf('LIMIT');
  const distinctIndex = keywords.indexOf('DISTINCT');
  const whereIndex = keywords.indexOf('WHERE');
  const hasFrom = fromIndex > -1;
  const afterSelect = selectIndex + 1 + (keywords[selectIndex + 1] === 'DISTINCT' ? 1 : 0);
  const projectionEnd = hasFrom ? fromIndex : [orderIndex, limitIndex].filter((index) => index > -1).reduce((min, index) => Math.min(min, index), tokens.length);
  const analysis = {
    hasFrom,
    distinct: distinctIndex > -1,
    distinctMisplaced: distinctIndex > -1 && distinctIndex !== selectIndex + 1,
    columns: [],
    implicitAliases: [],
    selectAliases: [],
    trailingComma: hasFrom && tokens[fromIndex - 1]?.value === ',',
    orderBy: [],
    orderWithoutBy: (orderIndex > -1 && keywords[orderIndex + 1] !== 'BY') || keywords.includes('SORT'),
    limit: null,
    limitBeforeOrder: limitIndex > -1 && orderIndex > -1 && limitIndex < orderIndex,
    tokens,
    orderIndex,
    selectIndex,
    fromIndex,
    whereIndex,
    source: sql,
    distinctToken: distinctIndex > -1 ? tokens[distinctIndex] : null
  };
  splitGroups(tokens.slice(afterSelect, projectionEnd)).forEach((group) => {
    if (!analysis.columns) return;
    const values = group.map(identifierValue);
    if (group.length === 1 && (values[0] || group[0].value === '*')) analysis.columns.push((values[0] || '*').toLowerCase());
    else if (group.length === 3 && values[0] && group[1].value === '.' && (values[2] || group[2].value === '*')) analysis.columns.push((values[2] || '*').toLowerCase());
    else if (group.length === 3 && values[0] && tokenKeyword(group[1]) === 'AS' && values[2]) {
      analysis.columns.push(values[0].toLowerCase());
      analysis.selectAliases.push({ column: values[0].toLowerCase(), alias: values[2].toLowerCase() });
    }
    else if (group.length === 2 && values[0] && values[1]) {
      analysis.columns.push(values[0].toLowerCase());
      analysis.implicitAliases.push({ column: values[0].toLowerCase(), alias: values[1].toLowerCase() });
      analysis.selectAliases.push({ column: values[0].toLowerCase(), alias: values[1].toLowerCase() });
    } else analysis.columns = null;
  });
  if (orderIndex > -1 && keywords[orderIndex + 1] === 'BY') {
    const orderEnd = limitIndex > orderIndex ? limitIndex : tokens.length;
    splitGroups(tokens.slice(orderIndex + 2, orderEnd)).forEach((group) => {
      let parts = group; let dir = 'ASC';
      const last = tokenKeyword(parts.at(-1));
      if (last === 'ASC' || last === 'DESC') { dir = last; parts = parts.slice(0, -1); }
      if (!parts.length) return;
      const quoted = parts.some((token) => token.type === 'string' && token.value.startsWith("'"));
      const rawColumn = stripQuotes(sql.slice(parts[0].start, parts.at(-1).end)).split('.').at(-1).trim().toLowerCase();
      const column = analysis.selectAliases.find(({ alias }) => alias === rawColumn)?.column || rawColumn;
      analysis.orderBy.push({ column, dir, quoted });
    });
  }
  if (limitIndex > -1 && tokens[limitIndex + 1]?.type === 'number') analysis.limit = Number(tokens[limitIndex + 1].value);
  return analysis;
}


const GERMAN_COLUMN_HINTS = {
  benutzername: 'username', nutzername: 'username', benutzer: 'username',
  geburtstag: 'birthday', geburtsdatum: 'birthday',
  stadt: 'city', wohnort: 'city', ort: 'city',
  land: 'country', laender: 'country', länder: 'country',
  groesse: 'centimeters', größe: 'centimeters', grosse: 'centimeters', koerpergroesse: 'centimeters',
  geschlecht: 'gender',
  nummer: 'id'
};

function unknownColumnClause(sql, analysis, name) {
  const tokens = analysis.tokens;
  const ranges = [];
  if (analysis.selectIndex > -1 && analysis.fromIndex > analysis.selectIndex) {
    ranges.push({ clause: 'SELECT', start: tokens[analysis.selectIndex].end, end: tokens[analysis.fromIndex].start });
  }
  if (analysis.whereIndex > -1) {
    const endIndex = tokens.findIndex((token, index) => index > analysis.whereIndex && ['GROUP', 'HAVING', 'ORDER', 'LIMIT'].includes(tokenKeyword(token)));
    ranges.push({ clause: 'WHERE', start: tokens[analysis.whereIndex].end, end: endIndex < 0 ? sql.length : tokens[endIndex].start });
  }
  if (analysis.orderIndex > -1 && tokenKeyword(tokens[analysis.orderIndex + 1]) === 'BY') {
    const endIndex = tokens.findIndex((token, index) => index > analysis.orderIndex + 1 && tokenKeyword(token) === 'LIMIT');
    ranges.push({ clause: 'ORDER BY', start: tokens[analysis.orderIndex + 1].end, end: endIndex < 0 ? sql.length : tokens[endIndex].start });
  }
  const needle = name.toLowerCase(); const identifiers = [];
  for (let start = 0; start < tokens.length; start += 1) {
    const first = tokens[start];
    if (first.type === 'string') {
      if (!first.value.startsWith("'") && stripQuotes(first.value).toLowerCase() === needle) identifiers.push({ start: first.start, end: first.end });
      continue;
    }
    for (let end = start; end < tokens.length; end += 1) {
      const current = tokens[end];
      if (current.type === 'string' || (end > start && tokens[end - 1].end !== current.start)) break;
      const raw = sql.slice(first.start, current.end);
      if (raw.toLowerCase() === needle) {
        const before = sql[first.start - 1] || '';
        const after = sql[current.end] || '';
        if (!/[\p{L}\p{N}_$]/u.test(before) && !/[\p{L}\p{N}_$]/u.test(after)) identifiers.push({ start: first.start, end: current.end });
        break;
      }
      if (raw.length > name.length + 2) break;
    }
  }
  for (const range of ranges) {
    if (identifiers.some(({ start, end }) => start >= range.start && end <= range.end)) return range.clause;
  }
  return null;
}

function diagnoseError(error, sql) {
  const analysis = analyzeQuery(sql);
  const message = String(error?.message || error || '');
  if (!analysis.hasFrom) return 'Noch nicht korrekt: Es fehlt FROM. Gib hinter FROM an, aus welcher Tabelle die Daten stammen.';
  if (analysis.limitBeforeOrder) return 'Noch nicht korrekt: LIMIT steht vor ORDER BY. LIMIT steht immer ganz am Ende der Abfrage – also hinter ORDER BY.';
  if (analysis.distinctMisplaced) return 'Noch nicht korrekt: DISTINCT steht direkt hinter SELECT, zum Beispiel SELECT DISTINCT gender.';
  if (analysis.orderWithoutBy) return 'Noch nicht korrekt: Zum Sortieren schreibst du ORDER BY – beide Wörter sind nötig.';
  if (analysis.trailingComma) return 'Noch nicht korrekt: Hinter der letzten Spalte vor FROM steht kein Komma.';
  if (/no such table/i.test(message)) return 'Noch nicht korrekt: Eine Tabelle mit diesem Namen gibt es nicht. Die Tabelle heißt users – prüfe den Namen hinter FROM.';
  const unknown = message.match(/no such column:\s*(\S+)/i);
  if (unknown) {
    const name = stripQuotes(unknown[1]).split('.').pop();
    const clause = unknownColumnClause(sql, analysis, name) || 'SELECT';
    const english = GERMAN_COLUMN_HINTS[name.toLowerCase()];
    const englishHint = english ? ` Die Spaltennamen sind englisch – gemeint ist vermutlich ${english}.` : '';
    if (clause === 'WHERE') {
      const quoteHint = missingTextQuote(sql, name);
      if (quoteHint) return `Noch nicht korrekt: ${name} ist ein Textwert und braucht einfache Anführungszeichen.${englishHint}`;
      return `Noch nicht korrekt: Die Spalte ${name} hinter WHERE gibt es in users nicht. Prüfe den englischen Spaltennamen im Schema.${englishHint}`;
    }
    return `Noch nicht korrekt: Die Spalte ${name} hinter ${clause} gibt es in users nicht. Prüfe den englischen Spaltennamen im Schema.${english ? ` Die Spaltennamen sind englisch – gemeint ist vermutlich ${english}.` : ''}`;
  }
  return 'Noch nicht korrekt: SQL konnte die Abfrage nicht ausführen. Prüfe die markierte Klausel und ihre Schreibweise.';
}


function valueKey(value) { return value === null ? '__NULL__' : `${typeof value}:${String(value)}`; }
function rowKey(row) { return row.map(valueKey).join('\u001f'); }
function columnIndex(relation, name) { return relation.columns.findIndex((column) => column.toLowerCase() === name.toLowerCase()); }
function sameSet(left, right) { const a = new Set(left); const b = new Set(right); return a.size === b.size && [...a].every((value) => b.has(value)); }
function sameMultiset(left, right) {
  if (!Array.isArray(left) || !Array.isArray(right) || left.length !== right.length) return false;
  const counts = new Map();
  left.forEach((value) => counts.set(value, (counts.get(value) || 0) + 1));
  for (const value of right) {
    const remaining = counts.get(value) || 0;
    if (!remaining) return false;
    counts.set(value, remaining - 1);
  }
  return [...counts.values()].every((count) => count === 0);
}


function relationSubset(actual, expected, actualNames, expectedNames) {
  if (!actualNames || !expectedNames || actualNames.length !== actual.columns.length || expectedNames.length !== expected.columns.length || !sameSet(actualNames, expectedNames)) return false;
  const key = (row, names) => JSON.stringify(names.map((name, index) => [name.toLowerCase(), valueKey(row[index])]).sort(([left], [right]) => left.localeCompare(right)));
  const counts = new Map();
  expected.values.forEach((row) => { const rowKey = key(row, expectedNames); counts.set(rowKey, (counts.get(rowKey) || 0) + 1); });
  return actual.values.every((row) => { const rowKey = key(row, actualNames); const remaining = counts.get(rowKey) || 0; if (!remaining) return false; counts.set(rowKey, remaining - 1); return true; });
}


function expectedColumns(task) { return task.projection==='*' ? USER_COLUMN_NAMES : task.projection.split(',').map((value)=>value.trim().toLowerCase()); }
function actualColumns(analysis, actual) {
  if (!analysis.columns) return actual.columns.map((value)=>value.toLowerCase());
  const names=analysis.columns.flatMap((value)=>value==='*' ? USER_COLUMN_NAMES : [value]);
  return names.length===actual.columns.length ? names : actual.columns.map((value)=>value.toLowerCase());
}
function whereTokens(analysis) {
  if (analysis.whereIndex<0) return [];
  const end=analysis.tokens.findIndex((token,index)=>index>analysis.whereIndex && ['ORDER','GROUP','HAVING','LIMIT'].includes(tokenKeyword(token)));
  return analysis.tokens.slice(analysis.whereIndex+1,end<0?undefined:end);
}
function featureIssue(task,analysis) {
  const tokens=whereTokens(analysis);
  const words=tokens.map(tokenKeyword);
  const column=task.whereColumn;
  const hasColumn=tokens.some((token)=>identifierValue(token)?.toLowerCase()===column);
  const hasComparison=tokens.some((token)=>['=','<','>','<=','>=','<>','!='].includes(token.value));
  const hasLike=words.includes('LIKE');
  if (!tokens.length || !hasColumn || (!hasComparison && !hasLike)) return {level:'hint',text:`Noch nicht korrekt: Die Aufgabe verlangt eine wirksame WHERE-Bedingung auf ${column}. Prüfe, welche Zeilen ausgewählt werden sollen.`};
  if (task.like && !hasLike) return {level:'hint',text:`Noch nicht korrekt: Die Aufgabe verlangt eine wirksame WHERE-Bedingung auf ${column}. Prüfe, welche Zeilen ausgewählt werden sollen.`};
  if (task.number===17) {
    const pattern=tokens.find((token)=>token.type==='string' && token.value.startsWith("'"));
    if (!pattern || !pattern.value.toLowerCase().endsWith("@instahub.test'")) return {level:'hint',text:'Noch nicht korrekt: Alle E-Mail-Adressen passen derzeit, aber verlangt ist eine wirksame LIKE-Bedingung für die Endung `@instahub.test`.'};
  }
  if (task.join && !words.includes(task.join)) return {level:'partial',text:task.texts.partial};
  if (task.number===21 && (!tokens.some((token)=>token.value==='(') || !tokens.some((token)=>token.value===')'))) return {level:'partial',text:'Teilweise korrekt: Die Berliner Bedingung muss für beide Vornamen gelten. Fasse die beiden Namensbedingungen mit Klammern zusammen.'};
  return null;
}
function withWhereProbes(task, sql) {
  // Die bestehende E-Mail-Gegenprobe auf alle Filteraufgaben erweitern.
  // Werte an der Vergleichsgrenze und Kombinationen erfüllter/nicht erfüllter
  // Teilbedingungen prüfen; users und die angezeigten Ergebnisse bleiben gleich.
  const columns = task.table === 'photos' ? ['id', 'user_id', 'description', 'url', 'created_at', 'updated_at'] : USER_COLUMN_NAMES;
  const choices = new Map();
  const tokens = whereTokens(analyzeQuery(task.sql));
  tokens.forEach((token, index) => {
    const column = identifierValue(token)?.toLowerCase();
    const operator = tokens[index + 1]?.value.toUpperCase();
    const literal = tokens[index + 2];
    if (!columns.includes(column) || !['=', '<', '>', '<=', '>=', '!=', '<>', 'LIKE'].includes(operator) || !literal) return;
    let values;
    if (literal.type === 'number') {
      const value = Number(literal.value);
      values = column === 'is_active' ? [0, 1, null] : [value - 1, value, value + 1, null];
    } else if (literal.type === 'string' && literal.value.startsWith("'")) {
      const value = literal.value.slice(1, -1).replaceAll("''", "'");
      if (column === 'birthday') {
        // Nur gültige ISO-Daten: Monatssuche nicht durch künstliche,
        // ungültige Datumszeichenfolgen fälschlich als falsch bewerten.
        values = ['2003-01-03', '2007-03-01', '2007-03-31', '2007-04-03', null];
        if (operator !== 'LIKE') {
          const date = new Date(value + 'T00:00:00Z');
          values.push(value, ...[-1, 1].map(days => new Date(date.getTime() + days * 86400000).toISOString().slice(0, 10)));
        }
      } else {
        const stem = operator === 'LIKE' ? value.replaceAll('%', '').replaceAll('_', 'x') : value;
        values = [stem, `x${stem}`, `${stem}x`, `x${stem}x`, '__anderer_wert__', '', null];
      }
    } else return;
    choices.set(column, [...new Set([...(choices.get(column) || []), ...values])]);
  });
  let rows = [{}];
  choices.forEach((values, column) => { rows = rows.flatMap(row => values.map(value => ({ ...row, [column]: value }))); });
  rows = rows.flatMap((row) => [row, row]);
  const tuples = rows.map((row, index) => '(' + columns.map(column => {
    const fallback = column === 'id' ? 900000 + index : column === 'centimeters' ? 170 + index : column === 'is_active' ? 1 : `__${column}_${index}__`;
    return sqlValue(Object.hasOwn(row, column) ? row[column] : fallback, column);
  }).join(', ') + ')');
  // main.users bezeichnet dieselbe Tabelle und muss auch an der Gegenprobe
  // teilnehmen; SQL-Bezeichner bearbeiten, keine Texte oder Kommentare ersetzen.
  const inputTokens = sqlTokens(sql);
  for (let index = inputTokens.length - 3; index >= 0; index -= 1) {
    if (identifierValue(inputTokens[index])?.toLowerCase() === 'main' && inputTokens[index + 1].value === '.' && identifierValue(inputTokens[index + 2])?.toLowerCase() === task.table) {
      sql = sql.slice(0, inputTokens[index].start) + sql.slice(inputTokens[index + 2].start);
    }
  }
  return `WITH ${task.table} (${columns.map(quoteIdentifier).join(', ')}) AS (VALUES ${tuples.join(', ')})\n${sql}`;
}
function selectedRowsSql(analysis) {
  const { tokens, source, fromIndex } = analysis;
  const end = tokens.find((token, index) => index > fromIndex && ['ORDER', 'GROUP', 'HAVING', 'LIMIT'].includes(tokenKeyword(token)));
  return `SELECT id ${source.slice(tokens[fromIndex].start, end?.start ?? source.length).replace(/;\s*$/, '')}`;
}
async function selectedRowsMatch(task, analysis) {
  const student = selectedRowsSql(analysis);
  const reference = selectedRowsSql(analyzeQuery(task.sql));
  for (const probe of [false, true]) {
    const left = await cachedExec(probe ? withWhereProbes(task, student) : student);
    const right = await cachedExec(probe ? withWhereProbes(task, reference) : reference);
    if (!sameMultiset(left.values.map((row) => valueKey(row[0])), right.values.map((row) => valueKey(row[0])))) return false;
  }
  return true;
}
async function evaluate(task,analysis,actual) {
  const tokens=analysis.tokens, words=tokens.map(tokenKeyword), from=words.indexOf('FROM'), select=words.indexOf('SELECT');
  const table=tokens[from+1]?.value?.toLowerCase();
  if (table!==task.table) return {level:'hint',text:task.number===10?'Die Fotos stehen in photos; user_id verbindet jedes Foto mit dem hochladenden Nutzer.':task.texts.wrong};
  if(task.projection==='row'){
    const good=analysis.columns?.length===1&&analysis.columns[0]==='*'&&analysis.orderBy.length===1&&analysis.orderBy[0].column==='created_at'&&analysis.orderBy[0].dir==='DESC'&&analysis.limit===1&&actual.columns.length===18&&actual.values.length===1&&String(actual.values[0][0])==='321';
    if(good)return {level:'success',text:task.texts.ok,solved:true};
    if(words.includes('MAX')&&tokens.some((t)=>t.value.toLowerCase()==='created_at'))return {level:'partial',text:'MAX liefert nur den Zeitpunkt. Gefragt sind alle Daten des zuletzt registrierten Mitglieds.'};
    return {level:'hint',text:task.texts.wrong};
  }
  const end=from<0?tokens.length:from;
  const projection=tokens.slice(select+1,end); const functionToken=projection.find((t,i)=>t.type==='word'&&['COUNT','MIN','MAX','SUM','AVG'].includes(t.value.toUpperCase())&&projection[i+1]?.value==='(');
  const expected={1:'COUNT',2:'COUNT',3:'MIN',4:'MAX',5:'SUM',6:'AVG',7:'MAX',8:'COUNT',10:'COUNT'}[task.number];
  if(!functionToken){if(/SELECT\s*\d+/i.test(analysis.source))return {level:'hint',text:'Deine Zahl passt zu diesen Übungsdaten, wird aber nicht aus den Zeilen berechnet. Verwende die passende Aggregatfunktion.'};return {level:'hint',text:'Die Aufgabe sucht einen Kennwert in einer Ergebniszelle. Prüfe die Aggregatfunktion hinter SELECT.'};}
  if(functionToken.value.toUpperCase()!==expected){if(task.number===4&&functionToken.value.toUpperCase()==='MIN')return {level:'hint',text:'MIN findet das früheste Geburtsdatum. Das jüngste Mitglied hat das späteste Geburtsdatum.'};return {level:'hint',text:task.texts.wrong};}
  if(expected==='COUNT'){const at=projection.indexOf(functionToken);const arg=projection[at+2];if(arg?.value!=='*'&&!(arg?.type==='number'&&arg.value==='1'))return {level:'hint',text:task.texts.wrong};}
  const column=projection[projection.indexOf(functionToken)+2]?.value?.toLowerCase();
  if(task.number===1&&column!==undefined&&column!=='*'&&column!=='1')return {level:'hint',text:task.texts.wrong};
  if(task.number===3&&column!=='centimeters'||task.number===4&&column!=='birthday'||[5,6,7].includes(task.number)&&column!=='centimeters'||task.number===10&&column!=='*')return {level:'hint',text:task.texts.wrong};
   const hasRequiredFilter=[2,5,6,7,8,10].includes(task.number);
   if(hasRequiredFilter && analysis.whereIndex<0)return {level:'partial',text:task.number===2?'Prüfe WHERE: Welche Zeilen sollen vor der Berechnung ausgewählt werden?':task.texts.partial};
  if(task.number===1&&!projection.some((t,i)=>tokenKeyword(t)==='AS'&&projection[i+1]?.value?.toLowerCase()==='anzahl'))return {level:'partial',text:'Die Anzahl stimmt. Benenne die Ergebnisspalte mit AS Anzahl.'};
  if(actual.values.length!==1||actual.columns.length!==1)return {level:'partial',text:'Die Aufgabe sucht einen Kennwert in einer Ergebniszelle. Prüfe die Aggregatfunktion hinter SELECT.'};
  const expectedRelation=await cachedExec(task.sql);
  const aliasOk=task.number!==1||actual.columns[0].toLowerCase()==='anzahl';
   if(aliasOk&&compareRelations(actual,expectedRelation,{numericTolerance:0.000001,columnOrder:true,columnLabels:task.number===1,rowOrder:true}).correct){
     try {
       if(!(await selectedRowsMatch(task,analysis)))return {level:'partial',text:task.number===2?'Prüfe WHERE: Welche Zeilen sollen vor der Berechnung ausgewählt werden?':task.texts.partial};
       const probeActual=await cachedExec(withWhereProbes(task,analysis.source));
       const probeExpected=await cachedExec(withWhereProbes(task,task.sql));
       if(!compareRelations(probeActual,probeExpected,{numericTolerance:0.000001,columnOrder:true,columnLabels:false,rowOrder:true}).correct)return {level:'hint',text:'Deine Zahl passt zu diesen Übungsdaten, wird aber nicht aus den Zeilen berechnet. Verwende die passende Aggregatfunktion.'};
     } catch { return {level:'hint',text:task.texts.wrong}; }
    return {level:'success',text:task.texts.ok,solved:true};
  }
  if(actual.values[0][0]!==null&&Number.isFinite(Number(actual.values[0][0]))&&Number(actual.values[0][0])===Number(expectedRelation.values[0][0]))return {level:'partial',text:'Deine Zahl passt zu diesen Übungsdaten, wird aber nicht aus den Zeilen berechnet. Verwende die passende Aggregatfunktion.'};
  return {level:'hint',text:task.texts.wrong};
}

function taskCard(taskConfig) { return document.getElementById(`task-${taskConfig.id}`); }

function applyFeedback(taskConfig, level, text, { solved = false, relation = null, persist = true } = {}) {
  state.feedback[taskConfig.id] = { level, text };
  if (solved) state.solved[taskConfig.id] = true; else delete state.solved[taskConfig.id];
  if (relation) results[taskConfig.id] = relation; else delete results[taskConfig.id];
  if (persist) save();
  renderTaskOutput(taskConfig);
  updateTabMarks();
}

// nach renderTaskFeedback in klasse-10/1-Datenbanken/sql-lab.js, angepasst: Rückmeldung bleibt als aria-live-Bereich bestehen, Relation liegt in einem eigenen Platzhalter
function renderTaskOutput(taskConfig) {
  const card = taskCard(taskConfig);
  if (!card) return;
  const feedback = state.feedback[taskConfig.id];
  const box = card.querySelector('.sql-feedback');
  box.className = `feedback ${feedback ? feedback.level : ''} sql-feedback`;
  box.textContent = feedback ? feedback.text : '';
  const slot = card.querySelector('.sql9-relation-slot');
  slot.replaceChildren();
  if (results[taskConfig.id]) slot.append(renderRelation(results[taskConfig.id]));
  const run = card.querySelector('.sql9-run');
  if (run) run.disabled = !databaseReady || running.has(taskConfig.id);
}

async function runTask(taskConfig, { auto = false } = {}) {
  if (running.has(taskConfig.id)) return;
  const sqlText = state.answers[taskConfig.id] || '';
  if (!sqlText.trim()) { applyFeedback(taskConfig,'hint','Noch nicht korrekt: Schreibe zuerst eine SELECT-Abfrage in das Eingabefeld.'); return; }
  const check = validateSelectStatement(sqlText);
  if (!check.ok) { applyFeedback(taskConfig, 'hint', 'Noch nicht korrekt: Hier ist genau eine lesende SELECT-Abfrage erlaubt.'); return; }
  if (!databaseReady) { applyFeedback(taskConfig, 'hint', 'Warte bitte, bis die Tabelle users vollständig geladen ist.', { persist: false }); return; }
  running.add(taskConfig.id);
  const revision = revisions.get(taskConfig.id) || 0;
  const activeTabRevision = tabRevision;
  if (auto) renderTaskOutput(taskConfig);
  else { const box=taskCard(taskConfig)?.querySelector('.sql-feedback'); if(box){box.className='feedback hint sql-feedback';box.textContent='Die Abfrage wird ausgeführt …';} }
  try {
    const actual = await database.exec(check.sql);
    const verdict = await evaluate(taskConfig, analyzeQuery(check.sql), actual);
    if ((state.answers[taskConfig.id] || '') === sqlText && revisions.get(taskConfig.id) === revision && tabRevision === activeTabRevision) applyFeedback(taskConfig, verdict.level, verdict.text, { solved: verdict.solved === true, relation: actual });
  } catch (error) {
    if ((state.answers[taskConfig.id] || '') === sqlText && revisions.get(taskConfig.id) === revision && tabRevision === activeTabRevision) applyFeedback(taskConfig, 'error', diagnoseError(error, check.sql));
  } finally {
    running.delete(taskConfig.id);
    renderTaskOutput(taskConfig);
  }
}

// nach renderRelation in klasse-10/1-Datenbanken/sql-lab.js, angepasst: alle Zeilen statt höchstens 100, kein aria-live am Container
function renderRelation(relation) {
  const shell = element('section', 'table-shell result-relation');
  shell.setAttribute('aria-label', 'Ergebnisrelation deiner SQL-Abfrage');
  const caption = element('div', 'table-caption');
  caption.append(element('strong', '', 'Ergebnisrelation'), element('span', '', `${relation.values.length} Zeile(n)`));
  shell.append(caption);
  if (!relation.values.length) { shell.append(element('p', 'empty-result', 'Die Abfrage ist gültig, liefert aber keine Zeilen.')); return shell; }
  const scroll = element('div', 'table-scroll'); scroll.tabIndex = 0; scroll.setAttribute('aria-label', 'Ergebnisrelation horizontal und vertikal scrollen');
  const table = element('table', `data-table${relation.columns.length <= 3 ? ' compact' : ''}`);
  table.append(element('caption', 'visually-hidden', 'Ergebnis deiner SQL-Abfrage'));
  const head = document.createElement('thead'); const headRow = document.createElement('tr');
  relation.columns.forEach((column) => { const th = element('th', '', column); th.scope = 'col'; headRow.append(th); });
  head.append(headRow);
  const body = document.createElement('tbody');
  relation.values.forEach((values) => { const tr = document.createElement('tr'); values.forEach((value) => tr.append(element('td', '', value === null ? 'NULL' : String(value)))); body.append(tr); });
  table.append(head, body); scroll.append(table); shell.append(scroll);
  return shell;
}

// nach appendHints in klasse-10/1-Datenbanken/sql-lab.js, angepasst: eine Hilfe kann Text, einen SQL-Block und einen Schlusstext enthalten
function appendHints(card, hints) {
  const box = element('div', 'help-stack');
  hints.forEach((hint, index) => {
    const details = element('details'); details.append(element('summary', '', `Hilfe ${index + 1}`));
    const parts = typeof hint === 'string' ? { before: hint } : hint;
    if (parts.before) details.append(element('p', '', parts.before));
    if (parts.sql) details.append(sqlBlock(parts.sql));
    if (parts.after) details.append(element('p', '', parts.after));
    box.append(details);
  });
  card.append(box);
}

function renderDescriptionFeedback(task, box) {
  box.replaceChildren();
  const feedback = state.descriptionFeedback[task.id];
  if (!feedback) return;
  const level = Number.isInteger(feedback.points) ? feedback.points === 3 ? 'success' : feedback.points > 0 ? 'partial' : 'error' : feedback.level;
  box.className = `result server-feedback ${level}`;
  if (Number.isInteger(feedback.points)) {
    renderCompactEvaluation(box, { ...feedback, maxPoints: 3, feedback: feedback.text }, { maxHints: 1 });
  } else box.append(element('p', '', feedback.text));
}

function renderDescriptionTask(task) {
  const card = element('section', 'task-card sql-task description-task');
  card.id = `task-${task.id}`;
  card.append(element('h3', '', task.title), element('p', 'description-task-tab', task.tabLabel), paragraph(task.prompt), sqlBlock(task.sql));
  const label = element('label', 'sql-label', 'Deine Erklärung');
  label.htmlFor = `input-${task.id}`;
  const input = document.createElement('textarea');
  input.id = label.htmlFor; input.className = 'description-input'; input.maxLength = 1200; input.value = state.descriptionAnswers[task.id] || '';
  input.addEventListener('input', () => {
    state.descriptionAnswers[task.id] = input.value;
    descriptionRequests.set(task.id, (descriptionRequests.get(task.id) || 0) + 1);
    delete state.descriptionFeedback[task.id]; save(); renderDescriptionFeedback(task, output); updateTabMarks();
  });
  card.append(label, input);
  appendHints(card, task.hints);
  const actions = element('div', 'action-row');
  const button = element('button', 'primary-button', 'Erklärung prüfen'); button.type = 'button';
  button.addEventListener('click', () => submitDescription(task, input, button, output));
  actions.append(button); card.append(actions);
  const output = element('section', 'result server-feedback'); output.setAttribute('aria-live', 'polite');
  card.append(output); renderDescriptionFeedback(task, output);
  return card;
}

async function submitDescription(task, input, button, output) {
  if (button.disabled) return;
  const submittedText = input.value;
  if (submittedText.trim().length < 10) {
    state.descriptionFeedback[task.id] = { level: 'error', text: 'Bitte formuliere eine etwas ausführlichere Antwort.' };
    save(); renderDescriptionFeedback(task, output); input.focus(); return;
  }
  if (!isValidScriptServerUrl(SCRIPT_SERVER_URL)) {
    state.descriptionFeedback[task.id] = { level: 'error', text: 'Die Auswertung konnte nicht abgeschlossen werden. Bitte versuche es erneut.' };
    save(); renderDescriptionFeedback(task, output); return;
  }
  const requestId = (descriptionRequests.get(task.id) || 0) + 1;
  descriptionRequests.set(task.id, requestId);
  const submittedTabRevision = tabRevision;
  input.disabled = true; button.disabled = true; button.textContent = 'Erklärung wird geprüft …';
  output.replaceChildren(element('p', '', 'Deine Erklärung wird ausgewertet.'));
  output.className = 'result server-feedback';
  const stillCurrent = () => descriptionRequests.get(task.id) === requestId && tabRevision === submittedTabRevision && state.tab === task.tab && input.value === submittedText;
  try {
    const result = await evaluateSemanticAnswer({ serverUrl: SCRIPT_SERVER_URL, taskId: task.serverTaskId, answer: submittedText, expectedMaxPoints: 3 });
    if (!stillCurrent()) return;
    const classified = classifyDescriptionResult(result);
    if (classified.level !== 'error' && !String(result.feedback || '').trim()) {
      const key = classified.status === 'korrekt' ? 'korrekt' : classified.status === 'teilweise korrekt' ? 'partial' : 'incorrect';
      classified.text = task.fallbacks[key];
    }
    state.descriptionFeedback[task.id] = classified;
  } catch (error) {
    if (!stillCurrent()) return;
    state.descriptionFeedback[task.id] = { level: 'error', text: 'Die Auswertung konnte nicht abgeschlossen werden. Bitte versuche es erneut.' };
  } finally {
    if (stillCurrent()) {
      input.disabled = false; button.disabled = false; button.textContent = 'Erklärung prüfen';
      save(); renderDescriptionFeedback(task, output); updateTabMarks();
    } else if (input.isConnected && tabRevision === submittedTabRevision && state.tab === task.tab) {
      input.disabled = false; button.disabled = false; button.textContent = 'Erklärung prüfen';
    }
  }
}

function renderTask(taskConfig) {
  const card = element('section', 'task-card sql-task'); card.id = `task-${taskConfig.id}`;
  card.append(element('h3', '', `Aufgabe ${TASKS.indexOf(taskConfig) + 1}`), paragraph(taskConfig.prompt));
  // nach renderSqlTask in klasse-10/1-Datenbanken/sql-lab.js, angepasst: eigene Prüflogik, Hilfen über appendHints
  const label = element('label', 'sql-label', 'Deine vollständige SQL-Anweisung'); label.htmlFor = `input-${taskConfig.id}`;
  const input = document.createElement('textarea'); input.id = label.htmlFor; input.className = 'sql-input'; input.spellcheck = false; input.placeholder = NEUTRAL_SQL_PLACEHOLDER;
  const hasSavedAnswer = Object.prototype.hasOwnProperty.call(state.answers, taskConfig.id);
  input.value = hasSavedAnswer ? state.answers[taskConfig.id] : '';

  const resetOutput = () => {
    const wasSolved = Boolean(state.solved[taskConfig.id]);
    revisions.set(taskConfig.id, (revisions.get(taskConfig.id)||0)+1);
    delete state.feedback[taskConfig.id]; delete state.solved[taskConfig.id]; delete results[taskConfig.id];
    save(); renderTaskOutput(taskConfig);
    if (wasSolved) updateTabMarks();
  };
  input.addEventListener('input', () => { state.answers[taskConfig.id] = input.value; resetOutput(); });
  input.addEventListener('keydown', (event) => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); runTask(taskConfig); } });

  card.append(label, input);
  appendHints(card, taskConfig.hints);
  const actions = element('div', 'action-row');
  const run = element('button', 'primary-button sql9-run', 'Abfrage prüfen'); run.type = 'button'; run.disabled = !databaseReady;
  run.addEventListener('click', () => runTask(taskConfig));
  actions.append(run);
  actions.append(element('span', 'shortcut-hint', 'Strg/Cmd + Enter'));
  card.append(actions);
  const output = element('div', 'sql9-task-output');
  const feedback = element('p', 'feedback sql-feedback'); feedback.setAttribute('aria-live', 'polite');
  output.append(feedback, element('div', 'sql9-relation-slot'));
  card.append(output);

  return card;
}


function updateTabMarks() { TABS.forEach(([id]) => document.getElementById(`tab-${id}`)?.classList.toggle('is-complete', isTabComplete(id))); }
function tabIndex(id) { return TABS.findIndex(([tabId]) => tabId === id); }
function activateTab(id, { focusContent = false } = {}) { tabRevision += 1; state.tab = id; save(); render({ focusContent }); }

function renderTabs() {
  const tabs = document.getElementById('sql-tabs'); tabs.replaceChildren();
  TABS.forEach(([id, label], index) => {
    const button = element('button', `step-tab${isTabComplete(id) ? ' is-complete' : ''}`);
    button.type = 'button'; button.id = `tab-${id}`; button.dataset.tab = id; button.setAttribute('role', 'tab'); button.setAttribute('aria-controls', 'sql-panel');
    button.setAttribute('aria-selected', String(state.tab === id));
    button.append(element('span', '', String(index + 1)), element('small', '', label));
    button.addEventListener('click', () => activateTab(id));
    tabs.append(button);
  });
  enableTabKeyboardNavigation(tabs);
  syncTabSemantics(tabs, state.tab);
}

// nach schemaCard in klasse-10/1-Datenbanken/sql-lab.js
function schemaCard(schemas) {
  const card = element('aside', 'scenario-card accent sql-schema-card'); card.setAttribute('aria-label', 'Tabellenschema der SQL-Übungsdaten');
  const scroll = element('div', 'schema-scroll'); scroll.tabIndex = 0; scroll.setAttribute('aria-label', 'Tabellenschemata horizontal scrollen');
  // Überschrift und Innenabstände gehören zur Wischfläche des gesamten Kastens.
  scroll.append(element('strong', 'schema-title', schemas.length === 1 ? 'Tabellenschema' : 'Tabellenschemata'));
  schemas.forEach(({ table, columns }) => scroll.append(element('code', 'schema-code', `${table} (${columns.map(([name, type]) => `${name}: ${type}`).join(', ')})`)));
  card.append(scroll);
  return card;
}

function stepHeading(id) {
  const [, , kicker, title] = TABS[tabIndex(id)];
  const heading = element('div', 'step-heading'); heading.append(element('span', 'step-number', String(tabIndex(id) + 1)));
  const copy = element('div'); copy.append(element('p', 'step-kicker', kicker), element('h2', '', title)); heading.append(copy);
  return heading;
}

function render({ focusContent = false } = {}) {
  document.body.classList.toggle('sql-intro-active', state.tab === 'intro');
  renderTabs();
  const panel = document.getElementById('sql-panel'); panel.replaceChildren();
  panel.setAttribute('aria-labelledby', `tab-${state.tab}`);
  if (state.tab !== 'intro' && state.tab !== 'quiz') panel.append(schemaCard(state.tab==='fast' ? [...USERS_TABLE_SCHEMAS,{table:'photos',columns:[['id','int'],['user_id','int'],['description','varchar(255)'],['url','varchar(255)'],['created_at','date'],['updated_at','date']]}] : USERS_TABLE_SCHEMAS));
  panel.append(stepHeading(state.tab));
  if (state.tab === 'intro') renderIntro(panel);
  else if (state.tab === 'quiz') renderQuiz(panel);
  else renderTaskTab(panel);
  renderTabFlowNavigation(panel, { items: TABS.map(([id, label]) => ({ id, label })), currentId: state.tab, onNavigate: activateTab });
  if (focusContent) focusTabPanelStart(panel);
}


function exampleTable(caption, columns, rows, className = '') {
  const table = element('table', `data-table sql9-mini-table${className ? ` ${className}` : ''}`);
  table.append(element('caption', '', caption));
  const head = document.createElement('thead'); const headRow = document.createElement('tr');
  columns.forEach((column) => { const th = element('th', '', column); th.scope = 'col'; headRow.append(th); });
  head.append(headRow);
  const body = document.createElement('tbody');
  rows.forEach((values) => { const tr = document.createElement('tr'); values.forEach((value) => tr.append(element('td', '', value))); body.append(tr); });
  table.append(head, body);
  return table;
}

function explainCard(title) { const card = element('section', 'scenario-card aggregate-intro'); card.append(element('h3', '', title)); return card; }


function explainContent(tab) {
 const card=explainCard(({count:'Beispiel vor der Aufgabe',extremes:'Beispiel vor der Aufgabe',average:'Beispiel vor der Aufgabe',fast:'Freiwillige Aufgaben'})[tab]||'');
  if(tab==='count'){
    card.append(exampleTable('Ausschnitt aus users',['id','centimeters'],[['1','168'],['2','183'],['321','NULL']]),paragraph('COUNT(*) = 3 · COUNT(centimeters) = 2','sql9-example-count'),paragraph('COUNT(*) zählt alle ausgewählten Zeilen. COUNT(centimeters) zählt nur die ausgewählten Zeilen mit einem eingetragenen Größenwert; NULL wird dabei nicht mitgezählt.'),sqlBlock('SELECT COUNT(*) AS Anzahl\nFROM users'),paragraph('AS benennt nur die Überschrift der Ergebnisspalte um; die Berechnung bleibt gleich.'));
    if(whereExampleRows.length)card.append(exampleTable('Vor WHERE',['username','city'],whereExampleRows.map(({username,city})=>[username,city])),exampleTable('Nach WHERE',['username','city'],whereExampleRows.filter(({city})=>city==='Berlin').map(({username,city})=>[username,city])));
    card.append(paragraph("WHERE lässt zuerst nur Zeilen mit city = 'Berlin' übrig. COUNT(*) zählt danach diese Zeilen."));
  }
 if(tab==='extremes')card.append(exampleTable('Zahlenwerte in centimeters',['Wert'],[['168'],['183'],['174']]),paragraph('MIN = 168; MAX = 183.'),paragraph('MIN gibt den kleinsten, MAX den größten ausgewählten Wert zurück.'),exampleTable('Geburtsdaten',['birthday'],[['2007-10-02'],['2010-07-07']]),paragraph('Ein späteres Geburtsdatum bedeutet ein jüngeres Mitglied. Für das jüngste Mitglied suchst du deshalb das größte Geburtsdatum mit MAX.'));
 if(tab==='average')card.append(exampleTable('Eingetragene Dresdner Größen',['centimeters'],[['176'],['175'],['179'],['176'],['160'],['175']]),paragraph('Die sechs eingetragenen Größen aus Dresden ergeben zusammen 1041 cm. Der Durchschnitt ist 1041 geteilt durch 6, also 173,5 cm.'),paragraph('SUM addiert numerische Werte. AVG berechnet ihren arithmetischen Mittelwert; fehlende Größenwerte zählen dabei nicht mit.'));
 if(tab==='fast')card.append(paragraph('MAX(created_at) liefert nur den neuesten Zeitpunkt. Für den vollständigen Datensatz sortierst du absteigend und begrenzt die Ausgabe auf eine Zeile.'),paragraph('Die Spalte user_id in photos bezeichnet den Nutzer, der das Foto hochgeladen hat.'),schemaCard([{table:'photos',columns:[['id','int'],['user_id','int'],['description','varchar(255)'],['url','varchar(255)'],['created_at','date'],['updated_at','date']]}]));
 return card;
}
function renderTaskTab(panel) {
 if(state.tab==='fast')panel.append(paragraph('Freiwillige Aufgaben 7–10.','sql9-quiet-note'));
 if(state.tab==='count'||state.tab==='extremes'||state.tab==='average'||state.tab==='fast')panel.append(explainContent(state.tab));
 (TAB_TASKS[state.tab]||[]).forEach((id)=>{const task=TASK_BY_ID.get(id);panel.append(renderTask(task));renderTaskOutput(task);});
}function introTable(rows,columns,caption,currentIndex=-1,selectedIndex=-1,highlightColumn=false) {
  const wrap=element('div','sql9-intro-table');
  const scroll=element('div','table-scroll'); scroll.tabIndex=0; scroll.setAttribute('aria-label',caption);
  const table=element('table','data-table sql9-snippet-table'); table.append(element('caption','',caption));
  const head=document.createElement('thead'),hr=document.createElement('tr'); columns.forEach((column)=>{const th=element('th',highlightColumn&&column==='created_at'?'is-selected':'',column);th.scope='col';hr.append(th);});head.append(hr);
  const body=document.createElement('tbody');
  rows.forEach((row,index)=>{const tr=document.createElement('tr');tr.dataset.rowId=row.id;if(index===currentIndex)tr.classList.add('is-checking');if(index===selectedIndex)tr.classList.add('is-selected');columns.forEach((column)=>tr.append(element('td',column==='created_at' ? [highlightColumn?'is-value-column':'',index===selectedIndex?'is-selected':'',index===currentIndex?'is-checking':''].filter(Boolean).join(' ') : '',row[column])));body.append(tr);});
  table.append(head,body);scroll.append(table);wrap.append(scroll);return wrap;
}
function renderIntro(panel) {
 const card=element('section','task-card sql9-intro');card.append(paragraph('**Gehe** die Animation Schritt für Schritt durch. **Vergleiche**, was die sortierte Liste zeigt und welchen Wert die Aggregatfunktion ausgibt.'),element('p','','Wann wurde das erste Konto bei InstaHub registriert?'));
 const heading=element('div','sql9-intro-heading'),progress=element('div','sql9-intro-progress');progress.setAttribute('aria-label','Ablauf der Erklärung');const phases=INTRO_PHASES.map((text)=>{const span=element('span','',text);progress.append(span);return span;});
 const controls=element('div','intro-stepper');const prev=element('button','secondary-button','Zurück');prev.type='button';const count=element('span');count.setAttribute('aria-live','polite');const next=element('button','primary-button','Weiter');next.type='button';controls.append(prev,count,next);heading.append(progress,controls);
 const workspace=element('div','sql9-intro-workspace'),visual=element('div','sql9-intro-visual'),result=element('div','sql9-result-card');const explanation=element('p','intro-explanation');explanation.setAttribute('aria-live','polite');const source=element('div','sql9-intro-stage'),out=element('div','sql9-result-body');visual.append(explanation,source);result.append(element('h3','','Auswertung dieses Ausschnitts'),out);workspace.append(visual,result);card.append(heading,workspace);panel.append(card);
  const update=()=>{const step=state.introStep,phase=step===1?1:step===2?2:step<8?3:4;phases.forEach((item,index)=>{item.className=index+1===phase?'is-active':index+1<phase?'is-complete':'';});count.textContent=`Schritt ${step} von 8`;prev.disabled=step===1;next.disabled=step===8;next.textContent=step===8?'Abgeschlossen':'Weiter';explanation.textContent=step===1?'Suche im Ausschnitt selbst den frühesten Registrierungszeitpunkt.':step===2?'ORDER BY ordnet die sichtbaren Zeilen; der früheste Zeitpunkt steht oben, die anderen bleiben sichtbar.':step<8?'MIN vergleicht die Zeitstempel. Markiert bleibt jeweils der bisher früheste Wert.':'Eine Aggregatfunktion fasst die Werte der ausgewählten Zeilen zu einem Ergebniswert zusammen. MIN liefert hier den frühesten Zeitpunkt. Die Ausgangstabelle bleibt unverändert; nur die Ergebnisrelation zeigt den Kennwert.';
  const rows=step===2? [...introRows].sort((a,b)=>a.created_at.localeCompare(b.created_at)):introRows;source.replaceChildren(element('h3','','Ausschnitt aus users'));const currentIndex=step>=3&&step<=7?step-3:-1;const checked=step>=3&&step<=7?introRows.slice(0,step-2):[];const bestRow=checked.length?checked.reduce((best,row)=>row.created_at<best.created_at?row:best):null;const selectedIndex=bestRow?introRows.findIndex((row)=>row.id===bestRow.id):-1;
  if(step>=2){const pre=element('pre','given-sql sql9-intro-sql'),code=element('code');const lines=step===2?['SELECT username, created_at','FROM users','ORDER BY created_at ASC']:['SELECT MIN(created_at)','FROM users'];lines.forEach((line,index)=>{const span=element('span',step===2&&index===2||step>=4&&index===0?'is-active-clause':'',line);code.append(span);});pre.append(code);source.append(pre);}
  source.append(introTable(rows,['username','created_at'],'Ausschnitt aus users',currentIndex,selectedIndex,step>=3));
  if(step>=3&&step<=7){const current=introRows[currentIndex]?.created_at,previous=checked.length>1?checked.slice(0,-1).reduce((best,row)=>row.created_at<best.created_at?row:best).created_at:current,best=bestRow?.created_at;source.append(paragraph(`${current} ${current===previous?'=':current>previous?'>':'<'} ${previous} → MIN(created_at) = ${best}`,'sql9-intro-comparison'));}
  out.replaceChildren();if(step===8){const earliest=introRows.reduce((best,row)=>row.created_at<best.created_at?row:best).created_at;out.append(exampleTable('Ergebnisrelation',['MIN(created_at)'],[[earliest]]));}else out.append(element('p','sql9-result-empty','–'));
 };
 prev.addEventListener('click',()=>{state.introStep=Math.max(1,state.introStep-1);save();update();});next.addEventListener('click',()=>{state.introStep=Math.min(8,state.introStep+1);save();update();});update();
}function quizSelection(question) { return Array.isArray(state.quiz[question.id]) ? state.quiz[question.id] : []; }
function renderQuiz(panel) {
 const card=element('section','task-card sql-task');card.append(element('h3','','Abschlussquiz und Auswertung'),paragraph('**Kreuze** bei jeder Frage alle richtigen Antworten an. Es können mehrere Antworten richtig sein.'));
 const form=element('form','final-quiz');form.id='final-quiz';form.noValidate=true;const fieldsets=[];
 const feedback=element('p','feedback sql-quiz-feedback');feedback.setAttribute('aria-live','polite');
 FINAL_QUIZ.forEach((question,index)=>{const field=document.createElement('fieldset'),legend=element('legend');legend.append(element('span','',String(index+1)),document.createTextNode(question.prompt));field.append(legend);if(question.example)field.append(sqlBlock(question.example));if(question.id==='q3')field.append(exampleTable('Ausschnitt aus users',['id','centimeters'],[['1','168'],['2','183'],['321','NULL']]));const choices=element('div','choice-list');question.options.forEach(([id,text])=>{const label=element('label','choice-option'),input=document.createElement('input');input.type='checkbox';input.name=`${question.id}-choice`;input.value=id;input.checked=quizSelection(question).includes(id);input.addEventListener('change',()=>{const current=quizSelection(question).filter((value)=>value!==id);state.quiz[question.id]=input.checked?[...current,id]:current;delete state.quizChecked[question.id];state.quizPassed=false;state.quizFeedback=null;save();showFeedback();refresh();updateTabMarks();});label.append(input,element('span','',text));choices.append(label);});field.append(choices);form.append(field);fieldsets.push(field);});
 const showFeedback=()=>{feedback.className=`feedback ${state.quizFeedback?.level||''} sql-quiz-feedback`;feedback.textContent=state.quizFeedback?.text||'';};
 const submit=element('button','primary-button','Quiz prüfen');submit.type='submit';const actions=element('div','action-row');actions.append(submit);form.append(actions,feedback);
 const overviewSlot=element('div','sql9-overview-slot');const refresh=()=>{overviewSlot.replaceChildren();if(state.quizPassed)overviewSlot.append(renderOverview());};
 form.addEventListener('submit',(event)=>{event.preventDefault();const correct=FINAL_QUIZ.map((question)=>question.options.every(([id,,right])=>new Set(quizSelection(question)).has(id)===right));state.quizPassed=correct.every(Boolean);state.quizFeedback=state.quizPassed?{level:'success',text:'Korrekt: Alle vier Fragen stimmen. Die Lösungsübersicht ist jetzt sichtbar.'}:correct.some(Boolean)?{level:'partial',text:'Teilweise korrekt: Prüfe die noch offenen Fragen einzeln.'}:{level:'hint',text:'Noch nicht korrekt: Nutze die Hinweise direkt unter den Fragen.'};save();showFeedback();refresh();updateTabMarks();});
 window.addQuizQuestionChecks?.({questions:FINAL_QUIZ.map((question,index)=>({id:question.id,fieldset:fieldsets[index],solution:question.options.filter(([, ,right])=>right).map(([id])=>id),check:()=>{const chosen=new Set(quizSelection(question));const ok=question.options.every(([id,,right])=>chosen.has(id)===right);const some=question.options.some(([id,,right])=>right&&chosen.has(id));return {result:ok?'correct':some?'mixed':'wrong',text:ok?'Korrekt: Alle richtigen Aussagen dieser Frage sind markiert.':some?'Teilweise korrekt: Mindestens eine Markierung stimmt. Prüfe die übrigen Aussagen.':'Noch nicht korrekt: Vergleiche die Aussagen mit dem Beispiel und den Merksätzen.'};}})),buttonClass:'primary-button',rowClass:'action-row',feedbackClass:'feedback',levels:{high:'success',medium:'partial',low:'hint'},onCheck:(question,result)=>{state.quizChecked[question.id]=result==='correct';state.quizPassed=false;save();},onAllCorrect:()=>{for(const question of FINAL_QUIZ)state.quizChecked[question.id]=true;form.requestSubmit();}});
 card.append(form);panel.append(card,overviewSlot);showFeedback();refresh();
}

function renderOverview(){
 const overview=element('section','short-summary sql9-quiz-overview');overview.setAttribute('aria-labelledby','sql9-overview-title');const title=element('h3','','Übersicht: Aufgaben und Lösungen');title.id='sql9-overview-title';overview.append(title);
 const list=document.createElement('ol');TASKS.slice(0,6).forEach((task)=>{const item=document.createElement('li');richText(item,task.prompt);item.append(sqlBlock(task.sql));list.append(item);});overview.append(list);const fast=document.createElement('details');fast.append(element('summary','','Für die Schnellen – Aufgaben 7 bis 10'));const fastList=document.createElement('ol');fastList.start=7;TASKS.slice(6).forEach((task)=>{const item=document.createElement('li');richText(item,task.prompt);item.append(sqlBlock(task.sql));fastList.append(item);});fast.append(fastList);overview.append(fast);
 const quiz=element('section');quiz.append(element('h4','','Abschlussquiz – richtige Aussagen'));const answers=document.createElement('ol');FINAL_QUIZ.forEach((question)=>{const item=document.createElement('li');item.append(element('strong','',question.prompt));const ul=document.createElement('ul');question.options.filter(([, ,right])=>right).forEach(([,text])=>ul.append(element('li','',text)));item.append(ul);answers.append(item);});quiz.append(answers);overview.append(quiz,renderSummary());return overview;
}
function renderSummary(){const summary=element('section','short-summary');summary.append(element('h3','','Merksätze'),paragraph('Eine Aggregatfunktion fasst Werte der ausgewählten Zeilen zu einem Kennwert zusammen. Ohne GROUP BY entsteht hier eine Ergebniszeile.'),paragraph('WHERE wählt zuerst die Zeilen aus, die in die Berechnung eingehen.'),paragraph('COUNT(*) zählt alle ausgewählten Zeilen; COUNT(spalte) zählt nur Zeilen mit einem Wert ungleich NULL in dieser Spalte.'),paragraph('MIN und MAX finden den kleinsten und größten Wert; SUM addiert Zahlenwerte, AVG berechnet deren Mittelwert.'),paragraph('AS ändert nur die Überschrift einer Ergebnisspalte. Ein Extremwert wie MAX(created_at) liefert einen Zeitpunkt, nicht automatisch den zugehörigen Datensatz.'));return summary;}async function rerunSavedTasks() {for(const task of TASKS) if(state.feedback[task.id]) await runTask(task,{auto:true});}
async function init(){
 restore();render();
 document.getElementById('reset-module').addEventListener('click',()=>{if(window.confirm('Möchtest du alle SQL-Eingaben und den Fortschritt dieser Aufgabe zurücksetzen?')){tabRevision++;try{localStorage.removeItem(STORAGE_KEY);}catch{}location.reload();}});
 window.addEventListener('beforeunload',()=>database?.close());const status=document.getElementById('data-status');
 try{database=new SqlWorker();await database.init();databaseReady=true;const users=database.csvRows.users;const wanted=INTRO_EXPECTED.map(([id])=>id);const actual=wanted.map((id)=>users.find((row)=>String(row.id)===id)).filter(Boolean);if(actual.length===5&&actual.every((row,index)=>row.username===INTRO_EXPECTED[index][1]&&row.created_at===INTRO_EXPECTED[index][2]))introRows=actual.map(({id,username,created_at})=>({id:String(id),username,created_at}));else{const distinct=new Set();introRows=users.filter((row)=>{if(!row.created_at||distinct.has(row.created_at))return false;distinct.add(row.created_at);return true;}).slice(0,5).map(({id,username,created_at})=>({id:String(id),username,created_at}));}
 whereExampleRows=[...users.filter((row)=>row.city==='Berlin').slice(0,2),...users.filter((row)=>row.city!=='Berlin').slice(0,2)];
 status.textContent='Die Tabellen users und photos sind geladen. Du kannst SQL-Abfragen ausführen.';status.className='feedback success';status.setAttribute('aria-busy','false');document.querySelectorAll('.sql9-run').forEach((button)=>button.disabled=false);await rerunSavedTasks();render();}
 catch(error){status.textContent='Die Übungsdaten konnten nicht geladen werden. Bitte lade die Seite neu.';status.className='feedback error';status.setAttribute('aria-busy','false');console.error(error);}
}document.addEventListener('DOMContentLoaded',init);
