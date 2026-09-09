const DEFAULT_TIMEOUT = 60000;

export function evaluateSemanticAnswer({ serverUrl, taskId, answer, timeout = DEFAULT_TIMEOUT }) {
  const requestId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
  const callback = `__perceptronAnswer_${requestId.replace(/[^a-zA-Z0-9_$]/g, '_')}`;
  const url = new URL(serverUrl);
  url.searchParams.set('callback', callback);
  url.searchParams.set('requestId', requestId);
  url.searchParams.set('taskId', taskId);
  url.searchParams.set('answer', answer);
  if (url.toString().length > 1800) return Promise.reject(new Error('Deine Antwort ist zu lang für die automatische Übertragung. Bitte kürze sie etwas.'));
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    const cleanup = () => { clearTimeout(timer); script.remove(); delete window[callback]; };
    window[callback] = (message) => {
      cleanup();
      if (!message || message.type !== 'GEMINI_EVALUATION_RESULT' || message.requestId !== requestId) return reject(new Error('Die Rückmeldung des Auswertungsservers war nicht lesbar.'));
      if (message.result?.ok !== true) return reject(new Error(message.result?.message || 'Die Rückmeldung konnte nicht erstellt werden.'));
      resolve(message.result);
    };
    script.async = true;
    script.onerror = () => { cleanup(); reject(new Error('Der Auswertungsserver konnte nicht geladen werden.')); };
    const timer = setTimeout(() => { cleanup(); reject(new Error('Der Auswertungsserver hat nicht rechtzeitig geantwortet. Bitte versuche es erneut.')); }, timeout);
    script.src = url.toString();
    document.body.append(script);
  });
}
