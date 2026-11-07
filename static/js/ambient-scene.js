/* Pointer-responsive ambient light, limited to the homepage. No dependency or network request. */
(() => {
  'use strict';
  const root = document.querySelector('.home-intro');
  if (!root || !window.matchMedia || !window.matchMedia('(pointer: fine)').matches) return;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let frame = 0;
  let nextX = 72, nextY = 42;
  const reset = () => {
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    root.style.removeProperty('--ambient-x');
    root.style.removeProperty('--ambient-y');
    root.style.removeProperty('--scene-shift');
  };
  const render = () => {
    frame = 0;
    if (motion.matches) return reset();
    root.style.setProperty('--ambient-x', nextX.toFixed(1) + '%');
    root.style.setProperty('--ambient-y', nextY.toFixed(1) + '%');
    root.style.setProperty('--scene-shift', ((nextY - 50) * .12).toFixed(1) + 'px');
  };
  root.addEventListener('pointermove', event => {
    if (motion.matches) return;
    const rect = root.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    nextX = Math.max(0, Math.min(100, 100 * (event.clientX - rect.left) / rect.width));
    nextY = Math.max(0, Math.min(100, 100 * (event.clientY - rect.top) / rect.height));
    if (!frame) frame = requestAnimationFrame(render);
  }, {passive:true});
  root.addEventListener('pointerleave', reset);
  motion.addEventListener('change', reset);
  document.addEventListener('visibilitychange', () => { if (document.hidden) reset(); });
})();
