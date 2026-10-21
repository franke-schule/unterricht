const assert = require('node:assert/strict');
const http = require('node:http');
const { readFile } = require('node:fs/promises');
const { extname, resolve, sep } = require('node:path');
const playwrightModule = process.env.PLAYWRIGHT_MODULE_PATH || 'playwright';
const { chromium } = require(playwrightModule);

const root = process.cwd();
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.wasm': 'application/wasm', '.csv': 'text/csv; charset=utf-8', '.pdf': 'application/pdf' };
const server = http.createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    const file = resolve(root, `.${pathname}`);
    if (file !== root && !file.startsWith(`${root}${sep}`)) throw new Error('forbidden');
    const content = await readFile(file);
    res.writeHead(200, { 'content-type': mime[extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(content);
  } catch { res.writeHead(404); res.end('Not found'); }
});

(async () => {
  await new Promise((resolveReady) => server.listen(0, '127.0.0.1', resolveReady));
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  try {
    const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
    const page = await context.newPage();
    const browserErrors = [];
    page.on('pageerror', (error) => browserErrors.push(error.message));
    page.on('request', (request) => { if (request.url().startsWith('https://')) browserErrors.push(`Unexpected remote request: ${request.url()}`); });
    await page.addInitScript(() => {
      const descriptor = Object.getOwnPropertyDescriptor(Worker.prototype, 'onmessage');
      Object.defineProperty(Worker.prototype, 'onmessage', {
        configurable: true,
        enumerable: descriptor.enumerable,
        get() { return descriptor.get.call(this); },
        set(handler) { descriptor.set.call(this, function delayedWorkerMessage(event) { setTimeout(() => handler.call(this, event), 80); }); }
      });
    });
    await page.goto(`http://127.0.0.1:${server.address().port}/faecher/informatik/klasse-9/2-Datenbanken/aufgabe2.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.querySelector('#data-status')?.textContent.includes('ist geladen'), null, { timeout: 15000 });

    const run = async (tab, id, sql) => {
      await page.locator(`#tab-${tab}`).click();
      const card = page.locator(`#task-${id}`);
      const input = card.locator('.sql-input');
      await input.fill(sql);
      await card.locator('.sql9-run').click();
      await page.waitForFunction((taskId) => {
        const feedback = document.querySelector(`#task-${taskId} .sql-feedback`);
        return feedback && feedback.textContent.trim() && !feedback.textContent.includes('wird ausgeführt');
      }, id, { timeout: 12000 });
      return {
        text: (await card.locator('.sql-feedback').textContent()).trim(),
        classes: await card.locator('.sql-feedback').getAttribute('class'),
        input,
        card
      };
    };
    const expectText = async (tab, id, sql, text, level) => {
      const result = await run(tab, id, sql);
      assert.ok(result.text.includes(text), `${id} erwartete Feedback „${text}“, erhalten: ${result.text}`);
      if (level) assert.match(result.classes, new RegExp(`\\b${level}\\b`), `${id} Feedbackstatus`);
      return result;
    };

    await expectText('projection', 't1', 'SELECT * FROM users', 'Korrekt:', 'success');
    await expectText('projection', 't1', 'SELECT * FROM users LIMIT 3', 'Ergebnisrelation hat nur 3 Zeilen', 'partial');
    await expectText('projection', 't2', 'SELECT name FROM users', 'name enthält den vollständigen Namen', 'hint');
    let saved = await page.evaluate(() => JSON.parse(localStorage.getItem('informatik9-datenbanken-aufgabe3-v1')));
    assert.equal(saved.answers.t2, 'SELECT name FROM users');
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.querySelector('#data-status')?.textContent.includes('ist geladen'));
    await page.locator('#tab-projection').click();
    await page.locator('#task-t2 .sql-input').waitFor();
    assert.equal(await page.locator('#task-t2 .sql-input').inputValue(), 'SELECT name FROM users');
    assert.ok((await page.locator('#task-t2 .sql-feedback').textContent()).includes('name enthält den vollständigen Namen'));
    await expectText('projection', 't2', 'SELECT username FROM users', 'Korrekt:', 'success');
    await expectText('projection', 't2', 'SELECT username, username FROM users', 'Deine Ergebnisrelation enthält username, username', 'hint');
    await expectText('projection', 't2', 'SELECT username AS handle FROM users', 'Korrekt:', 'success');
    saved = await page.evaluate(() => JSON.parse(localStorage.getItem('informatik9-datenbanken-aufgabe3-v1')));
    assert.equal(saved.solved.t2, true, 'richtige Antwort speichert den Erfolg');
    await page.locator('#task-t2 .sql-input').fill('SELECT name FROM users');
    saved = await page.evaluate(() => JSON.parse(localStorage.getItem('informatik9-datenbanken-aufgabe3-v1')));
    assert.equal(saved.solved.t2, undefined, 'Bearbeiten löscht den Erfolg');
    assert.equal(await page.locator('#task-t2 .sql-feedback').textContent(), '', 'Bearbeiten löscht alte Rückmeldung');

    await expectText('projection', 't3', 'SELECT name country FROM users', 'Zwischen zwei gewünschten Spalten fehlt ein Komma', 'hint');
    await expectText('projection', 't3', 'SELECT name, country, country FROM users', 'Gesucht sind genau zwei Spalten', 'hint');
    await expectText('projection', 't3', 'SELECT country, name FROM users', 'Korrekt:', 'success');
    await expectText('projection', 't3', 'SELECT country AS land, name AS person FROM users', 'Korrekt:', 'success');
    await expectText('projection', 't1', 'SELECT *, username FROM users', 'Deine Ergebnisrelation hat 19 Spalte(n)', 'hint');

    await expectText('orderBy', 't4', 'SELECT username AS benutzer FROM users ORDER BY benutzer', 'Korrekt:', 'success');
    await expectText('orderBy', 't4', 'SELECT username nutzer FROM users ORDER BY nutzer', 'Korrekt:', 'success');
    await expectText('orderBy', 't4', 'SELECT username FROM users ORDER BY "username"', 'Korrekt:', 'success');
    await expectText('orderBy', 't4', 'SELECT username FROM users ORDER BY username DESC', 'DESC sortiert absteigend', 'partial');
    await expectText('orderBy', 't4', 'SELECT username FROM users ORDER BY username -- name darf hier kein Bezeichner sein\n', 'Korrekt:', 'success');
    await expectText('orderBy', 't5', 'SELECT username, name, centimeters FROM users ORDER BY groesse DESC', 'hinter ORDER BY', 'error');
    await expectText('orderBy', 't5', 'SELECT username, name, centimeters FROM users ORDER BY größe DESC', 'hinter ORDER BY', 'error');
    await expectText('orderBy', 't5', 'SELECT username, name, centimeters FROM users ORDER BY centimeters DESC', 'Korrekt:', 'success');
    await expectText('orderBy', 't6', 'SELECT username, birthday FROM users ORDER BY birthday ASC', 'Korrekt:', 'success');
    await expectText('orderBy', 't6', 'SELECT username, birthday FROM users ORDER BY birthday DESC', 'DESC sortiert absteigend', 'partial');

    await expectText('distinct', 't7', 'SELECT DISTINCT city FROM users', 'Korrekt:', 'success');
    await expectText('distinct', 't7', 'SELECT city FROM users', 'mehrfach vorkommen', 'partial');
    await expectText('distinct', 't8', 'SELECT country FROM users', 'gleiche Länder erscheinen noch mehrfach', 'partial');
    await expectText('distinct', 't8', 'SELECT DISTINCT country FROM users', 'Korrekt:', 'success');

    await expectText('limit', 't9', 'SELECT DISTINCT id FROM users LIMIT 3', 'Korrekt:', 'success');
    await expectText('limit', 't9', 'SELECT DISTINCT gender FROM users LIMIT 3', 'Lass DISTINCT weg', 'partial');
    await expectText('limit', 't9', 'SELECT id FROM users LIMIT 0', 'hat 0 Zeilen, gesucht sind genau 3', 'partial');
    await expectText('limit', 't9', 'SELECT * FROM users LIMIT 3', 'Korrekt:', 'success');
    await expectText('limit', 't10', 'SELECT username, birthday FROM users ORDER BY birthday DESC LIMIT 3', 'hat 3 Zeilen, gesucht sind genau 4', 'partial');
    await expectText('limit', 't10', 'SELECT username, birthday FROM users ORDER BY birthday DESC LIMIT 4', 'Korrekt:', 'success');
    await expectText('fast', 't11', 'SELECT * FROM users ORDER BY id DESC', 'Korrekt:', 'success');
    await expectText('fast', 't12', 'SELECT DISTINCT city FROM users ORDER BY city', 'Korrekt:', 'success');
    await expectText('fast', 't13', 'SELECT city, username FROM users ORDER BY city', 'Korrekt:', 'success');
    await expectText('fast', 't14', 'SELECT username, centimeters AS groesse FROM users ORDER BY centimeters DESC, username LIMIT 4', 'Korrekt:', 'success');
    await expectText('fast', 't14', 'SELECT username, centimeters FROM users ORDER BY centimeters DESC LIMIT 2', 'hat 2 Zeilen, gesucht sind genau 4', 'partial');
    await expectText('fast', 't15', 'SELECT username, birthday FROM users ORDER BY birthday DESC LIMIT 3', 'Korrekt:', 'success');

    await expectText('projection', 't2', 'SELECT username FROM users WHERE city = Berlin', "Setze den Textwert Berlin in Anführungszeichen", 'error');
    await expectText('projection', 't2', "SELECT username FROM users WHERE wohnort = 'Berlin'", 'hinter WHERE gibt es in users nicht', 'error');
    await expectText('projection', 't2', 'SELECT username /* residence */ FROM users WHERE residence = 1', 'hinter WHERE gibt es in users nicht', 'error');
    await expectText('orderBy', 't5', 'SELECT username FROM users ORDER BY user', 'hinter ORDER BY gibt es in der Tabelle users nicht', 'error');
    await expectText('projection', 't2', 'SELECT username FROM users WHERE id < 0', 'Die Spalten passen, aber deine Abfrage liefert keine Zeilen', 'partial');
    await expectText('projection', 't2', 'SELECT username FROM users WHERE id < 3', 'es fehlen Mitglieder', 'partial');

    await page.locator('#tab-fast').click();
    const staleInput = page.locator('#task-t15 .sql-input');
    await staleInput.fill('SELECT username FROM users WHERE id < 0');
    await page.locator('#task-t15 .sql9-run').click();
    await staleInput.fill('SELECT username, birthday FROM users ORDER BY birthday DESC LIMIT 3');
    await page.waitForTimeout(300);
    assert.equal(await page.locator('#task-t15 .sql-feedback').textContent(), '', 'veraltete Workerantwort darf geänderte Eingabe nicht bewerten');
    saved = await page.evaluate(() => JSON.parse(localStorage.getItem('informatik9-datenbanken-aufgabe3-v1')));
    assert.equal(saved.solved.t15, undefined, 'veraltete Workerantwort darf keinen Erfolg speichern');
    await expectText('fast', 't15', 'SELECT username, birthday FROM users ORDER BY birthday DESC LIMIT 3', 'Korrekt:', 'success');

    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('#tab-fast').click();
    const widths = await page.evaluate(() => ({ viewport: innerWidth, document: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
    assert.ok(widths.document <= widths.viewport + 1 && widths.body <= widths.viewport + 1, `Mobile Breite ohne Seitenüberlauf: ${JSON.stringify(widths)}`);
    assert.deepEqual(browserErrors, [], `Browserfehler: ${browserErrors.join('; ')}`);
    console.log('Inf9 SQL-Feedback geprüft: t1–t15, Alias-/Quote-/WHERE-/Unicode-/DISTINCT-/LIMIT-Fälle, Persistenz, Statuswechsel und Mobile-Breite.');
  } finally {
    await browser.close();
    await new Promise((resolveClose) => server.close(resolveClose));
  }
})().catch((error) => { console.error(error); process.exitCode = 1; });
