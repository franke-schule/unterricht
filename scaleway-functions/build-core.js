'use strict';

// Die .gs-Quellen bleiben unverändert. Nur reine Bewertungsfunktionen werden
// für das Deployment gebündelt; Google-HTTP-Aufrufe und iframe-Ausgaben fehlen.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');

const sourceDirectory = path.resolve(__dirname, '..', 'apps-script');
const sourceHashes = {};
function read(name) {
  const raw = fs.readFileSync(path.join(sourceDirectory, name));
  sourceHashes[name] = crypto.createHash('sha256').update(raw).digest('hex');
  return raw.toString('utf8').replace(/\r\n/g, '\n');
}
function extract(source, start, end) {
  const first = source.indexOf(start);
  const last = source.indexOf(end, first + start.length);
  if (first < 0 || last < first) throw new Error('Quellstruktur geändert; Extraktion prüfen.');
  return source.slice(first, last);
}

const helpers = read('Helpers.gs');
const helperEnd = helpers.indexOf('function createPostMessageResponse_');
if (helperEnd < 0) throw new Error('Quellstruktur von Helpers.gs geändert.');
const gemini = read('Gemini.gs');
const config = read('Config.gs');
const sections = [
  read('Tasks.gs'), read('EvaluationSchema.gs'),
  helpers.slice(0, helperEnd), read('Rules.gs'),
  extract(gemini, 'function buildPrompt_(', 'function extractGeminiText_(')
];
const configContext = vm.createContext({});
vm.runInContext(config, configContext);
const constants = vm.runInContext('({MAX_ANSWER_LENGTH, MAX_CODE_LENGTH, RESULT_MESSAGE_TYPE, CODE_RESULT_MESSAGE_TYPE})', configContext);
const constantSource = Object.entries(constants)
  .map(([name, value]) => `const ${name} = ${JSON.stringify(value)};`).join('\n');
const output = '// Generiert durch build-core.js aus apps-script/. Nicht manuell ändern.\n' +
  "'use strict';\n" + constantSource + '\n' + sections.join('\n\n') +
  '\nmodule.exports = { TASKS, EVALUATION_SCHEMA, buildPrompt_, normalizeEvaluation_, ' +
  'applyRuleBasedMinimum_, createErrorResult_, MAX_ANSWER_LENGTH, MAX_CODE_LENGTH, ' +
  'RESULT_MESSAGE_TYPE, CODE_RESULT_MESSAGE_TYPE };\n';
new vm.Script(output, { filename: 'evaluation-core.js' });
fs.writeFileSync(path.join(__dirname, 'evaluation-core.js'), output, 'utf8');
const core = require('./evaluation-core');
fs.writeFileSync(path.join(__dirname, 'source-manifest.json'), JSON.stringify({
  sources: sourceHashes,
  taskCount: Object.keys(core.TASKS).length,
  evaluationCoreSha256: crypto.createHash('sha256').update(output).digest('hex')
}, null, 2) + '\n', 'utf8');
console.log(`Bewertungskern gebaut: ${Object.keys(core.TASKS).length} Aufgaben.`);

