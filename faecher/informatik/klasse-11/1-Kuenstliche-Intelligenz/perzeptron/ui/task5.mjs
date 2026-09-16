import { numberMatches, runEpoch } from '../logic/perceptron.mjs';
import { evaluateSemanticAnswer } from './semantic-answer.mjs';

const SERVER_URL = 'https://script.google.com/macros/s/AKfycby8RWL6uYrKZyoJ6m2GRpWyRmXjwsdskyCiqzKpRhIK5-wrDl-9lWWk8CiAGaVMoy0x/exec';
const STORAGE_KEY = 'informatik11-perzeptron-aufgabe5-v1';
const STEPS = ['discover', 'structure', 'decide', 'learn', 'simulator', 'fast', 'limits', 'summary'];
const epoch = runEpoch();
const GEOMETRY_STEPS = [
  { title:'Eigenschaften', targets:['axes','points'], text:'Die Zahnlänge wird auf der x-Achse abgetragen, die Augengröße auf der y-Achse.' },
  { title:'Hase eintragen', targets:['hare'], text:'Der Hase hat die Zahnlänge 2 und die Augengröße 4. Deshalb liegt sein Punkt bei (2|4).' },
  { title:'Hase einordnen', targets:['hare','line','area'], text:'Der Punkt (2|4) liegt oberhalb der Trenngeraden im Bereich „ungefährlich“.' },
  { title:'Fuchs eintragen', targets:['fox'], text:'Der Fuchs hat die Zahnlänge 5 und die Augengröße 3. Klicke in das Koordinatensystem bei (5|3) oder wähle die Werte unten.' },
  { title:'Fuchs einordnen', targets:['fox','line','area'], text:'Lies ab, auf welcher Seite der Trenngeraden der Fuchs liegt. Wähle seine Klasse und überprüfe.' },
];
const FOX_STEP = 3;
const SIGNAL_STEPS = [
  { title:'Eingaben', targets:['inputs'], text:'Die Eingaben beschreiben den Hasen: x₁ = 2 für die Zahnlänge und x₂ = 4 für die Augengröße.' },
  { title:'Gewichte', targets:['inputs','weights'], text:'Die Gewichte legen den Einfluss fest: w₁ = −1 und w₂ = 2.' },
  { title:'Produkte', targets:['weights','products'], text:'Jede Eingabe wird mit ihrem Gewicht multipliziert: (−1)·2 = −2 und 2·4 = 8.' },
  { title:'Summe', targets:['products','sum'], text:'Die beiden Produkte werden addiert: a = −2 + 8 = 6.' },
  { title:'Vergleich', targets:['sum','comparison'], text:'Die Summe wird mit dem Schwellenwert verglichen: 6 ≥ 3.' },
  { title:'Treppenfunktion', targets:['comparison','activation'], text:'Die Treppenfunktion gibt bei a ≥ θ den Wert 1 aus, sonst 0.' },
  { title:'Ausgabe', targets:['activation','output'], text:'Die Ausgabe ist 1. In diesem Modul bedeutet 1: ungefährlich.' },
];
const QUIZ = [
  { q:'1. Welche Aussagen zu den Bestandteilen stimmen?', options:[{id:'threshold',text:'Der Schwellenwert legt die Grenze für die Ausgabe fest.',correct:true},{id:'inputs',text:'Die Eingaben beschreiben Merkmale eines Datenpunkts.',correct:true},{id:'output-change',text:'Die Ausgabe verändert Gewichte ohne Zielwert.',correct:false},{id:'weights',text:'Gewichte bestimmen Stärke und Richtung des Einflusses.',correct:true}] },
  { q:'2. Was gilt für x₁ = 2, x₂ = 4, w₁ = −1, w₂ = 2 und θ = 3?', options:[{id:'class',text:'Das Tier wird als ungefährlich klassifiziert.',correct:true},{id:'sum',text:'Die gewichtete Summe ist 6.',correct:true},{id:'output',text:'Die Ausgabe ist 1.',correct:true},{id:'negative',text:'Ein negatives Gewicht erzwingt Ausgabe 0.',correct:false}] },
  { q:'3. Welche Aussagen zur Lernregel stimmen?', options:[{id:'delta',text:'δ = t − f(a).',correct:true},{id:'all-smaller',text:'Bei jedem Datensatz werden beide Gewichte kleiner.',correct:false},{id:'threshold-rule',text:'θ neu = θ alt − δ · α.',correct:true},{id:'zero',text:'Bei δ = 0 bleiben die Parameter unverändert.',correct:true}] },
  { q:'4. Welche Ergebnisse gehören zur ersten Epoche?', options:[{id:'remaining-error',text:'Nach der ersten Epoche bleibt ein Trainingsdatum falsch.',correct:false},{id:'final',text:'Nach vier Schritten gilt w₁ = −3, w₂ = 4 und θ = 1.',correct:true},{id:'step-three',text:'Beim dritten Datensatz ist δ = 0.',correct:true},{id:'step-two',text:'Nach Schritt 2 gilt w₁ = −3, w₂ = 0 und θ = 2.',correct:true}] },
  { q:'5. Was gilt geometrisch?', options:[{id:'normal',text:'Der Gewichtsvektor steht senkrecht auf der Geraden.',correct:true},{id:'line',text:'Die Trenngerade erfüllt w₁x₁ + w₂x₂ = θ.',correct:true},{id:'rate',text:'Eine große Lernrate macht alle Daten trennbar.',correct:false},{id:'linear',text:'Ein Perzeptron trennt nur linear separierbare Daten vollständig.',correct:true}] },
  { q:'6. Was bedeutet Lernen hier?', options:[{id:'compare',text:'Berechnete und erwartete Ausgabe werden verglichen.',correct:true},{id:'goal',text:'Das Perzeptron wählt sein Ziel selbst.',correct:false},{id:'no-consciousness',text:'Dafür sind weder Bewusstsein noch menschliches Verständnis nötig.',correct:true},{id:'algorithm',text:'Ein fester Algorithmus passt Zahlen anhand gelabelter Beispiele an.',correct:true}] },
];
const FIELD_LABELS = { product1:'Beitrag w₁ · x₁', product2:'Beitrag w₂ · x₂', sum:'gewichtete Summe a', comparison:'Vergleich a und θ', output:'Ausgabe f(a)', class:'Klasse', delta:'Fehler δ', w1:'w₁ nachher', w2:'w₂ nachher', threshold:'θ nachher', endW1:'Endwert w₁', endW2:'Endwert w₂', theta:'Endwert θ', steps:'Trainingsschritte', correctPoints:'korrekt klassifizierte Trainingspunkte', percent:'korrekt klassifiziert in Prozent', lineW1:'Koeffizient vor x₁', lineW2:'Koeffizient vor x₂', line:'rechte Seite der Geraden' };

function validStep(value, length, minimum = -1) { return Number.isInteger(value) && value >= minimum && value < length ? value : minimum; }
function validCoordinate(value, maximum, fallback = null) { return Number.isInteger(value) && value >= 0 && value <= maximum ? value : fallback; }
function loadState() {
  const defaults = { active:'discover', epoch:[], geometryStep:-1, signalStep:-1, foxX:null, foxY:null, foxClass:'', foxChecked:false };
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!parsed || typeof parsed !== 'object') return defaults;
    return { ...defaults, ...parsed, active:STEPS.includes(parsed.active) ? parsed.active : defaults.active, epoch:Array.isArray(parsed.epoch) ? parsed.epoch.slice(0, epoch.length).map(Boolean) : [], geometryStep:validStep(parsed.geometryStep, GEOMETRY_STEPS.length), signalStep:validStep(parsed.signalStep, SIGNAL_STEPS.length), foxX:validCoordinate(parsed.foxX, 7, defaults.foxX), foxY:validCoordinate(parsed.foxY, 5, defaults.foxY), foxClass:['danger','safe'].includes(parsed.foxClass) ? parsed.foxClass : '', foxChecked:parsed.foxChecked === true };
  } catch { return defaults; }
}
let state = loadState();
function saveState() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { document.querySelector('#save-status').textContent = 'Der Bearbeitungsstand konnte nicht lokal gespeichert werden.'; } }
function feedback(id, kind, message, html = false) { const el = document.querySelector('#' + id); el.hidden = false; el.className = 'feedback ' + kind; if (html) el.innerHTML = message; else el.textContent = message; }
function selectedValues(container) { return [...container.querySelectorAll('input[type=checkbox]:checked')].map((input) => input.value); }
function sameSet(values, expected) { return values.length === expected.length && expected.every((value) => values.includes(value)); }
function showStep(id, focus = false) {
  if (!STEPS.includes(id)) return;
  document.querySelectorAll('[data-panel]').forEach((panel) => { panel.hidden = panel.dataset.panel !== id; });
  document.querySelectorAll('[data-tab]').forEach((tab) => { const chosen = tab.dataset.tab === id; tab.setAttribute('aria-selected', String(chosen)); tab.tabIndex = chosen ? 0 : -1; });
  state.active = id; saveState();
  if (focus) { const heading = document.querySelector('#' + id + ' h2'); if (heading && !heading.hasAttribute('tabindex')) heading.tabIndex = -1; heading?.scrollIntoView({ behavior:'smooth', block:'start' }); requestAnimationFrame(() => { const active = document.activeElement; if (active?.closest('#' + id)) return; heading?.focus({ preventScroll:true }); }); }
}
function labelFor(id) { return document.querySelector('[data-tab=' + id + ']')?.textContent.replace(/^\d+\s*/, '') || id; }
function flowButton(text, target, secondary = false) { const button = document.createElement('button'); button.type = 'button'; button.className = secondary ? 'secondary-button' : 'primary-button'; button.textContent = text; button.addEventListener('click', () => showStep(target, true)); return button; }
function setupTabs() {
  document.querySelectorAll('[data-tab]').forEach((tab) => {
    tab.addEventListener('click', () => showStep(tab.dataset.tab, true));
    tab.addEventListener('keydown', (event) => { const index = STEPS.indexOf(tab.dataset.tab); const move = {ArrowLeft:-1,ArrowRight:1,ArrowUp:-1,ArrowDown:1}[event.key]; let next = index; if (event.key === 'Home') next = 0; else if (event.key === 'End') next = STEPS.length - 1; else if (move) next = (index + move + STEPS.length) % STEPS.length; else return; event.preventDefault(); showStep(STEPS[next]); document.querySelector('[data-tab=' + STEPS[next] + ']')?.focus(); });
  });
  document.querySelectorAll('[data-flow]').forEach((container) => { const index = STEPS.indexOf(container.dataset.flow); const next = STEPS[index + 1]; const afterNext = STEPS[index + 2]; if (next === 'fast') container.replaceChildren(flowButton('Weiter zu Grenzen', afterNext), flowButton('Für die Schnellen', next, true)); else if (next) container.replaceChildren(flowButton('Weiter: ' + labelFor(next), next)); });
  showStep(state.active);
}
function setupNextStepper(buttonSelector, itemSelector, steps, stateKey, statusSelector, dataKey, afterShow) {
  const button = document.querySelector(buttonSelector);
  const items = [...document.querySelectorAll(itemSelector)];
  const show = (index) => {
    const current = validStep(index, steps.length);
    state[stateKey] = current;
    items.forEach((item) => {
      const activeItem = current >= 0 && steps[current].targets.includes(item.dataset[dataKey]);
      const completeItem = current >= 0 && steps.slice(0, current).some((step) => step.targets.includes(item.dataset[dataKey]));
      item.classList.toggle('is-active', activeItem); item.classList.toggle('is-complete', completeItem); item.classList.toggle('is-dimmed', !activeItem && !completeItem);
    });
    document.querySelectorAll('[data-signal-arrow]').forEach((arrow) => {
      const linked = arrow.dataset.signalArrow.split(' ');
      const activeArrow = current >= 0 && linked.some((part) => steps[current].targets.includes(part));
      const completeArrow = current >= 0 && steps.slice(0, current).some((step) => linked.some((part) => step.targets.includes(part)));
      arrow.classList.toggle('is-active', activeArrow); arrow.classList.toggle('is-complete', completeArrow); arrow.classList.toggle('is-dimmed', !activeArrow && !completeArrow);
    });
    button.textContent = current === steps.length - 1 ? 'Schritte neu starten' : 'Weiter';
    button.classList.toggle('primary-button', current < steps.length - 1); button.classList.toggle('secondary-button', current === steps.length - 1);
    button.setAttribute('aria-describedby', statusSelector.slice(1));
    document.querySelector(statusSelector).textContent = current < 0 ? 'Klicke auf Weiter, um mit Schritt 1 von ' + steps.length + ' zu beginnen.' : 'Schritt ' + (current + 1) + '/' + steps.length + ': ' + steps[current].title + ' – ' + steps[current].text;
    afterShow?.(current);
    saveState();
  };
  button.addEventListener('click', () => show(state[stateKey] >= steps.length - 1 ? -1 : state[stateKey] + 1));
  show(state[stateKey]);
}
function setupDiscovery() {
  const plot = document.querySelector('.geometry-plot');
  const foxX = document.querySelector('#fox-x');
  const foxY = document.querySelector('#fox-y');
  const updateFox = () => { const x = validCoordinate(state.foxX, 7); const y = validCoordinate(state.foxY, 5); const marker = document.querySelector('#fox-marker'); const foxStep = state.geometryStep >= FOX_STEP; marker.toggleAttribute('hidden', !foxStep || x === null || y === null); plot.classList.toggle('accepts-fox', foxStep); document.querySelector('#fox-task').hidden = !foxStep; document.querySelector('#fox-class').hidden = state.geometryStep < FOX_STEP + 1; document.querySelector('#check-fox').hidden = state.geometryStep < FOX_STEP + 1; if (!marker.hasAttribute('hidden')) { marker.setAttribute('transform', 'translate(' + (90 + x * 85) + ' ' + (390 - y * 60) + ')'); document.querySelector('#fox-label').textContent = 'Fuchs (' + x + '|' + y + ')'; } foxX.value = x === null ? '' : String(x); foxY.value = y === null ? '' : String(y); document.querySelectorAll('[name=fox-class]').forEach((input) => { input.checked = input.value === state.foxClass; }); saveState(); };
  const setFox = (x, y) => { state.foxX = validCoordinate(x, 7, state.foxX); state.foxY = validCoordinate(y, 5, state.foxY); state.foxChecked = false; updateFox(); };
  foxX.addEventListener('change', () => setFox(foxX.value === '' ? null : Number(foxX.value), state.foxY));
  foxY.addEventListener('change', () => setFox(state.foxX, foxY.value === '' ? null : Number(foxY.value)));
  plot.addEventListener('click', (event) => { if (state.geometryStep < FOX_STEP) return; const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(plot.getScreenCTM().inverse()); setFox(Math.round((point.x - 90) / 85), Math.round((390 - point.y) / 60)); });
  document.querySelectorAll('[name=fox-class]').forEach((input) => input.addEventListener('change', () => { state.foxClass = input.value; state.foxChecked = false; saveState(); }));
  setupNextStepper('#next-geometry-step', '[data-geometry]', GEOMETRY_STEPS, 'geometryStep', '#geometry-step-status', 'geometry', (current) => { document.querySelector('#hare-marker').toggleAttribute('hidden', current < 1); updateFox(); });
  document.querySelector('#check-fox').addEventListener('click', () => { const pointCorrect = state.foxX === 5 && state.foxY === 3; const classCorrect = state.foxClass === 'danger'; state.foxChecked = pointCorrect && classCorrect; saveState(); if (state.foxChecked) feedback('fox-feedback','success','Korrekt. Der Fuchs liegt bei (5|3) im gefährlichen Bereich; die Ausgabe ist 0.'); else if (pointCorrect) feedback('fox-feedback','partial','Der Punkt stimmt. Prüfe noch, auf welcher Seite der Trenngeraden er liegt.'); else if (classCorrect) feedback('fox-feedback','partial','Die Klasse stimmt. Trage den Punkt noch genau bei (5|3) ein.'); else feedback('fox-feedback','error','Noch nicht korrekt. Trage zuerst den Punkt (5|3) ein und lies dann den beschrifteten Bereich ab.'); });
  updateFox();
  document.querySelector('#check-discover').addEventListener('click', () => { const answers = selectedValues(document.querySelector('#discover-options')); if (sameSet(answers, ['x1','x2','safe'])) feedback('discover-feedback','success','Korrekt. Merkmalswerte werden zu Koordinaten; der Hase liegt bei (2|4) auf der ungefährlichen Seite der Trenngeraden.'); else if (answers.some((value) => ['x1','x2','safe'].includes(value))) feedback('discover-feedback','partial','Teilweise korrekt. Prüfe noch, welche Achse zu welcher Eigenschaft gehört und auf welcher Seite der Linie der Hase liegt.'); else feedback('discover-feedback','error','Noch nicht korrekt. Markiere zuerst den Punkt (2|4) und lies dann die direkt beschrifteten Bereiche ab.'); });
}
function setupStructure() { setupNextStepper('#next-signal-step', '[data-signal]', SIGNAL_STEPS, 'signalStep', '#signal-step-status', 'signal'); }
function checkFields(container, expectations) { let correct = 0; const wrong = []; Object.entries(expectations).forEach(([name, expected]) => { const input = container.querySelector('[data-answer=' + name + ']'); const valid = typeof expected === 'number' ? numberMatches(input.value, expected, {allowPercent:name === 'percent'}) : input.value === expected; input.classList.toggle('is-correct', valid); input.classList.toggle('is-wrong', !valid); if (valid) correct++; else wrong.push(name); }); return { correct, total:Object.keys(expectations).length, wrong }; }
function fieldFeedback(id, kind, beginning, field) { feedback(id, kind, beginning + ' <strong>' + (FIELD_LABELS[field] || field) + '</strong>.', true); }
function setupDecision() { document.querySelector('#check-decision').addEventListener('click', () => { const result = checkFields(document.querySelector('#decision-form'), {product1:-4,product2:2,sum:-2,comparison:'lt',output:'0',class:'danger'}); const solved = result.correct === result.total; const decisionText = {sum:solved ? 'a = −2' : 'a = ?', comparison:solved ? '−2 < 3' : 'a ? θ', output:solved ? '0' : '?', class:solved ? 'gefährlich' : 'noch unbekannt'}; Object.entries(decisionText).forEach(([part,text]) => document.querySelectorAll('[data-decision=' + part + ']').forEach((element) => { element.textContent = text; })); if (solved) feedback('decision-feedback','success','Korrekt. Die Summe ist −2; das Perzeptron gibt 0 aus und klassifiziert den Hai als gefährlich.'); else if (result.correct) fieldFeedback('decision-feedback','partial',result.correct + ' von ' + result.total + ' Einträgen stimmen. Prüfe zuerst',result.wrong[0]); else feedback('decision-feedback','error','Noch nicht korrekt. Berechne zuerst beide Produkte und addiere sie erst danach.'); }); }
function entryFields(index) {
  return ['sum','output','delta','w1','w2','threshold'].map((name) => {
    const control = name === 'output' ? '<select data-field="' + name + '"><option value="">–</option><option>0</option><option>1</option></select>' : '<input data-field="' + name + '" inputmode="decimal" autocomplete="off">';
    return '<td><label><span class="sr-only">Schritt ' + (index + 1) + ': ' + FIELD_LABELS[name] + '</span>' + control + '</label></td>';
  }).join('');
}
function setupEpoch() {
  const body = document.querySelector('#epoch-body');
  epoch.forEach((entry,index) => { const row = document.createElement('tr'); row.dataset.row = index; const before = entry.before; row.innerHTML = '<th scope="row">' + (index + 1) + '</th><td>' + entry.row.x1 + '</td><td>' + entry.row.x2 + '</td><td>' + entry.row.target + '</td><td>' + before.w1 + '</td><td>' + before.w2 + '</td><td>' + before.threshold + '</td>' + entryFields(index) + '<td><button type="button" class="secondary-button check-row">Zeile prüfen</button></td>'; body.append(row); });
  body.querySelectorAll('tr').forEach((row,index) => { row.querySelectorAll('input,select,button').forEach((el) => { el.disabled = index > 0; }); row.querySelector('.check-row').addEventListener('click', () => checkEpochRow(index)); });
  for (let index = 0; state.epoch?.[index] === true; index++) unlockEpoch(index, true);
}
function checkEpochRow(index) {
  const row = document.querySelector('#epoch-body tr[data-row="' + index + '"]'); const entry = epoch[index]; const expect = {sum:entry.sum,output:String(entry.output),delta:entry.delta,w1:entry.w1,w2:entry.w2,threshold:entry.threshold}; let correct = 0; let first = '';
  Object.entries(expect).forEach(([field,value]) => { const input = row.querySelector('[data-field=' + field + ']'); const valid = typeof value === 'number' ? numberMatches(input.value,value) : input.value === value; input.classList.toggle('is-correct',valid); input.classList.toggle('is-wrong',!valid); if (valid) correct++; else if (!first) first = field; });
  if (correct === 6) { unlockEpoch(index); feedback('epoch-feedback','success',index === epoch.length - 1 ? 'Korrekt. Nach vier Schritten gilt w₁ = −3, w₂ = 4 und θ = 1. Alle vier Trainingsdaten werden richtig klassifiziert; die Gerade lautet −3x₁ + 4x₂ = 1.' : 'Korrekt. Trainingsschritt ' + (index + 1) + ' stimmt; die nächste Zeile ist jetzt freigeschaltet.'); }
  else if (correct) fieldFeedback('epoch-feedback','partial',correct + ' von 6 Feldern stimmen. Prüfe zuerst',first);
  else feedback('epoch-feedback','error','Noch nicht korrekt. Berechne erst a, dann f(a) und δ.');
}
function unlockEpoch(index, restoring = false) {
  state.epoch ||= []; state.epoch[index] = true; saveState();
  const row = document.querySelector('#epoch-body tr[data-row="' + index + '"]');
  if (restoring && row) { const entry = epoch[index]; const expected = {sum:entry.sum,output:String(entry.output),delta:entry.delta,w1:entry.w1,w2:entry.w2,threshold:entry.threshold}; Object.entries(expected).forEach(([field, value]) => { row.querySelector('[data-field=' + field + ']').value = value; }); }
  row?.querySelectorAll('input,select').forEach((el) => { el.disabled = true; }); row?.querySelector('.check-row')?.setAttribute('aria-label', 'Trainingsschritt ' + (index + 1) + ' ist bereits korrekt');
  document.querySelector('#epoch-body tr[data-row="' + (index + 1) + '"]')?.querySelectorAll('input,select,button').forEach((el) => { el.disabled = false; });
}
function setupSemantic() {
  const textarea = document.querySelector('#learning-answer'); const counter = document.querySelector('#learning-counter'); const update = () => { counter.textContent = textarea.value.length + ' von 600 Zeichen'; }; textarea.addEventListener('input',update); update();
  document.querySelector('#check-learning-answer').addEventListener('click',async() => { const answer = textarea.value.trim(); if (answer.length < 30) { feedback('learning-feedback','error','Bitte formuliere eine etwas ausführlichere Antwort, damit sie sinnvoll ausgewertet werden kann.'); textarea.focus(); return; } const button = document.querySelector('#check-learning-answer'); button.disabled = true; feedback('learning-feedback','', 'Deine Antwort wird mit dem Erwartungshorizont verglichen.'); try { const result = await evaluateSemanticAnswer({serverUrl:SERVER_URL,taskId:'11-5-1',answer}); const kind = result.points >= 3 ? 'success' : result.points ? 'partial' : 'error'; feedback('learning-feedback',kind,result.points + ' von ' + result.maxPoints + ' Punkten – ' + result.status + '. ' + (result.feedback || '').trim()); } catch (error) { feedback('learning-feedback','error',error.message); } finally { button.disabled = false; } });
}
function setupSimulator() { document.querySelector('#check-simulator').addEventListener('click',() => { const result = checkFields(document.querySelector('#simulator-form'),{endW1:-3,endW2:4,theta:1,steps:4,correctPoints:4,percent:100,lineW1:-3,lineW2:4,line:1}); if (result.correct === result.total) feedback('simulator-feedback','success','Korrekt. Nach vier Schritten sind alle vier Trainingspunkte richtig klassifiziert; die Gerade lautet −3x₁ + 4x₂ = 1.'); else if (result.correct) fieldFeedback('simulator-feedback','partial',result.correct + ' von ' + result.total + ' Einträgen stimmen. Prüfe zuerst',result.wrong[0]); else feedback('simulator-feedback','error','Noch nicht korrekt. Prüfe Startwerte, Lernrate 1 und „Iterationen: 1“.'); }); }
function setupFast() { document.querySelector('#check-fast').addEventListener('click',() => { const result = checkFields(document.querySelector('#fast-form'),{w1:-1,w2:.5,theta:1.5}); feedback('fast-feedback',result.correct === result.total ? 'success' : result.correct ? 'partial' : 'error',result.correct === result.total ? 'Korrekt. Bei α = 0,5 fallen die Parameteränderungen halb so groß aus wie bei α = 1.' : result.correct ? result.correct + ' von 3 Parametern stimmen. Prüfe das Minuszeichen in der Schwellenwertregel.' : 'Noch nicht korrekt. Multipliziere jede Änderung zuerst mit α = 0,5.'); }); }
function setupLimits() { document.querySelector('#check-limits').addEventListener('click',() => { const answers = selectedValues(document.querySelector('#limits-options')); if (sameSet(answers,['line','single','continue'])) feedback('limits-feedback','success','Korrekt. Die Daten sind nicht linear separierbar; ein einzelnes Perzeptron kann sie nicht fehlerfrei trennen.'); else if (answers.some((value) => ['line','single','continue'].includes(value))) feedback('limits-feedback','partial','Teilweise korrekt. Prüfe, ob eine Gerade diagonal liegende gleiche Labels gemeinsam abtrennen kann.'); else feedback('limits-feedback','error','Noch nicht korrekt. Zeichne probeweise eine Gerade und kontrolliere alle vier Punkte.'); }); }
function setupQuiz() {
  const root = document.querySelector('#quiz-questions');
  QUIZ.forEach((entry) => { const box = document.createElement('fieldset'); box.className = 'quiz-question'; box.innerHTML = '<legend>' + entry.q + '</legend>' + entry.options.map((option) => '<label><input type="checkbox" value="' + option.id + '" data-correct="' + option.correct + '"> ' + option.text + '</label>').join('') + '<div class="feedback" role="status" aria-live="polite" hidden></div>'; root.append(box); });
  document.querySelector('#quiz-form').addEventListener('submit',(event) => {
    event.preventDefault(); let complete = 0; const summary = [];
    [...root.children].forEach((box,index) => { const selected = selectedValues(box); const expected = QUIZ[index].options.filter((option) => option.correct).map((option) => option.id); const correct = sameSet(selected,expected); if (correct) complete++; const result = box.querySelector('.feedback'); result.hidden = false; result.className = 'feedback ' + (correct ? 'success' : 'partial'); result.textContent = correct ? '✓ Richtig. Alle passenden Aussagen sind markiert.' : 'Noch nicht vollständig. Prüfe besonders die Begriffe aus Frage ' + (index + 1) + '.'; const answers = QUIZ[index].options.filter((option) => option.correct).map((option) => option.text); summary.push('<li><strong>' + QUIZ[index].q + '</strong><br>Richtig: ' + answers.join(' · ') + '</li>'); });
    document.querySelector('#quiz-progress').textContent = complete + ' von 6 Fragen vollständig richtig'; feedback('quiz-feedback',complete === 6 ? 'success' : 'partial',complete === 6 ? 'Alle sechs Fragen sind vollständig richtig beantwortet.' : complete + ' von 6 Fragen sind vollständig richtig. Verbessere die markierten Fragen und prüfe erneut.');
    const overview = document.querySelector('#quiz-summary'); overview.hidden = complete !== 6; if (complete === 6) overview.innerHTML = '<h3>Quizübersicht</h3><ul>' + summary.join('') + '</ul>';
  });
}
function setupReset() { document.querySelector('#reset-progress').addEventListener('click',() => { if (!confirm('Bearbeitungsstand wirklich zurücksetzen?')) return; try { localStorage.removeItem(STORAGE_KEY); } catch {} location.reload(); }); }

setupTabs(); setupDiscovery(); setupStructure(); setupDecision(); setupEpoch(); setupSemantic(); setupSimulator(); setupFast(); setupLimits(); setupQuiz(); setupReset();
