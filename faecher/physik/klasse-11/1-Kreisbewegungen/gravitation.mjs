import { setupPhysicsStepTabs } from './components/physics-step-tabs.mjs';
import { createPhysicsTaskProgress } from './components/physics-task-progress.mjs';
import { appendPhysicsText } from './components/physics-notation.mjs';
import { G, INITIAL, MIN_DISTANCE, MAX_DISTANCE, distance, force, validState, setDistance, moveBody, checkQuantity, parseQuantity } from './gravitation-model.mjs';

const $ = id => document.getElementById(id);
const unitFraction = '<span class="physics-fraction"><span class="physics-fraction__numerator">N·m²</span><span class="physics-fraction__denominator">kg²</span></span>';
const feedbackWords = {
  precision: 'Dein Rechenwert ist grundsätzlich passend. Runde das Endergebnis noch auf die geforderte Anzahl gültiger Ziffern.',
  wrong: 'Prüfe deinen Zahlenwert, die Einheit und die Anzahl der gültigen Ziffern.'
};
const completed = new Set();
const numericCards = new Map();
const separateChoiceFeedback = {
  M3:{success:'Richtig. Die Simulation verwendet G bereits; sie bestimmt die Naturkonstante nicht unabhängig.',error:'Noch nicht korrekt. Der Kraftwert wird mit einem hinterlegten G berechnet.'},
  M4:{success:'Richtig. Der gewählte Ansatz löst das Gravitationsgesetz nach G auf.',error:'Noch nicht korrekt. Stelle das Gravitationsgesetz nach G um.'},
  A1:{success:'Richtig. Gleiche Kräfte führen bei sehr unterschiedlichen Massen zu unterschiedlichen Beschleunigungen.',error:'Noch nicht korrekt. Vergleiche Kraftbetrag und Beschleunigung getrennt.'},
  A2:{success:'Richtig. Astronautin und Raumstation fallen gemeinsam um die Erde.',error:'Noch nicht korrekt. Die berechnete Gravitationskraft ist im Orbit weiterhin groß.'},
  A3:{success:'Richtig. Die Oberflächenfallbeschleunigung ist auf dem Mond ungefähr ein Sechstel so groß wie auf der Erde.',error:'Noch nicht korrekt. Vergleiche deinen berechneten Mondwert mit dem Erdwert.'}
};
const numericFeedback = {
  M3:{success:'Richtig. Wert und Einheit passen.',partial:'Teilweise korrekt. Prüfe Umrechnung, Einheit oder drei gültige Ziffern.'},
  A1:{success:'Richtig. Die Kraft und beide Beschleunigungen passen.',partial:'Teilweise korrekt. Prüfe die zweite Beschleunigung.'},
  A2:{success:'Richtig. Die beiden Kraftwerte passen.',partial:'Teilweise korrekt. Prüfe den Mittelpunktabstand.'},
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
function setupStructured({host,id,title,prompt,fields,answers,helps,messages,after}) {
  const area = card(host,id,title,prompt,helps);
  fields.forEach(([suffix,label,choices]) => addSelect(area,`${id.toLowerCase()}-${suffix}`,label,choices));
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
const yesNo = (correct, wrong) => [['yes',correct],['no',wrong]];
const greater = [['up','größer'],['down','kleiner']];

function buildSources() {
  setupStructured({host:'tasks-newton',id:'N1',title:'N1 · Newtons Verbindung',prompt:'<strong>Wähle</strong> die Aussage, die Newtons Verbindung zur bekannten Kreisbewegung trifft.',fields:[['choice','Aussage',[['a','Für den Mond gelten völlig andere Bewegungsgesetze als für Körper auf der Erde.'],['b','Die Anziehung durch die Erde kann für den Mond die benötigte Zentripetalkraft sein.'],['c','Zentripetalkraft und Erdanziehung sind immer zwei zusätzlich zu addierende Kräfte.']]]],answers:['b'],helps:['Denke an die Richtung der Kraft, die eine Kreisbahn ermöglicht.','Für eine Kreisbahn braucht der Mond eine Kraft zur Erde hin.','Die Erdanziehung zeigt zum Erdmittelpunkt und kann beim Mond die Rolle der Zentripetalkraft übernehmen.'],messages:{success:'Richtig. Die gravitative Anziehung kann den Mond zur Erde hin umlenken.',partial:'Teilweise korrekt. Du hast die Richtung erkannt; prüfe noch, ob dafür zwei Kräfte addiert werden.',error:'Noch nicht korrekt. Die Zentripetalkraft ist eine Rolle einer wirkenden Kraft; die Erdanziehung kann diese Rolle übernehmen.'}});
  setupStructured({host:'tasks-principia',id:'P1',title:'P1 · § 7',prompt:'<strong>Ergänze</strong> zu § 7: Bei der Mondbahn ist die ______ die Kraft, die als ______ wirkt.',fields:[['first','Erste Lücke',[['gravity','gravitative Anziehung'],['inertia','Trägheit'],['extra','zweite Zusatzkraft']]],['second','Zweite Lücke',[['center','Zentripetalkraft'],['friction','Reibung'],['flight','Fliehkraft']]]],answers:['gravity','center'],helps:['Was hält nach Newton die Himmelskörper in ihren Bahnen?','Die Anziehung lenkt den Mond zur Erde hin.','Die gravitative Anziehung ist hier bereits die Zentripetalkraft; es wird keine zweite Kraft addiert.'],messages:{success:'Richtig. Die Gravitation übernimmt bei der Mondbahn die Rolle der Zentripetalkraft.',partial:'Teilweise korrekt. Eine der beiden Rollen stimmt; prüfe die andere am Wortlaut von § 7.',error:'Noch nicht korrekt. Newton benennt dieselbe zur Bahnmitte wirkende Kraft zunächst anders.'},after:()=>{$('modern-note').hidden=false;}});
  const note=document.createElement('p');note.id='modern-note';note.hidden=true;note.textContent='Mit ‚Schwere‘ meint Newton hier die allgemeine gravitative Anziehung von Körpern mit Masse.';$('card-p1').after(note);
  setupStructured({host:'tasks-principia',id:'P2',title:'P2 · § 9',prompt:'<strong>Ordne zu</strong>, worauf sich Newtons ‚Schwere‘ bezieht: allgemeine Kraft, beteiligte Massen und Richtung.',fields:[['schwere','Schwere',[['gravity','gravitative Anziehung'],['fall','nur Fallbewegung auf der Erde']]],['materie','Menge der Materie',[['mass','Masse'],['speed','Bahngeschwindigkeit']]],['richtung','zum anderen Körper',[['line','entlang der Verbindung der Schwerpunkte'],['perp','senkrecht zur Verbindung']]]],answers:['gravity','mass','line'],helps:['Lies § 9 und denke an zwei Körper.','‚Menge der Materie‘ ist die historische Umschreibung einer Körpergröße.','Gemeint sind Gravitation, Masse und die Verbindung der Schwerpunkte.'],messages:{success:'Richtig. ‚Schwere‘ bezeichnet hier die Anziehung, deren Stärke von Masse abhängt.',partial:'Teilweise korrekt. Einige Zuordnungen passen; überprüfe Masse und Kraftrichtung getrennt.',error:'Noch nicht korrekt. Newton beschreibt nicht nur das Fallen auf der Erde.'}});
  setupStructured({host:'tasks-principia',id:'P3',title:'P3 · Alle Körper',prompt:'<strong>Ergänze</strong> die Aussage zu § 9: Gravitation wirkt zwischen ______ Körpern mit ______.',fields:[['scope','Erste Lücke',[['all','allen'],['sky','nur himmlischen']]],['property','Zweite Lücke',[['mass','Masse'],['charge','Ladung']]]],answers:['all','mass'],helps:['Achte auf das Wort ‚allen‘ im ersten Satz von § 9.','Planeten sind nur Beispiele; auch Alltagsgegenstände haben die entsprechende Eigenschaft.','Alle Körper mit Masse ziehen einander gravitativ an.'],messages:{success:'Richtig. Die Aussage gilt grundsätzlich für alle Körper mit Masse.',partial:'Teilweise korrekt. Prüfe noch, ob Newton die Wirkung auf Himmelskörper beschränkt.',error:'Noch nicht korrekt. Lies den ersten Satz von § 9 erneut.'}});
  setupStructured({host:'tasks-principia',id:'P4',title:'P4 · Mittelpunktabstand',prompt:'<strong>Ordne zu</strong>, wie sich die Kraft bei doppeltem und dreifachem Mittelpunktabstand ändert, wenn die Massen gleich bleiben.',fields:[['double','2r',[['quarter','ein Viertel der Kraft'],['twice','2F'],['half','die Hälfte der Kraft']]],['triple','3r',[['ninth','ein Neuntel der Kraft'],['three','3F'],['third','ein Drittel der Kraft']]]],answers:['quarter','ninth'],helps:['Im Text steht ‚umgekehrt wie das Quadrat‘.','Beim doppelten Abstand steht im Nenner 2².','Für 2r folgt ein Viertel, für 3r ein Neuntel der Kraft.'],messages:{success:'Richtig. Der Abstand geht quadratisch in den Nenner ein.',partial:'Teilweise korrekt. Eine Zuordnung stimmt; quadriere auch den anderen Abstandsfaktor.',error:'Noch nicht korrekt. Verdopple oder verdreifache zuerst r und quadriere dann diesen Faktor.'}});
}

function buildSimulationTasks(){
  setupStructured({host:'tasks-simulation',id:'S1',title:'S1 · Kräftebild',prompt:'<strong>Ordne</strong> jedem Körper den auf ihn wirkenden Kraftpfeil zu und <strong>vergleiche</strong> beide Kraftbeträge.',fields:[['one','Pfeil auf m₁',[['to2','zeigt zu m₂'],['right','beide nach rechts'],['between','beginnt zwischen den Körpern']]],['two','Pfeil auf m₂',[['to1','zeigt zu m₁'],['right','beide nach rechts'],['between','beginnt zwischen den Körpern']]],['amount','Beträge',[['same','gleich groß'],['large','größere Masse erhält größere Kraft']]]],answers:['to2','to1','same'],helps:['Lies die Beschriftung ‚Kraft auf …‘.','Jede Masse zieht die andere entlang der Verbindungslinie an.','Die Pfeile greifen an verschiedenen Körpern an, zeigen aufeinander zu und haben denselben Betrag.'],messages:{success:'Richtig. Die Kräfte sind gleich groß, entgegengesetzt gerichtet und wirken auf verschiedene Körper.',partial:'Teilweise korrekt. Prüfe noch Angriffspunkt, Richtung oder Betragsvergleich.',error:'Noch nicht korrekt. Beobachte die Pfeile bei deutlich unterschiedlichen Massen.'}});
  setupStructured({host:'tasks-simulation',id:'S2',title:'S2 · Newtons Axiome',prompt:'<strong>Ordne</strong> Trägheitssatz, Aktionsprinzip und Wechselwirkungsprinzip den drei Aussagen zu. <strong>Wähle</strong> anschließend, warum verschieden schwere Körper bei gleichem Kraftbetrag verschieden stark beschleunigen.',fields:[['inertia','Ohne resultierende Kraft bleibt die geradlinig gleichförmige Bewegung erhalten',[['inertia','Trägheitssatz'],['action','Aktionsprinzip'],['interaction','Wechselwirkungsprinzip']]],['action','Bei gleicher Kraft ist die Beschleunigung eines größeren Körpers kleiner',[['inertia','Trägheitssatz'],['action','Aktionsprinzip'],['interaction','Wechselwirkungsprinzip']]],['interaction','Beide Körper üben gleich große, entgegengesetzte Kräfte aufeinander aus',[['inertia','Trägheitssatz'],['action','Aktionsprinzip'],['interaction','Wechselwirkungsprinzip']]],['acceleration','Folgerung',[['ratio','Beschleunigung ist Kraft geteilt durch Masse; bei größerer Masse ist a kleiner'],['force','größerer Körper erfährt größere Kraft'],['equal','beide Beschleunigungen sind gleich']]]],answers:['inertia','action','interaction','ratio'],helps:['Vergleiche Kraftbetrag und Bewegung getrennt.','Das dritte Axiom betrifft zwei Kräfte auf zwei verschiedenen Körpern; das zweite verknüpft Kraft und Beschleunigung eines Körpers.','Gleiche Gegenkräfte bedeuten wegen a={{F|m}} bei ungleichen Massen nicht gleiche Beschleunigungen.'],messages:{success:'Richtig. Gleiche Gegenkräfte können unterschiedliche Beschleunigungen verursachen.',partial:'Teilweise korrekt. Die Axiome oder die Folgerung aus a=F/m sind noch nicht vollständig zugeordnet.',error:'Noch nicht korrekt. Verwechsle Kraft auf einen Körper nicht mit dessen Beschleunigung.'}});
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
  if(measured){$('m2-observations').before($('simulation-view-4'));$('simulation-view-4').before($('m2-observation-instruction'));}
  else $('card-m1a').before($('simulation-view-4'));
  requestAnimationFrame(updateSimulation);
  $('law-formula').hidden=!completed.has('M2');
  $('law-after-formula').hidden=!completed.has('M2');
}
const updateLawUnlock=lawStepUnlock;
function buildLaw(){
  setupStructured({host:'tasks-law-start',id:'M0',title:'M0 · Vermutungen',prompt:'<strong>Vervollständige</strong> je einen Je-desto-Satz für m₁, m₂ und r. Halte beim Vergleichen jeweils die beiden anderen Größen konstant.',fields:[['mass1','Je größer m₁, desto … F',greater],['mass2','Je größer m₂, desto … F',greater],['range','Je größer r, desto … F',greater]],answers:['up','up','down'],helps:['Verändere in der Simulation nur eine Größe.','Vergleiche dieselbe Einstellung vor und nach einer Erhöhung.','Mehr Masse verstärkt, mehr Abstand schwächt die Anziehung.'],messages:{success:'Richtig. Beide Massen verstärken die Kraft, größerer Abstand schwächt sie.',partial:'Teilweise korrekt. Prüfe den Satz zum Abstand noch einmal getrennt von den Massen.',error:'Noch nicht korrekt. Ändere immer nur eine Größe und beobachte die Kraftanzeige.'},after:updateLawUnlock});
  ['A','B','C'].forEach(buildMeasurement);
  $('card-m1a').before($('simulation-view-4'));
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
  R:{'km':1000,'m':1,'cm':0.01,'kg':NaN}
};
function setupNumeric({host,id,title,prompt,numbers,choices=[],helps,messages,after}){
  const area=card(host,id,title,prompt,helps);
  const state={numbers,choices,numberPassed:false,choicePassed:Object.fromEntries(choices.map(([suffix])=>[suffix,false]))};
  numericCards.set(id,state);
  const perhapsFinish=()=>{
    if(state.numberPassed&&choices.every(([suffix])=>state.choicePassed[suffix])){finish(id);after?.();}
  };
  for(const [suffix,label,target,digits,kind] of numbers){
    const pair=document.createElement('div');pair.className='physics-number-entry';
    const units=Object.keys(unitSets[kind]);
    pair.innerHTML=`<label for="${id.toLowerCase()}-${suffix}">${label} (${digits} gültige Ziffern)</label><div class="physics-number-controls"><input id="${id.toLowerCase()}-${suffix}" type="text" inputmode="decimal" autocomplete="off" placeholder="z. B. 6,67·10^-11"><select id="${id.toLowerCase()}-${suffix}-unit" aria-label="Einheit für ${label}"><option value="">Einheit</option>${units.map(u=>`<option value="${u}">${u}</option>`).join('')}</select></div>`;
    area.append(pair);
  }
  area.append($(`check-${id.toLowerCase()}`),$(`feedback-${id.toLowerCase()}`));
  for(const [suffix,label,options,right] of choices){
    const choice=addSelect(area,`${id.toLowerCase()}-${suffix}`,label,options);
    const button=document.createElement('button');button.id=`check-${id.toLowerCase()}-${suffix}`;button.type='button';button.className='physics-primary-button';button.textContent=`${label} prüfen`;
    const result=document.createElement('p');result.id=`feedback-${id.toLowerCase()}-${suffix}`;result.className='physics-feedback';result.setAttribute('role','status');result.setAttribute('aria-live','polite');result.hidden=true;
    choice.after(button,result);
    button.addEventListener('click',()=>{
      const selected=$(`${id.toLowerCase()}-${suffix}`).value;
      const correct=selected===right;
      state.choicePassed[suffix]=correct;
      feedback(result.id,correct?'success':'error',selected?separateChoiceFeedback[id][correct?'success':'error']:'Wähle zuerst eine Aussage aus.');
      perhapsFinish();progress?.save();
    });
  }
  $(`check-${id.toLowerCase()}`).addEventListener('click',()=>{
    const states=numbers.map(([suffix,label,target,digits,kind])=>({label,state:checkQuantity($(`${id.toLowerCase()}-${suffix}`).value,$(`${id.toLowerCase()}-${suffix}-unit`).value,{target,digits,units:unitSets[kind],tolerance:id==='M3'?0.01e-11:0})}));
    const good=states.filter(s=>s.state==='correct').length;
    const level=good===states.length?'success':good||states.some(s=>s.state==='precision')?'partial':'error';
    state.numberPassed=level==='success';
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
function setupRatio(){
  const area=card('tasks-application','A5','A5 · Merkur-Modell','Im vereinfachten Modell besitzt Merkur genau die halbe Marsmasse und dieselbe Oberflächenfallbeschleunigung. <strong>Bestimme</strong> das Verhältnis R<sub>Merkur</sub>/R<sub>Mars</sub> mit drei gültigen Ziffern.',[
    'Setze die beiden Oberflächenbeschleunigungen gleich.',
    'Bei gleichem g ist der Radius proportional zur Quadratwurzel der Masse.',
    'Das gesuchte Verhältnis ist √(M<sub>Merkur</sub>/M<sub>Mars</sub>)=√0,5.'
  ]);
  area.innerHTML='<label for="a5-ratio">R<sub>Merkur</sub>/R<sub>Mars</sub> (3 gültige Ziffern)</label><input id="a5-ratio" type="text" inputmode="decimal">';
  $('check-a5').addEventListener('click',()=>{
    const q=parseQuantity($('a5-ratio').value);let level='error';
    if(q&&Math.abs(q.value-0.707)<=0.0005)level=q.digits===3?'success':'partial';
    feedback('feedback-a5',level,{success:'Richtig. Im vereinfachten Modell beträgt der Merkurradius 0,707 des Marsradius.',partial:'Teilweise korrekt. Dein Verhältnis liegt nahe am Ziel; prüfe drei gültige Ziffern.',error:'Noch nicht korrekt. Halbe Masse bedeutet bei gleichem g nicht halben Radius; beachte das Quadrat von R.'}[level]);
    if(level==='success')finish('A5');
  });
}
function buildApplications(){
  const earthMass=5.974e24,earthRadius=6370e3;
  const appleForce=G*earthMass*0.150/earthRadius**2;
  setupNumeric({host:'tasks-application',id:'A1',title:'A1 · Apfel und Erde',prompt:'Ein Apfel mit 150 g hängt dicht über der Erde. <strong>Bestimme</strong> die gegenseitige Kraft und die Beschleunigung von Apfel und Erde; <strong>wähle</strong> die Erklärung, warum vor allem der Apfel sichtbar fällt.',numbers:[['force','Kraft',appleForce,2,'F'],['apple','Beschleunigung Apfel',appleForce/0.150,2,'a'],['earth','Beschleunigung Erde',appleForce/earthMass,2,'a']],choices:[['why','Erklärung',yesNo('Gleiche Kraft, aber die Erde hat viel größere Masse und deshalb viel kleinere Beschleunigung','Auf die Erde wirkt keine Kraft'),'yes']],helps:['Für den Abstand genügt hier näherungsweise der Erdradius.','Berechne zuerst F und teile denselben Kraftbetrag jeweils durch die betreffende Masse.','m<sub>Apfel</sub>=0,150 kg; F≈1,474 N. Für beide Beschleunigungen gilt a=F/m, aber mit verschiedener Masse.'],messages:{success:'Richtig. Beide Kräfte sind gleich groß; wegen der riesigen Erdmasse ist ihre Beschleunigung kaum merklich.',partial:'Teilweise korrekt. Prüfe die zweite Beschleunigung und die Auswahl zu gleichen Kräften.',error:'Noch nicht korrekt. Setze 0,150 kg und den Erdradius in Metern ein.'}});
  setupNumeric({host:'tasks-application',id:'A2',title:'A2 · Astronautin',prompt:'Eine Astronautin mit 62 kg umkreist die Erde in 400 km Höhe. <strong>Berechne</strong> ihre Gravitationskraft dort und am Boden; <strong>wähle</strong> die Erklärung für scheinbare Schwerelosigkeit im Orbit.',numbers:[['orbit','Kraft in 400 km Höhe',G*earthMass*62/(6770e3)**2,2,'F'],['ground','Kraft am Boden',G*earthMass*62/earthRadius**2,2,'F']],choices:[['why','Erklärung',yesNo('Astronautin und Raumstation befinden sich gemeinsam im freien Fall um die Erde','Dort wirkt keine Erdgravitation'),'yes']],helps:['Der Abstand beginnt am Erdmittelpunkt.','Für die Höhe addiere Erdradius und 400 km; berechne F zweimal.','Verwende r<sub>Orbit</sub>=6770 km und r<sub>Boden</sub>=6370 km. Die Orbitkraft ist noch deutlich von null verschieden.'],messages:{success:'Richtig. Auch im Orbit wirkt starke Gravitation; das gemeinsame Fallen erklärt die scheinbare Schwerelosigkeit.',partial:'Teilweise korrekt. Prüfe den Mittelpunktabstand oder die Erklärung zum freien Fall.',error:'Noch nicht korrekt. 400 km ist die Höhe über der Oberfläche, nicht der Abstand vom Erdmittelpunkt.'}});
  const derivation=document.createElement('article');derivation.className='physics-task-card';derivation.id='surface-derivation';derivation.innerHTML='<p>An der Oberfläche gilt für einen Probekörper zugleich F<sub>G</sub> = m·g und F<sub>G</sub> = G·<span class="physics-fraction"><span class="physics-fraction__numerator">M·m</span><span class="physics-fraction__denominator">R²</span></span>. Nach Kürzen der Probemasse folgt g = G·<span class="physics-fraction"><span class="physics-fraction__numerator">M</span><span class="physics-fraction__denominator">R²</span></span>.</p>';$('tasks-application').append(derivation);
  setupNumeric({host:'tasks-application',id:'A3',title:'A3 · Mond',prompt:'Der Mond hat M=7,349·10²² kg und R=1737 km. <strong>Bestimme</strong> seine Oberflächenfallbeschleunigung und <strong>vergleiche</strong> sie mit der der Erde.',numbers:[['g','Oberflächenfallbeschleunigung',G*7.349e22/(1737e3)**2,4,'a']],choices:[['comparison','Vergleich',yesNo('kleiner als auf der Erde, ungefähr ein Sechstel','gleich wegen gleicher Probemasse'),'yes']],helps:['Die Probemasse fällt in g=G·M/R² heraus.','Wandle 1737 km in Meter um und quadriere den Radius.','Setze M=7,349·10²² kg und R=1,737·10⁶ m ein; der Rechenwert liegt nahe 1,63 m/s².'],messages:{success:'Richtig. Auf dem Mond beträgt g etwa 1,626 m/s² und ist deutlich kleiner als auf der Erde.',partial:'Teilweise korrekt. Prüfe die vier gültigen Ziffern oder den Vergleich mit der Erde.',error:'Noch nicht korrekt. Der Mondradius muss vor dem Quadrieren in Meter umgerechnet werden.'}});
  setupNumeric({host:'tasks-application',id:'A4',title:'A4 · Mars',prompt:'Für Mars gelten M=6,417·10²³ kg und g=3,7 m/s². <strong>Bestimme</strong> den mittleren Radius aus dem Gravitationsgesetz.',numbers:[['radius','Marsradius',Math.sqrt(G*6.417e23/3.7),2,'R']],helps:['Stelle g=G·M/R² nach R um.','Nach Multiplikation mit R² folgt R²=G·M/g.','Ziehe die Wurzel aus G·M/g; vor Rundung sind es etwa 3402 km.'],messages:{success:'Richtig. Der Modellwert für den Marsradius ist 3,4·10³ km.',partial:'Teilweise korrekt. Der Betrag passt; prüfe Einheit oder zwei gültige Ziffern.',error:'Noch nicht korrekt. Nach R² musst du noch die Quadratwurzel ziehen.'}});
  setupRatio();
}

function simulationMarkup(prefix){
  return `<div class="grav-simulation physics-task-card" id="${prefix}-root"><div class="grav-controls"><label for="${prefix}-m1">Masse 1: <output id="${prefix}-m1-out">3,5 t</output></label><input id="${prefix}-m1" type="range" min="0" max="8" step="0.1" value="3.5"><label for="${prefix}-m2">Masse 2: <output id="${prefix}-m2-out">4,5 t</output></label><input id="${prefix}-m2" type="range" min="0" max="8" step="0.1" value="4.5"><label for="${prefix}-distance">Mittelpunktabstand r in m</label><input id="${prefix}-distance" type="number" min="0.5" max="12" step="0.1" value="7"><button id="${prefix}-reset" type="button" class="physics-primary-button">Ausgangslage wiederherstellen</button><p id="${prefix}-distance-feedback" class="physics-feedback" role="status" aria-live="polite" hidden></p></div><div class="grav-scene"><svg id="${prefix}-svg" viewBox="0 0 640 440" role="group" aria-labelledby="${prefix}-title ${prefix}-desc"><title id="${prefix}-title">Gravitationskräfte zwischen zwei Massen</title><desc id="${prefix}-desc">Zwei verschiebbare Körper mit gleich langen, entgegengesetzt gerichteten Kraftpfeilen. Pfeiltasten verschieben den fokussierten Körper um 0,1 Meter, mit Umschalttaste um 0,5 Meter.</desc><defs><marker id="${prefix}-arrow1" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 Z" fill="#2563eb"></path></marker><marker id="${prefix}-arrow2" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto"><path d="M0,0 L9,4.5 L0,9 Z" fill="#b45309"></path></marker></defs><line id="${prefix}-connector" class="grav-connector"></line><line id="${prefix}-force1" class="grav-arrow grav-arrow1" marker-end="url(#${prefix}-arrow1)"></line><line id="${prefix}-force2" class="grav-arrow grav-arrow2" marker-end="url(#${prefix}-arrow2)"></line><circle id="${prefix}-body1" class="grav-body grav-body1" aria-hidden="true" pointer-events="none"></circle><circle id="${prefix}-body2" class="grav-body grav-body2" aria-hidden="true" pointer-events="none"></circle><circle id="${prefix}-center1" class="grav-center" r="3" pointer-events="none"></circle><circle id="${prefix}-center2" class="grav-center" r="3" pointer-events="none"></circle><text id="${prefix}-label1" class="grav-label" text-anchor="middle">m₁</text><text id="${prefix}-label2" class="grav-label" text-anchor="middle">m₂</text><circle id="${prefix}-hit1" class="grav-hit" r="26" tabindex="0" role="button" aria-label="Masse 1 verschieben"></circle><circle id="${prefix}-hit2" class="grav-hit" r="26" tabindex="0" role="button" aria-label="Masse 2 verschieben"></circle></svg></div><div class="grav-readout" aria-live="polite"><p id="${prefix}-readout">Mittelpunktabstand r = 7,0 m</p><p id="${prefix}-force1-readout">Kraft auf Masse 1 durch Masse 2</p><p id="${prefix}-force2-readout">Kraft auf Masse 2 durch Masse 1</p></div></div>`;
}
const WORLD_SCALE=32;
function scenePoint(x,y){return {x:320+x*WORLD_SCALE,y:220-y*WORLD_SCALE};}
function eventPoint(svg,event){
  const point=svg.createSVGPoint();point.x=event.clientX;point.y=event.clientY;
  const mapped=point.matrixTransform(svg.getScreenCTM().inverse());
  return {x:mapped.x,y:mapped.y};
}
function updateSimulation(){
  for(const prefix of ['sim3','sim4']){
    const p1=scenePoint(simulation.x1,simulation.y1),p2=scenePoint(simulation.x2,simulation.y2);
    const scene=$(`${prefix}-svg`),margin=80;
    const left=Math.min(0,p1.x-margin,p2.x-margin),top=Math.min(0,p1.y-margin,p2.y-margin);
    const right=Math.max(640,p1.x+margin,p2.x+margin),bottom=Math.max(440,p1.y+margin,p2.y+margin);
    scene.setAttribute('viewBox',`${left} ${top} ${right-left} ${bottom-top}`);
    const transform=scene.getScreenCTM();
    const hitRadius=transform?Math.max(26,22/Math.hypot(transform.a,transform.b)):26;
    const r=distance(simulation),f=force(simulation),micro=f*1e6;
    $(`${prefix}-m1`).value=simulation.m1;$(`${prefix}-m2`).value=simulation.m2;
    $(`${prefix}-m1-out`).textContent=`${simulation.m1.toFixed(1).replace('.',',')} t`;
    $(`${prefix}-m2-out`).textContent=`${simulation.m2.toFixed(1).replace('.',',')} t`;
    $(`${prefix}-distance`).value=r.toFixed(1);
    const connector=$(`${prefix}-connector`);connector.setAttribute('x1',p1.x);connector.setAttribute('y1',p1.y);connector.setAttribute('x2',p2.x);connector.setAttribute('y2',p2.y);
    const ux=(p2.x-p1.x)/(r*WORLD_SCALE),uy=(p2.y-p1.y)/(r*WORLD_SCALE);
    const length=f===0?0:Math.min(95,20+32*Math.log1p(micro));
    for(const [which,p,dir] of [[1,p1,1],[2,p2,-1]]){
      const body=$(`${prefix}-body${which}`),hit=$(`${prefix}-hit${which}`),center=$(`${prefix}-center${which}`),label=$(`${prefix}-label${which}`),arrow=$(`${prefix}-force${which}`);
      const mass=simulation[`m${which}`];body.setAttribute('cx',p.x);body.setAttribute('cy',p.y);body.setAttribute('r',12+5*Math.sqrt(mass));
      center.setAttribute('cx',p.x);center.setAttribute('cy',p.y);label.setAttribute('x',p.x);label.setAttribute('y',p.y-26-5*Math.sqrt(mass));
      hit.setAttribute('cx',p.x);hit.setAttribute('cy',p.y);hit.setAttribute('r',hitRadius);
      hit.setAttribute('aria-label',`Masse ${which}: ${mass.toFixed(1).replace('.',',')} Tonnen, Mittelpunkt verschieben`);
      arrow.setAttribute('x1',p.x);arrow.setAttribute('y1',p.y);arrow.setAttribute('x2',p.x+dir*ux*length);arrow.setAttribute('y2',p.y+dir*uy*length);arrow.style.display=f===0?'none':'';
    }
    $(`${prefix}-readout`).textContent=`Mittelpunktabstand r = ${r.toFixed(2).replace('.',',')} m; m₁ = ${simulation.m1.toFixed(1).replace('.',',')} t; m₂ = ${simulation.m2.toFixed(1).replace('.',',')} t`;
    $(`${prefix}-force1-readout`).textContent=`Kraft auf Masse 1 durch Masse 2: ${micro.toFixed(2).replace('.',',')} µN`;
    $(`${prefix}-force2-readout`).textContent=`Kraft auf Masse 2 durch Masse 1: ${micro.toFixed(2).replace('.',',')} µN`;
  }
}
function setupSimulation(){
  $('simulation-view-3').innerHTML=simulationMarkup('sim3');
  $('simulation-view-4').innerHTML=simulationMarkup('sim4');
  for(const prefix of ['sim3','sim4']){
    const scene=$(`${prefix}-svg`);scene.setAttribute('role','group');
    scene.insertBefore($(`${prefix}-force1`),$(`${prefix}-center1`));
    scene.insertBefore($(`${prefix}-force2`),$(`${prefix}-center1`));
    for(const which of [1,2]){
      $(`${prefix}-m${which}`).addEventListener('input',event=>{simulation[`m${which}`]=Number(event.target.value);updateSimulation();progress?.save();});
      const body=$(`${prefix}-hit${which}`),svg=$(`${prefix}-svg`);
      body.addEventListener('pointerdown',event=>{body.setPointerCapture(event.pointerId);body.dataset.drag='1';event.preventDefault();});
      body.addEventListener('pointermove',event=>{
        if(body.dataset.drag!=='1')return;
        const p=eventPoint(svg,event);simulation=moveBody(simulation,which,(p.x-320)/WORLD_SCALE,(220-p.y)/WORLD_SCALE);updateSimulation();progress?.save();
      });
      for(const type of ['pointerup','pointercancel','lostpointercapture'])body.addEventListener(type,()=>{delete body.dataset.drag;});
      body.addEventListener('keydown',event=>{
        const dir={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,1],ArrowDown:[0,-1]}[event.key];if(!dir)return;
        event.preventDefault();const delta=event.shiftKey?0.5:0.1;
        simulation=moveBody(simulation,which,simulation[`x${which}`]+dir[0]*delta,simulation[`y${which}`]+dir[1]*delta);updateSimulation();progress?.save();
      });
    }
    const dist=$(`${prefix}-distance`);
    dist.addEventListener('change',()=>{
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
  S1:'Die Kräfte greifen an verschiedenen Körpern an, sind gleich groß und entgegengesetzt; die größere Masse wird bei gleicher Kraft weniger beschleunigt.',
  S2:'Die Kräfte greifen an verschiedenen Körpern an, sind gleich groß und entgegengesetzt; die größere Masse wird bei gleicher Kraft weniger beschleunigt.',
  M0:'F ist proportional zu m₁ und m₂ sowie umgekehrt proportional zu r²; beim Verdoppeln beider Massen entsteht 4F, beim Verdoppeln des Abstands F/4.',
  M1A:'21,45 | 24,52 | 27,58 | 30,65 µN',M1B:'23,84 | 27,24 | 30,65 | 34,05 µN',M1C:'19,86 | 16,69 | 12,26 | 10,68 µN',
  M2:'F ist proportional zu m₁ und m₂ sowie umgekehrt proportional zu r²; beim Verdoppeln beider Massen entsteht 4F, beim Verdoppeln des Abstands F/4.',
  M3:'Aus einer simulierten Messreihe folgt ungefähr G=6,67·10⁻¹¹ N·m²/kg²; der Wert war in der Simulation bereits hinterlegt.',
  M4:'Die Cavendish-Zahlen ergeben etwa 6,75·10⁻¹¹ N·m²/kg², passend zur begrenzten Genauigkeit der historischen Angaben.',
  A1:'Beide Körper erfahren etwa 1,5 N; der Apfel etwa 9,8 m/s², die Erde nur etwa 2,5·10⁻²⁵ m/s².',
  A2:'In 400 km Höhe wirken etwa 5,4·10² N, am Boden etwa 6,1·10² N; der Orbit ist gemeinsamer freier Fall.',
  A3:'Am Mond beträgt g etwa 1,626 m/s², ungefähr ein Sechstel des Erdwerts.',
  A4:'Der Marsradius beträgt aus diesen Angaben etwa 3,4·10³ km.',
  A5:'Im vereinfachten Modell ist R<sub>Merkur</sub>/R<sub>Mars</sub>=√0,5≈0,707.'
};
function updateSummary(){
  if(typeof document==='undefined')return;
  const all=Object.keys(solutionIdeas).every(id=>completed.has(id));
  $('summary-pending').hidden=all;$('summary-content').hidden=!all;
  if(!all)return;
  const groupings=[['Newton und die Principia',['N1','P1','P2','P3','P4']],['Kräftebild',['S1','S2']],['Messreihen und Gesetz',['M0','M1A','M1B','M1C','M2','M3','M4']],['Anwendungen',['A1','A2','A3','A4','A5']]];
  const root=$('summary-content');root.replaceChildren();
  const memory=document.createElement('article');memory.className='physics-task-card';memory.innerHTML=`<h3>Merksätze</h3><p>Alle Körper mit Masse ziehen einander an. Die beiden Kräfte sind gleich groß, entgegengesetzt gerichtet und wirken auf verschiedene Körper.</p><p>Bei einer durch Gravitation bewirkten Kreisbewegung ist die Gravitationskraft die benötigte Zentripetalkraft; beide Kräfte werden nicht addiert.</p><p>Die Gravitationskraft wächst proportional mit jeder der beiden Massen und nimmt mit dem Quadrat des Mittelpunktabstands ab.</p><p>Für den Kraftbetrag gilt F<sub>G</sub> = G·<span class="physics-fraction"><span class="physics-fraction__numerator">m₁·m₂</span><span class="physics-fraction__denominator">r²</span></span>. Auf der Oberfläche eines Himmelskörpers gilt g=G·<span class="physics-fraction"><span class="physics-fraction__numerator">M</span><span class="physics-fraction__denominator">R²</span></span>.</p><p>Schwerelosigkeit im Orbit bedeutet gemeinsamer freier Fall, nicht fehlende Gravitation.</p>`;root.append(memory);
  groupings.forEach(([heading,ids])=>{
    const details=document.createElement('details');details.className='physics-task-card';
    const summary=document.createElement('summary');summary.textContent=heading;details.append(summary);
    ids.forEach(id=>{
      const original=$(`card-${id.toLowerCase()}`),entry=document.createElement('div');entry.className='grav-summary-entry';
      const title=original.querySelector('h3')?.textContent||id,prompt=original.querySelector('.task-prompt')?.innerHTML||'';
      const fields=[...original.querySelectorAll('.task-fields input, .task-fields select')].filter(el=>!el.id.endsWith('-unit'));
      const own=fields.map(el=>el.tagName==='SELECT'?el.selectedOptions[0]?.textContent:`${el.value}${$(el.id+'-unit')?.value?' '+$(el.id+'-unit').value:''}`).join(' · ');
      entry.innerHTML=`<h4>${title}</h4><p>${prompt}</p><p><strong>Deine Eingabe:</strong> <span data-own-answer></span></p><p><strong>Lösungsidee:</strong> ${htmlText(solutionIdeas[id])}</p>`;
      entry.querySelector('[data-own-answer]').textContent=own;
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
  ['Warum wirkt eine Astronautin im Orbit schwerelos?',[['a','Sie fällt mit der Raumstation gemeinsam um die Erde.'],['b','In 400 km Höhe gibt es keine Erdanziehung.'],['c','Die Erde zieht nur ruhende Körper an.']],['a'],'Richtig. Im Orbit wirkt Gravitation weiterhin.','Teilweise korrekt. Verbinde freien Fall und vorhandene Gravitation.','Noch nicht korrekt. Die berechnete Orbitkraft ist deutlich von null verschieden.'],
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
  setupPhysicsStepTabs();
  buildSources();buildSimulationTasks();buildLaw();buildApplications();buildQuiz();setupSimulation();
  const invalidate=event=>{
    const card=event.target.closest?.('.physics-task-card[id^="card-"]');if(!card)return;
    const id=card.id.slice(5).toUpperCase();
    const numeric=numericCards.get(id);
    if(numeric){
      const changed=event.target.id;
      if(numeric.numbers.some(([suffix])=>changed===`${id.toLowerCase()}-${suffix}`||changed===`${id.toLowerCase()}-${suffix}-unit`)){
        numeric.numberPassed=false;$(`feedback-${id.toLowerCase()}`).hidden=true;
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
  progress.registerPart('simulation',()=>({...simulation}),saved=>{if(validState(saved)){simulation={...saved};updateSimulation();}});
  progress.registerPart('m2-observations',()=>Object.fromEntries(m2Cases.filter(item=>validM2Observation(item,m2Observations[item.id])).map(item=>[item.id,{...m2Observations[item.id]}])),saved=>{
    m2Cases.forEach(item=>{delete m2Observations[item.id];if(validM2Observation(item,saved?.[item.id]))m2Observations[item.id]={...saved[item.id]};});
    renderM2Observations();
  });
  progress.registerPart('completed',()=>[...completed],saved=>{if(Array.isArray(saved)){const allowed=new Set(Object.keys(solutionIdeas));saved.forEach(id=>{if(allowed.has(id)&&!numericCards.has(id)&&(id!=='M2'||allM2Observations()&&m2SelectionsCorrect()))completed.add(id);});}if(!completed.has('M2')){completed.delete('M3');completed.delete('M4');}lawStepUnlock();updateSummary();$('modern-note').hidden=!completed.has('P1');$('m4-note').hidden=!completed.has('M4');});
  progress.registerPart('numeric-checks',()=>Object.fromEntries([...numericCards].map(([id,state])=>[id,{numberPassed:state.numberPassed,choicePassed:{...state.choicePassed}}])),saved=>{
    if(!saved||typeof saved!=='object'||Array.isArray(saved))return;
    for(const [id,state] of numericCards){
      const record=saved[id];if(!record||typeof record!=='object')continue;
      const validNumbers=state.numbers.every(([suffix,label,target,digits,kind])=>checkQuantity($(`${id.toLowerCase()}-${suffix}`).value,$(`${id.toLowerCase()}-${suffix}-unit`).value,{target,digits,units:unitSets[kind],tolerance:id==='M3'?0.01e-11:0})==='correct');
      state.numberPassed=record.numberPassed===true&&validNumbers;
      for(const [suffix,label,options,right] of state.choices)state.choicePassed[suffix]=record.choicePassed?.[suffix]===true&&$(`${id.toLowerCase()}-${suffix}`).value===right;
      if(state.numberPassed&&state.choices.every(([suffix])=>state.choicePassed[suffix]))completed.add(id);
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



