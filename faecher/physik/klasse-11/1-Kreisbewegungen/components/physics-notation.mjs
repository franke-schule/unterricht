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
  ["m²", "Quadratmeter"],
]);

const INDEX_NAMES = new Map([
  ["0", "null"],
]);

function unitAriaLabel(numerator, denominator) {
  const top = UNIT_NAMES.get(numerator) || numerator;
  const bottom = UNIT_NAMES.get(denominator) || denominator;
  return `${top} pro ${bottom}`;
}

// Ersetzt Muster wie "v_B" durch ein <sub>-Element via createIndexedSymbol;
// alles andere bleibt unveränderter Text. Bestehende Texte ohne "_" sind
// davon nicht betroffen.
const INDEXED_TOKEN = /([A-Za-zωΔ])_([A-Z0-9])/g;

function appendIndexedText(target, text) {
  const value = String(text);
  INDEXED_TOKEN.lastIndex = 0;
  let lastEnd = 0;
  let match;
  while ((match = INDEXED_TOKEN.exec(value))) {
    if (match.index > lastEnd) target.append(document.createTextNode(value.slice(lastEnd, match.index)));
    target.append(createIndexedSymbol(match[1], match[2]));
    lastEnd = INDEXED_TOKEN.lastIndex;
  }
  if (lastEnd < value.length) target.append(document.createTextNode(value.slice(lastEnd)));
}

// Im aria-label wird "X_Y" zu "X mit Index Y"; alles andere bleibt Text.
function indexAriaLabel(text) {
  return String(text).replace(INDEXED_TOKEN, (_, base, index) => `${base} mit Index ${INDEX_NAMES.get(index) || index}`);
}

function createFraction(numerator, denominator, ariaLabel) {
  const fraction = document.createElement("span");
  fraction.className = "physics-fraction";
  fraction.setAttribute("role", "img");
  fraction.setAttribute("aria-label", ariaLabel);
  const top = document.createElement("span");
  top.className = "physics-fraction__numerator";
  appendIndexedText(top, numerator);
  const bottom = document.createElement("span");
  bottom.className = "physics-fraction__denominator";
  appendIndexedText(bottom, denominator);
  fraction.append(top, bottom);
  return fraction;
}

export function createUnitFraction(unit) {
  const [numerator, denominator] = unit.split("/");
  return createFraction(numerator, denominator, unitAriaLabel(numerator, denominator));
}

export function createQuotient(quotient) {
  const [numerator, denominator] = quotient.split("|");
  const ariaLabel = `${indexAriaLabel(numerator)} durch ${indexAriaLabel(denominator)}`;
  return createFraction(numerator, denominator, ariaLabel);
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
