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

/** Observe edits in the existing embedded IDE, including models created after reset. */
export function observeIdeCodeChanges(frame, ideId, onChange) {
  const subscriptions = new Map();
  let previousModels = null;
  let stopped = false;
  let timer;
  const attach = () => {
    clearTimeout(timer);
    if (stopped) return;
    const ide = frame?.contentWindow?.online_ide_access?.getIDE?.(ideId)?.ide;
    const files = ide?.getCurrentWorkspace?.()?.getFiles?.();
    if (Array.isArray(files)) {
      const currentModels = new Set(files.map((file) => file?.getMonacoModel?.()).filter((model) => model && typeof model.onDidChangeContent === 'function'));
      currentModels.forEach((model) => {
        if (!subscriptions.has(model)) {
          const subscription = model.onDidChangeContent(() => { if (!stopped) onChange(); });
          if (subscription?.dispose) subscriptions.set(model, subscription);
        }
      });
      if (previousModels && (previousModels.size !== currentModels.size || [...previousModels].some((model) => !currentModels.has(model)))) onChange();
      previousModels = currentModels;
      subscriptions.forEach((subscription, model) => {
        if (!currentModels.has(model)) { subscription.dispose(); subscriptions.delete(model); }
      });
    }
    if (!stopped) timer = setTimeout(attach, 500);
  };
  frame?.addEventListener('load', attach);
  attach();
  return () => {
    if (stopped) return;
    stopped = true;
    clearTimeout(timer);
    frame?.removeEventListener('load', attach);
    subscriptions.forEach((subscription) => subscription.dispose());
    subscriptions.clear();
  };
}

/** Gemeinsame, knappe Anzeige für Beschreibe- und Programmieraufgaben. */
export function compactFeedbackSentences(values, maxSentences = 2) {
  const result = [];
  const seen = new Set();
  const segmenter = new Intl.Segmenter('de', { granularity: 'sentence' });
  for (const value of values) {
    if (typeof value !== 'string') continue;
    const text = value.replace(/^\s*[-*•]\s*/, '')
      .replace(/^(?:Teilweise (?:korrekt|richtig)|Noch nicht korrekt|Noch unvollständig)[.!:]?\s*/i, '').trim();
    const protectedParts = [];
    const protectedText = text.replace(/`[^`]*`|\b[A-Za-z_$][\w$]*(?:\.[\w$]+)*\((?:[^()]|\([^()]*\))*\)|\b(?:z\.\s*B\.|d\.\s*h\.|u\.\s*a\.|bzw\.|ca\.|ggf\.)/gi, part => {
      protectedParts.push(part);
      return '\uE000' + (protectedParts.length - 1) + '\uE001';
    });
    for (const { segment } of segmenter.segment(protectedText)) {
      const sentence = segment.replace(/\uE000(\d+)\uE001/g, (_, index) => protectedParts[index]).trim();
      const key = sentence.toLocaleLowerCase('de').replace(/[.!?]+$/, '');
      if (!key || seen.has(key) || /^(?:korrigiere dies|[uü]berarbeite deine antwort mithilfe der hinweise|pr[uü]fe (?:deinen code|deine antwort)(?: noch einmal)?)$/.test(key)) continue;
      seen.add(key);
      result.push(sentence);
      if (result.length === maxSentences) return result;
    }
  }
  return result;
}

export function renderCompactEvaluation(container, result, { appendText, maxHints = 1 } = {}) {
  const document = container.ownerDocument;
  const complete = result.maxPoints > 0 && result.points === result.maxPoints;
  const heading = document.createElement('strong');
  heading.textContent = `${result.points} von ${result.maxPoints} Punkten` + (complete ? ' – Sehr gut, alles richtig' : '');
  container.replaceChildren(heading);
  if (complete) return;

  const missing = Array.isArray(result.missing) ? result.missing : [];
  const values = missing.some(item => typeof item === 'string' && item.trim())
    ? missing : String(result.feedback || '').split(/\r?\n/);
  const hints = compactFeedbackSentences(values, maxHints === 1 ? 1 : 2);
  if (!hints.length) hints.push('Ergänze die fehlenden Aspekte deiner Antwort und prüfe erneut.');
  const list = document.createElement('ul');
  for (const hint of hints) {
    const item = document.createElement('li');
    if (typeof appendText === 'function') appendText(item, hint);
    else item.textContent = hint;
    list.append(item);
  }
  container.append(list);
}
