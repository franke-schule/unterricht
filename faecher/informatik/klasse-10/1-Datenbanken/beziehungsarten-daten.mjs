/**
 * Gemeinsame, fachlich verbindliche Datenquelle für Aufgabe 8 (1:1- und
 * n:m-Beziehungen). Enthält die festen Beispieldaten (Schule, InstaHub),
 * das Abschlussquiz und reine Auswertungsfunktionen. Zur Laufzeit wird keine
 * CSV geladen; die InstaHub-Werte hier sind fest eingetragen und werden vom
 * Test gegen users.csv, photos.csv und follows.csv geprüft.
 */

// ---------------------------------------------------------------------------
// Schule: 1:1-Beziehung (Klasse – Klassenleiter), erfundenes Schulbeispiel
// ---------------------------------------------------------------------------
export const KLASSE = Object.freeze([
  Object.freeze({ id: 1, name: "10a" }),
  Object.freeze({ id: 2, name: "10b" }),
  Object.freeze({ id: 3, name: "10c" }),
]);

export const KLASSENLEITER = Object.freeze([
  Object.freeze({ id: 1, kuerzel: "SEI", klasse_id: 2 }),
  Object.freeze({ id: 2, kuerzel: "BRA", klasse_id: 3 }),
  Object.freeze({ id: 3, kuerzel: "KOH", klasse_id: 1 }),
]);

// Lösung: klasse.id -> Kürzel des Klassenleiters, der über klasse_id verweist.
export const KLASSE_LEITER_LOESUNG = Object.freeze(
  Object.fromEntries(KLASSENLEITER.map((leiter) => [leiter.klasse_id, leiter.kuerzel]))
);

// Typischer Fehler: die id des Klassenleiters mit der id der Klasse vergleichen
// (SEI hat id 1 -> 10a, BRA hat id 2 -> 10b, KOH hat id 3 -> 10c).
export const KLASSE_LEITER_ID_VERWECHSLUNG = Object.freeze(
  Object.fromEntries(KLASSENLEITER.map((leiter) => [leiter.id, leiter.kuerzel]))
);

// ---------------------------------------------------------------------------
// Schule: n:m-Beziehung (Schüler – AG)
// ---------------------------------------------------------------------------
export const SCHUELER = Object.freeze([
  Object.freeze({ id: 1, name: "Lina" }),
  Object.freeze({ id: 2, name: "Ben" }),
  Object.freeze({ id: 3, name: "Mia" }),
]);

export const AG = Object.freeze([
  Object.freeze({ id: 1, name: "Robotik" }),
  Object.freeze({ id: 2, name: "Theater" }),
  Object.freeze({ id: 3, name: "Chor" }),
]);

// Hilfstabelle teilnahme: bewusst ohne eigene id (mindestens die zwei Fremdschlüssel).
export const TEILNAHME = Object.freeze([
  Object.freeze({ schueler_id: 1, ag_id: 1 }),
  Object.freeze({ schueler_id: 1, ag_id: 2 }),
  Object.freeze({ schueler_id: 2, ag_id: 1 }),
  Object.freeze({ schueler_id: 3, ag_id: 2 }),
  Object.freeze({ schueler_id: 3, ag_id: 3 }),
]);

// Versuchstabelle aus R3: schueler(id, name, ag_id) mit offenen Zellen bei Lina und Mia.
export const SCHUELER_VERSUCH = Object.freeze([
  Object.freeze({ id: 1, name: "Lina", ag_id: null }),
  Object.freeze({ id: 2, name: "Ben", ag_id: 1 }),
  Object.freeze({ id: 3, name: "Mia", ag_id: null }),
]);

export function agIdsForSchueler(schuelerId) {
  return TEILNAHME.filter((row) => row.schueler_id === schuelerId).map((row) => row.ag_id);
}

export function schuelerIdsForAg(agId) {
  return TEILNAHME.filter((row) => row.ag_id === agId).map((row) => row.schueler_id);
}

// ---------------------------------------------------------------------------
// InstaHub: users, photos, likes, follows (feste Werte, siehe Spezifikation)
// ---------------------------------------------------------------------------
export const INSTAHUB_USERS = Object.freeze([
  Object.freeze({ id: 1, username: "zornigerfotograf" }),
  Object.freeze({ id: 3, username: "bergcoder" }),
  Object.freeze({ id: 4, username: "koch_kicker" }),
  Object.freeze({ id: 15, username: "reisewut_emil" }),
  Object.freeze({ id: 18, username: "gamewut_jonas" }),
  Object.freeze({ id: 52, username: "oekosmasher" }),
  Object.freeze({ id: 117, username: "reisejoule" }),
  Object.freeze({ id: 138, username: "wanderriese_taro" }),
]);

export function usernameById(id) {
  return INSTAHUB_USERS.find((user) => user.id === Number(id))?.username ?? "";
}

// Beschreibungen exakt wie in photos.csv (Anfang), auf höchstens 60 Zeichen
// gekürzt und danach mit " …" versehen.
export function truncateDescription(text, max = 60) {
  const characters = [...String(text ?? "")];
  if (characters.length <= max) return String(text ?? "");
  return `${characters.slice(0, max).join("").trimEnd()} …`;
}

const PHOTO_12_DESCRIPTION_FULL =
  "Bin gerade am Debuggen mitten im Wald - das ist wahre #Codeliebe 🌲🧑‍💻 #HackathonHero #NaturUndCode";
const PHOTO_14_DESCRIPTION_FULL = "Ein neues Rezept ausprobiert! 🍴 #FoodieFeed #MasterChef";

export const INSTAHUB_PHOTOS = Object.freeze([
  Object.freeze({ id: 12, user_id: 3, description: truncateDescription(PHOTO_12_DESCRIPTION_FULL) }),
  Object.freeze({ id: 14, user_id: 4, description: truncateDescription(PHOTO_14_DESCRIPTION_FULL) }),
]);

// likes: Beispiel der Folie. Es gibt keine likes.csv, deshalb nur die zwei
// Fremdschlüssel-Spalten - keine id- oder Datumswerte erfinden.
export const INSTAHUB_LIKES = Object.freeze([
  Object.freeze({ user_id: 15, photo_id: 12 }),
  Object.freeze({ user_id: 15, photo_id: 14 }),
  Object.freeze({ user_id: 18, photo_id: 14 }),
]);

export function likedPhotoIdsByUser(userId) {
  return INSTAHUB_LIKES.filter((like) => like.user_id === Number(userId)).map((like) => like.photo_id);
}

export function likingUserIdsForPhoto(photoId) {
  return INSTAHUB_LIKES.filter((like) => like.photo_id === Number(photoId)).map((like) => like.user_id);
}

// follows: echte CSV-Zeilen 1, 2 und 947.
// Deutung (Entscheidung des Planers, im Review bestätigt): follower_id ist,
// wer folgt; following_id ist, wem gefolgt wird. Begründung: englische
// Wortbedeutung ("follower" folgt, "following" wird gefolgt); außerdem
// erreicht eine following_id bis zu 91 Zeilen (beliebte Konten), eine
// follower_id höchstens 35 - die Verteilung passt zu wenigen stark gefolgten
// Konten. follows.csv enthält doppelte Paare (z. B. ids 2239/2240 = 1/117);
// hier werden nur drei ausgewählte Zeilen gezeigt.
export const INSTAHUB_FOLLOWS = Object.freeze([
  Object.freeze({ id: 1, following_id: 1, follower_id: 117 }),
  Object.freeze({ id: 2, following_id: 117, follower_id: 1 }),
  Object.freeze({ id: 947, following_id: 52, follower_id: 138 }),
]);

// ---------------------------------------------------------------------------
// Kardinalitäten
// ---------------------------------------------------------------------------
export function normalizeCardinality(value) {
  return String(value ?? "").trim().toLowerCase();
}

const VALID_CARDINALITY_LETTERS = new Set(["1", "n", "m"]);

/**
 * Reine Funktion zur Bewertung eines Kardinalitätspaars.
 * kind ∈ "1:1", "n:m", "1:n" (Seiten fest: erster Wert = 1-Seite, zweiter = n-Seite).
 * Rückgabe { status: correct|partial|wrong|missing|invalid, reason }.
 */
export function evaluateCardinalityPair(rawA, rawB, kind) {
  const a = normalizeCardinality(rawA);
  const b = normalizeCardinality(rawB);
  if (!a || !b) return { status: "missing", reason: "missing" };
  if (!VALID_CARDINALITY_LETTERS.has(a) || !VALID_CARDINALITY_LETTERS.has(b)) {
    return { status: "invalid", reason: "invalid" };
  }

  if (kind === "1:1") {
    if (a === "1" && b === "1") return { status: "correct", reason: "correct" };
    if (a === "1" || b === "1") return { status: "partial", reason: "one-side" };
    return { status: "wrong", reason: "neither-one" };
  }

  if (kind === "n:m") {
    if ((a === "n" && b === "m") || (a === "m" && b === "n")) return { status: "correct", reason: "correct" };
    if (a === b && (a === "n" || a === "m")) return { status: "partial", reason: "same-letter" };
    if ((a === "1") !== (b === "1")) return { status: "partial", reason: "one-is-1" };
    if (a === "1" && b === "1") return { status: "wrong", reason: "both-1" };
    return { status: "wrong", reason: "other" };
  }

  if (kind === "1:n") {
    if (a === "1" && b === "n") return { status: "correct", reason: "correct" };
    if (a === "1" && b === "m") return { status: "partial", reason: "m-instead-of-n" };
    return { status: "wrong", reason: "other" };
  }

  return { status: "invalid", reason: "unknown-kind" };
}

// ---------------------------------------------------------------------------
// R2 Übertragen: Tabellenschemata für Schlüssel 1 ───── 1 Schloss selbst tippen.
// Syntax und Akzeptanzkriterien wie in Aufgabe 4 (tabellenschema.js):
// tabellenname( bzw. tabellenname {, je Zeile attribut: datentyp, eigene
// Schlusszeile ) bzw. }; Einrückung, Groß-/Kleinschreibung und Reihenfolge der
// Attribute sind egal. Neu: Fremdschlüsselzeilen name[tabelle]: datentyp und
// mehrere Tabellen in einem Feld. Die Reihenfolge der Tabellen ist ebenfalls egal.
// ---------------------------------------------------------------------------
export const SCHLUESSEL_SCHLOSS_TABLES = Object.freeze({
  schluessel: Object.freeze({ id: "int", nummer: "int", besitzer: "varchar(255)" }),
  schloss: Object.freeze({ id: "int", ort: "varchar(255)" }),
});

// Pro Tabelle der Fremdschlüssel, der dort stehen dürfte (Möglichkeit A bzw. B).
export const SCHLUESSEL_SCHLOSS_FOREIGN_KEYS = Object.freeze({
  schluessel: Object.freeze({ name: "schloss_id", ref: "schloss", type: "int" }),
  schloss: Object.freeze({ name: "schluessel_id", ref: "schluessel", type: "int" }),
});

function normalizeName(value) {
  return String(value ?? "").trim().toLowerCase();
}

export function parseMultiSchemaText(value) {
  const text = String(value ?? "").replaceAll("\r", "");
  const tables = [];
  const errors = [];
  if (/[äöüß]/i.test(text)) {
    errors.push("Verwende in Tabellen- und Attributnamen keine Umlaute: Schreibe z. B. ue statt ü.");
    return { tables, errors };
  }
  let current = null;
  text.split("\n").forEach((rawLine, index) => {
    const line = rawLine.trim();
    if (!line) return;
    const lineNumber = index + 1;
    if (line === ")" || line === "}") {
      if (!current) { errors.push(`Zeile ${lineNumber}: Vor dieser schließenden Klammer beginnt keine Tabelle.`); return; }
      if (line !== current.closing) errors.push(`Schließe ${current.table} mit derselben Klammerart, mit der du geöffnet hast: ${current.opening} … ${current.closing}.`);
      if (!current.rows.length) errors.push(`Zwischen die Klammern von ${current.table} gehören die Attribute.`);
      tables.push({ table: current.table, rows: current.rows });
      current = null;
      return;
    }
    const header = line.match(/^([a-z_][a-z0-9_]*)\s*([({])$/i);
    if (header) {
      if (current) {
        errors.push(`Setze die schließende Klammer von ${current.table} in eine eigene Zeile, bevor die nächste Tabelle beginnt.`);
        tables.push({ table: current.table, rows: current.rows });
      }
      current = { table: normalizeName(header[1]), opening: header[2], closing: header[2] === "{" ? "}" : ")", rows: [] };
      return;
    }
    if (!current) {
      errors.push(`Zeile ${lineNumber}: Beginne jede Tabelle mit Tabellenname und öffnender Klammer in einer eigenen Zeile, z. B. tabelle( oder tabelle {.`);
      return;
    }
    const attribute = line.match(/^([a-z_][a-z0-9_]*)\s*(?:\[\s*([a-z_][a-z0-9_]*)\s*\])?\s*:\s*(varchar\(255\)|int|char|date)$/i);
    if (!attribute) { errors.push(`Zeile ${lineNumber}: Schreibe attribut: datentyp.`); return; }
    current.rows.push({ name: normalizeName(attribute[1]), ref: normalizeName(attribute[2]), type: normalizeName(attribute[3]) });
  });
  if (current) {
    errors.push(`Setze die schließende Klammer von ${current.table} in eine eigene Zeile.`);
    tables.push({ table: current.table, rows: current.rows });
  }
  if (!tables.length && !errors.length) errors.push("Das Feld ist noch leer.");
  return { tables, errors };
}

/**
 * Bewertet eine Möglichkeit (ein Eingabefeld) für Schlüssel 1 ───── 1 Schloss.
 * Rückgabe: { correct, variant ("schluessel" | "schloss" | null), issues, namedCorrect }.
 * variant nennt die Tabelle, in der der (einzige, richtige) Fremdschlüssel steht.
 */
export function evaluateOneToOneVariant(parsed) {
  const issues = [];
  let namedCorrect = 0;
  const expectedNames = Object.keys(SCHLUESSEL_SCHLOSS_TABLES);
  const names = parsed.tables.map((table) => table.table);
  const duplicateTables = [...new Set(names.filter((name, index) => names.indexOf(name) !== index))];
  const extraTables = [...new Set(names.filter((name) => !expectedNames.includes(name)))];
  const missingTables = expectedNames.filter((name) => !names.includes(name));
  missingTables.forEach((name) => issues.push(`Es fehlt die Tabelle ${name}. Jede Möglichkeit besteht aus beiden Tabellen.`));
  extraTables.forEach((name) => issues.push(`Die Tabelle ${name} ist nicht erwartet. Prüfe den Tabellennamen.`));
  duplicateTables.forEach((name) => issues.push(`Die Tabelle ${name} steht doppelt in diesem Feld.`));

  const tablesWithForeignKey = [];
  let foreignKeysValid = true;
  expectedNames.forEach((tableName) => {
    const table = parsed.tables.find((entry) => entry.table === tableName);
    if (!table) return;
    const expectedAttributes = SCHLUESSEL_SCHLOSS_TABLES[tableName];
    const foreignKey = SCHLUESSEL_SCHLOSS_FOREIGN_KEYS[tableName];
    const foreignRows = table.rows.filter((row) => row.ref || row.name === foreignKey.name);
    const ownRows = table.rows.filter((row) => !foreignRows.includes(row));

    const ownNames = ownRows.map((row) => row.name);
    const duplicates = [...new Set(ownNames.filter((name, index) => ownNames.indexOf(name) !== index))];
    const actual = new Map(ownRows.map((row) => [row.name, row.type]));
    const required = Object.keys(expectedAttributes);
    const missing = required.filter((name) => !actual.has(name));
    const extra = [...actual.keys()].filter((name) => !required.includes(name));
    const wrongTypes = required.filter((name) => actual.has(name) && actual.get(name) !== expectedAttributes[name]);
    namedCorrect += required.filter((name) => actual.has(name) && actual.get(name) === expectedAttributes[name]).length;
    if (missing.length) issues.push(`In ${tableName} fehlt: ${missing.join(", ")}.`);
    if (wrongTypes.length) issues.push(`In ${tableName} passt der Datentyp bei ${wrongTypes.join(", ")} noch nicht.`);
    if (extra.length) issues.push(`In ${tableName} nicht erwartet: ${extra.join(", ")}.`);
    if (duplicates.length) issues.push(`In ${tableName} doppelt: ${duplicates.join(", ")}.`);

    if (!foreignRows.length) return;
    tablesWithForeignKey.push(tableName);
    if (foreignRows.length > 1) { foreignKeysValid = false; issues.push(`In ${tableName} stehen mehrere Fremdschlüssel. Für die Verbindung reicht einer.`); return; }
    const row = foreignRows[0];
    if (!row.ref) { foreignKeysValid = false; issues.push(`${row.name} in ${tableName} ist ein Fremdschlüssel. Nenne in eckigen Klammern die Tabelle, auf die er verweist – wie bei user_id[users].`); return; }
    if (row.ref === tableName) { foreignKeysValid = false; issues.push(`Der Fremdschlüssel in ${tableName} verweist auf ${tableName} selbst. Er soll die Verbindung zur anderen Tabelle herstellen.`); return; }
    if (row.ref !== foreignKey.ref) { foreignKeysValid = false; issues.push(`Der Fremdschlüssel in ${tableName} verweist auf ${row.ref}. Diese Tabelle gibt es hier nicht.`); return; }
    if (row.name !== foreignKey.name) { foreignKeysValid = false; issues.push(`Benenne den Fremdschlüssel in ${tableName} wie gewohnt nach der Tabelle, auf die er verweist, mit angehängtem _id – wie bei user_id[users].`); return; }
    if (row.type !== foreignKey.type) { foreignKeysValid = false; issues.push(`Der Fremdschlüssel ${row.name} speichert die id eines Datensatzes. Prüfe seinen Datentyp.`); return; }
    namedCorrect += 1;
  });

  if (tablesWithForeignKey.length > 1) {
    issues.push("Hier steht die Verbindung doppelt – in schluessel und in schloss. Beide Verweise müssten immer zueinander passen, sonst widersprechen sie sich wie bei den Redundanzen aus Aufgabe 2. Ein Fremdschlüssel reicht.");
  } else if (!tablesWithForeignKey.length && !missingTables.length) {
    issues.push("Es fehlt ein Fremdschlüssel. Ohne ihn weiß die Datenbank nicht, welcher Schlüssel welches Schloss öffnet.");
  }
  const variant = tablesWithForeignKey.length === 1 && foreignKeysValid ? tablesWithForeignKey[0] : null;
  return { correct: !issues.length && variant !== null, variant, issues, namedCorrect };
}

const SCHLUESSEL_SCHLOSS_SIDE_LABELS = ["Möglichkeit 1", "Möglichkeit 2"];

/**
 * Gesamtbewertung beider Eingabefelder. Welche Möglichkeit links oder rechts
 * steht, ist egal; verlangt sind beide verschiedenen Möglichkeiten.
 * Rückgabe: { status: success|partial|hint, message, sides }.
 */
export function evaluateSchluesselSchlossAnswer(textA, textB) {
  const sides = [textA, textB].map((text) => {
    const empty = !String(text ?? "").trim();
    const parsed = parseMultiSchemaText(text);
    if (empty) return { empty: true, correct: false, variant: null, namedCorrect: 0, messages: [] };
    if (parsed.errors.length) return { empty: false, correct: false, variant: null, namedCorrect: 0, messages: [parsed.errors[0]] };
    const result = evaluateOneToOneVariant(parsed);
    return { empty: false, correct: result.correct, variant: result.variant, namedCorrect: result.namedCorrect, messages: result.issues };
  });

  if (sides.every((side) => side.empty)) {
    return { status: "hint", message: "Noch nicht korrekt: Notiere in jedem Feld eine Möglichkeit mit beiden Tabellen.", sides };
  }
  if (sides.every((side) => side.correct)) {
    if (sides[0].variant !== sides[1].variant) {
      return { status: "success", message: `Richtig: In ${SCHLUESSEL_SCHLOSS_SIDE_LABELS[0]} steht der Fremdschlüssel in ${sides[0].variant}, in ${SCHLUESSEL_SCHLOSS_SIDE_LABELS[1]} in ${sides[1].variant}. Bei einer 1:1-Beziehung darf er in einer der beiden Tabellen stehen – aber nur in einer.`, sides };
    }
    return { status: "partial", message: `Teilweise korrekt: Beide Felder sind richtig, zeigen aber dieselbe Möglichkeit – der Fremdschlüssel steht beide Male in ${sides[0].variant}. Bei 1:1 gibt es keine n-Seite. Kann er dann nicht auch in der anderen Tabelle stehen?`, sides };
  }
  const pieces = sides.map((side, index) => {
    const label = SCHLUESSEL_SCHLOSS_SIDE_LABELS[index];
    if (side.empty) return `${label} ist noch leer.`;
    if (side.correct) return `${label} stimmt.`;
    return `${label}: ${side.messages.join(" ")}`;
  });
  const progress = sides.some((side) => side.correct || side.namedCorrect > 0);
  return { status: progress ? "partial" : "hint", message: `${progress ? "Teilweise korrekt:" : "Noch nicht korrekt:"} ${pieces.join(" ")}`, sides };
}

// ---------------------------------------------------------------------------
// R4 Lückentexte (Eingabefelder). Jede Gruppe gehört zu einer oder mehreren
// Lücken. unordered: Die Werte der Gruppe dürfen in beliebiger Reihenfolge
// stehen (z. B. Robotik und Theater), jeder Wert zählt aber nur einmal.
// Sonst ist jede Angabe in answers eine gleichwertige Alternative.
// ---------------------------------------------------------------------------
export function normalizeClozeAnswer(value) {
  return String(value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

function normalizeAgName(value) {
  return normalizeClozeAnswer(value).replace(/^ag[\s-]+/, "").replace(/[\s-]+ag$/, "");
}

export const R4_CLOZES = Object.freeze({
  f4a: Object.freeze([
    Object.freeze({ gaps: ["id"], answers: ["1"] }),
    Object.freeze({ gaps: ["agId1", "agId2"], answers: ["1", "2"], unordered: true }),
    Object.freeze({ gaps: ["ag1", "ag2"], answers: ["robotik", "theater"], unordered: true, normalize: normalizeAgName }),
  ]),
  f4b: Object.freeze([
    Object.freeze({ gaps: ["id"], answers: ["2"] }),
    Object.freeze({ gaps: ["schuelerId1", "schuelerId2"], answers: ["1", "3"], unordered: true }),
    Object.freeze({ gaps: ["name1", "name2"], answers: ["lina", "mia"], unordered: true }),
  ]),
  f4c: Object.freeze([
    Object.freeze({ gaps: ["table"], answers: ["teilnahme"] }),
    Object.freeze({ gaps: ["row"], answers: ["zeile", "datensatz"] }),
    Object.freeze({ gaps: ["schuelerId"], answers: ["2"] }),
    Object.freeze({ gaps: ["agId"], answers: ["3"] }),
  ]),
});

export function r4ClozeGapIds(clozeId) {
  return R4_CLOZES[clozeId].flatMap((group) => group.gaps);
}

/**
 * Rückgabe: { gaps: { gapId: true|false }, correctCount, total, emptyCount }.
 */
export function evaluateCloze(clozeId, values) {
  const gaps = {};
  R4_CLOZES[clozeId].forEach((group) => {
    const normalize = group.normalize ?? normalizeClozeAnswer;
    if (!group.unordered) {
      group.gaps.forEach((gapId) => { gaps[gapId] = group.answers.includes(normalize(values?.[gapId])); });
      return;
    }
    const remaining = [...group.answers];
    group.gaps.forEach((gapId) => {
      const index = remaining.indexOf(normalize(values?.[gapId]));
      gaps[gapId] = index >= 0;
      if (index >= 0) remaining.splice(index, 1);
    });
  });
  const ids = Object.keys(gaps);
  return {
    gaps,
    correctCount: ids.filter((id) => gaps[id]).length,
    total: ids.length,
    emptyCount: ids.filter((id) => !normalizeClozeAnswer(values?.[id])).length,
  };
}

// ---------------------------------------------------------------------------
// Abschlussquiz (R8): Auswahlkästchen, exakte Menge verlangt.
// ---------------------------------------------------------------------------
export const BEZIEHUNGSARTEN_QUIZ = Object.freeze([
  Object.freeze({
    id: "q1-fremdschluessel-1-1",
    prompt: "Klasse 1 ───── 1 Klassenleiter: Wo darf der Fremdschlüssel stehen?",
    options: Object.freeze([
      Object.freeze({ id: "in-klassenleiter", text: "In klassenleiter als klasse_id[klasse].", correct: true }),
      Object.freeze({ id: "in-klasse", text: "In klasse als klassenleiter_id[klassenleiter].", correct: true }),
      Object.freeze({ id: "beide", text: "In beiden Tabellen gleichzeitig, sonst fehlt eine Richtung.", correct: false }),
      Object.freeze({ id: "hilfstabelle", text: "In einer neuen Hilfstabelle, weil jede Beziehung eine eigene Tabelle braucht.", correct: false }),
    ]),
    hint: "Bei 1:1 gibt es keine n-Seite. Ein Fremdschlüssel reicht – in einer der beiden Tabellen.",
  }),
  Object.freeze({
    id: "q2-hilfstabelle",
    prompt: "Was gilt für die Hilfstabelle einer n:m-Beziehung?",
    options: Object.freeze([
      Object.freeze({ id: "beide-primaerschluessel", text: "Sie enthält die Primärschlüssel beider Tabellen als Fremdschlüssel.", correct: true }),
      Object.freeze({ id: "genau-ein-datensatz", text: "Jede Zeile verbindet genau einen Datensatz der einen mit genau einem Datensatz der anderen Tabelle.", correct: true }),
      Object.freeze({ id: "zusatzspalten-erlaubt", text: "Sie darf zusätzliche Spalten wie id oder created_at haben.", correct: true }),
      Object.freeze({ id: "mehrere-ids-in-zelle", text: "In einer Zelle dürfen mehrere ids stehen, z. B. »2, 5«.", correct: false }),
    ]),
    hint: "Denke an likes: user_id und photo_id, in jeder Zelle genau ein Wert.",
  }),
  Object.freeze({
    id: "q3-n-m-bedeutung",
    prompt: "users n ───── m photos (kann liken): Was bedeutet das?",
    options: Object.freeze([
      Object.freeze({ id: "benutzer-viele-fotos", text: "Ein Benutzer kann viele Fotos liken.", correct: true }),
      Object.freeze({ id: "foto-viele-benutzer", text: "Ein Foto kann von vielen Benutzern geliked werden.", correct: true }),
      Object.freeze({ id: "feste-zahlen", text: "Genau n Benutzer liken genau m Fotos.", correct: false }),
      Object.freeze({ id: "foto-gehoert-mehreren", text: "Jedes Foto gehört mehreren Benutzern.", correct: false }),
    ]),
    hint: "n und m stehen für »beliebig viele«. Lies die Beziehung in beide Richtungen.",
  }),
  Object.freeze({
    id: "q4-likes-zeile",
    prompt: "In likes steht die Zeile user_id 18, photo_id 14. Was bedeutet sie?",
    options: Object.freeze([
      Object.freeze({ id: "benutzer18-liked-foto14", text: "Benutzer 18 hat Foto 14 geliked.", correct: true }),
      Object.freeze({ id: "benutzer18-hochgeladen", text: "Benutzer 18 hat Foto 14 hochgeladen.", correct: false }),
      Object.freeze({ id: "foto18-liked", text: "Foto 18 wurde von Benutzer 14 geliked.", correct: false }),
      Object.freeze({ id: "genau-14-likes", text: "Benutzer 18 hat genau 14 Likes vergeben.", correct: false }),
    ]),
    hint: "Jeder Fremdschlüssel verweist auf die Tabelle in seinen eckigen Klammern. Wer ein Foto hochgeladen hat, steht in photos.user_id.",
  }),
  Object.freeze({
    id: "q5-follows",
    prompt: "Was gilt für die Tabelle follows?",
    options: Object.freeze([
      Object.freeze({ id: "beide-fk-users", text: "Beide Fremdschlüssel verweisen auf users.", correct: true }),
      Object.freeze({ id: "zwei-zeilen-gegenseitig", text: "Folgen sich zwei Benutzer gegenseitig, braucht follows dafür zwei Zeilen.", correct: true }),
      Object.freeze({ id: "spalte-in-users", text: "follows ist überflüssig, weil man die Follower als weitere Spalte in users speichern kann.", correct: false }),
      Object.freeze({ id: "falsche-richtung", text: "Die Zeile following_id 1, follower_id 117 bedeutet: Benutzer 1 folgt Benutzer 117.", correct: false }),
    ]),
    hint: "follower_id ist der, der folgt. following_id ist der, dem gefolgt wird. Und in einer Zelle steht genau ein Wert.",
  }),
]);

export function correctQuizOptionIds(question) {
  return question.options.filter((option) => option.correct).map((option) => option.id);
}

export function evaluateQuizQuestion(question, selected) {
  if (!Array.isArray(selected) || !selected.length) return false;
  const correct = correctQuizOptionIds(question);
  return correct.length === selected.length && correct.every((id) => selected.includes(id));
}
