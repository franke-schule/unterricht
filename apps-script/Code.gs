/**
 * HTTP-Einstiegspunkte und Request-Verarbeitung fuer die Web-App.
 */

/**
 * Kleiner Gesundheitscheck, damit ein direkter Aufruf der Web-App
 * nicht mit einer fehlenden Index-Datei endet.
 */
function doGet(event) {
  const requestType =
    event &&
    event.parameter
      ? String(event.parameter.requestType || '')
      : '';

  const callback =
    event &&
    event.parameter
      ? String(event.parameter.callback || '')
      : '';

  if (
    callback &&
    requestType === CODE_RESULT_REQUEST_TYPE
  ) {
    return handleCodeResultJsonp_(
      event,
      callback
    );
  }

  if (callback) {
    return handleJsonpRequest_(
      event,
      callback
    );
  }

  return HtmlService
    .createHtmlOutput(
      '<!doctype html>' +
      '<meta charset="utf-8">' +
      '<title>Auswertungsserver</title>' +
      '<h1>Auswertungsserver ist erreichbar</h1>' +
      '<p>POST-Anfragen der Unterrichtsseite koennen verarbeitet werden.</p>'
    );
}


/**
 * Liefert das Ergebnis einer zuvor per POST gestarteten Codeauswertung.
 * Die kurze JSONP-Anfrage enthaelt nur die requestId und ist deshalb
 * unabhaengig von der Laenge des Schuelercodes.
 */
function handleCodeResultJsonp_(
  event,
  callback
) {
  try {
    validateCallbackName_(
      callback
    );
  } catch (error) {
    return ContentService
      .createTextOutput(
        '/* Ungueltiger JSONP-Callback. */'
      )
      .setMimeType(
        ContentService.MimeType.JAVASCRIPT
      );
  }

  const requestId =
    event &&
    event.parameter
      ? String(event.parameter.requestId || '')
      : '';

  let payload;

  try {
    validateRequestId_(
      requestId
    );

    const result =
      readCodeResult_(
        requestId
      );

    payload = {
      type:
        CODE_RESULT_MESSAGE_TYPE,
      requestId:
        requestId,
      pending:
        result === null,
      result:
        result
    };
  } catch (error) {
    payload = {
      type:
        CODE_RESULT_MESSAGE_TYPE,
      requestId:
        requestId,
      pending:
        false,
      result:
        createErrorResult_(
          error && error.message
            ? error.message
            : 'Das Ergebnis konnte nicht abgefragt werden.'
        )
    };
  }

  return ContentService
    .createTextOutput(
      callback +
      '(' +
      toScriptJson_(payload) +
      ');'
    )
    .setMimeType(
      ContentService.MimeType.JAVASCRIPT
    );
}


function handleJsonpRequest_(
  event,
  callback
) {
  try {
    validateCallbackName_(
      callback
    );
  } catch (error) {
    return ContentService
      .createTextOutput(
        '/* Ungueltiger JSONP-Callback. */'
      )
      .setMimeType(
        ContentService.MimeType.JAVASCRIPT
      );
  }

  const request =
    readRequest_(event);

  let result;

  try {
    validateRequest_(
      request
    );

    const task =
      TASKS[request.taskId];

    result =
      evaluateWithGemini_(
        task,
        request.answer
      );

  } catch (error) {
    result =
      createErrorResult_(
        error && error.message
          ? error.message
          : 'Die Antwort konnte nicht ausgewertet werden.'
      );
  }

  const payload = {
    type:
      RESULT_MESSAGE_TYPE,
    requestId:
      request.requestId || '',
    result:
      result
  };

  return ContentService
    .createTextOutput(
      callback +
      '(' +
      toScriptJson_(payload) +
      ');'
    )
    .setMimeType(
      ContentService.MimeType.JAVASCRIPT
    );
}


function validateCallbackName_(callback) {
  if (!/^[A-Za-z_$][0-9A-Za-z_$]*(\.[A-Za-z_$][0-9A-Za-z_$]*)*$/.test(callback)) {
    throw new Error(
      'Ungueltiger JSONP-Callback.'
    );
  }
}


/**
 * Nimmt die Formularuebertragung der Unterrichtsseite entgegen,
 * laesst Gemini eine Rueckmeldung erzeugen und sendet das Ergebnis
 * per postMessage an die urspruengliche Seite zurueck.
 */
function doPost(event) {
  const request =
    readRequest_(event);

  if (
    request.requestType ===
    CODE_REQUEST_TYPE
  ) {
    return handleCodePost_(
      request
    );
  }

  let result;

  try {
    validateRequest_(request);

    const task =
      TASKS[request.taskId];

    result =
      evaluateWithGemini_(
        task,
        request.answer
      );

  } catch (error) {
    result =
      createErrorResult_(
        error && error.message
          ? error.message
          : 'Die Antwort konnte nicht ausgewertet werden.'
      );
  }

  return createPostMessageResponse_(
    request.requestId,
    result,
    request.parentOrigin
  );
}


/**
 * Verarbeitet ausschliesslich Programmcode. Das Ergebnis wird kurzzeitig
 * im Script-Cache gespeichert und danach ueber handleCodeResultJsonp_
 * abgeholt. Der bisherige Text-/JSONP-Pfad bleibt davon unberuehrt.
 */
function handleCodePost_(request) {
  let result;

  try {
    validateCodeRequest_(
      request
    );

    const task =
      TASKS[request.taskId];

    result =
      evaluateWithGemini_(
        task,
        request.code
      );
  } catch (error) {
    result =
      createErrorResult_(
        error && error.message
          ? error.message
          : 'Der Programmcode konnte nicht ausgewertet werden.'
      );
  }

  try {
    validateRequestId_(
      request.requestId
    );

    storeCodeResult_(
      request.requestId,
      result
    );
  } catch (error) {
    return ContentService
      .createTextOutput(
        JSON.stringify({
          accepted:
            false,
          message:
            error && error.message
              ? error.message
              : 'Das Ergebnis konnte nicht gespeichert werden.'
        })
      )
      .setMimeType(
        ContentService.MimeType.JSON
      );
  }

  return ContentService
    .createTextOutput(
      JSON.stringify({
        accepted:
          true,
        requestId:
          request.requestId
      })
    )
    .setMimeType(
      ContentService.MimeType.JSON
    );
}


function readRequest_(event) {
  const parameters =
    event && event.parameter
      ? event.parameter
      : {};

  return {
    requestType:
      String(parameters.requestType || ''),
    requestId:
      String(parameters.requestId || ''),
    taskId:
      String(parameters.taskId || ''),
    answer:
      String(parameters.answer || ''),
    code:
      String(parameters.code || ''),
    parentOrigin:
      String(parameters.parentOrigin || '')
  };
}


function validateRequestId_(requestId) {
  if (
    !requestId ||
    !/^[0-9A-Za-z_-]{8,100}$/.test(requestId)
  ) {
    throw new Error(
      'Die Anfrage enthaelt keine gueltige requestId.'
    );
  }
}


function validateRequest_(request) {
  if (!request.requestId) {
    throw new Error(
      'Die Anfrage enthaelt keine requestId.'
    );
  }

  if (!Object.prototype.hasOwnProperty.call(
    TASKS,
    request.taskId
  )) {
    throw new Error(
      'Diese Aufgabe ist auf dem Auswertungsserver nicht bekannt.'
    );
  }

  const answer =
    request.answer.trim();

  if (answer.length < 10) {
    throw new Error(
      'Bitte formuliere eine etwas ausfuehrlichere Antwort.'
    );
  }

  if (answer.length > MAX_ANSWER_LENGTH) {
    throw new Error(
      'Die Antwort ist zu lang.'
    );
  }
}


function validateCodeRequest_(request) {
  validateRequestId_(
    request.requestId
  );

  if (
    request.requestType !==
    CODE_REQUEST_TYPE
  ) {
    throw new Error(
      'Die Anfrage ist keine Codeauswertung.'
    );
  }

  if (!Object.prototype.hasOwnProperty.call(
    TASKS,
    request.taskId
  )) {
    throw new Error(
      'Diese Programmieraufgabe ist auf dem Auswertungsserver nicht bekannt.'
    );
  }

  const task =
    TASKS[request.taskId];

  if (
    !task ||
    task.responseType !== 'code'
  ) {
    throw new Error(
      'Diese Aufgabe ist nicht fuer eine Codeauswertung konfiguriert.'
    );
  }

  const code =
    request.code.trim();

  if (code.length < 20) {
    throw new Error(
      'Der Programmcode ist noch zu kurz fuer eine Auswertung.'
    );
  }

  if (code.length > MAX_CODE_LENGTH) {
    throw new Error(
      'Der Programmcode ist zu lang.'
    );
  }
}


function getCodeResultCacheKey_(requestId) {
  return (
    'code-result-' +
    requestId
  );
}


function storeCodeResult_(
  requestId,
  result
) {
  CacheService
    .getScriptCache()
    .put(
      getCodeResultCacheKey_(
        requestId
      ),
      JSON.stringify(result),
      CODE_RESULT_CACHE_SECONDS
    );
}


function readCodeResult_(requestId) {
  const cached =
    CacheService
      .getScriptCache()
      .get(
        getCodeResultCacheKey_(
          requestId
        )
      );

  if (cached === null) {
    return null;
  }

  return JSON.parse(
    cached
  );
}
