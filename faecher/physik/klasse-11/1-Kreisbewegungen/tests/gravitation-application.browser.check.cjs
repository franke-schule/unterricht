// Lokaler Browsercheck ohne externe Anfragen: node <diese Datei>
const assert = require('node:assert/strict');
const path = require('node:path');
const os = require('node:os');
const { pathToFileURL } = require('node:url');
const { chromium } = require(process.env.SCW_PLAYWRIGHT_PACKAGE || path.join(os.homedir(), '.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright'));
process.argv.push('--repository');
const { server } = require('../../../../../scaleway-functions/browser-test-server');
process.argv.pop();

async function main() {
  const { APPLICATION_STEP_TASKS } = await import(pathToFileURL(path.join(__dirname, '../gravitation.mjs')));
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const origin = `http://127.0.0.1:${server.address().port}`;
  const pageUrl = origin + '/faecher/physik/klasse-11/1-Kreisbewegungen/aufgabe8.html';
  const storageKey = 'physik11-kreisbewegungen-aufgabe8-v1';
    const serviceUrl = 'https://unterrichtkiichezbn4-ki-auswertung.functions.fnc.fr-par.scw.cloud/';
    const evaluations = [];
    let pauseNextResponse = false;
    let releasePausedResponse;
  let browser;
  try {
    browser = await chromium.launch({ executablePath: process.env.SCW_CHROME_PATH || 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', headless: true });
    const context = await browser.newContext({ viewport: { width: 1366, height: 1000 } });
    await context.route('**/*', route => route.request().url().startsWith(origin) ? route.continue() : route.abort());
    await context.route(serviceUrl, async route => {
      const request = route.request().postDataJSON();
      const evaluation = evaluations.shift();
      assert.ok(evaluation, 'Jede semantische Prüfung verwendet eine explizit vorbereitete Mock-Antwort.');
      if (pauseNextResponse) {
        pauseNextResponse = false;
        await new Promise(resolve => { releasePausedResponse = resolve; });
      }
      await route.fulfill({ status: evaluation.httpStatus || 200, contentType: 'application/json', body: JSON.stringify({
        requestId: request.requestId,
        type: 'GEMINI_EVALUATION_RESULT',
        result: evaluation.result
      }) });
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(pageUrl);
    await page.locator('#tab-application').click();
    for (const [tab, area, suffix] of [
      ['tab-application', 'panel-application', 'application'],
      ['tab-summary', 'panel-summary', 'summary'],
      ['tab-quiz', 'panel-quiz', '']
    ]) {
      await page.locator(`#${tab}`).click();
      const section = page.locator(`#${area} .solution-download`);
      await section.locator('details summary').click();
      const code = section.locator('input[name="solution-code"]');
      const button = section.getByRole('button', { name: 'Code prüfen' });
      assert.match(await button.getAttribute('class'), /physics-primary-button/);
      await code.fill('R4VP-DNH6');
      await button.click();
      assert.equal(await section.locator('a.download-button').isVisible(), true, `Lehrercodefreigabe im Reiter ${suffix || 'quiz'}`);
    }
    await page.locator('#tab-application').click();
    const saved = () => page.evaluate(key => JSON.parse(localStorage.getItem(key)).parts, storageKey);
    const queueEvaluation = result => evaluations.push({ result });
    const queueServerError = () => evaluations.push({ httpStatus: 500, result: { ok: false, message: 'private technische Antwort' } });
    const checkExplanation = async result => {
      queueEvaluation(result);
      await page.locator('#check-a1-explanation').click();
      const password = page.locator('#ai-access-password');
      if (await password.count()) {
        await password.fill('lokaler-test');
        await page.getByRole('button', { name: 'Prüfung starten' }).click();
      }
    };
    const result = (points, missing = []) => ({ ok: true, points, maxPoints: 2,
      status: points === 2 ? 'korrekt' : points ? 'teilweise korrekt' : 'noch nicht korrekt',
      strengths: [], missing, feedback: points === 2 ? 'Sehr gut, alles richtig' : missing[0] || '' });
    const enter = async (key, value, unit, prefix = 'a1') => {
      await page.locator(`#${prefix}-${key}`).fill(value);
      await page.locator(`#${prefix}-${key}-unit`).selectOption(unit);
    };
    await enter('force', '1,5', 'kg');
    await page.locator('#check-a1-force').click();
    assert.match(await page.locator('#feedback-a1-force').getAttribute('class'), /error/);
    await enter('force', '1,50', 'N');
    await page.locator('#check-a1-force').click();
    assert.match(await page.locator('#feedback-a1-force').getAttribute('class'), /partial/);
    await enter('force', '1,5', 'N');
    await page.locator('#check-a1-force').click();
    await enter('apple', '9,8', 'm/s²');
    await page.locator('#check-a1-apple').click();
    await enter('earth', '2,5e-25', 'm/s²');
    assert.equal((await saved())['numeric-checks'].A1.numberPassed, false);
    await page.reload();
    assert.equal(await page.locator('#a1-earth').inputValue(), '2,5e-25');
    assert.equal((await saved())['numeric-checks'].A1.numberChecks.force, true);
    for (const value of ['2,5e-25', '2,5·10^-25', '2,5*10^-25', '2,5 * 10 ^ -25']) {
      await enter('earth', value, 'm/s²');
      await page.locator('#check-a1-earth').click();
      assert.match(await page.locator('#feedback-a1-earth').getAttribute('class'), /success/);
    }
    assert.equal((await saved()).completed.includes('A1'), false); // Erklärung fehlt.
    assert.equal(await page.locator('#a1-why').count(), 0);
    assert.equal(await page.locator('#a2-why').count(), 0);
    await page.locator('#a1-explanation-answer').fill('kurz');
    await page.locator('#check-a1-explanation').click();
    assert.equal(await page.locator('#a1-explanation-feedback').innerText(), 'Erkläre in eigenen Worten, wie die Kräfte und die Massen mit den beiden Beschleunigungen zusammenhängen.');
    await page.locator('#a1-explanation-answer').fill('Die Kräfte sind gleich groß, deshalb genügt ein Kraftbetrag. Bei gleicher Kraft beschleunigt die viel massereichere Erde nach a = F/m viel weniger.');
    await checkExplanation(result(1, ['Schritt 2 von 2 – Massen und Beschleunigungen: Vergleiche die Massen von Apfel und Erde und nutze den Zusammenhang zwischen Kraft, Masse und Beschleunigung.']));
    await page.locator('#a1-explanation-feedback').getByText('Schritt 2 von 2', { exact: false }).waitFor();
    assert.equal((await saved()).completed.includes('A1'), false);
    await checkExplanation(result(2));
    await page.locator('#a1-explanation-feedback').getByText('Sehr gut, alles richtig', { exact: false }).waitFor();
    assert.equal((await saved()).completed.includes('A1'), true);
    assert.equal((await saved())['a1-semantic-review'].passed, true);
    await page.reload();
    assert.equal((await saved()).completed.includes('A1'), true);
    assert.equal((await saved())['a1-semantic-review'].answer, await page.locator('#a1-explanation-answer').inputValue());
    await page.locator('#a1-explanation-answer').fill('Die Erde übt eine Kraft auf den Apfel aus, und der Apfel auf die Erde. Bei gleicher Kraft und viel größerer Erdmasse ist die Beschleunigung der Erde viel kleiner.');
    assert.equal((await saved()).completed.includes('A1'), false);
    assert.equal(await page.locator('#a1-explanation-feedback').isHidden(), true);
    queueEvaluation(result(2));
    pauseNextResponse = true;
    await page.locator('#check-a1-explanation').click();
    const pendingPassword = page.locator('#ai-access-password');
    if (await pendingPassword.count()) {
      await pendingPassword.fill('lokaler-test');
      await page.getByRole('button', { name: 'Prüfung starten' }).click();
    }
    await page.waitForRequest(request => request.url() === serviceUrl);
    while (!releasePausedResponse) await new Promise(resolve => setTimeout(resolve, 10));
    await page.locator('#a1-explanation-answer').fill('Die Antwort wurde während der laufenden Prüfung verändert; dieses alte Ergebnis darf sie nicht freigeben.');
    const lateResponse = page.waitForResponse(response => response.url() === serviceUrl);
    releasePausedResponse();
    await lateResponse;
    await page.waitForTimeout(50);
    assert.equal(await page.locator('#a1-explanation-feedback').isHidden(), true);
    assert.equal((await saved()).completed.includes('A1'), false);
    await checkExplanation(result(0, ['Schritt 1 von 2 – Gleiche Kraftbeträge: Benenne beide Kräfte mit ‚Kraft von … auf …‘ und vergleiche ihre Beträge.']));
    await page.locator('#a1-explanation-feedback').getByText('Schritt 1 von 2', { exact: false }).waitFor();
    queueServerError();
    await page.locator('#check-a1-explanation').click();
    await page.locator('#a1-explanation-feedback').getByText('Die Erklärung konnte gerade nicht geprüft werden. Bitte versuche es erneut.', { exact: true }).waitFor();
    assert.equal((await saved()).completed.includes('A1'), false);
    await checkExplanation(result(2));
    await page.locator('#a1-explanation-feedback').getByText('Sehr gut, alles richtig', { exact: false }).waitFor();
    assert.equal((await saved()).completed.includes('A1'), true);
    await enter('orbit', '5,4e2', 'N', 'a2');
    await page.locator('#check-a2-orbit').click();
    assert.equal((await saved()).completed.includes('A2'), false);
    await enter('ground', '6,1e2', 'N', 'a2');
    await page.locator('#check-a2-ground').click();
    assert.equal((await saved()).completed.includes('A2'), true);
    await enter('force', '1,6', 'N');
    assert.equal((await saved()).completed.includes('A1'), false);
    assert.equal(await page.locator('#feedback-a1-force').isHidden(), true);
    assert.equal(await page.locator('#feedback-a1-earth').isHidden(), true); // Feedback wird nach Reload absichtlich nicht wiederhergestellt.
    assert.equal((await saved())['numeric-checks'].A1.numberChecks.earth, true);

    await page.locator('#tab-fast').click();
    assert.equal(await page.locator('#a5-ratio').count(), 1); // Die gespeicherte A5-Eingabe-ID bleibt erhalten.
    assert.equal(await page.locator('label[for="a5-ratio"]').innerText(), 'Radienverhältnis (3 gültige Ziffern)');
    assert.equal(await page.locator('#check-a5-ratio').innerText(), 'Radienverhältnis prüfen');
    assert.equal(await page.locator('#a5-ratio-unit').getAttribute('aria-label'), 'Einheit für Radienverhältnis');
    const legacyParts = await saved();
    legacyParts.completed = [...new Set([...(legacyParts.completed || []), 'A5'])];
    await page.evaluate(({ key, parts }) => {
      const record = JSON.parse(localStorage.getItem(key));
      record.parts = parts;
      localStorage.setItem(key, JSON.stringify(record));
    }, { key: storageKey, parts: legacyParts });
    await page.reload();
    await page.locator('#tab-fast').click();
    assert.equal((await saved()).completed.includes('A5'), false); // Alter setupRatio-Abschluss ohne neue Einheitenwahl.

    await page.locator('#a3-g').fill('1,626');
    await page.locator('#a3-g-unit').selectOption('N');
    await page.locator('#check-a3-g').click();
    assert.match(await page.locator('#feedback-a3-g').getAttribute('class'), /error/);
    await page.locator('#a3-g').fill('162,6');
    await page.locator('#a3-g-unit').selectOption('cm/s²');
    await page.locator('#check-a3-g').click();
    assert.match(await page.locator('#feedback-a3-g').getAttribute('class'), /success/);
    assert.equal((await saved()).completed.includes('A3'), false); // Der Vergleich wird getrennt geprüft.
    await page.locator('#a3-comparison').selectOption('no');
    await page.locator('#check-a3-comparison').click();
    assert.match(await page.locator('#feedback-a3-comparison').getAttribute('class'), /error/);
    await page.locator('#a3-comparison').selectOption('yes');
    await page.locator('#check-a3-comparison').click();
    assert.equal((await saved()).completed.includes('A3'), true);
    await page.locator('#a3-comparison').selectOption('no');
    assert.equal((await saved()).completed.includes('A3'), false);
    assert.equal(await page.locator('#feedback-a3-comparison').isHidden(), true);
    await page.locator('#a3-comparison').selectOption('yes');
    await page.locator('#check-a3-comparison').click();
    await page.locator('#a3-g').fill('1,626');
    await page.locator('#a3-g-unit').selectOption('m/s²');
    assert.equal((await saved()).completed.includes('A3'), false);
    assert.equal(await page.locator('#feedback-a3-g').isHidden(), true);
    await page.locator('#check-a3-g').click();
    assert.equal((await saved()).completed.includes('A3'), true);

    await page.locator('#a4-radius').fill('3,40*10^3');
    await page.locator('#a4-radius-unit').selectOption('km');
    await page.locator('#check-a4-radius').click();
    assert.match(await page.locator('#feedback-a4-radius').getAttribute('class'), /partial/);
    assert.equal(await page.locator('#feedback-a4-radius').innerText(), 'Dein Rechenwert ist grundsätzlich passend. Runde das Endergebnis noch auf die geforderte Anzahl gültiger Ziffern.');
    await page.locator('#a4-radius').fill('3,4*10^3');
    await page.locator('#a4-radius-unit').selectOption('km');
    await page.locator('#check-a4-radius').click();
    assert.equal((await saved()).completed.includes('A4'), true);
    await page.locator('#a4-radius').fill('3,4e6');
    await page.locator('#a4-radius-unit').selectOption('m');
    assert.equal((await saved()).completed.includes('A4'), false);
    assert.equal(await page.locator('#feedback-a4-radius').isHidden(), true);
    await page.locator('#check-a4-radius').click();
    assert.match(await page.locator('#feedback-a4-radius').getAttribute('class'), /success/);
    await page.locator('#a4-radius-unit').selectOption('cm');
    assert.equal((await saved()).completed.includes('A4'), false);
    await page.locator('#check-a4-radius').click();
    assert.equal(await page.locator('#feedback-a4-radius').innerText(), 'Prüfe deinen Zahlenwert, die Einheit und die Anzahl der gültigen Ziffern.');
    await page.locator('#a4-radius').fill('3,4e6');
    await page.locator('#a4-radius-unit').selectOption('m');
    await page.locator('#check-a4-radius').click();
    assert.equal((await saved()).completed.includes('A4'), true);

    await page.locator('#a5-ratio').fill('0,707');
    await page.locator('#check-a5-ratio').click();
    assert.equal(await page.locator('#feedback-a5-ratio').innerText(), 'Prüfe deinen Zahlenwert, die Einheit und die Anzahl der gültigen Ziffern.');
    assert.equal((await saved()).completed.includes('A5'), false); // Leere Einheit ist keine Antwort.
    await page.locator('#a5-ratio-unit').selectOption('m');
    await page.locator('#check-a5-ratio').click();
    assert.match(await page.locator('#feedback-a5-ratio').getAttribute('class'), /error/);
    await page.locator('#a5-ratio-unit').selectOption({ label: 'ohne Einheit' });
    await page.locator('#check-a5-ratio').click();
    assert.equal(await page.locator('#feedback-a5-ratio').innerText(), 'Richtig. Zahlenwert, Einheit und die Anzahl der gültigen Ziffern stimmen.');
    assert.equal((await saved()).completed.includes('A5'), true);
    await page.locator('#a5-ratio').fill('0,7071');
    assert.equal((await saved()).completed.includes('A5'), false);
    assert.equal(await page.locator('#feedback-a5-ratio').isHidden(), true);
    await page.locator('#a5-ratio').fill('0,707');
    await page.locator('#check-a5-ratio').click();
    assert.equal((await saved()).completed.includes('A5'), true);
    await page.reload();
    await page.locator('#tab-fast').click();
    assert.equal(await page.locator('#a5-ratio').inputValue(), '0,707');
    assert.equal(await page.locator('#a5-ratio-unit').inputValue(), 'ohne Einheit');
    assert.equal((await saved())['numeric-checks'].A5.numberChecks.ratio, true);
    assert.equal((await saved()).completed.includes('A5'), true);

    for (const [id, columns] of Object.entries(APPLICATION_STEP_TASKS)) {
      await page.locator(id === 'A1' || id === 'A2' ? '#tab-application' : '#tab-fast').click();
      const help = page.locator(`#card-${id.toLowerCase()} .physics-help-stack details`).last();
      const helpText = await help.locator('p').first().innerHTML();
      if (id === 'A1') assert.match(helpText, /^m<sub>Apfel<\/sub>=0,150 kg; F≈1,474 N\. Für beide Beschleunigungen gilt a=<span class="physics-fraction" role="img" aria-label="F durch m"><span class="physics-fraction__numerator">F<\/span><span class="physics-fraction__denominator">m<\/span><\/span>, aber mit verschiedener Masse\.$/);
      if (id === 'A2') assert.match(helpText, /^Verwende r<sub>Orbit<\/sub>=6770 km und r<sub>Boden<\/sub>=6370 km\. Die Orbitkraft ist noch deutlich von null verschieden\.$/);
      if (id === 'A3') {
        assert.match(helpText, /^Setze M=7,349·10²² kg und R=1,737·10⁶ m ein; der Rechenwert liegt nahe 1,63 /);
        assert.match(helpText, /<span class="physics-fraction" role="img" aria-label="m durch s²"><span class="physics-fraction__numerator">m<\/span><span class="physics-fraction__denominator">s²<\/span><\/span>\.$/);
      }
      if (id === 'A4') {
        assert.match(helpText, /^Ziehe die Wurzel aus /);
        assert.match(helpText, /<span class="physics-fraction" role="img" aria-label="G·M durch g"><span class="physics-fraction__numerator">G·M<\/span><span class="physics-fraction__denominator">g<\/span><\/span>; vor Rundung sind es etwa 3402 km\.$/);
      }
      if (id === 'A5') {
        assert.match(helpText, /^Das gesuchte Verhältnis ist √\(<span class="physics-fraction" role="img" aria-label="MMerkur durch MMars"><span class="physics-fraction__numerator">M<sub>Merkur<\/sub><\/span><span class="physics-fraction__denominator">M<sub>Mars<\/sub><\/span><\/span>\)=√0,5\.$/);
      }
      await help.locator('summary').click();
      assert.equal(await help.locator('.grav-calculation-column').count(), columns.length);
      if (['A3', 'A4', 'A5'].includes(id)) {
        assert.equal(await help.locator('.grav-calculation-columns').getAttribute('class'), 'grav-calculation-columns grav-calculation-columns--single');
        assert.equal(await help.locator('.grav-calculation-column').count(), 1);
      }
      for (const config of columns) {
        const prefix = `${id.toLowerCase()}-${config.key}`;
        const board = page.locator(`#${prefix}-steps`);
        await page.locator(`#check-${prefix}-steps`).click();
        if (['A3', 'A4', 'A5'].includes(id)) {
          assert.match(await page.locator(`#${prefix}-steps-feedback`).innerText(), /Fülle zuerst/);
          const accepted = config.acceptedOrders[0];
          const swapped = [...accepted];
          [swapped[0], swapped[1]] = [swapped[1], swapped[0]];
          for (const [index, key] of swapped.entries()) {
            await board.getByRole('button', { name: config.cards.find(card => card.id === key).spoken, exact: true }).click();
            await board.locator('.formula-slot').nth(index).click();
          }
          await page.locator(`#check-${prefix}-steps`).click();
          assert.equal(await page.locator(`#${prefix}-steps-feedback`).innerText(), 'Teilweise korrekt. Prüfe die Reihenfolge von Ansatz, Einsetzen und Rundung.');
          await page.locator(`#reset-${prefix}-steps`).click();
          const fullyWrong = [accepted[1], accepted[0], accepted[3], accepted[2]];
          for (const [index, key] of fullyWrong.entries()) {
            await board.getByRole('button', { name: config.cards.find(card => card.id === key).spoken, exact: true }).click();
            await board.locator('.formula-slot').nth(index).click();
          }
          await page.locator(`#check-${prefix}-steps`).click();
          assert.equal(await page.locator(`#${prefix}-steps-feedback`).innerText(), 'Noch nicht korrekt. Beginne mit dem Ansatz und runde erst das Endergebnis.');
          await page.locator(`#reset-${prefix}-steps`).click();
        } else assert.match(await page.locator(`#${prefix}-steps-feedback`).innerText(), /Fülle zuerst/);
        for (const [index, key] of config.acceptedOrders[0].entries()) {
          await board.getByRole('button', { name: config.cards.find(card => card.id === key).spoken, exact: true }).click();
          await board.locator('.formula-slot').nth(index).click();
        }
        await page.locator(`#check-${prefix}-steps`).click();
        assert.match(await page.locator(`#${prefix}-steps-feedback`).getAttribute('class'), /success/);
        assert.equal(await board.locator('.cloze-token').count(), 1);
      }
    }
    const before = (await saved())['step-order:a1-earth-steps'].values;
    const fastStepKeys = ['a3-moon', 'a4-mars', 'a5-ratio'];
    const savedSteps = await saved();
    const beforeFast = Object.fromEntries(fastStepKeys.map(key => [key, savedSteps[`step-order:${key}-steps`].values]));
    await page.locator('.back-link').first().click();
    await page.goto(pageUrl);
    await page.locator('#tab-application').click();
    assert.deepEqual((await saved())['step-order:a1-earth-steps'].values, before);
    assert.equal(await page.locator('#panel-application').isVisible(), true);
    await page.locator('#tab-fast').click();
    for (const key of fastStepKeys) assert.deepEqual((await saved())[`step-order:${key}-steps`].values, beforeFast[key]);
    await page.locator('#tab-application').click();
    const columns = page.locator('#card-a1 .grav-calculation-column');
    const boxes = await Promise.all([0, 1, 2].map(i => columns.nth(i).boundingBox()));
    assert.equal(boxes[0].y, boxes[1].y);
    assert.ok(boxes[0].x < boxes[1].x && boxes[1].x < boxes[2].x);
    await page.screenshot({ path: path.join(os.tmpdir(), 'gravitation-application-desktop.png'), fullPage: true });
    await page.locator('#tab-fast').click();
    await page.screenshot({ path: path.join(os.tmpdir(), 'gravitation-fast-desktop.png'), fullPage: true });
    for (const width of [1366, 768, 390]) {
      await page.setViewportSize({ width, height: 1000 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `Seitenüberlauf bei ${width}px`);
      await page.locator('#tab-fast').click();
      for (const id of ['a3-g', 'a4-radius', 'a5-ratio']) {
        const sizes = await page.locator(`#${id}`).evaluate(input => {
          const field = input.closest('.physics-number-entry').getBoundingClientRect();
          const number = input.getBoundingClientRect();
          const unit = document.getElementById(`${input.id}-unit`).getBoundingClientRect();
          const button = document.getElementById(`check-${input.id}`).getBoundingClientRect();
          return { fieldWidth: field.width, inputWidth: number.width, inputTop: number.top, inputRight: number.right,
            unitWidth: unit.width, unitTop: unit.top, unitLeft: unit.left, buttonWidth: button.width, buttonHeight: button.height };
        });
        assert.ok(sizes.inputWidth > 0 && sizes.unitLeft >= sizes.inputRight && Math.abs(sizes.inputTop - sizes.unitTop) < 1, `Zahl und Einheit stehen bei ${width}px nicht nebeneinander (${id}).`);
        assert.ok(id === 'a5-ratio' ? sizes.unitWidth >= 135 : sizes.unitWidth < sizes.inputWidth, `Einheitenauswahl ist bei ${width}px nicht passend breit (${id}).`);
        assert.ok(sizes.buttonWidth < sizes.fieldWidth && sizes.buttonHeight >= 44, `Ergebnisbutton ist bei ${width}px nicht passend dimensioniert (${id}).`);
      }
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true, `Seitenüberlauf im schnellen Reiter bei ${width}px`);
      for (const slot of await page.locator('#panel-fast .step-order .formula-slot').all()) assert.equal(await slot.evaluate(el => el.scrollWidth <= el.clientWidth + 1), true, `Sortierkarten-Überlauf bei ${width}px`);
      await page.locator('#tab-application').click();
      const sizes = await page.locator('#a1-earth').evaluate(input => ({ input: input.getBoundingClientRect().width, unit: document.getElementById('a1-earth-unit').getBoundingClientRect().width }));
      assert.ok(sizes.unit < sizes.input);
      for (const slot of await page.locator('#panel-application .step-order .formula-slot').all()) {
        assert.equal(await slot.evaluate(el => el.scrollWidth <= el.clientWidth + 1), true, `Kartenüberlauf bei ${width}px`);
      }
    }
    await page.screenshot({ path: path.join(os.tmpdir(), 'gravitation-application-mobile.png'), fullPage: true });
    await page.locator('#tab-fast').click();
    await page.screenshot({ path: path.join(os.tmpdir(), 'gravitation-fast-mobile.png'), fullPage: true });
    for (const id of ['a3-moon', 'a4-mars', 'a5-ratio']) {
      await page.locator(`#reset-${id}-steps`).click();
      assert.deepEqual((await saved())[`step-order:${id}-steps`].values, ['', '', '', '']);
    }
    await page.locator('#tab-application').click();
    await page.locator('#reset-a1-earth-steps').click();
    await page.reload();
    assert.deepEqual((await saved())['step-order:a1-earth-steps'].values, ['', '', '', '']);
    for (const id of ['a3-moon', 'a4-mars', 'a5-ratio']) assert.deepEqual((await saved())[`step-order:${id}-steps`].values, ['', '', '', '']);
    assert.deepEqual(errors, []);
    console.log('OK: Einzelprüfungen, Potenzschreibweisen, A1-Freitext, A3–A5 Einheiten/Abschluss, Änderung, Speicherung/Wiederherstellung, acht Sortierspalten, Reset und Layout bei 1366/768/390 px.');
  } finally {
    await browser?.close();
    await new Promise(resolve => server.close(resolve));
  }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
