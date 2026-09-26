import { enableTabKeyboardNavigation, focusTabPanelStart, renderTabFlowNavigation, syncTabSemantics } from './tab-navigation.mjs?v=20260906a';
import {
  KLASSE, KLASSENLEITER, KLASSE_LEITER_LOESUNG, KLASSE_LEITER_ID_VERWECHSLUNG,
  SCHUELER, AG, TEILNAHME, SCHUELER_VERSUCH, agIdsForSchueler, schuelerIdsForAg,
  INSTAHUB_USERS, INSTAHUB_PHOTOS, INSTAHUB_LIKES, INSTAHUB_FOLLOWS,
  usernameById, likedPhotoIdsByUser, likingUserIdsForPhoto,
  normalizeCardinality, evaluateCardinalityPair,
  BEZIEHUNGSARTEN_QUIZ, evaluateQuizQuestion,
} from './beziehungsarten-daten.mjs?v=20260926a';

const STORAGE_KEY = "informatik10-datenbanken-aufgabe8-v1";
const STEP_TITLES = ["1:1 entdecken", "1:1 umsetzen", "n:m entdecken", "Anmeldungen", "InstaHub", "likes", "follows", "Abschlussquiz"];
const TAB_ITEMS = [...STEP_TITLES.map((label, index) => ({ id: index + 1, label })), { id: "summary", label: "Übersicht" }];

const KUERZEL = ["SEI", "BRA", "KOH"];
const STEP_SUBTASKS = {
  1: ["r1-drag", "r1-f1a", "r1-f1b", "r1-cardinality"],
  2: ["r2-schema", "r2-cardinality", "r2-schluessel-schema"],
  3: ["r3-f3a", "r3-f3b", "r3-cardinality"],
  4: ["r4-f4a", "r4-f4b", "r4-f4c"],
  5: ["r5-cardinality"],
  6: ["r6-f6a", "r6-f6b", "r6-cardinality"],
  7: ["r7-f7a", "r7-f7b"],
  8: ["r8-quiz"],
};
const ALL_SUBTASK_IDS = Object.values(STEP_SUBTASKS).flat();

const R1_F1A_OPTIONS = [
  { id: "one", label: "… genau einen Klassenleiter.", correct: true },
  { id: "many", label: "… mehrere Klassenleiter.", correct: false },
];
const R1_F1B_OPTIONS = [
  { id: "one", label: "… genau eine Klasse.", correct: true },
  { id: "many", label: "… mehrere Klassen.", correct: false },
];
const R2_SCHEMA_OPTIONS = [
  { id: "A", label: "Schema A" },
  { id: "B", label: "Schema B" },
  { id: "C", label: "Schema C" },
];
const R2_SCHLUESSEL_SCHEMA_OPTIONS = [
  { id: "K1", lines: ["schluessel(id: int, nummer: int, besitzer: varchar(255), schloss_id[schloss]: int)", "schloss(id: int, ort: varchar(255))"] },
  { id: "K2", lines: ["schluessel(id: int, nummer: int, besitzer: varchar(255))", "schloss(id: int, ort: varchar(255), schluessel_id[schluessel]: int)"] },
  { id: "K3", lines: ["schluessel(id: int, nummer: int, besitzer: varchar(255), schloss_id[schloss]: int)", "schloss(id: int, ort: varchar(255), schluessel_id[schluessel]: int)"] },
  { id: "K4", lines: ["schluessel(id: int, nummer: int, besitzer: varchar(255))", "schloss(id: int, ort: varchar(255))"] },
];
const R3_F3A_OPTIONS = [
  { id: "multi", label: "1, 2" },
  { id: "twoRows", label: "Lina bekommt zwei Zeilen: eine mit ag_id 1 und eine mit ag_id 2." },
  { id: "onlyOne", label: "Nur 1 – für die zweite AG ist kein Platz." },
  { id: "none", label: "Keine dieser Möglichkeiten ist sauber: Mit einem einzigen Fremdschlüssel in schueler lässt sich das nicht speichern.", correct: true },
];
const R3_F3B_OPTIONS = [
  { id: "yes", label: "Ja, dann steht bei jeder AG die id eines Schülers, und alles passt." },
  { id: "no", label: "Nein, denn auch eine AG hat mehrere Schüler. Das Problem taucht nur auf der anderen Seite auf.", correct: true },
];
const R4_F4A_OPTIONS = [
  { id: "robotik", label: "Robotik", correct: true },
  { id: "theater", label: "Theater", correct: true },
  { id: "chor", label: "Chor", correct: false },
];
const R4_F4B_OPTIONS = [
  { id: "lina", label: "Lina", correct: true },
  { id: "ben", label: "Ben", correct: false },
  { id: "mia", label: "Mia", correct: true },
];
const R4_F4C_OPTIONS = [
  { id: "newRow", label: "In teilnahme kommt eine neue Zeile mit schueler_id 2 und ag_id 3.", correct: true },
  { id: "secondSchuelerRow", label: "Ben bekommt in schueler eine zweite Zeile." },
  { id: "combinedCell", label: "In teilnahme wird in Bens Zeile bei ag_id »1, 3« eingetragen." },
];
const R6_F6A_OPTIONS = [
  { id: "photo12", label: "Foto 12", correct: true },
  { id: "photo14", label: "Foto 14", correct: true },
  { id: "none", label: "Keines, weil in photos.user_id nirgends 15 steht" },
];
const R6_F6B_OPTIONS = [
  { id: "emil", label: "reisewut_emil", correct: true },
  { id: "jonas", label: "gamewut_jonas", correct: true },
  { id: "koch", label: "koch_kicker" },
  { id: "berg", label: "bergcoder" },
];
const R7_F7A_OPTIONS = [
  { id: "taroFollowsOeko", label: "wanderriese_taro folgt oekosmasher.", correct: true },
  { id: "oekoFollowsTaro", label: "oekosmasher folgt wanderriese_taro." },
  { id: "mutual", label: "oekosmasher und wanderriese_taro folgen sich gegenseitig." },
];
const R7_F7B_OPTIONS = [
  { id: "twoRows", label: "Dafür braucht follows zwei Zeilen.", correct: true },
  { id: "swapped", label: "In den beiden Zeilen sind following_id und follower_id vertauscht.", correct: true },
  { id: "oneRowEnough", label: "Eine Zeile reicht, weil Folgen immer in beide Richtungen gilt." },
  { id: "bothRefUsers", label: "Beide Fremdschlüssel verweisen auf die Tabelle users.", correct: true },
];

function emptyDefaultState() {
  return {
    currentStep: 1,
    completed: [],
    summaryUnlocked: false,
    solved: [],
    r1: { drag: { 1: "", 2: "", 3: "" }, f1a: "", f1b: "", klasse: "", klassenleiter: "" },
    r2: { schema: [], schluesselA: "", schluesselB: "", schluesselSchema: [] },
    r3: { f3a: "", f3b: "", schueler: "", ag: "" },
    r4: { f4a: [], f4b: [], f4c: "" },
    r5: { folgenA: "", folgenB: "", kommentierenA: "", kommentierenB: "", likenA: "", likenB: "" },
    r6: { f6a: [], f6b: [], users: "", likesA: "", likesB: "", photos: "" },
    r7: { f7a: "", f7b: [] },
    r8: BEZIEHUNGSARTEN_QUIZ.reduce((acc, question) => ({ ...acc, [question.id]: [] }), {}),
  };
}

function escapeHtml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function sanitizeChoice(value, allowedIds) {
  return typeof value === "string" && allowedIds.includes(value) ? value : "";
}
function sanitizeArray(value, allowedIds) {
  return Array.isArray(value) ? [...new Set(value.filter((item) => allowedIds.includes(item)))] : [];
}
function sanitizeCardinalityInput(value) {
  return typeof value === "string" ? value.slice(0, 1) : "";
}

function sanitizeState(saved) {
  const fresh = emptyDefaultState();
  if (!saved || typeof saved !== "object") return fresh;
  const solved = Array.isArray(saved.solved) ? saved.solved.filter((id) => ALL_SUBTASK_IDS.includes(id)) : [];
  const summaryUnlocked = saved.summaryUnlocked === true;
  const completed = Array.isArray(saved.completed) ? saved.completed.filter((step) => Number.isInteger(step) && step >= 1 && step <= 8) : [];
  let currentStep = saved.currentStep;
  if (currentStep === "summary") { if (!summaryUnlocked) currentStep = 1; }
  else if (!(Number.isInteger(currentStep) && currentStep >= 1 && currentStep <= 8)) currentStep = 1;

  const r1Drag = { 1: "", 2: "", 3: "" };
  if (saved.r1?.drag && typeof saved.r1.drag === "object") {
    [1, 2, 3].forEach((id) => { if (KUERZEL.includes(saved.r1.drag[id])) r1Drag[id] = saved.r1.drag[id]; });
  }

  return {
    currentStep, completed, summaryUnlocked, solved,
    r1: {
      drag: r1Drag,
      f1a: sanitizeChoice(saved.r1?.f1a, R1_F1A_OPTIONS.map((o) => o.id)),
      f1b: sanitizeChoice(saved.r1?.f1b, R1_F1B_OPTIONS.map((o) => o.id)),
      klasse: sanitizeCardinalityInput(saved.r1?.klasse),
      klassenleiter: sanitizeCardinalityInput(saved.r1?.klassenleiter),
    },
    r2: {
      schema: sanitizeArray(saved.r2?.schema, R2_SCHEMA_OPTIONS.map((o) => o.id)),
      schluesselA: sanitizeCardinalityInput(saved.r2?.schluesselA),
      schluesselB: sanitizeCardinalityInput(saved.r2?.schluesselB),
      schluesselSchema: sanitizeArray(saved.r2?.schluesselSchema, R2_SCHLUESSEL_SCHEMA_OPTIONS.map((o) => o.id)),
    },
    r3: {
      f3a: sanitizeChoice(saved.r3?.f3a, R3_F3A_OPTIONS.map((o) => o.id)),
      f3b: sanitizeChoice(saved.r3?.f3b, R3_F3B_OPTIONS.map((o) => o.id)),
      schueler: sanitizeCardinalityInput(saved.r3?.schueler),
      ag: sanitizeCardinalityInput(saved.r3?.ag),
    },
    r4: {
      f4a: sanitizeArray(saved.r4?.f4a, R4_F4A_OPTIONS.map((o) => o.id)),
      f4b: sanitizeArray(saved.r4?.f4b, R4_F4B_OPTIONS.map((o) => o.id)),
      f4c: sanitizeChoice(saved.r4?.f4c, R4_F4C_OPTIONS.map((o) => o.id)),
    },
    r5: {
      folgenA: sanitizeCardinalityInput(saved.r5?.folgenA), folgenB: sanitizeCardinalityInput(saved.r5?.folgenB),
      kommentierenA: sanitizeCardinalityInput(saved.r5?.kommentierenA), kommentierenB: sanitizeCardinalityInput(saved.r5?.kommentierenB),
      likenA: sanitizeCardinalityInput(saved.r5?.likenA), likenB: sanitizeCardinalityInput(saved.r5?.likenB),
    },
    r6: {
      f6a: sanitizeArray(saved.r6?.f6a, R6_F6A_OPTIONS.map((o) => o.id)),
      f6b: sanitizeArray(saved.r6?.f6b, R6_F6B_OPTIONS.map((o) => o.id)),
      users: sanitizeCardinalityInput(saved.r6?.users), likesA: sanitizeCardinalityInput(saved.r6?.likesA),
      likesB: sanitizeCardinalityInput(saved.r6?.likesB), photos: sanitizeCardinalityInput(saved.r6?.photos),
    },
    r7: {
      f7a: sanitizeChoice(saved.r7?.f7a, R7_F7A_OPTIONS.map((o) => o.id)),
      f7b: sanitizeArray(saved.r7?.f7b, R7_F7B_OPTIONS.map((o) => o.id)),
    },
    r8: BEZIEHUNGSARTEN_QUIZ.reduce((acc, question) => ({ ...acc, [question.id]: sanitizeArray(saved.r8?.[question.id], question.options.map((o) => o.id)) }), {}),
  };
}

function loadState() {
  try { return sanitizeState(JSON.parse(localStorage.getItem(STORAGE_KEY))); }
  catch { return emptyDefaultState(); }
}

let state = loadState();

function saveState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  catch {
    const status = document.getElementById("data-status");
    status.hidden = false;
    status.classList.add("error");
    status.textContent = "Hinweis: Deine Eingaben können in diesem Browser nicht dauerhaft gespeichert werden.";
  }
}

function setFeedback(id, kind, message) {
  const node = document.getElementById(`feedback-${id}`);
  if (!node) return;
  node.className = `feedback ${kind}`;
  node.textContent = message;
}
function clearFeedback(id) { setFeedback(id, "", ""); }

function isSolved(id) { return state.solved.includes(id); }
function markSolved(id) {
  if (!state.solved.includes(id)) state.solved.push(id);
  const step = Number(Object.entries(STEP_SUBTASKS).find(([, ids]) => ids.includes(id))?.[0]);
  if (step && STEP_SUBTASKS[step].every((subtaskId) => state.solved.includes(subtaskId))) markComplete(step);
  saveState();
}
function markComplete(step) {
  if (!state.completed.includes(step)) state.completed.push(step);
  renderTabs();
  updateNavigation();
}

function sameSet(a, b) {
  return a.length === b.length && [...a].sort().every((value, index) => [...b].sort()[index] === value);
}
function selectedValues(name) {
  return [...document.querySelectorAll(`input[name="${name}"]:checked`)].map((input) => input.value);
}

function renderRadioList(containerId, name, options, selected) {
  document.getElementById(containerId).innerHTML = options.map((option) =>
    `<label class="choice-option"><input type="radio" name="${name}" value="${escapeHtml(option.id)}" ${selected === option.id ? "checked" : ""}><span>${escapeHtml(option.label)}</span></label>`
  ).join("");
}
function renderCheckboxList(containerId, name, options, selected) {
  document.getElementById(containerId).innerHTML = options.map((option) =>
    `<label class="choice-option"><input type="checkbox" name="${name}" value="${escapeHtml(option.id)}" ${selected.includes(option.id) ? "checked" : ""}><span>${escapeHtml(option.label)}</span></label>`
  ).join("");
}
function renderSchemaChoiceList(containerId, name, options, selected) {
  document.getElementById(containerId).innerHTML = options.map((option) =>
    `<label class="choice-option"><input type="checkbox" name="${name}" value="${escapeHtml(option.id)}" ${selected.includes(option.id) ? "checked" : ""}><span>${option.lines.map((line) => `<code>${escapeHtml(line)}</code>`).join("<br>")}</span></label>`
  ).join("");
}

function miniTableCard(title, columns, rows, { highlight = [], captionText } = {}) {
  const head = columns.map((column, index) => `<th scope="col"${highlight.includes(index) ? ' class="link-column"' : ""}>${escapeHtml(column)}</th>`).join("");
  const body = rows.map((row) => `<tr>${row.map((cell, index) => `<td${highlight.includes(index) ? ' class="link-column"' : ""}>${cell === null ? '<span class="unknown-value">?</span>' : escapeHtml(cell)}</td>`).join("")}</tr>`).join("");
  return `<section class="mini-table-card"><h3>${escapeHtml(title)}</h3><table><caption class="sr-only">${escapeHtml(captionText ?? `${title} – Tabellenauszug`)}</caption><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></section>`;
}

// ---------------------------------------------------------------------------
// Schritt 1
// ---------------------------------------------------------------------------
function renderR1Tables() {
  document.getElementById("r1-tables").innerHTML =
    miniTableCard("klasse", ["id", "name"], KLASSE.map((k) => [k.id, k.name])) +
    miniTableCard("klassenleiter", ["id", "kuerzel", "klasse_id"], KLASSENLEITER.map((l) => [l.id, l.kuerzel, l.klasse_id]), { highlight: [2] });
}

let r1Picked = null;
function r1Place(kuerzel, fromKlasseId, toKlasseId) {
  if (fromKlasseId > 0) state.r1.drag[fromKlasseId] = "";
  if (toKlasseId > 0) {
    const previous = state.r1.drag[toKlasseId];
    state.r1.drag[toKlasseId] = kuerzel;
    if (fromKlasseId > 0 && previous) state.r1.drag[fromKlasseId] = previous;
  }
  r1Picked = null;
  clearFeedback("r1-drag");
  saveState();
  renderR1DragDrop();
}
function r1EnableDrag(element, kuerzel, fromKlasseId) {
  element.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    const startX = event.clientX, startY = event.clientY;
    let ghost = null;
    element.setPointerCapture(event.pointerId);
    const move = (moveEvent) => {
      if (!ghost && Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY) < 6) return;
      if (!ghost) {
        ghost = document.createElement("span");
        ghost.className = "drag-token drag-ghost";
        ghost.textContent = kuerzel;
        document.body.append(ghost);
      }
      ghost.style.left = `${moveEvent.clientX}px`;
      ghost.style.top = `${moveEvent.clientY}px`;
      document.querySelectorAll(".drop-slot").forEach((slot) => slot.classList.remove("is-drop-target"));
      document.elementFromPoint(moveEvent.clientX, moveEvent.clientY)?.closest(".drop-slot")?.classList.add("is-drop-target");
    };
    const end = (endEvent) => {
      element.removeEventListener("pointermove", move);
      element.removeEventListener("pointerup", end);
      element.removeEventListener("pointercancel", end);
      if (!ghost) return;
      ghost.remove();
      element.dataset.dragged = "true";
      const drop = endEvent.type === "pointerup" ? document.elementFromPoint(endEvent.clientX, endEvent.clientY) : null;
      const slot = drop?.closest(".drop-slot");
      if (slot) r1Place(kuerzel, fromKlasseId, Number(slot.dataset.klasseId));
      else if (fromKlasseId > 0 && drop?.closest(".token-bank")) r1Place(kuerzel, fromKlasseId, -1);
      else renderR1DragDrop();
    };
    element.addEventListener("pointermove", move);
    element.addEventListener("pointerup", end);
    element.addEventListener("pointercancel", end);
  });
}
function r1WasDragged(element) {
  if (element.dataset.dragged !== "true") return false;
  delete element.dataset.dragged;
  return true;
}
function renderR1DragDrop() {
  const container = document.getElementById("r1-dragdrop");
  const assigned = Object.values(state.r1.drag);
  const bankTokens = KUERZEL.filter((kuerzel) => !assigned.includes(kuerzel));
  container.innerHTML = `<div class="token-bank" aria-label="Kürzel-Karten"></div><div class="drop-rows"></div>`;
  const bank = container.querySelector(".token-bank");
  bankTokens.forEach((kuerzel) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "drag-token";
    const picked = r1Picked?.key === kuerzel && r1Picked?.from === -1;
    button.setAttribute("aria-pressed", String(picked));
    button.textContent = kuerzel;
    r1EnableDrag(button, kuerzel, -1);
    button.addEventListener("click", () => {
      if (r1WasDragged(button)) return;
      r1Picked = picked ? null : { key: kuerzel, from: -1 };
      renderR1DragDrop();
    });
    bank.append(button);
  });
  const rows = container.querySelector(".drop-rows");
  KLASSE.forEach((klasse) => {
    const row = document.createElement("div");
    row.className = "drag-row";
    const label = document.createElement("span");
    label.textContent = `${klasse.name} · id ${klasse.id}`;
    const slot = document.createElement("button");
    slot.type = "button";
    slot.className = "drop-slot";
    slot.dataset.klasseId = String(klasse.id);
    const value = state.r1.drag[klasse.id];
    slot.textContent = value || "leer";
    slot.setAttribute("aria-label", `Feld für Klasse ${klasse.name}: ${value || "leer"}`);
    const picked = r1Picked?.from === klasse.id;
    slot.setAttribute("aria-pressed", String(picked));
    if (value) r1EnableDrag(slot, value, klasse.id);
    slot.addEventListener("click", () => {
      if (r1WasDragged(slot)) return;
      if (r1Picked && r1Picked.from !== klasse.id) { r1Place(r1Picked.key, r1Picked.from, klasse.id); return; }
      if (r1Picked && r1Picked.from === klasse.id) { r1Place(value, klasse.id, -1); return; }
      if (value) { r1Picked = { key: value, from: klasse.id }; renderR1DragDrop(); }
    });
    row.append(label, slot);
    rows.append(row);
  });
}
function checkR1Drag() {
  const assignedEntries = KLASSE.map((k) => [k.id, state.r1.drag[k.id]]).filter(([, kuerzel]) => kuerzel);
  if (!assignedEntries.length) { setFeedback("r1-drag", "hint", "Noch nicht korrekt: Ziehe zuerst jedes Kürzel in das Feld einer Klasse."); return; }
  const correctCount = assignedEntries.filter(([klasseId, kuerzel]) => KLASSE_LEITER_LOESUNG[klasseId] === kuerzel).length;
  if (assignedEntries.length < KLASSE.length) {
    if (correctCount > 0) setFeedback("r1-drag", "partial", `Teilweise korrekt: ${correctCount} ${correctCount === 1 ? "Zuordnung stimmt" : "Zuordnungen stimmen"} schon. Ordne auch die übrigen Kürzel zu.`);
    else setFeedback("r1-drag", "hint", "Noch nicht korrekt: Ordne jedem Kürzel eine Klasse zu. Suche dazu in klassenleiter die klasse_id des Kürzels.");
    return;
  }
  if (correctCount === KLASSE.length) {
    setFeedback("r1-drag", "success", "Richtig zugeordnet: Die klasse_id jedes Klassenleiters verweist auf die id seiner Klasse.");
    markSolved("r1-drag");
    return;
  }
  const isIdConfusion = KLASSE.every((k) => state.r1.drag[k.id] === KLASSE_LEITER_ID_VERWECHSLUNG[k.id]);
  if (isIdConfusion) { setFeedback("r1-drag", "hint", "Noch nicht korrekt: Du hast die id des Klassenleiters mit der id der Klasse verglichen. Die Verbindung stellt aber der Fremdschlüssel klasse_id her – er verweist auf die id in klasse."); return; }
  if (correctCount > 0) setFeedback("r1-drag", "partial", `Teilweise korrekt: ${correctCount} von 3 Zuordnungen stimmen. Suche in klassenleiter die klasse_id des Kürzels und vergleiche sie mit der id in klasse.`);
  else setFeedback("r1-drag", "hint", "Noch nicht korrekt: Entscheidend ist die Spalte klasse_id. Sie verweist auf die id der Klasse in der Tabelle klasse.");
}
function checkR1F1a() {
  state.r1.f1a = document.querySelector('input[name="r1-f1a"]:checked')?.value ?? "";
  saveState();
  if (!state.r1.f1a) { setFeedback("r1-f1a", "hint", "Noch nicht korrekt: Wähle eine Ergänzung aus."); return; }
  if (state.r1.f1a === "one") { setFeedback("r1-f1a", "success", "Richtig: Jede id aus klasse kommt in der Spalte klasse_id genau einmal vor. Jede Klasse hat also genau einen Klassenleiter."); markSolved("r1-f1a"); }
  else setFeedback("r1-f1a", "hint", "Noch nicht korrekt: Zähle, wie oft jede Klasse in der Spalte klasse_id vorkommt. Mehrere Klassenleiter hätte eine Klasse nur, wenn ihre id dort mehrmals stünde.");
}
function checkR1F1b() {
  state.r1.f1b = document.querySelector('input[name="r1-f1b"]:checked')?.value ?? "";
  saveState();
  if (!state.r1.f1b) { setFeedback("r1-f1b", "hint", "Noch nicht korrekt: Wähle eine Ergänzung aus."); return; }
  if (state.r1.f1b === "one") { setFeedback("r1-f1b", "success", "Richtig: In jeder Zeile von klassenleiter steht genau eine klasse_id. Jeder Klassenleiter leitet also genau eine Klasse."); markSolved("r1-f1b"); }
  else setFeedback("r1-f1b", "hint", "Noch nicht korrekt: Sieh dir eine Zeile in klassenleiter an. In der Zelle klasse_id steht genau ein Wert – auf wie viele Klassen kann sie also verweisen?");
}
function genericCardinalityMessage(result) {
  if (result.status === "missing") return "Noch nicht korrekt: Trage in jede Lücke 1, n oder m ein.";
  if (result.status === "invalid") return "Noch nicht korrekt: Erlaubt sind nur 1, n oder m.";
  return null;
}
function checkR1Cardinality() {
  state.r1.klasse = document.getElementById("r1-klasse-cardinality").value;
  state.r1.klassenleiter = document.getElementById("r1-klassenleiter-cardinality").value;
  saveState();
  const result = evaluateCardinalityPair(state.r1.klasse, state.r1.klassenleiter, "1:1");
  const generic = genericCardinalityMessage(result);
  if (generic) { setFeedback("r1-cardinality", "hint", generic); return; }
  if (result.status === "correct") {
    setFeedback("r1-cardinality", "success", "Richtig: An beiden Enden steht 1. Jede Klasse hat genau einen Klassenleiter, und jeder Klassenleiter leitet genau eine Klasse.");
    markSolved("r1-cardinality");
    document.getElementById("r1-reveal").hidden = false;
    return;
  }
  if (result.status === "partial") {
    if (normalizeCardinality(state.r1.klasse) === "1") setFeedback("r1-cardinality", "partial", "Teilweise korrekt: Die Lücke bei Klasse stimmt. Prüfe die Lücke direkt bei Klassenleiter: Wie viele Klassenleiter hat eine Klasse?");
    else setFeedback("r1-cardinality", "partial", "Teilweise korrekt: Die Lücke bei Klassenleiter stimmt. Prüfe die Lücke direkt bei Klasse: Wie viele Klassen leitet ein Klassenleiter?");
    return;
  }
  setFeedback("r1-cardinality", "hint", "Noch nicht korrekt: Die Zahl direkt an einer Klasse gibt an, wie viele Objekte dieser Klasse zu einem Objekt der anderen Klasse gehören. Nutze deine beiden Beobachtungen.");
}

// ---------------------------------------------------------------------------
// Schritt 2
// ---------------------------------------------------------------------------
function renderR2Schemas() {
  document.getElementById("r2-schemas").innerHTML = [
    ["Schema A", "klasse(\n  id: int\n  name: varchar(255)\n)", "klassenleiter(\n  id: int\n  kuerzel: varchar(255)\n  klasse_id[klasse]: int\n)"],
    ["Schema B", "klasse(\n  id: int\n  name: varchar(255)\n  klassenleiter_id[klassenleiter]: int\n)", "klassenleiter(\n  id: int\n  kuerzel: varchar(255)\n)"],
    ["Schema C", "klasse(\n  id: int\n  name: varchar(255)\n  klassenleiter_id[klassenleiter]: int\n)", "klassenleiter(\n  id: int\n  kuerzel: varchar(255)\n  klasse_id[klasse]: int\n)"],
  ].map(([title, a, b]) => `<div class="schema-syntax"><p class="schema-title">${title}</p><pre><code>${escapeHtml(a)}</code></pre><pre><code>${escapeHtml(b)}</code></pre></div>`).join("");
}
function checkR2Schema() {
  state.r2.schema = selectedValues("r2-schema");
  saveState();
  const selected = state.r2.schema;
  if (!selected.length) { setFeedback("r2-schema", "hint", "Noch nicht korrekt: Wähle mindestens ein Schema aus."); return; }
  if (selected.includes("C")) {
    if (selected.length === 1) setFeedback("r2-schema", "hint", "Noch nicht korrekt: In Schema C steht die Verbindung doppelt. Das ist Redundanz wie in Aufgabe 2: Beide Verweise können sich widersprechen. Ein einziger Fremdschlüssel reicht.");
    else setFeedback("r2-schema", "partial", "Teilweise korrekt: Schema C ist nicht richtig. Dort steht die Verbindung doppelt: Verweist klasse 1 auf Klassenleiter 3, Klassenleiter 3 aber auf klasse 2, widersprechen sich die Daten – wie bei den Redundanzen aus Aufgabe 2.");
    return;
  }
  if (sameSet(selected, ["A", "B"])) {
    setFeedback("r2-schema", "success", "Richtig: Beide Schemata speichern die Verbindung genau einmal. Bei einer 1:1-Beziehung ist es egal, in welcher Tabelle der Fremdschlüssel steht.");
    markSolved("r2-schema");
    document.getElementById("r2-merke").hidden = false;
    return;
  }
  setFeedback("r2-schema", "partial", "Teilweise korrekt: Das gewählte Schema stimmt. Bei 1:n muss der Fremdschlüssel auf die n-Seite. Bei 1:1 gibt es keine n-Seite – kommt dann nicht auch die andere Tabelle in Frage?");
}
function checkR2Cardinality() {
  state.r2.schluesselA = document.getElementById("r2-schluessel-cardinality").value;
  state.r2.schluesselB = document.getElementById("r2-schloss-cardinality").value;
  saveState();
  const result = evaluateCardinalityPair(state.r2.schluesselA, state.r2.schluesselB, "1:1");
  const generic = genericCardinalityMessage(result);
  if (generic) { setFeedback("r2-cardinality", "hint", generic); return; }
  if (result.status === "correct") { setFeedback("r2-cardinality", "success", "Richtig: Schlüssel 1 ───── 1 Schloss ist eine 1:1-Beziehung."); markSolved("r2-cardinality"); return; }
  if (result.status === "partial") { setFeedback("r2-cardinality", "partial", "Teilweise korrekt: Eine Lücke stimmt. Laut Beschreibung öffnet jeder Schlüssel genau ein Schloss, und zu jedem Schloss gehört genau ein Schlüssel. Wo steht bei dir noch »viele«?"); return; }
  setFeedback("r2-cardinality", "hint", "Noch nicht korrekt: Lies die Beschreibung in beide Richtungen. Wie viele Schlösser öffnet ein Schlüssel, und wie viele Schlüssel gehören zu einem Schloss?");
}
function checkR2SchluesselSchema() {
  state.r2.schluesselSchema = selectedValues("r2-schluessel-schema");
  saveState();
  const selected = state.r2.schluesselSchema;
  const correctSelected = selected.filter((id) => id === "K1" || id === "K2");
  const prefix = correctSelected.length > 0 ? "Teilweise korrekt:" : "Noch nicht korrekt:";
  if (selected.includes("K3")) { setFeedback("r2-schluessel-schema", correctSelected.length ? "partial" : "hint", `${prefix} In der dritten Möglichkeit steht die Verbindung doppelt. Beide Verweise müssten immer zueinander passen – sonst widersprechen sie sich, wie bei den Redundanzen aus Aufgabe 2.`); return; }
  if (selected.includes("K4")) { setFeedback("r2-schluessel-schema", correctSelected.length ? "partial" : "hint", `${prefix} In der vierten Möglichkeit fehlt ein Fremdschlüssel. Dann weiß die Datenbank nicht, welcher Schlüssel welches Schloss öffnet.`); return; }
  if (correctSelected.length === 2) { setFeedback("r2-schluessel-schema", "success", "Richtig: Bei einer 1:1-Beziehung darf der Fremdschlüssel in einer der beiden Tabellen stehen – aber nur in einer."); markSolved("r2-schluessel-schema"); return; }
  if (correctSelected.length === 1) { setFeedback("r2-schluessel-schema", "partial", "Teilweise korrekt: Deine Auswahl stimmt. Es gibt aber noch eine zweite richtige Möglichkeit – denke an die Schemata A und B für Klasse und Klassenleiter."); return; }
  setFeedback("r2-schluessel-schema", "hint", "Noch nicht korrekt: Wähle mindestens ein Schema aus.");
}

// ---------------------------------------------------------------------------
// Schritt 3
// ---------------------------------------------------------------------------
function renderR3Tables() {
  document.getElementById("r3-tables").innerHTML =
    miniTableCard("ag", ["id", "name"], AG.map((a) => [a.id, a.name])) +
    miniTableCard("schueler – Versuch mit einem Fremdschlüssel", ["id", "name", "ag_id"], SCHUELER_VERSUCH.map((s) => [s.id, s.name, s.ag_id]), { highlight: [2], captionText: "schueler – Versuch mit einem Fremdschlüssel" });
}
function checkR3F3a() {
  state.r3.f3a = document.querySelector('input[name="r3-f3a"]:checked')?.value ?? "";
  saveState();
  const messages = {
    multi: "Noch nicht korrekt: In einer Zelle steht genau ein Wert. »1, 2« ist kein int, und ein Fremdschlüssel kann nur auf einen einzigen Datensatz verweisen.",
    twoRows: "Noch nicht korrekt: Dann stünde Lina zweimal in schueler – mit zwei verschiedenen ids. Das ist Redundanz wie in Aufgabe 2: Ändert sich ihr Name, muss er an zwei Stellen geändert werden.",
    onlyOne: "Noch nicht korrekt: Dann ginge die Information verloren, dass Lina auch in der Theater-AG ist.",
  };
  if (!state.r3.f3a) { setFeedback("r3-f3a", "hint", "Noch nicht korrekt: Wähle eine Antwort aus."); return; }
  if (state.r3.f3a === "none") { setFeedback("r3-f3a", "success", "Richtig: Ein Fremdschlüssel speichert genau einen Verweis. Lina braucht aber zwei."); markSolved("r3-f3a"); return; }
  setFeedback("r3-f3a", "hint", messages[state.r3.f3a]);
}
function checkR3F3b() {
  state.r3.f3b = document.querySelector('input[name="r3-f3b"]:checked')?.value ?? "";
  saveState();
  if (!state.r3.f3b) { setFeedback("r3-f3b", "hint", "Noch nicht korrekt: Wähle eine Antwort aus."); return; }
  if (state.r3.f3b === "no") { setFeedback("r3-f3b", "success", "Richtig: Auf beiden Seiten gibt es »viele«. Ein Fremdschlüssel reicht auf keiner Seite."); markSolved("r3-f3b"); return; }
  setFeedback("r3-f3b", "hint", "Noch nicht korrekt: Sieh in die Anmeldeliste: Die Robotik-AG hat zwei Schüler, Lina und Ben. Auch hier bräuchte eine Zelle zwei Werte.");
}
function checkR3Cardinality() {
  state.r3.schueler = document.getElementById("r3-schueler-cardinality").value;
  state.r3.ag = document.getElementById("r3-ag-cardinality").value;
  saveState();
  const result = evaluateCardinalityPair(state.r3.schueler, state.r3.ag, "n:m");
  const generic = genericCardinalityMessage(result);
  if (generic) { setFeedback("r3-cardinality", "hint", generic); return; }
  if (result.status === "correct") {
    setFeedback("r3-cardinality", "success", "Richtig: Schüler n ───── m AG. Auf beiden Seiten können viele beteiligt sein.");
    markSolved("r3-cardinality");
    document.getElementById("r3-reveal").hidden = false;
    return;
  }
  if (result.reason === "same-letter") { setFeedback("r3-cardinality", "partial", "Teilweise korrekt: Auf beiden Seiten stehen tatsächlich viele. Man verwendet aber zwei verschiedene Buchstaben, weil die beiden Anzahlen unabhängig voneinander sind."); return; }
  if (result.reason === "one-is-1") { setFeedback("r3-cardinality", "partial", "Teilweise korrekt: Eine Seite hat schon »viele«, bei der anderen steht noch eine 1. Sieh in die Anmeldeliste: Lina besucht zwei AGs, und die Robotik-AG hat zwei Schüler."); return; }
  setFeedback("r3-cardinality", "hint", "Noch nicht korrekt: 1:1 würde bedeuten, dass jeder Schüler genau eine AG besucht. Sieh in die Anmeldeliste: Wie viele AGs besucht Lina?");
}

// ---------------------------------------------------------------------------
// Schritt 4
// ---------------------------------------------------------------------------
function renderR4Tables() {
  document.getElementById("r4-tables").innerHTML =
    miniTableCard("schueler", ["id", "name"], SCHUELER.map((s) => [s.id, s.name])) +
    miniTableCard("teilnahme", ["schueler_id", "ag_id"], TEILNAHME.map((t) => [t.schueler_id, t.ag_id])) +
    miniTableCard("ag", ["id", "name"], AG.map((a) => [a.id, a.name]));
}
function maybeRevealR4Merke() {
  if (["r4-f4a", "r4-f4b", "r4-f4c"].every(isSolved)) document.getElementById("r4-merke").hidden = false;
}
function checkR4F4a() {
  state.r4.f4a = selectedValues("r4-f4a");
  saveState();
  const selected = state.r4.f4a;
  const correctSet = ["robotik", "theater"];
  if (!selected.length) { setFeedback("r4-f4a", "hint", "Noch nicht korrekt: Kreuze mindestens eine AG an."); return; }
  if (sameSet(selected, correctSet)) { setFeedback("r4-f4a", "success", "Richtig: In teilnahme stehen zwei Zeilen mit schueler_id 1 – eine mit ag_id 1 (Robotik) und eine mit ag_id 2 (Theater)."); markSolved("r4-f4a"); maybeRevealR4Merke(); return; }
  if (selected.includes("chor")) { const anyCorrect = selected.some((id) => correctSet.includes(id)); setFeedback("r4-f4a", anyCorrect ? "partial" : "hint", `${anyCorrect ? "Teilweise korrekt:" : "Noch nicht korrekt:"} Chor hat die ag_id 3. In teilnahme gibt es keine Zeile, in der schueler_id 1 und ag_id 3 zusammen stehen.`); return; }
  if (selected.some((id) => correctSet.includes(id))) { setFeedback("r4-f4a", "partial", "Teilweise korrekt: Diese AG stimmt. Suche in teilnahme alle Zeilen mit Linas id – es ist mehr als eine."); return; }
  setFeedback("r4-f4a", "hint", "Noch nicht korrekt: Suche in teilnahme alle Zeilen mit schueler_id 1.");
}
function checkR4F4b() {
  state.r4.f4b = selectedValues("r4-f4b");
  saveState();
  const selected = state.r4.f4b;
  const correctSet = ["lina", "mia"];
  if (!selected.length) { setFeedback("r4-f4b", "hint", "Noch nicht korrekt: Kreuze mindestens eine Person an."); return; }
  if (sameSet(selected, correctSet)) { setFeedback("r4-f4b", "success", "Richtig: Theater hat die ag_id 2. In teilnahme steht sie bei schueler_id 1 (Lina) und schueler_id 3 (Mia)."); markSolved("r4-f4b"); maybeRevealR4Merke(); return; }
  if (selected.includes("ben")) { const anyCorrect = selected.some((id) => correctSet.includes(id)); setFeedback("r4-f4b", anyCorrect ? "partial" : "hint", `${anyCorrect ? "Teilweise korrekt:" : "Noch nicht korrekt:"} Ben (id 2) steht in teilnahme nur mit ag_id 1, also nur bei Robotik.`); return; }
  if (selected.some((id) => correctSet.includes(id))) { setFeedback("r4-f4b", "partial", "Teilweise korrekt: Diese Person stimmt. Suche in teilnahme alle Zeilen mit ag_id 2."); return; }
  setFeedback("r4-f4b", "hint", "Noch nicht korrekt: Suche in teilnahme alle Zeilen mit ag_id 2.");
}
function checkR4F4c() {
  state.r4.f4c = document.querySelector('input[name="r4-f4c"]:checked')?.value ?? "";
  saveState();
  if (!state.r4.f4c) { setFeedback("r4-f4c", "hint", "Noch nicht korrekt: Wähle eine Antwort aus."); return; }
  if (state.r4.f4c === "newRow") { setFeedback("r4-f4c", "success", "Richtig: Jede Anmeldung ist eine eigene Zeile. Bens id und die id des Chors stehen zusammen in einer neuen Zeile."); markSolved("r4-f4c"); maybeRevealR4Merke(); return; }
  if (state.r4.f4c === "secondSchuelerRow") { setFeedback("r4-f4c", "hint", "Noch nicht korrekt: Dann stünde Ben doppelt in schueler – mit zwei ids. Das wäre Redundanz wie in Aufgabe 2. Seine Daten bleiben einmal gespeichert."); return; }
  setFeedback("r4-f4c", "hint", "Noch nicht korrekt: Auch in dieser Tabelle steht in jeder Zelle genau ein Wert. Für jede weitere Anmeldung gibt es deshalb eine weitere Zeile.");
}

// ---------------------------------------------------------------------------
// Schritt 5
// ---------------------------------------------------------------------------
function checkR5Cardinality() {
  state.r5.likenA = document.getElementById("r5-liken-a").value;
  state.r5.likenB = document.getElementById("r5-liken-b").value;
  state.r5.kommentierenA = document.getElementById("r5-kommentieren-a").value;
  state.r5.kommentierenB = document.getElementById("r5-kommentieren-b").value;
  state.r5.folgenA = document.getElementById("r5-folgen-a").value;
  state.r5.folgenB = document.getElementById("r5-folgen-b").value;
  saveState();
  const values = [state.r5.likenA, state.r5.likenB, state.r5.kommentierenA, state.r5.kommentierenB, state.r5.folgenA, state.r5.folgenB];
  if (values.some((value) => !normalizeCardinality(value))) { setFeedback("r5-cardinality", "hint", "Noch nicht korrekt: Trage in alle sechs Lücken 1, n oder m ein."); return; }
  if (values.some((value) => !["1", "n", "m"].includes(normalizeCardinality(value)))) { setFeedback("r5-cardinality", "hint", "Noch nicht korrekt: Erlaubt sind nur 1, n oder m."); return; }
  const liken = evaluateCardinalityPair(state.r5.likenA, state.r5.likenB, "n:m");
  const kommentieren = evaluateCardinalityPair(state.r5.kommentierenA, state.r5.kommentierenB, "n:m");
  const folgen = evaluateCardinalityPair(state.r5.folgenA, state.r5.folgenB, "n:m");
  const correctCount = [liken, kommentieren, folgen].filter((r) => r.status === "correct").length;
  if (correctCount === 3) {
    setFeedback("r5-cardinality", "success", "Richtig: Alle drei neuen Beziehungen sind n:m-Beziehungen – auch »kann folgen«, bei der users mit sich selbst verbunden ist.");
    markSolved("r5-cardinality");
    document.getElementById("r5-summary").hidden = false;
    return;
  }
  const prefix = correctCount > 0 ? `Teilweise korrekt: ${correctCount} von 3 Beziehungen stimmen.` : "Noch nicht korrekt.";
  const relations = [["kann liken", liken], ["kann kommentieren", kommentieren], ["kann folgen", folgen]];
  const sameLetter = relations.find(([, result]) => result.reason === "same-letter");
  if (sameLetter) { setFeedback("r5-cardinality", correctCount > 0 ? "partial" : "hint", `${prefix} Bei »${sameLetter[0]}« stehen zwei gleiche Buchstaben. Man verwendet zwei verschiedene Buchstaben, weil die beiden Anzahlen unabhängig voneinander sind.`); return; }
  const hasOne = (result) => result.reason === "one-is-1" || result.reason === "both-1";
  if (hasOne(liken)) { setFeedback("r5-cardinality", correctCount > 0 ? "partial" : "hint", `${prefix} Bei »kann liken« steht noch eine 1. Kann ein Foto nur von einem einzigen Benutzer geliked werden?`); return; }
  if (hasOne(kommentieren)) { setFeedback("r5-cardinality", correctCount > 0 ? "partial" : "hint", `${prefix} Bei »kann kommentieren« steht noch eine 1. Lies die Beziehung in beide Richtungen: Wie viele Fotos kann ein Benutzer kommentieren, und wie viele Benutzer können ein Foto kommentieren?`); return; }
  if (hasOne(folgen)) { setFeedback("r5-cardinality", correctCount > 0 ? "partial" : "hint", `${prefix} Bei »kann folgen« steht noch eine 1. Ein Benutzer kann vielen anderen folgen – und wie viele Follower kann ein Benutzer haben?`); return; }
  setFeedback("r5-cardinality", correctCount > 0 ? "partial" : "hint", prefix);
}

// ---------------------------------------------------------------------------
// Schritt 6
// ---------------------------------------------------------------------------
function renderR6Tables() {
  const userRows = INSTAHUB_USERS.filter((u) => [3, 4, 15, 18].includes(u.id));
  const photoRows = INSTAHUB_PHOTOS;
  document.getElementById("r6-tables").innerHTML =
    miniTableCard("users", ["id", "username"], userRows.map((u) => [u.id, u.username])) +
    miniTableCard("photos", ["id", "user_id", "description"], photoRows.map((p) => [p.id, p.user_id, p.description]), { highlight: [1] }) +
    miniTableCard("likes – Tabellenauszug (nur die Fremdschlüssel)", ["user_id", "photo_id"], INSTAHUB_LIKES.map((l) => [l.user_id, l.photo_id]), { captionText: "likes – Tabellenauszug (nur die Fremdschlüssel)" });
}
function checkR6F6a() {
  state.r6.f6a = selectedValues("r6-f6a");
  saveState();
  const selected = state.r6.f6a;
  const correctSet = ["photo12", "photo14"];
  if (!selected.length) { setFeedback("r6-f6a", "hint", "Noch nicht korrekt: Kreuze mindestens ein Foto an."); return; }
  if (sameSet(selected, correctSet)) { setFeedback("r6-f6a", "success", "Richtig: In likes stehen zwei Zeilen mit user_id 15 – mit photo_id 12 und photo_id 14."); markSolved("r6-f6a"); return; }
  if (selected.includes("none")) { const anyCorrect = selected.some((id) => correctSet.includes(id)); setFeedback("r6-f6a", anyCorrect ? "partial" : "hint", `${anyCorrect ? "Teilweise korrekt:" : "Noch nicht korrekt:"} photos.user_id gibt an, wer ein Foto hochgeladen hat. Wer ein Foto geliked hat, steht in der Hilfstabelle likes.`); return; }
  if (selected.some((id) => correctSet.includes(id))) { setFeedback("r6-f6a", "partial", "Teilweise korrekt: Dieses Foto stimmt. In likes steht user_id 15 in mehr als einer Zeile."); return; }
  setFeedback("r6-f6a", "hint", "Noch nicht korrekt: Suche in likes alle Zeilen mit user_id 15.");
}
function checkR6F6b() {
  state.r6.f6b = selectedValues("r6-f6b");
  saveState();
  const selected = state.r6.f6b;
  const correctSet = ["emil", "jonas"];
  if (!selected.length) { setFeedback("r6-f6b", "hint", "Noch nicht korrekt: Kreuze mindestens eine Person an."); return; }
  if (sameSet(selected, correctSet)) { setFeedback("r6-f6b", "success", "Richtig: In likes steht photo_id 14 zweimal – bei user_id 15 (reisewut_emil) und user_id 18 (gamewut_jonas)."); markSolved("r6-f6b"); return; }
  if (selected.includes("koch")) { const anyCorrect = selected.some((id) => correctSet.includes(id)); setFeedback("r6-f6b", anyCorrect ? "partial" : "hint", `${anyCorrect ? "Teilweise korrekt:" : "Noch nicht korrekt:"} koch_kicker (id 4) steht bei Foto 14 in photos.user_id: Er hat das Foto hochgeladen. Das ist die 1:n-Beziehung »kann hochladen«, nicht »kann liken«.`); return; }
  if (selected.includes("berg")) { const anyCorrect = selected.some((id) => correctSet.includes(id)); setFeedback("r6-f6b", anyCorrect ? "partial" : "hint", `${anyCorrect ? "Teilweise korrekt:" : "Noch nicht korrekt:"} bergcoder (id 3) hat Foto 12 hochgeladen. Mit Foto 14 hat er in diesem Auszug nichts zu tun.`); return; }
  if (selected.some((id) => correctSet.includes(id))) { setFeedback("r6-f6b", "partial", "Teilweise korrekt: Diese Person stimmt. Suche in likes alle Zeilen mit photo_id 14."); return; }
  setFeedback("r6-f6b", "hint", "Noch nicht korrekt: Suche in likes alle Zeilen mit photo_id 14.");
}
function checkR6Cardinality() {
  state.r6.users = document.getElementById("r6-users-cardinality").value;
  state.r6.likesA = document.getElementById("r6-likes-a-cardinality").value;
  state.r6.likesB = document.getElementById("r6-likes-b-cardinality").value;
  state.r6.photos = document.getElementById("r6-photos-cardinality").value;
  saveState();
  const values = [state.r6.users, state.r6.likesA, state.r6.likesB, state.r6.photos];
  if (values.some((value) => !normalizeCardinality(value))) { setFeedback("r6-cardinality", "hint", "Noch nicht korrekt: Trage in jede Lücke 1, n oder m ein."); return; }
  if (values.some((value) => !["1", "n", "m"].includes(normalizeCardinality(value)))) { setFeedback("r6-cardinality", "hint", "Noch nicht korrekt: Erlaubt sind nur 1, n oder m."); return; }
  const users = normalizeCardinality(state.r6.users), likesA = normalizeCardinality(state.r6.likesA), likesB = normalizeCardinality(state.r6.likesB), photos = normalizeCardinality(state.r6.photos);
  const usersOk = users === "1", photosOk = photos === "1", likesAOk = likesA === "n", likesBOk = likesB === "n";
  const k = [usersOk, likesAOk, likesBOk, photosOk].filter(Boolean).length;
  if (k === 4) {
    setFeedback("r6-cardinality", "success", "Richtig: users 1 ───── n likes n ───── 1 photos. Aus der n:m-Beziehung sind zwei 1:n-Beziehungen geworden.");
    markSolved("r6-cardinality");
    document.getElementById("r6-summary").hidden = false;
    return;
  }
  const prefix = k > 0 ? `Teilweise korrekt: ${k} von 4 Lücken stimmen.` : "Noch nicht korrekt.";
  if (!usersOk) { setFeedback("r6-cardinality", k > 0 ? "partial" : "hint", `${prefix} Prüfe die Lücke bei users: In jeder Zeile von likes steht genau eine user_id. Zu wie vielen Benutzern gehört also ein Like?`); return; }
  if (!photosOk) { setFeedback("r6-cardinality", k > 0 ? "partial" : "hint", `${prefix} Prüfe die Lücke bei photos: In jeder Zeile von likes steht genau eine photo_id. Zu wie vielen Fotos gehört also ein Like?`); return; }
  if (likesA === "1" || likesB === "1") { setFeedback("r6-cardinality", k > 0 ? "partial" : "hint", `${prefix} Prüfe die Lücken bei likes: Ein Benutzer kann viele Fotos liken – wie viele Zeilen kann es in likes mit derselben user_id geben?`); return; }
  setFeedback("r6-cardinality", "partial", "Teilweise korrekt: Auf der Seite von likes stehen tatsächlich viele. Bei einer 1:n-Beziehung schreibt man dafür n.");
}

// ---------------------------------------------------------------------------
// Schritt 7
// ---------------------------------------------------------------------------
function renderR7Tables() {
  const userRows = INSTAHUB_USERS.filter((u) => [1, 52, 117, 138].includes(u.id));
  document.getElementById("r7-tables").innerHTML =
    miniTableCard("users", ["id", "username"], userRows.map((u) => [u.id, u.username])) +
    miniTableCard("follows", ["id", "following_id", "follower_id"], INSTAHUB_FOLLOWS.map((f) => [f.id, f.following_id, f.follower_id]), { highlight: [1, 2] });
}
function maybeRevealR7Summary() {
  if (["r7-f7a", "r7-f7b"].every(isSolved)) document.getElementById("r7-summary").hidden = false;
}
function checkR7F7a() {
  state.r7.f7a = document.querySelector('input[name="r7-f7a"]:checked')?.value ?? "";
  saveState();
  if (!state.r7.f7a) { setFeedback("r7-f7a", "hint", "Noch nicht korrekt: Wähle eine Antwort aus."); return; }
  if (state.r7.f7a === "taroFollowsOeko") { setFeedback("r7-f7a", "success", "Richtig: follower_id 138 ist wanderriese_taro, following_id 52 ist oekosmasher."); markSolved("r7-f7a"); maybeRevealR7Summary(); return; }
  if (state.r7.f7a === "oekoFollowsTaro") { setFeedback("r7-f7a", "hint", "Noch nicht korrekt: Die Richtung ist vertauscht. follower_id ist der, der folgt – hier also 138, wanderriese_taro."); return; }
  setFeedback("r7-f7a", "hint", "Noch nicht korrekt: Eine Zeile beschreibt nur eine Richtung. Gegenseitig wäre es erst, wenn es zusätzlich eine Zeile mit following_id 138 und follower_id 52 gäbe.");
}
function checkR7F7b() {
  state.r7.f7b = selectedValues("r7-f7b");
  saveState();
  const selected = state.r7.f7b;
  const correctSet = ["twoRows", "swapped", "bothRefUsers"];
  if (!selected.length) { setFeedback("r7-f7b", "hint", "Noch nicht korrekt: Kreuze mindestens eine Aussage an."); return; }
  if (sameSet(selected, correctSet)) { setFeedback("r7-f7b", "success", "Richtig: Jede Zeile beschreibt eine Richtung. Für gegenseitiges Folgen braucht man zwei Zeilen, und beide Fremdschlüssel verweisen auf users."); markSolved("r7-f7b"); maybeRevealR7Summary(); return; }
  if (selected.includes("oneRowEnough")) { const anyCorrect = selected.some((id) => correctSet.includes(id)); setFeedback("r7-f7b", anyCorrect ? "partial" : "hint", `${anyCorrect ? "Teilweise korrekt:" : "Noch nicht korrekt:"} Folgen gilt nicht automatisch in beide Richtungen: Zeile 947 zeigt, dass wanderriese_taro oekosmasher folgt – daraus folgt nicht, dass oekosmasher auch wanderriese_taro folgt.`); return; }
  setFeedback("r7-f7b", "partial", "Teilweise korrekt: Deine Auswahl stimmt, es fehlt aber noch mindestens eine richtige Aussage. Vergleiche die Zeilen 1 und 2 und sieh dir an, worauf following_id und follower_id verweisen.");
}

// ---------------------------------------------------------------------------
// Schritt 8: Abschlussquiz
// ---------------------------------------------------------------------------
function renderQuiz() {
  BEZIEHUNGSARTEN_QUIZ.forEach((question, index) => {
    renderCheckboxList(`quiz-q${index + 1}`, `quiz-q${index + 1}`, question.options.map((o) => ({ id: o.id, label: o.text })), state.r8[question.id]);
  });
}
function checkQuiz(event) {
  event.preventDefault();
  BEZIEHUNGSARTEN_QUIZ.forEach((question, index) => { state.r8[question.id] = selectedValues(`quiz-q${index + 1}`); });
  saveState();
  const results = BEZIEHUNGSARTEN_QUIZ.map((question) => evaluateQuizQuestion(question, state.r8[question.id]));
  const correctCount = results.filter(Boolean).length;
  if (correctCount === BEZIEHUNGSARTEN_QUIZ.length) {
    setFeedback("step8", "success", "Richtig: Alle fünf Fragen stimmen. Die Abschlussübersicht ist jetzt freigeschaltet.");
    state.summaryUnlocked = true;
    markSolved("r8-quiz");
    saveState();
    setTimeout(() => navigateTo("summary"), 300);
    return;
  }
  const anyEmpty = BEZIEHUNGSARTEN_QUIZ.some((question) => !state.r8[question.id].length);
  if (anyEmpty) { setFeedback("step8", "hint", "Noch nicht korrekt: Beantworte alle fünf Fragen. Bei manchen Fragen sind mehrere Antworten richtig."); return; }
  if (correctCount >= 1) {
    const wrongNumbers = results.map((ok, index) => (ok ? null : index + 1)).filter(Boolean);
    const firstWrong = wrongNumbers[0];
    setFeedback("step8", "partial", `Teilweise korrekt: ${correctCount} von 5 Fragen sind vollständig richtig. Prüfe noch Frage ${wrongNumbers.join(", ")}. Tipp zu Frage ${firstWrong}: ${BEZIEHUNGSARTEN_QUIZ[firstWrong - 1].hint}`);
    return;
  }
  setFeedback("step8", "hint", `Noch nicht korrekt: Keine Frage ist vollständig richtig. Tipp zu Frage 1: ${BEZIEHUNGSARTEN_QUIZ[0].hint}`);
}

// ---------------------------------------------------------------------------
// Navigation, Tabs, Übersicht
// ---------------------------------------------------------------------------
function renderTabs() {
  const tabs = document.getElementById("step-tabs");
  tabs.innerHTML = STEP_TITLES.map((title, index) => {
    const step = index + 1;
    return `<button id="tab-${step}" class="step-tab ${state.completed.includes(step) ? "is-complete" : ""}" type="button" role="tab" aria-controls="step-${step}" aria-selected="${state.currentStep === step}" data-step="${step}"><span>${step}</span><small>${title}</small></button>`;
  }).join("") + `<button id="tab-summary" class="step-tab" type="button" role="tab" aria-controls="step-summary" aria-selected="${state.currentStep === "summary"}" data-step="summary" ${state.summaryUnlocked ? "" : "hidden"}><span>✓</span><small>Übersicht</small></button>`;
  tabs.querySelectorAll("button").forEach((button) => button.addEventListener("click", () => navigateTo(button.dataset.step === "summary" ? "summary" : Number(button.dataset.step))));
  enableTabKeyboardNavigation(tabs);
  syncTabSemantics(tabs, state.currentStep);
}
function navigateTo(step, { focusContent = false } = {}) {
  if (step === "summary" && !state.summaryUnlocked) return;
  document.querySelectorAll(".step-panel").forEach((panel) => { panel.hidden = panel.id !== `step-${step}`; });
  state.currentStep = step;
  saveState();
  renderTabs();
  updateNavigation();
  if (step === "summary") renderSummary();
  const panel = document.getElementById(`step-${step}`);
  syncTabSemantics(document.getElementById("step-tabs"), state.currentStep);
  if (focusContent) focusTabPanelStart(panel);
  else window.scrollTo({ top: 0, behavior: "smooth" });
}
function updateNavigation() {
  const percent = Math.round((state.completed.filter((step) => step >= 1 && step <= 8).length / 8) * 100);
  document.getElementById("progress-bar").style.width = `${percent}%`;
  document.getElementById("progress-percent").textContent = `${percent} % bearbeitet`;
  document.getElementById("progress-label").textContent = state.currentStep === "summary" ? "Abschlussübersicht" : `Schritt ${state.currentStep} von 8`;
  const panel = document.getElementById(`step-${state.currentStep}`);
  if (panel) renderTabFlowNavigation(panel, { items: TAB_ITEMS, currentId: state.currentStep, onNavigate: navigateTo, isEnabled: (id) => (id === "summary" ? state.summaryUnlocked : true) });
}
function renderSummary() {
  const entries = [
    ["1. 1:1 entdecken", "Ordne die Klassenleiter ihren Klassen zu und ergänze die Kardinalitäten.", "10a – KOH, 10b – SEI, 10c – BRA. Klasse 1 ───── 1 Klassenleiter."],
    ["2. 1:1 umsetzen", "Welche Schemata setzen die 1:1-Beziehung richtig um? Übertrage auf Schlüssel und Schloss.", "Schema A und B: Der Fremdschlüssel steht in genau einer Tabelle. Schlüssel 1 ───── 1 Schloss mit schloss_id[schloss] in schluessel oder schluessel_id[schluessel] in schloss."],
    ["3. n:m entdecken", "Lässt sich Lina mit einem Fremdschlüssel zwei AGs zuordnen? Ergänze die Kardinalitäten.", "Nein: Eine Zelle enthält genau einen Wert, und auch eine AG hat mehrere Schüler. Schüler n ───── m AG."],
    ["4. Anmeldungen", "Lies aus teilnahme ab, wer welche AG besucht.", "Lina: Robotik und Theater. Theater: Lina und Mia. Eine neue Anmeldung ist eine neue Zeile, z. B. (2, 3)."],
    ["5. InstaHub-Klassendiagramm", "Ergänze die Kardinalitäten bei kann liken, kann kommentieren und kann folgen.", "Alle drei sind n:m-Beziehungen: users n ───── m photos (liken, kommentieren), users n ───── m users (folgen)."],
    ["6. likes", "Wer hat was geliked? Ergänze die Umsetzung mit Tabellen.", "reisewut_emil hat die Fotos 12 und 14 geliked; Foto 14 gefällt reisewut_emil und gamewut_jonas. users 1 ───── n likes n ───── 1 photos."],
    ["7. follows", "Deute die Zeilen der Hilfstabelle follows.", "Zeile 947: wanderriese_taro folgt oekosmasher. Gegenseitiges Folgen braucht zwei Zeilen; beide Fremdschlüssel verweisen auf users."],
    ["8. Abschlussquiz", "Sichere 1:1, Hilfstabelle, Kardinalitäten, likes und follows.", "Alle fünf Fragen richtig beantwortet."],
  ];
  document.getElementById("answer-summary").innerHTML = entries.map(([title, prompt, result]) => `<section class="summary-section"><h3>${title}</h3><p class="prompt">${prompt}</p><dl class="summary-grid"><dt>Richtiges Ergebnis</dt><dd>${result}</dd></dl></section>`).join("");
}

function restoreInputs() {
  document.getElementById("r1-klasse-cardinality").value = state.r1.klasse;
  document.getElementById("r1-klassenleiter-cardinality").value = state.r1.klassenleiter;
  document.getElementById("r2-schluessel-cardinality").value = state.r2.schluesselA;
  document.getElementById("r2-schloss-cardinality").value = state.r2.schluesselB;
  document.getElementById("r3-schueler-cardinality").value = state.r3.schueler;
  document.getElementById("r3-ag-cardinality").value = state.r3.ag;
  document.getElementById("r5-folgen-a").value = state.r5.folgenA;
  document.getElementById("r5-folgen-b").value = state.r5.folgenB;
  document.getElementById("r5-kommentieren-a").value = state.r5.kommentierenA;
  document.getElementById("r5-kommentieren-b").value = state.r5.kommentierenB;
  document.getElementById("r5-liken-a").value = state.r5.likenA;
  document.getElementById("r5-liken-b").value = state.r5.likenB;
  document.getElementById("r6-users-cardinality").value = state.r6.users;
  document.getElementById("r6-likes-a-cardinality").value = state.r6.likesA;
  document.getElementById("r6-likes-b-cardinality").value = state.r6.likesB;
  document.getElementById("r6-photos-cardinality").value = state.r6.photos;

  renderRadioList("r1-f1a-choices", "r1-f1a", R1_F1A_OPTIONS, state.r1.f1a);
  renderRadioList("r1-f1b-choices", "r1-f1b", R1_F1B_OPTIONS, state.r1.f1b);
  renderCheckboxList("r2-schema-choices", "r2-schema", R2_SCHEMA_OPTIONS, state.r2.schema);
  renderSchemaChoiceList("r2-schluessel-schema-choices", "r2-schluessel-schema", R2_SCHLUESSEL_SCHEMA_OPTIONS, state.r2.schluesselSchema);
  renderRadioList("r3-f3a-choices", "r3-f3a", R3_F3A_OPTIONS, state.r3.f3a);
  renderRadioList("r3-f3b-choices", "r3-f3b", R3_F3B_OPTIONS, state.r3.f3b);
  renderCheckboxList("r4-f4a-choices", "r4-f4a", R4_F4A_OPTIONS, state.r4.f4a);
  renderCheckboxList("r4-f4b-choices", "r4-f4b", R4_F4B_OPTIONS, state.r4.f4b);
  renderRadioList("r4-f4c-choices", "r4-f4c", R4_F4C_OPTIONS, state.r4.f4c);
  renderCheckboxList("r6-f6a-choices", "r6-f6a", R6_F6A_OPTIONS, state.r6.f6a);
  renderCheckboxList("r6-f6b-choices", "r6-f6b", R6_F6B_OPTIONS, state.r6.f6b);
  renderRadioList("r7-f7a-choices", "r7-f7a", R7_F7A_OPTIONS, state.r7.f7a);
  renderCheckboxList("r7-f7b-choices", "r7-f7b", R7_F7B_OPTIONS, state.r7.f7b);
  renderQuiz();

  document.getElementById("r1-reveal").hidden = !isSolved("r1-cardinality");
  document.getElementById("r2-merke").hidden = !isSolved("r2-schema");
  document.getElementById("r3-reveal").hidden = !isSolved("r3-cardinality");
  document.getElementById("r4-merke").hidden = !["r4-f4a", "r4-f4b", "r4-f4c"].every(isSolved);
  document.getElementById("r5-summary").hidden = !isSolved("r5-cardinality");
  document.getElementById("r6-summary").hidden = !isSolved("r6-cardinality");
  document.getElementById("r7-summary").hidden = !["r7-f7a", "r7-f7b"].every(isSolved);
}

function bindEvents() {
  document.getElementById("check-r1-drag").addEventListener("click", checkR1Drag);
  document.getElementById("check-r1-f1a").addEventListener("click", checkR1F1a);
  document.getElementById("check-r1-f1b").addEventListener("click", checkR1F1b);
  document.getElementById("check-r1-cardinality").addEventListener("click", checkR1Cardinality);
  document.getElementById("check-r2-schema").addEventListener("click", checkR2Schema);
  document.getElementById("check-r2-cardinality").addEventListener("click", checkR2Cardinality);
  document.getElementById("check-r2-schluessel-schema").addEventListener("click", checkR2SchluesselSchema);
  document.getElementById("check-r3-f3a").addEventListener("click", checkR3F3a);
  document.getElementById("check-r3-f3b").addEventListener("click", checkR3F3b);
  document.getElementById("check-r3-cardinality").addEventListener("click", checkR3Cardinality);
  document.getElementById("check-r4-f4a").addEventListener("click", checkR4F4a);
  document.getElementById("check-r4-f4b").addEventListener("click", checkR4F4b);
  document.getElementById("check-r4-f4c").addEventListener("click", checkR4F4c);
  document.getElementById("check-r5-cardinality").addEventListener("click", checkR5Cardinality);
  document.getElementById("check-r6-f6a").addEventListener("click", checkR6F6a);
  document.getElementById("check-r6-f6b").addEventListener("click", checkR6F6b);
  document.getElementById("check-r6-cardinality").addEventListener("click", checkR6Cardinality);
  document.getElementById("check-r7-f7a").addEventListener("click", checkR7F7a);
  document.getElementById("check-r7-f7b").addEventListener("click", checkR7F7b);
  document.getElementById("final-quiz").addEventListener("submit", checkQuiz);
  document.getElementById("reset-module").addEventListener("click", () => {
    if (window.confirm("Möchtest du alle Eingaben und den Fortschritt zurücksetzen?")) { localStorage.removeItem(STORAGE_KEY); window.location.reload(); }
  });

  // Radio-/Checkbox-Gruppen: Jede Änderung übernimmt den Wert sofort in den
  // State, speichert und löscht nur die zugehörige Rückmeldung (Spezifikation
  // 4.2: "Nach jeder Änderung speichern", nicht erst beim Klick auf Prüfen).
  const bindRadioGroup = (name, assign, feedbackId) => {
    document.querySelectorAll(`input[name="${name}"]`).forEach((input) => input.addEventListener("change", () => {
      assign(input.value);
      saveState();
      clearFeedback(feedbackId);
    }));
  };
  const bindCheckboxGroup = (name, assign, feedbackId) => {
    document.querySelectorAll(`input[name="${name}"]`).forEach((input) => input.addEventListener("change", () => {
      assign(selectedValues(name));
      saveState();
      clearFeedback(feedbackId);
    }));
  };
  const bindCardinalityInput = (id, assign, feedbackId) => {
    document.getElementById(id).addEventListener("input", () => {
      assign(document.getElementById(id).value);
      saveState();
      clearFeedback(feedbackId);
    });
  };

  bindRadioGroup("r1-f1a", (value) => { state.r1.f1a = value; }, "r1-f1a");
  bindRadioGroup("r1-f1b", (value) => { state.r1.f1b = value; }, "r1-f1b");
  bindCheckboxGroup("r2-schema", (value) => { state.r2.schema = value; }, "r2-schema");
  bindCheckboxGroup("r2-schluessel-schema", (value) => { state.r2.schluesselSchema = value; }, "r2-schluessel-schema");
  bindRadioGroup("r3-f3a", (value) => { state.r3.f3a = value; }, "r3-f3a");
  bindRadioGroup("r3-f3b", (value) => { state.r3.f3b = value; }, "r3-f3b");
  bindCheckboxGroup("r4-f4a", (value) => { state.r4.f4a = value; }, "r4-f4a");
  bindCheckboxGroup("r4-f4b", (value) => { state.r4.f4b = value; }, "r4-f4b");
  bindRadioGroup("r4-f4c", (value) => { state.r4.f4c = value; }, "r4-f4c");
  bindCheckboxGroup("r6-f6a", (value) => { state.r6.f6a = value; }, "r6-f6a");
  bindCheckboxGroup("r6-f6b", (value) => { state.r6.f6b = value; }, "r6-f6b");
  bindRadioGroup("r7-f7a", (value) => { state.r7.f7a = value; }, "r7-f7a");
  bindCheckboxGroup("r7-f7b", (value) => { state.r7.f7b = value; }, "r7-f7b");
  BEZIEHUNGSARTEN_QUIZ.forEach((question, index) => {
    bindCheckboxGroup(`quiz-q${index + 1}`, (value) => { state.r8[question.id] = value; }, "step8");
  });

  bindCardinalityInput("r1-klasse-cardinality", (value) => { state.r1.klasse = value; }, "r1-cardinality");
  bindCardinalityInput("r1-klassenleiter-cardinality", (value) => { state.r1.klassenleiter = value; }, "r1-cardinality");
  bindCardinalityInput("r2-schluessel-cardinality", (value) => { state.r2.schluesselA = value; }, "r2-cardinality");
  bindCardinalityInput("r2-schloss-cardinality", (value) => { state.r2.schluesselB = value; }, "r2-cardinality");
  bindCardinalityInput("r3-schueler-cardinality", (value) => { state.r3.schueler = value; }, "r3-cardinality");
  bindCardinalityInput("r3-ag-cardinality", (value) => { state.r3.ag = value; }, "r3-cardinality");
  bindCardinalityInput("r5-folgen-a", (value) => { state.r5.folgenA = value; }, "r5-cardinality");
  bindCardinalityInput("r5-folgen-b", (value) => { state.r5.folgenB = value; }, "r5-cardinality");
  bindCardinalityInput("r5-kommentieren-a", (value) => { state.r5.kommentierenA = value; }, "r5-cardinality");
  bindCardinalityInput("r5-kommentieren-b", (value) => { state.r5.kommentierenB = value; }, "r5-cardinality");
  bindCardinalityInput("r5-liken-a", (value) => { state.r5.likenA = value; }, "r5-cardinality");
  bindCardinalityInput("r5-liken-b", (value) => { state.r5.likenB = value; }, "r5-cardinality");
  bindCardinalityInput("r6-users-cardinality", (value) => { state.r6.users = value; }, "r6-cardinality");
  bindCardinalityInput("r6-likes-a-cardinality", (value) => { state.r6.likesA = value; }, "r6-cardinality");
  bindCardinalityInput("r6-likes-b-cardinality", (value) => { state.r6.likesB = value; }, "r6-cardinality");
  bindCardinalityInput("r6-photos-cardinality", (value) => { state.r6.photos = value; }, "r6-cardinality");
}

function init() {
  renderR1Tables();
  renderR2Schemas();
  renderR3Tables();
  renderR4Tables();
  renderR6Tables();
  renderR7Tables();
  renderR1DragDrop();
  restoreInputs();
  renderTabs();
  bindEvents();
  navigateTo(state.currentStep);
  updateNavigation();
}

document.addEventListener("DOMContentLoaded", init);
