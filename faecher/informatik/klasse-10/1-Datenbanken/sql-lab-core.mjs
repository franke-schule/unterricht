/** Reine Hilfsfunktionen für die SQL-Lernmodule. */
export function parseDelimited(text, delimiter = ';') {
  text = String(text || '').replace(/^\uFEFF/, '');
  const rows = []; let row = []; let value = ''; let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index]; const next = text[index + 1];
    if (char === '"' && quoted && next === '"') { value += '"'; index += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === delimiter && !quoted) { row.push(value); value = ''; }
    else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') index += 1;
      row.push(value); if (row.some((cell) => cell !== '')) rows.push(row); row = []; value = '';
    } else value += char;
  }
  row.push(value); if (row.some((cell) => cell !== '')) rows.push(row);
  return rows;
}

function removeCommentsAndStrings(sql) {
  let output = ''; let quote = null; let lineComment = false; let blockComment = false;
  for (let index = 0; index < sql.length; index += 1) {
    const char = sql[index]; const next = sql[index + 1];
    if (lineComment) { if (char === '\n') { lineComment = false; output += ' '; } continue; }
    if (blockComment) { if (char === '*' && next === '/') { blockComment = false; index += 1; output += ' '; } continue; }
    if (quote) {
      if (char === quote && next === quote) { index += 1; continue; }
      if (char === quote) quote = null;
      output += ' ';
      continue;
    }
    if (char === '-' && next === '-') { lineComment = true; index += 1; output += ' '; continue; }
    if (char === '/' && next === '*') { blockComment = true; index += 1; output += ' '; continue; }
    if (char === "'" || char === '"') { quote = char; output += ' '; continue; }
    output += char;
  }
  return { text: output, unterminated: Boolean(quote || blockComment) };
}

export function validateSelectStatement(sql) {
  const original = String(sql || '').trim();
  if (!original) return { ok: false, message: 'Gib zuerst eine SQL-Anweisung ein.' };
  const cleaned = removeCommentsAndStrings(original);
  if (cleaned.unterminated) return { ok: false, message: 'Prüfe die Anführungszeichen oder einen Kommentar in deiner Anweisung.' };
  const statements = cleaned.text.split(';').map((part) => part.trim()).filter(Boolean);
  if (statements.length !== 1) return { ok: false, message: 'Erlaubt ist genau eine SQL-Anweisung.' };
  if (!/^SELECT\b/i.test(statements[0])) return { ok: false, message: 'Hier sind nur lesende SELECT-Anweisungen erlaubt.' };
  if (/\b(INSERT|UPDATE|DELETE|REPLACE|CREATE|ALTER|DROP|PRAGMA|ATTACH|DETACH|VACUUM|WITH)\b/i.test(statements[0])) {
    return { ok: false, message: 'Diese SQL-Anweisung gehört nicht zu den erlaubten SELECT-Abfragen.' };
  }
  return { ok: true, sql: original.replace(/;\s*$/, '').trim() };
}

export function normalizeRelation(result) {
  const relation = Array.isArray(result) ? result[0] : result;
  return { columns: relation?.columns || [], values: relation?.values || [] };
}

function valueKey(value) { return value === null ? '__NULL__' : `${typeof value}:${String(value)}`; }
function rowKey(row) { return row.map(valueKey).join('\u001f'); }
function permutations(length) {
  // Spalten ohne feste Reihenfolge sind nur für kleine Projektionslisten
  // sinnvoll; SELECT * bleibt aus Sicherheitsgründen bei fester Reihenfolge.
  if (length > 8) return [];
  if (length <= 1) return [Array.from({ length }, (_, index) => index)];
  const result = [];
  const build = (prefix, remaining) => {
    if (!remaining.length) { result.push(prefix); return; }
    remaining.forEach((item, index) => build([...prefix, item], [...remaining.slice(0, index), ...remaining.slice(index + 1)]));
  };
  build([], Array.from({ length }, (_, index) => index));
  return result;
}

export function compareRelations(actual, expected, options = {}) {
  const settings = { columnOrder: true, columnLabels: false, rowOrder: false, numericTolerance: 0, ...options };
  const left = normalizeRelation(actual); const right = normalizeRelation(expected);
  if (left.columns.length !== right.columns.length) return { correct: false, level: 'incorrect', reason: 'Die Anzahl der ausgegebenen Spalten passt noch nicht.' };
  if (settings.columnLabels && settings.columnOrder && left.columns.some((column, index) => column !== right.columns[index])) return { correct: false, level: 'partial', reason: 'Die Ergebnisspalten brauchen noch die passenden Namen.' };
  const columnMappings = settings.columnOrder
    ? [Array.from({ length: left.columns.length }, (_, index) => index)]
    : settings.columnLabels
      ? permutations(left.columns.length).filter((mapping) => mapping.every((actualIndex, expectedIndex) => left.columns[actualIndex] === right.columns[expectedIndex]))
      : permutations(left.columns.length);
  if (!columnMappings.length) return { correct: false, level: 'partial', reason: 'Die Ergebnisspalten brauchen noch die passenden Namen.' };
  const canonical = (relation) => relation.values.map((row) => row.map((value) => typeof value === 'number' && settings.numericTolerance ? Math.round(value / settings.numericTolerance) * settings.numericTolerance : value));
  const rightRows = canonical(right);
  const matches = columnMappings.some((mapping) => {
    const leftRows = canonical(left).map((row) => mapping.map((index) => row[index]));
    if (settings.rowOrder) return leftRows.length === rightRows.length && leftRows.every((row, index) => rowKey(row) === rowKey(rightRows[index]));
    const counts = new Map(rightRows.map((row) => [rowKey(row), 0]));
    rightRows.forEach((row) => counts.set(rowKey(row), counts.get(rowKey(row)) + 1));
    leftRows.forEach((row) => counts.set(rowKey(row), (counts.get(rowKey(row)) || 0) - 1));
    return [...counts.values()].every((count) => count === 0);
  });
  return matches ? { correct: true, level: 'success' } : { correct: false, level: 'partial', reason: settings.rowOrder ? 'Die Datensätze oder ihre geforderte Reihenfolge passen noch nicht.' : 'Spalten stimmen teilweise, aber die ausgewählten Datensätze noch nicht.' };
}

export function explainSqlError(error) {
  const message = String(error?.message || error || '');
  if (/no such table/i.test(message)) return 'Prüfe den Tabellennamen. In dieser Aufgabe heißt die Tabelle users.';
  if (/no such column/i.test(message)) return 'Prüfe den Attributnamen und seine Schreibweise.';
  if (/ambiguous column/i.test(message)) return 'Gib vor der Spalte an, aus welcher Tabelle sie stammt.';
  if (/syntax error|near/i.test(message)) return 'Prüfe die SQL-Syntax in der Nähe des genannten Ausdrucks.';
  return 'Die Abfrage konnte nicht ausgeführt werden. Prüfe Schreibweise, Anführungszeichen und SQL-Syntax.';
}

export function isValidScriptServerUrl(url) {
  try {
    const parsed = new URL(String(url || '').trim());
    return parsed.protocol === 'https:' && parsed.hostname === 'script.google.com' && parsed.pathname.endsWith('/exec');
  } catch {
    return false;
  }
}

export function classifyDescriptionResult(result) {
  if (!result || result.ok !== true) {
    return { level: 'error', text: result?.message || 'Die Rückmeldung konnte nicht erstellt werden.' };
  }
  const status = String(result.status || '').trim().toLocaleLowerCase('de');
  const level = status === 'korrekt' ? 'success' : status === 'teilweise korrekt' ? 'partial' : 'hint';
  return { level, text: result.feedback || 'Die Rückmeldung ist eingetroffen.' };
}
