'use strict';

// Echter Browser, echte Passwortprüfung, ausschließlich simulierte Modellantworten.
const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');
const fs = require('node:fs');
const { chromium } = require(process.env.SCW_PLAYWRIGHT_PACKAGE || path.join(os.homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const { createHandler } = require('../handler');
const { createPasswordHash } = require('../create-access-password-hash');
const core = require('../evaluation-core');
process.argv.push('--repository');
const { server } = require('../browser-test-server');
process.argv.pop();

async function main() {
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const origin = `http://127.0.0.1:${server.address().port}`;
  const password = 'ä🔐'; // absichtlich kurz und nicht nur ASCII
  const env = {
    AI_API_KEY: 'dummy-key', AI_PROJECT_ID: '11111111-1111-1111-1111-111111111111',
    AI_MODEL: 'dummy', AI_EVALUATION_ENABLED: 'true', AI_ALLOWED_ORIGINS: origin,
    AI_ACCESS_PASSWORD_HASH: createPasswordHash(password)
  };
  let requests = 0, modelCalls = 0, taskId = 'b', nextFailure = false;
  const handle = createHandler({ env, rateLimit: Infinity, fetchImpl: async () => {
    modelCalls++;
    return { ok: true, status: 200, text: async () => JSON.stringify({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify({
      criteria: Object.fromEntries(core.TASKS[taskId].feedbackCriteria.map(c => [c.id, { status: 'missing', evidence: [] }]))
    }) } }] }) };
  } });
  let browser;
  const errors = [];
  const helperPath = '/faecher/informatik/klasse-11/1-Kuenstliche-Intelligenz/perzeptron/ui/semantic-answer.mjs';
  try {
    browser = await chromium.launch({ executablePath: process.env.SCW_CHROME_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe', headless: true });
    const page = await browser.newPage({ viewport: { width: 1366, height: 800 } });
    page.on('pageerror', error => errors.push(error.message));
    await page.route('**/*', async route => {
      const request = route.request();
      if (request.url() === origin + '/__auth-test') {
        return route.fulfill({ contentType: 'text/html', body: `<!doctype html><html lang="de"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Lokaler Passworttest</title>
          <textarea id="answer">Eine synthetische Antwort für den lokalen Passworttest.</textarea>
          <button id="text">Erklärung prüfen</button><button id="code">Programm prüfen</button><p id="result" role="status"></p>
          <script type="module">
          const api = await import('${helperPath}'); window.api = api;
          for (const kind of ['text', 'code']) document.getElementById(kind).onclick = async () => {
            const button = document.getElementById(kind); button.disabled = true;
            const snapshot = document.getElementById('answer').value;
            document.getElementById('result').textContent = '';
            try {
              const result = kind === 'text' ? await api.evaluateSemanticAnswer({ taskId: 'b', answer: snapshot })
                : await api.evaluateCodeAnswer({ taskId: '${Object.keys(core.TASKS).find(id => core.TASKS[id].responseType === 'code')}', code: snapshot });
              document.getElementById('result').textContent = result.points + ' Punkte';
            } catch (error) { document.getElementById('result').textContent = error.message; }
            finally { button.disabled = false; }
          };
          </script></html>` });
      }
      if (request.url().startsWith(origin + '/')) return route.continue();
      if (request.url().startsWith('https://unterrichtkiichezbn4-ki-auswertung.functions.fnc.fr-par.scw.cloud/')) {
        const event = { httpMethod: request.method(), path: '/', headers: request.headers(), body: request.postData() };
        if (request.method() === 'POST') {
          requests++;
          const payload = request.postDataJSON(); taskId = payload.taskId;
          assert.ok(!request.postData().includes(password));
          assert.ok(!request.postData().includes(Buffer.from(password).toString('base64')));
          if (nextFailure) {
            nextFailure = false;
            return route.fulfill({ status: 503, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': origin }, body: JSON.stringify({ result: { ok: false, message: 'Synthetischer Serverausfall.' } }) });
          }
        }
        const response = await handle(event);
        return route.fulfill({ status: response.statusCode, headers: response.headers, body: response.body });
      }
      return route.abort(); // Kein Zugriff auf echte KI oder andere externe Ressourcen.
    });
    const result = page.locator('#result');
    const input = page.locator('#ai-access-password');
    const dialog = page.getByRole('dialog', { name: 'KI-Prüfung freischalten' });
    const start = async () => {
      await page.goto(origin + '/__auth-test');
      await page.waitForFunction(() => !!window.api);
    };
    await start();
    const originalAnswer = await page.locator('#answer').inputValue();
    await page.click('#text'); await dialog.waitFor();
    assert.equal(await input.getAttribute('type'), 'password');
    await page.keyboard.press('Escape');
    await result.getByText(/abgebrochen/).waitFor();
    assert.equal(requests, 0); assert.equal(modelCalls, 0);
    assert.equal(await page.locator('#answer').inputValue(), originalAnswer);
    assert.equal(await page.locator('#text').isEnabled(), true);

    await page.click('#text'); await dialog.waitFor();
    await input.fill('falsch'); await dialog.getByRole('button', { name: 'Prüfung starten' }).click();
    await result.getByText(/gültige Unterrichtspasswort/).waitFor();
    assert.equal(requests, 1); assert.equal(modelCalls, 0);
    await page.click('#text'); await dialog.waitFor();
    await input.fill(password); await page.keyboard.press('Enter');
    await result.getByText('0 Punkte', { exact: true }).waitFor();
    assert.equal(requests, 2); assert.equal(modelCalls, 1);
    assert.equal(await page.locator('#ai-access-password').count(), 0);
    const stored = await page.evaluate(() => ({ local: JSON.stringify(localStorage), session: JSON.stringify(sessionStorage) }));
    assert.ok(!JSON.stringify(stored).includes(password));
    assert.ok(!JSON.stringify(stored).includes(Buffer.from(password).toString('base64')));

    await page.click('#code');
    await page.waitForFunction(() => !document.getElementById('code').disabled);
    assert.equal(await dialog.count(), 0); assert.equal(modelCalls, 2);
    nextFailure = true;
    await page.click('#text'); await result.getByText('Synthetischer Serverausfall.').waitFor();
    const beforeRetry = requests;
    await page.click('#text'); await result.getByText('0 Punkte', { exact: true }).waitFor();
    assert.equal(requests, beforeRetry + 1); assert.equal(await dialog.count(), 0);

    env.AI_ACCESS_PASSWORD_HASH = createPasswordHash('neu');
    await page.click('#text'); await result.getByText(/gültige Unterrichtspasswort/).waitFor();
    await page.click('#text'); await dialog.waitFor();
    await input.fill('neu'); await page.keyboard.press('Enter');
    await result.getByText('0 Punkte', { exact: true }).waitFor();

    await start();
    await page.setViewportSize({ width: 375, height: 700 });
    await page.click('#text'); await dialog.waitFor();
    await page.waitForFunction(() => [...document.styleSheets].some(sheet => sheet.href?.includes('ai-access.css')));
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    assert.equal(await dialog.evaluate(node => node.scrollWidth <= node.clientWidth), true);
    const folder = path.resolve(__dirname, '../../tmp/scaleway-password-browser'); fs.mkdirSync(folder, { recursive: true });
    await page.screenshot({ path: path.join(folder, 'password-mobile.png') });
    await dialog.getByRole('button', { name: 'Abbrechen' }).click();
    await result.getByText(/abgebrochen/).waitFor();
    assert.deepEqual(errors, []);
    console.log(`Passwortdialog, Abbruch, kurze Unicode-Passwörter, Text/Code, Fehler, Rotation, Neuladen und 375px geprüft; ${requests} lokale HTTP-Anfragen, ${modelCalls} simulierte Modellaufrufe, keine Live-KI.`);
  } finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
