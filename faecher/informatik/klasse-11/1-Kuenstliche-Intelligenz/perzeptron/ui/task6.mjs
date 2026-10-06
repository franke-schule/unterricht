import { evaluateSemanticAnswer } from './semantic-answer.mjs';

const SERVER_URL = 'https://script.google.com/macros/s/AKfycby8RWL6uYrKZyoJ6m2GRpWyRmXjwsdskyCiqzKpRhIK5-wrDl-9lWWk8CiAGaVMoy0x/exec';
const STORAGE_KEY = 'informatik11-ki-aufgabe6-v1';
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
  { question:'1. Was macht `punktKlassifizieren`?', options:['Die Methode multipliziert beide Eingaben mit ihren Gewichten.','Sie addiert die beiden Produkte.','Sie verändert die Gewichte bei jeder Klassifikation.','Sie gibt 1 zurück, wenn die Summe mindestens so groß wie `theta` ist.'], correct:[0,1,3], explanation:'Die Methode berechnet die gewichtete Summe und vergleicht sie mit `theta`. Sie verändert keine Parameter.' },
  { question:'2. Welche Aussagen zum Training stimmen?', options:['`delta` ist das Label minus die berechnete Ausgabe.','Bei `delta = 0` bleiben Gewichte und Schwellenwert unverändert.','Das Label des Datenpunkts wird überschrieben.','Die Lernrate beeinflusst die Größe der Anpassung.'], correct:[0,1,3], explanation:'Das Label bleibt erhalten. Nur bei einem Fehler werden die Parameter angepasst; die Lernrate bestimmt die Schrittweite.' },
  { question:'3. Was gilt, wenn die gewichtete Summe genau `theta` entspricht?', options:['Die Ausgabe ist 1.','Die Ausgabe ist 0.','`delta` ist unabhängig vom Label immer 0.','Die Gewichte werden sofort verändert.'], correct:[0], explanation:'Der Vergleich verwendet `>=`. Bei Gleichheit ist die Ausgabe 1; erst das Label entscheidet über `delta`.' },
  { question:'4. Welche Änderungen gelten bei `delta = -1`?', options:['Für jedes Gewicht gilt: neuer Wert = alter Wert − α · Eingabe.','`theta` wird um α erhöht.','Jedes Gewicht wird unabhängig von der Eingabe um genau 1 kleiner.','Das Label wird in 1 geändert.'], correct:[0,1], explanation:'Bei `delta = -1` werden die gewichteten Lernschritte abgezogen und `theta` um α erhöht. Das Label wird nicht geändert.' }
];
const state = { variant: null, description: '', quiz: QUIZ.map(() => []), quizSummary: false };

function save() {
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
    if (saved.quizSummary === true) state.quizSummary = true;
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
  save();
}
function showChoice() {
  document.querySelector('#variant-choice').hidden = false;
  document.querySelector('#work-area').hidden = true;
  document.querySelector('#variant-title').focus?.();
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
  if (result.points >= result.maxPoints) return 0;
  if (result.points > 0) return 1;
  return 2;
}
function renderEvaluation(box, result, fallbackKey) {
  box.hidden = false;
  const level = resultLevel(result);
  box.className = 'feedback ' + ['success','partial','error'][level];
  box.replaceChildren();
  const heading = document.createElement('h3');
  heading.textContent = `${result.points} von ${result.maxPoints} Punkten – ${result.status}`;
  box.append(heading);
  const emptyStrength = ['Alle erwarteten Aspekte wurden erkannt.', 'Einige erwartete Aspekte wurden erkannt.', 'Es wurde noch kein eindeutiger richtiger Aspekt erkannt.'][level];
  const emptyMissing = ['Es fehlen keine wesentlichen Aspekte.', 'Es fehlen noch erwartete Aspekte. Prüfe die Rückmeldung unten.', 'Wichtige Aspekte fehlen noch. Prüfe die Rückmeldung unten.'][level];
  for (const [title, items, empty] of [['Das ist dir gelungen',result.strengths,emptyStrength],['Das solltest du überprüfen',result.missing,emptyMissing]]) {
    const h = document.createElement('h4'); h.textContent = title; box.append(h);
    if (Array.isArray(items) && items.length) { const ul = document.createElement('ul'); for (const item of items) { const li = document.createElement('li'); li.textContent = item; ul.append(li); } box.append(ul); }
    else { const p = document.createElement('p'); p.textContent = empty; box.append(p); }
  }
  const feedback = document.createElement('p');
  const serverFeedback = typeof result.feedback === 'string' ? result.feedback.trim() : '';
  feedback.textContent = serverFeedback && serverFeedback !== 'Ueberarbeite deine Antwort mithilfe der Hinweise.'
    ? serverFeedback
    : FALLBACK[fallbackKey][level];
  box.append(feedback);
}
function serverError(error) {
  const message = error?.message || 'Die Auswertung konnte nicht abgeschlossen werden.';
  if (/unbekannt|nicht gefunden|task.?id|Aufgabe.*nicht/i.test(message)) return 'Für Aufgabe 6 ist noch keine aktuelle Serverversion bereitgestellt. Bitte informiere deine Lehrkraft.';
  if (/nicht rechtzeitig|timeout/i.test(message)) return 'Der Auswertungsserver hat nicht rechtzeitig geantwortet. Bitte versuche es erneut.';
  return message;
}
async function checkDescription() {
  const answer = document.querySelector('#description').value.trim();
  const box = resultBox('description');
  if (answer.length < 35) return showMessage(box,'Beschreibe die Rechnung und die Entscheidung noch etwas genauer, damit deine Antwort sinnvoll ausgewertet werden kann.');
  const button = document.querySelector('#check-description'); button.disabled = true;
  showMessage(box,'Deine Beschreibung wird überprüft.','partial');
  try { renderEvaluation(box,await evaluateSemanticAnswer({serverUrl:SERVER_URL,taskId:'11-6-klassifizieren',answer}), 'description'); }
  catch(error) { showMessage(box,serverError(error)); }
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
  return new Promise((resolve,reject) => {
    const requestId = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
    const frame = document.createElement('iframe');
    frame.name = 'code-feedback-' + requestId.replace(/[^a-zA-Z0-9_-]/g,'');
    frame.title = 'Unsichtbarer Übertragungsrahmen für die Codeauswertung';
    frame.setAttribute('aria-hidden','true'); frame.hidden = true;
    const form = document.createElement('form');
    form.method = 'POST'; form.action = SERVER_URL; form.target = frame.name; form.acceptCharset = 'UTF-8'; form.hidden = true;
    for (const [name,value] of Object.entries({requestType:'code',requestId,taskId,code})) {
      const input = document.createElement('input'); input.type = 'hidden'; input.name = name; input.value = value; form.append(input);
    }
    document.body.append(frame,form);
    let pollScript = null, pollTimer = null;
    const cleanup = () => { clearTimeout(timeout); clearTimeout(pollTimer); pollScript?.remove(); frame.remove(); form.remove(); delete window.__task6CodeCallbacks[requestId]; };
    const timeout = setTimeout(() => { cleanup(); reject(new Error('Der Auswertungsserver hat nicht rechtzeitig geantwortet. Bitte versuche es erneut.')); },60000);
    window.__task6CodeCallbacks[requestId] = message => {
      if (message?.type !== 'GEMINI_CODE_EVALUATION_RESULT') { cleanup(); reject(new Error('Für Aufgabe 6 ist noch keine aktuelle Serverversion bereitgestellt. Bitte informiere deine Lehrkraft.')); return; }
      if (message.pending) { pollTimer = setTimeout(poll,2200); return; }
      cleanup();
      if (message.result?.ok === true) resolve(message.result);
      else reject(new Error(message.result?.message || 'Die Codeauswertung konnte nicht abgeschlossen werden.'));
    };
    function poll() {
      pollScript?.remove();
      pollScript = document.createElement('script');
      const url = new URL(SERVER_URL);
      for (const [key,value] of Object.entries({callback:'__handleTask6CodeResult',requestType:'code-result',requestId,cacheBust:Date.now()})) url.searchParams.set(key,String(value));
      pollScript.src = url.toString(); pollScript.async = true;
      pollScript.onerror = () => { pollTimer = setTimeout(poll,3000); };
      document.body.append(pollScript);
    }
    form.submit();
    pollTimer = setTimeout(poll,1500);
  });
}
window.__task6CodeCallbacks = Object.create(null);
window.__handleTask6CodeResult = message => { window.__task6CodeCallbacks[message?.requestId]?.(message); };
async function checkCode(button) {
  const taskId = button.dataset.codeTask, box = resultBox(taskId);
  let code;
  try { code = getCode(); } catch(error) { return showMessage(box,error.message); }
  if (code.length > 12000) return showMessage(box,'Dein Programmcode ist zu lang für die automatische Auswertung.');
  button.disabled = true;
  showMessage(box,'Der aktuelle Stand von `Perzeptron.java` wird analysiert.','partial');
  try { renderEvaluation(box,await codeRequest(taskId,code),taskId); }
  catch(error) { showMessage(box,serverError(error)); }
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
buildQuiz();
guardIdeReset('frame-einfach','einfach');
guardIdeReset('frame-schwer','schwer');
document.querySelectorAll('[data-choose]').forEach(button => button.addEventListener('click',() => choose(button.dataset.choose)));
document.querySelector('#change-variant').addEventListener('click',showChoice);
document.querySelector('#description').addEventListener('input',event => { state.description = event.target.value; save(); });
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
