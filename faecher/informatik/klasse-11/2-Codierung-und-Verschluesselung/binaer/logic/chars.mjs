// Reine Funktionen zum Zeichen-Inspektor: Codepunkte, ASCII-Zugehörigkeit und UTF-8-Länge.

export const MAX_INSPECTED = 20;

// 'U+' und Hexadezimalzahl in Großbuchstaben, mindestens vier Stellen.
export function formatCodePoint(codePoint) {
  return 'U+' + codePoint.toString(16).toUpperCase().padStart(4, '0');
}

// Anzahl der Byte in UTF-8.
export function utf8Length(codePoint) {
  if (codePoint < 0x80) return 1;
  if (codePoint < 0x800) return 2;
  if (codePoint < 0x10000) return 3;
  return 4;
}

function displayOf(char, codePoint) {
  if (char === ' ') return '␣ (Leerzeichen)';
  if (codePoint < 32 || codePoint === 127) return 'Steuerzeichen';
  return char;
}

// Iteriert über Codepunkte (nicht über UTF-16-Einheiten), höchstens MAX_INSPECTED Einträge.
export function inspect(text) {
  return Array.from(text).slice(0, MAX_INSPECTED).map((char) => {
    const codePoint = char.codePointAt(0);
    return { char, display: displayOf(char, codePoint), codePoint, label: formatCodePoint(codePoint), inAscii: codePoint < 128, utf8Bytes: utf8Length(codePoint) };
  });
}
