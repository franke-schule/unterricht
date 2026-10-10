// Transport für die getrennte Testkopie von Informatik 9, Online-IDE, Aufgabe 1.
// Wird beim Vorbereiten in das vorhandene Inline-Skript eingesetzt.
const SCRIPT_SERVER_URL = 'https://unterrichtkiichezbn4-ki-auswertung.functions.fnc.fr-par.scw.cloud/';

function updateCharacterCount(taskId) {
  document.getElementById('count-' + taskId).textContent =
    document.getElementById('answer-' + taskId).value.length + ' von 3000 Zeichen';
}

function createRequestId() {
  return window.crypto && typeof window.crypto.randomUUID === 'function'
    ? window.crypto.randomUUID()
    : Date.now().toString(36) + '-' + Math.random().toString(36).substring(2);
}

async function submitAnswer(taskId) {
  if (!['b', 'c'].includes(taskId)) return;
  const textarea = document.getElementById('answer-' + taskId);
  const button = document.getElementById('button-' + taskId);
  const resultBox = document.getElementById('result-' + taskId);
  if (button.disabled) return;
  const answer = textarea.value.trim();
  if (answer.length < 10 || answer.length > 3000) {
    showError(resultBox, answer.length < 10
      ? 'Bitte formuliere eine etwas ausführlichere Antwort.'
      : 'Bitte kürze deine Antwort auf höchstens 3000 Zeichen.');
    textarea.focus();
    return;
  }

  const requestId = createRequestId();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 130000);
  button.disabled = true;
  textarea.disabled = true;
  button.textContent = 'Antwort wird geprüft …';
  resultBox.hidden = false;
  resultBox.className = 'result';
  resultBox.textContent = 'Die KI prüft deine Antwort. Bitte warte einen Moment.';
  try {
    const response = await fetch(SCRIPT_SERVER_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      cache: 'no-store',
      signal: controller.signal,
      body: JSON.stringify({ requestId, taskId, requestType: 'text', answer })
    });
    let payload;
    try { payload = await response.json(); } catch {
      throw new Error('Der Server hat keine lesbare Auswertung zurückgegeben.');
    }
    // Die Ergebnistyp-Bezeichnung ist aus dem vorhandenen Serververtrag übernommen.
    if (!payload || payload.requestId !== requestId ||
        payload.type !== 'GEMINI_EVALUATION_RESULT' || !payload.result) {
      throw new Error('Die Serverantwort konnte dieser Anfrage nicht zugeordnet werden.');
    }
    const result = payload.result;
    if (!response.ok || result.ok !== true) {
      throw new Error(typeof result.message === 'string'
        ? result.message.slice(0, 500)
        : 'Die Auswertung konnte nicht abgeschlossen werden. Bitte versuche es erneut.');
    }
    if (!Number.isInteger(result.points) || result.points < 0 ||
        result.maxPoints !== 6 || result.points > result.maxPoints ||
        typeof result.status !== 'string' || typeof result.feedback !== 'string' ||
        !Array.isArray(result.strengths) || !Array.isArray(result.missing) ||
        !result.strengths.every(item => typeof item === 'string') ||
        !result.missing.every(item => typeof item === 'string')) {
      throw new Error('Die Auswertung hat ein unerwartetes Format. Bitte versuche es erneut.');
    }
    showEvaluation(resultBox, result);
  } catch (error) {
    showError(resultBox, controller.signal.aborted
      ? 'Die Auswertung hat zu lange gedauert. Bitte versuche es erneut.'
      : error instanceof TypeError
        ? 'Der Auswertungsserver ist nicht erreichbar. Bitte prüfe deine Verbindung und versuche es erneut.'
        : error.message || 'Die Auswertung konnte nicht abgeschlossen werden.');
  } finally {
    clearTimeout(timeoutId);
    button.disabled = false;
    textarea.disabled = false;
    button.textContent = 'Antwort erneut prüfen';
  }
}

