import assert from 'node:assert/strict';

let appendedScript;

globalThis.window = {};
globalThis.document = {
  createElement(tagName) {
    assert.equal(tagName, 'script');
    return {
      removed: false,
      remove() {
        this.removed = true;
      }
    };
  },
  body: {
    append(script) {
      appendedScript = script;
      queueMicrotask(() => script.onerror());
    }
  }
};

const { evaluateSemanticAnswer } = await import('../ui/semantic-answer.mjs');

await assert.rejects(
  evaluateSemanticAnswer({
    serverUrl: 'https://example.invalid/exec',
    taskId: '11-5-1',
    answer: 'Eine ausreichend lange Testantwort für den simulierten Fehlerfall.',
    timeout: 100
  }),
  /Auswertungsserver konnte nicht geladen werden/
);

assert.equal(appendedScript.removed, true);
assert.deepEqual(Object.keys(window), []);

await assert.rejects(
  evaluateSemanticAnswer({
    serverUrl: 'https://example.invalid/exec',
    taskId: '11-5-1',
    answer: 'x'.repeat(2000),
    timeout: 100
  }),
  /Antwort ist zu lang/
);

console.log('Skriptserver-Fehlerfall und Längenbegrenzung sind korrekt behandelt.');
