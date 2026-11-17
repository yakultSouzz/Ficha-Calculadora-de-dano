import './style.css';
import { loadState } from './state.js';
import * as ui from './ui.js';
import * as numpad from './numpad.js';
import * as history from './history.js';
import * as toast from './toast.js';

window.onerror = function (msg, src, line, col) {
  try { alert('Erro: ' + msg + ' (' + line + ':' + col + ')'); } catch (e) {}
};

Object.assign(window, ui, numpad, history, toast);

let lastNumericInput = null;
let lastNumericOpen = 0;

function numericInputFrom(target) {
  const el = target && target.closest ? target.closest('input[type="number"]') : null;
  if (!el || el.classList.contains('num-field') || el.disabled) return null;
  return el;
}

function numericInputOpenedRecently(el) {
  return el === lastNumericInput && Date.now() - lastNumericOpen < 400;
}

function openNumericNumpad(el) {
  el.setAttribute('inputmode', 'none');
  el.readOnly = true;
  el.blur();

  const minRaw = el.getAttribute('min');
  const maxRaw = el.getAttribute('max');
  const min = minRaw !== null && Number.isFinite(parseFloat(minRaw)) ? parseFloat(minRaw) : 0;
  const max = maxRaw !== null && Number.isFinite(parseFloat(maxRaw)) ? parseFloat(maxRaw) : 999;
  const label = el.name || el.id || el.getAttribute('placeholder') || 'Editar valor';

  lastNumericInput = el;
  lastNumericOpen = Date.now();

  numpad.openNumpadDirect({
    target: null,
    mode: 'number',
    label,
    value: el.value,
    min,
    max,
    onConfirm: (n) => {
      el.value = String(n);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });
}

document.addEventListener('pointerdown', (e) => {
  const el = numericInputFrom(e.target);
  if (!el) return;
  if (e.cancelable) e.preventDefault();
  openNumericNumpad(el);
}, true);

document.addEventListener('click', (e) => {
  const el = numericInputFrom(e.target);
  if (!el || numericInputOpenedRecently(el)) return;
  e.preventDefault();
  openNumericNumpad(el);
}, true);

document.addEventListener('focusin', (e) => {
  const el = e.target && e.target.tagName === 'INPUT' ? e.target : null;
  if (!numericInputFrom(el)) return;
  if (e.cancelable) e.preventDefault();
  el.blur();
  if (numericInputOpenedRecently(el)) return;
  openNumericNumpad(el);
}, true);

loadState();
ui.initApp();
