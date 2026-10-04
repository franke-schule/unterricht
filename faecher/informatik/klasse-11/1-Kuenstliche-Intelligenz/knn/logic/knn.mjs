// Reine Logik des k-nächste-Nachbarn-Algorithmus ohne DOM (wiederverwendbar für Aufgabe 8).
import { normaliseNumber } from '../../perzeptron/logic/perceptron.mjs';

const EPSILON = 1e-9;

export function euclidean(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

export function manhattan(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

// Sortierte Liste { item, distance }. Bei gleichem Abstand gilt die Datenreihenfolge (stabil).
export function rankNeighbours(point, data, metric = euclidean) {
  return data
    .map((item, index) => ({ item, index, distance: metric(point, item) }))
    .sort((a, b) => (Math.abs(a.distance - b.distance) > EPSILON ? a.distance - b.distance : a.index - b.index))
    .map(({ item, distance }) => ({ item, distance }));
}

export function countLabels(neighbours, classes) {
  const counts = Object.fromEntries(classes.map((label) => [label, 0]));
  neighbours.forEach(({ item }) => { if (item.label in counts) counts[item.label] += 1; });
  return counts;
}

// Gleichstandsregel: Haben mehrere Klassen die Höchstzahl, gewinnt unter diesen Klassen diejenige
// des nächstgelegenen Nachbarn (tie = true). k ist eine beliebige positive ganze Zahl <= Datenanzahl;
// „nur ungerade“ setzt die Oberfläche durch, nicht diese Funktion.
export function classify(point, data, k, { metric = euclidean, classes = ['S', 'M', 'L'] } = {}) {
  if (!Number.isInteger(k) || k < 1 || k > data.length) throw new RangeError('k muss eine ganze Zahl von 1 bis ' + data.length + ' sein.');
  const neighbours = rankNeighbours(point, data, metric).slice(0, k);
  const counts = countLabels(neighbours, classes);
  const best = Math.max(...Object.values(counts));
  const winners = classes.filter((label) => counts[label] === best);
  const tie = winners.length > 1;
  const label = tie ? neighbours.find(({ item }) => winners.includes(item.label)).item.label : winners[0];
  return { label, counts, neighbours, tie };
}

// Deutsches Dezimalkomma, z. B. 4,47 oder 10,00.
export function formatDecimal(value, digits = 2) {
  return value.toFixed(digits).replace('.', ',');
}

// 'correct': Eingabe stimmt auf die Rundung (|Eingabe - exakt| <= tol), also korrekt gerundet oder genauer.
// 'near': Eingabe liegt knapp darunter (um höchstens 0,01), typischer Fehler „abgeschnitten statt gerundet“.
// 'wrong': alles andere; 'invalid': keine Zahl.
export function withinTolerance(input, expected, tol = 0.005) {
  const parsed = normaliseNumber(input);
  if (parsed === null) return 'invalid';
  const difference = expected - parsed;
  if (Math.abs(difference) <= tol + EPSILON) return 'correct';
  if (difference > 0 && difference <= 0.01 + EPSILON) return 'near';
  return 'wrong';
}
