'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');
const { extractFunction, canonical } = require('../migrate-website');
const repo = path.resolve(__dirname, '../..');

function readEvaluationScript(relative) {
  const html = fs.readFileSync(path.join(repo, relative), 'utf8');
  const start = html.indexOf('const SCRIPT_SERVER_URL');
  const errorFunction = extractFunction(html, 'showError');
  const end = html.indexOf(errorFunction, start) + errorFunction.length;
  if (start < 0 || end < start) throw new Error('Auswertungsskript fehlt.');
  return html.slice(start, end).replace(/import\('[^']*semantic-answer\.mjs[^']*'\)/g,
    'Promise.resolve(scwTestModule)');
}
function loadClient(context, file) {
  context.crypto ||= webcrypto;
  context.AbortController ||= AbortController;
  context.URL ||= URL;
  vm.createContext(context);
  const helper = fs.readFileSync(path.join(repo, canonical), 'utf8').replace(/^export /gm, '');
  vm.runInContext(helper, context);
  vm.runInContext('globalThis.scwTestModule = { evaluateSemanticAnswer, evaluateCodeAnswer };', context);
  vm.runInContext(readEvaluationScript(file), context);
  return context;
}
module.exports = { readEvaluationScript, loadClient };
