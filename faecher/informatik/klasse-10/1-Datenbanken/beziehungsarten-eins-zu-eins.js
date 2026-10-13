import { enableTabKeyboardNavigation, focusTabPanelStart, renderTabFlowNavigation, syncTabSemantics } from './tab-navigation.mjs?v=20261001a';
import { normalizeCardinality, evaluateCardinalityPair, evaluateQuizQuestion,
  SCHUELER, AG, TEILNAHME, SCHUELER_VERSUCH, INSTAHUB_USERS, INSTAHUB_PHOTOS,
  INSTAHUB_LIKES, INSTAHUB_FOLLOWS, R4_CLOZES, r4ClozeGapIds, evaluateCloze,
  KLASSE, KLASSENLEITER, KLASSE_LEITER_LOESUNG, KLASSE_LEITER_ID_VERWECHSLUNG,
  evaluateSchluesselSchlossAnswer, BEZIEHUNGSARTEN_QUIZ_8, BEZIEHUNGSARTEN_QUIZ_10
} from './beziehungsarten-daten.mjs?v=20261013';
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
const STORAGE_KEY="informatik10-datenbanken-aufgabe10-v1";
const STEP_TITLES=["1:1 entdecken","1:1 umsetzen","Übersicht","Abschlussquiz"];
const SUMMARY_STEP=3,QUIZ_STEP=4,QUIZ=BEZIEHUNGSARTEN_QUIZ_10,QUIZ_SOLVED="r4-quiz";
const QUIZ_SUCCESS="Richtig: Alle vier Fragen stimmen. Die Übersicht ist jetzt verfügbar.";
const STEP_SUBTASKS={1:["r1-drag","r1-f1a","r1-f1b","r1-cardinality"],2:["r2-schema","r2-cardinality","r2-schluessel-schema","r2-unique"],4:["r4-quiz"]};
const ALL_SUBTASK_IDS=Object.values(STEP_SUBTASKS).flat();
const KUERZEL=["SEI","BRA","KOH"];
function emptyDefaultState(){return {
 currentStep:1,completed:[],summaryUnlocked:false,solved:[],download:{quiz:false,summary:false},
 r1:{drag:{1:"",2:"",3:""},f1a:"",f1b:"",klasse:"",klassenleiter:""},
 r2:{schema:[],schluesselA:"",schluesselB:"",schemaTextA:"",schemaTextB:"",unique:[]},
 quiz:Object.fromEntries(QUIZ.map(q=>[q.id,[]]))
};}
function sanitizeState(raw){
 const s=emptyDefaultState();if(!raw||typeof raw!=="object")return s;
 s.currentStep=Number.isInteger(raw.currentStep)&&raw.currentStep>=1&&raw.currentStep<=4?raw.currentStep:1;
 s.summaryUnlocked=raw.summaryUnlocked===true;if(s.currentStep===3&&!s.summaryUnlocked)s.currentStep=1;
 s.solved=sanitizeArray(raw.solved,ALL_SUBTASK_IDS);
 s.completed=sanitizeArray(raw.completed,[1,2,4]).filter(n=>STEP_SUBTASKS[n].every(id=>s.solved.includes(id)));
 s.download={quiz:raw.download?.quiz===true,summary:raw.download?.summary===true};
 for(const id of [1,2,3])s.r1.drag[id]=sanitizeChoice(raw.r1?.drag?.[id],KUERZEL);
 s.r1.f1a=sanitizeChoice(raw.r1?.f1a,R1_F1A_OPTIONS.map(o=>o.id));
 s.r1.f1b=sanitizeChoice(raw.r1?.f1b,R1_F1B_OPTIONS.map(o=>o.id));
 for(const key of ["klasse","klassenleiter"])s.r1[key]=sanitizeCardinalityInput(raw.r1?.[key]);
 s.r2.schema=sanitizeArray(raw.r2?.schema,R2_SCHEMA_OPTIONS.map(o=>o.id));
 for(const key of ["schluesselA","schluesselB"])s.r2[key]=sanitizeCardinalityInput(raw.r2?.[key]);
 for(const key of ["schemaTextA","schemaTextB"])s.r2[key]=sanitizeText(raw.r2?.[key],2000);
 s.r2.unique=sanitizeArray(raw.r2?.unique,["only-once","both-tables","relation-table"]);
 for(const q of QUIZ)s.quiz[q.id]=sanitizeArray(raw.quiz?.[q.id],q.options.map(o=>o.id));
 return s;
}
function loadState(){try{return sanitizeState(JSON.parse(localStorage.getItem(STORAGE_KEY)));}catch{return emptyDefaultState();}}
let state=loadState();
function saveState(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch{
 const status=document.getElementById("data-status");status.hidden=false;status.textContent="Hinweis: Deine Eingaben können in diesem Browser nicht dauerhaft gespeichert werden.";
}}
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
function sanitizeText(value, maxLength) {
  return typeof value === "string" ? value.slice(0, maxLength) : "";
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

function miniTableCard(title, columns, rows, { highlight = [], captionText } = {}) {
  const head = columns.map((column, index) => `<th scope="col"${highlight.includes(index) ? ' class="link-column"' : ""}>${escapeHtml(column)}</th>`).join("");
  const body = rows.map((row) => `<tr>${row.map((cell, index) => `<td${highlight.includes(index) ? ' class="link-column"' : ""}>${cell === null ? '<span class="unknown-value">?</span>' : escapeHtml(cell)}</td>`).join("")}</tr>`).join("");
  return `<section class="mini-table-card"><h3>${escapeHtml(title)}</h3><table><caption class="sr-only">${escapeHtml(captionText ?? `${title} – Tabellenauszug`)}</caption><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></section>`;
}

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
  if (state.r1.f1a === "one") { setFeedback("r1-f1a", "success", "Richtig: In den Beispielzeilen kommt jede id aus klasse in der Spalte klasse_id genau einmal vor. Jede Klasse hat hier genau einen Klassenleiter."); markSolved("r1-f1a"); }
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
    if (selected.length === 1) setFeedback("r2-schema", "hint", "Noch nicht korrekt: In Schema C steht die Verbindung doppelt. Das ist Redundanz wie in Aufgabe 2: Beide Verweise können sich widersprechen. Ein Speicherort reicht; die Eindeutigkeit muss zusätzlich gelten.");
    else setFeedback("r2-schema", "partial", "Teilweise korrekt: Schema C ist nicht richtig. Dort steht die Verbindung doppelt: Verweist klasse 1 auf Klassenleiter 3, Klassenleiter 3 aber auf klasse 2, widersprechen sich die Daten – wie bei den Redundanzen aus Aufgabe 2.");
    return;
  }
  if (sameSet(selected, ["A", "B"])) {
    setFeedback("r2-schema", "success", "Richtig: Schema A und B zeigen mögliche Speicherorte. Der Verweis steht an zulässiger Stelle; die Eindeutigkeit ist vorausgesetzt.");
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
  state.r2.schemaTextA = document.getElementById("r2-schema-text-a").value;
  state.r2.schemaTextB = document.getElementById("r2-schema-text-b").value;
  saveState();
  const result = evaluateSchluesselSchlossAnswer(state.r2.schemaTextA, state.r2.schemaTextB);
  setFeedback("r2-schluessel-schema", result.status, result.message);
  if (result.status === "success") markSolved("r2-schluessel-schema");
}

const UNIQUE_OPTIONS=[
 {id:"only-once",label:"Jeder Partner darf nur einmal zugeordnet sein.",correct:true},
 {id:"both-tables",label:"Der Fremdschlüssel muss in beiden Tabellen stehen.",correct:false},
 {id:"relation-table",label:"Eine Beziehungstabelle mit zwei Fremdschlüsseln ist nötig.",correct:false}
];
function checkUnique(){
 state.r2.unique=selectedValues("r2-unique");saveState();
 const correct=state.r2.unique.includes("only-once"),wrong=state.r2.unique.some(id=>id!=="only-once");
 const kind=correct&&!wrong?"success":correct?"partial":"hint";
 setFeedback("r2-unique",kind,kind==="success"?"Richtig: Ein Fremdschlüssel speichert den Verweis; die eindeutige Zuordnung muss außerdem gelten.":kind==="partial"?"Teilweise korrekt: Der Speicherort stimmt. Prüfe, ob derselbe Fremdschlüsselwert mehrfach vorkommen könnte.":"Noch nicht korrekt: Ein Fremdschlüssel allein verhindert keine zwei Verweise auf dieselbe Klasse oder dasselbe Schloss.");
 if(kind==="success")markSolved("r2-unique");
}
function renderQuiz() {
  QUIZ.forEach((question,index) => renderCheckboxList(`quiz-q${index+1}`, `quiz-q${index+1}`, question.options.map((o)=>({id:o.id,label:o.text})), state.quiz[question.id]));
}
function checkQuiz(event) {
  event.preventDefault();
  QUIZ.forEach((q,i)=> { state.quiz[q.id]=selectedValues(`quiz-q${i+1}`); });
  saveState();
  const results=QUIZ.map(q=>evaluateQuizQuestion(q,state.quiz[q.id]));
  const correctCount=results.filter(Boolean).length;
  if(correctCount===QUIZ.length) {
    setFeedback("step"+QUIZ_STEP,"success", QUIZ_SUCCESS);
    state.summaryUnlocked=true; markSolved(QUIZ_SOLVED); saveState(); renderTabs();
    setTimeout(()=>navigateTo(SUMMARY_STEP),300); return;
  }
  const firstWrong=results.findIndex(ok=>!ok);
  setFeedback("step"+QUIZ_STEP, correctCount ? "partial":"hint",
    `${correctCount ? "Teilweise korrekt:" : "Noch nicht korrekt:"} ${correctCount} von ${QUIZ.length} Fragen stimmen. ${QUIZ[firstWrong].hint}`);
}
function bindQuiz() {
  document.getElementById("final-quiz").addEventListener("submit",checkQuiz);
  window.addQuizQuestionChecks?.({
    questions: QUIZ.map((q,i)=>({fieldset:document.getElementById(`quiz-q${i+1}`)?.closest("fieldset"),solution:q.options.filter(o=>o.correct).map(o=>o.id),hint:q.hint})),
    buttonClass:"primary-button",rowClass:"action-row",levels:{high:"success",medium:"partial",low:"hint"},
    onAllCorrect:()=>document.getElementById("final-quiz").requestSubmit()
  });
  QUIZ.forEach((q,i)=>document.querySelectorAll(`input[name="quiz-q${i+1}"]`).forEach(input=>input.addEventListener("change",()=>{
    state.quiz[q.id]=selectedValues(`quiz-q${i+1}`); saveState(); clearFeedback("step"+QUIZ_STEP);
  })));
}
function renderTabs() {
  const tabs=document.getElementById("step-tabs");
  tabs.innerHTML=STEP_TITLES.map((title,index)=>{
    const step=index+1;
    return `<button id="tab-${step}" class="step-tab ${state.completed.includes(step)?"is-complete":""}" type="button" role="tab" aria-controls="step-${step}" aria-selected="${state.currentStep===step}" data-step="${step}" ${step===SUMMARY_STEP&&!state.summaryUnlocked?"hidden":""}><span>${step}</span><small>${title}</small></button>`;
  }).join("");
  tabs.querySelectorAll("button").forEach(b=>b.addEventListener("click",()=>navigateTo(Number(b.dataset.step))));
  enableTabKeyboardNavigation(tabs); syncTabSemantics(tabs,state.currentStep);
}
function navigateTo(step,{focusContent=false}={}) {
  if(step===SUMMARY_STEP&&!state.summaryUnlocked) return;
  document.querySelectorAll(".step-panel").forEach(p=>{p.hidden=p.id!==`step-${step}`;});
  state.currentStep=step; saveState(); renderTabs(); updateNavigation();
  if(step===SUMMARY_STEP) renderSummary();
  const panel=document.getElementById(`step-${step}`);
  syncTabSemantics(document.getElementById("step-tabs"),step);
  if(focusContent) focusTabPanelStart(panel); else window.scrollTo({top:0,behavior:"smooth"});
}
function updateNavigation() {
  const percent=Math.round(state.completed.filter(n=>n>=1&&n<=QUIZ_STEP).length/QUIZ_STEP*100);
  document.getElementById("progress-bar").style.width=`${percent}%`;
  document.getElementById("progress-percent").textContent=`${percent} % bearbeitet`;
  document.getElementById("progress-label").textContent=`Schritt ${state.currentStep} von ${QUIZ_STEP}`;
  const panel=document.getElementById(`step-${state.currentStep}`);
  if(panel) renderTabFlowNavigation(panel,{items:STEP_TITLES.map((label,index)=>({id:index+1,label})),currentId:state.currentStep,onNavigate:navigateTo,isEnabled:id=>id!==SUMMARY_STEP||state.summaryUnlocked});
}
function unlockSolution(event,expectedCode,downloadLinkId,messageId) {
  event.preventDefault();
  const entered=event.currentTarget.elements["solution-code"].value.toUpperCase().replace(/[^A-Z0-9]/g,"");
  const expected=expectedCode.toUpperCase().replace(/[^A-Z0-9]/g,"");
  const link=document.getElementById(downloadLinkId),message=document.getElementById(messageId);
  const ok=entered===expected;
  link.hidden=!ok; message.className=`solution-code-message ${ok?"":"error"}`;
  message.textContent=ok?"Code korrekt. Das Sicherungsblatt ist freigeschaltet.":"Der eingegebene Code ist nicht gültig.";
  state.download[downloadLinkId.endsWith("-summary")?"summary":"quiz"]=ok; saveState();
}
window.unlockSolution=unlockSolution;
function restoreDownloads() {
  for(const [key,id] of [["quiz","solution-download-link"],["summary","solution-download-link-summary"]]) {
    document.getElementById(id).hidden=!state.download[key];
  }
}
function bindReset() {
  document.getElementById("reset-module").addEventListener("click",()=>{
    if(window.confirm("Möchtest du alle Eingaben und den Fortschritt zurücksetzen?")) {
      try { localStorage.removeItem(STORAGE_KEY); } catch {}
      window.location.reload();
    }
  });
}
function renderSummary(){
 const entries=[
 ["1. Klasse und Klassenleiter","Ordne die Klassenleiter zu und ergänze die Kardinalitäten.","10a – KOH, 10b – SEI, 10c – BRA; Klasse 1 — 1 Klassenleiter."],
 ["2. Schlüssel und Schloss","Ergänze das Diagramm und notiere beide Tabellenschemata.","Schlüssel 1 — 1 Schloss; Fremdschlüssel in einer der Tabellen; die Zuordnung muss zusätzlich eindeutig sein. Möglichkeit A: schloss_id[schloss] in schluessel; Möglichkeit B: schluessel_id[schluessel] in schloss. In beiden Fällen gehört der Verweis zu einer eindeutig zugeordneten Zeile."],
 ["4. Abschlussquiz","Sichere die 1:1-Zuordnung.","Alle vier Fragen richtig beantwortet."]
 ];
 document.getElementById("answer-summary").innerHTML=entries.map(([title,prompt,result])=>`<section class="summary-section"><h3>${title}</h3><p class="prompt">${prompt}</p><dl class="summary-grid"><dt>Richtiges Ergebnis</dt><dd>${result}</dd></dl></section>`).join("");
}
function restoreInputs(){
 for(const [id,key] of Object.entries({"r1-klasse-cardinality":"klasse","r1-klassenleiter-cardinality":"klassenleiter"}))document.getElementById(id).value=state.r1[key];
 for(const [id,key] of Object.entries({"r2-schluessel-cardinality":"schluesselA","r2-schloss-cardinality":"schluesselB","r2-schema-text-a":"schemaTextA","r2-schema-text-b":"schemaTextB"}))document.getElementById(id).value=state.r2[key];
 renderRadioList("r1-f1a-choices","r1-f1a",R1_F1A_OPTIONS,state.r1.f1a);
 renderRadioList("r1-f1b-choices","r1-f1b",R1_F1B_OPTIONS,state.r1.f1b);
 renderCheckboxList("r2-schema-choices","r2-schema",R2_SCHEMA_OPTIONS,state.r2.schema);
 renderCheckboxList("r2-unique-choices","r2-unique",UNIQUE_OPTIONS,state.r2.unique);
 renderQuiz();restoreDownloads();
 document.getElementById("r1-reveal").hidden=!isSolved("r1-cardinality");
 document.getElementById("r2-merke").hidden=!isSolved("r2-schema");
}
function bindEvents(){
 for(const [id,fn] of Object.entries({"r1-drag":checkR1Drag,"r1-f1a":checkR1F1a,"r1-f1b":checkR1F1b,"r1-cardinality":checkR1Cardinality,"r2-schema":checkR2Schema,"r2-cardinality":checkR2Cardinality,"r2-schluessel-schema":checkR2SchluesselSchema,"r2-unique":checkUnique}))document.getElementById("check-"+id).addEventListener("click",fn);
 for(const [id,key] of Object.entries({"r1-klasse-cardinality":"klasse","r1-klassenleiter-cardinality":"klassenleiter"}))document.getElementById(id).addEventListener("input",e=>{state.r1[key]=e.target.value;saveState();});
 for(const [id,key] of Object.entries({"r2-schluessel-cardinality":"schluesselA","r2-schloss-cardinality":"schluesselB","r2-schema-text-a":"schemaTextA","r2-schema-text-b":"schemaTextB"}))document.getElementById(id).addEventListener("input",e=>{state.r2[key]=e.target.value;saveState();});
 const bind=(name,fn,multi)=>document.querySelectorAll(`input[name="${name}"]`).forEach(input=>input.addEventListener("change",()=>{fn(multi?selectedValues(name):input.value);saveState();}));
 bind("r1-f1a",v=>state.r1.f1a=v,false);bind("r1-f1b",v=>state.r1.f1b=v,false);
 bind("r2-schema",v=>state.r2.schema=v,true);bind("r2-unique",v=>state.r2.unique=v,true);
 bindQuiz();bindReset();
}
function init(){
 renderR1Tables();renderR2Schemas();renderR1DragDrop();restoreInputs();renderTabs();bindEvents();navigateTo(state.currentStep);updateNavigation();
}
document.addEventListener("DOMContentLoaded",init);
