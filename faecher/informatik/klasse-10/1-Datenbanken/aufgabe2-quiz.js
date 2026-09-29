import { evaluateSemanticAnswer } from '../../klasse-11/1-Kuenstliche-Intelligenz/perzeptron/ui/semantic-answer.mjs';

// Test zu Aufgabe 2 (Redundanzen): nicht verlinkte Seite, jede Aufgabe mit eigenem Prüfen-Button.
// Bewusst eigenständig und ohne Abhängigkeit zum Test zu Aufgabe 1, damit beide Tests getrennt gelöscht werden können.
// Die Löschanleitung steht in aufgabe1-quiz-skriptserver.txt.
const STORAGE_KEY = 'informatik10-datenbanken-aufgabe2-test-v1';
const SCRIPT_SERVER_URL = 'https://script.google.com/macros/s/AKfycby8RWL6uYrKZyoJ6m2GRpWyRmXjwsdskyCiqzKpRhIK5-wrDl-9lWWk8CiAGaVMoy0x/exec';
const DESCRIBE_MIN_LENGTH = 30;

// Aufgabe 4: Beschreibe-Aufgabe, bewertet über den Skriptserver.
const DESCRIBE_TASKS = [
  {
    id: 'aufteilung',
    number: 4,
    title: 'Aufteilung begründen',
    taskId: 'inf10-db-a2-aufteilung',
    maxPoints: 3,
  },
];
const DESCRIBE_MAX_POINTS = DESCRIBE_TASKS.reduce((sum, task) => sum + task.maxPoints, 0);

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

const MAX_POINTS = { cloze: CLOZE_SOLUTION.length, sort: SORT_VALUES.length, mc: MC_QUESTIONS.length };
const TOTAL_POINTS = Object.values(MAX_POINTS).reduce((sum, value) => sum + value, 0) + DESCRIBE_MAX_POINTS;
const TASK_COUNT = 3 + DESCRIBE_TASKS.length;
const LOCAL_TASKS = [
  { id: 'cloze', number: 1, title: 'Redundanz und Aufteilung' },
  { id: 'sort', number: 2, title: 'Attribute zuordnen' },
  { id: 'mc', number: 3, title: 'Multiple Choice' },
];

const DEFAULT_STATE = {
  version: 2,
  cloze: {},
  sort: {},
  mc: Object.fromEntries(MC_QUESTIONS.map((question) => [question.id, []])),
  texts: Object.fromEntries(DESCRIBE_TASKS.map((task) => [task.id, ''])),
  // Letzte Bewertung durch den Skriptserver und der Text, auf den sie sich bezieht.
  ai: Object.fromEntries(DESCRIBE_TASKS.map((task) => [task.id, null])),
  aiText: Object.fromEntries(DESCRIBE_TASKS.map((task) => [task.id, ''])),
  // true, solange die Markierungen des letzten Prüfens zur aktuellen Eingabe passen.
  checked: { cloze: false, sort: false, mc: Object.fromEntries(MC_QUESTIONS.map((question) => [question.id, false])) },
  // Gewertet wird der erste Prüfversuch jeder Aufgabe; null = noch nicht geprüft.
  first: {
    cloze: null,
    sort: null,
    mc: Object.fromEntries(MC_QUESTIONS.map((question) => [question.id, null])),
    describe: Object.fromEntries(DESCRIBE_TASKS.map((task) => [task.id, null])),
  },
};

let state = loadState();

function clone(value) { return JSON.parse(JSON.stringify(value)); }

function isPlainObject(value) { return Boolean(value) && typeof value === 'object' && !Array.isArray(value); }

function clampPoints(value, max) { return Number.isFinite(value) ? Math.min(Math.max(Math.round(value), 0), max) : null; }

// Nur bekannte Einträge übernehmen, damit ein veralteter oder beschädigter Stand die Seite nicht stört.
function loadState() {
  const fresh = clone(DEFAULT_STATE);
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!isPlainObject(saved)) return fresh;
    const clozeKeys = CLOZE_TERMS.map((term) => term.key);
    const sortZones = SORT_ZONES.map((zone) => zone.id);
    if (isPlainObject(saved.cloze)) Object.entries(saved.cloze).forEach(([key, slot]) => { if (clozeKeys.includes(key) && CLOZE_SLOTS.includes(slot)) fresh.cloze[key] = slot; });
    if (isPlainObject(saved.sort)) Object.entries(saved.sort).forEach(([key, zone]) => { if (SORT_VALUES.some((value) => value.key === key) && sortZones.includes(zone)) fresh.sort[key] = zone; });
    MC_QUESTIONS.forEach((question) => {
      const chosen = saved.mc?.[question.id];
      if (Array.isArray(chosen)) fresh.mc[question.id] = chosen.filter((id) => question.options.some((option) => option.id === id));
    });
    DESCRIBE_TASKS.forEach((task, index) => {
      if (typeof saved.texts?.[task.id] === 'string') fresh.texts[task.id] = saved.texts[task.id];
      // Ältere Stände speichern die einzige Beschreibe-Antwort unter "text".
      else if (index === 0 && typeof saved.text === 'string') fresh.texts[task.id] = saved.text;
    });
    // Stände aus der Zeit mit Abgabe-Button (ohne version) bringen nur ihre Eingaben mit.
    if (saved.version !== 2) return fresh;
    ['cloze', 'sort'].forEach((key) => {
      fresh.checked[key] = saved.checked?.[key] === true;
      fresh.first[key] = clampPoints(saved.first?.[key], MAX_POINTS[key]);
    });
    MC_QUESTIONS.forEach((question) => {
      fresh.checked.mc[question.id] = saved.checked?.mc?.[question.id] === true;
      fresh.first.mc[question.id] = clampPoints(saved.first?.mc?.[question.id], 1);
    });
    DESCRIBE_TASKS.forEach((task) => {
      const ai = saved.ai?.[task.id];
      if (isPlainObject(ai) && Number.isFinite(ai.points) && typeof saved.aiText?.[task.id] === 'string') {
        fresh.ai[task.id] = ai;
        fresh.aiText[task.id] = saved.aiText[task.id];
      }
      fresh.first.describe[task.id] = clampPoints(saved.first?.describe?.[task.id], task.maxPoints);
    });
    return fresh;
  } catch {
    return fresh;
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

/**
 * Rückmeldung unter einer Aufgabe.
 * status: 'success', 'partial', 'error' oder '' für einen neutralen Hinweis.
 * parts: Texte oder fertige Knoten, leere Einträge entfallen.
 */
function setFeedback(box, status, parts) {
  box.className = `quiz-feedback${status ? ` ${status}` : ''}`;
  box.replaceChildren();
  parts.filter(Boolean).forEach((part) => {
    box.append(typeof part === 'string' ? element('p', '', part) : part);
  });
  box.hidden = false;
}

function feedbackList(entries) {
  const list = element('ul', 'feedback-reasons');
  entries.forEach((entry) => list.append(element('li', '', entry)));
  return list;
}

// Verschwindet der Prüfen-Button, bleibt der Fokus auf der Rückmeldung statt im Nichts.
function focusFeedback(box) {
  box.tabIndex = -1;
  box.focus({ preventScroll: true });
}

// Gemeinsame Drag-and-Drop-Tafel für Lückentext und Zuordnung.
// assignment: { Kartenschlüssel: Ablage-ID }, fehlender Eintrag = Wortspeicher.
// Pointer Events, damit Maus, Stift und Touch gleich funktionieren; Tippen als Alternative.
// isLocked: Aufgabe vollständig richtig gelöst, Karten sind dann fest.
// onChange: Eingabe geändert, alte Markierungen passen nicht mehr.
function setupBoard({ root, items, assignment, capacity, layout, isLocked, onChange }) {
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
    onChange();
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

  // Karte als Schaltfläche; nach vollständig richtiger Lösung nur noch als Text mit Markierung.
  function card(key, className, mark) {
    const item = items.find((entry) => entry.key === key);
    if (isLocked()) {
      const node = element('span', `${className} is-locked${mark ? ` is-${mark}` : ''}`, item.label);
      if (mark) node.append(resultMark(mark === 'correct'));
      return node;
    }
    const node = element('button', `${className}${mark ? ` is-${mark}` : ''}`, item.label);
    node.type = 'button';
    node.dataset.key = key;
    if (mark) node.append(resultMark(mark === 'correct'));
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
    if (isLocked() || node.dataset.key) return node;
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
    if (!free.length) node.append(element('span', 'bank-empty', isLocked() ? 'Alle Karten wurden verwendet.' : 'Alle Karten sind verteilt. Hierher ziehen, um eine Karte zurückzulegen.'));
    return node;
  }

  function render(focusKey) {
    root.replaceChildren(...layout({ bank, card, target, assignment, picked }));
    if (focusKey) root.querySelector(`[data-key="${CSS.escape(focusKey)}"]`)?.focus();
  }

  render();
  return { render };
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

function sameSet(a, b) { return a.length === b.length && b.every((value) => a.includes(value)); }
function correctIds(question) { return question.options.filter((option) => option.correct).map((option) => option.id); }

function mcResult(question) {
  const chosen = state.mc[question.id];
  const right = correctIds(question);
  return {
    exact: sameSet(chosen, right),
    hits: chosen.filter((id) => right.includes(id)).length,
    wrong: question.options.filter((option) => !option.correct && chosen.includes(option.id)),
    missing: right.some((id) => !chosen.includes(id)),
  };
}

function answerOf(task) { return state.texts[task.id].trim(); }

function clozeSolved() { return state.checked.cloze && scoreCloze().every((row) => row.correct); }
function sortSolved() { return state.checked.sort && scoreSort().every((row) => row.correct); }
function mcSolved(question) { return state.checked.mc[question.id] && mcResult(question).exact; }
function describeSolved(task) {
  const ai = state.ai[task.id];
  return Boolean(ai) && ai.points >= task.maxPoints && state.aiText[task.id] === state.texts[task.id];
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
      const mark = state.checked.cloze ? (key === CLOZE_SOLUTION[index] ? 'correct' : 'wrong') : '';
      const gap = target(card(key, `cloze-gap is-filled${attached ? ' is-attached' : ''}`, mark), slot);
      gap.setAttribute('aria-label', `Lücke ${index + 1}: ${key}${mark ? (mark === 'correct' ? ', richtig' : ', falsch') : ''}`);
      sentence.append(gap);
      return;
    }
    // Leere Lücken gibt es nur vor dem Prüfen: Geprüft wird erst, wenn alle Lücken belegt sind.
    const gap = element('button', `cloze-gap${attached ? ' is-attached' : ''}`, ' ');
    gap.type = 'button';
    gap.classList.toggle('is-awaiting', Boolean(picked));
    gap.setAttribute('aria-label', `Lücke ${index + 1}: leer`);
    sentence.append(target(gap, slot));
  });
  return [bank(), sentence];
}

function sortLayout({ bank, card, target, assignment, picked }) {
  const locked = sortSolved();
  const grid = element('div', 'sort-zones');
  SORT_ZONES.forEach((zone) => {
    const box = target(element('div', 'sort-zone'), zone.id);
    box.setAttribute('role', 'group');
    box.setAttribute('aria-label', `Tabelle ${zone.label}`);
    const label = element(locked ? 'span' : 'button', 'sort-zone-label');
    label.append(element('code', '', zone.label));
    if (!locked) {
      label.type = 'button';
      label.append(element('small', '', picked ? 'hier ablegen' : ''));
      label.setAttribute('aria-label', `${zone.label}${picked ? ': ausgewählte Karte hier ablegen' : ''}`);
    }
    box.append(label);
    const list = element('div', 'sort-zone-items');
    SORT_VALUES.filter((value) => assignment[value.key] === zone.id).forEach((value) => {
      const mark = state.checked.sort ? (value.zone === zone.id ? 'correct' : 'wrong') : '';
      list.append(card(value.key, 'cloze-token', mark));
    });
    box.append(list);
    grid.append(box);
  });
  return [bank(), grid];
}

function zoneLabel(id) { return SORT_ZONES.find((zone) => zone.id === id)?.label || 'nicht zugeordnet'; }
function termReason(key) { return CLOZE_TERMS.find((term) => term.key === key)?.reason || ''; }

function showClozeFeedback() {
  const box = document.getElementById('term-cloze-feedback');
  const rows = scoreCloze();
  const wrong = rows.filter((row) => !row.correct);
  const points = rows.length - wrong.length;
  if (!wrong.length) { setFeedback(box, 'success', ['Korrekt: Alle Lücken sind richtig ausgefüllt.']); return; }
  setFeedback(box, points ? 'partial' : 'error', [
    points ? `Teilweise korrekt: ${points} von ${rows.length} Lücken ${points === 1 ? 'stimmt' : 'stimmen'}.` : 'Noch nicht korrekt: Keine Lücke stimmt.',
    feedbackList(wrong.map((row) => `„${row.chosen}“ passt nicht in Lücke ${row.index + 1}. ${CLOZE_SOLUTION.includes(row.chosen) ? 'Der Begriff gehört in eine andere Lücke.' : termReason(row.chosen)}`)),
    'Verschiebe die mit ✗ markierten Karten und prüfe erneut.',
  ]);
}

function showSortFeedback() {
  const box = document.getElementById('type-sort-feedback');
  const rows = scoreSort();
  const wrong = rows.filter((row) => !row.correct);
  const points = rows.length - wrong.length;
  if (!wrong.length) { setFeedback(box, 'success', ['Korrekt: Alle Attribute sind richtig zugeordnet.']); return; }
  setFeedback(box, points ? 'partial' : 'error', [
    points ? `Teilweise korrekt: ${points} von ${rows.length} Attributen ${points === 1 ? 'ist' : 'sind'} richtig zugeordnet.` : 'Noch nicht korrekt: Kein Attribut ist richtig zugeordnet.',
    feedbackList(wrong.map((row) => `„${row.value.label}“ gehört nicht zu „${zoneLabel(row.chosen)}“. ${row.value.reason}`)),
    'Verschiebe die mit ✗ markierten Karten und prüfe erneut.',
  ]);
}

function checkCloze() {
  const box = document.getElementById('term-cloze-feedback');
  const open = CLOZE_SLOTS.filter((slot) => !Object.values(state.cloze).includes(slot)).length;
  if (open) { setFeedback(box, '', [`Fülle zuerst alle Lücken aus. ${open === 1 ? 'Eine Lücke ist' : `${open} Lücken sind`} noch leer.`]); return; }
  if (state.first.cloze === null) state.first.cloze = scoreCloze().filter((row) => row.correct).length;
  state.checked.cloze = true;
  saveState();
  boards.cloze.render();
  showClozeFeedback();
  updateCheckButtons();
  if (clozeSolved()) focusFeedback(box);
  updateProgress();
}

function checkSort() {
  const box = document.getElementById('type-sort-feedback');
  const open = SORT_VALUES.filter((value) => !state.sort[value.key]).length;
  if (open) { setFeedback(box, '', [`Ordne zuerst alle Attribute zu. ${open === 1 ? 'Ein Attribut liegt' : `${open} Attribute liegen`} noch im Wortspeicher.`]); return; }
  if (state.first.sort === null) state.first.sort = scoreSort().filter((row) => row.correct).length;
  state.checked.sort = true;
  saveState();
  boards.sort.render();
  showSortFeedback();
  updateCheckButtons();
  if (sortSolved()) focusFeedback(box);
  updateProgress();
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

function showMcFeedback(question, box) {
  const result = mcResult(question);
  if (result.exact) { setFeedback(box, 'success', [`Korrekt. ${question.why}`]); return; }
  setFeedback(box, result.hits ? 'partial' : 'error', [
    result.hits ? 'Teilweise korrekt.' : 'Noch nicht korrekt.',
    result.wrong.length ? feedbackList(result.wrong.map((option) => `„${option.text}“ stimmt nicht. ${option.reason}`)) : '',
    result.missing ? 'Es fehlt noch mindestens eine richtige Aussage.' : '',
  ]);
}

// Multiple Choice mit Prüfen-Button je Frage, Auswahlkästchen wie #final-quiz in redundanzen.js.
function mcQuestion(question, index) {
  const solved = mcSolved(question);
  const fieldset = element('fieldset');
  fieldset.id = `mc-${question.id}`;
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
    input.disabled = solved;
    input.addEventListener('change', () => {
      state.mc[question.id] = [...fieldset.querySelectorAll('input:checked')].map((checked) => checked.value);
      state.checked.mc[question.id] = false;
      saveState();
      updateProgress();
    });
    label.append(input, element('span', '', option.text));
    list.append(label);
  });
  const actions = element('div', 'action-row');
  const button = element('button', 'primary-button', 'Antwort prüfen');
  button.type = 'button';
  button.hidden = solved;
  actions.append(button);
  const feedback = element('div', 'quiz-feedback');
  feedback.setAttribute('role', 'status');
  feedback.setAttribute('aria-live', 'polite');
  feedback.hidden = true;
  button.addEventListener('click', () => checkMc(question, index, feedback));
  fieldset.append(list, actions, feedback);
  if (state.checked.mc[question.id]) showMcFeedback(question, feedback);
  return fieldset;
}

function checkMc(question, index, box) {
  if (!state.mc[question.id].length) { setFeedback(box, '', ['Wähle zuerst mindestens eine Antwort aus.']); return; }
  if (state.first.mc[question.id] === null) state.first.mc[question.id] = mcResult(question).exact ? 1 : 0;
  state.checked.mc[question.id] = true;
  saveState();
  if (mcSolved(question)) {
    const fieldset = mcQuestion(question, index);
    document.getElementById(`mc-${question.id}`).replaceWith(fieldset);
    focusFeedback(fieldset.querySelector('.quiz-feedback'));
  } else {
    showMcFeedback(question, box);
  }
  updateProgress();
}

function renderMcQuestions() {
  document.getElementById('mc-questions').replaceChildren(...MC_QUESTIONS.map(mcQuestion));
}

// Beschreibe-Aufgabe: Prüfen über die vorhandene JSONP-Anbindung an den Skriptserver.
const describePending = {};
const describeErrors = {};
// Anfragen laufen nacheinander, auch wenn mehrere Prüfen-Buttons kurz hintereinander
// gedrückt werden, damit eine ganze Klasse den Server nicht mit gebündelten Anfragen belastet.
let describeQueue = Promise.resolve();

function describeStatus(ai) {
  const status = String(ai.status || '').trim().toLocaleLowerCase('de');
  return status === 'korrekt' ? 'success' : status === 'teilweise korrekt' ? 'partial' : 'error';
}

function renderDescribe(task) {
  const textarea = document.getElementById(`describe-${task.id}`);
  const button = document.getElementById(`check-${task.id}`);
  const box = document.getElementById(`describe-${task.id}-feedback`);
  const solved = describeSolved(task);
  const pending = Boolean(describePending[task.id]);
  textarea.readOnly = solved || pending;
  button.hidden = solved;
  button.disabled = pending;
  button.textContent = pending ? 'Antwort wird geprüft …' : 'Antwort prüfen';
  const ai = state.ai[task.id];
  if (pending) {
    setFeedback(box, '', ['Deine Antwort wird mit dem Erwartungshorizont verglichen …']);
  } else if (describeErrors[task.id]) {
    setFeedback(box, 'error', [`Die Antwort konnte gerade nicht automatisch bewertet werden (${describeErrors[task.id]}). Versuche es in einem Moment noch einmal.`]);
  } else if (ai) {
    const parts = [`${ai.status}: ${ai.points} von ${ai.maxPoints} Aspekten erkannt.`];
    [['Das ist dir gelungen:', ai.strengths, 'Noch kein Aspekt wurde eindeutig erkannt.'], ['Das fehlt noch:', ai.missing, 'Es fehlen keine wesentlichen Aspekte.']].forEach(([title, entries, fallback]) => {
      parts.push(element('h4', '', title), feedbackList(entries?.length ? entries : [fallback]));
    });
    if (ai.feedback) parts.push(ai.feedback);
    if (!solved) parts.push('Ergänze deine Antwort und prüfe sie erneut.');
    setFeedback(box, describeStatus(ai), parts);
  } else {
    box.hidden = true;
  }
}

function checkDescription(task) {
  const box = document.getElementById(`describe-${task.id}-feedback`);
  const answer = answerOf(task);
  if (answer.length < DESCRIBE_MIN_LENGTH) {
    setFeedback(box, '', [`Deine Antwort ist noch zu kurz. Schreibe mindestens ${DESCRIBE_MIN_LENGTH} Zeichen und gehe auf alle ${task.maxPoints} Aspekte ein.`]);
    return;
  }
  if (state.ai[task.id] && state.aiText[task.id] === state.texts[task.id]) {
    renderDescribe(task);
    box.append(element('p', '', 'Diese Antwort wurde schon geprüft. Ändere oder ergänze sie, bevor du sie erneut prüfen lässt.'));
    return;
  }
  const text = state.texts[task.id];
  describePending[task.id] = true;
  delete describeErrors[task.id];
  renderDescribe(task);
  describeQueue = describeQueue.then(() => evaluateDescription(task, text));
}

async function evaluateDescription(task, text) {
  try {
    const result = await evaluateSemanticAnswer({ serverUrl: SCRIPT_SERVER_URL, taskId: task.taskId, answer: text.trim() });
    const points = clampPoints(Number(result.points) || 0, task.maxPoints);
    state.ai[task.id] = {
      status: result.status || 'noch nicht korrekt',
      points,
      maxPoints: Number(result.maxPoints) || task.maxPoints,
      strengths: Array.isArray(result.strengths) ? result.strengths.map(String).slice(0, 4) : [],
      missing: Array.isArray(result.missing) ? result.missing.map(String).slice(0, 4) : [],
      feedback: result.feedback || '',
    };
    state.aiText[task.id] = text;
    if (state.first.describe[task.id] === null) state.first.describe[task.id] = points;
    saveState();
  } catch (error) {
    describeErrors[task.id] = error.message || 'Der Auswertungsserver war nicht erreichbar';
  }
  describePending[task.id] = false;
  renderDescribe(task);
  if (describeSolved(task)) focusFeedback(document.getElementById(`describe-${task.id}-feedback`));
  updateProgress();
}

function setupDescribeTask(task) {
  const textarea = document.getElementById(`describe-${task.id}`);
  const counter = document.getElementById(`describe-${task.id}-count`);
  const updateCounter = () => { counter.textContent = `${textarea.value.length} von ${textarea.maxLength} Zeichen`; };
  textarea.addEventListener('input', () => { state.texts[task.id] = textarea.value; updateCounter(); saveState(); updateProgress(); });
  document.getElementById(`check-${task.id}`).addEventListener('click', () => checkDescription(task));
  textarea.value = state.texts[task.id];
  updateCounter();
  renderDescribe(task);
}

// Punkte des ersten Prüfversuchs je Aufgabe; points = null, solange nichts geprüft ist.
function taskScores() {
  const mcChecked = MC_QUESTIONS.filter((question) => state.first.mc[question.id] !== null);
  return [
    { ...LOCAL_TASKS[0], max: MAX_POINTS.cloze, points: state.first.cloze, done: state.first.cloze !== null },
    { ...LOCAL_TASKS[1], max: MAX_POINTS.sort, points: state.first.sort, done: state.first.sort !== null },
    {
      ...LOCAL_TASKS[2],
      max: MAX_POINTS.mc,
      points: mcChecked.length ? mcChecked.reduce((sum, question) => sum + state.first.mc[question.id], 0) : null,
      done: mcChecked.length === MC_QUESTIONS.length,
      note: mcChecked.length && mcChecked.length < MC_QUESTIONS.length ? `${mcChecked.length} von ${MC_QUESTIONS.length} Fragen geprüft` : '',
    },
    ...DESCRIBE_TASKS.map((task) => ({ id: task.id, number: task.number, title: task.title, max: task.maxPoints, points: state.first.describe[task.id], done: state.first.describe[task.id] !== null })),
  ];
}

function scoreText(task) {
  if (task.points === null) return 'noch nicht geprüft';
  return `${task.points} von ${task.max} Punkten${task.note ? ` (${task.note})` : ''}`;
}

function updateProgress() {
  const tasks = taskScores();
  const points = tasks.reduce((sum, task) => sum + (task.points ?? 0), 0);
  const done = tasks.filter((task) => task.done).length;
  document.getElementById('progress-label').textContent = `${done} von ${TASK_COUNT} Aufgaben geprüft`;
  document.getElementById('progress-bar').style.width = `${Math.round((done / TASK_COUNT) * 100)}%`;
  document.getElementById('progress-points').textContent = `Wertung: ${points} von ${TOTAL_POINTS} Punkten`;
  tasks.forEach((task) => {
    document.getElementById(`task${task.number}-points`).textContent = task.points === null ? `${task.max} Punkte` : `Wertung: ${scoreText(task)}`;
  });
  const list = element('ul', 'evaluation-list');
  tasks.forEach((task) => {
    const item = element('li', task.points === null ? '' : task.points === task.max ? 'is-correct' : 'is-open');
    item.append(element('strong', '', `Aufgabe ${task.number} – ${task.title}: `), scoreText(task));
    list.append(item);
  });
  document.getElementById('evaluation-details').replaceChildren(list);
  document.getElementById('evaluation-total').textContent = `Wertung: ${points} von ${TOTAL_POINTS} Punkten`;
}

let boards = {};

// Prüfen-Buttons verschwinden, sobald eine Aufgabe vollständig richtig gelöst ist.
function updateCheckButtons() {
  document.getElementById('check-term-cloze').hidden = clozeSolved();
  document.getElementById('check-type-sort').hidden = sortSolved();
  document.querySelector("[data-help='term-cloze']").hidden = clozeSolved();
  document.querySelector("[data-help='type-sort']").hidden = sortSolved();
}

function init() {
  boards = {
    cloze: setupBoard({
      root: document.getElementById('term-cloze'),
      items: CLOZE_TERMS.map((term) => ({ key: term.key, label: term.key })),
      assignment: state.cloze,
      capacity: () => 1,
      layout: clozeLayout,
      isLocked: clozeSolved,
      onChange: () => { state.checked.cloze = false; },
    }),
    sort: setupBoard({
      root: document.getElementById('type-sort'),
      items: SORT_VALUES.map((value) => ({ key: value.key, label: value.label })),
      assignment: state.sort,
      capacity: () => Infinity,
      layout: sortLayout,
      isLocked: sortSolved,
      onChange: () => { state.checked.sort = false; },
    }),
  };
  document.getElementById('check-term-cloze').addEventListener('click', checkCloze);
  document.getElementById('check-type-sort').addEventListener('click', checkSort);
  if (state.checked.cloze) showClozeFeedback();
  if (state.checked.sort) showSortFeedback();
  updateCheckButtons();
  renderMcQuestions();
  DESCRIBE_TASKS.forEach(setupDescribeTask);
  document.getElementById('print-evaluation').addEventListener('click', () => window.print());
  document.getElementById('reset-test').addEventListener('click', () => {
    if (!window.confirm('Möchtest du das Quiz wirklich neu starten? Alle Eingaben und die Wertung werden gelöscht.')) return;
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* nichts gespeichert */ }
    window.location.reload();
  });
  updateProgress();
}

if (typeof document !== 'undefined') document.addEventListener('DOMContentLoaded', init);
