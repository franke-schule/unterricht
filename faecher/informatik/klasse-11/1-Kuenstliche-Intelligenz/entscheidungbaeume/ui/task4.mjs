import { FISH_DEPTH_RESULTS, percentageMatches, wrongFishMatches } from "../logic/fish-depth.mjs";
import { evaluateSemanticAnswer } from "./semantic-answer.mjs";

const SCRIPT_SERVER_URL = "https://script.google.com/macros/s/AKfycby8RWL6uYrKZyoJ6m2GRpWyRmXjwsdskyCiqzKpRhIK5-wrDl-9lWWk8CiAGaVMoy0x/exec";
const MAX_LENGTH = 3000;
const DEPTH_NOTE = "Ein tieferer Baum kann Trainingsdaten besser klassifizieren. Für die Auswahl eines Modells ist jedoch entscheidend, wie gut es unbekannte Testdaten klassifiziert.";

const semanticTasks = [
  { answerId: "depth-one-answer", buttonId: "check-depth-one", feedbackId: "depth-one-feedback", countId: "depth-one-count", taskId: "11-4-1" },
  { answerId: "depth-description-answer", buttonId: "check-depth-description", feedbackId: "depth-description-feedback", countId: "depth-description-count", taskId: "11-4-2", noteId: "depth-learning-note" },
  { answerId: "equal-accuracy-answer", buttonId: "check-equal-accuracy", feedbackId: "equal-accuracy-feedback", countId: "equal-accuracy-count", taskId: "11-4-3" },
];

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
  const labels = { training: "Trainingsgenauigkeit", test: "Testgenauigkeit", wrong: "falsch klassifizierter Testfisch" };
  inputs.forEach((input) => {
    const expected = FISH_DEPTH_RESULTS.find((row) => row.depth === Number(input.dataset.depth));
    const isCorrect = input.dataset.field === "training"
      ? percentageMatches(input.value, expected.trainingPercent)
      : input.dataset.field === "test"
        ? percentageMatches(input.value, expected.testPercent)
        : wrongFishMatches(input.value, expected.wrongFish);
    input.classList.toggle("is-correct", isCorrect);
    input.classList.toggle("is-wrong", !isCorrect);
    if (isCorrect) correct++;
    else incorrectLabels.push(`Tiefe ${input.dataset.depth}: ${labels[input.dataset.field]}`);
  });
  const feedback = document.querySelector("#depth-table-feedback");
  feedback.hidden = false;
  if (correct === inputs.length) {
    feedback.className = "dt-feedback success";
    feedback.textContent = "Richtig. Du hast Trainings- und Testdaten sauber getrennt und alle Ergebnisse korrekt dokumentiert.";
  } else if (correct > 0) {
    feedback.className = "dt-feedback incomplete";
    feedback.textContent = `${correct} von ${inputs.length} Einträgen stimmen. Prüfe noch: ${incorrectLabels.join("; ")}. Die erwarteten Werte werden nicht vorweggenommen.`;
  } else {
    feedback.className = "dt-feedback wrong";
    feedback.textContent = "Noch kein Eintrag stimmt. Erstelle jeden Baum ausschließlich mit den Trainingsdaten und teste ihn danach mit den Testdaten.";
  }
}

semanticTasks.forEach(setupSemanticTask);
document.querySelector("#depth-table-form").addEventListener("submit", checkDepthTable);
