// Transport für Informatik 10, Online-IDE, Aufgabe 3 in der lokalen Testkopie.
const SCRIPT_SERVER_URL = 'https://unterrichtkiichezbn4-ki-auswertung.functions.fnc.fr-par.scw.cloud/';

/* EXISTING_CODE_HELPERS */

async function submitCode(taskId) {
  if (!['10-3a', '10-3b'].includes(taskId)) return;
  const button = document.getElementById('button-' + taskId);
  const resultBox = document.getElementById('result-' + taskId);
  if (button.disabled) return;

  /* EXISTING_CODE_VALIDATION */

  button.dataset.defaultLabel = button.textContent.trim();
  button.disabled = true;
  button.textContent = 'Programm wird geprüft …';
  resultBox.hidden = false;
  resultBox.className = 'result';
  resultBox.textContent = 'Der aktuelle Stand von Hauptprogramm.java wird ausgewertet.';
  const requestId = createRequestId();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 130000);
  try {
    const response = await fetch(SCRIPT_SERVER_URL, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      credentials: 'omit', referrerPolicy: 'no-referrer', cache: 'no-store',
      signal: controller.signal,
      body: JSON.stringify({ requestId, taskId, requestType: 'code', code })
    });
    let payload;
    try { payload = await response.json(); } catch {
      throw new Error('Der Server hat keine lesbare Auswertung zurückgegeben.');
    }
    // Der bestehende Ergebnistyp bleibt erhalten; die Auswertung erfolgt bei Scaleway.
    if (!payload || payload.requestId !== requestId ||
        payload.type !== 'GEMINI_CODE_EVALUATION_RESULT' || !payload.result) {
      throw new Error('Die Serverantwort konnte dieser Anfrage nicht zugeordnet werden.');
    }
    const result = payload.result;
    if (!response.ok || result.ok !== true) {
      throw new Error(typeof result.message === 'string'
        ? result.message.slice(0, 500)
        : 'Die Auswertung konnte nicht abgeschlossen werden. Bitte versuche es erneut.');
    }
    const maxPoints = taskId === '10-3a' ? 3 : 6;
    if (!Number.isInteger(result.points) || result.points < 0 ||
        result.maxPoints !== maxPoints || result.points > maxPoints ||
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
    restoreCodeButton({ button });
  }
}

