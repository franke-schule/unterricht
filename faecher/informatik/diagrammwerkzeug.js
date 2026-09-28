/* Diagrammwerkzeug für Klassen- und Objektkarten; ohne externe Abhängigkeiten. */
(() => {
  "use strict";

  const NS = "http://www.w3.org/2000/svg";
  const WIDTH = 1200;
  const MIN_HEIGHT = 760;
  const MAX_Y = 20000;
  const CARD_WIDTH = 260;
  const STORAGE_KEY = "informatik-diagrammwerkzeug-v1";
  const CARD_TYPES = Object.freeze({
    "class-2": "Klasse: Name + Attribute",
    "class-3": "Klasse: Name + Attribute + Methoden",
    "object-2": "Objekt: Bezeichner + Attributwerte",
    abstract: "Abstrakte Klasse",
    interface: "Interface"
  });
  const EDGE_TYPES = Object.freeze({
    line: "Ungerichtete Linie",
    inheritance: "Vererbung",
    association: "Beziehung mit Kardinalitäten"
  });
  const THEMES = Object.freeze({
    standard: { canvas: "#fffdf1", card: "#ffffff", classHead: "#e9f1fb", objectHead: "#e8f7ee", abstractHead: "#f0edff", interfaceHead: "#eaf5f8", ink: "#172033", muted: "#64748b", stroke: "#526a84" },
    white: { canvas: "#ffffff", card: "#ffffff", classHead: "#e9f1fb", objectHead: "#e8f7ee", abstractHead: "#f0edff", interfaceHead: "#eaf5f8", ink: "#172033", muted: "#64748b", stroke: "#526a84" },
    monochrome: { canvas: "#ffffff", card: "#ffffff", classHead: "#ffffff", objectHead: "#ffffff", abstractHead: "#ffffff", interfaceHead: "#ffffff", ink: "#172033", muted: "#64748b", stroke: "#526a84" }
  });
  const isClass = (type) => type === "class-2" || type === "class-3" || type === "abstract";
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const emptyDocument = () => ({ version: 1, theme: "standard", cards: [], edges: [] });
  const validText = (value) => typeof value === "string" && value.length <= 200 && !/[\x00-\x1f\x7f]/.test(value);

  function wrapText(value, length = 24) {
    const words = String(value).trim().split(/\s+/).filter(Boolean);
    if (!words.length) return [];
    const lines = [];
    let line = "";
    for (let word of words) {
      while (word.length > length) {
        if (line) { lines.push(line); line = ""; }
        lines.push(word.slice(0, length));
        word = word.slice(length);
      }
      if (!word) continue;
      if (!line) line = word;
      else if (line.length + 1 + word.length <= length) line += ` ${word}`;
      else { lines.push(line); line = word; }
    }
    if (line) lines.push(line);
    return lines;
  }

  function areaHeight(rows) {
    if (!rows.length) return 40;
    return Math.max(40, 10 + rows.reduce((height, row) => height + Math.max(1, wrapText(row).length) * 18 + 7, 0));
  }

  function cardLayout(card) {
    const nameLines = wrapText(card.name || (card.type === "object-2" ? "Objekt:Klasse" : "Klasse"), 25);
    const stereotype = card.type === "abstract" ? "«abstract»" : card.type === "interface" ? "«interface»" : "";
    const header = (stereotype ? 26 : 10) + Math.max(1, nameLines.length) * 21 + 10;
    const areas = card.type === "object-2" ? [{ key: "values", title: "Attributwerte", rows: card.values }]
      : card.type === "interface" ? [{ key: "methods", title: "Methoden", rows: card.methods }]
      : card.type === "class-2" ? [{ key: "attributes", title: "Attribute", rows: card.attributes }]
      : [{ key: "attributes", title: "Attribute", rows: card.attributes }, { key: "methods", title: "Methoden", rows: card.methods }];
    const sections = areas.map((area) => ({ ...area, height: areaHeight(area.rows) }));
    return { width: CARD_WIDTH, height: header + sections.reduce((sum, section) => sum + section.height, 0), header, nameLines, stereotype, sections, radius: card.type === "object-2" ? 14 : 0 };
  }

  function clampCard(card) {
    const layout = cardLayout(card);
    card.x = Math.round(Math.max(layout.width / 2 + 22, Math.min(WIDTH - layout.width / 2 - 22, card.x)));
    card.y = Math.round(Math.max(layout.height / 2 + 22, Math.min(MAX_Y - layout.height / 2 - 22, card.y)));
    return card;
  }

  function nextId(items, prefix) {
    const used = new Set(items.map((item) => item.id));
    let n = 1;
    while (used.has(`${prefix}${n}`)) n++;
    return `${prefix}${n}`;
  }

  function makeCard(documentValue, type, x, y) {
    if (!Object.hasOwn(CARD_TYPES, type)) throw new Error("Unbekannter Kartentyp.");
    if (documentValue.cards.length >= 100) throw new Error("Es sind höchstens 100 Karten möglich.");
    const names = { "class-2": "Klasse", "class-3": "Klasse", "object-2": "objekt:Klasse", abstract: "AbstrakteKlasse", interface: "Schnittstelle" };
    const card = clampCard({ id: nextId(documentValue.cards, "c"), type, x, y, name: names[type], attributes: [], methods: [], values: [] });
    documentValue.cards.push(card);
    return card;
  }

  function makeEdge(documentValue, type, from, to) {
    if (!Object.hasOwn(EDGE_TYPES, type)) throw new Error("Unbekannter Verbindungstyp.");
    if (documentValue.edges.length >= 200) throw new Error("Es sind höchstens 200 Verbindungen möglich.");
    const first = documentValue.cards.find((card) => card.id === from);
    const second = documentValue.cards.find((card) => card.id === to);
    if (!first || !second || from === to) throw new Error("Wähle zwei verschiedene vorhandene Karten.");
    if (type !== "line" && (!isClass(first.type) || !isClass(second.type))) {
      throw new Error(type === "inheritance" ? "Vererbung verbindet nur Klassenkarten." : "Eine Beziehung mit Kardinalitäten verbindet nur Klassenkarten.");
    }
    const edge = { id: nextId(documentValue.edges, "e"), type, from, to, cardinalityFrom: "", cardinalityTo: "", name: "" };
    documentValue.edges.push(edge);
    return edge;
  }

  function validateDocument(input) {
    const fail = (error) => ({ valid: false, error });
    if (!input || typeof input !== "object" || Array.isArray(input) || input.version !== 1) return fail("Unbekannte Dokumentversion.");
    if (!Object.hasOwn(THEMES, input.theme)) return fail("Unbekanntes Farbschema.");
    if (!Array.isArray(input.cards) || !Array.isArray(input.edges) || input.cards.length > 100 || input.edges.length > 200) return fail("Ungültige Anzahl von Karten oder Verbindungen.");
    const cardIds = new Set();
    const cards = [];
    for (const raw of input.cards) {
      if (!raw || typeof raw !== "object" || !/^c\d+$/.test(raw.id) || cardIds.has(raw.id)) return fail("Karten-IDs fehlen oder sind doppelt.");
      if (!Object.hasOwn(CARD_TYPES, raw.type)) return fail("Unbekannter Kartentyp.");
      if (!validText(raw.name)) return fail("Ungültiger Kartenname.");
      if (!Number.isFinite(raw.x) || !Number.isFinite(raw.y) || raw.x < 0 || raw.x > WIDTH || raw.y < 0 || raw.y > MAX_Y) return fail("Kartenposition außerhalb der Zeichenfläche.");
      for (const field of ["attributes", "methods", "values"]) {
        if (!Array.isArray(raw[field]) || raw[field].length > 30 || !raw[field].every(validText)) return fail("Ungültige oder zu lange Kartenzeile.");
      }
      if ((raw.type === "class-2" && (raw.methods.length || raw.values.length)) ||
          ((raw.type === "class-3" || raw.type === "abstract") && raw.values.length) ||
          (raw.type === "interface" && (raw.attributes.length || raw.values.length)) ||
          (raw.type === "object-2" && (raw.attributes.length || raw.methods.length))) return fail("Kartenbereiche passen nicht zum Kartentyp.");
      const card = { id: raw.id, type: raw.type, x: raw.x, y: raw.y, name: raw.name, attributes: [...raw.attributes], methods: [...raw.methods], values: [...raw.values] };
      const layout = cardLayout(card);
      if (card.x < layout.width / 2 + 20 || card.x > WIDTH - layout.width / 2 - 20 || card.y < layout.height / 2 + 20 || card.y > MAX_Y - layout.height / 2 - 20) return fail("Eine Karte liegt teilweise außerhalb der Zeichenfläche.");
      cardIds.add(card.id);
      cards.push(card);
    }
    const edgeIds = new Set();
    const edges = [];
    for (const raw of input.edges) {
      if (!raw || typeof raw !== "object" || !/^e\d+$/.test(raw.id) || edgeIds.has(raw.id)) return fail("Verbindungs-IDs fehlen oder sind doppelt.");
      if (!Object.hasOwn(EDGE_TYPES, raw.type)) return fail("Unbekannter Verbindungstyp.");
      if (!cardIds.has(raw.from) || !cardIds.has(raw.to) || raw.from === raw.to) return fail("Eine Verbindung hat ungültige Endpunkte.");
      if (![raw.cardinalityFrom, raw.cardinalityTo, raw.name].every(validText)) return fail("Ungültige Verbindungsbeschriftung.");
      if (raw.type !== "association" && (raw.cardinalityFrom || raw.cardinalityTo || raw.name)) return fail("Diese Linie darf keine Beschriftung tragen.");
      const from = cards.find((card) => card.id === raw.from);
      const to = cards.find((card) => card.id === raw.to);
      if (raw.type !== "line" && (!isClass(from.type) || !isClass(to.type))) return fail("Dieser Verbindungstyp darf nur Klassen verbinden.");
      edgeIds.add(raw.id);
      edges.push({ id: raw.id, type: raw.type, from: raw.from, to: raw.to, cardinalityFrom: raw.cardinalityFrom, cardinalityTo: raw.cardinalityTo, name: raw.name });
    }
    return { valid: true, document: { version: 1, theme: input.theme, cards, edges } };
  }

  function checkCardForm(card) {
    const issues = [];
    let passed = 0;
    const defaultNames = { "class-2": "Klasse", "class-3": "Klasse", "object-2": "objekt:Klasse", abstract: "AbstrakteKlasse", interface: "Schnittstelle" };
    const name = card.name.trim();
    if (!name || name === defaultNames[card.type]) issues.push("Gib der Karte einen eigenen Namen.");
    else if (card.type === "object-2" && !/^[\p{L}_][\p{L}\p{N}_]*:[\p{L}_][\p{L}\p{N}_]*$/u.test(name)) {
      issues.push("Schreibe den Objektbezeichner als objektname:Klasse.");
    } else if (card.type !== "object-2" && !/^[\p{L}_][\p{L}\p{N}_]*$/u.test(name)) {
      issues.push("Schreibe den Klassennamen als einzelnes Wort ohne Sonderzeichen.");
    } else passed++;
    const areas = card.type === "object-2" ? [["values", "Attributwerte"]]
      : card.type === "interface" ? [["methods", "Methoden"]]
        : card.type === "class-2" ? [["attributes", "Attribute"]]
          : [["attributes", "Attribute"], ["methods", "Methoden"]];
    for (const [key, label] of areas) {
      const normalized = card[key].map((value) => key === "attributes" ? normalizedAttribute(value)
        : key === "methods" ? normalizedMethod(value, name)
          : value.trim().replace(/\s*=\s*/, "="));
      if (normalized.some((value) => !value)) issues.push(`Entferne leere Zeilen im Bereich ${label} oder fülle sie aus.`);
      else passed++;
      if (new Set(normalized.filter(Boolean)).size !== normalized.filter(Boolean).length) issues.push(`Prüfe doppelte Einträge im Bereich ${label}.`);
      else passed++;
      const syntaxOkay = key === "attributes"
        ? card[key].every((value) => !value.trim() || /^[\p{L}_][\p{L}\p{N}_]*:[\p{L}_][\p{L}\p{N}_<>.\[\]]*$/u.test(normalizedAttribute(value)))
        : key === "methods"
          ? card[key].every((value) => !value.trim() || /^[^()]+\([^()]*\)(?:\s*:\s*[\p{L}_][\p{L}\p{N}_<>.\[\]]*)?$/u.test(value.trim().replace(/^[+\-#~]\s*/, "")))
          : card[key].every((value) => !value.trim() || /^[\p{L}_][\p{L}\p{N}_]*\s*=\s*.+$/u.test(value.trim()));
      if (!syntaxOkay) issues.push(key === "attributes" ? "Schreibe Attribute als name: Typ oder Typ name." : key === "methods" ? "Schreibe Methoden mit Klammern, zum Beispiel bellen()." : "Schreibe Attributwerte als name = wert.");
      else passed++;
    }
    return { issues, passed };
  }

  function normalizedAttribute(value) {
    const textValue = value.trim().replace(/^[+\-#~]\s*/, "");
    const uml = textValue.match(/^([\p{L}_][\p{L}\p{N}_]*)\s*:\s*([\p{L}_][\p{L}\p{N}_<>.\[\]]*)$/u);
    if (uml) return `${uml[1]}:${uml[2]}`;
    const java = textValue.match(/^([\p{L}_][\p{L}\p{N}_<>.\[\]]*)\s+([\p{L}_][\p{L}\p{N}_]*)$/u);
    return java ? `${java[2]}:${java[1]}` : textValue;
  }

  function normalizedMethod(value, className) {
    const textValue = value.trim().replace(/^[+\-#~]\s*/, "");
    const match = textValue.match(/^(.+?)\s*\(([^()]*)\)\s*(?::\s*([\p{L}_][\p{L}\p{N}_<>.\[\]]*))?$/u);
    if (!match) return textValue;
    const head = match[1].trim().split(/\s+/);
    const name = head.pop();
    const returnType = match[3] || head.join(" ") || "void";
    const parameters = match[2].trim() ? match[2].split(",").map((part) => {
      const parameter = part.trim();
      if (parameter.includes(":")) return parameter.split(":").at(-1).trim();
      return parameter.split(/\s+/)[0];
    }) : [];
    if (name === className && ["parameter1,parameter2", "par1,par2"].includes(parameters.join(","))) {
      return `${name}(int,String):constructor`;
    }
    return `${name}(${parameters.join(",")}):${name === className ? "constructor" : returnType}`;
  }

  function sameEntries(actual, expected) {
    const first = [...actual].sort();
    const second = [...expected].sort();
    return first.length === second.length && first.every((value, index) => value === second[index]);
  }

  function checkHundClass(card) {
    const checks = [
      [card.type === "class-3", "Verwende für Hund die Klassenkarte mit drei Bereichen."],
      [card.name.trim() === "Hund", "Prüfe den Klassennamen anhand von Hund.java."],
      [sameEntries(card.attributes.map(normalizedAttribute), ["alter:int", "name:String"]), "Prüfe Attribute und Typen anhand von Hund.java."],
      [sameEntries(card.methods.map((value) => normalizedMethod(value, "Hund")), ["Hund(int,String):constructor", "zeigeDaten():void", "belle():void"]), "Prüfe Konstruktor und Methoden anhand von Hund.java."]
    ];
    return { issues: checks.filter(([okay]) => !okay).map(([, message]) => message), passed: checks.filter(([okay]) => okay).length };
  }

  function checkDiagramForm(documentValue) {
    if (!documentValue.cards.length) return { issues: ["Füge zuerst mindestens eine Karte hinzu."], passed: 0 };
    const issues = [];
    let passed = 0;
    const validation = validateDocument(documentValue);
    if (validation.valid) passed++;
    else issues.push(`Prüfe die Diagrammstruktur: ${validation.error}`);
    for (const card of documentValue.cards) {
      const result = checkCardForm(card);
      issues.push(...result.issues.map((message) => `${card.name || CARD_TYPES[card.type]}: ${message}`));
      passed += result.passed;
    }
    return { issues, passed };
  }

  function documentHeight(documentValue) {
    return Math.max(MIN_HEIGHT, ...documentValue.cards.map((card) => Math.ceil(card.y + cardLayout(card).height / 2 + 28)));
  }

  function borderPoint(card, target) {
    const { width, height, radius } = cardLayout(card);
    let dx = target.x - card.x;
    let dy = target.y - card.y;
    if (dx === 0 && dy === 0) dx = 1;
    const halfW = width / 2, halfH = height / 2;
    let t = Math.min(dx ? halfW / Math.abs(dx) : Infinity, dy ? halfH / Math.abs(dy) : Infinity);
    if (radius && Math.abs(dx * t) > halfW - radius && Math.abs(dy * t) > halfH - radius) {
      const cx = Math.sign(dx) * (halfW - radius);
      const cy = Math.sign(dy) * (halfH - radius);
      const a = dx * dx + dy * dy;
      const b = -2 * (dx * cx + dy * cy);
      const c = cx * cx + cy * cy - radius * radius;
      const discriminant = Math.max(0, b * b - 4 * a * c);
      t = (-b + Math.sqrt(discriminant)) / (2 * a);
    }
    return { x: card.x + dx * t, y: card.y + dy * t };
  }

  function edgeGeometry(documentValue, edge) {
    const from = documentValue.cards.find((card) => card.id === edge.from);
    const to = documentValue.cards.find((card) => card.id === edge.to);
    if (!from || !to) return null;
    const start = borderPoint(from, to);
    const end = borderPoint(to, from);
    const dx = end.x - start.x, dy = end.y - start.y;
    const length = Math.hypot(dx, dy) || 1;
    const unit = { x: dx / length, y: dy / length };
    const normal = { x: -unit.y, y: unit.x };
    const base = { x: end.x - unit.x * 17, y: end.y - unit.y * 17 };
    const triangle = [end, { x: base.x + normal.x * 9, y: base.y + normal.y * 9 }, { x: base.x - normal.x * 9, y: base.y - normal.y * 9 }];
    return { start, end, unit, normal, base, triangle, length };
  }

  const core = Object.freeze({ emptyDocument, makeCard, makeEdge, validateDocument, checkCardForm, checkHundClass, checkDiagramForm, cardLayout, clampCard, borderPoint, edgeGeometry, documentHeight, wrapText });

  function svgElement(tag, attributes = {}) {
    const element = document.createElementNS(NS, tag);
    for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, String(value));
    return element;
  }

  function mount(root) {
    if (!(root instanceof Element)) throw new Error("Diagrammwerkzeug.mount benötigt ein HTML-Element.");
    if (root.dataset.dwMounted) throw new Error("Das Diagrammwerkzeug wurde bereits eingebunden.");
    root.dataset.dwMounted = "true";
    root.classList.add("dw-editor");
    root.innerHTML = `
      <div class="dw-actions">
        <button type="button" data-tool="select">Auswahl</button>
        <button type="button" data-tool="delete">Löschen</button>
        <button type="button" data-action="new">Neues Diagramm</button>
        <button type="button" data-action="save">Diagramm speichern</button>
        <button type="button" data-action="load">Diagramm laden</button>
        <button type="button" data-action="image">Bild herunterladen</button>
        <button type="button" data-action="check">Diagramm überprüfen</button>
        <label class="dw-select-wrap" for="dw-theme">Farbschema
          <select id="dw-theme"><option value="standard">Standard</option><option value="white">Weiß</option><option value="monochrome">Schwarzweiß</option></select>
        </label>
        <input class="dw-file-input" type="file" accept=".json,application/json" aria-label="Diagrammdatei auswählen">
      </div>
      <p class="dw-mode" aria-live="polite"></p>
      <p class="dw-task-hint" hidden></p>
      <div class="dw-layout">
        <aside class="dw-tools" aria-label="Elementpalette">
          <section class="dw-tool-section" aria-labelledby="dw-middle-title"><h2 id="dw-middle-title">Mittelstufe</h2><div class="dw-tool-buttons" data-palette="middle"></div></section>
          <details class="dw-tool-section dw-upper"><summary><h2>Oberstufe</h2></summary><div class="dw-tool-buttons" data-palette="upper"></div></details>
        </aside>
        <div class="dw-viewport" tabindex="0" role="region" aria-label="Zeichenfläche; mit Enter gewählte Karte in der Mitte einfügen">
          <svg xmlns="http://www.w3.org/2000/svg" role="group" aria-label="Bearbeitbares Klassen- und Objektdiagramm"></svg>
        </div>
        <aside class="dw-side" aria-label="Karten, Verbindungen und Eigenschaften">
          <section><h2>Karten</h2><div class="dw-card-list"></div></section>
          <section><h2>Verbindungen</h2><div class="dw-edge-list"></div></section>
          <section><h2>Eigenschaften</h2><div class="dw-inspector"></div></section>
        </aside>
      </div>
      <section class="dw-check-result" aria-live="polite" aria-label="Prüfergebnis" hidden></section>
      <p class="dw-status" role="status" aria-live="polite">Bereit.</p>`;

    const svg = root.querySelector(".dw-viewport svg");
    const viewport = root.querySelector(".dw-viewport");
    const cardList = root.querySelector(".dw-card-list");
    const edgeList = root.querySelector(".dw-edge-list");
    const inspector = root.querySelector(".dw-inspector");
    const status = root.querySelector(".dw-status");
    const mode = root.querySelector(".dw-mode");
    const taskHint = root.querySelector(".dw-task-hint");
    const checkResult = root.querySelector(".dw-check-result");
    const themeSelect = root.querySelector("#dw-theme");
    const fileInput = root.querySelector(".dw-file-input");
    const palette = root.querySelector(".dw-tools");
    let diagram = emptyDocument();
    let activeTool = "select";
    let selectedCard = null;
    let selectedEdge = null;
    let connectionSource = null;
    let drag = null;
    let paletteDrag = null;
    let suppressPaletteClick = null;
    const hundTask = new URLSearchParams(window.location.search).get("aufgabe") === "hund";
    if (hundTask) {
      taskHint.hidden = false;
      taskHint.textContent = "Aufgabe 2d: Wähle deine Hund-Klassenkarte und prüfe sie mit „Karte überprüfen“. Die Reihenfolge der Attribute und Methoden ist frei.";
    }

    const setStatus = (message) => { status.textContent = message; };
    function clearCheckResult() { checkResult.hidden = true; checkResult.replaceChildren(); }
    const saveLocal = () => { clearCheckResult(); try { localStorage.setItem(STORAGE_KEY, JSON.stringify(diagram)); } catch { /* Ohne Speicher bleibt das Werkzeug nutzbar. */ } };
    const changed = (message) => { saveLocal(); renderAll(); if (message) setStatus(message); };
    const selectedCardData = () => diagram.cards.find((card) => card.id === selectedCard);
    const selectedEdgeData = () => diagram.edges.find((edge) => edge.id === selectedEdge);

    function showCheckResult(result, scope, comparedWithHund) {
      const state = result.issues.length ? (result.passed ? "partial" : "incorrect") : "correct";
      const title = state === "correct" ? "Korrekt" : state === "partial" ? "Teilweise korrekt" : "Noch nicht korrekt";
      checkResult.replaceChildren();
      checkResult.dataset.result = state;
      const heading = document.createElement("h2");
      heading.textContent = `${scope}: ${title}`;
      const explanation = document.createElement("p");
      explanation.textContent = comparedWithHund
        ? "Verglichen mit der Klasse Hund aus Aufgabe 2d; die Reihenfolge der Attribute und Methoden spielt keine Rolle."
        : "Geprüft wurden Form, Bezeichnungen und doppelte oder leere Einträge. Der Inhalt einer freien Aufgabe wird damit nicht bewertet.";
      checkResult.append(heading, explanation);
      if (result.issues.length) {
        const list = document.createElement("ul");
        for (const issue of result.issues) {
          const item = document.createElement("li");
          item.textContent = issue;
          list.append(item);
        }
        checkResult.append(list);
      }
      checkResult.hidden = false;
      setStatus(`${scope}: ${title}.`);
      checkResult.scrollIntoView({ block: "nearest" });
    }

    function checkCurrentCard(card) {
      const form = checkCardForm(card);
      const task = hundTask ? checkHundClass(card) : { issues: [], passed: 0 };
      showCheckResult({ issues: [...form.issues, ...task.issues], passed: form.passed + task.passed }, "Karte", hundTask);
    }

    function checkCurrentDiagram() {
      const form = checkDiagramForm(diagram);
      if (hundTask) {
        const classes = diagram.cards.filter((card) => isClass(card.type));
        const target = classes.find((card) => card.name.trim() === "Hund") || (classes.length === 1 ? classes[0] : null);
        if (target) {
          const task = checkHundClass(target);
          form.issues.push(...task.issues.map((issue) => `Hund-Klasse: ${issue}`));
          form.passed += task.passed;
        } else form.issues.push("Erstelle oder wähle eine Hund-Klassenkarte für Aufgabe 2d.");
      }
      showCheckResult(form, "Diagramm", hundTask);
    }

    function palettePreview(tool) {
      const preview = svgElement("svg", { class: "dw-tool-icon", viewBox: "0 0 64 48", "aria-hidden": "true", focusable: "false" });
      const stroke = "#526a84";
      if (Object.hasOwn(CARD_TYPES, tool)) {
        const radius = tool === "object-2" ? 7 : 0;
        const fill = tool === "object-2" ? "#e8f7ee" : tool === "abstract" ? "#f0edff" : tool === "interface" ? "#eaf5f8" : "#e9f1fb";
        preview.append(svgElement("rect", { x: 6, y: 4, width: 52, height: 40, rx: radius, fill: "#fff", stroke, "stroke-width": 2 }));
        preview.append(svgElement("rect", { x: 7, y: 5, width: 50, height: tool === "abstract" || tool === "interface" ? 19 : 13, rx: Math.max(0, radius - 1), fill }));
        const split = tool === "abstract" || tool === "interface" ? 24 : 18;
        preview.append(svgElement("line", { x1: 6, y1: split, x2: 58, y2: split, stroke, "stroke-width": 1.5 }));
        if (tool === "class-3" || tool === "abstract") preview.append(svgElement("line", { x1: 6, y1: 31, x2: 58, y2: 31, stroke, "stroke-width": 1.5 }));
        if (tool === "abstract" || tool === "interface") {
          const textElement = svgElement("text", { x: 32, y: 14, "text-anchor": "middle", fill: "#254464", "font-size": 8, "font-family": "Arial, sans-serif" });
          textElement.textContent = tool === "abstract" ? "«abstract»" : "«interface»";
          preview.append(textElement);
        }
        const textLine = svgElement("line", { x1: 15, y1: tool === "interface" ? 33 : tool === "abstract" ? 27 : 11, x2: 48, y2: tool === "interface" ? 33 : tool === "abstract" ? 27 : 11, stroke: "#62748a", "stroke-width": 1.5 });
        preview.append(textLine);
      } else {
        preview.append(svgElement("line", { x1: 5, y1: 27, x2: tool === "inheritance" ? 47 : 59, y2: 27, stroke, "stroke-width": 2 }));
        if (tool === "inheritance") preview.append(svgElement("polygon", { points: "59,27 47,20 47,34", fill: "#fff", stroke, "stroke-width": 2 }));
        if (tool === "association") {
          for (const [value, x] of [["1", 8], ["0..*", 39]]) {
            const textElement = svgElement("text", { x, y: 18, fill: "#254464", "font-size": 9, "font-family": "Arial, sans-serif" });
            textElement.textContent = value;
            preview.append(textElement);
          }
        }
      }
      return preview;
    }

    function addPaletteButton(target, tool, label) {
      const button = document.createElement("button");
      button.type = "button";
      button.dataset.tool = tool;
      const textLabel = document.createElement("span");
      textLabel.className = "dw-tool-label";
      textLabel.textContent = label;
      button.append(palettePreview(tool), textLabel);
      target.append(button);
    }
    const middle = root.querySelector('[data-palette="middle"]');
    for (const type of ["class-2", "class-3", "object-2", "line", "inheritance", "association"]) {
      addPaletteButton(middle, type, CARD_TYPES[type] || EDGE_TYPES[type]);
    }
    const upper = root.querySelector('[data-palette="upper"]');
    for (const type of ["abstract", "interface"]) addPaletteButton(upper, type, CARD_TYPES[type]);

    function renderToolbar() {
      root.querySelectorAll("[data-tool]").forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.tool === activeTool)));
      viewport.dataset.placing = String(Object.hasOwn(CARD_TYPES, activeTool));
      mode.textContent = connectionSource
        ? `Startkarte gewählt. Wähle jetzt die Zielkarte für ${EDGE_TYPES[activeTool]}.`
        : Object.hasOwn(CARD_TYPES, activeTool) ? `${CARD_TYPES[activeTool]}: Tippe auf eine freie Stelle der Zeichenfläche.`
          : activeTool === "inheritance" ? "Vererbung: Wähle zuerst die Unterklasse, dann die Oberklasse."
            : Object.hasOwn(EDGE_TYPES, activeTool) ? `${EDGE_TYPES[activeTool]}: Wähle zwei Karten nacheinander.`
              : activeTool === "delete" ? "Löschen: Wähle eine Karte oder Verbindung."
                : "Auswahl: Wähle oder verschiebe eine Karte; bearbeite sie rechts.";
    }

    function drawText(parent, value, x, y, options = {}) {
      const element = svgElement("text", {
        x, y, fill: options.fill || THEMES[diagram.theme].ink,
        "font-family": "Consolas, 'Courier New', monospace",
        "font-size": options.size || 15,
        "font-weight": options.weight || 500,
        "font-style": options.italic ? "italic" : "normal",
        "text-decoration": options.underline ? "underline" : "none",
        "text-anchor": options.anchor || "start",
        "paint-order": "stroke",
        stroke: options.halo ? THEMES[diagram.theme].canvas : "none",
        "stroke-width": options.halo ? 4 : 0
      });
      element.textContent = value;
      parent.append(element);
      return element;
    }

    function renderSvg() {
      const colors = THEMES[diagram.theme];
      const height = documentHeight(diagram);
      svg.setAttribute("viewBox", `0 0 ${WIDTH} ${height}`);
      svg.setAttribute("width", WIDTH);
      svg.setAttribute("height", height);
      svg.replaceChildren(svgElement("rect", { width: WIDTH, height, fill: colors.canvas }));

      for (const edge of diagram.edges) {
        const geometry = edgeGeometry(diagram, edge);
        if (!geometry) continue;
        const group = svgElement("g", { class: "dw-svg-edge", "data-edge": edge.id, "data-selected": selectedEdge === edge.id, tabindex: 0, role: "button", "aria-label": `${EDGE_TYPES[edge.type]} von ${diagram.cards.find((card) => card.id === edge.from).name} zu ${diagram.cards.find((card) => card.id === edge.to).name}` });
        const finish = edge.type === "inheritance" ? geometry.base : geometry.end;
        const path = `M ${geometry.start.x} ${geometry.start.y} L ${finish.x} ${finish.y}`;
        group.append(svgElement("path", { d: path, class: "dw-svg-edge-hit" }));
        group.append(svgElement("path", { d: path, class: "dw-svg-line", fill: "none", stroke: colors.stroke, "stroke-width": 2.5 }));
        if (edge.type === "inheritance") {
          group.append(svgElement("polygon", { points: geometry.triangle.map((point) => `${point.x},${point.y}`).join(" "), fill: colors.canvas, stroke: colors.stroke, "stroke-width": 2.5, "stroke-linejoin": "round" }));
        }
        if (edge.type === "association") {
          const { start, end, unit, normal } = geometry;
          const position = (point, along, across) => ({ x: point.x + unit.x * along + normal.x * across, y: point.y + unit.y * along + normal.y * across });
          if (edge.cardinalityFrom) { const p = position(start, 27, -14); drawText(group, edge.cardinalityFrom, p.x, p.y, { anchor: "middle", weight: 800, halo: true }); }
          if (edge.cardinalityTo) { const p = position(end, -27, -14); drawText(group, edge.cardinalityTo, p.x, p.y, { anchor: "middle", weight: 800, halo: true }); }
          if (edge.name) { const p = position({ x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 }, 0, -17); drawText(group, edge.name, p.x, p.y, { anchor: "middle", size: 14, halo: true }); }
        }
        svg.append(group);
      }

      for (const card of diagram.cards) {
        const layout = cardLayout(card);
        const left = card.x - layout.width / 2, top = card.y - layout.height / 2;
        const group = svgElement("g", { class: "dw-svg-card", "data-card": card.id, "data-selected": selectedCard === card.id, tabindex: 0, role: "button", "aria-label": `${CARD_TYPES[card.type]} ${card.name}; auswählen oder verschieben` });
        group.append(svgElement("rect", { x: left, y: top, width: layout.width, height: layout.height, rx: layout.radius, fill: colors.card, stroke: colors.stroke, "stroke-width": 2.5 }));
        const headColor = card.type === "object-2" ? colors.objectHead : card.type === "abstract" ? colors.abstractHead : card.type === "interface" ? colors.interfaceHead : colors.classHead;
        group.append(svgElement("rect", { x: left + 2, y: top + 2, width: layout.width - 4, height: layout.header - 3, rx: Math.max(0, layout.radius - 2), fill: headColor }));
        if (layout.stereotype) drawText(group, layout.stereotype, card.x, top + 20, { anchor: "middle", size: 13, weight: 700 });
        const nameStart = top + (layout.stereotype ? 42 : 27);
        layout.nameLines.forEach((line, index) => drawText(group, line, card.x, nameStart + index * 21, { anchor: "middle", weight: 800, italic: card.type === "abstract", underline: card.type === "object-2" }));
        let sectionTop = top + layout.header;
        for (const section of layout.sections) {
          group.append(svgElement("line", { x1: left, y1: sectionTop, x2: left + layout.width, y2: sectionTop, stroke: colors.stroke, "stroke-width": 2 }));
          if (!section.rows.length) drawText(group, section.title, left + 14, sectionTop + 25, { fill: colors.muted, size: 13, italic: true });
          let rowY = sectionTop + 21;
          for (const row of section.rows) {
            const lines = wrapText(row);
            for (const line of (lines.length ? lines : [""])) { drawText(group, line, left + 14, rowY); rowY += 18; }
            rowY += 7;
          }
          sectionTop += section.height;
        }
        svg.append(group);
      }
    }

    function renderLists() {
      cardList.replaceChildren();
      edgeList.replaceChildren();
      if (!diagram.cards.length) cardList.textContent = "Noch keine Karten.";
      if (!diagram.edges.length) edgeList.textContent = "Noch keine Verbindungen.";
      for (const card of diagram.cards) {
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.cardId = card.id;
        button.textContent = `${CARD_TYPES[card.type]}: ${card.name}`;
        button.setAttribute("aria-pressed", String(selectedCard === card.id));
        button.addEventListener("click", () => chooseCard(card.id));
        cardList.append(button);
      }
      for (const edge of diagram.edges) {
        const from = diagram.cards.find((card) => card.id === edge.from);
        const to = diagram.cards.find((card) => card.id === edge.to);
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.edgeId = edge.id;
        button.textContent = `${EDGE_TYPES[edge.type]}: ${from.name} – ${to.name}${edge.name ? ` (${edge.name})` : ""}`;
        button.setAttribute("aria-pressed", String(selectedEdge === edge.id));
        button.addEventListener("click", () => chooseEdge(edge.id));
        edgeList.append(button);
      }
    }

    function field(labelText, value, onInput, maxLength = 200) {
      const label = document.createElement("label");
      label.className = "dw-field";
      const title = document.createElement("span"); title.textContent = labelText;
      const input = document.createElement("input"); input.type = "text"; input.maxLength = maxLength; input.value = value;
      input.addEventListener("input", () => onInput(input.value));
      label.append(title, input);
      return label;
    }

    function inspectorButton(textValue, click, className = "") {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = textValue;
      button.className = className;
      button.addEventListener("click", click);
      return button;
    }

    function renderInspector() {
      inspector.replaceChildren();
      const card = selectedCardData();
      const edge = selectedEdgeData();
      if (!card && !edge) { inspector.textContent = "Wähle eine Karte oder Verbindung auf der Zeichenfläche oder in der Liste."; return; }
      const intro = document.createElement("p");
      intro.textContent = card ? CARD_TYPES[card.type] : EDGE_TYPES[edge.type];
      inspector.append(intro);
      if (card) {
        inspector.append(field(card.type === "object-2" ? "Bezeichner (objektname:Klasse)" : "Name", card.name, (value) => {
          card.name = value; clampCard(card); saveLocal(); renderSvg(); renderLists();
        }));
        const areas = card.type === "object-2" ? [["values", "Wert"]]
          : card.type === "interface" ? [["methods", "Methode"]]
            : card.type === "class-2" ? [["attributes", "Attribut"]]
              : [["attributes", "Attribut"], ["methods", "Methode"]];
        for (const [key, singular] of areas) {
          card[key].forEach((value, index) => {
            const row = document.createElement("div"); row.className = "dw-row";
            row.append(field(`${singular} ${index + 1}`, value, (textValue) => {
              card[key][index] = textValue; clampCard(card); saveLocal(); renderSvg();
            }));
            const remove = inspectorButton("×", () => { card[key].splice(index, 1); clampCard(card); changed(`${singular} entfernt.`); });
            remove.setAttribute("aria-label", `${singular} ${index + 1} entfernen`);
            row.append(remove); inspector.append(row);
          });
          const add = inspectorButton(`${singular} hinzufügen`, () => { card[key].push(""); clampCard(card); changed(`${singular} hinzugefügt.`); inspector.querySelectorAll("input").item(inspector.querySelectorAll("input").length - 1)?.focus(); }, "dw-add-row");
          add.disabled = card[key].length >= 30;
          inspector.append(add);
        }
        inspector.append(inspectorButton("Karte überprüfen", () => checkCurrentCard(card), "dw-check-button"));
        inspector.append(inspectorButton("Karte entfernen", () => removeCard(card.id), "dw-remove"));
      } else {
        if (edge.type === "association") {
          for (const [key, labelText] of [["cardinalityFrom", "Kardinalität an Startkarte (optional)"], ["cardinalityTo", "Kardinalität an Zielkarte (optional)"], ["name", "Beziehungsname (optional)"]]) {
            inspector.append(field(labelText, edge[key], (value) => { edge[key] = value; saveLocal(); renderSvg(); renderLists(); }));
          }
        }
        inspector.append(inspectorButton("Verbindung entfernen", () => removeEdge(edge.id), "dw-remove"));
      }
    }

    function renderAll() { renderToolbar(); renderSvg(); renderLists(); renderInspector(); themeSelect.value = diagram.theme; }

    function removeCard(id) {
      diagram.cards = diagram.cards.filter((card) => card.id !== id);
      diagram.edges = diagram.edges.filter((edge) => edge.from !== id && edge.to !== id);
      selectedCard = null; selectedEdge = null; connectionSource = null;
      changed("Karte und zugehörige Verbindungen entfernt.");
    }

    function removeEdge(id) {
      diagram.edges = diagram.edges.filter((edge) => edge.id !== id);
      selectedEdge = null;
      changed("Verbindung entfernt.");
    }

    function chooseCard(id) {
      const card = diagram.cards.find((item) => item.id === id);
      if (!card) return;
      clearCheckResult();
      const fromList = cardList.contains(document.activeElement);
      if (activeTool === "delete") { removeCard(id); return; }
      if (Object.hasOwn(EDGE_TYPES, activeTool)) {
        if (!connectionSource) {
          connectionSource = id; selectedCard = id; selectedEdge = null;
          renderAll(); if (fromList) cardList.querySelector(`[data-card-id="${id}"]`)?.focus();
          setStatus(`${card.name} ist die Startkarte. Wähle die Zielkarte.`);
          return;
        }
        try {
          const edge = makeEdge(diagram, activeTool, connectionSource, id);
          selectedCard = null; selectedEdge = edge.id; connectionSource = null; activeTool = "select";
          changed(`${EDGE_TYPES[edge.type]} erstellt.`);
        } catch (error) { setStatus(error.message); }
        return;
      }
      selectedCard = id; selectedEdge = null;
      renderAll(); if (fromList) cardList.querySelector(`[data-card-id="${id}"]`)?.focus();
      setStatus(`${CARD_TYPES[card.type]} ausgewählt. Eigenschaften rechts bearbeiten.`);
    }

    function chooseEdge(id) {
      if (!diagram.edges.some((edge) => edge.id === id)) return;
      clearCheckResult();
      const fromList = edgeList.contains(document.activeElement);
      if (activeTool === "delete") { removeEdge(id); return; }
      selectedCard = null; selectedEdge = id;
      renderAll(); if (fromList) edgeList.querySelector(`[data-edge-id="${id}"]`)?.focus();
      setStatus("Verbindung ausgewählt. Eigenschaften rechts bearbeiten.");
    }

    function addCardAt(type, x, y) {
      try {
        const card = makeCard(diagram, type, x, y);
        selectedCard = card.id; selectedEdge = null; activeTool = "select"; connectionSource = null;
        changed(`${CARD_TYPES[type]} eingefügt. Eigenschaften rechts bearbeiten.`);
      } catch (error) { setStatus(error.message); }
    }

    function point(event) {
      const box = svg.getBoundingClientRect();
      const height = documentHeight(diagram);
      return { x: Math.max(0, Math.min(WIDTH, (event.clientX - box.left) * WIDTH / box.width)),
        y: Math.max(0, Math.min(height, (event.clientY - box.top) * height / box.height)) };
    }

    function clearPaletteDrag() {
      paletteDrag?.preview?.remove();
      paletteDrag = null;
      viewport.dataset.dropTarget = "false";
    }

    palette.addEventListener("pointerdown", (event) => {
      const button = event.target.closest("[data-tool]");
      if (!button || event.button !== 0 || paletteDrag) return;
      paletteDrag = { button, tool: button.dataset.tool, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, moved: false, preview: null };
      button.setPointerCapture(event.pointerId);
    });

    palette.addEventListener("pointermove", (event) => {
      if (!paletteDrag || paletteDrag.pointerId !== event.pointerId) return;
      if (!paletteDrag.moved && Math.hypot(event.clientX - paletteDrag.startX, event.clientY - paletteDrag.startY) < 7) return;
      if (!paletteDrag.moved) {
        paletteDrag.moved = true;
        const preview = document.createElement("div");
        preview.className = "dw-drag-preview";
        preview.setAttribute("aria-hidden", "true");
        preview.append(...Array.from(paletteDrag.button.children, (child) => child.cloneNode(true)));
        document.body.append(preview);
        paletteDrag.preview = preview;
      }
      paletteDrag.preview.style.left = `${event.clientX + 12}px`;
      paletteDrag.preview.style.top = `${event.clientY + 12}px`;
      const target = document.elementFromPoint(event.clientX, event.clientY);
      viewport.dataset.dropTarget = String(Boolean(target && viewport.contains(target)));
    });

    palette.addEventListener("pointerup", (event) => {
      if (!paletteDrag || paletteDrag.pointerId !== event.pointerId) return;
      const { button, tool, moved } = paletteDrag;
      if (button.hasPointerCapture(event.pointerId)) button.releasePointerCapture(event.pointerId);
      if (moved) {
        suppressPaletteClick = { button, until: performance.now() + 150 };
        window.setTimeout(() => {
          if (suppressPaletteClick?.button === button) suppressPaletteClick = null;
        }, 150);
        const target = document.elementFromPoint(event.clientX, event.clientY);
        if (target && viewport.contains(target)) {
          if (Object.hasOwn(CARD_TYPES, tool)) addCardAt(tool, point(event).x, point(event).y);
          else {
            activeTool = tool;
            connectionSource = null;
            renderToolbar();
            const cardGroup = target.closest("[data-card]");
            if (cardGroup) chooseCard(cardGroup.dataset.card);
            else setStatus(mode.textContent);
          }
        } else setStatus("Element nicht abgelegt. Ziehe es auf die Zeichenfläche.");
      }
      clearPaletteDrag();
    });

    palette.addEventListener("pointercancel", (event) => {
      if (paletteDrag?.pointerId === event.pointerId) clearPaletteDrag();
    });

    root.addEventListener("click", (event) => {
      const button = event.target.closest("[data-tool]");
      if (!button || !root.contains(button)) return;
      if (suppressPaletteClick?.button === button && performance.now() < suppressPaletteClick.until) {
        suppressPaletteClick = null;
        event.preventDefault();
        return;
      }
      suppressPaletteClick = null;
      activeTool = button.dataset.tool;
      connectionSource = null;
      renderToolbar();
      setStatus(mode.textContent);
    });

    svg.addEventListener("pointerdown", (event) => {
      const cardGroup = event.target.closest("[data-card]");
      const edgeGroup = event.target.closest("[data-edge]");
      if (cardGroup) {
        const id = cardGroup.dataset.card;
        if (activeTool === "select") {
          const card = diagram.cards.find((item) => item.id === id);
          drag = { id, pointerId: event.pointerId, start: point(event), x: card.x, y: card.y, moved: false };
        }
        chooseCard(id);
        if (activeTool === "select") {
          svg.setPointerCapture(event.pointerId);
          svg.querySelector(`[data-card="${id}"]`)?.focus();
        }
        return;
      }
      if (edgeGroup) { const id = edgeGroup.dataset.edge; chooseEdge(id); svg.querySelector(`[data-edge="${id}"]`)?.focus(); return; }
      if (Object.hasOwn(CARD_TYPES, activeTool)) {
        const position = point(event);
        addCardAt(activeTool, position.x, position.y);
      } else if (Object.hasOwn(EDGE_TYPES, activeTool)) setStatus("Wähle eine vorhandene Karte als Endpunkt.");
      else if (activeTool === "select") { selectedCard = null; selectedEdge = null; renderAll(); }
    });

    svg.addEventListener("pointermove", (event) => {
      if (!drag || drag.pointerId !== event.pointerId) return;
      const position = point(event);
      const dx = position.x - drag.start.x, dy = position.y - drag.start.y;
      if (!drag.moved && Math.hypot(dx, dy) < 3) return;
      drag.moved = true;
      const card = diagram.cards.find((item) => item.id === drag.id);
      if (!card) return;
      card.x = drag.x + dx; card.y = drag.y + dy;
      clampCard(card); saveLocal(); renderSvg();
    });

    function finishDrag(event) {
      if (!drag || drag.pointerId !== event.pointerId) return;
      if (svg.hasPointerCapture(event.pointerId)) svg.releasePointerCapture(event.pointerId);
      const moved = drag.moved, id = drag.id;
      drag = null;
      if (moved) {
        renderLists(); renderInspector();
        svg.querySelector(`[data-card="${id}"]`)?.focus();
        setStatus("Karte verschoben; Verbindungen wurden angepasst.");
      }
    }
    svg.addEventListener("pointerup", finishDrag);
    svg.addEventListener("pointercancel", finishDrag);

    svg.addEventListener("keydown", (event) => {
      const cardGroup = event.target.closest("[data-card]");
      const edgeGroup = event.target.closest("[data-edge]");
      if ((event.key === "Enter" || event.key === " ") && (cardGroup || edgeGroup)) {
        event.preventDefault();
        if (cardGroup) chooseCard(cardGroup.dataset.card);
        else chooseEdge(edgeGroup.dataset.edge);
        const currentId = cardGroup?.dataset.card || edgeGroup?.dataset.edge;
        svg.querySelector(cardGroup ? `[data-card="${currentId}"]` : `[data-edge="${currentId}"]`)?.focus();
        return;
      }
      if (cardGroup && activeTool === "select" && /^Arrow(Up|Down|Left|Right)$/.test(event.key)) {
        event.preventDefault();
        const card = diagram.cards.find((item) => item.id === cardGroup.dataset.card);
        const step = event.shiftKey ? 20 : 5;
        card.x += event.key === "ArrowLeft" ? -step : event.key === "ArrowRight" ? step : 0;
        card.y += event.key === "ArrowUp" ? -step : event.key === "ArrowDown" ? step : 0;
        clampCard(card); selectedCard = card.id; selectedEdge = null;
        saveLocal(); renderSvg(); renderLists(); renderInspector();
        svg.querySelector(`[data-card="${card.id}"]`)?.focus();
        setStatus("Karte verschoben; Verbindungen wurden angepasst.");
      }
    });

    viewport.addEventListener("keydown", (event) => {
      if (event.target !== viewport || event.key !== "Enter" || !Object.hasOwn(CARD_TYPES, activeTool)) return;
      event.preventDefault(); addCardAt(activeTool, WIDTH / 2, MIN_HEIGHT / 2);
    });

    root.addEventListener("keydown", (event) => {
      if (event.key === "Escape") { activeTool = "select"; connectionSource = null; renderToolbar(); setStatus("Werkzeug abgewählt."); return; }
      if (event.key !== "Delete" && event.key !== "Backspace") return;
      if (event.target.closest("input, select, textarea")) return;
      if (selectedCard) { event.preventDefault(); removeCard(selectedCard); }
      else if (selectedEdge) { event.preventDefault(); removeEdge(selectedEdge); }
    });

    themeSelect.addEventListener("change", () => {
      diagram.theme = themeSelect.value;
      changed(`Farbschema ${themeSelect.selectedOptions[0].textContent} gewählt.`);
    });

    function download(blob, filename) {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url; link.download = filename;
      document.body.append(link); link.click(); link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 10000);
    }

    root.querySelector('[data-action="save"]').addEventListener("click", () => {
      const validation = validateDocument(diagram);
      if (!validation.valid) { setStatus(`Speichern nicht möglich: ${validation.error}`); return; }
      download(new Blob([JSON.stringify(validation.document, null, 2)], { type: "application/json;charset=utf-8" }), "klassen-und-objektdiagramm.json");
      setStatus("Diagramm als JSON-Datei gespeichert.");
    });

    root.querySelector('[data-action="check"]').addEventListener("click", checkCurrentDiagram);
    root.querySelector('[data-action="load"]').addEventListener("click", () => fileInput.click());
    fileInput.addEventListener("change", async () => {
      const file = fileInput.files?.[0];
      fileInput.value = "";
      if (!file) return;
      if (file.size > 1000000) { setStatus("Die Datei ist größer als 1 MB."); return; }
      try {
        const parsed = JSON.parse(await file.text());
        const validation = validateDocument(parsed);
        if (!validation.valid) { setStatus(`Diagramm nicht geladen: ${validation.error}`); return; }
        diagram = validation.document;
        selectedCard = null; selectedEdge = null; connectionSource = null; activeTool = "select";
        changed("Diagramm geladen und im Browser gespeichert.");
      } catch { setStatus("Diagramm nicht geladen: Die Datei enthält kein gültiges JSON."); }
    });

    root.querySelector('[data-action="new"]').addEventListener("click", () => {
      if ((diagram.cards.length || diagram.edges.length) && !window.confirm("Aktuelles Diagramm und gespeicherten Zwischenstand löschen?")) return;
      diagram = emptyDocument(); selectedCard = null; selectedEdge = null; connectionSource = null; activeTool = "select";
      try { localStorage.removeItem(STORAGE_KEY); } catch { /* Keine lokale Speicherung. */ }
      clearCheckResult(); renderAll(); setStatus("Neues leeres Diagramm erstellt.");
    });

    root.querySelector('[data-action="image"]').addEventListener("click", () => {
      const copy = svg.cloneNode(true);
      copy.querySelectorAll(".dw-svg-edge-hit").forEach((element) => element.remove());
      copy.querySelectorAll("[tabindex], [role], [aria-label], [data-card], [data-edge], [data-selected]").forEach((element) => {
        for (const name of ["tabindex", "role", "aria-label", "data-card", "data-edge", "data-selected"]) element.removeAttribute(name);
      });
      copy.setAttribute("xmlns", NS);
      const height = documentHeight(diagram);
      const xml = new XMLSerializer().serializeToString(copy);
      const url = URL.createObjectURL(new Blob([xml], { type: "image/svg+xml;charset=utf-8" }));
      const image = new Image();
      image.onload = () => {
        URL.revokeObjectURL(url);
        const scale = height > 4000 ? 1 : 2;
        const canvas = document.createElement("canvas");
        canvas.width = WIDTH * scale; canvas.height = height * scale;
        const context = canvas.getContext("2d");
        if (!context) { setStatus("Bildexport nicht möglich: Canvas ist nicht verfügbar."); return; }
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (!blob) { setStatus("Bildexport nicht möglich: PNG konnte nicht erzeugt werden."); return; }
          download(blob, "klassen-und-objektdiagramm.png");
          setStatus("Diagramm als PNG-Bild heruntergeladen.");
        }, "image/png");
      };
      image.onerror = () => { URL.revokeObjectURL(url); setStatus("Bildexport nicht möglich: Zeichnung konnte nicht geladen werden."); };
      image.src = url;
    });

    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
      const validation = stored ? validateDocument(stored) : null;
      if (validation?.valid) diagram = validation.document;
    } catch { /* Beschädigter oder gesperrter Speicher wird ignoriert. */ }
    renderAll();
    return Object.freeze({ getDocument: () => clone(diagram), loadDocument: (value) => {
      const validation = validateDocument(value);
      if (!validation.valid) throw new Error(validation.error);
      diagram = validation.document; selectedCard = null; selectedEdge = null; connectionSource = null; activeTool = "select";
      changed("Diagramm geladen.");
    } });
  }

  window.DiagrammwerkzeugCore = core;
  window.Diagrammwerkzeug = Object.freeze({ mount });
})();
