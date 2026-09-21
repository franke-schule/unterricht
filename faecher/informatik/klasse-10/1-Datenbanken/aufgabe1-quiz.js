import { classifyDescriptionResult, isValidScriptServerUrl } from './sql-lab-core.mjs?v=20260906b';

// Test zu Aufgabe 1: nicht verlinkte Seite, Auswertung erst nach der Abgabe.
const STORAGE_KEY = 'informatik10-datenbanken-aufgabe1-test-v1';
const SCRIPT_SERVER_URL = 'https://script.google.com/macros/s/AKfycby8RWL6uYrKZyoJ6m2GRpWyRmXjwsdskyCiqzKpRhIK5-wrDl-9lWWk8CiAGaVMoy0x/exec';
const DESCRIBE_TASK_ID = 'inf10-db-a1-primaerschluessel';
const DESCRIBE_MAX_POINTS = 3;

// Aufgabe 1: Lückentext. Drag-and-Drop-Bedienung nach setupCloze (Informatik 11, was-ist-ki/ui/task0.mjs).
const CLOZE_TERMS = [
  { key: 'Attribut', reason: 'Ein Attribut beschreibt eine einzelne Eigenschaft wie den Vornamen.' },
  { key: 'Datensatz/Zeile', reason: 'Alle Werte eines einzelnen Objekts stehen gemeinsam in einer Zeile, dem Datensatz.' },
  { key: 'Datentyp', reason: 'Ein Datentyp legt nur fest, welche Art von Werten eine Spalte aufnimmt. Er ist kein Teil der Übersetzung Klasse – Objekt – Attribut.' },
  { key: 'Klasse', reason: 'Die Klasse ist der Bauplan, der für alle gleichartigen Objekte festlegt, welche Attribute sie haben.' },
  { key: 'Objekt', reason: 'Ein Objekt ist ein konkretes Exemplar, das nach dem Bauplan der Klasse erzeugt wird.' },
  { key: 'Primärschlüssel', reason: 'Der Primärschlüssel ist ein besonderes Attribut, das jeden Datensatz eindeutig kennzeichnet. Er ist keiner der gesuchten Grundbegriffe.' },
  { key: 'Spalte', reason: 'Eine Spalte enthält für alle Datensätze die Werte derselben Eigenschaft – genau wie ein Attribut.' },
  { key: 'Tabelle', reason: 'Eine Klasse beschreibt viele gleichartige Objekte. In der Datenbank ist das die ganze Tabelle.' },
];
const CLOZE_SOLUTION = ['Klasse', 'Objekt', 'Attribut', 'Tabelle', 'Spalte', 'Datensatz/Zeile'];
const CLOZE_PARTS = [
  'In Java beschreibt eine ',
  ' den Bauplan, zum Beispiel für alle Lehrkräfte. Ein konkretes ',
  ' wie die Lehrkraft Berta Baumbart wird nach diesem Bauplan erzeugt. Eine einzelne Eigenschaft wie der Vorname heißt ',
  '. In der Datenbank wird aus der Klasse eine ',
  '. Jedes Attribut wird dort zu einer ',
  ', und jedes Objekt wird als ',
  ' gespeichert.',
];
const CLOZE_SLOTS = CLOZE_SOLUTION.map((_, index) => `gap-${index}`);

// Aufgabe 2: Zuordnung zu den vier SQL-Datentypen aus Aufgabe 1.
const TYPE_ZONES = [
  { id: 'integer', label: 'INTEGER' },
  { id: 'varchar', label: 'VARCHAR(n)' },
  { id: 'char', label: 'CHAR(n)' },
  { id: 'date', label: 'DATE' },
];
const TYPE_VALUES = [
  { key: 'w', label: '„w“ (Geschlecht, genau ein Zeichen)', zone: 'char', reason: 'Der Wert hat immer genau ein Zeichen. Text mit fester Länge speichert man als CHAR(n).' },
  { key: 'year', label: '2019 (Erscheinungsjahr)', zone: 'integer', reason: 'Eine Jahreszahl allein ist kein Datum im Format YYYY-MM-DD, sondern eine ganze Zahl.' },
  { key: 'anna', label: '„Anna-Maria“ (Vorname)', zone: 'varchar', reason: 'Vornamen sind unterschiedlich lang. Für Text mit variabler Länge nimmt man VARCHAR(n).' },
  { key: 'birth', label: "'2008-05-12' (Geburtsdatum)", zone: 'date', reason: 'Das Format YYYY-MM-DD kennzeichnet ein Datum.' },
  { key: 'bab', label: '„bab“ (Kürzel, immer genau drei Zeichen)', zone: 'char', reason: 'Alle Kürzel haben genau drei Zeichen. Bei fester Länge passt CHAR(n), hier CHAR(3).' },
  { key: 'age', label: '42 (Alter)', zone: 'integer', reason: 'Ein Alter ist eine ganze Zahl ohne Nachkommastellen.' },
  { key: 'hire', label: "'2024-08-01' (Einstellungsdatum)", zone: 'date', reason: 'Auch dieser Wert hat das Datumsformat YYYY-MM-DD.' },
  { key: 'name', label: '„Baumbart“ (Nachname)', zone: 'varchar', reason: 'Nachnamen haben unterschiedliche Längen. Deshalb passt VARCHAR(n) mit einer Höchstlänge.' },
];

// Aufgabe 3: Multiple Choice mit Auswahlkästchen wie #final-quiz in grundlagen.js.
const MC_QUESTIONS = [
  {
    id: 'q1',
    text: 'Welche Aussagen über die Begriffe stimmen?',
    why: 'Relation ist der Fachbegriff für Tabelle. Ein Attribut wird zu einer Spalte, ein Objekt zu einer Zeile (Datensatz).',
    options: [
      { id: 'column-object', text: 'Eine Spalte enthält alle Werte eines einzelnen Objekts.', reason: 'Eine Spalte gehört zu einer Eigenschaft und enthält diese Eigenschaft für alle Objekte.' },
      { id: 'relation', text: '„Relation“ ist der Fachbegriff für eine strukturierte Tabelle mit Spalten und Zeilen.', correct: true },
      { id: 'class-row', text: 'Eine Klasse entspricht einem einzelnen Datensatz.', reason: 'Eine Klasse beschreibt alle gleichartigen Objekte. Das entspricht der ganzen Tabelle, nicht einer Zeile.' },
      { id: 'row', text: 'Eine Zeile enthält alle Werte eines einzelnen Objekts.', correct: true },
    ],
  },
  {
    id: 'q2',
    text: 'Welches Attribut eignet sich als Primärschlüssel der Tabelle Schueler?',
    why: 'Nur eine eigens vergebene Nummer ist sicher eindeutig (UNIQUE) und nie leer (NOT NULL).',
    options: [
      { id: 'lastname', text: 'Nachname', reason: 'Nachnamen kommen mehrfach vor. Damit wäre die Regel UNIQUE verletzt.' },
      { id: 'birthday', text: 'Geburtsdatum', reason: 'Mehrere Schülerinnen und Schüler können am selben Tag geboren sein.' },
      { id: 'id', text: 'Schueler_ID (fortlaufend und eindeutig vergeben)', correct: true },
      { id: 'email', text: 'E-Mail-Adresse', reason: 'Eine E-Mail-Adresse kann sich ändern oder ganz fehlen. NOT NULL ist dann nicht sicher erfüllt.' },
    ],
  },
  {
    id: 'q3',
    text: 'Welche Aussagen über SQL-Datentypen stimmen?',
    why: 'VARCHAR(n) legt eine Höchstlänge fest, CHAR(n) eine feste Länge, DATE ein Datum im Format YYYY-MM-DD und INTEGER ganze Zahlen.',
    options: [
      { id: 'varchar', text: 'In einer Spalte vom Typ VARCHAR(20) darf ein Text höchstens 20 Zeichen lang sein.', correct: true },
      { id: 'integer', text: 'INTEGER speichert auch Kommazahlen wie 3,5.', reason: 'INTEGER speichert nur ganze Zahlen ohne Nachkommastellen.' },
      { id: 'char', text: 'Bei CHAR(5) wird ein kürzerer Text mit Leerzeichen auf 5 Zeichen aufgefüllt.', correct: true },
      { id: 'date', text: 'DATE speichert ein Datum im Format YYYY-MM-DD.', correct: true },
    ],
  },
  {
    id: 'q4',
    text: 'Welche Aussagen über dieses Schema stimmen?',
    code: 'CREATE TABLE Buch (\n  Buch_ID INTEGER PRIMARY KEY,\n  Titel VARCHAR(80),\n  Autor VARCHAR(60),\n  Seitenzahl INTEGER\n);',
    why: 'Hinter CREATE TABLE steht der Name der Relation, PRIMARY KEY markiert das eindeutige Attribut. Das Schema legt nur Spalten fest, noch keine Datensätze.',
    options: [
      { id: 'rows', text: 'Die Tabelle enthält vier Datensätze.', reason: 'Das Schema legt vier Spalten (Attribute) fest. Datensätze kommen erst später als Zeilen hinzu.' },
      { id: 'name', text: 'Die Relation (Tabelle) heißt Buch.', correct: true },
      { id: 'exact', text: 'Jeder Titel muss genau 80 Zeichen lang sein.', reason: 'VARCHAR(80) legt nur die Höchstlänge fest. Kürzere Titel sind erlaubt.' },
      { id: 'pk', text: 'Buch_ID identifiziert jedes Buch eindeutig.', correct: true },
    ],
  },
  {
    id: 'q5',
    text: 'In Java gibt es die Klasse Lehrkraft mit den Attributen kuerzel, name und vorname. Es werden 25 Lehrkraft-Objekte erzeugt. Was gilt für die passende Tabelle?',
    why: 'Jedes Attribut wird zu einer Spalte, jedes Objekt zu einer Zeile – alle Objekte einer Klasse stehen in derselben Tabelle.',
    options: [
      { id: 'three-columns', text: 'Die Tabelle hat drei Spalten.', correct: true },
      { id: 'tables', text: 'Es entstehen 25 Tabellen – eine für jedes Objekt.', reason: 'Alle Objekte einer Klasse stehen gemeinsam in einer einzigen Tabelle.' },
      { id: 'rows', text: 'Die Tabelle hat 25 Datensätze (Zeilen).', correct: true },
      { id: 'columns', text: 'Die Tabelle hat 25 Spalten.', reason: 'Jedes Objekt wird zu einer Zeile, nicht zu einer Spalte.' },
    ],
  },
];

const MAX_POINTS = { cloze: CLOZE_SOLUTION.length, sort: TYPE_VALUES.length, mc: MC_QUESTIONS.length, describe: DESCRIBE_MAX_POINTS };
const TOTAL_POINTS = Object.values(MAX_POINTS).reduce((sum, value) => sum + value, 0);

const DEFAULT_STATE = {
  cloze: {},
  sort: {},
  mc: Object.fromEntries(MC_QUESTIONS.map((question) => [question.id, []])),
  text: '',
  submitted: false,
  ai: null,
};

let state = loadState();

function clone(value) { return JSON.parse(JSON.stringify(value)); }

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved) return clone(DEFAULT_STATE);
    return { ...clone(DEFAULT_STATE), ...saved, mc: { ...clone(DEFAULT_STATE.mc), ...saved.mc } };
  } catch {
    return clone(DEFAULT_STATE);
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* Eingaben bleiben nur für diese Sitzung sichtbar. */
  }
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function resultMark(ok) {
  const mark = element('span', 'result-mark');
  mark.append(element('span', '', ok ? ' ✓' : ' ✗'), element('span', 'visually-hidden', ok ? ' richtig' : ' falsch'));
  mark.firstChild.setAttribute('aria-hidden', 'true');
  return mark;
}

// Gemeinsame Drag-and-Drop-Tafel für Lückentext und Zuordnung.
// assignment: { Kartenschlüssel: Ablage-ID }, fehlender Eintrag = Wortspeicher.
// Pointer Events, damit Maus, Stift und Touch gleich funktionieren; Tippen als Alternative.
function setupBoard({ root, items, assignment, capacity, layout }) {
  let picked = null;

  function slotOf(key) { return assignment[key] || ''; }

  function move(key, slot) {
    const from = slotOf(key);
    if (slot && capacity(slot) === 1) {
      const occupant = Object.keys(assignment).find((other) => other !== key && assignment[other] === slot);
      if (occupant) {
        if (from) assignment[occupant] = from; // Tausch zwischen zwei Lücken
        else delete assignment[occupant];
      }
    }
    if (slot) assignment[key] = slot;
    else delete assignment[key];
    picked = null;
    saveState();
    render(key);
    updateProgress();
  }

  function enableDrag(node, key) {
    node.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return;
      const startX = event.clientX;
      const startY = event.clientY;
      let ghost = null;
      node.setPointerCapture(event.pointerId);
      const moveHandler = (moveEvent) => {
        if (!ghost && Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY) < 6) return;
        if (!ghost) {
          ghost = element('span', 'cloze-token cloze-drag-ghost', items.find((item) => item.key === key).label);
          document.body.append(ghost);
          node.classList.add('is-dragging');
        }
        ghost.style.left = `${moveEvent.clientX}px`;
        ghost.style.top = `${moveEvent.clientY}px`;
        root.querySelectorAll('.is-drop-target').forEach((target) => target.classList.remove('is-drop-target'));
        const over = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY)?.closest('[data-slot]');
        if (over && root.contains(over)) over.classList.add('is-drop-target');
      };
      const end = (endEvent) => {
        node.removeEventListener('pointermove', moveHandler);
        node.removeEventListener('pointerup', end);
        node.removeEventListener('pointercancel', end);
        if (!ghost) return; // kein Ziehen, der Klick-Handler übernimmt
        ghost.remove();
        node.dataset.dragged = 'true';
        const drop = endEvent.type === 'pointerup' ? document.elementFromPoint(endEvent.clientX, endEvent.clientY)?.closest('[data-slot]') : null;
        if (drop && root.contains(drop)) move(key, drop.dataset.slot);
        else render();
      };
      node.addEventListener('pointermove', moveHandler);
      node.addEventListener('pointerup', end);
      node.addEventListener('pointercancel', end);
    });
  }

  function wasDragged(node) {
    if (node.dataset.dragged !== 'true') return false;
    delete node.dataset.dragged;
    return true;
  }

  // Karte als Schaltfläche; nach der Abgabe nur noch als Text mit Richtig-/Falsch-Markierung.
  function card(key, className, mark) {
    const item = items.find((entry) => entry.key === key);
    if (state.submitted) {
      const node = element('span', `${className} is-locked${mark ? ` is-${mark}` : ''}`, item.label);
      if (mark) node.append(resultMark(mark === 'correct'));
      return node;
    }
    const node = element('button', className, item.label);
    node.type = 'button';
    node.dataset.key = key;
    const isPicked = picked === key;
    node.classList.toggle('is-picked', isPicked);
    node.setAttribute('aria-pressed', String(isPicked));
    enableDrag(node, key);
    node.addEventListener('click', (event) => {
      event.stopPropagation();
      if (wasDragged(node)) return;
      const slot = slotOf(key);
      if (picked && picked !== key && slot) { move(picked, slot); return; }
      if (isPicked) { if (slot) move(key, ''); else { picked = null; render(key); } return; }
      picked = key;
      render(key);
    });
    return node;
  }

  function target(node, slot) {
    node.dataset.slot = slot;
    // Belegte Lücken sind selbst Karten; deren Klick-Handler übernimmt das Ablegen.
    if (state.submitted || node.dataset.key) return node;
    node.addEventListener('click', () => {
      if (!picked) return;
      if (slot === '' && !slotOf(picked)) { picked = null; render(); return; }
      move(picked, slot);
    });
    return node;
  }

  function bank() {
    const node = target(element('div', 'cloze-term-bank'), '');
    node.setAttribute('role', 'group');
    node.setAttribute('aria-label', 'Wortspeicher');
    const free = items.filter((item) => !slotOf(item.key));
    free.forEach((item) => node.append(card(item.key, 'cloze-token')));
    if (!free.length) node.append(element('span', 'bank-empty', state.submitted ? 'Alle Karten wurden verwendet.' : 'Alle Karten sind verteilt. Hierher ziehen, um eine Karte zurückzulegen.'));
    return node;
  }

  function render(focusKey) {
    root.replaceChildren(...layout({ bank, card, target, assignment, picked }));
    if (focusKey) root.querySelector(`[data-key="${CSS.escape(focusKey)}"]`)?.focus();
  }

  render();
  return { render };
}

function clozeLayout({ bank, card, target, assignment, picked }) {
  const sentence = element('p', 'cloze-sentence');
  const byGap = Object.fromEntries(Object.entries(assignment).map(([key, slot]) => [slot, key]));
  CLOZE_PARTS.forEach((part, index) => {
    sentence.append(document.createTextNode(part));
    if (index >= CLOZE_SLOTS.length) return;
    const slot = CLOZE_SLOTS[index];
    const key = byGap[slot];
    const attached = /^\S/.test(CLOZE_PARTS[index + 1]);
    if (key) {
      const mark = state.submitted ? (key === CLOZE_SOLUTION[index] ? 'correct' : 'wrong') : '';
      const gap = target(card(key, `cloze-gap is-filled${attached ? ' is-attached' : ''}`, mark), slot);
      gap.setAttribute('aria-label', `Lücke ${index + 1}: ${key}${mark ? (mark === 'correct' ? ', richtig' : ', falsch') : ''}`);
      sentence.append(gap);
      return;
    }
    const gap = element(state.submitted ? 'span' : 'button', `cloze-gap${attached ? ' is-attached' : ''}${state.submitted ? ' is-locked is-wrong' : ''}`, state.submitted ? '(leer)' : ' ');
    if (state.submitted) gap.append(resultMark(false));
    else {
      gap.type = 'button';
      gap.classList.toggle('is-awaiting', Boolean(picked));
    }
    gap.setAttribute('aria-label', `Lücke ${index + 1}: leer`);
    sentence.append(target(gap, slot));
  });
  return [bank(), sentence];
}

function sortLayout({ bank, card, target, assignment, picked }) {
  const grid = element('div', 'sort-zones');
  TYPE_ZONES.forEach((zone) => {
    const box = target(element('div', 'sort-zone'), zone.id);
    box.setAttribute('role', 'group');
    box.setAttribute('aria-label', `Datentyp ${zone.label}`);
    const label = element(state.submitted ? 'span' : 'button', 'sort-zone-label');
    label.append(element('code', '', zone.label));
    if (!state.submitted) {
      label.type = 'button';
      label.append(element('small', '', picked ? 'hier ablegen' : ''));
      label.setAttribute('aria-label', `${zone.label}${picked ? ': ausgewählte Karte hier ablegen' : ''}`);
    }
    box.append(label);
    const list = element('div', 'sort-zone-items');
    TYPE_VALUES.filter((value) => assignment[value.key] === zone.id).forEach((value) => {
      const mark = state.submitted ? (value.zone === zone.id ? 'correct' : 'wrong') : '';
      list.append(card(value.key, 'cloze-token', mark));
    });
    box.append(list);
    grid.append(box);
  });
  return [bank(), grid];
}

function renderMcQuestions() {
  const container = document.getElementById('mc-questions');
  container.replaceChildren();
  MC_QUESTIONS.forEach((question, index) => {
    const fieldset = element('fieldset');
    const legend = element('legend');
    legend.append(element('span', '', String(index + 1)), document.createTextNode(` ${question.text}`));
    fieldset.append(legend);
    if (question.code) {
      const pre = element('pre', 'given-sql');
      pre.append(element('code', '', question.code));
      fieldset.append(pre);
    }
    const list = element('div', 'choice-list');
    question.options.forEach((option) => {
      const label = element('label', 'choice-option');
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.name = question.id;
      input.value = option.id;
      input.checked = state.mc[question.id].includes(option.id);
      input.disabled = state.submitted;
      input.addEventListener('change', () => {
        state.mc[question.id] = [...container.querySelectorAll(`input[name="${question.id}"]:checked`)].map((checked) => checked.value);
        saveState();
        updateProgress();
      });
      label.append(input, element('span', '', option.text));
      list.append(label);
    });
    fieldset.append(list);
    container.append(fieldset);
  });
}

function sameSet(a, b) { return a.length === b.length && b.every((value) => a.includes(value)); }
function correctIds(question) { return question.options.filter((option) => option.correct).map((option) => option.id); }

function taskStatus() {
  return [
    CLOZE_SLOTS.every((slot) => Object.values(state.cloze).includes(slot)),
    TYPE_VALUES.every((value) => state.sort[value.key]),
    MC_QUESTIONS.every((question) => state.mc[question.id].length > 0),
    state.text.trim().length >= 10,
  ];
}

function updateProgress() {
  const done = taskStatus().filter(Boolean).length;
  document.getElementById('progress-label').textContent = state.submitted ? 'Test abgegeben' : `${done} von 4 Aufgaben bearbeitet`;
  document.getElementById('progress-bar').style.width = `${state.submitted ? 100 : Math.round((done / 4) * 100)}%`;
  document.getElementById('progress-points').textContent = state.submitted ? pointsLine() : `${TOTAL_POINTS} Punkte erreichbar`;
}

function scoreCloze() {
  return CLOZE_SLOTS.map((slot, index) => {
    const chosen = Object.keys(state.cloze).find((key) => state.cloze[key] === slot) || '';
    return { index, chosen, correct: chosen === CLOZE_SOLUTION[index] };
  });
}

function scoreSort() {
  return TYPE_VALUES.map((value) => ({ value, chosen: state.sort[value.key] || '', correct: state.sort[value.key] === value.zone }));
}

function scoreMc() {
  return MC_QUESTIONS.map((question) => ({ question, chosen: state.mc[question.id], correct: sameSet(state.mc[question.id], correctIds(question)) }));
}

function aiPoints() {
  if (state.ai && Number.isFinite(state.ai.points) && state.ai.maxPoints > 0) return Math.min(state.ai.points, DESCRIBE_MAX_POINTS);
  if (state.text.trim().length < 10) return 0;
  return null; // noch nicht oder nicht automatisch bewertet
}

function pointsLine() {
  const local = scoreCloze().filter((row) => row.correct).length + scoreSort().filter((row) => row.correct).length + scoreMc().filter((row) => row.correct).length;
  const describe = aiPoints();
  if (describe === null) return `${local} von ${TOTAL_POINTS - DESCRIBE_MAX_POINTS} Punkten (ohne Aufgabe 4)`;
  return `${local + describe} von ${TOTAL_POINTS} Punkten`;
}

function zoneLabel(id) { return TYPE_ZONES.find((zone) => zone.id === id)?.label || 'nicht zugeordnet'; }
function termReason(key) { return CLOZE_TERMS.find((term) => term.key === key)?.reason || ''; }

function resultList(rows) {
  const list = element('ul', 'evaluation-list');
  rows.forEach(({ ok, text, why }) => {
    const item = element('li', ok ? 'is-correct' : 'is-wrong');
    item.append(element('strong', '', ok ? '✓ richtig: ' : '✗ falsch: '), document.createTextNode(text));
    if (why) item.append(element('span', 'evaluation-why', why));
    list.append(item);
  });
  return list;
}

function evaluationSection(title, points, maxPoints, prompt, content) {
  const section = element('section', 'summary-section');
  const heading = element('h3', '', `${title} `);
  const badgeText = points !== null ? `${points} von ${maxPoints} Punkten` : state.ai?.level === 'error' ? 'Bewertung durch Lehrkraft' : 'wird bewertet';
  heading.append(element('span', `summary-result ${points === maxPoints ? 'complete' : 'open'}`, badgeText));
  section.append(heading, element('p', 'prompt', prompt), ...[].concat(content));
  return section;
}

function renderEvaluation() {
  const cloze = scoreCloze();
  const sort = scoreSort();
  const mc = scoreMc();
  const details = document.getElementById('evaluation-details');
  details.replaceChildren(
    evaluationSection('Aufgabe 1 – Begriffe', cloze.filter((row) => row.correct).length, MAX_POINTS.cloze, 'Lückentext zu Klasse, Objekt, Attribut, Tabelle, Spalte und Datensatz/Zeile.',
      resultList(cloze.map((row) => ({
        ok: row.correct,
        text: row.correct
          ? `Lücke ${row.index + 1}: ${row.chosen}`
          : `Lücke ${row.index + 1}: deine Antwort „${row.chosen || 'leer'}“, richtig ist „${CLOZE_SOLUTION[row.index]}“.`,
        why: row.correct ? '' : [row.chosen && !CLOZE_SOLUTION.includes(row.chosen) ? termReason(row.chosen) : '', termReason(CLOZE_SOLUTION[row.index])].filter(Boolean).join(' '),
      })))),
    evaluationSection('Aufgabe 2 – SQL-Datentypen', sort.filter((row) => row.correct).length, MAX_POINTS.sort, 'Ordne jeden Wert dem passenden SQL-Datentyp zu.',
      resultList(sort.map((row) => ({
        ok: row.correct,
        text: row.correct
          ? `${row.value.label} → ${zoneLabel(row.value.zone)}`
          : `${row.value.label}: deine Antwort ${zoneLabel(row.chosen)}, richtig ist ${zoneLabel(row.value.zone)}.`,
        why: row.correct ? '' : row.value.reason,
      })))),
    evaluationSection('Aufgabe 3 – Multiple Choice', mc.filter((row) => row.correct).length, MAX_POINTS.mc, 'Kreuze alle richtigen Antworten an.',
      resultList(mc.map((row, index) => {
        const wrongChosen = row.question.options.filter((option) => !option.correct && row.chosen.includes(option.id));
        const missed = row.question.options.filter((option) => option.correct && !row.chosen.includes(option.id));
        const why = [
          ...wrongChosen.map((option) => `„${option.text}“ ist falsch: ${option.reason}`),
          missed.length ? `Gefehlt hat: ${missed.map((option) => `„${option.text.replace(/\.$/, '')}“`).join(', ')}.` : '',
          row.question.why,
        ].filter(Boolean).join(' ');
        return {
          ok: row.correct,
          text: `Frage ${index + 1}: ${row.question.text} Richtig: ${row.question.options.filter((option) => option.correct).map((option) => option.text).join(' · ')}`,
          why: row.correct ? '' : why,
        };
      }))),
    evaluationSection('Aufgabe 4 – Primärschlüssel', aiPoints(), MAX_POINTS.describe, 'Beschreibe, warum ein Primärschlüssel in Datenbanken benötigt wird.', describeEvaluation()),
  );
  document.getElementById('evaluation-total').textContent = `Ergebnis: ${pointsLine()}`;
  updateProgress();
}

function describeEvaluation() {
  const box = element('div', 'describe-evaluation');
  const answer = state.text.trim();
  box.append(element('p', 'describe-answer', answer ? `Deine Antwort: ${answer}` : 'Deine Antwort: (leer)'));
  if (answer.length < 10) {
    box.append(element('p', 'feedback error', 'Keine ausreichende Antwort – 0 Punkte. Ein Primärschlüssel kennzeichnet jeden Datensatz eindeutig; dafür muss sein Wert eindeutig (UNIQUE) und nie leer (NOT NULL) sein.'));
    return box;
  }
  if (!state.ai || state.ai.level === 'loading') {
    box.append(element('p', 'feedback hint', 'Deine Antwort wird automatisch ausgewertet …'));
    return box;
  }
  if (state.ai.level === 'error') {
    box.append(element('p', 'feedback hint', `Die Antwort konnte nicht automatisch bewertet werden (${state.ai.text}). Deine Lehrkraft bewertet diese Aufgabe selbst.`));
    return box;
  }
  box.append(element('p', `feedback ${state.ai.level === 'high' ? 'success' : state.ai.level === 'medium' ? 'partial' : 'error'}`, `${state.ai.status}: ${state.ai.text}`));
  [['Das ist dir gelungen:', state.ai.strengths], ['Das hat gefehlt:', state.ai.missing]].forEach(([heading, entries]) => {
    if (!entries.length) return;
    box.append(element('h4', '', heading));
    const list = element('ul');
    entries.forEach((entry) => list.append(element('li', '', entry)));
    box.append(list);
  });
  return box;
}

// JSONP-Anfrage an den gemeinsamen Apps-Script-Server, Ablauf wie submitDescription in sql-lab.js.
let pendingRequest = null;
window.__handleQuizDescriptionResult = (message) => {
  if (message?.type && message.type !== 'GEMINI_EVALUATION_RESULT') return;
  if (pendingRequest && message?.requestId === pendingRequest.requestId) finishDescription(message.result);
};

function finishDescription(result) {
  if (!pendingRequest) return;
  clearTimeout(pendingRequest.timeout);
  pendingRequest.script.remove();
  pendingRequest = null;
  state.ai = classifyDescriptionResult(result);
  saveState();
  renderEvaluation();
}

function requestDescriptionEvaluation() {
  const answer = state.text.trim();
  if (answer.length < 10 || pendingRequest) return;
  if (!isValidScriptServerUrl(SCRIPT_SERVER_URL)) { finishWithoutRequest('Der Auswertungsserver ist nicht korrekt eingerichtet.'); return; }
  const requestId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const url = new URL(SCRIPT_SERVER_URL);
  url.searchParams.set('callback', '__handleQuizDescriptionResult');
  url.searchParams.set('requestId', requestId);
  url.searchParams.set('taskId', DESCRIBE_TASK_ID);
  url.searchParams.set('answer', answer);
  if (url.toString().length > 1800) { finishWithoutRequest('die Antwort ist für die automatische Übertragung zu lang'); return; }
  state.ai = { level: 'loading' };
  const script = document.createElement('script');
  const timeout = window.setTimeout(() => finishDescription({ ok: false, message: 'Der Auswertungsserver hat nicht rechtzeitig geantwortet.' }), 60000);
  pendingRequest = { requestId, script, timeout };
  script.src = url;
  script.async = true;
  script.onerror = () => finishDescription({ ok: false, message: 'Der Auswertungsserver konnte nicht geladen werden.' });
  document.body.append(script);
}

function finishWithoutRequest(message) {
  state.ai = { level: 'error', text: message };
  saveState();
  renderEvaluation();
}

let boards = [];

function lockInputs() {
  const textarea = document.getElementById('describe-answer');
  textarea.readOnly = state.submitted;
  document.querySelector('.submit-row').hidden = state.submitted;
  document.querySelectorAll('.drag-help').forEach((help) => { help.hidden = state.submitted; });
}

function submitTest(event) {
  event.preventDefault();
  if (state.submitted) return;
  const open = taskStatus().filter((done) => !done).length;
  if (open && !window.confirm(`${open === 1 ? 'Eine Aufgabe ist' : `${open} Aufgaben sind`} noch nicht vollständig bearbeitet. Möchtest du den Test trotzdem abgeben?`)) return;
  state.submitted = true;
  state.ai = null;
  saveState();
  lockInputs();
  boards.forEach((board) => board.render());
  renderMcQuestions();
  requestDescriptionEvaluation();
  showEvaluation(true);
}

function showEvaluation(focus) {
  const panel = document.getElementById('evaluation');
  panel.hidden = false;
  renderEvaluation();
  if (focus) {
    const heading = document.getElementById('evaluation-title');
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
    panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function init() {
  boards = [
    setupBoard({
      root: document.getElementById('term-cloze'),
      items: CLOZE_TERMS.map((term) => ({ key: term.key, label: term.key })),
      assignment: state.cloze,
      capacity: () => 1,
      layout: clozeLayout,
    }),
    setupBoard({
      root: document.getElementById('type-sort'),
      items: TYPE_VALUES.map((value) => ({ key: value.key, label: value.label })),
      assignment: state.sort,
      capacity: () => Infinity,
      layout: sortLayout,
    }),
  ];
  renderMcQuestions();
  const textarea = document.getElementById('describe-answer');
  textarea.value = state.text;
  textarea.addEventListener('input', () => { state.text = textarea.value; saveState(); updateProgress(); });
  document.getElementById('quiz-test').addEventListener('submit', submitTest);
  document.getElementById('print-evaluation').addEventListener('click', () => window.print());
  document.getElementById('reset-test').addEventListener('click', () => {
    if (!window.confirm('Möchtest du den Test wirklich neu starten? Alle Eingaben werden gelöscht.')) return;
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* nichts gespeichert */ }
    window.location.reload();
  });
  lockInputs();
  updateProgress();
  if (state.submitted) {
    if (!state.ai || state.ai.level === 'loading') { state.ai = null; requestDescriptionEvaluation(); }
    showEvaluation(false);
  }
}

if (typeof document !== 'undefined') document.addEventListener('DOMContentLoaded', init);
