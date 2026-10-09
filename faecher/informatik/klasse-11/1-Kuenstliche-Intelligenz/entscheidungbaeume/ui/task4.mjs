import { FISH_DEPTH_RESULTS, numberMatches, percentageMatches } from "../logic/fish-depth.mjs";
import { evaluateSemanticAnswer } from "./semantic-answer.mjs";

const SCRIPT_SERVER_URL = "https://script.google.com/macros/s/AKfycby8RWL6uYrKZyoJ6m2GRpWyRmXjwsdskyCiqzKpRhIK5-wrDl-9lWWk8CiAGaVMoy0x/exec";
const MAX_LENGTH = 3000;
const DEPTH_NOTE = "Die Trainingsfehler sinken bei größerer Tiefe, die Genauigkeit auf diesen fünf Testfischen bleibt jedoch gleich. In dieser Tabelle führen weniger Trainingsfehler daher nicht zu einer höheren Testgenauigkeit.";
const SOLUTION_CODE = "M8TR-DP7H";
const STEP_IDS = ["task41", "task42", "task4a", "task4abschluss"];
const STORAGE_KEY = "informatik11-ki-aufgabe4-v1";

const semanticTasks = [
  { answerId: "depth-one-answer", buttonId: "check-depth-one", feedbackId: "depth-one-feedback", countId: "depth-one-count", taskId: "11-4-1" },
  { answerId: "depth-description-answer", buttonId: "check-depth-description", feedbackId: "depth-description-feedback", countId: "depth-description-count", taskId: "11-4-2", noteId: "depth-description-note" },
];

let activeStepIndex = 0;

// Zwischenstand: aktiver Reiter, Freitexte und Tabelleneinträge (Rückmeldungen entstehen beim Prüfen neu).
function loadState() {
  const emptyState = { activeStep: STEP_IDS[0], fields: {}, checks: {}, comparisonUnlocked: false, resultsUnlocked: false };
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return emptyState;
    const fields = parsed.fields && typeof parsed.fields === "object" && !Array.isArray(parsed.fields) ? parsed.fields : {};
    const checks = parsed.checks && typeof parsed.checks === "object" && !Array.isArray(parsed.checks) ? parsed.checks : {};
    return {
      activeStep: STEP_IDS.includes(parsed.activeStep) ? parsed.activeStep : STEP_IDS[0],
      fields: Object.fromEntries(Object.entries(fields).filter(([, value]) => typeof value === "string").map(([key, value]) => [key, value.slice(0, MAX_LENGTH)])),
      checks: Object.fromEntries(Object.entries(checks).filter(([, value]) => typeof value === "boolean")),
      comparisonUnlocked: parsed.comparisonUnlocked === true,
      resultsUnlocked: parsed.resultsUnlocked === true,
    };
  } catch { return emptyState; }
}
const state = loadState();
function saveState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* ohne Speicher weiterarbeiten */ }
}
function fieldKey(element) {
  return element.id || `depth-${element.dataset.depth}-${element.dataset.field}`;
}
function persistFields() {
  document.querySelectorAll(".task4-answer, .task4-table-input").forEach((element) => {
    const key = fieldKey(element);
    if (typeof state.fields[key] === "string") {
      element.value = state.fields[key].slice(0, MAX_LENGTH);
      element.dispatchEvent(new Event("input", { bubbles: true }));
    }
    element.addEventListener("input", () => { state.fields[key] = element.value; saveState(); });
  });
}

function setupCheckboxPersistence() {
  document.querySelectorAll('input[type="checkbox"]').forEach((input) => {
    const key = `${input.closest("form").id}:${input.value}`;
    input.checked = state.checks[key] === true;
    input.addEventListener("change", () => { state.checks[key] = input.checked; saveState(); });
  });
}

function showStep(stepId, moveFocus = false) {
  const nextIndex = STEP_IDS.indexOf(stepId);
  if (nextIndex < 0) return;
  activeStepIndex = nextIndex;
  state.activeStep = stepId;
  saveState();
  document.querySelectorAll("[data-step-panel]").forEach((panel) => {
    panel.hidden = panel.dataset.stepPanel !== stepId;
  });
  document.querySelectorAll("[data-step-tab]").forEach((tab) => {
    const isActive = tab.dataset.stepTab === stepId;
    tab.setAttribute("aria-selected", String(isActive));
    tab.tabIndex = isActive ? 0 : -1;
    if (isActive && moveFocus) tab.focus();
  });
  document.querySelector("#task4-previous").disabled = activeStepIndex === 0;
  const nextButton = document.querySelector("#task4-next");
  nextButton.disabled = activeStepIndex === STEP_IDS.length - 1;
  nextButton.textContent = nextButton.disabled ? "Letzte Teilaufgabe" : "Weiter →";
}

function setupTabs() {
  document.querySelectorAll("[data-step-tab]").forEach((tab) => {
    tab.addEventListener("click", () => showStep(tab.dataset.stepTab));
    tab.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
      event.preventDefault();
      const current = STEP_IDS.indexOf(tab.dataset.stepTab);
      const target = event.key === "Home" ? 0
        : event.key === "End" ? STEP_IDS.length - 1
          : (current + (event.key === "ArrowRight" ? 1 : -1) + STEP_IDS.length) % STEP_IDS.length;
      showStep(STEP_IDS[target], true);
    });
  });
  document.querySelector("#task4-previous").addEventListener("click", () => showStep(STEP_IDS[activeStepIndex - 1]));
  document.querySelector("#task4-next").addEventListener("click", () => showStep(STEP_IDS[activeStepIndex + 1]));
  showStep(state.activeStep);
}

function appendFeedbackList(container, title, items, fallback) {
  const heading = document.createElement("h4");
  heading.textContent = title;
  const list = document.createElement("ul");
  (Array.isArray(items) && items.length ? items : [fallback]).forEach((text) => {
    const item = document.createElement("li");
    item.textContent = text;
    list.append(item);
  });
  container.append(heading, list);
}

function renderSemanticResult(container, result) {
  container.replaceChildren();
  container.hidden = false;
  const complete = Number(result.points) >= Math.ceil(Number(result.maxPoints) * 0.75);
  container.className = `fish-semantic-feedback${complete ? " success" : ""}`;
  const heading = document.createElement("h3");
  heading.textContent = `${result.points} von ${result.maxPoints} Punkten – ${result.status}`;
  container.append(heading);
  appendFeedbackList(container, "Das ist dir gelungen:", result.strengths, "Es wurde noch kein eindeutiger richtiger Aspekt erkannt.");
  appendFeedbackList(container, "Das solltest du ergänzen:", result.missing, "Es fehlen keine wesentlichen Aspekte.");
  const feedback = document.createElement("p");
  feedback.textContent = result.feedback || "Überprüfe deine Beschreibung noch einmal.";
  container.append(feedback);
}

async function checkSemanticTask(config) {
  const textarea = document.querySelector(`#${config.answerId}`);
  const button = document.querySelector(`#${config.buttonId}`);
  const feedback = document.querySelector(`#${config.feedbackId}`);
  const answer = textarea.value.trim();
  const note = config.noteId ? document.querySelector(`#${config.noteId}`) : null;
  if (note) { note.hidden = false; note.textContent = DEPTH_NOTE; }
  if (answer.length < 30) {
    feedback.hidden = false;
    feedback.className = "fish-semantic-feedback error";
    feedback.textContent = "Bitte formuliere eine etwas ausführlichere Antwort, damit sie sinnvoll ausgewertet werden kann.";
    textarea.focus();
    return;
  }
  button.disabled = true;
  textarea.disabled = true;
  button.textContent = "Antwort wird geprüft …";
  feedback.hidden = false;
  feedback.className = "fish-semantic-feedback";
  feedback.textContent = "Deine Antwort wird mit dem Erwartungshorizont verglichen.";
  try {
    renderSemanticResult(feedback, await evaluateSemanticAnswer({ serverUrl: SCRIPT_SERVER_URL, taskId: config.taskId, answer }));
  } catch (error) {
    feedback.className = "fish-semantic-feedback error";
    feedback.textContent = error.message;
  } finally {
    button.disabled = false;
    textarea.disabled = false;
    button.textContent = "Antwort erneut überprüfen";
  }
}

function setupSemanticTask(config) {
  const textarea = document.querySelector(`#${config.answerId}`);
  const counter = document.querySelector(`#${config.countId}`);
  const updateCounter = () => { counter.textContent = `${textarea.value.length} von ${MAX_LENGTH} Zeichen`; };
  textarea.addEventListener("input", updateCounter);
  document.querySelector(`#${config.buttonId}`).addEventListener("click", () => checkSemanticTask(config));
  updateCounter();
}

function checkDepthTable(event) {
  event.preventDefault();
  const inputs = [...document.querySelectorAll("#depth-table-form input")];
  let correct = 0;
  const incorrectLabels = [];
  const labels = { trainingErrors: "Anzahl falsch klassifizierter Trainingsdaten", testAccuracy: "Genauigkeit nach der Testphase" };
  inputs.forEach((input) => {
    const expected = FISH_DEPTH_RESULTS.find((row) => row.depth === Number(input.dataset.depth));
    const isCorrect = input.dataset.field === "trainingErrors"
      ? numberMatches(input.value, expected.trainingErrors)
      : percentageMatches(input.value, expected.testAccuracy);
    input.classList.toggle("is-correct", isCorrect);
    input.classList.toggle("is-wrong", !isCorrect);
    if (isCorrect) correct++;
    else incorrectLabels.push(`Tiefe ${input.dataset.depth}: ${labels[input.dataset.field]}`);
  });
  const feedback = document.querySelector("#depth-table-feedback");
  feedback.hidden = false;
  if (correct === inputs.length) {
    feedback.className = "dt-feedback success";
    feedback.textContent = "Richtig. Du hast die Fehler in den Trainingsdaten und die Genauigkeit nach der Testphase korrekt dokumentiert.";
  } else if (correct > 0) {
    feedback.className = "dt-feedback incomplete";
    feedback.textContent = `${correct} von ${inputs.length} Einträgen stimmen. Prüfe noch: ${incorrectLabels.join("; ")}. Die erwarteten Werte werden nicht vorweggenommen.`;
  } else {
    feedback.className = "dt-feedback wrong";
    feedback.textContent = "Noch kein Eintrag stimmt. Zähle zuerst die falsch klassifizierten Trainingsdaten und lies die Genauigkeit erst nach dem Test mit den Testdaten ab.";
  }
}

function normalizeSolutionCode(value) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function checkedValues(fieldset) {
  return [...fieldset.querySelectorAll('input[type="checkbox"]')].filter((input) => input.checked).map((input) => input.value);
}

function setupQuestionChecks() {
  const comparisonForm = document.querySelector("#depth-comparison-quiz");
  const comparisonFeedback = document.querySelector("#depth-comparison-feedback");
  const comparisonFieldset = comparisonForm.querySelector("fieldset");
  const note = document.querySelector("#depth-learning-note");
  const comparison = window.addQuizQuestionChecks({
    questions: [{
      fieldset: comparisonFieldset,
      solution: ["training-less", "test-same"],
      feedback: comparisonFeedback,
      success: "Richtig. Die Trainingsfehler sinken von 3 auf 0; die Testgenauigkeit bleibt bei allen drei Bäumen bei 4 von 5.",
      hint: (values) => values.includes("perfect-proof")
        ? "Prüfe die Aussage über neue Fische: Folgt sie wirklich aus den Trainingsfehlern und diesen fünf Testfischen?"
        : "Vergleiche auch die Testspalte: Ist dort bei größerer Tiefe ein zusätzlicher Fisch richtig?",
      check: () => {
        const values = checkedValues(comparisonFieldset);
        if (!values.length) return { result: "empty", text: "Kreuze mindestens eine Aussage an." };
        const right = values.filter((value) => ["training-less", "test-same"].includes(value)).length;
        const wrong = values.length - right;
        let result = !wrong && right === 2 ? "correct" : right && !wrong ? "missing" : right ? "mixed" : "wrong";
        const text = result === "correct"
          ? "Richtig. Die Trainingsfehler sinken von 3 auf 0; die Testgenauigkeit bleibt bei allen drei Bäumen bei 4 von 5."
          : result === "missing"
            ? "Teilweise korrekt. Deine Kreuze stimmen, aber es fehlt noch mindestens eine richtige Antwort. Vergleiche auch die Testspalte: Ist dort bei größerer Tiefe ein zusätzlicher Fisch richtig?"
            : result === "mixed"
              ? "Teilweise korrekt. Mindestens ein Kreuz ist nicht richtig. Prüfe die Aussage über neue Fische: Folgt sie wirklich aus den Trainingsfehlern und diesen fünf Testfischen?"
              : "Trainingsfehler und Testgenauigkeit sind verschiedene Ergebnisse. Lies beide Spalten für Tiefe 1 und Tiefe 3 noch einmal.";
        return { result, text };
      },
    }],
    buttonClass: "dt-primary-button",
    feedbackClass: "fish-semantic-feedback",
    levels: { high: "success", medium: "partial", low: "error" },
    onCheck: (_question, result) => {
      if (result === "correct") { state.comparisonUnlocked = true; note.hidden = false; saveState(); }
    },
  });

  const finalForm = document.querySelector("#final-quiz");
  const finalFeedback = document.querySelector("#final-quiz-feedback");
  const finalQuestions = [...finalForm.querySelectorAll("fieldset")];
  const finalSuccess = [
    "Richtig. Nur die Trainingsfehler sinken; die Testgenauigkeit bleibt dreimal bei 80 %.",
    "Richtig. Gleiche Testgenauigkeit erlaubt eine vorläufige Wahl, beweist aber weder die beste Tiefe noch, dass Tiefe 3 neue Fische schlechter einordnet.",
    "Richtig. Mehr getrennte Daten helfen bei der Wahl; ein weiterer unabhängiger Test überprüft den gewählten Baum.",
  ];
  const finalHints = [
    "Lies die Werte der Trainingsspalte und der Testspalte getrennt ab.",
    "Unterscheide einen beobachteten Gleichstand von einem Beweis über weitere Fische.",
    "Fische, mit denen du trainierst oder die Tiefe auswählst, sind kein unabhängiger Abschlusstest.",
  ];
  const finalSolutions = [["q1-train", "q1-test"], ["q2-no-guarantee", "q2-simple"], ["q3-more", "q3-final"]];
  const quiz = window.addQuizQuestionChecks({
    questions: finalQuestions.map((fieldset, index) => ({
      fieldset,
      solution: finalSolutions[index],
      success: finalSuccess[index],
      hint: finalHints[index],
      number: index + 1,
      check: () => {
        const values = checkedValues(fieldset);
        if (!values.length) return { result: "empty", text: "Kreuze mindestens eine Aussage an." };
        const correct = values.filter((value) => finalSolutions[index].includes(value)).length;
        const incorrect = values.length - correct;
        if (!incorrect && correct === finalSolutions[index].length) return { result: "correct", text: finalSuccess[index] };
        if (correct && !incorrect) return { result: "missing", text: `Teilweise korrekt. Deine Kreuze stimmen, aber es fehlt noch mindestens eine richtige Antwort. ${finalHints[index]}` };
        if (correct) return { result: "mixed", text: `Teilweise korrekt. Mindestens ein Kreuz ist nicht richtig. ${finalHints[index]}` };
        return { result: "wrong", text: `Noch nicht korrekt. ${finalHints[index]}` };
      },
    })),
    buttonClass: "dt-primary-button",
    feedbackClass: "fish-semantic-feedback",
    levels: { high: "success", medium: "incomplete", low: "error" },
    onAllCorrect: () => finalForm.requestSubmit(),
  });
  finalForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const correct = quiz.checkAll();
    finalFeedback.hidden = false;
    finalFeedback.className = `fish-semantic-feedback${correct === 3 ? " success" : " error"}`;
    finalFeedback.textContent = correct === 3
      ? "Richtig. Du unterscheidest Training und Test und kannst die Baumtiefe nur vorläufig beurteilen."
      : correct > 0
        ? "Teilweise korrekt. Prüfe die Fragen mit der Rückmeldung direkt darunter noch einmal."
        : "Noch nicht korrekt. Vergleiche Trainingsfehler, Testgenauigkeit und die Größe der Testgruppe erneut.";
    if (correct === 3) { state.resultsUnlocked = true; document.querySelector("#task4-summary").hidden = false; }
    saveState();
  });
  return { comparison, quiz };
}

function unlockSolution(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const enteredCode = normalizeSolutionCode(form.elements["solution-code"].value);
  const isCorrect = enteredCode === normalizeSolutionCode(SOLUTION_CODE);
  const message = document.querySelector("#solution-code-message");

  document.querySelector("#solution-download-link").hidden = !isCorrect;
  message.className = `solution-code-message${isCorrect ? "" : " error"}`;
  message.textContent = isCorrect
    ? "Code korrekt. Das Sicherungsblatt ist freigeschaltet."
    : "Der eingegebene Code ist nicht gültig.";
}

setupTabs();
semanticTasks.forEach(setupSemanticTask);
document.querySelector("#depth-table-form").addEventListener("submit", checkDepthTable);
document.querySelector("#solution-code-form").addEventListener("submit", unlockSolution);
persistFields();
setupCheckboxPersistence();
setupQuestionChecks();
document.querySelector("#depth-learning-note").hidden = !state.comparisonUnlocked;
document.querySelector("#task4-summary").hidden = !state.resultsUnlocked;
document.querySelector("#depth-description-note").textContent = DEPTH_NOTE;
