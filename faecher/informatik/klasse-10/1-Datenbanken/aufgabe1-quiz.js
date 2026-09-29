// Löschanleitung: aufgabe1-quiz-skriptserver.txt. Test zu Aufgabe 1: nicht verlinkte Seite,
// jede Aufgabe mit eigenem Prüfen-Button und sofortiger Rückmeldung.
import { evaluateSemanticAnswer } from '../../klasse-11/1-Kuenstliche-Intelligenz/perzeptron/ui/semantic-answer.mjs';

const STORAGE_KEY = 'informatik10-datenbanken-aufgabe1-test-v1';
const SCRIPT_SERVER_URL = 'https://script.google.com/macros/s/AKfycby8RWL6uYrKZyoJ6m2GRpWyRmXjwsdskyCiqzKpRhIK5-wrDl-9lWWk8CiAGaVMoy0x/exec';
const DESCRIBE_MIN_LENGTH = 30;

// Aufgabe 4: Beschreibe-Aufgabe, bewertet über den Skriptserver.
const DESCRIBE_TASKS = [
  { id: 'answer', number: 4, title: 'Primärschlüssel', taskId: 'inf10-db-a1-primaerschluessel', maxPoints: 3 },
];
const DESCRIBE_MAX_POINTS = DESCRIBE_TASKS.reduce((sum, task) => sum + task.maxPoints, 0);

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
const GAP_SNAP_DISTANCE = 32; // px um eine Lücke, in denen eine losgelassene Karte noch einrastet

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

const MAX_POINTS = { cloze: CLOZE_SOLUTION.length, sort: TYPE_VALUES.length, mc: MC_QUESTIONS.length };
const LOCAL_POINTS = Object.values(MAX_POINTS).reduce((sum, value) => sum + value, 0);
const TOTAL_POINTS = LOCAL_POINTS + DESCRIBE_MAX_POINTS;
const TASK_COUNT = 3 + DESCRIBE_TASKS.length;
const LOCAL_TASKS = [
  { id: 'cloze', number: 1, title: 'Begriffe' },
  { id: 'sort', number: 2, title: 'SQL-Datentypen' },
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
    const sortZones = TYPE_ZONES.map((zone) => zone.id);
    if (isPlainObject(saved.cloze)) Object.entries(saved.cloze).forEach(([key, slot]) => { if (clozeKeys.includes(key) && CLOZE_SLOTS.includes(slot)) fresh.cloze[key] = slot; });
    if (isPlainObject(saved.sort)) Object.entries(saved.sort).forEach(([key, zone]) => { if (TYPE_VALUES.some((value) => value.key === key) && sortZones.includes(zone)) fresh.sort[key] = zone; });
    MC_QUESTIONS.forEach((question) => {
      const chosen = saved.mc?.[question.id];
      if (Array.isArray(chosen)) fresh.mc[question.id] = chosen.filter((id) => question.options.some((option) => option.id === id));
    });
    DESCRIBE_TASKS.forEach((task) => {
      if (typeof saved.texts?.[task.id] === 'string') fresh.texts[task.id] = saved.texts[task.id];
    });
    // Stände aus der Zeit mit Abgabe-Button (ohne version) bringen nur ihre Eingaben mit; dort hieß der Text „text“.
    if (saved.version !== 2) {
      if (typeof saved.text === 'string') fresh.texts.answer = saved.text;
      return fresh;
    }
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
  box.className = `quiz-feedback${status ? ` is-${status}` : ''}`;
  box.replaceChildren();
  parts.filter(Boolean).forEach((part) => box.append(typeof part === 'string' ? element('p', '', part) : part));
  box.hidden = false;
}

function reasonList(entries) {
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
  TYPE_ZONES.forEach((zone) => {
    const box = target(element('div', 'sort-zone'), zone.id);
    box.setAttribute('role', 'group');
    box.setAttribute('aria-label', `Datentyp ${zone.label}`);
    const label = element(locked ? 'span' : 'button', 'sort-zone-label');
    label.append(element('code', '', zone.label));
    if (!locked) {
      label.type = 'button';
      label.append(element('small', '', picked ? 'hier ablegen' : ''));
      label.setAttribute('aria-label', `${zone.label}${picked ? ': ausgewählte Karte hier ablegen' : ''}`);
    }
    box.append(label);
    const list = element('div', 'sort-zone-items');
    TYPE_VALUES.filter((value) => assignment[value.key] === zone.id).forEach((value) => {
      const mark = state.checked.sort ? (value.zone === zone.id ? 'correct' : 'wrong') : '';
      list.append(card(value.key, 'cloze-token', mark));
    });
    box.append(list);
    grid.append(box);
  });
  return [bank(), grid];
}

function sameSet(a, b) { return a.length === b.length && b.every((value) => a.includes(value)); }
function correctIds(question) { return question.options.filter((option) => option.correct).map((option) => option.id); }

function scoreCloze() {
  return CLOZE_SLOTS.map((slot, index) => {
    const chosen = Object.keys(state.cloze).find((key) => state.cloze[key] === slot) || '';
    return { index, chosen, correct: chosen === CLOZE_SOLUTION[index] };
  });
}

function scoreSort() {
  return TYPE_VALUES.map((value) => ({ value, chosen: state.sort[value.key] || '', correct: state.sort[value.key] === value.zone }));
}

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

function zoneLabel(id) { return TYPE_ZONES.find((zone) => zone.id === id)?.label || 'nicht zugeordnet'; }
function termReason(key) { return CLOZE_TERMS.find((term) => term.key === key)?.reason || ''; }

function showClozeFeedback() {
  const box = document.getElementById('term-cloze-feedback');
  const rows = scoreCloze();
  const wrong = rows.filter((row) => !row.correct);
  const points = rows.length - wrong.length;
  if (!wrong.length) { setFeedback(box, 'success', ['Korrekt: Alle Lücken sind richtig ausgefüllt.']); return; }
  setFeedback(box, points ? 'partial' : 'error', [
    points ? `Teilweise korrekt: ${points} von ${rows.length} Lücken ${points === 1 ? 'stimmt' : 'stimmen'}.` : 'Noch nicht korrekt: Keine Lücke stimmt.',
    reasonList(wrong.map((row) => `„${row.chosen}“ passt nicht in Lücke ${row.index + 1}. ${CLOZE_SOLUTION.includes(row.chosen) ? 'Der Begriff gehört in eine andere Lücke.' : termReason(row.chosen)}`)),
    'Verschiebe die mit ✗ markierten Karten und prüfe erneut.',
  ]);
}

function showSortFeedback() {
  const box = document.getElementById('type-sort-feedback');
  const rows = scoreSort();
  const wrong = rows.filter((row) => !row.correct);
  const points = rows.length - wrong.length;
  if (!wrong.length) { setFeedback(box, 'success', ['Korrekt: Alle Werte sind dem richtigen Datentyp zugeordnet.']); return; }
  setFeedback(box, points ? 'partial' : 'error', [
    points ? `Teilweise korrekt: ${points} von ${rows.length} Werten ${points === 1 ? 'ist' : 'sind'} richtig zugeordnet.` : 'Noch nicht korrekt: Kein Wert ist richtig zugeordnet.',
    reasonList(wrong.map((row) => `${row.value.label} gehört nicht zu ${zoneLabel(row.chosen)}. ${row.value.reason}`)),
    'Verschiebe die mit ✗ markierten Werte und prüfe erneut.',
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
  const open = TYPE_VALUES.filter((value) => !state.sort[value.key]).length;
  if (open) { setFeedback(box, '', [`Ordne zuerst alle Werte zu. ${open === 1 ? 'Ein Wert liegt' : `${open} Werte liegen`} noch im Wortspeicher.`]); return; }
  if (state.first.sort === null) state.first.sort = scoreSort().filter((row) => row.correct).length;
  state.checked.sort = true;
  saveState();
  boards.sort.render();
  showSortFeedback();
  updateCheckButtons();
  if (sortSolved()) focusFeedback(box);
  updateProgress();
}

function showMcFeedback(question, box) {
  const result = mcResult(question);
  if (result.exact) { setFeedback(box, 'success', [`Korrekt. ${question.why}`]); return; }
  setFeedback(box, result.hits ? 'partial' : 'error', [
    result.hits ? 'Teilweise korrekt.' : 'Noch nicht korrekt.',
    result.wrong.length ? reasonList(result.wrong.map((option) => `„${option.text}“ stimmt nicht. ${option.reason}`)) : '',
    result.missing ? 'Es fehlt noch mindestens eine richtige Aussage.' : '',
  ]);
}

// Multiple Choice mit Prüfen-Button je Frage.
function mcQuestion(question, index) {
  const solved = mcSolved(question);
  const fieldset = element('fieldset');
  fieldset.id = `mc-${question.id}`;
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
  const button = element('button', 'primary-button direct-check-button', 'Antwort prüfen');
  button.type = 'button';
  button.hidden = solved;
  const feedback = element('div', 'quiz-feedback');
  feedback.setAttribute('role', 'status');
  feedback.setAttribute('aria-live', 'polite');
  feedback.hidden = true;
  button.addEventListener('click', () => checkMc(question, index, feedback));
  fieldset.append(list, button, feedback);
  if (state.checked.mc[question.id]) showMcFeedback(question, feedback);
  return fieldset;
}

function checkMc(question, index, box) {
  if (!state.mc[question.id].length) { setFeedback(box, '', ['Wähle zuerst mindestens eine Aussage aus.']); return; }
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

function statusClass(status) {
  const value = String(status || '').trim().toLocaleLowerCase('de');
  return value === 'korrekt' ? 'success' : value === 'teilweise korrekt' ? 'partial' : 'error';
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
    const parts = [element('h4', '', `${ai.status}: ${ai.points} von ${ai.maxPoints} Aspekten erkannt.`)];
    [['Das ist dir gelungen:', ai.strengths, 'Noch kein Aspekt wurde eindeutig erkannt.'], ['Das fehlt noch:', ai.missing, 'Es fehlen keine wesentlichen Aspekte.']].forEach(([title, entries, fallback]) => {
      const list = document.createElement('ul');
      (entries?.length ? entries : [fallback]).forEach((entry) => list.append(element('li', '', entry)));
      parts.push(element('h4', '', title), list);
    });
    if (ai.feedback) parts.push(ai.feedback);
    if (!solved) parts.push('Ergänze deine Antwort und prüfe sie erneut.');
    setFeedback(box, statusClass(ai.status), parts);
  } else {
    box.hidden = true;
  }
}

function checkDescription(task) {
  const box = document.getElementById(`describe-${task.id}-feedback`);
  const answer = answerOf(task);
  if (answer.length < DESCRIBE_MIN_LENGTH) {
    setFeedback(box, '', [`Deine Antwort ist noch zu kurz. Schreibe mindestens ${DESCRIBE_MIN_LENGTH} Zeichen und gehe auf alle Aspekte ein.`]);
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
      strengths: Array.isArray(result.strengths) ? result.strengths.map(String) : [],
      missing: Array.isArray(result.missing) ? result.missing.map(String) : [],
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
      items: TYPE_VALUES.map((value) => ({ key: value.key, label: value.label })),
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
