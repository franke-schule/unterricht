import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { PDFDocument } = require("../pdftools/node_modules/pdf-lib");

const sourcePath = "faecher/informatik/klasse-9/1-Tabellenkalkulation/Skript Tabellenkalkulation-V3.pdf";
const outputDirectory = "faecher/informatik/klasse-9/1-Tabellenkalkulation";
const outputs = [
  [0, "sicherungsblatt-aufgabe-1-loesungen.pdf", "Aufgabe 1"],
  [1, "sicherungsblatt-aufgabe-2a-loesungen.pdf", "Aufgabe 2a"],
  [2, "sicherungsblatt-aufgabe-3-loesungen.pdf", "Aufgabe 3"],
  [3, "sicherungsblatt-aufgabe-4a-loesungen.pdf", "Aufgabe 4a"]
];

const sourceBytes = await fs.readFile(sourcePath);
const sourceDocument = await PDFDocument.load(sourceBytes);

if (sourceDocument.getPageCount() < outputs.length) {
  throw new Error(`Die Quelldatei enthält nur ${sourceDocument.getPageCount()} Seiten.`);
}

for (const [sourcePageIndex, fileName, taskName] of outputs) {
  const outputDocument = await PDFDocument.create();
  const [page] = await outputDocument.copyPages(sourceDocument, [sourcePageIndex]);
  outputDocument.addPage(page);
  outputDocument.setTitle(`Sicherungsblatt Tabellenkalkulation - ${taskName}`);
  outputDocument.setSubject(`Seite ${sourcePageIndex + 1} aus Skript Tabellenkalkulation-V3`);
  outputDocument.setCreator("unterricht");
  outputDocument.setProducer("pdf-lib");
  const outputPath = path.join(outputDirectory, fileName);
  await fs.writeFile(outputPath, await outputDocument.save());
  console.log(`${outputPath} <- Seite ${sourcePageIndex + 1}`);
}
