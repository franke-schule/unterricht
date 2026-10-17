import { setupPhysicsStepTabs } from "../1-Kreisbewegungen/components/physics-step-tabs.mjs";
import { createPhysicsTaskProgress } from "../1-Kreisbewegungen/components/physics-task-progress.mjs";

const sets = [
  { key: "knowledge", target: "knowledge-questions", questions: [
    { id: "W1", prompt: "Welche Aussagen zur Solarzelle passen zur gezeigten Alltagssituation?", options: ["Die Solarzelle wandelt Lichtenergie direkt in elektrische Energie um.", "Die Lampe schickt elektrischen Strom direkt in die Solarzelle.", "Ein angeschlossenes Gerät kann die abgegebene elektrische Energie nutzen.", "Die Solarzelle erzeugt Energie aus dem Nichts."], correct: [0, 2], help: ["Verfolge in der Skizze die beiden Energiepfeile.", "Licht kommt an der Solarzelle an; danach fließt elektrische Energie zum Gerät.", "Die Aussage zur direkten Umwandlung von Lichtenergie ist richtig. Prüfe, wohin die elektrische Energie weitergegeben wird."], feedback: ["Korrekt. Lichtenergie wird in elektrische Energie umgewandelt und kann ein Gerät versorgen.", "Teilweise korrekt. Prüfe beide Energiepfeile und streiche Aussagen, die Energie aus dem Nichts oder einen elektrischen Anschluss der Lampe an die Zelle behaupten.", "Noch nicht korrekt. Beginne beim Lichtpfeil zur Solarzelle und verfolge danach den elektrischen Energiepfeil."] },
    { id: "W2", prompt: "Welche Aussagen zu den beiden Endpunkten der U-I-Kennlinie sind richtig?", options: ["Im Leerlauf ist I = 0.", "Beim idealisierten Kurzschluss ist U ungefähr 0.", "Beim Kurzschluss ist die abgegebene Leistung am größten.", "An beiden idealisierten Endpunkten ist P = U · I gleich 0."], correct: [0, 1, 3], help: ["Lies an jedem Endpunkt ab, welche Größe null ist.", "In einem Produkt genügt ein Faktor null, damit das Produkt null wird.", "Im Leerlauf ist I = 0; setze das in P = U · I ein."], feedback: ["Korrekt. Im Leerlauf ist I = 0, beim idealisierten Kurzschluss U ≈ 0; an beiden Endpunkten ist die Leistung null.", "Teilweise korrekt. Prüfe beide Endpunkte einzeln und multipliziere dort U und I.", "Noch nicht korrekt. Suche zuerst den Endpunkt mit I = 0 und den mit U ≈ 0."] },
    { id: "W3", prompt: "Was zeigen die Punkte A, B und C der illustrierten Kennlinie über den MPP?", options: ["Bei B ist das Produkt aus gleichzeitigem U und I am größten.", "C hat die größte Spannung und deshalb auch die größte Leistung.", "Die maximale Leistung ergibt sich aus U₀ · Iₖ.", "Für die Leistung müssen U und I vom selben Arbeitspunkt stammen."], correct: [0, 3], help: ["Vergleiche die drei markierten Rechtecke.", "Rechne für A, B und C jeweils mit den zwei Werten desselben Punkts.", "Für A ergibt 0,20 V · 0,49 A = 0,098 W; vergleiche das mit B und C."], feedback: ["Korrekt. B hat das größte Produkt aus gleichzeitig gemessener Spannung und Stromstärke.", "Teilweise korrekt. Vergleiche die drei Produkte; die größte Spannung allein entscheidet nicht.", "Noch nicht korrekt. Verwende für jedes Produkt nur Werte desselben markierten Punkts."] },
  ] },
  { key: "setup", target: "setup-questions", questions: [
    { id: "A1", prompt: "Wie werden die beiden Multimeter im Messkreis angeschlossen?", options: ["Das Amperemeter liegt in Reihe mit dem Widerstand.", "Das Voltmeter liegt parallel zur Solarzelle.", "Das Voltmeter liegt in Reihe mit dem Widerstand.", "Das Amperemeter wird parallel zur Solarzelle angeschlossen."], correct: [0, 1], help: ["Verfolge den Weg des Stroms durch das A-Meter.", "Stromstärke misst du im Stromweg, Spannung zwischen zwei Anschlüssen.", "Das A-Meter liegt im Stromweg mit dem Widerstand. Suche nun die zwei Anschlüsse für das V-Meter."], feedback: ["Korrekt. Das Amperemeter liegt in Reihe, das Voltmeter parallel zur Solarzelle.", "Teilweise korrekt. Prüfe, welches Messgerät im Stromweg liegt und welches zwei Anschlüsse verbindet.", "Noch nicht korrekt. Verfolge im Schaltbild zuerst den geschlossenen Stromkreis."] },
    { id: "A2", prompt: "Welche Aufgaben haben Widerstand und Lampe in diesem Versuch?", options: ["Durch Ändern des Widerstands entstehen verschiedene Arbeitspunkte.", "Die Lampe beleuchtet die Solarzelle und hat eine eigene elektrische Versorgung.", "Das Netzgerät der Lampe wird elektrisch an die Solarzelle angeschlossen.", "Während einer Messreihe verändern wir ständig den Lampenabstand."], correct: [0, 1], help: ["Trenne in der Aufbauskizze Lichtweg und elektrische Leitungen.", "Während einer Messreihe soll nur eine Größe gezielt verändert werden.", "Der veränderliche Widerstand verschiebt den Arbeitspunkt; prüfe die eigene Versorgung der Lampe."], feedback: ["Korrekt. Der Widerstand verändert den Arbeitspunkt; die Lampe beleuchtet die Zelle aus einem getrennten Stromkreis.", "Teilweise korrekt. Prüfe den getrennten Lampenstromkreis und die innerhalb einer Reihe konstante Beleuchtung.", "Noch nicht korrekt. Suche im Schaltbild die elektrische Trennung zwischen Lampe und Solarzelle."] },
    { id: "A3", prompt: "Was bleibt innerhalb einer Messreihe gleich, und was wird gezielt verändert?", options: ["Innerhalb einer Reihe bleiben Lampeneinstellung und Abstand möglichst gleich.", "Innerhalb einer Reihe wird der Widerstand verändert.", "Zwischen zwei Reihen kann die Beleuchtung verändert werden.", "Spannung und Stromstärke dürfen aus verschiedenen Einstellungen zu einem Paar kombiniert werden."], correct: [0, 1, 2], help: ["Unterscheide eine Reihe von dem Vergleich zweier Reihen.", "Ein U-I-Punkt braucht Werte, die gleichzeitig bei derselben Einstellung gelten.", "Innerhalb einer Reihe verändert sich der Widerstand; die Beleuchtung bleibt möglichst gleich."], feedback: ["Korrekt. Pro Reihe ändert sich der Widerstand, zwischen Reihen die Beleuchtung; U und I bleiben jeweils ein Paar.", "Teilweise korrekt. Trenne die Änderung innerhalb einer Reihe vom Vergleich zwischen Reihen und prüfe, welche U-I-Werte zusammengehören.", "Noch nicht korrekt. Beginne mit der Frage: Was verstellst du, um einen neuen Punkt auf derselben Kennlinie zu erhalten?"] },
  ] },
  { key: "final", target: "final-questions", questions: [
    { id: "F1", prompt: "Drei gleichzeitig gemessene Paare sind A: 0,20 V und 0,45 A; B: 0,40 V und 0,40 A; C: 0,50 V und 0,15 A. Welche Aussagen stimmen?", options: ["B hat mit 0,160 W die größte Leistung der drei Punkte.", "C hat die größte Spannung der drei Punkte.", "C hat deshalb auch die größte Leistung.", "Für jeden Punkt wird die Leistung aus seinem eigenen U-I-Paar berechnet."], correct: [0, 1, 3], help: ["Die größte Spannung muss nicht das größte Produkt liefern.", "Multipliziere bei A, B und C jeweils die beiden zusammengehörigen Zahlen.", "Bei A erhältst du 0,20 V · 0,45 A = 0,090 W; vergleiche mit B und C."], feedback: ["Korrekt. B hat 0,160 W und damit mehr als A mit 0,090 W und C mit 0,075 W, obwohl C die größte Spannung hat.", "Teilweise korrekt. Berechne die drei Produkte einzeln; trenne die Frage nach der größten Spannung von der nach der größten Leistung.", "Noch nicht korrekt. Beginne mit P = U · I für A und verwende danach die jeweiligen Paare von B und C."] },
    { id: "F2", prompt: "Jemand berechnet U₀ · Iₖ und nennt das die maximale Leistung der Solarzelle. Was ist daran zu prüfen?", options: ["U₀ und Iₖ stammen von verschiedenen Arbeitspunkten.", "Das Produkt U₀ · Iₖ ist immer genau Pₘₚₚ.", "Für eine tatsächliche Leistung werden gleichzeitig passende U- und I-Werte gebraucht.", "An beiden idealisierten Endpunkten selbst ist P = 0."], correct: [0, 2, 3], help: ["Wo liegen U₀ und Iₖ auf der Kennlinie?", "Prüfe, ob beide Werte am selben Punkt gleichzeitig auftreten.", "U₀ gehört zum Leerlauf mit I = 0; suche den Punkt von Iₖ."], feedback: ["Korrekt. U₀ und Iₖ gehören nicht zum selben Arbeitspunkt; am jeweiligen Endpunkt ist das Produkt U · I null.", "Teilweise korrekt. Ordne U₀ und Iₖ ihren jeweiligen Endpunkten zu und prüfe dort P = U · I.", "Noch nicht korrekt. Lies die beiden Endpunkte der U-I-Kennlinie getrennt ab."] },
    { id: "F3", prompt: "Du willst zwei U-I-Kennlinien bei unterschiedlicher Beleuchtung aufnehmen. Welche Schritte sind sinnvoll?", options: ["Während jeder Reihe bleiben Lampeneinstellung, Abstand und Ausrichtung möglichst gleich.", "Zwischen den Reihen wird die Beleuchtung gezielt geändert.", "Zu jeder Widerstandseinstellung werden U und I als Paar notiert.", "Innerhalb einer Reihe werden Widerstand, Lampenabstand und Ausrichtung gleichzeitig geändert."], correct: [0, 1, 2], help: ["Für einen fairen Vergleich brauchst du pro Reihe klare Bedingungen.", "Neue Punkte einer Kennlinie entstehen durch verschiedene Widerstandseinstellungen bei gleicher Beleuchtung.", "Halte die Beleuchtung innerhalb einer Reihe gleich; überlege, wann du sie ändern darfst."], feedback: ["Korrekt. Je Reihe variiert der Widerstand, zwischen Reihen die Beleuchtung; zu jeder Einstellung gehören U und I zusammen.", "Teilweise korrekt. Prüfe den Unterschied zwischen Variation innerhalb und zwischen den Messreihen.", "Noch nicht korrekt. Plane zuerst eine einzelne Kennlinie bei möglichst gleichbleibender Beleuchtung."] },
    { id: "F4", prompt: "Bei einem Versuch liefert Punkt B das größte Produkt der bisher gemessenen U-I-Paare. Welche Schlüsse sind zulässig?", options: ["B ist der beste unter den bisher gemessenen Punkten.", "Damit ist der genaue MPP ohne weitere Messung bewiesen.", "Zusätzliche Punkte in der Nähe von B können die MPP-Schätzung verbessern.", "Bei geänderter Beleuchtung kann der MPP an einem anderen Arbeitspunkt liegen."], correct: [0, 2, 3], help: ["Denke an die Lücken zwischen zwei gemessenen Punkten.", "Ein Maximum unter wenigen gemessenen Werten ist zunächst nur eine Näherung.", "B ist der beste bereits erfasste Punkt. Prüfe, was zusätzliche Punkte und neue Beleuchtung ändern können."], feedback: ["Korrekt. B ist der beste gemessene Punkt; weitere Messungen können die Lage des MPP genauer eingrenzen.", "Teilweise korrekt. Unterscheide den besten gemessenen Punkt vom genauen Maximum und denke an andere Beleuchtung.", "Noch nicht korrekt. Überlege, welche Aussage durch die bisher gemessenen Punkte tatsächlich belegt ist."] },
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
  const names = { knowledge: "Wissenscheck", setup: "Versuchsaufbau", final: "Abschlussquiz" };
  sets.forEach((set) => {
    const count = allQuestions.filter((question) => question.setKey === set.key && isQuestionCurrent(question)).length;
    const total = allQuestions.filter((question) => question.setKey === set.key).length;
    const status = document.querySelector(`[data-set-status="${set.key}"]`);
    status.textContent = count === total ? `${count} von ${total} Fragen korrekt geprüft. Fragesatz abgeschlossen.` : `${count} von ${total} Fragen korrekt geprüft.`;
  });
  const totalCorrect = allQuestions.filter(isQuestionCurrent).length;
  document.getElementById("final-feedback").textContent = totalCorrect === 10 ? "Bereit für das Experiment: Du kennst die Messgrößen, den Aufbau und den Weg zur MPP-Schätzung." : "";
}

function updateSummaryAvailability() {
  const summary = document.getElementById("quiz-summary");
  const unlocked = allQuestions.length === 10 && allQuestions.every(isQuestionCurrent);
  summary.hidden = !unlocked;
  if (unlocked) document.getElementById("final-feedback").textContent = "Bereit für das Experiment: Du kennst die Messgrößen, den Aufbau und den Weg zur MPP-Schätzung.";
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
  const allFinalCorrect = finalQuestions.every(isQuestionCurrent);
  const feedback = document.getElementById("final-feedback");
  if (!allFinalCorrect) {
    feedback.textContent = "Noch sind nicht alle Transferfragen vollständig richtig. Prüfe die Rückmeldungen direkt unter den Fragen und versuche es erneut.";
    return;
  }
  const knowledgeOpen = !setComplete("knowledge");
  const setupOpen = !setComplete("setup");
  feedback.textContent = "Alle vier Transferfragen sind richtig. Prüfe für die Gesamtübersicht gegebenenfalls noch die offenen Fragen aus Wissenscheck oder Versuchsaufbau.";
  if (!knowledgeOpen && !setupOpen) {
    feedback.textContent = "Bereit für das Experiment: Du kennst die Messgrößen, den Aufbau und den Weg zur MPP-Schätzung.";
    renderSummary();
    updateSummaryAvailability();
  } else {
    const missing = [knowledgeOpen ? "Wissenscheck" : "", setupOpen ? "Versuchsaufbau" : ""].filter(Boolean).join(" und ");
    feedback.textContent += ` Offen: ${missing}.`;
  }
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
    grid += `<line x1="${left}" y1="${y}" x2="${right}" y2="${y}" class="graph-grid"/><text x="${left - 10}" y="${y + 5}" text-anchor="end" class="graph-tick">${value.toFixed(2).replace(".", ",")}</text>`;
  }
  for (let value = 0; value <= .60001; value += .1) {
    const x = sx(value);
    grid += `<line x1="${x}" y1="${top}" x2="${x}" y2="${bottom}" class="graph-grid"/><text x="${x}" y="${bottom + 24}" text-anchor="middle" class="graph-tick">${value.toFixed(2).replace(".", ",")}</text>`;
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
    ? "P-U-Diagramm der illustrativen einzelnen Solarzelle. U-Achse horizontal von 0,00 bis 0,60 V, P-Achse vertikal von 0,00 bis 0,20 W. An beiden Endpunkten ist P = 0: bei 0,00 V und bei 0,60 V. Die markierten Paare sind A: 0,20 V und 0,49 A; B: 0,45 V und 0,44 A; C: 0,54 V und 0,20 A. Der Höchstwert liegt bei B mit 0,198 W bei 0,45 V."
    : "U-I-Kennlinie einer illustrativen einzelnen Solarzelle. U-Achse horizontal von 0,00 bis 0,60 V, I-Achse vertikal von 0,00 bis 0,50 A. Die Leerlaufspannung U mit Index null liegt bei 0,60 V und 0 A, die Kurzschlussstromstärke I mit Index k bei 0 V und 0,50 A. Markierte Paare: A 0,20 V und 0,49 A; B 0,45 V und 0,44 A; C 0,54 V und 0,20 A.";
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${alt}"><defs><marker id="${kind}-axis-arrow" markerWidth="9" markerHeight="9" refX="7" refY="4" orient="auto"><path d="M0 0L0 8L8 4z" fill="#263d53"/></marker></defs>${grid}<line x1="${left}" y1="${bottom}" x2="${right + 14}" y2="${bottom}" class="graph-axis" marker-end="url(#${kind}-axis-arrow)"/><line x1="${left}" y1="${bottom}" x2="${left}" y2="${top - 12}" class="graph-axis" marker-end="url(#${kind}-axis-arrow)"/><path d="${curve}" class="graph-curve ${isPower ? "power" : "current"}"/>${extras}<text x="${right}" y="${bottom + 49}" text-anchor="end" class="graph-axis-title">U (V)</text><text x="23" y="${top - 14}" class="graph-axis-title">${yTitle}</text>${isPower ? `<text x="${left - 58}" y="${bottom - 15}" class="graph-end-label">P = 0</text><text x="${right - 52}" y="${bottom - 15}" class="graph-end-label">P = 0</text>` : `<text x="${sx(.60) - 31}" y="${sy(0) - 11}" class="graph-end-label">U₀</text><text x="${left + 8}" y="${sy(.50) - 7}" class="graph-end-label">Iₖ</text>`}</svg>`;
}
document.getElementById("ui-graph").innerHTML = graphSvg("current");
document.getElementById("pu-graph").innerHTML = graphSvg("power");

renderSummary();
progress.registerPart("quiz-state", () => ({ checkedCorrectly, checkedAnswers, summaryVisible: !document.getElementById("quiz-summary").hidden }), (state) => {
  if (!state || typeof state !== "object") return;
  allQuestions.forEach((question) => {
    const savedAnswers = state.checkedAnswers?.[question.id];
    const valid = state.checkedCorrectly?.[question.id] === true && Array.isArray(savedAnswers) && JSON.stringify(savedAnswers) === JSON.stringify(question.answerSnapshot()) && checkOutcome(question).result === "correct";
    checkedCorrectly[question.id] = valid;
    checkedAnswers[question.id] = valid ? savedAnswers : null;
    question.fieldset.classList.toggle("is-correct", valid);
  });
  updateStatuses();
  updateSummaryAvailability();
});
progress.restore();
updateStatuses();
updateSummaryAvailability();
