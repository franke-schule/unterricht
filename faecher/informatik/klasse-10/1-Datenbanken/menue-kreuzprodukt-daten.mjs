/** Gemeinsame, fachlich verbindliche Datenquelle für Aufgabe 6. */
export const MENU_TABLES = Object.freeze({
  Vorspeise: Object.freeze([
    Object.freeze({ Name: 'Lauchsuppe', Preis: 1.50 }),
    Object.freeze({ Name: 'Salat', Preis: 2.00 }),
    Object.freeze({ Name: 'Tagessuppe', Preis: 1.00 }),
    Object.freeze({ Name: 'Rohkost', Preis: 1.35 })
  ]),
  Hauptspeise: Object.freeze([
    Object.freeze({ Name: 'Käsespätzle', Preis: 3.50 }),
    Object.freeze({ Name: 'Reispfanne', Preis: 2.50 }),
    Object.freeze({ Name: 'Pizza', Preis: 3.44 })
  ]),
  Nachspeise: Object.freeze([
    Object.freeze({ Name: 'Gemischtes Eis', Preis: 2.50 })
  ])
});

export const MENU_TABLE_NAMES = Object.freeze(Object.keys(MENU_TABLES));

export function buildMenuCombinations(tables = MENU_TABLES) {
  return tables.Vorspeise.flatMap((vorspeise) => tables.Hauptspeise.flatMap((hauptspeise) => tables.Nachspeise.map((nachspeise) => ({
    Vorspeise: vorspeise,
    Hauptspeise: hauptspeise,
    Nachspeise: nachspeise
  }))));
}

export function menuRelation(combinations = buildMenuCombinations()) {
  return {
    columns: ['Vorspeise.Name', 'Vorspeise.Preis', 'Hauptspeise.Name', 'Hauptspeise.Preis', 'Nachspeise.Name', 'Nachspeise.Preis'],
    values: combinations.map(({ Vorspeise, Hauptspeise, Nachspeise }) => [
      Vorspeise.Name, Vorspeise.Preis, Hauptspeise.Name, Hauptspeise.Preis, Nachspeise.Name, Nachspeise.Preis
    ])
  };
}
