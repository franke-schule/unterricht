import assert from 'node:assert/strict';
import { ASCII_EXCERPT, ASCII_STEPS, EXPECTED, ROWS, UNICODE_STEPS } from '../data/task1.mjs';
import { PLACE_VALUES, bitsToValue, carryCount, digitsOf, evaluateRow, evaluateTarget, gainsPlace, termsOf, toBits } from '../logic/binary.mjs';
import { formatCodePoint, inspect, utf8Length } from '../logic/chars.mjs';

// Umwandlung
assert.deepEqual(PLACE_VALUES, [128, 64, 32, 16, 8, 4, 2, 1]);
const SAMPLES = { 7: '00000111', 18: '00010010', 27: '00011011', 100: '01100100', 200: '11001000', 50: '00110010', 10: '00001010', 250: '11111010' };
Object.entries(SAMPLES).forEach(([value, bits]) => {
  assert.equal(toBits(Number(value)), bits, 'toBits ' + value);
  assert.equal(bitsToValue(bits), Number(value), 'bitsToValue ' + bits);
});
for (let value = 0; value <= 255; value++) assert.equal(bitsToValue(toBits(value)), value);
assert.deepEqual(termsOf('00010010'), [16, 2]);
assert.deepEqual(termsOf('00000000'), []);
assert.deepEqual(ROWS, [18, 27, 100, 200, 50, 10, 250]);
ROWS.forEach((value) => assert.equal(EXPECTED.rows[value], SAMPLES[value]));
assert.equal(EXPECTED.targets[5], toBits(5));
assert.equal(EXPECTED.targets[12], toBits(12));
assert.equal(bitsToValue('11111111'), EXPECTED.max);

// Zeilenprüfung (R3)
const row = (target, bits) => evaluateRow(target, bits);
assert.equal(row(18, '00010010').status, 'correct');
assert.equal(row(18, '01001000').status, 'reversed');
const partialHigh = row(18, '00010110');
assert.equal(partialHigh.status, 'partial');
assert.equal(partialHigh.value, 22);
assert.equal(partialHigh.diff, 4);
const partialLow = row(100, '01100000');
assert.equal(partialLow.status, 'partial');
assert.equal(partialLow.diff, -4);
const tooLarge = row(18, '00100000');
assert.equal(tooLarge.status, 'incorrect');
assert.ok(tooLarge.highest > tooLarge.solutionHighest, 'höchstes Bit zu groß');
assert.equal(tooLarge.highest, 32);
const tooSmall = row(100, '00100100');
assert.equal(tooSmall.status, 'incorrect');
assert.ok(tooSmall.highest < tooSmall.solutionHighest, 'höchstes Bit zu klein');
assert.equal(row(18, '00000000').status, 'empty');
// Die Lösung ist nie "reversed", auch bei spiegelsymmetrischen Bitfolgen.
assert.equal(row(129, '10000001').status, 'correct');

// Lampenprüfung (R2)
const bits = (...values) => PLACE_VALUES.map((place) => (values.includes(place) ? '1' : '0')).join('');
assert.equal(evaluateTarget(5, '00000101').status, 'correct');
assert.equal(evaluateTarget(5, bits(16)).status, 'position');
assert.equal(evaluateTarget(12, bits(1, 2)).status, 'digits');
assert.equal(evaluateTarget(12, bits(8)).status, 'partial');
assert.equal(evaluateTarget(5, bits(4, 2)).status, 'incorrect');
assert.equal(evaluateTarget(5, '00000000').status, 'empty');
assert.equal(evaluateTarget(12, bits(8, 4)).status, 'correct');
assert.deepEqual([evaluateTarget(5, bits(4, 2)).value, evaluateTarget(5, bits(4, 2)).diff], [6, 1]);

// Zählwerk
assert.equal(carryCount(3, 2), 2);
assert.equal(carryCount(15, 2), 4);
assert.equal(carryCount(9, 10), 1);
assert.equal(carryCount(0, 2), 0);
assert.equal(carryCount(4, 2), 0);
assert.equal(carryCount(99, 10), 2);
const newPlaceBinary = [];
for (let value = 0; value < 64; value++) if (gainsPlace(value, 2)) newPlaceBinary.push(value);
assert.deepEqual(newPlaceBinary, [1, 3, 7, 15, 31, 63]);
const newPlaceDecimal = [];
for (let value = 0; value < 100; value++) if (gainsPlace(value, 10)) newPlaceDecimal.push(value);
assert.deepEqual(newPlaceDecimal, [9, 99]);
assert.deepEqual(digitsOf(5, 2, 7), [null, null, null, null, 1, 0, 1]);
assert.deepEqual(digitsOf(0, 10, 2), [null, 0]);
assert.deepEqual(digitsOf(64, 2, 7), [1, 0, 0, 0, 0, 0, 0]);

// Zeichen-Inspektor
const grusse = inspect('Grüße 😀');
assert.equal(grusse.length, 7);
assert.deepEqual(grusse.map((entry) => entry.utf8Bytes), [1, 1, 2, 2, 1, 1, 4]);
assert.equal(grusse.reduce((sum, entry) => sum + entry.utf8Bytes, 0), 12);
assert.equal(grusse[5].display, '␣ (Leerzeichen)');
assert.equal(inspect('ü')[0].label, 'U+00FC');
assert.equal(inspect('ü')[0].codePoint, 252);
const single = (char) => inspect(char)[0];
[['ä', 'U+00E4', 228, 2], ['€', 'U+20AC', 8364, 3], ['猫', 'U+732B', 29483, 3], ['😀', 'U+1F600', 128512, 4]].forEach(([char, label, codePoint, bytes]) => {
  const entry = single(char);
  assert.equal(entry.label, label);
  assert.equal(entry.codePoint, codePoint);
  assert.equal(entry.utf8Bytes, bytes);
  assert.equal(entry.inAscii, false);
});
[['H', 72], ['A', 65], ['a', 97]].forEach(([char, codePoint]) => {
  const entry = single(char);
  assert.equal(entry.codePoint, codePoint);
  assert.equal(entry.inAscii, true);
  assert.equal(entry.utf8Bytes, 1);
});
assert.equal(inspect('x'.repeat(30)).length, 20);
assert.equal(inspect('😀'.repeat(15)).length, 15);
assert.equal(inspect('\n')[0].display, 'Steuerzeichen');
assert.equal(inspect('')[0], undefined);
assert.equal(formatCodePoint(0x41), 'U+0041');
assert.equal(formatCodePoint(0x1f600), 'U+1F600');
[[0x7f, 1], [0x80, 2], [0x7ff, 2], [0x800, 3], [0xffff, 3], [0x10000, 4]].forEach(([codePoint, bytes]) => assert.equal(utf8Length(codePoint), bytes, String(codePoint)));

// Daten der Animationen
ASCII_STEPS.forEach((step) => {
  if (step.number === null) { assert.equal(step.bits, null); return; }
  assert.equal(step.bits, toBits(step.number), 'ASCII-Schritt ' + step.char);
  assert.equal(step.number, step.char.codePointAt(0), 'ASCII-Nummer ' + step.char);
});
assert.equal(ASCII_STEPS.slice(0, 5).map((step) => step.char).join(''), 'Hallo');
UNICODE_STEPS.forEach((step) => {
  assert.equal(step.codePoint, step.char.codePointAt(0), 'Codepunkt ' + step.char);
  assert.equal(step.bytes, utf8Length(step.codePoint), 'UTF-8-Länge ' + step.char);
});
ASCII_EXCERPT.forEach((entry) => {
  if (entry.bits === '–') return;
  assert.equal(entry.bits, toBits(Number(entry.nr), 7), 'Tabellenzeile ' + entry.nr);
  if (entry.char.length === 1) assert.equal(entry.char.codePointAt(0), Number(entry.nr), 'Zeichen der Zeile ' + entry.nr);
});

console.log('Logik zu Binärzahlen, Zählwerk, Zeichen und Daten von Aufgabe 1 ist korrekt.');
