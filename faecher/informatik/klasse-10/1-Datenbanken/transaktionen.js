import { enableTabKeyboardNavigation, focusTabPanelStart, renderTabFlowNavigation, syncTabSemantics } from './tab-navigation.mjs?v=20260906a';
import {
  SCHUELER, TEILNAHME,
  USERS_PHOTOS_START, truncateDescription,
  UPDATE_RESULT, DELETE_RESULT, INSERT_RESULT,
  INSTAHUB_USERS_SPLIT, INSTAHUB_PHOTOS_SPLIT,
  AG_MIT_PLAETZEN,
  TRANSAKTIONEN_QUIZ, evaluateQuizQuestion,
} from './transaktionen-daten.mjs?v=20260926a';

const STORAGE_KEY = "informatik10-datenbanken-aufgabe9-v1";
const STEP_TITLES = ["Datenpflege", "Namen ändern", "Fotos löschen", "Foto einfügen", "Regeln", "Schule", "Abschlussquiz"];
const TAB_ITEMS = [...STEP_TITLES.map((label, index) => ({ id: index + 1, label })), { id: "summary", label: "Auswertung" }];

function unlockSolution(event, expectedCode, downloadLinkId, messageId) {
  event.preventDefault();
  const enteredCode = event.currentTarget.elements["solution-code"].value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const normalizedExpectedCode = expectedCode.replace(/[^A-Z0-9]/g, "");
  const downloadLink = document.getElementById(downloadLinkId);
  const message = document.getElementById(messageId);
  if (enteredCode === normalizedExpectedCode) {
    downloadLink.hidden = false;
    message.className = "solution-code-message";
    message.textContent = "Code korrekt. Das Sicherungsblatt ist freigeschaltet.";
    return;
  }
  downloadLink.hidden = true;
  message.className = "solution-code-message error";
  message.textContent = "Der eingegebene Code ist nicht gültig.";
}
window.unlockSolution = unlockSolution;

const STEP_SUBTASKS = {
  1: ["s1-drag", "s1-f1b"],
  2: ["s2-f2a", "s2-f2b"],
  3: ["s3-f3a", "s3-f3b"],
  4: ["s4-f4a", "s4-f4b"],
  5: ["s5-drag", "s5-f5b"],
  6: ["s6-drag", "s6-f6b"],
  7: ["s7-quiz"],
};
const ALL_SUBTASK_IDS = Object.values(STEP_SUBTASKS).flat();

// ---------------------------------------------------------------------------
// Drag-and-Drop-Konfiguration (R1, R5, R6)
// ---------------------------------------------------------------------------
const S1_COMMANDS = ["INSERT", "SELECT", "UPDATE", "DELETE"];
const S1_CORRECT = { 1: "INSERT", 2: "SELECT", 3: "UPDATE", 4: "DELETE" };
const S1_SLOTS = [
  { id: 1, ariaName: "Situation 1", text: "1 · zornlaeufer lädt ein neues Foto hoch." },
  { id: 2, ariaName: "Situation 2", text: "2 · Die App zeigt alle Fotos von nelefitmuse an." },
  { id: 3, ariaName: "Situation 3", text: "3 · nelefitmuse ändert die Beschreibung eines Fotos." },
  { id: 4, ariaName: "Situation 4", text: "4 · zornlaeufer entfernt ein Foto aus seinem Profil." },
];

const S5_TOKENS = ["idTaken", "invalidDate", "noUser", "onlySupport"];
const S5_TOKEN_LABELS = {
  idTaken: "Diese id ist in der Tabelle schon vergeben.",
  invalidDate: "Dieser Wert ist kein gültiges Datum.",
  noUser: "Einen Benutzer mit dieser id gibt es nicht.",
  onlySupport: "Nur der Support darf Daten ändern.",
};
const S5_CORRECT = { A: "idTaken", B: "invalidDate", C: "noUser" };
const S5_SLOTS = [
  { id: "A", ariaName: "Anweisung A", label: "Anweisung A", sql: ["INSERT INTO photos (id, description, url, user_id)", "VALUES (1001, '#usa #florida #everglades', 'storage/photos/2/1480.webp', 143)"] },
  { id: "B", ariaName: "Anweisung B", label: "Anweisung B", sql: ["UPDATE users", "SET birthday = 'Sommer 2008'", "WHERE id = 143"] },
  { id: "C", ariaName: "Anweisung C", label: "Anweisung C", sql: ["INSERT INTO photos (id, description, url, user_id)", "VALUES (1480, '#usa #florida #everglades', 'storage/photos/2/1480.webp', 999)"] },
];

const S6_TOKENS = ["entity", "domain", "reference", "none"];
const S6_TOKEN_LABELS = {
  entity: "Entitätsintegrität",
  domain: "Wertebereichsintegrität",
  reference: "referentielle Integrität",
  none: "wird ausgeführt",
};
const S6_CORRECT = { 1: "entity", 2: "none", 3: "reference", 4: "domain" };
const S6_SLOTS = [
  { id: 1, ariaName: "Anweisung 1", label: "Anweisung 1", sql: ["INSERT INTO ag (id, name, plaetze)", "VALUES (3, 'Schach', 16)"] },
  { id: 2, ariaName: "Anweisung 2", label: "Anweisung 2", sql: ["INSERT INTO teilnahme (schueler_id, ag_id)", "VALUES (2, 3)"] },
  { id: 3, ariaName: "Anweisung 3", label: "Anweisung 3", sql: ["INSERT INTO teilnahme (schueler_id, ag_id)", "VALUES (2, 7)"] },
  { id: 4, ariaName: "Anweisung 4", label: "Anweisung 4", sql: ["UPDATE ag", "SET plaetze = 'viele'", "WHERE id = 2"] },
];

// ---------------------------------------------------------------------------
// Multiple-Choice-Optionen. `message` bei Radios enthält bereits das
// Präfix ("Richtig:"/"Noch nicht korrekt:"), bei Checkbox-Optionen nicht -
// der Präfix wird in checkChecklist() berechnet (Teilweise korrekt:/Noch
// nicht korrekt:), siehe Spezifikation Abschnitt 3 "Einheitliche
// Feedbacklogik".
// ---------------------------------------------------------------------------
const S1_F1B_OPTIONS = [
  { id: "insert", label: "INSERT", correct: true },
  { id: "select", label: "SELECT", correct: false, message: "SELECT zeigt Daten nur an. Die Tabelle ist danach unverändert." },
  { id: "update", label: "UPDATE", correct: true },
  { id: "delete", label: "DELETE", correct: true },
];

const S2_F2A_OPTIONS = [
  { id: "allChanged", label: "Neles Name ist in allen drei Zeilen geändert.", correct: false, message: "Noch nicht korrekt: Sieh genau hin: Nur eine Zeile hat den Status »geändert«. Die WHERE-Bedingung trifft nur Zeilen, deren Beschreibung »Park« enthält." },
  { id: "onlyPark", label: "Nur in einer Zeile steht jetzt Nele Schweizer, in den anderen beiden noch Nele Hohenstein.", correct: true, message: "Richtig: Die WHERE-Bedingung trifft nur das Park-Foto. Die beiden anderen Zeilen von nelefitmuse bleiben unverändert." },
  { id: "newRow", label: "Die Anweisung hat eine neue Zeile für Nele Schweizer angelegt.", correct: false, message: "Noch nicht korrekt: UPDATE legt keine neue Zeile an, es ändert Werte in vorhandenen Zeilen. Zähle die Zeilen vorher und nachher." },
];
const S2_F2B_OPTIONS = [
  { id: "twoNames", label: "Für denselben Benutzer nelefitmuse stehen zwei verschiedene Namen in der Tabelle.", correct: true },
  { id: "unsureName", label: "Man kann nicht mehr sicher sagen, wie Nele wirklich heißt.", correct: true },
  { id: "parkDeleted", label: "Das Park-Foto wurde gelöscht.", correct: false, message: "Das Park-Foto ist noch da. UPDATE löscht keine Zeilen; geändert wurde nur der Wert in der Spalte name." },
  { id: "noErrorNoProblem", label: "Es gibt kein Problem, denn die Anweisung lief ohne Fehlermeldung.", correct: false, message: "Dass eine Anweisung ohne Fehlermeldung läuft, heißt nicht, dass die Daten danach stimmen. Vergleiche die Spalte name in allen Zeilen von nelefitmuse." },
];
const S2_F2B_SUCCESS = "Richtig: Neles Name ist redundant gespeichert und widerspricht sich jetzt. Die Anweisung lief ohne Fehler – trotzdem sind die Daten nicht mehr stimmig.";
const S2_F2B_INCOMPLETE = "Teilweise korrekt: Deine Auswahl stimmt, es fehlt aber noch eine Aussage. Was bedeutet es, wenn für einen Benutzer zwei Namen gespeichert sind?";
const S2_F2B_EMPTY = "Noch nicht korrekt: Kreuze mindestens eine Aussage an.";

const S3_F3A_OPTIONS = [
  { id: "onlyNameUsername", label: "Nur noch sein Name und sein Benutzername.", correct: false, message: "Noch nicht korrekt: Suche in der Tabelle nach zornlaeufer. Name und Benutzername standen nur in den Zeilen seiner Fotos – mit diesen Zeilen sind auch sie verschwunden." },
  { id: "nothing", label: "Nichts mehr – auch sein Name und sein Benutzername sind weg.", correct: true, message: "Richtig: DELETE löscht immer ganze Zeilen. Janniks Name und Benutzername standen nur in den Zeilen seiner Fotos, also wurden sie mitgelöscht." },
  { id: "onlyPhotos", label: "Seine Fotos, denn DELETE löscht nur die Spalten url und description.", correct: false, message: "Noch nicht korrekt: DELETE löscht keine einzelnen Zellen, sondern ganze Zeilen – mit allen Werten darin." },
];
const S3_F3B_OPTIONS = [
  { id: "selfGone", label: "Jannik wollte nur seine Fotos loswerden, jetzt ist er selbst nicht mehr gespeichert.", correct: true },
  { id: "infoLost", label: "Mit den Zeilen sind Informationen verloren gegangen, die erhalten bleiben sollten.", correct: true },
  { id: "onlyWanted", label: "DELETE hat nur genau die gewünschte Information entfernt.", correct: false, message: "DELETE entfernt ganze Zeilen. Weil Janniks Benutzerdaten nur in den Zeilen seiner Fotos standen, wurden sie mitgelöscht – das war nicht gewünscht." },
  { id: "nelePhotosDeleted", label: "Neles Fotos wurden ebenfalls gelöscht.", correct: false, message: "Neles Zeilen erfüllen die Bedingung name LIKE 'Jannik%' nicht. Sie sind noch vollständig da." },
];
const S3_F3B_SUCCESS = "Richtig: Janniks Konto wurde nicht vergessen, es wurde mitgelöscht, weil Benutzer- und Fotodaten in denselben Zeilen stehen. DELETE entfernt immer ganze Zeilen.";
const S3_F3B_INCOMPLETE = "Teilweise korrekt: Deine Auswahl stimmt, es fehlt aber noch eine Aussage. Vergleiche, was Jannik wollte, mit dem, was jetzt noch gespeichert ist.";
const S3_F3B_EMPTY = "Noch nicht korrekt: Kreuze mindestens eine Aussage an.";

const S4_F4A_OPTIONS = [
  { id: "jannik", label: "Jannik, denn seine Zeilen stehen direkt darüber.", correct: false, message: "Noch nicht korrekt: Die Reihenfolge der Zeilen sagt nichts über den Besitzer. Sieh in die Spalten name und username der neuen Zeile." },
  { id: "noOne", label: "Niemandem: name und username sind leer (NULL).", correct: true, message: "Richtig: In der Anweisung fehlen Werte für name und username. Die Zellen bleiben leer – in SQL heißt das NULL." },
  { id: "support", label: "Dem Support, weil er die Anweisung ausgeführt hat.", correct: false, message: "Noch nicht korrekt: Wer eine Anweisung ausführt, wird nicht automatisch gespeichert. In der Tabelle zählt nur, was in name und username steht." },
];
const S4_F4B_OPTIONS = [
  { id: "noOwner", label: "In der Tabelle steht ein Foto ohne Besitzer.", correct: true },
  { id: "noUploader", label: "Niemand kann sagen, wer das Foto hochgeladen hat.", correct: true },
  { id: "autoAssign", label: "Die Datenbank hat das Foto automatisch dem letzten Benutzer zugeordnet.", correct: false, message: "Eine Datenbank ordnet nichts automatisch zu. In name und username steht NULL – das Foto hat keinen Besitzer." },
  { id: "neuerBenutzer", label: "Ein neuer Benutzer ohne Foto ließe sich ebenfalls nur mit leeren Zellen speichern.", correct: true },
];
const S4_F4B_SUCCESS = "Richtig: Weil Benutzer- und Fotodaten in einer Zeile stehen, entsteht beim Einfügen von nur einem der beiden eine unvollständige Zeile mit NULL-Werten.";
const S4_F4B_EMPTY = "Noch nicht korrekt: Kreuze mindestens eine Aussage an.";
function s4F4bIncomplete(selected, correctIds) {
  const missing = correctIds.filter((id) => !selected.includes(id));
  if (missing.length === 1 && missing[0] === "neuerBenutzer") {
    return "Teilweise korrekt: Deine Auswahl stimmt, es fehlt aber noch eine Aussage. Überlege: Was stünde in url und description, wenn sich ein neuer Benutzer ohne Foto anmeldet?";
  }
  return "Teilweise korrekt: Deine Auswahl stimmt, es fehlt aber noch mindestens eine Aussage. Sieh dir die Spalten name und username der neuen Zeile an.";
}

const S5_F5B_OPTIONS = [
  { id: "oneName", label: "Ändert Nele ihren Namen, wird er nur an einer Stelle geändert: in users.", correct: true },
  { id: "userKeeps", label: "Löscht Jannik seine Fotos in photos, bleibt sein Datensatz in users erhalten.", correct: true },
  { id: "refRejected", label: "Ein Foto mit einer user_id, zu der es keinen Benutzer gibt, wird abgelehnt.", correct: true },
  { id: "typoDetection", label: "Das Datenbanksystem erkennt jetzt auch falsch geschriebene Namen.", correct: false, message: "Das Datenbanksystem prüft Regeln wie Datentyp oder Schlüssel. Ob »Nele« richtig geschrieben ist, kann es nicht wissen – ein falscher Name ist trotzdem ein gültiger varchar-Wert." },
  { id: "dataProtection", label: "Diese Regeln schützen die Daten vor fremden Zugriffen.", correct: false, message: "Diese Regeln sorgen dafür, dass die Daten stimmig sind. Wer zugreifen darf, regeln Benutzerrechte." },
];
const S5_F5B_SUCCESS = "Richtig: In getrennten Tabellen steht jede Information nur einmal, Löschen in photos lässt users unberührt, und kein Foto kann auf einen Benutzer verweisen, den es nicht gibt.";
const S5_F5B_INCOMPLETE = "Teilweise korrekt: Deine Auswahl stimmt, es fehlt aber noch mindestens eine Aussage. Denke an die drei Probleme aus den Schritten 2 bis 4.";
const S5_F5B_EMPTY = "Noch nicht korrekt: Kreuze mindestens eine Aussage an.";

const S6_F6B_OPTIONS = [
  { id: "wouldReferenceMissing", label: "Sonst stünde in teilnahme eine Anmeldung für eine AG, die es nicht gibt.", correct: true, message: "Richtig: Referentielle Integrität sorgt dafür, dass jeder Fremdschlüssel auf einen vorhandenen Datensatz zeigt – dasselbe Problem wie beim Foto ohne Besitzer in Schritt 4." },
  { id: "fkJustNumber", label: "Ein Fremdschlüssel ist nur eine Zahl – die Ablehnung ist eigentlich unnötig.", correct: false, message: "Noch nicht korrekt: Ein Fremdschlüssel darf nicht auf eine beliebige Zahl zeigen. Er muss auf einen Datensatz verweisen, den es gibt – sonst weiß niemand, welche AG gemeint ist." },
  { id: "benOneAg", label: "Ben darf sich nur für eine AG anmelden.", correct: false, message: "Noch nicht korrekt: Ben darf mehrere AGs besuchen – Schüler und AG stehen in einer n:m-Beziehung. Das Problem ist die ag_id 7." },
];

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
function emptyDefaultState() {
  return {
    currentStep: 1,
    completed: [],
    summaryUnlocked: false,
    solved: [],
    s1: { drag: { 1: "", 2: "", 3: "", 4: "" }, f1b: [] },
    s2: { executed: false, f2a: "", f2b: [] },
    s3: { executed: false, f3a: "", f3b: [] },
    s4: { executed: false, f4a: "", f4b: [] },
    s5: { drag: { A: "", B: "", C: "" }, f5b: [] },
    s6: { drag: { 1: "", 2: "", 3: "", 4: "" }, f6b: "" },
    s7: TRANSAKTIONEN_QUIZ.reduce((acc, question) => ({ ...acc, [question.id]: [] }), {}),
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
function sanitizeBoolean(value) {
  return value === true;
}
function sanitizeDragState(saved, slotIds, allowedTokens) {
  const result = {};
  slotIds.forEach((id) => {
    const value = saved && typeof saved === "object" ? saved[id] : undefined;
    result[id] = typeof value === "string" && allowedTokens.includes(value) ? value : "";
  });
  return result;
}

function sanitizeState(saved) {
  const fresh = emptyDefaultState();
  if (!saved || typeof saved !== "object") return fresh;
  const solved = Array.isArray(saved.solved) ? saved.solved.filter((id) => ALL_SUBTASK_IDS.includes(id)) : [];
  const summaryUnlocked = saved.summaryUnlocked === true;
  const completed = Array.isArray(saved.completed) ? saved.completed.filter((step) => Number.isInteger(step) && step >= 1 && step <= 7) : [];
  let currentStep = saved.currentStep;
  if (currentStep === "summary") { if (!summaryUnlocked) currentStep = 1; }
  else if (!(Number.isInteger(currentStep) && currentStep >= 1 && currentStep <= 7)) currentStep = 1;

  return {
    currentStep, completed, summaryUnlocked, solved,
    s1: {
      drag: sanitizeDragState(saved.s1?.drag, [1, 2, 3, 4], S1_COMMANDS),
      f1b: sanitizeArray(saved.s1?.f1b, S1_F1B_OPTIONS.map((o) => o.id)),
    },
    s2: {
      executed: sanitizeBoolean(saved.s2?.executed),
      f2a: sanitizeChoice(saved.s2?.f2a, S2_F2A_OPTIONS.map((o) => o.id)),
      f2b: sanitizeArray(saved.s2?.f2b, S2_F2B_OPTIONS.map((o) => o.id)),
    },
    s3: {
      executed: sanitizeBoolean(saved.s3?.executed),
      f3a: sanitizeChoice(saved.s3?.f3a, S3_F3A_OPTIONS.map((o) => o.id)),
      f3b: sanitizeArray(saved.s3?.f3b, S3_F3B_OPTIONS.map((o) => o.id)),
    },
    s4: {
      executed: sanitizeBoolean(saved.s4?.executed),
      f4a: sanitizeChoice(saved.s4?.f4a, S4_F4A_OPTIONS.map((o) => o.id)),
      f4b: sanitizeArray(saved.s4?.f4b, S4_F4B_OPTIONS.map((o) => o.id)),
    },
    s5: {
      drag: sanitizeDragState(saved.s5?.drag, ["A", "B", "C"], S5_TOKENS),
      f5b: sanitizeArray(saved.s5?.f5b, S5_F5B_OPTIONS.map((o) => o.id)),
    },
    s6: {
      drag: sanitizeDragState(saved.s6?.drag, [1, 2, 3, 4], S6_TOKENS),
      f6b: sanitizeChoice(saved.s6?.f6b, S6_F6B_OPTIONS.map((o) => o.id)),
    },
    s7: TRANSAKTIONEN_QUIZ.reduce((acc, question) => ({ ...acc, [question.id]: sanitizeArray(saved.s7?.[question.id], question.options.map((o) => o.id)) }), {}),
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

function miniTableCard(title, columns, rows, { highlight = [], captionText } = {}) {
  const head = columns.map((column, index) => `<th scope="col"${highlight.includes(index) ? ' class="link-column"' : ""}>${escapeHtml(column)}</th>`).join("");
  const body = rows.map((row) => `<tr>${row.map((cell, index) => `<td${highlight.includes(index) ? ' class="link-column"' : ""}>${cell === null ? '<span class="unknown-value">?</span>' : escapeHtml(cell)}</td>`).join("")}</tr>`).join("");
  return `<section class="mini-table-card"><h3>${escapeHtml(title)}</h3><table><caption class="sr-only">${escapeHtml(captionText ?? `${title} – Tabellenauszug`)}</caption><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></section>`;
}

// ---------------------------------------------------------------------------
// Generischer Drag-and-Drop-Baustein (verallgemeinert aus beziehungsarten.js,
// renderR1DragDrop/r1EnableDrag/r1Place): Konfiguration mit Tokens, Slots,
// State-Objekt, Feedback-Id, Token-Klasse. Genutzt von R1, R5, R6.
// ---------------------------------------------------------------------------
let dndPicked = null; // { instanceId, key, from } | null, from = null bedeutet "Bank"

function dndWasDragged(element) {
  if (element.dataset.dragged !== "true") return false;
  delete element.dataset.dragged;
  return true;
}

function dndEnableDrag(instance, element, key, fromSlotId) {
  element.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    const startX = event.clientX, startY = event.clientY;
    let ghost = null;
    element.setPointerCapture(event.pointerId);
    const move = (moveEvent) => {
      if (!ghost && Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY) < 6) return;
      if (!ghost) {
        ghost = document.createElement("span");
        ghost.className = `drag-token drag-ghost ${instance.tokenClass}`.trim();
        ghost.textContent = instance.tokenLabel(key);
        document.body.append(ghost);
      }
      ghost.style.left = `${moveEvent.clientX}px`;
      ghost.style.top = `${moveEvent.clientY}px`;
      document.querySelectorAll(`#${instance.containerId} .drop-slot`).forEach((slot) => slot.classList.remove("is-drop-target"));
      document.elementFromPoint(moveEvent.clientX, moveEvent.clientY)?.closest(".drop-slot")?.classList.add("is-drop-target");
    };
    const end = (endEvent) => {
      element.removeEventListener("pointermove", move);
      element.removeEventListener("pointerup", end);
      element.removeEventListener("pointercancel", end);
      if (!ghost) return;
      ghost.remove();
      element.dataset.dragged = "true";
      const container = document.getElementById(instance.containerId);
      const drop = endEvent.type === "pointerup" ? document.elementFromPoint(endEvent.clientX, endEvent.clientY) : null;
      const slot = drop?.closest(".drop-slot");
      if (slot && container.contains(slot)) dndPlace(instance, key, fromSlotId, slot.dataset.slotId);
      else if (fromSlotId !== null && drop?.closest(".token-bank") && container.contains(drop)) dndPlace(instance, key, fromSlotId, null);
      else renderDragDrop(instance);
    };
    element.addEventListener("pointermove", move);
    element.addEventListener("pointerup", end);
    element.addEventListener("pointercancel", end);
  });
}

function dndPlace(instance, key, fromSlotId, toSlotId) {
  const dragState = instance.getState();
  if (fromSlotId !== null) dragState[fromSlotId] = "";
  if (toSlotId !== null) {
    const previous = dragState[toSlotId];
    dragState[toSlotId] = key;
    if (fromSlotId !== null && previous) dragState[fromSlotId] = previous;
  }
  dndPicked = null;
  clearFeedback(instance.feedbackId);
  saveState();
  renderDragDrop(instance);
}

function renderDragDrop(instance) {
  const container = document.getElementById(instance.containerId);
  const dragState = instance.getState();
  const assigned = Object.values(dragState);
  const bankTokens = instance.tokens.filter((key) => !assigned.includes(key));
  container.innerHTML = "";
  const bank = document.createElement("div");
  bank.className = "token-bank";
  bank.setAttribute("aria-label", instance.bankAriaLabel);
  const rows = document.createElement("div");
  rows.className = "drop-rows";
  container.append(bank, rows);

  bankTokens.forEach((key) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `drag-token ${instance.tokenClass}`.trim();
    const picked = dndPicked?.instanceId === instance.id && dndPicked?.from === null && dndPicked?.key === key;
    button.setAttribute("aria-pressed", String(picked));
    button.textContent = instance.tokenLabel(key);
    dndEnableDrag(instance, button, key, null);
    button.addEventListener("click", () => {
      if (dndWasDragged(button)) return;
      dndPicked = picked ? null : { instanceId: instance.id, key, from: null };
      renderDragDrop(instance);
    });
    bank.append(button);
  });

  instance.slots.forEach((slotDef) => {
    const row = document.createElement("div");
    row.className = "drag-row";
    const label = instance.renderLabel(slotDef);
    const slotIdString = String(slotDef.id);
    const slot = document.createElement("button");
    slot.type = "button";
    slot.className = `drop-slot ${instance.slotClass ?? ""}`.trim();
    slot.dataset.slotId = slotIdString;
    const value = dragState[slotDef.id];
    const valueLabel = value ? instance.tokenLabel(value) : "leer";
    slot.textContent = valueLabel;
    slot.setAttribute("aria-label", `Feld für ${slotDef.ariaName}: ${valueLabel}`);
    const picked = dndPicked?.instanceId === instance.id && dndPicked?.from === slotIdString;
    slot.setAttribute("aria-pressed", String(picked));
    if (value) dndEnableDrag(instance, slot, value, slotIdString);
    slot.addEventListener("click", () => {
      if (dndWasDragged(slot)) return;
      if (dndPicked && dndPicked.instanceId === instance.id && dndPicked.from !== slotIdString) { dndPlace(instance, dndPicked.key, dndPicked.from, slotIdString); return; }
      if (dndPicked && dndPicked.instanceId === instance.id && dndPicked.from === slotIdString) { dndPlace(instance, value, slotIdString, null); return; }
      if (value) { dndPicked = { instanceId: instance.id, key: value, from: slotIdString }; renderDragDrop(instance); }
    });
    row.append(label, slot);
    rows.append(row);
  });
}

function textSqlLabel(labelText, sqlLines) {
  const span = document.createElement("span");
  span.append(document.createTextNode(labelText));
  const pre = document.createElement("pre");
  pre.className = "given-sql";
  const code = document.createElement("code");
  code.textContent = sqlLines.join("\n");
  pre.append(code);
  span.append(pre);
  return span;
}

const s1Instance = {
  id: "s1", containerId: "s1-dragdrop",
  tokens: S1_COMMANDS, tokenLabel: (key) => key, tokenClass: "", slotClass: "",
  bankAriaLabel: "Befehl-Karten",
  slots: S1_SLOTS.map((s) => ({ id: s.id, ariaName: s.ariaName })),
  renderLabel: (slotDef) => {
    const span = document.createElement("span");
    span.textContent = S1_SLOTS.find((s) => s.id === slotDef.id).text;
    return span;
  },
  getState: () => state.s1.drag,
  feedbackId: "s1-drag",
};

const s5Instance = {
  id: "s5", containerId: "s5-dragdrop",
  tokens: S5_TOKENS, tokenLabel: (key) => S5_TOKEN_LABELS[key], tokenClass: "text-token", slotClass: "text-slot",
  bankAriaLabel: "Karten mit Gründen",
  slots: S5_SLOTS.map((s) => ({ id: s.id, ariaName: s.ariaName })),
  renderLabel: (slotDef) => {
    const definition = S5_SLOTS.find((s) => s.id === slotDef.id);
    return textSqlLabel(definition.label, definition.sql);
  },
  getState: () => state.s5.drag,
  feedbackId: "s5-drag",
};

const s6Instance = {
  id: "s6", containerId: "s6-dragdrop",
  tokens: S6_TOKENS, tokenLabel: (key) => S6_TOKEN_LABELS[key], tokenClass: "text-token", slotClass: "text-slot",
  bankAriaLabel: "Karten mit Integritätsbedingungen",
  slots: S6_SLOTS.map((s) => ({ id: s.id, ariaName: s.ariaName })),
  renderLabel: (slotDef) => {
    const definition = S6_SLOTS.find((s) => s.id === slotDef.id);
    return textSqlLabel(definition.label, definition.sql);
  },
  getState: () => state.s6.drag,
  feedbackId: "s6-drag",
};

// ---------------------------------------------------------------------------
// Einheitliche Feedbacklogik für Radio- und Checkbox-Fragen (MC wie
// checkR4F4a/checkR7F7b in Aufgabe 8): leer -> hint; genau richtig -> success
// + markSolved; falsche Option gewählt -> Präfix + Text zur (ersten) falschen
// Option; nur richtige, aber unvollständig -> Teilweise-Text.
// ---------------------------------------------------------------------------
function checkSingleChoice({ name, assign, options, emptyMessage, feedbackId, subtaskId, onSolved }) {
  const value = document.querySelector(`input[name="${name}"]:checked`)?.value ?? "";
  assign(value);
  saveState();
  if (!value) { setFeedback(feedbackId, "hint", emptyMessage); return; }
  const option = options.find((o) => o.id === value);
  if (!option) { setFeedback(feedbackId, "hint", emptyMessage); return; }
  if (option.correct) {
    setFeedback(feedbackId, "success", option.message);
    markSolved(subtaskId);
    onSolved?.();
    return;
  }
  setFeedback(feedbackId, "hint", option.message);
}

function checkChecklist({ name, assign, options, emptyMessage, successMessage, incompleteMessage, feedbackId, subtaskId, onSolved }) {
  const selected = selectedValues(name);
  assign(selected);
  saveState();
  if (!selected.length) { setFeedback(feedbackId, "hint", emptyMessage); return; }
  const correctIds = options.filter((o) => o.correct).map((o) => o.id);
  const isExact = correctIds.length === selected.length && correctIds.every((id) => selected.includes(id));
  if (isExact) {
    setFeedback(feedbackId, "success", successMessage);
    markSolved(subtaskId);
    onSolved?.();
    return;
  }
  const wrongChosen = options.find((o) => !o.correct && selected.includes(o.id));
  if (wrongChosen) {
    const hasCorrect = selected.some((id) => correctIds.includes(id));
    setFeedback(feedbackId, hasCorrect ? "partial" : "hint", `${hasCorrect ? "Teilweise korrekt:" : "Noch nicht korrekt:"} ${wrongChosen.message}`);
    return;
  }
  const message = typeof incompleteMessage === "function" ? incompleteMessage(selected, correctIds) : incompleteMessage;
  setFeedback(feedbackId, "partial", message);
}

// ---------------------------------------------------------------------------
// Schritt 1
// ---------------------------------------------------------------------------
function maybeRevealS1Merke() {
  if (["s1-drag", "s1-f1b"].every(isSolved)) document.getElementById("s1-merke").hidden = false;
}
function checkS1Drag() {
  const dragState = state.s1.drag;
  const ids = [1, 2, 3, 4];
  const assignedEntries = ids.map((id) => [id, dragState[id]]).filter(([, v]) => v);
  if (!assignedEntries.length) { setFeedback("s1-drag", "hint", "Noch nicht korrekt: Ziehe zuerst jeden Befehl in das Feld einer Situation."); return; }
  const k = assignedEntries.filter(([id, v]) => S1_CORRECT[id] === v).length;
  if (assignedEntries.length < ids.length) {
    if (k > 0) setFeedback("s1-drag", "partial", `Teilweise korrekt: ${k} ${k === 1 ? "Zuordnung stimmt" : "Zuordnungen stimmen"} schon. Ordne auch die übrigen Befehle zu.`);
    else setFeedback("s1-drag", "hint", "Noch nicht korrekt: SELECT kennst du schon – damit liest man Daten. Übersetze die anderen Befehle ins Deutsche und vergleiche mit den Situationen.");
    return;
  }
  if (k === ids.length) {
    setFeedback("s1-drag", "success", "Richtig: INSERT fügt einen neuen Datensatz ein, SELECT liest Daten, UPDATE ändert vorhandene Daten und DELETE löscht Datensätze.");
    markSolved("s1-drag");
    maybeRevealS1Merke();
    return;
  }
  const prefix = k > 0 ? `Teilweise korrekt: ${k} von 4 Zuordnungen stimmen.` : "Noch nicht korrekt:";
  if ([1, 3, 4].some((id) => dragState[id] === "SELECT")) { setFeedback("s1-drag", k > 0 ? "partial" : "hint", `${prefix} SELECT liest Daten nur. Damit kann man kein Foto hochladen, ändern oder entfernen.`); return; }
  if (dragState[1] === "UPDATE" && dragState[3] === "INSERT") { setFeedback("s1-drag", k > 0 ? "partial" : "hint", `${prefix} Beim Hochladen entsteht ein neuer Datensatz (insert = einfügen). Beim Ändern der Beschreibung bleibt das Foto erhalten, nur ein Wert wird ersetzt (update = aktualisieren).`); return; }
  setFeedback("s1-drag", k > 0 ? "partial" : "hint", `${prefix} Übersetze die Befehle ins Deutsche: insert, update, delete.`);
}
function s1F1bIncomplete(selected, correctIds) {
  const missing = correctIds.filter((id) => !selected.includes(id));
  if (missing.length === 1) {
    return "Teilweise korrekt: Deine Auswahl stimmt, es fehlt aber noch ein Befehl. Überlege bei jeder Situation: Ist danach etwas gespeichert, ersetzt oder gelöscht?";
  }
  return "Teilweise korrekt: Deine Auswahl stimmt, es fehlen aber noch zwei Befehle. Überlege bei jeder Situation: Ist danach etwas gespeichert, ersetzt oder gelöscht?";
}
function checkS1F1b() {
  checkChecklist({
    name: "s1-f1b", assign: (v) => { state.s1.f1b = v; }, options: S1_F1B_OPTIONS,
    emptyMessage: "Noch nicht korrekt: Kreuze mindestens einen Befehl an.",
    successMessage: "Richtig: INSERT, UPDATE und DELETE verändern den Datenbestand. SELECT liest nur – danach sind die Daten genau wie vorher.",
    incompleteMessage: s1F1bIncomplete,
    feedbackId: "s1-f1b", subtaskId: "s1-f1b", onSolved: maybeRevealS1Merke,
  });
}

// ---------------------------------------------------------------------------
// Schritte 2–4: Simulation von UPDATE, DELETE, INSERT auf users_photos
// ---------------------------------------------------------------------------
function computeStatusLabel(status) {
  if (status === "changed") return { text: "geändert", cls: "conflict" };
  if (status === "deleted") return { text: "gelöscht", cls: "deleted" };
  if (status === "new") return { text: "neu", cls: "new" };
  return { text: "unverändert", cls: "" };
}
function renderUsersPhotosTable(containerId, executed, resultRows) {
  const rows = executed ? resultRows : USERS_PHOTOS_START;
  const caption = `users_photos · ${executed ? "nach" : "vor"} der Anweisung`;
  const bodyHtml = rows.map((row) => {
    const isDeleted = executed && row.status === "deleted";
    const statusInfo = executed ? computeStatusLabel(row.status) : { text: "—", cls: "" };
    const cells = ["name", "username", "url", "description"].map((column) => {
      const value = row[column];
      const changed = executed && row.changedColumns?.includes(column);
      let content;
      if (value === null || value === undefined) content = '<span class="unknown-value">NULL</span>';
      else if (column === "description") content = escapeHtml(truncateDescription(value, 60));
      else if (column === "url") content = `<span class="url-cell">${escapeHtml(value)}</span>`;
      else content = escapeHtml(value);
      return `<td${changed ? ' class="cell-changed"' : ""}>${content}</td>`;
    }).join("");
    const statusCell = `<td><span class="row-status ${statusInfo.cls}">${escapeHtml(statusInfo.text)}</span></td>`;
    return `<tr${isDeleted ? ' class="row-deleted"' : ""}>${cells}${statusCell}</tr>`;
  }).join("");
  document.getElementById(containerId).innerHTML = `<div class="table-shell">
    <div class="table-caption" aria-hidden="true">${escapeHtml(caption)}</div>
    <div class="table-scroll" tabindex="0" role="region" aria-label="Tabelle users_photos">
      <table class="data-table">
        <caption class="sr-only">${escapeHtml(caption)}</caption>
        <thead><tr><th scope="col">name</th><th scope="col">username</th><th scope="col">url</th><th scope="col">description</th><th scope="col">Status</th></tr></thead>
        <tbody>${bodyHtml}</tbody>
      </table>
    </div>
  </div>`;
}
function updateExecutionStatus(id, executed, executedText) {
  document.getElementById(id).textContent = executed ? executedText : "Die Tabelle zeigt den Zustand vor der Anweisung.";
}
function updateExecuteButton(id, executed) {
  const button = document.getElementById(id);
  button.textContent = executed ? "Vorher anzeigen" : "Anweisung ausführen";
  button.setAttribute("aria-pressed", String(executed));
}

function renderS2() {
  renderUsersPhotosTable("s2-table", state.s2.executed, UPDATE_RESULT);
  const changedCount = UPDATE_RESULT.filter((r) => r.status === "changed").length;
  updateExecutionStatus("s2-status", state.s2.executed, `Anweisung ausgeführt: ${changedCount} ${changedCount === 1 ? "Zeile" : "Zeilen"} geändert.`);
  updateExecuteButton("s2-execute", state.s2.executed);
}
function renderS3() {
  renderUsersPhotosTable("s3-table", state.s3.executed, DELETE_RESULT);
  const deletedCount = DELETE_RESULT.filter((r) => r.status === "deleted").length;
  updateExecutionStatus("s3-status", state.s3.executed, `Anweisung ausgeführt: ${deletedCount} ${deletedCount === 1 ? "Zeile" : "Zeilen"} gelöscht.`);
  updateExecuteButton("s3-execute", state.s3.executed);
}
function renderS4() {
  renderUsersPhotosTable("s4-table", state.s4.executed, INSERT_RESULT);
  const newCount = INSERT_RESULT.filter((r) => r.status === "new").length;
  updateExecutionStatus("s4-status", state.s4.executed, `Anweisung ausgeführt: ${newCount} ${newCount === 1 ? "Zeile" : "Zeilen"} eingefügt.`);
  updateExecuteButton("s4-execute", state.s4.executed);
}

function maybeRevealS2() { if (["s2-f2a", "s2-f2b"].every(isSolved)) document.getElementById("s2-reveal").hidden = false; }
function maybeRevealS3() { if (["s3-f3a", "s3-f3b"].every(isSolved)) document.getElementById("s3-reveal").hidden = false; }
function maybeRevealS4() { if (["s4-f4a", "s4-f4b"].every(isSolved)) document.getElementById("s4-reveal").hidden = false; }

function checkS2F2a() {
  checkSingleChoice({ name: "s2-f2a", assign: (v) => { state.s2.f2a = v; }, options: S2_F2A_OPTIONS, emptyMessage: "Noch nicht korrekt: Wähle eine Antwort aus.", feedbackId: "s2-f2a", subtaskId: "s2-f2a", onSolved: maybeRevealS2 });
}
function checkS2F2b() {
  checkChecklist({ name: "s2-f2b", assign: (v) => { state.s2.f2b = v; }, options: S2_F2B_OPTIONS, emptyMessage: S2_F2B_EMPTY, successMessage: S2_F2B_SUCCESS, incompleteMessage: S2_F2B_INCOMPLETE, feedbackId: "s2-f2b", subtaskId: "s2-f2b", onSolved: maybeRevealS2 });
}
function checkS3F3a() {
  checkSingleChoice({ name: "s3-f3a", assign: (v) => { state.s3.f3a = v; }, options: S3_F3A_OPTIONS, emptyMessage: "Noch nicht korrekt: Wähle eine Antwort aus.", feedbackId: "s3-f3a", subtaskId: "s3-f3a", onSolved: maybeRevealS3 });
}
function checkS3F3b() {
  checkChecklist({ name: "s3-f3b", assign: (v) => { state.s3.f3b = v; }, options: S3_F3B_OPTIONS, emptyMessage: S3_F3B_EMPTY, successMessage: S3_F3B_SUCCESS, incompleteMessage: S3_F3B_INCOMPLETE, feedbackId: "s3-f3b", subtaskId: "s3-f3b", onSolved: maybeRevealS3 });
}
function checkS4F4a() {
  checkSingleChoice({ name: "s4-f4a", assign: (v) => { state.s4.f4a = v; }, options: S4_F4A_OPTIONS, emptyMessage: "Noch nicht korrekt: Wähle eine Antwort aus.", feedbackId: "s4-f4a", subtaskId: "s4-f4a", onSolved: maybeRevealS4 });
}
function checkS4F4b() {
  checkChecklist({ name: "s4-f4b", assign: (v) => { state.s4.f4b = v; }, options: S4_F4B_OPTIONS, emptyMessage: S4_F4B_EMPTY, successMessage: S4_F4B_SUCCESS, incompleteMessage: s4F4bIncomplete, feedbackId: "s4-f4b", subtaskId: "s4-f4b", onSolved: maybeRevealS4 });
}

// ---------------------------------------------------------------------------
// Schritt 5: Regeln (Integritätsbedingungen entdecken)
// ---------------------------------------------------------------------------
function renderS5Tables() {
  document.getElementById("s5-tables").innerHTML =
    miniTableCard("users", ["id", "name", "username", "birthday"], INSTAHUB_USERS_SPLIT.map((u) => [u.id, u.name, u.username, u.birthday])) +
    miniTableCard("photos", ["id", "user_id", "description"], INSTAHUB_PHOTOS_SPLIT.map((p) => [p.id, p.user_id, truncateDescription(p.description, 60)]), { highlight: [1] });
}
function checkS5Drag() {
  const dragState = state.s5.drag;
  const ids = ["A", "B", "C"];
  const assignedEntries = ids.map((id) => [id, dragState[id]]).filter(([, v]) => v);
  if (!assignedEntries.length) { setFeedback("s5-drag", "hint", "Noch nicht korrekt: Ziehe zu jeder Anweisung einen Grund."); return; }
  const k = assignedEntries.filter(([id, v]) => S5_CORRECT[id] === v).length;
  if (assignedEntries.length < ids.length && k > 0) {
    setFeedback("s5-drag", "partial", `Teilweise korrekt: ${k} ${k === 1 ? "Zuordnung stimmt" : "Zuordnungen stimmen"} schon. Ordne auch den übrigen Anweisungen einen Grund zu.`);
    return;
  }
  if (assignedEntries.length === ids.length && k === ids.length) {
    setFeedback("s5-drag", "success", "Richtig: A verwendet eine id, die in photos schon vergeben ist. B speichert in birthday einen Text, der kein Datum ist. C verweist auf einen Benutzer, den es nicht gibt.");
    markSolved("s5-drag");
    document.getElementById("s5-merke").hidden = false;
    return;
  }
  const hasDistractor = assignedEntries.some(([, v]) => v === "onlySupport");
  if (hasDistractor) {
    const prefix = k > 0 ? `Teilweise korrekt: ${k} von 3 Zuordnungen stimmen.` : "Noch nicht korrekt:";
    setFeedback("s5-drag", k > 0 ? "partial" : "hint", `${prefix} »Nur der Support darf Daten ändern« prüft das Datenbanksystem nicht an den Daten – wer etwas ändern darf, regeln Benutzerrechte. Hier geht es darum, ob die neuen Werte zu den gespeicherten Daten passen.`);
    return;
  }
  if (k > 0) { setFeedback("s5-drag", "partial", `Teilweise korrekt: ${k} von 3 Zuordnungen stimmen. Suche die Werte aus jeder Anweisung in den Tabellen users und photos.`); return; }
  setFeedback("s5-drag", "hint", "Noch nicht korrekt: Vergleiche die Werte in jeder Anweisung mit den Tabellen users und photos und mit den Datentypen im Tabellenschema.");
}
function checkS5F5b() {
  checkChecklist({ name: "s5-f5b", assign: (v) => { state.s5.f5b = v; }, options: S5_F5B_OPTIONS, emptyMessage: S5_F5B_EMPTY, successMessage: S5_F5B_SUCCESS, incompleteMessage: S5_F5B_INCOMPLETE, feedbackId: "s5-f5b", subtaskId: "s5-f5b" });
}

// ---------------------------------------------------------------------------
// Schritt 6: Schule (Integritätsbedingungen anwenden)
// ---------------------------------------------------------------------------
function renderS6Tables() {
  document.getElementById("s6-tables").innerHTML =
    miniTableCard("schueler", ["id", "name"], SCHUELER.map((s) => [s.id, s.name])) +
    miniTableCard("ag", ["id", "name", "plaetze"], AG_MIT_PLAETZEN.map((a) => [a.id, a.name, a.plaetze])) +
    miniTableCard("teilnahme", ["schueler_id", "ag_id"], TEILNAHME.map((t) => [t.schueler_id, t.ag_id]));
}
function checkS6Drag() {
  const dragState = state.s6.drag;
  const ids = [1, 2, 3, 4];
  const assignedEntries = ids.map((id) => [id, dragState[id]]).filter(([, v]) => v);
  if (!assignedEntries.length) { setFeedback("s6-drag", "hint", "Noch nicht korrekt: Ziehe zu jeder Anweisung eine Karte."); return; }
  const k = assignedEntries.filter(([id, v]) => S6_CORRECT[id] === v).length;
  if (assignedEntries.length < ids.length && k > 0) {
    setFeedback("s6-drag", "partial", `Teilweise korrekt: ${k} ${k === 1 ? "Zuordnung stimmt" : "Zuordnungen stimmen"} schon. Ordne auch den übrigen Anweisungen eine Karte zu.`);
    return;
  }
  if (assignedEntries.length === ids.length && k === ids.length) {
    setFeedback("s6-drag", "success", "Richtig: Anweisung 1 verwendet die schon vergebene id 3, Anweisung 2 ist in Ordnung, Anweisung 3 verweist auf die AG 7, die es nicht gibt, und in Anweisung 4 ist »viele« keine ganze Zahl (int).");
    markSolved("s6-drag");
    return;
  }
  const firstWrong = ids.find((id) => dragState[id] !== S6_CORRECT[id]);
  const prefix = k > 0 ? `Teilweise korrekt: ${k} von 4 Zuordnungen stimmen.` : "Noch nicht korrekt.";
  const hints = {
    1: "Prüfe Anweisung 1: Gibt es in ag schon eine AG mit der id 3?",
    2: "Prüfe Anweisung 2: Schüler 2 ist Ben, AG 3 ist der Chor – beide gibt es. Gegen welche Regel sollte die Anweisung dann verstoßen?",
    3: "Prüfe Anweisung 3: Gibt es in ag eine AG mit der id 7? Ein Fremdschlüssel darf nicht auf eine beliebige Zahl zeigen.",
    4: "Prüfe Anweisung 4: Welchen Datentyp hat plaetze im Tabellenschema? Passt »viele« dazu?",
  };
  setFeedback("s6-drag", k > 0 ? "partial" : "hint", `${prefix} ${hints[firstWrong]}`);
}
function checkS6F6b() {
  checkSingleChoice({ name: "s6-f6b", assign: (v) => { state.s6.f6b = v; }, options: S6_F6B_OPTIONS, emptyMessage: "Noch nicht korrekt: Wähle eine Antwort aus.", feedbackId: "s6-f6b", subtaskId: "s6-f6b" });
}

// ---------------------------------------------------------------------------
// Schritt 7: Abschlussquiz
// ---------------------------------------------------------------------------
function renderQuiz() {
  TRANSAKTIONEN_QUIZ.forEach((question, index) => {
    renderCheckboxList(`quiz-q${index + 1}`, `quiz-q${index + 1}`, question.options.map((o) => ({ id: o.id, label: o.text })), state.s7[question.id]);
  });
}
function checkQuiz(event) {
  event.preventDefault();
  TRANSAKTIONEN_QUIZ.forEach((question, index) => { state.s7[question.id] = selectedValues(`quiz-q${index + 1}`); });
  saveState();
  const results = TRANSAKTIONEN_QUIZ.map((question) => evaluateQuizQuestion(question, state.s7[question.id]));
  const correctCount = results.filter(Boolean).length;
  if (correctCount === TRANSAKTIONEN_QUIZ.length) {
    setFeedback("step7", "success", "Richtig: Alle sechs Fragen stimmen. Die Auswertung ist jetzt freigeschaltet.");
    state.summaryUnlocked = true;
    markSolved("s7-quiz");
    saveState();
    setTimeout(() => navigateTo("summary"), 300);
    return;
  }
  const anyEmpty = TRANSAKTIONEN_QUIZ.some((question) => !state.s7[question.id].length);
  if (anyEmpty) { setFeedback("step7", "hint", "Noch nicht korrekt: Beantworte alle sechs Fragen. Bei manchen Fragen sind mehrere Antworten richtig."); return; }
  if (correctCount >= 1) {
    const wrongNumbers = results.map((ok, index) => (ok ? null : index + 1)).filter(Boolean);
    const firstWrong = wrongNumbers[0];
    setFeedback("step7", "partial", `Teilweise korrekt: ${correctCount} von 6 Fragen sind vollständig richtig. Prüfe noch Frage ${wrongNumbers.join(", ")}. Tipp zu Frage ${firstWrong}: ${TRANSAKTIONEN_QUIZ[firstWrong - 1].hint}`);
    return;
  }
  setFeedback("step7", "hint", `Noch nicht korrekt: Keine Frage ist vollständig richtig. Tipp zu Frage 1: ${TRANSAKTIONEN_QUIZ[0].hint}`);
}

// ---------------------------------------------------------------------------
// Navigation, Tabs, Übersicht
// ---------------------------------------------------------------------------
function renderTabs() {
  const tabs = document.getElementById("step-tabs");
  tabs.innerHTML = STEP_TITLES.map((title, index) => {
    const step = index + 1;
    return `<button id="tab-${step}" class="step-tab ${state.completed.includes(step) ? "is-complete" : ""}" type="button" role="tab" aria-controls="step-${step}" aria-selected="${state.currentStep === step}" data-step="${step}"><span>${step}</span><small>${title}</small></button>`;
  }).join("") + `<button id="tab-summary" class="step-tab" type="button" role="tab" aria-controls="step-summary" aria-selected="${state.currentStep === "summary"}" data-step="summary" ${state.summaryUnlocked ? "" : "hidden"}><span>✓</span><small>Auswertung</small></button>`;
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
  const percent = Math.round((state.completed.filter((step) => step >= 1 && step <= 7).length / 7) * 100);
  document.getElementById("progress-bar").style.width = `${percent}%`;
  document.getElementById("progress-percent").textContent = `${percent} % bearbeitet`;
  document.getElementById("progress-label").textContent = state.currentStep === "summary" ? "Abschlussübersicht" : `Schritt ${state.currentStep} von 7`;
  const panel = document.getElementById(`step-${state.currentStep}`);
  if (panel) renderTabFlowNavigation(panel, { items: TAB_ITEMS, currentId: state.currentStep, onNavigate: navigateTo, isEnabled: (id) => (id === "summary" ? state.summaryUnlocked : true) });
}
function renderSummary() {
  const entries = [
    ["1. Datenpflege", "Ordne die SQL-Befehle den Situationen zu. Welche Befehle verändern Daten?", "Foto hochladen – INSERT, Fotos anzeigen – SELECT, Beschreibung ändern – UPDATE, Foto entfernen – DELETE. INSERT, UPDATE und DELETE verändern den Datenbestand."],
    ["2. Namen ändern", "Führe das UPDATE mit WHERE description LIKE '%Park%' aus. Was ist passiert?", "Nur die Zeile des Park-Fotos wurde geändert. Für nelefitmuse stehen jetzt zwei Namen in der Tabelle: UPDATE-Anomalie."],
    ["3. Fotos löschen", "Führe das DELETE mit WHERE name LIKE 'Jannik%' aus. Was ist noch über Jannik gespeichert?", "Nichts mehr: Mit den Fotos wurden auch Name und Benutzername gelöscht: DELETE-Anomalie."],
    ["4. Foto einfügen", "Führe das INSERT ohne name und username aus. Wem gehört das Foto?", "Niemandem: name und username sind NULL. Auch ein Benutzer ohne Foto ließe sich nur mit leeren Zellen speichern: INSERT-Anomalie."],
    ["5. Regeln", "Warum lehnt das Datenbanksystem die Anweisungen A, B und C ab?", "A: id 1001 ist schon vergeben (Entitätsintegrität). B: »Sommer 2008« ist kein Datum (Wertebereichsintegrität). C: Einen Benutzer 999 gibt es nicht (referentielle Integrität)."],
    ["6. Schule", "Gegen welche Integritätsbedingung verstößt jede Anweisung?", "1: Entitätsintegrität, 2: wird ausgeführt, 3: referentielle Integrität, 4: Wertebereichsintegrität. Anweisung 3 würde eine Anmeldung für eine AG speichern, die es nicht gibt."],
    ["7. Abschlussquiz", "Sichere Datenpflege, Anomalien und Integritätsbedingungen.", "Alle sechs Fragen richtig beantwortet."],
  ];
  document.getElementById("answer-summary").innerHTML = entries.map(([title, prompt, result]) => `<section class="summary-section"><h3>${title}</h3><p class="prompt">${prompt}</p><dl class="summary-grid"><dt>Richtiges Ergebnis</dt><dd>${result}</dd></dl></section>`).join("");
}

function restoreInputs() {
  renderCheckboxList("s1-f1b-choices", "s1-f1b", S1_F1B_OPTIONS, state.s1.f1b);
  renderRadioList("s2-f2a-choices", "s2-f2a", S2_F2A_OPTIONS, state.s2.f2a);
  renderCheckboxList("s2-f2b-choices", "s2-f2b", S2_F2B_OPTIONS, state.s2.f2b);
  renderRadioList("s3-f3a-choices", "s3-f3a", S3_F3A_OPTIONS, state.s3.f3a);
  renderCheckboxList("s3-f3b-choices", "s3-f3b", S3_F3B_OPTIONS, state.s3.f3b);
  renderRadioList("s4-f4a-choices", "s4-f4a", S4_F4A_OPTIONS, state.s4.f4a);
  renderCheckboxList("s4-f4b-choices", "s4-f4b", S4_F4B_OPTIONS, state.s4.f4b);
  renderCheckboxList("s5-f5b-choices", "s5-f5b", S5_F5B_OPTIONS, state.s5.f5b);
  renderRadioList("s6-f6b-choices", "s6-f6b", S6_F6B_OPTIONS, state.s6.f6b);
  renderQuiz();

  document.getElementById("s1-merke").hidden = !["s1-drag", "s1-f1b"].every(isSolved);
  document.getElementById("s2-reveal").hidden = !["s2-f2a", "s2-f2b"].every(isSolved);
  document.getElementById("s3-reveal").hidden = !["s3-f3a", "s3-f3b"].every(isSolved);
  document.getElementById("s4-reveal").hidden = !["s4-f4a", "s4-f4b"].every(isSolved);
  document.getElementById("s5-merke").hidden = !isSolved("s5-drag");
}

function bindEvents() {
  document.getElementById("check-s1-drag").addEventListener("click", checkS1Drag);
  document.getElementById("check-s1-f1b").addEventListener("click", checkS1F1b);
  document.getElementById("s2-execute").addEventListener("click", () => { state.s2.executed = !state.s2.executed; saveState(); renderS2(); });
  document.getElementById("check-s2-f2a").addEventListener("click", checkS2F2a);
  document.getElementById("check-s2-f2b").addEventListener("click", checkS2F2b);
  document.getElementById("s3-execute").addEventListener("click", () => { state.s3.executed = !state.s3.executed; saveState(); renderS3(); });
  document.getElementById("check-s3-f3a").addEventListener("click", checkS3F3a);
  document.getElementById("check-s3-f3b").addEventListener("click", checkS3F3b);
  document.getElementById("s4-execute").addEventListener("click", () => { state.s4.executed = !state.s4.executed; saveState(); renderS4(); });
  document.getElementById("check-s4-f4a").addEventListener("click", checkS4F4a);
  document.getElementById("check-s4-f4b").addEventListener("click", checkS4F4b);
  document.getElementById("check-s5-drag").addEventListener("click", checkS5Drag);
  document.getElementById("check-s5-f5b").addEventListener("click", checkS5F5b);
  document.getElementById("check-s6-drag").addEventListener("click", checkS6Drag);
  document.getElementById("check-s6-f6b").addEventListener("click", checkS6F6b);
  document.getElementById("final-quiz").addEventListener("submit", checkQuiz);
  document.getElementById("print-summary").addEventListener("click", () => window.print());
  document.getElementById("reset-module").addEventListener("click", () => {
    if (window.confirm("Möchtest du alle Eingaben und den Fortschritt zurücksetzen?")) { localStorage.removeItem(STORAGE_KEY); window.location.reload(); }
  });

  // Radio-/Checkbox-Gruppen: Jede Änderung übernimmt den Wert sofort in den
  // State, speichert und löscht nur die zugehörige Rückmeldung (nicht erst
  // beim Klick auf Prüfen), siehe manifest-allgemein.txt Abschnitt 2.
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

  bindCheckboxGroup("s1-f1b", (v) => { state.s1.f1b = v; }, "s1-f1b");
  bindRadioGroup("s2-f2a", (v) => { state.s2.f2a = v; }, "s2-f2a");
  bindCheckboxGroup("s2-f2b", (v) => { state.s2.f2b = v; }, "s2-f2b");
  bindRadioGroup("s3-f3a", (v) => { state.s3.f3a = v; }, "s3-f3a");
  bindCheckboxGroup("s3-f3b", (v) => { state.s3.f3b = v; }, "s3-f3b");
  bindRadioGroup("s4-f4a", (v) => { state.s4.f4a = v; }, "s4-f4a");
  bindCheckboxGroup("s4-f4b", (v) => { state.s4.f4b = v; }, "s4-f4b");
  bindCheckboxGroup("s5-f5b", (v) => { state.s5.f5b = v; }, "s5-f5b");
  bindRadioGroup("s6-f6b", (v) => { state.s6.f6b = v; }, "s6-f6b");
  TRANSAKTIONEN_QUIZ.forEach((question, index) => {
    bindCheckboxGroup(`quiz-q${index + 1}`, (v) => { state.s7[question.id] = v; }, "step7");
  });
}

function init() {
  renderDragDrop(s1Instance);
  renderS2();
  renderS3();
  renderS4();
  renderS5Tables();
  renderDragDrop(s5Instance);
  renderS6Tables();
  renderDragDrop(s6Instance);
  restoreInputs();
  renderTabs();
  bindEvents();
  navigateTo(state.currentStep);
  updateNavigation();
}

document.addEventListener("DOMContentLoaded", init);
