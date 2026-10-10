import assert from 'node:assert/strict';
import { evaluateSemanticAnswer, evaluateCodeAnswer, SCW_FUNCTION_URL } from '../ui/semantic-answer.mjs';
const originalFetch = globalThis.fetch;
try {
  let requests = 0;
  globalThis.fetch = async (url, options) => {
    requests++;
    assert.equal(url, SCW_FUNCTION_URL);
    assert.equal(new URL(url).search, '');
    assert.equal(options.method, 'POST');
    assert.equal(options.credentials, 'omit');
    const request = JSON.parse(options.body);
    const type = request.requestType === 'code' ? 'GEMINI_CODE_EVALUATION_RESULT' : 'GEMINI_EVALUATION_RESULT';
    return { ok: true, json: async () => ({ type, requestId: request.requestId,
      result: { ok: true, points: 2, maxPoints: 3, status: 'teilweise korrekt', strengths: [], missing: ['Ein Aspekt fehlt.'], feedback: 'Ergänze den Aspekt.' } }) };
  };
  assert.equal((await evaluateSemanticAnswer({ taskId: '11-5-1', answer: 'ä'.repeat(3000) })).points, 2);
  assert.equal((await evaluateCodeAnswer({ taskId: '11-6-einfach-summe', code: 'x'.repeat(12000) })).points, 2);
  await assert.rejects(evaluateSemanticAnswer({ taskId: '11-5-1', answer: 'x'.repeat(3001) }), /3000/);
  await assert.rejects(evaluateCodeAnswer({ taskId: '11-6-einfach-summe', code: 'x'.repeat(12001) }), /zu lang/);
  await assert.rejects(evaluateSemanticAnswer({ serverUrl: 'https://script.google.com/macros/s/test/exec', taskId: '11-5-1', answer: 'Nicht an Google senden.' }), /nicht korrekt/);
  assert.equal(requests, 2);
  globalThis.fetch = async () => { throw new TypeError('Netzwerkfehler'); };
  await assert.rejects(evaluateSemanticAnswer({ taskId: '11-5-1', answer: 'Eine ausreichend lange Antwort.' }), /nicht erreichbar/);
  globalThis.fetch = (url, options) => new Promise((resolve, reject) => options.signal.addEventListener('abort', () => reject(new Error('Abgebrochen'))));
  await assert.rejects(evaluateSemanticAnswer({ taskId: '11-5-1', answer: 'Eine ausreichend lange Antwort.', timeout: 5 }), /zu lange gedauert/);
  console.log('Scaleway: POST/JSON, Text-/Codegrenzen, gesperrter Google-Endpunkt, Netzwerkfehler und Timeout geprüft.');
} finally { globalThis.fetch = originalFetch; }
