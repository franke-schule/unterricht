'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { root, pagePath, codePagePath } = require('../prepare-website-test');
// Separater HTTP-Test nach prepare-website-test.js; nutzt einen freien Port.
process.argv.push('--website');
const { server } = require('../browser-test-server');
process.argv.pop();

test('Website-Testserver liefert Pilot und IDE-Ressourcen, sperrt Originalseiten und Quellen', async () => {
  if (!fs.existsSync(root + '/test-copy-manifest.json')) {
    throw new Error('Zuerst prepare-website-test.js ausführen.');
  }
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const base = 'http://127.0.0.1:' + server.address().port;
  try {
    const redirect = await fetch(base, { redirect: 'manual' });
    assert.equal(redirect.status, 302);
    assert.equal(redirect.headers.get('location'), '/' + pagePath);
    const page = await fetch(base + '/' + pagePath);
    assert.equal(page.status, 200);
    assert.match(await page.text(), /Lokale Scaleway-Testkopie/);
    const codePage = await fetch(base + '/' + codePagePath);
    assert.equal(codePage.status, 200);
    assert.match(await codePage.text(), /async function submitCode/);
    for (const [resource, contentType] of [
      ['/include/js/includeide/includeIDE.js', 'text/javascript'],
      ['/include/online-ide-embedded.js', 'text/javascript'],
      ['/include/online-ide-embedded.css', 'text/css'],
      ['/include/assets/graphics/robot/minecraft_steve/scene.gltf', 'model/gltf+json'],
      ['/include/assets/graphics/robot/minecraft_steve/scene.bin', 'application/octet-stream'],
      ['/faecher/informatik/klasse-9/eingaben-speichern.js?v=20260924', 'text/javascript'],
      ['/faecher/informatik/quiz-fragen-pruefen.js?v=20261006b', 'text/javascript'],
      ['/' + pagePath.replace('aufgabe1.html', 'sicherungsblatt-aufgabe-1-loesungen.pdf'), 'application/pdf']
    ]) {
      const response = await fetch(base + resource);
      assert.equal(response.status, 200, resource);
      assert.ok(response.headers.get('content-type').startsWith(contentType), resource);
      await response.arrayBuffer();
    }
    for (const resource of ['/apps-script/Config.gs', '/test-copy-manifest.json',
      '/include/%2e%2e%2fapps-script/Config.gs', '/' + pagePath.replace('aufgabe1', 'aufgabe2')]) {
      assert.equal((await fetch(base + resource)).status, 404, resource);
    }
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
