"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const directory = __dirname;
const engineSource = fs.readFileSync(path.join(directory, "tabellenkalkulation.js"), "utf8");
const instrumentedEngine = engineSource.replace(
  /\n  formulaInput\.addEventListener[\s\S]*\n\}\)\(\);\s*$/,
  `
  window.__spreadsheetTestApi = {
    config,
    rawCells,
    formulaDefinitions,
    fillGroups,
    parseRange,
    translateFormula,
    evaluateCell,
    displayValue,
    analyzeFormula,
    fillSelection,
    fillGroupIsComplete
  };
})();`
);

assert.notEqual(instrumentedEngine, engineSource, "Testinstrumentierung konnte nicht eingesetzt werden.");

function loadTask(fileName) {
  const html = fs.readFileSync(path.join(directory, fileName), "utf8");
  const inlineScript = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
  assert.ok(inlineScript, `${fileName}: Konfiguration fehlt.`);
  const sandbox = {
    window: {},
    document: { getElementById: () => ({}) },
    console,
    Intl
  };
  vm.createContext(sandbox);
  vm.runInContext(inlineScript, sandbox, { filename: fileName });
  vm.runInContext(instrumentedEngine, sandbox, { filename: "tabellenkalkulation.js" });
  return sandbox.window.__spreadsheetTestApi;
}

function closeTo(actual, expected) {
  assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} ist nicht nahe bei ${expected}.`);
}

function verifyDefinitions(api, formulas) {
  api.formulaDefinitions.forEach((definition) => {
    const analysis = api.analyzeFormula(formulas[definition.cell], definition);
    assert.deepEqual(Array.from(analysis.missingRefs), [], `${definition.cell}: benötigte Zellbezüge fehlen.`);
    assert.equal(analysis.missingReferenceRules.length, 0, `${definition.cell}: Fixierung eines Zellbezugs fehlt.`);
    assert.equal(analysis.missingFunctionRules.length, 0, `${definition.cell}: geforderte Funktion fehlt.`);
    assert.deepEqual(Array.from(analysis.forbiddenNumbers), [], `${definition.cell}: unerlaubte Zahl in der Formel.`);
  });
  for (const testCase of api.config.testCases || []) {
    const savedCells = new Map(api.rawCells);
    api.config.applyTestCase?.(api.rawCells, testCase);
    api.formulaDefinitions.forEach((definition) => {
      definition.prepare?.({ cells: api.rawCells, testCase });
      const actual = api.evaluateCell(definition.cell);
      const expected = definition.expected(testCase);
      if (typeof expected === "number") closeTo(actual, expected);
      else assert.equal(String(actual).toLowerCase(), String(expected).toLowerCase());
    });
    api.rawCells.clear();
    savedCells.forEach((value, key) => api.rawCells.set(key, value));
  }
}

{
  const api = loadTask("aufgabe1.html");
  api.rawCells.set("F5", "=B4*B5");
  assert.equal(api.rawCells.get("F5"), "=B4*B5");
  assert.equal(api.evaluateCell("F5"), 12);
  assert.equal(api.displayValue("F5"), "12");

  api.rawCells.set("A15", 1);
  api.rawCells.set("A16", 2);
  api.fillSelection(api.parseRange("A15:A16"), api.parseRange("A15:A17"));
  assert.equal(api.rawCells.get("A17"), 3, "Zahlenreihe aus mehreren Ausgangszellen wird fortgesetzt.");
}

{
  const api = loadTask("aufgabe2a.html");
  api.rawCells.set("E2", "=D2*(1+$D$8)");
  api.rawCells.set("F2", "=B2*E2");
  api.fillSelection(api.parseRange("E2:F2"), api.parseRange("E2:F6"));
  assert.equal(api.rawCells.get("E3"), "=D3*(1+$D$8)");
  assert.equal(api.rawCells.get("F6"), "=B6*E6");
  closeTo(api.evaluateCell("F6"), 8 * 0.9 * 1.19);
  assert.equal(api.fillGroupIsComplete(api.fillGroups[0]), true);
  api.rawCells.set("F10", "=SUMME(F2:F6)");
  closeTo(api.evaluateCell("F10"), 2 * 1.2 * 1.19 + 1 * 12.95 * 1.19 + 5 * 2.9 * 1.19 + 1 * 2.79 * 1.19 + 8 * 0.9 * 1.19);
}

{
  const api = loadTask("aufgabe2b.html");
  const wageDefinition = api.formulaDefinitions.find(({ cell }) => cell === "D6");
  const relativeReference = api.analyzeFormula("=C6*C3", wageDefinition);
  assert.equal(relativeReference.missingReferenceRules[0].message, "Der Stundenlohn muss fest bleiben. Verwende $C$3.");
  const wrongReference = api.analyzeFormula("=C7*$C$3", wageDefinition);
  assert.deepEqual(Array.from(wrongReference.missingRefs), ["C6"]);
  api.rawCells.set("D6", "=C6*$C$3");
  api.fillSelection(api.parseRange("D6"), api.parseRange("D6:D13"));
  assert.equal(api.rawCells.get("D13"), "=C13*$C$3");
  closeTo(api.evaluateCell("D13"), 12.5 * 9.35);
  assert.equal(api.fillGroupIsComplete(api.fillGroups[0]), true);
}

{
  const api = loadTask("aufgabe2c.html");
  api.rawCells.set("B9", "=B7+B8");
  api.fillSelection(api.parseRange("B9"), api.parseRange("B9:B37"));
  assert.equal(api.rawCells.get("B10"), "=B8+B9");
  assert.equal(api.evaluateCell("B10"), 2);
  assert.equal(api.fillGroupIsComplete(api.fillGroups[0]), true);
}

{
  const api = loadTask("aufgabe2d.html");
  api.rawCells.set("B2", "=$A2*B$1");
  api.fillSelection(api.parseRange("B2"), api.parseRange("B2:K11"));
  assert.equal(api.rawCells.get("K11"), "=$A11*K$1");
  assert.equal(api.evaluateCell("K11"), 100);
  assert.equal(api.fillGroupIsComplete(api.fillGroups[0]), true);
}

{
  const api = loadTask("aufgabe3.html");
  const formulas = {
    F9: "=SUMME(F5:F8)", F10: "=MITTELWERT(F5:F8)", F11: "=RUNDEN(F10;1)",
    F12: "=ABRUNDEN(F10;1)", F13: "=AUFRUNDEN(F10;-1)", F14: "=MAX(F5:F8)", F15: "=MIN(F5:F8)",
    F25: "=ANZAHL2(F18:F24)", F26: "=ANZAHLLEEREZELLEN(F18:F24)",
    C36: "=SUMME(C5:C35)", C37: "=MAX(C5:C35)", C38: "=MIN(C5:C35)", C39: "=MITTELWERT(C5:C35)",
    C40: "=RUNDEN(C39;1)", C41: "=RUNDEN(C39;3)", C42: "=RUNDEN(C39;-1)", C43: "=AUFRUNDEN(C39;-1)",
    C44: "=ABRUNDEN(C39;-2)", C45: "=RUNDEN(C39;-3)", C46: "=ABRUNDEN(C39;-3)",
    C47: "=ANZAHLLEEREZELLEN(C5:C35)", C48: "=ANZAHL(C5:C35)", C49: "=ANZAHL(A5:A35)", C50: "=C36/C49",
    F37: "=ANZAHL(F30:F36)", F38: "=ANZAHL2(F30:F36)", F39: '=ZÄHLENWENN(F30:F36;"Urlaub")'
  };
  Object.entries(formulas).forEach(([cell, formula]) => api.rawCells.set(cell, formula));
  const testData = {
    quantities: [5, 6, 7, 8].map((row) => api.rawCells.get(`F${row}`)),
    sales: Array.from({ length: 31 }, (_, index) => api.rawCells.get(`C${index + 5}`) ?? ""),
    schedule: Array.from({ length: 7 }, (_, index) => api.rawCells.get(`F${index + 18}`) ?? ""),
    hours: Array.from({ length: 7 }, (_, index) => api.rawCells.get(`F${index + 30}`) ?? "")
  };
  api.formulaDefinitions.forEach((definition) => {
    try {
      closeTo(api.evaluateCell(definition.cell), definition.expected(testData));
    } catch (error) {
      assert.fail(`${definition.cell} (${formulas[definition.cell]}): ${error.message}`);
    }
  });
  assert.equal(api.evaluateCell("F25"), 5);
  assert.equal(api.evaluateCell("F26"), 2);
  assert.equal(api.evaluateCell("F39"), 2);
  verifyDefinitions(api, formulas);
}

{
  const api = loadTask("aufgabe4.html");
  api.rawCells.set("D5", "=WENN(B5<2;5;0)");
  const formulas = { D5: "=WENN(B5<2;5;0)" };
  api.fillSelection(api.parseRange("D5"), api.parseRange("D5:D8"));
  assert.equal(api.rawCells.get("D8"), "=WENN(B8<2;5;0)");
  assert.equal(api.evaluateCell("D5"), 0);
  api.rawCells.set("B5", 1);
  assert.equal(api.evaluateCell("D5"), 5);
  assert.equal(api.fillGroupIsComplete(api.fillGroups[0]), true);
  verifyDefinitions(api, formulas);
}

{
  const api = loadTask("aufgabe4a.html");
  api.rawCells.set("B11", "=WENN(B10>C10;B10-C10;B10)");
  api.rawCells.set("C11", "=WENN(C10>B10;C10-B10;C10)");
  const formulas = { B11: "=WENN(B10>C10;B10-C10;B10)", C11: "=WENN(C10>B10;C10-B10;C10)" };
  api.fillSelection(api.parseRange("B11:C11"), api.parseRange("B11:C83"));
  assert.equal(api.rawCells.get("B12"), "=WENN(B11>C11;B11-C11;B11)");
  assert.equal(api.evaluateCell("B14"), 8);
  assert.equal(api.evaluateCell("C14"), 8);
  assert.equal(api.fillGroupIsComplete(api.fillGroups[0]), true);
  verifyDefinitions(api, formulas);
}

{
  const api = loadTask("aufgabe4b.html");
  api.rawCells.set("D5", "=WENN(C5>=1000;C5*50%;WENN(C5>=500;C5*70%;C5))");
  api.rawCells.set("F5", '=WENN(E5="ja";D5*97%;D5)');
  const formulas = { D5: "=WENN(C5>=1000;C5*50%;WENN(C5>=500;C5*70%;C5))", F5: '=WENN(E5="ja";D5*97%;D5)' };
  api.fillSelection(api.parseRange("D5"), api.parseRange("D5:D34"));
  api.fillSelection(api.parseRange("F5"), api.parseRange("F5:F34"));
  closeTo(api.evaluateCell("F5"), 926.44 * 0.7 * 0.97);
  api.rawCells.set("C5", 500);
  closeTo(api.evaluateCell("D5"), 350);
  assert.equal(api.fillGroupIsComplete(api.fillGroups[0]), true);
  assert.equal(api.fillGroupIsComplete(api.fillGroups[1]), true);
  const discountDefinition = api.formulaDefinitions.find(({ cell }) => cell === "D5");
  assert.equal(api.analyzeFormula("=WENN(C5>=500;C5*70%;C5)", discountDefinition).missingFunctionRules.length, 1);
  verifyDefinitions(api, formulas);
}

{
  const api = loadTask("aufgabe4c.html");
  api.rawCells.set("D8", "=C8*100");
  api.rawCells.set("E8", "=B8*D8*$H$5");
  api.fillSelection(api.parseRange("D8:E8"), api.parseRange("D8:E11"));
  api.rawCells.set("E13", "=SUMME(E8:E11)");
  api.rawCells.set("E15", '=E13/(H8*WENN(G8="m";I15;I16))');
  api.rawCells.set("E19", '=WENN(E15-E17*WENN(G8="m";I20;I19)<0;0;E15-E17*WENN(G8="m";I20;I19))');
  const formulas = {
    D8: "=C8*100",
    E8: "=B8*D8*$H$5",
    E13: "=SUMME(E8:E11)",
    E15: '=E13/(H8*WENN(G8="m";I15;I16))',
    E19: '=WENN(E15-E17*WENN(G8="m";I20;I19)<0;0;E15-E17*WENN(G8="m";I20;I19))'
  };
  closeTo(api.evaluateCell("D8"), 200);
  closeTo(api.evaluateCell("E13"), 78.93);
  closeTo(api.evaluateCell("E15"), 2.631);
  closeTo(api.evaluateCell("E19"), 1.331);
  assert.equal(api.fillGroupIsComplete(api.fillGroups[0]), true);
  verifyDefinitions(api, formulas);
}

console.log("Tabellenlogik: Formeln, Funktionen, WENN-Entscheidungen und alle Ausfüllmuster sind OK.");
