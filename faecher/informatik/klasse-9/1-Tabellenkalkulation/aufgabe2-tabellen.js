(() => {
  "use strict";

  const config = window.spreadsheetTaskConfig;
  if (!config) {
    throw new Error("Die Konfiguration der Tabellenaufgabe fehlt.");
  }

  const columns = config.columns;
  const cells = new Map(Object.entries(config.initialCells || {}));
  const formulaDefinitions = config.formulaDefinitions || [];
  const formulaCells = new Set(formulaDefinitions.map(({ cell }) => cell));
  const fillGroups = (config.fillGroups || []).map((group) => ({
    ...group,
    source: parseCellName(group.sourceCell),
    target: parseCellName(group.targetCell),
    end: parseCellName(group.sourceCell),
    complete: false
  }));
  const copiedFormulaCells = new Set();
  const overflowBlockerCells = new Set(formulaCells);
  const percentCells = new Set(config.percentCells || []);
  const currencyCells = new Set(config.currencyCells || []);
  const centeredCells = new Set(config.centeredCells || []);
  const classByCell = new Map();

  Object.entries(config.cellClasses || {}).forEach(([className, cellNames]) => {
    cellNames.forEach((cellName) => {
      const classes = classByCell.get(cellName) || [];
      classes.push(className);
      classByCell.set(cellName, classes);
    });
  });

  fillGroups.forEach((group) => {
    forEachFillCell(group, group.target, (cellName) => {
      if (cellName !== group.sourceCell) copiedFormulaCells.add(cellName);
      overflowBlockerCells.add(cellName);
    });
  });
  formulaCells.forEach((cellName) => cells.set(cellName, ""));
  copiedFormulaCells.forEach((cellName) => cells.set(cellName, ""));

  const gridElement = document.getElementById("spreadsheet-grid");
  const checkButton = document.getElementById("check-formulas");
  const resetButton = document.getElementById("reset-formulas");
  const resultElement = document.getElementById("check-result");
  const spreadsheetFrame = document.querySelector(".spreadsheet-frame");
  const zoomOutButton = document.getElementById("zoom-out");
  const zoomInButton = document.getElementById("zoom-in");
  const zoomResetButton = document.getElementById("zoom-reset");
  const zoomLevelElement = document.getElementById("zoom-level");
  let zoomLevel = 1;
  let activeFill = null;

  function parseCellName(cellName) {
    const match = String(cellName).toUpperCase().match(/^([A-Z]+)(\d+)$/);
    if (!match) throw new Error(`Ungültige Zelladresse: ${cellName}`);
    return { column: columnToNumber(match[1]), row: Number(match[2]) };
  }

  function normalizeCellName(cellName) {
    return String(cellName).replace(/\$/g, "").trim().toUpperCase();
  }

  function columnToNumber(column) {
    return column.split("").reduce(
      (total, character) => total * 26 + character.charCodeAt(0) - 64,
      0
    );
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

  function expandRange(start, end) {
    const startCell = parseCellName(normalizeCellName(start));
    const endCell = parseCellName(normalizeCellName(end));
    const references = [];
    for (let row = Math.min(startCell.row, endCell.row); row <= Math.max(startCell.row, endCell.row); row += 1) {
      for (let column = Math.min(startCell.column, endCell.column); column <= Math.max(startCell.column, endCell.column); column += 1) {
        references.push(toCellName(column, row));
      }
    }
    return references;
  }

  function forEachFillCell(group, end, callback) {
    const maxRow = group.direction === "down" ? end.row : end.row;
    const maxColumn = group.direction === "down" ? group.source.column : end.column;
    for (let row = group.source.row; row <= maxRow; row += 1) {
      for (let column = group.source.column; column <= maxColumn; column += 1) {
        callback(toCellName(column, row), row, column);
      }
    }
  }

  function isClose(actual, expected) {
    const tolerance = Math.max(1, Math.abs(expected)) * 1e-7;
    return Number.isFinite(actual) && Math.abs(actual - expected) <= tolerance;
  }

  function findFormulaReferences(formula) {
    const references = new Set();
    const source = String(formula || "").toUpperCase();
    const rangePattern = /(\$?[A-Z]+\$?\d+)\s*:\s*(\$?[A-Z]+\$?\d+)/g;
    let rangeMatch;
    while ((rangeMatch = rangePattern.exec(source)) !== null) {
      expandRange(rangeMatch[1], rangeMatch[2]).forEach((cellName) => references.add(cellName));
    }
    (source.match(/\$?[A-Z]+\$?\d+/g) || []).forEach(
      (cellName) => references.add(normalizeCellName(cellName))
    );
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

  function translateFormula(formula, rowOffset, columnOffset) {
    return String(formula || "").replace(
      /(\$?)([A-Za-z]+)(\$?)(\d+)/g,
      (match, absoluteColumn, column, absoluteRow, row) => {
        const translatedColumn = absoluteColumn
          ? column.toUpperCase()
          : numberToColumn(columnToNumber(column.toUpperCase()) + columnOffset);
        const translatedRow = absoluteRow ? Number(row) : Number(row) + rowOffset;
        return `${absoluteColumn}${translatedColumn}${absoluteRow}${translatedRow}`;
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
      if (/[A-Za-z$]/.test(formula[index] || "")) return parseIdentifier();
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
      const remaining = formula.slice(index);
      const cellMatch = remaining.match(/^\$?([A-Za-z]+)\$?(\d+)/);
      if (!cellMatch) throw new Error("Zellbezug erwartet.");
      index += cellMatch[0].length;
      return `${cellMatch[1].toUpperCase()}${cellMatch[2]}`;
    }

    function parseIdentifier() {
      skipSpaces();
      const remaining = formula.slice(index);
      const functionMatch = remaining.match(/^([A-Za-zÄÖÜäöü]+)\s*\(/);
      if (functionMatch) {
        const functionName = functionMatch[1].toUpperCase();
        if (functionName !== "SUM" && functionName !== "SUMME") {
          throw new Error("Unbekannte Funktion.");
        }
        index += functionMatch[0].length;
        const startCell = parseCellReference();
        if (!match(":")) throw new Error("Zellbereich erwartet.");
        const endCell = parseCellReference();
        if (!match(")")) throw new Error("Schließende Klammer fehlt.");
        return expandRange(startCell, endCell).reduce((sum, cellName) => sum + lookupValue(cellName), 0);
      }
      return lookupValue(parseCellReference());
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
    const value = cells.get(normalized);
    if (typeof value === "number") return value;
    const text = String(value || "").trim();
    if (!text) throw new Error(`Zelle ${normalized} ist leer.`);
    if (!text.startsWith("=")) {
      const numericValue = Number(text.replace(",", "."));
      if (Number.isFinite(numericValue)) return numericValue;
      throw new Error(`Zelle ${normalized} enthält keinen Zahlenwert.`);
    }
    visiting.add(normalized);
    try {
      return parseFormula(text, (referencedCell) => evaluateCell(referencedCell, visiting));
    } finally {
      visiting.delete(normalized);
    }
  }

  function evaluateOutputCell(cellName) {
    const formula = String(cells.get(cellName) || "").trim();
    if (!formula.startsWith("=")) throw new Error("Formel muss mit = beginnen.");
    return evaluateCell(cellName);
  }

  function formatNumber(value) {
    return value.toLocaleString("de-DE", { maximumFractionDigits: 8 });
  }

  function displayValue(cellName, value) {
    if (typeof value !== "number") return value || "";
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
    const text = enteredValue.trim();
    if (!text || text.startsWith("=")) return text;
    let normalized = text.replace(/\s/g, "").replace("€", "");
    if (percentCells.has(cellName) && normalized.endsWith("%")) {
      normalized = normalized.slice(0, -1);
      const percentValue = Number(normalized.replace(/\./g, "").replace(",", "."));
      return Number.isFinite(percentValue) ? percentValue / 100 : enteredValue;
    }
    normalized = normalized.replace(/\./g, "").replace(",", ".");
    const numberValue = Number(normalized);
    return Number.isFinite(numberValue) ? numberValue : enteredValue;
  }

  function cellHasContent(value) {
    return value !== undefined && value !== null && String(value).trim() !== "";
  }

  function refreshTextOverflow() {
    gridElement.querySelectorAll("td[data-cell]").forEach((cellElement) => {
      const cellName = cellElement.dataset.cell;
      const value = cells.get(cellName);
      const overflowText = cellElement.querySelector(".cell-overflow-text");
      cellElement.classList.toggle("cell-has-content", cellHasContent(value));
      if (!overflowText) return;
      const parsed = parseCellName(cellName);
      const nextCell = parsed.column < columns.length ? toCellName(parsed.column + 1, parsed.row) : null;
      const text = typeof value === "string" ? value : "";
      const canOverflow = Boolean(
        text.trim() &&
        !text.startsWith("=") &&
        nextCell &&
        !cellHasContent(cells.get(nextCell)) &&
        !overflowBlockerCells.has(nextCell)
      );
      cellElement.classList.toggle("text-overflow-source", canOverflow);
      overflowText.textContent = canOverflow ? text : "";
    });
  }

  function setCellFeedback(cellName, message, type) {
    const feedback = gridElement.querySelector(`[data-feedback-for="${cellName}"]`);
    const cellElement = gridElement.querySelector(`[data-cell="${cellName}"]`);
    if (!feedback || !cellElement) return;
    feedback.textContent = message;
    feedback.className = type ? `cell-feedback ${type}` : "cell-feedback";
    cellElement.classList.toggle("has-error", type === "error");
    cellElement.classList.toggle("is-correct", type === "success");
  }

  function clearCellFeedback() {
    formulaCells.forEach((cellName) => setCellFeedback(cellName, "", ""));
  }

  function showResult(message, type) {
    resultElement.className = `check-result ${type}`;
    resultElement.textContent = message;
  }

  function clearResult() {
    resultElement.className = "check-result";
    resultElement.textContent = "";
    clearCellFeedback();
  }

  function applyTestCase(testCase) {
    if (config.applyTestCase) {
      config.applyTestCase(cells, testCase);
      return;
    }
    Object.entries(testCase.values || {}).forEach(([cellName, value]) => cells.set(cellName, value));
  }

  function checkFormula(cellName, showSummary = false) {
    const definition = formulaDefinitions.find((entry) => entry.cell === cellName);
    if (!definition) return false;
    const formula = String(cells.get(cellName) || "").trim();
    let message = "Richtig. Die Formel funktioniert auch mit veränderten Werten.";
    let correct = true;

    if (!formula.startsWith("=")) {
      correct = false;
      message = "Beginne die Formel mit =.";
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

    const originalCells = new Map(cells);
    try {
      if (correct) {
        for (const testCase of config.testCases) {
          applyTestCase(testCase);
          definition.prepare?.({ cells, testCase });
          if (!isClose(evaluateOutputCell(cellName), definition.expected(testCase))) {
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
      cells.clear();
      originalCells.forEach((value, key) => cells.set(key, value));
      refreshComputedValues();
    }

    setCellFeedback(cellName, message, correct ? "success" : "error");
    if (showSummary) showResult(`${cellName} (${definition.name}): ${message}`, correct ? "success" : "error");
    return correct;
  }

  function fillGroupIsComplete(group) {
    if (!group.complete || group.end.row !== group.target.row || group.end.column !== group.target.column) {
      return false;
    }
    let complete = true;
    const sourceFormula = cells.get(group.sourceCell);
    forEachFillCell(group, group.target, (cellName, row, column) => {
      const expectedFormula = translateFormula(
        sourceFormula,
        row - group.source.row,
        column - group.source.column
      );
      if (cells.get(cellName) !== expectedFormula) complete = false;
    });
    return complete;
  }

  function checkFormulas() {
    const incorrect = formulaDefinitions.filter(({ cell }) => !checkFormula(cell));
    const incompleteFills = fillGroups.filter((group) => !fillGroupIsComplete(group));
    if (incorrect.length === 0 && incompleteFills.length === 0) {
      showResult(config.successMessage, "success");
      return;
    }
    if (incompleteFills.length > 0) {
      showResult(incompleteFills[0].incompleteMessage, "error");
      return;
    }
    showResult(
      `${incorrect.length} Formel${incorrect.length === 1 ? " ist" : "n sind"} noch nicht richtig. Beachte die Hinweise direkt in den orangefarbenen Zellen.`,
      "error"
    );
  }

  function clearFillGroup(group) {
    forEachFillCell(group, group.target, (cellName) => {
      if (cellName !== group.sourceCell) cells.set(cellName, "");
    });
    group.end = { ...group.source };
    group.complete = false;
  }

  function fillGroupTo(group, end) {
    forEachFillCell(group, group.target, (cellName, row, column) => {
      if (cellName === group.sourceCell) return;
      const within = row <= end.row && column <= end.column;
      cells.set(
        cellName,
        within
          ? translateFormula(cells.get(group.sourceCell), row - group.source.row, column - group.source.column)
          : ""
      );
    });
    group.end = { ...end };
    group.complete = end.row === group.target.row && end.column === group.target.column;
  }

  function clampFillEnd(group, cellName) {
    if (!cellName) return { ...group.source };
    const cell = parseCellName(cellName);
    const row = Math.min(group.target.row, Math.max(group.source.row, cell.row));
    const column = group.direction === "down"
      ? group.source.column
      : Math.min(group.target.column, Math.max(group.source.column, cell.column));
    return { row, column };
  }

  function updateFillAppearance() {
    fillGroups.forEach((group) => {
      const sourceReady = String(cells.get(group.sourceCell) || "").trim().startsWith("=");
      gridElement.querySelector(`[data-cell="${group.sourceCell}"]`)?.classList.toggle("fill-source-cell", sourceReady);
      forEachFillCell(group, group.target, (cellName, row, column) => {
        if (cellName === group.sourceCell) return;
        const cellElement = gridElement.querySelector(`[data-cell="${cellName}"]`);
        if (!cellElement) return;
        const previewEnd = activeFill?.group === group ? activeFill.previewEnd : null;
        cellElement.classList.toggle(
          "fill-preview-cell",
          Boolean(previewEnd && row <= previewEnd.row && column <= previewEnd.column)
        );
        cellElement.classList.toggle(
          "fill-complete-cell",
          row <= group.end.row && column <= group.end.column
        );
      });
    });
  }

  function validateFillSource(group) {
    if (!String(cells.get(group.sourceCell) || "").trim().startsWith("=")) {
      showResult(`Trage zuerst eine Formel in ${group.sourceCell} ein.`, "error");
      return false;
    }
    if (!checkFormula(group.sourceCell)) {
      showResult(`Prüfe zuerst die Formel in ${group.sourceCell}. Ausfüllen ist erst mit einer korrekten Ausgangsformel möglich.`, "error");
      return false;
    }
    return true;
  }

  function cellAtPoint(clientX, clientY) {
    return document.elementFromPoint(clientX, clientY)?.closest?.("td[data-cell]")?.dataset.cell || null;
  }

  function startFill(event, group) {
    if (event.button !== 0 || !validateFillSource(group)) return;
    event.preventDefault();
    activeFill = { pointerId: event.pointerId, group, previewEnd: { ...group.source } };
    event.currentTarget.setPointerCapture?.(event.pointerId);
    document.body.classList.add("is-filling-spreadsheet");
    updateFillAppearance();
  }

  function moveFill(event) {
    if (!activeFill || event.pointerId !== activeFill.pointerId) return;
    event.preventDefault();
    activeFill.previewEnd = clampFillEnd(activeFill.group, cellAtPoint(event.clientX, event.clientY));
    updateFillAppearance();
  }

  function finishFill(event) {
    if (!activeFill || event.pointerId !== activeFill.pointerId) return;
    event.preventDefault();
    const { group } = activeFill;
    const end = clampFillEnd(group, cellAtPoint(event.clientX, event.clientY));
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    activeFill = null;
    document.body.classList.remove("is-filling-spreadsheet");
    fillGroupTo(group, end);
    refreshComputedValues();
    clearResult();
    showResult(
      group.complete ? group.completeMessage : group.partialMessage(end),
      group.complete ? "success" : "error"
    );
    updateFillAppearance();
  }

  function cancelFill(event) {
    if (!activeFill || event.pointerId !== activeFill.pointerId) return;
    activeFill = null;
    document.body.classList.remove("is-filling-spreadsheet");
    updateFillAppearance();
  }

  function fillWithKeyboard(group) {
    if (!validateFillSource(group)) return;
    fillGroupTo(group, group.target);
    refreshComputedValues();
    clearResult();
    showResult(group.completeMessage, "success");
    updateFillAppearance();
  }

  function createFillHandle(td, group) {
    const fillHandle = document.createElement("button");
    fillHandle.className = "spreadsheet-fill-handle";
    if (group.direction === "rectangle") fillHandle.classList.add("rectangle-fill-handle");
    fillHandle.type = "button";
    fillHandle.setAttribute("aria-label", group.ariaLabel);
    fillHandle.title = group.title;
    fillHandle.addEventListener("pointerdown", (event) => startFill(event, group));
    fillHandle.addEventListener("pointermove", moveFill);
    fillHandle.addEventListener("pointerup", finishFill);
    fillHandle.addEventListener("pointercancel", cancelFill);
    fillHandle.addEventListener("click", (event) => {
      if (event.detail === 0) fillWithKeyboard(group);
    });
    td.append(fillHandle);
  }

  function createFormulaCell(td, cellName) {
    const input = document.createElement("input");
    input.type = "text";
    input.inputMode = "text";
    input.autocomplete = "off";
    input.spellcheck = false;
    input.placeholder = "=";
    input.setAttribute("aria-label", `Formel für ${cellName}`);
    input.addEventListener("input", () => {
      fillGroups.filter((group) => group.sourceCell === cellName).forEach(clearFillGroup);
      cells.set(cellName, input.value);
      refreshComputedValues();
      clearResult();
    });
    const output = document.createElement("output");
    output.className = "cell-result";
    output.dataset.resultFor = cellName;
    const checkCellButton = document.createElement("button");
    checkCellButton.className = "cell-check-button";
    checkCellButton.type = "button";
    checkCellButton.textContent = `${cellName} prüfen`;
    checkCellButton.addEventListener("click", () => checkFormula(cellName, true));
    const feedback = document.createElement("div");
    feedback.className = "cell-feedback";
    feedback.dataset.feedbackFor = cellName;
    td.append(input, output, checkCellButton, feedback);
    fillGroups.filter((group) => group.sourceCell === cellName).forEach((group) => createFillHandle(td, group));
  }

  function createEditableCell(td, cellName) {
    const input = document.createElement("input");
    input.type = "text";
    input.autocomplete = "off";
    input.spellcheck = false;
    input.value = displayValue(cellName, cells.get(cellName));
    input.setAttribute("aria-label", `Zelle ${cellName}`);
    input.addEventListener("input", () => {
      cells.set(cellName, parseEnteredValue(cellName, input.value));
      refreshComputedValues();
      clearResult();
    });
    td.append(input);
    const overflowText = document.createElement("span");
    overflowText.className = "cell-overflow-text";
    overflowText.setAttribute("aria-hidden", "true");
    td.append(overflowText);
    if (copiedFormulaCells.has(cellName)) {
      input.readOnly = true;
      input.tabIndex = -1;
      input.setAttribute("aria-readonly", "true");
      const output = document.createElement("output");
      output.className = "cell-result";
      output.dataset.computedFor = cellName;
      td.append(output);
    }
  }

  function createGrid() {
    const table = document.createElement("table");
    table.className = `mini-spreadsheet-table spreadsheet-task-table ${config.tableClass || ""}`;
    table.style.minWidth = `${config.minWidth}px`;
    const colgroup = document.createElement("colgroup");
    const rowNumberCol = document.createElement("col");
    rowNumberCol.style.width = "38px";
    colgroup.append(rowNumberCol);
    columns.forEach((column, index) => {
      const col = document.createElement("col");
      col.style.width = `${config.columnWidths[index]}px`;
      colgroup.append(col);
    });
    table.append(colgroup);
    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    headRow.append(document.createElement("th"));
    columns.forEach((column) => {
      const heading = document.createElement("th");
      heading.scope = "col";
      heading.textContent = column;
      headRow.append(heading);
    });
    thead.append(headRow);
    table.append(thead);
    const tbody = document.createElement("tbody");
    for (let row = 1; row <= config.rowCount; row += 1) {
      const tr = document.createElement("tr");
      const rowHeading = document.createElement("th");
      rowHeading.scope = "row";
      rowHeading.textContent = row;
      tr.append(rowHeading);
      columns.forEach((column) => {
        const cellName = `${column}${row}`;
        const td = document.createElement("td");
        td.dataset.cell = cellName;
        td.className = "spreadsheet-cell";
        (classByCell.get(cellName) || []).forEach((className) => td.classList.add(className));
        if (formulaCells.has(cellName)) td.classList.add("formula-cell", "invoice-formula-cell");
        if (copiedFormulaCells.has(cellName)) td.classList.add("computed-cell");
        if (currencyCells.has(cellName)) td.classList.add("currency-cell");
        if (percentCells.has(cellName)) td.classList.add("percent-cell");
        if (centeredCells.has(cellName)) td.classList.add("center-cell");
        if (formulaCells.has(cellName)) createFormulaCell(td, cellName);
        else createEditableCell(td, cellName);
        tr.append(td);
      });
      tbody.append(tr);
    }
    table.append(tbody);
    gridElement.append(table);
  }

  function refreshComputedValues() {
    copiedFormulaCells.forEach((cellName) => {
      const input = gridElement.querySelector(`[data-cell="${cellName}"] input`);
      const output = gridElement.querySelector(`[data-computed-for="${cellName}"]`);
      if (input && input.value !== cells.get(cellName)) input.value = cells.get(cellName) || "";
      if (!output) return;
      try {
        output.textContent = displayValue(cellName, evaluateCell(cellName));
      } catch (error) {
        output.textContent = "";
      }
    });
    formulaCells.forEach((cellName) => {
      const output = gridElement.querySelector(`[data-result-for="${cellName}"]`);
      if (!output) return;
      try {
        output.textContent = displayValue(cellName, evaluateOutputCell(cellName));
      } catch (error) {
        output.textContent = "";
      }
    });
    updateFillAppearance();
    refreshTextOverflow();
  }

  function resetFormulas() {
    cells.clear();
    Object.entries(config.initialCells || {}).forEach(([cellName, value]) => cells.set(cellName, value));
    formulaCells.forEach((cellName) => cells.set(cellName, ""));
    fillGroups.forEach(clearFillGroup);
    gridElement.querySelectorAll("td[data-cell]").forEach((cellElement) => {
      const cellName = cellElement.dataset.cell;
      const input = cellElement.querySelector("input");
      if (!input) return;
      input.value = formulaCells.has(cellName) ? "" : displayValue(cellName, cells.get(cellName));
    });
    refreshComputedValues();
    clearResult();
  }

  function setZoom(nextZoom) {
    zoomLevel = Math.min(1.3, Math.max(0.6, Math.round(nextZoom * 10) / 10));
    gridElement.style.zoom = zoomLevel;
    zoomLevelElement.textContent = `${Math.round(zoomLevel * 100)} %`;
    zoomOutButton.disabled = zoomLevel <= 0.6;
    zoomInButton.disabled = zoomLevel >= 1.3;
  }

  checkButton.addEventListener("click", checkFormulas);
  resetButton.addEventListener("click", resetFormulas);
  zoomOutButton.addEventListener("click", () => setZoom(zoomLevel - 0.1));
  zoomInButton.addEventListener("click", () => setZoom(zoomLevel + 0.1));
  zoomResetButton.addEventListener("click", () => setZoom(1));
  spreadsheetFrame.addEventListener("wheel", (event) => {
    if (!event.ctrlKey) return;
    event.preventDefault();
    setZoom(zoomLevel + (event.deltaY < 0 ? 0.1 : -0.1));
  }, { passive: false });

  createGrid();
  refreshComputedValues();
  setZoom(1);
})();
