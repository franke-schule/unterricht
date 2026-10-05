// Klassendiagramme zum Ziehen und Antippen für Informatik Klasse 10 (Aufgaben 4 bis 6).
// Dieses Modul baut nichts neu, sondern verbindet nur zwei bestehende Komponenten über Konfiguration:
//   - setupCardSlots (Pointer-Drag, Antippen–Antippen, Tauschen, Zurücklegen) aus der KNN-Aufgabe,
//   - renderTreeEdges (Kanten, die die Knoten berühren und sich verzweigen) aus den Entscheidungsbäumen.
// Die Auswertungsfunktionen sind reine Funktionen und werden in tests/klassendiagramm.test.mjs geprüft.

import { setupCardSlots } from '../../klasse-11/1-Kuenstliche-Intelligenz/knn/ui/card-slots.mjs';
import { renderTreeEdges } from '../../klasse-11/1-Kuenstliche-Intelligenz/entscheidungbaeume/ui/tree-edges.mjs';

const RESULT_CLASS = {
  korrekt: 'result high',
  'teilweise korrekt': 'result medium',
  'noch nicht korrekt': 'result low',
};

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/* ------------------------------------------------------------------ */
/* Daten                                                                */
/* ------------------------------------------------------------------ */

export const HIERARCHY_TASK = {
  cards: [
    { id: 'laptop', text: 'Laptop' },
    { id: 'artikel', text: 'Artikel' },
    { id: 'hauptprogramm', text: 'Hauptprogramm' },
    { id: 'kaffeemaschine', text: 'Kaffeemaschine' },
    { id: 'tower', text: 'Tower' },
    { id: 'computer', text: 'Computer' },
    { id: 'smartphone', text: 'Smartphone' },
  ],
  slots: [
    { id: 's0', label: 'Oberste Klasse' },
    { id: 's1', label: 'Unterklasse links' },
    { id: 's2', label: 'Unterklasse Mitte' },
    { id: 's3', label: 'Unterklasse rechts' },
    { id: 's4', label: 'Unterklasse der mittleren Klasse, links' },
    { id: 's5', label: 'Unterklasse der mittleren Klasse, rechts' },
  ],
  parents: [null, 0, 0, 0, 2, 2],
};

const ZUSATZ_FILLCOLOR = ' Auch fillColor: Color passt, weil setFillColor die Füllfarbe festlegt.';

// kind: A = verlangtes Attribut, M = verlangte Methode, O = zulässig (optional) als Attribut,
//       D = Ablenker mit Hinweis
function makeCards(key, entries) {
  return entries.map(([text, kind, hint], index) => ({ id: key + '-' + (index + 1), text, kind, hint: hint || '' }));
}

export const CLASS_CARD_TASKS = {
  grafik: {
    key: 'grafik',
    className: 'Grafik',
    attributeSlots: 4,
    methodSlots: 5,
    cards: makeCards('grafik', [
      ['tuWas()', 'D', 'Bei einer Methode fehlt hier der Rückgabetyp. tuWas gibt nichts zurück – das schreibt man als : void.'],
      ['maximaleVersuche: int', 'A'],
      ['bewegeBall(geschwindigkeit: int): void', 'M'],
      ['extends Actor', 'D', '„extends Actor“ ist kein Attribut. Die Vererbung zeigt im Klassendiagramm der Pfeil zu Actor – er ist schon eingezeichnet.'],
      ['Grafik()', 'M'],
      ['kiste: Rectangle', 'A'],
      ['geschwindigkeit: int', 'D', 'geschwindigkeit ist kein Attribut von Grafik, sondern der Parameter von bewegeBall. Attribute stehen in Grafik.java außerhalb der Methoden.'],
      ['act(): void', 'M'],
      ['Grafik(): void', 'D', 'Ein Konstruktor hat keinen Rückgabetyp, auch nicht void. Er trägt nur den Namen der Klasse.'],
      ['ball: Circle', 'A'],
      ['tuWas(): void', 'M'],
      ['bewegeBall(geschwindigkeit): void', 'D', 'Ein Eingabeparameter braucht in der Klassenkarte seinen Datentyp: parameter: Datentyp.'],
    ]),
    missingHint: 'Es fehlt noch mindestens ein Eintrag. Vergleiche mit Grafik.java: Jedes Attribut, der Konstruktor und jede Methode gehören in die Karte.',
    success: 'Korrekt. Die Karte zeigt die drei Attribute mit Datentyp, den Konstruktor ohne Rückgabetyp und die drei Methoden mit Eingabeparametern und Rückgabetyp void.',
    extra: '',
  },
  rectangle: {
    key: 'rectangle',
    className: 'Rectangle',
    attributeSlots: 5,
    methodSlots: 5,
    cards: makeCards('rectangle', [
      ['move(dx: double, dy: double): void', 'D', 'Rectangle besitzt move zwar, aber das Programm ruft move für kiste nicht auf. Nimm nur die Methoden auf, die für kiste benutzt werden.'],
      ['left: double', 'A'],
      ['rotate(angleDeg: double): void', 'M'],
      ['kiste: Rectangle', 'D', 'kiste ist ein Attribut der Klasse Grafik, nicht von Rectangle. In die Karte Rectangle gehört, was ein Rechteck selbst beschreibt.'],
      ['top: double', 'A'],
      ['Rectangle(left: double, top: double, width: double, height: double)', 'M'],
      ['fillColor: Color', 'O'],
      ['width: double', 'A'],
      ['rotate(45): void', 'D', '45 ist der Wert beim Aufruf, also ein Argument. In der Klassenkarte steht stattdessen der Parameter mit Datentyp.'],
      ['setFillColor(color: Color): void', 'M'],
      ['left', 'D', 'Auch ein Attribut braucht seinen Datentyp. Den findest du im Steckbrief beim Konstruktor.'],
      ['height: double', 'A'],
      ['Rectangle(left: double, top: double, width: double, height: double): void', 'D', 'Ein Konstruktor hat keinen Rückgabetyp, auch nicht void.'],
      ['scale(factor: double): void', 'M'],
    ]),
    missingHint: 'Es fehlt noch mindestens ein Eintrag. Leite die Attribute aus den vier Parametern des Konstruktors ab und suche alle Methoden, die das Programm für kiste aufruft.',
    success: 'Korrekt. Die Attribute ergeben sich aus dem Konstruktor, und die Karte enthält genau die Methoden, die das Programm für kiste aufruft: setFillColor, rotate und scale.',
    extra: ZUSATZ_FILLCOLOR,
  },
  circle: {
    key: 'circle',
    className: 'Circle',
    attributeSlots: 4,
    methodSlots: 4,
    cards: makeCards('circle', [
      ['scale(factor: double): void', 'D', 'Circle besitzt scale zwar, aber das Programm ruft scale für ball nicht auf.'],
      ['mx: double', 'A'],
      ['move(dx: double, dy: double): void', 'M'],
      ['ball: Circle', 'D', 'ball ist ein Attribut der Klasse Grafik, nicht von Circle.'],
      ['Circle(mx: double, my: double, r: double)', 'M'],
      ['my: double', 'A'],
      ['move(0, geschwindigkeit): void', 'D', '0 und geschwindigkeit sind die Werte beim Aufruf. In der Klassenkarte stehen die Parameter mit Datentyp, wie im Steckbrief.'],
      ['fillColor: Color', 'O'],
      ['r', 'D', 'Auch ein Attribut braucht seinen Datentyp. Den findest du im Steckbrief beim Konstruktor.'],
      ['setFillColor(color: Color): void', 'M'],
      ['r: double', 'A'],
      ['Circle(mx: double, my: double, r: double): Circle', 'D', 'Ein Konstruktor hat keinen Rückgabetyp. Dass er ein Circle-Objekt erzeugt, steckt schon in seinem Namen.'],
      ['bewegeBall(geschwindigkeit: int): void', 'D', 'bewegeBall ist eine Methode von Grafik. Sie ruft move für ball auf, gehört aber nicht zur Klasse Circle.'],
    ]),
    missingHint: 'Es fehlt noch mindestens ein Eintrag. Leite die Attribute aus den drei Parametern des Konstruktors ab und suche alle Methoden, die das Programm für ball aufruft.',
    success: 'Korrekt. Circle bekommt die Attribute aus seinem Konstruktor und genau die Methoden, die das Programm für ball aufruft: setFillColor und move.',
    extra: ZUSATZ_FILLCOLOR,
  },
};

/* ------------------------------------------------------------------ */
/* Reine Auswertungsfunktionen                                          */
/* ------------------------------------------------------------------ */

const HIERARCHY_HINTS = {
  hauptprogramm: 'Das Hauptprogramm ist keine Klasse dieser Hierarchie. Es erzeugt nur Objekte und ruft zeigeInfos() auf; in keiner Klassendatei steht extends Hauptprogramm.',
  top: 'Ganz oben steht die Klasse, die selbst von keiner anderen Klasse erbt. Suche die Klassendatei, in deren erster Zeile kein extends steht.',
  middle: 'Das Feld mit zwei Unterklassen gehört zu der Klasse, von der zwei andere Klassen erben. Prüfe, in welchen Klassendateien extends Computer steht.',
  smartphone: 'Ähnliche Attribute wie klappbar entscheiden nicht über die Vererbung. Maßgeblich ist, welche Klasse hinter extends steht: class Smartphone extends Artikel.',
  bottom: 'Lies die erste Zeile von Laptop.java und Tower.java. Hinter extends steht ihre direkte Oberklasse.',
  empty: 'Ziehe in jedes Feld genau eine Klasse.',
};

const HIERARCHY_SUCCESS = 'Korrekt. Artikel ist die oberste Klasse. Smartphone, Computer und Kaffeemaschine erben direkt von Artikel, Laptop und Tower von Computer. Ein Laptop ist also ein Computer und zugleich ein Artikel.';

/**
 * choices: Array mit sechs Einträgen (Karten-ID oder ''), Reihenfolge wie HIERARCHY_TASK.slots.
 * Gibt { status, message } zurück.
 */
export function evaluateHierarchy(choices) {
  const field = (index) => (choices && choices[index]) || '';
  const inFirstLevel = (id) => id === 'smartphone' || id === 'kaffeemaschine';
  const inThirdLevel = (id) => id === 'laptop' || id === 'tower';

  let correct = 0;
  if (field(0) === 'artikel') correct += 1;
  if (field(2) === 'computer') correct += 1;
  if (inFirstLevel(field(1))) correct += 1;
  if (inFirstLevel(field(3))) correct += 1;
  if (inThirdLevel(field(4))) correct += 1;
  if (inThirdLevel(field(5))) correct += 1;

  if (correct === 6) return { status: 'korrekt', message: HIERARCHY_SUCCESS };

  const status = correct >= 3 ? 'teilweise korrekt' : 'noch nicht korrekt';
  const filled = [0, 1, 2, 3, 4, 5].map(field);

  let hint;
  if (filled.includes('hauptprogramm')) hint = HIERARCHY_HINTS.hauptprogramm;
  else if (field(0) && field(0) !== 'artikel') hint = HIERARCHY_HINTS.top;
  else if (field(2) && field(2) !== 'computer') hint = HIERARCHY_HINTS.middle;
  else if (field(4) === 'smartphone' || field(5) === 'smartphone') hint = HIERARCHY_HINTS.smartphone;
  else if ((field(4) && !inThirdLevel(field(4))) || (field(5) && !inThirdLevel(field(5)))) hint = HIERARCHY_HINTS.bottom;
  else if (filled.some((id) => !id)) hint = HIERARCHY_HINTS.empty;
  else hint = HIERARCHY_HINTS.bottom;

  return {
    status,
    message: capitalize(status) + '. ' + correct + ' von 6 Feldern sind richtig belegt. ' + hint,
  };
}

const WRONG_AREA_HINT = 'Mindestens ein Baustein steht im falschen Bereich. Attribute stehen ohne runde Klammern oben, Konstruktor und Methoden mit runden Klammern unten.';

/**
 * task: Eintrag aus CLASS_CARD_TASKS; choices: Array mit Attributfeldern zuerst, danach Methodenfeldern
 * (Karten-ID oder ''). Gibt { status, message } zurück.
 */
export function evaluateClassCard(task, choices) {
  const attributeCount = task.attributeSlots;
  const placed = new Map();
  (choices || []).forEach((id, index) => { if (id) placed.set(id, index); });
  const inAttributeArea = (id) => placed.has(id) && placed.get(id) < attributeCount;
  const inMethodArea = (id) => placed.has(id) && placed.get(id) >= attributeCount;

  const required = task.cards.filter((card) => card.kind === 'A' || card.kind === 'M');
  const total = required.length;
  const right = required.filter((card) => (card.kind === 'A' ? inAttributeArea(card.id) : inMethodArea(card.id))).length;

  const distractor = task.cards.find((card) => card.kind === 'D' && placed.has(card.id));
  const wrongArea = task.cards.some((card) => (
    ((card.kind === 'A' || card.kind === 'O') && inMethodArea(card.id)) || (card.kind === 'M' && inAttributeArea(card.id))
  ));
  const missing = required.some((card) => !placed.has(card.id));

  let hint = '';
  if (distractor) hint = distractor.hint;
  else if (wrongArea) hint = WRONG_AREA_HINT;
  else if (missing) hint = task.missingHint;
  else {
    const optionalPlaced = task.cards.some((card) => card.kind === 'O' && placed.has(card.id));
    return { status: 'korrekt', message: task.success + (optionalPlaced ? task.extra : '') };
  }

  const status = right >= Math.ceil(total / 2) ? 'teilweise korrekt' : 'noch nicht korrekt';
  return {
    status,
    message: capitalize(status) + '. ' + right + ' von ' + total + ' verlangten Einträgen stehen richtig. ' + hint,
  };
}

/**
 * Liest einen gespeicherten Zustand (JSON-Array) und gibt ein Array der Länge slotCount zurück.
 * Ungültiges, unbekannte Karten-IDs und doppelt belegte Karten werden zu ''.
 */
export function parseStoredChoices(value, slotCount, cardIds) {
  const result = new Array(slotCount).fill('');
  let parsed = null;
  try {
    parsed = JSON.parse(value);
  } catch (error) {
    return result;
  }
  if (!Array.isArray(parsed)) return result;
  const used = new Set();
  for (let index = 0; index < slotCount; index += 1) {
    const entry = parsed[index];
    if (typeof entry === 'string' && cardIds.includes(entry) && !used.has(entry)) {
      result[index] = entry;
      used.add(entry);
    }
  }
  return result;
}

/* ------------------------------------------------------------------ */
/* Darstellung                                                          */
/* ------------------------------------------------------------------ */

/**
 * Zeichnet die Kanten eines statischen Diagramms (Knoten mit data-tree-node-key / data-tree-parent-key).
 */
export function renderInheritance(root) {
  return renderTreeEdges(root);
}

function writeState(stateInput, choices) {
  stateInput.value = JSON.stringify(choices);
  stateInput.dispatchEvent(new Event('input', { bubbles: true }));
}

function showResult(resultBox, evaluation) {
  resultBox.hidden = false;
  resultBox.className = RESULT_CLASS[evaluation.status] || 'result';
  resultBox.textContent = evaluation.message;
}

/**
 * Vererbungshierarchie (Aufgabe 4 b): sechs Felder im Baum, Kanten über renderTreeEdges.
 */
export function mountHierarchy(container, stateInput, checkButton, resultBox) {
  const task = HIERARCHY_TASK;
  const cardIds = task.cards.map((card) => card.id);
  const choices = parseStoredChoices(stateInput.value, task.slots.length, cardIds);

  function decorate() {
    const list = container.querySelector('.knn-slots');
    if (!list) return;
    list.classList.add('inherit-tree');
    list.querySelectorAll('.knn-slot').forEach((slot) => {
      const index = Number(slot.dataset.index);
      slot.dataset.treeNodeKey = 's' + index;
      const parent = task.parents[index];
      if (parent !== null && parent !== undefined) slot.dataset.treeParentKey = 's' + parent;
      slot.dataset.cardKind = 'class';
    });
    container.querySelectorAll('.knn-card').forEach((card) => { card.dataset.cardKind = 'class'; });
    renderTreeEdges(list);
  }

  setupCardSlots(container, {
    cards: task.cards,
    slots: task.slots,
    choices,
    onChange: (current) => writeState(stateInput, current),
  });
  decorate();
  new MutationObserver(decorate).observe(container, { childList: true });

  checkButton.addEventListener('click', () => showResult(resultBox, evaluateHierarchy(choices)));
}

/**
 * Erweiterte Klassenkarte (Aufgabe 6): Attributbereich oben, Methodenbereich unten.
 * edgeRoot (optional): Wurzel eines Diagramms, in dem die Karte unter einer Oberklasse hängt (Actor).
 */
export function mountClassCard(container, task, stateInput, checkButton, resultBox, edgeRoot) {
  const slots = [];
  for (let index = 1; index <= task.attributeSlots; index += 1) {
    slots.push({ id: 'attribut-' + index, label: task.className + ', Attributzeile ' + index });
  }
  for (let index = 1; index <= task.methodSlots; index += 1) {
    slots.push({ id: 'methode-' + index, label: task.className + ', Methodenzeile ' + index });
  }
  const cards = task.cards.map((card) => ({ id: card.id, text: card.text }));
  const choices = parseStoredChoices(stateInput.value, slots.length, cards.map((card) => card.id));

  function decorate() {
    const list = container.querySelector('.knn-slots');
    if (!list) return;
    list.classList.add('class-card');
    list.dataset.cardKind = 'class';
    if (!list.querySelector(':scope > .class-card-title')) {
      const title = document.createElement('h3');
      title.className = 'class-card-title';
      title.textContent = task.className;
      list.prepend(title);
    }
    const fields = list.querySelectorAll('.knn-slot');
    if (fields[task.attributeSlots]) fields[task.attributeSlots].classList.add('section-start');
    container.querySelectorAll('.knn-card').forEach((card) => { card.dataset.cardKind = 'class'; });
    if (edgeRoot) {
      list.dataset.treeNodeKey = task.key;
      list.dataset.treeParentKey = 'actor';
      renderTreeEdges(edgeRoot);
    }
  }

  setupCardSlots(container, {
    cards,
    slots,
    choices,
    onChange: (current) => writeState(stateInput, current),
  });
  decorate();
  new MutationObserver(decorate).observe(container, { childList: true });

  checkButton.addEventListener('click', () => showResult(resultBox, evaluateClassCard(task, choices)));
}
