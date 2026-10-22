import { setupPhysicsStepTabs } from "../1-Kreisbewegungen/components/physics-step-tabs.mjs";
import { createPhysicsTaskProgress } from "../1-Kreisbewegungen/components/physics-task-progress.mjs";
import { setupPhysicsSemanticTask } from "../1-Kreisbewegungen/components/physics-semantic-task.mjs?v=20261022-feedback-two-sentences";

const sets = [
  { key: "knowledge", target: "knowledge-questions", questions: [
    { id: "W1", prompt: "Welche Aussagen zur Solarzelle passen zur gezeigten Alltagssituation?", options: ["Die Solarzelle wandelt Lichtenergie direkt in elektrische Energie um.", "Die Sonne schickt elektrischen Strom direkt in die Solarzelle.", "Ein angeschlossenes Gerät kann die abgegebene elektrische Energie nutzen.", "Die Solarzelle erzeugt Energie aus dem Nichts."], correct: [0, 2], help: ["Verfolge in der Skizze die beiden Energiepfeile.", "Licht kommt an der Solarzelle an; danach fließt elektrische Energie zum Gerät.", "Die Aussage zur direkten Umwandlung von Lichtenergie ist richtig. Prüfe, wohin die elektrische Energie weitergegeben wird."], feedback: ["Korrekt. Lichtenergie wird in elektrische Energie umgewandelt und kann ein Gerät versorgen.", "Teilweise korrekt. Prüfe beide Energiepfeile und streiche Aussagen, die Energie aus dem Nichts oder einen elektrischen Anschluss der Sonne an die Zelle behaupten.", "Noch nicht korrekt. Beginne beim Lichtpfeil zur Solarzelle und verfolge danach den elektrischen Energiepfeil."] },
    { id: "W2", prompt: "Welche Aussagen zu den beiden Endpunkten der U-I-Kennlinie sind richtig?", options: ["Im Leerlauf ist I = 0 A.", "Beim idealisierten Kurzschluss ist U ungefähr 0 V.", "Beim Kurzschluss ist die abgegebene Leistung am größten.", "An beiden idealisierten Endpunkten ist P = U · I gleich 0 W."], correct: [0, 1, 3], help: ["Lies an jedem Endpunkt ab, welche Größe null ist.", "In einem Produkt genügt ein Faktor null, damit das Produkt null wird.", "Im Leerlauf ist I = 0 A; setze das in P = U · I ein."], feedback: ["Korrekt. Im Leerlauf ist I = 0 A, beim idealisierten Kurzschluss U ≈ 0 V; an beiden Endpunkten ist die Leistung 0 W.", "Teilweise korrekt. Prüfe beide Endpunkte einzeln und multipliziere dort U und I.", "Noch nicht korrekt. Suche zuerst den Endpunkt mit I = 0 A und den mit U ≈ 0 V."] },
    { id: "W3", prompt: "Was zeigen die Punkte A, B und C der illustrierten Kennlinie über den MPP?", options: ["Bei B ist das Produkt aus gleichzeitigem U und I am größten.", "C hat die größte Spannung und deshalb auch die größte Leistung.", "Die maximale Leistung ergibt sich aus U₀ · Iₖ.", "Für die Leistung müssen U und I vom selben Punkt stammen."], correct: [0, 3], help: ["Vergleiche die drei markierten Rechtecke.", "Rechne für A, B und C jeweils mit den zwei Werten desselben Punkts.", "Für A ergibt 0,20 V · 0,49 A = 0,098 W; vergleiche das mit B und C."], feedback: ["Korrekt. B hat das größte Produkt aus gleichzeitig gemessener Spannung und Stromstärke.", "Teilweise korrekt. Vergleiche die drei Produkte; die größte Spannung allein entscheidet nicht.", "Noch nicht korrekt. Verwende für jedes Produkt nur Werte desselben markierten Punkts."] },
  ] },
  { key: "final", target: "final-questions", questions: [
    { id: "F1", prompt: "Drei gleichzeitig gemessene Paare sind A: 0,20 V und 0,45 A; B: 0,40 V und 0,40 A; C: 0,50 V und 0,15 A. Welche Aussagen stimmen?", options: ["B hat mit 0,160 W die größte Leistung der drei Punkte.", "C hat die größte Spannung der drei Punkte.", "C hat deshalb auch die größte Leistung.", "Für jeden Punkt wird die Leistung aus seinem eigenen U-I-Paar berechnet."], correct: [0, 1, 3], help: ["Die größte Spannung muss nicht das größte Produkt liefern.", "Multipliziere bei A, B und C jeweils die beiden zusammengehörigen Zahlen.", "Bei A erhältst du 0,20 V · 0,45 A = 0,090 W; vergleiche mit B und C."], feedback: ["Korrekt. B hat 0,160 W und damit mehr als A mit 0,090 W und C mit 0,075 W, obwohl C die größte Spannung hat.", "Teilweise korrekt. Berechne die drei Produkte einzeln; trenne die Frage nach der größten Spannung von der nach der größten Leistung.", "Noch nicht korrekt. Beginne mit P = U · I für A und verwende danach die jeweiligen Paare von B und C."] },
    { id: "F2", prompt: "Jemand berechnet U₀ · Iₖ und nennt das die maximale Leistung der Solarzelle. Was ist daran zu prüfen?", options: ["U₀ und Iₖ stammen von verschiedenen Punkten.", "Das Produkt U₀ · Iₖ ist immer genau Pₘₚₚ.", "Für eine tatsächliche Leistung werden gleichzeitig passende U- und I-Werte gebraucht.", "An beiden idealisierten Endpunkten selbst ist P = 0 W."], correct: [0, 2, 3], help: ["Wo liegen U₀ und Iₖ auf der Kennlinie?", "Prüfe, ob beide Werte am selben Punkt gleichzeitig auftreten.", "U₀ gehört zum Leerlauf mit I = 0 A; suche den Punkt von Iₖ."], feedback: ["Korrekt. U₀ und Iₖ gehören nicht zum selben Punkt; am jeweiligen Endpunkt ist das Produkt U · I gleich 0 W.", "Teilweise korrekt. Ordne U₀ und Iₖ ihren jeweiligen Endpunkten zu und prüfe dort P = U · I.", "Noch nicht korrekt. Lies die beiden Endpunkte der U-I-Kennlinie getrennt ab."] },
    { id: "F3", prompt: "Eine Mitschülerin möchte die Messgeräte in den Solarzellenkreis einbauen. Welche Anschlüsse passen zum Schaltplan?", options: ["Das Amperemeter wird in den geschlossenen Stromweg eingefügt.", "Das Voltmeter wird mit beiden Anschlüssen der Solarzelle verbunden.", "Das Amperemeter wird parallel zur Solarzelle angeschlossen.", "Das Voltmeter ersetzt den Widerstand im Stromweg."], correct: [0, 1], help: ["Verfolge die Leitungen an A und V im Schaltplan.", "Ein Messgerät liegt im Stromweg; das andere verbindet zwei Anschlüsse der Solarzelle.", "Das Amperemeter gehört in den Stromweg. Prüfe nun die beiden Leitungen des Voltmeters."], feedback: ["Korrekt. A liegt in Reihe; V ist parallel an die Solarzelle angeschlossen.", "Teilweise korrekt. Prüfe für beide Messgeräte getrennt, ob sie im Stromweg oder zwischen zwei Anschlüssen liegen.", "Noch nicht korrekt. Beginne beim geschlossenen Weg von der Solarzelle durch den Widerstand."] },
    { id: "F4", prompt: "Du veränderst bei gleicher Beleuchtung den Widerstand und liest neue Werte ab. Welche Aussagen sind richtig?", options: ["Zu jeder Widerstandseinstellung gehören gleichzeitig eine Spannung U und eine Stromstärke I.", "Jedes zusammengehörige U-I-Paar beschreibt einen Punkt der Kennlinie.", "Für einen Punkt darf ich U aus der ersten und I aus der zweiten Einstellung kombinieren.", "Jeder Punkt der Kennlinie hat automatisch dieselbe Leistung."], correct: [0, 1], help: ["Denke an die zusammengehörigen Werte eines Kurvenpunkts.", "Wenn der Widerstand verändert wird, können sich U und I gemeinsam ändern.", "Ein Punkt entsteht aus U und I derselben Einstellung. Prüfe, welche Aussagen genau das beachten."], feedback: ["Korrekt. Jede Widerstandseinstellung liefert ein zusammengehöriges U-I-Paar und damit einen Punkt der Kennlinie.", "Teilweise korrekt. Prüfe, ob beide Werte wirklich aus derselben Einstellung stammen und ob ihre Produkte gleich sein müssen.", "Noch nicht korrekt. Beginne mit einer einzelnen Widerstandseinstellung und ihren beiden gleichzeitig abgelesenen Werten."] },
  ] },
];

const allQuestions = [];
function renderQuestion(question, setIndex, position, target) {
  const fieldset = document.createElement("fieldset");
  fieldset.className = "physics-quiz-question";
  fieldset.dataset.question = question.id;
  const legend = document.createElement("legend");
  legend.id = `legend-${question.id}`;
  legend.textContent = `${question.id} · ${question.prompt}`;
  fieldset.setAttribute("aria-labelledby", legend.id);
  fieldset.append(legend);
  const options = document.createElement("div");
  options.className = "quiz-options";
  question.options.forEach((text, optionIndex) => {
    const label = document.createElement("label");
    label.className = "quiz-option";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.name = `${question.id.toLowerCase()}-answer`;
    input.value = String(optionIndex);
    input.setAttribute("aria-label", `${question.id}, Antwort ${String.fromCharCode(65 + optionIndex)}: ${text}`);
    const span = document.createElement("span");
    span.textContent = text;
    label.append(input, span);
    options.append(label);
  });
  fieldset.append(options);
  const help = document.createElement("div");
  help.className = "physics-help-stack";
  question.help.forEach((text, index) => {
    const details = document.createElement("details");
    details.dataset.questionHelp = question.id;
    const summary = document.createElement("summary");
    summary.textContent = `Hilfe ${index + 1}: ${["Hinweis", "Denkansatz", "Teillösung"][index]}`;
    const paragraph = document.createElement("p");
    paragraph.textContent = text;
    details.append(summary, paragraph);
    help.append(details);
  });
  fieldset.append(help);
  const feedbackElement = document.createElement("p");
  feedbackElement.className = "physics-feedback quiz-question-feedback";
  feedbackElement.setAttribute("role", "status");
  feedbackElement.setAttribute("aria-live", "polite");
  feedbackElement.hidden = true;
  fieldset.append(feedbackElement);
  target.append(fieldset);
  const answerSnapshot = () => [...fieldset.querySelectorAll("input")].map((input) => input.checked);
  const selectedCorrect = () => [...fieldset.querySelectorAll("input")].map((input, index) => input.checked && question.correct.includes(index)).some(Boolean);
  const feedback = {
    correct: question.feedback[0],
    partial: question.feedback[1],
    wrong: question.feedback[2],
    empty: "Kreuze mindestens eine Antwort an.",
  };
  allQuestions.push({ ...question, setKey: sets[setIndex].key, setPosition: position, fieldset, answerSnapshot, selectedCorrect, feedback });
}

sets.forEach((set, setIndex) => set.questions.forEach((question, index) => renderQuestion(question, setIndex, index + 1, document.getElementById(set.target))));

const checkedAnswers = {};
const checkedCorrectly = {};
const progress = createPhysicsTaskProgress("photovoltaik-aufgabe1");
const tabs = setupPhysicsStepTabs();
let checkedDescription = null;
const descriptionText = () => document.getElementById("pv-description-answer").value;
function descriptionCorrect() { return checkedDescription === descriptionText() && document.getElementById("pv-description-feedback").dataset.status === "korrekt"; }
setupPhysicsSemanticTask({ answerId: "pv-description-answer", buttonId: "pv-description-check", feedbackId: "pv-description-feedback", countId: "pv-description-count", taskId: "ph11-photovoltaik-schaltplan-beschreibung", minimumLength: 30, fallbackMaxPoints: 4, shortAnswerHint: "Beschreibe die Verbindung von Solarzelle, Widerstand und Messgeräten in mehreren Worten.", feedbackBuilder: () => { const p=document.createElement("p"); p.textContent="Deine Antwort bleibt erhalten. Versuche die automatische Prüfung später erneut."; return p; } });
document.getElementById("pv-description-answer").addEventListener("input", () => { checkedDescription=null; updateSummaryAvailability(); });
const semanticFeedback=document.getElementById("pv-description-feedback");
new MutationObserver(() => { if (semanticFeedback.dataset.status === "korrekt") checkedDescription=descriptionText(); else if (semanticFeedback.dataset.status === "nicht geprüft" || semanticFeedback.dataset.status === "noch nicht korrekt" || semanticFeedback.dataset.status === "teilweise korrekt") checkedDescription=null; updateSummaryAvailability(); progress.save(); }).observe(semanticFeedback,{attributes:true,attributeFilter:["data-status"],childList:true,subtree:true});
document.querySelectorAll("[data-next-tab]").forEach((button) => button.addEventListener("click", () => tabs.goToTab(button.dataset.nextTab)));

function setCorrectMark(question, correct) {
  checkedCorrectly[question.id] = Boolean(correct);
  checkedAnswers[question.id] = correct ? question.answerSnapshot() : null;
  question.fieldset.classList.toggle("is-correct", Boolean(correct));
  question.fieldset.classList.toggle("is-wrong", !correct);
  updateStatuses();
  updateSummaryAvailability();
}

function isQuestionCurrent(question) {
  return checkedCorrectly[question.id] && JSON.stringify(checkedAnswers[question.id]) === JSON.stringify(question.answerSnapshot());
}

function setComplete(key) {
  const selected = allQuestions.filter((question) => question.setKey === key);
  return selected.length > 0 && selected.every(isQuestionCurrent);
}

function updateStatuses() {
  sets.forEach((set) => {
    const count = allQuestions.filter((question) => question.setKey === set.key && isQuestionCurrent(question)).length;
    const total = allQuestions.filter((question) => question.setKey === set.key).length;
    const status = document.querySelector("[data-set-status=\"" + set.key + "\"]");
    status.textContent = count === total ? count + " von " + total + " Fragen korrekt geprüft. Fragesatz abgeschlossen." : count + " von " + total + " Fragen korrekt geprüft.";
  });
}

function updateSummaryAvailability() {
  const summary = document.getElementById("quiz-summary");
  const unlocked = allQuestions.length === 7 && allQuestions.every(isQuestionCurrent) && descriptionCorrect();
  summary.hidden = !unlocked;
  if (!unlocked && document.getElementById("final-feedback").textContent.startsWith("Bereit für das Experiment:")) document.getElementById("final-feedback").textContent = "";
  if (unlocked) {
    renderSummary();
    document.getElementById("final-feedback").textContent = "Bereit für das Experiment: Du kannst Kennlinie, Leistung und Schaltplan erklären.";
  }
}

function checkOutcome(question) {
  const selected = question.answerSnapshot().flatMap((checked, index) => checked ? [index] : []);
  if (!selected.length) return { result: "empty", text: question.feedback.empty };
  const countCorrect = selected.filter((index) => question.correct.includes(index)).length;
  const fullyCorrect = countCorrect === question.correct.length && selected.length === question.correct.length;
  if (fullyCorrect) return { result: "correct", text: question.feedback.correct };
  return countCorrect ? { result: "mixed", text: question.feedback.partial } : { result: "wrong", text: question.feedback.wrong };
}

const helpers = new Map();
sets.forEach((set) => {
  const qs = allQuestions.filter((question) => question.setKey === set.key);
  const checkApi = window.addQuizQuestionChecks({
    questions: qs.map((question) => ({ fieldset: question.fieldset, number: question.setPosition, check: () => checkOutcome(question), feedback: question.fieldset.querySelector(".quiz-question-feedback") })),
    buttonClass: "physics-primary-button",
    feedbackClass: "physics-feedback",
    levels: { high: "success", medium: "partial", low: "error" },
    onCheck: (helperQuestion, result) => {
      const question = qs.find((item) => item.fieldset === helperQuestion.fieldset);
      setCorrectMark(question, result === "correct");
    },
    onAllCorrect: () => { if (set.key === "final") evaluateFinal(); },
  });
  helpers.set(set.key, checkApi);
});

function renderSummary() {
  const host = document.getElementById("quiz-summary-answers");
  host.replaceChildren();
  allQuestions.forEach((question) => {
    const article = document.createElement("article");
    const heading = document.createElement("h3");
    heading.textContent = `${question.id} · ${question.prompt}`;
    const list = document.createElement("ul");
    question.options.forEach((option, index) => {
      if (question.correct.includes(index)) {
        const item = document.createElement("li");
        item.textContent = option;
        list.append(item);
      }
    });
    article.append(heading, list);
    host.append(article);
  });
}

function evaluateFinal() {
  const finalQuestions = allQuestions.filter((question) => question.setKey === "final");
  const feedback = document.getElementById("final-feedback");
  if (!finalQuestions.every(isQuestionCurrent)) {
    feedback.textContent = "Noch sind nicht alle Transferfragen vollständig richtig. Prüfe die Rückmeldungen direkt unter den Fragen und versuche es erneut.";
    return;
  }
  const missing = [!setComplete("knowledge") ? "Wissenscheck" : "", !descriptionCorrect() ? "Beschreibung des Schaltplans" : ""].filter(Boolean);
  if (missing.length) {
    feedback.textContent = "Alle vier Transferfragen sind richtig. Für die Gesamtübersicht fehlt noch " + missing.join(" oder ") + ".";
    return;
  }
  feedback.textContent = "Bereit für das Experiment: Du kannst Kennlinie, Leistung und Schaltplan erklären.";
  updateSummaryAvailability();
}

document.getElementById("evaluate-quiz").addEventListener("click", () => {
  const helper = helpers.get("final");
  helper.checkAll();
  evaluateFinal();
});

allQuestions.forEach((question) => question.fieldset.addEventListener("change", () => {
  checkedCorrectly[question.id] = false;
  checkedAnswers[question.id] = null;
  question.fieldset.classList.remove("is-correct", "is-wrong");
  updateStatuses();
  updateSummaryAvailability();
}));

const graphPoints = [
  [0, .50], [.10, .50], [.20, .49], [.30, .48], [.40, .46], [.45, .44], [.48, .41], [.50, .36], [.52, .29], [.54, .20], [.56, .10], [.58, .04], [.60, 0],
];
const marked = { A: [.20, .49], B: [.45, .44], C: [.54, .20] };
function interpolateI(u) {
  for (let index = 0; index < graphPoints.length - 1; index += 1) {
    const [u0, i0] = graphPoints[index]; const [u1, i1] = graphPoints[index + 1];
    if (u <= u1 + 1e-10) return i0 + (i1 - i0) * ((u - u0) / (u1 - u0));
  }
  return 0;
}

function graphSvg(kind) {
  const isPower = kind === "power";
  const W = 560, H = 410, left = 76, right = 510, top = 54, bottom = 316;
  const sx = (u) => left + u / .6 * (right - left);
  const sy = (value) => bottom - value / (isPower ? .20 : .50) * (bottom - top);
  const yTitle = isPower ? "P (W)" : "I (A)";
  const maxY = isPower ? .20 : .50;
  const stepY = isPower ? .05 : .10;
  let grid = "";
  for (let value = 0; value <= maxY + 1e-8; value += stepY) {
    const y = sy(value);
    grid += `<line x1="${left}" y1="${y}" x2="${right}" y2="${y}" class="graph-grid"/><text x="${left - 10}" y="${y + 5}" text-anchor="end" class="graph-tick">${value.toFixed(2).replace(".", ",")} ${isPower ? "W" : "A"}</text>`;
  }
  for (let value = 0; value <= .60001; value += .1) {
    const x = sx(value);
    grid += `<line x1="${x}" y1="${top}" x2="${x}" y2="${bottom}" class="graph-grid"/><text x="${x}" y="${bottom + 24}" text-anchor="middle" class="graph-tick">${value.toFixed(2).replace(".", ",")} V</text>`;
  }
  let curve = "";
  for (let index = 0; index <= 300; index += 1) {
    const u = .6 * index / 300;
    const value = isPower ? u * interpolateI(u) : interpolateI(u);
    curve += `${index ? "L" : "M"}${sx(u).toFixed(2)},${sy(value).toFixed(2)} `;
  }
  let extras = "";
  if (!isPower) {
    const colors = { A: "#ce7c22", B: "#168269", C: "#7656aa" };
    Object.entries(marked).forEach(([name, [u, current]]) => {
      const x = sx(u), y = sy(current), color = colors[name];
      extras += `<rect x="${sx(0)}" y="${y}" width="${x - sx(0)}" height="${bottom - y}" fill="${color}" fill-opacity=".14" stroke="${color}" stroke-width="1.5"/><circle cx="${x}" cy="${y}" r="5" fill="${color}"/><text x="${x + (name === "B" ? 9 : -17)}" y="${y - 10}" class="graph-point-label" fill="${color}">${name}${name === "B" ? " · MPP" : ""}</text>`;
    });
  } else {
    const colors = { A: "#ce7c22", B: "#168269", C: "#7656aa" };
    Object.entries(marked).forEach(([name, [u, current]]) => {
      const x = sx(u), y = sy(u * current), color = colors[name];
      extras += `<circle cx="${x}" cy="${y}" r="5" fill="${color}"/><text x="${x + (name === "C" ? -28 : 9)}" y="${y - 10}" class="graph-point-label" fill="${color}">${name}${name === "B" ? " · P<tspan baseline-shift=\"sub\" font-size=\"12\">mpp</tspan>" : ""}</text>`;
    });
  }
  const alt = isPower
    ? "P-U-Diagramm der illustrativen einzelnen Solarzelle. U-Achse horizontal von 0,00 V bis 0,60 V, P-Achse vertikal von 0,00 W bis 0,20 W. An beiden Endpunkten ist P = 0 W: bei 0,00 V und bei 0,60 V. Die markierten Paare sind A: 0,20 V und 0,49 A; B: 0,45 V und 0,44 A; C: 0,54 V und 0,20 A. Der Höchstwert liegt bei B mit 0,198 W bei 0,45 V."
    : "U-I-Kennlinie einer illustrativen einzelnen Solarzelle. U-Achse horizontal von 0,00 V bis 0,60 V, I-Achse vertikal von 0,00 A bis 0,50 A. Die Leerlaufspannung U mit Index null liegt bei 0,60 V und 0 A, die Kurzschlussstromstärke I mit Index k bei 0 V und 0,50 A. Markierte Paare: A 0,20 V und 0,49 A; B 0,45 V und 0,44 A; C 0,54 V und 0,20 A.";
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${alt}"><defs><marker id="${kind}-axis-arrow" markerWidth="9" markerHeight="9" refX="7" refY="4" orient="auto"><path d="M0 0L0 8L8 4z" fill="#263d53"/></marker></defs>${grid}<line x1="${left}" y1="${bottom}" x2="${right + 14}" y2="${bottom}" class="graph-axis" marker-end="url(#${kind}-axis-arrow)"/><line x1="${left}" y1="${bottom}" x2="${left}" y2="${top - 12}" class="graph-axis" marker-end="url(#${kind}-axis-arrow)"/><path d="${curve}" class="graph-curve ${isPower ? "power" : "current"}"/>${extras}<text x="${right}" y="${bottom + 49}" text-anchor="end" class="graph-axis-title">U (V)</text><text x="23" y="${top - 14}" class="graph-axis-title">${yTitle}</text>${isPower ? `<text x="${left - 58}" y="${bottom - 15}" class="graph-end-label">P = 0 W</text><text x="${right - 52}" y="${bottom - 15}" class="graph-end-label">P = 0 W</text>` : `<text x="${sx(.60) - 31}" y="${sy(0) - 11}" class="graph-end-label">U₀</text><text x="${left + 8}" y="${sy(.50) - 7}" class="graph-end-label">Iₖ</text>`}</svg>`;
}
document.getElementById("ui-graph").innerHTML = graphSvg("current");
document.getElementById("pu-graph").innerHTML = graphSvg("power");

renderSummary();
progress.registerPart("quiz-state", () => ({ checkedCorrectly, checkedAnswers, checkedDescription: descriptionCorrect() ? descriptionText() : null }), (state) => {
  if (!state || typeof state !== "object") return;
  allQuestions.forEach((question) => {
    const savedAnswers = state.checkedAnswers?.[question.id];
    const valid = state.checkedCorrectly?.[question.id] === true && Array.isArray(savedAnswers) && JSON.stringify(savedAnswers) === JSON.stringify(question.answerSnapshot()) && checkOutcome(question).result === "correct";
    checkedCorrectly[question.id] = valid;
    checkedAnswers[question.id] = valid ? savedAnswers : null;
    question.fieldset.classList.toggle("is-correct", valid);
  });
  checkedDescription = typeof state.checkedDescription === "string" && state.checkedDescription === descriptionText() ? state.checkedDescription : null;
  if (checkedDescription) document.getElementById("pv-description-feedback").dataset.status = "korrekt";
  updateStatuses();
  updateSummaryAvailability();
});
progress.restore();
updateStatuses();
updateSummaryAvailability();
