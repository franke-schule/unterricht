const STORAGE_KEY = "informatik10-datenbanken-tabellenschema-v3";
const TYPES = ["varchar(255)", "int", "char", "date"];
const STEP_TITLES = ["Datentypen", "Beispiel", "users", "photos", "Beziehung", "Klassenkarte", "Sicherung"];
const TOTAL_STEPS = STEP_TITLES.length;

// Datentypentscheidung: Die Präsentation verwendet varchar(255), int und date.
// users.csv/photos.csv enthalten für created_at und updated_at Zeitstempel. Da in
// dieser Unterrichtssequenz kein datetime-Typ eingeführt wird, werden sie hier
// fachlich vereinfacht als date behandelt. char wird als einzelnes Zeichen geübt.
export const SCHEMAS = {
  users: { table: "users", attributes: { id: "int", username: "varchar(255)", birthday: "date", created_at: "date", updated_at: "date" } },
  photos: { table: "photos", attributes: { id: "int", description: "varchar(255)", url: "varchar(255)", created_at: "date", updated_at: "date" } },
};

const DEFAULT_STATE = { currentStep: 1, completed: [], summaryUnlocked: false, step1: {}, step2: "", schemaTexts: { users: "", photos: "" }, relationship: { foreignKey: "", mapping: "", usersCardinality: "", photosCardinality: "" }, classCard: emptyClassCard(), final: "", finalRelation: "" };
let state = loadState();

function emptyClassCard() { return { name: "", attributes: Array.from({ length: 5 }, () => "") }; }
function clone(value) { return JSON.parse(JSON.stringify(value)); }
function loadState() { try { const saved = JSON.parse(localStorage.getItem(STORAGE_KEY)); return saved ? { ...clone(DEFAULT_STATE), ...saved, schemaTexts: { ...clone(DEFAULT_STATE).schemaTexts, ...saved.schemaTexts }, relationship: { ...clone(DEFAULT_STATE).relationship, ...saved.relationship } } : clone(DEFAULT_STATE); } catch { return clone(DEFAULT_STATE); } }
function saveState() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* Fortschritt bleibt nur für diese Sitzung sichtbar. */ } }
function esc(value) { return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;"); }
function normalize(value) { return String(value ?? "").trim().toLowerCase(); }

export function parseSchemaText(value) {
  const lines = String(value ?? "").replaceAll("\r", "").trim().split("\n");
  const errors = [];
  const rows = [];
  let table = "";
  const header = lines[0]?.match(/^([a-z_][a-z0-9_]*)\($/i);
  if (header) table = normalize(header[1]);
  else errors.push("Die erste Zeile muss aus Tabellenname und öffnender Klammer bestehen, z. B. tabelle(.");
  if (lines.length < 2 || lines.at(-1) !== ")") errors.push("Setze die schließende runde Klammer in eine eigene letzte Zeile.");
  const attributeLines = lines.slice(1, lines.at(-1) === ")" ? -1 : undefined);
  attributeLines.forEach((line, index) => {
    const match = line.match(/^\s*([a-z_][a-z0-9_]*)\s*:\s*(varchar\(255\)|int|char|date)\s*$/i);
    if (!match) errors.push(`Zeile ${index + 2}: Schreibe attribut: datentyp.`);
    else rows.push({ name: normalize(match[1]), type: normalize(match[2]) });
  });
  if (!attributeLines.length) errors.push("Zwischen die Klammern gehören die Attribute.");
  return { table, rows, errors };
}

export function evaluateSchema(answer, expected) {
  const tableCorrect = normalize(answer.table) === expected.table;
  const entered = answer.rows.filter((row) => normalize(row.name) || normalize(row.type));
  const incomplete = entered.filter((row) => !normalize(row.name) || !normalize(row.type));
  const names = entered.map((row) => normalize(row.name));
  const duplicates = names.filter((name, index) => name && names.indexOf(name) !== index);
  const actual = new Map(entered.map((row) => [normalize(row.name), normalize(row.type)]));
  const required = Object.keys(expected.attributes);
  const missing = required.filter((name) => !actual.has(name));
  const extra = [...actual.keys()].filter((name) => name && !required.includes(name));
  const wrongTypes = required.filter((name) => actual.has(name) && actual.get(name) !== expected.attributes[name]);
  const namedCorrect = required.filter((name) => actual.has(name)).length;
  return { correct: tableCorrect && !incomplete.length && !duplicates.length && !missing.length && !extra.length && !wrongTypes.length, tableCorrect, missing, extra, duplicates, wrongTypes, incomplete: incomplete.length, namedCorrect, enteredCount: entered.length };
}

export function evaluateClassCard(answer, expected) {
  const nameCorrect = normalize(answer.name) === expected.table;
  const entered = answer.attributes.map(normalize).filter(Boolean);
  const duplicates = entered.filter((name, index) => entered.indexOf(name) !== index);
  const required = Object.keys(expected.attributes);
  const missing = required.filter((name) => !entered.includes(name));
  const extra = entered.filter((name) => !required.includes(name));
  return { correct: nameCorrect && !duplicates.length && !missing.length && !extra.length, nameCorrect, missing, extra, duplicates, namedCorrect: required.filter((name) => entered.includes(name)).length };
}

function setFeedback(step, kind, message) { const node = document.getElementById(`feedback-step${step}`); node.className = `feedback ${kind}`; node.textContent = message; }
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
function clearFeedback(step) { setFeedback(step, "", ""); }
function markComplete(step) { if (!state.completed.includes(step)) state.completed.push(step); saveState(); renderTabs(); updateNavigation(); }
function optionMarkup(selected) { return `<option value="">Datentyp wählen</option>${TYPES.map((type) => `<option value="${type}" ${selected === type ? "selected" : ""}>${type}</option>`).join("")}`; }

function renderAssignment() {
  const rows = [["Benutzername", "username", "varchar(255)"], ["Foto-ID", "photo-id", "int"], ["Anfangsbuchstabe des Vornamens", "initial", "char"], ["Geburtstag", "birthday", "date"]];
  document.getElementById("datatype-assignment").innerHTML = rows.map(([label, id]) => `<label class="mini-assignment-row"><code>${label}</code><select data-type-id="${id}">${optionMarkup(state.step1[id] ?? "")}</select></label>`).join("");
  document.querySelectorAll("[data-type-id]").forEach((select) => select.addEventListener("change", () => { state.step1[select.dataset.typeId] = select.value; clearFeedback(1); saveState(); }));
}
function renderChoices() {
  document.getElementById("example-choice").innerHTML = [["right", "Der Tabellenname steht vor den Klammern; Attribute und Datentypen werden durch Doppelpunkte getrennt."], ["wrong-one", "Nur Zahlen-Attribute werden zwischen die Klammern geschrieben."], ["wrong-two", "Der Datentyp steht vor dem Attributnamen und wird mit einem Komma getrennt."]].map(([value, label]) => `<label class="choice-option"><input type="radio" name="example" value="${value}" ${state.step2 === value ? "checked" : ""}><span>${label}</span></label>`).join("");
  document.getElementById("foreign-key-choice").innerHTML = [["id", "id: int"], ["foreign", "user_id[users]: int"], ["url", "url: varchar(255)"]].map(([value, label]) => `<label class="choice-option"><input type="radio" name="foreign-key" value="${value}" ${state.relationship.foreignKey === value ? "checked" : ""}><span><code>${label}</code></span></label>`).join("");
  document.getElementById("relation-mapping-choice").innerHTML = [["relation", "Sie wird nicht als Attribut übernommen. Ihre Verbindung erscheint als Kardinalität."], ["attribute", "Sie wird als Attribut user_id in die Klassenkarte übernommen."], ["remove", "Sie wird ersatzlos gelöscht, weil Beziehungen im Klassendiagramm nicht vorkommen."]].map(([value, label]) => `<label class="choice-option"><input type="radio" name="relation-mapping" value="${value}" ${state.relationship.mapping === value ? "checked" : ""}><span>${label}</span></label>`).join("");
  document.getElementById("users-cardinality").value = state.relationship.usersCardinality;
  document.getElementById("photos-cardinality").value = state.relationship.photosCardinality;
  document.getElementById("final-choice").innerHTML = [["right", "Klassenname → Tabellenname; zwischen den Klammern steht attribut: datentyp. Einrücken ist freiwillig."], ["wrong-one", "Ein Tabellenschema besteht nur aus dem Tabellennamen und IDs."], ["wrong-two", "Datentypen werden ohne Attributnamen zwischen die Klammern geschrieben."]].map(([value, label]) => `<label class="choice-option"><input type="radio" name="final" value="${value}" ${state.final === value ? "checked" : ""}><span>${label}</span></label>`).join("");
  document.getElementById("final-relation-choice").innerHTML = [["right", "Fremdschlüssel → Verbindung mit Kardinalität; der Fremdschlüssel steht nicht als Attribut in der Klassenkarte."], ["wrong-one", "Fremdschlüssel → zusätzliches Attribut in jeder verbundenen Klasse."], ["wrong-two", "Fremdschlüssel → Datentyp der gesamten Klasse."]].map(([value, label]) => `<label class="choice-option"><input type="radio" name="final-relation" value="${value}" ${state.finalRelation === value ? "checked" : ""}><span>${label}</span></label>`).join("");
  document.querySelectorAll('input[name="example"]').forEach((input) => input.addEventListener("change", () => { state.step2 = input.value; clearFeedback(2); saveState(); }));
  document.querySelectorAll('input[name="foreign-key"]').forEach((input) => input.addEventListener("change", () => { state.relationship.foreignKey = input.value; clearFeedback(5); saveState(); }));
  document.querySelectorAll('input[name="relation-mapping"]').forEach((input) => input.addEventListener("change", () => { state.relationship.mapping = input.value; clearFeedback(5); saveState(); }));
  document.getElementById("users-cardinality").addEventListener("change", (event) => { state.relationship.usersCardinality = event.target.value; clearFeedback(5); saveState(); });
  document.getElementById("photos-cardinality").addEventListener("change", (event) => { state.relationship.photosCardinality = event.target.value; clearFeedback(5); saveState(); });
  document.querySelectorAll('input[name="final"]').forEach((input) => input.addEventListener("change", () => { state.final = input.value; clearFeedback(7); saveState(); }));
  document.querySelectorAll('input[name="final-relation"]').forEach((input) => input.addEventListener("change", () => { state.finalRelation = input.value; clearFeedback(7); saveState(); }));
}
function schemaEditorMarkup(key) { return `<label class="schema-text-label" for="${key}-schema-text">Tabellenschema eingeben</label><textarea id="${key}-schema-text" class="schema-textarea" data-schema-text="${key}" rows="8" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="tabellenname(\n  attribut: datentyp\n)">${esc(state.schemaTexts[key])}</textarea><p class="schema-format-hint">Schreibe jede Spalte in eine eigene Zeile. Die Zeilen dürfen unterschiedlich weit oder gar nicht eingerückt sein.</p>`; }
function renderSchemaEditor(key) { document.getElementById(`${key}-editor`).innerHTML = schemaEditorMarkup(key); }
function classEditorMarkup() { const answer = state.classCard; return `<article class="class-card editable-class-card"><h3><label class="visually-hidden" for="class-name">Klassenname</label><input id="class-name" type="text" autocomplete="off" spellcheck="false" value="${esc(answer.name)}" placeholder="Klassenname"></h3><ul id="class-rows">${answer.attributes.map((name, index) => `<li><input data-class-name="${index}" type="text" autocomplete="off" spellcheck="false" value="${esc(name)}" placeholder="Attribut ${index + 1}" aria-label="Attribut ${index + 1} der Klassenkarte"><button class="remove-row" type="button" data-remove-class="${index}" aria-label="Attributzeile ${index + 1} der Klassenkarte löschen">×</button></li>`).join("")}</ul></article><button class="secondary-button add-row" id="add-class-row" type="button">+ Attribut hinzufügen</button>`; }
function renderEditors() { renderSchemaEditor("users"); renderSchemaEditor("photos"); document.getElementById("class-editor").innerHTML = classEditorMarkup(); bindEditorEvents(); }
function bindEditorEvents() {
  document.querySelectorAll("[data-schema-text]").forEach((textarea) => textarea.addEventListener("input", () => { const key = textarea.dataset.schemaText; state.schemaTexts[key] = textarea.value; clearFeedback(key === "users" ? 3 : 4); saveState(); }));
  document.getElementById("class-name").addEventListener("input", (event) => { state.classCard.name = event.target.value; clearFeedback(6); saveState(); });
  document.querySelectorAll("[data-class-name]").forEach((input) => input.addEventListener("input", () => { state.classCard.attributes[Number(input.dataset.className)] = input.value; clearFeedback(6); saveState(); }));
  document.getElementById("add-class-row").addEventListener("click", () => { state.classCard.attributes.push(""); saveState(); document.getElementById("class-editor").innerHTML = classEditorMarkup(); bindEditorEvents(); });
  document.querySelectorAll("[data-remove-class]").forEach((button) => button.addEventListener("click", () => { state.classCard.attributes.splice(Number(button.dataset.removeClass), 1); saveState(); document.getElementById("class-editor").innerHTML = classEditorMarkup(); bindEditorEvents(); }));
}

function feedbackForSchema(step, result) {
  if (result.correct) { setFeedback(step, "success", "Richtig. Syntax, Tabellenname, Attribute und Datentypen stimmen – die Reihenfolge spielt keine Rolle."); markComplete(step); return; }
  if (!result.enteredCount) { setFeedback(step, "hint", "Noch nicht korrekt: Beginne mit dem Tabellennamen und füge dann die Attribute mit ihren Datentypen hinzu."); return; }
  if (result.namedCorrect > 0) { const pieces = []; if (!result.tableCorrect) pieces.push("Prüfe den Tabellennamen."); if (result.wrongTypes.length) pieces.push(`Datentyp bei ${result.wrongTypes.join(", ")} passt noch nicht.`); if (result.missing.length) pieces.push(`Fehlt: ${result.missing.join(", ")}.`); if (result.extra.length) pieces.push(`Nicht erwartet: ${result.extra.join(", ")}.`); if (result.duplicates.length) pieces.push(`Doppelt: ${[...new Set(result.duplicates)].join(", ")}.`); if (result.incomplete) pieces.push("Vervollständige jede begonnene Zeile."); setFeedback(step, "partial", `Teilweise korrekt: ${pieces.join(" ")}`); return; }
  setFeedback(step, "hint", result.tableCorrect ? "Noch nicht korrekt. Übertrage erst die Attributnamen der Klassenkarte; wähle anschließend die passenden Datentypen." : "Noch nicht korrekt. Prüfe zuerst den Tabellennamen und übertrage dann die Attributnamen der Klassenkarte.");
}
function checkSchemaStep(step, key) { const parsed = parseSchemaText(state.schemaTexts[key]); if (parsed.errors.length) setFeedback(step, "hint", `Noch nicht korrekt: ${parsed.errors[0]}`); else feedbackForSchema(step, evaluateSchema(parsed, SCHEMAS[key])); saveState(); }
function checkStep1() { const expected = { username: "varchar(255)", "photo-id": "int", initial: "char", birthday: "date" }; const values = Object.keys(expected).map((key) => state.step1[key] ?? ""); const correct = Object.keys(expected).filter((key) => state.step1[key] === expected[key]).length; if (correct === 4) { setFeedback(1, "success", "Richtig: Text, Zahlen, einzelne Zeichen und Daten haben unterschiedliche Datentypen."); markComplete(1); } else if (values.some((value) => !value)) setFeedback(1, "hint", "Noch nicht korrekt: Ordne zuerst jeder Eigenschaft einen Datentyp zu."); else if (correct) setFeedback(1, "partial", `${correct} von 4 Zuordnungen stimmen schon. Überlege: Ist der Wert Text, eine ganze Zahl, ein einzelnes Zeichen oder ein Datum?`); else setFeedback(1, "hint", "Noch nicht korrekt. Nutze die kurzen Beschreibungen der vier Datentypen oberhalb der Aufgabe."); saveState(); }
function checkStep2() { if (state.step2 === "right") { setFeedback(2, "success", "Genau. Jetzt kannst du diese Syntax auf die InstaHub-Daten anwenden."); markComplete(2); } else if (!state.step2) setFeedback(2, "hint", "Noch nicht korrekt: Wähle eine Aussage aus."); else setFeedback(2, "hint", "Noch nicht korrekt. Prüfe Klammern und Doppelpunkt im Beispiel."); saveState(); }
function checkStep3() { checkSchemaStep(3, "users"); }
function checkStep4() { checkSchemaStep(4, "photos"); }
function checkStep5() {
  const checks = {
    foreignKey: state.relationship.foreignKey === "foreign",
    mapping: state.relationship.mapping === "relation",
    usersCardinality: state.relationship.usersCardinality === "1",
    photosCardinality: state.relationship.photosCardinality === "n",
  };
  const selected = Object.values(state.relationship).filter(Boolean).length;
  const correct = Object.values(checks).filter(Boolean).length;
  if (correct === 4) {
    setFeedback(5, "success", "Richtig. Der Fremdschlüssel wird im Klassendiagramm durch die 1:n-Beziehung dargestellt.");
    document.getElementById("relationship-result").hidden = false;
    markComplete(5);
  } else if (!selected) {
    setFeedback(5, "hint", "Noch nicht korrekt: Bearbeite alle drei Teile der Aufgabe.");
  } else {
    const hints = [];
    if (!checks.foreignKey) hints.push("Suche die Zeile, die den Tabellennamen in eckigen Klammern nennt.");
    if (!checks.mapping) hints.push("Prüfe, ob eine Beziehung in der Klassenkarte wirklich ein eigenes Attribut ist.");
    if (!checks.usersCardinality || !checks.photosCardinality) hints.push("Überlege, wie viele Fotos ein Benutzer hochladen kann und zu wie vielen Benutzern ein Foto gehört.");
    setFeedback(5, correct ? "partial" : "hint", `${correct} von 4 Angaben stimmen. ${hints[0]}`);
  }
  saveState();
}
function checkStep6() { const result = evaluateClassCard(state.classCard, SCHEMAS.photos); if (result.correct) { setFeedback(6, "success", "Richtig. Die Klassenkarte enthält die fünf eigenen Attribute; der Fremdschlüssel wird als Beziehung dargestellt."); markComplete(6); } else if (!state.classCard.attributes.filter(Boolean).length) setFeedback(6, "hint", "Noch nicht korrekt: Trage einen Klassennamen und die passenden Attribute aus dem Tabellenschema ein."); else if (result.namedCorrect) { const pieces = []; if (!result.nameCorrect) pieces.push("Prüfe den Klassennamen."); if (result.missing.length) pieces.push(`Fehlt: ${result.missing.join(", ")}.`); if (result.extra.length) pieces.push(`Nicht als Attribut erwartet: ${result.extra.join(", ")}.`); if (result.duplicates.length) pieces.push(`Doppelt: ${[...new Set(result.duplicates)].join(", ")}.`); setFeedback(6, "partial", `Teilweise korrekt: ${pieces.join(" ")}`); } else setFeedback(6, "hint", "Noch nicht korrekt. Übernimm die eigenen Spaltennamen als Attribute. Beachte die Zeile mit den eckigen Klammern."); saveState(); }
function checkStep7(event) { event.preventDefault(); const correct = Number(state.final === "right") + Number(state.finalRelation === "right"); if (correct === 2) { setFeedback(7, "success", "Richtig. Deine Abschlussübersicht ist freigeschaltet."); state.summaryUnlocked = true; markComplete(7); saveState(); setTimeout(() => navigateTo("summary"), 300); } else if (!state.final || !state.finalRelation) setFeedback(7, "hint", "Noch nicht korrekt: Wähle zu beiden Themen eine Merkhilfe aus."); else if (correct === 1) setFeedback(7, "partial", "Eine Merkhilfe stimmt schon. Prüfe die andere noch einmal."); else setFeedback(7, "hint", "Noch nicht korrekt. Prüfe die Schema-Syntax und die Darstellung des Fremdschlüssels im Klassendiagramm."); saveState(); }

function renderTabs() { const tabs = document.getElementById("step-tabs"); tabs.innerHTML = STEP_TITLES.map((title, index) => { const step = index + 1; const unlocked = step === 1 || state.completed.includes(step) || state.completed.includes(step - 1); return `<button id="tab-${step}" class="step-tab ${state.completed.includes(step) ? "is-complete" : ""}" type="button" role="tab" aria-controls="step-${step}" aria-selected="${state.currentStep === step}" data-step="${step}" ${unlocked ? "" : "disabled aria-disabled=\"true\""}><span>${step}</span><small>${title}</small></button>`; }).join("") + `<button id="tab-summary" class="step-tab" type="button" role="tab" aria-controls="step-summary" aria-selected="${state.currentStep === "summary"}" data-step="summary" ${state.summaryUnlocked ? "" : "hidden"}><span>✓</span><small>Übersicht</small></button>`; tabs.querySelectorAll("button").forEach((button) => button.addEventListener("click", () => navigateTo(button.dataset.step === "summary" ? "summary" : Number(button.dataset.step)))); }
function navigateTo(step) { if (step === "summary" && !state.summaryUnlocked) return; if (typeof step === "number" && step > 1 && !state.completed.includes(step - 1) && !state.completed.includes(step)) return; document.querySelectorAll(".step-panel").forEach((panel) => { panel.hidden = panel.id !== `step-${step}`; }); state.currentStep = step; saveState(); renderTabs(); updateNavigation(); document.getElementById("relationship-result").hidden = !state.completed.includes(5); if (step === "summary") renderSummary(); window.scrollTo({ top: 0, behavior: "smooth" }); }
function updateNavigation() { const complete = state.completed.filter((step) => step >= 1 && step <= TOTAL_STEPS).length; const percent = Math.round(complete / TOTAL_STEPS * 100); document.getElementById("progress-bar").style.width = `${percent}%`; document.getElementById("progress-percent").textContent = `${percent} % bearbeitet`; document.getElementById("progress-label").textContent = state.currentStep === "summary" ? "Abschlussübersicht" : `Schritt ${state.currentStep} von ${TOTAL_STEPS}`; const previous = document.getElementById("previous-step"); const next = document.getElementById("next-step"); if (state.currentStep === "summary") { previous.disabled = false; previous.textContent = "← Zur Sicherung"; next.hidden = true; } else { previous.disabled = state.currentStep === 1; previous.textContent = "← Zurück"; next.hidden = false; next.textContent = state.currentStep === TOTAL_STEPS ? "Zur Übersicht →" : "Weiter →"; next.disabled = state.currentStep === TOTAL_STEPS ? !state.summaryUnlocked : !state.completed.includes(state.currentStep); } }
function renderSummary() { const entries = [["1. Datentypen", "varchar(255) für Text, int für ganze Zahlen, char für ein Zeichen und date für ein Datum."], ["2. Syntax", "tabellenname( – attribut: datentyp – ). Einrückungen sind freiwillig."], ["3. users", "users mit id, username, birthday, created_at und updated_at."], ["4. photos", "photos mit id, description, url, created_at und updated_at."], ["5. Beziehung", "photos.user_id[users] verweist als Fremdschlüssel auf users. Im Klassendiagramm wird daraus die 1:n-Beziehung."], ["6. Gegenrichtung", "Eigene Spalten werden Attribute; der Fremdschlüssel wird als Beziehung dargestellt."], ["7. Merkhilfe", "Klammern und Doppelpunkte gehören zur Schema-Syntax; die Einrückung ist freiwillig."]]; document.getElementById("answer-summary").innerHTML = entries.map(([title, result]) => `<section class="summary-section"><h3>${title}</h3><dl class="summary-grid"><dt>Richtiges Ergebnis</dt><dd>${result}</dd></dl></section>`).join(""); }
function bindEvents() { document.getElementById("check-step1").addEventListener("click", checkStep1); document.getElementById("check-step2").addEventListener("click", checkStep2); document.getElementById("check-step3").addEventListener("click", checkStep3); document.getElementById("check-step4").addEventListener("click", checkStep4); document.getElementById("check-step5").addEventListener("click", checkStep5); document.getElementById("check-step6").addEventListener("click", checkStep6); document.getElementById("final-quiz").addEventListener("submit", checkStep7); document.getElementById("previous-step").addEventListener("click", () => { if (state.currentStep === "summary") navigateTo(TOTAL_STEPS); else if (state.currentStep > 1) navigateTo(state.currentStep - 1); }); document.getElementById("next-step").addEventListener("click", () => { if (state.currentStep < TOTAL_STEPS) navigateTo(state.currentStep + 1); else if (state.summaryUnlocked) navigateTo("summary"); }); document.getElementById("reset-module").addEventListener("click", () => { if (window.confirm("Möchtest du alle Eingaben und den Fortschritt zurücksetzen?")) { localStorage.removeItem(STORAGE_KEY); window.location.reload(); } }); }
function init() { renderAssignment(); renderChoices(); renderEditors(); renderTabs(); bindEvents(); if (state.currentStep === "summary" && !state.summaryUnlocked) state.currentStep = 1; navigateTo(state.currentStep); }
if (typeof document !== "undefined") document.addEventListener("DOMContentLoaded", init);
