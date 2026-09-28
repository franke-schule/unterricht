/* Aufgabenbezogene Prüfung. Layout und Knoten-IDs beeinflussen die Bewertung nicht. */
(() => {
  "use strict";

  const api = window.DfdFunctions;
  if (!api) throw new Error("dfd-functions.js muss vor dfd-task-checks.js geladen werden.");
  const feedback = (level, message) => ({ level, message });
  const normalize = (value) => String(value || "").trim().toLocaleLowerCase("de").replace(/\s+/g, " ");

  function graph(document) {
    const nodes = new Map(document.nodes.map((node) => [node.id, node]));
    const incoming = new Map(document.edges.map((edge) => [`${edge.to}:${edge.port}`, edge.from]));
    const child = (node, port = 0) => nodes.get(incoming.get(`${node?.id}:${port}`));
    const isFunction = (node, id) => node?.type === "function" && node.functionId === id;
    const isInput = (node, aliases) => node?.type === "input" && aliases.some((alias) => {
      const label = normalize(node.label);
      return label === alias || label === `${alias} (${aliases[0]})`;
    });
    const isNumber = (node, expected) => {
      if (node?.type !== "constant") return false;
      try {
        const actual = api.parseLiteral(node.value, node.valueType || "auto");
        return actual.type === "number" && Math.abs(actual.value - expected) < 1e-9;
      } catch { return false; }
    };
    const isText = (node, expected) => {
      if (node?.type !== "constant") return false;
      try {
        const actual = api.parseLiteral(node.value, node.valueType || "auto");
        return actual.type === "text" && normalize(actual.value).replace(/\s/g, "") === expected;
      } catch { return false; }
    };
    const reachable = (node, seen = new Set()) => {
      if (!node || seen.has(node.id)) return seen;
      seen.add(node.id);
      for (let port = 0; port < 8; port++) reachable(child(node, port), seen);
      return seen;
    };
    return { nodes, child, isFunction, isInput, isNumber, isText, reachable };
  }

  function hasCycle(document) {
    const next = new Map();
    document.edges.forEach((edge) => next.set(edge.from, [...(next.get(edge.from) || []), edge.to]));
    const state = new Map();
    function visit(id) {
      if (state.get(id) === 1) return true;
      if (state.get(id) === 2) return false;
      state.set(id, 1);
      for (const target of next.get(id) || []) if (visit(target)) return true;
      state.set(id, 2);
      return false;
    }
    return document.nodes.some((node) => visit(node.id));
  }

  function checkSpendenlauf(document, g) {
    const { child, isFunction, isInput, isNumber, reachable } = g;
    const sources = document.nodes;
    if (!sources.some((node) => isInput(node, ["s", "erlaufene summe"])) ||
        !sources.some((node) => isInput(node, ["u", "unkosten", "unkosten smv"]))) {
      return feedback("low", "Noch nicht korrekt. Lege Eingaben für die erlaufene Summe und die Unkosten an.");
    }
    const output = sources.find((node) => node.type === "output");
    const plus = child(output);
    if (!output || !isFunction(plus, "+")) {
      return feedback("low", "Noch nicht korrekt. Führe die beiden Rechenzweige über „plus“ zu einer Ausgabe zusammen.");
    }
    const pair = [child(plus, 0), child(plus, 1)];
    const minus = pair.find((node) => isFunction(node, "-"));
    const times = pair.find((node) => isFunction(node, "*"));
    if (!sources.some((node) => node.type === "splitter")) {
      return feedback("medium", "Teilweise korrekt. Die erlaufene Summe wird in zwei Rechenzweigen gebraucht. Prüfe, wo ein Verteiler nötig ist.");
    }
    if (!minus || !times) {
      return feedback("medium", "Teilweise korrekt. Prüfe die beiden Zweige: In einem wird abgezogen, im anderen mit 0,5 multipliziert.");
    }
    const split = child(minus, 0);
    if (isInput(child(minus, 0), ["u", "unkosten", "unkosten smv"]) ||
        !isInput(child(minus, 1), ["u", "unkosten", "unkosten smv"])) {
      return feedback("medium", "Teilweise korrekt. Prüfe bei „minus“, welcher Wert zuerst und welcher davon abgezogen wird.");
    }
    if (split?.type !== "splitter" || !isInput(child(split), ["s", "erlaufene summe"])) {
      return feedback("medium", "Teilweise korrekt. Verbinde die erlaufene Summe über einen Verteiler mit beiden Zweigen.");
    }
    const factors = [child(times, 0), child(times, 1)];
    if (!factors.some((node) => node?.id === split.id) || !factors.some((node) => isNumber(node, 0.5))) {
      return feedback("medium", "Teilweise korrekt. Prüfe im Zuschuss-Zweig die Verbindung zur erlaufenen Summe und den festen Wert 0,5.");
    }
    if (reachable(output).size !== sources.length || sources.filter((node) => node.type === "output").length !== 1) {
      return feedback("medium", "Teilweise korrekt. Entferne zusätzliche oder unverbundene Bausteine und prüfe die Ausgabe.");
    }
    for (const [s, u] of [[100, 20], [20, 30], [80.5, 12], [0, 0]]) {
      try {
        const actual = api.evaluate(document, { [child(split).id]: s, [child(minus, 1).id]: u }).outputs[0].value;
        if (actual.type !== "number" || Math.abs(actual.value - (s - u + 0.5 * s)) > 1e-7) {
          return feedback("medium", "Teilweise korrekt. Prüfe die Richtung der Pfeile und die Berechnung beider Zweige.");
        }
      } catch (error) { return feedback("low", `Noch nicht korrekt. ${error.message}`); }
    }
    return feedback("high", "Korrekt. Dein Diagramm berechnet die gespendete Gesamtsumme aus beiden Zweigen.");
  }

  function checkGewinnspiel(document, g) {
    const { child, isFunction, isInput, isNumber, isText, reachable } = g;
    const output = document.nodes.find((node) => node.type === "output");
    const when = child(output);
    if (!output || !isFunction(when, "WENN")) {
      return feedback("low", "Noch nicht korrekt. Verbinde eine WENN-Funktion mit der Ausgabe Losgewinn.");
    }
    const comparison = child(when, 0);
    if (isFunction(comparison, ">=")) {
      return feedback("medium", "Teilweise korrekt. Prüfe den Vergleich besonders für die Losnummer 70.");
    }
    if (!isFunction(comparison, ">")) {
      return feedback("medium", "Teilweise korrekt. Prüfe die Bedingung am ersten Eingang von WENN.");
    }
    if (!isInput(child(comparison, 0), ["losnummer"]) || !isNumber(child(comparison, 1), 70)) {
      return feedback("medium", "Teilweise korrekt. Vergleiche die Losnummer mit der festen Zahl 70 und prüfe ihre Reihenfolge.");
    }
    if (!isText(child(when, 1), "10€") || !isText(child(when, 2), "0€")) {
      return feedback("medium", "Teilweise korrekt. Prüfe die Reihenfolge der drei WENN-Eingänge: Bedingung, Ja-Fall, Nein-Fall.");
    }
    if (normalize(output.label) !== "losgewinn" || reachable(output).size !== document.nodes.length ||
        document.nodes.filter((node) => node.type === "output").length !== 1) {
      return feedback("medium", "Teilweise korrekt. Prüfe die Beschriftung der Ausgabe und entferne unverbundene Bausteine.");
    }
    for (const [lot, expected] of [[69, "0€"], [70, "0€"], [71, "10€"], [90, "10€"]]) {
      try {
        const actual = api.evaluate(document, { [child(comparison, 0).id]: lot }).outputs[0].value;
        if (actual.type !== "text" || normalize(actual.value).replace(/\s/g, "") !== expected) {
          return feedback("medium", "Teilweise korrekt. Prüfe die Fälle unter, bei und über der Losnummer 70.");
        }
      } catch (error) { return feedback("low", `Noch nicht korrekt. ${error.message}`); }
    }
    return feedback("high", "Korrekt. Bei 70 ergibt dein Diagramm 0 €, erst bei einer größeren Losnummer 10 €.");
  }

  function check(taskId, document) {
    const validation = api.validateDocument(document);
    if (!validation.valid) return feedback("low", `Noch nicht korrekt. ${validation.errors[0]}`);
    if (!document.nodes.length) return feedback("low", "Erstelle zuerst ein Diagramm und verbinde die Bausteine.");
    if (hasCycle(document)) return feedback("low", "Noch nicht korrekt. Im Diagramm entsteht ein Kreis. Prüfe die Richtung der Pfeile.");
    const g = graph(document);
    if (taskId === "spendenlauf") return checkSpendenlauf(document, g);
    if (taskId === "gewinnspiel") return checkGewinnspiel(document, g);
    throw new Error(`Unbekannte DFD-Aufgabe: ${taskId}`);
  }

  window.DfdTaskChecks = Object.freeze({ check });
})();
