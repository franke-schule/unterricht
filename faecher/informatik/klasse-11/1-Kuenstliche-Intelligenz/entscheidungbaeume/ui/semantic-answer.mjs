const DEFAULT_TIMEOUT = 60000;

function requestId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export function createSemanticEvaluationUrl(serverUrl, parameters) {
  const url = new URL(serverUrl);
  Object.entries(parameters).forEach(([key, value]) => url.searchParams.set(key, String(value)));
  return url.toString();
}

export function evaluateSemanticAnswer({ serverUrl, taskId, answer, timeout = DEFAULT_TIMEOUT }) {
  const id = requestId();
  const callbackName = `__semanticAnswer_${id.replace(/[^a-zA-Z0-9_$]/g, "_")}`;
  const src = createSemanticEvaluationUrl(serverUrl, {
    callback: callbackName,
    requestId: id,
    taskId,
    answer,
  });

  if (src.length > 1800) {
    return Promise.reject(new Error("Deine Antwort ist zu lang für die automatische Übertragung. Bitte kürze sie etwas."));
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    let timer;
    const cleanup = () => {
      clearTimeout(timer);
      script.remove();
      delete window[callbackName];
    };
    window[callbackName] = (message) => {
      cleanup();
      if (!message || message.type !== "GEMINI_EVALUATION_RESULT" || message.requestId !== id) {
        reject(new Error("Die Rückmeldung des Auswertungsservers war nicht lesbar."));
        return;
      }
      if (message.result?.ok !== true) {
        reject(new Error(message.result?.message || "Die Rückmeldung konnte nicht erstellt werden."));
        return;
      }
      resolve(message.result);
    };
    script.async = true;
    script.src = src;
    script.onerror = () => {
      cleanup();
      reject(new Error("Der Auswertungsserver konnte nicht geladen werden."));
    };
    timer = setTimeout(() => {
      cleanup();
      reject(new Error("Der Auswertungsserver hat nicht rechtzeitig geantwortet. Bitte versuche es erneut."));
    }, timeout);
    document.body.append(script);
  });
}

