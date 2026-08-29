import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, statSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { FISH_DEPTH_RESULTS, numberMatches, percentageMatches } from "../logic/fish-depth.mjs";

test("Baumtiefen liefern die erwarteten Tabellenwerte", () => {
  assert.deepEqual(FISH_DEPTH_RESULTS, [
    { depth: 1, trainingErrors: 3, testAccuracy: 80 },
    { depth: 2, trainingErrors: 1, testAccuracy: 80 },
    { depth: 3, trainingErrors: 0, testAccuracy: 80 },
  ]);
});

test("Tabellenprüfung akzeptiert Zahlen und typische Prozentschreibweisen", () => {
  assert.equal(numberMatches("3", 3), true);
  assert.equal(numberMatches("0", 0), true);
  assert.equal(numberMatches("3,0", 3), true);
  assert.equal(numberMatches("2", 3), false);
  assert.equal(percentageMatches("80 %", 80), true);
  assert.equal(percentageMatches("80%", 80), true);
  assert.equal(percentageMatches("80,0", 80), true);
  assert.equal(percentageMatches("0,8", 80), false);
});

test("Aufgabe 4 bindet Tabs, Material und Skriptserver passend ein", async () => {
  const pageUrl = new URL("../../aufgabe4.html", import.meta.url);
  const [page, script, tasks, rules] = await Promise.all([
    readFile(pageUrl, "utf8"),
    readFile(new URL("../ui/task4.mjs", import.meta.url), "utf8"),
    readFile(new URL("../../../../../../apps-script/Tasks.gs", import.meta.url), "utf8"),
    readFile(new URL("../../../../../../apps-script/Rules.gs", import.meta.url), "utf8"),
  ]);
  const ids = [...page.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length, "HTML-IDs müssen eindeutig sein");
  ["Datensatz_Fische_Einstieg_Trainingsdaten.csv", "Datensatz_Fische_Einstieg_Testdaten.csv", "Datensatz_Fische_Großer_Datensatz.csv"].forEach((name) => {
    assert.match(page, new RegExp(name.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")));
    const materialPath = fileURLToPath(new URL(`../material-entscheidungsbaum/Material_Entscheidungsbaum-20240227/${name}`, pageUrl));
    assert.equal(existsSync(materialPath), true);
    assert.equal(statSync(materialPath).size > 100, true, `Materialdatei ist leer oder unvollständig: ${name}`);
  });
  assert.doesNotMatch(page, /Datensatz_Fische_Kleiner_Datensatz\.csv/);
  assert.match(page, /ENTER_Online/);
  assert.match(page, /keine Namen, E-Mail-Adressen oder andere personenbezogene Informationen/);
  const tabs = [...page.matchAll(/data-step-tab="([^"]+)"/g)].map((match) => match[1]);
  assert.deepEqual(tabs, ["task41", "task42", "task4a"]);
  const trainingPosition = page.indexOf("Datensatz_Fische_Einstieg_Trainingsdaten.csv");
  const task42Position = page.indexOf('id="task42"');
  const testPosition = page.indexOf("Datensatz_Fische_Einstieg_Testdaten.csv");
  const task4aPosition = page.indexOf('id="task4a"');
  const largePosition = page.indexOf("Datensatz_Fische_Großer_Datensatz.csv");
  assert.equal(trainingPosition < task42Position, true);
  assert.equal(testPosition > task42Position && testPosition < task4aPosition, true);
  assert.equal(largePosition > task4aPosition, true);
  const extension = page.match(/<section id="task4a"[\s\S]*?<\/section>/)?.[0] ?? "";
  assert.doesNotMatch(extension, /<(?:input|textarea|button)\b/i, "Vertiefungen dürfen keine Eingabefelder oder Prüfbuttons enthalten");
  assert.match(extension, /kein Eingabefeld und keine automatische Korrektur/i);
  assert.match(page, /id="depth-learning-note"[^>]*hidden/);
  assert.equal((page.match(/Hilfe 3:/g) ?? []).length, 0);
  assert.match(page, /Maximale Baumtiefe<\/th><th scope="col">Anzahl falsch klassifizierter Trainingsdaten<\/th><th scope="col">Genauigkeit des Entscheidungsbaums nach Testphase/);
  ["11-4-1", "11-4-2"].forEach((taskId) => {
    assert.match(script, new RegExp(taskId));
    assert.match(tasks, new RegExp(taskId));
    assert.match(rules, new RegExp(taskId));
  });
  assert.match(script, /DEPTH_NOTE/);
  for (const match of page.matchAll(/(?:href|src)="([^"#]+)(?:#[^"]*)?"/g)) {
    const value = match[1].split("?")[0];
    if (/^(?:https?:|mailto:|data:)/.test(value)) continue;
    assert.equal(existsSync(fileURLToPath(new URL(value, pageUrl))), true, `Lokales Ziel fehlt: ${value}`);
  }
});

function fakeElement(initial = {}) {
  const listeners = {};
  const classes = new Set();
  return {
    value: "",
    textContent: "",
    className: "",
    hidden: true,
    disabled: false,
    dataset: {},
    tabIndex: 0,
    ...initial,
    classList: {
      toggle(name, force) { if (force) classes.add(name); else classes.delete(name); },
      contains(name) { return classes.has(name); },
    },
    addEventListener(type, listener) { listeners[type] = listener; },
    async dispatch(type, event = {}) { return listeners[type]?.({ preventDefault() {}, ...event }); },
    setAttribute(name, value) { this[name] = value; },
    focus() { this.focused = true; },
    replaceChildren() {},
    append() {},
  };
}

test("UI-Interaktionen prüfen Tabelle und zeigen den Lernhinweis erst beim Absenden", async () => {
  const ids = [
    "depth-one-answer", "check-depth-one", "depth-one-feedback", "depth-one-count",
    "depth-description-answer", "check-depth-description", "depth-description-feedback", "depth-description-count", "depth-learning-note",
    "depth-table-form", "depth-table-feedback", "task4-previous", "task4-next",
  ];
  const elements = Object.fromEntries(ids.map((id) => [id, fakeElement()]));
  const tabs = ["task41", "task42", "task4a"].map((step) => fakeElement({ dataset: { stepTab: step } }));
  const panels = ["task41", "task42", "task4a"].map((step) => fakeElement({ dataset: { stepPanel: step } }));
  const tableInputs = FISH_DEPTH_RESULTS.flatMap((row) => [
    fakeElement({ value: String(row.trainingErrors), dataset: { depth: String(row.depth), field: "trainingErrors" } }),
    fakeElement({ value: `${row.testAccuracy}%`, dataset: { depth: String(row.depth), field: "testAccuracy" } }),
  ]);

  globalThis.document = {
    querySelector(selector) { return elements[selector.replace(/^#/, "")]; },
    querySelectorAll(selector) {
      if (selector === "#depth-table-form input") return tableInputs;
      if (selector === "[data-step-tab]") return tabs;
      if (selector === "[data-step-panel]") return panels;
      return [];
    },
    createElement() { return fakeElement(); },
    body: { append() {} },
  };

  try {
    await import(new URL(`../ui/task4.mjs?interaction-test=${Date.now()}`, import.meta.url));

    assert.deepEqual(panels.map((panel) => panel.hidden), [false, true, true]);
    await elements["task4-next"].dispatch("click");
    assert.deepEqual(panels.map((panel) => panel.hidden), [true, false, true]);
    await tabs[2].dispatch("click");
    assert.deepEqual(panels.map((panel) => panel.hidden), [true, true, false]);

    assert.equal(elements["depth-learning-note"].hidden, true);
    elements["depth-description-answer"].value = "kurz";
    await elements["check-depth-description"].dispatch("click");
    assert.equal(elements["depth-learning-note"].hidden, false);
    assert.match(elements["depth-learning-note"].textContent, /unbekannte Testdaten klassifiziert/);
    assert.match(elements["depth-description-feedback"].textContent, /ausführlichere Antwort/);

    await elements["depth-table-form"].dispatch("submit");
    assert.equal(elements["depth-table-feedback"].className, "dt-feedback success");
    assert.match(elements["depth-table-feedback"].textContent, /korrekt dokumentiert/);

    tableInputs[0].value = "2";
    await elements["depth-table-form"].dispatch("submit");
    assert.equal(elements["depth-table-feedback"].className, "dt-feedback incomplete");
    assert.match(elements["depth-table-feedback"].textContent, /Tiefe 1: Anzahl falsch klassifizierter Trainingsdaten/);
    assert.doesNotMatch(elements["depth-table-feedback"].textContent, /3/);
  } finally {
    delete globalThis.document;
  }
});
