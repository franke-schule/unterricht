import { setupPhysicsStepTabs } from './components/physics-step-tabs.mjs';
import { createPhysicsTaskProgress } from './components/physics-task-progress.mjs';
import { appendPhysicsText } from './components/physics-notation.mjs?v=20261022-force-indices';
import { enableTokenDrag, wasDragged } from './components/token-drag.mjs';
import { setupStepOrder } from './components/step-order.mjs';
import { setupPhysicsSemanticTask } from './components/physics-semantic-task.mjs?v=20261109-a1-freitext';
import { G, INITIAL, MIN_DISTANCE, MAX_DISTANCE, distance, force, validState, setDistance, moveBody, checkQuantity, parseQuantity } from './gravitation-model.mjs?v=20261109-malzeichen';

// Lehrercode-Freigabe nach dem bestehenden Muster aus kettenkarussell.mjs.
function unlockSolution(event, expectedCode, downloadLinkId, messageId) {
  event.preventDefault();
  const form = event.currentTarget;
  const enteredCode = form.elements['solution-code'].value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  const normalizedExpectedCode = expectedCode.replace(/[^A-Z0-9]/g, '');
  const downloadLink = document.getElementById(downloadLinkId);
  const message = document.getElementById(messageId);
  if (enteredCode === normalizedExpectedCode) {
    downloadLink.hidden = false;
    message.className = 'solution-code-message';
    message.textContent = 'Code korrekt. Das Lösungsblatt ist freigeschaltet.';
    return;
  }
  downloadLink.hidden = true;
  message.className = 'solution-code-message error';
  message.textContent = 'Der eingegebene Code ist nicht gültig.';
}
if (typeof document !== 'undefined') window.unlockSolution = unlockSolution;

const $ = id => document.getElementById(id);
const unitFraction = '<span class="physics-fraction"><span class="physics-fraction__numerator">N·m²</span><span class="physics-fraction__denominator">kg²</span></span>';
const feedbackWords = {
  precision: 'Dein Rechenwert ist grundsätzlich passend. Runde das Endergebnis noch auf die geforderte Anzahl gültiger Ziffern.',
  wrong: 'Prüfe deinen Zahlenwert, die Einheit und die Anzahl der gültigen Ziffern.'
};
const completed = new Set();
let s1Checked = false;
const numericCards = new Map();
const wordBoards = new Map();
const a1Review = { version: '20261109-a1-rubric-v1', passed: false, answer: '' };
const separateChoiceFeedback = {
  M3:{success:'Richtig. Die Simulation verwendet G bereits; sie bestimmt die Naturkonstante nicht unabhängig.',error:'Noch nicht korrekt. Der Kraftwert wird mit einem hinterlegten G berechnet.'},
  M4:{success:'Richtig. Der gewählte Ansatz löst das Gravitationsgesetz nach G auf.',error:'Noch nicht korrekt. Stelle das Gravitationsgesetz nach G um.'},
  A3:{success:'Richtig. Die Oberflächenfallbeschleunigung ist auf dem Mond ungefähr ein Sechstel so groß wie auf der Erde.',error:'Noch nicht korrekt. Vergleiche deinen berechneten Mondwert mit dem Erdwert.'}
};
const numericFeedback = {
  M3:{success:'Richtig. Wert und Einheit passen.',partial:'Teilweise korrekt. Prüfe Umrechnung, Einheit oder drei gültige Ziffern.'},
  A3:{success:'Richtig. Auf dem Mond beträgt g etwa 1,626 m/s².',partial:'Teilweise korrekt. Prüfe die vier gültigen Ziffern.'}
};
let progress;
let quizChecks;
let simulation = { ...INITIAL };

function feedback(id, level, message) {
  const node = $(id); node.hidden = false;
  node.className = `physics-feedback ${level}`;
  node.replaceChildren();
  appendPhysicsText(node, notationTokens(message));
}
function appendApplicationMathText(target, text) {
  const quotientToken = /\{\{([^{}|]+)\|([^{}]+)\}\}/g;
  let lastEnd = 0;
  let match;
  while ((match = quotientToken.exec(text))) {
    appendApplicationMathText(target, text.slice(lastEnd, match.index));
    const fraction = document.createElement('span');
    fraction.className = 'physics-fraction';
    fraction.setAttribute('role', 'img');
    const [whole, numeratorText, denominatorText] = match;
    const accessible = value => value.replace(/([MRg])_(Merkur|Mars|Mond)/g, '$1 mit Index $2').replaceAll('²', ' zum Quadrat');
    fraction.setAttribute('aria-label', `${accessible(numeratorText)} durch ${accessible(denominatorText)}`);
    const numerator = document.createElement('span');
    numerator.className = 'physics-fraction__numerator';
    appendApplicationMathText(numerator, numeratorText);
    const denominator = document.createElement('span');
    denominator.className = 'physics-fraction__denominator';
    appendApplicationMathText(denominator, denominatorText);
    fraction.append(numerator, denominator);
    target.append(fraction);
    lastEnd = match.index + whole.length;
  }
  const rest = text.slice(lastEnd)
    .replace(/(?<!\{)([MRg])_(Merkur|Mars|Mond)(?!\})/g, '{{$1_$2}}')
    .replaceAll('m/s²', '{{m|s²}}');
  appendPhysicsText(target, rest);
}
function finish(id) { completed.add(id); updateSummary(); progress?.save(); }
function notationTokens(value){
  const conversions=[
    ['R<sub>Merkur</sub>/R<sub>Mars</sub>','{{R<sub>Merkur</sub>|R<sub>Mars</sub>}}'],
    ['M<sub>Merkur</sub>/M<sub>Mars</sub>','{{M<sub>Merkur</sub>|M<sub>Mars</sub>}}'],
    ['F·r²/(m₁·m₂)','{{F·r²|m₁·m₂}}'],['F·r²/(M·m)','{{F·r²|M·m}}'],
    ['G·M·m/R²','{{G·M·m|R²}}'],['G·M/R²','{{G·M|R²}}'],['G·M/g','{{G·M|g}}'],
    ['N·m²/kg²','{{N·m²|kg²}}'],['m³/(kg·s²)','{{m³|kg·s²}}'],
    ['cm/s²','{{cm|s²}}'],['m/s²','{{m|s²}}'],
    ['F/m₁','{{F|m₁}}'],['F/m₂','{{F|m₂}}'],['F/m','{{F|m}}'],['F/r','{{F|r}}'],
    ['F/4','{{F|4}}'],['F/9','{{F|9}}'],['1/r²','{{1|r²}}']
  ];
  let text=String(value);for(const [from,to] of conversions)text=text.replaceAll(from,to);
  return text;
}
function htmlText(template) {
  return notationTokens(template).replaceAll('{{UNIT_G}}', unitFraction).replace(/\{\{([^|{}]+)\|([^{}]+)\}\}/g,
    (_,numerator,denominator)=>`<span class="physics-fraction" role="img" aria-label="${numerator.replace(/<[^>]*>/g,'')} durch ${denominator.replace(/<[^>]*>/g,'')}"><span class="physics-fraction__numerator">${numerator}</span><span class="physics-fraction__denominator">${denominator}</span></span>`);
}
function card(host, id, title, prompt, helps) {
  const el = document.createElement('article');
  el.id = `card-${id.toLowerCase()}`;
  el.className = 'physics-task-card';
  el.innerHTML = `<h3>${title}</h3><p class="task-prompt">${htmlText(prompt)}</p><div class="task-fields"></div><button id="check-${id.toLowerCase()}" type="button" class="physics-primary-button">${id} prüfen</button><p id="feedback-${id.toLowerCase()}" class="physics-feedback" role="status" aria-live="polite" hidden></p><div class="physics-help-stack">${helps.map((h,i)=>`<details><summary>Hilfe ${i+1}</summary><p>${htmlText(h)}</p></details>`).join('')}</div>`;
  $(host).append(el);
  return el.querySelector('.task-fields');
}
function addSelect(host, id, label, choices) {
  const wrap = document.createElement('label');
  wrap.className = 'grav-choice';
  wrap.setAttribute('for', id);
  wrap.innerHTML = `${htmlText(label)}<select id="${id}"><option value="">Bitte wählen</option>${choices.map(([value,text])=>`<option value="${value}">${text}</option>`).join('')}</select>`;
  host.append(wrap);
  return wrap;
}
function addStatementChoices(host, id, label, choices) {
  // Keep the original field ID so saved dropdown answers remain compatible.
  const value = document.createElement('input');
  value.type = 'hidden'; value.id = id;
  const group = document.createElement('fieldset');
  group.className = 'force-kind-picker grav-statement-choices';
  const legend = document.createElement('legend');
  legend.textContent = `${label} auswählen`;
  group.append(legend);
  const radios = choices.map(([key,text]) => {
    const option = document.createElement('label');
    option.className = 'force-kind-option';
    const radio = document.createElement('input');
    radio.type = 'radio'; radio.name = id; radio.id = `${id}-${key}`; radio.value = key;
    const statement = document.createElement('span');
    statement.innerHTML = `<strong>${key.toUpperCase()}</strong> · ${htmlText(text)}`;
    radio.addEventListener('change', () => { if (radio.checked) value.value = key; });
    option.append(radio,statement); group.append(option);
    return radio;
  });
  value.addEventListener('input', () => {
    radios.forEach(radio => { radio.checked = radio.value === value.value; });
  });
  host.append(value,group);
}
function setupStructured({host,id,title,prompt,fields,answers,helps,messages,after,statementChoices=false}) {
  if (/^(?:P[1-4]|S2|M0|M2)$/.test(id)) return setupWordCards({host,id,title,prompt,fields,answers,helps,messages,after});
  const area = card(host,id,title,prompt,helps);
  fields.forEach(([suffix,label,choices]) => (statementChoices ? addStatementChoices : addSelect)(area,`${id.toLowerCase()}-${suffix}`,label,choices));
  $(`check-${id.toLowerCase()}`).addEventListener('click',()=>{
    const actual = fields.map(([suffix])=> $(`${id.toLowerCase()}-${suffix}`).value);
    const hits = actual.filter((v,i)=>v===answers[i]).length;
    const level = hits===answers.length?'success':hits?'partial':'error';
    if(id==='M2'&&level==='success'&&!allM2Observations()){
      feedback('feedback-m2','partial','Halte zuerst alle drei Vergleichsmessungen in der Simulation fest.');
      return;
    }
    feedback(`feedback-${id.toLowerCase()}`,level,messages[level]);
    if(level==='success'){finish(id);after?.();}
  });
}
function setupWordCards({host,id,title,prompt,fields,answers,helps,messages,after,reuseArea,checkButtonId,feedbackId,onCheck}) {
  const area = reuseArea || card(host,id,title,prompt,helps);
  const cardRoot = area.closest('.physics-task-card');
  const bank = document.createElement('div');
  bank.className = 'cloze-term-bank grav-word-bank';
  bank.setAttribute('role','group');
  bank.setAttribute('aria-label',`${id}: Wortspeicher`);
  const values = fields.map(()=>'');
  const instances = fields.map(()=>'');
  const cards = id==='M0'
    ? ['mass1','mass2','range'].flatMap(suffix=>[['up','größer'],['down','kleiner']].map(([value,label])=>({key:`m0-${suffix}-${value}`,value,label})))
    : [...new Map(fields.flatMap(([, ,choices])=>choices).map(([key,label])=>[key,label])).entries()].map(([key,label])=>({key,value:key,label}));
  const byKey = new Map(cards.map(item=>[item.key,item]));
  const controls = fields.map(([suffix])=>{
    const input = document.createElement('input');
    input.type = 'hidden'; input.id = `${id.toLowerCase()}-${suffix}`;
    area.append(input);
    return input;
  });
  const targets = [];
  let picked = null;
  const selector = `#${cardRoot.id} [data-word-slot]`;
  const bankSelector = `#${cardRoot.id} .grav-word-bank`;
  function setValues(next) {
    const used=new Set();
    next.forEach((candidate,index)=>{
      let item=byKey.get(candidate);
      if(!item)item=cards.find(card=>card.value===candidate&&!used.has(card.key));
      instances[index]=item&&!used.has(item.key)?item.key:'';
      if(instances[index])used.add(instances[index]);
      values[index]=instances[index]?byKey.get(instances[index]).value:'';
      controls[index].value=values[index];
    });
    render();
  }
  function move(key,to) {
    if(!byKey.has(key)) return;
    const from=instances.indexOf(key), prior=to>=0?instances[to]:'';
    if(from===to) { picked=null;render();return; }
    if(from>=0) instances[from]='';
    if(to>=0) instances[to]=key;
    if(prior&&prior!==key&&from>=0) instances[from]=prior;
    picked=null;
    controls.forEach((control,index)=>{values[index]=instances[index]?byKey.get(instances[index]).value:'';control.value=values[index];});
    (controls[to>=0?to:Math.max(0,from)]).dispatchEvent(new Event('input',{bubbles:true}));
    render();progress?.save();
  }
  function token(key,index) {
    const button=document.createElement('button');button.type='button';
    button.className=index>=0?'cloze-gap is-filled':'cloze-token';
    button.dataset.wordKey=key;
    button.innerHTML=htmlText(byKey.get(key).label);
    if(id==='M4')button.innerHTML+=` <span aria-hidden="true">(G = ${htmlText(key==='yes'?'{{F·r²|M·m}}':'{{F·M·m|r²}}')})</span>`;
    button.setAttribute('aria-pressed',String(picked===key));
    button.classList.toggle('is-picked',picked===key);
    if(index>=0) button.setAttribute('aria-label',`${fields[index][1]}: ${byKey.get(key).label}`);
    enableTokenDrag(button,{getLabel:()=>byKey.get(key).label,dropSelector:selector,bankSelector,
      onDrop:(slot,onBank)=>{if(slot)move(key,Number(slot.dataset.wordSlot));else if(onBank)move(key,-1);else render();}});
    button.addEventListener('click',event=>{
      event.stopPropagation();if(wasDragged(button))return;
      if(picked&&picked!==key&&index>=0){move(picked,index);return;}
      if(picked===key){if(index>=0)move(key,-1);else {picked=null;render();}return;}
      picked=key;render();
      if(index<0)(targets.find((target,i)=>!instances[i])?.querySelector('button')||bank.querySelector(`[data-word-key="${key}"]`))?.focus();
      else targets[index].querySelector('button')?.focus();
    });
    return button;
  }
  function render(){
    bank.replaceChildren(...cards.filter(({key})=>!instances.includes(key)).map(({key})=>token(key,-1)));
    targets.forEach((target,index)=>{
      target.replaceChildren();
      const key=instances[index];
      if(key)target.append(token(key,index));
      else {
        const empty=document.createElement('button');empty.type='button';empty.className='cloze-gap';
        empty.textContent='□';empty.setAttribute('aria-label',`${fields[index][1]}: leer`);
        empty.addEventListener('click',()=>{if(picked)move(picked,index);});
        target.append(empty);
      }
      target.classList.toggle('is-drop-target',false);
    });
  }
  bank.addEventListener('click',()=>{if(picked)move(picked,-1);});
  if(id==='P1'||id==='P3'){
    const line=cardRoot.querySelector('.task-prompt');
    const parts=prompt.split('______');line.replaceChildren();
    parts.forEach((part,index)=>{
      if(index) {const slot=document.createElement('span');slot.className='grav-word-target';slot.dataset.wordSlot=String(index-1);targets.push(slot);line.append(slot);}
      const fragment=document.createElement('span');fragment.innerHTML=htmlText(part);line.append(fragment);
    });
    area.append(bank);
  }else{
    area.append(bank);
    const rows=document.createElement('div');rows.className='grav-word-rows';area.append(rows);
    fields.forEach(([,label],index)=>{
      const row=document.createElement('div');row.className='grav-word-row';
      const caption=document.createElement('strong');caption.innerHTML=htmlText(label);
      const slot=document.createElement('span');slot.className='grav-word-target';slot.dataset.wordSlot=String(index);
      targets.push(slot);row.append(caption,slot);rows.append(row);
    });
  }
  cardRoot.querySelector(`#${checkButtonId||`check-${id.toLowerCase()}`}`).addEventListener('click',()=>{
    const hits=values.filter((value,index)=>value===answers[index]).length;
    const level=hits===answers.length?'success':hits?'partial':'error';
    feedback(feedbackId||`feedback-${id.toLowerCase()}`,level,messages[level]);
    if(onCheck)onCheck(level);
    else if(level==='success'){
      if(id==='M2'&&!allM2Observations()){feedback('feedback-m2','partial','Halte zuerst alle drei Vergleichsmessungen in der Simulation fest.');return;}
      finish(id);after?.();
    }
  });
  wordBoards.set(id,{fields,answers,values,instances,setValues,controls,cardLabels:new Map(cards.map(item=>[item.key,item.label]))});
  render();
}
const yesNo = (correct, wrong) => [['yes',correct],['no',wrong]];
const greater = [['up','größer'],['down','kleiner']];

function buildSources() {
  setupStructured({host:'tasks-newton',id:'N1',statementChoices:true,title:'N1 · Newtons Verbindung',prompt:'<strong>Wähle</strong> die Aussage, die Newtons Verbindung zur bekannten Kreisbewegung trifft.',fields:[['choice','Aussage',[['a','Für den Mond gelten völlig andere Bewegungsgesetze als für Körper auf der Erde.'],['b','Die Anziehung durch die Erde kann für den Mond die benötigte Zentripetalkraft sein.'],['c','Zentripetalkraft und Erdanziehung sind immer zwei zusätzlich zu addierende Kräfte.']]]],answers:['b'],helps:['Denke an die Richtung der Kraft, die eine Kreisbahn ermöglicht.','Für eine Kreisbahn braucht der Mond eine Kraft zur Erde hin.','Die Erdanziehung zeigt zum Erdmittelpunkt und kann beim Mond die Rolle der Zentripetalkraft übernehmen.'],messages:{success:'Richtig. Die gravitative Anziehung kann den Mond zur Erde hin umlenken.',partial:'Teilweise korrekt. Du hast die Richtung erkannt; prüfe noch, ob dafür zwei Kräfte addiert werden.',error:'Noch nicht korrekt. Die Zentripetalkraft ist eine Rolle einer wirkenden Kraft; die Erdanziehung kann diese Rolle übernehmen.'}});
  function source(reference,quote){
    const block=document.createElement('blockquote');block.className='grav-source-quote';
    const cite=document.createElement('cite');cite.textContent=reference;
    const text=document.createElement('p');text.textContent=quote;
    block.append(cite,text);$('tasks-principia').append(block);
  }
  source('§ 7','„Bis jetzt haben wir jene Kraft, welche die Himmelskörper in ihren Bahnen erhält, Centripetalkraft genannt. Dass sie mit der Schwere identisch sei, ist ausgemacht, und wir wollen sie daher künftig Schwere nennen.“');
  setupStructured({host:'tasks-principia',id:'P1',title:'P1 · § 7',prompt:'<strong>Ergänze</strong> zu § 7: Bei der Mondbahn ist die ______ die Kraft, die als ______ wirkt.',fields:[['first','Erste Lücke',[['gravity','gravitative Anziehung'],['inertia','Trägheit'],['extra','zweite Zusatzkraft']]],['second','Zweite Lücke',[['center','Zentripetalkraft'],['friction','Reibung'],['flight','Fliehkraft']]]],answers:['gravity','center'],helps:['Was hält nach Newton die Himmelskörper in ihren Bahnen?','Die Anziehung lenkt den Mond zur Erde hin.','Die gravitative Anziehung ist hier bereits die Zentripetalkraft; es wird keine zweite Kraft addiert.'],messages:{success:'Richtig. Die Gravitation übernimmt bei der Mondbahn die Rolle der Zentripetalkraft.',partial:'Teilweise korrekt. Eine der beiden Rollen stimmt; prüfe die andere am Wortlaut von § 7.',error:'Noch nicht korrekt. Newton benennt dieselbe zur Bahnmitte wirkende Kraft zunächst anders.'},after:()=>{$('modern-note').hidden=false;}});
  const note=document.createElement('p');note.id='modern-note';note.hidden=true;note.textContent='Mit ‚Schwere‘ meint Newton hier die allgemeine gravitative Anziehung von Körpern mit Masse.';$('card-p1').after(note);
  source('§ 9','„Die Schwere kommt allen Körpern zu, und ist der in jedem enthaltenen Menge der Materie proportional.“');
  setupStructured({host:'tasks-principia',id:'P2',title:'P2 · § 9',prompt:'<strong>Ordne zu</strong>, worauf sich Newtons ‚Schwere‘ bezieht: allgemeine Kraft, beteiligte Massen und Richtung.',fields:[['schwere','Schwere',[['gravity','gravitative Anziehung'],['fall','nur Fallbewegung auf der Erde']]],['materie','Menge der Materie',[['mass','Masse'],['speed','Bahngeschwindigkeit']]],['richtung','zum anderen Körper',[['line','entlang der Verbindung der Schwerpunkte'],['perp','senkrecht zur Verbindung']]]],answers:['gravity','mass','line'],helps:['Lies § 9 und denke an zwei Körper.','‚Menge der Materie‘ ist die historische Umschreibung einer Körpergröße.','Gemeint sind Gravitation, Masse und die Verbindung der Schwerpunkte.'],messages:{success:'Richtig. ‚Schwere‘ bezeichnet hier die Anziehung, deren Stärke von Masse abhängt.',partial:'Teilweise korrekt. Einige Zuordnungen passen; überprüfe Masse und Kraftrichtung getrennt.',error:'Noch nicht korrekt. Newton beschreibt nicht nur das Fallen auf der Erde.'}});
  setupStructured({host:'tasks-principia',id:'P3',title:'P3 · Alle Körper',prompt:'<strong>Ergänze</strong> die Aussage zu § 9: Gravitation wirkt zwischen ______ Körpern mit ______.',fields:[['scope','Erste Lücke',[['all','allen'],['sky','nur himmlischen']]],['property','Zweite Lücke',[['mass','Masse'],['charge','Ladung']]]],answers:['all','mass'],helps:['Achte auf das Wort ‚allen‘ im ersten Satz von § 9.','Planeten sind nur Beispiele; auch Alltagsgegenstände haben die entsprechende Eigenschaft.','Alle Körper mit Masse ziehen einander gravitativ an.'],messages:{success:'Richtig. Die Aussage gilt grundsätzlich für alle Körper mit Masse.',partial:'Teilweise korrekt. Prüfe noch, ob Newton die Wirkung auf Himmelskörper beschränkt.',error:'Noch nicht korrekt. Lies den ersten Satz von § 9 erneut.'}});
  source('§ 9 […]','„dass die Schwere gegen einen von ihnen, welchen man besonders betrachtet, sich umgekehrt wie das Quadrat des Abstandes von seinem Schwerpunkte verhalte […]“');
  setupStructured({host:'tasks-principia',id:'P4',title:'P4 · Mittelpunktabstand',prompt:'<strong>Ordne zu</strong>, wie sich die Kraft bei doppeltem und dreifachem Mittelpunktabstand ändert, wenn die Massen gleich bleiben.',fields:[['double','2r',[['quarter','ein Viertel der Kraft'],['twice','2F'],['half','die Hälfte der Kraft']]],['triple','3r',[['ninth','ein Neuntel der Kraft'],['three','3F'],['third','ein Drittel der Kraft']]]],answers:['quarter','ninth'],helps:['Im Text steht ‚umgekehrt wie das Quadrat‘.','Beim doppelten Abstand steht im Nenner 2².','Für 2r folgt ein Viertel, für 3r ein Neuntel der Kraft.'],messages:{success:'Richtig. Der Abstand geht quadratisch in den Nenner ein.',partial:'Teilweise korrekt. Eine Zuordnung stimmt; quadriere auch den anderen Abstandsfaktor.',error:'Noch nicht korrekt. Verdopple oder verdreifache zuerst r und quadriere dann diesen Faktor.'}});
}

function buildSimulationTasks(){
  const s1=card('tasks-simulation','S1','S1 · Kräftebild','<strong>Betrachte</strong> die beiden Kraftpfeile bei unterschiedlichen Massen. <strong>Wähle</strong> alle richtigen Aussagen aus.',[
    'Lies an jedem Pfeil ab, auf welchen Körper die Kraft wirkt.',
    'Die Ziffer an F bezeichnet hier die Masse, die die Kraft verursacht. Vergleiche die beiden Zahlenwerte.',
    'Masse 2 zieht Masse 1 an; Masse 1 zieht Masse 2 an. Die Kräfte haben denselben Betrag und wirken auf verschiedene Körper.'
  ]);
  const options=[
    'Der {{V2}} wirkt auf Masse 1 und zeigt zu Masse 2.',
    'Der {{V1}} wirkt auf Masse 2 und zeigt zu Masse 1.',
    'Beide Pfeile beginnen im Mittelpunkt des Körpers, auf den die jeweilige Kraft wirkt.',
    'Die Kraft auf die größere Masse hat immer den größeren Betrag.',
    'Die beiden Kräfte wirken auf denselben Körper.'
  ];
  const fieldset=document.createElement('fieldset');fieldset.className='physics-quiz-question quiz-question grav-s1-choices';
  fieldset.innerHTML=`<legend>S1 · Kräftebild</legend><div class="quiz-options">${options.map((option,index)=>`<label class="quiz-option"><input id="s1-option-${index+1}" type="checkbox" value="${index+1}"><span>${option.replace('{{V2}}',vectorHtml(2)).replace('{{V1}}',vectorHtml(1))}</span></label>`).join('')}</div>`;
  s1.append(fieldset);
  $('check-s1').addEventListener('click',()=>{
    const selected=[...fieldset.querySelectorAll('input:checked')].map(input=>Number(input.value));
    const hits=selected.filter(value=>value<=3).length;
    const level=hits===3&&selected.length===3?'success':hits?'partial':'error';
    feedback('feedback-s1',level,{
      success:'Richtig. Beide Kräfte greifen an verschiedenen Mittelpunkten an, zeigen aufeinander zu und haben denselben Betrag.',
      partial:'Teilweise korrekt. Prüfe für jeden Pfeil Angriffspunkt und Richtung; vergleiche dann die beiden Kraftbeträge.',
      error:'Noch nicht korrekt. Stelle deutlich unterschiedliche Massen ein und beobachte, von welchem Mittelpunkt jeder Pfeil ausgeht.'
    }[level]);
    s1Checked=level==='success';
    if(level==='success')finish('S1');
    else progress?.save();
  });
  setupStructured({host:'tasks-simulation',id:'S2',title:'S2 · Newtons Axiome',prompt:'<strong>Ordne</strong> Trägheitssatz, Aktionsprinzip und Wechselwirkungsprinzip den drei Aussagen zu. <strong>Wähle</strong> anschließend, warum verschieden schwere Körper bei gleichem Kraftbetrag verschieden stark beschleunigen.',fields:[['inertia','Ohne resultierende Kraft bleibt die geradlinig gleichförmige Bewegung erhalten',[['inertia','Trägheitssatz'],['action','Aktionsprinzip'],['interaction','Wechselwirkungsprinzip']]],['action','Bei gleicher Kraft ist die Beschleunigung eines größeren Körpers kleiner',[['inertia','Trägheitssatz'],['action','Aktionsprinzip'],['interaction','Wechselwirkungsprinzip']]],['interaction','Beide Körper üben gleich große, entgegengesetzte Kräfte aufeinander aus',[['inertia','Trägheitssatz'],['action','Aktionsprinzip'],['interaction','Wechselwirkungsprinzip']]],['acceleration','Folgerung',[['ratio','Beschleunigung ist Kraft geteilt durch Masse; bei größerer Masse ist a kleiner'],['force','größerer Körper erfährt größere Kraft'],['equal','beide Beschleunigungen sind gleich']]]],answers:['inertia','action','interaction','ratio'],helps:['Vergleiche Kraftbetrag und Bewegung getrennt.','Das dritte Axiom betrifft zwei Kräfte auf zwei verschiedenen Körpern; das zweite verknüpft Kraft und Beschleunigung eines Körpers.','Gleiche Gegenkräfte bedeuten wegen a={{F|m}} bei ungleichen Massen nicht gleiche Beschleunigungen.'],messages:{success:'Richtig. Gleiche Gegenkräfte können unterschiedliche Beschleunigungen verursachen.',partial:'Teilweise korrekt. Die Axiome oder die Folgerung aus a=F/m sind noch nicht vollständig zugeordnet.',error:'Noch nicht korrekt. Verwechsle Kraft auf einen Körper nicht mit dessen Beschleunigung.'}});
}
function vectorHtml(index){
  const name=index===2?'Vektor F mit Index 2, Kraft auf Masse 1 durch Masse 2':'Vektor F mit Index 1, Kraft auf Masse 2 durch Masse 1';
  return `<span class="grav-vector-symbol" role="img" aria-label="${name}"><span aria-hidden="true">F<sub>${index}</sub></span></span>`;
}

const rows = {
  A:{label:'Reihe A · m₁ ändern',vary:'m1',values:[3.5,4,4.5,5],fixed:'m₂ = 4,5 t; r = 7,0 m',forces:[21.45,24.52,27.58,30.65]},
  B:{label:'Reihe B · m₂ ändern',vary:'m2',values:[3.5,4,4.5,5],fixed:'m₁ = 5,0 t; r = 7,0 m',forces:[23.84,27.24,30.65,34.05]},
  C:{label:'Reihe C · r ändern',vary:'r',values:[5.5,6,7,7.5],fixed:'m₁ = m₂ = 3,0 t',forces:[19.86,16.69,12.26,10.68]}
};
const m2Cases=[
  {id:'reference',label:'Referenzmessung',button:'Referenzmessung festhalten',m1:2,m2:3,r:4},
  {id:'masses',label:'Doppelte Massen',button:'Doppelte Massen festhalten',m1:4,m2:6,r:4},
  {id:'distance',label:'Doppelter Abstand',button:'Doppelten Abstand festhalten',m1:2,m2:3,r:8}
];
const m2Observations={};
function validM2Observation(item,record){
  if(!record||typeof record!=='object')return false;
  const expected=force({...INITIAL,m1:item.m1,m2:item.m2,x1:0,y1:0,x2:item.r,y2:0});
  return record.m1===item.m1&&record.m2===item.m2&&record.r===item.r
    &&Number.isFinite(record.force)&&Math.abs(record.force-expected)<=Math.max(1e-18,expected*1e-12);
}
function allM2Observations(){return m2Cases.every(item=>validM2Observation(item,m2Observations[item.id]));}
function m2SelectionsCorrect(){return $('m2-a').value==='m1'&&$('m2-b').value==='m2'&&$('m2-c').value==='r'&&$('m2-prediction').value==='right';}
function renderM2Observations(){
  m2Cases.forEach(item=>{
    const record=m2Observations[item.id],cell=$(`m2-force-${item.id}`);
    cell.textContent=validM2Observation(item,record)?`${(record.force*1e6).toFixed(2).replace('.',',')} µN`:'—';
  });
}
function setupM2Observations(){
  const block=document.createElement('div');block.id='m2-observations';
  block.innerHTML=`<p id="m2-observation-instruction"><strong>Prüfe</strong> deine Vorhersagen in der Simulation: Halte zuerst die Referenzmessung fest und verändere anschließend nur die jeweils genannten Größen.</p><div class="grav-table-scroll"><table><thead><tr><th scope="col">Messung</th><th scope="col">m₁ in t</th><th scope="col">m₂ in t</th><th scope="col">r in m</th><th scope="col">beobachtetes F</th><th scope="col">Festhalten</th></tr></thead><tbody>${m2Cases.map(item=>`<tr id="m2-observation-${item.id}"><th scope="row">${item.label}</th><td>${item.m1.toFixed(1).replace('.',',')}</td><td>${item.m2.toFixed(1).replace('.',',')}</td><td>${item.r.toFixed(1).replace('.',',')}</td><td id="m2-force-${item.id}">—</td><td><button id="m2-record-${item.id}" type="button" class="grav-transfer">${item.button}</button></td></tr>`).join('')}</tbody></table></div><p id="m2-record-feedback" class="physics-feedback" role="status" aria-live="polite" hidden></p>`;
  $('card-m2').querySelector('.task-fields').before(block);
  m2Cases.forEach(item=>{$(`m2-record-${item.id}`).addEventListener('click',()=>{
    const matches=Math.abs(simulation.m1-item.m1)<1e-8&&Math.abs(simulation.m2-item.m2)<1e-8&&Math.abs(distance(simulation)-item.r)<1e-8;
    if(!matches){feedback('m2-record-feedback','error','Stelle die für diese Messung genannten Massen und den Mittelpunktabstand ein.');return;}
    m2Observations[item.id]={m1:simulation.m1,m2:simulation.m2,r:distance(simulation),force:force(simulation)};
    renderM2Observations();$('m2-record-feedback').hidden=true;progress?.save();
  });});
}
function buildMeasurement(key){
  const data=rows[key],id=`M1${key}`;
  const area=card('tasks-law-start',id,data.label,'<strong>Stelle</strong> jede Vorgabe in der Simulation ein und <strong>übernimm</strong> den Kraftwert in die Tabelle. <strong>Prüfe</strong> danach jede Reihe einzeln.',[
    'Achte darauf, dass die beiden festgelegten Größen während der ganzen Reihe unverändert bleiben.',
    'Nutze Regler oder Abstandsfeld für genau die vorgegebene Zeile und lies F in µN ab.',
    'In Reihe A variierst du nur m₁, in B nur m₂, in C nur den Mittelpunktabstand r.'
  ]);
  const table=document.createElement('div');table.className='grav-table-scroll';
  table.innerHTML=`<p>${data.fixed}</p><table><thead><tr><th scope="col">Vorgabe ${data.vary==='r'?'r in m':data.vary==='m1'?'m₁ in t':'m₂ in t'}</th><th scope="col">F in µN</th><th scope="col">Messwert</th></tr></thead><tbody>${data.values.map((v,i)=>`<tr><th scope="row">${v.toFixed(1).replace('.',',')}</th><td><input id="measure-${key.toLowerCase()}-${i}" type="text" inputmode="decimal" aria-label="Reihe ${key}, Zeile ${i+1}: Kraft in Mikronewton"></td><td><button type="button" class="grav-transfer" data-row="${key}" data-index="${i}">Messwert übernehmen</button></td></tr>`).join('')}</tbody></table><p id="transfer-${key.toLowerCase()}" class="physics-feedback" role="status" aria-live="polite" hidden></p>`;
  area.append(table);
  $(`check-${id.toLowerCase()}`).textContent=`Reihe ${key} prüfen`;
  $(`check-${id.toLowerCase()}`).addEventListener('click',()=>{
    const hits=data.forces.reduce((n,v,i)=>{
      const entered=parseQuantity($(`measure-${key.toLowerCase()}-${i}`).value)?.value;
      const ok=Number.isFinite(entered)&&Math.abs(entered-v)<=0.011;
      $(`measure-${key.toLowerCase()}-${i}`).setAttribute('aria-invalid',String(!ok));
      return n+Number(ok);
    },0);
    const level=hits===4?'success':hits?'partial':'error';
    feedback(`feedback-${id.toLowerCase()}`,level,{
      success:'Richtig. Die vier Kraftwerte passen zu deinen Einstellungen.',
      partial:'Teilweise korrekt. Einige Werte stimmen; prüfe die markierten Zeilen und die konstant gehaltenen Größen.',
      error:'Noch nicht korrekt. Stelle die erste Zeile erneut ein und lies die Kraft in µN ab; übernimm keine alten Quelltabellenwerte.'
    }[level]);
    if(level==='success'){finish(id);updateLawUnlock();}
  });
}
function lawStepUnlock(){
  ['A','B','C'].forEach(key=>{$(`card-m1${key.toLowerCase()}`).hidden=!completed.has('M0');});
  const measured=['M1A','M1B','M1C'].every(x=>completed.has(x));
  $('law-after-measure').hidden=!measured;
  requestAnimationFrame(updateSimulation);
  $('law-formula').hidden=!completed.has('M2');
  $('law-after-formula').hidden=!completed.has('M2');
}
const updateLawUnlock=lawStepUnlock;
function buildLaw(){
  setupStructured({host:'tasks-law-start',id:'M0',title:'M0 · Vermutungen',prompt:'<strong>Vervollständige</strong> je einen Je-desto-Satz für m₁, m₂ und r. Halte beim Vergleichen jeweils die beiden anderen Größen konstant.',fields:[['mass1','Je größer m₁, desto … F',greater],['mass2','Je größer m₂, desto … F',greater],['range','Je größer r, desto … F',greater]],answers:['up','up','down'],helps:['Verändere in der Simulation nur eine Größe.','Vergleiche dieselbe Einstellung vor und nach einer Erhöhung.','Mehr Masse verstärkt, mehr Abstand schwächt die Anziehung.'],messages:{success:'Richtig. Beide Massen verstärken die Kraft, größerer Abstand schwächt sie.',partial:'Teilweise korrekt. Prüfe den Satz zum Abstand noch einmal getrennt von den Massen.',error:'Noch nicht korrekt. Ändere immer nur eine Größe und beobachte die Kraftanzeige.'},after:updateLawUnlock});
  ['A','B','C'].forEach(buildMeasurement);
  const locked=document.createElement('div');locked.id='law-after-measure';locked.hidden=true;$('tasks-law-end').append(locked);
  const m2host=document.createElement('div');m2host.id='law-m2-host';locked.append(m2host);
  setupStructured({host:'law-m2-host',id:'M2',title:'M2 · Messreihen auswerten',prompt:'<strong>Vergleiche</strong> F/m₁ in Reihe A, F/m₂ in Reihe B und F·r² in Reihe C. <strong>Ordne</strong> die drei daraus folgenden Proportionalitäten zu.',fields:[['a','Reihe A: F/m₁',[['m1','F∝m₁'],['m2','F∝m₂'],['r','F∝r⁻²']]],['b','Reihe B: F/m₂',[['m1','F∝m₁'],['m2','F∝m₂'],['r','F∝r⁻²']]],['c','Reihe C: F·r²',[['m1','F∝m₁'],['m2','F∝m₂'],['r','F∝r⁻²']]],['prediction','Bei Verdopplung beider Massen und bei Verdopplung von r',[['right','viermal F und ein Viertel F'],['wrong','zweimal F und halb F']]]],answers:['m1','m2','r','right'],helps:['Ein annähernd konstanter Quotient zeigt direkte Proportionalität.','Prüfe beim Abstand das Produkt F·r² statt F/r.','F ist proportional zu m₁ und m₂, aber umgekehrt proportional zu r².'],messages:{success:'Richtig. Die beiden Massen wirken direkt, der Abstand quadratisch invers.',partial:'Teilweise korrekt. Prüfe insbesondere, ob beim Abstand F·r² annähernd konstant bleibt.',error:'Noch nicht korrekt. Vergleiche Quotient und Produkt getrennt; aus Tabellenrundung folgen kleine Abweichungen.'},after:updateLawUnlock});
  setupM2Observations();
  const formula=document.createElement('article');formula.id='law-formula';formula.className='physics-task-card';formula.hidden=true;formula.innerHTML=`<p>Zwei Körper mit den Massen m₁ und m₂ ziehen einander mit gleich großen, entgegengesetzten Kräften an. Für ihren Betrag gilt F<sub>G</sub> = G·<span class="physics-fraction"><span class="physics-fraction__numerator">m₁·m₂</span><span class="physics-fraction__denominator">r²</span></span>; r ist der Abstand ihrer Schwerpunkte. G = 6,67430·10⁻¹¹ ${unitFraction} ist die Gravitationskonstante.</p>`;locked.append(formula);
  const after=document.createElement('div');after.id='law-after-formula';after.hidden=true;locked.append(after);
  setupNumeric({host:'law-after-formula',id:'M3',title:'M3 · G aus der Simulation',prompt:'<strong>Berechne</strong> G aus der Startmessung m₁=3,5 t, m₂=4,5 t, r=7,0 m und <strong>wähle</strong> die passende SI-Einheit. <strong>Erkläre</strong> über die vorgegebene Auswahl, was diese Simulation über G zeigen kann.',numbers:[['g','G',G,3,'G']],choices:[['meaning','Aussage',[['yes','Die Simulation verwendet G bereits und kann den Wert nur nachvollziehbar machen'],['no','Die Simulation bestimmt G unabhängig']],'yes']],helps:['Stelle das Gesetz nach G um.','Setze F in N, beide Massen in kg und r in m ein.','G=F·r²/(m₁·m₂); 21,45 µN sind 21,45·10⁻⁶ N.'],messages:{success:'Richtig. Wert und Einheit passen; der simulierte Wert ist keine unabhängige Messung.',partial:'Teilweise korrekt. Prüfe Umrechnung, Einheit, drei gültige Ziffern oder die Aussage zur Simulation.',error:'Noch nicht korrekt. Rechne zuerst t in kg und µN in N um.'}});
  setupNumeric({host:'law-after-formula',id:'M4',title:'M4 · Cavendish',prompt:'<strong>Berechne</strong> aus M=158 kg, m=0,73 kg, r=211 mm und F=0,175 µN einen Wert für G. <strong>Gib</strong> das Endergebnis mit zwei gültigen Ziffern samt SI-Einheit an.',numbers:[['g','G',6.75496e-11,2,'G']],choices:[['equation','Ansatz',[['yes','G ist F mal r² geteilt durch (M mal m)'],['no','G ist F mal M mal m geteilt durch r²']],'yes']],helps:['Welche Größe steht im Gravitationsgesetz als Faktor vor den Massen?','Stelle nach G um und wandle Millimeter sowie Mikronewton um.','Setze r=0,211 m und F=1,75·10⁻⁷ N in G=F·r²/(M·m) ein.'],messages:{success:'Richtig. Die Messdaten ergeben gerundet 6,8·10⁻¹¹ in SI-Einheiten.',partial:'Teilweise korrekt. Der Wert liegt nahe am Erwartungswert; prüfe Einheit oder zwei gültige Ziffern.',error:'Noch nicht korrekt. Prüfe insbesondere 211 mm = 0,211 m und 0,175 µN = 1,75·10⁻⁷ N.'},after:()=>{$('m4-note').hidden=false;}});
  const cave=document.createElement('p');cave.id='m4-note';cave.hidden=true;cave.textContent='Der ungerundete Rechenwert liegt bei etwa 6,75·10⁻¹¹. Die gegebenen Messdaten begrenzen die Genauigkeit.';$('card-m4').after(cave);
}

const unitSets={
  G:{'N·m²/kg²':1,'m³/(kg·s²)':1,'N':NaN,'N/kg':NaN,'kg·m²':NaN},
  F:{'N':1,'µN':1e-6,'mN':1e-3,'kN':1e3,'kg':NaN},
  a:{'m/s²':1,'cm/s²':0.01,'N':NaN,'m/s':NaN},
  R:{'km':1000,'m':1,'cm':0.01,'kg':NaN},
  ratio:{'ohne Einheit':1,'m':NaN,'km':NaN,'m/s²':NaN}
};
function setupNumeric({host,id,title,prompt,numbers,choices=[],helps,messages,after}){
  const area=card(host,id,title,prompt,helps);
  const separateNumbers=['A1','A2','A3','A4','A5'].includes(id);
  const state={numbers,choices,separateNumbers,numberPassed:false,numberChecks:Object.fromEntries(numbers.map(([suffix])=>[suffix,false])),choicePassed:Object.fromEntries(choices.map(([suffix])=>[suffix,false]))};
  numericCards.set(id,state);
  const perhapsFinish=()=>{
    const explanationPassed=id!=='A1'||(a1Review.passed&&a1Review.answer===$('a1-explanation-answer')?.value);
    if(state.numberPassed&&choices.every(([suffix])=>state.choicePassed[suffix])&&explanationPassed){finish(id);after?.();}
  };
  for(const [suffix,label,target,digits,kind] of numbers){
    const pair=document.createElement('div');pair.className='physics-number-entry';
    const units=Object.keys(unitSets[kind]);
    pair.innerHTML=`<label for="${id.toLowerCase()}-${suffix}">${label} (${digits} gültige Ziffern)</label><div class="physics-number-controls"><input id="${id.toLowerCase()}-${suffix}" type="text" inputmode="decimal" autocomplete="off" placeholder="z. B. 6,67·10^-11"><select id="${id.toLowerCase()}-${suffix}-unit" aria-label="Einheit für ${label}"><option value="">Einheit</option>${units.map(u=>`<option value="${u}">${u}</option>`).join('')}</select></div>`;
    if(separateNumbers){
      const fieldId=`${id.toLowerCase()}-${suffix}`;
      pair.insertAdjacentHTML('beforeend',`<button id="check-${fieldId}" type="button" class="physics-primary-button">${label} prüfen</button><p id="feedback-${fieldId}" class="physics-feedback" role="status" aria-live="polite" hidden></p>`);
      pair.querySelector('input').setAttribute('aria-describedby',`${id.toLowerCase()}-number-format`);
      pair.querySelector('button').addEventListener('click',()=>{
        const result=checkQuantity($(fieldId).value,$(`${fieldId}-unit`).value,{target,digits,units:unitSets[kind]});
        state.numberChecks[suffix]=result==='correct';
        state.numberPassed=numbers.every(([key])=>state.numberChecks[key]);
        feedback(`feedback-${fieldId}`,result==='correct'?'success':result==='precision'?'partial':'error',result==='correct'?'Richtig. Zahlenwert, Einheit und die Anzahl der gültigen Ziffern stimmen.':feedbackWords[result==='precision'?'precision':'wrong']);
        perhapsFinish();progress?.save();
      });
    }
    area.append(pair);
  }
  if(separateNumbers){
    $(`check-${id.toLowerCase()}`).remove();
    const note=document.createElement('p');note.id=`${id.toLowerCase()}-number-format`;note.className='drag-help';
    note.textContent='Als Malzeichen sind *, · und × erlaubt, z. B. 1,2*10^-25 oder 1,2·10^-25; auch 1,2e-25 ist möglich. Wähle die Einheit daneben aus.';
    area.append(note);
  }else area.append($(`check-${id.toLowerCase()}`),$(`feedback-${id.toLowerCase()}`));
  for(const [suffix,label,options,right] of choices){
    const wordChoice=id==='M3'||id==='M4';
    const choice=wordChoice?document.createElement('div'):addSelect(area,`${id.toLowerCase()}-${suffix}`,label,options);
    if(wordChoice){choice.className='grav-inline-word-choice';area.append(choice);}
    const button=document.createElement('button');button.id=`check-${id.toLowerCase()}-${suffix}`;button.type='button';button.className='physics-primary-button';button.textContent=`${label} prüfen`;
    const result=document.createElement('p');result.id=`feedback-${id.toLowerCase()}-${suffix}`;result.className='physics-feedback';result.setAttribute('role','status');result.setAttribute('aria-live','polite');result.hidden=true;
    choice.after(button,result);
    if(wordChoice){
      setupWordCards({id,reuseArea:choice,fields:[[suffix,label,options]],answers:[right],messages:{success:separateChoiceFeedback[id].success,partial:separateChoiceFeedback[id].error,error:separateChoiceFeedback[id].error},checkButtonId:button.id,feedbackId:result.id,onCheck:level=>{
        state.choicePassed[suffix]=level==='success';
        perhapsFinish();progress?.save();
      }});
    }else button.addEventListener('click',()=>{
      const selected=$(`${id.toLowerCase()}-${suffix}`).value;
      const correct=selected===right;
      state.choicePassed[suffix]=correct;
      feedback(result.id,correct?'success':'error',selected?separateChoiceFeedback[id][correct?'success':'error']:'Wähle zuerst eine Aussage aus.');
      perhapsFinish();progress?.save();
    });
  }
  $(`check-${id.toLowerCase()}`)?.addEventListener('click',()=>{
    const states=numbers.map(([suffix,label,target,digits,kind])=>({label,state:checkQuantity($(`${id.toLowerCase()}-${suffix}`).value,$(`${id.toLowerCase()}-${suffix}-unit`).value,{target,digits,units:unitSets[kind],tolerance:id==='M3'?0.01e-11:0})}));
    const good=states.filter(s=>s.state==='correct').length;
    const level=good===states.length?'success':good||states.some(s=>s.state==='precision')?'partial':'error';
    state.numberPassed=level==='success';
    numbers.forEach(([suffix],index)=>{state.numberChecks[suffix]=states[index].state==='correct';});
    let message=numericFeedback[id]?.[level]||messages[level];
    if(level!=='success'){
      const bad=states.filter(s=>s.state!=='correct').map(s=>s.label).join(', ');
      if(states.every(s=>s.state==='correct'||s.state==='precision'))message=feedbackWords.precision;
      else if(level==='error'&&numbers.length>1)message+=` ${feedbackWords.wrong}`;
      if(bad)message+=` Prüfe: ${bad}.`;
    }
    feedback(`feedback-${id.toLowerCase()}`,level,message);
    perhapsFinish();progress?.save();
  });
}
export const APPLICATION_STEP_TASKS = {
  A1: [
  {
    key:'force', title:'1 · Kraft', n:4,
    order:['force','grams','rounded','given','law'],
    cards: [
      {id:'given', lines:['m_A = 150 g = 0,150 kg', 'M_E = 5,974·10²⁴ kg; r = R_E = 6,370·10⁶ m'], spoken:'Apfelmasse in Kilogramm umrechnen und Erdmasse sowie Mittelpunktabstand angeben'},
      {id:'law', lines:['F = G · {{m_A · M_E|r²}}'], spoken:'Gravitationsgesetz: F gleich G mal Apfelmasse mal Erdmasse durch r zum Quadrat'},
      {id:'force', lines:['F = 6,67430·10⁻¹¹ · {{0,150 · 5,974·10²⁴|(6,370·10⁶)²}} N', 'F ≈ 1,473951985 N'], spoken:'SI-Zahlenwerte in das Gravitationsgesetz einsetzen: Kraft ungefähr 1,473951985 Newton'},
      {id:'rounded', lines:['Endergebnis mit zwei gültigen Ziffern:', 'F ≈ 1,5 N'], spoken:'Kraft erst am Ende auf zwei gültige Ziffern runden: 1,5 Newton'},
      {id:'grams', lines:['m_A = 150 kg'], spoken:'Apfelmasse: 150 Kilogramm'},
    ],
    acceptedOrders:[['given','law','force','rounded'],['law','given','force','rounded']],
    distractorIds:['grams'],
    distractorHint:'Rechne die Apfelmasse von Gramm in Kilogramm um.',
    success:'Richtig. Übertrage die gerundete Kraft mit der passenden Einheit nach oben. Verwende für die Beschleunigungen den ungerundeten Kraftwert.',
  },
  {
    key:'apple', title:'2 · Beschleunigung Apfel', n:4,
    order:['substitute','multiply','rounded','given','law'],
    cards:[
      {id:'given',lines:['F ≈ 1,473951985 N; m_A = 0,150 kg'],spoken:'Ungerundeten Kraftwert und Apfelmasse verwenden'},
      {id:'law',lines:['a_A = {{F|m_A}}'],spoken:'Beschleunigung des Apfels: Kraft durch Apfelmasse'},
      {id:'substitute',lines:['a_A ≈ {{1,473951985|0,150}} {{m/s²}}', 'a_A ≈ 9,826346567 {{m/s²}}'],spoken:'Kraft durch 0,150 Kilogramm teilen: ungefähr 9,826346567 Meter pro Sekunde zum Quadrat'},
      {id:'rounded',lines:['Endergebnis mit zwei gültigen Ziffern:', 'a_A ≈ 9,8 {{m/s²}}'],spoken:'Beschleunigung des Apfels auf zwei gültige Ziffern runden: 9,8 Meter pro Sekunde zum Quadrat'},
      {id:'multiply',lines:['a_A = F · m_A'],spoken:'Beschleunigung des Apfels als Kraft mal Apfelmasse berechnen'},
    ],
    acceptedOrders:[['given','law','substitute','rounded'],['law','given','substitute','rounded']],
    distractorIds:['multiply'],
    distractorHint:'Die Beschleunigung ist Kraft geteilt durch Masse.',
    success:'Richtig. Übertrage die gerundete Beschleunigung des Apfels mit der passenden Einheit nach oben.',
  },
  {
    key:'earth', title:'3 · Beschleunigung Erde', n:4,
    order:['substitute','multiply','rounded','given','law'],
    cards:[
      {id:'given',lines:['F ≈ 1,473951985 N; M_E = 5,974·10²⁴ kg'],spoken:'Ungerundeten Kraftwert und Erdmasse verwenden'},
      {id:'law',lines:['a_E = {{F|M_E}}'],spoken:'Beschleunigung der Erde: Kraft durch Erdmasse'},
      {id:'substitute',lines:['a_E ≈ {{1,473951985|5,974·10²⁴}} {{m/s²}}', 'a_E ≈ 2,467278180·10⁻²⁵ {{m/s²}}'],spoken:'Kraft durch Erdmasse teilen: ungefähr 2,467278180 mal zehn hoch minus 25 Meter pro Sekunde zum Quadrat'},
      {id:'rounded',lines:['Endergebnis mit zwei gültigen Ziffern:', 'a_E ≈ 2,5·10⁻²⁵ {{m/s²}}'],spoken:'Beschleunigung der Erde auf zwei gültige Ziffern runden: 2,5 mal zehn hoch minus 25 Meter pro Sekunde zum Quadrat'},
      {id:'multiply',lines:['a_E = F · M_E'],spoken:'Beschleunigung der Erde als Kraft mal Erdmasse berechnen'},
    ],
    acceptedOrders:[['given','law','substitute','rounded'],['law','given','substitute','rounded']],
    distractorIds:['multiply'],
    distractorHint:'Teile die auf die Erde wirkende Kraft durch die Erdmasse.',
    success:'Richtig. Trage oben 2,5e-25 oder 2,5·10^-25 ein und wähle m/s² als Einheit.',
  },
  ],
  A2: [
    {key:'orbit',title:'1 · Kraft in 400 km Höhe',index:'O',distance:'r_O = (6370 + 400) km = 6,770·10⁶ m',radius:'6,770',value:'539,3681457',rounded:'5,4·10²',wrong:'r_O = h = 400 km',hint:'Der Abstand beginnt im Erdmittelpunkt. Addiere zur Höhe noch den Erdradius.'},
    {key:'ground',title:'2 · Kraft am Boden',index:'B',distance:'r_B = 6370 km = 6,370·10⁶ m',radius:'6,370',value:'609,2334871',rounded:'6,1·10²',wrong:'r_B = 6370 m',hint:'Rechne den Erdradius von Kilometern in Meter um.'},
  ].map(item=>({
    key:item.key,title:item.title,n:4,
    order:['substitute','wrong-distance','rounded','distance','law'],
    cards:[
      {id:'distance',lines:[item.distance],spoken:item.distance.replaceAll('_',' mit Index ')},
      {id:'law',lines:[`F_${item.index} = G · {{M_E · m|r_${item.index}²}}; m = 62 kg`],spoken:'Gravitationsgesetz für die Astronautin mit 62 Kilogramm'},
      {id:'substitute',lines:[`F_${item.index} = 6,67430·10⁻¹¹ · {{5,974·10²⁴ · 62|(${item.radius}·10⁶)²}} N`,`F_${item.index} ≈ ${item.value} N`],spoken:`Kraft mit dem Mittelpunktabstand einsetzen: ungefähr ${item.value} Newton`},
      {id:'rounded',lines:['Endergebnis mit zwei gültigen Ziffern:',`F_${item.index} ≈ ${item.rounded} N`],spoken:`Kraft auf zwei gültige Ziffern runden: ${item.rounded} Newton`},
      {id:'wrong-distance',lines:[item.wrong],spoken:`Abstand ansetzen: ${item.wrong.replaceAll('_',' mit Index ')}`},
    ],
    acceptedOrders:[['distance','law','substitute','rounded'],['law','distance','substitute','rounded']],
    distractorIds:['wrong-distance'],distractorHint:item.hint,
    success:'Richtig. Übertrage die gerundete Kraft mit der passenden Einheit nach oben.',
  })),
  A3: [{
    key:'moon', title:'3 · Mondfallbeschleunigung', n:4,
    order:['substitute','wrong-radius','rounded','radius','law'],
    cards:[
      {id:'radius',lines:['{{R_Mond}} = 1737 km = 1,737·10⁶ m'],spoken:'Mondradius 1737 Kilometer in 1,737 mal zehn hoch 6 Meter umrechnen'},
      {id:'law',lines:['{{g_Mond}} = G · {{M_Mond|R_Mond²}}'],spoken:'Ansatz für die Mondfallbeschleunigung: G mal Mondmasse geteilt durch Mondradius zum Quadrat'},
      {id:'substitute',lines:['{{g_Mond}} = 6,67430·10⁻¹¹ {{N·m²|kg²}} · {{7,349·10²² kg|(1,737·10⁶ m)²}} ≈ 1,625677… {{m|s²}}'],spoken:'SI-Werte für G, Mondmasse und Radius einsetzen: ungefähr 1,625677 Meter pro Sekunde zum Quadrat'},
      {id:'rounded',lines:['Erst am Ende auf vier gültige Ziffern:', '{{g_Mond}} ≈ 1,626 {{m|s²}}'],spoken:'Erst am Ende auf vier gültige Ziffern runden: 1,626 Meter pro Sekunde zum Quadrat'},
      {id:'wrong-radius',lines:['{{R_Mond}} = 1737 m'],spoken:'1737 Kilometer direkt als 1737 Meter einsetzen'},
    ],
    acceptedOrders:[['radius','law','substitute','rounded']],
    distractorIds:['wrong-radius'],
    distractorHint:'Wandle den Mondradius zuerst von Kilometern in Meter um.',
    success:'Richtig. Übertrage das gerundete Ergebnis mit der passenden Einheit nach oben.',
  }],
  A4: [{
    key:'mars', title:'4 · Marsradius', n:4,
    order:['substitute','forget-root','rounded','law','solve'],
    cards:[
      {id:'law',lines:['g = G · {{M|R²}}'],spoken:'Ansatz: Oberflächenfallbeschleunigung gleich G mal Masse durch Radius zum Quadrat'},
      {id:'solve',lines:['Umstellen: R = √({{G·M|g}})'],spoken:'Nach dem Radius umstellen und die positive Quadratwurzel ziehen'},
      {id:'substitute',lines:['Einsetzen: R = √(6,67430·10⁻¹¹ {{N·m²|kg²}} · {{6,417·10²³ kg|3,7 m/s²}}) ≈ 3,402264…·10⁶ m = 3402,264… km'],spoken:'Gegebene Masse und Fallbeschleunigung mit G in SI-Einheiten einsetzen: ungefähr 3402,264 Kilometer'},
      {id:'rounded',lines:['Erst am Ende auf zwei gültige Ziffern:', 'R ≈ 3,4·10³ km'],spoken:'Erst am Ende auf zwei gültige Ziffern runden: 3,4 mal zehn hoch 3 Kilometer'},
      {id:'forget-root',lines:['Bei R² = {{G·M|g}} aufhören'],spoken:'Bei R zum Quadrat gleich G mal Masse durch g aufhören und die Wurzel vergessen'},
    ],
    acceptedOrders:[['law','solve','substitute','rounded']],
    distractorIds:['forget-root'],
    distractorHint:'Nach dem Umstellen musst du noch die Quadratwurzel ziehen.',
    success:'Richtig. Übertrage das gerundete Ergebnis mit der passenden Einheit nach oben.',
  }],
  A5: [{
    key:'ratio', title:'5 · Merkur-Modell', n:4,
    order:['linear-ratio','root','rounded','equal-g','square'],
    cards:[
      {id:'equal-g',lines:['G · {{M_Merkur|R_Merkur²}} = G · {{M_Mars|R_Mars²}}'],spoken:'Gleichsetzen: Oberflächenbeschleunigungen des Merkur- und Marsmodells gleichsetzen'},
      {id:'square',lines:['G kürzen und Radienverhältnis quadrieren: ({{R_Merkur|R_Mars}})² = {{M_Merkur|M_Mars}}'],spoken:'G kürzen und das Radienverhältnis quadrieren; es ist gleich dem Massenverhältnis'},
      {id:'root',lines:['Positive Wurzel: {{R_Merkur|R_Mars}} = √0,5 ≈ 0,707106…'],spoken:'Positive Wurzel ziehen: das Radienverhältnis ist ungefähr 0,707106'},
      {id:'rounded',lines:['Erst am Ende auf drei gültige Ziffern:', '{{R_Merkur|R_Mars}} ≈ 0,707 ohne Einheit'],spoken:'Erst am Ende auf drei gültige Ziffern runden: 0,707 ohne Einheit'},
      {id:'linear-ratio',lines:['{{R_Merkur|R_Mars}} = {{M_Merkur|M_Mars}} = 0,5'],spoken:'Das Radienverhältnis linear gleich dem Massenverhältnis 0,5 setzen'},
    ],
    acceptedOrders:[['equal-g','square','root','rounded']],
    distractorIds:['linear-ratio'],
    distractorHint:'Bei gleichem g hängt das Radienverhältnis von der Quadratwurzel des Massenverhältnisses ab.',
    success:'Richtig. Übertrage das gerundete Ergebnis mit der passenden Einheit nach oben.',
  }],
};
function setupApplicationStepHelps(taskProgress) {
  for (const [id, columns] of Object.entries(APPLICATION_STEP_TASKS)) {
    const prefix = id.toLowerCase();
    const help = $(`card-${prefix}`).querySelector('.physics-help-stack details:last-child');
    const calculationColumns = document.createElement('div');
    calculationColumns.className = `grav-calculation-columns${columns.length===1?' grav-calculation-columns--single':columns.length===2?' grav-calculation-columns--two':''}`;
    help.append(calculationColumns);
    for(const config of columns){
    const columnPrefix=`${prefix}-${config.key}`;
    const column=document.createElement('section');column.className='grav-calculation-column';column.setAttribute('aria-labelledby',`${columnPrefix}-steps-title`);
    column.innerHTML=`<h4 id="${columnPrefix}-steps-title">${config.title}</h4><div id="${columnPrefix}-steps" class="step-order" aria-label="${config.title}: Lösungsweg ordnen"></div><div class="cloze-actions"><button id="check-${columnPrefix}-steps" class="physics-primary-button" type="button">${config.title.slice(4)}: Reihenfolge prüfen</button><button id="reset-${columnPrefix}-steps" class="physics-primary-button secondary-button" type="button">Zurücksetzen</button></div><p id="${columnPrefix}-steps-feedback" class="physics-feedback" role="status" aria-live="polite" hidden></p>`;
    calculationColumns.append(column);
    setupStepOrder({
      ...config, containerId: `${columnPrefix}-steps`, checkButtonId: `check-${columnPrefix}-steps`, resetButtonId: `reset-${columnPrefix}-steps`, feedbackId: `${columnPrefix}-steps-feedback`,
      bankLabel:`Rechenschritte: ${config.title.slice(4)}`,
      renderCard: (element, item) => {
        const content = document.createElement('span'); content.className = 'grav-step-card';
        for (const line of item.lines) { const row = document.createElement('span'); appendApplicationMathText(row, line); content.append(row); }
        element.replaceChildren(content);
      },
      showFeedback: (node, level, message) => {
        if (['A3','A4','A5'].includes(id)) {
          if (level === 'error' && message.startsWith('Fülle zuerst')) {
            feedback(node.id, level, message);
            return;
          }
          const exactMessages = {
            success:'Richtig. Übertrage das gerundete Ergebnis mit der passenden Einheit nach oben.',
            partial:'Teilweise korrekt. Prüfe die Reihenfolge von Ansatz, Einsetzen und Rundung.',
            error:'Noch nicht korrekt. Beginne mit dem Ansatz und runde erst das Endergebnis.',
          };
          feedback(node.id, level, exactMessages[level]);
        } else feedback(node.id, level, message);
      },
    }, taskProgress);
    }
  }
}
function addTaskIllustration(id,asset,alt,caption='Symbolische Darstellung.'){
  const task=$(`card-${id.toLowerCase()}`);
  const intro=document.createElement('div');intro.className='grav-illustrated-intro';
  const copy=document.createElement('div');copy.className='grav-illustrated-copy';
  copy.append(task.querySelector('h3'),task.querySelector('.task-prompt'));
  const figure=document.createElement('figure');figure.className='describe-figure grav-illustrated-figure';
  const picture=document.createElement('img');picture.src=`assets/${asset}`;picture.width=280;picture.height=220;picture.alt=alt;
  const note=document.createElement('figcaption');note.textContent=caption;
  figure.append(picture,note);intro.append(copy,figure);task.prepend(intro);
}
function buildApplications(){
  const earthMass=5.974e24,earthRadius=6370e3;
  const appleForce=G*earthMass*0.150/earthRadius**2;
  setupNumeric({host:'tasks-application',id:'A1',title:'A1 · Apfel und Erde',prompt:'Ein Apfel mit 150 g hängt dicht über der Erde. <strong>Bestimme</strong> den gegenseitigen Kraftbetrag und die Beschleunigungen von Apfel und Erde.',numbers:[['force','Kraftbetrag',appleForce,2,'F'],['apple','Beschleunigung Apfel',appleForce/0.150,2,'a'],['earth','Beschleunigung Erde',appleForce/earthMass,2,'a']],helps:['Für den Abstand genügt hier näherungsweise der Erdradius.','Berechne zuerst F und teile denselben Kraftbetrag jeweils durch die betreffende Masse.','m<sub>Apfel</sub>=0,150 kg; F≈1,474 N. Für beide Beschleunigungen gilt a=F/m, aber mit verschiedener Masse.'],messages:{success:'Richtig.',partial:'Teilweise korrekt.',error:'Noch nicht korrekt.'}});
  addTaskIllustration('A1','apfel-und-erde.svg','Ein roter Apfel nahe der Oberfläche einer blau-grünen Erde.','Symbolische Darstellung,\nnicht maßstabsgetreu.');
  const explanation=document.createElement('article');explanation.id='card-a1-explanation';explanation.className='physics-task-card physics-semantic-task';explanation.setAttribute('aria-labelledby','a1-explanation-title');
  explanation.innerHTML='<h3 id="a1-explanation-title">Deine Erklärung zu Kraft und Beschleunigung</h3><p class="task-prompt"><strong>Erkläre</strong>, warum nur ein Kraftbetrag berechnet werden muss. Gehe darauf ein, warum sich die Beträge der beiden Beschleunigungen stark unterscheiden.</p><label for="a1-explanation-answer">Deine Erklärung zu Kraft und Beschleunigung</label><textarea id="a1-explanation-answer" maxlength="3000" rows="6" aria-describedby="a1-explanation-count a1-explanation-privacy"></textarea><div class="physics-semantic-task__actions"><span id="a1-explanation-count" aria-live="polite">0 von 3000 Zeichen</span><button id="check-a1-explanation" type="button" class="physics-primary-button">Erklärung prüfen</button></div><p id="a1-explanation-privacy" class="privacy-note">Hinweis: Gib keine personenbezogenen Informationen ein. Deine Antwort wird zur automatischen Auswertung an den Skriptserver und dort an ein KI-System übertragen.</p><div id="a1-explanation-feedback" class="physics-semantic-feedback" role="status" aria-live="polite" hidden></div>';
  $('card-a1').after(explanation);
  setupNumeric({host:'tasks-application',id:'A2',title:'A2 · Astronautin',prompt:'Eine Astronautin mit 62 kg umkreist die Erde in 400 km Höhe. <strong>Berechne</strong> ihre Gravitationskraft dort und am Boden.',numbers:[['orbit','Kraft in 400 km Höhe',G*earthMass*62/(6770e3)**2,2,'F'],['ground','Kraft am Boden',G*earthMass*62/earthRadius**2,2,'F']],helps:['Der Abstand beginnt am Erdmittelpunkt.','Für die Höhe addiere Erdradius und 400 km; berechne F zweimal.','Verwende r<sub>Orbit</sub>=6770 km und r<sub>Boden</sub>=6370 km. Die Orbitkraft ist noch deutlich von null verschieden.'],messages:{success:'Richtig.',partial:'Teilweise korrekt.',error:'Noch nicht korrekt.'}});
  const derivation=document.createElement('article');derivation.className='physics-task-card';derivation.id='surface-derivation';derivation.innerHTML='<p>An der Oberfläche gilt für einen Probekörper zugleich F<sub>G</sub> = m·g und F<sub>G</sub> = G·<span class="physics-fraction"><span class="physics-fraction__numerator">M·m</span><span class="physics-fraction__denominator">R²</span></span>. Nach Kürzen der Probemasse folgt g = G·<span class="physics-fraction"><span class="physics-fraction__numerator">M</span><span class="physics-fraction__denominator">R²</span></span>.</p>';$('tasks-fast').append(derivation);
  setupNumeric({host:'tasks-fast',id:'A3',title:'A3 · Mond',prompt:'Der Mond hat M=7,349·10²² kg und R=1737 km. <strong>Bestimme</strong> seine Oberflächenfallbeschleunigung und <strong>vergleiche</strong> sie mit der der Erde.',numbers:[['g','Oberflächenfallbeschleunigung',G*7.349e22/(1737e3)**2,4,'a']],choices:[['comparison','Vergleich',yesNo('kleiner als auf der Erde, ungefähr ein Sechstel','gleich wegen gleicher Probemasse'),'yes']],helps:['Die Probemasse fällt in g=G·M/R² heraus.','Wandle 1737 km in Meter um und quadriere den Radius.','Setze M=7,349·10²² kg und R=1,737·10⁶ m ein; der Rechenwert liegt nahe 1,63 m/s².'],messages:{success:'Richtig. Zahlenwert, Einheit und die Anzahl der gültigen Ziffern stimmen.',partial:feedbackWords.precision,error:feedbackWords.wrong}});
  setupNumeric({host:'tasks-fast',id:'A4',title:'A4 · Mars',prompt:'Für Mars gelten M=6,417·10²³ kg und g=3,7 m/s². <strong>Bestimme</strong> den mittleren Radius aus dem Gravitationsgesetz.',numbers:[['radius','Marsradius',Math.sqrt(G*6.417e23/3.7),2,'R']],helps:['Stelle g=G·M/R² nach R um.','Nach Multiplikation mit R² folgt R²=G·M/g.','Ziehe die Wurzel aus G·M/g; vor Rundung sind es etwa 3402 km.'],messages:{success:'Richtig. Zahlenwert, Einheit und die Anzahl der gültigen Ziffern stimmen.',partial:feedbackWords.precision,error:feedbackWords.wrong}});
  setupNumeric({host:'tasks-fast',id:'A5',title:'A5 · Merkur-Modell',prompt:'Im vereinfachten Modell besitzt Merkur genau die halbe Marsmasse und dieselbe Oberflächenfallbeschleunigung. <strong>Bestimme</strong> das Verhältnis R<sub>Merkur</sub>/R<sub>Mars</sub> mit drei gültigen Ziffern und <strong>wähle</strong> die passende Einheit.',numbers:[['ratio','Radienverhältnis',Math.sqrt(0.5),3,'ratio']],helps:['Setze die beiden Oberflächenbeschleunigungen gleich.','Bei gleichem g ist der Radius proportional zur Quadratwurzel der Masse.','Das gesuchte Verhältnis ist √(M<sub>Merkur</sub>/M<sub>Mars</sub>)=√0,5.'],messages:{success:'Richtig. Zahlenwert, Einheit und die Anzahl der gültigen Ziffern stimmen.',partial:feedbackWords.precision,error:feedbackWords.wrong}});
  addTaskIllustration('A3','mond-illustration.svg','Graue Mondkugel mit dunkleren Ebenen und Kratern.');
  addTaskIllustration('A4','mars-illustration.svg','Rostroter Mars mit dunkleren Oberflächenstrukturen und heller Polkappe.');
}

function simulationMarkup(prefix){
  return `<div class="grav-simulation physics-task-card" id="${prefix}-root"><div class="grav-controls"><label for="${prefix}-m1">Masse 1: <output id="${prefix}-m1-out">3,5 t</output></label><input id="${prefix}-m1" type="range" min="0" max="8" step="0.1" value="3.5"><label for="${prefix}-m2">Masse 2: <output id="${prefix}-m2-out">4,5 t</output></label><input id="${prefix}-m2" type="range" min="0" max="8" step="0.1" value="4.5"><label for="${prefix}-distance">Abstand der beiden Mittelpunkte zueinander: <output id="${prefix}-distance-out">7,0 m</output></label><p class="grav-distance-note">r ist der Abstand der Mittelpunkte.</p><input id="${prefix}-distance" type="range" min="0.5" max="12" step="0.1" value="7"><button id="${prefix}-reset" type="button" class="physics-primary-button">Ausgangslage wiederherstellen</button><p id="${prefix}-distance-feedback" class="physics-feedback" role="status" aria-live="polite" hidden></p></div><div class="grav-scene"><svg id="${prefix}-svg" viewBox="0 0 640 440" role="group" aria-labelledby="${prefix}-title ${prefix}-desc"><title id="${prefix}-title">Gravitationskräfte zwischen zwei Massen</title><desc id="${prefix}-desc">Zwei verschiebbare Körper mit gleich langen, entgegengesetzt gerichteten Kraftpfeilen. Pfeiltasten verschieben den fokussierten Körper um 0,1 Meter, mit Umschalttaste um 0,5 Meter.</desc><defs><marker id="${prefix}-arrow1" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 Z" fill="#2563eb"></path></marker><marker id="${prefix}-arrow2" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 Z" fill="#b45309"></path></marker></defs><line id="${prefix}-connector" class="grav-connector"></line><line id="${prefix}-force1" class="grav-arrow grav-arrow1" marker-end="url(#${prefix}-arrow1)"></line><line id="${prefix}-force2" class="grav-arrow grav-arrow2" marker-end="url(#${prefix}-arrow2)"></line><circle id="${prefix}-body1" class="grav-body grav-body1" aria-hidden="true" pointer-events="none"></circle><circle id="${prefix}-body2" class="grav-body grav-body2" aria-hidden="true" pointer-events="none"></circle><circle id="${prefix}-center1" class="grav-center" r="3" pointer-events="none"></circle><circle id="${prefix}-center2" class="grav-center" r="3" pointer-events="none"></circle><text id="${prefix}-label1" class="grav-label" text-anchor="middle">m₁</text><text id="${prefix}-label2" class="grav-label" text-anchor="middle">m₂</text><circle id="${prefix}-hit1" class="grav-hit" r="26" tabindex="0" role="button" aria-label="Masse 1 verschieben"></circle><circle id="${prefix}-hit2" class="grav-hit" r="26" tabindex="0" role="button" aria-label="Masse 2 verschieben"></circle></svg></div><div class="grav-readout" aria-live="polite"><p id="${prefix}-readout">Mittelpunktabstand r = 7,0 m</p><p id="${prefix}-force1-readout">Kraft auf Masse 1 durch Masse 2</p><p id="${prefix}-force2-readout">Kraft auf Masse 2 durch Masse 1</p></div></div>`;
}
const WORLD_SCALE=32;
function scenePoint(x,y){return {x:320+x*WORLD_SCALE,y:220-y*WORLD_SCALE};}
export function forceArrowLength(state){
  const value=force(state);
  return value===0?0:20+48*Math.log1p(value*1e6);
}
function screenInverse(svg){
  try{
    const matrix=svg.getScreenCTM();
    if(!matrix||![matrix.a,matrix.b,matrix.c,matrix.d,matrix.e,matrix.f].every(Number.isFinite)||Math.abs(matrix.a*matrix.d-matrix.b*matrix.c)<1e-12)return null;
    return matrix.inverse();
  }catch{return null;}
}
function eventPoint(svg,event,inverse){
  if(!inverse||!Number.isFinite(event.clientX)||!Number.isFinite(event.clientY))return null;
  try{
    const point=svg.createSVGPoint();point.x=event.clientX;point.y=event.clientY;
    const mapped=point.matrixTransform(inverse);
    return Number.isFinite(mapped.x)&&Number.isFinite(mapped.y)?{x:mapped.x,y:mapped.y}:null;
  }catch{return null;}
}
let simulationFrame=0;
function requestSimulationUpdate(){
  if(simulationFrame)return;
  simulationFrame=requestAnimationFrame(()=>{simulationFrame=0;updateSimulation();});
}
function updateSimulation(){
  for(const prefix of ['sim3','sim4']){
    const p1=scenePoint(simulation.x1,simulation.y1),p2=scenePoint(simulation.x2,simulation.y2);
    const scene=$(`${prefix}-svg`),margin=80;
    const r=distance(simulation),f=force(simulation),micro=f*1e6;
    const ux=(p2.x-p1.x)/(r*WORLD_SCALE),uy=(p2.y-p1.y)/(r*WORLD_SCALE);
    const length=forceArrowLength(simulation);
    const arrowEnds=f===0?[]:[{x:p1.x+ux*length,y:p1.y+uy*length},{x:p2.x-ux*length,y:p2.y-uy*length}];
    const labelAlong=Math.min(60,Math.max(32,length*0.42));
    const vectorPositions=[
      {x:p1.x+ux*labelAlong-uy*48,y:p1.y+uy*labelAlong+ux*48},
      {x:p2.x-ux*labelAlong+uy*78,y:p2.y-uy*labelAlong-ux*78}
    ];
    const extents=[p1,p2,...arrowEnds,...vectorPositions];
    const left=Math.min(0,...extents.map(p=>p.x-margin)),top=Math.min(0,...extents.map(p=>p.y-margin));
    const right=Math.max(640,...extents.map(p=>p.x+margin)),bottom=Math.max(440,...extents.map(p=>p.y+margin));
    if(!scene.dataset.dragActive)scene.setAttribute('viewBox',`${left} ${top} ${right-left} ${bottom-top}`);
    let transform=null;
    try{transform=scene.getScreenCTM();}catch{}
    const screenScale=transform?Math.hypot(transform.a,transform.b):0;
    const vectorScale=Number.isFinite(screenScale)&&screenScale>1e-8?Math.max(1,15/(18*screenScale)):1;
    const hitRadius=Number.isFinite(screenScale)&&screenScale>1e-8?Math.max(26,22/screenScale):26;
    $(`${prefix}-m1`).value=simulation.m1;$(`${prefix}-m2`).value=simulation.m2;
    $(`${prefix}-m1-out`).textContent=`${simulation.m1.toFixed(1).replace('.',',')} t`;
    $(`${prefix}-m2-out`).textContent=`${simulation.m2.toFixed(1).replace('.',',')} t`;
    $(`${prefix}-distance`).value=r.toFixed(1);
    $(`${prefix}-distance-out`).textContent=`${r.toFixed(1).replace('.',',')} m`;
    const connector=$(`${prefix}-connector`);connector.setAttribute('x1',p1.x);connector.setAttribute('y1',p1.y);connector.setAttribute('x2',p2.x);connector.setAttribute('y2',p2.y);
    for(const [which,p,dir] of [[1,p1,1],[2,p2,-1]]){
      const body=$(`${prefix}-body${which}`),hit=$(`${prefix}-hit${which}`),center=$(`${prefix}-center${which}`),label=$(`${prefix}-label${which}`),arrow=$(`${prefix}-force${which}`);
      const mass=simulation[`m${which}`];body.setAttribute('cx',p.x);body.setAttribute('cy',p.y);body.setAttribute('r',12+5*Math.sqrt(mass));
      center.setAttribute('cx',p.x);center.setAttribute('cy',p.y);label.setAttribute('x',p.x);label.setAttribute('y',p.y-26-5*Math.sqrt(mass));
      hit.setAttribute('cx',p.x);hit.setAttribute('cy',p.y);hit.setAttribute('r',hitRadius);
      hit.setAttribute('aria-label',`Masse ${which}: ${mass.toFixed(1).replace('.',',')} Tonnen, Mittelpunkt verschieben`);
      arrow.setAttribute('x1',p.x);arrow.setAttribute('y1',p.y);
      arrow.setAttribute('x2',p.x+dir*ux*length);arrow.setAttribute('y2',p.y+dir*uy*length);arrow.style.display=f===0?'none':'';
    }
    [[2,vectorPositions[0]],[1,vectorPositions[1]]].forEach(([index,position])=>{
      const label=$(`${prefix}-vector${index}`);
      label.setAttribute('x',position.x);label.setAttribute('y',position.y);
      label.setAttribute('font-size',18*vectorScale);
      label.querySelector('tspan:last-child').setAttribute('font-size',12*vectorScale);
      label.style.display=f===0?'none':'';
      const mark=$(`${prefix}-vector${index}-mark`);
      mark.setAttribute('d',`M ${position.x-11*vectorScale} ${position.y-19*vectorScale} H ${position.x+vectorScale} m ${-4*vectorScale} ${-3*vectorScale} ${4*vectorScale} ${3*vectorScale} ${-4*vectorScale} ${3*vectorScale}`);
      mark.setAttribute('stroke-width',2*vectorScale);
      mark.style.display=f===0?'none':'';
    });
    $(`${prefix}-readout`).textContent=`Mittelpunktabstand r = ${r.toFixed(2).replace('.',',')} m; m₁ = ${simulation.m1.toFixed(1).replace('.',',')} t; m₂ = ${simulation.m2.toFixed(1).replace('.',',')} t`;
    $(`${prefix}-force1-readout`).innerHTML=`${vectorHtml(2)}: Kraft auf Masse 1 durch Masse 2: ${micro.toFixed(2).replace('.',',')} µN`;
    $(`${prefix}-force2-readout`).innerHTML=`${vectorHtml(1)}: Kraft auf Masse 2 durch Masse 1: ${micro.toFixed(2).replace('.',',')} µN`;
  }
}
function setupSimulation(){
  $('simulation-view-3').innerHTML=simulationMarkup('sim3');
  $('simulation-view-4').innerHTML=simulationMarkup('sim4');
  for(const prefix of ['sim3','sim4']){
    const scene=$(`${prefix}-svg`);scene.setAttribute('role','group');
    for(const suffix of ['m1','m2','distance']){
      const input=$(`${prefix}-${suffix}`),label=document.querySelector(`label[for="${prefix}-${suffix}"]`);
      if(suffix==='distance')label.firstChild.textContent='Mittelpunktabstand r: ';
      const pair=document.createElement('div');pair.className='grav-control-pair';
      label.before(pair);pair.append(label,input);
      if(suffix==='distance')pair.append($(`${prefix}-root`).querySelector('.grav-distance-note'));
    }
    let activeDrag=null;
    const endDrag=()=>{
      if(!activeDrag)return;
      clearInterval(activeDrag.timer);
      const {body,pointerId}=activeDrag;
      activeDrag=null;delete scene.dataset.dragActive;
      try{if(body.hasPointerCapture(pointerId))body.releasePointerCapture(pointerId);}catch{}
      if(simulationFrame){cancelAnimationFrame(simulationFrame);simulationFrame=0;}
      updateSimulation();progress?.save();
    };
    document.addEventListener('visibilitychange',()=>{if(document.hidden)endDrag();});
    window.addEventListener('resize',endDrag);
    document.querySelectorAll('[data-physics-tab]').forEach(tab=>tab.addEventListener('click',endDrag));
    scene.insertBefore($(`${prefix}-force1`),$(`${prefix}-center1`));
    scene.insertBefore($(`${prefix}-force2`),$(`${prefix}-center1`));
    for(const [index,which] of [[2,1],[1,2]]){
      const label=document.createElementNS('http://www.w3.org/2000/svg','text');
      label.id=`${prefix}-vector${index}`;
      label.classList.add('grav-force-label',`grav-force-label${which}`);
      label.setAttribute('text-anchor','middle');
      label.setAttribute('role','img');
      label.setAttribute('aria-label',index===2?'Vektor F mit Index 2, Kraft auf Masse 1 durch Masse 2':'Vektor F mit Index 1, Kraft auf Masse 2 durch Masse 1');
      const letter=document.createElementNS('http://www.w3.org/2000/svg','tspan');letter.textContent='F';
      const sub=document.createElementNS('http://www.w3.org/2000/svg','tspan');sub.setAttribute('baseline-shift','sub');sub.setAttribute('font-size','12');sub.textContent=String(index);
      label.append(letter,sub);
      const mark=document.createElementNS('http://www.w3.org/2000/svg','path');
      mark.id=`${prefix}-vector${index}-mark`;mark.classList.add('grav-vector-arrowmark',`grav-vector-arrowmark${which}`);
      mark.setAttribute('aria-hidden','true');
      scene.insertBefore(mark,$(`${prefix}-hit1`));
      scene.insertBefore(label,$(`${prefix}-hit1`));
    }
    for(const which of [1,2]){
      $(`${prefix}-m${which}`).addEventListener('input',event=>{simulation[`m${which}`]=Number(event.target.value);updateSimulation();progress?.save();});
      const body=$(`${prefix}-hit${which}`),svg=$(`${prefix}-svg`);
      body.addEventListener('pointerdown',event=>{
        if(event.button!==0)return;
        endDrag();
        const inverse=screenInverse(svg);if(!inverse){requestSimulationUpdate();return;}
        try{body.setPointerCapture(event.pointerId);}catch{return;}
        scene.dataset.dragActive='true';
        activeDrag={body,pointerId:event.pointerId,inverse,timer:setInterval(()=>progress?.save(),700)};
        event.preventDefault();
      });
      body.addEventListener('pointermove',event=>{
        if(!activeDrag||activeDrag.body!==body||activeDrag.pointerId!==event.pointerId)return;
        const p=eventPoint(svg,event,activeDrag.inverse);if(!p){requestSimulationUpdate();return;}
        simulation=moveBody(simulation,which,(p.x-320)/WORLD_SCALE,(220-p.y)/WORLD_SCALE);
        requestSimulationUpdate();
      });
      for(const type of ['pointerup','pointercancel','lostpointercapture'])body.addEventListener(type,event=>{if(activeDrag?.pointerId===event.pointerId)endDrag();});
      body.addEventListener('keydown',event=>{
        const dir={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,1],ArrowDown:[0,-1]}[event.key];if(!dir)return;
        event.preventDefault();const delta=event.shiftKey?0.5:0.1;
        simulation=moveBody(simulation,which,simulation[`x${which}`]+dir[0]*delta,simulation[`y${which}`]+dir[1]*delta);updateSimulation();progress?.save();
      });
    }
    const dist=$(`${prefix}-distance`);
    dist.addEventListener('input',()=>{
      const next=setDistance(simulation,Number(dist.value));
      if(next){simulation=next;$(`${prefix}-distance-feedback`).hidden=true;updateSimulation();progress?.save();}
      else {feedback(`${prefix}-distance-feedback`,'error','Der Mittelpunktabstand muss zwischen 0,5 m und 12 m liegen.');updateSimulation();}
    });
    $(`${prefix}-reset`).addEventListener('click',()=>{simulation={...INITIAL};updateSimulation();progress?.save();});
  }
  document.querySelectorAll('.grav-transfer[data-row][data-index]').forEach(button=>button.addEventListener('click',()=>{
    const key=button.dataset.row,index=Number(button.dataset.index),row=rows[key],expected=row.values[index];
    const ok=key==='A'?Math.abs(simulation.m1-expected)<1e-8&&Math.abs(simulation.m2-4.5)<1e-8&&Math.abs(distance(simulation)-7)<1e-8
      :key==='B'?Math.abs(simulation.m2-expected)<1e-8&&Math.abs(simulation.m1-5)<1e-8&&Math.abs(distance(simulation)-7)<1e-8
      :Math.abs(distance(simulation)-expected)<1e-8&&Math.abs(simulation.m1-3)<1e-8&&Math.abs(simulation.m2-3)<1e-8;
    if(!ok){feedback(`transfer-${key.toLowerCase()}`,'error','Stelle zuerst die Vorgabe dieser Zeile ein und halte die beiden anderen Größen konstant.');return;}
    $(`measure-${key.toLowerCase()}-${index}`).value=(force(simulation)*1e6).toFixed(2).replace('.',',');
    $(`measure-${key.toLowerCase()}-${index}`).dispatchEvent(new Event('input',{bubbles:true}));
    $(`transfer-${key.toLowerCase()}`).hidden=true;
  }));
  updateSimulation();
}

const solutionIdeas={
  N1:'Die gravitative Anziehung auf den Mond zeigt zur Erde und übernimmt die Rolle der Zentripetalkraft.',
  P1:'Die gravitative Anziehung auf den Mond zeigt zur Erde und übernimmt die Rolle der Zentripetalkraft.',
  P2:'Newton meint mit ‚Schwere‘ die allgemeine Anziehung aller Körper mit Masse.',
  P3:'Newton meint mit ‚Schwere‘ die allgemeine Anziehung aller Körper mit Masse.',
  P4:'Bei 2r bleibt F/4, bei 3r F/9.',
  S1:'Der Vektor F mit Index 2 wirkt auf m₁ durch m₂, der Vektor F mit Index 1 auf m₂ durch m₁. Die Kräfte greifen an verschiedenen Mittelpunkten an, sind gleich groß und entgegengesetzt gerichtet.',
  S2:'Die Kräfte greifen an verschiedenen Körpern an, sind gleich groß und entgegengesetzt; die größere Masse wird bei gleicher Kraft weniger beschleunigt.',
  M0:'F ist proportional zu m₁ und m₂ sowie umgekehrt proportional zu r²; beim Verdoppeln beider Massen entsteht 4F, beim Verdoppeln des Abstands F/4.',
  M1A:'21,45 | 24,52 | 27,58 | 30,65 µN',M1B:'23,84 | 27,24 | 30,65 | 34,05 µN',M1C:'19,86 | 16,69 | 12,26 | 10,68 µN',
  M2:'F ist proportional zu m₁ und m₂ sowie umgekehrt proportional zu r²; beim Verdoppeln beider Massen entsteht 4F, beim Verdoppeln des Abstands F/4.',
  M3:'Aus einer simulierten Messreihe folgt ungefähr G=6,67·10⁻¹¹ N·m²/kg²; der Wert war in der Simulation bereits hinterlegt.',
  M4:'Die Cavendish-Zahlen ergeben etwa 6,75·10⁻¹¹ N·m²/kg², passend zur begrenzten Genauigkeit der historischen Angaben.',
  A1:'Auf den Apfel wirkt die Kraft von der Erde auf den Apfel. Auf die Erde wirkt die Kraft vom Apfel auf die Erde. Beide Kräfte haben denselben Betrag; deshalb genügt eine Kraftberechnung. Wegen der viel größeren Erdmasse führt derselbe Kraftbetrag bei der Erde zu einer viel kleineren Beschleunigung als beim Apfel. Ergebnisse: F ≈ 1,5 N; a_A ≈ 9,8 m/s²; a_E ≈ 2,5·10⁻²⁵ m/s².',
  A2:'In 400 km Höhe beträgt die Gravitationskraft etwa 5,4·10² N, am Boden etwa 6,1·10² N. Für den Orbitabstand werden Erdradius und Höhe addiert.',
  A3:'Am Mond beträgt g etwa 1,626 m/s², ungefähr ein Sechstel des Erdwerts.',
  A4:'Der Marsradius beträgt aus diesen Angaben etwa 3,4·10³ km.',
  A5:'Bei gleichem g gilt {{R<sub>Merkur</sub>|R<sub>Mars</sub>}} = √({{M<sub>Merkur</sub>|M<sub>Mars</sub>}}) = √0,5 ≈ 0,707; das Verhältnis hat keine Einheit.'
};
function updateSummary(){
  if(typeof document==='undefined')return;
  const all=Object.keys(solutionIdeas).filter(id=>!['A3','A4','A5'].includes(id)).every(id=>completed.has(id));
  $('summary-pending').hidden=all;$('summary-content').hidden=!all;
  if(!all)return;
  const groupings=[['Newton und die Principia',['N1','P1','P2','P3','P4']],['Kräftebild',['S1','S2']],['Messreihen und Gesetz',['M0','M1A','M1B','M1C','M2','M3','M4']],['Anwendungen',['A1','A2']],['Für die Schnellen',['A3','A4','A5'].filter(id=>completed.has(id))]];
  const root=$('summary-content');root.replaceChildren();
  const memory=document.createElement('article');memory.className='physics-task-card';memory.innerHTML=`<h3>Merksätze</h3><p>Alle Körper mit Masse ziehen einander an. Die beiden Kräfte sind gleich groß, entgegengesetzt gerichtet und wirken auf verschiedene Körper.</p><p>Bei einer durch Gravitation bewirkten Kreisbewegung ist die Gravitationskraft die benötigte Zentripetalkraft; beide Kräfte werden nicht addiert.</p><p>Die Gravitationskraft wächst proportional mit jeder der beiden Massen und nimmt mit dem Quadrat des Mittelpunktabstands ab.</p><p>Für den Kraftbetrag gilt F<sub>G</sub> = G·<span class="physics-fraction"><span class="physics-fraction__numerator">m₁·m₂</span><span class="physics-fraction__denominator">r²</span></span>. Auf der Oberfläche eines Himmelskörpers gilt g=G·<span class="physics-fraction"><span class="physics-fraction__numerator">M</span><span class="physics-fraction__denominator">R²</span></span>.</p>`;root.append(memory);
  groupings.forEach(([heading,ids])=>{
    if(!ids.length)return;
    const details=document.createElement('details');details.className='physics-task-card';
    const summary=document.createElement('summary');summary.textContent=heading;details.append(summary);
    ids.forEach(id=>{
      const original=$(`card-${id.toLowerCase()}`),entry=document.createElement('div');entry.className='grav-summary-entry';
      const title=original.querySelector('h3')?.textContent||id,prompt=original.querySelector('.task-prompt')?.innerHTML||'';
      const fields=[...original.querySelectorAll('.task-fields input, .task-fields select')].filter(el=>!el.id.endsWith('-unit'));
      const board=wordBoards.get(id);
      const own=id==='A1'
        ? [...fields.map(el=>el.tagName==='SELECT'?el.selectedOptions[0]?.textContent:`${el.value}${$(el.id+'-unit')?.value?' '+$(el.id+'-unit').value:''}`),$('a1-explanation-answer').value].filter(Boolean).join(' · ')
        : id==='S1'
        ? [...original.querySelectorAll('.grav-s1-choices input:checked')].map(el=>el.closest('label')?.textContent.trim()).join(' · ')
        : board ? [
          ...((id==='M3'||id==='M4')?[`${$(`${id.toLowerCase()}-g`).value} ${$(`${id.toLowerCase()}-g-unit`).value}`.trim()]:[]),
          ...board.instances.map(key=>board.cardLabels.get(key)||'—')
        ].join(' · ')
        : fields.map(el=>el.tagName==='SELECT'?el.selectedOptions[0]?.textContent:`${el.value}${$(el.id+'-unit')?.value?' '+$(el.id+'-unit').value:''}`).join(' · ');
      entry.innerHTML=`<h4>${title}</h4><p>${prompt}</p><p><strong>Deine Eingabe:</strong> <span data-own-answer></span></p><p><strong>Lösungsidee:</strong> ${htmlText(solutionIdeas[id])}</p>`;
      entry.querySelector('[data-own-answer]').textContent=own;
      if(id==='S1'){
        const answer=entry.querySelector('[data-own-answer]');answer.replaceChildren();
        [...original.querySelectorAll('.grav-s1-choices input:checked')].forEach((input,index)=>{
          if(index)answer.append(document.createTextNode(' · '));
          answer.append(input.closest('label').querySelector('span').cloneNode(true));
        });
      }
      if(id==='S1')entry.querySelector('p:last-child').innerHTML=`<strong>Lösungsidee:</strong> ${vectorHtml(2)} auf m₁ durch m₂; ${vectorHtml(1)} auf m₂ durch m₁. Die Kräfte greifen an verschiedenen Mittelpunkten an, sind gleich groß und entgegengesetzt gerichtet.`;
      if(id==='M2'){
        const observations=document.createElement('p');observations.className='m2-summary-observations';
        observations.textContent=m2Cases.map(item=>`${item.label}: ${validM2Observation(item,m2Observations[item.id])?(m2Observations[item.id].force*1e6).toFixed(2).replace('.',',')+' µN':'—'}`).join(' · ');
        entry.append(observations);
      }
      details.append(entry);
    });root.append(details);
  });
  const sim=document.createElement('p');sim.textContent=`Startfall: 3,5 t und 4,5 t im Mittelpunktabstand 7,0 m; Kraft auf beide Körper 21,45 µN. Aktuelle Simulation: ${simulation.m1.toFixed(1).replace('.',',')} t, ${simulation.m2.toFixed(1).replace('.',',')} t, r=${distance(simulation).toFixed(2).replace('.',',')} m.`;root.append(sim);
}

const quizData=[
  ['Welche Aussagen beschreiben die gravitative Wechselwirkung?',[['a','Beide Kräfte sind gleich groß.'],['b','Sie wirken auf verschiedene Körper.'],['c','Der schwere Körper erfährt stets die größere Kraft.'],['d','Die Richtungen sind entgegengesetzt.']],['a','b','d'],'Richtig. Kräftepaar, Angriffskörper und Richtungen stimmen.','Teilweise korrekt. Prüfe noch alle Merkmale des Kräftepaars.','Noch nicht korrekt. Gleiche Kräfte bedeuten nicht gleiche Beschleunigungen.'],
  ['Was geschieht bei unverändertem Abstand?',[['a','Verdoppeltes m₁ verdoppelt F.'],['b','Verdoppelte beide Massen vervierfachen F.'],['c','Halbiertes m₂ verdoppelt F.'],['d','Die Masse hat keinen Einfluss.']],['a','b'],'Richtig. Jede Masse wirkt als eigener Faktor.','Teilweise korrekt. Berücksichtige beide Massenfaktoren.','Noch nicht korrekt. Lies die beiden Faktoren m₁ und m₂ im Gesetz.'],
  ['Was gilt für den Abstand r?',[['a','Er wird zwischen den Schwerpunkten gemessen.'],['b','Bei 2r bleibt ein Viertel der Kraft.'],['c','Der Abstand beginnt an den Kreisrändern.'],['d','Bei 3r bleibt ein Drittel.']],['a','b'],'Richtig. Mittelpunktabstand und quadratische Abnahme passen.','Teilweise korrekt. Prüfe noch die Quadratur des Abstandsfaktors.','Noch nicht korrekt. Die symbolischen Kreisradien sind nicht der Abstand r.'],
  ['Welche Kraft hält den Mond auf einer annähernden Kreisbahn?',[['a','Die Erdanziehung kann die Rolle der Zentripetalkraft übernehmen.'],['b','Erdanziehung und Zentripetalkraft werden addiert.'],['c','Nur eine nach außen gerichtete Kraft hält ihn auf der Bahn.']],['a'],'Richtig. Gravitation ist hier die zur Bahnmitte gerichtete Kraft.','Teilweise korrekt. Prüfe, ob wirklich eine zweite Kraft addiert wird.','Noch nicht korrekt. Eine Kraft kann die Rolle der Zentripetalkraft erfüllen.'],
  ['Welche Aussagen folgen aus A2?',[['a','In 400 km Höhe ist die Gravitationskraft kleiner als am Boden.'],['b','Auch in 400 km Höhe wirkt auf die Astronautin eine Gravitationskraft.'],['c','Die Höhe von 400 km ist bereits der Abstand vom Erdmittelpunkt.'],['d','Für den Abstand im Orbit muss man Erdradius und Höhe addieren.']],['a','b','d'],'Richtig. Die Kraft nimmt mit dem Mittelpunktabstand ab und bleibt im Orbit von null verschieden.','Teilweise korrekt. Prüfe noch den Mittelpunktabstand und vergleiche die beiden Kraftwerte.','Noch nicht korrekt. Die 400 km werden zum Erdradius addiert; die berechnete Kraft im Orbit ist nicht null.'],
  ['Was folgt aus dem Gravitationsgesetz für einen Himmelskörper?',[['a','Bei gleicher Masse führt kleinerer Radius zu größerem Oberflächen-g.'],['b','Für g ist die Masse eines fallenden Probekörpers nicht entscheidend.'],['c','Halbe Himmelskörpermasse erzwingt bei gleichem g halben Radius.'],['d','G lässt sich durch die hinterlegte Simulation unabhängig bestimmen.']],['a','b'],'Richtig. Das Oberflächen-g hängt von M und R² ab.','Teilweise korrekt. Prüfe die Probemasse und das Quadrat des Radius.','Noch nicht korrekt. Vergleiche g=G·M/R² mit der Simulation.']
];
function buildQuiz(){
  const form=$('final-quiz'),questions=[];
  quizData.forEach(([question,options,right,success,partial,wrong],i)=>{
    const n=i+1,fieldset=document.createElement('fieldset');fieldset.id=`quiz-q${n}`;fieldset.className='physics-quiz-question quiz-question';
    fieldset.innerHTML=`<legend>Frage ${n} · ${question}</legend><div class="quiz-options">${options.map(([value,text])=>`<label class="quiz-option"><input id="quiz-q${n}-${value}" type="checkbox" name="quiz-q${n}" value="${value}"><span>${text}</span></label>`).join('')}</div>`;form.append(fieldset);
    const feedbackNode=document.createElement('p');feedbackNode.id=`quiz-q${n}-feedback`;feedbackNode.className='physics-feedback';feedbackNode.role='status';feedbackNode.setAttribute('aria-live','polite');feedbackNode.hidden=true;fieldset.append(feedbackNode);
    questions.push({fieldset,solution:right,success,feedback:feedbackNode,check:()=>{
      const selected=[...fieldset.querySelectorAll('input:checked')].map(el=>el.value);
      const hits=selected.filter(x=>right.includes(x)).length,extras=selected.length-hits;
      if(hits===right.length&&extras===0)return {result:'correct',text:success};
      if(hits)return {result:'mixed',text:partial};
      return {result:'wrong',text:wrong};
    }});
  });
  const show=correct=>feedback('final-quiz-feedback',correct===6?'success':'partial',correct===6?'Alle sechs Quizfragen sind richtig.':'Prüfe die Rückmeldungen unter den einzelnen Fragen und versuche es erneut.');
  quizChecks=window.addQuizQuestionChecks({questions,buttonClass:'physics-primary-button',feedbackClass:'physics-feedback',levels:{high:'success',medium:'partial',low:'error'},onAllCorrect:()=>show(6)});
  $('check-final-quiz').addEventListener('click',()=>show(quizChecks.checkAll()));
}

if(typeof document!=='undefined'){
  const stepTabs = setupPhysicsStepTabs();
  document.querySelectorAll("[data-next-tab]").forEach(button=>{
    button.addEventListener("click",()=>{
      stepTabs.goToTab(button.dataset.nextTab,true);
      document.querySelector(".physics-step-tabs")?.scrollIntoView({behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"start"});
    });
  });
  buildSources();buildSimulationTasks();buildLaw();buildApplications();buildQuiz();setupSimulation();
  const invalidate=event=>{
    const card=event.target.closest?.('.physics-task-card[id^="card-"]');if(!card)return;
    const id=card.id.slice(5).toUpperCase();
    if(id==='S1')s1Checked=false;
    const numeric=numericCards.get(id);
    if(numeric){
      const changed=event.target.id;
      for(const [suffix] of numeric.numbers)if(changed===`${id.toLowerCase()}-${suffix}`||changed===`${id.toLowerCase()}-${suffix}-unit`){
        numeric.numberPassed=false;numeric.numberChecks[suffix]=false;
        if(numeric.separateNumbers)$(`feedback-${id.toLowerCase()}-${suffix}`).hidden=true;
        else $(`feedback-${id.toLowerCase()}`).hidden=true;
      }
      for(const [suffix] of numeric.choices)if(changed===`${id.toLowerCase()}-${suffix}`){
        numeric.choicePassed[suffix]=false;$(`feedback-${id.toLowerCase()}-${suffix}`).hidden=true;
      }
    }else{
      const result=$(`feedback-${id.toLowerCase()}`);if(result)result.hidden=true;
    }
    if(!completed.has(id))return;
    completed.delete(id);
    if(id==='M0') ['M1A','M1B','M1C','M2','M3','M4'].forEach(x=>completed.delete(x));
    else if(id.startsWith('M1')) ['M2','M3','M4'].forEach(x=>completed.delete(x));
    else if(id==='M2') ['M3','M4'].forEach(x=>completed.delete(x));
    lawStepUnlock();updateSummary();progress?.save();
  };
  document.addEventListener('input',invalidate);document.addEventListener('change',invalidate);
  $('tab-summary').addEventListener('click',updateSummary);
  ['tab-simulation','tab-law'].forEach(id=>$(id).addEventListener('click',()=>requestAnimationFrame(updateSimulation)));
  window.addEventListener('resize',updateSimulation);
  progress=createPhysicsTaskProgress('aufgabe8');
  setupApplicationStepHelps(progress);
  setupPhysicsSemanticTask({
    answerId:'a1-explanation-answer',buttonId:'check-a1-explanation',feedbackId:'a1-explanation-feedback',countId:'a1-explanation-count',
    taskId:'ph11-a8-apfel-erde-kraft-beschleunigung',serverUrl:undefined,minimumLength:30,fallbackMaxPoints:2,
    buttonText:'Erklärung prüfen',checkingText:'Erklärung wird geprüft …',retryText:'Erklärung erneut prüfen',
    shortAnswerHint:'Erkläre in eigenen Worten, wie die Kräfte und die Massen mit den beiden Beschleunigungen zusammenhängen.',
    shortAnswerMessage:'Erkläre in eigenen Worten, wie die Kräfte und die Massen mit den beiden Beschleunigungen zusammenhängen.',
    technicalErrorMessage:'Die Erklärung konnte gerade nicht geprüft werden. Bitte versuche es erneut.',
    onInput:()=>{
      a1Review.passed=false;a1Review.answer='';
      if(completed.delete('A1'))updateSummary();
      progress.save();
    },
    onEvaluation:(result,answer)=>{
      const valid=Number(result?.points)===2&&Number(result?.maxPoints)===2;
      a1Review.passed=valid;a1Review.answer=valid?answer:'';
      const numeric=numericCards.get('A1');
      if(valid&&numeric?.numberPassed)finish('A1');
      else {completed.delete('A1');updateSummary();progress.save();}
    },
    onError:()=>{
      a1Review.passed=false;a1Review.answer='';completed.delete('A1');updateSummary();progress.save();
    }
  });
  progress.registerPart('simulation',()=>({...simulation}),saved=>{if(validState(saved)){simulation={...saved};updateSimulation();}});
  progress.registerPart('m2-observations',()=>Object.fromEntries(m2Cases.filter(item=>validM2Observation(item,m2Observations[item.id])).map(item=>[item.id,{...m2Observations[item.id]}])),saved=>{
    m2Cases.forEach(item=>{delete m2Observations[item.id];if(validM2Observation(item,saved?.[item.id]))m2Observations[item.id]={...saved[item.id]};});
    renderM2Observations();
  });
  progress.registerPart('word-cards',()=>Object.fromEntries([...wordBoards].map(([id,board])=>[id,[...board.instances]])),saved=>{
    for(const [id,board] of wordBoards){
      const candidate=Array.isArray(saved?.[id])&&saved[id].length===board.values.length?saved[id]:board.controls.map(control=>control.value);
      board.setValues(candidate);
    }
  });
  progress.registerPart('s1-checked',()=>s1Checked,saved=>{
    const selected=[...$('card-s1').querySelectorAll('.grav-s1-choices input:checked')].map(input=>Number(input.value));
    s1Checked=saved===true&&selected.length===3&&[1,2,3].every(value=>selected.includes(value));
  });
  progress.registerPart('a1-semantic-review',()=>({version:a1Review.version,passed:a1Review.passed,answer:a1Review.answer}),saved=>{
    const current=$('a1-explanation-answer').value;
    const valid=saved?.version===a1Review.version&&saved?.passed===true&&typeof saved.answer==='string'&&saved.answer.length>=30&&saved.answer===current;
    a1Review.passed=valid;a1Review.answer=valid?current:'';
  });
  progress.registerPart('completed',()=>[...completed],saved=>{if(Array.isArray(saved)){const allowed=new Set(Object.keys(solutionIdeas));saved.forEach(id=>{if(id==='S1'||numericCards.has(id))return;const board=wordBoards.get(id);if(allowed.has(id)&&(!board||board.values.every((value,index)=>value===board.answers[index]))&&(id!=='M2'||allM2Observations()&&m2SelectionsCorrect()))completed.add(id);});}if(s1Checked)completed.add('S1');if(!completed.has('M2')){completed.delete('M3');completed.delete('M4');}lawStepUnlock();updateSummary();$('modern-note').hidden=!completed.has('P1');$('m4-note').hidden=!completed.has('M4');});
  progress.registerPart('numeric-checks',()=>Object.fromEntries([...numericCards].map(([id,state])=>[id,{numberPassed:state.numberPassed,numberChecks:{...state.numberChecks},choicePassed:{...state.choicePassed}}])),saved=>{
    if(!saved||typeof saved!=='object'||Array.isArray(saved))return;
    for(const [id,state] of numericCards){
      const record=saved[id];if(!record||typeof record!=='object')continue;
      for(const [suffix,label,target,digits,kind] of state.numbers){
        const valid=checkQuantity($(`${id.toLowerCase()}-${suffix}`).value,$(`${id.toLowerCase()}-${suffix}-unit`).value,{target,digits,units:unitSets[kind],tolerance:id==='M3'?0.01e-11:0})==='correct';
        state.numberChecks[suffix]=(typeof record.numberChecks==='object'&&record.numberChecks!==null?record.numberChecks[suffix]===true:record.numberPassed===true)&&valid;
      }
      state.numberPassed=state.numbers.every(([suffix])=>state.numberChecks[suffix]);
      for(const [suffix,label,options,right] of state.choices)state.choicePassed[suffix]=record.choicePassed?.[suffix]===true&&$(`${id.toLowerCase()}-${suffix}`).value===right&&(!wordBoards.has(id)||wordBoards.get(id).values[0]===right);
      const semanticReady=id!=='A1'||(a1Review.passed&&a1Review.answer===$('a1-explanation-answer').value);
      if(state.numberPassed&&state.choices.every(([suffix])=>state.choicePassed[suffix])&&semanticReady&&(!(id==='M3'||id==='M4')||completed.has('M2')))completed.add(id);
    }
    updateSummary();$('m4-note').hidden=!completed.has('M4');
  });
  progress.registerPart('quiz-status',()=>quizData.map((_,i)=>!$(`quiz-q${i+1}-feedback`).hidden),saved=>{
    if(!Array.isArray(saved)||saved.length!==quizData.length)return;
    saved.forEach((checked,i)=>{if(checked===true)quizChecks.questions[i].showResult();});
    if(saved.every(x=>x===true)&&quizChecks.questions.every((item,i)=>{
      const chosen=[...item.fieldset.querySelectorAll('input:checked')].map(x=>x.value);
      const right=quizData[i][2];return chosen.length===right.length&&chosen.every(x=>right.includes(x));
    }))feedback('final-quiz-feedback','success','Alle sechs Quizfragen sind richtig.');
  });
  progress.restore();lawStepUnlock();updateSummary();
}
