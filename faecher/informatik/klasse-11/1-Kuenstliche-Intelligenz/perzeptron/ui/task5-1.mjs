import {calculate,normaliseNumber} from '../logic/perceptron.mjs';
import {parseLinearRelation as parse,equivalent,sameBoundary,classify,countMatching,STRICT_MESSAGE,EQUALITY_MESSAGE,DEGENERATE_MESSAGE} from '../logic/linear-inequality.mjs';

const KEY='informatik11-perzeptron-aufgabe5-1-v1';
const IDS=['one','two','three','four','five','six','seven','eight'];
const ROWS=[{name:'A',x:0,y:0,target:0},{name:'D',x:0,y:1,target:0},{name:'B',x:1,y:0,target:1},{name:'C',x:1,y:1,target:1}];
const SIX_ROWS=[{x:0,y:1,target:0},{x:.5,y:0,target:0},{x:1,y:.5,target:1},{x:1,y:1,target:1}];
const TARGET=parse('4x1+2x2>3');
const FIXED={w1:4,w2:2,s:3};
const START={one:{w1:1.5,w2:-2.5,s:3.9},two:{w1:3,w2:2.5,s:-.5}};
const LIMITS={one:{w1:[-4,3.5,.5],w2:[-4,3.5,.5],s:[-4,4,.1]},two:{w1:[-4,4,.5],w2:[-4,4,.5],s:[-4,2.1,.1]},three:{w1:[-6,6,.5],w2:[-6,6,.5],s:[-6,6,.1]}};
const PROBES=[.5,1,1.5].map((y,i)=>({name:['unten','Grenze','oben'][i],x:.25,y}));
const SIX_TARGET=parse('2x1+x2>2');
const SIX_REVERSE=parse('-2x1-x2>-2');
const FLAGS=['one','two','three-rows','three-probes','three-condition','four-compare','four-inequality','four-line','five-a','five-b','six-line','six-diagram','six-input','six-parameters','six-rows','six-expert'];
const REQUIRED=FLAGS.filter(id=>id!=='six-expert');
const $=selector=>document.querySelector(selector);
const value=id=>$('#'+id).value;
const fmt=n=>Number.isInteger(n)?String(n):String(Math.round(n*1e9)/1e9).replace('.',',');
const simple=txt=>String(txt).replaceAll('−','-').replaceAll('₁','1').replaceAll('₂','2');
let checked=Object.fromEntries(FLAGS.map(id=>[id,false]));
let drawn={a:'',b:''};
let helper=false,active='one',quizPassed=false,ggb=null,ggbPending=false,ggbFailed=false,ggbTimer=null,ggbScriptPromise=null,shownPart=null;
let quizControl=null;
let fields=[];
const helpDetails=[...document.querySelectorAll('.helps details')];
let defaults={};
let model={one:{...START.one},two:{...START.two}};
let selectedRows={one:0,two:0,three:'row-0'};
let threeMode='task',explore={...FIXED},exploreUsed=false,fourPoint=null;

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
function allCore() { return REQUIRED.every(id=>checked[id]); }
function updateProgress() {
  const n=REQUIRED.filter(id=>checked[id]).length;
  $('#progress').textContent=`${n} von ${REQUIRED.length} Kern-Teilaufgaben richtig geprüft.`;
  renderSummary();
}
function save() {
  try {
    const controls=Object.fromEntries(fields.map(el=>[fieldKey(el),el.type==='checkbox'||el.type==='radio'?el.checked:el.value]));
    localStorage.setItem(KEY,JSON.stringify({version:1,controls,checked,drawn,helper,active,quizPassed,shownPart,helps:helpDetails.map(el=>el.open),parameters:model,selectedRows,threeMode,explore,exploreUsed,fourPoint}));
  } catch { $('#save-status').textContent='Der Bearbeitungsstand konnte nicht lokal gespeichert werden.'; }
}
function fieldKey(el) { return el.id || `${el.closest('fieldset')?.id||el.name}:${el.value}`; }
function validSaved(value) { return typeof value==='string'&&value.length<=250; }
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
  explore=restoreParameters(data.explore,'three')||{...FIXED};
  exploreUsed=data.exploreUsed===true;
  threeMode=data.threeMode==='explore'?'explore':'task';
  if(data.selectedRows&&typeof data.selectedRows==='object') {
    for(const prefix of ['one','two']) if(Number.isInteger(data.selectedRows[prefix])&&data.selectedRows[prefix]>=0&&data.selectedRows[prefix]<ROWS.length)selectedRows[prefix]=data.selectedRows[prefix];
    if(/^row-[0-3]$/.test(data.selectedRows.three)||(['probe-0','probe-1','probe-2'].includes(data.selectedRows.three)&&data.checked?.['three-rows']===true))selectedRows.three=data.selectedRows.three;
  }
  if(Number.isInteger(data.fourPoint)&&data.fourPoint>=0&&data.fourPoint<3)fourPoint=data.fourPoint;
  if(Array.isArray(data.helps)) helpDetails.forEach((el,i)=>{if(typeof data.helps[i]==='boolean') el.open=data.helps[i];});
  if(data.drawn&&typeof data.drawn==='object') for(const part of ['a','b']) if(validSaved(data.drawn[part])&&parse(data.drawn[part]).ok&&data.drawn[part]===value('five-'+part)) drawn[part]=data.drawn[part];
  helper=data.helper===true;
  if(['a','b'].includes(data.shownPart)) shownPart=data.shownPart;
  if(IDS.includes(data.active)) active=data.active;
  // Gespeicherte Prüfzeichen gelten nur zusammen mit erneut geprüften aktuellen Antworten.
  if(data.checked&&typeof data.checked==='object') for(const id of FLAGS) if(data.checked[id]===true&&validateFlag(id)) checked[id]=true;
  if(selectedRows.three.startsWith('probe')&&!checked['three-rows'])selectedRows.three='row-0';
  quizPassed=data.quizPassed===true&&quizChoicesCorrect();
  $('#save-status').textContent='Dein Bearbeitungsstand wurde wiederhergestellt.';
}
function validateFlag(id) {
  if(id==='one'||id==='two') { const p=parameters(id); return !!p&&rowOutputs(ROWS,p).every(row=>row.output===row.target); }
  if(id==='three-rows') return countAnswers(readSelects('.three-row-select'),[0,0,1,1])===4;
  if(id==='three-probes') return countAnswers(readSelects('.three-probe-select'),[0,0,1])===3;
  if(id==='three-condition') return equivalent(parse(value('three-condition'),{variables:'input'}),TARGET);
  if(id==='four-compare') return document.querySelector('input[name=four-compare]:checked')?.value==='no';
  if(id==='four-inequality') return equivalent(parse(value('four-inequality')) ,TARGET);
  if(id==='four-line') return equivalent(parse(value('four-line'),{kind:'Gleichung',variables:'diagram'}),parse('y=-2x+1,5',{kind:'Gleichung'}),{line:true});
  if(id==='five-a') return drawn.a===value('five-a')&&equivalent(parse(drawn.a),TARGET);
  if(id==='five-b') return drawn.b===value('five-b')&&countMatching(parse(drawn.b),ROWS).count===4;
  if(id==='six-line') return equivalent(parse(value('six-line'),{kind:'Gleichung',variables:'diagram'}),parse('y=-2x+2',{kind:'Gleichung'}),{line:true});
  if(id==='six-diagram') return equivalent(parse(value('six-diagram'),{variables:'diagram'}),SIX_TARGET);
  if(id==='six-input') return equivalent(parse(value('six-input'),{variables:'input'}),SIX_TARGET);
  if(id==='six-parameters') {const p=parameters('six');return !!p&&equivalent(neuronRelation(p),parse(value('six-input'),{variables:'input'}))&&equivalent(neuronRelation(p),SIX_TARGET);}
  if(id==='six-rows') {const p=parameters('six');return !!p&&readSelects('.six-row-select').every((v,i)=>v===rowOutputs(SIX_ROWS,p)[i].output&&v===SIX_ROWS[i].target);}
  if(id==='six-expert') return equivalent(parse(value('six-expert'),{variables:'input'}),SIX_REVERSE)&&isExpertNeuronForm(value('six-expert'));
  return false;
}
function neuronRelation(p) {return parse(`${p.w1}x1+(${p.w2})x2>${p.s}`);}
function showStep(id,focus=false) {
  active=id;
  for(const name of IDS) {
    const tab=$('#tab-'+name),panel=$('#'+name),on=name===id;
    tab.setAttribute('aria-selected',String(on)); tab.tabIndex=on?0:-1;panel.hidden=!on;
  }
  if(id==='five') initGeoGebra();
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
  for(const prefix of ['one','two']) $('#'+prefix+'-table').innerHTML=ROWS.map((row,i)=>`<tr><td><button class="secondary-button row-choice" type="button" data-row="${i}">Punkt (${fmt(row.x)};${fmt(row.y)}) anzeigen</button></td><td>${fmt(row.x)}</td><td>${fmt(row.y)}</td><td data-sum>–</td><td>${row.target}</td><td data-output>–</td></tr>`).join('');
  const select=(id,cls,label)=>`<select id="${id}" class="${cls}" aria-label="${label}"><option value="">–</option><option value="0">0</option><option value="1">1</option></select>`;
  $('#three-table').innerHTML=ROWS.map((row,i)=>`<tr><td><button class="secondary-button row-choice" type="button" data-row="row-${i}">${row.name} (${fmt(row.x)};${fmt(row.y)}) anzeigen</button></td><td>${row.name}</td><td>${fmt(row.x)}</td><td>${fmt(row.y)}</td><td>${select('three-row-'+i,'three-row-select',`Ausgabe bei (${fmt(row.x)};${fmt(row.y)})`)}</td></tr>`).join('');
  $('#three-probe-table').innerHTML=PROBES.map((row,i)=>`<tr><td><button class="secondary-button row-choice" type="button" data-row="probe-${i}">Punkt (0,25;${fmt(row.y)}) anzeigen</button></td><td>0,25</td><td>${fmt(row.y)}</td><td>${select('three-probe-'+i,'three-probe-select',`Ausgabe bei x₂ = ${fmt(row.y)}`)}</td></tr>`).join('');
  $('#six-table').innerHTML=SIX_ROWS.map((row,i)=>`<tr><td>${fmt(row.x)}</td><td>${fmt(row.y)}</td><td>${select('six-row-'+i,'six-row-select',`Ausgabe bei (${fmt(row.x)};${fmt(row.y)})`)}</td></tr>`).join('');
}
function neuronMarkup(prefix) {
  const controls=key=>`<div class="neuron-control" data-control="${key}"><span class="neuron-control-label">${key==='s'?'s':'w'+(key==='w1'?'₁':'₂')} =</span><button type="button" data-adjust="${key}:-1" aria-label="${key==='s'?'Schwellenwert s':'Gewicht w'+(key==='w1'?'₁':'₂')} verringern">−</button><output data-value="${key}"></output><button type="button" data-adjust="${key}:1" aria-label="${key==='s'?'Schwellenwert s':'Gewicht w'+(key==='w1'?'₁':'₂')} erhöhen">+</button></div>`;
  return `<figure class="neuron-figure"><div class="neuron-stage"><svg class="neuron-wires neuron-wires-desktop" viewBox="0 0 900 310" preserveAspectRatio="none" aria-hidden="true"><path d="M145 78 L495 135 M145 232 L495 175 M635 155 L724 155 M565 263 L565 209"/></svg><svg class="neuron-wires neuron-wires-mobile" viewBox="0 0 360 600" preserveAspectRatio="none" aria-hidden="true"><path d="M82 54 L82 180 M278 54 L278 180 M82 180 L180 324 M278 180 L180 324 M180 324 L180 528 M280 408 L180 324"/></svg><svg class="neuron-wires neuron-wires-narrow" viewBox="0 0 360 600" preserveAspectRatio="none" aria-hidden="true"><path d="M82 54 L82 180 M278 54 L278 180 M82 180 L180 324 M278 180 L180 324 M180 324 L180 528 M79 432 L180 324"/></svg><div class="neuron-input neuron-input-one" data-x1>x₁ = 0</div><div class="neuron-input neuron-input-two" data-x2>x₂ = 0</div><div class="neuron-weight neuron-weight-one">${controls('w1')}</div><div class="neuron-weight neuron-weight-two">${controls('w2')}</div><div class="neuron-core"><strong>Σ</strong><span data-sum>a = 0</span><span data-compare>a ? s</span></div><div class="neuron-threshold">${controls('s')}</div><div class="neuron-output" data-output>Ausgabe ?</div></div><figcaption><span data-input-status></span> <strong data-fire-status></strong></figcaption></figure>${prefix==='three'?'<div class="neuron-mode"><strong id="three-mode-label"></strong><p id="three-mode-explain"></p><div class="action-row"><button id="three-return" class="secondary-button" type="button">Zum Aufgabenneuron (4;2;3) zurück</button><button id="three-explore" class="secondary-button" type="button">Erkundung starten</button></div><p id="three-mode-warning"></p></div>':''}`;
}
function currentThreeRow() {const [kind,index]=selectedRows.three.split('-');return kind==='probe'?PROBES[Number(index)]:ROWS[Number(index)];}
function renderNeuron(prefix) {
  const root=$('#'+prefix+'-neuron');if(!root||!root.firstElementChild)return;
  const p=prefix==='three'?(threeMode==='task'?FIXED:explore):model[prefix];
  const row=prefix==='three'?currentThreeRow():ROWS[selectedRows[prefix]];
  const result=calculate({x1:row.x,x2:row.y,w1:p.w1,w2:p.w2,threshold:p.s});
  const concealed=prefix==='three'&&p.w1===4&&p.w2===2&&p.s===3&&!checked[selectedRows.three.startsWith('probe')?'three-probes':'three-rows'];
  root.querySelector('[data-x1]').textContent=`x₁ = ${fmt(row.x)}`;
  root.querySelector('[data-x2]').textContent=`x₂ = ${fmt(row.y)}`;
  root.querySelector('[data-sum]').textContent=`a = ${fmt(result.sum)}`;
  root.querySelector('[data-compare]').textContent=concealed?'a ? s':`a ${result.sum>p.s?'>':'≤'} s`;
  const status=concealed?'Ausgabe ? · erst selbst bestimmen':`${result.output?'● Feuert · Ausgabe 1':'○ Feuert nicht · Ausgabe 0'}`;
  const output=root.querySelector('[data-output]');output.textContent=concealed?'Ausgabe ?':status;output.className='neuron-output '+(concealed?'is-unknown':result.output?'is-firing':'is-quiet');
  root.querySelector('[data-input-status]').textContent=`${prefix==='three'&&selectedRows.three.startsWith('row')?row.name+' ':''}Eingabe (${fmt(row.x)};${fmt(row.y)}): a = ${fmt(result.sum)}; ${concealed?'a ? s':`${fmt(result.sum)} ${result.sum>p.s?'>':'≤'} ${fmt(p.s)}`}.`;
  root.querySelector('[data-fire-status]').textContent=prefix==='three'&&threeMode==='explore'&&!concealed?`Erkundungsausgabe: ${status}`:status;
  for(const key of ['w1','w2','s']) {
    root.querySelector(`[data-value="${key}"]`).textContent=fmt(p[key]);
    for(const direction of [-1,1])root.querySelector(`[data-adjust="${key}:${direction}"]`).disabled=direction<0?p[key]<=LIMITS[prefix][key][0]:p[key]>=LIMITS[prefix][key][1];
  }
  if(prefix==='three') {
    document.querySelectorAll('#three-table [data-row],#three-probe-table [data-row]').forEach(button=>{const on=button.dataset.row===selectedRows.three;button.setAttribute('aria-current',String(on));button.closest('tr').classList.toggle('is-selected',on);});
    $('#three-mode-label').textContent=threeMode==='task'?'Aufgabenneuron · w₁ = 4 · w₂ = 2 · s = 3':'Erkundung · veränderbares Neuron';
    $('#three-mode-explain').textContent='Deine Antworten werden für dieses Aufgabenneuron geprüft.';
    $('#three-mode-warning').textContent=threeMode==='explore'?'Zum Prüfen zum Aufgabenneuron zurückkehren.':'';
    $('#three-return').hidden=threeMode==='task';$('#three-explore').hidden=threeMode==='explore';
    $('#three-explore').textContent=exploreUsed?'Erkundung fortsetzen':'Erkundung starten';
    for(const id of ['three-rows','three-probes','three-condition'])$('#check-'+id).disabled=threeMode==='explore';
  } else $('#'+prefix+'-table').querySelectorAll('[data-row]').forEach((button,i)=>{const on=selectedRows[prefix]===i;button.setAttribute('aria-current',String(on));button.closest('tr').classList.toggle('is-selected',on);});
}
function changeParameter(prefix,key,direction) {
  if(prefix==='three'&&threeMode==='task') { explore={...FIXED};threeMode='explore'; }
  const p=prefix==='three'?explore:model[prefix];
  const next=nextParameter(p[key],LIMITS[prefix][key],direction);
  if(next===p[key])return;
  p[key]=next;if(prefix==='three')exploreUsed=true;
  else {checked[prefix]=false;clearFeedback(prefix);updateParameterTable(prefix);updateProgress();}
  renderNeuron(prefix);save();
}
function chooseRow(prefix,choice) {selectedRows[prefix]=choice;renderNeuron(prefix);save();}
function setupNeurons() {
  for(const prefix of ['one','two','three']) {
    const root=$('#'+prefix+'-neuron');root.innerHTML=neuronMarkup(prefix);
    root.addEventListener('click',event=>{const button=event.target.closest('[data-adjust]');if(!button)return;const [key,direction]=button.dataset.adjust.split(':');changeParameter(prefix,key,Number(direction));});
    document.querySelectorAll(`#${prefix}-table [data-row]`).forEach(button=>button.addEventListener('click',()=>chooseRow(prefix,prefix==='three'?button.dataset.row:Number(button.dataset.row))));
  }
  document.querySelectorAll('#three-probe-table [data-row]').forEach(button=>button.addEventListener('click',()=>chooseRow('three',button.dataset.row)));
  $('#three-return').addEventListener('click',()=>{threeMode='task';renderNeuron('three');save();});
  $('#three-explore').addEventListener('click',()=>{threeMode='explore';renderNeuron('three');save();});
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
function checkFourCompare() {
  const answer=document.querySelector('input[name=four-compare]:checked')?.value;
  if(answer==='no'){showFeedback('four-compare','Korrekt. Die Gleichung markiert nur die Grenze; die strenge Ungleichung beschreibt die Feuerseite ohne diese Grenze.','success');mark('four-compare',true);$('#four-remember').hidden=false;$('#four-convert').hidden=false;}
  else if(answer==='yes')showFeedback('four-compare','Teilweise korrekt. Der Punkt (0,25;1) liegt auf der Grenze, seine Ausgabe ist 0. Unterscheide Linie und Bereich.','partial');
  else showFeedback('four-compare','Noch nicht korrekt. Eine Gerade enthält nur Punkte auf der Grenze, nicht alle Punkte auf einer Seite.');
}
function checkFourInequality() {
  const relation=inspectFormula('four-inequality');if(!relation.ok)return;
  if(equivalent(relation,TARGET)){showFeedback('four-inequality','Korrekt. Die strenge Ungleichung beschreibt dieselbe Feuerhalbebene.','success');mark('four-inequality',true);}
  else if(sameBoundary(relation,TARGET))showFeedback('four-inequality','Teilweise korrekt. Deine Gerade stimmt, aber die gewählte Seite oder das strenge Zeichen noch nicht.','partial');
  else showFeedback('four-inequality','Noch nicht korrekt. Kontrolliere das Umformen an x₁=0,25 und am Grenzwert x₂=1.');
}
function checkFourLine() {
  const relation=inspectFormula('four-line',{kind:'Gleichung',variables:'diagram'});if(!relation.ok)return;
  if(equivalent(relation,parse('y=-2x+1,5',{kind:'Gleichung'}),{line:true})){showFeedback('four-line','Korrekt. Die Gleichung beschreibt nur die Punkte der Trennlinie.','success');mark('four-line',true);}
  else showFeedback('four-line','Noch nicht korrekt. Setze (0,25;1) in deine Gleichung ein: Der Grenzpunkt muss sie erfüllen.');
}

function svgPoint(x,y,target,label,px,py,index=null) {
  const X=px(x),Y=py(y);
  const shape=target?`<circle class="safe-point" cx="${X}" cy="${Y}" r="10"/>`:`<rect class="danger-point" x="${X-10}" y="${Y-10}" width="20" height="20"/>`;
  if(index===null)return `${shape}<text x="${X+14}" y="${Y-12}">${label}</text>`;
  return `<g class="four-svg-point" data-point="${index}" role="button" tabindex="0" aria-label="Punkt (0,25;${fmt(y)}) anzeigen"><circle class="four-point-hit" cx="${X}" cy="${Y}" r="80"/><circle class="four-point-ring" cx="${X}" cy="${Y}" r="24"/>${shape}<text x="${X+14}" y="${Y-12}" aria-hidden="true">${label}</text></g>`;
}
function renderSvg(id,{line,points,ymax=2.5}) {
  const svg=$('#'+id),px=x=>80+(x+.25)*380,py=y=>385-(y+.25)*120;
  const grid=Array.from({length:4},(_,i)=>`<line x1="80" y1="${py(i)}" x2="680" y2="${py(i)}"/><line x1="${px(i*.5)}" y1="55" x2="${px(i*.5)}" y2="385"/>`).join('');
  const marks=points.map((p,i)=>svgPoint(p.x,p.y,p.target,p.name,px,py,id==='four-plot'?i:null)).join('');
  // Die statische Grenze ist nur Bildmaterial; alle Entscheidungen kommen aus dem Parser.
  svg.innerHTML=`<g class="geometry-grid">${grid}</g><g class="geometry-axes"><line x1="${px(0)}" y1="${py(0)}" x2="680" y2="${py(0)}"/><line x1="${px(0)}" y1="${py(0)}" x2="${px(0)}" y2="55"/></g><line class="boundary-line" x1="${px(line[0][0])}" y1="${py(line[0][1])}" x2="${px(line[1][0])}" y2="${py(line[1][1])}"/><g class="geometry-ticks"><text x="${px(0)-5}" y="${py(0)+22}">0</text><text x="${px(1)-5}" y="${py(0)+22}">1</text><text x="${px(0)-28}" y="${py(1)+5}">1</text><text x="${px(0)-28}" y="${py(2)+5}">2</text></g><text class="axis-label" x="565" y="435">x = x₁</text><text class="axis-label" x="12" y="80">y = x₂</text>${marks}`;
}
function setupStaticPlots() {
  renderSvg('four-plot',{line:[[-.25,2],[1.25,-1]],points:[{x:.25,y:.5,target:0,name:'unterhalb'},{x:.25,y:1,target:0,name:'auf Grenze'},{x:.25,y:1.5,target:1,name:'oberhalb'}]});
  renderSvg('six-plot',{line:[[0,2],[1,0]],points:SIX_ROWS.map((row,i)=>({...row,name:['P₁','P₂','P₃','P₄'][i]}))});
  PROBES.forEach((row,i)=>{const button=document.createElement('button');button.type='button';button.className='secondary-button';button.textContent=`Punkt (0,25;${fmt(row.y)})`;button.dataset.point=String(i);button.addEventListener('click',()=>chooseFourPoint(i));$('#four-points').append(button);});
  $('#four-plot').addEventListener('click',event=>{const point=event.target.closest('[data-point]');if(!point)return;const svg=$('#four-plot'),position=svg.createSVGPoint();position.x=event.clientX;position.y=event.clientY;const local=position.matrixTransform(svg.getScreenCTM().inverse());const centers=PROBES.map(row=>385-(row.y+.25)*120);chooseFourPoint(centers.reduce((best,y,i)=>Math.abs(y-local.y)<Math.abs(centers[best]-local.y)?i:best,0));});
  $('#four-plot').addEventListener('keydown',event=>{const point=event.target.closest('[data-point]');if(point&&(event.key==='Enter'||event.key===' ')){event.preventDefault();chooseFourPoint(Number(point.dataset.point));}});
}
function chooseFourPoint(index) {fourPoint=index;renderFourPoint();save();}
function renderFourPoint() {
  const root=$('#four-point-detail');
  document.querySelectorAll('#four-points [data-point]').forEach(button=>{button.setAttribute('aria-pressed',String(Number(button.dataset.point)===fourPoint));button.classList.toggle('is-active',Number(button.dataset.point)===fourPoint);});
  document.querySelectorAll('#four-plot [data-point]').forEach(point=>point.classList.toggle('is-active',Number(point.dataset.point)===fourPoint));
  if(fourPoint===null){root.textContent='Wähle einen Punkt im Diagramm oder über die Buttons.';$('#four-point-status').textContent='';return;}
  const row=PROBES[fourPoint],result=calculate({x1:row.x,x2:row.y,w1:FIXED.w1,w2:FIXED.w2,threshold:FIXED.s});
  const place=['unterhalb der Grenze','auf der Grenze','oberhalb der Grenze'][fourPoint];
  const relation=result.sum===FIXED.s?'=':result.sum>FIXED.s?'>':'≤';
  const fire=result.output?'● Feuert · Ausgabe 1':'○ Feuert nicht · Ausgabe 0';
  root.innerHTML=`<strong class="point-card-title">Punkt (0,25;${fmt(row.y)}) · ${place}</strong><span class="point-card-stations"><span><b>Gewichtete Summe</b><span>a = 4·0,25 + 2·${fmt(row.y)} = ${fmt(result.sum)}</span></span><span><b>Vergleich mit s = 3</b><span>${fmt(result.sum)} ${relation} 3${relation==='='?' · Gleichheit genügt nicht.':''}</span></span><span class="${result.output?'is-firing':'is-quiet'}"><b>Ausgabe</b><span>${fire}</span></span></span>`;
  $('#four-point-status').textContent=`Punkt (0,25;${fmt(row.y)}) ${place}: ${fmt(result.sum)} ${relation} 3. ${fire}.`;
}

function checkSixLine() {
  const relation=inspectFormula('six-line',{kind:'Gleichung',variables:'diagram'});if(!relation.ok)return;
  if(equivalent(relation,parse('y=-2x+2',{kind:'Gleichung'}),{line:true})){showFeedback('six-line','Korrekt. Deine Gleichung beschreibt die eingezeichnete Gerade.','success');mark('six-line',true);}
  else showFeedback('six-line','Noch nicht korrekt. Prüfe, ob (0;2) und (1;0) auf deiner Geraden liegen und ob es dieselbe Gerade ist.');
}
function checkSixDiagram() {
  const relation=inspectFormula('six-diagram',{variables:'diagram'});if(!relation.ok)return;
  if(equivalent(relation,SIX_TARGET)){showFeedback('six-diagram','Korrekt. Die Ungleichung erfasst die feuernde Seite ohne die Grenze.','success');mark('six-diagram',true);}
  else if(sameBoundary(relation,SIX_TARGET))showFeedback('six-diagram','Teilweise korrekt. Deine Grenze passt, aber die markierte Seite oder das strenge Zeichen noch nicht.','partial');
  else showFeedback('six-diagram','Noch nicht korrekt. Teste (1;1) als feuernden und (0;1) als nicht feuernden Punkt.');
}
function checkSixInput() {
  const relation=inspectFormula('six-input',{variables:'input'});if(!relation.ok)return;
  if(equivalent(relation,SIX_TARGET)){showFeedback('six-input','Korrekt. Die Bedingung steht in Eingangsnotation und passt zur Feuerhalbebene.','success');mark('six-input',true);}
  else if(sameBoundary(relation,SIX_TARGET))showFeedback('six-input','Teilweise korrekt. Die Grenze passt, aber kontrolliere das Ungleichheitszeichen nach dem Umformen.','partial');
  else showFeedback('six-input','Noch nicht korrekt. Setze x=x₁ und y=x₂ und bringe die Eingangsterme nach links.');
}
function checkSixParameters() {
  const p=parameters('six');if(!p){showFeedback('six-parameters','Gib für w₁, w₂ und s jeweils eine endliche Zahl ein.');return;}
  const neuron=neuronRelation(p),given=parse(value('six-input'),{variables:'input'});
  if(neuron.ok&&equivalent(neuron,SIX_TARGET)&&equivalent(neuron,given)){showFeedback('six-parameters','Korrekt. Die Parameter passen zu deiner Bedingung; positive gemeinsame Vielfache sind ebenfalls möglich.','success');mark('six-parameters',true);}
  else if(neuron.ok&&countMatching(neuron,SIX_ROWS).count===4)showFeedback('six-parameters','Teilweise korrekt. Dein Neuron trennt die vier Punkte, aber seine Parameter passen nicht zur von dir formulierten Halbebene.','partial');
  else showFeedback('six-parameters','Noch nicht korrekt. Vergleiche die Koeffizienten und die rechte Seite deiner Neuron-Ungleichung.');
}
function checkSixRows() {
  const p=parameters('six');if(!p){showFeedback('six-rows','Gib für w₁, w₂ und s jeweils eine endliche Zahl ein.');return;}
  const expected=rowOutputs(SIX_ROWS,p),answers=readSelects('.six-row-select');
  const n=answers.filter((v,i)=>v===expected[i].output&&v===SIX_ROWS[i].target).length;
  if(n===4){showFeedback('six-rows','Korrekt. Beide Nullpunkte bleiben 0, beide Einspunkte ergeben 1.','success');mark('six-rows',true);}
  else if(n===0)showFeedback('six-rows','Noch nicht korrekt. Setze zuerst (0;1) und (1;0,5) ein.');
  else {const i=answers.findIndex((v,j)=>v!==expected[j].output||v!==SIX_ROWS[j].target),row=SIX_ROWS[i];showFeedback('six-rows',`Teilweise korrekt: ${n} von 4 Ausgaben stimmen. Bei (${fmt(row.x)};${fmt(row.y)}) ergibt dein Neuron ${expected[i].output}, erwartet ist ${row.target}.`,'partial');}
}
function checkSixExpert() {
  const relation=inspectFormula('six-expert',{variables:'input'});if(!relation.ok)return;
  if(equivalent(relation,SIX_REVERSE)&&isExpertNeuronForm(value('six-expert'))){showFeedback('six-expert','Korrekt. Außerhalb der Linie sind die Seiten vertauscht. Auf der Grenze geben beide strengen Neuronen 0 aus.','success');mark('six-expert',true);}
  else if(sameBoundary(relation,SIX_REVERSE))showFeedback('six-expert','Teilweise korrekt. Die Seiten sind vertauscht, aber prüfe das Zeichen beim Multiplizieren mit −1 und den Grenzfall.','partial');
  else showFeedback('six-expert','Noch nicht korrekt. Wähle zuerst die andere Seite der Geraden und forme dann zu > um.');
}
function isExpertNeuronForm(source) {
  const parts=simple(source).replace(/\s/g,'').split('>');
  if(parts.length!==2)return false;
  const left=parse(`${parts[0]}>0`,{variables:'input'});
  const right=parse(`x1>${parts[1]}`,{variables:'input'});
  return left.ok&&Math.abs(left.c)<=1e-9&&right.ok&&Math.abs(right.a-1)<=1e-9&&Math.abs(right.b)<=1e-9;
}

function geoStatus(message) {$('#ggb-status').textContent=message;}
function geoCommand(relation) {
  const [a,b,c]=relation.normalized.map(n=>Number(n.toPrecision(12)));
  return `(${a})*x+(${b})*y+(${c})`;
}
function removeDrawing() {
  if(!ggb)return;
  for(const name of ['FeuerFlaeche','FeuerGrenze']) ggb.deleteObject(name);
}
function renderGeo(part,relation) {
  if(!ggb||!relation.ok) return false;
  removeDrawing();
  const term=geoCommand(relation);
  const area=ggb.evalCommand(`FeuerFlaeche: ${term} > 0`);
  const line=ggb.evalCommand(`FeuerGrenze: ${term} = 0`);
  if(!area||!line){removeDrawing();geoStatus('Die Grafik konnte diesen Entwurf nicht zeichnen. Prüfe die Eingabe erneut.');return false;}
  ggb.setColor('FeuerFlaeche',40,123,97);ggb.setFilling('FeuerFlaeche',.2);ggb.setLineStyle('FeuerFlaeche',2);
  ggb.setColor('FeuerGrenze',18,50,74);ggb.setLineStyle('FeuerGrenze',2);ggb.setLineThickness('FeuerGrenze',5);
  ggb.setLabelVisible('FeuerFlaeche',false);ggb.setLabelVisible('FeuerGrenze',false);
  ggb.setVisible('Vergleichslinie',helper&&part==='a');
  drawn[part]=value('five-'+part);shownPart=part;
  const other=part==='a'?'b':'a';
  clearFeedback('five-'+other);$('#rows-five-'+other).hidden=true;
  geoStatus('Aktuelle Zeichnung für 5'+part+': transparente Fläche = Ausgabe 1, gestrichelte Grenze = Ausgabe 0.');
  save();return true;
}
function configureGeo(api) {
  clearTimeout(ggbTimer);ggb=api;ggbPending=false;ggbFailed=false;
  api.setPerspective('G');
  api.setCoordSystem(-.45,1.55,-.4,1.85);
  api.setAxisLabels(1,'x = x₁','y = x₂','');
  api.evalCommand('Vergleichslinie: x = 0.25');api.setLineStyle('Vergleichslinie',2);api.setColor('Vergleichslinie',189,137,0);api.setVisible('Vergleichslinie',false);api.setFixed('Vergleichslinie',true,false);
  api.setLabelVisible('Vergleichslinie',false);
  for(const row of ROWS) {
    api.evalCommand(`${row.name}=(${row.x},${row.y})`);
    api.setColor(row.name,...(row.target?[40,123,97]:[175,63,71]));
    api.setPointStyle(row.name,row.target?0:5);api.setPointSize(row.name,8);api.setFixed(row.name,true,false);
  }
  for(const part of ['a','b']){ $('#draw-five-'+part).disabled=false;$('#check-five-'+part).disabled=false; }
  geoStatus('Grafik bereit. Gib eine Ungleichung ein und wähle Darstellen oder Ungleichung prüfen.');
  if(shownPart&&drawn[shownPart]===value('five-'+shownPart)) renderGeo(shownPart,parse(drawn[shownPart]));
}
function geoFailure() {
  clearTimeout(ggbTimer);ggbPending=false;ggbFailed=true;
  geoStatus('Die Grafik konnte nicht geladen werden. Lade die Seite erneut; deine Eingaben bleiben gespeichert.');
  for(const part of ['a','b']) {$('#draw-five-'+part).disabled=false;$('#check-five-'+part).disabled=false;}
}
function loadGeoScript() {
  if(typeof window.GGBApplet==='function') return Promise.resolve();
  if(!ggbScriptPromise) ggbScriptPromise=new Promise((resolve,reject)=>{
    const script=document.createElement('script');script.src='https://www.geogebra.org/apps/deployggb.js';script.async=true;
    script.onload=resolve;script.onerror=reject;document.head.append(script);
  });
  return ggbScriptPromise;
}
async function initGeoGebra() {
  if(ggb||ggbPending||ggbFailed)return;
  ggbPending=true;geoStatus('Die Grafik wird geladen.');
  ggbTimer=setTimeout(geoFailure,30000);
  try {
    await loadGeoScript();
    if(ggbFailed)return;
    const applet=new window.GGBApplet({appName:'graphing',width:720,height:520,scaleContainerClass:'ggb-scale-51',autoHeight:true,perspective:'G',showToolBar:false,showMenuBar:false,showAlgebraInput:false,showZoomButtons:false,enableRightClick:false,enableShiftDragZoom:false,enableLabelDrags:false,errorDialogsActive:false,appletOnLoad:configureGeo},true);
    applet.inject('ggb-51');
  } catch {geoFailure();}
}
function drawFive(part,check=false) {
  const id='five-'+part,relation=parse(value(id));
  if(!ggb){showFeedback(id,'Die Grafik konnte nicht geladen werden. Lade die Seite erneut; deine Eingaben bleiben gespeichert.');return;}
  if(!relation.ok) {drawn[part]='';shownPart=null;removeDrawing();geoStatus('Die frühere Zeichnung ist veraltet.');showFeedback(id,relation.message);save();return;}
  if(!renderGeo(part,relation)){showFeedback(id,'Dein neuer Entwurf ist noch nicht gültig dargestellt. Korrigiere die Eingabe; die alte Zeichnung wird nicht als aktuelle Antwort geprüft.');return;}
  if(!check) {clearFeedback(id);$('#rows-'+id).hidden=true;return;}
  const {count,details}=countMatching(relation,ROWS),same=equivalent(relation,TARGET);
  const rows=$('#rows-'+id);rows.hidden=false;rows.replaceChildren();
  for(const row of details){const p=document.createElement('p');p.textContent=`${row.name} (${fmt(row.x)};${fmt(row.y)}): Soll-Ausgabe ${row.target}, berechnete Ausgabe ${row.output} ${row.output===row.target?'✓':'✗'}`;rows.append(p);}
  if(part==='a'){
    const status=document.createElement('p');status.textContent=`Äquivalent zum vorgegebenen Neuron: ${same?'ja':'nein'}. ${count} von 4 Punktklassen passen.`;rows.prepend(status);
    if(same&&count===4){showFeedback(id,'Korrekt. Die gezeichnete offene Halbebene stimmt mit dem vorgegebenen Neuron überein; alle vier Punktklassen passen.','success');mark(id,true);$('#five-helper').hidden=false;}
    else if(sameBoundary(relation,TARGET))showFeedback(id,'Noch nicht korrekt. Die Grenze stimmt, aber die Feuerseite ist vertauscht.');
    else if(count===4)showFeedback(id,'Teilweise korrekt: 4 von 4 Punktklassen passen, aber deine Halbebene ist nicht dieselbe wie beim Neuron (4,2,3). Prüfe einen weiteren Punkt zwischen deinen beiden Grenzen.','partial');
    else if(count===0)showFeedback(id,'Noch nicht korrekt: Keiner der vier Punkte ist richtig klassifiziert. Prüfe zuerst B (1;0) und A (0;0).');
    else {const bad=details.find(row=>row.output!==row.target);showFeedback(id,`Teilweise korrekt: ${count} von 4 Punktklassen passen. Gegenpunkt ${bad.name} (${fmt(bad.x)};${fmt(bad.y)}): erwartet ${bad.target}, berechnet ${bad.output}. Prüfe Grenze und markierte Seite.`,'partial');}
  } else {
    if(count===4){showFeedback(id,'Korrekt. Deine eigene lineare Ungleichung trennt alle vier Punkte passend. Sie darf eine andere Grenze als das vorgegebene Neuron haben.','success');mark(id,true);}
    else if(count===0)showFeedback(id,'Noch nicht korrekt. Prüfe mit B (1;0) einen Punkt mit Soll-Ausgabe 1 und mit D (0;1) einen mit Soll-Ausgabe 0.');
    else {const bad=details.find(row=>row.output!==row.target);showFeedback(id,`Teilweise korrekt: ${count} von 4 Punktklassen passen. Gegenpunkt ${bad.name} (${fmt(bad.x)};${fmt(bad.y)}): erwartet ${bad.target}, berechnet ${bad.output}. Verändere Grenze oder Feuerseite und teste erneut.`,'partial');}
  }
}
function toggleHelper() {helper=!helper;if(ggb)ggb.setVisible('Vergleichslinie',helper&&shownPart==='a');$('#toggle-helper').textContent=helper?'Hilfslinie x = 0,25 ausblenden':'Hilfslinie x = 0,25 zeigen';save();}

function appendSummary(parent,title,auftrag,ergebnis) {
  const article=document.createElement('article');article.className='summary-item';
  const heading=document.createElement('h3');heading.textContent=title;
  const work=document.createElement('p');work.textContent=auftrag;
  const answer=document.createElement('p');answer.textContent=ergebnis;
  article.append(heading,work,answer);parent.append(article);
}
function renderSummary() {
  const root=$('#summary');if(!root)return;root.replaceChildren();
  if(!allCore()) {
    for(const [index,id,title] of [[1,'one','Fehlendes Feuer'],[2,'two','Unerwünschtes Feuer'],[3,'three-rows','Wann feuert es?'],[4,'four-compare','Grenze oder Bereich?'],[5,'five-a','Ungleichung entwickeln und testen'],[6,'six-line','Von der Trennlinie zum Neuron']]) {
      const ids=index===1?['one']:index===2?['two']:index===3?['three-rows','three-probes','three-condition']:index===4?['four-compare','four-inequality','four-line']:index===5?['five-a','five-b']:['six-line','six-diagram','six-input','six-parameters','six-rows'];
      const p=document.createElement('p');p.textContent=`${index} ${title}: ${ids.every(name=>checked[name])?'bearbeitet':'offen'}`;root.append(p);
    }
    return;
  }
  const p1=parameters('one'),p2=parameters('two'),p6=parameters('six');
  appendSummary(root,'1 Fehlendes Feuer','Verändere Gewichte und Schwellenwert so, dass das Perzeptron bei allen vier Eingaben die gewünschte Ausgabe liefert. Prüfe deine Einstellung.',`w₁=${fmt(p1.w1)}, w₂=${fmt(p1.w2)}, s=${fmt(p1.s)}; Ausgaben in Zeilenfolge 0, 0, 1, 1.`);
  appendSummary(root,'2 Unerwünschtes Feuer','Verändere die Einstellung so, dass das Perzeptron bei den ersten beiden Eingaben nicht feuert und bei den letzten beiden feuert. Prüfe anschließend alle Zeilen.',`w₁=${fmt(p2.w1)}, w₂=${fmt(p2.w2)}, s=${fmt(p2.s)}; Ausgaben in Zeilenfolge 0, 0, 1, 1.`);
  appendSummary(root,'3.1 Vier Ausgaben und Grenzproben','Bestimme die vier Ausgaben des Neurons. Untersuche danach, für welche Werte von x₂ es bei x₁ = 0,25 feuert.','A=0, D=0, B=1, C=1; bei x₂ = 0,5 / 1 / 1,5 sind die Ausgaben 0 / 0 / 1.');
  appendSummary(root,'3.2 Feuerbedingung','Formuliere eine Ungleichung für alle Eingaben, bei denen das Perzeptron feuert.',value('three-condition'));
  appendSummary(root,'4.1 Grenze und Bereich','Vergleiche einen Punkt auf der Grenze mit Punkten auf beiden Seiten. Entscheide, ob eine Gleichung allein alle feuernden Eingaben beschreibt.','Eine Gleichung beschreibt die Punkte auf der Trennlinie. Die Ungleichung beschreibt die offene Feuerhalbebene; auf der Grenze ist die Ausgabe 0.');
  appendSummary(root,'4.2 Umformung und Trennlinie','Löse deine Ungleichung nach x₂ auf. Gib anschließend die Gleichung der Trennlinie in x-y-Notation an.',`${value('four-inequality')}; ${value('four-line')}.`);
  appendSummary(root,'5a Vorgegebenes Neuron','Gib deine Ungleichung aus dem vorherigen Schritt ein und stelle die Feuerhalbebene dar. Prüfe, ob sie zum Neuron und zu allen vier Datenpunkten passt.',`${value('five-a')} ist zur Feuerhalbebene des Neurons äquivalent; A/D=0 und B/C=1.`);
  appendSummary(root,'5a Hilfslinie','Blende die Hilfslinie x = 0,25 ein. Vergleiche den gezeichneten Feuerbereich mit deinem Ergebnis aus Reiter 3.','Bei x = 0,25 liegt der Grenzpunkt bei y = 1; dort ist die Ausgabe 0.');
  appendSummary(root,'5b Eigene Trennung','Entwickle eine andere lineare Ungleichung, die bei B und C erfüllt ist und bei A und D nicht. Teste sie und verbessere sie bei Bedarf.',`${value('five-b')} trennt A/D=0 und B/C=1. Beispiel: x>0,5.`);
  appendSummary(root,'6.1 Gerade','Bestimme die Gleichung der eingezeichneten Trennlinie.',value('six-line'));
  appendSummary(root,'6.2 Feuer-Ungleichung','Beschreibe die Seite mit Soll-Ausgabe 1 durch eine strenge Ungleichung.',value('six-diagram'));
  appendSummary(root,'6.3 Eingangsnotation','Ersetze x und y durch x₁ und x₂ und forme die Bedingung zur Neuronform um.',value('six-input'));
  appendSummary(root,'6.4 Parameter','Lies passende Werte für w₁, w₂ und s aus deiner Bedingung ab.',`w₁=${fmt(p6.w1)}, w₂=${fmt(p6.w2)}, s=${fmt(p6.s)}.`);
  appendSummary(root,'6.5 Kontrolle','Berechne die Ausgaben deines Neurons für alle vier Punkte.','Ausgaben in Zeilenfolge 0, 0, 1, 1.');
  if(checked['six-expert']) appendSummary(root,'6.E Expertenaufgabe','Vertausche außerhalb der Trennlinie die feuernde und die nicht feuernde Seite. Forme die neue Bedingung so um, dass wieder ein >-Zeichen zwischen Summe und Schwellenwert steht.',`${value('six-expert')}; auf der Grenze liefern beide strengen Neuronen Ausgabe 0.`);
}

const QUIZ=[
  {solution:['weight','threshold'],hint:'Vergleiche, wie Gewicht und Schwellenwert den Test a > s beeinflussen.'},
  {solution:['sum','output'],hint:'Setze die beiden Nullen ein und vergleiche 0 streng mit −0,5.'},
  {solution:['line','half'],hint:'Prüfe getrennt einen Punkt auf der Linie und einen Punkt in der Feuerhalbebene.'},
  {solution:['edge','above'],hint:'Berechne 4·0,25 + 2·x₂ und vergleiche mit 3.'},
  {solution:['simple','scaled'],hint:'Positive Faktoren erhalten die Richtung. Bei Multiplikation mit einer negativen Zahl kehrt das Zeichen um.'},
  {solution:['simple','scaled'],hint:'Vergleiche die drei Parameter als gemeinsames positives Vielfaches und prüfe den Grenzfall.'},
];
function quizChoicesCorrect() {return QUIZ.every((question,i)=>{const chosen=[...document.querySelectorAll(`#quiz-${i+1} input:checked`)].map(el=>el.value);return chosen.length===question.solution.length&&chosen.every(v=>question.solution.includes(v));});}
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
  quizPassed=true;showFeedback('quiz','Korrekt. Alle sechs Fragen sind vollständig richtig beantwortet.','success');showQuizResults();save();
}
function setupQuiz() {
  quizControl=window.addQuizQuestionChecks?.({questions:QUIZ.map((question,i)=>({fieldset:$('#quiz-'+(i+1)),...question})),buttonClass:'primary-button',feedbackClass:'feedback',levels:{high:'success',medium:'partial',low:'error'},onAllCorrect:finishQuiz});
  $('#final-quiz').addEventListener('submit',event=>{event.preventDefault();const correct=quizControl?.checkAll()||0;if(correct===QUIZ.length)finishQuiz();else showFeedback('quiz',`Noch nicht korrekt. ${correct} von ${QUIZ.length} Fragen sind vollständig richtig.`);});
  document.querySelectorAll('#final-quiz input').forEach(el=>el.addEventListener('change',()=>{quizPassed=false;$('#quiz-results').hidden=true;clearFeedback('quiz');save();}));
}
function resetModule() {
  fields.forEach(el=>{if(el.type==='checkbox'||el.type==='radio')el.checked=false;else el.value=defaults[el.id]??'';});
  helpDetails.forEach(el=>el.open=false);checked=Object.fromEntries(FLAGS.map(id=>[id,false]));drawn={a:'',b:''};helper=false;shownPart=null;quizPassed=false;
  removeDrawing();if(ggb)ggb.setVisible('Vergleichslinie',false);
  document.querySelectorAll('.feedback').forEach(el=>{el.hidden=true;el.textContent='';});
  for(const id of ['rows-five-a','rows-five-b','five-helper','four-remember','four-convert','three-probes','three-formula','quiz-results']) $('#'+id).hidden=true;
  $('#toggle-helper').textContent='Hilfslinie x = 0,25 zeigen';
  model={one:{...START.one},two:{...START.two}};selectedRows={one:0,two:0,three:'row-0'};threeMode='task';explore={...FIXED};exploreUsed=false;fourPoint=null;
  updateParameterTable('one');updateParameterTable('two');for(const prefix of ['one','two','three'])renderNeuron(prefix);renderFourPoint();showStep('one');
  try{localStorage.removeItem(KEY);$('#save-status').textContent='Das Modul wurde neu begonnen.';}catch{$('#save-status').textContent='Das Modul wurde neu begonnen; der Browser konnte den gespeicherten Stand nicht löschen.';}
}

function attachEvents() {
  for(const prefix of ['one','two']){
    $('#check-'+prefix).addEventListener('click',()=>checkParameters(prefix));
  }
  for(const cls of ['three-row-select','three-probe-select','six-row-select'])document.querySelectorAll('.'+cls).forEach(el=>el.addEventListener('change',()=>invalidate(cls==='three-row-select'?'three-rows':cls==='three-probe-select'?'three-probes':'six-rows')));
  for(const id of ['three-condition','four-inequality','four-line','six-line','six-diagram','six-input','six-expert'])$('#'+id).addEventListener('input',()=>invalidate(id));
  document.querySelectorAll('input[name=four-compare]').forEach(el=>el.addEventListener('change',()=>invalidate('four-compare')));
  for(const suffix of ['w1','w2','s'])$('#six-'+suffix).addEventListener('input',()=>{invalidate('six-parameters');invalidate('six-rows');});
  for(const part of ['a','b']) {
    $('#five-'+part).addEventListener('input',()=>{invalidate('five-'+part);drawn[part]='';if(shownPart===part){shownPart=null;removeDrawing();geoStatus('Die frühere Zeichnung ist veraltet.');}$('#rows-five-'+part).hidden=true;save();});
    $('#draw-five-'+part).addEventListener('click',()=>drawFive(part,false));
    $('#check-five-'+part).addEventListener('click',()=>drawFive(part,true));
  }
  $('#toggle-helper').addEventListener('click',toggleHelper);
  for(const [id,handler] of Object.entries({'three-rows':checkThreeRows,'three-probes':checkThreeProbes,'three-condition':checkThreeCondition,'four-compare':checkFourCompare,'four-inequality':checkFourInequality,'four-line':checkFourLine,'six-line':checkSixLine,'six-diagram':checkSixDiagram,'six-input':checkSixInput,'six-parameters':checkSixParameters,'six-rows':checkSixRows,'six-expert':checkSixExpert}))$('#check-'+id).addEventListener('click',handler);
  helpDetails.forEach(el=>el.addEventListener('toggle',save));
  $('#reset-module').addEventListener('click',resetModule);
}
function start() {
  buildTables();
  fields=[...document.querySelectorAll('input,select,textarea')];
  defaults=Object.fromEntries(fields.filter(el=>el.id).map(el=>[el.id,el.value]));
  setupTabs();setupNeurons();setupStaticPlots();setupQuiz();attachEvents();
  load();
  updateParameterTable('one');updateParameterTable('two');
  for(const prefix of ['one','two','three'])renderNeuron(prefix);renderFourPoint();
  $('#three-probes').hidden=!checked['three-rows'];$('#three-formula').hidden=!checked['three-probes'];
  $('#four-remember').hidden=!checked['four-compare'];$('#four-convert').hidden=!checked['four-compare'];
  $('#five-helper').hidden=!checked['five-a'];
  $('#toggle-helper').textContent=helper?'Hilfslinie x = 0,25 ausblenden':'Hilfslinie x = 0,25 zeigen';
  if(quizPassed){showQuizResults();showFeedback('quiz','Korrekt. Alle sechs Fragen sind vollständig richtig beantwortet.','success');}
  showStep(active);
}
start();
