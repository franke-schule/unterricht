import { evaluateCodeAnswer, renderCompactEvaluation } from './semantic-answer.mjs?v=20261026-v1';
import { unlockSolution } from '../../../../klasse-10/1-Datenbanken/tab-navigation.mjs';

const STORAGE_KEY = 'informatik11-ki-aufgabe6-1-v2';
const OLD_STORAGE_KEY = 'informatik11-ki-aufgabe6-1-v1';
const SERVER_URL = 'https://unterrichtkiichezbn4-ki-auswertung.functions.fnc.fr-par.scw.cloud/';
const STEPS = ['if','ifelse','elseif','for','quiz'];
const PROJECTS = {
  '1B': { key:'if', ide:'Java11Aufgabe6_1IfV1', task:'11-6-1-if-code', files:['Hauptprogramm.java'] },
  '2B': { key:'ifelse', ide:'Java11Aufgabe6_1IfElseV1', task:'11-6-1-ifelse-code', files:['Hauptprogramm.java'] },
  '3B': { key:'elseif', ide:'Java11Aufgabe6_1ElseIfV1', task:'11-6-1-elseif-code', files:['Hauptprogramm.java'] },
  '4B': { key:'for', ide:'Java11Aufgabe6_1ForV2', task:'11-6-1-for-code', files:['Hauptprogramm.java'] },
};
const LOCAL = {
 '1A': { values:['0','0','1'], success:'Korrekt. Die Ausgaben sind 0, 0 und 1.', partial:'Teilweise korrekt. Prüfe die Ausgabe bei Summe 5: Gleichheit genügt nicht für die 1.', wrong:'Noch nicht korrekt. Vergleiche 4, 5 und 6 einzeln mit `theta = 5`.' },
 '2A': { values:['0','0','1'], success:'Korrekt. Die Ausgaben sind 0, 0 und 1.', partial:'Teilweise korrekt. Bei Gleichheit wird 0 ausgegeben.', wrong:'Noch nicht korrekt. Nur eine Summe größer als 5 ergibt die Ausgabe 1.' },
 '3A': { values:['Ausgabe zu klein','Ausgabe zu groß','Ausgabe passt'], success:'Korrekt. Die drei Texte erscheinen in der erwarteten Reihenfolge.', partial:'Teilweise korrekt. Prüfe besonders den Text bei `delta = 0`.', wrong:'Noch nicht korrekt. Ordne jedem der drei Werte genau einen ausgegebenen Text zu.' },
 '4A': { values:['Datenpunkt 0 / Datenpunkt 1 / Datenpunkt 2'], success:'Korrekt. Die drei Zeilen stehen in der richtigen Reihenfolge.', partial:'Teilweise korrekt. Prüfe den Startwert oder die letzte Ausgabe.', wrong:'Noch nicht korrekt. Beginne bei `i = 0` und lies die ausgegebenen Zeilen.' },
};
const TASK_IDS = ['1A','1B','2A','2B','3A','3B','4A','4B'];
const QUIZ = [
 {q:'Welche Ausgaben liefert das einfache `if` bei `theta = 5` und Anfangswert `berechnete_ausgabe = 0`?',a:['Bei Summe 4 erscheint `0`.','Bei Summe 5 erscheint `0`.','Bei Summe 6 erscheint `1`.','Bei Summe 5 erscheint `1`.'],s:['A','B','C'],h:'Bei Gleichheit mit 5 bleibt die Ausgabe 0.',e:'Nur die Summe 6 ist größer als 5 und ergibt 1.'},
 {q:'Welche Ausgaben liefert `if`/`else` bei `theta = 5`?',a:['Bei Summe 4 erscheint `1`.','Bei Summe 4 erscheint `0`.','Bei Summe 5 erscheint `0`.','Bei Summe 6 erscheint `1`.'],s:['B','C','D'],h:'Vergleiche 4, 5 und 6 jeweils mit 5.',e:'Die Ausgaben für 4, 5 und 6 lauten 0, 0, 1.'},
 {q:'Welche Texte erscheinen bei der gezeigten `else if`-Kette?',a:['Bei `delta = 1`: `Ausgabe zu klein`.','Bei `delta = -1`: `Ausgabe zu groß`.','Bei `delta = 0`: `Ausgabe passt`.','Bei `delta = 1`: `Ausgabe passt`.'],s:['A','B','C'],h:'Lies für jeden `delta`-Wert genau den ausgegebenen Text.',e:'Die Texte für 1, −1 und 0 sind „Ausgabe zu klein“, „Ausgabe zu groß“ und „Ausgabe passt“.'},
 {q:'Bei delta = 0: Was gibt der Ausschnitt if (delta == 1) { println("plus"); } else if (delta == -1) { println("minus"); } println("fertig"); aus?',a:['`fertig`','`plus`','`minus`','`Ausgabe passt`'],s:['A'],h:'Beachte die Ausgabeanweisung hinter der Fallunterscheidung.',e:'Bei 0 erscheint nur `fertig`.'},
 {q:'Welche Zeilen gibt `for (int i = 0; i < 3; i++) { println("Datenpunkt " + i); }` aus?',a:['`Datenpunkt 0`','`Datenpunkt 1`','`Datenpunkt 2`','`Datenpunkt 3`'],s:['A','B','C'],h:'Die letzte Ausgabe gehört zum Wert 2.',e:'Die Zeilen lauten der Reihe nach `Datenpunkt 0`, `Datenpunkt 1`, `Datenpunkt 2`.'},
 {q:'Welche Zeilen gibt `for (int i = 0; i < 4; i++) { println("Datenpunkt " + i); }` aus?',a:['`Datenpunkt 0`','`Datenpunkt 2`','`Datenpunkt 3`','`Datenpunkt 4`'],s:['A','B','C'],h:'Bei `i = 4` ist die Bedingung nicht mehr erfüllt.',e:'Die Schleife gibt `Datenpunkt 0`, `Datenpunkt 1`, `Datenpunkt 2` und `Datenpunkt 3` aus.'},
];
const ANSWERS = [
 ['1A','4 → 0; 5 → 0; 6 → 1.'],['1B','Im zweiten Fall setzt ein `if (gewichtete_Summe > theta)` bei Summe 6 `berechnete_ausgabe` auf 1.'],['2A','4 → 0; 5 → 0; 6 → 1.'],['2B','`if (> theta)` setzt 1, `else` setzt 0; 5 → 0 und 6 → 1.'],['3A','1 → Ausgabe zu klein; −1 → Ausgabe zu groß; 0 → Ausgabe passt.'],['3B','Die Kette liefert für 1, −1 und 0 dieselben drei Texte wie 3A und führt höchstens einen Zweig aus.'],['3C Merksatz','In Aufgabe 6.2 bleiben bei `delta = 0` die Parameter unverändert: Keine der beiden Bedingungen `delta == 1` und `delta == -1` ist erfüllt. Ein abschließendes `else` ist dafür nicht nötig.'],['4A','Datenpunkt 0 / Datenpunkt 1 / Datenpunkt 2.'],['4B','Datenpunkt 0 / Datenpunkt 1 / Datenpunkt 2 / Datenpunkt 3.']
];
let storageApi;
const flags = new Set();
function setFeedback(id, text, kind='') { const p=document.querySelector(`[data-feedback="${id}"]`); p.hidden=false; p.className='feedback'+(kind?' '+kind:''); p.textContent=text; }
const REVEALS = {'1A':['explain-if','remember-if'],'2A':['explain-ifelse','remember-ifelse'],'3A':['explain-elseif'],'3B':['remember-elseif'],'4A':['explain-for','remember-for']};
function markDone(id) { flags.add(id); storageApi?.setFlag('done-'+id); for(const reveal of (REVEALS[id]||[])){const element=document.getElementById(reveal);if(element)element.hidden=false;storageApi?.setFlag(reveal);} maybeRevealSummary(); }
function completedQuiz() { return flags.has('quiz'); }
function maybeRevealSummary() { const done=TASK_IDS.every(id=>flags.has(id)); if(done&&completedQuiz()) { document.querySelector('#quiz-summary').hidden=false; storageApi?.setFlag('summary'); } }
function setStep(id, focus=false) { if(!STEPS.includes(id))id='if'; document.querySelectorAll('[data-panel]').forEach(x=>x.hidden=x.dataset.panel!==id); document.querySelectorAll('[data-tab]').forEach(x=>{const yes=x.dataset.tab===id;x.setAttribute('aria-selected',String(yes));x.tabIndex=yes?0:-1;}); document.querySelectorAll('[data-ide]').forEach(x=>x.hidden=x.dataset.ide!==id); const a=document.querySelector('#active-tab'); a.value=id; a.dispatchEvent(new Event('input',{bubbles:true})); if(focus){const h=document.querySelector(`#step-${id} h2`);h.tabIndex=-1;h.focus({preventScroll:true});h.scrollIntoView({behavior:'smooth',block:'start'});} }
function setupTabs() { const active=document.createElement('input'); active.type='hidden'; active.id='active-tab'; active.value='if'; document.querySelector('main').append(active); document.querySelectorAll('[data-tab]').forEach(tab=>{tab.addEventListener('click',()=>setStep(tab.dataset.tab,true));tab.addEventListener('keydown',e=>{const i=STEPS.indexOf(tab.dataset.tab),m={ArrowLeft:-1,ArrowRight:1,ArrowUp:-1,ArrowDown:1};let n=i;if(e.key==='Home')n=0;else if(e.key==='End')n=STEPS.length-1;else if(m[e.key])n=(i+m[e.key]+STEPS.length)%STEPS.length;else return;e.preventDefault();setStep(STEPS[n]);document.querySelector(`[data-tab="${STEPS[n]}"]`).focus();});});document.querySelectorAll('[data-next]').forEach(b=>b.addEventListener('click',()=>setStep(b.dataset.next,true))); }
function localCheck(id) { const cfg=LOCAL[id], inputs=[...document.querySelectorAll(`[data-task="${id}"] select, [data-task="${id}"] input`)]; if(inputs.some(x=>!x.value)){setFeedback(id,inputs.length===1?'Wähle zuerst die erwartete Ausgabe aus.':'Fülle zuerst alle Antwortfelder aus.');return;} const hits=inputs.filter((x,i)=>x.value===cfg.values[i]).length; if(hits===inputs.length){setFeedback(id,cfg.success,'success');markDone(id);}else if(hits){setFeedback(id,cfg.partial,'partial');}else setFeedback(id,cfg.wrong,'error'); }
function currentCode(id) { const p=PROJECTS[id], frame=document.querySelector(`#frame-${p.key}`), access=frame?.contentWindow?.online_ide_access, ide=access?.getIDE?.(p.ide); if(!ide||typeof ide.getFiles!=='function')throw Error('Die Online-IDE lädt noch. Bitte warte kurz und versuche es erneut.'); const files=ide.getFiles(); if(!Array.isArray(files))throw Error('Die Online-IDE lädt noch. Bitte warte kurz und versuche es erneut.'); let out=''; for(const name of p.files){const f=files.find(x=>x.getName?.()===name);if(!f||typeof f.getText!=='function')throw Error(`\`${name}\` wurde in der Online-IDE nicht gefunden.`);out+=`// ===== Datei: ${name} =====\n${f.getText()}\n`;}return out; }
function technicalError(e){const m=String(e?.message||'');if(/unbekannt|nicht gefunden|task.?id|Aufgabe.*nicht/i.test(m))return 'Die Codeprüfung für Aufgabe 6.1 ist auf dem Server noch nicht bereitgestellt. Bitte informiere deine Lehrkraft.';return 'Die Auswertung konnte nicht abgeschlossen werden. Bitte versuche es erneut.';}
async function checkCode(id) { const button=document.querySelector(`[data-code-check="${id}"]`); const feedback=document.querySelector(`[data-feedback="${id}"]`); let code; try{code=currentCode(id);}catch(e){setFeedback(id,e.message,'error');return;}if(code.trim().length<20){setFeedback(id,'Der aktuelle Programmcode ist noch zu kurz für eine Auswertung.','error');return;}if(code.length>12000){setFeedback(id,'Dein Programmcode ist zu lang für die automatische Auswertung.','error');return;}button.disabled=true;feedback.hidden=false;feedback.textContent='Der aktuelle Programmcode wird für diesen Aufgabenteil ausgewertet.';try{const p=PROJECTS[id];const result=await evaluateCodeAnswer({serverUrl:SERVER_URL,taskId:p.task,code,expectedMaxPoints:3});feedback.className='feedback '+(result.points===result.maxPoints?'success':result.points>0?'partial':'error');renderCompactEvaluation(feedback,result);if(result.points===result.maxPoints){markDone(id);maybeRevealSummary();}}catch(e){setFeedback(id,technicalError(e),'error');}finally{button.disabled=false;} }
function setupBlocks(){document.querySelectorAll('[data-check]').forEach(b=>b.addEventListener('click',()=>localCheck(b.dataset.check)));document.querySelectorAll('[data-code-check]').forEach(b=>b.addEventListener('click',()=>checkCode(b.dataset.codeCheck)));}
function same(a,b){return a.length===b.length&&b.every(x=>a.includes(x));}
function setupQuiz(){const root=document.querySelector('#quiz-questions');QUIZ.forEach((q,i)=>{const fs=document.createElement('fieldset');fs.className='quiz-question';const legend=document.createElement('legend');legend.textContent=`${i+1}. ${q.q}`;fs.append(legend);q.a.forEach((v,j)=>{const label=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.name=`quiz-${i+1}`;input.value='ABCD'[j];label.append(input,document.createTextNode(' '+v));fs.append(label);});const feedback=document.createElement('p');feedback.className='feedback';feedback.setAttribute('role','status');feedback.setAttribute('aria-live','polite');feedback.hidden=true;fs.append(feedback);root.append(fs);});const form=document.querySelector('#quiz-form');form.addEventListener('submit',e=>{e.preventDefault();const n=checker.checkAll();document.querySelector('#quiz-progress').textContent=`${n} von 6 Fragen vollständig richtig`;setFeedback('quiz',n===6?'Alle sechs Fragen sind vollständig richtig beantwortet.':`${n} von 6 Fragen sind vollständig richtig. Verbessere die markierten Fragen und prüfe erneut.`,n===6?'success':'partial');if(n===6){flags.add('quiz');storageApi?.setFlag('done-quiz');buildSummary();maybeRevealSummary();}});const checker=window.addQuizQuestionChecks({questions:[...root.children].map((fieldset,i)=>({fieldset,feedback:fieldset.querySelector('.feedback'),solution:QUIZ[i].s,check:()=>{const chosen=[...fieldset.querySelectorAll('input:checked')].map(x=>x.value);if(!chosen.length)return{result:'empty',text:'Kreuze mindestens eine Antwort an.'};if(same(chosen,QUIZ[i].s))return{result:'correct',text:`Korrekt. Frage ${i+1} ist vollständig richtig beantwortet.`};const n=chosen.filter(x=>QUIZ[i].s.includes(x)).length;return n?{result:'mixed',text:`Teilweise korrekt. Prüfe die Aussagen noch einmal. ${QUIZ[i].h}`}:{result:'wrong',text:`Noch nicht korrekt. ${QUIZ[i].h}`};}})),buttonClass:'primary-button',levels:{high:'success',medium:'partial',low:'error'},onAllCorrect:()=>form.requestSubmit(),onCheck:()=>{const n=QUIZ.filter((q,i)=>same([...root.children[i].querySelectorAll('input:checked')].map(x=>x.value),q.s)).length;document.querySelector('#quiz-progress').textContent=`${n} von 6 Fragen vollständig richtig`;}});}
function buildSummary(){const root=document.querySelector('#summary-content');root.replaceChildren();const ol=document.createElement('ol');ANSWERS.forEach(([id,answer])=>{const li=document.createElement('li');li.innerHTML=id.endsWith(' Merksatz')?`<strong>${id}</strong><p>${answer}</p>`:`<strong>${id}</strong><p>${TASK_TEXT[id]}</p><p>Richtig: ${answer}</p>`;ol.append(li);});QUIZ.forEach((q,i)=>{const li=document.createElement('li');const heading=document.createElement('strong');heading.textContent=`Quiz ${i+1}: ${q.q}`;const label=document.createElement('p');label.textContent='Richtig:';const answers=document.createElement('ul');for(const letter of q.s){const item=document.createElement('li');item.textContent=`${letter}: ${q.a['ABCD'.indexOf(letter)]}`;answers.append(item);}const reason=document.createElement('p');reason.textContent=q.e;li.append(heading,label,answers,reason);ol.append(li);});root.append(ol);}
const TASK_TEXT={'1A':'Sage voraus, was das Programm bei theta = 5 für gewichtete_Summe = 4, 5 und 6 jeweils ausgibt. Starte es mit allen drei Werten und vergleiche.','1B':'Ergänze im markierten zweiten Fall einen if-Block: Bei gewichtete_Summe > theta soll berechnete_ausgabe zu 1 werden. Starte danach das Programm.','2A':'Bestimme, was das Programm bei theta = 5 für gewichtete_Summe = 4, 5 und 6 jeweils ausgibt. Überprüfe deine Vorhersage in der IDE.','2B':'Ergänze im markierten zweiten Fall die beiden Zweige so, dass die Ausgabe bei größerer Summe 1 und sonst 0 ist. Teste die Summen 5 und 6.','3A':'Sage voraus, was das Programm bei delta = 1, -1 und 0 jeweils ausgibt. Starte es mit allen drei Werten.','3B':'Ergänze im markierten Übungsabschnitt die Bedingungen für delta = 1 und delta = -1 sowie den sonstigen Textfall. Teste alle drei Werte.','4A':'Sage voraus, welche Zeilen die vorgegebene for-Schleife ausgibt. Starte das Programm und vergleiche die Ausgabe.','4B':'Ändere die Bedingung der vorgegebenen for-Schleife so, dass auch Datenpunkt 3 ausgegeben wird. Starte das Programm und prüfe die vier Zeilen.'};
function migrateV1(){
 try {
  if(localStorage.getItem(STORAGE_KEY)!==null)return;
  const old=JSON.parse(localStorage.getItem(OLD_STORAGE_KEY));
  if(!old||typeof old!=='object'||!old.fields||typeof old.fields!=='object')return;
  const source=old.fields,oldFlags=old.flags&&typeof old.flags==='object'?old.flags:{},fields={},savedFlags={};
  const put=(target,value,allowed)=>{if(allowed.includes(value))fields[target]=value;};
  for(const [target,origin] of [['output-1a-4','a-1a-2'],['output-1a-5','a-1a-4'],['output-1a-6','a-1a-6']])put(target,source[origin],['0','1']);
  const oldBinary={'else, 0':'0','if, 1':'1'};
  for(const [target,origin] of [['output-2a-4','a-2a-1'],['output-2a-5','a-2a-2'],['output-2a-6','a-2a-3']])put(target,oldBinary[source[origin]],['0','1']);
  const oldTexts={'if: Ausgabe zu klein':'Ausgabe zu klein','else if: Ausgabe zu groß':'Ausgabe zu groß','else: Ausgabe passt':'Ausgabe passt'};
  for(const [target,origin] of [['output-3a-1','a-3a-1'],['output-3a-minus1','a-3a-2'],['output-3a-0','a-3a-3']])put(target,oldTexts[source[origin]],['Ausgabe zu klein','Ausgabe zu groß','Ausgabe passt']);
  if(source['a-4a-1']==='0, 1, 2'&&source['a-4a-2']==='3')fields['output-4a']=LOCAL['4A'].values[0];
  if(STEPS.includes(source['active-tab']))fields['active-tab']=source['active-tab'];
  for(const id of ['1B','2B','3B'])if(oldFlags['done-'+id]===true)savedFlags['done-'+id]=true;
  for(const [id,keys] of [['1A',['output-1a-4','output-1a-5','output-1a-6']],['2A',['output-2a-4','output-2a-5','output-2a-6']],['3A',['output-3a-1','output-3a-minus1','output-3a-0']],['4A',['output-4a']]])if(oldFlags['done-'+id]===true&&keys.every((key,i)=>fields[key]===LOCAL[id].values[i]))savedFlags['done-'+id]=true;
  savedFlags.forRevision9=true;
  localStorage.setItem(STORAGE_KEY,JSON.stringify({fields,flags:savedFlags}));
 }catch{}
}
function migrateCurrentForRevision(){
 try {
  const raw=localStorage.getItem(STORAGE_KEY);if(raw===null)return;
  const saved=JSON.parse(raw);if(!saved||typeof saved!=='object')return;
  const fields=saved.fields&&typeof saved.fields==='object'?saved.fields:{};
  const savedFlags=saved.flags&&typeof saved.flags==='object'?saved.flags:{};
  if(savedFlags.forRevision9===true)return;
  for(const key of Object.keys(fields))if(/^a-4[cd]-|^output-4c$|^quiz-6=/.test(key))delete fields[key];
  for(const id of ['4B','4C','4D','4E','quiz'])delete savedFlags['done-'+id];
  delete savedFlags.summary;delete savedFlags['explain-foreach'];
  if(fields['output-4a']!==LOCAL['4A'].values[0])delete savedFlags['done-4A'];
  savedFlags.forRevision9=true;
  localStorage.setItem(STORAGE_KEY,JSON.stringify({fields,flags:savedFlags}));
 }catch{}
}
function restoreFlags(){for(const id of TASK_IDS)if(storageApi?.hasFlag('done-'+id)){flags.add(id);for(const reveal of (REVEALS[id]||[])){const element=document.getElementById(reveal);if(element)element.hidden=false;}}if(storageApi?.hasFlag('done-quiz'))flags.add('quiz');if(storageApi?.hasFlag('summary'))document.querySelector('#quiz-summary').hidden=false;}
setupTabs();setupBlocks();setupQuiz();buildSummary();
migrateV1();migrateCurrentForRevision();
const active=document.querySelector('#active-tab');storageApi=window.persistTaskInputs(STORAGE_KEY,'input, select');restoreFlags();
let activeId='if';try{const val=JSON.parse(localStorage.getItem(STORAGE_KEY));const a=val?.fields?.['active-tab'];if(STEPS.includes(a))activeId=a;}catch{}setStep(activeId);
TASK_IDS.forEach(id=>{const selectors=document.querySelectorAll(`[data-feedback="${id}"]`);if(storageApi?.hasFlag('done-'+id)){} });
const quizCount=QUIZ.filter((q,i)=>same([...document.querySelectorAll(`#quiz-questions fieldset`)[i].querySelectorAll('input:checked')].map(x=>x.value),q.s)).length;document.querySelector('#quiz-progress').textContent=`${quizCount} von 6 Fragen vollständig richtig`;
maybeRevealSummary();
document.querySelector('#reset-progress').addEventListener('click',()=>{try{localStorage.setItem(STORAGE_KEY,'{}');}catch{}location.reload();});
