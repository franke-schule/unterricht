export const TRAINING_ROWS = [
  { x1: 2, x2: 2, target: 1 },
  { x1: 4, x2: 1, target: 0 },
  { x1: 6, x2: 2, target: 0 },
  { x1: 0, x2: 4, target: 1 },
];

export function activation(sum, threshold) {
  return sum >= threshold ? 1 : 0;
}

export function calculate({ x1, x2, w1, w2, threshold }) {
  const sum = w1 * x1 + w2 * x2;
  return { sum, output: activation(sum, threshold) };
}

export function trainOne(row, parameters) {
  const { sum, output } = calculate({ ...row, ...parameters });
  const delta = row.target - output;
  const { rate } = parameters;
  return {
    sum,
    output,
    delta,
    w1: parameters.w1 + delta * rate * row.x1,
    w2: parameters.w2 + delta * rate * row.x2,
    threshold: parameters.threshold - delta * rate,
  };
}

export function normaliseNumber(value, { allowPercent = false } = {}) {
  let text = String(value ?? '').trim().replaceAll('−', '-').replace(',', '.');
  if (allowPercent && /%$/.test(text)) text = text.slice(0, -1).trim();
  if (!text || /[^0-9+\-.]/.test(text)) return null;
  const number = Number(text);
  return Number.isFinite(number) ? number : null;
}

export function numberMatches(value, expected, options) {
  const parsed = normaliseNumber(value, options);
  return parsed !== null && Math.abs(parsed - expected) < 1e-9;
}

export function runEpoch(rows = TRAINING_ROWS, parameters = { w1: 1, w2: 1, threshold: 1, rate: 1 }) {
  let current = { ...parameters };
  return rows.map((row) => {
    const result = trainOne(row, current);
    const before = current;
    current = { w1: result.w1, w2: result.w2, threshold: result.threshold, rate: current.rate };
    return { row, before, ...result };
  });
}
