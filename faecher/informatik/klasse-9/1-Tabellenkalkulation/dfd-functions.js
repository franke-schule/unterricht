/* Datenflussdiagramme: typisierte Funktionen und reine Graphauswertung. */
(() => {
  "use strict";

  const MAX_NODES = 100;
  const MAX_EDGES = 200;
  const DAY = 86400000;
  const DATE_ZERO = Date.UTC(1899, 11, 30);
  const registry = new Map();

  class DfdError extends Error {
    constructor(message, nodeId = null) {
      super(message);
      this.name = "DfdError";
      this.nodeId = nodeId;
    }
  }

  const typed = (type, value) => ({ type, value });
  const number = (value, name = "Wert") => {
    if (!value || value.type !== "number" || !Number.isFinite(value.value)) {
      throw new DfdError(`${name} muss eine Zahl sein.`);
    }
    return value.value;
  };
  const text = (value, name = "Wert") => {
    if (!value || value.type !== "text") throw new DfdError(`${name} muss Text sein.`);
    return value.value;
  };
  const boolean = (value, name = "Wert") => {
    if (!value || value.type !== "boolean") throw new DfdError(`${name} muss WAHR oder FALSCH sein.`);
    return value.value;
  };
  const finite = (value) => {
    if (!Number.isFinite(value)) throw new DfdError("Das Ergebnis ist keine endliche Zahl.");
    return typed("number", value);
  };
  const numArgs = (args) => args.map((arg, index) => number(arg, `Eingang ${index + 1}`));
  const trunc = (value) => Math.trunc(value);
  const serial = (date) => (date.getTime() - DATE_ZERO) / DAY;
  const dateFromSerial = (value) => {
    const n = number(value, "Datum");
    const date = new Date(DATE_ZERO + n * DAY);
    if (!Number.isFinite(date.getTime())) throw new DfdError("Das Datum ist ungültig.");
    return date;
  };
  const roundAway = (value, digits) => {
    const factor = 10 ** digits;
    if (!Number.isFinite(factor)) throw new DfdError("Die Anzahl der Stellen ist zu groß.");
    return Math.sign(value) * Math.floor(Math.abs(value) * factor + 0.5) / factor;
  };
  const roundTowardZero = (value, digits, up) => {
    const factor = 10 ** digits;
    if (!Number.isFinite(factor)) throw new DfdError("Die Anzahl der Stellen ist zu groß.");
    return Math.sign(value) * (up ? Math.ceil(Math.abs(value) * factor) : Math.floor(Math.abs(value) * factor)) / factor;
  };
  const currentDate = (context) => context.now instanceof Date ? context.now : new Date();

  function register(id, group, min, max, run, labels = null) {
    registry.set(id, { id, label: id, group, min, max, run, labels });
  }
  const numeric = (id, group, min, max, run, labels) =>
    register(id, group, min, max, (args, context) => finite(run(numArgs(args), context)), labels);

  numeric("+", "Operatoren", 2, 2, ([a, b]) => a + b, ["Summand 1", "Summand 2"]);
  numeric("-", "Operatoren", 2, 2, ([a, b]) => a - b, ["Minuend", "Subtrahend"]);
  numeric("*", "Operatoren", 2, 2, ([a, b]) => a * b, ["Faktor 1", "Faktor 2"]);
  numeric("/", "Operatoren", 2, 2, ([a, b]) => {
    if (b === 0) throw new DfdError("Division durch null ist nicht möglich.");
    return a / b;
  }, ["Zähler", "Nenner"]);
  numeric("^", "Operatoren", 2, 2, ([a, b]) => a ** b, ["Basis", "Exponent"]);

  function compare(a, b) {
    if (a.type !== b.type) throw new DfdError("Beim Vergleich müssen beide Werte denselben Typ haben.");
    if (a.type === "number") return Math.sign(number(a) - number(b));
    if (a.type === "boolean") return Math.sign(Number(a.value) - Number(b.value));
    if (a.type === "text") return Math.sign(a.value.localeCompare(b.value, "de", { sensitivity: "base" }));
    throw new DfdError("Dieser Wert kann nicht verglichen werden.");
  }
  for (const [id, test] of Object.entries({
    "=": (v) => v === 0, "<>": (v) => v !== 0, "<": (v) => v < 0,
    "<=": (v) => v <= 0, ">": (v) => v > 0, ">=": (v) => v >= 0
  })) register(id, "Operatoren", 2, 2, ([a, b]) => typed("boolean", test(compare(a, b))), ["Wert links", "Wert rechts"]);

  numeric("ABRUNDEN", "Zahlen", 2, 2, ([n, digits]) => roundTowardZero(n, trunc(digits), false));
  numeric("ABS", "Zahlen", 1, 1, ([n]) => Math.abs(n));
  register("ANZAHL", "Zahlen", 1, 8, (args) => typed("number", args.filter((arg) => arg.type === "number").length));
  numeric("AUFRUNDEN", "Zahlen", 2, 2, ([n, digits]) => roundTowardZero(n, trunc(digits), true));
  numeric("GANZZAHL", "Zahlen", 1, 1, ([n]) => Math.floor(n));
  numeric("MAX", "Zahlen", 1, 8, (args) => Math.max(...args));
  numeric("MIN", "Zahlen", 1, 8, (args) => Math.min(...args));
  numeric("MITTELWERT", "Zahlen", 1, 8, (args) => args.reduce((a, b) => a + b, 0) / args.length);
  numeric("OBERGRENZE", "Zahlen", 2, 2, ([n, step]) => {
    if (step === 0) throw new DfdError("Die Schrittweite darf nicht null sein.");
    return Math.ceil(n / Math.abs(step)) * Math.abs(step);
  });
  numeric("POTENZ", "Zahlen", 2, 2, ([a, b]) => a ** b);
  numeric("PRODUKT", "Zahlen", 1, 8, (args) => args.reduce((a, b) => a * b, 1));
  numeric("QUADRIEREN", "Zahlen", 1, 1, ([n]) => n * n);
  numeric("QUOTIENT", "Zahlen", 2, 2, ([a, b]) => {
    if (b === 0) throw new DfdError("Division durch null ist nicht möglich.");
    return trunc(a / b);
  });
  numeric("REST", "Zahlen", 2, 2, ([a, b]) => {
    if (b === 0) throw new DfdError("Division durch null ist nicht möglich.");
    return a - b * Math.floor(a / b);
  });
  numeric("RUNDEN", "Zahlen", 2, 2, ([n, digits]) => roundAway(n, trunc(digits)));
  numeric("SUMME", "Zahlen", 1, 8, (args) => args.reduce((a, b) => a + b, 0));
  numeric("VORZEICHEN", "Zahlen", 1, 1, ([n]) => Math.sign(n));
  numeric("WURZEL", "Zahlen", 1, 1, ([n]) => {
    if (n < 0) throw new DfdError("Aus einer negativen Zahl kann keine reelle Wurzel berechnet werden.");
    return Math.sqrt(n);
  });

  register("IDENTITÄT", "Logik", 1, 1, ([value]) => value);
  register("NICHT", "Logik", 1, 1, ([value]) => typed("boolean", !boolean(value)));
  register("ODER", "Logik", 2, 8, (args) => typed("boolean", args.map(boolean).some(Boolean)));
  register("UND", "Logik", 2, 8, (args) => typed("boolean", args.map(boolean).every(Boolean)));
  register("WENN", "Logik", 3, 3, null, ["Bedingung", "Ja-Fall", "Nein-Fall"]);

  register("CODE", "Text", 1, 1, ([value]) => {
    const s = text(value);
    if (!s) throw new DfdError("CODE benötigt mindestens ein Zeichen.");
    return finite(s.codePointAt(0));
  });
  register("FINDEN", "Text", 2, 3, ([needle, haystack, start]) => {
    const from = start ? trunc(number(start)) : 1;
    if (from < 1) throw new DfdError("Die Startposition muss mindestens 1 sein.");
    const at = text(haystack).indexOf(text(needle), from - 1);
    if (at < 0) throw new DfdError("Der gesuchte Text wurde nicht gefunden.");
    return finite(at + 1);
  });
  register("GROSS", "Text", 1, 1, ([value]) => typed("text", text(value).toLocaleUpperCase("de")));
  register("KLEIN", "Text", 1, 1, ([value]) => typed("text", text(value).toLocaleLowerCase("de")));
  register("LÄNGE", "Text", 1, 1, ([value]) => finite([...text(value)].length));
  register("LINKS", "Text", 1, 2, ([value, count]) => {
    const n = count ? trunc(number(count)) : 1;
    if (n < 0) throw new DfdError("Die Zeichenanzahl darf nicht negativ sein.");
    return typed("text", [...text(value)].slice(0, n).join(""));
  });
  register("RECHTS", "Text", 1, 2, ([value, count]) => {
    const n = count ? trunc(number(count)) : 1;
    if (n < 0) throw new DfdError("Die Zeichenanzahl darf nicht negativ sein.");
    return typed("text", n === 0 ? "" : [...text(value)].slice(-n).join(""));
  });
  register("TEIL", "Text", 3, 3, ([value, start, count]) => {
    const from = trunc(number(start));
    const length = trunc(number(count));
    if (from < 1 || length < 0) throw new DfdError("Startposition und Zeichenanzahl sind ungültig.");
    return typed("text", [...text(value)].slice(from - 1, from - 1 + length).join(""));
  });
  register("VERKETTEN", "Text", 1, 8, (args) => typed("text", args.map((arg) => arg.type === "boolean" ? (arg.value ? "WAHR" : "FALSCH") : String(arg.value)).join("")));
  register("WECHSELN", "Text", 3, 4, ([value, oldText, newText, instance]) => {
    const source = text(value), old = text(oldText), replacement = text(newText);
    if (old === "") throw new DfdError("Der zu ersetzende Text darf nicht leer sein.");
    if (!instance) return typed("text", source.split(old).join(replacement));
    const n = trunc(number(instance));
    if (n < 1) throw new DfdError("Die Fundstelle muss mindestens 1 sein.");
    let at = -1, from = 0;
    for (let i = 0; i < n; i++) {
      at = source.indexOf(old, from);
      if (at < 0) return typed("text", source);
      from = at + old.length;
    }
    return typed("text", source.slice(0, at) + replacement + source.slice(at + old.length));
  });
  register("ZEICHEN", "Text", 1, 1, ([value]) => {
    const n = trunc(number(value));
    if (n < 1 || n > 1114111 || (n >= 55296 && n <= 57343)) throw new DfdError("Der Zeichencode ist ungültig.");
    return typed("text", String.fromCodePoint(n));
  });

  numeric("DATUM", "Datum und Zeit", 3, 3, ([year, month, day]) => {
    const date = new Date(Date.UTC(trunc(year), trunc(month) - 1, trunc(day)));
    if (!Number.isFinite(date.getTime())) throw new DfdError("Das Datum ist ungültig.");
    return serial(date);
  });
  numeric("HEUTE", "Datum und Zeit", 0, 0, (_, context) => {
    const now = currentDate(context);
    return serial(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())));
  });
  register("JAHR", "Datum und Zeit", 1, 1, ([value]) => finite(dateFromSerial(value).getUTCFullYear()));
  numeric("JETZT", "Datum und Zeit", 0, 0, (_, context) => {
    const now = currentDate(context);
    return serial(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), now.getMinutes(), now.getSeconds())));
  });
  for (const [id, method] of [["MINUTE", "getUTCMinutes"], ["MONAT", "getUTCMonth"], ["SEKUNDE", "getUTCSeconds"], ["STUNDE", "getUTCHours"], ["TAG", "getUTCDate"]]) {
    register(id, "Datum und Zeit", 1, 1, ([value]) => finite(dateFromSerial(value)[method]() + (id === "MONAT" ? 1 : 0)));
  }
  register("WOCHENTAG", "Datum und Zeit", 1, 2, ([value, mode]) => {
    const weekday = dateFromSerial(value).getUTCDay();
    const kind = mode ? trunc(number(mode)) : 1;
    if (![1, 2, 3].includes(kind)) throw new DfdError("WOCHENTAG unterstützt die Typen 1, 2 und 3.");
    return finite(kind === 1 ? weekday + 1 : kind === 2 ? (weekday + 6) % 7 + 1 : (weekday + 6) % 7);
  });
  numeric("ZEIT", "Datum und Zeit", 3, 3, ([hours, minutes, seconds]) => ((trunc(hours) * 3600 + trunc(minutes) * 60 + trunc(seconds)) % 86400 + 86400) % 86400 / 86400);
  register("ZUFALLSZAHL", "Zufall", 0, 0, (_, context) => finite((context.random || Math.random)()));

  function parseLiteral(raw, kind = "auto") {
    const original = String(raw ?? "");
    if (kind === "text") return typed("text", original);
    const value = original.trim();
    if (!value) throw new DfdError("Ein Wert fehlt.");
    if (kind === "auto" && /^(["']).*\1$/s.test(value)) {
      return typed("text", value.slice(1, -1));
    }
    if (kind === "boolean" || (kind === "auto" && /^(WAHR|FALSCH)$/i.test(value))) {
      if (!/^(WAHR|FALSCH)$/i.test(value)) throw new DfdError("Gib WAHR oder FALSCH ein.");
      return typed("boolean", /^WAHR$/i.test(value));
    }
    if (kind === "number" || kind === "auto") {
      const compact = value.replace(/\s/g, "").replace(/%$/, "");
      if (/^[+-]?(?:\d+(?:[,.]\d*)?|[,.]\d+)(?:[eE][+-]?\d+)?$/.test(compact)) {
        const n = Number(compact.replace(",", ".")) / (value.endsWith("%") ? 100 : 1);
        return finite(n);
      }
      if (kind === "number") throw new DfdError("Gib eine gültige Zahl ein.");
    }
    if (kind !== "auto" && kind !== "text") throw new DfdError("Der Wert hat nicht den gewählten Typ.");
    return typed("text", value);
  }

  function createEmptyDocument() { return { version: 1, nodes: [], edges: [] }; }
  function validateDocument(document) {
    const errors = [];
    if (!document || document.version !== 1 || !Array.isArray(document.nodes) || !Array.isArray(document.edges)) {
      return { valid: false, errors: ["Das Diagrammformat ist ungültig."] };
    }
    if (document.nodes.length > MAX_NODES || document.edges.length > MAX_EDGES) errors.push("Das Diagramm enthält zu viele Bausteine oder Pfeile.");
    const nodes = new Map();
    for (const node of document.nodes) {
      if (!node || typeof node.id !== "string" || !/^[\w-]{1,60}$/.test(node.id) || nodes.has(node.id)) {
        errors.push("Ein Baustein hat keine eindeutige ID.");
        continue;
      }
      nodes.set(node.id, node);
      if (!["input", "constant", "function", "splitter", "output"].includes(node.type) ||
          !Number.isFinite(node.x) || !Number.isFinite(node.y) || Math.abs(node.x) > 10000 || Math.abs(node.y) > 10000 ||
          typeof node.label !== "string" || node.label.length > 120) errors.push(`Baustein ${node.id} ist ungültig.`);
      if (node.type === "function" && !registry.has(node.functionId)) errors.push(`Funktion bei ${node.id} ist unbekannt.`);
      if (node.type === "constant" && (typeof node.value !== "string" || node.value.length > 200)) errors.push(`Konstante ${node.id} ist ungültig.`);
    }
    const edgeIds = new Set(), targets = new Set();
    for (const edge of document.edges) {
      if (!edge || typeof edge.id !== "string" || !/^[\w-]{1,60}$/.test(edge.id) || edgeIds.has(edge.id)) {
        errors.push("Ein Pfeil hat keine eindeutige ID.");
        continue;
      }
      edgeIds.add(edge.id);
      const source = nodes.get(edge.from), target = nodes.get(edge.to);
      if (!source || !target || source.id === target.id || source.type === "output" || target.type === "input" || target.type === "constant") {
        errors.push(`Pfeil ${edge.id} verbindet unzulässige Bausteine.`);
        continue;
      }
      const count = target.type === "function" ? (target.inputCount ?? registry.get(target.functionId)?.min ?? 0) : 1;
      if (!Number.isInteger(edge.port) || edge.port < 0 || edge.port >= count) errors.push(`Pfeil ${edge.id} hat einen ungültigen Eingang.`);
      const key = `${edge.to}:${edge.port}`;
      if (targets.has(key)) errors.push(`Eingang ${edge.port + 1} von ${edge.to} ist mehrfach verbunden.`);
      targets.add(key);
    }
    for (const node of document.nodes) {
      if (node.type !== "function" || !registry.has(node.functionId)) continue;
      const definition = registry.get(node.functionId);
      const count = node.inputCount ?? definition.min;
      if (!Number.isInteger(count) || count < definition.min || count > definition.max) errors.push(`Die Eingangsanzahl von ${node.label || node.id} ist ungültig.`);
    }
    return { valid: errors.length === 0, errors };
  }

  function evaluate(document, inputValues = {}, context = {}) {
    const validation = validateDocument(document);
    if (!validation.valid) throw new DfdError(validation.errors[0]);
    const nodes = new Map(document.nodes.map((node) => [node.id, node]));
    const inputs = new Map(), outgoing = new Map();
    for (const edge of document.edges) {
      inputs.set(`${edge.to}:${edge.port}`, edge);
      outgoing.set(edge.from, (outgoing.get(edge.from) || 0) + 1);
    }
    for (const node of document.nodes) {
      if (node.type !== "splitter" && node.type !== "output" && (outgoing.get(node.id) || 0) > 1) {
        throw new DfdError("Verwende einen Verteiler, wenn ein Wert mehrfach gebraucht wird.", node.id);
      }
      if (node.type === "output" && (outgoing.get(node.id) || 0)) throw new DfdError("Eine Ausgabe darf keinen Ausgangspfeil haben.", node.id);
    }
    const state = new Map();
    function detectCycle(id) {
      if (state.get(id) === 1) throw new DfdError("Im Diagramm entsteht ein Kreis. Prüfe die Richtung der Pfeile.", id);
      if (state.get(id) === 2) return;
      state.set(id, 1);
      for (const edge of document.edges.filter((item) => item.from === id)) detectCycle(edge.to);
      state.set(id, 2);
    }
    for (const node of document.nodes) detectCycle(node.id);
    const cache = new Map(), edgeValues = {};
    const atPort = (node, port) => {
      const edge = inputs.get(`${node.id}:${port}`);
      if (!edge) throw new DfdError(`Bei ${node.label || node.id} fehlt Eingang ${port + 1}.`, node.id);
      const value = atNode(edge.from);
      edgeValues[edge.id] = value;
      return value;
    };
    function atNode(id) {
      if (cache.has(id)) return cache.get(id);
      const node = nodes.get(id);
      let value;
      try {
        if (node.type === "input") {
          const raw = Object.prototype.hasOwnProperty.call(inputValues, id) ? inputValues[id] : inputValues[node.label];
          if (raw === undefined) throw new DfdError(`Für ${node.label || "eine Eingabe"} fehlt ein Wert.`);
          value = raw && typeof raw === "object" && ["number", "text", "boolean"].includes(raw.type)
            ? raw : parseLiteral(raw, node.valueType || "auto");
        } else if (node.type === "constant") {
          value = parseLiteral(node.value, node.valueType || "auto");
        } else if (node.type === "splitter" || node.type === "output") {
          value = atPort(node, 0);
        } else {
          const definition = registry.get(node.functionId);
          const count = node.inputCount ?? definition.min;
          if (node.functionId === "WENN") {
            const condition = boolean(atPort(node, 0), "Bedingung");
            value = atPort(node, condition ? 1 : 2);
          } else {
            value = definition.run(Array.from({ length: count }, (_, port) => atPort(node, port)), context);
          }
        }
      } catch (error) {
        if (error instanceof DfdError) {
          if (!error.nodeId) error.nodeId = node.id;
          throw error;
        }
        throw new DfdError(`Bei ${node.label || node.id} konnte nicht gerechnet werden.`, node.id);
      }
      cache.set(id, value);
      return value;
    }
    const outputNodes = document.nodes.filter((node) => node.type === "output");
    if (!outputNodes.length) throw new DfdError("Eine Ausgabe fehlt.");
    const outputs = outputNodes.map((node) => ({ id: node.id, label: node.label, value: atNode(node.id) }));
    return { outputs, edgeValues };
  }

  window.DfdFunctions = Object.freeze({
    DfdError, createEmptyDocument, validateDocument, evaluate, parseLiteral,
    listFunctions: () => [...registry.values()].map(({ id, label, group, min, max, labels }) => ({ id, label, group, min, max, labels })),
    getFunction: (id) => {
      const definition = registry.get(id);
      return definition && { id: definition.id, label: definition.label, group: definition.group, min: definition.min, max: definition.max, labels: definition.labels };
    }
  });
})();
