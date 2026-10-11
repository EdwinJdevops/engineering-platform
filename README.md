# Edwin Jonathan — Engineering Platform

A Hugo-based engineering publication, project case-study library, portfolio, and services site. Source code and claims are reviewable; project limitations are documented.

Production: https://edwinjdevops.github.io/engineering-platform/

## Architecture

- Hugo generates static HTML; GitHub Pages hosts production.
- GitHub Actions validates PRs and deploys merges to `main`.
- Article and project content lives in `content/`. Templates are in `layouts/`; CSS and scripts are in `static/`.
- The homepage uses a CSS 3D diagram by default. Desktop browsers with WebGL and no reduced-motion preference progressively enhance it using `static/js/infrastructure-webgl.js`.
- Native `details`/ `summary` navigation works without JavaScript on narrow screens.

## Local development

Requires Hugo v0.164.0 or compatible:

```sh
hugo server --baseURL http://localhost:1313/ --disableFastRender
```

Visit http://localhost:1313/. No `npm install` is required for site development. CI uses a pinned Hugo container, so the exact release build is reproducible.

## Build

```sh
hugo --minify --gc --baseURL /
```

The generated output is in `public/`. Do not commit generated HTML.

## Release

1. Open a PR targeting `main`.
2. Wait for CI, security scanning, and the visual browser audit to pass.
3. Review `browser-visual-audit` screenshots for small mobile, mobile, tablet, and desktop.
4. Merge; the GitHub Pages workflow builds and deploys.
5. Confirm the production workflow's seven route checks, critical asset responses and portrait sanity checks pass.
6. For live functional assurance, run the separate on-demand `Live production browser smoke` workflow against the deployed site and review its screenshots. It is not a mandatory gate on every deployment.

The visual audit includes scroll behavior, keyboard menu access, horizontal overflow, reduced-motion fallback, and frontend asset budgets. The separately triggered production browser smoke checks the deployed website's portrait, navigation, CSS/WebGL fallback, project interactions and contact link. The on-demand production performance audit records synthetic loading metrics. None of these establish complete real-device coverage or real-user Core Web Vitals.

## Safety and scope

No application database, cluster, tracking code, external WebGL package, or third-party fonts are needed. Content should not include credentials or unsupported operational claims.
