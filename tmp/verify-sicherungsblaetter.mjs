import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { PDFDocument } = require("./pdftools/node_modules/pdf-lib");
const base = "faecher/informatik/klasse-9/1-Tabellenkalkulation";
const cases = [
  { html: "aufgabe1.html", pdf: "sicherungsblatt-aufgabe-1-loesungen.pdf", code: "M7QK-4P2X" },
  { html: "aufgabe2a.html", pdf: "sicherungsblatt-aufgabe-2a-loesungen.pdf", code: "MXDT-4QPR" },
  { html: "aufgabe3.html", pdf: "sicherungsblatt-aufgabe-3-loesungen.pdf", code: "M5HZ-4RM6" },
  { html: "aufgabe4a.html", pdf: "sicherungsblatt-aufgabe-4a-loesungen.pdf", code: "M9CV-4L7Q" }
];

for (const testCase of cases) {
  const htmlPath = path.join(base, testCase.html);
  const html = fs.readFileSync(htmlPath, "utf8");
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  scripts.forEach((script) => new Function(script[1]));
  assert(html.includes(`href="${testCase.pdf}" download hidden`));
  assert(html.includes(`unlockSolution(event, '${testCase.code}'`));
  assert(html.lastIndexOf("solution-download") > html.lastIndexOf("check-panel"));

  for (const match of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
    const reference = match[1].split("?")[0].split("#")[0];
    if (!reference || /^(?:https?:|data:|mailto:)/.test(reference)) continue;
    assert(fs.existsSync(path.resolve(path.dirname(htmlPath), reference)), `${testCase.html}: ${reference} fehlt`);
  }

  const pdfDocument = await PDFDocument.load(fs.readFileSync(path.join(base, testCase.pdf)));
  assert.equal(pdfDocument.getPageCount(), 1);
  const size = pdfDocument.getPage(0).getSize();
  assert(Math.abs(size.width - 595.4) < 0.1 && Math.abs(size.height - 841.8) < 0.1);
  console.log(`${testCase.html}: Inline-JS, Download, Code, Position, Links und einseitige A4-PDF OK`);
}

const engineSource = fs.readFileSync(path.join(base, "tabellenkalkulation.js"), "utf8");
const functionStart = engineSource.indexOf("window.unlockSolution =");
const functionEnd = engineSource.indexOf("\n  };", functionStart) + 5;
const testWindow = {};
const nodes = {
  link: { hidden: true },
  message: { className: "", textContent: "" }
};
const testDocument = { getElementById: (id) => nodes[id] };
new Function("window", "document", engineSource.slice(functionStart, functionEnd))(testWindow, testDocument);

let defaultPrevented = false;
const form = { elements: { "solution-code": { value: "m7qk 4p2x" } } };
testWindow.unlockSolution({ preventDefault() { defaultPrevented = true; }, currentTarget: form }, "M7QK-4P2X", "link", "message");
assert(defaultPrevented && !nodes.link.hidden && nodes.message.textContent.includes("freigeschaltet"));
form.elements["solution-code"].value = "falsch";
testWindow.unlockSolution({ preventDefault() {}, currentTarget: form }, "M7QK-4P2X", "link", "message");
assert(nodes.link.hidden && nodes.message.className.includes("error"));
console.log("Lehrercode-Freigabe: Normalisierung sowie Erfolgs- und Fehlerfall OK");
