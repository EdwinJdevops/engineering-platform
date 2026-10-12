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
- Mobile uses a 390 × 844 viewport and device scale factor 2 for the homepage, services, projects, articles, About and contact pages. Desktop uses a 1440 × 900 viewport for the homepage and About page, plus a reduced-motion homepage profile.
- Each scenario uses three fresh browser contexts, 80 ms network latency, 200000 bytes/sec download, 100000 bytes/sec upload, and 4× CPU throttling. These settings are a **synthetic profile**, not measurements of Nigerian mobile networks or a named physical device.
- The script records TTFB, FCP, LCP, initial-observation CLS, long-task blocking, request counts, resource transfer bytes, and the reported render mode. A 2.5-second post-load observation window means later page interactions and shifts are excluded.
- Desktop reduced-motion and normal-motion results can reveal a difference worth investigating, but do **not** attribute a difference solely to WebGL: other animations change too, and software rendering on CI runners may prevent WebGL activation.
- This is not a Lighthouse score and does not provide field Core Web Vitals. In particular, INP requires representative real-user interactions and cannot be claimed from these load-only tests. For field data, consult Chrome UX Report / Search Console when sufficient real-user data exists.
- No performance threshold is applied until the first baseline is reviewed. Network failures and non-200 primary document responses fail the audit.

This is intentionally an on-demand workflow rather than continuous polling or new production telemetry. The site remains static and tracking-free.

## Release-readiness interpretation

The expanded audit covers the routes most relevant to an international recruiter and prospective engineering customer. Each route receives three fresh-context synthetic samples. A passing workflow confirms the collection completed, **not** that its timings meet Core Web Vitals thresholds or that all third-party article images are reliably available. Record the median and individual samples from the workflow artifact before approving any performance claim.

Do not label the site as "performance certified", "perfect", or "100/100" unless a defined, reproducible measurement supports the exact claim. Actual portrait replacement and real-user performance remain dependent on independently provided media and traffic data.

## First inspected baseline: 2026-10-12

The source artifact is [GitHub Actions run #38254467740](https://github.com/EdwinJdevops/engineering-platform/actions/runs/38254467740), which executed on a performance-audit pull request and measured the **then-deployed** site. These are medians of three independent synthetic samples with the methodology above. The artifact includes individual samples and should be preserved as the point of comparison.

| Profile | Median LCP | Median FCP | Initial CLS | Reported render mode |
| --- | ---: | ---: | ---: | --- |
| Mobile homepage | 580 ms | 580 ms | 0 | CSS fallback |
| Mobile services | 400 ms | 400 ms | 0 | Not applicable |
| Mobile projects | 404 ms | 404 ms | 0 | Not applicable |
| Mobile articles | 1,112 ms | 424 ms | 0 | Not applicable |
| Desktop homepage | 652 ms | 652 ms | 0 | WebGL |
| Desktop About | 448 ms | 448 ms | 0 | Not applicable |
| Desktop homepage (reduced motion) | 580 ms | 580 ms | 0 | CSS fallback |

**Interpretation:** The observed LCP and initial CLS values do not, on their own, justify introducing more client-side JavaScript or changing deployment infrastructure. The sample is small, runner-dependent and not a statistically representative experience of real visitors.

**Next comparison:** A subsequent revision of this audit adds mobile About and mobile contact profiles. Earlier samples did not include those routes, so do not invent their baseline or compare them to desktop About. Re-run the same audit after meaningful media, CSS or JavaScript changes. Collect Search Console / CrUX field data when sufficient traffic exists, especially INP and the 75th-percentile distribution.

## Expanded recruiter-journey baseline — 12 October 2026

The [nine-profile Chromium audit #38259772324](https://github.com/EdwinJdevops/engineering-platform/actions/runs/38259772324) completed successfully and uploaded its per-sample measurements. It ran on the audit PR and measured the **already-deployed website**, not unmerged PR content.

| Synthetic profile | Median LCP (ms) | Median FCP (ms) | Initial CLS | Median TTFB (ms) | Reported mode |
| --- | ---: | ---: | ---: | ---: | --- |
| Mobile homepage | 564 | 564 | 0 | 101.5 | CSS fallback |
| Mobile services | 408 | 408 | 0 | 112.4 | Not applicable |
| Mobile projects | 388 | 388 | 0 | 90.3 | Not applicable |
| Mobile articles | 1,064 | 412 | 0 | 95.7 | Not applicable |
| Mobile About | 424 | 424 | 0 | 106.7 | Not applicable |
| Mobile contact | 360 | 360 | 0 | 95.9 | Not applicable |
| Desktop homepage | 576 | 576 | 0 | 11.2 | WebGL |
| Desktop About | 424 | 424 | 0 | 86 | Not applicable |
| Desktop homepage, reduced motion | 544 | 544 | 0 | 10.3 | CSS fallback |

Each row is the median of three separate browser samples under the documented synthetic conditions. The reported zero CLS applies **only to the initial observation window**. Cross-origin resource timing can undercount transfer bytes. No 75th-percentile field-data claim, INP claim, global guarantee or Lighthouse score follows from this table.

**Field-data status:** No valid URL-level CrUX/Core Web Vitals report could be retrieved with the available access on this date. The connected Search Console property returned zero recorded clicks/impressions for the last 28 days with no confirmed completeness boundary; those are search visibility metrics, not field speed measurements. Do not interpret either fact as a passing or failing field Core Web Vitals assessment. Check PageSpeed Insights / Chrome UX Report when enough qualifying real-user data becomes available. Avoid introducing site instrumentation merely to produce a score.

**Engineering decision:** No new framework, instrumentation SDK or WebGL rewrite is justified by these observations. Retest the mobile article index if imagery or CSS changes, since it had the highest LCP of the mobile routes in this particular sample.
