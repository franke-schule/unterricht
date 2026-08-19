import { writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const pageUrl = process.argv[2] ?? "http://127.0.0.1:8765/faecher/informatik/klasse-11/1-Kuenstliche-Intelligenz/aufgabe2.html";
const debuggingUrl = process.argv[3] ?? "http://127.0.0.1:9222";

class CdpClient {
  constructor(socket) {
    this.socket = socket;
    this.nextId = 1;
    this.pending = new Map();
    this.waiters = new Map();
    socket.addEventListener("message", (event) => this.handle(JSON.parse(event.data)));
  }
  handle(message) {
    if (message.id) {
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      return message.error ? pending.reject(new Error(message.error.message)) : pending.resolve(message.result);
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
      const waiters = this.waiters.get(method) ?? [];
      waiters.push((value) => { clearTimeout(timeout); resolve(value); });
      this.waiters.set(method, waiters);
    });
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function connect(webSocketDebuggerUrl) {
  const socket = new WebSocket(webSocketDebuggerUrl);
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  return new CdpClient(socket);
}

const target = await fetch(`${debuggingUrl}/json/new?${encodeURIComponent(pageUrl)}`, { method: "PUT" }).then((response) => response.json());
const cdp = await connect(target.webSocketDebuggerUrl);
await cdp.send("Page.enable");
await cdp.send("Runtime.enable");
await cdp.send("Emulation.setEmulatedMedia", { features: [{ name: "prefers-reduced-motion", value: "reduce" }] });
const loaded = cdp.waitFor("Page.loadEventFired");
await cdp.send("Page.navigate", { url: pageUrl });
await loaded;

async function evaluate(expression) {
  const response = await cdp.send("Runtime.evaluate", { expression, awaitPromise: true, returnByValue: true });
  if (response.exceptionDetails) throw new Error(response.exceptionDetails.exception?.description ?? response.exceptionDetails.text);
  return response.result.value;
}

async function reload() {
  const done = cdp.waitFor("Page.loadEventFired");
  await cdp.send("Page.reload", { ignoreCache: true });
  await done;
  await evaluate("new Promise(resolve => setTimeout(resolve, 80))");
}

await evaluate("new Promise(resolve => setTimeout(resolve, 100))");
await evaluate("localStorage.clear()");
await reload();
const initialGate = await evaluate("!document.querySelector('#task2-gate').hidden && document.querySelector('#task2-gate').innerText.includes('brauchst zuerst')");
assert(initialGate, "Aufgabe 2 muss ohne erfolgreich geprüften Baum gesperrt sein.");

await evaluate(`(async () => {
  const { COMPARISON_TREE_A } = await import('./entscheidungbaeume/data/test-data.mjs');
  localStorage.clear();
  localStorage.setItem('informatik11-decision-tree-v1-easy', JSON.stringify(COMPARISON_TREE_A));
  localStorage.setItem('informatik11-decision-tree-verified-v1-easy', JSON.stringify({ tree: COMPARISON_TREE_A, verifiedAt: Date.now() }));
})()`);
await reload();
assert(await evaluate("Boolean(document.querySelector('#start-own-test'))"), "Startansicht des eigenen Testlaufs fehlt.");
await evaluate("document.querySelector('#start-own-test').click()");

async function finishCurrentOwnDataset(total) {
  for (let index = 0; index < total; index += 1) {
    await evaluate("document.querySelector('#classify-own').click(); new Promise(resolve => setTimeout(resolve, 15))");
    assert(await evaluate("Boolean(document.querySelector('#reveal-own'))"), `Vorhersage ${index + 1} wurde nicht getrennt angezeigt.`);
    await evaluate("document.querySelector('#reveal-own').click()");
    const matrixTotal = await evaluate("[...document.querySelectorAll('.dt-confusion-matrix td strong')].reduce((sum, node) => sum + Number(node.textContent), 0)");
    assert(matrixTotal === index + 1, `Testdatum ${index + 1} wurde nicht exakt einmal gezählt.`);
    await evaluate("document.querySelector('#next-own').click()");
  }
}

await finishCurrentOwnDataset(8);
const easySummary = await evaluate("document.querySelector('#task2-own').innerText");
assert(easySummary.includes("8 von 8 richtig") && easySummary.includes("100 %"), "Einfache Zusammenfassung ist falsch.");
await evaluate("document.querySelector('#open-comparison').click(); document.querySelector('#start-comparison').click()");

for (let index = 0; index < 8; index += 1) {
  await evaluate("document.querySelector('#classify-both').click(); new Promise(resolve => setTimeout(resolve, 15))");
  assert(await evaluate("Boolean(document.querySelector('#reveal-both'))"), `Vergleichsvorhersage ${index + 1} fehlt.`);
  await evaluate("document.querySelector('#reveal-both').click(); document.querySelector('#next-both').click()");
}

const questionText = await evaluate("document.querySelector('#task2-compare').innerText");
assert(questionText.includes("8 von 8 richtig") && questionText.includes("7 von 8 richtig"), "Vergleichsergebnis 8/8 zu 7/8 fehlt.");
await evaluate(`(() => {
  document.querySelector('input[name=better][value=a]').checked = true;
  document.querySelector('input[name=change][value=order]').checked = true;
  document.querySelector('[data-monkey-choice="03"]').click();
  document.querySelector('input[name=features][value=xEyes]').checked = true;
  document.querySelector('input[name=features][value=teethVisible]').checked = true;
  document.querySelector('#discovery-form').requestSubmit();
})()`);
const lesson = await evaluate("document.querySelector('#task2-compare').innerText");
assert(lesson.includes("Die Pfade von Äffchen 03") && lesson.includes("Was sind Testdaten?"), "Entdeckende Auswertung wurde nicht freigeschaltet.");
const screenshot = await cdp.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
const screenshotPath = join(tmpdir(), "entscheidungbaeume-aufgabe2.png");
await writeFile(screenshotPath, Buffer.from(screenshot.data, "base64"));

const viewportResults = [];
for (const viewport of [{ width: 1366, height: 768 }, { width: 1024, height: 768 }, { width: 768, height: 1024 }]) {
  await cdp.send("Emulation.setDeviceMetricsOverride", { ...viewport, deviceScaleFactor: 1, mobile: false });
  const layout = await evaluate("({ innerWidth, scrollWidth: document.documentElement.scrollWidth })");
  assert(layout.scrollWidth <= layout.innerWidth, `${viewport.width}px: horizontales Seitenscrolling.`);
  viewportResults.push({ ...viewport, ...layout });
}

await evaluate(`(async () => {
  const { ADVANCED_DATASET, ADVANCED_FEATURE_KEYS, CLASSIFICATIONS } = await import('./entscheidungbaeume/data/monkeys.mjs');
  const leaf = prediction => ({ type: 'leaf', id: crypto.randomUUID(), prediction });
  const featureNode = (feature, yes, no) => ({ type: 'feature', id: crypto.randomUUID(), feature, yes, no });
  const build = (dataset, keys) => {
    if (dataset.every(entry => entry.classification === dataset[0].classification)) return leaf(dataset[0].classification);
    for (const feature of keys) {
      const yes = dataset.filter(entry => entry.features[feature]);
      const no = dataset.filter(entry => !entry.features[feature]);
      if (yes.length && no.length) {
        const rest = keys.filter(key => key !== feature);
        return featureNode(feature, build(yes, rest), build(no, rest));
      }
    }
    return leaf(CLASSIFICATIONS.DOES_NOT_BITE);
  };
  const tree = build(ADVANCED_DATASET, ADVANCED_FEATURE_KEYS);
  localStorage.setItem('informatik11-decision-tree-v1-advanced', JSON.stringify(tree));
  localStorage.setItem('informatik11-decision-tree-verified-v1-advanced', JSON.stringify({ tree, verifiedAt: Date.now() }));
  location.hash = '#advanced';
})()`);
await reload();
await evaluate("document.querySelector('#start-own-test').click()");
await finishCurrentOwnDataset(13);
assert((await evaluate("document.querySelector('#task2-own').innerText")).includes("13 von"), "Fortgeschrittener Testlauf wurde nicht vollständig abgeschlossen.");

const imagesComplete = await evaluate("[...document.images].every(image => image.complete && image.naturalWidth > 0)");
assert(imagesComplete, "Mindestens ein Testbild konnte nicht geladen werden.");

console.log(JSON.stringify({ viewportResults, imagesComplete, screenshotPath }, null, 2));
cdp.socket.close();
