const VIEW_WIDTH = 640;
const VIEW_HEIGHT = 440;
const PADDING = 48;

export function gridPointKey(point) {
  return `${point.x},${point.y}`;
}

export function pointInRange(point, xRange, yRange) {
  return (
    Number.isInteger(point.x) &&
    Number.isInteger(point.y) &&
    point.x >= xRange.min &&
    point.x <= xRange.max &&
    point.y >= yRange.min &&
    point.y <= yRange.max
  );
}

export function nextSelectablePoint(point, direction, origin) {
  const nextPoint = {
    x: point.x + direction.x,
    y: point.y + direction.y,
  };
  if (gridPointKey(nextPoint) === gridPointKey(origin)) {
    nextPoint.x += direction.x;
    nextPoint.y += direction.y;
  }
  return nextPoint;
}

function svgElement(name, attributes = {}) {
  const element = document.createElementNS(
    "http://www.w3.org/2000/svg",
    name
  );

  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, String(value));
  });

  return element;
}

function createMarker(definitions, id, color) {
  const marker = svgElement("marker", {
    id,
    markerWidth: 9,
    markerHeight: 9,
    refX: 7,
    refY: 4.5,
    orient: "auto",
    markerUnits: "strokeWidth",
  });
  marker.append(svgElement("path", { d: "M0,0 L9,4.5 L0,9 z", fill: color }));
  definitions.append(marker);
}

function rangePoints(xRange, yRange) {
  const points = [];
  for (let x = xRange.min; x <= xRange.max; x += 1) {
    for (let y = yRange.min; y <= yRange.max; y += 1) {
      points.push({ x, y });
    }
  }
  return points;
}

/**
 * Rendert eine Vektoraddition mit ausschließlich klickbaren Gitterpunkten.
 *
 * @param {HTMLElement} container Zielcontainer der Aufgabenkarten.
 * @param {object} config Fachliche Konfiguration der Karte.
 * @param {{x: number, y: number}} config.origin Gemeinsamer Ursprung.
 * @param {Array<{x: number, y: number, label: string}>} config.vectors
 *   Vektoren als Endpunkte relativ zum Ursprung.
 * @param {{min: number, max: number}} [config.xRange]
 * @param {{min: number, max: number}} [config.yRange]
 * @param {string} [config.label] Zugängliche Bezeichnung der Zeichnung.
 * @param {(point: {x: number, y: number}) => void} [config.onSelect]
 * @returns {{clear: () => void, getSelection: () => ({x: number, y: number} | null)}}
 */
export function createPointVectorGrid(container, config) {
  const {
    origin,
    vectors,
    xRange = { min: -5, max: 5 },
    yRange = { min: -4, max: 4 },
    label = "Koordinatensystem zur Vektoraddition",
    onSelect = () => {},
  } = config;

  if (!container || !pointInRange(origin, xRange, yRange)) {
    throw new Error("Für das Vektorraster ist ein Ursprung innerhalb des Rasters erforderlich.");
  }

  if (!Array.isArray(vectors) || vectors.length !== 2) {
    throw new Error("Für die Vektoraddition werden genau zwei Vektoren benötigt.");
  }

  const width = VIEW_WIDTH - PADDING * 2;
  const height = VIEW_HEIGHT - PADDING * 2;
  const scaleX = width / (xRange.max - xRange.min);
  const scaleY = height / (yRange.max - yRange.min);
  const toSvgPoint = (point) => ({
    x: PADDING + (point.x - xRange.min) * scaleX,
    y: VIEW_HEIGHT - PADDING - (point.y - yRange.min) * scaleY,
  });
  const originSvg = toSvgPoint(origin);
  const svgId = `vector-grid-${Math.random().toString(36).slice(2)}`;
  let selection = null;

  const wrapper = document.createElement("section");
  wrapper.className = "point-vector-grid";
  wrapper.setAttribute("aria-label", label);

  const svg = svgElement("svg", {
    viewBox: `0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`,
    role: "group",
    "aria-label": `${label}. Wähle den Endpunkt der Resultierenden auf einem Gitterpunkt.`,
  });
  const title = svgElement("title");
  title.textContent = label;
  svg.append(title);

  const definitions = svgElement("defs");
  createMarker(definitions, `${svgId}-given-one`, "#2563eb");
  createMarker(definitions, `${svgId}-given-two`, "#7c3aed");
  createMarker(definitions, `${svgId}-result`, "#059669");
  svg.append(definitions);

  const grid = svgElement("g", { "aria-hidden": "true" });
  for (let x = xRange.min; x <= xRange.max; x += 1) {
    const point = toSvgPoint({ x, y: yRange.min });
    grid.append(svgElement("line", {
      x1: point.x,
      y1: PADDING,
      x2: point.x,
      y2: VIEW_HEIGHT - PADDING,
      class: x === 0 ? "axis-line" : "grid-line",
    }));
  }
  for (let y = yRange.min; y <= yRange.max; y += 1) {
    const point = toSvgPoint({ x: xRange.min, y });
    grid.append(svgElement("line", {
      x1: PADDING,
      y1: point.y,
      x2: VIEW_WIDTH - PADDING,
      y2: point.y,
      class: y === 0 ? "axis-line" : "grid-line",
    }));
  }
  svg.append(grid);

  const vectorsLayer = svgElement("g", { "aria-hidden": "true" });
  vectors.forEach((vector, index) => {
    const endPoint = toSvgPoint({
      x: origin.x + vector.x,
      y: origin.y + vector.y,
    });
    vectorsLayer.append(svgElement("line", {
      x1: originSvg.x,
      y1: originSvg.y,
      x2: endPoint.x,
      y2: endPoint.y,
      class: `given-vector${index === 1 ? " secondary" : ""}`,
      "marker-end": `url(#${svgId}-given-${index === 0 ? "one" : "two"})`,
    }));
    const vectorLabel = svgElement("text", {
      x: endPoint.x + 8,
      y: endPoint.y - 8,
      fill: index === 0 ? "#1d4ed8" : "#6d28d9",
      "font-size": 16,
      "font-weight": 800,
    });
    vectorLabel.textContent = vector.label || `Vektor ${index + 1}`;
    vectorsLayer.append(vectorLabel);
  });
  vectorsLayer.append(svgElement("circle", {
    cx: originSvg.x,
    cy: originSvg.y,
    r: 6,
    class: "vector-origin",
  }));
  svg.append(vectorsLayer);

  const resultLayer = svgElement("g", { "aria-hidden": "true" });
  svg.append(resultLayer);

  const pointLayer = svgElement("g");
  const selectablePoints = rangePoints(xRange, yRange)
    .filter((point) => gridPointKey(point) !== gridPointKey(origin));

  const status = document.createElement("p");
  status.className = "vector-grid-status";
  status.setAttribute("role", "status");
  status.setAttribute("aria-live", "polite");
  status.textContent = "Wähle den Endpunkt der Resultierenden auf einem Gitterpunkt.";

  const clearButton = document.createElement("button");
  clearButton.type = "button";
  clearButton.textContent = "Auswahl löschen";
  clearButton.disabled = true;
  const actions = document.createElement("div");
  actions.className = "vector-grid-actions";
  actions.append(clearButton);

  function renderResult() {
    resultLayer.replaceChildren();
    pointLayer.querySelectorAll(".grid-point").forEach((pointElement) => {
      pointElement.classList.toggle(
        "is-selected",
        selection !== null && pointElement.dataset.pointKey === gridPointKey(selection)
      );
    });

    if (!selection) {
      clearButton.disabled = true;
      status.textContent = "Wähle den Endpunkt der Resultierenden auf einem Gitterpunkt.";
      return;
    }

    const selectedSvg = toSvgPoint(selection);
    resultLayer.append(svgElement("line", {
      x1: originSvg.x,
      y1: originSvg.y,
      x2: selectedSvg.x,
      y2: selectedSvg.y,
      class: "result-vector",
      "marker-end": `url(#${svgId}-result)`,
    }));
    clearButton.disabled = false;
    status.textContent = `Endpunkt (${selection.x}|${selection.y}) gewählt. Die Resultierende ist eingezeichnet.`;
  }

  function selectPoint(point) {
    selection = { x: point.x, y: point.y };
    renderResult();
    onSelect({ ...selection });
  }

  function focusGridPoint(point) {
    const target = pointLayer.querySelector(
      `[data-point-key="${gridPointKey(point)}"]`
    );
    if (target) {
      pointLayer.querySelectorAll(".grid-point").forEach((element) => {
        element.setAttribute("tabindex", "-1");
      });
      target.setAttribute("tabindex", "0");
      target.focus();
    }
  }

  selectablePoints.forEach((point, index) => {
    const svgPoint = toSvgPoint(point);
    const control = svgElement("circle", {
      cx: svgPoint.x,
      cy: svgPoint.y,
      r: Math.max(18, Math.min(scaleX, scaleY) * 0.36),
      class: "grid-point",
      role: "button",
      tabindex: index === 0 ? 0 : -1,
      "aria-label": `Endpunkt bei (${point.x}|${point.y}) wählen`,
      "data-point-key": gridPointKey(point),
    });
    control.addEventListener("click", () => selectPoint(point));
    control.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        selectPoint(point);
        return;
      }

      const direction = {
        ArrowLeft: { x: -1, y: 0 },
        ArrowRight: { x: 1, y: 0 },
        ArrowDown: { x: 0, y: -1 },
        ArrowUp: { x: 0, y: 1 },
      }[event.key];
      if (direction) {
        event.preventDefault();
        focusGridPoint(nextSelectablePoint(point, direction, origin));
      }
    });
    pointLayer.append(control);
  });
  svg.append(pointLayer);

  clearButton.addEventListener("click", () => {
    selection = null;
    renderResult();
  });

  wrapper.append(svg, status, actions);
  container.replaceChildren(wrapper);
  renderResult();

  return {
    clear() {
      selection = null;
      renderResult();
    },
    getSelection() {
      return selection ? { ...selection } : null;
    },
  };
}
