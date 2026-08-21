const STORAGE_KEY = "informatik10-datenbanken-redundanzen-v2";
const STEP_TITLES = [
  "Doppelte Informationen",
  "E-Mail ändern",
  "Probleme",
  "Tabellen aufteilen",
  "Klassenkarte",
  "Tabellen verbinden",
  "Sicherung",
];

const STEP2_PROBLEMS = [
  ["repeat", "Dieselbe Änderung muss mehrfach vorgenommen werden."],
  ["forget", "Eine Stelle kann leicht vergessen werden."],
  ["conflict", "Für dieselbe Person können unterschiedliche E-Mail-Adressen gespeichert sein."],
  ["unclear", "Es ist dann nicht eindeutig, welche Adresse stimmt."],
];

const STEP3_CHOICES = [
  ["errors", "Änderungen sind fehleranfälliger."],
  ["inconsistent", "Es können Unstimmigkeiten entstehen."],
  ["storage", "Gleiche Informationen belegen unnötig mehrfach Speicherplatz."],
  ["repetition", "Eine Änderung muss an mehreren Stellen durchgeführt werden."],
  ["automatic", "Die Datenbank korrigiert alle Fehler automatisch."],
];

const ASSIGNMENT_FIELDS = [
  { key: "userId", label: "id", target: "users" },
  { key: "username", label: "username", target: "users" },
  { key: "email", label: "email", target: "users" },
  { key: "photoId", label: "id", target: "photos" },
  { key: "user_id", label: "user_id", target: "photos" },
  { key: "description", label: "description", target: "photos" },
  { key: "url", label: "url", target: "photos" },
  { key: "created_at", label: "created_at", target: "photos" },
  { key: "updated_at", label: "updated_at", target: "photos" },
];

const PHOTO_FIELDS = ["id", "user_id", "description", "url", "created_at", "updated_at"];
const CLASS_CARD_OPTIONS = [...PHOTO_FIELDS, "username", "email", "city"];

const DEFAULT_STATE = {
  currentStep: 1,
  completed: [],
  summaryUnlocked: false,
  step1: { selected: [], checked: false },
  step2: { emails: [], problems: [], checked: false, conceptRevealed: false },
  step3: { selected: [], checked: false },
  step4: { assignments: {}, checked: false },
  step5: { selected: [], checked: false },
  step6: { answer: "", checked: false },
  step7: {
    definition: "",
    problems: [],
    solution: "",
    assignment: { username: "", email: "", description: "", url: "" },
    checked: false,
  },
};

let state = loadState();
let example = null;
let draggedAttribute = null;

function cloneDefaultState() {
  return JSON.parse(JSON.stringify(DEFAULT_STATE));
}

function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!parsed || typeof parsed !== "object") return cloneDefaultState();
    const clean = cloneDefaultState();
    return {
      ...clean,
      ...parsed,
      step1: { ...clean.step1, ...parsed.step1 },
      step2: { ...clean.step2, ...parsed.step2 },
      step3: { ...clean.step3, ...parsed.step3 },
      step4: { ...clean.step4, ...parsed.step4 },
      step5: { ...clean.step5, ...parsed.step5 },
      step6: { ...clean.step6, ...parsed.step6 },
      step7: {
        ...clean.step7,
        ...parsed.step7,
        assignment: { ...clean.step7.assignment, ...parsed.step7?.assignment },
      },
    };
  } catch {
    return cloneDefaultState();
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    const status = document.getElementById("data-status");
    status.hidden = false;
    status.classList.add("error");
    status.textContent = "Hinweis: Deine Eingaben können in diesem Browser nicht dauerhaft gespeichert werden.";
  }
}

function parseDelimited(text, delimiter = ";") {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"') {
      if (quoted && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (quoted) {
        quoted = !quoted;
      } else if (field.length === 0) {
        quoted = true;
      } else {
        field += character;
      }
    } else if (character === delimiter && !quoted) {
      row.push(field);
      field = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      row.push(field);
      if (row.some((value) => value.length > 0)) rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  const [headers, ...records] = rows;
  if (!headers) return [];
  return records.map((values) => Object.fromEntries(headers.map((header, index) => [header.trim(), values[index] ?? ""])));
}

async function loadExample() {
  const [usersResponse, photosResponse] = await Promise.all([
    fetch("users.csv", { cache: "no-store" }),
    fetch("photos.csv", { cache: "no-store" }),
  ]);
  if (!usersResponse.ok || !photosResponse.ok) throw new Error("CSV-Dateien konnten nicht geladen werden.");
  const [usersText, photosText] = await Promise.all([usersResponse.text(), photosResponse.text()]);
  const users = parseDelimited(usersText);
  const photos = parseDelimited(photosText);
  const userById = new Map(users.map((user) => [user.id, user]));
  const photosByUser = new Map();
  photos.forEach((photo) => {
    if (!userById.has(photo.user_id)) return;
    const current = photosByUser.get(photo.user_id) ?? [];
    current.push(photo);
    photosByUser.set(photo.user_id, current);
  });
  const candidate = [...photosByUser.entries()]
    .filter(([, userPhotos]) => userPhotos.length >= 5)
    .sort((a, b) => b[1].length - a[1].length || Number(a[0]) - Number(b[0]))[0];
  if (!candidate) throw new Error("Es wurde kein Benutzer mit mindestens fünf Fotos gefunden.");
  const [userId, userPhotos] = candidate;
  const user = userById.get(userId);
  const selectedPhotos = userPhotos.slice(0, 5);
  const localPart = (user.username || "profil").replace(/[^a-z0-9._-]/gi, "");
  return {
    user,
    photos: selectedPhotos,
    newEmail: `${localPart}.neu@instahub.test`,
  };
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function basename(path) {
  return path.split("/").at(-1) || path;
}

function setFeedback(step, kind, message) {
  const element = document.getElementById(`feedback-step${step}`);
  element.className = `feedback ${kind}`;
  element.textContent = message;
}

function markComplete(step) {
  if (!state.completed.includes(step)) state.completed.push(step);
  saveState();
  updateNavigation();
}

function checkboxList(containerId, name, choices, selected) {
  const container = document.getElementById(containerId);
  container.innerHTML = choices.map(([value, label]) => `
    <label class="choice-option">
      <input type="checkbox" name="${name}" value="${escapeHtml(value)}" ${selected.includes(value) ? "checked" : ""}>
      <span>${escapeHtml(label)}</span>
    </label>`).join("");
}

function radioList(containerId, name, choices, selected) {
  const container = document.getElementById(containerId);
  container.innerHTML = choices.map(([value, label]) => `
    <label class="choice-option">
      <input type="radio" name="${name}" value="${escapeHtml(value)}" ${selected === value ? "checked" : ""}>
      <span>${escapeHtml(label)}</span>
    </label>`).join("");
}

function selectedValues(name) {
  return [...document.querySelectorAll(`input[name="${name}"]:checked`)].map((input) => input.value);
}

function renderTabs() {
  const tabs = document.getElementById("step-tabs");
  tabs.innerHTML = STEP_TITLES.map((title, index) => {
    const step = index + 1;
    return `<button id="tab-${step}" class="step-tab" type="button" role="tab" aria-controls="step-${step}" data-step="${step}"><span>${step}</span><small>${escapeHtml(title)}</small></button>`;
  }).join("") + `<button id="tab-summary" class="step-tab" type="button" role="tab" aria-controls="step-summary" data-step="summary" ${state.summaryUnlocked ? "" : "hidden"}><span>✓</span><small>Auswertung</small></button>`;
}

function redundantRows({ selectableHeadings = false } = {}) {
  const headings = ["username", "email", "description", "url", "created_at"];
  const headerHtml = headings.map((heading) => {
    if (!selectableHeadings) return `<th scope="col">${heading}</th>`;
    const pressed = state.step1.selected.includes(heading);
    return `<th scope="col"><button class="column-selector" type="button" data-column="${heading}" aria-pressed="${pressed}">${heading}</button></th>`;
  }).join("");
  const body = example.photos.map((photo) => `
    <tr>
      <td class="repeat-cell">${escapeHtml(example.user.username)}</td>
      <td class="repeat-cell">${escapeHtml(example.user.email)}</td>
      <td class="description-cell"><span class="truncate-text" title="${escapeHtml(photo.description)}">${escapeHtml(photo.description)}</span></td>
      <td class="url-cell" title="${escapeHtml(photo.url)}">${escapeHtml(basename(photo.url))}</td>
      <td>${escapeHtml(photo.created_at)}</td>
    </tr>`).join("");
  return `
    <div class="table-shell">
      <div class="table-caption"><strong>instahub_alles</strong><span>Didaktische Simulation aus users.csv + photos.csv</span></div>
      <div class="table-scroll"><table class="data-table">
        <thead><tr>${headerHtml}</tr></thead><tbody>${body}</tbody>
      </table></div>
    </div>`;
}

function renderStep1() {
  document.getElementById("redundant-table-step1").innerHTML = redundantRows({ selectableHeadings: true });
  document.querySelectorAll(".column-selector").forEach((button) => {
    button.addEventListener("click", () => {
      const column = button.dataset.column;
      state.step1.selected = state.step1.selected.includes(column)
        ? state.step1.selected.filter((item) => item !== column)
        : [...state.step1.selected, column];
      state.step1.checked = false;
      saveState();
      renderStep1();
    });
  });
  document.getElementById("check-step1").onclick = () => {
    const correct = ["username", "email"];
    const selected = state.step1.selected;
    state.step1.checked = true;
    saveState();
    if (correct.every((item) => selected.includes(item)) && selected.every((item) => correct.includes(item))) {
      setFeedback(1, "success", "Richtig: Benutzername und E-Mail-Adresse stehen für jedes Foto erneut in der Tabelle.");
      markComplete(1);
    } else if (selected.some((item) => ["description", "url", "created_at"].includes(item))) {
      setFeedback(1, "hint", "Sieh dir die Zeilen genau an: Fotobeschreibung, URL und Zeitpunkt gehören jeweils zu einem anderen Foto.");
    } else {
      setFeedback(1, "hint", "Tipp: Suche nach Informationen über die Person, die in jeder Zeile gleich sind.");
    }
  };
  if (state.step1.checked && state.completed.includes(1)) setFeedback(1, "success", "Richtig: Benutzername und E-Mail-Adresse stehen für jedes Foto erneut in der Tabelle.");
}

function ensureEmailState() {
  if (state.step2.emails.length !== example.photos.length) {
    state.step2.emails = example.photos.map(() => example.user.email);
    saveState();
  }
}

function updateEmailVisuals() {
  const normalized = state.step2.emails.map((value) => value.trim().toLowerCase());
  const hasConflict = new Set(normalized).size > 1;
  let updatedCount = 0;
  document.querySelectorAll("[data-email-index]").forEach((input) => {
    const index = Number(input.dataset.emailIndex);
    const changed = normalized[index] === example.newEmail.toLowerCase();
    if (changed) updatedCount += 1;
    input.classList.toggle("changed", changed && !hasConflict);
    input.classList.toggle("conflict", hasConflict);
    const status = input.closest("tr").querySelector(".row-status");
    status.className = `row-status ${hasConflict ? "conflict" : changed ? "new" : ""}`;
    status.textContent = hasConflict ? (changed ? "neu" : "alt") : changed ? "aktualisiert" : "noch alt";
  });
  const caption = document.querySelector("#email-table .table-caption span");
  if (caption) caption.textContent = `${updatedCount} von ${example.photos.length} Zeilen aktualisiert`;
  const alert = document.getElementById("inconsistency-alert");
  alert.hidden = !hasConflict;
  if (hasConflict) alert.innerHTML = `<strong>Jetzt widersprechen sich die Zeilen.</strong> Für ${escapeHtml(example.user.username)} stehen verschiedene E-Mail-Adressen in derselben Tabelle.`;
}

function renderEmailTable() {
  ensureEmailState();
  const distinct = new Set(state.step2.emails.map((value) => value.trim().toLowerCase()));
  const hasConflict = distinct.size > 1;
  const rows = example.photos.map((photo, index) => {
    const value = state.step2.emails[index];
    const changed = value.trim().toLowerCase() === example.newEmail.toLowerCase();
    const statusClass = hasConflict ? "conflict" : changed ? "new" : "";
    const statusText = hasConflict ? (changed ? "neu" : "alt") : changed ? "aktualisiert" : "noch alt";
    return `<tr>
      <td>${escapeHtml(photo.id)}</td>
      <td>${escapeHtml(example.user.username)}</td>
      <td><label class="visually-hidden" for="email-row-${index}">E-Mail-Adresse in Datensatz ${index + 1}</label><input id="email-row-${index}" class="email-input ${statusClass}" data-email-index="${index}" type="email" value="${escapeHtml(value)}" spellcheck="false"></td>
      <td class="description-cell"><span class="truncate-text">${escapeHtml(photo.description)}</span></td>
      <td><span class="row-status ${statusClass}">${statusText}</span></td>
    </tr>`;
  }).join("");
  document.getElementById("email-table").innerHTML = `
    <div class="table-shell">
      <div class="table-caption"><strong>instahub_alles</strong><span>${state.step2.emails.filter((value) => value.toLowerCase() === example.newEmail.toLowerCase()).length} von ${example.photos.length} Zeilen aktualisiert</span></div>
      <div class="table-scroll"><table class="data-table">
        <thead><tr><th>photo_id</th><th>username</th><th>email</th><th>description</th><th>Status</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
    </div>`;
  document.querySelectorAll("[data-email-index]").forEach((input) => {
    input.addEventListener("input", () => {
      state.step2.emails[Number(input.dataset.emailIndex)] = input.value;
      state.step2.checked = false;
      saveState();
      updateEmailVisuals();
      if (state.step2.conceptRevealed && state.step2.emails.every((value) => value.trim().toLowerCase() === example.newEmail.toLowerCase())) {
        setFeedback(2, "success", `Jetzt sind alle ${example.photos.length} Datensätze aktualisiert. Genau dieser Mehrfachaufwand ist das Problem.`);
        markComplete(2);
      }
    });
  });
  updateEmailVisuals();
}

function renderStep2() {
  document.getElementById("email-user-label").textContent = `${example.user.name || example.user.username} (@${example.user.username})`;
  document.getElementById("target-email").textContent = example.newEmail;
  renderEmailTable();
  checkboxList("step2-problems", "step2Problems", STEP2_PROBLEMS, state.step2.problems);
  document.querySelectorAll('input[name="step2Problems"]').forEach((input) => {
    input.addEventListener("change", () => {
      state.step2.problems = selectedValues("step2Problems");
      state.step2.checked = false;
      saveState();
    });
  });
  document.getElementById("check-step2-problem").onclick = () => {
    state.step2.problems = selectedValues("step2Problems");
    state.step2.checked = true;
    const correct = STEP2_PROBLEMS.map(([value]) => value);
    const mismatch = new Set(state.step2.emails.map((value) => value.trim().toLowerCase())).size > 1;
    if (!mismatch && state.step2.emails.every((value) => value === example.user.email)) {
      setFeedback(2, "hint", "Ändere zuerst mindestens eine E-Mail-Adresse in der Tabelle und beobachte die Statusanzeige.");
    } else if (correct.every((value) => state.step2.problems.includes(value))) {
      state.step2.conceptRevealed = true;
      const allUpdated = state.step2.emails.every((value) => value.trim().toLowerCase() === example.newEmail.toLowerCase());
      if (allUpdated) {
        setFeedback(2, "success", `Richtig erkannt – und alle ${example.photos.length} Datensätze sind aktualisiert.`);
        markComplete(2);
      } else {
        const remaining = state.step2.emails.filter((value) => value.trim().toLowerCase() !== example.newEmail.toLowerCase()).length;
        setFeedback(2, "hint", `Problem richtig erkannt. Aktualisiere jetzt noch die übrigen ${remaining} Datensätze selbst.`);
      }
    } else {
      setFeedback(2, "hint", "Denke an den Moment nach der ersten Änderung: Wie viele Stellen bleiben übrig und welche Adressen stehen dann für dieselbe Person da?");
    }
    saveState();
    document.getElementById("concept-reveal").hidden = !state.step2.conceptRevealed;
  };
  document.getElementById("concept-reveal").hidden = !state.step2.conceptRevealed;
  if (state.step2.checked && state.completed.includes(2)) setFeedback(2, "success", `Richtig erkannt – und alle ${example.photos.length} Datensätze sind aktualisiert.`);
}

function renderStep3() {
  checkboxList("step3-choices", "step3Choices", STEP3_CHOICES, state.step3.selected);
  document.querySelectorAll('input[name="step3Choices"]').forEach((input) => input.addEventListener("change", () => {
    state.step3.selected = selectedValues("step3Choices");
    state.step3.checked = false;
    saveState();
  }));
  document.getElementById("check-step3").onclick = () => {
    state.step3.selected = selectedValues("step3Choices");
    state.step3.checked = true;
    const correct = ["errors", "inconsistent", "storage", "repetition"];
    if (correct.every((value) => state.step3.selected.includes(value)) && !state.step3.selected.includes("automatic")) {
      setFeedback(3, "success", "Alles richtig. Redundanz kostet Speicher und macht Änderungen aufwendig und fehleranfällig.");
      document.getElementById("step3-summary").hidden = false;
      markComplete(3);
    } else {
      setFeedback(3, "hint", "Prüfe noch einmal: Welche Folgen entstehen wirklich durch das Wiederholen derselben Information?");
    }
    saveState();
  };
  document.getElementById("step3-summary").hidden = !state.completed.includes(3);
  if (state.step3.checked && state.completed.includes(3)) setFeedback(3, "success", "Alles richtig. Redundanz kostet Speicher und macht Änderungen aufwendig und fehleranfällig.");
}

function moveAttribute(key, zone) {
  const current = state.step4.assignments[key] || "pool";
  if (zone) state.step4.assignments[key] = zone;
  else state.step4.assignments[key] = current === "pool" ? "users" : current === "users" ? "photos" : "pool";
  state.step4.checked = false;
  saveState();
  renderStep4();
}

function renderZone(zone, title, hint) {
  const items = ASSIGNMENT_FIELDS.filter((field) => (state.step4.assignments[field.key] || "pool") === zone);
  return `<section class="attribute-zone" data-zone="${zone}" aria-label="${escapeHtml(title)}">
    <h3><span>${escapeHtml(title)}</span><small>${escapeHtml(hint)}</small></h3>
    <div class="attribute-list">${items.map((field) => `<button class="attribute-chip" type="button" draggable="true" data-attribute="${field.key}" title="Klicken oder ziehen, um zu verschieben">${field.label}</button>`).join("")}</div>
  </section>`;
}

function renderStep4() {
  document.getElementById("attribute-assignment").innerHTML = [
    renderZone("pool", "Noch nicht zugeordnet", "Attributkarten"),
    renderZone("users", "Tabelle users", "über Benutzer"),
    renderZone("photos", "Tabelle photos", "über Fotos"),
  ].join("");
  document.querySelectorAll(".attribute-chip").forEach((chip) => {
    chip.addEventListener("click", () => moveAttribute(chip.dataset.attribute));
    chip.addEventListener("dragstart", () => { draggedAttribute = chip.dataset.attribute; });
  });
  document.querySelectorAll(".attribute-zone").forEach((zone) => {
    zone.addEventListener("dragover", (event) => { event.preventDefault(); zone.classList.add("drag-over"); });
    zone.addEventListener("dragleave", () => zone.classList.remove("drag-over"));
    zone.addEventListener("drop", (event) => {
      event.preventDefault();
      zone.classList.remove("drag-over");
      if (draggedAttribute) moveAttribute(draggedAttribute, zone.dataset.zone);
      draggedAttribute = null;
    });
  });
  document.getElementById("check-step4").onclick = () => {
    const wrong = ASSIGNMENT_FIELDS.filter((field) => state.step4.assignments[field.key] !== field.target);
    state.step4.checked = true;
    if (wrong.length === 0) {
      setFeedback(4, "success", "Richtig aufgeteilt: Benutzerdaten werden einmal in users gespeichert, Fotodaten in photos.");
      document.getElementById("split-visual").hidden = false;
      markComplete(4);
    } else if (wrong.some((field) => !state.step4.assignments[field.key] || state.step4.assignments[field.key] === "pool")) {
      setFeedback(4, "hint", "Ordne zuerst alle Karten zu. Tipp: user_id verrät beim Foto, zu welchem Benutzer es gehört.");
    } else {
      setFeedback(4, "hint", "Noch nicht ganz. Frage bei jeder Karte: Beschreibt dieses Attribut die Person oder ein einzelnes Foto?");
    }
    saveState();
  };
  document.getElementById("split-visual").hidden = !state.completed.includes(4);
  if (state.step4.checked && state.completed.includes(4)) setFeedback(4, "success", "Richtig aufgeteilt: Benutzerdaten werden einmal in users gespeichert, Fotodaten in photos.");
}

function renderStep5() {
  document.getElementById("class-card-options").innerHTML = CLASS_CARD_OPTIONS.map((field) => `
    <button class="attribute-chip ${state.step5.selected.includes(field) ? "selected" : ""}" type="button" data-class-field="${field}" aria-pressed="${state.step5.selected.includes(field)}">${field}</button>`).join("");
  document.querySelectorAll("[data-class-field]").forEach((button) => button.addEventListener("click", () => {
    const field = button.dataset.classField;
    state.step5.selected = state.step5.selected.includes(field)
      ? state.step5.selected.filter((item) => item !== field)
      : [...state.step5.selected, field];
    state.step5.checked = false;
    saveState();
    renderStep5();
  }));
  const selected = CLASS_CARD_OPTIONS.filter((field) => state.step5.selected.includes(field));
  document.getElementById("photos-class-list").innerHTML = selected.length
    ? selected.map((field) => `<li>${field}</li>`).join("")
    : '<li class="placeholder-row">Attribute auswählen …</li>';
  document.getElementById("check-step5").onclick = () => {
    state.step5.checked = true;
    const correct = PHOTO_FIELDS.every((field) => state.step5.selected.includes(field)) && state.step5.selected.every((field) => PHOTO_FIELDS.includes(field));
    if (correct) {
      setFeedback(5, "success", "Klassenkarte vollständig: Jedes Foto erhält eine eigene id und verweist mit user_id auf seinen Benutzer.");
      markComplete(5);
    } else if (state.step5.selected.some((field) => ["username", "email", "city"].includes(field))) {
      setFeedback(5, "hint", "Einige ausgewählte Attribute beschreiben den Benutzer. Sie gehören bereits in die Klassenkarte users.");
    } else {
      setFeedback(5, "hint", "Es fehlen noch Fotoattribute. Denke neben Beschreibung und URL auch an Kennnummer, Zuordnung und Zeitpunkte.");
    }
    saveState();
  };
  if (state.step5.checked && state.completed.includes(5)) setFeedback(5, "success", "Klassenkarte vollständig: Jedes Foto erhält eine eigene id und verweist mit user_id auf seinen Benutzer.");
}

function renderStep6() {
  const user = example.user;
  const photos = example.photos.slice(0, 3);
  document.getElementById("relation-tables").innerHTML = `
    <article class="mini-table-card"><h3>users</h3><table>
      <thead><tr><th class="${state.completed.includes(6) ? "link-column" : ""}">id</th><th>username</th><th>email</th></tr></thead>
      <tbody><tr><td class="${state.completed.includes(6) ? "link-column" : ""}">${escapeHtml(user.id)}</td><td>${escapeHtml(user.username)}</td><td>${escapeHtml(user.email)}</td></tr></tbody>
    </table></article>
    <article class="mini-table-card"><h3>photos</h3><table>
      <thead><tr><th>id</th><th class="${state.completed.includes(6) ? "link-column" : ""}">user_id</th><th>description</th></tr></thead>
      <tbody>${photos.map((photo) => `<tr><td>${escapeHtml(photo.id)}</td><td class="${state.completed.includes(6) ? "link-column" : ""}">${escapeHtml(photo.user_id)}</td><td><span class="truncate-text">${escapeHtml(photo.description)}</span></td></tr>`).join("")}</tbody>
    </table></article>`;
  radioList("step6-options", "step6Answer", [
    ["email", "An der erneut gespeicherten E-Mail-Adresse in photos"],
    ["photo-id", "An der Foto-ID photos.id"],
    ["user-id", "An photos.user_id, die denselben Wert wie users.id enthält"],
  ], state.step6.answer);
  document.querySelectorAll('input[name="step6Answer"]').forEach((input) => input.addEventListener("change", () => {
    state.step6.answer = input.value;
    state.step6.checked = false;
    saveState();
  }));
  document.getElementById("check-step6").onclick = () => {
    state.step6.answer = document.querySelector('input[name="step6Answer"]:checked')?.value ?? "";
    state.step6.checked = true;
    if (state.step6.answer === "user-id") {
      setFeedback(6, "success", "Richtig: Die user_id im Foto zeigt auf die id des Benutzers.");
      markComplete(6);
      renderStep6();
    } else if (!state.step6.answer) {
      setFeedback(6, "hint", "Wähle zuerst eine Antwort aus.");
    } else {
      setFeedback(6, "hint", "Vergleiche die Zahlenwerte in beiden Tabellen. Welche Spalten enthalten denselben Benutzerwert?");
    }
    saveState();
  };
  document.getElementById("relation-reveal").hidden = !state.completed.includes(6);
  if (state.step6.checked && state.completed.includes(6)) setFeedback(6, "success", "Richtig: Die user_id im Foto zeigt auf die id des Benutzers.");
}

function renderStep7() {
  radioList("final-definition", "finalDefinition", [
    ["repeat", "Dieselbe Information wird mehrfach gespeichert."],
    ["delete", "Alle alten Daten werden gelöscht."],
    ["relation", "Zwei Tabellen besitzen denselben Namen."],
  ], state.step7.definition);
  checkboxList("final-problems", "finalProblems", [
    ["changes", "Änderungen müssen mehrfach vorgenommen werden."],
    ["contradictions", "Informationen können sich widersprechen."],
    ["inconsistency", "Es können Inkonsistenzen entstehen."],
    ["unique", "Jede Information wird automatisch eindeutig."],
  ], state.step7.problems);
  radioList("final-solution", "finalSolution", [
    ["split", "Benutzer- und Fotoinformationen werden getrennt gespeichert."],
    ["copy", "Die Benutzerdaten werden noch öfter kopiert."],
    ["remove", "Alle Fotobeschreibungen werden entfernt."],
  ], state.step7.solution);
  const assignments = [["username", "username"], ["email", "email"], ["description", "description"], ["url", "url"]];
  document.getElementById("final-assignment").innerHTML = assignments.map(([key, label]) => `
    <label class="mini-assignment-row"><code>${label}</code><select data-final-field="${key}">
      <option value="">Bitte wählen</option><option value="users" ${state.step7.assignment[key] === "users" ? "selected" : ""}>users</option><option value="photos" ${state.step7.assignment[key] === "photos" ? "selected" : ""}>photos</option>
    </select></label>`).join("");
  document.querySelectorAll("#final-quiz input, #final-quiz select").forEach((control) => control.addEventListener("change", () => {
    state.step7.definition = document.querySelector('input[name="finalDefinition"]:checked')?.value ?? "";
    state.step7.problems = selectedValues("finalProblems");
    state.step7.solution = document.querySelector('input[name="finalSolution"]:checked')?.value ?? "";
    document.querySelectorAll("[data-final-field]").forEach((select) => { state.step7.assignment[select.dataset.finalField] = select.value; });
    state.step7.checked = false;
    saveState();
  }));
  document.getElementById("final-quiz").onsubmit = (event) => {
    event.preventDefault();
    state.step7.definition = document.querySelector('input[name="finalDefinition"]:checked')?.value ?? "";
    state.step7.problems = selectedValues("finalProblems");
    state.step7.solution = document.querySelector('input[name="finalSolution"]:checked')?.value ?? "";
    document.querySelectorAll("[data-final-field]").forEach((select) => { state.step7.assignment[select.dataset.finalField] = select.value; });
    state.step7.checked = true;
    const results = [
      state.step7.definition === "repeat",
      ["changes", "contradictions", "inconsistency"].every((value) => state.step7.problems.includes(value)) && !state.step7.problems.includes("unique"),
      state.step7.solution === "split",
      state.step7.assignment.username === "users" && state.step7.assignment.email === "users" && state.step7.assignment.description === "photos" && state.step7.assignment.url === "photos",
    ];
    if (results.every(Boolean)) {
      setFeedback(7, "success", "Stark – alle vier Bereiche sind richtig. Deine Auswertung ist jetzt freigeschaltet.");
      state.summaryUnlocked = true;
      markComplete(7);
      renderTabs();
      bindTabEvents();
      updateNavigation();
      renderSummary();
    } else {
      const wrongNumbers = results.map((correct, index) => correct ? null : index + 1).filter(Boolean);
      setFeedback(7, "hint", `Noch nicht ganz. Prüfe Bereich ${wrongNumbers.join(", ")}. Deine bisherigen Antworten bleiben gespeichert.`);
    }
    saveState();
  };
  if (state.step7.checked && state.completed.includes(7)) setFeedback(7, "success", "Stark – alle vier Bereiche sind richtig. Deine Auswertung ist jetzt freigeschaltet.");
}

function labelsFor(values, choices) {
  const map = new Map(choices);
  return values.length ? values.map((value) => map.get(value) || value).join(" · ") : "Noch keine Auswahl";
}

function completionBadge(step) {
  return state.completed.includes(step)
    ? '<span class="summary-result complete">✓ bearbeitet</span>'
    : '<span class="summary-result open">noch offen</span>';
}

function summarySection(step, title, prompt, rows) {
  return `<section class="summary-section"><h3>${step} – ${escapeHtml(title)} ${completionBadge(step)}</h3><p class="prompt">${escapeHtml(prompt)}</p><dl class="summary-grid">${rows.map(([term, description]) => `<dt>${escapeHtml(term)}</dt><dd>${escapeHtml(description)}</dd>`).join("")}</dl></section>`;
}

function renderSummary() {
  if (!example) return;
  const emailRows = state.step2.emails.map((email, index) => `Datensatz ${index + 1}: ${email || "(leer)"}`).join(" | ");
  const groupedAssignments = ["users", "photos", "pool"].map((zone) => {
    const values = ASSIGNMENT_FIELDS.filter((field) => (state.step4.assignments[field.key] || "pool") === zone).map((field) => field.label);
    return `${zone === "pool" ? "nicht zugeordnet" : zone}: ${values.join(", ") || "–"}`;
  }).join(" | ");
  const finalAssignment = Object.entries(state.step7.assignment).map(([field, table]) => `${field} → ${table || "offen"}`).join(" | ");
  document.getElementById("answer-summary").innerHTML = [
    summarySection(1, "Doppelte Informationen", "Welche Informationen kommen mehrfach vor?", [
      ["Deine Markierung", state.step1.selected.join(", ") || "Noch keine Markierung"],
      ["Richtiges Ergebnis", "username und email"],
    ]),
    summarySection(2, "E-Mail-Adresse ändern", "Passe die E-Mail-Adresse in allen Datensätzen an und beschreibe das Problem.", [
      ["Eingaben", emailRows],
      ["Deine Problemauswahl", labelsFor(state.step2.problems, STEP2_PROBLEMS)],
      ["Erkenntnis", "Mehrfach gespeicherte Daten können sich nach einer Änderung widersprechen."],
    ]),
    summarySection(3, "Probleme durch Redundanz", "Welche Probleme entstehen durch die Mehrfachspeicherung?", [
      ["Deine Auswahl", labelsFor(state.step3.selected, STEP3_CHOICES)],
      ["Richtiges Ergebnis", "Fehleranfälligkeit, Inkonsistenzen, Mehrfachspeicherung und wiederholte Änderungen"],
    ]),
    summarySection(4, "Tabellen aufteilen", "Ordne die Attribute users oder photos zu.", [
      ["Deine Zuordnung", groupedAssignments],
      ["Richtiges Ergebnis", "users: id, username, email | photos: id, user_id, description, url, created_at, updated_at"],
    ]),
    summarySection(5, "Klassenkarte", "Vervollständige die Klassenkarte photos.", [
      ["Deine Auswahl", state.step5.selected.join(", ") || "Noch keine Auswahl"],
      ["Richtiges Ergebnis", PHOTO_FIELDS.join(", ")],
    ]),
    summarySection(6, "Verbindung der Tabellen", "Woran erkennt die Datenbank den Benutzer eines Fotos?", [
      ["Deine Antwort", labelsFor(state.step6.answer ? [state.step6.answer] : [], [["email", "erneut gespeicherte E-Mail"], ["photo-id", "photos.id"], ["user-id", "photos.user_id ↔ users.id"]])],
      ["Richtiges Ergebnis", "users.id ↔ photos.user_id"],
    ]),
    summarySection(7, "Sicherung", "Begriff, Problem, Lösung und Attributzuordnung", [
      ["Redundanz", labelsFor(state.step7.definition ? [state.step7.definition] : [], [["repeat", "mehrfache Speicherung derselben Information"], ["delete", "alte Daten löschen"], ["relation", "gleiche Tabellennamen"]])],
      ["Probleme", labelsFor(state.step7.problems, [["changes", "mehrfache Änderungen"], ["contradictions", "Widersprüche"], ["inconsistency", "Inkonsistenzen"], ["unique", "automatische Eindeutigkeit"]])],
      ["Lösung", labelsFor(state.step7.solution ? [state.step7.solution] : [], [["split", "Benutzer- und Fotodaten trennen"], ["copy", "Benutzerdaten öfter kopieren"], ["remove", "Fotobeschreibungen entfernen"]])],
      ["Zuordnung", finalAssignment],
      ["Richtiges Ergebnis", "Redundanz vermeiden: users und photos trennen und über die Benutzer-ID verbinden."],
    ]),
  ].join("");
}

function renderAll() {
  renderTabs();
  renderStep1();
  renderStep2();
  renderStep3();
  renderStep4();
  renderStep5();
  renderStep6();
  renderStep7();
  renderSummary();
  bindTabEvents();
  updateNavigation();
}

function bindTabEvents() {
  document.querySelectorAll(".step-tab").forEach((tab) => {
    tab.addEventListener("click", () => showStep(tab.dataset.step));
    tab.addEventListener("keydown", (event) => {
      if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      event.preventDefault();
      const visibleTabs = [...document.querySelectorAll(".step-tab:not([hidden])")];
      const index = visibleTabs.indexOf(tab);
      const offset = event.key === 'ArrowRight' ? 1 : -1;
      visibleTabs[(index + offset + visibleTabs.length) % visibleTabs.length].focus();
    });
  });
}

function showStep(step) {
  if (step === "summary" && !state.summaryUnlocked) return;
  state.currentStep = step === "summary" ? "summary" : Math.max(1, Math.min(7, Number(step)));
  document.querySelectorAll(".step-panel").forEach((panel) => { panel.hidden = true; });
  document.querySelectorAll(".step-tab").forEach((tab) => tab.setAttribute("aria-selected", "false"));
  const panelId = state.currentStep === "summary" ? "step-summary" : `step-${state.currentStep}`;
  const tabId = state.currentStep === "summary" ? "tab-summary" : `tab-${state.currentStep}`;
  document.getElementById(panelId).hidden = false;
  document.getElementById(tabId)?.setAttribute("aria-selected", "true");
  if (state.currentStep === "summary") renderSummary();
  saveState();
  updateNavigation();
  document.getElementById("learning-module").scrollIntoView({ behavior: "smooth", block: "start" });
}

function updateNavigation() {
  const completedCount = state.completed.filter((step) => step >= 1 && step <= 7).length;
  const percentage = Math.round((completedCount / 7) * 100);
  document.getElementById("progress-bar").style.width = `${percentage}%`;
  document.getElementById("progress-percent").textContent = `${percentage} % bearbeitet`;
  document.getElementById("progress-label").textContent = state.currentStep === "summary" ? "Auswertung" : `Schritt ${state.currentStep} von 7`;
  document.querySelectorAll(".step-tab[data-step]").forEach((tab) => {
    const step = Number(tab.dataset.step);
    tab.classList.toggle("is-complete", Number.isFinite(step) && state.completed.includes(step));
    tab.setAttribute("aria-selected", String(tab.dataset.step === String(state.currentStep)));
  });
  const previous = document.getElementById("previous-step");
  const next = document.getElementById("next-step");
  if (state.currentStep === "summary") {
    previous.disabled = false;
    previous.textContent = "← Zur Sicherung";
    next.hidden = true;
  } else {
    previous.disabled = state.currentStep === 1;
    previous.textContent = "← Zurück";
    next.hidden = false;
    if (state.currentStep === 7) next.textContent = state.summaryUnlocked ? "Zur Auswertung →" : "Sicherung zuerst auswerten";
    else next.textContent = "Weiter →";
    next.disabled = state.currentStep === 7 && !state.summaryUnlocked;
  }
}

function bindGlobalEvents() {
  document.getElementById("previous-step").addEventListener("click", () => {
    if (state.currentStep === "summary") showStep(7);
    else if (state.currentStep > 1) showStep(state.currentStep - 1);
  });
  document.getElementById("next-step").addEventListener("click", () => {
    if (state.currentStep < 7) showStep(state.currentStep + 1);
    else if (state.summaryUnlocked) showStep("summary");
  });
  document.getElementById("print-summary").addEventListener("click", () => window.print());
  document.getElementById("reset-module").addEventListener("click", () => {
    if (!window.confirm("Möchtest du wirklich alle Eingaben dieses Lernmoduls löschen?")) return;
    localStorage.removeItem(STORAGE_KEY);
    state = cloneDefaultState();
    renderAll();
    showStep(1);
  });
}

async function init() {
  try {
    example = await loadExample();
    ensureEmailState();
    renderAll();
    bindGlobalEvents();
    document.getElementById("data-status").hidden = true;
    document.getElementById("learning-module").hidden = false;
    showStep(state.currentStep === "summary" && !state.summaryUnlocked ? 7 : state.currentStep);
  } catch (error) {
    const status = document.getElementById("data-status");
    status.classList.add("error");
    status.innerHTML = `<strong>Die InstaHub-Daten konnten nicht geladen werden.</strong><span>${escapeHtml(error.message)} Öffne die Seite über den Webserver des Projekts und lade sie erneut.</span>`;
  }
}

if (typeof document !== "undefined") init();

export { parseDelimited };
