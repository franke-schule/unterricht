"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const directory = __dirname;
const engineSource = fs.readFileSync(path.join(directory, "tabellenkalkulation-neu.js"), "utf8");
const instrumentedEngine = engineSource.replace(
  /\n  formulaInput\.addEventListener[\s\S]*\n\}\)\(\);\s*$/,
  `
  window.__spreadsheetTestApi = {
    rawCells,
    fillGroups,
    parseRange,
    translateFormula,
    evaluateCell,
    displayValue,
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
  vm.runInContext(instrumentedEngine, sandbox, { filename: "tabellenkalkulation-neu.js" });
  return sandbox.window.__spreadsheetTestApi;
}

function closeTo(actual, expected) {
  assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} ist nicht nahe bei ${expected}.`);
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

console.log("Tabellenlogik: Formelwert, Formelleiste, Mehrfachquelle und alle Ausfüllmuster sind OK.");
