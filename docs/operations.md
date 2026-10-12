# Operations Runbook

## Publishing

1. Add or edit content under `content/`, or submit a layout/asset change.
2. Open a pull request to `main`.
3. Require CI, security scanning, and the visual browser audit to pass.
4. Review visual artifacts, including 320px and 390px mobile captures.
5. Merge and verify the `Deploy production` workflow. Its post-deployment step checks 13 selected routes, critical CSS/JavaScript/SVG assets, the WebP portrait signature, the exact Microsoft credential link in the deployed About HTML, and the Google Search Console verification file's status and bytes.
6. After a **successful** production workflow, GitHub Actions automatically triggers `Live production browser smoke` via `workflow_run`. Confirm the follow-up workflow completed successfully for the expected deployment; a successful Pages job alone is not the end of the release gate. Inspect its screenshot/JSON artifact when diagnosing changes. You can also run this workflow manually.
7. For performance-sensitive releases, compare `Production performance audit` results with an earlier run using the same method. This audit is not an automatic deployment gate and is not a field Core Web Vitals measurement.

Live site: https://edwinjdevops.github.io/engineering-platform/

## Reproduce the release build

```sh
hugo --minify --gc --baseURL /
python3 -m http.server 4173 --directory public
```

The pinned Hugo v0.164.0 container used in GitHub Actions is authoritative if local tooling versions differ. The visual, live-production browser, and synthetic performance workflows install Playwright separately.

## Failures

- **Build/link/HTML failures**: inspect the CI workflow's failing step; fix the source and re-run.
- **Accessibility**: repair the affected element or contrast. Never disable the rule just to merge.
- **Responsive regression**: reproduce the reported viewport using `scripts/visual_audit.cjs` and inspect the browser artifact.
- **WebGL unavailable or context lost**: users must see the static CSS layer diagram. Do not treat WebGL support as a prerequisite for the page.
- **Motion preference**: reduced-motion browsers must retain the static diagram with no active WebGL scene.
- **Deployment failure**: inspect the failed Pages action and affected route or asset. Revert if necessary.
- **Live browser smoke failure**: inspect the `live-production-browser-smoke` artifact, distinguish a site regression from runner/network behavior, and verify the deployed revision before changing source.
- **Performance regression**: use `Production performance audit` for repeated laboratory measurements; do not label them field Core Web Vitals.

## Rollback

Revert the problematic merge commit in a new PR, pass checks, and merge. The production workflow deploys the previous content. For an urgent incident, use GitHub's controlled revert flow and verify the deployed URLs.

## Search discoverability (not a deployment gate)

- The live Hugo sitemap is `https://edwinjdevops.github.io/engineering-platform/sitemap.xml`.
- On 2026-10-12, Google Search Console showed the submitted sitemap as **pending**, with zero reported errors or warnings. URL Inspection returned **URL is unknown to Google** for the homepage, DriftGuard case study and article index.
- These are indexing observations, **not** evidence that the site returned an HTTP error. Google may take time to crawl a new or changed site. Neither sitemap submission nor verification of an ownership token guarantees indexing or search rankings.
- Recheck URL Inspection and sitemap processing after Google has had time to crawl. Do not submit the same sitemap repeatedly or publish an unverified ranking claim.
- Search Console impression/click reports had no established settled-through date at the time of this check; zero recorded activity must not be treated as an analytically complete traffic baseline.

## Operational boundaries

This is a static site, not an always-on backend. GitHub Actions provides build/test/deploy evidence, but HTTP 200 probes do not establish uptime or cross-device correctness. Secrets are not required in client scripts.
