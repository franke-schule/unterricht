import { FISH_DEPTH_RESULTS, numberMatches, percentageMatches } from "../logic/fish-depth.mjs";
import { evaluateSemanticAnswer } from "./semantic-answer.mjs";

const SCRIPT_SERVER_URL = "https://script.google.com/macros/s/AKfycby8RWL6uYrKZyoJ6m2GRpWyRmXjwsdskyCiqzKpRhIK5-wrDl-9lWWk8CiAGaVMoy0x/exec";
const MAX_LENGTH = 3000;
const DEPTH_NOTE = "Ein tieferer Baum kann Trainingsdaten besser klassifizieren. Für die Auswahl eines Modells ist jedoch entscheidend, wie gut es unbekannte Testdaten klassifiziert.";
const STEP_IDS = ["task41", "task42", "task4a"];

const semanticTasks = [
  { answerId: "depth-one-answer", buttonId: "check-depth-one", feedbackId: "depth-one-feedback", countId: "depth-one-count", taskId: "11-4-1" },
  { answerId: "depth-description-answer", buttonId: "check-depth-description", feedbackId: "depth-description-feedback", countId: "depth-description-count", taskId: "11-4-2", noteId: "depth-learning-note" },
];

let activeStepIndex = 0;

function showStep(stepId, moveFocus = false) {
  const nextIndex = STEP_IDS.indexOf(stepId);
  if (nextIndex < 0) return;
  activeStepIndex = nextIndex;
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
  showStep(STEP_IDS[0]);
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

setupTabs();
semanticTasks.forEach(setupSemanticTask);
document.querySelector("#depth-table-form").addEventListener("submit", checkDepthTable);
