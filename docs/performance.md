# Production performance measurements

## Purpose

The release browser audit checks responsiveness, motion, accessibility-related behavior, and asset budgets. It does not measure production loading performance. Run the separate **Production performance audit** workflow to collect a reproducible *synthetic* browser baseline without deploying or modifying the site.

## Run

1. Open GitHub Actions > Production performance audit > Run workflow on `main`, after this workflow is merged.
2. Inspect the job summary and download the `production-performance-audit` artifact containing full per-sample JSON and a Markdown summary.
3. Compare mobile and desktop runs using the **same** site URL, browser profile and measurement method. Prefer repeated observations over individual runs.
4. Investigate the biggest measured bottleneck before changing production CSS, JS, or images. Validate improvements in a PR; rerun the measurement after deployment to compare like with like.

The workflow also runs on PRs changing this audit's script, workflow, or documentation. Those PR runs measure the *currently deployed site*, not the PR's unmerged code.

## Method and limitations

- Playwright 1.56.1 launches Chromium against the deployed GitHub Pages URL.
- Mobile uses a 390 × 844 viewport and device scale factor 2 for the homepage, services, projects and articles. Desktop uses a 1440 × 900 viewport for the homepage and About page, plus a reduced-motion homepage profile.
- Each scenario uses three fresh browser contexts, 80 ms network latency, 200000 bytes/sec download, 100000 bytes/sec upload, and 4× CPU throttling. These settings are a **synthetic profile**, not measurements of Nigerian mobile networks or a named physical device.
- The script records TTFB, FCP, LCP, initial-observation CLS, long-task blocking, request counts, resource transfer bytes, and the reported render mode. A 2.5-second post-load observation window means later page interactions and shifts are excluded.
- Desktop reduced-motion and normal-motion results can reveal a difference worth investigating, but do **not** attribute a difference solely to WebGL: other animations change too, and software rendering on CI runners may prevent WebGL activation.
- This is not a Lighthouse score and does not provide field Core Web Vitals. In particular, INP requires representative real-user interactions and cannot be claimed from these load-only tests. For field data, consult Chrome UX Report / Search Console when sufficient real-user data exists.
- No performance threshold is applied until the first baseline is reviewed. Network failures and non-200 primary document responses fail the audit.

This is intentionally an on-demand workflow rather than continuous polling or new production telemetry. The site remains static and tracking-free.

## Release-readiness interpretation

The expanded audit covers the routes most relevant to an international recruiter and prospective engineering customer. Each route receives three fresh-context synthetic samples. A passing workflow confirms the collection completed, **not** that its timings meet Core Web Vitals thresholds or that all third-party article images are reliably available. Record the median and individual samples from the workflow artifact before approving any performance claim.

Do not label the site as "performance certified", "perfect", or "100/100" unless a defined, reproducible measurement supports the exact claim. Actual portrait replacement and real-user performance remain dependent on independently provided media and traffic data.
