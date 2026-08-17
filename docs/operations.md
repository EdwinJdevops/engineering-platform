# Operations Runbook

## Publishing Article

1. Create PR with new `.md` file in `content/articles/`
2. All CI checks run automatically
3. Review feedback
4. Merge to `main`
5. GitHub Actions builds and deploys to production
6. Verify at https://edwindevops.github.io/engineering-platform/

## Rollback

```bash
git revert <bad-commit-sha>
git push origin main
```

CI/CD pipeline runs. Old version deployed.

## Broken Links

1. Check `ci.yml` → `check-links` job output
2. Fix URLs in source Markdown
3. Commit and push
4. Automatic deploy

## Dependency Updates

Dependabot creates PRs weekly. Review and merge.

## Custom Domain (Future)

1. Register domain
2. Update GitHub Pages settings
3. Update `hugo.toml` baseURL
4. Update Hashnode/DEV.to canonical links

No redeployment needed. Pure configuration.
