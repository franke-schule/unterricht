// Aufgabe 2 – Erste SQL-Abfragen (Informatik 9).
// Seitengerüst nach klasse-9/2-Datenbanken/aufgabe1.js, SQL-Labor nach klasse-10/1-Datenbanken/sql-lab.js.
import { compareRelations, normalizeRelation, parseDelimited, sqlTokens, validateSelectStatement } from '../../klasse-10/1-Datenbanken/sql-lab-core.mjs?v=20260929b';
import { enableTabKeyboardNavigation, focusTabPanelStart, renderTabFlowNavigation, syncTabSemantics } from '../../klasse-10/1-Datenbanken/tab-navigation.mjs?v=20260906a';

const STORAGE_KEY = 'informatik9-datenbanken-aufgabe2-v1';
const NEUTRAL_SQL_PLACEHOLDER = 'SELECT ...\nFROM ...';
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
  ['intro', 'Einführung: SELECT und FROM', 'Entdecken', 'Wie funktioniert eine Abfrage?'],
  ['projection', 'Spalten auswählen', 'Anwenden', 'Spalten auswählen'],
  ['orderBy', 'Sortieren mit ORDER BY', 'Verstehen und anwenden', 'Sortieren mit ORDER BY'],
  ['distinct', 'Doppelte Werte vermeiden: DISTINCT', 'Verstehen und anwenden', 'Doppelte Werte vermeiden: DISTINCT'],
  ['limit', 'Zeilen begrenzen: LIMIT', 'Verstehen und anwenden', 'Zeilen begrenzen: LIMIT'],
  ['fast', 'Für die Schnellen', 'Übertragen', 'Für die Schnellen: alles kombinieren'],
  ['quiz', 'Abschlussquiz', 'Sichern', 'Abschlussquiz und Zusammenfassung']
];
const FEEDBACK_LEVELS = ['success', 'partial', 'hint', 'error'];
const YOUNGEST_KINDS = ['empty', 'correct', 'ageWrong', 'admin', 'oldest', 'wrong'];

// ---------------------------------------------------------------------------
// Einführung (Reiter 1)
// ---------------------------------------------------------------------------

const INTRO_COLUMNS = ['id', 'name', 'username', 'birthday', 'city'];
const INTRO_ROWS = [
  { id: '1', name: 'Noah Schneider', username: 'zornigerfotograf', birthday: '2007-10-02', city: 'Schwerin' },
  { id: '2', name: 'Finn Becker', username: 'wanderwut_finn', birthday: '2006-06-14', city: 'München' },
  { id: '3', name: 'Liam Hoffmann', username: 'bergcoder', birthday: '2009-07-08', city: 'Zürich' },
  { id: '4', name: 'Elias Wagner', username: 'koch_kicker', birthday: '2008-04-23', city: 'Berlin' }
];
const INTRO_PHASES = ['1 · Auftrag', '2 · Tabelle users', '3 · FROM und SELECT', '4 · Mehrere Spalten'];
const INTRO_SCHEMA_LINE = 'users (id: int, name: varchar(255), username: varchar(255), …, birthday: date, city: varchar(255), …)';
const NOTE_EMPTY = 'Noch keine Abfrage – die Ergebnisrelation ist leer.';
const INTRO_STEPS = [
  {
    phase: 1, visual: 'task', result: null,
    explanation: 'Unternehmen möchten im InstaHub Werbung schalten. Vorher wollen sie wissen, wer die Mitglieder sind – zum Beispiel, wie alt sie sind.',
    note: 'Hier entsteht gleich die gesuchte Übersicht.'
  },
  {
    phase: 1, visual: 'flow', result: null,
    explanation: 'Die Daten der Mitglieder liegen in einer Datenbank. Mit einer Abfrage holst du gezielt Informationen aus einer Tabelle. Das Ergebnis ist wieder eine Tabelle, die Ergebnisrelation. Die gebräuchlichste Sprache für Abfragen heißt SQL.',
    note: NOTE_EMPTY
  },
  {
    phase: 2, visual: 'table', schema: true, label: 'Ausschnitt aus users', result: null,
    explanation: 'Alle Mitglieder stehen in der Tabelle users. Jede Zeile beschreibt ein Mitglied, jede Spalte eine Eigenschaft. Du siehst hier 4 Zeilen und 5 Spalten – die ganze Tabelle hat 317 Zeilen und 18 Spalten.',
    note: NOTE_EMPTY
  },
  {
    phase: 3, visual: 'table', source: true, label: 'FROM users: Diese Tabelle wird verwendet', result: null,
    sql: { select: 'SELECT birthday', from: 'FROM users', active: ['from'] },
    explanation: 'Geschrieben wird SELECT zuerst. Verstehen lässt sich die Abfrage leichter, wenn du bei FROM beginnst: FROM users legt fest, aus welcher Tabelle die Daten stammen.',
    note: 'Die Tabelle ist gewählt. Welche Spalten in die Ergebnisrelation kommen, bestimmt SELECT.'
  },
  {
    phase: 3, visual: 'table', label: 'Ausschnitt aus users', selected: ['birthday'], result: { columns: ['birthday'], filled: false },
    sql: { select: 'SELECT birthday', from: 'FROM users', active: ['select'] },
    explanation: 'SELECT birthday legt fest, welche Spalte ausgegeben wird: nur birthday. Die übrigen Spalten kommen nicht in die Ergebnisrelation.',
    note: 'Die Spalte birthday ist ausgewählt.'
  },
  {
    phase: 3, visual: 'table', label: 'Ausschnitt aus users', selected: ['birthday'], result: { columns: ['birthday'], filled: true },
    sql: { select: 'SELECT birthday', from: 'FROM users', active: ['select', 'from'] },
    explanation: 'Die Ergebnisrelation enthält alle Zeilen, aber nur die Spalte birthday. Für alle 317 Mitglieder entsteht so die Übersicht der Geburtsdaten, die die Werbekunden wollten.',
    note: 'Alle 4 Zeilen des Ausschnitts bleiben erhalten.'
  },
  {
    phase: 4, visual: 'table', label: 'Ausschnitt aus users', selected: ['username', 'birthday'], result: { columns: ['username', 'birthday'], filled: true },
    sql: { select: 'SELECT username, birthday', from: 'FROM users', active: ['select'] },
    explanation: 'Mehrere Spalten trennst du mit einem Komma. Die Ergebnisrelation zeigt sie in der Reihenfolge, in der sie hinter SELECT stehen: zuerst username, dann birthday.',
    note: 'Reihenfolge wie hinter SELECT: username, birthday.'
  },
  {
    phase: 4, visual: 'table', label: 'Ausschnitt aus users', selected: INTRO_COLUMNS, result: { columns: INTRO_COLUMNS, filled: true },
    sql: { select: 'SELECT *', from: 'FROM users', active: ['select'] },
    explanation: 'Das Sternchen * steht für alle Spalten. SELECT * gibt die ganze Tabelle aus.',
    note: 'Im Ausschnitt siehst du 5 von 18 Spalten. SELECT * gibt alle 18 Spalten aus.'
  }
];

// ---------------------------------------------------------------------------
// Aufgaben (Reiter 2 bis 6)
// ---------------------------------------------------------------------------

const TEXT_NO_LIMIT_EXPECTED = (c) => `Teilweise korrekt: Deine Ergebnisrelation hat nur ${c.n} Zeilen, gesucht sind alle passenden Zeilen. Entferne LIMIT.`;
const TEXT_CITY_COLUMNS = (c) => `Noch nicht korrekt: Gesucht ist nur die Spalte mit den Wohnorten. Deine Ergebnisrelation enthält ${c.list}. Sieh im Tabellenschema nach, wie diese Spalte heißt.`;
const TEXT_ALL_MEMBERS_EXTRA = 'Statt * ist auch eine Spaltenauswahl richtig, die die Mitglieder erkennbar macht.';

function task(config) {
  return { projection: 'exact', columnOrder: true, requireAny: [], requireAll: [], requireDistinct: false, order: null, limit: null, initialSql: '', extra: [], ...config };
}

const TASKS = [
  task({
    id: 't1', number: 1, tab: 'projection', prompt: '**Zeige** alle Einträge der Tabelle `users` an.',
    select: '*', tail: 'FROM users',
    texts: {
      ok: 'Korrekt: SELECT * gibt alle 18 Spalten und alle 317 Zeilen der Tabelle users aus. Scrolle in der Ergebnisrelation nach rechts und nach unten, um alles zu sehen.',
      cols: (c) => `Noch nicht korrekt: Deine Ergebnisrelation hat ${c.count} Spalte(n). Gesucht sind alle Einträge, also alle Spalten. Welches Zeichen steht hinter SELECT für alle Spalten?`
    },
    hints: [
      'Alle Einträge heißt: alle Zeilen und alle Spalten der Tabelle.',
      'Im Merke-Kasten des Reiters Einführung steht ein Zeichen, das für alle Spalten steht.',
      'Die Abfrage beginnt mit SELECT *. Ergänze in der zweiten Zeile FROM und den Tabellennamen.'
    ]
  }),
  task({
    id: 't2', number: 2, tab: 'projection', prompt: '**Gib** alle Benutzernamen (`username`) aus.',
    select: 'username', tail: 'FROM users',
    texts: {
      ok: 'Korrekt: Die Ergebnisrelation enthält nur die Spalte username – für jedes der 317 Mitglieder eine Zeile.',
      cols: (c) => (c.cols.length === 1 && c.cols[0] === 'name'
        ? 'Noch nicht korrekt: name enthält den vollständigen Namen, zum Beispiel Noah Schneider. Gesucht sind die Benutzernamen wie zornigerfotograf – sieh im Tabellenschema nach.'
        : `Noch nicht korrekt: Deine Ergebnisrelation enthält ${c.list}. Gesucht ist nur die Spalte mit den Benutzernamen.`)
    },
    hints: [
      'Hinter SELECT steht nur die Spalte, die ausgegeben werden soll.',
      'Wie die Spalte mit den Benutzernamen heißt, steht in der Aufgabe in Klammern und im Tabellenschema.',
      { before: 'Ergänze die zweite Zeile:', sql: 'SELECT username\nFROM …' }
    ]
  }),
  task({
    id: 't3', number: 3, tab: 'projection', prompt: 'Aus welchen Ländern stammen die Mitglieder? **Gib** neben dem Land auch den jeweiligen Namen (`name`) aus.',
    select: 'name, country', tail: 'FROM users', columnOrder: false,
    texts: {
      ok: 'Korrekt: Die Ergebnisrelation zeigt für jedes der 317 Mitglieder den Namen und das Land. Viele Länder kommen deshalb mehrfach vor. Beim Konto admin steht NULL: Dort ist kein Land eingetragen.',
      cols: (c) => (c.cols.includes('username') && !c.cols.includes('name')
        ? 'Noch nicht korrekt: username enthält den Benutzernamen. Gesucht ist der Name, zum Beispiel Noah Schneider.'
        : `Noch nicht korrekt: Gesucht sind genau zwei Spalten: der Name und das Land. Deine Ergebnisrelation enthält ${c.list}. Sieh im Tabellenschema nach, wie die Spalte für das Land heißt.`)
    },
    hints: [
      'Du brauchst zwei Spalten. Im Tabellenschema sind die Spaltennamen englisch.',
      'Land heißt auf Englisch country. Mehrere Spalten trennst du hinter SELECT mit einem Komma.',
      { sql: 'SELECT name, country\nFROM …', after: 'Ergänze den Tabellennamen.' }
    ]
  }),
  task({
    id: 't4', number: 4, tab: 'orderBy', prompt: '**Ordne** alle Mitglieder alphabetisch nach ihrem Benutzernamen.',
    select: '*', tail: 'FROM users\nORDER BY username', projection: 'any', requireAny: ['username', 'name'],
    order: { column: 'username', dir: 'ASC' }, extra: [TEXT_ALL_MEMBERS_EXTRA],
    texts: {
      ok: 'Korrekt: Die Mitglieder stehen alphabetisch nach Benutzernamen geordnet – von admin bis zwerglaeuferin. Ohne Angabe sortiert ORDER BY aufsteigend (ASC).',
      cols: () => 'Noch nicht korrekt: Gesucht sind alle Mitglieder. Gib alle Spalten (SELECT *) aus oder mindestens den Benutzernamen.',
      noOrder: () => 'Teilweise korrekt: Du gibst die richtigen Daten aus, aber noch in der ursprünglichen Reihenfolge der Tabelle. Mit welchem Schlüsselwort sortierst du die Zeilen?',
      dir: () => 'Teilweise korrekt: DESC sortiert absteigend, also von Z nach A. Alphabetisch heißt aufsteigend: Lass DESC weg oder schreibe ASC.'
    },
    hints: [
      'Hänge an deine Abfrage eine dritte Zeile an, die festlegt, wonach sortiert wird.',
      'Hinter ORDER BY steht die Spalte, nach der sortiert wird. Alphabetisch ist aufsteigend – das ist die Voreinstellung.',
      { sql: 'SELECT *\nFROM users\nORDER BY …', after: 'Ergänze die Spalte mit den Benutzernamen.' }
    ]
  }),
  task({
    id: 't5', number: 5, tab: 'orderBy', prompt: '**Ordne** die Mitglieder nach ihrer Größe. **Gib** Benutzername, Name und Größe aus – das größte Mitglied steht oben.',
    select: 'username, name, centimeters', tail: 'FROM users\nORDER BY centimeters DESC', columnOrder: false,
    order: { column: 'centimeters', dir: 'DESC' },
    texts: {
      ok: 'Korrekt: Ganz oben stehen die vier größten Mitglieder mit 195 cm – bei gleicher Größe ist jede Reihenfolge richtig. Ganz unten steht admin mit NULL, weil dort keine Größe eingetragen ist: Bei DESC steht NULL am Ende.',
      cols: (c) => `Noch nicht korrekt: Gesucht sind genau drei Spalten: Benutzername, Name und Größe. Deine Ergebnisrelation enthält ${c.list}. Sieh im Tabellenschema nach, wie die Spalte für die Größe heißt.`,
      noOrder: () => 'Teilweise korrekt: Die Spalten stimmen, aber die Zeilen sind noch nicht sortiert. Mit welchem Schlüsselwort ordnest du sie nach der Größe?',
      dir: () => 'Teilweise korrekt: Du sortierst aufsteigend – oben steht jetzt admin ohne Größe und danach das kleinste Mitglied. Das größte Mitglied soll oben stehen: Welche Angabe sortiert absteigend?'
    },
    hints: [
      'Die Größe steht in der Spalte centimeters.',
      'Sortiere mit ORDER BY nach centimeters. Überlege: Soll die größte Zahl oben stehen – aufsteigend oder absteigend?',
      { before: 'Die ersten beiden Zeilen lauten:', sql: 'SELECT username, name, centimeters\nFROM users', after: 'Ergänze ORDER BY mit der passenden Richtung.' }
    ]
  }),
  task({
    id: 't6', number: 6, tab: 'orderBy', prompt: '**Ordne** alle Mitglieder aufsteigend nach ihrem Geburtsdatum.',
    select: '*', tail: 'FROM users\nORDER BY birthday', projection: 'any', requireAny: ['username', 'name'], requireAll: ['birthday'],
    order: { column: 'birthday', dir: 'ASC' }, extra: [TEXT_ALL_MEMBERS_EXTRA, 'youngest'],
    texts: {
      ok: 'Korrekt: Die Mitglieder sind nach dem Geburtsdatum geordnet – vom frühesten zum spätesten Datum. Ganz oben steht admin mit NULL: Dort ist kein Geburtsdatum eingetragen. Das jüngste Mitglied hat das späteste Datum und steht ganz unten.',
      cols: () => 'Noch nicht korrekt: Damit du das jüngste Mitglied und sein Alter findest, brauchst du den Benutzernamen und das Geburtsdatum. Gib alle Spalten (SELECT *) aus oder mindestens username und birthday.',
      noOrder: () => 'Teilweise korrekt: Die Daten stimmen, aber sie sind noch nicht nach dem Geburtsdatum geordnet. Welche Spalte steht hinter ORDER BY?',
      dir: () => 'Teilweise korrekt: DESC sortiert absteigend – oben steht jetzt das späteste Geburtsdatum. Die Aufgabe verlangt aufsteigend: vom frühesten zum spätesten Datum.'
    },
    hints: [
      'Das Geburtsdatum steht in der Spalte birthday im Format Jahr-Monat-Tag.',
      'Aufsteigend ist die Voreinstellung von ORDER BY. Das jüngste Mitglied ist am spätesten geboren – wo steht es dann in der Liste?',
      { sql: 'SELECT *\nFROM users\nORDER BY …', after: 'Ergänze die Spalte. Scrolle danach in der Ergebnisrelation ganz nach unten.' }
    ]
  }),
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
    id: 't8', number: 8, tab: 'distinct', prompt: 'Aus welchen Ländern stammen die Mitglieder? **Gib** jedes Land nur einmal aus.',
    select: 'DISTINCT country', tail: 'FROM users', requireDistinct: true,
    texts: {
      ok: 'Korrekt: Es bleiben nur 4 Zeilen: die drei Länder Deutschland, Schweiz und Österreich sowie NULL für das Konto admin ohne Land. In Aufgabe 3 hatte die Ergebnisrelation 317 Zeilen – eine pro Mitglied. DISTINCT entfernt die Dopplungen aus der Ergebnisrelation.',
      cols: (c) => (c.cols.includes('name')
        ? 'Noch nicht korrekt: Mit name erhältst du wieder eine Zeile pro Mitglied, weil fast jeder Name anders ist. Gesucht ist nur die Spalte mit den Ländern.'
        : `Noch nicht korrekt: Gesucht ist nur die Spalte mit den Ländern. Deine Ergebnisrelation enthält ${c.list}.`),
      noDistinct: (c) => `Teilweise korrekt: Die Spalte stimmt, aber deine Ergebnisrelation hat ${c.n} Zeilen – wie in Aufgabe 3 eine pro Mitglied. Gesucht ist jedes Land nur einmal. Welches Schlüsselwort entfernt Dopplungen?`
    },
    hints: [
      'Das Land steht in der Spalte country.',
      'Wie in Aufgabe 7: Ein Schlüsselwort direkt hinter SELECT sorgt dafür, dass jeder Wert nur einmal erscheint.',
      { sql: 'SELECT DISTINCT …\nFROM users' }
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
    id: 't11', number: 11, tab: 'fast', prompt: '**Kehre** die Reihenfolge der Tabelle `users` um.',
    select: '*', tail: 'FROM users\nORDER BY id DESC', order: { column: 'id', dir: 'DESC' },
    texts: {
      ok: 'Korrekt: Die Tabelle ist nach id geordnet. ORDER BY id DESC dreht die Reihenfolge um: Der zuletzt eingetragene Datensatz steht jetzt oben.',
      cols: () => 'Noch nicht korrekt: Gesucht ist die ganze Tabelle users, also alle Spalten.',
      noOrder: () => 'Teilweise korrekt: Das ist noch die ursprüngliche Reihenfolge. Nach welcher Spalte ist die Tabelle geordnet – und wie drehst du diese Reihenfolge um?',
      wrongCol: (c) => `Teilweise korrekt: Du sortierst nach ${c.ist}. Die ursprüngliche Reihenfolge der Tabelle ergibt sich aus der Spalte id – kehre diese Reihenfolge um.`,
      dir: () => 'Teilweise korrekt: Aufsteigend nach id ist genau die ursprüngliche Reihenfolge. Zum Umkehren sortierst du absteigend.'
    },
    hints: [
      'Sieh dir die erste Spalte der Tabelle an: Nach welcher Spalte ist users geordnet?',
      'Die Tabelle ist aufsteigend nach id geordnet. Umkehren heißt: absteigend sortieren.',
      { sql: 'SELECT *\nFROM users\nORDER BY id …' }
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
    id: 't13', number: 13, tab: 'fast', prompt: '**Gib** Benutzername und Wohnort aller Mitglieder aus, alphabetisch sortiert nach Wohnort.',
    select: 'username, city', tail: 'FROM users\nORDER BY city', columnOrder: false, order: { column: 'city', dir: 'ASC' },
    texts: {
      ok: 'Korrekt: Die Mitglieder sind nach Wohnort geordnet. Innerhalb eines Wohnorts ist jede Reihenfolge richtig. Oben steht admin mit NULL, weil dort kein Wohnort eingetragen ist.',
      cols: (c) => `Noch nicht korrekt: Gesucht sind genau zwei Spalten: Benutzername und Wohnort. Deine Ergebnisrelation enthält ${c.list}.`,
      noOrder: () => 'Teilweise korrekt: Die Spalten stimmen, aber die Zeilen sind noch nicht nach Wohnort sortiert.',
      dir: () => 'Teilweise korrekt: DESC sortiert von Z nach A. Alphabetisch heißt aufsteigend.'
    },
    hints: [
      'Der Benutzername steht in username, der Wohnort in city.',
      'Sortiere mit ORDER BY nach der Spalte mit dem Wohnort. Alphabetisch ist die Voreinstellung.',
      { sql: 'SELECT username, city\nFROM users\nORDER BY …' }
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
const TAB_TASKS = { projection: ['t1', 't2', 't3'], orderBy: ['t4', 't5', 't6'], distinct: ['t7', 't8'], limit: ['t9', 't10'], fast: ['t11', 't12', 't13', 't14', 't15'] };

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
    id: 'q1', prompt: 'Welche Aussagen zu SELECT und FROM stimmen?',
    hint: 'SELECT wählt Spalten aus, die Zeilen bleiben alle erhalten. Diese Auswahl von Spalten heißt Projektion.',
    options: [
      ['a', 'FROM gibt an, aus welcher Tabelle die Daten stammen.', true],
      ['b', 'SELECT legt fest, welche Spalten ausgegeben werden.', true],
      ['c', 'SELECT legt fest, welche Zeilen ausgegeben werden.', false],
      ['d', 'SELECT * gibt alle Spalten der Tabelle aus.', true]
    ]
  },
  {
    id: 'q2', prompt: 'Welche Aussagen über das Ergebnis dieser Abfrage stimmen?', sql: 'SELECT username, birthday\nFROM users',
    hint: 'Eine Abfrage verändert die Tabelle nicht, sie erzeugt eine neue Tabelle. Die Spalten erscheinen in der Reihenfolge hinter SELECT.',
    options: [
      ['a', 'Die Ergebnisrelation hat genau zwei Spalten.', true],
      ['b', 'Die erste Spalte ist username.', true],
      ['c', 'Die Ergebnisrelation enthält nur ein Mitglied.', false],
      ['d', 'Die Tabelle users besteht danach nur noch aus diesen zwei Spalten.', false]
    ]
  },
  {
    id: 'q3', prompt: 'Welche Aussagen zu ORDER BY stimmen?',
    hint: 'Ohne Angabe gilt ASC, also aufsteigend. ORDER BY sortiert nur die Ergebnisrelation, nicht die Tabelle.',
    options: [
      ['a', 'ORDER BY centimeters DESC setzt das größte Mitglied an den Anfang.', true],
      ['b', 'Ohne Angabe von ASC oder DESC sortiert ORDER BY absteigend.', false],
      ['c', 'ORDER BY username sortiert die Benutzernamen alphabetisch von A nach Z.', true],
      ['d', 'ORDER BY ändert die Reihenfolge der Zeilen in der Tabelle users dauerhaft.', false]
    ]
  },
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

const state = { tab: 'intro', introStep: 1, answers: {}, feedback: {}, solved: {}, youngest: { username: '', age: '', feedback: null }, quiz: {}, quizFeedback: null, quizPassed: false };
const results = {}; // Ergebnisrelationen werden nicht gespeichert (zu groß).
const running = new Set();
let database;
let databaseReady = false;

function save() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* Ohne Speicher bleibt das Modul bedienbar. */ }
}

function isPlainObject(value) { return Boolean(value) && typeof value === 'object' && !Array.isArray(value); }
function validFeedback(value) { return isPlainObject(value) && FEEDBACK_LEVELS.includes(value.level) && typeof value.text === 'string'; }

function restore() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    if (!isPlainObject(saved)) return;
    if (TABS.some(([id]) => id === saved.tab)) state.tab = saved.tab;
    if (Number.isInteger(saved.introStep) && saved.introStep >= 1 && saved.introStep <= INTRO_STEPS.length) state.introStep = saved.introStep;
    if (isPlainObject(saved.answers)) for (const [id, answer] of Object.entries(saved.answers)) if (TASK_BY_ID.has(id) && typeof answer === 'string') state.answers[id] = answer;
    if (isPlainObject(saved.feedback)) for (const [id, feedback] of Object.entries(saved.feedback)) if (TASK_BY_ID.has(id) && validFeedback(feedback)) state.feedback[id] = { level: feedback.level, text: feedback.text };
    if (isPlainObject(saved.solved)) for (const [id, done] of Object.entries(saved.solved)) if (TASK_BY_ID.has(id) && done === true) state.solved[id] = true;
    if (isPlainObject(saved.youngest)) {
      if (typeof saved.youngest.username === 'string') state.youngest.username = saved.youngest.username;
      if (typeof saved.youngest.age === 'string') state.youngest.age = saved.youngest.age;
      if (YOUNGEST_KINDS.includes(saved.youngest.feedback)) state.youngest.feedback = saved.youngest.feedback;
    }
    if (isPlainObject(saved.quiz)) FINAL_QUIZ.forEach((question) => { if (Array.isArray(saved.quiz[question.id])) state.quiz[question.id] = saved.quiz[question.id].filter((value) => question.options.some(([id]) => id === value)); });
    if (validFeedback(saved.quizFeedback)) state.quizFeedback = { level: saved.quizFeedback.level, text: saved.quizFeedback.text };
    state.quizPassed = saved.quizPassed === true;
  } catch { /* Speicherstand ist optional. */ }
}

function isTabComplete(id) {
  if (id === 'intro') return state.introStep === INTRO_STEPS.length;
  if (id === 'quiz') return state.quizPassed;
  const done = TAB_TASKS[id].every((taskId) => state.solved[taskId]);
  return id === 'orderBy' ? done && state.youngest.feedback === 'correct' : done;
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
function stripQuotes(value) { return String(value).replace(/^["'`]/, '').replace(/["'`]$/, ''); }

function analyzeQuery(sql) {
  const tokens = sqlTokens(sql).filter((token) => token.value !== ';');
  const keywords = tokens.map(tokenKeyword);
  const selectIndex = keywords.indexOf('SELECT');
  const fromIndex = keywords.indexOf('FROM', selectIndex + 1);
  const orderIndex = keywords.indexOf('ORDER');
  const limitIndex = keywords.indexOf('LIMIT');
  const distinctIndex = keywords.indexOf('DISTINCT');
  const hasFrom = fromIndex > -1;
  const afterSelect = selectIndex + 1 + (keywords[selectIndex + 1] === 'DISTINCT' ? 1 : 0);
  const projectionEnd = hasFrom ? fromIndex : [orderIndex, limitIndex].filter((index) => index > -1).reduce((min, index) => Math.min(min, index), tokens.length);
  const analysis = {
    hasFrom,
    distinct: distinctIndex > -1,
    distinctMisplaced: distinctIndex > -1 && distinctIndex !== selectIndex + 1,
    columns: [],
    missingComma: false,
    trailingComma: hasFrom && tokens[fromIndex - 1]?.value === ',',
    orderBy: [],
    orderWithoutBy: (orderIndex > -1 && keywords[orderIndex + 1] !== 'BY') || keywords.includes('SORT'),
    limit: null,
    limitBeforeOrder: limitIndex > -1 && orderIndex > -1 && limitIndex < orderIndex,
    tokens,
    orderIndex
  };
  splitGroups(tokens.slice(afterSelect, projectionEnd)).forEach((group) => {
    if (!analysis.columns) return;
    const values = group.map((token) => token.value);
    if (group.length === 1 && (group[0].type === 'word' || values[0] === '*')) analysis.columns.push(values[0].toLowerCase());
    else if (group.length === 3 && group[0].type === 'word' && values[1] === '.' && (group[2].type === 'word' || values[2] === '*')) analysis.columns.push(values[2].toLowerCase());
    else if (group.length === 3 && group[0].type === 'word' && tokenKeyword(group[1]) === 'AS' && group[2].type === 'word') analysis.columns.push(values[0].toLowerCase());
    else {
      if (group.length >= 2 && group[0].type === 'word' && group[1].type === 'word' && tokenKeyword(group[1]) !== 'AS') analysis.missingComma = true;
      analysis.columns = null;
    }
  });
  if (orderIndex > -1 && keywords[orderIndex + 1] === 'BY') {
    const orderEnd = limitIndex > orderIndex ? limitIndex : tokens.length;
    splitGroups(tokens.slice(orderIndex + 2, orderEnd)).forEach((group) => {
      let parts = group; let dir = 'ASC';
      const last = tokenKeyword(parts.at(-1));
      if (last === 'ASC' || last === 'DESC') { dir = last; parts = parts.slice(0, -1); }
      if (!parts.length) return;
      const quoted = parts.some((token) => token.type === 'string');
      let column;
      if (parts.length === 3 && parts[1].value === '.') column = parts[2].value;
      else if (parts.length === 1) column = parts[0].value;
      else column = parts.map((token) => token.value).join(' ');
      analysis.orderBy.push({ column: stripQuotes(column).toLowerCase(), dir, quoted });
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
    const position = analysis.tokens.findIndex((token) => stripQuotes(token.value).toLowerCase() === name.toLowerCase());
    const clause = analysis.orderIndex > -1 && position > analysis.orderIndex ? 'ORDER BY' : 'SELECT';
    const english = GERMAN_COLUMN_HINTS[name.toLowerCase()];
    return `Noch nicht korrekt: Die Spalte ${name} hinter ${clause} gibt es in der Tabelle users nicht. Sieh im Tabellenschema nach, wie die Spalte heißt.${english ? ` Die Spaltennamen sind englisch – gemeint ist vermutlich ${english}.` : ''}`;
  }
  return 'Noch nicht korrekt: SQL versteht deine Abfrage nicht. Prüfe die Schreibweise der Schlüsselwörter, die Kommas zwischen den Spalten und die Reihenfolge der Klauseln.';
}

// nach valueKey und rowKey in klasse-10/1-Datenbanken/sql-lab-core.mjs (dort nicht exportiert)
function valueKey(value) { return value === null ? '__NULL__' : `${typeof value}:${String(value)}`; }
function rowKey(row) { return row.map(valueKey).join('\u001f'); }
function columnIndex(relation, name) { return relation.columns.findIndex((column) => column.toLowerCase() === name.toLowerCase()); }
function sameSet(left, right) { const a = new Set(left); const b = new Set(right); return a.size === b.size && [...a].every((value) => b.has(value)); }

function requireAnyOk(taskConfig, analysis) {
  if (!analysis.columns) return false;
  const has = (name) => analysis.columns.includes('*') || analysis.columns.includes(name);
  if (taskConfig.requireAny.length && !taskConfig.requireAny.some(has)) return false;
  return taskConfig.requireAll.every(has);
}

// Referenz je Aufgabe; bei projection 'any' wird sie mit der Spaltenliste der Schülerin oder des Schülers neu gebaut.
function referenceSql(taskConfig, analysis) {
  if (taskConfig.projection === 'any') return analysis.columns ? `SELECT ${analysis.columns.join(', ')}\n${taskConfig.tail}` : null;
  return `SELECT ${taskConfig.select}\n${taskConfig.tail}`;
}

async function isCorrect(taskConfig, analysis, actual) {
  if (taskConfig.projection === 'anyThree') {
    if (!analysis.columns || analysis.distinct || actual.values.length !== 3) return false;
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
  const actualIndex = columnIndex(actual, taskConfig.order.column);
  const referenceIndex = columnIndex(reference, taskConfig.order.column);
  if (actualIndex < 0 || referenceIndex < 0) return compareRelations(actual, reference, { ...options, rowOrder: true }).correct;
  // Bei Gleichstand zählt jede Reihenfolge: Nur die Folge der Sortierwerte muss übereinstimmen (NULL gleich NULL).
  if (!compareRelations(actual, reference, options).correct) return false;
  return actual.values.length === reference.values.length && actual.values.every((row, index) => row[actualIndex] === reference.values[index][referenceIndex]);
}

function actualColumnNames(analysis, actual) {
  if (actual.columns.length) return actual.columns;
  if (analysis.columns) return analysis.columns.flatMap((name) => (name === '*' ? USER_COLUMN_NAMES : [name]));
  return [];
}

function rowCountText(count, limit) { return `Teilweise korrekt: Deine Ergebnisrelation hat ${count} Zeilen, gesucht sind genau ${limit}. Prüfe die Zahl hinter LIMIT.`; }

async function evaluate(taskConfig, analysis, actual) {
  const names = actualColumnNames(analysis, actual);
  const context = { n: actual.values.length, count: names.length, cols: names.map((name) => name.toLowerCase()), list: names.join(', '), ist: analysis.orderBy[0]?.column };
  if (await isCorrect(taskConfig, analysis, actual)) return { level: 'success', text: taskConfig.texts.ok, solved: true };
  const fallback = { level: 'hint', text: 'Noch nicht korrekt: Vergleiche deine Ergebnisrelation mit der Aufgabe: Stimmen die Spalten, die Anzahl der Zeilen und ihre Reihenfolge?' };
  const partial = (text) => ({ level: 'partial', text });
  if (analysis.missingComma) return { level: 'hint', text: 'Noch nicht korrekt: Zwischen zwei Spaltennamen fehlt ein Komma. Ohne Komma liest SQL das zweite Wort als neuen Namen für die erste Spalte – deshalb hat deine Ergebnisrelation zu wenige Spalten.' };
  if (taskConfig.projection === 'anyThree') {
    if (!analysis.columns) return fallback;
    if (analysis.distinct) return partial(taskConfig.texts.distinct(context));
    if (analysis.limit === null) return partial(taskConfig.texts.noLimit(context));
    if (context.n !== taskConfig.limit) return partial(rowCountText(context.n, taskConfig.limit));
    return fallback;
  }
  const reference = taskConfig.projection === 'any' ? null : await cachedExec(`SELECT ${taskConfig.select}\n${taskConfig.tail}`);
  const columnsWrong = taskConfig.projection === 'any' ? !requireAnyOk(taskConfig, analysis) : !sameSet(context.cols, reference.columns.map((name) => name.toLowerCase()));
  if (columnsWrong) return { level: 'hint', text: taskConfig.texts.cols(context) };
  if (taskConfig.requireDistinct && !analysis.distinct) return partial(taskConfig.texts.noDistinct(context));
  if (!taskConfig.requireDistinct && analysis.distinct) return partial('Teilweise korrekt: Die Spalten stimmen. DISTINCT entfernt aber Zeilen, die hier gebraucht werden – gesucht sind alle Mitglieder, nicht nur verschiedene Werte. Lass DISTINCT weg.');
  if (taskConfig.order) {
    const first = analysis.orderBy[0];
    if (!first) return partial(taskConfig.texts.noOrder(context));
    if (first.quoted) return partial('Teilweise korrekt: Hinter ORDER BY steht der Spaltenname ohne Anführungszeichen, zum Beispiel ORDER BY centimeters.');
    if (first.column !== taskConfig.order.column) return partial(taskConfig.texts.wrongCol ? taskConfig.texts.wrongCol(context) : `Teilweise korrekt: Du sortierst nach ${first.column}. Die Aufgabe verlangt eine Sortierung nach ${taskConfig.order.column}. Prüfe die Spalte hinter ORDER BY.`);
    if (first.dir !== taskConfig.order.dir) return partial(taskConfig.texts.dir(context));
  }
  if (taskConfig.limit !== null) {
    if (analysis.limit === null) return partial(taskConfig.texts.noLimit(context));
    if (context.n !== taskConfig.limit) return partial(rowCountText(context.n, taskConfig.limit));
  } else if (analysis.limit !== null) return partial(TEXT_NO_LIMIT_EXPECTED(context));
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

function renderTask(taskConfig) {
  const card = element('section', 'task-card sql-task'); card.id = `task-${taskConfig.id}`;
  card.append(element('h3', '', `Aufgabe ${taskConfig.number}`), paragraph(taskConfig.prompt));
  // nach renderSqlTask in klasse-10/1-Datenbanken/sql-lab.js, angepasst: eigene Prüflogik, Hilfen über appendHints
  const label = element('label', 'sql-label', 'Deine vollständige SQL-Anweisung'); label.htmlFor = `input-${taskConfig.id}`;
  const input = document.createElement('textarea'); input.id = label.htmlFor; input.className = 'sql-input'; input.spellcheck = false; input.placeholder = NEUTRAL_SQL_PLACEHOLDER;
  const hasSavedAnswer = Object.prototype.hasOwnProperty.call(state.answers, taskConfig.id);
  input.value = hasSavedAnswer ? state.answers[taskConfig.id] : taskConfig.initialSql;
  if (!hasSavedAnswer && taskConfig.initialSql) { state.answers[taskConfig.id] = taskConfig.initialSql; save(); }
  const resetOutput = () => {
    const wasSolved = Boolean(state.solved[taskConfig.id]);
    delete state.feedback[taskConfig.id]; delete state.solved[taskConfig.id]; delete results[taskConfig.id];
    save(); renderTaskOutput(taskConfig);
    if (wasSolved) updateTabMarks();
  };
  input.addEventListener('input', () => { state.answers[taskConfig.id] = input.value; resetOutput(); });
  input.addEventListener('keydown', (event) => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); runTask(taskConfig); } });
  card.append(label, input);
  appendHints(card, taskConfig.hints);
  const actions = element('div', 'action-row');
  const run = element('button', 'primary-button sql9-run', 'Abfrage ausführen und prüfen'); run.type = 'button'; run.disabled = !databaseReady;
  run.addEventListener('click', () => runTask(taskConfig));
  actions.append(run);
  if (taskConfig.initialSql) {
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
function activateTab(id, { focusContent = false } = {}) { state.tab = id; save(); render({ focusContent }); }

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
  card.append(element('strong', 'schema-title', schemas.length === 1 ? 'Tabellenschema' : 'Tabellenschemata'));
  const scroll = element('div', 'schema-scroll'); scroll.tabIndex = 0; scroll.setAttribute('aria-label', 'Tabellenschemata horizontal scrollen');
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
  if (state.tab === 'intro') renderIntro(panel);
  else if (state.tab === 'quiz') renderQuiz(panel);
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
  card.append(row, element('p', '', 'DISTINCT verändert die Tabelle users nicht. Es entfernt die Dopplungen nur in der Ergebnisrelation. NULL erscheint als eigener Wert: Beim Konto admin ist kein Geschlecht eingetragen.'));
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
  return card;
}

function renderTaskTab(panel) {
  const introCard = {
    projection: () => { const card = element('div', 'scenario-card'); card.append(paragraph('Im InstaHub-Datenbanklabor fragst du eine echte Tabelle `users` mit 317 Mitgliedern ab. Die Daten stimmen nicht mit deinem eigenen InstaHub überein.'), paragraph('**Tippe** deine Abfrage ein und **klicke** auf „Abfrage ausführen und prüfen“. Darunter erscheint die Ergebnisrelation deiner Abfrage.')); return card; },
    orderBy: orderByCard,
    distinct: distinctCard,
    limit: limitCard,
    fast: () => { const card = element('div', 'scenario-card'); card.append(element('p', '', 'Hier kombinierst du alles, was du gelernt hast: SELECT, FROM, ORDER BY, DISTINCT und LIMIT.')); return card; }
  }[state.tab];
  panel.append(introCard());
  TAB_TASKS[state.tab].forEach((id) => { const taskConfig = TASK_BY_ID.get(id); panel.append(renderTask(taskConfig)); renderTaskOutput(taskConfig); });
}

// ---------------------------------------------------------------------------
// Reiter 1 – Einführung (Design nach klasse-11/1-Kuenstliche-Intelligenz/aufgabe3.html, #split-intro)
// ---------------------------------------------------------------------------

function introSnippet(step) {
  const selected = step.selected || [];
  const wrapper = element('div', 'sql9-intro-table');
  if (step.schema) wrapper.append(element('code', 'schema-code sql9-intro-schema', INTRO_SCHEMA_LINE));
  wrapper.append(element('p', 'sql9-snippet-label', step.label));
  const shell = element('div', `sql9-snippet${step.source ? ' is-source' : ''}`);
  const scroll = element('div', 'table-scroll'); scroll.tabIndex = 0; scroll.setAttribute('aria-label', 'Ausschnitt aus users horizontal scrollen');
  const table = element('table', 'data-table sql9-snippet-table');
  let caption = 'Ausschnitt aus users';
  if (selected.length === INTRO_COLUMNS.length) caption += ', ausgewählte Spalten: alle Spalten';
  else if (selected.length) caption += `, ausgewählte ${selected.length === 1 ? 'Spalte' : 'Spalten'}: ${selected.join(', ')}`;
  else if (step.source) caption += ', Tabelle für FROM users gewählt';
  table.append(element('caption', 'visually-hidden', caption));
  const stateClass = (column) => (!selected.length ? '' : selected.includes(column) ? 'is-selected' : 'is-dimmed');
  const head = document.createElement('thead'); const headRow = document.createElement('tr');
  INTRO_COLUMNS.forEach((column) => {
    const th = element('th', stateClass(column)); th.scope = 'col';
    if (selected.includes(column)) { const mark = element('span', 'sql9-check', '✓ '); mark.setAttribute('aria-hidden', 'true'); th.append(mark); }
    th.append(document.createTextNode(column)); headRow.append(th);
  });
  head.append(headRow);
  const body = document.createElement('tbody');
  INTRO_ROWS.forEach((row) => { const tr = document.createElement('tr'); INTRO_COLUMNS.forEach((column) => tr.append(element('td', stateClass(column), row[column]))); body.append(tr); });
  table.append(head, body); scroll.append(table); shell.append(scroll); wrapper.append(shell);
  return wrapper;
}

function introFlow() {
  const flow = element('div', 'sql9-flow');
  ['Tabelle users', 'Abfrage in SQL', 'Ergebnisrelation: wieder eine Tabelle'].forEach((text, index) => {
    if (index) { const arrow = element('span', 'sql9-flow-arrow'); arrow.setAttribute('aria-hidden', 'true'); flow.append(arrow); }
    flow.append(element('div', 'sql9-flow-box', text));
  });
  return flow;
}

function introResult(step) {
  const wrapper = element('div', 'sql9-result-table');
  if (!step.result) { const empty = element('div', 'sql9-result-empty', '–'); empty.setAttribute('aria-hidden', 'true'); wrapper.append(empty); return wrapper; }
  const scroll = element('div', 'table-scroll'); scroll.tabIndex = 0; scroll.setAttribute('aria-label', 'Ergebnisrelation des Ausschnitts horizontal scrollen');
  const table = element('table', 'data-table sql9-result-cells');
  table.append(element('caption', 'visually-hidden', `Ergebnisrelation des Ausschnitts, Spalten: ${step.result.columns.join(', ')}`));
  const head = document.createElement('thead'); const headRow = document.createElement('tr');
  step.result.columns.forEach((column) => { const th = element('th', '', column); th.scope = 'col'; headRow.append(th); });
  head.append(headRow);
  const body = document.createElement('tbody');
  INTRO_ROWS.forEach((row) => { const tr = document.createElement('tr'); step.result.columns.forEach((column) => tr.append(element('td', step.result.filled ? 'is-filled is-current' : '', step.result.filled ? row[column] : '–'))); body.append(tr); });
  table.append(head, body); scroll.append(table); wrapper.append(scroll);
  return wrapper;
}

function introMemo() {
  const memo = element('section', 'short-summary sql9-intro-memo'); memo.setAttribute('aria-labelledby', 'sql9-memo-title');
  const title = element('h3', '', 'Merke: Projektion'); title.id = 'sql9-memo-title';
  memo.append(
    title,
    paragraph('Mit einer Abfrage wählst du Spalten aus einer Tabelle aus. Diese Auswahl von Spalten heißt **Projektion**.'),
    sqlBlock('SELECT Spalte1, Spalte2, …\nFROM Tabellenname'),
    element('p', '', 'FROM nennt die Tabelle, SELECT die Spalten. Mehrere Spalten trennst du durch Kommas. Alle Zeilen bleiben erhalten.'),
    sqlBlock('SELECT *\nFROM Tabellenname'),
    element('p', '', 'gibt die gesamte Tabelle aus.')
  );
  return memo;
}

function renderIntro(panel) {
  const card = element('section', 'task-card sql9-intro');
  const heading = element('div', 'sql9-intro-heading');
  const progress = element('div', 'sql9-intro-progress'); progress.setAttribute('aria-label', 'Ablauf der Erklärung');
  const phaseNodes = INTRO_PHASES.map((text) => { const span = element('span', '', text); progress.append(span); return span; });
  const stepper = element('div', 'intro-stepper'); stepper.setAttribute('role', 'group'); stepper.setAttribute('aria-label', 'Erklärung durchklicken');
  const previous = element('button', 'secondary-button', 'Zurück'); previous.type = 'button'; previous.id = 'intro-prev';
  const count = element('span', ''); count.id = 'intro-frame-count'; count.setAttribute('aria-live', 'polite');
  const next = element('button', 'primary-button', 'Weiter'); next.type = 'button'; next.id = 'intro-next';
  stepper.append(previous, count, next);
  heading.append(progress, stepper);
  const hint = element('p', 'sql9-intro-hint'); hint.append(element('strong', '', 'Hinweis:'), document.createTextNode(' '), element('strong', '', 'Klicke'), document.createTextNode(' dich zunächst durch die Animation, '), element('strong', '', 'bearbeite'), document.createTextNode(' anschließend die Aufgaben in den nächsten Reitern.'));
  const workspace = element('div', 'sql9-intro-workspace');
  const visual = element('div', 'sql9-intro-visual');
  const explanation = element('p', 'intro-explanation'); explanation.id = 'intro-explanation'; explanation.setAttribute('aria-live', 'polite');
  const statement = element('pre', 'given-sql sql9-intro-sql');
  const stage = element('div', 'sql9-intro-stage');
  visual.append(explanation, statement, stage);
  const resultCard = element('div', 'sql9-result-card');
  const resultBody = element('div', 'sql9-result-body');
  const note = element('p', 'sql9-result-note');
  resultCard.append(element('h3', '', 'Ergebnisrelation'), resultBody, note);
  workspace.append(visual, resultCard);
  const memoSlot = element('div', 'sql9-memo-slot');
  card.append(heading, hint, workspace, memoSlot);
  panel.append(card);

  const update = () => {
    const index = state.introStep - 1; const step = INTRO_STEPS[index];
    phaseNodes.forEach((span, phaseIndex) => {
      const phase = phaseIndex + 1;
      span.className = phase === step.phase ? 'is-active' : phase < step.phase ? 'is-complete' : '';
      if (phase === step.phase) span.setAttribute('aria-current', 'step'); else span.removeAttribute('aria-current');
      span.textContent = phase < step.phase ? `✓ ${INTRO_PHASES[phaseIndex]}` : INTRO_PHASES[phaseIndex];
    });
    count.textContent = `Schritt ${state.introStep} von ${INTRO_STEPS.length}`;
    previous.disabled = index === 0; next.disabled = index === INTRO_STEPS.length - 1;
    explanation.textContent = step.explanation;
    statement.replaceChildren();
    const code = element('code'); statement.append(code);
    if (step.sql) {
      [['select', step.sql.select], ['from', step.sql.from]].forEach(([clause, line]) => code.append(element('span', step.sql.active.includes(clause) ? 'is-active-clause' : '', line)));
      statement.classList.remove('is-empty');
    } else { code.append(element('span', '', 'Hier erscheint gleich die Abfrage.')); statement.classList.add('is-empty'); }
    stage.replaceChildren();
    if (step.visual === 'task') { const task = element('div', 'scenario-card accent sql9-intro-task'); task.append(paragraph('**Auftrag der Werbekunden:** Erstelle eine Übersicht über die Geburtsdaten aller Mitglieder.')); stage.append(task); }
    else if (step.visual === 'flow') stage.append(introFlow());
    else stage.append(introSnippet(step));
    resultBody.replaceChildren(introResult(step));
    note.textContent = step.note;
    memoSlot.replaceChildren();
    if (state.introStep === INTRO_STEPS.length) memoSlot.append(introMemo());
  };
  const change = (direction, button, other) => {
    state.introStep = Math.max(1, Math.min(INTRO_STEPS.length, state.introStep + direction));
    save(); update(); updateTabMarks();
    (button.disabled ? other : button).focus();
  };
  previous.addEventListener('click', () => change(-1, previous, next));
  next.addEventListener('click', () => change(1, next, previous));
  update();
}

// ---------------------------------------------------------------------------
// Reiter 7 – Abschlussquiz, Übersicht, Merke
// ---------------------------------------------------------------------------

function quizSelection(question) { return Array.isArray(state.quiz[question.id]) ? state.quiz[question.id] : []; }

function renderQuiz(panel) {
  const card = element('section', 'task-card sql-task');
  card.append(element('h3', '', 'Fünf Fragen zu einfachen SQL-Abfragen'), paragraph('**Kreuze** alle richtigen Antworten an. Bei manchen Fragen sind mehrere Antworten richtig.'));
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
        state.quizFeedback = null; save(); showFeedback();
      });
      const content = element('span'); content.append(isSql ? element('code', 'quiz-sql', text) : document.createTextNode(text));
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
    })),
    buttonClass: 'primary-button',
    rowClass: 'action-row',
    levels: { high: 'success', medium: 'partial', low: 'hint' },
    onAllCorrect: () => form.requestSubmit(),
  });
  card.append(form); panel.append(card, overviewSlot, renderSummary());
  showFeedback(); refreshOverview();
}

function checkQuiz() {
  const open = FINAL_QUIZ.map((question, index) => (quizSelection(question).length ? null : index + 1)).filter(Boolean);
  if (open.length) { state.quizFeedback = { level: 'hint', text: `Beantworte zuerst alle Fragen. Noch ohne Kreuz: Frage ${open.join(', ')}.` }; save(); return; }
  const correct = FINAL_QUIZ.map((question) => { const chosen = new Set(quizSelection(question)); return question.options.every(([id, , right]) => chosen.has(id) === right); });
  const amount = correct.filter(Boolean).length;
  if (amount === FINAL_QUIZ.length) { state.quizPassed = true; state.quizFeedback = { level: 'success', text: 'Korrekt: Alle fünf Fragen stimmen. Unten findest du jetzt die Übersicht über alle Aufgaben mit Lösung.' }; }
  else {
    const wrong = FINAL_QUIZ.map((question, index) => (correct[index] ? null : index + 1)).filter(Boolean);
    const hints = FINAL_QUIZ.filter((question, index) => !correct[index]).map((question) => question.hint).join(' ');
    state.quizFeedback = amount
      ? { level: 'partial', text: `Teilweise korrekt: ${amount} von ${FINAL_QUIZ.length} Fragen stimmen. Prüfe Frage ${wrong.join(', ')} noch einmal. ${hints}` }
      : { level: 'hint', text: `Noch nicht korrekt: Prüfe Frage ${wrong.join(', ')} noch einmal. ${hints}` };
  }
  save();
}

function renderOverview() {
  const overview = element('section', 'short-summary sql-quiz-overview'); overview.setAttribute('aria-labelledby', 'sql9-overview-title');
  const title = element('h3', '', 'Übersicht: alle Aufgaben mit Lösung'); title.id = 'sql9-overview-title'; overview.append(title);
  const list = document.createElement('ol');
  TASKS.forEach((taskConfig) => {
    const item = document.createElement('li');
    item.append(element('strong', '', `Aufgabe ${taskConfig.number}: `)); richText(item, taskConfig.prompt);
    item.append(sqlBlock(`SELECT ${taskConfig.select}\n${taskConfig.tail}`));
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
    question.options.filter(([, , right]) => right).forEach(([, text, , isSql]) => { const answer = document.createElement('li'); answer.append(isSql ? element('code', 'quiz-sql', text) : document.createTextNode(text)); answers.append(answer); });
    entry.append(answers); questions.append(entry);
  });
  quizItem.append(questions); list.append(quizItem);
  overview.append(list);
  return overview;
}

function renderSummary() {
  const summary = element('section', 'short-summary'); summary.setAttribute('aria-labelledby', 'sql9-summary-title');
  const title = element('h3', '', 'Merke: Einfache SQL-Abfragen'); title.id = 'sql9-summary-title';
  const list = element('dl', 'aggregate-list');
  [['SELECT', 'wählt die Spalten aus (Projektion); * steht für alle Spalten'], ['FROM', 'nennt die Tabelle'], ['ORDER BY Spalte', 'sortiert die Ergebnisrelation: ASC aufsteigend (Voreinstellung), DESC absteigend'], ['SELECT DISTINCT', 'gibt jeden Wert nur einmal aus'], ['LIMIT n', 'gibt höchstens n Zeilen aus und steht immer am Ende']]
    .forEach(([term, meaning]) => list.append(element('dt', '', term), element('dd', '', meaning)));
  summary.append(title, list, element('p', '', 'Reihenfolge der Klauseln:'), sqlBlock('SELECT DISTINCT Spalte1, Spalte2\nFROM Tabellenname\nORDER BY Spalte DESC\nLIMIT 10'), element('p', '', 'Eine Abfrage verändert die Tabelle nicht. Sie erzeugt eine neue Tabelle: die Ergebnisrelation. NULL bedeutet, dass kein Wert eingetragen ist.'));
  return summary;
}

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

async function rerunSavedTasks() {
  for (const taskConfig of TASKS) if (state.feedback[taskConfig.id]) await runTask(taskConfig, { auto: true });
}

async function init() {
  restore();
  render();
  document.getElementById('reset-module').addEventListener('click', () => {
    if (window.confirm('Möchtest du alle SQL-Eingaben und den Fortschritt dieser Aufgabe zurücksetzen?')) {
      try { localStorage.removeItem(STORAGE_KEY); } catch { /* Ohne Speicher weiter nutzbar. */ }
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
