import test from "node:test";
import assert from "node:assert/strict";
import { COLOR_ORDER, modelMaximum, normalizeStoredSeries, openCircuitVoltage, photocurrent, resistanceFromSlider, solveOperatingPoint } from "../aufgabe2-model.mjs";

test("slider maps cubic resistance over the specified range", () => {
  assert.equal(resistanceFromSlider(0), 0);
  assert.equal(resistanceFromSlider(1000), 10000);
  assert.equal(resistanceFromSlider(500), 1250);
});

test("all colors have physical short, open and finite-load endpoints", () => {
  for (const color of COLOR_ORDER) {
    const short = solveOperatingPoint(color, 0);
    assert.equal(short.voltage, 0);
    assert.ok(Math.abs(short.current - photocurrent(color)) < 1e-12);
    assert.equal(short.power, 0);
    const open = solveOperatingPoint(color, 10000, true);
    assert.equal(open.current, 0);
    assert.equal(open.power, 0);
    assert.ok(Math.abs(open.voltage - openCircuitVoltage(color)) < 1e-12);
    const load = solveOperatingPoint(color, 10000);
    assert.ok(load.voltage >= 0 && load.voltage <= openCircuitVoltage(color));
    assert.ok(load.current >= 0 && load.power >= 0);
    assert.ok(Math.abs(load.voltage - 10000 * load.current) < 1e-12);
    assert.ok(Math.abs(load.power - load.voltage * load.current) < 1e-14);
  }
});

test("white and color photostcurrents agree with the model anchors", () => {
  assert.ok(Math.abs(photocurrent("Weiß") * 1000 - 8.029) < 0.01);
  assert.ok(Math.abs(openCircuitVoltage("Weiß") - 1.029) < 0.002);
  assert.notEqual(photocurrent("Rot"), photocurrent("Blau"));
});

test("white model maximum is inside the expected load and power range", () => {
  const maximum = modelMaximum("Weiß");
  assert.ok(maximum.resistance >= 90 && maximum.resistance <= 150);
  assert.ok(Math.abs(maximum.power * 1000 - 6.450) < 0.03);
});

test("saved measurements restore all 31 color series and all 2002 slider and switch settings", () => {
  const settings = Array.from({ length: 1001 }, (_, slider) => [
    { slider, open: false, voltage: -999 },
    { slider, open: true, voltage: -999 },
  ]).flat();
  const stored = Array.from({ length: 31 }, (_, index) => ({
    id: index + 1, color: COLOR_ORDER[index % COLOR_ORDER.length], visible: index % 2 === 0,
    points: index === 30 ? settings : [{ slider: index, open: false }],
  }));
  const restored = normalizeStoredSeries(stored);
  assert.equal(restored.length, 31);
  assert.equal(restored[30].points.length, 2002);
  assert.equal(restored[30].points[0].voltage, 0);
  assert.equal(restored[30].points[1].current, 0);
  assert.equal(restored[1].visible, false);
});

test("stored measurements ignore invalid and duplicate entries", () => {
  const restored = normalizeStoredSeries([
    { id: 1, color: "Rot", points: [{ slider: 2, open: false }, { slider: 2, open: false }, { slider: -1, open: false }] },
    { id: 1, color: "Blau", points: [{ slider: 3, open: true }] },
    { id: 2, color: "unbekannt", points: [] },
  ]);
  assert.equal(restored.length, 1);
  assert.equal(restored[0].points.length, 1);
  assert.equal(restored[0].color, "Rot");
});
