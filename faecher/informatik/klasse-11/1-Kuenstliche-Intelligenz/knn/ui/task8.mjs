import { normaliseNumber } from '../../perzeptron/logic/perceptron.mjs';
import { evaluateSemanticAnswer } from '../../perzeptron/ui/semantic-answer.mjs?v=20261010-scaleway';
import { SHIRT_CLASSES, SHIRT_SYMBOLS, SHIRT_TRAINING } from '../data/shirts.mjs';
import {
  EXPECTED, HEFT_VALIDATION, HOUSES, HOUSE_AREAS, HOUSE_K, LARGE_K_PERSONS, OPEN_CELLS, OUTLIER_POINT, REGRESSION,
  TEST_K, TEST_PERSONS, TRAINING_WITH_OUTLIER, UNEVEN_TRAINING, VALIDATION, VALIDATION_KS,
} from '../data/task8.mjs';
import { accuracy, confusionMatrix, distanceX, regress, transposeMatrix, validationTable } from '../logic/evaluation.mjs';
import { classify } from '../logic/knn.mjs';
import { setupCardSlots } from './card-slots.mjs';
import { renderLegend, renderShirtPlot } from './knn-plot.mjs?v=20261004a';

const SERVER_URL = 'https://unterrichtkiichezbn4-ki-auswertung.functions.fnc.fr-par.scw.cloud/';
const TASK_ID = '11-8-1';
const STORAGE_KEY = 'informatik11-knn-aufgabe8-v1';
const STEPS = ['training', 'kvalue', 'validation', 'testing', 'data', 'regression', 'finish'];

/* ---------- Aufgabendaten: Auswahlaufgaben ---------- */

const MC = {
  trainingOptions: {
    options: [
      { id: 'store', text: 'Die Trainingsdaten werden gespeichert – mehr passiert beim Training nicht.', correct: true },
      { id: 'line', text: 'KNN berechnet beim Training eine Trenngerade wie das Perzeptron.', correct: false, why: 'Eine Trenngerade berechnet das Perzeptron. Der KNN-Algorithmus berechnet beim Training gar nichts: Er speichert nur die Trainingsdaten und vergleicht später jeden neuen Punkt direkt mit ihnen.' },
      { id: 'rule', text: 'KNN stellt beim Training eine Regel auf, zum Beispiel „ab 180 cm Größe M“.', correct: false, why: 'Eine solche Regel gibt es beim KNN-Algorithmus nicht – weder beim Training noch danach. Die Entscheidung entsteht jedes Mal neu aus den nächsten Nachbarn.' },
      { id: 'later', text: 'Die Abstände werden erst berechnet, wenn ein neuer Punkt klassifiziert werden soll.', correct: true },
      { id: 'pairs', text: 'Beim Training werden die Abstände zwischen allen Trainingsdaten berechnet und gespeichert.', correct: false, why: 'Abstände zwischen Trainingsdaten braucht der Algorithmus nicht. Er berechnet nur die Abstände eines neuen Punkts zu den Trainingsdaten – und zwar erst, wenn dieser Punkt klassifiziert werden soll.' },
    ],
    success: 'Richtig. Beim KNN-Algorithmus besteht das Training nur aus dem Speichern der Trainingsdaten. Gerechnet wird erst, wenn ein neuer Punkt klassifiziert wird.',
    missingHint: 'Deine Auswahl stimmt, ist aber noch unvollständig. Überlege auch, wann der Algorithmus die Abstände berechnet.',
  },
  outlierOptions: {
    options: [
      { id: 'reliable', text: 'Bei k = 1 ist das Ergebnis am zuverlässigsten, weil nur der ähnlichste Punkt zählt.', correct: false, why: 'Hier ist der ähnlichste Punkt ausgerechnet die S-Person bei 179|100, die zwischen lauter M-Personen liegt. Bei k = 1 entscheidet dieser eine ungewöhnliche Punkt allein – ein einziger Ausnahmefall reicht für ein falsches Ergebnis.' },
      { id: 'one', text: 'Bei k = 1 bestimmt allein die S-Person bei 179|100 das Ergebnis: N bekommt S.', correct: true },
      { id: 'ignored', text: 'Bei k = 3 wird die S-Person nicht mehr berücksichtigt.', correct: false, why: 'Sie zählt weiterhin mit – sie ist sogar der nächste Nachbar. Aber bei k = 3 stehen ihr zwei M-Nachbarn gegenüber, und die Mehrheit entscheidet.' },
      { id: 'three', text: 'Bei k = 3 überstimmen zwei M-Nachbarn die S-Person: N bekommt M.', correct: true },
    ],
    success: 'Richtig. Bei k = 1 entscheidet die eine S-Person bei 179|100 allein, obwohl ringsum M-Personen liegen. Bei k = 3 wird sie von zwei M-Nachbarn überstimmt.',
    missingHint: 'Deine Auswahl stimmt, ist aber noch unvollständig. Beschreibe beide Fälle: Was passiert bei k = 1, was bei k = 3?',
  },
  largeKOptions: {
    options: [
      { id: 'same', text: 'Bei k = 15 bekommen Person A und Person B dieselbe Größe L, obwohl sie ganz verschieden gebaut sind.', correct: true },
      { id: 'bigger', text: 'Je größer k, desto zuverlässiger ist das Ergebnis.', correct: false, why: 'Bei k = 15 zählen alle Trainingsdaten mit, auch weit entfernte. Dann gewinnt immer die Größe, die insgesamt am häufigsten ist – hier L mit 6 von 15. Person A bekommt so L, obwohl alle ihre nahen Nachbarn S tragen.' },
      { id: 'overall', text: 'Bei k = 15 gewinnt immer die Größe, die in allen Trainingsdaten am häufigsten vorkommt.', correct: true },
      { id: 'precise', text: 'Bei k = 15 wird der Abstand besonders genau berechnet.', correct: false, why: 'Die Abstände sind bei jedem k dieselben. k legt nur fest, wie viele Nachbarn mitzählen – bei k = 15 alle, egal wie weit entfernt.' },
      { id: 'anywhere', text: 'Wo der neue Punkt liegt, spielt bei k = 15 keine Rolle mehr.', correct: true },
    ],
    success: 'Richtig. Bei k = 15 zählen alle Trainingsdaten mit. Dann gewinnt immer L, weil L mit 6 von 15 insgesamt am häufigsten ist – egal, wo die Person liegt. Selbst Person A, deren nächste Nachbarn alle S tragen, bekommt L.',
    missingHint: 'Deine Auswahl stimmt, ist aber noch unvollständig. Vergleiche bei k = 15 die Auszählung für Person A und Person B.',
  },
  validationOptions: {
    options: [
      { id: 'test', text: 'Man wählt k mit den Testdaten, weil sie am Ende sowieso verwendet werden.', correct: false, why: 'Wählt man k mit den Testdaten, ist das Modell auf genau diese Daten abgestimmt. Dann misst der Test nicht mehr, wie gut das Modell mit unbekannten Daten zurechtkommt – das Ergebnis wirkt besser, als es ist.' },
      { id: 'try', text: 'Mit den Validierungsdaten probiert man verschiedene Werte für k aus und wählt den besten.', correct: true },
      { id: 'train', text: 'Man wählt k mit den Trainingsdaten: k = 1 ist dort immer am besten, weil jeder Trainingspunkt sein eigener nächster Nachbar ist.', correct: false, why: 'Klassifiziert man die Trainingsdaten selbst, ist jeder Punkt sein eigener nächster Nachbar – mit k = 1 wäre alles „richtig“. Über neue Personen sagt das nichts: Bei V3 und V5 liegt k = 1 daneben.' },
      { id: 'untouched', text: 'Die Testdaten werden für die Wahl von k nicht benutzt, damit sie am Ende unbekannte Daten sind.', correct: true },
    ],
    success: 'Richtig. Die Validierungsdaten dienen nur dazu, k auszuwählen. Die Testdaten bleiben unberührt, damit der Test am Ende ehrlich zeigt, wie gut das Modell mit unbekannten Daten zurechtkommt.',
    missingHint: 'Deine Auswahl stimmt, ist aber noch unvollständig. Überlege auch, warum die Testdaten bei der Wahl von k tabu sind.',
  },
  unevenOptions: {
    options: [
      { id: 'more', text: 'Mehr Trainingsdaten einer Klasse machen das Modell immer besser.', correct: false, why: 'Hier sind fünf von sechs Trainingsdaten S. Bei k = 3 sind unter den Nachbarn immer mindestens zwei S – egal, wie groß die neue Person ist. Mehr Daten helfen nur, wenn alle Klassen ausreichend vertreten sind.' },
      { id: 'always', text: 'Bei k = 3 wird jede neue Person als S klassifiziert, egal welche Maße sie hat.', correct: true },
      { id: 'tall', text: 'Eine Person mit 192 cm und 125 cm bekommt bei k = 3 die Größe S.', correct: true },
      { id: 'k1', text: 'Mit k = 1 wird jede neue Person als S klassifiziert.', correct: false, why: 'Bei k = 1 zählt nur der nächste Nachbar. Liegt eine Person näher an der M-Person (185|109) als an allen S-Personen, bekommt sie M.' },
    ],
    success: 'Richtig. Fünf der sechs Trainingsdaten sind S. Ab k = 3 sind unter den Nachbarn immer mindestens zwei S – die Mehrheit ist dann immer S. Die ungleiche Verteilung verzerrt das Modell.',
    missingHint: 'Deine Auswahl stimmt, ist aber noch unvollständig. Prüfe auch, was mit einer sehr großen Person passiert.',
  },
  biasOptions: {
    options: [
      { id: 'onesided', text: 'Die Trainingsdaten für Stadt sind einseitig: Internationale Städte kommen darin nicht vor.', correct: true },
      { id: 'moregerman', text: 'Man muss nur noch mehr deutsche Städte hinzufügen, dann wird New York richtig erkannt.', correct: false, why: 'Noch mehr deutsche Städte ändern nichts daran, dass New York keiner von ihnen ähnelt. Mehr Daten helfen nur, wenn sie die Vielfalt der Fälle abdecken – hier internationale Städte.' },
      { id: 'miscalc', text: 'Das Modell hat sich verrechnet.', correct: false, why: 'Das Modell rechnet richtig: Es vergleicht New York mit seinen Trainingsdaten. Ähnliche Beispiele findet es dort nur unter Ländern. Der Fehler steckt in den Daten, nicht in der Rechnung.' },
      { id: 'asgood', text: 'Das Modell kann nur so gut sein wie seine Trainingsdaten.', correct: true },
    ],
    success: 'Richtig. Das Modell klassifiziert nur mithilfe seiner Trainingsdaten. Fehlen darin ganze Gruppen von Beispielen, kann es solche Eingaben nicht richtig einordnen.',
    missingHint: 'Deine Auswahl stimmt, ist aber noch unvollständig. Überlege auch, was das Beispiel allgemein über Trainingsdaten aussagt.',
  },
  scaleOptions: {
    options: [
      { id: 'sugar', text: 'Ohne Umrechnung bestimmt fast nur die Zuckermenge, welches Lebensmittel am nächsten liegt.', correct: true },
      { id: 'bignum', text: 'Die Zuckermenge ist das wichtigere Merkmal, weil ihre Zahlen größer sind.', correct: false, why: 'Größere Zahlen bedeuten nicht, dass ein Merkmal wichtiger ist – sie liegen nur in einem größeren Wertebereich. Trotzdem bestimmen sie den Abstand fast allein: Der Unterschied von 0,16 beim Tagesbedarf geht neben 2 g Zucker völlig unter.' },
      { id: 'despite', text: 'A gilt als nächster Nachbar, obwohl sein Anteil am Tagesbedarf fast doppelt so groß ist wie der von N.', correct: true },
      { id: 'drop', text: 'Den Anteil am Tagesbedarf sollte man weglassen, weil er höchstens 1 ist.', correct: false, why: 'Das Merkmal ist nicht unwichtig – es wird nur von der Zuckermenge übertönt. Besser ist es, beide Merkmale auf denselben Wertebereich umzurechnen.' },
    ],
    success: 'Richtig. Die Zuckermenge kann sich um bis zu 100 unterscheiden, der Anteil am Tagesbedarf nur um bis zu 1. Ohne Umrechnung entscheidet deshalb fast nur der Zucker über den Abstand.',
    missingHint: 'Deine Auswahl stimmt, ist aber noch unvollständig. Vergleiche auch die Anteile am Tagesbedarf von A und N.',
  },
};

// Zuordnung Auswahlaufgabe -> Speicherort im Zustand
const MC_PATH = {
  trainingOptions: ['r1', 'mc'], outlierOptions: ['r2', 'mcA'], largeKOptions: ['r2', 'mcB'], validationOptions: ['r3', 'mc'],
  unevenOptions: ['r5', 'mcUneven'], biasOptions: ['r5', 'mcBias'], scaleOptions: ['r5', 'mcScale'],
};

const PHASE_CARDS = [
  { id: 'acc', text: 'Genauigkeit bestimmen' },
  { id: 'split', text: 'Daten aufteilen' },
  { id: 'use', text: 'Shirtgröße für eine neue Schülerin vorhersagen' },
  { id: 'x', text: 'Gewichte anpassen, bis die Trainingsdaten richtig klassifiziert werden' },
  { id: 'store', text: 'Trainingsdaten speichern' },
  { id: 'label', text: 'Daten sammeln und mit Labeln versehen' },
  { id: 'run', text: 'Testdaten mit dem Modell klassifizieren' },
];
const PHASE_SLOTS = ['Vorbereitung 1', 'Vorbereitung 2', 'Training', 'Testen 1', 'Testen 2', 'Betrieb'].map((label, index) => ({ id: 's' + (index + 1), label }));
const SLOT_PHASE = ['prep', 'prep', 'train', 'test', 'test', 'ops'];
const CARD_PHASE = { label: 'prep', split: 'prep', store: 'train', run: 'test', acc: 'test', use: 'ops' };

const QUIZ = [
  {
    q: 'Was passiert beim KNN-Algorithmus in welcher Phase?',
    hint: 'Denke an das Phasenmodell aus Reiter 1.',
    options: [
      { id: 'line', text: 'Beim Training berechnet er eine Trenngerade zwischen den Klassen.', correct: false, why: 'Eine Trenngerade berechnet das Perzeptron. Der KNN-Algorithmus speichert beim Training nur die Trainingsdaten.' },
      { id: 'store', text: 'Beim Training speichert er nur die Trainingsdaten.', correct: true },
      { id: 'later', text: 'Abstände berechnet er erst, wenn ein neuer Punkt klassifiziert werden soll.', correct: true },
      { id: 'ops', text: 'Im produktiven Betrieb bestimmt er mit den Testdaten seine Genauigkeit.', correct: false, why: 'Die Genauigkeit wird beim Testen bestimmt, vor dem produktiven Betrieb. Im Betrieb klassifiziert das Modell neue Daten, deren Label niemand kennt.' },
    ],
  },
  {
    q: 'Was gilt für die Wahl von k?',
    hint: 'Denke an die beiden Situationen aus Reiter 2.',
    options: [
      { id: 'outlier', text: 'Bei zu kleinem k kann ein einzelner Ausreißer das Ergebnis bestimmen.', correct: true },
      { id: 'bigger', text: 'Je größer k, desto zuverlässiger ist das Ergebnis.', correct: false, why: 'Bei sehr großem k zählen auch weit entfernte Trainingsdaten mit. Ist k so groß wie die Anzahl aller Trainingsdaten, wird immer die insgesamt häufigste Klasse vorhergesagt.' },
      { id: 'one', text: 'k = 1 ist am besten, weil der nächste Nachbar am ähnlichsten ist.', correct: false, why: 'Der nächste Nachbar kann ein Ausreißer sein, wie die S-Person bei 179|100. Bei k = 1 entscheidet er dann allein.' },
      { id: 'all', text: 'Ist k so groß wie die Anzahl aller Trainingsdaten, bekommt jeder neue Punkt dieselbe Klasse.', correct: true },
    ],
  },
  {
    q: 'Mit welchen Daten wählt man k aus?',
    hint: 'Denke an die Aufteilung der Daten aus Reiter 3.',
    options: [
      { id: 'train', text: 'mit den Trainingsdaten', correct: false, why: 'Klassifiziert man die Trainingsdaten selbst, ist jeder Punkt sein eigener nächster Nachbar – k = 1 wäre immer perfekt. Über neue Daten sagt das nichts.' },
      { id: 'test', text: 'mit den Testdaten', correct: false, why: 'Die Testdaten sollen am Ende zeigen, wie gut das Modell mit unbekannten Daten zurechtkommt. Wählt man k mit ihnen, sind sie nicht mehr unbekannt.' },
      { id: 'valid', text: 'mit den Validierungsdaten', correct: true },
      { id: 'everything', text: 'mit allen Daten gleichzeitig', correct: false, why: 'Dann blieben keine unbekannten Daten für den Test übrig. Deshalb werden die Daten vorher aufgeteilt.' },
    ],
  },
  {
    q: 'Welche Aussagen zur Wahl von k für die Schulshirts stimmen?',
    hint: 'Zähle in der Tabelle aus Reiter 3 die richtigen Ergebnisse für jedes k.',
    options: [
      { id: 'seven', text: 'k = 7 ist am besten, weil am meisten Nachbarn mitzählen.', correct: false, why: 'Mit k = 7 werden nur drei der fünf Validierungspersonen richtig klassifiziert. Mehr Nachbarn bedeuten nicht automatisch bessere Ergebnisse.' },
      { id: 'three', text: 'Mit k = 3 werden alle fünf Validierungspersonen richtig klassifiziert.', correct: true },
      { id: 'hyper', text: 'k ist ein Hyperparameter: Er wird vor dem Einsatz festgelegt und nicht aus den Trainingsdaten gelernt.', correct: true },
      { id: 'others', text: 'Mit k = 1, k = 5 und k = 7 werden jeweils drei von fünf richtig klassifiziert.', correct: true },
    ],
  },
  {
    q: 'Ein Modell klassifiziert 20 Testdaten, 16 davon richtig. Was gilt?',
    hint: 'Genauigkeit = richtig klassifizierte Testdaten geteilt durch alle Testdaten.',
    options: [
      { id: 'eighty', text: 'Die Genauigkeit beträgt 16 : 20 = 80 %.', correct: true },
      { id: 'always', text: 'Künftig werden immer genau 80 % der neuen Daten richtig klassifiziert.', correct: false, why: 'Die Genauigkeit beschreibt nur diese 20 Testdaten. Bei anderen Daten kann das Modell besser oder schlechter abschneiden.' },
      { id: 'diagonal', text: 'Die richtig klassifizierten Testdaten stehen in der Konfusionsmatrix auf der Diagonale.', correct: true },
      { id: 'hundred', text: 'Die Genauigkeit beträgt 16 : 16 = 100 %, weil nur die richtigen zählen.', correct: false, why: 'Im Nenner stehen alle Testdaten, auch die vier falsch klassifizierten. Sonst wäre die Genauigkeit immer 100 %.' },
    ],
  },
  {
    q: 'Welche Aussagen über Trainingsdaten stimmen?',
    hint: 'Denke an die drei Fälle aus Reiter 5.',
    options: [
      { id: 'bignum', text: 'Das Merkmal mit den größeren Zahlen ist das wichtigere.', correct: false, why: 'Größere Zahlen bedeuten nur einen größeren Wertebereich. Ohne Normierung bestimmt ein solches Merkmal den Abstand fast allein, obwohl es nicht wichtiger ist.' },
      { id: 'more', text: 'Mehr Trainingsdaten einer Klasse machen das Modell immer besser.', correct: false, why: 'Sind fast alle Trainingsdaten aus einer Klasse, gewinnt diese Klasse schon bei kleinem k fast immer – das Modell wird verzerrt.' },
      { id: 'groups', text: 'Fehlen in den Trainingsdaten ganze Gruppen von Beispielen, werden solche Eingaben oft falsch klassifiziert.', correct: true },
      { id: 'norm', text: 'Normiert man eine Zuckermenge von 75 g im Bereich von 0 g bis 100 g, erhält man 0,75.', correct: true },
    ],
  },
];

const OVERVIEW = [
  '<strong>Reiter 1 – Was passiert beim Training?</strong> Beim KNN-Algorithmus werden beim Training nur die Trainingsdaten gespeichert. Phasen: Vorbereitung (Daten sammeln und mit Labeln versehen, Daten aufteilen) → Training (Trainingsdaten speichern) → Testen (Testdaten klassifizieren, Genauigkeit bestimmen) → Betrieb (Shirtgröße vorhersagen).',
  '<strong>Reiter 2 – Zu klein oder zu groß?</strong> N(182|99): k = 1 ergibt S wegen des Ausreißers 179|100, k = 3 ergibt M. Bei k = 15 bekommen Person A (164|90) und Person B (183|106) beide L, die insgesamt häufigste Größe.',
  '<strong>Reiter 3 – k mit Validierungsdaten bestimmen</strong> Heftbeispiel P(3,5|2): k = 1 falsch, k = 3 und k = 5 korrekt. Schulshirts: richtig klassifiziert bei k = 1: 3, k = 3: 5, k = 5: 3, k = 7: 3 von 5 → k = 3. k ist ein Hyperparameter; man wählt ihn mit den Validierungsdaten, nicht mit den Testdaten.',
  '<strong>Reiter 4 – Das Modell testen</strong> Konfusionsmatrix (Zeilen erwartet S, M, L; Spalten berechnet S, M, L): 2 · 0 · 0 | 1 · 2 · 0 | 0 · 1 · 2. Genauigkeit 6 : 8 = 75 %.',
  '<strong>Reiter 5 – Daten als Fehlerquelle</strong> Bei 5 × S und 1 × M wird ab k = 3 immer S vorhergesagt. Mit nur deutschen Städten als Trainingsdaten wird New York als Land klassifiziert. Normierung: 75 g → 0,75.',
  '<strong>Reiter 6 – Regression (freiwillig)</strong> Für x = 3: k = 1 ergibt y = 2, k = 3 ergibt y = (0,5 + 2 + 6,5) : 3 = 3.',
];

/* ---------- Zustand und Speicherung ---------- */

const CELL_VALUES = ['', 'korrekt', 'falsch'];
const OPEN_KEYS = OPEN_CELLS.map(([id, k]) => id + '-' + k);
const MATRIX_KEYS = SHIRT_CLASSES.flatMap((row) => SHIRT_CLASSES.map((column) => row + '-' + column));
const CARD_IDS = PHASE_CARDS.map((card) => card.id);
const EX_KS = [1, 3, 5];
const KS = { outlier: [1, 3, 5, 7], largek: [1, 3, 5, 7, 15], example: EX_KS, validation: VALIDATION_KS, house: HOUSE_K };

function defaultState() {
  return {
    active: 'training',
    r1: { mc: [], trainingSolved: false, slots: ['', '', '', '', '', ''], phasesSolved: false },
    r2: { kA: 1, mcA: [], aSolved: false, person: 'A', kB: 1, mcB: [], bSolved: false },
    r3: { exK: 1, ex: { 1: '', 3: '', 5: '' }, vId: 'V1', k: 1, cells: Object.fromEntries(OPEN_KEYS.map((key) => [key, ''])), bestK: '', text: '', mc: [], validationSolved: false },
    r4: { matrix: Object.fromEntries(MATRIX_KEYS.map((key) => [key, ''])), correct: '', total: '', percent: '', matrixSolved: false, accuracySolved: false },
    r5: { mcUneven: [], mcBias: [], mcScale: [], norm: '', normSolved: false },
    r6: { reg: '', regressionSolved: false, area: 125, houseK: 3 },
    quiz: { selected: QUIZ.map(() => []), quizSolved: false },
  };
}
const cleanText = (value, max) => (typeof value === 'string' ? value.slice(0, max) : '');
const cleanIds = (list, options) => (Array.isArray(list) ? [...new Set(list.filter((id) => options.includes(id)))] : []);
const cleanCell = (value) => (CELL_VALUES.includes(value) ? value : '');
const cleanK = (value, allowed, fallback) => (allowed.includes(value) ? value : fallback);
const optionIds = (key) => MC[key].options.map((option) => option.id);
const object = (value) => (value && typeof value === 'object' ? value : {});

function loadState() {
  const defaults = defaultState();
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!parsed || typeof parsed !== 'object') return defaults;
    const r1 = object(parsed.r1);
    const r2 = object(parsed.r2);
    const r3 = object(parsed.r3);
    const r4 = object(parsed.r4);
    const r5 = object(parsed.r5);
    const r6 = object(parsed.r6);
    const quiz = object(parsed.quiz);
    const slots = defaults.r1.slots.map((_, index) => (Array.isArray(r1.slots) && CARD_IDS.includes(r1.slots[index]) ? r1.slots[index] : ''));
    slots.forEach((id, index) => { if (id && slots.indexOf(id) !== index) slots[index] = ''; });
    const ex = object(r3.ex);
    const cells = object(r3.cells);
    const matrix = object(r4.matrix);
    return {
      active: STEPS.includes(parsed.active) ? parsed.active : defaults.active,
      r1: { mc: cleanIds(r1.mc, optionIds('trainingOptions')), trainingSolved: r1.trainingSolved === true, slots, phasesSolved: r1.phasesSolved === true },
      r2: {
        kA: cleanK(r2.kA, KS.outlier, 1), mcA: cleanIds(r2.mcA, optionIds('outlierOptions')), aSolved: r2.aSolved === true,
        person: ['A', 'B'].includes(r2.person) ? r2.person : 'A', kB: cleanK(r2.kB, KS.largek, 1), mcB: cleanIds(r2.mcB, optionIds('largeKOptions')), bSolved: r2.bSolved === true,
      },
      r3: {
        exK: cleanK(r3.exK, KS.example, 1),
        ex: Object.fromEntries(EX_KS.map((k) => [k, cleanCell(ex[k])])),
        vId: VALIDATION.some((person) => person.id === r3.vId) ? r3.vId : 'V1',
        k: cleanK(r3.k, KS.validation, 1),
        cells: Object.fromEntries(OPEN_KEYS.map((key) => [key, cleanCell(cells[key])])),
        bestK: ['1', '3', '5', '7'].includes(r3.bestK) ? r3.bestK : '',
        text: cleanText(r3.text, 600),
        mc: cleanIds(r3.mc, optionIds('validationOptions')),
        validationSolved: r3.validationSolved === true,
      },
      r4: {
        matrix: Object.fromEntries(MATRIX_KEYS.map((key) => [key, cleanText(matrix[key], 20)])),
        correct: cleanText(r4.correct, 20), total: cleanText(r4.total, 20), percent: cleanText(r4.percent, 20),
        matrixSolved: r4.matrixSolved === true, accuracySolved: r4.accuracySolved === true,
      },
      r5: {
        mcUneven: cleanIds(r5.mcUneven, optionIds('unevenOptions')), mcBias: cleanIds(r5.mcBias, optionIds('biasOptions')), mcScale: cleanIds(r5.mcScale, optionIds('scaleOptions')),
        norm: cleanText(r5.norm, 20), normSolved: r5.normSolved === true,
      },
      r6: { reg: cleanText(r6.reg, 20), regressionSolved: r6.regressionSolved === true, area: cleanK(r6.area, HOUSE_AREAS, 125), houseK: cleanK(r6.houseK, KS.house, 3) },
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
const isNumber = (input, value, tolerance = 0.0051) => { const parsed = normaliseNumber(input); return parsed !== null && Math.abs(parsed - value) < tolerance; };
const symbol = (label) => SHIRT_SYMBOLS[label] + ' ' + label;
const decimal = (value) => String(value).replace('.', ',');
const partOrError = (count) => (count > 0 ? 'partial' : 'error');

function countsSentence(k, counts) {
  return 'Unter den k = ' + k + ' nächsten Nachbarn: ○ S: ' + counts.S + ' · △ M: ' + counts.M + ' · □ L: ' + counts.L;
}
function neighbourList(list, neighbours) {
  list.replaceChildren(...neighbours.map(({ item }) => {
    const li = document.createElement('li');
    li.textContent = symbol(item.label) + ' (' + item.x + '|' + item.y + ')';
    return li;
  }));
}
const sizeLines = (neighbours) => neighbours.map(({ item }) => 'Größe ' + item.label + ' bei ' + item.x + ' und ' + item.y).join(', ');

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
function flowButton(text, target, className = 'primary-button') {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
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
    if (!next) return;
    container.replaceChildren(flowButton('Weiter: ' + labelFor(next), next));
    // Reiter 5 führt zusätzlich direkt zum Abschlussquiz (Reiter 6 ist freiwillig).
    if (container.dataset.flow === 'data') container.append(flowButton('Direkt zum Abschlussquiz', 'finish', 'secondary-button'));
  });
}

/* ---------- Auswahlknöpfe (Einfachauswahl ohne Radios) ---------- */

const CHOICES = {
  kA: { get: () => String(state.r2.kA), set: (value) => { state.r2.kA = Number(value); }, required: true, after: () => updateOutlier() },
  person: { get: () => state.r2.person, set: (value) => { state.r2.person = value; }, required: true, after: () => updateLargeK() },
  kB: { get: () => String(state.r2.kB), set: (value) => { state.r2.kB = Number(value); }, required: true, after: () => updateLargeK() },
  exK: { get: () => String(state.r3.exK), set: (value) => { state.r3.exK = Number(value); }, required: true, after: () => updateExample() },
  vId: { get: () => state.r3.vId, set: (value) => { state.r3.vId = value; }, required: true, after: () => updateValidation() },
  vK: { get: () => String(state.r3.k), set: (value) => { state.r3.k = Number(value); }, required: true, after: () => updateValidation() },
  bestK: { get: () => state.r3.bestK, set: (value) => { state.r3.bestK = value; } },
  houseArea: { get: () => String(state.r6.area), set: (value) => { state.r6.area = Number(value); }, required: true, after: () => renderHouse() },
  houseK: { get: () => String(state.r6.houseK), set: (value) => { state.r6.houseK = Number(value); }, required: true, after: () => renderHouse() },
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

function showTrainingResult() {
  $('#training-remember').hidden = !state.r1.trainingSolved;
  if (state.r1.trainingSolved) $('#knn-training-cell').textContent = 'nur die gespeicherten Trainingsdaten';
}
const showKRemember = () => { $('#k-remember').hidden = !(state.r2.aSolved && state.r2.bSolved); };
const showValidationRemember = () => { $('#validation-remember').hidden = !state.r3.validationSolved; };

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
  bind('check-training', 'trainingOptions', 'training-feedback', () => { state.r1.trainingSolved = true; saveState(); showTrainingResult(); });
  bind('check-outlier', 'outlierOptions', 'outlier-feedback', () => { state.r2.aSolved = true; saveState(); showKRemember(); });
  bind('check-largek', 'largeKOptions', 'largek-feedback', () => { state.r2.bSolved = true; saveState(); showKRemember(); });
  bind('check-validation', 'validationOptions', 'validation-feedback', () => { state.r3.validationSolved = true; saveState(); showValidationRemember(); });
  bind('check-uneven', 'unevenOptions', 'uneven-feedback');
  bind('check-bias', 'biasOptions', 'bias-feedback');
  bind('check-scale', 'scaleOptions', 'scale-feedback');
}

/* ---------- Reiter 1: Phasen ---------- */

function checkPhases() {
  const slots = state.r1.slots;
  if (slots.some((id) => !id)) { feedback('phases-feedback', 'error', 'Lege in jedes der sechs Felder eine Karte.'); return; }
  if (slots.includes('x')) { feedback('phases-feedback', 'error', 'Die Karte „Gewichte anpassen, bis die Trainingsdaten richtig klassifiziert werden“ gehört zu keiner Phase des KNN-Algorithmus: So trainiert das Perzeptron aus Aufgabe 5. Der KNN-Algorithmus passt beim Training nichts an – er speichert nur die Trainingsdaten.'); return; }
  const correct = slots.filter((id, index) => CARD_PHASE[id] === SLOT_PHASE[index]).length;
  if (correct === 6) {
    feedback('phases-feedback', 'success', 'Richtig. Erst werden die Daten vorbereitet und aufgeteilt, dann gespeichert, dann mit den Testdaten geprüft – und erst danach sagt das Modell Shirtgrößen für neue Personen vorher.');
    state.r1.phasesSolved = true; saveState(); $('#phases-remember').hidden = false;
  } else if (correct > 0) feedback('phases-feedback', 'partial', correct + ' von 6 Karten liegen in der richtigen Phase. Frage dich bei jeder Karte: Braucht man dafür schon ein fertiges Modell – und ist es schon geprüft?');
  else feedback('phases-feedback', 'error', 'Noch nicht korrekt. Beginne mit der Frage: Was muss passieren, bevor überhaupt trainiert werden kann?');
}

function setupTraining() {
  showTrainingResult();
  const cards = setupCardSlots($('#phase-cards'), { cards: PHASE_CARDS, slots: PHASE_SLOTS, choices: state.r1.slots, onChange: () => saveState() });
  $('#check-phases').addEventListener('click', checkPhases);
  $('#reset-phases').addEventListener('click', () => { cards.reset(); hideFeedback('phases-feedback'); });
  $('#phases-remember').hidden = !state.r1.phasesSolved;
}

/* ---------- Reiter 2: k zu klein oder zu groß ---------- */

let baseOutlierDesc = '';
let baseLargeKDesc = '';
function updateOutlier() {
  const k = state.r2.kA;
  const { neighbours, counts } = renderShirtPlot($('#outlier-plot'), { data: TRAINING_WITH_OUTLIER, newPoint: OUTLIER_POINT, newLabel: 'N (182|99)', k });
  $('#outlier-counts').textContent = countsSentence(k, counts);
  neighbourList($('#outlier-list'), neighbours);
  $('#outlier-plot-desc').textContent = baseOutlierDesc + ' Mit k = ' + k + ' führen Linien zu: ' + sizeLines(neighbours) + '.';
}
function updateLargeK() {
  const k = state.r2.kB;
  const name = state.r2.person;
  const person = LARGE_K_PERSONS[name];
  const { neighbours, counts } = renderShirtPlot($('#largek-plot'), {
    data: SHIRT_TRAINING, newPoint: person, newLabel: name + ' (' + person.x + '|' + person.y + ')', labelOffset: person.labelOffset, k,
  });
  $('#largek-counts').textContent = countsSentence(k, counts);
  $('#largek-plot-desc').textContent = baseLargeKDesc + ' Gewählt ist Person ' + name + ' bei ' + person.x + ' und ' + person.y + '. Mit k = ' + k + ' führen Linien zu: ' + sizeLines(neighbours) + '.';
}
function setupKvalue() {
  baseOutlierDesc = $('#outlier-plot-desc').textContent;
  baseLargeKDesc = $('#largek-plot-desc').textContent;
  renderLegend($('#outlier-legend'));
  renderLegend($('#largek-legend'));
  updateOutlier();
  updateLargeK();
  showKRemember();
}

/* ---------- Reiter 3: k mit Validierungsdaten bestimmen ---------- */

const EXAMPLE_PLOT = {
  domain: { x: [0, 6], y: [0, 4] }, scale: 70, origin: { x: 50, y: 330 }, tickStep: 1, axisTitles: ['x', 'y'],
  shapes: { blau: 'circle', orange: 'square' }, classes: ['blau', 'orange'],
  pointTitle: (item) => 'Punkt (' + decimal(item.x) + '|' + decimal(item.y) + '), Label ' + item.label,
};
let baseExampleDesc = '';
let baseValidationDesc = '';

function updateExample() {
  const k = state.r3.exK;
  const { neighbours, counts } = renderShirtPlot($('#example-plot'), {
    ...EXAMPLE_PLOT, data: HEFT_VALIDATION.training, newPoint: HEFT_VALIDATION.point, newLabel: 'P (3,5|2)', newTitle: 'Validierungspunkt P (3,5|2), Label blau bekannt', k,
  });
  $('#example-counts').textContent = 'Unter den k = ' + k + ' nächsten Nachbarn: ○ blau: ' + counts.blau + ' · □ orange: ' + counts.orange;
  $('#example-plot-desc').textContent = baseExampleDesc + ' Mit k = ' + k + ' führen Linien zu: ' + neighbours.map(({ item }) => 'Label ' + item.label + ' bei ' + decimal(item.x) + ' und ' + decimal(item.y)).join(', ') + '.';
}
function updateValidation() {
  const k = state.r3.k;
  const person = VALIDATION.find((entry) => entry.id === state.r3.vId);
  const { neighbours, counts } = renderShirtPlot($('#validation-plot'), {
    data: TRAINING_WITH_OUTLIER, newPoint: person, newLabel: person.id + ' (' + person.x + '|' + person.y + ')', labelOffset: person.labelOffset, k,
  });
  $('#validation-counts').textContent = countsSentence(k, counts);
  $('#validation-plot-desc').textContent = baseValidationDesc + ' Gewählt ist ' + person.id + ' bei ' + person.x + ' und ' + person.y + '. Mit k = ' + k + ' führen Linien zu: ' + sizeLines(neighbours) + '.';
}

// Zellknopf: offen (–) -> korrekt (✓) -> falsch (✗) -> offen
const CELL_SIGNS = { '': '–', korrekt: '✓', falsch: '✗' };
function renderCell(button, value, name) {
  button.dataset.state = value || 'offen';
  button.textContent = CELL_SIGNS[value];
  button.setAttribute('aria-label', name + ': ' + (value || 'offen'));
}
function setupCellToggle(button, name, get, set) {
  renderCell(button, get(), name);
  button.addEventListener('click', () => {
    set(CELL_VALUES[(CELL_VALUES.indexOf(get()) + 1) % CELL_VALUES.length]);
    renderCell(button, get(), name);
    saveState();
  });
}

const cellSolution = (correct) => (correct ? 'korrekt' : 'falsch');
function checkExample() {
  const entries = EX_KS.map((k) => ({ k, value: state.r3.ex[k], expected: EXPECTED.heft.cells[k] }));
  if (entries.some((entry) => !entry.value)) { feedback('example-feedback', 'error', 'Entscheide für k = 1, k = 3 und k = 5, ob das Ergebnis korrekt oder falsch ist.'); return; }
  const correct = entries.filter((entry) => entry.value === entry.expected).length;
  if (correct === entries.length) { feedback('example-feedback', 'success', 'Richtig. Bei k = 1 ist der nächste Nachbar orange (3|2) – falsch. Bei k = 3 und k = 5 sind die blauen Nachbarn in der Mehrheit – korrekt.'); return; }
  feedback('example-feedback', partOrError(correct), correct + ' von 3 Einträgen stimmen. Stelle k ein und vergleiche die Mehrheit unter den Nachbarn mit dem bekannten Label blau von P.');
}

let validationResults = null;
function checkValidationTable() {
  if (OPEN_KEYS.some((key) => !state.r3.cells[key])) { feedback('validation-table-feedback', 'error', 'Trage in jedes offene Feld „korrekt“ oder „falsch“ ein.'); return; }
  const wrong = OPEN_CELLS.filter(([id, k]) => state.r3.cells[id + '-' + k] !== cellSolution(validationResults.rows.find((row) => row.id === id).results[k].correct));
  if (!wrong.length) { feedback('validation-table-feedback', 'success', 'Richtig. Alle Einträge stimmen. Zähle jetzt für jedes k, wie viele Validierungspersonen richtig klassifiziert werden.'); return; }
  const correct = OPEN_CELLS.length - wrong.length;
  const [id, k] = wrong[0];
  const truth = validationResults.rows.find((row) => row.id === id).truth;
  feedback('validation-table-feedback', partOrError(correct), correct + ' von 6 Einträgen stimmen. Prüfe zuerst ' + id + ' bei k = ' + k + ': Wähle ' + id + ' und k = ' + k + ' und vergleiche die Mehrheit unter den Nachbarn mit der tatsächlichen Größe ' + truth + '.');
}

const BEST_K_FEEDBACK = {
  3: ['success', 'Richtig. Mit k = 3 werden alle fünf Validierungspersonen richtig klassifiziert, mit k = 1, k = 5 und k = 7 jeweils nur drei.'],
  1: ['error', 'Mit k = 1 werden nur drei der fünf Validierungspersonen richtig klassifiziert: Bei V3 und V5 ist der nächste Nachbar ein Punkt der falschen Größe. Zähle für jede Spalte die richtigen Ergebnisse.'],
  5: ['error', 'Mit k = 5 werden nur drei der fünf Validierungspersonen richtig klassifiziert: Bei V3 und V4 zählen schon zu viele Punkte der anderen Größe mit. Zähle für jede Spalte die richtigen Ergebnisse.'],
  7: ['error', 'Mit k = 7 werden nur drei der fünf Validierungspersonen richtig klassifiziert: Bei V2 und V4 zählen zu viele weit entfernte Punkte mit. Zähle für jede Spalte die richtigen Ergebnisse.'],
};
function checkBestK() {
  const chosen = state.r3.bestK;
  if (!chosen) { feedback('best-k-feedback', 'error', 'Wähle einen Wert für k aus.'); return; }
  const [kind, text] = BEST_K_FEEDBACK[chosen];
  feedback('best-k-feedback', kind, text);
}

function buildValidationRows() {
  const body = $('#validation-body');
  validationResults = validationTable(VALIDATION, TRAINING_WITH_OUTLIER, VALIDATION_KS);
  validationResults.rows.forEach((row) => {
    const person = VALIDATION.find((entry) => entry.id === row.id);
    const tr = document.createElement('tr');
    const head = document.createElement('th');
    head.scope = 'row';
    head.textContent = row.id;
    const size = document.createElement('td');
    size.textContent = person.x + '|' + person.y;
    const truth = document.createElement('td');
    truth.textContent = symbol(row.truth);
    tr.append(head, size, truth);
    VALIDATION_KS.forEach((k) => {
      const cell = document.createElement('td');
      const key = row.id + '-' + k;
      if (OPEN_KEYS.includes(key)) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'knn-cell-toggle';
        setupCellToggle(button, row.id + ' bei k = ' + k, () => state.r3.cells[key], (value) => { state.r3.cells[key] = value; });
        cell.append(button);
      } else {
        const correct = row.results[k].correct;
        cell.className = 'knn-given';
        const sign = document.createElement('span');
        sign.setAttribute('aria-hidden', 'true');
        sign.textContent = correct ? '✓' : '✗';
        const text = document.createElement('span');
        text.className = 'sr-only';
        text.textContent = correct ? 'korrekt' : 'falsch';
        cell.append(sign, text);
      }
      tr.append(cell);
    });
    body.append(tr);
  });
}

const VALIDATION_FALLBACK = {
  correct: 'Du wählst k = 3 und begründest die Wahl mit dem Vergleich der richtigen Ergebnisse in der Tabelle.',
  partial: 'Die Richtung stimmt. Vergleiche ausdrücklich, wie viele Validierungspersonen bei jedem k richtig klassifiziert werden.',
  incorrect: 'Zähle in der Tabelle für jedes k die richtigen Ergebnisse und begründe damit deine Wahl.',
};
function setupJustification() {
  const textarea = $('#validation-answer');
  const counter = $('#validation-counter');
  const update = () => { counter.textContent = textarea.value.length + ' von 600 Zeichen'; };
  textarea.addEventListener('input', () => { state.r3.text = textarea.value; update(); saveState(); });
  textarea.value = state.r3.text;
  update();
  $('#check-validation-answer').addEventListener('click', async () => {
    const answer = textarea.value.trim();
    if (answer.length < 30) { feedback('validation-answer-feedback', 'error', 'Begründe deine Wahl noch etwas genauer, damit deine Antwort sinnvoll ausgewertet werden kann.'); textarea.focus(); return; }
    const button = $('#check-validation-answer');
    button.disabled = true;
    feedback('validation-answer-feedback', '', 'Deine Begründung wird mit dem Erwartungshorizont verglichen.');
    try {
      const result = await evaluateSemanticAnswer({ serverUrl: SERVER_URL, taskId: TASK_ID, answer });
      const kind = result.points === result.maxPoints ? 'success' : result.points > 0 ? 'partial' : 'error';
      const fallback = VALIDATION_FALLBACK[kind === 'success' ? 'correct' : kind === 'partial' ? 'partial' : 'incorrect'];
      feedback('validation-answer-feedback', kind, result.points + ' von ' + result.maxPoints + ' Punkten – ' + result.status + '. ' + ((result.feedback || '').trim() || fallback));
    } catch (error) {
      const unknown = error.message === 'Diese Aufgabe ist auf dem Auswertungsserver nicht bekannt.';
      feedback('validation-answer-feedback', 'error', unknown ? 'Für Aufgabe 8 ist noch keine aktuelle Serverversion bereitgestellt. Bitte informiere deine Lehrkraft.' : error.message);
    } finally { button.disabled = false; }
  });
}

function setupValidation() {
  baseExampleDesc = $('#example-plot-desc').textContent;
  baseValidationDesc = $('#validation-plot-desc').textContent;
  renderLegend($('#example-legend'), {
    classes: [{ label: 'blau', text: 'blau' }, { label: 'orange', text: 'orange' }], shapes: EXAMPLE_PLOT.shapes, newText: 'P (Label blau bekannt)',
  });
  renderLegend($('#validation-legend'), { newText: 'Validierungsperson' });
  updateExample();
  updateValidation();
  EX_KS.forEach((k) => setupCellToggle($('[data-cell=ex-' + k + ']'), 'P bei k = ' + k, () => state.r3.ex[k], (value) => { state.r3.ex[k] = value; }));
  $('#check-example').addEventListener('click', checkExample);
  buildValidationRows();
  $('#check-validation-table').addEventListener('click', checkValidationTable);
  $('#check-best-k').addEventListener('click', checkBestK);
  setupJustification();
  showValidationRemember();
}

/* ---------- Reiter 4: Modell testen ---------- */

const TEST_PAIRS = TEST_PERSONS.map((person) => ({ person, erwartet: person.truth, berechnet: classify(person, TRAINING_WITH_OUTLIER, TEST_K).label }));
const TARGET_MATRIX = confusionMatrix(TEST_PAIRS, SHIRT_CLASSES);
const TARGET_TRANSPOSED = transposeMatrix(TARGET_MATRIX, SHIRT_CLASSES);
const TARGET_ACCURACY = accuracy(TARGET_MATRIX, SHIRT_CLASSES);

function matrixInputs() { return MATRIX_KEYS.map((key) => ({ key, input: $('#matrix [name=' + key + ']') })); }

function checkMatrix() {
  const fields = matrixInputs().map(({ key, input }) => {
    const parsed = normaliseNumber(input.value);
    return { key, input, value: parsed !== null && Number.isInteger(parsed) && parsed >= 0 ? parsed : null };
  });
  const mark = (field, ok) => { field.input.classList.toggle('is-correct', ok); field.input.classList.toggle('is-wrong', !ok); };
  const [rowOf, columnOf] = [(key) => key.split('-')[0], (key) => key.split('-')[1]];
  if (fields.some((field) => field.value === null)) {
    // Solange Felder leer oder ungültig sind, wird nichts als richtig bestätigt: nur diese Felder werden als offen markiert.
    fields.forEach((field) => { field.input.classList.remove('is-correct'); field.input.classList.toggle('is-wrong', field.value === null); });
    feedback('matrix-feedback', 'error', 'Trage in jedes Feld eine Zahl ein – auch 0.');
    return;
  }
  const entered = Object.fromEntries(SHIRT_CLASSES.map((row) => [row, Object.fromEntries(SHIRT_CLASSES.map((column) => [column, fields.find((field) => field.key === row + '-' + column).value]))]));
  const isRight = (field) => field.value === TARGET_MATRIX[rowOf(field.key)][columnOf(field.key)];
  fields.forEach((field) => mark(field, isRight(field)));
  const correct = fields.filter(isRight).length;
  if (correct === 9) {
    feedback('matrix-feedback', 'success', 'Richtig. Auf der Diagonale stehen die sechs richtig klassifizierten Testpersonen. Daneben stehen die zwei Verwechslungen: einmal M als S und einmal L als M.');
    state.r4.matrixSolved = true; saveState(); showTestRemember();
    return;
  }
  if (MATRIX_KEYS.every((key) => entered[rowOf(key)][columnOf(key)] === TARGET_TRANSPOSED[rowOf(key)][columnOf(key)])) {
    feedback('matrix-feedback', 'partial', 'Zeilen und Spalten sind vertauscht: Die Zeilen geben das erwartete Label an, die Spalten das berechnete. T4 trägt tatsächlich M, das Modell berechnet S – sie gehört in Zeile M, Spalte S.');
    return;
  }
  const sum = fields.reduce((total, field) => total + field.value, 0);
  if (sum !== TEST_PERSONS.length) {
    feedback('matrix-feedback', 'error', 'In der Matrix müssen genau 8 Testpersonen stehen – jede in genau einem Feld. Bei dir sind es ' + sum + '.');
    return;
  }
  const first = fields.find((field) => !isRight(field));
  feedback('matrix-feedback', partOrError(correct), correct + ' von 9 Feldern stimmen. Prüfe das Feld „erwartet ' + rowOf(first.key) + ', berechnet ' + columnOf(first.key) + '“. Lies zuerst die Zeile (erwartet), dann die Spalte (berechnet).');
}

function checkAccuracy() {
  const read = (selector) => normaliseNumber($(selector).value, { allowPercent: true });
  const [correct, total, percent] = [read('#correct-input'), read('#total-input'), read('#percent-input')];
  if (correct === null || total === null || percent === null) { feedback('accuracy-feedback', 'error', 'Fülle alle drei Felder aus.'); return; }
  const target = { correct: TARGET_ACCURACY.correct, total: TARGET_ACCURACY.total, percent: TARGET_ACCURACY.value * 100 };
  const percentRight = Math.abs(percent - target.percent) < 0.0051;
  if (correct === target.correct && total === target.total && percentRight) {
    feedback('accuracy-feedback', 'success', 'Richtig. 6 von 8 Testpersonen sind richtig klassifiziert, das sind 75 %.');
    state.r4.accuracySolved = true; saveState(); showTestRemember();
  } else if (total === target.correct || percent === 100) feedback('accuracy-feedback', 'error', 'Im Nenner stehen alle Testpersonen – auch die zwei falsch klassifizierten. Sonst käme immer 100 % heraus.');
  else if (correct === TEST_PERSONS.length - target.correct) feedback('accuracy-feedback', 'error', 'Du hast die Fehlklassifikationen gezählt. Für die Genauigkeit zählen die richtig klassifizierten Testpersonen auf der Diagonale.');
  else if (percent === 25) feedback('accuracy-feedback', 'error', '25 % ist der Anteil der falsch klassifizierten Testpersonen. Gesucht ist der Anteil der richtig klassifizierten.');
  else if (Math.abs(percent - 0.75) < 1e-9) feedback('accuracy-feedback', 'error', 'Gib die Genauigkeit in Prozent an: 0,75 entspricht 75 %.');
  else if (correct === target.correct && total === target.total) feedback('accuracy-feedback', 'partial', 'Die Anzahlen stimmen. Rechne 6 von 8 noch in Prozent um.');
  else feedback('accuracy-feedback', 'error', 'Zähle die Felder auf der Diagonale: S–S, M–M und L–L. Im Nenner stehen alle Testpersonen.');
}

const showTestRemember = () => { $('#test-remember').hidden = !(state.r4.matrixSolved && state.r4.accuracySolved); };

function setupTesting() {
  const body = $('#test-body');
  TEST_PAIRS.forEach(({ person, erwartet, berechnet }) => {
    const tr = document.createElement('tr');
    const head = document.createElement('th');
    head.scope = 'row';
    head.textContent = person.id;
    tr.append(head);
    [person.x, person.y, symbol(erwartet), symbol(berechnet)].forEach((value) => { const cell = document.createElement('td'); cell.textContent = value; tr.append(cell); });
    body.append(tr);
  });
  const matrixBody = $('#matrix-body');
  SHIRT_CLASSES.forEach((row) => {
    const tr = document.createElement('tr');
    const head = document.createElement('th');
    head.scope = 'row';
    head.textContent = row;
    tr.append(head);
    SHIRT_CLASSES.forEach((column) => {
      const key = row + '-' + column;
      const cell = document.createElement('td');
      const label = document.createElement('label');
      const hidden = document.createElement('span');
      hidden.className = 'sr-only';
      hidden.textContent = 'erwartet ' + row + ', berechnet ' + column;
      const input = document.createElement('input');
      input.name = key;
      input.inputMode = 'numeric';
      input.autocomplete = 'off';
      input.maxLength = 20;
      input.value = state.r4.matrix[key];
      input.addEventListener('input', () => { state.r4.matrix[key] = input.value; saveState(); });
      label.append(hidden, input);
      cell.append(label);
      tr.append(cell);
    });
    matrixBody.append(tr);
  });
  [['correct', '#correct-input'], ['total', '#total-input'], ['percent', '#percent-input']].forEach(([field, selector]) => {
    const input = $(selector);
    input.maxLength = 20;
    input.value = state.r4[field];
    input.addEventListener('input', () => { state.r4[field] = input.value; saveState(); });
  });
  $('#check-matrix').addEventListener('click', checkMatrix);
  $('#check-accuracy').addEventListener('click', checkAccuracy);
  showTestRemember();
}

/* ---------- Reiter 5: Daten als Fehlerquelle ---------- */

function checkNorm() {
  const value = $('#norm-input').value;
  const parsed = normaliseNumber(value);
  const is = (target) => parsed !== null && Math.abs(parsed - target) < 1e-9;
  if (parsed === null) feedback('norm-feedback', 'error', 'Gib eine Zahl ein, zum Beispiel 0,5.');
  else if (Math.abs(parsed - EXPECTED.food.norm75) < 0.0051) {
    feedback('norm-feedback', 'success', 'Richtig. 75 g liegen bei drei Vierteln des Bereichs von 0 g bis 100 g, also bei 0,75.');
    state.r5.normSolved = true; saveState(); $('#norm-remember').hidden = false;
  } else if (is(75)) feedback('norm-feedback', 'error', '75 ist der ursprüngliche Wert. Gesucht ist, an welcher Stelle zwischen 0 und 1 er liegt, wenn 0 g dem Wert 0 und 100 g dem Wert 1 entsprechen.');
  else if (is(7.5)) feedback('norm-feedback', 'error', 'Fast: Teile durch die Breite des Wertebereichs. Der Bereich reicht von 0 g bis 100 g, ist also 100 breit.');
  else if (is(0.25) || is(25)) feedback('norm-feedback', 'error', 'Du hast den Abstand zum größten Wert berechnet. Gesucht ist der Abstand zum kleinsten Wert 0 g, geteilt durch die Breite des Bereichs.');
  else if (is(0.075)) feedback('norm-feedback', 'error', 'Prüfe die Kommastelle: 75 von 100 ist ein Anteil von drei Vierteln.');
  else feedback('norm-feedback', 'error', 'Noch nicht korrekt. Überlege: 0 g entsprechen 0, 100 g entsprechen 1. Wo liegen dann 75 g?');
}

function fillTable(bodyId, rows) {
  const body = $(bodyId);
  rows.forEach((values) => {
    const tr = document.createElement('tr');
    values.forEach((value) => { const cell = document.createElement('td'); cell.textContent = value; tr.append(cell); });
    body.append(tr);
  });
}

function setupData() {
  fillTable('#uneven-body', UNEVEN_TRAINING.map((item) => [item.id, item.x, item.y, symbol(item.label)]));
  const input = $('#norm-input');
  input.maxLength = 20;
  input.value = state.r5.norm;
  input.addEventListener('input', () => { state.r5.norm = input.value; saveState(); });
  $('#check-norm').addEventListener('click', checkNorm);
  $('#norm-remember').hidden = !state.r5.normSolved;
}

/* ---------- Reiter 6: Regression ---------- */

const REGRESSION_PLOT = {
  domain: { x: [0, 7], y: [0, 7] }, scale: 40, origin: { x: 50, y: 330 }, tickStep: 1, axisTitles: ['x (unabhängige Größe)', 'y (Zielgröße)'],
  shapes: { R: 'circle' }, classes: ['R'], metric: distanceX, pointLabel: (item) => item.id,
  pointTitle: (item) => item.id + ' (' + decimal(item.x) + '|' + decimal(item.y) + ')',
};
let baseRegressionDesc = '';
function renderRegression() {
  const solved = state.r6.regressionSolved;
  const k = solved ? 3 : 1;
  const prediction = solved ? 3 : 2;
  renderShirtPlot($('#regression-plot'), {
    ...REGRESSION_PLOT, data: REGRESSION.training, newPoint: { x: REGRESSION.x, y: prediction }, k,
    newLabel: 'P bei k = ' + k + ' (3|' + prediction + ')',
  });
  $('#regression-plot-desc').textContent = baseRegressionDesc + (solved
    ? ' P liegt für k = 3 bei 3 und 3; Linien führen zu C, B und D.'
    : ' P liegt für k = 1 bei 3 und 2; eine Linie führt zu C.');
  $('#regression-remember').hidden = !solved;
}

function checkRegression() {
  const value = $('#regression-input').value;
  const parsed = normaliseNumber(value);
  if (parsed === null) feedback('regression-feedback', 'error', 'Gib eine Zahl ein, zum Beispiel 1,5.');
  else if (isNumber(value, EXPECTED.regression.k3)) {
    feedback('regression-feedback', 'success', 'Richtig. Die drei nächsten Nachbarn in x-Richtung sind C (Abstand 1), B und D (Abstand je 2). Mittelwert: (0,5 + 2 + 6,5) : 3 = 9 : 3 = 3.');
    state.r6.regressionSolved = true; saveState(); renderRegression();
  } else if (isNumber(value, EXPECTED.regression.k1)) feedback('regression-feedback', 'error', 'Das ist die Vorhersage für k = 1. Bei k = 3 zählen die drei Punkte mit den kleinsten Abständen in x-Richtung.');
  else if (isNumber(value, EXPECTED.regression.sum)) feedback('regression-feedback', 'error', '9 ist die Summe der drei y-Werte. Teile noch durch die Anzahl der Nachbarn.');
  else if (isNumber(value, EXPECTED.regression.allFour)) feedback('regression-feedback', 'error', 'Du hast alle vier Punkte gemittelt. Bei k = 3 zählen nur die drei nächsten Nachbarn – A ist am weitesten von x = 3 entfernt.');
  else if (Math.abs(parsed - EXPECTED.regression.firstThree) <= 0.01) feedback('regression-feedback', 'error', 'Du hast A, B und C genommen. Prüfe die Abstände in x-Richtung: D liegt bei x = 5, also nur 2 von x = 3 entfernt – genauso weit wie B und näher als A.');
  else feedback('regression-feedback', 'error', 'Noch nicht korrekt. Bestimme zuerst die drei Punkte, deren x-Werte am nächsten an 3 liegen, und bilde dann den Mittelwert ihrer y-Werte.');
}

const HOUSE_PLOT = {
  domain: { x: [60, 200], y: [150, 450] }, scale: 2.5, scaleY: 1, origin: { x: 50, y: 350 }, tickStep: { x: 20, y: 50 },
  axisTitles: ['Wohnfläche in m²', 'Preis in Tausend Euro'], shapes: { H: 'circle' }, classes: ['H'], metric: distanceX,
  pointTitle: (item) => 'Haus ' + item.id + ': ' + item.x + ' m², ' + item.y + ' Tausend Euro',
};
let baseHouseDesc = '';
function renderHouse() {
  const area = state.r6.area;
  const k = state.r6.houseK;
  const { value } = regress({ x: area, y: 0 }, HOUSES, k);
  const rounded = Math.round(value);
  renderShirtPlot($('#house-plot'), {
    ...HOUSE_PLOT, data: HOUSES, newPoint: { x: area, y: value }, newLabel: '', k,
    newTitle: 'Schätzung: ' + area + ' m², rund ' + rounded + ' Tausend Euro',
  });
  $('#house-plot-desc').textContent = baseHouseDesc + ' Schätzung für ' + area + ' m² mit k = ' + k + ': rund ' + rounded + ' Tausend Euro.';
  $('#house-output').textContent = k > 1
    ? 'Geschätzter Preis: rund ' + rounded + ' Tausend Euro – der Mittelwert der Preise der ' + k + ' Häuser mit der ähnlichsten Wohnfläche.'
    : 'Geschätzter Preis: ' + rounded + ' Tausend Euro – der Preis des Hauses mit der ähnlichsten Wohnfläche.';
}

function setupRegression() {
  baseRegressionDesc = $('#regression-plot-desc').textContent;
  baseHouseDesc = $('#house-plot-desc').textContent;
  renderLegend($('#regression-legend'), { classes: [{ label: 'R', text: 'Trainingspunkt' }], shapes: REGRESSION_PLOT.shapes, newText: 'P (Vorhersage)' });
  renderLegend($('#house-legend'), { classes: [{ label: 'H', text: 'Haus (Beispieldaten)' }], shapes: HOUSE_PLOT.shapes, newText: 'Schätzung' });
  const input = $('#regression-input');
  input.maxLength = 20;
  input.value = state.r6.reg;
  input.addEventListener('input', () => { state.r6.reg = input.value; saveState(); });
  $('#check-regression').addEventListener('click', checkRegression);
  renderRegression();
  renderHouse();
}

/* ---------- Reiter 7: Abschlussquiz ---------- */

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
setupTraining();
setupKvalue();
setupValidation();
setupTesting();
setupData();
setupRegression();
setupQuiz();
setupReset();
showStep(state.active);
