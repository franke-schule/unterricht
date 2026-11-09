import assert from 'node:assert/strict';
import test from 'node:test';
import { observeIdeCodeChanges } from '../ui/semantic-answer.mjs';

test('IDE-Feedback wird bei Edits und Modellreset ungültig, Timer und Abos werden aufgeräumt', () => {
  const originalSetTimeout = globalThis.setTimeout;
  const originalClearTimeout = globalThis.clearTimeout;
  const timers = new Map();
  let nextTimerId = 0;
  globalThis.setTimeout = (callback) => { const id = ++nextTimerId; timers.set(id, callback); return id; };
  globalThis.clearTimeout = (id) => timers.delete(id);
  try {
    const loadListeners = new Set();
    const models = [];
    const frame = {
      addEventListener: (_event, callback) => loadListeners.add(callback),
      removeEventListener: (_event, callback) => loadListeners.delete(callback),
      contentWindow: { online_ide_access: { getIDE: () => ({ ide: {
        getCurrentWorkspace: () => ({ getFiles: () => models.map((model) => ({ getMonacoModel: () => model })) })
      } }) } }
    };
    const makeModel = () => {
      const listeners = new Set();
      return { listeners, onDidChangeContent: (callback) => { listeners.add(callback); return { dispose: () => listeners.delete(callback) }; } };
    };
    const dispatchLoad = () => [...loadListeners].forEach((listener) => listener());
    const firstModel = makeModel();
    models.push(firstModel);
    let invalidations = 0;
    const dispose = observeIdeCodeChanges(frame, 'ide', () => invalidations++);
    assert.equal(invalidations, 0, 'initial model attachment keeps initial state');
    assert.equal(firstModel.listeners.size, 1);
    assert.equal(timers.size, 1);
    [...firstModel.listeners][0]();
    assert.equal(invalidations, 1, 'ordinary code edit invalidates visible feedback');
    dispatchLoad();
    assert.equal(timers.size, 1, 'iframe load replaces the polling timer');
    assert.equal(invalidations, 1, 'same model after load does not invalidate');

    const resetModel = makeModel();
    models.splice(0, models.length, resetModel);
    dispatchLoad();
    assert.equal(invalidations, 2, 'new model after IDE reset invalidates existing feedback');
    assert.equal(firstModel.listeners.size, 0, 'removed model subscription is disposed');
    assert.equal(resetModel.listeners.size, 1, 'new model is observed');
    assert.equal(timers.size, 1);
    [...resetModel.listeners][0]();
    assert.equal(invalidations, 3, 'edits in the replacement model are observed');

    dispose();
    assert.equal(timers.size, 0);
    assert.equal(loadListeners.size, 0);
    assert.equal(resetModel.listeners.size, 0);
    assert.equal(invalidations, 3, 'disposed observer ignores model events');
  } finally {
    globalThis.setTimeout = originalSetTimeout;
    globalThis.clearTimeout = originalClearTimeout;
  }
});
