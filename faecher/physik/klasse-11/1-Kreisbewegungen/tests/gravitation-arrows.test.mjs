import test from 'node:test';
import assert from 'node:assert/strict';
import { forceArrowLength } from '../gravitation.mjs';
import { INITIAL, setDistance } from '../gravitation-model.mjs';

test('beide Kraftpfeile wachsen bei jedem positiven Massenschritt ohne Deckel', () => {
  for (const separation of [7, 0.5]) {
    const base = setDistance({ ...INITIAL, m2: 4.5 }, separation);
    let previous = 0;
    for (let tenth = 1; tenth <= 80; tenth += 1) {
      const length = forceArrowLength({ ...base, m1: tenth / 10 });
      assert.ok(length > previous, `m₁=${tenth / 10} t, r=${separation} m`);
      previous = length;
    }
    assert.equal(forceArrowLength({ ...base, m1: 0 }), 0);
    assert.equal(forceArrowLength({ ...base, m2: 0 }), 0);
  }
});
