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
  let entries = [
    ['Tier.java', 'class Tier { string name; }'], ['Hund', 'class Hund extends Tier {}'],
    ['Hauptprogramm.java', 'Tier tier = new Tier();'], ['Leer.java', '   '], ['Anleitung.md', 'Nicht versenden.']
  ];
  const nodes = {};
  for (const id of ['10-5a', '10-5b', '10-5c']) {
    nodes['button-' + id] = element(); nodes['button-' + id].textContent = 'Meinen Code prüfen';
    nodes['result-' + id] = element();
  }
  const frame = { contentWindow: { online_ide_access: { getIDE: () => ({
    getFiles: () => entries.map(([name, text]) => ({ getName: () => name, getText: () => text }))
  }) } } };
  const context = loadClient({ window: {}, setTimeout, clearTimeout,
    document: { getElementById: id => nodes[id] || frame, createElement: element },
    fetch: async (url, options) => {
      const body = JSON.parse(options.body); calls.push(body);
      const maxPoints = core.TASKS[body.taskId].maxPoints;
      return { ok: true, json: async () => ({ type: 'GEMINI_CODE_EVALUATION_RESULT', requestId: body.requestId,
        result: { ok: true, points: maxPoints, maxPoints, status: 'korrekt', strengths: [], missing: [], feedback: 'Passend.' } }) };
    }
  }, 'faecher/informatik/klasse-10/2-Modellierung-und-Programmierung-Online-IDE/aufgabe5.html');
  const allCode = context.getAllProgramCode();
  assert.ok(allCode.startsWith('// ===== Datei: Hauptprogramm.java ====='));
  assert.ok(allCode.includes('// ===== Datei: Hund ====='));
  assert.ok(!allCode.includes('Leer.java') && !allCode.includes('Anleitung.md'));
  for (const taskId of ['10-5a', '10-5b']) {
    await context.submitCode(taskId);
    assert.equal(calls.at(-1).code, allCode);
    assert.equal(calls.at(-1).taskId, taskId);
    assert.equal(nodes['result-' + taskId].className, 'result high');
    assert.equal(nodes['button-' + taskId].disabled, false);
  }
  let previous = calls.length;
  entries[2][1] = '// new Tier();';
  await context.submitCode('10-5b');
  assert.equal(calls.length, previous);
  assert.match(nodes['result-10-5b'].textContent, /zuerst Objekte mit new/);
  entries[2][1] = 'Tier tier = new Tier();';
  await context.submitCode('10-5c');
  assert.equal(calls.length, previous);
  assert.match(nodes['result-10-5c'].textContent, /zwei weitere Klassen/);
  entries.push(['Katze.java', 'class Katze extends Tier {}'], ['Delfin.java', 'class Delfin extends Tier {}'],
    ['Vogel.java', 'class Vogel extends Tier {}'], ['Dackel.java', 'class Dackel extends Hund {}']);
  await context.submitCode('10-5c');
  assert.equal(calls.at(-1).taskId, '10-5c');
  assert.equal(nodes['result-10-5c'].className, 'result high');
  previous = calls.length;
  entries[0][1] += 'x'.repeat(12000);
  await context.submitCode('10-5a');
  assert.equal(calls.length, previous);
  assert.match(nodes['result-10-5a'].textContent, /zu lang/);
  console.log('Aufgabe 5: alle IDE-Dateien, Sortierung, Filter, POST/JSON, Aufgaben a/b/c und Vorprüfungen erfolgreich.');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
