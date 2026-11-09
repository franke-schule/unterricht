import {calculate,normaliseNumber} from '../logic/perceptron.mjs';
import {parseLinearRelation as parse,equivalent,sameBoundary,countMatching} from '../logic/linear-inequality.mjs?v=20261015-fractions';
import {unlockSolution} from '../../../../klasse-10/1-Datenbanken/tab-navigation.mjs';

const KEY='informatik11-perzeptron-aufgabe5-1-grafisch-v1';
const IDS=['discover','four','five','six','seven','eight'];
const ROWS=[{name:'U1',x:0,y:4,target:1},{name:'U2',x:2,y:2,target:1},{name:'G1',x:4,y:1,target:0},{name:'G2',x:6,y:2,target:0}];
const SIX_ROWS=ROWS;
const FOUR_POINTS=[{name:'T1',kind:'Testtier',x:2,y:1,target:0},{name:'T2',kind:'Testtier',x:2,y:1.75,target:0},{name:'U2',kind:'Trainingspunkt',x:2,y:2,target:1}];
const SIX_TARGET=parse('-x1+2x2>1');
const SIX_REVERSE=parse('x1-2x2>-1');
const FLAGS=['discover-fox','discover-mc','four-mc-1','four-mc-2','four-mc-3','five-a','six-line','six-diagram','six-input','six-parameters','six-rows','six-expert'];
const REQUIRED=FLAGS.filter(id=>id!=='six-expert');
const $=selector=>document.querySelector(selector);
const value=id=>$('#'+id).value;
const fmt=n=>Number.isInteger(n)?String(n):String(Math.round(n*1e9)/1e9).replace('.',',');
const sameSet=(a,b)=>a.length===b.length&&b.every(item=>a.includes(item));
let checked=Object.fromEntries(FLAGS.map(id=>[id,false]));
let drawn={a:''};
let active='discover',quizPassed=false,ggb=null,ggbPending=false,ggbFailed=false,ggbTimer=null,ggbScriptPromise=null;
let quizControl=null,fourQuizControl=null,fourMode='none',sixScrollTop=0,scrollTimer=null;
let quizChecked=Array(5).fill(false);
let fields=[];
const helpDetails=[...document.querySelectorAll('.step-panel details')];
let fourPoint=null;
let geometryStep=-1,foxX=null,foxY=null,foxClass='';

function feedbackElement(id) { return $('#feedback-'+id)||$('#'+id+'-feedback'); }
function showFeedback(id,text,level='error') { const el=feedbackElement(id); el.hidden=false; el.textContent=text; el.className='feedback '+level; }
function clearFeedback(id) { const el=feedbackElement(id); if(el){el.hidden=true;el.textContent='';el.className='feedback';} }
function mark(id,valid) { checked[id]=!!valid; save(); updateProgress(); }
function invalidate(id) { checked[id]=false; clearFeedback(id); save(); updateProgress(); }
function getNum(id) { const raw=value(id).trim(); if(!raw) return null; const n=normaliseNumber(raw); return n!==null&&Number.isFinite(n)?n:null; }
function parameters() { const w1=getNum('six-w1'),w2=getNum('six-w2'),s=getNum('six-s'); return [w1,w2,s].every(Number.isFinite)?{w1,w2,s}:null; }
function rowOutputs(rows,params) { return rows.map(row=>({...row,...calculate({x1:row.x,x2:row.y,w1:params.w1,w2:params.w2,threshold:params.s})})); }
function selected(select) { return select.value===''?null:Number(select.value); }
function readSelects(selector) { return [...document.querySelectorAll(selector)].map(selected); }
function updateProgress() {
  const n=REQUIRED.filter(id=>checked[id]).length;
  $('#progress').textContent=`${n} von ${REQUIRED.length} Kern-Teilaufgaben richtig geprüft.`;
  renderSummary();
}
function save() {
  try {
    const controls=Object.fromEntries(fields.map(el=>[fieldKey(el),el.type==='checkbox'||el.type==='radio'?el.checked:el.value]));
    localStorage.setItem(KEY,JSON.stringify({version:1,controls,checked,drawn,active,quizPassed,quizChecked,helps:helpDetails.map(el=>el.open),fourPoint,fourMode,sixScrollTop,geometryStep,foxX,foxY,foxClass}));
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
  if(Number.isInteger(data.geometryStep)&&data.geometryStep>=-1&&data.geometryStep<5)geometryStep=data.geometryStep;
  if(Number.isInteger(data.foxX)&&data.foxX>=0&&data.foxX<=7)foxX=data.foxX;
  if(Number.isInteger(data.foxY)&&data.foxY>=0&&data.foxY<=5)foxY=data.foxY;
  if(['danger','safe'].includes(data.foxClass))foxClass=data.foxClass;
  if(Number.isInteger(data.fourPoint)&&data.fourPoint>=0&&data.fourPoint<3)fourPoint=data.fourPoint;
  if(['none','line','half'].includes(data.fourMode))fourMode=data.fourMode;
  if(Number.isFinite(data.sixScrollTop)&&data.sixScrollTop>=0)sixScrollTop=data.sixScrollTop;
  if(Array.isArray(data.helps)) helpDetails.forEach((el,i)=>{if(typeof data.helps[i]==='boolean') el.open=data.helps[i];});
  if(validSaved(data.drawn?.a)&&parse(data.drawn.a).ok&&data.drawn.a===value('five-a')) drawn.a=data.drawn.a;
  if(IDS.includes(data.active)) active=data.active;
  // Gespeicherte Prüfzeichen gelten nur zusammen mit erneut geprüften aktuellen Antworten.
  if(data.checked&&typeof data.checked==='object') for(const id of FLAGS) if(data.checked[id]===true) {
    if(validateFlag(id))checked[id]=true;
  }
  quizPassed=data.quizPassed===true&&quizChoicesCorrect();
  quizChecked=QUIZ.map((_,i)=>(quizPassed||data.quizChecked?.[i]===true)&&quizQuestionCorrect(i));
  $('#save-status').textContent='Dein Bearbeitungsstand wurde wiederhergestellt.';
}
function validateFlag(id) {
  if(id==='discover-fox')return foxX===5&&foxY===3&&foxClass==='danger';
  if(id==='discover-mc')return sameSet([...$('#discover-options').querySelectorAll('input:checked')].map(el=>el.value),['x1','x2','safe']);
  if(id.startsWith('four-mc-')) return fourChoicesCorrect(Number(id.at(-1)));
  if(id==='five-a') return drawn.a===value('five-a')&&countMatching(parse(drawn.a),ROWS).count===4;
  if(id==='six-line') return equivalent(parse(value('six-line'),{kind:'Gleichung'}),parse('y=0.5x+0.5',{kind:'Gleichung'}),{line:true});
  if(id==='six-diagram') return equivalent(parse(value('six-diagram')),SIX_TARGET);
  if(id==='six-input') return equivalent(parse(value('six-input'),{variables:'input'}),SIX_TARGET);
  if(id==='six-parameters') {const p=parameters('six');return !!p&&equivalent(neuronRelation(p),parse(value('six-input'),{variables:'input'}))&&equivalent(neuronRelation(p),SIX_TARGET);}
  if(id==='six-rows') {const p=parameters('six');return !!p&&readSelects('.six-row-select').every((v,i)=>v===rowOutputs(SIX_ROWS,p)[i].output&&v===SIX_ROWS[i].target);}
  if(id==='six-expert') return equivalent(parse(value('six-expert'),{variables:'input'}),SIX_REVERSE);
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
  if(id==='six') requestAnimationFrame(()=>{const pane=$('#six .six-work');sixScrollTop=Math.min(sixScrollTop,Math.max(0,pane.scrollHeight-pane.clientHeight));pane.scrollTop=sixScrollTop;save();});
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
  IDS.slice(0,4).forEach((id,i)=>{const button=document.createElement('button');button.type='button';button.className='primary-button';button.textContent='Weiter';button.addEventListener('click',()=>showStep(IDS[i+1],true));$('#'+id+' .flow-navigation').append(button);});
  const next=document.createElement('button');next.type='button';next.className='primary-button';next.textContent='Zum Abschlussquiz';next.addEventListener('click',()=>showStep('eight',true));$('#seven .flow-navigation').append(next);
}
function buildTables() {
  const select=(id,cls,label)=>`<select id="${id}" class="${cls}" aria-label="${label}"><option value="">–</option><option value="0">0</option><option value="1">1</option></select>`;
  $('#six-table').innerHTML=SIX_ROWS.map((row,i)=>`<tr><th scope="row">${row.name}</th><td>${fmt(row.x)}</td><td>${fmt(row.y)}</td><td>${select('six-row-'+i,'six-row-select',`Ausgabe für ${row.name}`)}</td></tr>`).join('');
}
function inspectFormula(id,{kind='Ungleichung',variables='both'}={}) {
  const relation=parse(value(id),{kind,variables});
  if(!relation.ok) showFeedback(id,relation.message);
  return relation;
}
const FOUR_QUIZ=[
  {solution:['A','B'],hint:'Setze T2 in die Gleichung ein und beachte den Unterschied zwischen Linie und ganzer Seite.'},
  {solution:['A','B'],hint:'Vergleiche bei U2 und T2 die Summen 2 und 1 streng mit der Schwelle 1.'},
  {solution:['A','B'],hint:'Auf der Linie gilt Gleichheit; prüfe die Ausgabe von T1, T2 und U2 einzeln.'},
];
function fourChoicesCorrect(number) {
  const chosen=[...document.querySelectorAll(`#four-quiz-${number} input:checked`)].map(el=>el.value);
  return chosen.length===2&&chosen.includes('A')&&chosen.includes('B');
}
function setupFourQuiz() {
  fourQuizControl=window.addQuizQuestionChecks?.({questions:FOUR_QUIZ.map((q,i)=>({fieldset:$('#four-quiz-'+(i+1)),number:i+1,...q})),buttonClass:'primary-button',feedbackClass:'feedback',levels:{high:'success',medium:'partial',low:'error'},onCheck:(q,result)=>{checked['four-mc-'+q.number]=result==='correct';save();updateProgress();renderFourRemember();},onAllCorrect:()=>renderFourRemember()});
  for(let i=1;i<=3;i++)$('#four-quiz-'+i).querySelectorAll('input').forEach(el=>el.addEventListener('change',()=>{checked['four-mc-'+i]=false;renderFourRemember();save();updateProgress();}));
}
function renderFourRemember() {$('#four-remember').hidden=![1,2,3].every(i=>checked['four-mc-'+i]);}
function setFourMode(mode) {fourMode=mode;renderFourMode();save();}
function renderFourMode() {
  $('#four-show-line').setAttribute('aria-pressed',String(fourMode==='line'));
  $('#four-show-half').setAttribute('aria-pressed',String(fourMode==='half'));
  $('#four-display').hidden=fourMode==='none';
  $('#four-display').textContent=fourMode==='line'?'Geradengleichung: −3x₁ + 4x₂ = 1. Sie beschreibt nur die Trennlinie.':fourMode==='half'?'Ungleichung: −3x₁ + 4x₂ > 1. Sie beschreibt die offene Seite mit Ausgabe 1; die Linie gehört nicht dazu.':'';
  renderFourPlot();
}
function renderFourPlot() {
  renderSvg('four-plot',{line:[[0,.25],[5,4]],showLine:fourMode!=='none',half:fourMode==='half',points:[{x:2,y:1,target:0,name:'T1'},{x:2,y:1.75,target:0,name:'T2'},{x:2,y:2,target:1,name:'U2'}]});
  renderFourPoint();
}

function svgPoint(x,y,target,label,px,py,index=null) {
  const X=px(x),Y=py(y);
  const size=index===null?10:6;
  const shape=target?`<circle class="safe-point" cx="${X}" cy="${Y}" r="${size}"/>`:`<rect class="danger-point" x="${X-size}" y="${Y-size}" width="${size*2}" height="${size*2}"/>`;
  if(index===null)return `${shape}<text x="${X+14}" y="${Y-12}">${label} · Soll ${target}</text>`;
  const labelY=[Y+32,Y+5,Y-18][index];
  return `<g class="four-svg-point" data-point="${index}" role="button" tabindex="0" aria-label="${label} (${fmt(x)}|${fmt(y)}), Soll-Ausgabe ${target} anzeigen"><circle class="four-point-hit" cx="${X}" cy="${Y}" r="14"/><circle class="four-point-ring" cx="${X}" cy="${Y}" r="8"/>${shape}<text x="${X+14}" y="${labelY}" aria-hidden="true">${label} · Soll ${target}</text></g>`;
}
function renderSvg(id,{line,points,showLine=true,half=false}) {
  const svg=$('#'+id),px=x=>70+x*90,py=y=>390-y*75;
  const grid=[0,1,2,3,4].map(y=>`<line x1="70" y1="${py(y)}" x2="610" y2="${py(y)}"/>`).join('')+[0,1,2,3,4,5,6].map(x=>`<line x1="${px(x)}" y1="90" x2="${px(x)}" y2="390"/>`).join('');
  const marks=points.map((p,i)=>svgPoint(p.x,p.y,p.target,p.name,px,py,id==='four-plot'?i:null)).join('');
  const halfArea=half?`<polygon class="four-fire-half" points="70,90 ${px(5)},90 70,${py(.25)}"/>`:'';
  svg.innerHTML=`${halfArea}<g class="geometry-grid">${grid}</g><g class="geometry-axes"><line x1="70" y1="390" x2="630" y2="390"/><line x1="70" y1="390" x2="70" y2="70"/></g>${showLine?`<line class="boundary-line" x1="${px(line[0][0])}" y1="${py(line[0][1])}" x2="${px(line[1][0])}" y2="${py(line[1][1])}"/>`:''}<g class="geometry-ticks">${[0,1,2,3,4,5,6].map(x=>`<text x="${px(x)-5}" y="414">${x}</text>`).join('')}${[1,2,3,4].map(y=>`<text x="43" y="${py(y)+5}">${y}</text>`).join('')}</g><text class="axis-label" x="470" y="440">x₁: Zahnlänge</text><text class="axis-label" x="10" y="65">x₂: Augengröße</text>${marks}`;
}
function setupStaticPlots() {
  renderFourPlot();
  $('#four-show-line').addEventListener('click',()=>setFourMode('line'));
  $('#four-show-half').addEventListener('click',()=>setFourMode('half'));
  renderSvg('six-plot',{line:[[0,.5],[6,3.5]],points:SIX_ROWS});
  FOUR_POINTS.forEach((row,i)=>{const button=document.createElement('button');button.type='button';button.className='secondary-button';button.textContent=`${row.kind} ${row.name} (${fmt(row.x)}|${fmt(row.y)}) · Soll ${row.target}`;button.dataset.point=String(i);button.addEventListener('click',()=>chooseFourPoint(i));$('#four-points').append(button);});
  $('#four-plot').addEventListener('click',event=>{const point=event.target.closest('[data-point]');if(point)chooseFourPoint(Number(point.dataset.point));});
  $('#four-plot').addEventListener('keydown',event=>{const point=event.target.closest('[data-point]');if(point&&(event.key==='Enter'||event.key===' ')){event.preventDefault();chooseFourPoint(Number(point.dataset.point));}});
}
function chooseFourPoint(index) {fourPoint=index;renderFourPoint();save();}
function renderFourPoint() {
  const root=$('#four-point-detail');
  document.querySelectorAll('#four-points [data-point]').forEach(button=>{button.setAttribute('aria-pressed',String(Number(button.dataset.point)===fourPoint));button.classList.toggle('is-active',Number(button.dataset.point)===fourPoint);});
  document.querySelectorAll('#four-plot [data-point]').forEach(point=>point.classList.toggle('is-active',Number(point.dataset.point)===fourPoint));
  if(fourPoint===null){root.textContent='Wähle einen Punkt im Diagramm oder über die Buttons.';$('#four-point-status').textContent='';return;}
  const row=FOUR_POINTS[fourPoint],result=calculate({x1:row.x,x2:row.y,w1:-3,w2:4,threshold:1});
  const place=['unterhalb der Grenze','auf der Grenze','oberhalb der Grenze'][fourPoint];
  const relation=result.sum===1?'=':result.sum>1?'>':'<';
  const fire=result.output?'● Ausgabe 1 · ungefährlich':'○ Ausgabe 0 · gefährlich';
  root.innerHTML=`<strong class="point-card-title">${row.kind} ${row.name} (${fmt(row.x)}|${fmt(row.y)}) · ${place}</strong><span class="point-card-stations"><span><b>Gewichtete Summe</b><span>a = −3·${fmt(row.x)} + 4·${fmt(row.y)} = ${fmt(result.sum)}</span></span><span><b>Vergleich mit s = 1</b><span>${fmt(result.sum)} ${relation} 1${relation==='='?' · Gleichheit genügt nicht.':''}</span></span><span class="${result.output?'is-firing':'is-quiet'}"><b>Ausgabe</b><span>${fire}</span></span></span>`;
  $('#four-point-status').textContent=`${row.name} (${fmt(row.x)}|${fmt(row.y)}) ${place}: ${fmt(result.sum)} ${relation} 1. ${fire}.`;
}

function checkSixLine() {
  const relation=inspectFormula('six-line',{kind:'Gleichung'});if(!relation.ok)return;
  if(equivalent(relation,parse('y=0.5x+0.5',{kind:'Gleichung'}),{line:true})){showFeedback('six-line','Korrekt. y = 0,5x + 0,5.','success');mark('six-line',true);}
  else showFeedback('six-line','Noch nicht korrekt. Suche zwei gut ablesbare Punkte auf der Geraden.');
}
function checkSixDiagram() {
  const relation=inspectFormula('six-diagram');if(!relation.ok)return;
  if(equivalent(relation,SIX_TARGET)){showFeedback('six-diagram','Korrekt. y > 0,5x + 0,5.','success');mark('six-diagram',true);}
  else if(sameBoundary(relation,SIX_TARGET))showFeedback('six-diagram','Teilweise korrekt. Deine Grenze passt, aber die markierte Seite oder das strenge Zeichen noch nicht.','partial');
  else showFeedback('six-diagram','Noch nicht korrekt. Prüfe, auf welcher Seite U2 und G1 liegen.');
}
function checkSixInput() {
  const relation=inspectFormula('six-input',{variables:'input'});if(!relation.ok)return;
  if(equivalent(relation,SIX_TARGET)){showFeedback('six-input','Korrekt. -x₁ + 2x₂ > 1.','success');mark('six-input',true);}
  else if(sameBoundary(relation,SIX_TARGET))showFeedback('six-input','Teilweise korrekt. Die Grenze passt, aber kontrolliere das Ungleichheitszeichen nach dem Umformen.','partial');
  else showFeedback('six-input','Noch nicht korrekt. Im Diagramm ist x der Eingang x₁ und y der Eingang x₂.');
}
function checkSixParameters() {
  const p=parameters('six');if(!p){showFeedback('six-parameters','Gib für w₁, w₂ und s jeweils eine endliche Zahl ein.');return;}
  const neuron=neuronRelation(p),given=parse(value('six-input'),{variables:'input'});
  if(neuron.ok&&equivalent(neuron,SIX_TARGET)&&equivalent(neuron,given)){showFeedback('six-parameters','Korrekt. w₁=-1, w₂=2, s=1 oder ein gemeinsames positives Vielfaches.','success');mark('six-parameters',true);}
  else if(neuron.ok&&countMatching(neuron,SIX_ROWS).count===4)showFeedback('six-parameters','Teilweise korrekt. Dein Neuron trennt die vier Punkte, aber seine Parameter passen nicht zur von dir formulierten Halbebene.','partial');
  else showFeedback('six-parameters','Noch nicht korrekt. Vergleiche deine Bedingung mit w₁x₁ + w₂x₂ > s.');
}
function checkSixRows() {
  const p=parameters('six');if(!p){showFeedback('six-rows','Gib für w₁, w₂ und s jeweils eine endliche Zahl ein.');return;}
  const expected=rowOutputs(SIX_ROWS,p),answers=readSelects('.six-row-select');
  const n=answers.filter((v,i)=>v===expected[i].output&&v===SIX_ROWS[i].target).length;
  if(n===4){showFeedback('six-rows','Korrekt. U1=1, U2=1, G1=0, G2=0.','success');mark('six-rows',true);}
  else if(n===0)showFeedback('six-rows','Noch nicht korrekt. Setze für jedes Tier seine beiden Koordinaten ein.');
  else {const i=answers.findIndex((v,j)=>v!==expected[j].output||v!==SIX_ROWS[j].target),row=SIX_ROWS[i];showFeedback('six-rows',`Teilweise korrekt: ${n} von 4 Ausgaben stimmen. Bei (${fmt(row.x)};${fmt(row.y)}) ergibt dein Neuron ${expected[i].output}, erwartet ist ${row.target}.`,'partial');}
}
function checkSixExpert() {
  const relation=inspectFormula('six-expert',{variables:'input'});if(!relation.ok)return;
  if(equivalent(relation,SIX_REVERSE)){showFeedback('six-expert','Korrekt. Außerhalb der Linie sind die Seiten vertauscht. Auf der Grenze geben beide strengen Neuronen 0 aus.','success');mark('six-expert',true);}
  else if(sameBoundary(relation,SIX_REVERSE))showFeedback('six-expert','Teilweise korrekt. Die Seiten sind vertauscht, aber prüfe das Zeichen beim Multiplizieren mit −1 und den Grenzfall.','partial');
  else showFeedback('six-expert','Noch nicht korrekt. Wähle die andere Seite derselben Geraden und prüfe das Ungleichheitszeichen.');
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
function renderGeo(relation) {
  if(!ggb||!relation.ok) return false;
  removeDrawing();
  const term=geoCommand(relation);
  const area=ggb.evalCommand(`FeuerFlaeche: ${term} > 0`);
  const line=ggb.evalCommand(`FeuerGrenze: ${term} = 0`);
  if(!area||!line){removeDrawing();geoStatus('Die Grafik konnte diesen Entwurf nicht zeichnen. Prüfe die Eingabe erneut.');return false;}
  ggb.setColor('FeuerFlaeche',40,123,97);ggb.setFilling('FeuerFlaeche',.2);ggb.setLineStyle('FeuerFlaeche',2);
  ggb.setColor('FeuerGrenze',18,50,74);ggb.setLineStyle('FeuerGrenze',2);ggb.setLineThickness('FeuerGrenze',5);
  ggb.setLabelVisible('FeuerFlaeche',false);ggb.setLabelVisible('FeuerGrenze',false);
  drawn.a=value('five-a');
  geoStatus('Aktuelle Zeichnung: transparente Fläche = Ausgabe 1, gestrichelte Grenze = Ausgabe 0.');
  save();return true;
}
function updateFiveDrawing() {
  if(!ggb)return;
  const relation=parse(value('five-a'));
  drawn.a='';
  if(!relation.ok){removeDrawing();geoStatus('Noch keine gültige Zeichnung: '+relation.message);save();return;}
  renderGeo(relation);
}
function configureGeo(api) {
  clearTimeout(ggbTimer);ggb=api;ggbPending=false;ggbFailed=false;
  api.setPerspective('G');
  api.setCoordSystem(-.5,6.7,-.5,4.6);
  api.setAxisLabels(1,'x = x₁','y = x₂','');
  for(const row of ROWS) {
    api.evalCommand(`${row.name}=(${row.x},${row.y})`);
    api.setColor(row.name,...(row.target?[40,123,97]:[175,63,71]));
    api.setPointStyle(row.name,row.target?0:5);api.setPointSize(row.name,8);api.setFixed(row.name,true,false);
  }
  $('#check-five-a').disabled=false;
  updateFiveDrawing();
}
function geoFailure() {
  clearTimeout(ggbTimer);ggbPending=false;ggbFailed=true;
  geoStatus('Die Grafik konnte nicht geladen werden. Lade die Seite erneut; deine Eingaben bleiben gespeichert.');
  $('#check-five-a').disabled=false;
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
function checkFive() {
  const id='five-a',relation=parse(value(id));
  if(!ggb){geoStatus('Die Grafik konnte nicht geladen werden. Die Prüfung ohne Zeichnung ist möglich.');}
  if(!relation.ok) {drawn.a='';removeDrawing();geoStatus('Noch keine gültige Zeichnung: '+relation.message);showFeedback(id,relation.message);save();return;}
  if(ggb&&!renderGeo(relation)){showFeedback(id,'Dein neuer Entwurf ist noch nicht gültig dargestellt. Korrigiere die Eingabe.');return;}
  if(!ggb)drawn.a=value(id);
  const {count,details}=countMatching(relation,ROWS);
  const rows=$('#rows-'+id);rows.hidden=false;rows.replaceChildren();
  const status=document.createElement('p');status.textContent=`${count} von 4 Punktklassen passen.`;rows.append(status);
  for(const row of details){const p=document.createElement('p');p.textContent=`${row.name} (${fmt(row.x)};${fmt(row.y)}): Soll-Ausgabe ${row.target}, berechnete Ausgabe ${row.output} ${row.output===row.target?'✓':'✗'}`;rows.append(p);}
  if(count===4){showFeedback(id,'Korrekt. Deine strenge Ungleichung trennt alle vier Trainingspunkte: U1 und U2 erhalten 1, G1 und G2 erhalten 0.','success');mark(id,true);}
  else if(count===0)showFeedback(id,'Noch nicht korrekt. Vergleiche U2 (2|2) mit G1 (4|1) und beachte den strengen Vergleich.');
  else {const bad=details.find(row=>row.output!==row.target);showFeedback(id,`Teilweise korrekt: ${count} von 4 Klassen passen. Bei ${bad.name} (${fmt(bad.x)}|${fmt(bad.y)}) ist ${bad.target} erwartet, deine Ungleichung liefert ${bad.output}. Prüfe Grenze oder Feuerseite erneut.`,'partial');}
}
function appendSummary(parent,title,auftrag,antwort,ergebnis,complete=false) {
  const article=document.createElement('article');article.className='summary-item summary-section';
  const heading=document.createElement('h3');heading.textContent=title+' ';
  const badge=document.createElement('span');badge.className='summary-result '+(complete?'complete':'open');badge.textContent=complete?'✓ richtig geprüft':'noch offen';heading.append(badge);
  const prompt=document.createElement('p');prompt.className='prompt';prompt.textContent=auftrag;
  const list=document.createElement('dl');list.className='summary-grid';
  const add=(term,text)=>{const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=term;dd.textContent=text;list.append(dt,dd);};
  add('Deine Antwort',antwort||'Noch keine Eingabe');
  if(complete)add('Richtiges Ergebnis',ergebnis);
  article.append(heading,prompt,list);parent.append(article);
}
function summaryRows(rows,answers) {
  return rows.map((row,i)=>`${row.name?row.name+' ':''}(${fmt(row.x)};${fmt(row.y)}): Ausgabe ${answers[i]===null?'noch nicht gewählt':answers[i]}`).join('\n');
}
function summaryChoices(id,values=null) {
  return [...$('#'+id).querySelectorAll('label')].filter(label=>{const input=label.querySelector('input');return input&&(values?values.includes(input.value):input.checked);}).map(label=>label.textContent.trim()).join('\n')||'Noch keine Auswahl';
}
function summaryParameters(prefix) {
  return ['w1','w2','s'].map((key,i)=>`${['w₁','w₂','s'][i]} = ${value(prefix+'-'+key).trim()||'noch nicht eingegeben'}`).join(', ');
}
function renderSummary() {
  const root=$('#summary');if(!root)return;root.replaceChildren();
  const status=[
    ['1 Vom Tier zur Entscheidung',checked['discover-fox']&&checked['discover-mc'],'Fuchs einordnen und Aussagen prüfen'],
    ['2 Grenze oder Bereich?',[1,2,3].every(i=>checked['four-mc-'+i]),'drei Fragen zu Linie und Feuerseite'],
    ['3 Ungleichung verbessern und testen',checked['five-a'],'vier Tiere richtig getrennt'],
    ['4 Von der Trennlinie zum Neuron',['six-line','six-diagram','six-input','six-parameters','six-rows'].every(id=>checked[id]),'Gerade, Ungleichung, Gewichte und vier Ausgaben']
  ];
  for(const [title,done,detail] of status){const p=document.createElement('p');p.textContent=`${title}: ${done?'bearbeitet':'offen'} - ${detail}`;root.append(p);}
  if(!REQUIRED.every(id=>checked[id]))return;
  appendSummary(root,'1.1 Fuchs einordnen','Ordne den Fuchs bei (5|3) ein.','Fuchs (5|3)','Ausgabe 0 · gefährlich.',true);
  appendSummary(root,'1.2 Aussagen prüfen','Prüfe Achsen und Hasenklasse.',summaryChoices('discover-options'),'Zahnlänge = x₁, Augengröße = x₂; Hase (2|4) ist ungefährlich.',true);
  for(let i=1;i<=3;i++)appendSummary(root,`2.${i} Grenze oder Bereich?`,$('#four-quiz-'+i+' legend').textContent,summaryChoices('four-quiz-'+i),summaryChoices('four-quiz-'+i,FOUR_QUIZ[i-1].solution),true);
  appendSummary(root,'3 Ungleichung verbessern','Verbessere die vorgegebene Ungleichung, bis U1 und U2 die Ausgabe 1 sowie G1 und G2 die Ausgabe 0 erhalten. Stelle deinen Entwurf dar und prüfe alle vier Tiere.',value('five-a'),'U1/U2 = 1, G1/G2 = 0; zum Beispiel y > 0,5x + 0,5.',true);
  appendSummary(root,'4.1 Gerade','Bestimme die Gleichung der gezeichneten Trennlinie.',value('six-line'),'y = 0,5x + 0,5.',true);
  appendSummary(root,'4.2 Neuronen-Ungleichung · Schritt 1','Beschreibe zuerst die Seite mit Ausgabe 1 als Geradenungleichung.',value('six-diagram'),'y > 0,5x + 0,5.',true);
  appendSummary(root,'4.2 Neuronen-Ungleichung · Schritt 2','Ersetze x und y durch x₁ und x₂ und forme die Bedingung zur Neuronform um.',value('six-input'),'-x₁ + 2x₂ > 1.',true);
  appendSummary(root,'4.3 Gewichte und Schwelle','Lies passende Werte für w₁, w₂ und s ab.',summaryParameters('six'),'w₁=-1, w₂=2, s=1 oder gemeinsames positives Vielfaches.',true);
  appendSummary(root,'4.4 Vier Ausgaben','Berechne die Ausgabe für U1, U2, G1 und G2.',summaryRows(SIX_ROWS,readSelects('.six-row-select')),'U1=1, U2=1, G1=0, G2=0.',true);
  const remember=document.createElement('p');remember.className='remember';remember.textContent='Eine lineare Grenze trennt die Merkmalswerte in zwei Bereiche. Die strenge Ungleichung wählt die Seite mit Ausgabe 1; Gewichte und Schwelle beschreiben dieselbe Entscheidung in Neuronform.';root.append(remember);
}

const QUIZ=[
  {solution:['A','B','C'],hint:'Lies Achsen und Legende ab; unterscheide U- und G-Punkte.'},
  {solution:['A','B'],hint:'Setze T2 ein und vergleiche streng mit 1.'},
  {solution:['A','B'],hint:'Vergleiche für U2, T2 und G1 die gewichtete Summe mit 1.'},
  {solution:['A','B'],hint:'Teste jede Kandidatin an U1, U2, G1 und G2.'},
  {solution:['A','B'],hint:'Multipliziere nur mit positiven Faktoren, wenn die Feuerseite gleich bleiben soll.'},
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
  quizPassed=true;quizChecked.fill(true);showFeedback('quiz','Korrekt. Alle fünf Fragen sind vollständig richtig beantwortet.','success');showQuizResults();save();renderSummary();
}
function renderQuizQuestions(){
  const items=[
    ['Welche Aussagen zum Tierdiagramm stimmen?','Die x-Achse zeigt die Zahnlänge.','Die y-Achse zeigt die Augengröße.','U1 und U2 haben Soll-Ausgabe 1.','G1 ist ein Punkt mit Ausgabe 1.'],
    ['Was gilt für die Grenze −3x₁ + 4x₂ = 1?','T2 (2|1,75) liegt auf ihr.','Bei T2 ist die Ausgabe wegen a=s gleich 0.','Die Gleichung umfasst alle ungefährlichen Tiere.','Auf der Grenze ist die Ausgabe immer 1.'],
    ['Was beschreibt −3x₁ + 4x₂ > 1?','Die offene Seite mit Ausgabe 1.','U2 (2|2) liegt auf dieser Seite.','T2 gehört zu dieser Seite.','G1 liegt auf dieser Seite.'],
    ['Was ist beim Verbessern einer Trennlinie erlaubt?','Eine andere Gerade als in Reiter 2 kann alle vier Tiere richtig trennen.','Die Ungleichung y > 0,5x + 0,5 trennt U1/U2 von G1/G2.','Eine Gleichung allein bestimmt die Seite mit Ausgabe 1.','Drei von vier richtigen Tierklassen genügen.'],
    ['Welche Neuronformen beschreiben y > 0,5x + 0,5?','-x₁ + 2x₂ > 1.','-2x₁ + 4x₂ > 2.','x₁ - 2x₂ > -1.','-x₁ + 2x₂ = 1.']
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
  document.querySelectorAll('.six-row-select').forEach(el=>el.addEventListener('change',()=>invalidate('six-rows')));
  for(const id of ['six-line','six-diagram','six-input','six-expert'])$('#'+id).addEventListener('input',()=>invalidate(id));
  for(const suffix of ['w1','w2','s'])$('#six-'+suffix).addEventListener('input',()=>{invalidate('six-parameters');invalidate('six-rows');});
  $('#five-a').addEventListener('input',()=>{invalidate('five-a');$('#rows-five-a').hidden=true;drawn.a='';updateFiveDrawing();save();});
  $('#check-five-a').addEventListener('click',checkFive);
  for(const [id,handler] of Object.entries({'six-line':checkSixLine,'six-diagram':checkSixDiagram,'six-input':checkSixInput,'six-parameters':checkSixParameters,'six-rows':checkSixRows,'six-expert':checkSixExpert}))$('#check-'+id).addEventListener('click',handler);
  helpDetails.forEach(el=>el.addEventListener('toggle',save));
  $('#six .six-work').addEventListener('scroll',()=>{sixScrollTop=$('#six .six-work').scrollTop;clearTimeout(scrollTimer);scrollTimer=setTimeout(save,120);},{passive:true});
  $('#reset-module').addEventListener('click',resetModule);
}
const GEOMETRY_STEPS=[
  {title:'Eigenschaften',targets:['axes','points'],text:'Die Zahnlänge wird auf der x-Achse abgetragen, die Augengröße auf der y-Achse.'},
  {title:'Hase eintragen',targets:['hare'],text:'Der Hase liegt bei (2|4).'},
  {title:'Hase einordnen',targets:['hare','line','area'],text:'Der Hase liegt oberhalb der Trenngeraden im Bereich „ungefährlich“.'},
  {title:'Fuchs eintragen',targets:['fox'],text:'Setze den Fuchs bei (5|3) ein.'},
  {title:'Fuchs einordnen',targets:['fox','line','area'],text:'Wähle seine Klasse und überprüfe.'}
];
function renderDiscovery(){
  const plot=$('#discover .geometry-plot');
  document.querySelectorAll('[data-geometry]').forEach(el=>{
    const key=el.dataset.geometry;
    const active=geometryStep>=0&&GEOMETRY_STEPS[geometryStep].targets.includes(key);
    const done=geometryStep>=0&&GEOMETRY_STEPS.slice(0,geometryStep).some(step=>step.targets.includes(key));
    el.classList.toggle('is-active',active);el.classList.toggle('is-complete',done);el.classList.toggle('is-dimmed',!active&&!done);
  });
  $('#hare-marker').toggleAttribute('hidden',geometryStep<1);
  $('#fox-task').hidden=geometryStep<3;$('#fox-class').hidden=geometryStep<4;$('#check-fox').hidden=geometryStep<4;
  const placed=geometryStep>=3&&foxX!==null&&foxY!==null;
  $('#fox-marker').toggleAttribute('hidden',!placed);
  if(placed){$('#fox-marker').setAttribute('transform',`translate(${90+foxX*85} ${390-foxY*60})`);$('#fox-label').textContent=`Fuchs (${foxX}|${foxY})`;}
  plot.classList.toggle('accepts-fox',geometryStep>=3);
  $('#fox-x').value=foxX===null?'':String(foxX);$('#fox-y').value=foxY===null?'':String(foxY);
  document.querySelectorAll('[name=fox-class]').forEach(el=>el.checked=el.value===foxClass);
  $('#geometry-step-status').textContent=geometryStep<0?'Klicke auf Weiter, um mit Schritt 1 von 5 zu beginnen.':`Schritt ${geometryStep+1}/5: ${GEOMETRY_STEPS[geometryStep].title} – ${GEOMETRY_STEPS[geometryStep].text}`;
  $('#next-geometry-step').textContent=geometryStep===4?'Schritte neu starten':'Weiter';
}
function setupDiscovery(){
  $('#next-geometry-step').addEventListener('click',()=>{geometryStep=geometryStep===4?-1:geometryStep+1;renderDiscovery();save();});
  const setFox=(x,y)=>{foxX=Number.isInteger(x)&&x>=0&&x<=7?x:null;foxY=Number.isInteger(y)&&y>=0&&y<=5?y:null;checked['discover-fox']=false;renderDiscovery();updateProgress();save();};
  $('#fox-x').addEventListener('change',()=>setFox($('#fox-x').value===''?null:Number($('#fox-x').value),foxY));
  $('#fox-y').addEventListener('change',()=>setFox(foxX,$('#fox-y').value===''?null:Number($('#fox-y').value)));
  const plot=$('#discover .geometry-plot');
  plot.addEventListener('click',event=>{if(geometryStep<3)return;const point=new DOMPoint(event.clientX,event.clientY).matrixTransform(plot.getScreenCTM().inverse());setFox(Math.round((point.x-90)/85),Math.round((390-point.y)/60));});
  document.querySelectorAll('[name=fox-class]').forEach(el=>el.addEventListener('change',()=>{foxClass=el.value;checked['discover-fox']=false;updateProgress();save();}));
  $('#check-fox').addEventListener('click',()=>{
    const point=foxX===5&&foxY===3,klass=foxClass==='danger';
    if(point&&klass){showFeedback('fox','Korrekt. Der Fuchs liegt bei (5|3) im gefährlichen Bereich; die Ausgabe ist 0.','success');mark('discover-fox',true);}
    else showFeedback('fox',point?'Teilweise korrekt. Prüfe die Klasse des Fuchses.':klass?'Teilweise korrekt. Trage den Fuchs bei (5|3) ein.':'Noch nicht korrekt. Trage zuerst den Fuchs bei (5|3) ein.','partial');
  });
  $('#discover-options').addEventListener('change',()=>invalidate('discover-mc'));
  $('#check-discover').addEventListener('click',()=>{const chosen=[...$('#discover-options').querySelectorAll('input:checked')].map(el=>el.value);if(sameSet(chosen,['x1','x2','safe'])){showFeedback('discover','Korrekt. Merkmalswerte werden zu Koordinaten; der Hase liegt bei (2|4) auf der ungefährlichen Seite der Trenngeraden.','success');mark('discover-mc',true);}else showFeedback('discover',chosen.some(v=>['x1','x2','safe'].includes(v))?'Teilweise korrekt. Prüfe Achsen und Hasenklasse.':'Noch nicht korrekt. Lies Achsen und beschriftete Bereiche ab.',chosen.some(v=>['x1','x2','safe'].includes(v))?'partial':'error');});
}
function start() {
  for(const suffix of ['51','51-summary'])document.querySelector('#solution-code-form-'+suffix).addEventListener('submit',event=>unlockSolution(event,'M5NP-DQX6','solution-download-link-'+suffix,'solution-code-message-'+suffix));
  buildTables();
  setupQuiz();
  fields=[...document.querySelectorAll('input,select,textarea')].filter(el=>!el.closest('.solution-code-form'));
  setupTabs();setupStaticPlots();setupFourQuiz();attachEvents();setupDiscovery();
  load();
  renderFourMode();renderDiscovery();
  renderFourRemember();
  if(quizPassed){showQuizResults();showFeedback('quiz','Korrekt. Alle fünf Fragen sind vollständig richtig beantwortet.','success');}
  showStep(active);
}
start();
