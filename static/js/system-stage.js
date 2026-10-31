/* Interactive infrastructure model. No network requests, libraries or continuously running animation. */
(() => {
  'use strict';
  const root = document.querySelector('[data-system-stage]');
  if (!root) return;
  const controls = [...root.querySelectorAll('[data-layer]')];
  const cases = [...root.querySelectorAll('[data-case]')];
  const allowed = new Set(['application', 'delivery', 'infrastructure']);
  const choose = name => {
    if (!allowed.has(name)) return;
    root.dataset.activeLayer = name;
    for (const control of controls) control.setAttribute('aria-pressed', String(control.dataset.layer === name));
    for (const panel of cases) panel.hidden = panel.dataset.case !== name;
  };
  for (const control of controls) control.addEventListener('click', () => choose(control.dataset.layer));
  choose('application');

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(pointer: fine)');
  const viewport = root.querySelector('.system-stage-viewport');
  if (!viewport) return;
  viewport.addEventListener('pointermove', event => {
    if (prefersReduced.matches || !finePointer.matches) return;
    const rect = viewport.getBoundingClientRect();
    viewport.style.setProperty('--tilt-y', (((event.clientX - rect.left) / Math.max(rect.width, 1)) - 0.5) * 10 + 'deg');
    viewport.style.setProperty('--tilt-x', (((event.clientY - rect.top) / Math.max(rect.height, 1)) - 0.5) * -7 + 'deg');
  }, { passive: true });
  const reset = () => {
    viewport.style.removeProperty('--tilt-y');
    viewport.style.removeProperty('--tilt-x');
  };
  viewport.addEventListener('pointerleave', reset);
  prefersReduced.addEventListener('change', reset);
})();
