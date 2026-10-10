const assert = require('node:assert/strict');
const { loadClient } = require('../../scaleway-functions/tests/client-harness');
const core = require('../../scaleway-functions/evaluation-core');
function element() {
  return { dataset: {}, disabled: false, children: [],
    set textContent(value) { this.text = value; this.children = []; },
    get textContent() { return this.text || ''; }, appendChild(child) { this.children.push(child); } };
}
async function main() {
  const calls = [];
  let editedCode = 'Robot roboter = new Robot(1, 1, 15, 15);\nroboter.hinlegen();';
  let fail = false;
  const nodes = {};
  for (const id of ['10-2a', '10-2b']) {
    nodes['button-' + id] = element(); nodes['button-' + id].textContent = 'Meinen Code prüfen';
    nodes['result-' + id] = element();
  }
  const frame = { contentWindow: { online_ide_access: { getIDE: () => ({
    getFiles: () => [{ getName: () => 'Hauptprogramm.java', getText: () => editedCode }]
  }) } } };
  const context = loadClient({ window: {}, setTimeout, clearTimeout,
    document: { getElementById: id => nodes[id] || frame, createElement: element },
    fetch: async (url, options) => {
      const body = JSON.parse(options.body); calls.push({ url, options, body });
      return { ok: !fail, json: async () => ({ type: 'GEMINI_CODE_EVALUATION_RESULT', requestId: body.requestId,
        result: fail ? { ok: false, message: 'Auswertung vorübergehend deaktiviert.' } : {
          ok: true, points: core.TASKS[body.taskId].maxPoints, maxPoints: core.TASKS[body.taskId].maxPoints,
          status: 'korrekt', strengths: ['Objekt und Punktnotation erkannt.'], missing: [], feedback: 'Passend.'
        } }) };
    }
  }, 'faecher/informatik/klasse-10/2-Modellierung-und-Programmierung-Online-IDE/aufgabe2.html');
  assert.equal(context.getCurrentProgramCode(), editedCode);
  for (const taskId of ['10-2a', '10-2b']) {
    await context.submitCode(taskId);
    assert.equal(calls.at(-1).options.method, 'POST');
    assert.equal(calls.at(-1).body.requestType, 'code');
    assert.equal(calls.at(-1).body.code, editedCode);
    assert.equal(new URL(calls.at(-1).url).search, '');
    assert.equal(nodes['result-' + taskId].className, 'result high');
    assert.equal(nodes['button-' + taskId].disabled, false);
  }
  fail = true;
  await context.submitCode('10-2a');
  assert.equal(nodes['result-10-2a'].className, 'result error');
  assert.match(nodes['result-10-2a'].textContent, /deaktiviert/);
  assert.equal(nodes['button-10-2a'].disabled, false);
  const previous = calls.length;
  editedCode = 'Robot roboter = new Robot(1, 1, 15, 15); hinlegen();';
  await context.submitCode('10-2a');
  assert.equal(calls.length, previous);
  assert.match(nodes['result-10-2a'].textContent, /Punktnotation/);
  console.log('Aufgabe 2: aktueller IDE-Code, POST/JSON, Ergebnisse, Fehler und Vorprüfung erfolgreich.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
