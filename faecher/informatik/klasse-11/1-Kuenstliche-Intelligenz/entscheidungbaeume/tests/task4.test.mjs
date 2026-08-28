import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, statSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { FISH_DEPTH_RESULTS, percentageMatches, wrongFishMatches } from "../logic/fish-depth.mjs";

test("Baumtiefen liefern die erwarteten Trainings- und Testergebnisse", () => {
  assert.deepEqual(FISH_DEPTH_RESULTS.map(({ depth, trainingPercent, testPercent, wrongFish }) => ({ depth, trainingPercent, testPercent, wrongFish })), [
    { depth: 1, trainingPercent: 66.7, testPercent: 80, wrongFish: "T3" },
    { depth: 2, trainingPercent: 88.9, testPercent: 80, wrongFish: "T4" },
    { depth: 3, trainingPercent: 100, testPercent: 80, wrongFish: "T4" },
  ]);
});

test("Tabellenprüfung akzeptiert typische Prozent- und Fischbeschreibungen", () => {
  assert.equal(percentageMatches("66,7 %", 66.7), true);
  assert.equal(percentageMatches("88.9", 88.9), true);
  assert.equal(percentageMatches("100%", 100), true);
  assert.equal(wrongFishMatches("T3", "T3"), true);
  assert.equal(wrongFishMatches("der orange Fisch ohne Muster mit schwarzem Bauch", "T3"), true);
  assert.equal(wrongFishMatches("T4", "T4"), true);
  assert.equal(wrongFishMatches("orange, Punkte, schwarzer Bauch", "T4"), true);
  assert.equal(wrongFishMatches("T4", "T3"), false);
});

test("Aufgabe 4 bindet Material, Skriptserver und die drei Kriterien ein", async () => {
  const pageUrl = new URL("../../aufgabe4.html", import.meta.url);
  const [page, script, tasks, rules] = await Promise.all([
    readFile(pageUrl, "utf8"),
    readFile(new URL("../ui/task4.mjs", import.meta.url), "utf8"),
    readFile(new URL("../../../../../../apps-script/Tasks.gs", import.meta.url), "utf8"),
    readFile(new URL("../../../../../../apps-script/Rules.gs", import.meta.url), "utf8"),
  ]);
  const ids = [...page.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
  assert.equal(new Set(ids).size, ids.length, "HTML-IDs müssen eindeutig sein");
  ["Datensatz_Fische_Einstieg_Trainingsdaten.csv", "Datensatz_Fische_Einstieg_Testdaten.csv", "Datensatz_Fische_Kleiner_Datensatz.csv", "Datensatz_Fische_Großer_Datensatz.csv"].forEach((name) => {
    assert.match(page, new RegExp(name.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")));
    const materialPath = fileURLToPath(new URL(`../material-entscheidungsbaum/Material_Entscheidungsbaum-20240227/${name}`, pageUrl));
    assert.equal(existsSync(materialPath), true);
    assert.equal(statSync(materialPath).size > 100, true, `Materialdatei ist leer oder unvollständig: ${name}`);
  });
  assert.match(page, /ENTER_Online/);
  assert.match(page, /keine Namen, E-Mail-Adressen oder andere personenbezogene Informationen/);
  const extension = page.match(/<section class="task4-extension"[\s\S]*?<\/section>/)?.[0] ?? "";
  assert.doesNotMatch(extension, /<(?:input|textarea|button)\b/i, "Vertiefungen dürfen keine Eingabefelder oder Prüfbuttons enthalten");
  assert.doesNotMatch(extension, /evaluateSemanticAnswer|automatische Korrektur/i);
  assert.match(page, /id="depth-learning-note"[^>]*hidden/);
  ["11-4-1", "11-4-2", "11-4-3"].forEach((taskId) => {
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
    ...initial,
    classList: {
      toggle(name, force) { if (force) classes.add(name); else classes.delete(name); },
      contains(name) { return classes.has(name); },
    },
    addEventListener(type, listener) { listeners[type] = listener; },
    async dispatch(type) { return listeners[type]?.({ preventDefault() {} }); },
    focus() { this.focused = true; },
    replaceChildren() {},
    append() {},
  };
}

test("UI-Interaktionen prüfen Tabelle und zeigen den Lernhinweis erst beim Absenden", async () => {
  const ids = [
    "depth-one-answer", "check-depth-one", "depth-one-feedback", "depth-one-count",
    "depth-description-answer", "check-depth-description", "depth-description-feedback", "depth-description-count", "depth-learning-note",
    "equal-accuracy-answer", "check-equal-accuracy", "equal-accuracy-feedback", "equal-accuracy-count",
    "depth-table-form", "depth-table-feedback",
  ];
  const elements = Object.fromEntries(ids.map((id) => [id, fakeElement()]));
  const tableInputs = FISH_DEPTH_RESULTS.flatMap((row) => [
    fakeElement({ value: String(row.trainingPercent).replace(".", ",") + " %", dataset: { depth: String(row.depth), field: "training" } }),
    fakeElement({ value: `${row.testPercent}%`, dataset: { depth: String(row.depth), field: "test" } }),
    fakeElement({ value: `Testfisch ${row.wrongFish.slice(1)}`, dataset: { depth: String(row.depth), field: "wrong" } }),
  ]);

  globalThis.document = {
    querySelector(selector) { return elements[selector.replace(/^#/, "")]; },
    querySelectorAll(selector) { return selector === "#depth-table-form input" ? tableInputs : []; },
    createElement() { return fakeElement(); },
    body: { append() {} },
  };

  try {
    await import(new URL(`../ui/task4.mjs?interaction-test=${Date.now()}`, import.meta.url));

    assert.equal(elements["depth-learning-note"].hidden, true);
    elements["depth-description-answer"].value = "kurz";
    await elements["check-depth-description"].dispatch("click");
    assert.equal(elements["depth-learning-note"].hidden, false);
    assert.match(elements["depth-learning-note"].textContent, /unbekannte Testdaten klassifiziert/);
    assert.match(elements["depth-description-feedback"].textContent, /ausführlichere Antwort/);

    await elements["depth-table-form"].dispatch("submit");
    assert.equal(elements["depth-table-feedback"].className, "dt-feedback success");
    assert.match(elements["depth-table-feedback"].textContent, /alle Ergebnisse korrekt/);

    tableInputs[0].value = "100 %";
    await elements["depth-table-form"].dispatch("submit");
    assert.equal(elements["depth-table-feedback"].className, "dt-feedback incomplete");
    assert.match(elements["depth-table-feedback"].textContent, /Tiefe 1: Trainingsgenauigkeit/);
    assert.doesNotMatch(elements["depth-table-feedback"].textContent, /66,7/);
  } finally {
    delete globalThis.document;
  }
});
