import { normaliseNumber } from '../../perzeptron/logic/perceptron.mjs';
import { evaluateSemanticAnswer } from '../../perzeptron/ui/semantic-answer.mjs';
import { SHIRT_SYMBOLS, SHIRT_TRAINING } from '../data/shirts.mjs';
import { BLANK_IDS, COMPARE_A, COMPARE_B, COMPARE_P, EXPECTED, N1, N2, N5, PAIR_A, PAIR_B, STOP_H, STOP_K } from '../data/task7.mjs';
import { euclidean, formatDecimal, withinTolerance } from '../logic/knn.mjs';
import { setupCardSlots } from './card-slots.mjs';
import { renderLegend, renderShirtPlot } from './knn-plot.mjs';

const SERVER_URL = 'https://script.google.com/macros/s/AKfycby8RWL6uYrKZyoJ6m2GRpWyRmXjwsdskyCiqzKpRhIK5-wrDl-9lWWk8CiAGaVMoy0x/exec';
const TASK_ID = '11-7-1';
const STORAGE_KEY = 'informatik11-knn-aufgabe7-v1';
const STEPS = ['discover', 'neighbours', 'euclid', 'manhattan', 'apply', 'finish'];
const NS = 'http://www.w3.org/2000/svg';

/* ---------- Aufgabendaten: Auswahlaufgaben (Optionen in gemischter Reihenfolge) ---------- */

const MC = {
  discoverReasons: {
    options: [
      { id: 'near', text: 'Die Punkte, die der neuen Person im Diagramm am nächsten liegen, gehören fast alle zu M.', correct: true },
      { id: 'frequent', text: 'Weil M in den Trainingsdaten am häufigsten vorkommt.', correct: false, why: 'Zähle nach: In den Trainingsdaten kommt L 6-mal vor, S 5-mal und M nur 4-mal. Die Häufigkeit im ganzen Datensatz entscheidet ohnehin nicht – es zählt, welche Personen der neuen Person ähnlich sind.' },
      { id: 'similar', text: 'Personen mit ähnlicher Körpergröße und ähnlichem Brustumfang tragen meist M.', correct: true },
      { id: 'tall', text: 'Weil die Person größer als 180 cm ist.', correct: false, why: 'Die Körpergröße allein reicht nicht: Auch L-Personen wie 186|113 oder 190|116 sind größer als 180 cm. Erst Körpergröße und Brustumfang zusammen zeigen, welche Personen wirklich ähnlich sind.' },
    ],
    success: 'Richtig. Entscheidend ist, welche Trainingspersonen der neuen Person ähnlich sind – also welche Punkte nah bei ihr liegen. Dort tragen fast alle M.',
    missingHint: 'Deine Auswahl stimmt, ist aber noch unvollständig. Es gibt zwei passende Begründungen.',
  },
  neighboursReasons: {
    options: [
      { id: 'one', text: 'Bei k = 1 zählt nur der eine nächste Punkt, und er gehört zu M.', correct: true },
      { id: 'moved', text: 'Bei k = 5 wird der neue Punkt verschoben.', correct: false, why: 'Der neue Punkt bleibt bei 186|110. Mit k änderst du nur, wie viele Nachbarn mitzählen.' },
      { id: 'exact', text: 'k = 1 ist genauer, weil der nächste Punkt am ähnlichsten ist – deshalb stimmt M sicher.', correct: false, why: 'Der nächste Punkt ist zwar am ähnlichsten, aber er ist nur ein einzelner Punkt: Schon der zweit- und der drittnächste Punkt tragen L. Ob M oder L richtig ist, verrät die Grafik nicht – „sicher“ ist bei k = 1 nichts.' },
      { id: 'five', text: 'Bei k = 5 kommen weitere Nachbarn hinzu: Unter den fünf sind drei L und zwei M.', correct: true },
      { id: 'global', text: 'Bei k = 5 gewinnt L, weil L in allen Trainingsdaten am häufigsten vorkommt.', correct: false, why: 'Gezählt werden nur die fünf nächsten Nachbarn, nicht alle 15 Trainingspersonen. Dass L auch insgesamt häufig ist, spielt keine Rolle.' },
    ],
    success: 'Richtig. Der neue Punkt bleibt, wo er ist – es ändert sich nur, wie viele Nachbarn mitzählen. Ein einzelner M-Punkt liegt am nächsten, aber unter den fünf nächsten Punkten ist L in der Mehrheit.',
    missingHint: 'Deine Auswahl stimmt, ist aber noch unvollständig. Achte auf beide Fälle: Was zählt bei k = 1, und was kommt bei k = 5 hinzu?',
  },
  tieOptions: {
    options: [
      { id: 'both', text: 'Der neue Punkt gehört dann zu beiden Klassen gleichzeitig.', correct: false, why: 'Der Algorithmus ordnet jeden neuen Punkt genau einer Klasse zu. Bei 1 : 1 fehlt ihm dafür eine Mehrheit.' },
      { id: 'global', text: 'Bei einem Gleichstand gewinnt die Klasse, die in allen Trainingsdaten häufiger ist.', correct: false, why: 'Die Häufigkeit in allen Trainingsdaten spielt beim KNN-Algorithmus keine Rolle – es zählen nur die Nachbarn. Einfacher ist es, den Gleichstand von vornherein zu vermeiden.' },
      { id: 'nomajority', text: 'Es gibt keine Mehrheit – so kann der Algorithmus nicht entscheiden.', correct: true },
      { id: 'odd', text: 'Mit k = 1 oder k = 3 kann es bei zwei Klassen keinen Gleichstand geben.', correct: true },
    ],
    success: 'Richtig. Bei k = 2 kann es 1 : 1 stehen. Mit ungeradem k gibt es bei zwei Klassen immer eine Mehrheit.',
    missingHint: 'Deine Auswahl stimmt, ist aber noch unvollständig. Prüfe auch, ob mit k = 1 oder k = 3 bei zwei Klassen noch ein Gleichstand möglich ist.',
  },
  metricOptions: {
    options: [
      { id: 'shorter', text: 'Der Manhattan-Abstand ist kürzer, weil er den Straßen folgt.', correct: false, why: 'Wer den Straßen folgt, macht gegenüber der direkten Verbindung einen Umweg. Deshalb ist der Manhattan-Abstand nie kleiner als der euklidische. Vergleiche: Für P und A ist er 6, die direkte Verbindung nur etwa 4,24.' },
      { id: 'euA', text: 'Nach dem euklidischen Abstand ist A der nächste Nachbar von P.', correct: true },
      { id: 'never', text: 'Der Manhattan-Abstand ist nie kleiner als der euklidische Abstand.', correct: true },
      { id: 'same', text: 'Welcher Punkt der nächste Nachbar ist, hängt nicht davon ab, wie man den Abstand misst.', correct: false, why: 'Gerade dieses Beispiel zeigt das Gegenteil: Euklidisch liegt A näher an P, nach Manhattan B.' },
      { id: 'manB', text: 'Nach der Manhattan-Metrik ist B der nächste Nachbar von P.', correct: true },
    ],
    success: 'Richtig. Je nachdem, wie man den Abstand misst, ist ein anderer Punkt der nächste Nachbar von P. Der Manhattan-Abstand ist nie kleiner als der euklidische; gleich groß sind beide nur, wenn die Punkte auf einer Parallelen zu einer Achse liegen – wie P und B.',
    missingHint: 'Deine Auswahl stimmt, ist aber noch unvollständig. Vergleiche in deiner Tabelle jede Spalte und denke an die Umwege entlang der Straßen.',
  },
};

// Zuordnung Auswahlaufgabe -> Speicherort im Zustand
const MC_PATH = { discoverReasons: ['r1', 'reasons'], neighboursReasons: ['r2', 'reasons'], tieOptions: ['r2', 'tie'], metricOptions: ['r4', 'mc'] };

const ORDER_CARDS = [
  { id: 'd3', text: 'Die häufigste Klasse unter diesen k Nachbarn bestimmen' },
  { id: 'dx', text: 'Eine Trenngerade zwischen den Klassen berechnen' },
  { id: 'd1', text: 'Abstände des neuen Punkts zu allen Trainingsdaten berechnen' },
  { id: 'd4', text: 'Den neuen Punkt dieser Klasse zuordnen' },
  { id: 'd2', text: 'Die k Trainingsdaten mit den kleinsten Abständen auswählen' },
];
const ORDER_SOLUTION = ['d1', 'd2', 'd3', 'd4'];
const ORDER_SLOTS = ORDER_SOLUTION.map((id, index) => ({ id: 's' + (index + 1), label: 'Schritt ' + (index + 1) }));

const QUIZ = [
  {
    q: 'Wie bestimmt der KNN-Algorithmus die Klasse eines neuen Datenpunkts?',
    hint: 'Denke an die Reihenfolge der Schritte aus Reiter 2.',
    options: [
      { id: 'distances', text: 'Er berechnet die Abstände des neuen Punkts zu allen Trainingsdaten.', correct: true },
      { id: 'global', text: 'Er wählt die Klasse, die in allen Trainingsdaten am häufigsten vorkommt.', correct: false, why: 'Die Häufigkeit in allen Trainingsdaten spielt keine Rolle – es zählen nur die k nächsten Nachbarn.' },
      { id: 'smallest', text: 'Er wählt die k Trainingsdaten mit den kleinsten Abständen aus.', correct: true },
      { id: 'line', text: 'Er zieht wie das Perzeptron eine Trenngerade zwischen den Klassen.', correct: false, why: 'Eine Trenngerade berechnet das Perzeptron. KNN vergleicht den neuen Punkt direkt mit den Trainingsdaten.' },
    ],
  },
  {
    q: 'Die Nachbarn eines neuen Punkts sind nach Abstand sortiert: L, M, L, M, L. Was gilt?',
    hint: 'Zähle für jedes k nur die ersten k Nachbarn der Liste.',
    options: [
      { id: 'k5', text: 'Bei k = 5 wird der Punkt L zugeordnet.', correct: true },
      { id: 'k3', text: 'Bei k = 3 wird der Punkt M zugeordnet.', correct: false, why: 'Die ersten drei Nachbarn sind L, M, L – also zwei L gegen ein M.' },
      { id: 'k1', text: 'Bei k = 1 wird der Punkt L zugeordnet.', correct: true },
      { id: 'sure', text: 'Bei k = 1 ist das Ergebnis sicher richtig, weil der nächste Punkt am ähnlichsten ist.', correct: false, why: 'Auch der nächste Punkt kann eine andere Klasse haben als die meisten Punkte in seiner Umgebung; sicher ist das Ergebnis nicht.' },
    ],
  },
  {
    q: 'Was gilt für die Wahl von k und für Gleichstände?',
    hint: 'Lies die Regel für Gleichstände am Ende von Reiter 2.',
    options: [
      { id: 'two', text: 'Bei zwei Klassen verhindert ein ungerades k jeden Gleichstand.', correct: true },
      { id: 'both', text: 'Bei einem Gleichstand gehört der Punkt zu beiden Klassen.', correct: false, why: 'KNN ordnet jeden Punkt genau einer Klasse zu; bei einem Gleichstand entscheidet der nächstgelegene Nachbar.' },
      { id: 'three', text: 'Bei drei Klassen kann auch bei ungeradem k ein Gleichstand entstehen.', correct: true },
      { id: 'nearest', text: 'Bei einem Gleichstand entscheidet der nächstgelegene Nachbar.', correct: true },
    ],
  },
  {
    q: 'Wie groß ist der euklidische Abstand der Punkte A(2|1) und B(8|9)?',
    hint: 'Bilde die Differenzen der Koordinaten und setze den Satz des Pythagoras an.',
    options: [
      { id: 'hundred', text: '100', correct: false, why: '100 ist das Quadrat des Abstands; die Wurzel fehlt.' },
      { id: 'ten', text: '10', correct: true },
      { id: 'fourteen', text: '14', correct: false, why: '14 ist der Manhattan-Abstand: 6 + 8.' },
      { id: 'root', text: '√14 ≈ 3,74', correct: false, why: 'Hier wurden die Differenzen 6 und 8 nicht quadriert, bevor sie addiert wurden.' },
    ],
  },
  {
    q: 'Welche Aussagen über den Manhattan-Abstand stimmen?',
    hint: 'Denke an das Taxi in Manhattan aus Reiter 4.',
    options: [
      { id: 'shorter', text: 'Er ist kürzer als der euklidische Abstand, weil er den Straßen folgt.', correct: false, why: 'Der Weg entlang der Straßen ist ein Umweg und deshalb nie kürzer als die direkte Verbindung.' },
      { id: 'value', text: 'Für A(2|1) und B(8|9) beträgt er 14.', correct: true },
      { id: 'never', text: 'Er ist nie kleiner als der euklidische Abstand.', correct: true },
      { id: 'sum', text: 'Er addiert die Beträge der Koordinatendifferenzen.', correct: true },
    ],
  },
  {
    q: 'Welche Aussagen zum Schulshirt-Beispiel stimmen?',
    hint: 'Vergleiche mit der Tabelle aus Reiter 5 und dem Vergleich von P, A und B aus Reiter 4.',
    options: [
      { id: 'both', text: 'Der Abstand berücksichtigt Körpergröße und Brustumfang gemeinsam.', correct: true },
      { id: 'height', text: 'Es genügt, nur die Körpergröße zu vergleichen.', correct: false, why: 'Personen mit gleicher Körpergröße können sehr unterschiedlichen Brustumfang haben; der Abstand nutzt beide Merkmale.' },
      { id: 'metric', text: 'Welche Trainingsdaten die nächsten Nachbarn sind, kann vom Abstandsmaß abhängen.', correct: true },
      { id: 'n5', text: 'Für die neue Person N(178|98) gehören bei k = 5 drei Nachbarn zu M und zwei zu S.', correct: true },
    ],
  },
];

const OVERVIEW = [
  '<strong>Reiter 1 – Welche Größe passt?</strong> Die neue Person (183|106) bekommt M: Die Personen mit ähnlicher Körpergröße und ähnlichem Brustumfang tragen fast alle M.',
  '<strong>Reiter 2 – Die k nächsten Nachbarn</strong> Für N(186|110) ergibt k = 1 die Größe M und k = 5 die Größe L (drei L, zwei M). Reihenfolge: Abstände berechnen → k nächste auswählen → häufigste Klasse bestimmen → zuordnen. k ist ungerade; bei Gleichstand entscheidet der nächstgelegene Nachbar.',
  '<strong>Reiter 3 – Euklidischer Abstand</strong> N–A: d = 5; N–B: d = √13 ≈ 3,61. Formel: d = √((x₂ − x₁)² + (y₂ − y₁)²).',
  '<strong>Reiter 4 – Manhattan-Metrik</strong> H bis K: 8 Blocklängen. Für P(0|0) ist euklidisch A(3|3) mit ≈ 4,24 näher als B(5|0) mit 5, nach Manhattan B mit 5 näher als A mit 6.',
  '<strong>Reiter 5 – Schulshirts klassifizieren</strong> Fehlende Abstände: 4,47 (Nr. 3) und 7,28 (Nr. 6). Fünf nächste Nachbarn: Nr. 11, 4, 14, 3, 6 → drei M, zwei S → Shirtgröße M.',
];

/* ---------- Zustand und Speicherung ---------- */

const SIZES = ['S', 'M', 'L'];
const CARD_IDS = ORDER_CARDS.map((card) => card.id);

function defaultState() {
  return {
    active: 'discover',
    r1: { size: '', reasons: [] },
    r2: { k: 1, size1: '', size5: '', reasons: [], slots: ['', '', '', ''], orderSolved: false, tie: [], tieSolved: false },
    r3: { pair: 1, triangle: false, inA: '', inB: '', euclidSolved: false },
    r4: { manh: '', manhattanSolved: false, table: { eA: '', mA: '', eB: '', mB: '' }, mc: [], metricSolved: false },
    r5: { d3: '', d6: '', marked: [], size: '', text: '' },
    quiz: { selected: QUIZ.map(() => []), quizSolved: false },
  };
}
const cleanSize = (value) => (SIZES.includes(value) ? value : '');
const cleanText = (value, max) => (typeof value === 'string' ? value.slice(0, max) : '');
const cleanIds = (list, options) => (Array.isArray(list) ? [...new Set(list.filter((id) => options.includes(id)))] : []);
const optionIds = (key) => MC[key].options.map((option) => option.id);

function loadState() {
  const defaults = defaultState();
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!parsed || typeof parsed !== 'object') return defaults;
    const { r1 = {}, r2 = {}, r3 = {}, r4 = {}, r5 = {}, quiz = {} } = parsed;
    const slots = defaults.r2.slots.map((_, index) => (Array.isArray(r2.slots) && CARD_IDS.includes(r2.slots[index]) ? r2.slots[index] : ''));
    slots.forEach((id, index) => { if (id && slots.indexOf(id) !== index) slots[index] = ''; });
    const marked = Array.isArray(r5.marked) ? [...new Set(r5.marked.filter((id) => Number.isInteger(id) && id >= 1 && id <= SHIRT_TRAINING.length))] : [];
    const table = r4.table && typeof r4.table === 'object' ? r4.table : {};
    return {
      active: STEPS.includes(parsed.active) ? parsed.active : defaults.active,
      r1: { size: cleanSize(r1.size), reasons: cleanIds(r1.reasons, optionIds('discoverReasons')) },
      r2: {
        k: [1, 3, 5, 7].includes(r2.k) ? r2.k : 1,
        size1: cleanSize(r2.size1),
        size5: cleanSize(r2.size5),
        reasons: cleanIds(r2.reasons, optionIds('neighboursReasons')),
        slots,
        orderSolved: r2.orderSolved === true,
        tie: cleanIds(r2.tie, optionIds('tieOptions')),
        tieSolved: r2.tieSolved === true,
      },
      r3: { pair: [1, 2].includes(r3.pair) ? r3.pair : 1, triangle: r3.triangle === true, inA: cleanText(r3.inA, 20), inB: cleanText(r3.inB, 20), euclidSolved: r3.euclidSolved === true },
      r4: {
        manh: cleanText(r4.manh, 20),
        manhattanSolved: r4.manhattanSolved === true,
        table: { eA: cleanText(table.eA, 20), mA: cleanText(table.mA, 20), eB: cleanText(table.eB, 20), mB: cleanText(table.mB, 20) },
        mc: cleanIds(r4.mc, optionIds('metricOptions')),
        metricSolved: r4.metricSolved === true,
      },
      r5: { d3: cleanText(r5.d3, 20), d6: cleanText(r5.d6, 20), marked, size: cleanSize(r5.size), text: cleanText(r5.text, 600) },
      quiz: {
        selected: QUIZ.map((entry, index) => cleanIds(Array.isArray(quiz.selected) ? quiz.selected[index] : [], entry.options.map((option) => option.id))),
        quizSolved: quiz.quizSolved === true,
      },
    };
  } catch { return defaults; }
}
let state = loadState();

function saveState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  catch { document.querySelector('#save-status').textContent = 'Der Bearbeitungsstand konnte nicht lokal gespeichert werden.'; }
}

/* ---------- Hilfsfunktionen ---------- */

const $ = (selector) => document.querySelector(selector);
function feedback(id, kind, message, html = false) {
  const el = document.querySelector('#' + id);
  el.hidden = false;
  el.className = 'feedback ' + kind;
  if (html) el.innerHTML = message; else el.textContent = message;
}
function hideFeedback(id) { const el = document.querySelector('#' + id); if (el) el.hidden = true; }
const sameSet = (values, expected) => values.length === expected.length && expected.every((value) => values.includes(value));
const isNumber = (input, value) => { const parsed = normaliseNumber(input); return parsed !== null && Math.abs(parsed - value) < 0.0051; };
const symbol = (label) => SHIRT_SYMBOLS[label] + ' ' + label;

function svgElement(name, attributes = {}, text) {
  const node = document.createElementNS(NS, name);
  Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, String(value)));
  if (text !== undefined) node.textContent = text;
  return node;
}

/* ---------- Reiter ---------- */

function showStep(id, focus = false) {
  if (!STEPS.includes(id)) return;
  document.querySelectorAll('[data-panel]').forEach((panel) => { panel.hidden = panel.dataset.panel !== id; });
  document.querySelectorAll('[data-tab]').forEach((tab) => { const chosen = tab.dataset.tab === id; tab.setAttribute('aria-selected', String(chosen)); tab.tabIndex = chosen ? 0 : -1; });
  state.active = id; saveState();
  if (focus) {
    const heading = document.querySelector('#' + id + ' h2');
    if (heading && !heading.hasAttribute('tabindex')) heading.tabIndex = -1;
    heading?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    requestAnimationFrame(() => { const active = document.activeElement; if (active?.closest('#' + id)) return; heading?.focus({ preventScroll: true }); });
  }
}
function labelFor(id) { return document.querySelector('[data-tab=' + id + ']')?.textContent.replace(/^\d+\s*/, '') || id; }
function flowButton(text, target) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'primary-button';
  button.textContent = text;
  button.addEventListener('click', () => showStep(target, true));
  return button;
}
function setupTabs() {
  document.querySelectorAll('[data-tab]').forEach((tab) => {
    tab.addEventListener('click', () => showStep(tab.dataset.tab, true));
    tab.addEventListener('keydown', (event) => {
      const index = STEPS.indexOf(tab.dataset.tab);
      const move = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -1, ArrowDown: 1 }[event.key];
      let next = index;
      if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = STEPS.length - 1;
      else if (move) next = (index + move + STEPS.length) % STEPS.length;
      else return;
      event.preventDefault();
      showStep(STEPS[next]);
      document.querySelector('[data-tab=' + STEPS[next] + ']')?.focus();
    });
  });
  document.querySelectorAll('[data-flow]').forEach((container) => {
    const next = STEPS[STEPS.indexOf(container.dataset.flow) + 1];
    if (next) container.replaceChildren(flowButton('Weiter: ' + labelFor(next), next));
  });
}

/* ---------- Auswahlknöpfe (Einfachauswahl ohne Radios) ---------- */

const CHOICES = {
  discoverSize: { get: () => state.r1.size, set: (value) => { state.r1.size = value; } },
  k: { get: () => String(state.r2.k), set: (value) => { state.r2.k = Number(value); }, required: true, after: () => updateNeighbours() },
  size1: { get: () => state.r2.size1, set: (value) => { state.r2.size1 = value; } },
  size5: { get: () => state.r2.size5, set: (value) => { state.r2.size5 = value; } },
  pair: { get: () => String(state.r3.pair), set: (value) => { state.r3.pair = Number(value); }, required: true, after: () => drawEuclid() },
  applySize: { get: () => state.r5.size, set: (value) => { state.r5.size = value; } },
};
function syncChoices() {
  document.querySelectorAll('[data-choice]').forEach((group) => {
    const current = CHOICES[group.dataset.choice].get();
    group.querySelectorAll('.knn-choice').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.value === current)));
  });
}
function setupChoices() {
  document.querySelectorAll('[data-choice]').forEach((group) => {
    const config = CHOICES[group.dataset.choice];
    group.querySelectorAll('.knn-choice').forEach((button) => button.addEventListener('click', () => {
      const value = button.dataset.value;
      config.set(!config.required && config.get() === value ? '' : value);
      syncChoices();
      config.after?.();
      saveState();
    }));
  });
  syncChoices();
}

/* ---------- Auswahlaufgaben mit Kästchen ---------- */

function mcList(key) { const [section, field] = MC_PATH[key]; return state[section][field]; }
function setMcList(key, values) { const [section, field] = MC_PATH[key]; state[section][field] = values; }

function renderChoiceFieldset(fieldset, options, selected, onChange) {
  options.forEach((option) => {
    const label = document.createElement('label');
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.value = option.id;
    input.checked = selected.includes(option.id);
    input.addEventListener('change', onChange);
    label.append(input, document.createTextNode(' ' + option.text));
    fieldset.append(label);
  });
}
const checkedIds = (fieldset) => [...fieldset.querySelectorAll('input[type=checkbox]:checked')].map((input) => input.value);

// Einheitliche Auswertung außerhalb des Quiz: Jede Frage hat einen eigenen Button und eine eigene Rückmeldung.
function checkChoice(key, selected, feedbackId) {
  const { options, success, missingHint } = MC[key];
  const correctIds = options.filter((option) => option.correct).map((option) => option.id);
  if (!selected.length) { feedback(feedbackId, 'error', 'Kreuze mindestens eine Aussage an.'); return false; }
  const wrongChosen = options.filter((option) => !option.correct && selected.includes(option.id));
  const rightChosen = selected.filter((id) => correctIds.includes(id));
  if (!wrongChosen.length && rightChosen.length === correctIds.length) { feedback(feedbackId, 'success', success); return true; }
  if (wrongChosen.length) { feedback(feedbackId, rightChosen.length ? 'partial' : 'error', wrongChosen.map((option) => option.why).join(' ')); return false; }
  feedback(feedbackId, 'partial', missingHint);
  return false;
}
function setupChoiceQuestions() {
  document.querySelectorAll('[data-mc]').forEach((fieldset) => {
    const key = fieldset.dataset.mc;
    renderChoiceFieldset(fieldset, MC[key].options, mcList(key), () => { setMcList(key, checkedIds(fieldset)); saveState(); });
  });
  const bind = (buttonId, key, feedbackId, onSolved) => {
    $('#' + buttonId).addEventListener('click', () => {
      const solved = checkChoice(key, checkedIds(document.querySelector('[data-mc=' + key + ']')), feedbackId);
      if (solved) onSolved?.();
    });
  };
  bind('check-discover-reasons', 'discoverReasons', 'discover-reasons-feedback');
  bind('check-neighbours-reasons', 'neighboursReasons', 'neighbours-reasons-feedback');
  bind('check-tie', 'tieOptions', 'tie-feedback', () => { state.r2.tieSolved = true; saveState(); $('#tie-remember').hidden = false; });
  bind('check-metric', 'metricOptions', 'metric-feedback', () => { state.r4.metricSolved = true; saveState(); $('#metric-remember').hidden = false; });
}

/* ---------- Reiter 1 ---------- */

function setupDiscover() {
  renderShirtPlot($('#discover-plot'), { data: SHIRT_TRAINING, newPoint: N1, newLabel: 'neue Person (183|106)' });
  renderLegend($('#discover-legend'));
  $('#check-discover-size').addEventListener('click', () => {
    const size = state.r1.size;
    if (!size) feedback('discover-size-feedback', 'error', 'Wähle eine Größe aus.');
    else if (size === EXPECTED.discoverSize) feedback('discover-size-feedback', 'success', 'Richtig. Die Personen, die der neuen Person in Körpergröße und Brustumfang ähneln, tragen fast alle M.');
    else if (size === 'L') feedback('discover-size-feedback', 'error', 'Noch nicht korrekt. Die L-Punkte liegen meist weiter oben rechts – bei größerem Brustumfang. Schau dir an, welche Punkte direkt um die neue Person herum liegen.');
    else feedback('discover-size-feedback', 'error', 'Noch nicht korrekt. Die S-Punkte liegen alle links unten, bei kleiner Körpergröße und kleinem Brustumfang. Die neue Person liegt weit davon entfernt.');
  });
}

/* ---------- Reiter 2 ---------- */

let baseNeighboursDesc = '';
function updateNeighbours() {
  const k = state.r2.k;
  const { neighbours, counts } = renderShirtPlot($('#neighbours-plot'), { data: SHIRT_TRAINING, newPoint: N2, newLabel: 'N (186|110)', k });
  $('#neighbour-counts').textContent = 'Unter den k = ' + k + ' nächsten Nachbarn: ○ S: ' + counts.S + ' · △ M: ' + counts.M + ' · □ L: ' + counts.L;
  $('#neighbour-list').replaceChildren(...neighbours.map(({ item }) => {
    const li = document.createElement('li');
    li.textContent = symbol(item.label) + ' (' + item.x + '|' + item.y + ')';
    return li;
  }));
  $('#neighbours-plot-desc').textContent = baseNeighboursDesc + ' Mit k = ' + k + ' führen Linien zu: ' + neighbours.map(({ item }) => 'Größe ' + item.label + ' bei ' + item.x + ' und ' + item.y).join(', ') + '.';
}

function checkSizes() {
  const { size1, size5 } = state.r2;
  if (!size1 || !size5) { feedback('sizes-feedback', 'error', 'Wähle für k = 1 und für k = 5 je eine Größe aus.'); return; }
  const ok1 = size1 === EXPECTED.neighbours.k1;
  const ok5 = size5 === EXPECTED.neighbours.k5;
  if (ok1 && ok5) feedback('sizes-feedback', 'success', 'Richtig. Bei k = 1 zählt nur der nächste Punkt (185|109), und der trägt M. Bei k = 5 tragen drei der fünf Nachbarn L und zwei M – die Mehrheit ist L.');
  else if (ok1) feedback('sizes-feedback', 'partial', 'k = 1 stimmt. Für k = 5 zähle alle fünf verbundenen Punkte: Welche Größe kommt unter ihnen am häufigsten vor?');
  else if (ok5) feedback('sizes-feedback', 'partial', 'k = 5 stimmt. Bei k = 1 zählt nur ein einziger Punkt – der, zu dem die kürzeste Linie führt. Welche Größe hat er?');
  else feedback('sizes-feedback', 'error', 'Noch nicht korrekt. Stelle k ein und zähle nur die Punkte, zu denen eine Linie führt. Die Größe, die dabei am häufigsten vorkommt, bekommt die neue Person.');
}

function checkOrder() {
  const slots = state.r2.slots;
  if (slots.some((id) => !id)) { feedback('order-feedback', 'error', 'Lege in jedes der vier Felder eine Karte.'); return; }
  if (slots.includes('dx')) { feedback('order-feedback', 'error', 'Die Karte „Eine Trenngerade zwischen den Klassen berechnen“ gehört nicht dazu: Eine Trenngerade berechnet das Perzeptron aus Aufgabe 5. Hier wird der neue Punkt direkt mit den Trainingsdaten verglichen – eine Grenze wird nicht berechnet.'); return; }
  const correct = slots.filter((id, index) => id === ORDER_SOLUTION[index]).length;
  if (correct === 4) {
    feedback('order-feedback', 'success', 'Richtig. Erst werden alle Abstände berechnet, dann die k nächsten Punkte ausgewählt, dann wird gezählt und zugeordnet.');
    state.r2.orderSolved = true; saveState(); $('#knn-remember').hidden = false;
  } else if (correct > 0) feedback('order-feedback', 'partial', correct + ' von 4 Schritten stehen an der richtigen Stelle. Überlege bei jedem Schritt: Welches Ergebnis braucht er aus dem Schritt davor?');
  else feedback('order-feedback', 'error', 'Noch nicht korrekt. Beginne mit der Frage: Was muss man wissen, bevor man entscheiden kann, welche Punkte am nächsten liegen?');
}

function setupNeighbours() {
  baseNeighboursDesc = $('#neighbours-plot-desc').textContent;
  renderLegend($('#neighbours-legend'));
  updateNeighbours();
  $('#check-sizes').addEventListener('click', checkSizes);
  const cards = setupCardSlots($('#order-cards'), { cards: ORDER_CARDS, slots: ORDER_SLOTS, choices: state.r2.slots, onChange: () => saveState() });
  $('#check-order').addEventListener('click', checkOrder);
  $('#reset-order').addEventListener('click', () => { cards.reset(); hideFeedback('order-feedback'); });
  $('#knn-remember').hidden = !state.r2.orderSolved;
  $('#tie-remember').hidden = !state.r2.tieSolved;
}

/* ---------- Koordinatensysteme für Reiter 3 und 4 ---------- */

// Gitter, Achsen, Zahlen und Titel; löscht alles außer <title> und <desc>.
function drawFrame(svg, { x, y, px, py, grid = 'lines', axes = true, titles = null, titleOffset = 46, xTickGap = 18, yTickGap = 8 }) {
  [...svg.children].forEach((child) => { if (!['title', 'desc'].includes(child.localName)) child.remove(); });
  const arrowId = svg.id + '-arrow';
  const defs = svgElement('defs');
  const marker = svgElement('marker', { id: arrowId, markerUnits: 'userSpaceOnUse', markerWidth: 10, markerHeight: 10, refX: 9, refY: 5, orient: 'auto' });
  marker.append(svgElement('path', { d: 'M0,0 L10,5 L0,10 z' }));
  defs.append(marker);
  const lines = svgElement('g', { class: grid === 'streets' ? 'knn-streets' : 'knn-grid', 'aria-hidden': 'true' });
  const lineClass = grid === 'streets' ? 'knn-street' : '';
  for (let value = x[0]; value <= x[1]; value++) lines.append(svgElement('line', { class: lineClass, x1: px(value), y1: py(y[0]), x2: px(value), y2: py(y[1]) }));
  for (let value = y[0]; value <= y[1]; value++) lines.append(svgElement('line', { class: lineClass, x1: px(x[0]), y1: py(value), x2: px(x[1]), y2: py(value) }));
  const ticks = svgElement('g', { class: 'knn-ticks', 'aria-hidden': 'true' });
  for (let value = x[0]; value <= x[1]; value++) ticks.append(svgElement('text', { x: px(value), y: py(y[0]) + xTickGap, 'text-anchor': 'middle' }, value));
  for (let value = y[0]; value <= y[1]; value++) ticks.append(svgElement('text', { x: px(x[0]) - yTickGap, y: py(value) + 4, 'text-anchor': 'end' }, value));
  svg.append(defs, lines);
  if (axes) {
    const group = svgElement('g', { class: 'knn-axes', 'aria-hidden': 'true' });
    group.append(
      svgElement('line', { x1: px(x[0]), y1: py(y[0]), x2: px(x[1]) + 22, y2: py(y[0]), 'marker-end': 'url(#' + arrowId + ')' }),
      svgElement('line', { x1: px(x[0]), y1: py(y[0]), x2: px(x[0]), y2: py(y[1]) - 22, 'marker-end': 'url(#' + arrowId + ')' }),
    );
    svg.append(group);
  }
  svg.append(ticks);
  if (titles) {
    const group = svgElement('g', { class: 'knn-axis-titles', 'aria-hidden': 'true' });
    const middleY = (py(y[0]) + py(y[1])) / 2;
    group.append(
      svgElement('text', { x: (px(x[0]) + px(x[1])) / 2, y: py(y[0]) + titleOffset, 'text-anchor': 'middle' }, titles[0]),
      svgElement('text', { x: 14, y: middleY, 'text-anchor': 'middle', transform: 'rotate(-90 14 ' + middleY + ')' }, titles[1]),
    );
    svg.append(group);
  }
}
function pointMark(svg, at, label, { diamond = false, dx = 12, dy = -10, anchor = 'start' } = {}) {
  const group = svgElement('g', { transform: 'translate(' + at.x + ' ' + at.y + ')' });
  group.append(svgElement('title', {}, label));
  if (diamond) group.append(svgElement('circle', { class: 'knn-new-ring', r: 14 }), svgElement('path', { class: 'knn-new-mark', d: 'M0,-9 L9,0 L0,9 L-9,0 Z' }));
  else group.append(svgElement('circle', { class: 'knn-neutral-mark', r: 6.5 }));
  svg.append(group, svgElement('text', { class: 'knn-point-label', x: at.x + dx, y: at.y + dy, 'text-anchor': anchor }, label));
}

/* ---------- Reiter 3: Euklidischer Abstand ---------- */

function drawEuclid() {
  const svg = $('#euclid-plot');
  const px = (value) => 60 + (value - 178) * 40;
  const py = (value) => 520 - (value - 100) * 40;
  drawFrame(svg, { x: [178, 188], y: [100, 112], px, py, titles: ['Körpergröße in cm', 'Brustumfang in cm'], titleOffset: 36, xTickGap: 17 });
  const at = (point) => ({ x: px(point.x), y: py(point.y) });
  const n = at(N1);
  const other = state.r3.pair === 1 ? at(PAIR_A) : at(PAIR_B);
  const corner = state.r3.pair === 1 ? { x: n.x, y: other.y } : { x: other.x, y: n.y };
  if (state.r3.triangle) {
    const legs = svgElement('g', { 'aria-hidden': 'true' });
    legs.append(
      svgElement('line', { class: 'knn-leg', x1: n.x, y1: n.y, x2: corner.x, y2: corner.y }),
      svgElement('line', { class: 'knn-leg', x1: corner.x, y1: corner.y, x2: other.x, y2: other.y }),
    );
    svg.append(legs);
  }
  svg.append(svgElement('line', { class: 'knn-pair-line', x1: n.x, y1: n.y, x2: other.x, y2: other.y }));
  if (state.r3.triangle) {
    const unit = (from, to) => ({ x: Math.sign(to.x - from.x), y: Math.sign(to.y - from.y) });
    const u1 = unit(corner, n);
    const u2 = unit(corner, other);
    const size = 12;
    svg.append(svgElement('polygon', { class: 'knn-right-angle', 'aria-hidden': 'true', points: [
      [corner.x, corner.y],
      [corner.x + size * u1.x, corner.y + size * u1.y],
      [corner.x + size * (u1.x + u2.x), corner.y + size * (u1.y + u2.y)],
      [corner.x + size * u2.x, corner.y + size * u2.y],
    ].map((pair) => pair.join(',')).join(' ') }));
  }
  pointMark(svg, at(PAIR_A), 'A (180|102)', { dx: -14, dy: 22 });
  pointMark(svg, at(PAIR_B), 'B (185|109)');
  pointMark(svg, n, 'N (183|106)', { diamond: true, dx: -18, dy: -14, anchor: 'end' });
  const button = $('#toggle-triangle');
  button.setAttribute('aria-pressed', String(state.r3.triangle));
  button.textContent = state.r3.triangle ? 'Dreieck ausblenden' : 'Dreieck einblenden';
}

function checkEuclid() {
  const inputs = { a: $('#dist-a'), b: $('#dist-b') };
  const statusA = withinTolerance(inputs.a.value, EXPECTED.euclid.a);
  const statusB = withinTolerance(inputs.b.value, EXPECTED.euclid.b);
  const okA = statusA === 'correct';
  const okB = statusB === 'correct';
  inputs.a.classList.toggle('is-correct', okA); inputs.a.classList.toggle('is-wrong', !okA);
  inputs.b.classList.toggle('is-correct', okB); inputs.b.classList.toggle('is-wrong', !okB);
  if (okA && okB) {
    feedback('euclid-feedback', 'success', 'Richtig. N–A ist 5 cm lang, N–B etwa 3,61 cm. B liegt also näher an N als A.');
    state.r3.euclidSolved = true; saveState(); $('#euclid-remember').hidden = false;
    return;
  }
  const messages = [];
  if (!okA) {
    if (statusA === 'invalid') messages.push('Gib eine Zahl ein, zum Beispiel 3,25.');
    else if (isNumber(inputs.a.value, 7)) messages.push('N–A: Du hast die beiden Differenzen addiert. Das wäre ein Weg entlang der Gitterlinien. Die direkte Verbindung ist kürzer – sie ist die längste Seite eines rechtwinkligen Dreiecks.');
    else if (isNumber(inputs.a.value, 25)) messages.push('N–A: 25 ist das Quadrat des Abstands. Ziehe noch die Wurzel.');
    else messages.push('N–A: Noch nicht korrekt. Blende das Dreieck ein und zähle die Kästchen entlang der beiden kurzen Seiten.');
  }
  if (!okB) {
    if (statusB === 'invalid') messages.push('Gib eine Zahl ein, zum Beispiel 3,25.');
    else if (isNumber(inputs.b.value, 5)) messages.push('N–B: Du hast die beiden Differenzen addiert. Die direkte Verbindung ist kürzer als der Weg entlang der Gitterlinien.');
    else if (isNumber(inputs.b.value, 13)) messages.push('N–B: 13 ist das Quadrat des Abstands. Ziehe noch die Wurzel und runde auf zwei Nachkommastellen.');
    else if (statusB === 'near') messages.push('N–B: Fast richtig. Prüfe das Runden: Schau dir die dritte Nachkommastelle an.');
    else messages.push('N–B: Noch nicht korrekt. Wähle Paar 2, blende das Dreieck ein und bestimme zuerst die Längen der beiden kurzen Seiten.');
  }
  const text = [...new Set(messages)].join(' ');
  const oneRight = okA || okB;
  feedback('euclid-feedback', oneRight ? 'partial' : 'error', (oneRight ? 'Ein Abstand stimmt. ' : '') + text);
}

function setupEuclid() {
  const inputs = { inA: $('#dist-a'), inB: $('#dist-b') };
  inputs.inA.value = state.r3.inA;
  inputs.inB.value = state.r3.inB;
  inputs.inA.maxLength = 20;
  inputs.inB.maxLength = 20;
  inputs.inA.addEventListener('input', () => { state.r3.inA = inputs.inA.value; saveState(); });
  inputs.inB.addEventListener('input', () => { state.r3.inB = inputs.inB.value; saveState(); });
  $('#toggle-triangle').addEventListener('click', () => { state.r3.triangle = !state.r3.triangle; saveState(); drawEuclid(); });
  $('#check-euclid').addEventListener('click', checkEuclid);
  drawEuclid();
  $('#euclid-remember').hidden = !state.r3.euclidSolved;
}

/* ---------- Reiter 4: Manhattan-Metrik ---------- */

function drawManhattan() {
  const svg = $('#manhattan-plot');
  const px = (value) => 50 + value * 60;
  const py = (value) => 350 - value * 60;
  drawFrame(svg, { x: [0, 7], y: [0, 5], px, py, grid: 'streets', axes: false, xTickGap: 30, yTickGap: 20 });
  const path = (cells) => cells.map(([x, y]) => px(x) + ',' + py(y)).join(' ');
  const route = (className, cells) => svg.append(svgElement('polyline', { class: className, points: path(cells), 'stroke-linejoin': 'round', 'aria-hidden': 'true' }));
  route('knn-route-red', [[1, 1], [1, 4], [6, 4]]);
  route('knn-route-blue', [[1, 1], [2, 1], [2, 2], [4, 2], [4, 3], [5, 3], [5, 4], [6, 4]]);
  svg.append(svgElement('line', { class: 'knn-route-direct', x1: px(STOP_H.x), y1: py(STOP_H.y), x2: px(STOP_K.x), y2: py(STOP_K.y), 'aria-hidden': 'true' }));
  pointMark(svg, { x: px(STOP_H.x), y: py(STOP_H.y) }, 'H (1|1)', { dx: -14, dy: 28 });
  pointMark(svg, { x: px(STOP_K.x), y: py(STOP_K.y) }, 'K (6|4)', { dx: 12, dy: -12 });
}

function checkManhattan() {
  const value = $('#manhattan-input').value;
  if (isNumber(value, EXPECTED.manhattan)) {
    feedback('manhattan-feedback', 'success', 'Richtig. Das Taxi fährt 5 Blöcke nach rechts und 3 nach oben – zusammen 8. Die rote und die blaue Route sind gleich lang.');
    state.r4.manhattanSolved = true; saveState(); $('#manhattan-remember').hidden = false;
  } else if (withinTolerance(value, euclidean(STOP_H, STOP_K)) === 'correct') feedback('manhattan-feedback', 'error', 'Das ist die Länge der direkten Verbindung, also der euklidische Abstand. Ein Taxi kann aber nicht quer durch die Häuserblöcke fahren – zähle die Blocklängen entlang der Straßen.');
  else if (isNumber(value, 5) || isNumber(value, 3)) feedback('manhattan-feedback', 'error', 'Du hast nur eine Richtung gezählt. Das Taxi muss nach rechts und nach oben fahren.');
  else if (isNumber(value, 34)) feedback('manhattan-feedback', 'error', '34 wäre das Quadrat der direkten Verbindung. Beim Manhattan-Abstand wird nichts quadriert – du zählst nur Blocklängen entlang der Straßen.');
  else feedback('manhattan-feedback', 'error', 'Noch nicht korrekt. Fahre eine der eingezeichneten Routen ab und zähle jede Blocklänge.');
}

function drawCompare() {
  const svg = $('#compare-plot');
  const px = (value) => 40 + value * 55;
  const py = (value) => 260 - value * 55;
  drawFrame(svg, { x: [0, 6], y: [0, 4], px, py, xTickGap: 18 });
  const at = (point) => ({ x: px(point.x), y: py(point.y) });
  pointMark(svg, at(COMPARE_P), 'P (0|0)', { dx: 10, dy: -12 });
  pointMark(svg, at(COMPARE_A), 'A (3|3)', { dx: 12, dy: -10 });
  pointMark(svg, at(COMPARE_B), 'B (5|0)', { dx: 8, dy: -14 });
}

const COMPARE_CELLS = [
  { key: 'eA', name: 'P zu A, euklidisch', expected: EXPECTED.compare.eA },
  { key: 'mA', name: 'P zu A, Manhattan', expected: EXPECTED.compare.mA },
  { key: 'eB', name: 'P zu B, euklidisch', expected: EXPECTED.compare.eB },
  { key: 'mB', name: 'P zu B, Manhattan', expected: EXPECTED.compare.mB },
];
function checkCompare() {
  const table = $('#compare-table');
  const results = COMPARE_CELLS.map((cell) => {
    const input = table.querySelector('[data-answer=' + cell.key + ']');
    const status = withinTolerance(input.value, cell.expected);
    input.classList.toggle('is-correct', status === 'correct');
    input.classList.toggle('is-wrong', status !== 'correct');
    return { ...cell, input, status };
  });
  const correct = results.filter((result) => result.status === 'correct').length;
  if (correct === 4) { feedback('compare-feedback', 'success', 'Richtig. Alle vier Abstände stimmen. Vergleiche jetzt in jeder Spalte, welcher Punkt näher an P liegt.'); return; }
  const first = results.find((result) => result.status !== 'correct');
  const kind = correct ? 'partial' : 'error';
  const value = first.input.value;
  if (first.key === 'eA' && isNumber(value, 6)) feedback('compare-feedback', kind, 'Bei „P zu A, euklidisch“ hast du die Differenzen addiert – das ist der Manhattan-Abstand. Euklidisch ist die direkte Verbindung gemeint.');
  else if (first.key === 'eA' && isNumber(value, 18)) feedback('compare-feedback', kind, 'Bei „P zu A, euklidisch“ ist 18 das Quadrat des Abstands. Ziehe noch die Wurzel.');
  else if (first.key === 'eA' && first.status === 'near') feedback('compare-feedback', kind, 'Bei „P zu A, euklidisch“: Fast richtig. Prüfe das Runden.');
  else if (first.key === 'mA' && withinTolerance(value, EXPECTED.compare.eA) === 'correct') feedback('compare-feedback', kind, 'Bei „P zu A, Manhattan“ hast du die direkte Verbindung berechnet. Nach Manhattan addierst du die Wege entlang der beiden Achsen.');
  else feedback('compare-feedback', kind, correct + ' von 4 Abständen stimmen. Prüfe zuerst: ' + first.name + '.');
}

function setupManhattan() {
  const input = $('#manhattan-input');
  input.maxLength = 20;
  input.value = state.r4.manh;
  input.addEventListener('input', () => { state.r4.manh = input.value; saveState(); });
  drawManhattan();
  $('#check-manhattan').addEventListener('click', checkManhattan);
  drawCompare();
  COMPARE_CELLS.forEach((cell) => {
    const field = $('#compare-table [data-answer=' + cell.key + ']');
    field.maxLength = 20;
    field.value = state.r4.table[cell.key];
    field.addEventListener('input', () => { state.r4.table[cell.key] = field.value; saveState(); });
  });
  $('#check-compare').addEventListener('click', checkCompare);
  $('#manhattan-remember').hidden = !state.r4.manhattanSolved;
  $('#metric-remember').hidden = !state.r4.metricSolved;
}

/* ---------- Reiter 5: Schulshirts klassifizieren ---------- */

function applyRowTemplate(item) {
  const row = document.createElement('tr');
  row.dataset.id = String(item.id);
  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'knn-mark-toggle';
  toggle.setAttribute('aria-label', 'Nr. ' + item.id + ' als Nachbar markieren');
  const first = document.createElement('td');
  first.append(toggle);
  const cells = [item.id, item.x, item.y].map((value) => { const cell = document.createElement('td'); cell.textContent = value; return cell; });
  const size = document.createElement('td');
  const mark = document.createElement('span');
  mark.className = 'knn-symbol';
  mark.textContent = SHIRT_SYMBOLS[item.label];
  size.append(mark, document.createTextNode(' ' + item.label));
  const distance = document.createElement('td');
  if (BLANK_IDS.includes(item.id)) {
    const label = document.createElement('label');
    const hidden = document.createElement('span');
    hidden.className = 'sr-only';
    hidden.textContent = 'Abstand von Nr. ' + item.id + ' zu N';
    const input = document.createElement('input');
    input.dataset.answer = 'd' + item.id;
    input.inputMode = 'decimal';
    input.autocomplete = 'off';
    input.maxLength = 20;
    label.append(hidden, input);
    distance.append(label);
  } else distance.textContent = formatDecimal(euclidean(N5, item));
  row.append(first, cells[0], cells[1], cells[2], size, distance);
  return { row, toggle };
}

function updateMarkedRows() {
  document.querySelectorAll('#apply-body tr').forEach((row) => {
    const marked = state.r5.marked.includes(Number(row.dataset.id));
    row.classList.toggle('is-marked', marked);
    const toggle = row.querySelector('.knn-mark-toggle');
    toggle.setAttribute('aria-pressed', String(marked));
    toggle.textContent = marked ? '✓' : '';
  });
}
function toggleMarked(id) {
  const marked = state.r5.marked;
  state.r5.marked = marked.includes(id) ? marked.filter((entry) => entry !== id) : [...marked, id];
  updateMarkedRows();
  saveState();
}

function distanceStatus(key, expected) {
  const input = $('#apply-body [data-answer=' + key + ']');
  const status = withinTolerance(input.value, expected);
  input.classList.toggle('is-correct', status === 'correct');
  input.classList.toggle('is-wrong', status !== 'correct');
  return { input, status };
}
function checkDistances() {
  const fields = [
    { id: 3, key: 'd3', expected: EXPECTED.apply.d3, manhattan: 6, square: 20 },
    { id: 6, key: 'd6', expected: EXPECTED.apply.d6, manhattan: 9, square: 53 },
  ].map((field) => ({ ...field, ...distanceStatus(field.key, field.expected) }));
  const correct = fields.filter((field) => field.status === 'correct').length;
  if (correct === 2) { feedback('distances-feedback', 'success', 'Richtig. Nr. 3 hat den Abstand 4,47 und Nr. 6 den Abstand 7,28.'); return; }
  const messages = fields.filter((field) => field.status !== 'correct').map((field) => {
    const value = field.input.value.trim();
    if (isNumber(value, field.manhattan)) return 'Nr. ' + field.id + ': ' + field.manhattan + ' ist der Manhattan-Abstand. Gesucht ist hier der euklidische Abstand, die direkte Verbindung.';
    if (isNumber(value, field.square)) return 'Nr. ' + field.id + ': ' + field.square + ' ist das Quadrat des Abstands. Ziehe noch die Wurzel.';
    if (field.status === 'near') return 'Nr. ' + field.id + ': Fast richtig. Prüfe das Runden auf zwei Nachkommastellen.';
    return 'Nr. ' + field.id + ': Noch nicht korrekt. Bilde zuerst die Differenzen zu N(178|98).';
  });
  feedback('distances-feedback', correct ? 'partial' : 'error', (correct ? 'Ein Abstand stimmt. ' : '') + messages.join(' '));
}
function checkMarked() {
  const marked = state.r5.marked;
  if (!marked.length) { feedback('marked-feedback', 'error', 'Tippe die Zeilen der fünf nächsten Nachbarn an.'); return; }
  if (marked.length !== 5) { feedback('marked-feedback', 'error', 'Markiere genau fünf Zeilen – bei k = 5 zählen fünf Nachbarn.'); return; }
  if (sameSet(marked, EXPECTED.apply.neighbourIds)) { feedback('marked-feedback', 'success', 'Richtig. Nr. 11, 4, 14, 3 und 6 haben die fünf kleinsten Abstände, von 3,16 bis 7,28.'); return; }
  const correct = marked.filter((id) => EXPECTED.apply.neighbourIds.includes(id)).length;
  const blanksOpen = [['d3', EXPECTED.apply.d3], ['d6', EXPECTED.apply.d6]].some(([key, expected]) => withinTolerance($('#apply-body [data-answer=' + key + ']').value, expected) !== 'correct');
  feedback('marked-feedback', correct ? 'partial' : 'error', correct + ' von 5 markierten Zeilen stimmen. Entscheidend sind die fünf kleinsten Werte der Abstandsspalte – vergleiche sie der Größe nach.' + (blanksOpen ? ' Berechne zuerst die beiden fehlenden Abstände – beide sind für die Entscheidung wichtig.' : ''));
}
function checkApplySize() {
  const size = state.r5.size;
  if (!size) feedback('apply-size-feedback', 'error', 'Wähle eine Shirtgröße aus.');
  else if (size === EXPECTED.apply.size) feedback('apply-size-feedback', 'success', 'Richtig. Unter den fünf nächsten Nachbarn tragen drei M (Nr. 11, 3, 6) und zwei S (Nr. 4, 14). Die Person bekommt Größe M.');
  else if (size === 'S') feedback('apply-size-feedback', 'error', 'Noch nicht korrekt. Zwei Nachbarn tragen zwar S, aber zähle alle fünf: Es entscheidet die Größe, die unter allen fünf Nachbarn am häufigsten vorkommt.');
  else feedback('apply-size-feedback', 'error', 'Noch nicht korrekt. Unter den fünf nächsten Nachbarn trägt niemand L. Die Größe, die in allen Trainingsdaten am häufigsten ist, spielt beim KNN-Algorithmus keine Rolle.');
}

const FALLBACK_TEXT = {
  correct: 'Du erläuterst alle Schritte am Beispiel: Abstände berechnen, fünf nächste Nachbarn auswählen, Klassen zählen und M zuordnen.',
  partial: 'Die Grundidee stimmt. Ergänze die noch fehlenden Schritte und nenne die Zahlen aus dem Beispiel.',
  incorrect: 'Beschreibe Schritt für Schritt, was mit dem neuen Punkt N(178|98) passiert – von den Abständen bis zur Shirtgröße.',
};
function setupExplanation() {
  const textarea = $('#apply-answer');
  const counter = $('#apply-counter');
  const update = () => { counter.textContent = textarea.value.length + ' von 600 Zeichen'; };
  textarea.addEventListener('input', () => { state.r5.text = textarea.value; update(); saveState(); });
  textarea.value = state.r5.text;
  update();
  $('#check-apply-answer').addEventListener('click', async () => {
    const answer = textarea.value.trim();
    if (answer.length < 30) { feedback('apply-answer-feedback', 'error', 'Erläutere die Schritte noch etwas genauer, damit deine Antwort sinnvoll ausgewertet werden kann.'); textarea.focus(); return; }
    const button = $('#check-apply-answer');
    button.disabled = true;
    feedback('apply-answer-feedback', '', 'Deine Erläuterung wird mit dem Erwartungshorizont verglichen.');
    try {
      const result = await evaluateSemanticAnswer({ serverUrl: SERVER_URL, taskId: TASK_ID, answer });
      const kind = result.points === result.maxPoints ? 'success' : result.points > 0 ? 'partial' : 'error';
      const fallback = FALLBACK_TEXT[kind === 'success' ? 'correct' : kind === 'partial' ? 'partial' : 'incorrect'];
      feedback('apply-answer-feedback', kind, result.points + ' von ' + result.maxPoints + ' Punkten – ' + result.status + '. ' + ((result.feedback || '').trim() || fallback));
    } catch (error) {
      const unknown = error.message === 'Diese Aufgabe ist auf dem Auswertungsserver nicht bekannt.';
      feedback('apply-answer-feedback', 'error', unknown ? 'Für Aufgabe 7 ist noch keine aktuelle Serverversion bereitgestellt. Bitte informiere deine Lehrkraft.' : error.message);
    } finally { button.disabled = false; }
  });
}

function setupApply() {
  const body = $('#apply-body');
  SHIRT_TRAINING.forEach((item) => {
    const { row, toggle } = applyRowTemplate(item);
    toggle.addEventListener('click', () => toggleMarked(item.id));
    row.addEventListener('click', (event) => { if (event.target.closest('input, button, label')) return; toggleMarked(item.id); });
    body.append(row);
  });
  [['d3', 'd3'], ['d6', 'd6']].forEach(([key, stateKey]) => {
    const input = body.querySelector('[data-answer=' + key + ']');
    input.value = state.r5[stateKey];
    input.addEventListener('input', () => { state.r5[stateKey] = input.value; saveState(); });
  });
  updateMarkedRows();
  $('#check-distances').addEventListener('click', checkDistances);
  $('#check-marked').addEventListener('click', checkMarked);
  $('#check-apply-size').addEventListener('click', checkApplySize);
  setupExplanation();
}

/* ---------- Reiter 6: Abschlussquiz ---------- */

function renderQuizSummary() {
  const items = QUIZ.map((entry, index) => '<li><strong>' + (index + 1) + '. ' + entry.q + '</strong><br>Richtig: ' + entry.options.filter((option) => option.correct).map((option) => option.text).join(' · ') + '</li>');
  const overview = $('#quiz-summary');
  overview.innerHTML = '<h3>Übersicht aller Teilaufgaben</h3><ul>' + OVERVIEW.map((item) => '<li>' + item + '</li>').join('') + '</ul><h3>Quizübersicht</h3><ul>' + items.join('') + '</ul>';
  overview.hidden = false;
}
function setupQuiz() {
  const root = $('#quiz-questions');
  QUIZ.forEach((entry, index) => {
    const box = document.createElement('fieldset');
    box.className = 'quiz-question';
    const legend = document.createElement('legend');
    legend.textContent = (index + 1) + '. ' + entry.q;
    box.append(legend);
    renderChoiceFieldset(box, entry.options, state.quiz.selected[index], () => { state.quiz.selected[index] = checkedIds(box); saveState(); });
    const result = document.createElement('div');
    result.className = 'feedback';
    result.setAttribute('role', 'status');
    result.setAttribute('aria-live', 'polite');
    result.hidden = true;
    box.append(result);
    root.append(box);
  });
  if (state.quiz.quizSolved) { renderQuizSummary(); $('#quiz-progress').textContent = '6 von 6 Fragen vollständig richtig'; }
  $('#quiz-form').addEventListener('submit', (event) => {
    event.preventDefault();
    let complete = 0;
    [...root.children].forEach((box, index) => {
      const { options, hint } = QUIZ[index];
      const selected = checkedIds(box);
      const expected = options.filter((option) => option.correct).map((option) => option.id);
      const correct = sameSet(selected, expected);
      const wrongChosen = options.filter((option) => !option.correct && selected.includes(option.id));
      const anyRight = selected.some((id) => expected.includes(id));
      if (correct) complete++;
      const result = box.querySelector('.feedback');
      result.hidden = false;
      if (correct) { result.className = 'feedback success'; result.textContent = '✓ Richtig. Alle passenden Aussagen sind markiert.'; }
      else {
        result.className = 'feedback ' + (anyRight ? 'partial' : 'error');
        result.textContent = (anyRight ? 'Teilweise richtig. ' : 'Noch nicht richtig. ') + (wrongChosen.length ? wrongChosen.map((option) => option.why).join(' ') : hint);
      }
    });
    $('#quiz-progress').textContent = complete + ' von 6 Fragen vollständig richtig';
    feedback('quiz-feedback', complete === 6 ? 'success' : 'partial', complete === 6 ? 'Alle sechs Fragen sind vollständig richtig beantwortet.' : complete + ' von 6 Fragen sind vollständig richtig. Verbessere die markierten Fragen und prüfe erneut.');
    if (complete === 6) { state.quiz.quizSolved = true; saveState(); renderQuizSummary(); } else $('#quiz-summary').hidden = !state.quiz.quizSolved;
  });
  // Jede Quizfrage lässt sich zusätzlich einzeln prüfen (quiz-fragen-pruefen.js).
  window.addQuizQuestionChecks?.({
    questions: [...root.children].map((box, index) => ({
      fieldset: box,
      feedback: box.querySelector('.feedback'),
      solution: QUIZ[index].options.filter((option) => option.correct).map((option) => option.id),
      hint: (selected) => {
        const wrongChosen = QUIZ[index].options.filter((option) => !option.correct && selected.includes(option.id));
        return wrongChosen.length ? wrongChosen.map((option) => option.why).join(' ') : QUIZ[index].hint;
      },
    })),
    buttonClass: 'primary-button',
    levels: { high: 'success', medium: 'partial', low: 'error' },
    onAllCorrect: () => $('#quiz-form').requestSubmit(),
  });
}

function setupReset() {
  $('#reset-progress').addEventListener('click', () => {
    if (!confirm('Bearbeitungsstand wirklich zurücksetzen?')) return;
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    location.reload();
  });
}

// Erst alle Listener registrieren, dann den gespeicherten Reiter anzeigen.
setupTabs();
setupChoices();
setupChoiceQuestions();
setupDiscover();
setupNeighbours();
setupEuclid();
setupManhattan();
setupApply();
setupQuiz();
setupReset();
showStep(state.active);
