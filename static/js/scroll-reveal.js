/* Optional scroll motion: editorial content remains readable without JavaScript. */
(() => {
  'use strict';
  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const selectors = [
    'main [data-reveal]',
    'main .section-block:not([data-reveal])',
    'main .practice-strip',
    'main .featured-project',
    'main .expertise-list details',
    'main .project-row',
    'main .service-grid article',
    'main .profile-groups > div',
    'main .page-head',
    'main .case-hero',
    'main .services-intro',
    'main .contact-intro',
    'main .profile-intro',
    'main .prose-body > h2',
    'main .prose-body > h3',
    'main .prose-body > p',
    'main .prose-body > ul',
    'main .prose-body > ol',
    'main .prose-body > pre',
    'main .prose-body > blockquote',
    'main .prose-body > figure'
  ];
  const elements = [...new Set(document.querySelectorAll(selectors.join(',')))];
  if (!elements.length) return;

  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      entry.target.classList.toggle('is-visible', entry.isIntersecting);
    }
  }, { threshold: 0 });

  // Elements already in view remain visible on initialization, avoiding an initial flash.
  const height = window.innerHeight || document.documentElement.clientHeight;
  for (const element of elements) {
    const rect = element.getBoundingClientRect();
    if (rect.bottom > 0 && rect.top < height) element.classList.add('is-visible');
    element.classList.add('scroll-reveal-pending');
    observer.observe(element);
  }
  document.documentElement.classList.add('scroll-reveal-active');
})();
