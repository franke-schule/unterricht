"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const sandbox = { window: {}, Intl, Date, Math, console };
vm.createContext(sandbox);
for (const file of ["dfd-functions.js", "dfd-editor.js", "dfd-task-checks.js"]) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, file), "utf8"), sandbox, { filename: file });
}
const functions = sandbox.window.DfdFunctions;
const editor = sandbox.window.DfdEditor;
const checks = sandbox.window.DfdTaskChecks;
const fresh = () => functions.createEmptyDocument();
const add = (document, type, extra = {}) => editor.createNode(document, type, 100, 100, extra);
const join = (document, from, to, port = 0) => editor.connect(document, from.id, to.id, port).document;

function operation(id, args, context = {}) {
  let document = fresh();
  const func = add(document, "function", { functionId: id, label: id, inputCount: args.length });
  document = func.document;
  args.forEach(([value, valueType], index) => {
    const literal = add(document, "constant", { value: String(value), valueType });
    document = join(literal.document, literal.node, func.node, index);
  });
  const output = add(document, "output", { label: "Ergebnis" });
  document = join(output.document, func.node, output.node);
  return functions.evaluate(document, {}, context).outputs[0].value;
}

const n = (value) => [String(value), "number"];
const t = (value) => [String(value), "text"];
const b = (value) => [value ? "WAHR" : "FALSCH", "boolean"];
function equalValue(actual, expected) {
  assert.equal(actual.type, expected.type);
  if (expected.type === "number") assert.ok(Math.abs(actual.value - expected.value) < 1e-8, `${actual.value} statt ${expected.value}`);
  else assert.equal(actual.value, expected.value);
}
function expectError(run, pattern) { assert.throws(run, pattern); }

// Der gesamte vom Anbieter aufgelistete Online-Katalog muss ausführbar sein.
const cases = [
  ["ABRUNDEN", [n(-12.34), n(1)], { type: "number", value: -12.3 }],
  ["ABS", [n(-3)], { type: "number", value: 3 }],
  ["ANZAHL", [n(3), t("a")], { type: "number", value: 1 }],
  ["AUFRUNDEN", [n(-12.31), n(1)], { type: "number", value: -12.4 }],
  ["CODE", [t("A")], { type: "number", value: 65 }],
  ["DATUM", [n(2024), n(1), n(1)], { type: "number", value: 45292 }],
  ["FINDEN", [t("b"), t("abc")], { type: "number", value: 2 }],
  ["GANZZAHL", [n(-2.2)], { type: "number", value: -3 }],
  ["GROSS", [t("hallo")], { type: "text", value: "HALLO" }],
  ["HEUTE", [], { type: "number", value: 45292 }],
  ["IDENTITÄT", [t("abc")], { type: "text", value: "abc" }],
  ["JAHR", [n(45292)], { type: "number", value: 2024 }],
  ["JETZT", [], { type: "number", value: 45292.5 }],
  ["KLEIN", [t("HALLO")], { type: "text", value: "hallo" }],
  ["LÄNGE", [t("Haus")], { type: "number", value: 4 }],
  ["LINKS", [t("Haus"), n(2)], { type: "text", value: "Ha" }],
  ["MAX", [n(3), n(8)], { type: "number", value: 8 }],
  ["MIN", [n(3), n(8)], { type: "number", value: 3 }],
  ["MINUTE", [n(45292.5)], { type: "number", value: 0 }],
  ["MITTELWERT", [n(2), n(4)], { type: "number", value: 3 }],
  ["MONAT", [n(45292)], { type: "number", value: 1 }],
  ["NICHT", [b(true)], { type: "boolean", value: false }],
  ["ODER", [b(false), b(true)], { type: "boolean", value: true }],
  ["OBERGRENZE", [n(7), n(5)], { type: "number", value: 10 }],
  ["POTENZ", [n(2), n(3)], { type: "number", value: 8 }],
  ["PRODUKT", [n(2), n(3)], { type: "number", value: 6 }],
  ["QUOTIENT", [n(7), n(2)], { type: "number", value: 3 }],
  ["QUADRIEREN", [n(4)], { type: "number", value: 16 }],
  ["RECHTS", [t("Haus"), n(2)], { type: "text", value: "us" }],
  ["REST", [n(7), n(3)], { type: "number", value: 1 }],
  ["RUNDEN", [n(-1.25), n(1)], { type: "number", value: -1.3 }],
  ["SEKUNDE", [n(45292.5)], { type: "number", value: 0 }],
  ["STUNDE", [n(45292.5)], { type: "number", value: 12 }],
  ["SUMME", [n(2), n(3)], { type: "number", value: 5 }],
  ["TAG", [n(45292)], { type: "number", value: 1 }],
  ["TEIL", [t("Hallo"), n(2), n(3)], { type: "text", value: "all" }],
  ["UND", [b(true), b(false)], { type: "boolean", value: false }],
  ["VERKETTEN", [t("A"), n(2)], { type: "text", value: "A2" }],
  ["VORZEICHEN", [n(-8)], { type: "number", value: -1 }],
  ["WECHSELN", [t("a-b"), t("-"), t("+")], { type: "text", value: "a+b" }],
  ["WENN", [b(true), t("Ja"), t("Nein")], { type: "text", value: "Ja" }],
  ["WOCHENTAG", [n(45292)], { type: "number", value: 2 }],
  ["WURZEL", [n(9)], { type: "number", value: 3 }],
  ["ZEICHEN", [n(65)], { type: "text", value: "A" }],
  ["ZEIT", [n(12), n(0), n(0)], { type: "number", value: 0.5 }],
  ["ZUFALLSZAHL", [], { type: "number", value: 0.25 }]
];
for (const [id, args, expected] of cases) {
  const context = { now: new Date(2024, 0, 1, 12), random: () => 0.25 };
  equalValue(operation(id, args, context), expected);
}
assert.deepEqual(new Set(cases.map(([id]) => id)), new Set(functions.listFunctions().filter((item) => item.group !== "Operatoren").map((item) => item.id)));

for (const [id, args, expected] of [
  ["+", [n(2), n(3)], 5], ["-", [n(2), n(3)], -1], ["*", [n(2), n(3)], 6],
  ["/", [n(6), n(3)], 2], ["^", [n(2), n(3)], 8]
]) equalValue(operation(id, args), { type: "number", value: expected });
for (const [id, expected] of [["=", false], ["<>", true], ["<", true], ["<=", true], [">", false], [">=", false]]) {
  equalValue(operation(id, [n(2), n(3)]), { type: "boolean", value: expected });
}
equalValue(functions.parseLiteral("0,5", "number"), { type: "number", value: 0.5 });
equalValue(functions.parseLiteral("50%", "number"), { type: "number", value: 0.5 });
equalValue(functions.parseLiteral("  a  ", "text"), { type: "text", value: "  a  " });
equalValue(functions.parseLiteral("", "text"), { type: "text", value: "" });
equalValue(functions.parseLiteral('""'), { type: "text", value: "" });
equalValue(operation("LÄNGE", [t("  a  ")]), { type: "number", value: 5 });
equalValue(operation("WECHSELN", [t("a-b"), t("-"), t("")]), { type: "text", value: "ab" });
expectError(() => functions.parseLiteral("x", "number"), /gültige Zahl/);
expectError(() => operation("/", [n(3), n(0)]), /Division durch null/);
expectError(() => operation("WURZEL", [n(-1)]), /negativen Zahl/);
expectError(() => operation("+", [n(2), t("x")]), /muss eine Zahl/);

function spendenlauf({ half = "0,5", reverse = false, distributor = true } = {}) {
  let document = fresh();
  const nodes = {};
  for (const [key, type, extra] of [
    ["s", "input", { label: "Erlaufene Summe (S)" }], ["u", "input", { label: "Unkosten (U)" }],
    ["split", "splitter", {}], ["half", "constant", { value: half, valueType: "number" }],
    ["minus", "function", { functionId: "-", label: "minus", inputCount: 2 }],
    ["times", "function", { functionId: "*", label: "mal", inputCount: 2 }],
    ["plus", "function", { functionId: "+", label: "plus", inputCount: 2 }],
    ["out", "output", { label: "Gespendete Gesamtsumme" }]
  ]) { const result = add(document, type, extra); document = result.document; nodes[key] = result.node; }
  if (distributor) document = join(document, nodes.s, nodes.split);
  document = join(document, distributor ? nodes.split : nodes.s, nodes.minus, reverse ? 1 : 0);
  document = join(document, nodes.u, nodes.minus, reverse ? 0 : 1);
  document = join(document, nodes.split, nodes.times, 0);
  document = join(document, nodes.half, nodes.times, 1);
  document = join(document, nodes.minus, nodes.plus, 1);
  document = join(document, nodes.times, nodes.plus, 0);
  document = join(document, nodes.plus, nodes.out);
  return { document, nodes };
}
const donation = spendenlauf();
assert.equal(checks.check("spendenlauf", donation.document).level, "high");
assert.equal(functions.evaluate(donation.document, { [donation.nodes.s.id]: 100, [donation.nodes.u.id]: 20 }).outputs[0].value.value, 130);
assert.equal(checks.check("spendenlauf", spendenlauf({ reverse: true }).document).level, "medium");
assert.equal(checks.check("spendenlauf", spendenlauf({ half: "0,05" }).document).level, "medium");
assert.equal(checks.check("spendenlauf", fresh()).level, "low");

function gewinnspiel({ comparison = ">", yes = "10€", no = "0€" } = {}) {
  let document = fresh(); const nodes = {};
  for (const [key, type, extra] of [
    ["lot", "input", { label: "Losnummer" }], ["limit", "constant", { value: "70", valueType: "number" }],
    ["yes", "constant", { value: yes, valueType: "text" }], ["no", "constant", { value: no, valueType: "text" }],
    ["compare", "function", { functionId: comparison, label: comparison, inputCount: 2 }],
    ["when", "function", { functionId: "WENN", label: "WENN", inputCount: 3 }],
    ["out", "output", { label: "Losgewinn" }]
  ]) { const result = add(document, type, extra); document = result.document; nodes[key] = result.node; }
  document = join(document, nodes.lot, nodes.compare, 0);
  document = join(document, nodes.limit, nodes.compare, 1);
  document = join(document, nodes.compare, nodes.when, 0);
  document = join(document, nodes.yes, nodes.when, 1);
  document = join(document, nodes.no, nodes.when, 2);
  document = join(document, nodes.when, nodes.out);
  return { document, nodes };
}
const lottery = gewinnspiel();
assert.equal(checks.check("gewinnspiel", lottery.document).level, "high");
assert.equal(checks.check("gewinnspiel", gewinnspiel({ comparison: ">=" }).document).level, "medium");
assert.equal(checks.check("gewinnspiel", gewinnspiel({ yes: "0€", no: "10€" }).document).level, "medium");
for (const [lot, expected] of [[69, "0€"], [70, "0€"], [71, "10€"]]) {
  assert.equal(functions.evaluate(lottery.document, { [lottery.nodes.lot.id]: lot }).outputs[0].value.value, expected);
}

// WENN wertet den nicht gewählten Zweig nicht aus.
let lazy = fresh();
const condition = add(lazy, "constant", { value: "WAHR", valueType: "boolean" }); lazy = condition.document;
const yes = add(lazy, "constant", { value: "1", valueType: "number" }); lazy = yes.document;
const zero = add(lazy, "constant", { value: "0", valueType: "number" }); lazy = zero.document;
const divide = add(lazy, "function", { functionId: "/", inputCount: 2 }); lazy = divide.document;
const when = add(lazy, "function", { functionId: "WENN", inputCount: 3 }); lazy = when.document;
const out = add(lazy, "output"); lazy = out.document;
lazy = join(lazy, condition.node, when.node, 0);
lazy = join(lazy, yes.node, when.node, 1);
lazy = join(lazy, zero.node, divide.node, 0);
const zero2 = add(lazy, "constant", { value: "0", valueType: "number" }); lazy = zero2.document;
lazy = join(lazy, zero2.node, divide.node, 1);
lazy = join(lazy, divide.node, when.node, 2);
lazy = join(lazy, when.node, out.node);
assert.equal(functions.evaluate(lazy).outputs[0].value.value, 1);

const missing = structuredClone(lottery.document);
missing.edges = missing.edges.filter((edge) => !(edge.to === lottery.nodes.when.id && edge.port === 1));
expectError(() => functions.evaluate(missing, { [lottery.nodes.lot.id]: 71 }), /fehlt Eingang 2/);
const cycle = structuredClone(lottery.document);
cycle.edges.push({ id: "ecycle", from: lottery.nodes.when.id, to: lottery.nodes.compare.id, port: 0 });
expectError(() => functions.evaluate(cycle, { [lottery.nodes.lot.id]: 71 }), /mehrfach verbunden|Kreis/);
let isolatedCycle = fresh();
const cycleA = add(isolatedCycle, "function", { functionId: "IDENTITÄT", inputCount: 1 }); isolatedCycle = cycleA.document;
const cycleB = add(isolatedCycle, "function", { functionId: "IDENTITÄT", inputCount: 1 }); isolatedCycle = cycleB.document;
isolatedCycle.edges.push({ id: "e1", from: cycleA.node.id, to: cycleB.node.id, port: 0 });
isolatedCycle.edges.push({ id: "e2", from: cycleB.node.id, to: cycleA.node.id, port: 0 });
assert.equal(functions.validateDocument(isolatedCycle).valid, true);
expectError(() => functions.evaluate(isolatedCycle), /Kreis/);
const duplicate = structuredClone(lottery.document);
duplicate.nodes.push(structuredClone(duplicate.nodes[0]));
assert.equal(functions.validateDocument(duplicate).valid, false);
expectError(() => join(donation.document, donation.nodes.s, donation.nodes.plus, 0), /Verteiler|bereits belegt/);

console.log(`DFD-Tests bestanden: ${cases.length} Online-Funktionen, 11 Operatoren, Graphmodell und beide Aufgabenprüfungen.`);

// Temporäre Browser-Vorschau ohne zusätzliche Datei: node dfd-editor.test.js --serve
if (process.argv.includes("--serve")) {
  const http = require("node:http");
  const files = new Map([
    ["/styles.css", path.resolve(__dirname, "../../../../styles.css")],
    ...["tabellenkalkulation.css", "dfd-editor.css", "dfd-functions.js", "dfd-editor.js", "dfd-task-checks.js"]
      .map((name) => [`/${name}`, path.join(__dirname, name)])
  ]);
  const html = `<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>DFD Editor Test</title>
    <link rel="stylesheet" href="/styles.css"><link rel="stylesheet" href="/tabellenkalkulation.css"><link rel="stylesheet" href="/dfd-editor.css">
    <main class="page-shell spreadsheet-new-page"><h1>Aufgabe 5a</h1><div class="tool-embed" id="editor"></div></main>
    <script src="/dfd-functions.js"></script><script src="/dfd-editor.js"></script><script src="/dfd-task-checks.js"></script>
    <script>window.testEditor = DfdEditor.mount(document.getElementById("editor"), {storageKey:"dfd-browser-test-v1"});</script></html>`;
  http.createServer((request, response) => {
    if (request.url === "/__dfd-test") {
      response.writeHead(200, { "content-type": "text/html; charset=utf-8" }); response.end(html); return;
    }
    const file = files.get(request.url);
    if (!file) { response.writeHead(404); response.end(); return; }
    response.writeHead(200, { "content-type": file.endsWith(".css") ? "text/css; charset=utf-8" : "text/javascript; charset=utf-8" });
    fs.createReadStream(file).pipe(response);
  }).listen(8766, "127.0.0.1", () => console.log("DFD-Vorschau: http://127.0.0.1:8766/__dfd-test"));
}
