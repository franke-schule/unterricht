import { enableTabKeyboardNavigation, focusTabPanelStart, renderTabFlowNavigation, syncTabSemantics } from '../../klasse-10/1-Datenbanken/tab-navigation.mjs?v=20260906a';

const STORAGE_KEY = 'informatik9-datenbanken-aufgabe1-v1';

const TAB_ITEMS = [
  { id: 1, label: 'Viele Daten verwalten' },
  { id: 2, label: 'Das Datenbanksystem' },
  { id: 3, label: 'Tabellenkalkulation oder Datenbank?' },
];

const DEFAULT_STATE = {
  currentTab: 1,
  estimateValue: '',
  estimateDone: false,
  requirements: [],
  dbsBoard: {},
  dbsMarks: {},
  roleBoard: {},
  roleMarks: {},
  caseBoard: {},
  caseMarks: {},
  quiz: { q1: [], q2: [], q3: [], q4: [], q5: [] },
  quizPassed: false,
  tasksDone: { t11: false, t12: false, t21: false, t22: false, t31: false, quiz: false },
};

let state = loadState();

function clone(value) { return JSON.parse(JSON.stringify(value)); }

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved) return clone(DEFAULT_STATE);
    return {
      ...clone(DEFAULT_STATE),
      ...saved,
      tasksDone: { ...clone(DEFAULT_STATE.tasksDone), ...saved.tasksDone },
      quiz: { ...clone(DEFAULT_STATE.quiz), ...saved.quiz },
    };
  } catch {
    return clone(DEFAULT_STATE);
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* Fortschritt bleibt nur für diese Sitzung sichtbar. */
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

function setFeedback(id, kind, message, listItems) {
  const el = document.getElementById(id);
  el.className = `feedback ${kind}`;
  el.textContent = message;
  if (listItems && listItems.length) {
    const list = element('ul', 'evaluation-list');
    listItems.forEach((text) => list.append(element('li', '', text)));
    el.append(list);
  }
}

function clearFeedback(id) {
  const el = document.getElementById(id);
  el.className = 'feedback';
  el.textContent = '';
}

function extraWrongSentence(remaining) {
  if (remaining <= 0) return null;
  return remaining === 1
    ? 'Außerdem liegt noch 1 weitere Karte falsch.'
    : `Außerdem liegen noch ${remaining} weitere Karten falsch.`;
}

function buildWrongHintsList(wrongTexts) {
  const shown = wrongTexts.slice(0, 2);
  const extra = extraWrongSentence(wrongTexts.length - shown.length);
  const list = [...shown];
  if (extra) list.push(extra);
  list.push('Verschiebe die mit ✗ markierten Karten und prüfe erneut.');
  return list;
}

function notAllAssignedMessage(remaining) {
  const sentence = remaining === 1 ? 'Es liegt noch 1 Karte im Kartenstapel.' : `Es liegen noch ${remaining} Karten im Kartenstapel.`;
  return `Noch nicht vollständig: ${sentence} Ordne zuerst alle Karten zu.`;
}

function markTaskDone(key) {
  state.tasksDone[key] = true;
  saveState();
  renderTabs();
  updateNavigation();
}

function sameSet(a, b) {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((value, index) => value === sortedB[index]);
}

// nach setupBoard in klasse-10/1-Datenbanken/aufgabe1-quiz.js
// Anpassung: kein state.submitted, stattdessen ein "marks"-Objekt je Board,
// das nur durch den Pruefen-Button gesetzt und bei jeder Bewegung geloescht wird.
const GAP_SNAP_DISTANCE = 32;

function setupBoard({ root, items, assignment, marks, capacity, layout, onMove }) {
  let picked = null;

  function slotOf(key) { return assignment[key] || ''; }

  function clearMarks() {
    Object.keys(marks).forEach((key) => delete marks[key]);
  }

  function move(key, slot) {
    const from = slotOf(key);
    if (slot && capacity(slot) === 1) {
      const occupant = Object.keys(assignment).find((other) => other !== key && assignment[other] === slot);
      if (occupant) {
        if (from) assignment[occupant] = from;
        else delete assignment[occupant];
      }
    }
    if (slot) assignment[key] = slot;
    else delete assignment[key];
    clearMarks();
    picked = null;
    saveState();
    if (onMove) onMove();
    render(key);
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
        if (!ghost) return;
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

  function card(key, className) {
    const item = items.find((entry) => entry.key === key);
    const mark = marks[key];
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
    if (node.dataset.key) return node;
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
    if (!free.length) node.append(element('span', 'bank-empty', 'Alle Karten sind verteilt. Hierher ziehen, um eine Karte zurückzulegen.'));
    return node;
  }

  function render(focusKey) {
    root.replaceChildren(...layout({ bank, card, target, assignment, marks, picked }));
    if (focusKey) root.querySelector(`[data-key="${CSS.escape(focusKey)}"]`)?.focus();
  }

  render();
  return { render };
}

// --- 2.1 Grafik beschriften -------------------------------------------------

const DBS_ITEMS = [
  { key: 'db', label: 'Datenbank (DB)' },
  { key: 'dbms', label: 'Datenbank­management­system (DBMS)' },
  { key: 'dbs', label: 'Datenbanksystem (DBS)' },
];

const DBS_SLOTS = [
  { id: 'frame', left: 28.85, top: 4.33, width: 65.38, minHeight: 12, label: 'Feld am äußeren Rahmen' },
  { id: 'box', left: 33.85, top: 24.83, width: 55.38, minHeight: 12, label: 'Feld im Rechteck' },
  { id: 'cylinder', left: 41.54, top: 66.67, width: 40, minHeight: 12, label: 'Feld im Zylinder' },
];

const DBS_SOLUTION = { frame: 'dbs', box: 'dbms', cylinder: 'db' };

const DBS_WRONG_HINTS = {
  frame: 'Der äußere Rahmen umschließt beide inneren Teile. Welcher Begriff steht für das Ganze?',
  box: 'Über das Rechteck läuft der Pfeil von „Nutzer / Anwendung“. Welcher Teil regelt alle Zugriffe auf die Daten?',
  cylinder: 'Der Zylinder ist das übliche Symbol für einen Datenspeicher. Welcher Teil ist die Menge der gespeicherten Daten?',
};

function diagramLayout({ bank, card, target, assignment, marks, picked }) {
  const diagram = element('div', 'dbs-diagram');
  const template = document.getElementById('dbs-svg-template');
  diagram.append(template.content.cloneNode(true));
  DBS_SLOTS.forEach((slotDef) => {
    const filledKey = Object.keys(assignment).find((key) => assignment[key] === slotDef.id);
    let node;
    if (filledKey) {
      node = target(card(filledKey, 'dbs-slot cloze-gap is-filled'), slotDef.id);
      const item = DBS_ITEMS.find((entry) => entry.key === filledKey);
      const mark = marks[filledKey];
      node.setAttribute('aria-label', `${slotDef.label}: ${item.label}${mark ? (mark === 'correct' ? ', richtig' : ', falsch') : ''}`);
    } else {
      node = target(element('button', `dbs-slot cloze-gap${picked ? ' is-awaiting' : ''}`, ' '), slotDef.id);
      node.type = 'button';
      node.setAttribute('aria-label', `${slotDef.label}: leer`);
    }
    node.style.left = `${slotDef.left}%`;
    node.style.top = `${slotDef.top}%`;
    node.style.width = `${slotDef.width}%`;
    // max() statt reiner Prozentangabe: Feld waechst mit der Grafik, faellt auf
    // kleinen Bildschirmen aber nie unter die Mindesthoehe von 44 px (Barrierearmut).
    node.style.minHeight = `max(44px, ${slotDef.minHeight}%)`;
    diagram.append(node);
  });
  return [bank(), diagram];
}

let dbsBoardHandle = null;

function checkDbs() {
  const assignment = state.dbsBoard;
  const filledSlots = DBS_SLOTS.filter((slotDef) => Object.values(assignment).includes(slotDef.id));
  if (filledSlots.length < DBS_SLOTS.length) {
    setFeedback('feedback-dbs', 'hint', 'Noch nicht vollständig: Ziehe alle drei Begriffe in die Felder der Grafik.');
    saveState();
    return;
  }
  let correctCount = 0;
  let firstWrongSlot = null;
  DBS_SLOTS.forEach((slotDef) => {
    const key = Object.keys(assignment).find((entry) => assignment[entry] === slotDef.id);
    const ok = key === DBS_SOLUTION[slotDef.id];
    state.dbsMarks[key] = ok ? 'correct' : 'wrong';
    if (ok) correctCount += 1;
    else if (!firstWrongSlot) firstWrongSlot = slotDef.id;
  });
  if (correctCount === DBS_SLOTS.length) {
    setFeedback('feedback-dbs', 'success', 'Richtig: Der äußere Rahmen ist das Datenbanksystem (DBS). Es besteht aus dem Datenbankmanagementsystem (DBMS) und der Datenbank (DB). Nutzer und Anwendungen greifen immer über das DBMS auf die Daten zu.');
    markTaskDone('t21');
  } else if (correctCount === 1) {
    setFeedback('feedback-dbs', 'partial', `Teilweise korrekt: 1 von 3 Beschriftungen stimmt. ${DBS_WRONG_HINTS[firstWrongSlot]}`);
  } else {
    setFeedback('feedback-dbs', 'hint', 'Noch nicht korrekt: Keine Beschriftung stimmt. Das DBS ist das Ganze, die DB enthält die Daten, das DBMS regelt die Zugriffe.');
  }
  saveState();
  dbsBoardHandle.render();
}

// --- 2.2 Wer macht was? ------------------------------------------------------

const ROLE_ZONES = [
  { id: 'db', label: 'Datenbank (DB)' },
  { id: 'dbms', label: 'Datenbank­management­system (DBMS)' },
];

const ROLE_ITEMS = [
  { key: 'einfuegen', label: 'fügt neue Daten ein', zone: 'dbms', why: '„fügt neue Daten ein“: Die Datenbank speichert nur. Wer führt den Zugriff aus, wenn etwas Neues hinzukommt?' },
  { key: 'tabellen', label: 'speichert die Daten in Tabellen', zone: 'db', why: '„speichert die Daten in Tabellen“: Beschreibt die Karte eine Tätigkeit eines Programms – oder den Ort, an dem die Daten liegen?' },
  { key: 'loeschen', label: 'löscht Daten', zone: 'dbms', why: '„löscht Daten“: Löschen ist ein Zugriff auf die Daten. Welcher Teil des DBS regelt alle Zugriffe?' },
  { key: 'abfragen', label: 'sucht Daten für eine Abfrage heraus', zone: 'dbms', why: '„sucht Daten für eine Abfrage heraus“: Die Datenbank sucht nicht selbst. Welcher Teil beantwortet die Abfrage?' },
  { key: 'accounts', label: 'enthält die Daten aller Instahub-Accounts', zone: 'db', why: '„enthält die Daten aller Instahub-Accounts“: Welcher Teil ist die Menge der zu verwaltenden Daten?' },
  { key: 'aendern', label: 'ändert Daten', zone: 'dbms', why: '„ändert Daten“: Wenn jemand seine E-Mail-Adresse ändert, muss ein Programm den Zugriff ausführen. Welcher Teil ist dieses Programm?' },
  { key: 'rechte', label: 'regelt, wer welche Daten sehen oder ändern darf (Benutzerrechte)', zone: 'dbms', why: '„regelt Benutzerrechte“: Das Wort „regelt“ ist ein Hinweis. Welcher Teil regelt die Zugriffe?' },
];

function makeSortLayout(zones, items) {
  return function sortLayout({ bank, card, target, assignment }) {
    const grid = element('div', 'sort-zones');
    zones.forEach((zone) => {
      const box = target(element('div', 'sort-zone'), zone.id);
      box.setAttribute('role', 'group');
      box.setAttribute('aria-label', zone.label);
      // Label als Button (wie label in klasse-10/1-Datenbanken/aufgabe1-quiz.js, sortLayout,
      // Zeile 332-337 im unbeantworteten Zustand): per Tastatur fokussierbar; sein Klick
      // bubbelt zum click-Handler von box (siehe target()) und legt die ausgewaehlte Karte ab.
      const label = element('button', 'sort-zone-label', zone.label);
      label.type = 'button';
      box.append(label);
      const list = element('div', 'sort-zone-items');
      items.filter((item) => assignment[item.key] === zone.id).forEach((item) => {
        list.append(card(item.key, 'cloze-token'));
      });
      box.append(list);
      grid.append(box);
    });
    return [bank(), grid];
  };
}

let roleBoardHandle = null;

function checkRoles() {
  const assignment = state.roleBoard;
  const assignedCount = ROLE_ITEMS.filter((item) => assignment[item.key]).length;
  if (assignedCount < ROLE_ITEMS.length) {
    setFeedback('feedback-roles', 'hint', notAllAssignedMessage(ROLE_ITEMS.length - assignedCount));
    saveState();
    return;
  }
  let correctCount = 0;
  const wrongWhys = [];
  ROLE_ITEMS.forEach((item) => {
    const ok = assignment[item.key] === item.zone;
    state.roleMarks[item.key] = ok ? 'correct' : 'wrong';
    if (ok) correctCount += 1;
    else wrongWhys.push(item.why);
  });
  if (correctCount === ROLE_ITEMS.length) {
    setFeedback('feedback-roles', 'success', 'Richtig: Die Datenbank (DB) enthält die Daten und speichert sie in Tabellen. Das Datenbankmanagementsystem (DBMS) führt alle Zugriffe aus: einfügen, löschen, ändern, abfragen und Benutzerrechte regeln.');
    markTaskDone('t22');
  } else if (correctCount === 0) {
    setFeedback('feedback-roles', 'hint', 'Noch nicht korrekt: Keine Karte liegt richtig. Die DB ist der Speicher mit den Daten, das DBMS ist das Programm, das etwas mit den Daten tut.');
  } else {
    setFeedback('feedback-roles', 'partial', `Teilweise korrekt: ${correctCount} von 7 Karten liegen richtig.`, buildWrongHintsList(wrongWhys));
  }
  saveState();
  roleBoardHandle.render();
}

// --- 3.1 Tabellenkalkulation oder Datenbanksystem? --------------------------

const CASE_ZONES = [
  { id: 'tks', label: 'Tabellenkalkulation reicht' },
  { id: 'dbs', label: 'Datenbanksystem nötig' },
];

const CASE_ITEMS = [
  { key: 'instahub', label: 'Accounts von Instahub: mehrere Millionen Accounts', zone: 'dbs',
    confirm: 'Instahub: Mehrere Millionen Accounts passen nicht in ein Tabellenblatt mit höchstens 1 048 576 Zeilen.',
    why: 'Instahub: Denk an Reiter 1. Wie viele Zeilen hat ein Tabellenblatt höchstens – und wie viele Accounts hat Instahub?' },
  { key: 'kassenbuch', label: 'Kassenbuch der Klassenfahrt: rund 40 Ausgaben, am Ende wird die Summe berechnet', zone: 'tks',
    confirm: 'Kassenbuch: wenige Einträge und eine Summe – genau dafür sind die Rechenfunktionen einer Tabellenkalkulation gemacht.',
    why: 'Kassenbuch: Es sind nur rund 40 Einträge, und am Ende wird gerechnet. Rechnen mit wenigen Daten ist eine Stärke der Tabellenkalkulation.' },
  { key: 'stadtbib', label: 'Ausleihe der Stadtbibliothek: 200 000 Medien, an mehreren Theken wird gleichzeitig ausgeliehen', zone: 'dbs',
    confirm: 'Stadtbibliothek: 200 000 Zeilen passen zwar noch in ein Tabellenblatt. Den Ausschlag gibt, dass viele Personen gleichzeitig auf dieselben Daten zugreifen.',
    why: 'Stadtbibliothek: 200 000 Zeilen passen zwar noch in ein Tabellenblatt. Aber was passiert, wenn an zwei Theken gleichzeitig dasselbe Buch ausgeliehen wird?' },
  { key: 'noten', label: 'Notenberechnung für ein Fach: 28 Schülerinnen und Schüler, Durchschnitt und Diagramm', zone: 'tks',
    confirm: 'Notenberechnung: wenige Daten, dazu Durchschnitt und Diagramm – dafür bringt eine Tabellenkalkulation fertige Funktionen mit.',
    why: 'Notenberechnung: Es sind nur 28 Zeilen, und es sollen ein Durchschnitt und ein Diagramm entstehen. Welches Programm bringt dafür fertige Funktionen mit?' },
  { key: 'onlineshop', label: 'Onlineshop: Bestellungen, Kundenkonten und Artikel hängen zusammen und werden ständig abgefragt', zone: 'dbs',
    confirm: 'Onlineshop: Jede Bestellung muss mit dem richtigen Kundenkonto und den richtigen Artikeln verbunden bleiben, und der Shop stellt ständig komplexe Abfragen.',
    why: 'Onlineshop: Bestellungen, Kundenkonten und Artikel müssen zusammenhängend gespeichert bleiben, und der Shop fragt ständig ab, wer was bestellt hat. Wofür ist eine Tabellenkalkulation nicht gemacht?' },
  { key: 'klassenbib', label: 'Bücherliste der Klassenbibliothek: 80 Bücher, eine Schülerin pflegt die Liste', zone: 'tks',
    confirm: 'Klassenbibliothek: 80 Bücher und eine einzige Person – dafür reicht eine Tabellenkalkulation.',
    why: 'Klassenbibliothek: Wie viele Daten sind es, und wie viele Personen arbeiten gleichzeitig damit? 80 Zeilen, die eine Person pflegt, schafft eine Tabellenkalkulation leicht.' },
];

let caseBoardHandle = null;

function checkCases() {
  const assignment = state.caseBoard;
  const assignedCount = CASE_ITEMS.filter((item) => assignment[item.key]).length;
  if (assignedCount < CASE_ITEMS.length) {
    setFeedback('feedback-cases', 'hint', notAllAssignedMessage(CASE_ITEMS.length - assignedCount));
    saveState();
    return;
  }
  let correctCount = 0;
  const wrongWhys = [];
  CASE_ITEMS.forEach((item) => {
    const ok = assignment[item.key] === item.zone;
    state.caseMarks[item.key] = ok ? 'correct' : 'wrong';
    if (ok) correctCount += 1;
    else wrongWhys.push(item.why);
  });
  if (correctCount === CASE_ITEMS.length) {
    setFeedback('feedback-cases', 'success', 'Richtig: Alle sechs Situationen sind passend zugeordnet. Das gab jeweils den Ausschlag:', CASE_ITEMS.map((item) => item.confirm));
    markTaskDone('t31');
  } else if (correctCount === 0) {
    setFeedback('feedback-cases', 'hint', 'Noch nicht korrekt: Keine Karte liegt richtig. Frage bei jeder Karte: Sind es sehr viele Daten? Greifen viele Personen gleichzeitig zu? Hängen die Daten zusammen, oder sind komplexe Abfragen nötig?');
  } else {
    setFeedback('feedback-cases', 'partial', `Teilweise korrekt: ${correctCount} von 6 Karten liegen richtig.`, buildWrongHintsList(wrongWhys));
  }
  saveState();
  caseBoardHandle.render();
}

// --- 1.1 Schätzfrage ---------------------------------------------------------

function checkEstimate() {
  const input = document.getElementById('estimate-input');
  const cleaned = input.value.replace(/[\s .']/g, '');
  if (!/^\d{1,13}$/.test(cleaned)) {
    setFeedback('feedback-estimate', 'hint', 'Noch nicht vollständig: Gib deine Schätzung als ganze Zahl ein, zum Beispiel 50000.');
    saveState();
    return;
  }
  const n = Number(cleaned);
  if (n < 1) {
    setFeedback('feedback-estimate', 'hint', 'Noch nicht vollständig: Gib deine Schätzung als ganze Zahl ein, zum Beispiel 50000.');
    saveState();
    return;
  }
  if (n === 1048576) {
    setFeedback('feedback-estimate', 'success', 'Richtig: Genau richtig geschätzt!');
  } else if (n >= 500000 && n <= 2000000) {
    setFeedback('feedback-estimate', 'partial', 'Teilweise korrekt: Gut geschätzt – du liegst in der richtigen Größenordnung.');
  } else if (n < 500000) {
    setFeedback('feedback-estimate', 'hint', 'Noch nicht korrekt: Deine Schätzung ist deutlich zu niedrig. Ein Tabellenblatt hat mehr Zeilen, als viele denken.');
  } else {
    setFeedback('feedback-estimate', 'hint', 'Noch nicht korrekt: Deine Schätzung ist deutlich zu hoch. Ein Tabellenblatt hat weniger Zeilen, als du vermutest.');
  }
  state.estimateDone = true;
  state.tasksDone.t11 = true;
  document.getElementById('estimate-reveal').hidden = false;
  saveState();
  renderTabs();
  updateNavigation();
}

// --- 1.2 Anforderungen an die Datenverwaltung -------------------------------

const REQUIREMENTS_CORRECT = ['amount', 'access', 'connected'];
const REQUIREMENTS_ORDER = ['amount', 'diagram', 'access', 'copies', 'connected'];

const REQUIREMENTS_WRONG_REASON = {
  diagram: 'Diagramme sind eine Möglichkeit, Daten auszuwerten. Eine Anforderung an die Verwaltung der Accounts sind sie nicht.',
  copies: 'Mit vielen Kopien wüsste niemand mehr, welche Daten aktuell sind. Alle sollen gleichzeitig mit denselben Daten arbeiten.',
};

const REQUIREMENTS_MISSING_HINT = {
  amount: 'Denk daran, wie viele Accounts Instahub hat.',
  access: 'Denk daran, wie viele Menschen Instahub zur selben Zeit nutzen.',
  connected: 'Denk daran, was passiert, wenn die Accounts auf viele einzelne Dateien verteilt wären.',
};

function checkRequirements() {
  const selected = [...document.querySelectorAll('input[name="requirements"]:checked')].map((input) => input.value);
  state.requirements = selected;
  if (selected.length === 0) {
    setFeedback('feedback-requirements', 'hint', 'Noch nicht korrekt: Wähle zuerst mindestens eine Aussage aus.');
    saveState();
    return;
  }
  const correctChosen = selected.filter((value) => REQUIREMENTS_CORRECT.includes(value));
  const wrongChosen = REQUIREMENTS_ORDER.filter((value) => selected.includes(value) && !REQUIREMENTS_CORRECT.includes(value));
  if (correctChosen.length === REQUIREMENTS_CORRECT.length && wrongChosen.length === 0) {
    setFeedback('feedback-requirements', 'success', 'Richtig: Instahub muss sehr viele Daten speichern, vielen Personen gleichzeitig Zugriff geben und die Daten zusammenhängend halten. Für Millionen Accounts und so viele gleichzeitige Zugriffe ist eine Tabellenkalkulation nicht gemacht.');
    state.tasksDone.t12 = true;
    renderTabs();
    updateNavigation();
  } else if (correctChosen.length === 0) {
    setFeedback('feedback-requirements', 'hint', `Noch nicht korrekt: ${REQUIREMENTS_WRONG_REASON[wrongChosen[0]]} Überlege, was Instahub mit mehreren Millionen Accounts leisten muss.`);
  } else {
    let extra;
    if (wrongChosen.length) extra = REQUIREMENTS_WRONG_REASON[wrongChosen[0]];
    else {
      const missing = REQUIREMENTS_CORRECT.find((value) => !selected.includes(value));
      extra = REQUIREMENTS_MISSING_HINT[missing];
    }
    setFeedback('feedback-requirements', 'partial', `Teilweise korrekt: Du hast ${correctChosen.length} von 3 Anforderungen gefunden. ${extra}`);
  }
  saveState();
}

// --- Abschlussquiz ------------------------------------------------------------

const QUIZ_QUESTIONS = [
  {
    id: 'q1',
    hint: 'Frage 1: Denk an die vier Grenzen der Tabellenkalkulation aus dem Merke-Kasten.',
    options: [
      { id: 'amount', correct: true },
      { id: 'diagram', reason: 'Ein Diagramm aus wenigen Daten erstellt eine Tabellenkalkulation mit fertigen Funktionen – dafür braucht man kein Datenbanksystem.' },
      { id: 'access', correct: true },
      { id: 'complex', correct: true },
    ],
  },
  {
    id: 'q2',
    hint: 'Frage 2: Die DB ist der Speicher, das DBMS ist das Programm.',
    options: [
      { id: 'db-data', correct: true },
      { id: 'db-rights', reason: 'Wer welche Daten sehen darf, regelt das DBMS über Benutzerrechte. Die DB enthält nur die Daten.' },
      { id: 'dbms-access', correct: true },
      { id: 'dbs-parts', correct: true },
    ],
  },
  {
    id: 'q3',
    hint: 'Frage 3: Nutzer und Anwendungen greifen nie direkt auf die Daten zu.',
    options: [
      { id: 'db-self', reason: 'Die Datenbank speichert nur – sie ändert sich nicht von selbst.' },
      { id: 'dbms', correct: true },
      { id: 'direct', reason: 'Jeder Zugriff läuft über das DBMS – auch eine Änderung.' },
      { id: 'spreadsheet', reason: 'Die Instahub-Accounts liegen nicht in einer Tabellenkalkulation, sondern in einem Datenbanksystem.' },
    ],
  },
  {
    id: 'q4',
    hint: 'Frage 4: Prüfe für jede Situation die Datenmenge und wie viele Personen gleichzeitig zugreifen.',
    options: [
      { id: 'bank', reason: 'Drei Millionen Konten sind mehr, als ein Tabellenblatt mit 1 048 576 Zeilen fassen kann.' },
      { id: 'club', correct: true },
      { id: 'cinema', reason: 'Wenn viele Menschen gleichzeitig buchen, muss ein DBMS die Zugriffe regeln – sonst wird ein Platz womöglich doppelt verkauft.' },
      { id: 'party', correct: true },
    ],
  },
  {
    id: 'q5',
    hint: 'Frage 5: Denk an den Merke-Kasten: Beide Systeme eignen sich für unterschiedliche Anwendungsgebiete.',
    options: [
      { id: 'replace', reason: 'Tabellenkalkulationen werden weiter gebraucht, etwa zum Rechnen und für Diagramme. Oft rechnet man dort mit Daten aus einem Datenbanksystem weiter.' },
      { id: 'functions', correct: true },
      { id: 'nostore', reason: 'Eine Tabellenkalkulation speichert durchaus Daten – nur eben nicht beliebig viele.' },
      { id: 'reuse', correct: true },
    ],
  },
];

function selectedValues(name) {
  return [...document.querySelectorAll(`input[name="${name}"]:checked`)].map((input) => input.value);
}

function buildQuizHintList(results) {
  const items = [];
  QUIZ_QUESTIONS.forEach((question, index) => {
    if (results[index]) return;
    const chosen = state.quiz[question.id];
    const wrongOption = question.options.find((option) => !option.correct && chosen.includes(option.id));
    items.push(wrongOption ? `${question.hint} ${wrongOption.reason}` : question.hint);
  });
  return items;
}

function checkQuiz(event) {
  event.preventDefault();
  QUIZ_QUESTIONS.forEach((question) => { state.quiz[question.id] = selectedValues(question.id); });
  const results = QUIZ_QUESTIONS.map((question) => sameSet(state.quiz[question.id], question.options.filter((option) => option.correct).map((option) => option.id)));
  const correctCount = results.filter(Boolean).length;
  if (correctCount === QUIZ_QUESTIONS.length) {
    setFeedback('feedback-quiz', 'success', 'Richtig: Alle fünf Fragen stimmen. Unten findest du die Übersicht über alle Aufgaben.');
    state.quizPassed = true;
    document.getElementById('quiz-overview').hidden = false;
    markTaskDone('quiz');
  } else if (correctCount === 0) {
    setFeedback('feedback-quiz', 'hint', 'Noch nicht korrekt: Keine Frage ist vollständig richtig. Kreuze bei jeder Frage alle zutreffenden Antworten an – bei manchen Fragen sind es mehrere.', buildQuizHintList(results));
  } else {
    const wrongNumbers = results.map((ok, index) => (ok ? null : index + 1)).filter(Boolean);
    setFeedback('feedback-quiz', 'partial', `Teilweise korrekt: ${correctCount} von 5 Fragen sind vollständig richtig. Prüfe noch Frage ${wrongNumbers.join(', ')}.`, buildQuizHintList(results));
  }
  saveState();
}

// --- Reiter-Navigation --------------------------------------------------------

function isTabComplete(id) {
  if (id === 1) return state.tasksDone.t11 && state.tasksDone.t12;
  if (id === 2) return state.tasksDone.t21 && state.tasksDone.t22;
  return state.tasksDone.t31 && state.tasksDone.quiz;
}

function renderTabs() {
  const tabs = document.getElementById('step-tabs');
  tabs.innerHTML = TAB_ITEMS.map(({ id, label }) => {
    const complete = isTabComplete(id);
    return `<button id="tab-${id}" class="step-tab ${complete ? 'is-complete' : ''}" type="button" role="tab" aria-controls="step-${id}" aria-selected="${state.currentTab === id}" data-step="${id}"><span>${id}</span><small>${label}</small></button>`;
  }).join('');
  tabs.querySelectorAll('button').forEach((button) => {
    button.addEventListener('click', () => navigateTo(Number(button.dataset.step)));
  });
  enableTabKeyboardNavigation(tabs);
  syncTabSemantics(tabs, state.currentTab);
}

function navigateTo(step, { focusContent = false } = {}) {
  document.querySelectorAll('.step-panel').forEach((panel) => { panel.hidden = panel.id !== `step-${step}`; });
  state.currentTab = step;
  saveState();
  renderTabs();
  updateNavigation();
  const panel = document.getElementById(`step-${step}`);
  syncTabSemantics(document.getElementById('step-tabs'), state.currentTab);
  if (focusContent) focusTabPanelStart(panel);
  else window.scrollTo({ top: 0, behavior: 'smooth' });
}

function updateNavigation() {
  const doneCount = Object.values(state.tasksDone).filter(Boolean).length;
  const percent = Math.round((doneCount / 6) * 100);
  document.getElementById('progress-bar').style.width = `${percent}%`;
  document.getElementById('progress-percent').textContent = `${percent} % bearbeitet`;
  document.getElementById('progress-label').textContent = `Reiter ${state.currentTab} von 3`;
  const panel = document.getElementById(`step-${state.currentTab}`);
  renderTabFlowNavigation(panel, { items: TAB_ITEMS, currentId: state.currentTab, onNavigate: navigateTo });
}

// --- Zustand anwenden, Initialisierung ---------------------------------------

function applyStoredState() {
  if (state.estimateValue) document.getElementById('estimate-input').value = state.estimateValue;
  if (state.estimateDone) document.getElementById('estimate-reveal').hidden = false;
  state.requirements.forEach((value) => {
    const input = document.querySelector(`input[name="requirements"][value="${value}"]`);
    if (input) input.checked = true;
  });
  Object.entries(state.quiz).forEach(([name, values]) => {
    values.forEach((value) => {
      const input = document.querySelector(`input[name="${name}"][value="${value}"]`);
      if (input) input.checked = true;
    });
  });
  if (state.quizPassed) document.getElementById('quiz-overview').hidden = false;
}

function bindGlobalEvents() {
  const estimateInput = document.getElementById('estimate-input');
  estimateInput.addEventListener('input', () => {
    state.estimateValue = estimateInput.value;
    clearFeedback('feedback-estimate');
    saveState();
  });
  estimateInput.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    checkEstimate();
  });
  document.getElementById('check-estimate').addEventListener('click', checkEstimate);

  document.querySelectorAll('input[name="requirements"]').forEach((input) => {
    input.addEventListener('change', () => { clearFeedback('feedback-requirements'); saveState(); });
  });
  document.getElementById('check-requirements').addEventListener('click', checkRequirements);

  document.getElementById('check-dbs').addEventListener('click', checkDbs);
  document.getElementById('check-roles').addEventListener('click', checkRoles);
  document.getElementById('check-cases').addEventListener('click', checkCases);
  document.getElementById('final-quiz').addEventListener('submit', checkQuiz);

  document.getElementById('reset-module').addEventListener('click', () => {
    if (!window.confirm('Möchtest du wirklich alle Eingaben dieses Lernmoduls löschen?')) return;
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  });
}

function init() {
  applyStoredState();

  dbsBoardHandle = setupBoard({
    root: document.getElementById('dbs-board'),
    items: DBS_ITEMS,
    assignment: state.dbsBoard,
    marks: state.dbsMarks,
    capacity: () => 1,
    layout: diagramLayout,
    onMove: () => clearFeedback('feedback-dbs'),
  });

  roleBoardHandle = setupBoard({
    root: document.getElementById('role-board'),
    items: ROLE_ITEMS,
    assignment: state.roleBoard,
    marks: state.roleMarks,
    capacity: () => Infinity,
    layout: makeSortLayout(ROLE_ZONES, ROLE_ITEMS),
    onMove: () => clearFeedback('feedback-roles'),
  });

  caseBoardHandle = setupBoard({
    root: document.getElementById('case-board'),
    items: CASE_ITEMS,
    assignment: state.caseBoard,
    marks: state.caseMarks,
    capacity: () => Infinity,
    layout: makeSortLayout(CASE_ZONES, CASE_ITEMS),
    onMove: () => clearFeedback('feedback-cases'),
  });

  bindGlobalEvents();
  renderTabs();
  navigateTo(state.currentTab);
}

if (typeof document !== 'undefined') document.addEventListener('DOMContentLoaded', init);
