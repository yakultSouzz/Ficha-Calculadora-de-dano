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

loadState();
ui.initApp();
