import { evaluateSemanticAnswer } from '../../klasse-11/1-Kuenstliche-Intelligenz/perzeptron/ui/semantic-answer.mjs?v=20261029-single-improvement';
import { analyzeMultiTableSelect, classifyDescriptionResult, compareRelations, diagnoseSqlError, sqlTokens, validateSelectStatement } from './sql-lab-core.mjs?v=20260929b';
import { SqlWorker, appendHints, renderRelation, renderServerFeedback, schemaCard } from './sql-lab.js?v=20261029-criterion-feedback';
import { appendSolutionDownloadFromTemplate, focusTabPanelStart, enableTabKeyboardNavigation, renderTabFlowNavigation, syncTabSemantics } from './tab-navigation.mjs?v=20261001a';
import { JOIN_TASKS } from './aufgabe9-daten.mjs?v=20261029-ordering';

const STORAGE_KEY = 'inf10-insta-verbund-aufgabe9-v1';
const SCRIPT_SERVER_URL = 'https://unterrichtkiichezbn4-ki-auswertung.functions.fnc.fr-par.scw.cloud/';
const TABS = [['intro', 'Verbund verstehen'], ['practice', 'Verbund anwenden'], ['count', 'Verbinden und zählen'], ['extra', 'Für die Schnellen'], ['summary', 'Auswertung'], ['quiz', 'Abschlussquiz']];
const FLOW = ['intro', 'practice', 'count', 'quiz', 'summary'].map((id) => ({ id, label: `${TABS.findIndex(([tab]) => tab === id) + 1}. ${TABS.find(([tab]) => tab === id)[1]}` }));
const ALL_TASKS = new Map(JOIN_TASKS.map((task) => [task.id, task]));
const REQUIRED = JOIN_TASKS.filter((task) => task.required);
const TABLE_COLUMNS = {
  users: { id: 'int', name: 'varchar(255)', username: 'varchar(255)', email: 'varchar(255)', gender: 'varchar(255)', city: 'varchar(255)' },
  photos: { id: 'int', user_id: 'int', description: 'varchar(255)', url: 'varchar(255)' },
  follows: { id: 'int', following_id: 'int', follower_id: 'int' },
  comments: { id: 'int', user_id: 'int', photo_id: 'int', body: 'varchar(255)' },
  likes: { id: 'int', photo_id: 'int', user_id: 'int' },
  tags: { id: 'int', photo_id: 'int', name: 'varchar(255)' }
};
const EDGES = {
  P1: [['users.id', 'photos.user_id']], P3: [['users.id', 'photos.user_id']], P4: [['users.id', 'comments.user_id']],
  P6: [['users.id', 'photos.user_id'], ['photos.id', 'tags.photo_id']], P7: [['users.id', 'comments.user_id']],
  P9: [['users.id', 'photos.user_id']], P10: [['users.id', 'follows.following_id']],
  P12: [['users.id', 'photos.user_id'], ['photos.id', 'likes.photo_id']],
  Z1: [['users.id', 'photos.user_id'], ['photos.id', 'tags.photo_id']],
  Z2: [['users.id', 'comments.user_id'], ['comments.photo_id', 'photos.id']],
  Z3: [['users.id', 'follows.following_id']],
  Z4: [['users.id', 'photos.user_id'], ['photos.id', 'tags.photo_id']],
  Z5: [['users.id', 'photos.user_id']], Z6: [['photos.id', 'likes.photo_id']],
  Z7: [['photos.id', 'comments.photo_id']], Z8: [['users.id', 'follows.following_id']],
  Z9: [['photos.id', 'tags.photo_id']], Z10: [['users.id', 'comments.user_id']],
  Z13: [['users.id', 'follows.follower_id']]
};
const QUIZ = [
  { question: 'Welche Bedingungen verbinden die Tabellen über passende Schlüssel?', options: [['a', 'users.id = photos.user_id', true], ['b', 'photos.id = tags.photo_id', true], ['c', 'users.id = photos.id', false], ['d', 'tags.id = photos.id', false]], success: 'Korrekt: Beide Bedingungen verbinden passende Schlüssel.', hint: 'Vergleiche Primärschlüssel und zugehörigen Fremdschlüssel.' },
  { question: 'Welche Aussagen zum Zählen stimmen?', options: [['a', 'COUNT(photos.id) zählt passende Fotozeilen.', true], ['b', 'COUNT(DISTINCT follows.follower_id) zählt unterschiedliche folgende Personen.', true], ['c', 'GROUP BY sortiert die Gruppen automatisch nach Anzahl.', false], ['d', 'following_id ist die folgende Person.', false]], success: 'Korrekt: COUNT zählt die passenden Zeilen oder mit DISTINCT unterschiedliche Werte.', hint: 'Unterscheide gezählte Datensätze, unterschiedliche Personen und die Richtung von follows.' },
  { question: 'Welche Verbindung zählt die Follower eines Mitglieds?', options: [['a', 'users.id = follows.following_id', true], ['b', 'users.id = follows.follower_id', false], ['c', 'users.id = follows.id', false], ['d', 'photos.id = follows.following_id', false]], success: 'Korrekt: following_id zeigt auf das Mitglied mit den Followern.', hint: 'Die folgende Person steht in follower_id.' },
  { question: 'Welche Aussagen zur Abfrage nach Leipziger Mitgliedern und ihren Fotos stimmen?', options: [['a', 'users.id = photos.user_id verbindet Foto und hochladende Person.', true], ['b', "users.city = 'Leipzig' ist eine zusätzliche Auswahlbedingung.", true], ['c', 'photos.user_id bezeichnet die Person, die das Foto liked.', false], ['d', 'GROUP BY ist nötig, um nur Leipziger Zeilen auszuwählen.', false]], success: 'Korrekt: Verbindung und Auswahlbedingung haben unterschiedliche Aufgaben.', hint: 'Trenne die Schlüsselverbindung von der Stadtbedingung.' }
];
const state = { tab: 'intro', introStep: 1, answers: {}, completed: {}, quiz: {}, quizPassed: false, feedback: {}, results: {}, server: {}, quizFeedback: '' };
let database;
let databaseReady = false;

function el(tag, className = '', value) { const node = document.createElement(tag); node.className = className; if (value !== undefined) node.textContent = value; return node; }
function richText(tag, value, className = '') { const node = el(tag, className); const parts = value.split(/\*\*(.*?)\*\*/g); parts.forEach((part, index) => node.append(index % 2 ? el('strong', '', part) : document.createTextNode(part))); return node; }
function save() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ tab: state.tab, introStep: state.introStep, answers: state.answers, completed: state.completed, assessmentVersions: Object.fromEntries(REQUIRED.filter((task) => task.assessmentVersion).map((task) => [task.id, task.assessmentVersion])), quiz: state.quiz, quizPassed: state.quizPassed })); } catch { /* Ohne Speicher bleibt das Modul bedienbar. */ } }
function selected(questionIndex) { return Array.isArray(state.quiz[questionIndex]) ? state.quiz[questionIndex] : []; }
function quizCorrect(questionIndex) { const actual = [...new Set(selected(questionIndex))].sort(); const right = QUIZ[questionIndex].options.filter((option) => option[2]).map((option) => option[0]).sort(); return actual.length === right.length && actual.every((value, index) => value === right[index]); }
function allRequiredDone() { return REQUIRED.every((task) => state.completed[task.id] === state.answers[task.id] && Boolean(state.answers[task.id]?.trim())); }
function unlocked() { return allRequiredDone() && state.quizPassed && QUIZ.every((_, index) => quizCorrect(index)); }
function restore() {
  try {
    const savedText = localStorage.getItem(STORAGE_KEY);
    if (savedText === null) return;
    const saved = JSON.parse(savedText);
    if (!saved || typeof saved !== 'object' || Array.isArray(saved)) return;
    if (saved.answers && typeof saved.answers === 'object' && !Array.isArray(saved.answers)) for (const [id, value] of Object.entries(saved.answers)) if (ALL_TASKS.has(id) && typeof value === 'string' && value.length <= 20000) state.answers[id] = value;
    if (saved.completed && typeof saved.completed === 'object' && !Array.isArray(saved.completed)) for (const task of REQUIRED) if ((!task.assessmentVersion || saved.assessmentVersions?.[task.id] === task.assessmentVersion) && typeof saved.completed[task.id] === 'string' && saved.completed[task.id] === state.answers[task.id] && saved.completed[task.id].trim()) state.completed[task.id] = saved.completed[task.id];
    if (saved.quiz && typeof saved.quiz === 'object' && !Array.isArray(saved.quiz)) QUIZ.forEach((question, index) => { const values = saved.quiz[index]; if (Array.isArray(values)) state.quiz[index] = [...new Set(values.filter((value) => typeof value === 'string' && question.options.some(([id]) => id === value)))]; });
    state.quizPassed = saved.quizPassed === true && QUIZ.every((_, index) => quizCorrect(index));
    state.introStep = Number.isInteger(saved.introStep) && saved.introStep >= 1 && saved.introStep <= 12 ? saved.introStep : 1;
    if (TABS.some(([id]) => id === saved.tab)) state.tab = saved.tab;
    if (state.tab === 'summary' && !unlocked()) state.tab = 'quiz';
    save(); // Geänderte Rubrikfreigaben einmalig im vorhandenen Stand bereinigen.
  } catch { /* Beschädigter oder gesperrter Speicher ist optional. */ }
}
function updateUnlock() {
  const tab = document.getElementById('tab-summary');
  if (tab) { tab.disabled = !unlocked(); tab.setAttribute('aria-disabled', String(!unlocked())); }
  document.getElementById('summary-lock-reason').hidden = unlocked();
  if (state.tab === 'summary' && !unlocked()) activate('quiz');
}
function activate(id, { focusContent = false } = {}) {
  if (id === 'summary' && !unlocked()) return;
  state.tab = id; save(); render();
  if (focusContent) focusTabPanelStart(document.getElementById('sql-panel'));
}
function heading(number, title, kicker) { const box = el('div', 'step-heading'); box.append(el('span', 'step-number', String(number))); const copy = el('div'); copy.append(el('p', 'step-kicker', kicker), el('h2', '', title)); box.append(copy); return box; }
function render() {
  const tablist = document.getElementById('sql-tabs'); tablist.replaceChildren();
  TABS.forEach(([id, label], index) => { const button = el('button', 'step-tab', `${index + 1}. ${label}`); button.type = 'button'; button.id = `tab-${id}`; button.dataset.tab = id; button.role = 'tab'; button.setAttribute('aria-controls', 'sql-panel'); button.disabled = id === 'summary' && !unlocked(); button.setAttribute('aria-disabled', String(button.disabled)); button.addEventListener('click', () => activate(id)); tablist.append(button); });
  enableTabKeyboardNavigation(tablist); syncTabSemantics(tablist, state.tab);
  document.getElementById('summary-lock-reason').hidden = unlocked();
  const panel = document.getElementById('sql-panel'); panel.replaceChildren(); panel.setAttribute('aria-labelledby', `tab-${state.tab}`);
  const number = TABS.findIndex(([id]) => id === state.tab) + 1;
  panel.append(heading(number, TABS[number - 1][1], state.tab === 'extra' ? 'Vertiefen' : state.tab === 'quiz' || state.tab === 'summary' ? 'Sichern' : 'Üben'));
  if (state.tab === 'intro') renderIntro(panel);
  if (state.tab === 'practice') JOIN_TASKS.filter((task) => task.required && Number(task.id.slice(1)) <= 6).forEach((task) => panel.append(renderTask(task)));
  if (state.tab === 'count') renderCount(panel);
  if (state.tab === 'extra') renderExtra(panel);
  if (state.tab === 'quiz') renderQuiz(panel);
  if (state.tab === 'summary') renderSummary(panel);
  if (state.tab === 'quiz' || state.tab === 'summary') appendSolutionDownloadFromTemplate(panel);
  if (state.tab === 'extra') { const nav = el('nav', 'tab-flow-navigation'); nav.setAttribute('aria-label', 'Zum Pflichtweg zurück'); [['count', 'Zurück: 3. Verbinden und zählen'], ['quiz', 'Weiter: 6. Abschlussquiz']].forEach(([id, label]) => { const button = el('button', 'primary-button tab-flow-button', label); button.type = 'button'; button.addEventListener('click', () => activate(id, { focusContent: true })); nav.append(button); }); panel.append(nav); }
  else if (state.tab !== 'summary') renderTabFlowNavigation(panel, { items: FLOW, currentId: state.tab, onNavigate: activate, isEnabled: (id) => id !== 'summary' || unlocked() });
}
function code(text) { return el('pre', 'given-sql', text); }
function renderIntro(panel) {
  const phases = ['1 · Auftrag', '2 · Tabellen und Schlüssel', '3 · Fotos zuordnen', '4 · Ergebnis bilden'];
  const steps = [
    { phase: 1, explanation: 'Welche Foto-URLs gehören zum Mitglied wanderwut_finn?' },
    { phase: 2, explanation: 'FROM users, photos nennt die beiden Tabellen. Jede Fotozeile enthält in user_id die ID der hochladenden Person.', clause: 1 },
    { phase: 2, explanation: 'Wir betrachten Finn: In users hat er die ID 2. Die zusätzliche Bedingung users.id = 2 wählt dieses Mitglied aus.', clause: 3, userId: true },
    { phase: 2, explanation: 'Ein Foto gehört zu Finn, wenn seine user_id gleich Finns users.id ist. users.id = photos.user_id ist die Verknüpfungsbedingung.', clause: 2, join: true },
    { phase: 3, explanation: 'Foto 1 hat user_id 1. Das ist nicht Finns ID 2; diese Zeile kommt nicht in sein Ergebnis.', photoId: 1 },
    { phase: 3, explanation: 'Foto 7 hat user_id 2. Es gehört zu Finn und erscheint im Ergebnis.', photoId: 7 },
    { phase: 3, explanation: 'Auch Foto 8 hat user_id 2. Ein Mitglied kann mehrere Fotos hochladen.', photoId: 8 },
    { phase: 3, explanation: 'Foto 9 hat ebenfalls user_id 2 und wird mit Finn verbunden.', photoId: 9 },
    { phase: 3, explanation: 'Foto 10 hat user_id 2 und wird ebenfalls übernommen.', photoId: 10 },
    { phase: 3, explanation: 'Foto 11 hat user_id 3. Es gehört zu einer anderen Person und wird nicht übernommen.', photoId: 11 },
    { phase: 4, explanation: 'SELECT gibt für jedes passende Foto Finns Benutzernamen und die Foto-URL aus. ORDER BY photos.id ordnet die vier Zeilen nach der Foto-ID.', clause: [0, 4] },
    { phase: 4, explanation: 'Merke: Eine Verknüpfungsbedingung verbindet Zeilen über passende Schlüsselwerte. Eine zusätzliche Auswahlbedingung grenzt die Treffer ein; die Quelltabellen bleiben unverändert.', clause: -1 }
  ];
  const users = [[1, 'zornigerfotograf'], [2, 'wanderwut_finn'], [3, 'bergcoder']];
  const photos = [[1, 1, 'storage/photos/2/1.webp'], [7, 2, 'storage/photos/2/7.webp'], [8, 2, 'storage/photos/2/8.webp'], [9, 2, 'storage/photos/2/9.webp'], [10, 2, 'storage/photos/2/10.webp'], [11, 3, 'storage/photos/2/11.webp']];
  const clauses = ['SELECT users.username, photos.url', 'FROM users, photos', 'WHERE users.id = photos.user_id', '  AND users.id = 2', 'ORDER BY photos.id'];
  const card = el('section', 'task-card sql9-intro'); card.setAttribute('aria-labelledby', 'join-intro-title');
  const title = el('h3', '', 'Verbund Schritt für Schritt'); title.id = 'join-intro-title';
  card.append(title, richText('p', '**Verfolge** die Animation mit „Weiter“ und „Zurück“. Beobachte, welche Fotos zu Finn gehören und warum nur diese in der Ergebnisrelation erscheinen.'));
  const heading = el('div', 'sql9-intro-heading'); const progress = el('div', 'sql9-intro-progress');
  phases.forEach((phase) => progress.append(el('span', '', phase)));
  const stepper = el('div', 'intro-stepper'); const previous = el('button', 'secondary-button', 'Zurück'); previous.type = 'button'; previous.setAttribute('aria-label', 'Einen Animationsschritt zurück');
  const count = el('span', '', ''); count.id = 'intro-frame-count'; count.setAttribute('aria-live', 'polite');
  const next = el('button', 'primary-button', 'Weiter'); next.type = 'button'; next.setAttribute('aria-label', 'Einen Animationsschritt weiter');
  stepper.append(previous, count, next); heading.append(progress, stepper); card.append(heading);
  const workspace = el('div', 'sql9-intro-workspace'); const visual = el('div', 'sql9-intro-visual');
  const explanation = el('p', 'intro-explanation'); explanation.id = 'intro-explanation'; explanation.setAttribute('aria-live', 'polite');
  const sql = el('pre', 'given-sql sql9-intro-sql'); sql.id = 'intro-sql'; const sqlCode = el('code');
  clauses.forEach((line, index) => { const clause = el('span', '', line); clause.dataset.clause = String(index); sqlCode.append(clause); }); sql.append(sqlCode);
  const source = el('div', 'sql9-intro-sources');
  const makeTable = (name, headers, rows, selectedColumns = []) => {
    const wrap = el('div', 'sql9-intro-table table-scroll'); wrap.tabIndex = 0; wrap.setAttribute('role', 'group'); wrap.setAttribute('aria-label', `${name} – tabellarischer Ausschnitt`);
    const table = document.createElement('table'); table.className = 'data-table sql9-intro-source-table';
    const caption = document.createElement('caption'); caption.textContent = name === 'users' ? 'users – Ausschnitt (id: int, username: varchar(255), …)' : 'photos – Ausschnitt (id: int, user_id: int, url: varchar(255), …)'; table.append(caption);
    const thead = document.createElement('thead'); const headerRow = document.createElement('tr');
    headers.forEach((header, index) => { const th = document.createElement('th'); th.scope = 'col'; th.textContent = header; if (selectedColumns.includes(index)) th.classList.add('is-selected'); headerRow.append(th); }); thead.append(headerRow); table.append(thead);
    const tbody = document.createElement('tbody');
    rows.forEach((row) => { const tr = document.createElement('tr'); tr.dataset.rowId = String(row[0]);
      row.forEach((value, index) => { const td = document.createElement('td'); td.textContent = String(value); if (selectedColumns.includes(index)) td.classList.add('is-selected'); tr.append(td); }); tbody.append(tr); });
    table.append(tbody); wrap.append(table); return wrap;
  };
  const usersTable = makeTable('users', ['id', 'username'], users); usersTable.id = 'intro-users-table';
  const photosTable = makeTable('photos', ['id', 'user_id', 'url'], photos); photosTable.id = 'intro-photos-table'; source.append(usersTable, photosTable);
  const resultCard = el('div', 'sql9-result-card'); resultCard.append(el('h4', '', 'Ergebnisrelation'));
  const resultWrap = el('div', 'sql9-intro-table table-scroll'); resultWrap.tabIndex = 0; resultWrap.setAttribute('role', 'group'); resultWrap.setAttribute('aria-label', 'Ergebnisrelation mit Finns Foto-URLs');
  const resultTable = document.createElement('table'); resultTable.className = 'data-table sql9-result-table'; resultTable.id = 'intro-result-table'; const resultCaption = document.createElement('caption'); resultCaption.textContent = 'Ergebnisrelation – username, url'; resultTable.append(resultCaption);
  const resultHead = document.createElement('thead'); const resultHeader = document.createElement('tr'); ['username', 'url'].forEach((label) => { const th = document.createElement('th'); th.scope = 'col'; th.textContent = label; resultHeader.append(th); }); resultHead.append(resultHeader); resultTable.append(resultHead);
  const resultBody = document.createElement('tbody'); resultBody.id = 'intro-result-body'; resultTable.append(resultBody); resultWrap.append(resultTable); resultCard.append(resultWrap);
  const resultNote = el('p', 'sql9-result-note'); resultNote.id = 'intro-result-note'; resultNote.setAttribute('aria-live', 'polite'); resultCard.append(resultNote);
  visual.append(explanation, sql, source); workspace.append(visual, resultCard); card.append(workspace); appendHints(card, [
    'Vergleiche Finns ID in users mit user_id der gerade markierten Fotozeile.',
    'Gleiche Zahlen zeigen, welche Person ein Foto hochgeladen hat. Achte zusätzlich darauf, dass nur Finn mit users.id = 2 ausgewählt ist.',
    'Bei den Fotos 7, 8, 9 und 10 ist user_id = 2; deshalb erscheinen genau diese vier Fotos für Finn.'
  ]); panel.append(card);
  function update() {
    const step = steps[state.introStep - 1]; count.textContent = `Schritt ${state.introStep} von 12`;
    progress.querySelectorAll('span').forEach((node, index) => { node.className = index + 1 === step.phase ? 'is-active' : index + 1 < step.phase ? 'is-complete' : ''; if (index + 1 === step.phase) node.setAttribute('aria-current', 'step'); else node.removeAttribute('aria-current'); });
    explanation.textContent = step.explanation;
    previous.disabled = state.introStep === 1; next.textContent = state.introStep === 12 ? 'Erneut abspielen' : 'Weiter'; next.setAttribute('aria-label', state.introStep === 12 ? 'Erneut abspielen' : 'Einen Animationsschritt weiter');
    const activeClauses = Array.isArray(step.clause) ? step.clause.map(String) : [String(step.clause)];
    sqlCode.querySelectorAll('span').forEach((node) => { node.classList.toggle('is-active-clause', activeClauses.includes(node.dataset.clause) || (state.introStep >= 5 && state.introStep <= 10 && ['2', '3'].includes(node.dataset.clause))); });
    usersTable.querySelectorAll('tbody tr').forEach((row) => { row.classList.toggle('is-active', Boolean(step.userId) && row.dataset.rowId === '2'); row.querySelectorAll('td').forEach((cell) => cell.classList.toggle('is-selected', Boolean(step.join) && cell.cellIndex === 0)); });
    usersTable.querySelectorAll('thead th').forEach((cell) => cell.classList.toggle('is-selected', Boolean(step.join) && cell.cellIndex === 0));
    photosTable.querySelectorAll('th, td').forEach((cell) => cell.classList.toggle('is-selected', Boolean(step.join) && cell.cellIndex === 1));
    photosTable.querySelectorAll('tbody tr').forEach((row) => {
      row.classList.toggle('is-active', Number(row.dataset.rowId) === step.photoId);
      row.querySelectorAll('td').forEach((cell) => cell.classList.toggle('is-selected', (Boolean(step.join) && cell.cellIndex === 1) || (Boolean(step.userId) && row.dataset.rowId === '7' && cell.cellIndex === 1)));
    });
    resultBody.replaceChildren();
    const included = state.introStep >= 6 ? photos.filter(([id]) => id >= 7 && id <= 10 && (state.introStep >= 10 || id <= step.photoId)) : [];
    included.forEach(([, , url]) => { const row = document.createElement('tr'); [ 'wanderwut_finn', url ].forEach((value) => { const cell = document.createElement('td'); cell.textContent = value; row.append(cell); }); resultBody.append(row); });
    resultNote.textContent = step.photoId === 1 || step.photoId === 11 ? 'Der Wert in photos.user_id verweist auf ein anderes Mitglied; diese Fotozeile gehört nicht zu Finns Ergebnis.' : state.introStep >= 6 && state.introStep <= 9 ? 'Der Wert in photos.user_id ist 2 und verweist damit auf Finn (users.id = 2).' : '';
  }
  const change = (direction) => { state.introStep = direction > 0 && state.introStep === 12 ? 1 : Math.max(1, Math.min(12, state.introStep + direction)); save(); update(); };
  previous.addEventListener('click', () => change(-1)); next.addEventListener('click', () => change(1)); update();
}
function renderCount(panel) {
  JOIN_TASKS.filter((task) => ['P7', 'P8'].includes(task.id)).forEach((task) => panel.append(renderTask(task)));
  const example = el('section', 'scenario-card accent join-example'); example.append(code('SELECT users.username, COUNT(photos.id) AS anzahl_fotos\nFROM users, photos\nWHERE users.id = photos.user_id\n  AND users.id <= 2\nGROUP BY users.id, users.username\nORDER BY users.id'));
  example.append(renderRelation({ columns: ['username', 'anzahl_fotos'], values: [['zornigerfotograf', 6], ['wanderwut_finn', 4]] }, { title: 'Ergebnisrelation' }));
  example.append(el('p', '', 'GROUP BY bildet aus den verbundenen Zeilen je Mitglied eine Gruppe. COUNT(photos.id) zählt die Fotos innerhalb jeder Gruppe. Ohne passenden Fotoeintrag entsteht bei dieser inneren Verbindung keine Gruppe.')); panel.append(example);
  panel.append(renderTask(ALL_TASKS.get('P9')));
  panel.append(el('p', 'scenario-card accent', 'In follows können zwei Zeilen dieselbe folgende Person nennen. COUNT(DISTINCT follower_id) zählt diese Person nur einmal.'));
  ['P10', 'P11', 'P12'].forEach((id) => panel.append(renderTask(ALL_TASKS.get(id))));
}
function renderExtra(panel) {
  panel.append(el('p', 'scenario-card accent', 'Diese 13 Aufgaben sind freiwillig. Sie zählen nicht zum Abschluss des Pflichtwegs.'));
  const groups = [['Weitere Verbindungen', 1, 4], ['Top 10', 5, 8], ['Gruppen filtern', 9, 10], ['Unterabfragen', 11, 13]];
  groups.forEach(([title, first, last]) => { panel.append(el('h3', '', title)); for (let number = first; number <= last; number += 1) {
    if (number === 9) { panel.append(el('p', 'scenario-card accent', 'GROUP BY bildet die Fotogruppen; HAVING COUNT(tags.id) = 2 behält Gruppen mit genau zwei Hashtag-Zeilen. WHERE filtert dagegen einzelne Zeilen vor dem Gruppieren.')); panel.append(renderRelation({ columns: ['photo_id', 'name'], values: [[9, 'soundon'], [9, 'musikliebhaber']] }, { title: 'Zwei Hashtag-Zeilen zu Foto 9' })); }
    if (number === 11) { const intro = el('div', 'scenario-card accent'); intro.append(el('p', '', 'Eine Unterabfrage liefert Werte für die äußere Abfrage. Zuerst findet die innere Abfrage die Mitglieds-ID von wanderwut_finn:'), code("SELECT id\nFROM users\nWHERE username = 'wanderwut_finn'"), el('p', '', 'Das Ergebnis ist 2. Die äußere Abfrage kann danach mit diesem Wert weiter suchen.')); panel.append(intro); }
    panel.append(renderTask(ALL_TASKS.get(`Z${number}`)));
  } });
}
function taskSchemas(task) {
  const references = [...task.statement.matchAll(/\b(users|photos|follows|comments|likes|tags)\.([a-z_]+)\b/gi)];
  return task.tables.map((table) => ({ table, columns: Object.entries(TABLE_COLUMNS[table]).filter(([column]) => column === 'id' || references.some((match) => match[1].toLowerCase() === table && match[2].toLowerCase() === column)) }));
}
function renderTask(task) {
  const card = el('section', 'task-card sql-task'); card.id = `task-${task.id}`;
  card.append(el('h3', '', `Aufgabe ${task.id}`), richText('p', task.prompt), schemaCard(taskSchemas(task)));
  if (task.type === 'describe') card.append(code(task.statement));
  const label = el('label', 'sql-label', task.type === 'sql' ? 'Deine vollständige SQL-Anweisung' : 'Deine Erklärung');
  const input = el('textarea', task.type === 'sql' ? 'sql-input' : 'description-input'); input.id = `input-${task.id}`; label.htmlFor = input.id;
  input.value = state.answers[task.id] || ''; input.spellcheck = false; input.placeholder = task.type === 'sql' ? 'SELECT ...\nFROM ...' : '';
  input.addEventListener('input', () => { state.answers[task.id] = input.value; delete state.completed[task.id]; delete state.feedback[task.id]; delete state.results[task.id]; delete state.server[task.id]; save(); renderFeedback(task, card); updateUnlock(); });
  card.append(label, input); appendHints(card, task.hints);
  const actions = el('div', 'action-row'); const button = el('button', 'primary-button', task.type === 'sql' ? 'Anfrage ausführen' : 'Erklärung prüfen'); button.type = 'button'; button.disabled = task.type === 'sql' && !databaseReady; button.addEventListener('click', () => task.type === 'sql' ? checkSql(task, card) : checkDescription(task, card)); actions.append(button); if (task.type === 'sql') actions.append(el('span', 'shortcut-hint', 'Strg/Cmd + Enter')); card.append(actions);
  if (task.type === 'sql') input.addEventListener('keydown', (event) => { if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') { event.preventDefault(); checkSql(task, card); } });
  renderFeedback(task, card); return card;
}
function renderFeedback(task, card) {
  card.querySelectorAll('.sql-feedback, .result-relation, .server-feedback').forEach((node) => node.remove());
  const feedback = state.feedback[task.id]; if (feedback) { const box = el('p', `feedback ${feedback.level} sql-feedback`, feedback.text); box.setAttribute('aria-live', 'polite'); card.append(box); }
  if (state.results[task.id]) card.append(renderRelation(state.results[task.id]));
  renderServerFeedback(task, card, state.server[task.id]);
}
function requiredStructure(task, sql) {
  const tokens = sqlTokens(sql); const upper = tokens.filter((token) => token.type === 'word').map((token) => token.value.toUpperCase());
  const specifiedHint = `${task.feedback.partial} ${task.hints[2]}`;
  if (['P9', 'P10', 'Z5', 'Z6', 'Z7', 'Z8', 'Z9', 'Z10'].includes(task.id) && !upper.includes('GROUP')) return specifiedHint;
  if (['Z9', 'Z10'].includes(task.id) && !upper.includes('HAVING')) return specifiedHint;
  if (['Z11', 'Z12', 'Z13'].includes(task.id)) {
    let depth = 0; let nestedSelect = false;
    for (const token of tokens) {
      if (token.value === '(') depth += 1;
      else if (token.value === ')') depth -= 1;
      else if (depth > 0 && token.type === 'word' && token.value.toUpperCase() === 'SELECT') nestedSelect = true;
    }
    if (!nestedSelect) return specifiedHint;
  }
  const edges = EDGES[task.id] || []; if (!edges.length) return null;
  const analysis = analyzeMultiTableSelect(sql, taskSchemas(task));
  const aliases = analysis?.tableAliases || new Map();
  const resolve = (part) => { const [table, column] = part.split('.'); return `${(aliases.get(table) || table).toLowerCase()}.${column}`; };
  const equalities = [];
  for (let i = 0; i < tokens.length - 6; i += 1) {
    const part = tokens.slice(i, i + 7);
    if (part[0].type === 'word' && part[1].value === '.' && part[2].type === 'word' && part[3].value === '=' && part[4].type === 'word' && part[5].value === '.' && part[6].type === 'word') equalities.push([`${part[0].value.toLowerCase()}.${part[2].value.toLowerCase()}`, `${part[4].value.toLowerCase()}.${part[6].value.toLowerCase()}`]);
  }
  return edges.every(([left, right]) => equalities.some(([a, b]) => (a === resolve(left) && b === resolve(right)) || (a === resolve(right) && b === resolve(left)))) ? null : specifiedHint;
}
function projectedFields(task, sql) {
  const tokens = sqlTokens(sql); const analysis = analyzeMultiTableSelect(sql, taskSchemas(task));
  const aliases = analysis?.tableAliases || new Map();
  const schemas = taskSchemas(task);
  const fields = new Set(); let depth = 0; let inProjection = false;
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (token.value === '(') depth += 1;
    else if (token.value === ')') depth -= 1;
    if (depth === 0 && token.type === 'word' && token.value.toUpperCase() === 'SELECT' && !inProjection) { inProjection = true; continue; }
    if (depth === 0 && inProjection && token.type === 'word' && token.value.toUpperCase() === 'FROM') break;
    if (inProjection && token.type === 'word' && token.value.toUpperCase() === 'COUNT' && tokens[index + 1]?.value === '(') fields.add('aggregate:count');
    if (inProjection && token.type === 'word' && tokens[index + 1]?.value === '.' && tokens[index + 2]?.type === 'word') {
      const table = [...aliases].find(([name, alias]) => name.toLowerCase() === token.value.toLowerCase())?.[0] || token.value;
      const canonical = [...aliases].find(([name, alias]) => alias.toLowerCase() === token.value.toLowerCase())?.[0] || table;
      fields.add(`${canonical.toLowerCase()}.${tokens[index + 2].value.toLowerCase()}`);
    } else if (inProjection && token.type === 'word' && !['AS', '.', 'COUNT'].includes(tokens[index - 1]?.value.toUpperCase()) && tokens[index - 1]?.value !== '.') {
      const candidates = schemas.filter(({ table, columns }) => analysis?.tables.some((used) => used.toLowerCase() === table) && columns.some(([column]) => column.toLowerCase() === token.value.toLowerCase()));
      if (candidates.length === 1) fields.add(`${candidates[0].table}.${token.value.toLowerCase()}`);
    }
  }
  return fields;
}
function hasPartialSqlResult(task, sql, actual) {
  if (!actual.columns.length || !actual.values.length) return false;
  const referenceFields = projectedFields(task, task.statement);
  return [...projectedFields(task, sql)].some((field) => referenceFields.has(field));
}
async function checkSql(task, card) {
  const input = card.querySelector('textarea'); const button = card.querySelector('.primary-button'); if (button.disabled) return;
  const checked = validateSelectStatement(input.value); if (!checked.ok) { state.feedback[task.id] = { level: 'hint', text: checked.message }; renderFeedback(task, card); return; }
  if (!databaseReady) { state.feedback[task.id] = { level: 'hint', text: 'Daten werden geladen …' }; renderFeedback(task, card); return; }
  const answer = input.value; button.disabled = true; state.feedback[task.id] = { level: 'hint', text: 'Die Anfrage wird ausgeführt …' }; renderFeedback(task, card);
  try {
    const actual = await database.exec(checked.sql); const expected = await database.exec(task.statement);
    if (input.value !== answer) return;
    const comparison = compareRelations(actual, expected, { columnOrder: true, columnLabels: ['P7', 'P12'].includes(task.id), rowOrder: /Sortiere/i.test(task.prompt) });
    const structure = requiredStructure(task, checked.sql);
    if (comparison.correct && actual.columns.length && actual.values.length && !structure) { state.feedback[task.id] = { level: 'success', text: task.feedback.success }; state.results[task.id] = actual; if (task.required) state.completed[task.id] = answer; }
    else { const partial = hasPartialSqlResult(task, checked.sql, actual); delete state.completed[task.id]; delete state.results[task.id]; state.feedback[task.id] = { level: partial ? 'partial' : 'hint', text: partial ? structure || `${task.feedback.partial} ${comparison.reason || ''}`.trim() : task.feedback.hint }; }
  } catch (error) { if (input.value !== answer) return; delete state.completed[task.id]; delete state.results[task.id]; state.feedback[task.id] = { level: 'error', text: /no such table/i.test(String(error)) ? 'FROM: Prüfe den Namen einer der sechs geladenen Tabellen.' : diagnoseSqlError(error, checked.sql) }; }
  finally { button.disabled = !databaseReady; if (input.value === answer) { save(); renderFeedback(task, card); updateUnlock(); if (unlocked() && task.required) activate('summary', { focusContent: true }); } }
}
async function checkDescription(task, card) {
  const input = card.querySelector('textarea'); const button = card.querySelector('.primary-button'); if (button.disabled) return;
  const answer = input.value.trim(); if (answer.length < 10) { state.server[task.id] = { level: 'error', text: 'Bitte formuliere eine etwas ausführlichere Antwort.' }; renderFeedback(task, card); return; }
  button.disabled = true; state.server[task.id] = { level: 'loading', text: 'Deine Erklärung wird geprüft …' }; renderFeedback(task, card);
  try {
    const result = await evaluateSemanticAnswer({ serverUrl: SCRIPT_SERVER_URL, taskId: `inf10-db-a9-${task.id.toLowerCase()}`, answer });
    if (input.value.trim() !== answer) return;
    const feedback = classifyDescriptionResult(result);
    if (feedback.level === 'error' || !['korrekt', 'teilweise korrekt', 'noch nicht korrekt'].includes(feedback.status) || !Number.isInteger(feedback.points) || feedback.maxPoints !== task.maxPoints || feedback.points < 0 || feedback.points > task.maxPoints || (feedback.status === 'korrekt') !== (feedback.points === task.maxPoints)) throw new Error('Ungültige Auswertung');
    state.server[task.id] = feedback; if (feedback.points === task.maxPoints && feedback.status === 'korrekt') state.completed[task.id] = input.value; else delete state.completed[task.id];
  } catch { if (input.value.trim() !== answer) return; delete state.completed[task.id]; state.server[task.id] = { level: 'error', text: 'Die Auswertung ist gerade nicht erreichbar. Deine Eingabe bleibt erhalten; versuche es erneut.' }; }
  finally { button.disabled = false; if (input.value.trim() === answer) { save(); renderFeedback(task, card); updateUnlock(); if (unlocked()) activate('summary', { focusContent: true }); } }
}
function renderQuiz(panel) {
  const form = el('form', 'join-quiz'); form.id = 'final-quiz'; form.append(richText('p', '**Kreuze** bei jeder Frage alle richtigen Antworten an. Prüfe jede Frage einzeln oder werte anschließend das ganze Quiz aus.'));
  const items = QUIZ.map((question, index) => { const fieldset = el('fieldset'); fieldset.append(el('legend', '', `${index + 1}. ${question.question}`)); question.options.forEach(([id, text]) => { const label = el('label'); const box = el('input'); box.type = 'checkbox'; box.name = `quiz-${index + 1}`; box.value = id; box.checked = selected(index).includes(id); box.addEventListener('change', () => { state.quiz[index] = [...fieldset.querySelectorAll('input:checked')].map((input) => input.value); state.quizPassed = false; state.quizFeedback = ''; save(); updateUnlock(); form.querySelector('.quiz-total-feedback')?.replaceChildren(); form.querySelector('.sql-quiz-overview')?.remove(); }); label.append(box, document.createTextNode(text)); fieldset.append(label); }); form.append(fieldset); return { fieldset, solution: question.options.filter((option) => option[2]).map((option) => option[0]), success: question.success, hint: question.hint }; });
  const submit = el('button', 'primary-button', 'Quiz prüfen'); submit.type = 'submit'; form.append(submit); const feedback = el('p', 'feedback hint quiz-total-feedback', state.quizFeedback); feedback.setAttribute('aria-live', 'polite'); form.append(feedback);
  let checks;
  form.addEventListener('submit', (event) => { event.preventDefault(); checks?.checkAll(); const count = QUIZ.filter((_, index) => quizCorrect(index)).length; const empty = QUIZ.some((_, index) => !selected(index).length);
    if (empty) state.quizFeedback = 'Kreuze bei jeder Frage mindestens eine Antwort an.';
    else if (count === 4) { state.quizPassed = true; state.quizFeedback = allRequiredDone() ? 'Korrekt: Alle vier Fragen stimmen. Die Auswertung ist freigeschaltet.' : 'Korrekt: Alle vier Fragen stimmen. Die Auswertung ist nach den zwölf Pflichtaufgaben freigeschaltet.'; }
    else { state.quizPassed = false; state.quizFeedback = count ? 'Teilweise korrekt: Prüfe die Fragen mit fehlenden oder falschen Kreuzen erneut.' : 'Noch nicht korrekt: Vergleiche die Schlüssel, Zählweisen und Auswahlbedingungen noch einmal.'; }
    feedback.textContent = state.quizFeedback; feedback.className = `feedback ${count === 4 ? 'success' : count ? 'partial' : 'hint'} quiz-total-feedback`; save(); updateUnlock(); form.querySelector('.sql-quiz-overview')?.remove(); if (state.quizPassed) form.append(quizOverview()); if (unlocked()) activate('summary', { focusContent: true });
  });
  checks = window.addQuizQuestionChecks({ questions: items, buttonClass: 'primary-button', rowClass: 'action-row', feedbackClass: 'feedback', levels: { high: 'success', medium: 'partial', low: 'hint' }, onAllCorrect: () => form.requestSubmit() });
  if (state.quizPassed) form.append(quizOverview()); panel.append(form);
  if (!unlocked()) panel.append(el('p', 'feedback hint', `Die Auswertung bleibt gesperrt, bis alle zwölf Pflichtaufgaben korrekt geprüft und das Abschlussquiz bestanden sind. Derzeit erledigt: ${REQUIRED.filter((task) => state.completed[task.id] === state.answers[task.id] && Boolean(state.answers[task.id]?.trim())).length} von 12.`));
}
function quizOverview() { const section = el('section', 'short-summary sql-quiz-overview'); section.append(el('h3', '', 'Richtige Antworten im Abschlussquiz')); const list = el('ol'); QUIZ.forEach((question) => { const item = el('li'); item.append(el('strong', '', question.question)); const answers = el('ul'); question.options.filter((option) => option[2]).forEach((option) => answers.append(el('li', '', option[1]))); item.append(answers); list.append(item); }); section.append(list); return section; }
function renderSummary(panel) {
  if (!unlocked()) { panel.append(el('p', 'feedback hint', 'Die Auswertung bleibt gesperrt, bis alle zwölf Pflichtaufgaben korrekt geprüft und das Abschlussquiz bestanden sind.')); return; }
  panel.append(el('p', '', 'Vergleiche deine Antworten mit möglichen fachlich richtigen Lösungen. Bei SQL gibt es oft mehrere gleichwertige Schreibweisen.'));
  REQUIRED.forEach((task) => { const card = el('section', 'task-card'); card.append(el('h3', '', `Aufgabe ${task.id}`), richText('p', task.prompt), el('h4', '', 'Deine Antwort'), code(state.answers[task.id] || '')); card.append(el('h4', '', 'Eine mögliche fachlich richtige Lösung')); card.append(task.type === 'sql' ? code(task.statement) : el('p', '', task.model)); panel.append(card); });
  panel.append(el('p', 'short-summary', 'Ein Verbund verbindet passende Schlüsselwerte. COUNT zählt Zeilen oder mit DISTINCT verschiedene Werte; GROUP BY zählt pro Gruppe. Bei follows zeigt following_id auf die Person mit den Followern.'));
}
async function loadDatabase() {
  const status = document.getElementById('data-status'); const retry = document.getElementById('reload-data'); status.textContent = 'Daten werden geladen …'; status.className = 'feedback hint'; status.setAttribute('aria-busy', 'true'); retry.hidden = true;
  try { database?.close(); database = new SqlWorker(); await database.init({ mode: 'instahub-joins' }); databaseReady = true; status.textContent = 'Alle sechs InstaHub-Tabellen sind geladen. Du kannst SQL-Anfragen ausführen.'; status.className = 'feedback success'; }
  catch (error) { databaseReady = false; const match = String(error.message || error).match(/[a-z]+\.csv/); status.textContent = `${match ? match[0] : 'Die Übungsdaten'} konnte nicht geladen werden. Bitte versuche es erneut.`; status.className = 'feedback error'; retry.hidden = false; console.error(error); }
  finally { status.setAttribute('aria-busy', 'false'); render(); }
}
document.addEventListener('DOMContentLoaded', () => { restore(); render(); document.getElementById('reload-data').addEventListener('click', loadDatabase); document.getElementById('reset-module').addEventListener('click', () => { if (window.confirm('Möchtest du alle Eingaben und den Fortschritt dieser Aufgabe zurücksetzen?')) { try { localStorage.removeItem(STORAGE_KEY); } catch { /* Ohne Speicher weiter nutzbar. */ } location.reload(); } }); window.addEventListener('beforeunload', () => database?.close()); loadDatabase(); });
