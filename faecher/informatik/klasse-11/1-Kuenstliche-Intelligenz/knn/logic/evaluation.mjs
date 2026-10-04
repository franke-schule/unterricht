// Reine Auswertungsfunktionen für Aufgabe 8 ohne DOM: Validierungstabelle, Konfusionsmatrix, Genauigkeit,
// Regression und Normierung. Der KNN-Kern (Abstände, Rangliste, classify) kommt aus knn.mjs.
import { classify, rankNeighbours } from './knn.mjs';

// pairs: Liste { erwartet, berechnet } -> { erwartet: { berechnet: Anzahl } } (Zeilen erwartet, Spalten berechnet)
export function confusionMatrix(pairs, classes) {
  const matrix = Object.fromEntries(classes.map((expected) => [expected, Object.fromEntries(classes.map((computed) => [computed, 0]))]));
  pairs.forEach(({ erwartet, berechnet }) => { matrix[erwartet][berechnet] += 1; });
  return matrix;
}

// Vertauscht Zeilen und Spalten (typischer Fehler: erwartet und berechnet verwechselt).
export function transposeMatrix(matrix, classes) {
  return Object.fromEntries(classes.map((row) => [row, Object.fromEntries(classes.map((column) => [column, matrix[column][row]]))]));
}

// Richtig klassifiziert = Diagonale; Genauigkeit = Diagonale : alle.
export function accuracy(matrix, classes) {
  const correct = classes.reduce((sum, label) => sum + matrix[label][label], 0);
  const total = classes.reduce((sum, row) => sum + classes.reduce((inner, column) => inner + matrix[row][column], 0), 0);
  return { correct, total, value: total ? correct / total : 0 };
}

// points: Liste { id, x, y, truth }; ergibt { rows: [{ id, truth, results: { k: { label, correct } } }], sums: { k: Anzahl richtig } }
export function validationTable(points, data, ks, options = {}) {
  const rows = points.map((point) => ({
    id: point.id,
    truth: point.truth,
    results: Object.fromEntries(ks.map((k) => {
      const { label } = classify(point, data, k, options);
      return [k, { label, correct: label === point.truth }];
    })),
  }));
  const sums = Object.fromEntries(ks.map((k) => [k, rows.filter((row) => row.results[k].correct).length]));
  return { rows, sums };
}

// Regression: Abstand nur in x-Richtung
export function distanceX(a, b) {
  return Math.abs(a.x - b.x);
}

// Mittelwert der Zielwerte (y) der k nächsten Nachbarn
export function regress(point, data, k, metric = distanceX) {
  const neighbours = rankNeighbours(point, data, metric).slice(0, k);
  const value = neighbours.reduce((sum, { item }) => sum + item.y, 0) / neighbours.length;
  return { value, neighbours };
}

// Umrechnung auf den Bereich von 0 bis 1
export function normalize(x, min, max) {
  return (x - min) / (max - min);
}
