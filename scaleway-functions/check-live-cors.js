'use strict';
// Nur Healthcheck und OPTIONS; keine Eingaben, Secrets oder Modellaufrufe.
const fs = require('node:fs');
const path = require('node:path');
const { endpoint } = require('./migrate-website');
async function main() {
  const health = await fetch(endpoint, { signal: AbortSignal.timeout(20000) });
  const report = { checkedAt: new Date().toISOString(), endpoint,
    health: { status: health.status, body: await health.json() }, origins: [], modelCalls: 0 };
  for (const origin of ['http://127.0.0.1:8765', 'https://www.florian-franke.org', 'https://florian-franke.org']) {
    const response = await fetch(endpoint, { method: 'OPTIONS', signal: AbortSignal.timeout(20000),
      headers: { Origin: origin, 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type' } });
    report.origins.push({ origin, status: response.status, allowOrigin: response.headers.get('access-control-allow-origin') });
    await response.text();
  }
  fs.writeFileSync(path.join(__dirname, '../tmp/scaleway-live-cors-report.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(report));
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
