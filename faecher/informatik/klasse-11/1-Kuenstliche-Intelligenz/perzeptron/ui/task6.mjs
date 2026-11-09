import { evaluateSemanticAnswer, evaluateCodeAnswer, observeIdeCodeChanges, renderCompactEvaluation } from './semantic-answer.mjs?v=20261029-criteria-v1';
import { setupCodeSnippetOrder } from './code-snippet-order.mjs';

const SERVER_URL = 'https://unterrichtkiichezbn4-ki-auswertung.functions.fnc.fr-par.scw.cloud/';
const STORAGE_KEY = 'informatik11-ki-aufgabe6-v1';
const CODE_TASK_MAX_POINTS = { '11-6-einfach-summe':3, '11-6-einfach-ausgabe':3, '11-6-einfach-anpassung':5, '11-6-schwer-trainieren':6 };
const CODE_ASSESSMENT_VERSIONS = Object.fromEntries(Object.keys(CODE_TASK_MAX_POINTS).map(taskId => [taskId, '20261029-criteria-v1']));
const SOLUTION_CODE = 'M6QS-D4B7';
const IDE_IDS = { einfach: 'Java11Aufgabe6Einfach', schwer: 'Java11Aufgabe6Schwer' };
const FALLBACK = {
  description: ['Du hast Rechnung, Vergleich und Rückgabewert passend erklärt.', 'Die Grundidee stimmt. Ergänze den Vergleich mit `theta` oder erkläre den Rückgabewert genauer.', 'Beschreibe zuerst die gewichtete Summe und anschließend die Entscheidung zwischen 0 und 1.'],
  '11-6-einfach-summe': ['Die gewichtete Summe berücksichtigt beide Eingaben ohne Ganzzahlverlust.', 'Prüfe die Zuordnung beider Eingaben zu ihren Gewichten und den Datentyp.', 'Beginne mit den beiden Produkten aus Eingabewert und Gewicht.'],
  '11-6-einfach-ausgabe': ['Die Ausgabe behandelt auch den Gleichheitsfall richtig.', 'Prüfe den Vergleich und beide möglichen Ausgabewerte.', 'Vergleiche zuerst die Summe mit `theta` und ordne danach 0 und 1 zu.'],
  '11-6-einfach-anpassung': ['Gewichte und Schwellenwert werden für beide Fehlerzeichen richtig angepasst.', 'Prüfe Lernrate und Vorzeichen bei beiden Fehlerzeichen.', 'Bestimme zuerst, wie ein positiver und ein negativer Fehler die Parameter ändern.'],
  '11-6-schwer-trainieren': ['Deine Trainingsmethode bildet Ausgabe, Fehler und Parameteränderung schlüssig ab.', 'Ein Teil der Trainingsschritte stimmt. Prüfe den ersten noch fehlenden Schritt in der Rückmeldung.', 'Beginne mit Summe, Schwellenvergleich und Fehler; danach kommen die Parameteränderungen.']
};
const QUIZ = [
  { question:'1. Was macht `punktKlassifizieren`?', options:['Die Methode multipliziert beide Eingaben mit ihren Gewichten.','Sie addiert die beiden Produkte.','Sie verändert die Gewichte bei jeder Klassifikation.','Sie gibt 1 zurück, wenn die Summe größer als `theta` ist.'], correct:[0,1,3], explanation:'Die Methode berechnet die gewichtete Summe und vergleicht sie mit `theta`. Sie verändert keine Parameter.' },
  { question:'2. Welche Aussagen zum Training stimmen?', options:['`delta` ist das Label minus die berechnete Ausgabe.','Bei `delta = 0` bleiben Gewichte und Schwellenwert unverändert.','Das Label des Datenpunkts wird überschrieben.','Die Lernrate beeinflusst die Größe der Anpassung.'], correct:[0,1,3], explanation:'Das Label bleibt erhalten. Nur bei einem Fehler werden die Parameter angepasst; die Lernrate bestimmt die Schrittweite.' },
  { question:'3. Was gilt, wenn die gewichtete Summe genau `theta` entspricht?', options:['Die Ausgabe ist 1.','Die Ausgabe ist 0.','`delta` ist unabhängig vom Label immer 0.','Die Gewichte werden sofort verändert.'], correct:[1], explanation:'Der Vergleich verwendet `>`. Bei Gleichheit ist die Ausgabe 0; erst das Label entscheidet über `delta`.' },
  { question:'4. Welche Änderungen gelten bei `delta = -1`?', options:['Für jedes Gewicht gilt: neuer Wert = alter Wert − α · Eingabe.','`theta` wird um α erhöht.','Jedes Gewicht wird unabhängig von der Eingabe um genau 1 kleiner.','Das Label wird in 1 geändert.'], correct:[0,1], explanation:'Bei `delta = -1` werden die gewichteten Lernschritte abgezogen und `theta` um α erhöht. Das Label wird nicht geändert.' }
];
const state = { activationRule: 'strict', variant: null, description: '', quiz: QUIZ.map(() => []), quizSummary: false, quizOpen: false };
let descriptionRequestVersion = 0;
const codeRequestVersions = new Map();
let readSnippetOrder;
let restoreSnippetOrder;

function save() {
  state.snippetOrder = readSnippetOrder?.();
  state.snippetsOpen = document.querySelector('#code-snippets-help').open;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  catch { document.querySelector('#save-status').textContent = 'Deine Eingaben können in diesem Browser gerade nicht gespeichert werden.'; }
}
function restore() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (!saved || typeof saved !== 'object') return;
    if (['einfach','schwer'].includes(saved.variant)) state.variant = saved.variant;
    if (typeof saved.description === 'string') state.description = saved.description.slice(0,600);
    if (Array.isArray(saved.quiz)) state.quiz = QUIZ.map((_,i) => Array.isArray(saved.quiz[i]) ? saved.quiz[i].filter(v => Number.isInteger(v) && v >= 0 && v < 4) : []);
    if (saved.quizSummary === true && saved.activationRule === 'strict') state.quizSummary = true;
    state.quizOpen = saved.quizOpen === true;
    restoreSnippetOrder?.(saved.snippetOrder);
    document.querySelector('#code-snippets-help').open = saved.snippetsOpen === true;
  } catch { /* Beschädigte oder gesperrte Speicherung beeinträchtigt die Aufgabe nicht. */ }
}
function choose(variant) {
  state.variant = variant;
  document.querySelector('#variant-choice').hidden = true;
  document.querySelector('#work-area').hidden = false;
  for (const name of Object.keys(IDE_IDS)) {
    document.querySelector('#ide-' + name).hidden = name !== variant;
    document.querySelector('#tasks-' + name).hidden = name !== variant;
  }
  document.querySelector('#quiz-navigation').hidden = false;
  renderQuizVisibility();
  save();
}
function showChoice() {
  document.querySelector('#variant-choice').hidden = false;
  document.querySelector('#work-area').hidden = true;
  document.querySelector('#quiz-navigation').hidden = true;
  document.querySelector('#final-quiz').hidden = true;
  document.querySelector('#variant-title').focus?.();
}
function renderQuizVisibility() {
  document.querySelector('#final-quiz').hidden = !state.quizOpen;
  const button = document.querySelector('#toggle-quiz');
  button.setAttribute('aria-expanded', String(state.quizOpen));
  button.textContent = state.quizOpen ? 'Abschlussquiz ausblenden' : 'Abschlussquiz öffnen';
}
function toggleQuiz() {
  state.quizOpen = !state.quizOpen;
  renderQuizVisibility();
  save();
  if (state.quizOpen) document.querySelector('#quiz-title').focus();
}
function guardIdeReset(frameId, variant) {
  const frame = document.querySelector('#' + frameId);
  let attempts = 0;
  const timer = setInterval(() => {
    const button = frame.contentDocument?.querySelector('[title="Code auf Ausgangszustand zurücksetzen"]');
    if (button) {
      clearInterval(timer);
      frame.contentDocument.addEventListener('click', event => {
        if (!event.target.closest('[title="Code auf Ausgangszustand zurücksetzen"]')) return;
        const name = variant === 'einfach' ? 'einfachen' : 'schweren';
        if (!frame.contentWindow.confirm(`Möchtest du den Code-Stand der ${name} Variante wirklich auf den Ausgangszustand zurücksetzen?`)) {
          event.preventDefault(); event.stopImmediatePropagation();
        }
      }, true);
    }
    if (++attempts > 100) clearInterval(timer);
  }, 200);
}
function resultBox(id) { return document.querySelector('#result-' + id); }
function showMessage(box, message, kind='error') {
  box.hidden = false;
  box.className = 'feedback ' + kind;
  box.textContent = message;
}
function resultLevel(result) {
  if (result.points === result.maxPoints) return 0;
  if (result.points > 0) return 1;
  return 2;
}
function renderEvaluation(box, result, fallbackKey) {
  box.hidden = false;
  const level = resultLevel(result);
  box.className = 'feedback ' + ['success','partial','error'][level];
  renderCompactEvaluation(box, result, { maxHints: 1 });
}
function serverError(error) {
  const message = error?.message || 'Die Auswertung konnte nicht abgeschlossen werden.';
  if (/unbekannt|nicht gefunden|task.?id|Aufgabe.*nicht/i.test(message)) return 'Für Aufgabe 6.2 ist noch keine aktuelle Serverversion bereitgestellt. Bitte informiere deine Lehrkraft.';
  if (/nicht rechtzeitig|timeout/i.test(message)) return 'Der Auswertungsserver hat nicht rechtzeitig geantwortet. Bitte versuche es erneut.';
  return message;
}
async function checkDescription() {
  const answer = document.querySelector('#description').value.trim();
  const requestVersion = ++descriptionRequestVersion;
  const box = resultBox('description');
  if (answer.length < 35) return showMessage(box,'Beschreibe die Rechnung und die Entscheidung noch etwas genauer, damit deine Antwort sinnvoll ausgewertet werden kann.');
  const button = document.querySelector('#check-description'); button.disabled = true;
  showMessage(box,'Deine Beschreibung wird überprüft.','partial');
  try { const result = await evaluateSemanticAnswer({serverUrl:SERVER_URL,taskId:'11-6-klassifizieren',answer,expectedMaxPoints:4}); if (requestVersion === descriptionRequestVersion && document.querySelector('#description').value.trim() === answer) renderEvaluation(box,result,'description'); }
  catch(error) { if (requestVersion === descriptionRequestVersion && document.querySelector('#description').value.trim() === answer) showMessage(box,serverError(error)); }
  finally { button.disabled = false; }
}
function getCode() {
  const frame = document.querySelector('#frame-' + state.variant);
  const access = frame?.contentWindow?.online_ide_access;
  const ide = access?.getIDE?.(IDE_IDS[state.variant]);
  if (!ide || typeof ide.getFiles !== 'function') throw new Error('Die Online-IDE lädt noch. Bitte warte kurz und versuche es erneut.');
  const file = ide.getFiles().find(item => item.getName?.() === 'Perzeptron.java');
  if (!file || typeof file.getText !== 'function') throw new Error('`Perzeptron.java` wurde in dieser Variante nicht gefunden.');
  return file.getText();
}
function codeRequest(taskId, code) {
  return evaluateCodeAnswer({ serverUrl: SERVER_URL, taskId, code, expectedMaxPoints: CODE_TASK_MAX_POINTS[taskId] });
}
async function checkCode(button) {
  const taskId = button.dataset.codeTask, box = resultBox(taskId);
  let code;
  try { code = getCode(); } catch(error) { return showMessage(box,error.message); }
  const requestKey = `${taskId}:${CODE_ASSESSMENT_VERSIONS[taskId]}`;
  const requestVersion = (codeRequestVersions.get(requestKey) || 0) + 1;
  codeRequestVersions.set(requestKey, requestVersion);
  if (code.length > 12000) return showMessage(box,'Dein Programmcode ist zu lang für die automatische Auswertung.');
  button.disabled = true;
  showMessage(box,'Der aktuelle Stand von `Perzeptron.java` wird analysiert.','partial');
  try { const result = await codeRequest(taskId,code); if (codeRequestVersions.get(requestKey) === requestVersion && getCode() === code) renderEvaluation(box,result,taskId); }
  catch(error) { try { if (codeRequestVersions.get(requestKey) === requestVersion && getCode() === code) showMessage(box,serverError(error)); } catch {} }
  finally { button.disabled = false; }
}
function buildQuiz() {
  const container = document.querySelector('#quiz-questions');
  QUIZ.forEach((question,i) => {
    const fieldset = document.createElement('fieldset'); fieldset.className = 'quiz-question'; fieldset.dataset.quiz = String(i);
    const legend = document.createElement('legend'); legend.textContent = question.question; fieldset.append(legend);
    question.options.forEach((option,j) => {
      const label = document.createElement('label'); const input = document.createElement('input'); input.type = 'checkbox'; input.value = String(j); input.name = 'quiz-' + i;
      label.append(input,document.createTextNode(option)); fieldset.append(label);
    });
    const feedback = document.createElement('p'); feedback.className = 'feedback'; feedback.id = 'quiz-feedback-' + i; feedback.setAttribute('aria-live','polite'); feedback.hidden = true; fieldset.append(feedback);
    container.append(fieldset);
  });
}
function selected(i) { return [...document.querySelectorAll(`[name="quiz-${i}"]:checked`)].map(el => Number(el.value)); }
function correct(i, values) { return QUIZ[i].correct.length === values.length && QUIZ[i].correct.every(value => values.includes(value)); }
function progress(count) { document.querySelector('#quiz-progress').textContent = `${count} von 4 Fragen vollständig richtig`; }
function showQuizSummary() {
  const summary = document.querySelector('#quiz-summary'); summary.replaceChildren();
  if (!state.quizSummary) { summary.hidden = true; return; }
  summary.hidden = false;
  const heading = document.createElement('h3'); heading.textContent = 'Übersicht'; summary.append(heading);
  QUIZ.forEach(question => {
    const h = document.createElement('h4'); h.textContent = question.question; summary.append(h);
    const ul = document.createElement('ul'); question.correct.forEach(index => { const li = document.createElement('li'); li.textContent = question.options[index]; ul.append(li); }); summary.append(ul);
  });
}
function checkQuiz(event) {
  event.preventDefault(); let count = 0;
  QUIZ.forEach((question,i) => {
    const feedback = document.querySelector('#quiz-feedback-' + i); const right = correct(i,selected(i));
    if (right) count++;
    feedback.hidden = false; feedback.className = 'feedback ' + (right ? 'success' : 'partial');
    feedback.textContent = (right ? 'Richtig. Alle passenden Aussagen sind markiert.' : 'Noch nicht vollständig. Prüfe die Aussagen und versuche es erneut.') + ' ' + question.explanation;
  });
  progress(count); state.quizSummary = count === 4 || state.quizSummary; showQuizSummary(); save();
  showMessage(document.querySelector('#quiz-feedback'),count === 4 ? 'Alle vier Fragen sind vollständig richtig beantwortet.' : `${count} von 4 Fragen sind vollständig richtig. Verbessere die markierten Fragen und prüfe erneut.`,count === 4 ? 'success' : 'partial');
}
function normalizeSolutionCode(value) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '');
}
function unlockSolution(event) {
  event.preventDefault();
  const enteredCode = normalizeSolutionCode(event.currentTarget.elements['solution-code'].value);
  const isCorrect = enteredCode === normalizeSolutionCode(SOLUTION_CODE);
  const message = document.querySelector('#solution-code-message');
  document.querySelector('#solution-download-link').hidden = !isCorrect;
  message.className = 'solution-code-message' + (isCorrect ? '' : ' error');
  message.textContent = isCorrect
    ? 'Code korrekt. Das Sicherungsblatt ist freigeschaltet.'
    : 'Der eingegebene Code ist nicht gültig.';
}
setupCodeSnippetOrder({
  save,
  registerPart(id, read, restore) {
    readSnippetOrder = read;
    restoreSnippetOrder = restore;
  },
});
document.querySelector('#code-snippets-help').addEventListener('toggle', save);
buildQuiz();
guardIdeReset('frame-einfach','einfach');
guardIdeReset('frame-schwer','schwer');
for (const variant of Object.keys(IDE_IDS)) observeIdeCodeChanges(document.querySelector('#frame-' + variant), IDE_IDS[variant], () => {
  for (const taskId of Object.keys(CODE_TASK_MAX_POINTS)) {
    const requestKey = `${taskId}:${CODE_ASSESSMENT_VERSIONS[taskId]}`;
    codeRequestVersions.set(requestKey, (codeRequestVersions.get(requestKey) || 0) + 1);
    const box = resultBox(taskId);
    if (box) { box.replaceChildren(); box.hidden = true; }
  }
});
document.querySelectorAll('[data-choose]').forEach(button => button.addEventListener('click',() => choose(button.dataset.choose)));
document.querySelector('#change-variant').addEventListener('click',showChoice);
document.querySelector('#toggle-quiz').addEventListener('click',toggleQuiz);
document.querySelector('#description').addEventListener('input',event => { descriptionRequestVersion += 1; state.description = event.target.value; const box = resultBox('description'); box.replaceChildren(); box.hidden = true; save(); });
document.querySelector('#check-description').addEventListener('click',checkDescription);
document.querySelectorAll('[data-code-task]').forEach(button => button.addEventListener('click',() => checkCode(button)));
document.querySelector('#quiz-form').addEventListener('change',event => { if (event.target.matches('input[type="checkbox"]')) { state.quiz = QUIZ.map((_,i) => selected(i)); save(); } });
document.querySelector('#quiz-form').addEventListener('submit',checkQuiz);
// Jede Quizfrage lässt sich zusätzlich einzeln prüfen (../../../quiz-fragen-pruefen.js).
window.addQuizQuestionChecks?.({
  questions: QUIZ.map((question,i) => ({
    fieldset: document.querySelector(`[data-quiz="${i}"]`),
    feedback: document.querySelector('#quiz-feedback-' + i),
    solution: question.correct.map(String),
    hint: question.explanation,
  })),
  buttonClass: 'primary-button',
  levels: { high: 'success', medium: 'partial', low: 'error' },
  onAllCorrect: () => document.querySelector('#quiz-form').requestSubmit(),
});
document.querySelector('#solution-code-form').addEventListener('submit',unlockSolution);
restore();
document.querySelector('#description').value = state.description;
state.quiz.forEach((values,i) => values.forEach(value => { const input = document.querySelector(`[name="quiz-${i}"][value="${value}"]`); if (input) input.checked = true; }));
if (state.variant) choose(state.variant);
progress(QUIZ.filter((_,i) => correct(i,selected(i))).length);
showQuizSummary();
