(() => {
  "use strict";

  const config = window.spreadsheetTaskConfig;
  if (!config) throw new Error("Die Konfiguration der Tabellenaufgabe fehlt.");

  const columns = config.columns;
  const rowCount = config.rowCount;
  const formulaDefinitions = config.formulaDefinitions || [];
  const definitionByCell = new Map(formulaDefinitions.map((definition) => [definition.cell, definition]));
  const feedbackMessages = new Map();
  const formulaCells = new Set(definitionByCell.keys());
  const currencyCells = new Set(config.currencyCells || []);
  const percentCells = new Set(config.percentCells || []);
  const centeredCells = new Set(config.centeredCells || []);
  const rawCells = new Map(Object.entries(config.initialCells || {}));
  const initialCells = new Map(rawCells);
  const classByCell = new Map();
  const fillTargetCells = new Set();
  const fillGroups = (config.fillGroups || []).map((group) => ({
    ...group,
    source: parseRange(group.sourceRange || group.sourceCell),
    target: parseRange(group.targetRange || `${group.sourceCell}:${group.targetCell}`)
  }));

  Object.entries(config.cellClasses || {}).forEach(([className, cellNames]) => {
    cellNames.forEach((cellName) => {
      const classes = classByCell.get(cellName) || [];
      classes.push(className);
      classByCell.set(cellName, classes);
    });
  });

  formulaCells.forEach((cellName) => rawCells.set(cellName, ""));
  fillGroups.forEach((group) => forEachCell(group.target, (cellName) => {
    fillTargetCells.add(cellName);
    if (!containsCell(group.source, parseCellName(cellName))) rawCells.set(cellName, "");
  }));

  const appElement = document.getElementById("spreadsheet-app");
  const gridElement = document.getElementById("spreadsheet-grid");
  const viewportElement = document.getElementById("spreadsheet-viewport");
  const formulaInput = document.getElementById("formula-input");
  const formulaFeedbackElement = document.getElementById("formula-feedback");
  const nameBox = document.getElementById("cell-name-box");
  const selectionStatus = document.getElementById("selection-status");
  const resultElement = document.getElementById("check-result");
  const checkButton = document.getElementById("check-formulas");
  const resetButton = document.getElementById("reset-formulas");
  const zoomOutButton = document.getElementById("zoom-out");
  const zoomInButton = document.getElementById("zoom-in");
  const zoomResetButton = document.getElementById("zoom-reset");
  const zoomLevelElement = document.getElementById("zoom-level");

  let tableElement;
  let zoomLevel = 1;
  let activeCell = parseCellName(config.startCell || formulaDefinitions[0]?.cell || "A1");
  let selection = { top: activeCell.row, bottom: activeCell.row, left: activeCell.column, right: activeCell.column };
  let selectionAnchor = { ...activeCell };
  let selectionPointerId = null;
  let activeFill = null;

  function columnToNumber(column) {
    return column.split("").reduce((total, character) => total * 26 + character.charCodeAt(0) - 64, 0);
  }

  function numberToColumn(number) {
    let result = "";
    let current = number;
    while (current > 0) {
      current -= 1;
      result = String.fromCharCode(65 + current % 26) + result;
      current = Math.floor(current / 26);
    }
    return result;
  }

  function toCellName(column, row) {
    return `${numberToColumn(column)}${row}`;
  }

  function normalizeCellName(cellName) {
    return String(cellName).replace(/\$/g, "").trim().toUpperCase();
  }

  function parseCellName(cellName) {
    const match = normalizeCellName(cellName).match(/^([A-Z]+)(\d+)$/);
    if (!match) throw new Error(`Ungültige Zelladresse: ${cellName}`);
    return { column: columnToNumber(match[1]), row: Number(match[2]) };
  }

  function normalizeRange(start, end) {
    return {
      top: Math.min(start.row, end.row),
      bottom: Math.max(start.row, end.row),
      left: Math.min(start.column, end.column),
      right: Math.max(start.column, end.column)
    };
  }

  function parseRange(rangeText) {
    const [startText, endText = startText] = String(rangeText).split(":");
    return normalizeRange(parseCellName(startText), parseCellName(endText));
  }

  function rangeLabel(range) {
    const start = toCellName(range.left, range.top);
    const end = toCellName(range.right, range.bottom);
    return start === end ? start : `${start}:${end}`;
  }

  function containsCell(range, cell) {
    return cell.row >= range.top && cell.row <= range.bottom && cell.column >= range.left && cell.column <= range.right;
  }

  function forEachCell(range, callback) {
    for (let row = range.top; row <= range.bottom; row += 1) {
      for (let column = range.left; column <= range.right; column += 1) {
        callback(toCellName(column, row), { row, column });
      }
    }
  }

  function expandRange(start, end) {
    const references = [];
    forEachCell(normalizeRange(parseCellName(start), parseCellName(end)), (cellName) => references.push(cellName));
    return references;
  }

  function isClose(actual, expected) {
    const tolerance = Math.max(1, Math.abs(expected)) * 1e-7;
    return Number.isFinite(actual) && Math.abs(actual - expected) <= tolerance;
  }

  function translateFormula(formula, rowOffset, columnOffset) {
    return String(formula || "").replace(
      /(\$?)([A-Za-z]+)(\$?)(\d+)/g,
      (match, absoluteColumn, column, absoluteRow, row) => {
        const nextColumnNumber = absoluteColumn
          ? columnToNumber(column.toUpperCase())
          : columnToNumber(column.toUpperCase()) + columnOffset;
        const nextRow = absoluteRow ? Number(row) : Number(row) + rowOffset;
        if (nextColumnNumber < 1 || nextRow < 1) return "#BEZUG!";
        return `${absoluteColumn}${numberToColumn(nextColumnNumber)}${absoluteRow}${nextRow}`;
      }
    );
  }

  function parseFormula(source, lookupValue) {
    const formula = String(source).trim().replace(/^=/, "");
    let index = 0;

    function skipSpaces() {
      while (/\s/.test(formula[index] || "")) index += 1;
    }

    function match(character) {
      skipSpaces();
      if (formula[index] !== character) return false;
      index += 1;
      return true;
    }

    function parseExpression() {
      let value = parseTerm();
      while (true) {
        if (match("+")) value += parseTerm();
        else if (match("-")) value -= parseTerm();
        else return value;
      }
    }

    function parseTerm() {
      let value = parsePower();
      while (true) {
        if (match("*")) value *= parsePower();
        else if (match("/")) {
          const divisor = parsePower();
          if (divisor === 0) throw new Error("Division durch null.");
          value /= divisor;
        } else return value;
      }
    }

    function parsePower() {
      const base = parseUnary();
      return match("^") ? base ** parsePower() : base;
    }

    function parseUnary() {
      if (match("+")) return parseUnary();
      if (match("-")) return -parseUnary();
      return parsePrimary();
    }

    function parsePrimary() {
      skipSpaces();
      if (match("(")) {
        const value = parseExpression();
        if (!match(")")) throw new Error("Schließende Klammer fehlt.");
        return value;
      }
      if (/\d|,|\./.test(formula[index] || "")) return parseNumber();
      if (/[A-Za-zÄÖÜäöü$]/.test(formula[index] || "")) return parseIdentifier();
      throw new Error("Unerwartetes Zeichen.");
    }

    function parseNumber() {
      let text = "";
      while (/\d|,|\./.test(formula[index] || "")) {
        text += formula[index];
        index += 1;
      }
      let value = Number(text.replace(",", "."));
      if (!Number.isFinite(value)) throw new Error("Zahl konnte nicht gelesen werden.");
      if (match("%")) value /= 100;
      return value;
    }

    function parseCellReference() {
      skipSpaces();
      const cellMatch = formula.slice(index).match(/^\$?([A-Za-z]+)\$?(\d+)/);
      if (!cellMatch) throw new Error("Zellbezug erwartet.");
      index += cellMatch[0].length;
      return `${cellMatch[1].toUpperCase()}${cellMatch[2]}`;
    }

    function parseIdentifier() {
      skipSpaces();
      const functionMatch = formula.slice(index).match(/^([A-Za-zÄÖÜäöü]+)\s*\(/);
      if (!functionMatch) return lookupValue(parseCellReference());
      const functionName = functionMatch[1].toUpperCase();
      const functions = {
        SUM: (values) => values.reduce((sum, value) => sum + value, 0),
        SUMME: (values) => values.reduce((sum, value) => sum + value, 0),
        MAX: (values) => Math.max(...values),
        MIN: (values) => Math.min(...values),
        MITTELWERT: (values) => values.reduce((sum, value) => sum + value, 0) / values.length,
        AVERAGE: (values) => values.reduce((sum, value) => sum + value, 0) / values.length,
        PRODUKT: (values) => values.reduce((product, value) => product * value, 1),
        PRODUCT: (values) => values.reduce((product, value) => product * value, 1)
      };
      if (!functions[functionName]) throw new Error("Unbekannte Funktion.");
      index += functionMatch[0].length;
      let depth = 1;
      let end = index;
      while (end < formula.length && depth > 0) {
        if (formula[end] === "(") depth += 1;
        if (formula[end] === ")") depth -= 1;
        if (depth > 0) end += 1;
      }
      if (depth !== 0) throw new Error("Schließende Klammer fehlt.");
      const body = formula.slice(index, end).trim();
      index = end + 1;
      const values = [];
      body.split(";").map((part) => part.trim()).filter(Boolean).forEach((part) => {
        const rangeMatch = part.match(/^\$?([A-Za-z]+)\$?(\d+)\s*:\s*\$?([A-Za-z]+)\$?(\d+)$/);
        if (rangeMatch) {
          expandRange(`${rangeMatch[1]}${rangeMatch[2]}`, `${rangeMatch[3]}${rangeMatch[4]}`)
            .forEach((cellName) => values.push(lookupValue(cellName)));
        } else {
          values.push(parseFormula(`=${part}`, lookupValue));
        }
      });
      if (values.length === 0) throw new Error("Funktion benötigt Werte.");
      return functions[functionName](values);
    }

    const result = parseExpression();
    skipSpaces();
    if (index !== formula.length) throw new Error("Formel konnte nicht vollständig gelesen werden.");
    if (!Number.isFinite(result)) throw new Error("Das Ergebnis ist nicht endlich.");
    return result;
  }

  function evaluateCell(cellName, visiting = new Set()) {
    const normalized = normalizeCellName(cellName);
    if (visiting.has(normalized)) throw new Error("Zellbezug enthält einen Kreis.");
    const rawValue = rawCells.get(normalized);
    if (typeof rawValue === "number") return rawValue;
    const text = String(rawValue ?? "").trim();
    if (!text) throw new Error(`Zelle ${normalized} ist leer.`);
    if (!text.startsWith("=")) {
      const number = Number(text.replace(",", "."));
      if (Number.isFinite(number)) return number;
      throw new Error(`Zelle ${normalized} enthält keinen Zahlenwert.`);
    }
    visiting.add(normalized);
    try {
      return parseFormula(text, (reference) => evaluateCell(reference, visiting));
    } finally {
      visiting.delete(normalized);
    }
  }

  function formatNumber(value) {
    return value.toLocaleString("de-DE", { maximumFractionDigits: 8 });
  }

  function displayValue(cellName) {
    const rawValue = rawCells.get(cellName);
    if (rawValue === undefined || rawValue === null || rawValue === "") return "";
    let value = rawValue;
    if (typeof rawValue === "string" && rawValue.trim().startsWith("=")) {
      try {
        value = evaluateCell(cellName);
      } catch (error) {
        return "#FEHLER!";
      }
    }
    if (typeof value !== "number") return String(value);
    if (percentCells.has(cellName)) {
      return value.toLocaleString("de-DE", { style: "percent", maximumFractionDigits: 2 });
    }
    if (currencyCells.has(cellName)) {
      return value.toLocaleString("de-DE", {
        style: "currency",
        currency: "EUR",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      });
    }
    return formatNumber(value);
  }

  function parseEnteredValue(cellName, enteredValue) {
    const text = String(enteredValue).trim();
    if (!text || text.startsWith("=")) return text;
    let normalized = text.replace(/\s/g, "").replace("€", "");
    if (percentCells.has(cellName) && normalized.endsWith("%")) {
      const number = Number(normalized.slice(0, -1).replace(/\./g, "").replace(",", "."));
      return Number.isFinite(number) ? number / 100 : text;
    }
    normalized = normalized.replace(/\./g, "").replace(",", ".");
    const number = Number(normalized);
    return Number.isFinite(number) ? number : text;
  }

  function findFormulaReferences(formula) {
    const references = new Set();
    const source = String(formula || "").toUpperCase();
    const rangePattern = /(\$?[A-Z]+\$?\d+)\s*:\s*(\$?[A-Z]+\$?\d+)/g;
    let rangeMatch;
    while ((rangeMatch = rangePattern.exec(source)) !== null) {
      expandRange(rangeMatch[1], rangeMatch[2]).forEach((cellName) => references.add(cellName));
    }
    (source.match(/\$?[A-Z]+\$?\d+/g) || []).forEach((cellName) => references.add(normalizeCellName(cellName)));
    return references;
  }

  function findReferenceTokens(formula) {
    return (String(formula || "").toUpperCase().match(/\$?[A-Z]+\$?\d+/g) || []).map((token) => {
      const match = token.match(/^(\$?)([A-Z]+)(\$?)(\d+)$/);
      return {
        cell: `${match[2]}${match[4]}`,
        columnAbsolute: match[1] === "$",
        rowAbsolute: match[3] === "$"
      };
    });
  }

  function findNumberLiterals(formula) {
    const withoutReferences = String(formula || "").replace(/\$?[A-Za-z]+\$?\d+/g, " ");
    return (withoutReferences.match(/(?:\d+(?:[.,]\d+)?|[.,]\d+)\s*%?/g) || []).map((literal) => {
      const percent = literal.includes("%");
      const value = Number(literal.replace("%", "").trim().replace(",", "."));
      return percent ? value / 100 : value;
    });
  }

  function analyzeFormula(formula, definition) {
    const foundRefs = findFormulaReferences(formula);
    const tokens = findReferenceTokens(formula);
    const missingRefs = (definition.requiredRefs || []).filter((cellName) => !foundRefs.has(cellName));
    const missingReferenceRules = (definition.referenceRules || []).filter((rule) => !tokens.some((token) => (
      token.cell === rule.cell &&
      token.columnAbsolute === rule.columnAbsolute &&
      token.rowAbsolute === rule.rowAbsolute
    )));
    const allowedNumbers = definition.allowedNumbers || [];
    const forbiddenNumbers = findNumberLiterals(formula).filter(
      (number) => !allowedNumbers.some((allowed) => isClose(number, allowed))
    );
    return { missingRefs, missingReferenceRules, forbiddenNumbers };
  }

  function refreshGrid() {
    gridElement.querySelectorAll("td[data-cell]").forEach((cellElement) => {
      const cellName = cellElement.dataset.cell;
      const display = cellElement.querySelector(".cell-display");
      if (display) display.textContent = displayValue(cellName);
      cellElement.classList.toggle("cell-has-content", String(rawCells.get(cellName) ?? "").trim() !== "");
    });
    updateFormulaBar();
  }

  function updateFormulaBar() {
    const cellName = toCellName(activeCell.column, activeCell.row);
    nameBox.textContent = rangeLabel(selection);
    if (document.activeElement !== formulaInput) formulaInput.value = String(rawCells.get(cellName) ?? "");
    const cellCount = (selection.bottom - selection.top + 1) * (selection.right - selection.left + 1);
    selectionStatus.innerHTML = cellCount === 1
      ? `Aktive Zelle: <strong>${cellName}</strong>`
      : `Auswahl: <strong>${rangeLabel(selection)}</strong> · ${cellCount} Zellen`;
    updateFormulaFeedback();
  }

  function updateFormulaFeedback() {
    const cellName = toCellName(activeCell.column, activeCell.row);
    const message = feedbackMessages.get(cellName);
    formulaFeedbackElement.hidden = !message;
    formulaFeedbackElement.textContent = message ? `${cellName}: ${message}` : "";
  }

  function renderSelection() {
    gridElement.querySelectorAll(".selected-cell, .active-cell, .selection-top, .selection-bottom, .selection-left, .selection-right, .fill-preview-cell")
      .forEach((element) => element.classList.remove(
        "selected-cell", "active-cell", "selection-top", "selection-bottom", "selection-left", "selection-right", "fill-preview-cell"
      ));
    forEachCell(selection, (cellName, cell) => {
      const element = gridElement.querySelector(`[data-cell="${cellName}"]`);
      if (!element) return;
      element.classList.add("selected-cell");
      if (cell.row === selection.top) element.classList.add("selection-top");
      if (cell.row === selection.bottom) element.classList.add("selection-bottom");
      if (cell.column === selection.left) element.classList.add("selection-left");
      if (cell.column === selection.right) element.classList.add("selection-right");
    });
    gridElement.querySelector(`[data-cell="${toCellName(activeCell.column, activeCell.row)}"]`)?.classList.add("active-cell");
    if (!activeFill) {
      gridElement.querySelectorAll(".spreadsheet-fill-handle").forEach((handle) => handle.remove());
      const handleCell = gridElement.querySelector(`[data-cell="${toCellName(selection.right, selection.bottom)}"]`);
      if (handleCell) createFillHandle(handleCell);
    }
    if (activeFill) forEachCell(activeFill.preview, (cellName) => {
      if (!containsCell(activeFill.source, parseCellName(cellName))) {
        gridElement.querySelector(`[data-cell="${cellName}"]`)?.classList.add("fill-preview-cell");
      }
    });
    updateFormulaBar();
  }

  function setSelection(anchor, focus = anchor, keepActive = false) {
    const boundedAnchor = {
      row: Math.max(1, Math.min(rowCount, anchor.row)),
      column: Math.max(1, Math.min(columns.length, anchor.column))
    };
    const boundedFocus = {
      row: Math.max(1, Math.min(rowCount, focus.row)),
      column: Math.max(1, Math.min(columns.length, focus.column))
    };
    selectionAnchor = boundedAnchor;
    if (!keepActive) activeCell = { ...boundedAnchor };
    selection = normalizeRange(boundedAnchor, boundedFocus);
    renderSelection();
  }

  function cellFromPoint(clientX, clientY) {
    const element = document.elementFromPoint(clientX, clientY)?.closest?.("td[data-cell]");
    return element ? parseCellName(element.dataset.cell) : null;
  }

  function startSelection(event, cell) {
    if (event.button !== 0 || event.target.closest("button")) return;
    event.preventDefault();
    tableElement?.focus({ preventScroll: true });
    selectionPointerId = event.pointerId;
    const anchor = event.shiftKey ? selectionAnchor : cell;
    if (!event.shiftKey) activeCell = { ...cell };
    selectionAnchor = { ...anchor };
    selection = normalizeRange(anchor, cell);
    event.currentTarget.setPointerCapture?.(event.pointerId);
    document.body.classList.add("is-selecting-sheet");
    renderSelection();
  }

  function movePointer(event) {
    if (activeFill && event.pointerId === activeFill.pointerId) {
      event.preventDefault();
      const cell = cellFromPoint(event.clientX, event.clientY);
      if (cell) activeFill.preview = normalizeRange(
        { row: Math.min(activeFill.source.top, cell.row), column: Math.min(activeFill.source.left, cell.column) },
        { row: Math.max(activeFill.source.bottom, cell.row), column: Math.max(activeFill.source.right, cell.column) }
      );
      renderSelection();
      return;
    }
    if (selectionPointerId !== event.pointerId) return;
    const cell = cellFromPoint(event.clientX, event.clientY);
    if (!cell) return;
    selection = normalizeRange(selectionAnchor, cell);
    renderSelection();
  }

  function positiveModulo(value, divisor) {
    return ((value % divisor) + divisor) % divisor;
  }

  function getFillValue(source, sourceValues, destination) {
    const height = source.bottom - source.top + 1;
    const width = source.right - source.left + 1;
    if (width === 1 && height >= 2 && sourceValues.every(({ raw }) => typeof raw === "number")) {
      const first = sourceValues.find(({ cell }) => cell.row === source.top).raw;
      const last = sourceValues.find(({ cell }) => cell.row === source.bottom).raw;
      const step = (last - first) / (height - 1);
      return first + (destination.row - source.top) * step;
    }
    if (height === 1 && width >= 2 && sourceValues.every(({ raw }) => typeof raw === "number")) {
      const first = sourceValues.find(({ cell }) => cell.column === source.left).raw;
      const last = sourceValues.find(({ cell }) => cell.column === source.right).raw;
      const step = (last - first) / (width - 1);
      return first + (destination.column - source.left) * step;
    }
    const template = {
      row: source.top + positiveModulo(destination.row - source.top, height),
      column: source.left + positiveModulo(destination.column - source.left, width)
    };
    const raw = sourceValues.find(({ cell }) => cell.row === template.row && cell.column === template.column)?.raw ?? "";
    return typeof raw === "string" && raw.trim().startsWith("=")
      ? translateFormula(raw, destination.row - template.row, destination.column - template.column)
      : raw;
  }

  function fillSelection(source, target) {
    const sourceValues = [];
    forEachCell(source, (cellName, cell) => sourceValues.push({ cell, raw: rawCells.get(cellName) ?? "" }));
    forEachCell(target, (cellName, cell) => {
      if (containsCell(source, cell)) return;
      rawCells.set(cellName, getFillValue(source, sourceValues, cell));
    });
  }

  function finishPointer(event) {
    if (activeFill && event.pointerId === activeFill.pointerId) {
      event.preventDefault();
      const { source, preview } = activeFill;
      activeFill = null;
      document.body.classList.remove("is-filling-sheet");
      fillSelection(source, preview);
      selection = { ...preview };
      selectionAnchor = { row: preview.top, column: preview.left };
      activeCell = { ...selectionAnchor };
      refreshGrid();
      clearResult();
      showResult(`Der Bereich ${rangeLabel(preview)} wurde ausgefüllt. In den Zellen siehst du die Werte; die Formeln stehen in der Formelleiste.`, "success");
      renderSelection();
      return;
    }
    if (selectionPointerId !== event.pointerId) return;
    selectionPointerId = null;
    document.body.classList.remove("is-selecting-sheet");
  }

  function cancelPointer(event) {
    if (activeFill?.pointerId === event.pointerId) {
      activeFill = null;
      document.body.classList.remove("is-filling-sheet");
      renderSelection();
    }
    if (selectionPointerId === event.pointerId) {
      selectionPointerId = null;
      document.body.classList.remove("is-selecting-sheet");
    }
  }

  function createFillHandle(cellElement) {
    const handle = document.createElement("button");
    handle.className = "spreadsheet-fill-handle";
    handle.type = "button";
    handle.setAttribute("aria-label", `Auswahl ${rangeLabel(selection)} automatisch ausfüllen`);
    handle.title = "Ziehen, um die Auswahl auszufüllen";
    handle.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();
      activeFill = { pointerId: event.pointerId, source: { ...selection }, preview: { ...selection } };
      handle.setPointerCapture?.(event.pointerId);
      document.body.classList.add("is-filling-sheet");
      renderSelection();
    });
    cellElement.append(handle);
  }

  function setCellFeedback(cellName, message, type) {
    const cellElement = gridElement.querySelector(`[data-cell="${cellName}"]`);
    if (!cellElement) return;
    if (type === "error" && message) feedbackMessages.set(cellName, message);
    else feedbackMessages.delete(cellName);
    cellElement.classList.toggle("is-correct", type === "success");
    cellElement.classList.toggle("has-error", type === "error");
    cellElement.title = message;
    const dot = cellElement.querySelector(".cell-feedback-dot");
    if (dot) dot.setAttribute("aria-label", message);
    const visibleMessage = cellElement.querySelector(".cell-feedback-message");
    if (visibleMessage) {
      visibleMessage.textContent = type === "error" ? message : "";
      visibleMessage.hidden = type !== "error" || !message;
    }
    if (cellName === toCellName(activeCell.column, activeCell.row)) updateFormulaFeedback();
  }

  function clearCellFeedback() {
    formulaCells.forEach((cellName) => setCellFeedback(cellName, "", ""));
  }

  function applyTestCase(testCase) {
    if (config.applyTestCase) config.applyTestCase(rawCells, testCase);
    else Object.entries(testCase.values || {}).forEach(([cellName, value]) => rawCells.set(cellName, value));
  }

  function checkFormula(cellName, showSummary = false) {
    const definition = definitionByCell.get(cellName);
    if (!definition) return false;
    const formula = String(rawCells.get(cellName) ?? "").trim();
    let message = "Richtig. Die Formel funktioniert auch mit veränderten Werten.";
    let correct = true;
    if (!formula.startsWith("=")) {
      correct = false;
      message = "Beginne die Formel selbst mit =.";
    } else {
      const analysis = analyzeFormula(formula, definition);
      if (analysis.missingRefs.length > 0) {
        correct = false;
        message = `Verwende Zellbezüge: ${analysis.missingRefs.join(", ")}.`;
      } else if (analysis.missingReferenceRules.length > 0) {
        correct = false;
        message = analysis.missingReferenceRules[0].message;
      } else if (analysis.forbiddenNumbers.length > 0) {
        correct = false;
        message = "Verwende die Werte aus den Zellen statt fest eingetippter Zahlen.";
      }
    }
    const savedCells = new Map(rawCells);
    try {
      if (correct) {
        for (const testCase of config.testCases || []) {
          applyTestCase(testCase);
          definition.prepare?.({ cells: rawCells, testCase });
          if (!isClose(evaluateCell(cellName), definition.expected(testCase))) {
            correct = false;
            message = definition.errorMessage || "Das Ergebnis passt noch nicht. Prüfe Rechenzeichen und Zellbezüge.";
            break;
          }
        }
      }
    } catch (error) {
      correct = false;
      message = `Die Formel konnte nicht berechnet werden: ${error.message}`;
    } finally {
      rawCells.clear();
      savedCells.forEach((value, key) => rawCells.set(key, value));
      refreshGrid();
    }
    setCellFeedback(cellName, message, correct ? "success" : "error");
    if (showSummary) {
      setSelection(parseCellName(cellName));
      showResult(`${cellName} (${definition.name}): ${message}`, correct ? "success" : "error");
    }
    return correct;
  }

  function fillGroupIsComplete(group) {
    const sourceValues = [];
    forEachCell(group.source, (cellName, cell) => sourceValues.push({ cell, raw: rawCells.get(cellName) ?? "" }));
    let complete = true;
    forEachCell(group.target, (cellName, cell) => {
      if (containsCell(group.source, cell)) return;
      if (rawCells.get(cellName) !== getFillValue(group.source, sourceValues, cell)) complete = false;
    });
    return complete;
  }

  function checkFormulas() {
    clearResult();
    const incorrect = formulaDefinitions.filter(({ cell }) => !checkFormula(cell));
    const incompleteFill = fillGroups.find((group) => !fillGroupIsComplete(group));
    if (incorrect.length === 0 && !incompleteFill) {
      showResult(config.successMessage || "Sehr gut! Alle Formeln und Ausfüllbereiche sind richtig.", "success");
      return;
    }
    if (incorrect.length > 0) {
      const details = incorrect
        .map(({ cell }) => `${cell}: ${feedbackMessages.get(cell) || "Die Formel ist noch nicht richtig."}`)
        .join(" • ");
      setSelection(parseCellName(incorrect[0].cell));
      showResult(details, "error");
      return;
    }
    showResult(incompleteFill.incompleteMessage || `Fülle den Bereich ${rangeLabel(incompleteFill.target)} vollständig aus.`, "error");
  }

  function clearResult() {
    resultElement.className = "check-result";
    resultElement.textContent = "";
    clearCellFeedback();
  }

  function showResult(message, type) {
    resultElement.className = `check-result ${type}`;
    resultElement.textContent = message;
  }

  function createGrid() {
    const table = document.createElement("table");
    table.className = `excel-grid ${config.tableClass || ""}`;
    table.style.minWidth = `${config.minWidth || 900}px`;
    const colgroup = document.createElement("colgroup");
    const rowColumn = document.createElement("col");
    rowColumn.style.width = "42px";
    colgroup.append(rowColumn);
    columns.forEach((column, index) => {
      const col = document.createElement("col");
      col.style.width = `${config.columnWidths?.[index] || 120}px`;
      colgroup.append(col);
    });
    table.append(colgroup);

    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    const corner = document.createElement("th");
    corner.className = "corner-cell";
    headerRow.append(corner);
    columns.forEach((column) => {
      const heading = document.createElement("th");
      heading.scope = "col";
      heading.textContent = column;
      headerRow.append(heading);
    });
    thead.append(headerRow);
    table.append(thead);

    const tbody = document.createElement("tbody");
    for (let row = 1; row <= rowCount; row += 1) {
      const tr = document.createElement("tr");
      const rowHeading = document.createElement("th");
      rowHeading.scope = "row";
      rowHeading.textContent = row;
      tr.append(rowHeading);
      columns.forEach((column) => {
        const cellName = `${column}${row}`;
        const td = document.createElement("td");
        td.dataset.cell = cellName;
        td.className = "sheet-cell";
        (classByCell.get(cellName) || []).forEach((className) => td.classList.add(className));
        if (formulaCells.has(cellName)) td.classList.add("task-formula-cell");
        if (fillTargetCells.has(cellName)) td.classList.add("fill-target-cell");
        if (currencyCells.has(cellName)) td.classList.add("currency-cell");
        if (percentCells.has(cellName)) td.classList.add("percent-cell");
        if (centeredCells.has(cellName)) td.classList.add("center-cell");
        td.tabIndex = -1;
        td.setAttribute("role", "gridcell");
        td.setAttribute("aria-label", `Zelle ${cellName}`);
        td.addEventListener("pointerdown", (event) => startSelection(event, parseCellName(cellName)));
        td.addEventListener("dblclick", () => {
          setSelection(parseCellName(cellName));
          formulaInput.focus();
          formulaInput.select();
        });
        const display = document.createElement("span");
        display.className = "cell-display";
        td.append(display);
        if (formulaCells.has(cellName)) {
          const checkCellButton = document.createElement("button");
          checkCellButton.type = "button";
          checkCellButton.className = "cell-check-button";
          checkCellButton.textContent = "✓";
          checkCellButton.title = `${cellName} prüfen`;
          checkCellButton.setAttribute("aria-label", `Formel in ${cellName} prüfen`);
          checkCellButton.addEventListener("pointerdown", (event) => event.stopPropagation());
          checkCellButton.addEventListener("click", () => checkFormula(cellName, true));
          const feedbackDot = document.createElement("span");
          feedbackDot.className = "cell-feedback-dot";
          const feedbackMessage = document.createElement("div");
          feedbackMessage.id = `cell-feedback-${cellName}`;
          feedbackMessage.className = "cell-feedback-message";
          feedbackMessage.setAttribute("role", "tooltip");
          feedbackMessage.hidden = true;
          checkCellButton.setAttribute("aria-describedby", feedbackMessage.id);
          td.append(checkCellButton, feedbackDot, feedbackMessage);
        }
        tr.append(td);
      });
      tbody.append(tr);
    }
    table.append(tbody);
    table.setAttribute("role", "grid");
    table.tabIndex = 0;
    table.setAttribute("aria-rowcount", String(rowCount));
    table.setAttribute("aria-colcount", String(columns.length));
    gridElement.append(table);
    tableElement = table;
  }

  function commitFormulaBar() {
    const cellName = toCellName(activeCell.column, activeCell.row);
    rawCells.set(cellName, parseEnteredValue(cellName, formulaInput.value));
    refreshGrid();
    clearResult();
  }

  function moveActive(rowDelta, columnDelta, extend = false) {
    const next = {
      row: Math.max(1, Math.min(rowCount, activeCell.row + rowDelta)),
      column: Math.max(1, Math.min(columns.length, activeCell.column + columnDelta))
    };
    if (extend) {
      selection = normalizeRange(selectionAnchor, next);
      renderSelection();
    } else {
      setSelection(next);
    }
    gridElement.querySelector(`[data-cell="${toCellName(next.column, next.row)}"]`)?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }

  function handleGridKeydown(event) {
    if (document.activeElement === formulaInput || event.target.closest("button")) return;
    const moves = {
      ArrowUp: [-1, 0],
      ArrowDown: [1, 0],
      ArrowLeft: [0, -1],
      ArrowRight: [0, 1]
    };
    if (moves[event.key]) {
      event.preventDefault();
      moveActive(moves[event.key][0], moves[event.key][1], event.shiftKey);
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      moveActive(event.shiftKey ? -1 : 1, 0);
      return;
    }
    if (event.key === "Tab") {
      event.preventDefault();
      moveActive(0, event.shiftKey ? -1 : 1);
      return;
    }
    if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      forEachCell(selection, (cellName) => rawCells.set(cellName, ""));
      refreshGrid();
      clearResult();
      return;
    }
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      formulaInput.value = event.key;
      formulaInput.focus();
      formulaInput.setSelectionRange(1, 1);
      commitFormulaBar();
    }
  }

  function resetTask() {
    rawCells.clear();
    initialCells.forEach((value, key) => rawCells.set(key, value));
    formulaCells.forEach((cellName) => rawCells.set(cellName, ""));
    fillGroups.forEach((group) => forEachCell(group.target, (cellName, cell) => {
      if (!containsCell(group.source, cell)) rawCells.set(cellName, "");
    }));
    clearResult();
    setSelection(parseCellName(config.startCell || formulaDefinitions[0]?.cell || "A1"));
    refreshGrid();
  }

  function setZoom(nextZoom) {
    zoomLevel = Math.min(1.3, Math.max(0.6, Math.round(nextZoom * 10) / 10));
    gridElement.style.zoom = zoomLevel;
    zoomLevelElement.textContent = `${Math.round(zoomLevel * 100)} %`;
    zoomOutButton.disabled = zoomLevel <= 0.6;
    zoomInButton.disabled = zoomLevel >= 1.3;
  }

  formulaInput.addEventListener("input", commitFormulaBar);
  formulaInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commitFormulaBar();
      tableElement.focus();
      moveActive(event.shiftKey ? -1 : 1, 0);
    }
    if (event.key === "Escape") {
      formulaInput.value = String(rawCells.get(toCellName(activeCell.column, activeCell.row)) ?? "");
      tableElement.focus();
    }
  });
  appElement.addEventListener("keydown", handleGridKeydown);
  document.addEventListener("pointermove", movePointer, { passive: false });
  document.addEventListener("pointerup", finishPointer, { passive: false });
  document.addEventListener("pointercancel", cancelPointer);
  checkButton.addEventListener("click", checkFormulas);
  resetButton.addEventListener("click", resetTask);
  zoomOutButton.addEventListener("click", () => setZoom(zoomLevel - 0.1));
  zoomInButton.addEventListener("click", () => setZoom(zoomLevel + 0.1));
  zoomResetButton.addEventListener("click", () => setZoom(1));
  viewportElement.addEventListener("wheel", (event) => {
    if (!event.ctrlKey) return;
    event.preventDefault();
    setZoom(zoomLevel + (event.deltaY < 0 ? 0.1 : -0.1));
  }, { passive: false });

  createGrid();
  refreshGrid();
  setSelection(activeCell);
  setZoom(1);
})();
