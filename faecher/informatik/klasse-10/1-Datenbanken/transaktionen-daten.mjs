/**
 * Datenquelle und reine Funktionen für Aufgabe 9 (Transaktionen und
 * Integrität). Enthält die feste Übungstabelle users_photos, die drei
 * simulierten Anweisungen (UPDATE/DELETE/INSERT), die Daten für die
 * Integritätsbedingungen (R5, R6) und das Abschlussquiz. Zur Laufzeit wird
 * keine CSV geladen; alle Werte hier sind fest eingetragen und werden vom
 * Test gegen users.csv und photos.csv geprüft.
 *
 * SCHUELER, AG und TEILNAHME werden aus Aufgabe 8 übernommen (siehe
 * beziehungsarten-daten.mjs), nicht neu erfunden.
 */

import { SCHUELER, AG, TEILNAHME, truncateDescription, evaluateQuizQuestion, correctQuizOptionIds } from "./beziehungsarten-daten.mjs";

export { SCHUELER, AG, TEILNAHME, truncateDescription, evaluateQuizQuestion, correctQuizOptionIds };

// ---------------------------------------------------------------------------
// users_photos: gemeinsame Übungstabelle für R2–R4 (Redundanz aus Aufgabe 2).
// Beschreibungen vollständig und exakt wie in photos.csv.
// ---------------------------------------------------------------------------
export const USERS_PHOTOS_START = Object.freeze([
  Object.freeze({
    name: "Nele Hohenstein", username: "nelefitmuse",
    url: "storage/photos/2/1000.webp",
    description: "Spiel mit Licht und Schatten 📸✨ #FrameIt #Schnappschuss #Lichtblick",
    photoId: 1000,
  }),
  Object.freeze({
    name: "Nele Hohenstein", username: "nelefitmuse",
    url: "storage/photos/2/1001.webp",
    description: "Nach einem intensiven Workout im Park 🌳💪 #Gymlife #Fitnessjunkie #OutdoorFitness",
    photoId: 1001,
  }),
  Object.freeze({
    name: "Nele Hohenstein", username: "nelefitmuse",
    url: "storage/photos/2/1002.webp",
    description: "Nach dem Workout ist vor dem Workout! 💪 #Gymlife #SweatySelfie #FitnessGoals",
    photoId: 1002,
  }),
  Object.freeze({
    name: "Jannik Wegener", username: "zornlaeufer",
    url: "storage/photos/2/652.webp",
    description: "🏃‍♂️ Kein Tag ohne Jogging-Spaß! 🖤 #RunnerHigh #Jogging #UrbanRun",
    photoId: 652,
  }),
  Object.freeze({
    name: "Jannik Wegener", username: "zornlaeufer",
    url: "storage/photos/2/653.webp",
    description: "15 Jahre und schon auf der Überholspur! 🏃‍♂️ Dark vibes und Kilometer schrubben im nächtlichen Großstadtdschungel. #Jogging #MilesAndSmiles #UrbanRunner",
    photoId: 653,
  }),
]);

// ---------------------------------------------------------------------------
// LIKE-Vergleich: ohne Beachtung von Groß-/Kleinschreibung, % = beliebig
// viele Zeichen, _ = genau ein Zeichen. Regex-Sonderzeichen werden vor der
// Übersetzung von % und _ escaped.
// ---------------------------------------------------------------------------
export function likeMatches(value, pattern) {
  const escaped = String(pattern ?? "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regexBody = escaped.replace(/%/g, ".*").replace(/_/g, ".");
  return new RegExp(`^${regexBody}$`, "i").test(String(value ?? ""));
}

// ---------------------------------------------------------------------------
// Simulation von UPDATE, DELETE, INSERT auf reinen Datenkopien. Gelöschte
// Zeilen bleiben zur Anzeige erhalten (status "deleted"), fehlende Spalten
// bei INSERT werden null.
// ---------------------------------------------------------------------------
export function simulateUpdate(rows, set, where) {
  return rows.map((row) => {
    if (!likeMatches(row[where.column], where.pattern)) {
      return { ...row, status: "unchanged", changedColumns: [] };
    }
    const changedColumns = Object.keys(set).filter((column) => row[column] !== set[column]);
    return { ...row, ...set, status: changedColumns.length ? "changed" : "unchanged", changedColumns };
  });
}

export function simulateDelete(rows, where) {
  return rows.map((row) => ({
    ...row,
    status: likeMatches(row[where.column], where.pattern) ? "deleted" : "unchanged",
    changedColumns: [],
  }));
}

const USERS_PHOTOS_COLUMNS = ["name", "username", "url", "description"];

export function simulateInsert(rows, values) {
  const newRow = Object.fromEntries(
    USERS_PHOTOS_COLUMNS.map((column) => [column, column in values ? values[column] : null])
  );
  return [
    ...rows.map((row) => ({ ...row, status: "unchanged", changedColumns: [] })),
    { ...newRow, photoId: null, status: "new", changedColumns: [] },
  ];
}

// Feste Simulationsergebnisse für R2 (UPDATE), R3 (DELETE), R4 (INSERT).
export const UPDATE_RESULT = simulateUpdate(
  USERS_PHOTOS_START,
  { name: "Nele Schweizer" },
  { column: "description", pattern: "%Park%" }
);
export const DELETE_RESULT = simulateDelete(
  USERS_PHOTOS_START,
  { column: "name", pattern: "Jannik%" }
);
export const INSERT_RESULT = simulateInsert(
  USERS_PHOTOS_START,
  { url: "storage/photos/2/1480.webp", description: "#usa #florida #everglades" }
);

// ---------------------------------------------------------------------------
// R5: users und photos als getrennte Tabellen (nur Nele und Jannik).
// ---------------------------------------------------------------------------
export const INSTAHUB_USERS_SPLIT = Object.freeze([
  Object.freeze({ id: 214, name: "Nele Hohenstein", username: "nelefitmuse", birthday: "2005-12-21" }),
  Object.freeze({ id: 143, name: "Jannik Wegener", username: "zornlaeufer", birthday: "2008-10-21" }),
]);

export const INSTAHUB_PHOTOS_SPLIT = Object.freeze([
  Object.freeze({ id: 1000, user_id: 214, description: "Spiel mit Licht und Schatten 📸✨ #FrameIt #Schnappschuss #Lichtblick" }),
  Object.freeze({ id: 1001, user_id: 214, description: "Nach einem intensiven Workout im Park 🌳💪 #Gymlife #Fitnessjunkie #OutdoorFitness" }),
  Object.freeze({ id: 1002, user_id: 214, description: "Nach dem Workout ist vor dem Workout! 💪 #Gymlife #SweatySelfie #FitnessGoals" }),
  Object.freeze({ id: 652, user_id: 143, description: "🏃‍♂️ Kein Tag ohne Jogging-Spaß! 🖤 #RunnerHigh #Jogging #UrbanRun" }),
  Object.freeze({ id: 653, user_id: 143, description: "15 Jahre und schon auf der Überholspur! 🏃‍♂️ Dark vibes und Kilometer schrubben im nächtlichen Großstadtdschungel. #Jogging #MilesAndSmiles #UrbanRunner" }),
]);

// ---------------------------------------------------------------------------
// R6: ag bekommt zusätzlich die Spalte plaetze (fiktive Schuldaten wie in
// Aufgabe 8). Ids und Namen bleiben identisch zu AG aus Aufgabe 8.
// ---------------------------------------------------------------------------
const AG_PLAETZE = Object.freeze({ 1: 12, 2: 20, 3: 30 });
export const AG_MIT_PLAETZEN = Object.freeze(
  AG.map((ag) => Object.freeze({ ...ag, plaetze: AG_PLAETZE[ag.id] }))
);

// ---------------------------------------------------------------------------
// Integritätsprüfungen: reine Funktionen auf beliebigen Tabellen mit id.
// ---------------------------------------------------------------------------

// Entitätsintegrität: verletzt, wenn die id in der Tabelle schon vergeben ist.
export function violatesEntity(rows, id) {
  return rows.some((row) => Number(row.id) === Number(id));
}

// Referentielle Integrität: verletzt, wenn es zur id keinen Datensatz gibt.
export function violatesReference(rows, id) {
  return !rows.some((row) => Number(row.id) === Number(id));
}

// Wertebereichsintegrität (Datum): JJJJ-MM-TT und real existierendes Datum.
export function isValidDate(value) {
  if (typeof value !== "string") return false;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return false;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1) return false;
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
}

// Wertebereichsintegrität (int): nur eine ganze Zahl ist gültig.
export function isInt(value) {
  if (typeof value === "number") return Number.isInteger(value);
  if (typeof value !== "string") return false;
  return /^-?\d+$/.test(value.trim());
}

// Soll-Verstöße für R5 (Anweisungen A, B, C) und R6 (Anweisungen 1–4). Jede
// Prüfung ("checks") lässt sich mit violatesEntity/violatesReference/
// isValidDate/isInt aus den Daten nachrechnen; der Test tut genau das und
// vergleicht das Ergebnis mit `verdict`.
export const R5_STATEMENTS = Object.freeze([
  Object.freeze({
    id: "A", verdict: "entity",
    checks: Object.freeze([Object.freeze({ type: "entity", table: INSTAHUB_PHOTOS_SPLIT, value: 1001 })]),
  }),
  Object.freeze({
    id: "B", verdict: "domain",
    checks: Object.freeze([Object.freeze({ type: "domain", kind: "date", value: "Sommer 2008" })]),
  }),
  Object.freeze({
    id: "C", verdict: "reference",
    checks: Object.freeze([Object.freeze({ type: "reference", table: INSTAHUB_USERS_SPLIT, value: 999 })]),
  }),
]);

export const R6_STATEMENTS = Object.freeze([
  Object.freeze({
    id: 1, verdict: "entity",
    checks: Object.freeze([Object.freeze({ type: "entity", table: AG_MIT_PLAETZEN, value: 3 })]),
  }),
  Object.freeze({
    id: 2, verdict: "none",
    checks: Object.freeze([
      Object.freeze({ type: "reference", table: SCHUELER, value: 2 }),
      Object.freeze({ type: "reference", table: AG_MIT_PLAETZEN, value: 3 }),
    ]),
  }),
  Object.freeze({
    id: 3, verdict: "reference",
    checks: Object.freeze([Object.freeze({ type: "reference", table: AG_MIT_PLAETZEN, value: 7 })]),
  }),
  Object.freeze({
    id: 4, verdict: "domain",
    checks: Object.freeze([Object.freeze({ type: "domain", kind: "int", value: "viele" })]),
  }),
]);

// ---------------------------------------------------------------------------
// Abschlussquiz (Schritt 7): Auswahlkästchen, exakte Menge verlangt. Gleiches
// Format wie BEZIEHUNGSARTEN_QUIZ aus Aufgabe 8.
// ---------------------------------------------------------------------------
export const TRANSAKTIONEN_QUIZ = Object.freeze([
  Object.freeze({
    id: "q1-datenpflege",
    prompt: "Was gilt für die Datenpflege?",
    options: Object.freeze([
      Object.freeze({ id: "crud-befehle", text: "Mit INSERT, UPDATE und DELETE werden Datensätze eingefügt, geändert und gelöscht.", correct: true }),
      Object.freeze({ id: "crud-akronym", text: "CRUD steht für Create, Read, Update und Delete.", correct: true }),
      Object.freeze({ id: "select-transaktion", text: "SELECT ist eine Transaktion, die Daten verändert.", correct: false }),
      Object.freeze({ id: "widerspruch-ok", text: "Eine Transaktion darf die Daten widersprüchlich hinterlassen, solange keine Fehlermeldung kommt.", correct: false }),
    ]),
    hint: "SELECT liest Daten nur. Nach jeder Transaktion müssen die Daten stimmig sein.",
  }),
  Object.freeze({
    id: "q2-update-anomalie",
    prompt: "In users_photos steht Neles Name bei drei Fotos. Eine Anweisung ändert ihn nur in einer Zeile. Was gilt?",
    options: Object.freeze([
      Object.freeze({ id: "ist-update-anomalie", text: "Das ist eine UPDATE-Anomalie.", correct: true }),
      Object.freeze({ id: "zwei-namen", text: "Für denselben Benutzer stehen jetzt zwei Namen in der Tabelle – die Daten sind inkonsistent.", correct: true }),
      Object.freeze({ id: "keine-fehlermeldung-ok", text: "Das ist unproblematisch, weil die Anweisung ohne Fehlermeldung lief.", correct: false }),
      Object.freeze({ id: "ist-delete-anomalie", text: "Das ist eine DELETE-Anomalie.", correct: false }),
    ]),
    hint: "Eine Änderung, die nur einen Teil der redundanten Einträge trifft, führt zu Widersprüchen.",
  }),
  Object.freeze({
    id: "q3-delete-anomalie",
    prompt: "Jannik löscht in users_photos alle Zeilen mit seinem Namen, um seine Fotos loszuwerden. Was gilt?",
    options: Object.freeze([
      Object.freeze({ id: "name-username-weg", text: "Mit den Fotos verschwinden auch sein Name und sein Benutzername.", correct: true }),
      Object.freeze({ id: "nur-fotos-entfernt", text: "DELETE entfernt nur genau die gewünschte Information: die Fotos.", correct: false }),
      Object.freeze({ id: "ist-delete-anomalie", text: "Das ist eine DELETE-Anomalie.", correct: true }),
      Object.freeze({ id: "sicherungszeile", text: "Seine Benutzerdaten bleiben in einer Sicherungszeile erhalten.", correct: false }),
    ]),
    hint: "DELETE löscht ganze Zeilen – mit allen Werten, die darin stehen.",
  }),
  Object.freeze({
    id: "q4-insert-anomalie",
    prompt: "In users_photos wird ein Foto ohne name und username eingefügt. Was gilt?",
    options: Object.freeze([
      Object.freeze({ id: "foto-ohne-besitzer", text: "Es entsteht ein Foto ohne Besitzer; name und username sind NULL.", correct: true }),
      Object.freeze({ id: "ist-insert-anomalie", text: "Das ist eine INSERT-Anomalie.", correct: true }),
      Object.freeze({ id: "automatische-zuordnung", text: "Die Datenbank ordnet das Foto automatisch dem passenden Benutzer zu.", correct: false }),
      Object.freeze({ id: "referentielle-integritaet-schuetzt", text: "In getrennten Tabellen verhindert die referentielle Integrität, dass ein Foto auf einen Benutzer verweist, den es nicht gibt.", correct: true }),
    ]),
    hint: "Fehlen Werte in der Anweisung, bleiben die Zellen leer (NULL). Niemand ordnet sie automatisch zu.",
  }),
  Object.freeze({
    id: "q5-integritaetsbedingungen",
    prompt: "Welche Aussagen über Integritätsbedingungen stimmen?",
    options: Object.freeze([
      Object.freeze({ id: "entitaet-eindeutig", text: "Entitätsintegrität: Ein Primärschlüssel ist eindeutig und nie NULL.", correct: true }),
      Object.freeze({ id: "wertebereich-int", text: "Wertebereichsintegrität: In einem int-Attribut darf nur eine ganze Zahl stehen.", correct: true }),
      Object.freeze({ id: "fremdschluessel-beliebig", text: "Referentielle Integrität: Ein Fremdschlüssel darf auf eine beliebige Zahl zeigen.", correct: false }),
      Object.freeze({ id: "primaerschluessel-null", text: "Ein Primärschlüssel darf leer bleiben, wenn er noch nicht bekannt ist.", correct: false }),
    ]),
    hint: "Jeder Datensatz braucht einen eindeutigen Primärschlüssel, und jeder Fremdschlüssel muss auf einen existierenden Datensatz verweisen.",
  }),
  Object.freeze({
    id: "q6-integritaet",
    prompt: "Was bedeutet Integrität einer Datenbank?",
    options: Object.freeze([
      Object.freeze({ id: "unversehrt", text: "Die gespeicherten Daten sind unversehrt: korrekt und widerspruchsfrei.", correct: true }),
      Object.freeze({ id: "datenschutz", text: "Integrität heißt Datenschutz: Nur berechtigte Personen dürfen die Daten sehen.", correct: false }),
      Object.freeze({ id: "konsistent", text: "Die Datenbank ist konsistent, wenn es keine widersprüchlichen Datensätze gibt.", correct: true }),
      Object.freeze({ id: "eine-tabelle", text: "Integrität ist erreicht, sobald alle Daten in einer einzigen Tabelle stehen.", correct: false }),
    ]),
    hint: "Integrität heißt Unversehrtheit der Daten. Wer zugreifen darf, ist eine andere Frage – das ist Datenschutz.",
  }),
]);
