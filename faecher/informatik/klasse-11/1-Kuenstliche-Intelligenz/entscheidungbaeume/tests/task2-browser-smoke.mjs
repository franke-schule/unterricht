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
await cdp.send("Emulation.setDeviceMetricsOverride", { width: 1366, height: 768, deviceScaleFactor: 1, mobile: false });
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
assert(initialGate, "Aufgabe 2.1 muss ohne erfolgreich geprüften Baum gesperrt sein.");

await evaluate("location.hash = '#vergleich'");
await evaluate("new Promise(resolve => setTimeout(resolve, 100))");
const directComparison = await evaluate(`(async () => {
  const menuHtml = await fetch('../index.html').then(response => response.text());
  const menu = new DOMParser().parseFromString(menuHtml, 'text/html');
  return {
    hash: location.hash,
    title: document.querySelector('#task2-title').textContent,
    taskNumber: document.querySelector('#task2-number').textContent,
    gateHidden: document.querySelector('#task2-gate').hidden,
    ownHidden: document.querySelector('#task2-own').hidden,
    comparisonVisible: !document.querySelector('#task2-compare').hidden,
    startButton: Boolean(document.querySelector('#start-comparison')),
    missingTreeMessage: document.body.innerText.includes('brauchst zuerst'),
    menuDirectLink: Boolean(menu.querySelector('a[href="1-Kuenstliche-Intelligenz/aufgabe2.html#vergleich"]')),
  };
})()`);
assert(directComparison.hash === "#vergleich" && directComparison.taskNumber === "Aufgabe 2.2", `Deep-Link wurde nicht korrekt initialisiert: ${JSON.stringify(directComparison)}`);
assert(directComparison.gateHidden && directComparison.ownHidden && directComparison.comparisonVisible && directComparison.startButton, `Aufgabe 2.2 ist bei leerem Speicher nicht unabhängig zugänglich: ${JSON.stringify(directComparison)}`);
assert(!directComparison.missingTreeMessage && directComparison.menuDirectLink, `Voraussetzungstext oder Menülink ist fehlerhaft: ${JSON.stringify(directComparison)}`);

await evaluate("location.hash = '#easy'");
await evaluate("new Promise(resolve => setTimeout(resolve, 100))");
assert(await evaluate("!document.querySelector('#task2-gate').hidden"), "Aufgabe 2.1 muss nach dem direkten Vergleich weiterhin ihr Gate verwenden.");

await evaluate(`(async () => {
  const { COMPARISON_TREE_A } = await import('./entscheidungbaeume/data/test-data.mjs');
  localStorage.clear();
  localStorage.setItem('informatik11-decision-tree-v1-easy-data-v2', JSON.stringify(COMPARISON_TREE_A));
  localStorage.setItem('informatik11-decision-tree-verified-v1-easy-data-v2', JSON.stringify({ tree: COMPARISON_TREE_A, verifiedAt: Date.now() }));
})()`);
await reload();
assert(await evaluate("Boolean(document.querySelector('#start-own-test'))"), "Startansicht des eigenen Testlaufs fehlt.");
await evaluate("document.querySelector('#start-own-test').click()");
await evaluate("new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))");
const ownTreeFit = await evaluate(`(() => {
  const viewport = document.querySelector('.dt-readonly-viewport');
  const tree = viewport.querySelector(':scope > .dt-readonly-subtree');
  const outer = viewport.getBoundingClientRect();
  const inner = tree.getBoundingClientRect();
  return { contained: inner.left >= outer.left - 1 && inner.right <= outer.right + 1 && inner.top >= outer.top - 1 && inner.bottom <= outer.bottom + 1, viewportHeight: outer.height, scale: viewport.dataset.treeScale, style: tree.getAttribute('style'), transform: getComputedStyle(tree).transform, natural: { width: tree.scrollWidth, height: tree.scrollHeight }, outer: { left: outer.left, right: outer.right, top: outer.top, bottom: outer.bottom }, inner: { left: inner.left, right: inner.right, top: inner.top, bottom: inner.bottom } };
})()`);
assert(ownTreeFit.contained && ownTreeFit.viewportHeight <= 286, `Eigener Baum passt nicht vollständig in den Laptop-Bereich: ${JSON.stringify(ownTreeFit)}`);

async function finishCurrentOwnDataset(total) {
  for (let index = 0; index < total; index += 1) {
    assert(await evaluate("Boolean(document.querySelector('#classify-own')?.closest('.dt-monkey-stage'))"), `Testaktion ${index + 1} steht nicht beim Affenbild.`);
    await evaluate("document.querySelector('#classify-own').click(); new Promise(resolve => setTimeout(resolve, 15))");
    assert(await evaluate("Boolean(document.querySelector('#reveal-own')?.closest('.dt-monkey-stage'))"), `Vorhersage ${index + 1} wurde nicht beim Affenbild angezeigt.`);
    await evaluate("document.querySelector('#reveal-own').click()");
    const matrixTotal = await evaluate("[...document.querySelectorAll('.dt-confusion-matrix td strong')].reduce((sum, node) => sum + Number(node.textContent), 0)");
    assert(matrixTotal === index + 1, `Testdatum ${index + 1} wurde nicht exakt einmal gezählt.`);
    assert(await evaluate("Boolean(document.querySelector('#next-own')?.closest('.dt-monkey-stage'))"), `Weiter-Schaltfläche ${index + 1} steht nicht beim Affenbild.`);
    await evaluate("document.querySelector('#next-own').click()");
  }
}

await finishCurrentOwnDataset(8);
const easySummary = await evaluate("document.querySelector('#task2-own').innerText");
assert(easySummary.includes("8 von 8 richtig") && easySummary.includes("100 %"), "Einfache Zusammenfassung ist falsch.");
await evaluate("document.querySelector('#open-comparison').click(); document.querySelector('#start-comparison').click()");
await evaluate("new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))");
const comparisonTreeFit = await evaluate(`[...document.querySelectorAll('#task2-compare .dt-readonly-viewport')].map(viewport => {
  const tree = viewport.querySelector(':scope > .dt-readonly-subtree');
  const outer = viewport.getBoundingClientRect();
  const inner = tree.getBoundingClientRect();
  return { contained: inner.left >= outer.left - 1 && inner.right <= outer.right + 1 && inner.top >= outer.top - 1 && inner.bottom <= outer.bottom + 1, viewportHeight: outer.height, scale: viewport.dataset.treeScale, outer: { left: outer.left, right: outer.right, top: outer.top, bottom: outer.bottom }, inner: { left: inner.left, right: inner.right, top: inner.top, bottom: inner.bottom } };
})`);
assert(comparisonTreeFit.length === 2 && comparisonTreeFit.every(result => result.contained && result.viewportHeight <= 232), `Vergleichsbäume passen nicht vollständig in den Laptop-Bereich: ${JSON.stringify(comparisonTreeFit)}`);
await evaluate("document.querySelector('#task2-compare').scrollIntoView({ block: 'start' }); new Promise(resolve => setTimeout(resolve, 30))");
const treeScreenshot = await cdp.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: false });
const treeScreenshotPath = join(tmpdir(), "entscheidungbaeume-aufgabe2-laptop.png");
await writeFile(treeScreenshotPath, Buffer.from(treeScreenshot.data, "base64"));

for (let index = 0; index < 8; index += 1) {
  assert(await evaluate("Boolean(document.querySelector('#classify-both')?.closest('.dt-monkey-stage'))"), `Vergleichsaktion ${index + 1} steht nicht beim Affenbild.`);
  await evaluate("document.querySelector('#classify-both').click(); new Promise(resolve => setTimeout(resolve, 15))");
  assert(await evaluate("Boolean(document.querySelector('#reveal-both')?.closest('.dt-monkey-stage'))"), `Vergleichsvorhersage ${index + 1} fehlt beim Affenbild.`);
  await evaluate("document.querySelector('#reveal-both').click()");
  assert(await evaluate("Boolean(document.querySelector('#next-both')?.closest('.dt-monkey-stage'))"), `Vergleichs-Weiter-Schaltfläche ${index + 1} steht nicht beim Affenbild.`);
  await evaluate("document.querySelector('#next-both').click()");
}

const questionText = await evaluate("document.querySelector('#task2-compare').innerText");
assert(questionText.includes("8 von 8 richtig") && questionText.includes("7 von 8 richtig"), "Vergleichsergebnis 8/8 zu 7/8 fehlt.");
await evaluate("document.querySelector('#inspect-monkey03').click(); new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))");
const monkeyQuestion = await evaluate(`(() => ({
  heading: document.querySelector('#task2-compare h2').textContent,
  monkey03: document.querySelector('.dt-focus-monkey img')?.alt,
  answerCount: document.querySelectorAll('#monkey03-form input[type=radio]').length,
  treeNodeCounts: [...document.querySelectorAll('[data-analysis-tree]')].map(tree => tree.querySelectorAll('[data-node-id]').length),
}))()`);
assert(monkeyQuestion.heading.includes("Äffchen 03") && monkeyQuestion.monkey03 === "Äffchen 03", `Äffchen-03-Frage fehlt: ${JSON.stringify(monkeyQuestion)}`);
assert(monkeyQuestion.answerCount === 4 && monkeyQuestion.treeNodeCounts.length === 2 && monkeyQuestion.treeNodeCounts.every(count => count === 9), `Antwortfelder oder vollständige Bäume fehlen: ${JSON.stringify(monkeyQuestion)}`);

const analysisViewportResults = [];
for (const viewport of [{ width: 1366, height: 768 }, { width: 1024, height: 768 }, { width: 768, height: 1024 }]) {
  await cdp.send("Emulation.setDeviceMetricsOverride", { ...viewport, deviceScaleFactor: 1, mobile: false });
  await evaluate("new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))");
  const layout = await evaluate(`(() => {
    const grid = document.querySelector('.dt-analysis-grid');
    const trees = [...grid.querySelectorAll('.dt-readonly-viewport')].map(tree => {
      const outer = tree.getBoundingClientRect();
      const inner = tree.querySelector(':scope > .dt-readonly-subtree').getBoundingClientRect();
      return { scale: Number(tree.dataset.treeScale), contained: inner.left >= outer.left - 1 && inner.right <= outer.right + 1 && inner.top >= outer.top - 1 && inner.bottom <= outer.bottom + 1 };
    });
    return { scrollWidth: document.documentElement.scrollWidth, innerWidth, columns: getComputedStyle(grid).gridTemplateColumns.split(' ').length, trees };
  })()`);
  assert(layout.scrollWidth <= layout.innerWidth && layout.trees.every(tree => tree.contained && tree.scale >= 0.6), `${viewport.width}px: Analysebäume sind zu klein oder laufen über: ${JSON.stringify(layout)}`);
  assert(layout.columns === (viewport.width <= 1050 ? 1 : 2), `${viewport.width}px: unerwartete Baum-Anordnung: ${JSON.stringify(layout)}`);
  analysisViewportResults.push({ ...viewport, ...layout });
}
await cdp.send("Emulation.setDeviceMetricsOverride", { width: 1366, height: 768, deviceScaleFactor: 1, mobile: false });

await evaluate(`(() => {
  document.querySelector('input[name="prediction-a"][value="bites"]').checked = true;
  document.querySelector('input[name="prediction-b"][value="does-not-bite"]').checked = true;
  document.querySelector('#monkey03-form').requestSubmit();
})()`);
await evaluate("new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))");
const pathAnalysis = await evaluate(`(() => ({
  heading: document.querySelector('#task2-compare h2').textContent,
  monkey03: document.querySelector('.dt-focus-monkey img')?.alt,
  treeNodeCounts: [...document.querySelectorAll('[data-analysis-tree]')].map(tree => tree.querySelectorAll('[data-node-id]').length),
  activeNodes: document.querySelectorAll('[data-analysis-tree] .dt-readonly-node.is-active').length,
  activeBranches: document.querySelectorAll('[data-analysis-tree] .dt-readonly-branch.is-active').length,
  causeAnswers: document.querySelectorAll('#cause-form input[type=radio]').length,
}))()`);
assert(pathAnalysis.heading === "Die Pfade von Äffchen 03" && pathAnalysis.monkey03 === "Äffchen 03", `Pfadanalyse zeigt Äffchen 03 nicht: ${JSON.stringify(pathAnalysis)}`);
assert(pathAnalysis.treeNodeCounts.length === 2 && pathAnalysis.treeNodeCounts.every(count => count === 9), `Pfadanalyse zeigt nicht beide vollständigen Bäume: ${JSON.stringify(pathAnalysis)}`);
assert(pathAnalysis.activeNodes === 4 && pathAnalysis.activeBranches === 2 && pathAnalysis.causeAnswers === 4, `Pfade oder Ursachenfrage sind unvollständig: ${JSON.stringify(pathAnalysis)}`);
await evaluate("document.querySelector('#task2-compare').scrollIntoView({ block: 'start' }); new Promise(resolve => setTimeout(resolve, 30))");
const pathScreenshot = await cdp.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
const pathScreenshotPath = join(tmpdir(), "entscheidungbaeume-aufgabe2-pfadanalyse.png");
await writeFile(pathScreenshotPath, Buffer.from(pathScreenshot.data, "base64"));

await evaluate(`(() => {
  document.querySelector('input[name="cause"][value="early-leaf"]').checked = true;
  document.querySelector('#cause-form').requestSubmit();
})()`);
const lesson = await evaluate("document.querySelector('#task2-compare').innerText");
assert(lesson.includes("X-Augen: Ja") && lesson.includes("Zähne sichtbar: Ja") && lesson.includes("12 von 12 richtig") && lesson.includes("8 von 8 richtig") && lesson.includes("7 von 8 richtig") && lesson.includes("Was sind Testdaten?"), "Abschließende Erkenntnissicherung ist unvollständig.");
const screenshot = await cdp.send("Page.captureScreenshot", { format: "png", captureBeyondViewport: true });
const screenshotPath = join(tmpdir(), "entscheidungbaeume-aufgabe2.png");
await writeFile(screenshotPath, Buffer.from(screenshot.data, "base64"));

const viewportResults = [];
for (const viewport of [{ width: 1366, height: 768 }, { width: 1024, height: 768 }, { width: 768, height: 1024 }]) {
  await cdp.send("Emulation.setDeviceMetricsOverride", { ...viewport, deviceScaleFactor: 1, mobile: false });
  const layout = await evaluate(`({ innerWidth, scrollWidth: document.documentElement.scrollWidth, shell: (() => { const element = document.querySelector('.decision-tree-shell'); const rect = element.getBoundingClientRect(); return { left: rect.left, right: rect.right, width: rect.width, cssWidth: getComputedStyle(element).width, minWidth: getComputedStyle(element).minWidth }; })(), overflow: [...document.querySelectorAll('body *')].map(element => { const style = getComputedStyle(element); const rect = element.getBoundingClientRect(); return { tag: element.tagName, className: element.className, right: rect.right, width: rect.width, cssWidth: style.width, transform: style.transform, zoom: style.zoom }; }).filter(item => item.right > innerWidth + 1).sort((a, b) => b.right - a.right).slice(0, 3) })`);
  assert(layout.scrollWidth <= layout.innerWidth, `${viewport.width}px: horizontales Seitenscrolling (${JSON.stringify(layout)}).`);
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

console.log(JSON.stringify({ directComparison, ownTreeFit, comparisonTreeFit, monkeyQuestion, analysisViewportResults, pathAnalysis, viewportResults, imagesComplete, screenshotPath, treeScreenshotPath, pathScreenshotPath }, null, 2));
cdp.socket.close();
