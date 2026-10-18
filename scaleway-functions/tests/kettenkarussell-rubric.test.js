'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { TASKS } = require('../evaluation-core');

test('Kettenkarussell-Aufgabe 4 bewertet fünf Veränderungen ohne Kettenlänge als Pflicht', () => {
  const task = TASKS['ph11-kettenkarussell-winkelgeschwindigkeit'];
  assert.equal(task.maxPoints, 5);
  assert.equal(task.expectedAspects.length, 5);
  assert.match(task.context, /interaktives Kräfteparallelogramm/);
  assert.match(task.expectedAspects[4], /Kettenlänge ist nicht erforderlich/);
  assert.match(task.expectedAspects[4], /Masse m und Gewichtskraft FG unverändert/);
});

test('Kettenkarussell-Aufgabe 5 erlaubt die Begründung über das Kräfteverhältnis', () => {
  const task = TASKS['ph11-kettenkarussell-zwei-sitzreihen'];
  assert.equal(task.maxPoints, 3);
  assert.equal(task.expectedAspects.length, 3);
  assert.match(task.expectedAspects[1], /Verhältnis tan α/);
  assert.match(task.expectedAspects[1], /ohne ausdrücklich genannt/);
  assert.doesNotMatch(task.expectedAspects.join(' '), /Massenunabhängigkeit|Besetzung|Kettenlänge|absolut/);
  assert.match(task.rubric.join(' '), /Ein absolut größeres FZ darf ohne gleiche Vergleichsmassen nicht/);
});
