'use strict';
// Echter Browser und lokaler Serverweg; keine externen Modellaufrufe.
const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');
const fs = require('node:fs');
const { chromium } = require(process.env.SCW_PLAYWRIGHT_PACKAGE || path.join(os.homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const { createHandler, TEST_PASSWORD } = require('./fixtures/authorized-handler');
process.argv.push('--repository');
const { server } = require('../browser-test-server');
process.argv.pop();

async function main() {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = 'http://127.0.0.1:' + server.address().port;
  const pagePath = '/faecher/informatik/klasse-10/2-Modellierung-und-Programmierung-Online-IDE/aufgabe1.html';
  const handle = createHandler({ rateLimit: Infinity, env: {
    AI_API_KEY: 'mock', AI_PROJECT_ID: '11111111-1111-1111-1111-111111111111', AI_MODEL: 'mock-model', AI_EVALUATION_ENABLED: 'true', AI_ALLOWED_ORIGINS: origin
  }, fetchImpl: () => { throw Error('Für die Vergleichsantworten ist kein Modell nötig'); } });
  let browser;
  try {
    browser = await chromium.launch({ executablePath: process.env.SCW_CHROME_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    await context.route('**/*', async route => {
      const request = route.request();
      if (request.url() === 'https://unterrichtkiichezbn4-ki-auswertung.functions.fnc.fr-par.scw.cloud/') {
        const reply = await handle({ httpMethod: request.method(), path: '/', headers: await request.allHeaders(), body: request.postData() });
        return route.fulfill({ status: reply.statusCode, headers: reply.headers, body: reply.body });
      }
      if (request.url().includes('/include/js/includeide/')) return route.abort();
      if (/^https?:/.test(request.url()) && !request.url().startsWith(origin)) return route.abort();
      return route.continue();
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('dialog', dialog => dialog.accept(TEST_PASSWORD));
    await page.goto(origin + pagePath);
    assert.match(await page.locator('.task-card').first().innerText(), /Hauptprogramm.java/);
    await page.locator('#answer-1a').fill('ein block und ein ball werden erstellt');
    await page.locator('#button-1a').click();
    await page.waitForFunction(() => document.getElementById('result-1a').textContent.includes('2 von 5 Punkten'));
    assert.match(await page.locator('#result-1a').innerText(), /ein Objekt der Klasse/);
    const complete = 'ein Objekt der Klasse Kiste und ein Objekt der Klasse Ball werden erstellt. Der Ball hat die x-Startposition 100';
    await page.locator('#answer-1a').fill(complete);
    assert.equal(await page.locator('#result-1a').isHidden(), true);
    for (let attempt = 0; attempt < 2; attempt++) {
      await page.locator('#button-1a').click();
      await page.waitForFunction(() => document.getElementById('result-1a').textContent.includes('5 von 5 Punkten - Sehr gut, alles richtig'));
    }
    await page.locator('#answer-1b').fill('Die 100 ist der Parameterwert.');
    await page.locator('#answer-1c').fill('Eine Klasse ist ein Bauplan.');
    await page.locator('#answer-1f').fill('Ball erbt von Actor.');
    await page.locator('[name=q1][value=kiste]').check();
    await page.locator('button', { hasText: 'Frage 1 prüfen' }).click();
    assert.match(await page.locator('#final-quiz fieldset').first().innerText(), /Teilweise korrekt/);
    // Download ist ohne Quizabschluss mit dem Lehrercode erreichbar.
    await page.locator('.solution-reveal summary').click();
    await page.locator('#solution-code').fill('M4RV-XC2N');
    await page.locator('.solution-code-form button').click();
    assert.equal(await page.locator('#solution-download-link').isVisible(), true);
    await page.locator('.back-link').click();
    await page.goBack();
    assert.equal(await page.locator('#answer-1a').inputValue(), complete);
    assert.equal(await page.locator('#answer-1b').inputValue(), 'Die 100 ist der Parameterwert.');
    assert.equal(await page.locator('#answer-1c').inputValue(), 'Eine Klasse ist ein Bauplan.');
    assert.equal(await page.locator('#answer-1f').inputValue(), 'Ball erbt von Actor.');
    assert.equal(await page.locator('[name=q1][value=kiste]').isChecked(), true);
    await page.locator('.solution-reveal summary').click();
    assert.equal(await page.locator('#solution-download-link').isVisible(), true);
    await page.locator('[name=q1][value=ball]').check();
    await page.locator('[name=q2][value=parameter]').check();
    await page.locator('[name=q2][value=position]').check();
    await page.getByRole('button', { name: 'Frage 2 prüfen', exact: true }).click();
    assert.equal(await page.locator('#quiz-feedback').innerText(), 'Sehr gut, alles richtig');
    const screenshots = path.join(os.tmpdir(), 'inf10-programmierung-1a-qa');
    fs.mkdirSync(screenshots, { recursive: true });
    await page.screenshot({ path: path.join(screenshots, 'desktop.png'), fullPage: true });
    await page.setViewportSize({ width: 390, height: 844 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.screenshot({ path: path.join(screenshots, 'mobile.png'), fullPage: true });
    assert.deepEqual(errors, []);
    console.log('Browserprüfung bestanden: Punkte, Wiederholung, Feedback, Speicherung, Lehrercode, Quiz, Desktop und Smartphone.');
    console.log('Screenshots: ' + screenshots);
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
