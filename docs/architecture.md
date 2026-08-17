# Architecture Decision Record

## Hugo + GitHub Pages + GitHub Actions

### Why Hugo?
- Single binary. No runtime dependencies.
- Fast builds (< 2s).
- Native GitHub Pages support.
- Mature ecosystem.

### Why GitHub Pages?
- Free hosting.
- Integrated with GitHub repository.
- Auto TLS/HTTPS.
- Sufficient CDN (Fastly).
- No vendor lock-in.

### Why GitHub Actions?
- Free CI/CD.
- Integrated with repository.
- Full control over pipeline.
- Native GitHub permissions model.

### Why NOT Kubernetes?
Static site. No container orchestration needed.

### Why NOT Terraform?
GitHub Pages infrastructure is minimal. Manual setup sufficient.

### Why NOT Databases?
All content is Markdown + Git. JSON files for metadata. No persistence layer needed.

## Quality Gates

- Frontmatter validation
- Markdown linting
- Hugo build success
- HTML validation
- Link checking
- Accessibility compliance
- GitHub Actions security audit

## Deployment

- PR preview: GitHub Actions artifact upload
- Production: GitHub Pages deployment environment
- Rollback: git revert + normal CI/CD pipeline
- Verification: HTTP 200 checks post-deploy
