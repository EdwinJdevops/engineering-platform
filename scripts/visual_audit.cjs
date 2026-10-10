const { chromium } = require("playwright");
const fs = require("node:fs");
(async () => {
  const browser = await chromium.launch({ headless: true });
  fs.mkdirSync("visual-audit", { recursive: true });
  const routes = ["/", "/portfolio/", "/projects/driftguard/", "/services/", "/contact/"];
  const widths = [{ name: "small-mobile", width: 320, height: 740 }, { name: "mobile", width: 390, height: 844 }, { name: "tablet", width: 768, height: 1024 }, { name: "desktop", width: 1440, height: 900 }];
  const failures = [];
  for (const size of widths) {
    const page = await browser.newPage({ viewport: { width: size.width, height: size.height }, deviceScaleFactor: 1, reducedMotion: "reduce" });
    for (const route of routes) {
      const response = await page.goto("http://127.0.0.1:4173" + route, { waitUntil: "networkidle" });
      const key = (route === "/" ? "home" : route.split("/").filter(Boolean).join("-"));
      await page.screenshot({ path: "visual-audit/" + size.name + "-" + key + ".png", fullPage: true });
      const overflow = await page.evaluate(() => ({ viewport: document.documentElement.clientWidth, document: document.documentElement.scrollWidth }));
      if (!response || response.status() !== 200) failures.push(size.name + " " + route + " HTTP " + (response && response.status()));
      if (overflow.document > overflow.viewport + 2) failures.push(size.name + " " + route + " horizontal overflow " + JSON.stringify(overflow));
      if (route === "/") {
        const scene = page.locator(".infra-stack");
        if (!(await scene.isVisible())) failures.push(size.name + " homepage 3D scene missing");
        const animation = await scene.evaluate(el => getComputedStyle(el).transform);
        if (animation === "none") failures.push(size.name + " homepage 3D transform missing");
      }
    }
    const navPage = await page.goto("http://127.0.0.1:4173/", { waitUntil: "networkidle" });
    if (!navPage || navPage.status() !== 200) failures.push(size.name + " navigation smoke HTTP failure");
    const navAudit = await page.locator(".site-header nav a").evaluateAll(links => links.map(link => {
      const rect = link.getBoundingClientRect();
      const style = getComputedStyle(link);
      return { label: link.textContent.trim(), height: rect.height, width: rect.width, visible: style.display !== "none" && style.visibility !== "hidden" };
    }));
    for (const link of navAudit) {
      if (!link.visible || link.height < 43) failures.push(size.name + " navigation target " + JSON.stringify(link));
    }
    await page.close();
  }
  await browser.close();
  fs.writeFileSync("visual-audit/results.json", JSON.stringify({ failures, routes, widths }, null, 2));
  if (failures.length) { console.error(failures.join("\n")); process.exit(1); }
  console.log("Visual audit passed: 20 route/viewport combinations; screenshots uploaded as artifact.");
})().catch(err => { console.error(err); process.exit(1); });
