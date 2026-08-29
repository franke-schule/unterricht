import { evaluateSemanticAnswer } from "../../../../informatik/klasse-11/1-Kuenstliche-Intelligenz/entscheidungbaeume/ui/semantic-answer.mjs";

const MAX_LENGTH = 3000;
const SCRIPT_SERVER_URL = "https://script.google.com/macros/s/AKfycby8RWL6uYrKZyoJ6m2GRpWyRmXjwsdskyCiqzKpRhIK5-wrDl-9lWWk8CiAGaVMoy0x/exec";

function appendFeedbackList(container, title, items, fallback) {
  const heading = document.createElement("h4");
  heading.textContent = title;
  const list = document.createElement("ul");
  (Array.isArray(items) && items.length ? items : [fallback]).forEach((itemText) => {
    const item = document.createElement("li");
    item.textContent = itemText;
    list.append(item);
  });
  container.append(heading, list);
}

function renderSemanticResult(container, result) {
  container.replaceChildren();
  container.hidden = false;
  container.className = "physics-semantic-feedback";
  container.dataset.status = result.status || "noch nicht korrekt";

  const heading = document.createElement("h3");
  heading.textContent = result.status || "noch nicht korrekt";
  const score = document.createElement("p");
  score.textContent = `${result.points} von ${result.maxPoints} Aspekten erkannt.`;
  container.append(heading, score);
  appendFeedbackList(container, "Das ist dir gelungen:", result.strengths, "Noch kein Aspekt wurde eindeutig erkannt.");
  appendFeedbackList(container, "Das kannst du ergänzen:", result.missing, "Es fehlen keine wesentlichen Aspekte.");
  const feedback = document.createElement("p");
  feedback.textContent = result.feedback || "Überprüfe deine Beschreibung noch einmal.";
  container.append(feedback);
}

/**
 * Aktiviert eine Freitextkarte mit der vorhandenen Apps-Script-/JSONP-Architektur.
 * Die Aufgabenkennung und der Erwartungshorizont liegen ausschließlich im
 * Skriptserver. Die Auswertung startet nur über den Prüfbutton.
 */
export function setupPhysicsSemanticTask({
  answerId,
  buttonId,
  feedbackId,
  countId,
  taskId,
  serverUrl = SCRIPT_SERVER_URL,
}) {
  const textarea = document.getElementById(answerId);
  const button = document.getElementById(buttonId);
  const feedback = document.getElementById(feedbackId);
  const counter = document.getElementById(countId);

  if (!textarea || !button || !feedback || !counter) {
    throw new Error("Die Freitextkarte enthält nicht alle erforderlichen Elemente.");
  }

  const updateCounter = () => {
    counter.textContent = `${textarea.value.length} von ${MAX_LENGTH} Zeichen`;
  };

  textarea.addEventListener("input", updateCounter);
  updateCounter();

  button.addEventListener("click", async () => {
    const answer = textarea.value.trim();
    if (answer.length < 30) {
      feedback.hidden = false;
      feedback.className = "physics-semantic-feedback is-error";
      feedback.dataset.status = "noch nicht korrekt";
      feedback.textContent = "Bitte formuliere eine etwas ausführlichere Beschreibung, damit sie fachlich bewertet werden kann.";
      textarea.focus();
      return;
    }

    button.disabled = true;
    textarea.disabled = true;
    button.textContent = "Antwort wird geprüft …";
    feedback.hidden = false;
    feedback.className = "physics-semantic-feedback";
    feedback.dataset.status = "";
    feedback.textContent = "Deine Antwort wird mit dem Erwartungshorizont verglichen.";

    try {
      const result = await evaluateSemanticAnswer({
        serverUrl,
        taskId,
        answer,
      });
      renderSemanticResult(feedback, result);
    } catch (error) {
      feedback.className = "physics-semantic-feedback is-error";
      feedback.dataset.status = "noch nicht korrekt";
      feedback.textContent = error.message;
    } finally {
      button.disabled = false;
      textarea.disabled = false;
      button.textContent = "Antwort erneut prüfen";
    }
  });
}
