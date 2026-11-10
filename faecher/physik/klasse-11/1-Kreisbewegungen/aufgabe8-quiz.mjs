// Löschanleitung: aufgabe8-quiz-loeschen.txt.
import { enableTokenDrag, wasDragged } from "./components/token-drag.mjs";
import { appendPhysicsText, physicsTextSpan } from "./components/physics-notation.mjs?v=20261022-force-indices";
import { evaluateSemanticAnswer, renderCompactEvaluation } from "../../../informatik/klasse-11/1-Kuenstliche-Intelligenz/perzeptron/ui/semantic-answer.mjs?v=20261029-criteria-v1";

// Eigenständiges Wiederholungsquiz zu Aufgabe 8; Hinweise zur vollständigen Entfernung stehen in aufgabe8-quiz-loeschen.txt.
const STORAGE_KEY = "physik11-kreisbewegungen-aufgabe8-test-v1";
const SCRIPT_SERVER_URL = "https://unterrichtkiichezbn4-ki-auswertung.functions.fnc.fr-par.scw.cloud/";
const DESCRIBE_MIN_LENGTH = 30;

const DESCRIBE_TASKS = [
  {
    id: "mond",
    number: 4,
    title: "Mondbahn",
    taskId: "ph11-a8-quiz-mond-beschreibung",
    maxPoints: 3,
    prompt: "Der Mond bewegt sich näherungsweise auf einer Kreisbahn um die Erde. **Erkläre**, welche Kraft ihn zur Erde hin umlenkt, welche Rolle diese Kraft übernimmt und ob dafür eine zusätzliche Zentripetalkraft nötig ist."
  },
  {
    id: "zweikoerper",
    number: 5,
    title: "Zwei Körper",
    taskId: "ph11-a8-quiz-zweikoerper-beschreibung",
    maxPoints: 4,
    prompt: "Ein leichter Körper A und ein schwererer Körper B ziehen einander an. **Erkläre** für beide Kraftpfeile Angriffskörper und Richtung, vergleiche die Kraftbeträge und begründe mit a = F/m, welcher Körper stärker beschleunigt wird."
  },
  {
    id: "gesetz",
    number: 6,
    title: "Gesetz und Abstand",
    taskId: "ph11-a8-quiz-gesetz-beschreibung",
    maxPoints: 4,
    prompt: "**Beschreibe** den Zusammenhang zwischen beiden Massen, Mittelpunktabstand und Gravitationskraft mit dem Gravitationsgesetz. **Erkläre** die Wirkung eines verdoppelten Abstands und stelle das Gesetz nach G um."
  }
];
DESCRIBE_TASKS.forEach((task) => { task.assessmentVersion = "20261109-criteria-v1"; });
const DESCRIBE_MAX_POINTS = DESCRIBE_TASKS.reduce((sum, task) => sum + task.maxPoints, 0);

const CLOZE_TERMS = [
  { key: "Masse", reason: "Körper mit Masse ziehen einander an." },
  { key: "Erde", reason: "Bei der Mondbahn zeigt die Anziehung durch die Erde zum Erdmittelpunkt." },
  { key: "Erdmittelpunkt", reason: "Die Anziehung durch die Erde zeigt zum Erdmittelpunkt." },
  { key: "Zentripetalkraft", reason: "Die Anziehung übernimmt die Rolle der Zentripetalkraft." },
  { key: "Mittelpunkten", reason: "r wird zwischen den Mittelpunkten der Körper gemessen." },
  { key: "ein Viertel", reason: "Bei doppeltem Abstand bleibt wegen des Quadrats ein Viertel der Kraft." },
  { key: "Fliehkraft", reason: "Eine Fliehkraft ist keine reale Anziehung zur Bahnmitte." },
  { key: "die Hälfte", reason: "Die Hälfte übersieht das Quadrat des Abstands." }
];
const CLOZE_SOLUTION = ["Masse", "Erde", "Erdmittelpunkt", "Zentripetalkraft", "Mittelpunkten", "ein Viertel"];
const CLOZE_PARTS = [
  "Körper mit ", " ziehen einander an. Bei der Mondbahn zeigt die Anziehung durch die ", " zum ", " und übernimmt die Rolle der ", ". Der Abstand r wird zwischen den ", " der kugelsymmetrischen Körper gemessen. Bei doppeltem r bleibt ", " der Kraft."
];
const CLOZE_SLOTS = CLOZE_SOLUTION.map((_, index) => `gap-${index}`);

const SORT_ZONES = [
  { id: "double", label: "zweifacher Betrag" },
  { id: "fourfold", label: "vierfacher Betrag" },
  { id: "quarter", label: "ein Viertel des Betrags" }
];
const SORT_VALUES = [
  { key: "mass-a", label: "Nur Masse A verdoppeln", zone: "double", reason: "Eine einzelne Masse geht linear in den Zähler ein." },
  { key: "mass-b", label: "Nur Masse B verdoppeln", zone: "double", reason: "Eine einzelne Masse geht linear in den Zähler ein." },
  { key: "both-masses", label: "Beide Massen verdoppeln", zone: "fourfold", reason: "Beide Faktoren 2 werden miteinander multipliziert." },
  { key: "distance", label: "Mittelpunktabstand verdoppeln", zone: "quarter", reason: "Der Abstand steht quadriert im Nenner." }
];

const MC_QUESTIONS = [
  {
    id: "q1",
    text: "Welche Aussagen treffen auf die Mondbahn zu?",
    why: "Die Erdanziehung ist die zur Erde gerichtete Kraft, die den Mond umlenkt.",
    options: [
      { id: "earth-pull", text: "Die Erdanziehung lenkt den Mond zur Erde hin.", correct: true },
      { id: "role", text: "Die Erdanziehung kann die benötigte Zentripetalkraft liefern.", correct: true },
      { id: "add", text: "Erdanziehung und Zentripetalkraft müssen addiert werden.", reason: "Zentripetalkraft bezeichnet hier die Rolle der Erdanziehung." },
      { id: "outward", text: "Die Anziehung wirkt vom Erdmittelpunkt weg.", reason: "Die Anziehung zeigt zum Erdmittelpunkt." }
    ]
  },
  {
    id: "q2",
    text: "Zwei verschieden schwere kugelsymmetrische Körper ziehen einander an. Was gilt?",
    why: "Gleiche Gegenkräfte wirken auf verschiedene Körper; wegen a = {{F|m}} beschleunigt der leichtere stärker.",
    options: [
      { id: "equal", text: "Die Kräfte auf die beiden Körper haben denselben Betrag.", correct: true },
      { id: "toward", text: "Die Kraftpfeile zeigen aufeinander zu.", correct: true },
      { id: "lighter", text: "Der leichtere Körper wird bei gleichem Kraftbetrag stärker beschleunigt.", correct: true },
      { id: "heavy-force", text: "Der schwere Körper erfährt die größere Gravitationskraft.", reason: "Die Kräfte des Wechselwirkungspaars sind gleich groß." },
      { id: "same-body", text: "Die zwei Kräfte greifen am selben Körper an.", reason: "Jede Kraft greift am jeweils anderen Körper an." }
    ]
  },
  {
    id: "q3",
    text: "Welche Aussagen folgen aus {{F_G}} = G·{{m₁·m₂|r²}}?",
    why: "Die Massen stehen linear im Zähler, der Mittelpunktabstand quadratisch im Nenner; Umstellen isoliert G.",
    options: [
      { id: "midpoint", text: "r ist der Abstand der Mittelpunkte.", correct: true },
      { id: "quarter", text: "Bei doppeltem r ist die Kraft ein Viertel so groß.", correct: true },
      { id: "rearrange", text: "Nach G umgestellt gilt G = {{F_G·r²|m₁·m₂}}.", correct: true },
      { id: "surface", text: "r ist der Abstand zwischen den Oberflächen.", reason: "Für kugelsymmetrische Körper zählt der Mittelpunktabstand." },
      { id: "half", text: "Bei doppeltem r halbiert sich die Kraft.", reason: "Der Abstandsfaktor wird quadriert." }
    ]
  },
  {
    id: "q4",
    text: "Für m₁=20,0 kg, m₂=30,0 kg, r=2,00 m und G=6,67430·10⁻¹¹ {{N·m²|kg²}}: Welcher Kraftbetrag ist passend gerundet?",
    why: "Der ungerundete Wert ist 1,001145·10⁻⁸ N; die drei Messwerte erlauben drei gültige Ziffern.",
    options: [
      { id: "rounded", text: "1,00·10⁻⁸ N", correct: true },
      { id: "unrounded", text: "1,001145·10⁻⁸ N", reason: "Der Rechenwert besitzt mehr gültige Ziffern als die drei Messwerte erlauben." },
      { id: "unit", text: "1,00·10⁻⁸ kg", reason: "Das Ergebnis ist eine Kraft mit der Einheit N." },
      { id: "radius", text: "4,00·10⁻⁸ N", reason: "Der Abstand von 2,00 m wird im Nenner quadriert." }
    ]
  }
];

const MAX_POINTS = { cloze: CLOZE_SOLUTION.length, sort: SORT_VALUES.length, mc: MC_QUESTIONS.length };
const LOCAL_POINTS = Object.values(MAX_POINTS).reduce((sum, value) => sum + value, 0);
const TOTAL_POINTS = LOCAL_POINTS + DESCRIBE_MAX_POINTS;
const TASK_COUNT = 3 + DESCRIBE_TASKS.length;
const LOCAL_TASKS = [{id:'cloze',number:1,title:'Gravitationskraft und Mondbahn'}, {id:'sort',number:2,title:'Änderungen der Gravitationskraft'}, {id:'mc',number:3,title:'Multiple Choice'}];

const DEFAULT_STATE = {
  version: 2,
  cloze: {},
  sort: {},
  mc: Object.fromEntries(MC_QUESTIONS.map((question) => [question.id, []])),
  texts: Object.fromEntries(DESCRIBE_TASKS.map((task) => [task.id, ""])),
  // Letzte Bewertung durch den Skriptserver und der Text, auf den sie sich bezieht.
  ai: Object.fromEntries(DESCRIBE_TASKS.map((task) => [task.id, null])),
  aiText: Object.fromEntries(DESCRIBE_TASKS.map((task) => [task.id, ""])),
  // true, solange die Markierungen des letzten Prüfens zur aktuellen Eingabe passen.
  checked: { cloze: false, sort: false, mc: Object.fromEntries(MC_QUESTIONS.map((question) => [question.id, false])) },
  // Gewertet wird der erste Prüfversuch jeder Aufgabe; null = noch nicht geprüft.
  assessmentVersions: Object.fromEntries(DESCRIBE_TASKS.map((task) => [task.id, task.assessmentVersion])),
  first: {
    cloze: null,
    sort: null,
    mc: Object.fromEntries(MC_QUESTIONS.map((question) => [question.id, null])),
    describe: Object.fromEntries(DESCRIBE_TASKS.map((task) => [task.id, null])),
  },
};

let state = loadState();

function clone(value) { return JSON.parse(JSON.stringify(value)); }

function isPlainObject(value) { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }

function clampPoints(value, max) { return Number.isFinite(value) ? Math.min(Math.max(Math.round(value), 0), max) : null; }

// Nur bekannte Einträge übernehmen, damit ein veralteter oder beschädigter Stand die Seite nicht stört.
function loadState() {
  const fresh = clone(DEFAULT_STATE);
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!isPlainObject(saved)) return fresh;
    const clozeKeys = CLOZE_TERMS.map((term) => term.key);
    const sortZones = SORT_ZONES.map((zone) => zone.id);
    if (isPlainObject(saved.cloze)) Object.entries(saved.cloze).forEach(([key, slot]) => { if (clozeKeys.includes(key) && CLOZE_SLOTS.includes(slot) && !Object.values(fresh.cloze).includes(slot)) fresh.cloze[key] = slot; });
    if (isPlainObject(saved.sort)) Object.entries(saved.sort).forEach(([key, zone]) => { if (SORT_VALUES.some((value) => value.key === key) && sortZones.includes(zone)) fresh.sort[key] = zone; });
    MC_QUESTIONS.forEach((question) => {
      const chosen = saved.mc?.[question.id];
      if (Array.isArray(chosen)) fresh.mc[question.id] = [...new Set(chosen.filter((id) => question.options.some((option) => option.id === id)))];
    });
    DESCRIBE_TASKS.forEach((task) => {
      if (typeof saved.texts?.[task.id] === "string") fresh.texts[task.id] = saved.texts[task.id].slice(0, 3000);
    });
    // Stände aus der Zeit mit Abgabe-Button (ohne version) bringen nur ihre Eingaben mit.
    if (saved.version !== 2) return fresh;
    ["cloze", "sort"].forEach((key) => {
      fresh.checked[key] = saved.checked?.[key] === true;
      fresh.first[key] = clampPoints(saved.first?.[key], MAX_POINTS[key]);
    });
    MC_QUESTIONS.forEach((question) => {
      fresh.checked.mc[question.id] = saved.checked?.mc?.[question.id] === true;
      fresh.first.mc[question.id] = clampPoints(saved.first?.mc?.[question.id], 1);
    });
    DESCRIBE_TASKS.forEach((task) => {
      if (saved.assessmentVersions?.[task.id] !== task.assessmentVersion) return;
      const ai = saved.ai?.[task.id];
      if (isPlainObject(ai) && Number.isInteger(ai.points) && ai.points >= 0 && ai.points <= task.maxPoints && typeof saved.aiText?.[task.id] === "string" && saved.aiText[task.id].length <= 3000) {
        fresh.ai[task.id] = {
          points: ai.points,
          maxPoints: task.maxPoints,
          status: ai.points === task.maxPoints ? "korrekt" : ai.points ? "teilweise korrekt" : "noch nicht korrekt",
          strengths: Array.isArray(ai.strengths) ? ai.strengths.filter((entry) => typeof entry === "string") : [],
          missing: Array.isArray(ai.missing) ? ai.missing.filter((entry) => typeof entry === "string") : [],
          feedback: typeof ai.feedback === "string" ? ai.feedback : "",
        };
        fresh.aiText[task.id] = saved.aiText[task.id];
      }
      fresh.first.describe[task.id] = clampPoints(saved.first?.describe?.[task.id], task.maxPoints);
    });
    return fresh;
  } catch {
    return fresh;
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* Eingaben bleiben nur für diese Sitzung erhalten. */
  }
}

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

function resultMark(ok) {
  const mark = element("span", "result-mark");
  const symbol = element("span", "", ok ? " ✓" : " ✗");
  symbol.setAttribute("aria-hidden", "true");
  mark.append(symbol, element("span", "visually-hidden", ok ? " richtig" : " falsch"));
  return mark;
}

/**
 * Rückmeldung unter einer Aufgabe (Muster physics-feedback aus den Modulen).
 * status: "success", "partial", "error" oder "" für einen neutralen Hinweis.
 * parts: Texte (mit Formelnotation) oder fertige Knoten, leere Einträge entfallen.
 */
function setFeedback(box, status, parts) {
  box.className = `physics-feedback${status ? ` ${status}` : ""}`;
  box.replaceChildren();
  parts.filter(Boolean).forEach((part) => {
    if (typeof part !== "string") { box.append(part); return; }
    const line = element("p", "");
    appendPhysicsText(line, part);
    box.append(line);
  });
  box.hidden = false;
}

function reasonList(entries) {
  const list = element("ul", "feedback-reasons");
  entries.forEach((entry) => {
    const item = document.createElement("li");
    appendPhysicsText(item, entry);
    list.append(item);
  });
  return list;
}

// Verschwindet der Prüfen-Button, bleibt der Fokus auf der Rückmeldung statt im Nichts.
function focusFeedback(box) {
  box.tabIndex = -1;
  box.focus({ preventScroll: true });
}

/**
 * Gemeinsame Tafel für Lückentext und Zuordnung.
 * assignment: { Kartenschlüssel: Ablage-ID }, fehlender Eintrag = Wortspeicher.
 * Gezogen wird mit der vorhandenen Komponente token-drag.mjs; zusätzlich lässt
 * sich jede Karte antippen und danach die Lücke beziehungsweise Spalte antippen.
 * isLocked: Aufgabe vollständig richtig gelöst, Karten sind dann fest.
 * onChange: Eingabe geändert, alte Markierungen passen nicht mehr.
 */
function setupBoard({ root, rootSelector, items, assignment, capacity, layout, isLocked, onChange }) {
  let picked = null;

  function slotOf(key) { return assignment[key] || ""; }
  function labelOf(key) { return items.find((item) => item.key === key).label; }

  function move(key, slot) {
    const from = slotOf(key);
    if (slot && capacity(slot) === 1) {
      const occupant = Object.keys(assignment).find((other) => other !== key && assignment[other] === slot);
      if (occupant) {
        if (from) assignment[occupant] = from; // Tausch zwischen zwei Lücken
        else delete assignment[occupant];
      }
    }
    if (slot) assignment[key] = slot;
    else delete assignment[key];
    picked = null;
    onChange();
    saveState();
    render(key);
    updateProgress();
  }

  // Karte als Schaltfläche; nach vollständig richtiger Lösung nur noch als Text mit Markierung.
  function card(key, className, mark) {
    const markClass = mark ? ` is-${mark}` : "";
    if (isLocked()) {
      const node = element("span", `${className} is-locked${markClass}`);
      appendPhysicsText(node, labelOf(key));
      if (mark) node.append(resultMark(mark === "correct"));
      return node;
    }
    const node = element("button", `${className}${markClass}`);
    node.type = "button";
    node.dataset.key = key;
    appendPhysicsText(node, labelOf(key));
    if (mark) node.append(resultMark(mark === "correct"));
    const isPicked = picked === key;
    node.classList.toggle("is-picked", isPicked);
    node.setAttribute("aria-pressed", String(isPicked));
    enableTokenDrag(node, {
      getLabel: () => labelOf(key),
      renderGhost: (ghost) => { ghost.replaceChildren(); appendPhysicsText(ghost, labelOf(key)); },
      dropSelector: `${rootSelector} [data-slot]`,
      bankSelector: `${rootSelector} .cloze-term-bank`,
      onDrop: (slot, onBank) => {
        if (slot) move(key, slot.dataset.slot);
        else if (onBank) move(key, "");
        else render();
      },
    });
    node.addEventListener("click", (event) => {
      event.stopPropagation();
      if (wasDragged(node)) return;
      const slot = slotOf(key);
      if (picked && picked !== key && slot) { move(picked, slot); return; }
      if (isPicked) { if (slot) move(key, ""); else { picked = null; render(key); } return; }
      picked = key;
      render(key);
    });
    return node;
  }

  function target(node, slot) {
    node.dataset.slot = slot;
    // Belegte Lücken sind selbst Karten; deren Klick-Handler übernimmt das Ablegen.
    if (isLocked() || node.dataset.key) return node;
    node.addEventListener("click", () => {
      if (!picked) return;
      if (slot === "" && !slotOf(picked)) { picked = null; render(); return; }
      move(picked, slot);
    });
    return node;
  }

  function bank() {
    const node = element("div", "cloze-term-bank");
    node.setAttribute("role", "group");
    node.setAttribute("aria-label", "Wortspeicher");
    if (!isLocked()) {
      node.addEventListener("click", () => { if (picked && slotOf(picked)) move(picked, ""); });
    }
    const free = items.filter((item) => !slotOf(item.key));
    free.forEach((item) => node.append(card(item.key, "cloze-token")));
    if (!free.length) node.append(element("span", "bank-empty", isLocked() ? "Alle Karten wurden verwendet." : "Alle Karten sind verteilt. Hierher ziehen, um eine Karte zurückzulegen."));
    return node;
  }

  function render(focusKey) {
    root.replaceChildren(...layout({ bank, card, target, assignment, picked }));
    if (focusKey) root.querySelector(`[data-key="${CSS.escape(focusKey)}"]`)?.focus();
  }

  render();
  return { render };
}

function termOf(key) { return CLOZE_TERMS.find((term) => term.key === key); }
function termLabel(key) { return termOf(key)?.label || key; }
function termSpoken(key) { return termOf(key)?.spoken || key; }
function termReason(key) { return termOf(key)?.reason || ""; }

function scoreCloze() {
  return CLOZE_SLOTS.map((slot, index) => {
    const chosen = Object.keys(state.cloze).find((key) => state.cloze[key] === slot) || "";
    return { index, chosen, correct: chosen === CLOZE_SOLUTION[index] };
  });
}

function scoreSort() {
  return SORT_VALUES.map((value) => ({ value, chosen: state.sort[value.key] || "", correct: state.sort[value.key] === value.zone }));
}

function sameSet(a, b) { return a.length === b.length && b.every((value) => a.includes(value)); }
function correctIds(question) { return question.options.filter((option) => option.correct).map((option) => option.id); }

function mcResult(question) {
  const chosen = state.mc[question.id];
  const right = correctIds(question);
  return {
    exact: sameSet(chosen, right),
    hits: chosen.filter((id) => right.includes(id)).length,
    wrong: question.options.filter((option) => !option.correct && chosen.includes(option.id)),
    missing: right.some((id) => !chosen.includes(id)),
  };
}

function answerOf(task) { return state.texts[task.id].trim(); }

function clozeSolved() { return state.checked.cloze && scoreCloze().every((row) => row.correct); }
function sortSolved() { return state.checked.sort && scoreSort().every((row) => row.correct); }
function mcSolved(question) { return state.checked.mc[question.id] && mcResult(question).exact; }
function describeSolved(task) {
  const ai = state.ai[task.id];
  return Boolean(ai) && ai.points >= task.maxPoints && state.aiText[task.id] === state.texts[task.id];
}

function clozeLayout({ bank, card, target, assignment, picked }) {
  const sentence = element("p", "cloze-sentence");
  const byGap = Object.fromEntries(Object.entries(assignment).map(([key, slot]) => [slot, key]));
  CLOZE_PARTS.forEach((part, index) => {
    appendPhysicsText(sentence, part);
    if (index >= CLOZE_SLOTS.length) return;
    const slot = CLOZE_SLOTS[index];
    const key = byGap[slot];
    const attached = /^\S/.test(CLOZE_PARTS[index + 1]);
    if (key) {
      const mark = state.checked.cloze ? (key === CLOZE_SOLUTION[index] ? "correct" : "wrong") : "";
      const gap = target(card(key, `cloze-gap is-filled${attached ? " is-attached" : ""}`, mark), slot);
      gap.setAttribute("aria-label", `Lücke ${index + 1}: ${termSpoken(key)}${mark ? (mark === "correct" ? ", richtig" : ", falsch") : ""}`);
      sentence.append(gap);
      return;
    }
    // Leere Lücken gibt es nur vor dem Prüfen: Geprüft wird erst, wenn alle Lücken belegt sind.
    const gap = element("button", `cloze-gap${attached ? " is-attached" : ""}`, " ");
    gap.type = "button";
    gap.classList.toggle("is-awaiting", Boolean(picked));
    gap.setAttribute("aria-label", `Lücke ${index + 1}: leer`);
    sentence.append(target(gap, slot));
  });
  return [bank(), sentence];
}

function sortLayout({ bank, card, target, assignment, picked }) {
  const locked = sortSolved();
  const grid = element("div", "situation-zones");
  SORT_ZONES.forEach((zone) => {
    const box = target(element("div", "situation-zone"), zone.id);
    box.setAttribute("role", "group");
    box.setAttribute("aria-label", zone.label);
    const label = element(locked ? "span" : "button", "situation-zone-label");
    label.append(element("strong", "", zone.label));
    if (!locked) {
      label.type = "button";
      label.append(element("small", "", picked ? "hier ablegen" : ""));
      label.setAttribute("aria-label", `${zone.label}${picked ? ": ausgewählte Karte hier ablegen" : ""}`);
    }
    box.append(label);
    const list = element("div", "situation-zone-items");
    SORT_VALUES.filter((value) => assignment[value.key] === zone.id).forEach((value) => {
      const mark = state.checked.sort ? (value.zone === zone.id ? "correct" : "wrong") : "";
      list.append(card(value.key, "cloze-token situation-card", mark));
    });
    box.append(list);
    grid.append(box);
  });
  return [bank(), grid];
}

function zoneLabel(id) { return SORT_ZONES.find((zone) => zone.id === id)?.label || "nicht zugeordnet"; }

function showClozeFeedback() {
  const box = document.getElementById("term-cloze-feedback");
  const rows = scoreCloze();
  const wrong = rows.filter((row) => !row.correct);
  const points = rows.length - wrong.length;
  if (!wrong.length) { setFeedback(box, "success", ["Richtig. Die Begriffe beschreiben Mondbahn und Mittelpunktabstand passend."]); return; }
  setFeedback(box, points ? "partial" : "error", [
    points ? "Teilweise korrekt. Prüfe die markierten Lücken und beachte beim Abstand das Quadrat." : "Noch nicht korrekt. Beginne mit der Kraft, die den Mond zur Erde zieht.",
    reasonList(wrong.map((row) => `„${termLabel(row.chosen)}“ passt nicht in Lücke ${row.index + 1}. ${CLOZE_SOLUTION.includes(row.chosen) ? "Dieser Begriff gehört zu einem anderen Zusammenhang im Satz." : termReason(row.chosen)}`)),
  ]);
}

function showSortFeedback() {
  const box = document.getElementById("situation-sort-feedback");
  const rows = scoreSort();
  const wrong = rows.filter((row) => !row.correct);
  const points = rows.length - wrong.length;
  if (!wrong.length) { setFeedback(box, "success", ["Richtig. Du hast lineare Massenabhängigkeit und quadratische Abstandsabhängigkeit zugeordnet."]); return; }
  setFeedback(box, points ? "partial" : "error", [
    points ? "Teilweise korrekt. Prüfe die markierten Karten einzeln." : "Noch nicht korrekt. Vergleiche Zähler und Nenner des Gravitationsgesetzes.",
    reasonList(wrong.map((row) => `„${row.value.label}“ gehört nicht zu „${zoneLabel(row.chosen)}“. ${row.value.reason}`)),
  ]);
}

function checkCloze() {
  const box = document.getElementById("term-cloze-feedback");
  const open = CLOZE_SLOTS.filter((slot) => !Object.values(state.cloze).includes(slot)).length;
  if (open) { setFeedback(box, "", [`Fülle zuerst alle Lücken aus. ${open === 1 ? "Eine Lücke ist" : `${open} Lücken sind`} noch leer.`]); return; }
  if (state.first.cloze === null) state.first.cloze = scoreCloze().filter((row) => row.correct).length;
  state.checked.cloze = true;
  saveState();
  boards.cloze.render();
  showClozeFeedback();
  updateCheckButtons();
  if (clozeSolved()) focusFeedback(box);
  updateProgress();
}

function checkSort() {
  const box = document.getElementById("situation-sort-feedback");
  const open = SORT_VALUES.filter((value) => !state.sort[value.key]).length;
  if (open) { setFeedback(box, "", [`Ordne zuerst alle Karten zu. ${open === 1 ? "Eine Karte liegt" : `${open} Karten liegen`} noch im Wortspeicher.`]); return; }
  if (state.first.sort === null) state.first.sort = scoreSort().filter((row) => row.correct).length;
  state.checked.sort = true;
  saveState();
  boards.sort.render();
  showSortFeedback();
  updateCheckButtons();
  if (sortSolved()) focusFeedback(box);
  updateProgress();
}

function showMcFeedback(question, box) {
  const result = mcResult(question);
  if (result.exact) { setFeedback(box, "success", [`Richtig. ${question.why}`]); return; }
  setFeedback(box, result.hits ? "partial" : "error", [
    result.hits ? "Teilweise korrekt. Prüfe die gewählten Aussagen." : "Noch nicht korrekt. Prüfe die Richtung beziehungsweise den Zusammenhang.",
    result.wrong.length ? reasonList(result.wrong.map((option) => `„${option.text}“ stimmt nicht. ${option.reason}`)) : "",
    result.missing ? "Es fehlt noch mindestens eine richtige Aussage." : "",
  ]);
}

// Multiple Choice mit Prüfen-Button je Frage, Muster wie in winkelgeschwindigkeit-kreisbewegung.mjs.
function mcQuestion(question, index) {
  const solved = mcSolved(question);
  const fieldset = element("fieldset", "physics-quiz-question quiz-question");
  fieldset.id = `mc-${question.id}`;
  const legend = document.createElement("legend");
  appendPhysicsText(legend, `Frage ${index + 1} · ${question.text}`);
  const options = element("div", "quiz-options");
  question.options.forEach((option) => {
    const label = element("label", "quiz-option");
    const input = document.createElement("input");
    input.type = "checkbox";
    input.name = question.id;
    input.value = option.id;
    input.checked = state.mc[question.id].includes(option.id);
    input.disabled = solved;
    input.addEventListener("change", () => {
      state.mc[question.id] = [...fieldset.querySelectorAll("input:checked")].map((checked) => checked.value);
      state.checked.mc[question.id] = false;
      fieldset.querySelector(".physics-feedback").hidden = true;
      saveState();
      updateProgress();
    });
    label.append(input, physicsTextSpan(option.text, "quiz-option-text"));
    options.append(label);
  });
  const button = element("button", "physics-primary-button direct-check-button", "Antwort prüfen");
  button.type = "button";
  button.hidden = solved;
  const feedback = element("div", "physics-feedback");
  feedback.setAttribute("role", "status");
  feedback.setAttribute("aria-live", "polite");
  feedback.hidden = true;
  button.addEventListener("click", () => checkMc(question, index, feedback));
  fieldset.append(legend, options, button, feedback);
  if (state.checked.mc[question.id]) showMcFeedback(question, feedback);
  return fieldset;
}

function checkMc(question, index, box) {
  if (!state.mc[question.id].length) { setFeedback(box, "", ["Wähle zuerst mindestens eine Aussage aus."]); return; }
  if (state.first.mc[question.id] === null) state.first.mc[question.id] = mcResult(question).exact ? 1 : 0;
  state.checked.mc[question.id] = true;
  saveState();
  if (mcSolved(question)) {
    const fieldset = mcQuestion(question, index);
    document.getElementById(`mc-${question.id}`).replaceWith(fieldset);
    focusFeedback(fieldset.querySelector(".physics-feedback"));
  } else {
    showMcFeedback(question, box);
  }
  updateProgress();
}

function renderMcQuestions() {
  document.getElementById("mc-questions").replaceChildren(...MC_QUESTIONS.map(mcQuestion));
}

// Beschreibe-Aufgaben: Prüfen über die POST-/JSON-Anbindung an den Skriptserver.
const describePending = {};
const describeErrors = {};
// Anfragen laufen nacheinander, auch wenn mehrere Prüfen-Buttons kurz hintereinander
// gedrückt werden, damit eine ganze Klasse den Server nicht mit gebündelten Anfragen belastet.
let describeQueue = Promise.resolve();

function renderDescribe(task) {
  const textarea = document.getElementById(`describe-${task.id}`);
  const button = document.getElementById(`check-${task.id}`);
  const box = document.getElementById(`describe-${task.id}-feedback`);
  const solved = describeSolved(task);
  const pending = Boolean(describePending[task.id]);
  textarea.readOnly = solved || pending;
  button.hidden = solved;
  button.disabled = pending;
  button.textContent = pending ? "Antwort wird geprüft …" : "Antwort prüfen";
  const ai = state.ai[task.id];
  box.classList.remove("is-error");
  box.dataset.status = "";
  if (pending) {
    box.replaceChildren(element("p", "", "Deine Antwort wird mit dem Erwartungshorizont verglichen …"));
  } else if (describeErrors[task.id]) {
    box.classList.add("is-error");
    box.replaceChildren(element("p", "", `Die Antwort konnte gerade nicht automatisch bewertet werden (${describeErrors[task.id]}). Versuche es in einem Moment noch einmal.`));
  } else if (ai) {
    box.dataset.status = ai.status || "";
    renderCompactEvaluation(box, ai, { appendText: appendPhysicsText, maxHints: 1 });
  } else {
    box.hidden = true;
    return;
  }
  box.hidden = false;
}

function checkDescription(task) {
  const box = document.getElementById(`describe-${task.id}-feedback`);
  const answer = answerOf(task);
  if (answer.length < DESCRIBE_MIN_LENGTH) {
    box.classList.remove("is-error");
    box.dataset.status = "";
    box.replaceChildren(element("p", "", `Deine Antwort ist noch zu kurz. Schreibe mindestens ${DESCRIBE_MIN_LENGTH} Zeichen und gehe auf alle ${task.maxPoints} Aspekte ein.`));
    box.hidden = false;
    return;
  }
  if (state.ai[task.id] && state.aiText[task.id] === state.texts[task.id]) {
    renderDescribe(task);
    box.append(element("p", "", "Diese Antwort wurde schon geprüft. Ändere oder ergänze sie, bevor du sie erneut prüfen lässt."));
    return;
  }
  const text = state.texts[task.id];
  describePending[task.id] = true;
  delete describeErrors[task.id];
  renderDescribe(task);
  describeQueue = describeQueue.then(() => evaluateDescription(task, text));
}

async function evaluateDescription(task, text) {
  try {
    const result = await evaluateSemanticAnswer({ serverUrl: SCRIPT_SERVER_URL, taskId: task.taskId, answer: text.trim(), expectedMaxPoints: task.maxPoints });
    if (state.texts[task.id] !== text) { describePending[task.id] = false; renderDescribe(task); updateProgress(); return; }
    const points = clampPoints(Number(result.points) || 0, task.maxPoints);
    state.ai[task.id] = {
      status: result.status || "noch nicht korrekt",
      points,
      maxPoints: Number(result.maxPoints) || task.maxPoints,
      strengths: Array.isArray(result.strengths) ? result.strengths.map(String) : [],
      missing: Array.isArray(result.missing) ? result.missing.map(String) : [],
      feedback: result.feedback || "",
    };
    state.aiText[task.id] = text;
    if (state.first.describe[task.id] === null) state.first.describe[task.id] = points;
    saveState();
  } catch (error) {
    if (state.texts[task.id] !== text) { describePending[task.id] = false; renderDescribe(task); updateProgress(); return; }
    describeErrors[task.id] = error.message || "Der Auswertungsserver war nicht erreichbar";
  }
  describePending[task.id] = false;
  renderDescribe(task);
  if (describeSolved(task)) focusFeedback(document.getElementById(`describe-${task.id}-feedback`));
  updateProgress();
}

function setupDescribeTask(task) {
  const textarea = document.getElementById(`describe-${task.id}`);
  const counter = document.getElementById(`describe-${task.id}-count`);
  const updateCounter = () => { counter.textContent = `${textarea.value.length} von 3000 Zeichen`; };
  textarea.addEventListener("input", () => { state.texts[task.id] = textarea.value; delete state.ai[task.id]; state.aiText[task.id] = ""; delete describeErrors[task.id]; renderDescribe(task); updateCounter(); saveState(); updateProgress(); });
  document.getElementById(`check-${task.id}`).addEventListener("click", () => checkDescription(task));
  textarea.value = state.texts[task.id];
  updateCounter();
  renderDescribe(task);
}

// Punkte des ersten Prüfversuchs je Aufgabe; points = null, solange nichts geprüft ist.
function taskScores() {
  const mcChecked = MC_QUESTIONS.filter((question) => state.first.mc[question.id] !== null);
  return [
    { ...LOCAL_TASKS[0], max: MAX_POINTS.cloze, unit: "Punkten", points: state.first.cloze, done: state.first.cloze !== null },
    { ...LOCAL_TASKS[1], max: MAX_POINTS.sort, unit: "Punkten", points: state.first.sort, done: state.first.sort !== null },
    {
      ...LOCAL_TASKS[2],
      max: MAX_POINTS.mc,
      unit: "Punkten",
      points: mcChecked.length ? mcChecked.reduce((sum, question) => sum + state.first.mc[question.id], 0) : null,
      done: mcChecked.length === MC_QUESTIONS.length,
      note: mcChecked.length && mcChecked.length < MC_QUESTIONS.length ? `${mcChecked.length} von ${MC_QUESTIONS.length} Fragen geprüft` : "",
    },
    ...DESCRIBE_TASKS.map((task) => ({ id: task.id, number: task.number, title: task.title, max: task.maxPoints, unit: "Aspekten", points: state.first.describe[task.id], done: state.first.describe[task.id] !== null })),
  ];
}

function scoreText(task) {
  if (task.points === null) return "noch nicht geprüft";
  return `${task.points} von ${task.max} ${task.unit}${task.note ? ` (${task.note})` : ""}`;
}

function updateProgress() {
  const tasks = taskScores();
  const points = tasks.reduce((sum, task) => sum + (task.points ?? 0), 0);
  document.getElementById("progress-label").textContent = `${tasks.filter((task) => task.done).length} von ${TASK_COUNT} Aufgaben geprüft`;
  document.getElementById("progress-points").textContent = `Wertung: ${points} von ${TOTAL_POINTS} Punkten`;
  tasks.forEach((task) => {
    document.getElementById(`task${task.number}-points`).textContent = task.points === null ? `${task.max} ${task.unit === "Aspekten" ? "Aspekte" : "Punkte"}` : `Wertung: ${scoreText(task)}`;
  });
  const list = element("ul", "evaluation-list");
  tasks.forEach((task) => {
    const item = element("li", task.points === null ? "" : task.points === task.max ? "is-correct" : "is-open");
    item.append(element("strong", "", `Aufgabe ${task.number} · ${task.title}: `), scoreText(task));
    list.append(item);
  });
  document.getElementById("evaluation-details").replaceChildren(list);
  document.getElementById("evaluation-total").textContent = `Wertung: ${points} von ${TOTAL_POINTS} Punkten`;
}

let boards = {};

// Prüfen-Buttons verschwinden, sobald eine Aufgabe vollständig richtig gelöst ist.
function updateCheckButtons() {
  document.getElementById("check-term-cloze").hidden = clozeSolved();
  document.getElementById("check-situation-sort").hidden = sortSolved();
  document.querySelector("[data-help='term-cloze']").hidden = clozeSolved();
  document.querySelector("[data-help='situation-sort']").hidden = sortSolved();
}

function init() {
  boards = {
    cloze: setupBoard({
      root: document.getElementById("term-cloze"),
      rootSelector: "#term-cloze",
      items: CLOZE_TERMS.map((term) => ({ key: term.key, label: term.label || term.key })),
      assignment: state.cloze,
      capacity: () => 1,
      layout: clozeLayout,
      isLocked: clozeSolved,
      onChange: () => { state.checked.cloze = false; document.getElementById("term-cloze-feedback").hidden = true; },
    }),
    sort: setupBoard({
      root: document.getElementById("situation-sort"),
      rootSelector: "#situation-sort",
      items: SORT_VALUES.map((value) => ({ key: value.key, label: value.label })),
      assignment: state.sort,
      capacity: () => Infinity,
      layout: sortLayout,
      isLocked: sortSolved,
      onChange: () => { state.checked.sort = false; document.getElementById("situation-sort-feedback").hidden = true; },
    }),
  };
  document.getElementById("check-term-cloze").addEventListener("click", checkCloze);
  document.getElementById("check-situation-sort").addEventListener("click", checkSort);
  if (state.checked.cloze) showClozeFeedback();
  if (state.checked.sort) showSortFeedback();
  updateCheckButtons();
  renderMcQuestions();
  DESCRIBE_TASKS.forEach(setupDescribeTask);
  document.getElementById("print-evaluation").addEventListener("click", () => window.print());
  document.getElementById("reset-test").addEventListener("click", () => {
    if (!window.confirm("Möchtest du das Quiz wirklich neu starten? Alle Eingaben und die Wertung werden gelöscht.")) return;
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* nichts gespeichert */ }
    window.location.reload();
  });
  updateProgress();
}

if (typeof document !== "undefined") document.addEventListener("DOMContentLoaded", init);


