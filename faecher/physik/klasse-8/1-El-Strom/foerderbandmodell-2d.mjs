import { deriveModel, chainSpeed, fmtVoltage, fmtCurrent, readoutHtml, equationsHtml } from "./foerderbandmodell-core.mjs";
import { createPhysicsTaskProgress } from "../../klasse-11/1-Kreisbewegungen/components/physics-task-progress.mjs";
import { setupPhysicsStepTabs } from "../../klasse-11/1-Kreisbewegungen/components/physics-step-tabs.mjs";
import { enableTokenDrag, wasDragged } from "../../klasse-11/1-Kreisbewegungen/components/token-drag.mjs";

const svgNS = "http://www.w3.org/2000/svg";
const modes = { simple: "Einfacher Stromkreis", series: "Reihenschaltung", parallel: "Parallelschaltung" };
const $ = id => document.getElementById(id);
const subSvg = (letter, index) => `${letter}<tspan baseline-shift="sub" font-size="70%">${index}</tspan>`;
const label = (x, y, content, extra = "", anchor = "middle") => `<text x="${x}" y="${y}" text-anchor="${anchor}" class="fb-label ${extra}">${content}</text>`;
const plate = (x, y, width, content) => `<g><rect class="fb-label-plate" x="${x-width/2}" y="${y-24}" width="${width}" height="33" rx="7"/><text class="fb-belt-label" text-anchor="middle" x="${x}" y="${y}">${content}</text></g>`;
const support = (x, top, low) => `<path class="fb-support" d="M${x} ${top+8}V${low-9}"/><path class="fb-level" d="M${x-25} ${top+8}H${x+25}"/>`;
const bracket = (x, top, bottom, caption, side = "right") => `<g><path class="fb-height" d="M${x-12} ${top}h12v${bottom-top}h-12"/>${label(side==="left"?x-11:x+13,(top+bottom)/2+5,caption,"fb-voltage-label",side==="left"?"end":"start")}</g>`;
const section = (x, y, caption, labelX = x, labelY = y-22) => `<g><path class="fb-section" d="M${x} ${y-17}v34M${x-13} ${y-17}h26M${x-13} ${y+17}h26"/>${label(labelX,labelY,caption,"fb-small")}</g>`;
const verticalSection = (x, y, caption, labelX, labelY) => `<g><path class="fb-section" d="M${x-12} ${y}h24M${x-12} ${y-5}v10M${x+12} ${y-5}v10"/>${label(labelX,labelY,caption,"fb-small")}</g>`;

function updateCircuit(model) {
  const svg=$("circuit-svg");
  const lamp=(x,y,index,labelX=x,labelY=y+43)=>`<g class="circuit-consumer" data-lamp="${index}" style="color:${index===1?"#1a658e":"#a94634"}"><circle class="circuit-lamp${index===2?" circuit-lamp-2":""}" cx="${x}" cy="${y}" r="21"/><path class="circuit-cross" d="M${x-14} ${y-14}l28 28M${x-14} ${y+14}l28-28"/><text x="${labelX}" y="${labelY}" text-anchor="middle">${subSvg("L",index)}</text></g>`;
  const source=`<path class="circuit-wire" d="M55 55V115M55 133V205M35 115H75M43 133H67"/><text x="24" y="112" text-anchor="middle">+</text><text x="24" y="144" text-anchor="middle">−</text><text x="55" y="240" text-anchor="middle">Batterie</text>`;
  let wires,lamps,junctions="";
  if(model.mode==="series") {
    wires="M55 55H114M156 55H194M236 55H260V205H55";
    lamps=lamp(135,55,1)+lamp(215,55,2);
  } else if(model.mode==="parallel") {
    wires="M55 55H260V109M260 151V205H55M165 55V109M165 151V205";
    lamps=lamp(165,130,1,127,136)+lamp(260,130,2,222,136);
    junctions='<circle cx="165" cy="55" r="5" fill="#17324d"/><circle cx="165" cy="205" r="5" fill="#17324d"/>';
  } else {
    wires="M55 55H260V109M260 151V205H55";
    lamps=lamp(260,130,1,222,136);
  }
  svg.innerHTML=`${source}<path class="circuit-wire" d="${wires}"/>${junctions}${lamps}`;
  svg.setAttribute("aria-label",`${modes[model.mode]}: Batterie und ${model.mode==="simple"?"eine Glühlampe in einem geschlossenen Stromkreis":model.mode==="series"?"zwei Glühlampen hintereinander in einem Stromkreis":"zwei Glühlampen in getrennten parallelen Zweigen"}.`);
  $("circuit-name").textContent=modes[model.mode];
  $("circuit-legend").innerHTML=model.mode==="simple"?"L<sub>1</sub> entspricht dem Drehkreuz.":"L<sub>1</sub> und L<sub>2</sub> entsprechen den beiden Drehkreuzen.";
}

function gate(x, y, index, radius) {
  const arm=radius*.7, diagonal=radius*.5, ray=radius+11;
  return `<g class="fb-gate" data-gate="${index}" data-center-x="${x}" data-center-y="${y}">
    <circle class="fb-gate-ring" cx="${x}" cy="${y}" r="${radius}" style="stroke-width:${Math.max(2,radius*.16)}"/>
    <g class="fb-gate-rotor" transform="translate(${x} ${y})">
      <path class="fb-gate-arm" style="stroke-width:${Math.max(2,radius*.24)}" d="M-${arm} 0H${arm}M0 -${arm}V${arm}M-${diagonal} -${diagonal}L${diagonal} ${diagonal}M-${diagonal} ${diagonal}L${diagonal} -${diagonal}"/>
      <circle class="fb-gate-hub" r="${Math.max(3,radius*.26)}" style="stroke-width:${Math.max(1.5,radius*.1)}"/>
    </g>
    <path class="fb-lamp-rays" d="M${x-ray} ${y-radius*.5}l-7-4M${x-ray} ${y+radius*.5}l-7 4M${x+ray} ${y-radius*.5}l7-4M${x+ray} ${y+radius*.5}l7 4"/>
  </g>`;
}

function belt(a, b, width, twoLanes) {
  const dx=b.x-a.x, dy=b.y-a.y, length=Math.hypot(dx,dy), nx=-dy/length, ny=dx/length, r=width/2;
  const path=`M${a.x+nx*r} ${a.y+ny*r}L${b.x+nx*r} ${b.y+ny*r}A${r} ${r} 0 0 0 ${b.x-nx*r} ${b.y-ny*r}L${a.x-nx*r} ${a.y-ny*r}A${r} ${r} 0 0 0 ${a.x+nx*r} ${a.y+ny*r}Z`;
  const guide=twoLanes?`<path class="fb-belt-inner" d="M${a.x} ${a.y}L${b.x} ${b.y}"/>`:"";
  const treads=Array.from({length:18},(_,i)=>`<path class="fb-tread" data-tread="${i}" d="M-19 0H19"/>`).join("");
  const roller=at=>`<g class="fb-roller-rotor" data-roller="${at===a?0:1}" transform="translate(${at.x} ${at.y})"><circle class="fb-roller" r="${r-5}"/><path class="fb-spoke" d="M-${r-13} 0H${r-13}M0 -${r-13}V${r-13}"/><circle class="fb-roller-hub" r="8"/></g>`;
  return {html:`<g class="fb-belt-assembly"><path class="fb-belt" d="${path}"/>${guide}<g class="fb-treads">${treads}</g>${roller(a)}${roller(b)}</g>`, geometry:{a,b,width,length,nx,ny}};
}

export function geometry(model, compact) {
  const width=compact?600:1100;
  const low=compact?700:520, top=low-(compact?48:40)*model.voltage, mid=(low+top)/2;
  const height=compact?Math.max(360,low-top+270):Math.max(250,low-top+190);
  const viewY=(low+top-height)/2;
  const parallel=model.mode==="parallel";
  const a={x:compact?105:185,y:low};
  const b={x:a.x+(compact?65:105),y:top};
  const beltWidth=parallel?(compact?92:116):(compact?56:68);
  const right=compact?505:945;
  const end=compact?485:875;
  let paths=[], staticHtml="", gates=[], currents=[];
  const beltShape=belt(a,b,beltWidth,parallel);
  const ground=`<rect class="fb-ground" x="18" y="${low+42}" width="${width-36}" height="19" rx="8"/>`;
  if(parallel) {
    const lane=compact?24:32, lxA=a.x-lane,lxB=b.x-lane,rxA=a.x+lane,rxB=b.x+lane;
    const inner=compact?350:650;
    const corner=Math.min(29,(low-top)*.33), gateRadius=Math.min(31,(low-top)*.43);
    // Both closed chains use the same upper and lower corridor. They branch
    // only at the inner consumer on the right; each still falls by the full U.
    paths=[
      `M${lxA} ${low}L${lxB} ${top}H${inner-corner}Q${inner} ${top} ${inner} ${top+corner}V${low-corner}Q${inner} ${low} ${inner-corner} ${low}H${lxA}Z`,
      `M${rxA} ${low}L${rxB} ${top}H${right-corner}Q${right} ${top} ${right} ${top+corner}V${low-corner}Q${right} ${low} ${right-corner} ${low}H${rxA}Z`,
    ];
    gates=[{x:inner,y:mid,radius:gateRadius,current:model.branchCurrents[0]},{x:right,y:mid,radius:gateRadius,current:model.branchCurrents[1]}];
    currents=model.chainCurrents;
    staticHtml+=support(inner-100,top,low)+support(right-75,top,low);
    staticHtml+=bracket(inner+37,top,low,subSvg("U",1))+bracket(right+27,top,low,subSvg("U",2));
    const markY=top+Math.min(12,(low-top)*.08);
    const cornerT=Math.sqrt((markY-top)/corner);
    const markOffset=corner*(1-cornerT)**2;
    staticHtml+=verticalSection(inner-markOffset,markY,subSvg("I",1),inner-46,top-25)+verticalSection(right-markOffset,markY,subSvg("I",2),right-46,top-25);
    staticHtml+=label(inner-42,top-54,"Zweig 1")+label(right-46,top-54,"Zweig 2");
    staticHtml+=`<circle cx="${inner-corner}" cy="${top}" r="5" fill="#17324d"/><circle cx="${inner-corner}" cy="${low}" r="5" fill="#17324d"/>`;
    const sectionY=low-Math.min(42,(low-top)*.52),fraction=(low-sectionY)/(low-top),sectionX=a.x+(b.x-a.x)*fraction;
    staticHtml+=`<path class="fb-section" d="M${sectionX-beltWidth*.47} ${sectionY}H${sectionX+beltWidth*.47}M${sectionX-beltWidth*.47} ${sectionY-10}v20M${sectionX+beltWidth*.47} ${sectionY-10}v20"/>`;
    staticHtml+=label(a.x,low+88,"Gesamtstrom I","fb-small");
  } else if(model.mode==="series") {
    const first=compact?330:610,second=end;
    const step=mid-top,corner=Math.min(23,step*.32),gateRadius=Math.min(31,step*.44);
    paths=[`M${a.x} ${low}L${b.x} ${top}H${first-corner}Q${first} ${top} ${first} ${top+corner}V${mid-corner}Q${first} ${mid} ${first+corner} ${mid}H${second-corner}Q${second} ${mid} ${second} ${mid+corner}V${low-corner}Q${second} ${low} ${second-corner} ${low}H${a.x}Z`];
    gates=[{x:first,y:(top+mid)/2,radius:gateRadius,current:model.current},{x:second,y:(mid+low)/2,radius:gateRadius,current:model.current}];currents=model.chainCurrents;
    staticHtml+=support(compact?245:455,top,low)+support(compact?395:740,mid,low);
    staticHtml+=bracket(first+34,top,mid,subSvg("U",1))+bracket(second+32,mid,low,subSvg("U",2));
    staticHtml+=section(compact?275:485,top,subSvg("I",1))+section(compact?420:760,mid,subSvg("I",2));
    staticHtml+=section(compact?195:365,low,"Gesamtstrom I",compact?195:365,low+88);
  } else {
    const drop=low-top,corner=Math.min(30,drop*.33),gateRadius=Math.min(31,drop*.43);
    paths=[`M${a.x} ${low}L${b.x} ${top}H${end-corner}Q${end} ${top} ${end} ${top+corner}V${low-corner}Q${end} ${low} ${end-corner} ${low}H${a.x}Z`];
    gates=[{x:end,y:mid,radius:gateRadius,current:model.current}];currents=model.chainCurrents;
    staticHtml+=support(compact?285:510,top,low)+support(compact?405:750,top,low);
    staticHtml+=bracket(end+37,top,low,subSvg("U",1));
    staticHtml+=section(compact?390:700,top,subSvg("I",1));
    staticHtml+=section(compact?195:365,low,"Gesamtstrom I",compact?195:365,low+88);
  }
  const branch=parallel?`Zwei getrennte Kugelketten teilen sich den Gesamtstrom: je ${fmtCurrent(model.branchCurrents[0])} und je ${fmtVoltage(model.voltage)}.`:model.mode==="series"?`Eine Kugelkette passiert zwei Drehkreuze mit je ${fmtVoltage(model.branchVoltages[0])}.`:`Eine Kugelkette passiert ein Drehkreuz mit ${fmtVoltage(model.voltage)}.`;
  return {width,viewY,height,low,top,beltShape,paths,staticHtml,ground,gates,currents,description:`${modes[model.mode]}: ${branch} Die Förderhöhe entspricht ${fmtVoltage(model.voltage)}, der Gesamtstrom ${fmtCurrent(model.current)}.`};
}

function init() {
  const ui={mode:$("circuit-mode"),voltage:$("voltage"),current:$("current"),voltageOutput:$("voltage-output"),currentOutput:$("current-output"),play:$("animation-toggle"),status:$("animation-status"),svg:$("simulation-svg"),readouts:$("readouts"),equations:$("equations"),equationsToggle:$("equations-toggle")};
  const progress=createPhysicsTaskProgress("aufgabe2","physik8-foerderbandmodell");
  let model, visual, playing=false, lastTime=0, compact=window.matchMedia("(max-width: 650px)").matches;
  const setRunning=value=>{playing=value;lastTime=0;ui.play.textContent=value?"Animation stoppen":"Animation starten";ui.status.textContent=value?"Animation läuft":"Animation pausiert";};
  const updateText=()=>{ui.voltageOutput.textContent=fmtVoltage(model.voltage);ui.currentOutput.textContent=fmtCurrent(model.current);ui.readouts.innerHTML=readoutHtml(model);ui.equations.innerHTML=equationsHtml(model);};
  const rebuild=()=>{
    setRunning(false);
    if(!Object.hasOwn(modes,ui.mode.value))ui.mode.value="simple";
    const voltage=Number(ui.voltage.value),current=Number(ui.current.value);
    if(!Number.isInteger(voltage)||voltage<2||voltage>12)ui.voltage.value="6";
    if(!Number.isFinite(current)||current<.2||current>2||Math.abs(current*10-Math.round(current*10))>1e-8)ui.current.value="1";
    model=deriveModel(ui.mode.value,Number(ui.voltage.value),Number(ui.current.value));updateText();updateCircuit(model);
    const g=geometry(model,compact),markup=g.paths.map((path,index)=>`<path class="fb-track-shadow" d="${path}"/><path class="fb-track fb-chain-path" data-chain="${index}" d="${path}"/><path class="fb-chain-link${index===1?" lane-2":""}" d="${path}"/>`).join("");
    ui.svg.setAttribute("viewBox",`0 ${g.viewY} ${g.width} ${g.height}`);
    ui.svg.setAttribute("aria-label",g.description);
    ui.svg.innerHTML=`<defs><linearGradient id="belt-gradient" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#466c7e"/><stop offset=".5" stop-color="#294757"/><stop offset="1" stop-color="#183849"/></linearGradient><radialGradient id="ball-gradient" cx=".32" cy=".25"><stop stop-color="#d7f5ff"/><stop offset=".38" stop-color="#49b5e8"/><stop offset="1" stop-color="#0d6da6"/></radialGradient><radialGradient id="ball-coral" cx=".32" cy=".25"><stop stop-color="#ffe5d7"/><stop offset=".38" stop-color="#ff9d79"/><stop offset="1" stop-color="#c64c38"/></radialGradient><filter id="ball-shadow" x="-60%" y="-60%" width="220%" height="220%"><feDropShadow dx="1" dy="2" stdDeviation="2" flood-color="#244456" flood-opacity=".3"/></filter></defs>
      <path d="M20 ${g.low+7}H${g.width-20}" stroke="#bdd1d7" stroke-width="2"/>${g.ground}${g.staticHtml}${g.beltShape.html}${markup}${g.gates.map((item,index)=>gate(item.x,item.y,index,item.radius)).join("")}
      <g id="ball-layer"></g>${plate(g.beltShape.geometry.b.x,g.top-(compact?105:70),compact?210:250,"Förderband (Batterie)")}${label(compact?g.width-95:g.width-150,g.low+30,"untere Ebene","fb-small")}${label(model.mode==="parallel"?g.width-25:compact?g.width-95:g.width-150,g.top-(model.mode==="parallel"&&compact?85:25),"obere Ebene","fb-small",model.mode==="parallel"?"end":"middle")}`;
    const paths=[...ui.svg.querySelectorAll(".fb-chain-path")];
    const ballLayer=ui.svg.querySelector("#ball-layer");
    const chains=paths.map((path,index)=>{
      const length=path.getTotalLength(),balls=[];
      for(let i=0;i<model.ballsPerChain;i++){
        const ball=document.createElementNS(svgNS,"circle");ball.setAttribute("r",compact?8:9);ball.setAttribute("class",`fb-ball${index===1?" lane-2":""}`);ballLayer.append(ball);balls.push(ball);
      }
      return {path,length,balls,current:g.currents[index],phase:0};
    });
    visual={chains,gates:[...ui.svg.querySelectorAll(".fb-gate-rotor")].map((element,index)=>({element,...g.gates[index],angle:0})),rollers:[...ui.svg.querySelectorAll(".fb-roller-rotor")],treads:[...ui.svg.querySelectorAll(".fb-tread")],belt:g.beltShape.geometry,beltPhase:0};
    draw();
  };
  function draw(){
    if(!visual)return;
    for(const chain of visual.chains)chain.balls.forEach((ball,index)=>{
      const p=chain.path.getPointAtLength((chain.phase+index*chain.length/chain.balls.length)%chain.length);
      ball.setAttribute("cx",p.x);ball.setAttribute("cy",p.y);
    });
    visual.gates.forEach(item=>item.element.setAttribute("transform",`translate(${item.x} ${item.y}) rotate(${item.angle*180/Math.PI})`));
    const b=visual.belt,angle=Math.atan2(b.b.y-b.a.y,b.b.x-b.a.x)*180/Math.PI+90;
    visual.rollers.forEach((roller,index)=>roller.setAttribute("transform",`translate(${index?b.b.x:b.a.x} ${index?b.b.y:b.a.y}) rotate(${visual.beltPhase*360})`));
    visual.treads.forEach((tread,index)=>{
      const fraction=(index/visual.treads.length+visual.beltPhase)%1;
      const forward=fraction<.5,t=forward?fraction*2:(fraction-.5)*2;
      const from=forward?b.a:b.b,to=forward?b.b:b.a,side=forward?b.width*.37:-b.width*.37;
      const x=from.x+(to.x-from.x)*t+b.nx*side,y=from.y+(to.y-from.y)*t+b.ny*side;
      tread.setAttribute("transform",`translate(${x} ${y}) rotate(${angle})`);
    });
  }
  ui.mode.addEventListener("change",()=>{rebuild();progress.save();});
  for(const input of [ui.voltage,ui.current])input.addEventListener("input",()=>{rebuild();progress.save();});
  ui.play.addEventListener("click",()=>setRunning(!playing));
  ui.equationsToggle.addEventListener("click",()=>{const show=ui.equations.hidden;ui.equations.hidden=!show;ui.equationsToggle.textContent=show?"Gleichungen ausblenden":"Gleichungen anzeigen";ui.equationsToggle.setAttribute("aria-expanded",String(show));progress.save();});
  progress.registerPart("equations",()=>!ui.equations.hidden,value=>{if(typeof value!=="boolean")return;ui.equations.hidden=!value;ui.equationsToggle.textContent=value?"Gleichungen ausblenden":"Gleichungen anzeigen";ui.equationsToggle.setAttribute("aria-expanded",String(value));});
  rebuild();
  setupPhysicsStepTabs();
  const tabSimulation=$("tab-simulation"), tabMerksaetze=$("tab-merksaetze");
  const syncSimulationViewport=()=>{const next=window.matchMedia("(max-width: 650px)").matches;if(next!==compact){compact=next;rebuild();}};
  tabMerksaetze.addEventListener("click",()=>setRunning(false));
  tabSimulation.addEventListener("click",syncSimulationViewport);
  document.querySelector("[role=tablist]").addEventListener("keydown",event=>{
    if(!["ArrowRight","ArrowLeft","Home","End"].includes(event.key))return;
    queueMicrotask(()=>{
      if(tabMerksaetze.getAttribute("aria-selected")==="true")setRunning(false);
      else syncSimulationViewport();
      progress.save();
    });
  });
  setupMerksatz({progress,targetId:"series-cloze", feedbackId:"series-feedback", checkId:"check-series", terms:["an jeder Stelle","Ort der Spannungsmessung","Summe aller Teilspannungen"], expected:["an jeder Stelle","Ort der Spannungsmessung","Summe aller Teilspannungen"], parts:["In einer Reihenschaltung gilt: Die Stromstärke I ist "," gleich groß. Die gemessene Spannung ist vom "," abhängig. Die "," ergibt die Batteriespannung."], success:"Richtig. Der Merksatz zur Reihenschaltung ist vollständig.", partial:"Teilweise korrekt. Mindestens eine Wortkarte passt schon. Vergleiche die übrigen Lücken mit den Messwerten der Reihenschaltung.", wrong:"Noch nicht korrekt. Stelle die Reihenschaltung in der Simulation ein und prüfe Stromstärke und Teilspannungen erneut."});
  setupMerksatz({progress,targetId:"parallel-cloze", feedbackId:"parallel-feedback", checkId:"check-parallel", terms:["gleich groß","Ort der Stromstärkemessung","Summe der Teilstromstärken"], expected:["Ort der Stromstärkemessung","Summe der Teilstromstärken","gleich groß"], parts:["In einer Parallelschaltung gilt: Die Stromstärke ist abhängig vom ",". Die "," in den einzelnen Zweigen ist gleich der Gesamtstromstärke im Hauptstromkreis. Die Spannungen zwischen den Endpunkten der Zweige sind ","."], success:"Richtig. Der Merksatz zur Parallelschaltung ist vollständig.", partial:"Teilweise korrekt. Mindestens eine Wortkarte passt schon. Vergleiche die übrigen Lücken mit Hauptstromkreis und Zweigen.", wrong:"Noch nicht korrekt. Stelle die Parallelschaltung in der Simulation ein und vergleiche Stromstärken und Spannungen erneut."});
  setupQuiz(progress);
  progress.restore();
  setRunning(false);
  window.addEventListener("resize",()=>{const next=window.matchMedia("(max-width: 650px)").matches;if(next!==compact&& !$("panel-simulation").hidden){compact=next;rebuild();}});
  const frame=time=>{
    const dt=lastTime?Math.min((time-lastTime)/1000,.05):0;lastTime=time;
    if(playing&&visual){
      for(const chain of visual.chains)chain.phase=(chain.phase+chainSpeed(chain.length,chain.current,model.ballsPerChain)*dt)%chain.length;
      for(const item of visual.gates)item.angle+=item.current*dt*1.65;
      visual.beltPhase=(visual.beltPhase+dt*model.current*.085)%1;
      draw();
    }
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

function setupMerksatz({progress,targetId,feedbackId,checkId,terms,expected,parts,success,partial,wrong}) {
  const target=$(targetId), bank=document.createElement("div"), sentence=document.createElement("p"), feedback=$(feedbackId);
  const choices=new Array(terms.length).fill(""); let picked=null;
  bank.className="cloze-term-bank"; bank.setAttribute("aria-label","Wortspeicher");
  sentence.className="cloze-sentence";
  const render=()=>{
    bank.replaceChildren(...terms.filter(term=>!choices.includes(term)).map(term=>{
      const card=document.createElement("button");card.type="button";card.className="cloze-token";card.textContent=term;
      card.setAttribute("aria-pressed",String(picked?.value===term&&picked.from===-1));
      enableTokenDrag(card,{dropSelector:`#${targetId} .cloze-gap`,bankSelector:`#${targetId} .cloze-term-bank`,getLabel:()=>term,onDrop:(gap)=>{if(gap)place(term,-1,Number(gap.dataset.index));}});
      card.addEventListener("click",()=>{if(wasDragged(card))return;picked=picked?.value===term?null:{value:term,from:-1};render();if(picked)sentence.querySelector(".cloze-gap:not(.is-filled),.cloze-gap")?.focus();progress.save();});return card;
    }));
    sentence.replaceChildren();
    parts.forEach((part,index)=>{sentence.append(document.createTextNode(part));if(index>=terms.length)return;const value=choices[index],gap=document.createElement("button");gap.type="button";gap.className="cloze-gap";gap.dataset.index=String(index);gap.textContent=value||" ";gap.classList.toggle("is-filled",Boolean(value));gap.classList.toggle("is-attached",/^[.,:;!?]/.test(parts[index+1]||""));gap.setAttribute("aria-label",`Lücke ${index+1}: ${value||"leer"}`);gap.setAttribute("aria-pressed",String(picked?.from===index));
      enableTokenDrag(gap,{dropSelector:`#${targetId} .cloze-gap`,bankSelector:`#${targetId} .cloze-term-bank`,getLabel:()=>choices[index],onDrop:(drop,onBank)=>{if(drop&&Number(drop.dataset.index)!==index)place(value,index,Number(drop.dataset.index));else if(onBank)place(value,index,-1);}});
      gap.addEventListener("click",()=>{if(wasDragged(gap))return;if(picked&&picked.from!==index){place(picked.value,picked.from,index);sentence.querySelector(`[data-index="${index}"]`)?.focus();}else if(picked&&picked.from===index)place(value,index,-1);else if(value){picked={value,from:index};render();sentence.querySelector(`[data-index="${index}"]`)?.focus();}});sentence.append(gap);});
  };
  function place(value,from,index){if(from>=0)choices[from]="";if(index>=0){const old=choices[index];choices[index]=value;if(from>=0&&old)choices[from]=old;}picked=null;feedback.hidden=true;feedback.textContent="";render();progress.save();}
  target.append(bank,sentence);render();
  const check=()=>{const filled=choices.filter(Boolean).length;if(!filled){feedback.textContent="Setze zuerst Wortkarten in die Lücken.";feedback.className="physics-feedback error";feedback.hidden=false;return;}const count=choices.filter((value,index)=>value===expected[index]).length;if(count===terms.length){feedback.textContent=success;feedback.className="physics-feedback success";}else if(count){feedback.textContent=partial;feedback.className="physics-feedback partial";}else{feedback.textContent=wrong;feedback.className="physics-feedback error";}feedback.hidden=false;};
  $(checkId).addEventListener("click",check);
  progress.registerPart(targetId,()=>choices,values=>{if(!Array.isArray(values)||values.length!==choices.length)return;if(values.some(value=>typeof value!=="string"||(value&&!terms.includes(value)))||new Set(values.filter(Boolean)).size!==values.filter(Boolean).length)return;values.forEach((value,index)=>choices[index]=value);render();});
}

function setupQuiz(progress){
  const form=$("quiz-form"), global=$("quiz-feedback");let checked=[false,false];
  const checks=window.addQuizQuestionChecks({questions:[
    {number:1,fieldset:form.querySelectorAll("fieldset")[0],solution:["a","c"],feedback:$("question-1-feedback"),success:"Korrekt. In der Reihenschaltung bleibt die Stromstärke gleich; die Teilspannungen ergeben zusammen die Batteriespannung.",hint:"Vergleiche Stromstärke und Teilspannungen im Reihenschaltplan."},
    {number:2,fieldset:form.querySelectorAll("fieldset")[1],solution:["a","c"],feedback:$("question-2-feedback"),success:"Korrekt. In der Parallelschaltung addieren sich die Teilstromstärken; die Zweigspannungen sind gleich groß.",hint:"Vergleiche Hauptstrom und Zweige im Parallelschaltplan."}
  ],buttonClass:"physics-primary-button",feedbackClass:"feedback",onCheck:(question,result)=>{const index=question.number-1;checked[index]=result==="correct";if(result==="empty")question.feedback.textContent+=` ${question.hint}`;global.textContent="";global.className="feedback";if(checked.every(Boolean))allCorrect();},onAllCorrect:allCorrect});
  function allCorrect(){global.textContent="Richtig. Beide Quizfragen sind vollständig gelöst.";global.className="feedback success";}
  form.addEventListener("change",()=>{checked=[false,false];global.textContent="";global.className="feedback";});
  $("quiz-submit").addEventListener("click",()=>{const count=checks.checkAll();if(count===2)allCorrect();else if(count===1){global.textContent="Teilweise korrekt. Eine Quizfrage stimmt bereits; prüfe die andere noch einmal.";global.className="feedback partial";}else{global.textContent="Noch nicht korrekt. Prüfe beide Quizfragen erneut.";global.className="feedback error";}});
}

if(typeof document!=="undefined")init();
