# Operations Runbook

## Publishing

1. Add or edit content under `content/`, or submit a layout/asset change.
2. Open a pull request to `main`.
3. Require CI, security scanning, and the visual browser audit to pass.
4. Review visual artifacts, including 320px and 390px mobile captures.
5. Merge and verify the `Deploy production` workflow and route probes.

Live site: https://edwinjdevops.github.io/engineering-platform/

## Reproduce the release build

```sh
hugo --minify --gc --baseURL /
python3 -m http.server 4173 --directory public
```

The pinned Hugo v0.164.0 container used in GitHub Actions is authoritative if local tooling versions differ. The visual workflow installs Playwright separately.

## Failures

- **Build/link/HTML failures**: inspect the CI workflow's failing step; fix the source and re-run.
- **Accessibility**: repair the affected element or contrast. Never disable the rule just to merge.
- **Responsive regression**: reproduce the reported viewport using `scripts/visual_audit.cjs` and inspect the browser artifact.
- **WebGL unavailable or context lost**: users must see the static CSS layer diagram. Do not treat WebGL support as a prerequisite for the page.
- **Motion preference**: reduced-motion browsers must retain the static diagram with no active WebGL scene.
- **Deployment failure**: inspect the failed Pages action and affected route. Revert if necessary.

## Rollback

Revert the problematic merge commit in a new PR, pass checks, and merge. The production workflow deploys the previous content. For an urgent incident, use GitHub's controlled revert flow and verify the deployed URLs.

## Operational boundaries

This is a static site, not an always-on backend. GitHub Actions provides build/test/deploy evidence, but HTTP 200 probes do not establish uptime or cross-device correctness. Secrets are not required in client scripts.
