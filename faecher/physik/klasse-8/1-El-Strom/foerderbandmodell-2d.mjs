import { deriveModel, chainSpeed, fmtVoltage, fmtCurrent, readoutHtml, equationsHtml } from "./foerderbandmodell-core.mjs";
import { createPhysicsTaskProgress } from "../../klasse-11/1-Kreisbewegungen/components/physics-task-progress.mjs";

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
    model=deriveModel(ui.mode.value,Number(ui.voltage.value),Number(ui.current.value));updateText();
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
  progress.restore();rebuild();setRunning(false);
  window.addEventListener("resize",()=>{const next=window.matchMedia("(max-width: 650px)").matches;if(next!==compact){compact=next;rebuild();}});
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

if(typeof document!=="undefined")init();
