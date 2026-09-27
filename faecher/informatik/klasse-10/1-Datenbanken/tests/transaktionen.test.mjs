import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  USERS_PHOTOS_START, truncateDescription, likeMatches,
  simulateUpdate, simulateDelete, simulateInsert,
  UPDATE_RESULT, DELETE_RESULT, INSERT_RESULT,
  INSTAHUB_USERS_SPLIT, INSTAHUB_PHOTOS_SPLIT,
  AG, AG_MIT_PLAETZEN, TEILNAHME,
  violatesEntity, violatesReference, isValidDate, isInt,
  R5_STATEMENTS, R6_STATEMENTS,
  TRANSAKTIONEN_QUIZ, evaluateQuizQuestion, correctQuizOptionIds,
} from '../transaktionen-daten.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const databaseFolder = resolve(here, '..');

function parseDelimited(text, delimiter = ';') {
  const rows = []; let row = []; let field = ''; let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"') {
      if (quoted && text[index + 1] === '"') { field += '"'; index += 1; }
      else if (quoted || field.length === 0) quoted = !quoted;
      else field += character;
    } else if (character === delimiter && !quoted) { row.push(field); field = ''; }
    else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\r' && text[index + 1] === '\n') index += 1;
      row.push(field); if (row.some((value) => value.length > 0)) rows.push(row); row = []; field = '';
    } else field += character;
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  const [headers, ...records] = rows;
  const cleanHeaders = headers.map((header) => header.replace(/^﻿/, '').trim());
  return cleanHeaders ? records.map((values) => Object.fromEntries(cleanHeaders.map((header, index) => [header, values[index] ?? '']))) : [];
}

// ---------------------------------------------------------------------------
// USERS_PHOTOS_START und R5-Splitdaten gegen users.csv und photos.csv.
// ---------------------------------------------------------------------------
const usersCsv = parseDelimited(await readFile(resolve(databaseFolder, 'users.csv'), 'utf8'));
const photosCsv = parseDelimited(await readFile(resolve(databaseFolder, 'photos.csv'), 'utf8'));
const usersById = new Map(usersCsv.map((user) => [user.id, user]));
const photosById = new Map(photosCsv.map((photo) => [photo.id, photo]));

INSTAHUB_USERS_SPLIT.forEach((user) => {
  const csvUser = usersById.get(String(user.id));
  assert.ok(csvUser, `users.csv enthaelt eine Zeile mit id ${user.id}.`);
  assert.equal(user.name, csvUser.name, `Der Name fuer id ${user.id} stimmt mit users.csv ueberein.`);
  assert.equal(user.username, csvUser.username, `Der Username fuer id ${user.id} stimmt mit users.csv ueberein.`);
  assert.equal(user.birthday, csvUser.birthday, `Das Geburtsdatum fuer id ${user.id} stimmt mit users.csv ueberein.`);
});
assert.equal(usersById.has('999'), false, 'users.csv enthaelt keine id 999.');

const expectedUserIdByPhoto = { 1000: 214, 1001: 214, 1002: 214, 652: 143, 653: 143 };
[...USERS_PHOTOS_START, ...INSTAHUB_PHOTOS_SPLIT].forEach((photo) => {
  const id = photo.photoId ?? photo.id;
  const csvPhoto = photosById.get(String(id));
  assert.ok(csvPhoto, `photos.csv enthaelt eine Zeile mit id ${id}.`);
  assert.equal(String(expectedUserIdByPhoto[id]), csvPhoto.user_id, `user_id fuer Foto ${id} stimmt mit photos.csv ueberein.`);
  assert.equal(photo.description, csvPhoto.description, `Die Beschreibung von Foto ${id} ist exakt wie in photos.csv.`);
  if ('url' in photo) assert.equal(photo.url, csvPhoto.url, `Die url von Foto ${id} ist exakt wie in photos.csv.`);
});
assert.equal(photosById.has('1480'), false, 'photos.csv enthaelt keine id 1480 (frei fuer INSERT).');
assert.ok(photosById.has('1001'), 'photos.csv enthaelt id 1001 (schon vergeben fuer Anweisung A).');

// ---------------------------------------------------------------------------
// likeMatches
// ---------------------------------------------------------------------------
assert.equal(likeMatches('Nach einem intensiven Workout im Park', '%Park%'), true, '%Park% trifft die Park-Zeile.');
assert.equal(likeMatches('irgendwo im park', '%Park%'), true, '%Park% ignoriert Gross-/Kleinschreibung.');
assert.equal(likeMatches('Jannik Wegener', 'Jannik%'), true, "Jannik% trifft 'Jannik Wegener'.");
assert.equal(likeMatches('Nele Hohenstein', 'Jannik%'), false, "Jannik% trifft 'Nele Hohenstein' nicht.");
assert.equal(likeMatches('abc', 'a_c'), true, '_ steht fuer genau ein Zeichen.');
assert.equal(likeMatches('ac', 'a_c'), false, '_ verlangt genau ein Zeichen.');

// ---------------------------------------------------------------------------
// Simulation: UPDATE, DELETE, INSERT
// ---------------------------------------------------------------------------
assert.equal(UPDATE_RESULT.length, USERS_PHOTOS_START.length, 'UPDATE aendert die Zeilenzahl nicht.');
const changedRows = UPDATE_RESULT.filter((row) => row.status === 'changed');
assert.equal(changedRows.length, 1, 'UPDATE aendert genau eine Zeile.');
assert.equal(changedRows[0].url, 'storage/photos/2/1001.webp', 'Die geaenderte Zeile ist die mit dem Park-Foto (1001).');
assert.equal(changedRows[0].name, 'Nele Schweizer', 'Die geaenderte Zeile heisst jetzt Nele Schweizer.');
assert.deepEqual(changedRows[0].changedColumns, ['name'], 'Nur die Spalte name wurde geaendert.');
const untouchedNeleRows = UPDATE_RESULT.filter((row) => row.username === 'nelefitmuse' && row.status !== 'changed');
assert.equal(untouchedNeleRows.length, 2, 'Die anderen beiden nelefitmuse-Zeilen bleiben unveraendert.');
untouchedNeleRows.forEach((row) => assert.equal(row.name, 'Nele Hohenstein', 'Unveraenderte Zeilen heissen weiterhin Nele Hohenstein.'));

assert.equal(DELETE_RESULT.length, USERS_PHOTOS_START.length, 'DELETE behaelt geloeschte Zeilen zur Anzeige.');
const deletedRows = DELETE_RESULT.filter((row) => row.status === 'deleted');
assert.equal(deletedRows.length, 2, 'DELETE markiert genau zwei Zeilen als geloescht.');
deletedRows.forEach((row) => assert.equal(row.username, 'zornlaeufer', 'Geloeschte Zeilen gehoeren zornlaeufer.'));

assert.equal(INSERT_RESULT.length, USERS_PHOTOS_START.length + 1, 'INSERT ergibt eine Zeile mehr.');
const newRow = INSERT_RESULT.at(-1);
assert.equal(newRow.status, 'new', 'Die letzte Zeile hat den Status new.');
assert.equal(newRow.name, null, 'name der neuen Zeile ist null.');
assert.equal(newRow.username, null, 'username der neuen Zeile ist null.');
assert.equal(newRow.url, 'storage/photos/2/1480.webp', 'url der neuen Zeile stimmt.');

const park1001 = USERS_PHOTOS_START.find((row) => row.photoId === 1001);
assert.ok(truncateDescription(park1001.description, 60).includes('Park'), 'Die gekuerzte Beschreibung von Foto 1001 enthaelt "Park".');

// ---------------------------------------------------------------------------
// Abgelehnte Anweisungen: berechneter Verstoss stimmt mit R5_STATEMENTS und
// R6_STATEMENTS ueberein.
// ---------------------------------------------------------------------------
function computeVerdict(statement) {
  for (const check of statement.checks) {
    if (check.type === 'entity' && violatesEntity(check.table, check.value)) return 'entity';
    if (check.type === 'reference' && violatesReference(check.table, check.value)) return 'reference';
    if (check.type === 'domain' && check.kind === 'date' && !isValidDate(check.value)) return 'domain';
    if (check.type === 'domain' && check.kind === 'int' && !isInt(check.value)) return 'domain';
  }
  return 'none';
}
[...R5_STATEMENTS, ...R6_STATEMENTS].forEach((statement) => {
  assert.equal(computeVerdict(statement), statement.verdict, `Anweisung ${statement.id}: berechneter Verstoss stimmt mit dem deklarierten Verstoss ueberein.`);
});

assert.deepEqual(AG_MIT_PLAETZEN.map((a) => a.id), AG.map((a) => a.id), 'AG_MIT_PLAETZEN hat dieselben ids wie AG.');
assert.deepEqual(AG_MIT_PLAETZEN.map((a) => a.name), AG.map((a) => a.name), 'AG_MIT_PLAETZEN hat dieselben Namen wie AG.');
assert.ok(AG_MIT_PLAETZEN.every((a) => isInt(a.plaetze)), 'Jede AG hat eine ganzzahlige Platzzahl.');
assert.equal(TEILNAHME.some((row) => row.schueler_id === 2 && row.ag_id === 3), false, '(2, 3) steht noch nicht in TEILNAHME.');

// ---------------------------------------------------------------------------
// Isolierte Pruefungen fuer isValidDate/isInt
// ---------------------------------------------------------------------------
assert.equal(isValidDate('2008-10-21'), true);
assert.equal(isValidDate('Sommer 2008'), false);
assert.equal(isValidDate('2008-02-30'), false, '30. Februar existiert nicht.');
assert.equal(isInt('16'), true);
assert.equal(isInt('viele'), false);
assert.equal(isInt('3.5'), false);

// ---------------------------------------------------------------------------
// Abschlussquiz
// ---------------------------------------------------------------------------
assert.equal(TRANSAKTIONEN_QUIZ.length, 6, 'Das Abschlussquiz besteht aus sechs Fragen.');
TRANSAKTIONEN_QUIZ.forEach((question, index) => {
  const ids = question.options.map((option) => option.id);
  assert.equal(new Set(ids).size, ids.length, `Frage ${index + 1} verwendet eindeutige Antwort-Kennungen.`);
  assert.ok(correctQuizOptionIds(question).length >= 1, `Frage ${index + 1} besitzt mindestens eine richtige Antwort.`);
  assert.ok(question.options.some((option) => !option.correct), `Frage ${index + 1} besitzt mindestens eine falsche Antwort.`);
  assert.ok(question.prompt.trim().length > 0 && question.hint.trim().length > 0, `Frage ${index + 1} nennt Fragestellung und Tipp.`);
});
assert.ok(TRANSAKTIONEN_QUIZ.filter((question) => correctQuizOptionIds(question).length > 1).length >= 2, 'Mindestens zwei Fragen haben mehrere richtige Antworten.');
const quizIds = new Set(TRANSAKTIONEN_QUIZ.map((q) => q.id));
assert.equal(quizIds.size, TRANSAKTIONEN_QUIZ.length, 'Alle Quiz-ids sind eindeutig.');

const allQuizText = TRANSAKTIONEN_QUIZ.map((q) => `${q.prompt} ${q.options.map((o) => o.text).join(' ')} ${q.hint}`).join(' ');
assert.match(allQuizText, /UPDATE-Anomalie/, 'Das Quiz deckt die UPDATE-Anomalie ab.');
assert.match(allQuizText, /DELETE-Anomalie/, 'Das Quiz deckt die DELETE-Anomalie ab.');
assert.match(allQuizText, /INSERT-Anomalie/, 'Das Quiz deckt die INSERT-Anomalie ab.');
assert.match(allQuizText, /Entit(ä|a)tsintegrit(ä|a)t/, 'Das Quiz deckt die Entitaetsintegritaet ab.');
assert.match(allQuizText, /Wertebereichsintegrit(ä|a)t/, 'Das Quiz deckt die Wertebereichsintegritaet ab.');
assert.match(allQuizText, /[Rr]eferentielle[n]? Integrit(ä|a)t/, 'Das Quiz deckt die referentielle Integritaet ab.');

const multiQuestion = TRANSAKTIONEN_QUIZ.find((question) => correctQuizOptionIds(question).length > 1);
const multiCorrect = correctQuizOptionIds(multiQuestion);
assert.equal(evaluateQuizQuestion(multiQuestion, multiCorrect), true, 'Die exakte Menge der richtigen Antworten gilt als richtig.');
assert.equal(evaluateQuizQuestion(multiQuestion, [multiCorrect[0]]), false, 'Eine unvollstaendige Teilmenge gilt nicht als richtig.');
assert.equal(evaluateQuizQuestion(multiQuestion, [...multiCorrect, multiQuestion.options.find((o) => !o.correct).id]), false, 'Eine zusaetzliche falsche Antwort gilt nicht als richtig.');
assert.equal(evaluateQuizQuestion(multiQuestion, []), false, 'Keine Auswahl gilt nicht als richtig.');

// ---------------------------------------------------------------------------
// simulateUpdate/simulateDelete/simulateInsert als reine Funktionen (nicht
// nur die vordefinierten Konstanten).
// ---------------------------------------------------------------------------
const customUpdate = simulateUpdate(USERS_PHOTOS_START, { name: 'Test Name' }, { column: 'username', pattern: 'zornlaeufer' });
assert.equal(customUpdate.filter((row) => row.status === 'changed').length, 2, 'simulateUpdate aendert alle passenden Zeilen.');
const customDelete = simulateDelete(USERS_PHOTOS_START, { column: 'username', pattern: 'nelefitmuse' });
assert.equal(customDelete.filter((row) => row.status === 'deleted').length, 3, 'simulateDelete markiert alle passenden Zeilen.');
const customInsert = simulateInsert(USERS_PHOTOS_START, { name: 'Neu', username: 'neu123' });
assert.equal(customInsert.at(-1).url, null, 'Fehlende Spalten werden bei INSERT null.');

// ---------------------------------------------------------------------------
// Vertraege: HTML und JS
// ---------------------------------------------------------------------------
const html = await readFile(resolve(databaseFolder, 'aufgabe9.html'), 'utf8');
const js = await readFile(resolve(databaseFolder, 'transaktionen.js'), 'utf8');
const klasse10Index = await readFile(resolve(databaseFolder, '..', 'index.html'), 'utf8');

assert.match(html, /href="\.\.\/index\.html">Zur Aufgabenübersicht<\/a>/, 'Rücklink zur Aufgabenübersicht fehlt.');
assert.match(html, /href="\.\.\/\.\.\/\.\.\/\.\.\/index\.html">Startseite<\/a>/, 'Rücklink zur Startseite fehlt.');
assert.match(html, /id="final-quiz"/, 'Das Abschlussquiz-Formular mit id="final-quiz" fehlt.');
assert.doesNotMatch(html, /solution-download/, 'Aufgabe 9 hat kein Sicherungsblatt und darf keinen solution-download-Bereich enthalten.');
assert.doesNotMatch(html, /unlockSolution/, 'Aufgabe 9 darf kein unlockSolution einbinden.');
assert.doesNotMatch(html, /<select/i, 'Aufgabe 9 darf keine <select>-Elemente verwenden.');
assert.doesNotMatch(js, /<select/i, 'transaktionen.js darf keine <select>-Elemente erzeugen.');
assert.doesNotMatch(js, /solution-download|unlockSolution/, 'transaktionen.js darf keinen Sicherungsblatt-Code enthalten.');
assert.match(html, /<h1>Transaktionen und Integrität<\/h1>/, 'Die H1 muss exakt "Transaktionen und Integrität" lauten.');
assert.match(html, /transaktionen\.css\?v=\d+[a-z]?/, 'transaktionen.css wird mit Cache-Buster eingebunden.');
assert.match(html, /transaktionen\.js\?v=\d+[a-z]?/, 'transaktionen.js wird mit Cache-Buster eingebunden.');
assert.doesNotMatch(html, /class="[^"]*\brelation-types-page\b/, 'aufgabe9.html darf die Klasse relation-types-page nicht verwenden (9-Spalten-Tab-Grid).');

assert.match(js, /informatik10-datenbanken-aufgabe9-v1/, 'Der localStorage-Schlüssel fehlt oder ist falsch benannt.');

assert.match(klasse10Index, /1-Datenbanken\/aufgabe8\.html[\s\S]*1-Datenbanken\/aufgabe9\.html/, 'Aufgabe 9 muss im Menü nach Aufgabe 8 stehen.');
assert.match(klasse10Index, /<strong>Aufgabe 9<\/strong>\s*<span>Transaktionen und Integrität<\/span>/, 'Der Menüeintrag für Aufgabe 9 fehlt oder ist falsch beschriftet.');

// ---------------------------------------------------------------------------
// Begriffsdisziplin: Anomalie- und Integritätsbedingungsnamen duerfen in den
// Schritten 1-5 nicht vor der Beobachtung auftauchen (Reveal-/Merke-Bloecke
// sind ausgenommen und werden vor der Pruefung entfernt).
// ---------------------------------------------------------------------------
function stripDivById(source, id) {
  const marker = `id="${id}"`;
  const markerIndex = source.indexOf(marker);
  if (markerIndex < 0) return source;
  const divStart = source.lastIndexOf('<div', markerIndex);
  const tagRegex = /<div\b[^>]*>|<\/div>/g;
  tagRegex.lastIndex = divStart;
  let depth = 0;
  let match;
  let endIndex = -1;
  while ((match = tagRegex.exec(source))) {
    if (match[0].startsWith('<div')) depth += 1;
    else depth -= 1;
    if (depth === 0) { endIndex = tagRegex.lastIndex; break; }
  }
  if (endIndex < 0) return source;
  return source.slice(0, divStart) + source.slice(endIndex);
}
function extractStepHtml(source, step) {
  const startMarker = `id="step-${step}"`;
  const startIndex = source.indexOf(startMarker);
  assert.ok(startIndex >= 0, `step-${step} nicht gefunden.`);
  const sectionStart = source.lastIndexOf('<section', startIndex);
  const nextMarker = step === 7 ? 'id="step-summary"' : `id="step-${step + 1}"`;
  const nextIndex = source.indexOf(nextMarker);
  const nextSectionStart = source.lastIndexOf('<section', nextIndex);
  return source.slice(sectionStart, nextSectionStart);
}

const revealIdByStep = { 1: 's1-merke', 2: 's2-reveal', 3: 's3-reveal', 4: 's4-reveal', 5: 's5-merke' };
const forbiddenTerms = ['Anomalie', 'Entitäts', 'Wertebereichs', 'referentielle'];
for (let step = 1; step <= 5; step += 1) {
  const panelWithReveal = extractStepHtml(html, step);
  const panel = stripDivById(panelWithReveal, revealIdByStep[step]);
  forbiddenTerms.forEach((term) => {
    assert.doesNotMatch(panel, new RegExp(term), `Schritt ${step} nennt "${term}" schon vor der Beobachtung (ausserhalb des Merke-/Reveal-Blocks).`);
  });
}

console.log('Alle Tests für transaktionen.test.mjs sind gruen.');
