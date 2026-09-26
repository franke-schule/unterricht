import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  KLASSE, KLASSENLEITER, KLASSE_LEITER_LOESUNG,
  INSTAHUB_USERS, INSTAHUB_PHOTOS, INSTAHUB_FOLLOWS,
  evaluateCardinalityPair, BEZIEHUNGSARTEN_QUIZ, evaluateQuizQuestion, correctQuizOptionIds,
} from '../beziehungsarten-daten.mjs';

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
// Schule (1:1): rein fachlich, keine CSV-Quelle - nur interne Konsistenz.
// ---------------------------------------------------------------------------
assert.equal(KLASSE.length, 3);
assert.equal(KLASSENLEITER.length, 3);
assert.deepEqual(KLASSE_LEITER_LOESUNG, { 1: 'KOH', 2: 'SEI', 3: 'BRA' }, 'Klasse 10a (id 1) wird von KOH geleitet, 10b (id 2) von SEI, 10c (id 3) von BRA.');

// ---------------------------------------------------------------------------
// InstaHub-Werte gegen die CSV-Dateien pruefen.
// ---------------------------------------------------------------------------
const usersCsv = parseDelimited(await readFile(resolve(databaseFolder, 'users.csv'), 'utf8'));
const photosCsv = parseDelimited(await readFile(resolve(databaseFolder, 'photos.csv'), 'utf8'));
const followsCsv = parseDelimited(await readFile(resolve(databaseFolder, 'follows.csv'), 'utf8'));

const usersById = new Map(usersCsv.map((user) => [user.id, user]));
INSTAHUB_USERS.forEach((user) => {
  const csvUser = usersById.get(String(user.id));
  assert.ok(csvUser, `users.csv enthaelt eine Zeile mit id ${user.id}.`);
  assert.equal(user.username, csvUser.username, `Der Username fuer id ${user.id} stimmt mit users.csv ueberein.`);
});

const photosById = new Map(photosCsv.map((photo) => [photo.id, photo]));
INSTAHUB_PHOTOS.forEach((photo) => {
  const csvPhoto = photosById.get(String(photo.id));
  assert.ok(csvPhoto, `photos.csv enthaelt eine Zeile mit id ${photo.id}.`);
  assert.equal(String(photo.user_id), csvPhoto.user_id, `user_id fuer Foto ${photo.id} stimmt mit photos.csv ueberein.`);
  const expectedStart = photo.description.endsWith(' …') ? photo.description.slice(0, -2) : photo.description;
  assert.ok(csvPhoto.description.startsWith(expectedStart), `Die gekuerzte Beschreibung von Foto ${photo.id} beginnt exakt wie in photos.csv.`);
});

const followsById = new Map(followsCsv.map((row) => [row.id, row]));
INSTAHUB_FOLLOWS.forEach((row) => {
  const csvRow = followsById.get(String(row.id));
  assert.ok(csvRow, `follows.csv enthaelt eine Zeile mit id ${row.id}.`);
  assert.equal(String(row.following_id), csvRow.following_id, `following_id fuer follows-Zeile ${row.id} stimmt mit follows.csv ueberein.`);
  assert.equal(String(row.follower_id), csvRow.follower_id, `follower_id fuer follows-Zeile ${row.id} stimmt mit follows.csv ueberein.`);
});

// ---------------------------------------------------------------------------
// evaluateCardinalityPair
// ---------------------------------------------------------------------------
assert.equal(evaluateCardinalityPair('n', 'm', 'n:m').status, 'correct', 'n/m ist bei n:m richtig.');
assert.equal(evaluateCardinalityPair('M', 'N', 'n:m').status, 'correct', 'Groß-/Kleinschreibung wird ignoriert.');
assert.equal(evaluateCardinalityPair(' n ', 'm', 'n:m').status, 'correct', 'Leerzeichen werden getrimmt.');
const sameLetter = evaluateCardinalityPair('n', 'n', 'n:m');
assert.equal(sameLetter.status, 'partial');
assert.equal(sameLetter.reason, 'same-letter');
const oneAndN = evaluateCardinalityPair('1', 'n', 'n:m');
assert.equal(oneAndN.status, 'partial', '1/n ist bei n:m teilweise richtig.');
assert.equal(oneAndN.reason, 'one-is-1');
assert.equal(evaluateCardinalityPair('1', '1', 'n:m').status, 'wrong', '1/1 ist bei n:m nicht richtig (und nicht teilweise).');
assert.equal(evaluateCardinalityPair('', 'n', 'n:m').status, 'missing');
assert.equal(evaluateCardinalityPair('x', 'n', 'n:m').status, 'invalid');
const oneWithM = evaluateCardinalityPair('1', 'm', '1:n');
assert.equal(oneWithM.status, 'partial', '1:n mit m auf der n-Seite ist teilweise richtig.');
assert.equal(oneWithM.reason, 'm-instead-of-n');
assert.equal(evaluateCardinalityPair('1', 'n', '1:n').status, 'correct');
assert.equal(evaluateCardinalityPair('1', '1', '1:1').status, 'correct');
assert.equal(evaluateCardinalityPair('1', 'n', '1:1').status, 'partial');
assert.equal(evaluateCardinalityPair('n', 'm', '1:1').status, 'wrong');

// ---------------------------------------------------------------------------
// Abschlussquiz
// ---------------------------------------------------------------------------
assert.equal(BEZIEHUNGSARTEN_QUIZ.length, 5, 'Das Abschlussquiz besteht aus fuenf Fragen.');
BEZIEHUNGSARTEN_QUIZ.forEach((question, index) => {
  const ids = question.options.map((option) => option.id);
  assert.equal(new Set(ids).size, ids.length, `Frage ${index + 1} verwendet eindeutige Antwort-Kennungen.`);
  assert.ok(correctQuizOptionIds(question).length >= 1, `Frage ${index + 1} besitzt mindestens eine richtige Antwort.`);
  assert.ok(question.options.some((option) => !option.correct), `Frage ${index + 1} besitzt mindestens eine falsche Antwort.`);
  assert.ok(question.prompt.trim().length > 0 && question.hint.trim().length > 0, `Frage ${index + 1} nennt Fragestellung und Tipp.`);
});
assert.ok(BEZIEHUNGSARTEN_QUIZ.filter((question) => correctQuizOptionIds(question).length > 1).length >= 2, 'Mindestens zwei Fragen haben mehrere richtige Antworten.');
const multiQuestion = BEZIEHUNGSARTEN_QUIZ.find((question) => correctQuizOptionIds(question).length > 1);
const multiCorrect = correctQuizOptionIds(multiQuestion);
assert.equal(evaluateQuizQuestion(multiQuestion, multiCorrect), true, 'Die exakte Menge der richtigen Antworten gilt als richtig.');
assert.equal(evaluateQuizQuestion(multiQuestion, [multiCorrect[0]]), false, 'Eine unvollstaendige Teilmenge gilt nicht als richtig.');
assert.equal(evaluateQuizQuestion(multiQuestion, [...multiCorrect, multiQuestion.options.find((o) => !o.correct).id]), false, 'Eine zusaetzliche falsche Antwort gilt nicht als richtig.');
assert.equal(evaluateQuizQuestion(multiQuestion, []), false, 'Keine Auswahl gilt nicht als richtig.');

// ---------------------------------------------------------------------------
// Vertraege: HTML und JS
// ---------------------------------------------------------------------------
const html = await readFile(resolve(databaseFolder, 'aufgabe8.html'), 'utf8');
const js = await readFile(resolve(databaseFolder, 'beziehungsarten.js'), 'utf8');
const klasse10Index = await readFile(resolve(databaseFolder, '..', 'index.html'), 'utf8');

assert.match(html, /href="\.\.\/index\.html">Zur Aufgabenübersicht<\/a>/, 'Rücklink zur Aufgabenübersicht fehlt.');
assert.match(html, /href="\.\.\/\.\.\/\.\.\/\.\.\/index\.html">Startseite<\/a>/, 'Rücklink zur Startseite fehlt.');
assert.match(html, /id="final-quiz"/, 'Das Abschlussquiz-Formular mit id="final-quiz" fehlt.');
assert.doesNotMatch(html, /solution-download/, 'Aufgabe 8 hat kein Sicherungsblatt und darf keinen solution-download-Bereich enthalten.');
assert.doesNotMatch(html, /unlockSolution/, 'Aufgabe 8 darf kein unlockSolution einbinden.');
assert.doesNotMatch(html, /<select/i, 'Aufgabe 8 darf keine <select>-Elemente verwenden.');
assert.match(html, /<h1>1:1- und n:m-Beziehungen<\/h1>/, 'Die H1 muss exakt "1:1- und n:m-Beziehungen" lauten.');
assert.match(html, /beziehungsarten\.css\?v=\d+[a-z]?/, 'beziehungsarten.css wird mit Cache-Buster eingebunden.');
assert.match(html, /beziehungsarten\.js\?v=\d+[a-z]?/, 'beziehungsarten.js wird mit Cache-Buster eingebunden.');

assert.match(js, /informatik10-datenbanken-aufgabe8-v1/, 'Der localStorage-Schlüssel fehlt oder ist falsch benannt.');
assert.doesNotMatch(js, /<select/i, 'beziehungsarten.js darf keine <select>-Elemente erzeugen.');

assert.match(klasse10Index, /1-Datenbanken\/aufgabe7\.html[\s\S]*1-Datenbanken\/aufgabe8\.html/, 'Aufgabe 8 muss im Menü nach Aufgabe 7 stehen.');
assert.match(klasse10Index, /<strong>Aufgabe 8<\/strong>\s*<span>1:1- und n:m-Beziehungen<\/span>/, 'Der Menüeintrag für Aufgabe 8 fehlt oder ist falsch beschriftet.');

console.log('Alle Tests für beziehungsarten.test.mjs sind gruen.');
