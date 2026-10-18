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
  task
) {
  const maxPoints =
    task.maxPoints;
  const points =
    clampNumber_(
      evaluation.points,
      0,
      maxPoints
    );

  const feedback =
    cleanText_(
      evaluation.feedback,
      'Ueberarbeite deine Antwort mithilfe der Hinweise.'
    );
  const feedbackNote =
    task.feedbackNoteAboveHalf &&
    points > maxPoints / 2
      ? cleanText_(
        task.feedbackNoteAboveHalf,
        ''
      )
      : '';

  return {
    ok:
      true,
    points:
      points,
    maxPoints:
      maxPoints,
    status:
      task.statusLabels
        ? points === maxPoints
          ? task.statusLabels.correct
          : points > 0
            ? task.statusLabels.partial
            : task.statusLabels.incorrect
        : cleanText_(
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
      feedbackNote &&
      !feedback.includes(feedbackNote)
        ? feedback + ' ' + feedbackNote
        : feedback
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
