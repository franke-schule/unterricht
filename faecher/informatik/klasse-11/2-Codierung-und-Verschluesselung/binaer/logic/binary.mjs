// Reine Funktionen zu Binärzahlen: Umwandlung, Zählwerk und Prüfung der Eingaben.

export const PLACE_VALUES = [128, 64, 32, 16, 8, 4, 2, 1];

export function toBits(value, width = 8) {
  return value.toString(2).padStart(width, '0');
}

export function bitsToValue(bits) {
  return [...bits].reduce((sum, bit) => sum * 2 + (bit === '1' ? 1 : 0), 0);
}

// Summanden der gesetzten Bits, absteigend (Bitfolge 00010010 -> [16, 2]).
export function termsOf(bits) {
  const width = bits.length;
  return [...bits].map((bit, index) => (bit === '1' ? 2 ** (width - 1 - index) : 0)).filter(Boolean);
}

const reverseBits = (bits) => [...bits].reverse().join('');
const isEmpty = (bits) => !bits.includes('1');

// Höchster gesetzter Stellenwert einer Bitfolge (0, wenn kein Bit gesetzt ist).
export function highestPlace(bits) {
  const terms = termsOf(bits);
  return terms.length ? terms[0] : 0;
}

// Ziffern einer Zahl im angegebenen Zahlensystem, links beginnend. Ungenutzte führende Stellen sind null.
export function digitsOf(value, base, width) {
  const digits = value === 0 ? ['0'] : value.toString(base).split('');
  const used = digits.map(Number);
  return [...Array(Math.max(0, width - used.length)).fill(null), ...used];
}

const digitCount = (value, base) => (value === 0 ? 1 : value.toString(base).length);

// Anzahl der Endstellen mit der höchsten Ziffer (base - 1); sie laufen beim Weiterzählen um 1 über.
export function carryCount(value, base) {
  let count = 0;
  let rest = value;
  while (rest > 0 && rest % base === base - 1) { count += 1; rest = Math.floor(rest / base); }
  return count;
}

// Entsteht beim Weiterzählen von value auf value + 1 eine neue Stelle?
export function gainsPlace(value, base) {
  return digitCount(value + 1, base) > digitCount(value, base);
}

// Prüfung einer Zeile der Umrechnungstabelle (R3). diff ist vorzeichenbehaftet: Wert der Eingabe minus Zielzahl.
export function evaluateRow(target, bits) {
  const solution = toBits(target, bits.length);
  const value = bitsToValue(bits);
  const highest = highestPlace(bits);
  const solutionHighest = highestPlace(solution);
  const result = { value, diff: value - target, highest, solutionHighest };
  if (isEmpty(bits)) return { status: 'empty', ...result };
  if (bits === solution) return { status: 'correct', ...result };
  if (reverseBits(bits) === solution) return { status: 'reversed', ...result };
  if (highest === solutionHighest) return { status: 'partial', ...result };
  return { status: 'incorrect', ...result };
}

// Prüfung der Lampen in R2 (Ziele 5 und 12).
export function evaluateTarget(target, bits) {
  const solution = toBits(target, bits.length);
  const value = bitsToValue(bits);
  const lit = termsOf(bits);
  const solutionTerms = termsOf(solution);
  const result = { value, diff: value - target };
  if (isEmpty(bits)) return { status: 'empty', ...result };
  if (bits === solution) return { status: 'correct', ...result };
  const digitValues = String(target).split('').map(Number);
  if (lit.length === 1 && target <= bits.length && lit[0] === 2 ** (target - 1)) return { status: 'position', ...result };
  if (lit.length === digitValues.length && lit.every((term) => digitValues.includes(term)) && digitValues.every((digit) => lit.includes(digit))) return { status: 'digits', ...result };
  if (lit.every((term) => solutionTerms.includes(term))) return { status: 'partial', ...result };
  return { status: 'incorrect', ...result };
}
