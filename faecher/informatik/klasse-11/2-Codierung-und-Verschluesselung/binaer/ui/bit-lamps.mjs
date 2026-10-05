// Lampenreihe: interaktiv in Reiter 2, schreibgeschützt in der ASCII-Animation (Reiter 4).
import { PLACE_VALUES, bitsToValue } from '../logic/binary.mjs';

function lampState(on) { return { digit: on ? '1' : '0', text: on ? 'an' : 'aus' }; }

function buildColumn(place, interactive) {
  const column = document.createElement('div');
  column.className = 'bit-lamp-col';
  const value = document.createElement('span');
  value.className = 'bit-lamp-value';
  value.textContent = String(place);
  value.setAttribute('aria-hidden', 'true');
  const lamp = document.createElement(interactive ? 'button' : 'span');
  if (interactive) { lamp.type = 'button'; lamp.setAttribute('aria-pressed', 'false'); }
  lamp.className = 'bit-lamp' + (interactive ? '' : ' is-static');
  lamp.dataset.value = String(place);
  lamp.innerHTML = '<span class="lamp-digit">0</span><span class="lamp-state">aus</span>';
  column.append(value, lamp);
  return column;
}

// Nutzt vorhandene Lampen im HTML oder baut die Reihe auf. Liefert getBits, setBits und setDimmed.
export function createLampRow(root, { interactive = false, onChange } = {}) {
  if (!root.querySelector('.bit-lamp')) root.append(...PLACE_VALUES.map((place) => buildColumn(place, interactive)));
  const lamps = [...root.querySelectorAll('.bit-lamp')];
  const readBits = () => lamps.map((lamp) => (lamp.dataset.on === 'true' ? '1' : '0')).join('');
  const render = (bits) => {
    lamps.forEach((lamp, index) => {
      const on = bits[index] === '1';
      const { digit, text } = lampState(on);
      lamp.dataset.on = String(on);
      lamp.classList.toggle('is-on', on);
      lamp.querySelector('.lamp-digit').textContent = digit;
      lamp.querySelector('.lamp-state').textContent = text;
      if (interactive) {
        lamp.setAttribute('aria-pressed', String(on));
        lamp.setAttribute('aria-label', 'Lampe mit dem Wert ' + lamp.dataset.value + ': ' + text);
      }
    });
  };
  const row = {
    getBits: readBits,
    setBits(bits) { render(bits); if (!interactive) root.setAttribute('aria-label', 'Bitfolge: ' + bits + ', Wert ' + bitsToValue(bits)); },
    setDimmed(dimmed, label = 'keine Bitfolge') {
      root.classList.toggle('is-dimmed', dimmed);
      if (dimmed) { render('00000000'); if (!interactive) root.setAttribute('aria-label', label); }
    },
  };
  if (interactive) {
    lamps.forEach((lamp) => lamp.addEventListener('click', () => {
      const index = lamps.indexOf(lamp);
      const bits = readBits().split('');
      bits[index] = bits[index] === '1' ? '0' : '1';
      render(bits.join(''));
      onChange?.(bits.join(''));
    }));
  } else {
    root.setAttribute('role', 'img');
  }
  render('00000000');
  return row;
}
