import { enableTabKeyboardNavigation, focusTabPanelStart, renderTabFlowNavigation, syncTabSemantics } from './tab-navigation.mjs?v=20260906a';

const STORAGE_KEY = "informatik10-datenbanken-grundlagen-v1";
const STEP_TITLES = ["Relation", "Klasse → Tabelle", "Datentypen", "Primärschlüssel", "Schema lesen", "Abschlussquiz"];
const TOTAL_STEPS = STEP_TITLES.length;
const TAB_ITEMS = [...STEP_TITLES.map((label, index) => ({ id: index + 1, label })), { id: "summary", label: "Übersicht" }];

const DEFAULT_STATE = {
  currentStep: 1,
  completed: [],
  summaryUnlocked: false,
  step1: "",
  step2: ["", "", ""],
  step3: ["", "", "", ""],
  step4: "",
  step5: ["", "", ""],
  step6: { q1: [], q2: [], q3: [], q4: [] },
  explain: "",
};

let state = loadState();

function clone(value) { return JSON.parse(JSON.stringify(value)); }

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return saved
      ? { ...clone(DEFAULT_STATE), ...saved, step6: { ...clone(DEFAULT_STATE.step6), ...saved.step6 } }
      : clone(DEFAULT_STATE);
  } catch {
    return clone(DEFAULT_STATE);
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* Fortschritt bleibt nur für diese Sitzung sichtbar. */
  }
}

function esc(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function normalize(value) { return String(value ?? "").trim().toLowerCase(); }
function normalizeType(value) { return String(value ?? "").replace(/\s+/g, "").toLowerCase().replace(/\(.*/, ""); }

const EXPLAIN_TEXT = {
  table: "Die ganze Tabelle entspricht der Klasse Lehrkraft.",
  column: "Eine Spalte entspricht einem Attribut, zum Beispiel Vorname.",
  row: "Eine Zeile – auch Datensatz genannt – entspricht einem Objekt, also einer konkreten Lehrkraft.",
};

const STEP1_LABELS = {
  family: "Die Verwandtschaft zwischen zwei Personen.",
  table: "Eine strukturierte Datentabelle mit Spalten und Zeilen.",
  folder: "Der Ordner, in dem die Datenbankdatei liegt.",
};

const STEP4_LABELS = {
  firstname: "Vorname",
  email: "E-Mail-Adresse",
  number: "Personalnummer (fortlaufend und eindeutig vergeben)",
};

const STEP2_ACCEPTED = [["tabelle", "relation"], ["spalte"], ["zeile", "datensatz", "tupel"]];
const STEP2_HINTS = [
  "Eine Klasse beschreibt viele gleichartige Objekte – ihr Name steht in der Tabellenüberschrift.",
  "Ein Attribut beschreibt eine Eigenschaft. Sieh dir an, wo diese Eigenschaften in der Tabelle stehen.",
  "Ein Objekt ist eine konkrete Lehrkraft. Prüfe, wo alle Werte einer Lehrkraft gemeinsam stehen.",
];

const STEP3_ACCEPTED = [["varchar"], ["integer", "int"], ["char"], ["date"]];
const STEP3_HINTS = [
  "Ein Vorname ist unterschiedlich lang – dafür gibt es einen Typ mit variabler Länge.",
  "42 ist eine ganze Zahl ohne Nachkommastellen.",
  "Ein einzelner Buchstabe hat immer genau die Länge 1.",
  "Das Format YYYY-MM-DD verrät den Datentyp.",
];

const STEP5_ACCEPTED = [["videospiel"], ["spiel_id"], ["100"]];
const STEP5_HINTS = [
  "Der Name der Relation steht direkt hinter CREATE TABLE.",
  "Suche die Zeile mit PRIMARY KEY.",
  "Die Zahl in den Klammern hinter VARCHAR gibt die Maximallänge an.",
];

const STEP6_CORRECT = {
  q1: ["structured", "columns", "row"],
  q2: ["unique", "notnull", "identifies"],
  q3: ["date"],
  q4: ["row"],
};

const Q1_LABELS = {
  structured: "Sie ist eine strukturierte Tabelle.",
  columns: "Ihre Spalten legen fest, welche Eigenschaften gespeichert werden.",
  row: "Jede Zeile enthält einen Datensatz.",
  "single-row": "Sie kann immer nur eine einzige Zeile speichern.",
};
const Q2_LABELS = {
  unique: "Sein Wert kommt in der Spalte nur einmal vor (UNIQUE).",
  notnull: "Er darf nie leer sein (NOT NULL).",
  identifies: "Er identifiziert jeden Datensatz eindeutig.",
  repeat: "Er darf sich beliebig oft wiederholen.",
};
const Q3_LABELS = { integer: "INTEGER", char1: "CHAR(1)", date: "DATE", primarykey: "PRIMARY KEY" };
const Q4_LABELS = {
  row: "In einer Zeile, also einem Datensatz.",
  column: "In einer Spalte.",
  table: "In einer eigenen Tabelle.",
  tablename: "Im Tabellennamen.",
};

function setFeedback(step, kind, message) {
  const element = document.getElementById(`feedback-step${step}`);
  element.className = `feedback ${kind}`;
  element.textContent = message;
}
function clearFeedback(step) { setFeedback(step, "", ""); }

function markComplete(step) {
  if (!state.completed.includes(step)) state.completed.push(step);
  saveState();
  renderTabs();
  updateNavigation();
}

function applyGapValidity(ids, correctFlags) {
  ids.forEach((id, index) => {
    const el = document.getElementById(id);
    if (!el) return;
    const hasValue = el.value.trim() !== "";
    const isCorrect = correctFlags[index];
    el.classList.toggle("is-correct", isCorrect);
    el.classList.toggle("is-wrong", hasValue && !isCorrect);
    if (hasValue && !isCorrect) el.setAttribute("aria-invalid", "true");
    else el.removeAttribute("aria-invalid");
  });
}

function bindGapInput(id, step, index) {
  const el = document.getElementById(id);
  if (!el) return;
  el.addEventListener("input", () => {
    state[`step${step}`][index] = el.value;
    el.classList.remove("is-correct", "is-wrong");
    el.removeAttribute("aria-invalid");
    clearFeedback(step);
    saveState();
  });
  el.addEventListener("keydown", (event) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    CHECKERS[step]();
  });
}

function setExplain(type, button) {
  state.explain = type;
  saveState();
  const output = document.getElementById("table-explainer");
  if (output) output.textContent = EXPLAIN_TEXT[type];
  const table = document.querySelector(".explain-table");
  if (table) {
    table.classList.remove("is-table", "is-column", "is-row");
    table.classList.add(`is-${type}`);
  }
  document.querySelectorAll(".explain-button[data-explain]").forEach((btn) => {
    btn.setAttribute("aria-pressed", String(btn === button));
  });
}

function bindExplainButtons() {
  document.querySelectorAll(".explain-button[data-explain]").forEach((button) => {
    const type = button.dataset.explain;
    const handler = () => setExplain(type, button);
    button.addEventListener("click", handler);
    button.addEventListener("focus", handler);
    button.addEventListener("mouseenter", handler);
  });
  if (state.explain) {
    const initial = document.querySelector(`.explain-button[data-explain="${state.explain}"]`);
    if (initial) setExplain(state.explain, initial);
  }
}

function bindStep1() {
  document.querySelectorAll('input[name="relation"]').forEach((input) => {
    input.addEventListener("change", () => { state.step1 = input.value; clearFeedback(1); saveState(); });
  });
  document.getElementById("check-step1").addEventListener("click", checkStep1);
}

function bindStep4() {
  document.querySelectorAll('input[name="primary-key"]').forEach((input) => {
    input.addEventListener("change", () => { state.step4 = input.value; clearFeedback(4); saveState(); });
  });
  document.getElementById("check-step4").addEventListener("click", checkStep4);
}

function selectedValues(name) {
  return [...document.querySelectorAll(`input[name="${name}"]:checked`)].map((input) => input.value);
}

function bindStep6() {
  document.querySelectorAll('#final-quiz input[type="checkbox"]').forEach((input) => {
    input.addEventListener("change", () => {
      state.step6[input.name] = selectedValues(input.name);
      clearFeedback(6);
      saveState();
    });
  });
  document.getElementById("final-quiz").addEventListener("submit", checkStep6);
}

function applyStoredState() {
  if (state.step1) {
    const input = document.querySelector(`input[name="relation"][value="${state.step1}"]`);
    if (input) input.checked = true;
  }
  ["gap-2-1", "gap-2-2", "gap-2-3"].forEach((id, index) => {
    const el = document.getElementById(id);
    if (el) el.value = state.step2[index] ?? "";
  });
  ["gap-3-1", "gap-3-2", "gap-3-3", "gap-3-4"].forEach((id, index) => {
    const el = document.getElementById(id);
    if (el) el.value = state.step3[index] ?? "";
  });
  if (state.step4) {
    const input = document.querySelector(`input[name="primary-key"][value="${state.step4}"]`);
    if (input) input.checked = true;
  }
  ["gap-5-1", "gap-5-2", "gap-5-3"].forEach((id, index) => {
    const el = document.getElementById(id);
    if (el) el.value = state.step5[index] ?? "";
  });
  Object.entries(state.step6).forEach(([name, values]) => {
    values.forEach((value) => {
      const input = document.querySelector(`input[name="${name}"][value="${value}"]`);
      if (input) input.checked = true;
    });
  });
}

function checkStep1() {
  if (state.step1 === "table") {
    setFeedback(1, "success", "Richtig: Eine Relation ist eine strukturierte Tabelle mit Spalten und Zeilen.");
    markComplete(1);
  } else if (!state.step1) {
    setFeedback(1, "hint", "Noch nicht korrekt: Wähle zuerst eine Aussage aus.");
  } else if (state.step1 === "family") {
    setFeedback(1, "hint", "Noch nicht korrekt: Gemeint ist keine Beziehung zwischen Personen, sondern die Struktur, in der die Daten liegen. Lies den ersten Absatz noch einmal.");
  } else {
    setFeedback(1, "hint", "Noch nicht korrekt: Gemeint ist nicht der Speicherort, sondern die Art, wie die Daten angeordnet sind.");
  }
  saveState();
}

function checkStep2() {
  const values = state.step2.map(normalize);
  const correctFlags = values.map((value, index) => STEP2_ACCEPTED[index].includes(value));
  applyGapValidity(["gap-2-1", "gap-2-2", "gap-2-3"], correctFlags);
  const correctCount = correctFlags.filter(Boolean).length;
  if (correctCount === 3) {
    setFeedback(2, "success", "Richtig: Klasse → Tabelle, Attribut → Spalte, Objekt → Zeile (Datensatz).");
    markComplete(2);
  } else if (correctCount > 0) {
    const hintIndex = correctFlags.findIndex((flag) => !flag);
    setFeedback(2, "partial", `Teilweise korrekt: ${correctCount} von 3 Begriffen stimmen. ${STEP2_HINTS[hintIndex]}`);
  } else {
    setFeedback(2, "hint", "Noch nicht korrekt: Wähle in der Tabelle Überschrift, Spalte und Zeile aus – die Erklärungen nennen dir die gesuchten Begriffe.");
  }
  saveState();
}

function checkStep3() {
  const values = state.step3.map(normalizeType);
  const correctFlags = values.map((value, index) => STEP3_ACCEPTED[index].includes(value));
  applyGapValidity(["gap-3-1", "gap-3-2", "gap-3-3", "gap-3-4"], correctFlags);
  const correctCount = correctFlags.filter(Boolean).length;
  if (correctCount === 4) {
    setFeedback(3, "success", "Richtig: Text → VARCHAR, ganze Zahlen → INTEGER, genau ein Zeichen → CHAR, Datumsangaben → DATE.");
    markComplete(3);
  } else if (correctCount > 0) {
    const hintIndex = correctFlags.findIndex((flag) => !flag);
    setFeedback(3, "partial", `Teilweise korrekt: ${correctCount} von 4 Zuordnungen stimmen. ${STEP3_HINTS[hintIndex]}`);
  } else {
    setFeedback(3, "hint", "Noch nicht korrekt: Lies die vier Beschreibungen oberhalb der Aufgabe und prüfe, ob der Wert Text, eine Zahl, ein einzelnes Zeichen oder ein Datum ist.");
  }
  saveState();
}

function checkStep4() {
  if (state.step4 === "number") {
    setFeedback(4, "success", "Richtig: Eine Personalnummer wird eigens vergeben, ist eindeutig (UNIQUE) und nie leer (NOT NULL).");
    markComplete(4);
  } else if (!state.step4) {
    setFeedback(4, "hint", "Noch nicht korrekt: Wähle zuerst eine Antwort aus.");
  } else if (state.step4 === "firstname") {
    setFeedback(4, "hint", "Noch nicht korrekt: Vornamen kommen mehrfach vor – damit wäre die Regel UNIQUE verletzt.");
  } else {
    setFeedback(4, "hint", "Noch nicht korrekt: Eine E-Mail-Adresse kann sich ändern oder ganz fehlen – NOT NULL ist dann nicht sicher erfüllt.");
  }
  saveState();
}

function checkStep5() {
  const values = state.step5.map(normalize);
  const correctFlags = values.map((value, index) => STEP5_ACCEPTED[index].includes(value));
  applyGapValidity(["gap-5-1", "gap-5-2", "gap-5-3"], correctFlags);
  const correctCount = correctFlags.filter(Boolean).length;
  if (correctCount === 3) {
    setFeedback(5, "success", "Richtig: Die Relation heißt Videospiel, Spiel_ID ist der Primärschlüssel und Titel fasst höchstens 100 Zeichen.");
    markComplete(5);
  } else if (correctCount > 0) {
    const hintIndex = correctFlags.findIndex((flag) => !flag);
    setFeedback(5, "partial", `Teilweise korrekt: ${correctCount} von 3 Angaben stimmen. ${STEP5_HINTS[hintIndex]}`);
  } else {
    setFeedback(5, "hint", "Noch nicht korrekt: Gehe den Code Zeile für Zeile durch – Name, PRIMARY KEY und die Zahl hinter VARCHAR.");
  }
  saveState();
}

function sameSet(a, b) {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((value, index) => value === sortedB[index]);
}

function checkStep6(event) {
  event.preventDefault();
  const names = Object.keys(STEP6_CORRECT);
  names.forEach((name) => { state.step6[name] = selectedValues(name); });
  const results = names.map((name) => sameSet(state.step6[name], STEP6_CORRECT[name]));
  const correctCount = results.filter(Boolean).length;
  if (correctCount === 4) {
    setFeedback(6, "success", "Richtig: Alle vier Fragen stimmen. Der Reiter „Übersicht“ ist jetzt freigeschaltet.");
    state.summaryUnlocked = true;
    markComplete(6);
    saveState();
    renderTabs();
    updateNavigation();
    renderSummary();
    setTimeout(() => navigateTo("summary"), 300);
  } else if (correctCount > 0) {
    const wrongNumbers = results.map((ok, index) => (ok ? null : index + 1)).filter(Boolean);
    setFeedback(6, "partial", `Teilweise korrekt: ${correctCount} von 4 Fragen sind vollständig richtig. Prüfe noch Frage ${wrongNumbers.join(", ")}. Deine Antworten bleiben gespeichert.`);
  } else {
    setFeedback(6, "hint", "Noch nicht korrekt: Kreuze bei jeder Frage alle zutreffenden Antworten an – bei zwei Fragen sind es mehrere.");
  }
  saveState();
}

const CHECKERS = { 1: checkStep1, 2: checkStep2, 3: checkStep3, 4: checkStep4, 5: checkStep5 };

function unlockSolution(event, expectedCode, downloadLinkId, messageId) {
  event.preventDefault();
  const enteredCode = event.currentTarget.elements["solution-code"].value.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const downloadLink = document.getElementById(downloadLinkId);
  const message = document.getElementById(messageId);
  if (enteredCode === expectedCode.replace(/[^A-Z0-9]/g, "")) {
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

function renderTabs() {
  const tabs = document.getElementById("step-tabs");
  tabs.innerHTML = STEP_TITLES.map((title, index) => {
    const step = index + 1;
    return `<button id="tab-${step}" class="step-tab ${state.completed.includes(step) ? "is-complete" : ""}" type="button" role="tab" aria-controls="step-${step}" aria-selected="${state.currentStep === step}" data-step="${step}"><span>${step}</span><small>${title}</small></button>`;
  }).join("") + `<button id="tab-summary" class="step-tab" type="button" role="tab" aria-controls="step-summary" aria-selected="${state.currentStep === "summary"}" data-step="summary" ${state.summaryUnlocked ? "" : "hidden"}><span>✓</span><small>Übersicht</small></button>`;
  tabs.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => navigateTo(button.dataset.step === "summary" ? "summary" : Number(button.dataset.step)));
  });
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
  const panel = document.getElementById(step === "summary" ? "step-summary" : `step-${step}`);
  syncTabSemantics(document.getElementById("step-tabs"), state.currentStep);
  if (focusContent) focusTabPanelStart(panel);
  else window.scrollTo({ top: 0, behavior: "smooth" });
}

function updateNavigation() {
  const completedCount = state.completed.filter((step) => step >= 1 && step <= TOTAL_STEPS).length;
  const percent = Math.round((completedCount / TOTAL_STEPS) * 100);
  document.getElementById("progress-bar").style.width = `${percent}%`;
  document.getElementById("progress-percent").textContent = `${percent} % bearbeitet`;
  document.getElementById("progress-label").textContent = state.currentStep === "summary" ? "Abschlussübersicht" : `Schritt ${state.currentStep} von ${TOTAL_STEPS}`;
  const panel = document.getElementById(state.currentStep === "summary" ? "step-summary" : `step-${state.currentStep}`);
  renderTabFlowNavigation(panel, {
    items: TAB_ITEMS,
    currentId: state.currentStep,
    onNavigate: navigateTo,
    isEnabled: (id) => (id === "summary" ? state.summaryUnlocked : true),
  });
}

function formatGapAnswer(values) {
  const hasAny = values.some((value) => normalize(value));
  if (!hasAny) return "Noch keine Eingabe";
  return values.map((value) => (normalize(value) ? value : "(leer)")).join(" · ");
}

function formatQuizAnswer() {
  const allEmpty = ["q1", "q2", "q3", "q4"].every((key) => state.step6[key].length === 0);
  if (allEmpty) return "Noch keine Eingabe";
  const parts = [
    `Frage 1: ${state.step6.q1.map((value) => Q1_LABELS[value]).join(", ") || "keine Auswahl"}`,
    `Frage 2: ${state.step6.q2.map((value) => Q2_LABELS[value]).join(", ") || "keine Auswahl"}`,
    `Frage 3: ${state.step6.q3.map((value) => Q3_LABELS[value]).join(", ") || "keine Auswahl"}`,
    `Frage 4: ${state.step6.q4.map((value) => Q4_LABELS[value]).join(", ") || "keine Auswahl"}`,
  ];
  return parts.join(" | ");
}

function completionBadge(step) {
  return state.completed.includes(step)
    ? '<span class="summary-result complete">✓ bearbeitet</span>'
    : '<span class="summary-result open">noch offen</span>';
}

function summarySection(step, title, prompt, answer, result) {
  return `<section class="summary-section"><h3>${step} – ${esc(title)} ${completionBadge(step)}</h3><p class="prompt">${esc(prompt)}</p><dl class="summary-grid"><dt>Deine Antwort</dt><dd>${esc(answer)}</dd><dt>Richtiges Ergebnis</dt><dd>${esc(result)}</dd></dl></section>`;
}

function renderSummary() {
  const sections = [
    summarySection(1, "Das digitale Archiv", "Was ist mit dem Fachbegriff „Relation“ gemeint?", STEP1_LABELS[state.step1] || "Noch keine Eingabe", "Eine strukturierte Datentabelle mit Spalten und Zeilen."),
    summarySection(2, "Von Java in die Datenbank", "Übertrage Klasse, Attribut und Objekt in die Datenbanksprache.", formatGapAnswer(state.step2), "Klasse → Tabelle, Attribut → Spalte, Objekt → Zeile (Datensatz)."),
    summarySection(3, "SQL-Datentypen", "Ordne den Beispielwerten die passenden SQL-Datentypen zu.", formatGapAnswer(state.step3), "„Anna-Maria“ → VARCHAR(n), 42 → INTEGER, „w“ → CHAR(n), '2008-05-12' → DATE."),
    summarySection(4, "Der Primärschlüssel", "Welches Attribut eignet sich am besten als Primärschlüssel?", STEP4_LABELS[state.step4] || "Noch keine Eingabe", "Die Personalnummer: eindeutig (UNIQUE) und nie leer (NOT NULL)."),
    summarySection(5, "Schema lesen", "Lies Relationsname, Primärschlüssel und Maximallänge aus dem CREATE-TABLE-Schema ab.", formatGapAnswer(state.step5), "Videospiel, Spiel_ID, 100 Zeichen."),
    summarySection(6, "Abschlussquiz", "Kreuze alle richtigen Aussagen an.", formatQuizAnswer(), "Relation = Tabelle mit Spalten und Zeilen; Primärschlüssel ist UNIQUE und NOT NULL; '2008-05-12' → DATE; ein Objekt steht in einer Zeile."),
  ];
  document.getElementById("answer-summary").innerHTML = sections.join("");
}

function bindGlobalEvents() {
  document.getElementById("print-summary").addEventListener("click", () => window.print());
  document.getElementById("reset-module").addEventListener("click", () => {
    if (!window.confirm("Möchtest du wirklich alle Eingaben dieses Lernmoduls löschen?")) return;
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  });
}

function init() {
  applyStoredState();
  bindStep1();
  bindExplainButtons();
  bindGapInput("gap-2-1", 2, 0);
  bindGapInput("gap-2-2", 2, 1);
  bindGapInput("gap-2-3", 2, 2);
  document.getElementById("check-step2").addEventListener("click", checkStep2);
  bindGapInput("gap-3-1", 3, 0);
  bindGapInput("gap-3-2", 3, 1);
  bindGapInput("gap-3-3", 3, 2);
  bindGapInput("gap-3-4", 3, 3);
  document.getElementById("check-step3").addEventListener("click", checkStep3);
  bindStep4();
  bindGapInput("gap-5-1", 5, 0);
  bindGapInput("gap-5-2", 5, 1);
  bindGapInput("gap-5-3", 5, 2);
  document.getElementById("check-step5").addEventListener("click", checkStep5);
  bindStep6();
  bindGlobalEvents();
  if (state.currentStep === "summary" && !state.summaryUnlocked) state.currentStep = 1;
  renderTabs();
  navigateTo(state.currentStep);
}

if (typeof document !== "undefined") document.addEventListener("DOMContentLoaded", init);
