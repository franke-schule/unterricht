import { evaluateSemanticAnswer } from '../../../1-Kuenstliche-Intelligenz/perzeptron/ui/semantic-answer.mjs';
import { ASCII_STEPS, COUNTER_MAX, EXPECTED, ROWS, SPEEDS, UNICODE_STEPS } from '../data/task1.mjs';
import { bitsToValue, carryCount, evaluateRow, evaluateTarget, gainsPlace, termsOf, toBits } from '../logic/binary.mjs';
import { formatCodePoint, inspect } from '../logic/chars.mjs';
import { createLampRow } from './bit-lamps.mjs';
import { createPlayer, renderOdometer } from './odometer.mjs';

const SERVER_URL = 'https://script.google.com/macros/s/AKfycby8RWL6uYrKZyoJ6m2GRpWyRmXjwsdskyCiqzKpRhIK5-wrDl-9lWWk8CiAGaVMoy0x/exec';
const TASK_ID = 'inf11-cod-a1-ascii-unicode';
const STORAGE_KEY = 'informatik11-codierung-aufgabe1-v1';
const STEPS = ['count', 'place', 'convert', 'chars', 'compare', 'finish'];
const EMPTY_BITS = '00000000';
const ASCII_BYTE_STEPS = 5;

/* ---------- Aufgabendaten: Auswahlaufgaben (Optionen in gemischter Reihenfolge) ---------- */

const MC = {
  newPlace: {
    options: [
      { id: 'n2', text: '2', correct: true },
      { id: 'n4', text: '4', correct: true },
      { id: 'n6', text: '6', correct: false, why: 'Bei 6 zeigt das Binärzählwerk 110 – das sind drei Stellen wie schon bei 4 (100). Eine neue Stelle kommt erst wieder bei 8 hinzu.' },
      { id: 'n8', text: '8', correct: true },
      { id: 'n10', text: '10', correct: false, why: 'Bei 10 bekommt das Dezimalzählwerk eine neue Stelle. Das Binärzählwerk zeigt 1010 – die vierte Stelle gibt es dort schon seit 8 (1000).' },
      { id: 'n16', text: '16', correct: true },
    ],
    success: 'Richtig. Das Binärzählwerk bekommt bei 2, 4, 8 und 16 eine neue Stelle – danach bei 32 und 64. Die Zahlen verdoppeln sich jedes Mal, weil jede Stelle nur zwei Ziffern hat.',
    missingHint: 'Deine Auswahl stimmt, ist aber noch unvollständig. Zähle langsam bis 16 und achte auf jede neue Stelle.',
  },
  carry: {
    options: [
      { id: 'right', text: 'Die rechte Stelle springt von 1 auf 0 und gibt einen Übertrag nach links weiter.', correct: true },
      { id: 'one-two', text: 'Die rechte Stelle zählt von 1 auf 2.', correct: false, why: 'Im Binärzählwerk gibt es nur die Ziffern 0 und 1. Nach der 1 springt die Stelle auf 0 zurück und gibt einen Übertrag weiter – so wie im Dezimalzählwerk nach der 9.' },
      { id: 'second', text: 'Die zweite Stelle springt ebenfalls von 1 auf 0 und gibt den Übertrag weiter.', correct: true },
      { id: 'append', text: 'Rechts wird eine 1 angehängt, sodass 111 entsteht.', correct: false, why: '111 wäre schon die Zahl 7. Beim Weiterzählen wird nichts angehängt: Der Übertrag wandert nach links und erzeugt dort die neue Stelle.' },
      { id: 'new', text: 'Links entsteht eine neue Stelle mit der Ziffer 1.', correct: true },
    ],
    success: 'Richtig. Beide Stellen laufen über, springen auf 0 und geben den Übertrag nach links weiter. Dort entsteht die neue Stelle: Aus 11 wird 100 – so wie im Dezimalzählwerk aus 99 die Zahl 100 wird.',
    missingHint: 'Deine Auswahl stimmt, ist aber noch unvollständig. Verfolge den Übertrag von rechts nach links bis zur neuen Stelle.',
  },
  inspectorOptions: {
    options: [
      { id: 'same', text: 'G, r und e haben in Unicode dieselbe Nummer wie in ASCII und belegen in UTF-8 je 1 Byte.', correct: true },
      { id: 'two', text: 'Jedes Zeichen belegt in UTF-8 genau 2 Byte.', correct: false, why: 'Schau in die Spalte „Byte in UTF-8“: G, r, e und das Leerzeichen brauchen nur 1 Byte, „ü“ und „ß“ 2 Byte, das Emoji 4 Byte. Die Anzahl hängt vom Codepunkt ab.' },
      { id: 'umlaut', text: '„ü“ und „ß“ kommen in ASCII nicht vor und belegen in UTF-8 je 2 Byte.', correct: true },
      { id: 'other', text: 'In Unicode haben G, r und e andere Nummern als in ASCII.', correct: false, why: 'Vergleiche mit der ASCII-Tabelle: „G“ hat dort 71, „r“ 114 und „e“ 101 – der Inspektor zeigt dieselben Nummern. Die ersten 128 Codepunkte von Unicode sind genau die ASCII-Zeichen.' },
      { id: 'emoji', text: 'Das Emoji belegt in UTF-8 4 Byte.', correct: true },
    ],
    success: 'Richtig. G, r, e und das Leerzeichen behalten in Unicode ihre ASCII-Nummer und belegen 1 Byte. „ü“ und „ß“ fehlen in ASCII und belegen je 2 Byte, das Emoji sogar 4 Byte. Insgesamt sind es 7 Zeichen und 12 Byte.',
    missingHint: 'Deine Auswahl stimmt, ist aber noch unvollständig. Vergleiche für jedes Zeichen die Spalten „in ASCII?“ und „Byte in UTF-8“.',
  },
};

const MC_PATH = { newPlace: ['r1', 'newPlace'], carry: ['r1', 'carry'], inspectorOptions: ['r4', 'mc'] };

const QUIZ = [
  {
    q: 'Welche Aussagen über die Stellenwerte einer 8-Bit-Binärzahl stimmen?',
    hint: 'Denke an die Beschriftung der Lampen in Reiter 2.',
    options: [
      { id: 'right', text: 'Das Bit ganz rechts hat den Stellenwert 2⁰ = 1.', correct: true },
      { id: 'left', text: 'Das Bit ganz links hat den Stellenwert 1.', correct: false, why: 'Die Stellenwerte wachsen von rechts nach links. Ganz rechts steht 2⁰ = 1, ganz links bei 8 Bit 2⁷ = 128.' },
      { id: 'double', text: 'Jede Stelle ist doppelt so viel wert wie die Stelle rechts von ihr.', correct: true },
      { id: 'linear', text: 'Die Stellenwerte sind 1, 2, 3, 4, 5, 6, 7, 8.', correct: false, why: 'Die Stellenwerte steigen nicht um 1, sondern verdoppeln sich: 1, 2, 4, 8, 16, 32, 64, 128 – es sind Zweierpotenzen.' },
    ],
  },
  {
    q: 'Welche Bitfolge stellt die Dezimalzahl 37 dar?',
    hint: 'Suche den größten Stellenwert, der in 37 passt, und rechne mit dem Rest weiter.',
    options: [
      { id: 'reversed', text: '10100100', correct: false, why: 'Das ist die richtige Bitfolge spiegelverkehrt; sie ergibt 128 + 32 + 4 = 164. Der Stellenwert 1 steht ganz rechts.' },
      { id: 'right', text: '00100101', correct: true },
      { id: 'digits', text: '00110111', correct: false, why: 'Hier wurden die Ziffern 3 und 7 einzeln umgewandelt (0011 und 0111). Die Bitfolge ergibt aber 32 + 16 + 4 + 2 + 1 = 55. Umgewandelt wird die ganze Zahl 37.' },
      { id: 'short', text: '00100100', correct: false, why: 'Diese Bitfolge ergibt 32 + 4 = 36 – es fehlt noch 1.' },
    ],
  },
  {
    q: 'Welche Aussagen über die Binärzahl 100 stimmen?',
    hint: 'Denke an die Stellenwerte 4, 2 und 1 der drei rechten Stellen.',
    options: [
      { id: 'hundred', text: 'Sie bedeutet die Dezimalzahl hundert.', correct: false, why: 'Im Binärsystem hat die dritte Stelle von rechts den Stellenwert 4, nicht 100. Binär 100 bedeutet 1 · 4 + 0 · 2 + 0 · 1 = 4.' },
      { id: 'four', text: 'Sie hat denselben Wert wie die Dezimalzahl 4.', correct: true },
      { id: 'after', text: 'Beim Zählen folgt sie direkt auf binär 11.', correct: true },
      { id: 'largest', text: 'Sie ist die größte Zahl, die man mit drei Bit darstellen kann.', correct: false, why: 'Die größte Zahl mit drei Bit ist 111 = 4 + 2 + 1 = 7. Binär 100 ist die kleinste Zahl mit drei Stellen.' },
    ],
  },
  {
    q: 'Was gilt für Bit und Byte?',
    hint: 'Denke an die acht Lampen und ihre größte Summe.',
    options: [
      { id: 'byte', text: 'Ein Byte besteht aus 8 Bit.', correct: true },
      { id: '256', text: 'Mit 8 Bit lassen sich Zahlen bis 256 darstellen.', correct: false, why: 'Mit 8 Bit gibt es 256 verschiedene Bitfolgen. Weil die Zählung bei 0 beginnt, ist die größte Zahl 255 = 11111111.' },
      { id: '255', text: 'Mit einem Byte lassen sich die Zahlen von 0 bis 255 darstellen.', correct: true },
      { id: 'two', text: 'Ein Bit kann die Werte 0, 1 und 2 annehmen.', correct: false, why: 'Ein Bit ist eine einzelne Binärstelle und kann nur 0 oder 1 sein – wie eine Lampe, die aus oder an ist.' },
    ],
  },
  {
    q: 'Welche Aussagen über ASCII stimmen?',
    hint: 'Erinnere dich an die Animation zu „Hallo“ und an die ASCII-Tabelle.',
    options: [
      { id: '7bit', text: 'ASCII verwendet 7 Bit und hat damit Platz für 128 Zeichen.', correct: true },
      { id: 'umlaut', text: 'Mit ASCII lassen sich deutsche Umlaute wie „ä“ darstellen.', correct: false, why: 'ASCII enthält nur lateinische Buchstaben ohne Umlaute. Für „ä“ ist unter den 128 Nummern kein Platz – das hat die Animation gezeigt.' },
      { id: 'a65', text: 'Das Zeichen „A“ hat in ASCII die Nummer 65.', correct: true },
      { id: 'case', text: 'Groß- und Kleinbuchstaben haben in ASCII dieselbe Nummer.', correct: false, why: '„A“ hat die Nummer 65, „a“ die Nummer 97. Für den Computer sind es verschiedene Zeichen mit verschiedenen Bitfolgen.' },
    ],
  },
  {
    q: 'Welche Aussagen über Unicode stimmen?',
    hint: 'Denke an die Codepunkte und Byte-Anzahlen aus der Unicode-Animation und dem Zeichen-Inspektor.',
    options: [
      { id: 'name', text: 'Unicode ist nur ein anderer Name für ASCII.', correct: false, why: 'Unicode enthält ASCII, ist aber viel größer: Es ordnet den Zeichen aller Schriftsysteme sowie Symbolen und Emojis eine Nummer zu – über eine Million Codepunkte sind möglich.' },
      { id: 'first128', text: 'Die ersten 128 Codepunkte von Unicode sind genau die ASCII-Zeichen.', correct: true },
      { id: 'two', text: 'Jedes Unicode-Zeichen belegt genau 2 Byte.', correct: false, why: 'In UTF-8 hängt der Speicherbedarf vom Zeichen ab: „H“ belegt 1 Byte, „ä“ 2 Byte, „€“ 3 Byte und „😀“ 4 Byte.' },
      { id: 'emoji', text: 'Unicode ordnet auch Emojis wie „😀“ eine eindeutige Nummer zu.', correct: true },
    ],
  },
];

const OVERVIEW = [
  '<strong>Reiter 1 – Zählen mit zwei Ziffern</strong> Das Binärzählwerk bekommt bei 2, 4, 8, 16, 32 und 64 eine neue Stelle. Nach 1111 (15) folgt 10000 (16).',
  '<strong>Reiter 2 – Stellenwerte</strong> 5 = 4 + 1 (00000101), 12 = 8 + 4 (00001100). Die größte Zahl mit acht Bit ist 255 = 11111111.',
  '<strong>Reiter 3 – Dezimalzahlen umwandeln</strong> 18 = 00010010, 27 = 00011011, 100 = 01100100, 200 = 11001000, 50 = 00110010, 10 = 00001010, 250 = 11111010.',
  '<strong>Reiter 4 – Buchstaben als Bitfolgen</strong> „Hallo“ in ASCII: H = 72, a = 97, l = 108, l = 108, o = 111. ä, €, 猫 und 😀 fehlen in ASCII; in Unicode haben sie die Codepunkte U+00E4, U+20AC, U+732B und U+1F600 und belegen in UTF-8 2, 3, 3 und 4 Byte. „Grüße 😀“: 7 Zeichen, 12 Byte.',
  '<strong>Reiter 5 – ASCII und Unicode vergleichen</strong> ASCII: 7 Bit, 128 Zeichen, keine Umlaute. Unicode: Zeichen aller Schriften, Symbole und Emojis, die ersten 128 wie ASCII, in UTF-8 1 bis 4 Byte je Zeichen.',
];

/* ---------- Zustand und Speicherung ---------- */

const ASCII_COUNT = ASCII_STEPS.length;
const UNICODE_COUNT = UNICODE_STEPS.length;

function defaultState() {
  return {
    active: 'count',
    r1: { n: 0, speed: 'medium', newPlace: [], carry: [], after: '' },
    r2: { bits: EMPTY_BITS, solved: [], max: '' },
    r3: { rows: Object.fromEntries(ROWS.map((row) => [row, EMPTY_BITS])), solved: [], unlocked: false },
    r4: { ascii: -1, unicode: -1, text: '', mc: [], charsetUnlocked: false, unicodeUnlocked: false },
    r5: { text: '' },
    quiz: { selected: QUIZ.map(() => []), quizSolved: false },
  };
}
const cleanText = (value, max) => (typeof value === 'string' ? value.slice(0, max) : '');
const cleanIds = (list, options) => (Array.isArray(list) ? [...new Set(list.filter((id) => options.includes(id)))] : []);
const cleanBits = (value) => (typeof value === 'string' && /^[01]{8}$/.test(value) ? value : EMPTY_BITS);
const cleanStep = (value, count) => (Number.isInteger(value) && value >= -1 && value < count ? value : -1);
const optionIds = (key) => MC[key].options.map((option) => option.id);

function loadState() {
  const defaults = defaultState();
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!parsed || typeof parsed !== 'object') return defaults;
    const { r1 = {}, r2 = {}, r3 = {}, r4 = {}, r5 = {}, quiz = {} } = parsed;
    const rows = r3.rows && typeof r3.rows === 'object' ? r3.rows : {};
    return {
      active: STEPS.includes(parsed.active) ? parsed.active : defaults.active,
      r1: {
        n: Number.isInteger(r1.n) && r1.n >= 0 && r1.n <= COUNTER_MAX ? r1.n : 0,
        speed: Object.hasOwn(SPEEDS, r1.speed) ? r1.speed : 'medium',
        newPlace: cleanIds(r1.newPlace, optionIds('newPlace')),
        carry: cleanIds(r1.carry, optionIds('carry')),
        after: cleanText(r1.after, 12),
      },
      r2: { bits: cleanBits(r2.bits), solved: cleanIds(r2.solved, ['5', '12', 'max']), max: cleanText(r2.max, 12) },
      r3: {
        rows: Object.fromEntries(ROWS.map((row) => [row, cleanBits(rows[row])])),
        solved: Array.isArray(r3.solved) ? [...new Set(r3.solved.filter((row) => ROWS.includes(row)))] : [],
        unlocked: r3.unlocked === true,
      },
      r4: {
        ascii: cleanStep(r4.ascii, ASCII_COUNT),
        unicode: cleanStep(r4.unicode, UNICODE_COUNT),
        text: cleanText(r4.text, 20),
        mc: cleanIds(r4.mc, optionIds('inspectorOptions')),
        charsetUnlocked: r4.charsetUnlocked === true,
        unicodeUnlocked: r4.unicodeUnlocked === true,
      },
      r5: { text: cleanText(r5.text, 600) },
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
function feedback(id, kind, message) {
  const el = document.querySelector('#' + id);
  el.hidden = false;
  el.className = 'feedback ' + kind;
  el.textContent = message;
}
function hideFeedback(id) { const el = document.querySelector('#' + id); if (el) el.hidden = true; }
const sameSet = (values, expected) => values.length === expected.length && expected.every((value) => values.includes(value));
const normaliseDigits = (value) => value.replace(/\s+/g, '');

let counterPlayer = null;

/* ---------- Reiter ---------- */

function showStep(id, focus = false) {
  if (!STEPS.includes(id)) return;
  if (id !== 'count') counterPlayer?.stop();
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

/* ---------- Auswahlknöpfe (Tempo) ---------- */

const CHOICES = {
  speed: { get: () => state.r1.speed, set: (value) => { state.r1.speed = value; }, required: true },
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

// Jede Frage außerhalb des Quiz hat einen eigenen Button und eine eigene Rückmeldung.
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
  const bind = (buttonId, key, feedbackId) => {
    $('#' + buttonId).addEventListener('click', () => checkChoice(key, checkedIds(document.querySelector('[data-mc=' + key + ']')), feedbackId));
  };
  bind('check-new-place', 'newPlace', 'new-place-feedback');
  bind('check-carry', 'carry', 'carry-feedback');
  bind('check-inspector', 'inspectorOptions', 'inspector-feedback');
}

/* ---------- Reiter 1: Zählwerk ---------- */

const COUNTER_START = 'Dezimal 0 · binär 0. Zähle mit „+1“ weiter oder starte „Abspielen“.';
const COUNTER_END = 'Dezimal 64 · binär 1000000. Das Zählwerk ist am Ende. „Zählwerk auf 0 setzen“ beginnt wieder bei 0.';

function counterText(n) {
  if (n === 0) return COUNTER_START;
  if (n >= COUNTER_MAX) return COUNTER_END;
  let text = 'Dezimal ' + n + ' · binär ' + toBits(n, 1) + '.';
  const binaryCarry = carryCount(n - 1, 2);
  if (binaryCarry > 0) {
    text += binaryCarry === 1
      ? ' Im Binärzählwerk läuft 1 Stelle über und gibt einen Übertrag weiter.'
      : ' Im Binärzählwerk laufen ' + binaryCarry + ' Stellen über und geben einen Übertrag weiter.';
    if (gainsPlace(n - 1, 2)) text += ' Links entsteht eine neue Stelle.';
  }
  if (carryCount(n - 1, 10) > 0) {
    text += ' Im Dezimalzählwerk läuft die 9 über.';
    if (gainsPlace(n - 1, 10)) text += ' Dort entsteht eine neue Stelle.';
  }
  return text;
}

function renderCounter() {
  renderOdometer($('#counter-plot'), state.r1.n);
  $('#counter-status').textContent = counterText(state.r1.n);
}
function stepCounter() {
  if (state.r1.n < COUNTER_MAX) state.r1.n += 1;
  saveState();
  renderCounter();
  return state.r1.n < COUNTER_MAX;
}

function setupCounter() {
  const playButton = $('#counter-play');
  const status = $('#counter-status');
  counterPlayer = createPlayer({
    delay: () => SPEEDS[state.r1.speed],
    advance: stepCounter,
    onChange: (playing) => {
      playButton.textContent = playing ? 'Anhalten' : 'Abspielen';
      playButton.setAttribute('aria-pressed', String(playing));
      status.setAttribute('aria-live', playing ? 'off' : 'polite');
      if (!playing) status.textContent = counterText(state.r1.n);
    },
  });
  $('#counter-step').addEventListener('click', () => { counterPlayer.stop(); stepCounter(); });
  playButton.addEventListener('click', () => {
    if (counterPlayer.playing) { counterPlayer.stop(); return; }
    if (state.r1.n >= COUNTER_MAX) { renderCounter(); return; }
    counterPlayer.start();
  });
  $('#counter-reset').addEventListener('click', () => { counterPlayer.stop(); state.r1.n = 0; saveState(); renderCounter(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) counterPlayer.stop(); });

  const input = $('#after-input');
  input.value = state.r1.after;
  input.addEventListener('input', () => { state.r1.after = input.value; saveState(); });
  $('#check-after').addEventListener('click', () => checkAfter(input.value));
  renderCounter();
}

function checkAfter(raw) {
  const text = normaliseDigits(raw);
  const value = text.replace(/^0+(?=.)/, '');
  if (!value) feedback('after-feedback', 'error', 'Gib die Anzeige des Binärzählwerks ein, zum Beispiel 101.');
  else if (value === EXPECTED.after) feedback('after-feedback', 'success', 'Richtig. Alle vier Einsen laufen über und springen auf 0; der Übertrag erzeugt links eine fünfte Stelle. 10000 bedeutet 16 – so wie im Dezimalsystem auf 9999 die Zahl 10000 folgt.');
  else if (value === '1000') feedback('after-feedback', 'partial', 'Teilweise korrekt. Die vier Einsen springen richtig auf 0. Der Übertrag der linken Stelle geht aber nicht verloren – er erzeugt eine neue Stelle.');
  else if (value === '11111') feedback('after-feedback', 'error', 'Noch nicht korrekt. 11111 entsteht, wenn man eine 1 anhängt – das wäre aber 31. Beim Weiterzählen läuft jede der vier Einsen über, springt auf 0 und gibt einen Übertrag nach links weiter.');
  else if (value === '16') feedback('after-feedback', 'error', '16 ist die richtige Zahl. Gefragt ist aber die Anzeige des Binärzählwerks – sie besteht nur aus den Ziffern 0 und 1.');
  else if (/^\d+$/.test(value) && /[2-9]/.test(value)) feedback('after-feedback', 'error', 'Noch nicht korrekt. Im Binärzählwerk gibt es nur die Ziffern 0 und 1. Eine 2 kann dort nie stehen.');
  else feedback('after-feedback', 'error', 'Noch nicht korrekt. Zähle mit „+1“ bis 15 und dann einen Schritt weiter. Beobachte, welche Stellen überlaufen.');
}

/* ---------- Reiter 2: Lampen ---------- */

let lampRow = null;
const TARGETS = {
  5: {
    feedbackId: 'target-5-feedback',
    success: 'Richtig: 4 + 1 = 5. Die Lampen mit den Werten 4 und 1 sind an, alle anderen aus – binär 00000101.',
    special: { position: 'Noch nicht korrekt. Du hast die fünfte Lampe von rechts eingeschaltet. Sie hat aber den Wert 16, nicht 5. Gesucht sind Lampen, deren Werte zusammen 5 ergeben.' },
  },
  12: {
    feedbackId: 'target-12-feedback',
    success: 'Richtig: 8 + 4 = 12 – binär 00001100.',
    special: { digits: 'Noch nicht korrekt. Du hast die Lampen 1 und 2 eingeschaltet, als würdest du die Ziffern von 12 einzeln eintragen. Gesucht sind Lampen, deren Werte zusammen 12 ergeben.' },
  },
};

function updateLampDisplay() {
  const bits = state.r2.bits;
  const terms = termsOf(bits);
  $('#lamp-sum').textContent = terms.length ? terms.join(' + ') + ' = ' + bitsToValue(bits) : '0 (alle Lampen aus)';
  $('#lamp-binary').textContent = 'Binärzahl: ' + bits;
}
function updatePlaceRemember() {
  $('#place-remember').hidden = !['5', '12', 'max'].every((id) => state.r2.solved.includes(id));
}
function markSolved(id) {
  if (!state.r2.solved.includes(id)) state.r2.solved.push(id);
  saveState();
  updatePlaceRemember();
}

function checkTarget(target) {
  const config = TARGETS[target];
  const result = evaluateTarget(target, lampRow.getBits());
  const amount = Math.abs(result.diff);
  if (result.status === 'correct') { feedback(config.feedbackId, 'success', config.success); markSolved(String(target)); }
  else if (result.status === 'empty') feedback(config.feedbackId, 'error', 'Schalte Lampen durch Antippen ein. Die Summe ihrer Werte soll ' + target + ' ergeben.');
  else if (config.special[result.status]) feedback(config.feedbackId, 'error', config.special[result.status]);
  else if (result.status === 'partial') feedback(config.feedbackId, 'partial', 'Teilweise korrekt. Deine Lampen ergeben ' + result.value + ' – es fehlen noch ' + amount + '. Welche Lampe fehlt noch?');
  else if (result.diff > 0) feedback(config.feedbackId, 'error', 'Noch nicht korrekt. Deine Lampen ergeben ' + result.value + ' – das sind ' + amount + ' zu viel. Prüfe, welche Lampe zu viel an ist.');
  else feedback(config.feedbackId, 'error', 'Noch nicht korrekt. Deine Lampen ergeben ' + result.value + ' – das sind ' + amount + ' zu wenig. Prüfe, welche Lampe noch fehlt.');
}

function checkMax(raw) {
  const text = normaliseDigits(raw);
  if (!/^\d+$/.test(text)) { feedback('max-feedback', 'error', 'Gib eine Zahl ein.'); return; }
  const value = Number(text);
  if (value === EXPECTED.max) { feedback('max-feedback', 'success', 'Richtig. Leuchten alle acht Lampen, ergibt sich 128 + 64 + 32 + 16 + 8 + 4 + 2 + 1 = 255. Für 256 bräuchtest du eine neunte Lampe.'); markSolved('max'); }
  else if (value === 256) feedback('max-feedback', 'error', 'Noch nicht korrekt. 256 wäre die nächste Zahl – dafür bräuchtest du eine neunte Lampe mit dem Wert 256. Schalte alle acht Lampen ein und lies die Summe ab.');
  else if (value === 128) feedback('max-feedback', 'error', 'Noch nicht korrekt. 128 ist nur der Wert der linken Lampe. Leuchten alle Lampen, kommen die Werte der anderen sieben Lampen dazu.');
  else if (value === 8) feedback('max-feedback', 'error', 'Noch nicht korrekt. 8 ist die Anzahl der Lampen, nicht die größte darstellbare Zahl. Schalte alle Lampen ein und lies die Summe ab.');
  else feedback('max-feedback', 'error', 'Noch nicht korrekt. Schalte alle acht Lampen ein und lies die Summe ab.');
}

function setupLamps() {
  lampRow = createLampRow($('#bit-lamps'), { interactive: true, onChange: (bits) => { state.r2.bits = bits; saveState(); updateLampDisplay(); } });
  lampRow.setBits(state.r2.bits);
  updateLampDisplay();
  $('#check-target-5').addEventListener('click', () => checkTarget(5));
  $('#check-target-12').addEventListener('click', () => checkTarget(12));
  const input = $('#max-input');
  input.value = state.r2.max;
  input.addEventListener('input', () => { state.r2.max = input.value; saveState(); });
  $('#check-max').addEventListener('click', () => checkMax(input.value));
  updatePlaceRemember();
}

/* ---------- Reiter 3: Umrechnungstabelle ---------- */

function rowElements(number) { return document.querySelector('#convert-table tr[data-number="' + number + '"]'); }
function renderRow(number) {
  const bits = state.r3.rows[number];
  rowElements(number).querySelectorAll('.bit-toggle').forEach((toggle, index) => {
    const on = bits[index] === '1';
    toggle.setAttribute('aria-pressed', String(on));
    toggle.classList.toggle('is-on', on);
    toggle.querySelector('.bit-digit').textContent = on ? '1' : '0';
    toggle.setAttribute('aria-label', number + ': Stellenwert ' + toggle.dataset.place + ', Bit ' + (on ? '1' : '0'));
  });
}
function updateConvertProgress() {
  $('#convert-progress').textContent = state.r3.solved.length + ' von 7 Zahlen richtig';
  if (state.r3.solved.length === ROWS.length) state.r3.unlocked = true;
  $('#convert-remember').hidden = !state.r3.unlocked;
}

function rowMessage(number, result) {
  const amount = Math.abs(result.diff);
  switch (result.status) {
    case 'empty': return ['error', 'Noch nicht korrekt. Alle Bits stehen auf 0. Schalte die Bits ein, deren Stellenwerte zusammen ' + number + ' ergeben.'];
    case 'correct': return ['success', 'Richtig: ' + number + ' = ' + termsOf(EXPECTED.rows[number]).join(' + ') + '.'];
    case 'reversed': return ['error', 'Noch nicht korrekt. Deine Bitfolge ergibt ' + result.value + '. Achte auf die Reihenfolge der Stellenwerte: Ganz rechts steht der Stellenwert 1, ganz links 128.'];
    case 'partial': return result.diff > 0
      ? ['partial', 'Teilweise korrekt. Deine Bitfolge ergibt ' + result.value + ' – das sind ' + amount + ' zu viel. Prüfe, welches Bit du zu viel gesetzt hast.']
      : ['partial', 'Teilweise korrekt. Deine Bitfolge ergibt ' + result.value + ' – das sind ' + amount + ' zu wenig. Prüfe, welcher Stellenwert noch fehlt.'];
    default: return result.highest > result.solutionHighest
      ? ['error', 'Noch nicht korrekt. Deine Bitfolge ergibt ' + result.value + ' – das sind ' + amount + ' zu viel. Der Stellenwert ' + result.highest + ' ist allein schon größer als ' + number + '.']
      : ['error', 'Noch nicht korrekt. Deine Bitfolge ergibt ' + result.value + ' – das sind ' + amount + ' zu wenig. Es fehlt ein großer Stellenwert: Welcher ist der größte, der noch in ' + number + ' passt?'];
  }
}

function setupConvert() {
  ROWS.forEach((number) => {
    const row = rowElements(number);
    const feedbackId = 'row-feedback-' + number;
    renderRow(number);
    row.querySelectorAll('.bit-toggle').forEach((toggle, index) => toggle.addEventListener('click', () => {
      const bits = state.r3.rows[number].split('');
      bits[index] = bits[index] === '1' ? '0' : '1';
      state.r3.rows[number] = bits.join('');
      if (state.r3.solved.includes(number) && state.r3.rows[number] !== EXPECTED.rows[number]) {
        state.r3.solved = state.r3.solved.filter((solved) => solved !== number);
        hideFeedback(feedbackId);
        updateConvertProgress();
      }
      renderRow(number);
      saveState();
    }));
    row.querySelector('.row-check').addEventListener('click', () => {
      const result = evaluateRow(number, state.r3.rows[number]);
      const [kind, message] = rowMessage(number, result);
      feedback(feedbackId, kind, message);
      if (result.status === 'correct' && !state.r3.solved.includes(number)) state.r3.solved.push(number);
      updateConvertProgress();
      saveState();
    });
  });
  updateConvertProgress();
}

/* ---------- Reiter 4: Animationen und Inspektor ---------- */

// Schritt-Animation nach dem Muster von setupNextStepper (perzeptron/ui/task5.mjs).
function setupStepper({ buttonId, statusId, stateKey, steps, render }) {
  const button = $(buttonId);
  const status = $(statusId);
  const show = (index) => {
    const current = cleanStep(index, steps.length);
    state.r4[stateKey] = current;
    render(current);
    const last = current === steps.length - 1;
    button.textContent = last ? 'Schritte neu starten' : 'Nächster Schritt';
    button.classList.toggle('primary-button', !last);
    button.classList.toggle('secondary-button', last);
    status.textContent = current < 0
      ? 'Klicke auf „Nächster Schritt“, um mit Schritt 1 von ' + steps.length + ' zu beginnen.'
      : 'Schritt ' + (current + 1) + '/' + steps.length + ': ' + steps[current];
    saveState();
  };
  button.addEventListener('click', () => show(state.r4[stateKey] >= steps.length - 1 ? -1 : state.r4[stateKey] + 1));
  show(state.r4[stateKey]);
}

const ASCII_TEXTS = [
  '„H“ steht in der ASCII-Tabelle unter der Nummer 72. 72 = 64 + 8, also 1001000. Gespeichert wird ein ganzes Byte: 01001000.',
  '„a“ hat die Nummer 97 = 64 + 32 + 1, also 01100001. Groß- und Kleinbuchstaben haben verschiedene Nummern: „A“ hat 65.',
  '„l“ hat die Nummer 108 = 64 + 32 + 8 + 4, also 01101100.',
  'Das zweite „l“ bekommt wieder die Nummer 108 und dieselbe Bitfolge. Die Zuordnung ist eindeutig.',
  '„o“ hat die Nummer 111 = 64 + 32 + 8 + 4 + 2 + 1, also 01101111. „Hallo“ belegt damit 5 Byte.',
  '„ä“ sucht man in der ASCII-Tabelle vergeblich. ASCII hat nur die Nummern 0 bis 127 – Umlaute sind nicht dabei.',
  'Auch das Eurozeichen „€“ fehlt. ASCII wurde 1963 in den USA festgelegt – lange vor dem Euro.',
  '„猫“ (chinesisch und japanisch für „Katze“) fehlt ebenfalls. ASCII enthält nur lateinische Buchstaben.',
  'Für Emojis wie „😀“ ist in ASCII erst recht kein Platz. 7 Bit reichen nur für 2⁷ = 128 Zeichen.',
];
const UNICODE_TEXTS = [
  '„H“ bekommt in Unicode die Nummer 72 – genau wie in ASCII. Solche Nummern heißen Codepunkte; man schreibt U+0048. In UTF-8 belegt „H“ 1 Byte.',
  '„ä“ bekommt den Codepunkt U+00E4 (228). Die Nummer ist größer als 127, deshalb belegt „ä“ in UTF-8 2 Byte.',
  '„€“ hat den Codepunkt U+20AC (8364) und belegt in UTF-8 3 Byte.',
  '„猫“ hat den Codepunkt U+732B (29483) und belegt ebenfalls 3 Byte.',
  '„😀“ hat den Codepunkt U+1F600 (128512) und belegt 4 Byte. Je größer die Nummer, desto mehr Byte braucht UTF-8.',
  '„A“ hat den Codepunkt U+0041 (65) – dieselbe Nummer wie in ASCII. Das gilt für alle 128 ASCII-Zeichen: U+0000 bis U+007F sind genau ASCII. Insgesamt bietet Unicode über eine Million Codepunkte (U+0000 bis U+10FFFF); mehr als 150 000 sind schon vergeben.',
];

function setupAscii() {
  const bitsRoot = $('#ascii-bits');
  const lamps = createLampRow(bitsRoot, { interactive: false });
  bitsRoot.querySelector('.bit-lamp-col')?.classList.add('is-fixed');
  const rows = [...document.querySelectorAll('#ascii-table td[data-nr]')];
  setupStepper({
    buttonId: '#next-ascii-step',
    statusId: '#ascii-step-status',
    stateKey: 'ascii',
    steps: ASCII_TEXTS,
    render(current) {
      const step = current >= 0 ? ASCII_STEPS[current] : null;
      const missing = Boolean(step) && step.number === null;
      const charElement = $('#ascii-char');
      charElement.textContent = step ? step.char : '?';
      if (step) charElement.setAttribute('aria-label', step.label); else charElement.removeAttribute('aria-label');
      $('#ascii-number').textContent = !step ? '?' : missing ? '✗ nicht in ASCII' : String(step.number);
      $('#ascii-number-box').classList.toggle('is-missing', missing);
      $('#ascii-bits-title').textContent = missing ? 'keine Bitfolge' : 'Bitfolge';
      if (!step || missing) lamps.setDimmed(true); else { lamps.setDimmed(false); lamps.setBits(step.bits); }
      const stored = ASCII_STEPS.slice(0, Math.min(current + 1, ASCII_BYTE_STEPS)).map((entry) => entry.bits);
      $('#ascii-stored').textContent = 'Bisher gespeichert: ' + (stored.length ? stored.join(' ') : '–');
      rows.forEach((cell) => {
        const isCurrent = Boolean(step) && !missing && cell.dataset.nr === String(step.number);
        cell.parentElement.classList.toggle('is-current', isCurrent);
        if (isCurrent) cell.parentElement.setAttribute('aria-current', 'true'); else cell.parentElement.removeAttribute('aria-current');
        cell.querySelector('.row-marker').textContent = isCurrent ? '▶' : '';
      });
      if (current === ASCII_COUNT - 1) state.r4.charsetUnlocked = true;
      $('#charset-remember').hidden = !state.r4.charsetUnlocked;
    },
  });
}

function setupUnicode() {
  setupStepper({
    buttonId: '#next-unicode-step',
    statusId: '#unicode-step-status',
    stateKey: 'unicode',
    steps: UNICODE_TEXTS,
    render(current) {
      const step = current >= 0 ? UNICODE_STEPS[current] : null;
      const charElement = $('#unicode-char');
      charElement.textContent = step ? step.char : '?';
      if (step) charElement.setAttribute('aria-label', step.label); else charElement.removeAttribute('aria-label');
      $('#unicode-code').textContent = step ? formatCodePoint(step.codePoint) : '?';
      $('#unicode-code-dec').textContent = step ? '(' + step.codePoint + ')' : '';
      const cells = step ? Array.from({ length: step.bytes }, (_, index) => {
        const cell = document.createElement('span');
        cell.className = 'byte-cell';
        cell.textContent = 'Byte ' + (index + 1);
        return cell;
      }) : [];
      $('#unicode-bytes').replaceChildren(...cells);
      $('#unicode-byte-count').textContent = step ? step.bytes + ' Byte' : '';
      if (current === UNICODE_COUNT - 1) state.r4.unicodeUnlocked = true;
      $('#unicode-remember').hidden = !state.r4.unicodeUnlocked;
    },
  });
}

function renderInspector() {
  const entries = inspect(state.r4.text);
  $('#inspector-body').replaceChildren(...entries.map((entry) => {
    const row = document.createElement('tr');
    const cells = [entry.display, entry.label + ' (' + entry.codePoint + ')', entry.inAscii ? 'ja' : '✗ nein', String(entry.utf8Bytes)];
    cells.forEach((text, index) => {
      const cell = document.createElement('td');
      cell.textContent = text;
      if (index === 0) cell.className = 'char-font';
      row.append(cell);
    });
    return row;
  }));
  const bytes = entries.reduce((sum, entry) => sum + entry.utf8Bytes, 0);
  $('#inspector-summary').textContent = entries.length ? 'Insgesamt: ' + entries.length + ' Zeichen, ' + bytes + ' Byte in UTF-8.' : 'Gib oben einen Text ein.';
}
function setupInspector() {
  const input = $('#inspector-input');
  input.value = state.r4.text;
  input.addEventListener('input', () => { state.r4.text = input.value; saveState(); renderInspector(); });
  renderInspector();
}

/* ---------- Reiter 5: Beschreibe-Aufgabe ---------- */

const FALLBACK_TEXT = {
  correct: 'Du vergleichst Umfang, darstellbare Zeichen und Speicherbedarf von ASCII und Unicode und nennst, dass Unicode ASCII enthält.',
  partial: 'Die Grundidee stimmt. Ergänze die noch fehlenden Eigenschaften – denke an Umfang, Zeichen und Speicherbedarf.',
  incorrect: 'Beschreibe für ASCII und für Unicode, wie viele Zeichen sie umfassen, welche Zeichen dazugehören und wie viel Speicher ein Zeichen braucht.',
};
function setupExplanation() {
  const textarea = $('#compare-answer');
  const counter = $('#compare-counter');
  const update = () => { counter.textContent = textarea.value.length + ' von 600 Zeichen'; };
  textarea.addEventListener('input', () => { state.r5.text = textarea.value; update(); saveState(); });
  textarea.value = state.r5.text;
  update();
  $('#check-compare-answer').addEventListener('click', async () => {
    const answer = textarea.value.trim();
    if (answer.length < 30) { feedback('compare-answer-feedback', 'error', 'Beschreibe den Unterschied noch etwas ausführlicher, damit deine Antwort sinnvoll ausgewertet werden kann.'); textarea.focus(); return; }
    const button = $('#check-compare-answer');
    button.disabled = true;
    feedback('compare-answer-feedback', '', 'Deine Beschreibung wird mit dem Erwartungshorizont verglichen.');
    try {
      const result = await evaluateSemanticAnswer({ serverUrl: SERVER_URL, taskId: TASK_ID, answer });
      const kind = result.points === result.maxPoints ? 'success' : result.points > 0 ? 'partial' : 'error';
      const fallback = FALLBACK_TEXT[kind === 'success' ? 'correct' : kind === 'partial' ? 'partial' : 'incorrect'];
      feedback('compare-answer-feedback', kind, result.points + ' von ' + result.maxPoints + ' Punkten – ' + result.status + '. ' + ((result.feedback || '').trim() || fallback));
    } catch (error) {
      const unknown = error.message === 'Diese Aufgabe ist auf dem Auswertungsserver nicht bekannt.';
      feedback('compare-answer-feedback', 'error', unknown ? 'Für diese Aufgabe ist noch keine aktuelle Serverversion bereitgestellt. Bitte informiere deine Lehrkraft.' : error.message);
    } finally { button.disabled = false; }
  });
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
setupCounter();
setupLamps();
setupConvert();
setupAscii();
setupUnicode();
setupInspector();
setupExplanation();
setupQuiz();
setupReset();
showStep(state.active);
