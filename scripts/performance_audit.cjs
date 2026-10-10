/* Synthetic production measurements only; never present these as field Core Web Vitals. */
'use strict';
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');

const BASE = process.env.PERFORMANCE_AUDIT_URL || 'https://edwinjdevops.github.io/engineering-platform/';
const ORIGIN = new URL(BASE);
const REPORT_DIR = path.resolve('performance-audit');
const ROUNDS = 3;
const PROFILES = [
  { name: 'mobile-home', pathname: '', viewport: { width: 390, height: 844 }, isMobile: true, reducedMotion: 'no-preference' },
  { name: 'mobile-services', pathname: 'services/', viewport: { width: 390, height: 844 }, isMobile: true, reducedMotion: 'no-preference' },
  { name: 'desktop-home', pathname: '', viewport: { width: 1440, height: 900 }, isMobile: false, reducedMotion: 'no-preference' },
  { name: 'desktop-reduced-motion-home', pathname: '', viewport: { width: 1440, height: 900 }, isMobile: false, reducedMotion: 'reduce' }
];

function median(numbers) {
  const values = numbers.filter(Number.isFinite).sort((a, b) => a - b);
  if (!values.length) return null;
  const middle = Math.floor(values.length / 2);
  return values.length % 2 ? values[middle] : (values[middle - 1] + values[middle]) / 2;
}
function finite(value) { return typeof value === 'number' && Number.isFinite(value) ? Math.round(value * 100) / 100 : null; }

async function sample(browser, profile) {
  const context = await browser.newContext({
    viewport: profile.viewport,
    isMobile: profile.isMobile,
    hasTouch: profile.isMobile,
    deviceScaleFactor: profile.isMobile ? 2 : 1,
    reducedMotion: profile.reducedMotion,
    serviceWorkers: 'block'
  });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('requestfailed', request => errors.push('Request failed: ' + request.url() + ' (' + (request.failure()?.errorText || 'unknown') + ')'));
  const session = await context.newCDPSession(page);
  await session.send('Network.enable');
  // Reproducible lab conditions; these are not a claim about a physical phone or user's network.
  await session.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 80,
    downloadThroughput: 200000,
    uploadThroughput: 100000
  });
  await session.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.addInitScript(() => {
    window.__audit = { lcp: null, lcpElement: null, lcpResource: null, shifts: [], longTasks: [] };
    try {
      new PerformanceObserver(list => {
        for (const entry of list.getEntries()) {
          window.__audit.lcp = entry.startTime;
          const element = entry.element;
          window.__audit.lcpElement = element ? { tag: element.tagName.toLowerCase(), id: element.id || null, className: typeof element.className === 'string' ? element.className.slice(0, 120) : null } : null;
          window.__audit.lcpResource = entry.url || null;
        }
      }).observe({ type: 'largest-contentful-paint', buffered: true });
    } catch (_error) { /* Metric unsupported: report null. */ }
    try {
      new PerformanceObserver(list => {
        for (const entry of list.getEntries()) if (!entry.hadRecentInput) {
          window.__audit.shifts.push({ t: entry.startTime, value: entry.value });
        }
      }).observe({ type: 'layout-shift', buffered: true });
    } catch (_error) { /* Metric unsupported: report null. */ }
    try {
      new PerformanceObserver(list => {
        for (const entry of list.getEntries()) window.__audit.longTasks.push({ start: entry.startTime, duration: entry.duration });
      }).observe({ type: 'longtask', buffered: true });
    } catch (_error) { /* Metric unsupported: report null. */ }
  });

  const url = new URL(profile.pathname, ORIGIN).href;
  try {
    const response = await page.goto(url, { waitUntil: 'load', timeout: 45000 });
    if (!response || response.status() !== 200) throw new Error(url + ' returned ' + (response?.status() ?? 'no response'));
    await page.waitForTimeout(2500);
    const measurements = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0];
      const fcp = performance.getEntriesByName('first-contentful-paint')[0];
      const resources = performance.getEntriesByType('resource');
      const shifts = window.__audit.shifts;
      let sessionStart = 0, lastShift = 0, sessionValue = 0, cls = 0;
      for (const shift of shifts) {
        if (!sessionStart || shift.t - lastShift > 1000 || shift.t - sessionStart > 5000) {
          sessionStart = shift.t;
          sessionValue = 0;
        }
        sessionValue += shift.value;
        lastShift = shift.t;
        cls = Math.max(cls, sessionValue);
      }
      const longTasks = window.__audit.longTasks;
      const end = fcp?.startTime ?? 0;
      const tbt = longTasks.reduce((sum, task) => sum + (task.start >= end ? Math.max(0, task.duration - 50) : 0), 0);
      return {
        ttfbMs: nav?.responseStart ?? null,
        domContentLoadedMs: nav?.domContentLoadedEventEnd ?? null,
        loadMs: nav?.loadEventEnd ?? null,
        fcpMs: fcp?.startTime ?? null,
        lcpMs: window.__audit.lcp,
        lcpElement: window.__audit.lcpElement,
        lcpResource: window.__audit.lcpResource,
        cls,
        longTaskBlockingMs: tbt,
        resourceCount: resources.length,
        transferBytes: resources.reduce((sum, resource) => sum + (resource.transferSize || 0), nav?.transferSize || 0),
        renderMode: document.querySelector('[data-infra-scene]') ? (document.querySelector('[data-infra-scene]').dataset.renderMode || 'css-fallback') : 'not-applicable',
        portraitLoaded: document.querySelector('.home-portrait img') ? document.querySelector('.home-portrait img').naturalWidth > 0 : null
      };
    });
    return { status: 'ok', url, errors, ...Object.fromEntries(Object.entries(measurements).map(([key, value]) => [key, typeof value === 'number' ? finite(value) : value])) };
  } finally {
    await context.close();
  }
}

(async () => {
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const results = [];
  const failures = [];
  try {
    for (const profile of PROFILES) {
      const samples = [];
      for (let i = 0; i < ROUNDS; i++) {
        try { samples.push(await sample(browser, profile)); }
        catch (error) { failures.push(profile.name + ' sample ' + (i + 1) + ': ' + error.message); }
      }
      results.push({ profile: profile.name, viewport: profile.viewport, reducedMotion: profile.reducedMotion, samples });
    }
  } finally {
    await browser.close();
  }

  const metricKeys = ['ttfbMs', 'fcpMs', 'lcpMs', 'cls', 'loadMs', 'longTaskBlockingMs', 'resourceCount', 'transferBytes'];
  const summary = results.map(group => ({
    profile: group.profile,
    successfulSamples: group.samples.length,
    renderModes: [...new Set(group.samples.map(item => item.renderMode))],
    ...Object.fromEntries(metricKeys.map(key => [key, finite(median(group.samples.map(item => item[key])))]))
  }));
  const payload = {
    measuredAt: new Date().toISOString(),
    baseUrl: ORIGIN.href,
    methodology: 'Chromium / Playwright 1.56.1 synthetic lab; 80ms RTT, 200000 B/s down, 100000 B/s up, 4x CPU slowdown; fresh browser context each sample; 2500ms post-load observation; median of three; does not measure field Core Web Vitals or INP',
    caveats: ['Runner hardware and network location affect timings', 'CLS covers only initial load and observation window', 'Long-task blocking is a diagnostic approximation, not Lighthouse TBT', 'transferBytes from Resource Timing may exclude cross-origin resources', 'Different reduced-motion behavior is not a controlled WebGL-only experiment'],
    summary, results, failures
  };
  fs.writeFileSync(path.join(REPORT_DIR, 'results.json'), JSON.stringify(payload, null, 2) + '\n');
  const lines = [
    '# Synthetic production performance baseline', '',
    'Target: ' + ORIGIN.href, '',
    'All timings are laboratory observations, not real-user Core Web Vitals. INP is not measured.', '',
    '| Profile | LCP ms | FCP ms | CLS | TTFB ms | Transfer bytes | Render mode |',
    '| --- | ---: | ---: | ---: | ---: | ---: | --- |',
    ...summary.map(item => '| ' + item.profile + ' | ' + (item.lcpMs ?? 'n/a') + ' | ' + (item.fcpMs ?? 'n/a') + ' | ' + (item.cls ?? 'n/a') + ' | ' + (item.ttfbMs ?? 'n/a') + ' | ' + (item.transferBytes ?? 'n/a') + ' | ' + item.renderModes.join(', ') + ' |'),
    '', 'Methodology: ' + payload.methodology, '',
    ...(failures.length ? ['Failures:', ...failures.map(error => '- ' + error)] : [])
  ];
  fs.writeFileSync(path.join(REPORT_DIR, 'summary.md'), lines.join('\n') + '\n');
  console.log(lines.join('\n'));
  if (failures.length) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
