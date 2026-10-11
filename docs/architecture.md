# Architecture and visual-system decisions

## Static delivery

Hugo renders Markdown and templates into static HTML. GitHub Actions builds and validates changes; GitHub Pages serves the published artifact. This site does not require Kubernetes, Terraform, an application server, persistent storage, or a managed database.

## Rendering strategy

The site uses a warm editorial palette, system-font stack, semantic sections and links. Navigation is ordinary HTML on desktop and native `details` / `summary` on mobile so keyboard and no-JavaScript access remain functional.

The infrastructure diagram is progressive enhancement, not a business-critical dependency:

1. CSS creates three readable geometric layers on every supported viewport.
2. On sufficiently wide screens where motion is allowed, a small self-contained WebGL 1 script renders depth-tested 3D plates and components.
3. The WebGL drawing runs only on scroll, pointer, resize, and visibility changes. It uses a low-power context and caps pixel density.
4. Missing WebGL support, reduced-motion, a small viewport, or lost context leaves the CSS illustration available.

No Three.js, CDN asset, external font, persistent rendering loop, or remote telemetry is added.

## Release verification

The pull-request CI validates front matter, Markdown, Hugo output, internal links, HTML, and Pa11y accessibility for configured routes. Security checks run separately. A Playwright audit captures homepage and key interior routes at 320px, 390px, 768px and 1440px. It checks overflow, nav toggling with pointer and keyboard, the CSS fallback, scroll state, and size budgets for frontend CSS/JS.

GitHub Pages deployment requires HTTP 200 for seven production routes and four essential assets and performs a minimal portrait-file sanity check. The separately triggered `Live production browser smoke` workflow exercises the deployed site in Chromium on mobile and desktop profiles, recording screenshots and verifying key interactive controls, portrait decoding and CSS/WebGL fallback. It is manual or test-change-triggered, not a gate on every deployment. The independent `Production performance audit` records synthetic loading metrics but cannot establish real-user Core Web Vitals. Screenshots and browser results are evidence for tested conditions, not a design-perfect, cross-device, or availability-SLA guarantee.
