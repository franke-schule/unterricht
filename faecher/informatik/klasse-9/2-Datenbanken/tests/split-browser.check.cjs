const assert = require('node:assert/strict');
const http = require('node:http');
const { readFile, mkdir } = require('node:fs/promises');
const { extname, resolve, sep, join } = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');

const root = process.cwd();
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.wasm': 'application/wasm', '.csv': 'text/csv; charset=utf-8', '.pdf': 'application/pdf' };
const server = http.createServer(async (req, res) => {
  try {
    const file = resolve(root, `.${decodeURIComponent(new URL(req.url, 'http://localhost').pathname)}`);
    if (file !== root && !file.startsWith(`${root}${sep}`)) throw Error('forbidden');
    const content = await readFile(file);
    res.writeHead(200, { 'content-type': mime[extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(content);
  } catch { res.writeHead(404); res.end('Not found'); }
});

const modules = [
  { n: 2, tabs: ['intro','projection','orderBy','fast','quiz'], tasks: [['projection','t1','SELECT * FROM users'],['orderBy','t4','SELECT username FROM users ORDER BY username'],['fast','t11','SELECT * FROM users ORDER BY id DESC']], quiz: [['a','b','d'],['a','b'],['a','c']], code: 'M6QW-4TP9', key: 'informatik9-datenbanken-aufgabe2-select-order-v2' },
  { n: 3, tabs: ['distinct','limit','fast','quiz'], tasks: [['distinct','t7','SELECT DISTINCT city FROM users'],['limit','t10','SELECT username, birthday FROM users ORDER BY birthday DESC LIMIT 4'],['fast','t12','SELECT DISTINCT city FROM users ORDER BY city']], quiz: [['a','d'],['a','b'],['a']], code: 'M8KR-4TM7', key: 'informatik9-datenbanken-aufgabe3-distinct-limit-v2' },
  { n: 4, tabs: ['intro','simple','compare','fast','quiz'], tasks: [['simple','t1',"SELECT * FROM users WHERE gender = 'female'"],['compare','t4','SELECT * FROM users WHERE centimeters < 180'],['fast','t13',"SELECT * FROM users WHERE city = 'Schwerin'"]], quiz: [['a','b'],['a','b']], code: 'M3VG-4K7L', key: 'informatik9-datenbanken-aufgabe4-where-v2' },
  { n: 5, tabs: ['like','combine','fast','quiz'], tasks: [['like','t7',"SELECT * FROM users WHERE name LIKE 'B%'"],['combine','t10',"SELECT * FROM users WHERE name LIKE 'Lina %' AND city = 'Berlin'"],['fast','t21',"SELECT * FROM users WHERE (name LIKE 'Lina %' OR name LIKE 'Hailey %') AND city = 'Berlin'"]], quiz: [['a','b'],['a','b'],['a']], code: 'M5HN-4QX8', key: 'informatik9-datenbanken-aufgabe5-like-logik-v2' },
];

(async () => {
  await new Promise((done) => server.listen(0, '127.0.0.1', done));
  const browser = await chromium.launch({ headless: true, channel: 'msedge' });
  const screenshots = process.env.SPLIT_SCREENSHOT_DIR;
  if (screenshots) await mkdir(screenshots, { recursive: true });
  try {
    const selected = process.env.SPLIT_MODULE_FILTER ? new Set(process.env.SPLIT_MODULE_FILTER.split(',').map(Number)) : null;
    for (const module of modules.filter(({ n }) => !selected || selected.has(n))) {
      const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.stack));
      await page.goto(`http://127.0.0.1:${server.address().port}/faecher/informatik/klasse-9/2-Datenbanken/aufgabe${module.n}.html`);
      await page.waitForFunction(() => document.querySelector('#data-status')?.textContent.includes('ist geladen'), null, { timeout: 20000 });
      assert.equal(await page.locator('[role=tab]').count(), module.tabs.length, `Aufgabe ${module.n}: Reiterzahl`);
      assert.deepEqual(await page.locator('[role=tab]').evaluateAll((nodes) => nodes.map((node) => node.dataset.tab)), module.tabs);
      const exampleTabs = module.n === 2 ? ['orderBy'] : module.n === 3 ? ['distinct', 'limit'] : [];
      for (const tab of exampleTabs) {
        await page.locator(`#tab-${tab}`).click();
        const positions = await page.locator('#sql-panel').evaluate((panel) => {
          const row = panel.querySelector('.sql9-example-row');
          const explanation = panel.querySelector('.aggregate-intro > p');
          const description = panel.querySelector('.description-task');
          return {
            rowBeforeExplanation: Boolean(row && explanation && row.compareDocumentPosition(explanation) & Node.DOCUMENT_POSITION_FOLLOWING),
            rowBeforeDescription: Boolean(row && description && row.compareDocumentPosition(description) & Node.DOCUMENT_POSITION_FOLLOWING),
            exampleCount: row?.querySelectorAll('.sql9-example, .sql9-mini-table').length || 0,
          };
        });
        assert.ok(positions.rowBeforeExplanation && positions.rowBeforeDescription, `Aufgabe ${module.n}, ${tab}: Beispiel vor Begriff und Beschreibung`);
        assert.ok(positions.exampleCount >= 2, `Aufgabe ${module.n}, ${tab}: Vergleich vorhanden`);
        if (tab === 'limit') {
          assert.deepEqual(await page.locator('.sql9-example-row .sql9-mini-table tbody tr').evaluateAll((rows) => [rows.length, rows.slice(-4).map((row) => row.cells[0].textContent)]), [10, ['gartenlesemaus', 'gartencoderin', 'codekickemmi', 'modereiselio']]);
        }
        for (const width of [1280, 390]) {
          await page.setViewportSize({ width, height: 900 });
          if (screenshots) await page.screenshot({ path: join(screenshots, `aufgabe${module.n}-${tab}-final-${width}.png`), fullPage: true });
        }
        await page.setViewportSize({ width: 1280, height: 900 });
      }
      if (module.tabs.includes('intro')) await page.locator('#tab-intro').click();
      if (module.tabs.includes('intro')) {
        assert.equal(await page.locator('#intro-frame-count').textContent(), module.n === 2 ? 'Schritt 1 von 8' : 'Schritt 1 von 12');
        await page.locator('#intro-next').click();
        await page.reload();
        await page.waitForFunction(() => document.querySelector('#data-status')?.textContent.includes('ist geladen'));
        assert.match(await page.locator('#intro-frame-count').textContent(), /Schritt 2/);
      }
      for (const [tab, id, sql] of module.tasks) {
        await page.locator(`#tab-${tab}`).click();
        const card = page.locator(`#task-${id}`);
        await card.locator('textarea').fill(sql);
        await card.locator('.sql9-run').click();
        await page.waitForFunction((taskId) => document.querySelector(`#task-${taskId} .sql-feedback`)?.textContent.startsWith('Korrekt:'), id, { timeout: 15000 });
        assert.equal(await card.locator('.sql-feedback.success').count(), 1);
      }
      const lastTab = module.tasks.at(-1)[0], lastId = module.tasks.at(-1)[1], lastSql = module.tasks.at(-1)[2];
      await page.locator(`#tab-${lastTab}`).click();
      assert.equal(await page.locator(`#task-${lastId} textarea`).inputValue(), lastSql);
      await page.locator('#tab-quiz').click();
      assert.equal(await page.locator('#final-quiz fieldset').count(), module.quiz.length);
      assert.equal(await page.locator('.quiz-question-check button').count(), module.quiz.length);
      assert.equal(await page.locator('.solution-reveal .download-button[hidden]').count(), 1, 'Download vor Code verborgen');
      await page.locator('.solution-reveal summary').click();
      await page.locator('input[name=solution-code]').fill(module.code.toLowerCase().replace('-', ' '));
      await page.locator('.solution-code-form button').click();
      assert.equal(await page.locator('.solution-reveal .download-button:not([hidden])').count(), 1, 'Download unabhängig vom Quiz');
      assert.equal(await page.locator('#sql9-overview-title').count(), 0);
      if (screenshots) await page.screenshot({ path: join(screenshots, `aufgabe${module.n}-desktop.png`), fullPage: true });
      for (const [index, answers] of module.quiz.entries()) {
        const field = page.locator('#final-quiz fieldset').nth(index);
        for (const value of answers) await field.locator(`input[value="${value}"]`).check();
        await field.locator('.quiz-question-check button').click();
        assert.ok((await field.locator('.quiz-question-feedback').textContent()).length > 0);
      }
      assert.equal(await page.locator('#sql9-overview-title').count(), 1, 'Einzelprüfungen lösen Gesamtprüfung aus');
      await page.locator('#final-quiz fieldset').first().locator('input').first().uncheck();
      assert.equal(await page.locator('#sql9-overview-title').count(), 0, 'Änderung entfernt alte Freigabe');
      await page.reload();
      await page.waitForFunction(() => document.querySelector('#data-status')?.textContent.includes('ist geladen'));
      assert.equal(await page.locator('#tab-quiz').getAttribute('aria-selected'), 'true', 'aktiver Reiter gespeichert');
      assert.equal(await page.locator('#sql9-overview-title').count(), 0);
      assert.equal(await page.locator('.solution-reveal .download-button:not([hidden])').count(), 1, 'Codefreigabe nach Reload wiederhergestellt');
      for (const width of [768, 390]) {
        await page.setViewportSize({ width, height: 900 });
        const actual = await page.evaluate(() => ({ viewport: innerWidth, doc: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
        assert.ok(actual.doc <= actual.viewport + 1 && actual.body <= actual.viewport + 1, `Aufgabe ${module.n}: ${JSON.stringify(actual)}`);
      }
      if (screenshots) await page.screenshot({ path: join(screenshots, `aufgabe${module.n}-mobil.png`), fullPage: true });
      for (const width of [1280, 768, 390]) {
        await page.setViewportSize({ width, height: 900 });
        for (const tab of module.tabs) {
          await page.locator(`#tab-${tab}`).click();
          const actual = await page.evaluate(() => ({ viewport: innerWidth, doc: document.documentElement.scrollWidth, body: document.body.scrollWidth }));
          assert.ok(actual.doc <= actual.viewport + 1 && actual.body <= actual.viewport + 1, `Aufgabe ${module.n}, Reiter ${tab}: ${JSON.stringify(actual)}`);
          if (screenshots && width !== 768 && tab === module.tasks[0][0]) await page.screenshot({ path: join(screenshots, `aufgabe${module.n}-${tab}-${width}.png`), fullPage: true });
        }
      }
      const foreignKey = module.n <= 3 ? 'informatik9-datenbanken-aufgabe3-where-v1' : 'informatik9-datenbanken-aufgabe3-v1';
      await page.evaluate((key) => localStorage.setItem(key, 'anderer Modulstand'), foreignKey);
      page.once('dialog', (dialog) => dialog.accept());
      await page.locator('#reset-module').click();
      await page.waitForFunction(() => document.querySelector('#data-status')?.textContent.includes('ist geladen'));
      assert.equal(await page.evaluate((key) => localStorage.getItem(key), module.key), null, 'eigener Reset entfernt Zielstand');
      assert.equal(await page.evaluate((key) => localStorage.getItem(key), foreignKey), 'anderer Modulstand', 'fremder Stand bleibt erhalten');
      await page.reload();
      await page.waitForFunction(() => document.querySelector('#data-status')?.textContent.includes('ist geladen'));
      assert.equal(await page.evaluate((key) => localStorage.getItem(key), module.key), null, 'Altstand wandert nach Reset nicht erneut ein');
      assert.deepEqual(errors, [], `Aufgabe ${module.n}: Browserfehler`);
      await context.close();
    }
    console.log('Vier SQL-Module: Reiter, SQL-Beispiele, Code-Download, Quiz-Freigabe, Speicherung und drei Viewports geprüft.');
  } finally { await browser.close(); await new Promise((done) => server.close(done)); }
})().catch((error) => { console.error(error); process.exitCode = 1; });
