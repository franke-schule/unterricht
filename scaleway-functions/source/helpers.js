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


function isPhysicsTask_(task) {
  return /^Physik\b/i.test(task.title || '') || /Physiklehrkraft/i.test(task.systemInstruction || '');
}


function normalizePhysicsNotation_(answer) {
  // Nur eindeutige Größen-Aliase vereinheitlichen; Zahlen, Einheiten und
  // fachliche Aussagen bleiben unverändert. Keine globale Kleinschreibung.
  return String(answer || '')
    .replace(/(?<![\p{L}\p{N}_])f_?zp?(?![\p{L}\p{N}_])/giu, 'F_Z')
    .replace(/(?<![\p{L}\p{N}_])(?:alpha|α)(?![\p{L}\p{N}_])/giu, 'α');
}


function formatPhysicsFeedbackNotation_(text) {
  return String(text || '').replace(/\bF_?(ZP|Z|S|G|H|R|N|M)\b/g, 'F_$1');
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


function compactFeedbackSentences_(values) {
  const result = [];
  const seen = new Set();
  const segmenter = new Intl.Segmenter('de', { granularity: 'sentence' });
  for (const value of values) {
    if (typeof value !== 'string') continue;
    const text = value.replace(/^\s*[-*•]\s*/, '')
      .replace(/^(?:Teilweise (?:korrekt|richtig)|Noch nicht korrekt|Noch unvollständig)[.!:]?\s*/i, '').trim();
    // Code und Abkürzungen enthalten Punkte, die kein Satzende sind.
    const protectedParts = [];
    const protectedText = text.replace(/`[^`]*`|\b[A-Za-z_$][\w$]*(?:\.[\w$]+)*\((?:[^()]|\([^()]*\))*\)|\b(?:z\.\s*B\.|d\.\s*h\.|u\.\s*a\.|bzw\.|ca\.|ggf\.)/gi, part => {
      protectedParts.push(part);
      return '\uE000' + (protectedParts.length - 1) + '\uE001';
    });
    for (const { segment } of segmenter.segment(protectedText)) {
      const sentence = segment.replace(/\uE000(\d+)\uE001/g, (_, index) => protectedParts[index]).trim();
      const key = normalizeGermanText_(sentence).replace(/[.!?]+$/, '');
      if (!key || seen.has(key) || /^(?:korrigiere dies|ueberarbeite deine antwort mithilfe der hinweise|pruefe (?:deinen code|deine antwort)(?: noch einmal)?)$/.test(key)) continue;
      seen.add(key);
      result.push(sentence);
      if (result.length === 2) return result;
    }
  }
  return result;
}


function formatFinalEvaluation_(evaluation, task) {
  const result = Object.assign({}, evaluation);
  result.strengths = [];
  if (result.maxPoints > 0 && result.points === result.maxPoints) {
    result.missing = [];
    result.feedback = 'Sehr gut, alles richtig';
    return result;
  }

  let feedback = cleanText_(result.feedback, '');
  if (task.feedbackNoteAboveHalf) {
    const note = cleanText_(task.feedbackNoteAboveHalf, '');
    if (note) feedback = feedback.split(note).join('').replace(/\s+/g, ' ').trim();
  }
  const missing = cleanStringArray_(result.missing);
  if (isPhysicsTask_(task)) {
    feedback = formatPhysicsFeedbackNotation_(feedback);
    for (let index = 0; index < missing.length; index++) missing[index] = formatPhysicsFeedbackNotation_(missing[index]);
  }
  result.missing = compactFeedbackSentences_(missing.length ? missing : [feedback]);
  result.feedback = '';
  return result;
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
