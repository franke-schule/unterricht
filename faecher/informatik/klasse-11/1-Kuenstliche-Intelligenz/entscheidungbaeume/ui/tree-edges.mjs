const SVG_NAMESPACE = "http://www.w3.org/2000/svg";
const renderers = new WeakMap();

function centerX(rect) {
  return rect.left + (rect.right - rect.left) / 2;
}

function point(x, y) {
  return { x, y };
}

/**
 * Calculates orthogonal, continuous parent-to-child paths from real node boxes.
 * Coordinates are expected to use the same coordinate system.
 */
export function calculateTreeEdges(parentRect, childRects) {
  if (!parentRect || childRects.length === 0) return [];

  const start = point(centerX(parentRect), parentRect.bottom);
  if (childRects.length === 1) {
    const child = childRects[0];
    const end = point(centerX(child), child.top);
    const split = point(start.x, start.y + (end.y - start.y) / 2);
    return [{ start, split, end, path: `M ${start.x} ${start.y} V ${split.y} H ${end.x} V ${end.y}` }];
  }

  const nearestChildTop = Math.min(...childRects.map((rect) => rect.top));
  const splitY = start.y + (nearestChildTop - start.y) / 2;
  return childRects.map((child) => {
    const split = point(start.x, splitY);
    const end = point(centerX(child), child.top);
    return {
      start: { ...start },
      split,
      end,
      path: `M ${start.x} ${start.y} V ${split.y} H ${end.x} V ${end.y}`,
    };
  });
}

function localRect(element, rootRect, scaleX, scaleY) {
  const rect = element.getBoundingClientRect();
  return {
    left: (rect.left - rootRect.left) / scaleX,
    right: (rect.right - rootRect.left) / scaleX,
    top: (rect.top - rootRect.top) / scaleY,
    bottom: (rect.bottom - rootRect.top) / scaleY,
  };
}

function makeSvgElement(name, attributes = {}) {
  const element = document.createElementNS(SVG_NAMESPACE, name);
  Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, value));
  return element;
}

class TreeEdgeRenderer {
  constructor(root) {
    this.root = root;
    this.frame = 0;
    this.layer = document.createElement("div");
    this.layer.className = "dt-tree-edge-layer";
    this.svg = makeSvgElement("svg", { "aria-hidden": "true", focusable: "false" });
    this.svg.classList.add("dt-tree-edges");
    this.layer.append(this.svg);
    this.resizeObserver = typeof ResizeObserver === "undefined"
      ? null
      : new ResizeObserver(() => this.schedule());
  }

  refresh() {
    this.resizeObserver?.disconnect();
    this.resizeObserver?.observe(this.root);
    this.root.querySelectorAll("[data-tree-node-key]").forEach((node) => this.resizeObserver?.observe(node));
    this.schedule();
  }

  schedule() {
    cancelAnimationFrame(this.frame);
    this.frame = requestAnimationFrame(() => this.draw());
  }

  draw() {
    if (!this.root.isConnected || this.root.hidden) return;
    if (this.layer.parentElement !== this.root) this.root.prepend(this.layer);

    // The HTML layer is out of flow, so the full-size SVG cannot affect the
    // intrinsic max-content size of deep trees.
    const width = this.root.offsetWidth;
    const height = this.root.offsetHeight;
    this.svg.setAttribute("width", "100%");
    this.svg.setAttribute("height", "100%");
    this.svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    this.svg.replaceChildren();

    const rootRect = this.root.getBoundingClientRect();
    if (rootRect.width === 0 || rootRect.height === 0) return;
    const scaleX = rootRect.width / this.root.offsetWidth || 1;
    const scaleY = rootRect.height / this.root.offsetHeight || scaleX;
    const nodes = [...this.root.querySelectorAll("[data-tree-node-key]")];
    const nodesByKey = new Map(nodes.map((node) => [node.dataset.treeNodeKey, node]));
    const childrenByParent = new Map();

    nodes.forEach((node) => {
      const parentKey = node.dataset.treeParentKey;
      if (!parentKey) return;
      if (!childrenByParent.has(parentKey)) childrenByParent.set(parentKey, []);
      childrenByParent.get(parentKey).push(node);
    });

    childrenByParent.forEach((children, parentKey) => {
      const parent = nodesByKey.get(parentKey);
      if (!parent) return;
      const parentRect = localRect(parent, rootRect, scaleX, scaleY);
      const childRects = children.map((child) => localRect(child, rootRect, scaleX, scaleY));
      const edges = calculateTreeEdges(parentRect, childRects);

      edges.forEach((edge, index) => {
        const path = makeSvgElement("path", {
          d: edge.path,
          "data-tree-edge-from": parentKey,
          "data-tree-edge-to": children[index].dataset.treeNodeKey,
          "vector-effect": "non-scaling-stroke",
        });
        path.classList.add("dt-tree-edge");
        if (children[index].dataset.treeEdgeActive === "true") path.classList.add("is-active");
        this.svg.append(path);
      });
    });
  }
}

/**
 * Creates (or refreshes) the shared SVG edge layer for one rendered tree.
 * Nodes opt in with data-tree-node-key and data-tree-parent-key attributes.
 */
export function renderTreeEdges(root) {
  if (!root) return null;
  let renderer = renderers.get(root);
  if (!renderer) {
    renderer = new TreeEdgeRenderer(root);
    renderers.set(root, renderer);
  }
  renderer.refresh();
  return renderer;
}
