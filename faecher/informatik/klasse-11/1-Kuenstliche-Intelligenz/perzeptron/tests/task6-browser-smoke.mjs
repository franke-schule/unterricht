import fs from 'node:fs';
import path from 'node:path';

const pageUrl = process.argv[2] ?? 'http://127.0.0.1:8766/faecher/informatik/klasse-11/1-Kuenstliche-Intelligenz/aufgabe6.html';
const debuggingUrl = process.argv[3] ?? 'http://127.0.0.1:9223';
const solution = fs.readFileSync(path.join(process.cwd(),'faecher/informatik/klasse-11/1-Kuenstliche-Intelligenz/material-perzeptron/Perzeptron_Java_BlueJ_Loesung/Perzeptron.java'),'utf8');
const calculationProgram = `
Perzeptron minus = new Perzeptron(1, 1, 1, 1);
System.out.println("CASE_MINUS");
minus.trainieren(new Datenpunkt(4, 1, 0));
Perzeptron plus = new Perzeptron(0, 0, 1, 0.5);
System.out.println("CASE_PLUS");
plus.trainieren(new Datenpunkt(2, 2, 1));
Perzeptron zero = new Perzeptron(1, 1, 1, 0.5);
System.out.println("CASE_ZERO");
zero.trainieren(new Datenpunkt(2, 2, 1));
Perzeptron decimal = new Perzeptron(0.25, 0.5, 0.6, 1);
System.out.println("CASE_DECIMAL " + decimal.punktKlassifizieren(1, 1));
Perzeptron equal = new Perzeptron(0.25, 0.5, 0.75, 1);
System.out.println("CASE_EQUAL " + equal.punktKlassifizieren(1, 1));
Perzeptron epoch = new Perzeptron(1, 1, 1, 1);
epoch.trainieren(new Datenpunkt(2, 2, 1));
epoch.trainieren(new Datenpunkt(4, 1, 0));
epoch.trainieren(new Datenpunkt(6, 2, 0));
epoch.trainieren(new Datenpunkt(0, 4, 1));
System.out.println("CASE_EPOCH");
epoch.trenngeradeAusgeben();
`;
const target = await fetch(debuggingUrl + '/json/new?' + encodeURIComponent(pageUrl), {method:'PUT'}).then(response => response.json());
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise(resolve => socket.addEventListener('open',resolve,{once:true}));
let nextId = 1;
const pending = new Map();
socket.addEventListener('message',event => {
  const message = JSON.parse(event.data);
  if (!message.id || !pending.has(message.id)) return;
  const {resolve,reject} = pending.get(message.id); pending.delete(message.id);
  if (message.error) reject(new Error(message.error.message)); else resolve(message.result);
});
function send(method,params={}) { const id=nextId++; return new Promise((resolve,reject) => { pending.set(id,{resolve,reject}); socket.send(JSON.stringify({id,method,params})); }); }
async function evaluate(expression) { const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true}); if(result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails)); return result.result.value; }
function assert(condition,message) { if(!condition) throw new Error(message); }
async function until(expression, timeoutMs=30000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await evaluate(expression)) return;
    await new Promise(resolve => setTimeout(resolve,400));
  }
  throw new Error('Zeitüberschreitung bei Browserprüfung: ' + expression);
}
function ideExpression(variant,id,body) {
  return `(() => {const ide=document.querySelector('#frame-${variant}').contentWindow.online_ide_access.getIDE('${id}').ide;${body}})()`;
}
await send('Page.enable'); await send('Runtime.enable');
await send('Page.navigate',{url:pageUrl});
await new Promise(resolve => setTimeout(resolve,4000));
await evaluate("localStorage.removeItem('informatik11-ki-aufgabe6-v1')");
await send('Page.reload',{ignoreCache:true});
await new Promise(resolve => setTimeout(resolve,3500));
assert(await evaluate("!document.querySelector('#variant-choice').hidden && document.querySelector('#work-area').hidden"),'Auswahl fehlt beim ersten Öffnen.');
await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
const mobile = await evaluate("({viewport:innerWidth,page:document.documentElement.scrollWidth,heading:document.querySelector('h1').getBoundingClientRect().width})");
assert(mobile.page <= mobile.viewport,'Smartphone-Horizontalüberlauf: ' + JSON.stringify(mobile));
await send('Emulation.clearDeviceMetricsOverride');
for (const [variant,id] of [['einfach','Java11Aufgabe6Einfach'],['schwer','Java11Aufgabe6Schwer']]) {
  await evaluate(`document.querySelector('[data-choose=${variant}]').click()`);
  const files = await evaluate(`(() => {const access=document.querySelector('#frame-${variant}').contentWindow.online_ide_access; return access.getIDE('${id}').getFiles().map(file=>file.getName());})()`);
  assert(['Anleitung.md','Hauptprogramm.java','Perzeptron.java','Datenpunkt.java'].every(name => files.includes(name)),variant + ': IDE-Dateien fehlen.');
  assert(await evaluate(`!document.querySelector('#ide-${variant}').hidden`),variant + ': IDE ist nicht sichtbar.');
  await evaluate(ideExpression(variant,id,`for(const name of ['Hauptprogramm.java','Perzeptron.java','Datenpunkt.java']) { const source=document.querySelector('#frame-${variant}').contentDocument.querySelector('script[title="'+name+'"]').textContent.trim();ide.currentWorkspace.files.find(file=>file.name===name).getMonacoModel().setValue(source); }`));
  await new Promise(resolve => setTimeout(resolve,2200));
  await send('Page.reload',{ignoreCache:true});
  await new Promise(resolve => setTimeout(resolve,3500));
  await until(`!!document.querySelector('#frame-${variant}').contentWindow?.online_ide_access?.getIDE?.('${id}')`);
  await evaluate(ideExpression(variant,id,"ide.interpreter.setStepsPerSecond(1000);const play=[...document.querySelector('#frame-"+variant+"').contentDocument.querySelectorAll('[title=\"Starte das in dieser Datei enthaltene Hauptprogramm\"]')].find(button=>button.getAttribute('style')===null);if(!play)throw new Error('Play in Dateiliste fehlt');const file=ide.currentWorkspace.files.find(item=>item.name==='Hauptprogramm.java');ide.onStartFileClicked(file);"));
  await until(ideExpression(variant,id,"return ide.interpreter.printManager.$outputDiv[0].textContent.includes('Nachher:');"));
  const output = await evaluate(ideExpression(variant,id,"return ide.interpreter.printManager.$outputDiv[0].textContent;"));
  assert(output.includes('Vorher: (4|1) ergibt 1') && output.includes('Nachher: (4|1) ergibt 1'),variant + ': vollständige Vorher/Nachher-Ausgabe fehlt: ' + output);
  assert((output.match(/Die Gleichung der Trenngerade lautet aktuell:/g)||[]).length===2,variant + ': Trenngerade fehlt vor oder nach Training.');

  const marker = variant === 'einfach' ? 'TEST_EINFACH' : 'TEST_SCHWER';
  await evaluate(ideExpression(variant,id,`ide.currentWorkspace.files.find(file=>file.name==='Perzeptron.java').getMonacoModel().setValue(${JSON.stringify(solution+'\n// '+marker)});ide.currentWorkspace.files.find(file=>file.name==='Hauptprogramm.java').getMonacoModel().setValue(${JSON.stringify(calculationProgram)});`));
  await new Promise(resolve => setTimeout(resolve,2200));
  await send('Page.reload',{ignoreCache:true});
  await new Promise(resolve => setTimeout(resolve,3500));
  await until(`!!document.querySelector('#frame-${variant}').contentWindow?.online_ide_access?.getIDE?.('${id}')`);
  await evaluate(ideExpression(variant,id,"ide.interpreter.setStepsPerSecond(1000);const file=ide.currentWorkspace.files.find(item=>item.name==='Hauptprogramm.java');ide.onStartFileClicked(file);"));
  await until(ideExpression(variant,id,"return ide.interpreter.printManager.$outputDiv[0].textContent.includes('CASE_EPOCH');"));
  const calculated = await evaluate(ideExpression(variant,id,"return ide.interpreter.printManager.$outputDiv[0].textContent;"));
  assert(/CASE_MINUS[\s\S]*w_1 = -3(?:\.0)?; w_2 = 0(?:\.0)?; theta = 2(?:\.0)?/.test(calculated),variant+': δ = −1 falsch: '+calculated);
  assert(/CASE_PLUS[\s\S]*w_1 = 1(?:\.0)?; w_2 = 1(?:\.0)?; theta = 0\.5/.test(calculated),variant+': δ = 1 oder halbe Lernrate falsch: '+calculated);
  assert(/CASE_ZERO[\s\S]*Keine Anpassung der Gewichte notwendig!/.test(calculated),variant+': δ = 0 falsch: '+calculated);
  assert(calculated.includes('CASE_DECIMAL 1'),variant+': Dezimalsumme falsch: '+calculated);
  assert(calculated.includes('CASE_EQUAL 1'),variant+': Grenzfall a = theta falsch: '+calculated);
  assert(/CASE_EPOCH[\s\S]*-3(?:\.0)?\*x_1 \+ 4(?:\.0)?\*x_2 = 1(?:\.0)?/.test(calculated),variant+': ganze Epoche falsch: '+calculated);
  await evaluate("document.querySelector('#change-variant').click()");
}
for (const variant of ['einfach','schwer']) {
  await evaluate(`document.querySelector('[data-choose=${variant}]').click();document.querySelector('#change-variant').click()`);
}
await new Promise(resolve => setTimeout(resolve,1200));
await send('Page.reload',{ignoreCache:true});
await new Promise(resolve => setTimeout(resolve,3500));
for (const [variant,id,marker] of [['einfach','Java11Aufgabe6Einfach','TEST_EINFACH'],['schwer','Java11Aufgabe6Schwer','TEST_SCHWER']]) {
  const text = await evaluate(ideExpression(variant,id,"return ide.currentWorkspace.files.find(file=>file.name==='Perzeptron.java').getText();"));
  assert(text.includes(marker) && !text.includes(variant==='einfach'?'TEST_SCHWER':'TEST_EINFACH'),variant+': Code-Stand nach Wechsel/Neuladen nicht getrennt erhalten.');
}
console.log('Aufgabe 6: mobile Breite, beide IDE-Starts, alle Rechenfälle und getrennte Code-Stände bestanden.');
socket.close();
