'use strict';

// Die maßgeblichen Quellen liegen unter source/. apps-script/ ist ein Archiv
// und wird weder für den Build noch für neue Aufgaben verwendet.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');

const sourceDirectory = path.join(__dirname, 'source');
const sourceHashes = {};
function read(name) {
  const raw = fs.readFileSync(path.join(sourceDirectory, name));
  sourceHashes[name] = crypto.createHash('sha256').update(raw).digest('hex');
  return raw.toString('utf8').replace(/\r\n/g, '\n');
}
const sections = [
  read('config.js'), read('tasks.js'), read('evaluation-schema.js'),
  read('helpers.js'), read('rules.js'), read('prompt.js')
];
const output = '// Generiert durch build-core.js aus scaleway-functions/source/. Nicht manuell ändern.\n' +
  "'use strict';\n" + sections.join('\n\n') +
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

