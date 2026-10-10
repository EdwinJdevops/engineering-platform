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

GitHub Pages deployment checks the configured production routes for HTTP 200. Screenshots are artifacts for manual review; automated checks cannot prove that the design is perfect, the site has a specific availability SLA, or the layout works on every device.
