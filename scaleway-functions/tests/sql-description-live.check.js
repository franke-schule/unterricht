'use strict';

// Echte Modellprüfung NACH Upload der aktuellen ZIP und erneuter Bereitstellung.
// Ohne --live nur Vorschau: keine Netzwerkanfrage und keine Modellkosten.
// node scaleway-functions/tests/sql-description-live.check.js --dry-run
// node scaleway-functions/tests/sql-description-live.check.js --live --runs 2 --out scaleway-functions/dist/sql-live-report.json
// Optional: --task inf9-db2-beschreibe-sortierung --url https://.../
// Es werden nur die synthetischen Antworten aus der Vergleichsdatei übertragen.
// Die Vorschau zeigt die aktuelle Zahl echter Modellaufrufe; mehrere Minuten Laufzeit.
// Abstand mindestens 6500 ms wegen der bestehenden lokalen 10/Minute-Bremse.
// Die Sollpunkte sind fachliche Referenzurteile, keine simulierten Modellergebnisse.
// Auch bei richtigen Punkten muss das Feedback im Bericht fachlich geprüft werden.

const fs = require('node:fs');
const core = require('../evaluation-core');
const cases = require('./fixtures/sql-description-cases.json');

async function main() {
  const args = process.argv.slice(2);
  const allowed = new Set(['--live', '--dry-run', '--runs', '--out', '--task', '--url']);
  const options = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!allowed.has(arg)) throw new Error('Unbekanntes Argument: ' + arg);
    if (arg === '--live' || arg === '--dry-run') options[arg] = true;
    else {
      if (!args[i + 1] || args[i + 1].startsWith('--')) throw new Error('Wert fehlt: ' + arg);
      options[arg] = args[++i];
    }
  }
  if (options['--live'] && options['--dry-run']) throw new Error('--live und --dry-run schließen sich aus.');
  const runs = Number(options['--runs'] || 2);
  if (!Number.isInteger(runs) || runs < 1 || runs > 5) throw new Error('--runs muss zwischen 1 und 5 liegen.');
  const selected = cases.map((fixture, index) => ({ ...fixture, caseIndex: index }))
    .filter(fixture => !options['--task'] || fixture.taskId === options['--task']);
  if (!selected.length) throw new Error('Keine Vergleichsfälle für diese Aufgabe gefunden.');
  const endpoint = new URL(options['--url'] || 'https://unterrichtkiichezbn4-ki-auswertung.functions.fnc.fr-par.scw.cloud/');
  if (endpoint.protocol !== 'https:' || endpoint.username || endpoint.password || endpoint.search || endpoint.hash) {
    throw new Error('Erwartet wird eine HTTPS-URL ohne Zugangsdaten, Abfrageparameter oder Fragment.');
  }
  const plannedCalls = selected.length * runs;
  console.log(`${selected.length} Vergleichsfälle, ${runs} Durchläufe, ${plannedCalls} Modellaufrufe${options['--live'] ? '' : ' geplant; Vorschau ohne Netzwerk'}.`);
  if (!options['--live']) return;

  const report = { endpoint: endpoint.href, startedAt: new Date().toISOString(), runs, plannedCalls,
    note: 'Echte Modellantworten; Sollpunkte allein ersetzen keine fachliche Feedbackprüfung.', results: [] };
  const save = () => { if (options['--out']) fs.writeFileSync(options['--out'], JSON.stringify(report, null, 2) + '\n'); };
  let fatal = false;
  for (let run = 1; run <= runs && !fatal; run++) {
    for (const fixture of selected) {
      if (report.results.length) await new Promise(resolve => setTimeout(resolve, 6500));
      const task = core.TASKS[fixture.taskId];
      if (!task?.sqlDescription) throw new Error('Lokale Aufgabe fehlt: ' + fixture.taskId);
      const requestId = `sql_live_${Date.now()}_${run}_${fixture.caseIndex}`;
      const entry = { run, caseIndex: fixture.caseIndex, taskId: fixture.taskId,
        kind: fixture.kind, answer: fixture.answer, expectedPoints: fixture.expectedPoints };
      try {
        const response = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ requestId, taskId: fixture.taskId, answer: fixture.answer }),
          signal: AbortSignal.timeout(120000) });
        const payload = await response.json();
        if (!response.ok || payload.requestId !== requestId || payload.type !== core.RESULT_MESSAGE_TYPE ||
            payload.result?.ok !== true || payload.result.maxPoints !== task.maxPoints ||
            !Number.isInteger(payload.result.points) || payload.result.points < 0 || payload.result.points > task.maxPoints ||
            typeof payload.result.feedback !== 'string' || !Array.isArray(payload.result.missing)) {
          throw new Error('Ungültige Serverantwort: HTTP ' + response.status + ', ' + (payload.errorCode || 'Antwortvertrag'));
        }
        entry.actualPoints = payload.result.points;
        entry.feedback = payload.result.feedback;
        entry.missing = payload.result.missing;
        entry.passed = entry.actualPoints === entry.expectedPoints;
        console.log(`${entry.passed ? 'PASS' : 'FAIL'} Durchlauf ${run}, Fall ${fixture.caseIndex}, ${fixture.taskId}: ${entry.actualPoints}/${task.maxPoints}, erwartet ${entry.expectedPoints}`);
      } catch (error) {
        entry.passed = false;
        entry.error = error.message;
        fatal = true; // Bei Zugangs-, Netzwerk- oder Ratenfehlern keine Serie weiterer Aufrufe.
        console.error('Abbruch: ' + entry.error);
      }
      report.results.push(entry);
      save();
      if (fatal) break;
    }
  }
  report.finishedAt = new Date().toISOString();
  report.passed = report.results.filter(result => result.passed).length;
  report.failed = report.results.length - report.passed;
  report.completed = report.results.length === plannedCalls;
  save();
  console.log(`${report.passed} passend, ${report.failed} abweichend/fehlgeschlagen; ${report.completed ? 'alle' : 'nicht alle'} geplanten Aufrufe ausgeführt.`);
  if (report.failed || !report.completed) process.exitCode = 1;
}

main().catch(error => { console.error(error.message); process.exitCode = 1; });
