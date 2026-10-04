// Karten in nummerierte Felder ziehen oder antippen. Portierung der Lückentext-Logik (setupCloze) aus
// was-ist-ki/ui/task0.mjs: Pointer Events für Maus, Stift und Touch, Geisterkarte, antippen–antippen,
// Tausch zwischen Feldern und Zurücklegen in den Kartenspeicher. Ein Feld nimmt genau eine Karte.
//
// setupCardSlots(container, { cards:[{id,text}], slots:[{id,label}], choices, onChange })
//   choices: Array mit einem Eintrag je Feld (Karten-ID oder ''); wird direkt verändert und mitgegeben.
export function setupCardSlots(container, { cards, slots, choices, onChange = () => {} }) {
  // Ausgewählte Karte für Tipp- und Tastaturbedienung: { id, from } mit from = Feldindex oder -1 (Speicher)
  let picked = null;
  const cardText = (id) => cards.find((card) => card.id === id)?.text || '';

  function place(id, from, slotIndex) {
    if (from >= 0) choices[from] = '';
    if (slotIndex >= 0) {
      const previous = choices[slotIndex];
      choices[slotIndex] = id;
      if (from >= 0 && previous) choices[from] = previous; // Tausch zwischen zwei Feldern
    }
    picked = null;
    onChange(choices);
    render();
  }

  function enableDrag(element, id, from) {
    element.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return;
      const startX = event.clientX;
      const startY = event.clientY;
      let ghost = null;
      element.setPointerCapture(event.pointerId);
      const move = (moveEvent) => {
        if (!ghost && Math.hypot(moveEvent.clientX - startX, moveEvent.clientY - startY) < 6) return;
        if (!ghost) {
          ghost = document.createElement('span');
          ghost.className = 'knn-card knn-drag-ghost';
          ghost.textContent = cardText(id);
          document.body.append(ghost);
          element.classList.add('is-dragging');
        }
        ghost.style.left = moveEvent.clientX + 'px';
        ghost.style.top = moveEvent.clientY + 'px';
        container.querySelectorAll('.knn-slot').forEach((slot) => slot.classList.remove('is-drop-target'));
        const over = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY)?.closest('.knn-slot');
        if (over && container.contains(over)) over.classList.add('is-drop-target');
      };
      const end = (endEvent) => {
        element.removeEventListener('pointermove', move);
        element.removeEventListener('pointerup', end);
        element.removeEventListener('pointercancel', end);
        if (!ghost) return; // kein Ziehen, der Klick-Handler übernimmt
        ghost.remove();
        element.dataset.dragged = 'true';
        const drop = endEvent.type === 'pointerup' ? document.elementFromPoint(endEvent.clientX, endEvent.clientY) : null;
        const slot = drop?.closest('.knn-slot');
        const bank = drop?.closest('.knn-bank');
        if (slot && container.contains(slot)) place(id, from, Number(slot.dataset.index));
        else if (from >= 0 && bank && container.contains(bank)) place(id, from, -1);
        else render();
      };
      element.addEventListener('pointermove', move);
      element.addEventListener('pointerup', end);
      element.addEventListener('pointercancel', end);
    });
  }

  function wasDragged(element) {
    if (element.dataset.dragged !== 'true') return false;
    delete element.dataset.dragged;
    return true;
  }

  function render() {
    container.replaceChildren();
    const bank = document.createElement('div');
    bank.className = 'knn-bank';
    bank.setAttribute('role', 'group');
    bank.setAttribute('aria-label', 'Kartenspeicher');
    cards.filter((card) => !choices.includes(card.id)).forEach((card) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'knn-card';
      button.textContent = card.text;
      const isPicked = picked?.id === card.id;
      button.setAttribute('aria-pressed', String(isPicked));
      button.classList.toggle('is-picked', isPicked);
      enableDrag(button, card.id, -1);
      button.addEventListener('click', () => {
        if (wasDragged(button)) return;
        picked = isPicked ? null : { id: card.id, from: -1 };
        render();
        if (picked) (container.querySelector('.knn-slot:not(.is-filled)') || container.querySelector('.knn-slot'))?.focus();
      });
      bank.append(button);
    });

    const list = document.createElement('div');
    list.className = 'knn-slots';
    slots.forEach((slot, index) => {
      const id = choices[index];
      const field = document.createElement('button');
      field.type = 'button';
      field.className = 'knn-slot';
      field.dataset.index = String(index);
      field.classList.toggle('is-filled', Boolean(id));
      field.classList.toggle('is-picked', picked?.from === index);
      field.setAttribute('aria-label', slot.label + (id ? ': ' + cardText(id) : ': leer'));
      const name = document.createElement('span');
      name.className = 'knn-slot-label';
      name.textContent = slot.label;
      const content = document.createElement('span');
      content.className = 'knn-slot-text';
      content.textContent = id ? cardText(id) : '';
      field.append(name, content);
      if (id) enableDrag(field, id, index);
      field.addEventListener('click', () => {
        if (wasDragged(field)) return;
        if (picked && picked.from !== index) { place(picked.id, picked.from, index); container.querySelector('[data-index="' + index + '"]')?.focus(); return; }
        if (picked && picked.from === index) { place(id, index, -1); return; } // zweimal antippen legt die Karte zurück
        if (id) { picked = { id, from: index }; render(); container.querySelector('[data-index="' + index + '"]')?.focus(); }
      });
      list.append(field);
    });
    container.append(bank, list);
  }

  render();
  return {
    render,
    reset() { choices.fill(''); picked = null; onChange(choices); render(); },
  };
}
