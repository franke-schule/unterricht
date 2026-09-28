/* Orinoco-Online-kompatibler DFD-Editor ohne externe Skripte. */
(() => {
  "use strict";

  const api = window.DfdFunctions;
  if (!api) throw new Error("dfd-functions.js muss vor dfd-editor.js geladen werden.");
  const NS = "http://www.w3.org/2000/svg";
  const WIDTH = 960, HEIGHT = 640;
  let mountNumber = 0;
  const names = { "+": "plus", "-": "minus", "*": "mal", "/": "geteilt durch", "^": "hoch", "=": "gleich", "<>": "ungleich", "<": "kleiner", "<=": "kleiner gleich", ">": "größer", ">=": "größer gleich" };
  const types = { input: "Eingabe", constant: "Konstante", function: "Funktion", splitter: "Verteiler", output: "Ausgabe" };
  const displayLabel = (node) => node.type === "function" ? (names[node.functionId] || node.functionId) : node.label;
  const shape = (node) => node.type === "splitter" ? { w: 32, h: 32 } : { w: node.type === "function" ? 164 : 152, h: 64 };
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const svgElement = (tag, attrs = {}) => {
    const element = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, String(value)));
    return element;
  };
  function toolIcon(key) {
    const icon = svgElement("svg", { viewBox: "0 0 40 28", class: `dfd-editor-tool-icon dfd-editor-tool-${key}`, "aria-hidden": "true" });
    const addText = (value, x = 20) => {
      const label = svgElement("text", { x, y: 18, "text-anchor": "middle" });
      label.textContent = value;
      icon.append(label);
    };
    if (["input", "constant", "function", "output"].includes(key)) {
      icon.append(svgElement("rect", { x: 3, y: 4, width: 34, height: 20, rx: key === "function" ? 8 : 3 }));
      addText({ input: "E", constant: "1", function: "+", output: "A" }[key]);
    } else if (key === "splitter") {
      icon.append(svgElement("circle", { cx: 20, cy: 14, r: 10 }));
      addText("•");
    } else if (key === "connect") {
      icon.append(svgElement("path", { d: "M 4 14 H 32 M 25 7 L 33 14 L 25 21" }));
    } else if (key === "delete") {
      icon.append(svgElement("path", { d: "M 11 5 L 29 23 M 29 5 L 11 23" }));
    }
    return icon;
  }
  const option = (value, label) => {
    const element = document.createElement("option");
    element.value = value;
    element.textContent = label;
    return element;
  };
  const nextId = (document, prefix) => {
    const taken = new Set([...document.nodes, ...document.edges].map((item) => item.id));
    let n = 1;
    while (taken.has(`${prefix}${n}`)) n++;
    return `${prefix}${n}`;
  };
  const countPorts = (node) => node.type === "function" ? (node.inputCount ?? api.getFunction(node.functionId)?.min ?? 0) :
    node.type === "splitter" || node.type === "output" ? 1 : 0;
  const portName = (node, port) => api.getFunction(node.functionId)?.labels?.[port] || `Eingang ${port + 1}`;

  function createNode(document, type, x, y, extra = {}) {
    if (!Object.hasOwn(types, type)) throw new api.DfdError("Unbekannter Baustein.");
    const node = { id: nextId(document, "n"), type, x: Math.round(x), y: Math.round(y), label: types[type] };
    if (type === "function") Object.assign(node, { functionId: "+", label: "plus", inputCount: 2 });
    if (type === "constant") Object.assign(node, { value: "1", valueType: "number" });
    if (type === "input") Object.assign(node, { valueType: "number" });
    Object.assign(node, extra);
    const updated = clone(document);
    updated.nodes.push(node);
    if (!api.validateDocument(updated).valid) throw new api.DfdError("Der Baustein konnte nicht eingefügt werden.");
    return { document: updated, node };
  }

  function connect(document, from, to, port) {
    const source = document.nodes.find((node) => node.id === from);
    const target = document.nodes.find((node) => node.id === to);
    if (!source || !target) throw new api.DfdError("Wähle zwei vorhandene Bausteine.");
    if (source.type === "output" || ["input", "constant"].includes(target.type) || source.id === target.id) {
      throw new api.DfdError("Diese Bausteine können so nicht verbunden werden.");
    }
    if (!Number.isInteger(port) || port < 0 || port >= countPorts(target)) throw new api.DfdError("Wähle einen gültigen Zieleingang.");
    if (document.edges.some((edge) => edge.to === to && edge.port === port)) throw new api.DfdError("Dieser Eingang ist bereits belegt.");
    if (source.type !== "splitter" && document.edges.some((edge) => edge.from === from)) {
      throw new api.DfdError("Verwende einen Verteiler, wenn ein Wert mehrfach gebraucht wird.");
    }
    const updated = clone(document);
    const edge = { id: nextId(updated, "e"), from, to, port };
    updated.edges.push(edge);
    const seen = new Set(), stack = [to];
    while (stack.length) {
      const id = stack.pop();
      if (id === from) throw new api.DfdError("Dieser Pfeil würde einen Kreis erzeugen.");
      if (seen.has(id)) continue;
      seen.add(id);
      updated.edges.filter((item) => item.from === id).forEach((item) => stack.push(item.to));
    }
    const validation = api.validateDocument(updated);
    if (!validation.valid) throw new api.DfdError(validation.errors[0]);
    return { document: updated, edge };
  }

  function mount(root, { storageKey } = {}) {
    if (!(root instanceof Element)) throw new Error("DfdEditor.mount benötigt ein HTML-Element.");
    if (typeof storageKey !== "string" || !/^[a-z0-9-]+-v\d+$/i.test(storageKey)) throw new Error("Ein versionierter storageKey ist erforderlich.");
    if (root.dataset.dfdMounted === "true") throw new Error("Auf diesem Element ist bereits ein DFD-Editor eingebunden.");
    root.dataset.dfdMounted = "true";
    const uid = `dfd-${++mountNumber}`;
    let diagram = api.createEmptyDocument();
    let inputValues = {};
    let selectedNode = null, selectedEdge = null, activeTool = null, connectionSource = null, drag = null;
    let connectionDrag = null, connectionPreview = null;

    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (saved && api.validateDocument(saved.diagram).valid && saved.diagram.nodes.length <= 100 && saved.diagram.edges.length <= 200) {
        diagram = saved.diagram;
        if (saved.inputValues && typeof saved.inputValues === "object" && !Array.isArray(saved.inputValues)) {
          for (const [id, value] of Object.entries(saved.inputValues)) {
            if (typeof value === "string" && value.length <= 200) inputValues[id] = value;
          }
        }
      }
    } catch { /* Ohne lokalen Speicher bleibt der Editor verwendbar. */ }

    root.classList.add("dfd-editor");
    root.innerHTML = `
      <div class="dfd-editor-toolbar" role="toolbar" aria-label="Datenflussdiagramm-Werkzeuge"></div>
      <p class="dfd-editor-hint">Ziehe einen Baustein auf die Zeichenfläche oder wähle ihn aus und tippe auf eine Stelle. Für einen Datenfluss ziehe vom unteren Anschluss eines Bausteins zum oberen Anschluss des nächsten. Antippen funktioniert ebenfalls.</p>
      <div class="dfd-editor-layout">
        <div class="dfd-editor-viewport" tabindex="0" role="region" aria-label="Zeichenfläche für Datenflussdiagramm; mit Enter Baustein in der Mitte einfügen">
          <svg class="dfd-editor-svg" viewBox="0 0 960 640" role="group" aria-label="Bearbeitbares Datenflussdiagramm"></svg>
        </div>
        <aside class="dfd-editor-side" aria-label="Bausteine und Eigenschaften">
          <section><h3>Bausteine</h3><div class="dfd-editor-node-list"></div></section>
          <section><h3>Eigenschaften</h3><div class="dfd-editor-inspector"></div></section>
          <section><h3>Datenflüsse</h3><div class="dfd-editor-edge-list"></div></section>
        </aside>
      </div>
      <div class="dfd-editor-actions"><button type="button" data-dfd-action="calculate">Berechnen</button><button type="button" data-dfd-action="export">Bild herunterladen</button><button type="button" data-dfd-action="reset">Diagramm zurücksetzen</button></div>
      <div class="dfd-editor-inputs" aria-label="Eingabewerte"></div>
      <p class="dfd-editor-status" role="status" aria-live="polite">Bereit.</p>
      <div class="dfd-editor-results" aria-live="polite" hidden></div>`;
    const toolbar = root.querySelector(".dfd-editor-toolbar");
    const viewport = root.querySelector(".dfd-editor-viewport");
    const svg = root.querySelector(".dfd-editor-svg");
    const nodeList = root.querySelector(".dfd-editor-node-list");
    const inspector = root.querySelector(".dfd-editor-inspector");
    const edgeList = root.querySelector(".dfd-editor-edge-list");
    const inputsBox = root.querySelector(".dfd-editor-inputs");
    const status = root.querySelector(".dfd-editor-status");
    const results = root.querySelector(".dfd-editor-results");
    const setStatus = (message) => { status.textContent = message; };
    const clearResult = () => { results.hidden = true; results.textContent = ""; };
    const save = () => {
      try { localStorage.setItem(storageKey, JSON.stringify({ diagram, inputValues })); } catch { /* weiter ohne Speicherung */ }
    };
    const changed = () => {
      save(); clearResult(); render();
      root.dispatchEvent(new CustomEvent("dfd:change", { bubbles: true }));
    };
    const selected = () => diagram.nodes.find((node) => node.id === selectedNode);
    const point = (event) => {
      const box = svg.getBoundingClientRect();
      return { x: Math.max(30, Math.min(WIDTH - 30, (event.clientX - box.left) * WIDTH / box.width)),
        y: Math.max(30, Math.min(HEIGHT - 30, (event.clientY - box.top) * HEIGHT / box.height)) };
    };
    const onCanvas = (x, y) => {
      const visible = viewport.getBoundingClientRect(), box = svg.getBoundingClientRect();
      return x >= visible.left && x <= visible.right && y >= visible.top && y <= visible.bottom &&
        x >= box.left && x <= box.right && y >= box.top && y <= box.bottom;
    };

    function add(type, position) {
      try {
        const result = createNode(diagram, type, position.x, position.y);
        diagram = result.document;
        selectedNode = result.node.id; selectedEdge = null; activeTool = null;
        changed(); setStatus(`${types[type]} eingefügt. Bearbeite die Eigenschaften rechts.`);
      } catch (error) { setStatus(error.message); }
    }

    for (const [key, label] of [["input", "Eingabe"], ["constant", "Konstante"], ["function", "Funktion"], ["splitter", "Verteiler"], ["output", "Ausgabe"], ["connect", "Datenfluss"], ["delete", "Löschen"]]) {
      const button = document.createElement("button");
      button.type = "button"; button.dataset.tool = key;
      button.append(toolIcon(key), document.createTextNode(label));
      button.addEventListener("click", () => {
        if (button.dataset.dragged === "true") { delete button.dataset.dragged; return; }
        activeTool = activeTool === key ? null : key;
        connectionSource = null;
        renderToolbar();
        renderGraph();
        setStatus(activeTool === "connect" ? "Wähle zuerst einen Ausgang und dann den oberen Anschluss des Ziels." :
          activeTool === "delete" ? "Wähle einen Baustein oder Pfeil zum Löschen." :
          activeTool ? `Tippe auf die Zeichenfläche, um ${label} einzufügen. Du kannst den Baustein auch hierher ziehen.` : "Werkzeug abgewählt.");
      });
      if (Object.hasOwn(types, key)) {
        button.addEventListener("pointerdown", (event) => {
          if (event.button !== 0) return;
          const start = { x: event.clientX, y: event.clientY };
          let ghost = null;
          button.setPointerCapture(event.pointerId);
          const move = (current) => {
            if (!ghost && Math.hypot(current.clientX - start.x, current.clientY - start.y) < 6) return;
            if (!ghost) {
              ghost = document.createElement("div");
              ghost.className = "dfd-editor-drag-preview";
              ghost.append(toolIcon(key), document.createTextNode(label));
              document.body.append(ghost);
              button.classList.add("is-dragging");
            }
            ghost.style.left = `${current.clientX}px`;
            ghost.style.top = `${current.clientY}px`;
            viewport.classList.toggle("is-drop-target", onCanvas(current.clientX, current.clientY));
          };
          const end = (current) => {
            button.removeEventListener("pointermove", move);
            button.removeEventListener("pointerup", end);
            button.removeEventListener("pointercancel", end);
            if (button.hasPointerCapture(current.pointerId)) button.releasePointerCapture(current.pointerId);
            viewport.classList.remove("is-drop-target");
            button.classList.remove("is-dragging");
            if (!ghost) return;
            ghost.remove();
            button.dataset.dragged = "true";
            window.setTimeout(() => { delete button.dataset.dragged; }, 0);
            if (current.type === "pointerup" && onCanvas(current.clientX, current.clientY)) {
              activeTool = null;
              renderToolbar();
              add(key, point(current));
            } else setStatus("Lege den Baustein auf der Zeichenfläche ab.");
          };
          button.addEventListener("pointermove", move);
          button.addEventListener("pointerup", end);
          button.addEventListener("pointercancel", end);
        });
      }
      toolbar.append(button);
    }

    function renderToolbar() {
      toolbar.querySelectorAll("button").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.tool === activeTool)));
      viewport.classList.toggle("is-placing", activeTool && !["connect", "delete"].includes(activeTool));
    }

    function portPosition(node, port, source = false) {
      const { w, h } = shape(node);
      if (source) return { x: node.x, y: node.y + h / 2 };
      const count = countPorts(node);
      return { x: node.x - w / 2 + w * (port + 1) / (count + 1), y: node.y - h / 2 };
    }

    function edgePath(edge) {
      const from = diagram.nodes.find((node) => node.id === edge.from);
      const to = diagram.nodes.find((node) => node.id === edge.to);
      if (!from || !to) return "";
      const a = portPosition(from, 0, true), b = portPosition(to, edge.port);
      a.y += 9;
      b.y -= 9;
      if (b.y <= a.y) {
        const right = b.x >= a.x;
        const channel = right
          ? Math.min(WIDTH - 14, Math.max(a.x + shape(from).w / 2, b.x + shape(to).w / 2) + 38)
          : Math.max(14, Math.min(a.x - shape(from).w / 2, b.x - shape(to).w / 2) - 38);
        return `M ${a.x} ${a.y} L ${a.x} ${a.y + 30} L ${channel} ${a.y + 30} L ${channel} ${b.y - 30} L ${b.x} ${b.y - 30} L ${b.x} ${b.y}`;
      }
      const bend = Math.max(36, Math.abs(b.y - a.y) * 0.45);
      return `M ${a.x} ${a.y} C ${a.x} ${a.y + bend}, ${b.x} ${b.y - bend}, ${b.x} ${b.y}`;
    }

    function renderGraph() {
      svg.replaceChildren();
      const defs = svgElement("defs");
      const marker = svgElement("marker", { id: `${uid}-arrow`, markerWidth: 10, markerHeight: 10, refX: 9, refY: 5, orient: "auto", markerUnits: "userSpaceOnUse" });
      marker.append(svgElement("path", { d: "M 0 0 L 10 5 L 0 10 Z", fill: "#1d4ed8" }));
      defs.append(marker); svg.append(defs);
      svg.append(svgElement("rect", { x: 0, y: 0, width: WIDTH, height: HEIGHT, class: "dfd-editor-background" }));
      for (const edge of diagram.edges) {
        const group = svgElement("g", { "data-edge": edge.id, tabindex: 0, role: "button", "aria-label": `Datenfluss von ${displayLabel(diagram.nodes.find((n) => n.id === edge.from))} zu ${displayLabel(diagram.nodes.find((n) => n.id === edge.to))}, ${edge.port + 1}. Eingang` });
        const path = edgePath(edge);
        group.append(svgElement("path", { d: path, class: "dfd-editor-edge-hit" }));
        group.append(svgElement("path", { d: path, class: `dfd-editor-edge${selectedEdge === edge.id ? " is-selected" : ""}`, "marker-end": `url(#${uid}-arrow)` }));
        svg.append(group);
      }
      for (const node of diagram.nodes) {
        const { w, h } = shape(node);
        const group = svgElement("g", { "data-node": node.id, tabindex: 0, role: "button", "aria-label": `${types[node.type]} ${displayLabel(node)}; auswählen oder verschieben`, class: `dfd-editor-node dfd-editor-${node.type}${selectedNode === node.id ? " is-selected" : ""}` });
        if (node.type === "splitter") group.append(svgElement("circle", { cx: node.x, cy: node.y, r: 16 }));
        else group.append(svgElement("rect", { x: node.x - w / 2, y: node.y - h / 2, width: w, height: h, rx: node.type === "function" ? 14 : 5 }));
        if (node.type !== "splitter") {
          const label = displayLabel(node);
          const lines = label.length > 20 ? [label.slice(0, 20), label.slice(20, 40)] : [label];
          lines.forEach((line, index) => {
            const text = svgElement("text", { x: node.x, y: node.y - (lines.length - 1) * 9 + index * 18, "text-anchor": "middle", "dominant-baseline": "middle", class: "dfd-editor-label" });
            text.textContent = line; group.append(text);
          });
          if (node.type === "constant") {
            const value = svgElement("text", { x: node.x, y: node.y + 24, "text-anchor": "middle", class: "dfd-editor-value" });
            value.textContent = node.value; group.append(value);
          }
        }
        if (node.type === "function") {
          for (let port = 0; port < countPorts(node); port++) {
            const p = portPosition(node, port);
            const mark = svgElement("text", { x: p.x, y: p.y + 13, "text-anchor": "middle", class: "dfd-editor-port" });
            mark.textContent = node.functionId === "WENN" ? ["B", "Ja", "Nein"][port] : String(port + 1);
            group.append(mark);
          }
        }
        if (node.type !== "output") {
          const p = portPosition(node, 0, true);
          group.append(svgElement("circle", { cx: p.x, cy: p.y, r: 9, "data-output-node": node.id,
            tabindex: 0, role: "button", "aria-label": `Datenfluss bei ${displayLabel(node)} beginnen`,
            class: `dfd-editor-connector dfd-editor-output-port${connectionSource === node.id ? " is-active" : ""}` }));
        }
        for (let port = 0; port < countPorts(node); port++) {
          const p = portPosition(node, port);
          group.append(svgElement("circle", { cx: p.x, cy: p.y, r: 9, "data-input-node": node.id,
            "data-port": port, tabindex: 0, role: "button",
            "aria-label": `Datenfluss bei ${displayLabel(node)} an ${portName(node, port)} anschließen`,
            class: "dfd-editor-connector dfd-editor-input-port" }));
        }
        svg.append(group);
      }
    }

    function renderList() {
      nodeList.replaceChildren();
      if (!diagram.nodes.length) nodeList.textContent = "Noch keine Bausteine.";
      for (const node of diagram.nodes) {
        const button = document.createElement("button");
        button.type = "button"; button.textContent = `${types[node.type]}: ${displayLabel(node)}`;
        button.setAttribute("aria-pressed", String(selectedNode === node.id));
        button.addEventListener("click", () => chooseNode(node.id));
        nodeList.append(button);
      }
      edgeList.replaceChildren();
      if (!diagram.edges.length) edgeList.textContent = "Noch keine Datenflüsse.";
      for (const edge of diagram.edges) {
        const row = document.createElement("div"); row.className = "dfd-editor-edge-row";
        const target = diagram.nodes.find((node) => node.id === edge.to);
        const label = document.createElement("span");
        label.textContent = `${displayLabel(diagram.nodes.find((node) => node.id === edge.from))} → ${displayLabel(target)} (${portName(target, edge.port)})`;
        const remove = document.createElement("button"); remove.type = "button"; remove.textContent = "Entfernen";
        remove.setAttribute("aria-label", `Datenfluss ${label.textContent} entfernen`);
        remove.addEventListener("click", () => removeEdge(edge.id));
        row.append(label, remove); edgeList.append(row);
      }
    }

    function labelField(textValue, current, onInput) {
      const wrap = document.createElement("label"); wrap.textContent = textValue;
      const input = document.createElement("input"); input.type = "text"; input.maxLength = 120; input.value = current;
      input.addEventListener("input", () => onInput(input.value));
      wrap.append(input); return wrap;
    }
    function selectField(label, items, value, onChange) {
      const wrap = document.createElement("label"); wrap.textContent = label;
      const select = document.createElement("select");
      items.forEach(([id, name]) => select.append(option(id, name)));
      select.value = value;
      select.addEventListener("change", () => onChange(select.value));
      wrap.append(select); return wrap;
    }
    function mutateNode(id, changes, keepInspector = false) {
      const node = diagram.nodes.find((item) => item.id === id);
      if (!node) return;
      Object.assign(node, changes);
      if (keepInspector) {
        save(); clearResult(); renderGraph(); renderList(); renderInputs();
        root.dispatchEvent(new CustomEvent("dfd:change", { bubbles: true }));
      } else changed();
    }
    function renderInspector() {
      inspector.replaceChildren();
      const node = selected();
      if (!node) { inspector.textContent = "Wähle einen Baustein aus."; return; }
      if (node.type !== "function") inspector.append(labelField("Beschriftung", node.label, (label) => mutateNode(node.id, { label: label.trim() || types[node.type] }, true)));
      if (node.type === "constant") {
        inspector.append(labelField("Fester Wert", node.value, (value) => mutateNode(node.id, { value }, true)));
      }
      if (node.type === "input" || node.type === "constant") {
        inspector.append(selectField("Werttyp", [["auto", "Automatisch"], ["number", "Zahl"], ["text", "Text"], ["boolean", "WAHR/FALSCH"]], node.valueType || "auto", (valueType) => mutateNode(node.id, { valueType })));
      }
      if (node.type === "function") {
        const definitions = api.listFunctions();
        inspector.append(selectField("Funktion", [...new Set(definitions.map((item) => item.group))].flatMap((group) => definitions.filter((item) => item.group === group).map((item) => [item.id, `${group}: ${names[item.id] || item.label}`])), node.functionId, (functionId) => {
          const definition = api.getFunction(functionId);
          diagram.edges = diagram.edges.filter((edge) => edge.to !== node.id || edge.port < definition.min);
          mutateNode(node.id, { functionId, inputCount: definition.min, label: names[functionId] || functionId });
        }));
        const definition = api.getFunction(node.functionId);
        if (definition.max > definition.min) {
          inspector.append(selectField("Anzahl Eingänge", Array.from({ length: definition.max - definition.min + 1 }, (_, n) => [String(n + definition.min), String(n + definition.min)]), String(countPorts(node)), (value) => {
            const count = Number(value);
            diagram.edges = diagram.edges.filter((edge) => edge.to !== node.id || edge.port < count);
            mutateNode(node.id, { inputCount: count });
          }));
        }
        const list = document.createElement("ol"); list.className = "dfd-editor-port-list";
        for (let port = 0; port < countPorts(node); port++) {
          const item = document.createElement("li"); item.textContent = portName(node, port); list.append(item);
        }
        inspector.append(list);
      }
      const deleteButton = document.createElement("button"); deleteButton.type = "button"; deleteButton.textContent = "Baustein löschen";
      deleteButton.addEventListener("click", () => removeNode(node.id)); inspector.append(deleteButton);
    }

    function renderInputs() {
      inputsBox.replaceChildren();
      const inputNodes = diagram.nodes.filter((node) => node.type === "input");
      if (!inputNodes.length) return;
      const heading = document.createElement("h3"); heading.textContent = "Werte zum Berechnen"; inputsBox.append(heading);
      for (const node of inputNodes) {
        const row = document.createElement("label"); row.textContent = node.label;
        const input = document.createElement("input"); input.type = "text"; input.value = inputValues[node.id] || "";
        input.setAttribute("aria-label", `Wert für ${node.label}`);
        input.addEventListener("input", () => { inputValues[node.id] = input.value; save(); clearResult(); });
        row.append(input); inputsBox.append(row);
      }
    }
    function render() { renderToolbar(); renderGraph(); renderList(); renderInspector(); renderInputs(); }

    function removeNode(id) {
      diagram.nodes = diagram.nodes.filter((node) => node.id !== id);
      diagram.edges = diagram.edges.filter((edge) => edge.from !== id && edge.to !== id);
      delete inputValues[id]; selectedNode = null; changed(); setStatus("Baustein und verbundene Pfeile gelöscht.");
    }
    function removeEdge(id) {
      diagram.edges = diagram.edges.filter((edge) => edge.id !== id);
      selectedEdge = null; changed(); setStatus("Datenfluss gelöscht.");
    }
    function chooseNode(id) {
      const node = diagram.nodes.find((item) => item.id === id);
      if (!node) return;
      if (activeTool === "delete") { removeNode(id); return; }
      if (activeTool === "connect") {
        if (!connectionSource) { startConnection(id); return; }
        if (connectionSource === id) { setStatus("Wähle einen anderen Zielbaustein."); return; }
        const target = node;
        const ports = countPorts(target);
        if (!ports) { setStatus("Dieser Baustein hat keinen Eingang."); return; }
        const source = connectionSource;
        connectionSource = null; activeTool = null; renderToolbar();
        showConnectionChoice(source, target.id);
        return;
      }
      selectedNode = id; selectedEdge = null; renderGraph(); renderList(); renderInspector();
      setStatus(`${types[node.type]} ${node.label} ausgewählt.`);
    }
    function showConnectionChoice(from, to) {
      const target = diagram.nodes.find((node) => node.id === to);
      if (!target) return;
      selectedNode = to; render();
      const choice = selectField("Zieleingang für den Datenfluss", Array.from({ length: countPorts(target) }, (_, port) => [String(port), portName(target, port)]), "0", () => {});
      const button = document.createElement("button"); button.type = "button"; button.textContent = "Datenfluss verbinden";
      button.addEventListener("click", () => {
        try {
          diagram = connect(diagram, from, to, Number(choice.querySelector("select").value)).document;
          changed(); setStatus("Datenfluss verbunden.");
        } catch (error) { setStatus(error.message); }
      });
      inspector.prepend(choice, button);
      choice.querySelector("select").focus();
    }

    function startConnection(id) {
      const node = diagram.nodes.find((item) => item.id === id);
      if (!node || node.type === "output") { setStatus("Eine Ausgabe hat keinen Ausgang."); return; }
      const keyboardFocus = document.activeElement?.getAttribute("data-output-node") === id;
      connectionSource = id;
      activeTool = "connect";
      renderToolbar(); renderGraph();
      if (keyboardFocus) svg.querySelector(`[data-output-node="${id}"]`)?.focus();
      setStatus(`Ausgang von ${displayLabel(node)} gewählt. Tippe auf einen oberen Anschluss oder ziehe den Pfeil dorthin.`);
    }
    function connectTo(id, port) {
      if (!connectionSource) { setStatus("Wähle zuerst einen unteren Ausgang."); return; }
      try {
        const source = connectionSource;
        const result = connect(diagram, source, id, port);
        diagram = result.document;
        connectionSource = null; activeTool = null;
        changed();
        svg.querySelector(`[data-edge="${result.edge.id}"]`)?.focus();
        const target = diagram.nodes.find((node) => node.id === id);
        setStatus(`Datenfluss ${displayLabel(diagram.nodes.find((node) => node.id === source))} → ${displayLabel(target)} (${portName(target, port)}) verbunden.`);
      } catch (error) { setStatus(error.message); }
    }
    function nearestPort(node, x) {
      let best = 0, distance = Infinity;
      for (let port = 0; port < countPorts(node); port++) {
        const gap = Math.abs(portPosition(node, port).x - x);
        if (gap < distance) { best = port; distance = gap; }
      }
      return best;
    }
    function connectionTarget(x, y) {
      const hit = document.elementFromPoint(x, y);
      const input = hit?.closest("[data-input-node]");
      if (input && svg.contains(input)) return { id: input.dataset.inputNode, port: Number(input.dataset.port) };
      const group = hit?.closest("[data-node]");
      if (!group || !svg.contains(group)) return null;
      const node = diagram.nodes.find((item) => item.id === group.dataset.node);
      if (!node || !countPorts(node)) return null;
      return { id: node.id, port: nearestPort(node, point({ clientX: x, clientY: y }).x) };
    }
    function clearConnectionPreview() {
      connectionPreview?.remove();
      connectionPreview = null;
    }

    svg.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      const outputPort = event.target.closest("[data-output-node]");
      const inputPort = event.target.closest("[data-input-node]");
      if (outputPort) {
        const id = outputPort.dataset.outputNode;
        startConnection(id);
        connectionDrag = { id, start: { x: event.clientX, y: event.clientY }, moved: false };
        svg.setPointerCapture(event.pointerId);
        event.preventDefault();
        return;
      }
      if (inputPort) {
        connectTo(inputPort.dataset.inputNode, Number(inputPort.dataset.port));
        event.preventDefault();
        return;
      }
      const nodeGroup = event.target.closest("[data-node]");
      const edgeGroup = event.target.closest("[data-edge]");
      if (nodeGroup) {
        const id = nodeGroup.dataset.node;
        if (connectionSource && id !== connectionSource && activeTool === "connect") {
          const target = diagram.nodes.find((node) => node.id === id);
          if (countPorts(target)) connectTo(id, nearestPort(target, point(event).x));
          else setStatus("Dieser Baustein hat keinen Eingang.");
          return;
        }
        if (activeTool || !diagram.nodes.some((node) => node.id === id)) { chooseNode(id); return; }
        selectedNode = id; selectedEdge = null;
        drag = { id, start: point(event), original: { x: diagram.nodes.find((n) => n.id === id).x, y: diagram.nodes.find((n) => n.id === id).y }, moved: false };
        svg.setPointerCapture(event.pointerId);
        renderGraph(); renderList(); renderInspector();
      } else if (edgeGroup) {
        if (activeTool === "delete") removeEdge(edgeGroup.dataset.edge);
        else { selectedEdge = edgeGroup.dataset.edge; selectedNode = null; renderGraph(); renderList(); renderInspector(); setStatus("Datenfluss ausgewählt. Mit Entf entfernen."); }
      } else if (activeTool && !["connect", "delete"].includes(activeTool)) add(activeTool, point(event));
    });
    svg.addEventListener("pointermove", (event) => {
      if (connectionDrag && svg.hasPointerCapture(event.pointerId)) {
        if (!connectionDrag.moved && Math.hypot(event.clientX - connectionDrag.start.x, event.clientY - connectionDrag.start.y) < 5) return;
        connectionDrag.moved = true;
        if (!connectionPreview) {
          connectionPreview = svgElement("path", { class: "dfd-editor-connection-preview", "marker-end": `url(#${uid}-arrow)` });
          svg.append(connectionPreview);
        }
        const source = diagram.nodes.find((node) => node.id === connectionDrag.id);
        const a = portPosition(source, 0, true), b = point(event);
        a.y += 9;
        connectionPreview.setAttribute("d", `M ${a.x} ${a.y} L ${b.x} ${b.y}`);
        return;
      }
      if (!drag || !svg.hasPointerCapture(event.pointerId)) return;
      const p = point(event), dx = p.x - drag.start.x, dy = p.y - drag.start.y;
      if (Math.hypot(dx, dy) < 3 && !drag.moved) return;
      drag.moved = true;
      const node = diagram.nodes.find((item) => item.id === drag.id);
      if (!node) return;
      node.x = Math.max(30, Math.min(WIDTH - 30, Math.round(drag.original.x + dx)));
      node.y = Math.max(30, Math.min(HEIGHT - 30, Math.round(drag.original.y + dy)));
      renderGraph();
    });
    const endDrag = (event) => {
      if (connectionDrag) {
        const moved = connectionDrag.moved;
        connectionDrag = null;
        clearConnectionPreview();
        if (svg.hasPointerCapture(event.pointerId)) svg.releasePointerCapture(event.pointerId);
        if (moved && event.type === "pointerup") {
          const target = connectionTarget(event.clientX, event.clientY);
          if (target) connectTo(target.id, target.port);
          else setStatus("Ziehe den Pfeil zu einem oberen Anschluss eines anderen Bausteins.");
        }
        return;
      }
      if (!drag) return;
      if (svg.hasPointerCapture(event.pointerId)) svg.releasePointerCapture(event.pointerId);
      const moved = drag.moved; drag = null;
      if (moved) { changed(); setStatus("Baustein verschoben."); }
    };
    svg.addEventListener("pointerup", endDrag);
    svg.addEventListener("pointercancel", endDrag);
    svg.addEventListener("keydown", (event) => {
      const outputPort = event.target.closest("[data-output-node]");
      const inputPort = event.target.closest("[data-input-node]");
      if ((event.key === "Enter" || event.key === " ") && (outputPort || inputPort)) {
        event.preventDefault();
        if (outputPort) startConnection(outputPort.dataset.outputNode);
        else connectTo(inputPort.dataset.inputNode, Number(inputPort.dataset.port));
        return;
      }
      const nodeGroup = event.target.closest("[data-node]");
      const edgeGroup = event.target.closest("[data-edge]");
      if (event.key === "Escape") { activeTool = null; connectionSource = null; clearConnectionPreview(); renderToolbar(); renderGraph(); setStatus("Werkzeug abgewählt."); return; }
      if ((event.key === "Enter" || event.key === " ") && nodeGroup) { event.preventDefault(); chooseNode(nodeGroup.dataset.node); return; }
      if ((event.key === "Delete" || event.key === "Backspace") && (nodeGroup || edgeGroup)) {
        event.preventDefault(); if (nodeGroup) removeNode(nodeGroup.dataset.node); else removeEdge(edgeGroup.dataset.edge); return;
      }
      if (nodeGroup && ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(event.key)) {
        event.preventDefault(); const node = diagram.nodes.find((item) => item.id === nodeGroup.dataset.node);
        if (!node) return;
        const step = event.shiftKey ? 1 : 10;
        node.x += (event.key === "ArrowRight" ? step : event.key === "ArrowLeft" ? -step : 0);
        node.y += (event.key === "ArrowDown" ? step : event.key === "ArrowUp" ? -step : 0);
        node.x = Math.max(30, Math.min(WIDTH - 30, node.x)); node.y = Math.max(30, Math.min(HEIGHT - 30, node.y));
        changed(); svg.querySelector(`[data-node="${node.id}"]`)?.focus();
      }
    });
    viewport.addEventListener("keydown", (event) => {
      if (event.target !== viewport || event.key !== "Enter" || !activeTool || ["connect", "delete"].includes(activeTool)) return;
      event.preventDefault(); add(activeTool, { x: WIDTH / 2, y: HEIGHT / 2 });
    });

    function calculate(values = inputValues) {
      try {
        const result = api.evaluate(diagram, values);
        results.replaceChildren(); results.hidden = false;
        const heading = document.createElement("h3"); heading.textContent = "Berechnete Ausgaben"; results.append(heading);
        const list = document.createElement("ul");
        result.outputs.forEach(({ label, value }) => {
          const row = document.createElement("li"); row.textContent = `${label}: ${format(value)}`; list.append(row);
        });
        results.append(list);
        const intermediate = document.createElement("details");
        const summary = document.createElement("summary"); summary.textContent = "Werte an den Datenflüssen anzeigen"; intermediate.append(summary);
        const flowList = document.createElement("ul");
        Object.entries(result.edgeValues).forEach(([id, value]) => {
          const edge = diagram.edges.find((item) => item.id === id);
          const row = document.createElement("li");
          row.textContent = `${diagram.nodes.find((n) => n.id === edge.from)?.label} → ${diagram.nodes.find((n) => n.id === edge.to)?.label}, ${edge.port + 1}. Eingang: ${format(value)}`;
          flowList.append(row);
        });
        intermediate.append(flowList); results.append(intermediate);
        setStatus("Berechnung abgeschlossen.");
        return result;
      } catch (error) {
        results.hidden = false; results.textContent = error.message;
        setStatus("Die Berechnung ist noch nicht möglich. " + error.message);
        return null;
      }
    }
    function format(value) {
      if (value.type === "boolean") return value.value ? "WAHR" : "FALSCH";
      if (value.type === "number") return new Intl.NumberFormat("de-DE", { maximumFractionDigits: 10 }).format(value.value);
      return String(value.value);
    }
    function exportImage() {
      const copy = svg.cloneNode(true);
      copy.removeAttribute("class"); copy.setAttribute("xmlns", NS);
      copy.querySelectorAll("[tabindex], [role], [aria-label], [data-node], [data-edge]").forEach((element) => {
        ["tabindex", "role", "aria-label", "data-node", "data-edge"].forEach((name) => element.removeAttribute(name));
      });
      const style = svgElement("style");
      style.textContent = `.dfd-editor-background{fill:#fff}.dfd-editor-edge{fill:none;stroke:#1d4ed8;stroke-width:2.5}.dfd-editor-edge-hit{display:none}.dfd-editor-input rect,.dfd-editor-output rect{fill:#e8f7ee;stroke:#15803d;stroke-width:2}.dfd-editor-constant rect{fill:#f1f5f9;stroke:#64748b;stroke-width:2}.dfd-editor-function rect{fill:#eff6ff;stroke:#1d4ed8;stroke-width:2}.dfd-editor-splitter circle{fill:#facc15;stroke:#92400e;stroke-width:2}.dfd-editor-label{font:600 16px Arial;fill:#172033}.dfd-editor-value{font:14px Arial;fill:#172033}.dfd-editor-port{font:12px Arial;fill:#1d4ed8}`;
      copy.prepend(style);
      const xml = new XMLSerializer().serializeToString(copy);
      const url = URL.createObjectURL(new Blob([xml], { type: "image/svg+xml;charset=utf-8" }));
      const link = document.createElement("a"); link.href = url; link.download = "datenflussdiagramm.svg";
      document.body.append(link); link.click(); link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setStatus("Das Diagramm wurde als SVG-Bild heruntergeladen.");
    }
    root.querySelector('[data-dfd-action="calculate"]').addEventListener("click", () => calculate());
    root.querySelector('[data-dfd-action="export"]').addEventListener("click", exportImage);
    root.querySelector('[data-dfd-action="reset"]').addEventListener("click", () => {
      if (!window.confirm("Diagramm und gespeicherte Eingabewerte zurücksetzen?")) return;
      diagram = api.createEmptyDocument(); inputValues = {}; selectedNode = null; selectedEdge = null;
      changed(); setStatus("Diagramm zurückgesetzt.");
    });
    render();
    return Object.freeze({
      getDiagram: () => clone(diagram),
      evaluate: (values) => api.evaluate(diagram, values || inputValues),
      reset: () => { diagram = api.createEmptyDocument(); inputValues = {}; selectedNode = null; selectedEdge = null; changed(); },
      destroy: () => { root.replaceChildren(); root.classList.remove("dfd-editor"); delete root.dataset.dfdMounted; }
    });
  }

  window.DfdEditor = Object.freeze({ mount, createNode, connect });
})();
