'use strict';

// Stellt die Diagnose oder die getrennte Website-Testkopie bereit. Kein API-Proxy.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { root, pagePath, codePagePath, sharedClient } = require('./prepare-website-test');

const websiteMode = process.argv.includes('--website');
const repositoryMode = process.argv.includes('--repository');
const repositoryRoot = path.resolve(__dirname, '..');
if (websiteMode && !repositoryMode && !fs.existsSync(path.join(root, 'test-copy-manifest.json'))) {
  console.error('Zuerst node scaleway-functions/prepare-website-test.js ausführen.');
  process.exit(1);
}
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json', '.wasm': 'application/wasm', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
  '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff': 'font/woff',
  '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.pdf': 'application/pdf',
  '.map': 'application/json', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg',
  '.gltf': 'model/gltf+json', '.glb': 'model/gltf-binary', '.bin': 'application/octet-stream' };
mime['.csv'] = 'text/csv; charset=utf-8';
const sharedHeaders = { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer' };

function websiteFile(rawUrl) {
  let relative;
  try { relative = decodeURIComponent(rawUrl.split('?')[0]).replace(/^\//, ''); } catch { return null; }
  if (relative.includes('\\') || relative.includes('\0') ||
      relative.split('/').some(part => part.startsWith('.'))) return null;
  const sharedInput = 'faecher/informatik/klasse-9/eingaben-speichern.js';
  const pdf = pagePath.replace('aufgabe1.html', 'sicherungsblatt-aufgabe-1-loesungen.pdf');
  const quizScript = 'faecher/informatik/quiz-fragen-pruefen.js';
  if (relative !== pagePath && relative !== codePagePath && relative !== sharedClient && relative !== sharedInput &&
      relative !== quizScript && relative !== pdf &&
      !relative.startsWith('include/')) return null;
  const file = path.resolve(root, relative);
  if (!file.startsWith(root + path.sep) || !mime[path.extname(file).toLowerCase()] ||
      !fs.existsSync(file) || !fs.statSync(file).isFile()) return null;
  const real = fs.realpathSync(file);
  if (!real.startsWith(fs.realpathSync(root) + path.sep)) return null;
  return file;
}

function repositoryFile(rawUrl) {
  let relative;
  try { relative = decodeURIComponent(rawUrl.split('?')[0]).replace(/^\//, ''); } catch { return null; }
  if (relative.includes('\\') || relative.includes('\0') ||
      relative.split('/').some(part => part.startsWith('.'))) return null;
  if (!/^(faecher|include|assets|css|js|images|bilder)\//.test(relative) &&
      !/^[^/]+\.(html|css|js|png|svg|ico)$/.test(relative)) return null;
  let file = path.resolve(repositoryRoot, relative);
  if (!file.startsWith(repositoryRoot + path.sep) || !fs.existsSync(file)) return null;
  if (fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file) || !fs.statSync(file).isFile() || !mime[path.extname(file).toLowerCase()]) return null;
  if (!fs.realpathSync(file).startsWith(fs.realpathSync(repositoryRoot) + path.sep)) return null;
  return file;
}

const page = fs.readFileSync(path.join(__dirname, 'browser-test.html'));
const server = http.createServer((request, response) => {
  if (websiteMode || repositoryMode) {
    if (request.method === 'GET' && request.url === '/') {
      response.writeHead(302, { ...sharedHeaders, Location: repositoryMode ? '/index.html' : '/' + pagePath });
      response.end();
      return;
    }
    const file = request.method === 'GET' ? (repositoryMode ? repositoryFile(request.url) : websiteFile(request.url)) : null;
    if (!file) {
      response.writeHead(404, { ...sharedHeaders, 'Content-Type': 'text/plain; charset=utf-8' });
      response.end('Diese Seite gehört nicht zur lokalen Scaleway-Testkopie.');
      return;
    }
    response.writeHead(200, { ...sharedHeaders, 'Content-Type': mime[path.extname(file).toLowerCase()] });
    fs.createReadStream(file).pipe(response);
    return;
  }
  if (request.method !== 'GET' || request.url !== '/') {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Nicht gefunden.');
    return;
  }
  response.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'Content-Security-Policy': "default-src 'none'; script-src 'unsafe-inline'; connect-src https://unterrichtkiichezbn4-ki-auswertung.functions.fnc.fr-par.scw.cloud; base-uri 'none'; form-action 'none'; frame-ancestors 'none'"
  });
  response.end(page);
});

server.on('error', error => {
  console.error(error.code === 'EADDRINUSE'
    ? 'Port 8765 ist bereits belegt. Vorherigen Testserver beenden und erneut starten.'
    : 'Der lokale Testserver konnte nicht gestartet werden.');
  process.exitCode = 1;
});
if (require.main === module) {
  server.listen(8765, '127.0.0.1', () => {
    console.log((repositoryMode ? 'Scaleway-Website-Vorschau: ' : websiteMode ? 'Scaleway-Website-Testkopie: ' : 'Scaleway-Browsertest: ') + 'http://127.0.0.1:8765');
    console.log('Dieses Fenster geoeffnet lassen. Beenden mit Strg+C.');
  });
}
module.exports = { server, websiteFile, repositoryFile };
