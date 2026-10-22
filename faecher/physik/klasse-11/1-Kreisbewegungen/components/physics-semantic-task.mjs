import { evaluateSemanticAnswer, renderCompactEvaluation } from "../../../../informatik/klasse-11/1-Kuenstliche-Intelligenz/perzeptron/ui/semantic-answer.mjs?v=20261022-compact-feedback";
import { appendPhysicsText } from "./physics-notation.mjs?v=20260911a";

const MAX_LENGTH = 3000;
const SCRIPT_SERVER_URL = "https://unterrichtkiichezbn4-ki-auswertung.functions.fnc.fr-par.scw.cloud/";

function renderSemanticResult(container, result) {
  container.replaceChildren();
  container.hidden = false;
  container.className = "physics-semantic-feedback";
  container.dataset.status = result.status || "noch nicht korrekt";
  renderCompactEvaluation(container, result, { appendText: appendPhysicsText });
}

/**
 * Aktiviert eine Freitextkarte mit der vorhandenen POST-/JSON-Anbindung an Scaleway.
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
  feedbackBuilder,
  minimumLength = 30,
  fallbackMaxPoints = 0,
  evaluationFunction = evaluateSemanticAnswer,
  shortAnswerHint = "Formuliere eine etwas ausführlichere Beschreibung der beiden Vektoren.",
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
    if (answer.length < minimumLength) {
      if (typeof feedbackBuilder === "function") {
        renderSemanticResult(feedback, {
          status: "noch nicht korrekt",
          points: 0,
          maxPoints: fallbackMaxPoints,
          strengths: [],
          missing: [shortAnswerHint],
          feedback: ""
        });
        textarea.focus();
        return;
      }
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
      const result = await evaluationFunction({
        serverUrl,
        taskId,
        answer,
      });
      renderSemanticResult(feedback, result);
    } catch (error) {
      if (typeof feedbackBuilder === "function") {
        feedback.replaceChildren();
        feedback.hidden = false;
        feedback.className = "physics-semantic-feedback is-error";
        feedback.dataset.status = "nicht geprüft";
        const heading = document.createElement("h3");
        heading.textContent = "Automatische Prüfung nicht erreichbar";
        const message = document.createElement("p");
        message.textContent = error.message || "Die Antwort konnte gerade nicht geprüft werden. Bitte versuche es erneut.";
        feedback.append(heading, message);
        const comparison = feedbackBuilder({ status: "nicht geprüft", points: 0, maxPoints: fallbackMaxPoints, context: "server-error" });
        if (comparison) feedback.append(comparison);
        return;
      }
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
