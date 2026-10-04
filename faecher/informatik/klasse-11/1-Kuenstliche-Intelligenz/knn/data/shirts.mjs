// Trainingsdaten der Schulshirts (Arbeitsheft S. 20): Körpergröße x und Brustumfang y in cm, Shirtgröße als Klasse.
// Nur Daten, damit auch Aufgabe 8 sie ohne Änderung verwenden kann.
export const SHIRT_TRAINING = [
  { id: 1, x: 165, y: 87, label: 'S' },
  { id: 2, x: 190, y: 116, label: 'L' },
  { id: 3, x: 180, y: 102, label: 'M' },
  { id: 4, x: 176, y: 95, label: 'S' },
  { id: 5, x: 160, y: 85, label: 'S' },
  { id: 6, x: 180, y: 105, label: 'M' },
  { id: 7, x: 185, y: 109, label: 'M' },
  { id: 8, x: 186, y: 113, label: 'L' },
  { id: 9, x: 192, y: 125, label: 'L' },
  { id: 10, x: 190, y: 121, label: 'L' },
  { id: 11, x: 177, y: 101, label: 'M' },
  { id: 12, x: 170, y: 92, label: 'S' },
  { id: 13, x: 196, y: 128, label: 'L' },
  { id: 14, x: 174, y: 97, label: 'S' },
  { id: 15, x: 188, y: 117, label: 'L' },
];

export const SHIRT_CLASSES = ['S', 'M', 'L'];

export const SHIRT_FEATURES = { x: 'Körpergröße in cm', y: 'Brustumfang in cm' };

// Symbole, damit die Klasse nie nur über die Farbe erkennbar ist (Kreis, Dreieck, Quadrat).
export const SHIRT_SYMBOLS = { S: '○', M: '△', L: '□' };
