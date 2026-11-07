# ADR 001: Engineering Platform reconstruction boundary

Status: Proposed
Date: 2026-11-07
Branch: `feat/engineering-platform-rearchitecture`

## Context and verified baseline

The existing site is a Hugo publication hosted on GitHub Pages. The repository README documents source content in `content/`, templates in `layouts/`, and frontend assets in `static/`. The homepage already includes an interactive infrastructure stage and source-linked engineering evidence. The CI workflow verifies specific rendered content and uses a pinned Hugo container. The latest main commit observed during this review was `9feb350aa46da407eaaa5ca39c8590b7d9d7de62` (PR #89).

This ADR does not claim that current production smoke, Core Web Vitals, image licensing, article coverage, or external profile content have been independently verified.

## Decision

Keep Hugo and GitHub Pages during the first reconstruction phase. Preserve existing engineering evidence and production checks. Introduce a deliberate, documented visual system and progressive enhancement instead of migrating frameworks solely to access an animation library.

Use GSAP only for motion with a clear user-experience purpose. Preserve semantic HTML and a complete no-JavaScript / reduced-motion experience. Use React Bits as a reference library rather than adding React by default. Use Figma Context MCP only if there is a maintained Figma design source. Use HyperFrames only for authored video assets, not interactive site rendering. Use Impeccable and UI UX Pro Max as review and design aids, not as runtime dependencies.

Do not add a production database without a feature requiring durable server-side state, an ownership model, and a hosting/operational plan. Static articles and case studies remain version-controlled.

## Deliverables and release gates

1. Inventory every article, project, image, outbound link, and source claim. Record coverage and evidence, including licensing and attribution.
2. Define a versioned design system: typography, layout grid, color tokens, component states, responsive breakpoints, image treatment, and motion principles.
3. Reconstruct the homepage while retaining accessible navigation, useful engineering evidence, and a meaningful infrastructure visualization.
4. Give each published article an intentional hero image with correct dimensions, alt text, source rights, and fallback; avoid a generic repeated template image.
5. Publish inspectable case studies containing problem, constraints, architecture, implementation, tests, evidence, limitations, and reproducibility instructions.
6. Test generated HTML, navigation, keyboard access, reduced-motion, narrow screens, browser behavior, first-party assets, and external links.
7. Compare performance to the existing documented baseline; report measured results without inventing scores.
8. Deploy only after PR review and passing required checks; independently verify live production smoke.

## Risks and explicit non-goals

- Motion and WebGL can cause poor mobile performance, motion discomfort, and failures on low-end GPUs. All enhanced content needs a static fallback.
- A database adds operational, security, and cost obligations and is not proof of senior engineering.
- External profile imports may be incomplete, stale, or subject to content rights. Do not fabricate or silently republish.
- Avoid unverified client claims, fake metrics, generic animated component galleries, and unnecessary dependencies.
- No claims of a finished redesign or production deployment are made by this ADR.

## Next implementation gate

Inspect actual CSS/JS/template asset paths and enumerate article front matter and images before writing design-changing code. Keep each subsequent change reviewable, with screenshots and automated checks attached to its pull request.
