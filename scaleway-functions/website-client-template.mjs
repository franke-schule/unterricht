// Vorlage für den vorhandenen gemeinsamen semantic-answer.mjs-Helfer.
// Endpunkt öffentlich, IAM-API-Key ausschließlich als Secret in der Function.
export const SCW_FUNCTION_URL = 'https://unterrichtkiichezbn4-ki-auswertung.functions.fnc.fr-par.scw.cloud/';
const DEFAULT_TIMEOUT = 130000;

export function isValidScriptServerUrl(value) {
  try {
    const url = new URL(String(value || '').trim());
    return url.href === SCW_FUNCTION_URL;
  } catch { return false; }
}

async function evaluate({ serverUrl = SCW_FUNCTION_URL, taskId, answer, code,
  timeout = DEFAULT_TIMEOUT, expectedMaxPoints }, requestType) {
  if (!isValidScriptServerUrl(serverUrl)) throw new Error('Der Auswertungsserver ist nicht korrekt eingerichtet.');
  const input = requestType === 'code' ? code : answer;
  const maximum = requestType === 'code' ? 12000 : 3000;
  const minimum = requestType === 'code' ? 20 : 10;
  if (typeof input !== 'string' || input.trim().length < minimum) {
    throw new Error(requestType === 'code' ? 'Dein Programmcode ist noch zu kurz für eine Auswertung.' : 'Bitte formuliere eine etwas ausführlichere Antwort.');
  }
  if (input.trim().length > maximum) throw new Error(requestType === 'code'
    ? 'Dein Programmcode ist zu lang für die automatische Auswertung.'
    : 'Bitte kürze deine Antwort auf höchstens 3000 Zeichen.');
  if (typeof taskId !== 'string' || !taskId.trim()) throw new Error('Die Aufgabenkennung fehlt.');
  if (!Number.isFinite(timeout) || timeout <= 0) throw new Error('Die konfigurierte Wartezeit ist ungültig.');

  const requestId = globalThis.crypto?.randomUUID?.() || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(SCW_FUNCTION_URL, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      credentials: 'omit', referrerPolicy: 'no-referrer', cache: 'no-store',
      signal: controller.signal,
      body: JSON.stringify({ requestId, taskId, requestType,
        [requestType === 'code' ? 'code' : 'answer']: input.trim() })
    });
    let payload;
    try { payload = await response.json(); } catch {
      throw new Error('Der Server hat keine lesbare Auswertung zurückgegeben.');
    }
    const result = payload?.result;
    if (!response.ok || result?.ok !== true) throw new Error(typeof result?.message === 'string'
      ? result.message.slice(0, 500) : 'Die Auswertung konnte nicht abgeschlossen werden. Bitte versuche es erneut.');
    const expectedType = requestType === 'code' ? 'GEMINI_CODE_EVALUATION_RESULT' : 'GEMINI_EVALUATION_RESULT';
    if (payload.requestId !== requestId || payload.type !== expectedType) {
      throw new Error('Die Serverantwort konnte dieser Anfrage nicht zugeordnet werden.');
    }
    if (!Number.isInteger(result.points) || !Number.isInteger(result.maxPoints) ||
        result.maxPoints <= 0 || result.points < 0 || result.points > result.maxPoints ||
        (expectedMaxPoints !== undefined && result.maxPoints !== expectedMaxPoints) ||
        typeof result.status !== 'string' || typeof result.feedback !== 'string' ||
        !Array.isArray(result.strengths) || !Array.isArray(result.missing) ||
        !result.strengths.every(item => typeof item === 'string') ||
        !result.missing.every(item => typeof item === 'string')) {
      throw new Error('Die Auswertung hat ein unerwartetes Format. Bitte versuche es erneut.');
    }
    return result;
  } catch (error) {
    if (controller.signal.aborted) throw new Error('Die Auswertung hat zu lange gedauert. Bitte versuche es erneut.');
    if (error instanceof TypeError) throw new Error('Der Auswertungsserver ist nicht erreichbar. Bitte prüfe deine Verbindung und versuche es erneut.');
    throw error;
  } finally { clearTimeout(timer); }
}

export function evaluateSemanticAnswer(parameters) { return evaluate(parameters, 'text'); }
export function evaluateCodeAnswer(parameters) { return evaluate(parameters, 'code'); }
