// Zählwerk-SVG (Dezimal oben, Binär unten) und Abspielen. Alle Pfeilkoordinaten werden aus den Kastenkoordinaten berechnet.
import { carryCount, digitsOf, gainsPlace, toBits } from '../logic/binary.mjs';

const NS = 'http://www.w3.org/2000/svg';
const BOX_W = 52;
const BOX_H = 56;
const GAP = 8;
const LEFT = 24;
const PLACES = 7;
const ARROW_RISE = 40;
const HEAD_H = 11;
const HEAD_HALF = 6;

const COUNTERS = [
  { key: 'decimal', base: 10, places: 2, top: 84, title: 'Dezimalzählwerk (Ziffern 0 bis 9)', titleY: 24 },
  { key: 'binary', base: 2, places: 7, top: 246, title: 'Binärzählwerk (Ziffern 0 und 1)', titleY: 186 },
];

// Stelle 0 ist die Einerstelle ganz rechts; alle Zählwerke teilen sich dieselben Spalten.
export const boxLeft = (position) => LEFT + (PLACES - 1 - position) * (BOX_W + GAP);
export const boxCenter = (position) => boxLeft(position) + BOX_W / 2;

function node(name, attributes = {}, text) {
  const element = document.createElementNS(NS, name);
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, String(value)));
  if (text !== undefined) element.textContent = text;
  return element;
}

// Pfeil vom oberen Rand der Stelle from zum oberen Rand der linken Nachbarstelle; die Spitze endet genau auf dem Rand.
export function arrowGeometry(fromPosition, top) {
  const x1 = boxCenter(fromPosition);
  const x2 = boxCenter(fromPosition + 1);
  return {
    path: 'M' + x1 + ',' + top + ' C' + x1 + ',' + (top - ARROW_RISE) + ' ' + x2 + ',' + (top - ARROW_RISE) + ' ' + x2 + ',' + (top - HEAD_H),
    head: [[x2 - HEAD_HALF, top - HEAD_H], [x2 + HEAD_HALF, top - HEAD_H], [x2, top]],
    labelX: (x1 + x2) / 2,
    labelY: top - ARROW_RISE + 3,
  };
}

function stateOf(value, base, places) {
  const digits = digitsOf(Math.min(value, base ** places - 1), base, places);
  const carries = value === 0 ? 0 : Math.min(carryCount(value - 1, base), places - 1);
  return { digits, carries, newPlace: value > 0 && gainsPlace(value - 1, base) };
}

function drawCounter(group, config, value) {
  const { digits, carries } = stateOf(value, config.base, config.places);
  group.append(node('text', { class: 'odo-title', x: LEFT, y: config.titleY }, config.title));
  for (let position = config.places - 1; position >= 0; position--) {
    const digit = digits[config.places - 1 - position];
    const overflow = position < carries;
    const classes = ['odo-box', digit === null ? 'is-empty' : '', overflow ? 'is-carry' : ''].filter(Boolean).join(' ');
    group.append(node('rect', { class: classes, x: boxLeft(position), y: config.top, width: BOX_W, height: BOX_H, rx: 6 }));
    if (digit !== null) group.append(node('text', { class: 'odo-digit', x: boxCenter(position), y: config.top + BOX_H / 2 + 11, 'text-anchor': 'middle' }, String(digit)));
  }
  for (let position = 0; position < carries; position++) {
    const arrow = arrowGeometry(position, config.top);
    const part = node('g', { class: 'odo-arrow' });
    part.append(node('path', { d: arrow.path }));
    part.append(node('polygon', { points: arrow.head.map((point) => point.join(',')).join(' ') }));
    if (position === 0) part.append(node('text', { class: 'odo-note', x: arrow.labelX, y: arrow.labelY,'text-anchor': 'middle' }, 'Übertrag'));
    group.append(part);
  }
}

export function counterDescription(value) {
  const binary = stateOf(value, 2, PLACES);
  const decimal = stateOf(value, 10, 2);
  let text = 'Das Dezimalzählwerk zeigt ' + value + ', das Binärzählwerk zeigt ' + toBits(value, 1) + '.';
  if (binary.carries === 1) text += ' Im Binärzählwerk läuft 1 Stelle über und ist dick umrandet; ein Pfeil zeigt den Übertrag nach links.' + (binary.newPlace ? ' Links entsteht eine neue Stelle.' : '');
  else if (binary.carries > 1) text += ' Im Binärzählwerk laufen ' + binary.carries + ' Stellen über und sind dick umrandet; Pfeile zeigen den Übertrag nach links.' + (binary.newPlace ? ' Links entsteht eine neue Stelle.' : '');
  if (decimal.carries > 0) text += ' Im Dezimalzählwerk läuft die 9 über.' + (decimal.newPlace ? ' Dort entsteht eine neue Stelle.' : '');
  return text;
}

export function renderOdometer(svg, value) {
  svg.querySelector('.odo-graphic')?.remove();
  const group = node('g', { class: 'odo-graphic' });
  COUNTERS.forEach((config) => drawCounter(group, config, value));
  svg.append(group);
  svg.querySelector('desc').textContent = counterDescription(value);
}

// Abspielen mit einstellbarem Tempo. advance() liefert false, wenn das Ende erreicht ist.
export function createPlayer({ delay, advance, onChange }) {
  let timer = null;
  const tick = () => {
    timer = null;
    if (advance()) timer = setTimeout(tick, delay());
    else { onChange(false); }
  };
  return {
    get playing() { return timer !== null; },
    start() { if (timer !== null) return; onChange(true); timer = setTimeout(tick, delay()); },
    stop() { if (timer === null) return; clearTimeout(timer); timer = null; onChange(false); },
  };
}
