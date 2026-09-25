import { enableTokenDrag, wasDragged } from "./components/token-drag.mjs";
import { appendPhysicsText, physicsTextSpan } from "./components/physics-notation.mjs?v=20260911a";
import { evaluateSemanticAnswer } from "../../../informatik/klasse-11/1-Kuenstliche-Intelligenz/perzeptron/ui/semantic-answer.mjs";

// Test zu Wiederholung 2: nicht verlinkte Seite, Auswertung erst nach der Abgabe.
// Eigenständig aufgebaut, damit der Test ohne Reste wieder entfernt werden kann.
const STORAGE_KEY = "physik11-kreisbewegungen-wdh2-test-v1";
const SCRIPT_SERVER_URL = "https://script.google.com/macros/s/AKfycby8RWL6uYrKZyoJ6m2GRpWyRmXjwsdskyCiqzKpRhIK5-wrDl-9lWWk8CiAGaVMoy0x/exec";
const DESCRIBE_TASK_ID = "ph11-wdh2-quiz-crashtest-beschreibung";
const DESCRIBE_MAX_POINTS = 4;
const DESCRIBE_MIN_LENGTH = 30;
const DESCRIBE_SHORT_HINT = "Beim Aufprall üben Auto und Wand gleich große, entgegengesetzt gerichtete Kräfte aufeinander aus. Sie greifen an zwei verschiedenen Körpern an und bilden deshalb kein Kräftegleichgewicht. Beim Fallschirmspringer greifen Gewichtskraft und Luftwiderstandskraft am selben Körper an und heben sich auf.";

// Aufgabe 1: Lückentext mit Wortkarten, Bedienung über die vorhandene Komponente token-drag.mjs.
const CLOZE_TERMS = [
  { key: "entgegengesetzt", reason: "Die beiden Kräfte zeigen in entgegengesetzte Richtungen." },
  { key: "gleichgerichtet", reason: "Zeigten beide Kräfte in dieselbe Richtung, würden sie sich addieren statt aufheben." },
  { key: "Kräftegleichgewicht", reason: "Ein Kräftegleichgewicht liegt vor, wenn sich die Kräfte an einem Körper zu null ergänzen." },
  { key: "maximal", reason: "Bei konstanter Geschwindigkeit ist die resultierende Kraft nicht maximal, sondern null." },
  { key: "null", reason: "Ändert sich der Bewegungszustand nicht, ist die resultierende Kraft null." },
  { key: "selben", reason: "Beim Kräftegleichgewicht greifen alle beteiligten Kräfte am selben Körper an." },
  { key: "Wechselwirkungskräfte", reason: "Kräfte, die zwei Körper aufeinander ausüben, heißen Wechselwirkungskräfte." },
  { key: "zwei verschiedene", reason: "Wechselwirkungskräfte greifen an zwei verschiedenen Körpern an und heben sich deshalb nicht auf." },
];
const CLOZE_SOLUTION = ["null", "entgegengesetzt", "selben", "Kräftegleichgewicht", "zwei verschiedene", "Wechselwirkungskräfte"];
const CLOZE_PARTS = [
  "Sinkt ein Fallschirmspringer mit konstanter Geschwindigkeit, ist die resultierende Kraft ",
  ". Gewichtskraft und Luftwiderstandskraft sind gleich groß, ",
  " gerichtet und greifen am ",
  " Körper an. Man spricht von einem ",
  ". Beim Crashtest sind die Kraft des Autos auf die Wand und die Kraft der Wand auf das Auto ebenfalls gleich groß und entgegengesetzt gerichtet, sie greifen aber an ",
  " Körpern an. Solche Kräfte heißen ",
  ".",
];
const CLOZE_SLOTS = CLOZE_SOLUTION.map((_, index) => `gap-${index}`);

// Aufgabe 2: Situationen den beiden Begriffen zuordnen.
const SORT_ZONES = [
  { id: "balance", label: "Kräftegleichgewicht" },
  { id: "interaction", label: "Wechselwirkungskräfte" },
];
const SORT_VALUES = [
  { key: "car-wall", label: "Das Auto drückt gegen die Wand, die Wand drückt gegen das Auto.", zone: "interaction", reason: "Zwei Körper üben Kräfte aufeinander aus – das ist eine Wechselwirkung." },
  { key: "book", label: "Auf ein ruhendes Buch wirken seine Gewichtskraft und die Kraft der Tischplatte.", zone: "balance", reason: "Beide Kräfte greifen am Buch an und ergänzen sich zu null. „Das Buch drückt auf den Tisch, der Tisch drückt auf das Buch“ wäre dagegen ein Wechselwirkungspaar." },
  { key: "two-bodies", label: "Die beiden Kräfte greifen an zwei verschiedenen Körpern an.", zone: "interaction", reason: "Kräfte an verschiedenen Körpern können sich nicht gegenseitig aufheben." },
  { key: "parachute", label: "Auf einen Fallschirmspringer, der gleichmäßig sinkt, wirken Gewichtskraft und Luftwiderstandskraft.", zone: "balance", reason: "Beide Kräfte greifen am Springer an und sind gleich groß. Luft und Springer, die sich gegenseitig anschieben, wären dagegen ein Wechselwirkungspaar." },
  { key: "foot-ball", label: "Der Fuß tritt gegen den Ball, der Ball drückt gegen den Fuß.", zone: "interaction", reason: "Auch hier üben zwei Körper Kräfte aufeinander aus." },
  { key: "same-body", label: "Die beiden Kräfte greifen am selben Körper an.", zone: "balance", reason: "Nur Kräfte am selben Körper können sich zu null ergänzen." },
  { key: "earth", label: "Die Erde zieht den Springer an, der Springer zieht die Erde an.", zone: "interaction", reason: "Die beiden Anziehungskräfte wirken auf Erde und Springer, also auf zwei Körper." },
  { key: "zero", label: "Die resultierende Kraft auf den Körper ist null.", zone: "balance", reason: "Eine resultierende Kraft von null ist gerade das Kennzeichen des Kräftegleichgewichts." },
];

// Aufgabe 3: Multiple Choice nach dem Muster der vorhandenen Quizfragen in kraefte-bewegung.mjs.
const MC_QUESTIONS = [
  {
    id: "q1",
    text: "Welche Aussagen zum newtonschen Grundgesetz sind richtig?",
    why: "Der Kraftimpuls entspricht der Änderung des Bewegungsimpulses. Bei gleicher Kraft wirkt eine längere Zeit stärker, und eine kleinere Masse wird stärker beschleunigt.",
    options: [
      { id: "constant", text: "Jede Kraft hält die Geschwindigkeit eines Körpers konstant.", reason: "Eine Kraft ändert den Bewegungszustand. Konstant bleibt die Geschwindigkeit nur, wenn sich alle Kräfte zu null ergänzen." },
      { id: "law", text: "Der Kraftimpuls entspricht der Änderung des Bewegungsimpulses.", correct: true },
      { id: "time", text: "Bei gleicher Kraft führt eine längere Einwirkzeit zu einer größeren Geschwindigkeitsänderung.", correct: true },
      { id: "mass", text: "Bei gleicher Kraft wird eine größere Masse stärker beschleunigt.", reason: "Aus F = m · a folgt: Je größer die Masse, desto kleiner die Beschleunigung." },
    ],
  },
  {
    id: "q2",
    text: "Welche Aussagen beschreiben ein Kräftegleichgewicht richtig?",
    why: "Beim Kräftegleichgewicht ist die resultierende Kraft null, der Bewegungszustand bleibt also erhalten: Ruhe oder gleichförmige Bewegung.",
    options: [
      { id: "sum", text: "Die resultierende Kraft ist null.", correct: true },
      { id: "only", text: "Es darf nur eine einzige Kraft wirken.", reason: "Wirkte nur eine Kraft, wäre die resultierende Kraft gerade nicht null." },
      { id: "state", text: "Der Bewegungszustand bleibt gleich: Ruhe oder gleichförmige Bewegung.", correct: true },
      { id: "acceleration", text: "Ein Kräftegleichgewicht bedeutet immer eine Beschleunigung.", reason: "Eine Beschleunigung setzt eine resultierende Kraft voraus. Beim Kräftegleichgewicht ist sie null." },
    ],
  },
  {
    id: "q3",
    text: "Ein Fallschirmspringer sinkt mit konstanter Geschwindigkeit. Welche Aussagen treffen zu?",
    why: "Gewichtskraft {{F_G}} und Luftwiderstandskraft {{F_R}} wirken gleichzeitig, sind gleich groß und ergänzen sich zu null.",
    options: [
      { id: "weight-only", text: "Es wirkt nur die Gewichtskraft {{F_G}}.", reason: "Wirkte nur die Gewichtskraft, würde der Springer immer schneller werden. Er sinkt aber mit konstanter Geschwindigkeit." },
      { id: "both", text: "Es wirken die Gewichtskraft {{F_G}} und die Luftwiderstandskraft {{F_R}}.", correct: true },
      { id: "equal", text: "Die beiden Kräfte sind gleich groß.", correct: true },
      { id: "greater", text: "{{F_G}} ist größer als {{F_R}}, sonst würde der Springer nicht sinken.", reason: "Zum Sinken ist keine resultierende Kraft nötig. Wäre {{F_G}} größer, würde der Springer schneller werden." },
    ],
  },
  {
    id: "q4",
    text: "Welche Aussagen über die beiden Kräfte beim Zusammenstoß von Auto und Wand sind richtig?",
    why: "Wechselwirkungskräfte sind gleich groß und entgegengesetzt gerichtet, greifen aber an zwei verschiedenen Körpern an.",
    options: [
      { id: "same", text: "Die beiden Kräfte haben den gleichen Betrag.", correct: true },
      { id: "wall", text: "Die Wand übt grundsätzlich die größere Kraft aus.", reason: "Die Wand bleibt unbeschädigt, weil sie fest verankert ist, nicht weil sie stärker drückt. Beide Kräfte sind gleich groß." },
      { id: "opposite", text: "Die beiden Kräfte sind entgegengesetzt gerichtet.", correct: true },
      { id: "different", text: "Die beiden Kräfte greifen an zwei verschiedenen Körpern an.", correct: true },
    ],
  },
  {
    id: "q5",
    text: "Ein Auto fährt geradeaus mit konstanter Geschwindigkeit. Was gilt für die Kräfte?",
    why: "Konstante Geschwindigkeit bedeutet: Die Kräfte am Auto ergänzen sich zu null.",
    options: [
      { id: "drive", text: "Die Antriebskraft ist größer als die Reibungskraft, sonst würde das Auto stehen bleiben.", reason: "Eine größere Antriebskraft würde das Auto beschleunigen. Zum Halten der Geschwindigkeit genügt eine gleich große Antriebskraft." },
      { id: "none", text: "Auf das Auto wirkt überhaupt keine Kraft.", reason: "Es wirken mehrere Kräfte, zum Beispiel Antriebskraft und Reibungskraft. Ihre Summe ist null." },
      { id: "balance", text: "Antriebskraft und Reibungskraft sind gleich groß, die resultierende Kraft ist null.", correct: true },
      { id: "bodies", text: "Die beiden Kräfte greifen an zwei verschiedenen Körpern an.", reason: "Beide Kräfte greifen am Auto an. Genau deshalb können sie sich aufheben." },
    ],
  },
];

const MAX_POINTS = { cloze: CLOZE_SOLUTION.length, sort: SORT_VALUES.length, mc: MC_QUESTIONS.length, describe: DESCRIBE_MAX_POINTS };
const TOTAL_POINTS = Object.values(MAX_POINTS).reduce((sum, value) => sum + value, 0);

const DEFAULT_STATE = {
  cloze: {},
  sort: {},
  mc: Object.fromEntries(MC_QUESTIONS.map((question) => [question.id, []])),
  text: "",
  submitted: false,
  ai: null,
};

let state = loadState();

function clone(value) { return JSON.parse(JSON.stringify(value)); }

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved) return clone(DEFAULT_STATE);
    return { ...clone(DEFAULT_STATE), ...saved, mc: { ...clone(DEFAULT_STATE.mc), ...saved.mc } };
  } catch {
    return clone(DEFAULT_STATE);
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

function clozeLayout({ bank, card, target, assignment, picked }) {
  const sentence = element("p", "cloze-sentence");
  const byGap = Object.fromEntries(Object.entries(assignment).map(([key, slot]) => [slot, key]));
  CLOZE_PARTS.forEach((part, index) => {
    sentence.append(document.createTextNode(part));
    if (index >= CLOZE_SLOTS.length) return;
    const slot = CLOZE_SLOTS[index];
    const key = byGap[slot];
    const attached = /^\S/.test(CLOZE_PARTS[index + 1]);
    if (key) {
      const mark = state.submitted ? (key === CLOZE_SOLUTION[index] ? "correct" : "wrong") : "";
      const gap = target(card(key, `cloze-gap is-filled${attached ? " is-attached" : ""}`, mark), slot);
      gap.setAttribute("aria-label", `Lücke ${index + 1}: ${key}${mark ? (mark === "correct" ? ", richtig" : ", falsch") : ""}`);
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

function taskStatus() {
  return [
    CLOZE_SLOTS.every((slot) => Object.values(state.cloze).includes(slot)),
    SORT_VALUES.every((value) => state.sort[value.key]),
    MC_QUESTIONS.every((question) => state.mc[question.id].length > 0),
    state.text.trim().length >= DESCRIBE_MIN_LENGTH,
  ];
}

function updateProgress() {
  const done = taskStatus().filter(Boolean).length;
  document.getElementById("progress-label").textContent = state.submitted ? "Test abgegeben" : `${done} von 4 Aufgaben bearbeitet`;
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

function aiPoints() {
  if (state.ai && Number.isFinite(state.ai.points) && state.ai.maxPoints > 0) return Math.min(state.ai.points, DESCRIBE_MAX_POINTS);
  if (state.text.trim().length < DESCRIBE_MIN_LENGTH) return 0;
  return null; // noch nicht oder nicht automatisch bewertet
}

function pointsLine() {
  const local = scoreCloze().filter((row) => row.correct).length + scoreSort().filter((row) => row.correct).length + scoreMc().filter((row) => row.correct).length;
  const describe = aiPoints();
  if (describe === null) return `${local} von ${TOTAL_POINTS - DESCRIBE_MAX_POINTS} Punkten (ohne Aufgabe 4)`;
  return `${local + describe} von ${TOTAL_POINTS} Punkten`;
}

function zoneLabel(id) { return SORT_ZONES.find((zone) => zone.id === id)?.label || "nicht zugeordnet"; }
function termReason(key) { return CLOZE_TERMS.find((term) => term.key === key)?.reason || ""; }

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

function renderEvaluation() {
  const cloze = scoreCloze();
  const sort = scoreSort();
  const mc = scoreMc();
  const clozePoints = cloze.filter((row) => row.correct).length;
  const sortPoints = sort.filter((row) => row.correct).length;
  const mcPoints = mc.filter((row) => row.correct).length;
  const describePoints = aiPoints();
  const describeBadge = describePoints !== null
    ? `${describePoints} von ${MAX_POINTS.describe} Aspekten`
    : state.ai?.level === "error" ? "Bewertung durch Lehrkraft" : "wird bewertet";

  document.getElementById("evaluation-details").replaceChildren(
    evaluationSection("Aufgabe 1 · Kräftegleichgewicht und Wechselwirkung", `${clozePoints} von ${MAX_POINTS.cloze} Punkten`, clozePoints === MAX_POINTS.cloze,
      "Lückentext zu Fallschirmspringer und Crashtest.",
      resultList(cloze.map((row) => ({
        ok: row.correct,
        text: row.correct
          ? `Lücke ${row.index + 1}: ${row.chosen}`
          : `Lücke ${row.index + 1}: deine Antwort „${row.chosen || "leer"}“, richtig ist „${CLOZE_SOLUTION[row.index]}“.`,
        why: row.correct ? "" : [row.chosen && !CLOZE_SOLUTION.includes(row.chosen) ? termReason(row.chosen) : "", termReason(CLOZE_SOLUTION[row.index])].filter(Boolean).join(" "),
      })))),
    evaluationSection("Aufgabe 2 · Situationen einordnen", `${sortPoints} von ${MAX_POINTS.sort} Punkten`, sortPoints === MAX_POINTS.sort,
      "Kräftegleichgewicht oder Wechselwirkungskräfte?",
      resultList(sort.map((row) => ({
        ok: row.correct,
        text: row.correct
          ? `${row.value.label} → ${zoneLabel(row.value.zone)}`
          : `${row.value.label} Deine Antwort: ${zoneLabel(row.chosen)}, richtig ist ${zoneLabel(row.value.zone)}.`,
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
    evaluationSection("Aufgabe 4 · Crashtest beschreiben", describeBadge, describePoints === MAX_POINTS.describe,
      "Beschreibe die Kräfte beim Aufprall und vergleiche sie mit dem Fallschirmspringer.",
      describeEvaluation()),
  );
  document.getElementById("evaluation-total").textContent = `Ergebnis: ${pointsLine()}`;
  updateProgress();
}

function describeEvaluation() {
  const box = element("div", "physics-semantic-feedback describe-evaluation");
  const answer = state.text.trim();
  box.dataset.status = state.ai?.status || "";
  box.append(element("p", "describe-answer", answer ? `Deine Antwort: ${answer}` : "Deine Antwort: (leer)"));
  if (answer.length < DESCRIBE_MIN_LENGTH) {
    box.append(element("p", "", `Keine ausreichende Antwort – 0 Aspekte. ${DESCRIBE_SHORT_HINT}`));
    return box;
  }
  if (!state.ai || state.ai.level === "loading") {
    box.append(element("p", "", "Deine Antwort wird mit dem Erwartungshorizont verglichen …"));
    return box;
  }
  if (state.ai.level === "error") {
    box.append(element("p", "", `Die Antwort konnte nicht automatisch bewertet werden (${state.ai.message}). Deine Lehrkraft bewertet diese Aufgabe selbst.`));
    return box;
  }
  box.append(element("h4", "", `${state.ai.status}: ${state.ai.points} von ${state.ai.maxPoints} Aspekten erkannt.`));
  [["Das ist dir gelungen:", state.ai.strengths, "Noch kein Aspekt wurde eindeutig erkannt."], ["Das hat gefehlt:", state.ai.missing, "Es fehlen keine wesentlichen Aspekte."]].forEach(([title, entries, fallback]) => {
    box.append(element("h4", "", title));
    const list = document.createElement("ul");
    (entries?.length ? entries : [fallback]).forEach((entry) => list.append(element("li", "", entry)));
    box.append(list);
  });
  if (state.ai.feedback) box.append(element("p", "", state.ai.feedback));
  return box;
}

// Auswertung der Beschreibe-Aufgabe über die vorhandene JSONP-Anbindung.
async function requestDescriptionEvaluation() {
  const answer = state.text.trim();
  if (answer.length < DESCRIBE_MIN_LENGTH) return;
  state.ai = { level: "loading" };
  try {
    const result = await evaluateSemanticAnswer({ serverUrl: SCRIPT_SERVER_URL, taskId: DESCRIBE_TASK_ID, answer });
    state.ai = {
      level: "result",
      status: result.status || "noch nicht korrekt",
      points: Number(result.points) || 0,
      maxPoints: Number(result.maxPoints) || DESCRIBE_MAX_POINTS,
      strengths: Array.isArray(result.strengths) ? result.strengths.map(String) : [],
      missing: Array.isArray(result.missing) ? result.missing.map(String) : [],
      feedback: result.feedback || "",
    };
  } catch (error) {
    state.ai = { level: "error", message: error.message || "Der Auswertungsserver war nicht erreichbar." };
  }
  saveState();
  renderEvaluation();
}

let boards = [];

function lockInputs() {
  document.getElementById("describe-answer").readOnly = state.submitted;
  document.querySelector(".test-submit-row").hidden = state.submitted;
  document.querySelectorAll(".drag-help").forEach((help) => { help.hidden = state.submitted; });
}

function submitTest(event) {
  event.preventDefault();
  if (state.submitted) return;
  const open = taskStatus().filter((done) => !done).length;
  if (open && !window.confirm(`${open === 1 ? "Eine Aufgabe ist" : `${open} Aufgaben sind`} noch nicht vollständig bearbeitet. Möchtest du den Test trotzdem abgeben?`)) return;
  state.submitted = true;
  state.ai = null;
  saveState();
  lockInputs();
  boards.forEach((board) => board.render());
  renderMcQuestions();
  showEvaluation(true);
  requestDescriptionEvaluation();
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

function init() {
  boards = [
    setupBoard({
      root: document.getElementById("term-cloze"),
      rootSelector: "#term-cloze",
      items: CLOZE_TERMS.map((term) => ({ key: term.key, label: term.key })),
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
  const textarea = document.getElementById("describe-answer");
  const counter = document.getElementById("describe-count");
  const updateCounter = () => { counter.textContent = `${textarea.value.length} von 3000 Zeichen`; };
  textarea.value = state.text;
  updateCounter();
  textarea.addEventListener("input", () => { state.text = textarea.value; updateCounter(); saveState(); updateProgress(); });
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
    if (!state.ai || state.ai.level === "loading") requestDescriptionEvaluation();
  }
}

if (typeof document !== "undefined") document.addEventListener("DOMContentLoaded", init);
