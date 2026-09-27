import { enableTokenDrag, wasDragged } from "./components/token-drag.mjs";
import { appendPhysicsText, physicsTextSpan } from "./components/physics-notation.mjs?v=20260911a";
import { evaluateSemanticAnswer } from "../../../informatik/klasse-11/1-Kuenstliche-Intelligenz/perzeptron/ui/semantic-answer.mjs";

// Befristeter Test zu Aufgabe 3: nicht verlinkte Seite, Auswertung erst nach der Abgabe.
// Eigenständig aufgebaut (Vorlage: wdh2-quiz.mjs), damit der Test ohne Reste wieder
// entfernt werden kann. Rückbau: 1-Datenbanken/aufgabe1-quiz-skriptserver.txt, Test D.
const STORAGE_KEY = "physik11-kreisbewegungen-aufgabe3-test-v1";
const SCRIPT_SERVER_URL = "https://script.google.com/macros/s/AKfycby8RWL6uYrKZyoJ6m2GRpWyRmXjwsdskyCiqzKpRhIK5-wrDl-9lWWk8CiAGaVMoy0x/exec";
const DESCRIBE_MIN_LENGTH = 30;

// Aufgaben 4 bis 6: Beschreibe-Aufgaben, bewertet über den Skriptserver.
const DESCRIBE_TASKS = [
  {
    id: "karussell",
    number: 4,
    title: "Karussell beschreiben",
    taskId: "ph11-a3-quiz-karussell-beschreibung",
    maxPoints: 4,
    prompt: "Vergleiche Winkel- und Bahngeschwindigkeit von zwei Kindern auf einem Karussell.",
    shortHint: "Beide Kinder drehen sich in derselben Zeit um denselben Winkel und haben deshalb dieselbe Winkelgeschwindigkeit ω. Wegen {{v_B}} = ω · r hat Kind B am Rand mit dem größeren Radius die größere Bahngeschwindigkeit.",
  },
  {
    id: "ursache",
    number: 5,
    title: "Ursache der Kreisbewegung beschreiben",
    taskId: "ph11-a3-quiz-ursache-beschreibung",
    maxPoints: 3,
    prompt: "Warum muss bei einer Kreisbewegung eine Kraft wirken, und wohin zeigt sie?",
    shortHint: "Bei einer Kreisbewegung ändert sich ständig die Richtung der Geschwindigkeit. Dafür ist eine Kraft nötig, sonst würde der Körper wegen seiner Trägheit geradlinig weiterfliegen. Die Zentripetalkraft beginnt am Körper und zeigt nach innen zum Kreismittelpunkt.",
  },
  {
    id: "schnur",
    number: 6,
    title: "Die Schnur reißt",
    taskId: "ph11-a3-quiz-schnur-beschreibung",
    maxPoints: 3,
    prompt: "Wie bewegt sich die Kugel, nachdem die Schnur gerissen ist?",
    shortHint: "Nach dem Reißen wirkt keine Kraft mehr zum Kreismittelpunkt. Wegen ihrer Trägheit bewegt sich die Kugel geradlinig weiter, und zwar tangential in die Richtung, die ihre Geschwindigkeit im Moment des Reißens hatte.",
  },
];
const DESCRIBE_MAX_POINTS = DESCRIBE_TASKS.reduce((sum, task) => sum + task.maxPoints, 0);

// Aufgabe 1: Lückentext mit Wortkarten, Bedienung über die vorhandene Komponente token-drag.mjs.
// label: Anzeige mit Formelnotation, spoken: Text für Screenreader.
const CLOZE_TERMS = [
  { key: "Drehwinkel", reason: "ω gibt an, um welchen Drehwinkel Δφ sich die Verbindungslinie im Zeitintervall Δt weiterdreht: ω = {{Δφ|Δt}}." },
  { key: "rad-s", label: "{{rad/s}}", spoken: "Radiant pro Sekunde", reason: "Der Drehwinkel wird im Bogenmaß (rad) angegeben, die Zeit in Sekunden. Daraus ergibt sich die Einheit {{rad/s}}." },
  { key: "Hertz", reason: "Hertz ist die Einheit der Frequenz f, also der Anzahl der Umläufe pro Sekunde, nicht der Winkelgeschwindigkeit." },
  { key: "Radius", reason: "Es gilt {{v_B}} = ω · r: Bei gleichem ω ist der Körper auf einem größeren Kreis schneller." },
  { key: "tangential", reason: "Der Geschwindigkeitsvektor berührt die Kreisbahn am Körper, er liegt auf der Tangente." },
  { key: "radial", reason: "Radial, also entlang des Radius, verläuft die Zentripetalkraft, nicht der Geschwindigkeitsvektor." },
  { key: "Kehrwert", reason: "Es gilt f = {{1|T}}: Je kürzer ein Umlauf dauert, desto mehr Umläufe schafft der Körper pro Sekunde." },
  { key: "Kreismittelpunkt", reason: "Die Zentripetalkraft zeigt nach innen zum Kreismittelpunkt und ändert so ständig die Richtung der Geschwindigkeit." },
];
const CLOZE_SOLUTION = ["Drehwinkel", "rad-s", "Radius", "tangential", "Kehrwert", "Kreismittelpunkt"];
const CLOZE_PARTS = [
  "Die Winkelgeschwindigkeit ω gibt an, um welchen ",
  " sich die Verbindungslinie zwischen Zentrum und Körper pro Zeit weiterdreht. Eine Einheit von ω ist ",
  ". Die Bahngeschwindigkeit {{v_B}} ist das Produkt aus ω und dem ",
  ". Ihr Vektor beginnt am Körper und verläuft ",
  " zur Kreisbahn. Die Frequenz f ist der ",
  " der Umlaufdauer T. Die Zentripetalkraft beginnt am Körper und zeigt zum ",
  ".",
];
const CLOZE_SLOTS = CLOZE_SOLUTION.map((_, index) => `gap-${index}`);

// Aufgabe 2: Größen einer Kreisbewegung mit konstanter Winkelgeschwindigkeit einordnen.
const SORT_ZONES = [
  { id: "changes", label: "ändert sich ständig" },
  { id: "constant", label: "bleibt gleich" },
];
const SORT_VALUES = [
  { key: "direction", label: "Richtung der Geschwindigkeit", zone: "changes", reason: "Der Geschwindigkeitsvektor liegt immer tangential an der Kreisbahn und zeigt deshalb an jeder Stelle in eine andere Richtung." },
  { key: "speed", label: "Betrag der Bahngeschwindigkeit {{v_B}}", zone: "constant", reason: "Bei konstantem ω und gleichem Radius bleibt {{v_B}} = ω · r gleich. Nur die Richtung der Geschwindigkeit ändert sich." },
  { key: "position", label: "Ort des Körpers", zone: "changes", reason: "Der Körper läuft auf der Kreisbahn um, sein Ort ändert sich ständig." },
  { key: "omega", label: "Winkelgeschwindigkeit ω", zone: "constant", reason: "Das ist vorgegeben: In gleichen Zeitintervallen wird immer derselbe Drehwinkel überstrichen." },
  { key: "period", label: "Umlaufdauer T", zone: "constant", reason: "Weil sich ω nicht ändert, dauert jeder Umlauf gleich lang." },
  { key: "angle", label: "Drehwinkel Δφ seit dem Start", zone: "changes", reason: "Mit jeder Weiterdrehung der Verbindungslinie wird der überstrichene Drehwinkel größer." },
  { key: "radius", label: "Radius r der Kreisbahn", zone: "constant", reason: "Der Körper bleibt auf derselben Kreisbahn, sein Abstand zum Zentrum ändert sich nicht." },
  { key: "frequency", label: "Frequenz f", zone: "constant", reason: "Die Frequenz ist der Kehrwert der Umlaufdauer. Bleibt T gleich, bleibt auch f gleich." },
];

// Aufgabe 3: Multiple Choice nach dem Muster der vorhandenen Quizfragen in wdh2-quiz.mjs.
const MC_QUESTIONS = [
  {
    id: "q1",
    text: "Die Verbindungslinie zwischen Zentrum und Körper überstreicht in 2 s den Drehwinkel π. Welche Aussagen sind richtig?",
    why: "Es gilt ω = {{Δφ|Δt}}. ω hängt nur vom Drehwinkel und vom Zeitintervall ab, nicht vom Radius.",
    options: [
      { id: "value", text: "Die Winkelgeschwindigkeit beträgt ω = {{π|2}} {{rad/s}} ≈ 1,57 {{rad/s}}.", correct: true },
      { id: "faster", text: "Wird derselbe Drehwinkel in 1 s überstrichen, verdoppelt sich ω.", correct: true },
      { id: "radius", text: "Bei einem größeren Radius wäre ω größer, auch wenn Drehwinkel und Zeit gleich bleiben.", reason: "Der Radius kommt in ω = {{Δφ|Δt}} nicht vor. Er beeinflusst die Bahngeschwindigkeit, nicht die Winkelgeschwindigkeit." },
      { id: "unit", text: "Die Winkelgeschwindigkeit wird in {{m/s}} angegeben.", reason: "{{m/s}} ist eine Einheit der Bahngeschwindigkeit. ω wird zum Beispiel in {{rad/s}} angegeben." },
    ],
  },
  {
    id: "q2",
    text: "Welche Änderungen vergrößern die Bahngeschwindigkeit {{v_B}}?",
    why: "Es gilt {{v_B}} = ω · r. {{v_B}} wird größer, wenn ω oder r größer wird und die andere Größe gleich bleibt.",
    options: [
      { id: "omega", text: "ω verdoppeln, r bleibt gleich.", correct: true },
      { id: "radius", text: "r vergrößern, ω bleibt gleich.", correct: true },
      { id: "half-radius", text: "r halbieren, ω bleibt gleich.", reason: "Ein kleinerer Radius bei gleichem ω verkleinert {{v_B}}." },
      { id: "both", text: "ω halbieren und gleichzeitig r verdoppeln.", reason: "Die beiden Änderungen heben sich auf: Halb so groß mal doppelt so groß ergibt wieder denselben Wert, {{v_B}} bleibt gleich." },
    ],
  },
  {
    id: "q3",
    text: "Ein Karussell braucht für einen Umlauf die Zeit T = 4 s. Welche Aussagen sind richtig?",
    why: "Es gilt f = {{1|T}} = {{1|4 s}} = 0,25 Hz. Das Karussell schafft also einen Viertelumlauf pro Sekunde.",
    options: [
      { id: "value", text: "Die Frequenz beträgt f = 0,25 Hz.", correct: true },
      { id: "quarter", text: "In einer Sekunde schafft das Karussell einen Viertelumlauf.", correct: true },
      { id: "swap", text: "Die Frequenz beträgt f = 4 Hz.", reason: "Hier wurden Umlaufdauer und Frequenz verwechselt. Die Frequenz ist der Kehrwert der Umlaufdauer." },
      { id: "longer", text: "Dreht sich das Karussell schneller, wird die Umlaufdauer T größer.", reason: "Bei schnellerer Drehung dauert ein Umlauf kürzer, T wird also kleiner und f größer." },
    ],
  },
  {
    id: "q4",
    text: "Welche Aussagen zur Zentripetalkraft {{F_Z}} sind richtig?",
    why: "Der Kraftpfeil der Zentripetalkraft beginnt am Körper und zeigt zum Kreismittelpunkt. Die Kraft ändert ständig die Richtung der Geschwindigkeit.",
    options: [
      { id: "origin", text: "Der Kraftpfeil beginnt am Körper.", correct: true },
      { id: "outward", text: "Sie zeigt vom Kreismittelpunkt nach außen.", reason: "Die Zentripetalkraft zeigt nach innen. Eine Kraft nach außen würde den Körper von der Kreisbahn wegziehen." },
      { id: "inward", text: "Sie zeigt nach innen zum Kreismittelpunkt.", correct: true },
      { id: "direction", text: "Sie sorgt dafür, dass sich die Richtung der Geschwindigkeit ständig ändert.", correct: true },
    ],
  },
  {
    id: "q5",
    text: "Welche Aussagen zum Geschwindigkeitsvektor bei einer Kreisbewegung sind richtig?",
    why: "Der Geschwindigkeitsvektor beginnt am Körper und liegt auf der Tangente. Die Tangente steht am Berührpunkt senkrecht auf dem Radius.",
    options: [
      { id: "center", text: "Er beginnt im Zentrum und zeigt zum Körper.", reason: "Vom Zentrum zum Körper verläuft die Verbindungslinie, also der Radius, nicht der Geschwindigkeitsvektor." },
      { id: "tangent", text: "Er beginnt am Körper und verläuft tangential zur Kreisbahn.", correct: true },
      { id: "perpendicular", text: "Er steht am Körper senkrecht auf der Verbindungslinie zum Zentrum.", correct: true },
      { id: "parallel", text: "Er zeigt in dieselbe Richtung wie die Zentripetalkraft.", reason: "Die Zentripetalkraft zeigt zum Mittelpunkt, die Geschwindigkeit tangential. Die beiden Vektoren stehen senkrecht aufeinander." },
    ],
  },
];

const MAX_POINTS = { cloze: CLOZE_SOLUTION.length, sort: SORT_VALUES.length, mc: MC_QUESTIONS.length };
const LOCAL_POINTS = Object.values(MAX_POINTS).reduce((sum, value) => sum + value, 0);
const TOTAL_POINTS = LOCAL_POINTS + DESCRIBE_MAX_POINTS;
const TASK_COUNT = 3 + DESCRIBE_TASKS.length;

const DEFAULT_STATE = {
  cloze: {},
  sort: {},
  mc: Object.fromEntries(MC_QUESTIONS.map((question) => [question.id, []])),
  texts: Object.fromEntries(DESCRIBE_TASKS.map((task) => [task.id, ""])),
  ai: Object.fromEntries(DESCRIBE_TASKS.map((task) => [task.id, null])),
  submitted: false,
};

let state = loadState();

function clone(value) { return JSON.parse(JSON.stringify(value)); }

function isPlainObject(value) { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }

// Nur bekannte Einträge übernehmen, damit ein veralteter oder beschädigter Stand die Seite nicht stört.
function loadState() {
  const fresh = clone(DEFAULT_STATE);
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!isPlainObject(saved)) return fresh;
    const clozeKeys = CLOZE_TERMS.map((term) => term.key);
    const sortZones = SORT_ZONES.map((zone) => zone.id);
    if (isPlainObject(saved.cloze)) Object.entries(saved.cloze).forEach(([key, slot]) => { if (clozeKeys.includes(key) && CLOZE_SLOTS.includes(slot)) fresh.cloze[key] = slot; });
    if (isPlainObject(saved.sort)) Object.entries(saved.sort).forEach(([key, zone]) => { if (SORT_VALUES.some((value) => value.key === key) && sortZones.includes(zone)) fresh.sort[key] = zone; });
    MC_QUESTIONS.forEach((question) => {
      const chosen = saved.mc?.[question.id];
      if (Array.isArray(chosen)) fresh.mc[question.id] = chosen.filter((id) => question.options.some((option) => option.id === id));
    });
    DESCRIBE_TASKS.forEach((task) => {
      if (typeof saved.texts?.[task.id] === "string") fresh.texts[task.id] = saved.texts[task.id];
      if (isPlainObject(saved.ai?.[task.id])) fresh.ai[task.id] = saved.ai[task.id];
    });
    fresh.submitted = saved.submitted === true;
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
 * Gemeinsame Tafel für Lückentext und Zuordnung.
 * assignment: { Kartenschlüssel: Ablage-ID }, fehlender Eintrag = Wortspeicher.
 * Gezogen wird mit der vorhandenen Komponente token-drag.mjs; zusätzlich lässt
 * sich jede Karte antippen und danach die Lücke beziehungsweise Spalte antippen.
 */
function setupBoard({ root, rootSelector, items, assignment, capacity, layout }) {
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
    saveState();
    render(key);
    updateProgress();
  }

  // Karte als Schaltfläche; nach der Abgabe nur noch als Text mit Markierung.
  function card(key, className, mark) {
    if (state.submitted) {
      const node = element("span", `${className} is-locked${mark ? ` is-${mark}` : ""}`);
      appendPhysicsText(node, labelOf(key));
      if (mark) node.append(resultMark(mark === "correct"));
      return node;
    }
    const node = element("button", className);
    node.type = "button";
    node.dataset.key = key;
    appendPhysicsText(node, labelOf(key));
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
    if (state.submitted || node.dataset.key) return node;
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
    if (!state.submitted) {
      node.addEventListener("click", () => { if (picked && slotOf(picked)) move(picked, ""); });
    }
    const free = items.filter((item) => !slotOf(item.key));
    free.forEach((item) => node.append(card(item.key, "cloze-token")));
    if (!free.length) node.append(element("span", "bank-empty", state.submitted ? "Alle Karten wurden verwendet." : "Alle Karten sind verteilt. Hierher ziehen, um eine Karte zurückzulegen."));
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
      const mark = state.submitted ? (key === CLOZE_SOLUTION[index] ? "correct" : "wrong") : "";
      const gap = target(card(key, `cloze-gap is-filled${attached ? " is-attached" : ""}`, mark), slot);
      gap.setAttribute("aria-label", `Lücke ${index + 1}: ${termSpoken(key)}${mark ? (mark === "correct" ? ", richtig" : ", falsch") : ""}`);
      sentence.append(gap);
      return;
    }
    const gap = element(state.submitted ? "span" : "button", `cloze-gap${attached ? " is-attached" : ""}${state.submitted ? " is-locked is-wrong" : ""}`, state.submitted ? "(leer)" : " ");
    if (state.submitted) gap.append(resultMark(false));
    else {
      gap.type = "button";
      gap.classList.toggle("is-awaiting", Boolean(picked));
    }
    gap.setAttribute("aria-label", `Lücke ${index + 1}: leer`);
    sentence.append(target(gap, slot));
  });
  return [bank(), sentence];
}

function sortLayout({ bank, card, target, assignment, picked }) {
  const grid = element("div", "situation-zones");
  SORT_ZONES.forEach((zone) => {
    const box = target(element("div", "situation-zone"), zone.id);
    box.setAttribute("role", "group");
    box.setAttribute("aria-label", zone.label);
    const label = element(state.submitted ? "span" : "button", "situation-zone-label");
    label.append(element("strong", "", zone.label));
    if (!state.submitted) {
      label.type = "button";
      label.append(element("small", "", picked ? "hier ablegen" : ""));
      label.setAttribute("aria-label", `${zone.label}${picked ? ": ausgewählte Karte hier ablegen" : ""}`);
    }
    box.append(label);
    const list = element("div", "situation-zone-items");
    SORT_VALUES.filter((value) => assignment[value.key] === zone.id).forEach((value) => {
      const mark = state.submitted ? (value.zone === zone.id ? "correct" : "wrong") : "";
      list.append(card(value.key, "cloze-token situation-card", mark));
    });
    box.append(list);
    grid.append(box);
  });
  return [bank(), grid];
}

function renderMcQuestions() {
  const container = document.getElementById("mc-questions");
  container.replaceChildren();
  MC_QUESTIONS.forEach((question, index) => {
    const fieldset = element("fieldset", "physics-quiz-question quiz-question");
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
      input.disabled = state.submitted;
      input.addEventListener("change", () => {
        state.mc[question.id] = [...container.querySelectorAll(`input[name="${question.id}"]:checked`)].map((checked) => checked.value);
        saveState();
        updateProgress();
      });
      label.append(input, physicsTextSpan(option.text, "quiz-option-text"));
      options.append(label);
    });
    fieldset.append(legend, options);
    container.append(fieldset);
  });
}

function sameSet(a, b) { return a.length === b.length && b.every((value) => a.includes(value)); }
function correctIds(question) { return question.options.filter((option) => option.correct).map((option) => option.id); }
function answerOf(task) { return state.texts[task.id].trim(); }

function taskStatus() {
  return [
    CLOZE_SLOTS.every((slot) => Object.values(state.cloze).includes(slot)),
    SORT_VALUES.every((value) => state.sort[value.key]),
    MC_QUESTIONS.every((question) => state.mc[question.id].length > 0),
    ...DESCRIBE_TASKS.map((task) => answerOf(task).length >= DESCRIBE_MIN_LENGTH),
  ];
}

function updateProgress() {
  const done = taskStatus().filter(Boolean).length;
  document.getElementById("progress-label").textContent = state.submitted ? "Test abgegeben" : `${done} von ${TASK_COUNT} Aufgaben bearbeitet`;
  document.getElementById("progress-points").textContent = state.submitted ? pointsLine() : `${TOTAL_POINTS} Punkte erreichbar`;
}

function scoreCloze() {
  return CLOZE_SLOTS.map((slot, index) => {
    const chosen = Object.keys(state.cloze).find((key) => state.cloze[key] === slot) || "";
    return { index, chosen, correct: chosen === CLOZE_SOLUTION[index] };
  });
}

function scoreSort() {
  return SORT_VALUES.map((value) => ({ value, chosen: state.sort[value.key] || "", correct: state.sort[value.key] === value.zone }));
}

function scoreMc() {
  return MC_QUESTIONS.map((question) => ({ question, chosen: state.mc[question.id], correct: sameSet(state.mc[question.id], correctIds(question)) }));
}

function aiPoints(task) {
  const ai = state.ai[task.id];
  if (ai && Number.isFinite(ai.points) && ai.maxPoints > 0) return Math.min(ai.points, task.maxPoints);
  if (answerOf(task).length < DESCRIBE_MIN_LENGTH) return 0;
  return null; // noch nicht oder nicht automatisch bewertet
}

function pointsLine() {
  const local = scoreCloze().filter((row) => row.correct).length + scoreSort().filter((row) => row.correct).length + scoreMc().filter((row) => row.correct).length;
  const open = DESCRIBE_TASKS.filter((task) => aiPoints(task) === null);
  const described = DESCRIBE_TASKS.reduce((sum, task) => sum + (aiPoints(task) ?? 0), 0);
  if (!open.length) return `${local + described} von ${TOTAL_POINTS} Punkten`;
  const openMax = open.reduce((sum, task) => sum + task.maxPoints, 0);
  const openNames = open.map((task) => task.number).join(", ").replace(/, (\d+)$/, " und $1");
  return `${local + described} von ${TOTAL_POINTS - openMax} Punkten (ohne Aufgabe ${openNames})`;
}

function zoneLabel(id) { return SORT_ZONES.find((zone) => zone.id === id)?.label || "nicht zugeordnet"; }

function resultList(rows) {
  const list = element("ul", "evaluation-list");
  rows.forEach(({ ok, text, why }) => {
    const item = element("li", ok ? "is-correct" : "is-wrong");
    item.append(element("strong", "", ok ? "✓ richtig: " : "✗ falsch: "));
    appendPhysicsText(item, text);
    if (why) {
      const note = element("span", "evaluation-why");
      appendPhysicsText(note, why);
      item.append(note);
    }
    list.append(item);
  });
  return list;
}

function evaluationSection(title, badgeText, complete, prompt, content) {
  const section = element("section", "evaluation-section");
  const heading = element("h3", "", `${title} `);
  heading.append(element("span", `evaluation-score ${complete ? "is-complete" : "is-open"}`, badgeText));
  const promptLine = element("p", "evaluation-prompt");
  appendPhysicsText(promptLine, prompt);
  section.append(heading, promptLine, ...[].concat(content));
  return section;
}

function describeSection(task) {
  const points = aiPoints(task);
  const badge = points !== null
    ? `${points} von ${task.maxPoints} Aspekten`
    : state.ai[task.id]?.level === "error" ? "Bewertung durch Lehrkraft" : "wird bewertet";
  return evaluationSection(`Aufgabe ${task.number} · ${task.title}`, badge, points === task.maxPoints, task.prompt, describeEvaluation(task));
}

function renderEvaluation() {
  const cloze = scoreCloze();
  const sort = scoreSort();
  const mc = scoreMc();
  const clozePoints = cloze.filter((row) => row.correct).length;
  const sortPoints = sort.filter((row) => row.correct).length;
  const mcPoints = mc.filter((row) => row.correct).length;

  document.getElementById("evaluation-details").replaceChildren(
    evaluationSection("Aufgabe 1 · Größen der Kreisbewegung", `${clozePoints} von ${MAX_POINTS.cloze} Punkten`, clozePoints === MAX_POINTS.cloze,
      "Lückentext zu Winkelgeschwindigkeit, Bahngeschwindigkeit, Frequenz und Zentripetalkraft.",
      resultList(cloze.map((row) => ({
        ok: row.correct,
        text: row.correct
          ? `Lücke ${row.index + 1}: ${termLabel(row.chosen)}`
          : `Lücke ${row.index + 1}: deine Antwort „${row.chosen ? termLabel(row.chosen) : "leer"}“, richtig ist „${termLabel(CLOZE_SOLUTION[row.index])}“.`,
        why: row.correct ? "" : [row.chosen && !CLOZE_SOLUTION.includes(row.chosen) ? termReason(row.chosen) : "", termReason(CLOZE_SOLUTION[row.index])].filter(Boolean).join(" "),
      })))),
    evaluationSection("Aufgabe 2 · Was ändert sich?", `${sortPoints} von ${MAX_POINTS.sort} Punkten`, sortPoints === MAX_POINTS.sort,
      "Kreisbewegung mit konstanter Winkelgeschwindigkeit: Was ändert sich ständig, was bleibt gleich?",
      resultList(sort.map((row) => ({
        ok: row.correct,
        text: row.correct
          ? `${row.value.label} → ${zoneLabel(row.value.zone)}`
          : `${row.value.label} – deine Antwort: ${zoneLabel(row.chosen)}, richtig ist: ${zoneLabel(row.value.zone)}.`,
        why: row.correct ? "" : row.value.reason,
      })))),
    evaluationSection("Aufgabe 3 · Multiple Choice", `${mcPoints} von ${MAX_POINTS.mc} Punkten`, mcPoints === MAX_POINTS.mc,
      "Wähle bei jeder Frage alle richtigen Aussagen aus.",
      resultList(mc.map((row, index) => {
        const wrongChosen = row.question.options.filter((option) => !option.correct && row.chosen.includes(option.id));
        const missed = row.question.options.filter((option) => option.correct && !row.chosen.includes(option.id));
        return {
          ok: row.correct,
          text: `Frage ${index + 1}: ${row.question.text} Richtig: ${row.question.options.filter((option) => option.correct).map((option) => option.text).join(" · ")}`,
          why: row.correct ? "" : [
            ...wrongChosen.map((option) => `„${option.text}“ ist falsch: ${option.reason}`),
            missed.length ? `Gefehlt hat: ${missed.map((option) => `„${option.text.replace(/\.$/, "")}“`).join(", ")}.` : "",
            row.question.why,
          ].filter(Boolean).join(" "),
        };
      }))),
    ...DESCRIBE_TASKS.map(describeSection),
  );
  document.getElementById("evaluation-total").textContent = `Ergebnis: ${pointsLine()}`;
  updateProgress();
}

function describeEvaluation(task) {
  const box = element("div", "physics-semantic-feedback describe-evaluation");
  const answer = answerOf(task);
  const ai = state.ai[task.id];
  box.dataset.status = ai?.status || "";
  box.append(element("p", "describe-answer", answer ? `Deine Antwort: ${answer}` : "Deine Antwort: (leer)"));
  if (answer.length < DESCRIBE_MIN_LENGTH) {
    const hint = element("p", "", "Keine ausreichende Antwort – 0 Aspekte. ");
    appendPhysicsText(hint, task.shortHint);
    box.append(hint);
    return box;
  }
  if (!ai || ai.level === "loading") {
    box.append(element("p", "", "Deine Antwort wird mit dem Erwartungshorizont verglichen …"));
    return box;
  }
  if (ai.level === "error") {
    box.append(element("p", "", `Die Antwort konnte nicht automatisch bewertet werden (${ai.message}). Deine Lehrkraft bewertet diese Aufgabe selbst.`));
    return box;
  }
  box.append(element("h4", "", `${ai.status}: ${ai.points} von ${ai.maxPoints} Aspekten erkannt.`));
  [["Das ist dir gelungen:", ai.strengths, "Noch kein Aspekt wurde eindeutig erkannt."], ["Das hat gefehlt:", ai.missing, "Es fehlen keine wesentlichen Aspekte."]].forEach(([title, entries, fallback]) => {
    box.append(element("h4", "", title));
    const list = document.createElement("ul");
    (entries?.length ? entries : [fallback]).forEach((entry) => list.append(element("li", "", entry)));
    box.append(list);
  });
  if (ai.feedback) box.append(element("p", "", ai.feedback));
  return box;
}

// Auswertung der Beschreibe-Aufgaben über die vorhandene JSONP-Anbindung.
// Nacheinander statt gleichzeitig, damit eine ganze Klasse den Server nicht mit
// dreifachen Anfragen auf einmal belastet.
async function requestDescriptionEvaluations() {
  const pending = DESCRIBE_TASKS.filter((task) => {
    const ai = state.ai[task.id];
    return answerOf(task).length >= DESCRIBE_MIN_LENGTH && (!ai || ai.level === "loading");
  });
  if (!pending.length) return;
  pending.forEach((task) => { state.ai[task.id] = { level: "loading" }; });
  renderEvaluation();
  for (const task of pending) {
    try {
      const result = await evaluateSemanticAnswer({ serverUrl: SCRIPT_SERVER_URL, taskId: task.taskId, answer: answerOf(task) });
      state.ai[task.id] = {
        level: "result",
        status: result.status || "noch nicht korrekt",
        points: Number(result.points) || 0,
        maxPoints: Number(result.maxPoints) || task.maxPoints,
        strengths: Array.isArray(result.strengths) ? result.strengths.map(String) : [],
        missing: Array.isArray(result.missing) ? result.missing.map(String) : [],
        feedback: result.feedback || "",
      };
    } catch (error) {
      state.ai[task.id] = { level: "error", message: error.message || "Der Auswertungsserver war nicht erreichbar." };
    }
    saveState();
    renderEvaluation();
  }
}

let boards = [];

function lockInputs() {
  DESCRIBE_TASKS.forEach((task) => { document.getElementById(`describe-${task.id}`).readOnly = state.submitted; });
  document.querySelector(".test-submit-row").hidden = state.submitted;
  document.querySelectorAll(".drag-help").forEach((help) => { help.hidden = state.submitted; });
}

function submitTest(event) {
  event.preventDefault();
  if (state.submitted) return;
  const open = taskStatus().filter((done) => !done).length;
  if (open && !window.confirm(`${open === 1 ? "Eine Aufgabe ist" : `${open} Aufgaben sind`} noch nicht vollständig bearbeitet. Möchtest du den Test trotzdem abgeben?`)) return;
  state.submitted = true;
  DESCRIBE_TASKS.forEach((task) => { state.ai[task.id] = null; });
  saveState();
  lockInputs();
  boards.forEach((board) => board.render());
  renderMcQuestions();
  showEvaluation(true);
  requestDescriptionEvaluations();
}

function showEvaluation(focus) {
  const panel = document.getElementById("evaluation");
  panel.hidden = false;
  renderEvaluation();
  if (focus) {
    const heading = document.getElementById("evaluation-title");
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
    panel.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

function setupDescribeTask(task) {
  const textarea = document.getElementById(`describe-${task.id}`);
  const counter = document.getElementById(`describe-${task.id}-count`);
  const updateCounter = () => { counter.textContent = `${textarea.value.length} von 3000 Zeichen`; };
  textarea.addEventListener("input", () => { state.texts[task.id] = textarea.value; updateCounter(); saveState(); updateProgress(); });
  textarea.value = state.texts[task.id];
  updateCounter();
}

function init() {
  boards = [
    setupBoard({
      root: document.getElementById("term-cloze"),
      rootSelector: "#term-cloze",
      items: CLOZE_TERMS.map((term) => ({ key: term.key, label: term.label || term.key })),
      assignment: state.cloze,
      capacity: () => 1,
      layout: clozeLayout,
    }),
    setupBoard({
      root: document.getElementById("situation-sort"),
      rootSelector: "#situation-sort",
      items: SORT_VALUES.map((value) => ({ key: value.key, label: value.label })),
      assignment: state.sort,
      capacity: () => Infinity,
      layout: sortLayout,
    }),
  ];
  renderMcQuestions();
  DESCRIBE_TASKS.forEach(setupDescribeTask);
  document.getElementById("quiz-test").addEventListener("submit", submitTest);
  document.getElementById("print-evaluation").addEventListener("click", () => window.print());
  document.getElementById("reset-test").addEventListener("click", () => {
    if (!window.confirm("Möchtest du den Test wirklich neu starten? Alle Eingaben werden gelöscht.")) return;
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* nichts gespeichert */ }
    window.location.reload();
  });
  lockInputs();
  updateProgress();
  if (state.submitted) {
    showEvaluation(false);
    requestDescriptionEvaluations();
  }
}

if (typeof document !== "undefined") document.addEventListener("DOMContentLoaded", init);
