import assert from 'node:assert/strict';
import test from 'node:test';
import { readSplitProgress } from '../sql9-progress-migration.mjs';

class Storage {
  data = new Map();
  getItem(key) { return this.data.get(key) ?? null; }
  setItem(key, value) { this.data.set(key, String(value)); }
  removeItem(key) { this.data.delete(key); }
}

const tasks2 = [{ id: 't1' }, { id: 't11' }];
const tasks3 = [{ id: 't7' }, { id: 't12' }];
const tasks4 = [{ id: 't1' }, { id: 't13' }];
const tasks5 = [{ id: 't7' }, { id: 't17' }];
const tabs2 = [['intro'], ['projection'], ['orderBy'], ['fast'], ['quiz']];
const tabs3 = [['distinct'], ['limit'], ['fast'], ['quiz']];
const tabs4 = [['intro'], ['simple'], ['compare'], ['fast'], ['quiz']];
const tabs5 = [['like'], ['combine'], ['fast'], ['quiz']];
const read = (storage, target, family, tasks, descriptions, tabs) => readSplitProgress(target, `${target}-migration-done`, family, tasks, descriptions, tabs, 12, storage);

test('neueren gültigen SELECT-Rohstand nach IDs auf zwei getrennte Module verteilen', () => {
  const storage = new Storage();
  storage.setItem('informatik9-datenbanken-aufgabe3-v1', JSON.stringify({
    assessmentVersion: '20261029-criteria-v1', tab: 'fast', introStep: 7,
    answers: { t1: 'SELECT * FROM users', t7: 'SELECT DISTINCT city FROM users', t11: 'SELECT * FROM users ORDER BY id DESC', t12: 'SELECT DISTINCT city FROM users ORDER BY city', unknown: 'x' },
    solved: { t1: true, t7: true, t11: true, t12: true },
    descriptionAnswers: { 'd-projection': 'Tabelle users', 'd-distinct': 'Jeder Wohnort einmal' },
    descriptionFeedback: { 'd-projection': { points: 3 }, 'd-distinct': { points: 2 } },
    youngest: { username: 'gartenlesemaus', age: '16', feedback: 'correct' },
    quiz: { q1: ['a', 'b'], q4: ['a', 'd'] }, quizPassed: true,
  }));
  storage.setItem('informatik9-datenbanken-aufgabe2-v1', JSON.stringify({ answers: { t1: 'älter' } }));
  const second = read(storage, 'second', 'select', tasks2, [{ id: 'd-projection' }], tabs2);
  const third = read(storage, 'third', 'select', tasks3, [{ id: 'd-distinct' }], tabs3);
  assert.deepEqual(second.answers, { t1: 'SELECT * FROM users', t11: 'SELECT * FROM users ORDER BY id DESC' });
  assert.deepEqual(third.answers, { t7: 'SELECT DISTINCT city FROM users', t12: 'SELECT DISTINCT city FROM users ORDER BY city' });
  assert.deepEqual(Object.keys(second.descriptionAnswers), ['d-projection']);
  assert.deepEqual(Object.keys(third.descriptionAnswers), ['d-distinct']);
  assert.equal(second.introStep, 7);
  assert.equal(third.introStep, undefined);
  assert.equal(second.youngest.username, 'gartenlesemaus');
  assert.equal(second.youngest.feedback, null);
  assert.deepEqual(second.quiz, {});
  assert.equal(second.quizPassed, false);
  assert.equal(third.quizPassed, false);
  assert.equal(storage.getItem('informatik9-datenbanken-aufgabe3-v1') !== null, true);
});

test('beschädigter neuer SELECT-Stand fällt auf gültigen Legacy-Stand zurück', () => {
  const storage = new Storage();
  storage.setItem('informatik9-datenbanken-aufgabe3-v1', '{kaputt');
  storage.setItem('informatik9-datenbanken-aufgabe2-v1', JSON.stringify({ answers: { t7: 'SELECT DISTINCT city FROM users' }, tab: 'distinct' }));
  const saved = read(storage, 'third', 'select', tasks3, [], tabs3);
  assert.equal(saved.answers.t7, 'SELECT DISTINCT city FROM users');
  assert.equal(saved.tab, 'distinct');
});

test('WHERE-Rohstand trennt Aufgaben 4 und 5 mit historischen IDs', () => {
  const storage = new Storage();
  storage.setItem('informatik9-datenbanken-aufgabe3-where-v1', JSON.stringify({
    assessmentVersion: '20261029-criteria-v1', tab: 'fast', introStep: 12,
    answers: { t1: 'WHERE gender', t7: 'LIKE B', t13: 'WHERE city', t17: 'LIKE email' },
    solved: { t1: true, t7: true, t13: true, t17: true },
    descriptionAnswers: { 'd-where': 'München' },
    descriptionFeedback: { 'd-where': { points: 3 } },
    quiz: { q1: ['a'], q3: ['a'] }, quizPassed: true,
  }));
  const fourth = read(storage, 'fourth', 'where', tasks4, [{ id: 'd-where' }], tabs4);
  const fifth = read(storage, 'fifth', 'where', tasks5, [], tabs5);
  assert.deepEqual(fourth.answers, { t1: 'WHERE gender', t13: 'WHERE city' });
  assert.deepEqual(fifth.answers, { t7: 'LIKE B', t17: 'LIKE email' });
  assert.equal(fourth.descriptionAnswers['d-where'], 'München');
  assert.deepEqual(fifth.descriptionAnswers, {});
  assert.equal(fourth.introStep, 12);
  assert.equal(fifth.introStep, undefined);
  assert.equal(fifth.quizPassed, false);
});

test('mehrfaches Laden und eigener Reset migrieren nicht erneut', () => {
  const storage = new Storage();
  storage.setItem('informatik9-datenbanken-aufgabe3-v1', JSON.stringify({ answers: { t1: 'ALT' }, tab: 'projection' }));
  const first = read(storage, 'second', 'select', tasks2, [], tabs2);
  first.answers.t1 = 'NEU';
  storage.setItem('second', JSON.stringify(first));
  assert.equal(read(storage, 'second', 'select', tasks2, [], tabs2).answers.t1, 'NEU');
  storage.removeItem('second');
  assert.equal(read(storage, 'second', 'select', tasks2, [], tabs2), null);
  assert.equal(storage.getItem('informatik9-datenbanken-aufgabe3-v1') !== null, true);
});

test('gesperrter Speicher und teilweiser Rohstand blockieren die Seite nicht', () => {
  const blocked = { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); } };
  assert.equal(read(blocked, 'second', 'select', tasks2, [], tabs2), null);
  const storage = new Storage();
  storage.setItem('informatik9-datenbanken-aufgabe3-v1', JSON.stringify({ answers: { t1: 'Text', t7: 42 }, solved: { t1: true, t7: 'ja' } }));
  const saved = read(storage, 'second', 'select', tasks2, [], tabs2);
  assert.deepEqual(saved.answers, { t1: 'Text' });
  assert.deepEqual(saved.solved, { t1: true });
});
