/**
 * Gemini-Aufruf, Promptbau und Antwortauswertung.
 */

function evaluateWithGemini_(
  task,
  answer
) {
  const scriptProperties =
    PropertiesService.getScriptProperties();

  const apiKey =
    scriptProperties.getProperty(
      PROPERTY_API_KEY
    );

  if (!apiKey) {
    throw new Error(
      'Auf dem Apps-Script-Server fehlt die Script Property GEMINI_API_KEY.'
    );
  }

  const model =
    scriptProperties.getProperty(
      PROPERTY_MODEL
    ) ||
    DEFAULT_MODEL;

  const endpoint =
    'https://generativelanguage.googleapis.com/v1beta/interactions';

  const payload = {
    model:
      model,
    input:
      buildPrompt_(
        task,
        answer
      ),
    response_format: {
      type:
        'text',
      mime_type:
        'application/json',
      schema:
        EVALUATION_SCHEMA
    }
  };

  const response =
    UrlFetchApp.fetch(
      endpoint,
      {
        method:
          'post',
        contentType:
          'application/json',
        headers: {
          'x-goog-api-key':
            apiKey
        },
        payload:
          JSON.stringify(payload),
        muteHttpExceptions:
          true
      }
    );

  const statusCode =
    response.getResponseCode();

  const responseText =
    response.getContentText();

  if (
    statusCode < 200 ||
    statusCode >= 300
  ) {
    if (statusCode === 429) {
      throw new Error(
        'Das Gemini-Kontingent ist gerade ausgelastet oder aufgebraucht. Bitte warte kurz und versuche es dann erneut.'
      );
    }

    throw new Error(
      'Gemini hat die Anfrage abgelehnt. HTTP-Status: ' +
      statusCode
    );
  }

  const geminiResponse =
    JSON.parse(responseText);

  const text =
    extractGeminiText_(geminiResponse);

  const evaluation =
    text
      ? JSON.parse(text)
      : geminiResponse;

  return applyRuleBasedMinimum_(
    normalizeEvaluation_(
      evaluation,
      task.maxPoints
    ),
    task,
    answer
  );
}

function buildPrompt_(
  task,
  answer
) {
  return [
    'Du bist eine hilfreiche, faire Informatik-Lehrkraft in Klasse 9.',
    'Bewerte eine kurze Schuelerantwort zu einem Java-/LearnJ-Programm.',
    '',
    'Programm:',
    task.program,
    '',
    'Aufgabe:',
    task.title,
    task.instruction,
    '',
    'Erwartete Aspekte:',
    task.expectedAspects
      .map(function(aspect, index) {
        return (index + 1) + '. ' + aspect;
      })
      .join('\n'),
    '',
    'Bewerte fachlich wohlwollend, aber nicht beliebig.',
    'Gib keine personenbezogenen Daten aus.',
    'Erfinde keine zusaetzlichen Informationen.',
    'Wenn die Antwort unklar ist, gib konkrete Hinweise zum Verbessern.',
    '',
    'Antworte ausschliesslich als JSON-Objekt mit diesen Feldern:',
    '{',
    '  "points": Zahl von 0 bis ' + task.maxPoints + ',',
    '  "maxPoints": ' + task.maxPoints + ',',
    '  "status": kurze Bewertung wie "gut", "teilweise richtig" oder "noch unvollstaendig",',
    '  "strengths": Array mit 0 bis 4 kurzen Strings,',
    '  "missing": Array mit 0 bis 4 kurzen Strings,',
    '  "feedback": ein kurzer, motivierender Feedbacktext',
    '}',
    '',
    'Schuelerantwort:',
    answer
  ].join('\n');
}


function extractGeminiText_(geminiResponse) {
  if (
    geminiResponse &&
    geminiResponse.output_text
  ) {
    return String(geminiResponse.output_text).trim();
  }

  if (
    geminiResponse &&
    Array.isArray(geminiResponse.output)
  ) {
    const outputText =
      geminiResponse.output
        .map(function(item) {
          if (item.text) {
            return item.text;
          }

          if (Array.isArray(item.content)) {
            return item.content
              .map(function(contentItem) {
                return (
                  contentItem.text ||
                  contentItem.output_text ||
                  ''
                );
              })
              .join('');
          }

          return '';
        })
        .join('')
        .trim();

    if (outputText) {
      return outputText;
    }
  }

  if (
    geminiResponse &&
    geminiResponse.candidates &&
    geminiResponse.candidates.length > 0 &&
    geminiResponse.candidates[0].content &&
    geminiResponse.candidates[0].content.parts
  ) {
    return geminiResponse.candidates[0].content.parts
      .map(function(part) {
        return part.text || '';
      })
      .join('')
      .trim();
  }

  if (
    geminiResponse &&
    geminiResponse.text
  ) {
    return String(geminiResponse.text).trim();
  }

  return '';
}
