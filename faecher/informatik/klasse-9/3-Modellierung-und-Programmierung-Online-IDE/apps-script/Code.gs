/**
 * HTTP-Einstiegspunkte und Request-Verarbeitung fuer die Web-App.
 */

/**
 * Kleiner Gesundheitscheck, damit ein direkter Aufruf der Web-App
 * nicht mit einer fehlenden Index-Datei endet.
 */
function doGet(event) {
  const callback =
    event &&
    event.parameter
      ? String(event.parameter.callback || '')
      : '';

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


function readRequest_(event) {
  const parameters =
    event && event.parameter
      ? event.parameter
      : {};

  return {
    requestId:
      String(parameters.requestId || ''),
    taskId:
      String(parameters.taskId || ''),
    answer:
      String(parameters.answer || ''),
    parentOrigin:
      String(parameters.parentOrigin || '')
  };
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
