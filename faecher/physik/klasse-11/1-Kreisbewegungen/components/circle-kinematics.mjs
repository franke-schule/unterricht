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
