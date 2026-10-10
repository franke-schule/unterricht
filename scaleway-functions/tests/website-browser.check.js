'use strict';
// Vollständige Browser-Transportprüfung; sämtliche externen Anfragen abgefangen.
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const assert = require('node:assert/strict');
const playwrightPath = process.env.SCW_PLAYWRIGHT_PACKAGE || path.join(os.homedir(),
  '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const { chromium } = require(playwrightPath);
const core = require('../evaluation-core');
const { endpoint } = require('../migrate-website');
const repo = path.resolve(__dirname, '../..');
const migration = JSON.parse(fs.readFileSync(path.join(__dirname, '../website-migration-log.json'), 'utf8'));
process.argv.push('--repository');
const { server } = require('../browser-test-server');
process.argv.pop();

async function main() {
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const origin = 'http://127.0.0.1:' + server.address().port;
  let browser;
  const report = { mode: 'Simulierte API; keine echten Modellaufrufe', pages: [], requests: [], errors: [] };
  let failNext = false;
  try {
    browser = await chromium.launch({ executablePath: process.env.SCW_CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true });
    report.browser = await browser.version();
    const context = await browser.newContext();
    await context.route('**/*', async route => {
      const request = route.request();
      const url = request.url();
      if (url === endpoint) {
        if (request.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: {
          'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type' } });
        assert.equal(request.method(), 'POST');
        const body = request.postDataJSON();
        assert.ok(Object.hasOwn(core.TASKS, body.taskId));
        report.requests.push({ taskId: body.taskId, requestType: body.requestType, method: request.method(), inputInUrl: false });
        const maxPoints = core.TASKS[body.taskId].maxPoints;
        const error = failNext; failNext = false;
        return route.fulfill({ status: error ? 429 : 200, contentType: 'application/json',
          headers: { 'Access-Control-Allow-Origin': origin },
          body: JSON.stringify({ type: body.requestType === 'code' ? 'GEMINI_CODE_EVALUATION_RESULT' : 'GEMINI_EVALUATION_RESULT', requestId: body.requestId,
            result: error ? { ok: false, message: 'Bitte warte eine Minute.' } : {
              ok: true, points: maxPoints, maxPoints, status: 'korrekt', strengths: ['Simulierter Testaspekt'], missing: [], feedback: 'Simulierte Rückmeldung.'
            } }) });
      }
      if (url.startsWith(origin + '/')) {
        // IDE-Abfrage wurde getrennt gegen unveränderte Originalfunktionen geprüft.
        // Für diese Transportprüfung eine feste IDE-Dateiliste einsetzen.
        if (url.includes('/include/js/includeide/')) return route.abort();
        return route.continue();
      }
      if (/^https?:/.test(url)) return route.abort();
      return route.continue();
    });
    const page = await context.newPage();
    page.on('pageerror', error => report.errors.push(error.message));
    for (const entry of migration.files.filter(entry => entry.file.endsWith('.html'))) {
      const html = fs.readFileSync(path.join(repo, entry.file), 'utf8');
      const response = await page.goto(origin + '/' + entry.file, { waitUntil: 'domcontentloaded' });
      assert.equal(response.status(), 200);
      await page.waitForTimeout(150);
      await page.evaluate(() => {
        const entries = [['Hauptprogramm.java', 'Robot dudu = new Robot(1,1,12,12); dudu.hinlegen(4); Tier tier = new Tier();'],
          ['Tier.java', 'class Tier {}'], ['Hund', 'class Hund extends Tier {}'], ['Katze', 'class Katze extends Tier {}'],
          ['Delfin', 'class Delfin extends Tier {}'], ['Vogel', 'class Vogel extends Tier {}'], ['Dackel', 'class Dackel extends Hund {}']];
        for (const frame of document.querySelectorAll('iframe')) frame.contentWindow.online_ide_access = {
          getIDE: () => ({ getFiles: () => entries.map(([name, text]) => ({ getName: () => name, getText: () => text })) })
        };
      });
      const textIds = [...html.matchAll(/id="answer-([^"]+)"/g)].map(match => match[1]);
      const codeIds = [...html.matchAll(/onclick="submitCode\('([^']+)'\)"/g)].map(match => match[1]);
      const ids = [...textIds, ...codeIds];
      for (const id of ids) {
        if (!await page.locator('#button-' + id).count()) continue;
        if (textIds.includes(id)) await page.locator('#answer-' + id).evaluate(node => {
          node.value = 'Eine erfundene Antwort für die automatische technische Prüfung.';
          node.dispatchEvent(new Event('input', { bubbles: true }));
        });
        const before = report.requests.length;
        await page.locator('#button-' + id).evaluate(button => button.click());
        await page.waitForFunction(id => !document.getElementById('button-' + id).disabled, id, { timeout: 10000 });
        assert.equal(report.requests.length, before + 1, entry.file + ': ' + id);
        assert.match(await page.locator('#result-' + id).innerText(), /von \d+ Punkten/);
      }
      report.pages.push({ file: entry.file, taskControls: ids.length });
    }
    await page.goto(origin + '/faecher/informatik/klasse-9/3-Modellierung-und-Programmierung-Online-IDE/aufgabe1.html');
    await page.fill('#answer-b', 'Eine ausreichend lange erfundene Testantwort.');
    failNext = true;
    await page.click('#button-b');
    await page.waitForFunction(() => !document.getElementById('button-b').disabled);
    assert.match(await page.locator('#result-b').innerText(), /warte eine Minute/);
    await page.click('#button-b');
    await page.waitForFunction(() => !document.getElementById('button-b').disabled);
    assert.match(await page.locator('#result-b').innerText(), /6 von 6/);
    report.errorAndRetry = true;
    assert.deepEqual(report.errors, []);
    fs.writeFileSync(path.join(repo, 'tmp/scaleway-browser-report.json'), JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify({ browser: report.browser, pages: report.pages.length, requests: report.requests.length,
      errorAndRetry: report.errorAndRetry, liveModelCalls: 0 }));
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
