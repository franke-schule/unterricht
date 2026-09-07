/**
 * Gemeinsame, fachlich verbindliche Datenquelle für Aufgabe 7.
 * Die Präsentationen nutzen Tabellenaliasse und die Reihenfolge Song, Playlist,
 * Song_in_Playlist; das Modul führt keine Aliasnamen ein und nutzt Song,
 * Song_in_Playlist, Playlist. Screenshots zeigen bei Song nur id und titel sowie
 * ältere Apostrophzeichen. Die am 06.09.2026 geprüften öffentlichen UTF-8-Werte
 * sind maßgeblich; der Schreibfehler Songs_in_Playlist im Arbeitsblatt wird nicht
 * übernommen. Die Materialien bleiben eine fachliche Erklärung, keine Datenquelle.
 */
const freezeRows = (rows) => Object.freeze(rows.map((row) => Object.freeze({ ...row })));

export const SONG_VERBUND_TABLE_NAMES = Object.freeze(['Song', 'Song_in_Playlist', 'Playlist']);
export const SONG_VERBUND_TABLE_SCHEMAS = Object.freeze([
  Object.freeze({ table: 'Song', columns: Object.freeze([['id', 'int'], ['titel', 'varchar(255)'], ['genre', 'varchar(255)'], ['interpret', 'varchar(255)']]) }),
  Object.freeze({ table: 'Song_in_Playlist', columns: Object.freeze([['song_id', 'int'], ['playlist_id', 'int']]) }),
  Object.freeze({ table: 'Playlist', columns: Object.freeze([['id', 'int'], ['titel', 'varchar(255)']]) })
]);
export const SONG_VERBUND_TABLES = Object.freeze({
  Song: freezeRows([
    { id: 1, titel: 'Gaslighter', genre: 'country', interpret: 'The Chicks' },
    { id: 2, titel: 'Wavin‘ Flag', genre: 'world', interpret: 'K‘naan' },
    { id: 3, titel: 'Try', genre: 'country rock', interpret: 'Neil Young' },
    { id: 4, titel: '’54, ’74, ’90, 2006', genre: 'indie rock', interpret: 'Sportfreunde Stiller' }
  ]),
  Song_in_Playlist: freezeRows([
    { song_id: 1, playlist_id: 1 },
    { song_id: 2, playlist_id: 2 },
    { song_id: 3, playlist_id: 1 },
    { song_id: 4, playlist_id: 2 }
  ]),
  Playlist: freezeRows([
    { id: 1, titel: 'Good Oldies' },
    { id: 2, titel: 'Fussballhits' }
  ])
});

export const SONG_VERBUND_COLUMN_GROUPS = Object.freeze([
  Object.freeze({ table: 'Song', columns: Object.freeze(['id', 'titel', 'genre', 'interpret']) }),
  Object.freeze({ table: 'Song_in_Playlist', columns: Object.freeze(['song_id', 'playlist_id']) }),
  Object.freeze({ table: 'Playlist', columns: Object.freeze(['id', 'titel']) })
]);
export const SONG_VERBUND_COLUMNS = Object.freeze(SONG_VERBUND_COLUMN_GROUPS.flatMap(({ table, columns }) => columns.map((column) => `${table}.${column}`)));

export const SONG_VERBUND_SQL = Object.freeze({
  crossProduct: 'SELECT *\nFROM Song, Song_in_Playlist, Playlist;',
  firstConnection: 'SELECT *\nFROM Song, Song_in_Playlist, Playlist\nWHERE Song.id = Song_in_Playlist.song_id;',
  playlistConnection: 'SELECT *\nFROM Song, Song_in_Playlist, Playlist\nWHERE Playlist.id = Song_in_Playlist.playlist_id;',
  fullConnection: 'SELECT *\nFROM Song, Song_in_Playlist, Playlist\nWHERE Song.id = Song_in_Playlist.song_id\n  AND Playlist.id = Song_in_Playlist.playlist_id;'
});

export const SONG_VERBUND_VISIBLE_TEXT = Object.freeze({
  firstHints: Object.freeze([
    'Suche einen Primärschlüssel und einen Fremdschlüssel, die dieselbe Song-Nummer meinen.',
    'Vergleiche Song.id mit Song_in_Playlist.song_id.',
    'Die erste Teilbedingung lautet: Song.id = Song_in_Playlist.song_id.'
  ]),
  secondHints: Object.freeze([
    'Die Playlist-Nummer muss ebenfalls zu einer Zuordnungszeile passen.',
    'Vergleiche Playlist.id mit Song_in_Playlist.playlist_id und prüfe die Verknüpfung.',
    'Beide Teilbedingungen müssen gleichzeitig gelten: Verbinde sie mit AND.'
  ]),
  sqlHints: Object.freeze([
    'Beginne mit SELECT * und nenne Song, Song_in_Playlist und Playlist nach FROM.',
    'Füge nach WHERE zuerst die Verbindung zwischen Song.id und Song_in_Playlist.song_id ein. Danach fehlt noch die Playlist-Verbindung.',
    'Die vollständige Bedingung lautet: Song.id = Song_in_Playlist.song_id AND Playlist.id = Song_in_Playlist.playlist_id.'
  ]),
  memory: 'Beim Verbund werden aus dem Kreuzprodukt nur die Datensätze ausgewählt, deren zusammengehörige Primär- und Fremdschlüssel übereinstimmen. Sind mehrere Verknüpfungsbedingungen nötig, werden sie mit AND verbunden.'
});

/**
 * Abschlussquiz als Multiple Choice mit Auswahlkästchen. Die Fragen 1 und 3
 * besitzen mehrere richtige Antworten, damit ein reines Durchklicken einzelner
 * Kästchen nicht ausreicht.
 */
export const SONG_VERBUND_QUIZ = Object.freeze([
  Object.freeze({
    id: 'kreuzprodukt',
    prompt: 'Was gilt für das Kreuzprodukt aus Song, Song_in_Playlist und Playlist?',
    options: Object.freeze([
      Object.freeze({ id: 'each', text: 'Jede Zeile wird mit jeder Zeile der anderen Tabellen kombiniert.', correct: true }),
      Object.freeze({ id: 'product', text: 'Die Anzahl der Ergebniszeilen ist das Produkt der Zeilenanzahlen: 4 · 4 · 2 = 32.', correct: true }),
      Object.freeze({ id: 'onlyGood', text: 'Es enthält nur fachlich sinnvolle Song-Playlist-Paare.', correct: false }),
      Object.freeze({ id: 'noWhere', text: 'Es entsteht, wenn nach FROM mehrere Tabellen stehen und keine WHERE-Bedingung folgt.', correct: true })
    ]),
    hint: 'Denke an Schritt 2: Ohne Bedingung wird wirklich jede Kombination gebildet.'
  }),
  Object.freeze({
    id: 'first',
    prompt: 'Welche Bedingung verbindet Song und Song_in_Playlist richtig?',
    options: Object.freeze([
      Object.freeze({ id: 'songId', text: 'Song.id = Song_in_Playlist.song_id', correct: true }),
      Object.freeze({ id: 'playlistId', text: 'Song.id = Playlist.id', correct: false }),
      Object.freeze({ id: 'titel', text: 'Song.titel = Playlist.titel', correct: false }),
      Object.freeze({ id: 'inner', text: 'Song_in_Playlist.song_id = Song_in_Playlist.playlist_id', correct: false })
    ]),
    hint: 'Ein Primärschlüssel gehört mit dem Fremdschlüssel zusammen, der auf ihn zeigt.'
  }),
  Object.freeze({
    id: 'full',
    prompt: 'Was gilt für die vollständige WHERE-Klausel des Verbunds?',
    options: Object.freeze([
      Object.freeze({ id: 'and', text: 'Beide Teilbedingungen werden mit AND verbunden.', correct: true }),
      Object.freeze({ id: 'keys', text: 'Jede Teilbedingung vergleicht einen Primärschlüssel mit dem passenden Fremdschlüssel.', correct: true }),
      Object.freeze({ id: 'or', text: 'Mit OR bleiben genauso viele Zeilen übrig wie mit AND.', correct: false }),
      Object.freeze({ id: 'four', text: 'Übrig bleiben genau 4 Zeilen.', correct: true })
    ]),
    hint: 'Beide Verbindungen müssen gleichzeitig gelten. Vergleiche das Ergebnis aus Schritt 4.'
  }),
  Object.freeze({
    id: 'count',
    prompt: 'Wie viele Zeilen liefert die Anfrage, wenn nach WHERE nur Song.id = Song_in_Playlist.song_id steht?',
    options: Object.freeze([
      Object.freeze({ id: 'four', text: '4 Zeilen', correct: false }),
      Object.freeze({ id: 'eight', text: '8 Zeilen', correct: true }),
      Object.freeze({ id: 'sixteen', text: '16 Zeilen', correct: false }),
      Object.freeze({ id: 'thirtytwo', text: '32 Zeilen', correct: false })
    ]),
    hint: 'Jede passende Song-Zuordnung wird noch mit beiden Playlists kombiniert.'
  })
]);

export function correctQuizOptions(question) {
  return question.options.filter((option) => option.correct).map((option) => option.id);
}

export function evaluateQuizQuestion(question, selected) {
  if (!Array.isArray(selected) || !selected.length) return false;
  const correct = correctQuizOptions(question);
  return correct.length === selected.length && correct.every((id) => selected.includes(id));
}

export const SONG_PLAYLIST_PAIRS = freezeRows([
  { song: 'Gaslighter', playlist: 'Good Oldies' },
  { song: 'Try', playlist: 'Good Oldies' },
  { song: 'Wavin‘ Flag', playlist: 'Fussballhits' },
  { song: '’54, ’74, ’90, 2006', playlist: 'Fussballhits' }
]);

export function buildSongCombinations(tables = SONG_VERBUND_TABLES) {
  return tables.Song.flatMap((song) => tables.Song_in_Playlist.flatMap((mapping) => tables.Playlist.map((playlist) => ({ song, mapping, playlist }))));
}

export function songRelation(combinations = buildSongCombinations()) {
  return {
    columns: [...SONG_VERBUND_COLUMNS],
    values: combinations.map(({ song, mapping, playlist }) => [song.id, song.titel, song.genre, song.interpret, mapping.song_id, mapping.playlist_id, playlist.id, playlist.titel])
  };
}

export function buildFirstConnection(combinations = buildSongCombinations()) {
  return combinations.filter(({ song, mapping }) => song.id === mapping.song_id);
}

export function buildPlaylistConnection(combinations = buildSongCombinations()) {
  return combinations.filter(({ mapping, playlist }) => mapping.playlist_id === playlist.id);
}

export function buildFullConnection(combinations = buildSongCombinations()) {
  return combinations.filter(({ song, mapping, playlist }) => song.id === mapping.song_id && playlist.id === mapping.playlist_id);
}

export function expectedSongRelation(kind = 'full') {
  const combinations = buildSongCombinations();
  if (kind === 'cross') return songRelation(combinations);
  if (kind === 'first') return songRelation(buildFirstConnection(combinations));
  if (kind === 'playlist') return songRelation(buildPlaylistConnection(combinations));
  return songRelation(buildFullConnection(combinations));
}

export function sameColumnPair(selected, expected) {
  if (!Array.isArray(selected) || selected.length !== 2) return false;
  return selected.includes(expected[0]) && selected.includes(expected[1]);
}

export function evaluateFirstConnection(selected) {
  return sameColumnPair(selected, ['Song.id', 'Song_in_Playlist.song_id']);
}

export function evaluateSecondConnection(selected, operator) {
  return operator === 'AND' && sameColumnPair(selected, ['Playlist.id', 'Song_in_Playlist.playlist_id']);
}
