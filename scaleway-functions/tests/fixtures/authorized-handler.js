'use strict';

// Bestehende Rubrik-/Routingtests beginnen mit einer autorisierten Anfrage.
// Die Authentifizierung selbst wird separat gegen den echten Handler getestet.
const { createHandler: realCreateHandler } = require('../../handler');
const { createPasswordHash } = require('../../create-access-password-hash');
const TEST_PASSWORD = 'Lokales-Testpasswort';
const TEST_PASSWORD_HASH = createPasswordHash(TEST_PASSWORD);
const TEST_PASSWORD_HEADER = Buffer.from(TEST_PASSWORD, 'utf8').toString('base64');

function createHandler(options = {}) {
  const handle = realCreateHandler({ ...options, env: { ...options.env, AI_ACCESS_PASSWORD_HASH: TEST_PASSWORD_HASH } });
  return event => handle({ ...event, headers: { ...event?.headers, 'X-AI-Password': TEST_PASSWORD_HEADER } });
}

// Alte VM-Transporttests isolieren den Dialog. Der echte Dialog samt Kodierung
// wird in access-password-browser.check.js im Browser geprüft.
const clientGlobals = {
  getAccessPassword: () => TEST_PASSWORD,
  encodeAccessPassword: password => Buffer.from(password, 'utf8').toString('base64'),
  forgetAccessPassword() {}
};

module.exports = { createHandler, TEST_PASSWORD, TEST_PASSWORD_HASH, TEST_PASSWORD_HEADER, clientGlobals };
