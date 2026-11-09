// Wiederverwendete Sortierhilfe aus Aufgabe 7 (Rechnung ordnen).
import { enableTokenDrag, wasDragged } from "./token-drag.mjs";

export function evaluateStepOrder(values, config) {
  const { n, acceptedOrders, distractorIds = [], distractorHint, success, stepPlural = "Rechenschritten", wrongOrderHint = "Beginne mit dem Schritt, den du direkt aus den Angaben aufstellen kannst, und ende mit dem Ergebnis.", orderHint = "Jeder Schritt muss aus dem Schritt darüber folgen." } = config;

  if (values.some((value) => !value)) return { status: "error", text: `Fülle zuerst alle ${n} Felder mit je einer Karte.` };

  const isAccepted = acceptedOrders.some((order) => order.every((id, index) => values[index] === id));
  if (isAccepted) return { status: "success", text: success };

  const bestHits = Math.max(...acceptedOrders.map((order) => order.filter((id, index) => values[index] === id).length));
  const hasDistractor = values.some((value) => distractorIds.includes(value));

  if (bestHits === 0 && !hasDistractor) {
    return { status: "error", text: `Noch nicht korrekt. ${wrongOrderHint}` };
  }

  const parts = [];
  if (hasDistractor) parts.push(distractorHint);
  parts.push(`${bestHits} von ${n} ${stepPlural} stehen an der richtigen Stelle. ${orderHint}`);
  const prefix = bestHits > 0 ? "Teilweise korrekt." : "Noch nicht korrekt.";
  return { status: bestHits > 0 ? "partial" : "error", text: `${prefix} ${parts.join(" ")}` };
}

export function setupStepOrder(config, progress = null) {
  const { containerId, checkButtonId, resetButtonId, feedbackId, cards, order: bankOrder, n } = config;
  const container = document.getElementById(containerId);
  const feedback = document.getElementById(feedbackId);
  const values = new Array(n).fill("");
  let picked = null; // { value, from } mit from = Zeilenindex oder -1 (Speicher)

  const cardOf = (id) => cards.find((card) => card.id === id);
  const dropSelector = `#${containerId} .formula-slot`;
  const bankSelector = `#${containerId} .step-order-bank`;

  function renderCardInto(element, id) {
    element.replaceChildren();
    if (config.renderCard) config.renderCard(element, cardOf(id));
    else element.textContent = cardOf(id).text;
  }

  function place(value, from, to) {
    if (from >= 0) values[from] = "";
    if (to >= 0) {
      const previous = values[to];
      values[to] = value;
      if (from >= 0 && previous) values[from] = previous;
    }
    picked = null;
    feedback.hidden = true;
    render();
    progress?.save();
  }

  const bank = document.createElement("div");
  bank.className = "cloze-term-bank step-order-bank";
  bank.setAttribute("aria-label", config.bankLabel || "Speicher: Rechenschritte");

  const rows = document.createElement("ol");
  rows.className = "step-order-rows";
  const slots = [];

  for (let index = 0; index < n; index += 1) {
    const row = document.createElement("li");
    row.className = "step-order-row";
    const number = document.createElement("span");
    number.className = "step-order-number";
    number.setAttribute("aria-hidden", "true");
    number.textContent = String(index + 1);
    const slot = document.createElement("button");
    slot.type = "button";
    slot.className = "formula-slot";
    slot.dataset.index = String(index);
    enableTokenDrag(slot, {
      dropSelector, bankSelector,
      getLabel: () => values[index],
      renderGhost: (ghost) => renderCardInto(ghost, values[index]),
      onDrop: (dropSlot, onBank) => {
        const value = values[index];
        const to = dropSlot ? Number(dropSlot.dataset.index) : -1;
        if (to >= 0 && to !== index) place(value, index, to);
        else if (onBank) place(value, index, -1);
        else render();
      },
    });
    slot.addEventListener("click", () => {
      if (wasDragged(slot)) return;
      const value = values[index];
      if (picked && picked.from !== index) { place(picked.value, picked.from, index); slot.focus(); return; }
      if (picked && picked.from === index) { place(value, index, -1); return; }
      if (value) { picked = { value, from: index }; render(); progress?.save(); slot.focus(); }
    });
    slots.push(slot);
    row.append(number, slot);
    rows.append(row);
  }

  container.append(bank, rows);

  function render() {
    bank.replaceChildren(...bankOrder.filter((id) => !values.includes(id)).map((id) => {
      const token = document.createElement("button");
      token.type = "button";
      token.className = "cloze-token";
      renderCardInto(token, id);
      const isPicked = picked?.value === id && picked.from === -1;
      token.setAttribute("aria-pressed", String(isPicked));
      token.setAttribute("aria-label", cardOf(id).spoken);
      token.classList.toggle("is-picked", isPicked);
      enableTokenDrag(token, {
        dropSelector, bankSelector,
        getLabel: () => id,
        renderGhost: (ghost) => renderCardInto(ghost, id),
        onDrop: (slot) => { if (slot) place(id, -1, Number(slot.dataset.index)); else render(); },
      });
      token.addEventListener("click", () => {
        if (wasDragged(token)) return;
        picked = isPicked ? null : { value: id, from: -1 };
        render();
        progress?.save();
        if (picked) (slots.find((slot) => !slot.classList.contains("is-filled")) || slots[0])?.focus();
      });
      return token;
    }));
    slots.forEach((slot, index) => {
      const value = values[index];
      if (value) renderCardInto(slot, value);
      else slot.textContent = "Hierher ziehen";
      slot.classList.toggle("is-filled", Boolean(value));
      slot.classList.toggle("is-picked", picked?.from === index);
      slot.classList.toggle("is-selected", picked !== null && !value);
      slot.setAttribute("aria-label", `${config.stepLabel || "Rechenschritt"} ${index + 1}: ${value ? cardOf(value).spoken : "leer"}`);
    });
  }

  document.getElementById(checkButtonId).addEventListener("click", () => {
    const result = evaluateStepOrder(values, config);
    if (config.showFeedback) config.showFeedback(feedback, result.status, result.text);
    else {
      feedback.hidden = false;
      feedback.className = `feedback ${result.status}`;
      feedback.textContent = result.text;
    }
  });

  document.getElementById(resetButtonId).addEventListener("click", () => {
    values.fill("");
    picked = null;
    feedback.hidden = true;
    render();
    progress?.save();
  });

  progress?.registerPart(`step-order:${containerId}`, () => ({ values: [...values], picked: picked ? { ...picked } : null }), (saved) => {
    if (!saved || !Array.isArray(saved.values) || saved.values.length !== n) return;
    const allowed = new Set(cards.map((card) => card.id));
    const used = new Set();
    const restored = saved.values.map((id) => {
      if (id === "") return "";
      if (typeof id !== "string" || !allowed.has(id) || used.has(id)) return "";
      used.add(id);
      return id;
    });
    values.splice(0, n, ...restored);
    picked = null;
    const selected = saved.picked;
    if (selected && typeof selected.value === "string" && allowed.has(selected.value) && Number.isInteger(selected.from) && selected.from >= -1 && selected.from < n) {
      if ((selected.from === -1 && !values.includes(selected.value)) || (selected.from >= 0 && values[selected.from] === selected.value)) picked = { value: selected.value, from: selected.from };
    }
    render();
  });

  render();
}

