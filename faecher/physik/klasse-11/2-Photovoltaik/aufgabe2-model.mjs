export const COLORS = {
  Rot: { wavelengthNm: 650, eqe: 0.85 },
  Gelb: { wavelengthNm: 590, eqe: 0.80 },
  Grün: { wavelengthNm: 530, eqe: 0.72 },
  Blau: { wavelengthNm: 460, eqe: 0.55 },
};
export const COLOR_ORDER = ["Weiß", "Rot", "Grün", "Gelb", "Blau"];
const MAX_STORED_SERIES = 1_000_000;
const MAX_POINTS_PER_SERIES = 2 * 1001;
export const OPTICAL_POWER_PER_CELL = 0.024;
export const I0 = 5e-10;
export const A = 0.062;
const Q = 1.602176634e-19;
const H = 6.62607015e-34;
const C = 299792458;

export function photocurrent(color) {
  if (color === "Weiß") return Object.values(COLORS).reduce((sum, band) => sum + Q * band.eqe * (OPTICAL_POWER_PER_CELL / 4) * (band.wavelengthNm * 1e-9) / (H * C), 0);
  const band = COLORS[color];
  if (!band) throw new RangeError("Unbekannte Lichtfarbe");
  return Q * band.eqe * OPTICAL_POWER_PER_CELL * (band.wavelengthNm * 1e-9) / (H * C);
}

export function resistanceFromSlider(s) {
  if (!Number.isInteger(s) || s < 0 || s > 1000) throw new RangeError("Sliderstellung muss eine ganze Zahl von 0 bis 1000 sein.");
  return 10000 * (s / 1000) ** 3;
}

export function normalizeStoredSeries(rawSeries) {
  if (!Array.isArray(rawSeries) || rawSeries.length > MAX_STORED_SERIES) return null;
  const validColors = new Set(COLOR_ORDER), seenIds = new Set();
  return rawSeries.flatMap((item) => {
    if (!item || !Number.isSafeInteger(item.id) || item.id < 1 || seenIds.has(item.id)
      || !validColors.has(item.color) || !Array.isArray(item.points) || item.points.length > MAX_POINTS_PER_SERIES) return [];
    seenIds.add(item.id);
    const seenSettings = new Set();
    const points = item.points.flatMap((point) => {
      if (!point || !Number.isInteger(point.slider) || point.slider < 0 || point.slider > 1000 || typeof point.open !== "boolean") return [];
      const key = `${point.slider}:${point.open}`;
      if (seenSettings.has(key)) return [];
      seenSettings.add(key);
      return [{ ...solveOperatingPoint(item.color, resistanceFromSlider(point.slider), point.open), slider: point.slider, open: point.open }];
    });
    return [{ id: item.id, color: item.color, visible: item.visible !== false, points }];
  });
}

export function openCircuitVoltage(color) { return A * Math.log1p(photocurrent(color) / I0); }

export function solveOperatingPoint(color, resistanceOhm, openCircuit = false) {
  const iph = photocurrent(color);
  if (openCircuit) return { voltage: openCircuitVoltage(color), current: 0, power: 0, resistance: Infinity, operation: "Leerlauf" };
  if (!Number.isFinite(resistanceOhm) || resistanceOhm < 0) throw new RangeError("Widerstand muss endlich und nicht negativ sein.");
  if (resistanceOhm === 0) return { voltage: 0, current: iph, power: 0, resistance: 0, operation: "Kurzschluss" };
  const u0 = openCircuitVoltage(color);
  const f = (u) => iph - I0 * Math.expm1(u / A) - u / resistanceOhm;
  let lo = 0, hi = u0;
  for (let i = 0; i < 100; i += 1) {
    const mid = (lo + hi) / 2;
    if (f(mid) > 0) lo = mid; else hi = mid;
  }
  const voltage = (lo + hi) / 2;
  const current = voltage / resistanceOhm;
  return { voltage, current, power: voltage * current, resistance: resistanceOhm, operation: "geschlossen" };
}

export function modelMaximum(color) {
  const u0 = openCircuitVoltage(color);
  let left = 0, right = u0;
  // Golden-section maximization of U·I(U), strictly internal model data.
  const ratio = (Math.sqrt(5) - 1) / 2;
  let x1 = right - ratio * (right - left), x2 = left + ratio * (right - left);
  const powerAt = (u) => u * Math.max(0, photocurrent(color) - I0 * Math.expm1(u / A));
  for (let i = 0; i < 120; i += 1) {
    if (powerAt(x1) < powerAt(x2)) { left = x1; x1 = x2; x2 = left + ratio * (right - left); }
    else { right = x2; x2 = x1; x1 = right - ratio * (right - left); }
  }
  const voltage = (left + right) / 2;
  const current = photocurrent(color) - I0 * Math.expm1(voltage / A);
  return { voltage, current, power: voltage * current, resistance: voltage / current };
}
