/* Resilient remote artwork: reveal only after successful image decoding. */
(() => {
  'use strict';
  for (const image of document.querySelectorAll('.editorial-cover img')) {
    const ready = () => {
      if (image.naturalWidth > 0) image.classList.add('is-ready');
    };
    image.addEventListener('load', ready, { once: true });
    // Failed images leave the source-labelled typographic cover visible.
    image.addEventListener('error', () => image.classList.remove('is-ready'), { once: true });
    if (image.complete) ready();
  }
})();
