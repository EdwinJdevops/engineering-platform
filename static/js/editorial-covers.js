/* Resilient remote artwork: reveal only after successful image decoding. */
(() => {
  'use strict';
  for (const image of document.querySelectorAll('.editorial-cover img')) {
    const cover = image.closest('.editorial-cover');
    const ready = () => {
      if (image.naturalWidth <= 0) return;
      image.classList.add('is-ready');
      cover?.classList.add('has-loaded-image');
    };
    image.addEventListener('load', ready);
    image.addEventListener('error', () => {
      image.classList.remove('is-ready');
      cover?.classList.remove('has-loaded-image');
    });
    if (image.complete) ready();
  }
})();
