// Wiederverwendbare k-Grafik für Schulshirt-Daten (Aufgabe 7, später Aufgabe 8).
// Beide Achsen haben standardmäßig denselben Maßstab, damit sichtbare Nähe dem euklidischen Abstand entspricht.
// Aufgabe 8 nutzt die optionalen Parameter (scaleY, tickStep, axisTitles, shapes, classes, pointTitle, pointLabel,
// newTitle, labelOffset); ohne sie verhält sich die Grafik wie in Aufgabe 7.
import { SHIRT_SYMBOLS } from '../data/shirts.mjs';
import { countLabels, euclidean, rankNeighbours } from '../logic/knn.mjs';

const NS = 'http://www.w3.org/2000/svg';
const DEFAULT_DOMAIN = { x: [155, 200], y: [80, 130] };
const DEFAULT_SCALE = 9;
const DEFAULT_ORIGIN = { x: 50, y: 470 };
const CLASSES = ['S', 'M', 'L'];
const DEFAULT_AXIS_TITLES = ['Körpergröße in cm', 'Brustumfang in cm'];
const DEFAULT_LABEL_OFFSET = { dx: 18, dy: 4, anchor: 'start' };

// Zahlenwerte (Daten) -> SVG-Koordinaten. (155|80) -> (50|470), (200|130) -> (455|20).
// scaleY ist optional und gleich scale, wenn nichts angegeben ist.
export function toSvg(point, { domain = DEFAULT_DOMAIN, scale = DEFAULT_SCALE, scaleY = scale, origin = DEFAULT_ORIGIN } = {}) {
  return { x: origin.x + (point.x - domain.x[0]) * scale, y: origin.y - (point.y - domain.y[0]) * scaleY };
}

function el(name, attributes = {}, text) {
  const node = document.createElementNS(NS, name);
  Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, String(value)));
  if (text !== undefined) node.textContent = text;
  return node;
}

// S = Kreis, M = Dreieck, L = Quadrat; die Klasse ist so nie nur über die Farbe erkennbar.
// shapes (optional) ordnet einem Label 'circle' | 'triangle' | 'square' zu; null = Standard von oben.
function classShape(label, shapes = null) {
  const shape = shapes ? shapes[label] : label === 'S' ? 'circle' : label === 'M' ? 'triangle' : 'square';
  if (shape === 'circle') return el('circle', { class: 'knn-mark knn-mark-' + label, r: 6.5 });
  if (shape === 'triangle') return el('path', { class: 'knn-mark knn-mark-' + label, d: 'M0,-8 L7,4.5 L-7,4.5 Z' });
  return el('rect', { class: 'knn-mark knn-mark-' + label, x: -6.5, y: -6.5, width: 13, height: 13 });
}

function newPointShape() {
  const group = el('g');
  group.append(el('circle', { class: 'knn-new-ring', r: 14 }), el('path', { class: 'knn-new-mark', d: 'M0,-9 L9,0 L0,9 L-9,0 Z' }));
  return group;
}

function tickValues(range, step) {
  const values = [];
  for (let value = range[0]; value <= range[1]; value += step) values.push(value);
  return values;
}

export function renderShirtPlot(svg, {
  data, newPoint, newLabel = '', k = 0, metric = euclidean,
  domain = DEFAULT_DOMAIN, scale = DEFAULT_SCALE, scaleY = scale, origin = DEFAULT_ORIGIN,
  tickStep = 5, axisTitles = DEFAULT_AXIS_TITLES, shapes = null, classes = CLASSES,
  pointTitle = null, pointLabel = null, newTitle = null, labelOffset = DEFAULT_LABEL_OFFSET,
} = {}) {
  const frame = { domain, scale, scaleY, origin };
  const width = origin.x + (domain.x[1] - domain.x[0]) * scale + 40;
  const height = origin.y + 55;
  const top = origin.y - (domain.y[1] - domain.y[0]) * scaleY;
  const right = origin.x + (domain.x[1] - domain.x[0]) * scale;
  const stepX = typeof tickStep === 'number' ? tickStep : tickStep.x;
  const stepY = typeof tickStep === 'number' ? tickStep : tickStep.y;
  [...svg.children].forEach((child) => { if (!['title', 'desc'].includes(child.localName)) child.remove(); });
  svg.setAttribute('viewBox', '0 0 ' + width + ' ' + height);

  const arrowId = (svg.id || 'knn-plot') + '-arrow';
  const defs = el('defs');
  const marker = el('marker', { id: arrowId, markerUnits: 'userSpaceOnUse', markerWidth: 10, markerHeight: 10, refX: 9, refY: 5, orient: 'auto' });
  marker.append(el('path', { d: 'M0,0 L10,5 L0,10 z' }));
  defs.append(marker);

  const grid = el('g', { class: 'knn-grid', 'aria-hidden': 'true' });
  const ticks = el('g', { class: 'knn-ticks', 'aria-hidden': 'true' });
  tickValues(domain.x, stepX).forEach((value) => {
    const { x } = toSvg({ x: value, y: domain.y[0] }, frame);
    grid.append(el('line', { x1: x, y1: origin.y, x2: x, y2: top }));
    ticks.append(el('text', { x, y: origin.y + 18, 'text-anchor': 'middle' }, value));
  });
  tickValues(domain.y, stepY).forEach((value) => {
    const { y } = toSvg({ x: domain.x[0], y: value }, frame);
    grid.append(el('line', { x1: origin.x, y1: y, x2: right, y2: y }));
    ticks.append(el('text', { x: origin.x - 8, y: y + 4, 'text-anchor': 'end' }, value));
  });
  const axes = el('g', { class: 'knn-axes', 'aria-hidden': 'true' });
  axes.append(
    el('line', { x1: origin.x, y1: origin.y, x2: right + 22, y2: origin.y, 'marker-end': 'url(#' + arrowId + ')' }),
    el('line', { x1: origin.x, y1: origin.y, x2: origin.x, y2: top - 22, 'marker-end': 'url(#' + arrowId + ')' }),
  );
  const titles = el('g', { class: 'knn-axis-titles', 'aria-hidden': 'true' });
  titles.append(
    el('text', { x: (origin.x + right) / 2, y: origin.y + 46, 'text-anchor': 'middle' }, axisTitles[0]),
    el('text', { x: 14, y: (origin.y + top) / 2, 'text-anchor': 'middle', transform: 'rotate(-90 14 ' + (origin.y + top) / 2 + ')' }, axisTitles[1]),
  );

  const neighbours = newPoint && k > 0 ? rankNeighbours(newPoint, data, metric).slice(0, k) : [];
  const counts = countLabels(neighbours, classes);

  // Linien zuerst und damit unter den Markern: Sie verlaufen von Mittelpunkt zu Mittelpunkt und berühren so beide Marker.
  const lines = el('g', { class: 'knn-lines', 'aria-hidden': 'true' });
  const halos = el('g', { class: 'knn-halos', 'aria-hidden': 'true' });
  const center = newPoint ? toSvg(newPoint, frame) : null;
  neighbours.forEach(({ item }) => {
    const point = toSvg(item, frame);
    lines.append(el('line', { class: 'knn-line', x1: center.x, y1: center.y, x2: point.x, y2: point.y }));
    halos.append(el('circle', { class: 'knn-halo', cx: point.x, cy: point.y, r: 11 }));
  });

  const points = el('g', { class: 'knn-points' });
  const pointLabels = el('g', { class: 'knn-point-labels', 'aria-hidden': 'true' });
  data.forEach((item) => {
    const position = toSvg(item, frame);
    const group = el('g', { class: 'knn-point', transform: 'translate(' + position.x + ' ' + position.y + ')', 'data-id': item.id });
    const title = pointTitle ? pointTitle(item) : 'Nr. ' + item.id + ': ' + item.x + ' cm, ' + item.y + ' cm, Größe ' + item.label;
    group.append(el('title', {}, title), classShape(item.label, shapes));
    points.append(group);
    const text = pointLabel ? pointLabel(item) : null;
    if (text) pointLabels.append(el('text', { class: 'knn-point-label', x: position.x + 10, y: position.y - 10 }, text));
  });

  const children = [defs, grid, axes, ticks, titles, lines, halos, points];
  if (pointLabel) children.push(pointLabels);
  if (newPoint) {
    const offset = { ...DEFAULT_LABEL_OFFSET, ...labelOffset };
    const fresh = el('g', { class: 'knn-new', transform: 'translate(' + center.x + ' ' + center.y + ')' });
    fresh.append(el('title', {}, newTitle || (newLabel || 'neue Person') + ': ' + newPoint.x + ' cm, ' + newPoint.y + ' cm'), newPointShape());
    const labelAttributes = { class: 'knn-new-label', x: center.x + offset.dx, y: center.y + offset.dy };
    if (offset.anchor !== 'start') labelAttributes['text-anchor'] = offset.anchor;
    children.push(fresh, el('text', labelAttributes, newLabel));
  }

  svg.append(...children);
  return { neighbours, counts };
}

// HTML-Legende mit kleinen Inline-SVG-Symbolen: ○ S, △ M, □ L, ◇ neue Person.
// classes: Liste { label, text }; shapes wie bei renderShirtPlot; showNew blendet den Eintrag der neuen Person aus.
export function renderLegend(container, { classes = CLASSES.map((label) => ({ label, text: label })), shapes = null, newText = 'neue Person', showNew = true } = {}) {
  const list = document.createElement('ul');
  list.className = 'knn-legend';
  classes.forEach(({ label, text: caption }) => {
    const item = document.createElement('li');
    const icon = el('svg', { viewBox: '-12 -12 24 24', width: 22, height: 22, 'aria-hidden': 'true', focusable: 'false' });
    icon.append(classShape(label, shapes));
    const text = document.createElement('span');
    text.textContent = caption;
    item.append(icon, text);
    if (SHIRT_SYMBOLS[label]) item.title = SHIRT_SYMBOLS[label] + ' ' + label;
    list.append(item);
  });
  if (showNew) {
    const fresh = document.createElement('li');
    const icon = el('svg', { viewBox: '-16 -16 32 32', width: 26, height: 26, 'aria-hidden': 'true', focusable: 'false' });
    icon.append(newPointShape());
    const text = document.createElement('span');
    text.textContent = newText;
    fresh.append(icon, text);
    list.append(fresh);
  }
  container.replaceChildren(list);
}
