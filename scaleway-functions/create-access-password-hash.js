'use strict';

// Lokales Hilfsprogramm. Nicht in das Function-ZIP aufnehmen.
const { randomBytes, scryptSync } = require('node:crypto');
const { createInterface } = require('node:readline/promises');
const { Writable } = require('node:stream');

function createPasswordHash(password) {
  if (typeof password !== 'string' || password.length === 0 ||
      Buffer.byteLength(password, 'utf8') > 256 || /\p{Cc}/u.test(password)) {
    throw new Error('Bitte ein nicht leeres Passwort mit maximal 256 UTF-8-Bytes und ohne Steuerzeichen verwenden.');
  }
  const salt = randomBytes(16);
  const key = scryptSync(password, salt, 64, {
    N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024
  });
  return ['scrypt', 'v1', '32768', '8', '1', salt.toString('hex'), key.toString('hex')].join('$');
}

async function main() {
  if (process.argv.length > 2) {
    throw new Error('Keine Argumente angeben. Das Passwort wird verdeckt abgefragt.');
  }
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    throw new Error('Bitte direkt in einem interaktiven PowerShell-Fenster starten, ohne Pipe oder Ausgabeumleitung.');
  }

  // Readline schreibt seine gesamte Eingabeanzeige in diesen stummen Stream.
  // Fragen und Ergebnis werden getrennt ausgegeben; kein Passwort wird angezeigt.
  const silentOutput = new Writable({ write(_chunk, _encoding, callback) { callback(); } });
  const reader = createInterface({
    input: process.stdin, output: silentOutput, terminal: true, historySize: 0
  });
  let password = '';
  let confirmation = '';
  const controller = new AbortController();
  reader.on('SIGINT', () => controller.abort());
  try {
    process.stdout.write('Unterrichtspasswort eingeben (Eingabe bleibt unsichtbar): ');
    password = await reader.question('', { signal: controller.signal });
    process.stdout.write('\nPasswort wiederholen (Eingabe bleibt unsichtbar): ');
    confirmation = await reader.question('', { signal: controller.signal });
    process.stdout.write('\n');
    if (password !== confirmation) throw new Error('Die Eingaben stimmen nicht überein. Bitte das Programm erneut starten.');
    const hash = createPasswordHash(password);
    process.stdout.write(`\nPrüfwert für den Scaleway-Secret AI_ACCESS_PASSWORD_HASH:\n${hash}\n\nDen Prüfwert wie ein Secret behandeln. Es wurde keine Datei gespeichert.\n`);
  } catch (error) {
    if (controller.signal.aborted) throw new Error('Abgebrochen. Es wurde kein Prüfwert ausgegeben.');
    throw error;
  } finally {
    password = '';
    confirmation = '';
    reader.close();
    process.stdin.pause();
    process.stdin.unref?.();
    silentOutput.end();
  }
}

if (require.main === module) {
  main().catch(error => {
    process.stderr.write(`\n${error.message}\n`);
    process.exitCode = 1;
  });
}

module.exports = { createPasswordHash };
