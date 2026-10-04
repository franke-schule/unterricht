// Aufgabenspezifische Daten für Aufgabe 8 (nur Daten; Rechenwege stehen in logic/).
import { SHIRT_TRAINING } from './shirts.mjs';

// Reiter 2 (a): Trainingsdaten mit einem Ausreißer und die neue Person N
export const OUTLIER = { id: 16, x: 179, y: 100, label: 'S' };
export const TRAINING_WITH_OUTLIER = [...SHIRT_TRAINING, OUTLIER];
export const OUTLIER_POINT = { x: 182, y: 99 };

// Reiter 2 (b): zwei Personen für k = 15 (die 15 Trainingsdaten aus Aufgabe 7)
export const LARGE_K_PERSONS = {
  A: { x: 164, y: 90, labelOffset: { dx: 18, dy: 8, anchor: 'start' } },
  B: { x: 183, y: 106 },
};

// Reiter 3 (a): Beispiel aus dem Arbeitsheft, Klassen blau und orange
export const HEFT_VALIDATION = {
  training: [
    { id: 1, x: 3, y: 2, label: 'orange' },
    { id: 2, x: 5, y: 3, label: 'orange' },
    { id: 3, x: 3.5, y: 3, label: 'blau' },
    { id: 4, x: 2, y: 2.5, label: 'blau' },
    { id: 5, x: 1.5, y: 1, label: 'blau' },
  ],
  point: { x: 3.5, y: 2 },
  truth: 'blau',
};

// Reiter 3 (c): fünf Validierungspersonen; labelOffset verhindert, dass die Beschriftung Datenpunkte verdeckt
export const VALIDATION = [
  { id: 'V1', x: 166, y: 93, truth: 'S', labelOffset: { dx: 0, dy: -20, anchor: 'middle' } },
  { id: 'V2', x: 172, y: 105, truth: 'M', labelOffset: { dx: -18, dy: 4, anchor: 'end' } },
  { id: 'V3', x: 180, y: 113, truth: 'M', labelOffset: { dx: -18, dy: 4, anchor: 'end' } },
  { id: 'V4', x: 184, y: 96, truth: 'S' },
  { id: 'V5', x: 188, y: 110, truth: 'L' },
];
export const VALIDATION_KS = [1, 3, 5, 7];
// Offene Zellen der Tabelle (Person, k); alle anderen Zellen sind vorgegeben
export const OPEN_CELLS = [['V2', 7], ['V3', 1], ['V3', 3], ['V4', 3], ['V4', 5], ['V5', 1]];
export const BEST_K = 3;

// Reiter 4: acht Testpersonen, Modell mit k = 3
export const TEST_PERSONS = [
  { id: 'T1', x: 172, y: 95, truth: 'S' },
  { id: 'T2', x: 177, y: 105, truth: 'M' },
  { id: 'T3', x: 191, y: 119, truth: 'L' },
  { id: 'T4', x: 174, y: 101, truth: 'M' },
  { id: 'T5', x: 175, y: 92, truth: 'S' },
  { id: 'T6', x: 177, y: 114, truth: 'L' },
  { id: 'T7', x: 183, y: 103, truth: 'M' },
  { id: 'T8', x: 194, y: 124, truth: 'L' },
];
export const TEST_K = 3;

// Reiter 5: Fall 1 (Arbeitsheft S. 30) und Fall 3 (Lebensmittel: x = Zucker in g, y = Anteil am Tagesbedarf)
export const UNEVEN_TRAINING = [
  { id: 1, x: 165, y: 87, label: 'S' },
  { id: 2, x: 174, y: 97, label: 'S' },
  { id: 3, x: 176, y: 95, label: 'S' },
  { id: 4, x: 160, y: 85, label: 'S' },
  { id: 5, x: 170, y: 92, label: 'S' },
  { id: 6, x: 185, y: 109, label: 'M' },
];
export const FOOD = {
  N: { id: 'N', x: 30, y: 0.2 },
  A: { id: 'A', x: 32, y: 0.36 },
  B: { id: 'B', x: 24, y: 0.21 },
  sugarRange: { min: 0, max: 100 },
};
export const NORMALIZE = { value: 75, min: 0, max: 100 };

// Reiter 6: Regression mit vier Punkten (Zielgröße y) und ausgedachte Hauspreise
export const REGRESSION = {
  training: [
    { id: 'A', x: 0, y: 0, label: 'R' },
    { id: 'B', x: 1, y: 0.5, label: 'R' },
    { id: 'C', x: 2, y: 2, label: 'R' },
    { id: 'D', x: 5, y: 6.5, label: 'R' },
  ],
  x: 3,
};
// Wohnfläche in m² (x) und Preis in Tausend Euro (y); ausgedacht, nicht geprüft
export const HOUSES = [
  { id: 1, x: 70, y: 180, label: 'H' },
  { id: 2, x: 85, y: 210, label: 'H' },
  { id: 3, x: 95, y: 260, label: 'H' },
  { id: 4, x: 110, y: 250, label: 'H' },
  { id: 5, x: 120, y: 300, label: 'H' },
  { id: 6, x: 140, y: 330, label: 'H' },
  { id: 7, x: 160, y: 400, label: 'H' },
  { id: 8, x: 185, y: 430, label: 'H' },
];
export const HOUSE_AREAS = [100, 125, 170];
export const HOUSE_K = [1, 3, 5];

// Erwartete Ergebnisse (nachgerechnet, in tests/task8.test.mjs abgesichert)
export const EXPECTED = {
  outlier: {
    ranking: [16, 3, 11, 6, 4, 14, 7],
    distances: ['3.16', '3.61', '5.39', '6.32', '7.21', '8.25', '10.44'],
    results: {
      1: { label: 'S', counts: { S: 1, M: 0, L: 0 } },
      3: { label: 'M', counts: { S: 1, M: 2, L: 0 } },
      5: { label: 'M', counts: { S: 2, M: 3, L: 0 } },
      7: { label: 'M', counts: { S: 3, M: 4, L: 0 } },
    },
  },
  largeK: {
    A: { small: 'S', k15: 'L' },
    B: { small: 'M', k15: 'L' },
    counts15: { S: 5, M: 4, L: 6 },
  },
  heft: {
    ranking: [1, 3, 4, 2, 5],
    distances: ['0.50', '1.00', '1.58', '1.80', '2.24'],
    results: { 1: 'orange', 3: 'blau', 5: 'blau' },
    cells: { 1: 'falsch', 3: 'korrekt', 5: 'korrekt' },
  },
  validation: {
    table: {
      V1: { 1: 'S', 3: 'S', 5: 'S', 7: 'S' },
      V2: { 1: 'M', 3: 'M', 5: 'M', 7: 'S' },
      V3: { 1: 'L', 3: 'M', 5: 'L', 7: 'M' },
      V4: { 1: 'S', 3: 'S', 5: 'M', 7: 'M' },
      V5: { 1: 'M', 3: 'L', 5: 'L', 7: 'L' },
    },
    sums: { 1: 3, 3: 5, 5: 3, 7: 3 },
    bestK: 3,
  },
  test: {
    computed: { T1: 'S', T2: 'M', T3: 'L', T4: 'S', T5: 'S', T6: 'M', T7: 'M', T8: 'L' },
    matrix: { S: { S: 2, M: 0, L: 0 }, M: { S: 1, M: 2, L: 0 }, L: { S: 0, M: 1, L: 2 } },
    accuracy: { correct: 6, total: 8, percent: 75 },
  },
  uneven: { kTall: 'S', k1Tall: 'M' },
  food: { distanceA: '2,01', distanceB: '6,00', normA: '0,16', normB: '0,06', norm75: 0.75 },
  regression: { k1: 2, k3: 3, k3Ids: ['C', 'B', 'D'], sum: 9, allFour: 2.25, firstThree: 5 / 6 },
  houses: {
    100: { 1: 260, 3: 240, 5: 240 },
    125: { 1: 300, 3: 293.3333333333333, 5: 308 },
    170: { 1: 400, 3: 386.6666666666667, 5: 342 },
  },
};
