import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SONG_PLAYLIST_PAIRS, SONG_VERBUND_COLUMN_GROUPS, SONG_VERBUND_COLUMNS, SONG_VERBUND_SQL, SONG_VERBUND_TABLE_NAMES, SONG_VERBUND_TABLE_SCHEMAS, SONG_VERBUND_TABLES, SONG_VERBUND_VISIBLE_TEXT, buildFirstConnection, buildFullConnection, buildPlaylistConnection, buildSongCombinations, evaluateFirstConnection, evaluateSecondConnection, expectedSongRelation } from '../song-verbund-daten.mjs';
import { compareRelations, normalizeRelation, validateSelectStatement } from '../sql-lab-core.mjs';

assert.deepEqual(SONG_VERBUND_TABLE_NAMES, ['Song', 'Song_in_Playlist', 'Playlist']);
assert.deepEqual(SONG_VERBUND_TABLE_SCHEMAS.map(({ table, columns }) => [table, columns]), [
  ['Song', [['id', 'int'], ['titel', 'varchar(255)'], ['genre', 'varchar(255)'], ['interpret', 'varchar(255)']]],
  ['Song_in_Playlist', [['song_id', 'int'], ['playlist_id', 'int']]],
  ['Playlist', [['id', 'int'], ['titel', 'varchar(255)']]]
]);
assert.deepEqual(SONG_VERBUND_TABLES.Song, [
  { id: 1, titel: 'Gaslighter', genre: 'country', interpret: 'The Chicks' },
  { id: 2, titel: 'Wavin‘ Flag', genre: 'world', interpret: 'K‘naan' },
  { id: 3, titel: 'Try', genre: 'country rock', interpret: 'Neil Young' },
  { id: 4, titel: '’54, ’74, ’90, 2006', genre: 'indie rock', interpret: 'Sportfreunde Stiller' }
]);
assert.equal(SONG_VERBUND_TABLES.Song.length, 4);
assert.equal(SONG_VERBUND_TABLES.Playlist.length, 2);
assert.equal(SONG_VERBUND_TABLES.Song_in_Playlist.length, 4);
assert.equal(Object.isFrozen(SONG_VERBUND_TABLES), true);
assert.equal(buildSongCombinations().length, 32);
assert.equal(buildFirstConnection().length, 8);
assert.equal(buildPlaylistConnection().length, 16);
assert.equal(buildFullConnection().length, 4);
assert.equal(expectedSongRelation('cross').values.length, 32);
assert.equal(expectedSongRelation('first').values.length, 8);
assert.equal(expectedSongRelation('full').values.length, 4);
assert.deepEqual(SONG_VERBUND_COLUMNS, ['Song.id', 'Song.titel', 'Song.genre', 'Song.interpret', 'Song_in_Playlist.song_id', 'Song_in_Playlist.playlist_id', 'Playlist.id', 'Playlist.titel']);
assert.deepEqual(SONG_VERBUND_COLUMN_GROUPS.map(({ table, columns }) => [table, columns.length]), [['Song', 4], ['Song_in_Playlist', 2], ['Playlist', 2]]);
assert.deepEqual(SONG_PLAYLIST_PAIRS, [
  { song: 'Gaslighter', playlist: 'Good Oldies' },
  { song: 'Try', playlist: 'Good Oldies' },
  { song: 'Wavin‘ Flag', playlist: 'Fussballhits' },
  { song: '’54, ’74, ’90, 2006', playlist: 'Fussballhits' }
]);
assert.equal(evaluateFirstConnection(['Song.id', 'Song_in_Playlist.song_id']), true);
assert.equal(evaluateFirstConnection(['Song_in_Playlist.song_id', 'Song.id']), true);
assert.equal(evaluateFirstConnection(['Song.id', 'Playlist.id']), false);
assert.equal(evaluateSecondConnection(['Playlist.id', 'Song_in_Playlist.playlist_id'], 'AND'), true);
assert.equal(evaluateSecondConnection(['Song_in_Playlist.playlist_id', 'Playlist.id'], 'AND'), true);
assert.equal(evaluateSecondConnection(['Playlist.id', 'Song_in_Playlist.playlist_id'], 'OR'), false);
assert.equal(SONG_VERBUND_VISIBLE_TEXT.firstHints.length, 3);
assert.equal(SONG_VERBUND_VISIBLE_TEXT.secondHints.length, 3);
assert.equal(SONG_VERBUND_VISIBLE_TEXT.sqlHints.length, 3);

const require = createRequire(import.meta.url);
const initSqlJs = require('../../../../../include/lib/sql.js/sql-wasm.js');
const here = dirname(fileURLToPath(import.meta.url));
const databaseFolder = resolve(here, '..');
const repository = resolve(databaseFolder, '../../../..');
const SQL = await initSqlJs({ wasmBinary: new Uint8Array(await readFile(resolve(repository, 'include/lib/sql.js/sql-wasm.wasm'))) });
const db = new SQL.Database();
db.run('CREATE TABLE Song (id INTEGER PRIMARY KEY, titel TEXT, genre TEXT, interpret TEXT); CREATE TABLE Song_in_Playlist (song_id INTEGER, playlist_id INTEGER); CREATE TABLE Playlist (id INTEGER PRIMARY KEY, titel TEXT)');
for (const song of SONG_VERBUND_TABLES.Song) db.run(`INSERT INTO Song VALUES (${song.id}, '${song.titel.replaceAll("'", "''")}', '${song.genre}', '${song.interpret.replaceAll("'", "''")}')`);
for (const mapping of SONG_VERBUND_TABLES.Song_in_Playlist) db.run(`INSERT INTO Song_in_Playlist VALUES (${mapping.song_id}, ${mapping.playlist_id})`);
for (const playlist of SONG_VERBUND_TABLES.Playlist) db.run(`INSERT INTO Playlist VALUES (${playlist.id}, '${playlist.titel}')`);
const relation = (statement) => normalizeRelation(db.exec(statement));
const cross = relation(SONG_VERBUND_SQL.crossProduct);
const first = relation(SONG_VERBUND_SQL.firstConnection);
const playlistOnly = relation(SONG_VERBUND_SQL.playlistConnection);
const full = relation(SONG_VERBUND_SQL.fullConnection);
assert.equal(cross.values.length, 32);
assert.equal(first.values.length, 8);
assert.equal(playlistOnly.values.length, 16);
assert.equal(full.values.length, 4);
assert.deepEqual(full.values.map((row) => ({ song: row[1], playlist: row[7] })).sort((a, b) => a.song.localeCompare(b.song)), [...SONG_PLAYLIST_PAIRS].sort((a, b) => a.song.localeCompare(b.song)), 'Der vollständige Verbund enthält genau die vier fachlich richtigen Paare.');
assert.equal(compareRelations(full, relation('select * from Song, Song_in_Playlist, Playlist where Song_in_Playlist.song_id = Song.id and Song_in_Playlist.playlist_id = Playlist.id;')).correct, true, 'Vertauschte Gleichungsseiten und Formatierung sind gleichwertig.');
assert.equal(compareRelations(full, relation(`SeLeCt *
  FrOm Song, Song_in_Playlist, Playlist
  WhErE Playlist.id = Song_in_Playlist.playlist_id
    AnD Song.id = Song_in_Playlist.song_id
;`)).correct, true, 'Groß-/Kleinschreibung, Zeilenumbrüche, Semikolon und vertauschte Bedingungsreihenfolge sind gleichwertig.');
assert.equal(compareRelations(full, relation('SELECT * FROM Song, Song_in_Playlist, Playlist WHERE Song.id = Song_in_Playlist.song_id OR Playlist.id = Song_in_Playlist.playlist_id')).correct, false, 'OR darf nicht als vollständiger Verbund gelten.');
assert.equal(relation('SELECT * FROM Song, Song_in_Playlist, Playlist WHERE Song.id = Song_in_Playlist.song_id OR Playlist.id = Song_in_Playlist.playlist_id').values.length, 20);
assert.equal(compareRelations(full, first).correct, false, 'Eine Teilbedingung reicht nicht.');
assert.equal(compareRelations(full, playlistOnly).correct, false, 'Auch die zweite Teilbedingung allein reicht nicht.');
assert.equal(compareRelations(full, relation('SELECT * FROM Song, Song_in_Playlist, Playlist WHERE Song.id = Song_in_Playlist.playlist_id AND Playlist.id = Song_in_Playlist.song_id')).correct, false, 'Falsche Schlüsselpaare gelten nicht.');
assert.equal(compareRelations(full, relation('SELECT * FROM Song, Song_in_Playlist, Playlist WHERE Song.id = -1')).correct, false, 'Eine leere Ergebnismenge gilt nicht als vollständiger Verbund.');
const coincidentalFourRows = relation('SELECT * FROM Song, Song_in_Playlist, Playlist LIMIT 4');
assert.equal(coincidentalFourRows.values.length, 4);
assert.equal(compareRelations(full, coincidentalFourRows).correct, false, 'Vier fachlich falsche Zeilen dürfen nicht allein wegen ihrer Anzahl gelten.');
assert.throws(() => db.exec('SELECT id FROM Song, Playlist'), /ambiguous column/i);
assert.throws(() => db.exec('SELECT * FROM Unbekannt'), /no such table/i);
assert.throws(() => db.exec('SELECT Song.Unbekannt FROM Song'), /no such column/i);
assert.equal(validateSelectStatement('UPDATE Song SET titel = \'x\'').ok, false);
assert.equal(validateSelectStatement('SELECT * FROM Song; SELECT * FROM Playlist').ok, false);
assert.equal(validateSelectStatement(`${SONG_VERBUND_SQL.fullConnection}\n`).ok, true, 'Eine lesende Einzelanweisung mit abschließendem Semikolon bleibt zulässig.');
db.close();

const html = await readFile(resolve(databaseFolder, 'aufgabe7.html'), 'utf8');
const sqlLab = await readFile(resolve(databaseFolder, 'sql-lab.js'), 'utf8');
assert.match(html, /data-sql-module="song-verbund"/);
assert.match(html, /Songs-Datenbanklabor/);
assert.doesNotMatch(html, /\bAS\b|Song\s+[a-z]\b|Playlist\s+[a-z]\b/i, 'Das sichtbare HTML führt keine Tabellenkurzschreibweisen ein.');
assert.doesNotMatch(JSON.stringify(SONG_VERBUND_VISIBLE_TEXT), /\bAS\b|Song\s+[a-z]\b|Playlist\s+[a-z]\b/i, 'Auch Hinweise und Merksatz führen keine Tabellenkurzschreibweisen ein.');
const verbundModuleSource = sqlLab.slice(sqlLab.indexOf('const VERBUND_STORAGE_KEY'));
assert.doesNotMatch(verbundModuleSource, /\sAS\s|\b(?:S|P|SiP)\./, 'Die Schüleroberfläche der Aufgabe 7 enthält weder AS noch sichtbare Tabellenkürzel.');
assert.match(sqlLab, /button\.id = `tab-\$\{id\}`/, 'Die neue Reiternavigation verwendet die gemeinsame tab-*-Adressierung für Pfeil-, Home- und End-Tasten.');
assert.match(sqlLab, /import \{[^\n]*SONG_VERBUND_COLUMNS[^\n]*\} from '\.\/song-verbund-daten\.mjs\?v=\d+[a-z]?';/, 'Die Ergebnisdarstellung importiert ihre qualifizierte Spaltenliste mit Cache-Buster aus der gemeinsamen Datenquelle.');
assert.match(sqlLab, /Tabelle \$\{tableName\} horizontal scrollen/, 'Auch breite Ausgangstabellen bleiben in einem beschrifteten, fokussierbaren Scrollbereich erreichbar.');
assert.doesNotMatch(sqlLab, /button\.id = `verbund-tab-/, 'Die fehlerhafte Sonderadressierung der Verbund-Reiter ist entfernt.');
console.log('Song-Verbund: Daten, 32 → 8 → 4, Schlüsselpaare und SQL-Fehlerfälle erfolgreich geprüft');
