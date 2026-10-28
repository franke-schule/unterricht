import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
import { CODE_SNIPPET_TASK as task } from '../ui/code-snippet-order.mjs';

// Ohne URL-Argument wird aus dem Repository-Verzeichnis ein Testserver gestartet.
const root = resolve('.');
const server = process.argv[2] ? null : createServer(async (request, response) => {
  const file = resolve(root, '.' + decodeURIComponent(new URL(request.url, 'http://localhost').pathname));
  if (!file.startsWith(root + sep)) { response.writeHead(403); response.end(); return; }
  try {
    const data = await readFile(file);
    const type = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css' }[extname(file)];
    response.writeHead(200, { 'Content-Type': type || 'application/octet-stream' });
    response.end(data);
  } catch { response.writeHead(404); response.end(); }
});
if (server) await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
const url = process.argv[2] || `http://127.0.0.1:${server.address().port}/faecher/informatik/klasse-11/1-Kuenstliche-Intelligenz/aufgabe6.html`;
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({
  headless: true,
  ...(process.env.TEST_BROWSER_PATH ? { executablePath: process.env.TEST_BROWSER_PATH } : {}),
});
try {
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  // Die Sortierhilfe ist unabhängig von der eingebetteten Java-IDE.
  await page.route('**/include/**', route => route.abort());
  await page.goto(url, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: 'Einfach – mit Hilfen', exact: true }).click();
  const helperWidth = () => page.locator('#code-snippets-help').evaluate(element => element.getBoundingClientRect().width);
  const layoutWidth = () => page.locator('.task6-layout').evaluate(element => element.getBoundingClientRect().width);
  assert.ok(await helperWidth() < await layoutWidth() / 2, 'Eingeklappte Hilfe bleibt in der Aufgabenspalte');
  await page.locator('#code-snippets-help summary').click();
  assert.ok(Math.abs(await helperWidth() - await layoutWidth()) < 2, 'Geöffnete Hilfe nutzt beide Spalten');
  await page.locator('#code-snippets-help summary').click();
  assert.ok(await helperWidth() < await layoutWidth() / 2, 'Zugeklappte Hilfe wird wieder schmal');
  await page.locator('#code-snippets-help summary').click();
  const bank = page.locator('#code-snippet-steps .step-order-bank');
  const slots = page.locator('#code-snippet-steps .formula-slot');
  const feedback = page.locator('#code-snippets-feedback');
  const card = id => bank.getByRole('button', { name: task.cards.find(item => item.id === id).text, exact: true });
  assert.equal(await bank.locator('button').count(), 9);
  assert.equal(await slots.count(), 9);
  await page.locator('#check-code-snippets').click();
  assert.match(await feedback.textContent(), /Fülle zuerst alle 9/);

  const wrong = [...task.acceptedOrders[0]];
  [wrong[1], wrong[2]] = [wrong[2], wrong[1]];
  for (let i = 0; i < 9; i++) {
    await card(wrong[i]).click();
    await slots.nth(i).click();
  }
  await page.locator('#check-code-snippets').click();
  assert.match(await feedback.textContent(), /Teilweise korrekt.*7 von 9/s);
  await slots.nth(1).click();
  await slots.nth(2).click();
  await page.locator('#check-code-snippets').click();
  assert.match(await feedback.textContent(), /^Richtig/);

  await page.reload({ waitUntil: 'domcontentloaded' });
  await slots.nth(0).waitFor();
  assert.equal(await page.locator('#code-snippets-help').getAttribute('open'), '');
  assert.ok(Math.abs(await helperWidth() - await layoutWidth()) < 2, 'Wiederhergestellte offene Hilfe bleibt breit');
  assert.equal(await bank.locator('button').count(), 0);
  await page.locator('#check-code-snippets').click();
  assert.match(await feedback.textContent(), /^Richtig/);
  await page.locator('#reset-code-snippets').click();
  assert.equal(await bank.locator('button').count(), 9);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await bank.locator('button').first().waitFor();
  assert.equal(await bank.locator('button').count(), 9);

  // Tastaturbedienung und eine weitere gleichwertige Reihenfolge.
  const alternate = task.acceptedOrders.at(-1);
  for (let i = 0; i < 9; i++) {
    await card(alternate[i]).focus();
    await page.keyboard.press('Enter');
    await slots.nth(i).focus();
    await page.keyboard.press('Enter');
  }
  await page.locator('#check-code-snippets').click();
  assert.match(await feedback.textContent(), /^Richtig/);
  await page.locator('#change-variant').click();
  await page.getByRole('button', { name: 'Schwer – selbstständig', exact: true }).click();
  assert.equal(await page.locator('#code-snippets-help').isVisible(), false, 'Sortierhilfe bleibt in schwerer Variante verborgen');
  await page.locator('#change-variant').click();
  await page.getByRole('button', { name: 'Einfach – mit Hilfen', exact: true }).click();
  assert.equal(await bank.locator('button').count(), 0);
  assert.ok(Math.abs(await helperWidth() - await layoutWidth()) < 2, 'Offene Hilfe ist nach Variantenwechsel wieder breit');

  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Mobile Seite läuft über');
  await page.locator('#reset-code-snippets').click();
  // Bei dieser Größe sind Quelle und Ziel gemeinsam sichtbar.
  await page.setViewportSize({ width: 1000, height: 2400 });
  await card('sum').scrollIntoViewIfNeeded();
  const from = await card('sum').boundingBox();
  const to = await slots.nth(0).boundingBox();
  await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
  await page.mouse.down();
  await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 15 });
  await page.mouse.up();
  assert.match(await slots.nth(0).textContent(), /double gewichtete_Summe/);
  await page.setViewportSize({ width: 390, height: 844 });
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Mobile Seite mit Karte läuft über');
  if (process.env.TEST_SCREENSHOT) await page.locator('#code-snippets-help').screenshot({ path: process.env.TEST_SCREENSHOT });
  // Die ursprüngliche Physik-Hilfe verwendet dieselbe Komponente weiterhin.
  await page.goto(new URL('/faecher/physik/klasse-11/1-Kreisbewegungen/aufgabe7.html', url).href, { waitUntil: 'domcontentloaded' });
  await page.locator('#tab-carousel').click();
  await page.locator('details').filter({ has: page.locator('#task3b-steps') }).locator('summary').click();
  assert.equal(await page.locator('#task3b-steps .formula-slot').count(), 6);
  assert.equal(await page.locator('#task3b-steps .cloze-token').count(), 7);
  await page.locator('#check-task3b-steps').click();
  assert.match(await page.locator('#task3b-steps-feedback').textContent(), /Fülle zuerst alle 6/);
  assert.deepEqual(errors, []);
  console.log('Sortierhilfe: Prüfung, Tauschen, Speichern, Neuladen, Zurücksetzen, Tastatur, Variantenwechsel, Pointer-Drag, mobile Breite und Physik-Vorlage bestanden.');
} finally {
  await browser.close();
  if (server) await new Promise(resolve => server.close(resolve));
}
