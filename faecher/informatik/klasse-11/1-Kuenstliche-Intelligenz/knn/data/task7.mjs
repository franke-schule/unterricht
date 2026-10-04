// Aufgabenspezifische Konstanten für Aufgabe 7 (nur Daten).
export const N1 = { x: 183, y: 106 };
export const N2 = { x: 186, y: 110 };
export const N5 = { x: 178, y: 98 };

// Reiter 3: Paar N–A (Nr. 3) und N–B (Nr. 7), jeweils im Schulshirt-Kontext mit N = N1
export const PAIR_A = { id: 3, x: 180, y: 102 };
export const PAIR_B = { id: 7, x: 185, y: 109 };

// Reiter 4: Stadtplan und Vergleich
export const STOP_H = { x: 1, y: 1 };
export const STOP_K = { x: 6, y: 4 };
export const COMPARE_P = { x: 0, y: 0 };
export const COMPARE_A = { x: 3, y: 3 };
export const COMPARE_B = { x: 5, y: 0 };

// Reiter 5: Zeilen mit Eingabefeld statt Abstand
export const BLANK_IDS = [3, 6];

// Quiz
export const QUIZ_A = { x: 2, y: 1 };
export const QUIZ_B = { x: 8, y: 9 };

export const EXPECTED = {
  discoverSize: 'M',
  neighbours: { k1: 'M', k5: 'L' },
  euclid: { a: 5, b: Math.sqrt(13) },
  manhattan: 8,
  compare: { eA: Math.sqrt(18), mA: 6, eB: 5, mB: 5 },
  apply: { d3: Math.sqrt(20), d6: Math.sqrt(53), neighbourIds: [11, 4, 14, 3, 6], size: 'M' },
  quiz: { euclidean: 10, manhattan: 14 },
};
