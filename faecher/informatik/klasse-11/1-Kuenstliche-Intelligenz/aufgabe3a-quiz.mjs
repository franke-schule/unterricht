import { enableTokenDrag, wasDragged } from "../../../physik/klasse-11/1-Kreisbewegungen/components/token-drag.mjs";
import { evaluateSemanticAnswer } from "./perzeptron/ui/semantic-answer.mjs";

// Wiederholungs-Quiz zu Aufgabe 3a: nicht verlinkte Seite, Auswertung erst nach der Abgabe.
// Eigenständig aufgebaut (Vorlage: Physik 11, aufgabe3-quiz.mjs), damit der Test ohne Reste
// wieder entfernt werden kann. Löschanleitung: aufgabe3a-quiz-loeschen.txt.
const STORAGE_KEY = "informatik11-kuenstliche-intelligenz-aufgabe3a-test-v1";
const SCRIPT_SERVER_URL = "https://script.google.com/macros/s/AKfycby8RWL6uYrKZyoJ6m2GRpWyRmXjwsdskyCiqzKpRhIK5-wrDl-9lWWk8CiAGaVMoy0x/exec";
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
    shortHint: "Vor dem Aufteilen sagt der Baum „reif“ voraus, die 4 unreifen Äpfel sind Fehler. Rot: Mehrheit reif, 1 Fehler; grün: Mehrheit unreif, 1 Fehler; zusammen 2 Fehler. Informationsgewinn = 4 − 2 = 2.",
  },
  {
    id: "attributwahl",
    number: 5,
    title: "Das beste Attribut auswählen",
    taskId: "inf11-a3a-quiz-attributwahl-beschreibung",
    maxPoints: 3,
    prompt: "Erkläre, warum „eine Teilmenge mit möglichst vielen feindseligen Fischen“ kein passendes Auswahlkriterium ist, und beschreibe, wie das Attribut stattdessen ausgewählt wird.",
    shortHint: "Eine einzelne Teilmenge zeigt nicht, wie gut das Attribut die Daten insgesamt trennt. Für jedes Attribut werden die Fehler aller Teilmengen addiert und der Informationsgewinn = Fehler vorher − Fehler nachher bestimmt. Gewählt wird das Attribut mit dem größten Informationsgewinn.",
  },
  {
    id: "vorgehen",
    number: 6,
    title: "Nach dem ersten Knoten",
    taskId: "inf11-a3a-quiz-vorgehen-beschreibung",
    maxPoints: 4,
    prompt: "Beschreibe, wie du nach dem ersten Knoten weiter vorgehst, bis der Entscheidungsbaum fertig ist.",
    shortHint: "Die Daten werden nach den Attributwerten in Teilmengen aufgeteilt. Ist eine Teilmenge rein, entsteht ein Blatt mit ihrem Label. Sonst werden für sie die Informationsgewinne neu bestimmt, das beste Attribut wird der nächste Knoten, und das Verfahren wiederholt sich, bis alle Äste in Blättern enden.",
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
    evaluationSection("Aufgabe 1 · Vom Datensatz zum Baum", `${clozePoints} von ${MAX_POINTS.cloze} Punkten`, clozePoints === MAX_POINTS.cloze,
      "Lückentext zu Mehrheitslabel, Fehlklassifikation, Informationsgewinn, Blatt und Wiederholung des Verfahrens.",
      resultList(cloze.map((row) => ({
        ok: row.correct,
        text: row.correct
          ? `Lücke ${row.index + 1}: ${row.chosen}`
          : `Lücke ${row.index + 1}: deine Antwort „${row.chosen || "leer"}“, richtig ist „${CLOZE_SOLUTION[row.index]}“.`,
        why: row.correct ? "" : [row.chosen && !CLOZE_SOLUTION.includes(row.chosen) ? termReason(row.chosen) : "", termReason(CLOZE_SOLUTION[row.index])].filter(Boolean).join(" "),
      })))),
    evaluationSection("Aufgabe 2 · Blatt oder weiter aufteilen?", `${sortPoints} von ${MAX_POINTS.sort} Punkten`, sortPoints === MAX_POINTS.sort,
      "Entsteht bei der Teilmenge ein Blatt, und mit welchem Label, oder wird weiter aufgeteilt?",
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
  const box = element("div", "fish-semantic-feedback describe-evaluation");
  const answer = answerOf(task);
  const ai = state.ai[task.id];
  box.dataset.status = ai?.status || "";
  box.append(element("p", "describe-answer", answer ? `Deine Antwort: ${answer}` : "Deine Antwort: (leer)"));
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
