let toastTimer;

export function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  t.classList.remove('crit');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show', 'crit'), 2400);
}

export function showCritToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show', 'crit');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { t.classList.remove('show', 'crit'); }, 2600);
}
