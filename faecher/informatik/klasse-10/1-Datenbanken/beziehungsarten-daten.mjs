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
