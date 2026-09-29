import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const runtimeModules = 'C:/Users/ffran/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules';
const require = createRequire(path.join(runtimeModules, 'qa.js'));
const { chromium } = require('playwright');
const htmlPath = path.resolve('tmp/presentation-abfrage3/informatik-material/inf10/1-Datenbanken/abfrage-aufgabe-3-beziehungen.html');
const outputDir = path.resolve('tmp/presentation-abfrage3/screenshots');
await fs.mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
await page.goto(pathToFileURL(htmlPath).href);
const results = [];
for (let i = 0; i < 5; i++) {
  const slide = page.locator('.slide.active');
  const title = await slide.locator('header').textContent();
  const before = await slide.locator('.question-text').evaluate(el => getComputedStyle(el).visibility);
  await page.locator('#next').click();
  const after = await slide.locator('.question-text').evaluate(el => getComputedStyle(el).visibility);
  const bounds = await slide.locator('.question-text').evaluate(el => {
    const r = el.getBoundingClientRect();
    return { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
  });
  await page.screenshot({ path: path.join(outputDir, `frage-${i + 1}.png`) });
  results.push({ title, before, after, bounds });
  if (i < 4) await page.locator('#next').click();
}
await page.locator('#previous').click();
results.push({ backHidesQuestion: await page.locator('.slide.active .question-text').evaluate(el => getComputedStyle(el).visibility === 'hidden') });
console.log(JSON.stringify(results, null, 2));
await browser.close();
