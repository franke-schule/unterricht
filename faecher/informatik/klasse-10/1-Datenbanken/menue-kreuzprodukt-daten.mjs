/** Gemeinsame, fachlich verbindliche Datenquelle für Aufgabe 6. */
export const MENU_TABLES = Object.freeze({
  Vorspeise: Object.freeze([
    Object.freeze({ name: 'Lauchsuppe', preis: 1.50 }),
    Object.freeze({ name: 'Salat', preis: 2.00 }),
    Object.freeze({ name: 'Tagessuppe', preis: 1.00 }),
    Object.freeze({ name: 'Rohkost', preis: 1.35 })
  ]),
  Hauptspeise: Object.freeze([
    Object.freeze({ name: 'Käsespätzle', preis: 3.50 }),
    Object.freeze({ name: 'Reispfanne', preis: 2.50 }),
    Object.freeze({ name: 'Pizza', preis: 3.44 })
  ]),
  Nachspeise: Object.freeze([
    Object.freeze({ name: 'Gemischtes Eis', preis: 2.50 })
  ])
});

export const MENU_TABLE_NAMES = Object.freeze(Object.keys(MENU_TABLES));
export const MENU_QUIZ = Object.freeze([
  { id: 'combinations', prompt: 'Was gilt für die möglichen Menükombinationen?', hint: 'Überlege, wie oft jede Vorspeise mit den anderen Gängen kombiniert werden kann.', options: [
    { id: 'each', text: 'Jede Vorspeise wird mit jeder Hauptspeise und jeder Nachspeise kombiniert.', correct: true },
    { id: 'twelve', text: 'Bei 4 Vorspeisen, 3 Hauptspeisen und 1 Nachspeise entstehen 12 Menüs.', correct: true },
    { id: 'add', text: 'Die Anzahl der Menüs erhält man durch Addition: 4 + 3 + 1.', correct: false },
    { id: 'fixed', text: 'Jede Vorspeise darf nur mit einer bestimmten Hauptspeise kombiniert werden.', correct: false }
  ] },
  { id: 'clauses', prompt: 'Welche Aussagen zu SELECT, FROM und WHERE stimmen?', hint: 'Unterscheide die ausgegebenen Spalten, die verwendeten Tabellen und die Auswahl der Zeilen.', options: [
    { id: 'select', text: 'SELECT bestimmt, welche Spalten ausgegeben werden.', correct: true },
    { id: 'from', text: 'FROM Vorspeise, Hauptspeise, Nachspeise bildet zunächst alle Kombinationen der drei Tabellen.', correct: true },
    { id: 'where', text: 'WHERE wählt aus diesen Kombinationen die Zeilen aus, die zur Bedingung passen.', correct: true },
    { id: 'adds', text: 'WHERE fügt neue Menükombinationen hinzu.', correct: false }
  ] },
  { id: 'pizza', prompt: "Was gilt für die Abfrage mit WHERE Hauptspeise.name = 'Pizza'?", hint: 'Die Hauptspeise steht fest. Überlege, welche Vorspeisen und Nachspeisen weiterhin damit kombiniert werden.', options: [
    { id: 'allPizza', text: 'Alle ausgegebenen Menüs enthalten Pizza als Hauptspeise.', correct: true },
    { id: 'four', text: 'Die Abfrage liefert mit den vorhandenen Tabellen vier Menüs.', correct: true },
    { id: 'change', text: 'Die Abfrage verändert den Namen einer Hauptspeise in der Ausgangstabelle.', correct: false },
    { id: 'one', text: 'Die Abfrage liefert nur eine Zeile, weil Pizza nur einmal in Hauptspeise steht.', correct: false }
  ] }
]);
export const MENU_TABLE_SCHEMAS = Object.freeze([
  Object.freeze({ table: 'Vorspeise', columns: Object.freeze([['name', 'varchar(255)'], ['preis', 'real']]) }),
  Object.freeze({ table: 'Hauptspeise', columns: Object.freeze([['name', 'varchar(255)'], ['preis', 'real']]) }),
  Object.freeze({ table: 'Nachspeise', columns: Object.freeze([['name', 'varchar(255)'], ['preis', 'real']]) })
]);

export function buildMenuCombinations(tables = MENU_TABLES) {
  return tables.Vorspeise.flatMap((vorspeise) => tables.Hauptspeise.flatMap((hauptspeise) => tables.Nachspeise.map((nachspeise) => ({
    Vorspeise: vorspeise,
    Hauptspeise: hauptspeise,
    Nachspeise: nachspeise
  }))));
}

export function menuRelation(combinations = buildMenuCombinations()) {
  return {
    columns: ['Vorspeise.name', 'Vorspeise.preis', 'Hauptspeise.name', 'Hauptspeise.preis', 'Nachspeise.name', 'Nachspeise.preis'],
    values: combinations.map(({ Vorspeise, Hauptspeise, Nachspeise }) => [
      Vorspeise.name, Vorspeise.preis, Hauptspeise.name, Hauptspeise.preis, Nachspeise.name, Nachspeise.preis
    ])
  };
}
