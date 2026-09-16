const pageUrl = process.argv[2] ?? 'http://127.0.0.1:8765/faecher/informatik/klasse-11/1-Kuenstliche-Intelligenz/aufgabe5.html';
const debuggingUrl = process.argv[3] ?? 'http://127.0.0.1:9222';

class CdpClient {
  constructor(socket) {
    this.socket = socket;
    this.nextId = 1;
    this.pending = new Map();
    this.waiters = new Map();
    this.listeners = new Map();
    socket.addEventListener('message', (event) => this.handleMessage(JSON.parse(event.data)));
  }

  handleMessage(message) {
    if (message.id) {
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      if (message.error) pending.reject(new Error(message.error.message));
      else pending.resolve(message.result);
      return;
    }
    (this.listeners.get(message.method) ?? []).forEach((listener) => listener(message.params));
    const waiters = this.waiters.get(message.method) ?? [];
    this.waiters.delete(message.method);
    waiters.forEach((resolve) => resolve(message.params));
  }

  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify({ id, method, params }));
    });
  }

  waitFor(method, timeoutMs = 10000) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Timeout bei ' + method)), timeoutMs);
      const wrapped = (value) => { clearTimeout(timeout); resolve(value); };
      const waiters = this.waiters.get(method) ?? [];
      waiters.push(wrapped);
      this.waiters.set(method, waiters);
    });
  }

  on(method, listener) {
    const listeners = this.listeners.get(method) ?? [];
    listeners.push(listener);
    this.listeners.set(method, listeners);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function connect(webSocketDebuggerUrl) {
  const socket = new WebSocket(webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener('open', resolve, { once:true });
    socket.addEventListener('error', reject, { once:true });
  });
  return new CdpClient(socket);
}

const target = await fetch(debuggingUrl + '/json/new?' + encodeURIComponent(pageUrl), { method:'PUT' }).then((response) => {
  if (!response.ok) throw new Error('Browserziel konnte nicht erstellt werden: ' + response.status);
  return response.json();
});
const cdp = await connect(target.webSocketDebuggerUrl);
const consoleErrors = [];
cdp.on('Runtime.exceptionThrown', (params) => consoleErrors.push(params.exceptionDetails.text || 'Unbehandelte Ausnahme'));
cdp.on('Log.entryAdded', (params) => {
  if (params.entry.level === 'error') consoleErrors.push(params.entry.text);
});
await cdp.send('Page.enable');
await cdp.send('Runtime.enable');
await cdp.send('Log.enable');

async function evaluate(expression) {
  const response = await cdp.send('Runtime.evaluate', { expression, awaitPromise:true, returnByValue:true });
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.text);
  return response.result.value;
}

async function reload() {
  const loaded = cdp.waitFor('Page.loadEventFired');
  await cdp.send('Page.reload', { ignoreCache:true });
  await loaded;
  await evaluate('new Promise(resolve => setTimeout(resolve, 80))');
}

const loaded = cdp.waitFor('Page.loadEventFired');
await cdp.send('Page.navigate', { url:pageUrl });
await loaded;
await evaluate('new Promise(resolve => setTimeout(resolve, 100))');
await evaluate("localStorage.removeItem('informatik11-perzeptron-aufgabe5-v1')");
await reload();

const initial = await evaluate("(() => ({ tabs:document.querySelectorAll('[role=tab]').length, active:document.querySelector('[role=tab][aria-selected=true]')?.dataset.tab, geometry:Boolean(document.querySelector('.geometry-plot')), points:document.querySelectorAll('.geometry-plot .safe-point, .geometry-plot .danger-point, .geometry-plot .hare-point').length, hareHidden:document.querySelector('#hare-marker')?.hasAttribute('hidden'), hareDisplay:getComputedStyle(document.querySelector('#hare-marker')).display, foxHidden:document.querySelector('#fox-marker')?.hasAttribute('hidden'), foxDisplay:getComputedStyle(document.querySelector('#fox-marker')).display, signal:Boolean(document.querySelector('.signal-flow')), signalNodes:document.querySelectorAll('[data-signal]').length, arrows:document.querySelectorAll('[data-signal-arrow]').length }))()");
assert(initial.tabs === 8, 'Es müssen genau acht Reiter vorhanden sein.');
assert(initial.active === 'discover' && initial.geometry && initial.points >= 5 && initial.hareHidden && initial.hareDisplay === 'none' && initial.foxHidden && initial.foxDisplay === 'none', 'Der erste Reiter oder der verdeckte Startzustand der Tierpunkte fehlt.');
await evaluate("(() => { const next=document.querySelector('#next-geometry-step'); for (let i=0;i<5;i++) next.click(); })()");
const geometrySteps = await evaluate("(() => ({ hareDisplay:getComputedStyle(document.querySelector('#hare-marker')).display, button:document.querySelector('#next-geometry-step').textContent, foxTask:!document.querySelector('#fox-task').hidden }))()");
assert(geometrySteps.hareDisplay !== 'none' && geometrySteps.button === 'Schritte neu starten' && geometrySteps.foxTask, 'Hase, Fuchs-Schritte oder Neustart-Button fehlen: ' + JSON.stringify(geometrySteps));
await evaluate("(() => { const x=document.querySelector('#fox-x'); const y=document.querySelector('#fox-y'); x.value='5'; x.dispatchEvent(new Event('change',{bubbles:true})); y.value='3'; y.dispatchEvent(new Event('change',{bubbles:true})); document.querySelector('[name=fox-class][value=danger]').click(); document.querySelector('#check-fox').click(); })()");
const fox = await evaluate("(() => ({ markerDisplay:getComputedStyle(document.querySelector('#fox-marker')).display, marker:document.querySelector('#fox-label').textContent, x:document.querySelector('#fox-x').value, y:document.querySelector('#fox-y').value, feedback:document.querySelector('#fox-feedback').textContent }))()");
assert(fox.markerDisplay !== 'none' && fox.marker.includes('(5|3)') && fox.x === '5' && fox.y === '3' && fox.feedback.includes('Ausgabe ist 0'), 'Fuchs-Koordinate und -Klasse sind nicht synchron: ' + JSON.stringify(fox));

await evaluate("document.querySelector('[data-tab=structure]').click()");
const structure = await evaluate("(() => ({ active:document.querySelector('[role=tab][aria-selected=true]')?.dataset.tab, visible:!document.querySelector('#structure').hidden, nodes:document.querySelectorAll('[data-signal]').length, arrows:document.querySelectorAll('[data-signal-arrow]').length, steps:document.querySelectorAll('#next-signal-step').length, text:document.querySelector('#signal-step-status').textContent }))()");
assert(structure.active === 'structure' && structure.visible && structure.nodes === 7 && structure.arrows === 6 && structure.steps === 1 && structure.text.includes('Klicke auf Weiter'), 'Der Signalfluss ist nicht vollständig erreichbar.');
const signalGeometry = await evaluate("(() => { const svg=document.querySelector('.signal-arrows'); const matrix=svg?.getScreenCTM(); const distance=(point,rect)=>Math.hypot(Math.max(rect.left-point.x,0,point.x-rect.right),Math.max(rect.top-point.y,0,point.y-rect.bottom)); return [...svg.querySelectorAll('[data-signal-arrow]')].map(line=>{const [from,to]=line.dataset.signalArrow.split(' ');const start=line.getPointAtLength(0);const end=line.getPointAtLength(line.getTotalLength());const startPoint=new DOMPoint(start.x,start.y).matrixTransform(matrix);const endPoint=new DOMPoint(end.x,end.y).matrixTransform(matrix);return {from,to,startDistance:distance(startPoint,document.querySelector('[data-signal=\"'+from+'\"]').getBoundingClientRect()),endDistance:distance(endPoint,document.querySelector('[data-signal=\"'+to+'\"]').getBoundingClientRect())};}); })()");
assert(signalGeometry.length === 6 && signalGeometry.every((connection) => connection.startDistance <= 2 && connection.endDistance <= 2), 'Signalpfeile berühren ihre zugehörigen Knoten nicht: ' + JSON.stringify(signalGeometry));

await evaluate("document.querySelector('[data-tab=discover]').focus()");
await cdp.send('Input.dispatchKeyEvent', { type:'keyDown', key:'End', code:'End' });
await cdp.send('Input.dispatchKeyEvent', { type:'keyUp', key:'End', code:'End' });
assert(await evaluate("document.querySelector('[role=tab][aria-selected=true]').dataset.tab") === 'summary', 'End muss zum letzten Reiter führen.');
await cdp.send('Input.dispatchKeyEvent', { type:'keyDown', key:'Home', code:'Home' });
await cdp.send('Input.dispatchKeyEvent', { type:'keyUp', key:'Home', code:'Home' });
assert(await evaluate("document.querySelector('[role=tab][aria-selected=true]').dataset.tab") === 'discover', 'Home muss zum ersten Reiter führen.');

await evaluate("document.querySelector('[data-tab=structure]').click(); document.querySelector('#next-signal-step').focus()");
for (let index = 0; index < 7; index++) { await cdp.send('Input.dispatchKeyEvent', { type:'keyDown', key:'Enter', code:'Enter', windowsVirtualKeyCode:13, nativeVirtualKeyCode:13, text:'\r' }); await cdp.send('Input.dispatchKeyEvent', { type:'keyUp', key:'Enter', code:'Enter', windowsVirtualKeyCode:13, nativeVirtualKeyCode:13 }); }
const internalStep = await evaluate("(() => ({ disabled:document.querySelector('#next-signal-step').disabled, status:document.querySelector('#signal-step-status').textContent, activeOutput:document.querySelector('[data-signal=output]')?.classList.contains('is-active') }))()");
assert(internalStep.disabled && internalStep.activeOutput && internalStep.status.includes('Schritt 7/7') && internalStep.status.includes('Ausgabe ist 1'), 'Die interne Schrittsteuerung reagiert nicht auf die Tastatur.');

await evaluate("localStorage.setItem('informatik11-perzeptron-aufgabe5-v1', JSON.stringify({active:'simulator',epoch:[true]}))");
await reload();
const oldState = await evaluate("(() => { const state=JSON.parse(localStorage.getItem('informatik11-perzeptron-aufgabe5-v1')); return { active:document.querySelector('[role=tab][aria-selected=true]')?.dataset.tab, firstEpochDisabled:document.querySelector('#epoch-body tr[data-row=\"0\"] input')?.disabled, geometryStep:state.geometryStep, signalStep:state.signalStep }; })()");
assert(oldState.active === 'simulator' && oldState.firstEpochDisabled && oldState.geometryStep === -1 && oldState.signalStep === -1, 'Ein alter Speicherstand wird nicht kompatibel geladen.');
await evaluate("document.querySelector('[data-tab=learn]').click()");
const epochHeader = await evaluate("(() => ({ groups:[...document.querySelectorAll('#epoch-form thead tr:first-child th')].map(th=>th.textContent.trim()), scrollRegion:document.querySelector('#epoch-form .table-scroll[role=region][tabindex=\"0\"]')?.getAttribute('aria-label') }))()");
assert(epochHeader.groups.includes('Trainingsdaten') && epochHeader.groups.includes('Parameter vorher') && epochHeader.groups.includes('Berechnung') && epochHeader.groups.includes('Parameter nachher') && epochHeader.scrollRegion, 'Gruppierte Tabellenkopfzeilen fehlen.');

await evaluate("window.confirm = () => true; document.querySelector('#reset-progress').click()");
await cdp.waitFor('Page.loadEventFired');
await evaluate('new Promise(resolve => setTimeout(resolve, 80))');
const resetState = await evaluate("(() => { const raw = localStorage.getItem('informatik11-perzeptron-aufgabe5-v1'); return raw ? JSON.parse(raw) : null; })()");
assert(resetState?.active === 'discover' && Array.isArray(resetState.epoch) && resetState.epoch.length === 0 && resetState.geometryStep === -1 && resetState.signalStep === -1 && resetState.foxX === null && resetState.foxY === null, 'Zurücksetzen stellt den leeren Startzustand nicht wieder her.');

await cdp.send('Emulation.setEmulatedMedia', { features:[{ name:'prefers-reduced-motion', value:'reduce' }] });
await reload();
const reducedMotion = await evaluate("(() => ({ transition:getComputedStyle(document.querySelector('.signal-node')).transitionDuration, behavior:getComputedStyle(document.documentElement).scrollBehavior }))()");
assert(reducedMotion.transition === '0s' && reducedMotion.behavior === 'auto', 'Reduzierte Bewegung wird nicht respektiert.');

const viewports = [
  { name:'desktop', width:1440, height:900 },
  { name:'tablet', width:1024, height:900 },
  { name:'smartphone', width:390, height:844 },
];
const viewportResults = [];
for (const viewport of viewports) {
  await cdp.send('Emulation.setDeviceMetricsOverride', { width:viewport.width, height:viewport.height, deviceScaleFactor:1, mobile:viewport.name === 'smartphone' });
  await evaluate("document.querySelector('[data-tab=discover]').click()");
  const geometry = await evaluate("(() => ({ innerWidth:window.innerWidth, scrollWidth:document.documentElement.scrollWidth, plotWidth:Math.round(document.querySelector('.geometry-plot').getBoundingClientRect().width), plotHeight:Math.round(document.querySelector('.geometry-plot').getBoundingClientRect().height) }))()");
  assert(geometry.scrollWidth <= geometry.innerWidth, viewport.name + ': Das Tierdiagramm erzeugt seitenweiten horizontalen Überlauf.');
  assert(geometry.plotWidth > 0 && geometry.plotHeight > 0, viewport.name + ': Das Tierdiagramm ist nicht sichtbar.');
  await evaluate("document.querySelector('[data-tab=structure]').click()");
  const signal = await evaluate("(() => ({ innerWidth:window.innerWidth, scrollWidth:document.documentElement.scrollWidth, nodeCount:document.querySelectorAll('[data-signal]').length, visibleNodes:[...document.querySelectorAll('[data-signal]')].filter(node => node.getBoundingClientRect().width > 0 && node.getBoundingClientRect().height > 0).length }))()");
  assert(signal.scrollWidth <= signal.innerWidth, viewport.name + ': Der Signalfluss erzeugt seitenweiten horizontalen Überlauf.');
  assert(signal.nodeCount === 7 && signal.visibleNodes === 7, viewport.name + ': Signalflussknoten fehlen oder sind abgeschnitten.');
  if (viewport.name === 'smartphone') {
    const mobileConnections = await evaluate("(() => { const nodes=[...document.querySelectorAll('[data-signal]')]; return nodes.slice(0,-1).map((node,index)=>{const next=nodes[index+1];const rect=node.getBoundingClientRect();const nextRect=next.getBoundingClientRect();const style=getComputedStyle(node,'::after');const top=parseFloat(style.top);const height=parseFloat(style.height);const left=parseFloat(style.left);return {content:style.content,startOffset:top-rect.height,endOffset:top-rect.height+height,gap:nextRect.top-rect.bottom,centerOffset:Math.abs(left-rect.width/2)};}); })()");
    assert(mobileConnections.length === 6 && mobileConnections.every((connection) => connection.content.includes('↓') && connection.centerOffset <= 2 && connection.startOffset <= 2 && connection.endOffset >= connection.gap - 2), 'Mobile Ersatzpfeile berühren nicht beide verbundenen Knoten: ' + JSON.stringify(mobileConnections));
  }
  viewportResults.push({ viewport, geometry, signal });
}

assert(consoleErrors.length === 0, 'Browser-Konsole meldet Fehler: ' + consoleErrors.join(' | '));
console.log(JSON.stringify({ initial, structure, internalStep, oldState, reducedMotion, viewportResults, consoleErrors }, null, 2));
cdp.socket.close();
