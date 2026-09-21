/**
 * Ziehen von Wortkarten und Formelzeichen in Lücken oder Ablagefelder.
 * Pointer Events statt HTML5-Drag-and-Drop, damit Maus, Stift und Touch auf
 * dem Tablet gleich funktionieren. Vorlage: setupCloze in
 * faecher/informatik/klasse-11/1-Kuenstliche-Intelligenz/was-ist-ki/ui/task0.mjs
 *
 * getLabel() liefert den gezogenen Begriff oder einen leeren Wert, wenn an
 * dieser Stelle nichts zu ziehen ist. onDrop bekommt das getroffene Ziel und
 * die Information, ob im Wortspeicher losgelassen wurde; so lässt sich ein
 * Begriff auch wieder entfernen. renderGhost darf die mitgezogene Karte selbst
 * befüllen, etwa mit einem tiefgestellten Index.
 */
export function enableTokenDrag(element, { getLabel, dropSelector, bankSelector, onDrop, renderGhost }) {
  element.addEventListener("pointerdown", (event) => {
    if (event.button !== 0) return;
    const label = getLabel();
    if (!label) return;
    const startX = event.clientX;
    const startY = event.clientY;
    let ghost = null;
    element.setPointerCapture(event.pointerId);
    const clearDropTargets = () => document.querySelectorAll(`${dropSelector}.is-drop-target`).forEach((slot) => slot.classList.remove("is-drop-target"));
    const move = (moveEvent) => {
      if (!ghost && Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY) < 6) return;
      if (!ghost) {
        ghost = document.createElement("span");
        ghost.className = "cloze-token cloze-drag-ghost";
        if (typeof renderGhost === "function") renderGhost(ghost, label);
        else ghost.textContent = label;
        document.body.append(ghost);
        element.classList.add("is-dragging");
      }
      ghost.style.left = `${moveEvent.clientX}px`;
      ghost.style.top = `${moveEvent.clientY}px`;
      clearDropTargets();
      document.elementFromPoint(moveEvent.clientX, moveEvent.clientY)?.closest(dropSelector)?.classList.add("is-drop-target");
    };
    const end = (endEvent) => {
      element.removeEventListener("pointermove", move);
      element.removeEventListener("pointerup", end);
      element.removeEventListener("pointercancel", end);
      if (!ghost) return; // kein Ziehen, der Klick-Handler übernimmt
      ghost.remove();
      clearDropTargets();
      element.classList.remove("is-dragging");
      element.dataset.dragged = "true";
      const drop = endEvent.type === "pointerup" ? document.elementFromPoint(endEvent.clientX, endEvent.clientY) : null;
      onDrop(drop?.closest(dropSelector) || null, Boolean(drop?.closest(bankSelector)));
    };
    element.addEventListener("pointermove", move);
    element.addEventListener("pointerup", end);
    element.addEventListener("pointercancel", end);
  });
}

/** Unterdrückt den Klick, den der Browser nach einem Ziehen noch auslöst. */
export function wasDragged(element) {
  if (element.dataset.dragged !== "true") return false;
  delete element.dataset.dragged;
  return true;
}
