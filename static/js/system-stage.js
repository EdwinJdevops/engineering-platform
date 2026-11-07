/* Accessible infrastructure model: selection, keyboard navigation, and motion-safe depth. */
(() => {
  'use strict';
  const root = document.querySelector('[data-system-stage]');
  if (!root) return;
  const controls = [...root.querySelectorAll('.system-stage-controls [data-layer]')];
  const modelButtons = [...root.querySelectorAll('.system-stage-model [data-layer]')];
  const cases = [...root.querySelectorAll('[data-case]')];
  const layers = ['application', 'delivery', 'infrastructure'];
  const choose = name => {
    if (!layers.includes(name)) return;
    root.dataset.activeLayer = name;
    [...controls, ...modelButtons].forEach(control => control.setAttribute('aria-pressed', String(control.dataset.layer === name)));
    cases.forEach(panel => { panel.hidden = panel.dataset.case !== name; });
  };
  controls.forEach((control, index) => {
    control.addEventListener('click', () => choose(control.dataset.layer));
    control.addEventListener('keydown', event => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? controls.length - 1
        : (index + (event.key === 'ArrowRight' ? 1 : -1) + controls.length) % controls.length;
      controls[next].focus();
      choose(controls[next].dataset.layer);
    });
  });
  modelButtons.forEach(control => control.addEventListener('click', () => choose(control.dataset.layer)));
  choose('application');

  const viewport = root.querySelector('.system-stage-viewport');
  if (!viewport || !window.matchMedia) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(pointer: fine)');
  let frame = 0;
  let x = 0, y = 0;
  const reset = () => {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    viewport.style.removeProperty('--tilt-x');
    viewport.style.removeProperty('--tilt-y');
  };
  const update = () => {
    frame = 0;
    if (reduced.matches || !finePointer.matches) return reset();
    viewport.style.setProperty('--tilt-y', x.toFixed(2) + 'deg');
    viewport.style.setProperty('--tilt-x', y.toFixed(2) + 'deg');
  };
  viewport.addEventListener('pointermove', event => {
    if (reduced.matches || !finePointer.matches) return;
    const rect = viewport.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    x = ((event.clientX - rect.left) / rect.width - .5) * 10;
    y = ((event.clientY - rect.top) / rect.height - .5) * -7;
    if (!frame) frame = requestAnimationFrame(update);
  }, {passive:true});
  viewport.addEventListener('pointerleave', reset);
  reduced.addEventListener('change', reset);
  finePointer.addEventListener('change', reset);
  document.addEventListener('visibilitychange', () => { if (document.hidden) reset(); });
})();
