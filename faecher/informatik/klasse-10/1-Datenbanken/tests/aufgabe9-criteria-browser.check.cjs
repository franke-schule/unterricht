'use strict';
// Lokaler Browser-/Server-Vertragstest mit simulierten Einzelurteilen, ohne Modellaufrufe.
const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');
const { chromium } = require(process.env.SCW_PLAYWRIGHT_PACKAGE || path.join(os.homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const { createHandler } = require('../../../../../scaleway-functions/handler');
const core = require('../../../../../scaleway-functions/evaluation-core');
const facts = require('../../../../../scaleway-functions/tests/fixtures/aufgabe9-criterion-facts');
process.argv.push('--repository');
const { server } = require('../../../../../scaleway-functions/browser-test-server');
process.argv.pop();

async function main() {
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const origin = 'http://127.0.0.1:' + server.address().port;
  let browser;
  const errors = []; let calls = 0; let model; let legacyResponse = false; let technicalError = false;
  const handle = createHandler({ rateLimit: Infinity, env: {
    AI_API_KEY: 'mock', AI_PROJECT_ID: '11111111-1111-1111-1111-111111111111', AI_MODEL: 'gpt-oss-120b', AI_EVALUATION_ENABLED: 'true'
  }, fetchImpl: async () => ({ ok: true, status: 200, text: async () => JSON.stringify({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(model) } }] }) }) });
  try {
    browser = await chromium.launch({ executablePath: process.env.SCW_CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true });
    const context = await browser.newContext({ viewport: { width: 1366, height: 800 } });
    await context.route('**/*', async route => {
      const request = route.request(); const url = request.url();
      if (url === 'https://unterrichtkiichezbn4-ki-auswertung.functions.fnc.fr-par.scw.cloud/') {
        calls++;
        if (technicalError) {
          technicalError = false;
          return route.fulfill({ status: 502, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': origin }, body: JSON.stringify({
            type: 'GEMINI_EVALUATION_RESULT', requestId: request.postDataJSON().requestId,
            result: { ok: false, message: 'Das Modell hat keine gültige Bewertung geliefert. Bitte versuche es erneut.' }
          }) });
        }
        if (legacyResponse) {
          legacyResponse = false;
          return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': origin }, body: JSON.stringify({
            type: 'GEMINI_EVALUATION_RESULT', requestId: request.postDataJSON().requestId,
            result: { ok: true, points: 4, maxPoints: 4, status: 'korrekt', strengths: [], missing: [], feedback: 'Sehr gut, alles richtig' }
          }) });
        }
        const response = await handle({ httpMethod: 'POST', path: '/', headers: { 'Content-Type': 'application/json' }, body: request.postData() });
        return route.fulfill({ status: response.statusCode, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': origin }, body: response.body });
      }
      if (url.startsWith(origin + '/')) return route.continue();
      return route.abort();
    });
    const page = await context.newPage(); page.on('pageerror', error => errors.push(error.message));
    await page.goto(origin + '/faecher/informatik/klasse-10/1-Datenbanken/aufgabe9.html', { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.getElementById('data-status')?.classList.contains('success'), null, { timeout: 120000 });
    // Alter Vier-Punkte-Stand: nur die betroffenen Freigaben verwerfen.
    await page.evaluate(facts => {
      const answers = { P1: 'Vorhandene SQL-Eingabe' };
      for (const [id, quotes] of Object.entries(facts)) answers[id] = quotes.slice(0, 4).join(' ');
      localStorage.setItem('inf10-insta-verbund-aufgabe9-v1', JSON.stringify({ answers, completed: { ...answers },
        quiz: { 0: ['a', 'b'], 1: ['a', 'b'], 2: ['a'], 3: ['a', 'b'] }, quizPassed: true }));
    }, facts);
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.getElementById('data-status')?.classList.contains('success'), null, { timeout: 120000 });
    const migrated = await page.evaluate(() => JSON.parse(localStorage.getItem('inf10-insta-verbund-aufgabe9-v1')));
    for (const id of Object.keys(facts)) { assert.equal(migrated.completed[id], undefined); assert.equal(migrated.answers[id], facts[id].slice(0, 4).join(' ')); }
    assert.equal(migrated.completed.P1, 'Vorhandene SQL-Eingabe');
    assert.equal(migrated.quizPassed, true);
    await page.click('#tab-practice');
    legacyResponse = true;
    await page.locator('#task-P2 .primary-button').first().click();
    await page.waitForFunction(() => document.querySelector('#task-P2 .server-feedback.error'));
    assert.doesNotMatch(await page.locator('#task-P2 .server-feedback').innerText(), /4 von 4/);
    assert.match(await page.locator('#task-P2 .server-feedback').innerText(), /unerwartetes Format/);
    technicalError = true;
    await page.locator('#task-P2 .primary-button').first().click();
    await page.waitForFunction(() => document.querySelector('#task-P2 .server-feedback')?.textContent.includes('Das Modell hat keine gültige Bewertung geliefert.'));
    assert.equal(await page.locator('#input-P2').inputValue(), facts.P2.slice(0, 4).join(' '));
    const failed = await page.evaluate(() => JSON.parse(localStorage.getItem('inf10-insta-verbund-aufgabe9-v1')));
    assert.equal(failed.completed.P2, undefined);
    for (const [id, quotes] of Object.entries(facts)) {
      const task = core.TASKS['inf10-db-a9-' + id.toLowerCase()];
      await page.click('#tab-' + (Number(id.slice(1)) <= 6 ? 'practice' : 'count'));
      for (let completed = 0; completed <= 5; completed++) {
        model = { criteria: Object.fromEntries(task.feedbackCriteria.map((criterion, index) => [criterion.id,
          { status: index < completed ? 'correct' : 'missing', evidence: index < completed ? [quotes[index]] : [] }])) };
        await page.fill('#input-' + id, quotes.slice(0, completed).join(' ') || 'Meine Erklärung ist noch nicht fertig.');
        // Eine Bearbeitung entfernt die vorherige Rückmeldung vollständig.
        assert.equal(await page.locator(`#task-${id} .server-feedback`).count(), 0);
        await page.locator(`#task-${id} .primary-button`).first().click();
        await page.waitForFunction(({ id, completed }) => {
          const node = document.querySelector(`#task-${id} .server-feedback`);
          return node?.textContent.includes(`${completed} von 5 Punkten`);
        }, { id, completed });
        const feedback = page.locator(`#task-${id} .server-feedback`);
        if (completed < 5) {
          assert.equal(await feedback.locator('li').count(), 1);
          assert.match(await feedback.innerText(), new RegExp(`Schritt ${completed + 1} von 5`));
          const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('inf10-insta-verbund-aufgabe9-v1')));
          assert.equal(stored.completed[id], undefined);
        } else {
          assert.equal(await feedback.locator('li').count(), 0);
          assert.match(await feedback.innerText(), /Sehr gut, alles richtig/);
        }
      }
    }
    assert.equal(calls, 26);
    // Eine frühere korrekte Bearbeitung darf nach einer Textänderung nicht weiter freischalten.
    await page.fill('#input-P11', facts.P11[0]);
    assert.equal(await page.locator('#task-P11 .server-feedback').count(), 0);
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('inf10-insta-verbund-aufgabe9-v1')));
    assert.notEqual(stored.completed.P11, stored.answers.P11);
    await page.setViewportSize({ width: 390, height: 800 });
    model = { criteria: Object.fromEntries(core.TASKS['inf10-db-a9-p11'].feedbackCriteria.map((criterion, index) => [criterion.id,
      { status: index === 0 ? 'correct' : 'missing', evidence: index === 0 ? [facts.P11[0]] : [] }])) };
    await page.locator('#task-P11 .primary-button').first().click();
    await page.waitForFunction(() => document.querySelector('#task-P11 .server-feedback')?.textContent.includes('Schritt 2 von 5'));
    assert.equal(await page.locator('#task-P11 .server-feedback li').count(), 1);
    const metrics = await page.evaluate(() => ({ page: document.documentElement.scrollWidth, viewport: document.documentElement.clientWidth }));
    assert.ok(metrics.page <= metrics.viewport + 2, JSON.stringify(metrics));
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.getElementById('data-status')?.classList.contains('success'), null, { timeout: 120000 });
    await page.click('#tab-count');
    assert.equal(await page.locator('#input-P11').inputValue(), facts.P11[0]);
    assert.equal(await page.locator('#task-P11 .server-feedback').count(), 0);
    assert.equal(await page.locator('#tab-summary').isDisabled(), true);
    const restored = await page.evaluate(() => JSON.parse(localStorage.getItem('inf10-insta-verbund-aufgabe9-v1')));
    assert.equal(restored.completed.P2, facts.P2.join(' '));
    assert.equal(restored.assessmentVersions.P2, '20261029-ordering');
    assert.deepEqual(errors, []);
    console.log('A9: 27 simulierte Serverprüfungen; Fehlerursachen, ein nächster Schritt, aktuelle Punkte, Bearbeitung/Speicherung und Smartphone-Anzeige erfolgreich.');
  } finally { await browser?.close(); await new Promise(resolve => server.close(resolve)); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
