'use strict';

const core = require('./evaluation-core');
const { ApiError, readConfig, evaluate } = require('./scaleway-client');
const { version } = require('./package.json');
const { scrypt, timingSafeEqual } = require('node:crypto');
const { promisify } = require('node:util');

const derivePassword = promisify(scrypt);
const PASSWORD_HASH_PATTERN = /^scrypt\$v1\$32768\$8\$1\$([0-9a-f]{32})\$([0-9a-f]{128})$/;

function passwordConfiguration(env) {
  const match = typeof env.AI_ACCESS_PASSWORD_HASH === 'string' && env.AI_ACCESS_PASSWORD_HASH.match(PASSWORD_HASH_PATTERN);
  if (!match || match[0] !== env.AI_ACCESS_PASSWORD_HASH) throw new ApiError(503, 'AUTH_CONFIGURATION', 'Der Passwortschutz ist auf dem Auswertungsserver noch nicht korrekt eingerichtet.');
  return { salt: Buffer.from(match[1], 'hex'), expected: Buffer.from(match[2], 'hex') };
}

async function requireAccess(event, env) {
  const { salt, expected } = passwordConfiguration(env);
  const encoded = header(event, 'x-ai-password');
  const denied = () => new ApiError(401, 'AUTH_REQUIRED', 'Bitte gib das gültige Unterrichtspasswort ein.');
  // Base64 ist nur die Transportkodierung für UTF-8, keine Verschlüsselung.
  if (!encoded || encoded.length > 344 || !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(encoded)) throw denied();
  const bytes = Buffer.from(encoded, 'base64');
  if (!bytes.length || bytes.length > 256 || bytes.toString('base64') !== encoded) throw denied();
  let password;
  try { password = new TextDecoder('utf-8', { fatal: true, ignoreBOM: true }).decode(bytes); }
  catch { throw denied(); }
  if (/\p{Cc}/u.test(password)) throw denied();
  const actual = await derivePassword(password, salt, expected.length, { N: 32768, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
  if (!timingSafeEqual(actual, expected)) throw denied();
}

const MAX_BODY_BYTES = 65536;

function header(event, name) {
  const entry = Object.entries(event.headers || {}).find(([key]) => key.toLowerCase() === name.toLowerCase());
  return entry && typeof entry[1] === 'string' ? entry[1] : '';
}

function readRequest(event) {
  const contentType = header(event, 'content-type').split(';')[0].trim().toLowerCase();
  if (contentType !== 'application/json') throw new ApiError(415, 'CONTENT_TYPE', 'Die Anfrage muss als JSON übertragen werden.');
  if (typeof event.body !== 'string') throw new ApiError(400, 'INVALID_JSON', 'Die Anfrage enthält kein gültiges JSON.');
  // Vor dem Decodieren begrenzen, damit auch base64-kodierte Bodies begrenzt sind.
  if (event.body.length > MAX_BODY_BYTES * 2) throw new ApiError(413, 'BODY_TOO_LARGE', 'Die Anfrage ist zu groß.');
  const body = event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString('utf8') : event.body;
  if (Buffer.byteLength(body, 'utf8') > MAX_BODY_BYTES) throw new ApiError(413, 'BODY_TOO_LARGE', 'Die Anfrage ist zu groß.');
  let request;
  try { request = JSON.parse(body); }
  catch { throw new ApiError(400, 'INVALID_JSON', 'Die Anfrage enthält kein gültiges JSON.'); }
  if (!request || typeof request !== 'object' || Array.isArray(request)) throw new ApiError(400, 'INVALID_REQUEST', 'Die Anfrage ist ungültig.');
  if (typeof request.requestId !== 'string' || !/^[0-9A-Za-z_-]{8,100}$/.test(request.requestId)) {
    throw new ApiError(400, 'REQUEST_ID', 'Die Anfrage enthält keine gültige requestId.');
  }
  if (typeof request.taskId !== 'string' || !Object.hasOwn(core.TASKS, request.taskId)) {
    throw new ApiError(400, 'UNKNOWN_TASK', 'Diese Aufgabe ist auf dem Auswertungsserver nicht bekannt.');
  }
  const task = core.TASKS[request.taskId];
  const isCode = task.responseType === 'code';
  if (request.requestType !== undefined && request.requestType !== (isCode ? 'code' : 'text') &&
      !(request.requestType === '' && !isCode)) {
    throw new ApiError(400, 'REQUEST_TYPE', 'Die Anfrage passt nicht zum Aufgabentyp.');
  }
  const value = isCode ? request.code : request.answer;
  if (typeof value !== 'string') throw new ApiError(400, 'INPUT_MISSING', isCode ? 'Die Anfrage enthält keinen Programmcode.' : 'Die Anfrage enthält keine Antwort.');
  const answer = value.trim();
  if (answer.length < (isCode ? 20 : 10)) throw new ApiError(400, 'INPUT_TOO_SHORT', isCode ? 'Der Programmcode ist noch zu kurz für eine Auswertung.' : 'Bitte formuliere eine etwas ausführlichere Antwort.');
  if (answer.length > (isCode ? core.MAX_CODE_LENGTH : core.MAX_ANSWER_LENGTH)) throw new ApiError(400, 'INPUT_TOO_LONG', isCode ? 'Der Programmcode ist zu lang.' : 'Die Antwort ist zu lang.');
  return { requestId: request.requestId, task, answer, isCode };
}

function createHandler({ env = process.env, fetchImpl = globalThis.fetch, now = Date.now, rateLimit = 10 } = {}) {
  // Nur eine zusätzliche Bremse pro laufender Instanz. Kein globales Limit!
  // Im Klassentest und vor dem Produktivwechsel muss der äußere Schutz geprüft werden.
  let windowStart = now();
  let calls = 0;
  return async function handle(event = {}) {
    const method = String(event.httpMethod || event.method || 'GET').toUpperCase();
    const path = event.path || '/';
    const origin = header(event, 'origin');
    const allowedOrigins = String(env.AI_ALLOWED_ORIGINS || '').split(',').map(value => value.trim()).filter(Boolean);
    const corsHeaders = origin && allowedOrigins.includes(origin) ? {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-AI-Password',
      'Access-Control-Max-Age': '600'
    } : {};
    function respond(statusCode, payload, extraHeaders = {}) {
      return { statusCode, headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
        'Vary': 'Origin', ...corsHeaders, ...extraHeaders
      }, body: statusCode === 204 ? '' : JSON.stringify(payload) };
    }
    let requestId = '';
    let type = core.RESULT_MESSAGE_TYPE;
    try {
      if (!['/', '/health', '/health/'].includes(path)) throw new ApiError(404, 'NOT_FOUND', 'Dieser Endpunkt ist nicht vorhanden.');
      if (origin && !allowedOrigins.includes(origin)) throw new ApiError(403, 'ORIGIN_NOT_ALLOWED', 'Diese Website ist für den Server noch nicht freigegeben.');
      if (method === 'OPTIONS') {
        if (!origin) throw new ApiError(400, 'ORIGIN_MISSING', 'Die Voranfrage enthält keinen Origin.');
        const requestedMethod = header(event, 'access-control-request-method').toUpperCase();
        const requestedHeaders = header(event, 'access-control-request-headers').toLowerCase().split(',').map(value => value.trim()).filter(Boolean);
        if (!['GET', 'POST'].includes(requestedMethod) || requestedHeaders.some(value => !['content-type', 'x-ai-password'].includes(value))) {
          throw new ApiError(403, 'PREFLIGHT_NOT_ALLOWED', 'Diese Voranfrage ist nicht freigegeben.');
        }
        return respond(204);
      }
      if (method === 'GET') {
        if (Object.keys(event.queryStringParameters || {}).length) throw new ApiError(400, 'USE_POST', 'Aufgabeneingaben müssen per POST als JSON übertragen werden.');
        let configured = false;
        let accessConfigured = false;
        try { passwordConfiguration(env); accessConfigured = true; } catch {}
        try { readConfig(env); configured = accessConfigured; } catch {}
        return respond(200, { ok: true, service: 'unterricht-ki', provider: 'scaleway', version,
          taskCount: Object.keys(core.TASKS).length, configured,
          accessProtection: 'password-v1', accessConfigured,
          evaluationEnabled: env.AI_EVALUATION_ENABLED === 'true' });
      }
      if (method !== 'POST' || path !== '/') throw new ApiError(405, 'METHOD_NOT_ALLOWED', 'Für Auswertungen bitte POST verwenden.');
      const request = readRequest(event);
      requestId = request.requestId;
      type = request.isCode ? core.CODE_RESULT_MESSAGE_TYPE : core.RESULT_MESSAGE_TYPE;
      if (env.AI_EVALUATION_ENABLED !== 'true') throw new ApiError(503, 'EVALUATION_DISABLED', 'Die KI-Auswertung ist für den Test noch nicht aktiviert.');
      await requireAccess(event, env);
      const config = readConfig(env);
      const timestamp = now();
      if (timestamp - windowStart >= 60000) { windowStart = timestamp; calls = 0; }
      if (calls >= rateLimit) throw new ApiError(429, 'LOCAL_RATE_LIMIT', 'Es wurden zu viele Anfragen gestellt. Bitte warte eine Minute.');
      calls += 1;
      const result = await evaluate(request.task, request.answer, config, fetchImpl);
      return respond(200, { type, requestId, result });
    } catch (error) {
      // Niemals ungeprüfte Fehlermeldungen des HTTP-Clients oder Modellinhalte
      // zurückgeben bzw. loggen; sie können Secrets oder Schülertexte enthalten.
      const safe = error instanceof ApiError ? error : new ApiError(500, 'INTERNAL_ERROR', 'Die Auswertung konnte nicht abgeschlossen werden.');
      return respond(safe.status, { type, requestId, errorCode: safe.code, result: core.createErrorResult_(safe.message) },
        safe.status === 429 ? { 'Retry-After': '60' } : safe.status === 405 ? { Allow: 'GET, POST, OPTIONS' } : {});
    }
  };
}

module.exports = { handle: createHandler(), createHandler, readRequest };
