import { enableTokenDrag, wasDragged } from "../../../physik/klasse-11/1-Kreisbewegungen/components/token-drag.mjs";
import { evaluateSemanticAnswer } from "./perzeptron/ui/semantic-answer.mjs?v=20261010-scaleway";

// Wiederholungs-Quiz zu Aufgabe 3a: nicht verlinkte Seite, jede Aufgabe mit eigenem Prüfen-Button.
// Eigenständig aufgebaut (Vorlage: Physik 11, aufgabe3-quiz.mjs), damit der Test ohne Reste
// wieder entfernt werden kann. Löschanleitung: aufgabe3a-quiz-loeschen.txt.
const STORAGE_KEY = "informatik11-kuenstliche-intelligenz-aufgabe3a-test-v1";
const SCRIPT_SERVER_URL = "https://unterrichtkiichezbn4-ki-auswertung.functions.fnc.fr-par.scw.cloud/";
const DESCRIBE_MIN_LENGTH = 30;

// Aufgaben 4 bis 6: Beschreibe-Aufgaben, bewertet über den Skriptserver.
const DESCRIBE_TASKS = [
  {
    id: "aepfel",
    number: 4,
    title: "Informationsgewinn bestimmen",
    taskId: "inf11-a3a-quiz-informationsgewinn-beschreibung",
    maxPoints: 4,
    prompt: "Bestimme den Informationsgewinn, wenn 10 Trainingsäpfel (6 reif, 4 unreif) nach der Farbe aufgeteilt werden: rot – 5 reif, 1 unreif; grün – 1 reif, 3 unreif.",
  },
  {
    id: "attributwahl",
    number: 5,
    title: "Das beste Attribut auswählen",
    taskId: "inf11-a3a-quiz-attributwahl-beschreibung",
    maxPoints: 3,
    prompt: "Erkläre, warum „eine Teilmenge mit möglichst vielen feindseligen Fischen“ kein passendes Auswahlkriterium ist, und beschreibe, wie das Attribut stattdessen ausgewählt wird.",
  },
  {
    id: "vorgehen",
    number: 6,
    title: "Nach dem ersten Knoten",
    taskId: "inf11-a3a-quiz-vorgehen-beschreibung",
    maxPoints: 4,
    prompt: "Beschreibe, wie du nach dem ersten Knoten weiter vorgehst, bis der Entscheidungsbaum fertig ist.",
  },
];
const DESCRIBE_MAX_POINTS = DESCRIBE_TASKS.reduce((sum, task) => sum + task.maxPoints, 0);

// Aufgabe 1: Lückentext mit Wortkarten, Bedienung über die vorhandene Komponente token-drag.mjs.
// Reihenfolge der Karten bewusst gemischt, damit sie nicht die Lösungsreihenfolge verrät.
const CLOZE_TERMS = [
  { key: "Blatt", reason: "Eine reine Teilmenge braucht keinen weiteren Split. Dort steht ein Blatt mit dem gemeinsamen Label." },
  { key: "wiederholt", reason: "Für jede noch gemischte Teilmenge werden die Informationsgewinne neu bestimmt und wieder das beste Attribut gewählt." },
  { key: "Fehlklassifikationen", reason: "Daten, deren Label nicht zur Vorhersage ihrer Teilmenge passt, werden falsch eingeordnet. Sie sind Fehlklassifikationen." },
  { key: "kleinsten", reason: "Ein kleiner Informationsgewinn bedeutet, dass das Attribut die Fehler kaum verringert. Gesucht ist deshalb der größte Informationsgewinn." },
  { key: "Attributwerten", reason: "Jeder Attributwert, etwa Blau oder Orange, bildet einen Ast. Die Daten mit diesem Wert bilden die zugehörige Teilmenge." },
  { key: "häufigere", reason: "Der Knoten sagt das Label voraus, das in seiner Teilmenge am häufigsten vorkommt. So entstehen möglichst wenige Fehler." },
  { key: "Entscheidungsknoten", reason: "Ein Entscheidungsknoten prüft ein Attribut und teilt die Daten weiter auf. Bei einer reinen Teilmenge ist das nicht mehr nötig." },
  { key: "größten", reason: "Der Informationsgewinn gibt an, um wie viel ein Split die Fehler verringert. Je größer er ist, desto besser trennt das Attribut die Daten." },
];
const CLOZE_SOLUTION = ["häufigere", "Fehlklassifikationen", "größten", "Attributwerten", "Blatt", "wiederholt"];
const CLOZE_PARTS = [
  "Ein Knoten sagt für seine Teilmenge das ",
  " Label voraus. Alle Daten mit dem anderen Label sind ",
  ". Als Knoten wird das Attribut mit dem ",
  " Informationsgewinn gewählt. Nach seinen ",
  " werden die Daten in Teilmengen aufgeteilt. Haben alle Daten einer Teilmenge dasselbe Label, entsteht dort ein ",
  ". Sonst wird das Verfahren für diese Teilmenge ",
  ".",
];
const CLOZE_SLOTS = CLOZE_SOLUTION.map((_, index) => `gap-${index}`);

// Aufgabe 2: Teilmengen eines Fisch-Entscheidungsbaums einordnen.
const SORT_ZONES = [
  { id: "leaf-peaceful", label: "Blatt: friedlich" },
  { id: "leaf-hostile", label: "Blatt: feindselig" },
  { id: "split", label: "weiter aufteilen" },
];
const SORT_VALUES = [
  { key: "pure-peaceful", label: "3 friedlich, 0 feindselig", zone: "leaf-peaceful", reason: "Alle drei Fische sind friedlich. Die Teilmenge ist rein, also entsteht ein Blatt mit dem Label friedlich." },
  { key: "mixed-split-2", label: "3 friedlich, 2 feindselig – ein unbenutztes Attribut trennt sie fehlerfrei", zone: "split", reason: "Mit dem Mehrheitslabel friedlich blieben 2 Fehler. Das unbenutzte Attribut senkt sie auf 0 (Informationsgewinn 2), deshalb wird weiter aufgeteilt." },
  { key: "pure-hostile", label: "0 friedlich, 4 feindselig", zone: "leaf-hostile", reason: "Alle vier Fische sind feindselig. Die Teilmenge ist rein, also entsteht ein Blatt mit dem Label feindselig." },
  { key: "used-hostile", label: "1 friedlich, 3 feindselig – alle Attribute sind schon verwendet", zone: "leaf-hostile", reason: "Es ist keine Aufteilung mehr möglich. Dann entsteht ein Blatt mit dem häufigeren Label feindselig; ein Fehler bleibt bestehen." },
  { key: "mixed-split-1", label: "1 friedlich, 2 feindselig – ein unbenutztes Attribut hat Informationsgewinn 1", zone: "split", reason: "Die Teilmenge ist gemischt, und das Attribut senkt die Fehler von 1 auf 0. Ein Blatt würde einen vermeidbaren Fehler behalten." },
  { key: "pure-unused", label: "0 friedlich, 2 feindselig – es gibt noch unbenutzte Attribute", zone: "leaf-hostile", reason: "Die Teilmenge ist schon rein. Ein weiterer Split kann keinen Fehler mehr beseitigen, auch wenn noch Attribute übrig sind." },
  { key: "used-peaceful", label: "4 friedlich, 1 feindselig – alle Attribute sind schon verwendet", zone: "leaf-peaceful", reason: "Es ist keine Aufteilung mehr möglich. Dann entsteht ein Blatt mit dem häufigeren Label friedlich; ein Fehler bleibt bestehen." },
  { key: "mixed-tie", label: "2 friedlich, 2 feindselig – ein unbenutztes Attribut hat Informationsgewinn 2", zone: "split", reason: "Vorher gibt es 2 Fehler, nach dem Split keine mehr. Die Teilmenge wird also weiter aufgeteilt." },
];

// Aufgabe 3: Multiple Choice mit Auswahlkästchen; Frage 2 bis 4 beziehen sich auf die E-Mail-Tabelle.
const MC_QUESTIONS = [
  {
    id: "q1",
    text: "Ein Attribut teilt 8 Fische (4 friedlich, 4 feindselig) in zwei Teilmengen: A mit 3 friedlichen und 1 feindseligen Fisch, B mit 1 friedlichen und 3 feindseligen Fischen. Welche Aussagen sind richtig?",
    why: "In jeder Teilmenge zählt die kleinere Gruppe als Fehler: A 1, B 1, zusammen 2. Vorher waren es 4 Fehler, also beträgt der Informationsgewinn 4 − 2 = 2.",
    options: [
      { id: "label", text: "Teilmenge A bekommt das Label friedlich.", correct: true },
      { id: "after", text: "Nach dem Aufteilen gibt es insgesamt 2 Fehlklassifikationen.", correct: true },
      { id: "majority", text: "Nach dem Aufteilen gibt es insgesamt 6 Fehlklassifikationen.", reason: "3 + 3 zählt die Mehrheit in jeder Teilmenge. Diese Fische werden aber richtig eingeordnet; Fehler ist nur die kleinere Gruppe." },
      { id: "gain", text: "Der Informationsgewinn beträgt 4.", reason: "4 ist die Fehlerzahl vor dem Aufteilen. Der Informationsgewinn ist die Differenz aus Fehlern vorher und nachher: 4 − 2 = 2." },
    ],
  },
  {
    id: "q2",
    text: "Betrachte die E-Mail-Daten in der Tabelle. Welche Aussagen sind richtig?",
    why: "Ohne Split sagt der Baum „kein Spam“ voraus, die 4 Spam-Mails sind Fehler. Betreff: 1 + 1 = 2 Fehler, Informationsgewinn 4 − 2 = 2. Link: 3 + 1 = 4 Fehler, Informationsgewinn 0.",
    options: [
      { id: "before", text: "Vor dem Aufteilen gibt es 4 Fehlklassifikationen.", correct: true },
      { id: "before-majority", text: "Vor dem Aufteilen gibt es 6 Fehlklassifikationen.", reason: "Die 6 Mails ohne Spam sind die Mehrheit und werden richtig eingeordnet. Fehler sind nur die 4 Spam-Mails." },
      { id: "subject", text: "Beim Attribut „Betreff in Großbuchstaben“ beträgt der Informationsgewinn 2.", correct: true },
      { id: "link", text: "Das Attribut „enthält Link“ verringert die Zahl der Fehler nicht.", correct: true },
    ],
  },
  {
    id: "q3",
    text: "Welches Attribut wird für die Wurzel des E-Mail-Baums gewählt? Welche Aussagen sind richtig?",
    why: "„Absender bekannt“ führt zu 0 + 1 = 1 Fehler, also zum Informationsgewinn 4 − 1 = 3. Das ist mehr als bei „Betreff in Großbuchstaben“ (2) und „enthält Link“ (0).",
    options: [
      { id: "gain", text: "„Absender bekannt“, weil es mit 3 den größten Informationsgewinn hat.", correct: true },
      { id: "errors", text: "„Absender bekannt“, weil danach nur noch 1 Fehler übrig bleibt.", correct: true },
      { id: "majority", text: "„Betreff in Großbuchstaben“, weil bei „ja“ die Spam-Mails in der Mehrheit sind.", reason: "Dass eine Teilmenge mehrheitlich Spam ist, reicht nicht. Entscheidend sind die Fehler in allen Teilmengen zusammen: „Betreff“ hat den Informationsgewinn 2, „Absender bekannt“ 3." },
      { id: "guess", text: "„enthält Link“, weil Links typisch für Spam sind.", reason: "Gewählt wird nicht nach Vermutungen, sondern nach den Trainingsdaten. „enthält Link“ senkt dort die Fehler gar nicht (Informationsgewinn 0)." },
    ],
  },
  {
    id: "q4",
    text: "Die Wurzel des E-Mail-Baums ist „Absender bekannt“. Welche Aussagen zum weiteren Aufbau sind richtig?",
    why: "Bei „ja“ sind alle 5 Mails kein Spam: Dort entsteht ein Blatt. Die Teilmenge „nein“ ist gemischt (4 Spam, 1 kein Spam). Für diese 5 Mails werden die Informationsgewinne der übrigen Attribute neu bestimmt.",
    options: [
      { id: "leaf", text: "Der Ast „ja“ endet in einem Blatt mit dem Label kein Spam.", correct: true },
      { id: "recompute", text: "Für die Teilmenge „nein“ werden die Informationsgewinne der übrigen Attribute neu bestimmt.", correct: true },
      { id: "reuse", text: "Für die Teilmenge „nein“ gelten die Informationsgewinne aus der Tabelle weiter, deshalb wird dort „Betreff in Großbuchstaben“ gewählt.", reason: "Die Tabelle beschreibt alle 10 Mails. In der Teilmenge „nein“ liegen nur 5 davon; für sie müssen die Informationsgewinne neu berechnet werden." },
      { id: "split-pure", text: "Auch der Ast „ja“ muss noch nach einem weiteren Attribut aufgeteilt werden.", reason: "Die Teilmenge „ja“ ist rein. Ein weiterer Split kann dort keinen Fehler mehr beseitigen, deshalb entsteht ein Blatt." },
    ],
  },
  {
    id: "q5",
    text: "In einer Teilmenge erreichen zwei Attribute denselben, größten Informationsgewinn. Welche Aussagen sind richtig?",
    why: "Bei einem Gleichstand ist nach diesem Kriterium keines der beiden Attribute besser. Man wählt eines davon; beide Bäume sind fachlich korrekt.",
    options: [
      { id: "equal", text: "Beide Attribute sind nach diesem Kriterium gleich gut geeignet.", correct: true },
      { id: "either", text: "Es darf eines der beiden gewählt werden; beide Bäume sind fachlich korrekt.", correct: true },
      { id: "leaf", text: "Bei einem Gleichstand wird sofort ein Blatt eingesetzt.", reason: "Ein Blatt entsteht nur, wenn die Teilmenge rein ist oder keine sinnvolle Aufteilung mehr möglich ist. Ein Gleichstand ändert daran nichts." },
      { id: "zero", text: "Bei einem Gleichstand beträgt der Informationsgewinn beider Attribute 0.", reason: "Gleichstand heißt nur, dass beide Werte gleich groß sind. Bei den blauen Fischen hatten Muster und Bauchfarbe beide den Informationsgewinn 1." },
    ],
  },
];

const MAX_POINTS = { cloze: CLOZE_SOLUTION.length, sort: SORT_VALUES.length, mc: MC_QUESTIONS.length };
const LOCAL_POINTS = Object.values(MAX_POINTS).reduce((sum, value) => sum + value, 0);
const TOTAL_POINTS = LOCAL_POINTS + DESCRIBE_MAX_POINTS;
const TASK_COUNT = 3 + DESCRIBE_TASKS.length;
const LOCAL_TASKS = [
  { id: "cloze", number: 1, title: "Vom Datensatz zum Baum" },
  { id: "sort", number: 2, title: "Blatt oder weiter aufteilen?" },
  { id: "mc", number: 3, title: "Multiple Choice" },
];

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
    if (isPlainObject(saved.cloze)) Object.entries(saved.cloze).forEach(([key, slot]) => { if (clozeKeys.includes(key) && CLOZE_SLOTS.includes(slot)) fresh.cloze[key] = slot; });
    if (isPlainObject(saved.sort)) Object.entries(saved.sort).forEach(([key, zone]) => { if (SORT_VALUES.some((value) => value.key === key) && sortZones.includes(zone)) fresh.sort[key] = zone; });
    MC_QUESTIONS.forEach((question) => {
      const chosen = saved.mc?.[question.id];
      if (Array.isArray(chosen)) fresh.mc[question.id] = chosen.filter((id) => question.options.some((option) => option.id === id));
    });
    DESCRIBE_TASKS.forEach((task) => {
      if (typeof saved.texts?.[task.id] === "string") fresh.texts[task.id] = saved.texts[task.id];
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
      const ai = saved.ai?.[task.id];
      if (isPlainObject(ai) && Number.isFinite(ai.points) && typeof saved.aiText?.[task.id] === "string") {
        fresh.ai[task.id] = ai;
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

// Klassen der vorhandenen Rückmeldungsbox dt-feedback (entscheidungbaeume/styles.css);
// "notice" (neutraler Hinweis ohne Wertung) steht in aufgabe3a-quiz.css.
const FEEDBACK_CLASS = { success: "success", partial: "incomplete", error: "wrong", "": "notice" };

/**
 * Rückmeldung unter einer Aufgabe (Muster dt-feedback aus den Modulen).
 * status: "success", "partial", "error" oder "" für einen neutralen Hinweis.
 * parts: Texte oder fertige Knoten, leere Einträge entfallen.
 */
function setFeedback(box, status, parts) {
  box.className = `dt-feedback ${FEEDBACK_CLASS[status]}`;
  box.replaceChildren();
  parts.filter(Boolean).forEach((part) => box.append(typeof part === "string" ? element("p", "", part) : part));
  box.hidden = false;
}

function reasonList(entries) {
  const list = element("ul", "feedback-reasons");
  entries.forEach((entry) => list.append(element("li", "", entry)));
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
      const node = element("span", `${className} is-locked${markClass}`, labelOf(key));
      if (mark) node.append(resultMark(mark === "correct"));
      return node;
    }
    const node = element("button", `${className}${markClass}`, labelOf(key));
    node.type = "button";
    node.dataset.key = key;
    if (mark) node.append(resultMark(mark === "correct"));
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

function termReason(key) { return CLOZE_TERMS.find((term) => term.key === key)?.reason || ""; }

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
    sentence.append(part);
    if (index >= CLOZE_SLOTS.length) return;
    const slot = CLOZE_SLOTS[index];
    const key = byGap[slot];
    const attached = /^\S/.test(CLOZE_PARTS[index + 1]);
    if (key) {
      const mark = state.checked.cloze ? (key === CLOZE_SOLUTION[index] ? "correct" : "wrong") : "";
      const gap = target(card(key, `cloze-gap is-filled${attached ? " is-attached" : ""}`, mark), slot);
      gap.setAttribute("aria-label", `Lücke ${index + 1}: ${key}${mark ? (mark === "correct" ? ", richtig" : ", falsch") : ""}`);
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
  const grid = element("div", "subset-zones");
  SORT_ZONES.forEach((zone) => {
    const box = target(element("div", `subset-zone is-${zone.id}`), zone.id);
    box.setAttribute("role", "group");
    box.setAttribute("aria-label", zone.label);
    const label = element(locked ? "span" : "button", "subset-zone-label");
    label.append(element("strong", "", zone.label));
    if (!locked) {
      label.type = "button";
      label.append(element("small", "", picked ? "hier ablegen" : ""));
      label.setAttribute("aria-label", `${zone.label}${picked ? ": ausgewählte Karte hier ablegen" : ""}`);
    }
    box.append(label);
    const list = element("div", "subset-zone-items");
    SORT_VALUES.filter((value) => assignment[value.key] === zone.id).forEach((value) => {
      const mark = state.checked.sort ? (value.zone === zone.id ? "correct" : "wrong") : "";
      list.append(card(value.key, "cloze-token subset-card", mark));
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
  if (!wrong.length) { setFeedback(box, "success", ["Korrekt: Alle Lücken sind richtig ausgefüllt."]); return; }
  setFeedback(box, points ? "partial" : "error", [
    points ? `Teilweise korrekt: ${points} von ${rows.length} Lücken ${points === 1 ? "stimmt" : "stimmen"}.` : "Noch nicht korrekt: Keine Lücke stimmt.",
    reasonList(wrong.map((row) => `„${row.chosen}“ passt nicht in Lücke ${row.index + 1}. ${CLOZE_SOLUTION.includes(row.chosen) ? "Der Begriff gehört in eine andere Lücke." : termReason(row.chosen)}`)),
    "Verschiebe die mit ✗ markierten Karten und prüfe erneut.",
  ]);
}

function showSortFeedback() {
  const box = document.getElementById("subset-sort-feedback");
  const rows = scoreSort();
  const wrong = rows.filter((row) => !row.correct);
  const points = rows.length - wrong.length;
  if (!wrong.length) { setFeedback(box, "success", ["Korrekt: Alle Karten sind richtig zugeordnet."]); return; }
  setFeedback(box, points ? "partial" : "error", [
    points ? `Teilweise korrekt: ${points} von ${rows.length} Karten ${points === 1 ? "ist" : "sind"} richtig zugeordnet.` : "Noch nicht korrekt: Keine Karte ist richtig zugeordnet.",
    reasonList(wrong.map((row) => `„${row.value.label}“ gehört nicht zu „${zoneLabel(row.chosen)}“. ${row.value.reason}`)),
    "Verschiebe die mit ✗ markierten Karten und prüfe erneut.",
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
  const box = document.getElementById("subset-sort-feedback");
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
  if (result.exact) { setFeedback(box, "success", [`Korrekt. ${question.why}`]); return; }
  setFeedback(box, result.hits ? "partial" : "error", [
    result.hits ? "Teilweise korrekt." : "Noch nicht korrekt.",
    result.wrong.length ? reasonList(result.wrong.map((option) => `„${option.text}“ stimmt nicht. ${option.reason}`)) : "",
    result.missing ? "Es fehlt noch mindestens eine richtige Aussage." : "",
  ]);
}

// Multiple Choice mit Prüfen-Button je Frage.
function mcQuestion(question, index) {
  const solved = mcSolved(question);
  const fieldset = element("fieldset", "quiz-question");
  fieldset.id = `mc-${question.id}`;
  const legend = element("legend", "", `Frage ${index + 1} · ${question.text}`);
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
      saveState();
      updateProgress();
    });
    label.append(input, element("span", "quiz-option-text", option.text));
    options.append(label);
  });
  const button = element("button", "dt-primary-button direct-check-button", "Antwort prüfen");
  button.type = "button";
  button.hidden = solved;
  const feedback = element("div", "dt-feedback");
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
    focusFeedback(fieldset.querySelector(".dt-feedback"));
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
  box.classList.remove("error");
  box.dataset.status = "";
  if (pending) {
    box.replaceChildren(element("p", "", "Deine Antwort wird mit dem Erwartungshorizont verglichen …"));
  } else if (describeErrors[task.id]) {
    box.classList.add("error");
    box.replaceChildren(element("p", "", `Die Antwort konnte gerade nicht automatisch bewertet werden (${describeErrors[task.id]}). Versuche es in einem Moment noch einmal.`));
  } else if (ai) {
    box.dataset.status = ai.status || "";
    box.replaceChildren(element("h4", "", `${ai.status}: ${ai.points} von ${ai.maxPoints} Aspekten erkannt.`));
    [["Das ist dir gelungen:", ai.strengths, "Noch kein Aspekt wurde eindeutig erkannt."], ["Das fehlt noch:", ai.missing, "Es fehlen keine wesentlichen Aspekte."]].forEach(([title, entries, fallback]) => {
      box.append(element("h4", "", title));
      const list = document.createElement("ul");
      (entries?.length ? entries : [fallback]).forEach((entry) => list.append(element("li", "", entry)));
      box.append(list);
    });
    if (ai.feedback) box.append(element("p", "", ai.feedback));
    if (!solved) box.append(element("p", "", "Ergänze deine Antwort und prüfe sie erneut."));
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
    box.classList.remove("error");
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
    const result = await evaluateSemanticAnswer({ serverUrl: SCRIPT_SERVER_URL, taskId: task.taskId, answer: text.trim() });
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
  textarea.addEventListener("input", () => { state.texts[task.id] = textarea.value; updateCounter(); saveState(); updateProgress(); });
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
  document.getElementById("check-subset-sort").hidden = sortSolved();
  document.querySelector("[data-help='term-cloze']").hidden = clozeSolved();
  document.querySelector("[data-help='subset-sort']").hidden = sortSolved();
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
      onChange: () => { state.checked.cloze = false; },
    }),
    sort: setupBoard({
      root: document.getElementById("subset-sort"),
      rootSelector: "#subset-sort",
      items: SORT_VALUES.map((value) => ({ key: value.key, label: value.label })),
      assignment: state.sort,
      capacity: () => Infinity,
      layout: sortLayout,
      isLocked: sortSolved,
      onChange: () => { state.checked.sort = false; },
    }),
  };
  document.getElementById("check-term-cloze").addEventListener("click", checkCloze);
  document.getElementById("check-subset-sort").addEventListener("click", checkSort);
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
