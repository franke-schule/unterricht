export const G = 6.67430e-11;
export const INITIAL = Object.freeze({ m1: 3.5, m2: 4.5, x1: -3.5, y1: 0, x2: 3.5, y2: 0 });
export const MIN_DISTANCE = 0.5;
export const MAX_DISTANCE = 12;

export function distance(s) { return Math.hypot(s.x2 - s.x1, s.y2 - s.y1); }
export function force(s) {
  const r = distance(s);
  return G * (s.m1 * 1000) * (s.m2 * 1000) / (r * r);
}
export function validState(s) {
  return s && [s.m1, s.m2, s.x1, s.y1, s.x2, s.y2].every(Number.isFinite)
    && s.m1 >= 0 && s.m1 <= 8 && s.m2 >= 0 && s.m2 <= 8
    && distance(s) >= MIN_DISTANCE - 1e-8 && distance(s) <= MAX_DISTANCE + 1e-8
    && [s.x1, s.x2, s.y1, s.y2].every(v => Math.abs(v) <= 8.8);
}
export function setDistance(s, r) {
  if (!Number.isFinite(r) || r < MIN_DISTANCE || r > MAX_DISTANCE) return null;
  const old = distance(s), ux = (s.x2 - s.x1) / old, uy = (s.y2 - s.y1) / old;
  const next = { ...s, x2: s.x1 + ux * r, y2: s.y1 + uy * r };
  // At the diagram edge translate the complete pair, preserving r and angle.
  const shiftX = Math.max(-8.8 - Math.min(next.x1,next.x2),Math.min(0,8.8 - Math.max(next.x1,next.x2)));
  const shiftY = Math.max(-8.8 - Math.min(next.y1,next.y2),Math.min(0,8.8 - Math.max(next.y1,next.y2)));
  next.x1 += shiftX;next.x2 += shiftX;next.y1 += shiftY;next.y2 += shiftY;
  return validState(next) ? next : null;
}
export function moveBody(s, which, x, y) {
  x = Math.max(-8.8, Math.min(8.8, x));
  y = Math.max(-8.8, Math.min(8.8, y));
  const next = { ...s, [`x${which}`]: x, [`y${which}`]: y };
  if (validState(next)) return next;
  // Clamp the moved point to the allowed annulus around the other centre.
  const other = which === 1 ? 2 : 1;
  const ox = s[`x${other}`], oy = s[`y${other}`];
  const dx = x - ox, dy = y - oy, raw = Math.hypot(dx, dy);
  if (!Number.isFinite(raw) || raw === 0) return s;
  const r = Math.max(MIN_DISTANCE, Math.min(MAX_DISTANCE, raw));
  const clamped = { ...s, [`x${which}`]: Math.max(-8.8, Math.min(8.8, ox + dx / raw * r)), [`y${which}`]: Math.max(-8.8, Math.min(8.8, oy + dy / raw * r)) };
  return validState(clamped) ? clamped : s;
}

export function parseQuantity(input) {
  const source = String(input).trim().replace(/\s+/g, '').replace(',', '.').replace(/[−–]/g, '-');
  const match = source.match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))(?:(?:[·×*]10\^?|e)([+-]?\d+))?$/i);
  if (!match) return null;
  const value = Number(match[1]) * 10 ** Number(match[2] || 0);
  if (!Number.isFinite(value)) return null;
  const mantissa = match[1].replace(/^[+-]/, '');
  let digits = mantissa.replace('.', '').replace(/^0+/, '');
  if (!mantissa.includes('.')) digits = digits.replace(/0+$/, '');
  return { value, digits: digits.length || (value === 0 ? 1 : 0), ambiguous: !mantissa.includes('.') && /0$/.test(mantissa) && !match[2] };
}

export function checkQuantity(input, unit, config) {
  const parsed = parseQuantity(input);
  if (!parsed || !Object.hasOwn(config.units, unit)) return 'wrong';
  const si = parsed.value * config.units[unit];
  if (!Number.isFinite(si)) return 'wrong';
  const target = Number(config.target.toPrecision(config.digits));
  const place = 10 ** (Math.floor(Math.log10(Math.abs(target))) - config.digits + 1);
  if (Math.abs(si - target) > Math.max(0.5 * place, config.tolerance || 0) + Math.abs(target) * 1e-12) return 'wrong';
  return parsed.digits === config.digits && !parsed.ambiguous ? 'correct' : 'precision';
}
