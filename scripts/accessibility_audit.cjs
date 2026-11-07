"use strict";
const { chromium } = require("playwright");
const axe = require("axe-core");

const routes = [
  "/", "/portfolio/", "/projects/", "/services/", "/engineering/", "/contact/",
  "/projects/driftguard/", "/projects/archnet/", "/projects/sentinel/", "/articles/", "/about/"
];

(async () => {
  const browser = await chromium.launch({ headless: true });
  let failed = false;
  let incompleteCount = 0;
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
    for (const route of routes) {
      const response = await page.goto("http://127.0.0.1:4173" + route, { waitUntil: "networkidle" });
      if (!response || response.status() !== 200) {
        console.error("Accessibility: " + route + " returned " + (response && response.status()));
        failed = true;
        continue;
      }
      await page.evaluate(axe.source);
      const results = await page.evaluate(() => window.axe.run(document, {
        runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] }
      }));
      const count = results.violations.reduce((n, v) => n + v.nodes.length, 0);
      const uncertain = results.incomplete.reduce((n, v) => n + v.nodes.length, 0);
      incompleteCount += uncertain;
      console.log("Accessibility " + route + ": " + count + " violations, " + uncertain + " inconclusive nodes");
      for (const violation of results.violations) {
        failed = true;
        console.error(JSON.stringify({ route, rule: violation.id, impact: violation.impact,
          nodes: violation.nodes.map(n => ({ target: n.target, summary: n.failureSummary, checks: n.any.map(c => c.data) })) }));
      }
      for (const item of results.incomplete) {
        console.warn("INCONCLUSIVE " + JSON.stringify({ route, rule: item.id,
          nodes: item.nodes.map(n => ({ target: n.target, reason: n.any.map(c => c.data && c.data.messageKey) })) }));
      }
    }
  } finally {
    await browser.close();
  }
  console.log("Accessibility: " + (failed ? "FAILED" : "no confirmed violations") + "; " + incompleteCount + " inconclusive nodes require review");
  if (failed) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
