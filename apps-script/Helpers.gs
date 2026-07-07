/**
 * Gemeinsame Hilfsfunktionen fuer Normalisierung, Bereinigung und Antworten.
 */

function normalizeGermanText_(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/\s+/g, ' ')
    .trim();
}


function containsAny_(
  text,
  needles
) {
  return needles.some(
    function(needle) {
      return text.includes(
        normalizeGermanText_(
          needle
        )
      );
    }
  );
}

function normalizeEvaluation_(
  evaluation,
  maxPoints
) {
  const points =
    clampNumber_(
      evaluation.points,
      0,
      maxPoints
    );

  return {
    ok:
      true,
    points:
      points,
    maxPoints:
      maxPoints,
    status:
      cleanText_(
        evaluation.status,
        points >= maxPoints * 0.75
          ? 'gut'
          : points >= maxPoints * 0.4
            ? 'teilweise richtig'
            : 'noch unvollstaendig'
      ),
    strengths:
      cleanStringArray_(
        evaluation.strengths
      ),
    missing:
      cleanStringArray_(
        evaluation.missing
      ),
    feedback:
      cleanText_(
        evaluation.feedback,
        'Ueberarbeite deine Antwort mithilfe der Hinweise.'
      )
  };
}


function clampNumber_(
  value,
  min,
  max
) {
  const number =
    Number(value);

  if (!isFinite(number)) {
    return min;
  }

  return Math.max(
    min,
    Math.min(
      max,
      Math.round(number)
    )
  );
}


function cleanText_(
  value,
  fallback
) {
  const text =
    String(value || '')
      .replace(/\s+/g, ' ')
      .trim();

  return text || fallback;
}


function cleanStringArray_(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map(function(item) {
      return cleanText_(item, '');
    })
    .filter(function(item) {
      return item.length > 0;
    })
    .slice(0, 4);
}


function createErrorResult_(message) {
  return {
    ok:
      false,
    message:
      message
  };
}


function createPostMessageResponse_(
  requestId,
  result,
  parentOrigin
) {
  const payload = {
    type:
      RESULT_MESSAGE_TYPE,
    requestId:
      requestId || '',
    result:
      result
  };

  const html =
    '<!doctype html>' +
    '<meta charset="utf-8">' +
    '<title>Auswertung</title>' +
    '<script>' +
    '(function(){' +
    'var payload=' + toScriptJson_(payload) + ';' +
    'var payloadText=' + toScriptJson_(JSON.stringify(payload)) + ';' +
    'var targets=[window.parent,window.top];' +
    'try{if(window.parent&&window.parent.parent){targets.push(window.parent.parent);}}catch(error){}' +
    'for(var i=0;i<targets.length;i++){' +
    'try{targets[i].postMessage(payload,"*");}catch(error){}' +
    'try{targets[i].postMessage(payloadText,"*");}catch(error){}' +
    '}' +
    '}());' +
    '</script>' +
    '<p>Die Auswertung wurde an die Unterrichtsseite uebermittelt.</p>';

  return HtmlService
    .createHtmlOutput(html)
    .setTitle('Auswertung');
}


function toScriptJson_(value) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}
