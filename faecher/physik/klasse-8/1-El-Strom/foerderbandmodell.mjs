import {
  i as Scene, j as WebGLRenderer, G as Group, M as Mesh,
  P as PerspectiveCamera, V as Vector3, q as BoxGeometry,
  Y as SphereGeometry, v as CylinderGeometry,
  E as MeshStandardMaterial, x as DirectionalLight, w as AmbientLight,
} from "../../../../include/assets/three-B4gibKjH.js";
import { createPhysicsTaskProgress } from "../../klasse-11/1-Kreisbewegungen/components/physics-task-progress.mjs";

const BALLS_PER_CHAIN = 24;
const PASSAGES_PER_AMPERE_SECOND = 0.72;
const LOWER = 0.53;
const HEIGHT_PER_VOLT = 0.22;
const TAU = Math.PI * 2;

export function deriveModel(mode, voltage, current) {
  if (!["simple", "series", "parallel"].includes(mode)) throw new RangeError("mode");
  if (!Number.isInteger(voltage) || voltage < 2 || voltage > 12) throw new RangeError("voltage");
  const tenths = Math.round(current * 10);
  if (!Number.isFinite(current) || Math.abs(current * 10 - tenths) > 1e-8 || tenths < 2 || tenths > 20) throw new RangeError("current");
  const top = LOWER + voltage * HEIGHT_PER_VOLT;
  const middle = (LOWER + top) / 2;
  const parallel = mode === "parallel";
  const series = mode === "series";
  return {
    mode, voltage, current: tenths / 10, lower: LOWER, top, middle,
    branchVoltages: series ? [voltage / 2, voltage / 2] : parallel ? [voltage, voltage] : [voltage],
    branchCurrents: parallel ? [tenths / 20, tenths / 20] : series ? [tenths / 10, tenths / 10] : [tenths / 10],
    chains: parallel ? 2 : 1,
    chainCurrents: parallel ? [tenths / 20, tenths / 20] : [tenths / 10],
    ballsPerChain: BALLS_PER_CHAIN,
  };
}

// One chain keeps its ball count as its height changes. The circuit's marked
// cross-section therefore sees ballsPerChain * speed / length passages/s.
export function chainSpeed(pathLength, chainCurrent, ballCount = BALLS_PER_CHAIN) {
  return pathLength * chainCurrent * PASSAGES_PER_AMPERE_SECOND / ballCount;
}

function controls() {
  return {
    mode: document.getElementById("circuit-mode"),
    voltage: document.getElementById("voltage"),
    current: document.getElementById("current"),
    voltageOutput: document.getElementById("voltage-output"),
    currentOutput: document.getElementById("current-output"),
    play: document.getElementById("animation-toggle"),
    reset: document.getElementById("camera-reset"),
    status: document.getElementById("animation-status"),
    viewport: document.getElementById("simulation-viewport"),
    canvas: document.getElementById("simulation-canvas"),
    labels: document.getElementById("scene-labels"),
    error: document.getElementById("webgl-error"),
    readouts: document.getElementById("readouts"),
    equations: document.getElementById("equations"),
    equationsToggle: document.getElementById("equations-toggle"),
  };
}

const fmtVoltage = value => `${String(value).replace(".", ",")} V`;
const fmtCurrent = value => `${value.toFixed(value % 0.1 < 1e-8 || 0.1 - value % 0.1 < 1e-8 ? 1 : 2).replace(".", ",")} A`;
const sub = index => `<sub>${index}</sub>`;

function updateText(ui, model) {
  ui.voltageOutput.textContent = fmtVoltage(model.voltage);
  ui.currentOutput.textContent = fmtCurrent(model.current);
  const values = [`U = ${fmtVoltage(model.voltage)}`, `I = ${fmtCurrent(model.current)}`];
  model.branchVoltages.forEach((value, index) => values.push(`U${sub(index + 1)} = ${fmtVoltage(value)}`));
  model.branchCurrents.forEach((value, index) => values.push(`I${sub(index + 1)} = ${fmtCurrent(value)}`));
  ui.readouts.innerHTML = values.map(value => `<span class="foerderband-readout">${value}</span>`).join("");
  if (model.mode === "simple") {
    ui.equations.innerHTML = `<p>U = U${sub(1)} = ${fmtVoltage(model.voltage)}</p><p>I = I${sub(1)} = ${fmtCurrent(model.current)}</p>`;
  } else if (model.mode === "series") {
    ui.equations.innerHTML = `<p>U = U${sub(1)} + U${sub(2)} = ${fmtVoltage(model.branchVoltages[0])} + ${fmtVoltage(model.branchVoltages[1])} = ${fmtVoltage(model.voltage)}</p><p>U${sub(1)} = U${sub(2)} = ${fmtVoltage(model.branchVoltages[0])}</p><p>I = I${sub(1)} = I${sub(2)} = ${fmtCurrent(model.current)}</p>`;
  } else {
    ui.equations.innerHTML = `<p>U = U${sub(1)} = U${sub(2)} = ${fmtVoltage(model.voltage)}</p><p>I = I${sub(1)} + I${sub(2)} = ${fmtCurrent(model.branchCurrents[0])} + ${fmtCurrent(model.branchCurrents[1])} = ${fmtCurrent(model.current)}</p><p>I${sub(1)} = I${sub(2)} = ${fmtCurrent(model.branchCurrents[0])}</p>`;
  }
}

function point(x, y, z) { return new Vector3(x, y, z); }

function pathControls(model, lane) {
  const { lower: low, top, middle } = model;
  if (model.mode === "simple") return [
    point(-4.35,low,-.9),point(-3.55,low,-.9),point(-2.1,top,-.9),
    point(.2,top,-.9),point(3.35,top,-.9),point(4.1,top,-.62),
    point(4.33,middle,-.06),point(4.3,low,.78),point(3.65,low,1.08),
    point(-3.8,low,1.08),point(-4.6,low,.62),point(-4.35,low,-.9),
  ];
  if (model.mode === "series") return [
    point(-4.35,low,-.9),point(-3.55,low,-.9),point(-2.1,top,-.9),
    point(.15,top,-.9),point(.95,top,-.75),point(1.45,middle,-.35),
    point(2.1,middle,-.12),point(3.3,middle,-.12),point(3.95,middle,.08),
    point(4.35,low,.78),point(3.65,low,1.12),point(-3.8,low,1.12),
    point(-4.6,low,.62),point(-4.35,low,-.9),
  ];
  if (lane === 0) return [
    point(-4.35,low,-1.22),point(-3.55,low,-1.22),point(-2.1,top,-1.22),
    point(-.1,top,-1.45),point(1.6,top,-1.8),point(2.4,top,-1.7),
    point(2.78,middle,-1.15),point(2.8,low,-.45),point(2.2,low,-.12),
    point(-3.8,low,-.12),point(-4.6,low,-.44),point(-4.35,low,-1.22),
  ];
  return [
    point(-4.35,low,.02),point(-3.55,low,.02),point(-2.1,top,.02),
    point(.1,top,.28),point(3.35,top,.35),point(4.1,top,.55),
    point(4.38,middle,1.05),point(4.35,low,1.9),point(3.7,low,2.25),
    point(-3.8,low,2.25),point(-4.6,low,1.7),point(-4.35,low,.02),
  ];
}

function catmull(a,b,c,d,t) {
  const t2=t*t,t3=t2*t;
  return point(...["x","y","z"].map(k => .5*((2*b[k])+(-a[k]+c[k])*t+(2*a[k]-5*b[k]+4*c[k]-d[k])*t2+(-a[k]+3*b[k]-3*c[k]+d[k])*t3)));
}

export function sampledClosedPath(controlPoints, subdivisions = 24) {
  const count = controlPoints.length - 1;
  const points = [];
  for (let i=0;i<count;i++) for(let j=0;j<subdivisions;j++) {
    const at = index => controlPoints[(index+count)%count];
    points.push(catmull(at(i-1),at(i),at(i+1),at(i+2),j/subdivisions));
  }
  points.push(points[0].clone());
  const distances=[0];
  for(let i=1;i<points.length;i++) distances.push(distances[i-1]+points[i].distanceTo(points[i-1]));
  return {points,distances,length:distances.at(-1)};
}

export function positionAtDistance(path, distance) {
  const target=((distance%path.length)+path.length)%path.length;
  let lo=0,hi=path.distances.length-1;
  while(hi-lo>1){const mid=(lo+hi)>>1;if(path.distances[mid]<=target)lo=mid;else hi=mid;}
  const start=path.distances[lo], end=path.distances[hi];
  return path.points[lo].clone().lerp(path.points[hi],(target-start)/(end-start||1));
}

function material(color, metalness=0, roughness=.65) { return new MeshStandardMaterial({color,metalness,roughness}); }

function addBox(group, size, position, mat) {
  const mesh=new Mesh(new BoxGeometry(...size),mat);
  mesh.position.copy(position);group.add(mesh);return mesh;
}
function addCylinder(group,a,b,radius,mat) {
  const delta=b.clone().sub(a),mesh=new Mesh(new CylinderGeometry(radius,radius,delta.length(),10),mat);
  mesh.position.copy(a).add(b).multiplyScalar(.5);
  mesh.quaternion.setFromUnitVectors(point(0,1,0),delta.normalize());group.add(mesh);return mesh;
}
function addTrack(group,path,mats) {
  // A continuous raised channel plus two guard rails follows the same closed
  // centerline as the balls. Sampling gives smooth joins at slopes and curves.
  for(let i=0;i<path.points.length-1;i+=2){
    const a=path.points[i],b=path.points[Math.min(i+2,path.points.length-1)];
    addCylinder(group,a.clone().add(point(0,-.12,0)),b.clone().add(point(0,-.12,0)),.19,mats.track);
    for(const offset of [-.19,.19]) {
      addCylinder(group,a.clone().add(point(0,-.01,offset)),b.clone().add(point(0,-.01,offset)),.026,mats.rail);
    }
  }
}

function createGate(group,position,mats) {
  const stand=addCylinder(group,point(position.x,.13,position.z),point(position.x,position.y+.55,position.z),.065,mats.steel);
  const rotor=new Group();rotor.position.copy(position).add(point(0,.32,0));group.add(rotor);
  addCylinder(rotor,point(0,-.28,0),point(0,.28,0),.14,mats.steel);
  for(let i=0;i<4;i++){
    const arm=addBox(rotor,[1.05,.13,.16],point(0,0,0),mats.gold);
    arm.rotation.y=i*Math.PI/4;
  }
  addBox(group,[.48,.14,.28],position.clone().add(point(0,-.18,.25)),mats.dark);
  return rotor;
}

function createBracket(group,x,z,top,bottom,mat) {
  const a=point(x,bottom,z),b=point(x,top,z);
  addCylinder(group,a,b,.025,mat);
  for(const y of [bottom,top]) addCylinder(group,point(x-.19,y,z),point(x+.19,y,z),.025,mat);
}

function createCrossSection(group,position,mat,width=.55) {
  addCylinder(group,point(position.x,position.y+.17,position.z-width/2),point(position.x,position.y+.17,position.z+width/2),.055,mat);
  addCylinder(group,point(position.x,position.y-.05,position.z-width/2),point(position.x,position.y+.23,position.z-width/2),.035,mat);
  addCylinder(group,point(position.x,position.y-.05,position.z+width/2),point(position.x,position.y+.23,position.z+width/2),.035,mat);
}

function buildScene(model) {
  const group=new Group(), labels=[],chains=[],gates=[];
  const mats={
    base:material(0xe4b980), edge:material(0x9c744e), track:material(0x9aa5ad,.45),
    rail:material(0xf5f8f9,.48), steel:material(0x617482,.7), dark:material(0x34495b,.55),
    gold:material(0xd78c29,.35), blue:material(0x1684c8,.25,.35),
    coral:material(0xf16b51,.25,.35), linkBlue:material(0x064979,.3),
    linkCoral:material(0xa83127,.3), marker:material(0x17324d),
    voltage:material(0xb36a23), belt:material(0x3c5968,.35), tread:material(0x889ca5,.45),
  };
  addBox(group,[10.3,.24,4.85],point(0,-.11,.2),mats.base);
  addBox(group,[10.3,.13,4.85],point(0,-.27,.2),mats.edge);
  const beltLanes=model.chains===2?[-1.22,.02]:[-.9];
  const beltA=point(-3.55,model.lower-.14,-.6),beltB=point(-2.1,model.top-.14,-.6);
  addCylinder(group,beltA,beltB,model.chains===2?.76:.48,mats.belt);
  const treads=[];
  for(let i=0;i<=12;i++){
    const p=beltA.clone().lerp(beltB,i/12);
    const tread=addBox(group,[model.chains===2?1.5:.96,.045,.095],p,mats.tread);
    tread.rotation.y=Math.PI/2;treads.push(tread);
  }
  for(const at of [beltA,beltB]) addCylinder(group,point(at.x,at.y,at.z-.72),point(at.x,at.y,at.z+.72),.13,mats.steel);
  addCylinder(group,point(-2.12,.08,-.6),point(-2.12,model.top-.16,-.6),.06,mats.steel);
  beltLanes.forEach((z,lane)=>{
    const path=sampledClosedPath(pathControls(model,lane));
    addTrack(group,path,mats);
    const ballGeometry=new SphereGeometry(.16,18,12),balls=[],links=[];
    for(let i=0;i<model.ballsPerChain;i++) {
      const ball=new Mesh(ballGeometry,lane===0?mats.blue:mats.coral);
      ball.position.copy(positionAtDistance(path,i*path.length/model.ballsPerChain)).add(point(0,.14,0));
      group.add(ball);balls.push(ball);
      const link=new Mesh(new CylinderGeometry(.045,.045,1,8),lane===0?mats.linkBlue:mats.linkCoral);
      group.add(link);links.push(link);
    }
    chains.push({path,balls,links,current:model.chainCurrents[lane],phase:0});
  });
  const low=model.lower,top=model.top,mid=model.middle;
  if(model.mode==="simple"){
    gates.push({mesh:createGate(group,point(4.3,mid,-.06),mats),current:model.current});
    createBracket(group,5.02,-.24,top,low,mats.voltage);
    labels.push({html:`U${sub(1)}`,at:point(5.07,mid,-.24),kind:"voltage"});
    createCrossSection(group,point(-3.77,low,1.08),mats.marker);
    labels.push({html:"Gesamtstrom I",at:point(-3.77,low+.5,1.08)});
  } else if(model.mode==="series"){
    gates.push({mesh:createGate(group,point(1.42,(top+mid)/2,-.33),mats),current:model.current});
    gates.push({mesh:createGate(group,point(4.33,(mid+low)/2,.42),mats),current:model.current});
    createBracket(group,1.84,-1.28,top,mid,mats.voltage);
    createBracket(group,5.04,.28,mid,low,mats.voltage);
    labels.push({html:`U${sub(1)}`,at:point(1.84,(top+mid)/2,-1.28),kind:"voltage"});
    labels.push({html:`U${sub(2)}`,at:point(5.04,(mid+low)/2,.28),kind:"voltage"});
    createCrossSection(group,point(-.4,top,-.9),mats.marker);
    createCrossSection(group,point(2.8,mid,-.12),mats.marker);
    labels.push({html:`Strom I${sub(1)}`,at:point(-.4,top+.48,-.9)});
    labels.push({html:`Strom I${sub(2)}`,at:point(2.8,mid+.48,-.12)});
  } else {
    gates.push({mesh:createGate(group,point(2.78,mid,-1.15),mats),current:model.branchCurrents[0]});
    gates.push({mesh:createGate(group,point(4.38,mid,1.05),mats),current:model.branchCurrents[1]});
    createBracket(group,3.26,-2.17,top,low,mats.voltage);
    createBracket(group,5.02,1.67,top,low,mats.voltage);
    labels.push({html:`U${sub(1)}`,at:point(3.26,mid,-2.17),kind:"voltage"});
    labels.push({html:`U${sub(2)}`,at:point(5.02,mid,1.67),kind:"voltage"});
    createCrossSection(group,point(-3.78,low,-.6),mats.marker,1.85);
    createCrossSection(group,point(.45,top,-1.55),mats.marker);
    createCrossSection(group,point(1.8,top,.28),mats.marker);
    labels.push({html:"Gesamtstrom I",at:point(-3.78,low+.51,-.6)});
    labels.push({html:`Zweig 1: I${sub(1)}`,at:point(.45,top+.48,-1.55)});
    labels.push({html:`Zweig 2: I${sub(2)}`,at:point(1.8,top+.48,.28)});
  }
  // Supports carry the high and intermediate runs, visibly connected to the base.
  const supports=model.mode==="parallel"?[[.25,top,-1.4],[2.0,top,.3],[3.6,top,.35]]: [[-.25,top,-.9],[3.1,model.mode==="series"?mid:top,-.6]];
  for(const [x,y,z] of supports) addCylinder(group,point(x,.12,z),point(x,y-.16,z),.055,mats.steel);
  return {group,chains,gates,labels,belt:{a:beltA,b:beltB,treads,phase:0}};
}

function disposeGroup(group) {
  const geometries=new Set(),materials=new Set();
  group.traverse(object=>{if(object.geometry)geometries.add(object.geometry);if(object.material)materials.add(object.material);});
  geometries.forEach(geometry=>geometry.dispose());materials.forEach(mat=>mat.dispose());
}

function updateChain(chain) {
  const {path,balls,links,phase}=chain;
  balls.forEach((ball,index)=>ball.position.copy(positionAtDistance(path,phase+index*path.length/balls.length)).add(point(0,.14,0)));
  links.forEach((link,index)=>{
    const a=balls[index].position,b=balls[(index+1)%balls.length].position;
    const direction=b.clone().sub(a);
    link.position.copy(a).add(b).multiplyScalar(.5);
    link.quaternion.setFromUnitVectors(point(0,1,0),direction.clone().normalize());
    link.scale.y=direction.length();
  });
}

function init() {
  const ui=controls();
  const progress=createPhysicsTaskProgress("aufgabe1","physik8-foerderbandmodell");
  let renderer,scene,camera,model,visual,playing=false,lastTime=0;
  let yaw=.55,pitch=.53,radius=11.7;
  const target=point(0,1.3,.1);
  const saveState=()=>progress.save();
  const setRunning=value=>{
    playing=value;lastTime=0;
    ui.play.textContent=value?"Animation stoppen":"Animation starten";
    ui.status.textContent=value?"Animation läuft":"Animation pausiert";
  };
  const updateCamera=()=>{
    pitch=Math.max(.25,Math.min(1.16,pitch));radius=Math.max(9.6,Math.min(28,radius));
    camera.position.set(target.x+radius*Math.cos(pitch)*Math.sin(yaw),target.y+radius*Math.sin(pitch),target.z+radius*Math.cos(pitch)*Math.cos(yaw));
    camera.lookAt(target);
  };
  const resetCamera=()=>{yaw=.55;pitch=.53;radius=11.7;updateCamera();};
  const renderLabels=()=>{
    if(!visual)return;
    const rect=ui.canvas.getBoundingClientRect();
    visual.labels.forEach((label,index)=>{
      const projected=label.at.clone().project(camera),el=ui.labels.children[index];
      el.style.left=`${(projected.x+1)*rect.width/2}px`;
      let top=(1-projected.y)*rect.height/2;
      if(rect.width<650 && model.mode==="parallel"){
        if(index===3)top-=20;
        if(index===4)top+=20;
      }
      el.style.top=`${top}px`;
      el.hidden=projected.z>1 || Math.abs(projected.x)>1.12 || Math.abs(projected.y)>1.12;
    });
  };
  const resize=()=>{
    if(!renderer)return;
    const width=ui.viewport.clientWidth,height=ui.viewport.clientHeight;
    renderer.setSize(width,height,false);camera.aspect=width/height;
    camera.fov=width<650?57:width<900?50:42;
    camera.updateProjectionMatrix();updateCamera();renderLabels();renderer.render(scene,camera);
  };
  const rebuild=()=>{
    setRunning(false);
    const u=Number(ui.voltage.value),i=Number(ui.current.value);
    if(!Number.isInteger(u)||u<2||u>12)ui.voltage.value="6";
    if(!Number.isFinite(i)||i<.2||i>2||Math.abs(i*10-Math.round(i*10))>1e-8)ui.current.value="1";
    model=deriveModel(ui.mode.value,Number(ui.voltage.value),Number(ui.current.value));
    updateText(ui,model);
    if(visual){scene.remove(visual.group);disposeGroup(visual.group);}
    visual=buildScene(model);scene.add(visual.group);
    visual.chains.forEach(updateChain);
    ui.labels.innerHTML=visual.labels.map(label=>`<span class="foerderband-scene-label" data-kind="${label.kind||"current"}">${label.html}</span>`).join("");
    target.y=-.1+model.voltage*.04;
    resize();
  };
  try {
    renderer=new WebGLRenderer({canvas:ui.canvas,antialias:true,alpha:false});
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
    renderer.setClearColor(0xe5f1f8);
    scene=new Scene();camera=new PerspectiveCamera(46,1,.1,100);
    scene.add(new AmbientLight(0xffffff,1.6));
    const light=new DirectionalLight(0xffffff,2.5);light.position.set(-3,9,8);scene.add(light);
    const fill=new DirectionalLight(0xcce4ff,1.2);fill.position.set(5,5,-6);scene.add(fill);
    updateCamera();
  } catch (error) {
    ui.error.hidden=false;ui.canvas.hidden=true;console.error("WebGL",error);
    return;
  }
  ui.mode.addEventListener("change",()=>{rebuild();saveState();});
  for(const input of [ui.voltage,ui.current]) input.addEventListener("input",()=>{rebuild();saveState();});
  ui.play.addEventListener("click",()=>setRunning(!playing));
  ui.reset.addEventListener("click",resetCamera);
  ui.equationsToggle.addEventListener("click",()=>{
    const show=ui.equations.hidden;ui.equations.hidden=!show;
    ui.equationsToggle.textContent=show?"Gleichungen ausblenden":"Gleichungen anzeigen";
    ui.equationsToggle.setAttribute("aria-expanded",String(show));saveState();
  });
  progress.registerPart("equations",()=>!ui.equations.hidden,value=>{
    if(typeof value!=="boolean")return;
    ui.equations.hidden=!value;
    ui.equationsToggle.textContent=value?"Gleichungen ausblenden":"Gleichungen anzeigen";
    ui.equationsToggle.setAttribute("aria-expanded",String(value));
  });
  progress.restore();
  rebuild();setRunning(false);
  const activePointers=new Map();let lastPinch=0;
  ui.canvas.addEventListener("pointerdown",event=>{
    ui.canvas.setPointerCapture(event.pointerId);activePointers.set(event.pointerId,{x:event.clientX,y:event.clientY});lastPinch=0;
  });
  ui.canvas.addEventListener("pointermove",event=>{
    if(!activePointers.has(event.pointerId))return;
    const old=activePointers.get(event.pointerId);
    activePointers.set(event.pointerId,{x:event.clientX,y:event.clientY});
    if(activePointers.size===1){yaw+=(event.clientX-old.x)*.006;pitch+=(old.y-event.clientY)*.006;updateCamera();}
    else if(activePointers.size===2){
      const [a,b]=[...activePointers.values()],distance=Math.hypot(a.x-b.x,a.y-b.y);
      if(lastPinch)radius*=lastPinch/distance;lastPinch=distance;updateCamera();
    }
  });
  const endPointer=event=>{activePointers.delete(event.pointerId);lastPinch=0;};
  ui.canvas.addEventListener("pointerup",endPointer);ui.canvas.addEventListener("pointercancel",endPointer);
  ui.canvas.addEventListener("wheel",event=>{event.preventDefault();radius*=Math.exp(event.deltaY*.001);updateCamera();},{passive:false});
  window.addEventListener("resize",resize);
  const frame=time=>{
    const dt=lastTime?Math.min((time-lastTime)/1000,.05):0;lastTime=time;
    if(playing && visual){
      for(const chain of visual.chains){
        chain.phase=(chain.phase+chainSpeed(chain.path.length,chain.current)*dt)%chain.path.length;
        updateChain(chain);
      }
      for(const gate of visual.gates)gate.mesh.rotation.y+=gate.current*dt*1.65;
      const belt=visual.belt;
      belt.phase=(belt.phase+dt*model.current*.18)%1;
      belt.treads.forEach((tread,index)=>tread.position.copy(belt.a).lerp(belt.b,(index/13+belt.phase)%1));
    }
    renderLabels();renderer.render(scene,camera);requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

if(typeof document!=="undefined")init();
