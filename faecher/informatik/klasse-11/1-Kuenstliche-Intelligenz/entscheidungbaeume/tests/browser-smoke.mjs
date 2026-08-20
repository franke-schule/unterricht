import { writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const pageUrl = process.argv[2] ?? "http://127.0.0.1:8765/faecher/informatik/klasse-11/1-Kuenstliche-Intelligenz/aufgabe1.html";
const debuggingUrl = process.argv[3] ?? "http://127.0.0.1:9222";

class CdpClient {
  constructor(socket) {
    this.socket = socket;
    this.nextId = 1;
    this.pending = new Map();
    this.waiters = new Map();
    socket.addEventListener("message", (event) => this.handleMessage(JSON.parse(event.data)));
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
      const timeout = setTimeout(() => reject(new Error(`Timeout bei ${method}`)), timeoutMs);
      const wrapped = (value) => {
        clearTimeout(timeout);
        resolve(value);
      };
      const waiters = this.waiters.get(method) ?? [];
      waiters.push(wrapped);
      this.waiters.set(method, waiters);
    });
  }
}

async function connect(webSocketDebuggerUrl) {
  const socket = new WebSocket(webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  return new CdpClient(socket);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const target = await fetch(`${debuggingUrl}/json/new?${encodeURIComponent(pageUrl)}`, { method: "PUT" }).then((response) => {
  if (!response.ok) throw new Error(`Browserziel konnte nicht erstellt werden: ${response.status}`);
  return response.json();
});
const cdp = await connect(target.webSocketDebuggerUrl);
await cdp.send("Page.enable");
await cdp.send("Runtime.enable");

const loaded = cdp.waitFor("Page.loadEventFired");
await cdp.send("Page.navigate", { url: pageUrl });
await loaded;

async function evaluate(expression) {
  const response = await cdp.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.text);
  return response.result.value;
}

await evaluate("new Promise(resolve => setTimeout(resolve, 250))");
await evaluate(`(() => {
  localStorage.removeItem('informatik11-decision-tree-v1-easy-data-v2');
  localStorage.removeItem('informatik11-decision-tree-v1-advanced');
})()`);
const reloaded = cdp.waitFor("Page.loadEventFired");
await cdp.send("Page.reload", { ignoreCache: true });
await reloaded;
await evaluate("new Promise(resolve => setTimeout(resolve, 250))");

const initial = await evaluate(`(() => ({
  title: document.title,
  activeTab: document.querySelector('[role="tab"][aria-selected="true"]')?.textContent.trim(),
  monkeyCount: document.querySelectorAll('.dt-monkey-card').length,
  imageCount: document.querySelectorAll('.dt-monkey-card img').length,
  rootDropZone: Boolean(document.querySelector('.dt-drop-zone.root')),
  exampleVisible: !document.querySelector('#example-tree').hidden,
  moduleLoaded: Boolean(document.querySelector('.dt-tool')),
  featureHints: [...document.querySelectorAll('.dt-feature-hint')].map(element => element.textContent.trim()),
}))()`);
assert(initial.activeTab === "1a – Einfach", "Beim Start muss Variante 1a aktiv sein.");
assert(initial.monkeyCount === 12 && initial.imageCount === 12, "Variante 1a muss 12 Bilder zeigen.");
assert(initial.rootDropZone && initial.exampleVisible && initial.moduleLoaded, "Editor oder Beispielbaum wurde nicht geladen.");
assert(initial.featureHints.length === 2 && initial.featureHints.every(text => text.includes("herausgestreckter Zunge") && text.includes("sichtbaren Zähnen") && text.includes("nicht als lächelnd")), "Der Merkmals-Hinweis fehlt an einer der beiden vorgesehenen Stellen.");

await evaluate("document.querySelector('#check-tree').click()");
const incompleteFeedback = await evaluate("document.querySelector('#evaluation-feedback').textContent");
assert(incompleteFeedback.includes("noch nicht vollständig"), "Unvollständiger Baum wurde nicht erkannt.");

await evaluate(`(() => {
  const tool = label => [...document.querySelectorAll('.dt-tool')].find(button => button.textContent.trim() === label);
  tool('Zunge raus?').click();
  document.querySelector('.dt-drop-zone.root').click();
  tool('Beißt').click();
  document.querySelector('.dt-drop-zone').click();
  tool('Beißt nicht').click();
  document.querySelector('.dt-drop-zone').click();
  document.querySelector('#check-tree').click();
})()`);
const evaluated = await evaluate(`(() => ({
  feedback: document.querySelector('#evaluation-feedback').textContent,
  wrongCards: document.querySelectorAll('.dt-monkey-card.is-wrong').length,
  saved: Boolean(localStorage.getItem('informatik11-decision-tree-v1-easy-data-v2')),
}))()`);
assert(evaluated.feedback.includes("von 12 Äffchen richtig"), "Vollständiger Beispielbaum wurde nicht ausgewertet.");
assert(evaluated.wrongCards > 0, "Falsch klassifizierte Äffchen wurden nicht markiert.");
assert(evaluated.saved, "Der Baum wurde nicht lokal gespeichert.");

await evaluate("document.querySelector('#toggle-example').click()");
assert(await evaluate("document.querySelector('#example-tree').hidden") === true, "Beispielbaum ließ sich nicht ausblenden.");

await evaluate("document.querySelector('[data-variant=advanced]').click()");
const advanced = await evaluate(`(() => ({
  activeTab: document.querySelector('[role="tab"][aria-selected="true"]')?.textContent.trim(),
  monkeyCount: document.querySelectorAll('.dt-monkey-card').length,
  featureCount: document.querySelectorAll('.dt-tool.feature').length,
}))()`);
assert(advanced.activeTab === "1b – Fortgeschritten", "Variante 1b ließ sich nicht öffnen.");
assert(advanced.monkeyCount === 26, "Variante 1b muss 26 Bilder zeigen.");
assert(advanced.featureCount === 5, "Variante 1b muss genau fünf Merkmale anbieten.");

const viewports = [
  { name: "desktop", width: 1920, height: 1080 },
  { name: "notebook", width: 1366, height: 768 },
  { name: "tablet-landscape", width: 1024, height: 768 },
  { name: "tablet-portrait", width: 768, height: 1024 },
];
const viewportResults = [];
for (const viewport of viewports) {
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: 1,
    mobile: false,
  });
  const layout = await evaluate(`(() => ({
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
    trainingWidth: Math.round(document.querySelector('.dt-training-panel').getBoundingClientRect().width),
    editorWidth: Math.round(document.querySelector('.dt-editor-card').getBoundingClientRect().width),
  }))()`);
  assert(layout.scrollWidth <= layout.innerWidth, `${viewport.name}: Die Gesamtseite scrollt horizontal.`);
  viewportResults.push({ ...viewport, ...layout });
}

await cdp.send("Emulation.setDeviceMetricsOverride", { width: 1366, height: 768, deviceScaleFactor: 1, mobile: false });
const screenshot = await cdp.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
const screenshotPath = join(tmpdir(), "entscheidungbaeume-browser-smoke.png");
await writeFile(screenshotPath, Buffer.from(screenshot.data, "base64"));

const runtime = await evaluate(`(() => ({
  imagesComplete: [...document.images].every(image => image.complete && image.naturalWidth > 0),
  bodyTextLength: document.body.innerText.length,
  firstCard: (() => {
    const card = document.querySelector('.dt-monkey-card');
    const image = card.querySelector('img');
    const cardRect = card.getBoundingClientRect();
    const imageRect = image.getBoundingClientRect();
    return {
      cardWidth: Math.round(cardRect.width),
      cardHeight: Math.round(cardRect.height),
      imageWidth: Math.round(imageRect.width),
      imageHeight: Math.round(imageRect.height),
      computedHeight: getComputedStyle(image).height,
    };
  })(),
}))()`);
assert(runtime.imagesComplete, "Mindestens ein Äffchenbild konnte nicht geladen werden.");
assert(Math.abs(runtime.firstCard.imageWidth - runtime.firstCard.imageHeight) <= 1, `Äffchenbilder werden nicht quadratisch dargestellt: ${JSON.stringify(runtime.firstCard)}`);

console.log(JSON.stringify({ initial, evaluated, advanced, viewportResults, runtime, screenshotPath }, null, 2));
cdp.socket.close();
