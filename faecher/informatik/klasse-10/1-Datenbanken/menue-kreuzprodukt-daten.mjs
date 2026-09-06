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
