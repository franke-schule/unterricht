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
const PHOTOS_TABLE_SCHEMA = Object.freeze({table:'photos',columns:Object.freeze([['id','int'],['user_id','int'],['description','varchar(255)'],['url','varchar(255)'],['created_at','date'],['updated_at','date']])});
const ANALYTICS_TABLE_SCHEMA = Object.freeze({table:'analytics',columns:Object.freeze([['id','int'],['ip','varchar(255)'],['device','varchar(255)'],['brand_family','varchar(255)'],['brand_model','varchar(255)'],['browser_family','varchar(255)'],['browser_version','int'],['platform_family','varchar(255)'],['platform_version','varchar(255)'],['user_id','int'],['photo_id','int'],['created_at','date'],['updated_at','date']])});
const USER_COLUMN_NAMES = USERS_TABLE_SCHEMAS[0].columns.map(([name]) => name);


const STORAGE_KEY = 'informatik9-datenbanken-aufgabe6-group-by-v1';
const NEUTRAL_SQL_PLACEHOLDER = 'SELECT ...\nFROM ...';
const TABS = [
  ['intro','Einführung: GROUP BY','Entdecken','Einführung: GROUP BY'],
  ['count','Gruppen auswerten','Verstehen und anwenden','Gruppen auswerten'],
  ['extremes','Gruppen filtern mit HAVING','Anwenden','Gruppen filtern mit HAVING'],
  ['average','Fotos gruppieren','Anwenden','Fotos gruppieren'],
  ['fast','Für die Schnellen','Übertragen','Für die Schnellen'],
  ['quiz','Abschlussquiz und Auswertung','Sichern','Abschlussquiz und Auswertung']
];
const FEEDBACK_LEVELS = ['success','partial','hint','error'];
const makeTask = (number,tab,prompt,sql,hints,ok,partial,wrong,table='users', projection='group') => ({id:`t${number}`,number,tab,block:tab==='fast'?'fast':'core',prompt,sql,hints,texts:{ok,partial,wrong},table,projection});
const TASKS = [
 makeTask(1,'count','**Gib** für männliche und weibliche Mitglieder jeweils das Geschlecht und die Anzahl aus.',"SELECT gender, COUNT(*) AS Anzahl\nFROM users\nWHERE gender = 'male' OR gender = 'female'\nGROUP BY gender",['Welche Spalte enthält die beiden Gruppenbezeichnungen?','Wähle mit `WHERE` nur `male` und `female`; danach gruppierst du nach `gender`.','Beginne mit `SELECT gender, COUNT(*) FROM users` und ergänze Filter und Gruppierung.'],'Korrekt: Du zeigst für male und female je eine Gruppe mit ihrer Mitgliederzahl.','Teilweise korrekt: Du zählst Mitglieder; prüfe, ob beide Geschlechter getrennt und ohne weitere Gruppe erscheinen.','Noch nicht korrekt: Eine Gesamtzahl reicht nicht. Gruppiere nach `gender` und gib `gender` mit aus.'),
 makeTask(2,'count','**Berechne** für männliche und weibliche Mitglieder jeweils die durchschnittliche Körpergröße. **Gib** Geschlecht und Durchschnitt aus.',"SELECT gender, AVG(centimeters) AS Durchschnitt\nFROM users\nWHERE gender = 'male' OR gender = 'female'\nGROUP BY gender",['Die Größen stehen in `centimeters`; fehlende Größenwerte werden von `AVG` nicht mitgerechnet.','Filtere auf die beiden verlangten `gender`-Werte und gruppiere anschließend nach `gender`.','Starte mit `SELECT gender, AVG(centimeters) FROM users` und ergänze `WHERE` sowie `GROUP BY`.'],'Korrekt: Du berechnest den Durchschnitt der eingetragenen Größen für beide Gruppen.','Teilweise korrekt: Die Durchschnittsberechnung stimmt; prüfe Gruppierung, Geschlechtsfilter und Gruppenbezeichnung.','Noch nicht korrekt: Verwende `AVG(centimeters)` pro Geschlechtsgruppe statt eines einzigen Gesamtdurchschnitts.'),
 makeTask(3,'count','**Zähle** die Mitglieder je eingetragener Stadt. **Gib** Stadt und Anzahl aus.',"SELECT city, COUNT(*) AS Anzahl\nFROM users\nWHERE city IS NOT NULL\nGROUP BY city",['Gleiche Städtenamen sollen in derselben Gruppe landen.','`GROUP BY city` bildet Stadtgruppen; `COUNT(*)` zählt ihre Zeilen.','Beginne mit `SELECT city, COUNT(*) FROM users` und schließe fehlende Städte vor dem Gruppieren aus.'],'Korrekt: Jede eingetragene Stadt hat ihre eigene Ergebniszeile mit Anzahl.','Teilweise korrekt: Die Zahlen passen zum Zählen; prüfe Stadtspalte, Gruppierung und fehlende Städte.','Noch nicht korrekt: Gib `city` und `COUNT(*)` gemeinsam aus und gruppiere nach `city`.'),
 makeTask(4,'extremes','**Finde** vollständige Geburtsdaten einschließlich Jahr, die mehr als einmal vorkommen. **Gib** Geburtsdatum und Mitgliederzahl aus.',"SELECT birthday, COUNT(*) AS Anzahl\nFROM users\nWHERE birthday IS NOT NULL\nGROUP BY birthday\nHAVING COUNT(*) > 1",['Vergleiche ganze Werte aus `birthday`, nicht nur Tag und Monat.','`WHERE birthday IS NOT NULL` entfernt fehlende Daten; `HAVING` prüft danach die Größe jeder Datumsgruppe.','Beginne mit `SELECT birthday, COUNT(*) FROM users`; ergänze `GROUP BY birthday` und `HAVING COUNT(*) > 1`.'],'Korrekt: Du zeigst wiederholte vollständige Geburtsdaten und ihre Anzahl.','Teilweise korrekt: Die Datumsgruppen sind erkennbar; prüfe, ob nur Gruppen mit mehr als einem Mitglied bleiben.','Noch nicht korrekt: `SELECT *` zeigt keinen sinnvollen Gruppenkennwert. Gib `birthday` und `COUNT(*)` aus.'),
 makeTask(5,'extremes','**Finde** Städte mit einer durchschnittlichen Körpergröße über 185 cm. **Gib** Stadt und Durchschnitt aus.',"SELECT city, AVG(centimeters) AS Durchschnitt\nFROM users\nGROUP BY city\nHAVING AVG(centimeters) > 185",['Gesucht ist ein Durchschnitt pro Stadt, keine Anzahl.','Berechne `AVG(centimeters)` für `GROUP BY city`; prüfe erst die fertigen Gruppen mit `HAVING`.','Beginne mit `SELECT city, AVG(centimeters) FROM users` und ergänze `GROUP BY city` sowie `HAVING AVG(centimeters) > 185`.'],'Korrekt: Keine Stadt überschreitet in diesen Übungsdaten 185 cm im Durchschnitt; das leere Ergebnis ist hier richtig.','Teilweise korrekt: Du berechnest Stadt-Durchschnitte; prüfe die Gruppenbedingung `> 185`.','Noch nicht korrekt: `WHERE` kann den Durchschnitt einer Gruppe nicht filtern. Verwende `HAVING` nach `GROUP BY`.'),
 makeTask(6,'extremes','**Finde** eingetragene Städte mit mehr als zwei Mitgliedern. **Gib** Stadt und Anzahl aus.',"SELECT city, COUNT(*) AS Anzahl\nFROM users\nWHERE city IS NOT NULL\nGROUP BY city\nHAVING COUNT(*) > 2",['Die Anzahl gehört zu jeder Stadtgruppe.','Gruppiere nach `city`; `HAVING` hält nur Gruppen mit mindestens drei Zeilen zurück.','Beginne mit `SELECT city, COUNT(*) FROM users`; ergänze den Filter fehlender Städte, `GROUP BY city` und `HAVING COUNT(*) > 2`.'],'Korrekt: Du zeigst nur Städte mit mehr als zwei Mitgliedern samt Anzahl.','Teilweise korrekt: Die Stadtgruppen stimmen; prüfe die Schwelle hinter `HAVING`.','Noch nicht korrekt: Ein Zeilenfilter in `WHERE` ersetzt die Bedingung für fertige Stadtgruppen nicht.'),
 makeTask(7,'average','**Gib** für jede User-ID die Anzahl der von ihr hochgeladenen Fotos aus.',"SELECT user_id, COUNT(*) AS Anzahl\nFROM photos\nGROUP BY user_id",['Die hochladende Person steht in `photos.user_id`.','Alle Fotos derselben `user_id` gehören zu einer Gruppe.','Beginne mit `SELECT user_id, COUNT(*) FROM photos` und gruppiere nach `user_id`.'],'Korrekt: Jede User-ID hat ihre eigene Fotoanzahl.','Teilweise korrekt: Du zählst Fotos; gib die zugehörige User-ID je Gruppe aus.','Noch nicht korrekt: Verwende `photos`, gruppiere nach `user_id` und zähle die Fotos.','photos'),
 makeTask(8,'average','**Gib** nur die User-IDs aus, die mehr als 13 Fotos hochgeladen haben.',"SELECT user_id\nFROM photos\nGROUP BY user_id\nHAVING COUNT(*) > 13",['Die Anzahl ist Bedingung für eine ganze User-ID-Gruppe.','Gruppiere `photos` nach `user_id` und filtere mit `HAVING COUNT(*) > 13`.','Beginne mit `SELECT user_id FROM photos`; ergänze `GROUP BY user_id` und `HAVING COUNT(*) > 13`.'],'Korrekt: In diesen Übungsdaten hat keine User-ID mehr als 13 Fotos; deshalb bleibt die Ausgabe leer.','Teilweise korrekt: Du bildest Fotogruppen; prüfe die Bedingung `COUNT(*) > 13`.','Noch nicht korrekt: Eine leere Ausgabe allein genügt nicht. Verwende eine wirksame Gruppenbedingung für die Fotoanzahl.','photos','id'),
 makeTask(9,'average','**Gib** die drei User-IDs mit den meisten Fotos und ihre Fotoanzahl aus. **Sortiere** nach Anzahl absteigend und bei Gleichstand nach User-ID aufsteigend.',"SELECT user_id, COUNT(*) AS Anzahl\nFROM photos\nGROUP BY user_id\nORDER BY Anzahl DESC, user_id ASC\nLIMIT 3",['Zähle zunächst Fotos pro `user_id`.','Sortiere zuerst nach `COUNT(*) DESC`, danach nach `user_id ASC`.','Beginne mit `SELECT user_id, COUNT(*) FROM photos GROUP BY user_id`; ergänze beide Sortierschlüssel und `LIMIT 3`.'],'Korrekt: Du zeigst die drei größten Fotogruppen in der verlangten Reihenfolge.','Teilweise korrekt: Die drei Gruppen stimmen; prüfe Reihenfolge und Gleichstandsregel.','Noch nicht korrekt: Ein einzelnes Maximum liefert keine drei User-IDs. Gruppiere, sortiere und begrenze auf drei Zeilen.','photos','top3'),
 makeTask(10,'fast','**Gib** für jede Browserfamilie die höchste gespeicherte numerische Hauptversion aus. **Zeige** Browserfamilie und Versionsmaximum.','SELECT browser_family, MAX(browser_version) AS HoechsteVersion\nFROM analytics\nGROUP BY browser_family',['Alle Zugriffe derselben `browser_family` gehören zu einer Gruppe.','`browser_version` ist hier als ganze Zahl gespeichert; `MAX` findet je Gruppe den höchsten Wert.','Beginne mit `SELECT browser_family, MAX(browser_version) FROM analytics` und ergänze `GROUP BY browser_family`.'],'Korrekt: Jede Browserfamilie ist mit ihrer höchsten gespeicherten Hauptversion zu sehen.','Teilweise korrekt: Die Maxima passen; gib auch die jeweilige Browserfamilie aus.','Noch nicht korrekt: Vergleiche die numerischen Versionen innerhalb jeder Browserfamilie.','analytics'),
 makeTask(11,'fast','**Gib** für jedes Gerät die Anzahl der Zugriffe aus. **Zeige** Gerät und Anzahl.','SELECT device, COUNT(*) AS Anzahl\nFROM analytics\nGROUP BY device',['Jede Zeile in `analytics` steht für einen Zugriff.','Gruppiere nach `device` und zähle die Zeilen jeder Gerätegruppe.','Beginne mit `SELECT device, COUNT(*) FROM analytics` und ergänze `GROUP BY device`.'],'Korrekt: desktop, mobile und tablet haben jeweils ihre eigene Zugriffszahl.','Teilweise korrekt: Du zählst Zugriffe; gib das zugehörige Gerät pro Gruppe aus.','Noch nicht korrekt: Gruppiere nach `device`, nicht nach Browserfamilie.','analytics'),
 makeTask(12,'fast','**Betrachte** nur weibliche Mitglieder. **Gib** die eingetragenen Städte mit mehr als zwei dieser Mitglieder und ihre Anzahl aus.',"SELECT city, COUNT(*) AS Anzahl\nFROM users\nWHERE gender = 'female' AND city IS NOT NULL\nGROUP BY city\nHAVING COUNT(*) > 2",['Der Geschlechtsfilter wirkt auf Zeilen, die Mindestanzahl auf Gruppen.','Setze `WHERE gender = \'female\'` vor `GROUP BY city` und die Anzahlbedingung hinter `HAVING`.','Beginne mit `SELECT city, COUNT(*) FROM users WHERE gender = \'female\'`; ergänze den Ausschluss fehlender Städte, `GROUP BY city` und `HAVING COUNT(*) > 2`.'],'Korrekt: Du filterst zuerst weibliche Mitglieder und prüfst danach die Stadtgruppen.','Teilweise korrekt: Die Stadtgruppen entstehen; prüfe, ob `WHERE` und `HAVING` beide wirksam sind.','Noch nicht korrekt: Verbinde den Zeilenfilter für `female` mit einer Gruppenbedingung für mehr als zwei Mitglieder.')
];
const TASK_BY_ID = new Map(TASKS.map((task)=>[task.id,task]));
const TAB_TASKS = {count:['t1','t2','t3'],extremes:['t4','t5','t6'],average:['t7','t8','t9'],fast:['t10','t11','t12']};
const FINAL_QUIZ = [
 {id:'q1',prompt:'Was zeigt `SELECT city, COUNT(*) FROM users GROUP BY city`?',hint:'Prüfe Ergebnisform und gespeicherte Tabelle getrennt.',options:[['a','Eine Ergebniszeile pro ausgegebener Stadtgruppe mit deren Anzahl.',true],['b','Die gespeicherten Zeilen in `users` bleiben erhalten.',true],['c','Eine einzige Gesamtzahl für alle Mitglieder.',false],['d','Eine automatisch alphabetisch sortierte Städteliste.',false]]},
 {id:'q2',prompt:'Welche Aussagen zu `COUNT(*)` und `AVG(centimeters)` mit `GROUP BY city` stimmen?',hint:'Eine Aggregatfunktion wird für jede Gruppe getrennt berechnet.',options:[['a','`COUNT(*)` zählt die Zeilen jeder Stadtgruppe.',true],['b','`AVG(centimeters)` berechnet pro Stadt einen Durchschnitt der vorhandenen Größenwerte.',true],['c','`AVG` rechnet fehlende Größenwerte als null Zentimeter mit.',false],['d','Beide Funktionen liefern trotz `GROUP BY` stets nur eine Zeile.',false]]},
 {id:'q3',prompt:'Welche Klausel passt zu welchem Filter?',hint:'Unterscheide Zeilen vor und Gruppen nach der Gruppierung.',options:[['a',"`WHERE gender = 'female'` wählt Zeilen vor der Gruppierung.",true],['b','`HAVING COUNT(*) > 2` filtert Gruppen nach ihrer Größe.',true],['c','`WHERE COUNT(*) > 2` ist hier die passende Gruppenbedingung.',false],['d','`HAVING` löscht die übrigen Zeilen aus der gespeicherten Tabelle.',false]]},
 {id:'q4',prompt:'Wie erhält eine Gruppenabfrage eine verlässliche Reihenfolge?',hint:'Eine Gruppierung ist keine Sortieranweisung.',options:[['a','Mit `ORDER BY Anzahl DESC` lassen sich größere Anzahlen zuerst anzeigen.',true],['b','`GROUP BY` sortiert die Ausgabe immer nach dem Gruppennamen.',false],['c','`HAVING` sortiert die übrig gebliebenen Gruppen.',false],['d','Die Reihenfolge ist ohne `ORDER BY` dauerhaft garantiert.',false]]},
 {id:'q5',prompt:'Welche Ausgabe passt zu einer einfachen Stadtgruppierung?',hint:'Hinter `SELECT` stehen hier Gruppenspalten und Aggregatausdrücke.',options:[['a','`SELECT city, COUNT(*) ... GROUP BY city` zeigt Stadt und Gruppenanzahl.',true],['b','`SELECT city, AVG(centimeters) ... GROUP BY city` zeigt Stadt und Gruppendurchschnitt.',true],['c','`SELECT * ... GROUP BY city` zeigt zuverlässig alle einzelnen Mitglieder jeder Stadt.',false],['d','`SELECT username, COUNT(*) ... GROUP BY city` ordnet jeder Stadt zuverlässig einen bestimmten Benutzernamen zu.',false]]}
];
const INTRO_PHASES=['1 · Quelle','2 · Gruppierung','3 · Gruppierung','4 · Gruppierung','5 · Zählen','6 · Zählen','7 · Zählen','8 · Ergebnis','9 · Vergleich','10 · Definition'];
const INTRO_EXPECTED=[['4','koch_kicker','Berlin'],['2','wanderwut_finn','München'],['1','zornigerfotograf','Schwerin'],['34','gartenlinse','Berlin'],['11','kunstnews_luis','München'],['37','musikriese','Berlin']];
let introRows=INTRO_EXPECTED.map(([id,username,city])=>({id,username,city}));
let cancelIntroMotion=()=>{};
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
  if(Number.isInteger(saved.introStep)&&saved.introStep>=1&&saved.introStep<=10)state.introStep=saved.introStep;
  if(isPlainObject(saved.answers))for(const [id,value] of Object.entries(saved.answers))if(TASK_BY_ID.has(id)&&typeof value==='string')state.answers[id]=value;
  if(isPlainObject(saved.feedback))for(const [id,value] of Object.entries(saved.feedback))if(TASK_BY_ID.has(id)&&validFeedback(value))state.feedback[id]=value;
  if(isPlainObject(saved.solved))for(const [id,value] of Object.entries(saved.solved))if(TASK_BY_ID.has(id)&&value===true)state.solved[id]=true;
  if(isPlainObject(saved.quiz))for(const q of FINAL_QUIZ)if(Array.isArray(saved.quiz[q.id]))state.quiz[q.id]=saved.quiz[q.id].filter((id)=>q.options.some(([option])=>option===id));
  if(isPlainObject(saved.quizChecked))for(const q of FINAL_QUIZ)if(saved.quizChecked[q.id]===true)state.quizChecked[q.id]=true;
  if(validFeedback(saved.quizFeedback))state.quizFeedback=saved.quizFeedback;
  state.quizPassed=saved.quizPassed===true;
}function isTabComplete(id) {
  if (id==='intro') return state.introStep===10;
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
    for (const table of ['users','photos','analytics']) {
      const url = table==='analytics' ? new URL('./analytics.csv', import.meta.url) : new URL(`../../klasse-10/1-Datenbanken/${table}.csv`, import.meta.url);
      const response = await fetch(url);
      if (!response.ok) throw new Error(`${table}.csv konnte nicht geladen werden.`);
      const [headers, ...data] = parseDelimited(await response.text());
      this.csvRows[table] = data.map((row)=>Object.fromEntries(headers.map((header,index)=>[header,row[index]])));
      const numeric = table==='users' ? ['id','centimeters','is_active'] : table==='analytics' ? ['id','browser_version','user_id','photo_id'] : ['id','user_id'];
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
  if (['id', 'centimeters', 'is_active', 'user_id', 'photo_id', 'browser_version'].includes(header) && /^-?\d+(?:\.\d+)?$/.test(value)) return value;
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
function groupingColumn(tokens) {
  for(let i=0;i<tokens.length-1;i++) if(tokenKeyword(tokens[i])==='GROUP'&&tokenKeyword(tokens[i+1])==='BY') return identifierValue(tokens[i+2])?.toLowerCase()||null;
  return null;
}
function functionCalls(tokens) { const calls=[]; for(let i=0;i<tokens.length-1;i++) if(tokens[i].type==='word'&&tokens[i+1].value==='(') calls.push(tokens[i].value.toUpperCase()); return calls; }
function makeGroupProbe(task, sql) {
  const schema=task.table==='users'?USERS_TABLE_SCHEMAS[0]:task.table==='photos'?PHOTOS_TABLE_SCHEMA:ANALYTICS_TABLE_SCHEMA;
  const columns=schema.columns.map(([name])=>name);
  const base=columns.map(()=>null);
  const rows=[];
  const add=(values)=>{const row=[...base];for(const [key,value] of Object.entries(values))row[columns.indexOf(key)]=value;rows.push(row);};
  if(task.table==='users') {
    [['male','Berlin',170,'2000-01-01'],['male','Berlin',180,'2000-01-01'],['female','Berlin',160,'2001-02-02'],['female','Berlin',170,'2002-03-03'],['female','Berlin',180,'2003-04-04'],['female','München',190,'2002-03-03'],['female','München',175,'2003-04-04'],['diverse','München',175,'2003-04-04'],['female','Schwerin',165,'2004-05-05'],['female',null,165,null],['female',null,166,null],['female',null,167,null],['male','Schwerin',185,'2004-05-05'],['female','Tall',200,'2005-06-06'],['male','Tall',190,'2006-07-07'],[null,'Berlin',null,null]].forEach(([gender,city,centimeters,birthday],i)=>add({id:i+1,username:`probe${i}`,gender,city,centimeters,birthday}));
  } else if(task.table==='photos') {
    for(let i=0;i<15;i++)add({id:i+1,user_id:1,description:'probe'});
    for(let i=0;i<14;i++)add({id:20+i,user_id:2,description:'probe'});
    for(let i=0;i<2;i++)add({id:40+i,user_id:3,description:'probe'});
    for(let i=0;i<2;i++)add({id:50+i,user_id:4,description:'probe'});
  } else {
    [['A',9,'desktop'],['A',10,'desktop'],['A',17,'mobile'],['B',8,'mobile'],['Safari',9,'tablet'],['Safari',10,'tablet']].forEach(([browser_family,browser_version,device],i)=>add({id:i+1,browser_family,browser_version,device,platform_version:'14',user_id:i+1,photo_id:i+1}));
  }
  const tuples=rows.map(row=>`(${row.map((value,index)=>sqlValue(value,columns[index])).join(', ')})`).join(', ');
  return `WITH ${task.table} (${columns.map(quoteIdentifier).join(', ')}) AS (VALUES ${tuples})\n${sql}`;
}
async function evaluateGroupTask(task, analysis, actual) {
  const tokens=analysis.tokens, words=tokens.map(tokenKeyword), expectedColumn={1:'gender',2:'gender',3:'city',4:'birthday',5:'city',6:'city',7:'user_id',8:'user_id',9:'user_id',10:'browser_family',11:'device',12:'city'}[task.number];
  if(words.includes('UPDATE')||words.includes('DELETE')||words.includes('INSERT'))return {level:'hint',text:task.texts.wrong};
  if(groupingColumn(tokens)!==expectedColumn)return {level:'hint',text:words.includes('GROUP')?'Noch nicht korrekt: Prüfe, nach welcher Spalte die gefragten Gruppen entstehen.':'Noch nicht korrekt: Die Abfrage liefert eine Gesamtzahl statt eines Kennwerts pro Gruppe. Ergänze eine wirksame Gruppierung.'};
  const whereIndex=words.indexOf('WHERE');
  if(whereIndex>=0){const end=tokens.findIndex((t,i)=>i>whereIndex&&['GROUP','HAVING','ORDER','LIMIT'].includes(tokenKeyword(t)));if(functionCalls(tokens.slice(whereIndex+1,end<0?undefined:end)).length)return {level:'hint',text:task.texts.wrong};}
  const calls=functionCalls(tokens), expectedFn=task.number===2||task.number===5||task.number===10?'AVG':task.number===4||task.number===10?'MAX':'COUNT';
  const expectedFunction=task.number===10?'MAX':task.number===2||task.number===5?'AVG':'COUNT';
  if(!calls.includes(expectedFunction))return {level:'hint',text:task.texts.wrong};
  if([4,5,6,8,12].includes(task.number)) {
    const havingIndex=words.indexOf('HAVING');
    const having=tokens.slice(havingIndex+1).map(tokenKeyword);
    if(havingIndex<0||!having.includes(expectedFunction)||!tokens.slice(havingIndex+1).some(t=>['>','>='].includes(t.value)))return {level:'hint',text:task.texts.partial};
    const required={4:'1',5:'185',6:'2',8:'13',12:'2'}[task.number];
    if(!tokens.slice(havingIndex+1).some(t=>t.type==='number'&&t.value===required))return {level:'hint',text:task.texts.partial};
  }
  if([1,2].includes(task.number)&&!tokens.some(t=>tokenKeyword(t)==='WHERE'))return {level:'partial',text:task.texts.partial};
  if([3,4,6].includes(task.number)&&!tokens.some(t=>tokenKeyword(t)==='WHERE'&&tokens.some((v,i)=>tokenKeyword(v)==='IS'&&tokenKeyword(tokens[i+1])==='NOT'&&tokenKeyword(tokens[i+2])==='NULL')))return {level:'partial',text:task.texts.partial};
  if(task.number===12&&!tokens.some((t,i)=>tokenKeyword(t)==='WHERE'&&tokens.slice(i+1).some((v,j)=>identifierValue(v)?.toLowerCase()==='gender'&&tokens[i+2+j]?.value==='='&&tokens[i+3+j]?.type==='string'&&tokens[i+3+j].value.toLowerCase()==="'female'")))return {level:'partial',text:task.texts.partial};
  if(task.number===9) {
    const order=tokens.findIndex(t=>tokenKeyword(t)==='ORDER');
    if(order<0||tokenKeyword(tokens[order+1])!=='BY'||!tokens.slice(order).some(t=>tokenKeyword(t)==='DESC')||!tokens.slice(order).some(t=>tokenKeyword(t)==='ASC')||analysis.limit!==3)return {level:'partial',text:task.texts.partial};
  }
  const projection=tokens.slice(1,analysis.fromIndex);
  if(projection[0]?.value==='*'||projection.some(t=>identifierValue(t)?.toLowerCase()==='username'))return {level:'hint',text:task.texts.wrong};
  if(task.number!==8&&!projection.some(t=>identifierValue(t)?.toLowerCase()===expectedColumn))return {level:'partial',text:'Teilweise korrekt: Der Kennwert stimmt, aber der Gruppenname fehlt in der Ausgabe.'};
  const reference=await cachedExec(task.sql);
  const options={numericTolerance:1e-6,columnLabels:false,rowOrder:task.number===9};
  const allowsCount=task.number===8&&projection.some((token,index)=>tokenKeyword(token)==='COUNT'&&projection[index+1]?.value==='(');
  const countReference=allowsCount?await cachedExec('SELECT user_id, COUNT(*) FROM photos GROUP BY user_id HAVING COUNT(*) > 13'):null;
  const expected=allowsCount?countReference:reference;
  const compare=compareRelations(actual,expected,options);
  let probeStudent,probeReference;
  try { [probeStudent,probeReference]=await Promise.all([database.exec(makeGroupProbe(task,analysis.source)),database.exec(makeGroupProbe(task,allowsCount?'SELECT user_id, COUNT(*) FROM photos GROUP BY user_id HAVING COUNT(*) > 13':task.sql))]); }
  catch { return {level:'hint',text:task.texts.wrong}; }
  if(!compare.correct||!compareRelations(probeStudent,probeReference,options).correct)return {level:'hint',text:task.texts.partial};
  return {level:'success',text:task.texts.ok,solved:true};
}
async function evaluate(task,analysis,actual) {
  return evaluateGroupTask(task,analysis,actual);
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
  const schema=taskConfig.table==='photos'?[PHOTOS_TABLE_SCHEMA]:taskConfig.table==='analytics'?[ANALYTICS_TABLE_SCHEMA]:USERS_TABLE_SCHEMAS;
  card.append(element('h3', '', `Aufgabe ${taskConfig.number}`), schemaCard(schema), paragraph(taskConfig.prompt));
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
  cancelIntroMotion();
  document.body.classList.toggle('sql-intro-active', state.tab === 'intro');
  renderTabs();
  const panel = document.getElementById('sql-panel'); panel.replaceChildren();
  panel.setAttribute('aria-labelledby', `tab-${state.tab}`);
  if (state.tab !== 'intro' && state.tab !== 'quiz') panel.append(schemaCard(state.tab==='fast' ? [...USERS_TABLE_SCHEMAS,PHOTOS_TABLE_SCHEMA,ANALYTICS_TABLE_SCHEMA] : state.tab==='average' ? [...USERS_TABLE_SCHEMAS,PHOTOS_TABLE_SCHEMA] : USERS_TABLE_SCHEMAS));
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
    card.append(exampleTable('Ausschnitt aus users',['gender','centimeters'],[['male','170'],['male','180'],['female','160']]),exampleTable('Gesamt und je Gruppe',['Kennwert','Ohne GROUP BY','Mit GROUP BY gender'],[['COUNT(*)','3','male 2, female 1'],['AVG(centimeters)','170 cm','male 175 cm, female 160 cm']]),paragraph('Ohne `GROUP BY` liefert `COUNT(*)` eine Gesamtzahl; `AVG(centimeters)` einen Durchschnitt. Mit `GROUP BY gender` entstehen Kennwerte für jede Geschlechtsgruppe.'),paragraph('`GROUP BY` fasst Zeilen mit gleichem Wert der angegebenen Spalte zu Gruppen zusammen. Die Aggregatfunktion wird für jede Gruppe getrennt berechnet.'),paragraph('Bei Aufgaben 1 und 2 betrachten wir nur `male` und `female`; andere oder fehlende Geschlechtsangaben werden mit `WHERE` ausgeschlossen.'));
  }
 if(tab==='extremes')card.append(sqlBlock('SELECT city, COUNT(*) AS Anzahl\nFROM users\nGROUP BY city\nHAVING COUNT(*) > 2'),exampleTable('Vor HAVING',['city','COUNT(*)'],[['Berlin','3'],['München','2'],['Schwerin','1']]),exampleTable('Nach HAVING',['city','COUNT(*)'],[['Berlin','3']]),paragraph('Zuerst entstehen drei Stadtgruppen. `HAVING COUNT(*) > 2` lässt nur die Gruppe mit mehr als zwei Mitgliedern in der Ausgabe.'),paragraph('`WHERE` wählt einzelne Zeilen vor `GROUP BY` aus. `HAVING` wählt nach der Gruppierung ganze Gruppen anhand eines Gruppenkennwerts aus.'),paragraph('`birthday IS NOT NULL` lässt Zeilen ohne eingetragenes Geburtsdatum weg; `NULL` bedeutet hier fehlender Wert.'));
 if(tab==='average')card.append(exampleTable('Fotos nach user_id',['id','user_id'],[['1','1'],['2','1'],['3','2']]),exampleTable('Anzahl je Person',['user_id','Anzahl'],[['1','2 Fotos'],['2','1 Foto']]),paragraph('Jedes Foto in `photos` trägt die `user_id` der Person, die es hochgeladen hat. Gruppierst du nach `user_id`, kannst du die Fotos pro Person zählen.'),paragraph('`HAVING COUNT(*) > 13` prüft die fertigen Fotogruppen, nicht einzelne Fotos.'));
 if(tab==='fast')card.append(paragraph('Die Aufgaben 10 bis 12 sind freiwillig. Du kannst das Abschlussquiz auch ohne sie bearbeiten.'),paragraph('Die Tabelle analytics enthält synthetische Übungsdaten, da die Tabelle auf InstaHub leer ist.'),exampleTable('Ausschnitt aus analytics',['browser_family','browser_version'],[['A','9'],['A','10'],['B','8']]),exampleTable('Maximum je Browserfamilie',['browser_family','MAX(browser_version)'],[['A','10'],['B','8']]),paragraph('Für diese Übung speichert `browser_version` nur numerische Hauptversionen. Darum kann `MAX(browser_version)` als Zahl vergleichen; bei beliebigen Versionszeichenfolgen wäre das nicht zuverlässig. Die Werte behaupten nichts über aktuelle Browserversionen.'),paragraph('`WHERE` wählt zuerst weibliche Mitglieder; danach werden Städte gruppiert und `HAVING` prüft die Anzahl je Stadt.'));
 return card;
}
function renderTaskTab(panel) {
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
 const card=element('section','task-card sql9-intro');card.append(paragraph('**Gehe** die Animation Schritt für Schritt durch. **Beobachte**, wie aus einzelnen Mitgliedern Gruppen und anschließend eine Ergebniszeile je Stadt entstehen.'),element('p','','Wie viele Mitglieder stammen aus jeder Stadt?'));
 const heading=element('div','sql9-intro-heading'),progress=element('div','sql9-intro-progress');progress.setAttribute('aria-label','Ablauf der Erklärung');const phases=INTRO_PHASES.map((text)=>{const span=element('span','',text);progress.append(span);return span;});
 const controls=element('div','intro-stepper');const prev=element('button','secondary-button','Zurück');prev.type='button';const count=element('span');count.id='intro-frame-count';count.setAttribute('aria-live','polite');const next=element('button','primary-button','Weiter');next.type='button';const restart=element('button','secondary-button','Neustart');restart.type='button';controls.append(prev,count,next,restart);heading.append(progress,controls);
 const workspace=element('div','sql9-intro-workspace'),visual=element('div','sql9-intro-visual'),result=element('div','sql9-result-card');const explanation=element('p','intro-explanation');explanation.setAttribute('aria-live','polite');const source=element('div','sql9-intro-stage'),out=element('div','sql9-result-body');visual.append(explanation,source);result.append(element('h3','','Ergebnis nur für diesen Ausschnitt'),out);workspace.append(visual,result);card.append(heading,workspace);panel.append(card);
  let busy=false;
  const update=(animate=false)=>{cancelIntroMotion();const step=state.introStep;const motion=animate&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches;phases.forEach((item,index)=>{item.className=index+1===step?'is-active':index+1<step?'is-complete':'';});count.textContent=`Schritt ${step} von 10`;prev.disabled=step===1;next.disabled=step===10;next.textContent=step===10?'Abgeschlossen':'Weiter';explanation.textContent=['Die Quelle bleibt unverändert sichtbar. Wir betrachten sechs Zeilen aus users.','Beobachte die drei Berliner Zeilen: Wohin bewegen sich ihre Kopien?','Die Berlin-Zeilen bewegen sich in eine gemeinsame Gruppe.','Die Gruppen für München und Schwerin entstehen ebenfalls.','COUNT(*) zählt die Zeilen jeder Gruppe.','Der Zähler der Berlin-Gruppe steigt mit jeder Zeile.','Die übrigen Gruppen werden ebenfalls gezählt.','Aus jeder Gruppe entsteht sichtbar eine Ergebniszeile.','Die Gesamtzahl 6 steht drei Gruppenanzahlen gegenüber.','Zeilen mit gleichem city-Wert bilden eine Gruppe. COUNT(*) zählt die Zeilen jeder Gruppe; die Abfrage gibt hier eine Zeile je Stadt aus. Die gespeicherte Tabelle bleibt unverändert.'][step-1];
  source.replaceChildren(element('h3','','Ausschnitt aus users (6 Zeilen)'));const pre=element('pre','given-sql sql9-intro-sql'),code=element('code');[['SELECT city, COUNT(*) AS Anzahl',step>=5&&step<=8],['FROM users',false],['GROUP BY city',step>=2&&step<=8]].forEach(([line,active])=>code.append(element('span',active?'is-active-clause':'',line)));pre.append(code);source.append(pre);
   source.append(introTable(introRows,['id','username','city'],'Ausschnitt aus users (6 Zeilen)'));
   const cities=['Berlin','München','Schwerin'], groupRows=new Map(), groupCounts=new Map();
   if(step>=2){const groups=element('div','sql9-moving-groups');cities.slice(0,Math.min(3,step-1)).forEach((city)=>{const box=element('section','sql9-moving-group');box.append(element('h4','',city));const members=introRows.filter(row=>row.city===city);members.forEach((row)=>{const item=element('span','sql9-moving-row',`${row.id} · ${row.username} · ${row.city}`);item.dataset.sourceId=row.id;if(motion&&step===cities.indexOf(city)+2)item.style.visibility='hidden';groupRows.set(row.id,item);box.append(item);});if(step>=5){const final=step===5?(city==='Berlin'?1:0):step===6?(city==='Berlin'?3:0):members.length;const start=motion&&step===5&&city==='Berlin'?0:motion&&step===6&&city==='Berlin'?1:motion&&step===7&&city!=='Berlin'?0:final;const counter=element('strong','sql9-count-number',`COUNT(*) = ${start}`);groupCounts.set(city,counter);box.append(counter);}groups.append(box);});source.append(groups);}
   out.replaceChildren();let resultRows=[];if(step>=8){const table=exampleTable('Ergebnis nur für diesen Ausschnitt',['city','Anzahl'],[['Berlin','3'],['München','2'],['Schwerin','1']]);resultRows=[...table.querySelectorAll('tbody tr')];if(motion&&step===8)resultRows.forEach(row=>row.style.visibility='hidden');out.append(table,paragraph(step===9?'Gesamtzahl 6 · Gruppenanzahlen 3, 2 und 1':'Die Gruppenansicht erklärt die Wirkung der Abfrage; sie zeigt keinen internen Arbeitsablauf der Datenbank und verspricht keine Sortierung.'));}else out.append(element('p','sql9-result-empty','Ergebnis folgt nach der Gruppierung.'));
   if(!motion||![2,3,4,5,6,7,8].includes(step))return;
   let active=true, flight=null, ghost=null, timer=null, wake=null;
   const cancel=()=>{active=false;flight?.cancel();ghost?.remove();if(timer)clearTimeout(timer);wake?.();busy=false;};cancelIntroMotion=cancel;
   busy=true;prev.disabled=true;next.disabled=true;restart.disabled=true;
   const pause=(ms)=>new Promise(resolve=>{wake=resolve;timer=setTimeout(()=>{timer=null;wake=null;resolve();},ms);});
   const fly=async(from,to,label)=>{if(!active||!from||!to)return;const a=from.getBoundingClientRect(),b=to.getBoundingClientRect();ghost=element('div','sql9-flight-row',label);ghost.style.left=`${a.left}px`;ghost.style.top=`${a.top}px`;ghost.style.width=`${a.width}px`;document.body.append(ghost);flight=ghost.animate([{transform:'translate(0, 0) scale(1)',opacity:0.9},{transform:`translate(${b.left-a.left}px, ${b.top-a.top}px) scale(${Math.min(1,b.width/a.width)})`,opacity:1}],{duration:520,easing:'ease-in-out'});await flight.finished.catch(()=>{});ghost.remove();ghost=null;flight=null;if(active)to.style.visibility='visible';};
   (async()=>{try{if(step>=2&&step<=4){for(const row of introRows.filter(row=>row.city===cities[step-2])){const from=source.querySelector(`tr[data-row-id="${row.id}"]`),to=groupRows.get(row.id);await fly(from,to,`${row.id} · ${row.username} · ${row.city}`);if(!active)return;await pause(120);}}
   else if(step>=5&&step<=7){const sequence=step===5?[['Berlin',1]]:step===6?[['Berlin',2],['Berlin',3]]:[['München',1],['München',2],['Schwerin',1]];for(const [city,value] of sequence){await pause(360);if(!active)return;groupCounts.get(city).textContent=`COUNT(*) = ${value}`;groupCounts.get(city).classList.add('is-counting');await pause(220);if(!active)return;groupCounts.get(city).classList.remove('is-counting');}}
   else if(step===8){for(let index=0;index<cities.length;index++){await fly(groupCounts.get(cities[index]),resultRows[index],`${cities[index]} · ${[3,2,1][index]}`);if(!active)return;await pause(180);}}}
   finally{if(active){busy=false;prev.disabled=step===1;next.disabled=step===10;restart.disabled=false;cancelIntroMotion=()=>{};}}})();
 };
  prev.addEventListener('click',()=>{if(busy)return;state.introStep=Math.max(1,state.introStep-1);save();update();});next.addEventListener('click',()=>{if(busy)return;state.introStep=Math.min(10,state.introStep+1);save();update(true);});restart.addEventListener('click',()=>{if(busy)return;state.introStep=1;save();update();});update();
}function quizSelection(question) { return Array.isArray(state.quiz[question.id]) ? state.quiz[question.id] : []; }
function renderQuiz(panel) {
 const card=element('section','task-card sql-task');card.append(element('h3','','Abschlussquiz und Auswertung'),paragraph('**Kreuze** bei jeder Frage alle richtigen Antworten an. Es können mehrere Antworten richtig sein.'));
 const form=element('form','final-quiz');form.id='final-quiz';form.noValidate=true;const fieldsets=[];
 const feedback=element('p','feedback sql-quiz-feedback');feedback.setAttribute('aria-live','polite');
 FINAL_QUIZ.forEach((question,index)=>{const field=document.createElement('fieldset'),legend=element('legend');legend.append(element('span','',String(index+1)),document.createTextNode(question.prompt));field.append(legend,element('p','',question.hint));const choices=element('div','choice-list');question.options.forEach(([id,text])=>{const label=element('label','choice-option'),input=document.createElement('input');input.type='checkbox';input.name=`${question.id}-choice`;input.value=id;input.checked=quizSelection(question).includes(id);input.addEventListener('change',()=>{const current=quizSelection(question).filter((value)=>value!==id);state.quiz[question.id]=input.checked?[...current,id]:current;delete state.quizChecked[question.id];state.quizPassed=false;state.quizFeedback=null;save();showFeedback();refresh();updateTabMarks();});label.append(input,element('span','',text));choices.append(label);});field.append(choices);form.append(field);fieldsets.push(field);});
 const showFeedback=()=>{feedback.className=`feedback ${state.quizFeedback?.level||''} sql-quiz-feedback`;feedback.textContent=state.quizFeedback?.text||'';};
 const submit=element('button','primary-button','Quiz prüfen');submit.type='submit';const actions=element('div','action-row');actions.append(submit);form.append(actions,feedback);
 const overviewSlot=element('div','sql9-overview-slot');const refresh=()=>{overviewSlot.replaceChildren();if(state.quizPassed)overviewSlot.append(element('p','','Du hast das Abschlussquiz gelöst. Nutze die Übersicht zur gemeinsamen Besprechung.'),renderOverview());};
 form.addEventListener('submit',(event)=>{event.preventDefault();const correct=FINAL_QUIZ.map((question)=>question.options.every(([id,,right])=>new Set(quizSelection(question)).has(id)===right));state.quizPassed=correct.every(Boolean);state.quizFeedback=state.quizPassed?{level:'success',text:'Korrekt: Alle fünf Fragen stimmen. Die Lösungsübersicht ist jetzt sichtbar.'}:correct.some(Boolean)?{level:'partial',text:'Teilweise korrekt: Prüfe die noch offenen Fragen einzeln.'}:{level:'hint',text:'Noch nicht korrekt: Lies die Beispiele und Merksätze erneut.'};save();showFeedback();refresh();updateTabMarks();});
 window.addQuizQuestionChecks?.({questions:FINAL_QUIZ.map((question,index)=>({id:question.id,fieldset:fieldsets[index],solution:question.options.filter(([, ,right])=>right).map(([id])=>id),check:()=>{const chosen=new Set(quizSelection(question));const ok=question.options.every(([id,,right])=>chosen.has(id)===right);const some=question.options.some(([id,,right])=>right&&chosen.has(id));return {result:ok?'correct':some?'mixed':'wrong',text:ok?'Korrekt: Alle richtigen Aussagen dieser Frage sind markiert.':some?'Teilweise korrekt: Mindestens eine richtige Aussage ist markiert. Prüfe die übrigen Optionen.':'Noch nicht korrekt: Nutze den Hinweis und das Beispiel im Pflichtteil.'};}})),buttonClass:'primary-button',rowClass:'action-row',feedbackClass:'feedback',levels:{high:'success',medium:'partial',low:'hint'},onCheck:(question,result)=>{state.quizChecked[question.id]=result==='correct';state.quizPassed=false;save();},onAllCorrect:()=>{for(const question of FINAL_QUIZ)state.quizChecked[question.id]=true;form.requestSubmit();}});
 card.append(form);panel.append(card,overviewSlot);showFeedback();refresh();
}

function renderOverview(){
 const overview=element('section','short-summary sql9-quiz-overview');overview.setAttribute('aria-labelledby','sql9-overview-title');const title=element('h3','','Übersicht: Aufgaben und Lösungen');title.id='sql9-overview-title';overview.append(title);
 const addTasks=(list,tasks)=>tasks.forEach((task)=>{const item=document.createElement('li');item.append(element('strong','',`Aufgabe ${task.number}: `));richText(item,task.prompt);item.append(sqlBlock(task.sql));list.append(item);});const list=document.createElement('ol');addTasks(list,TASKS.slice(0,9));overview.append(list);const fast=element('details');fast.append(element('summary','','Für die Schnellen – Aufgaben 10 bis 12'));const fastList=document.createElement('ol');fastList.start=10;addTasks(fastList,TASKS.slice(9));fast.append(fastList);overview.append(fast);
 const quiz=element('section');quiz.append(element('h4','','Abschlussquiz – richtige Aussagen'));const answers=document.createElement('ol');FINAL_QUIZ.forEach((question)=>{const item=document.createElement('li');item.append(element('strong','',question.prompt));const ul=document.createElement('ul');question.options.filter(([, ,right])=>right).forEach(([,text])=>ul.append(element('li','',text)));item.append(ul);answers.append(item);});quiz.append(answers);overview.append(quiz,renderSummary());return overview;
}
function renderSummary(){const summary=element('section','short-summary');summary.append(element('h3','','Merksätze'),paragraph('`GROUP BY` bildet aus Zeilen mit gleichem Wert der Gruppenspalte Gruppen; eine Aggregatfunktion berechnet einen Kennwert pro Gruppe.'),paragraph('Bei diesen einfachen Gruppenauswertungen zeigt das Ergebnis eine Zeile pro ausgegebener Gruppe. Die gespeicherte Tabelle bleibt unverändert.'),paragraph('`COUNT(*)` zählt alle Zeilen einer Gruppe. `AVG(spalte)` bildet den Mittelwert der eingetragenen Werte; fehlende Werte werden nicht mitgerechnet.'),paragraph('`WHERE` filtert einzelne Zeilen vor der Gruppierung. `HAVING` filtert Gruppen nach der Gruppierung, zum Beispiel mit `HAVING COUNT(*) > 2`.'),paragraph('`GROUP BY` garantiert keine Reihenfolge. Für eine gewünschte Sortierung verwende `ORDER BY`.'),paragraph('Hinter `SELECT` stehen bei diesen Abfragen die Gruppenspalten und Aggregatausdrücke; `SELECT *` oder beliebige ungruppierte Spalten passen nicht zur Gruppenauswertung.'),paragraph('Fehlende Werte einer Gruppenspalte bilden in SQL zusammen eine `NULL`-Gruppe. Wenn nur eingetragene Städte gefragt sind, werden sie vorab mit `WHERE city IS NOT NULL` ausgewählt.'));return summary;}async function rerunSavedTasks() {for(const task of TASKS) if(state.feedback[task.id]) await runTask(task,{auto:true});}
async function init(){
 restore();render();
 document.getElementById('reset-module').addEventListener('click',()=>{if(window.confirm('Möchtest du alle SQL-Eingaben und den Fortschritt dieser Aufgabe zurücksetzen?')){tabRevision++;try{localStorage.removeItem(STORAGE_KEY);}catch{}location.reload();}});
 window.addEventListener('beforeunload',()=>database?.close());const status=document.getElementById('data-status');
 try{database=new SqlWorker();await database.init();databaseReady=true;const users=database.csvRows.users;const actual=INTRO_EXPECTED.map(([id])=>users.find((row)=>String(row.id)===id));if(actual.length===6&&actual.every((row,index)=>row&&row.username===INTRO_EXPECTED[index][1]&&row.city===INTRO_EXPECTED[index][2]))introRows=actual.map(({id,username,city})=>({id:String(id),username,city}));else{const groups=['Berlin','München','Schwerin'];const picks=groups.flatMap((city,index)=>users.filter(row=>row.city===city).slice(0,index===0?3:index===1?2:1));introRows=picks.slice(0,8).map(({id,username,city})=>({id:String(id),username,city}));}
 whereExampleRows=[...users.filter((row)=>row.city==='Berlin').slice(0,2),...users.filter((row)=>row.city!=='Berlin').slice(0,2)];
 status.textContent='Die Tabellen users, photos und analytics sind geladen. Du kannst SQL-Abfragen ausführen.';status.className='feedback success';status.setAttribute('aria-busy','false');document.querySelectorAll('.sql9-run').forEach((button)=>button.disabled=false);await rerunSavedTasks();render();}
 catch(error){status.textContent='Die Übungsdaten konnten nicht geladen werden. Bitte lade die Seite neu.';status.className='feedback error';status.setAttribute('aria-busy','false');console.error(error);}
}document.addEventListener('DOMContentLoaded',init);
