'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const fixture = fs.readFileSync(path.join(__dirname, '../testdaten/quader-3x5x4.java'), 'utf8');

// Nur die feste Testvorlage im einfachen Java-/JavaScript-Sprachumfang prüfen.
// Bewegungsregeln aus include/online-ide-embedded.js: Richtung startet bei
// (0,+1); rechts reduziert den Index in north,west,south,east. hinlegen legt
// vor dem Roboter ab; Schritte dürfen maximal einen Höhenunterschied haben.
function simulate(source) {
  const bricks = new Map();
  const deltas = [[0, -1], [-1, 0], [0, 1], [1, 0]];
  class Robot {
    constructor(x, y, width, height) { Object.assign(this, { x, y, width, height, direction: 2 }); }
    rechtsDrehen() { this.direction = (this.direction + 3) % 4; }
    linksDrehen() { this.direction = (this.direction + 1) % 4; }
    nextField() {
      const [dx, dy] = deltas[this.direction];
      const [x, y] = [this.x + dx, this.y + dy];
      assert.ok(x >= 1 && x <= this.width && y >= 1 && y <= this.height, 'Wandkollision');
      return [x, y];
    }
    schritt() {
      const [x, y] = this.nextField();
      const before = bricks.get(this.x + ',' + this.y) || 0;
      const after = bricks.get(x + ',' + y) || 0;
      assert.ok(Math.abs(after - before) <= 1, 'Unzulässiger Höhenunterschied');
      this.x = x; this.y = y;
    }
    hinlegen(count) {
      const key = this.nextField().join(',');
      const height = (bricks.get(key) || 0) + count;
      assert.ok(height <= 15, 'Maximale Stapelhöhe');
      bricks.set(key, height);
    }
  }
  const translated = source.replace(/^Robot dudu =/m, 'let dudu =').replace(/\bint\b/g, 'let');
  vm.runInNewContext(translated, { Robot }, { timeout: 1000 });
  return bricks;
}

test('Quader-Testvorlage baut exakt 3x5 Felder mit je vier Ziegeln ohne Kollision', () => {
  const bricks = simulate(fixture);
  assert.equal(bricks.size, 15);
  for (let x = 1; x <= 5; x++) {
    for (let y = 2; y <= 4; y++) assert.equal(bricks.get(x + ',' + y), 4);
  }
  assert.equal([...bricks.values()].reduce((total, count) => total + count, 0), 60);
});

test('Vergleichsvariante mit hinlegen(3) behält Grundfläche, hat aber die falsche Höhe', () => {
  const bricks = simulate(fixture.replace('hinlegen(4)', 'hinlegen(3)'));
  assert.equal(bricks.size, 15);
  assert.ok([...bricks.values()].every(height => height === 3));
  assert.equal([...bricks.values()].reduce((total, count) => total + count, 0), 45);
});
