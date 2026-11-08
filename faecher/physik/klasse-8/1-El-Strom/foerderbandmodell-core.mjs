export const BALLS_PER_CHAIN = 24;
export const PASSAGES_PER_AMPERE_SECOND = 0.72;
export const LOWER = 0.53;
export const HEIGHT_PER_VOLT = 0.22;

export function deriveModel(mode, voltage, current) {
  if (!["simple", "series", "parallel"].includes(mode)) throw new RangeError("mode");
  if (!Number.isInteger(voltage) || voltage < 2 || voltage > 12) throw new RangeError("voltage");
  const tenths = Math.round(current * 10);
  if (!Number.isFinite(current) || Math.abs(current * 10 - tenths) > 1e-8 || tenths < 2 || tenths > 20) throw new RangeError("current");
  const top = LOWER + voltage * HEIGHT_PER_VOLT;
  const middle = (LOWER + top) / 2;
  const parallel = mode === "parallel";
  const series = mode === "series";
  return {
    mode, voltage, current: tenths / 10, lower: LOWER, top, middle,
    branchVoltages: series ? [voltage / 2, voltage / 2] : parallel ? [voltage, voltage] : [voltage],
    branchCurrents: parallel ? [tenths / 20, tenths / 20] : series ? [tenths / 10, tenths / 10] : [tenths / 10],
    chains: parallel ? 2 : 1,
    chainCurrents: parallel ? [tenths / 20, tenths / 20] : [tenths / 10],
    ballsPerChain: BALLS_PER_CHAIN,
  };
}

// Arc-length speed makes passages per second independent of the circuit height.
export function chainSpeed(pathLength, chainCurrent, ballCount = BALLS_PER_CHAIN) {
  return pathLength * chainCurrent * PASSAGES_PER_AMPERE_SECOND / ballCount;
}

export const fmtVoltage = value => `${String(value).replace(".", ",")} V`;
export const fmtCurrent = value => `${(Math.round(value * 100) % 10 === 0 ? value.toFixed(1) : value.toFixed(2)).replace(".", ",")} A`;
export const sub = index => `<sub>${index}</sub>`;

export function readoutHtml(model) {
  const values = [`U = ${fmtVoltage(model.voltage)}`, `I = ${fmtCurrent(model.current)}`];
  model.branchVoltages.forEach((value, index) => values.push(`U${sub(index + 1)} = ${fmtVoltage(value)}`));
  model.branchCurrents.forEach((value, index) => values.push(`I${sub(index + 1)} = ${fmtCurrent(value)}`));
  return values.map(value => `<span class="foerderband-readout">${value}</span>`).join("");
}

export function equationsHtml(model) {
  if (model.mode === "simple") return `<p>U = U${sub(1)} = ${fmtVoltage(model.voltage)}</p><p>I = I${sub(1)} = ${fmtCurrent(model.current)}</p>`;
  if (model.mode === "series") return `<p>U = U${sub(1)} + U${sub(2)} = ${fmtVoltage(model.branchVoltages[0])} + ${fmtVoltage(model.branchVoltages[1])} = ${fmtVoltage(model.voltage)}</p><p>U${sub(1)} = U${sub(2)} = ${fmtVoltage(model.branchVoltages[0])}</p><p>I = I${sub(1)} = I${sub(2)} = ${fmtCurrent(model.current)}</p>`;
  return `<p>U = U${sub(1)} = U${sub(2)} = ${fmtVoltage(model.voltage)}</p><p>I = I${sub(1)} + I${sub(2)} = ${fmtCurrent(model.branchCurrents[0])} + ${fmtCurrent(model.branchCurrents[1])} = ${fmtCurrent(model.current)}</p><p>I${sub(1)} = I${sub(2)} = ${fmtCurrent(model.branchCurrents[0])}</p>`;
}
