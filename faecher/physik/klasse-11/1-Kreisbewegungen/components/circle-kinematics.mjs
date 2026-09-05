export function clamp(value, minimum, maximum) {
  return Math.max(minimum, Math.min(maximum, value));
}

export function angleAtElapsed(targetAngle, duration, elapsed) {
  if (!(duration > 0)) return 0;
  return targetAngle * clamp(elapsed / duration, 0, 1);
}

export function angularSpeed(deltaPhi, deltaTime) {
  return deltaTime > 0 ? deltaPhi / deltaTime : Number.NaN;
}

export function tangentialSpeed(omega, radius) {
  return omega * radius;
}

export function frequencyFromPeriod(period) {
  return period > 0 ? 1 / period : Number.NaN;
}

export function elapsedInCycle(elapsed, period) {
  if (!(period > 0)) return 0;
  const remainder = elapsed % period;
  return remainder < 0 ? remainder + period : remainder;
}

export function angleAtCycleElapsed(elapsed, period) {
  return period > 0 ? elapsedInCycle(elapsed, period) / period * Math.PI * 2 : 0;
}

export function shuffleIncorrect(values, expected = values, random = Math.random) {
  if (values.length < 2) throw new Error("Mindestens zwei Formelbausteine sind erforderlich.");
  const isCorrectOrder = (candidate) => candidate.every((value, index) => value === expected[index]);
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const candidate = [...values];
    for (let index = candidate.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(random() * (index + 1));
      [candidate[index], candidate[swapIndex]] = [candidate[swapIndex], candidate[index]];
    }
    if (!isCorrectOrder(candidate)) return candidate;
  }
  const fallback = [...values.slice(1), values[0]];
  if (isCorrectOrder(fallback)) throw new Error("Die Formelbausteine lassen sich nicht in eine falsche Reihenfolge bringen.");
  return fallback;
}

export function circleVectors(angle, radius = 1) {
  const cosine = Math.cos(angle);
  const sine = Math.sin(angle);
  return {
    position: { x: radius * cosine, y: radius * sine },
    tangent: { x: -sine, y: cosine },
    inward: { x: -cosine, y: -sine },
  };
}

export function sectorPath(cx, cy, radius, sweptAngle) {
  const angle = clamp(sweptAngle, 0, Math.PI * 2);
  if (angle <= 0.0001) return "";
  const startX = cx;
  const startY = cy - radius;
  if (angle >= Math.PI * 2 - 0.0001) {
    return `M ${cx} ${cy} L ${startX} ${startY} A ${radius} ${radius} 0 1 1 ${cx} ${cy + radius} A ${radius} ${radius} 0 1 1 ${startX} ${startY} Z`;
  }
  const endAngle = angle - Math.PI / 2;
  const endX = cx + Math.cos(endAngle) * radius;
  const endY = cy + Math.sin(endAngle) * radius;
  return `M ${cx} ${cy} L ${startX} ${startY} A ${radius} ${radius} 0 ${angle > Math.PI ? 1 : 0} 1 ${endX} ${endY} Z`;
}
