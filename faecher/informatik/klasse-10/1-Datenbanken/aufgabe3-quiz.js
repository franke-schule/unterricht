// Löschanleitung: aufgabe3-quiz-loeschen.txt. Wiederholungs-Quiz zu Aufgabe 3.
import { enableTokenDrag, wasDragged } from "../../../physik/klasse-11/1-Kreisbewegungen/components/token-drag.mjs";
import { evaluateSemanticAnswer } from "../../klasse-11/1-Kuenstliche-Intelligenz/perzeptron/ui/semantic-answer.mjs";
const STORAGE_KEY = "informatik10-datenbanken-aufgabe3-test-v1";
const SCRIPT_SERVER_URL = "https://script.google.com/macros/s/AKfycby8RWL6uYrKZyoJ6m2GRpWyRmXjwsdskyCiqzKpRhIK5-wrDl-9lWWk8CiAGaVMoy0x/exec";
const DESCRIBE_MIN_LENGTH = 30;

const DESCRIBE_TASKS = [
  {
    id: "foto", number: 4, title: "Neues Foto zuordnen",
    taskId: "inf10-a3-quiz-foto-beschreibung", maxPoints: 3,
    prompt: "In users hat Samira die id 7. Ein neues Foto hat photos.id = 42 und soll ihr gehören. Beschreibe, welchen Wert photos.user_id erhält, worauf dieser Wert verweist und warum die Foto-ID dafür nicht genügt.",
    shortHint: "photos.user_id erhält den Wert 7 und verweist damit auf users.id = 7. photos.id = 42 kennzeichnet das Foto selbst.",
  },
  {
    id: "regal", number: 5, title: "1:n-Beziehung übertragen",
    taskId: "inf10-a3-quiz-regal-beschreibung", maxPoints: 3,
    prompt: "In einer Bibliothek stehen in einem Regal mehrere Bücher. Jedes Buch steht in genau einem Regal. Beschreibe die Beziehung in beiden Richtungen und gib an, wo im Klassendiagramm 1 und n stehen.",
    shortHint: "Ein Regal kann mehrere Bücher enthalten, jedes Buch gehört genau einem Regal. Im Diagramm steht 1 bei Regal und n bei Buch.",
  },
];
const DESCRIBE_MAX_POINTS = DESCRIBE_TASKS.reduce((sum, task) => sum + task.maxPoints, 0);

const CLOZE_TERMS = [
  { key: "Fremdschlüssel", reason: "photos.user_id ist der Fremdschlüssel: Er verweist auf den Benutzer in einer anderen Tabelle." },
  { key: "description", reason: "description enthält die Bildbeschreibung und verbindet die Tabellen nicht." },
  { key: "users", reason: "Der Benutzerdatensatz steht in users." },
  { key: "id", reason: "users.id kennzeichnet einen Benutzer eindeutig." },
  { key: "Kardinalität", reason: "Die Kardinalität beschreibt die Anzahl möglicher Beziehungen, nicht eine Schlüsselspalte." },
  { key: "photos", reason: "Fotos werden in photos gespeichert." },
  { key: "Primärschlüssel", reason: "users.id ist der Primärschlüssel der Benutzertabelle." },
  { key: "user_id", reason: "photos.user_id enthält die ID des zugehörigen Benutzers." },
];
const CLOZE_SOLUTION = ["photos", "user_id", "users", "id", "Primärschlüssel", "Fremdschlüssel"];
const CLOZE_PARTS = [
  "Die Tabelle ", " speichert die Fotos. Die Spalte ", " eines Fotos verweist auf einen Datensatz in ",
  ". Dort identifiziert die Spalte ", " den Benutzer eindeutig. users.id ist der ",
  "; photos.user_id heißt ", ".",
];
const CLOZE_SLOTS = CLOZE_SOLUTION.map((_, index) => `gap-${index}`);

const SORT_ZONES = [
  { id: "users", label: "users.id" },
  { id: "photos", label: "photos.user_id" },
];
const SORT_VALUES = [
  { key: "u-table", label: "steht in der Tabelle users", zone: "users", reason: "users.id ist eine Spalte der Tabelle users." },
  { key: "p-user", label: "enthält die ID des zugehörigen Benutzers", zone: "photos", reason: "photos.user_id speichert beim Foto die ID seines Benutzers." },
  { key: "u-unique", label: "identifiziert einen Benutzer eindeutig", zone: "users", reason: "Die ID in users kennzeichnet genau einen Benutzer." },
  { key: "p-repeat", label: "kann bei mehreren Fotos denselben Wert besitzen", zone: "photos", reason: "Mehrere Fotos desselben Benutzers verweisen auf dieselbe users.id." },
  { key: "p-table", label: "steht in der Tabelle photos", zone: "photos", reason: "photos.user_id ist eine Spalte der Tabelle photos." },
  { key: "u-primary", label: "ist hier der Primärschlüssel", zone: "users", reason: "users.id ist der Primärschlüssel der Benutzertabelle." },
  { key: "p-foreign", label: "ist hier der Fremdschlüssel", zone: "photos", reason: "photos.user_id verweist auf den Primärschlüssel users.id." },
  { key: "u-target", label: "liefert die Benutzer-ID, auf die das Foto verweist", zone: "users", reason: "Der Wert von users.id ist das Ziel des Verweises aus photos.user_id." },
];

const MC_QUESTIONS = [
  {
    id: "q1", text: "Ein Benutzer besitzt drei Fotos. Welche Aussagen zur Beziehung stimmen?",
    why: "Bei der 1:n-Beziehung kann ein Benutzer mehrere Fotos besitzen; jedes Foto gehört genau einem Benutzer.",
    options: [
      { id: "many", text: "Der Benutzer kann mit mehreren Fotos verbunden sein.", correct: true },
      { id: "one", text: "Jedes dieser Fotos gehört genau einem Benutzer.", correct: true },
      { id: "three", text: "Jedes Foto gehört drei Benutzern.", reason: "Die drei Fotos gehören dem einen Benutzer, nicht umgekehrt." },
      { id: "one-one", text: "Die Beziehung ist 1:1.", reason: "Ein Benutzer kann mehrere Fotos besitzen, daher ist die Beziehung 1:n." },
    ],
  },
  {
    id: "q2", text: "Welche Aussagen zu photos.user_id stimmen?",
    why: "Der Fremdschlüssel steht beim Foto und verweist auf users.id.",
    options: [
      { id: "at-photo", text: "Sie steht beim Foto.", correct: true },
      { id: "references", text: "Sie verweist auf users.id.", correct: true },
      { id: "photo-id", text: "Sie ist die eindeutige Foto-ID.", reason: "Die Foto-ID heißt photos.id. photos.user_id nennt den Benutzer." },
      { id: "username", text: "Sie speichert den Benutzernamen.", reason: "Sie enthält eine ID, keinen Benutzernamen." },
    ],
  },
  {
    id: "q3", text: "Wo stehen die Kardinalitäten im Diagramm users — photos?",
    why: "Direkt bei users steht 1 und direkt bei photos steht n: Ein Benutzer kann mehrere Fotos besitzen.",
    options: [
      { id: "one-users", text: "1 bei users", correct: true },
      { id: "many-photos", text: "n bei photos", correct: true },
      { id: "many-users", text: "n bei users", reason: "Ein Foto gehört genau einem Benutzer; bei users steht daher 1." },
      { id: "one-photos", text: "1 bei photos", reason: "Ein Benutzer kann mehrere Fotos besitzen; bei photos steht daher n." },
    ],
  },
  {
    id: "q4", text: "Ein Foto hat photos.id = 42 und photos.user_id = 7. Was folgt daraus?",
    why: "photos.id kennzeichnet das Foto; photos.user_id nennt die ID des zugehörigen Benutzers.",
    options: [
      { id: "owner-seven", text: "Es gehört zum Benutzer mit users.id = 7.", correct: true },
      { id: "photo-forty-two", text: "Die Foto-ID 42 identifiziert das Foto.", correct: true },
      { id: "owner-forty-two", text: "Es gehört zum Benutzer 42.", reason: "42 ist die Foto-ID; die Benutzer-ID steht in photos.user_id und lautet 7." },
      { id: "equal", text: "Die Zahlen 42 und 7 müssen gleich sein.", reason: "Foto-ID und Benutzer-ID kennzeichnen verschiedene Datensätze." },
    ],
  },
  {
    id: "q5", text: "Zwei Fotos haben beide user_id = 7. Welche Aussagen stimmen?",
    why: "Bei einer 1:n-Beziehung können mehrere Fotos über dieselbe Benutzer-ID auf einen Benutzer verweisen.",
    options: [
      { id: "same-owner", text: "Beide können demselben Benutzer gehören.", correct: true },
      { id: "each-reference", text: "Jedes der Fotos verweist einzeln auf diesen Benutzer.", correct: true },
      { id: "same-photo-id", text: "Die Fotos müssen dieselbe Foto-ID haben.", reason: "Jedes Foto hat eine eigene photos.id; nur die user_id darf gleich sein." },
      { id: "max-one", text: "Ein Benutzer darf höchstens ein Foto besitzen.", reason: "Ein Benutzer kann mehrere Fotos besitzen; das ist das n der Beziehung." },
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
      const node = element("span", `${className} is-locked${mark ? ` is-${mark}` : ""}`, labelOf(key));
      if (mark) node.append(resultMark(mark === "correct"));
      return node;
    }
    const node = element("button", className, labelOf(key));
    node.type = "button";
    node.dataset.key = key;
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

function termReason(key) { return CLOZE_TERMS.find((term) => term.key === key)?.reason || ""; }

function clozeLayout({ bank, card, target, assignment, picked }) {
  const sentence = element("p", "cloze-sentence");
  const byGap = Object.fromEntries(Object.entries(assignment).map(([key, slot]) => [slot, key]));
  CLOZE_PARTS.forEach((part, index) => {
    sentence.append(part);
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
  const grid = element("div", "subset-zones");
  SORT_ZONES.forEach((zone) => {
    const box = target(element("div", `subset-zone is-${zone.id}`), zone.id);
    box.setAttribute("role", "group");
    box.setAttribute("aria-label", zone.label);
    const label = element(state.submitted ? "span" : "button", "subset-zone-label");
    label.append(element("strong", "", zone.label));
    if (!state.submitted) {
      label.type = "button";
      label.append(element("small", "", picked ? "hier ablegen" : ""));
      label.setAttribute("aria-label", `${zone.label}${picked ? ": ausgewählte Karte hier ablegen" : ""}`);
    }
    box.append(label);
    const list = element("div", "subset-zone-items");
    SORT_VALUES.filter((value) => assignment[value.key] === zone.id).forEach((value) => {
      const mark = state.submitted ? (value.zone === zone.id ? "correct" : "wrong") : "";
      list.append(card(value.key, "cloze-token subset-card", mark));
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
    const fieldset = element("fieldset", "quiz-question");
    const legend = element("legend", "", `Frage ${index + 1} · ${question.text}`);
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
      label.append(input, element("span", "quiz-option-text", option.text));
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
    item.append(element("strong", "", ok ? "✓ richtig: " : "✗ falsch: "), text);
    if (why) item.append(element("span", "evaluation-why", why));
    list.append(item);
  });
  return list;
}

function evaluationSection(title, badgeText, complete, prompt, content) {
  const section = element("section", "evaluation-section");
  const heading = element("h3", "", `${title} `);
  heading.append(element("span", `evaluation-score ${complete ? "is-complete" : "is-open"}`, badgeText));
  section.append(heading, element("p", "evaluation-prompt", prompt), ...[].concat(content));
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
    evaluationSection("Aufgabe 1 · Schlüssel und Tabellen", `${clozePoints} von ${MAX_POINTS.cloze} Punkten`, clozePoints === MAX_POINTS.cloze,
      "Ergänze die passenden Begriffe zu photos, users und ihren Schlüsseln.",
      resultList(cloze.map((row) => ({
        ok: row.correct,
        text: row.correct
          ? `Lücke ${row.index + 1}: ${row.chosen}`
          : `Lücke ${row.index + 1}: deine Antwort „${row.chosen || "leer"}“, richtig ist „${CLOZE_SOLUTION[row.index]}“.`,
        why: row.correct ? "" : [row.chosen && !CLOZE_SOLUTION.includes(row.chosen) ? termReason(row.chosen) : "", termReason(CLOZE_SOLUTION[row.index])].filter(Boolean).join(" "),
      })))),
    evaluationSection("Aufgabe 2 · Spalten vergleichen", `${sortPoints} von ${MAX_POINTS.sort} Punkten`, sortPoints === MAX_POINTS.sort,
      "Ordne jede Aussage users.id oder photos.user_id zu.",
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
          text: `Frage ${index + 1}: ${row.question.text} Deine Auswahl: ${row.question.options.filter((option) => row.chosen.includes(option.id)).map((option) => option.text).join(" · ") || "(leer)"} Richtig: ${row.question.options.filter((option) => option.correct).map((option) => option.text).join(" · ")}`,
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
  const box = element("div", "semantic-feedback describe-evaluation");
  const answer = answerOf(task);
  const ai = state.ai[task.id];
  box.dataset.status = ai?.status || "";
  box.append(element("p", "describe-answer", answer ? `Deine Antwort: ${answer}` : "Deine Antwort: (leer)"));
  box.append(element("p", "evaluation-solution", `Richtige Lösung: ${task.shortHint}`));
  if (answer.length < DESCRIBE_MIN_LENGTH) {
    box.append(element("p", "", `Keine ausreichende Antwort – 0 Aspekte. ${task.shortHint}`));
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
      items: CLOZE_TERMS.map((term) => ({ key: term.key, label: term.key })),
      assignment: state.cloze,
      capacity: () => 1,
      layout: clozeLayout,
    }),
    setupBoard({
      root: document.getElementById("subset-sort"),
      rootSelector: "#subset-sort",
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
