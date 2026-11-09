// Einmalige Aufteilung der bisherigen Rohstände. Die Quelldaten bleiben erhalten.
const SELECT_CURRENT = 'informatik9-datenbanken-aufgabe3-v1';
const SELECT_LEGACY = 'informatik9-datenbanken-aufgabe2-v1';
const WHERE_OLD = 'informatik9-datenbanken-aufgabe3-where-v1';

function object(value) { return value !== null && typeof value === 'object' && !Array.isArray(value); }

function read(storage, key) {
  try {
    const raw = storage.getItem(key);
    const value = raw ? JSON.parse(raw) : null;
    return object(value) ? value : null;
  } catch { return null; }
}

function validSource(value) {
  if (!object(value)) return false;
  return ['answers', 'solved', 'descriptionAnswers', 'descriptionFeedback', 'feedback', 'quiz'].some((key) => object(value[key])) ||
    ['intro', 'projection', 'orderBy', 'distinct', 'limit', 'simple', 'compare', 'like', 'combine', 'fast', 'quiz'].includes(value.tab) ||
    Number.isInteger(value.introStep) && value.introStep >= 1 && value.introStep <= 12;
}

function pickEntries(source, allowed, valid) {
  if (!object(source)) return {};
  return Object.fromEntries(Object.entries(source).filter(([id, value]) => allowed.has(id) && valid(value)));
}

export function readSplitProgress(key, marker, family, tasks, descriptions, tabs, maxIntroStep, storage = globalThis.localStorage) {
  try {
    const current = read(storage, key);
    if (validSource(current)) return current;
    if (storage.getItem(marker) === 'done') return null;
    const source = family === 'select'
      ? [read(storage, SELECT_CURRENT), read(storage, SELECT_LEGACY)].find(validSource)
      : read(storage, WHERE_OLD);
    if (!validSource(source)) return null;
    const taskIds = new Set(tasks.map(({ id }) => id));
    const descriptionIds = new Set(descriptions.filter(Boolean).map(({ id }) => id));
    const tabIds = new Set(tabs.map(([id]) => id));
    const saved = {
      assessmentVersion: source.assessmentVersion,
      tab: tabIds.has(source.tab) ? source.tab : tabs[0][0],
      answers: pickEntries(source.answers, taskIds, (value) => typeof value === 'string'),
      solved: pickEntries(source.solved, taskIds, (value) => value === true),
      feedback: pickEntries(source.feedback, taskIds, (value) => object(value) && typeof value.text === 'string'),
      descriptionAnswers: pickEntries(source.descriptionAnswers, descriptionIds, (value) => typeof value === 'string'),
      descriptionFeedback: source.assessmentVersion === '20261029-criteria-v1'
        ? pickEntries(source.descriptionFeedback, descriptionIds, (value) => object(value) && Number.isInteger(value.points) && value.points >= 0 && value.points <= 3)
        : {},
      quiz: {}, quizPassed: false, quizFeedback: null,
    };
    if (tabIds.has('intro') && Number.isInteger(source.introStep) && source.introStep >= 1 && source.introStep <= maxIntroStep) saved.introStep = source.introStep;
    if (family === 'select' && tabIds.has('orderBy') && object(source.youngest)) {
      saved.youngest = {
        username: typeof source.youngest.username === 'string' ? source.youngest.username : '',
        age: typeof source.youngest.age === 'string' ? source.youngest.age : '',
        feedback: null,
      };
    }
    storage.setItem(key, JSON.stringify(saved));
    storage.setItem(marker, 'done');
    return saved;
  } catch { return null; }
}

export function bindSolutionCodePersistence(panel, state, save) {
  const form = panel.querySelector('.solution-code-form');
  const input = form?.querySelector('[name="solution-code"]');
  const link = form?.querySelector('.download-button');
  const message = form?.querySelector('.solution-code-message');
  if (!form || !input || !link) return;
  input.value = typeof state.solutionCode === 'string' ? state.solutionCode : '';
  input.addEventListener('input', () => {
    state.solutionCode = input.value;
    state.solutionUnlocked = false;
    link.hidden = true;
    if (message) message.textContent = '';
    save();
  });
  form.addEventListener('submit', () => {
    state.solutionCode = input.value;
    state.solutionUnlocked = !link.hidden;
    save();
  });
  if (state.solutionUnlocked && input.value) form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
}
