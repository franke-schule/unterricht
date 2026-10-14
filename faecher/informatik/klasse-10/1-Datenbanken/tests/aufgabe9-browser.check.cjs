'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.SCW_PLAYWRIGHT_PACKAGE || path.join(os.homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));

process.argv.push('--repository');
const { server } = require('../../../../../scaleway-functions/browser-test-server');
process.argv.pop();
const pagePath = '/faecher/informatik/klasse-10/1-Datenbanken/aufgabe9.html';
const dataFile = path.resolve(__dirname, '../aufgabe9-daten.mjs');

async function main() {
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const origin = 'http://127.0.0.1:' + server.address().port;
  const { JOIN_TASKS } = await import(pathToFileURL(dataFile).href);
  const browser = await chromium.launch({ executablePath: process.env.SCW_CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true });
  const errors = []; const calls = []; let failNext = false;
  try {
    const context = await browser.newContext({ viewport: { width: 1366, height: 800 } });
    await context.route('**/*', async (route) => {
      const request = route.request(); const url = request.url();
      if (url === 'https://unterrichtkiichezbn4-ki-auswertung.functions.fnc.fr-par.scw.cloud/') {
        const body = request.postDataJSON(); calls.push(body.taskId); const fail = failNext; failNext = false;
        return route.fulfill({ status: fail ? 503 : 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': origin }, body: JSON.stringify({ type: 'GEMINI_EVALUATION_RESULT', requestId: body.requestId, result: fail ? { ok: false, message: 'Testfehler' } : { ok: true, points: 4, maxPoints: 4, status: 'korrekt', strengths: ['Simulierter fachlicher Aspekt'], missing: [], feedback: 'Simulierte Rückmeldung.' } }) });
      }
      if (url.startsWith(origin + '/')) return route.continue();
      return route.abort();
    });
    const page = await context.newPage(); page.on('pageerror', (error) => errors.push(error.message));
    await page.goto(origin + pagePath, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.getElementById('data-status')?.classList.contains('success'), null, { timeout: 120000 });
    assert.equal(await page.locator('#sql-tabs .step-tab').count(), 6);
    assert.equal(await page.locator('#tab-summary').isDisabled(), true);
    for (const task of JOIN_TASKS.filter((item) => item.type === 'sql')) {
      const tab = task.id.startsWith('Z') ? 'extra' : Number(task.id.slice(1)) <= 6 ? 'practice' : 'count';
      await page.click(`#tab-${tab}`);
      await page.fill(`#input-${task.id}`, task.statement);
      await page.locator(`#task-${task.id} .primary-button`).first().click();
      try { await page.waitForFunction((id) => document.querySelector(`#task-${id} .sql-feedback`)?.classList.contains('success'), task.id, { timeout: 20000 }); }
      catch (error) { throw new Error(`${task.id}: ${await page.locator(`#task-${task.id} .sql-feedback`).allTextContents()} / ${errors.join('; ')}`, { cause: error }); }
    }
    await page.click('#tab-extra');
    await page.fill('#input-Z13', 'SELECT DISTINCT users.username, users.name FROM users, follows WHERE users.id = follows.follower_id AND follows.following_id = 2 UNION SELECT users.username, users.name FROM users WHERE 1=0 ORDER BY 1');
    await page.locator('#task-Z13 .primary-button').first().click();
    await page.waitForFunction(() => document.querySelector('#task-Z13 .sql-feedback.partial'));
    assert.match(await page.locator('#task-Z13 .sql-feedback').innerText(), /Unterabfrage|innere Abfrage/);
    for (const task of JOIN_TASKS.filter((item) => item.type === 'describe')) {
      const tab = Number(task.id.slice(1)) <= 6 ? 'practice' : 'count';
      await page.click(`#tab-${tab}`);
      await page.fill(`#input-${task.id}`, task.model);
      await page.locator(`#task-${task.id} .primary-button`).first().click();
      try { await page.waitForFunction((id) => document.querySelector(`#task-${id} .server-feedback.high`), task.id, { timeout: 10000 }); }
      catch (error) { throw new Error(`${task.id}: ${await page.locator(`#task-${task.id} .server-feedback`).allTextContents()} / calls=${calls.join(',')} / ${errors.join('; ')}`, { cause: error }); }
    }
    assert.equal(calls.length, 4);
    await page.click('#tab-quiz');
    await page.getByRole('button', { name: 'Quiz prüfen' }).click();
    assert.match(await page.locator('.quiz-total-feedback').innerText(), /Kreuze bei jeder Frage/);
    assert.equal(await page.locator('.quiz-question-feedback:not([hidden])').count(), 4);
    for (let index = 1; index <= 4; index += 1) {
      for (const value of index === 3 ? ['a'] : ['a', 'b']) await page.check(`input[name="quiz-${index}"][value="${value}"]`);
      await page.getByRole('button', { name: `Frage ${index} prüfen` }).click();
    }
    await page.waitForFunction(() => document.getElementById('tab-summary')?.getAttribute('aria-selected') === 'true');
    assert.equal(await page.locator('#sql-panel .task-card').count(), 12);
    await page.goto(origin + '/faecher/informatik/klasse-10/index.html');
    await page.goto(origin + pagePath);
    await page.waitForFunction(() => document.getElementById('tab-summary')?.getAttribute('aria-selected') === 'true', null, { timeout: 120000 });
    assert.equal(await page.locator('#sql-panel .task-card').count(), 12);
    await page.click('#tab-practice');
    await page.fill('#input-P2', 'Die Abfrage zeigt Benutzernamen und Beschreibungen der Fotos, die Mitglieder aus Hamburg hochgeladen haben. Die Mitglieds-ID wird mit der user_id des Fotos verbunden; pro passendem Foto erscheint eine Zeile.');
    failNext = true;
    await page.locator('#task-P2 .primary-button').first().click();
    await page.waitForFunction(() => document.querySelector('#task-P2 .server-feedback.error'));
    assert.match(await page.locator('#task-P2 .server-feedback').innerText(), /gerade nicht erreichbar/);
    assert.equal(await page.locator('#tab-summary').isDisabled(), true);
    await page.locator('#task-P2 .primary-button').first().click();
    await page.waitForFunction(() => document.getElementById('tab-summary')?.getAttribute('aria-selected') === 'true');
    await page.click('#tab-practice');
    await page.fill('#input-P1', "SELECT p.url\nFROM users AS u INNER JOIN photos AS p ON u.id = p.user_id\nWHERE u.username = 'wanderwut_finn'\nORDER BY p.id;");
    await page.locator('#task-P1 .primary-button').first().click();
    await page.waitForFunction(() => document.getElementById('tab-summary')?.getAttribute('aria-selected') === 'true');
    await page.click('#tab-practice');
    await page.fill('#input-P1', "SELECT p.url\nFROM users AS u INNER JOIN photos AS p ON u.id = p.id\nWHERE u.username = 'wanderwut_finn'\nORDER BY p.id");
    assert.equal(await page.locator('#tab-summary').isDisabled(), true);
    await page.locator('#task-P1 .primary-button').first().click();
    await page.waitForFunction(() => document.querySelector('#task-P1 .sql-feedback')?.classList.contains('partial') || document.querySelector('#task-P1 .sql-feedback')?.classList.contains('hint'));
    assert.equal(await page.locator('#tab-summary').isDisabled(), true);
    await page.fill('#input-P1', 'SELECT 1 FROM users');
    await page.locator('#task-P1 .primary-button').first().click();
    await page.waitForFunction(() => document.querySelector('#task-P1 .sql-feedback.hint')?.textContent.startsWith('Noch nicht korrekt'));
    assert.match(await page.locator('#task-P1 .sql-feedback').innerText(), /Noch nicht korrekt/);
    await page.fill('#input-P1', "SELECT photos.url FROM users, photos WHERE users.username = 'wanderwut_finn' ORDER BY photos.id");
    await page.locator('#task-P1 .primary-button').first().click();
    await page.waitForFunction(() => document.querySelector('#task-P1 .sql-feedback.partial'));
    assert.match(await page.locator('#task-P1 .sql-feedback').innerText(), /Teilweise korrekt/);
    await page.click('#tab-count');
    await page.fill('#input-P10', JOIN_TASKS.find((task) => task.id === 'P10').statement.replace('COUNT(DISTINCT follows.follower_id)', 'COUNT(follows.follower_id)'));
    await page.locator('#task-P10 .primary-button').first().click();
    await page.waitForFunction(() => document.querySelector('#task-P10 .sql-feedback.partial'));
    await page.click('#tab-intro');
    for (const width of [1366, 768, 390]) {
      await page.setViewportSize({ width, height: 800 });
      for (const tab of ['intro', 'extra', 'quiz']) {
        await page.click(`#tab-${tab}`);
        const metrics = await page.evaluate(() => ({ document: document.documentElement.scrollWidth, viewport: document.documentElement.clientWidth, tabs: document.getElementById('sql-tabs').scrollWidth, tabsClient: document.getElementById('sql-tabs').clientWidth }));
        assert.ok(metrics.document <= metrics.viewport + 2, `${width}px ${tab}: horizontaler Seitenscroll ${JSON.stringify(metrics)}`);
        assert.ok(metrics.tabs <= metrics.tabsClient + 2, `${width}px ${tab}: horizontaler Reiterscroll ${JSON.stringify(metrics)}`);
      }
    }
    await page.locator('#tab-intro').focus();
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('#tab-practice').getAttribute('aria-selected'), 'true');
    for (const number of [5, 6, 7]) {
      await page.goto(origin + `/faecher/informatik/klasse-10/1-Datenbanken/aufgabe${number}.html`, { waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => document.getElementById('data-status')?.classList.contains('success'), null, { timeout: 30000 });
    }
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ referenceSql: 21, descriptions: 4, mockedRequests: calls.length, summaryCards: 12, restored: true, invalidation: true, aliasJoin: true, wrongJoin: true, nestedSelectRequired: true, incorrectVersusPartial: true, duplicateFollowerCount: true, serverErrorRetry: true, responsive: [1366, 768, 390], keyboard: true, regressions: [5, 6, 7], errors }));
  } finally { await browser.close(); await new Promise((resolve) => server.close(resolve)); }
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
