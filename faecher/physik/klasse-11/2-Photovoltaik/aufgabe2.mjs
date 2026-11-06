import { normalizeStoredSeries, resistanceFromSlider, solveOperatingPoint } from "./aufgabe2-model.mjs";
import { setupPhysicsStepTabs } from "../1-Kreisbewegungen/components/physics-step-tabs.mjs";
import { createPhysicsTaskProgress } from "../1-Kreisbewegungen/components/physics-task-progress.mjs";
import { createSliderCommitAdapter } from "./aufgabe2-slider.mjs";

const $ = (id) => document.getElementById(id);
const slider = $("resistance"), colorSelect = $("color"), openSwitch = $("open-circuit");
const progress = createPhysicsTaskProgress("photovoltaik-aufgabe2");
const tabs = setupPhysicsStepTabs();
let running = false, restoring = false, series = [], currentSeries = null, nextId = 1, markers = {};
const colors = { Weiß: "#d7a300", Rot: "#bd3b32", Grün: "#27814c", Gelb: "#ae8612", Blau: "#316fb2" };
const symbols = ["circle", "square", "triangle", "diamond", "cross", "hexagon"];

function pointNow() { return solveOperatingPoint(colorSelect.value, resistanceFromSlider(Number(slider.value)), openSwitch.checked); }
function fmt(value, digits = 3) { return Number(value).toFixed(digits).replace(".", ","); }
function ohms(value) { return value === Infinity ? "∞" : value < 1000 ? `${fmt(value, value < 10 ? 2 : 1)} Ω` : `${fmt(value / 1000, 2)} kΩ`; }
function updateReadings() {
  const p = pointNow();
  $("voltage").textContent = `${fmt(p.voltage)} V`;
  $("current").textContent = `${fmt(p.current * 1000)} mA`;
  $("power").textContent = `${fmt(p.power * 1000)} mW`;
  $("resistance-value").textContent = openSwitch.checked ? "∞ (Leerlauf)" : ohms(p.resistance);
  const tip = 427 - 66 * (Number(slider.value) / 1000) ** 3, top = tip + 12;
  $("wiper-feed").setAttribute("d", `M349 38V5H${top}`);
  $("wiper").setAttribute("d", `M${top} 5L${tip} 26m0 0 1-8m-1 8 7-4`);
  $("dial").setAttribute("cx", String(top));
  const body = document.querySelector(".pv-apparatus");
  body.dataset.color = colorSelect.value.toLowerCase();
  body.dataset.open = String(openSwitch.checked);
  renderGraphs();
}

function createSeries(color) {
  currentSeries = { id: nextId++, color, visible: true, points: [] };
  series.push(currentSeries);
  renderSeriesControls();
}
function sameSetting(a, b) { return a.open === b.open && a.slider === b.slider; }
function pointKey(point) { return `${point.slider}:${point.open ? 1 : 0}`; }
function recordPoint() {
  if (!currentSeries) createSeries(colorSelect.value);
  const setting = { slider: Number(slider.value), open: openSwitch.checked };
  const point = { ...pointNow(), ...setting };
  const prior = currentSeries.points.findIndex((item) => sameSetting(item, setting));
  if (prior >= 0) return;
  currentSeries.points.push(point);
  if (markers[currentSeries.id]) markers[currentSeries.id] = currentSeries.points.reduce((winner, item) => item.power > winner.power ? item : winner);
  renderAll();
}
function renderSeriesControls() {
  const host = $("series-visibility"); host.replaceChildren();
  const select = $("selected-series"), old = select.value;
  select.replaceChildren();
  series.forEach((item) => {
    const label = document.createElement("label"); label.className = "pv-series-toggle";
    const checkbox = document.createElement("input"); checkbox.type = "checkbox"; checkbox.checked = item.visible; checkbox.dataset.seriesId = String(item.id);
    checkbox.addEventListener("change", () => { item.visible = checkbox.checked; renderGraphs(); progress.save(); });
    const shape = document.createElement("span"); shape.className = `series-symbol ${symbols[(item.id - 1) % symbols.length]}`; shape.style.setProperty("--series-color", colors[item.color]);
    label.append(checkbox, shape, document.createTextNode(`${item.color} · Reihe ${item.id} anzeigen`)); host.append(label);
    const option = document.createElement("option"); option.value = String(item.id); option.textContent = `${item.color} · Reihe ${item.id}`; select.append(option);
  });
  if (series.some((item) => String(item.id) === old)) select.value = old;
  else if (currentSeries) select.value = String(currentSeries.id);
}
function axisSvg(kind) {
  const compact = window.matchMedia("(max-width:600px)").matches;
  const tablet = window.matchMedia("(max-width:940px)").matches;
  const width = compact ? 340 : tablet ? 520 : 700, height = 205, left = compact ? 42 : 48, right = compact ? 320 : tablet ? 490 : 665, top = 20, bottom = 158;
  const xmax = 1.15, ymax = kind === "current" ? 12 : 10;
  const x = (u) => left + u / xmax * (right - left), y = (v) => bottom - v / ymax * (bottom - top);
  let grid = "";
  for (let v = 0; v <= ymax; v += 2) grid += `<line x1="${left}" y1="${y(v)}" x2="${right}" y2="${y(v)}" class="graph-grid"/><text x="${left - 8}" y="${y(v) + 4}" text-anchor="end" class="graph-tick">${v}</text>`;
  for (let u = 0; u <= 1.1001; u += .2) grid += `<line x1="${x(u)}" y1="${top}" x2="${x(u)}" y2="${bottom}" class="graph-grid"/><text x="${x(u)}" y="${bottom + 20}" text-anchor="middle" class="graph-tick">${fmt(u, 1)}</text>`;
  return { width, height, left, right, top, bottom, xmax, ymax, x, y, grid };
}
function pointShape(shape, px, py, fill, label = "") {
  if (shape === "square") return `<rect x="${px - 4}" y="${py - 4}" width="8" height="8" fill="${fill}"/>`;
  if (shape === "triangle") return `<path d="M${px} ${py - 5}L${px + 5} ${py + 4}H${px - 5}Z" fill="${fill}"/>`;
  if (shape === "diamond") return `<path d="M${px} ${py - 5}L${px + 5} ${py}L${px} ${py + 5}L${px - 5} ${py}Z" fill="${fill}"/>`;
  if (shape === "cross") return `<path d="M${px - 2} ${py - 6}H${px + 2}V${py - 2}H${px + 6}V${py + 2}H${px + 2}V${py + 6}H${px - 2}V${py + 2}H${px - 6}V${py - 2}H${px - 2}Z" fill="${fill}"/>`;
  if (shape === "hexagon") return `<path d="M${px - 5} ${py - 3}L${px} ${py - 6}L${px + 5} ${py - 3}V${py + 3}L${px} ${py + 6}L${px - 5} ${py + 3}Z" fill="${fill}"/>`;
  return `<circle cx="${px}" cy="${py}" r="4.5" fill="${fill}"/><title>${label}</title>`;
}
function renderGraph(kind) {
  const isPower = kind === "power", a = axisSvg(isPower ? "power" : "current"), { x, y } = a;
  let data = "";
  series.filter((item) => item.visible).forEach((item) => {
    const ordered = [...item.points].sort((p, q) => p.voltage - q.voltage);
    if (ordered.length > 1) data += `<polyline points="${ordered.map((p) => `${x(p.voltage)},${y((isPower ? p.power * 1000 : p.current * 1000))}`).join(" ")}" fill="none" stroke="${colors[item.color]}" stroke-width="2" stroke-dasharray="5 3"/>`;
    ordered.forEach((p) => { data += pointShape(symbols[(item.id - 1) % symbols.length], x(p.voltage), y(isPower ? p.power * 1000 : p.current * 1000), colors[item.color], `${item.color} Reihe ${item.id}`); });
  });
  const live = pointNow(), liveX = x(live.voltage), liveY = y(isPower ? live.power * 1000 : live.current * 1000);
  data += `<circle cx="${liveX}" cy="${liveY}" r="8" fill="none" stroke="#111" stroke-width="2"><title>Aktueller Arbeitspunkt</title></circle><text x="${Math.min(liveX + 9, a.right - 112)}" y="${Math.max(liveY - 10, a.top + 12)}" class="graph-point-label">Aktueller Punkt</text>`;
  const chosen = series.find((item) => String(item.id) === $("selected-series").value), mark = markers[chosen?.id];
  if (isPower && mark) {
    const mx = x(mark.voltage), my = y(mark.power * 1000);
    data += `<path d="M${mx} ${my - 12}l8 14h-16z" fill="#111"><title>Bester gemessener Punkt</title></path><text x="${Math.min(mx + 12, a.right - 145)}" y="${Math.max(my - 13, a.top + 12)}" class="graph-point-label">Bester gemessener Punkt</text>`;
  }
  const x2 = a.right + 14, y2 = a.top - 10;
  return `<svg viewBox="0 0 ${a.width} ${a.height}" role="img" aria-label="${isPower ? "Leistungs-Spannungs-Diagramm" : "Strom-Spannungs-Diagramm"}; Spannung U von 0 bis 1,15 V, ${isPower ? "Leistung P von 0 bis 10 mW" : "Stromstärke I von 0 bis 12 mA"}."><defs><marker id="arrow-${kind}" markerWidth="9" markerHeight="9" refX="7" refY="4" orient="auto"><path d="M0 0L0 8L8 4z" fill="#263d53"/></marker></defs>${a.grid}<line x1="${a.left}" y1="${a.bottom}" x2="${x2}" y2="${a.bottom}" class="graph-axis" marker-end="url(#arrow-${kind})"/><line x1="${a.left}" y1="${a.bottom}" x2="${a.left}" y2="${y2}" class="graph-axis" marker-end="url(#arrow-${kind})"/>${data}<text x="${a.right}" y="${a.bottom + 39}" text-anchor="end" class="graph-axis-title">U (V)</text><text x="75" y="16" class="graph-axis-title">${isPower ? "P (mW)" : "I (mA)"}</text></svg>`;
}
function renderGraphs() { $("ui-graph").innerHTML = renderGraph("current"); $("pu-graph").innerHTML = renderGraph("power"); }
window.addEventListener("resize", renderGraphs);
function renderTable() {
  const host = $("measurements"); host.replaceChildren(); let total = 0;
  series.forEach((item) => item.points.forEach((p) => {
    total += 1; const tr = document.createElement("tr");
    const values = [`Reihe ${item.id}${markers[item.id] && pointKey(markers[item.id]) === pointKey(p) ? " · Bester gemessener Punkt" : ""}`, item.color, ohms(p.resistance), fmt(p.voltage), fmt(p.current * 1000), fmt(p.power * 1000), p.operation];
    values.forEach((value) => { const td = document.createElement("td"); td.textContent = value; tr.append(td); }); host.append(tr);
  }));
  $("measurement-empty").hidden = total > 0;
}
function mppQuality(item, best) {
  const closed = new Set(item.points.filter((p) => p.operation === "geschlossen").map((p) => p.resistance));
  const hasShort = item.points.some((p) => p.operation === "Kurzschluss"), hasOpen = item.points.some((p) => p.operation === "Leerlauf");
  const neighbors = item.points.some((p) => p.voltage < best.voltage) && item.points.some((p) => p.voltage > best.voltage);
  return closed.size < 7 || !hasShort || !hasOpen || !neighbors
    ? "Miss weitere Punkte um den besten Wert: Das genaue Maximum kann zwischen deinen Messpunkten liegen."
    : "Deine Messpunkte grenzen das Maximum ein. Der markierte Punkt bleibt eine Näherung.";
}
function renderSelectedMpp() {
  const chosen = series.find((item) => String(item.id) === $("selected-series").value);
  const best = chosen && markers[chosen.id];
  if (!best) { $("mpp-result").textContent = ""; $("analysis-feedback").textContent = ""; return; }
  const quality = mppQuality(chosen, best);
  $("mpp-result").textContent = `Bester gemessener Punkt: U = ${fmt(best.voltage)} V, I = ${fmt(best.current * 1000)} mA, P = ${fmt(best.power * 1000)} mW.`;
  $("analysis-feedback").textContent = quality;
}
function renderAll() { updateReadings(); renderSeriesControls(); renderTable(); renderSelectedMpp(); renderGraphs(); progress.save(); }
function csvCell(value) { const text = String(value); return /[;"\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text; }
function exportCsv() {
  if (!series.some((item) => item.points.length)) { $("analysis-feedback").textContent = "Es gibt noch keine Messwerte für den Export."; return; }
  const rows = [["Reihe", "Farbe", "Widerstand", "U in V", "I in mA", "P in mW", "Betrieb"]];
  series.forEach((item) => item.points.forEach((p) => rows.push([`Reihe ${item.id}`, item.color, p.resistance === Infinity ? "∞" : `${fmt(p.resistance, 2)} Ω`, fmt(p.voltage), fmt(p.current * 1000), fmt(p.power * 1000), p.operation])));
  const content = "\uFEFF" + rows.map((row) => row.map(csvCell).join(";")).join("\r\n");
  const link = document.createElement("a"); link.href = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" })); link.download = "photovoltaik-messwerte.csv"; link.click(); URL.revokeObjectURL(link.href);
}
function markMeasuredMpp() {
  const chosen = series.find((item) => String(item.id) === $("selected-series").value);
  const distinct = chosen?.points || [];
  if (distinct.length < 3) { $("analysis-feedback").textContent = "Für eine MPP-Schätzung brauchst du mindestens drei verschiedene Messpunkte dieser Reihe."; return; }
  const best = distinct.reduce((winner, p) => p.power > winner.power ? p : winner);
  markers[chosen.id] = best;
  renderAll();
}

const questions = [
  { id: "Q1", prompt: "Was zeigen die beiden Endpunkte deiner Messreihe?", options: ["Im Leerlauf fließt durch den äußeren Kreis kein Strom.", "Beim idealisierten Kurzschluss ist die Spannung an der Zelle null.", "An beiden Endpunkten ist die abgegebene Leistung null.", "Im Leerlauf ist die Leistung am größten."], correct: [0,1,2], help: ["Suche an jedem Endpunkt die Größe, die null ist.", "Setze die jeweilige Null in P = U · I ein.", "Im Leerlauf ist I = 0; beim idealisierten Kurzschluss ist U = 0."], feedback: ["Korrekt. An beiden Endpunkten ist einer der Faktoren von P = U · I null.", "Teilweise korrekt. Prüfe Leerlauf und Kurzschluss getrennt und beachte alle richtigen Endpunktaussagen.", "Noch nicht korrekt. Beginne mit dem Strom im geöffneten Kreis und der Spannung beim idealisierten Kurzschluss."] },
  { id: "Q2", prompt: "Welche Aussagen helfen dir, den MPP aus Messdaten zu bestimmen?", options: ["Ich berechne P aus U und I desselben Messpunktes.", "Der größte bisher gemessene P-Wert ist eine Näherung für den MPP.", "Weitere Messpunkte nahe dem besten Wert können die Schätzung verbessern.", "Ich multipliziere die Leerlaufspannung mit dem Kurzschlussstrom und erhalte exakt den MPP."], correct: [0,1,2], help: ["Ein Arbeitspunkt gehört immer zu einer Widerstandseinstellung.", "Vergleiche die Produkte mehrerer zusammengehöriger U-I-Paare.", "Der größte erfasste P-Wert ist der beste Messpunkt, aber das genaue Maximum kann dazwischenliegen."], feedback: ["Korrekt. Du vergleichst zusammengehörige Werte und grenzt den MPP durch weitere Messpunkte ein.", "Teilweise korrekt. Prüfe, ob alle passenden U-I-Paare und die Näherung durch Messpunkte berücksichtigt sind.", "Noch nicht korrekt. Verwende zuerst P = U · I für einen einzelnen aufgenommenen Punkt."] },
  { id: "Q3", prompt: "Was gilt beim Vergleich der Lichtfarben in diesem Modell?", options: ["Die auf die Zelle treffende optische Leistung bleibt beim Farbwechsel gleich.", "Bei gleicher optischer Leistung hängt die Photonenzahl von der Wellenlänge ab.", "Die spektrale Empfindlichkeit der Zelle beeinflusst den Photostrom.", "Blau muss wegen der höheren Photonenenergie stets den größten Strom liefern."], correct: [0,1,2], help: ["Lies nach, welche Größe beim Farbwechsel konstant bleibt.", "Bei gleicher Leistung bedeuten energiereichere Photonen eine kleinere Photonenzahl.", "Für den Photostrom zählen Photonenzahl und EQE gemeinsam; aus der Photonenenergie allein folgt keine Stromrangfolge."], feedback: ["Korrekt. Bei gleicher optischer Leistung bestimmen Photonenzahl und spektrale Empfindlichkeit gemeinsam den Photostrom.", "Teilweise korrekt. Prüfe die konstante Leistung und beide Einflüsse auf den Strom.", "Noch nicht korrekt. Höhere Energie pro Photon bedeutet bei gleicher Leistung nicht mehr Photonen."] },
];
const checked = Object.fromEntries(questions.map((q) => [q.id, false]));
let quizChecks = null;
function renderQuiz() {
  const host = $("final-questions");
  questions.forEach((q, index) => {
    q.feedbackTexts = q.feedback;
    const fs = document.createElement("fieldset"); fs.className = "physics-quiz-question";
    const legend = document.createElement("legend"); legend.textContent = q.prompt; fs.append(legend);
    const optionHost = document.createElement("div"); optionHost.className = "quiz-options";
    q.options.forEach((text, i) => { const label = document.createElement("label"); label.className = "quiz-option"; const input = document.createElement("input"); input.type = "checkbox"; input.name = `${q.id}-answer`; input.value = String(i); const span = document.createElement("span"); span.textContent = text; label.append(input, span); optionHost.append(label); });
    fs.append(optionHost);
    const help = document.createElement("div"); help.className = "physics-help-stack";
    q.help.forEach((text, j) => { const d = document.createElement("details"), s = document.createElement("summary"), p = document.createElement("p"); s.textContent = `Hilfe ${j + 1}: ${["Hinweis", "Denkansatz", "Teillösung"][j]}`; p.textContent = text; d.append(s,p); help.append(d); }); fs.append(help);
    const feedback = document.createElement("p"); feedback.className = "physics-feedback quiz-question-feedback"; feedback.setAttribute("aria-live", "polite"); feedback.hidden = true; fs.append(feedback);
    const answerSet = () => [...fs.querySelectorAll("input")].flatMap((input, i) => input.checked ? [i] : []);
    const checkAnswer = () => {
      const selected = answerSet(), correctCount = selected.filter((i) => q.correct.includes(i)).length;
      const full = selected.length === q.correct.length && q.correct.every((i) => selected.includes(i));
      const status = !selected.length ? "empty" : full ? "correct" : correctCount ? "partial" : "wrong";
      return { result: status === "empty" ? "empty" : status === "correct" ? "correct" : status === "partial" ? "mixed" : "wrong", text: status === "empty" ? "Kreuze mindestens eine Antwort an." : q.feedbackTexts[status === "correct" ? 0 : status === "partial" ? 1 : 2] };
    };
    fs.addEventListener("change", () => { checked[q.id] = false; fs.classList.remove("is-correct", "is-wrong"); $("quiz-summary").hidden = true; $("final-feedback").textContent = ""; updateQuizStatus(); progress.save(); });
    q.fieldset = fs; q.answerSet = answerSet; q.checkAnswer = checkAnswer; q.feedback = feedback;
    host.append(fs);
  });
  quizChecks = window.addQuizQuestionChecks({
    questions: questions.map((q, index) => ({ fieldset: q.fieldset, number: index + 1, feedback: q.feedback, check: q.checkAnswer })),
    buttonClass: "physics-primary-button",
    feedbackClass: "physics-feedback",
    levels: { high: "success", medium: "partial", low: "error" },
    onCheck: (item, result) => { const q = questions.find((candidate) => candidate.fieldset === item.fieldset); checked[q.id] = result === "correct"; q.fieldset.classList.toggle("is-correct", result === "correct"); q.fieldset.classList.toggle("is-wrong", result !== "correct"); updateQuizStatus(); progress.save(); },
    onAllCorrect: evaluateQuiz,
  });
}
function updateQuizStatus() { const n = questions.filter((q) => checked[q.id]).length; $("quiz-status").textContent = `${n} von 3 Fragen richtig geprüft.`; }
function evaluateQuiz() {
  if (questions.every((q) => checked[q.id])) {
    $("final-feedback").textContent = "Sehr gut, alles richtig. Du kannst den besten Messpunkt bestimmen und seine Grenzen erklären.";
    const host = $("quiz-summary-answers"); host.replaceChildren();
    questions.forEach((q) => { const article = document.createElement("article"), h = document.createElement("h3"), list = document.createElement("ul"); h.textContent = q.prompt; q.correct.forEach((i) => { const li = document.createElement("li"); li.textContent = q.options[i]; list.append(li); }); article.append(h,list); host.append(article); });
    $("quiz-summary").hidden = false;
  } else $("final-feedback").textContent = "Prüfe zuerst die Rückmeldungen direkt unter allen drei Fragen.";
}

renderQuiz();
$("start-measurement").addEventListener("click", () => { running = true; $("measurement-status").textContent = "Messung läuft: Beim Loslassen des Schiebereglers wird ein Messpunkt aufgenommen."; if (!currentSeries) createSeries(colorSelect.value); progress.save(); });
$("stop-measurement").addEventListener("click", () => { running = false; $("measurement-status").textContent = "Messung gestoppt."; progress.save(); });
const sliderCommit = createSliderCommitAdapter({
  getValue: () => slider.value,
  onPreview: updateReadings,
  onCommit: () => { if (running) recordPoint(); },
  isRestoring: () => restoring,
});
slider.addEventListener("pointerdown", () => sliderCommit.pointerdown());
window.addEventListener("pointerup", () => sliderCommit.pointerup());
window.addEventListener("pointercancel", () => sliderCommit.pointercancel());
slider.addEventListener("keydown", (event) => sliderCommit.keydown(event));
slider.addEventListener("keyup", (event) => sliderCommit.keyup(event));
slider.addEventListener("blur", () => sliderCommit.blur());
slider.addEventListener("input", () => sliderCommit.input());
slider.addEventListener("change", () => sliderCommit.change());
openSwitch.addEventListener("change", () => { updateReadings(); progress.save(); });
colorSelect.addEventListener("change", () => { if (!restoring) createSeries(colorSelect.value); updateReadings(); progress.save(); });
$("selected-series").addEventListener("change", () => {
  renderSelectedMpp(); renderGraphs(); progress.save();
});
$("mark-mpp").addEventListener("click", markMeasuredMpp);
$("delete-series").addEventListener("click", () => { if (!window.confirm("Alle aufgenommenen Messreihen löschen?")) return; series = []; currentSeries = null; markers = {}; nextId = 1; running = false; $("measurement-status").textContent = "Alle Messreihen wurden gelöscht."; $("mpp-result").textContent = ""; $("analysis-feedback").textContent = ""; progress.clear(); renderAll(); });
$("export-csv").addEventListener("click", exportCsv);
$("evaluate-quiz").addEventListener("click", () => { quizChecks?.checkAll(); evaluateQuiz(); });

progress.registerPart("measurements", () => ({ series, currentId: currentSeries?.id || null, selectedId: Number($("selected-series").value) || null, nextId, markers, running: false }), (saved) => {
  const restoredSeries = normalizeStoredSeries(saved?.series);
  if (!restoredSeries) return;
  series = restoredSeries;
  nextId = series.reduce((next, item) => Math.max(next, item.id + 1), 1); currentSeries = series.find((item) => item.id === saved.currentId) || series.at(-1) || null;
  markers = {}; if (saved.markers && typeof saved.markers === "object") series.forEach((item) => { const marker = saved.markers[item.id]; const point = item.points.find((p) => marker && pointKey(p) === pointKey(marker)); if (point) markers[item.id] = point; });
  running = false; $("measurement-status").textContent = "Messung gestoppt."; renderSeriesControls();
  if (series.some((item) => item.id === saved.selectedId)) $("selected-series").value = String(saved.selectedId);
  renderAll();
});
progress.registerPart("quiz", () => ({ answers: questions.map((q) => q.answerSet()), checked: { ...checked } }), (saved) => {
  if (!saved || !Array.isArray(saved.answers) || saved.answers.length !== questions.length) return;
  questions.forEach((q, i) => { const arr = saved.answers[i]; if (!Array.isArray(arr) || arr.some((n) => !Number.isInteger(n) || n < 0 || n > 3)) return; q.fieldset.querySelectorAll("input").forEach((input, n) => { input.checked = arr.includes(n); }); if (saved.checked?.[q.id] === true) quizChecks.questions[i].showResult(); });
  updateQuizStatus();
});
// Radio/checkbox states are created before restoring; all handlers above are active.
restoring = true;
progress.restore();
restoring = false;
updateReadings(); renderAll();
