const UNIT_NAMES = new Map([
  ["m", "Meter"],
  ["km", "Kilometer"],
  ["s", "Sekunde"],
  ["s²", "Sekunde zum Quadrat"],
  ["h", "Stunde"],
  ["min", "Minute"],
  ["rad", "Radiant"],
  ["N", "Newton"],
  ["kg", "Kilogramm"],
]);

const INDEX_NAMES = new Map([
  ["0", "null"],
]);

function unitAriaLabel(numerator, denominator) {
  const top = UNIT_NAMES.get(numerator) || numerator;
  const bottom = UNIT_NAMES.get(denominator) || denominator;
  return `${top} pro ${bottom}`;
}

function createFraction(numerator, denominator, ariaLabel) {
  const fraction = document.createElement("span");
  fraction.className = "physics-fraction";
  fraction.setAttribute("role", "img");
  fraction.setAttribute("aria-label", ariaLabel);
  const top = document.createElement("span");
  top.className = "physics-fraction__numerator";
  top.textContent = numerator;
  const bottom = document.createElement("span");
  bottom.className = "physics-fraction__denominator";
  bottom.textContent = denominator;
  fraction.append(top, bottom);
  return fraction;
}

export function createUnitFraction(unit) {
  const [numerator, denominator] = unit.split("/");
  return createFraction(numerator, denominator, unitAriaLabel(numerator, denominator));
}

export function createQuotient(quotient) {
  const [numerator, denominator] = quotient.split("|");
  return createFraction(numerator, denominator, `${numerator} durch ${denominator}`);
}

export function createIndexedSymbol(base, index) {
  const symbol = document.createElement("span");
  symbol.className = "physics-symbol";
  symbol.setAttribute("role", "img");
  symbol.setAttribute("aria-label", `${base} mit Index ${INDEX_NAMES.get(index) || index}`);
  const subscript = document.createElement("sub");
  subscript.textContent = index;
  symbol.append(document.createTextNode(base), subscript);
  return symbol;
}

export function createPhysicsNotation(token) {
  if (token.includes("|")) return createQuotient(token);
  if (token.includes("/")) return createUnitFraction(token);
  const [base, index] = token.split("_");
  return createIndexedSymbol(base, index);
}

// **Text** wird fett gesetzt; darin dürfen wieder {{…}}-Platzhalter stehen.
export function appendPhysicsText(target, text) {
  const emphasized = String(text).split(/\*\*(.+?)\*\*/g);
  if (emphasized.length > 1) {
    emphasized.forEach((part, index) => {
      if (!part) return;
      if (index % 2 === 0) { appendPhysicsText(target, part); return; }
      const strong = document.createElement("strong");
      appendPhysicsText(strong, part);
      target.append(strong);
    });
    return;
  }
  String(text)
    .split(/\{\{([^{}]+)\}\}/g)
    .forEach((part, index) => {
      if (!part) return;
      if (index % 2 === 1) target.append(createPhysicsNotation(part));
      else target.append(document.createTextNode(part));
    });
}

export function physicsTextSpan(text, className) {
  const span = document.createElement("span");
  if (className) span.className = className;
  appendPhysicsText(span, text);
  return span;
}

export function unitChoiceValue(id) {
  const group = document.getElementById(id);
  const checked = group?.querySelector('input[type="radio"]:checked');
  return checked ? checked.value : "";
}
