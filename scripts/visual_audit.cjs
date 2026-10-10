/* Browser-level release gate: responsive layout, navigation, reduced motion, and WebGL fallback. */
const { chromium } = require("playwright");
const fs = require("node:fs");

(async () => {
  const browser = await chromium.launch({ headless: true });
  fs.mkdirSync("visual-audit", { recursive: true });
  const routes = ["/", "/portfolio/", "/projects/driftguard/", "/services/", "/contact/"];
  const widths = [
    { name:"small-mobile", width:320, height:720 },
    { name:"mobile", width:390, height:844 },
    { name:"tablet", width:768, height:1024 },
    { name:"desktop", width:1440, height:900 }
  ];
  const failures = [], observations = [];
  const assetBudgets = [
    { path:"public/css/main.css", maximum:64000 },
    { path:"public/js/infrastructure-scene.js", maximum:8000 },
    { path:"public/js/infrastructure-webgl.js", maximum:16000 }
  ];
  for (const asset of assetBudgets) {
    const bytes = fs.statSync(asset.path).size;
    observations.push({ asset:asset.path,bytes,budget:asset.maximum });
    if (bytes > asset.maximum)
      failures.push("Asset budget exceeded: "+asset.path+" "+bytes+" > "+asset.maximum);
  }
  for (const size of widths) {
    const page = await browser.newPage({
      viewport:{ width:size.width,height:size.height },
      deviceScaleFactor:1,reducedMotion:"reduce"
    });
    page.on("pageerror",error => failures.push(size.name + " JS exception: " + error.message));
    for (const route of routes) {
      const response = await page.goto("http://127.0.0.1:4173" + route, { waitUntil:"networkidle" });
      const key = route === "/" ? "home" : route.split("/").filter(Boolean).join("-");
      if (!response || response.status() !== 200) failures.push(size.name+" "+route+" HTTP "+(response && response.status()));
      const overflow = await page.evaluate(() => ({
        viewport:document.documentElement.clientWidth,
        document:document.documentElement.scrollWidth
      }));
      if (overflow.document > overflow.viewport+2) failures.push(size.name+" "+route+" horizontal overflow "+JSON.stringify(overflow));
      const menu = page.locator(".mobile-nav");
      if (size.width <= 760) {
        if (!(await menu.locator("summary").isVisible())) failures.push(size.name+" "+route+" mobile menu toggle hidden");
        await menu.locator("summary").click();
        if (!(await menu.locator("nav a").first().isVisible())) failures.push(size.name+" "+route+" menu did not open");
        await page.screenshot({ path:"visual-audit/"+size.name+"-"+key+"-menu.png",fullPage:false });
        await menu.locator("summary").click();
        if (await menu.getAttribute("open") !== null) failures.push(size.name+" "+route+" menu did not close");
        if (route === "/") {
          await menu.locator("summary").focus();
          await page.keyboard.press("Enter");
          if (await menu.getAttribute("open") === null) failures.push(size.name+" keyboard did not open menu");
          await page.keyboard.press("Enter");
          if (await menu.getAttribute("open") !== null) failures.push(size.name+" keyboard did not close menu");
        }
      } else if (!(await page.locator(".desktop-nav").isVisible())) {
        failures.push(size.name+" "+route+" desktop navigation hidden");
      }
      if (route === "/") {
        const stack = page.locator(".infra-stack");
        if (!(await stack.isVisible())) failures.push(size.name+" homepage CSS 3D fallback missing");
        if (await stack.evaluate(el => getComputedStyle(el).transform) === "none")
          failures.push(size.name+" homepage fallback 3D transform missing");
        if (await page.locator(".infra-scene").evaluate(el => el.classList.contains("webgl-ready")))
          failures.push(size.name+" reduced-motion preference incorrectly enabled WebGL");
      }
      await page.screenshot({ path:"visual-audit/"+size.name+"-"+key+".png",fullPage:true });
      observations.push({ size:size.name,route,overflow });
    }
    await page.close();
  }

  const page = await browser.newPage({
    viewport:{ width:1440,height:900 },deviceScaleFactor:1,reducedMotion:"no-preference"
  });
  page.on("pageerror",error => failures.push("desktop motion JS exception: "+error.message));
  await page.goto("http://127.0.0.1:4173/",{waitUntil:"networkidle"});
  const scene = page.locator("[data-infra-scene]");
  const before = await scene.evaluate(el => Number.parseFloat(el.style.getPropertyValue("--scene-progress")));
  await page.evaluate(() => window.scrollTo(0,500));
  await page.waitForTimeout(120);
  const after = await scene.evaluate(el => Number.parseFloat(el.style.getPropertyValue("--scene-progress")));
  if (!Number.isFinite(before) || !Number.isFinite(after) || after <= before)
    failures.push("desktop scroll progress not updating: "+before+" -> "+after);
  await page.evaluate(() => window.scrollTo(0,0));
  await page.waitForTimeout(150);
  const renderMode = await scene.getAttribute("data-render-mode") || "css-fallback";
  observations.push({ size:"desktop-motion",route:"/",renderMode,progressBefore:before,progressAfter:after });
  if (renderMode === "webgl" && !(await page.locator(".infra-webgl").isVisible()))
    failures.push("WebGL mode reports active but canvas is hidden");
  await page.screenshot({path:"visual-audit/desktop-motion-home.png",fullPage:true});
  await page.close();
  await browser.close();
  fs.writeFileSync("visual-audit/results.json",JSON.stringify({ failures,observations,routes,widths },null,2));
  if (failures.length) { console.error(failures.join("\n"));process.exit(1); }
  console.log("Visual audit passed: 20 routes/viewports, keyboard navigation, asset budgets, reduced-motion fallback, and scroll state.");
})().catch(error => { console.error(error);process.exit(1); });
