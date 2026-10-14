import {calculate,normaliseNumber} from '../logic/perceptron.mjs';
import {parseLinearRelation as parse,equivalent,countMatching} from '../logic/linear-inequality.mjs';
import {numberMatches,runEpoch} from '../logic/perceptron.mjs';
import {evaluateSemanticAnswer} from './semantic-answer.mjs?v=20261010-scaleway';
import {unlockSolution} from '../../../../klasse-10/1-Datenbanken/tab-navigation.mjs';

const KEY='informatik11-perzeptron-aufgabe5-2-v1';
const SERVER_URL='https://unterrichtkiichezbn4-ki-auswertung.functions.fnc.fr-par.scw.cloud/';
const IDS=['structure','decide','one','two','three','learn','seven','eight'];
const ROWS=[{name:'A',x:0,y:0,target:0},{name:'D',x:0,y:1,target:0},{name:'B',x:1,y:0,target:1},{name:'C',x:1,y:1,target:1}];
const TARGET=parse('4x1+2x2>3');
const FIXED={w1:4,w2:2,s:3};
const START={one:{w1:1.5,w2:-2.5,s:3.9},two:{w1:3,w2:2.5,s:-.5}};
const LIMITS={one:{w1:[-4,3.5,.5],w2:[-4,3.5,.5],s:[-4,4,.1]},two:{w1:[-4,4,.5],w2:[-4,4,.5],s:[-4,2.1,.1]}};
const PROBES=[.5,1,1.5].map((y,i)=>({name:['unten','Grenze','oben'][i],x:.25,y}));
const FLAGS=['structure','decide','one','two','three-rows','three-probes','three-condition','learn-1','learn-2','learn-3','learn-4'];
const REQUIRED=FLAGS;
const $=selector=>document.querySelector(selector);
const value=id=>$('#'+id).value;
const fmt=n=>Number.isInteger(n)?String(n):String(Math.round(n*1e9)/1e9).replace('.',',');
let checked=Object.fromEntries(FLAGS.map(id=>[id,false]));
let active='structure',quizPassed=false;
let quizControl=null;
let quizChecked=Array(6).fill(false);
let fields=[];
const helpDetails=[...document.querySelectorAll('.step-panel details')];
let model={one:{...START.one},two:{...START.two}};
let selectedRows={one:0,two:0,three:'row-0'};
let state={signalStep:-1,signalObserved:false};
const epoch=runEpoch();
const SIGNAL_STEPS=[
  {title:'Eingaben',targets:['inputs'],text:'Die Eingaben beschreiben den Hasen: x₁ = 2 und x₂ = 4.'},
  {title:'Gewichte',targets:['inputs','weights'],text:'Die Gewichte legen den Einfluss fest: w₁ = −1 und w₂ = 2.'},
  {title:'Produkte',targets:['weights','products'],text:'(−1)·2 = −2 und 2·4 = 8.'},
  {title:'Summe',targets:['products','sum'],text:'a = −2 + 8 = 6.'},
  {title:'Vergleich',targets:['sum','comparison'],text:'6 > 3.'},
  {title:'Treppenfunktion',targets:['comparison','activation'],text:'Bei a > θ gibt die Funktion 1 aus, sonst 0.'},
  {title:'Ausgabe',targets:['activation','output'],text:'Ausgabe 1 bedeutet hier ungefährlich.'}
];
const FIELD_LABELS={product1:'Beitrag w₁ · x₁',product2:'Beitrag w₂ · x₂',sum:'gewichtete Summe a',comparison:'Vergleich a und θ',output:'Ausgabe f(a)',class:'Klasse',delta:'Fehler δ',w1:'w₁ nachher',w2:'w₂ nachher',threshold:'θ nachher'};

function feedbackElement(id) { return $('#feedback-'+id)||$('#'+id+'-feedback'); }
function showFeedback(id,text,level='error') { const el=feedbackElement(id); el.hidden=false; el.textContent=text; el.className='feedback '+level; }
function clearFeedback(id) { const el=feedbackElement(id); if(el){el.hidden=true;el.textContent='';el.className='feedback';} }
function mark(id,valid) { checked[id]=!!valid; save(); updateProgress(); if(id.startsWith('three-'))renderNeuron('three'); }
function invalidate(id) { checked[id]=false; clearFeedback(id); save(); updateProgress(); if(id.startsWith('three-'))renderNeuron('three'); }
function getNum(id) { const raw=value(id).trim(); if(!raw) return null; const n=normaliseNumber(raw); return n!==null&&Number.isFinite(n)?n:null; }
function parameters(prefix) { if(prefix==='one'||prefix==='two')return model[prefix]; const w1=getNum(prefix+'-w1'),w2=getNum(prefix+'-w2'),s=getNum(prefix+'-s'); return [w1,w2,s].every(Number.isFinite)?{w1,w2,s}:null; }
function validParameter(value,bounds) {return typeof value==='number'&&Number.isFinite(value)&&value>=bounds[0]&&value<=bounds[1];}
function restoreParameters(source,prefix) {if(!source||typeof source!=='object')return null;const next={};for(const key of ['w1','w2','s']) {const value=source[key];if(!validParameter(value,LIMITS[prefix][key]))return null;next[key]=value;}return next;}
function nextParameter(value,[min,max,step],direction) {const unit=Math.round(1/step);let next=direction>0?Math.floor(value*unit+1e-9)+1:Math.ceil(value*unit-1e-9)-1;return Math.min(max,Math.max(min,next/unit));}
function rowOutputs(rows,params) { return rows.map(row=>({...row,...calculate({x1:row.x,x2:row.y,w1:params.w1,w2:params.w2,threshold:params.s})})); }
function selected(select) { return select.value===''?null:Number(select.value); }
function readSelects(selector) { return [...document.querySelectorAll(selector)].map(selected); }
function countAnswers(values,expected) { return values.filter((n,i)=>n===expected[i]).length; }
function updateProgress() {
  const n=REQUIRED.filter(id=>checked[id]).length;
  $('#progress').textContent=`${n} von ${REQUIRED.length} Kern-Teilaufgaben richtig geprüft.`;
  renderSummary();
}
function save() {
  try {
    const controls=Object.fromEntries(fields.map(el=>[fieldKey(el),el.type==='checkbox'||el.type==='radio'?el.checked:el.value]));
    localStorage.setItem(KEY,JSON.stringify({version:1,controls,checked,active,quizPassed,quizChecked,helps:helpDetails.map(el=>el.open),parameters:model,selectedRows,signalStep:state.signalStep,signalObserved:state.signalObserved}));
  } catch { $('#save-status').textContent='Der Bearbeitungsstand konnte nicht lokal gespeichert werden.'; }
}
function fieldKey(el) { return el.id || `${el.closest('fieldset')?.id||el.name}:${el.value}`; }
function validSaved(value) { return typeof value==='string'; }
function load() {
  let data; try {data=JSON.parse(localStorage.getItem(KEY)||'null');} catch {return;}
  if(!data||data.version!==1||!data.controls||typeof data.controls!=='object') return;
  for(const el of fields) {
    const key=fieldKey(el), saved=data.controls[key];
    if(el.type==='checkbox'||el.type==='radio') { if(typeof saved==='boolean') el.checked=saved; }
    else if(validSaved(saved)) {
      if(el.tagName==='SELECT'&&![...el.options].some(opt=>opt.value===saved)) continue;
      if(el.type==='number'&&saved!==''&&normaliseNumber(saved)===null) continue;
      el.value=saved;
    }
  }
  for(const prefix of ['one','two']) {
    const old={};for(const key of ['w1','w2','s'])old[key]=normaliseNumber(data.controls[`${prefix}-${key}`]);
    model[prefix]=restoreParameters(data.parameters?.[prefix],prefix)||restoreParameters(old,prefix)||{...START[prefix]};
  }
  if(data.selectedRows&&typeof data.selectedRows==='object') {
    for(const prefix of ['one','two']) if(Number.isInteger(data.selectedRows[prefix])&&data.selectedRows[prefix]>=0&&data.selectedRows[prefix]<ROWS.length)selectedRows[prefix]=data.selectedRows[prefix];
    if(/^row-[0-3]$/.test(data.selectedRows.three)||(['probe-0','probe-1','probe-2'].includes(data.selectedRows.three)&&data.checked?.['three-rows']===true))selectedRows.three=data.selectedRows.three;
  }
  if(Number.isInteger(data.signalStep)&&data.signalStep>=-1&&data.signalStep<SIGNAL_STEPS.length)state.signalStep=data.signalStep;
  state.signalObserved=data.signalObserved===true||state.signalStep===SIGNAL_STEPS.length-1;
  if(Array.isArray(data.helps)) helpDetails.forEach((el,i)=>{if(typeof data.helps[i]==='boolean') el.open=data.helps[i];});
  if(IDS.includes(data.active)) active=data.active;
  // Gespeicherte Prüfzeichen gelten nur zusammen mit erneut geprüften aktuellen Antworten.
  if(data.checked&&typeof data.checked==='object') for(const id of FLAGS) if(data.checked[id]===true) {
    if(validateFlag(id))checked[id]=true;
  }
  for(let i=2;i<=4;i++)if(!checked['learn-'+(i-1)])checked['learn-'+i]=false;
  if(selectedRows.three.startsWith('probe')&&!checked['three-rows'])selectedRows.three='row-0';
  quizPassed=data.quizPassed===true&&quizChoicesCorrect();
  quizChecked=QUIZ.map((_,i)=>(quizPassed||data.quizChecked?.[i]===true)&&quizQuestionCorrect(i));
  $('#save-status').textContent='Dein Bearbeitungsstand wurde wiederhergestellt.';
}
function validateFlag(id) {
  if(id==='structure')return state.signalObserved;
  if(id==='decide')return decisionCorrect();
  if(id.startsWith('learn-'))return epochRowCorrect(Number(id.at(-1))-1);
  if(id==='one'||id==='two') { const p=parameters(id); return !!p&&rowOutputs(ROWS,p).every(row=>row.output===row.target); }
  if(id==='three-rows') return countAnswers(readSelects('.three-row-select'),[0,0,1,1])===4;
  if(id==='three-probes') return countAnswers(readSelects('.three-probe-select'),[0,0,1])===3;
  if(id==='three-condition') return equivalent(parse(value('three-condition'),{variables:'input'}),TARGET);
  return false;
}
function showStep(id,focus=false) {
  active=id;
  for(const name of IDS) {
    const tab=$('#tab-'+name),panel=$('#'+name),on=name===id;
    tab.setAttribute('aria-selected',String(on)); tab.tabIndex=on?0:-1;panel.hidden=!on;
  }
  if(focus) {$('#tab-'+id).focus();$('#'+id+' h2').focus();}
  save();updateProgress();
}
function setupTabs() {
  document.querySelectorAll('[data-tab]').forEach(tab=>{
    tab.addEventListener('click',()=>showStep(tab.dataset.tab));
    tab.addEventListener('keydown',event=>{
      const i=IDS.indexOf(tab.dataset.tab);let next;
      if(event.key==='ArrowRight')next=IDS[(i+1)%IDS.length];
      if(event.key==='ArrowLeft')next=IDS[(i+IDS.length-1)%IDS.length];
      if(event.key==='Home')next=IDS[0];if(event.key==='End')next=IDS.at(-1);
      if(next){event.preventDefault();showStep(next);$('#tab-'+next).focus();}
    });
  });
  IDS.slice(0,6).forEach((id,i)=>{const button=document.createElement('button');button.type='button';button.className='primary-button';button.textContent='Weiter';button.addEventListener('click',()=>showStep(IDS[i+1],true));$('#'+id+' .flow-navigation').append(button);});
  const next=document.createElement('button');next.type='button';next.className='primary-button';next.textContent='Zum Abschlussquiz';next.addEventListener('click',()=>showStep('eight',true));$('#seven .flow-navigation').append(next);
}
function buildTables() {
  for(const prefix of ['one','two']) $('#'+prefix+'-table').innerHTML=ROWS.map((row,i)=>`<tr><td><button class="secondary-button row-choice" type="button" data-row="${i}" aria-controls="${prefix}-neuron" aria-label="Eingaben x₁ = ${fmt(row.x)}, x₂ = ${fmt(row.y)} in das Perzeptron einsetzen">Einsetzen</button></td><td>${fmt(row.x)}</td><td>${fmt(row.y)}</td><td data-sum>–</td><td>${row.target}</td><td data-output>–</td></tr>`).join('');
  const select=(id,cls,label)=>`<select id="${id}" class="${cls}" aria-label="${label}"><option value="">–</option><option value="0">0</option><option value="1">1</option></select>`;
  $('#three-table').innerHTML=ROWS.map((row,i)=>`<tr><td><button class="secondary-button row-choice" type="button" data-row="row-${i}" aria-controls="three-neuron" aria-label="Eingaben von ${row.name}: x₁ = ${fmt(row.x)}, x₂ = ${fmt(row.y)} in das Perzeptron einsetzen">${row.name} einsetzen</button></td><td>${row.name}</td><td>${fmt(row.x)}</td><td>${fmt(row.y)}</td><td>${select('three-row-'+i,'three-row-select',`Ausgabe bei (${fmt(row.x)};${fmt(row.y)})`)}</td></tr>`).join('');
  $('#three-probe-table').innerHTML=PROBES.map((row,i)=>`<tr><td><button class="secondary-button row-choice" type="button" data-row="probe-${i}" aria-controls="three-neuron" aria-label="Eingaben x₁ = 0,25, x₂ = ${fmt(row.y)} in das Perzeptron einsetzen">Einsetzen</button></td><td>0,25</td><td>${fmt(row.y)}</td><td>${select('three-probe-'+i,'three-probe-select',`Ausgabe bei x₂ = ${fmt(row.y)}`)}</td></tr>`).join('');
}
function neuronMarkup(prefix) {
  const controls=key=>prefix==='three'?`<div class="neuron-control neuron-fixed-value" data-control="${key}"><span class="neuron-control-label">${key==='s'?'s':'w'+(key==='w1'?'₁':'₂')} =</span><output data-value="${key}"></output></div>`:`<div class="neuron-control" data-control="${key}"><span class="neuron-control-label">${key==='s'?'s':'w'+(key==='w1'?'₁':'₂')} =</span><button type="button" data-adjust="${key}:-1" aria-label="${key==='s'?'Schwellenwert s':'Gewicht w'+(key==='w1'?'₁':'₂')} verringern">−</button><output data-value="${key}"></output><button type="button" data-adjust="${key}:1" aria-label="${key==='s'?'Schwellenwert s':'Gewicht w'+(key==='w1'?'₁':'₂')} erhöhen">+</button></div>`;
  return `<figure class="neuron-figure"><div class="neuron-stage"><svg class="neuron-wires neuron-wires-desktop" viewBox="0 0 900 310" preserveAspectRatio="none" aria-hidden="true"><path d="M90 77.5 L288 77.5 L558 155 M90 232.5 L288 232.5 L558 155 M558 155 L792 155 M558 272.8 L558 155"/></svg><svg class="neuron-wires neuron-wires-mobile" viewBox="0 0 360 600" preserveAspectRatio="none" aria-hidden="true"><path d="M82 54 L82 180 M278 54 L278 180 M82 180 L180 324 M278 180 L180 324 M180 324 L180 528 M79 432 L180 324"/></svg><svg class="neuron-wires neuron-wires-narrow" viewBox="0 0 360 600" preserveAspectRatio="none" aria-hidden="true"><path d="M82 54 L82 180 M278 54 L278 180 M82 180 L180 324 M278 180 L180 324 M180 324 L180 528 M79 432 L180 324"/></svg><div class="neuron-input neuron-input-one" data-x1>x₁ = 0</div><div class="neuron-input neuron-input-two" data-x2>x₂ = 0</div><div class="neuron-weight neuron-weight-one">${controls('w1')}</div><div class="neuron-weight neuron-weight-two">${controls('w2')}</div><div class="neuron-core"><strong>Σ</strong><span data-sum>a = 0</span><span data-compare>a ? s</span></div><div class="neuron-threshold">${controls('s')}</div><div class="neuron-output" data-output>Ausgabe ?</div></div><figcaption><span data-input-status></span> <strong data-fire-status></strong></figcaption></figure>${prefix==='three'?'<div class="neuron-mode"><p id="three-mode-explain"></p></div>':''}`;
}
function currentThreeRow() {const [kind,index]=selectedRows.three.split('-');return kind==='probe'?PROBES[Number(index)]:ROWS[Number(index)];}
function renderNeuron(prefix) {
  const root=$('#'+prefix+'-neuron');if(!root||!root.firstElementChild)return;
  const p=prefix==='three'?FIXED:model[prefix];
  const row=prefix==='three'?currentThreeRow():ROWS[selectedRows[prefix]];
  const result=calculate({x1:row.x,x2:row.y,w1:p.w1,w2:p.w2,threshold:p.s});
  const concealed=prefix==='three'&&!checked[selectedRows.three.startsWith('probe')?'three-probes':'three-rows'];
  root.querySelector('[data-x1]').textContent=`x₁ = ${fmt(row.x)}`;
  root.querySelector('[data-x2]').textContent=`x₂ = ${fmt(row.y)}`;
  root.querySelector('[data-sum]').textContent=`a = ${fmt(result.sum)}`;
  root.querySelector('[data-compare]').textContent=concealed?'a ? s':`a ${result.sum>p.s?'>':'≤'} s`;
  const status=concealed?'Ausgabe ? · erst selbst bestimmen':`${result.output?'● Feuert · Ausgabe 1':'○ Feuert nicht · Ausgabe 0'}`;
  const output=root.querySelector('[data-output]');output.textContent=concealed?'Ausgabe ?':status;output.className='neuron-output '+(concealed?'is-unknown':result.output?'is-firing':'is-quiet');
  root.querySelector('[data-input-status]').textContent=`${prefix==='three'&&selectedRows.three.startsWith('row')?row.name+' ':''}Eingabe (${fmt(row.x)};${fmt(row.y)}): a = ${fmt(result.sum)}; ${concealed?'a ? s':`${fmt(result.sum)} ${result.sum>p.s?'>':'≤'} ${fmt(p.s)}`}.`;
  root.querySelector('[data-fire-status]').textContent=status;
  for(const key of ['w1','w2','s']) {
    root.querySelector(`[data-value="${key}"]`).textContent=fmt(p[key]);
    if(prefix!=='three')for(const direction of [-1,1])root.querySelector(`[data-adjust="${key}:${direction}"]`).disabled=direction<0?p[key]<=LIMITS[prefix][key][0]:p[key]>=LIMITS[prefix][key][1];
  }
  if(prefix==='three') {
    document.querySelectorAll('#three-table [data-row],#three-probe-table [data-row]').forEach(button=>{const on=button.dataset.row===selectedRows.three;button.setAttribute('aria-current',String(on));button.closest('tr').classList.toggle('is-selected',on);});
    $('#three-mode-explain').textContent='Die Gewichte und der Schwellenwert sind fest vorgegeben.';
  } else $('#'+prefix+'-table').querySelectorAll('[data-row]').forEach((button,i)=>{const on=selectedRows[prefix]===i;button.setAttribute('aria-current',String(on));button.closest('tr').classList.toggle('is-selected',on);});
}
function changeParameter(prefix,key,direction) {
  const p=model[prefix];if(!p)return;
  const next=nextParameter(p[key],LIMITS[prefix][key],direction);
  if(next===p[key])return;
  p[key]=next;checked[prefix]=false;clearFeedback(prefix);updateParameterTable(prefix);updateProgress();
  renderNeuron(prefix);save();
}
function chooseRow(prefix,choice) {selectedRows[prefix]=choice;renderNeuron(prefix);save();}
function setupNeurons() {
  for(const prefix of ['one','two','three']) {
    const root=$('#'+prefix+'-neuron');root.innerHTML=neuronMarkup(prefix);
    if(prefix!=='three')root.addEventListener('click',event=>{const button=event.target.closest('[data-adjust]');if(!button)return;const [key,direction]=button.dataset.adjust.split(':');changeParameter(prefix,key,Number(direction));});
    document.querySelectorAll(`#${prefix}-table [data-row]`).forEach(button=>button.addEventListener('click',()=>chooseRow(prefix,prefix==='three'?button.dataset.row:Number(button.dataset.row))));
  }
  document.querySelectorAll('#three-probe-table [data-row]').forEach(button=>button.addEventListener('click',()=>chooseRow('three',button.dataset.row)));
}
function updateParameterTable(prefix) {
  const p=parameters(prefix),rows=p?rowOutputs(ROWS,p):null;
  [...$('#'+prefix+'-table').rows].forEach((tr,i)=>{tr.querySelector('[data-sum]').textContent=rows?fmt(rows[i].sum):'–';tr.querySelector('[data-output]').textContent=rows?String(rows[i].output):'–';});
}
function checkParameters(prefix) {
  const p=parameters(prefix); if(!p){showFeedback(prefix,'Gib für w₁, w₂ und s jeweils eine endliche Zahl ein.');return;}
  const rows=rowOutputs(ROWS,p),bad=rows.find(row=>row.output!==row.target),n=4-rows.filter(row=>row.output!==row.target).length;
  if(n===4) {showFeedback(prefix,prefix==='one'?'Korrekt. Alle vier Ausgaben stimmen. Prüfe: Auch die beiden Eingaben mit x₁ = 0 bleiben bei Ausgabe 0.':'Korrekt. Die ersten beiden Eingaben geben 0 aus, die letzten beiden 1.','success');mark(prefix,true);}
  else if(n===0) showFeedback(prefix,prefix==='one'?'Noch nicht korrekt: Keine der vier Ausgaben stimmt. Vergleiche zuerst die gewichtete Summe mit s bei (1;0).':'Noch nicht korrekt. Beginne mit (0;0): Dort ist die gewichtete Summe immer 0, egal wie du die Gewichte änderst.');
  else showFeedback(prefix,prefix==='one'?`Teilweise korrekt: ${n} von 4 Ausgaben stimmen. Bei (${fmt(bad.x)};${fmt(bad.y)}) erwartet die Tabelle ${bad.target}, dein Perzeptron liefert ${bad.output}. Verändere die Einstellung und prüfe alle Zeilen erneut.`:`Teilweise korrekt: ${n} von 4 Ausgaben stimmen. Bei (${fmt(bad.x)};${fmt(bad.y)}) ist ${bad.target} erwartet, berechnet wird ${bad.output}. Prüfe nach jeder Änderung auch die anderen Zeilen.`,'partial');
}

function inspectFormula(id,{kind='Ungleichung',variables='both'}={}) {
  const relation=parse(value(id),{kind,variables});
  if(!relation.ok) showFeedback(id,relation.message);
  return relation;
}
function checkThreeRows() {
  const answers=readSelects('.three-row-select'),expected=[0,0,1,1],n=countAnswers(answers,expected);
  if(n===4){showFeedback('three-rows','Korrekt. Die Ausgaben sind in Zeilenfolge 0, 0, 1, 1.','success');mark('three-rows',true);$('#three-probes').hidden=false;}
  else if(n===0)showFeedback('three-rows','Noch nicht korrekt. Berechne zuerst 4·x₁ + 2·x₂ für jede Zeile.');
  else {const i=answers.findIndex((v,j)=>v!==expected[j]),row=ROWS[i];showFeedback('three-rows',`Teilweise korrekt: ${n} von 4 Ausgaben stimmen. Prüfe bei (${fmt(row.x)};${fmt(row.y)}) den Vergleich a > 3.`,'partial');}
}
function checkThreeProbes() {
  const answers=readSelects('.three-probe-select'),expected=[0,0,1],n=countAnswers(answers,expected);
  if(n===3){showFeedback('three-probes','Korrekt. Unterhalb und auf der Grenze ist die Ausgabe 0; oberhalb ist sie 1.','success');mark('three-probes',true);$('#three-formula').hidden=false;}
  else if(n===0)showFeedback('three-probes','Noch nicht korrekt. Bei Gleichheit mit 3 ist die Ausgabe 0.');
  else {const i=answers.findIndex((v,j)=>v!==expected[j]),y=[.5,1,1.5][i];showFeedback('three-probes',`Teilweise korrekt. Bei x₂ = ${fmt(y)} ergibt sich a = ${fmt(1+2*y)}; vergleiche streng mit 3.`,'partial');}
}
function checkThreeCondition() {
  const relation=inspectFormula('three-condition',{variables:'input'});if(!relation.ok)return;
  if(equivalent(relation,TARGET)){showFeedback('three-condition','Korrekt. Deine Ungleichung beschreibt genau die Feuerhalbebene dieses Neurons.','success');mark('three-condition',true);}
  else if(countMatching(relation,ROWS).count===4)showFeedback('three-condition','Teilweise korrekt. Diese Bedingung trennt zwar die vier Punkte, beschreibt aber nicht alle feuernden Eingaben des vorgegebenen Neurons.','partial');
  else showFeedback('three-condition','Noch nicht korrekt. Prüfe, auf welcher Seite die Eingabe (1;0) liegt.');
}
function appendSummary(parent,title,auftrag,antwort,ergebnis,complete=false,revealResult=complete) {
  const article=document.createElement('article');article.className='summary-item summary-section';
  const heading=document.createElement('h3');heading.textContent=title+' ';
  if(complete!==null){const badge=document.createElement('span');badge.className='summary-result '+(complete?'complete':'open');badge.textContent=complete?'✓ richtig geprüft':'noch offen';heading.append(badge);}
  const prompt=document.createElement('p');prompt.className='prompt';prompt.textContent=auftrag;
  const list=document.createElement('dl');list.className='summary-grid';
  const add=(term,text)=>{const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=term;dd.textContent=text;list.append(dt,dd);};
  add('Deine Antwort',antwort||'Noch keine Eingabe');
  if(revealResult)add('Richtiges Ergebnis',ergebnis);
  article.append(heading,prompt,list);parent.append(article);
}
function summaryRows(rows,answers) {
  return rows.map((row,i)=>`${row.name?row.name+' ':''}(${fmt(row.x)};${fmt(row.y)}): Ausgabe ${answers[i]===null?'noch nicht gewählt':answers[i]}`).join('\n');
}
function summaryChoices(id,values=null) {
  return [...$('#'+id).querySelectorAll('label')].filter(label=>{const input=label.querySelector('input');return input&&(values?values.includes(input.value):input.checked);}).map(label=>label.textContent.trim()).join('\n')||'Noch keine Auswahl';
}
function summaryParameters(prefix) {
  if(prefix==='one'||prefix==='two'){const p=model[prefix];return `w₁ = ${fmt(p.w1)}, w₂ = ${fmt(p.w2)}, s = ${fmt(p.s)}\n${summaryRows(ROWS,rowOutputs(ROWS,p).map(row=>row.output))}`;}
  return ['w1','w2','s'].map((key,i)=>`${['w₁','w₂','s'][i]} = ${value(prefix+'-'+key).trim()||'noch nicht eingegeben'}`).join(', ');
}
function summaryInputs(selector) {
  return [...$(selector).querySelectorAll('[data-answer],[data-field]')].map(input=>{
    const key=input.dataset.answer||input.dataset.field;
    const answer=input.value===''?'Noch keine Eingabe':input.tagName==='SELECT'?input.selectedOptions[0].textContent.trim():input.value;
    return `${FIELD_LABELS[key]}: ${answer}`;
  }).join('\n');
}
function renderSummary() {
  const root=$('#summary');if(!root)return;root.replaceChildren();
  const status=[
    ['1 So rechnet das Perzeptron',checked.structure],['2 Selbst rechnen',checked.decide],
    ['3 Fehlendes Feuer',checked.one],['4 Unerwünschtes Feuer',checked.two],
    ['5 Wann feuert es?',['three-rows','three-probes','three-condition'].every(id=>checked[id])],
    ['6 Delta-Lernregel',[1,2,3,4].every(i=>checked['learn-'+i])]
  ];
  for(const [title,done] of status){const p=document.createElement('p');p.textContent=`${title}: ${done?'bearbeitet':'offen'}`;root.append(p);}
  const complete=REQUIRED.every(id=>checked[id]);
  appendSummary(root,'1 Signalweg','Verfolge den Signalweg vom Eingang bis zur Ausgabe.',state.signalObserved?'Signalweg vollständig angesehen.':`Schritt ${state.signalStep+1} von 7 angesehen.`,'a=6>3, Ausgabe 1 · ungefährlich.',checked.structure,complete);
  appendSummary(root,'2 Hai berechnen','Berechne mit w₁=-1, w₂=2 und θ=3 die Klasse des Hais.',summaryInputs('#decision-form'),'a=-2<3, Ausgabe 0 · gefährlich.',checked.decide,complete);
  appendSummary(root,'3 Fehlendes Feuer','Verändere Gewichte und Schwellenwert, bis alle vier Ausgaben stimmen.',summaryParameters('one'),'A/D=0 und B/C=1.',checked.one,complete);
  appendSummary(root,'4 Unerwünschtes Feuer','Stelle das Neuron für die vier Soll-Ausgaben ein.',summaryParameters('two'),'A/D=0 und B/C=1.',checked.two,complete);
  appendSummary(root,'5.1 Vier Ausgaben','Bestimme die vier Ausgaben des festen Neurons.',summaryRows(ROWS,readSelects('.three-row-select')),'A=0, D=0, B=1, C=1.',checked['three-rows'],complete);
  appendSummary(root,'5.2 Grenzproben','Prüfe bei x₁=0,25 die drei x₂-Werte.',summaryRows(PROBES,readSelects('.three-probe-select')),'x₂=0,5/1/1,5 ergibt 0/0/1.',checked['three-probes'],complete);
  appendSummary(root,'5.3 Feuerbedingung','Formuliere die strenge Feuerbedingung.',value('three-condition'),'4x₁+2x₂>3.',checked['three-condition'],complete);
  for(let i=0;i<4;i++){const e=epoch[i];appendSummary(root,`6.${i+1} Trainingsschritt`,`Berechne für Trainingstier ${i+1} Summe, Ausgabe und δ; aktualisiere Gewichte und Schwelle.`,summaryInputs(`#epoch-body tr[data-row="${i}"]`),`a=${e.sum}, f(a)=${e.output}, δ=${e.delta}; danach w₁=${e.w1}, w₂=${e.w2}, θ=${e.threshold}.`,checked['learn-'+(i+1)],complete);}
  appendSummary(root,'6.5 Kurz erklären',$('#learning-answer').closest('article').querySelector('p').textContent,value('learning-answer'),'',null,false);
  for(let i=0;i<QUIZ.length;i++)appendSummary(root,`8.${i+1} Abschlussquiz`,$('#quiz-'+(i+1)+' legend').textContent,summaryChoices('quiz-'+(i+1)),summaryChoices('quiz-'+(i+1),QUIZ[i].solution),quizChecked[i],complete&&quizPassed);
  if(!complete)return;
  const p=document.createElement('p');p.className='remember';p.textContent='Das Perzeptron gewichtet Eingaben, addiert sie und vergleicht streng mit der Schwelle. Beim Training vergleicht es Ausgabe und Sollwert; die Delta-Lernregel ändert nur bei Fehlern Gewichte und Schwelle.';root.append(p);
  const end=document.createElement('p');end.textContent='Nach vier Schritten: w₁=-3, w₂=4, θ=1; gelernte Gerade −3x₁+4x₂=1.';root.append(end);
}

const QUIZ=[
  {solution:['A','B','C'],hint:'Berechne beide Produkte getrennt und vergleiche 6 mit 3.'},
  {solution:['A','B'],hint:'Setze 4 und 1 an der richtigen Stelle in -x₁+2x₂ ein.'},
  {solution:['A','B'],hint:'Beide Produkte sind 0; nur der Vergleich mit s entscheidet.'},
  {solution:['A','B'],hint:'Der erste Beitrag ist 1; addiere 2x₂ und vergleiche streng mit 3.'},
  {solution:['A','B','C'],hint:'Setze δ=0 oder xᵢ=0 in die beiden Updateformeln ein.'},
  {solution:['A','B'],hint:'Gehe die vier CSV-Zeilen in Reihenfolge durch; Werte entstehen schrittweise.'},
];
function quizQuestionCorrect(i) {const chosen=[...document.querySelectorAll(`#quiz-${i+1} input:checked`)].map(el=>el.value),question=QUIZ[i];return chosen.length===question.solution.length&&chosen.every(v=>question.solution.includes(v));}
function quizChoicesCorrect() {return QUIZ.every((_,i)=>quizQuestionCorrect(i));}
function showQuizResults() {
  const root=$('#quiz-results');root.replaceChildren();
  for(let i=0;i<QUIZ.length;i++) {
    const p=document.createElement('p');
    const texts=[...document.querySelectorAll(`#quiz-${i+1} label`)].filter(label=>QUIZ[i].solution.includes(label.querySelector('input').value)).map(label=>label.textContent.trim());
    p.textContent=`Frage ${i+1}: ${texts.join(' · ')}`;root.append(p);
  }
  root.hidden=false;
}
function finishQuiz() {
  if(!quizChoicesCorrect())return;
  quizPassed=true;quizChecked.fill(true);showFeedback('quiz','Korrekt. Alle sechs Fragen sind vollständig richtig beantwortet.','success');showQuizResults();save();renderSummary();
}
function renderQuizQuestions(){
  const items=[
    ['Was gilt für den Hasen mit x₁=2, x₂=4, w₁=-1, w₂=2 und θ=3?','Die gewichteten Beiträge sind -2 und 8.','Die Summe ist 6.','Die Ausgabe ist 1.','Das negative Gewicht erzwingt Ausgabe 0.'],
    ['Was gilt für den Hai mit x₁=4 und x₂=1 bei denselben Parametern?','Die Summe ist -2.','Er wird als gefährlich klassifiziert.','Er erhält Ausgabe 1.','Die Augengröße wird mit -1 gewichtet.'],
    ['Was gilt für den Eingang (0|0)?','Die gewichtete Summe ist unabhängig von den Gewichten 0.','Bei s=-0,5 und strengem Vergleich entsteht Ausgabe 1.','Bei s=0 entsteht wegen Gleichheit Ausgabe 1.','Eine Gewichtsänderung allein ändert die Summe bei (0|0).'],
    ['Beim festen Neuron w₁=4, w₂=2, s=3 gilt x₁=0,25. Welche Aussagen stimmen?','Bei x₂=1 ist die Ausgabe 0.','Bei x₂=1,5 ist die Ausgabe 1.','Bei x₂=0,5 ist die Ausgabe 1.','Gleichheit mit s genügt zum Feuern.'],
    ['Was beschreibt die Delta-Lernregel?','δ=t-f(a) vergleicht Soll und Ausgabe.','Bei δ=0 bleiben Gewichte und Schwelle unverändert.','Ein Eingang xᵢ=0 verursacht in diesem Schritt keine Änderung seines Gewichts.','Das Perzeptron wählt seinen Sollwert selbst.'],
    ['Was gilt nach der ersten Epoche der vier Tierdaten mit Startwerten (1,1,1) und α=1?','Die Endwerte sind w₁=-3, w₂=4, θ=1.','Die gelernte Grenze lautet -3x₁+4x₂=1.','Ein Trainingsschritt reicht für alle vier Endwerte.','Die Lernrate ändert bei δ=0 die Parameter trotzdem.']
  ];
  $('#quiz-questions').innerHTML=items.map((item,i)=>`<fieldset id="quiz-${i+1}" class="quiz-question"><legend>${i+1}. ${item[0]}</legend>${item.slice(1).map((option,j)=>`<label><input type="checkbox" value="${'ABCD'[j]}">${option}</label>`).join('')}</fieldset>`).join('');
}
function setupQuiz() {
  renderQuizQuestions();
  quizControl=window.addQuizQuestionChecks?.({questions:QUIZ.map((question,i)=>({fieldset:$('#quiz-'+(i+1)),number:i+1,...question})),buttonClass:'primary-button',feedbackClass:'feedback',levels:{high:'success',medium:'partial',low:'error'},onCheck:(question,result)=>{quizChecked[question.number-1]=result==='correct';save();renderSummary();},onAllCorrect:finishQuiz});
  $('#final-quiz').addEventListener('submit',event=>{event.preventDefault();const correct=quizControl?.checkAll()||0;if(correct===QUIZ.length)finishQuiz();else showFeedback('quiz',`Noch nicht korrekt. ${correct} von ${QUIZ.length} Fragen sind vollständig richtig.`);});
  document.querySelectorAll('#final-quiz input').forEach(el=>el.addEventListener('change',()=>{quizPassed=false;quizChecked[Number(el.closest('fieldset').id.split('-')[1])-1]=false;$('#quiz-results').hidden=true;clearFeedback('quiz');save();renderSummary();}));
}
function resetModule() {
  try{localStorage.removeItem(KEY);}catch{}
  location.reload();
}

function attachEvents() {
  fields.forEach(el=>{el.addEventListener('input',save);el.addEventListener('change',save);});
  $('#reset-three-neuron').addEventListener('click',()=>renderNeuron('three'));
  for(const prefix of ['one','two']){
    $('#check-'+prefix).addEventListener('click',()=>checkParameters(prefix));
  }
  for(const cls of ['three-row-select','three-probe-select'])document.querySelectorAll('.'+cls).forEach(el=>el.addEventListener('change',()=>invalidate(cls==='three-row-select'?'three-rows':'three-probes')));
  $('#three-condition').addEventListener('input',()=>invalidate('three-condition'));
  for(const [id,handler] of Object.entries({'three-rows':checkThreeRows,'three-probes':checkThreeProbes,'three-condition':checkThreeCondition}))$('#check-'+id).addEventListener('click',handler);
  helpDetails.forEach(el=>el.addEventListener('toggle',save));
  $('#reset-module').addEventListener('click',resetModule);
}
function feedback(id,kind,message){const el=$('#'+id);el.hidden=false;el.className='feedback '+kind;el.textContent=message;}
function decisionCorrect(){const form=$('#decision-form');return Object.entries({product1:-4,product2:2,sum:-2,comparison:'le',output:'0',class:'danger'}).every(([key,want])=>{const input=form.querySelector(`[data-answer="${key}"]`);return typeof want==='number'?numberMatches(input.value,want):input.value===want;});}
function setupStructure(){
  const show=()=>{
    const current=state.signalStep;
    document.querySelectorAll('[data-signal]').forEach(el=>{const key=el.dataset.signal;const active=current>=0&&SIGNAL_STEPS[current].targets.includes(key),done=current>=0&&SIGNAL_STEPS.slice(0,current).some(step=>step.targets.includes(key));el.classList.toggle('is-active',active);el.classList.toggle('is-complete',done);el.classList.toggle('is-dimmed',!active&&!done);});
    document.querySelectorAll('[data-signal-arrow]').forEach(el=>{const keys=el.dataset.signalArrow.split(' ');const active=current>=0&&keys.some(key=>SIGNAL_STEPS[current].targets.includes(key));el.classList.toggle('is-active',active);el.classList.toggle('is-dimmed',!active);});
    $('#signal-step-status').textContent=current<0?'Klicke auf Weiter, um mit Schritt 1 von 7 zu beginnen.':`Schritt ${current+1}/7: ${SIGNAL_STEPS[current].title} – ${SIGNAL_STEPS[current].text}`;
    $('#next-signal-step').textContent=current===6?'Schritte neu starten':'Weiter';
  };
  $('#next-signal-step').addEventListener('click',()=>{state.signalStep=state.signalStep===6?-1:state.signalStep+1;if(state.signalStep===6){state.signalObserved=true;mark('structure',true);}show();save();});
  return show;
}
function setupDecision(){
  const expected={product1:-4,product2:2,sum:-2,comparison:'le',output:'0',class:'danger'};
  const order=Object.keys(expected);
  $('#decision-form').addEventListener('input',()=>invalidate('decide'));
  $('#decision-form').addEventListener('change',()=>invalidate('decide'));
  $('#check-decision').addEventListener('click',()=>{
    let correct=0,first='';
    for(const [key,want] of Object.entries(expected)){const input=$(`[data-answer="${key}"]`);const ok=typeof want==='number'?numberMatches(input.value,want):input.value===want;input.classList.toggle('is-correct',ok);input.classList.toggle('is-wrong',!ok);if(ok)correct++;else if(!first)first=key;}
    const solved=correct===6;
    const text={sum:solved?'a = −2':'a = ?',comparison:solved?'−2 < 3':'a ? θ',output:solved?'0':'?',class:solved?'gefährlich':'noch unbekannt'};
    for(const [part,value] of Object.entries(text))document.querySelectorAll(`[data-decision="${part}"]`).forEach(el=>el.textContent=value);
    if(solved){feedback('decision-feedback','success','Korrekt. Die Summe ist −2; das Perzeptron gibt 0 aus und klassifiziert den Hai als gefährlich.');mark('decide',true);}
    else if(correct)feedback('decision-feedback','partial',`${correct} von 6 Einträgen stimmen. Prüfe zuerst Schritt ${order.indexOf(first)+1}: ${FIELD_LABELS[first]}.`);
    else feedback('decision-feedback','error','Noch nicht korrekt. Berechne zuerst die beiden Produkte und addiere sie dann.');
  });
}
function entryFields(index){return ['sum','output','delta','w1','w2','threshold'].map(name=>{const id=`epoch-${index}-${name}`;const control=name==='output'?`<select id="${id}" data-field="${name}"><option value="">–</option><option>0</option><option>1</option></select>`:`<input id="${id}" data-field="${name}" inputmode="decimal" autocomplete="off">`;return `<td><label><span class="sr-only">Schritt ${index+1}: ${FIELD_LABELS[name]}</span>${control}</label></td>`;}).join('');}
function epochRowCorrect(index){const row=$(`#epoch-body tr[data-row="${index}"]`),entry=epoch[index];if(!row)return false;return Object.entries({sum:entry.sum,output:String(entry.output),delta:entry.delta,w1:entry.w1,w2:entry.w2,threshold:entry.threshold}).every(([key,want])=>{const input=row.querySelector(`[data-field="${key}"]`);return typeof want==='number'?numberMatches(input.value,want):input.value===want;});}
function unlockEpoch(index){
  const row=$(`#epoch-body tr[data-row="${index}"]`);
  row.querySelectorAll('input,select').forEach(el=>el.disabled=true);
  row.querySelector('.check-row').disabled=true;
  const next=$(`#epoch-body tr[data-row="${index+1}"]`);if(next)next.querySelectorAll('input,select,button').forEach(el=>el.disabled=false);
  checked['learn-'+(index+1)]=true;save();updateProgress();
}
function setupEpoch(){
  const body=$('#epoch-body');
  epoch.forEach((entry,index)=>{const row=document.createElement('tr');row.dataset.row=index;const before=entry.before;row.innerHTML=`<th scope="row">${index+1}</th><td>${entry.row.x1}</td><td>${entry.row.x2}</td><td>${entry.row.target}</td><td>${before.w1}</td><td>${before.w2}</td><td>${before.threshold}</td>${entryFields(index)}<td><button type="button" class="secondary-button check-row">Zeile prüfen</button></td>`;body.append(row);});
  body.querySelectorAll('tr').forEach((row,index)=>{
    if(index>0)row.querySelectorAll('input,select,button').forEach(el=>el.disabled=true);
    row.querySelectorAll('input,select').forEach(el=>el.addEventListener('input',()=>invalidate('learn-'+(index+1))));
    row.querySelector('.check-row').addEventListener('click',()=>{
      const entry=epoch[index],expect={sum:entry.sum,output:String(entry.output),delta:entry.delta,w1:entry.w1,w2:entry.w2,threshold:entry.threshold};let correct=0,first='';
      for(const [field,want] of Object.entries(expect)){const input=row.querySelector(`[data-field="${field}"]`),ok=typeof want==='number'?numberMatches(input.value,want):input.value===want;input.classList.toggle('is-correct',ok);input.classList.toggle('is-wrong',!ok);if(ok)correct++;else if(!first)first=field;}
      if(correct===6){unlockEpoch(index);feedback('epoch-feedback','success',index===3?'Korrekt. Nach vier Schritten gelten w₁=-3, w₂=4 und θ=1; alle vier Trainingspunkte sind richtig klassifiziert.':`Korrekt. Trainingsschritt ${index+1} stimmt; die nächste Zeile ist freigeschaltet.`);}
      else if(correct)feedback('epoch-feedback','partial',`Teilweise korrekt: ${correct} von 6 Feldern stimmen. Prüfe zuerst ${FIELD_LABELS[first]}.`);
      else feedback('epoch-feedback','error','Noch nicht korrekt. Berechne zuerst a, dann f(a) und δ.');
    });
  });
}
function setupSemantic(){
  const textarea=$('#learning-answer'),counter=$('#learning-counter'),button=$('#check-learning-answer');
  const update=()=>counter.textContent=textarea.value.length+' von 600 Zeichen';textarea.addEventListener('input',update);
  button.addEventListener('click',async()=>{const answer=textarea.value.trim();if(answer.length<30){feedback('learning-feedback','error','Bitte formuliere eine etwas ausführlichere Antwort, damit sie sinnvoll ausgewertet werden kann.');return;}button.disabled=true;feedback('learning-feedback','','Deine Antwort wird mit dem Erwartungshorizont verglichen.');try{const result=await evaluateSemanticAnswer({serverUrl:SERVER_URL,taskId:'11-5-1',answer});feedback('learning-feedback',result.points>=3?'success':result.points?'partial':'error',`${result.points} von ${result.maxPoints} Punkten – ${result.status}. ${(result.feedback||'').trim()}`);}catch(error){feedback('learning-feedback','error',error.message);}finally{button.disabled=false;}});
  return update;
}
function start() {
  for(const suffix of ['52','52-summary'])document.querySelector('#solution-code-form-'+suffix).addEventListener('submit',event=>unlockSolution(event,'M7HR-DBX4','solution-download-link-'+suffix,'solution-code-message-'+suffix));
  buildTables();
  setupQuiz();
  const showSignal=setupStructure();
  setupEpoch();
  const updateCounter=setupSemantic();
  fields=[...document.querySelectorAll('input,select,textarea')].filter(el=>!el.closest('.solution-code-form'));
  setupTabs();setupNeurons();setupDecision();attachEvents();
  load();
  updateParameterTable('one');updateParameterTable('two');
  for(const prefix of ['one','two','three'])renderNeuron(prefix);
  $('#three-probes').hidden=!checked['three-rows'];$('#three-formula').hidden=!checked['three-probes'];
  for(let i=0;i<4&&checked['learn-'+(i+1)];i++)unlockEpoch(i);
  showSignal();updateCounter();
  if(checked.decide)for(const [part,value] of Object.entries({sum:'a = −2',comparison:'−2 < 3',output:'0',class:'gefährlich'}))document.querySelectorAll(`[data-decision="${part}"]`).forEach(el=>el.textContent=value);
  if(quizPassed){showQuizResults();showFeedback('quiz','Korrekt. Alle sechs Fragen sind vollständig richtig beantwortet.','success');}
  showStep(active);
}
start();
