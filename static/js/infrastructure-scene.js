/* Progressive enhancement: no third-party libraries or network requests. */
(() => {
  const hero = document.querySelector('[data-scroll-scene]');
  const scene = document.querySelector('[data-infra-scene]');
  if (!hero || !scene) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(pointer: fine)');
  let frame = 0;
  let pointerX = 0;
  let pointerY = 0;

  function update() {
    frame = 0;
    if (reduced.matches) {
      scene.style.removeProperty('--scene-progress');
      scene.style.removeProperty('--scene-pointer-x');
      scene.style.removeProperty('--scene-pointer-y');
      return;
    }
    const rect = hero.getBoundingClientRect();
    const viewport = window.innerHeight || 1;
    const travel = Math.max(1, rect.height + viewport);
    const progress = Math.max(0, Math.min(1, (viewport - rect.top) / travel));
    scene.style.setProperty('--scene-progress', progress.toFixed(4));
    scene.style.setProperty('--scene-pointer-x', pointerX.toFixed(3));
    scene.style.setProperty('--scene-pointer-y', pointerY.toFixed(3));
  }
  function requestUpdate() {
    if (!frame) frame = window.requestAnimationFrame(update);
  }
  if (finePointer.matches) {
    hero.addEventListener('pointermove', (event) => {
      const rect = hero.getBoundingClientRect();
      pointerX = Math.max(-1, Math.min(1, (event.clientX - rect.left) / Math.max(1, rect.width) * 2 - 1));
      pointerY = Math.max(-1, Math.min(1, (event.clientY - rect.top) / Math.max(1, rect.height) * 2 - 1));
      requestUpdate();
    }, { passive: true });
    hero.addEventListener('pointerleave', () => {
      pointerX = 0;
      pointerY = 0;
      requestUpdate();
    });
  }
  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate, { passive: true });
  reduced.addEventListener('change', requestUpdate);
  requestUpdate();

  // Section entrance animation is handled by scroll-reveal.js on every page.
})();
