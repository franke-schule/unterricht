import fs from "node:fs/promises";
import path from "node:path";
import { createCanvas, DOMMatrix, ImageData, Path2D } from "../pdftools/node_modules/@napi-rs/canvas/index.js";

globalThis.DOMMatrix = DOMMatrix;
globalThis.ImageData = ImageData;
globalThis.Path2D = Path2D;

const pdfjs = await import("../pdftools/node_modules/pdfjs-dist/legacy/build/pdf.mjs");
const [inputPath, outputDirectory, pageList = "all"] = process.argv.slice(2);

if (!inputPath || !outputDirectory) {
  throw new Error("Usage: node render-pdf.mjs <input.pdf> <output-dir> [1,2,...|all]");
}

await fs.mkdir(outputDirectory, { recursive: true });
const data = new Uint8Array(await fs.readFile(inputPath));
const document = await pdfjs.getDocument({ data, disableWorker: true }).promise;
const pageNumbers = pageList === "all"
  ? Array.from({ length: document.numPages }, (_, index) => index + 1)
  : pageList.split(",").map(Number);

for (const pageNumber of pageNumbers) {
  const page = await document.getPage(pageNumber);
  const viewport = page.getViewport({ scale: 1.75 });
  const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
  const context = canvas.getContext("2d");
  await page.render({ canvasContext: context, viewport }).promise;
  const outputPath = path.join(outputDirectory, `page-${pageNumber}.png`);
  await fs.writeFile(outputPath, canvas.toBuffer("image/png"));
  console.log(`${outputPath} (${canvas.width}x${canvas.height})`);
}
