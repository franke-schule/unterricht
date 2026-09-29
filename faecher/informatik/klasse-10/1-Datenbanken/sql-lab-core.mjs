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

const USER_COLUMNS = new Set(['id', 'name', 'username', 'email', 'email_verified_at', 'password', 'bio', 'gender', 'birthday', 'city', 'country', 'centimeters', 'avatar', 'role', 'is_active', 'remember_token', 'created_at', 'updated_at']);
const TEXT_COLUMNS = new Set(['name', 'username', 'email', 'password', 'bio', 'gender', 'city', 'country', 'avatar', 'role', 'remember_token']);
const FLEXIBLE_PROJECTIONS = new Set(['*', 'name', 'username', 'name,username', 'username,name']);

export function sqlTokens(sql) {
  const text = String(sql || ''); const tokens = [];
  for (let i = 0; i < text.length;) {
    const start = i; const char = text[i]; const next = text[i + 1];
    if (/\s/.test(char)) { i += 1; continue; }
    if (char === '-' && next === '-') { i = text.indexOf('\n', i + 2); if (i < 0) break; continue; }
    if (char === '/' && next === '*') { const end = text.indexOf('*/', i + 2); if (end < 0) break; i = end + 2; continue; }
    if (char === "'" || char === '"') { const quote = char; i += 1; while (i < text.length) { if (text[i] === quote && text[i + 1] === quote) { i += 2; continue; } if (text[i++] === quote) break; } tokens.push({ type: 'string', value: text.slice(start, i), start, end: i }); continue; }
    if (/[A-Za-z_]/.test(char)) { i += 1; while (i < text.length && /[\w]/.test(text[i])) i += 1; tokens.push({ type: 'word', value: text.slice(start, i), start, end: i }); continue; }
    if (/\d/.test(char)) { i += 1; while (i < text.length && /[\d.]/.test(text[i])) i += 1; tokens.push({ type: 'number', value: text.slice(start, i), start, end: i }); continue; }
    i += 1; if ((['<', '>', '!'].includes(char) && text[i] === '=') || (char === '<' && text[i] === '>')) i += 1;
    tokens.push({ type: 'symbol', value: text.slice(start, i), start, end: i });
  }
  return tokens;
}

export function selectProjection(sql) {
  const tokens = sqlTokens(sql); let depth = 0; let select; let from;
  for (const token of tokens) {
    if (token.value === '(') depth += 1;
    else if (token.value === ')') depth -= 1;
    else if (!depth && token.type === 'word' && token.value.toUpperCase() === 'SELECT' && !select) select = token;
    else if (!depth && select && token.type === 'word' && token.value.toUpperCase() === 'FROM') { from = token; break; }
  }
  if (!select || !from) return null;
  const projection = tokens.filter((token) => token.start >= select.end && token.end <= from.start);
  const columns = []; let index = 0;
  while (index < projection.length) {
    if (columns.length && projection[index++]?.value !== ',') return null;
    if (projection[index]?.type === 'word' && projection[index + 1]?.value === '.') index += 2;
    const token = projection[index++];
    if (!token || !(token.type === 'word' || token.value === '*')) return null;
    columns.push(token.value.toLowerCase());
    if (index < projection.length && projection[index].value !== ',') return null;
  }
  return { columns, key: columns.join(','), start: select.end, end: from.start };
}

export function flexibleReferenceSql(referenceSql, userSql) {
  const selected = selectProjection(userSql);
  if (!selected || !FLEXIBLE_PROJECTIONS.has(selected.key)) return null;
  const reference = selectProjection(referenceSql);
  if (!reference) return null;
  return `${referenceSql.slice(0, reference.start)} ${selected.columns.join(', ')}\n${referenceSql.slice(reference.end)}`;
}

/** Resolve the deliberately small, teachable SELECT/FROM subset used in the two join tasks. */
export function analyzeMultiTableSelect(sql, schemas) {
  const tokens = sqlTokens(sql); const clauses = {}; let depth = 0;
  tokens.forEach((token, index) => { if (token.value === '(') depth += 1; else if (token.value === ')') depth -= 1; else if (!depth && token.type === 'word' && ['SELECT', 'FROM', 'WHERE', 'GROUP', 'HAVING', 'ORDER', 'LIMIT'].includes(token.value.toUpperCase()) && clauses[token.value.toUpperCase()] === undefined) clauses[token.value.toUpperCase()] = index; });
  if (clauses.SELECT === undefined || clauses.FROM === undefined) return null;
  const end = tokens.length; const next = (index) => Math.min(end, ...Object.values(clauses).filter((value) => value > index));
  const schema = new Map(schemas.map(({ table, columns }) => [table.toLowerCase(), { table, columns: columns.map(([name]) => name.toLowerCase()) }]));
  const from = tokens.slice(clauses.FROM + 1, next(clauses.FROM)); const aliases = new Map(); const tableAliases = new Map(); const tables = []; let i = 0;
  while (i < from.length) {
    const token = from[i];
    if (token.value === ',' || ['INNER', 'LEFT', 'RIGHT', 'CROSS', 'OUTER', 'JOIN'].includes(token.value.toUpperCase())) { i += 1; continue; }
    if (token.value.toUpperCase() === 'ON') { i += 1; while (i < from.length && from[i].value !== ',' && from[i].value.toUpperCase() !== 'JOIN') i += 1; continue; }
    if (token.type !== 'word') return null;
    const table = schema.get(token.value.toLowerCase()); if (!table) { tables.push(token.value); i += 1; continue; }
    tables.push(table.table); i += 1;
    if (from[i]?.value.toUpperCase() === 'AS') i += 1;
    let alias = table.table;
    if (from[i]?.type === 'word' && !['ON', 'INNER', 'LEFT', 'RIGHT', 'CROSS', 'OUTER', 'JOIN', 'WHERE'].includes(from[i].value.toUpperCase())) alias = from[i++].value;
    aliases.set(alias.toLowerCase(), table);
    aliases.set(table.table.toLowerCase(), table);
    tableAliases.set(table.table, alias);
  }
  const select = tokens.slice(clauses.SELECT + 1, clauses.FROM); const groups = []; let part = []; depth = 0;
  for (const token of select) { if (token.value === '(') depth += 1; else if (token.value === ')') depth -= 1; if (!depth && token.value === ',') { groups.push(part); part = []; } else part.push(token); } groups.push(part);
  const columns = groups.map((group) => {
    if (group.length === 1 && group[0].value === '*') return { star: true };
    const expression = group[1]?.value === '.' ? group.slice(0, 3) : group.slice(0, 1);
    const qualified = expression.length === 3 && expression[0].type === 'word' && expression[2].type === 'word';
    if (!qualified && !(expression.length === 1 && expression[0]?.type === 'word')) return null;
    const suffix = group.slice(expression.length);
    if (suffix.length && !(suffix.length === 1 && suffix[0].type === 'word') && !(suffix.length === 2 && suffix[0].value.toUpperCase() === 'AS' && suffix[1].type === 'word')) return null;
    const name = expression[qualified ? 2 : 0].value.toLowerCase();
    const matches = qualified ? [aliases.get(expression[0].value.toLowerCase())].filter((table) => table?.columns.includes(name)) : [...new Set(aliases.values())].filter((table) => table.columns.includes(name));
    if (matches.length !== 1) return null;
    return { table: matches[0].table, name };
  });
  return { tables, tableAliases, columns, projection: columns.every(Boolean) && columns.length > 0 ? columns : null, selectStart: tokens[clauses.SELECT].end, fromStart: tokens[clauses.FROM].start, clauseFor(name) { const matches = Object.entries(clauses).sort((a, b) => a[1] - b[1]); const hits = tokens.flatMap((token, index) => token.type === 'word' && token.value.toLowerCase() === name.toLowerCase() ? [index] : []); const locations = hits.map((index) => matches.filter(([, start]) => start <= index).at(-1)?.[0]); return locations.length && locations.every((value) => value === locations[0]) ? locations[0] : null; } };
}

export function diagnoseMultiTableError(error, sql, tables, schemas) {
  const message = String(error?.message || error || '');
  const fromText = `FROM: Verwende die drei Tabellen ${tables.slice(0, -1).join(', ')} und ${tables.at(-1)}. Prüfe ihre Namen und ob eine Tabelle fehlt.`;
  if (/no such table/i.test(message)) return fromText;
  const unknown = message.match(/(?:no such column|ambiguous column name):\s*([^\s]+)/i);
  if (unknown) {
    const name = unknown[1].replace(/["'`]/g, '').split('.').pop();
    const analysis = analyzeMultiTableSelect(sql, schemas); const clause = analysis?.clauseFor(name);
    const tokens = sqlTokens(sql);
    const unquotedPizzaValue = tokens.some((token, index) => token.type === 'word' && token.value.toLowerCase() === 'pizza'
      && tokens[index - 1]?.value !== '.' && tokens[index + 1]?.value !== '.'
      && ['=', '!=', '<>', 'LIKE'].includes(tokens[index - 1]?.value.toUpperCase())
      && tokens[index - 2]?.type === 'word' && tokens[index - 2]?.value.toLowerCase() === 'name');
    if (/no such column/i.test(message) && name.toLowerCase() === 'pizza' && clause === 'WHERE' && unquotedPizzaValue) return "WHERE: Setze den Textwert Pizza in Anführungszeichen, zum Beispiel 'Pizza'.";
    if (clause === 'SELECT' || clause === 'WHERE') return /ambiguous/i.test(message) ? `${clause}: Gib vor ${name} den Tabellennamen an, damit die Spalte eindeutig ist.` : `${clause}: Prüfe den ${clause === 'SELECT' ? 'Spaltennamen' : 'Attributnamen'} ${name}.`;
  }
  return 'SQL-Syntax: Prüfe den Aufbau deiner Abfrage und die Schreibweise der Tabellen und Spalten.';
}

export function diagnoseSqlTask(sql, task, actual, expected, comparison) {
  const selected = selectProjection(sql);
  const reference = selectProjection(task.referenceSql);
  if (task.flexible && selected && !FLEXIBLE_PROJECTIONS.has(selected.key)) return 'SELECT: Gib alle Spalten, name, username oder beide Namensspalten aus.';
  if (task.id === 'b2-5' && selected?.key === 'username') return 'SELECT: Gefragt ist name. username enthält den Benutzernamen.';
  if (reference && selected && !task.flexible && ['name', '*', 'birthday,username', 'username,birthday'].includes(reference.key)) {
    const required = reference.key === 'birthday,username' ? new Set(['birthday,username', 'username,birthday']) : new Set([reference.key]);
    if (!required.has(selected.key)) return 'SELECT: Prüfe, welche Spalten die Aufgabe verlangt.';
  }
  if (comparison.correct) return null;
  // SQL.js liefert bei einer leeren Ergebnisrelation auch keine Spaltenmetadaten.
  if (!actual.columns.length && !actual.values.length && selected && (task.flexible || selected.key === reference?.key)) return 'Teilweise korrekt: Prüfe die Bedingung in WHERE.';
  if (actual.columns.length !== expected.columns.length) return 'SELECT: Prüfe, welche Spalten die Aufgabe verlangt.';
  if (task.rowOrder) {
    const unordered = compareRelations(actual, expected, { columnOrder: task.columnOrder !== false, rowOrder: false });
    if (unordered.correct) return 'Teilweise korrekt: Prüfe die Reihenfolge in ORDER BY.';
  }
  if (selected && (task.flexible || selected.key === reference?.key)) return 'Teilweise korrekt: Prüfe die Bedingung in WHERE.';
  return 'Noch nicht korrekt: Prüfe die ausgegebenen Spalten und die Bedingungen.';
}

export function diagnoseSqlError(error, sql) {
  const message = String(error?.message || error || '');
  if (/no such table/i.test(message)) return 'FROM: Die Tabelle heißt users. Prüfe den Tabellennamen.';
  const noColumn = message.match(/no such column:\s*([^\s]+)/i);
  if (noColumn) {
    const attribute = noColumn[1].replace(/["'`]/g, '').split('.').pop();
    const quote = missingTextQuote(sql, attribute);
    if (quote) return quote;
    const projection = selectProjection(sql);
    const inSelect = projection && sqlTokens(sql).some((token) => token.type === 'word' && token.value.toLowerCase() === attribute.toLowerCase() && token.start >= projection.start && token.end <= projection.end);
    return inSelect ? `SELECT: Prüfe den Spaltennamen ${attribute}.` : `WHERE: Prüfe den Attributnamen ${attribute}.`;
  }
  if (/unterminated|unrecognized token|syntax error|near/i.test(message)) return 'SQL-Syntax: Prüfe den Aufbau deiner Abfrage.';
  return 'SQL-Syntax: Prüfe den Aufbau deiner Abfrage.';
}

export function missingTextQuote(sql, candidate) {
  const tokens = sqlTokens(sql); const wanted = String(candidate).toLowerCase();
  const where = tokens.findIndex((token) => token.type === 'word' && token.value.toUpperCase() === 'WHERE');
  if (where < 0) return null;
  for (let i = where + 1; i < tokens.length - 2; i += 1) {
    const left = tokens[i], op = tokens[i + 1], right = tokens[i + 2];
    if (left.type !== 'word' || !TEXT_COLUMNS.has(left.value.toLowerCase())) continue;
    if (!['=', '!=', '<>', 'LIKE'].includes(op.value.toUpperCase())) continue;
    if (right.type !== 'word' || right.value.toLowerCase() !== wanted || USER_COLUMNS.has(wanted) || ['null', 'true', 'false'].includes(wanted)) continue;
    if (tokens[i + 3]?.value === '(') continue;
    return `WHERE: Setze den Textwert ${right.value} in Anführungszeichen, zum Beispiel '${right.value}'.`;
  }
  return null;
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
  const level = status === 'korrekt' ? 'high' : status === 'teilweise korrekt' ? 'medium' : 'low';
  return {
    level,
    points: Number(result.points) || 0,
    maxPoints: Number(result.maxPoints) || 0,
    status: result.status || 'noch nicht korrekt',
    strengths: Array.isArray(result.strengths) ? result.strengths.map(String).slice(0, 4) : [],
    missing: Array.isArray(result.missing) ? result.missing.map(String).slice(0, 4) : [],
    text: result.feedback || 'Überprüfe deine Antwort noch einmal.'
  };
}
