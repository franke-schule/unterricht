'use strict';
// Lokaler Browser-/Serverweg mit simulierten Einzelurteilen, ohne Modellaufrufe.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const vm = require('node:vm');
const { chromium } = require(process.env.SCW_PLAYWRIGHT_PACKAGE || path.join(os.homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
const { createHandler } = require('../handler');
const core = require('../evaluation-core');
process.argv.push('--repository');
const { server } = require('../browser-test-server');
process.argv.pop();
const repo = path.resolve(__dirname, '../..');
const quizFiles = [
  'faecher/informatik/klasse-10/1-Datenbanken/aufgabe1-quiz.js',
  'faecher/informatik/klasse-10/1-Datenbanken/aufgabe2-quiz.js',
  'faecher/informatik/klasse-10/1-Datenbanken/aufgabe3-quiz.js',
  'faecher/informatik/klasse-11/1-Kuenstliche-Intelligenz/aufgabe3a-quiz.mjs',
  ...['wdh2', 'aufgabe3', 'aufgabe4', 'aufgabe4-und-experiment', 'aufgabe5'].map(name => `faecher/physik/klasse-11/1-Kreisbewegungen/${name}-quiz.mjs`)
];

async function main() {
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  const origin = 'http://127.0.0.1:' + server.address().port;
  let browser, completed = false, calls = 0, nextResult, wrongMaximum = false;
  const errors = [];
  const handle = createHandler({ rateLimit: Infinity, env: {
    AI_API_KEY: 'mock', AI_PROJECT_ID: '11111111-1111-1111-1111-111111111111', AI_MODEL: 'mock-model', AI_EVALUATION_ENABLED: 'true'
  }, fetchImpl: async () => ({ ok: true, text: async () => JSON.stringify({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(nextResult) } }] }) }) });
  try {
    browser = await chromium.launch({ executablePath: process.env.SCW_CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', headless: true });
    const context = await browser.newContext({ viewport: { width: 1366, height: 800 } });
    await context.route('**/*', async route => {
      const request = route.request();
      if (request.url() === 'https://unterrichtkiichezbn4-ki-auswertung.functions.fnc.fr-par.scw.cloud/') {
        calls++;
        const payload = request.postDataJSON();
        const task = core.TASKS[payload.taskId];
        assert.ok(task?.feedbackCriteria, payload.taskId);
        if (wrongMaximum) {
          wrongMaximum = false;
          return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': origin }, body: JSON.stringify({
            type: 'GEMINI_EVALUATION_RESULT', requestId: payload.requestId,
            result: { ok: true, points: task.maxPoints + 1, maxPoints: task.maxPoints + 1, status: 'korrekt', strengths: [], missing: [], feedback: 'Alter Serverstand' }
          }) });
        }
        nextResult = { criteria: Object.fromEntries(task.feedbackCriteria.map(criterion => [criterion.id,
          { status: completed ? 'correct' : 'missing', evidence: completed ? [payload.answer] : [] }])) };
        const response = await handle({ httpMethod: 'POST', path: '/', headers: { 'Content-Type': 'application/json' }, body: request.postData() });
        return route.fulfill({ status: response.statusCode, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': origin }, body: response.body });
      }
      if (request.url().startsWith(origin + '/')) return route.continue();
      return route.abort();
    });
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    const screenshotRoot = path.join(repo, 'tmp/criterion-migration-browser');
    fs.mkdirSync(screenshotRoot, { recursive: true });
    for (const file of quizFiles) {
      const source = fs.readFileSync(path.join(repo, file), 'utf8');
      const key = source.match(/const STORAGE_KEY = ["']([^"']+)["']/)[1];
      const tasks = vm.runInNewContext(source.match(/const DESCRIBE_TASKS = (\[[\s\S]*?\n\]);/)[1]);
      const first = tasks[0];
      const text = 'Gespeicherte synthetische Antwort zur Prüfung des technischen Bewertungsvertrags.';
      await page.goto(origin + '/' + file.replace(/\.(?:mjs|js)$/, '.html'), { waitUntil: 'networkidle' });
      await page.evaluate(({ key, tasks, text }) => {
        localStorage.setItem(key, JSON.stringify({ version: 2,
          texts: Object.fromEntries(tasks.map(t => [t.id, text])),
          ai: Object.fromEntries(tasks.map(t => [t.id, { points: t.maxPoints, maxPoints: t.maxPoints, missing: [], strengths: [], feedback: 'Alter Stand', status: 'korrekt' }])),
          aiText: Object.fromEntries(tasks.map(t => [t.id, text])),
          first: { cloze: 1, sort: 1, mc: {}, describe: Object.fromEntries(tasks.map(t => [t.id, t.maxPoints])) },
          checked: { cloze: true, sort: true, mc: {} }, cloze: {}, sort: {}, mc: {}
        }));
      }, { key, tasks, text });
      await page.reload({ waitUntil: 'networkidle' });
      const input = page.locator('#describe-' + first.id);
      assert.equal(await input.inputValue(), text, file);
      assert.equal(await input.getAttribute('readonly'), null, file + ': alte Freigabe verwerfen');
      await input.fill(text + ' Erste neue Eingabe.');
      let stored = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
      for (const task of tasks) {
        assert.equal(stored.ai[task.id] ?? null, null, file + ': alte KI-Wertung');
        assert.equal(stored.aiText[task.id], '', file + ': alte Zuordnung');
        assert.equal(stored.first.describe[task.id], null, file + ': alte KI-Erstwertung');
        assert.equal(stored.assessmentVersions[task.id], '20261029-criteria-v1', file);
      }
      assert.equal(stored.first.cloze, 1, file + ': lokale Erstwertung erhalten');
      assert.equal(stored.first.sort, 1, file + ': lokale Erstwertung erhalten');
      const feedback = page.locator('#describe-' + first.id + '-feedback');
      wrongMaximum = true;
      await page.locator('#check-' + first.id).click();
      await feedback.getByText(/Die Antwort konnte gerade nicht automatisch bewertet werden/).waitFor();
      stored = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
      assert.equal(stored.first.describe[first.id], null, file + ': ungültige Bewertung zählt nicht als Versuch');
      assert.equal(stored.ai[first.id] ?? null, null, file + ': keine Freigabe aus anderem Punktvertrag');
      completed = false;
      await page.locator('#check-' + first.id).click();
      await feedback.getByText(`0 von ${first.maxPoints} Punkten`, { exact: true }).waitFor();
      assert.equal(await feedback.locator('li').count(), 1, file);
      assert.match(await feedback.innerText(), /Schritt 1 von/);
      await page.setViewportSize({ width: 390, height: 844 });
      assert.ok(await feedback.evaluate(node => node.getBoundingClientRect().width <= innerWidth), file + ': schmaler einzelner Hinweis');
      if (file.includes('physik/') && file.includes('aufgabe3-')) await feedback.screenshot({ path: path.join(screenshotRoot, 'quiz-next-step-mobile.png') });
      await page.setViewportSize({ width: 1366, height: 800 });
      await input.fill(text + ' Erneute Bearbeitung.');
      assert.equal(await feedback.isVisible(), false, file + ': veraltete Rückmeldung löschen');
      completed = true;
      await page.locator('#check-' + first.id).click();
      await feedback.getByText(`${first.maxPoints} von ${first.maxPoints} Punkten – Sehr gut, alles richtig`, { exact: true }).waitFor();
      stored = await page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);
      assert.equal(stored.first.describe[first.id], 0, file + ': erste neue Wertung bleibt erhalten');
      assert.equal(stored.ai[first.id].points, first.maxPoints, file);
      await page.setViewportSize({ width: 390, height: 844 });
      assert.ok(await feedback.evaluate(node => node.getBoundingClientRect().width <= innerWidth), file + ': schmale Feedbackanzeige');
      if (file.includes('physik/') && file.includes('aufgabe3-')) await feedback.screenshot({ path: path.join(screenshotRoot, 'quiz-feedback-mobile.png') });
      await page.reload({ waitUntil: 'networkidle' });
      assert.equal(await input.inputValue(), text + ' Erneute Bearbeitung.', file);
      assert.equal(await input.getAttribute('readonly'), '', file + ': aktuelle Freigabe wiederherstellen');
      await page.setViewportSize({ width: 1366, height: 800 });
    }
    // Gemeinsame Physikkarte: Bearbeitung während einer Anfrage und verspätete Antworten.
    await page.goto(origin + '/');
    await page.evaluate(async () => {
      document.body.innerHTML = '<label for="answer">Antwort</label><textarea id="answer"></textarea><button id="check">Antwort prüfen</button><div id="feedback" hidden aria-live="polite"></div><span id="count"></span>';
      const { setupPhysicsSemanticTask } = await import('/faecher/physik/klasse-11/1-Kreisbewegungen/components/physics-semantic-task.mjs');
      setupPhysicsSemanticTask({ answerId: 'answer', buttonId: 'check', feedbackId: 'feedback', countId: 'count', taskId: 'synthetic',
        evaluationFunction: () => new Promise(resolve => { globalThis.finishSynthetic = resolve; }) });
    });
    await page.fill('#answer', 'Die erste Antwort ist ausreichend lang für die technische Prüfung.');
    await page.click('#check');
    await page.fill('#answer', 'Die geänderte Antwort ist ausreichend lang für eine erneute Prüfung.');
    assert.equal(await page.locator('#feedback').isVisible(), false);
    await page.evaluate(() => finishSynthetic({ points: 2, maxPoints: 2, status: 'korrekt', missing: [], feedback: 'Sehr gut, alles richtig' }));
    assert.equal(await page.locator('#feedback').isVisible(), false, 'Verspätete Erfolgsantwort verwerfen');
    await page.click('#check');
    await page.evaluate(() => finishSynthetic({ points: 1, maxPoints: 2, status: 'teilweise korrekt', missing: ['Schritt 2 von 2: Prüfe die Richtung.', 'Zweiter unerlaubter Hinweis.'], feedback: '' }));
    await page.locator('#feedback strong').waitFor();
    assert.equal(await page.locator('#feedback li').count(), 1);
    await page.fill('#answer', 'Eine weitere Änderung entfernt die vorherige sichtbare Rückmeldung.');
    assert.equal(await page.locator('#feedback').isVisible(), false);
    assert.deepEqual(errors, []);
    assert.equal(calls, quizFiles.length * 3);
    console.log(`${quizFiles.length} Quizclients: gezielte Migration, Erstwertung, Eingabenerhalt, Neubewertung und breite/schmale Anzeige; Physikkarte: verspätete Antworten verworfen. ${calls} lokale Serveraufrufe ohne echtes Modell.`);
  } finally { await browser?.close(); await new Promise(resolve => server.close(resolve)); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
