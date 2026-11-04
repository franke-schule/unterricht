'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { scryptSync, timingSafeEqual } = require('node:crypto');
const { spawnSync } = require('node:child_process');
const path = require('node:path');
const { createPasswordHash } = require('../create-access-password-hash');

const testPassword = 'Nur-ein-Testpasswort-2026!';

test('Prüfwert enthält einen zufälligen Salt und lässt sich unabhängig verifizieren', () => {
  const encoded = createPasswordHash(testPassword);
  assert.match(encoded, /^scrypt\$v1\$32768\$8\$1\$[0-9a-f]{32}\$[0-9a-f]{128}$/);
  assert.notEqual(encoded, createPasswordHash(testPassword));
  assert.ok(!encoded.includes(testPassword));
  const [, , n, r, p, salt, hash] = encoded.split('$');
  const derive = password => scryptSync(password, Buffer.from(salt, 'hex'), 64, {
    N: Number(n), r: Number(r), p: Number(p), maxmem: 64 * 1024 * 1024
  });
  assert.ok(timingSafeEqual(derive(testPassword), Buffer.from(hash, 'hex')));
  assert.ok(!timingSafeEqual(derive('Ein-anderes-Testpasswort!'), Buffer.from(hash, 'hex')));
});

test('Auch Passwörter unter 20 Zeichen werden akzeptiert', () => {
  for (const password of ['x', 'zu-kurz', 'a'.repeat(19)]) {
    assert.match(createPasswordHash(password), /^scrypt\$v1\$/);
  }
});

test('Ungültige Eingaben werden ohne Passwort in der Fehlermeldung abgewiesen', () => {
  for (const invalid of [undefined, '', 'x'.repeat(257), `${testPassword}\n`]) {
    assert.throws(() => createPasswordHash(invalid), error => {
      assert.ok(!error.message.includes(testPassword));
      return /nicht leeres Passwort/.test(error.message);
    });
  }
});

test('CLI nimmt weder Passwörter als Argument noch aus einer Pipe entgegen', () => {
  const script = path.join(__dirname, '../create-access-password-hash.js');
  for (const args of [[], [testPassword]]) {
    const result = spawnSync(process.execPath, [script, ...args], {
      input: `${testPassword}\n`, encoding: 'utf8'
    });
    assert.equal(result.status, 1);
    assert.equal(result.stdout, '');
    assert.ok(!result.stderr.includes(testPassword));
  }
});
