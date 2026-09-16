const STORAGE_KEY = 'informatik11-was-ist-ki-aufgabe0-v1';
const STEPS = ['rate', 'define', 'learning', 'errors', 'improve', 'finish'];

const RATING = [
  { name: 'Toaster', shortName: 'Toaster', answer: ['2'], reason: 'Ein einfacher Toaster arbeitet mit Zeitschaltung oder Thermostat. Nur wenige moderne Geräte erkennen die Bräunung mit KI.' },
  { name: 'Taschenrechner', shortName: 'Taschenrechner', answer: ['1'], reason: 'Er rechnet nach fest programmierten Rechenregeln und lernt nichts aus Beispielen.' },
  { name: 'Chatbot', shortName: 'Chatbot', answer: ['4'], reason: 'Moderne Chatbots erzeugen ihre Antworten mit KI-Sprachmodellen.' },
  { name: 'Selbstfahrender Kleinbus', shortName: 'Selbstfahrender Kleinbus', answer: ['4'], reason: 'Er erkennt Fahrbahn, Hindernisse und Personen mit KI-Systemen.' },
  { name: 'Saugroboter', shortName: 'Saugroboter', answer: ['2', '3'], reason: 'Einfache Modelle fahren nach festen Regeln, neuere erkennen Hindernisse und Räume mit KI.' },
  { name: 'Gesichtserkennung in der Kamera', shortName: 'Gesichtserkennung', answer: ['4'], reason: 'Die Kamera findet Gesichter im Bild mit KI-Verfahren der Bilderkennung.' },
  { name: 'Sprachassistent', shortName: 'Sprachassistent', answer: ['4'], reason: 'KI wandelt gesprochene Sprache in Text um und deutet die Anfrage.' },
  { name: 'Video- und Social-Media-Apps', shortName: 'Video- und Social-Media-Apps', answer: ['4'], reason: 'KI berechnet aus deinem Nutzungsverhalten, welche Videos und Beiträge dir vorgeschlagen werden.' },
];

const CLOZE_TERMS = [
  { key: 'Systeme', text: 'Systeme' },
  { key: 'menschlich', text: 'menschlich' },
  { key: 'simulieren', text: 'simulieren' },
  { key: 'programmierbar', text: 'programmierbar' },
  { key: 'Emotionen', text: 'Emotionen' },
  { key: 'Bewusstsein', text: 'Bewusstsein' },
  { key: 'selbstständig', text: 'selbstständig' },
  { key: 'Definition', text: 'Definition' },
];
const CLOZE_DISTRACTORS = [
  { key: 'Experte', text: 'Experte' },
  { key: 'Wesen', text: 'Wesen' },
  { key: 'verwenden', text: 'verwenden' },
];
const CLOZE_ALL_TERMS = [...CLOZE_TERMS, ...CLOZE_DISTRACTORS];
const CLOZE_WORD_BANK = [
  'Bewusstsein', 'Definition', 'Emotionen', 'Experte', 'menschlich',
  'programmierbar', 'selbstständig', 'simulieren', 'Systeme', 'verwenden', 'Wesen',
].map((key) => CLOZE_ALL_TERMS.find((term) => term.key === key));
const CLOZE_SENTENCE_PARTS = [
  'Künstliche Intelligenz beschreibt ',
  ', die mit Hilfe einer Wissensbasis u. a. ',
  'es Denken ',
  '. Sie sind ',
  '. Manche KI-Systeme können „lernen“. Kein KI-System hat ',
  ' oder ein ',
  ', kann etwas fühlen oder agiert vollkommen ',
  '. Es gibt keine einheitliche ',
  ' von Künstlicher Intelligenz.',
];

const QUIZ = [
  {
    q: '1. In welchen Beispielen stecken sehr oft KI-Systeme?',
    hint: 'Denke an die Musterlösung aus Reiter 1.',
    options: [
      { id: 'voice', text: 'Sprachassistent', correct: true },
      { id: 'face', text: 'Gesichtserkennung in der Smartphone-Kamera', correct: true },
      { id: 'calc', text: 'Einfacher Taschenrechner', correct: false },
      { id: 'video', text: 'Vorschläge in Video-Apps', correct: true },
    ],
  },
  {
    q: '2. Welche Aussagen passen zur Definition von KI?',
    hint: 'Vergleiche mit deinem Merksatz aus Reiter 2.',
    options: [
      { id: 'simulate', text: '„KI-Systeme simulieren u. a. menschliches Denken.“', correct: true },
      { id: 'programmable', text: '„KI-Systeme sind programmierbar.“', correct: true },
      { id: 'emotions', text: '„KI-Systeme haben Emotionen.“', correct: false },
      { id: 'definition', text: '„Es gibt eine einheitliche Definition von KI.“', correct: false },
    ],
  },
  {
    q: '3. Wie ordnet das lernende System eine Zeichnung ein?',
    hint: 'Lies die Merke-Box aus Reiter 3.',
    options: [
      { id: 'compare', text: 'Es vergleicht die Zeichnung mit seinem Erfahrungsschatz aus Beispielbildern.', correct: true },
      { id: 'probability', text: 'Es berechnet für jede Kategorie eine Wahrscheinlichkeit.', correct: true },
      { id: 'understand', text: 'Es versteht, dass ein Gesicht gemalt wurde.', correct: false },
      { id: 'ask', text: 'Es fragt bei einem Menschen nach.', correct: false },
    ],
  },
  {
    q: '4. Was bedeutet die Anzeige „Traurig: 99,4 %“?',
    hint: 'Eine Wahrscheinlichkeit ist keine Garantie.',
    options: [
      { id: 'likely', text: 'Das System hält „Traurig“ für sehr wahrscheinlich – die Einordnung kann trotzdem falsch sein.', correct: true },
      { id: 'certain', text: 'Das Bild ist sicher traurig.', correct: false },
      { id: 'humans', text: '99,4 % aller Menschen finden das Bild traurig.', correct: false },
    ],
  },
  {
    q: '5. Warum ordnet das System ein fröhliches Gesicht auf dem Kopf falsch ein?',
    hint: 'Vergleiche mit den Trainingsbildern aus Reiter 4.',
    options: [
      { id: 'no-rotated', text: 'In den Trainingsdaten kommen keine gedrehten Gesichter vor.', correct: true },
      { id: 'mouth', text: 'Der Mund ist dann nach unten gebogen wie bei den traurigen Beispielbildern.', correct: true },
      { id: 'intentional', text: 'Das System ist absichtlich ungenau.', correct: false },
      { id: 'known-categories', text: 'Das System kann nur die Kategorien ausgeben, die es im Training kennengelernt hat.', correct: true },
    ],
  },
  {
    q: '6. Womit lässt sich ein lernendes System verbessern?',
    hint: 'Überlege, was den Erfahrungsschatz größer macht.',
    options: [
      { id: 'more-data', text: 'Mit mehr und vielfältigeren Trainingsbeispielen', correct: true },
      { id: 'category', text: 'Mit einer zusätzlichen passenden Kategorie', correct: true },
      { id: 'delete', text: 'Indem man den Erfahrungsschatz löscht', correct: false },
      { id: 'feelings', text: 'Indem man dem System Gefühle programmiert', correct: false },
    ],
  },
];

function loadState() {
  const defaults = { active: 'rate', ratings: new Array(8).fill(''), clozeChoices: new Array(8).fill(''), rateChecked: false };
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (!parsed || typeof parsed !== 'object') return defaults;
    const ratings = defaults.ratings.map((value, index) => (Array.isArray(parsed.ratings) && ['1', '2', '3', '4'].includes(parsed.ratings[index]) ? parsed.ratings[index] : value));
    const clozeKeys = CLOZE_ALL_TERMS.map((term) => term.key);
    const clozeChoices = defaults.clozeChoices.map((value, index) => (Array.isArray(parsed.clozeChoices) && clozeKeys.includes(parsed.clozeChoices[index]) ? parsed.clozeChoices[index] : value));
    return { active: STEPS.includes(parsed.active) ? parsed.active : defaults.active, ratings, clozeChoices, rateChecked: parsed.rateChecked === true };
  } catch { return defaults; }
}
let state = loadState();
function saveState() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
  catch { document.querySelector('#save-status').textContent = 'Der Bearbeitungsstand konnte nicht lokal gespeichert werden.'; }
}
function feedback(id, kind, message, html = false) {
  const el = document.querySelector('#' + id);
  el.hidden = false;
  el.className = 'feedback ' + kind;
  if (html) el.innerHTML = message; else el.textContent = message;
}
function selectedValues(container) { return [...container.querySelectorAll('input[type=checkbox]:checked')].map((input) => input.value); }
function sameSet(values, expected) { return values.length === expected.length && expected.every((value) => values.includes(value)); }
function optionValues(container, onlyCorrect) {
  return [...container.querySelectorAll('input[type=checkbox]')]
    .filter((input) => !onlyCorrect || input.dataset.correct === 'true')
    .map((input) => input.value);
}
function optionTexts(container, onlyCorrect) {
  return [...container.querySelectorAll('input[type=checkbox]')]
    .filter((input) => !onlyCorrect || input.dataset.correct === 'true')
    .map((input) => input.closest('label').textContent.trim());
}

function showStep(id, focus = false) {
  if (!STEPS.includes(id)) return;
  document.querySelectorAll('[data-panel]').forEach((panel) => { panel.hidden = panel.dataset.panel !== id; });
  document.querySelectorAll('[data-tab]').forEach((tab) => { const chosen = tab.dataset.tab === id; tab.setAttribute('aria-selected', String(chosen)); tab.tabIndex = chosen ? 0 : -1; });
  state.active = id; saveState();
  document.querySelectorAll('#' + id + ' iframe[data-src]').forEach((iframe) => { if (!iframe.getAttribute('src')) iframe.src = iframe.dataset.src; });
  if (focus) {
    const heading = document.querySelector('#' + id + ' h2');
    if (heading && !heading.hasAttribute('tabindex')) heading.tabIndex = -1;
    heading?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    requestAnimationFrame(() => { const active = document.activeElement; if (active?.closest('#' + id)) return; heading?.focus({ preventScroll: true }); });
  }
}
function labelFor(id) { return document.querySelector('[data-tab=' + id + ']')?.textContent.replace(/^\d+\s*/, '') || id; }
function flowButton(text, target) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'primary-button';
  button.textContent = text;
  button.addEventListener('click', () => showStep(target, true));
  return button;
}
function setupTabs() {
  document.querySelectorAll('[data-tab]').forEach((tab) => {
    tab.addEventListener('click', () => showStep(tab.dataset.tab, true));
    tab.addEventListener('keydown', (event) => {
      const index = STEPS.indexOf(tab.dataset.tab);
      const move = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -1, ArrowDown: 1 }[event.key];
      let next = index;
      if (event.key === 'Home') next = 0;
      else if (event.key === 'End') next = STEPS.length - 1;
      else if (move) next = (index + move + STEPS.length) % STEPS.length;
      else return;
      event.preventDefault();
      showStep(STEPS[next]);
      document.querySelector('[data-tab=' + STEPS[next] + ']')?.focus();
    });
  });
  document.querySelectorAll('[data-flow]').forEach((container) => {
    const index = STEPS.indexOf(container.dataset.flow);
    const next = STEPS[index + 1];
    if (next) container.replaceChildren(flowButton('Weiter: ' + labelFor(next), next));
  });
  showStep(state.active);
}

function setupRating() {
  RATING.forEach((item, index) => {
    const select = document.querySelector('#rate-' + index);
    select.value = state.ratings[index] || '';
    select.addEventListener('change', () => {
      state.ratings[index] = select.value;
      select.classList.remove('is-correct', 'is-wrong');
      const mark = document.querySelector('#rate-mark-' + index);
      mark.textContent = '';
      mark.classList.remove('is-correct', 'is-wrong');
      saveState();
    });
  });
  const solutionList = document.querySelector('#rate-solution-list');
  solutionList.replaceChildren(...RATING.map((item) => {
    const li = document.createElement('li');
    li.innerHTML = '<strong>' + item.shortName + ' – ' + item.answer.join(' oder ') + ':</strong> ' + item.reason;
    return li;
  }));
  if (state.rateChecked) {
    document.querySelector('#rate-remember').hidden = false;
    document.querySelector('#rate-solution').hidden = false;
  }
  document.querySelector('#check-rate').addEventListener('click', () => {
    const values = RATING.map((item, index) => document.querySelector('#rate-' + index).value);
    if (values.some((value) => !value)) {
      feedback('rate-feedback', 'error', 'Wähle zuerst für alle acht Bilder eine Stufe von 1 bis 4.');
      return;
    }
    let correctCount = 0;
    let firstWrong = '';
    RATING.forEach((item, index) => {
      const select = document.querySelector('#rate-' + index);
      const mark = document.querySelector('#rate-mark-' + index);
      const valid = item.answer.includes(values[index]);
      select.classList.toggle('is-correct', valid);
      select.classList.toggle('is-wrong', !valid);
      mark.textContent = valid ? ' ✓ passt' : ' ✗ vergleiche noch einmal';
      mark.classList.toggle('is-correct', valid);
      mark.classList.toggle('is-wrong', !valid);
      if (valid) correctCount++; else if (!firstWrong) firstWrong = item.name;
    });
    state.rateChecked = true; saveState();
    document.querySelector('#rate-remember').hidden = false;
    document.querySelector('#rate-solution').hidden = false;
    if (correctCount === 8) feedback('rate-feedback', 'success', 'Korrekt! Deine Einschätzung stimmt bei allen acht Bildern mit der Musterlösung überein.');
    else if (correctCount > 0) feedback('rate-feedback', 'partial', correctCount + ' von 8 Einschätzungen stimmen mit der Musterlösung überein. Vergleiche noch einmal: ' + firstWrong + '.');
    else feedback('rate-feedback', 'error', 'Noch keine Einschätzung stimmt mit der Musterlösung überein. Überlege bei jedem Gerät, ob es nur feste Befehle ausführt oder etwas erkennen muss.');
  });
}

function setupCloze() {
  const target = document.querySelector('#definition-cloze');
  const choices = state.clozeChoices;
  function hideExtras() {
    document.querySelector('.notebook-reminder').hidden = true;
  }
  // Ausgewählte Karte für die Tipp-/Tastaturbedienung: { key, from } mit from = Lückenindex oder -1 (Wortspeicher)
  let picked = null;
  function place(key, from, gapIndex) {
    if (from >= 0) choices[from] = '';
    if (gapIndex >= 0) {
      const previous = choices[gapIndex];
      choices[gapIndex] = key;
      if (from >= 0 && previous) choices[from] = previous; // Tausch zwischen zwei Lücken
    }
    picked = null;
    hideExtras(); saveState(); render();
  }
  // Ziehen per Pointer Events, damit Maus, Stift und Touch gleich funktionieren
  function enableDrag(element, key, from) {
    element.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return;
      const startX = event.clientX;
      const startY = event.clientY;
      let ghost = null;
      element.setPointerCapture(event.pointerId);
      const move = (moveEvent) => {
        if (!ghost && Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY) < 6) return;
        if (!ghost) {
          ghost = document.createElement('span');
          ghost.className = 'cloze-token cloze-drag-ghost';
          ghost.textContent = key;
          document.body.append(ghost);
          element.classList.add('is-dragging');
        }
        ghost.style.left = moveEvent.clientX + 'px';
        ghost.style.top = moveEvent.clientY + 'px';
        target.querySelectorAll('.cloze-gap').forEach((gap) => gap.classList.remove('is-drop-target'));
        document.elementFromPoint(moveEvent.clientX, moveEvent.clientY)?.closest('.cloze-gap')?.classList.add('is-drop-target');
      };
      const end = (endEvent) => {
        element.removeEventListener('pointermove', move);
        element.removeEventListener('pointerup', end);
        element.removeEventListener('pointercancel', end);
        if (!ghost) return; // kein Ziehen, Klick-Handler übernimmt
        ghost.remove();
        element.dataset.dragged = 'true';
        const drop = endEvent.type === 'pointerup' ? document.elementFromPoint(endEvent.clientX, endEvent.clientY) : null;
        const gap = drop?.closest('#definition-cloze .cloze-gap');
        if (gap) place(key, from, Number(gap.dataset.index));
        else if (from >= 0 && drop?.closest('#definition-cloze .cloze-term-bank')) place(key, from, -1);
        else render();
      };
      element.addEventListener('pointermove', move);
      element.addEventListener('pointerup', end);
      element.addEventListener('pointercancel', end);
    });
  }
  function wasDragged(element) {
    if (element.dataset.dragged !== 'true') return false;
    delete element.dataset.dragged;
    return true;
  }
  function render() {
    target.replaceChildren();
    const bank = document.createElement('div');
    bank.className = 'cloze-term-bank';
    bank.setAttribute('aria-label', 'Wortspeicher');
    CLOZE_WORD_BANK.filter((term) => !choices.includes(term.key)).forEach((term) => {
      const token = document.createElement('button');
      token.type = 'button';
      token.className = 'cloze-token';
      token.textContent = term.text;
      const isPicked = picked?.key === term.key;
      token.setAttribute('aria-pressed', String(isPicked));
      token.classList.toggle('is-picked', isPicked);
      enableDrag(token, term.key, -1);
      token.addEventListener('click', () => {
        if (wasDragged(token)) return;
        picked = isPicked ? null : { key: term.key, from: -1 };
        render();
        if (picked) (target.querySelector('.cloze-gap:not(.is-filled)') || target.querySelector('.cloze-gap'))?.focus();
      });
      bank.append(token);
    });
    const sentence = document.createElement('p');
    sentence.className = 'cloze-sentence';
    CLOZE_SENTENCE_PARTS.forEach((part, index) => {
      sentence.append(document.createTextNode(part));
      if (index < CLOZE_TERMS.length) {
        const gap = document.createElement('button');
        gap.type = 'button';
        gap.className = 'cloze-gap';
        gap.dataset.index = String(index);
        const key = choices[index];
        gap.textContent = key || ' '; // geschütztes Leerzeichen hält die leere Lücke auf der Grundlinie
        gap.classList.toggle('is-filled', Boolean(key));
        gap.classList.toggle('is-attached', /^\S/.test(CLOZE_SENTENCE_PARTS[index + 1])); // kein Abstand vor Satzzeichen oder „menschlich|es“
        gap.classList.toggle('is-picked', picked?.from === index);
        gap.setAttribute('aria-label', 'Lücke ' + (index + 1) + (key ? ': ' + key : ': leer'));
        if (key) enableDrag(gap, key, index);
        gap.addEventListener('click', () => {
          if (wasDragged(gap)) return;
          if (picked && picked.from !== index) { place(picked.key, picked.from, index); target.querySelector('[data-index="' + index + '"]')?.focus(); return; }
          if (picked && picked.from === index) { place(key, index, -1); return; }
          if (key) { picked = { key, from: index }; render(); target.querySelector('[data-index="' + index + '"]')?.focus(); }
        });
        sentence.append(gap);
      }
    });
    target.append(bank, sentence);
  }
  render();
  document.querySelector('#check-cloze').addEventListener('click', () => {
    if (choices.every((choice) => !choice)) {
      feedback('cloze-feedback', 'error', 'Setze zuerst Wörter aus dem Wortspeicher in die Lücken ein.');
      return;
    }
    const correct = choices.filter((choice, index) => choice === CLOZE_TERMS[index].key).length;
    if (correct === CLOZE_TERMS.length) {
      feedback('cloze-feedback', 'success', 'Korrekt! Der Merksatz ist vollständig und fachlich richtig.');
      document.querySelector('.notebook-reminder').hidden = false;
    } else if (correct > 0) {
      const firstWrong = choices.findIndex((choice, index) => choice !== CLOZE_TERMS[index].key);
      let message = correct + ' von 8 Lücken stimmen. Prüfe noch einmal Lücke ' + (firstWrong + 1) + '.';
      if (choices[5] === 'Wesen') message += ' „Wesen“ passt hier nicht: Gemeint ist, dass ein KI-System nichts von sich selbst weiß.';
      else if (choices[2] === 'verwenden') message += ' „verwenden“ passt hier nicht: KI-Systeme ahmen menschliches Denken nur nach.';
      else if (choices.includes('Experte')) message += ' „Experte“ gehört nicht in diesen Merksatz.';
      feedback('cloze-feedback', 'partial', message);
    } else {
      feedback('cloze-feedback', 'error', 'Noch nicht korrekt. Beginne mit dem letzten Satz: Worauf können sich Fachleute bei KI nicht einigen?');
    }
  });
  document.querySelector('#reset-cloze').addEventListener('click', () => {
    choices.fill(''); picked = null; saveState();
    document.querySelector('#cloze-feedback').hidden = true;
    hideExtras();
    render();
  });
}

function checkFieldset(fieldsetSelector, feedbackId, messages) {
  const container = document.querySelector(fieldsetSelector);
  const expected = optionValues(container, true);
  const selected = selectedValues(container);
  if (sameSet(selected, expected)) { feedback(feedbackId, 'success', messages.success); return true; }
  if (selected.some((value) => expected.includes(value))) { feedback(feedbackId, 'partial', messages.partial); return false; }
  feedback(feedbackId, 'error', messages.error); return false;
}

function setupLearning() {
  document.querySelector('#check-learning').addEventListener('click', () => {
    checkFieldset('#learning-options', 'learning-feedback', {
      success: 'Korrekt. Das System ordnet deine Zeichnung mithilfe seiner Beispielbilder einer Kategorie zu und gibt dafür Wahrscheinlichkeiten an.',
      partial: 'Teilweise korrekt. Lies noch einmal den Text unter dem Zeichenfeld und vergleiche die beiden Prozentzahlen einer Zeichnung.',
      error: 'Noch nicht korrekt. Male ein Gesicht, drücke auf Start und lies die beiden Prozentzahlen ab.',
    });
    document.querySelector('#learning-remember').hidden = false;
  });
}

function setupErrors() {
  document.querySelector('#check-errors').addEventListener('click', () => {
    checkFieldset('#errors-options', 'errors-feedback', {
      success: 'Korrekt. Das System wendet seinen Erfahrungsschatz stur an – auch auf Bilder, die ihm völlig fremd sind.',
      partial: 'Teilweise korrekt. Vergleiche deine Testbilder mit den zehn Trainingsbildern: Was kommt dort nie vor?',
      error: 'Noch nicht korrekt. Male ein fröhliches Gesicht auf dem Kopf und vergleiche es mit den Trainingsbildern.',
    });
    document.querySelector('#errors-remember').hidden = false;
  });
}

function setupImprove() {
  document.querySelector('#check-improve').addEventListener('click', () => {
    checkFieldset('#improve-options', 'improve-feedback', {
      success: 'Korrekt. Mehr und vielfältigere Trainingsdaten sowie passende Kategorien erweitern den Erfahrungsschatz.',
      partial: 'Teilweise korrekt. Überlege bei jedem Vorschlag, ob der Erfahrungsschatz dadurch größer und vielfältiger wird.',
      error: 'Noch nicht korrekt. Denke an Reiter 4: Welche Beispiele haben dem System gefehlt?',
    });
  });
  document.querySelector('#check-transfer').addEventListener('click', () => {
    checkFieldset('#transfer-options', 'transfer-feedback', {
      success: 'Korrekt. Überall, wo KI aus Beispielen lernt, können Fehler durch fehlende oder einseitige Trainingsdaten entstehen.',
      partial: 'Teilweise korrekt. Prüfe bei jedem Gerät, ob es wirklich aus Beispielen lernt.',
      error: 'Noch nicht korrekt. Schau in Reiter 1 nach, welche Geräte KI nutzen und welche nach festen Regeln arbeiten.',
    });
  });
}

function setupQuiz() {
  const root = document.querySelector('#quiz-questions');
  QUIZ.forEach((entry) => {
    const box = document.createElement('fieldset');
    box.className = 'quiz-question';
    box.innerHTML = '<legend>' + entry.q + '</legend>'
      + entry.options.map((option) => '<label><input type="checkbox" value="' + option.id + '" data-correct="' + option.correct + '"> ' + option.text + '</label>').join('')
      + '<div class="feedback" role="status" aria-live="polite" hidden></div>';
    root.append(box);
  });
  document.querySelector('#quiz-form').addEventListener('submit', (event) => {
    event.preventDefault();
    let complete = 0;
    const summary = [];
    [...root.children].forEach((box, index) => {
      const selected = selectedValues(box);
      const expected = QUIZ[index].options.filter((option) => option.correct).map((option) => option.id);
      const correct = sameSet(selected, expected);
      if (correct) complete++;
      const result = box.querySelector('.feedback');
      result.hidden = false;
      if (correct) {
        result.className = 'feedback success';
        result.textContent = '✓ Richtig. Alle passenden Aussagen sind markiert.';
      } else if (selected.some((value) => expected.includes(value))) {
        result.className = 'feedback partial';
        result.textContent = 'Teilweise richtig. ' + QUIZ[index].hint;
      } else {
        result.className = 'feedback error';
        result.textContent = 'Noch nicht richtig. ' + QUIZ[index].hint;
      }
      const answers = QUIZ[index].options.filter((option) => option.correct).map((option) => option.text);
      summary.push('<li><strong>' + QUIZ[index].q + '</strong><br>Richtig: ' + answers.join(' · ') + '</li>');
    });
    document.querySelector('#quiz-progress').textContent = complete + ' von 6 Fragen vollständig richtig';
    feedback('quiz-feedback', complete === 6 ? 'success' : 'partial', complete === 6
      ? 'Alle sechs Fragen sind vollständig richtig beantwortet.'
      : complete + ' von 6 Fragen sind vollständig richtig. Verbessere die markierten Fragen und prüfe erneut.');
    const overview = document.querySelector('#quiz-summary');
    overview.hidden = complete !== 6;
    if (complete === 6) {
      const ratingItems = RATING.map((item) => item.shortName + ': ' + item.answer.join(' oder ')).join(' · ');
      const sentence = CLOZE_SENTENCE_PARTS.reduce((text, part, index) => text + part + (index < CLOZE_TERMS.length ? CLOZE_TERMS[index].text : ''), '');
      const overviewItems = [
        '<li><strong>Reiter 1 – Ist das KI?</strong> ' + document.querySelector('#rate-task').textContent + ' Richtige Werte: ' + ratingItems + '</li>',
        '<li><strong>Reiter 2 – Was ist KI?</strong> ' + document.querySelector('#cloze-task').textContent + ' Merksatz: „' + sentence + '“</li>',
        '<li><strong>Reiter 3 – Ein lernendes System</strong> ' + document.querySelector('#learning-options legend').textContent + ' ' + optionTexts(document.querySelector('#learning-options'), true).join(' · ') + '</li>',
        '<li><strong>Reiter 4 – Fehlende Erfahrung</strong> ' + document.querySelector('#errors-options legend').textContent + ' ' + optionTexts(document.querySelector('#errors-options'), true).join(' · ') + '</li>',
        '<li><strong>Reiter 5 – Verbesserungen</strong> ' + document.querySelector('#improve-options legend').textContent + ' ' + optionTexts(document.querySelector('#improve-options'), true).join(' · ') + ' ' + document.querySelector('#transfer-options legend').textContent + ' ' + optionTexts(document.querySelector('#transfer-options'), true).join(' · ') + '</li>',
      ];
      overview.innerHTML = '<h3>Übersicht aller Teilaufgaben</h3><ul>' + overviewItems.join('') + '</ul><h3>Quizübersicht</h3><ul>' + summary.join('') + '</ul>';
    }
  });
}

function setupReset() {
  document.querySelector('#reset-progress').addEventListener('click', () => {
    if (!confirm('Bearbeitungsstand wirklich zurücksetzen?')) return;
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    location.reload();
  });
}

setupTabs();
setupRating();
setupCloze();
setupLearning();
setupErrors();
setupImprove();
setupQuiz();
setupReset();
