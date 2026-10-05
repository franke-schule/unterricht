// Aufgabenspezifische Daten für Aufgabe 1 (nur Daten, keine Wortlaute).
import { toBits } from '../logic/binary.mjs';

export const EXAMPLE = 7;
export const ROWS = [18, 27, 100, 200, 50, 10, 250];
export const COUNTER_MAX = 64;
export const SPEEDS = { slow: 1500, medium: 800, fast: 300 };
export const ASCII_WORD = 'Hallo';
export const NON_ASCII = ['ä', '€', '猫', '😀'];

// Ausschnitt der ASCII-Tabelle (nur zur Kontrolle der statischen Tabelle im HTML).
export const ASCII_EXCERPT = [
  { nr: '0–31', char: 'Steuerzeichen (z. B. 10 = Zeilenumbruch)', bits: '–' },
  { nr: '32', char: 'Leerzeichen', bits: '0100000' },
  { nr: '48', char: '0', bits: '0110000' },
  { nr: '57', char: '9', bits: '0111001' },
  { nr: '65', char: 'A', bits: '1000001' },
  { nr: '72', char: 'H', bits: '1001000' },
  { nr: '90', char: 'Z', bits: '1011010' },
  { nr: '97', char: 'a', bits: '1100001' },
  { nr: '108', char: 'l', bits: '1101100' },
  { nr: '111', char: 'o', bits: '1101111' },
  { nr: '122', char: 'z', bits: '1111010' },
  { nr: '127', char: 'Steuerzeichen (DEL)', bits: '1111111' },
];

// Schritte der ASCII-Animation: Zeichen, Nummer und Bitfolge (ab Schritt 6 nicht in ASCII).
export const ASCII_STEPS = [
  { char: 'H', label: 'großes H', number: 72, bits: '01001000' },
  { char: 'a', label: 'kleines a', number: 97, bits: '01100001' },
  { char: 'l', label: 'kleines l', number: 108, bits: '01101100' },
  { char: 'l', label: 'kleines l', number: 108, bits: '01101100' },
  { char: 'o', label: 'kleines o', number: 111, bits: '01101111' },
  { char: 'ä', label: 'a-Umlaut', number: null, bits: null },
  { char: '€', label: 'Eurozeichen', number: null, bits: null },
  { char: '猫', label: 'chinesisches Schriftzeichen für Katze', number: null, bits: null },
  { char: '😀', label: 'Emoji grinsendes Gesicht', number: null, bits: null },
];

// Schritte der Unicode-Animation: Codepunkt (Dezimalwert) und Anzahl der Byte in UTF-8.
export const UNICODE_STEPS = [
  { char: 'H', label: 'großes H', codePoint: 72, bytes: 1 },
  { char: 'ä', label: 'a-Umlaut', codePoint: 228, bytes: 2 },
  { char: '€', label: 'Eurozeichen', codePoint: 8364, bytes: 3 },
  { char: '猫', label: 'chinesisches Schriftzeichen für Katze', codePoint: 29483, bytes: 3 },
  { char: '😀', label: 'Emoji grinsendes Gesicht', codePoint: 128512, bytes: 4 },
  { char: 'A', label: 'großes A', codePoint: 65, bytes: 1 },
];

export const EXPECTED = {
  rows: Object.fromEntries(ROWS.map((value) => [value, toBits(value)])),
  targets: { 5: '00000101', 12: '00001100' },
  max: 255,
  after: '10000',
  inspector: { chars: 7, bytes: 12 },
};
