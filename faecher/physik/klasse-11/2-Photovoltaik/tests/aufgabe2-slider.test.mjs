import test from "node:test";
import assert from "node:assert/strict";
import { createSliderCommitAdapter } from "../aufgabe2-slider.mjs";

function fixture() {
  let value = "0", running = false, restoring = false, open = false;
  const points = [], previews = [];
  const adapter = createSliderCommitAdapter({
    getValue: () => value,
    onPreview: () => previews.push(value),
    onCommit: () => { if (running) points.push({ value, open }); },
    isRestoring: () => restoring,
  });
  return { adapter, points, previews, setValue: (next) => { value = String(next); adapter.input(); }, start: () => { running = true; }, stop: () => { running = false; }, open: () => { open = true; }, close: () => { open = false; }, restore: (next) => { restoring = true; value = String(next); adapter.input(); adapter.change(); restoring = false; } };
}

test("Pointerbewegung zeigt 20 Vorschauen und committet genau einmal beim Loslassen", () => {
  const f = fixture(); f.start(); f.adapter.pointerdown();
  for (let i = 1; i <= 20; i++) { f.setValue(i); f.adapter.change(); }
  assert.equal(f.previews.length, 20);
  assert.equal(f.points.length, 0);
  f.adapter.pointerup(); f.adapter.change();
  assert.deepEqual(f.points, [{ value: "20", open: false }]);
  f.adapter.pointerdown(); f.adapter.pointerup();
  assert.equal(f.points.length, 1);
});

test("Start, Stopp und Leerlaufschalter erfassen allein nichts; Slidercommit erfasst Leerlauf", () => {
  const f = fixture(); f.start(); f.open();
  assert.equal(f.points.length, 0);
  f.adapter.pointerdown(); f.setValue(1); f.adapter.pointerup();
  assert.deepEqual(f.points, [{ value: "1", open: true }]);
  f.stop(); f.close(); f.adapter.pointerdown(); f.setValue(0); f.adapter.pointerup();
  assert.equal(f.points.length, 1);
  f.start(); f.adapter.pointerdown(); f.setValue(2); f.adapter.pointerup();
  f.adapter.pointerdown(); f.setValue(0); f.adapter.pointerup();
  assert.deepEqual(f.points.at(-1), { value: "0", open: false });
});

test("Pointerabbruch erzeugt keinen Punkt", () => {
  const f = fixture(); f.start(); f.adapter.pointerdown(); f.setValue(8); f.adapter.pointercancel(); f.adapter.change(); f.adapter.pointerup();
  assert.equal(f.points.length, 0);
});

test("Tastenwiederholung wartet auf keyup; blur schließt eine offene Tastaturänderung ab", () => {
  const f = fixture(); f.start();
  f.adapter.keydown({ key: "ArrowRight" });
  for (let i = 1; i <= 5; i++) { f.adapter.keydown({ key: "ArrowRight" }); f.setValue(i); f.adapter.change(); }
  assert.equal(f.points.length, 0);
  f.adapter.keyup({ key: "ArrowRight" }); f.adapter.change();
  assert.deepEqual(f.points, [{ value: "5", open: false }]);
  f.adapter.keydown({ key: "End" }); f.setValue(1000); f.adapter.blur(); f.adapter.change();
  assert.deepEqual(f.points.at(-1), { value: "1000", open: false });
  assert.equal(f.points.length, 2);
});

test("Assistive-Technology-change committet, Restore-Ereignisse nicht", () => {
  const f = fixture(); f.start(); f.setValue(7); f.adapter.change(); f.adapter.change();
  assert.equal(f.points.length, 1);
  f.restore(300);
  assert.equal(f.points.length, 1);
  f.setValue(301); f.adapter.change();
  assert.deepEqual(f.points.at(-1), { value: "301", open: false });
});
