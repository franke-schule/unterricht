const STORAGE_KEY = "informatik10-datenbanken-beziehungen-v1";
const STEP_TITLES = ["Zuordnen", "1:n entdecken", "Fremdschlüssel", "Anwenden", "Kardinalität", "Klassendiagramm", "Kurzquiz"];
const DEFAULT_STATE = {
  currentStep: 1,
  completed: [],
  summaryUnlocked: false,
  step1: { assignments: {}, checked: false },
  step2: { photos: "", users: "", checked: false },
  step3: { answer: "", checked: false },
  step4: { key: "", value: "", checked: false },
  step5: { school: "", pupils: "", checked: false },
  step6: { users: "", photos: "", checked: false },
  step7: { one: "", two: "", three: "", checked: false },
};

let state = loadState();
let lesson = null;

function cloneDefaultState() { return JSON.parse(JSON.stringify(DEFAULT_STATE)); }

function loadState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!saved || typeof saved !== "object") return cloneDefaultState();
    const fresh = cloneDefaultState();
    return {
      ...fresh, ...saved,
      step1: { ...fresh.step1, ...saved.step1 }, step2: { ...fresh.step2, ...saved.step2 },
      step3: { ...fresh.step3, ...saved.step3 }, step4: { ...fresh.step4, ...saved.step4 },
      step5: { ...fresh.step5, ...saved.step5 }, step6: { ...fresh.step6, ...saved.step6 },
      step7: { ...fresh.step7, ...saved.step7 },
    };
  } catch { return cloneDefaultState(); }
}

function saveState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  catch {
    const status = document.getElementById("data-status");
    status.hidden = false;
    status.classList.add("error");
    status.textContent = "Hinweis: Deine Eingaben können in diesem Browser nicht dauerhaft gespeichert werden.";
  }
}

function escapeHtml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;");
}

function parseDelimited(text, delimiter = ";") {
  const rows = []; let row = []; let field = ""; let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"') {
      if (quoted && text[index + 1] === '"') { field += '"'; index += 1; }
      else if (quoted || field.length === 0) quoted = !quoted;
      else field += character;
    } else if (character === delimiter && !quoted) { row.push(field); field = ""; }
    else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      row.push(field); if (row.some((value) => value.length > 0)) rows.push(row); row = []; field = "";
    } else field += character;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  const [headers, ...records] = rows;
  return headers ? records.map((values) => Object.fromEntries(headers.map((header, index) => [header.trim(), values[index] ?? ""]))) : [];
}

async function loadLesson() {
  const [usersResponse, photosResponse] = await Promise.all([fetch("users.csv", { cache: "no-store" }), fetch("photos.csv", { cache: "no-store" })]);
  if (!usersResponse.ok || !photosResponse.ok) throw new Error("CSV-Dateien konnten nicht geladen werden.");
  const [usersText, photosText] = await Promise.all([usersResponse.text(), photosResponse.text()]);
  const users = parseDelimited(usersText);
  const photos = parseDelimited(photosText);
  const userById = new Map(users.map((user) => [user.id, user]));
  const groups = new Map();
  photos.forEach((photo) => {
    if (!userById.has(photo.user_id)) return;
    const userPhotos = groups.get(photo.user_id) ?? [];
    userPhotos.push(photo); groups.set(photo.user_id, userPhotos);
  });
  const primaryEntry = [...groups.entries()].find(([, userPhotos]) => userPhotos.length >= 2);
  const otherEntries = [...groups.entries()].filter(([id, userPhotos]) => id !== primaryEntry?.[0] && userPhotos.length > 0).slice(0, 2);
  if (!primaryEntry || otherEntries.length < 2) throw new Error("Für die Zuordnung fehlen passende Datensätze.");
  const selectedPhotos = [primaryEntry[1][0], primaryEntry[1][1], otherEntries[0][1][0], otherEntries[1][1][0]];
  const selectedUsers = [userById.get(primaryEntry[0]), userById.get(otherEntries[0][0]), userById.get(otherEntries[1][0])];
  const newPhotoId = Math.max(...photos.map((photo) => Number(photo.id) || 0)) + 1;
  return { users: selectedUsers, photos: selectedPhotos, primaryUser: selectedUsers[0], examplePhoto: selectedPhotos[0], targetUser: selectedUsers[1], newPhotoId };
}

function setFeedback(step, kind, message) {
  const feedback = document.getElementById(`feedback-step${step}`);
  feedback.className = `feedback ${kind}`;
  feedback.textContent = message;
}

function clearFeedback(step) {
  const feedback = document.getElementById(`feedback-step${step}`);
  feedback.className = "feedback";
  feedback.textContent = "";
}

function markComplete(step) {
  if (!state.completed.includes(step)) state.completed.push(step);
  saveState(); updateNavigation(); renderTabs();
}

function radioList(containerId, name, choices, selected) {
  document.getElementById(containerId).innerHTML = choices.map(([value, label]) => `<label class="choice-option"><input type="radio" name="${name}" value="${escapeHtml(value)}" ${selected === value ? "checked" : ""}><span>${escapeHtml(label)}</span></label>`).join("");
}

function renderTabs() {
  const tabs = document.getElementById("step-tabs");
  tabs.innerHTML = STEP_TITLES.map((title, index) => {
    const step = index + 1;
    const unlocked = step === 1 || state.completed.includes(step) || state.completed.includes(step - 1);
    return `<button id="tab-${step}" class="step-tab ${state.completed.includes(step) ? "is-complete" : ""}" type="button" role="tab" aria-controls="step-${step}" aria-selected="${state.currentStep === step}" data-step="${step}" ${unlocked ? "" : 'disabled aria-disabled="true"'}><span>${step}</span><small>${title}</small></button>`;
  }).join("") + `<button id="tab-summary" class="step-tab" type="button" role="tab" aria-controls="step-summary" aria-selected="${state.currentStep === "summary"}" data-step="summary" ${state.summaryUnlocked ? "" : "hidden"}><span>✓</span><small>Übersicht</small></button>`;
  tabs.querySelectorAll("button").forEach((button) => button.addEventListener("click", () => navigateTo(button.dataset.step === "summary" ? "summary" : Number(button.dataset.step))));
}

function navigateTo(step) {
  if (step === "summary" && !state.summaryUnlocked) return;
  if (typeof step === "number" && step > 1 && !state.completed.includes(step - 1) && !state.completed.includes(step)) return;
  document.querySelectorAll(".step-panel").forEach((panel) => { panel.hidden = panel.id !== `step-${step}`; });
  state.currentStep = step; saveState(); updateNavigation(); renderTabs();
  if (step === "summary") renderSummary();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function updateNavigation() {
  const completed = state.completed.filter((step) => step >= 1 && step <= 7).length;
  const percent = Math.round((completed / 7) * 100);
  document.getElementById("progress-bar").style.width = `${percent}%`;
  document.getElementById("progress-percent").textContent = `${percent} % bearbeitet`;
  document.getElementById("progress-label").textContent = state.currentStep === "summary" ? "Abschlussübersicht" : `Schritt ${state.currentStep} von 7`;
  const previous = document.getElementById("previous-step");
  const next = document.getElementById("next-step");
  if (state.currentStep === "summary") {
    previous.disabled = false;
    previous.textContent = "← Zum Quiz";
    next.hidden = true;
  } else {
    previous.disabled = state.currentStep === 1;
    previous.textContent = "← Zurück";
    next.hidden = false;
    next.textContent = state.currentStep === 7 ? "Zur Übersicht →" : "Weiter →";
    next.disabled = state.currentStep === 7 ? !state.summaryUnlocked : !state.completed.includes(state.currentStep);
  }
}

function shortDescription(photo) {
  const text = photo.description || "Foto ohne Beschreibung";
  return text.length > 94 ? `${text.slice(0, 91).trim()} …` : text;
}

function renderData() {
  const userOptions = lesson.users.map((user) => `<option value="${escapeHtml(user.id)}">${escapeHtml(user.name)} (${escapeHtml(user.username)})</option>`).join("");
  document.getElementById("record-assignment").innerHTML = lesson.photos.map((photo) => `<article id="photo-card-${photo.id}" class="record-card"><h3>Foto #${escapeHtml(photo.id)}</h3><p>${escapeHtml(shortDescription(photo))}</p><label for="photo-owner-${photo.id}">Gehört zu<select id="photo-owner-${photo.id}" data-photo-id="${escapeHtml(photo.id)}"><option value="">Benutzer wählen</option>${userOptions}</select></label></article>`).join("");
  document.querySelectorAll("[data-photo-id]").forEach((select) => {
    select.value = state.step1.assignments[select.dataset.photoId] ?? "";
    select.addEventListener("change", () => { state.step1.assignments[select.dataset.photoId] = select.value; state.step1.checked = false; clearFeedback(1); saveState(); });
  });
  document.getElementById("relationship-observation").innerHTML = `<p><strong>${escapeHtml(lesson.primaryUser.name)}</strong> wurde in der Zuordnung mehreren Fotos zugeordnet.</p><p>Betrachte nun beide Richtungen der Beziehung.</p>`;
  radioList("step2-choices", "photos-per-user", [["mehrere", "Ein Benutzer kann mehrere Fotos besitzen."], ["eines", "Ein Benutzer kann nur ein Foto besitzen."]], state.step2.photos);
  radioList("step3-choices", "foreign-column", [["id", "photos.id"], ["user_id", "photos.user_id"], ["description", "photos.description"]], state.step3.answer);
  document.getElementById("step2-choices").insertAdjacentHTML("beforeend", `<div class="choice-list"><p><strong>Ein einzelnes Foto gehört …</strong></p><label class="choice-option"><input type="radio" name="users-per-photo" value="einem" ${state.step2.users === "einem" ? "checked" : ""}><span>… genau einem Benutzer.</span></label><label class="choice-option"><input type="radio" name="users-per-photo" value="mehreren" ${state.step2.users === "mehreren" ? "checked" : ""}><span>… mehreren Benutzern.</span></label></div>`);
  const photo = lesson.examplePhoto; const user = lesson.primaryUser;
  document.getElementById("key-comparison").innerHTML = `<article class="key-card"><h3>users</h3><p class="primary">id: ${escapeHtml(user.id)}</p></article><div class="key-arrow" aria-hidden="true">←</div><article class="key-card"><h3>photos</h3><p>id: ${escapeHtml(photo.id)}</p><p class="foreign">user_id: ${escapeHtml(photo.user_id)}</p></article>`;
  radioList("step4a-choices", "step4-key", [["photos.id", "photos.id"], ["photos.user_id", "photos.user_id"], ["users.username", "users.username"]], state.step4.key);
  document.getElementById("new-photo-task").innerHTML = `<h3>B. Fremdschlüssel anwenden</h3><p>Ein neues Foto soll zu <strong>${escapeHtml(lesson.targetUser.name)}</strong> gehören. In <code>users</code> hat diese Person die <code>id</code> <strong>${escapeHtml(lesson.targetUser.id)}</strong>.</p><label for="new-photo-user-id">Trage den Wert für <code>user_id</code> im neuen Foto #${lesson.newPhotoId} ein.</label><input id="new-photo-user-id" class="inline-input" type="number" min="1" step="1" inputmode="numeric" value="${escapeHtml(state.step4.value)}" aria-label="Wert für user_id im neuen Foto">`;
  radioList("step5-choices", "school-cardinality", [["1", "Bei Schulklasse steht 1: Ein Schüler gehört genau einer Schulklasse."], ["n", "Bei Schulklasse steht n: Ein Schüler gehört zu vielen Schulklassen."]], state.step5.school);
  document.getElementById("step5-choices").insertAdjacentHTML("beforeend", `<div class="choice-list"><p><strong>Bei Schüler steht …</strong></p><label class="choice-option"><input type="radio" name="pupils-cardinality" value="n" ${state.step5.pupils === "n" ? "checked" : ""}><span>n: Eine Schulklasse hat mehrere Schüler.</span></label><label class="choice-option"><input type="radio" name="pupils-cardinality" value="1" ${state.step5.pupils === "1" ? "checked" : ""}><span>1: Eine Schulklasse hat nur einen Schüler.</span></label></div>`);
  document.getElementById("school-left-label").textContent = state.step5.school || "?";
  document.getElementById("school-right-label").textContent = state.step5.pupils || "?";
  document.getElementById("users-cardinality").value = state.step6.users;
  document.getElementById("photos-cardinality").value = state.step6.photos;
  radioList("quiz-one", "quiz-one", [["one-n", "Ein Benutzer kann mehrere Fotos besitzen; ein Foto gehört genau einem Benutzer."], ["n-one", "Ein Benutzer gehört zu mehreren Fotos; ein Foto besitzt mehrere Benutzer."], ["one-one", "Jeder Benutzer besitzt genau ein Foto."]], state.step7.one);
  radioList("quiz-two", "quiz-two", [["foreign", "Es verweist auf die id des zugehörigen Benutzers."], ["photo", "Es ist die eindeutige ID des Fotos."], ["name", "Es speichert den Namen des Benutzers."]], state.step7.two);
  radioList("quiz-three", "quiz-three", [["one-n", "Bei users: 1 · bei photos: n"], ["n-one", "Bei users: n · bei photos: 1"], ["one-one", "Bei users: 1 · bei photos: 1"]], state.step7.three);
  document.getElementById("relationship-reveal").hidden = !state.completed.includes(2);
  document.getElementById("foreign-key-reveal").hidden = !state.completed.includes(3);
  document.getElementById("cardinality-reveal").hidden = !state.completed.includes(5);
  document.getElementById("diagram-reveal").hidden = !state.completed.includes(6);
}

function checkStep1() {
  const missing = lesson.photos.some((photo) => !state.step1.assignments[photo.id]);
  const wrong = lesson.photos.filter((photo) => state.step1.assignments[photo.id] && state.step1.assignments[photo.id] !== photo.user_id);
  const assignedCount = lesson.photos.filter((photo) => state.step1.assignments[photo.id]).length;
  const correctCount = assignedCount - wrong.length;
  lesson.photos.forEach((photo) => document.getElementById(`photo-card-${photo.id}`).className = `record-card ${wrong.some((item) => item.id === photo.id) ? "is-wrong" : state.step1.assignments[photo.id] ? "is-correct" : ""}`);
  state.step1.checked = true;
  if (missing && correctCount > 0) setFeedback(1, "hint", `${correctCount} Zuordnung${correctCount === 1 ? " stimmt" : "en stimmen"} schon. Ordne auch die übrigen Fotos zu.`);
  else if (missing) setFeedback(1, "hint", "Ordne zuerst jedem Foto einen Benutzer zu.");
  else if (wrong.length === lesson.photos.length) setFeedback(1, "hint", "Noch nicht korrekt. Vergleiche bei jedem Foto photos.user_id mit users.id.");
  else if (wrong.length) setFeedback(1, "hint", `${lesson.photos.length - wrong.length} Zuordnungen stimmen schon. Vergleiche bei den übrigen photos.user_id mit users.id.`);
  else { setFeedback(1, "success", "Richtig zugeordnet. Mindestens ein Benutzer besitzt mehrere Fotos."); markComplete(1); }
  saveState();
}

function checkStep2() {
  state.step2.photos = document.querySelector('input[name="photos-per-user"]:checked')?.value ?? "";
  state.step2.users = document.querySelector('input[name="users-per-photo"]:checked')?.value ?? "";
  state.step2.checked = true;
  const photosCorrect = state.step2.photos === "mehrere";
  const usersCorrect = state.step2.users === "einem";
  if (photosCorrect && usersCorrect) { setFeedback(2, "success", "Genau: Das ist eine 1:n-Beziehung."); markComplete(2); document.getElementById("relationship-reveal").hidden = false; }
  else if (!state.step2.photos || !state.step2.users) setFeedback(2, "hint", "Wähle zu beiden Aussagen eine Ergänzung.");
  else if (photosCorrect || usersCorrect) setFeedback(2, "hint", "Eine Aussage stimmt schon. Prüfe die andere Richtung der Beziehung noch einmal.");
  else setFeedback(2, "hint", "Schau auf die Zuordnung zurück: Ein Benutzer durfte mehrfach gewählt werden. Ein Foto wurde nur einmal zugeordnet.");
  saveState();
}

function checkStep3() {
  state.step3.answer = document.querySelector('input[name="foreign-column"]:checked')?.value ?? "";
  state.step3.checked = true;
  if (state.step3.answer === "user_id") { setFeedback(3, "success", "Richtig: photos.user_id enthält die ID des passenden Benutzers."); markComplete(3); document.getElementById("foreign-key-reveal").hidden = false; }
  else if (!state.step3.answer) setFeedback(3, "hint", "Wähle eine Spalte aus.");
  else setFeedback(3, "hint", "Vergleiche den Wert in photos mit der id in users. Welche Spalte wiederholt diesen Benutzerwert?");
  saveState();
}

function checkStep4() {
  state.step4.key = document.querySelector('input[name="step4-key"]:checked')?.value ?? "";
  state.step4.value = document.getElementById("new-photo-user-id").value.trim(); state.step4.checked = true;
  const keyCorrect = state.step4.key === "photos.user_id";
  const valueCorrect = state.step4.value !== "" && Number(state.step4.value) === Number(lesson.targetUser.id);
  if (keyCorrect && valueCorrect) { setFeedback(4, "success", "Beide Aufgaben sind richtig: photos.user_id ist der Fremdschlüssel und übernimmt die id des Benutzers."); markComplete(4); }
  else if (!state.step4.key || !state.step4.value) setFeedback(4, "hint", "Bearbeite beide Teilaufgaben.");
  else if (keyCorrect) setFeedback(4, "hint", "Teil A stimmt. Übernimm für Teil B die id des genannten Benutzers.");
  else if (valueCorrect) setFeedback(4, "hint", "Teil B stimmt. Welche Spalte in photos verweist auf users.id?");
  else setFeedback(4, "hint", "Prüfe A: Die Verbindungs-Spalte steht in photos. Prüfe B: Übernimm die id des genannten Benutzers.");
  saveState();
}

function checkStep5() {
  state.step5.school = document.querySelector('input[name="school-cardinality"]:checked')?.value ?? "";
  state.step5.pupils = document.querySelector('input[name="pupils-cardinality"]:checked')?.value ?? ""; state.step5.checked = true;
  document.getElementById("school-left-label").textContent = state.step5.school || "?"; document.getElementById("school-right-label").textContent = state.step5.pupils || "?";
  const schoolCorrect = state.step5.school === "1";
  const pupilsCorrect = state.step5.pupils === "n";
  if (schoolCorrect && pupilsCorrect) { setFeedback(5, "success", "Richtig gelesen. Jetzt hat die Schreibweise einen Namen: Kardinalität."); markComplete(5); document.getElementById("cardinality-reveal").hidden = false; }
  else if (!state.step5.school || !state.step5.pupils) setFeedback(5, "hint", "Wähle zu beiden Enden der Verbindung eine Aussage.");
  else if (schoolCorrect || pupilsCorrect) setFeedback(5, "hint", "Ein Ende stimmt schon. Prüfe, wie viele Objekte jeweils auf der anderen Seite möglich sind.");
  else setFeedback(5, "hint", "Denke in beide Richtungen: Zu wie vielen Schulklassen gehört ein Schüler? Wie viele Schüler hat eine Schulklasse?");
  saveState();
}

function checkStep6() {
  state.step6.users = document.getElementById("users-cardinality").value; state.step6.photos = document.getElementById("photos-cardinality").value; state.step6.checked = true;
  const usersCorrect = state.step6.users === "1";
  const photosCorrect = state.step6.photos === "n";
  if (usersCorrect && photosCorrect) { setFeedback(6, "success", "Richtig: Ein users-Datensatz kann mit vielen photos-Datensätzen verbunden sein."); markComplete(6); document.getElementById("diagram-reveal").hidden = false; }
  else if (!state.step6.users || !state.step6.photos) setFeedback(6, "hint", "Wähle an beiden Enden der Verbindung eine Kardinalität.");
  else if (usersCorrect || photosCorrect) setFeedback(6, "hint", "Eine Kardinalität stimmt schon. Übertrage die 1:n-Beziehung aus Schritt 2 noch einmal.");
  else setFeedback(6, "hint", "Übertrage die Beobachtung aus Schritt 2: Ein Benutzer kann mehrere Fotos besitzen.");
  saveState();
}

function checkStep7(event) {
  event.preventDefault();
  state.step7.one = document.querySelector('input[name="quiz-one"]:checked')?.value ?? "";
  state.step7.two = document.querySelector('input[name="quiz-two"]:checked')?.value ?? "";
  state.step7.three = document.querySelector('input[name="quiz-three"]:checked')?.value ?? ""; state.step7.checked = true;
  const results = [state.step7.one === "one-n", state.step7.two === "foreign", state.step7.three === "one-n"];
  if (results.every(Boolean)) {
    state.summaryUnlocked = true; setFeedback(7, "success", "Alles richtig. Deine Abschlussübersicht ist freigeschaltet."); markComplete(7); saveState(); setTimeout(() => navigateTo("summary"), 500);
  } else if (!state.step7.one || !state.step7.two || !state.step7.three) setFeedback(7, "hint", "Beantworte alle drei Fragen.");
  else {
    const wrongQuestions = results.map((correct, index) => correct ? null : index + 1).filter(Boolean);
    setFeedback(7, "hint", `Noch nicht ganz. Prüfe Frage ${wrongQuestions.join(" und ")} noch einmal.`);
  }
  saveState();
}

function renderSummary() {
  const entries = [
    ["1. Datensätze zuordnen", "Ordne Fotos ihren Benutzern zu.", "Mehrere Fotos können demselben Benutzer gehören."],
    ["2. 1:n-Beziehung", "Wie viele Fotos bzw. Benutzer gehören zusammen?", "Ein Benutzer kann mehrere Fotos besitzen; ein Foto gehört genau einem Benutzer."],
    ["3. Fremdschlüssel entdecken", "Welche Spalte verbindet die Tabellen?", "photos.user_id verweist auf users.id."],
    ["4. Fremdschlüssel anwenden", "Wähle die Spalte und trage die Benutzer-ID ein.", "Fremdschlüssel: photos.user_id."],
    ["5. Kardinalität verstehen", "Lies die Beziehung Schulklasse – Schüler.", "1 bei Schulklasse, n bei Schüler."],
    ["6. Klassendiagramm", "Ergänze die Kardinalitäten bei users und photos.", "users 1 ───── n photos."],
    ["7. Kurzquiz", "Sichere die drei Kernideen.", "1:n-Beziehung, Fremdschlüssel und Kardinalität richtig erkannt."],
  ];
  document.getElementById("answer-summary").innerHTML = entries.map(([title, prompt, result]) => `<section class="summary-section"><h3>${title}</h3><p class="prompt">${prompt}</p><dl class="summary-grid"><dt>Richtiges Ergebnis</dt><dd>${result}</dd></dl></section>`).join("");
}

function bindEvents() {
  document.getElementById("check-step1").addEventListener("click", checkStep1);
  document.getElementById("check-step2").addEventListener("click", checkStep2);
  document.getElementById("check-step3").addEventListener("click", checkStep3);
  document.getElementById("check-step4").addEventListener("click", checkStep4);
  document.getElementById("check-step5").addEventListener("click", checkStep5);
  document.getElementById("check-step6").addEventListener("click", checkStep6);
  document.getElementById("final-quiz").addEventListener("submit", checkStep7);
  document.getElementById("previous-step").addEventListener("click", () => {
    if (state.currentStep === "summary") navigateTo(7);
    else if (state.currentStep > 1) navigateTo(state.currentStep - 1);
  });
  document.getElementById("next-step").addEventListener("click", () => {
    if (state.currentStep < 7) navigateTo(state.currentStep + 1);
    else if (state.summaryUnlocked) navigateTo("summary");
  });
  document.getElementById("reset-module").addEventListener("click", () => { if (window.confirm("Möchtest du alle Eingaben und den Fortschritt zurücksetzen?")) { localStorage.removeItem(STORAGE_KEY); window.location.reload(); } });

  document.querySelectorAll('input[name="photos-per-user"], input[name="users-per-photo"]').forEach((input) => input.addEventListener("change", () => {
    state.step2.photos = document.querySelector('input[name="photos-per-user"]:checked')?.value ?? "";
    state.step2.users = document.querySelector('input[name="users-per-photo"]:checked')?.value ?? "";
    state.step2.checked = false; clearFeedback(2); saveState();
  }));
  document.querySelectorAll('input[name="foreign-column"]').forEach((input) => input.addEventListener("change", () => {
    state.step3.answer = input.value; state.step3.checked = false; clearFeedback(3); saveState();
  }));
  const persistStep4 = () => {
    state.step4.key = document.querySelector('input[name="step4-key"]:checked')?.value ?? "";
    state.step4.value = document.getElementById("new-photo-user-id").value.trim();
    state.step4.checked = false; clearFeedback(4); saveState();
  };
  document.querySelectorAll('input[name="step4-key"]').forEach((input) => input.addEventListener("change", persistStep4));
  document.getElementById("new-photo-user-id").addEventListener("input", persistStep4);
  document.querySelectorAll('input[name="school-cardinality"], input[name="pupils-cardinality"]').forEach((input) => input.addEventListener("change", () => {
    state.step5.school = document.querySelector('input[name="school-cardinality"]:checked')?.value ?? "";
    state.step5.pupils = document.querySelector('input[name="pupils-cardinality"]:checked')?.value ?? "";
    document.getElementById("school-left-label").textContent = state.step5.school || "?";
    document.getElementById("school-right-label").textContent = state.step5.pupils || "?";
    state.step5.checked = false; clearFeedback(5); saveState();
  }));
  document.querySelectorAll('#users-cardinality, #photos-cardinality').forEach((select) => select.addEventListener("change", () => {
    state.step6.users = document.getElementById("users-cardinality").value;
    state.step6.photos = document.getElementById("photos-cardinality").value;
    state.step6.checked = false; clearFeedback(6); saveState();
  }));
  document.querySelectorAll('input[name="quiz-one"], input[name="quiz-two"], input[name="quiz-three"]').forEach((input) => input.addEventListener("change", () => {
    state.step7.one = document.querySelector('input[name="quiz-one"]:checked')?.value ?? "";
    state.step7.two = document.querySelector('input[name="quiz-two"]:checked')?.value ?? "";
    state.step7.three = document.querySelector('input[name="quiz-three"]:checked')?.value ?? "";
    state.step7.checked = false; clearFeedback(7); saveState();
  }));
}

async function init() {
  try {
    lesson = await loadLesson(); renderData(); renderTabs(); bindEvents();
    document.getElementById("data-status").hidden = true; document.getElementById("learning-module").hidden = false;
    if (state.currentStep === "summary" && !state.summaryUnlocked) state.currentStep = 1;
    navigateTo(state.currentStep); updateNavigation();
  } catch (error) {
    const status = document.getElementById("data-status"); status.classList.add("error"); status.textContent = `Das Lernmodul konnte nicht geladen werden: ${error.message}`;
  }
}

document.addEventListener("DOMContentLoaded", init);
