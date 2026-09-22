import { classifyDescriptionResult, isValidScriptServerUrl } from './sql-lab-core.mjs?v=20260906b';

// Test zu Aufgabe 2 (Redundanzen): nicht verlinkte Seite, Auswertung erst nach der Abgabe.
// Bewusst eigenständig und ohne Abhängigkeit zum Test zu Aufgabe 1, damit beide Tests getrennt gelöscht werden können.
const STORAGE_KEY = 'informatik10-datenbanken-aufgabe2-test-v1';
const SCRIPT_SERVER_URL = 'https://script.google.com/macros/s/AKfycby8RWL6uYrKZyoJ6m2GRpWyRmXjwsdskyCiqzKpRhIK5-wrDl-9lWWk8CiAGaVMoy0x/exec';
const DESCRIBE_TASK_ID = 'inf10-db-a2-aufteilung';
const DESCRIBE_MAX_POINTS = 3;
const DESCRIBE_PROMPT = 'Beschreibe, warum InstaHub die Daten auf die Tabellen users und photos aufteilt.';
const DESCRIBE_SHORT_HINT = 'Stünden Benutzerdaten bei jedem Foto, wären sie redundant gespeichert. In users stehen sie nur einmal, eine Änderung erfolgt an einer Stelle, und es entstehen keine Inkonsistenzen.';

// Aufgabe 1: Lückentext. Drag-and-Drop-Bedienung nach setupCloze (Informatik 11, was-ist-ki/ui/task0.mjs).
const CLOZE_TERMS = [
  { key: 'einmal', reason: 'Nach der Aufteilung steht jede Benutzerinformation nur noch an einer Stelle in users.' },
  { key: 'id', reason: 'photos.id kennzeichnet das Foto selbst. Den Benutzer eines Fotos erkennt man nicht an der Foto-ID.' },
  { key: 'Inkonsistenz', reason: 'Widersprechen sich zusammengehörige Informationen, zum Beispiel zwei E-Mail-Adressen für dieselbe Person, spricht man von Inkonsistenz.' },
  { key: 'mehrfach', reason: 'Mehrfaches Speichern ist gerade die Redundanz, die durch die Aufteilung vermieden wird.' },
  { key: 'photos', reason: 'Beschreibung, URL und Zeitpunkte gehören zu einem einzelnen Foto und stehen deshalb in photos.' },
  { key: 'Redundanz', reason: 'Wird dieselbe Information mehrfach gespeichert, spricht man von Redundanz.' },
  { key: 'user_id', reason: 'photos.user_id enthält denselben Wert wie users.id des Benutzers, der das Foto hochgeladen hat.' },
  { key: 'users', reason: 'Benutzername und E-Mail-Adresse beschreiben die Person und gehören deshalb in users.' },
];
const CLOZE_SOLUTION = ['Redundanz', 'Inkonsistenz', 'einmal', 'users', 'photos', 'user_id'];
const CLOZE_PARTS = [
  'Speichert eine Tabelle zu jedem Foto erneut den Benutzernamen und die E-Mail-Adresse, wird dieselbe Information mehrfach gespeichert. Das nennt man ',
  '. Ändert Mia ihre E-Mail-Adresse nur bei einem Foto, widersprechen sich die gespeicherten Daten. Das nennt man ',
  '. Besser ist es, die Daten aufzuteilen: Benutzerinformationen stehen nur ',
  ' in der Tabelle ',
  ', Fotoinformationen in der Tabelle ',
  '. Über das Attribut ',
  ' in photos lässt sich jedem Foto der passende Benutzer zuordnen.',
];
const CLOZE_SLOTS = CLOZE_SOLUTION.map((_, index) => `gap-${index}`);
const GAP_SNAP_DISTANCE = 32; // px um eine Lücke, in denen eine losgelassene Karte noch einrastet

// Aufgabe 2: Attribute den Tabellen users und photos zuordnen (wie Reiter 4 in aufgabe2.html).
const SORT_ZONES = [
  { id: 'users', label: 'users' },
  { id: 'photos', label: 'photos' },
];
const SORT_VALUES = [
  { key: 'url', label: 'url', zone: 'photos', reason: 'Die URL gehört zu genau einem Foto.' },
  { key: 'email', label: 'email', zone: 'users', reason: 'Die E-Mail-Adresse beschreibt die Person. Bei jedem Foto gespeichert, wäre sie redundant.' },
  { key: 'created_at', label: 'created_at', zone: 'photos', reason: 'Der Erstellungszeitpunkt gehört zum einzelnen Foto.' },
  { key: 'user_id', label: 'user_id', zone: 'photos', reason: 'user_id steht beim Foto und verweist auf den Benutzer, der es hochgeladen hat.' },
  { key: 'username', label: 'username', zone: 'users', reason: 'Der Benutzername beschreibt die Person und wird nur einmal gespeichert.' },
  { key: 'description', label: 'description', zone: 'photos', reason: 'Jede Beschreibung gehört zu einem anderen Foto.' },
  { key: 'city', label: 'city', zone: 'users', reason: 'Der Wohnort beschreibt die Person, nicht ein einzelnes Foto.' },
  { key: 'updated_at', label: 'updated_at', zone: 'photos', reason: 'Der Aktualisierungszeitpunkt gehört zum einzelnen Foto.' },
];

// Aufgabe 3: Multiple Choice mit Auswahlkästchen wie #final-quiz in redundanzen.js.
const MC_QUESTIONS = [
  {
    id: 'q1',
    text: 'Was versteht man unter Redundanz?',
    why: 'Redundanz bedeutet: Dieselbe Information wird mehrfach gespeichert.',
    options: [
      { id: 'contradict', text: 'Zusammengehörige Informationen widersprechen sich.', reason: 'Das beschreibt eine Inkonsistenz, also eine mögliche Folge von Redundanz.' },
      { id: 'repeat', text: 'Dieselbe Information wird mehrfach gespeichert.', correct: true },
      { id: 'names', text: 'Zwei Tabellen besitzen denselben Namen.', reason: 'Redundanz betrifft gespeicherte Informationen, nicht Tabellennamen.' },
      { id: 'delete', text: 'Alte Daten werden automatisch gelöscht.', reason: 'Bei Redundanz wird nichts gelöscht, sondern dieselbe Information wiederholt gespeichert.' },
    ],
  },
  {
    id: 'q2',
    text: 'Welche Probleme können durch Redundanz entstehen?',
    why: 'Redundanz kostet Speicher und macht Änderungen aufwendig und fehleranfällig.',
    options: [
      { id: 'repetition', text: 'Eine Änderung muss an mehreren Stellen durchgeführt werden.', correct: true },
      { id: 'automatic', text: 'Die Datenbank korrigiert widersprüchliche Einträge automatisch.', reason: 'Die Datenbank weiß nicht, welcher von zwei Einträgen stimmt. Sie korrigiert nichts von selbst.' },
      { id: 'forget', text: 'Eine Stelle kann bei einer Änderung leicht vergessen werden.', correct: true },
      { id: 'storage', text: 'Gleiche Informationen belegen unnötig mehrfach Speicherplatz.', correct: true },
    ],
  },
  {
    id: 'q3',
    text: 'Welche Aussagen treffen auf diesen Tabellenausschnitt zu?',
    table: {
      caption: 'Tabellenausschnitt mit Fotos von Mia',
      columns: ['photo_id', 'username', 'email', 'description'],
      rows: [
        ['41', 'mia', 'mia@example.org', 'Sonnenuntergang'],
        ['42', 'mia', 'mia.neu@example.org', 'Mein Fahrrad'],
        ['43', 'mia', 'mia@example.org', 'Ausflug am See'],
      ],
    },
    why: 'username und email wiederholen sich bei jedem Foto. Weil die Änderung der E-Mail-Adresse nur in einem Datensatz erfolgte, widersprechen sich die Daten.',
    options: [
      { id: 'redundant', text: 'username und email sind redundant gespeichert.', correct: true },
      { id: 'description', text: 'description ist redundant, weil jedes Foto eine Beschreibung hat.', reason: 'Jede Beschreibung ist eine andere Information zu einem anderen Foto. Nichts wird wiederholt.' },
      { id: 'inconsistent', text: 'Die Daten sind inkonsistent, weil für Mia zwei verschiedene E-Mail-Adressen gespeichert sind.', correct: true },
      { id: 'clear', text: 'Man kann eindeutig erkennen, welche E-Mail-Adresse stimmt.', reason: 'Beide Adressen stehen gleichberechtigt da. Welche aktuell ist, lässt sich nicht erkennen.' },
    ],
  },
  {
    id: 'q4',
    text: 'Wie wurde das Problem bei InstaHub gelöst?',
    why: 'Die Daten werden auf users und photos aufgeteilt. Jeder Sachverhalt wird möglichst nur einmal gespeichert.',
    options: [
      { id: 'copy', text: 'Die Benutzerdaten werden bei jedem Foto zusätzlich kopiert, damit nichts verloren geht.', reason: 'Zusätzliche Kopien würden die Redundanz noch vergrößern.' },
      { id: 'split', text: 'Benutzer- und Fotoinformationen werden in den Tabellen users und photos getrennt gespeichert.', correct: true },
      { id: 'once', text: 'Jede Benutzerinformation wird nur einmal in users gespeichert.', correct: true },
      { id: 'in-users', text: 'Die Fotos werden zusätzlich in der Tabelle users gespeichert.', reason: 'Fotoinformationen gehören in photos. In users stehen nur Informationen über die Person.' },
    ],
  },
  {
    id: 'q5',
    text: 'Woran erkennt die Datenbank, wer ein Foto hochgeladen hat?',
    why: 'photos.user_id enthält denselben Wert wie users.id. So lassen sich Foto und Benutzer wieder zuordnen.',
    options: [
      { id: 'email', text: 'An der erneut gespeicherten E-Mail-Adresse in photos', reason: 'Nach der Aufteilung steht die E-Mail-Adresse nur noch in users.' },
      { id: 'photo-id', text: 'An der Foto-ID photos.id', reason: 'photos.id kennzeichnet das Foto selbst, nicht den Benutzer.' },
      { id: 'order', text: 'An der Reihenfolge der Datensätze', reason: 'Die Reihenfolge der Zeilen legt keine Zuordnung fest.' },
      { id: 'user-id', text: 'An photos.user_id, die denselben Wert wie users.id enthält', correct: true },
    ],
  },
];

const MAX_POINTS = { cloze: CLOZE_SOLUTION.length, sort: SORT_VALUES.length, mc: MC_QUESTIONS.length, describe: DESCRIBE_MAX_POINTS };
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
        slotAt(moveEvent.clientX, moveEvent.clientY)?.classList.add('is-drop-target');
      };
      const end = (endEvent) => {
        node.removeEventListener('pointermove', moveHandler);
        node.removeEventListener('pointerup', end);
        node.removeEventListener('pointercancel', end);
        if (!ghost) return; // kein Ziehen, der Klick-Handler übernimmt
        ghost.remove();
        node.dataset.dragged = 'true';
        const drop = endEvent.type === 'pointerup' ? slotAt(endEvent.clientX, endEvent.clientY) : null;
        if (drop) move(key, drop.dataset.slot);
        else render();
      };
      node.addEventListener('pointermove', moveHandler);
      node.addEventListener('pointerup', end);
      node.addEventListener('pointercancel', end);
    });
  }

  // Ablageziel unter dem Zeiger; knapp neben einer Lücke fängt die nächstgelegene Lücke die Karte.
  function slotAt(x, y) {
    const hit = document.elementFromPoint(x, y)?.closest('[data-slot]');
    if (hit && root.contains(hit)) return hit;
    let nearest = null;
    let best = GAP_SNAP_DISTANCE;
    root.querySelectorAll('.cloze-gap[data-slot]').forEach((gap) => {
      const box = gap.getBoundingClientRect();
      const distance = Math.hypot(Math.max(box.left - x, 0, x - box.right), Math.max(box.top - y, 0, y - box.bottom));
      if (distance <= best) { best = distance; nearest = gap; }
    });
    return nearest;
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
  SORT_ZONES.forEach((zone) => {
    const box = target(element('div', 'sort-zone'), zone.id);
    box.setAttribute('role', 'group');
    box.setAttribute('aria-label', `Tabelle ${zone.label}`);
    const label = element(state.submitted ? 'span' : 'button', 'sort-zone-label');
    label.append(element('code', '', zone.label));
    if (!state.submitted) {
      label.type = 'button';
      label.append(element('small', '', picked ? 'hier ablegen' : ''));
      label.setAttribute('aria-label', `${zone.label}${picked ? ': ausgewählte Karte hier ablegen' : ''}`);
    }
    box.append(label);
    const list = element('div', 'sort-zone-items');
    SORT_VALUES.filter((value) => assignment[value.key] === zone.id).forEach((value) => {
      const mark = state.submitted ? (value.zone === zone.id ? 'correct' : 'wrong') : '';
      list.append(card(value.key, 'cloze-token', mark));
    });
    box.append(list);
    grid.append(box);
  });
  return [bank(), grid];
}

// Tabellenausschnitt mit den Tabellenklassen aus redundanzen.css (table-shell, data-table).
function renderGivenTable({ caption, columns, rows }) {
  const shell = element('div', 'table-shell given-table');
  const scroll = element('div', 'table-scroll');
  const table = element('table', 'data-table');
  table.append(element('caption', 'visually-hidden', caption));
  const head = document.createElement('thead');
  const headRow = document.createElement('tr');
  columns.forEach((column) => { const th = element('th', '', column); th.scope = 'col'; headRow.append(th); });
  head.append(headRow);
  const body = document.createElement('tbody');
  rows.forEach((values) => {
    const tr = document.createElement('tr');
    values.forEach((value) => tr.append(element('td', '', value)));
    body.append(tr);
  });
  table.append(head, body);
  scroll.append(table);
  shell.append(scroll);
  return shell;
}

function renderMcQuestions() {
  const container = document.getElementById('mc-questions');
  container.replaceChildren();
  MC_QUESTIONS.forEach((question, index) => {
    const fieldset = element('fieldset');
    const legend = element('legend');
    legend.append(element('span', '', String(index + 1)), document.createTextNode(` ${question.text}`));
    fieldset.append(legend);
    if (question.table) fieldset.append(renderGivenTable(question.table));
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
    SORT_VALUES.every((value) => state.sort[value.key]),
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
  return SORT_VALUES.map((value) => ({ value, chosen: state.sort[value.key] || '', correct: state.sort[value.key] === value.zone }));
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

function zoneLabel(id) { return SORT_ZONES.find((zone) => zone.id === id)?.label || 'nicht zugeordnet'; }
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
    evaluationSection('Aufgabe 1 – Redundanz und Aufteilung', cloze.filter((row) => row.correct).length, MAX_POINTS.cloze, 'Lückentext zu Redundanz, Inkonsistenz und der Aufteilung in users und photos.',
      resultList(cloze.map((row) => ({
        ok: row.correct,
        text: row.correct
          ? `Lücke ${row.index + 1}: ${row.chosen}`
          : `Lücke ${row.index + 1}: deine Antwort „${row.chosen || 'leer'}“, richtig ist „${CLOZE_SOLUTION[row.index]}“.`,
        why: row.correct ? '' : [row.chosen && !CLOZE_SOLUTION.includes(row.chosen) ? termReason(row.chosen) : '', termReason(CLOZE_SOLUTION[row.index])].filter(Boolean).join(' '),
      })))),
    evaluationSection('Aufgabe 2 – Attribute zuordnen', sort.filter((row) => row.correct).length, MAX_POINTS.sort, 'Ordne jedes Attribut der Tabelle users oder photos zu.',
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
    evaluationSection('Aufgabe 4 – Aufteilung begründen', aiPoints(), MAX_POINTS.describe, DESCRIBE_PROMPT, describeEvaluation()),
  );
  document.getElementById('evaluation-total').textContent = `Ergebnis: ${pointsLine()}`;
  updateProgress();
}

function describeEvaluation() {
  const box = element('div', 'describe-evaluation');
  const answer = state.text.trim();
  box.append(element('p', 'describe-answer', answer ? `Deine Antwort: ${answer}` : 'Deine Antwort: (leer)'));
  if (answer.length < 10) {
    box.append(element('p', 'feedback error', `Keine ausreichende Antwort – 0 Punkte. ${DESCRIBE_SHORT_HINT}`));
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
window.__handleQuiz2DescriptionResult = (message) => {
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
  url.searchParams.set('callback', '__handleQuiz2DescriptionResult');
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
      items: SORT_VALUES.map((value) => ({ key: value.key, label: value.label })),
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
