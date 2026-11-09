import { bindSolutionCodePersistence, readSplitProgress } from './sql9-progress-migration.mjs';
// Aufgabe 3 – Dopplungen vermeiden und Zeilen begrenzen (Informatik 9).
// Seitengerüst nach klasse-9/2-Datenbanken/aufgabe1.js, SQL-Labor nach klasse-10/1-Datenbanken/sql-lab.js.
import { classifyDescriptionResult, compareRelations, isValidScriptServerUrl, missingTextQuote, normalizeRelation, parseDelimited, sqlTokens, validateSelectStatement } from '../../klasse-10/1-Datenbanken/sql-lab-core.mjs?v=20260929b';
import { evaluateSemanticAnswer, renderCompactEvaluation } from '../../klasse-11/1-Kuenstliche-Intelligenz/perzeptron/ui/semantic-answer.mjs?v=20261029-criteria-v1';
import { appendSolutionDownloadFromTemplate, enableTabKeyboardNavigation, focusTabPanelStart, renderTabFlowNavigation, syncTabSemantics } from '../../klasse-10/1-Datenbanken/tab-navigation.mjs?v=20260906a';

// Speicherschlüssel trotz Umbenennung beibehalten, damit bestehende Lernstände erhalten bleiben.
const STORAGE_KEY = 'informatik9-datenbanken-aufgabe3-distinct-limit-v2';
const LEGACY_STORAGE_KEY = 'informatik9-datenbanken-aufgabe2-v1';
const MIGRATION_MARKER = `${STORAGE_KEY}-migration-done`;
const NEUTRAL_SQL_PLACEHOLDER = 'SELECT ...\nFROM ...';
const SCRIPT_SERVER_URL = 'https://unterrichtkiichezbn4-ki-auswertung.functions.fnc.fr-par.scw.cloud/';
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

// [id, Label, Kicker, Überschrift]
const TABS = [
  ['distinct', 'Doppelte Werte vermeiden: DISTINCT', 'Entdecken und anwenden', 'Doppelte Werte vermeiden: DISTINCT'],
  ['limit', 'Zeilen begrenzen: LIMIT', 'Verstehen und anwenden', 'Zeilen begrenzen: LIMIT'],
  ['fast', 'Für die Schnellen', 'Übertragen', 'Für die Schnellen'],
  ['quiz', 'Abschlussquiz', 'Sichern', 'Abschlussquiz und Zusammenfassung']
];
const FEEDBACK_LEVELS = ['success', 'partial', 'hint', 'error'];
const DESCRIPTION_LEVELS = ['high', 'medium', 'low', 'error'];
const DESCRIPTION_STATUSES = ['korrekt', 'teilweise korrekt', 'noch nicht korrekt'];
const YOUNGEST_KINDS = ['empty', 'correct', 'ageWrong', 'admin', 'oldest', 'wrong'];

const DESCRIPTION_TASKS = [
  {
    id: 'd-distinct', tab: 'distinct', tabLabel: 'Reiter 1', serverTaskId: 'inf9-db2-beschreibe-distinct',
    title: 'Einstieg – Anweisung beschreiben', prompt: '**Beschreibe**, welche Daten die Anweisung aus `users` ausgibt und was bei Dopplungen geschieht.',
    sql: 'SELECT DISTINCT city\nFROM users',
    hints: ['city ist die Spalte mit dem Wohnort.', 'Vergleiche in Gedanken zwei Mitglieder aus derselben Stadt: Wie oft soll diese Stadt im Ergebnis stehen?', 'DISTINCT entfernt gleiche Werte aus der Ergebnisrelation; die Tabelle users bleibt erhalten.'],
    aspects: ['Tabelle users als Datenquelle', 'Wohnorte/city als ausgewählte Daten', 'Jeder verschiedene Wohnort nur einmal in der Ergebnisrelation'],
    model: 'Die Abfrage zeigt aus users jeden unterschiedlichen Wohnort genau einmal. Doppelte Wohnorte fehlen nur in der Ergebnisrelation; users wird nicht verändert.',
    anchor: 'Prüfe die Datenquelle, die ausgewählte Spalte und die Wirkung von DISTINCT.',
    fallbacks: {
      korrekt: 'Korrekt: Du hast erklärt, dass Wohnorte aus users ausgegeben werden und jeder Wohnort nur einmal erscheint.',
      partial: 'Teilweise korrekt: Prüfe die Datenquelle, die ausgewählte Spalte und was DISTINCT bei gleichen Wohnorten bewirkt.',
      incorrect: 'Noch nicht korrekt: Vergleiche zwei Mitglieder aus demselben Wohnort und unterscheide Ergebnis und Tabelle.'
    }
  },
  {
    id: 'd-limit', tab: 'limit', tabLabel: 'Reiter 2', serverTaskId: 'inf9-db2-beschreibe-limit',
    title: 'Einstieg – Anweisung beschreiben', prompt: '**Beschreibe** in eigenen Worten, was diese Anweisung auswählt und wodurch die Reihenfolge entsteht.',
    sql: 'SELECT username\nFROM users\nORDER BY username\nLIMIT 3',
    hints: ['Welche Spalte steht hinter SELECT?', 'ORDER BY username ordnet die Benutzernamen; ohne Richtungsangabe gilt aufsteigend.', 'LIMIT 3 lässt nach dem Sortieren nur die ersten drei Ergebniszeilen stehen.'],
    aspects: ['username aus users als einzige Ausgabespalte', 'Alphabetisch/aufsteigend nach username sortiert', 'Danach nur die ersten drei Zeilen/Benutzernamen'],
    model: 'Die Abfrage ordnet die Benutzernamen aus users alphabetisch und zeigt davon die ersten drei.',
    anchor: 'Überlege, ob zuerst sortiert oder zuerst begrenzt wird.',
    fallbacks: {
      korrekt: 'Korrekt: Du hast die alphabetische Sortierung und die anschließende Begrenzung auf drei Benutzernamen richtig beschrieben.',
      partial: 'Teilweise korrekt: Prüfe noch, welche Spalte ausgegeben wird und ob zuerst sortiert oder begrenzt wird.',
      incorrect: 'Noch nicht korrekt: Lies SELECT, ORDER BY und LIMIT nacheinander und beschreibe die Wirkung jeder Klausel.'
    }
  }
];
const DESCRIPTION_BY_ID = new Map(DESCRIPTION_TASKS.map((item) => [item.id, item]));
const DESCRIPTION_BY_TAB = new Map(DESCRIPTION_TASKS.map((item) => [item.tab, item]));

// ---------------------------------------------------------------------------
// Einführung (Reiter 1)
// ---------------------------------------------------------------------------

const TEXT_NO_LIMIT_EXPECTED = (c) => `Teilweise korrekt: Deine Ergebnisrelation hat nur ${c.n} Zeilen, gesucht sind alle passenden Zeilen. Entferne LIMIT.`;
const TEXT_CITY_COLUMNS = (c) => `Noch nicht korrekt: Gesucht ist nur die Spalte mit den Wohnorten. Deine Ergebnisrelation enthält ${c.list}. Sieh im Tabellenschema nach, wie diese Spalte heißt.`;
const TEXT_ALL_MEMBERS_EXTRA = 'Statt * ist auch eine Spaltenauswahl richtig, die die Mitglieder erkennbar macht.';

function task(config) {
  return { projection: 'exact', columnOrder: true, requireAny: [], requireAll: [], requireDistinct: false, order: null, limit: null, initialSql: '', extra: [], ...config };
}

const TASKS = [
  task({
    id: 't7', number: 7, tab: 'distinct', prompt: 'Aus welchen unterschiedlichen Wohnorten stammen die Mitglieder? **Gib** jeden Wohnort nur einmal aus.',
    select: 'DISTINCT city', tail: 'FROM users', requireDistinct: true,
    texts: {
      ok: 'Korrekt: Die Mitglieder stammen aus 46 verschiedenen Wohnorten. Die 47. Zeile NULL ist kein Ort: Beim Konto admin ist kein Wohnort eingetragen.',
      cols: TEXT_CITY_COLUMNS,
      noDistinct: (c) => `Teilweise korrekt: Die Spalte stimmt. Deine Ergebnisrelation hat aber ${c.n} Zeilen, weil viele Wohnorte mehrfach vorkommen. Gesucht ist jeder Wohnort nur einmal – welches Schlüsselwort entfernt Dopplungen?`
    },
    hints: [
      'Der Wohnort steht in der Spalte city.',
      'Jeder Wohnort soll nur einmal vorkommen. Das Schlüsselwort dafür steht direkt hinter SELECT.',
      { sql: 'SELECT DISTINCT …\nFROM users', after: 'Ergänze die Spalte.' }
    ]
  }),
  task({
    id: 't8', number: 8, tab: 'distinct', prompt: '**Korrigiere** die gezeigte Anweisung, damit jedes Land nur einmal erscheint. **Gib** die vollständige korrigierte Anweisung neu ein.',
    correctionSql: 'SELECT name, country\nFROM users',
    select: 'DISTINCT country', tail: 'FROM users', requireDistinct: true,
    texts: {
      ok: 'Korrekt: DISTINCT country zeigt jedes Land nur einmal; die Tabelle users bleibt unverändert.',
      cols: (c) => (c.cols.includes('name')
        ? 'Noch nicht korrekt: Mit name erhältst du wieder eine Zeile pro Mitglied, weil fast jeder Name anders ist. Gesucht ist nur die Spalte mit den Ländern.'
        : `Noch nicht korrekt: Gesucht ist nur die Spalte mit den Ländern. Deine Ergebnisrelation enthält ${c.list}.`),
      noDistinct: () => 'Teilweise korrekt: Du gibst Länder aus, aber gleiche Länder erscheinen noch mehrfach. Prüfe die Spaltenauswahl und DISTINCT.'
    },
    hints: [
      'Es sollen Länder ausgegeben werden, keine Namen von Mitgliedern.',
      'Wenn name mit ausgewählt wird, können die Länder mehrfach im Ergebnis stehen.',
      'Wähle nur country und setze DISTINCT direkt hinter SELECT.'
    ]
  }),
  task({
    id: 't9', number: 9, tab: 'limit', prompt: '**Zeige** nur 3 Mitglieder an.',
    select: '*', tail: 'FROM users\nLIMIT 3', projection: 'anyThree', limit: 3,
    extra: ['Jede Abfrage, die genau drei Datensätze aus users ausgibt, ist richtig.'],
    texts: {
      ok: 'Korrekt: Deine Ergebnisrelation zeigt genau 3 Mitglieder. LIMIT 3 gibt die ersten drei Zeilen aus – welche das sind, hängt von der Reihenfolge ab.',
      distinct: () => 'Teilweise korrekt: Lass DISTINCT weg – gesucht sind drei Mitglieder, nicht drei verschiedene Werte.',
      noLimit: (c) => `Teilweise korrekt: Deine Ergebnisrelation hat ${c.n} Zeilen. Gesucht sind nur 3 Mitglieder. Mit welchem Schlüsselwort legst du fest, wie viele Zeilen ausgegeben werden?`
    },
    hints: [
      'Sieh in die Karte „Kurz erklärt“: Welches Schlüsselwort begrenzt die Anzahl der Zeilen?',
      'LIMIT steht am Ende der Abfrage, dahinter die Anzahl der Zeilen.',
      { sql: 'SELECT *\nFROM users\nLIMIT …', after: 'Ergänze die Anzahl.' }
    ]
  }),
  task({
    id: 't10', number: 10, tab: 'limit', prompt: '**Zeige** nur die 4 jüngsten Mitglieder an.',
    select: '*', tail: 'FROM users\nORDER BY birthday DESC\nLIMIT 4', projection: 'any', requireAny: ['username', 'name'],
    order: { column: 'birthday', dir: 'DESC' }, limit: 4, extra: [TEXT_ALL_MEMBERS_EXTRA],
    texts: {
      ok: 'Korrekt: Die vier jüngsten Mitglieder sind gartenlesemaus, gartencoderin, codekickemmi und modereiselio. Erst sortiert ORDER BY birthday DESC die spätesten Geburtsdaten nach oben, dann behält LIMIT 4 nur die ersten vier Zeilen.',
      cols: () => 'Noch nicht korrekt: Gesucht sind Mitglieder. Gib alle Spalten (SELECT *) aus oder mindestens den Benutzernamen oder den Namen.',
      noOrder: () => 'Teilweise korrekt: Du gibst 4 Mitglieder aus, aber nicht die jüngsten: Ohne Sortierung nimmt LIMIT einfach die ersten vier Zeilen der Tabelle. Sortiere vorher nach dem Geburtsdatum.',
      dir: () => 'Teilweise korrekt: Das sind die ältesten Mitglieder – und admin ohne Geburtsdatum (NULL). Aufsteigend sortiert stehen die frühesten Geburtsdaten oben. Die Jüngsten haben das späteste Datum: Welche Richtung brauchst du?',
      noLimit: (c) => `Teilweise korrekt: Die Sortierung stimmt – ganz oben stehen die jüngsten Mitglieder. Du gibst aber alle ${c.n} Zeilen aus. Begrenze die Ausgabe auf 4 Zeilen.`
    },
    hints: [
      'Du brauchst zwei Schritte: zuerst sortieren, dann die Anzahl der Zeilen begrenzen.',
      'Die Jüngsten haben das späteste Geburtsdatum. Sortiere so, dass es oben steht, und setze LIMIT ans Ende.',
      { sql: 'SELECT *\nFROM users\nORDER BY birthday …\nLIMIT …', after: 'Ergänze die Sortierrichtung und die Anzahl.' }
    ]
  }),
  task({
    id: 't12', number: 12, tab: 'fast', prompt: '**Gib** alle Wohnorte ohne Dopplungen in alphabetischer Reihenfolge aus.',
    select: 'DISTINCT city', tail: 'FROM users\nORDER BY city', requireDistinct: true, order: { column: 'city', dir: 'ASC' },
    texts: {
      ok: 'Korrekt: Jeder Wohnort steht genau einmal da, alphabetisch geordnet. NULL steht ganz oben, weil beim Konto admin kein Wohnort eingetragen ist.',
      cols: TEXT_CITY_COLUMNS,
      noDistinct: (c) => `Teilweise korrekt: Die Wohnorte sind sortiert, kommen aber mehrfach vor – deine Ergebnisrelation hat ${c.n} Zeilen. Welches Schlüsselwort entfernt Dopplungen?`,
      noOrder: () => 'Teilweise korrekt: Jeder Wohnort kommt nur einmal vor, aber die Liste ist noch nicht alphabetisch. Ergänze eine Sortierung.',
      dir: () => 'Teilweise korrekt: DESC sortiert von Z nach A. Alphabetisch heißt aufsteigend.'
    },
    hints: [
      'Du brauchst zwei Schlüsselwörter: eines gegen Dopplungen und eines zum Sortieren.',
      'DISTINCT steht direkt hinter SELECT, ORDER BY in einer eigenen Zeile am Ende.',
      { sql: 'SELECT DISTINCT city\nFROM users\nORDER BY …' }
    ]
  }),
  task({
    id: 't14', number: 14, tab: 'fast', prompt: '**Zeige** Benutzername und Größe der 4 größten Mitglieder an.',
    select: 'username, centimeters', tail: 'FROM users\nORDER BY centimeters DESC\nLIMIT 4', columnOrder: false,
    order: { column: 'centimeters', dir: 'DESC' }, limit: 4,
    texts: {
      ok: 'Korrekt: Die vier größten Mitglieder sind turmriese_max, frageriese, reiseriese_elias und wanderriese_taro – alle 195 cm groß. Bei gleicher Größe ist jede Reihenfolge richtig.',
      cols: (c) => `Noch nicht korrekt: Gesucht sind genau zwei Spalten: Benutzername und Größe. Deine Ergebnisrelation enthält ${c.list}.`,
      noOrder: () => 'Teilweise korrekt: Ohne Sortierung nimmt LIMIT einfach die ersten Zeilen der Tabelle. Sortiere vorher nach der Größe.',
      dir: () => 'Teilweise korrekt: Aufsteigend sortiert stehen admin ohne Größe (NULL) und die kleinsten Mitglieder oben. Die größten sollen oben stehen.',
      noLimit: (c) => `Teilweise korrekt: Die Sortierung stimmt, aber du gibst alle ${c.n} Zeilen aus. Gesucht sind nur die 4 größten.`
    },
    hints: [
      'Zuerst sortieren, dann die Anzahl begrenzen – wie bei den 4 jüngsten Mitgliedern in Aufgabe 10.',
      'Die Größe steht in centimeters. Die größte Zahl soll oben stehen.',
      { sql: 'SELECT username, centimeters\nFROM users\nORDER BY centimeters …\nLIMIT …' }
    ]
  }),
  task({
    id: 't15', number: 15, tab: 'fast', prompt: '**Korrigiere** die Anweisung, damit sie Benutzername und Geburtsdatum der 3 jüngsten Mitglieder ausgibt.',
    select: 'username, birthday', tail: 'FROM users\nORDER BY birthday DESC\nLIMIT 3', columnOrder: false,
    order: { column: 'birthday', dir: 'DESC' }, limit: 3,
    initialSql: 'SELECT username, birthday\nFROM users\nLIMIT 3\nORDER BY birthday',
    texts: {
      ok: 'Korrekt: LIMIT steht jetzt am Ende, und DESC holt die spätesten Geburtsdaten nach oben. Die drei jüngsten Mitglieder sind gartenlesemaus, gartencoderin und codekickemmi.',
      cols: (c) => `Noch nicht korrekt: Gesucht sind genau zwei Spalten: Benutzername und Geburtsdatum. Deine Ergebnisrelation enthält ${c.list}.`,
      noOrder: () => 'Teilweise korrekt: Ohne Sortierung nimmt LIMIT die ersten Zeilen der Tabelle. Sortiere vorher nach dem Geburtsdatum.',
      dir: () => 'Teilweise korrekt: Die Reihenfolge der Klauseln stimmt jetzt. Aufsteigend sortiert stehen aber admin ohne Geburtsdatum und die ältesten Mitglieder oben. Welche Richtung brauchst du für die jüngsten?',
      noLimit: (c) => `Teilweise korrekt: Die Sortierung stimmt, aber du gibst alle ${c.n} Zeilen aus. Gesucht sind nur die 3 jüngsten.`
    },
    hints: [
      'Die Anweisung enthält zwei Fehler. Führe sie einmal aus und lies die Rückmeldung.',
      'Ein Fehler betrifft die Reihenfolge der Klauseln, der andere die Sortierrichtung.',
      'LIMIT gehört ans Ende. Die Jüngsten haben das späteste Geburtsdatum – sortiere absteigend.'
    ]
  })
];
const TASK_BY_ID = new Map(TASKS.map((item) => [item.id, item]));
const TAB_TASKS = { distinct: ['t7', 't8'], limit: ['t9', 't10'], fast: ['t12', 't14', 't15'] };

const YOUNGEST = {
  username: 'gartenlesemaus',
  fullName: 'elena heidenkamp',
  birthYear: 2010,
  birthMonth: 7,
  birthDay: 7
};

// ---------------------------------------------------------------------------
// Abschlussquiz (Reiter 7)
// ---------------------------------------------------------------------------

// Optionen: [id, Text, richtig]; sql: true stellt den Text als SQL-Block dar.
const FINAL_QUIZ = [
  {
    id: 'q4', prompt: 'Was bewirkt diese Abfrage?', sql: 'SELECT DISTINCT city\nFROM users',
    hint: 'DISTINCT entfernt Dopplungen nur in der Ergebnisrelation. Jeder Wohnort erscheint einmal – egal, wie viele Mitglieder dort wohnen.',
    options: [
      ['a', 'Jeder Wohnort erscheint in der Ergebnisrelation nur einmal.', true],
      ['b', 'Doppelte Zeilen werden aus der Tabelle users gelöscht.', false],
      ['c', 'Es werden nur Mitglieder ausgegeben, deren Wohnort in der Tabelle nur einmal vorkommt.', false],
      ['d', 'Die Ergebnisrelation hat weniger Zeilen als die Tabelle users.', true]
    ]
  },
  {
    id: 'q-limit', prompt: 'Welche Aussagen zu LIMIT stimmen?',
    hint: 'LIMIT begrenzt nur die Ergebnisrelation; für eine bestimmte Reihenfolge brauchst du ORDER BY.',
    options: [
      ['a', '`LIMIT 3` gibt höchstens drei Ergebniszeilen aus.', true],
      ['b', 'Bei `ORDER BY birthday DESC` und `LIMIT 4` werden zuerst die Geburtstage sortiert und dann vier Zeilen ausgegeben.', true],
      ['c', '`LIMIT 3` löscht alle weiteren Zeilen aus `users`.', false],
      ['d', 'Ohne `ORDER BY` sind mit `LIMIT 3` immer die drei jüngsten Mitglieder gemeint.', false]
    ]
  },
  {
    id: 'q5', prompt: 'Du möchtest die 4 jüngsten Mitglieder anzeigen. Welche Abfrage ist richtig?',
    hint: 'LIMIT steht immer am Ende. Die Jüngsten haben das späteste Geburtsdatum, deshalb sortierst du absteigend.',
    options: [
      ['a', 'SELECT *\nFROM users\nORDER BY birthday DESC\nLIMIT 4', true, true],
      ['b', 'SELECT *\nFROM users\nLIMIT 4\nORDER BY birthday DESC', false, true],
      ['c', 'SELECT *\nFROM users\nORDER BY birthday\nLIMIT 4', false, true],
      ['d', 'SELECT *\nFROM users\nLIMIT 4', false, true]
    ]
  }
];
const QUIZ_BY_ID = new Map(FINAL_QUIZ.map((question) => [question.id, question]));

// ---------------------------------------------------------------------------
// Zustand und Speicherung
// ---------------------------------------------------------------------------

const state = { assessmentVersion: '20261029-criteria-v1', tab: 'distinct', answers: {}, feedback: {}, solved: {}, descriptionAnswers: {}, descriptionFeedback: {}, youngest: { username: '', age: '', feedback: null }, quiz: {}, quizFeedback: null, quizPassed: false };
const results = {}; // Ergebnisrelationen werden nicht gespeichert (zu groß).
const running = new Set();
const descriptionRequests = new Map();
let tabRevision = 0;
let database;
let databaseReady = false;

function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* Ohne Speicher bleibt das Modul bedienbar. */ }
}

function isPlainObject(value) { return Boolean(value) && typeof value === 'object' && !Array.isArray(value); }
function validFeedback(value) { return isPlainObject(value) && FEEDBACK_LEVELS.includes(value.level) && typeof value.text === 'string'; }
function validDescriptionFeedback(value) {
  return isPlainObject(value) && DESCRIPTION_LEVELS.includes(value.level) && typeof value.text === 'string' &&
    (value.points === undefined || (Number.isInteger(value.points) && value.points >= 0 && value.points <= 3)) &&
    (value.maxPoints === undefined || value.maxPoints === 3) &&
    (value.status === undefined || DESCRIPTION_STATUSES.includes(value.status)) &&
    (value.strengths === undefined || (Array.isArray(value.strengths) && value.strengths.every((text) => typeof text === 'string'))) &&
    (value.missing === undefined || (Array.isArray(value.missing) && value.missing.every((text) => typeof text === 'string')));
}

function restore() {
  const saved = readSplitProgress(STORAGE_KEY, MIGRATION_MARKER, 'select', TASKS, DESCRIPTION_TASKS, TABS, 0);
  if (!saved) return;
  if (TABS.some(([id]) => id === saved.tab)) state.tab = saved.tab;
  if (isPlainObject(saved.answers)) for (const [id, answer] of Object.entries(saved.answers)) if (TASK_BY_ID.has(id) && typeof answer === 'string') state.answers[id] = answer;
  if (isPlainObject(saved.feedback)) for (const [id, feedback] of Object.entries(saved.feedback)) if (TASK_BY_ID.has(id) && validFeedback(feedback)) state.feedback[id] = feedback;
  if (isPlainObject(saved.solved)) for (const [id, done] of Object.entries(saved.solved)) if (TASK_BY_ID.has(id) && done === true) state.solved[id] = true;
  if (isPlainObject(saved.descriptionAnswers)) for (const [id, answer] of Object.entries(saved.descriptionAnswers)) if (DESCRIPTION_BY_ID.has(id) && typeof answer === 'string') state.descriptionAnswers[id] = answer;
  if (saved.assessmentVersion === state.assessmentVersion && isPlainObject(saved.descriptionFeedback)) for (const [id, feedback] of Object.entries(saved.descriptionFeedback)) if (DESCRIPTION_BY_ID.has(id) && validDescriptionFeedback(feedback)) state.descriptionFeedback[id] = feedback;
  if (isPlainObject(saved.youngest)) {
    if (typeof saved.youngest.username === 'string') state.youngest.username = saved.youngest.username;
    if (typeof saved.youngest.age === 'string') state.youngest.age = saved.youngest.age;
    if (YOUNGEST_KINDS.includes(saved.youngest.feedback)) state.youngest.feedback = saved.youngest.feedback;
  }
  if (isPlainObject(saved.quiz)) FINAL_QUIZ.forEach((question) => { if (Array.isArray(saved.quiz[question.id])) state.quiz[question.id] = saved.quiz[question.id].filter((value) => question.options.some(([id]) => id === value)); });
  if (validFeedback(saved.quizFeedback)) state.quizFeedback = saved.quizFeedback;
  state.quizPassed = saved.quizPassed === true;
  if (typeof saved.solutionCode === 'string') state.solutionCode = saved.solutionCode;
  state.solutionUnlocked = saved.solutionUnlocked === true;
}

function isTabComplete(id) {
  if (id === 'intro') return false;
  if (id === 'quiz') return state.quizPassed;
  const done = TAB_TASKS[id].every((taskId) => state.solved[taskId]);
  const descriptionDone = DESCRIPTION_BY_TAB.has(id) && state.descriptionFeedback[DESCRIPTION_BY_TAB.get(id).id]?.status === 'korrekt' && state.descriptionFeedback[DESCRIPTION_BY_TAB.get(id).id]?.points === 3;
  return id === 'orderBy' ? done && descriptionDone && state.youngest.feedback === 'correct' : DESCRIPTION_BY_TAB.has(id) ? done && descriptionDone : done;
}

// ---------------------------------------------------------------------------
// DOM-Hilfen
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// SQL-Worker (nach SqlWorker in klasse-10/1-Datenbanken/sql-lab.js, angepasst: nur Modus users-full, CSV-Pfad relativ zu klasse-10)
// ---------------------------------------------------------------------------

class SqlWorker {
  constructor() { this.nextId = 0; this.pending = new Map(); }
  async init() {
    this.worker = new Worker(new URL('../../../../include/lib/sql.js/worker.sql-wasm.js', import.meta.url));
    this.worker.onmessage = (event) => { const pending = this.pending.get(event.data.id); if (!pending) return; this.pending.delete(event.data.id); if (event.data.error) pending.reject(new Error(event.data.error)); else pending.resolve(event.data); };
    this.worker.onerror = (event) => { this.pending.forEach(({ reject }) => reject(event.error || new Error('SQL-Worker nicht verfügbar.'))); this.pending.clear(); };
    await this.send({ action: 'open' });
    const response = await fetch(new URL('../../klasse-10/1-Datenbanken/users.csv', import.meta.url));
    if (!response.ok) throw new Error('users.csv konnte nicht geladen werden.');
    const [headers, ...data] = parseDelimited(await response.text());
    const schema = headers.map((name) => `${quoteIdentifier(name)} ${['id', 'centimeters', 'is_active'].includes(name) ? 'INTEGER' : 'TEXT'}`).join(', ');
    const statements = [`CREATE TABLE users (${schema})`];
    data.forEach((row) => statements.push(`INSERT INTO users (${headers.map(quoteIdentifier).join(', ')}) VALUES (${headers.map((header, index) => sqlValue(row[index], header)).join(', ')})`));
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
  if (['id', 'centimeters', 'is_active'].includes(header) && /^-?\d+(?:\.\d+)?$/.test(value)) return value;
  return `'${String(value).replaceAll("'", "''")}'`;
}

// Abfragen laufen nur lesend; Ergebnisse der Referenzabfragen werden zwischengespeichert.
const execCache = new Map();
async function cachedExec(sqlText) {
  if (!execCache.has(sqlText)) execCache.set(sqlText, await database.exec(sqlText));
  return execCache.get(sqlText);
}

// ---------------------------------------------------------------------------
// Lokale Analyse der Schülerabfrage (auf Basis von sqlTokens)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Fehler- und Ergebnisdiagnose
// ---------------------------------------------------------------------------

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
      if (quoteHint) return `${quoteHint}${englishHint}`;
      return `Noch nicht korrekt: Die Spalte ${name} hinter WHERE gibt es in users nicht. Prüfe den Spaltennamen oder den Textwert.${englishHint}`;
    }
    return `Noch nicht korrekt: Die Spalte ${name} hinter ${clause} gibt es in der Tabelle users nicht. Sieh im Tabellenschema nach, wie die Spalte heißt.${english ? ` Die Spaltennamen sind englisch – gemeint ist vermutlich ${english}.` : ''}`;
  }
  return 'Noch nicht korrekt: SQL versteht deine Abfrage nicht. Prüfe die Schreibweise der Schlüsselwörter, die Kommas zwischen den Spalten und die Reihenfolge der Klauseln.';
}

// nach valueKey und rowKey in klasse-10/1-Datenbanken/sql-lab-core.mjs (dort nicht exportiert)
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

function requireAnyOk(taskConfig, analysis) {
  if (!analysis.columns) return false;
  const has = (name) => analysis.columns.includes('*') || analysis.columns.includes(name);
  if (taskConfig.requireAny.length && !taskConfig.requireAny.some(has)) return false;
  return taskConfig.requireAll.every(has);
}

function projectedColumns(analysis) {
  return analysis.columns ? analysis.columns.flatMap((name) => name === '*' ? USER_COLUMN_NAMES : [name]) : null;
}

// Referenz je Aufgabe; bei projection 'any' wird sie mit der Spaltenliste der Schülerin oder des Schülers neu gebaut.
function referenceSql(taskConfig, analysis) {
  if (taskConfig.projection === 'any') return analysis.columns ? `SELECT ${analysis.columns.join(', ')}\n${taskConfig.tail}` : null;
  return `SELECT ${taskConfig.select}\n${taskConfig.tail}`;
}

async function isCorrect(taskConfig, analysis, actual) {
  if (taskConfig.projection === 'anyThree') {
    if (!analysis.columns || actual.values.length !== 3) return false;
    if (analysis.distinct && analysis.distinctToken) {
      const withoutDistinctSql = `${analysis.source.slice(0, analysis.distinctToken.start)}${analysis.source.slice(analysis.distinctToken.end)}`;
      const withoutDistinct = await cachedExec(withoutDistinctSql);
      if (!compareRelations(actual, withoutDistinct, { columnOrder: true, rowOrder: true }).correct) return false;
    }
    const full = await cachedExec(`SELECT ${analysis.columns.join(', ')}\nFROM users`);
    const counts = new Map();
    full.values.forEach((row) => counts.set(rowKey(row), (counts.get(rowKey(row)) || 0) + 1));
    return actual.values.every((row) => { const key = rowKey(row); const left = counts.get(key) || 0; if (!left) return false; counts.set(key, left - 1); return true; });
  }
  if (taskConfig.projection === 'any' && !requireAnyOk(taskConfig, analysis)) return false;
  const sql = referenceSql(taskConfig, analysis);
  if (!sql) return false;
  const reference = await cachedExec(sql);
  const options = { columnOrder: taskConfig.projection === 'any' ? true : taskConfig.columnOrder, columnLabels: false, rowOrder: false };
  if (!taskConfig.order) return compareRelations(actual, reference, options).correct;
  const actualIndex = projectedColumns(analysis)?.findIndex((column) => column.toLowerCase() === taskConfig.order.column.toLowerCase()) ?? -1;
  const referenceIndex = columnIndex(reference, taskConfig.order.column);
  if (actualIndex < 0 || referenceIndex < 0) return compareRelations(actual, reference, { ...options, rowOrder: true }).correct;
  // Bei Gleichstand zählt jede Reihenfolge: Nur die Folge der Sortierwerte muss übereinstimmen (NULL gleich NULL).
  if (!compareRelations(actual, reference, options).correct) return false;
  return actual.values.length === reference.values.length && actual.values.every((row, index) => row[actualIndex] === reference.values[index][referenceIndex]);
}

function actualColumnNames(analysis, actual) {
  const selected = projectedColumns(analysis);
  if (selected && (!actual.columns.length || selected.length === actual.columns.length)) return selected;
  if (actual.columns.length) return actual.columns;
  return [];
}

function rowCountText(count, limit) { return `Teilweise korrekt: Deine Ergebnisrelation hat ${count} Zeilen, gesucht sind genau ${limit}. Prüfe die Zahl hinter LIMIT.`; }

function relationSubset(actual, expected, actualNames, expectedNames) {
  if (!actualNames || !expectedNames || actualNames.length !== actual.columns.length || expectedNames.length !== expected.columns.length || !sameSet(actualNames, expectedNames)) return false;
  const key = (row, names) => JSON.stringify(names.map((name, index) => [name.toLowerCase(), valueKey(row[index])]).sort(([left], [right]) => left.localeCompare(right)));
  const counts = new Map();
  expected.values.forEach((row) => { const rowKey = key(row, expectedNames); counts.set(rowKey, (counts.get(rowKey) || 0) + 1); });
  return actual.values.every((row) => { const rowKey = key(row, actualNames); const remaining = counts.get(rowKey) || 0; if (!remaining) return false; counts.set(rowKey, remaining - 1); return true; });
}

function expectedColumnNames(taskConfig, analysis) {
  if (taskConfig.projection === 'any' || taskConfig.projection === 'anyThree') return projectedColumns(analysis);
  return taskConfig.select.replace(/^DISTINCT\s+/i, '').split(',').flatMap((name) => {
    const column = stripQuotes(name.trim()).toLowerCase();
    return column === '*' ? USER_COLUMN_NAMES : [column];
  });
}

function missingExpectedComma(taskConfig, analysis, columns) {
  const required = new Set(taskConfig.projection === 'any' ? [...taskConfig.requireAny, ...taskConfig.requireAll] : expectedColumnNames(taskConfig, analysis) || []);
  return analysis.implicitAliases.some(({ column, alias }) => required.has(column) && required.has(alias) && !columns.includes(alias));
}

async function distinctlessResult(analysis) {
  if (!analysis.distinct || !analysis.distinctToken) return null;
  const sql = `${analysis.source.slice(0, analysis.distinctToken.start)}${analysis.source.slice(analysis.distinctToken.end)}`;
  return cachedExec(sql);
}

async function evaluate(taskConfig, analysis, actual) {
  const names = actualColumnNames(analysis, actual);
  const context = { n: actual.values.length, count: names.length, cols: names.map((name) => name.toLowerCase()), list: names.join(', '), ist: analysis.orderBy[0]?.column };
  if (await isCorrect(taskConfig, analysis, actual)) return { level: 'success', text: taskConfig.texts.ok, solved: true };
  const fallback = { level: 'hint', text: 'Noch nicht korrekt: Vergleiche deine Ergebnisrelation mit der Aufgabe: Stimmen die Spalten, die Anzahl der Zeilen und ihre Reihenfolge?' };
  const partial = (text) => ({ level: 'partial', text });
  if (taskConfig.projection === 'anyThree') {
    if (!analysis.columns) return fallback;
    if (analysis.distinct) {
      const withoutDistinct = await distinctlessResult(analysis);
      if (withoutDistinct && !compareRelations(actual, withoutDistinct, { columnOrder: true, rowOrder: true }).correct) return partial(taskConfig.texts.distinct(context));
    }
    const full = await cachedExec(`SELECT ${analysis.columns.join(', ')}\nFROM users`);
    if (analysis.limit !== null && analysis.limit !== taskConfig.limit) return partial(rowCountText(context.n, taskConfig.limit));
    if (context.n === 0) return partial('Teilweise korrekt: Die Spalten passen, aber deine Abfrage liefert keine Zeilen. Prüfe, ob eine zusätzliche Bedingung alle Mitglieder ausschließt.');
    if (context.n !== taskConfig.limit) {
      if (analysis.limit !== null && analysis.limit !== taskConfig.limit) return partial(rowCountText(context.n, taskConfig.limit));
      if (analysis.limit === null && context.n > taskConfig.limit) return partial(taskConfig.texts.noLimit(context));
      return partial('Teilweise korrekt: Die Spalten passen, aber die ausgegebenen Zeilen stimmen noch nicht mit der Aufgabe überein. Prüfe zusätzliche Einschränkungen oder Zusammenfassungen.');
    }
    if (!relationSubset(actual, full, projectedColumns(analysis), projectedColumns(analysis))) return partial('Teilweise korrekt: Die Spalten passen, aber die ausgegebenen Zeilen stimmen noch nicht mit der Aufgabe überein. Prüfe zusätzliche Einschränkungen oder Zusammenfassungen.');
    return fallback;
  }
  if (taskConfig.projection === 'any' && !analysis.columns) return fallback;
  const reference = taskConfig.projection === 'any' ? null : await cachedExec(`SELECT ${taskConfig.select}\n${taskConfig.tail}`);
  const expected = taskConfig.projection === 'any' ? await cachedExec(referenceSql(taskConfig, analysis)) : reference;
  const selected = projectedColumns(analysis);
  const expectedNames = expectedColumnNames(taskConfig, analysis);
  const columnsWrong = taskConfig.projection === 'any' ? !requireAnyOk(taskConfig, analysis) : !sameMultiset(context.cols, expectedNames || []);
  if (analysis.implicitAliases.length && missingExpectedComma(taskConfig, analysis, context.cols)) {
    return { level: 'hint', text: 'Noch nicht korrekt: Zwischen zwei gewünschten Spalten fehlt ein Komma. SQL liest das zweite Wort sonst als Alias der ersten Spalte.' };
  }
  if (columnsWrong) return { level: 'hint', text: taskConfig.texts.cols(context) };
  if (taskConfig.limit === null && analysis.limit !== null) return partial(TEXT_NO_LIMIT_EXPECTED(context));
  if (context.n === 0) return partial('Teilweise korrekt: Die Spalten passen, aber deine Abfrage liefert keine Zeilen. Prüfe, ob eine zusätzliche Bedingung alle Mitglieder ausschließt.');
  const rowsMatch = compareRelations(actual, expected, { columnOrder: taskConfig.projection === 'any' ? true : taskConfig.columnOrder, columnLabels: false, rowOrder: false }).correct;
  const isSubset = relationSubset(actual, expected, selected, expectedNames);
  if (taskConfig.requireDistinct && !analysis.distinct) {
    const hasDuplicates = actual.values.some((row, index) => actual.values.slice(0, index).some((other) => rowKey(row) === rowKey(other)));
    if (hasDuplicates) return partial(taskConfig.texts.noDistinct(context));
  }
  if (!taskConfig.requireDistinct && analysis.distinct) {
    const withoutDistinct = await distinctlessResult(analysis);
    if (withoutDistinct && compareRelations(withoutDistinct, expected, { columnOrder: taskConfig.projection === 'any' ? true : taskConfig.columnOrder, columnLabels: false, rowOrder: false }).correct) {
      return partial('Teilweise korrekt: Die Spalten stimmen. DISTINCT entfernt aber Zeilen, die hier gebraucht werden – gesucht sind alle Mitglieder, nicht nur verschiedene Werte. Lass DISTINCT weg.');
    }
  }
  if (!rowsMatch && isSubset && taskConfig.limit === null && analysis.limit !== null) return partial(TEXT_NO_LIMIT_EXPECTED(context));
  if (!rowsMatch && taskConfig.limit !== null && context.n !== taskConfig.limit) {
    if (analysis.limit === null && (taskConfig.order && analysis.orderBy[0]?.column === taskConfig.order.column && analysis.orderBy[0]?.dir === taskConfig.order.dir)) return partial(taskConfig.texts.noLimit(context));
    if (analysis.limit !== null && analysis.limit !== taskConfig.limit) return partial(rowCountText(context.n, taskConfig.limit));
  }
  if (!rowsMatch && isSubset) {
    if (context.n < expected.values.length && ['t1', 't2', 't3', 't4', 't5', 't6', 't11', 't13'].includes(taskConfig.id)) {
      if (taskConfig.limit !== null && analysis.limit !== null && analysis.limit !== taskConfig.limit) return partial(rowCountText(context.n, taskConfig.limit));
      return partial('Teilweise korrekt: Die Spalten passen, aber es fehlen Mitglieder. Prüfe, ob deine Abfrage die Zeilen unnötig einschränkt.');
    }
    return partial('Teilweise korrekt: Die Spalten passen, aber die ausgegebenen Zeilen stimmen noch nicht mit der Aufgabe überein. Prüfe zusätzliche Einschränkungen oder Zusammenfassungen.');
  }
  if (!rowsMatch && taskConfig.limit !== null && context.n !== taskConfig.limit && analysis.limit !== null && analysis.limit !== taskConfig.limit) return partial(rowCountText(context.n, taskConfig.limit));
  if (taskConfig.order) {
    const first = analysis.orderBy[0];
    if (!first) return partial(taskConfig.texts.noOrder(context));
    if (first.quoted) return partial("Teilweise korrekt: Hinter ORDER BY steht ein Textwert. Sortiere nach der Spalte ohne einfache Anführungszeichen.");
    if (first.column !== taskConfig.order.column) return partial(taskConfig.texts.wrongCol ? taskConfig.texts.wrongCol(context) : `Teilweise korrekt: Du sortierst nach ${first.column}. Die Aufgabe verlangt eine Sortierung nach ${taskConfig.order.column}. Prüfe die Spalte hinter ORDER BY.`);
    if (first.dir !== taskConfig.order.dir) return partial(taskConfig.texts.dir(context));
  }
  if (taskConfig.limit !== null) {
    if (analysis.limit === null) return partial(taskConfig.texts.noLimit(context));
    if (context.n !== taskConfig.limit) return partial(rowCountText(context.n, taskConfig.limit));
  } else if (analysis.limit !== null) return partial(TEXT_NO_LIMIT_EXPECTED(context));
  if (!rowsMatch) return partial('Teilweise korrekt: Die Spalten passen, aber die ausgegebenen Zeilen stimmen noch nicht mit der Aufgabe überein. Prüfe zusätzliche Einschränkungen oder Zusammenfassungen.');
  return fallback;
}

// ---------------------------------------------------------------------------
// Ausführen und Anzeigen einer SQL-Aufgabe
// ---------------------------------------------------------------------------

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
  const check = validateSelectStatement(sqlText);
  if (!check.ok) { applyFeedback(taskConfig, 'hint', check.message); return; }
  if (!databaseReady) { applyFeedback(taskConfig, 'hint', 'Warte bitte, bis die Tabelle users vollständig geladen ist.', { persist: false }); return; }
  running.add(taskConfig.id);
  if (auto) renderTaskOutput(taskConfig);
  else applyFeedback(taskConfig, 'hint', 'Die Abfrage wird ausgeführt …', { persist: false });
  try {
    const actual = await database.exec(check.sql);
    const verdict = await evaluate(taskConfig, analyzeQuery(check.sql), actual);
    if ((state.answers[taskConfig.id] || '') === sqlText) applyFeedback(taskConfig, verdict.level, verdict.text, { solved: verdict.solved === true, relation: actual });
  } catch (error) {
    if ((state.answers[taskConfig.id] || '') === sqlText) applyFeedback(taskConfig, 'error', diagnoseError(error, check.sql));
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
  if (!relation.values.length) { shell.append(element('p', 'empty-result', 'Die Abfrage ist gültig, liefert aber keine Datensätze.')); return shell; }
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
    state.descriptionFeedback[task.id] = { level: 'error', text: 'Der Auswertungsserver ist nicht korrekt eingerichtet.' };
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
    state.descriptionFeedback[task.id] = { level: 'error', text: error.message || 'Die Auswertung konnte nicht abgeschlossen werden. Bitte versuche es erneut.' };
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
  input.value = hasSavedAnswer ? state.answers[taskConfig.id] : (taskConfig.correctionSql ? '' : taskConfig.initialSql);
  if (!hasSavedAnswer && taskConfig.initialSql) { state.answers[taskConfig.id] = taskConfig.initialSql; save(); }
  const resetOutput = () => {
    const wasSolved = Boolean(state.solved[taskConfig.id]);
    delete state.feedback[taskConfig.id]; delete state.solved[taskConfig.id]; delete results[taskConfig.id];
    save(); renderTaskOutput(taskConfig);
    if (wasSolved) updateTabMarks();
  };
  input.addEventListener('input', () => { state.answers[taskConfig.id] = input.value; resetOutput(); });
  input.addEventListener('keydown', (event) => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); runTask(taskConfig); } });
  if (taskConfig.correctionSql) card.append(element('p', 'sql-label', 'Fehlerhafte Anweisung'), sqlBlock(taskConfig.correctionSql));
  card.append(label, input);
  appendHints(card, taskConfig.hints);
  const actions = element('div', 'action-row');
  const run = element('button', 'primary-button sql9-run', 'Abfrage ausführen und prüfen'); run.type = 'button'; run.disabled = !databaseReady;
  run.addEventListener('click', () => runTask(taskConfig));
  actions.append(run);
  if (taskConfig.initialSql && !taskConfig.correctionSql) {
    const reset = element('button', 'secondary-button', 'Ursprungsanweisung wiederherstellen'); reset.type = 'button';
    reset.addEventListener('click', () => { input.value = taskConfig.initialSql; state.answers[taskConfig.id] = taskConfig.initialSql; resetOutput(); input.focus(); });
    actions.append(reset);
  }
  actions.append(element('span', 'shortcut-hint', 'Strg/Cmd + Enter'));
  card.append(actions);
  const output = element('div', 'sql9-task-output');
  const feedback = element('p', 'feedback sql-feedback'); feedback.setAttribute('aria-live', 'polite');
  output.append(feedback, element('div', 'sql9-relation-slot'));
  card.append(output);
  if (taskConfig.id === 't6') card.append(renderYoungest());
  return card;
}

// ---------------------------------------------------------------------------
// Zusatzteil Aufgabe 6: jüngstes Mitglied
// ---------------------------------------------------------------------------

function youngestAge() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const before = month < YOUNGEST.birthMonth || (month === YOUNGEST.birthMonth && now.getDate() < YOUNGEST.birthDay);
  return now.getFullYear() - YOUNGEST.birthYear - (before ? 1 : 0);
}
function normalizeName(value) { return value.trim().toLowerCase().replace(/^@+/, '').replace(/\s+/g, ' ').trim(); }
function youngestFeedback(kind) {
  const texts = {
    empty: ['hint', 'Noch nicht korrekt: Fülle beide Felder aus.'],
    correct: ['success', `Korrekt: Das jüngste Mitglied ist gartenlesemaus (Elena Heidenkamp), geboren am 7. Juli 2010. Heute ist sie ${youngestAge()} Jahre alt. Bei aufsteigender Sortierung steht sie ganz unten, weil sie das späteste Geburtsdatum hat.`],
    ageWrong: ['partial', 'Teilweise korrekt: Das Mitglied stimmt. Prüfe das Alter: Wie viele Jahre liegen zwischen dem 7. Juli 2010 und heute? Achte darauf, ob der Geburtstag in diesem Jahr schon war.'],
    admin: ['hint', 'Noch nicht korrekt: admin steht zwar ganz oben, hat aber kein Geburtsdatum (NULL). Bei aufsteigender Sortierung steht das jüngste Mitglied am Ende der Liste.'],
    oldest: ['hint', 'Noch nicht korrekt: zornigeracket ist das älteste Mitglied mit Geburtsdatum. Je jünger ein Mitglied ist, desto später ist sein Geburtsdatum – bei aufsteigender Sortierung steht es ganz unten.'],
    wrong: ['hint', 'Noch nicht korrekt: Das ist nicht das jüngste Mitglied. Scrolle in deiner sortierten Ergebnisrelation bis ganz nach unten: Dort steht das späteste Geburtsdatum.']
  };
  return texts[kind];
}
function classifyYoungest() {
  const name = normalizeName(state.youngest.username);
  const age = state.youngest.age.trim();
  if (!name || !age) return 'empty';
  if (name === YOUNGEST.username || name === YOUNGEST.fullName) return /^\d+$/.test(age) && Number(age) === youngestAge() ? 'correct' : 'ageWrong';
  if (name === 'admin') return 'admin';
  if (name === 'zornigeracket') return 'oldest';
  return 'wrong';
}
function renderYoungestFeedback(box) {
  const entry = state.youngest.feedback ? youngestFeedback(state.youngest.feedback) : null;
  box.className = `feedback ${entry ? entry[0] : ''} sql9-youngest-feedback`;
  box.textContent = entry ? entry[1] : '';
}
function renderYoungest() {
  const wrapper = element('div', 'sql9-youngest');
  wrapper.append(paragraph('**Gib** an, wer das jüngste Mitglied ist und wie alt es heute ist.'));
  const feedback = element('p', 'feedback sql9-youngest-feedback'); feedback.setAttribute('aria-live', 'polite');
  const clearFeedback = () => { const hadCorrect = state.youngest.feedback === 'correct'; state.youngest.feedback = null; save(); renderYoungestFeedback(feedback); if (hadCorrect) updateTabMarks(); };
  [['youngest-name', 'Benutzername des jüngsten Mitglieds', 'username', null], ['youngest-age', 'Alter heute (in Jahren)', 'age', 'numeric']].forEach(([id, text, key, mode]) => {
    const row = element('div', 'gap-row');
    const label = element('label', '', text); label.htmlFor = id;
    const input = document.createElement('input'); input.id = id; input.className = 'gap-input'; input.type = 'text'; input.autocomplete = 'off'; input.spellcheck = false;
    if (mode) input.inputMode = mode;
    input.value = state.youngest[key];
    input.addEventListener('input', () => { state.youngest[key] = input.value; clearFeedback(); });
    row.append(label, input); wrapper.append(row);
  });
  const actions = element('div', 'action-row');
  const check = element('button', 'primary-button', 'Antwort prüfen'); check.type = 'button';
  check.addEventListener('click', () => { state.youngest.feedback = classifyYoungest(); save(); renderYoungestFeedback(feedback); updateTabMarks(); });
  actions.append(check); wrapper.append(actions, feedback);
  renderYoungestFeedback(feedback);
  return wrapper;
}

// ---------------------------------------------------------------------------
// Tabs und Seitenaufbau
// ---------------------------------------------------------------------------

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
  if (state.tab !== 'intro' && state.tab !== 'quiz') panel.append(schemaCard(USERS_TABLE_SCHEMAS));
  panel.append(stepHeading(state.tab));
  if (state.tab === 'quiz') renderQuiz(panel);
  else renderTaskTab(panel);
  renderTabFlowNavigation(panel, { items: TABS.map(([id, label]) => ({ id, label })), currentId: state.tab, onNavigate: activateTab });
  if (focusContent) focusTabPanelStart(panel);
}

// ---------------------------------------------------------------------------
// Reiter 2 bis 6
// ---------------------------------------------------------------------------

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

function orderByCard() {
  const card = explainCard('Kurz erklärt: Sortieren mit ORDER BY');
  card.append(
    element('p', '', 'Die Werbekunden möchten Listen, die nach Namen, Größe oder Alter geordnet sind. Dafür hängst du ORDER BY an die Abfrage an.'),
    sqlBlock('SELECT Spalte1, Spalte2, …\nFROM Tabellenname\nORDER BY Spaltenname [ASC | DESC]')
  );
  const list = element('dl', 'aggregate-list');
  [['ASC', 'aufsteigend: A bis Z, klein nach groß, früh nach spät'], ['DESC', 'absteigend: Z bis A, groß nach klein, spät nach früh'], ['[ ] und |', 'Eckige Klammern bedeuten: kann weggelassen werden. | bedeutet: oder. Ohne Angabe gilt ASC.']]
    .forEach(([term, meaning]) => list.append(element('dt', '', term), element('dd', '', meaning)));
  card.append(list);
  const row = element('div', 'sql9-example-row sql9-example-row-three');
  const columns = ['username', 'centimeters'];
  row.append(
    exampleTable('ohne ORDER BY', columns, [['zornigerfotograf', '168'], ['wanderwut_finn', '183'], ['bergcoder', '174']]),
    exampleTable('ORDER BY centimeters', columns, [['zornigerfotograf', '168'], ['bergcoder', '174'], ['wanderwut_finn', '183']]),
    exampleTable('ORDER BY centimeters DESC', columns, [['wanderwut_finn', '183'], ['bergcoder', '174'], ['zornigerfotograf', '168']])
  );
  card.append(row, paragraph('**NULL** bedeutet: In diesem Feld ist kein Wert eingetragen. Beim Sortieren mit ASC steht NULL ganz oben, mit DESC ganz unten.'));
  return card;
}

function distinctCard() {
  const card = explainCard('Kurz erklärt: Doppelte Werte vermeiden mit DISTINCT');
  card.append(
    element('p', '', 'Die Werbekunden fragen: Aus welchen Orten und Ländern kommen unsere Mitglieder? In einer Spalte kommen oft viele gleiche Werte vor. Mit DISTINCT direkt hinter SELECT wird jeder Wert nur einmal ausgegeben.'),
    sqlBlock('SELECT DISTINCT Spalte1, Spalte2, …\nFROM Tabellenname')
  );
  const row = element('div', 'sql9-example-row sql9-example-row-two');
  const left = element('div', 'sql9-example'); left.append(sqlBlock('SELECT gender\nFROM users'), exampleTable('Ergebnisrelation ohne DISTINCT', ['gender'], [['male'], ['male'], ['male'], ['male'], ['male'], ['male'], ['…']]), element('p', 'sql9-example-count', '317 Zeilen'));
  const right = element('div', 'sql9-example'); right.append(sqlBlock('SELECT DISTINCT gender\nFROM users'), exampleTable('Ergebnisrelation mit DISTINCT', ['gender'], [['male'], ['female'], ['diverse'], ['NULL']]), element('p', 'sql9-example-count', '4 Zeilen'));
  row.append(left, right);
  card.insertBefore(row, card.children[1]); card.append(element('p', '', 'DISTINCT verändert die Tabelle users nicht. Es entfernt die Dopplungen nur in der Ergebnisrelation. NULL erscheint als eigener Wert: Beim Konto admin ist kein Geschlecht eingetragen.'));
  return card;
}

function limitCard() {
  const card = explainCard('Kurz erklärt: Zeilen begrenzen mit LIMIT');
  card.append(
    element('p', '', 'Für eine Vorschau auf dem Handy reichen den Werbekunden wenige Zeilen. Bei einem langsamen Netz dauert es außerdem, bis alle 317 Mitglieder angezeigt werden. Mit LIMIT legst du fest, wie viele Zeilen höchstens ausgegeben werden.'),
    sqlBlock('SELECT username\nFROM users\nLIMIT 25'),
    element('p', '', 'Diese Abfrage zeigt die ersten 25 Benutzernamen. LIMIT steht immer am Ende der Abfrage – auch hinter ORDER BY:'),
    sqlBlock('SELECT …\nFROM …\nORDER BY …\nLIMIT …')
  );
  const row = element('div', 'sql9-example-row sql9-example-row-two');
  const columns = ['username', 'birthday'];
  const sorted = [
    ['gartenlesemaus', '2010-07-07'],
    ['gartencoderin', '2010-06-28'],
    ['codekickemmi', '2010-06-22'],
    ['modereiselio', '2010-06-15'],
    ['pixelprins', '2010-06-14']
  ];
  const before = element('div', 'sql9-example');
  before.append(
    sqlBlock('SELECT username, birthday\nFROM users\nORDER BY birthday DESC'),
    exampleTable('Ergebnisrelation ohne LIMIT', columns, [...sorted, ['…', '…']]),
    element('p', 'sql9-example-count', '317 Zeilen')
  );
  const after = element('div', 'sql9-example');
  after.append(
    sqlBlock('SELECT username, birthday\nFROM users\nORDER BY birthday DESC\nLIMIT 4'),
    exampleTable('Ergebnisrelation mit LIMIT 4', columns, sorted.slice(0, 4)),
    element('p', 'sql9-example-count', '4 Zeilen')
  );
  row.append(before, after);
  card.insertBefore(row, card.children[1]);
  return card;
}

function renderTaskTab(panel) {
  const introCard = {
    projection: () => { const card = element('div', 'scenario-card'); card.append(paragraph('Im InstaHub-Datenbanklabor fragst du eine echte Tabelle `users` mit 317 Mitgliedern ab. Die Daten stimmen nicht mit deinem eigenen InstaHub überein.'), paragraph('**Tippe** deine Abfrage ein und **klicke** auf „Abfrage ausführen und prüfen“. Darunter erscheint die Ergebnisrelation deiner Abfrage.')); return card; },
    orderBy: orderByCard,
    distinct: distinctCard,
    limit: limitCard,
    fast: () => element('div', 'scenario-card')
  }[state.tab];
  const descriptionTask = DESCRIPTION_BY_TAB.get(state.tab);
  if (state.tab === 'distinct') panel.append(paragraph('Zwei Mitglieder können denselben Wohnort haben. Untersuche, wie du jeden Wohnort einmal ausgibst und anschließend die Anzahl der Ergebniszeilen begrenzt.'));
  if (state.tab === 'distinct' || state.tab === 'limit') panel.append(introCard());
  if (descriptionTask) panel.append(renderDescriptionTask(descriptionTask));
  if (state.tab !== 'fast' && state.tab !== 'distinct' && state.tab !== 'limit') panel.append(introCard());
  TAB_TASKS[state.tab].forEach((id) => { const taskConfig = TASK_BY_ID.get(id); panel.append(renderTask(taskConfig)); renderTaskOutput(taskConfig); });
}

// ---------------------------------------------------------------------------
// Reiter 1 – Einführung (Design nach klasse-11/1-Kuenstliche-Intelligenz/aufgabe3.html, #split-intro)
// ---------------------------------------------------------------------------

function quizSelection(question) { return Array.isArray(state.quiz[question.id]) ? state.quiz[question.id] : []; }

function renderQuiz(panel) {
  const card = element('section', 'task-card sql-task');
  card.append(element('h3', '', 'Abschlussquiz'), paragraph('**Kreuze** alle richtigen Antworten an. Bei manchen Fragen sind mehrere Antworten richtig.'));
  const form = element('form', 'final-quiz'); form.id = 'final-quiz'; form.noValidate = true;
  const feedback = element('p', 'feedback sql-quiz-feedback'); feedback.setAttribute('aria-live', 'polite');
  const showFeedback = () => { feedback.className = `feedback ${state.quizFeedback ? state.quizFeedback.level : ''} sql-quiz-feedback`; feedback.textContent = state.quizFeedback ? state.quizFeedback.text : ''; };
  // nach renderFinalQuiz in klasse-10/1-Datenbanken/sql-lab.js, angepasst: SQL-Blöcke in Frage und Antwort, Rückmeldung als dauerhafter aria-live-Bereich
  FINAL_QUIZ.forEach((question, index) => {
    const field = document.createElement('fieldset'); const legend = document.createElement('legend');
    legend.append(element('span', '', String(index + 1)), document.createTextNode(question.prompt)); field.append(legend);
    if (question.sql) field.append(sqlBlock(question.sql));
    const choices = element('div', 'choice-list');
    question.options.forEach(([id, text, , isSql]) => {
      const label = element('label', 'choice-option'); const input = document.createElement('input');
      input.type = 'checkbox'; input.name = `sql9-final-${question.id}`; input.value = id; input.checked = quizSelection(question).includes(id);
      input.addEventListener('change', () => {
        const selected = quizSelection(question).filter((value) => value !== id);
        state.quiz[question.id] = input.checked ? [...selected, id] : selected;
        state.quizFeedback = null; state.quizPassed = false; save(); showFeedback(); refreshOverview(); updateTabMarks();
      });
      const content = element('span'); if (isSql) content.append(element('code', 'quiz-sql', text)); else richText(content, text);
      label.append(input, content); choices.append(label);
    });
    field.append(choices); form.append(field);
  });
  const actions = element('div', 'action-row'); const submit = element('button', 'primary-button', 'Quiz prüfen'); submit.type = 'submit'; actions.append(submit); form.append(actions, feedback);
  const overviewSlot = element('div', 'sql9-overview-slot');
  const refreshOverview = () => { overviewSlot.replaceChildren(); if (state.quizPassed) overviewSlot.append(renderOverview()); };
  form.addEventListener('submit', (event) => { event.preventDefault(); checkQuiz(); showFeedback(); refreshOverview(); updateTabMarks(); });
  // Jede Quizfrage lässt sich zusätzlich einzeln prüfen (../quiz-fragen-pruefen.js).
  window.addQuizQuestionChecks?.({
    questions: FINAL_QUIZ.map((question, index) => ({
      fieldset: form.querySelectorAll('fieldset')[index],
      solution: question.options.filter(([, , right]) => right).map(([id]) => id),
      hint: question.hint,
      check: question.id === 'q-limit' ? () => { const selected = new Set(quizSelection(question)); const correct = question.options.every(([id, , right]) => selected.has(id) === right); const some = question.options.some(([id, , right]) => right && selected.has(id)); return { result: correct ? 'correct' : some ? 'mixed' : 'wrong', text: correct ? 'Korrekt: Beide Wirkungen von LIMIT sind richtig markiert.' : some ? 'Teilweise korrekt: Prüfe noch die Reihenfolge von ORDER BY und LIMIT.' : 'Noch nicht korrekt: LIMIT begrenzt nur die Ergebniszeilen und verändert `users` nicht.' }; } : undefined,
    })),
    buttonClass: 'primary-button',
    rowClass: 'action-row',
    levels: { high: 'success', medium: 'partial', low: 'hint' },
    onAllCorrect: () => form.requestSubmit(),
  });
  card.append(form); panel.append(card, overviewSlot, renderSummary());
  appendSolutionDownloadFromTemplate(panel);
  bindSolutionCodePersistence(panel, state, save);
  showFeedback(); refreshOverview();
}

function checkQuiz() {
  const correct = FINAL_QUIZ.map((question) => {
    const chosen = new Set(quizSelection(question));
    return question.options.every(([id, , right]) => chosen.has(id) === right);
  });
  const amount = correct.filter(Boolean).length;
  state.quizPassed = amount === FINAL_QUIZ.length;
  state.quizFeedback = state.quizPassed
    ? { level: 'success', text: 'Korrekt: Alle Fragen stimmen. Unten findest du jetzt die Übersicht über die Aufgaben mit Lösungen.' }
    : amount > 0
      ? { level: 'partial', text: `Teilweise korrekt: ${amount} von ${FINAL_QUIZ.length} Fragen stimmen. Prüfe die übrigen Fragen erneut.` }
      : { level: 'hint', text: 'Noch nicht korrekt: Prüfe die Fragen mit den Hinweisen direkt darunter.' };
  save();
}
function renderOverview() {
  const overview = element('section', 'short-summary sql-quiz-overview'); overview.setAttribute('aria-labelledby', 'sql9-overview-title');
  const title = element('h3', '', 'Übersicht: alle Aufgaben mit Lösung'); title.id = 'sql9-overview-title'; overview.append(title);
  const list = document.createElement('ol');
  DESCRIPTION_TASKS.forEach((task) => {
    const item = document.createElement('li');
    item.append(element('strong', '', `${task.tabLabel}: ${task.title}. `)); richText(item, task.prompt);
    item.append(sqlBlock(task.sql), element('p', '', `Musterbeschreibung: ${task.model}`));
    list.append(item);
  });
  TASKS.forEach((taskConfig) => {
    const item = document.createElement('li');
    item.append(element('strong', '', `Aufgabe ${TASKS.indexOf(taskConfig) + 1}: `)); richText(item, taskConfig.prompt);
    if (taskConfig.correctionSql) item.append(element('p', '', 'Fehlerhafte Anweisung:'), sqlBlock(taskConfig.correctionSql));
    item.append(element('p', '', taskConfig.correctionSql ? 'Korrigierte Anweisung:' : 'Lösung:'), sqlBlock(`SELECT ${taskConfig.select}\n${taskConfig.tail}`));
    taskConfig.extra.forEach((line) => {
      if (line === 'youngest') item.append(element('p', '', `Jüngstes Mitglied: gartenlesemaus (Elena Heidenkamp), geboren am 7. Juli 2010, heute ${youngestAge()} Jahre alt.`));
      else item.append(element('p', '', line));
    });
    list.append(item);
  });
  const quizItem = document.createElement('li'); quizItem.append(element('strong', '', 'Abschlussquiz'));
  const questions = document.createElement('ol');
  FINAL_QUIZ.forEach((question) => {
    const entry = document.createElement('li'); entry.append(element('strong', '', question.prompt));
    if (question.sql) entry.append(sqlBlock(question.sql));
    const answers = document.createElement('ul');
    question.options.filter(([, , right]) => right).forEach(([, text, , isSql]) => { const answer = document.createElement('li'); if (isSql) answer.append(element('code', 'quiz-sql', text)); else richText(answer, text); answers.append(answer); });
    entry.append(answers); questions.append(entry);
  });
  quizItem.append(questions); list.append(quizItem);
  overview.append(list);
  return overview;
}

function renderSummary() {
  const summary = element('section', 'short-summary');
  summary.setAttribute('aria-labelledby', 'sql9-summary-title');
  const title = element('h3', '', 'Merke'); title.id = 'sql9-summary-title';
  summary.append(title, paragraph('DISTINCT steht direkt hinter SELECT und zeigt gleiche Werte in der Ergebnisrelation nur einmal. LIMIT begrenzt die Anzahl der Ergebniszeilen und steht am Ende. Soll eine bestimmte Auswahl zuerst erscheinen, sortiere mit ORDER BY vor LIMIT. Die gespeicherte Tabelle bleibt unverändert.'));
  return summary;
}
async function rerunSavedTasks() {
  for (const taskConfig of TASKS) if (state.feedback[taskConfig.id]) await runTask(taskConfig, { auto: true });
}

async function init() {
  restore();
  render();
  document.getElementById('reset-module').addEventListener('click', () => {
    if (window.confirm('Möchtest du alle SQL-Eingaben und den Fortschritt dieser Aufgabe zurücksetzen?')) {
      try { localStorage.setItem(MIGRATION_MARKER, 'done'); localStorage.removeItem(STORAGE_KEY); } catch { /* Ohne Speicher weiter nutzbar. */ }
      location.reload();
    }
  });
  window.addEventListener('beforeunload', () => database?.close());
  const status = document.getElementById('data-status');
  try {
    database = new SqlWorker();
    await database.init();
    databaseReady = true;
    status.textContent = 'Die Tabelle users ist geladen. Du kannst SQL-Abfragen ausführen.'; status.className = 'feedback success'; status.setAttribute('aria-busy', 'false');
    document.querySelectorAll('.sql9-run').forEach((button) => { button.disabled = false; });
    await rerunSavedTasks();
  } catch (error) {
    status.textContent = 'Die Übungsdaten konnten nicht geladen werden. Bitte lade die Seite neu.'; status.className = 'feedback error'; status.setAttribute('aria-busy', 'false');
    console.error(error);
  }
}
document.addEventListener('DOMContentLoaded', init);
